/**
 * ChildrenProvider — context-provider for barn-state.
 *
 * R3 (2026-07-14): flyttet ut av children-store.tsx slik at store-filen kun
 * eksporterer ikke-komponenter (react-refresh/only-export-components).
 * All logikk/state-API er uendret; kun filplassering. Montert i src/main.tsx.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { prepareChildForPersistence, prepareChildUpdate } from './child-profile';
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
  const listRef = useRef(list);
  const [activeId, setActiveIdState] = useState<string>(() => {
    const initial = list[0]?.id ?? '';
    return loadActiveId(initial, list.map(({ id }) => id));
  });

  // Persist endringer i list
  useEffect(() => {
    if (!isDemoMode()) saveToStorage(list);
  }, [list]);

  // Persist activeId
  useEffect(() => {
    if (activeId && list.some((child) => child.id === activeId)) saveActiveId(activeId);
  }, [activeId, list]);

  const needsOnboarding = list.length === 0;

  const active = useMemo(
    () => list.find((c) => c.id === activeId) ?? list[0] ?? PLACEHOLDER_CHILD,
    [list, activeId],
  );

  const setActiveId = useCallback((id: string) => {
    if (listRef.current.some((child) => child.id === id)) setActiveIdState(id);
  }, []);

  const addChild = useCallback((child: Omit<Child, 'id'>) => {
    const id = `child-${Date.now()}`;
    const prepared = prepareChildForPersistence({ ...child, id });
    if (!prepared) return false;
    const next = [...listRef.current, prepared];
    listRef.current = next;
    setList(next);
    return true;
  }, []);

  const updateChild = useCallback(
    (id: string, patch: Partial<Omit<Child, 'id'>>) => {
      const current = listRef.current.find((child) => child.id === id);
      if (!current) return false;
      const prepared = prepareChildUpdate(current, patch);
      if (!prepared) return false;
      const next = listRef.current.map((child) => (child.id === id ? prepared : child));
      listRef.current = next;
      setList(next);
      return true;
    },
    [],
  );

  const removeChild = useCallback((id: string) => {
    const next = listRef.current.filter((child) => child.id !== id);
    listRef.current = next;
    setList(next);
    setActiveIdState((current) => (current === id ? next[0]?.id ?? '' : current));
  }, []);

  const completeOnboarding = useCallback((firstChild: Omit<Child, 'id'>) => {
    const id = `child-${Date.now()}`;
    const child = prepareChildForPersistence({
      ...firstChild,
      id,
      color: firstChild.color || AVATAR_COLORS[0]!,
    });
    if (!child) return false;
    listRef.current = [child];
    setList([child]);
    setActiveIdState(id);
    // Trial-start markeres i useAccess-hook ved hasAccess-første-sjekk
    return true;
  }, []);

  const resetAll = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACTIVE_KEY);
      localStorage.removeItem('klemeg:trialStartedAt');
    } catch {
      // ignorer
    }
    listRef.current = [];
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
