import { describe, expect, it } from 'vitest';
import {
  createOutfitTransitionOverlayModel,
  type OutfitTransitionPresentation,
} from './OutfitTransitionOverlay.js';
import type { EligibleTransitionSnapshot } from '../../lib/outfit-transition/eligibility.js';

const snapshot: EligibleTransitionSnapshot = Object.freeze({
  identity: Object.freeze({
    snapshotId: 'snapshot-1',
    recommendationFingerprint: 'fingerprint-1',
    transitionContextId: 'transition-1',
  }),
  viewport: Object.freeze({
    width: 390,
    height: 844,
    scrollX: 0,
    scrollY: 0,
    orientation: 'portrait',
  }),
  items: Object.freeze([
    Object.freeze({
      itemId: 'visible-shell',
      sourceRect: Object.freeze({ x: 20, y: 100, width: 80, height: 32 }),
      targetRect: Object.freeze({ x: 40, y: 400, width: 240, height: 48 }),
    }),
    Object.freeze({
      itemId: 'visible-hat',
      sourceRect: Object.freeze({ x: 280, y: 120, width: 70, height: 30 }),
      targetRect: Object.freeze({ x: 40, y: 460, width: 240, height: 48 }),
    }),
  ]),
});

const presentations: readonly OutfitTransitionPresentation[] = Object.freeze([
  Object.freeze({ itemId: 'visible-shell', label: 'Dress' }),
  Object.freeze({ itemId: 'visible-hat', label: 'Lue' }),
]);

describe('OutfitTransitionOverlay contract', () => {
  it('creates one immutable exact-ID transform clone per validated presentation', () => {
    const result = createOutfitTransitionOverlayModel(snapshot, presentations);

    expect(result.kind).toBe('ready');
    if (result.kind !== 'ready') return;
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      itemId: 'visible-shell',
      label: 'Dress',
      sourceStyle: {
        left: 20,
        top: 100,
        width: 80,
        height: 32,
      },
      destination: {
        x: 20,
        y: 300,
        scaleX: 3,
        scaleY: 1.5,
      },
    });
    expect(result.items[1]?.delayMs).toBeGreaterThan(0);
    expect(result.items[1]?.endMs).toBe(1_250);
    expect(result.totalDurationMs).toBe(1_250);
    expect(Object.isFrozen(result.items)).toBe(true);
  });

  it('fails closed when presentation IDs are missing, duplicated, reordered, or unlisted', () => {
    const invalidSets = [
      presentations.slice(0, 1),
      [presentations[0], presentations[0]],
      [...presentations].reverse(),
      [...presentations, { itemId: 'equipment', label: 'Varmepose' }],
    ];

    for (const invalid of invalidSets) {
      expect(
        createOutfitTransitionOverlayModel(snapshot, invalid),
      ).toEqual({ kind: 'static-only' });
    }
  });

  it('fails closed for unavailable or non-positive geometry', () => {
    expect(createOutfitTransitionOverlayModel(null, presentations)).toEqual({
      kind: 'static-only',
    });
    const invalid = {
      ...snapshot,
      items: [{
        ...snapshot.items[0],
        sourceRect: { ...snapshot.items[0].sourceRect, width: 0 },
      }],
    };
    expect(
      createOutfitTransitionOverlayModel(
        invalid as EligibleTransitionSnapshot,
        [presentations[0]],
      ),
    ).toEqual({ kind: 'static-only' });
  });
});
