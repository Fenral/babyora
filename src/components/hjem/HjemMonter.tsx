/**
 * HjemMonter — P4-orkestratoren. Kobler den ferdig-beregnede engine-
 * modellen (uendret, arvet fra HjemScreen sitt eksisterende useMemo-kjede)
 * sammen med skann-maskinen (useScanCoordinator + scan-cache-store, P3,
 * uendret av denne pakken) og de nye presentasjonskomponentene.
 *
 * ── Faseoppløsning (docs/mocks/monter/hjem-*.html) ──────────────────────
 *  weather-ready  → WeatherScene (full panel) + MascotPeek + ask-block
 *                   («Klar for en liten tur?» / offline-varianten)
 *  scanning /
 *  recalculating  → ScanOverlay (erstatter panelet helt) + MascotPeek(kompakt)
 *                   + ScanStatusBlock
 *  result-current → WeatherStrip (komprimert) + ResultSurface (INGEN maskot —
 *                   hjem-result.html mangler den bevisst)
 *  result-stale   → WeatherScene (full panel) + MascotPeek(kompakt) +
 *                   ask-block (kontekstuell «Nytt antrekk for …?» / retry)
 *
 * ── Første scan i dag vs. cachet gjenåpning ─────────────────────────────
 * Ved mount: `decideScanEntry` (scan-orchestration.ts, rent/testet) avgjør
 * om et EKSAKT cachet resultat (samme barn+dag+sted+aktivitet+motorversjon)
 * finnes → hopp rett til resultatet, ingen koreografi i det hele tatt.
 * Ellers venter skjermen på trykk på «Finn dagens antrekk»; `shouldPlayFullScan`
 * (scan-cache-store, P3) avgjør DA om trykket spiller full 2.1s-koreografi
 * (dagens første) eller en kort variant.
 *
 * ── Aktivitets-toggle → auto-rekalkulering ───────────────────────────────
 * En identitetsendring MENS en fase allerede er etablert (kun aktivitet kan
 * faktisk endre seg i en levende sesjon — barn/dag/sted er stabile) trigger
 * `identityChanged(next, { autoRecalculate: true })` → kort 'recalculating'
 * med samme ScanOverlay-visning. Mislykkes rekalkuleringen (motoren har ikke
 * en anbefaling når timeren fyrer — f.eks. vær falt bort underveis) →
 * `recalcFailed()` → 'result-stale' med «Beregn på nytt».
 *
 * ── Reduced motion ───────────────────────────────────────────────────────
 * `runTimer` hopper rett til fullføring (0ms) når reducedMotion er sann —
 * «instant completion, zero-duration» (oppgavens ord) — i tillegg til at
 * ScanOverlay/ResultSurface selv aldri merker noe som `data-animate`/
 * `data-fresh` når reducedMotion er sann (dobbel vakt, samme mønster som
 * resten av appen).
 */
import {
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import './hjem-monter.css';
import { useScanCoordinator } from '../../hooks/useScanCoordinator.js';
import {
  getSlotForIdentity,
  shouldPlayFullScan,
  useScanCache,
} from '../../state/scan-cache-store.js';
import {
  localDateKey,
  sameScanIdentity,
  WOOL_LAYERS_ENGINE_VERSION,
  type ScanIdentity,
} from '../../lib/scan/types.js';
import { computeScanResultKey } from '../../lib/scan/result-key.js';
import type { Recommendation } from '../../lib/wool-layers/types.js';
import type { WeatherNow } from '../../lib/met-no/types.js';
import {
  getConditionLabel,
  getWeatherIcon,
  getWeatherNuance,
} from '../../lib/monter-assets.js';
import {
  impactSoft,
  impactMedium,
  prepare as hapticPrepare,
  selection as hapticSelection,
} from '../../lib/haptics.js';
import { WeatherScene, type MonterActivity } from './WeatherScene.js';
import { WeatherStrip } from './WeatherStrip.js';
import { MascotPeek } from './MascotPeek.js';
import { ScanOverlay, ScanStatusBlock } from './ScanOverlay.js';
import { ScanMicropass } from './ScanMicropass.js';
import type { OutfitTransitionStatusLike } from './scan-overlay-guard.js';
import { ResultSurface } from './ResultSurface.js';
import { deriveResultRows, type ResultRow } from './result-rows.js';
import {
  activityChangeChip,
  decideScanEntry,
  fullScanHapticSchedule,
  FULL_SCAN_DURATION_MS,
  MICROPASS_DURATION_MS,
  QUICK_RECALC_DURATION_MS,
  staleCtaLabel,
  staleHeadline,
  type ScanHapticCue,
  type ScanHapticEvent,
} from './scan-orchestration.js';
import { buildAdjustPrefill } from './adjust-prefill.js';
import type { FinnAntrekkPrefill } from '../../screens/finn-antrekk-prefill.js';
import { resolveSwapTarget } from './swap-row.js';
import { PlaggDetailSheet } from '../PlaggDetailSheet.js';
import type { GarmentId } from '../../data/garment-illustrations.js';

const ACTIVITY_CHILD_LINE: Readonly<Record<MonterActivity, string>> = { utelek: 'Utelek', vogn: 'Vogn' };
const ACTIVITY_TOGGLE_LABEL: Readonly<Record<MonterActivity, string>> = { utelek: 'Utenfor vogn', vogn: 'I vogn' };

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 8v5M12 16.5v.5" />
      <circle cx={12} cy={12} r={9} />
    </svg>
  );
}

function formatTemp(tempC: number): string {
  const rounded = Math.round(tempC);
  return rounded < 0 ? `−${Math.abs(rounded)}` : `${rounded}`;
}
function formatClock(epochMs: number): string {
  const d = new Date(epochMs);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export type HjemMonterProps = Readonly<{
  cityLabel: string;
  lat: number;
  lon: number;
  now: WeatherNow | null;
  weatherStatus: 'idle' | 'loading' | 'ready' | 'offline' | 'error';
  activity: MonterActivity;
  onActivityChange: (next: MonterActivity) => void;
  childId: string;
  childName: string;
  ageMonths: number;
  recommendation: Recommendation | null;
  onStartDressing: (event: MouseEvent<HTMLButtonElement>) => void;
  startDressingDisabled: boolean;
  reducedMotion: boolean;
  outfitTransitionStatus: OutfitTransitionStatusLike;
  /**
   * P5: opens the "Juster" drill (FinnAntrekkScreen) with a live-weather
   * prefill — wired to WeatherStrip's Juster button (result-current) and
   * the weather-ready panel's place pill (both weather-ready sub-branches).
   */
  onOpenAdjust: (prefill: FinnAntrekkPrefill) => void;
  /**
   * P5: "Hvorfor akkurat dette?" (ResultSurface) — contextual entry into the
   * Varm-eller-kald guide (PRODUCT.md, 2026-07-31 Familie IA decision: "the
   * migrated guide tools ... get contextual entry points at their point of
   * need"). Same callback App.tsx already threads into PaakledningScreen.
   */
  onOpenWarmColdGuide: () => void;
  /** P5: manual weather-refetch trigger for the offline ask-block's "Prøv å hente været igjen". */
  onRetryWeather: () => void;
  /**
   * P6: opens the Plaggbibliotek drill — used both as PlaggDetailSheet's
   * "Se alternativer i biblioteket" affordance and as the no-dead-end
   * fallback when a "Bytt" row's garmentId never resolved (see swap-row.ts).
   */
  onOpenPlaggbib: () => void;
}>;

export function HjemMonter({
  cityLabel,
  lat,
  lon,
  now,
  weatherStatus,
  activity,
  onActivityChange,
  childId,
  childName,
  ageMonths,
  recommendation,
  onStartDressing,
  startDressingDisabled,
  reducedMotion,
  outfitTransitionStatus,
  onOpenAdjust,
  onOpenWarmColdGuide,
  onRetryWeather,
  onOpenPlaggbib,
}: HjemMonterProps) {
  const scan = useScanCoordinator();
  const slots = useScanCache((state) => state.slots);
  const commitSlot = useScanCache((state) => state.commitSlot);
  // P9 (duel §2): livstids-flagget som avgjør full-koreografi (1,1s, kun
  // aller første gang) vs. mikropass (400ms, alle senere trykk) — erstatter
  // det gamle per-dags-feltet (`daySlot`/`scanPlayedInFullToday`).
  const hasPlayedFullScanEver = useScanCache((state) => state.hasPlayedFullScanEver);
  const markFullScanPlayedEver = useScanCache((state) => state.markFullScanPlayedEver);

  const identity = useMemo<ScanIdentity>(() => ({
    childId,
    dateKey: localDateKey(),
    placeKey: `place:${lat.toFixed(3)},${lon.toFixed(3)}`,
    activity,
    engineVersion: WOOL_LAYERS_ENGINE_VERSION,
  }), [childId, lat, lon, activity]);

  const currentResultKey = useMemo(() => {
    if (recommendation === null || now === null) return null;
    return computeScanResultKey(recommendation, {
      tempC: now.tempC,
      feelsLikeC: now.feelsLikeC,
      windMs: now.windMs,
      precipMmH: now.precipMmH,
      symbolCode: now.symbolCode,
    });
  }, [recommendation, now]);
  // react-hooks/refs: en ref kan ALDRI leses/skrives under selve render-et —
  // kun i effekter/handlers. Timer-callbacks (completeScan/completeRecalc)
  // trenger likevel den NYESTE nøkkelen når de fyrer (ofte lenge etter
  // renderet som planla dem), så den holdes i sync via en effekt.
  const currentResultKeyRef = useRef<string | null>(null);
  useEffect(() => {
    currentResultKeyRef.current = currentResultKey;
  }, [currentResultKey]);

  // Siste kjente værmåling — kun brukt til DISPLAY i offline-tilstanden.
  // Motorens uendrede engine-kjede får ALDRI denne (den ser bare det
  // faktiske `now`); dette er utelukkende en visuell «sist kjent»-hukommelse.
  // React-anbefalt mønster («adjusting state when a prop changes», ikke en
  // effekt) — unngår en ref-lesing under render. Tidsstempelet kommer fra
  // `now.observedAt` (allerede en del av WeatherNow) i stedet for
  // `Date.now()` — render-funksjoner må være rene (react-hooks/purity),
  // og «når værmålingen faktisk ble observert» er uansett en mer korrekt
  // «sist kjent»-tid enn «når React tilfeldigvis rendret på nytt».
  const [lastKnown, setLastKnown] = useState<WeatherNow | null>(null);
  if (now !== null && lastKnown !== now) {
    setLastKnown(now);
  }
  const lastKnownNow = lastKnown;
  const lastKnownAt = lastKnown?.observedAt.getTime() ?? null;

  // ── Timer-håndtak for scan/recalc-fullføring ────────────────────────────
  const timerCancelRef = useRef<(() => void) | null>(null);
  const pendingFullScanRef = useRef(false);
  const seenIdentityRef = useRef<ScanIdentity | null>(null);
  const [previousActivity, setPreviousActivity] = useState<MonterActivity | null>(null);
  const [previousResultCount, setPreviousResultCount] = useState<number | null>(null);
  /**
   * true kun rett etter en EKTE scan/rekalkulering fullført denne økten —
   * gater `.is-fresh`-radanimasjonen i ResultSurface. Cachet umiddelbar
   * gjenåpning (show-cached-grenen i mount-effekten) setter den ALDRI til
   * true — DESIGN.md «later openings use cached result immediately» betyr
   * nettopp INGEN inn-animasjon, radene skal bare stå der. React-state (ikke
   * en ref) siden verdien faktisk LESES under render (ResultSurface-propen).
   */
  const [isFresh, setIsFresh] = useState(false);
  /**
   * P9 (duel §2): sann når mikropassets 400ms-timer fyrte MENS motoren ikke
   * hadde et resultat klart ennå — «Data ikke klare etter 400ms → ærlig
   * lastetilstand». ScanMicropass viser da «Oppdaterer værdata» i stedet for
   * værsammendraget; effekten under fullfører automatisk idet resultatet
   * blir klart, uten et nytt trykk. ALDRI satt sann for en cachet
   * umiddelbar visning (show-cached-grenen kaller `completeScan` aldri).
   */
  const [awaitingScanData, setAwaitingScanData] = useState(false);

  const clearTimer = useCallback(() => {
    timerCancelRef.current?.();
    timerCancelRef.current = null;
  }, []);
  useEffect(() => clearTimer, [clearTimer]);

  const runTimer = useCallback((durationMs: number, onFire: () => void) => {
    clearTimer();
    if (reducedMotion || durationMs <= 0) {
      onFire();
      return;
    }
    const timeoutId = setTimeout(onFire, durationMs);
    timerCancelRef.current = () => clearTimeout(timeoutId);
  }, [clearTimer, reducedMotion]);

  // ── P9 duel §3: haptikk-tidsplan-dispatch ────────────────────────────────
  // Kun avhukingene (soft ved start + selection per sjekk-rad) planlegges her
  // som reelle timere — landings-haptikken (prepare+medium) eies av
  // completeScan under, siden den KUN skal spilles når scanningen faktisk
  // lander et resultat (aldri når awaitingScanData-fallbacken slår inn).
  const hapticTimerIdsRef = useRef<number[]>([]);
  const clearHapticTimers = useCallback(() => {
    for (const id of hapticTimerIdsRef.current) clearTimeout(id);
    hapticTimerIdsRef.current = [];
  }, []);
  useEffect(() => clearHapticTimers, [clearHapticTimers]);

  const dispatchHapticCue = useCallback((cue: ScanHapticCue) => {
    if (cue === 'soft') { void impactSoft(); return; }
    if (cue === 'selection') { void hapticSelection(); }
    // 'prepare'/'medium' dispatches via completeScan, not the pre-landing
    // schedule below — see the comment on hapticTimerIdsRef.
  }, []);

  const runPreLandingHapticSchedule = useCallback((events: readonly ScanHapticEvent[]) => {
    clearHapticTimers();
    const preLanding = events.filter((event) => event.cue === 'soft' || event.cue === 'selection');
    if (preLanding.length === 0) return;
    if (reducedMotion) {
      // Instant completion — intet tidsvindu å synkronisere avhukinger mot;
      // spill dem øyeblikkelig i stedet for å la dem stå igjen som
      // etterslepende timere som ville fyrt lenge etter at resultatet
      // allerede vises (haptikk er BEVISST uavhengig av redusert bevegelse,
      // se lib/haptics/system.ts, men skal likevel aldri "etterslepe" et
      // fasebytte som allerede har skjedd).
      for (const event of preLanding) dispatchHapticCue(event.cue);
      return;
    }
    hapticTimerIdsRef.current = preLanding.map(
      (event) => window.setTimeout(() => dispatchHapticCue(event.cue), event.atMs),
    );
  }, [clearHapticTimers, dispatchHapticCue, reducedMotion]);

  const completeScan = useCallback(() => {
    const resultKey = currentResultKeyRef.current;
    if (resultKey === null) {
      // P9 (duel §2): motor ikke klar ved 400ms/1,1s-grensen — ærlig
      // lastetilstand i stedet for å bli stående i en stille "scanning" uten
      // forklaring. ALDRI landings-haptikk her — ingenting landet.
      setAwaitingScanData(true);
      return;
    }
    setAwaitingScanData(false);
    setIsFresh(true);
    // Landing: prepare() rett før medium (duel §3 — "prepare() først").
    void hapticPrepare().then(() => { void impactMedium(); });
    scan.scanCompleted(resultKey);
    if (pendingFullScanRef.current) markFullScanPlayedEver();
    commitSlot({
      identity,
      resultKey,
      completedAt: Date.now(),
      scanPlayedInFullToday: pendingFullScanRef.current || slots[identity.childId]?.scanPlayedInFullToday === true,
    });
  }, [scan, commitSlot, identity, slots, markFullScanPlayedEver]);

  // Auto-fullfører mikropasset (uten et nytt trykk) idet motoren ENDELIG har
  // et resultat, hvis 400ms-grensen rakk å gå ut mens vi ventet (se
  // awaitingScanData-kommentaren over).
  useEffect(() => {
    if (!awaitingScanData || currentResultKey === null) return;
    completeScan();
  }, [awaitingScanData, currentResultKey, completeScan]);

  const completeRecalc = useCallback(() => {
    const resultKey = currentResultKeyRef.current;
    if (resultKey === null) {
      scan.recalcFailed();
      return;
    }
    setIsFresh(true);
    scan.recalcCompleted(resultKey);
    commitSlot({
      identity,
      resultKey,
      completedAt: Date.now(),
      scanPlayedInFullToday: slots[identity.childId]?.scanPlayedInFullToday === true,
    });
  }, [scan, commitSlot, identity, slots]);

  // ── Mount / identitetsendring ────────────────────────────────────────────
  useEffect(() => {
    if (now === null) return; // ingen brukbar vær-basis ennå — ikke gjør noe.
    const phase = scan.state.phase;

    if (phase === 'weather-ready') {
      if (seenIdentityRef.current === null) {
        const exact = getSlotForIdentity(slots, identity);
        const decision = decideScanEntry(exact, hasPlayedFullScanEver);
        if (decision.kind === 'show-cached') {
          // isFresh er allerede false fra useState(false) — cachet
          // umiddelbar visning skal ALDRI trigge inn-animasjonen.
          scan.scanStarted(identity);
          scan.scanCompleted(decision.resultKey);
        }
      }
      seenIdentityRef.current = identity;
      return;
    }

    if (seenIdentityRef.current !== null && !sameScanIdentity(seenIdentityRef.current, identity)) {
      setPreviousActivity(seenIdentityRef.current.activity as MonterActivity);
      setPreviousResultCount(recommendation ? deriveResultRows(recommendation).length : null);
      seenIdentityRef.current = identity;
      scan.identityChanged(identity, { autoRecalculate: true });
      runTimer(QUICK_RECALC_DURATION_MS, completeRecalc);
    }
  }, [identity, now, scan, slots, hasPlayedFullScanEver, runTimer, completeRecalc, recommendation]);

  const handleFindOutfitTap = useCallback(() => {
    if (currentResultKeyRef.current === null) return;
    const playFull = shouldPlayFullScan(hasPlayedFullScanEver);
    pendingFullScanRef.current = playFull;
    setAwaitingScanData(false);
    scan.scanStarted(identity);
    runPreLandingHapticSchedule(
      playFull ? fullScanHapticSchedule(FULL_SCAN_DURATION_MS) : [],
    );
    runTimer(playFull ? FULL_SCAN_DURATION_MS : MICROPASS_DURATION_MS, completeScan);
  }, [hasPlayedFullScanEver, identity, scan, runTimer, completeScan, runPreLandingHapticSchedule]);

  const handleStaleCtaTap = useCallback(() => {
    scan.recalcStarted();
    runTimer(QUICK_RECALC_DURATION_MS, completeRecalc);
  }, [scan, runTimer, completeRecalc]);

  const handleSkip = useCallback(() => {
    clearTimer();
    // Duel §2: "Berøring når som helst: hopp rett til resultat, spill kun
    // landingen" — kanseller ev. gjenstående avhukings-haptikk (soft/
    // selection) som ellers ville fyrt SENERE enn selve resultatet.
    // Landingen (prepare+medium) eies allerede utelukkende av completeScan.
    clearHapticTimers();
    if (scan.state.phase === 'scanning') completeScan();
    else if (scan.state.phase === 'recalculating') completeRecalc();
  }, [clearTimer, clearHapticTimers, scan, completeScan, completeRecalc]);

  // P5: Juster (WeatherStrip + vær-panelets sted-pille) → onOpenAdjust,
  // Hvorfor akkurat dette? → onOpenWarmColdGuide, Prøv å hente været igjen →
  // onRetryWeather (refreshKey inn i HjemScreen sin useWeather-kalling) er
  // kablet, se under. Bytt fikk sin kabling i P6 (rett under).
  //
  // P9 tilstands-audit (bevisst FORTSATT no-op, ikke en glemt stub): «Vis
  // forrige antrekk» (result-stale) har ingen eksisterende drill å koble
  // til. `previousResultCount` (over) holder KUN et plagg-ANTALL beregnet i
  // selve staleness-øyeblikket — ikke det forrige resultatets faktiske
  // Recommendation/resultKey — så en ekte "vis forrige antrekk"-visning
  // krever enten (a) at scan-cache-store beholder FORRIGE slot (ikke bare
  // gjeldende) per barn, eller (b) en egen liten "siste kjente"-cache her,
  // PLUSS en visningsflate (gjenbruk ResultSurface? egen kompakt liste?).
  // Reelt scope-arbeid, ikke en ledningsfeil — derfor stående som
  // dokumentert no-op til produkt spesifiserer visningen, ikke en
  // implementeringsdetalj som mangler.
  const noopStub = useCallback(() => {}, []);

  // P6: "Bytt" (MonterGarmentRow, resultat-lista) → PlaggDetailSheet, samme
  // datavei som den LEGACY resultatlisten (PaakledningScreen sin
  // handleOpenNode) allerede bruker — se swap-row.ts sin filhode-kommentar.
  // resolveSwapTarget() er den rene beslutningen (testet separat,
  // swap-row.test.ts); onOpenPlaggbib er no-dead-end-fallbacket for en rad
  // hvis garmentId aldri løste seg (ukjent/udekket etikett).
  const [detailGarmentId, setDetailGarmentId] = useState<GarmentId | null>(null);
  const detailTriggerRef = useRef<HTMLElement | null>(null);

  const handleSwapRow = useCallback((row: ResultRow, event: MouseEvent<HTMLButtonElement>) => {
    const resolution = resolveSwapTarget(row);
    if (resolution.kind === 'library') {
      onOpenPlaggbib();
      return;
    }
    detailTriggerRef.current = event.currentTarget;
    setDetailGarmentId(resolution.garmentId);
  }, [onOpenPlaggbib]);

  const handleCloseDetail = useCallback(() => {
    setDetailGarmentId(null);
  }, []);

  // P5: bygger prefill-payloaden fra de samme rå ingrediensene HjemMonter
  // allerede har som props (buildAdjustPrefill er ren/testet separat,
  // adjust-prefill.ts). `now ?? lastKnownNow` lar sted-pillen i BEGGE
  // weather-ready-underveiene (normal + offline) åpne drillen — offline
  // seeder da fra sist kjente værmåling, samme «manuell overstyring»-formål
  // som selve Juster-verktøyet har. null (ingen vær i det hele tatt ennå)
  // gjør knappen et no-op — ingenting å seede fra.
  const adjustSource = now ?? lastKnownNow;
  const handleOpenAdjust = useCallback(() => {
    const prefill = buildAdjustPrefill(adjustSource, activity, cityLabel);
    if (prefill !== null) onOpenAdjust(prefill);
  }, [adjustSource, activity, cityLabel, onOpenAdjust]);

  const nuance = getWeatherNuance(now?.symbolCode ?? lastKnownNow?.symbolCode);
  const conditionLabel = getConditionLabel(now?.symbolCode ?? lastKnownNow?.symbolCode);
  const weatherIconSrc = getWeatherIcon(now?.symbolCode ?? lastKnownNow?.symbolCode);
  const childLine = `${childName} · ${ageMonths} måneder · ${ACTIVITY_CHILD_LINE[activity]}`;
  const canScan = currentResultKey !== null;

  const phase = scan.state.phase;

  // P9 (duel §2): mikropasset er en EGEN gren, ikke en ScanOverlay-variant —
  // det erstatter kun ask-blokken (WeatherScene over står uendret), ikke
  // hele panelet. `hasPlayedFullScanEver` avgjør dette entydig MENS
  // phase==='scanning' (den kan bare flippe sann i samme batch som
  // completeScan tar fasen ut av 'scanning', se completeScan/markFullScanPlayedEver).
  if (phase === 'scanning' && hasPlayedFullScanEver) {
    const summaryText = awaitingScanData || now === null
      ? null
      : `${formatTemp(now.tempC)}° · ${cityLabel} · ${ACTIVITY_TOGGLE_LABEL[activity]}`;
    return (
      <div className="hjem-monter">
        <div className="hjm-top"><span className="hjm-brand">BABYORA</span></div>
        <div className="hjm-mascot-slot"><MascotPeek /></div>
        <div className="hjm-panel-slot" data-with-mascot="true" data-compact="false">
          <WeatherScene
            cityLabel={cityLabel}
            nuance={nuance}
            tempC={now?.tempC ?? null}
            feelsLikeC={now?.feelsLikeC ?? null}
            noteText={now ? `${conditionLabel} — sjekk antrekket før dere går ut.` : 'Henter vær…'}
            weatherIconSrc={weatherIconSrc}
            weatherIconAlt={conditionLabel}
            freshnessLabel="Oppdatert nå"
            activity={activity}
            onActivityChange={onActivityChange}
            onAdjustLocation={handleOpenAdjust}
          />
        </div>
        <div className="hjm-body">
          <ScanMicropass
            summaryText={summaryText}
            reducedMotion={reducedMotion}
            onTapAnywhere={handleSkip}
          />
        </div>
      </div>
    );
  }

  if (phase === 'scanning' || phase === 'recalculating') {
    const isFullScan = phase === 'scanning';
    const totalDurationMs = isFullScan ? FULL_SCAN_DURATION_MS : QUICK_RECALC_DURATION_MS;
    const tempLabel = now ? `${formatTemp(now.tempC)}°, ${conditionLabel.toLowerCase()}` : '–';
    return (
      <div className="hjem-monter">
        <div className="hjm-top"><span className="hjm-brand">BABYORA</span></div>
        <div className="hjm-mascot-slot"><MascotPeek compact /></div>
        <div className="hjm-panel-slot" data-with-mascot="true" data-compact="true">
          <ScanOverlay
            cityLabel={cityLabel}
            nuance={nuance}
            rows={[
              { label: 'Været nå', value: tempLabel },
              { label: 'Aktivitet', value: ACTIVITY_TOGGLE_LABEL[activity] },
              { label: childName, value: `${ageMonths} måneder` },
            ]}
            spinningLabel="Lag for lag"
            spinningValue="setter sammen…"
            totalDurationMs={totalDurationMs}
            reducedMotion={reducedMotion}
            outfitTransitionStatus={outfitTransitionStatus}
          />
        </div>
        <div className="hjm-body">
          <ScanStatusBlock
            headline={isFullScan ? `Kler på ${childName} i tankene…` : `Kler på ${childName} på nytt…`}
            subline="Tar bare et lite øyeblikk."
            onSkip={handleSkip}
            outfitTransitionStatus={outfitTransitionStatus}
          />
        </div>
      </div>
    );
  }

  if (phase === 'result-current') {
    const rows = deriveResultRows(recommendation);
    return (
      <div className="hjem-monter">
        <div className="hjm-top"><span className="hjm-brand">BABYORA</span></div>
        <div className="hjm-panel-slot" data-with-mascot="false">
          {now && (
            <WeatherStrip
              nuance={nuance}
              tempC={now.tempC}
              feelsLikeC={now.feelsLikeC}
              conditionLabel={conditionLabel}
              cityLabel={cityLabel}
              activityToggleLabel={ACTIVITY_TOGGLE_LABEL[activity]}
              onAdjust={handleOpenAdjust}
            />
          )}
        </div>
        <div className="hjm-body">
          <ResultSurface
            rows={rows}
            childLabel={`${rows.length} plagg for ${childName}, innerst til ytterst`}
            isFresh={isFresh}
            reducedMotion={reducedMotion}
            onSwapRow={handleSwapRow}
            onStartDressing={onStartDressing}
            startDressingDisabled={startDressingDisabled}
            onWhy={onOpenWarmColdGuide}
          />
        </div>
        {detailGarmentId && (
          <PlaggDetailSheet
            garmentId={detailGarmentId}
            isOpen={detailGarmentId !== null}
            onClose={handleCloseDetail}
            triggerRef={detailTriggerRef}
            onOpenLibrary={onOpenPlaggbib}
          />
        )}
      </div>
    );
  }

  if (phase === 'result-stale') {
    const reason = scan.state.reason;
    const chip = reason === 'identity-changed'
      ? activityChangeChip(previousActivity, activity)
      : null;
    return (
      <div className="hjem-monter">
        <div className="hjm-top"><span className="hjm-brand">BABYORA</span></div>
        <div className="hjm-mascot-slot"><MascotPeek compact /></div>
        <div className="hjm-panel-slot" data-with-mascot="true" data-compact="true">
          <WeatherScene
            cityLabel={cityLabel}
            nuance={nuance}
            tempC={now?.tempC ?? null}
            feelsLikeC={now?.feelsLikeC ?? null}
            noteText={now ? `Værbasert: ${conditionLabel.toLowerCase()}.` : 'Henter vær…'}
            weatherIconSrc={weatherIconSrc}
            weatherIconAlt={conditionLabel}
            freshnessLabel="Oppdatert nå"
            activity={activity}
            onActivityChange={onActivityChange}
          />
        </div>
        <div className="hjm-body">
          <div className="hjm-ask-block">
            <h1 className="hjm-ask">{staleHeadline(reason, activity)}</h1>
            {chip !== null && (
              <span className="hjm-change-chip">
                <InfoIcon />
                {chip}
              </span>
            )}
            {previousResultCount !== null && (
              <div className="hjm-prev">
                <span className="hjm-p-label">FORRIGE ANTREKK</span>
                <p className="hjm-p-text">{`${previousResultCount} plagg beregnet.`}</p>
              </div>
            )}
            <button type="button" className="hjm-cta" onClick={handleStaleCtaTap}>
              {staleCtaLabel(reason, activity)}
              <ArrowIcon />
            </button>
            <button type="button" className="hjm-cta-ghost" onClick={noopStub}>
              Vis forrige antrekk
            </button>
          </div>
        </div>
      </div>
    );
  }

  // phase === 'weather-ready'
  const daySlot = slots[identity.childId] ?? null;
  // P9 state-audit: a hard network failure with NO usable fallback cache
  // (useWeather → 'error', e.g. offline on a brand-new device/profile with
  // nothing cached yet) previously fell through to the DEFAULT branch below
  // (identical to 'loading' — `now` is null either way), leaving the user
  // stuck on a permanent "Henter vær…" with a disabled CTA and no retry
  // affordance. Treating 'error' the same as 'offline' here reuses the
  // already-correct retry UI ("Prøv å hente været igjen") instead of a dead
  // end. Both statuses share the same `now === null` shape, so nothing else
  // downstream needs to change.
  const offline = (weatherStatus === 'offline' || weatherStatus === 'error')
    && (daySlot === null || daySlot.identity.dateKey !== identity.dateKey);

  if (offline) {
    return (
      <div className="hjem-monter">
        <div className="hjm-top"><span className="hjm-brand">BABYORA</span></div>
        <div className="hjm-mascot-slot"><MascotPeek compact /></div>
        <div className="hjm-panel-slot" data-with-mascot="true" data-compact="true">
          <WeatherScene
            cityLabel={cityLabel}
            nuance={nuance}
            tempC={lastKnownNow?.tempC ?? null}
            feelsLikeC={lastKnownNow?.feelsLikeC ?? null}
            noteText="Får ikke tak i været akkurat nå."
            weatherIconSrc={weatherIconSrc}
            weatherIconAlt={conditionLabel}
            freshnessLabel={lastKnownAt !== null ? `Sist oppdatert ${formatClock(lastKnownAt)}` : 'Henter vær'}
            freshnessWarn
            dimmed
            staleBadgeLabel={lastKnownAt !== null ? `Sist kjente vær · ${formatClock(lastKnownAt)}` : null}
            activity={activity}
            onActivityChange={onActivityChange}
            onAdjustLocation={handleOpenAdjust}
          />
        </div>
        <div className="hjm-body">
          <div className="hjm-ask-block">
            <h1 className="hjm-ask">Vi klarer oss med sist kjente vær</h1>
            <p className="hjm-child">
              {lastKnownAt !== null
                ? `Fra ${formatClock(lastKnownAt)} · endringer ute er som regel små på en time`
                : 'Henter vær …'}
            </p>
            <button type="button" className="hjm-cta" onClick={handleFindOutfitTap} disabled={!canScan}>
              Finn dagens antrekk
              <ArrowIcon />
            </button>
            <button type="button" className="hjm-cta-ghost" onClick={onRetryWeather}>
              Prøv å hente været igjen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hjem-monter">
      <div className="hjm-top"><span className="hjm-brand">BABYORA</span></div>
      <div className="hjm-mascot-slot"><MascotPeek /></div>
      <div className="hjm-panel-slot" data-with-mascot="true" data-compact="false">
        <WeatherScene
          cityLabel={cityLabel}
          nuance={nuance}
          tempC={now?.tempC ?? null}
          feelsLikeC={now?.feelsLikeC ?? null}
          noteText={now ? `${conditionLabel} — sjekk antrekket før dere går ut.` : 'Henter vær…'}
          weatherIconSrc={weatherIconSrc}
          weatherIconAlt={conditionLabel}
          freshnessLabel="Oppdatert nå"
          activity={activity}
          onActivityChange={onActivityChange}
          onAdjustLocation={handleOpenAdjust}
        />
      </div>
      <div className="hjm-body">
        <div className="hjm-ask-block">
          <h1 className="hjm-ask">Klar for en liten tur?</h1>
          <p className="hjm-child">{childLine}</p>
          <button type="button" className="hjm-cta" onClick={handleFindOutfitTap} disabled={!canScan}>
            Finn dagens antrekk
            <ArrowIcon />
          </button>
          <p className="hjm-trust">
            <CheckIcon />
            Vær, sted og aktivitet vurderes sammen
          </p>
        </div>
      </div>
    </div>
  );
}
