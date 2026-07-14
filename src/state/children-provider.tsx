/**
 * ChildrenProvider — context-provider for barn-state.
 *
 * R3 (2026-07-14): flyttet ut av children-store.tsx slik at store-filen kun
 * eksporterer ikke-komponenter (react-refresh/only-export-components).
 * All logikk/state-API er uendret; kun filplassering. Montert i src/main.tsx.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ACTIVE_KEY,
  AVATAR_COLORS,
  ChildrenContext,
  DEMO_CHILDREN,
  PLACEHOLDER_CHILD,
  STORAGE_KEY,
  isDemoMode,
  loadActiveId,
  loadFromStorage,
  saveActiveId,
  saveToStorage,
  type Child,
  type ChildrenStore,
} from './children-store';

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
