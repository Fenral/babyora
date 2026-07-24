import { afterEach, describe, expect, it } from 'vitest';
import {
  buildOutfitAlternativeOptions,
  type OutfitAlternativeOptionV1,
} from '../../lib/outfit/alternative-options.js';
import { recommend } from '../../lib/wool-layers/recommend.js';
import type {
  RecommendInput,
  Recommendation,
} from '../../lib/wool-layers/types.js';
import {
  useOutfitSelectionStore,
} from '../outfit-selection-store.js';

function makeInput(feelsLikeC = -8): RecommendInput {
  return {
    weather: {
      feelsLikeC,
      tempC: feelsLikeC + 2,
      windMs: 2,
      precipMmH: 0,
    },
    child: { ageMonths: 10 },
    activity: 'vogn',
  };
}

function makeSupported(
  transitionContextId: string,
  input = makeInput(),
  finalizedRecommendation: Recommendation = recommend(input),
) {
  const result = buildOutfitAlternativeOptions({
    transitionContextId,
    input,
    finalizedRecommendation,
    pose: 'sitting',
  });
  expect(result.kind).toBe('supported');
  if (result.kind !== 'supported') {
    throw new Error('selection fixture must be supported');
  }
  expect(result.options.length).toBeGreaterThan(0);
  return result;
}

function openSession() {
  const session = useOutfitSelectionStore.getState().session;
  expect(session.kind).toBe('open');
  if (session.kind !== 'open') {
    throw new Error('selection session must be open');
  }
  return session;
}

type HostileOptionsOperation =
  | 'getPrototypeOf'
  | 'ownKeys'
  | 'getOwnPropertyDescriptor'
  | 'revoked';

function makeHostileOptionsProxy(
  options: readonly OutfitAlternativeOptionV1[],
  operation: HostileOptionsOperation,
): readonly OutfitAlternativeOptionV1[] {
  const fail = (): never => {
    throw new Error(`HOSTILE_OPTIONS_PROXY_${operation}`);
  };
  if (operation === 'revoked') {
    const revocable = Proxy.revocable(options, {});
    revocable.revoke();
    return revocable.proxy;
  }
  if (operation === 'getPrototypeOf') {
    return new Proxy(options, { getPrototypeOf: fail });
  }
  if (operation === 'ownKeys') {
    return new Proxy(options, { ownKeys: fail });
  }
  return new Proxy(options, {
    getOwnPropertyDescriptor: fail,
  });
}

afterEach(() => {
  useOutfitSelectionStore.getState().close();
});

describe('exact outfit snapshot selection store', () => {
  it('opens on the exact immutable base and selects a full outcome atomically', () => {
    const fixture = makeSupported('transition:selection:one');
    const opened = useOutfitSelectionStore.getState().open(
      fixture.base,
      fixture.options,
    );
    expect(opened).toEqual({ ok: true });

    const initial = openSession();
    expect(initial.base).toBe(fixture.base);
    expect(initial.current).toBe(fixture.base);
    expect(initial.options).toBe(fixture.options);
    expect(initial.selectedOptionId).toBeNull();
    expect(initial.diagnostics).toEqual([]);
    expect(Object.isFrozen(initial.base)).toBe(true);
    expect(Object.isFrozen(initial.current)).toBe(true);

    const option = fixture.options[0]!;
    const selected = useOutfitSelectionStore.getState().select(option);
    expect(selected).toEqual({ ok: true });

    const afterSelection = openSession();
    expect(afterSelection.current).toBe(option.outcome);
    expect(afterSelection.current.snapshotId).toBe(
      option.outcome.snapshotId,
    );
    expect(afterSelection.current.recommendationFingerprint).toBe(
      option.outcome.recommendationFingerprint,
    );
    expect(afterSelection.current.transitionContextId).toBe(
      fixture.base.transitionContextId,
    );
    expect(afterSelection.selectedOptionId).toBe(option.optionId);
    expect(afterSelection.current.garments).toBe(
      option.outcome.garments,
    );
    expect(afterSelection.current.equipment).toBe(
      option.outcome.equipment,
    );
    expect(afterSelection.current.avatar).toBe(option.outcome.avatar);
  });

  it('resets byte-equivalently and close clears the complete session', () => {
    const fixture = makeSupported('transition:selection:reset');
    useOutfitSelectionStore.getState().open(
      fixture.base,
      fixture.options,
    );
    useOutfitSelectionStore.getState().select(fixture.options[0]!);

    expect(useOutfitSelectionStore.getState().reset()).toEqual({
      ok: true,
    });
    const reset = openSession();
    expect(reset.current).toBe(fixture.base);
    expect(reset.current).toEqual(fixture.base);
    expect(JSON.stringify(reset.current)).toBe(
      JSON.stringify(fixture.base),
    );
    expect(reset.selectedOptionId).toBeNull();
    expect(reset.diagnostics).toEqual([]);

    useOutfitSelectionStore.getState().close();
    expect(useOutfitSelectionStore.getState().session).toEqual({
      kind: 'closed',
      diagnostics: [],
    });
  });

  it('opening another identity triple clears the prior outcome', () => {
    const first = makeSupported('transition:selection:first');
    const second = makeSupported(
      'transition:selection:second',
      makeInput(-6),
    );
    useOutfitSelectionStore.getState().open(
      first.base,
      first.options,
    );
    useOutfitSelectionStore.getState().select(first.options[0]!);
    expect(openSession().current).toBe(first.options[0]!.outcome);

    expect(
      useOutfitSelectionStore.getState().open(
        second.base,
        second.options,
      ),
    ).toEqual({ ok: true });
    const reopened = openSession();
    expect(reopened.base).toBe(second.base);
    expect(reopened.current).toBe(second.base);
    expect(reopened.options).toBe(second.options);
    expect(reopened.selectedOptionId).toBeNull();
    expect(reopened.current.snapshotId).not.toBe(
      first.options[0]!.outcome.snapshotId,
    );
  });

  it('rejects a stale option without changing the current snapshot', () => {
    const first = makeSupported('transition:selection:stale:first');
    const second = makeSupported(
      'transition:selection:stale:second',
      makeInput(-6),
    );
    useOutfitSelectionStore.getState().open(
      first.base,
      first.options,
    );
    useOutfitSelectionStore.getState().open(
      second.base,
      second.options,
    );
    const before = openSession().current;

    const rejected = useOutfitSelectionStore
      .getState()
      .select(first.options[0]!);
    expect(rejected).toMatchObject({
      ok: false,
      diagnostic: {
        code: 'stale-option',
      },
    });
    const after = openSession();
    expect(after.current).toBe(before);
    expect(after.selectedOptionId).toBeNull();
    expect(after.diagnostics).toHaveLength(1);

    const repeated = useOutfitSelectionStore
      .getState()
      .select(first.options[0]!);
    expect(repeated).toEqual(rejected);
    expect(openSession().diagnostics).toHaveLength(1);
  });

  it.each([
    [
      'forged wrapper',
      (option: OutfitAlternativeOptionV1) =>
        Object.freeze({ ...option }) as OutfitAlternativeOptionV1,
      'forged-option',
    ],
    [
      'partial object',
      (option: OutfitAlternativeOptionV1) =>
        Object.freeze({
          optionId: option.optionId,
          sourceItemId: option.sourceItemId,
        }) as unknown as OutfitAlternativeOptionV1,
      'forged-option',
    ],
    [
      'mutable wrapper',
      (option: OutfitAlternativeOptionV1) =>
        ({ ...option }) as OutfitAlternativeOptionV1,
      'forged-option',
    ],
  ])(
    'rejects a %s without changing current truth',
    (_name, forge, expectedCode) => {
      const fixture = makeSupported('transition:selection:forged');
      useOutfitSelectionStore.getState().open(
        fixture.base,
        fixture.options,
      );
      const before = openSession().current;

      const rejected = useOutfitSelectionStore
        .getState()
        .select(forge(fixture.options[0]!));
      expect(rejected).toMatchObject({
        ok: false,
        diagnostic: { code: expectedCode },
      });
      expect(openSession().current).toBe(before);
      expect(openSession().selectedOptionId).toBeNull();
    },
  );

  it('rejects mutable, partial, forged, and cross-base open payloads atomically', () => {
    const current = makeSupported('transition:selection:current');
    const other = makeSupported(
      'transition:selection:other',
      makeInput(-6),
    );
    useOutfitSelectionStore.getState().open(
      current.base,
      current.options,
    );
    const before = useOutfitSelectionStore.getState().session;

    const mutableOptions = [...current.options];
    expect(
      useOutfitSelectionStore.getState().open(
        current.base,
        mutableOptions,
      ),
    ).toMatchObject({
      ok: false,
      diagnostic: { code: 'invalid-options' },
    });
    expect(useOutfitSelectionStore.getState().session).toBe(before);

    const clonedBase = structuredClone(current.base);
    expect(
      useOutfitSelectionStore.getState().open(
        clonedBase,
        current.options,
      ),
    ).toMatchObject({
      ok: false,
      diagnostic: { code: 'invalid-base' },
    });
    expect(useOutfitSelectionStore.getState().session).toBe(before);

    expect(
      useOutfitSelectionStore.getState().open(
        other.base,
        current.options,
      ),
    ).toMatchObject({
      ok: false,
      diagnostic: { code: 'invalid-options' },
    });
    expect(useOutfitSelectionStore.getState().session).toBe(before);

    const partialOptions = Object.freeze([
      Object.freeze({
        optionId: current.options[0]!.optionId,
      }),
    ]) as unknown as readonly OutfitAlternativeOptionV1[];
    expect(
      useOutfitSelectionStore.getState().open(
        current.base,
        partialOptions,
      ),
    ).toMatchObject({
      ok: false,
      diagnostic: { code: 'invalid-options' },
    });
    expect(useOutfitSelectionStore.getState().session).toBe(before);
  });

  it.each([
    'getPrototypeOf',
    'ownKeys',
    'getOwnPropertyDescriptor',
    'revoked',
  ] as const)(
    'rejects a hostile %s options Proxy atomically',
    (operation) => {
      const fixture = makeSupported(
        `transition:selection:proxy:${operation}`,
      );
      expect(
        useOutfitSelectionStore.getState().open(
          fixture.base,
          fixture.options,
        ),
      ).toEqual({ ok: true });
      const before = useOutfitSelectionStore.getState().session;
      const hostileOptions = makeHostileOptionsProxy(
        fixture.options,
        operation,
      );

      let result: unknown;
      expect(() => {
        result = useOutfitSelectionStore.getState().open(
          fixture.base,
          hostileOptions,
        );
      }).not.toThrow();
      expect(result).toMatchObject({
        ok: false,
        diagnostic: { code: 'invalid-options' },
      });
      expect(useOutfitSelectionStore.getState().session).toBe(before);
    },
  );

  it('rejects select/reset while closed and keeps a closed state exact', () => {
    const fixture = makeSupported('transition:selection:closed');
    useOutfitSelectionStore.getState().close();

    expect(
      useOutfitSelectionStore.getState().select(fixture.options[0]!),
    ).toMatchObject({
      ok: false,
      diagnostic: { code: 'closed-session' },
    });
    expect(useOutfitSelectionStore.getState().reset()).toMatchObject({
      ok: false,
      diagnostic: { code: 'closed-session' },
    });
    expect(useOutfitSelectionStore.getState().session).toEqual({
      kind: 'closed',
      diagnostics: [],
    });
  });
});
