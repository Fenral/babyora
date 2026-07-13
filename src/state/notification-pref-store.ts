/**
 * notification-pref-store — persistert preferanse for morgenvarsel og
 * værendring-varsel (Babyora).
 *
 * Brukes av:
 *  - InnstillingerScreen (toggles + tidspunkt-modal for morgenvarsel)
 *
 * Persistert format (zustand/persist v4):
 *   { state: { morning: boolean, weatherChange: boolean, morningHour: number },
 *     version: 0 }
 *
 * Selve tillatelses-flyten (Notification.requestPermission / Capacitor
 * LocalNotifications.requestPermissions) og scheduling ligger i en egen
 * helper — denne storen er KUN preferanse-state.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationPrefState = {
  /** Skru på morgenvarsel (sender daglig kl. morningHour). */
  morning: boolean;
  /** Skru på værendring-varsel (når temp. faller > 5°). */
  weatherChange: boolean;
  /** Time-på-døgnet (0–23) for morgenvarsel. Default 07. */
  morningHour: number;
  setMorning: (next: boolean) => void;
  setWeatherChange: (next: boolean) => void;
  setMorningHour: (hour: number) => void;
};

export const useNotificationPref = create<NotificationPrefState>()(
  persist(
    (set) => ({
      morning: false,
      weatherChange: false,
      morningHour: 7,
      setMorning: (next) => set({ morning: next }),
      setWeatherChange: (next) => set({ weatherChange: next }),
      setMorningHour: (hour) =>
        set({ morningHour: Math.min(23, Math.max(0, Math.round(hour))) }),
    }),
    { name: 'babyora.notifications' },
  ),
);
