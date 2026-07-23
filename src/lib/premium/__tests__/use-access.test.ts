import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it, vi } from 'vitest';

const runtime = vi.hoisted(() => {
  const subscriptionState = {
    isPremium: false,
    lastSyncedAt: null as string | null,
    setPremium: vi.fn<(isPremium: boolean) => void>(),
    markReady: vi.fn(),
  };

  subscriptionState.setPremium.mockImplementation((isPremium) => {
    subscriptionState.isPremium = isPremium;
  });

  return {
    native: false,
    configured: false,
    check: vi.fn<() => Promise<boolean>>(),
    addListener: vi.fn(() => Promise.resolve({ remove: vi.fn() })),
    subscriptionState,
  };
});

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => runtime.native,
  },
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: runtime.addListener,
  },
}));

vi.mock('../../billing/revenuecat', () => ({
  checkPremium: () => runtime.check(),
  isRevenueCatConfigured: () => runtime.configured,
}));

vi.mock('../../../state/subscription-store', () => {
  const useSubscription = Object.assign(
    <T>(selector: (state: typeof runtime.subscriptionState) => T) => (
      selector(runtime.subscriptionState)
    ),
    {
      getState: () => runtime.subscriptionState,
    },
  );

  return { useSubscription };
});

type AccessSnapshot = {
  isPremium: boolean;
  loading: boolean;
  source: 'configured-native' | 'ready-dev';
};

type ControllerDependencies = {
  configuredNative: boolean;
  check: () => Promise<boolean>;
  commit: (isPremium: boolean) => void;
  readDevPremium: () => boolean;
  warn?: (message: string, error: unknown) => void;
};

type EntitlementFreshnessController = {
  getSnapshot: () => AccessSnapshot;
  subscribe: (listener: () => void) => () => void;
  refresh: () => Promise<void>;
  supersede: () => void;
};

type ControllerFactory = (
  dependencies: ControllerDependencies,
) => EntitlementFreshnessController;

type EffectiveAccessResolver = (
  snapshot: AccessSnapshot,
  persistedPremium: boolean,
) => { isPremium: boolean; loading: boolean };

let createController: ControllerFactory;
let resolveEffectiveAccess: EffectiveAccessResolver;

beforeAll(async () => {
  const accessModule = await import('../use-access') as Record<string, unknown>;
  const candidate = accessModule.createEntitlementFreshnessController;
  const resolverCandidate = accessModule.resolveEffectiveAccess;

  if (typeof candidate !== 'function') {
    throw new Error('MISSING_SINGLE_FLIGHT_ENTITLEMENT_FRESHNESS');
  }
  if (typeof resolverCandidate !== 'function') {
    throw new Error('MISSING_POST_REFRESH_STORE_GRANT');
  }

  createController = candidate as ControllerFactory;
  resolveEffectiveAccess = resolverCandidate as EffectiveAccessResolver;
});

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

function nativeController(check: () => Promise<boolean>) {
  const commits: boolean[] = [];
  const warnings: unknown[] = [];
  const controller = createController({
    configuredNative: true,
    check,
    commit: (value) => commits.push(value),
    readDevPremium: () => true,
    warn: (_message, error) => warnings.push(error),
  });

  return { controller, commits, warnings };
}

describe('configured-native entitlement freshness', () => {
  it('hides cached Plus while refreshing, then accepts a post-refresh purchase grant', async () => {
    const checkResult = deferred<boolean>();
    let persistedPremium = true;
    const controller = createController({
      configuredNative: true,
      check: () => checkResult.promise,
      commit: (value) => {
        persistedPremium = value;
      },
      readDevPremium: () => persistedPremium,
    });

    expect(resolveEffectiveAccess(
      controller.getSnapshot(),
      persistedPremium,
    )).toEqual({
      isPremium: false,
      loading: true,
    });

    const refresh = controller.refresh();
    checkResult.resolve(false);
    await refresh;

    expect(resolveEffectiveAccess(
      controller.getSnapshot(),
      persistedPremium,
    )).toEqual({
      isPremium: false,
      loading: false,
    });

    persistedPremium = true;
    expect(resolveEffectiveAccess(
      controller.getSnapshot(),
      persistedPremium,
    )).toEqual({
      isPremium: true,
      loading: false,
    });
  });

  it('publishes neutral synchronously, shares one promise, and publishes one fresh result', async () => {
    const firstCheck = deferred<boolean>();
    const check = vi.fn(() => firstCheck.promise);
    const { controller, commits } = nativeController(check);
    const publications: AccessSnapshot[] = [];
    controller.subscribe(() => publications.push(controller.getSnapshot()));

    expect(controller.getSnapshot()).toMatchObject({
      isPremium: false,
      loading: true,
      source: 'configured-native',
    });

    const first = controller.refresh();
    const concurrent = controller.refresh();

    expect(concurrent).toBe(first);
    expect(check).toHaveBeenCalledTimes(1);
    expect(publications).toHaveLength(1);
    expect(publications[0]).toMatchObject({
      isPremium: false,
      loading: true,
    });
    expect(commits).toEqual([]);

    firstCheck.resolve(true);
    await first;

    expect(publications).toHaveLength(2);
    expect(publications[1]).toMatchObject({
      isPremium: true,
      loading: false,
    });
    expect(commits).toEqual([true]);
  });

  it('starts a new generation only after the prior single flight settles', async () => {
    const checks = [deferred<boolean>(), deferred<boolean>()];
    const check = vi.fn()
      .mockImplementationOnce(() => checks[0].promise)
      .mockImplementationOnce(() => checks[1].promise);
    const { controller, commits } = nativeController(check);

    const first = controller.refresh();
    checks[0].resolve(true);
    await first;

    const second = controller.refresh();
    expect(second).not.toBe(first);
    expect(check).toHaveBeenCalledTimes(2);
    expect(controller.getSnapshot()).toMatchObject({
      isPremium: false,
      loading: true,
    });

    checks[1].resolve(false);
    await second;

    expect(controller.getSnapshot()).toMatchObject({
      isPremium: false,
      loading: false,
    });
    expect(commits).toEqual([true, false]);
  });

  it('fails closed on errors instead of retaining cached Plus', async () => {
    const failure = new Error('store unavailable');
    const { controller, commits, warnings } = nativeController(
      () => Promise.reject(failure),
    );

    await controller.refresh();

    expect(controller.getSnapshot()).toMatchObject({
      isPremium: false,
      loading: false,
    });
    expect(commits).toEqual([false]);
    expect(warnings).toEqual([failure]);
  });

  it('ignores a superseded completion so stale Plus cannot reopen paid access', async () => {
    const staleCheck = deferred<boolean>();
    const currentCheck = deferred<boolean>();
    const check = vi.fn()
      .mockImplementationOnce(() => staleCheck.promise)
      .mockImplementationOnce(() => currentCheck.promise);
    const { controller, commits } = nativeController(check);

    const stale = controller.refresh();
    controller.supersede();
    const current = controller.refresh();

    currentCheck.resolve(false);
    await current;
    staleCheck.resolve(true);
    await stale;

    expect(controller.getSnapshot()).toMatchObject({
      isPremium: false,
      loading: false,
    });
    expect(commits).toEqual([false]);
  });
});

describe('unconfigured web/dev access', () => {
  it('preserves the explicit mock value without running or claiming a native refresh', async () => {
    const check = vi.fn(() => Promise.resolve(false));
    const commit = vi.fn();
    const controller = createController({
      configuredNative: false,
      check,
      commit,
      readDevPremium: () => true,
    });

    expect(controller.getSnapshot()).toEqual({
      isPremium: true,
      loading: false,
      source: 'ready-dev',
    });

    await controller.refresh();

    expect(check).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
    expect(controller.getSnapshot().source).toBe('ready-dev');
  });
});

describe('module startup/resume integration', () => {
  it('shares startup/resume, registers once, and exposes a settled purchase grant', async () => {
    runtime.native = true;
    runtime.configured = true;
    runtime.subscriptionState.isPremium = true;
    runtime.subscriptionState.setPremium.mockClear();
    runtime.addListener.mockClear();
    const firstCheck = deferred<boolean>();
    const secondCheck = deferred<boolean>();
    runtime.check
      .mockReset()
      .mockImplementationOnce(() => firstCheck.promise)
      .mockImplementationOnce(() => secondCheck.promise);
    vi.resetModules();

    const accessModule = await import('../use-access');
    const renderAccess = () => {
      function AccessProbe() {
        const access = accessModule.useAccess();
        return createElement('span', null, JSON.stringify(access));
      }

      return renderToStaticMarkup(createElement(AccessProbe));
    };

    expect(runtime.addListener).toHaveBeenCalledTimes(1);
    expect(renderAccess()).toContain(
      '{&quot;isPremium&quot;:false,&quot;loading&quot;:true}',
    );

    const startup = accessModule.syncPremiumEntitlement();
    const concurrent = accessModule.syncPremiumEntitlement();
    const resumeListener = runtime.addListener.mock.calls[0]?.[1] as
      | ((state: { isActive: boolean }) => void)
      | undefined;
    resumeListener?.({ isActive: true });

    expect(concurrent).toBe(startup);
    expect(runtime.check).toHaveBeenCalledTimes(1);

    firstCheck.resolve(false);
    await startup;
    expect(renderAccess()).toContain(
      '{&quot;isPremium&quot;:false,&quot;loading&quot;:false}',
    );

    runtime.subscriptionState.setPremium(true);
    expect(renderAccess()).toContain(
      '{&quot;isPremium&quot;:true,&quot;loading&quot;:false}',
    );

    const nextResume = accessModule.syncPremiumEntitlement();
    expect(runtime.check).toHaveBeenCalledTimes(2);
    expect(renderAccess()).toContain(
      '{&quot;isPremium&quot;:false,&quot;loading&quot;:true}',
    );
    secondCheck.resolve(true);
    await nextResume;
    expect(renderAccess()).toContain(
      '{&quot;isPremium&quot;:true,&quot;loading&quot;:false}',
    );
  });
});
