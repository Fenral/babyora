import { useEffect, useReducer } from 'react';
import {
  createInitialFlow,
  ONBOARDING_STORAGE_KEY,
  PROFILE_STORAGE_KEY,
  reduceAppFlow,
  TOUR_STORAGE_KEY,
  type AppFlowSnapshot,
  type OnboardingDraft,
} from './app-flow';
import { LaunchScreen } from './LaunchScreen';
import { OnboardingFlow } from './OnboardingFlow';
import { ProductApp } from './ProductApp';
import { ProductTour } from './ProductTour';
import { ageInCompleteMonths } from './home-model';

function readBoolean(key: string): boolean {
  try { return window.localStorage.getItem(key) === 'true'; } catch { return false; }
}

function readProfile(): OnboardingDraft | undefined {
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return undefined;
    const value = JSON.parse(raw) as Partial<OnboardingDraft>;
    if (typeof value.name !== 'string' || typeof value.birthDate !== 'string' || typeof value.city !== 'string') return undefined;
    if (value.city.trim().length < 2) return undefined;
    ageInCompleteMonths(value.birthDate, new Date());
    return { name: value.name, birthDate: value.birthDate, city: value.city };
  } catch {
    return undefined;
  }
}

function readFlowSnapshot(): AppFlowSnapshot {
  const profile = readProfile();
  return {
    onboardingComplete: readBoolean(ONBOARDING_STORAGE_KEY) && Boolean(profile),
    tourComplete: readBoolean(TOUR_STORAGE_KEY),
    profile,
  };
}

function writeStorage(key: string, value: string): void {
  try { window.localStorage.setItem(key, value); } catch { /* Private browsing stays in memory. */ }
}

function ResolvedSnudlyApp() {
  const [flow, dispatch] = useReducer(
    reduceAppFlow,
    undefined,
    () => createInitialFlow(readFlowSnapshot()),
  );

  useEffect(() => {
    if (flow.screen !== 'launch') return undefined;
    const timer = window.setTimeout(() => dispatch({ type: 'release-launch' }), 1100);
    return () => window.clearTimeout(timer);
  }, [flow.screen]);

  if (flow.screen === 'launch') return <LaunchScreen />;
  if (flow.screen === 'onboarding') {
    return (
      <OnboardingFlow
        state={flow}
        dispatch={dispatch}
        onStartTour={() => {
          writeStorage(ONBOARDING_STORAGE_KEY, 'true');
          writeStorage(PROFILE_STORAGE_KEY, JSON.stringify(flow.draft));
        }}
      />
    );
  }
  if (flow.screen === 'tour') {
    return (
      <ProductTour
        state={flow}
        dispatch={dispatch}
        onComplete={() => {
          writeStorage(TOUR_STORAGE_KEY, 'true');
          dispatch({ type: 'finish-tour' });
        }}
      />
    );
  }
  return <ProductApp initialProfile={flow.profile} />;
}

export function SnudlyApp() {
  return <ResolvedSnudlyApp />;
}
