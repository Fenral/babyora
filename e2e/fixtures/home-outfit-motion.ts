import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { LivingHomeAtmosphere } from '../../src/components/LivingHomeAtmosphere.js';
import { HomeGarmentPills } from '../../src/screens/HjemScreen.js';
import {
  isOutfitBundleProducerResult,
  produceOutfitBundle,
  type OutfitBundleProducerResult,
} from '../../src/lib/outfit/outfit-bundle-producer.js';
import { createCurrentOutfitContext } from '../../src/lib/planning/planned-outfit-context.js';
import { recommend } from '../../src/lib/wool-layers/recommend.js';
import type {
  RecommendInput,
  Recommendation,
} from '../../src/lib/wool-layers/types.js';
import {
  bindOutfitTransitionLifecycle,
  createOutfitTransitionCoordinatorRuntime,
} from '../../src/hooks/useOutfitTransitionCoordinator.js';

declare global {
  interface Window {
    __homeOutfitMotionFixture?: Readonly<{
      state: () => string;
      reason: () => string | null;
      itemIds: readonly string[];
      openCount: () => number;
      semanticT0: () => boolean;
      retention: () => Readonly<{
        homeElementCount: number;
        targetElementCount: number;
        hasActiveBundle: boolean;
        hasScheduledReadiness: boolean;
        disposed: boolean;
      }>;
      lifecycleBindings: () => number;
    }>;
  }
}

function recommendationInput(): RecommendInput {
  return {
    weather: {
      tempC: Number(document.body.dataset.tempC ?? 4),
      feelsLikeC: Number(document.body.dataset.feelsLikeC ?? 1),
      windMs: 2,
      precipMmH: 0,
      humidity: 55,
      symbolCode: document.body.dataset.symbolCode ?? 'partlycloudy_day',
      uvIndex: 1,
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

function createBundle(): Extract<
  OutfitBundleProducerResult,
  { kind: 'supported' }
> {
  const input = recommendationInput();
  const finalizedRecommendation = recommend(input);
  const { orderedGarments, equipment } = projection(finalizedRecommendation);
  const plannedForIso = '2026-07-25T10:00:00.000Z';
  const fingerprint = `current-finalized:${JSON.stringify([
    orderedGarments,
    equipment,
    input.weather.tempC,
    input.weather.feelsLikeC,
    input.weather.windMs,
    input.weather.precipMmH,
    input.weather.symbolCode ?? 'unknown',
  ])}`;
  const context = createCurrentOutfitContext({
    planningEventId: 'phase3-coordinator-browser-fixture',
    transitionContextId:
      `current-transition:${plannedForIso}:${fingerprint}`,
    child: { id: 'fixture-child', name: 'Ada', ageMonths: 0 },
    plannedForIso,
    timeZone: 'Europe/Oslo',
    place: {
      label: 'Hjemme',
      lat: 59.9139,
      lon: 10.7522,
      source: 'configured-place',
    },
    activity: input.activity,
    vognMode: input.vognMode ?? null,
    weather: {
      tempC: input.weather.tempC,
      feelsLikeC: input.weather.feelsLikeC,
      windMs: input.weather.windMs,
      precipMmH: input.weather.precipMmH,
      symbolCode: input.weather.symbolCode ?? 'unknown',
    },
    recommendInput: input,
    finalizedRecommendation,
    access: {
      capability: 'future_plan',
      allowed: true,
      reason: 'plus',
    },
  });
  if (context.sourceKind !== 'phase2-outfit-truth') {
    throw new Error('fixture requires Phase 2 truth');
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

document.documentElement.dataset.theme =
  document.body.dataset.theme ?? 'light';
document.body.innerHTML = `
  <main>
    <section id="atmosphere"></section>
    <section id="home-scene" aria-label="Dagens antrekk"></section>
    <button id="open-outfit" type="button" aria-haspopup="dialog">
      Se dagens antrekk
    </button>
    <dialog id="outfit-dialog" aria-labelledby="outfit-title">
      <h1 id="outfit-title">Dagens antrekk</h1>
      <div id="outfit-rows"></div>
      <p id="outfit-explanation">Kle barnet lag for lag.</p>
      <button id="close-outfit" type="button">Lukk</button>
    </dialog>
  </main>
`;

const bundle = createBundle();
document.body.dataset.bundleProvenance =
  String(isOutfitBundleProducerResult(bundle));
document.body.dataset.bundleVisibleCount =
  String(bundle.base.avatar.visibleGarmentIds.length);
const runtime = createOutfitTransitionCoordinatorRuntime({
  getViewport: () => Object.freeze({
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    orientation:
      window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait',
  }),
  getDocumentVisibility: () => (
    document.visibilityState === 'hidden' ? 'hidden' : 'visible'
  ),
  getReducedMotion: () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  scheduleTargetReadiness: (callback) => {
    const frame = window.requestAnimationFrame(callback);
    return () => window.cancelAnimationFrame(frame);
  },
});
let lifecycleBindings = 0;
bindOutfitTransitionLifecycle(runtime, {
  documentTarget: document,
  windowTarget: window,
  getDocumentVisibility: () => (
    document.visibilityState === 'hidden' ? 'hidden' : 'visible'
  ),
});
lifecycleBindings += 1;

createRoot(document.getElementById('atmosphere')!).render(
  createElement(LivingHomeAtmosphere, {
    tempC: bundle.weather.tempC,
    feelsLikeC: bundle.weather.feelsLikeC,
    symbolCode: recommendationInput().weather.symbolCode,
    reducedMotion:
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  }),
);

const homeSourceSelection = runtime.selectHomeSources(bundle);
const itemIds = homeSourceSelection.kind === 'ready'
  ? homeSourceSelection.sources.map(({ itemId }) => itemId)
  : [];
document.body.dataset.homeSourceSelection = homeSourceSelection.kind;
if (homeSourceSelection.kind === 'static-only') {
  document.body.dataset.homeSourceReason = homeSourceSelection.reason;
}
const homeScene = document.getElementById('home-scene')!;
const omitLast = document.body.dataset.omitSource === 'true';
flushSync(() => {
  createRoot(homeScene).render(createElement(HomeGarmentPills, {
    selection: homeSourceSelection,
    fallbackAnchors: [],
    registerHomeAnchor: runtime.registerHomeAnchor,
    styleForIndex: (index: number) => ({
      position: 'relative',
      display: 'inline-block',
      width: 96,
      height: 36,
      margin: 8 + index,
      padding: '6px 12px',
      background: 'white',
      color: 'black',
    }),
  }));
});
if (omitLast) {
  const itemId = itemIds.at(-1);
  const source = homeScene.querySelector(
    '[data-outfit-transition-source]:last-child',
  );
  document.body.dataset.omitApplied = String(
    itemId !== undefined && source !== null,
  );
  if (itemId !== undefined && source !== null) {
    runtime.registerHomeAnchor(itemId, null);
    source.remove();
  }
  document.body.dataset.omitHomeCount =
    String(runtime.inspectRetention().homeElementCount);
}

const dialog = document.getElementById('outfit-dialog') as HTMLDialogElement;
const rows = document.getElementById('outfit-rows')!;
const opener = document.getElementById('open-outfit') as HTMLButtonElement;
const closer = document.getElementById('close-outfit') as HTMLButtonElement;
let opens = 0;
let openedWithSemantics = false;

function close(): void {
  runtime.abort('closed');
  if (dialog.open) dialog.close();
  opener.focus();
}

opener.addEventListener('click', () => {
  runtime.captureBeforeNavigation(bundle);
  opens += 1;
  if (dialog.open) {
    openedWithSemantics = (
      document.activeElement === closer
      && dialog.querySelector('h1')?.textContent === 'Dagens antrekk'
    );
    return;
  }
  rows.replaceChildren();
  for (const [index, itemId] of itemIds.entries()) {
    const row = document.createElement('div');
    row.dataset.outfitTransitionTarget = itemId;
    row.style.cssText =
      `display:block;width:120px;height:44px;margin:${8 + index}px`;
    rows.append(row);
    runtime.registerOutfitRow(itemId, row);
  }
  dialog.showModal();
  closer.focus();
  openedWithSemantics = (
    dialog.open
    && document.activeElement === closer
    && dialog.querySelector('h1')?.textContent === 'Dagens antrekk'
  );
});
closer.addEventListener('click', close);
window.addEventListener('popstate', () => {
  if (dialog.open) close();
});

window.__homeOutfitMotionFixture = Object.freeze({
  state: () => runtime.getState().status,
  reason: () => {
    const state = runtime.getState();
    return state.status === 'settled' ? state.reason : null;
  },
  itemIds,
  openCount: () => opens,
  semanticT0: () => openedWithSemantics,
  retention: runtime.inspectRetention,
  lifecycleBindings: () => lifecycleBindings,
});
document.body.dataset.fixtureReady = 'true';
