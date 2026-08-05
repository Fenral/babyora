import { describe, expect, it } from 'vitest';
import { assertReadOnlyAction, buildCapturePlan, buildForecastFixture } from './capture';

describe('capture plan', () => {
  it('covers all page families', () => {
    // P1 (nav 4→3 skeleton): 'guide'/'find-outfit'/'clothing-library'/'wardrobe'
    // were removed from PAGE_CATALOG (see config.ts) — the Guide-tab root is
    // gone and those three had no reachable entry point without it.
    // P5: 'find-outfit' is back (WeatherStrip's Juster button on Hjem's
    // result gives it a CTA again).
    // P6: 'clothing-library' is back too (PlaggDetailSheet's "Se
    // alternativer i biblioteket", opened from Hjem's Bytt row) — 'wardrobe'
    // still doesn't have one, so the count is 11, not the original 12.
    expect(new Set(buildCapturePlan().map((item) => item.pageId)).size).toBe(11);
  });

  it('blocks dangerous actions', () => {
    expect(() => assertReadOnlyAction('confirm-purchase')).toThrow(/read-only/i);
    expect(() => assertReadOnlyAction('delete-child')).toThrow(/read-only/i);
  });

  it('allows capture navigation', () => {
    expect(() => assertReadOnlyAction('tab')).not.toThrow();
    expect(() => assertReadOnlyAction('text')).not.toThrow();
  });

  it('bruker den DELTE værfixturen, og den er gyldig for klienten', () => {
    /* OMSKREVET 2026-08-05. Testen låste tidligere revisjonens EGEN fixtur:
       72 punkter, første på -4 °C. Den fixturen sendte `units: {}`, som
       klienten forkaster — så testen bevoktet formen på noe som ikke virket.
       Nå deles e2e-fixturen. Assertionene måler derfor det som FAKTISK
       avgjør om appen får vær: at kontrakten er oppfylt. */
    const fixture = buildForecastFixture();
    const ts = fixture.properties.timeseries;

    expect(ts.length, "en tom serie ville gitt appen ingen vær").toBeGreaterThan(0);

    /* DET SOM VELTET DEN GAMLE: klienten krever at units matcher
       CONSUMED_UNIT_CONTRACT eksakt. Er dette tomt, forkastes hele svaret,
       CTA-en står disabled, og skjermer blir uoppnåelige — stille. */
    const units = fixture.properties.meta.units;
    for (const felt of [
      'air_temperature', 'precipitation_amount', 'wind_speed',
      'wind_from_direction', 'relative_humidity', 'cloud_area_fraction',
    ]) {
      expect(units, `units.${felt} mangler — klienten forkaster svaret`)
        .toHaveProperty(felt);
    }

    /* Hvert punkt må bære det motoren leser. */
    const forste = ts[0];
    expect(forste?.data.instant.details.air_temperature).toBeTypeOf("number");
    expect(forste?.data.next_1_hours?.summary.symbol_code).toBeTypeOf("string");

    /* Tidsaksen må dekke NÅ. En fixtur forankret til en fast dato driver inn
       i fortiden, og da har appen ingen prognose for øyeblikket den står i.
       Det var nøyaktig den andre halvdelen av funnet 2026-08-05. */
    const forsteTid = new Date(forste.time).getTime();
    const sisteTid = new Date(ts[ts.length - 1].time).getTime();
    const naa = Date.now();
    expect(forsteTid, "serien starter etter nå — appen får ingen prognose")
      .toBeLessThanOrEqual(naa);
    expect(sisteTid, "serien slutter før nå — fixturen har drevet i fortiden")
      .toBeGreaterThan(naa);
  });
});
