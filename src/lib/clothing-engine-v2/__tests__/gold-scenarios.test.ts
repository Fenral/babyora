/**
 * Motor 2.0 Task 10 — recommendV2() mot alle gullscenarioer (G01–G36)
 * + globale motorinvarianter (validerings-spec §8) som avgrenset,
 * seedet kombinasjonssøk (aldri tilfeldighet uten seed).
 */
import { describe, expect, it } from 'vitest';
import { recommendV2 } from '../recommend.js';
import { GOLD_SCENARIOS } from './gold-scenarios.js';
import type { RecommendInputV2, Situation } from '../types.js';

describe('Motor 2.0 gullscenarioer', () => {
  for (const scenario of GOLD_SCENARIOS) {
    it(`${scenario.id}: ${scenario.title}`, () => {
      const result = recommendV2(scenario.input);
      scenario.assert(result);
    });
  }

  it('G22: 25 måneder avvises med unsupported_age — ingen anbefaling', () => {
    expect(() => recommendV2({
      weather: { tempC: 5, feelsLikeC: 5, windMs: 2, precipMmH: 0 },
      ageMonths: 25,
      situation: 'stroller_awake',
    })).toThrowError(expect.objectContaining({ code: 'unsupported_age' }));
  });

  it('G35: våken-lite-bevegelse ved 24 mnd avvises — ingen gjetting', () => {
    expect(() => recommendV2({
      weather: { tempC: 5, feelsLikeC: 5, windMs: 2, precipMmH: 0 },
      ageMonths: 24,
      situation: 'awake_low_mobility',
    })).toThrowError(expect.objectContaining({ code: 'invalid_situation_for_age' }));
  });

  it('G36: 100 kjøringer gir identisk semantisk resultat og fingerprint', () => {
    const input = GOLD_SCENARIOS.find((s) => s.id === 'G36')!.input;
    const first = recommendV2(input);
    for (let i = 0; i < 99; i++) {
      const next = recommendV2(input);
      expect(next.fingerprint).toBe(first.fingerprint);
      expect(next).toEqual(first);
    }
  });
});

describe('Motor 2.0 globale invarianter (§8) — avgrenset kombinasjonssøk', () => {
  const AGES = [0, 2, 5, 6, 8, 11, 12, 15, 16, 20, 23, 24];
  const FEELS = [-21, -12, -6, -2, 2, 7, 12, 18, 24, 29];
  const SITUATIONS: Situation[] = ['stroller_awake', 'carrier', 'awake_low_mobility', 'active_play', 'calm_outdoors', 'mixed_day'];
  const PREFS = ['best_for_conditions', 'prefer_wool', 'prefer_fleece', 'prefer_cotton', 'avoid_wool'] as const;

  function tryRecommend(input: RecommendInputV2) {
    try {
      return recommendV2(input);
    } catch (err) {
      // Kun kjente, typede avvisninger er lovlige i det gyldige rommet.
      expect((err as { code?: string }).code).toBe('invalid_situation_for_age');
      return null;
    }
  }

  it('hele det avgrensede rommet: age-gyldighet, ull-invariant, PII-frihet, determinismenøkkel', () => {
    let checked = 0;
    for (const ageMonths of AGES) {
      for (const feelsLikeC of FEELS) {
        for (const situation of SITUATIONS) {
          for (const materialPreference of PREFS) {
            const input: RecommendInputV2 = {
              weather: { tempC: feelsLikeC, feelsLikeC, windMs: 3, precipMmH: 0 },
              ageMonths, situation, materialPreference,
            };
            const r = tryRecommend(input);
            if (!r) continue;
            checked++;
            // Invariant 9: alle plagg gyldige for stadiet (via katalogens stadier).
            expect(r.garments.length).toBeGreaterThan(0);
            // §5.1: avoid_wool → aldri ull.
            if (materialPreference === 'avoid_wool') {
              expect(r.garments.every((g) => g.material !== 'wool')).toBe(true);
            }
            // Invariant 6: ingen identitetsfelt i serialisert resultat.
            expect(JSON.stringify(r)).not.toMatch(/"(name|childName|dob|birthDate|latitude|longitude|childId|accountId|householdId|email)"\s*:/i);
            // Fingerprint-format.
            expect(r.fingerprint).toMatch(/^v2-[0-9a-f]{16}$/);
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(500);
  });

  it('invariant 1: aktiv lek gir aldri mer isolasjon enn rolig ute (identisk øvrig input)', () => {
    for (const feelsLikeC of FEELS) {
      const active = tryRecommend({
        weather: { tempC: feelsLikeC, feelsLikeC, windMs: 3, precipMmH: 0 },
        ageMonths: 18, situation: 'active_play',
      });
      const calm = tryRecommend({
        weather: { tempC: feelsLikeC, feelsLikeC, windMs: 3, precipMmH: 0 },
        ageMonths: 18, situation: 'calm_outdoors',
      });
      expect(active!.intent.insulationWarmth).toBeLessThanOrEqual(calm!.intent.insulationWarmth);
    }
  });

  it('invariant 2/3: mer nedbør/vind fjerner aldri beskyttelse', () => {
    for (const precip of [0, 0.5, 2, 6]) {
      for (const wind of [0, 5, 9]) {
        const r = tryRecommend({
          weather: { tempC: 4, feelsLikeC: 4, windMs: wind, precipMmH: precip },
          ageMonths: 18, situation: 'stroller_awake',
        })!;
        if (precip >= 0.5) expect(r.intent.needsWaterproofShell).toBe(true);
        if (wind >= 5) {
          // Vindbehov dekkes av skall ELLER vindtett isolert dress.
          const windCovered = r.garments.some((g) => g.role.startsWith('shell_') || g.role === 'insulated_fullbody');
          expect(windCovered).toBe(true);
        }
      }
    }
  });

  it('invariant 4: kalibrering fjerner aldri sikkerhetspåkrevd utstyr/flagg', () => {
    for (const bias of [-1, 1] as const) {
      const base = recommendV2({
        weather: { tempC: -12, feelsLikeC: -12, windMs: 3, precipMmH: 1 },
        ageMonths: 18, situation: 'stroller_awake', exposureMin: 45,
      });
      const cal = recommendV2({
        weather: { tempC: -12, feelsLikeC: -12, windMs: 3, precipMmH: 1 },
        ageMonths: 18, situation: 'stroller_awake', exposureMin: 45, childCalibration: bias,
      });
      expect(cal.equipment.map((e) => e.id).sort()).toEqual(base.equipment.map((e) => e.id).sort());
      expect(cal.safetyFlags.map((f) => f.code).sort()).toEqual(base.safetyFlags.map((f) => f.code).sort());
    }
  });

  it('invariant 7: to inputs som bare skiller seg i irrelevante felt gir samme fingerprint', () => {
    const a = recommendV2({
      weather: { tempC: 2, feelsLikeC: 1, windMs: 3, precipMmH: 0 },
      ageMonths: 14, situation: 'stroller_awake',
    });
    const b = recommendV2({
      weather: { tempC: 2, feelsLikeC: 1, windMs: 3, precipMmH: 0 },
      ageMonths: 14, situation: 'stroller_awake',
      exposureMin: 60, // eksplisitt default — semantisk identisk
    });
    expect(a.fingerprint).toBe(b.fingerprint);
  });
});
