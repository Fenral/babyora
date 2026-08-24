import { describe, expect, it } from 'vitest';
import {
  ONBOARDING_STORAGE_KEY,
  PROFILE_STORAGE_KEY,
  TOUR_STORAGE_KEY,
  canAdvanceOnboarding,
  createInitialFlow,
  reduceAppFlow,
} from '../app-flow';

describe('Snudly 2 app flow', () => {
  const newUser = {
    onboardingComplete: false,
    tourComplete: false,
  } as const;

  it('always shows launch before routing a new user into onboarding', () => {
    const launch = createInitialFlow(newUser);

    expect(launch).toMatchObject({ screen: 'launch', destination: 'onboarding' });
    expect(reduceAppFlow(launch, { type: 'release-launch' })).toMatchObject({
      screen: 'onboarding',
      step: 1,
    });
  });

  it('routes returning users through tour or directly home in free v1', () => {
    const profile = { name: 'Lillian', birthDate: '2025-10-17', city: 'Trondheim' };
    const tour = createInitialFlow({ ...newUser, onboardingComplete: true, profile });
    const freeHome = createInitialFlow({ ...newUser, onboardingComplete: true, tourComplete: true, profile });
    const home = createInitialFlow({ ...newUser, onboardingComplete: true, tourComplete: true, profile });

    expect(reduceAppFlow(tour, { type: 'release-launch' })).toMatchObject({ screen: 'tour', page: 'home', profile });
    expect(reduceAppFlow(freeHome, { type: 'release-launch' })).toMatchObject({ screen: 'home', profile });
    expect(reduceAppFlow(home, { type: 'release-launch' })).toEqual({ screen: 'home', profile });
  });

  it('keeps name optional but requires birthday and home place', () => {
    let state = reduceAppFlow(createInitialFlow(newUser), { type: 'release-launch' });
    expect(state.screen).toBe('onboarding');
    if (state.screen !== 'onboarding') throw new Error('expected onboarding');

    expect(canAdvanceOnboarding(state)).toBe(true);
    state = reduceAppFlow(state, { type: 'next' });
    expect(state).toMatchObject({ screen: 'onboarding', step: 2 });

    expect(canAdvanceOnboarding(state)).toBe(false);
    state = reduceAppFlow(state, { type: 'set-birth-date', value: '2025-10-17' });
    expect(canAdvanceOnboarding(state)).toBe(true);
    state = reduceAppFlow(state, { type: 'next' });

    expect(state).toMatchObject({ screen: 'onboarding', step: 3 });
    expect(canAdvanceOnboarding(state)).toBe(false);
    state = reduceAppFlow(state, { type: 'set-city', value: 'Trondheim' });
    expect(canAdvanceOnboarding(state)).toBe(true);
  });

  it('supports back and edit without losing the draft', () => {
    let state = reduceAppFlow(createInitialFlow(newUser), { type: 'release-launch' });
    state = reduceAppFlow(state, { type: 'set-name', value: 'Lillian' });
    state = reduceAppFlow(state, { type: 'next' });
    state = reduceAppFlow(state, { type: 'set-birth-date', value: '2025-10-17' });
    state = reduceAppFlow(state, { type: 'next' });
    state = reduceAppFlow(state, { type: 'set-city', value: 'Trondheim' });
    state = reduceAppFlow(state, { type: 'next' });

    expect(state).toMatchObject({ screen: 'onboarding', step: 4 });
    state = reduceAppFlow(state, { type: 'edit', step: 1 });
    expect(state).toMatchObject({
      screen: 'onboarding',
      step: 1,
      draft: { name: 'Lillian', birthDate: '2025-10-17', city: 'Trondheim' },
    });
    state = reduceAppFlow(state, { type: 'back' });
    expect(state).toMatchObject({ screen: 'onboarding', step: 1 });
  });

  it('moves from welcome through all four real product pages into free v1', () => {
    let state = reduceAppFlow(createInitialFlow(newUser), { type: 'release-launch' });
    state = reduceAppFlow(state, { type: 'next' });
    state = reduceAppFlow(state, { type: 'set-birth-date', value: '2025-10-17' });
    state = reduceAppFlow(state, { type: 'next' });
    state = reduceAppFlow(state, { type: 'set-city', value: 'Trondheim' });
    state = reduceAppFlow(state, { type: 'next' });
    state = reduceAppFlow(state, { type: 'next' });

    expect(state).toMatchObject({ screen: 'onboarding', step: 5 });
    state = reduceAppFlow(state, { type: 'start-tour' });
    expect(state).toMatchObject({ screen: 'tour', page: 'home' });
    state = reduceAppFlow(state, { type: 'next-tour' });
    expect(state).toMatchObject({ screen: 'tour', page: 'plan' });
    state = reduceAppFlow(state, { type: 'next-tour' });
    expect(state).toMatchObject({ screen: 'tour', page: 'tools' });
    state = reduceAppFlow(state, { type: 'next-tour' });
    expect(state).toMatchObject({ screen: 'tour', page: 'family' });
    state = reduceAppFlow(state, { type: 'finish-tour' });
    expect(state).toMatchObject({
      screen: 'home',
      profile: { name: '', birthDate: '2025-10-17', city: 'Trondheim' },
    });

    expect(ONBOARDING_STORAGE_KEY).toBe('snudly.v2.onboarding.complete');
    expect(PROFILE_STORAGE_KEY).toBe('snudly.v2.profile');
    expect(TOUR_STORAGE_KEY).toBe('snudly.v2.tour.complete');
  });

  it('never routes a completed free-v1 user back to a paywall', () => {
    const home = reduceAppFlow(
      createInitialFlow({ ...newUser, onboardingComplete: true, tourComplete: true }),
      { type: 'release-launch' },
    );

    expect(home).toMatchObject({ screen: 'home' });
    expect(reduceAppFlow(home, { type: 'release-launch' })).toEqual(home);
    expect(reduceAppFlow(home, { type: 'start-tour' })).toEqual(home);
  });
});
