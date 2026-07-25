import { createRoot, type Root } from 'react-dom/client';
import { OutfitTruthPanel } from '../../src/components/outfit/OutfitTruthPanel.js';
import {
  produceOutfitBundle,
  type OutfitBundleProducerResult,
} from '../../src/lib/outfit/outfit-bundle-producer.js';
import {
  createCurrentOutfitContext,
  createPlannedOutfitContext,
} from '../../src/lib/planning/planned-outfit-context.js';
import { useOutfitSelectionStore } from '../../src/state/outfit-selection-store.js';
import { recommend } from '../../src/lib/wool-layers/recommend.js';
import type { RecommendInput, Recommendation } from '../../src/lib/wool-layers/types.js';
import '../../src/styles/design-tokens.css';

type FixtureCase = 'one' | 'four' | 'five' | 'ten' | 'eleven' | 'unavailable';
type FixtureAxis = 'kald' | 'mild' | 'varm';
type Registration = Readonly<{ itemId: string; connected: boolean }>;

type OutfitTruthFixtureApi = Readonly<{
  mount: (
    fixtureCase: FixtureCase,
    axis?: FixtureAxis,
    inventoryGarments?: readonly string[],
  ) => Promise<Readonly<{
    kind: OutfitBundleProducerResult['kind'];
    garmentCount: number;
    equipmentCount: number;
  }>>;
  reset: () => void;
  registrations: () => readonly Registration[];
}>;

declare global {
  interface Window {
    __OUTFIT_TRUTH_FIXTURE__?: OutfitTruthFixtureApi;
  }
}

const rootElement = document.querySelector<HTMLElement>('#outfit-truth-root');
if (rootElement === null) throw new Error('Outfit fixture root is missing');

document.documentElement.dataset.theme = 'light';
document.body.style.margin = '0';
document.body.style.background = 'var(--bg-canvas)';
document.body.style.color = 'var(--ink-900)';
rootElement.style.boxSizing = 'border-box';
rootElement.style.marginInline = 'auto';
rootElement.style.maxInlineSize = '42rem';
rootElement.style.minInlineSize = '0';
rootElement.style.padding = '1rem';

let root: Root | null = null;
let registrations: Registration[] = [];

const ORDERED_GARMENTS = Object.freeze([
  'langermet ullbody',
  'bleie',
  'ull-jakke',
  'tynn bukse',
  'isolert vinterdress',
  'balaklava',
  'halsedisse',
  'votter dun',
  'vintersko isolerte',
  'ullsokker',
] as const);

function inputFor(axis: FixtureAxis): RecommendInput {
  const feelsLikeC = axis === 'kald' ? -8 : axis === 'varm' ? 22 : 6;
  return {
    weather: { tempC: feelsLikeC + 1, feelsLikeC, windMs: 1, precipMmH: 0 },
    child: { ageMonths: 10, canRoll: true },
    activity: 'utelek',
    exposureMin: 45,
    childCalibration: 0,
  };
}

function canonicalTransition(
  route: 'current' | 'planned',
  plannedForIso: string,
  input: RecommendInput,
  recommendation: Recommendation,
): string {
  const garments = recommendation.layers
    .filter((layer) => layer.category !== 'utstyr')
    .flatMap((layer) => layer.items);
  const equipment = recommendation.layers
    .filter((layer) => layer.category === 'utstyr')
    .flatMap((layer) => layer.items);
  const fingerprint = route === 'current'
    ? `current-finalized:${JSON.stringify([garments, equipment, input.weather.tempC, input.weather.feelsLikeC, input.weather.windMs, input.weather.precipMmH, input.weather.symbolCode ?? 'unknown'])}`
    : `planned-finalized:${JSON.stringify([garments, equipment])}`;
  return `${route === 'current' ? 'current' : 'planning'}-transition:${plannedForIso}:${fingerprint}`;
}

function bundleFrom(
  route: 'current' | 'planned',
  input: RecommendInput,
  finalizedRecommendation: Recommendation,
  identity: string,
): OutfitBundleProducerResult {
  const plannedForIso = '2026-02-12T11:00:00.000Z';
  const createContext = route === 'current'
    ? createCurrentOutfitContext
    : createPlannedOutfitContext;
  const context = createContext({
    planningEventId: `outfit-fixture-${identity}`,
    transitionContextId: canonicalTransition(route, plannedForIso, input, finalizedRecommendation),
    child: { id: 'fixture-child', name: 'Ada', ageMonths: input.child.ageMonths },
    plannedForIso,
    timeZone: 'Europe/Oslo',
    place: { label: 'Hjemme', lat: 59.9139, lon: 10.7522, source: 'configured-place' },
    activity: input.activity,
    vognMode: null,
    weather: {
      tempC: input.weather.tempC,
      feelsLikeC: input.weather.feelsLikeC,
      windMs: input.weather.windMs,
      precipMmH: input.weather.precipMmH,
      symbolCode: input.weather.symbolCode ?? 'unknown',
    },
    recommendInput: input,
    finalizedRecommendation,
    access: { capability: 'future_plan', allowed: true, reason: 'plus' },
  });
  if (context.sourceKind !== 'phase2-outfit-truth') {
    throw new Error('Fixture context did not create a producer seed');
  }
  return produceOutfitBundle({
    seed: context.producerSeed,
    source: route === 'current'
      ? { kind: 'current', sourceContextId: context.producerSeed.sourceContextId }
      : {
          kind: 'planned',
          sourceContextId: context.producerSeed.sourceContextId,
          planningEventId: context.planningEventId,
          plannedForIso: context.plannedForIso,
        },
  });
}

function supportedBundle(count: 1 | 4 | 5 | 10, axis: FixtureAxis) {
  const input = inputFor(axis);
  const finalizedRecommendation: Recommendation = {
    ...recommend(input),
    layers: [{ category: 'innerst', items: [...ORDERED_GARMENTS.slice(0, count)] }],
  };
  const result = bundleFrom('current', input, finalizedRecommendation, `supported-${count}-${axis}`);
  if (result.kind !== 'supported' || result.base.garments.length !== count) {
    throw new Error(`Fixture did not produce ${count} supported garments`);
  }
  return result;
}

function elevenBundle(axis: FixtureAxis, inventoryGarments: readonly string[] | undefined) {
  // The Node harness extracts this exact list from the tracked candidate-local
  // inventory artifact. The browser fixture deliberately owns no parallel copy.
  if (
    inventoryGarments === undefined
    || inventoryGarments.length !== 11
    || inventoryGarments.some((item) => typeof item !== 'string' || item.length === 0)
  ) {
    throw new Error('Exact eleven-item candidate inventory input is required');
  }
  const input = inputFor(axis);
  const finalizedRecommendation: Recommendation = {
    ...recommend(input),
    layers: [{ category: 'innerst', items: [...inventoryGarments] }],
  };
  const result = bundleFrom('planned', input, finalizedRecommendation, `eleven-${axis}`);
  if (result.kind !== 'unsupported-cardinality' || result.truth.orderedGarments.length !== 11) {
    throw new Error('Candidate inventory did not produce exact eleven-item list-only truth');
  }
  return result;
}

function makeBundle(
  fixtureCase: FixtureCase,
  axis: FixtureAxis,
  inventoryGarments: readonly string[] | undefined,
): OutfitBundleProducerResult {
  if (fixtureCase === 'eleven') return elevenBundle(axis, inventoryGarments);
  if (fixtureCase === 'unavailable') return produceOutfitBundle({} as never);
  return supportedBundle(
    fixtureCase === 'one' ? 1 : fixtureCase === 'four' ? 4 : fixtureCase === 'five' ? 5 : 10,
    axis,
  );
}

function reset() {
  root?.unmount();
  root = null;
  registrations = [];
  useOutfitSelectionStore.getState().close();
  rootElement.replaceChildren();
}

async function mount(
  fixtureCase: FixtureCase,
  axis: FixtureAxis = 'mild',
  inventoryGarments?: readonly string[],
) {
  reset();
  const outfitBundle = makeBundle(fixtureCase, axis, inventoryGarments);
  root = createRoot(rootElement);
  root.render(
    <OutfitTruthPanel
      outfitBundle={outfitBundle}
      registerOutfitRow={(itemId, element) => {
        registrations = [...registrations, { itemId, connected: element !== null }];
      }}
      transitionVisualState="settled"
      onOpenWarmColdGuide={() => undefined}
    />,
  );
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  return Object.freeze({
    kind: outfitBundle.kind,
    garmentCount: outfitBundle.kind === 'supported'
      ? outfitBundle.base.garments.length
      : outfitBundle.kind === 'unsupported-cardinality'
        ? outfitBundle.truth.orderedGarments.length
        : 0,
    equipmentCount: outfitBundle.kind === 'supported'
      ? outfitBundle.base.equipment.length
      : outfitBundle.kind === 'unsupported-cardinality'
        ? outfitBundle.truth.equipment.length
        : 0,
  });
}

window.__OUTFIT_TRUTH_FIXTURE__ = Object.freeze({
  mount,
  reset,
  registrations: () => Object.freeze([...registrations]),
});
