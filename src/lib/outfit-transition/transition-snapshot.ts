const MAX_TRANSITION_ITEMS = 10;

const IDENTITY_KEYS = [
  'snapshotId',
  'recommendationFingerprint',
  'transitionContextId',
] as const;

const VIEWPORT_KEYS = [
  'width',
  'height',
  'scrollX',
  'scrollY',
  'orientation',
] as const;

const RECTANGLE_KEYS = ['x', 'y', 'width', 'height'] as const;

export type TransitionIdentity = Readonly<{
  snapshotId: string;
  recommendationFingerprint: string;
  transitionContextId: string;
}>;

export type TransitionViewport = Readonly<{
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
  orientation: 'portrait' | 'landscape';
}>;

export type TransitionRectangle = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type TransitionSnapshotItem = Readonly<{
  itemId: string;
  rect: TransitionRectangle;
}>;

export type TransitionSnapshot = Readonly<{
  identity: TransitionIdentity;
  viewport: TransitionViewport;
  items: readonly TransitionSnapshotItem[];
}>;

export type TransitionSnapshotInput = Readonly<{
  identity: unknown;
  viewport: unknown;
  orderedItemIds: unknown;
  rectanglesByItemId: unknown;
}>;

export type TransitionSnapshotRejectionReason =
  | 'invalid-input'
  | 'invalid-identity'
  | 'invalid-viewport'
  | 'invalid-item-order'
  | 'empty-item-set'
  | 'unsupported-item-count'
  | 'invalid-item-id'
  | 'duplicate-item-id'
  | 'invalid-rectangle-map'
  | 'missing-rectangle'
  | 'unexpected-rectangle'
  | 'invalid-rectangle';

export type TransitionSnapshotResult =
  | Readonly<{
      kind: 'captured';
      snapshot: TransitionSnapshot;
    }>
  | Readonly<{
      kind: 'rejected';
      reason: TransitionSnapshotRejectionReason;
      itemId?: string;
    }>;

type PlainRecord = Readonly<Record<PropertyKey, unknown>>;

function isPlainRecord(value: unknown): value is PlainRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  try {
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  } catch {
    return false;
  }
}

function hasExactOwnDataKeys(
  value: PlainRecord,
  expectedKeys: readonly string[],
): boolean {
  try {
    const ownKeys = Reflect.ownKeys(value);
    if (
      ownKeys.length !== expectedKeys.length ||
      ownKeys.some(
        (key) => typeof key !== 'string' || !expectedKeys.includes(key),
      )
    ) {
      return false;
    }

    return expectedKeys.every((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      return (
        descriptor !== undefined &&
        Object.hasOwn(descriptor, 'value') &&
        descriptor.enumerable === true
      );
    });
  } catch {
    return false;
  }
}

function ownDataValue(value: PlainRecord, key: string): unknown {
  return Object.getOwnPropertyDescriptor(value, key)?.value;
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function createTransitionIdentity(
  input: unknown,
): TransitionIdentity | null {
  try {
    if (
      !isPlainRecord(input) ||
      !hasExactOwnDataKeys(input, IDENTITY_KEYS)
    ) {
      return null;
    }

    const snapshotId = ownDataValue(input, 'snapshotId');
    const recommendationFingerprint = ownDataValue(
      input,
      'recommendationFingerprint',
    );
    const transitionContextId = ownDataValue(input, 'transitionContextId');

    if (
      !isNonBlankString(snapshotId) ||
      !isNonBlankString(recommendationFingerprint) ||
      !isNonBlankString(transitionContextId)
    ) {
      return null;
    }

    return Object.freeze({
      snapshotId,
      recommendationFingerprint,
      transitionContextId,
    });
  } catch {
    return null;
  }
}

export function createTransitionViewport(
  input: unknown,
): TransitionViewport | null {
  try {
    if (
      !isPlainRecord(input) ||
      !hasExactOwnDataKeys(input, VIEWPORT_KEYS)
    ) {
      return null;
    }

    const width = ownDataValue(input, 'width');
    const height = ownDataValue(input, 'height');
    const scrollX = ownDataValue(input, 'scrollX');
    const scrollY = ownDataValue(input, 'scrollY');
    const orientation = ownDataValue(input, 'orientation');

    if (
      !isFiniteNumber(width) ||
      width <= 0 ||
      !isFiniteNumber(height) ||
      height <= 0 ||
      !isFiniteNumber(scrollX) ||
      !isFiniteNumber(scrollY) ||
      (orientation !== 'portrait' && orientation !== 'landscape')
    ) {
      return null;
    }

    return Object.freeze({
      width,
      height,
      scrollX,
      scrollY,
      orientation,
    });
  } catch {
    return null;
  }
}

export function createTransitionRectangle(
  input: unknown,
): TransitionRectangle | null {
  try {
    if (
      !isPlainRecord(input) ||
      !hasExactOwnDataKeys(input, RECTANGLE_KEYS)
    ) {
      return null;
    }

    const x = ownDataValue(input, 'x');
    const y = ownDataValue(input, 'y');
    const width = ownDataValue(input, 'width');
    const height = ownDataValue(input, 'height');

    if (
      !isFiniteNumber(x) ||
      !isFiniteNumber(y) ||
      !isFiniteNumber(width) ||
      width <= 0 ||
      !isFiniteNumber(height) ||
      height <= 0
    ) {
      return null;
    }

    return Object.freeze({ x, y, width, height });
  } catch {
    return null;
  }
}

function rejection(
  reason: TransitionSnapshotRejectionReason,
  itemId?: string,
): TransitionSnapshotResult {
  return itemId === undefined
    ? Object.freeze({ kind: 'rejected', reason })
    : Object.freeze({ kind: 'rejected', reason, itemId });
}

function readOrderedItemIds(
  input: unknown,
):
  | Readonly<{ kind: 'accepted'; itemIds: readonly string[] }>
  | Readonly<{
      kind: 'rejected';
      reason:
        | 'invalid-item-order'
        | 'empty-item-set'
        | 'unsupported-item-count'
        | 'invalid-item-id'
        | 'duplicate-item-id';
      itemId?: string;
    }> {
  try {
    if (!Array.isArray(input) || Object.getPrototypeOf(input) !== Array.prototype) {
      return { kind: 'rejected', reason: 'invalid-item-order' };
    }

    if (input.length === 0) {
      return { kind: 'rejected', reason: 'empty-item-set' };
    }

    if (input.length > MAX_TRANSITION_ITEMS) {
      return { kind: 'rejected', reason: 'unsupported-item-count' };
    }

    const expectedKeys = [
      ...Array.from({ length: input.length }, (_, index) => String(index)),
      'length',
    ];
    const ownKeys = Reflect.ownKeys(input);
    if (
      ownKeys.length !== expectedKeys.length ||
      ownKeys.some(
        (key) => typeof key !== 'string' || !expectedKeys.includes(key),
      )
    ) {
      return { kind: 'rejected', reason: 'invalid-item-order' };
    }

    const itemIds: string[] = [];
    const seen = new Set<string>();

    for (let index = 0; index < input.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(input, String(index));
      if (
        descriptor === undefined ||
        !Object.hasOwn(descriptor, 'value') ||
        descriptor.enumerable !== true
      ) {
        return { kind: 'rejected', reason: 'invalid-item-order' };
      }

      const itemId = descriptor.value;
      if (!isNonBlankString(itemId)) {
        return { kind: 'rejected', reason: 'invalid-item-id' };
      }

      if (seen.has(itemId)) {
        return { kind: 'rejected', reason: 'duplicate-item-id', itemId };
      }

      seen.add(itemId);
      itemIds.push(itemId);
    }

    return {
      kind: 'accepted',
      itemIds: Object.freeze(itemIds),
    };
  } catch {
    return { kind: 'rejected', reason: 'invalid-item-order' };
  }
}

function isNativeRectangleMap(
  input: unknown,
): input is ReadonlyMap<unknown, unknown> {
  try {
    return (
      typeof input === 'object' &&
      input !== null &&
      Object.getPrototypeOf(input) === Map.prototype &&
      Reflect.ownKeys(input).length === 0
    );
  } catch {
    return false;
  }
}

export function createTransitionSnapshot(
  input: unknown,
): TransitionSnapshotResult {
  try {
    if (
      !isPlainRecord(input) ||
      !hasExactOwnDataKeys(input, [
        'identity',
        'viewport',
        'orderedItemIds',
        'rectanglesByItemId',
      ])
    ) {
      return rejection('invalid-input');
    }

    const identity = createTransitionIdentity(ownDataValue(input, 'identity'));
    if (identity === null) {
      return rejection('invalid-identity');
    }

    const viewport = createTransitionViewport(ownDataValue(input, 'viewport'));
    if (viewport === null) {
      return rejection('invalid-viewport');
    }

    const orderedItemsResult = readOrderedItemIds(
      ownDataValue(input, 'orderedItemIds'),
    );
    if (orderedItemsResult.kind === 'rejected') {
      return rejection(
        orderedItemsResult.reason,
        orderedItemsResult.itemId,
      );
    }

    const rectangleMap = ownDataValue(input, 'rectanglesByItemId');
    if (!isNativeRectangleMap(rectangleMap)) {
      return rejection('invalid-rectangle-map');
    }

    const mapSize = Reflect.get(Map.prototype, 'size', rectangleMap) as number;
    if (mapSize > MAX_TRANSITION_ITEMS) {
      return rejection('invalid-rectangle-map');
    }

    for (const itemId of orderedItemsResult.itemIds) {
      if (!Map.prototype.has.call(rectangleMap, itemId)) {
        return rejection('missing-rectangle', itemId);
      }
    }

    for (const [itemId] of Map.prototype.entries.call(rectangleMap) as Iterable<
      [unknown, unknown]
    >) {
      if (
        typeof itemId !== 'string' ||
        !orderedItemsResult.itemIds.includes(itemId)
      ) {
        return typeof itemId === 'string'
          ? rejection('unexpected-rectangle', itemId)
          : rejection('invalid-rectangle-map');
      }
    }

    const items: TransitionSnapshotItem[] = [];
    for (const itemId of orderedItemsResult.itemIds) {
      const rectangle = createTransitionRectangle(
        Map.prototype.get.call(rectangleMap, itemId),
      );
      if (rectangle === null) {
        return rejection('invalid-rectangle', itemId);
      }

      items.push(Object.freeze({ itemId, rect: rectangle }));
    }

    const snapshot: TransitionSnapshot = Object.freeze({
      identity,
      viewport,
      items: Object.freeze(items),
    });

    return Object.freeze({
      kind: 'captured',
      snapshot,
    });
  } catch {
    return rejection('invalid-input');
  }
}
