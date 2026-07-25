import { parseStrictIsoInstant } from '../met-no/types.js';
import {
  isOutfitBundleProducerSeedV1,
  type OutfitBundleProducerSeedV1,
} from '../planning/planned-outfit-context.js';
import {
  buildOutfitAlternativeOptions,
  isOutfitAlternativeOption,
  type OutfitAlternativeOptionV1,
} from './alternative-options.js';
import {
  createOutfitTruthSnapshot,
  isOutfitTruthSnapshot,
  type CreateOutfitTruthSnapshotArgsV1,
  type OutfitTruthBuildResultV1,
  type OutfitTruthSnapshotV1,
} from './outfit-truth.js';

export type { OutfitBundleProducerSeedV1 };

export type OutfitBundleSourceV1 =
  | Readonly<{
      kind: 'current';
      sourceContextId: string;
    }>
  | Readonly<{
      kind: 'planned';
      sourceContextId: string;
      planningEventId: string;
      plannedForIso: string;
    }>;

export type OutfitBundleWeatherV1 = Readonly<{
  tempC: number;
  feelsLikeC: number;
}>;

export type ProduceOutfitBundleArgsV1 = Readonly<{
  seed: OutfitBundleProducerSeedV1;
  source: OutfitBundleSourceV1;
}>;

export type OutfitBundleUnavailableReason =
  | 'invalid-input'
  | 'input-result-mismatch'
  | 'invalid-provenance'
  | 'truth-build-failed';

type UnsupportedOutfitTruth = Extract<
  OutfitTruthBuildResultV1,
  { kind: 'unsupported-cardinality' }
>;

export type OutfitBundleProducerResult =
  | Readonly<{
      kind: 'supported';
      bundleVersion: 1;
      source: OutfitBundleSourceV1;
      weather: OutfitBundleWeatherV1;
      base: OutfitTruthSnapshotV1;
      options: readonly OutfitAlternativeOptionV1[];
    }>
  | Readonly<{
      kind: 'unsupported-cardinality';
      bundleVersion: 1;
      source: OutfitBundleSourceV1;
      weather: OutfitBundleWeatherV1;
      truth: UnsupportedOutfitTruth;
    }>
  | Readonly<{
      kind: 'unavailable';
      bundleVersion: 1;
      reason: OutfitBundleUnavailableReason;
    }>;

const ARG_KEYS = Object.freeze(['seed', 'source']);
const CURRENT_SOURCE_KEYS = Object.freeze([
  'kind',
  'sourceContextId',
]);
const PLANNED_SOURCE_KEYS = Object.freeze([
  'kind',
  'sourceContextId',
  'planningEventId',
  'plannedForIso',
]);

function freezeDeep<T>(value: T): T {
  if (
    value !== null
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    for (const key of Reflect.ownKeys(value)) {
      freezeDeep((value as Record<PropertyKey, unknown>)[key]);
    }
    Object.freeze(value);
  }
  return value;
}

function unavailable(
  reason: OutfitBundleUnavailableReason,
): OutfitBundleProducerResult {
  return freezeDeep({
    kind: 'unavailable' as const,
    bundleVersion: 1 as const,
    reason,
  });
}

function isExactOwnDataRecord(
  value: unknown,
  keys: readonly string[],
): value is Record<string, unknown> {
  if (
    value === null
    || typeof value !== 'object'
    || Array.isArray(value)
    || Object.getPrototypeOf(value) !== Object.prototype
  ) {
    return false;
  }
  const ownKeys = Reflect.ownKeys(value);
  if (
    ownKeys.length !== keys.length
    || ownKeys.some(
      (key) => typeof key !== 'string' || !keys.includes(key),
    )
  ) {
    return false;
  }
  return keys.every((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return (
      descriptor !== undefined
      && Object.hasOwn(descriptor, 'value')
      && descriptor.enumerable === true
      && descriptor.get === undefined
      && descriptor.set === undefined
    );
  });
}

function ownDataValue(
  value: Record<string, unknown>,
  key: string,
): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor !== undefined && Object.hasOwn(descriptor, 'value')
    ? descriptor.value
    : undefined;
}

function isExactIdentity(value: unknown): value is string {
  return (
    typeof value === 'string'
    && value.length > 0
    && value.trim() === value
    && value.normalize('NFC') === value
    && !/\p{Cc}|\p{Cf}/u.test(value)
  );
}

function readSource(value: unknown): OutfitBundleSourceV1 | null {
  if (
    value === null
    || typeof value !== 'object'
    || Array.isArray(value)
    || Object.getPrototypeOf(value) !== Object.prototype
  ) {
    return null;
  }
  const kindDescriptor = Object.getOwnPropertyDescriptor(value, 'kind');
  if (
    kindDescriptor === undefined
    || !Object.hasOwn(kindDescriptor, 'value')
  ) {
    return null;
  }
  const kind = kindDescriptor.value;
  if (kind === 'current') {
    if (!isExactOwnDataRecord(value, CURRENT_SOURCE_KEYS)) return null;
    const sourceContextId = ownDataValue(value, 'sourceContextId');
    if (!isExactIdentity(sourceContextId)) return null;
    return freezeDeep({
      kind,
      sourceContextId,
    });
  }
  if (kind === 'planned') {
    if (!isExactOwnDataRecord(value, PLANNED_SOURCE_KEYS)) return null;
    const sourceContextId = ownDataValue(value, 'sourceContextId');
    const planningEventId = ownDataValue(value, 'planningEventId');
    const plannedForIso = ownDataValue(value, 'plannedForIso');
    if (
      !isExactIdentity(sourceContextId)
      || !isExactIdentity(planningEventId)
      || sourceContextId === planningEventId
      || typeof plannedForIso !== 'string'
      || parseStrictIsoInstant(plannedForIso) === null
    ) {
      return null;
    }
    return freezeDeep({
      kind,
      sourceContextId,
      planningEventId,
      plannedForIso,
    });
  }
  return null;
}

function sameBaseIdentity(
  actual: OutfitTruthSnapshotV1,
  expected: OutfitTruthSnapshotV1,
): boolean {
  return (
    actual.snapshotId === expected.snapshotId
    && actual.recommendationId === expected.recommendationId
    && actual.recommendationFingerprint
      === expected.recommendationFingerprint
    && actual.transitionContextId === expected.transitionContextId
    && actual.garments.length === expected.garments.length
    && actual.equipment.length === expected.equipment.length
    && actual.garments.every(
      (garment, index) =>
        garment.itemId === expected.garments[index]?.itemId,
    )
    && actual.equipment.every(
      (equipment, index) =>
        equipment.itemId === expected.equipment[index]?.itemId,
    )
  );
}

function optionsBelongToBase(
  options: readonly OutfitAlternativeOptionV1[],
  base: OutfitTruthSnapshotV1,
): boolean {
  const garmentIds = new Set(
    base.garments.map((garment) => garment.itemId),
  );
  const equipmentIds = new Set(
    base.equipment.map((equipment) => equipment.itemId),
  );
  return options.every(
    (option) =>
      isOutfitAlternativeOption(option)
      && garmentIds.has(option.sourceItemId)
      && !equipmentIds.has(option.sourceItemId)
      && option.outcome.transitionContextId === base.transitionContextId,
  );
}

function produceOutfitBundleUnchecked(
  rawArgs: ProduceOutfitBundleArgsV1,
): OutfitBundleProducerResult {
  if (!isExactOwnDataRecord(rawArgs, ARG_KEYS)) {
    return unavailable('invalid-input');
  }
  const rawSeed = ownDataValue(rawArgs, 'seed');
  if (!isOutfitBundleProducerSeedV1(rawSeed)) {
    return unavailable('invalid-provenance');
  }
  const source = readSource(ownDataValue(rawArgs, 'source'));
  if (source === null) return unavailable('invalid-input');
  if (source.sourceContextId !== rawSeed.sourceContextId) {
    return unavailable('invalid-provenance');
  }

  const input = rawSeed.input as unknown as
    CreateOutfitTruthSnapshotArgsV1['input'];
  const finalizedRecommendation =
    rawSeed.finalizedRecommendation as unknown as
      CreateOutfitTruthSnapshotArgsV1['finalizedRecommendation'];
  const truthArgs = {
    transitionContextId: rawSeed.transitionContextId,
    input,
    finalizedRecommendation,
    pose: 'sitting' as const,
  };
  let truth: OutfitTruthBuildResultV1;
  try {
    truth = createOutfitTruthSnapshot(truthArgs);
  } catch {
    return unavailable('truth-build-failed');
  }
  const weather = freezeDeep({
    tempC: rawSeed.input.weather.tempC,
    feelsLikeC: rawSeed.input.weather.feelsLikeC,
  });
  if (truth.kind === 'unsupported-cardinality') {
    return freezeDeep({
      kind: 'unsupported-cardinality' as const,
      bundleVersion: 1 as const,
      source,
      weather,
      truth,
    });
  }
  const base = truth.snapshot;
  if (
    !isOutfitTruthSnapshot(base)
    || base.transitionContextId !== rawSeed.transitionContextId
    || base.recommendationId !== rawSeed.recommendationId
    || base.recommendationFingerprint
      !== rawSeed.recommendationFingerprint
  ) {
    return unavailable('input-result-mismatch');
  }

  let alternativeBuild;
  try {
    alternativeBuild = buildOutfitAlternativeOptions(truthArgs);
  } catch {
    return unavailable('truth-build-failed');
  }
  if (alternativeBuild.kind === 'unavailable') {
    return unavailable('truth-build-failed');
  }
  if (alternativeBuild.kind === 'unsupported-cardinality') {
    return unavailable('input-result-mismatch');
  }
  if (
    !isOutfitTruthSnapshot(alternativeBuild.base)
    || !sameBaseIdentity(alternativeBuild.base, base)
    || !optionsBelongToBase(alternativeBuild.options, base)
  ) {
    return unavailable('input-result-mismatch');
  }
  return freezeDeep({
    kind: 'supported' as const,
    bundleVersion: 1 as const,
    source,
    weather,
    base,
    options: alternativeBuild.options,
  });
}

export function produceOutfitBundle(
  args: ProduceOutfitBundleArgsV1,
): OutfitBundleProducerResult {
  try {
    return produceOutfitBundleUnchecked(args);
  } catch {
    return unavailable('invalid-input');
  }
}
