/**
 * location-pref-store — persistert preferanse for "Bruk posisjon automatisk"
 * (Babyora).
 *
 * Brukes av:
 *  - InnstillingerScreen (toggle + permission-dialog for auto-location)
 *
 * Modes:
 *  - 'auto'   — Babyora bruker navigator.geolocation til å hente koordinater
 *               og oppdaterer aktivt barns lat/lon i children-store.
 *  - 'manual' — Brukeren har valgt sted manuelt (default, mest forutsigbart).
 *
 * Selve geolocation-flyten (navigator.geolocation.getCurrentPosition,
 * permission-fallback, oppdatering av children-store) ligger i en hook/handler
 * i InnstillingerScreen — denne storen er KUN preferanse-state.
 *
 * Persistert format (zustand/persist v4):
 *   { state: { mode: 'auto' | 'manual' }, version: 0 }
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LocationMode = 'auto' | 'manual';

export type LocationPrefState = {
  /** Hvordan vi henter brukerens posisjon. Default 'manual'. */
  mode: LocationMode;
  setMode: (next: LocationMode) => void;
};

export const useLocationPref = create<LocationPrefState>()(
  persist(
    (set) => ({
      mode: 'manual',
      setMode: (next) => set({ mode: next }),
    }),
    { name: 'babyora.location-pref' },
  ),
);
