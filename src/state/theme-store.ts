/**
 * theme-store — auto/light/dark theme-mode med persistens.
 *
 * Mineral Garden (eier 2026-08-08): nye installasjoner starter i lys modus.
 * Auto og mørk beholdes som eksplisitte brukervalg; en lagret preferanse
 * vinner alltid over standarden.
 *
 * Brukes av:
 *  - App.tsx (useEffect → setter data-theme på <html>)
 *  - InnstillingerScreen (theme-toggle)
 *  - boot-scriptet i index.html (leser localStorage["babyora.theme"]
 *    før React mounter for å unngå FOUC)
 *
 * Persistert format (zustand/persist v4):
 *   { state: { mode: "auto" | "light" | "dark" }, version: 0 }
 *
 * VIKTIG: hvis denne nøkkelen ("babyora.theme") eller mode-typen endres,
 * må boot-scriptet i index.html oppdateres i samme commit.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'auto' | 'light' | 'dark';

export type ThemeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light',
      setMode: (mode) => set({ mode }),
    }),
    { name: 'babyora.theme' },
  ),
);
