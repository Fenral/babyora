import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

import type { HomeGarmentAlternativeGroup } from '../../../lib/outfit/home-garment-alternatives.js';
import { GarmentAlternativesSheet } from '../GarmentAlternativesSheet.js';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'en', resolvedLanguage: 'en' },
  }),
}));

const GROUP = Object.freeze({
  source: Object.freeze({
    itemId: 'garment-source-1',
    catalogGarmentId: 'ull-jakke',
    name: 'Wool jacket',
    imageSrc: '/illustrations/garments/ull-jakke.webp',
    fact: Object.freeze({
      text: 'Wool helps even out temperature.',
      sourceLabel: 'Woolmark',
      sourceUrl: 'https://example.com/wool',
    }),
    advantages: Object.freeze(['Matched to today\'s complete outfit.']),
    tradeoffs: Object.freeze(['Another material may suit your preference.']),
  }),
  alternatives: Object.freeze([
    Object.freeze({
      optionId: 'option-1',
      sourceItemId: 'garment-source-1',
      targetCatalogGarmentId: 'fleecejakke',
      name: 'Fleece jacket',
      imageSrc: '/illustrations/garments/fleecejakke.webp',
      fact: Object.freeze({
        text: 'Fleece is lightweight and quick-drying.',
        sourceLabel: 'Polartec',
        sourceUrl: 'https://example.com/fleece',
      }),
      advantages: Object.freeze(['A safe alternative for today.']),
      tradeoffs: Object.freeze(['The warmth may differ.']),
    }),
    Object.freeze({
      optionId: 'option-2',
      sourceItemId: 'garment-source-1',
      targetCatalogGarmentId: 'bomullssett',
      name: 'Cotton set',
      imageSrc: '/illustrations/garments/bomullssett.webp',
      fact: Object.freeze({
        text: 'Cotton dries slowly when damp.',
        sourceLabel: 'National Park Service',
        sourceUrl: 'https://example.com/cotton',
      }),
      advantages: Object.freeze(['Soft against the skin.']),
      tradeoffs: Object.freeze(['Least forgiving when damp.']),
    }),
  ]),
}) as unknown as HomeGarmentAlternativeGroup;

describe('GarmentAlternativesSheet', () => {
  it('shows the recommendation and every authorized alternative without a selection CTA', () => {
    const html = renderToStaticMarkup(
      <GarmentAlternativesSheet
        group={GROUP}
        isOpen
        onClose={() => undefined}
        triggerRef={createRef<HTMLElement>()}
      />,
    );

    expect(html).toContain('<dialog');
    expect(html).toContain('aria-labelledby="hga-sheet-title"');
    expect(html).toContain('Wool jacket');
    expect(html).toContain('Matched to today&#x27;s complete outfit.');
    expect(html).toContain('Another material may suit your preference.');
    expect(html).toContain('Fleece jacket');
    expect(html).toContain('Cotton set');
    expect(html).toContain('A safe alternative for today.');
    expect(html).toContain('Least forgiving when damp.');
    expect(html).toContain('Polartec');
    expect(html).toContain('National Park Service');
    expect((html.match(/<button/g) ?? [])).toHaveLength(1);
    expect(html).not.toMatch(/Choose|Select|Swap|Bytt|Velg/u);
  });

  it('renders nothing without a verified group', () => {
    expect(renderToStaticMarkup(
      <GarmentAlternativesSheet
        group={null}
        isOpen
        onClose={() => undefined}
        triggerRef={createRef<HTMLElement>()}
      />,
    )).toBe('');
  });

  it('keeps the dialog fixed and the body scrollable with 44px controls', () => {
    const css = readFileSync(
      new URL('../GarmentAlternativesSheet.css', import.meta.url),
      'utf8',
    );
    expect(css).toMatch(/\.hga-sheet\s*\{[\s\S]*overflow:\s*hidden/u);
    expect(css).toMatch(/\.hga-sheet__body\s*\{[\s\S]*overflow-y:\s*auto/u);
    expect(css).toMatch(/\.hga-sheet__close\s*\{[\s\S]*inline-size:\s*44px[\s\S]*block-size:\s*44px/u);
    expect(css).not.toMatch(/animation(?:-name)?:|transition:/u);
  });
});
