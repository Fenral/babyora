/**
 * Motor 2.0 Task 5 — kalibrering flyttes FØR plaggvalg og safety (spec §11).
 * Maks ±1 varmetrinn på ThermalIntent; værbeskyttelse og utstyr røres aldri
 * (G30/G31, invariant 4). FORVENTET RED: modulen finnes ikke.
 */
import { describe, expect, it } from 'vitest';
import { applyThermalCalibration } from '../calibration.js';
import { calculateThermalIntent } from '../thermal-intent.js';
import { validateRecommendInputV2 } from '../validation.js';
import type { ThermalIntent } from '../types.js';

function intent(overrides?: Partial<ThermalIntent>): ThermalIntent {
  const base = calculateThermalIntent(validateRecommendInputV2({
    weather: { tempC: 0, feelsLikeC: -2, windMs: 6, precipMmH: 1, symbolCode: 'rain' },
    ageMonths: 20,
    situation: 'stroller_awake',
  }));
  return { ...base, ...overrides };
}

describe('Motor 2.0 kalibrering', () => {
  it.each([-1, 0, 1] as const)('endrer varme med maks ett trinn for %s', (bias) => {
    const base = intent({ insulationWarmth: 2 });
    const result = applyThermalCalibration(base, bias);
    expect(Math.abs(result.insulationWarmth - base.insulationWarmth)).toBeLessThanOrEqual(1);
    expect(result.insulationWarmth).toBe((2 + bias) as ThermalIntent['insulationWarmth']);
  });

  it('endrer aldri skall-, sol- eller utstyrsbehov (invariant 4)', () => {
    const base = intent();
    expect(base.needsWaterproofShell).toBe(true);
    expect(base.needsWindShell).toBe(true);
    expect(base.equipment).toContain('stroller_rain_cover');
    for (const bias of [-1, 1] as const) {
      const result = applyThermalCalibration(base, bias);
      expect(result.needsWaterproofShell).toBe(base.needsWaterproofShell);
      expect(result.needsWindShell).toBe(base.needsWindShell);
      expect(result.needsSunProtection).toBe(base.needsSunProtection);
      expect(result.needsHeadwear).toBe(base.needsHeadwear);
      expect(result.needsHandwear).toBe(base.needsHandwear);
      expect(result.needsFootwear).toBe(base.needsFootwear);
      expect(result.equipment).toEqual(base.equipment);
    }
  });

  it('klemmer i begge ender (0 og 4)', () => {
    expect(applyThermalCalibration(intent({ insulationWarmth: 0 }), -1).insulationWarmth).toBe(0);
    expect(applyThermalCalibration(intent({ insulationWarmth: 4 }), 1).insulationWarmth).toBe(4);
  });

  it('bias 0 er identitet (ingen ny forklaring, samme objektinnhold)', () => {
    const base = intent();
    expect(applyThermalCalibration(base, 0)).toEqual(base);
  });

  it('legger stabil forklaringskode ved ±1, aldri plaggnavn', () => {
    const warmer = applyThermalCalibration(intent(), 1);
    const cooler = applyThermalCalibration(intent(), -1);
    expect(warmer.explanationCodes).toContain('CALIBRATION_WARMER');
    expect(cooler.explanationCodes).toContain('CALIBRATION_COOLER');
    expect(JSON.stringify(warmer)).not.toMatch(/halsedisse|lue|votter|ullsett/i);
  });

  it('muterer ikke input-intenten (ren funksjon)', () => {
    const base = intent({ insulationWarmth: 2 });
    const snapshot = JSON.parse(JSON.stringify(base));
    applyThermalCalibration(base, 1);
    expect(base).toEqual(snapshot);
  });
});
