import { describe, expect, it, vi } from 'vitest';
import { createHapticSystem, type HapticNativeModule } from '../system.js';

function createNativeModule(calls: string[]): HapticNativeModule {
  return {
    Haptics: {
      selectionStart: vi.fn(async () => { calls.push('selectionStart'); }),
      selectionChanged: vi.fn(async () => { calls.push('selectionChanged'); }),
      selectionEnd: vi.fn(async () => { calls.push('selectionEnd'); }),
      impact: vi.fn(async ({ style }: { style: unknown }) => { calls.push(`impact:${String(style)}`); }),
      notification: vi.fn(async ({ type }: { type: unknown }) => { calls.push(`notification:${String(type)}`); }),
    },
    ImpactStyle: { Light: 'light', Medium: 'medium' },
    NotificationType: { Success: 'success' },
  };
}

function createSystem(options: {
  hapticsOn?: boolean;
  reducedMotion?: boolean;
  native?: boolean;
  module?: HapticNativeModule | null;
}) {
  const calls: string[] = [];
  const nativeModule = options.module ?? createNativeModule(calls);
  const loadNativeModule = vi.fn(async () => nativeModule);
  const system = createHapticSystem({
    platform: { isNative: () => options.native ?? true },
    loadNativeModule,
    settings: {
      isHapticsOn: () => options.hapticsOn ?? true,
      isReducedMotion: () => options.reducedMotion ?? false,
    },
  });

  return { calls, loadNativeModule, nativeModule, system };
}

describe('native-only haptic system', () => {
  it('maps selection to the full native selection sequence in order', async () => {
    const { calls, system } = createSystem({});

    await system.fire('selection');

    expect(calls).toEqual(['selectionStart', 'selectionChanged', 'selectionEnd']);
  });

  it('always attempts selectionEnd when selectionChanged fails', async () => {
    const calls: string[] = [];
    const nativeModule = createNativeModule(calls);
    nativeModule.Haptics.selectionChanged = vi.fn(async () => {
      calls.push('selectionChanged');
      throw new Error('plugin error');
    });
    const { system } = createSystem({ module: nativeModule });

    await expect(system.fire('selection')).resolves.toBeUndefined();

    expect(calls).toEqual(['selectionStart', 'selectionChanged', 'selectionEnd']);
  });

  it('uses the native primitives for the remaining tiers', async () => {
    const { calls, system } = createSystem({});

    await system.fire('light');
    await system.fire('medium');
    await system.fire('success');

    expect(calls).toEqual(['impact:light', 'impact:medium', 'notification:success']);
  });

  it('keeps haptics independent from the reduced-motion preference', async () => {
    const { calls, system } = createSystem({ reducedMotion: true });

    await system.fire('light');

    expect(calls).toEqual(['impact:light']);
  });

  it('does nothing when the haptics preference is off', async () => {
    const { calls, loadNativeModule, system } = createSystem({ hapticsOn: false });

    await system.fire('medium');

    expect(calls).toEqual([]);
    expect(loadNativeModule).not.toHaveBeenCalled();
  });

  it('is a silent no-op on web and when the native plugin is unavailable', async () => {
    const web = createSystem({ native: false });
    const unavailable = createSystem({ module: null });

    await expect(web.system.fire('success')).resolves.toBeUndefined();
    await expect(unavailable.system.fire('success')).resolves.toBeUndefined();

    expect(web.loadNativeModule).not.toHaveBeenCalled();
    expect(unavailable.calls).toEqual([]);
  });

  it('prepares only the native plugin and does so idempotently', async () => {
    const native = createSystem({});
    const web = createSystem({ native: false });

    await native.system.prepare();
    await native.system.prepare();
    await web.system.prepare();

    expect(native.loadNativeModule).toHaveBeenCalledTimes(1);
    expect(web.loadNativeModule).not.toHaveBeenCalled();
  });

  it('contains no browser-vibration fallback', async () => {
    const source = (await import('../system.ts?raw') as { default: string }).default;

    expect(source).not.toMatch(/navigator\s*\.\s*vibrate|WEB_VIBRATE_PATTERNS/u);
  });
});
