import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MascotPeek } from '../MascotPeek.js';
import { WeatherStrip } from '../WeatherStrip.js';

describe('MascotPeek', () => {
  it('is purely decorative: aria-hidden, no pointer-events, empty alt — renders BOTH poses (normal + curious), crossfaded via CSS', () => {
    const html = renderToStaticMarkup(<MascotPeek />);
    // Tre lag na: ankeret barer aria-hidden for HELE maskoten, og de to
    // bildene beholder sin egen — dekorativ i alle ledd.
    expect(html.match(/aria-hidden="true"/gu)?.length).toBe(3);
    expect(html.match(/alt=""/gu)?.length).toBe(2);
    expect(html).toContain('/monter/maskot.webp');
    expect(html).toContain('/monter/maskot-nysgjerrig.webp');
    // anker + pose-lag (bildene trenger den ikke lenger — geometrien bor pa
    // ankeret, bevegelsen pa pose-laget)
    expect(html.match(/data-compact="false"/gu)?.length).toBe(2);
  });

  it('switches to the compact variant for content-heavy states (stale/offline)', () => {
    const html = renderToStaticMarkup(<MascotPeek compact />);
    expect(html.match(/data-compact="true"/gu)?.length).toBe(2);
  });

  it('defaults to pose="normal" when omitted', () => {
    const html = renderToStaticMarkup(<MascotPeek />);
    // pose-laget (bevegelsen) + de to bildene (krysstoningen)
    expect(html.match(/data-pose="normal"/gu)?.length).toBe(3);
    expect(html).not.toContain('data-pose="curious"');
  });

  it('Del 3: pose="curious" stamps data-pose="curious" on BOTH images (CSS decides which is visible via the class + attribute pair)', () => {
    const html = renderToStaticMarkup(<MascotPeek compact pose="curious" />);
    expect(html.match(/data-pose="curious"/gu)?.length).toBe(3);
    expect(html).toContain('class="hjm-mascot hjm-mascot-normal"');
    expect(html).toContain('class="hjm-mascot hjm-mascot-curious"');
  });

  it('reducedMotion stamps data-animate="false" on both images (instant pose-swap, no crossfade transition)', () => {
    const html = renderToStaticMarkup(<MascotPeek pose="curious" reducedMotion />);
    // pose-laget ma ogsa fa den: det er DER transformen bor, og reduced
    // motion skal droppe bevegelsen — ikke bare krysstoningen.
    expect(html.match(/data-animate="false"/gu)?.length).toBe(3);
  });

  it('defaults to data-animate="true" when reducedMotion is omitted', () => {
    const html = renderToStaticMarkup(<MascotPeek />);
    expect(html.match(/data-animate="true"/gu)?.length).toBe(3);
  });
});

describe('WeatherStrip', () => {
  it('renders temp, weather facts and the actual weather icon without visible Adjust copy', () => {
    const html = renderToStaticMarkup(
      <WeatherStrip
        nuance="rain"
        tempC={4}
        feelsLikeC={1}
        conditionLabel="Lett yr"
        cityLabel="Trondheim"
        activityToggleLabel="Utenfor vogn"
        weatherIconSrc="/monter/vaer-regn.webp"
        weatherIconAlt="Lett yr"
        language="no"
        onAdjust={vi.fn()}
      />,
    );
    expect(html).toContain('aria-label="Juster vær, sted eller aktivitet"');
    expect(html).toContain('4°');
    expect(html).toContain('Føles som 1° · Lett yr');
    expect(html).toContain('Trondheim · Utenfor vogn');
    expect(html).toContain('class="hjm-s-weather"');
    expect(html).toContain('src="/monter/vaer-regn.webp"');
    expect(html).toContain('alt="Lett yr"');
    expect(html).not.toContain('class="hjm-s-adjust"');
    expect(html).toContain('data-nuance="rain"');
  });

  it('keeps the whole strip as the one accessible Adjust button', () => {
    const html = renderToStaticMarkup(
      <WeatherStrip
        nuance="snow"
        tempC={-2}
        feelsLikeC={-5}
        conditionLabel="Snø"
        cityLabel="Oslo"
        activityToggleLabel="I vogn"
        weatherIconSrc="/monter/vaer-sno.webp"
        weatherIconAlt="Snø"
        language="no"
        onAdjust={vi.fn()}
      />,
    );
    expect((html.match(/<button/g) ?? []).length).toBe(1);
    expect(html).toContain('aria-label="Juster vær, sted eller aktivitet"');
    expect(html).toContain('−2°');
    expect(html).toContain('data-nuance="snow"');
  });

  it('localizes all of its own visible and accessible copy', () => {
    const html = renderToStaticMarkup(
      <WeatherStrip
        nuance="cloudy"
        tempC={7}
        feelsLikeC={5}
        conditionLabel="Cloudy"
        cityLabel="Oslo"
        activityToggleLabel="Outdoors"
        weatherIconSrc="/monter/vaer-skyet.webp"
        weatherIconAlt="Cloudy"
        language="en-GB"
        onAdjust={vi.fn()}
      />,
    );
    expect(html).toContain('aria-label="Adjust weather, location or activity"');
    expect(html).toContain('Feels like 5° · Cloudy');
    expect(html).toContain('Oslo · Outdoors');
    expect(html).toContain('src="/monter/vaer-skyet.webp"');
    expect(html).toContain('alt="Cloudy"');
    expect(html).not.toContain('Juster');
    expect(html).not.toContain('Føles som');
  });

  it('preserves the weather slot and one Adjust button when no icon is available', () => {
    const html = renderToStaticMarkup(
      <WeatherStrip
        nuance="cloudy"
        tempC={7}
        feelsLikeC={7}
        conditionLabel="Unknown"
        cityLabel="Oslo"
        activityToggleLabel="Outdoors"
        weatherIconSrc={null}
        weatherIconAlt="Unknown"
        language="en"
        onAdjust={vi.fn()}
      />,
    );
    expect((html.match(/<button/g) ?? [])).toHaveLength(1);
    expect(html).toContain('<span class="hjm-s-weather" aria-hidden="true"></span>');
    expect(html).not.toContain('<img');
  });
});
