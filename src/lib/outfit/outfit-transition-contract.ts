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

function readIdentity(
  value: unknown,
): OutfitTransitionIdentityV1 | null {
  const record = readExactPlainDataRecord(value, [
    'snapshotId',
    'recommendationFingerprint',
    'transitionContextId',
  ]);
  if (
    record === null ||
    typeof record.snapshotId !== 'string' ||
    typeof record.recommendationFingerprint !== 'string' ||
    typeof record.transitionContextId !== 'string'
  ) {
    return null;
  }
  return {
    snapshotId: record.snapshotId,
    recommendationFingerprint: record.recommendationFingerprint,
    transitionContextId: record.transitionContextId,
  };
}

function readTargetRows(
  value: unknown,
): readonly Readonly<{
  itemId: OutfitItemId;
  element: unknown;
}>[] | null {
  const rowValues = readExactDenseDataArray(value);
  if (rowValues === null) return null;

  const rows: Readonly<{
    itemId: OutfitItemId;
    element: unknown;
  }>[] = [];
  for (const rowValue of rowValues) {
    const row = readExactPlainDataRecord(rowValue, [
      'itemId',
      'element',
    ]);
    if (
      row === null ||
      typeof row.itemId !== 'string' ||
      row.itemId.length === 0
    ) {
      return null;
    }
    rows.push({
      itemId: row.itemId as OutfitItemId,
      element: row.element,
    });
  }
  return rows;
}

function isConnectedElement(value: unknown): value is HTMLElement {
  try {
    return (
      typeof Element !== 'undefined' &&
      value instanceof Element &&
      value.isConnected === true
    );
  } catch {
    return false;
  }
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
  const root = readExactPlainDataRecord(args, [
    'truth',
    'expectedIdentity',
    'targetRows',
    'reducedMotion',
  ]);
  if (root === null || typeof root.reducedMotion !== 'boolean') {
    return staticOnly('invalid-snapshot');
  }
  if (root.reducedMotion) {
    return staticOnly('reduced-motion');
  }

  const unsupportedTruth = readExactPlainDataRecord(root.truth, [
    'kind',
    'reason',
    'orderedGarments',
    'equipment',
  ]);
  if (
    unsupportedTruth !== null &&
    unsupportedTruth.kind === 'unsupported-cardinality' &&
    unsupportedTruth.reason ===
      'semantic-garment-count-outside-1-10'
  ) {
    return staticOnly('unsupported-cardinality');
  }

  const supportedTruth = readExactPlainDataRecord(root.truth, [
    'kind',
    'snapshot',
  ]);
  if (supportedTruth === null || supportedTruth.kind !== 'supported') {
    return staticOnly('invalid-snapshot');
  }
  const snapshot = supportedTruth.snapshot;
  if (!isOutfitTruthSnapshot(snapshot)) {
    return staticOnly('invalid-snapshot');
  }

  const expectedIdentity = readIdentity(root.expectedIdentity);
  if (expectedIdentity === null) {
    return staticOnly('identity-mismatch');
  }
  const parsedTargetRows = readTargetRows(root.targetRows);
  if (parsedTargetRows === null) {
    return staticOnly('stale-target-row');
  }
  if (
    expectedIdentity.snapshotId !== snapshot.snapshotId ||
    expectedIdentity.recommendationFingerprint !==
      snapshot.recommendationFingerprint ||
    expectedIdentity.transitionContextId !==
      snapshot.transitionContextId
  ) {
    return staticOnly('identity-mismatch');
  }

  const expectedIds = new Set(
    snapshot.garments.map((garment) => garment.itemId),
  );
  const rowsByItem = new Map<OutfitItemId, OutfitRowRegistrationV1[]>();
  for (const row of parsedTargetRows) {
    if (
      !expectedIds.has(row.itemId) ||
      !isConnectedElement(row.element)
    ) {
      return staticOnly('stale-target-row', row.itemId);
    }
    const existing = rowsByItem.get(row.itemId);
    const registration: OutfitRowRegistrationV1 = {
      itemId: row.itemId,
      element: row.element,
    };
    if (existing === undefined) {
      rowsByItem.set(row.itemId, [registration]);
    } else {
      existing.push(registration);
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
