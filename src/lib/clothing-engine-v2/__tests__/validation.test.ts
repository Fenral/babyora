/**
 * Motor 2.0 Task 1 — inputvalidering og typede feil.
 * Kontrakter per docs/superpowers/specs/2026-07-13-babyora-engine-2-design.md §6–§9.
 *
 * FORVENTET RED før implementering: modulen finnes ikke.
 */
import { describe, expect, it } from 'vitest';
import { validateRecommendInputV2 } from '../validation.js';
import { ageStageFor } from '../age.js';
import { SITUATION_PROFILES, isSituationValidForStage } from '../situations.js';
import type { AgeStage, RecommendInputV2, Situation } from '../types.js';

function validInput(partial?: Partial<RecommendInputV2>): RecommendInputV2 {
  return {
    weather: { tempC: 4, feelsLikeC: 2, windMs: 3, precipMmH: 0 },
    ageMonths: 8,
    situation: 'stroller_awake',
    ...partial,
  };
}

describe('Motor 2.0 input validation', () => {
  it.each([-1, 25, 36])('avviser alder utenfor 0–24: %s', (ageMonths) => {
    expect(() => validateRecommendInputV2(validInput({ ageMonths })))
      .toThrowError(expect.objectContaining({ code: 'unsupported_age' }));
  });

  it.each([0, 5, 6, 11, 12, 23, 24])('aksepterer gyldig alder %s', (ageMonths) => {
    // young_toddler-gyldig situasjon for hele spennet: vogn gjelder alle stadier.
    expect(() => validateRecommendInputV2(validInput({ ageMonths }))).not.toThrow();
  });

  it('avviser ikke-heltall alder som invalid_number', () => {
    expect(() => validateRecommendInputV2(validInput({ ageMonths: 7.5 })))
      .toThrowError(expect.objectContaining({ code: 'invalid_number' }));
  });

  it('avviser awake_low_mobility for eldste støttede stadium (24 mnd)', () => {
    expect(() => validateRecommendInputV2(validInput({ ageMonths: 24, situation: 'awake_low_mobility' })))
      .toThrowError(expect.objectContaining({ code: 'invalid_situation_for_age' }));
  });

  it('avviser active_play for nyfødt (3 mnd)', () => {
    expect(() => validateRecommendInputV2(validInput({ ageMonths: 3, situation: 'active_play' })))
      .toThrowError(expect.objectContaining({ code: 'invalid_situation_for_age' }));
  });

  it.each(['calm_outdoors', 'mixed_day'] as const)('%s er kun gyldig for 12–24 mnd', (situation) => {
    expect(() => validateRecommendInputV2(validInput({ ageMonths: 10, situation })))
      .toThrowError(expect.objectContaining({ code: 'invalid_situation_for_age' }));
    expect(() => validateRecommendInputV2(validInput({ ageMonths: 18, situation }))).not.toThrow();
  });

  it('indoor_sleep er gyldig for alle tre stadier', () => {
    for (const ageMonths of [2, 8, 20]) {
      expect(() => validateRecommendInputV2(validInput({ ageMonths, situation: 'indoor_sleep' }))).not.toThrow();
    }
  });

  it('avviser ukjent situasjon', () => {
    expect(() => validateRecommendInputV2(validInput({ situation: 'space_walk' as never })))
      .toThrowError(expect.objectContaining({ code: 'invalid_situation_for_age' }));
  });

  it('avviser ugyldig materialpreferanse', () => {
    expect(() => validateRecommendInputV2(validInput({ materialPreference: 'only_cashmere' as never })))
      .toThrowError(expect.objectContaining({ code: 'invalid_material_preference' }));
  });

  it('normaliserer manglende materialpreferanse til best_for_conditions', () => {
    const validated = validateRecommendInputV2(validInput());
    expect(validated.materialPreference).toBe('best_for_conditions');
  });

  it('aksepterer prefer_fleece som en gyldig materialpreferanse', () => {
    expect(
      validateRecommendInputV2(
        validInput({ materialPreference: 'prefer_fleece' }),
      ).materialPreference,
    ).toBe('prefer_fleece');
  });

  it('aksepterer prefer_cotton som en gyldig materialpreferanse', () => {
    expect(
      validateRecommendInputV2(
        validInput({ materialPreference: 'prefer_cotton' }),
      ).materialPreference,
    ).toBe('prefer_cotton');
  });

  it.each([
    ['feelsLikeC', { tempC: 4, feelsLikeC: Number.NaN, windMs: 3, precipMmH: 0 }],
    ['tempC', { tempC: Number.POSITIVE_INFINITY, feelsLikeC: 2, windMs: 3, precipMmH: 0 }],
    ['windMs negativ', { tempC: 4, feelsLikeC: 2, windMs: -1, precipMmH: 0 }],
    ['precipMmH negativ', { tempC: 4, feelsLikeC: 2, windMs: 3, precipMmH: -0.5 }],
  ])('avviser ugyldig vær (%s) som invalid_number', (_label, weather) => {
    expect(() => validateRecommendInputV2(validInput({ weather })))
      .toThrowError(expect.objectContaining({ code: 'invalid_number' }));
  });

  it('avviser kalibrering utenfor -1|0|1', () => {
    expect(() => validateRecommendInputV2(validInput({ childCalibration: 2 as never })))
      .toThrowError(expect.objectContaining({ code: 'invalid_number' }));
  });

  it('feilen er en EngineV2Error med navn og melding', () => {
    try {
      validateRecommendInputV2(validInput({ ageMonths: 30 }));
      expect.unreachable('skal kaste');
    } catch (err) {
      expect((err as Error).name).toBe('EngineV2Error');
      expect((err as Error).message).toMatch(/0.*24/);
    }
  });
});

// ─── Task 2: aldersstadier (tosidige boundary-tester, spec §6) ───────────────

describe('Motor 2.0 aldersstadier', () => {
  it.each([
    [0, 'newborn'], [5, 'newborn'], [6, 'mobile_baby'], [11, 'mobile_baby'],
    [12, 'young_toddler'], [23, 'young_toddler'], [24, 'young_toddler'],
  ] as const)('%s måneder er %s', (age, expected) => {
    expect(ageStageFor(age)).toBe(expected);
  });

  it.each([-1, 25, Number.NaN, Number.POSITIVE_INFINITY])(
    'ageStageFor avviser %s med unsupported_age',
    (age) => {
      expect(() => ageStageFor(age))
        .toThrowError(expect.objectContaining({ code: 'unsupported_age' }));
    },
  );
});

// ─── Task 2: full situasjonsmatrise (alle 21 celler, spec §7) ────────────────

describe('Motor 2.0 situasjonsmatrise', () => {
  const MATRIX: Array<[Situation, Record<AgeStage, boolean>]> = [
    ['stroller_awake',     { newborn: true,  mobile_baby: true,  young_toddler: true }],
    ['carrier',            { newborn: true,  mobile_baby: true,  young_toddler: true }],
    ['awake_low_mobility', { newborn: true,  mobile_baby: true,  young_toddler: false }],
    ['active_play',        { newborn: false, mobile_baby: true,  young_toddler: true }],
    ['calm_outdoors',      { newborn: false, mobile_baby: false, young_toddler: true }],
    ['mixed_day',          { newborn: false, mobile_baby: false, young_toddler: true }],
    ['indoor_sleep',       { newborn: true,  mobile_baby: true,  young_toddler: true }],
  ];

  const REPRESENTATIVE_AGE: Record<AgeStage, number> = {
    newborn: 3, mobile_baby: 8, young_toddler: 18,
  };

  for (const [situation, cells] of MATRIX) {
    for (const stage of ['newborn', 'mobile_baby', 'young_toddler'] as const) {
      const allowed = cells[stage];
      it(`${situation} × ${stage} = ${allowed ? 'gyldig' : 'ugyldig'}`, () => {
        expect(isSituationValidForStage(situation, stage)).toBe(allowed);
        const attempt = () =>
          validateRecommendInputV2(validInput({ ageMonths: REPRESENTATIVE_AGE[stage], situation }));
        if (allowed) expect(attempt).not.toThrow();
        else expect(attempt).toThrowError(expect.objectContaining({ code: 'invalid_situation_for_age' }));
      });
    }
  }

  it('profilene er frosne data med intensitet og eksponering', () => {
    expect(Object.isFrozen(SITUATION_PROFILES)).toBe(true);
    expect(SITUATION_PROFILES.active_play.intensity).toBe('active');
    expect(SITUATION_PROFILES.mixed_day.intensity).toBe('mixed');
    expect(SITUATION_PROFILES.stroller_awake.intensity).toBe('resting');
    expect(SITUATION_PROFILES.indoor_sleep.exposureKind).toBe('indoor');
    for (const p of Object.values(SITUATION_PROFILES)) {
      expect(p.exposureKind).toBe(p.id === 'indoor_sleep' ? 'indoor' : 'outdoor');
      expect(Object.isFrozen(p)).toBe(true);
    }
  });
});
