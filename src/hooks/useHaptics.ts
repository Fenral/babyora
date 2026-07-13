/**
 * useHaptics — Capacitor Haptics-wrapper for native-app-feel mikrointeraksjoner.
 *
 * A11y-spec (mandatory per a11y-lead):
 *  - Haptics er ALDRI eneste signal — visuell feedback må alltid være primær
 *  - Silent fail på web/uten permission (returnerer uten å kaste)
 *  - Lazy-import for å unngå at @capacitor/haptics bryter web-build
 */
import { useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

type HapticStyle = 'light' | 'medium' | 'heavy';

export function useHaptics() {
  const impact = useCallback(async (style: HapticStyle = 'light') => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      const styleMap = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      };
      await Haptics.impact({ style: styleMap[style] });
    } catch {
      // Silent fail på web/uten haptics-permission — visuell feedback er primær
    }
  }, []);

  const selection = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const { Haptics } = await import('@capacitor/haptics');
      await Haptics.selectionStart();
      await Haptics.selectionEnd();
    } catch {
      // Silent fail
    }
  }, []);

  return { impact, selection };
}

export default useHaptics;
