import { describe, expect, it } from 'vitest';
import type { AccessContext } from '../../access/capabilities';
import {
  isChildSwitchGated,
  resolvePlanningViewAccess,
  resolveRuntimeCapabilityAccess,
} from '../gating';
import type { PlusFeatureAvailability } from '../plus-features';

const context = (partial?: Partial<AccessContext>): AccessContext => ({
  isPlus: false,
  authenticated: false,
  loading: false,
  ...partial,
});

const availability = (
  partial?: Partial<PlusFeatureAvailability>,
): PlusFeatureAvailability => ({
  today_home: true,
  future_plan: true,
  automatic_location: false,
  extra_children: true,
  family_sharing: false,
  personal_calibration: false,
  soon_preparation: false,
  ...partial,
});

describe('isChildSwitchGated (F81.5-W2, Flate 4 — barn 2+)', () => {
  it('barn nr. 1 (index 0) er ALDRI gatet, uansett Premium-status', () => {
    expect(isChildSwitchGated(0, false, false)).toBe(false);
    expect(isChildSwitchGated(0, true, false)).toBe(false);
    expect(isChildSwitchGated(0, false, true)).toBe(false);
  });

  it('barn 2+ (index > 0) er gatet for ikke-Premium når det IKKE er aktivt', () => {
    expect(isChildSwitchGated(1, false, false)).toBe(true);
    expect(isChildSwitchGated(2, false, false)).toBe(true);
  });

  it('barn 2+ er ALDRI gatet for Premium-bruker', () => {
    expect(isChildSwitchGated(1, false, true)).toBe(false);
    expect(isChildSwitchGated(2, false, true)).toBe(false);
  });

  it('VIKTIG: aktivt barn 2+ låses ALDRI ut selv om Premium er mistet', () => {
    expect(isChildSwitchGated(1, true, false)).toBe(false);
    expect(isChildSwitchGated(3, true, false)).toBe(false);
  });
});

describe('resolveRuntimeCapabilityAccess', () => {
  it('bevarer loading som nøytral uten paywall-trigger', () => {
    expect(resolveRuntimeCapabilityAccess(
      'automatic_location',
      context({ isPlus: true, loading: true }),
      availability({ automatic_location: true }),
    )).toEqual({
      capability: 'automatic_location',
      state: 'neutral',
      allowed: false,
      implementationAvailable: true,
      decision: { allowed: false, reason: 'loading' },
    });
  });

  it('lar manglende eller avslått implementasjon vinne over Plus', () => {
    for (const flags of [availability(), {}]) {
      const result = resolveRuntimeCapabilityAccess(
        'automatic_location',
        context({ isPlus: true }),
        flags,
      );
      expect(result.state).toBe('denied');
      expect(result.allowed).toBe(false);
      expect(result.implementationAvailable).toBe(false);
      expect(result.decision).toEqual({ allowed: true, reason: 'plus' });
    }
  });

  it('krever både tilgang og implementert tilgjengelighet', () => {
    expect(resolveRuntimeCapabilityAccess(
      'future_plan',
      context({ isPlus: true }),
      availability(),
    ).state).toBe('allowed');
    expect(resolveRuntimeCapabilityAccess(
      'future_plan',
      context(),
      availability(),
    )).toMatchObject({
      state: 'denied',
      allowed: false,
      decision: {
        allowed: false,
        reason: 'expired',
        paywallTrigger: 'future_plan',
      },
    });
  });
});

describe('resolvePlanningViewAccess (P2 hard paywall — ingen teaser-presentasjon)', () => {
  it('I dag krever nå Plus akkurat som alt annet: skjult uten, full med, nøytral under lasting', () => {
    expect(resolvePlanningViewAccess('today', context(), availability())).toMatchObject({
      view: 'today',
      capability: 'today_home',
      presentation: 'hidden',
    });
    expect(resolvePlanningViewAccess(
      'today',
      context({ isPlus: true }),
      availability(),
    )).toMatchObject({
      presentation: 'full',
    });
    expect(resolvePlanningViewAccess(
      'today',
      context({ loading: true }),
      availability(),
    )).toMatchObject({
      presentation: 'neutral',
      access: { state: 'neutral' },
    });
  });

  it('Uke er skjult for ikke-Plus, full for implementert Plus og skjult ved rollback', () => {
    expect(resolvePlanningViewAccess('week', context(), availability())).toMatchObject({
      capability: 'future_plan',
      presentation: 'hidden',
    });
    expect(resolvePlanningViewAccess(
      'week',
      context({ isPlus: true }),
      availability(),
    )).toMatchObject({
      presentation: 'full',
      access: { state: 'allowed' },
    });
    expect(resolvePlanningViewAccess(
      'week',
      context({ isPlus: true }),
      availability({ future_plan: false }),
    )).toMatchObject({
      presentation: 'hidden',
      access: { state: 'denied', implementationAvailable: false },
    });
  });

  it('holder Snart skjult mens soon_preparation er utilgjengelig', () => {
    expect(resolvePlanningViewAccess('soon', context(), availability())).toMatchObject({
      capability: 'soon_preparation',
      presentation: 'hidden',
      access: { implementationAvailable: false },
    });
    expect(resolvePlanningViewAccess(
      'soon',
      context({ isPlus: true }),
      availability(),
    ).presentation).toBe('hidden');
  });

  it('holder utilgjengelig Snart skjult også under loading og ved manglende flagg', () => {
    expect(resolvePlanningViewAccess(
      'soon',
      context({ isPlus: true, loading: true }),
      availability({ soon_preparation: false }),
    )).toMatchObject({
      presentation: 'hidden',
      access: {
        state: 'neutral',
        implementationAvailable: false,
        decision: { allowed: false, reason: 'loading' },
      },
    });
    expect(resolvePlanningViewAccess(
      'soon',
      context({ isPlus: true, loading: true }),
      {},
    )).toMatchObject({
      presentation: 'hidden',
      access: { state: 'neutral', implementationAvailable: false },
    });
  });

  it('Snart er full for Plus når soon_preparation er implementert', () => {
    expect(resolvePlanningViewAccess(
      'soon',
      context({ isPlus: true }),
      availability({ soon_preparation: true }),
    )).toMatchObject({
      presentation: 'full',
      access: { state: 'allowed' },
    });
  });
});
