import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ComponentProps } from 'react';
import i18next from 'i18next';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { HomeGarmentAlternativeGroup } from '../../../lib/outfit/home-garment-alternatives.js';
import { ResultSurface } from '../ResultSurface.js';
import { resultCopyFor } from '../result-localization.js';
import type { ResultRow } from '../result-rows.js';

function row(overrides: Partial<ResultRow> = {}): ResultRow {
  const base = {
    key: 'k1',
    outfitItemId: null,
    position: 1,
    label: 'langermet ullbody',
    roleLabel: 'Innerst',
    garmentId: 'langermet-ullbody',
    ...overrides,
  };
  return { displayLabel: base.label, ...base };
}

function outfitItemId(value: string): NonNullable<ResultRow['outfitItemId']> {
  return value as NonNullable<ResultRow['outfitItemId']>;
}

function renderResult(
  rows: readonly ResultRow[],
  overrides: Partial<ComponentProps<typeof ResultSurface>> = {},
): string {
  return renderToStaticMarkup(
    <ResultSurface
      rows={rows}
      headingId="result-heading"
      isFresh={false}
      reducedMotion={false}
      {...overrides}
    />,
  );
}

function cssRuleFor(css: string, selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return css.match(new RegExp(`(?:^|\\n)\\s*${escapedSelector}\\s*\\{[^}]*\\}`, 'u'))?.[0] ?? '';
}

function alternativeGroup(itemId: NonNullable<ResultRow['outfitItemId']>): HomeGarmentAlternativeGroup {
  const fact = {
    text: 'Ull jevner ut temperatur og håndterer fukt.',
    sourceLabel: 'Woolmark',
    sourceUrl: 'https://example.com/wool',
  };
  return {
    source: {
      itemId,
      catalogGarmentId: 'langermet-ullbody',
      name: 'Langermet ullbody',
      imageSrc: '/illustrations/garments/langermet-ullbody.webp',
      fact,
      advantages: ['Jevner ut temperatur'],
      tradeoffs: ['Krever skånsom vask'],
    },
    alternatives: [{
      optionId: 'option:fleece',
      sourceItemId: itemId,
      targetCatalogGarmentId: 'fleecedress',
      name: 'Fleecedress',
      imageSrc: '/illustrations/garments/fleecedress.webp',
      fact,
      advantages: ['Tørker raskt'],
      tradeoffs: ['Håndterer fukt annerledes enn ull'],
    }],
  };
}

describe('ResultSurface — vertical garment list', () => {
  it('renders one ordered list in dressing order, with no horizontal carousel', () => {
    const copy = resultCopyFor(i18next.resolvedLanguage);
    const rows = [
      row({ key: 'r1', position: 1 }),
      row({ key: 'r2', position: 2, label: 'ull-jakke', roleLabel: 'Mellomlag', garmentId: 'ull-jakke' }),
      row({ key: 'r3', position: 3, label: 'regnjakke', roleLabel: 'Ytterst', garmentId: 'regnjakke' }),
    ];
    const html = renderResult(rows);

    expect(html).toContain('<ol class="hjm-rows hjm-result-list"');
    expect(html).toContain(`aria-label="${copy.progressLabel}"`);
    expect(html).toContain('data-garment-count="3"');
    expect((html.match(/<li class="hjm-row-item"/gu) ?? [])).toHaveLength(3);
    expect(html.indexOf('>Langermet ullbody<')).toBeLessThan(html.indexOf('>Ull-jakke<'));
    expect(html.indexOf('>Ull-jakke<')).toBeLessThan(html.indexOf('>Regnjakke<'));
    expect(html).not.toContain('hjm-journey-rail');
    expect(html).not.toContain('data-loop-band');
    expect(html).not.toContain(copy.carouselHint);
  });

  it('makes the entire garment row a named button that opens details', () => {
    const copy = resultCopyFor(i18next.resolvedLanguage);
    const html = renderResult([row({})]);

    expect(html).toContain('<button type="button" class="hjm-row"');
    expect(html).toContain(`aria-label="${copy.openGarment('Langermet ullbody')}"`);
    expect(html).toContain('class="hjm-swap hjm-row-next"');
    expect(html).not.toContain('class="hjm-swap-label"');
    expect(html).not.toContain('class="hjm-cta"');
  });

  it('keeps every row above 44px and uses a compact square garment plate', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/components/hjem/hjem-monter.css'), 'utf8');
    const listRule = cssRuleFor(css, '.hjm-result-list.hjm-rows');
    const rowRule = cssRuleFor(css, '.hjm-result-list .hjm-row');
    const thumbRule = cssRuleFor(css, '.hjm-result-list .hjm-thumb');
    const chevronRule = cssRuleFor(css, '.hjm-result-list .hjm-row-next');

    expect(listRule).toMatch(/margin:\s*0;/u);
    expect(rowRule).toMatch(/min-height:\s*68px;/u);
    expect(thumbRule).toMatch(/width:\s*48px;/u);
    expect(thumbRule).toMatch(/height:\s*48px;/u);
    expect(thumbRule).toMatch(/aspect-ratio:\s*1;/u);
    expect(chevronRule).toMatch(/block-size:\s*var\(--dw-size-touch\);/u);
  });

  it('passes only engine-authorized alternative groups into the detail sheet contract', () => {
    const approvedId = outfitItemId('outfit:approved');
    const group = alternativeGroup(approvedId);
    const html = renderResult([
      row({ outfitItemId: approvedId }),
      row({ key: 'r2', position: 2, outfitItemId: outfitItemId('outfit:other') }),
    ], { alternativeGroups: [group] });
    const source = readFileSync(resolve(process.cwd(), 'src/components/hjem/ResultSurface.tsx'), 'utf8');

    expect(html).not.toContain('data-garment-detail-sheet');
    expect(source).toContain('alternativeGroups.find');
    expect(source).toContain('group.source.itemId === row.outfitItemId');
    expect(source).toContain('alternativeGroup: openRow.alternativeGroup');
  });

  it('shows real flat garment assets for catalog and material-preference garments', () => {
    const html = renderResult([
      row({ key: 'f1', position: 1, label: 'fleecedress', garmentId: 'fleecedress' }),
      row({ key: 'f2', position: 2, label: 'fleecejakke', garmentId: 'fleecejakke' }),
      row({ key: 's1', position: 3, label: 'saueskinn i vogn', garmentId: 'sauekinn-i-vogn' }),
    ]);

    expect(html).toContain('/illustrations/garments/fleecedress.webp');
    expect(html).toContain('/illustrations/garments/fleecejakke.webp');
    expect(html).toContain('/illustrations/garments/sauekinn-i-vogn.webp');
    expect(html).not.toMatch(/hjm-thumb[^>]*>S</u);
  });

  it('gates the staggered entry animation with isFresh and reducedMotion', () => {
    const rows = [
      row({ key: 'r1', position: 1 }),
      row({ key: 'r2', position: 2, label: 'ull-jakke', garmentId: 'ull-jakke' }),
    ];
    const fresh = renderResult(rows, { isFresh: true });
    expect(fresh).toContain('data-fresh="true"');
    expect(fresh).toContain('animation-delay:50ms');
    expect(fresh).toContain('animation-delay:130ms');

    const cached = renderResult(rows, { isFresh: false });
    expect(cached).toContain('data-fresh="false"');
    expect(cached).not.toContain('animation-delay');

    const reduced = renderResult(rows, { isFresh: true, reducedMotion: true });
    expect(reduced).toContain('data-fresh="false"');
    expect(reduced).not.toContain('animation-delay');
  });

  it('keeps the result avatar in HjemMonter rather than inside the list', () => {
    const resultSource = readFileSync(resolve(process.cwd(), 'src/components/hjem/ResultSurface.tsx'), 'utf8');
    const homeSource = readFileSync(resolve(process.cwd(), 'src/components/hjem/HjemMonter.tsx'), 'utf8');

    expect(resultSource).not.toContain('data-result-avatar-seam');
    expect(homeSource).toContain('data-result-avatar-seam');
    expect(homeSource).toContain('/maskot-resultat-sveip.webp');
  });

  it('renders a localized empty state without mounting an empty dialog', () => {
    const copy = resultCopyFor(i18next.resolvedLanguage);
    const html = renderResult([]);

    expect(html).toContain(`<p class="hjm-journey-empty" role="status">${copy.empty}</p>`);
    expect(html).not.toContain('<ol');
    expect(html).not.toContain('<dialog');
  });
});
