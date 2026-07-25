import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LivingHomeBackground } from '../LivingHomeBackground.js';
import { resolveHomeAtmosphere } from '../../lib/home-atmosphere.js';

const backgroundCss = readFileSync(
  new URL('../LivingHomeBackground.css', import.meta.url),
  'utf8',
);

function layerCount(markup: string): number {
  return markup.match(/data-home-atmosphere-layer=/gu)?.length ?? 0;
}

function millisecondsFor(property: 'animation-duration' | 'animation-delay'): number[] {
  return [...backgroundCss.matchAll(new RegExp(`${property}:\\s*(\\d+)ms`, 'gu'))].map(
    (match) => Number(match[1]),
  );
}

describe('LivingHomeBackground', () => {
  it('renders two or three decorative layers from the resolved model', () => {
    const neutral = renderToStaticMarkup(
      <LivingHomeBackground
        atmosphere={resolveHomeAtmosphere({
          tempC: 10,
          feelsLikeC: 10,
          symbolCode: 'provider_future_symbol',
        })}
      />,
    );
    const night = renderToStaticMarkup(
      <LivingHomeBackground
        atmosphere={resolveHomeAtmosphere({
          tempC: -8,
          feelsLikeC: -13,
          symbolCode: 'snowshowers_night',
        })}
      />,
    );

    expect(layerCount(neutral)).toBe(2);
    expect(layerCount(night)).toBe(3);
    expect(night).toContain('aria-hidden="true"');
    expect(night).toContain('data-palette="cold"');
    expect(night).toContain('data-condition="snow"');
    expect(night).toContain('data-lighting="night"');
    expect(night).not.toMatch(/aria-label|alt=|tabindex|role="img"/u);
  });

  it('uses a prop-driven static state for reduced motion', () => {
    const markup = renderToStaticMarkup(
      <LivingHomeBackground
        atmosphere={resolveHomeAtmosphere({
          tempC: 8,
          feelsLikeC: 8,
          symbolCode: 'rainshowers_day',
        })}
        reducedMotion
      />,
    );

    expect(markup).toContain('data-motion="reduced"');
    expect(backgroundCss).toMatch(
      /\.ba-living-home-background\[data-motion='reduced'\][\s\S]*animation:\s*none/iu,
    );
    expect(backgroundCss).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*animation:\s*none/iu,
    );
  });

  it('allows only finite entrance motion and no perpetual decorative loop', () => {
    const durations = millisecondsFor('animation-duration');
    const delays = [0, ...millisecondsFor('animation-delay')];
    const effectiveMaximumMs = Math.max(...durations) + Math.max(...delays);

    expect(backgroundCss).not.toMatch(/\binfinite\b/iu);
    expect(backgroundCss).toMatch(/animation-iteration-count:\s*1\b/iu);
    expect(backgroundCss).not.toMatch(/\bsetInterval\b|\bsetTimeout\b/iu);
    expect(durations.length).toBeGreaterThan(0);
    expect(effectiveMaximumMs).toBeLessThanOrEqual(250);
  });

  it('retains a token-driven gradient fallback for unknown or malformed decoration', () => {
    const unknown = renderToStaticMarkup(
      <LivingHomeBackground atmosphere={resolveHomeAtmosphere(undefined)} />,
    );
    const malformed = renderToStaticMarkup(
      <LivingHomeBackground atmosphere={undefined as never} />,
    );

    expect(unknown).toContain('data-condition="unknown"');
    expect(malformed).toContain('data-condition="unknown"');
    expect(layerCount(malformed)).toBe(2);
    expect(backgroundCss).toMatch(/background(?:-image)?:[\s\S]*var\(--bg-canvas/iu);
    expect(backgroundCss).not.toMatch(/\burl\s*\(/iu);
    expect(unknown).not.toMatch(/<canvas|<img|<video/iu);
  });

  it('is pointer-inert and server-renderable without browser globals', () => {
    expect(() =>
      renderToStaticMarkup(
        <LivingHomeBackground
          atmosphere={resolveHomeAtmosphere({
            tempC: 22,
            feelsLikeC: 21,
            symbolCode: 'clearsky_polartwilight',
          })}
        />,
      ),
    ).not.toThrow();

    expect(backgroundCss).toMatch(/pointer-events:\s*none/iu);
    expect(backgroundCss).not.toMatch(/\bwindow\b|\bdocument\b|\bnavigator\b/iu);
  });
});
