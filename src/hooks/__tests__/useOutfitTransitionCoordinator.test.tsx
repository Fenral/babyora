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
  readonly isConnected = true;
  readonly #x: number;

  constructor(x: number) {
    this.#x = x;
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

function bundle(): Extract<
  OutfitBundleProducerResult,
  { kind: 'supported' }
> {
  const recommendInput = input();
  const finalizedRecommendation = recommend(recommendInput);
  const recommendation = projection(finalizedRecommendation);
  const plannedForIso = '2026-07-25T10:00:00.000Z';
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

function createRuntime(reducedMotion = false) {
  let scheduled: (() => void) | null = null;
  const runtime = createOutfitTransitionCoordinatorRuntime({
    getViewport: () => viewport,
    getDocumentVisibility: () => 'visible',
    getReducedMotion: () => reducedMotion,
    scheduleTargetReadiness: (callback) => {
      scheduled = callback;
      return () => {
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
  };
}

describe('outfit transition coordinator runtime', () => {
  it('consumes replay, captures synchronously, and becomes ready only after exact targets', () => {
    const exactBundle = bundle();
    const { runtime, flushTarget } = createRuntime();
    const itemIds = runtime.getHomeItemIds(exactBundle);
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
    runtime.getHomeItemIds(exactBundle).forEach((itemId, index) => {
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
      runtime.getHomeItemIds(exactBundle).forEach((itemId, index) => {
        runtime.registerHomeAnchor(itemId, element(20 + index * 80));
      });
      runtime.captureBeforeNavigation(exactBundle);

      const target =
        eventName === 'visibilitychange' ? documentTarget : windowTarget;
      target.dispatchEvent(new Event(eventName));
      expect(runtime.getState().status).toBe('settled');
      unbind();
    }
  });
});
