/**
 * lib/haptics — P9 (duel §3) mapping-table + web/no-op safety.
 *
 * `fire`/`prepare` from lib/haptics/system.ts are mocked here so these
 * tests assert exactly ONE thing: that each named vocabulary function
 * requests the RIGHT underlying tier (the event→generator mapping table
 * from the design doc), gated by the same `hapticsOn` preference the rest
 * of the app uses. system.ts's own native-plugin plumbing (Capacitor
 * loading, try/catch, selection sequencing) is already covered by
 * lib/haptics/__tests__/system.test.ts and is deliberately NOT re-tested
 * here — that would just be re-asserting someone else's contract.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fireMock = vi.fn(async (_tier: string) => undefined);
const prepareMock = vi.fn(async () => undefined);
const readHapticsMock = vi.fn(() => 'on' as 'on' | 'off');

vi.mock('../haptics/system.js', () => ({
  fire: (tier: string) => fireMock(tier),
  prepare: () => prepareMock(),
}));
vi.mock('../../hooks/useNativeSettings.js', () => ({
  readHaptics: () => readHapticsMock(),
}));

describe('lib/haptics — mapping table (event → generator)', () => {
  beforeEach(() => {
    fireMock.mockClear();
    prepareMock.mockClear();
    readHapticsMock.mockReturnValue('on');
  });

  it.each([
    ['impactSoft', 'light'],
    ['impactMedium', 'medium'],
    ['selection', 'selection'],
    ['notifySuccess', 'success'],
    ['notifyError', 'error'],
  ] as const)('%s() requests the %s tier from the platform adapter', async (fnName, tier) => {
    const mod = await import('../haptics.js');
    await mod[fnName]();
    expect(fireMock).toHaveBeenCalledExactlyOnceWith(tier);
  });

  it('prepare() delegates to the platform adapter\'s own prepare(), ungated by hapticsOn (module warm-up, no felt pulse)', async () => {
    readHapticsMock.mockReturnValue('off');
    const mod = await import('../haptics.js');
    await mod.prepare();
    expect(prepareMock).toHaveBeenCalledOnce();
    expect(fireMock).not.toHaveBeenCalled();
  });
});

describe('lib/haptics — respects the hapticsOn preference', () => {
  beforeEach(() => {
    fireMock.mockClear();
    prepareMock.mockClear();
  });

  it('every felt-signal function no-ops (never calls the adapter) when the user has haptics off', async () => {
    readHapticsMock.mockReturnValue('off');
    const mod = await import('../haptics.js');
    await Promise.all([
      mod.impactSoft(),
      mod.impactMedium(),
      mod.selection(),
      mod.notifySuccess(),
      mod.notifyError(),
    ]);
    expect(fireMock).not.toHaveBeenCalled();
  });
});

describe('lib/haptics — silent no-op safety on web (unmocked platform adapter)', () => {
  afterEach(() => {
    vi.doUnmock('../haptics/system.js');
    vi.doUnmock('../../hooks/useNativeSettings.js');
    vi.resetModules();
  });

  it('every function resolves without throwing when there is no native platform, regardless of the haptics preference', async () => {
    vi.doUnmock('../haptics/system.js');
    vi.doUnmock('../../hooks/useNativeSettings.js');
    vi.resetModules();
    const mod = await import('../haptics.js');

    await expect(mod.impactSoft()).resolves.toBeUndefined();
    await expect(mod.impactMedium()).resolves.toBeUndefined();
    await expect(mod.selection()).resolves.toBeUndefined();
    await expect(mod.notifySuccess()).resolves.toBeUndefined();
    await expect(mod.notifyError()).resolves.toBeUndefined();
    await expect(mod.prepare()).resolves.toBeUndefined();
  });
});
