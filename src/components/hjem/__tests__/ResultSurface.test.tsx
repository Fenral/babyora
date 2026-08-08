import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ComponentProps } from 'react';
import i18next from 'i18next';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { WhyContext } from '../../../data/garment-info.js';
import { ResultSurface } from '../ResultSurface.js';
import { resultCopyFor } from '../result-localization.js';
import type { ResultRow } from '../result-rows.js';

function row(overrides: Partial<ResultRow>): ResultRow {
  const base = {
    key: 'k1',
    position: 1,
    label: 'langermet ullbody',
    roleLabel: 'Innerst',
    garmentId: 'langermet-ullbody',
    ...overrides,
  };
  return { displayLabel: base.label, ...base };
}

const WHY_CONTEXT: WhyContext = {
  childName: 'Lillian',
  activity: 'utelek',
  tempC: 4,
  feelsLikeC: 1,
  windMs: 3,
  precipMmH: 0.3,
};

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
      whyContext={WHY_CONTEXT}
      onSwapRow={vi.fn()}
      {...overrides}
    />,
  );
}

function cssRuleFor(css: string, selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return css.match(new RegExp(`(?:^|\\n)\\s*${escapedSelector}\\s*\\{[^}]*\\}`, 'u'))?.[0] ?? '';
}

describe('ResultSurface — overview-first garment deck', () => {
  it('renders the overview as rail card zero, followed by one card per garment', () => {
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
    expect((html.match(/<li class="hjm-row-item"/gu) ?? []).length).toBe(rows.length);
    expect((html.match(/data-hjm-journey-card="true"/gu) ?? []).length).toBe(rows.length);

    const overview = html.slice(overviewIndex, firstGarmentIndex);
    const garmentCards = html.slice(firstGarmentIndex);
    const expectedPaths = [
      '/illustrations/garments/langermet-ullbody.webp',
      '/illustrations/garments/ull-jakke.webp',
    ];
    for (const section of [overview, garmentCards]) {
      expect(section.indexOf(expectedPaths[0])).toBeLessThan(section.indexOf(expectedPaths[1]));
    }
  });

  it('has one More info action per garment and no global Why this outfit footer', () => {
    const copy = resultCopyFor(i18next.resolvedLanguage);
    const rows = [
      row({ key: 'r1', position: 1 }),
      row({ key: 'r2', position: 2, label: 'ull-jakke', garmentId: 'ull-jakke' }),
    ];
    const html = renderResult(rows);
    expect(html).not.toContain('class="hjm-cta"');
    expect((html.match(/class="hjm-journey-detail"/gu) ?? [])).toHaveLength(rows.length);
    expect((html.match(new RegExp(`>${copy.moreInfo}<`, 'gu')) ?? [])).toHaveLength(rows.length);
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

  it('keeps image, order, role, name and Why today on every garment card', () => {
    const copy = resultCopyFor(i18next.resolvedLanguage);
    const html = renderResult([row({})]);
    const card = html.slice(html.indexOf('data-hjm-journey-card="true"'));

    expect(html).toContain('/illustrations/garments/langermet-ullbody.webp');
    expect(card).toContain(copy.order(1, 1));
    expect(card).toContain(copy.role('Innerst'));
    expect(card).toContain('Langermet ullbody');
    expect(card).toContain(copy.whyTitle);
    expect(card).toMatch(/class="hjm-journey-why"[\s\S]*?<p>\S[\s\S]*?<\/p>/u);
  });

  it('moves Good to know behind one localized More info button', () => {
    const copy = resultCopyFor(i18next.resolvedLanguage);
    const html = renderResult([row({})]);
    const card = html.slice(html.indexOf('data-hjm-journey-card="true"'));

    expect(card).not.toContain('<details');
    expect(card).not.toContain('hjm-journey-fact');
    expect(card).not.toContain('Woolmark');
    expect(card).not.toContain('rel="noopener noreferrer"');
    expect(card).toMatch(/<button[^>]*class="hjm-journey-detail"[^>]*>/u);
    expect(card).toContain(copy.moreInfo);
    expect(card).not.toContain('aria-expanded=');
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
    const freshGarments = freshRail.slice(freshRail.indexOf('data-hjm-journey-card="true"'));
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
  });

  it('uses a compact default card and a dots-only pager', () => {
    const rows = [
      row({ key: 'r1', position: 1 }),
      row({ key: 'r2', position: 2, label: 'ull-jakke', garmentId: 'ull-jakke' }),
    ];
    const html = renderResult(rows);
    const css = readFileSync(resolve(process.cwd(), 'src/components/hjem/hjem-monter.css'), 'utf8');
    const cardInnerRule = cssRuleFor(css, '.hjm-journey-card-inner');

    expect(cardInnerRule).not.toMatch(/min-height:\s*500px;/u);
    expect(cardInnerRule).not.toMatch(/height:\s*100%;/u);
    expect(html).not.toContain('class="hjm-journey-nav-button"');
    expect(html).toContain('class="hjm-sr-only"');
    expect((html.match(/data-active="(?:true|false)"/gu) ?? [])).toHaveLength(rows.length + 1);
  });

  it('uses matching 11/6 image frames with centered, contained 92% artwork', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/components/hjem/hjem-monter.css'), 'utf8');

    for (const selector of ['.hjm-thumb', '.hjm-journey-image']) {
      const frameRule = cssRuleFor(css, selector);
      expect(frameRule, `${selector} rule is missing`).not.toBe('');
      expect(frameRule).toMatch(/aspect-ratio:\s*11\s*\/\s*6;/u);
      expect(frameRule).toMatch(/display:\s*grid;/u);
      expect(frameRule).toMatch(/place-items:\s*center;/u);
    }

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

  it('gives the More info action at least a 44px touch target', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/components/hjem/hjem-monter.css'), 'utf8');
    expect(css).toMatch(/\.hjm-journey-detail\s*\{[\s\S]*?min-height:\s*44px;/);
    expect(css).not.toMatch(/\.hjm-journey-fact summary\s*\{[\s\S]*?min-height:\s*44px;/);
  });
});
