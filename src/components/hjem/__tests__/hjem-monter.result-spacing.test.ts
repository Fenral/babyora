import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const CSS = readFileSync(
  resolve(__dirname, '../hjem-monter.css'),
  'utf8',
).replace(/\r\n/gu, '\n');

const HOME_SOURCE = readFileSync(
  resolve(__dirname, '../HjemMonter.tsx'),
  'utf8',
).replace(/\r\n/gu, '\n');

function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return CSS.match(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`, 'u'))?.[1] ?? '';
}

describe('HjemMonter resultatrytme', () => {
  it('reserverer ikke et helt instrumentpanel når maskoten er borte', () => {
    expect(rule(".hjm-panel-slot[data-with-mascot='false']")).toContain('min-height: 0');
  });

  it('beholder ro uten at vær og antrekk blir to adskilte områder', () => {
    expect(rule('.hjm-result-seam > .hjm-body'))
      .toContain('padding-top: var(--dw-space-4)');
  });

  it('places weather, the static mascot and the result in one shared seam', () => {
    const seamStart = HOME_SOURCE.indexOf('className="hjm-result-seam"');
    const weatherStart = HOME_SOURCE.indexOf('<WeatherStrip', seamStart);
    const resultStart = HOME_SOURCE.indexOf('<ResultSurface', seamStart);

    expect(seamStart).toBeGreaterThan(-1);
    expect(weatherStart).toBeGreaterThan(seamStart);
    expect(resultStart).toBeGreaterThan(weatherStart);
    expect(rule('.hjm-result-seam')).toContain('position: relative');
    expect(rule('.hjm-result-mascot-seam')).toContain('position: absolute');
  });
});
