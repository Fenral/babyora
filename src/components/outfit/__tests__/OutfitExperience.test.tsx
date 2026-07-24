import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { recommend } from '../../../lib/wool-layers/recommend.js';
import { createOutfitTruthSnapshot } from '../../../lib/outfit/outfit-truth.js';
import { OutfitExperience } from '../OutfitExperience.js';

function snapshot() {
  const input = { weather: { feelsLikeC: 4, tempC: 5, windMs: 1, precipMmH: 0 }, child: { ageMonths: 18 }, activity: 'utelek' } as const;
  const result = createOutfitTruthSnapshot({ transitionContextId: 'component-test', input, finalizedRecommendation: recommend(input), pose: 'standing' });
  if (result.kind !== 'supported') throw new Error('fixture must be supported');
  return result.snapshot;
}

describe('OutfitExperience', () => {
  it('renders every garment once as an accessible numbered map node and once as ordered text', () => {
    const truth = snapshot();
    const html = renderToStaticMarkup(<OutfitExperience snapshot={truth} temp="mild" />);
    expect(html).toContain('Ta på innerst først');
    expect((html.match(/data-outfit-map-node=/g) ?? []).length).toBe(truth.garments.length);
    expect((html.match(/data-outfit-row=/g) ?? []).length).toBe(truth.garments.length);
    expect((html.match(/data-outfit-connector=/g) ?? []).length).toBe(truth.garments.length);
    expect(html).toContain('aria-pressed="false"');
  });
});
