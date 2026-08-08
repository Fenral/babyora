import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ComponentProps } from 'react';
import i18next from 'i18next';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ResultSurface } from '../ResultSurface.js';
import { resultCopyFor } from '../result-localization.js';
import type { ResultRow } from '../result-rows.js';

function row(overrides: Partial<ResultRow>): ResultRow {
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
  const copy = resultCopyFor(i18next.resolvedLanguage);
  return renderToStaticMarkup(
    <ResultSurface
      rows={rows}
      childLabel={copy.childSummary(rows.length, 'Lillian')}
      isFresh={false}
      reducedMotion={false}
      onSwapRow={vi.fn()}
      {...overrides}
    />,
  );
}

function cssRuleFor(css: string, selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return css.match(new RegExp(`(?:^|\\n)\\s*${escapedSelector}\\s*\\{[^}]*\\}`, 'u'))?.[0] ?? '';
}

function loopBandHtml(html: string, band: 'leading' | 'canonical' | 'trailing'): string {
  const marker = html.indexOf(`data-loop-band="${band}"`);
  if (marker < 0) return '';
  const start = html.lastIndexOf('<li', marker);
  const nextBand = band === 'leading' ? 'canonical' : band === 'canonical' ? 'trailing' : null;
  const nextMarker = nextBand === null ? -1 : html.indexOf(`data-loop-band="${nextBand}"`, marker + 1);
  const end = nextMarker < 0 ? html.length : html.lastIndexOf('<li', nextMarker);
  return html.slice(start, end < 0 ? html.length : end);
}

describe('ResultSurface — overview-first garment deck', () => {
  it('renders one semantic deck inside three physical loop bands', () => {
    const copy = resultCopyFor(i18next.resolvedLanguage);
    const rows = [
      row({ key: 'r1', position: 1 }),
      row({ key: 'r2', position: 2, label: 'ull-jakke', displayLabel: 'Ulljakke', roleLabel: 'Mellomlag', garmentId: 'ull-jakke' }),
    ];
    const html = renderResult(rows);
    const rail = html.slice(html.indexOf('<ol class="hjm-journey-rail"'));
    const overviewIndex = rail.indexOf('data-hjm-overview-card="true"');
    const firstGarmentIndex = rail.indexOf('data-hjm-journey-card="true"');

    expect(overviewIndex).toBeGreaterThan(-1);
    expect(firstGarmentIndex).toBeGreaterThan(overviewIndex);
    expect((rail.match(/data-hjm-overview-card="true"/gu) ?? [])).toHaveLength(1);
    expect((rail.match(/data-hjm-journey-card="true"/gu) ?? [])).toHaveLength(rows.length);
    expect((rail.match(/data-loop-band="(?:leading|canonical|trailing)"/gu) ?? []))
      .toHaveLength((rows.length + 1) * 3);
    expect((rail.match(/data-loop-clone="true"/gu) ?? []))
      .toHaveLength((rows.length + 1) * 2);
    expect((rail.match(/data-loop-clone="true" aria-hidden="true" inert=""/gu) ?? []))
      .toHaveLength((rows.length + 1) * 2);
    expect(rail).toContain(`aria-label="${copy.carouselLabel}"`);
  });

  it('keeps the same ordered garments in the overview and detail cards', () => {
    const rows = [
      row({ key: 'r1', position: 1 }),
      row({ key: 'r2', position: 2, label: 'ull-jakke', garmentId: 'ull-jakke' }),
      row({ key: 'r3', position: 3, label: 'regnjakke', garmentId: 'regnjakke' }),
    ];
    const html = renderResult(rows);
    const railIndex = html.indexOf('class="hjm-journey-rail"');
    const overviewIndex = html.indexOf('data-hjm-overview-card="true"', railIndex);
    const firstGarmentIndex = html.indexOf('data-hjm-journey-card="true"', overviewIndex);

    expect(overviewIndex).toBeGreaterThan(-1);
    expect(overviewIndex).toBeGreaterThan(railIndex);
    expect(firstGarmentIndex).toBeGreaterThan(overviewIndex);
    expect((html.match(/<li class="hjm-row-item"/gu) ?? []).length).toBe(rows.length * 3);
    expect((html.match(/data-hjm-journey-card="true"/gu) ?? []).length).toBe(rows.length);

    const canonical = loopBandHtml(html, 'canonical');
    const canonicalOverviewIndex = canonical.indexOf('data-hjm-overview-card="true"');
    const canonicalFirstGarmentIndex = canonical.indexOf('data-hjm-journey-card="true"');
    const overview = canonical.slice(canonicalOverviewIndex, canonicalFirstGarmentIndex);
    const garmentCards = canonical.slice(canonicalFirstGarmentIndex);
    expect((overview.match(/<li class="hjm-row-item"/gu) ?? [])).toHaveLength(rows.length);
    expect((garmentCards.match(/data-hjm-journey-card="true"/gu) ?? [])).toHaveLength(rows.length);
    const expectedPaths = [
      '/illustrations/garments/langermet-ullbody.webp',
      '/illustrations/garments/ull-jakke.webp',
    ];
    for (const section of [overview, garmentCards]) {
      expect(section.indexOf(expectedPaths[0])).toBeLessThan(section.indexOf(expectedPaths[1]));
    }
  });

  it('renders Alternatives only for an explicitly authorized outfit item and never renders More info or a global CTA', () => {
    const copy = resultCopyFor(i18next.resolvedLanguage);
    const approvedId = outfitItemId('outfit:approved');
    const equipmentId = outfitItemId('outfit:equipment');
    const rows = [
      row({ key: 'r1', outfitItemId: approvedId, position: 1 }),
      row({
        key: 'r2',
        outfitItemId: equipmentId,
        position: 2,
        label: 'regntrekk',
        displayLabel: 'Regntrekk',
        roleLabel: 'Tilbehør',
        garmentId: 'regntrekk',
      }),
    ];
    const html = renderResult(rows, {
      alternativeItemIds: new Set<string>([approvedId]),
    });
    const canonical = loopBandHtml(html, 'canonical');
    expect(html).not.toContain('class="hjm-cta"');
    expect((canonical.match(/class="hjm-journey-detail"/gu) ?? [])).toHaveLength(1);
    expect((canonical.match(new RegExp(`>${copy.alternatives}[\\s<]`, 'gu')) ?? [])).toHaveLength(1);
    expect(canonical).toContain(`aria-label="${copy.alternativesAria('Langermet ullbody')}"`);
    expect(canonical).not.toContain(`aria-label="${copy.alternativesAria('Regntrekk')}"`);
    expect(html).not.toContain(`>${copy.moreInfo}<`);
    expect(html).not.toContain('class="hjm-result-tools"');
    expect(html).not.toContain('Why this outfit?');
  });

  it('viser ekte flat WebP også for et tidligere udekket katalogplagg', () => {
    const html = renderResult([
      row({ label: 'saueskinn i vogn', displayLabel: 'Saueskinn i vogn', garmentId: 'sauekinn-i-vogn' }),
    ]);
    expect(html).toContain('/illustrations/garments/sauekinn-i-vogn.webp');
    expect(html).not.toMatch(/hjm-thumb[^>]*>S</);
  });

  it('viser materialpreferansens fleeceplagg med sine egne motiv', () => {
    const html = renderResult([
      row({ key: 'f1', position: 1, label: 'fleecedress', garmentId: 'fleecedress' }),
      row({ key: 'f2', position: 2, label: 'fleecejakke', garmentId: 'fleecejakke' }),
      row({ key: 'f3', position: 3, label: 'fleecebukse', garmentId: 'fleecebukse' }),
    ]);
    expect(html).toContain('/illustrations/garments/fleecedress.webp');
    expect(html).toContain('/illustrations/garments/fleecejakke.webp');
    expect(html).toContain('/illustrations/garments/fleecebukse.webp');
    expect(html).not.toContain('/illustrations/garments/ull-jakke.webp');
    expect(html).not.toContain('/illustrations/garments/ull-bukse.webp');
  });

  it('keeps image, order, role and name while removing Why today from every card', () => {
    const copy = resultCopyFor(i18next.resolvedLanguage);
    const html = renderResult([row({})]);
    const card = html.slice(html.indexOf('data-hjm-journey-card="true"'));

    expect(html).toContain('/illustrations/garments/langermet-ullbody.webp');
    expect(card).toContain(copy.order(1, 1));
    expect(card).toContain(copy.role('Innerst'));
    expect(card).toContain('Langermet ullbody');
    expect(html).not.toContain('class="hjm-journey-why"');
  });

  it('shows a localized Good to know fact directly on the garment card', () => {
    const copy = resultCopyFor(i18next.resolvedLanguage);
    const html = renderResult([row({})]);
    const card = html.slice(html.indexOf('data-hjm-journey-card="true"'));

    expect(card).not.toContain('<details');
    expect(card).toContain('class="hjm-journey-fact"');
    expect(card).toContain(`<h3>${copy.goodToKnow}</h3>`);
    expect(card).toMatch(/class="hjm-journey-fact"[\s\S]*?<p>\S[\s\S]*?<\/p>/u);
    expect(card).not.toContain('rel="noopener noreferrer"');
    expect(card).not.toContain('class="hjm-journey-detail"');
    expect(card).not.toContain(copy.moreInfo);
  });

  it('bruker den nye resultat-posen dekorativt i en eksplisitt assetsøm', () => {
    const html = renderResult([row({})]);
    expect(html).toContain('data-result-avatar-seam="true"');
    expect(html).toContain('/monter/maskot-resultat-sveip.webp');
    expect(html).toMatch(/maskot-resultat-sveip\.webp" alt=""/);
  });

  it('gater inngangskoreografien på isFresh og reducedMotion sammen', () => {
    const rows = [
      row({ key: 'r1', position: 1 }),
      row({ key: 'r2', position: 2, label: 'ull-jakke', garmentId: 'ull-jakke' }),
    ];
    const fresh = renderResult(rows, { isFresh: true });
    expect(fresh).toContain('data-fresh="true"');
    expect(fresh).toContain('animation-delay:50ms');
    expect(fresh).toContain('animation-delay:130ms');

    const freshRail = fresh.slice(fresh.indexOf('<ol class="hjm-journey-rail"'));
    const freshOverview = freshRail.slice(
      freshRail.indexOf('data-hjm-overview-card="true"'),
      freshRail.indexOf('data-hjm-journey-card="true"'),
    );
    expect(freshOverview).toContain('data-fresh="true"');
    expect((freshOverview.match(/animation-delay:/gu) ?? []).length).toBe(rows.length);
    const canonicalFreshBand = loopBandHtml(fresh, 'canonical');
    const freshGarments = canonicalFreshBand.slice(
      canonicalFreshBand.indexOf('data-hjm-journey-card="true"'),
    );
    expect(freshGarments).not.toContain('data-fresh');
    expect(freshGarments).not.toContain('animation-delay');

    const cached = renderResult(rows, { isFresh: false });
    expect(cached).toContain('data-fresh="false"');
    expect(cached).not.toContain('animation-delay');

    const reduced = renderResult(rows, { isFresh: true, reducedMotion: true });
    expect(reduced).toContain('data-fresh="false"');
    expect(reduced).not.toContain('animation-delay');
  });

  it('removes the visible swipe introduction while preserving an accessible hint and centered geometry', () => {
    const copy = resultCopyFor(i18next.resolvedLanguage);
    const html = renderResult([row({})]);
    const css = readFileSync(resolve(process.cwd(), 'src/components/hjem/hjem-monter.css'), 'utf8');
    const railRule = cssRuleFor(css, '.hjm-journey-rail');

    expect(html).not.toContain('class="hjm-journey-disclosure"');
    expect(html).not.toContain('class="hjm-journey-hint"');
    expect(html).not.toContain('Explore each garment');
    expect(html).not.toContain('Swipe sideways, from the base layer to the outer layer.');
    expect(html).toContain('class="hjm-sr-only"');
    expect(html).toContain(copy.carouselHint);
    expect(railRule).toMatch(/grid-auto-columns:\s*(?:var\([^)]*\)|min\([^;]+\));/u);
    expect(railRule).toMatch(/padding-inline:[^;]*calc\(/u);
    expect(railRule).toMatch(/scroll-padding-inline:[^;]*calc\(/u);
  });

  it('bruker native overflow og sentrert snap uten pointer-capture eller drag-transform', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/hjem/ResultSurface.tsx'), 'utf8');
    const css = readFileSync(resolve(process.cwd(), 'src/components/hjem/hjem-monter.css'), 'utf8');
    const cardRule = cssRuleFor(css, '.hjm-journey-card');
    expect(source).not.toContain('setPointerCapture');
    expect(source).not.toContain('onPointerMove');
    expect(source).not.toContain('scrollIntoView');
    expect(source).not.toContain('--kps-drag');
    expect(source).not.toContain('card.offsetLeft - rail.scrollLeft - rail.clientLeft');
    expect(source).toMatch(/rail\.scrollLeft\s*\+\s*rail\.clientWidth\s*\/\s*2/u);
    expect(source).toMatch(/card\.offsetLeft\s*\+\s*card\.(?:offsetWidth|clientWidth)\s*\/\s*2/u);
    expect(css).toMatch(/\.hjm-journey-rail\s*\{[\s\S]*?overflow-x:\s*auto;/);
    expect(css).toMatch(/\.hjm-journey-rail\s*\{[\s\S]*?scroll-snap-type:\s*x mandatory;/);
    expect(css).toMatch(/\.hjm-journey-rail\s*\{[\s\S]*?touch-action:\s*pan-x pan-y;/);
    expect(css).toMatch(/\.hjm-journey-rail\s*\{[\s\S]*?-webkit-overflow-scrolling:\s*touch;/);
    expect(cardRule).toMatch(/scroll-snap-align:\s*center;/u);
    expect(cardRule).toMatch(/scroll-snap-stop:\s*normal;/u);
  });

  it('keeps the overview auto-height and every garment card at the compact 324px standard', () => {
    const rows = [
      row({ key: 'r1', position: 1 }),
      row({ key: 'r2', position: 2, label: 'ull-jakke', garmentId: 'ull-jakke' }),
      row({ key: 'r3', position: 3, label: 'ull-bukse', garmentId: 'ull-bukse' }),
      row({ key: 'r4', position: 4, label: 'tynn-lue', garmentId: 'tynn-lue' }),
    ];
    const html = renderResult(rows);
    const css = readFileSync(resolve(process.cwd(), 'src/components/hjem/hjem-monter.css'), 'utf8');
    const cardInnerRule = cssRuleFor(css, '.hjm-journey-card-inner');
    const detailCardRule = cssRuleFor(
      css,
      '.hjm-journey-card:not(.hjm-journey-overview-card) .hjm-journey-card-inner',
    );
    const railRule = cssRuleFor(css, '.hjm-journey-rail');
    const headingRule = cssRuleFor(css, '.hjm-journey-overview-heading');
    const overviewRowRule = cssRuleFor(css, '.hjm-journey-overview-list .hjm-row');

    expect(cardInnerRule).toMatch(/height:\s*auto;/u);
    expect(cardInnerRule).toMatch(/padding:\s*12px;/u);
    expect(railRule).toMatch(/--hjm-detail-card-height:\s*324px;/u);
    expect(detailCardRule).toMatch(/height:\s*var\(--hjm-detail-card-height\);/u);
    expect(headingRule).toMatch(/min-height:\s*44px;/u);
    expect(overviewRowRule).toMatch(/min-height:\s*72px;/u);
    expect(html).toContain('data-hjm-overview-card="true" data-garment-count="4"');
    expect(html).not.toContain('class="hjm-journey-nav-button"');
    expect(html).toContain('class="hjm-sr-only"');
    expect((html.match(/data-active="(?:true|false)"/gu) ?? [])).toHaveLength(rows.length + 1);
  });

  it('measures the active card to collapse the rail from a tall overview to a detail card without reduced-motion interpolation', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/components/hjem/hjem-monter.css'), 'utf8');
    const railRule = cssRuleFor(css, '.hjm-journey-rail');
    const adaptiveRule = cssRuleFor(css, ".hjm-journey-rail[data-adaptive-height='true']");
    const reducedRule = cssRuleFor(css, ".hjm-journey-rail[data-reduced-motion='true']");
    const reducedHtml = renderResult([row({})], { reducedMotion: true });

    expect(reducedHtml).toContain('data-adaptive-height="false"');
    expect(railRule).toMatch(/transition:\s*block-size\s+var\(--dw-m-state\)/u);
    expect(adaptiveRule).toMatch(/block-size:\s*calc\(var\(--hjm-active-card-height\) \+ 22px\);/u);
    expect(reducedRule).toMatch(/transition:\s*none;/u);
    expect(reducedHtml).toContain('data-reduced-motion="true"');
  });

  it('keeps the overview thumbnail ratio while the detail plate is a centered, contained 92px stage', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/components/hjem/hjem-monter.css'), 'utf8');
    const thumbRule = cssRuleFor(css, '.hjm-thumb');
    const detailRule = cssRuleFor(css, '.hjm-journey-image');

    expect(thumbRule).toMatch(/aspect-ratio:\s*11\s*\/\s*6;/u);
    expect(thumbRule).toMatch(/display:\s*grid;/u);
    expect(thumbRule).toMatch(/place-items:\s*center;/u);
    expect(detailRule).toMatch(/height:\s*92px;/u);
    expect(detailRule).toMatch(/aspect-ratio:\s*auto;/u);
    expect(detailRule).toMatch(/display:\s*grid;/u);
    expect(detailRule).toMatch(/place-items:\s*center;/u);

    for (const selector of ['.hjm-thumb img', '.hjm-journey-image img']) {
      const imageRule = cssRuleFor(css, selector);
      expect(imageRule, `${selector} rule is missing`).not.toBe('');
      expect(imageRule).toMatch(/width:\s*92%;/u);
      expect(imageRule).toMatch(/height:\s*92%;/u);
      expect(imageRule).toMatch(/display:\s*block;/u);
      expect(imageRule).toMatch(/object-fit:\s*contain;/u);
      expect(imageRule).toMatch(/object-position:\s*center;/u);
    }
  });

  it('makes overview rows direct, named destinations for their garment cards', () => {
    const copy = resultCopyFor(i18next.resolvedLanguage);
    const html = renderResult([row({})]);

    expect(html).toContain(`aria-label="${copy.openGarment('Langermet ullbody')}"`);
    expect(html).toContain('class="hjm-swap hjm-row-next"');
    expect(html).not.toContain('class="hjm-swap-label"');
  });

  it('falls back to the focusable card when a destination has no Alternatives action', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/hjem/ResultSurface.tsx'), 'utf8');
    expect(source).toMatch(/querySelector<HTMLElement>\('\.hjm-journey-detail'\)[\s\S]*?\?\?\s*card\.querySelector<HTMLElement>\('\[data-hjm-card-focus\]'\)/u);
    expect(source).toContain('focusTarget?.focus({ preventScroll: true });');
  });

  it('gives the conditional Alternatives action at least a 44px touch target', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/components/hjem/hjem-monter.css'), 'utf8');
    expect(css).toMatch(/\.hjm-journey-detail\s*\{[\s\S]*?min-height:\s*44px;/);
  });
});
