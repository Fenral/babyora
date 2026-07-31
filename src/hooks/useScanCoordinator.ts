/**
 * useScanCoordinator — React-hook-wrapper rundt lib/scan/coordinator (P3).
 *
 * Mirrors API-formen til useOutfitTransitionCoordinator (hooks/
 * useOutfitTransitionCoordinator.ts): ett coordinator-objekt memoisert for
 * komponentens levetid, `state` synkronisert via useSyncExternalStore, og
 * resten av coordinator-metodene spredt rett inn i returverdien slik at
 * kallere kan skrive `scan.scanStarted(identity)` osv.
 *
 * P3 er REN state-maskin — denne hooken har INGEN eksterne bindinger
 * (ingen vær-/native-settings-/DOM-lifecycle-kobling). Slik kobling er P4
 * sitt ansvar; HjemScreen bruker ikke denne hooken ennå.
 */
import { useMemo, useSyncExternalStore } from 'react';
import {
  createScanCoordinator,
  type ScanCoordinator,
  type ScanCoordinatorState,
} from '../lib/scan/coordinator.js';

export type UseScanCoordinatorResult = ScanCoordinator & Readonly<{
  state: ScanCoordinatorState;
}>;

export function useScanCoordinator(): UseScanCoordinatorResult {
  const coordinator = useMemo(() => createScanCoordinator(), []);
  const state = useSyncExternalStore(
    coordinator.subscribe,
    coordinator.getState,
    coordinator.getState,
  );

  return useMemo(
    () => Object.freeze({ ...coordinator, state }),
    [coordinator, state],
  );
}
