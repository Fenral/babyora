import { finalizeSafety } from '../wool-layers/finalize-safety.js';
import type { SafetyFlag, Severity } from '../wool-layers/safety.js';
import type {
  Layer,
  RecommendInput,
  Recommendation,
} from '../wool-layers/types.js';
import { classifyOutfitItem } from './body-anchor-catalog.js';
import {
  createOutfitTruthSnapshot,
  isOutfitTruthSnapshot,
  type OutfitGarmentTruth,
  type OutfitItemId,
  type OutfitTruthSnapshotV1,
} from './outfit-truth.js';

export type OutfitSwapSourceOccurrenceV1 = Readonly<{
  itemId: OutfitItemId;
  order: number;
  category: OutfitGarmentTruth['category'];
  sourceLabel: string;
}>;

export type FinalizedOutfitSwapRejectionCode =
  | 'invalid-request'
  | 'invalid-base-input'
  | 'invalid-base-snapshot'
  | 'base-unsupported-cardinality'
  | 'base-identity-mismatch'
  | 'base-not-finalized'
  | 'source-not-found'
  | 'source-identity-mismatch'
  | 'source-occurrence-ambiguous'
  | 'no-op-target'
  | 'unknown-target'
  | 'target-semantic-equipment'
  | 'target-removed'
  | 'target-survival-ambiguous'
  | 'finalization-failed';

export type FinalizedOutfitSwapResult =
  | Readonly<{
      kind: 'finalized';
      recommendation: Recommendation;
      targetCatalogGarmentId: string;
    }>
  | Readonly<{
      kind: 'rejected';
      code: FinalizedOutfitSwapRejectionCode;
    }>;

export type FinalizeOutfitOccurrenceSwapArgs = Readonly<{
  input: RecommendInput;
  finalizedRecommendation: Recommendation;
  baseSnapshot: OutfitTruthSnapshotV1;
  source: OutfitSwapSourceOccurrenceV1;
  targetLabel: string;
}>;

const SEVERITY_RANK: Readonly<Record<Severity, number>> = Object.freeze({
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
});

const SOURCE_KEYS = Object.freeze([
  'itemId',
  'order',
  'category',
  'sourceLabel',
]);
const REQUEST_KEYS = Object.freeze([
  'input',
  'finalizedRecommendation',
  'baseSnapshot',
  'source',
  'targetLabel',
]);

function reject(
  code: FinalizedOutfitSwapRejectionCode,
): FinalizedOutfitSwapResult {
  return Object.freeze({ kind: 'rejected' as const, code });
}

function isExactPlainDataRecord(
  value: unknown,
  keys: readonly string[],
): value is Record<string, unknown> {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    return false;
  }
  const ownKeys = Reflect.ownKeys(value);
  if (
    ownKeys.length !== keys.length ||
    ownKeys.some((key) => typeof key !== 'string' || !keys.includes(key))
  ) {
    return false;
  }
  return keys.every((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return (
      descriptor !== undefined &&
      'value' in descriptor &&
      descriptor.enumerable === true &&
      descriptor.get === undefined &&
      descriptor.set === undefined
    );
  });
}

function ownDataValue(
  value: Record<string, unknown>,
  key: string,
): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor !== undefined && 'value' in descriptor
    ? descriptor.value
    : undefined;
}

function freezeDeep<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const key of Reflect.ownKeys(value)) {
      freezeDeep((value as Record<PropertyKey, unknown>)[key]);
    }
    Object.freeze(value);
  }
  return value;
}

function cloneInput(input: RecommendInput): RecommendInput {
  const cloned: RecommendInput = {
    weather: { ...input.weather },
    child: { ...input.child },
    activity: input.activity,
  };
  if (Object.hasOwn(input, 'exposureMin')) {
    cloned.exposureMin = input.exposureMin;
  }
  if (Object.hasOwn(input, 'innerJakke')) {
    cloned.innerJakke = input.innerJakke;
  }
  if (Object.hasOwn(input, 'vognMode')) {
    cloned.vognMode = input.vognMode;
  }
  if (Object.hasOwn(input, 'context')) {
    cloned.context = { ...input.context };
  }
  if (Object.hasOwn(input, 'childCalibration')) {
    cloned.childCalibration = input.childCalibration;
  }
  return cloned;
}

function cloneFlags(flags: readonly SafetyFlag[]): SafetyFlag[] {
  return flags.map((flag) => ({
    code: flag.code,
    message: flag.message,
    sources: [...flag.sources],
    severity: flag.severity,
    category: flag.category,
    ...(Object.hasOwn(flag, 'displayInSheet')
      ? { displayInSheet: flag.displayInSheet }
      : {}),
  }));
}

function cloneRecommendation(
  recommendation: Recommendation,
): Recommendation {
  const cloned: Recommendation = {
    activity: recommendation.activity,
    tempBand: recommendation.tempBand,
    layers: recommendation.layers.map((layer) => ({
      category: layer.category,
      items: [...layer.items],
    })),
    notes: [...recommendation.notes],
    structuredNotes: recommendation.structuredNotes.map((note) => ({
      category: note.category,
      message: note.message,
    })),
    summary: recommendation.summary,
  };
  if (Object.hasOwn(recommendation, 'safetyFlags')) {
    cloned.safetyFlags = cloneFlags(recommendation.safetyFlags ?? []);
  }
  if (Object.hasOwn(recommendation, 'severity')) {
    cloned.severity = recommendation.severity;
  }
  return cloned;
}

function sameData(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function highestSeverity(flags: readonly SafetyFlag[]): Severity {
  let highest: Severity = 'NONE';
  for (const flag of flags) {
    if (SEVERITY_RANK[flag.severity] > SEVERITY_RANK[highest]) {
      highest = flag.severity;
    }
  }
  return highest;
}

export function hasCompleteFinalizedSafetyData(
  recommendation: Recommendation,
): boolean {
  return (
    Object.hasOwn(recommendation, 'safetyFlags') &&
    Array.isArray(recommendation.safetyFlags) &&
    Object.hasOwn(recommendation, 'severity') &&
    recommendation.severity ===
      highestSeverity(recommendation.safetyFlags)
  );
}

function countLabel(
  layers: readonly Layer[],
  label: string,
  category?: Layer['category'],
): number {
  let count = 0;
  for (const layer of layers) {
    if (category !== undefined && layer.category !== category) continue;
    for (const item of layer.items) {
      if (item === label) count += 1;
    }
  }
  return count;
}

function locateOccurrence(
  recommendation: Recommendation,
  snapshot: OutfitTruthSnapshotV1,
  source: OutfitSwapSourceOccurrenceV1,
): Readonly<{ layerIndex: number; itemIndex: number }> | null {
  let garmentOrder = 0;
  let located: Readonly<{ layerIndex: number; itemIndex: number }> | null =
    null;

  recommendation.layers.forEach((layer, layerIndex) => {
    layer.items.forEach((sourceLabel, itemIndex) => {
      const classification = classifyOutfitItem(
        sourceLabel,
        layer.category,
        snapshot.avatar.pose,
      );
      if (classification.kind === 'equipment') return;
      garmentOrder += 1;
      if (garmentOrder !== source.order) return;
      if (
        layer.category !== source.category ||
        sourceLabel !== source.sourceLabel ||
        located !== null
      ) {
        return;
      }
      located = Object.freeze({ layerIndex, itemIndex });
    });
  });
  return located;
}

function normalizedBaseIsFinalized(
  recommendation: Recommendation,
  control: ReturnType<typeof finalizeSafety>,
): boolean {
  if (
    !sameData(control.layers, recommendation.layers) ||
    !sameData(control.notes, recommendation.structuredNotes) ||
    !sameData(
      control.notes.map((note) => note.message),
      recommendation.notes,
    )
  ) {
    return false;
  }
  if (!hasCompleteFinalizedSafetyData(recommendation)) {
    return false;
  }
  return sameData(control.flags, recommendation.safetyFlags);
}

export function finalizeOutfitOccurrenceSwap(
  rawArgs: FinalizeOutfitOccurrenceSwapArgs,
): FinalizedOutfitSwapResult {
  if (!isExactPlainDataRecord(rawArgs, REQUEST_KEYS)) {
    return reject('invalid-request');
  }
  const input = ownDataValue(rawArgs, 'input') as RecommendInput;
  const finalizedRecommendation = ownDataValue(
    rawArgs,
    'finalizedRecommendation',
  ) as Recommendation;
  const baseSnapshot = ownDataValue(
    rawArgs,
    'baseSnapshot',
  ) as OutfitTruthSnapshotV1;
  const sourceValue = ownDataValue(rawArgs, 'source');
  const targetLabelValue = ownDataValue(rawArgs, 'targetLabel');

  if (
    !isExactPlainDataRecord(sourceValue, SOURCE_KEYS) ||
    typeof targetLabelValue !== 'string' ||
    targetLabelValue.trim() !== targetLabelValue ||
    targetLabelValue.length === 0
  ) {
    return reject('invalid-request');
  }
  const source = {
    itemId: ownDataValue(sourceValue, 'itemId'),
    order: ownDataValue(sourceValue, 'order'),
    category: ownDataValue(sourceValue, 'category'),
    sourceLabel: ownDataValue(sourceValue, 'sourceLabel'),
  } as OutfitSwapSourceOccurrenceV1;
  if (
    typeof source.itemId !== 'string' ||
    !Number.isInteger(source.order) ||
    source.order < 1 ||
    !['innerst', 'mellomlag', 'yttertoy', 'ekstra'].includes(
      source.category,
    ) ||
    typeof source.sourceLabel !== 'string' ||
    source.sourceLabel.length === 0
  ) {
    return reject('invalid-request');
  }
  if (!isOutfitTruthSnapshot(baseSnapshot)) {
    return reject('invalid-base-snapshot');
  }

  let rebuilt;
  try {
    rebuilt = createOutfitTruthSnapshot({
      transitionContextId: baseSnapshot.transitionContextId,
      input,
      finalizedRecommendation,
      pose: baseSnapshot.avatar.pose,
    });
  } catch {
    return reject('invalid-base-input');
  }
  if (rebuilt.kind !== 'supported') {
    return reject('base-unsupported-cardinality');
  }
  if (
    rebuilt.snapshot.snapshotId !== baseSnapshot.snapshotId ||
    rebuilt.snapshot.recommendationId !== baseSnapshot.recommendationId ||
    rebuilt.snapshot.recommendationFingerprint !==
      baseSnapshot.recommendationFingerprint ||
    rebuilt.snapshot.transitionContextId !==
      baseSnapshot.transitionContextId
  ) {
    return reject('base-identity-mismatch');
  }

  const matchingItem = rebuilt.snapshot.garments.find(
    (garment) => garment.itemId === source.itemId,
  );
  if (matchingItem === undefined) {
    return reject('source-not-found');
  }
  if (
    matchingItem.order !== source.order ||
    matchingItem.category !== source.category ||
    matchingItem.sourceLabel !== source.sourceLabel
  ) {
    return reject('source-identity-mismatch');
  }
  if (source.sourceLabel === targetLabelValue) {
    return reject('no-op-target');
  }

  const targetClassification = classifyOutfitItem(
    targetLabelValue,
    source.category,
    baseSnapshot.avatar.pose,
  );
  if (targetClassification.kind === 'unknown') {
    return reject('unknown-target');
  }
  if (targetClassification.kind === 'equipment') {
    return reject('target-semantic-equipment');
  }

  let baseClone: Recommendation;
  let inputClone: RecommendInput;
  let control: ReturnType<typeof finalizeSafety>;
  try {
    inputClone = cloneInput(input);
    baseClone = cloneRecommendation(finalizedRecommendation);
    control = finalizeSafety(
      inputClone,
      baseClone.layers,
      baseClone.structuredNotes,
      baseClone.safetyFlags ?? [],
    );
  } catch {
    return reject('finalization-failed');
  }
  if (!normalizedBaseIsFinalized(baseClone, control)) {
    return reject('base-not-finalized');
  }

  const location = locateOccurrence(baseClone, rebuilt.snapshot, source);
  if (location === null) {
    return reject('source-occurrence-ambiguous');
  }
  const swapped = cloneRecommendation(baseClone);
  const targetLayer = swapped.layers[location.layerIndex];
  if (
    targetLayer === undefined ||
    targetLayer.items[location.itemIndex] !== source.sourceLabel
  ) {
    return reject('source-occurrence-ambiguous');
  }
  targetLayer.items[location.itemIndex] = targetLabelValue;

  let finalized: ReturnType<typeof finalizeSafety>;
  try {
    finalized = finalizeSafety(
      cloneInput(inputClone),
      swapped.layers,
      swapped.structuredNotes,
      swapped.safetyFlags ?? [],
    );
  } catch {
    return reject('finalization-failed');
  }

  const controlTargetCount = countLabel(control.layers, targetLabelValue);
  const finalizedTargetCount = countLabel(
    finalized.layers,
    targetLabelValue,
  );
  const controlCategoryTargetCount = countLabel(
    control.layers,
    targetLabelValue,
    source.category,
  );
  const finalizedCategoryTargetCount = countLabel(
    finalized.layers,
    targetLabelValue,
    source.category,
  );
  if (
    finalizedTargetCount <= controlTargetCount ||
    finalizedCategoryTargetCount <= controlCategoryTargetCount
  ) {
    return reject('target-removed');
  }

  const controlSourceCount = countLabel(
    control.layers,
    source.sourceLabel,
  );
  const finalizedSourceCount = countLabel(
    finalized.layers,
    source.sourceLabel,
  );
  const controlCategorySourceCount = countLabel(
    control.layers,
    source.sourceLabel,
    source.category,
  );
  const finalizedCategorySourceCount = countLabel(
    finalized.layers,
    source.sourceLabel,
    source.category,
  );
  if (
    finalizedTargetCount !== controlTargetCount + 1 ||
    finalizedCategoryTargetCount !== controlCategoryTargetCount + 1 ||
    finalizedSourceCount !== controlSourceCount - 1 ||
    finalizedCategorySourceCount !== controlCategorySourceCount - 1
  ) {
    return reject('target-survival-ambiguous');
  }

  const recommendation = freezeDeep<Recommendation>({
    activity: baseClone.activity,
    tempBand: baseClone.tempBand,
    layers: finalized.layers.map((layer) => ({
      category: layer.category,
      items: [...layer.items],
    })),
    notes: finalized.notes.map((note) => note.message),
    structuredNotes: finalized.notes.map((note) => ({ ...note })),
    summary: baseClone.summary,
    safetyFlags: cloneFlags(finalized.flags),
    severity: highestSeverity(finalized.flags),
  });
  return freezeDeep({
    kind: 'finalized' as const,
    recommendation,
    targetCatalogGarmentId: targetClassification.catalogGarmentId,
  });
}
