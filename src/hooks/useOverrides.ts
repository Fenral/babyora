/**
 * B-1 (2026-06-12): bruker-overrides for «bytt plagg»-flow.
 *
 * Lagrer per-økt-overrides per (childId, day-of-year, kategori) i sessionStorage.
 * Auto-expires neste dag — hvis dato har endret seg ved last, slett alle.
 *
 * Brukes av HomeScreen til å sende overrides inn i recommend() og av
 * LayerDetailSheet til å lagre bruker-valg.
 */

import { useCallback, useState } from 'react';
import type { LayerOverrides } from '../lib/wool-layers/types.js';
import type { LayerId } from '../lib/outfit-state';

export const KEY_PREFIX = 'babyora:overrides:';

export interface StoredOverride {
  items: string[];
  /** Hva motoren foreslo opprinnelig — brukes til angre. */
  original: string[];
  /** YYYY-MM-DD når overstyringen ble satt — slettes ved ny dag. */
  date: string;
}

export type StoredOverrides = Partial<Record<LayerId, StoredOverride>>;

export function today(): string {
  // Bruker ikke Date.now() direkte for å unngå auto-loop-skikker; men her er
  // det OK siden vi henter dato til persistens-keying.
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function load(childId: string): StoredOverrides {
  try {
    const raw = sessionStorage.getItem(KEY_PREFIX + childId);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredOverrides;
    const now = today();
    const fresh: StoredOverrides = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v && v.date === now) fresh[k as LayerId] = v;
    }
    return fresh;
  } catch {
    return {};
  }
}

function save(childId: string, overrides: StoredOverrides): void {
  try {
    sessionStorage.setItem(KEY_PREFIX + childId, JSON.stringify(overrides));
  } catch {
    // sessionStorage full/disabled — silently fail (UI vil vise via state)
  }
}

export interface OverridesAPI {
  /** Aktiv overrides klar for `recommend(..., { overrides })`. */
  forEngine: LayerOverrides;
  /** Detaljert state (inkluderer original og date) for UI. */
  state: StoredOverrides;
  /** Sett override for én kategori. */
  set(layerId: LayerId, items: string[], original: string[]): void;
  /** Fjern override for én kategori (angre). */
  clear(layerId: LayerId): void;
  /** Fjern alle overrides (for child-bytte eller manuell reset). */
  clearAll(): void;
}

export function useOverrides(childId: string | undefined): OverridesAPI {
  const [state, setState] = useState<StoredOverrides>(() =>
    childId ? load(childId) : {},
  );

  // Re-load hvis childId endrer seg.
  // R3 (2026-07-14): render-justering (React-dokumentert mønster) i stedet
  // for sync setState i effect — samme resultat, én render tidligere.
  const [lastChildId, setLastChildId] = useState(childId);
  if (lastChildId !== childId) {
    setLastChildId(childId);
    setState(childId ? load(childId) : {});
  }

  const set = useCallback(
    (layerId: LayerId, items: string[], original: string[]) => {
      if (!childId) return;
      setState((prev) => {
        const next = {
          ...prev,
          [layerId]: { items, original, date: today() },
        };
        save(childId, next);
        return next;
      });
    },
    [childId],
  );

  const clear = useCallback(
    (layerId: LayerId) => {
      if (!childId) return;
      setState((prev) => {
        const next = { ...prev };
        delete next[layerId];
        save(childId, next);
        return next;
      });
    },
    [childId],
  );

  const clearAll = useCallback(() => {
    if (!childId) return;
    sessionStorage.removeItem(KEY_PREFIX + childId);
    setState({});
  }, [childId]);

  const forEngine: LayerOverrides = {};
  for (const [k, v] of Object.entries(state)) {
    if (v) forEngine[k as LayerId] = v.items;
  }

  return { forEngine, state, set, clear, clearAll };
}
