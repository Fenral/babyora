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
import {
  type CSSProperties,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { motion } from 'motion/react';
import type { TabKey } from '../types/nav';
import { useChildren } from '../state/children-store';
import { useWeather } from '../hooks/useWeather';
import { useHapticSystem } from '../lib/haptics/system';
import { useNativeSettings } from '../hooks/useNativeSettings';
import { recommend } from '../lib/wool-layers/recommend';
import { applySwapsFinalized } from '../lib/wool-layers/finalize-safety';
import { DISCLAIMER_SHORT } from '../lib/copy/disclaimer';
import { verifiedAvatarAsset } from '../lib/recommendation/verified-avatar';
import { avatarPng, headwearFromRecommendation, tierFromRecommendation } from '../lib/avatar-tier';
import type { Recommendation, RecommendInput } from '../lib/wool-layers/types';
import { dobToAgeMonths } from '../lib/utils/dob-to-age-months';
import { displayNameForDbString } from '../data/garment-display-names';
// Gamle A1-A7-PNG-ene er byttet ut med clay-verdenen fra F79/F80.
// tier/headwear-logikken GJENBRUKES for å velge riktig clay-antrekk:
// hodeplagg + vær-tier på avataren er kjernesignalet.
import { tempAxisFor } from '../lib/temp-axis';
import { deriveSceneModelFromLegacy } from '../lib/recommendation/scene';
import { VerifiedAvatarComposite } from '../components/outfit/VerifiedAvatarComposite';
import { GarmentThumbnail } from '../components/outfit/GarmentThumbnail';
import { LivingHomeAtmosphere } from '../components/LivingHomeAtmosphere';
// BottomTabBar er global (mounted i App.tsx) — ikke importer/mount her.
import { MOTION } from '../styles/motion-grammar';
import { useSwapOverride } from '../state/swap-override-store';
import { useLocationPref, resolveEffectivePlace } from '../state/location-pref-store';
import { useAccess } from '../lib/premium/use-access';
import { resolveRuntimeCapabilityAccess } from '../lib/premium/gating';
import { PLUS_FEATURE_AVAILABILITY } from '../lib/premium/plus-features';
import { useSubscription } from '../state/subscription-store';
import {
  createCurrentOutfitContext,
  PLAN_TIME_ZONE,
  type PlannedOutfitContext,
} from '../lib/planning/planned-outfit-context';
import type { OutfitBundleProducerResult } from '../lib/outfit/outfit-bundle-producer';
import type {
  Phase2HomeSourceDescriptor,
  Phase2HomeSourceSelection,
  Phase2TransitionAdapter,
  RegisterHomeAnchor,
} from '../lib/outfit-transition/phase2-adapter';
import type { OutfitTransitionCoordinatorState } from '../lib/outfit-transition/coordinator';
// P4 (Monter): flag-gated new render tree. Read directly (not copied to a
// module-local const) so `vi.mock('../components/hjem/flags.js', ...)` can
// force the legacy branch in tests without touching anything else here.
import { HJEM_SCAN_UI_ENABLED } from '../components/hjem/flags';
import { HjemMonter } from '../components/hjem/HjemMonter';
import type { FinnAntrekkPrefill } from './finn-antrekk-prefill';

// ─────────────────────────────────────────────────────────────────────────────
// Konstanter / fallback
// ─────────────────────────────────────────────────────────────────────────────

const ELVERUM = { lat: 60.8867, lon: 11.5614, city: 'Elverum' };

// R3 (2026-07-14): tempAxisFor/stageSrc er flyttet til src/lib/temp-axis.ts
// og src/lib/avatar-stage.ts (react-refresh: komponentfiler eksporterer kun
// komponenter). Samme funksjoner, samme adferd.

type Activity = 'utelek' | 'vogn';
type VognMode = 'awake' | 'sleeping';

/**
 * onOpenSheet aksepterer en context-payload slik at popupen får SAMME
 * recommendation som Hjem allerede har beregnet (inkl. swap-overrides) +
 * gjeldende activity / vognMode. Uendret fra forrige iter.
 */
type HjemScreenProps = {
  onNavigate: (tab: TabKey) => void;
  onOpenSheet: (
    ctx: PlannedOutfitContext,
    origin: HTMLButtonElement,
    bundle: OutfitBundleProducerResult | undefined,
  ) => void;
  createCurrentOutfitBundle: (
    ctx: PlannedOutfitContext,
  ) => OutfitBundleProducerResult | undefined;
  selectHomeSources: Phase2TransitionAdapter['selectHomeSources'];
  registerHomeAnchor: RegisterHomeAnchor;
  observeTransitionBundle: (
    bundle: OutfitBundleProducerResult | undefined,
  ) => void;
  /**
   * P4 (Monter): outfit-transition-koordinatorens status, KUN brukt til å
   * garantere at ScanOverlay aldri rendres samtidig med en pågående
   * garment-flyv-transition (se ScanOverlay.tsx sin isScanOverlaySuppressed).
   * Selve koordinator-hooken (useOutfitTransitionCoordinator, App.tsx) er
   * uendret av denne pakken — dette er kun en ny status-avlesning videreført
   * som prop, samme mønster som selectHomeSources/registerHomeAnchor over.
   */
  outfitTransitionStatus: OutfitTransitionCoordinatorState['status'];
  /**
   * P5: opens the "Juster" drill (FinnAntrekkScreen) with a live-weather
   * prefill — threaded straight through to HjemMonter, which wires it to
   * WeatherStrip's Juster button + the weather-ready panel's place pill.
   */
  onOpenAdjust: (prefill: FinnAntrekkPrefill) => void;
  /** P5: "Hvorfor akkurat dette?" contextual entry — same callback App.tsx already threads into PaakledningScreen. */
  onOpenWarmColdGuide: () => void;
  /**
   * P6: opens the Plaggbibliotek drill — threaded straight through to
   * HjemMonter, which wires it as PlaggDetailSheet's "Se alternativer i
   * biblioteket" affordance AND as the no-dead-end fallback for a "Bytt" row
   * whose garmentId never resolved.
   */
  onOpenPlaggbib: () => void;
};

const MAX_HOME_GARMENT_PILLS = 5;

function RegisteredHomeGarmentPill({
  source,
  style,
  registerHomeAnchor,
}: Readonly<{
  source: Phase2HomeSourceDescriptor;
  style: CSSProperties;
  registerHomeAnchor: RegisterHomeAnchor;
}>) {
  const register = useCallback(
    (element: HTMLSpanElement | null) => {
      registerHomeAnchor(source.itemId, element);
    },
    [source.itemId, registerHomeAnchor],
  );

  return (
    <span
      ref={register}
      data-outfit-transition-source={source.itemId}
      style={{ ...style, alignItems: 'center', display: 'inline-flex', gap: 6 }}
    >
      <GarmentThumbnail
        label={source.label}
        style={{ blockSize: 24, inlineSize: 24, flex: '0 0 24px', objectFit: 'contain' }}
      />
      {/* T1A: synlig tekst via visningsnavn — thumbnail beholder rå label. */}
      <span>{displayNameForDbString(source.label)}</span>
    </span>
  );
}

export function HomeGarmentPills({
  selection,
  fallbackAnchors,
  registerHomeAnchor,
  styleForIndex,
}: Readonly<{
  selection: Phase2HomeSourceSelection;
  fallbackAnchors: readonly Readonly<{ label: string }>[];
  registerHomeAnchor: RegisterHomeAnchor;
  styleForIndex: (index: number, count: number) => CSSProperties;
}>) {
  const fallbackPills = fallbackAnchors.length > MAX_HOME_GARMENT_PILLS
    ? [
      ...fallbackAnchors.slice(0, MAX_HOME_GARMENT_PILLS - 1),
      { label: `+ ${fallbackAnchors.length - (MAX_HOME_GARMENT_PILLS - 1)} plagg` },
    ]
    : fallbackAnchors;
  if (
    selection.kind !== 'ready'
    || selection.sources.length > MAX_HOME_GARMENT_PILLS
    || (
      fallbackAnchors.length > 0
      && fallbackPills.length <= MAX_HOME_GARMENT_PILLS
      && selection.sources.length !== fallbackAnchors.length
    )
  ) {
    return fallbackPills.map((anchor, index) => (
      <span
        key={`${anchor.label}:${index}`}
        style={{ ...styleForIndex(index, fallbackPills.length), alignItems: 'center', display: 'inline-flex', gap: 6 }}
      >
        <GarmentThumbnail
          label={anchor.label}
          style={{ blockSize: 24, inlineSize: 24, flex: '0 0 24px', objectFit: 'contain' }}
        />
        {/* T1A: synlig tekst via visningsnavn — thumbnail beholder rå label. */}
        <span>{displayNameForDbString(anchor.label)}</span>
      </span>
    ));
  }

  return selection.sources.map((source, index) => (
    <RegisteredHomeGarmentPill
      key={source.itemId}
      source={source}
      style={styleForIndex(index, selection.sources.length)}
      registerHomeAnchor={registerHomeAnchor}
    />
  ));
}

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
 * R7 Task 4: layerCount + stageForRecommendation fjernet — scenemodellen
 * (deriveSceneModelFromLegacy) eier avledningen, og silhuetten erstatter
 * clay-stagene til R8-manifestet er godkjent.
 */

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

export function HjemScreen({
  onNavigate: _onNavigate,
  onOpenSheet,
  createCurrentOutfitBundle,
  selectHomeSources,
  registerHomeAnchor,
  observeTransitionBundle,
  outfitTransitionStatus,
  onOpenAdjust,
  onOpenWarmColdGuide,
  onOpenPlaggbib,
}: HjemScreenProps) {
  // _onNavigate beholdes i signaturen (App passer den), men brukes ikke lokalt
  // siden BottomTabBar nå mountes globalt i App.tsx.
  void _onNavigate;
  const { active, needsOnboarding } = useChildren();
  const { reducedMotion } = useNativeSettings();
  const { fire } = useHapticSystem();
  // Swap-overrides for plagg-bytter (session-only) — driver avatar-tier
  // hvis Sivert har byttet base-laget i popupen. Uendret fra forrige iter.
  const swaps = useSwapOverride((s) => s.swaps);
  const locationMode = useLocationPref((state) => state.mode);
  const automaticPlace = useLocationPref((state) => state.automaticPlace);
  const { isPremium, loading: accessLoading } = useAccess();

  const fixedHome = !needsOnboarding ? {
    childId: active.id,
    city: active.city,
    lat: active.lat,
    lon: active.lon,
  } : {
    childId: '__fallback__',
    city: ELVERUM.city,
    lat: ELVERUM.lat,
    lon: ELVERUM.lon,
  };
  const locationAccess = resolveRuntimeCapabilityAccess(
    'automatic_location',
    { isPlus: isPremium, authenticated: false, loading: accessLoading },
    PLUS_FEATURE_AVAILABILITY,
  );
  const effectivePlace = resolveEffectivePlace(
    fixedHome,
    locationMode,
    locationAccess,
    automaticPlace,
  );
  const lat = effectivePlace?.lat ?? 0;
  const lon = effectivePlace?.lon ?? 0;
  const cityLabel = effectivePlace === null
    ? 'Sted mangler'
    : effectivePlace.source === 'automatic'
      ? `Nåværende sted · ${effectivePlace.city}`
      : `Fast sted · ${effectivePlace.city}`;

  // P5: manual weather-refetch trigger for the offline ask-block's "Prøv å
  // hente været igjen" (HjemMonter → onRetryWeather). useWeather's refreshKey
  // param already existed (4th positional arg) — this is the first call site
  // to actually drive it; bumping it re-runs the hook's fetch effect with the
  // SAME fetchKey (identity unchanged), replacing whatever offline/error
  // state is cached with a fresh attempt. The hook itself lives in
  // src/hooks/ (not an engine dir) and is untouched by this change.
  const [weatherRefreshKey, setWeatherRefreshKey] = useState(0);
  const weather = useWeather(lat, lon, 12, weatherRefreshKey, {
    cacheScope: effectivePlace?.cacheScope ?? 'persistent',
    source: effectivePlace?.source ?? 'fixed-home',
  }, effectivePlace !== null);
  const handleRetryWeather = useCallback(() => {
    setWeatherRefreshKey((key) => key + 1);
  }, []);
  const [activity, setActivity] = useState<Activity>('utelek');
  // Søvn/våken-toggle på vogn fjernet (Sivert: ikke viktig nok). Antar våken.
  const vognMode: VognMode = 'awake';

  const ageMonths = useMemo(
    () => (!needsOnboarding ? dobToAgeMonths(active.dob) : 0),
    [active.dob, needsOnboarding],
  );

  // R2 (2026-07-14): motor-input som eget memo slik at samme input kan gis
  // videre til den endelige sikkerhetsgrensen ved session-swaps.
  const engineInput = useMemo<RecommendInput | null>(() => {
    if (!weather.now) return null;
    return {
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
    };
  }, [weather.now, ageMonths, activity, vognMode]);

  const recommendation = useMemo<Recommendation | null>(() => {
    if (!engineInput) return null;
    try {
      return recommend(engineInput);
    } catch {
      return null;
    }
  }, [engineInput]);

  /**
   * Swap-resolved recommendation: items erstattes per session-swap-store.
   * Brukt av avatar-tier-utvelgelse, lag-tall og popup-context, slik at
   * Sivert ser umiddelbar konsistens mellom valg, avatar og «N lag».
   *
   * R2 (2026-07-14): skjermen konstruerer ALDRI trusted Recommendation ved
   * lokal array-mapping — swaps går gjennom applySwapsFinalized, der den
   * endelige sikkerhetsgrensen (conflicts → soft-blocks → hard-safety) har
   * siste ord om hva en swap kan gjeninnføre.
   */
  const resolvedRecommendation = useMemo<Recommendation | null>(() => {
    if (!recommendation || !engineInput) return recommendation;
    return applySwapsFinalized(engineInput, recommendation, swaps);
  }, [recommendation, engineInput, swaps]);

  // P2 hard paywall (PRODUCT.md, 2026-07-31): Hjem er der «den første reelle
  // anbefalingen» faktisk vises — scenen under rendrer resolvedRecommendation
  // direkte (sceneModel.headline + garment-pills), uten noen egen
  // isPremium-sjekk (bevisst — dette ER bootstrap-visningen som senere
  // avgjør om AppPaywallGate skal slå inn). markFirstRecommendationSeen()
  // er selv idempotent (setter kun ved første kall), så denne effekten kan
  // trygt fyre på nytt ved hver ny anbefaling uten å skrive over tidspunktet.
  const markFirstRecommendationSeen = useSubscription((s) => s.markFirstRecommendationSeen);
  useEffect(() => {
    if (resolvedRecommendation === null) return;
    markFirstRecommendationSeen();
  }, [resolvedRecommendation, markFirstRecommendationSeen]);

  const currentOutfitContext = useMemo<PlannedOutfitContext | null>(() => {
    const now = weather.now;
    const evaluatedAt = weather.evidence?.metadata.evaluatedAt;
    if (
      !now
      || !engineInput
      || !resolvedRecommendation
      || effectivePlace === null
      || evaluatedAt === undefined
      || !Number.isInteger(ageMonths)
      || ageMonths < 0
      || ageMonths > 24
    ) {
      return null;
    }
    const orderedGarments = resolvedRecommendation.layers
      .filter((layer) => layer.category !== 'utstyr')
      .flatMap((layer) => layer.items);
    const equipment = resolvedRecommendation.layers
      .filter((layer) => layer.category === 'utstyr')
      .flatMap((layer) => layer.items);
    if (orderedGarments.length === 0) return null;
    const fingerprint = `current-finalized:${JSON.stringify([
      orderedGarments,
      equipment,
      now.tempC,
      now.feelsLikeC,
      now.windMs,
      now.precipMmH,
      now.symbolCode,
    ])}`;
    const evaluatedAtIso = new Date(evaluatedAt).toISOString();
    try {
      return createCurrentOutfitContext({
        planningEventId: `current-event:${evaluatedAtIso}:${fingerprint}`,
        transitionContextId: `current-transition:${evaluatedAtIso}:${fingerprint}`,
        child: {
          id: active.id,
          name: active.name,
          ageMonths,
        },
        plannedForIso: evaluatedAtIso,
        timeZone: PLAN_TIME_ZONE,
        place: {
          label: cityLabel,
          lat,
          lon,
          source: effectivePlace.source,
        },
        activity,
        vognMode: activity === 'vogn' ? vognMode : null,
        weather: {
          tempC: now.tempC,
          feelsLikeC: now.feelsLikeC,
          windMs: now.windMs,
          precipMmH: now.precipMmH,
          symbolCode: now.symbolCode,
        },
        recommendInput: engineInput,
        finalizedRecommendation: resolvedRecommendation,
        access: {
          capability: 'today_home',
          allowed: true,
          reason: 'free',
        },
      });
    } catch {
      return null;
    }
  }, [
    active.id,
    active.name,
    activity,
    ageMonths,
    cityLabel,
    engineInput,
    effectivePlace,
    lat,
    lon,
    resolvedRecommendation,
    vognMode,
    weather.evidence?.metadata.evaluatedAt,
    weather.now,
  ]);

  const currentOutfitBundle = useMemo(
    () => (
      currentOutfitContext === null
        ? undefined
        : createCurrentOutfitBundle(currentOutfitContext)
    ),
    [createCurrentOutfitBundle, currentOutfitContext],
  );
  const homeSourceSelection = useMemo(
    () => selectHomeSources(currentOutfitBundle),
    [currentOutfitBundle, selectHomeSources],
  );
  useEffect(() => {
    observeTransitionBundle(currentOutfitBundle);
  }, [currentOutfitBundle, observeTransitionBundle]);

  const handleActivityChange = (next: Activity) => {
    if (next === activity) return;
    setActivity(next);
    void fire('selection');
  };

  const handleCta = (event: MouseEvent<HTMLButtonElement>) => {
    if (!currentOutfitContext) return;
    void fire('medium');
    onOpenSheet(
      currentOutfitContext,
      event.currentTarget,
      currentOutfitBundle,
    );
  };

  // ─── Avledede verdier ─────────────────────────────────────────────────────

  const now = weather.now;
  const isWeatherLoading = now === null || now === undefined;
  const conditionLabelText = symbolToLabel(now?.symbolCode);
  const tempAxis = tempAxisFor(now?.feelsLikeC, now?.tempC);

  const weatherIcon = weatherIconFor(now?.symbolCode);

  // R7 Task 4 — retning B: scenemodellen (dominant svar + ytterste synlige
  // ankere) avledes fra den swap-finaliserte legacy-anbefalingen så lenge
  // kohortflaggene er av. Ingen lokal telling/parafrase.
  const sceneModel = useMemo(
    () => (resolvedRecommendation
      ? deriveSceneModelFromLegacy(resolvedRecommendation)
      : { headline: 'Dagens antrekk', anchors: [], outerBodyLabel: null }),
    [resolvedRecommendation],
  );
  const allGarmentLabels = useMemo(
    () => resolvedRecommendation?.layers.flatMap((layer) => layer.items) ?? [],
    [resolvedRecommendation],
  );
  // T1A: rå motor-strenger beholdes for oppslag (GarmentThumbnail); de
  // BRUKERSYNLIGE pill-/sr-tekstene bruker kanoniske visningsnavn.
  const visibleAnchorLabels = allGarmentLabels.length > 0
    ? allGarmentLabels
    : sceneModel.anchors.map(({ label }) => label);
  const visibleAnchorDisplayNames = visibleAnchorLabels.map(displayNameForDbString);

  // Positur-nøkkel (brukt for silhuett-fallback + stabil data-key).
  const avatarPoseKey = useMemo(() => ({
    pose: ageMonths >= 12 ? ('standing' as const) : ('sitting' as const),
    outerBody: null, headwear: null, handwear: null, neck: null, footwear: null,
  }), [ageMonths]);

  // R8 (eierbeslutning 2026-07-15): pragmatisk match fra dagens anbefaling til
  // et verifisert komposittbilde — ytterste synlige plagg + positur. null →
  // nøytral silhuett (aldri feil ytterplagg).
  const verifiedAvatar = useMemo(() => {
    const headwear = sceneModel.anchors.find((a) => /lue|balaklava|solhatt|caps/i.test(a.label))?.label ?? null;
    return verifiedAvatarAsset(
      ageMonths >= 12 ? 'standing' : 'sitting',
      sceneModel.outerBodyLabel,
      headwear,
    );
  }, [sceneModel, ageMonths]);
  const illustrativeAvatar = useMemo(() => (
    resolvedRecommendation
      ? avatarPng(
        tierFromRecommendation(resolvedRecommendation, activity === 'vogn' ? 'vogn' : 'utelek'),
        headwearFromRecommendation(resolvedRecommendation),
      )
      : null
  ), [resolvedRecommendation, activity]);

  // Sikkerhetslinje (a11y-lead krav 4b): synlig på solid flate ved ≥ MEDIUM.
  const safetyLineText = useMemo(() => {
    const flags = resolvedRecommendation?.safetyFlags ?? [];
    const rank: Record<string, number> = { NONE: 0, LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
    const relevant = flags
      .filter((f) => f.displayInSheet !== false && rank[f.severity] >= 2)
      .sort((a, b) => rank[b.severity] - rank[a.severity]);
    return relevant[0]?.message ?? null;
  }, [resolvedRecommendation]);

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
    // D2: pillen ER en hevet flate (den grupperer ikon + sted i en egen
    // plate over lerretet), så den må bære lyslogikk og ikke bare farge.
    boxShadow: 'inset 0 1px 0 var(--dw-plate-kant), var(--dw-depth-raised)',
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
    // D2, med skjønn: sporet i en segmentkontroll er IKKE en hevet flate —
    // det er sporet den valgte pillen ligger OPPÅ. Å gi det inset-topplys
    // og skygge ville løftet både sporet og pillen, og da forsvinner
    // dybdehistorien. Riktig retting er derfor å fjerne det hevede fyllet.
    // Formen er løftet 1:1 fra den kanoniske segmentkontrollen
    // (SegmentedControl.css `.segmented-control__group`).
    background: 'color-mix(in srgb, var(--dw-ink-hi) 9%, transparent)',
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
    // Retning B: temp-reaktiv atmosfære — axis-drevne tokens gir gradienten
    // gratis via [data-temp]-overrides (avatar-glow/bg-canvas).
    background: 'radial-gradient(ellipse 90% 70% at 50% 42%, var(--avatar-glow) 0%, transparent 72%)',
    borderRadius: 28,
  };
  const sceneForeground: CSSProperties = {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    minHeight: 110,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  // Orbital-ankere (dekorative — hele scenen er aria-hidden; sr-sammendraget
  // bærer teksten). Posisjoner rundt avataren, maks 5.
  const anchorRing: CSSProperties = {
    position: 'absolute', inset: 0, pointerEvents: 'none',
  };
  const ANCHOR_POSITIONS: Array<CSSProperties> = [
    { top: '4%', left: '50%', transform: 'translateX(-50%)' },
    { top: '26%', left: '2%' },
    { top: '26%', right: '2%' },
    { bottom: '12%', left: '6%' },
    { bottom: '12%', right: '6%' },
  ];
  const anchorPill = (i: number, _count: number): CSSProperties => ({
    position: 'absolute',
    ...ANCHOR_POSITIONS[i],
    maxWidth: 132,
    padding: '6px 12px',
    borderRadius: 999,
    background: 'var(--surface-elevated)',
    border: '1px solid var(--ink-200)',
    // D2: pillene SVEVER over scenen, så her er hevet fyll riktig — men den
    // egenskrevne skyggen falt rett ned (0 4px 12px) og motsa lysvektoren
    // (--dw-lys-vinkel, øvre venstre → mot høyre). Dybdekontrakten kaster
    // riktig vei og flipper med temaet.
    boxShadow: 'inset 0 1px 0 var(--dw-plate-kant), var(--dw-depth-raised)',
    fontSize: '0.75rem',
    fontWeight: 650,
    color: 'var(--ink-900)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  });

  // Dominant svar — serif display (retning B: svaret er scenens tekst).
  const sceneHeadline: CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: 'clamp(1.6rem, 7vw, 2.1rem)',
    lineHeight: 1.12,
    letterSpacing: '-0.01em',
    color: 'var(--ink-900)',
    textAlign: 'center',
    margin: '10px 0 4px',
    textWrap: 'balance' as CSSProperties['textWrap'],
  };

  // Sikkerhetslinje — alltid solid flate, aldri kun farge (a11y-lead 4b).
  const safetyLine: CSSProperties = {
    margin: '6px auto 0',
    maxWidth: 340,
    padding: '10px 14px',
    borderRadius: 14,
    background: 'var(--surface-elevated)',
    border: '1px solid var(--ink-200)',
    borderLeft: '4px solid var(--terracotta-600)',
    // D2: callouten er en egen plate over lerretet (nettopp derfor er den
    // «alltid solid flate»), så den skal bære lyslogikk og ikke bare farge.
    boxShadow: 'inset 0 1px 0 var(--dw-plate-kant), var(--dw-depth-raised)',
    color: 'var(--ink-900)',
    fontSize: '0.8125rem',
    lineHeight: 1.45,
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

  // R7 Task 4: clay-stack-stilene (stack/stackImgStyle) fjernet — scenen
  // bruker VerifiedAvatarComposite (nøytral silhuett til R8-manifestet).

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
    // Trykk og skygge kommer nå fra bevegelseskontrakten (160→--dw-m-feedback,
    // 200ms→--dw-m-state). Farge-krysstoningen gjør det IKKE, med vilje: de
    // 600 ms er --dur-temp, samme verdi som .ba-temp-root bruker på
    // bakgrunnen, og ligger langt utenfor --dw-m-*-båndet (topp 420 ms).
    // Kutter man dem til 220 ms, glir CTA-en fra rommet den ligger i.
    transition: reducedMotion
      ? 'none'
      : `transform var(--dw-m-feedback) var(--dw-ease), box-shadow var(--dw-m-state) var(--dw-ease), background-color ${MOTION.tempTransition}ms ${MOTION.easeOut}, color ${MOTION.tempTransition}ms ${MOTION.easeOut}`,
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

  // ─── P4 (Monter): flag-gated new render tree ───────────────────────────────
  // Alt OVENFOR (vær/motor/context/outfit-transition-kjeden) er HELT uendret —
  // kun selve JSX-treet forgrener seg her. Den gamle grenen under forblir
  // kompilerbar/urørt for rask rollback (sett HJEM_SCAN_UI_ENABLED = false).
  if (HJEM_SCAN_UI_ENABLED) {
    return (
      <HjemMonter
        cityLabel={cityLabel}
        lat={lat}
        lon={lon}
        now={now}
        weatherStatus={weather.status}
        weatherFreshness={weather.freshness}
        weatherLastKnown={weather.lastKnownNow}
        weatherLastKnownAt={weather.lastKnownAt}
        activity={activity}
        onActivityChange={handleActivityChange}
        childId={active.id}
        childName={active.name}
        ageMonths={ageMonths}
        recommendation={resolvedRecommendation}
        onStartDressing={handleCta}
        startDressingDisabled={currentOutfitContext === null}
        reducedMotion={reducedMotion}
        outfitTransitionStatus={outfitTransitionStatus}
        onOpenAdjust={onOpenAdjust}
        onOpenWarmColdGuide={onOpenWarmColdGuide}
        onOpenPlaggbib={onOpenPlaggbib}
        onRetryWeather={handleRetryWeather}
      />
    );
  }

  // ─── Render (legacy) ────────────────────────────────────────────────────────

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

          {/* R7 Task 4 — retning B «Scenen»: avatar i temp-reaktiv atmosfære,
              orbital-ankere (dekorative duplikater av listen — a11y-lead
              krav 1: aldri interaktive), dominant serif-svar, sr-sammendrag
              (krav 2), sikkerhetslinje på solid flate (krav 4b). */}
          <div style={sceneSection}>
            <div style={scene} aria-hidden="true">
              {now !== null && now !== undefined && (
                <LivingHomeAtmosphere
                  tempC={now.tempC}
                  feelsLikeC={now.feelsLikeC}
                  symbolCode={now.symbolCode}
                  reducedMotion={reducedMotion}
                />
              )}
              <div style={sceneForeground}>
                <VerifiedAvatarComposite
                  stateKey={avatarPoseKey}
                  assetOverride={verifiedAvatar}
                  illustrativeAssetOverride={illustrativeAvatar}
                  outfitSummary={sceneModel.headline}
                  decorative
                  reducedMotion={reducedMotion}
                  size={188}
                />
                <div style={anchorRing}>
                  <HomeGarmentPills
                    selection={homeSourceSelection}
                    fallbackAnchors={visibleAnchorLabels.map((label) => ({ label }))}
                    registerHomeAnchor={registerHomeAnchor}
                    styleForIndex={anchorPill}
                  />
                </div>
              </div>
            </div>

            <h2 id="scene-heading" style={sceneHeadline}>{sceneModel.headline}</h2>
            {/* sr-sammendrag (a11y-lead krav 2): antrekket rekonstruerbart
                uten grafikk — kilden er samme scenemodell, aldri re-telling. */}
            <span style={srOnly}>
              {visibleAnchorDisplayNames.length > 0
                ? `Ytterst: ${visibleAnchorDisplayNames.join(', ')}.`
                : 'Antrekket beregnes.'}
            </span>

            {safetyLineText !== null && (
              <p role="status" style={safetyLine}>
                <span aria-hidden="true">⚠︎ </span>{safetyLineText}
              </p>
            )}

            {/* CTA — Native-feel: spring-fysikk på tap (whileTap).
                Reduced-motion: CSS-pressede regler i .ba-hjem-press-cta */}
            {reducedMotion ? (
              <button
                id="hjem-current-outfit-trigger"
                type="button"
                onClick={handleCta}
                disabled={currentOutfitContext === null}
                aria-haspopup="dialog"
                className="ba-hjem-press-cta ba-hjem-focus"
                style={cta}
              >
                <span style={ctaLabel}>Se dagens antrekk</span>
              </button>
            ) : (
              <motion.button
                id="hjem-current-outfit-trigger"
                type="button"
                onClick={handleCta}
                disabled={currentOutfitContext === null}
                aria-haspopup="dialog"
                className="ba-hjem-focus"
                style={cta}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 420, damping: 26, mass: 0.6 }}
              >
                <span style={ctaLabel}>Se dagens antrekk</span>
              </motion.button>
            )}

            {/* Veiledende-disclaimer (eierbeslutning 2026-07-15) — diskré,
                ikke en advarsel; anbefalingen er råd, ikke garanti. */}
            <p
              style={{
                margin: '12px auto 0',
                maxWidth: 320,
                fontSize: '0.6875rem',
                lineHeight: 1.4,
                color: 'var(--ink-500)',
                textAlign: 'center',
              }}
            >
              {DISCLAIMER_SHORT}
            </p>

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
