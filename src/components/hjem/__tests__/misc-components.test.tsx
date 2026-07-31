import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MascotPeek } from '../MascotPeek.js';
import { WeatherStrip } from '../WeatherStrip.js';

describe('MascotPeek', () => {
  it('is purely decorative: aria-hidden, no pointer-events, empty alt', () => {
    const html = renderToStaticMarkup(<MascotPeek />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('alt=""');
    expect(html).toContain('/monter/maskot.png');
    expect(html).toContain('data-compact="false"');
  });

  it('switches to the compact variant for content-heavy states (stale/offline)', () => {
    const html = renderToStaticMarkup(<MascotPeek compact />);
    expect(html).toContain('data-compact="true"');
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
