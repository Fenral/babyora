/**
 * FinnAntrekkScreen — F80b PROD-PORT av "Morgennatt" + VERDIKT-HERO
 * (fasit-tiltaket, docs/F79/guide-analyse.md).
 *
 * P10/JOB4 (owner redesign, 2026-08-01): the "discovery-kalkulator" live-
 * update model (drag a slider, watch the answer change) is REPLACED by an
 * instrument-panel + CTA-driven model, matching the owner's explicit
 * rejection of the old mixed vertical-thermometer + two-horizontal-sliders
 * layout:
 *
 *  1. THREE VERTICAL GAUGES in one row (Temperatur/Vind/Nedbør) — same
 *     column structure top-to-bottom (uppercase label → tabular-nums value
 *     → vertical track with min/max at the ends → +/- 44pt fine-step
 *     buttons). See VerticalGauge.tsx. P10.2 (2026-08-01): each gauge now
 *     fills with its own MATERIAL (`material` prop) — Temperatur
 *     interpolates cold→warm colour from the live value itself (gauge-
 *     material.ts), Vind gets an airy fill (angled top + drag-only gust
 *     streaks), Nedbør gets a water-like fill (meniscus cap + one-shot
 *     WAAPI slosh on value change). Geometry stays identical across all
 *     three — see VerticalGauge.tsx's own header for the full breakdown.
 *  2. CTA-DRIVEN SCAN: adjusting sliders no longer recomputes the answer
 *     live. A "Finn antrekk" CTA (same amber CTA class as Hjem, `.hjm-cta`)
 *     sits below the activity toggle. Tapping it snapshots the CURRENT
 *     slider values and — eier-override v3, 2026-08-01 — runs the SAME
 *     full 3,2s scan-koreografi as Hjem (reusing `ScanOverlay` itself, with
 *     Juster-specific rows, in place of the instrument-panel gauges; see
 *     scan-orchestration.ts's `FULL_SCAN_DURATION_MS`/`fullScanHapticSchedule`
 *     — the P9 400ms mikropass this screen used to run is RETIRED). Once a
 *     result exists, touching ANY slider re-arms the CTA ("Beregn på
 *     nytt") and visually demotes (not hides) the existing result — same
 *     stale model HjemMonter already uses for its own result-stale phase.
 *  3. RESULT = THE CLOTHES: the answer is presented as numbered garment
 *     rows (reusing HjemMonter's own `MonterGarmentRow` + `deriveResultRows`
 *     — same vitrine-thumb presentation, same dressing order, same
 *     `hjem-monter.css` surface classes) plus a small raised explanation
 *     box (`.hjm-prev`, --dw-raised/14px radius/edge-light — already within
 *     the §6 monter-lys limit) holding the engine's own derived "why" copy
 *     (unchanged logic, still `buildWhyLine`/`buildWhyDetails` below).
 *
 * Everything NOT called out above (weather-seeded slider defaults, prefill/
 * SEED WINS, activity radiogroup + roving tabindex, PlaggDetailSheet
 * wiring, a11y valuetext vocabulary, haptic band-crossing ticks) is
 * unchanged from the pre-JOB4 version.
 *
 * Kilder (les FØR endring):
 *  - docs/F80/a11y-preclearance.md — §5: verdikt-hero aria-mønster
 *  - docs/F79/guide-analyse.md — fasit-autoritet-tiltak 1+2+3+5
 *  - docs/design-notes/sol-duel-2026-07-31.md — §2 (scan-koreografi, eier-
 *    override v3-notis øverst), §3 (haptikk-vokabular), §6 (monter-lys-
 *    restriksjon)
 *  - src/components/hjem/HjemMonter.tsx / scan-orchestration.ts / ScanOverlay.tsx
 *    — samme full-koreografi denne skjermen nå gjenbruker direkte (ScanOverlay
 *    er en delt komponent; kun radene/etikettene er Juster-spesifikke).
 *
 * Output-card bruker nå SAMME rad-presentasjon som Hjems resultatflate
 * (MonterGarmentRow/ResultSurface-mønsteret) i stedet for det tidligere
 * PaakledningScreen-inspirerte gruppert-per-kategori-mønsteret.
 *
 * Defaults hentes fra useWeather hvis tilgjengelig, ellers
 * -4° / 3 m/s / 0 mm/t / klarvær.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
} from 'react';
import { useChildren } from '../state/children-store';
import { useWeather } from '../hooks/useWeather';
import { useHapticSystem } from '../lib/haptics/system';
import {
  impactMedium,
  impactSoft,
  prepare as hapticPrepare,
  selection as hapticSelection,
} from '../lib/haptics.js';
import { useNativeSettings } from '../hooks/useNativeSettings';
import { dobToAgeMonths } from '../lib/utils/dob-to-age-months';
import { recommend } from '../lib/wool-layers/recommend';
import type { Activity } from '../lib/wool-layers/types';
import type { GarmentId } from '../data/garment-illustrations';
import { PlaggDetailSheet } from '../components/PlaggDetailSheet';
import { VerticalGauge } from '../components/instrument/VerticalGauge';
import {
  INSTRUMENT_MAX_C, INSTRUMENT_MIN_C, instrumentValueText, snapDegree,
} from '../components/instrument/instrument-logic';
import '../components/hjem/hjem-monter.css';
import { MonterGarmentRow } from '../components/hjem/MonterGarmentRow';
import { getGarmentImage } from '../lib/monter-assets';
import { deriveResultRows, type ResultRow } from '../components/hjem/result-rows';
import { ScanOverlay } from '../components/hjem/ScanOverlay';
import {
  FULL_SCAN_DURATION_MS,
  fullScanHapticSchedule,
} from '../components/hjem/scan-orchestration';
import { seedFromPrefill, type FinnAntrekkPrefill } from './finn-antrekk-prefill';
import {
  ctaLabelFor,
  nextPhaseAfterParamChange,
  resultDemotedFor,
  showCtaFor,
  showResultFor,
  type CalcPhase,
  type CommittedParams,
} from './finn-antrekk-calc';

export type { FinnAntrekkPrefill };

export type FinnAntrekkScreenProps = {
  onBack: () => void;
  /**
   * P5: present when the screen is opened as the "Juster" drill from Hjem's
   * cached result (WeatherStrip's Juster button / the weather-ready panel's
   * place pill) — seeds the sliders from the live weather + activity the
   * user was already looking at. SEED WINS over the screen's own internal
   * defaults AND its own useWeather() call (see finn-antrekk-prefill.ts).
   * Absent when opened standalone (no live-weather context to seed from).
   */
  prefill?: FinnAntrekkPrefill;
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

// P10.1 (judge finding C1): same engine value, same name everywhere — Hjem
// calls `utelek` "Utenfor vogn" (HjemMonter.tsx/WeatherScene.tsx's own
// ACTIVITY_TOGGLE_LABEL), this screen previously called the SAME engine
// value "Lek ute". Aligned to Hjem's vocabulary.
const ACTIVITY_OPTIONS: ActivityOption[] = [
  { ui: 'lek', label: 'Utenfor vogn', engine: 'utelek' },
  { ui: 'vogn', label: 'I vogn', engine: 'vogn' },
];

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
   Live-drevet (ikke committed) — rent visuelt canvas-hint, uavhengig av
   CTA-arming.
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
   Forklarings-boks — hvorfor-tekst (fasit-tiltak 2, guide-analyse.md linje
   82-85). Uendret avledningslogikk fra pre-JOB4: én alltid-synlig linje
   bygget av faktiske (nå: COMMITTED) parametre, pluss en fyldigere liste med
   regel-utslag til "Vis hvorfor"-ekspanderen. Ingen hedging.
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
  garmentCount: number,
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

  details.push(`Til sammen gir dette ${garmentCount} ${garmentCount === 1 ? 'plagg' : 'plagg'}, tilpasset ${tempBandHeadline(tempC)} vær.`);

  return details;
}

/* ──────────────────────────────────────────────────────────────────────────
   Ikoner
   ────────────────────────────────────────────────────────────────────────── */

function ArrowIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function CheckIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

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

/* ──────────────────────────────────────────────────────────────────────────
   Komponent
   ────────────────────────────────────────────────────────────────────────── */

const FALLBACK_LAT = 60.8867;
const FALLBACK_LON = 11.5614;

const GAUGE_HEIGHT = 208;

/**
 * P10.1 (judge finding C5): a SINGLE shared petrol/instrument fill for all
 * three gauges — wind/nedbør previously used `--dw-accent` (amber, a
 * USER-ACTION colour per DESIGN.md's colour-ownership table) on a WEATHER
 * DATA readout, and temperature used its own separate legacy
 * `--layer-bg-kald`/`--accent-temp`/`--layer-bg-varm` band ramp. Replaced
 * with the theme-constant petrol family (`--dw-panel`/`--dw-w-clear`) —
 * "consistent across all three ... temperature's legacy band colours
 * replaced too".
 *
 * P10.2 (2026-08-01): Temperatur's gauge now IGNORES these two (its
 * `material="thermal"` computes its own gradient from the live value —
 * see gauge-material.ts) — still passed for prop-shape consistency and as
 * the harmless fallback VerticalGauge uses when `material` is omitted.
 * Vind ('air') and Nedbør ('water') still use these petrol tokens as-is;
 * only their fill's decorative MATERIAL differs, not its colour.
 */
const GAUGE_FILL_BOTTOM = 'var(--dw-panel)';
const GAUGE_FILL_TOP = 'var(--dw-w-clear)';

export function FinnAntrekkScreen({ onBack, prefill }: FinnAntrekkScreenProps): ReactElement {
  const { active, needsOnboarding } = useChildren();
  const { fire } = useHapticSystem();
  const { reducedMotion } = useNativeSettings();
  const [whyExpanded, setWhyExpanded] = useState(false);

  const lat = active.lat || FALLBACK_LAT;
  const lon = active.lon || FALLBACK_LON;
  const weather = useWeather(lat, lon);

  // P5: SEED WINS — når skjermen åpnes som "Juster"-drillen fra Hjem, seedes
  // sliderne fra `prefill` (live vær Hjem allerede hadde) via LAZY
  // useState-initializere, slik at prefillet er selve FØRSTE render (ingen
  // default-så-overskriv-flash). seedFromPrefill() er ren/testet separat
  // (finn-antrekk-prefill.ts — komponentfiler kan ikke eksportere den selv,
  // se filens header). Uten prefill er seed uendret fra før: -4°/3 m/s/0 mm/t/Lek.
  const seed = seedFromPrefill(prefill);

  const [tempC, setTempC] = useState<number>(() => seed.tempC);
  const [windMs, setWindMs] = useState<number>(() => seed.windMs);
  const [precipMmH, setPrecipMmH] = useState<number>(() => seed.precipMmH);
  const [activityUi, setActivityUi] = useState<ActivityUi>(() => seed.activityUi);

  // Track om bruker har dratt slidere — etter første interaksjon skal vi ikke
  // overskrive verdier når weather oppdateres. Starter allerede `true` når et
  // prefill ble gitt: sliderne er ALT seedet fra Hjems levende vær, så
  // skjermens EGEN useWeather()-kall (linje over) skal ALDRI få overskrive
  // dem — selv om det lander med litt andre tall (annen fetch, samme sted).
  const [initedFromWeather, setInitedFromWeather] = useState(() => seed.initedFromWeather);

  // P10.1 (judge finding C9): the live met.no reading, captured ONCE and
  // held separately from the mutable slider state above — so it survives
  // as a stable gauge baseline marker even after the user drags a slider
  // away from it. `seed.initedFromWeather` true means `seed.*` already
  // WAS the live weather at seed time (SEED WINS, see the comment above).
  const [weatherBaseline, setWeatherBaseline] = useState<{ tempC: number; windMs: number; precipMmH: number } | null>(
    () => (seed.initedFromWeather ? { tempC: seed.tempC, windMs: seed.windMs, precipMmH: seed.precipMmH } : null),
  );

  /* ── Detalj-sheet state (F62 PlaggDetailSheet) ── */
  const [openGarmentId, setOpenGarmentId] = useState<GarmentId | null>(null);
  const detailTriggerRef = useRef<HTMLElement | null>(null);

  function handleOpenGarmentRow(row: ResultRow, event: ReactMouseEvent<HTMLButtonElement>): void {
    if (!row.garmentId) return;
    void fire('light');
    detailTriggerRef.current = event.currentTarget;
    setOpenGarmentId(row.garmentId as GarmentId);
  }

  function handleCloseDetail(): void {
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
    if (
      typeof now.tempC === 'number'
      && typeof now.windMs === 'number'
      && typeof now.precipMmH === 'number'
    ) {
      setWeatherBaseline({
        tempC: Math.round(now.tempC),
        windMs: Math.round(now.windMs),
        precipMmH: Math.round(now.precipMmH * 2) / 2,
      });
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

  // LIVE (ikke committed) — kun brukt til (a) motor-feil-vakt/CTA-disabled,
  // (b) data-temp-canvashintet. Vises ALDRI direkte — se P10/JOB4 filhode.
  const liveRecommendation = useMemo(() => {
    try {
      return recommend({
        weather: {
          tempC,
          feelsLikeC: tempC,
          windMs,
          precipMmH,
          symbolCode: symbolCodeFromPrecip(precipMmH),
        },
        child: { ageMonths },
        activity: selectedActivity.engine,
      });
    } catch {
      return null;
    }
  }, [tempC, windMs, precipMmH, ageMonths, selectedActivity]);

  // Logget motor-feil — ikke en gyldig tom-tilstand (tiltak 5: motoren
  // dekker hele slider-domenet, recommendation er kun null ved faktisk
  // motor-feil). Ingen hedging i UI.
  useEffect(() => {
    if (liveRecommendation) return;
    console.error('FinnAntrekk: recommend() feilet for gyldige slider-verdier', {
      tempC,
      windMs,
      precipMmH,
      activity: selectedActivity.engine,
    });
  }, [liveRecommendation, tempC, windMs, precipMmH, selectedActivity.engine]);

  const tempAxis = tempAxisFor(tempC);

  /* ── P10/JOB4, eier-override v3 (2026-08-01): CTA-drevet scan-tilstand ───
     idle → (trykk) → scanning → (3,2s full koreografi) → fresh
     fresh → (en slider/aktivitet endres) → stale → (trykk) → scanning → … */
  const [phase, setPhase] = useState<CalcPhase>('idle');
  const [committed, setCommitted] = useState<CommittedParams | null>(null);
  // Frosset ved selve trykket — ScanOverlay sine rader viser ALLTID denne
  // (aldri de live slider-verdiene), samme "berøring hopper til resultat,
  // spiller kun landingen"-prinsipp som kommentaren i handleFindOutfit
  // under beskriver. Sliderne er uansett unmountet (erstattet av
  // ScanOverlay) mens scanning pågår, så de kan ikke drifte i praksis —
  // snapshotet er likevel eksplisitt for å aldri stille implisitt på det.
  const [scanSnapshot, setScanSnapshot] = useState<CommittedParams | null>(null);

  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hapticTimerIdsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const clearScanTimers = useCallback(() => {
    if (scanTimerRef.current !== null) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    for (const id of hapticTimerIdsRef.current) clearTimeout(id);
    hapticTimerIdsRef.current = [];
  }, []);
  useEffect(() => clearScanTimers, [clearScanTimers]);

  // Re-arm: en committed resultat finnes, og MINST én av de fire
  // parametrene har endret seg siden det ble beregnet → tilbake til CTA,
  // resultatet forblir synlig (demotert), ikke skjult. React-anbefalt
  // "adjusting state when a value changes"-mønster (render-tids setState,
  // ikke i en effekt — samme idiom som HjemMonter sin `lastKnown`/`now` og
  // PaywallDialog sin `prevOpen`/`open`) — unngår react-hooks/
  // set-state-in-effect OG unngår et unødvendig ekstra flash-render.
  const [prevTrackedParams, setPrevTrackedParams] = useState<CommittedParams>(
    () => ({ tempC, windMs, precipMmH, activityUi }),
  );
  const trackedParamsChanged = prevTrackedParams.tempC !== tempC
    || prevTrackedParams.windMs !== windMs
    || prevTrackedParams.precipMmH !== precipMmH
    || prevTrackedParams.activityUi !== activityUi;
  if (trackedParamsChanged) {
    setPrevTrackedParams({ tempC, windMs, precipMmH, activityUi });
    const nextPhase = nextPhaseAfterParamChange(phase, committed, { tempC, windMs, precipMmH, activityUi });
    if (nextPhase !== phase) setPhase(nextPhase);
  }

  function handleFindOutfit(): void {
    if (phase === 'scanning') return;
    if (liveRecommendation === null) return;
    clearScanTimers();
    // Snapshot NÅ (trykk-tidspunktet) — duel §2: "berøring hopper til
    // resultat, spiller kun landingen"-prinsippet gjelder retningen, ikke
    // TIDSPUNKTET data hentes fra; scanningen prosesserer verdiene SLIK DE
    // VAR da brukeren trykket, ikke hva de måtte ha driftet til 3,2s senere.
    const snapshot: CommittedParams = { tempC, windMs, precipMmH, activityUi };
    setScanSnapshot(snapshot);
    setPhase('scanning');

    if (reducedMotion) {
      void hapticPrepare().then(() => { void impactMedium(); });
      setCommitted(snapshot);
      setPhase('fresh');
      return;
    }

    // Eier-override v3: samme fulle 3,2s-koreografi (og haptikk-skjema) som
    // Hjem — se scan-orchestration.ts's fullScanHapticSchedule. Avhukingene
    // (soft/selection) planlegges her; landingen (prepare+medium) eies av
    // fullføringstimeren under, samme arbeidsdeling som HjemMonter.tsx sin
    // egen completeScan/runPreLandingHapticSchedule-splitt.
    const preLanding = fullScanHapticSchedule(FULL_SCAN_DURATION_MS).filter(
      (event) => event.cue === 'soft' || event.cue === 'selection',
    );
    hapticTimerIdsRef.current = preLanding.map((event) => setTimeout(() => {
      if (event.cue === 'soft') void impactSoft();
      else void hapticSelection();
    }, event.atMs));

    scanTimerRef.current = setTimeout(() => {
      void hapticPrepare().then(() => { void impactMedium(); });
      setCommitted(snapshot);
      setPhase('fresh');
    }, FULL_SCAN_DURATION_MS);
  }

  const committedActivityOption = useMemo(
    () => (committed ? ACTIVITY_OPTIONS.find((a) => a.ui === committed.activityUi) ?? ACTIVITY_OPTIONS[0]! : null),
    [committed],
  );

  const committedRecommendation = useMemo(() => {
    if (!committed || !committedActivityOption) return null;
    try {
      return recommend({
        weather: {
          tempC: committed.tempC,
          feelsLikeC: committed.tempC,
          windMs: committed.windMs,
          precipMmH: committed.precipMmH,
          symbolCode: symbolCodeFromPrecip(committed.precipMmH),
        },
        child: { ageMonths },
        activity: committedActivityOption.engine,
      });
    } catch {
      return null;
    }
  }, [committed, committedActivityOption, ageMonths]);

  // RESULT = THE CLOTHES — samme avledning/presentasjon som Hjems egen
  // resultatflate (deriveResultRows + MonterGarmentRow, se filhode).
  const rows = useMemo(() => deriveResultRows(committedRecommendation), [committedRecommendation]);

  const committedWhyLine = useMemo(
    () => (committed ? buildWhyLine(committed.tempC, committed.windMs, committed.precipMmH, committed.activityUi) : ''),
    [committed],
  );
  const committedWhyDetails = useMemo(
    () => (committed
      ? buildWhyDetails(committed.tempC, committed.windMs, committed.precipMmH, committed.activityUi, rows.length)
      : []),
    [committed, rows.length],
  );

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
  // P5: drill-appropriate header — når skjermen er åpnet SOM "Juster"-
  // drillen (prefill gitt) heter den "Juster", ikke "Finn antrekk". Tilbake-
  // knappen selv er uendret (onBack er allerede satt opp av App.tsx til å
  // returnere til Hjems cachede resultat — se App.tsx sin Drill-union).
  const isDrillContext = prefill !== undefined;
  const screenTitle = isDrillContext ? 'Juster' : 'Finn antrekk';
  const placeSuffix = prefill?.placeLabel ? ` · ${prefill.placeLabel}` : '';
  // P10/JOB4: "juster og se svaret endre seg" fjernet — CTA-en (ikke live
  // sliderdrag) er nå det som faktisk beregner svaret.
  const subLine = needsOnboarding || !active.dob
    ? `${childName}${placeSuffix} · basert på været nå`
    : `${childName}, ${ageMonths} mnd${placeSuffix} · basert på været nå`;

  const ctaLabel = ctaLabelFor(phase);
  const showCta = showCtaFor(phase);
  const showResult = showResultFor(committed);
  const resultDemoted = resultDemotedFor(phase);
  // ScanOverlay sine Juster-rader under (kun rendret mens phase==='scanning')
  // leser ALLTID `scanSnapshot` — frosset ved selve trykket, se
  // handleFindOutfit. Fallbacken til de live verdiene er defensiv/aldri
  // reelt nådd (scanSnapshot settes alltid FØR phase blir 'scanning').
  const scanRows = scanSnapshot ?? { tempC, windMs, precipMmH, activityUi };

  return (
    <main style={rootStyle} className="ba-temp-root" data-temp={tempAxis} aria-label={screenTitle}>
      <h1 style={srOnlyStyle}>
        {isDrillContext ? 'Juster antrekket for barnet ditt' : 'Finn antrekk for barnet ditt'}
      </h1>

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
          <p style={titleStyle}>{screenTitle}</p>
          <p style={subtitleStyle}>{subLine}</p>
        </div>
      </header>

      {/* P10.1 (judge finding C3): the floating tab bar covered the last
          garment row in the result capture — reuses Hjem's OWN canonical
          scrollable-result vocabulary (`.hjm-result[data-scrollable='true']`,
          hjem-monter.css, already imported) for its doctrine bottom-fade
          mask + tabbar-clearance treatment, instead of a bespoke container
          that only had the clearance padding and no fade affordance. */}
      <div style={scrollStyle} className="ba-scroll-native hjm-result" data-scrollable="true">

        {/* INSTRUMENT-PANEL — tre likeverdige vertikale gauger (P10/JOB4:
            erstatter 1 vertikal termometer + 2 horisontale slidere, som
            eier eksplisitt underkjente). Samme kolonnestruktur topp-bunn i
            alle tre: etikett → verdi → vertikalt spor → +/- under.
            P10.1 (judge finding C5): gaugene ligger nå PÅ petrol-
            instrumentmaterialet (samme `--dw-panel`-flate + kantlys som
            `.hjm-panel`) — DESIGN.mds kjerneidé "petrol = vær/beregning" —
            i stedet for å flyte fritt på espresso-canvasen.
            Eier-override v3 (2026-08-01): mens phase==='scanning' erstatter
            den DELTE ScanOverlay-komponenten (samme fulle 3,2s-koreografi
            som Hjem) hele gauge-flaten, i stedet for det gamle 400ms-
            mikropasset som kun erstattet CTA-området (sliderne var da
            fortsatt synlige/interaktive). Sliderne rendres derfor ALDRI
            samtidig med scanningen nå — samme "hele panelet erstattes"-
            mønster som HjemMonter sin egen scanning-fase. */}
        {phase === 'scanning' ? (
          // `--hjm-shadow-panel` (ScanOverlay sin `.hjm-panel`) er scoped
          // til `.hjem-monter` i hjem-monter.css — denne skjermens rot bærer
          // ikke den klassen, se `gaugePanelStyle` sin egen kommentar under
          // for hvorfor. Wrapperen speiler samme token lokalt via en inline
          // CSS custom property, slik at ScanOverlay beholder løfteskyggen.
          <div style={{ '--hjm-shadow-panel': 'var(--dw-shadow-raise)' } as CSSProperties}>
            <ScanOverlay
              cityLabel={prefill?.placeLabel ?? childName}
              nuance="cloudy"
              rows={[
                { label: 'Temperatur', value: formatTemp(scanRows.tempC) },
                { label: 'Vind', value: `${scanRows.windMs} m/s` },
                { label: 'Nedbør', value: `${scanRows.precipMmH.toFixed(1)} mm/t` },
              ] as const}
              spinningLabel="Lag for lag"
              spinningValue="setter sammen…"
              totalDurationMs={FULL_SCAN_DURATION_MS}
              reducedMotion={reducedMotion}
              outfitTransitionStatus="idle"
            />
          </div>
        ) : (
          <section aria-labelledby="finn-instrument-label">
            <h2 id="finn-instrument-label" style={srOnlyStyle}>Vær-instrumenter</h2>
            {/* Reuses `.hjm-panel` (hjem-monter.css, already imported) for the
                petrol background/radius/edge-light `::before` — box-shadow is
                overridden inline since `.hjm-panel`'s own shadow token
                (`--hjm-shadow-panel`) is scoped to `.hjem-monter`, which this
                screen's root doesn't carry; `--dw-shadow-raise` is the
                equivalent GLOBAL, theme-aware token. */}
            <div className="hjm-panel" style={gaugePanelStyle}>
              <div style={gaugeRowStyle}>
                <VerticalGauge
                  label="Temperatur"
                  valueLabel={formatTemp(tempC)}
                  min={INSTRUMENT_MIN_C}
                  max={INSTRUMENT_MAX_C}
                  step={1}
                  value={snapDegree(tempC)}
                  onChange={(v) => handleSliderChange('temp', tempBandText, setTempC, v)}
                  ariaLabel="Temperatur i celsius"
                  ariaValueText={instrumentValueText(tempC, tempBandText(tempC))}
                  minLabel={`${INSTRUMENT_MIN_C}°`}
                  maxLabel={`${INSTRUMENT_MAX_C}°`}
                  fillBottomColor={GAUGE_FILL_BOTTOM}
                  fillTopColor={GAUGE_FILL_TOP}
                  material="thermal"
                  reducedMotion={reducedMotion}
                  incrementLabel="Én grad varmere"
                  decrementLabel="Én grad kaldere"
                  height={GAUGE_HEIGHT}
                  baselineValue={weatherBaseline?.tempC ?? null}
                  baselineLabel={weatherBaseline ? `Faktisk vær nå: ${formatTemp(weatherBaseline.tempC)}` : undefined}
                />
                <VerticalGauge
                  label="Vind"
                  valueLabel={`${windMs} m/s`}
                  min={0}
                  max={15}
                  step={1}
                  value={windMs}
                  onChange={(v) => handleSliderChange('vind', windBandText, setWindMs, v)}
                  ariaLabel="Vindstyrke i meter per sekund"
                  ariaValueText={`${windMs} meter per sekund, ${windBandText(windMs)}`}
                  minLabel="0"
                  maxLabel="15 m/s"
                  fillBottomColor={GAUGE_FILL_BOTTOM}
                  fillTopColor={GAUGE_FILL_TOP}
                  material="air"
                  reducedMotion={reducedMotion}
                  incrementLabel="Sterkere vind"
                  decrementLabel="Svakere vind"
                  height={GAUGE_HEIGHT}
                  baselineValue={weatherBaseline?.windMs ?? null}
                  baselineLabel={weatherBaseline ? `Faktisk vær nå: ${weatherBaseline.windMs} m/s` : undefined}
                />
                <VerticalGauge
                  label="Nedbør"
                  valueLabel={`${precipMmH.toFixed(1)} mm/t`}
                  min={0}
                  max={10}
                  step={0.5}
                  value={precipMmH}
                  onChange={(v) => handleSliderChange('nedbor', precipBandText, setPrecipMmH, v)}
                  ariaLabel="Nedbør i millimeter per time"
                  ariaValueText={`${precipMmH.toFixed(1)} millimeter per time, ${precipBandText(precipMmH)}`}
                  minLabel="0"
                  maxLabel="10 mm/t"
                  fillBottomColor={GAUGE_FILL_BOTTOM}
                  fillTopColor={GAUGE_FILL_TOP}
                  material="water"
                  reducedMotion={reducedMotion}
                  incrementLabel="Mer nedbør"
                  decrementLabel="Mindre nedbør"
                  height={GAUGE_HEIGHT}
                  baselineValue={weatherBaseline?.precipMmH ?? null}
                  baselineLabel={weatherBaseline ? `Faktisk vær nå: ${weatherBaseline.precipMmH.toFixed(1)} mm/t` : undefined}
                />
              </div>
            </div>
          </section>
        )}

        {/* AKTIVITET — 2-knapps radiogroup med roving-tabindex */}
        <section aria-labelledby="finn-aktivitet-label">
          <p id="finn-aktivitet-label" style={eyebrowStyle}>Aktivitet</p>
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

        {/* CTA-DREVET SCAN (P10/JOB4) — «Finn antrekk» / «Beregn på nytt».
            Skjules helt når resultatet allerede er ferskt (speiler Hjems
            egen result-current: ingen CTA når svaret allerede stemmer) OG
            mens phase==='scanning' (showCtaFor returnerer false der — den
            fulle koreografien over, ikke dette området, kommuniserer
            scanning-tilstanden nå, eier-override v3). */}
        {showCta ? (
          <div>
            <button
              type="button"
              className="hjm-cta"
              onClick={handleFindOutfit}
              disabled={liveRecommendation === null}
            >
              {ctaLabel}
              <ArrowIcon />
            </button>
            <p className="hjm-trust">
              <CheckIcon />
              Temperatur, vind og nedbør vurderes sammen
            </p>
          </div>
        ) : null}

        {/* RESULT = THE CLOTHES — numrerte plaggrader (samme presentasjon
            som Hjems ResultSurface) + en liten hevet forklaringsboks. Vises
            kun etter FØRSTE fullførte beregning; demotert (ikke skjult) når
            sliderne er endret siden.
            P10.1 (judge finding C2): headeren MÅ beskrive det COMMITTED
            resultatet (samme snapshot `rows` selv er avledet fra), aldri
            den LIVE `selectedActivity` — ellers kan meta-linjen påstå en
            aktivitet raden under ikke faktisk er beregnet for (f.eks. rett
            etter at brukeren har endret aktivitet-toggeln uten å trykke
            «Beregn på nytt» ennå). `committedActivityOption` finnes alltid
            når `showResult` er sann (begge avledes fra samme `committed`). */}
        {showResult && (
          <section aria-labelledby="finn-output-label" style={resultOpacityStyle(resultDemoted, reducedMotion)}>
            <div style={outputHeaderStyle}>
              <h2 id="finn-output-label" style={outputTitleStyle}>Antrekket</h2>
              <span style={outputMetaStyle} aria-hidden>
                {rows.length} plagg · {(committedActivityOption ?? selectedActivity).label.toLowerCase()}
              </span>
            </div>

            <ol className="hjm-rows" data-fresh={phase === 'fresh' && !reducedMotion ? 'true' : 'false'}>
              {rows.map((row) => (
                <MonterGarmentRow
                  key={row.key}
                  position={row.position}
                  label={row.label}
                  roleLabel={row.roleLabel}
                  imageSrc={getGarmentImage(row.garmentId)}
                  onSwap={(event) => handleOpenGarmentRow(row, event)}
                  animationDelayMs={null}
                />
              ))}
            </ol>

            <div className="hjm-prev" style={explanationBoxStyle}>
              <span className="hjm-p-label">HVORFOR</span>
              <p className="hjm-p-text">{committedWhyLine}.</p>

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
                  {committedWhyDetails.map((line, i) => (
                    <li key={i} style={whyDetailItemStyle}>
                      {line}
                    </li>
                  ))}
                </ul>
              )}

              <p style={kildeLineStyle}>
                Basert på norske helsesøster-råd · TOG-standarden · vær fra met.no
              </p>
            </div>
          </section>
        )}
      </div>

      {/* Plagg-detalj (F62 PlaggDetailSheet) — focus returnerer til klikket rad-knapp. */}
      {openGarmentId && (
        <PlaggDetailSheet
          garmentId={openGarmentId}
          isOpen={openGarmentId !== null}
          onClose={handleCloseDetail}
          triggerRef={detailTriggerRef}
        />
      )}
    </main>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Tokens
   ────────────────────────────────────────────────────────────────────────── */

const TOKENS = {
  bgCanvas: 'var(--bg-canvas)',
  surface: 'var(--surface)',
  ink900: 'var(--ink-900)',
  ink700: 'var(--ink-700)',
  ink500: 'var(--ink-500)',
  hairline: 'var(--ink-100)',
  fontSans: 'var(--font-sans)',
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
  padding: '0 16px',
  // P10 (Juster clearance, folded into JOB4): this screen owns its own
  // internal scroll container (like .hjem-monter, see hjem-monter.css's own
  // comment) — it can't rely on `.app-shell > main`'s padding-bottom alone,
  // since THIS div (not the outer <main>) is the element that actually
  // scrolls. Same --dw-tabbar-clearance token as P8's `.app-shell > main`
  // rule, added on top of the screen's own 32px breathing room.
  paddingBottom: 'calc(32px + var(--dw-tabbar-clearance, 90px))',
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

/* ---- Instrument-panel-rad (P10/JOB4, revised P10.1 finding C5) ---- */

/** The petrol instrument-panel material the three gauges now sit ON —
 *  `.hjm-panel` (hjem-monter.css) supplies background/radius/edge-light;
 *  this overrides ONLY box-shadow (see the JSX comment on why) and adds
 *  this call-site's own spacing. */
const gaugePanelStyle: CSSProperties = {
  position: 'relative',
  boxShadow: '0 1px 0 rgba(242, 192, 138, 0.14) inset, var(--dw-shadow-raise)',
};

const gaugeRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'space-between',
  gap: 10,
};

/* ---- Forklarings-boks / "Vis hvorfor" ---- */

function whyToggleStyle(reduceMotion: boolean): CSSProperties {
  return {
    ...TOUCH_RESET,
    appearance: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    margin: '10px auto 0',
    padding: '10px 16px',
    minHeight: 44,
    border: '1px solid rgba(241, 233, 218, 0.16)',
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
  margin: '12px 0 0',
  padding: '12px 2px 0',
  borderTop: '1px solid rgba(241, 233, 218, 0.1)',
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
  margin: '14px 0 0',
  fontSize: '0.71875rem',
  color: TOKENS.ink500,
  lineHeight: 1.4,
};

const explanationBoxStyle: CSSProperties = {
  marginTop: 12,
};

function resultOpacityStyle(demoted: boolean, reduceMotion: boolean): CSSProperties {
  return {
    opacity: demoted ? 0.55 : 1,
    transition: reduceMotion ? 'none' : 'opacity 160ms ease',
  };
}

/* ---- AKTIVITET ---- */

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

/* ---- OUTPUT-header (RESULT = THE CLOTHES) ---- */

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
  color: TOKENS.ink500,
};

export default FinnAntrekkScreen;
