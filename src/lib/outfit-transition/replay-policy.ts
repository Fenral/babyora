export type OutfitTransitionIdentity = Readonly<{
  snapshotId: string;
  recommendationFingerprint: string;
  transitionContextId: string;
}>;

export type OutfitTransitionAttemptOptions = Readonly<{
  animationEligible: boolean;
}>;

export type OutfitTransitionAttemptDecision =
  | Readonly<{ kind: 'animate' }>
  | Readonly<{
      kind: 'settle-static';
      reason: 'motion-ineligible' | 'already-attempted';
    }>
  | Readonly<{ kind: 'invalid-identity' }>;

export type OutfitTransitionAttemptLedger = Readonly<{
  consume: (
    identity: unknown,
    options: OutfitTransitionAttemptOptions,
  ) => OutfitTransitionAttemptDecision;
}>;

const ANIMATE_DECISION = Object.freeze({
  kind: 'animate',
} as const);

const MOTION_INELIGIBLE_DECISION = Object.freeze({
  kind: 'settle-static',
  reason: 'motion-ineligible',
} as const);

const ALREADY_ATTEMPTED_DECISION = Object.freeze({
  kind: 'settle-static',
  reason: 'already-attempted',
} as const);

const INVALID_IDENTITY_DECISION = Object.freeze({
  kind: 'invalid-identity',
} as const);

function isPlainRecord(
  value: unknown,
): value is Readonly<Record<string, unknown>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function ownNonEmptyString(
  value: Readonly<Record<string, unknown>>,
  key: keyof OutfitTransitionIdentity,
): string | null {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);

  if (!descriptor || !Object.hasOwn(descriptor, 'value')) {
    return null;
  }

  const fieldValue = descriptor.value;
  if (typeof fieldValue !== 'string' || fieldValue.trim().length === 0) {
    return null;
  }

  return fieldValue;
}

function lengthSafeSegment(label: string, value: string): string {
  return `${label}${value.length}:${value}`;
}

function canonicalIdentityKey(identity: unknown): string | null {
  try {
    if (!isPlainRecord(identity)) {
      return null;
    }

    const snapshotId = ownNonEmptyString(identity, 'snapshotId');
    const recommendationFingerprint = ownNonEmptyString(
      identity,
      'recommendationFingerprint',
    );
    const transitionContextId = ownNonEmptyString(
      identity,
      'transitionContextId',
    );

    if (
      snapshotId === null ||
      recommendationFingerprint === null ||
      transitionContextId === null
    ) {
      return null;
    }

    return [
      'v1',
      lengthSafeSegment('s', snapshotId),
      lengthSafeSegment('r', recommendationFingerprint),
      lengthSafeSegment('c', transitionContextId),
    ].join('|');
  } catch {
    return null;
  }
}

export function createOutfitTransitionAttemptLedger(): OutfitTransitionAttemptLedger {
  const attemptedIdentityKeys = new Set<string>();

  return Object.freeze({
    consume(
      identity: unknown,
      options: OutfitTransitionAttemptOptions,
    ): OutfitTransitionAttemptDecision {
      const identityKey = canonicalIdentityKey(identity);

      if (identityKey === null) {
        return INVALID_IDENTITY_DECISION;
      }

      if (attemptedIdentityKeys.has(identityKey)) {
        return ALREADY_ATTEMPTED_DECISION;
      }

      attemptedIdentityKeys.add(identityKey);

      return options.animationEligible
        ? ANIMATE_DECISION
        : MOTION_INELIGIBLE_DECISION;
    },
  });
}
