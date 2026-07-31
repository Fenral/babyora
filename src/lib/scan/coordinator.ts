/**
 * scan/coordinator — ren tilstandsmaskin for Hjem sin skann-opplevelse (P3).
 *
 * Klonet stilmessig fra lib/outfit-transition/coordinator.ts: en frosset,
 * serialiserbar diskriminert union som state, et lite closure-objekt med
 * eksplisitte event-funksjoner (ingen reducer/action-type-boilerplate), og
 * en subscribe()/getState() overflate kompatibel med useSyncExternalStore.
 *
 * Tilstander (ScanPhase, se ./types.ts):
 *   weather-ready → scanning → result-current ⇄ result-stale → recalculating
 *
 * Events:
 *  - weatherReady()            idempotent gate; endrer ALDRI en aktiv
 *                               scanning/result-fase (kall trygt på hver
 *                               værrefresh uten å ødelegge pågående state).
 *  - scanStarted(identity)      weather-ready → scanning (FØRSTE scan i dag,
 *                               full 2.1s-koreografi — se product-model).
 *  - scanCompleted(resultKey)   scanning → result-current.
 *  - identityChanged(next, {autoRecalculate}) — barn/dato/sted/aktivitet/
 *    motor-versjon endret seg. Gjelder fra enhver fase MED en etablert
 *    identitet (alle unntatt weather-ready). Samme identitet = no-op.
 *    Ulik identitet → recalculating (autoRecalculate: true, f.eks.
 *    aktivitets-toggle — "automatisk inline-rekalkulering") ELLER
 *    result-stale med reason 'identity-changed' (autoRecalculate falsy).
 *  - weatherBasisChanged()      result-current → result-stale (reason
 *                               'weather-basis'). Værgrunnlaget er BEVISST
 *                               ikke del av ScanIdentity — dette er den
 *                               dedikerte "dirty"-veien for vær-endringer.
 *  - recalcStarted()            result-current | result-stale → recalculating
 *                               (manuell "Regn på nytt"-trigger).
 *  - recalcCompleted(resultKey) recalculating → result-current.
 *  - recalcFailed()             recalculating → result-stale (reason
 *                               'recalc-failed').
 *  - reset()                    → weather-ready fra enhver fase.
 *
 * Alle ugyldige overganger (feil fra-fase) er no-op — state returneres
 * uendret, ingen lyttere varsles. Dette er bevisst "fail closed": en
 * pakke som kaller feil event i feil fase skal aldri korrumpere state.
 */
import type {
  ScanIdentity,
  ScanStaleReason,
} from './types.js';
import { sameScanIdentity } from './types.js';

export type ScanCoordinatorState =
  | Readonly<{ phase: 'weather-ready' }>
  | Readonly<{ phase: 'scanning'; identity: ScanIdentity }>
  | Readonly<{
      phase: 'result-current';
      identity: ScanIdentity;
      resultKey: string;
    }>
  | Readonly<{
      phase: 'result-stale';
      identity: ScanIdentity;
      lastResultKey: string | null;
      reason: ScanStaleReason;
    }>
  | Readonly<{
      phase: 'recalculating';
      identity: ScanIdentity;
      lastResultKey: string | null;
    }>;

export type ScanIdentityChangeOptions = Readonly<{
  /**
   * true → gå rett til 'recalculating' (kort inline-rekalkulering, f.eks.
   * aktivitets-toggle). false/undefined → gå til 'result-stale' (viser
   * siste kjente resultat markert stale, venter på eksplisitt recalcStarted).
   */
  autoRecalculate?: boolean;
}>;

export type ScanCoordinator = Readonly<{
  getState: () => ScanCoordinatorState;
  subscribe: (listener: () => void) => () => void;
  weatherReady: () => ScanCoordinatorState;
  scanStarted: (identity: ScanIdentity) => ScanCoordinatorState;
  scanCompleted: (resultKey: string) => ScanCoordinatorState;
  identityChanged: (
    nextIdentity: ScanIdentity,
    options?: ScanIdentityChangeOptions,
  ) => ScanCoordinatorState;
  weatherBasisChanged: () => ScanCoordinatorState;
  recalcStarted: () => ScanCoordinatorState;
  recalcCompleted: (resultKey: string) => ScanCoordinatorState;
  recalcFailed: () => ScanCoordinatorState;
  reset: () => ScanCoordinatorState;
}>;

const WEATHER_READY_STATE: ScanCoordinatorState = Object.freeze({
  phase: 'weather-ready' as const,
});

/** Siste kjente resultKey uansett hvilken av de fire "aktive" fasene vi er i (alle unntatt weather-ready har en identity; kun scanning mangler en tidligere resultKey). */
function lastKnownResultKey(
  state: Exclude<ScanCoordinatorState, { phase: 'weather-ready' }>,
): string | null {
  if (state.phase === 'result-current') return state.resultKey;
  if (state.phase === 'scanning') return null;
  return state.lastResultKey;
}

export function createScanCoordinator(): ScanCoordinator {
  let state: ScanCoordinatorState = WEATHER_READY_STATE;
  const listeners = new Set<() => void>();

  const publish = (
    nextState: ScanCoordinatorState,
  ): ScanCoordinatorState => {
    state = nextState;
    for (const listener of listeners) listener();
    return state;
  };

  return Object.freeze({
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    weatherReady: () => {
      // Idempotent gate: kun en effekt (ingen, faktisk — vi er allerede der)
      // når fasen ALLEREDE er weather-ready. Fra enhver annen fase er dette
      // bevisst no-op: en værrefresh skal aldri stille avbryte en pågående
      // scan eller kaste bort et vist resultat. Bruk reset() for det.
      return state;
    },

    scanStarted: (identity) => {
      if (state.phase !== 'weather-ready') return state;
      return publish(Object.freeze({ phase: 'scanning' as const, identity }));
    },

    scanCompleted: (resultKey) => {
      if (state.phase !== 'scanning') return state;
      return publish(Object.freeze({
        phase: 'result-current' as const,
        identity: state.identity,
        resultKey,
      }));
    },

    identityChanged: (nextIdentity, options) => {
      if (state.phase === 'weather-ready') return state;
      if (sameScanIdentity(state.identity, nextIdentity)) return state;

      const previousResultKey = lastKnownResultKey(state);
      if (options?.autoRecalculate === true) {
        return publish(Object.freeze({
          phase: 'recalculating' as const,
          identity: nextIdentity,
          lastResultKey: previousResultKey,
        }));
      }
      return publish(Object.freeze({
        phase: 'result-stale' as const,
        identity: nextIdentity,
        lastResultKey: previousResultKey,
        reason: 'identity-changed' as const,
      }));
    },

    weatherBasisChanged: () => {
      if (state.phase !== 'result-current') return state;
      return publish(Object.freeze({
        phase: 'result-stale' as const,
        identity: state.identity,
        lastResultKey: state.resultKey,
        reason: 'weather-basis' as const,
      }));
    },

    recalcStarted: () => {
      if (state.phase !== 'result-current' && state.phase !== 'result-stale') {
        return state;
      }
      return publish(Object.freeze({
        phase: 'recalculating' as const,
        identity: state.identity,
        lastResultKey: lastKnownResultKey(state),
      }));
    },

    recalcCompleted: (resultKey) => {
      if (state.phase !== 'recalculating') return state;
      return publish(Object.freeze({
        phase: 'result-current' as const,
        identity: state.identity,
        resultKey,
      }));
    },

    recalcFailed: () => {
      if (state.phase !== 'recalculating') return state;
      return publish(Object.freeze({
        phase: 'result-stale' as const,
        identity: state.identity,
        lastResultKey: state.lastResultKey,
        reason: 'recalc-failed' as const,
      }));
    },

    reset: () => {
      if (state.phase === 'weather-ready') return state;
      return publish(WEATHER_READY_STATE);
    },
  });
}
