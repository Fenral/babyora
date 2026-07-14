/**
 * R7 Task 4 — scenemodellen: dominant svar + ytterste synlige ankere.
 */
import { describe, expect, it } from 'vitest';
import { deriveSceneModel } from '../scene.js';
import { buildRecommendationView } from '../view.js';
import { recommendV2 } from '../../clothing-engine-v2/recommend.js';
import type { RecommendInputV2 } from '../../clothing-engine-v2/types.js';

function view(ageMonths: number, feelsLikeC: number, rest?: Partial<RecommendInputV2>) {
  return buildRecommendationView(recommendV2({
    weather: { tempC: feelsLikeC, feelsLikeC, windMs: 3, precipMmH: 0 },
    ageMonths,
    situation: 'stroller_awake',
    ...rest,
  }));
}

describe('scenemodellen (retning B)', () => {
  it('frost: headline er plaggnavnet ordrett + «-dag»', () => {
    const scene = deriveSceneModel(view(7, -7));
    expect(scene.headline).toBe('Vinterkjøredress-dag');
    expect(scene.outerBodyLabel).toBe('vinterkjøredress');
  });

  it('ankere er 3–5 ytterste synlige — aldri base/mellomlag', () => {
    const scene = deriveSceneModel(view(7, -7));
    expect(scene.anchors.length).toBeGreaterThanOrEqual(3);
    expect(scene.anchors.length).toBeLessThanOrEqual(5);
    const labels = scene.anchors.map((a) => a.label).join('|');
    expect(labels).not.toMatch(/ullsett|undertøysett|mellomlag/);
    expect(labels).toMatch(/vinterkjøredress/);
  });

  it('mildt vær uten yttertøy: mellomlag/base er ytterste synlige kroppsplagg', () => {
    const scene = deriveSceneModel(view(18, 12, { situation: 'active_play' }));
    expect(scene.outerBodyLabel).not.toBeNull();
    expect(scene.headline.endsWith('-dag')).toBe(true);
  });

  it('utstyr kan fylle opp til 5 ankere, aldri flere', () => {
    const scene = deriveSceneModel(view(7, -7, { weather: { tempC: -7, feelsLikeC: -7, windMs: 3, precipMmH: 1.5 } }));
    expect(scene.anchors.length).toBeLessThanOrEqual(5);
  });

  it('er deterministisk', () => {
    expect(deriveSceneModel(view(7, -7))).toEqual(deriveSceneModel(view(7, -7)));
  });
});
