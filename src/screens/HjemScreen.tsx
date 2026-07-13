/**
 * HjemScreen — F80b PROD-PORT av «Morgennatt» V3 (docs/F80/v3-vurdering.md).
 *
 * Kilder (les FØR endring):
 *  - docs/F80/a11y-preclearance.md — a11y-krav, regresjon = Critical
 *  - docs/F80/v3-vurdering.md — layout-fasit
 *  - docs/F79/morgennatt-cta-analyse.md — Morgennatt-tokens (se design-tokens.css)
 *  - public/design-2026/f79-hjem-a/index.html — V3-passet referanse-mock
 *
 * Layout (top→bottom):
 *   1. Topbar: sted-pille (44px) + klokke. INGEN notif-knapp (V3: tom topp).
 *   2. Vær-sone: clay-ikon (klarvær/snø) eller ink-nøytral SVG-fallback,
 *      øvre høyre, engangs sol-halo-puls (4.5s). Meta-linje under sted-pillen.
 *      sr-only #temp-display aria-live="polite".
 *   3. Aktivitets-toggle (BEHOLDES — Fable-beslutning, mocken utelot den kun
 *      fordi mocken er værstatisk). vognMode mini-toggle conditional som før.
 *   4. Scene: "Dagens påkledning"-label → temp-mast (Fraunces, aria-hidden,
 *      tabular-nums) → avatar-stack (dressing-sekvens, sessionStorage-gate)
 *      → «N lag» → CTA "Se dagens antrekk" (56px, Granmynte).
 *   5. BottomTabBar mountes globalt i App.tsx — ikke her.
 *
 * Beholdt uendret fra forrige iter (motor/hooks — IKKE rørt av denne porten):
 *  - useChildren, useWeather, recommend(), swap-override-store
 *  - tierFromRecommendation / headwearFromRecommendation / avatarPng
 *  - useNativeSettings (reducedMotion), useHapticSystem
 *  - onOpenSheet-context-kontrakt til App.tsx (uendret props-signatur)
 *
 * Droppet i V3 (jf. v3-vurdering.md «Tatt inn»):
 *  - Notif-knapp øverst
 *  - Lag-dots (kun "N lag"-tallet består)
 *  - Marigold-separator-linje over CTA
 *  - Replay-knapp i app-UI (dressing spiller kun én gang per sesjon)
 *  - WeatherLottie / CDN-Lottie på Hjem (komponentfila består for evt. andre
 *    skjermer — grep bekreftet: kun HjemScreen + fila selv refererte den)
 *
 * A11y (a11y-preclearance.md §1-2, regresjon = Critical):
 *  - Dressing-sekvens: RM → hopp rett til sluttstage, blokkerer aldri CTA/nav.
 *    role="status" annonserer «Kledd i N lag» først VED FERDIG (ikke per stage).
 *  - Sol-puls er engangs <5s → WCAG 2.2.2 krever INGEN pause-kontroll.
 *  - Temp-mast er aria-hidden; verdien bæres av sr-only #temp-display.
 *  - Canvas/atmos er aria-hidden; temp-endring annonseres av #temp-display.
 *  - Ingen transition ved RM (design-tokens.css .ba-temp-root + inline RM-gates).
 */
import { type CSSProperties, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import type { TabKey } from '../types/nav';
import { useChildren } from '../state/children-store';
import { useWeather } from '../hooks/useWeather';
import { useHapticSystem } from '../lib/haptics/system';
import { useNativeSettings } from '../hooks/useNativeSettings';
import { recommend } from '../lib/wool-layers/recommend';
import type { Recommendation } from '../lib/wool-layers/types';
import { dobToAgeMonths } from '../lib/utils/dob-to-age-months';
// Gamle A1-A7-PNG-ene er byttet ut med clay-verdenen fra F79/F80.
// tier/headwear-logikken GJENBRUKES for å velge riktig clay-antrekk:
// hodeplagg + vær-tier på avataren er kjernesignalet.
import { headwearFromRecommendation, tierFromRecommendation } from '../lib/avatar-tier';
// BottomTabBar er global (mounted i App.tsx) — ikke importer/mount her.
import { MOTION } from '../styles/motion-grammar';
import { useSwapOverride } from '../state/swap-override-store';

// ─────────────────────────────────────────────────────────────────────────────
// Konstanter / fallback
// ─────────────────────────────────────────────────────────────────────────────

const ELVERUM = { lat: 60.8867, lon: 11.5614, city: 'Elverum' };

// Temp-band-terskler for data-temp-aksen (kald < 5°, varm > 18°, ellers mild).
// Egne konstanter (ikke wool-layers TempBand) — dette er en UI-canvas-akse,
// separat fra motorens finmaskede tempBand-inndeling.
const TEMP_AXIS_COLD_MAX = 5;
const TEMP_AXIS_WARM_MIN = 18;

type TempAxis = 'kald' | 'mild' | 'varm';

/** data-temp-verdi fra feels-like (fallback: faktisk temp). Bytte KUN ved
 *  båndgrense. Eksportert (F83 M1) så PaakledningScreen kan synke sitt
 *  fullskjerm-lerret med Hjem — samme akse, sømløs cross-fade. */
export function tempAxisFor(feelsLikeC: number | undefined | null, tempC: number | undefined | null): TempAxis {
  const t = feelsLikeC ?? tempC;
  if (t === undefined || t === null || Number.isNaN(t)) return 'mild';
  if (t < TEMP_AXIS_COLD_MAX) return 'kald';
  if (t > TEMP_AXIS_WARM_MIN) return 'varm';
  return 'mild';
}

const DRESSING_STAGE_COUNT = 4; // stage-0..4 (5 bilder)

type Activity = 'utelek' | 'vogn';
type VognMode = 'awake' | 'sleeping';

/**
 * onOpenSheet aksepterer en context-payload slik at popupen får SAMME
 * recommendation som Hjem allerede har beregnet (inkl. swap-overrides) +
 * gjeldende activity / vognMode. Uendret fra forrige iter.
 */
type OpenSheetContext = {
  recommendation: Recommendation | null;
  activity: Activity;
  vognMode: VognMode;
};

type HjemScreenProps = {
  onNavigate: (tab: TabKey) => void;
  onOpenSheet: (ctx: OpenSheetContext) => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function symbolToLabel(symbolCode: string | undefined): string {
  if (!symbolCode) return 'Henter vær';
  const base = symbolCode.replace(/_(day|night|polartwilight)$/, '');
  switch (base) {
    case 'clearsky': return 'Klarvær';
    case 'fair': return 'Lettskyet';
    case 'partlycloudy': return 'Delvis skyet';
    case 'cloudy': return 'Skyet';
    case 'fog': return 'Tåke';
    case 'lightrain':
    case 'lightrainshowers': return 'Lett regn';
    case 'rain':
    case 'rainshowers': return 'Regn';
    case 'heavyrain':
    case 'heavyrainshowers': return 'Kraftig regn';
    case 'lightsnow':
    case 'lightsnowshowers': return 'Lett snø';
    case 'snow':
    case 'snowshowers': return 'Snø';
    case 'heavysnow':
    case 'heavysnowshowers': return 'Kraftig snø';
    case 'sleet':
    case 'sleetshowers': return 'Sludd';
    default: return 'Vær';
  }
}

function formatTemp(t: number | undefined | null): string {
  if (t === undefined || t === null || Number.isNaN(t)) return '–';
  const rounded = Math.round(t);
  // Unicode-minus for negative for typografisk konsekvens med mock.
  return rounded < 0 ? `−${Math.abs(rounded)}` : `${rounded}`;
}

/**
 * Antall "lag" for lag-tallet — samme telling som tidligere B-strategi-tekst
 * brukte (ekskluderer 'utstyr'-kategorien, som ikke er klær PÅ barnet, f.eks.
 * vognpose/regntrekk). Dette matcher hva PaakledningScreen-popupen grupperer
 * som innerst/mellom/ytterst/tilbehør (tilbehør = 'ekstra' + 'utstyr'), så
 * "N lag" på Hjem og popupens faktiske plagg-liste bærer samme fasit-tall.
 */
function layerCount(rec: Recommendation | null): number {
  if (!rec) return 0;
  return rec.layers.reduce((sum, layer) => {
    if (layer.category === 'utstyr') return sum;
    return sum + (layer.items.length > 0 ? 1 : 0);
  }, 0);
}

/**
 * Interim ikon-strategi (til batch-vær-tiers leverer full 3D-sett):
 *  - klarvær/fair → klarvaer.png
 *  - snø/sludd → sno.png
 *  - alt annet → ink-nøytral SVG-fallback (canvas bærer temperaturen, ikke ikonet)
 */
type WeatherIconStrategy =
  | { kind: 'png'; src: string }
  | { kind: 'fallback' };

function weatherIconFor(symbolCode: string | undefined): WeatherIconStrategy {
  const base = (symbolCode ?? '').replace(/_(day|night|polartwilight)$/, '');
  const png = (f: string): WeatherIconStrategy => ({ kind: 'png', src: `${import.meta.env.BASE_URL}weather-3d/${f}.png` });
  if (base === 'clearsky') return png('klarvaer');
  if (base === 'fair' || base === 'partlycloudy') return png('delvis-skyet');
  if (base.includes('snow') || base.includes('sleet')) return png('sno');
  if (base.includes('rain')) return png('regn');
  if (base === 'cloudy') return png('skyet');
  if (base === 'fog') return png('taake');
  return { kind: 'fallback' };
}

/**
 * Interim dressing-sekvens stage-mapping (til batch leverer vær-tiers).
 * ≤2 lag → spill 0→2, 3 lag → 0→3, ≥4 lag → 0→4. Samlet i én funksjon slik
 * at fremtidig bytte til vær-tier-drevet mapping er én fils endring.
 */
function stageForRecommendation(layers: number): number {
  if (layers <= 2) return 2;
  if (layers === 3) return 3;
  return Math.min(4, DRESSING_STAGE_COUNT);
}

/**
 * Hodeplagg PÅ avataren når anbefalingen inneholder det (kjernesignal).
 * Sluttbildet i sekvensen byttes til hodeplagg-variant der den finnes;
 * mellom-stadier er bare. Manglende kombo → bar stage (graceful).
 * Genererte varianter (F80): 1/2-solhatt, 2/3/4-lue.
 */
const HEADWEAR_VARIANTS: Record<string, true> = {
  'stage-1-solhatt': true,
  'stage-2-solhatt': true,
  'stage-2-lue': true,
  'stage-3-lue': true,
  'stage-4-lue': true,
};

/** Vær-tiers fra F80a-batchen: sluttbildet for ytterpunkt-vær.
 *  A2-A4 dekkes av stagene (+hodeplagg-varianter); disse fire er
 *  dedikerte antrekk generert via edit-kjeden (samme baby). */
const TIER_FINALS: Partial<Record<string, string>> = {
  A1: '/avatars/f79-poc/tier-A1-sommer.png',
  A5: '/avatars/f79-poc/tier-A5-vinter.png',
  A6: '/avatars/f79-poc/tier-A6-ekstrem.png',
  A7: '/avatars/f79-poc/tier-A7-sovn.png',
};

export function stageSrc(
  stageIdx: number,
  targetStage: number,
  headwear: 'lue' | 'solhatt' | 'none',
  tier?: string,
): string {
  if (stageIdx === targetStage) {
    // Ytterpunkt-vær (sommer/vinter/ekstrem/sovn): dedikert tier-antrekk
    if (tier && TIER_FINALS[tier]) return TIER_FINALS[tier] as string;
    if (headwear !== 'none' && HEADWEAR_VARIANTS[`stage-${stageIdx}-${headwear}`]) {
      return `/avatars/f79-poc/stage-${stageIdx}-${headwear}.png`;
    }
  }
  return `/avatars/f79-poc/stage-${stageIdx}.png`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG-ikoner (inline)
// ─────────────────────────────────────────────────────────────────────────────

function PlaceIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21Z" />
      <circle cx={12} cy={9.5} r={2.4} />
    </svg>
  );
}

/** Ink-nøytral vær-fallback-ikon (jf. a11y-preclearance §4: alt="" dekorativ). */
function WeatherFallbackIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 32h22a6 6 0 0 0 .6-12 9 9 0 0 0-17-1.5A5.5 5.5 0 0 0 12 32z"
        fill="none"
        stroke="var(--ink-secondary, var(--ink-700))"
        strokeWidth={2}
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HjemScreen
// ─────────────────────────────────────────────────────────────────────────────

export function HjemScreen({ onNavigate: _onNavigate, onOpenSheet }: HjemScreenProps) {
  // _onNavigate beholdes i signaturen (App passer den), men brukes ikke lokalt
  // siden BottomTabBar nå mountes globalt i App.tsx.
  void _onNavigate;
  const { active, needsOnboarding } = useChildren();
  const { reducedMotion } = useNativeSettings();
  const { fire } = useHapticSystem();
  // Swap-overrides for plagg-bytter (session-only) — driver avatar-tier
  // hvis Sivert har byttet base-laget i popupen. Uendret fra forrige iter.
  const swaps = useSwapOverride((s) => s.swaps);

  const lat = !needsOnboarding && active.lat ? active.lat : ELVERUM.lat;
  const lon = !needsOnboarding && active.lon ? active.lon : ELVERUM.lon;
  const cityLabel = !needsOnboarding && active.city ? active.city : ELVERUM.city;

  const weather = useWeather(lat, lon);
  const [activity, setActivity] = useState<Activity>('utelek');
  // Søvn/våken-toggle på vogn fjernet (Sivert: ikke viktig nok). Antar våken.
  const vognMode: VognMode = 'awake';

  const ageMonths = useMemo(
    () => (!needsOnboarding ? dobToAgeMonths(active.dob) : 0),
    [active.dob, needsOnboarding],
  );

  const recommendation = useMemo<Recommendation | null>(() => {
    if (!weather.now) return null;
    try {
      return recommend({
        weather: {
          tempC: weather.now.tempC,
          feelsLikeC: weather.now.feelsLikeC,
          windMs: weather.now.windMs,
          precipMmH: weather.now.precipMmH,
          symbolCode: weather.now.symbolCode,
        },
        child: { ageMonths },
        activity,
        ...(activity === 'vogn' ? { vognMode } : {}),
      });
    } catch {
      return null;
    }
  }, [weather.now, ageMonths, activity, vognMode]);

  /**
   * Swap-resolved recommendation: items erstattes per session-swap-store.
   * Brukt av avatar-tier-utvelgelse, lag-tall og popup-context, slik at
   * Sivert ser umiddelbar konsistens mellom valg, avatar og «N lag».
   */
  const resolvedRecommendation = useMemo<Recommendation | null>(() => {
    if (!recommendation) return null;
    const hasSwaps = Object.keys(swaps).length > 0;
    if (!hasSwaps) return recommendation;
    return {
      ...recommendation,
      layers: recommendation.layers.map((l) => ({
        ...l,
        items: l.items.map((item) => swaps[item] ?? item),
      })),
    };
  }, [recommendation, swaps]);

  const handleActivityChange = (next: Activity) => {
    if (next === activity) return;
    setActivity(next);
    void fire('selection');
  };

  const handleCta = () => {
    void fire('medium');
    onOpenSheet({
      recommendation: resolvedRecommendation,
      activity,
      vognMode,
    });
  };

  // ─── Avledede verdier ─────────────────────────────────────────────────────

  const now = weather.now;
  const isWeatherLoading = now === null || now === undefined;
  const conditionLabelText = symbolToLabel(now?.symbolCode);
  const tempAxis = tempAxisFor(now?.feelsLikeC, now?.tempC);
  const totalLayers = layerCount(resolvedRecommendation);

  const weatherIcon = weatherIconFor(now?.symbolCode);
  const headwear = resolvedRecommendation ? headwearFromRecommendation(resolvedRecommendation) : 'none';
  const avatarTier = resolvedRecommendation ? tierFromRecommendation(resolvedRecommendation, activity) : undefined;

  // Avatar er NAKEN på Hjem (Sivert 2026-07): ingen påkledning før CTA.
  // Selve på-kledningen skjer i takeoveren etter «Se dagens antrekk». targetStage
  // beholdes kun så (skjulte) høyere stage-bilder får riktig hodeplagg-variant.
  const targetStage = resolvedRecommendation ? stageForRecommendation(totalLayers) : 0;
  const effectiveStage = 0; // kun stage-0 (naken/bleie) synlig på Hjem

  // ─── Sol-puls: engangs 4.5s, ingen replay/pause i UI (WCAG 2.2.2: <5s → OK) ──
  const [sunPulseKey] = useState(0);

  // ─── Styles ───────────────────────────────────────────────────────────────

  const shellStyle: CSSProperties = {
    /* F80.3: flex-vekst i app-skallets kjede (ikke 100dvh) — 100dvh her
       presset CTA-en 50px bak nav-baren (målt). Skallet eier viewporten. */
    flex: '1 0 auto',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  };

  const root: CSSProperties = {
    position: 'relative',
    flex: 1,
    minHeight: 0,
    width: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    /* F80.3: GULV — env(safe-area-inset-top) gir ~0 i WKWebView
       (Elverum-pillen havnet bak iOS-klokka). 50px klarer status-bar/island;
       additiv 24→12 henter «sted» høyere opp (Sivert). Samme mønster som UkeScreen. */
    padding: 'max(50px, calc(env(safe-area-inset-top, 0px) + 12px)) 22px 14px',
    fontFamily: 'var(--font-sans)',
    color: 'var(--ink-900)',
    background: 'var(--bg-canvas)',
    /* a11y A2: klipp horisontalt (avatar-glød), men la vertikal scroll være
       sikkerhetsventil ved stor tekst / 200%-zoom (CTA aldri innelåst). */
    overflow: 'hidden auto',
    WebkitTapHighlightColor: 'transparent',
  };

  const topBar: CSSProperties = {
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const cityPill: CSSProperties = {
    appearance: 'none',
    font: 'inherit',
    cursor: 'default',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '9px 14px',
    borderRadius: 999,
    background: 'var(--surface-pure)',
    border: '1px solid var(--ink-100)',
    minHeight: 44,
    color: 'var(--ink-900)',
  };

  const cityLabelStyle: CSSProperties = {
    fontSize: '0.84375rem',
    fontWeight: 600,
    letterSpacing: '-0.1px',
    color: 'var(--ink-900)',
  };

  const weatherHero: CSSProperties = {
    position: 'relative',
    marginTop: 12,
    minHeight: 24,
  };

  const sunWrap: CSSProperties = {
    position: 'absolute',
    top: 10,
    right: 0,
    width: 48,
    height: 48,
    display: 'grid',
    placeItems: 'center',
  };

  const metaLine: CSSProperties = {
    fontSize: '0.9375rem',
    color: 'var(--ink-700)',
    marginTop: 2,
    maxWidth: '62%',
  };

  const metaStrong: CSSProperties = {
    color: 'var(--ink-900)',
    fontWeight: 600,
  };

  const segmentWrap: CSSProperties = {
    position: 'relative',
    flex: 'none',
    display: 'flex',
    marginTop: 10,
    padding: 4,
    borderRadius: 13,
    background: 'var(--surface-soft)',
    minHeight: 44,
  };

  const segmentSliderBase: CSSProperties = {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: 'calc(50% - 4px)',
    borderRadius: 10,
    background: 'var(--surface-pure)',
    boxShadow: 'var(--shadow-1)',
    transition: reducedMotion
      ? 'none'
      : `transform ${MOTION.segSlider}ms ${MOTION.iosDrawer}`,
    transform: activity === 'utelek' ? 'translateX(0)' : 'translateX(100%)',
    pointerEvents: 'none',
  };

  const segmentBtn = (selected: boolean): CSSProperties => ({
    position: 'relative',
    zIndex: 1,
    flex: 1,
    minHeight: 44,
    border: 'none',
    background: 'transparent',
    color: selected ? 'var(--ink-900)' : 'var(--ink-500)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: '0.84375rem',
    cursor: 'pointer',
    padding: '8px 0',
    borderRadius: 10,
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    transition: reducedMotion ? 'none' : `color ${MOTION.tabTap}ms ${MOTION.easeOut}`,
  });

  const sceneSection: CSSProperties = {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    marginTop: 2,
  };

  const sceneLabel: CSSProperties = {
    fontSize: '0.8125rem',
    fontWeight: 600,
    letterSpacing: '0.02em',
    color: 'var(--ink-700)',
    textAlign: 'center',
    margin: '0 0 6px',
  };

  const scene: CSSProperties = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 0 0',
    minHeight: 110,
    overflow: 'visible',
    flex: 1,
  };

  /* Sivert (låst): temp som dempet WATERMARK bak avataren — avataren får maks
     forgrunnsfokus. Fortsatt aria-hidden/dekorativ; lesbar temp i vær-linja +
     sr-only #temp-display (a11y-lead Task A). vw beholdt (WCAG 1.4.4). */
  /* Sivert: watermark droppet. Temp fremtredende som rent, lesbart tall i
     vær-sonen (Fraunces display). Dekorativ (aria-hidden) — SR-verdi i
     #temp-display. Avatar-scenen blir ren (kun avatar). */
  const bigTemp: CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: '3.5rem',
    lineHeight: 1,
    letterSpacing: '-0.02em',
    color: 'var(--ink-900)',
    fontVariantNumeric: 'tabular-nums',
    marginTop: 6,
    transition: reducedMotion ? 'none' : `color ${MOTION.tempBurst}ms ${MOTION.easeOut}`,
  };

  const stack: CSSProperties = {
    position: 'relative',
    /* Viewport-skalert med gulv: fast 264px skjøv CTA-en under bunn-nav på
       iPhone SE (667px høyde). vh (ikke dvh) — støttet i alle WebViews. */
    width: 'min(264px, max(160px, 32vh))',
    height: 'min(264px, max(160px, 32vh))',
    zIndex: 2,
    margin: '0 auto',
    filter:
      'drop-shadow(-10px 16px 20px color-mix(in srgb, var(--accent-temp, var(--warm-orange-500)) 32%, transparent)) drop-shadow(8px -6px 16px color-mix(in srgb, var(--avatar-glow) 60%, transparent))',
  };

  const stackImgStyle = (on: boolean): CSSProperties => ({
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    objectPosition: 'center bottom',
    opacity: on ? 1 : 0,
    transform: on ? 'translateY(0) scale(1)' : 'translateY(5px) scale(0.985)',
    transition: reducedMotion
      ? 'none'
      : `opacity 420ms ${MOTION.easeOut}, transform 420ms ${MOTION.easeOut}`,
    pointerEvents: 'none',
    userSelect: 'none',
  });

  const cta: CSSProperties = {
    flex: 'none',
    /* «N lag»-telleren er fjernet (testbrukere forsto den ikke, og den ble
       klippet av bunn-nav på små skjermer). auto-margin ankrer CTA mot
       bunnen — restluften samles mellom avatar og CTA. */
    marginTop: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    minHeight: 56,
    boxSizing: 'border-box',
    padding: '17px 30px',
    borderRadius: 24,
    border: 'none',
    cursor: 'pointer',
    background: 'var(--accent-cta)',
    color: 'var(--accent-cta-ink)',
    boxShadow: 'var(--shadow-cta-primary)',
    transition: reducedMotion
      ? 'none'
      : `transform ${MOTION.press}ms ${MOTION.easeOut}, box-shadow 200ms ${MOTION.easeOut}, background-color ${MOTION.tempTransition}ms ${MOTION.easeOut}, color ${MOTION.tempTransition}ms ${MOTION.easeOut}`,
    fontFamily: 'var(--font-sans)',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  };

  const ctaLabel: CSSProperties = {
    fontSize: '0.9375rem',
    fontWeight: 700,
    letterSpacing: '0.1px',
  };

  const srOnly: CSSProperties = {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
    border: 0,
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        .ba-hjem-press:active:not(:disabled) { transform: scale(var(--press-scale, 0.97)); }
        .ba-hjem-press-cta:active:not(:disabled) { transform: scale(var(--press-scale-cta, 0.98)); }
        .ba-hjem-focus:focus-visible {
          outline: 3px solid var(--focus-ring, var(--warm-orange-500));
          outline-offset: 3px;
          border-radius: 8px;
        }
        .ba-hjem-sun::before {
          content: '';
          position: absolute; inset: -30%;
          background: radial-gradient(closest-side, color-mix(in srgb, var(--accent-temp, var(--warm-orange-500)) 55%, transparent) 0%, transparent 72%);
          filter: blur(3px);
          animation: baHjemSunBreathe ${MOTION.sunPulse}ms ease-in-out 1;
        }
        @keyframes baHjemSunBreathe {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.045); opacity: 0.88; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ba-hjem-sun::before { animation: none !important; }
          .ba-hjem-press:active:not(:disabled),
          .ba-hjem-press-cta:active:not(:disabled) { transform: none !important; }
        }
      `}</style>

      <div style={shellStyle}>
        <main
          style={root}
          className="ba-temp-root"
          data-temp={tempAxis}
          aria-labelledby="ba-hjem-title"
        >
          {/* Topbar — kun sted-pille. Egen-tegnet klokke fjernet (A2): den
              kolliderte med OS-statusbar (som allerede viser klokka). */}
          <header style={topBar}>
            <div style={cityPill}>
              <PlaceIcon />
              <span style={cityLabelStyle}>{cityLabel}</span>
            </div>
          </header>

          {/* Vær-sone: ikon øvre høyre + meta-linje. sr-only temp-live-region. */}
          <section
            style={weatherHero}
            aria-label={`Vær nå i ${cityLabel}`}
          >
            <h1 id="ba-hjem-title" style={srOnly}>Babyora – Hjem</h1>
            <div
              style={sunWrap}
              aria-hidden="true"
              className={weatherIcon.kind === 'png' && !isWeatherLoading ? 'ba-hjem-sun' : undefined}
              key={sunPulseKey}
            >
              {weatherIcon.kind === 'png' ? (
                <img
                  src={weatherIcon.src}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.18))' }}
                  draggable={false}
                />
              ) : (
                <WeatherFallbackIcon size={38} />
              )}
            </div>
            <span
              id="temp-display"
              aria-live="polite"
              style={srOnly}
            >
              {isWeatherLoading
                ? 'Henter vær'
                : `${formatTemp(now?.tempC).replace(/^−/, 'minus ')} grader, ${conditionLabelText}, føles som ${formatTemp(now?.feelsLikeC).replace(/^−/, 'minus ')} grader, vind ${Math.round(now?.windMs ?? 0)} meter per sekund`}
            </span>
            {/* Fremtredende temp (Sivert: temp må være tydelig når watermark droppes).
               Dekorativ — SR-verdi bæres av #temp-display over. */}
            {!isWeatherLoading && (
              <div style={bigTemp} aria-hidden="true">{formatTemp(now?.tempC)}°</div>
            )}
            {/* Visuell vær-linje. a11y-lead: aria-hidden så SR ikke dobbel-leser
               (temp/condition/føles/vind bæres av #temp-display over). */}
            <p style={metaLine} aria-hidden="true">
              {isWeatherLoading ? (
                'Henter vær…'
              ) : (
                <>
                  <span style={metaStrong}>{conditionLabelText}</span> · føles som{' '}
                  <span style={metaStrong}>{formatTemp(now?.feelsLikeC)}°</span> · vind{' '}
                  {Math.round(now?.windMs ?? 0)} m/s
                </>
              )}
            </p>
          </section>

          {/* Aktivitets-toggle. a11y-lead (verify): ekte tablist mangler panel/
             piltast-modell → role=group + aria-pressed (som vognMode-toggle under). */}
          <div role="group" aria-label="Velg situasjon" style={segmentWrap}>
            <span style={segmentSliderBase} aria-hidden="true" />
            <button
              type="button"
              aria-pressed={activity === 'utelek'}
              onClick={() => handleActivityChange('utelek')}
              className="ba-hjem-focus"
              style={segmentBtn(activity === 'utelek')}
            >
              Utenfor vogn
            </button>
            <button
              type="button"
              aria-pressed={activity === 'vogn'}
              onClick={() => handleActivityChange('vogn')}
              className="ba-hjem-focus"
              style={segmentBtn(activity === 'vogn')}
            >
              I vogn
            </button>
          </div>

          {/* Scene: label → temp-mast → avatar-stack → «N lag» → CTA */}
          <div style={sceneSection}>
            <h2 id="scene-heading" style={sceneLabel}>Dagens påkledning</h2>

            <div style={scene}>
              <div
                style={stack}
                role="img"
                aria-label="Baby, ennå ikke påkledd"
              >
                {/* Clay-stagene (F79 edit-kjede) — crossfade 0→N. Sluttbildet
                    bytter til hodeplagg-variant når anbefalingen har lue/solhatt
                    (kjernesignal). Batch (F80a) leverer vær-tiers senere. */}
                {Array.from({ length: DRESSING_STAGE_COUNT + 1 }, (_, stageIdx) => (
                  <img
                    key={`${stageIdx}-${headwear}-${avatarTier ?? ''}`}
                    src={stageSrc(stageIdx, targetStage, headwear, avatarTier)}
                    alt=""
                    style={stackImgStyle(stageIdx <= effectiveStage)}
                    draggable={false}
                  />
                ))}
              </div>
            </div>

            {/* CTA — Native-feel: spring-fysikk på tap (whileTap).
                Reduced-motion: CSS-pressede regler i .ba-hjem-press-cta */}
            {reducedMotion ? (
              <button
                type="button"
                onClick={handleCta}
                aria-haspopup="dialog"
                className="ba-hjem-press-cta ba-hjem-focus"
                style={cta}
              >
                <span style={ctaLabel}>Se dagens antrekk</span>
              </button>
            ) : (
              <motion.button
                type="button"
                onClick={handleCta}
                aria-haspopup="dialog"
                className="ba-hjem-focus"
                style={cta}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 420, damping: 26, mass: 0.6 }}
              >
                <span style={ctaLabel}>Se dagens antrekk</span>
              </motion.button>
            )}

          </div>
        </main>
        {/* BottomTabBar mountes globalt i App.tsx — ikke her. */}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Clock — liten intern komponent, oppdaterer hvert minutt.
// ─────────────────────────────────────────────────────────────────────────────

export default HjemScreen;
