import { useState } from 'react';
import type { OnboardingDraft } from './app-flow';
import { FamilyScreen } from './FamilyScreen';
import { HomeScreen } from './HomeScreen';
import { PlanScreen } from './PlanScreen';
import { ToolsScreen } from './ToolsScreen';
import type { ProductTab } from './ui';

export function ProductApp({ initialProfile }: { initialProfile: OnboardingDraft }) {
  const [tab, setTab] = useState<ProductTab>('home');
  const [profile, setProfile] = useState(initialProfile);

  const updateProfile = (next: OnboardingDraft) => {
    setProfile(next);
    try { window.localStorage.setItem('snudly.v2.profile', JSON.stringify(next)); } catch { /* local-only still works in memory */ }
  };

  if (tab === 'home') return <HomeScreen profile={profile} onSelectTab={setTab} />;
  if (tab === 'plan') return <PlanScreen profile={profile} onSelectTab={setTab} />;
  if (tab === 'tools') return <ToolsScreen profile={profile} onSelectTab={setTab} />;
  return <FamilyScreen profile={profile} onProfileChange={updateProfile} onSelectTab={setTab} />;
}
