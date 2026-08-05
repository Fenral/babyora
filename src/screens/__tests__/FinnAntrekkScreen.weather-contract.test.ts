/**
 * Sol-review P0-2 (2026-08-05): Hjem og Juster (FinnAntrekk) skal bruke SAMME
 * værkontrakt — føles-som avledes alltid av temp+vind via met-no/feels-like,
 * aldri rå lufttemperatur. Før fiksen kunne samme vær gi ulikt temperaturbånd
 * på de to flatene (Hjem: beregnet wind chill, Juster: feelsLikeC = tempC).
 *
 * Testen har to lag:
 *  1. Kildekontrakt — regresjonen (`feelsLikeC: tempC`) kan ikke komme tilbake.
 *  2. Ikke-vakuøsitet — beviser at kontrakten faktisk skiller bånd: for et
 *     reelt vintervær (−5 °C, 8 m/s) gir rå temp og beregnet føles-som ULIKE
 *     temperaturbånd, så en fremtidig «forenkling» tilbake til rå temp ville
 *     endre anbefalingen og fanges her.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { feelsLikeC } from '../../lib/met-no/feels-like';
import { bandForTemp } from '../../lib/wool-layers/tables';

const SOURCE = readFileSync(
  fileURLToPath(new URL('../FinnAntrekkScreen.tsx', import.meta.url)),
  'utf8',
);

describe('FinnAntrekk — normalisert værkontrakt (P0-2)', () => {
  it('sender aldri rå tempC som feelsLikeC til motoren', () => {
    expect(SOURCE).not.toMatch(/feelsLikeC:\s*tempC\b/);
    expect(SOURCE).not.toMatch(/feelsLikeC:\s*committed\.tempC\b/);
  });

  it('avleder føles-som med samme formel som Hjem (met-no/feels-like)', () => {
    expect(SOURCE).toContain("from '../lib/met-no/feels-like'");
    const applications = SOURCE.match(/feelsLikeC:\s*computeFeelsLikeC\(/g) ?? [];
    expect(applications.length).toBe(2); // live + committed
  });

  it('ikke-vakuøst: kontrakten skiller faktisk temperaturbånd i reelt vintervær', () => {
    const tempC = -5;
    const windMs = 8;
    const derived = feelsLikeC(tempC, windMs);
    expect(derived).toBeLessThan(tempC); // wind chill virker
    expect(bandForTemp(derived)).not.toBe(bandForTemp(tempC)); // ulikt bånd → fiksen bærer last
  });
});
