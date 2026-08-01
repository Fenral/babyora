import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MascotPeek } from '../MascotPeek.js';
import { WeatherStrip } from '../WeatherStrip.js';

describe('MascotPeek', () => {
  it('is purely decorative: aria-hidden, no pointer-events, empty alt — renders BOTH poses (normal + curious), crossfaded via CSS', () => {
    const html = renderToStaticMarkup(<MascotPeek />);
    expect(html.match(/aria-hidden="true"/gu)?.length).toBe(2);
    expect(html.match(/alt=""/gu)?.length).toBe(2);
    expect(html).toContain('/monter/maskot.png');
    expect(html).toContain('/monter/maskot-nysgjerrig.png');
    expect(html.match(/data-compact="false"/gu)?.length).toBe(2);
  });

  it('switches to the compact variant for content-heavy states (stale/offline)', () => {
    const html = renderToStaticMarkup(<MascotPeek compact />);
    expect(html.match(/data-compact="true"/gu)?.length).toBe(2);
  });

  it('defaults to pose="normal" when omitted', () => {
    const html = renderToStaticMarkup(<MascotPeek />);
    expect(html.match(/data-pose="normal"/gu)?.length).toBe(2);
    expect(html).not.toContain('data-pose="curious"');
  });

  it('Del 3: pose="curious" stamps data-pose="curious" on BOTH images (CSS decides which is visible via the class + attribute pair)', () => {
    const html = renderToStaticMarkup(<MascotPeek compact pose="curious" />);
    expect(html.match(/data-pose="curious"/gu)?.length).toBe(2);
    expect(html).toContain('class="hjm-mascot hjm-mascot-normal"');
    expect(html).toContain('class="hjm-mascot hjm-mascot-curious"');
  });

  it('reducedMotion stamps data-animate="false" on both images (instant pose-swap, no crossfade transition)', () => {
    const html = renderToStaticMarkup(<MascotPeek pose="curious" reducedMotion />);
    expect(html.match(/data-animate="false"/gu)?.length).toBe(2);
  });

  it('defaults to data-animate="true" when reducedMotion is omitted', () => {
    const html = renderToStaticMarkup(<MascotPeek />);
    expect(html.match(/data-animate="true"/gu)?.length).toBe(2);
  });
});

describe('WeatherStrip', () => {
  it('renders the exact mock copy and structure: temp, feels+condition, place+activity, Juster', () => {
    const html = renderToStaticMarkup(
      <WeatherStrip
        nuance="rain"
        tempC={4}
        feelsLikeC={1}
        conditionLabel="Lett yr"
        cityLabel="Trondheim"
        activityToggleLabel="Utenfor vogn"
        onAdjust={vi.fn()}
      />,
    );
    expect(html).toContain('aria-label="Juster vær, sted eller aktivitet"');
    expect(html).toContain('4°');
    expect(html).toContain('Føles som 1° · Lett yr');
    expect(html).toContain('Trondheim · Utenfor vogn');
    expect(html).toContain('Juster');
    expect(html).toContain('data-nuance="rain"');
  });

  it('the whole strip is a single tappable button (the Juster affordance IS the strip)', () => {
    const html = renderToStaticMarkup(
      <WeatherStrip nuance="snow" tempC={-2} feelsLikeC={-5} conditionLabel="Snø" cityLabel="Oslo" activityToggleLabel="I vogn" onAdjust={vi.fn()} />,
    );
    expect((html.match(/<button/g) ?? []).length).toBe(1);
    expect(html).toContain('−2°');
    expect(html).toContain('data-nuance="snow"');
  });
});
