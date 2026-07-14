/**
 * Motor 2.0 Task 8 — sikkerhetsregler på strukturerte plagg.
 * Tester navngis etter legacy-regelkoder (HB-9, SB-7, SB-8, CK-9 …) og
 * asserter roller/materialer — aldri norske regex-strenger (planens krav).
 * Norsk sikkerhets-copy er byte-identisk med legacy der regelen er portet.
 * FORVENTET RED: modulen finnes ikke.
 */
import { describe, expect, it } from 'vitest';
import { applySafetyV2 } from '../safety.js';
import { applyThermalCalibration } from '../calibration.js';
import { resolveMaterialFamilies } from '../material-resolver.js';
import { resolveRecommendationParts } from '../garment-resolver.js';
import { calculateThermalIntent } from '../thermal-intent.js';
import { validateRecommendInputV2 } from '../validation.js';
import type { RecommendInputV2, ValidatedRecommendInputV2 } from '../types.js';

type Overrides = Omit<Partial<RecommendInputV2>, 'weather'> & {
  weather?: Partial<RecommendInputV2['weather']>;
};

function pipelineTo(partial?: Overrides, bias: -1 | 0 | 1 = 0) {
  const { weather, ...rest } = partial ?? {};
  const input: ValidatedRecommendInputV2 = validateRecommendInputV2({
    weather: { tempC: 0, feelsLikeC: -2, windMs: 3, precipMmH: 0, ...weather },
    ageMonths: 18,
    situation: 'stroller_awake',
    ...rest,
  });
  const raw = calculateThermalIntent(input);
  const intent = applyThermalCalibration(raw, bias);
  const policy = resolveMaterialFamilies(intent, input.materialPreference);
  const parts = resolveRecommendationParts(intent, policy, input.ageMonths);
  return { input, intent, parts };
}

describe('Motor 2.0 safety — HB-9 bilstol (CRITICAL)', () => {
  it('HB-9: fjerner isolert yttertøy (varme ≥ 3) i bilstol-kontekst', () => {
    const { input, intent, parts } = pipelineTo({ carSeat: true, weather: { feelsLikeC: -6 } });
    expect(parts.garments.some((g) => g.role === 'insulated_fullbody')).toBe(true);
    const safe = applySafetyV2(input, intent, parts);
    expect(safe.garments.some((g) => g.role === 'insulated_fullbody')).toBe(false);
    const flag = safe.flags.find((f) => f.code === 'HB-9');
    expect(flag?.severity).toBe('CRITICAL');
    expect(flag?.message).toBe('I bilstolen: tynne lag + sele tett. Legg dressen over som teppe etter at selen er stram.');
    expect(safe.severity).toBe('CRITICAL');
  });

  it('HB-9 gjelder også ETTER kalibrering +1 (G30 — safety kjører sist)', () => {
    const { input, intent, parts } = pipelineTo({ carSeat: true, weather: { feelsLikeC: 2 } }, 1);
    const safe = applySafetyV2(input, intent, parts);
    expect(safe.garments.some((g) => g.role === 'insulated_fullbody')).toBe(false);
  });

  it('HB-9 rører ikke lett kjøredress (varme 2) — som legacy', () => {
    const { input, intent, parts } = pipelineTo({ carSeat: true, weather: { feelsLikeC: 6 } });
    const light = parts.garments.find((g) => g.role === 'insulated_fullbody');
    if (light) {
      const safe = applySafetyV2(input, intent, parts);
      expect(safe.garments.some((g) => g.variantId === light.variantId)).toBe(light.variantId.includes('-2-'));
    }
  });
});

describe('Motor 2.0 safety — varme (SB-7 / heat-strip)', () => {
  it('SB-7: ekstrem varme + < 6 mnd gir HIGH-flagg med legacy-copy', () => {
    const { input, intent, parts } = pipelineTo({ ageMonths: 5, weather: { feelsLikeC: 29 } });
    const safe = applySafetyV2(input, intent, parts);
    const flag = safe.flags.find((f) => f.code === 'SB-7');
    expect(flag?.severity).toBe('HIGH');
    expect(flag?.message).toBe('Spedbarn (< 6 mnd) tåler ekstrem hete dårlig — maks 15 min ute uten skygge.');
  });

  it('HB-V2-HEAT: mellomlag/isolasjon kan aldri overleve hete-bånd (G32-vern)', () => {
    const { input, intent, parts } = pipelineTo({ weather: { feelsLikeC: 24 } }, 1);
    const safe = applySafetyV2(input, intent, parts);
    expect(safe.garments.some((g) => g.role.startsWith('mid_') || g.role === 'insulated_fullbody')).toBe(false);
  });

  it('vognpose-utstyr fjernes i varme (≥ 18 °C — SB-6-semantikk)', () => {
    const { input, intent, parts } = pipelineTo({ weather: { feelsLikeC: 20 } });
    const withPouch = {
      ...parts,
      equipment: [...parts.equipment, { id: 'stroller_warm_pouch' as const, labelNb: 'vognpose', illustrationId: null }],
    };
    const safe = applySafetyV2(input, intent, withPouch);
    expect(safe.equipment.some((e) => e.id === 'stroller_warm_pouch')).toBe(false);
  });
});

describe('Motor 2.0 safety — kulde (SB-8 / nyfødt-grense)', () => {
  it('SB-8: feels ≤ −10, eksponering > 30 min, ≥ 3 mnd → MEDIUM-flagg med legacy-copy', () => {
    const { input, intent, parts } = pipelineTo({ ageMonths: 7, weather: { feelsLikeC: -12 }, exposureMin: 45 });
    const safe = applySafetyV2(input, intent, parts);
    const flag = safe.flags.find((f) => f.code === 'SB-8');
    expect(flag?.severity).toBe('MEDIUM');
    expect(flag?.message).toBe('Kort tur — sjekk kinn, nese og ører hvert 20. minutt. Frostskade-risiko ved feels ≤ -10 °C.');
  });

  it('HB-V2-NB-COLD: < 3 mnd i kuldegrader gir HIGH-flagg (G33)', () => {
    const { input, intent, parts } = pipelineTo({ ageMonths: 2, weather: { feelsLikeC: -4 } });
    const safe = applySafetyV2(input, intent, parts);
    const flag = safe.flags.find((f) => f.code === 'HB-V2-NB-COLD');
    expect(flag?.severity).toBe('HIGH');
  });

  it('kalibrering −1 fjerner aldri skall eller kuldeflagg (G31, invariant 4)', () => {
    const base = pipelineTo({ weather: { feelsLikeC: -12, precipMmH: 1 }, exposureMin: 45, ageMonths: 7 });
    const calibrated = pipelineTo({ weather: { feelsLikeC: -12, precipMmH: 1 }, exposureMin: 45, ageMonths: 7 }, -1);
    const safeBase = applySafetyV2(base.input, base.intent, base.parts);
    const safeCal = applySafetyV2(calibrated.input, calibrated.intent, calibrated.parts);
    expect(safeCal.garments.some((g) => g.role === 'shell_fullbody')).toBe(
      safeBase.garments.some((g) => g.role === 'shell_fullbody'),
    );
    expect(safeCal.flags.some((f) => f.code === 'SB-8')).toBe(true);
  });
});

describe('Motor 2.0 safety — bæresele og søvn', () => {
  it('CK-9: innenfor jakka overlever verken isolert helplagg eller skall', () => {
    const { input, intent } = pipelineTo({ situation: 'carrier', carrierUnderParentJacket: true, weather: { feelsLikeC: -2 } });
    // Fiendtlig parts-mutasjon (simulerer fremtidig override-vei): legg inn isolert.
    const policy = resolveMaterialFamilies(intent, input.materialPreference);
    const parts = resolveRecommendationParts(intent, policy, input.ageMonths);
    const hostile = {
      ...parts,
      garments: [...parts.garments, {
        conceptId: 'insulated_fullbody-w3', variantId: 'insulated-fullbody-syn-3',
        role: 'insulated_fullbody' as const, material: 'synthetic_insulation' as const,
        labelNb: 'vinterkjøredress', illustrationId: null, required: true,
      }],
    };
    const safe = applySafetyV2(input, intent, hostile);
    expect(safe.garments.some((g) => g.role === 'insulated_fullbody')).toBe(false);
    expect(safe.flags.some((f) => f.code === 'CK-9')).toBe(true);
  });

  it('HB-1: hodeplagg overlever aldri innesøvn', () => {
    const { input, intent, parts } = pipelineTo({ situation: 'indoor_sleep', weather: { feelsLikeC: 19, tempC: 19 } });
    const hostile = {
      ...parts,
      garments: [...parts.garments, {
        conceptId: 'headwear-w2', variantId: 'headwear-wool-2',
        role: 'headwear' as const, material: 'wool' as const,
        labelNb: 'lue m/ ull', illustrationId: null, required: true,
      }],
    };
    const safe = applySafetyV2(input, intent, hostile);
    expect(safe.garments.some((g) => g.role === 'headwear')).toBe(false);
    expect(safe.flags.find((f) => f.code === 'HB-1')?.severity).toBe('CRITICAL');
  });
});

describe('Motor 2.0 safety — struktur', () => {
  it('er idempotent: applySafetyV2 to ganger = én gang', () => {
    const { input, intent, parts } = pipelineTo({ carSeat: true, weather: { feelsLikeC: -6 } });
    const once = applySafetyV2(input, intent, parts);
    const twice = applySafetyV2(input, intent, { garments: once.garments, equipment: once.equipment });
    expect(twice.garments).toEqual(once.garments);
    expect(twice.equipment).toEqual(once.equipment);
  });

  it('muterer aldri input-parts (ren funksjon)', () => {
    const { input, intent, parts } = pipelineTo({ carSeat: true, weather: { feelsLikeC: -6 } });
    const snapshot = JSON.parse(JSON.stringify(parts));
    applySafetyV2(input, intent, parts);
    expect(parts).toEqual(snapshot);
  });

  it('uten trigget regel: garments/equipment uendret, severity NONE', () => {
    const { input, intent, parts } = pipelineTo({ weather: { feelsLikeC: 8 } });
    const safe = applySafetyV2(input, intent, parts);
    expect(safe.garments).toEqual(parts.garments);
    expect(safe.equipment).toEqual(parts.equipment);
    expect(safe.severity).toBe('NONE');
  });
});
