import type {
  SafetyFlag,
  SafetySource,
  Severity,
} from '../wool-layers/safety.js';
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
  transitionContextId: string;
  input: RecommendInput;
  finalizedRecommendation: Recommendation;
  pose: OutfitAvatarPose;
}>;

/**
 * Runtime provenance for values canonicalized and recursively frozen by this
 * module. Membership does not authenticate engine origin and is not a
 * cryptographic claim about the caller that supplied the plain input data.
 */
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
const TEMP_BAND = new Set([
  'tropisk',
  'varm',
  'mild',
  'kjolig',
  'kald',
  'frost',
  'streng_frost',
  'ekstrem',
  'ekstrem_varme',
]);
const VOGN_MODE = new Set(['awake', 'sleeping']);
const SAFETY_SOURCE = new Set<SafetySource>([
  'AAP-2022',
  'NHS',
  'LT-RT',
  'LT-TOG',
  'LT-PRAM',
  'RN-AU',
  'RN-WRAP',
  'CDC-NICHD',
  'AAP-HC',
  'ASTM-2024',
  'NHTSA',
  'Pediatrics-Pram',
  'IHDI',
  'POLICY',
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
    const isArray = Array.isArray(current);
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
      if ((!isArray || key !== 'length') && descriptor.enumerable !== true) {
        throw new OutfitTruthInputError(
          `${currentPath}.${key} must be enumerable`,
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

function assertRecordShape(
  value: unknown,
  path: string,
  requiredKeys: readonly string[],
  optionalKeys: readonly string[] = [],
): asserts value is Record<string, unknown> {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new OutfitTruthInputError(`${path} must be a plain object`);
  }
  const allowedKeys = new Set([...requiredKeys, ...optionalKeys]);
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string' || !allowedKeys.has(key)) {
      throw new OutfitTruthInputError(
        `${path} contains an unexpected property ${String(key)}`,
      );
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor === undefined ||
      !('value' in descriptor) ||
      descriptor.enumerable !== true
    ) {
      throw new OutfitTruthInputError(
        `${path}.${key} must be an enumerable own data property`,
      );
    }
  }
  const missing = requiredKeys.filter(
    (key) => !Object.prototype.hasOwnProperty.call(value, key),
  );
  if (missing.length > 0) {
    throw new OutfitTruthInputError(
      `${path} is missing ${missing.join(', ')}`,
    );
  }
}

function assertDenseArray(
  value: unknown,
  path: string,
): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new OutfitTruthInputError(`${path} must be an array`);
  }
  let indexCount = 0;
  for (const key of Reflect.ownKeys(value)) {
    if (key === 'length') continue;
    if (typeof key !== 'string') {
      throw new OutfitTruthInputError(`${path} contains a symbol key`);
    }
    const index = Number(key);
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= value.length ||
      String(index) !== key
    ) {
      throw new OutfitTruthInputError(
        `${path} contains an unexpected property ${key}`,
      );
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor === undefined ||
      !('value' in descriptor) ||
      descriptor.enumerable !== true
    ) {
      throw new OutfitTruthInputError(
        `${path}[${key}] must be an enumerable own data property`,
      );
    }
    indexCount += 1;
  }
  if (indexCount !== value.length) {
    throw new OutfitTruthInputError(`${path} must not be sparse`);
  }
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
  assertDenseArray(value, path);
  if (!value.every((item) => typeof item === 'string')) {
    throw new OutfitTruthInputError(`${path} must be a string array`);
  }
}

function assertNoteArray(
  value: unknown,
  path: string,
): asserts value is Note[] {
  assertDenseArray(value, path);
  for (const [index, note] of value.entries()) {
    const notePath = `${path}[${index}]`;
    assertRecordShape(note, notePath, ['category', 'message']);
    if (
      !NOTE_CATEGORY.has(note.category as Note['category']) ||
      typeof note.message !== 'string'
    ) {
      throw new OutfitTruthInputError(
        `${notePath} must be a structured note`,
      );
    }
  }
}

function assertSafetyFlagArray(
  value: unknown,
  path: string,
): asserts value is SafetyFlag[] {
  assertDenseArray(value, path);
  for (const [index, flag] of value.entries()) {
    const flagPath = `${path}[${index}]`;
    assertRecordShape(
      flag,
      flagPath,
      ['code', 'message', 'sources', 'severity', 'category'],
      ['displayInSheet'],
    );
    assertString(flag.code, `${flagPath}.code`);
    if (typeof flag.message !== 'string') {
      throw new OutfitTruthInputError(
        `${flagPath}.message must be a string`,
      );
    }
    assertDenseArray(flag.sources, `${flagPath}.sources`);
    if (
      !flag.sources.every(
        (source) =>
          typeof source === 'string' &&
          SAFETY_SOURCE.has(source as SafetySource),
      )
    ) {
      throw new OutfitTruthInputError(
        `${flagPath}.sources must contain known safety sources`,
      );
    }
    if (
      typeof flag.severity !== 'string' ||
      !SEVERITY.has(flag.severity as Severity)
    ) {
      throw new OutfitTruthInputError(
        `${flagPath}.severity is malformed`,
      );
    }
    if (
      typeof flag.category !== 'string' ||
      !NOTE_CATEGORY.has(flag.category as Note['category'])
    ) {
      throw new OutfitTruthInputError(
        `${flagPath}.category is malformed`,
      );
    }
    if (
      Object.prototype.hasOwnProperty.call(flag, 'displayInSheet') &&
      typeof flag.displayInSheet !== 'boolean'
    ) {
      throw new OutfitTruthInputError(
        `${flagPath}.displayInSheet must be a boolean`,
      );
    }
  }
}

function assertRecommendInput(value: unknown): asserts value is RecommendInput {
  assertOwnDataGraph(value, 'input');
  assertRecordShape(
    value,
    'input',
    ['weather', 'child', 'activity'],
    [
      'exposureMin',
      'innerJakke',
      'vognMode',
      'context',
      'childCalibration',
    ],
  );
  assertRecordShape(
    value.weather,
    'input.weather',
    ['feelsLikeC', 'tempC', 'windMs', 'precipMmH'],
    ['humidity', 'symbolCode', 'uvIndex'],
  );
  assertRecordShape(
    value.child,
    'input.child',
    ['ageMonths'],
    ['canRoll'],
  );
  if (
    !isFiniteNumber(value.weather.feelsLikeC) ||
    !isFiniteNumber(value.weather.tempC) ||
    !isFiniteNumber(value.weather.windMs) ||
    value.weather.windMs < 0 ||
    !isFiniteNumber(value.weather.precipMmH) ||
    value.weather.precipMmH < 0 ||
    !Number.isInteger(value.child.ageMonths) ||
    (value.child.ageMonths as number) < 0 ||
    (value.child.ageMonths as number) > 60 ||
    !ACTIVITY.has(value.activity as string)
  ) {
    throw new OutfitTruthInputError('input is not a normalized RecommendInput');
  }
  if (
    Object.prototype.hasOwnProperty.call(value.weather, 'humidity') &&
    (!isFiniteNumber(value.weather.humidity) ||
      value.weather.humidity < 0 ||
      value.weather.humidity > 100)
  ) {
    throw new OutfitTruthInputError(
      'input.weather.humidity must be finite and between 0 and 100',
    );
  }
  if (
    Object.prototype.hasOwnProperty.call(value.weather, 'symbolCode') &&
    typeof value.weather.symbolCode !== 'string'
  ) {
    throw new OutfitTruthInputError(
      'input.weather.symbolCode must be a string',
    );
  }
  if (
    Object.prototype.hasOwnProperty.call(value.weather, 'uvIndex') &&
    (!isFiniteNumber(value.weather.uvIndex) || value.weather.uvIndex < 0)
  ) {
    throw new OutfitTruthInputError(
      'input.weather.uvIndex must be finite and non-negative',
    );
  }
  if (
    Object.prototype.hasOwnProperty.call(value.child, 'canRoll') &&
    typeof value.child.canRoll !== 'boolean'
  ) {
    throw new OutfitTruthInputError(
      'input.child.canRoll must be a boolean',
    );
  }
  if (
    Object.prototype.hasOwnProperty.call(value, 'exposureMin') &&
    (!isFiniteNumber(value.exposureMin) || value.exposureMin < 0)
  ) {
    throw new OutfitTruthInputError(
      'input.exposureMin must be finite and non-negative',
    );
  }
  if (
    Object.prototype.hasOwnProperty.call(value, 'innerJakke') &&
    typeof value.innerJakke !== 'boolean'
  ) {
    throw new OutfitTruthInputError(
      'input.innerJakke must be a boolean',
    );
  }
  if (
    Object.prototype.hasOwnProperty.call(value, 'vognMode') &&
    (typeof value.vognMode !== 'string' ||
      !VOGN_MODE.has(value.vognMode))
  ) {
    throw new OutfitTruthInputError(
      'input.vognMode must be awake or sleeping',
    );
  }
  if (Object.prototype.hasOwnProperty.call(value, 'context')) {
    assertRecordShape(
      value.context,
      'input.context',
      [],
      ['bilstol'],
    );
    if (
      Object.prototype.hasOwnProperty.call(value.context, 'bilstol') &&
      typeof value.context.bilstol !== 'boolean'
    ) {
      throw new OutfitTruthInputError(
        'input.context.bilstol must be a boolean',
      );
    }
  }
  if (
    Object.prototype.hasOwnProperty.call(value, 'childCalibration') &&
    (typeof value.childCalibration !== 'number' ||
      ![-1, 0, 1].includes(value.childCalibration))
  ) {
    throw new OutfitTruthInputError(
      'input.childCalibration must be -1, 0, or 1',
    );
  }
}

function assertRecommendation(
  value: unknown,
  input: RecommendInput,
): asserts value is Recommendation {
  assertOwnDataGraph(value, 'finalizedRecommendation');
  assertRecordShape(
    value,
    'finalizedRecommendation',
    [
      'activity',
      'tempBand',
      'layers',
      'notes',
      'structuredNotes',
      'summary',
    ],
    ['safetyFlags', 'severity'],
  );
  if (
    value.activity !== input.activity ||
    value.tempBand !== bandForTemp(input.weather.feelsLikeC) ||
    typeof value.tempBand !== 'string' ||
    !TEMP_BAND.has(value.tempBand)
  ) {
    throw new OutfitTruthInputError(
      'finalizedRecommendation does not match normalized input',
    );
  }
  assertDenseArray(value.layers, 'finalizedRecommendation.layers');
  if (value.layers.length === 0) {
    throw new OutfitTruthInputError(
      'finalizedRecommendation.layers must not be empty',
    );
  }
  for (const [index, layer] of value.layers.entries()) {
    const layerPath = `finalizedRecommendation.layers[${index}]`;
    assertRecordShape(layer, layerPath, ['category', 'items']);
    if (
      typeof layer.category !== 'string' ||
      !LAYER_CATEGORY.has(layer.category)
    ) {
      throw new OutfitTruthInputError(
        `${layerPath}.category is malformed`,
      );
    }
    assertStringArray(layer.items, `${layerPath}.items`);
  }
  assertStringArray(value.notes, 'finalizedRecommendation.notes');
  assertNoteArray(
    value.structuredNotes,
    'finalizedRecommendation.structuredNotes',
  );
  if (typeof value.summary !== 'string') {
    throw new OutfitTruthInputError(
      'finalizedRecommendation.summary must be a string',
    );
  }
  if (
    Object.prototype.hasOwnProperty.call(value, 'safetyFlags')
  ) {
    assertSafetyFlagArray(
      value.safetyFlags,
      'finalizedRecommendation.safetyFlags',
    );
  }
  if (
    Object.prototype.hasOwnProperty.call(value, 'severity') &&
    (typeof value.severity !== 'string' ||
      !SEVERITY.has(value.severity as Severity))
  ) {
    throw new OutfitTruthInputError(
      'finalizedRecommendation.severity is malformed',
    );
  }
}

function stableSerialize(value: unknown, path = 'value'): string {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new OutfitTruthInputError(
        `${path} contains a non-finite number`,
      );
    }
    return Object.is(value, -0) ? '-0' : JSON.stringify(value);
  }
  if (typeof value !== 'object') {
    throw new OutfitTruthInputError(
      `${path} contains an unsupported ${typeof value}`,
    );
  }
  if (Array.isArray(value)) {
    assertDenseArray(value, path);
    return `[${value
      .map((item, index) => stableSerialize(item, `${path}[${index}]`))
      .join(',')}]`;
  }
  const keys = Reflect.ownKeys(value);
  if (
    Object.getPrototypeOf(value) !== Object.prototype ||
    keys.some((key) => typeof key !== 'string') ||
    keys.some((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      return (
        descriptor === undefined ||
        !('value' in descriptor) ||
        descriptor.enumerable !== true
      );
    })
  ) {
    throw new OutfitTruthInputError(
      `${path} contains unsupported object data`,
    );
  }
  return `{${(keys as string[])
    .sort()
    .map(
      (key) =>
        `${JSON.stringify(key)}:${stableSerialize(
          (value as Record<string, unknown>)[key],
          `${path}.${key}`,
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

function assertExactOwnKeys(
  value: object,
  expectedKeys: readonly string[],
  path: string,
): void {
  const actualKeys = Reflect.ownKeys(value).map(String);
  const expected = new Set(expectedKeys);
  const unexpected = actualKeys.filter((key) => !expected.has(key));
  const missing = expectedKeys.filter(
    (key) => !Object.prototype.hasOwnProperty.call(value, key),
  );
  if (unexpected.length > 0 || missing.length > 0) {
    throw new OutfitTruthInputError(
      `${path} has an invalid shape${
        unexpected.length === 0
          ? ''
          : `; unexpected: ${unexpected.join(', ')}`
      }${missing.length === 0 ? '' : `; missing: ${missing.join(', ')}`}`,
    );
  }
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
  assertExactOwnKeys(
    args,
    ['transitionContextId', 'input', 'finalizedRecommendation', 'pose'],
    'args',
  );
  assertString(args.transitionContextId, 'transitionContextId');
  if (args.pose !== 'sitting' && args.pose !== 'standing') {
    throw new OutfitTruthInputError('pose is invalid');
  }
  assertRecommendInput(args.input);
  assertRecommendation(args.finalizedRecommendation, args.input);

  // Deterministic content binding, not engine-origin authentication. Any
  // content change gets a new identity without rerunning the recommendation
  // engine, which also keeps finalized alternative outcomes representable.
  const recommendationContentDigest = stableHash(
    stableSerialize({
      input: args.input,
      finalizedRecommendation: args.finalizedRecommendation,
      pose: args.pose,
    }),
  );
  const recommendationFingerprint =
    `outfit-recommendation-fingerprint-v1:${recommendationContentDigest}`;
  const recommendationId = `outfit-recommendation-v1:${stableHash(
    `recommendation|${recommendationContentDigest}`,
  )}`;
  const recommendationIdentity = stableHash(
    stableSerialize({
      recommendationId,
      recommendationFingerprint,
      transitionContextId: args.transitionContextId,
      pose: args.pose,
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
    recommendationId,
    recommendationFingerprint,
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
