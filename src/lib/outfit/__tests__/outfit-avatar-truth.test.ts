import manifestJson from '../../../../public/avatars/verified/index.json?raw';
import { describe, expect, it } from 'vitest';
import {
  avatarCoverageForCatalogGarment,
  type AvatarVisualCoverage,
} from '../avatar-visibility-catalog.js';
import {
  resolveOutfitAvatarTruth,
  type AvatarResolvableGarment,
} from '../outfit-avatar-truth.js';
import type { OutfitItemId } from '../outfit-truth.js';

type ManifestRow = {
  name: string;
  asset: string;
  pose: 'sitting' | 'standing';
  garments: string[];
};

const PROTOTYPE_PROPERTY_NAMES = [
  '__proto__',
  'constructor',
  'prototype',
] as const;

const manifest = JSON.parse(manifestJson) as ManifestRow[];

function item(
  catalogGarmentId: string,
  index: number,
  avatarCoverage: AvatarVisualCoverage | null =
    avatarCoverageForCatalogGarment(catalogGarmentId),
): AvatarResolvableGarment {
  return {
    itemId: `item:${index}:${catalogGarmentId}` as OutfitItemId,
    catalogGarmentId,
    avatarCoverage,
  };
}

function neutral(
  pose: 'sitting' | 'standing',
  garments: readonly AvatarResolvableGarment[],
) {
  const result = resolveOutfitAvatarTruth({ pose, garments });
  expect(result.verifiedAssetPath).toBeNull();
  expect(result.visibleGarmentIds).toEqual([]);
  return result;
}

function verifiedArgs() {
  return {
    pose: 'standing' as const,
    garments: [
      item('kortermet-body', 0),
      item('solhatt', 1),
    ],
  };
}

function attemptUnknownResolution(args: unknown): {
  result?: ReturnType<typeof resolveOutfitAvatarTruth>;
  error?: unknown;
} {
  try {
    return {
      result: resolveOutfitAvatarTruth(
        args as Parameters<typeof resolveOutfitAvatarTruth>[0],
      ),
    };
  } catch (error) {
    return { error };
  }
}

function expectUnknownNeutral(args: unknown): void {
  const outcome = attemptUnknownResolution(args);
  expect(outcome.error).toBeUndefined();
  expect(outcome.result).toMatchObject({
    verifiedAssetPath: null,
    visibleGarmentIds: [],
  });
}

describe('exact verified avatar truth', () => {
  it('matches every checked-in manifest row by exact pose and full set', () => {
    expect(manifest).toHaveLength(24);
    for (const row of manifest) {
      const garments = row.garments.map((id, index) => item(id, index));
      const result = resolveOutfitAvatarTruth({
        pose: row.pose,
        garments,
      });

      expect(result.stateKey, row.name).toBe(row.name);
      expect(result.verifiedAssetPath, row.name).toBe(row.asset);
      expect(result.visibleGarmentIds, row.name).toEqual(
        garments.map((garment) => garment.itemId),
      );
    }
  });

  it('hides an inner garment only through explicit outer-slot occlusion', () => {
    const body = item('langermet-body', 0);
    const outer = item('kjoredress', 1);
    const hat = item('lue-m-ull', 2);
    const result = resolveOutfitAvatarTruth({
      pose: 'standing',
      garments: [body, outer, hat],
    });

    expect(result.stateKey).toBe('std-4-kald');
    expect(result.visibleGarmentIds).toEqual([
      outer.itemId,
      hat.itemId,
    ]);
  });

  it('fails neutral on duplicate visible catalog ids', () => {
    neutral('standing', [
      item('lue', 0),
      item('lue', 1),
    ]);
  });

  it('fails neutral on tied visual rank for a shared slot', () => {
    const first = item('langermet-body', 0);
    const firstCoverage = first.avatarCoverage!;
    const tiedCoverage: AvatarVisualCoverage = {
      ...firstCoverage,
      bodyCoverage: [...firstCoverage.bodyCoverage],
      visibleSlots: [...firstCoverage.visibleSlots],
      occludesSlots: [...firstCoverage.visibleSlots],
    };
    neutral('standing', [
      first,
      item('ull-jakke', 1, tiedCoverage),
    ]);
  });

  it('fails neutral on null, unknown or contradictory coverage', () => {
    neutral('standing', [item('langermet-body', 0, null)]);
    neutral('standing', [item('not-in-catalog', 0, null)]);

    const inner = item('langermet-body', 0);
    const outerCoverage = avatarCoverageForCatalogGarment('kjoredress')!;
    neutral('standing', [
      inner,
      item('kjoredress', 1, {
        ...outerCoverage,
        occludesSlots: [],
      }),
    ]);
  });

  it.each(PROTOTYPE_PROPERTY_NAMES)(
    'returns null coverage for prototype-named unknown id %s',
    (catalogGarmentId) => {
      expect(
        avatarCoverageForCatalogGarment(catalogGarmentId),
      ).toBeNull();
    },
  );

  it('rejects inherited coverage from temporary prototype pollution', () => {
    const catalogGarmentId = 'future prototype-polluted visual id';
    Object.defineProperty(Object.prototype, catalogGarmentId, {
      configurable: true,
      enumerable: false,
      value: 'lue',
      writable: true,
    });

    try {
      expect(
        avatarCoverageForCatalogGarment(catalogGarmentId),
      ).toBeNull();
    } finally {
      delete (Object.prototype as Record<string, unknown>)[catalogGarmentId];
    }
  });

  it('fails neutral on missing, extra or differently posed manifest sets', () => {
    neutral('standing', [item('kjoredress', 0)]);
    neutral('standing', [
      item('kjoredress', 0),
      item('lue-m-ull', 1),
      item('ullsokker', 2),
    ]);

    const standingOnly = manifest.find(
      (row) => row.name === 'std-4-kald',
    )!;
    const result = resolveOutfitAvatarTruth({
      pose: 'sitting',
      garments: standingOnly.garments.map((id, index) => item(id, index)),
    });
    expect(result.stateKey).toBe('sit-4-kald');
    expect(result.stateKey).not.toBe(standingOnly.name);
  });

  it('rejects inherited resolver and coverage values', () => {
    const inheritedArgs = Object.create(verifiedArgs()) as unknown;
    expectUnknownNeutral(inheritedArgs);

    const args = verifiedArgs();
    const inheritedCoverage = Object.create(
      args.garments[0]!.avatarCoverage!,
    ) as AvatarVisualCoverage;
    args.garments[0] = {
      ...args.garments[0]!,
      avatarCoverage: inheritedCoverage,
    };
    expectUnknownNeutral(args);
  });

  it('rejects resolver and garment records with custom prototypes', () => {
    const customArgs = verifiedArgs();
    Object.setPrototypeOf(customArgs, { custom: true });
    expectUnknownNeutral(customArgs);

    const args = verifiedArgs();
    const customGarment = {
      ...args.garments[0]!,
    };
    Object.setPrototypeOf(customGarment, { custom: true });
    args.garments[0] = customGarment;
    expectUnknownNeutral(args);
  });

  it('does not invoke resolver or nested coverage accessors', () => {
    let rootGetterCalls = 0;
    const rootAccessor = {
      pose: 'standing',
      get garments(): readonly AvatarResolvableGarment[] {
        rootGetterCalls += 1;
        throw new Error('resolver getter must not run');
      },
    };
    const rootOutcome = attemptUnknownResolution(rootAccessor);
    expect(rootGetterCalls).toBe(0);
    expect(rootOutcome.error).toBeUndefined();
    expect(rootOutcome.result?.verifiedAssetPath).toBeNull();

    const args = verifiedArgs();
    const sourceCoverage = args.garments[0]!.avatarCoverage!;
    let coverageGetterCalls = 0;
    const accessorCoverage = {
      coverageVersion: sourceCoverage.coverageVersion,
      bodyCoverage: [...sourceCoverage.bodyCoverage],
      get visibleSlots(): readonly AvatarVisualCoverage['visibleSlots'][number][] {
        coverageGetterCalls += 1;
        throw new Error('coverage getter must not run');
      },
      visualLayerRank: sourceCoverage.visualLayerRank,
      occludesSlots: [...sourceCoverage.occludesSlots],
    } as AvatarVisualCoverage;
    args.garments[0] = {
      ...args.garments[0]!,
      avatarCoverage: accessorCoverage,
    };
    const coverageOutcome = attemptUnknownResolution(args);
    expect(coverageGetterCalls).toBe(0);
    expect(coverageOutcome.error).toBeUndefined();
    expect(coverageOutcome.result?.verifiedAssetPath).toBeNull();
  });

  it('rejects symbol, non-enumerable and extra own properties', () => {
    const symbolArgs = verifiedArgs();
    Object.defineProperty(symbolArgs, Symbol('unexpected'), {
      enumerable: true,
      value: true,
    });
    expectUnknownNeutral(symbolArgs);

    const nonEnumerableArgs = verifiedArgs();
    Object.defineProperty(
      nonEnumerableArgs.garments[0]!,
      'catalogGarmentId',
      {
        configurable: true,
        enumerable: false,
        value: nonEnumerableArgs.garments[0]!.catalogGarmentId,
        writable: true,
      },
    );
    expectUnknownNeutral(nonEnumerableArgs);

    const extraArgs = verifiedArgs();
    extraArgs.garments[0] = {
      ...extraArgs.garments[0]!,
      avatarCoverage: {
        ...extraArgs.garments[0]!.avatarCoverage!,
        unexpected: true,
      } as AvatarVisualCoverage,
    };
    expectUnknownNeutral(extraArgs);
  });

  it('rejects sparse garment and coverage arrays without throwing', () => {
    const customArrayArgs = verifiedArgs();
    Object.setPrototypeOf(
      customArrayArgs.garments,
      Object.create(Array.prototype) as unknown[],
    );
    expectUnknownNeutral(customArrayArgs);

    const sparseGarments = new Array<AvatarResolvableGarment>(3);
    const exact = verifiedArgs();
    sparseGarments[0] = exact.garments[0]!;
    sparseGarments[2] = exact.garments[1]!;
    expectUnknownNeutral({
      pose: 'standing',
      garments: sparseGarments,
    });

    const sparseCoverageArgs = verifiedArgs();
    const sourceCoverage =
      sparseCoverageArgs.garments[1]!.avatarCoverage!;
    const sparseOcclusion =
      new Array<AvatarVisualCoverage['occludesSlots'][number]>(1);
    sparseCoverageArgs.garments[1] = {
      ...sparseCoverageArgs.garments[1]!,
      avatarCoverage: {
        ...sourceCoverage,
        bodyCoverage: [...sourceCoverage.bodyCoverage],
        visibleSlots: [...sourceCoverage.visibleSlots],
        occludesSlots: sparseOcclusion,
      },
    };
    expectUnknownNeutral(sparseCoverageArgs);
  });

  it('rejects required coverage inherited through Object.prototype', () => {
    const pollutedKey = 'avatarCoverage';
    const previous = Object.getOwnPropertyDescriptor(
      Object.prototype,
      pollutedKey,
    );
    const args = verifiedArgs();
    const pollutedCoverage = args.garments[0]!.avatarCoverage;
    args.garments[0] = {
      itemId: args.garments[0]!.itemId,
      catalogGarmentId: args.garments[0]!.catalogGarmentId,
    } as AvatarResolvableGarment;
    Object.defineProperty(Object.prototype, pollutedKey, {
      configurable: true,
      enumerable: false,
      value: pollutedCoverage,
      writable: true,
    });

    try {
      expectUnknownNeutral(args);
    } finally {
      if (previous === undefined) {
        delete (Object.prototype as Record<string, unknown>)[pollutedKey];
      } else {
        Object.defineProperty(Object.prototype, pollutedKey, previous);
      }
    }
  });
});
