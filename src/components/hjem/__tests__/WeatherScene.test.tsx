import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { WeatherScene } from '../WeatherScene.js';

function baseProps() {
  return {
    cityLabel: 'Trondheim',
    nuance: 'rain' as const,
    tempC: 4,
    feelsLikeC: 1,
    noteText: 'Lett yr i lufta, kjølig og fuktig.',
    weatherIconSrc: '/monter/vaer-regn.webp',
    weatherIconAlt: 'Lett regn',
    freshnessLabel: 'Oppdatert nå',
    activity: 'utelek' as const,
    onActivityChange: vi.fn(),
  };
}

describe('WeatherScene', () => {
  it('renders the mock copy and weather nuance data attribute', () => {
    const html = renderToStaticMarkup(<WeatherScene {...baseProps()} />);
    expect(html).toContain('data-nuance="rain"');
    expect(html).toContain('Trondheim');
    expect(html).toContain('Oppdatert nå');
    expect(html).toContain('Lett yr i lufta, kjølig og fuktig.');
    expect(html).toContain('Føles som 1°');
    expect(html).toContain('<sup>°</sup>');
    expect(html).toMatch(/class="hjm-temp"[^>]*>4</);
  });

  it('renders the activity radiogroup with exact mock button labels and aria-checked wiring', () => {
    const html = renderToStaticMarkup(<WeatherScene {...baseProps()} activity="vogn" />);
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('Utenfor vogn');
    expect(html).toContain('I vogn');
    expect(html).toMatch(/aria-checked="true"[^>]*>I vogn/);
  });

  it('uses the unicode minus for negative temperatures, matching legacy formatTemp convention', () => {
    const html = renderToStaticMarkup(<WeatherScene {...baseProps()} tempC={-3} feelsLikeC={-7} />);
    expect(html).toContain('−3');
    expect(html).toContain('Føles som −7°');
  });

  it('shows a dash placeholder and no icon while weather has not loaded (tempC=null)', () => {
    const html = renderToStaticMarkup(
      <WeatherScene {...baseProps()} tempC={null} feelsLikeC={null} weatherIconSrc={null} />,
    );
    expect(html).toContain('–'); // en-dash placeholder
    expect(html).toContain('Henter vær');
    expect(html).not.toContain('<img');
  });

  it('dims the loc pill and marks it non-interactive when locInteractive=false (scanning state)', () => {
    const html = renderToStaticMarkup(<WeatherScene {...baseProps()} locInteractive={false} />);
    expect(html).toContain('data-interactive="false"');
    expect(html).not.toContain('<button type="button" class="hjm-loc"');
  });

  it('renders a real interactive stub button for the location pill by default', () => {
    const html = renderToStaticMarkup(<WeatherScene {...baseProps()} />);
    expect(html).toMatch(/<button[^>]*class="hjm-loc"/);
  });

  it('marks the freshness badge as warning when offline/stale', () => {
    const html = renderToStaticMarkup(
      <WeatherScene {...baseProps()} freshnessLabel="Sist oppdatert 06:40" freshnessWarn dimmed />,
    );
    expect(html).toContain('data-warn="true"');
    expect(html).toContain('Sist oppdatert 06:40');
    expect(html).toContain('data-dim="true"');
  });
});
