import { describe, expect, it } from 'vitest';
import { decideTransitionEligibility } from './eligibility.js';
import {
  createTransitionSnapshot,
  type TransitionSnapshot,
} from './transition-snapshot.js';

const identity = {
  snapshotId: 'snapshot-1',
  recommendationFingerprint: 'recommendation-1',
  transitionContextId: 'context-1',
} as const;

const viewport = {
  width: 390,
  height: 844,
  scrollX: 0,
  scrollY: 0,
  orientation: 'portrait',
} as const;

const sourceRects = new Map([
  ['base-layer', { x: 10, y: 20, width: 60, height: 80 }],
  ['outer-layer', { x: 90, y: 20, width: 70, height: 90 }],
]);

const targetRects = new Map([
  ['base-layer', { x: 24, y: 280, width: 180, height: 48 }],
  ['outer-layer', { x: 24, y: 340, width: 180, height: 48 }],
]);

function capture(
  orderedItemIds: string[],
  rectanglesByItemId: Map<string, {
    x: number;
    y: number;
    width: number;
    height: number;
  }>,
  overrides: {
    identity?: unknown;
    viewport?: unknown;
  } = {},
): TransitionSnapshot {
  const result = createTransitionSnapshot({
    identity: overrides.identity ?? { ...identity },
    viewport: overrides.viewport ?? { ...viewport },
    orderedItemIds,
    rectanglesByItemId,
  });

  if (result.kind !== 'captured') {
    throw new Error(`fixture capture failed: ${result.reason}`);
  }

  return result.snapshot;
}

function createValidCandidate() {
  return {
    expectedIdentity: { ...identity },
    expectedItemIds: ['outer-layer', 'base-layer'],
    sourceSnapshot: capture(
      ['base-layer', 'outer-layer'],
      new Map(sourceRects),
    ),
    targetSnapshot: capture(
      ['outer-layer', 'base-layer'],
      new Map(targetRects),
    ),
    currentViewport: { ...viewport },
    motion: 'allowed',
    documentVisibility: 'visible',
    lifecycle: 'active',
  };
}

function cloneSnapshot(snapshot: TransitionSnapshot): {
  identity: {
    snapshotId: string;
    recommendationFingerprint: string;
    transitionContextId: string;
  };
  viewport: {
    width: number;
    height: number;
    scrollX: number;
    scrollY: number;
    orientation: 'portrait' | 'landscape';
  };
  items: Array<{
    itemId: string;
    rect: { x: number; y: number; width: number; height: number };
  }>;
} {
  return JSON.parse(JSON.stringify(snapshot)) as ReturnType<
    typeof cloneSnapshot
  >;
}

describe('decideTransitionEligibility', () => {
  it('animates only the complete exact set and preserves source order', () => {
    const decision = decideTransitionEligibility(createValidCandidate());

    expect(decision).toEqual({
      kind: 'animate',
      snapshot: {
        identity,
        viewport,
        items: [
          {
            itemId: 'base-layer',
            sourceRect: { x: 10, y: 20, width: 60, height: 80 },
            targetRect: { x: 24, y: 280, width: 180, height: 48 },
          },
          {
            itemId: 'outer-layer',
            sourceRect: { x: 90, y: 20, width: 70, height: 90 },
            targetRect: { x: 24, y: 340, width: 180, height: 48 },
          },
        ],
      },
    });
  });

  it('returns a deeply immutable snapshot detached from caller data', () => {
    const candidate = createValidCandidate();
    const sourceInput = cloneSnapshot(candidate.sourceSnapshot);
    const targetInput = cloneSnapshot(candidate.targetSnapshot);
    candidate.sourceSnapshot = sourceInput;
    candidate.targetSnapshot = targetInput;
    const decision = decideTransitionEligibility(candidate);

    expect(decision.kind).toBe('animate');
    if (decision.kind !== 'animate') {
      throw new Error('expected an eligible transition');
    }

    sourceInput.items[0]!.rect.width = 999;
    targetInput.items[1]!.rect.x = 999;
    (
      candidate.expectedIdentity as {
        snapshotId: string;
      }
    ).snapshotId = 'mutated';
    (
      candidate.currentViewport as {
        width: number;
      }
    ).width = 999;
    candidate.expectedItemIds.reverse();

    expect(decision.snapshot.items[0]?.sourceRect.width).toBe(60);
    expect(decision.snapshot.items[1]?.targetRect.x).toBe(24);
    expect(decision.snapshot.identity.snapshotId).toBe('snapshot-1');
    expect(decision.snapshot.viewport.width).toBe(390);
    expect(decision.snapshot.items.map((item) => item.itemId)).toEqual([
      'base-layer',
      'outer-layer',
    ]);
    expect(Object.isFrozen(decision)).toBe(true);
    expect(Object.isFrozen(decision.snapshot)).toBe(true);
    expect(Object.isFrozen(decision.snapshot.items)).toBe(true);
    expect(Object.isFrozen(decision.snapshot.items[0])).toBe(true);
    expect(Object.isFrozen(decision.snapshot.items[0]?.sourceRect)).toBe(true);
    expect(Object.isFrozen(decision.snapshot.items[0]?.targetRect)).toBe(true);
  });

  it.each([
    ['snapshotId', 'snapshot-2'],
    ['recommendationFingerprint', 'recommendation-2'],
    ['transitionContextId', 'context-2'],
  ] as const)('settles statically when %s differs', (field, value) => {
    const candidate = createValidCandidate();
    candidate.targetSnapshot = capture(
      ['outer-layer', 'base-layer'],
      new Map(targetRects),
      {
        identity: {
          ...identity,
          [field]: value,
        },
      },
    );

    expect(decideTransitionEligibility(candidate)).toEqual({
      kind: 'settle-static',
      reason: 'identity-mismatch',
    });
  });

  it.each([
    {
      name: 'missing target',
      mutate: (candidate: ReturnType<typeof createValidCandidate>) => {
        candidate.targetSnapshot = capture(
          ['base-layer'],
          new Map([['base-layer', targetRects.get('base-layer')!]]),
        );
      },
      reason: 'item-set-mismatch',
    },
    {
      name: 'unexpected target',
      mutate: (candidate: ReturnType<typeof createValidCandidate>) => {
        candidate.targetSnapshot = capture(
          ['base-layer', 'outer-layer', 'unexpected'],
          new Map([
            ...targetRects,
            ['unexpected', { x: 1, y: 1, width: 1, height: 1 }],
          ]),
        );
      },
      reason: 'item-set-mismatch',
    },
    {
      name: 'duplicate source',
      mutate: (candidate: ReturnType<typeof createValidCandidate>) => {
        const source = cloneSnapshot(candidate.sourceSnapshot);
        source.items[1]!.itemId = 'base-layer';
        candidate.sourceSnapshot = source;
      },
      reason: 'invalid-source-items',
    },
    {
      name: 'empty expected set',
      mutate: (candidate: ReturnType<typeof createValidCandidate>) => {
        candidate.expectedItemIds.length = 0;
      },
      reason: 'empty-item-set',
    },
    {
      name: 'duplicate expected ID',
      mutate: (candidate: ReturnType<typeof createValidCandidate>) => {
        candidate.expectedItemIds[1] = 'outer-layer';
      },
      reason: 'invalid-expected-items',
    },
    {
      name: 'sparse expected IDs',
      mutate: (candidate: ReturnType<typeof createValidCandidate>) => {
        candidate.expectedItemIds.length = 3;
        delete candidate.expectedItemIds[1];
      },
      reason: 'invalid-expected-items',
    },
  ])('rejects a $name without partial animation', ({ mutate, reason }) => {
    const candidate = createValidCandidate();
    mutate(candidate);

    expect(decideTransitionEligibility(candidate)).toEqual({
      kind: 'settle-static',
      reason,
    });
  });

  it.each([
    ['source', 'width', 0, 'invalid-source-geometry'],
    ['source', 'x', Number.NaN, 'invalid-source-geometry'],
    ['target', 'height', 0, 'invalid-target-geometry'],
    ['target', 'y', Number.POSITIVE_INFINITY, 'invalid-target-geometry'],
  ] as const)(
    'rejects %s rectangle with %s=%s',
    (side, field, value, reason) => {
      const candidate = createValidCandidate();
      const snapshot = cloneSnapshot(
        side === 'source'
          ? candidate.sourceSnapshot
          : candidate.targetSnapshot,
      );
      snapshot.items[0]!.rect[field] = value;

      if (side === 'source') {
        candidate.sourceSnapshot = snapshot;
      } else {
        candidate.targetSnapshot = snapshot;
      }

      expect(decideTransitionEligibility(candidate)).toEqual({
        kind: 'settle-static',
        reason,
      });
    },
  );

  it.each([
    ['width', 391],
    ['height', 845],
    ['scrollX', 1],
    ['scrollY', 1],
    ['orientation', 'landscape'],
  ] as const)('rejects a changed viewport %s', (field, value) => {
    const candidate = createValidCandidate();
    candidate.currentViewport = {
      ...viewport,
      [field]: value,
    };

    expect(decideTransitionEligibility(candidate)).toEqual({
      kind: 'settle-static',
      reason: 'viewport-changed',
    });
  });

  it.each([
    [
      { motion: 'reduced' },
      { kind: 'settle-static', reason: 'motion-reduced' },
    ],
    [
      { documentVisibility: 'hidden' },
      { kind: 'settle-static', reason: 'document-hidden' },
    ],
    [
      { lifecycle: 'aborted' },
      { kind: 'settle-static', reason: 'lifecycle-aborted' },
    ],
  ])('settles safely for lifecycle condition %#', (override, expected) => {
    expect(
      decideTransitionEligibility({
        ...createValidCandidate(),
        ...override,
      }),
    ).toEqual(expected);
  });

  it('rejects malformed top-level state and accessors without reading DOM-like values', () => {
    const candidate = createValidCandidate();
    let accesses = 0;
    const source = cloneSnapshot(candidate.sourceSnapshot);
    Object.defineProperty(source.items[0], 'rect', {
      enumerable: true,
      get() {
        accesses += 1;
        return sourceRects.get('base-layer');
      },
    });
    candidate.sourceSnapshot = source;

    expect(() => decideTransitionEligibility(candidate)).not.toThrow();
    expect(decideTransitionEligibility(candidate)).toEqual({
      kind: 'settle-static',
      reason: 'invalid-source-geometry',
    });
    expect(accesses).toBe(0);
    expect(
      decideTransitionEligibility({
        ...createValidCandidate(),
        unexpected: true,
      }),
    ).toEqual({ kind: 'settle-static', reason: 'invalid-input' });
  });
});
