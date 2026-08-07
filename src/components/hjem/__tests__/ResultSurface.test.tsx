import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ResultSurface } from '../ResultSurface.js';
import type { ResultRow } from '../result-rows.js';

function row(overrides: Partial<ResultRow>): ResultRow {
  // T1A: displayLabel er det UI faktisk viser (result-rows.ts avleder den
  // fra visningsnavn-kilden); testen speiler label når intet annet er gitt.
  const base = {
    key: 'k1', position: 1, label: 'Langermet ullbody', roleLabel: 'Innerst', garmentId: 'langermet-ullbody',
    ...overrides,
  };
  return { displayLabel: base.label, ...base };
}

describe('ResultSurface', () => {
  it('renders a real <ol> with one <li> per row (a11y: visible numbering via list semantics)', () => {
    const rows = [
      row({ key: 'r1', position: 1, label: 'Langermet ullbody', roleLabel: 'Innerst', garmentId: 'langermet-ullbody' }),
      row({ key: 'r2', position: 2, label: 'Ullgenser', roleLabel: 'Mellomlag', garmentId: null }),
    ];
    const html = renderToStaticMarkup(
      <ResultSurface
        rows={rows}
        childLabel="7 plagg for Lillian, innerst til ytterst"
        isFresh={false}
        reducedMotion={false}
        onSwapRow={vi.fn()}
        onStartDressing={vi.fn()}
        startDressingDisabled={false}
        onWhy={vi.fn()}
      />,
    );
    expect(html).toContain('<ol');
    expect((html.match(/<li class="hjm-row-item"/g) ?? []).length).toBe(2);
    expect(html).toContain('Dagens antrekk');
    expect(html).toContain('7 plagg for Lillian, innerst til ytterst');
    expect(html).toContain('Kle på, steg for steg');
    expect(html).toContain('Hvorfor akkurat dette?');
  });

  it('renders a real garment image when a garmentId resolves via monter-assets', () => {
    const html = renderToStaticMarkup(
      <ResultSurface
        rows={[row({ garmentId: 'langermet-ullbody' })]}
        childLabel="1 plagg"
        isFresh={false}
        reducedMotion={false}
        onSwapRow={vi.fn()}
        onStartDressing={vi.fn()}
        startDressingDisabled={false}
        onWhy={vi.fn()}
      />,
    );
    expect(html).toContain('/monter/plagg-langermet-ullbody.webp');
  });

  it('falls back to a neutral vitrine placeholder (initial letter, no <img>) when the garment has no image', () => {
    const html = renderToStaticMarkup(
      <ResultSurface
        rows={[row({ label: 'Saueskinn i vogn', garmentId: 'sauekinn-i-vogn' })]}
        childLabel="1 plagg"
        isFresh={false}
        reducedMotion={false}
        onSwapRow={vi.fn()}
        onStartDressing={vi.fn()}
        startDressingDisabled={false}
        onWhy={vi.fn()}
      />,
    );
    expect(html).not.toContain('<img');
    expect(html).toMatch(/class="hjm-thumb"[^>]*>S</);
  });

  it('falls back to a placeholder when garmentId itself is null (label not recognised at all)', () => {
    const html = renderToStaticMarkup(
      <ResultSurface
        rows={[row({ label: 'Ukjent plagg', garmentId: null })]}
        childLabel="1 plagg"
        isFresh={false}
        reducedMotion={false}
        onSwapRow={vi.fn()}
        onStartDressing={vi.fn()}
        startDressingDisabled={false}
        onWhy={vi.fn()}
      />,
    );
    expect(html).not.toContain('<img');
    expect(html).toContain('>U<');
  });

  it('the whole row is one tappable button containing the info affordance ("Detaljer") — never a nested interactive element', () => {
    const html = renderToStaticMarkup(
      <ResultSurface
        rows={[row({})]}
        childLabel="1 plagg"
        isFresh={false}
        reducedMotion={false}
        onSwapRow={vi.fn()}
        onStartDressing={vi.fn()}
        startDressingDisabled={false}
        onWhy={vi.fn()}
      />,
    );
    expect((html.match(/<button/g) ?? []).length).toBe(3); // 1 row + Kle på + Hvorfor
    // P10.1 (judge finding C10, "Bytt = ENDRE, always"): the chip opens
    // PlaggDetailSheet, which is deliberately informational-only (never
    // performs the swap itself) — "Bytt" was a false promise here.
    expect(html).toContain('Detaljer');
    expect(html).not.toContain('>Bytt<');
  });

  it('gates the .is-fresh row-in stagger animation on isFresh AND reducedMotion together', () => {
    const rows = [row({})];
    const fresh = renderToStaticMarkup(
      <ResultSurface rows={rows} childLabel="x" isFresh reducedMotion={false} onSwapRow={vi.fn()} onStartDressing={vi.fn()} startDressingDisabled={false} onWhy={vi.fn()} />,
    );
    expect(fresh).toContain('data-fresh="true"');
    expect(fresh).toContain('animation-delay:50ms');

    const cachedReopen = renderToStaticMarkup(
      <ResultSurface rows={rows} childLabel="x" isFresh={false} reducedMotion={false} onSwapRow={vi.fn()} onStartDressing={vi.fn()} startDressingDisabled={false} onWhy={vi.fn()} />,
    );
    expect(cachedReopen).toContain('data-fresh="false"');
    expect(cachedReopen).not.toContain('animation-delay');

    const freshButReducedMotion = renderToStaticMarkup(
      <ResultSurface rows={rows} childLabel="x" isFresh reducedMotion onSwapRow={vi.fn()} onStartDressing={vi.fn()} startDressingDisabled={false} onWhy={vi.fn()} />,
    );
    expect(freshButReducedMotion).toContain('data-fresh="false"');
    expect(freshButReducedMotion).not.toContain('animation-delay');
  });

  it('disables "Kle på, steg for steg" when startDressingDisabled is true', () => {
    const html = renderToStaticMarkup(
      <ResultSurface
        rows={[row({})]}
        childLabel="x"
        isFresh={false}
        reducedMotion={false}
        onSwapRow={vi.fn()}
        onStartDressing={vi.fn()}
        startDressingDisabled
        onWhy={vi.fn()}
      />,
    );
    expect(html).toMatch(/class="hjm-cta" disabled=""/);
  });
});
