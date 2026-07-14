/**
 * Motor 2.0 Task 4 — ThermalIntent uten plaggtekst.
 *
 * Terskler gjenbrukes EKSAKT fra legacy (bandForTemp, modifiers.ts:
 * regn ≥ 0,5 mm/t; vindskall ved ≥ 5 m/s + feels < 16; hansker < 10;
 * vognpose < 5; sol ved klarværssymbol + ≥ 10 eller UV ≥ 6) — ingen
 * terskeldrift uten separat faglig beslutning (validerings-spec §6).
 *
 * FORVENTET RED: modulen finnes ikke.
 */
import { describe, expect, it } from 'vitest';
import { calculateThermalIntent } from '../thermal-intent.js';
import { bandForTemp } from '../../wool-layers/tables.js';
import { validateRecommendInputV2 } from '../validation.js';
import type { RecommendInputV2 } from '../types.js';

type FixtureOverrides = Omit<Partial<RecommendInputV2>, 'weather'> & {
  weather?: Partial<RecommendInputV2['weather']>;
};

function intent(partial?: FixtureOverrides) {
  const { weather, ...rest } = partial ?? {};
  const input: RecommendInputV2 = {
    weather: { tempC: 8, feelsLikeC: 7, windMs: 2, precipMmH: 0, ...weather },
    ageMonths: 18,
    situation: 'stroller_awake',
    ...rest,
  };
  return calculateThermalIntent(validateRecommendInputV2(input));
}

describe('Motor 2.0 ThermalIntent — relasjoner', () => {
  it('aktiv lek trenger aldri mer isolasjon enn rolig ute (invariant 1)', () => {
    const active = intent({ situation: 'active_play' });
    const calm = intent({ situation: 'calm_outdoors' });
    expect(active.insulationWarmth).toBeLessThanOrEqual(calm.insulationWarmth);
    expect(active.explanationCodes).toContain('ACTIVE_CHILD_LESS_INSULATION');
    expect(calm.explanationCodes).toContain('RESTING_CHILD_MORE_INSULATION');
  });

  it('regn gir vanntett-skall-behov uten å endre noe materielt', () => {
    const wet = intent({ weather: { precipMmH: 2 } });
    expect(wet.needsWaterproofShell).toBe(true);
    expect(wet.explanationCodes).toContain('RAIN_REQUIRES_SHELL');
    expect(JSON.stringify(wet)).not.toMatch(/wool|fleece|cotton|down|shell"|synthetic/);
  });

  it('økende nedbør fjerner aldri vannbeskyttelse (invariant 2)', () => {
    let prev = false;
    for (const mm of [0, 0.4, 0.5, 1, 2, 6]) {
      const now = intent({ weather: { precipMmH: mm } }).needsWaterproofShell;
      expect(prev && !now, `regresjon ved ${mm} mm/t`).toBe(false);
      prev = now;
    }
    expect(intent({ weather: { precipMmH: 0.4 } }).needsWaterproofShell).toBe(false);
    expect(intent({ weather: { precipMmH: 0.5 } }).needsWaterproofShell).toBe(true);
  });

  it('vindskall følger legacy-terskelen (≥ 5 m/s og feels < 16)', () => {
    expect(intent({ weather: { windMs: 5, feelsLikeC: 15 } }).needsWindShell).toBe(true);
    expect(intent({ weather: { windMs: 4.9, feelsLikeC: 15 } }).needsWindShell).toBe(false);
    expect(intent({ weather: { windMs: 5, feelsLikeC: 16 } }).needsWindShell).toBe(false);
    expect(intent({ weather: { windMs: 5, feelsLikeC: 15 } }).explanationCodes).toContain('WIND_REQUIRES_SHELL');
  });

  it('økende vind fjerner aldri vindbeskyttelse (invariant 3)', () => {
    let prev = false;
    for (const w of [0, 4, 5, 8, 12]) {
      const now = intent({ weather: { windMs: w, feelsLikeC: 10 } }).needsWindShell;
      expect(prev && !now, `regresjon ved ${w} m/s`).toBe(false);
      prev = now;
    }
  });

  it('temperaturbåndet er identisk med legacy bandForTemp (ingen drift)', () => {
    for (const feels of [-15.01, -15, -7.01, -7, -0.01, 0, 4.99, 5, 9.99, 10, 15.99, 16, 21.99, 22, 27.99, 28]) {
      expect(intent({ weather: { feelsLikeC: feels } }).tempBand).toBe(bandForTemp(feels));
    }
  });

  it('varme klemmes til 0–4 i begge ender', () => {
    const coldRest = intent({ weather: { feelsLikeC: -20 }, situation: 'stroller_awake' });
    expect(coldRest.insulationWarmth).toBe(4);
    const hotActive = intent({ weather: { feelsLikeC: 30 }, situation: 'active_play' });
    expect(hotActive.insulationWarmth).toBe(0);
  });

  it('kaldere bånd gir aldri lavere basevarme (monotoni)', () => {
    let prev = -1;
    for (const feels of [30, 24, 18, 12, 7, 2, -4, -10, -20]) {
      const b = intent({ weather: { feelsLikeC: feels } }).baseWarmth;
      expect(b, `feels ${feels}`).toBeGreaterThanOrEqual(prev);
      prev = b;
    }
  });

  it('sol: klarværssymbol + ≥ 10 °C eller UV ≥ 6 gir solbeskyttelse', () => {
    expect(intent({ weather: { symbolCode: 'clearsky_day', feelsLikeC: 12 } }).needsSunProtection).toBe(true);
    expect(intent({ weather: { symbolCode: 'clearsky_day', feelsLikeC: 9 } }).needsSunProtection).toBe(false);
    expect(intent({ weather: { symbolCode: 'cloudy', feelsLikeC: 12 } }).needsSunProtection).toBe(false);
    expect(intent({ weather: { symbolCode: 'cloudy', uvIndex: 6, feelsLikeC: 12 } }).needsSunProtection).toBe(true);
  });

  it('hansker < 10 °C, hode ute alltid, føtter ute alltid', () => {
    expect(intent({ weather: { feelsLikeC: 9.9 } }).needsHandwear).toBe(true);
    expect(intent({ weather: { feelsLikeC: 10 } }).needsHandwear).toBe(false);
    expect(intent({ weather: { feelsLikeC: 25 } }).needsHeadwear).toBe(true);
    expect(intent({ weather: { feelsLikeC: 25 } }).needsFootwear).toBe(true);
  });
});

describe('Motor 2.0 ThermalIntent — utstyr og situasjoner', () => {
  it('vogn i regn gir regntrekk-behov; aktiv lek gjør det ikke', () => {
    expect(intent({ situation: 'stroller_awake', weather: { precipMmH: 1.5 } }).equipment)
      .toContain('stroller_rain_cover');
    expect(intent({ situation: 'active_play', weather: { precipMmH: 1.5 } }).equipment)
      .not.toContain('stroller_rain_cover');
  });

  it('vogn under 5 °C gir vognpose-behov (legacy-terskel)', () => {
    expect(intent({ weather: { feelsLikeC: 4.9 } }).equipment).toContain('stroller_warm_pouch');
    expect(intent({ weather: { feelsLikeC: 5 } }).equipment).not.toContain('stroller_warm_pouch');
  });

  it('bilstol-kontekst gir kjørepose-behov', () => {
    expect(intent({ carSeat: true }).equipment).toContain('car_seat_pouch');
    expect(intent().equipment).not.toContain('car_seat_pouch');
  });

  it('bæresele innenfor jakka reduserer isolasjon og skall-behov (G04 vs G05)', () => {
    const under = intent({ situation: 'carrier', carrierUnderParentJacket: true, weather: { feelsLikeC: 2, windMs: 6 } });
    const outside = intent({ situation: 'carrier', weather: { feelsLikeC: 2, windMs: 6 } });
    expect(under.insulationWarmth).toBeLessThan(outside.insulationWarmth);
    expect(outside.needsWindShell).toBe(true);
    expect(under.needsWindShell).toBe(false);
  });

  it('søvn inne har ingen ute-behov', () => {
    const sleep = intent({ situation: 'indoor_sleep', weather: { feelsLikeC: 19, precipMmH: 3, windMs: 9 } });
    expect(sleep.needsWaterproofShell).toBe(false);
    expect(sleep.needsWindShell).toBe(false);
    expect(sleep.needsSunProtection).toBe(false);
    expect(sleep.equipment).toEqual([]);
  });
});

describe('Motor 2.0 ThermalIntent — renhet', () => {
  it('inneholder aldri norsk plaggtekst (invariant 8)', () => {
    for (const t of [
      intent({ weather: { feelsLikeC: -18 } }),
      intent({ weather: { feelsLikeC: 24, symbolCode: 'clearsky_day' } }),
      intent({ situation: 'active_play', weather: { precipMmH: 2 } }),
    ]) {
      expect(JSON.stringify(t)).not.toMatch(/ullsett|kjøredress|lue|votter|body|dress|sokker|halsedisse|varmepose/i);
    }
  });

  it('er deterministisk (G36): samme input gir identisk intent', () => {
    const a = intent({ weather: { feelsLikeC: -3, windMs: 6, precipMmH: 0.7 } });
    const b = intent({ weather: { feelsLikeC: -3, windMs: 6, precipMmH: 0.7 } });
    expect(a).toEqual(b);
  });

  it('bærer aldersstadium, situasjon og intensitet videre', () => {
    const t = intent({ ageMonths: 3, situation: 'awake_low_mobility' });
    expect(t.ageStage).toBe('newborn');
    expect(t.situation).toBe('awake_low_mobility');
    expect(t.intensity).toBe('resting');
  });
});
