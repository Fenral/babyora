import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  produceOutfitBundle,
  type OutfitBundleProducerResult,
} from '../../lib/outfit/outfit-bundle-producer.js';
import { createCurrentOutfitContext } from '../../lib/planning/planned-outfit-context.js';
import { recommend } from '../../lib/wool-layers/recommend.js';
import type {
  RecommendInput,
  Recommendation,
} from '../../lib/wool-layers/types.js';
import { createPhase2TransitionAdapter } from '../../lib/outfit-transition/phase2-adapter.js';
import {
  bindOutfitTransitionLifecycle,
  createOutfitTransitionCoordinatorRuntime,
} from '../useOutfitTransitionCoordinator.js';

const viewport = Object.freeze({
  width: 390,
  height: 844,
  scrollX: 0,
  scrollY: 0,
  orientation: 'portrait' as const,
});

class TestElement {
  #connected = true;
  readonly #x: number;

  constructor(x: number) {
    this.#x = x;
  }

  get isConnected(): boolean {
    return this.#connected;
  }

  disconnect(): void {
    this.#connected = false;
  }

  getBoundingClientRect(): DOMRect {
    return {
      x: this.#x,
      y: 120,
      width: 72,
      height: 48,
      top: 120,
      right: this.#x + 72,
      bottom: 168,
      left: this.#x,
      toJSON: () => ({}),
    } as DOMRect;
  }
}

const originalElement = globalThis.Element;

beforeAll(() => {
  Object.defineProperty(globalThis, 'Element', {
    configurable: true,
    value: TestElement,
  });
});

afterAll(() => {
  if (originalElement === undefined) {
    delete (globalThis as { Element?: typeof Element }).Element;
  } else {
    Object.defineProperty(globalThis, 'Element', {
      configurable: true,
      value: originalElement,
    });
  }
});

function input(): RecommendInput {
  return {
    weather: {
      tempC: 28,
      feelsLikeC: 28,
      windMs: 0,
      precipMmH: 0,
      humidity: 48,
      symbolCode: 'clearsky_day',
      uvIndex: 3,
    },
    child: { ageMonths: 0, canRoll: false },
    activity: 'vogn',
    exposureMin: 30,
    innerJakke: false,
    vognMode: 'awake',
    context: { bilstol: false },
    childCalibration: 0,
  };
}

function projection(recommendation: Recommendation) {
  return {
    orderedGarments: recommendation.layers
      .filter((layer) => layer.category !== 'utstyr')
      .flatMap((layer) => layer.items),
    equipment: recommendation.layers
      .filter((layer) => layer.category === 'utstyr')
      .flatMap((layer) => layer.items),
  };
}

function bundle(
  plannedForIso = '2026-07-25T10:00:00.000Z',
): Extract<
  OutfitBundleProducerResult,
  { kind: 'supported' }
> {
  const recommendInput = input();
  const finalizedRecommendation = recommend(recommendInput);
  const recommendation = projection(finalizedRecommendation);
  const transitionContextId =
    `current-transition:${plannedForIso}:current-finalized:${
      JSON.stringify([
        recommendation.orderedGarments,
        recommendation.equipment,
        recommendInput.weather.tempC,
        recommendInput.weather.feelsLikeC,
        recommendInput.weather.windMs,
        recommendInput.weather.precipMmH,
        recommendInput.weather.symbolCode ?? 'unknown',
      ])
    }`;
  const context = createCurrentOutfitContext({
    planningEventId: 'phase3-coordinator-fixture',
    transitionContextId,
    child: { id: 'barn-01', name: 'Ada', ageMonths: 0 },
    plannedForIso,
    timeZone: 'Europe/Oslo',
    place: {
      label: 'Hjemme',
      lat: 59.9139,
      lon: 10.7522,
      source: 'configured-place',
    },
    activity: recommendInput.activity,
    vognMode: recommendInput.vognMode ?? null,
    weather: {
      tempC: recommendInput.weather.tempC,
      feelsLikeC: recommendInput.weather.feelsLikeC,
      windMs: recommendInput.weather.windMs,
      precipMmH: recommendInput.weather.precipMmH,
      symbolCode: recommendInput.weather.symbolCode ?? 'unknown',
    },
    recommendInput,
    finalizedRecommendation,
    access: {
      capability: 'future_plan',
      allowed: true,
      reason: 'plus',
    },
  });
  if (context.sourceKind !== 'phase2-outfit-truth') {
    throw new Error('expected exact producer seed');
  }
  const result = produceOutfitBundle({
    seed: context.producerSeed,
    source: {
      kind: 'current',
      sourceContextId: context.producerSeed.sourceContextId,
    },
  });
  if (result.kind !== 'supported') throw new Error(result.kind);
  return result;
}

function element(x: number): HTMLElement {
  return new TestElement(x) as unknown as HTMLElement;
}

function sourceIds(
  exactBundle: Extract<
    OutfitBundleProducerResult,
    { kind: 'supported' }
  >,
) {
  const selection = createPhase2TransitionAdapter()
    .selectHomeSources(exactBundle);
  if (selection.kind !== 'ready') throw new Error(selection.reason);
  return selection.sources.map((source) => source.itemId);
}

function createRuntime(reducedMotion = false) {
  let scheduled: (() => void) | null = null;
  let scheduleCalls = 0;
  let cancelCalls = 0;
  const runtime = createOutfitTransitionCoordinatorRuntime({
    getViewport: () => viewport,
    getDocumentVisibility: () => 'visible',
    getReducedMotion: () => reducedMotion,
    scheduleTargetReadiness: (callback) => {
      scheduleCalls += 1;
      scheduled = callback;
      return () => {
        cancelCalls += 1;
        scheduled = null;
      };
    },
  });
  return {
    runtime,
    flushTarget: () => {
      const callback = scheduled;
      scheduled = null;
      callback?.();
    },
    scheduleCalls: () => scheduleCalls,
    cancelCalls: () => cancelCalls,
  };
}

describe('outfit transition coordinator runtime', () => {
  it('consumes replay, captures synchronously, and becomes ready only after exact targets', () => {
    const exactBundle = bundle();
    const { runtime, flushTarget } = createRuntime();
    const itemIds = sourceIds(exactBundle);
    itemIds.forEach((itemId, index) => {
      runtime.registerHomeAnchor(itemId, element(20 + index * 80));
    });

    expect(runtime.captureBeforeNavigation(exactBundle).status).toBe('captured');
    itemIds.forEach((itemId, index) => {
      runtime.registerOutfitRow(itemId, element(40 + index * 80));
    });
    flushTarget();
    expect(runtime.getState().status).toBe('ready');

    runtime.abort('closed');
    expect(runtime.captureBeforeNavigation(exactBundle)).toEqual({
      status: 'settled',
      reason: 'already-attempted',
    });
  });

  it('consumes reduced-motion attempts without capture or playback', () => {
    const exactBundle = bundle();
    const { runtime } = createRuntime(true);
    sourceIds(exactBundle).forEach((itemId, index) => {
      runtime.registerHomeAnchor(itemId, element(20 + index * 80));
    });

    expect(runtime.captureBeforeNavigation(exactBundle)).toEqual({
      status: 'settled',
      reason: 'motion-ineligible',
    });
    expect(runtime.captureBeforeNavigation(exactBundle)).toEqual({
      status: 'settled',
      reason: 'already-attempted',
    });
  });

  it('retains the next identity Home anchors registered before identity abort', () => {
    const firstBundle = bundle();
    const nextBundle = bundle('2026-07-25T11:00:00.000Z');
    const { runtime } = createRuntime();
    const firstItemIds = sourceIds(firstBundle);
    const nextItemIds = sourceIds(nextBundle);
    firstItemIds.forEach((itemId, index) => {
      runtime.registerHomeAnchor(itemId, element(20 + index * 80));
    });

    expect(runtime.captureBeforeNavigation(firstBundle).status).toBe('captured');
    firstItemIds.forEach((itemId) => {
      runtime.registerHomeAnchor(itemId, null);
    });
    nextItemIds.forEach((itemId, index) => {
      runtime.registerHomeAnchor(itemId, element(20 + index * 80));
    });
    runtime.abort('identity-changed');
    expect(runtime.captureBeforeNavigation(nextBundle)).toEqual(
      expect.objectContaining({ status: 'captured' }),
    );
  });

  it('settles rapid pre-readiness activation once and clears the pending attempt', () => {
    const exactBundle = bundle();
    const {
      runtime,
      flushTarget,
      scheduleCalls,
      cancelCalls,
    } = createRuntime();
    const itemIds = sourceIds(exactBundle);
    itemIds.forEach((itemId, index) => {
      runtime.registerHomeAnchor(itemId, element(20 + index * 80));
    });

    expect(runtime.captureBeforeNavigation(exactBundle).status).toBe('captured');
    itemIds.forEach((itemId, index) => {
      runtime.registerOutfitRow(itemId, element(40 + index * 80));
    });
    expect(scheduleCalls()).toBe(itemIds.length);
    expect(runtime.captureBeforeNavigation(exactBundle)).toEqual({
      status: 'settled',
      reason: 'already-attempted',
    });
    expect(cancelCalls()).toBe(itemIds.length);
    itemIds.forEach((itemId, index) => {
      runtime.registerOutfitRow(itemId, element(60 + index * 80));
    });
    expect(runtime.inspectRetention()).toEqual({
      homeElementCount: itemIds.length,
      targetElementCount: 0,
      hasActiveBundle: false,
      hasScheduledReadiness: false,
      disposed: false,
    });

    flushTarget();
    expect(runtime.getState()).toEqual({
      status: 'settled',
      reason: 'already-attempted',
    });
  });

  it('releases replaced, disconnected, terminal, and disposed DOM references', () => {
    const exactBundle = bundle();
    const { runtime } = createRuntime();
    const itemIds = sourceIds(exactBundle);
    const first = element(20);
    const replacement = element(28);
    runtime.registerHomeAnchor(itemIds[0]!, first);
    runtime.registerHomeAnchor(itemIds[0]!, replacement);
    expect(runtime.referencesElement(first)).toBe(false);
    expect(runtime.referencesElement(replacement)).toBe(true);

    const disconnected = element(100);
    runtime.registerHomeAnchor(itemIds[1]!, disconnected);
    expect(runtime.captureBeforeNavigation(exactBundle).status).toBe(
      'captured',
    );
    const firstTarget = element(140);
    const replacementTarget = element(148);
    runtime.registerOutfitRow(itemIds[0]!, firstTarget);
    runtime.registerOutfitRow(itemIds[0]!, replacementTarget);
    expect(runtime.referencesElement(firstTarget)).toBe(false);
    expect(runtime.referencesElement(replacementTarget)).toBe(true);
    (disconnected as unknown as TestElement).disconnect();
    runtime.settle('closed');
    expect(runtime.referencesElement(disconnected)).toBe(false);
    expect(runtime.referencesElement(replacementTarget)).toBe(false);
    expect(runtime.inspectRetention()).toMatchObject({
      targetElementCount: 0,
      hasActiveBundle: false,
      hasScheduledReadiness: false,
    });

    runtime.dispose();
    expect(runtime.referencesElement(replacement)).toBe(false);
    expect(runtime.inspectRetention()).toEqual({
      homeElementCount: 0,
      targetElementCount: 0,
      hasActiveBundle: false,
      hasScheduledReadiness: false,
      disposed: true,
    });
  });

  it('settles and clears transient registrations for every lifecycle invalidator', () => {
    for (const eventName of [
      'visibilitychange',
      'pagehide',
      'resize',
      'orientationchange',
      'scroll',
    ] as const) {
      const exactBundle = bundle();
      const { runtime } = createRuntime();
      const documentTarget = new EventTarget();
      const windowTarget = new EventTarget();
      const unbind = bindOutfitTransitionLifecycle(runtime, {
        documentTarget,
        windowTarget,
        getDocumentVisibility: () => 'hidden',
      });
      sourceIds(exactBundle).forEach((itemId, index) => {
        runtime.registerHomeAnchor(itemId, element(20 + index * 80));
      });
      runtime.captureBeforeNavigation(exactBundle);

      const target =
        eventName === 'visibilitychange' ? documentTarget : windowTarget;
      target.dispatchEvent(new Event(eventName));
      expect(runtime.getState().status).toBe('settled');
      expect(runtime.inspectRetention()).toMatchObject({
        targetElementCount: 0,
        hasActiveBundle: false,
        hasScheduledReadiness: false,
      });
      unbind();
    }
  });

  it('removes lifecycle listeners so later events cannot mutate state', () => {
    const exactBundle = bundle();
    const { runtime } = createRuntime();
    const documentTarget = new EventTarget();
    const windowTarget = new EventTarget();
    sourceIds(exactBundle).forEach((itemId, index) => {
      runtime.registerHomeAnchor(itemId, element(20 + index * 80));
    });
    runtime.captureBeforeNavigation(exactBundle);
    const unbind = bindOutfitTransitionLifecycle(runtime, {
      documentTarget,
      windowTarget,
      getDocumentVisibility: () => 'hidden',
    });
    unbind();

    documentTarget.dispatchEvent(new Event('visibilitychange'));
    windowTarget.dispatchEvent(new Event('resize'));
    expect(runtime.getState().status).toBe('captured');
  });
});
