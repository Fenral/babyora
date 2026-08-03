/**
 * HjemMonter — P4-orkestratoren. Kobler den ferdig-beregnede engine-
 * modellen (uendret, arvet fra HjemScreen sitt eksisterende useMemo-kjede)
 * sammen med skann-maskinen (useScanCoordinator + scan-cache-store, P3,
 * uendret av denne pakken) og de nye presentasjonskomponentene.
 *
 * ── Faseoppløsning (docs/mocks/monter/hjem-*.html) ──────────────────────
 *  weather-ready  → WeatherScene (full panel) + MascotIdle (nysgjerrig-glimt
 *                   i hvile, se MascotIdle.tsx) + ask-block («Klar for en
 *                   liten tur?» / offline-varianten)
 *  scanning /
 *  recalculating  → ScanOverlay (erstatter panelet helt) + MascotPeek(kompakt,
 *                   pose="curious" — bøyer seg ned mot scan-animasjonen, se
 *                   MascotPeek.tsx) + ScanStatusBlock
 *  result-current → WeatherStrip (komprimert) + ResultSurface (INGEN maskot —
 *                   hjem-result.html mangler den bevisst)
 *  result-stale   → WeatherScene (full panel) + MascotPeek(kompakt) +
 *                   ask-block (kontekstuell «Nytt antrekk for …?» / retry)
 *
 * ── Cachet gjenåpning vs. hvert CTA-trykk (eier-override 2026-08-01, v3) ──
 * Ved mount: `decideScanEntry` (scan-orchestration.ts, rent/testet) avgjør
 * om et EKSAKT cachet resultat (samme barn+dag+sted+aktivitet+motorversjon)
 * finnes → hopp rett til resultatet, ingen koreografi i det hele tatt.
 * Ellers venter skjermen på trykk på «Finn dagens antrekk»; åpningsklatringen
 * (OpeningSequence) er fjernet — Hjem er statisk til CTA-trykk (se
 * docs/design-notes/aapningssekvens-2026-08-01.md sin eier-override-notis).
 *
 * ── Eier-override v4 (2026-08-03): FINGERPRINTET styrer seremonien ────────
 * v3-regelen «HVERT trykk spiller full 3,2s» er opphevet (PRODUCT.md,
 * «Owner-override v4»): seremonien spilles når Babyora faktisk gjør NYTT
 * arbeid, ikke ved hvert trykk. Maskineriet er det som allerede fantes —
 * `computeScanResultKey` (lib/scan/result-key.ts) er en deterministisk
 * fingerprint over plaggutfallet + værgrunnlaget. Det nye er at nøkkelen
 * LESES FØR trykket (`planCta` under) og velger både TEKST og VEI:
 *   ukjent nøkkel → «Finn dagens antrekk» → full 3,2s-koreografi
 *   kjent nøkkel  → «Vis dagens antrekk»  → rett til det cachede resultatet
 * Linja under CTA-en forteller hvilken vei du er på (CTA_*_LINE).
 * Oppslaget er et NØKKELOPPSLAG, ikke én plass: `sessionResultKeys` husker
 * hver nøkkel appen har landet i denne økten, i tillegg til den ene
 * persisterte slotten i scan-cache-store. Bytter man aktivitet fram og
 * tilbake, treffer man derfor svaret appen allerede holder — selv om
 * slotten i mellomtiden er overskrevet av den andre aktiviteten.
 * Eksplisitt «Beregn på nytt» (result-stale, ikke identitets-endring)
 * spiller fortsatt full seremoni; inline omberegning beholder 220 ms.
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
  useScanCache,
} from '../../state/scan-cache-store.js';
import {
  localDateKey,
  sameScanIdentity,
  WOOL_LAYERS_ENGINE_VERSION,
  type ScanIdentity,
  type ScanStaleReason,
} from '../../lib/scan/types.js';
import { computeScanResultKey } from '../../lib/scan/result-key.js';
import type { Recommendation } from '../../lib/wool-layers/types.js';
import type { WeatherNow } from '../../lib/met-no/types.js';
import type { WeatherFreshness } from '../../hooks/useWeather.js';
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
import { MascotIdle } from './MascotIdle.js';
import { ScanOverlay, ScanStatusBlock } from './ScanOverlay.js';
import type { OutfitTransitionStatusLike } from './scan-overlay-guard.js';
import { ResultSurface } from './ResultSurface.js';
import { deriveResultRows, type ResultRow } from './result-rows.js';
import {
  activityChangeChip,
  decideScanEntry,
  fullScanHapticSchedule,
  FULL_SCAN_DURATION_MS,
  QUICK_RECALC_DURATION_MS,
  staleCtaLabel,
  staleHeadline,
  type ScanHapticCue,
  type ScanHapticEvent,
} from './scan-orchestration.js';
import {
  planCta,
  planRecalc,
  rememberResultKey,
  resultKeyScope,
  sessionResultKeys,
} from './cta-fingerprint.js';
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

/**
 * T9A: friskhetslinjen speiler §5-cachematrisen i stedet for den tidligere
 * hardkodede «Oppdatert nå»-påstanden. KUN minimal korrekt tekst — de fire
 * redaksjonelle friskhetstekstene (runde 4) er T2 (visuelt) og styles ikke
 * her. Uten freshness-prop (eldre kallsteder/tester) beholdes gammel adferd.
 */
function freshnessLineFor(
  freshness: WeatherFreshness | undefined,
  hasNow: boolean,
): Readonly<{ label: string; warn: boolean }> {
  if (freshness === undefined) {
    return { label: hasNow ? 'Oppdatert nå' : 'Henter vær …', warn: false };
  }
  switch (freshness.kind) {
    case 'fresh':
      return { label: 'Oppdatert nå', warn: false };
    case 'stale':
      return { label: `Sist oppdatert ${formatClock(freshness.fetchedAt)}`, warn: true };
    case 'missing':
      return { label: 'Henter vær …', warn: false };
    case 'error':
      return {
        label: freshness.lastFetchedAt !== null
          ? `Sist oppdatert ${formatClock(freshness.lastFetchedAt)}`
          : 'Henter vær …',
        warn: true,
      };
  }
}

export type HjemMonterProps = Readonly<{
  cityLabel: string;
  lat: number;
  lon: number;
  now: WeatherNow | null;
  weatherStatus: 'idle' | 'loading' | 'ready' | 'offline' | 'error';
  /** T9A: §5-cachematrisens tilstand fra useWeather — driver friskhetslinjen. */
  weatherFreshness?: WeatherFreshness;
  /** T9A: sist-kjente værmåling fra persistent cache (visning, aldri motor). */
  weatherLastKnown?: WeatherNow | null;
  /** T9A: epoch ms for når sist-kjente data ble hentet (persistent cache). */
  weatherLastKnownAt?: number | null;
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
  weatherFreshness,
  weatherLastKnown = null,
  weatherLastKnownAt = null,
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
  // Eier-override v3 (2026-08-01): hvert CTA-trykk spiller nå den FULLE
  // koreografien (se scan-orchestration.ts) — livstidsflagget over hvorvidt
  // full-koreografien ALLEREDE er spilt (`hasPlayedFullScanEver`) leses ikke
  // lenger her (ingen mikropass-gren igjen å velge mellom); feltet selv blir
  // stående ulest i scan-cache-store.ts (ingen migrasjonsstøy). Skriveren
  // (`markFullScanPlayedEver`) beholdes — se completeScan under.
  const markFullScanPlayedEver = useScanCache((state) => state.markFullScanPlayedEver);

  const identity = useMemo<ScanIdentity>(() => ({
    childId,
    dateKey: localDateKey(),
    placeKey: `place:${lat.toFixed(3)},${lon.toFixed(3)}`,
    activity,
    engineVersion: WOOL_LAYERS_ENGINE_VERSION,
  }), [childId, lat, lon, activity]);

  /** v4: nøkkelminnet er scopet til barn+dag — aktivitet/sted er BEVISST
   *  utenfor, siden det er nettopp de to som kan bytte fram og tilbake og
   *  likevel lande på et svar appen allerede holder. */
  const resultKeyMemoryScope = resultKeyScope(childId, identity.dateKey);

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

  // ── v4: nøkkelen leses FØR trykket ───────────────────────────────────────
  // Dette er hele poenget med eier-override v4: `ctaPlan` er beregnet på
  // render-tid, av fingerprinten som allerede fantes, og bestemmer både
  // knappeteksten, linja under den, OG hvilken vei `handleFindOutfitTap`
  // tar. Slottet er ETT oppslag (barnets persisterte svar); `sessionResult-
  // Keys` er resten av øktens nøkler — sammen utgjør de nøkkeloppslaget.
  const daySlot = slots[identity.childId] ?? null;
  const persistedResultKey = daySlot !== null && daySlot.identity.dateKey === identity.dateKey
    ? daySlot.resultKey
    : null;
  const ctaPlan = planCta(
    currentResultKey,
    persistedResultKey,
    sessionResultKeys,
    resultKeyMemoryScope,
  );

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
  // T9A: hookens persistente sist-kjente (weatherLastKnown) dekker KALD
  // oppstart uten nett — komponent-minnet (lastKnown) dekker som før tap av
  // vær i en levende økt. Fortsatt kun visning, aldri motor-input.
  const lastKnownNow = lastKnown ?? weatherLastKnown;
  const lastKnownAt = lastKnown?.observedAt.getTime()
    ?? weatherLastKnown?.observedAt.getTime()
    ?? weatherLastKnownAt;

  // ── Timer-håndtak for scan/recalc-fullføring ────────────────────────────
  const timerCancelRef = useRef<(() => void) | null>(null);
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
   * Eier-override v3: sann når 3,2s-scanningens timer fyrte MENS motoren
   * ikke hadde et resultat klart ennå — «ærlig lastetilstand» i stedet for
   * en stille "scanning" uten forklaring. Effekten under fullfører
   * automatisk idet resultatet blir klart, uten et nytt trykk. ALDRI satt
   * sann for en cachet umiddelbar visning (show-cached-grenen kaller
   * `completeScan` aldri).
   */
  const [awaitingScanData, setAwaitingScanData] = useState(false);
  /**
   * v4: 'recalculating' har ikke lenger ÉN lengde. Inline justering
   * (aktivitets-toggle) er fortsatt 220 ms, mens eksplisitt «Beregn på nytt»
   * spiller den fulle koreografien — og da må ScanOverlay få den SAMME
   * lengden som timeren, ellers stopper scanlinjen etter 220 ms og panelet
   * blir stående dødt i tre sekunder. Settes ved hver start av en
   * omberegning (se planRecalc-kallerne under).
   */
  const [recalcDurationMs, setRecalcDurationMs] = useState<number>(QUICK_RECALC_DURATION_MS);

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
      // Eier-override v3: motor ikke klar ved 3,2s-grensen — ærlig
      // lastetilstand i stedet for å bli stående i en stille "scanning" uten
      // forklaring. ALDRI landings-haptikk her — ingenting landet.
      setAwaitingScanData(true);
      return;
    }
    setAwaitingScanData(false);
    setIsFresh(true);
    // Landing: prepare() rett før medium (duel §3 — "prepare() først").
    void hapticPrepare().then(() => { void impactMedium(); });
    // v4: nøkkelen appen nettopp landet er nå et svar den HOLDER — neste
    // gang den dukker opp skal seremonien ikke spilles på nytt.
    rememberResultKey(sessionResultKeys, resultKeyMemoryScope, resultKey);
    scan.scanCompleted(resultKey);
    // Eier-override v3: ETHVERT trykk spiller nå den fulle koreografien —
    // markFullScanPlayedEver() kalles derfor ubetinget (feltet selv leses
    // ikke lenger noe sted, se useScanCache-kommentaren over).
    markFullScanPlayedEver();
    commitSlot({
      identity,
      resultKey,
      completedAt: Date.now(),
      scanPlayedInFullToday: true,
    });
  }, [scan, commitSlot, identity, markFullScanPlayedEver, resultKeyMemoryScope]);

  // Auto-fullfører scanningen (uten et nytt trykk) idet motoren ENDELIG har
  // et resultat, hvis 3,2s-grensen rakk å gå ut mens vi ventet (se
  // awaitingScanData-kommentaren over).
  useEffect(() => {
    if (!awaitingScanData || currentResultKey === null) return;
    completeScan();
  }, [awaitingScanData, currentResultKey, completeScan]);

  /**
   * `withLanding` er sann kun for den EKSPLISITTE «Beregn på nytt»-veien
   * (planRecalc → ceremony: true), som spiller den fulle koreografien og
   * derfor skal lande med samme haptikk som en vanlig scan. Den inline
   * 220 ms-omberegningen (aktivitets-toggle) har bevisst ingen haptikk —
   * se scan-orchestration.ts sin QUICK_RECALC_DURATION_MS-kommentar.
   */
  const completeRecalc = useCallback((withLanding = false) => {
    const resultKey = currentResultKeyRef.current;
    if (resultKey === null) {
      scan.recalcFailed();
      return;
    }
    setIsFresh(true);
    if (withLanding) void hapticPrepare().then(() => { void impactMedium(); });
    rememberResultKey(sessionResultKeys, resultKeyMemoryScope, resultKey);
    scan.recalcCompleted(resultKey);
    commitSlot({
      identity,
      resultKey,
      completedAt: Date.now(),
      scanPlayedInFullToday: slots[identity.childId]?.scanPlayedInFullToday === true,
    });
  }, [scan, commitSlot, identity, slots, resultKeyMemoryScope]);

  // ── Mount / identitetsendring ────────────────────────────────────────────
  useEffect(() => {
    if (now === null) return; // ingen brukbar vær-basis ennå — ikke gjør noe.
    const phase = scan.state.phase;

    if (phase === 'weather-ready') {
      if (seenIdentityRef.current === null) {
        const exact = getSlotForIdentity(slots, identity);
        const decision = decideScanEntry(exact);
        if (decision.kind === 'show-cached') {
          // isFresh er allerede false fra useState(false) — cachet
          // umiddelbar visning skal ALDRI trigge inn-animasjonen.
          scan.scanStarted(identity);
          scan.scanCompleted(decision.resultKey);
          // v4: også et svar appen holder — legges i nøkkelminnet slik at et
          // senere aktivitetsbytte som lander på samme antrekk gjenkjennes.
          rememberResultKey(sessionResultKeys, resultKeyMemoryScope, decision.resultKey);
        }
      }
      seenIdentityRef.current = identity;
      return;
    }

    if (seenIdentityRef.current !== null && !sameScanIdentity(seenIdentityRef.current, identity)) {
      setPreviousActivity(seenIdentityRef.current.activity as MonterActivity);
      setPreviousResultCount(recommendation ? deriveResultRows(recommendation).length : null);
      seenIdentityRef.current = identity;
      // Inline justering — 220 ms, uendret av v4. Lengden settes eksplisitt
      // slik at en tidligere «Beregn på nytt» ikke etterlater 3,2 s her.
      setRecalcDurationMs(QUICK_RECALC_DURATION_MS);
      scan.identityChanged(identity, { autoRecalculate: true });
      runTimer(QUICK_RECALC_DURATION_MS, completeRecalc);
    }
  }, [identity, now, scan, slots, runTimer, completeRecalc, recommendation, resultKeyMemoryScope]);

  /**
   * v4 «reveal»-veien: fingerprinten er kjent, altså holder appen allerede
   * svaret. Ingen timer, ingen avhukings-haptikk, ingen `.is-fresh` (et
   * cachet svar skal stå der, ikke animere inn — samme regel som den
   * cachede gjenåpningen i mount-effekten). Landings-haptikken er den
   * SAMME som en ekte scan har, fordi resultatet står stabilt i samme
   * øyeblikk: ett følt signal, ikke to (art bible, fullføringsmarkøren).
   */
  const revealCachedResult = useCallback((resultKey: string) => {
    clearTimer();
    clearHapticTimers();
    setAwaitingScanData(false);
    setIsFresh(false);
    void hapticPrepare().then(() => { void impactMedium(); });
    scan.scanStarted(identity);
    scan.scanCompleted(resultKey);
    rememberResultKey(sessionResultKeys, resultKeyMemoryScope, resultKey);
    commitSlot({
      identity,
      resultKey,
      completedAt: Date.now(),
      scanPlayedInFullToday: slots[identity.childId]?.scanPlayedInFullToday === true,
    });
  }, [clearTimer, clearHapticTimers, scan, identity, commitSlot, slots, resultKeyMemoryScope]);

  const handleFindOutfitTap = useCallback(() => {
    const resultKey = currentResultKeyRef.current;
    if (resultKey === null) return;
    // Eier-override v4: fingerprinten — lest FØR trykket, se ctaPlan over —
    // avgjør veien. Kjent nøkkel → rett til svaret. Ukjent nøkkel → full
    // 3,2s-koreografi, uendret fra v3.
    if (ctaPlan.path === 'reveal') {
      revealCachedResult(resultKey);
      return;
    }
    setAwaitingScanData(false);
    scan.scanStarted(identity);
    runPreLandingHapticSchedule(fullScanHapticSchedule(FULL_SCAN_DURATION_MS));
    runTimer(FULL_SCAN_DURATION_MS, completeScan);
  }, [ctaPlan, revealCachedResult, identity, scan, runTimer, completeScan, runPreLandingHapticSchedule]);

  /**
   * v4: «Beregn på nytt» (vær-basis / mislykket omberegning) er en eksplisitt
   * bestilling av nytt arbeid og spiller full seremoni; «Se antrekk for
   * vogn» (identitets-endring brukeren nettopp gjorde) er en inline
   * justering og beholder 220 ms. Se planRecalc.
   */
  const handleStaleCtaTap = useCallback((reason: ScanStaleReason) => {
    const plan = planRecalc(reason);
    setRecalcDurationMs(plan.durationMs);
    scan.recalcStarted();
    if (plan.ceremony) {
      runPreLandingHapticSchedule(fullScanHapticSchedule(plan.durationMs));
      runTimer(plan.durationMs, () => completeRecalc(true));
      return;
    }
    runTimer(plan.durationMs, completeRecalc);
  }, [scan, runTimer, completeRecalc, runPreLandingHapticSchedule]);

  const handleSkip = useCallback(() => {
    clearTimer();
    // Duel §2: "Berøring når som helst: hopp rett til resultat, spill kun
    // landingen" — kanseller ev. gjenstående avhukings-haptikk (soft/
    // selection) som ellers ville fyrt SENERE enn selve resultatet.
    // Landingen (prepare+medium) eies allerede utelukkende av completeScan.
    clearHapticTimers();
    if (scan.state.phase === 'scanning') completeScan();
    // v4: `true` fordi «Beregn på nytt» nå kan være en FULL seremoni — duel
    // §2 sier «hopp rett til resultat, spill kun landingen», og en skippet
    // omberegning skal ikke lande stillere enn en som fikk gå ferdig.
    else if (scan.state.phase === 'recalculating') completeRecalc(true);
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
  // T9A: sann friskhetslinje (erstatter hardkodet «Oppdatert nå»).
  const freshnessLine = freshnessLineFor(weatherFreshness, now !== null);

  const phase = scan.state.phase;

  if (phase === 'scanning' || phase === 'recalculating') {
    const isFullScan = phase === 'scanning';
    // v4: omberegningen har to lengder (se recalcDurationMs) — overlayen må
    // få den som faktisk kjører, ikke en antatt konstant.
    const totalDurationMs = isFullScan ? FULL_SCAN_DURATION_MS : recalcDurationMs;
    const tempLabel = now ? `${formatTemp(now.tempC)}°, ${conditionLabel.toLowerCase()}` : '–';
    return (
      <div className="hjem-monter">
        <div className="hjm-top"><span className="hjm-brand">BABYORA</span></div>
        <div className="hjm-panel-slot" data-with-mascot="true" data-compact="true">
          {/* Del 3 (nysgjerrig maskot under scannen): bøyer hodet ned og
              retter blikket mot scan-animasjonen under seg — se
              MascotPeek.tsx sin crossfade-dokumentasjon. Tilbake til
              'normal' skjer implisitt idet fasen forlater scanning/
              recalculating (andre grener kaller MascotPeek uten pose). */}
          <MascotIdle compact pose="curious" reducedMotion={reducedMotion} />
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
        <div className="hjm-panel-slot" data-with-mascot="true" data-compact="true">
          <MascotIdle compact reducedMotion={reducedMotion} />
          <WeatherScene
            cityLabel={cityLabel}
            nuance={nuance}
            tempC={now?.tempC ?? null}
            feelsLikeC={now?.feelsLikeC ?? null}
            noteText={now ? `Værbasert: ${conditionLabel.toLowerCase()}.` : 'Henter vær…'}
            weatherIconSrc={weatherIconSrc}
            weatherIconAlt={conditionLabel}
            freshnessLabel={freshnessLine.label}
            freshnessWarn={freshnessLine.warn}
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
            <button
              type="button"
              className="hjm-cta"
              data-cta-path={planRecalc(reason).ceremony ? 'ceremony' : 'inline'}
              onClick={() => handleStaleCtaTap(reason)}
            >
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
  // (`daySlot` er hentet lenger opp — v4s nøkkeloppslag trenger den før
  // fase-grenene, se `persistedResultKey`.)
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
        <div className="hjm-panel-slot" data-with-mascot="true" data-compact="true">
          <MascotIdle compact reducedMotion={reducedMotion} />
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
            <button
              type="button"
              className="hjm-cta"
              data-cta-path={ctaPlan.path}
              onClick={handleFindOutfitTap}
              disabled={!canScan}
            >
              {ctaPlan.label}
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
      <div className="hjm-panel-slot" data-with-mascot="true" data-compact="false">
        {/* Eier-override v3 (2026-08-01): Hjem er statisk til CTA-trykk —
            åpningsklatringen (OpeningSequence) er fjernet. MascotIdle tar
            over MascotPeeks normale visning her: samme statiske bilde i
            hvile, med et sjeldent nysgjerrig-glimt (se MascotIdle.tsx). */}
        <MascotIdle reducedMotion={reducedMotion} />
        <WeatherScene
          cityLabel={cityLabel}
          nuance={nuance}
          tempC={now?.tempC ?? null}
          feelsLikeC={now?.feelsLikeC ?? null}
          noteText={now ? `${conditionLabel} — sjekk antrekket før dere går ut.` : 'Henter vær…'}
          weatherIconSrc={weatherIconSrc}
          weatherIconAlt={conditionLabel}
          freshnessLabel={freshnessLine.label}
          freshnessWarn={freshnessLine.warn}
          activity={activity}
          onActivityChange={onActivityChange}
          onAdjustLocation={handleOpenAdjust}
        />
      </div>
      <div className="hjm-body">
        <div className="hjm-ask-block">
          <h1 className="hjm-ask">Klar for en liten tur?</h1>
          <p className="hjm-child">{childLine}</p>
          {/* v4: teksten OG veien kommer fra samme plan — en knapp som sier
              «Vis» men spiller 3,2 s ville vært den løgnen overrideen
              handler om. data-cta-path gjør valget maskinmålbart. */}
          <button
            type="button"
            className="hjm-cta"
            data-cta-path={ctaPlan.path}
            onClick={handleFindOutfitTap}
            disabled={!canScan}
          >
            {ctaPlan.label}
            <ArrowIcon />
          </button>
          <p className="hjm-trust">
            <CheckIcon />
            {ctaPlan.line}
          </p>
        </div>
      </div>
    </div>
  );
}
