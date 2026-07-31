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
import { WeatherScene, type MonterActivity } from './WeatherScene.js';
import { WeatherStrip } from './WeatherStrip.js';
import { MascotPeek } from './MascotPeek.js';
import { ScanOverlay, ScanStatusBlock } from './ScanOverlay.js';
import type { OutfitTransitionStatusLike } from './scan-overlay-guard.js';
import { ResultSurface } from './ResultSurface.js';
import { deriveResultRows } from './result-rows.js';
import {
  activityChangeChip,
  decideScanEntry,
  FULL_SCAN_DURATION_MS,
  QUICK_RECALC_DURATION_MS,
  staleCtaLabel,
  staleHeadline,
} from './scan-orchestration.js';

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
}: HjemMonterProps) {
  const scan = useScanCoordinator();
  const slots = useScanCache((state) => state.slots);
  const commitSlot = useScanCache((state) => state.commitSlot);

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

  const completeScan = useCallback(() => {
    const resultKey = currentResultKeyRef.current;
    if (resultKey === null) return; // motor ikke klar ennå — bli stående i scanning, ingen krasj.
    setIsFresh(true);
    scan.scanCompleted(resultKey);
    commitSlot({
      identity,
      resultKey,
      completedAt: Date.now(),
      scanPlayedInFullToday: pendingFullScanRef.current || slots[identity.childId]?.scanPlayedInFullToday === true,
    });
  }, [scan, commitSlot, identity, slots]);

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
        const daySlot = slots[identity.childId] ?? null;
        const decision = decideScanEntry(exact, daySlot, identity);
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
  }, [identity, now, scan, slots, runTimer, completeRecalc, recommendation]);

  const handleFindOutfitTap = useCallback(() => {
    if (currentResultKeyRef.current === null) return;
    const daySlot = slots[identity.childId] ?? null;
    const playFull = shouldPlayFullScan(daySlot, identity);
    pendingFullScanRef.current = playFull;
    scan.scanStarted(identity);
    runTimer(playFull ? FULL_SCAN_DURATION_MS : QUICK_RECALC_DURATION_MS, completeScan);
  }, [slots, identity, scan, runTimer, completeScan]);

  const handleStaleCtaTap = useCallback(() => {
    scan.recalcStarted();
    runTimer(QUICK_RECALC_DURATION_MS, completeRecalc);
  }, [scan, runTimer, completeRecalc]);

  const handleSkip = useCallback(() => {
    clearTimer();
    if (scan.state.phase === 'scanning') completeScan();
    else if (scan.state.phase === 'recalculating') completeRecalc();
  }, [clearTimer, scan, completeScan, completeRecalc]);

  // TODO(P5): Juster/Bytt/Hvorfor/Vis forrige antrekk/Prøv å hente været igjen
  // er alle no-op-stubber her — P5 kobler dem til de faktiske drillene
  // (vær/sted/aktivitet-justering, plagg-bytte-arket, forklarings-arket,
  // og en manuell vær-refetch-trigger som krever en refreshKey inn i
  // HjemScreen sin UENDREDE useWeather-kalling, utenfor denne pakkens scope).
  const noopStub = useCallback(() => {}, []);

  const nuance = getWeatherNuance(now?.symbolCode ?? lastKnownNow?.symbolCode);
  const conditionLabel = getConditionLabel(now?.symbolCode ?? lastKnownNow?.symbolCode);
  const weatherIconSrc = getWeatherIcon(now?.symbolCode ?? lastKnownNow?.symbolCode);
  const childLine = `${childName} · ${ageMonths} måneder · ${ACTIVITY_CHILD_LINE[activity]}`;
  const canScan = currentResultKey !== null;

  const phase = scan.state.phase;

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
              onAdjust={noopStub}
            />
          )}
        </div>
        <div className="hjm-body">
          <ResultSurface
            rows={rows}
            childLabel={`${rows.length} plagg for ${childName}, innerst til ytterst`}
            isFresh={isFresh}
            reducedMotion={reducedMotion}
            onSwapRow={noopStub}
            onStartDressing={onStartDressing}
            startDressingDisabled={startDressingDisabled}
            onWhy={noopStub}
          />
        </div>
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
  const offline = weatherStatus === 'offline'
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
            <button type="button" className="hjm-cta-ghost" onClick={noopStub}>
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
