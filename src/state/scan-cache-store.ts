/**
 * scan-cache-store — persistert scan-resultat-cache per barn (Hjem P3).
 *
 * Holder ÉN ScanCacheSlot per barn: identiteten (barn+lokal dato+sted+
 * aktivitet+motor-versjon, se lib/scan/types.ts) scan-resultatet ble
 * beregnet for, resultKey-fingerprinten (gjenbruker HjemScreen sin
 * "current-finalized"-fingerprint via lib/scan/result-key.ts), tidspunktet
 * beregningen fullførte, og om full 2.1s scan-koreografi allerede er spilt
 * for barnet i dag.
 *
 * P3 er REN lager-kode — ingen UI-kobling her (det er P4). HjemScreen bruker
 * ikke denne storen ennå og er uendret av denne pakken.
 *
 * Persistens følger samme mønster som location-pref-store.ts: default
 * localStorage-storage (zustand/persist) er SYNKRON — cachet resultat er
 * derfor tilgjengelig FØR første render, trygt for native kill/resume (ingen
 * async race mot Capacitor Preferences/IndexedDB). partialize/merge validerer
 * strengt ved rehydrering slik at korrupt/manipulert localStorage-innhold
 * faller tilbake til tom cache i stedet for å krasje.
 *
 * Persistert format (zustand/persist v4):
 *   { state: { slots: Record<childId, ScanCacheSlot> }, version: 0 }
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  isScanCacheSlot,
  sameScanIdentity,
  type ScanCacheSlot,
  type ScanIdentity,
} from '../lib/scan/types.js';

export type ScanCacheState = Readonly<{
  slots: Readonly<Record<string, ScanCacheSlot>>;
  /** Lagrer/overskriver slotten for slot.identity.childId. */
  commitSlot: (slot: ScanCacheSlot) => void;
  /** No-op hvis ingen slot finnes for barnet, eller den allerede er markert spilt. */
  markScanPlayed: (childId: string) => void;
  clearSlotForChild: (childId: string) => void;
  clearAll: () => void;
}>;

export type PersistedScanCache = Readonly<{
  slots: Readonly<Record<string, ScanCacheSlot>>;
}>;

function isValidSlotRecord(
  value: unknown,
): value is Record<string, ScanCacheSlot> {
  if (typeof value !== 'object' || value === null) return false;
  return Object.entries(value as Record<string, unknown>).every(
    ([childId, slot]) => (
      typeof childId === 'string'
      && childId.length > 0
      && isScanCacheSlot(slot)
      && slot.identity.childId === childId
    ),
  );
}

export function partializeScanCache(
  state: ScanCacheState,
): PersistedScanCache {
  return { slots: state.slots };
}

export function mergeScanCache(
  persisted: unknown,
  current: ScanCacheState,
): ScanCacheState {
  const record = typeof persisted === 'object' && persisted !== null
    ? persisted as Record<string, unknown>
    : null;
  const storedSlots = record !== null && isValidSlotRecord(record.slots)
    ? record.slots
    : current.slots;
  return { ...current, slots: storedSlots };
}

/** Ren transformasjon — brukt både av store-actionen under og av testene. */
export function markScanPlayed(slot: ScanCacheSlot): ScanCacheSlot {
  if (slot.scanPlayedInFullToday) return slot;
  return Object.freeze({ ...slot, scanPlayedInFullToday: true });
}

/**
 * Eksakt match på alle identitetsfelt (barn, dato, sted, aktivitet,
 * motor-versjon). Enhver forskjell — inkludert dato-rollover eller en
 * motor-versjon-bump — gir `null`, aldri en stale/feilaktig slot.
 */
export function getSlotForIdentity(
  slots: Readonly<Record<string, ScanCacheSlot>>,
  identity: ScanIdentity,
): ScanCacheSlot | null {
  const slot = slots[identity.childId];
  if (slot === undefined) return null;
  return sameScanIdentity(slot.identity, identity) ? slot : null;
}

/**
 * true når det IKKE finnes en cachet slot for dagens dato (ingen slot i det
 * hele tatt, ELLER slotten er fra en tidligere dato — dato-rollover).
 * Kun dato sammenlignes her (ikke resten av identiteten) — det er
 * "har vi vist scan-koreografien for dette barnet i dag ennå" som
 * shouldPlayFullScan svarer på, ikke "matcher cachen eksakt".
 */
export function shouldPlayFullScan(
  slot: ScanCacheSlot | null,
  identity: ScanIdentity,
): boolean {
  if (slot === null) return true;
  return slot.identity.dateKey !== identity.dateKey;
}

export const useScanCache = create<ScanCacheState>()(
  persist(
    (set) => ({
      slots: {},
      commitSlot: (slot) => set((current) => ({
        slots: { ...current.slots, [slot.identity.childId]: slot },
      })),
      markScanPlayed: (childId) => set((current) => {
        const existing = current.slots[childId];
        if (existing === undefined || existing.scanPlayedInFullToday) {
          return current;
        }
        return {
          slots: {
            ...current.slots,
            [childId]: markScanPlayed(existing),
          },
        };
      }),
      clearSlotForChild: (childId) => set((current) => {
        if (!(childId in current.slots)) return current;
        const next = { ...current.slots };
        delete next[childId];
        return { slots: next };
      }),
      clearAll: () => set({ slots: {} }),
    }),
    {
      name: 'babyora.scan-cache',
      partialize: partializeScanCache,
      merge: mergeScanCache,
    },
  ),
);
