import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
/**
 * Lokal state for barn (uten Supabase ennå).
 * Erstattes med Supabase-data i Fase 3 (onboarding) — men API-en holdes
 * stabil så HomeScreen ikke trenger å endres.
 *
 * Iter 30: localStorage-persistens + needsOnboarding-flag.
 * Hvis brukeren ikke har gjennomført onboarding, vises OnboardingScreen
 * istedenfor tabs. Mock-data brukes kun ved ?seed=demo.
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

type ChildrenStore = {
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
const PLACEHOLDER_CHILD: Child = {
  id: '__placeholder__',
  name: '',
  dob: '',
  city: '',
  lat: 0,
  lon: 0,
  color: '#000000',
};

const ChildrenContext = createContext<ChildrenStore | null>(null);

// F58 (2026-06-24): bumped storage-key v1 (klemeg:*) → v2 (babyora:*:v2).
// Eksisterende brukere får ny onboarding (per Sivert valg). Gammel data ignoreres uten å slettes.
const STORAGE_KEY = 'babyora:children:v2';
const ACTIVE_KEY = 'babyora:activeChildId:v2';

// Demo-data — kun aktiv ved ?seed=demo
const DEMO_CHILDREN: Child[] = [
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

const AVATAR_COLORS = ['#C25450', '#4F8A6A', '#2E7CC2', '#D87A2E', '#8B5A8C', '#5B6470'];

function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('seed');
}

function loadFromStorage(): Child[] {
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

function saveToStorage(children: Child[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(children));
  } catch {
    // Quota full / privacy-mode — ignorer
  }
}

function loadActiveId(fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  try {
    return localStorage.getItem(ACTIVE_KEY) || fallback;
  } catch {
    return fallback;
  }
}

function saveActiveId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    // ignorer
  }
}

export function ChildrenProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Child[]>(() => {
    if (isDemoMode()) return DEMO_CHILDREN;
    return loadFromStorage();
  });
  const [activeId, setActiveIdState] = useState<string>(() => {
    const initial = list[0]?.id ?? '';
    return loadActiveId(initial);
  });

  // Persist endringer i list
  useEffect(() => {
    if (!isDemoMode()) saveToStorage(list);
  }, [list]);

  // Persist activeId
  useEffect(() => {
    if (activeId) saveActiveId(activeId);
  }, [activeId]);

  const needsOnboarding = list.length === 0;

  const active = useMemo(
    () => list.find((c) => c.id === activeId) ?? list[0] ?? PLACEHOLDER_CHILD,
    [list, activeId],
  );

  const setActiveId = useCallback((id: string) => {
    setActiveIdState(id);
  }, []);

  const addChild = useCallback((child: Omit<Child, 'id'>) => {
    const id = `child-${Date.now()}`;
    setList((prev) => [...prev, { ...child, id }]);
  }, []);

  const updateChild = useCallback(
    (id: string, patch: Partial<Omit<Child, 'id'>>) => {
      setList((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    },
    [],
  );

  const removeChild = useCallback((id: string) => {
    setList((prev) => {
      const next = prev.filter((c) => c.id !== id);
      return next; // Onboarding trigges automatisk hvis next.length === 0
    });
    setActiveIdState((current) => (current === id ? list[0]?.id ?? '' : current));
  }, [list]);

  const completeOnboarding = useCallback((firstChild: Omit<Child, 'id'>) => {
    const id = `child-${Date.now()}`;
    const child: Child = {
      ...firstChild,
      id,
      color: firstChild.color || AVATAR_COLORS[0]!,
    };
    setList([child]);
    setActiveIdState(id);
    // Trial-start markeres i useAccess-hook ved hasAccess-første-sjekk
  }, []);

  const resetAll = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACTIVE_KEY);
      localStorage.removeItem('klemeg:trialStartedAt');
    } catch {
      // ignorer
    }
    setList([]);
    setActiveIdState('');
  }, []);

  const value: ChildrenStore = useMemo(
    () => ({
      children: list,
      activeId,
      active,
      needsOnboarding,
      setActiveId,
      addChild,
      updateChild,
      removeChild,
      completeOnboarding,
      resetAll,
    }),
    [list, activeId, active, needsOnboarding, setActiveId, addChild, updateChild, removeChild, completeOnboarding, resetAll],
  );

  return <ChildrenContext.Provider value={value}>{children}</ChildrenContext.Provider>;
}

export function useChildren(): ChildrenStore {
  const ctx = useContext(ChildrenContext);
  if (!ctx) throw new Error('useChildren må brukes innenfor <ChildrenProvider>');
  return ctx;
}
