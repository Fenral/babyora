import { describe, expect, it } from 'vitest';
import { createOutfitTransitionAttemptLedger } from './replay-policy.js';

const identity = Object.freeze({
  snapshotId: 'snapshot-1',
  recommendationFingerprint: 'recommendation-1',
  transitionContextId: 'context-1',
});

describe('createOutfitTransitionAttemptLedger', () => {
  it('allows one animation attempt for a never-seen exact identity triple', () => {
    const ledger = createOutfitTransitionAttemptLedger();

    expect(ledger.consume(identity, { animationEligible: true })).toEqual({
      kind: 'animate',
    });
    expect(ledger.consume({ ...identity }, { animationEligible: true })).toEqual({
      kind: 'settle-static',
      reason: 'already-attempted',
    });
  });

  it('consumes the first deliberate activation when motion must settle statically', () => {
    const ledger = createOutfitTransitionAttemptLedger();

    expect(ledger.consume(identity, { animationEligible: false })).toEqual({
      kind: 'settle-static',
      reason: 'motion-ineligible',
    });
    expect(ledger.consume(identity, { animationEligible: true })).toEqual({
      kind: 'settle-static',
      reason: 'already-attempted',
    });
  });

  it('prevents replay after an animated attempt is interrupted externally', () => {
    const ledger = createOutfitTransitionAttemptLedger();

    expect(ledger.consume(identity, { animationEligible: true }).kind).toBe(
      'animate',
    );
    expect(ledger.consume(identity, { animationEligible: true })).toEqual({
      kind: 'settle-static',
      reason: 'already-attempted',
    });
  });

  it.each([
    ['snapshotId', 'snapshot-2'],
    ['recommendationFingerprint', 'recommendation-2'],
    ['transitionContextId', 'context-2'],
  ] as const)('treats a changed %s as a distinct identity', (field, value) => {
    const ledger = createOutfitTransitionAttemptLedger();

    expect(ledger.consume(identity, { animationEligible: true }).kind).toBe(
      'animate',
    );
    expect(
      ledger.consume(
        {
          ...identity,
          [field]: value,
        },
        { animationEligible: true },
      ).kind,
    ).toBe('animate');
  });

  it('uses a length-safe tuple key when identity strings contain delimiters', () => {
    const ledger = createOutfitTransitionAttemptLedger();
    const first = {
      snapshotId: 'a|r1:b',
      recommendationFingerprint: 'c',
      transitionContextId: 'd',
    };
    const second = {
      snapshotId: 'a',
      recommendationFingerprint: 'b|r1:c',
      transitionContextId: 'd',
    };

    expect(ledger.consume(first, { animationEligible: true }).kind).toBe(
      'animate',
    );
    expect(ledger.consume(second, { animationEligible: true }).kind).toBe(
      'animate',
    );
  });

  it.each([
    undefined,
    null,
    {},
    {
      snapshotId: 'snapshot-1',
      recommendationFingerprint: 'recommendation-1',
    },
    {
      snapshotId: 1,
      recommendationFingerprint: 'recommendation-1',
      transitionContextId: 'context-1',
    },
    {
      snapshotId: '   ',
      recommendationFingerprint: 'recommendation-1',
      transitionContextId: 'context-1',
    },
  ])('settles invalid identity %# without consuming a valid key', (invalid) => {
    const ledger = createOutfitTransitionAttemptLedger();

    expect(
      ledger.consume(invalid, { animationEligible: true }),
    ).toEqual({
      kind: 'invalid-identity',
    });
    expect(ledger.consume(identity, { animationEligible: true }).kind).toBe(
      'animate',
    );
  });

  it('does not invoke identity accessors while validating untrusted input', () => {
    const ledger = createOutfitTransitionAttemptLedger();
    const accessorIdentity = {
      get snapshotId(): string {
        throw new Error('must not run');
      },
      recommendationFingerprint: 'recommendation-1',
      transitionContextId: 'context-1',
    };

    expect(() =>
      ledger.consume(accessorIdentity, { animationEligible: true }),
    ).not.toThrow();
    expect(
      ledger.consume(accessorIdentity, { animationEligible: true }),
    ).toEqual({
      kind: 'invalid-identity',
    });
  });

  it('scopes attempts to the injected App-lifetime ledger instance', () => {
    const firstAppLifetime = createOutfitTransitionAttemptLedger();
    const secondAppLifetime = createOutfitTransitionAttemptLedger();

    expect(
      firstAppLifetime.consume(identity, { animationEligible: true }).kind,
    ).toBe('animate');
    expect(
      firstAppLifetime.consume(identity, { animationEligible: true }).kind,
    ).toBe('settle-static');
    expect(
      secondAppLifetime.consume(identity, { animationEligible: true }).kind,
    ).toBe('animate');
  });
});
