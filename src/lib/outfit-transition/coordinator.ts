import type {
  EligibleTransitionSnapshot,
} from './eligibility.js';
import type {
  TransitionSnapshot,
} from './transition-snapshot.js';

export type OutfitTransitionSettlementReason =
  | 'completed'
  | 'candidate-mismatch'
  | 'invalid-bundle'
  | 'invalid-source'
  | 'already-attempted'
  | 'motion-ineligible'
  | 'adapter-static'
  | 'eligibility-static'
  | 'page-hidden'
  | 'pagehide'
  | 'resized'
  | 'orientation-changed'
  | 'scrolled'
  | 'identity-changed'
  | 'closed'
  | 'unmounted'
  | 'superseded';

export type OutfitTransitionCoordinatorState =
  | Readonly<{ status: 'idle' }>
  | Readonly<{
      status: 'captured';
      sourceSnapshot: TransitionSnapshot;
    }>
  | Readonly<{
      status: 'ready';
      snapshot: EligibleTransitionSnapshot;
    }>
  | Readonly<{
      status: 'playing';
      snapshot: EligibleTransitionSnapshot;
    }>
  | Readonly<{
      status: 'settled';
      reason: OutfitTransitionSettlementReason;
    }>;

export type OutfitTransitionCoordinator = Readonly<{
  getState: () => OutfitTransitionCoordinatorState;
  subscribe: (listener: () => void) => () => void;
  capture: (
    sourceSnapshot: TransitionSnapshot,
  ) => OutfitTransitionCoordinatorState;
  markReady: (
    snapshot: EligibleTransitionSnapshot,
  ) => OutfitTransitionCoordinatorState;
  beginPlayback: () => OutfitTransitionCoordinatorState;
  settle: (
    reason: OutfitTransitionSettlementReason,
  ) => OutfitTransitionCoordinatorState;
  abort: (
    reason: OutfitTransitionSettlementReason,
  ) => OutfitTransitionCoordinatorState;
}>;

const IDLE_STATE = Object.freeze({ status: 'idle' as const });

function sameCandidate(
  source: TransitionSnapshot,
  candidate: EligibleTransitionSnapshot,
): boolean {
  return (
    source.identity.snapshotId === candidate.identity.snapshotId
    && source.identity.recommendationFingerprint
      === candidate.identity.recommendationFingerprint
    && source.identity.transitionContextId
      === candidate.identity.transitionContextId
    && source.items.length === candidate.items.length
    && source.items.every(
      (item, index) => item.itemId === candidate.items[index]?.itemId,
    )
  );
}

export function createOutfitTransitionCoordinator():
OutfitTransitionCoordinator {
  let state: OutfitTransitionCoordinatorState = IDLE_STATE;
  const listeners = new Set<() => void>();

  const publish = (
    nextState: OutfitTransitionCoordinatorState,
  ): OutfitTransitionCoordinatorState => {
    state = nextState;
    for (const listener of listeners) listener();
    return state;
  };

  const settle = (
    reason: OutfitTransitionSettlementReason,
  ): OutfitTransitionCoordinatorState => {
    if (state.status === 'settled' && state.reason === reason) return state;
    return publish(Object.freeze({ status: 'settled', reason }));
  };

  return Object.freeze({
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    capture: (sourceSnapshot) => {
      if (
        state.status === 'captured'
        || state.status === 'ready'
        || state.status === 'playing'
      ) {
        publish(Object.freeze({
          status: 'settled',
          reason: 'superseded',
        }));
      }
      return publish(Object.freeze({
        status: 'captured',
        sourceSnapshot,
      }));
    },
    markReady: (snapshot) => {
      if (
        state.status !== 'captured'
        || !sameCandidate(state.sourceSnapshot, snapshot)
      ) {
        return settle('candidate-mismatch');
      }
      return publish(Object.freeze({ status: 'ready', snapshot }));
    },
    beginPlayback: () => {
      if (state.status !== 'ready') return state;
      return publish(Object.freeze({
        status: 'playing',
        snapshot: state.snapshot,
      }));
    },
    settle,
    abort: (reason) => (
      state.status === 'settled' ? state : settle(reason)
    ),
  });
}
