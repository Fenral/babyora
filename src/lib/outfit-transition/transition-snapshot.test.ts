import { describe, expect, it } from 'vitest';
import { createTransitionSnapshot } from './transition-snapshot.js';

const identity = {
  snapshotId: 'snapshot-1',
  recommendationFingerprint: 'recommendation-1',
  transitionContextId: 'context-1',
} as const;

const viewport = {
  width: 390,
  height: 844,
  scrollX: 0,
  scrollY: 128,
  orientation: 'portrait',
} as const;

function createValidInput() {
  const orderedItemIds = ['base-layer', 'outer-layer'];
  const baseRect = { x: 12, y: 24, width: 80, height: 96 };
  const outerRect = { x: 104, y: 28, width: 88, height: 104 };
  const mutableIdentity: {
    snapshotId: string;
    recommendationFingerprint: string;
    transitionContextId: string;
  } = { ...identity };
  const mutableViewport: {
    width: number;
    height: number;
    scrollX: number;
    scrollY: number;
    orientation: 'portrait' | 'landscape';
  } = { ...viewport };
  const rectanglesByItemId = new Map([
    ['base-layer', baseRect],
    ['outer-layer', outerRect],
  ]);

  return {
    input: {
      identity: mutableIdentity,
      viewport: mutableViewport,
      orderedItemIds,
      rectanglesByItemId,
    },
    orderedItemIds,
    rectanglesByItemId,
    baseRect,
    outerRect,
  };
}

describe('createTransitionSnapshot', () => {
  it('captures exact identity, viewport facts, and ordered finite geometry', () => {
    const { input } = createValidInput();

    expect(createTransitionSnapshot(input)).toEqual({
      kind: 'captured',
      snapshot: {
        identity,
        viewport,
        items: [
          {
            itemId: 'base-layer',
            rect: { x: 12, y: 24, width: 80, height: 96 },
          },
          {
            itemId: 'outer-layer',
            rect: { x: 104, y: 28, width: 88, height: 104 },
          },
        ],
      },
    });
  });

  it('deep-copies and freezes every completed capture layer', () => {
    const {
      input,
      orderedItemIds,
      rectanglesByItemId,
      baseRect,
      outerRect,
    } = createValidInput();
    const result = createTransitionSnapshot(input);

    expect(result.kind).toBe('captured');
    if (result.kind !== 'captured') {
      throw new Error('expected a captured transition snapshot');
    }

    orderedItemIds.reverse();
    rectanglesByItemId.delete('outer-layer');
    rectanglesByItemId.set('replacement', {
      x: 1,
      y: 1,
      width: 1,
      height: 1,
    });
    baseRect.width = 999;
    outerRect.x = 999;
    input.identity.snapshotId = 'mutated';
    input.viewport.scrollY = 999;

    expect(result.snapshot).toEqual({
      identity,
      viewport,
      items: [
        {
          itemId: 'base-layer',
          rect: { x: 12, y: 24, width: 80, height: 96 },
        },
        {
          itemId: 'outer-layer',
          rect: { x: 104, y: 28, width: 88, height: 104 },
        },
      ],
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.snapshot)).toBe(true);
    expect(Object.isFrozen(result.snapshot.identity)).toBe(true);
    expect(Object.isFrozen(result.snapshot.viewport)).toBe(true);
    expect(Object.isFrozen(result.snapshot.items)).toBe(true);
    expect(Object.isFrozen(result.snapshot.items[0])).toBe(true);
    expect(Object.isFrozen(result.snapshot.items[0]?.rect)).toBe(true);
  });

  it('returns a plain, dense, serializable data graph', () => {
    const { input } = createValidInput();
    const result = createTransitionSnapshot(input);

    expect(result.kind).toBe('captured');
    if (result.kind !== 'captured') {
      throw new Error('expected a captured transition snapshot');
    }

    expect(Object.getPrototypeOf(result.snapshot)).toBe(Object.prototype);
    expect(Object.getPrototypeOf(result.snapshot.identity)).toBe(
      Object.prototype,
    );
    expect(Object.getPrototypeOf(result.snapshot.viewport)).toBe(
      Object.prototype,
    );
    expect(Object.getPrototypeOf(result.snapshot.items[0]?.rect)).toBe(
      Object.prototype,
    );
    expect(Object.keys(result.snapshot.items)).toEqual(['0', '1']);
    expect(JSON.parse(JSON.stringify(result.snapshot))).toEqual(
      result.snapshot,
    );
  });

  it.each([
    [{ ...identity, snapshotId: '' }, 'invalid-identity'],
    [{ ...identity, recommendationFingerprint: '   ' }, 'invalid-identity'],
    [
      {
        snapshotId: identity.snapshotId,
        recommendationFingerprint: identity.recommendationFingerprint,
      },
      'invalid-identity',
    ],
    [{ ...identity, unexpected: 'field' }, 'invalid-identity'],
    [Object.create(identity), 'invalid-identity'],
  ])('rejects off-contract identity %#', (invalidIdentity, reason) => {
    const { input } = createValidInput();

    expect(
      createTransitionSnapshot({
        ...input,
        identity: invalidIdentity,
      }),
    ).toEqual({ kind: 'rejected', reason });
  });

  it('rejects identity accessors without invoking them', () => {
    const { input } = createValidInput();
    let accesses = 0;
    const accessorIdentity = {
      get snapshotId() {
        accesses += 1;
        return identity.snapshotId;
      },
      recommendationFingerprint: identity.recommendationFingerprint,
      transitionContextId: identity.transitionContextId,
    };

    expect(
      createTransitionSnapshot({
        ...input,
        identity: accessorIdentity,
      }),
    ).toEqual({ kind: 'rejected', reason: 'invalid-identity' });
    expect(accesses).toBe(0);
  });

  it.each([
    [{ ...viewport, width: 0 }, 'invalid-viewport'],
    [{ ...viewport, height: Number.POSITIVE_INFINITY }, 'invalid-viewport'],
    [{ ...viewport, scrollX: Number.NaN }, 'invalid-viewport'],
    [{ ...viewport, orientation: 'sideways' }, 'invalid-viewport'],
    [
      {
        width: viewport.width,
        height: viewport.height,
        scrollX: viewport.scrollX,
        scrollY: viewport.scrollY,
      },
      'invalid-viewport',
    ],
    [{ ...viewport, extra: true }, 'invalid-viewport'],
  ])('rejects off-contract viewport %#', (invalidViewport, reason) => {
    const { input } = createValidInput();

    expect(
      createTransitionSnapshot({
        ...input,
        viewport: invalidViewport,
      }),
    ).toEqual({ kind: 'rejected', reason });
  });

  it.each([
    [{ x: Number.NaN, y: 1, width: 10, height: 10 }, 'invalid-rectangle'],
    [
      { x: 1, y: Number.NEGATIVE_INFINITY, width: 10, height: 10 },
      'invalid-rectangle',
    ],
    [{ x: 1, y: 1, width: 0, height: 10 }, 'invalid-rectangle'],
    [{ x: 1, y: 1, width: 10, height: -1 }, 'invalid-rectangle'],
    [
      { x: 1, y: 1, width: 10, height: 10, right: 11 },
      'invalid-rectangle',
    ],
  ])('rejects malformed rectangle %#', (invalidRect, reason) => {
    const { input, rectanglesByItemId } = createValidInput();
    rectanglesByItemId.set('base-layer', invalidRect);

    expect(createTransitionSnapshot(input)).toEqual({
      kind: 'rejected',
      reason,
      itemId: 'base-layer',
    });
  });

  it.each([
    {
      name: 'empty item order',
      mutate: (input: ReturnType<typeof createValidInput>['input']) => {
        input.orderedItemIds.length = 0;
      },
      expected: { kind: 'rejected', reason: 'empty-item-set' },
    },
    {
      name: 'sparse item order',
      mutate: (input: ReturnType<typeof createValidInput>['input']) => {
        input.orderedItemIds.length = 3;
        delete input.orderedItemIds[1];
      },
      expected: { kind: 'rejected', reason: 'invalid-item-order' },
    },
    {
      name: 'duplicate item ID',
      mutate: (input: ReturnType<typeof createValidInput>['input']) => {
        input.orderedItemIds[1] = 'base-layer';
      },
      expected: {
        kind: 'rejected',
        reason: 'duplicate-item-id',
        itemId: 'base-layer',
      },
    },
    {
      name: 'missing rectangle',
      mutate: (input: ReturnType<typeof createValidInput>['input']) => {
        input.rectanglesByItemId.delete('outer-layer');
      },
      expected: {
        kind: 'rejected',
        reason: 'missing-rectangle',
        itemId: 'outer-layer',
      },
    },
    {
      name: 'unexpected rectangle',
      mutate: (input: ReturnType<typeof createValidInput>['input']) => {
        input.rectanglesByItemId.set('unexpected', {
          x: 1,
          y: 1,
          width: 1,
          height: 1,
        });
      },
      expected: {
        kind: 'rejected',
        reason: 'unexpected-rectangle',
        itemId: 'unexpected',
      },
    },
  ])('rejects $name', ({ mutate, expected }) => {
    const { input } = createValidInput();
    mutate(input);

    expect(createTransitionSnapshot(input)).toEqual(expected);
  });

  it('rejects a non-plain top-level contract and a non-native rectangle map', () => {
    const { input } = createValidInput();

    expect(
      createTransitionSnapshot(Object.assign(Object.create(input), input)),
    ).toEqual({ kind: 'rejected', reason: 'invalid-input' });
    expect(
      createTransitionSnapshot({
        ...input,
        rectanglesByItemId: Object.fromEntries(input.rectanglesByItemId),
      }),
    ).toEqual({ kind: 'rejected', reason: 'invalid-rectangle-map' });
  });
});
