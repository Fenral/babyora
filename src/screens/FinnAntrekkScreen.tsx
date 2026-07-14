/**
 * FinnAntrekkScreen — F80b PROD-PORT av "Morgennatt" + VERDIKT-HERO
 * (fasit-tiltaket, docs/F79/guide-analyse.md).
 *
 * Kilder (les FØR endring):
 *  - docs/F80/a11y-preclearance.md — §5: verdikt-hero aria-mønster
 *  - docs/F79/guide-analyse.md — fasit-autoritet-tiltak 1+2+3+5
 *  - src/styles/design-tokens.css — Morgennatt-vars
 *  - src/screens/HjemScreen.tsx — porterte Morgennatt-mønstre
 *
 * Pivot fra wizard-pattern (chips + 2×2 grid) til **discovery-kalkulator** med
 * native <input type="range"> slidere + 2-knapps radiogroup. Bruker drar
 * slidere og ser anbefalingen oppdatere seg live. Vær-symbol utledes fra
 * nedbør-slider (mm/t > 0 = regn, ellers klarvær).
 *
 * Mønster portet fra iter 32a GuideScreen (commit 951985b):
 *  - Native <input type="range"> for temp / vind / nedbør, restylet til
 *    Morgennatt (accent-cta thumb, ink-200 track), touch ≥44px
 *  - role="status" aria-live="polite" debounced via useLiveStatus
 *    (800ms — a11y-preclearance §5: annonsér hvilende verdi, aldri hver tick)
 *  - Roving-tabindex radiogroup for aktivitet (arrow-key-nav)
 *  - aria-valuetext med tempband / vindband / nedbørband (menneskelig enhet)
 *
 * VERDIKT-HERO (fasit-tiltak 1+2, guide-analyse.md linje 78-94):
 *  - «N lag» som stort display-tall (Fraunces, tabular-nums) — dommen, ikke
 *    en fotnote nederst i scroll.
 *  - Én alltid-synlig hvorfor-linje generert fra slider-state (samme logikk
 *    som HjemScreen/summary.ts sin "sannferdig, ikke hardkodet"-regel).
 *  - «Vis hvorfor»-inline-ekspander med full regel-begrunnelse.
 *  - Kilde-linje UTENFOR live-regionen (a11y-preclearance §5), diskret ink-500.
 *  - Ingen hedging («kanskje», «vurder») og ingen tom-tilstand — motoren
 *    dekker hele slider-domenet (guide-analyse.md tiltak 5).
 *
 * Sone 2 (kalkulator): temp-akse-hint OK — kalkulatoren utforsker jo
 * temperatur. data-temp settes fra slider-temp med samme terskler som Hjem.
 *
 * Output-card bruker V2-skannbar-liste-pattern fra PaakledningScreen
 * (gruppert per innerst/mellom/ytterst/tilbehør med lag-stripe + thumb).
 *
 * Defaults hentes fra useWeather hvis tilgjengelig, ellers
 * -4° / 3 m/s / 0 mm/t / klarvær.
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
} from 'react';
import { useChildren } from '../state/children-store';
import { useWeather } from '../hooks/useWeather';
import { useHapticSystem } from '../lib/haptics/system';
import { useNativeSettings } from '../hooks/useNativeSettings';
import { useLiveStatus } from '../hooks/useLiveStatus';
import { dobToAgeMonths } from '../lib/utils/dob-to-age-months';
import { recommend } from '../lib/wool-layers/recommend';
import type { Activity, Layer, LayerCategory } from '../lib/wool-layers/types';
import { garmentIdFor, garmentPng, type GarmentId } from '../data/garment-illustrations';
import { PlaggDetailSheet } from '../components/PlaggDetailSheet';
import { TemperatureInstrument } from '../components/instrument/TemperatureInstrument';

export type FinnAntrekkScreenProps = {
  onBack: () => void;
};

/* ──────────────────────────────────────────────────────────────────────────
   Vær-symbol utledes fra nedbør-slider (nedbør > 0 = regn, ellers klarvær).
   Slider-input dekker regn-aspektet, og vi sender symbolCode til recommend()
   slik motoren forventer.
   ────────────────────────────────────────────────────────────────────────── */

function symbolCodeFromPrecip(mmH: number): string {
  return mmH > 0 ? 'rain' : 'clearsky_day';
}

/* ──────────────────────────────────────────────────────────────────────────
   Aktivitet: 2-knapps radiogroup med roving-tabindex
   ────────────────────────────────────────────────────────────────────────── */

type ActivityUi = 'lek' | 'vogn';

type ActivityOption = {
  ui: ActivityUi;
  label: string;
  engine: Activity;
};

const ACTIVITY_OPTIONS: ActivityOption[] = [
  { ui: 'lek', label: 'Lek ute', engine: 'utelek' },
  { ui: 'vogn', label: 'I vogn', engine: 'vogn' },
];

/* ──────────────────────────────────────────────────────────────────────────
   Output-grupper (V2-skannbar-liste, samme som PaakledningScreen)
   ────────────────────────────────────────────────────────────────────────── */

type GroupKey = 'innerst' | 'mellom' | 'ytterst' | 'tilbehor';

type GroupSpec = {
  key: GroupKey;
  label: string;
  /** Lag-stripe-farge (3px venstre). */
  color: string;
};

const GROUPS: GroupSpec[] = [
  { key: 'innerst', label: 'Innerst', color: 'var(--layer-innerst)' },
  { key: 'mellom', label: 'Mellom', color: 'var(--layer-mellom)' },
  { key: 'ytterst', label: 'Ytterst', color: 'var(--layer-ytterst)' },
  { key: 'tilbehor', label: 'Tilbehør', color: 'var(--ink-400)' },
];

function categoryToGroup(c: LayerCategory): GroupKey {
  if (c === 'innerst') return 'innerst';
  if (c === 'mellomlag') return 'mellom';
  if (c === 'yttertoy') return 'ytterst';
  return 'tilbehor';
}

/* ──────────────────────────────────────────────────────────────────────────
   Verdi-tekst for a11y (aria-valuetext)
   ────────────────────────────────────────────────────────────────────────── */

function tempBandText(c: number): string {
  if (c < -10) return 'frost';
  if (c < 0) return 'kjølig';
  if (c < 10) return 'mildt';
  if (c < 22) return 'varmt';
  return 'tropisk';
}

function windBandText(ms: number): string {
  if (ms <= 1) return 'stille';
  if (ms <= 4) return 'lett';
  if (ms <= 7) return 'frisk';
  if (ms <= 10) return 'sterk';
  return 'storm';
}

function precipBandText(mm: number): string {
  if (mm === 0) return 'tørt';
  if (mm <= 1) return 'yr';
  if (mm <= 4) return 'moderat';
  if (mm <= 7) return 'mye';
  return 'kraftig';
}

function formatTemp(c: number): string {
  const rounded = Math.round(c);
  if (rounded < 0) return `−${Math.abs(rounded)}°`;
  return `${rounded}°`;
}

function tempBandHeadline(c: number): string {
  const b = tempBandText(c);
  switch (b) {
    case 'frost': return 'frost';
    case 'kjølig': return 'kald';
    case 'mildt': return 'mild';
    case 'varmt': return 'varm';
    case 'tropisk': return 'tropisk';
    default: return b;
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   Temp-akse (Sone 2 — samme terskler som HjemScreen: kald <5°, varm >18°).
   Kalkulatoren utforsker jo temperatur, så data-temp-hint er tillatt her.
   ────────────────────────────────────────────────────────────────────────── */

const TEMP_AXIS_COLD_MAX = 5;
const TEMP_AXIS_WARM_MIN = 18;

type TempAxis = 'kald' | 'mild' | 'varm';

function tempAxisFor(tempC: number): TempAxis {
  if (tempC < TEMP_AXIS_COLD_MAX) return 'kald';
  if (tempC > TEMP_AXIS_WARM_MIN) return 'varm';
  return 'mild';
}

/* ──────────────────────────────────────────────────────────────────────────
   VERDIKT-HERO — hvorfor-tekst (fasit-tiltak 2, guide-analyse.md linje 82-85).
   Kompakt versjon av HjemScreen/lib/summary.ts sitt "sannferdig, aldri
   hardkodet"-prinsipp: én alltid-synlig linje bygget av faktisk slider-state,
   pluss en fyldigere liste med regel-utslag til "Vis hvorfor"-ekspanderen.
   Ingen hedging ("kanskje", "vurder") — dette er dommen, ikke et forslag.
   ────────────────────────────────────────────────────────────────────────── */

/** Én alltid-synlig hvorfor-linje, f.eks. «Føles som −9° · vind krever vindtett ytterlag». */
function buildWhyLine(tempC: number, windMs: number, precipMmH: number, activityUi: ActivityUi): string {
  const parts: string[] = [`Føles som ${formatTemp(tempC)}`];

  if (windMs >= 6) {
    parts.push('vind krever vindtett ytterlag');
  } else if (tempC < -10) {
    parts.push('frost krever fullt ullsett');
  }

  if (precipMmH > 0) {
    parts.push('nedbør krever vanntett yttertøy');
  }

  if (activityUi === 'vogn') {
    parts.push('i vogn lager barnet ikke egen varme');
  }

  return parts.join(' · ');
}

/** Fyldig regel-liste til "Vis hvorfor"-ekspanderen — hvert utslag som egen linje. */
function buildWhyDetails(
  tempC: number,
  windMs: number,
  precipMmH: number,
  activityUi: ActivityUi,
  layerCount: number,
): string[] {
  const details: string[] = [
    `Temperaturen føles som ${formatTemp(tempC)} (${tempBandText(tempC)}) — det avgjør hvor mange lag som trengs.`,
  ];

  if (windMs >= 6) {
    details.push(`Vind på ${windMs} m/s (${windBandText(windMs)}) krever et vindtett ytterlag.`);
  } else if (windMs > 1) {
    details.push(`Vind på ${windMs} m/s (${windBandText(windMs)}) er tatt med i beregningen.`);
  }

  if (precipMmH > 0) {
    details.push(`${precipMmH.toFixed(1)} mm/t nedbør (${precipBandText(precipMmH)}) krever vanntett yttertøy.`);
  }

  if (activityUi === 'vogn') {
    details.push('Barnet ligger stille i vogn og produserer ikke egen varme — det kompenseres med et ekstra lag.');
  } else {
    details.push('Barnet er i aktiv lek og lager egen varme — det er tatt med i beregningen.');
  }

  details.push(`Til sammen gir dette ${layerCount} ${layerCount === 1 ? 'lag' : 'lag'} mot ${tempBandHeadline(tempC)}.`);

  return details;
}

/* ──────────────────────────────────────────────────────────────────────────
   Komponent
   ────────────────────────────────────────────────────────────────────────── */

const FALLBACK_LAT = 60.8867;
const FALLBACK_LON = 11.5614;

export function FinnAntrekkScreen({ onBack }: FinnAntrekkScreenProps): ReactElement {
  const { active, needsOnboarding } = useChildren();
  const { fire } = useHapticSystem();
  const { reducedMotion } = useNativeSettings();
  const [whyExpanded, setWhyExpanded] = useState(false);

  const lat = active.lat || FALLBACK_LAT;
  const lon = active.lon || FALLBACK_LON;
  const weather = useWeather(lat, lon);

  // Slider/knapp-state — initialiseres ved første ready-respons fra useWeather.
  const [tempC, setTempC] = useState<number>(-4);
  const [windMs, setWindMs] = useState<number>(3);
  const [precipMmH, setPrecipMmH] = useState<number>(0);
  const [activityUi, setActivityUi] = useState<ActivityUi>('lek');

  // Track om bruker har dratt slidere — etter første interaksjon skal vi ikke
  // overskrive verdier når weather oppdateres.
  // R3 (2026-07-14): state (ikke ref) — guarden leses under render av
  // engangsinit-justeringen under, og refs kan ikke leses under render.
  const [initedFromWeather, setInitedFromWeather] = useState(false);

  /* ── Detalj-sheet state (F62 PlaggDetailSheet) ── */
  const [openGarmentId, setOpenGarmentId] = useState<GarmentId | null>(null);
  const detailTriggerRef = useRef<HTMLButtonElement | null>(null);
  const rowRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function handleOpenPlagg(rowKey: string, itemName: string): void {
    const gid = garmentIdFor(itemName);
    if (!gid) {
      // Ingen illustrasjon mappet → ingen detail-sheet å vise.
      return;
    }
    void fire('light');
    detailTriggerRef.current = rowRefs.current[rowKey] ?? null;
    setOpenGarmentId(gid);
  }

  function handleClosePlagg(): void {
    setOpenGarmentId(null);
  }

  // R3 (2026-07-14): engangsinit av slidere fra første ready-vær via
  // render-justering (React-dokumentert mønster) i stedet for sync setState
  // i effect — fjerner også flash av default-verdier før vær lander.
  if (!initedFromWeather && weather.status === 'ready' && weather.now) {
    setInitedFromWeather(true);
    const now = weather.now;
    if (typeof now.tempC === 'number') {
      setTempC(Math.round(now.tempC));
    }
    if (typeof now.windMs === 'number') {
      setWindMs(Math.round(now.windMs));
    }
    if (typeof now.precipMmH === 'number') {
      setPrecipMmH(Math.round(now.precipMmH * 2) / 2);
    }
  }

  const ageMonths = useMemo(() => {
    if (needsOnboarding || !active.dob) return 12;
    return dobToAgeMonths(active.dob);
  }, [active.dob, needsOnboarding]);

  const selectedActivity = useMemo<ActivityOption>(
    () => ACTIVITY_OPTIONS.find((a) => a.ui === activityUi) ?? ACTIVITY_OPTIONS[0]!,
    [activityUi],
  );

  const symbolCode = useMemo(() => symbolCodeFromPrecip(precipMmH), [precipMmH]);

  const recommendation = useMemo(() => {
    try {
      return recommend({
        weather: {
          tempC,
          feelsLikeC: tempC,
          windMs,
          precipMmH,
          symbolCode,
        },
        child: { ageMonths },
        activity: selectedActivity.engine,
      });
    } catch {
      return null;
    }
  }, [tempC, windMs, precipMmH, symbolCode, ageMonths, selectedActivity]);

  // Gruppér layers etter de 4 group-keys (V2-skannbar-liste).
  const grouped = useMemo<Map<GroupKey, Layer[]>>(() => {
    const m = new Map<GroupKey, Layer[]>();
    GROUPS.forEach((g) => m.set(g.key, []));
    if (!recommendation) return m;
    for (const l of recommendation.layers) {
      if (l.items.length === 0) continue;
      const k = categoryToGroup(l.category);
      m.get(k)!.push(l);
    }
    return m;
  }, [recommendation]);

  // Antall lag — motoren dekker hele slider-domenet (guide-analyse.md
  // tiltak 5); recommendation er kun null ved en logget motor-feil, ikke
  // ved gyldige slider-verdier. Ekskluderer 'utstyr' (ikke klær PÅ barnet).
  const layerCount = useMemo(() => {
    if (!recommendation) return 0;
    return recommendation.layers.reduce((sum, l) => {
      if (l.category === 'utstyr') return sum;
      return sum + (l.items.length > 0 ? 1 : 0);
    }, 0);
  }, [recommendation]);

  const whyLine = useMemo(
    () => buildWhyLine(tempC, windMs, precipMmH, activityUi),
    [tempC, windMs, precipMmH, activityUi],
  );

  const whyDetails = useMemo(
    () => buildWhyDetails(tempC, windMs, precipMmH, activityUi, layerCount),
    [tempC, windMs, precipMmH, activityUi, layerCount],
  );

  const tempAxis = tempAxisFor(tempC);

  // Logget motor-feil — ikke en gyldig tom-tilstand (tiltak 5: motoren
  // dekker hele slider-domenet, recommendation er kun null ved faktisk
  // motor-feil). Ingen hedging i UI.
  useEffect(() => {
    if (recommendation) return;
    console.error('FinnAntrekk: recommend() feilet for gyldige slider-verdier', {
      tempC,
      windMs,
      precipMmH,
      activity: selectedActivity.engine,
    });
  }, [recommendation, tempC, windMs, precipMmH, selectedActivity.engine]);

  // VERDIKT-HERO (a11y-preclearance §5): tallet + hvorfor-linjen bor i ÉN
  // aria-live="polite" aria-atomic="true"-region og oppdateres KUN når
  // sliderne har vært i ro i 900ms — annonsér hvilende verdi, aldri hver
  // tick. useLiveStatus debouncer selve visningsverdien (ikke bare en
  // skjult sr-only-tvilling), slik at det finnes én sannhetskilde.
  const { announcement: debouncedKey, setMessage: scheduleVerdict } = useLiveStatus(900);
  useEffect(() => {
    scheduleVerdict(`${layerCount}|${whyLine}`);
  }, [layerCount, whyLine, scheduleVerdict]);

  const [displayLayerCount, displayWhyLine] = useMemo(() => {
    const sep = debouncedKey.indexOf('|');
    if (sep === -1) return [layerCount, whyLine] as const;
    return [Number(debouncedKey.slice(0, sep)), debouncedKey.slice(sep + 1)] as const;
  }, [debouncedKey, layerCount, whyLine]);

  // F83: verdikt-pop når dommen endres — payoff-øyeblikket. WAAPI på SAMME
  // DOM-node (a11y-preclearance vilkår 4: aldri key-remount/element-swap i
  // live-regionen → ingen dobbel-annonsering). Gated på debounced verdi (samme
  // transition som SR-annonseringen) + reducedMotion. Første render popper ikke.
  const verdictNumRef = useRef<HTMLSpanElement | null>(null);
  const verdictPopInitRef = useRef(false);
  useEffect(() => {
    if (!verdictPopInitRef.current) {
      verdictPopInitRef.current = true;
      return;
    }
    if (reducedMotion) return;
    verdictNumRef.current?.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }],
      { duration: 280, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    );
  }, [displayLayerCount, reducedMotion]);

  /* ────── Handlers ────── */

  function selectActivity(ui: ActivityUi): void {
    if (ui === activityUi) return;
    setInitedFromWeather(true);
    setActivityUi(ui);
    void fire('selection');
  }

  function handleBack(): void {
    void fire('light');
    onBack();
  }

  /** F83: haptisk «detent» KUN når slider-verdien krysser et bånd (frost→
   *  kjølig, stille→lett …) — aldri per tick (a11y-preclearance: useHapticSystem
   *  er allerede RM/pref-gated). Første interaksjon fyrer ikke. */
  const lastBandRef = useRef<Record<string, string>>({});
  function handleSliderChange(
    id: string,
    bandFn: (n: number) => string,
    setter: (n: number) => void,
    value: number,
  ): void {
    setInitedFromWeather(true);
    setter(value);
    const band = bandFn(value);
    const prev = lastBandRef.current[id];
    lastBandRef.current[id] = band;
    if (prev !== undefined && prev !== band) void fire('selection');
  }

  function handleActivityKeyDown(
    e: ReactKeyboardEvent<HTMLButtonElement>,
    idx: number,
  ): void {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = ACTIVITY_OPTIONS[(idx + 1) % ACTIVITY_OPTIONS.length]!;
      selectActivity(next.ui);
      const nextBtn = document.querySelector<HTMLButtonElement>(`[data-activity="${next.ui}"]`);
      nextBtn?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = ACTIVITY_OPTIONS[
        (idx - 1 + ACTIVITY_OPTIONS.length) % ACTIVITY_OPTIONS.length
      ]!;
      selectActivity(prev.ui);
      const prevBtn = document.querySelector<HTMLButtonElement>(`[data-activity="${prev.ui}"]`);
      prevBtn?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      const first = ACTIVITY_OPTIONS[0]!;
      selectActivity(first.ui);
      document.querySelector<HTMLButtonElement>(`[data-activity="${first.ui}"]`)?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      const last = ACTIVITY_OPTIONS[ACTIVITY_OPTIONS.length - 1]!;
      selectActivity(last.ui);
      document.querySelector<HTMLButtonElement>(`[data-activity="${last.ui}"]`)?.focus();
    }
  }

  const childName = active.name && active.name.trim().length > 0 ? active.name : 'barnet';
  // Copy-fix (Guide-løftet tiltak 3, guide-analyse.md linje 68-69): "juster
  // fritt" rammet verktøyet som lekegrind. Instrument-tone i stedet.
  const subLine = needsOnboarding || !active.dob
    ? `${childName} · basert på været nå — juster og se svaret endre seg`
    : `${childName}, ${ageMonths} mnd · basert på været nå — juster og se svaret endre seg`;

  return (
    <main style={rootStyle} className="ba-temp-root" data-temp={tempAxis} aria-label="Finn antrekk">
      <h1 style={srOnlyStyle}>Finn antrekk for barnet ditt</h1>

      <header style={topbarStyle}>
        <button
          type="button"
          onClick={handleBack}
          aria-label="Tilbake"
          className="ba-press"
          style={backButtonStyle(reducedMotion)}
        >
          <svg width={9} height={15} viewBox="0 0 8 14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M7 1L1 7l6 6" />
          </svg>
        </button>
        <div style={titleWrapStyle}>
          <p style={titleStyle}>Finn antrekk</p>
          <p style={subtitleStyle}>{subLine}</p>
        </div>
      </header>

      <div style={scrollStyle} className="ba-scroll-native">

        {/* TEMP — R7 Task 3A: signatur-instrumentet (spec §3) erstatter
            generisk slider. Verdi-avlesningen (DM Serif) beholdes øverst;
            handleSliderChange-haptikken (bånd-kryssing) gjenbrukes uendret. */}
        <section aria-labelledby="finn-temp-label">
          <p id="finn-temp-label" style={eyebrowStyle}>Temperatur</p>
          <div style={tempValueWrapStyle}>
            <span style={tempValueStyle} aria-hidden>{formatTemp(tempC)}</span>
          </div>
          <TemperatureInstrument
            valueC={tempC}
            bandText={tempBandText}
            onChange={(v) => handleSliderChange('temp', tempBandText, setTempC, v)}
            height={280}
          />
        </section>

        {/* VIND */}
        <section aria-labelledby="finn-vind-label">
          <div style={sliderHeaderRow}>
            <p id="finn-vind-label" style={eyebrowStyle}>Vind</p>
            <span style={sliderValuePillStyle} aria-hidden>{windMs} m/s</span>
          </div>
          <input
            id="finn-vind-slider"
            type="range"
            min={0}
            max={15}
            step={1}
            value={windMs}
            onChange={(e) => handleSliderChange('vind', windBandText, setWindMs, Number(e.target.value))}
            aria-valuetext={`${windMs} meter per sekund, ${windBandText(windMs)}`}
            aria-labelledby="finn-vind-label"
            style={{ ...sliderStyle, ...sliderFillVars(windMs / 15, 'var(--ink-400)') }}
            className="finn-slider"
          />
          <div style={sliderScaleStyle}>
            <span>0</span>
            <span>15 m/s</span>
          </div>
        </section>

        {/* NEDBØR */}
        <section aria-labelledby="finn-nedbor-label">
          <div style={sliderHeaderRow}>
            <p id="finn-nedbor-label" style={eyebrowStyle}>Nedbør</p>
            <span style={sliderValuePillStyle} aria-hidden>{precipMmH.toFixed(1)} mm/t</span>
          </div>
          <input
            id="finn-nedbor-slider"
            type="range"
            min={0}
            max={10}
            step={0.5}
            value={precipMmH}
            onChange={(e) => handleSliderChange('nedbor', precipBandText, setPrecipMmH, Number(e.target.value))}
            aria-valuetext={`${precipMmH.toFixed(1)} millimeter per time, ${precipBandText(precipMmH)}`}
            aria-labelledby="finn-nedbor-label"
            style={{ ...sliderStyle, ...sliderFillVars(precipMmH / 10, 'var(--ink-400)') }}
            className="finn-slider"
          />
          <div style={sliderScaleStyle}>
            <span>0</span>
            <span>10 mm/t</span>
          </div>
        </section>

        {/* AKTIVITET — 2-knapps radiogroup med roving-tabindex */}
        <section aria-labelledby="finn-aktivitet-label">
          <p id="finn-aktivitet-label" style={eyebrowStyle}>Aktivitet</p>
          {/* F83: glidende pill (Hjem-segmented = fasit). ARIA byte-identisk:
              role=radiogroup + radio + roving tabindex + piltaster. aria-checked
              flipper umiddelbart på valg; pillen er aria-hidden dekor som
              glir etter (RM → ingen transition). A11y-preclearance vilkår 6. */}
          <div
            role="radiogroup"
            aria-labelledby="finn-aktivitet-label"
            style={activityRowStyle}
          >
            <span
              aria-hidden="true"
              style={activityPillStyle(activityUi === ACTIVITY_OPTIONS[1]!.ui, reducedMotion)}
            />
            {ACTIVITY_OPTIONS.map((opt, idx) => {
              const isActive = opt.ui === activityUi;
              return (
                <button
                  key={opt.ui}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  tabIndex={isActive ? 0 : -1}
                  data-activity={opt.ui}
                  onClick={() => selectActivity(opt.ui)}
                  onKeyDown={(e) => handleActivityKeyDown(e, idx)}
                  className="ba-press"
                  style={activityButtonStyle(isActive, reducedMotion)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* VERDIKT-HERO — fasit-tiltak 1+2 (guide-analyse.md linje 78-94).
            «N lag» som stort display-tall er dommen, ikke en fotnote.
            Tallet + hvorfor-linjen ligger i ÉN aria-live="polite"
            aria-atomic="true"-region (a11y-preclearance §5), debounced
            900ms. Kilde-linjen ligger UTENFOR denne regionen. */}
        <section aria-label="Antrekk-dom" style={verdictHeroStyle}>
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style={verdictLiveRegionStyle}
          >
            <p style={verdictNumberStyle}>
              <span ref={verdictNumRef} style={verdictNumberBig}>{displayLayerCount}</span>{' '}
              <span style={verdictNumberUnit}>lag</span>
            </p>
            <p style={verdictWhyStyle}>{displayWhyLine}.</p>
          </div>

          <button
            type="button"
            onClick={() => setWhyExpanded((v) => !v)}
            aria-expanded={whyExpanded}
            aria-controls="finn-why-details"
            className="ba-press"
            style={whyToggleStyle(reducedMotion)}
          >
            {whyExpanded ? 'Skjul hvorfor' : 'Vis hvorfor'}
            <ChevronDown expanded={whyExpanded} />
          </button>

          {whyExpanded && (
            <ul id="finn-why-details" role="list" style={whyDetailsListStyle}>
              {whyDetails.map((line, i) => (
                <li key={i} style={whyDetailItemStyle}>
                  {line}
                </li>
              ))}
            </ul>
          )}

          {/* Kilde-linje — UTENFOR live-regionen (a11y-preclearance §5).
              Troverdighet nivå 1 (guide-analyse.md linje 182-184). */}
          <p style={kildeLineStyle}>
            Basert på norske helsesøster-råd · TOG-standarden · vær fra met.no
          </p>
        </section>

        {/* OUTPUT — V2 Skannbar liste */}
        <section aria-labelledby="finn-output-label" style={outputSectionStyle}>
          <header style={outputHeaderStyle}>
            <h2 id="finn-output-label" style={outputTitleStyle}>Antrekket</h2>
            <span style={outputMetaStyle} aria-hidden>
              {selectedActivity.label.toLowerCase()} · {tempBandHeadline(tempC)}
            </span>
          </header>

          <div style={groupListStyle}>
              {GROUPS.map((group) => {
                const layers = grouped.get(group.key) ?? [];
                if (layers.length === 0) return null;
                const items = layers.flatMap((l) => l.items);
                return (
                  <section key={group.key} aria-labelledby={`group-${group.key}`}>
                    <h3 id={`group-${group.key}`} style={groupHeaderStyle}>
                      {group.label}
                    </h3>
                    <ul role="list" style={itemListStyle}>
                      {items.map((item, i) => {
                        const rowKey = `${group.key}-${i}-${item}`;
                        const isLast = i === items.length - 1;
                        const gid = garmentIdFor(item);
                        const isClickable = gid !== null;
                        return (
                          <li key={rowKey} style={itemLiStyle}>
                            <button
                              type="button"
                              ref={(el) => {
                                rowRefs.current[rowKey] = el;
                              }}
                              onClick={() => handleOpenPlagg(rowKey, item)}
                              disabled={!isClickable}
                              aria-label={`Vis detalj for ${capitalize(item)}`}
                              className="ba-row-press"
                              style={itemButtonStyle(group.color, isLast, isClickable)}
                            >
                              <span aria-hidden style={thumbStyle}>
                                <ItemThumb name={item} />
                              </span>
                              <span style={itemNameStyle}>{capitalize(item)}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
          </div>
        </section>
      </div>

      {/* Plagg-detalj (F62 PlaggDetailSheet) — focus returnerer til klikket rad-knapp. */}
      {openGarmentId && (
        <PlaggDetailSheet
          garmentId={openGarmentId}
          isOpen={openGarmentId !== null}
          onClose={handleClosePlagg}
          triggerRef={detailTriggerRef}
        />
      )}

      {/* Inline-CSS for slider thumb (44px+ touch-target). */}
      <style>{`
        .finn-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 28px;
          background: transparent;
          margin: 4px 0;
          padding: 0;
          touch-action: pan-y;
        }
        .finn-slider:focus { outline: none; }
        .finn-slider:focus-visible::-webkit-slider-thumb {
          outline: 3px solid var(--focus-ring);
          outline-offset: 2px;
        }
        .finn-slider:focus-visible::-moz-range-thumb {
          outline: 3px solid var(--focus-ring);
          outline-offset: 2px;
        }
        /* F83 termometer: fylt spor-del t.o.m. thumben (--fill settes inline
           per slider; temp bruker var(--accent-temp) = bånd-reaktiv farge,
           vind/nedbør nøytral ink-400). Ufylt del bevisst ink-200 — thumben
           (28px accent-cta + surface-ring) bærer affordancen (a11y-preclearance
           vilkår 2: thumb-spec/focus-ring uendret). */
        .finn-slider::-webkit-slider-runnable-track {
          height: 8px;
          background: linear-gradient(
            to right,
            var(--fill-color, var(--ink-400)) var(--fill, 0%),
            var(--ink-200) var(--fill, 0%)
          );
          border-radius: 999px;
        }
        .finn-slider::-moz-range-track {
          height: 8px;
          background: var(--ink-200);
          border-radius: 999px;
          border: 0;
        }
        .finn-slider::-moz-range-progress {
          height: 8px;
          background: var(--fill-color, var(--ink-400));
          border-radius: 999px;
        }
        .finn-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--accent-cta);
          border: 3px solid var(--surface);
          box-shadow: var(--shadow-cta);
          margin-top: -10px;
          cursor: pointer;
        }
        .finn-slider::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--accent-cta);
          border: 3px solid var(--surface);
          box-shadow: var(--shadow-cta);
          cursor: pointer;
        }
        .finn-slider:disabled::-webkit-slider-thumb {
          background: var(--ink-300);
          box-shadow: none;
          cursor: not-allowed;
        }
        .finn-slider:disabled::-moz-range-thumb {
          background: var(--ink-300);
          box-shadow: none;
          cursor: not-allowed;
        }
      `}</style>
    </main>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Subkomponenter
   ────────────────────────────────────────────────────────────────────────── */

/** Chevron for "Vis hvorfor"-ekspanderen — roterer 180° når åpen. */
function ChevronDown({ expanded }: { expanded: boolean }): ReactElement {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{
        flex: 'none',
        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 160ms ease',
      }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/** Item-thumbnail — bruker garmentIdFor → garmentPng, faller tilbake til
 *  emoji ved mismatch eller 404. */
function ItemThumb({ name }: { name: string }): ReactElement {
  const [errored, setErrored] = useState(false);
  const id = garmentIdFor(name);
  if (!id || errored) {
    return <span style={{ fontSize: 26, lineHeight: 1 }}>🧦</span>;
  }
  return (
    <img
      src={garmentPng(id)}
      alt=""
      onError={() => setErrored(true)}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        display: 'block',
      }}
    />
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   utils
   ────────────────────────────────────────────────────────────────────────── */

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ──────────────────────────────────────────────────────────────────────────
   Tokens
   ────────────────────────────────────────────────────────────────────────── */

const TOKENS = {
  bgCanvas: 'var(--bg-canvas)',
  surface: 'var(--surface)',
  orange500: 'var(--accent-cta)',
  orange100: 'var(--accent-cta)',
  orangeOn100: 'var(--terracotta-700)',
  ink900: 'var(--ink-900)',
  ink700: 'var(--ink-700)',
  ink500: 'var(--ink-500)',
  ink300: 'var(--ink-300)',
  hairline: 'var(--ink-100)',
  hairlineStrong: 'var(--ink-200)',
  fontSans: 'var(--font-sans)',
  fontSerif: 'var(--font-serif)',
  safeTop: 'env(safe-area-inset-top, 0px)',
  safeBottom: 'env(safe-area-inset-bottom, 0px)',
  easeStandard: 'var(--ease-standard)',
};

/* ──────────────────────────────────────────────────────────────────────────
   Styles
   ────────────────────────────────────────────────────────────────────────── */

const TOUCH_RESET: CSSProperties = {
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation',
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

const rootStyle: CSSProperties = {
  position: 'relative',
  minHeight: '100dvh',
  width: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  // F83: max()-gulv — WKWebView rapporterer env()≈0 (samme fix som HjemScreen
  // F80.3); uten gulv ligger topbaren bak iOS-statuslinjen.
  paddingTop: `max(50px, calc(${TOKENS.safeTop} + 12px))`,
  paddingBottom: TOKENS.safeBottom,
  fontFamily: TOKENS.fontSans,
  color: TOKENS.ink900,
  background: TOKENS.bgCanvas,
};

const topbarStyle: CSSProperties = {
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '6px 16px 14px',
};

function backButtonStyle(reduceMotion: boolean): CSSProperties {
  return {
    ...TOUCH_RESET,
    appearance: 'none',
    border: `1px solid ${TOKENS.hairline}`,
    background: TOKENS.surface,
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    flex: 'none',
    borderRadius: 12,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: TOKENS.ink900,
    padding: 0,
    transition: reduceMotion ? 'none' : `transform 160ms ${TOKENS.easeStandard}`,
  };
}

const titleWrapStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.25rem',
  fontWeight: 700,
  letterSpacing: '-0.4px',
  color: TOKENS.ink900,
  lineHeight: 1.1,
};

const subtitleStyle: CSSProperties = {
  margin: '1px 0 0',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: TOKENS.ink500,
  letterSpacing: 0.1,
};

const scrollStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: '0 16px 32px',
  display: 'flex',
  flexDirection: 'column',
  gap: 22,
};

const eyebrowStyle: CSSProperties = {
  fontSize: '0.6875rem',
  fontWeight: 600,
  letterSpacing: '1.4px',
  textTransform: 'uppercase',
  color: TOKENS.ink500,
  margin: '0 2px 10px',
};

/* ---- VERDIKT-HERO (fasit-tiltak 1+2) ---- */

const verdictHeroStyle: CSSProperties = {
  marginTop: 4,
  padding: '22px 18px 18px',
  borderRadius: 20,
  background: 'var(--surface)',
  border: `1px solid ${TOKENS.hairline}`,
  boxShadow: 'var(--shadow-2)',
  textAlign: 'center',
};

const verdictLiveRegionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
};

const verdictNumberStyle: CSSProperties = {
  margin: 0,
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'center',
  gap: 8,
};

const verdictNumberBig: CSSProperties = {
  fontFamily: TOKENS.fontSerif,
  fontSize: 'clamp(56px, 18vw, 76px)',
  fontWeight: 560,
  lineHeight: 1,
  letterSpacing: '-0.02em',
  fontVariantNumeric: 'tabular-nums',
  color: TOKENS.ink900,
};

const verdictNumberUnit: CSSProperties = {
  fontFamily: TOKENS.fontSerif,
  fontSize: '1.375rem',
  fontWeight: 420,
  color: TOKENS.ink700,
};

const verdictWhyStyle: CSSProperties = {
  margin: '2px 0 0',
  fontSize: '0.9375rem',
  fontWeight: 600,
  color: TOKENS.ink900,
  lineHeight: 1.4,
  maxWidth: '32ch',
};

function whyToggleStyle(reduceMotion: boolean): CSSProperties {
  return {
    ...TOUCH_RESET,
    appearance: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    margin: '14px auto 0',
    padding: '10px 16px',
    minHeight: 44,
    border: `1px solid ${TOKENS.hairlineStrong}`,
    borderRadius: 999,
    background: 'transparent',
    color: TOKENS.ink700,
    fontFamily: 'inherit',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: reduceMotion
      ? 'none'
      : `background 160ms ${TOKENS.easeStandard}, transform 160ms ${TOKENS.easeStandard}`,
  };
}

const whyDetailsListStyle: CSSProperties = {
  listStyle: 'none',
  margin: '14px 0 0',
  padding: '14px 4px 0',
  borderTop: `1px solid ${TOKENS.hairline}`,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  textAlign: 'left',
};

const whyDetailItemStyle: CSSProperties = {
  fontSize: '0.8125rem',
  color: TOKENS.ink700,
  lineHeight: 1.5,
};

const kildeLineStyle: CSSProperties = {
  margin: '16px 0 0',
  fontSize: '0.71875rem',
  color: TOKENS.ink500,
  lineHeight: 1.4,
};

/* ---- TEMP-verdi (DM Serif Display) ---- */

const tempValueWrapStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: 6,
};

const tempValueStyle: CSSProperties = {
  fontFamily: TOKENS.fontSerif,
  fontSize: 32,
  fontWeight: 400,
  fontVariantNumeric: 'tabular-nums',
  color: TOKENS.ink900,
  lineHeight: 1,
  letterSpacing: '-0.5px',
};

/* ---- Slider-shared ---- */

const sliderStyle: CSSProperties = {
  width: '100%',
  minHeight: 44,
};

/** F83: CSS-vars for fylt spor-del. Fraksjonen kompenserer for thumb-bredden
 *  (28px) så fyllet treffer thumb-senteret over hele domenet. */
function sliderFillVars(frac: number, color: string): CSSProperties {
  const f = Math.max(0, Math.min(1, frac));
  return {
    '--fill': `calc(14px + (100% - 28px) * ${f.toFixed(4)})`,
    '--fill-color': color,
  } as CSSProperties;
}

// R7 Task 3A: sliderTrackWrapStyle + frostTickStyle fjernet — temp-slideren
// er erstattet av TemperatureInstrument (bånd-markørene bor i instrumentet).

const sliderHeaderRow: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  marginBottom: 0,
};

const sliderValuePillStyle: CSSProperties = {
  fontFamily: TOKENS.fontSans,
  fontSize: '1.125rem',
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
  color: TOKENS.ink900,
  marginRight: 2,
  marginBottom: 10,
  letterSpacing: '-0.2px',
};

const sliderScaleStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.6875rem',
  color: TOKENS.ink500,
  marginTop: 2,
  fontVariantNumeric: 'tabular-nums',
};

/* ---- AKTIVITET ---- */

/* F83: glidende-pill-wrap (Hjem-segmented-mønsteret). */
const activityRowStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  padding: 4,
  borderRadius: 14,
  background: 'var(--surface-soft)',
  border: `1px solid ${TOKENS.hairline}`,
};

/** Dekorativ pill som glir under aktiv segment (aria-hidden). */
function activityPillStyle(second: boolean, reduceMotion: boolean): CSSProperties {
  return {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    width: 'calc(50% - 4px)',
    borderRadius: 10,
    background: 'var(--surface-pure)',
    boxShadow: 'var(--shadow-1)',
    transform: second ? 'translateX(100%)' : 'translateX(0)',
    transition: reduceMotion ? 'none' : `transform 280ms ${TOKENS.easeStandard}`,
    pointerEvents: 'none',
  };
}

function activityButtonStyle(active: boolean, reduceMotion: boolean): CSSProperties {
  return {
    ...TOUCH_RESET,
    appearance: 'none',
    position: 'relative',
    zIndex: 1,
    flex: 1,
    cursor: 'pointer',
    minHeight: 48,
    padding: '12px 14px',
    borderRadius: 10,
    border: 'none',
    background: 'transparent',
    color: active ? TOKENS.ink900 : TOKENS.ink700,
    fontFamily: 'inherit',
    fontSize: '0.875rem',
    fontWeight: active ? 700 : 600,
    letterSpacing: '-0.1px',
    textAlign: 'center',
    transition: reduceMotion ? 'none' : `color 160ms ${TOKENS.easeStandard}`,
  };
}

/* ---- OUTPUT-card (V2 skannbar) ---- */

const outputSectionStyle: CSSProperties = {
  marginTop: 4,
  background: TOKENS.surface,
  borderRadius: 16,
  border: `1px solid ${TOKENS.hairline}`,
  padding: '14px 14px 4px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const outputHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 10,
};

const outputTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.9375rem',
  fontWeight: 700,
  letterSpacing: '-0.2px',
  color: TOKENS.ink900,
};

const outputMetaStyle: CSSProperties = {
  fontSize: '0.6875rem',
  fontWeight: 600,
  letterSpacing: '0.8px',
  textTransform: 'uppercase',
  color: TOKENS.orangeOn100,
};

const groupListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const groupHeaderStyle: CSSProperties = {
  margin: '8px 0 4px',
  fontSize: '0.65625rem',
  fontWeight: 700,
  letterSpacing: '1.2px',
  textTransform: 'uppercase',
  color: TOKENS.ink500,
};

const itemListStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
};

const itemLiStyle: CSSProperties = {
  display: 'block',
  width: '100%',
};

function itemButtonStyle(
  stripeColor: string,
  isLast: boolean,
  isClickable: boolean,
): CSSProperties {
  return {
    ...TOUCH_RESET,
    appearance: 'none',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 4px 8px 14px',
    borderBottom: isLast ? '0' : `1px solid ${TOKENS.hairline}`,
    minHeight: 60,
    borderTop: 0,
    borderRight: 0,
    borderLeft: `3px solid ${stripeColor}`,
    background: 'transparent',
    width: '100%',
    cursor: isClickable ? 'pointer' : 'default',
    textAlign: 'left',
    color: TOKENS.ink900,
    fontFamily: 'inherit',
    fontSize: 'inherit',
  };
}

const thumbStyle: CSSProperties = {
  width: 60,
  height: 60,
  minWidth: 60,
  flex: 'none',
  borderRadius: 10,
  background: 'var(--ink-100)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
};

const itemNameStyle: CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 600,
  color: TOKENS.ink900,
  letterSpacing: '-0.1px',
  flex: 1,
  minWidth: 0,
};

export default FinnAntrekkScreen;
