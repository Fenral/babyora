export const ONBOARDING_STORAGE_KEY = 'snudly.v2.onboarding.complete';
export const PROFILE_STORAGE_KEY = 'snudly.v2.profile';
export const TOUR_STORAGE_KEY = 'snudly.v2.tour.complete';

export type OnboardingStep = 1 | 2 | 3 | 4 | 5;
export type TourPage = 'home' | 'plan' | 'tools' | 'family';

export type OnboardingDraft = {
  name: string;
  birthDate: string;
  city: string;
};

export type AppFlowSnapshot = {
  onboardingComplete: boolean;
  tourComplete: boolean;
  entitlementActive: boolean;
  profile?: OnboardingDraft;
};

type LaunchDestination = 'onboarding' | 'tour' | 'paywall' | 'home';

export type AppFlowState =
  | { screen: 'launch'; destination: LaunchDestination; profile: OnboardingDraft }
  | { screen: 'onboarding'; step: OnboardingStep; draft: OnboardingDraft }
  | { screen: 'tour'; page: TourPage; profile: OnboardingDraft }
  | { screen: 'paywall'; profile: OnboardingDraft }
  | { screen: 'home'; profile: OnboardingDraft };

export type AppFlowAction =
  | { type: 'release-launch' }
  | { type: 'set-name'; value: string }
  | { type: 'set-birth-date'; value: string }
  | { type: 'set-city'; value: string }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'edit'; step: 1 | 2 | 3 }
  | { type: 'start-tour' }
  | { type: 'select-tour'; page: TourPage }
  | { type: 'next-tour' }
  | { type: 'finish-tour' }
  | { type: 'grant-entitlement' }
  | { type: 'replay-tour' };

const EMPTY_DRAFT: OnboardingDraft = {
  name: '',
  birthDate: '',
  city: '',
};

const DEFAULT_PROFILE: OnboardingDraft = {
  name: 'Lillian',
  birthDate: '2025-10-17',
  city: 'Trondheim',
};

const TOUR_ORDER: readonly TourPage[] = ['home', 'plan', 'tools', 'family'];

export function createInitialFlow(snapshot: AppFlowSnapshot): AppFlowState {
  const profile = snapshot.profile ?? DEFAULT_PROFILE;
  const destination: LaunchDestination = !snapshot.onboardingComplete
    ? 'onboarding'
    : snapshot.entitlementActive
      ? 'home'
      : snapshot.tourComplete
        ? 'paywall'
        : 'tour';

  return { screen: 'launch', destination, profile: { ...profile } };
}

function isValidBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return Number.isFinite(date.getTime()) && date.getTime() <= Date.now();
}

export function canAdvanceOnboarding(state: Extract<AppFlowState, { screen: 'onboarding' }>): boolean {
  if (state.step === 1) return true;
  if (state.step === 2) return isValidBirthDate(state.draft.birthDate);
  if (state.step === 3) return state.draft.city.trim().length >= 2;
  return isValidBirthDate(state.draft.birthDate) && state.draft.city.trim().length >= 2;
}

export function reduceAppFlow(state: AppFlowState, action: AppFlowAction): AppFlowState {
  if (state.screen === 'launch') {
    if (action.type !== 'release-launch') return state;
    if (state.destination === 'home') return { screen: 'home', profile: state.profile };
    if (state.destination === 'paywall') return { screen: 'paywall', profile: state.profile };
    if (state.destination === 'tour') return { screen: 'tour', page: 'home', profile: state.profile };
    return { screen: 'onboarding', step: 1, draft: { ...EMPTY_DRAFT } };
  }

  if (state.screen === 'paywall') {
    if (action.type === 'grant-entitlement') return { screen: 'home', profile: state.profile };
    return action.type === 'replay-tour'
      ? { screen: 'tour', page: 'home', profile: state.profile }
      : state;
  }
  if (state.screen === 'home') return state;

  if (state.screen === 'tour') {
    if (action.type === 'select-tour') return { ...state, page: action.page };
    if (action.type === 'next-tour') {
      const currentIndex = TOUR_ORDER.indexOf(state.page);
      const nextPage = TOUR_ORDER[Math.min(currentIndex + 1, TOUR_ORDER.length - 1)];
      return { ...state, page: nextPage };
    }
    if (action.type === 'finish-tour' && state.page === 'family') {
      return { screen: 'paywall', profile: state.profile };
    }
    return state;
  }

  if (action.type === 'set-name') {
    return { ...state, draft: { ...state.draft, name: action.value } };
  }
  if (action.type === 'set-birth-date') {
    return { ...state, draft: { ...state.draft, birthDate: action.value } };
  }
  if (action.type === 'set-city') {
    return { ...state, draft: { ...state.draft, city: action.value } };
  }
  if (action.type === 'edit') return { ...state, step: action.step };
  if (action.type === 'back') {
    return state.step > 1 && state.step < 5
      ? { ...state, step: (state.step - 1) as OnboardingStep }
      : state;
  }
  if (action.type === 'start-tour') {
    return state.step === 5
      ? { screen: 'tour', page: 'home', profile: { ...state.draft } }
      : state;
  }
  if (action.type === 'next' && canAdvanceOnboarding(state) && state.step < 5) {
    return { ...state, step: (state.step + 1) as OnboardingStep };
  }

  return state;
}
