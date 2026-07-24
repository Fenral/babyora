import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { resolveHomeAtmosphereCalls } = vi.hoisted(() => ({
  resolveHomeAtmosphereCalls: vi.fn(),
}));

vi.mock('../../lib/home-atmosphere.js', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../lib/home-atmosphere.js')>();

  return {
    ...actual,
    resolveHomeAtmosphere: (
      ...args: Parameters<typeof actual.resolveHomeAtmosphere>
    ) => {
      resolveHomeAtmosphereCalls(...args);
      return actual.resolveHomeAtmosphere(...args);
    },
  };
});

import { LivingHomeAtmosphere } from '../LivingHomeAtmosphere.js';

const atmosphereCss = readFileSync(
  new URL('../LivingHomeAtmosphere.css', import.meta.url),
  'utf8',
);

type AtmosphereCase = Readonly<{
  label: string;
  input: Readonly<{
    tempC?: number | null;
    feelsLikeC?: number | null;
    symbolCode?: string | null;
  }>;
  expected: Readonly<{
    palette: 'cold' | 'mild' | 'warm';
    lighting: 'day' | 'night' | 'polar-twilight' | 'neutral';
    condition: 'rain' | 'snow' | 'cloud' | 'sun' | 'fog' | 'storm' | 'unknown';
    intensity: 'quiet' | 'present' | 'deep';
  }>;
}>;

const ATMOSPHERE_CASES: readonly AtmosphereCase[] = [
  {
    label: 'cold rain in explicit daylight',
    input: { tempC: 4, feelsLikeC: -7, symbolCode: 'rainshowers_day' },
    expected: {
      palette: 'cold',
      lighting: 'day',
      condition: 'rain',
      intensity: 'present',
    },
  },
  {
    label: 'mild snow at explicit night',
    input: { tempC: 10, feelsLikeC: 10, symbolCode: 'snowshowers_night' },
    expected: {
      palette: 'mild',
      lighting: 'night',
      condition: 'snow',
      intensity: 'quiet',
    },
  },
  {
    label: 'warm sun in explicit polar twilight',
    input: {
      tempC: 25,
      feelsLikeC: 22,
      symbolCode: 'clearsky_polartwilight',
    },
    expected: {
      palette: 'warm',
      lighting: 'polar-twilight',
      condition: 'sun',
      intensity: 'deep',
    },
  },
  {
    label: 'mild cloud in explicit daylight',
    input: { tempC: 12, feelsLikeC: 12, symbolCode: 'partlycloudy_day' },
    expected: {
      palette: 'mild',
      lighting: 'day',
      condition: 'cloud',
      intensity: 'quiet',
    },
  },
  {
    label: 'neutral-lit fog',
    input: { tempC: 8, feelsLikeC: 8, symbolCode: 'fog' },
    expected: {
      palette: 'mild',
      lighting: 'neutral',
      condition: 'fog',
      intensity: 'quiet',
    },
  },
  {
    label: 'cold storm at explicit night',
    input: {
      tempC: -14,
      feelsLikeC: -18,
      symbolCode: 'heavyrainshowersandthunder_night',
    },
    expected: {
      palette: 'cold',
      lighting: 'night',
      condition: 'storm',
      intensity: 'deep',
    },
  },
  {
    label: 'neutral malformed input',
    input: {
      tempC: Number.NaN,
      feelsLikeC: Number.POSITIVE_INFINITY,
      symbolCode: 'provider_future_symbol_day',
    },
    expected: {
      palette: 'mild',
      lighting: 'neutral',
      condition: 'unknown',
      intensity: 'quiet',
    },
  },
];

describe('LivingHomeAtmosphere', () => {
  beforeEach(() => {
    resolveHomeAtmosphereCalls.mockClear();
  });

  it('resolves exactly one caller-owned snapshot and forwards its settled model', () => {
    const input = {
      tempC: -9,
      feelsLikeC: -13,
      symbolCode: 'snowshowers_night',
    } as const;

    const markup = renderToStaticMarkup(
      <LivingHomeAtmosphere {...input} />,
    );

    expect(resolveHomeAtmosphereCalls).toHaveBeenCalledTimes(1);
    expect(resolveHomeAtmosphereCalls).toHaveBeenCalledWith(input);
    expect(markup).toContain('data-home-atmosphere="decorative"');
    expect(markup).toContain('data-palette="cold"');
    expect(markup).toContain('data-condition="snow"');
    expect(markup).toContain('data-lighting="night"');
    expect(markup).toContain('data-intensity="present"');
  });

  it.each(ATMOSPHERE_CASES)(
    'renders deterministic attributes for $label',
    ({ input, expected }) => {
      const first = renderToStaticMarkup(
        <LivingHomeAtmosphere {...input} />,
      );
      const second = renderToStaticMarkup(
        <LivingHomeAtmosphere {...input} />,
      );

      expect(second).toBe(first);
      expect(first).toContain(`data-palette="${expected.palette}"`);
      expect(first).toContain(`data-lighting="${expected.lighting}"`);
      expect(first).toContain(`data-condition="${expected.condition}"`);
      expect(first).toContain(`data-intensity="${expected.intensity}"`);
    },
  );

  it('keeps the complete subtree decorative, non-focusable and content-free', () => {
    const attemptedContent = {
      tempC: 12,
      feelsLikeC: 12,
      symbolCode: 'clearsky_day',
      children: <button type="button">Se dagens antrekk</button>,
    };
    const markup = renderToStaticMarkup(
      <LivingHomeAtmosphere {...attemptedContent} />,
    );

    expect(markup).toContain('aria-hidden="true"');
    expect(markup).not.toMatch(
      /<(?:a|button|input|select|textarea|nav|main|section|h[1-6])\b/iu,
    );
    expect(markup).not.toMatch(
      /\b(?:tabindex|role|aria-label|aria-live|aria-controls)=/iu,
    );
    expect(markup).not.toContain('Se dagens antrekk');
    expect(atmosphereCss).toMatch(
      /\.ba-living-home-atmosphere\s*\{[\s\S]*pointer-events:\s*none/iu,
    );
  });

  it('fills its containing scene without introducing fixed viewport geometry', () => {
    expect(atmosphereCss).toMatch(
      /\.ba-living-home-atmosphere\s*\{[\s\S]*position:\s*absolute[\s\S]*inset:\s*0/iu,
    );
    expect(atmosphereCss).toMatch(/inline-size:\s*100%/iu);
    expect(atmosphereCss).toMatch(/block-size:\s*100%/iu);
    expect(atmosphereCss).not.toMatch(/\b(?:100vw|100vh|100dvh)\b/iu);
    expect(atmosphereCss).not.toMatch(
      /transition:[^;]*(?:width|height|inset|top|right|bottom|left)/iu,
    );
  });

  it('uses one restrained token-driven temperature transition', () => {
    expect(atmosphereCss).toMatch(
      /--living-home-temperature-tone:\s*var\(--layer-bg-mild/iu,
    );
    expect(atmosphereCss).toMatch(
      /\[data-palette='cold'\][\s\S]*var\(--layer-bg-kald/iu,
    );
    expect(atmosphereCss).toMatch(
      /\[data-palette='warm'\][\s\S]*var\(--layer-bg-varm/iu,
    );
    expect(atmosphereCss).toMatch(
      /transition:\s*background-color\s+180ms\s+var\(--ease-out\)/iu,
    );
    expect(atmosphereCss).not.toMatch(/@keyframes|\banimation\s*:/iu);
    expect(atmosphereCss).not.toMatch(/\binfinite\b|\burl\s*\(/iu);
  });

  it('renders the settled static state for prop and OS reduced motion', () => {
    const markup = renderToStaticMarkup(
      <LivingHomeAtmosphere
        tempC={22}
        feelsLikeC={21}
        symbolCode="clearsky_day"
        reducedMotion
      />,
    );

    expect(markup).toContain('data-motion="reduced"');
    expect(atmosphereCss).toMatch(
      /\.ba-living-home-atmosphere\[data-motion='reduced'\]::after\s*\{[\s\S]*transition:\s*none/iu,
    );
    expect(atmosphereCss).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*transition:\s*none/iu,
    );
  });

  it('uses a static system-color surface in forced-colors mode', () => {
    expect(atmosphereCss).toMatch(
      /@media\s*\(forced-colors:\s*active\)[\s\S]*\.ba-living-home-atmosphere\s*\{[\s\S]*background:\s*Canvas/iu,
    );
    expect(atmosphereCss).toMatch(
      /@media\s*\(forced-colors:\s*active\)[\s\S]*\.ba-living-home-atmosphere::after\s*\{[\s\S]*display:\s*none/iu,
    );
  });
});
