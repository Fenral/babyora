import {
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';
import { useNativeSettings } from './useNativeSettings.js';
import {
  isOutfitBundleProducerResult,
  type OutfitBundleProducerResult,
} from '../lib/outfit/outfit-bundle-producer.js';
import type { OutfitItemId } from '../lib/outfit/outfit-truth.js';
import {
  createOutfitTransitionCoordinator,
  type OutfitTransitionCoordinatorState,
  type OutfitTransitionSettlementReason,
} from '../lib/outfit-transition/coordinator.js';
import { decideTransitionEligibility } from '../lib/outfit-transition/eligibility.js';
import {
  createPhase2TransitionAdapter,
  type Phase2HomeSourceSelection,
  type RegisterHomeAnchor,
} from '../lib/outfit-transition/phase2-adapter.js';
import { createOutfitTransitionAttemptLedger } from '../lib/outfit-transition/replay-policy.js';
import {
  createTransitionSnapshot,
  type TransitionRectangle,
  type TransitionViewport,
} from '../lib/outfit-transition/transition-snapshot.js';
import type { RegisterOutfitRow } from '../lib/outfit/outfit-transition-contract.js';

type LifecycleEventReason =
  | 'page-hidden'
  | 'pagehide'
  | 'resized'
  | 'orientation-changed'
  | 'scrolled';

export type OutfitTransitionCoordinatorRuntimeEnvironment = Readonly<{
  getViewport: () => TransitionViewport;
  getDocumentVisibility: () => 'visible' | 'hidden';
  getReducedMotion: () => boolean;
  scheduleTargetReadiness: (callback: () => void) => () => void;
}>;

export type OutfitTransitionCoordinatorRuntime = Readonly<{
  getState: () => OutfitTransitionCoordinatorState;
  subscribe: (listener: () => void) => () => void;
  selectHomeSources: (
    bundle: OutfitBundleProducerResult | null | undefined,
  ) => Phase2HomeSourceSelection;
  registerHomeAnchor: RegisterHomeAnchor;
  registerOutfitRow: RegisterOutfitRow;
  captureBeforeNavigation: (
    bundle: OutfitBundleProducerResult | null | undefined,
  ) => OutfitTransitionCoordinatorState;
  observeBundle: (
    bundle: OutfitBundleProducerResult | null | undefined,
  ) => void;
  beginPlayback: () => OutfitTransitionCoordinatorState;
  settle: (
    reason: OutfitTransitionSettlementReason,
  ) => OutfitTransitionCoordinatorState;
  abort: (
    reason: OutfitTransitionSettlementReason,
  ) => OutfitTransitionCoordinatorState;
  handleLifecycle: (reason: LifecycleEventReason) => void;
  inspectRetention: () => Readonly<{
    homeElementCount: number;
    targetElementCount: number;
    hasActiveBundle: boolean;
    hasScheduledReadiness: boolean;
    disposed: boolean;
  }>;
  referencesElement: (element: HTMLElement) => boolean;
  dispose: () => void;
}>;

type LifecycleTargets = Readonly<{
  documentTarget: EventTarget;
  windowTarget: EventTarget;
  getDocumentVisibility: () => 'visible' | 'hidden';
}>;

function sameIdentity(
  left: Readonly<{
    snapshotId: string;
    recommendationFingerprint: string;
    transitionContextId: string;
  }>,
  right: Readonly<{
    snapshotId: string;
    recommendationFingerprint: string;
    transitionContextId: string;
  }>,
): boolean {
  return (
    left.snapshotId === right.snapshotId
    && left.recommendationFingerprint === right.recommendationFingerprint
    && left.transitionContextId === right.transitionContextId
  );
}

function exactSupportedBundle(
  bundle: OutfitBundleProducerResult | null | undefined,
): Extract<OutfitBundleProducerResult, { kind: 'supported' }> | null {
  return (
    isOutfitBundleProducerResult(bundle)
    && bundle.kind === 'supported'
  ) ? bundle : null;
}

function rectangleFor(element: HTMLElement): TransitionRectangle | null {
  try {
    if (
      typeof Element === 'undefined'
      || !(element instanceof Element)
      || element.isConnected !== true
    ) {
      return null;
    }
    const rect = element.getBoundingClientRect();
    if (
      !Number.isFinite(rect.x)
      || !Number.isFinite(rect.y)
      || !Number.isFinite(rect.width)
      || !Number.isFinite(rect.height)
      || rect.width <= 0
      || rect.height <= 0
    ) {
      return null;
    }
    return Object.freeze({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    });
  } catch {
    return null;
  }
}

export function createOutfitTransitionCoordinatorRuntime(
  environment: OutfitTransitionCoordinatorRuntimeEnvironment,
): OutfitTransitionCoordinatorRuntime {
  const coordinator = createOutfitTransitionCoordinator();
  const adapter = createPhase2TransitionAdapter();
  const ledger = createOutfitTransitionAttemptLedger();
  const homeElements = new Map<OutfitItemId, HTMLElement>();
  const targetElements = new Map<OutfitItemId, HTMLElement>();
  let activeBundle:
    | Extract<OutfitBundleProducerResult, { kind: 'supported' }>
    | null = null;
  let cancelTargetReadiness: (() => void) | null = null;
  let disposed = false;

  const clearTransient = (releaseHome = false): void => {
    if (cancelTargetReadiness !== null) {
      cancelTargetReadiness();
    }
    cancelTargetReadiness = null;
    activeBundle = null;
    targetElements.clear();
    adapter.clear();
    if (releaseHome) {
      homeElements.clear();
      return;
    }
    for (const [itemId, element] of homeElements) {
      if (element.isConnected !== true) {
        homeElements.delete(itemId);
      } else {
        adapter.registerHomeAnchor(itemId, element);
      }
    }
  };

  const settle = (
    reason: OutfitTransitionSettlementReason,
  ): OutfitTransitionCoordinatorState => {
    const state = coordinator.settle(reason);
    clearTransient();
    return state;
  };

  const abort = (
    reason: OutfitTransitionSettlementReason,
  ): OutfitTransitionCoordinatorState => {
    const state = coordinator.abort(reason);
    clearTransient();
    return state;
  };

  const evaluateTarget = (): void => {
    cancelTargetReadiness = null;
    if (disposed) return;
    const state = coordinator.getState();
    if (state.status !== 'captured' || activeBundle === null) return;

    const adapterResult = adapter.evaluate({
      outfitBundle: activeBundle,
      transitionVisualState: 'settled',
    });
    if (adapterResult.kind !== 'ready') {
      settle('adapter-static');
      return;
    }

    const rectangles = new Map<OutfitItemId, TransitionRectangle>();
    for (const registration of adapterResult.outfitRows) {
      const rectangle = rectangleFor(registration.element);
      if (rectangle !== null) rectangles.set(registration.itemId, rectangle);
    }
    const target = createTransitionSnapshot({
      identity: adapterResult.identity,
      viewport: environment.getViewport(),
      orderedItemIds: adapterResult.itemIds,
      rectanglesByItemId: rectangles,
    });
    if (target.kind !== 'captured') {
      settle('eligibility-static');
      return;
    }

    const decision = decideTransitionEligibility({
      expectedIdentity: adapterResult.identity,
      expectedItemIds: adapterResult.itemIds,
      sourceSnapshot: state.sourceSnapshot,
      targetSnapshot: target.snapshot,
      currentViewport: environment.getViewport(),
      motion: environment.getReducedMotion() ? 'reduced' : 'allowed',
      documentVisibility: environment.getDocumentVisibility(),
      lifecycle: 'active',
    });
    if (decision.kind !== 'animate') {
      settle('eligibility-static');
      return;
    }
    coordinator.markReady(decision.snapshot);
  };

  const scheduleEvaluation = (): void => {
    if (
      disposed
      || coordinator.getState().status !== 'captured'
    ) {
      return;
    }
    if (cancelTargetReadiness !== null) {
      cancelTargetReadiness();
    }
    cancelTargetReadiness =
      environment.scheduleTargetReadiness(evaluateTarget);
  };

  const registerHomeAnchor: RegisterHomeAnchor = (itemId, element) => {
    if (disposed) return;
    const previous = homeElements.get(itemId);
    if (previous !== undefined && previous !== element) {
      adapter.registerHomeAnchor(itemId, null);
    }
    if (element === null) {
      homeElements.delete(itemId);
      adapter.registerHomeAnchor(itemId, null);
    } else {
      homeElements.set(itemId, element);
      adapter.registerHomeAnchor(itemId, element);
    }
  };

  const registerOutfitRow: RegisterOutfitRow = (itemId, element) => {
    if (disposed) return;
    const previous = targetElements.get(itemId);
    if (element === null) {
      targetElements.delete(itemId);
      adapter.registerOutfitRow(itemId, null);
      return;
    }
    const state = coordinator.getState();
    if (
      state.status !== 'captured'
      && state.status !== 'ready'
      && state.status !== 'playing'
    ) {
      targetElements.delete(itemId);
      adapter.registerOutfitRow(itemId, null);
      return;
    }
    if (previous !== undefined && previous !== element) {
      adapter.registerOutfitRow(itemId, null);
    }
    targetElements.set(itemId, element);
    adapter.registerOutfitRow(itemId, element);
    scheduleEvaluation();
  };

  const captureBeforeNavigation = (
    rawBundle: OutfitBundleProducerResult | null | undefined,
  ): OutfitTransitionCoordinatorState => {
    if (disposed) return coordinator.getState();
    const bundle = exactSupportedBundle(rawBundle);
    const selection = adapter.selectHomeSources(rawBundle);
    if (bundle === null || selection.kind !== 'ready') {
      return settle('invalid-bundle');
    }

    const identity = selection.identity;
    const replay = ledger.consume(identity, {
      animationEligible: !environment.getReducedMotion(),
    });
    if (replay.kind === 'invalid-identity') {
      return settle('invalid-bundle');
    }
    if (replay.kind === 'settle-static') {
      return settle(
        replay.reason === 'already-attempted'
          ? 'already-attempted'
          : 'motion-ineligible',
      );
    }

    const homeEvaluation = adapter.evaluate({
      outfitBundle: bundle,
      transitionVisualState: 'settled',
    });
    if (
      homeEvaluation.kind === 'static-only'
      && homeEvaluation.reason !== 'missing-outfit-row'
    ) {
      return settle('invalid-source');
    }

    const itemIds = selection.sources.map(({ itemId }) => itemId);
    const rectangles = new Map<OutfitItemId, TransitionRectangle>();
    for (const itemId of itemIds) {
      const element = homeElements.get(itemId);
      if (element === undefined) continue;
      const rectangle = rectangleFor(element);
      if (rectangle !== null) rectangles.set(itemId, rectangle);
    }
    const source = createTransitionSnapshot({
      identity,
      viewport: environment.getViewport(),
      orderedItemIds: itemIds,
      rectanglesByItemId: rectangles,
    });
    if (source.kind !== 'captured') return settle('invalid-source');

    activeBundle = bundle;
    return coordinator.capture(source.snapshot);
  };

  return Object.freeze({
    getState: coordinator.getState,
    subscribe: coordinator.subscribe,
    selectHomeSources: adapter.selectHomeSources,
    registerHomeAnchor,
    registerOutfitRow,
    captureBeforeNavigation,
    observeBundle: (rawBundle) => {
      const state = coordinator.getState();
      if (
        state.status !== 'captured'
        && state.status !== 'ready'
        && state.status !== 'playing'
      ) {
        return;
      }
      const bundle = exactSupportedBundle(rawBundle);
      if (
        bundle === null
        || !sameIdentity(state.status === 'captured'
          ? state.sourceSnapshot.identity
          : state.snapshot.identity, bundle.base)
      ) {
        abort('identity-changed');
      }
    },
    beginPlayback: () => (
      disposed ? coordinator.getState() : coordinator.beginPlayback()
    ),
    settle,
    abort,
    handleLifecycle: (reason) => {
      if (!disposed) abort(reason);
    },
    inspectRetention: () => Object.freeze({
      homeElementCount: homeElements.size,
      targetElementCount: targetElements.size,
      hasActiveBundle: activeBundle !== null,
      hasScheduledReadiness: cancelTargetReadiness !== null,
      disposed,
    }),
    referencesElement: (element) => (
      [...homeElements.values()].includes(element)
      || [...targetElements.values()].includes(element)
    ),
    dispose: () => {
      if (disposed) return;
      coordinator.abort('unmounted');
      clearTransient(true);
      disposed = true;
    },
  });
}

export function bindOutfitTransitionLifecycle(
  runtime: OutfitTransitionCoordinatorRuntime,
  targets: LifecycleTargets,
): () => void {
  const onVisibilityChange = (): void => {
    if (targets.getDocumentVisibility() === 'hidden') {
      runtime.handleLifecycle('page-hidden');
    }
  };
  const onPageHide = (): void => runtime.handleLifecycle('pagehide');
  const onResize = (): void => runtime.handleLifecycle('resized');
  const onOrientation = (): void =>
    runtime.handleLifecycle('orientation-changed');
  const onScroll = (): void => runtime.handleLifecycle('scrolled');

  targets.documentTarget.addEventListener(
    'visibilitychange',
    onVisibilityChange,
  );
  targets.windowTarget.addEventListener('pagehide', onPageHide);
  targets.windowTarget.addEventListener('resize', onResize);
  targets.windowTarget.addEventListener('orientationchange', onOrientation);
  targets.windowTarget.addEventListener('scroll', onScroll);

  return () => {
    targets.documentTarget.removeEventListener(
      'visibilitychange',
      onVisibilityChange,
    );
    targets.windowTarget.removeEventListener('pagehide', onPageHide);
    targets.windowTarget.removeEventListener('resize', onResize);
    targets.windowTarget.removeEventListener(
      'orientationchange',
      onOrientation,
    );
    targets.windowTarget.removeEventListener('scroll', onScroll);
  };
}

function browserViewport(): TransitionViewport {
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  return Object.freeze({
    width,
    height,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    orientation: width >= height ? 'landscape' : 'portrait',
  });
}

function createBrowserOutfitTransitionRuntime():
OutfitTransitionCoordinatorRuntime & Readonly<{
  syncReducedMotion: (reducedMotion: boolean) => void;
}> {
  let reducedMotion = false;
  const runtime = createOutfitTransitionCoordinatorRuntime({
    getViewport: browserViewport,
    getDocumentVisibility: () => (
      document.visibilityState === 'hidden' ? 'hidden' : 'visible'
    ),
    getReducedMotion: () => reducedMotion,
    scheduleTargetReadiness: (callback) => {
      const frame = window.requestAnimationFrame(callback);
      return () => window.cancelAnimationFrame(frame);
    },
  });
  return Object.freeze({
    ...runtime,
    syncReducedMotion: (nextReducedMotion) => {
      reducedMotion = nextReducedMotion;
    },
  });
}

export function useOutfitTransitionCoordinator() {
  const { reducedMotion } = useNativeSettings();
  const runtime = useMemo(
    () => createBrowserOutfitTransitionRuntime(),
    [],
  );
  useEffect(() => {
    runtime.syncReducedMotion(reducedMotion);
  }, [reducedMotion, runtime]);
  const state = useSyncExternalStore(
    runtime.subscribe,
    runtime.getState,
    runtime.getState,
  );

  useEffect(() => {
    const unbind = bindOutfitTransitionLifecycle(runtime, {
      documentTarget: document,
      windowTarget: window,
      getDocumentVisibility: () => (
        document.visibilityState === 'hidden' ? 'hidden' : 'visible'
      ),
    });
    return () => {
      unbind();
      runtime.dispose();
    };
  }, [runtime]);

  return useMemo(() => Object.freeze({ ...runtime, state }), [runtime, state]);
}
