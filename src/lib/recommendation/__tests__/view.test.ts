/**
 * R7/UI-plan Task 2 — kanonisk RecommendationView + AvatarStateKey.
 * Ingen skjerm teller plagg, bygger forklaring eller utleder fingerprint
 * selv (konsolidert plan §3). FORVENTET RED: modulen finnes ikke.
 */
import { describe, expect, it } from 'vitest';
import { buildRecommendationView } from '../view.js';
import { deriveAvatarStateKey, avatarAssetFor, avatarStateKeyId } from '../avatar-state.js';
import { recommendV2 } from '../../clothing-engine-v2/recommend.js';
import type { RecommendInputV2 } from '../../clothing-engine-v2/types.js';

function input(ageMonths: number, feelsLikeC: number, rest?: Partial<RecommendInputV2>): RecommendInputV2 {
  return {
    weather: { tempC: feelsLikeC, feelsLikeC, windMs: 3, precipMmH: 0 },
    ageMonths,
    situation: ageMonths >= 12 ? 'active_play' : 'stroller_awake',
    ...rest,
  };
}

describe('RecommendationView', () => {
  it('teller synlige PLAGG, ikke kategorier — utstyr teller aldri', () => {
    const rec = recommendV2(input(7, -7, { situation: 'stroller_awake' }));
    const view = buildRecommendationView(rec);
    expect(view.garmentCount).toBe(rec.garments.length);
    expect(view.garmentCount).toBeGreaterThan(3); // flere plagg enn kategorier
    // utstyr (vognpose o.l.) er ikke i garmentCount
    expect(rec.equipment.length).toBeGreaterThan(0);
  });

  it('rekkefølgen er innerst → mellomlag → yttertøy → ekstra → utstyr', () => {
    const rec = recommendV2(input(16, 0));
    const view = buildRecommendationView(rec);
    const labels = view.orderedGarments;
    const idx = (re: RegExp) => labels.findIndex((l) => re.test(l));
    expect(idx(/ullsett|undertøysett/)).toBeGreaterThanOrEqual(0);
    expect(idx(/ullsett|undertøysett/)).toBeLessThan(idx(/mellomlag|fleece/i) === -1 ? 99 : idx(/mellomlag|fleece/i));
    const outerIdx = idx(/kjøredress/);
    if (outerIdx !== -1) {
      expect(outerIdx).toBeGreaterThan(idx(/ullsett|undertøysett/));
    }
  });

  it('fingerprint konsumeres fra Motor 2.0 — aldri re-beregnet fra labels', () => {
    const rec = recommendV2(input(16, 0));
    const view = buildRecommendationView(rec);
    expect(view.fingerprint).toBe(rec.fingerprint);
  });

  it('semantisk like inputs gir lik fingerprint uavhengig av nøkkelrekkefølge', () => {
    const a = buildRecommendationView(recommendV2({
      weather: { tempC: 0, feelsLikeC: 0, windMs: 3, precipMmH: 0 },
      ageMonths: 16, situation: 'active_play',
    }));
    const b = buildRecommendationView(recommendV2({
      situation: 'active_play', ageMonths: 16,
      weather: { precipMmH: 0, windMs: 3, feelsLikeC: 0, tempC: 0 },
    }));
    expect(a.fingerprint).toBe(b.fingerprint);
  });

  it('forklaring er i18n-nøkler (presentasjonslaget oversetter)', () => {
    const view = buildRecommendationView(recommendV2(input(16, 0)));
    expect(view.explanation.length).toBeGreaterThan(0);
    for (const key of view.explanation) {
      expect(key).toMatch(/^engineV2\.explanations\./);
    }
  });
});

describe('AvatarStateKey', () => {
  it('sittende 0–11, stående 12–24 (låste positurer)', () => {
    expect(deriveAvatarStateKey(recommendV2(input(7, -7, { situation: 'stroller_awake' }))).pose).toBe('sitting');
    expect(deriveAvatarStateKey(recommendV2(input(18, -7, { situation: 'stroller_awake' }))).pose).toBe('standing');
  });

  it('beskriver kun synlig ytre tilstand — aldri skjulte underlag', () => {
    const rec = recommendV2(input(18, -7, { situation: 'stroller_awake' }));
    const key = deriveAvatarStateKey(rec);
    // Ytterste kroppsplagg er den isolerte dressen — base/mid er ikke i nøkkelen.
    expect(key.outerBody).toMatch(/insulated/);
    const serialized = JSON.stringify(key);
    expect(serialized).not.toMatch(/base-fullbody|mid-/);
    // Identitet og vær finnes ikke i nøkkelen.
    expect(serialized).not.toMatch(/"(name|dob|feelsLikeC|tempC)"/);
  });

  it('nøkkel-ID er stabil og deterministisk', () => {
    const rec = recommendV2(input(18, -7, { situation: 'stroller_awake' }));
    expect(avatarStateKeyId(deriveAvatarStateKey(rec))).toBe(avatarStateKeyId(deriveAvatarStateKey(rec)));
  });

  it('ukjent/ikke-verifisert nøkkel gir null — aldri nærmeste-nabo-gjetting', () => {
    // Manifestet er tomt til R8 leverer godkjente kompositter — ALT gir null nå.
    const rec = recommendV2(input(18, -7, { situation: 'stroller_awake' }));
    expect(avatarAssetFor(deriveAvatarStateKey(rec))).toBeNull();
    const view = buildRecommendationView(rec);
    expect(view.avatarStateKey).not.toBeNull(); // nøkkelen finnes
  });
});
