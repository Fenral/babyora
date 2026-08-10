import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import i18next from 'i18next';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { HomeGarmentAlternativeGroup } from '../../../lib/outfit/home-garment-alternatives.js';
import type { OutfitItemId } from '../../../lib/outfit/outfit-truth.js';
import { GarmentFactSheet, type GarmentFactSheetItem } from '../GarmentFactSheet.js';
import { resultCopyFor } from '../result-localization.js';

const FACT = {
  text: 'The complete garment fact stays available without making the Home list taller.',
  sourceLabel: 'Woolmark',
  sourceUrl: 'https://example.com/wool',
};

function item(overrides: Partial<GarmentFactSheetItem> = {}): GarmentFactSheetItem {
  return {
    label: 'Warm wool set',
    roleLabel: 'Base layer',
    position: 1,
    total: 4,
    imageSrc: '/illustrations/garments/ullsett-tykt.webp',
    fact: FACT,
    alternativeGroup: null,
    ...overrides,
  };
}

function group(): HomeGarmentAlternativeGroup {
  const itemId = 'outfit:base:1' as OutfitItemId;
  return {
    source: {
      itemId,
      catalogGarmentId: 'langermet-ullbody',
      name: 'Recommended wool body',
      imageSrc: '/illustrations/garments/langermet-ullbody.webp',
      fact: FACT,
      advantages: ['Balances temperature'],
      tradeoffs: ['Needs gentle washing'],
    },
    alternatives: [{
      optionId: 'option:fleece',
      sourceItemId: itemId,
      targetCatalogGarmentId: 'fleecedress',
      name: 'Fleece alternative',
      imageSrc: '/illustrations/garments/fleecedress.webp',
      fact: FACT,
      advantages: ['Dries quickly'],
      tradeoffs: ['Handles moisture differently'],
    }],
  };
}

function renderSheet(sheetItem: GarmentFactSheetItem): string {
  return renderToStaticMarkup(
    <GarmentFactSheet
      item={sheetItem}
      isOpen
      onClose={vi.fn()}
      triggerRef={{ current: null }}
    />,
  );
}

describe('GarmentFactSheet', () => {
  it('renders a native bottom-sheet contract with identity and complete sourced fact', () => {
    const copy = resultCopyFor(i18next.resolvedLanguage);
    const html = renderSheet(item());

    expect(html).toContain('<dialog');
    expect(html).toContain('class="home-origin-sheet hgd-sheet"');
    expect(html).toContain('data-garment-detail-sheet="true"');
    expect(html).toContain('class="hgd-sheet__handle"');
    expect(html).toContain(copy.order(1, 4));
    expect(html).toContain('Base layer');
    expect(html).toContain('<h2 id="hgd-sheet-title">Warm wool set</h2>');
    expect(html).toContain('/illustrations/garments/ullsett-tykt.webp');
    expect(html).toContain(copy.goodToKnow);
    expect(html).toContain('The complete garment fact stays available');
    expect(html).toContain('href="https://example.com/wool"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noreferrer"');
    expect(html).toContain('Woolmark');
  });

  it('omits fact and Alternatives regions when the engine has provided neither', () => {
    const copy = resultCopyFor(i18next.resolvedLanguage);
    const html = renderSheet(item({ fact: null, alternativeGroup: null }));

    expect(html).not.toContain('class="hgd-sheet__fact"');
    expect(html).not.toContain('class="hgd-sheet__alternatives');
    expect(html).not.toContain(copy.alternatives);
  });

  it('shows one collapsed Alternatives action only for an authorized group', () => {
    const copy = resultCopyFor(i18next.resolvedLanguage);
    const html = renderSheet(item({ alternativeGroup: group() }));

    expect(html).toContain('class="hgd-sheet__alternatives ba-press"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="hgd-alternative-comparison"');
    expect(html).toContain(copy.alternatives);
    expect(html).not.toContain('id="hgd-alternative-comparison"');
    expect(html).not.toContain('Fleece alternative');
  });

  it('uses the shared Home bottom-sheet lifecycle with backdrop close and focus return', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/hjem/GarmentFactSheet.tsx'), 'utf8');
    const motionSource = readFileSync(resolve(process.cwd(), 'src/components/hjem/useOriginDialogTransition.ts'), 'utf8');

    expect(source).toContain('useOriginDialogTransition({');
    expect(source).toContain('onCancel={handleCancel}');
    expect(source).toContain('requestClose');
    expect(motionSource).toContain('dialog.showModal()');
    expect(motionSource).toContain("dialog.addEventListener('close', handleClose)");
    expect(motionSource).toContain('triggerRef.current?.focus()');
    expect(source).toContain('event.target !== dialog');
    expect(source).not.toContain("from '../ui/Sheet");
  });

  it('anchors above the safe area with a 44px close target and reduced-motion fallback', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/components/hjem/GarmentFactSheet.css'), 'utf8');
    const motionCss = readFileSync(resolve(process.cwd(), 'src/components/hjem/origin-dialog-transition.css'), 'utf8');

    expect(css).toMatch(/\.hgd-sheet\s*\{[\s\S]*?margin:\s*auto auto max\(8px, env\(safe-area-inset-bottom/u);
    expect(css).toMatch(/\.hgd-sheet::backdrop\s*\{[\s\S]*?backdrop-filter:\s*blur\(5px\)/u);
    expect(css).toMatch(/\.hgd-sheet__close\s*\{[\s\S]*?inline-size:\s*44px;[\s\S]*?block-size:\s*44px;/u);
    expect(motionCss).toMatch(/\[data-motion-disabled='true'\]::backdrop\s*\{\s*animation:\s*none;/u);
    expect(motionCss).toMatch(/@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*?animation:\s*none/u);
  });
});
