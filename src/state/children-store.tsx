import { createContext, useContext } from 'react';
/**
 * Lokal state for barn (uten Supabase ennå).
 * Erstattes med Supabase-data i Fase 3 (onboarding) — men API-en holdes
 * stabil så HomeScreen ikke trenger å endres.
 *
 * Iter 30: localStorage-persistens + needsOnboarding-flag.
 * Hvis brukeren ikke har gjennomført onboarding, vises OnboardingScreen
 * istedenfor tabs. Mock-data brukes kun ved ?seed=demo.
 *
 * R3 (2026-07-14): ChildrenProvider-komponenten bor i children-provider.tsx
 * (react-refresh/only-export-components). Denne filen eier typene, context,
 * useChildren og storage-hjelperne; hjelperne er eksportert (@internal) for
 * provideren.
 */

export type Child = {
  id: string;
  name: string;
  /** Fødselsdato (ISO YYYY-MM-DD). Alder i mnd avledet via dobToAgeMonths. */
  dob: string;
  city: string;
  lat: number;
  lon: number;
  /** Hex-farge for avatar-thumbnail (brukt i ChildSwitcher-prikker) */
  color: string;
  /** Roster-nøkkel for avatar-PNG-mappen. Optional — fallback via resolver. */
  avatarKey?: string;
  /**
   * Iter 36 (jun 2026) — kan barnet rulle på siden/magen?
   * Brukes for HB-6 (stopp svøping) i wool-layers safety. Hvis undefined
   * faller engine tilbake til alder ≥ 4 mnd som proxy.
   */
  canRoll?: 'yes' | 'no' | 'unknown';
};

export type ChildrenStore = {
  children: Child[];
  activeId: string;
  /** Aktivt barn — garantert non-null så lenge needsOnboarding=false.
      Bruk needsOnboarding-flag for å sjekke om appen er klar for bruk. */
  active: Child;
  needsOnboarding: boolean;
  setActiveId: (id: string) => void;
  addChild: (child: Omit<Child, 'id'>) => void;
  updateChild: (id: string, patch: Partial<Omit<Child, 'id'>>) => void;
  removeChild: (id: string) => void;
  completeOnboarding: (firstChild: Omit<Child, 'id'>) => void;
  resetAll: () => void;
};

// Placeholder-barn brukt kun for type-completeness når needsOnboarding=true.
// App.tsx rendrer OnboardingScreen istedenfor å bruke dette.
/** @internal — kun for children-provider.tsx */
export const PLACEHOLDER_CHILD: Child = {
  id: '__placeholder__',
  name: '',
  dob: '',
  city: '',
  lat: 0,
  lon: 0,
  color: '#000000',
};

/** @internal — kun for children-provider.tsx */
export const ChildrenContext = createContext<ChildrenStore | null>(null);

// F58 (2026-06-24): bumped storage-key v1 (klemeg:*) → v2 (babyora:*:v2).
// Eksisterende brukere får ny onboarding (per Sivert valg). Gammel data ignoreres uten å slettes.
/** @internal — kun for children-provider.tsx */
export const STORAGE_KEY = 'babyora:children:v2';
/** @internal — kun for children-provider.tsx */
export const ACTIVE_KEY = 'babyora:activeChildId:v2';

// Demo-data — kun aktiv ved ?seed=demo
/** @internal — kun for children-provider.tsx */
export const DEMO_CHILDREN: Child[] = [
  {
    id: 'lillian',
    name: 'Lillian',
    dob: '2025-10-03',
    city: 'Trondheim',
    lat: 63.4305,
    lon: 10.3951,
    color: '#C25450',
    avatarKey: 'lillian',
  },
  {
    id: 'eskil',
    name: 'Eskil',
    dob: '2023-12-03',
    city: 'Trondheim',
    lat: 63.4305,
    lon: 10.3951,
    color: '#4F8A6A',
    avatarKey: 'oskar',
  },
];

/** @internal — kun for children-provider.tsx */
export const AVATAR_COLORS = ['#C25450', '#4F8A6A', '#2E7CC2', '#D87A2E', '#8B5A8C', '#5B6470'];

/** @internal — kun for children-provider.tsx */
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('seed');
}

/** @internal — kun for children-provider.tsx */
export function loadFromStorage(): Child[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** @internal — kun for children-provider.tsx */
export function saveToStorage(children: Child[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(children));
  } catch {
    // Quota full / privacy-mode — ignorer
  }
}

/** @internal — kun for children-provider.tsx */
export function loadActiveId(fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  try {
    return localStorage.getItem(ACTIVE_KEY) || fallback;
  } catch {
    return fallback;
  }
}

/** @internal — kun for children-provider.tsx */
export function saveActiveId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    // ignorer
  }
}

export function useChildren(): ChildrenStore {
  const ctx = useContext(ChildrenContext);
  if (!ctx) throw new Error('useChildren må brukes innenfor <ChildrenProvider>');
  return ctx;
}
