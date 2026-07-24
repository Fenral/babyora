import type { SafetyFlag, Severity } from '../wool-layers/safety.js';
import { bandForTemp } from '../wool-layers/tables.js';
import type {
  LayerCategory,
  Note,
  RecommendInput,
  Recommendation,
} from '../wool-layers/types.js';
import {
  classifyOutfitItem,
  type BodyRegion,
  type NormalizedBodyAnchor,
  type OutfitAvatarPose,
} from './body-anchor-catalog.js';
import {
  avatarCoverageForCatalogGarment,
  type AvatarVisualCoverage,
} from './avatar-visibility-catalog.js';
import { resolveOutfitAvatarTruth } from './outfit-avatar-truth.js';

export type { BodyRegion, NormalizedBodyAnchor, OutfitAvatarPose };
export type {
  AvatarVisibleSlot,
  AvatarVisualCoverage,
} from './avatar-visibility-catalog.js';

export type OutfitSnapshotId = string & {
  readonly __brand: 'OutfitSnapshotId';
};
export type OutfitItemId = string & {
  readonly __brand: 'OutfitItemId';
};

export type OutfitGarmentTruth = Readonly<{
  itemId: OutfitItemId;
  sourceLabel: string;
  label: string;
  catalogGarmentId: string | null;
  category: Exclude<LayerCategory, 'utstyr'>;
  order: number;
  bodyRegion: BodyRegion;
  bodyAnchor: NormalizedBodyAnchor | null;
  avatarCoverage: AvatarVisualCoverage | null;
  visibleOnAvatar: boolean;
}>;

export type OutfitEquipmentTruth = Readonly<{
  itemId: OutfitItemId;
  sourceLabel: string;
  label: string;
  catalogGarmentId: string | null;
  order: number;
}>;

export type OutfitAvatarTruth = Readonly<{
  pose: OutfitAvatarPose;
  stateKey: string;
  verifiedAssetPath: string | null;
  visibleGarmentIds: readonly OutfitItemId[];
}>;

export type OutfitTruthSnapshotV1 = Readonly<{
  contractVersion: 1;
  snapshotId: OutfitSnapshotId;
  recommendationId: string;
  recommendationFingerprint: string;
  transitionContextId: string;
  garments: readonly OutfitGarmentTruth[];
  equipment: readonly OutfitEquipmentTruth[];
  avatar: OutfitAvatarTruth;
}>;

export type OutfitTruthBuildResultV1 =
  | Readonly<{
      kind: 'supported';
      snapshot: OutfitTruthSnapshotV1;
    }>
  | Readonly<{
      kind: 'unsupported-cardinality';
      reason: 'semantic-garment-count-outside-1-10';
      orderedGarments: readonly Readonly<{
        itemId: OutfitItemId;
        sourceLabel: string;
        label: string;
        order: number;
      }>[];
      equipment: readonly OutfitEquipmentTruth[];
    }>;

export type CreateOutfitTruthSnapshotArgsV1 = Readonly<{
  recommendationId: string;
  recommendationFingerprint: string;
  transitionContextId: string;
  input: RecommendInput;
  finalizedRecommendation: Recommendation;
  pose: OutfitAvatarPose;
}>;

const FACTORY_SNAPSHOTS = new WeakSet<object>();
const ACTIVITY = new Set(['vogn', 'baeresele', 'utelek', 'soevn']);
const LAYER_CATEGORY = new Set([
  'innerst',
  'mellomlag',
  'yttertoy',
  'ekstra',
  'utstyr',
]);
const NOTE_CATEGORY = new Set([
  'overoppheting',
  'kulde',
  'sol',
  'nedbor',
  'sikkerhet',
  'alder',
]);
const SEVERITY = new Set<Severity>([
  'NONE',
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]);

export class OutfitTruthInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OutfitTruthInputError';
  }
}

function assertOwnDataGraph(value: unknown, path: string): void {
  const visiting = new Set<object>();
  const walk = (current: unknown, currentPath: string): void => {
    if (current === null || typeof current !== 'object') return;
    if (visiting.has(current)) {
      throw new OutfitTruthInputError(`${currentPath} contains a cycle`);
    }
    const prototype = Object.getPrototypeOf(current);
    if (
      prototype !== Object.prototype &&
      prototype !== Array.prototype
    ) {
      throw new OutfitTruthInputError(
        `${currentPath} must contain plain own data`,
      );
    }
    visiting.add(current);
    for (const key of Reflect.ownKeys(current)) {
      if (typeof key !== 'string') {
        throw new OutfitTruthInputError(
          `${currentPath} contains a symbol key`,
        );
      }
      const descriptor = Object.getOwnPropertyDescriptor(current, key);
      if (
        descriptor === undefined ||
        !('value' in descriptor) ||
        descriptor.get !== undefined ||
        descriptor.set !== undefined
      ) {
        throw new OutfitTruthInputError(
          `${currentPath}.${key} must be an own data property`,
        );
      }
      walk(descriptor.value, `${currentPath}.${key}`);
    }
    visiting.delete(current);
  };
  walk(value, path);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function assertString(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new OutfitTruthInputError(`${path} must be a non-empty string`);
  }
}

function assertStringArray(
  value: unknown,
  path: string,
): asserts value is string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new OutfitTruthInputError(`${path} must be a string array`);
  }
}

function assertNoteArray(
  value: unknown,
  path: string,
): asserts value is Note[] {
  if (
    !Array.isArray(value) ||
    !value.every(
      (note) =>
        note !== null &&
        typeof note === 'object' &&
        NOTE_CATEGORY.has((note as Note).category) &&
        typeof (note as Note).message === 'string',
    )
  ) {
    throw new OutfitTruthInputError(
      `${path} must be a structured note array`,
    );
  }
}

function validSafetyFlag(flag: unknown): flag is SafetyFlag {
  if (flag === null || typeof flag !== 'object') return false;
  const candidate = flag as Partial<SafetyFlag>;
  return (
    typeof candidate.code === 'string' &&
    candidate.code.length > 0 &&
    typeof candidate.message === 'string' &&
    Array.isArray(candidate.sources) &&
    candidate.sources.every((source) => typeof source === 'string') &&
    typeof candidate.severity === 'string' &&
    SEVERITY.has(candidate.severity as Severity) &&
    typeof candidate.category === 'string' &&
    NOTE_CATEGORY.has(candidate.category as Note['category']) &&
    (candidate.displayInSheet === undefined ||
      typeof candidate.displayInSheet === 'boolean')
  );
}

function assertRecommendInput(value: unknown): asserts value is RecommendInput {
  assertOwnDataGraph(value, 'input');
  if (value === null || typeof value !== 'object') {
    throw new OutfitTruthInputError('input must be an object');
  }
  const input = value as Partial<RecommendInput>;
  if (
    input.weather === undefined ||
    !isFiniteNumber(input.weather.feelsLikeC) ||
    !isFiniteNumber(input.weather.tempC) ||
    !isFiniteNumber(input.weather.windMs) ||
    input.weather.windMs < 0 ||
    !isFiniteNumber(input.weather.precipMmH) ||
    input.weather.precipMmH < 0 ||
    input.child === undefined ||
    !Number.isInteger(input.child.ageMonths) ||
    !ACTIVITY.has(input.activity ?? '')
  ) {
    throw new OutfitTruthInputError('input is not a normalized RecommendInput');
  }
}

function assertRecommendation(
  value: unknown,
  input: RecommendInput,
): asserts value is Recommendation {
  assertOwnDataGraph(value, 'finalizedRecommendation');
  if (value === null || typeof value !== 'object') {
    throw new OutfitTruthInputError(
      'finalizedRecommendation must be an object',
    );
  }
  const recommendation = value as Partial<Recommendation>;
  if (
    recommendation.activity !== input.activity ||
    recommendation.tempBand !== bandForTemp(input.weather.feelsLikeC) ||
    !Array.isArray(recommendation.layers) ||
    recommendation.layers.length === 0 ||
    !recommendation.layers.every(
      (layer) =>
        layer !== null &&
        typeof layer === 'object' &&
        LAYER_CATEGORY.has(layer.category) &&
        Array.isArray(layer.items) &&
        layer.items.every((item) => typeof item === 'string'),
    )
  ) {
    throw new OutfitTruthInputError(
      'finalizedRecommendation does not match normalized input',
    );
  }
  assertStringArray(recommendation.notes, 'finalizedRecommendation.notes');
  assertNoteArray(
    recommendation.structuredNotes,
    'finalizedRecommendation.structuredNotes',
  );
  if (typeof recommendation.summary !== 'string') {
    throw new OutfitTruthInputError(
      'finalizedRecommendation.summary must be a string',
    );
  }
  if (
    Object.prototype.hasOwnProperty.call(recommendation, 'safetyFlags') &&
    (!Array.isArray(recommendation.safetyFlags) ||
      !recommendation.safetyFlags.every(validSafetyFlag))
  ) {
    throw new OutfitTruthInputError(
      'finalizedRecommendation.safetyFlags is malformed',
    );
  }
  if (
    Object.prototype.hasOwnProperty.call(recommendation, 'severity') &&
    (typeof recommendation.severity !== 'string' ||
      !SEVERITY.has(recommendation.severity as Severity))
  ) {
    throw new OutfitTruthInputError(
      'finalizedRecommendation.severity is malformed',
    );
  }
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(',')}]`;
  }
  return `{${Object.keys(value)
    .sort()
    .map(
      (key) =>
        `${JSON.stringify(key)}:${stableSerialize(
          (value as Record<string, unknown>)[key],
        )}`,
    )
    .join(',')}}`;
}

function stableHash(value: string): string {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193);
    second = Math.imul(second ^ code, 0x85ebca6b);
  }
  return `${(first >>> 0).toString(16).padStart(8, '0')}${(
    second >>> 0
  )
    .toString(16)
    .padStart(8, '0')}`;
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

function makeItemId(
  identity: string,
  category: LayerCategory,
  sourceLabel: string,
  duplicateOrdinal: number,
): OutfitItemId {
  return `outfit-item-v1:${stableHash(
    `${identity}|${category}|${sourceLabel}|${duplicateOrdinal}`,
  )}` as OutfitItemId;
}

export function createOutfitTruthSnapshot(
  args: CreateOutfitTruthSnapshotArgsV1,
): OutfitTruthBuildResultV1 {
  assertOwnDataGraph(args, 'args');
  assertString(args.recommendationId, 'recommendationId');
  assertString(
    args.recommendationFingerprint,
    'recommendationFingerprint',
  );
  assertString(args.transitionContextId, 'transitionContextId');
  if (args.pose !== 'sitting' && args.pose !== 'standing') {
    throw new OutfitTruthInputError('pose is invalid');
  }
  assertRecommendInput(args.input);
  assertRecommendation(args.finalizedRecommendation, args.input);

  const recommendationIdentity = stableHash(
    stableSerialize({
      recommendationId: args.recommendationId,
      recommendationFingerprint: args.recommendationFingerprint,
      transitionContextId: args.transitionContextId,
      pose: args.pose,
      input: args.input,
      finalizedRecommendation: args.finalizedRecommendation,
    }),
  );
  const duplicateCount = new Map<string, number>();
  const garmentDrafts: OutfitGarmentTruth[] = [];
  const equipment: OutfitEquipmentTruth[] = [];

  for (const layer of args.finalizedRecommendation.layers) {
    for (const sourceLabel of layer.items) {
      const duplicateKey = `${layer.category}\u0000${sourceLabel}`;
      const duplicateOrdinal = duplicateCount.get(duplicateKey) ?? 0;
      duplicateCount.set(duplicateKey, duplicateOrdinal + 1);
      const itemId = makeItemId(
        recommendationIdentity,
        layer.category,
        sourceLabel,
        duplicateOrdinal,
      );
      const classified = classifyOutfitItem(
        sourceLabel,
        layer.category,
        args.pose,
      );
      if (classified.kind === 'equipment') {
        equipment.push({
          itemId,
          sourceLabel,
          label: sourceLabel.trim(),
          catalogGarmentId: classified.catalogGarmentId,
          order: equipment.length + 1,
        });
        continue;
      }

      const catalogGarmentId =
        classified.kind === 'garment'
          ? classified.catalogGarmentId
          : null;
      garmentDrafts.push({
        itemId,
        sourceLabel,
        label: sourceLabel.trim(),
        catalogGarmentId,
        category:
          layer.category === 'utstyr' ? 'ekstra' : layer.category,
        order: garmentDrafts.length + 1,
        bodyRegion:
          classified.kind === 'garment'
            ? classified.bodyRegion
            : 'unknown',
        bodyAnchor:
          classified.kind === 'garment'
            ? classified.bodyAnchor
            : null,
        avatarCoverage:
          catalogGarmentId === null
            ? null
            : avatarCoverageForCatalogGarment(catalogGarmentId),
        visibleOnAvatar: false,
      });
    }
  }

  const frozenEquipment = freezeDeep(
    equipment.map((item) => ({ ...item })),
  );
  if (garmentDrafts.length < 1 || garmentDrafts.length > 10) {
    return freezeDeep({
      kind: 'unsupported-cardinality',
      reason: 'semantic-garment-count-outside-1-10',
      orderedGarments: garmentDrafts.map((garment) => ({
        itemId: garment.itemId,
        sourceLabel: garment.sourceLabel,
        label: garment.label,
        order: garment.order,
      })),
      equipment: frozenEquipment,
    });
  }

  const avatar = resolveOutfitAvatarTruth({
    pose: args.pose,
    garments: garmentDrafts,
  });
  const visible = new Set(avatar.visibleGarmentIds);
  const garments = garmentDrafts.map((garment) => ({
    ...garment,
    visibleOnAvatar: visible.has(garment.itemId),
  }));
  const snapshotId =
    `outfit-snapshot-v1:${stableHash(
      `${recommendationIdentity}|${garments
        .map((garment) => garment.itemId)
        .join('|')}`,
    )}` as OutfitSnapshotId;
  const snapshot = freezeDeep({
    contractVersion: 1 as const,
    snapshotId,
    recommendationId: args.recommendationId,
    recommendationFingerprint: args.recommendationFingerprint,
    transitionContextId: args.transitionContextId,
    garments,
    equipment: frozenEquipment,
    avatar,
  });
  FACTORY_SNAPSHOTS.add(snapshot);
  return freezeDeep({
    kind: 'supported',
    snapshot,
  });
}

export function isOutfitTruthSnapshot(
  value: unknown,
): value is OutfitTruthSnapshotV1 {
  if (
    value === null ||
    typeof value !== 'object' ||
    !FACTORY_SNAPSHOTS.has(value)
  ) {
    return false;
  }
  const snapshot = value as OutfitTruthSnapshotV1;
  return (
    snapshot.contractVersion === 1 &&
    Object.isFrozen(snapshot) &&
    Object.isFrozen(snapshot.garments) &&
    Object.isFrozen(snapshot.equipment) &&
    snapshot.garments.length >= 1 &&
    snapshot.garments.length <= 10 &&
    snapshot.garments.every(
      (garment, index) =>
        garment.order === index + 1 &&
        Object.isFrozen(garment) &&
        typeof garment.itemId === 'string',
    )
  );
}
