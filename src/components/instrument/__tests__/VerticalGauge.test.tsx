/**
 * VerticalGauge.test.tsx — P10.2: material-fill variants, on top of the
 * P10.1 structure/a11y contract (already covered end-to-end for the real
 * FinnAntrekkScreen usage by FinnAntrekkScreen.instrument-panel.test.tsx —
 * this file exercises the component directly, isolated from that screen).
 *
 * Rendered via renderToStaticMarkup — no jsdom in this repo (see
 * FinnAntrekkScreen.instrument-panel.test.tsx's own header), so pointer-
 * drag / WAAPI behaviour itself isn't exercised here (that's covered by
 * the reduced-motion GUARD assertions below, which only need to prove the
 * gate exists and is wired — not simulate an actual drag/animation). The
 * temperature colour interpolation this component calls into is unit
 * tested on its own, DOM-free, in gauge-material.test.ts.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { VerticalGauge, type VerticalGaugeProps } from '../VerticalGauge';
import { temperatureFillColor, temperatureFillDeepColor } from '../gauge-material';

const BASE_PROPS: VerticalGaugeProps = {
  label: 'Temperatur',
  valueLabel: '5°',
  min: -20,
  max: 30,
  step: 1,
  value: 5,
  onChange: () => {},
  ariaLabel: 'Temperatur i celsius',
  ariaValueText: '5 grader, mildt',
  minLabel: '-20°',
  maxLabel: '30°',
  fillBottomColor: 'var(--dw-panel)',
  fillTopColor: 'var(--dw-w-clear)',
  incrementLabel: 'Én grad varmere',
  decrementLabel: 'Én grad kaldere',
};

function render(props: Partial<VerticalGaugeProps> = {}): string {
  return renderToStaticMarkup(<VerticalGauge {...BASE_PROPS} {...props} />);
}

describe('VerticalGauge — geometry/a11y contract is IDENTICAL across every material (P10.1 carried forward)', () => {
  it.each(['thermal', 'air', 'water'] as const)('material=%s keeps the same label/value/track/steps structure', (material) => {
    const html = render({ material });
    expect(html).toContain('class="fa-gauge-label"');
    expect(html).toContain('class="fa-gauge-value"');
    expect(html).toContain('class="fa-gauge-track"');
    expect(html.match(/class="fa-gauge-step"/gu)?.length).toBe(2);
    expect(html).toContain('aria-orientation="vertical"');
    expect(html).toContain('aria-label="Temperatur i celsius"');
  });

  it('omitting `material` falls back to the original flat fillBottomColor/fillTopColor gradient, no modifier class', () => {
    const html = render();
    expect(html).toContain('class="fa-gauge-fill"');
    expect(html).not.toContain('fa-gauge-fill--thermal');
    expect(html).not.toContain('fa-gauge-fill--air');
    expect(html).not.toContain('fa-gauge-fill--water');
    expect(html).toContain('linear-gradient(to top, var(--dw-panel), var(--dw-w-clear))');
  });

  it('the baseline marker still renders alongside a material variant', () => {
    const html = render({ material: 'thermal', baselineValue: -4, baselineLabel: 'Faktisk vær nå: −4°' });
    expect(html).toContain('class="fa-gauge-baseline"');
    expect(html).toContain('Faktisk vær nå: −4°');
  });
});

describe('VerticalGauge — thermal material (Temperatur)', () => {
  it('carries the fa-gauge-fill--thermal class', () => {
    const html = render({ material: 'thermal' });
    expect(html).toContain('fa-gauge-fill--thermal');
  });

  it('ignores fillBottomColor/fillTopColor and computes its gradient from the live value instead', () => {
    const html = render({ material: 'thermal', value: -20 });
    expect(html).not.toContain('var(--dw-panel)');
    expect(html).not.toContain('var(--dw-w-clear)');
    expect(html).toContain(temperatureFillColor(-20));
    expect(html).toContain(temperatureFillDeepColor(-20));
  });

  it('a warm value never renders the CTA amber hex (#D98E5A) — data colour stays visually distinct from action colour', () => {
    const html = render({ material: 'thermal', value: 30 });
    expect(html.toUpperCase()).not.toContain('#D98E5A');
    expect(html).toContain(temperatureFillColor(30));
  });

  it('renders no streaks and no meniscus (those belong to the other two materials)', () => {
    const html = render({ material: 'thermal' });
    expect(html).not.toContain('fa-gauge-streak');
    expect(html).not.toContain('fa-gauge-meniscus');
  });
});

describe('VerticalGauge — air material (Vind)', () => {
  it('carries the fa-gauge-fill--air class and keeps the caller-supplied petrol gradient (no colour override)', () => {
    const html = render({ material: 'air' });
    expect(html).toContain('fa-gauge-fill--air');
    expect(html).toContain('var(--dw-panel)');
    expect(html).toContain('var(--dw-w-clear)');
  });

  it('renders exactly 3 streak lines', () => {
    const html = render({ material: 'air' });
    expect(html.match(/class="fa-gauge-streak fa-gauge-streak--\d"/gu)?.length).toBe(3);
  });

  it('never renders `is-dragging` on first paint (static at rest — no drag has happened)', () => {
    const html = render({ material: 'air' });
    expect(html).not.toContain('is-dragging');
  });

  it('renders no meniscus (that belongs to the water material)', () => {
    const html = render({ material: 'air' });
    expect(html).not.toContain('fa-gauge-meniscus');
  });
});

describe('VerticalGauge — water material (Nedbør)', () => {
  it('carries the fa-gauge-fill--water class and keeps the caller-supplied petrol gradient (no colour override)', () => {
    const html = render({ material: 'water' });
    expect(html).toContain('fa-gauge-fill--water');
    expect(html).toContain('var(--dw-panel)');
    expect(html).toContain('var(--dw-w-clear)');
  });

  it('renders exactly one meniscus SVG cap, coloured with the fill\'s own top colour', () => {
    const html = render({ material: 'water' });
    expect(html.match(/class="fa-gauge-meniscus"/gu)?.length).toBe(1);
    expect(html).toContain('<svg');
    expect(html).toContain('fill:var(--dw-w-clear)');
  });

  it('renders no streaks (those belong to the air material)', () => {
    const html = render({ material: 'water' });
    expect(html).not.toContain('fa-gauge-streak');
  });
});

describe('VerticalGauge — reduced-motion guard (P10.2)', () => {
  it('reducedMotion=true forces an inline transition:none on the fill (app-level override, not just the OS media query)', () => {
    const html = render({ material: 'water', reducedMotion: true });
    expect(html).toContain('transition:none');
  });

  it('reducedMotion=false (default) leaves the height transition to the CSS class instead of an inline override', () => {
    const html = render({ material: 'water', reducedMotion: false });
    expect(html).not.toContain('transition:none');
  });

  it('is honoured for every material, not just water', () => {
    for (const material of ['thermal', 'air', 'water'] as const) {
      expect(render({ material, reducedMotion: true })).toContain('transition:none');
    }
  });
});
