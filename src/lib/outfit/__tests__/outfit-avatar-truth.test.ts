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
});
