import { describe, expect, it } from 'vitest';
import { decideTransitionEligibility } from './eligibility.js';
import {
  createOutfitTransitionCoordinator,
} from './coordinator.js';
import {
  createTransitionSnapshot,
  type TransitionIdentity,
  type TransitionSnapshot,
} from './transition-snapshot.js';

const identity = Object.freeze({
  snapshotId: 'snapshot-1',
  recommendationFingerprint: 'recommendation-1',
  transitionContextId: 'context-1',
});

const viewport = Object.freeze({
  width: 390,
  height: 844,
  scrollX: 0,
  scrollY: 0,
  orientation: 'portrait' as const,
});

function snapshot(
  exactIdentity: TransitionIdentity = identity,
  offset = 0,
): TransitionSnapshot {
  const result = createTransitionSnapshot({
    identity: exactIdentity,
    viewport,
    orderedItemIds: ['garment:wool-body', 'garment:wool-socks'],
    rectanglesByItemId: new Map([
      [
        'garment:wool-body',
        { x: 32 + offset, y: 140, width: 80, height: 96 },
      ],
      [
        'garment:wool-socks',
        { x: 126 + offset, y: 200, width: 56, height: 40 },
      ],
    ]),
  });
  if (result.kind !== 'captured') throw new Error(result.reason);
  return result.snapshot;
}

function eligible(source = snapshot(), target = snapshot(identity, 8)) {
  const decision = decideTransitionEligibility({
    expectedIdentity: source.identity,
    expectedItemIds: source.items.map((item) => item.itemId),
    sourceSnapshot: source,
    targetSnapshot: target,
    currentViewport: viewport,
    motion: 'allowed',
    documentVisibility: 'visible',
    lifecycle: 'active',
  });
  if (decision.kind !== 'animate') throw new Error(decision.reason);
  return decision.snapshot;
}

describe('outfit transition coordinator', () => {
  it('moves through the serializable happy-path states in order', () => {
    const coordinator = createOutfitTransitionCoordinator();
    const observed: string[] = [];
    const unsubscribe = coordinator.subscribe(() => {
      observed.push(coordinator.getState().status);
    });

    expect(coordinator.capture(snapshot()).status).toBe('captured');
    expect(coordinator.markReady(eligible()).status).toBe('ready');
    expect(coordinator.beginPlayback().status).toBe('playing');
    expect(coordinator.settle('completed').status).toBe('settled');
    unsubscribe();

    expect(observed).toEqual(['captured', 'ready', 'playing', 'settled']);
    expect(Object.isFrozen(coordinator.getState())).toBe(true);
    expect(JSON.parse(JSON.stringify(coordinator.getState()))).toEqual({
      status: 'settled',
      reason: 'completed',
    });
  });

  it('fails closed when readiness does not match the captured triple', () => {
    const coordinator = createOutfitTransitionCoordinator();
    coordinator.capture(snapshot());
    const otherIdentity = Object.freeze({
      ...identity,
      transitionContextId: 'context-2',
    });

    expect(
      coordinator.markReady(
        eligible(snapshot(otherIdentity), snapshot(otherIdentity, 8)),
      ),
    ).toEqual({
      status: 'settled',
      reason: 'candidate-mismatch',
    });
  });

  it('settles an active attempt on abort and preserves the first reason', () => {
    const coordinator = createOutfitTransitionCoordinator();
    coordinator.capture(snapshot());

    expect(coordinator.abort('page-hidden')).toEqual({
      status: 'settled',
      reason: 'page-hidden',
    });
    expect(coordinator.abort('resized')).toEqual({
      status: 'settled',
      reason: 'page-hidden',
    });
    expect(coordinator.beginPlayback()).toEqual({
      status: 'settled',
      reason: 'page-hidden',
    });
  });

  it('allows a later identity to start after a previous attempt settles', () => {
    const coordinator = createOutfitTransitionCoordinator();
    coordinator.capture(snapshot());
    coordinator.settle('closed');

    const nextIdentity = Object.freeze({
      ...identity,
      snapshotId: 'snapshot-2',
      transitionContextId: 'context-2',
    });
    expect(coordinator.capture(snapshot(nextIdentity)).status).toBe('captured');
  });
});
