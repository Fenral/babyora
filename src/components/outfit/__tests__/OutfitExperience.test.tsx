import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { recommend } from '../../../lib/wool-layers/recommend.js';
import type { OutfitAlternativeOptionV1 } from '../../../lib/outfit/alternative-options.js';
import { createOutfitTruthSnapshot } from '../../../lib/outfit/outfit-truth.js';
import { useOutfitSelectionStore } from '../../../state/outfit-selection-store.js';
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

  it('fails closed before exposing rejected or hostile alternative props', () => {
    const truth = snapshot();
    useOutfitSelectionStore.getState().close();
    const rejected = Object.freeze([
      Object.freeze({ sourceItemId: truth.garments[0]!.itemId }),
    ]) as unknown as readonly OutfitAlternativeOptionV1[];
    const hostile = new Proxy([], {
      get() {
        throw new Error('untrusted options must not be reflected by render');
      },
    }) as unknown as readonly OutfitAlternativeOptionV1[];

    const rejectedHtml = renderToStaticMarkup(
      <OutfitExperience snapshot={truth} options={rejected} temp="mild" />,
    );
    expect(rejectedHtml).not.toContain('Se alternativ');
    expect(() =>
      renderToStaticMarkup(
        <OutfitExperience snapshot={truth} options={hostile} temp="mild" />,
      ),
    ).not.toThrow();
  });

  it('uses truthful non-modal dialog semantics for the inline comparison', () => {
    const source = readFileSync(
      new URL('../OutfitExperience.tsx', import.meta.url),
      'utf8',
    );
    expect(source).toContain('<dialog');
    expect(source).not.toContain('aria-modal="true"');
    expect(source).not.toContain('role="dialog"');
  });

  it('renders the conservative 320px/200% layout geometry without a fixed 560px rail', () => {
    const truth = snapshot();
    const html = renderToStaticMarkup(
      <OutfitExperience snapshot={truth} temp="mild" />,
    );
    expect(html).toContain('data-outfit-layout-width="320"');
    expect(html).toContain('data-outfit-text-scale="2"');
    expect(html).toMatch(/aspect-ratio:320\s*\/\s*\d+/);
    const source = readFileSync(
      new URL('../Antrekkskart.tsx', import.meta.url),
      'utf8',
    );
    expect(source).not.toContain('layoutOutfitMap(snapshot, 560)');
  });
});
