/**
 * ref-hour-store — referansetime for værbasert anbefaling (06/09/12/15/18/21).
 *
 * Brukes av:
 *  - Komponenter som trenger å vite hvilket tidspunkt anbefalingen gjelder
 *  - InnstillingerScreen (ref-hour-picker)
 *
 * Persistert format (zustand/persist v4):
 *   { state: { refHour: 6 | 9 | 12 | 15 | 18 | 21 }, version: 0 }
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RefHour = 6 | 9 | 12 | 15 | 18 | 21;

export type RefHourState = {
  refHour: RefHour;
  setRefHour: (refHour: RefHour) => void;
};

export const useRefHour = create<RefHourState>()(
  persist(
    (set) => ({
      refHour: 12,
      setRefHour: (refHour) => set({ refHour }),
    }),
    { name: 'babyora.refHour' },
  ),
);

export const setRefHour = (refHour: RefHour): void =>
  useRefHour.getState().setRefHour(refHour);
