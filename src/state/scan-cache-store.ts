/**
 * scan-cache-store — persistert scan-resultat-cache per barn (Hjem P3).
 *
 * Holder ÉN ScanCacheSlot per barn: identiteten (barn+lokal dato+sted+
 * aktivitet+motor-versjon, se lib/scan/types.ts) scan-resultatet ble
 * beregnet for, resultKey-fingerprinten (gjenbruker HjemScreen sin
 * "current-finalized"-fingerprint via lib/scan/result-key.ts), tidspunktet
 * beregningen fullførte, og om full 2.1s scan-koreografi allerede er spilt
 * for barnet i dag (`ScanCacheSlot.scanPlayedInFullToday` — beholdt for
 * bakoverkompatibilitet/migrering, se `hasPlayedFullScanEver` under).
 *
 * P9 (docs/design-notes/sol-duel-2026-07-31.md §2): full scan-koreografien
 * spilles nå «første gang noensinne», ikke «første gang i dag» — dette
 * håndheves av `hasPlayedFullScanEver`, ETT felt for HELE storen (ikke per
 * barn/slot, i motsetning til det gamle per-dag-feltet), pluss
 * `markFullScanPlayedEver()`. Migrering fra pre-P9-lagret tilstand: hvis
 * ingen eksplisitt `hasPlayedFullScanEver` finnes i det persisterte
 * JSON-et, men MINST ÉN eksisterende slot allerede har
 * `scanPlayedInFullToday: true`, avledes flagget til `true` — en
 * eksisterende bruker som allerede har sittet gjennom minst én daglig
 * full-koreografi før oppdateringen, skal ALDRI vises "første gang
 * noensinne"-intro-en på nytt (se `mergeScanCache`).
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
 *   { state: { slots: Record<childId, ScanCacheSlot>,
 *              hasPlayedFullScanEver: boolean }, version: 0 }
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
  /** P9 (duel §2): har den 1,1s full-koreografien blitt spilt NOENSINNE (ikke per dag)? */
  hasPlayedFullScanEver: boolean;
  /** Lagrer/overskriver slotten for slot.identity.childId. */
  commitSlot: (slot: ScanCacheSlot) => void;
  /** No-op hvis ingen slot finnes for barnet, eller den allerede er markert spilt. */
  markScanPlayed: (childId: string) => void;
  /** P9: setter livstids-flagget. Idempotent — no-op hvis allerede sann. */
  markFullScanPlayedEver: () => void;
  clearSlotForChild: (childId: string) => void;
  clearAll: () => void;
}>;

export type PersistedScanCache = Readonly<{
  slots: Readonly<Record<string, ScanCacheSlot>>;
  hasPlayedFullScanEver: boolean;
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
  return { slots: state.slots, hasPlayedFullScanEver: state.hasPlayedFullScanEver };
}

/**
 * Migrering (pre-P9 → P9): eldre persistert JSON har ingen
 * `hasPlayedFullScanEver`-nøkkel i det hele tatt. I så fall avledes den fra
 * `storedSlots` — sann hvis MINST ÉN slot allerede har
 * `scanPlayedInFullToday: true` (se filhode-kommentaren). Rent hjelpe-
 * funksjon, testbar isolert.
 */
export function deriveHasPlayedFullScanEver(
  record: Record<string, unknown> | null,
  storedSlots: Readonly<Record<string, ScanCacheSlot>>,
): boolean {
  if (record !== null && typeof record.hasPlayedFullScanEver === 'boolean') {
    return record.hasPlayedFullScanEver;
  }
  return Object.values(storedSlots).some((slot) => slot.scanPlayedInFullToday === true);
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
  const hasPlayedFullScanEver = deriveHasPlayedFullScanEver(record, storedSlots);
  return { ...current, slots: storedSlots, hasPlayedFullScanEver };
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
 * P9 (duel §2): true når den 1,1s full-koreografien ALDRI har blitt spilt på
 * denne enheten — livstids-grense, ikke lenger en dags-grense (se
 * filhode-kommentaren for migreringen fra det gamle per-dag-feltet).
 */
export function shouldPlayFullScan(hasPlayedFullScanEver: boolean): boolean {
  return !hasPlayedFullScanEver;
}

export const useScanCache = create<ScanCacheState>()(
  persist(
    (set) => ({
      slots: {},
      hasPlayedFullScanEver: false,
      commitSlot: (slot) => set((current) => ({
        slots: { ...current.slots, [slot.identity.childId]: slot },
      })),
      markFullScanPlayedEver: () => set((current) => (
        current.hasPlayedFullScanEver ? current : { hasPlayedFullScanEver: true }
      )),
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
