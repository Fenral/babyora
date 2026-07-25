/**
 * Native-only haptics. The adapter owns platform dispatch; callers own the
 * product decision about which cue to request.
 */
import { useCallback, useEffect, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { useNativeSettings } from '../../hooks/useNativeSettings';

export type HapticTier = 'selection' | 'light' | 'medium' | 'success';

export interface HapticNativeModule {
  Haptics: {
    selectionStart: () => Promise<void>;
    selectionChanged: () => Promise<void>;
    selectionEnd: () => Promise<void>;
    impact: (options: { style: unknown }) => Promise<void>;
    notification: (options: { type: unknown }) => Promise<void>;
  };
  ImpactStyle: { Light: unknown; Medium: unknown };
  NotificationType: { Success: unknown };
}

export interface HapticSystemAdapters {
  platform: Readonly<{ isNative: () => boolean }>;
  loadNativeModule: () => Promise<HapticNativeModule | null>;
  settings: Readonly<{
    isHapticsOn: () => boolean;
    /** Deliberately separate: reduced motion only changes visual motion. */
    isReducedMotion: () => boolean;
  }>;
}

export interface HapticSystem {
  fire: (tier: HapticTier) => Promise<void>;
  prepare: () => Promise<void>;
}

/**
 * Creates an injectable native adapter for Node tests and the production hook.
 * It never uses a browser vibration fallback and silently absorbs unavailable
 * plugins and native errors.
 */
export function createHapticSystem(adapters: HapticSystemAdapters): HapticSystem {
  let prepared = false;
  let moduleLoaded = false;
  let nativeModule: HapticNativeModule | null = null;

  const loadNativeModule = async (): Promise<HapticNativeModule | null> => {
    if (moduleLoaded) return nativeModule;
    moduleLoaded = true;
    try {
      nativeModule = await adapters.loadNativeModule();
    } catch {
      nativeModule = null;
    }
    return nativeModule;
  };

  const fire = async (tier: HapticTier): Promise<void> => {
    if (!adapters.settings.isHapticsOn() || !adapters.platform.isNative()) return;

    const module = await loadNativeModule();
    if (!module) return;

    const { Haptics, ImpactStyle, NotificationType } = module;
    try {
      switch (tier) {
        case 'selection':
          try {
            await Haptics.selectionStart();
            await Haptics.selectionChanged();
          } finally {
            try {
              await Haptics.selectionEnd();
            } catch {
              // Native plugin failure is intentionally a no-op.
            }
          }
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
      // Native plugin failure is intentionally a no-op.
    }
  };

  const prepare = async (): Promise<void> => {
    if (prepared) return;
    prepared = true;
    if (adapters.platform.isNative()) await loadNativeModule();
  };

  return { fire, prepare };
}

let capacitorModule: HapticNativeModule | null | undefined;

async function loadCapacitorHaptics(): Promise<HapticNativeModule | null> {
  if (capacitorModule !== undefined) return capacitorModule;
  try {
    capacitorModule = await import('@capacitor/haptics') as unknown as HapticNativeModule;
  } catch {
    capacitorModule = null;
  }
  return capacitorModule;
}

const productionHaptics = createHapticSystem({
  platform: { isNative: () => Capacitor.isNativePlatform() },
  loadNativeModule: loadCapacitorHaptics,
  settings: {
    isHapticsOn: () => true,
    isReducedMotion: () => false,
  },
});

/** Native-only direct dispatch for non-React callers. */
export const fire = productionHaptics.fire;

/** Idempotently warms the native plugin when a native shell is present. */
export const prepare = productionHaptics.prepare;

/**
 * React wrapper which applies the user's explicit haptics choice. Reduced
 * motion remains a visual setting and must not suppress separately enabled
 * tactile feedback.
 */
export function useHapticSystem(): HapticSystem {
  const { hapticsOn } = useNativeSettings();

  useEffect(() => {
    void prepare();
  }, []);

  const guardedFire = useCallback(
    async (tier: HapticTier): Promise<void> => {
      if (!hapticsOn) return;
      await fire(tier);
    },
    [hapticsOn],
  );

  return useMemo<HapticSystem>(
    () => ({ fire: guardedFire, prepare }),
    [guardedFire],
  );
}

export default useHapticSystem;
