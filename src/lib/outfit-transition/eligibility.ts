import {
  createTransitionIdentity,
  createTransitionRectangle,
  createTransitionViewport,
  type TransitionIdentity,
  type TransitionRectangle,
  type TransitionViewport,
} from './transition-snapshot.js';

const MAX_TRANSITION_ITEMS = 10;

const CANDIDATE_KEYS = [
  'expectedIdentity',
  'expectedItemIds',
  'sourceSnapshot',
  'targetSnapshot',
  'currentViewport',
  'motion',
  'documentVisibility',
  'lifecycle',
] as const;

const SNAPSHOT_KEYS = ['identity', 'viewport', 'items'] as const;
const SNAPSHOT_ITEM_KEYS = ['itemId', 'rect'] as const;

export type EligibleTransitionItem = Readonly<{
  itemId: string;
  sourceRect: TransitionRectangle;
  targetRect: TransitionRectangle;
}>;

export type EligibleTransitionSnapshot = Readonly<{
  identity: TransitionIdentity;
  viewport: TransitionViewport;
  items: readonly EligibleTransitionItem[];
}>;

export type TransitionStaticReason =
  | 'invalid-input'
  | 'motion-reduced'
  | 'document-hidden'
  | 'lifecycle-aborted'
  | 'invalid-identity'
  | 'empty-item-set'
  | 'invalid-expected-items'
  | 'invalid-viewport'
  | 'invalid-source-snapshot'
  | 'invalid-source-items'
  | 'invalid-source-geometry'
  | 'invalid-target-snapshot'
  | 'invalid-target-items'
  | 'invalid-target-geometry'
  | 'identity-mismatch'
  | 'item-set-mismatch'
  | 'viewport-changed';

export type TransitionEligibilityDecision =
  | Readonly<{
      kind: 'animate';
      snapshot: EligibleTransitionSnapshot;
    }>
  | Readonly<{
      kind: 'settle-static';
      reason: TransitionStaticReason;
    }>;

type PlainRecord = Readonly<Record<PropertyKey, unknown>>;

type ValidatedSnapshot = Readonly<{
  identity: TransitionIdentity;
  viewport: TransitionViewport;
  items: readonly Readonly<{
    itemId: string;
    rect: TransitionRectangle;
  }>[];
}>;

type SnapshotValidationResult =
  | Readonly<{ kind: 'valid'; snapshot: ValidatedSnapshot }>
  | Readonly<{
      kind: 'invalid';
      part: 'snapshot' | 'items' | 'geometry';
    }>;

type ItemIdValidationResult =
  | Readonly<{ kind: 'valid'; itemIds: readonly string[] }>
  | Readonly<{
      kind: 'invalid';
      reason: 'empty-item-set' | 'invalid-expected-items';
    }>;

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

function readDenseArray(input: unknown): readonly unknown[] | null {
  try {
    if (!Array.isArray(input) || Object.getPrototypeOf(input) !== Array.prototype) {
      return null;
    }

    if (input.length > MAX_TRANSITION_ITEMS) {
      return null;
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
      return null;
    }

    const values: unknown[] = [];
    for (let index = 0; index < input.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(input, String(index));
      if (
        descriptor === undefined ||
        !Object.hasOwn(descriptor, 'value') ||
        descriptor.enumerable !== true
      ) {
        return null;
      }
      values.push(descriptor.value);
    }

    return values;
  } catch {
    return null;
  }
}

function validateExpectedItemIds(input: unknown): ItemIdValidationResult {
  const values = readDenseArray(input);
  if (values === null) {
    return { kind: 'invalid', reason: 'invalid-expected-items' };
  }

  if (values.length === 0) {
    return { kind: 'invalid', reason: 'empty-item-set' };
  }

  const itemIds: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (
      typeof value !== 'string' ||
      value.trim().length === 0 ||
      seen.has(value)
    ) {
      return { kind: 'invalid', reason: 'invalid-expected-items' };
    }

    seen.add(value);
    itemIds.push(value);
  }

  return {
    kind: 'valid',
    itemIds: Object.freeze(itemIds),
  };
}

function validateSnapshot(input: unknown): SnapshotValidationResult {
  try {
    if (
      !isPlainRecord(input) ||
      !hasExactOwnDataKeys(input, SNAPSHOT_KEYS)
    ) {
      return { kind: 'invalid', part: 'snapshot' };
    }

    const identity = createTransitionIdentity(ownDataValue(input, 'identity'));
    const viewport = createTransitionViewport(ownDataValue(input, 'viewport'));
    if (identity === null || viewport === null) {
      return { kind: 'invalid', part: 'snapshot' };
    }

    const itemValues = readDenseArray(ownDataValue(input, 'items'));
    if (
      itemValues === null ||
      itemValues.length === 0 ||
      itemValues.length > MAX_TRANSITION_ITEMS
    ) {
      return { kind: 'invalid', part: 'items' };
    }

    const items: Array<
      Readonly<{ itemId: string; rect: TransitionRectangle }>
    > = [];
    const seen = new Set<string>();

    for (const itemValue of itemValues) {
      if (
        !isPlainRecord(itemValue) ||
        !hasExactOwnDataKeys(itemValue, SNAPSHOT_ITEM_KEYS)
      ) {
        return { kind: 'invalid', part: 'geometry' };
      }

      const itemId = ownDataValue(itemValue, 'itemId');
      if (
        typeof itemId !== 'string' ||
        itemId.trim().length === 0 ||
        seen.has(itemId)
      ) {
        return { kind: 'invalid', part: 'items' };
      }

      const rect = createTransitionRectangle(ownDataValue(itemValue, 'rect'));
      if (rect === null) {
        return { kind: 'invalid', part: 'geometry' };
      }

      seen.add(itemId);
      items.push(Object.freeze({ itemId, rect }));
    }

    return {
      kind: 'valid',
      snapshot: Object.freeze({
        identity,
        viewport,
        items: Object.freeze(items),
      }),
    };
  } catch {
    return { kind: 'invalid', part: 'snapshot' };
  }
}

function sameIdentity(
  left: TransitionIdentity,
  right: TransitionIdentity,
): boolean {
  return (
    left.snapshotId === right.snapshotId &&
    left.recommendationFingerprint === right.recommendationFingerprint &&
    left.transitionContextId === right.transitionContextId
  );
}

function sameViewport(
  left: TransitionViewport,
  right: TransitionViewport,
): boolean {
  return (
    left.width === right.width &&
    left.height === right.height &&
    left.scrollX === right.scrollX &&
    left.scrollY === right.scrollY &&
    left.orientation === right.orientation
  );
}

function sameItemSet(
  expectedItemIds: readonly string[],
  actualItems: ValidatedSnapshot['items'],
): boolean {
  if (expectedItemIds.length !== actualItems.length) {
    return false;
  }

  const expected = new Set(expectedItemIds);
  return actualItems.every((item) => expected.has(item.itemId));
}

function settleStatic(
  reason: TransitionStaticReason,
): TransitionEligibilityDecision {
  return Object.freeze({ kind: 'settle-static', reason });
}

function invalidSnapshotDecision(
  side: 'source' | 'target',
  part: 'snapshot' | 'items' | 'geometry',
): TransitionEligibilityDecision {
  const reason = `invalid-${side}-${part}` as TransitionStaticReason;
  return settleStatic(reason);
}

export function decideTransitionEligibility(
  input: unknown,
): TransitionEligibilityDecision {
  try {
    if (
      !isPlainRecord(input) ||
      !hasExactOwnDataKeys(input, CANDIDATE_KEYS)
    ) {
      return settleStatic('invalid-input');
    }

    const motion = ownDataValue(input, 'motion');
    const documentVisibility = ownDataValue(input, 'documentVisibility');
    const lifecycle = ownDataValue(input, 'lifecycle');

    if (motion !== 'allowed' && motion !== 'reduced') {
      return settleStatic('invalid-input');
    }
    if (documentVisibility !== 'visible' && documentVisibility !== 'hidden') {
      return settleStatic('invalid-input');
    }
    if (lifecycle !== 'active' && lifecycle !== 'aborted') {
      return settleStatic('invalid-input');
    }

    if (motion === 'reduced') {
      return settleStatic('motion-reduced');
    }
    if (documentVisibility === 'hidden') {
      return settleStatic('document-hidden');
    }
    if (lifecycle === 'aborted') {
      return settleStatic('lifecycle-aborted');
    }

    const expectedIdentity = createTransitionIdentity(
      ownDataValue(input, 'expectedIdentity'),
    );
    if (expectedIdentity === null) {
      return settleStatic('invalid-identity');
    }

    const expectedItems = validateExpectedItemIds(
      ownDataValue(input, 'expectedItemIds'),
    );
    if (expectedItems.kind === 'invalid') {
      return settleStatic(expectedItems.reason);
    }

    const currentViewport = createTransitionViewport(
      ownDataValue(input, 'currentViewport'),
    );
    if (currentViewport === null) {
      return settleStatic('invalid-viewport');
    }

    const sourceResult = validateSnapshot(
      ownDataValue(input, 'sourceSnapshot'),
    );
    if (sourceResult.kind === 'invalid') {
      return invalidSnapshotDecision('source', sourceResult.part);
    }

    const targetResult = validateSnapshot(
      ownDataValue(input, 'targetSnapshot'),
    );
    if (targetResult.kind === 'invalid') {
      return invalidSnapshotDecision('target', targetResult.part);
    }

    if (
      !sameIdentity(expectedIdentity, sourceResult.snapshot.identity) ||
      !sameIdentity(expectedIdentity, targetResult.snapshot.identity)
    ) {
      return settleStatic('identity-mismatch');
    }

    if (
      !sameItemSet(expectedItems.itemIds, sourceResult.snapshot.items) ||
      !sameItemSet(expectedItems.itemIds, targetResult.snapshot.items)
    ) {
      return settleStatic('item-set-mismatch');
    }

    if (
      !sameViewport(currentViewport, sourceResult.snapshot.viewport) ||
      !sameViewport(currentViewport, targetResult.snapshot.viewport)
    ) {
      return settleStatic('viewport-changed');
    }

    const targetRectByItemId = new Map(
      targetResult.snapshot.items.map((item) => [item.itemId, item.rect]),
    );
    const items = sourceResult.snapshot.items.map((sourceItem) =>
      Object.freeze({
        itemId: sourceItem.itemId,
        sourceRect: sourceItem.rect,
        targetRect: targetRectByItemId.get(sourceItem.itemId)!,
      }),
    );

    const snapshot: EligibleTransitionSnapshot = Object.freeze({
      identity: expectedIdentity,
      viewport: currentViewport,
      items: Object.freeze(items),
    });

    return Object.freeze({
      kind: 'animate',
      snapshot,
    });
  } catch {
    return settleStatic('invalid-input');
  }
}
