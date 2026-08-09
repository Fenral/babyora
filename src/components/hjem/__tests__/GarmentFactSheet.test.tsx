import i18next from 'i18next';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { GarmentFactSheet } from '../GarmentFactSheet.js';
import { resultCopyFor } from '../result-localization.js';

describe('GarmentFactSheet', () => {
  it('shows the complete sourced fact in one shared accessible sheet', () => {
    const copy = resultCopyFor(i18next.resolvedLanguage);
    const html = renderToStaticMarkup(
      <GarmentFactSheet
        item={{
          label: 'Warm wool set',
          imageSrc: '/illustrations/garments/ullsett-tykt.webp',
          fact: {
            text: 'The complete garment fact is available without changing the carousel height.',
            sourceLabel: 'Woolmark',
            sourceUrl: 'https://example.com/wool',
          },
        }}
        isOpen
        onClose={vi.fn()}
        triggerRef={{ current: null }}
      />,
    );

    expect(html).toContain('data-garment-fact-sheet="true"');
    expect(html).toContain(copy.moreInfoTitle('Warm wool set'));
    expect(html).toContain(copy.goodToKnow);
    expect(html).toContain('The complete garment fact is available');
    expect(html).toContain('href="https://example.com/wool"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noreferrer"');
    expect(html).toContain('Woolmark');
  });
});
