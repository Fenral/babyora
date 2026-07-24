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

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return rightSet.size === right.length && left.every((item) => rightSet.has(item));
}

export function resolveOutfitAvatarTruth(args: Readonly<{
  pose: OutfitAvatarPose;
  garments: readonly AvatarResolvableGarment[];
}>): OutfitAvatarTruth {
  const { pose, garments } = args;
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
