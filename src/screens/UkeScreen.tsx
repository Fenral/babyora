/**
 * UkeScreen — F65 forenkling, F80c PORT til Morgennatt-design.
 *
 * Endringer fra forrige iter:
 *  - Dropper hero-sone (sticky avatar-img + sticky indikator-chip + temp/mood)
 *  - Dropper avatar tier-mapping per rad + crossfade-effekter
 *  - Dropper IntersectionObserver + activeIdx + row-highlight (rader blir flate)
 *  - Dropper WeatherSparkline-bruk i alle rader
 *  - Dropper lag-display-seksjonen (krevde aktiv rad — uten activeIdx gir det ikke mening)
 *
 * Beholder:
 *  - Topbar (sted-pille + varsler-knapp)
 *  - Tabs (I dag / 10 dager)
 *  - RefHourPicker (global klokkeslett)
 *  - vognMode-toggle (conditional når activity === 'vogn')
 *  - Time-/dag-rader: klokkeslett + vær-ikon + temp + plagg-band
 *  - recommend() per rad for plagg-band
 *  - Primary CTA (navigerer til hjem)
 *  - useWeather, useChildren, useRefHour
 *
 * F80c (2026-07-02): visuell port til Morgennatt — KUN tokens/farger, ingen
 * funksjonsendring. Se docs/F80/a11y-preclearance.md §2 (temp-canvas) og
 * HjemScreen.tsx for det portede data-temp-mønsteret (tempAxisFor-terskler
 * kald<5/varm>18). Uke er Sone 1: data-temp settes på skjerm-roten fra
 * dagens feels-like (weather.now), samme .ba-temp-root-transition-klasse
 * som Hjem (transition scoped via CSS, RM → instant snap).
 */
import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { useChildren } from '../state/children-store';
import { useWeather } from '../hooks/useWeather';
import { useHapticSystem } from '../lib/haptics/system';
import { useNativeSettings } from '../hooks/useNativeSettings';
import { Skeleton } from '../components/Skeleton';
import { useSwapOverride } from '../state/swap-override-store';
import { recommend } from '../lib/wool-layers/recommend';
import type { Recommendation } from '../lib/wool-layers/types';
import { dobToAgeMonths } from '../lib/utils/dob-to-age-months';
import type {
  WeatherDayAtHour,
  WeatherHourly,
} from '../lib/met-no/types';
import type { TabKey } from '../types/nav';
import { useAccess } from '../lib/premium/use-access';
import { shouldShowTenDayTeaser } from '../lib/premium/gating';
import { PaywallDialog } from '../components/PaywallDialog';

// Elverum (default ved ingen aktiv barn-lokasjon)
const DEFAULT_LAT = 60.8867;
const DEFAULT_LON = 11.5614;

type ViewTab = 'today' | 'tenday';
type Activity = 'utelek' | 'vogn';
type VognMode = 'awake' | 'sleeping';

type BurdenBand = {
  count: number;
  color: string;
  label: 'Lett' | 'Middels' | 'Mye på';
};

// Morgennatt-tokens (F80c port) — bruker KUN CSS-vars fra design-tokens.css
// så dark-mode + temp-akse auto-flipper. Ingen nye hex.
const TOKENS = {
  warmGrey: 'var(--bg-canvas)',
  warmGrey2: 'var(--bg-canvas-warm)',
  warmGrey3: 'var(--ink-200)',
  ink900: 'var(--ink-900)',
  ink700: 'var(--ink-700)',
  ink500: 'var(--ink-500)',
  ink300: 'var(--ink-300)',
  ink100: 'var(--ink-100)',
  surface: 'var(--surface)',
  surfaceSoft: 'var(--surface-soft)',
  surfacePure: 'var(--surface-pure)',
  surfaceElevated: 'var(--surface-elevated, var(--surface-pure))',
  orange: 'var(--accent-cta)',
  orange600: 'var(--accent-cta)',
  // Plagg-byrde-bånd: 3 tiers mappet til Morgennatt lag-/status-familien
  // (Lett=ok-grønn, Middels=marigold/oker, Mye på=dyp petrol — samme
  // rekkefølge/intensitet som før, ingen nye hex).
  green: 'var(--status-ok)',
  amber: 'var(--lag-marigold)',
  navy: 'var(--layer-ytterst)',
  fontSerif: 'var(--font-display, var(--font-serif))',
  fontSans: 'var(--font-sans)',
  easeOut: 'var(--ease-out)',
  shadow1: 'var(--shadow-1)',
  shadowElevated: 'var(--shadow-elevated, 0 4px 16px rgba(0,0,0,0.08))',
  shadowCta: 'var(--shadow-cta-primary)',
} as const;

// ──────────────── små helpers ────────────────

// F80c: Uke er Sone 1 — data-temp følger samme terskler/mønster som
// HjemScreen.tempAxisFor (kald<5, varm>18, ellers mild). Ikke delt via
// import (tempAxisFor er privat i HjemScreen.tsx) — replikert lokalt med
// identisk logikk per port-kontrakten (a11y-preclearance.md §2).
type TempAxis = 'kald' | 'mild' | 'varm';
const TEMP_AXIS_COLD_MAX = 5;
const TEMP_AXIS_WARM_MIN = 18;

function tempAxisFor(feelsLikeC: number | undefined | null, tempC: number | undefined | null): TempAxis {
  const t = feelsLikeC ?? tempC;
  if (t === undefined || t === null || Number.isNaN(t)) return 'mild';
  if (t < TEMP_AXIS_COLD_MAX) return 'kald';
  if (t > TEMP_AXIS_WARM_MIN) return 'varm';
  return 'mild';
}

function timeOfDayLabel(hour: number): string {
  if (hour >= 5 && hour < 10) return 'morgen';
  if (hour >= 10 && hour < 17) return 'dag';
  if (hour >= 17 && hour < 22) return 'kveld';
  return 'natt';
}

function bandForCount(count: number): BurdenBand {
  if (count <= 2) return { count, color: TOKENS.green, label: 'Lett' };
  if (count <= 3) return { count, color: TOKENS.amber, label: 'Middels' };
  return { count, color: TOKENS.navy, label: 'Mye på' };
}

/** Velg fra hourly den entry hvis hour-of-day er nærmest target. */
function pickHourly(
  hourly: WeatherHourly[],
  targetHour: number,
): WeatherHourly | null {
  if (hourly.length === 0) return null;
  let best: WeatherHourly = hourly[0]!;
  let bestDelta = 24;
  for (const h of hourly) {
    const hh = h.time.getHours();
    const delta = Math.abs(hh - targetHour);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = h;
    }
    if (delta === 0) break;
  }
  return best;
}

function conditionLabel(symbolCode: string): string {
  const c = (symbolCode || '').toLowerCase();
  if (c.includes('clear')) return 'Klarvær';
  if (c.includes('fair')) return 'Lettskyet';
  if (c.includes('partly')) return 'Delvis skyet';
  if (c.includes('cloud')) return 'Skyet';
  if (c.includes('fog')) return 'Tåke';
  if (c.includes('snow')) return 'Snø';
  if (c.includes('sleet')) return 'Sludd';
  if (c.includes('rain')) return 'Regn';
  if (c.includes('thunder')) return 'Torden';
  return 'Vær';
}

const DAY_NAMES = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];

function formatDayShort(date: Date, isToday: boolean): string {
  if (isToday) return 'I dag';
  const dayName = (DAY_NAMES[date.getDay()] ?? '').slice(0, 3);
  const day = date.getDate();
  return `${dayName} ${day}.`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ──────────────── WeatherIcon ────────────────

/**
 * F80c: ink-nøytral vær-ikon — droppet hue-kodede fills (gul sol / blå sky)
 * til fordel for currentColor/var(--ink-500), samme prinsipp som Hjems
 * WeatherFallbackIcon (canvas/temp-akse bærer temperatur-signalet, ikke
 * ikonet). Formen (sol/sky/regn) beholdes, kun fargen er nøytralisert.
 */
function WeatherIcon({ symbolCode, size = 28 }: { symbolCode: string; size?: number }) {
  const code = (symbolCode || '').toLowerCase();
  const hasSun = code.includes('clear') || code.includes('fair') || code.includes('partly');
  const hasRain = code.includes('rain') || code.includes('sleet') || code.includes('snow');
  const hasCloud =
    !code.includes('clear') ||
    code.includes('cloud') ||
    code.includes('rain') ||
    code.includes('snow') ||
    code.includes('fog');

  if (hasSun && hasCloud) {
    return (
      <svg
        width={size}
        height={size * 0.71}
        viewBox="0 0 34 24"
        fill="none"
        aria-hidden="true"
        color="var(--ink-500)"
      >
        <circle cx={13} cy={9} r={5} fill="currentColor" opacity={0.85} />
        <path
          d="M11 20h13a5 5 0 0 0 .5-10 6.8 6.8 0 0 0-13 1A4.3 4.3 0 0 0 11 20z"
          fill="currentColor"
          opacity={0.4}
        />
      </svg>
    );
  }
  if (hasSun) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        color="var(--ink-500)"
      >
        <circle cx={12} cy={12} r={5} fill="currentColor" opacity={0.85} />
        <g stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" opacity={0.85}>
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M19.5 4.5l-2 2M6.5 17.5l-2 2" />
        </g>
      </svg>
    );
  }
  if (hasRain) {
    return (
      <svg
        width={size}
        height={size * 0.79}
        viewBox="0 0 34 27"
        fill="none"
        aria-hidden="true"
        color="var(--ink-500)"
      >
        <path
          d="M9 17h14a5.5 5.5 0 0 0 .6-11 7.5 7.5 0 0 0-14.3 1.2A4.8 4.8 0 0 0 9 17z"
          fill="currentColor"
          opacity={0.4}
        />
        <g stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" opacity={0.85}>
          <path d="M12 20l-1.2 4M17 20l-1.2 4M22 20l-1.2 4" />
        </g>
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size * 0.69}
      viewBox="0 0 32 22"
      fill="none"
      aria-hidden="true"
      color="var(--ink-500)"
    >
      <path
        d="M9 18h14a5.5 5.5 0 0 0 .6-11 7.5 7.5 0 0 0-14.3 1.2A4.8 4.8 0 0 0 9 18z"
        fill="currentColor"
        opacity={0.4}
      />
    </svg>
  );
}

// ──────────────── phase-type ────────────────

/**
 * Én fase = en rad i listen. Identisk struktur for begge tabs; bare
 * date-felt og hour varierer.
 */
type Phase = {
  /** Klokkeslett (0-23) — for "I dag" varierer, for "10 dager" = refHour */
  hour: number;
  /** Dato fasen representerer */
  date: Date;
  /** True hvis denne fasen er dagens dato */
  isToday: boolean;
  /** Temperatur (°C) */
  tempC: number | null;
  /** Plagg-byrde-bånd for fasen */
  band: BurdenBand;
  /** Vær-symbol */
  symbolCode: string;
  /** Full recommendation for fasen — brukt av band-count. */
  recommendation: Recommendation | null;
};

type Props = {
  onNavigate: (tab: TabKey) => void;
  onOpenSheet: () => void;
};

/** Fast referansetime for prognoser når brukeren ikke kan velge. F67: 12:00. */
const FALLBACK_REF_HOUR = 12;

// ──────────────── selve komponenten ────────────────

export function UkeScreen({ onNavigate, onOpenSheet }: Props) {
  const { active } = useChildren();
  const { reducedMotion } = useNativeSettings();
  const { fire } = useHapticSystem();
  const refHour = FALLBACK_REF_HOUR;
  const swaps = useSwapOverride((s) => s.swaps);

  const lat = active?.lat || DEFAULT_LAT;
  const lon = active?.lon || DEFAULT_LON;
  const city = active?.city || 'Elverum';
  const childName = active?.name || 'barnet';

  const weather = useWeather(lat, lon, refHour);
  const [tab, setTab] = useState<ViewTab>('today');
  // Intern aktivitets-state (default 'utelek' — bevarer eksisterende oppførsel).
  const [activity] = useState<Activity>('utelek');
  const [vognMode, setVognMode] = useState<VognMode>('awake');

  // F81.5-W2 (Flate 1): «10 dager»-tab («Uke»-tab i denne fila, se
  // ViewTab='tenday') er en Babyora Pluss-funksjon. Modell (b): tab-en er
  // fortsatt valgbar (aria-pressed settes normalt, viser faktisk teaser-
  // innhold) — kun antrekks-/lag-delen av hver rad er gatet.
  const { isPremium } = useAccess();
  const tenDayCtaRef = useRef<HTMLButtonElement | null>(null);
  const [tenDayPaywallOpen, setTenDayPaywallOpen] = useState(false);
  // Fanget i klikk-handleren (aldri under render — react-hooks/refs) og gitt
  // videre som PaywallDialog sin returnFocusTo (samme mønster som
  // InnstillingerScreen.tsx sin paywallReturnFocusTo).
  const [tenDayPaywallReturnFocusTo, setTenDayPaywallReturnFocusTo] =
    useState<HTMLElement | null>(null);

  const handleOpenTenDayPaywall = () => {
    void fire('light');
    setTenDayPaywallReturnFocusTo(tenDayCtaRef.current);
    setTenDayPaywallOpen(true);
  };

  const ageMonths = useMemo(
    () => (active?.dob ? dobToAgeMonths(active.dob) : 12),
    [active?.dob],
  );

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // PHASES — felles arkitektur for begge tabs.
  // "I dag": 4 faser sentrert på refHour (-6h/-2h/+2h/+6h, clamped 0-23)
  // "10 dager": 10 faser, én per dag, hver på refHour
  // ─────────────────────────────────────────────────────────────────

  /** I dag-tab: 4 tids-slots rundt refHour (clamped). */
  const todayHourSlots = useMemo<number[]>(() => {
    const offsets = [-6, -2, 2, 6];
    const slots = offsets
      .map((d) => Math.min(23, Math.max(0, refHour + d)))
      .filter((h, i, arr) => arr.indexOf(h) === i)
      .sort((a, b) => a - b);
    return slots;
  }, [refHour]);

  /** Bygg phase-array for aktiv tab. */
  const phases = useMemo<Phase[]>(() => {
    if (weather.status !== 'ready') return [];

    if (tab === 'today') {
      if (weather.hourly.length === 0) return [];
      return todayHourSlots.map((hour) => {
        const point = pickHourly(weather.hourly, hour);
        if (!point) {
          return {
            hour,
            date: today,
            isToday: true,
            tempC: null,
            band: bandForCount(0),
            symbolCode: 'cloudy',
            recommendation: null,
          };
        }
        const rec = recommend({
          weather: {
            tempC: point.tempC,
            feelsLikeC: point.feelsLikeC,
            windMs: point.windMs,
            precipMmH: point.precipMmH,
            symbolCode: point.symbolCode,
          },
          child: { ageMonths },
          activity,
          ...(activity === 'vogn' ? { vognMode } : {}),
        });
        const total = rec.layers.reduce((sum, l) => sum + l.items.length, 0);
        return {
          hour,
          date: today,
          isToday: true,
          tempC: Math.round(point.tempC),
          band: bandForCount(total),
          symbolCode: point.symbolCode,
          recommendation: rec,
        };
      });
    }

    // "10 dager"
    if (weather.dailyAtHour.length === 0) return [];
    return weather.dailyAtHour.slice(0, 10).map((day: WeatherDayAtHour) => {
      const dayIsToday = isSameDay(day.date, today);
      const rec = recommend({
        weather: {
          tempC: day.tempC,
          feelsLikeC: day.feelsLikeC,
          windMs: day.windMs,
          precipMmH: day.precipMmH,
          symbolCode: day.symbolCode,
        },
        child: { ageMonths },
        activity,
        ...(activity === 'vogn' ? { vognMode } : {}),
      });
      const total = rec.layers.reduce((sum, l) => sum + l.items.length, 0);
      return {
        hour: day.refHour,
        date: day.date,
        isToday: dayIsToday,
        tempC: Math.round(day.tempC),
        band: bandForCount(total),
        symbolCode: day.symbolCode,
        recommendation: rec,
      };
    });
  }, [tab, weather.status, weather.hourly, weather.dailyAtHour, todayHourSlots, ageMonths, today, activity, vognMode]);

  /**
   * Swap-resolved phases: hver fase får layers byttet ut basert på
   * swap-store. Band-count re-beregnes så pill-count oppdateres.
   */
  const resolvedPhases = useMemo<Phase[]>(() => {
    const hasSwaps = Object.keys(swaps).length > 0;
    if (!hasSwaps) return phases;
    return phases.map((p) => {
      if (!p.recommendation) return p;
      const swappedRec: Recommendation = {
        ...p.recommendation,
        layers: p.recommendation.layers.map((l) => ({
          ...l,
          items: l.items.map((item) => swaps[item] ?? item),
        })),
      };
      const total = swappedRec.layers.reduce((sum, l) => sum + l.items.length, 0);
      return {
        ...p,
        recommendation: swappedRec,
        band: bandForCount(total),
      };
    });
  }, [phases, swaps]);

  const isLoading = weather.status === 'loading';
  const isError = weather.status === 'error';

  // F81.5-W2 (Flate 1): teaser-modus for 10-dagers-tab, ikke-Premium.
  const showTenDayTeaser = shouldShowTenDayTeaser(tab, isPremium);

  // F80c: Sone 1 — data-temp fra dagens feels-like (weather.now), samme
  // kilde/terskler som HjemScreen. Faller tilbake til 'mild' mens weather
  // laster (tempAxisFor håndterer null/undefined trygt).
  const tempAxis = tempAxisFor(weather.now?.feelsLikeC, weather.now?.tempC);

  // ──────────────── styles ────────────────

  const shellStyle: CSSProperties = {
    minHeight: '100dvh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: TOKENS.warmGrey,
    fontFamily: TOKENS.fontSans,
    color: TOKENS.ink900,
    fontFeatureSettings: "'ss01', 'cv11'",
    WebkitFontSmoothing: 'antialiased',
  };

  const screenStyle: CSSProperties = {
    position: 'relative',
    flex: 1,
    minHeight: 0,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    paddingTop: 'max(54px, env(safe-area-inset-top, 54px))',
    background: TOKENS.warmGrey,
  };

  const topBarStyle: CSSProperties = {
    padding: '0 22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flex: 'none',
  };

  const cityPillStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '9px 14px 9px 12px',
    borderRadius: 14,
    background: TOKENS.surface,
    border: `1px solid ${TOKENS.ink100}`,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    cursor: 'pointer',
    color: TOKENS.ink900,
    fontFamily: TOKENS.fontSans,
    transition: reducedMotion ? 'none' : `transform 160ms ${TOKENS.easeOut}`,
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  };

  const cityDotStyle: CSSProperties = {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: TOKENS.orange,
    // F80c: var-drevet tint (var(--accent-cta) er Granmynte-grønn i
    // Morgennatt, ikke legacy warm-orange) — samme color-mix-mønster som
    // HjemScreen sin avatar-glow-skygge.
    boxShadow: '0 0 0 3px color-mix(in srgb, var(--accent-cta) 18%, transparent)',
  };

  const cityNameStyle: CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 600,
    letterSpacing: '-0.1px',
    color: TOKENS.ink900,
  };

  const iconBtnStyle: CSSProperties = {
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    borderRadius: '50%',
    background: TOKENS.surface,
    border: `1px solid ${TOKENS.ink100}`,
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
    color: TOKENS.ink900,
    padding: 0,
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    transition: reducedMotion
      ? 'none'
      : `transform 160ms ${TOKENS.easeOut}, background 160ms ${TOKENS.easeOut}`,
  };

  const tabsWrapStyle: CSSProperties = {
    margin: '18px 22px 0',
    padding: 5,
    display: 'flex',
    gap: 4,
    borderRadius: 999,
    background: TOKENS.surfaceSoft,
    border: `1px solid ${TOKENS.ink100}`,
    flex: 'none',
  };

  const tabButtonStyle = (isActive: boolean): CSSProperties => ({
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    border: 'none',
    background: isActive ? TOKENS.surfacePure : 'transparent',
    cursor: 'pointer',
    fontFamily: TOKENS.fontSans,
    fontSize: '0.9375rem',
    fontWeight: isActive ? 700 : 600,
    color: isActive ? TOKENS.ink900 : TOKENS.ink500,
    boxShadow: isActive ? TOKENS.shadow1 : 'none',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    transition: reducedMotion
      ? 'none'
      : `background 200ms ${TOKENS.easeOut}, color 200ms ${TOKENS.easeOut}`,
  });

  // F81.5-W2 (Flate 1): synlig "Pluss"-chip på 10-dagers-tabben for
  // ikke-Premium — aria-hidden, meningen ligger i tab-knappens aria-label.
  const tabPlussChipStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    marginLeft: 6,
    padding: '1px 6px',
    borderRadius: 999,
    fontSize: '0.5625rem',
    fontWeight: 700,
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
    color: 'var(--accent-cta-ink)',
    background: 'var(--accent-cta)',
    verticalAlign: 'middle',
  };

  // ─── Vogn-modus segment-pill (vises BARE når activity === 'vogn') ────────
  const vognModeWrapStyle: CSSProperties = {
    margin: '8px 22px 0',
    padding: 3,
    display: 'inline-flex',
    alignSelf: 'center',
    gap: 4,
    borderRadius: 999,
    background: TOKENS.surfaceSoft,
    border: `1px solid ${TOKENS.ink100}`,
    flex: 'none',
    minHeight: 36,
  };

  const vognModeBtnStyle = (selected: boolean): CSSProperties => ({
    minHeight: 44,
    minWidth: 86,
    padding: '6px 16px',
    borderRadius: 999,
    border: 'none',
    background: selected ? TOKENS.surfacePure : 'transparent',
    cursor: 'pointer',
    fontFamily: TOKENS.fontSans,
    fontSize: '0.8125rem',
    fontWeight: selected ? 700 : 600,
    color: selected ? TOKENS.ink900 : TOKENS.ink500,
    boxShadow: selected ? TOKENS.shadow1 : 'none',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    transition: 'none',
  });

  // ─── row-list ───
  const groupCardStyle: CSSProperties = {
    margin: '14px 22px 0',
    background: TOKENS.warmGrey2,
    borderRadius: 22,
    border: `1px solid ${TOKENS.ink100}`,
    overflow: 'hidden',
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  };

  const groupHeadStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px 10px',
    borderBottom: `1px solid ${TOKENS.warmGrey3}`,
    flex: 'none',
  };

  const groupHeadTitleStyle: CSSProperties = {
    margin: 0,
    fontFamily: TOKENS.fontSans,
    fontSize: '0.78125rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: TOKENS.ink500,
  };

  const groupHeadMetaStyle: CSSProperties = {
    fontSize: '0.75rem',
    color: TOKENS.ink300,
    fontWeight: 500,
  };

  // F81.5-W2 (Flate 1): ETT samlet låst-parti-kort for 10-dagers-teaser.
  const tenDayTeaserCardStyle: CSSProperties = {
    margin: '12px 14px 4px',
    padding: '14px 16px',
    borderRadius: 16,
    background: TOKENS.surface,
    border: `1px solid ${TOKENS.ink100}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
    flex: 'none',
  };

  const tenDayTeaserTextStyle: CSSProperties = {
    margin: 0,
    fontSize: '0.875rem',
    fontWeight: 600,
    color: TOKENS.ink900,
    lineHeight: 1.35,
  };

  const tenDayTeaserBtnStyle: CSSProperties = {
    minHeight: 44,
    padding: '10px 18px',
    borderRadius: 999,
    border: 'none',
    background: TOKENS.orange,
    color: 'var(--accent-cta-ink)',
    fontFamily: TOKENS.fontSans,
    fontSize: '0.875rem',
    fontWeight: 700,
    letterSpacing: '-0.05px',
    cursor: 'pointer',
    boxShadow: TOKENS.shadowCta,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  };

  const rowsListStyle: CSSProperties = {
    listStyle: 'none',
    padding: '6px 0',
    margin: 0,
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overscrollBehaviorY: 'contain',
    WebkitOverflowScrolling: 'touch',
  };

  /** Flat rad — ingen activeIdx-highlight. */
  const rowStyle = (isLast: boolean): CSSProperties => ({
    display: 'grid',
    gridTemplateColumns: tab === 'today'
      ? '64px 36px minmax(0, 1fr) auto'
      : '92px 36px minmax(0, 1fr) auto',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    margin: '4px 10px',
    minHeight: 60,
    borderBottom: 'none',
    borderRadius: 16,
    position: 'relative',
    background: 'transparent',
    border: '1px solid transparent',
    marginBottom: isLast ? 14 : 4,
  });

  /** F67: rad-knapp innen <li> — full-bredde, transparent, åpner påkledning-sheet. */
  const rowButtonStyle = (isLast: boolean): CSSProperties => ({
    ...rowStyle(isLast),
    cursor: 'pointer',
    width: 'calc(100% - 20px)',
    font: 'inherit',
    color: 'inherit',
    textAlign: 'left',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    transition: reducedMotion
      ? 'none'
      : `background 160ms ${TOKENS.easeOut}, border-color 160ms ${TOKENS.easeOut}`,
  });

  const rowTimeColStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.1,
  };

  const rowTimeBigStyle: CSSProperties = {
    fontSize: '0.9375rem',
    fontWeight: 700,
    color: TOKENS.ink900,
    letterSpacing: '-0.2px',
    fontVariantNumeric: 'tabular-nums',
  };

  const rowTimeSubStyle: CSSProperties = {
    marginTop: 2,
    fontSize: '0.71875rem',
    fontWeight: 500,
    color: TOKENS.ink300,
  };

  const rowIconStyle: CSSProperties = {
    width: 36,
    height: 36,
    display: 'grid',
    placeItems: 'center',
  };

  const rowTempWrapStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    minWidth: 0,
  };

  const rowTempStyle: CSSProperties = {
    fontFamily: TOKENS.fontSerif,
    fontSize: '1.375rem',
    lineHeight: 1,
    color: TOKENS.ink900,
    fontVariantNumeric: 'tabular-nums',
  };

  const bandPillStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px 6px 6px',
    borderRadius: 999,
    background: TOKENS.surface,
    border: `1px solid ${TOKENS.ink100}`,
  };

  const bandPipStyle = (bg: string): CSSProperties => ({
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: bg,
    color: '#fff',
    fontSize: '0.71875rem',
    fontWeight: 700,
    display: 'grid',
    placeItems: 'center',
    fontVariantNumeric: 'tabular-nums',
  });

  const bandLabelStyle: CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: TOKENS.ink700,
    letterSpacing: '-0.1px',
  };

  const ctaWrapStyle: CSSProperties = {
    margin: '16px 22px 14px',
    flex: 'none',
  };

  const ctaStyle: CSSProperties = {
    width: '100%',
    minHeight: 54,
    borderRadius: 18,
    border: 'none',
    cursor: 'pointer',
    background: TOKENS.orange,
    color: 'var(--accent-cta-ink)',
    fontFamily: TOKENS.fontSans,
    fontSize: '1rem',
    fontWeight: 700,
    letterSpacing: '-0.1px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    boxShadow: TOKENS.shadowCta,
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    transition: reducedMotion
      ? 'none'
      : `transform 160ms ${TOKENS.easeOut}, background 160ms ${TOKENS.easeOut}`,
  };

  const emptyStateStyle: CSSProperties = {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 22px',
    color: TOKENS.ink500,
    fontSize: '0.875rem',
    fontWeight: 500,
    textAlign: 'center',
  };

  const srOnlyStyle: CSSProperties = {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    whiteSpace: 'nowrap',
    border: 0,
  };

  // ─── event-handlers ───
  const onTabClick = (next: ViewTab) => {
    if (next === tab) return;
    setTab(next);
    void fire('selection');
  };

  const onVognModeClick = (next: VognMode) => {
    if (next === vognMode) return;
    setVognMode(next);
    void fire('selection');
  };

  const onCtaClick = () => {
    void fire('medium');
    onNavigate('hjem');
  };

  // ─── header-data ───
  const nowSymbol = weather.now?.symbolCode ?? phases[0]?.symbolCode ?? 'fair';
  const nowCond = conditionLabel(nowSymbol);

  return (
    <div style={shellStyle}>
      <main
        style={screenStyle}
        aria-labelledby="uke-heading"
        className="ba-temp-root"
        data-temp={tempAxis}
      >
        <h1 id="uke-heading" style={srOnlyStyle}>
          Uke — time-for-time prognose med påkledning
        </h1>

        {/* Top-bar */}
        <div style={topBarStyle}>
          <button
            type="button"
            style={cityPillStyle}
            aria-label={`Bytt sted, valgt: ${city}`}
            onClick={() => void fire('selection')}
          >
            <span style={cityDotStyle} aria-hidden="true" />
            <span style={cityNameStyle}>{city}</span>
            <svg
              width={12}
              height={12}
              viewBox="0 0 24 24"
              fill="none"
              stroke={TOKENS.ink500}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Varsler"
            style={iconBtnStyle}
            onClick={() => void fire('light')}
          >
            <svg
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <nav style={tabsWrapStyle} aria-label="Visning">
          <button
            type="button"
            style={tabButtonStyle(tab === 'today')}
            onClick={() => onTabClick('today')}
            aria-pressed={tab === 'today'}
          >
            I dag
          </button>
          <button
            type="button"
            style={tabButtonStyle(tab === 'tenday')}
            onClick={() => onTabClick('tenday')}
            aria-pressed={tab === 'tenday'}
            aria-label={isPremium ? 'Uke' : '10 dager, krever Babyora Pluss'}
          >
            Uke
            {!isPremium && (
              <span aria-hidden="true" style={tabPlussChipStyle}>Pluss</span>
            )}
          </button>
        </nav>

        {/* Vogn-modus mini-segment — KUN når activity === 'vogn'. */}
        {activity === 'vogn' && (
          <div
            role="group"
            aria-label="Vogn-modus"
            style={vognModeWrapStyle}
          >
            <button
              type="button"
              onClick={() => onVognModeClick('awake')}
              aria-pressed={vognMode === 'awake'}
              style={vognModeBtnStyle(vognMode === 'awake')}
            >
              Våkent
            </button>
            <button
              type="button"
              onClick={() => onVognModeClick('sleeping')}
              aria-pressed={vognMode === 'sleeping'}
              style={vognModeBtnStyle(vognMode === 'sleeping')}
            >
              Sover
            </button>
          </div>
        )}

        {/* F67: RefHourPicker droppet — info kommer i rader uansett. */}

        {/* Rad-liste — felles render for begge tabs */}
        {isLoading ? (
          <section
            style={groupCardStyle}
            aria-label="Henter prognose"
            aria-busy="true"
          >
            <div style={groupHeadStyle}>
              <h2 style={groupHeadTitleStyle}>
                {tab === 'today' ? 'Time for time' : '10 dager fremover'}
              </h2>
              <span style={groupHeadMetaStyle}>
                {childName} · {ageMonths} mnd
              </span>
            </div>
            <ul style={rowsListStyle} role="list" aria-hidden="true">
              {[0, 1, 2, 3].map((idx) => (
                <li key={idx} style={rowStyle(idx === 3)}>
                  <div style={rowTimeColStyle}>
                    <Skeleton width={40} height={14} radius={6} ariaLabel="Henter tid" />
                    <span style={{ marginTop: 4 }}>
                      <Skeleton width={28} height={10} radius={5} ariaLabel="Henter dagdel" />
                    </span>
                  </div>
                  <div style={rowIconStyle}>
                    <Skeleton width={28} height={28} radius="50%" ariaLabel="Henter ikon" />
                  </div>
                  <div style={rowTempWrapStyle}>
                    <Skeleton width={36} height={18} radius={6} ariaLabel="Henter temperatur" />
                  </div>
                  <Skeleton width={84} height={32} radius={999} ariaLabel="Henter påkledning" />
                </li>
              ))}
            </ul>
          </section>
        ) : isError ? (
          <div style={emptyStateStyle} role="alert">
            Kunne ikke hente vær akkurat nå.
          </div>
        ) : phases.length === 0 ? (
          <div style={emptyStateStyle}>Ingen prognose tilgjengelig.</div>
        ) : (
          <section
            style={groupCardStyle}
            aria-label={tab === 'today' ? 'Time for time' : '10 dager fremover'}
          >
            <div style={groupHeadStyle}>
              <h2 style={groupHeadTitleStyle}>
                {tab === 'today' ? 'Time for time' : '10 dager fremover'}
              </h2>
              <span style={groupHeadMetaStyle}>
                {childName} · {ageMonths} mnd · kl. {String(refHour).padStart(2, '0')}
              </span>
            </div>

            {/* F81.5-W2 (Flate 1): ETT samlet låst-parti for 10-dagers-tab
                ikke-Premium — erstatter de 10 enkelt-radenes antrekk-/lag-del
                (bandPillStyle nedenfor rendres ikke i det hele tatt for
                gratisbrukere, se map() under). Vær-dataen (dato/ikon/temp)
                forblir synlig OG tilgjengelig for alle. */}
            {showTenDayTeaser && (
              <div style={tenDayTeaserCardStyle}>
                <p style={tenDayTeaserTextStyle}>
                  Se antrekk for alle 10 dagene med Babyora Pluss
                </p>
                <button
                  ref={tenDayCtaRef}
                  type="button"
                  style={tenDayTeaserBtnStyle}
                  onClick={handleOpenTenDayPaywall}
                  aria-haspopup="dialog"
                >
                  Prøv 7 dager gratis
                </button>
              </div>
            )}

            <ul style={rowsListStyle} role="list">
              {resolvedPhases.map((phase, idx) => {
                const isLast = idx === resolvedPhases.length - 1;
                const tempLabel = phase.tempC !== null ? `${phase.tempC}°` : '—';

                const dayTimeCol = (
                  <div style={rowTimeColStyle}>
                    {tab === 'today' ? (
                      <>
                        <span style={rowTimeBigStyle}>
                          {`${String(phase.hour).padStart(2, '0')}:00`}
                        </span>
                        <span style={rowTimeSubStyle}>
                          {timeOfDayLabel(phase.hour)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span style={rowTimeBigStyle}>
                          {formatDayShort(phase.date, phase.isToday)}
                        </span>
                        <span style={rowTimeSubStyle}>
                          kl. {String(phase.hour).padStart(2, '0')}
                        </span>
                      </>
                    )}
                  </div>
                );

                // F81.5-W2: 10-dagers-teaser — dato/ikon/temp er fri værdata og
                // forblir synlig OG tilgjengelig (ingen button, ingen
                // antrekks-/lag-del). Klikk-til-sheet + band-pill droppes helt
                // for gratisbrukere (se ETT samlet låst-parti over).
                if (showTenDayTeaser) {
                  return (
                    <li
                      key={`${tab}-${idx}-${phase.hour}-${phase.date.toISOString().slice(0, 10)}`}
                      style={{ listStyle: 'none' }}
                    >
                      <div style={rowStyle(isLast)}>
                        {dayTimeCol}
                        <div style={rowIconStyle} aria-label={conditionLabel(phase.symbolCode)}>
                          <WeatherIcon symbolCode={phase.symbolCode} size={28} />
                        </div>
                        <div style={rowTempWrapStyle}>
                          <span style={rowTempStyle}>{tempLabel}</span>
                        </div>
                      </div>
                    </li>
                  );
                }

                // F67: aria-label er handlingsorientert ("Vis påkledning for …")
                // siden raden nå er en knapp som åpner påkledning-sheet.
                const ariaLabel =
                  tab === 'today'
                    ? `Vis påkledning for kl ${String(phase.hour).padStart(2, '0')}:00. ${tempLabel}. ${phase.band.label} påkledning, ${phase.band.count} plagg.`
                    : `Vis påkledning for ${formatDayShort(phase.date, phase.isToday)} kl. ${String(phase.hour).padStart(2, '0')}. ${tempLabel}. ${phase.band.label} påkledning, ${phase.band.count} plagg.`;

                return (
                  <li
                    key={`${tab}-${idx}-${phase.hour}-${phase.date.toISOString().slice(0, 10)}`}
                    style={{ listStyle: 'none' }}
                  >
                    <button
                      type="button"
                      style={rowButtonStyle(isLast)}
                      aria-label={ariaLabel}
                      onClick={() => {
                        void fire('light');
                        // Limitation: sheet bruker "current"-data uavhengig av
                        // rad-time/dag. Per-fase-context er ikke wired enda.
                        onOpenSheet();
                      }}
                    >
                      {dayTimeCol}
                      <div style={rowIconStyle} aria-label={conditionLabel(phase.symbolCode)}>
                        <WeatherIcon symbolCode={phase.symbolCode} size={28} />
                      </div>
                      <div style={rowTempWrapStyle}>
                        <span style={rowTempStyle} aria-hidden="true">
                          {tempLabel}
                        </span>
                      </div>
                      <span style={bandPillStyle}>
                        <span style={bandPipStyle(phase.band.color)} aria-hidden="true">
                          {phase.band.count}
                        </span>
                        <span style={bandLabelStyle}>{phase.band.label}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Primary CTA */}
        {!isLoading && !isError && phases.length > 0 && (
          <div style={ctaWrapStyle}>
            <button
              type="button"
              style={ctaStyle}
              onClick={onCtaClick}
              aria-label={`Se forslag for ${childName} akkurat nå`}
            >
              <svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 12h13" />
                <path d="M13 6l7 6-7 6" />
              </svg>
              Se forslag for {childName} nå
            </button>
          </div>
        )}

        {/* Skjult condition-label så den ikke regresserer i markup */}
        <span style={srOnlyStyle} aria-hidden="true">{nowCond}</span>
      </main>

      {/* Paywall-modal for 10-dagers-teaseren (F81.5-W2, Flate 1) */}
      <PaywallDialog
        open={tenDayPaywallOpen}
        trigger="imorgen"
        onClose={() => setTenDayPaywallOpen(false)}
        returnFocusTo={tenDayPaywallReturnFocusTo}
      />
    </div>
  );
}

export default UkeScreen;
