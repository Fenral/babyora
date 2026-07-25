import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { LivingHomeAtmosphere } from '../../src/components/LivingHomeAtmosphere.js';
import { OutfitTransitionOverlay } from '../../src/components/outfit-transition/OutfitTransitionOverlay.js';
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
import { decideTransitionEligibility } from '../../src/lib/outfit-transition/eligibility.js';
import { createPhase2TransitionAdapter } from '../../src/lib/outfit-transition/phase2-adapter.js';
import { createTransitionSnapshot } from '../../src/lib/outfit-transition/transition-snapshot.js';
import { createOutfitTransitionTimeline } from '../../src/lib/outfit-transition/timeline.js';
import { MOTION } from '../../src/styles/motion-grammar.js';

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
      equipmentIds: readonly string[];
      events: () => readonly Readonly<{ name: string; atMs: number }>[];
      identityMatrix: () => Readonly<Record<string, string>>;
      anchorMatrix: () => Readonly<Record<string, string>>;
      runCardinality: (count: number) => Readonly<{
        kind: string;
        itemIds: readonly string[];
        normalUiDurationMs: number;
        explanatoryDurationMs: number;
      }>;
      setAtmosphere: (
        tempC: number | null,
        feelsLikeC: number | null,
        symbolCode: string | null,
      ) => void;
      installNewTriple: () => Readonly<{
        previousSnapshotId: string;
        nextSnapshotId: string;
      }>;
      dispose: () => void;
    }>;
  }
}

function recommendationInput(): RecommendInput {
  const activity = (
    document.body.dataset.activity ?? 'vogn'
  ) as RecommendInput['activity'];
  const calibration = Number(
    document.body.dataset.childCalibration ?? 0,
  ) as -1 | 0 | 1;
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
    child: {
      ageMonths: Number(document.body.dataset.ageMonths ?? 6),
      canRoll: true,
    },
    activity,
    exposureMin: 30,
    innerJakke: document.body.dataset.innerJakke === 'true',
    vognMode: (
      document.body.dataset.vognMode ?? 'awake'
    ) as 'awake' | 'sleeping',
    context: { bilstol: false },
    childCalibration: calibration,
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

function createBundle(identity = 'initial'): Extract<
  OutfitBundleProducerResult,
  { kind: 'supported' }
> {
  const input = recommendationInput();
  const finalizedRecommendation = recommend(input);
  const { orderedGarments, equipment } = projection(finalizedRecommendation);
  const plannedForIso = identity === 'initial'
    ? '2026-07-25T10:00:00.000Z'
    : '2026-07-25T11:00:00.000Z';
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
    planningEventId: `phase3-coordinator-browser-fixture-${identity}`,
    transitionContextId:
      `current-transition:${plannedForIso}:${fingerprint}`,
    child: {
      id: 'fixture-child',
      name: 'Ada',
      ageMonths: input.child.ageMonths,
    },
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
    <section id="transition-overlay"></section>
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

let bundle = createBundle();
document.body.dataset.bundleProvenance =
  String(isOutfitBundleProducerResult(bundle));
document.body.dataset.bundleVisibleCount =
  String(bundle.base.avatar.visibleGarmentIds.length);
let equipmentIds = bundle.base.equipment.map(({ itemId }) => itemId);
const eventLog: Array<Readonly<{ name: string; atMs: number }>> = [];
const logEvent = (name: string): void => {
  eventLog.push(Object.freeze({ name, atMs: performance.now() }));
};
const appReduce = document.body.dataset.appMotion === 'reduce';
const operatingSystemReduce = (): boolean => (
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
);
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
  getReducedMotion: () => appReduce || operatingSystemReduce(),
  scheduleTargetReadiness: (callback) => {
    const frame = window.requestAnimationFrame(callback);
    return () => window.cancelAnimationFrame(frame);
  },
});
let lifecycleBindings = 0;
const unbindLifecycle = bindOutfitTransitionLifecycle(runtime, {
  documentTarget: document,
  windowTarget: window,
  getDocumentVisibility: () => (
    document.visibilityState === 'hidden' ? 'hidden' : 'visible'
  ),
});
lifecycleBindings += 1;

const atmosphereRoot = createRoot(document.getElementById('atmosphere')!);
function renderAtmosphere(
  tempC: number | null = bundle.weather.tempC,
  feelsLikeC: number | null = bundle.weather.feelsLikeC,
  symbolCode: string | null =
    recommendationInput().weather.symbolCode ?? null,
): void {
  flushSync(() => {
    atmosphereRoot.render(createElement(LivingHomeAtmosphere, {
      tempC,
      feelsLikeC,
      symbolCode,
      reducedMotion: appReduce || operatingSystemReduce(),
    }));
  });
}
renderAtmosphere();

let homeSourceSelection = runtime.selectHomeSources(bundle);
let itemIds = homeSourceSelection.kind === 'ready'
  ? [...homeSourceSelection.sources.map(({ itemId }) => itemId)]
  : [];
document.body.dataset.homeSourceSelection = homeSourceSelection.kind;
if (homeSourceSelection.kind === 'static-only') {
  document.body.dataset.homeSourceReason = homeSourceSelection.reason;
}
const homeScene = document.getElementById('home-scene')!;
const homeRoot = createRoot(homeScene);
const omitLast = document.body.dataset.omitSource === 'true';
function renderHome(): void {
  flushSync(() => {
    homeRoot.render(createElement(HomeGarmentPills, {
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
  if (document.body.dataset.duplicateLabels === 'true') {
    for (const source of homeScene.querySelectorAll(
      '[data-outfit-transition-source]',
    )) {
      source.textContent = 'Samme etikett';
    }
  }
}
renderHome();
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
const overlayRoot = createRoot(
  document.getElementById('transition-overlay')!,
);
let opens = 0;
let openedWithSemantics = false;
let overlayActive = false;

const unsubscribe = runtime.subscribe(() => {
  const current = runtime.getState();
  if (current.status === 'ready' && !overlayActive) {
    overlayActive = true;
    logEvent('explanation-start');
    for (const item of current.snapshot.items) {
      logEvent(`landing:${item.itemId}`);
    }
    flushSync(() => {
      overlayRoot.render(createElement(OutfitTransitionOverlay, {
        snapshot: current.snapshot,
        presentations: homeSourceSelection.kind === 'ready'
          ? homeSourceSelection.sources
          : [],
        reducedMotion: appReduce || operatingSystemReduce(),
        onFinish: () => {
          logEvent('completed');
          runtime.settle('completed');
        },
        onAbort: () => {
          logEvent('overlay-abort');
          runtime.abort('motion-ineligible');
        },
      }));
    });
    runtime.beginPlayback();
    return;
  }
  if (current.status === 'settled' && overlayActive) {
    overlayActive = false;
    overlayRoot.render(null);
    logEvent('cleanup');
  }
});

function close(): void {
  logEvent('abort:closed');
  runtime.abort('closed');
  if (dialog.open) dialog.close();
  opener.focus();
  logEvent('cleanup');
}

opener.addEventListener('click', () => {
  logEvent('activation');
  const captured = runtime.captureBeforeNavigation(bundle);
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
  logEvent('semantic-t0');
  logEvent('landing-state');
  if (captured.status === 'settled') {
    logEvent('static-landing');
    logEvent('cleanup');
  }
});
closer.addEventListener('click', close);
window.addEventListener('popstate', () => {
  if (dialog.open) close();
});

function identityMatrix(): Readonly<Record<string, string>> {
  const identity = {
    snapshotId: 'browser-snapshot',
    recommendationFingerprint: 'browser-recommendation',
    transitionContextId: 'browser-context',
  };
  const viewport = {
    width: 390,
    height: 844,
    scrollX: 0,
    scrollY: 0,
    orientation: 'portrait' as const,
  };
  const ids = ['browser-item-a', 'browser-item-b'];
  const capture = (
    candidateIdentity: typeof identity,
    y: number,
  ) => createTransitionSnapshot({
    identity: candidateIdentity,
    viewport,
    orderedItemIds: ids,
    rectanglesByItemId: new Map(ids.map((itemId, index) => [
      itemId,
      { x: 12 + index * 72, y, width: 60, height: 36 },
    ])),
  });
  const source = capture(identity, 20);
  if (source.kind !== 'captured') throw new Error(source.reason);

  const result: Record<string, string> = {};
  for (const field of [
    'exact',
    'snapshotId',
    'recommendationFingerprint',
    'transitionContextId',
  ] as const) {
    const targetIdentity = field === 'exact'
      ? identity
      : { ...identity, [field]: `changed-${field}` };
    const target = capture(targetIdentity, 260);
    if (target.kind !== 'captured') throw new Error(target.reason);
    const decision = decideTransitionEligibility({
      expectedIdentity: identity,
      expectedItemIds: ids,
      sourceSnapshot: source.snapshot,
      targetSnapshot: target.snapshot,
      currentViewport: viewport,
      motion: 'allowed',
      documentVisibility: 'visible',
      lifecycle: 'active',
    });
    result[field] = decision.kind === 'animate'
      ? 'animate'
      : decision.reason;
  }
  return Object.freeze(result);
}

function anchorMatrix(): Readonly<Record<string, string>> {
  const ids = [...itemIds];
  const run = (
    side: 'home' | 'outfit',
    fault: 'missing' | 'zero' | 'duplicate' | 'mismatch',
  ): string => {
    const adapter = createPhase2TransitionAdapter();
    const elements: HTMLElement[] = [];
    const element = (valid = true): HTMLElement => {
      const node = document.createElement('div');
      node.style.cssText = valid
        ? 'position:absolute;left:1px;top:1px;width:20px;height:20px'
        : 'position:absolute;left:1px;top:1px;width:0;height:0';
      document.body.append(node);
      elements.push(node);
      return node;
    };
    for (const [index, itemId] of ids.entries()) {
      if (!(side === 'home' && fault === 'missing' && index === 0)) {
        adapter.registerHomeAnchor(
          itemId,
          element(!(side === 'home' && fault === 'zero' && index === 0)),
        );
      }
      if (!(side === 'outfit' && fault === 'missing' && index === 0)) {
        adapter.registerOutfitRow(
          itemId,
          element(!(side === 'outfit' && fault === 'zero' && index === 0)),
        );
      }
    }
    if (fault === 'duplicate') {
      const first = ids[0];
      if (first !== undefined) {
        if (side === 'home') adapter.registerHomeAnchor(first, element());
        else adapter.registerOutfitRow(first, element());
      }
    }
    if (fault === 'mismatch') {
      const unexpected = 'unexpected-browser-item' as typeof ids[number];
      if (side === 'home') adapter.registerHomeAnchor(unexpected, element());
      else adapter.registerOutfitRow(unexpected, element());
    }
    const evaluated = adapter.evaluate({
      outfitBundle: bundle,
      transitionVisualState: 'settled',
    });
    for (const node of elements) node.remove();
    return evaluated.kind === 'ready' ? 'ready' : evaluated.reason;
  };
  return Object.freeze(Object.fromEntries(
    (['home', 'outfit'] as const).flatMap((side) => (
      (['missing', 'zero', 'duplicate', 'mismatch'] as const).map(
        (fault) => [`${side}-${fault}`, run(side, fault)],
      )
    )),
  ));
}

function runCardinality(count: number): Readonly<{
  kind: string;
  itemIds: readonly string[];
  normalUiDurationMs: number;
  explanatoryDurationMs: number;
}> {
  const previous = document.getElementById('cardinality-lab');
  previous?.remove();
  const lab = document.createElement('section');
  lab.id = 'cardinality-lab';
  lab.setAttribute('role', 'dialog');
  lab.setAttribute('aria-labelledby', 'cardinality-heading');
  lab.innerHTML = `
    <h2 id="cardinality-heading">Dagens antrekk</h2>
    <div id="cardinality-sources"></div>
    <div id="cardinality-targets"></div>
    <button type="button">Lukk</button>
  `;
  document.body.append(lab);
  const ids = Array.from(
    { length: count },
    (_, index) => `browser-cardinality-${count}-${index + 1}`,
  );
  const sources = lab.querySelector('#cardinality-sources')!;
  const targets = lab.querySelector('#cardinality-targets')!;
  for (const [index, itemId] of ids.entries()) {
    const source = document.createElement('span');
    source.dataset.outfitTransitionSource = itemId;
    source.textContent = index < 2 ? 'Samme etikett' : `Plagg ${index + 1}`;
    source.style.cssText =
      'display:inline-block;width:52px;height:28px;margin:2px';
    sources.append(source);
    const target = document.createElement('div');
    target.dataset.outfitTransitionTarget = itemId;
    target.dataset.outfitRow = itemId;
    target.textContent = source.textContent;
    target.style.cssText =
      'display:block;width:120px;height:32px;margin:2px';
    targets.append(target);
  }
  const identity = {
    snapshotId: `cardinality-snapshot-${count}`,
    recommendationFingerprint: `cardinality-recommendation-${count}`,
    transitionContextId: `cardinality-context-${count}`,
  };
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    orientation: (
      window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait'
    ) as 'landscape' | 'portrait',
  };
  const rectangles = (selector: string): Map<string, {
    x: number;
    y: number;
    width: number;
    height: number;
  }> => new Map(
    [...lab.querySelectorAll<HTMLElement>(selector)].map((node) => {
      const rectangle = node.getBoundingClientRect();
      const itemId = node.dataset.outfitTransitionSource
        ?? node.dataset.outfitTransitionTarget
        ?? '';
      return [itemId, {
        x: rectangle.x,
        y: rectangle.y,
        width: rectangle.width,
        height: rectangle.height,
      }];
    }),
  );
  const source = createTransitionSnapshot({
    identity,
    viewport,
    orderedItemIds: ids,
    rectanglesByItemId: rectangles('[data-outfit-transition-source]'),
  });
  const target = createTransitionSnapshot({
    identity,
    viewport,
    orderedItemIds: ids,
    rectanglesByItemId: rectangles('[data-outfit-transition-target]'),
  });
  if (source.kind !== 'captured' || target.kind !== 'captured') {
    throw new Error('cardinality snapshot rejected');
  }
  const decision = decideTransitionEligibility({
    expectedIdentity: identity,
    expectedItemIds: ids,
    sourceSnapshot: source.snapshot,
    targetSnapshot: target.snapshot,
    currentViewport: viewport,
    motion: 'allowed',
    documentVisibility: 'visible',
    lifecycle: 'active',
  });
  if (decision.kind === 'animate') {
    flushSync(() => {
      overlayRoot.render(createElement(OutfitTransitionOverlay, {
        snapshot: decision.snapshot,
        presentations: ids.map((itemId, index) => ({
          itemId,
          label: index < 2 ? 'Samme etikett' : `Plagg ${index + 1}`,
        })),
        onFinish: () => {
          logEvent(`cardinality-${count}-completed`);
          queueMicrotask(() => overlayRoot.render(null));
        },
        onAbort: () => {
          logEvent(`cardinality-${count}-aborted`);
          queueMicrotask(() => overlayRoot.render(null));
        },
      }));
    });
  }
  const timeline = createOutfitTransitionTimeline({
    normalUiDurationMs: MOTION.outfitTransitionNormal,
    explanatoryDurationMs: MOTION.outfitTransitionExplanation,
  }, count);
  return Object.freeze({
    kind: decision.kind,
    itemIds: Object.freeze(ids),
    normalUiDurationMs: timeline.normalUiDurationMs,
    explanatoryDurationMs: timeline.totalDurationMs,
  });
}

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
  equipmentIds,
  events: () => Object.freeze([...eventLog]),
  identityMatrix,
  anchorMatrix,
  runCardinality,
  setAtmosphere: renderAtmosphere,
  installNewTriple: () => {
    const previousSnapshotId = bundle.base.snapshotId;
    if (dialog.open) close();
    bundle = createBundle('next');
    homeSourceSelection = runtime.selectHomeSources(bundle);
    itemIds = homeSourceSelection.kind === 'ready'
      ? [...homeSourceSelection.sources.map(({ itemId }) => itemId)]
      : [];
    equipmentIds = bundle.base.equipment.map(({ itemId }) => itemId);
    renderHome();
    return Object.freeze({
      previousSnapshotId,
      nextSnapshotId: bundle.base.snapshotId,
    });
  },
  dispose: () => {
    logEvent('abort:unmounted');
    unsubscribe();
    unbindLifecycle();
    runtime.dispose();
    overlayRoot.unmount();
    homeRoot.unmount();
    atmosphereRoot.unmount();
    logEvent('cleanup');
  },
});
document.body.dataset.fixtureReady = 'true';
