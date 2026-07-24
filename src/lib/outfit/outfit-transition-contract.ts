import {
  isOutfitTruthSnapshot,
  type OutfitItemId,
  type OutfitSnapshotId,
  type OutfitTruthBuildResultV1,
} from './outfit-truth.js';

export type RegisterOutfitRow = (
  itemId: OutfitItemId,
  element: HTMLElement | null,
) => void;

export type OutfitTransitionVisualState = 'settled' | 'landing';

export type OutfitTransitionIdentityV1 = Readonly<{
  snapshotId: OutfitSnapshotId | string;
  recommendationFingerprint: string;
  transitionContextId: string;
}>;

export type OutfitRowRegistrationV1 = Readonly<{
  itemId: OutfitItemId;
  element: HTMLElement;
}>;

export type OutfitRowRegistrationRegistryV1 = Readonly<{
  registerOutfitRow: RegisterOutfitRow;
  read: () => readonly OutfitRowRegistrationV1[];
  clear: () => void;
}>;

export type OutfitTargetReadinessReason =
  | 'unsupported-cardinality'
  | 'reduced-motion'
  | 'invalid-snapshot'
  | 'identity-mismatch'
  | 'missing-target-row'
  | 'duplicate-target-row'
  | 'stale-target-row';

export type OutfitTargetReadinessV1 =
  | Readonly<{
      kind: 'ready';
      snapshotId: OutfitSnapshotId;
      recommendationFingerprint: string;
      transitionContextId: string;
      targetRows: readonly OutfitRowRegistrationV1[];
    }>
  | Readonly<{
      kind: 'static-only';
      reason: OutfitTargetReadinessReason;
      itemId?: OutfitItemId;
    }>;

export function createOutfitRowRegistrationRegistry(): OutfitRowRegistrationRegistryV1 {
  const elementsByItem = new Map<OutfitItemId, HTMLElement[]>();

  const registerOutfitRow: RegisterOutfitRow = (itemId, element) => {
    if (element === null) {
      elementsByItem.delete(itemId);
      return;
    }
    const existing = elementsByItem.get(itemId);
    if (existing === undefined) {
      elementsByItem.set(itemId, [element]);
      return;
    }
    if (!existing.includes(element)) {
      existing.push(element);
    }
  };

  const read = (): readonly OutfitRowRegistrationV1[] =>
    Object.freeze(
      [...elementsByItem.entries()].flatMap(([itemId, elements]) =>
        elements.map((element) =>
          Object.freeze({
            itemId,
            element,
          }),
        ),
      ),
    );

  return Object.freeze({
    registerOutfitRow,
    read,
    clear: () => elementsByItem.clear(),
  });
}

function staticOnly(
  reason: OutfitTargetReadinessReason,
  itemId?: OutfitItemId,
): OutfitTargetReadinessV1 {
  return Object.freeze({
    kind: 'static-only',
    reason,
    ...(itemId === undefined ? {} : { itemId }),
  });
}

/**
 * D-08 Phase-2 boundary: validates only canonical identity and real Outfit
 * target-row registration. Home sources and combined geometry readiness remain
 * Phase-3-owned and must not be introduced through this module.
 */
export function evaluateOutfitTargetReadiness(args: Readonly<{
  truth: OutfitTruthBuildResultV1;
  expectedIdentity: OutfitTransitionIdentityV1;
  targetRows: readonly OutfitRowRegistrationV1[];
  reducedMotion: boolean;
}>): OutfitTargetReadinessV1 {
  if (args.reducedMotion) {
    return staticOnly('reduced-motion');
  }
  if (args.truth.kind === 'unsupported-cardinality') {
    return staticOnly('unsupported-cardinality');
  }

  const { snapshot } = args.truth;
  if (!isOutfitTruthSnapshot(snapshot)) {
    return staticOnly('invalid-snapshot');
  }
  if (
    args.expectedIdentity.snapshotId !== snapshot.snapshotId ||
    args.expectedIdentity.recommendationFingerprint !==
      snapshot.recommendationFingerprint ||
    args.expectedIdentity.transitionContextId !==
      snapshot.transitionContextId
  ) {
    return staticOnly('identity-mismatch');
  }

  const expectedIds = new Set(
    snapshot.garments.map((garment) => garment.itemId),
  );
  const rowsByItem = new Map<OutfitItemId, OutfitRowRegistrationV1[]>();
  for (const row of args.targetRows) {
    if (
      !expectedIds.has(row.itemId) ||
      row.element === null ||
      row.element === undefined ||
      row.element.isConnected === false
    ) {
      return staticOnly('stale-target-row', row.itemId);
    }
    const existing = rowsByItem.get(row.itemId);
    if (existing === undefined) {
      rowsByItem.set(row.itemId, [row]);
    } else {
      existing.push(row);
    }
  }

  for (const garment of snapshot.garments) {
    const rows = rowsByItem.get(garment.itemId);
    if (rows === undefined || rows.length === 0) {
      return staticOnly('missing-target-row', garment.itemId);
    }
    if (rows.length !== 1) {
      return staticOnly('duplicate-target-row', garment.itemId);
    }
  }

  const targetRows = Object.freeze(
    snapshot.garments.map((garment) => {
      const row = rowsByItem.get(garment.itemId)![0]!;
      return Object.freeze({
        itemId: row.itemId,
        element: row.element,
      });
    }),
  );
  return Object.freeze({
    kind: 'ready',
    snapshotId: snapshot.snapshotId,
    recommendationFingerprint: snapshot.recommendationFingerprint,
    transitionContextId: snapshot.transitionContextId,
    targetRows,
  });
}
