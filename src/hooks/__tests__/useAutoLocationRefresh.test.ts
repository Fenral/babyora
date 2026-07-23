import { describe, expect, it, vi } from 'vitest';
import { resolveRuntimeCapabilityAccess } from '../../lib/premium/gating';
import { createAutoLocationController } from '../useAutoLocationRefresh';

const live = () => true;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((accept, decline) => {
    resolve = accept;
    reject = decline;
  });
  return { promise, resolve, reject };
}

const access = (allowed: boolean, loading = false, available = true) =>
  resolveRuntimeCapabilityAccess(
    'automatic_location',
    { isPlus: allowed, authenticated: false, loading },
    { automatic_location: available },
  );

function harness() {
  const gps = vi.fn<() => Promise<Readonly<{ lat: number; lon: number }>>>();
  const reverse = vi.fn();
  const clear = vi.fn();
  const begin = vi.fn(() => 4);
  const commit = vi.fn();
  const controller = createAutoLocationController({
    locate: gps,
    reverse,
    clear,
    begin,
    commit,
  });
  return { controller, gps, reverse, clear, begin, commit };
}

describe('automatic location controller', () => {
  it.each([
    ['loading', access(true, true), 'auto', 'startup'],
    ['denied', access(false), 'auto', 'startup'],
    ['implementation off', access(true, false, false), 'auto', 'resume'],
    ['manual startup', access(true), 'manual', 'startup'],
  ] as const)('performs zero I/O for %s', async (_label, runtimeDecision, mode, intent) => {
    const { controller, gps, reverse, clear, begin, commit } = harness();

    await expect(controller.run({
      intent,
      runtimeDecision,
      mode,
      childId: 'child-1',
      isStillAllowed: live,
    })).resolves.toEqual({ status: 'blocked' });

    expect(gps).not.toHaveBeenCalled();
    expect(reverse).not.toHaveBeenCalled();
    expect(begin).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it('allows only explicit Settings activation while mode is manual', async () => {
    const { controller, gps, reverse, begin, commit } = harness();
    gps.mockResolvedValue({ lat: 63.468, lon: 10.917 });
    reverse.mockResolvedValue({ city: 'Stjørdal' });

    await expect(controller.run({
      intent: 'settings-activation',
      runtimeDecision: access(true),
      mode: 'manual',
      childId: 'child-1',
      isStillAllowed: live,
    })).resolves.toEqual({ status: 'success', placeLabel: 'Stjørdal' });

    expect(begin).toHaveBeenCalledTimes(1);
    expect(reverse).toHaveBeenCalledWith(63.468, 10.917, {
      cacheScope: 'memory-only',
    });
    expect(commit).toHaveBeenCalledWith(4, {
      childId: 'child-1',
      city: 'Stjørdal',
      lat: 63.468,
      lon: 10.917,
    });
  });

  it('deduplicates one stable in-flight request', async () => {
    const { controller, gps, reverse, commit } = harness();
    const position = deferred<Readonly<{ lat: number; lon: number }>>();
    gps.mockReturnValue(position.promise);
    reverse.mockResolvedValue({ city: 'Tromsø' });
    const request = {
      intent: 'startup' as const,
      runtimeDecision: access(true),
      mode: 'auto' as const,
      childId: 'child-1',
      isStillAllowed: live,
    };

    const first = controller.run(request);
    const second = controller.run(request);
    position.resolve({ lat: 69.6492, lon: 18.9553 });

    await expect(first).resolves.toEqual({ status: 'success', placeLabel: 'Tromsø' });
    await expect(second).resolves.toEqual({ status: 'success', placeLabel: 'Tromsø' });
    expect(gps).toHaveBeenCalledTimes(1);
    expect(reverse).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it('invalidates late GPS and geocode completions without committing', async () => {
    const { controller, gps, reverse, clear, commit } = harness();
    const position = deferred<Readonly<{ lat: number; lon: number }>>();
    const geocode = deferred<Readonly<{ city: string | null }>>();
    gps.mockReturnValue(position.promise);
    reverse.mockReturnValue(geocode.promise);
    const request = controller.run({
      intent: 'startup',
      runtimeDecision: access(true),
      mode: 'auto',
      childId: 'child-1',
      isStillAllowed: live,
    });
    position.resolve({ lat: 60.39, lon: 5.32 });
    await Promise.resolve();
    controller.invalidate();
    geocode.resolve({ city: 'Bergen' });

    await expect(request).resolves.toEqual({ status: 'superseded' });
    expect(clear).toHaveBeenCalledTimes(1);
    expect(commit).not.toHaveBeenCalled();
  });

  it('fails closed when GPS or reverse geocoding has no valid place label', async () => {
    const { controller, gps, reverse, clear, commit } = harness();
    gps.mockResolvedValue({ lat: 63.4, lon: 10.4 });
    reverse.mockResolvedValue({ city: null });

    await expect(controller.run({
      intent: 'settings-activation',
      runtimeDecision: access(true),
      mode: 'manual',
      childId: 'child-1',
      isStillAllowed: live,
    })).resolves.toEqual({ status: 'failed' });

    expect(clear).toHaveBeenCalledTimes(1);
    expect(commit).not.toHaveBeenCalled();
  });

  it('rechecks live authorization before reverse geocoding and commit', async () => {
    const { controller, gps, reverse, commit } = harness();
    const position = deferred<Readonly<{ lat: number; lon: number }>>();
    let allowed = true;
    gps.mockReturnValue(position.promise);
    reverse.mockResolvedValue({ city: 'Oslo' });

    const request = controller.run({
      intent: 'settings-activation',
      runtimeDecision: access(true),
      mode: 'manual',
      childId: 'child-1',
      isStillAllowed: () => allowed,
    });
    allowed = false;
    position.resolve({ lat: 59.9139, lon: 10.7522 });

    await expect(request).resolves.toEqual({ status: 'superseded' });
    expect(reverse).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
  });

  it('rejects a live downgrade while reverse geocoding is in flight', async () => {
    const { controller, gps, reverse, commit } = harness();
    const geocode = deferred<Readonly<{ city: string | null }>>();
    let allowed = true;
    gps.mockResolvedValue({ lat: 59.9139, lon: 10.7522 });
    reverse.mockReturnValue(geocode.promise);

    const request = controller.run({
      intent: 'settings-activation',
      runtimeDecision: access(true),
      mode: 'manual',
      childId: 'child-1',
      isStillAllowed: () => allowed,
    });
    await Promise.resolve();
    await Promise.resolve();
    allowed = false;
    geocode.resolve({ city: 'Oslo' });

    await expect(request).resolves.toEqual({ status: 'superseded' });
    expect(commit).not.toHaveBeenCalled();
  });

  it('deduplicates overlapping startup and resume for the same child', async () => {
    const { controller, gps, reverse, commit } = harness();
    const position = deferred<Readonly<{ lat: number; lon: number }>>();
    gps.mockReturnValue(position.promise);
    reverse.mockResolvedValue({ city: 'Oslo' });
    const base = {
      runtimeDecision: access(true),
      mode: 'auto' as const,
      childId: 'child-1',
      isStillAllowed: live,
    };

    const startup = controller.run({ ...base, intent: 'startup' });
    const resume = controller.run({ ...base, intent: 'resume' });
    position.resolve({ lat: 59.9139, lon: 10.7522 });

    await expect(startup).resolves.toEqual({ status: 'success', placeLabel: 'Oslo' });
    await expect(resume).resolves.toEqual({ status: 'success', placeLabel: 'Oslo' });
    expect(gps).toHaveBeenCalledTimes(1);
    expect(reverse).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledTimes(1);
  });
});
