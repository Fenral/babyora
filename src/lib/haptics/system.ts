/**
 * HaptikkSystem — BABYORA F60 4-tier haptic abstraction.
 *
 * Source spec: docs/F60-design/Haptikk-System.dc.html
 *
 * 4 tiers (iOS-canonical, mapped to Android + web vibrate fallback):
 *  1. SELECTION      — bytte verdi · bryter · valg i listen        (.selectionChanged)
 *  2. IMPACT-LIGHT   — navigasjon · åpne detaljer · gå tilbake     (.impactOccurred .light)
 *  3. IMPACT-MEDIUM  — primær handling (CTA)                       (.impactOccurred .medium)
 *  4. NOTIFICATION   — fullført                                    (.notificationOccurred .success)
 *
 * Wraps Capacitor @capacitor/haptics on native.
 * Web fallback: navigator.vibrate-patterns (best-effort, ignored by iOS Safari).
 *
 * A11y guard (per a11y-lead, inherited from useHaptics + useNativeSettings):
 *  - prefers-reduced-motion → ingen vibrasjon
 *  - hapticsPref === 'off' → ingen vibrasjon
 *  - Aldri eneste signal — alle kall-sites må ha visuell feedback
 *  - Silent fail på web/uten permission (returnerer aldri reject)
 *
 * Bruk:
 *   import { fire, prepare, useHapticSystem } from '@/lib/haptics/system';
 *   await fire('medium');                  // direkte
 *   const { fire } = useHapticSystem();    // hook m/ settings-respekt
 */
import { useCallback, useEffect, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { useNativeSettings } from '../../hooks/useNativeSettings';

// ─── Types ─────────────────────────────────────────────────────────────────
export type HapticTier = 'selection' | 'light' | 'medium' | 'success';

// ─── Web vibrate-patterns (ms) ─────────────────────────────────────────────
const WEB_VIBRATE_PATTERNS: Record<HapticTier, number | number[]> = {
  selection: 8,
  light: 13,
  medium: 22,
  success: [12, 55, 20],
};

// ─── Internal state ────────────────────────────────────────────────────────
let _prepared = false;
let _capacitorHapticsModule: typeof import('@capacitor/haptics') | null = null;

/**
 * Reduced-motion check (OS-level, used by module-level fire()).
 * Hook-level useHapticSystem() reads useNativeSettings for both motion & haptics-pref overrides.
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Lazy-load @capacitor/haptics. Cached after first successful import.
 * Returns null if module unavailable (web build, missing plugin).
 */
async function loadCapacitorHaptics(): Promise<typeof import('@capacitor/haptics') | null> {
  if (_capacitorHapticsModule) return _capacitorHapticsModule;
  try {
    _capacitorHapticsModule = await import('@capacitor/haptics');
    return _capacitorHapticsModule;
  } catch {
    return null;
  }
}

/**
 * Web fallback via navigator.vibrate. Best-effort: iOS Safari ignores; modern Android Chrome respects.
 */
function webVibrate(tier: HapticTier): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(WEB_VIBRATE_PATTERNS[tier]);
  } catch {
    // Silent fail
  }
}

/**
 * Native haptic via Capacitor. Maps 4-tier abstraction onto Capacitor primitives.
 */
async function nativeHaptic(tier: HapticTier): Promise<void> {
  const mod = await loadCapacitorHaptics();
  if (!mod) return;
  const { Haptics, ImpactStyle, NotificationType } = mod;
  try {
    switch (tier) {
      case 'selection':
        await Haptics.selectionStart();
        await Haptics.selectionEnd();
        return;
      case 'light':
        await Haptics.impact({ style: ImpactStyle.Light });
        return;
      case 'medium':
        await Haptics.impact({ style: ImpactStyle.Medium });
        return;
      case 'success':
        await Haptics.notification({ type: NotificationType.Success });
        return;
    }
  } catch {
    // Silent fail (permission, plugin missing, etc.)
  }
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Fire a haptic at the given tier. Module-level: respects OS reduced-motion but
 * NOT user-settings override (use useHapticSystem() inside React for that).
 *
 * Silent fail on all platforms — never throws, never rejects.
 */
export async function fire(tier: HapticTier): Promise<void> {
  if (prefersReducedMotion()) return;

  if (Capacitor.isNativePlatform()) {
    await nativeHaptic(tier);
    return;
  }

  webVibrate(tier);
}

/**
 * Preflight: warm the lazy Capacitor module so the first fire() has zero import-cost latency.
 * Safe to call multiple times — idempotent.
 *
 * Recommended: call once on app mount (e.g. in main App component useEffect).
 */
export async function prepare(): Promise<void> {
  if (_prepared) return;
  _prepared = true;

  if (Capacitor.isNativePlatform()) {
    // Warm the module cache
    await loadCapacitorHaptics();
  }
  // Web has nothing to preflight — navigator.vibrate is sync & built-in.
}

// ─── React hook ────────────────────────────────────────────────────────────

export interface HapticSystem {
  /**
   * Fire a haptic at the given tier. Respects user settings (hapticsOn) and reduced-motion.
   * Silent fail; never throws.
   */
  fire: (tier: HapticTier) => Promise<void>;
  /** Idempotent warm-up of native module. Safe to call on mount. */
  prepare: () => Promise<void>;
}

/**
 * React hook for the haptic system. Wires user-settings (useNativeSettings) so:
 *  - hapticsPref === 'off' → no-op
 *  - reducedMotion === true → no-op
 *  - Otherwise: delegates to module-level fire()
 *
 * Auto-prepares on mount.
 */
export function useHapticSystem(): HapticSystem {
  const { hapticsOn, reducedMotion } = useNativeSettings();

  useEffect(() => {
    // Fire-and-forget preflight on mount. Never throws.
    prepare().catch(() => {
      /* silent */
    });
  }, []);

  const guardedFire = useCallback(
    async (tier: HapticTier): Promise<void> => {
      if (!hapticsOn) return;
      if (reducedMotion) return;
      await fire(tier);
    },
    [hapticsOn, reducedMotion],
  );

  return useMemo<HapticSystem>(
    () => ({
      fire: guardedFire,
      prepare,
    }),
    [guardedFire],
  );
}

export default useHapticSystem;
