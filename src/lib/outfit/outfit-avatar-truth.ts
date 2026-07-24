import manifestJson from '../../../public/avatars/verified/index.json?raw';
import type {
  AvatarVisibleSlot,
  AvatarVisualCoverage,
} from './avatar-visibility-catalog.js';
import type {
  OutfitAvatarTruth,
  OutfitItemId,
  OutfitAvatarPose,
} from './outfit-truth.js';

type ManifestRow = Readonly<{
  name: string;
  asset: string;
  pose: OutfitAvatarPose;
  garments: readonly string[];
}>;

export type AvatarResolvableGarment = Readonly<{
  itemId: OutfitItemId;
  catalogGarmentId: string | null;
  avatarCoverage: AvatarVisualCoverage | null;
}>;

const VALID_SLOTS = new Set<AvatarVisibleSlot>([
  'head',
  'neck',
  'torso',
  'arms',
  'hands',
  'hips',
  'legs',
  'feet',
]);

const MANIFEST = Object.freeze(
  (JSON.parse(manifestJson) as ManifestRow[]).map((row) =>
    Object.freeze({
      name: row.name,
      asset: row.asset,
      pose: row.pose,
      garments: Object.freeze([...row.garments]),
    }),
  ),
);

function readExactPlainDataRecord(
  value: unknown,
  expectedKeys: readonly string[],
): Readonly<Record<string, unknown>> | null {
  try {
    if (
      value === null ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      Object.getPrototypeOf(value) !== Object.prototype
    ) {
      return null;
    }
    const expected = new Set(expectedKeys);
    const ownKeys = Reflect.ownKeys(value);
    if (
      ownKeys.length !== expectedKeys.length ||
      ownKeys.some(
        (key) => typeof key !== 'string' || !expected.has(key),
      )
    ) {
      return null;
    }

    const result = Object.create(null) as Record<string, unknown>;
    for (const key of expectedKeys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (
        descriptor === undefined ||
        !('value' in descriptor) ||
        descriptor.enumerable !== true
      ) {
        return null;
      }
      result[key] = descriptor.value;
    }
    return result;
  } catch {
    return null;
  }
}

function readExactDenseDataArray(
  value: unknown,
): readonly unknown[] | null {
  try {
    if (
      !Array.isArray(value) ||
      Object.getPrototypeOf(value) !== Array.prototype
    ) {
      return null;
    }
    const lengthDescriptor = Object.getOwnPropertyDescriptor(
      value,
      'length',
    );
    if (
      lengthDescriptor === undefined ||
      !('value' in lengthDescriptor) ||
      lengthDescriptor.enumerable !== false ||
      !Number.isSafeInteger(lengthDescriptor.value) ||
      lengthDescriptor.value < 0
    ) {
      return null;
    }
    const length = lengthDescriptor.value;
    const ownKeys = Reflect.ownKeys(value);
    if (ownKeys.length !== length + 1) return null;

    const result: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(
        value,
        String(index),
      );
      if (
        descriptor === undefined ||
        !('value' in descriptor) ||
        descriptor.enumerable !== true
      ) {
        return null;
      }
      Object.defineProperty(result, String(index), {
        configurable: true,
        enumerable: true,
        value: descriptor.value,
        writable: true,
      });
    }
    return result;
  } catch {
    return null;
  }
}

function neutral(pose: OutfitAvatarPose): OutfitAvatarTruth {
  return Object.freeze({
    pose,
    stateKey: `neutral:${pose}`,
    verifiedAssetPath: null,
    visibleGarmentIds: Object.freeze([]),
  });
}

function uniqueValidSlots(
  value: readonly AvatarVisibleSlot[],
): boolean {
  return (
    value.length > 0 &&
    value.every((slot) => VALID_SLOTS.has(slot)) &&
    new Set(value).size === value.length
  );
}

function validCoverage(value: AvatarVisualCoverage): boolean {
  const body = new Set(value.bodyCoverage);
  return (
    value.coverageVersion === 1 &&
    uniqueValidSlots(value.bodyCoverage) &&
    uniqueValidSlots(value.visibleSlots) &&
    Array.isArray(value.occludesSlots) &&
    value.occludesSlots.every((slot) => VALID_SLOTS.has(slot)) &&
    new Set(value.occludesSlots).size === value.occludesSlots.length &&
    value.visibleSlots.every((slot) => body.has(slot)) &&
    value.occludesSlots.every((slot) => body.has(slot)) &&
    Number.isFinite(value.visualLayerRank)
  );
}

function parseCoverage(value: unknown): AvatarVisualCoverage | null {
  const record = readExactPlainDataRecord(value, [
    'coverageVersion',
    'bodyCoverage',
    'visibleSlots',
    'visualLayerRank',
    'occludesSlots',
  ]);
  if (record === null) return null;

  const bodyCoverage = readExactDenseDataArray(record.bodyCoverage);
  const visibleSlots = readExactDenseDataArray(record.visibleSlots);
  const occludesSlots = readExactDenseDataArray(record.occludesSlots);
  if (
    bodyCoverage === null ||
    visibleSlots === null ||
    occludesSlots === null ||
    !bodyCoverage.every(
      (slot): slot is AvatarVisibleSlot =>
        typeof slot === 'string' &&
        VALID_SLOTS.has(slot as AvatarVisibleSlot),
    ) ||
    !visibleSlots.every(
      (slot): slot is AvatarVisibleSlot =>
        typeof slot === 'string' &&
        VALID_SLOTS.has(slot as AvatarVisibleSlot),
    ) ||
    !occludesSlots.every(
      (slot): slot is AvatarVisibleSlot =>
        typeof slot === 'string' &&
        VALID_SLOTS.has(slot as AvatarVisibleSlot),
    )
  ) {
    return null;
  }

  const coverage: AvatarVisualCoverage = {
    coverageVersion: record.coverageVersion as 1,
    bodyCoverage,
    visibleSlots,
    visualLayerRank: record.visualLayerRank as number,
    occludesSlots,
  };
  return validCoverage(coverage) ? coverage : null;
}

function parseResolverArgs(value: unknown): Readonly<{
  pose: OutfitAvatarPose;
  garments: readonly AvatarResolvableGarment[];
}> | null {
  const record = readExactPlainDataRecord(value, [
    'pose',
    'garments',
  ]);
  if (
    record === null ||
    (record.pose !== 'sitting' && record.pose !== 'standing')
  ) {
    return null;
  }
  const garmentValues = readExactDenseDataArray(record.garments);
  if (garmentValues === null) return null;

  const garments: AvatarResolvableGarment[] = [];
  for (const garmentValue of garmentValues) {
    const garment = readExactPlainDataRecord(garmentValue, [
      'itemId',
      'catalogGarmentId',
      'avatarCoverage',
    ]);
    if (
      garment === null ||
      typeof garment.itemId !== 'string' ||
      garment.itemId.length === 0 ||
      (garment.catalogGarmentId !== null &&
        typeof garment.catalogGarmentId !== 'string')
    ) {
      return null;
    }

    let avatarCoverage: AvatarVisualCoverage | null = null;
    if (garment.avatarCoverage !== null) {
      avatarCoverage = parseCoverage(garment.avatarCoverage);
      if (avatarCoverage === null) return null;
    }
    garments.push({
      itemId: garment.itemId as OutfitItemId,
      catalogGarmentId: garment.catalogGarmentId,
      avatarCoverage,
    });
  }
  return {
    pose: record.pose,
    garments,
  };
}

function neutralPose(value: unknown): OutfitAvatarPose {
  try {
    if (value !== null && typeof value === 'object') {
      const descriptor = Object.getOwnPropertyDescriptor(value, 'pose');
      if (
        descriptor !== undefined &&
        'value' in descriptor &&
        (descriptor.value === 'sitting' ||
          descriptor.value === 'standing')
      ) {
        return descriptor.value;
      }
    }
  } catch {
    // Invalid graph: use the stable neutral fallback below.
  }
  return 'standing';
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return rightSet.size === right.length && left.every((item) => rightSet.has(item));
}

export function resolveOutfitAvatarTruth(args: Readonly<{
  pose: OutfitAvatarPose;
  garments: readonly AvatarResolvableGarment[];
}>): OutfitAvatarTruth {
  const parsed = parseResolverArgs(args);
  if (parsed === null) return neutral(neutralPose(args));
  const { pose, garments } = parsed;
  if (
    garments.length === 0 ||
    new Set(garments.map((garment) => garment.itemId)).size !==
      garments.length
  ) {
    return neutral(pose);
  }

  for (const garment of garments) {
    if (
      garment.catalogGarmentId === null ||
      garment.catalogGarmentId.length === 0 ||
      garment.avatarCoverage === null ||
      !validCoverage(garment.avatarCoverage)
    ) {
      return neutral(pose);
    }
  }

  const winningSlots = new Map<AvatarVisibleSlot, OutfitItemId>();
  for (const slot of VALID_SLOTS) {
    const candidates = garments.filter((garment) =>
      garment.avatarCoverage!.visibleSlots.includes(slot),
    );
    if (candidates.length === 0) continue;

    const highestRank = Math.max(
      ...candidates.map(
        (garment) => garment.avatarCoverage!.visualLayerRank,
      ),
    );
    const winners = candidates.filter(
      (garment) =>
        garment.avatarCoverage!.visualLayerRank === highestRank,
    );
    if (winners.length !== 1) return neutral(pose);

    const winner = winners[0]!;
    const hidden = candidates.filter(
      (candidate) => candidate.itemId !== winner.itemId,
    );
    if (
      hidden.some(
        () => !winner.avatarCoverage!.occludesSlots.includes(slot),
      )
    ) {
      return neutral(pose);
    }
    winningSlots.set(slot, winner.itemId);
  }

  const visibleIds = new Set(winningSlots.values());
  const visibleGarments = garments.filter((garment) =>
    visibleIds.has(garment.itemId),
  );
  if (visibleGarments.length === 0) return neutral(pose);

  const catalogIds = visibleGarments.map(
    (garment) => garment.catalogGarmentId!,
  );
  if (new Set(catalogIds).size !== catalogIds.length) {
    return neutral(pose);
  }

  const matches = MANIFEST.filter(
    (row) => row.pose === pose && sameSet(row.garments, catalogIds),
  );
  if (matches.length !== 1) return neutral(pose);

  const match = matches[0]!;
  return Object.freeze({
    pose,
    stateKey: match.name,
    verifiedAssetPath: match.asset,
    visibleGarmentIds: Object.freeze(
      visibleGarments.map((garment) => garment.itemId),
    ),
  });
}
