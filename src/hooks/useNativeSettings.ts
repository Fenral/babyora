/**
 * useNativeSettings — F37 (Sivert 2026-06-21): in-app overrides for native-feel.
 *
 * A11y-lead krav (mandatory, ikke retrofit):
 *  1. Reduser bevegelse: default følg OS (prefers-reduced-motion), override mulig
 *  2. Vibrasjon ved trykk: default ON iOS, OFF Android (platform-konvensjon)
 *
 * State persistes i localStorage. Custom-event for cross-component re-render.
 */
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

const STORAGE_PREFIX = 'native-settings:';
const CHANGE_EVENT = 'native-settings:changed';

type MotionPref = 'system' | 'reduce' | 'allow';
type HapticsPref = 'on' | 'off';

function osPrefersReduced(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function defaultHaptics(): HapticsPref {
  return Capacitor.getPlatform() === 'ios' ? 'on' : 'off';
}

function readMotion(): MotionPref {
  try {
    const v = window.localStorage.getItem(STORAGE_PREFIX + 'motion');
    if (v === 'reduce' || v === 'allow' || v === 'system') return v;
    return 'system';
  } catch {
    return 'system';
  }
}

/**
 * Eksportert (ikke bare intern til hooken) slik at ikke-React-kallere kan
 * lese preferansen synkront — brukt av lib/haptics.ts (P9 duel §3 scan/
 * kjøps-vokabularet), som må gate hver enkelt haptikk-dispatch mot samme
 * "vibrasjon ved trykk"-innstilling som resten av appen, uten å kunne
 * kalle en React-hook fra sine rene funksjoner.
 */
export function readHaptics(): HapticsPref {
  try {
    const v = window.localStorage.getItem(STORAGE_PREFIX + 'haptics');
    if (v === 'on' || v === 'off') return v;
    return defaultHaptics();
  } catch {
    return defaultHaptics();
  }
}

export function setNativeSetting(key: 'motion' | 'haptics', value: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_PREFIX + key, value);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key, value } }));
}

export interface NativeSettings {
  /** True hvis motion skal være redusert (følger override eller OS) */
  reducedMotion: boolean;
  /** True hvis haptics skal trigge */
  hapticsOn: boolean;
  /** Raw motion-pref for Settings-UI */
  motionPref: MotionPref;
  /** Raw haptics-pref for Settings-UI */
  hapticsPref: HapticsPref;
}

export function useNativeSettings(): NativeSettings {
  const [motionPref, setMotionPref] = useState<MotionPref>(() =>
    typeof window === 'undefined' ? 'system' : readMotion(),
  );
  const [hapticsPref, setHapticsPref] = useState<HapticsPref>(() =>
    typeof window === 'undefined' ? defaultHaptics() : readHaptics(),
  );
  const [osReduced, setOsReduced] = useState<boolean>(() =>
    typeof window === 'undefined' ? false : osPrefersReduced(),
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => {
      setMotionPref(readMotion());
      setHapticsPref(readHaptics());
    };
    window.addEventListener('storage', handler);
    window.addEventListener(CHANGE_EVENT, handler);

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mqlHandler = () => setOsReduced(mql.matches);
    mql.addEventListener('change', mqlHandler);

    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener(CHANGE_EVENT, handler);
      mql.removeEventListener('change', mqlHandler);
    };
  }, []);

  const reducedMotion =
    motionPref === 'reduce' ? true : motionPref === 'allow' ? false : osReduced;
  const hapticsOn = hapticsPref === 'on';

  return { reducedMotion, hapticsOn, motionPref, hapticsPref };
}
