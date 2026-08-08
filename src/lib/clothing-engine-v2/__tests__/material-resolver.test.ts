/**
 * Motor 2.0 Task 6 — materialresolver.
 * Rangerte materialkandidater per rolle (aldri katalogvalg/labels her).
 * Policy per design-spec §8.1 og validerings-spec §5-matrisen.
 * FORVENTET RED: modulen finnes ikke.
 */
import { describe, expect, it } from 'vitest';
import { resolveMaterialFamilies } from '../material-resolver.js';
import { calculateThermalIntent } from '../thermal-intent.js';
import { validateRecommendInputV2 } from '../validation.js';
import type { RecommendInputV2, ThermalIntent } from '../types.js';

type Overrides = Omit<Partial<RecommendInputV2>, 'weather'> & {
  weather?: Partial<RecommendInputV2['weather']>;
};

function intent(partial?: Overrides): ThermalIntent {
  const { weather, ...rest } = partial ?? {};
  return calculateThermalIntent(validateRecommendInputV2({
    weather: { tempC: 0, feelsLikeC: -2, windMs: 3, precipMmH: 0, ...weather },
    ageMonths: 18,
    situation: 'stroller_awake',
    ...rest,
  }));
}

function rolesOf(policy: ReturnType<typeof resolveMaterialFamilies>): string[] {
  return policy.map((p) => p.role);
}

describe('Motor 2.0 materialresolver — preferanser', () => {
  it('avoid_wool gir null ullkandidater i noen rolle (invariant §5.1)', () => {
    const result = resolveMaterialFamilies(intent(), 'avoid_wool');
    expect(result.flatMap((r) => r.rankedMaterials)).not.toContain('wool');
    expect(result.length).toBeGreaterThan(0);
  });

  it('prefer_wool beholder skall først i regn (skall påvirkes aldri av preferanse)', () => {
    const wet = intent({ weather: { precipMmH: 2 } });
    for (const pref of ['best_for_conditions', 'prefer_wool', 'prefer_fleece', 'prefer_cotton', 'avoid_wool'] as const) {
      const shell = resolveMaterialFamilies(wet, pref).find((r) => r.role === 'shell_fullbody');
      expect(shell?.rankedMaterials[0], pref).toBe('shell');
    }
  });

  it('prefer_wool rangerer ull først i base og mellomlag i kulde', () => {
    const result = resolveMaterialFamilies(intent(), 'prefer_wool');
    expect(result.find((r) => r.role === 'base_fullbody')?.rankedMaterials[0]).toBe('wool');
    expect(result.find((r) => r.role === 'mid_fullbody')?.rankedMaterials[0]).toBe('wool');
  });

  it('prefer_fleece rangerer fleece først bare i roller der fleece er gyldig', () => {
    const result = resolveMaterialFamilies(intent(), 'prefer_fleece');
    expect(result.find((r) => r.role === 'mid_fullbody')?.rankedMaterials[0]).toBe('fleece');
    expect(result.find((r) => r.role === 'base_fullbody')?.rankedMaterials[0]).toBe('wool');
  });

  it('prefer_cotton rangerer bomull først bare i det varme, tørre og rolige bomullsvinduet', () => {
    const warm = intent({ weather: { feelsLikeC: 21, precipMmH: 0 }, situation: 'calm_outdoors' });
    const warmBase = resolveMaterialFamilies(warm, 'prefer_cotton')
      .find((r) => r.role.startsWith('base'));
    expect(warmBase?.rankedMaterials[0]).toBe('cotton');

    const coldWet = intent({ weather: { feelsLikeC: 2, precipMmH: 1 } });
    const coldBase = resolveMaterialFamilies(coldWet, 'prefer_cotton')
      .find((r) => r.role.startsWith('base'));
    expect(coldBase?.rankedMaterials).not.toContain('cotton');
  });

  it('prefer_cotton overstyrer ikke fukttransporterende innerlag under aktiv lek', () => {
    const active = intent({ situation: 'active_play', weather: { feelsLikeC: 18, precipMmH: 0 } });
    const activeBase = resolveMaterialFamilies(active, 'prefer_cotton')
      .find((r) => r.role.startsWith('base'));
    expect(activeBase?.rankedMaterials[0]).toBe('synthetic_wicking');
  });
});

describe('Motor 2.0 materialresolver — §5-matrisen', () => {
  it('kaldt/fuktig innerlag: ull eller fukttransporterende syntet, aldri bomull som standard', () => {
    const damp = intent({ weather: { feelsLikeC: 2, precipMmH: 1 } });
    const base = resolveMaterialFamilies(damp, 'best_for_conditions').find((r) => r.role === 'base_fullbody');
    expect(['wool', 'synthetic_wicking']).toContain(base?.rankedMaterials[0]);
    expect(base?.rankedMaterials[0]).not.toBe('cotton');
  });

  it('aktiv lek innerst: fukttransporterende syntet rangeres først', () => {
    const active = intent({ situation: 'active_play', weather: { feelsLikeC: 8 } });
    const base = resolveMaterialFamilies(active, 'best_for_conditions').find((r) => r.role.startsWith('base'));
    expect(base?.rankedMaterials[0]).toBe('synthetic_wicking');
  });

  it('varmt/tørt/rolig: lett bomull er gyldig førstevalg (G28 — ingen moralsk rangering)', () => {
    const warm = intent({ weather: { feelsLikeC: 21, precipMmH: 0 }, situation: 'calm_outdoors' });
    const base = resolveMaterialFamilies(warm, 'best_for_conditions').find((r) => r.role.startsWith('base'));
    expect(base?.rankedMaterials[0]).toBe('cotton');
  });

  it('kaldt mellomlag: ull eller fleece; avoid_wool gir fleece', () => {
    const mid = (pref: 'best_for_conditions' | 'avoid_wool') =>
      resolveMaterialFamilies(intent(), pref).find((r) => r.role === 'mid_fullbody');
    expect(mid('best_for_conditions')?.rankedMaterials.slice(0, 2)).toEqual(
      expect.arrayContaining(['wool', 'fleece']),
    );
    expect(mid('avoid_wool')?.rankedMaterials[0]).toBe('fleece');
  });

  it('våt/skiftende isolasjon: syntetisk isolasjon først, uansett preferanse', () => {
    const wetCold = intent({ weather: { feelsLikeC: -2, precipMmH: 1.5 } });
    for (const pref of ['best_for_conditions', 'prefer_wool', 'prefer_fleece', 'prefer_cotton', 'avoid_wool'] as const) {
      const ins = resolveMaterialFamilies(wetCold, pref).find((r) => r.role === 'insulated_fullbody');
      expect(ins?.rankedMaterials[0], pref).toBe('synthetic_insulation');
    }
  });

  it('tørr/kald isolasjon: dun er gyldig kandidat', () => {
    const dryCold = intent({ weather: { feelsLikeC: -12, precipMmH: 0 } });
    const ins = resolveMaterialFamilies(dryCold, 'best_for_conditions').find((r) => r.role === 'insulated_fullbody');
    expect(ins?.rankedMaterials).toContain('down');
    expect(ins?.rankedMaterials).toContain('synthetic_insulation');
  });
});

describe('Motor 2.0 materialresolver — rolleavledning', () => {
  it('regn gir skallrolle; tørt mildt vær uten vind gjør det ikke', () => {
    expect(rolesOf(resolveMaterialFamilies(intent({ weather: { precipMmH: 2 } }), 'best_for_conditions')))
      .toContain('shell_fullbody');
    const dryMild = intent({ weather: { feelsLikeC: 12, precipMmH: 0, windMs: 2 } });
    expect(rolesOf(resolveMaterialFamilies(dryMild, 'best_for_conditions')))
      .not.toContain('shell_fullbody');
  });

  it('sterk kulde gir isolert helplagg; mild gjør det ikke (G01)', () => {
    expect(rolesOf(resolveMaterialFamilies(intent(), 'best_for_conditions')))
      .toContain('insulated_fullbody');
    const mild = intent({ weather: { feelsLikeC: 12 } });
    expect(rolesOf(resolveMaterialFamilies(mild, 'best_for_conditions')))
      .not.toContain('insulated_fullbody');
  });

  it('varmedag for smårolling gir todelt base (t-skjorte/shorts-roller)', () => {
    const heat = intent({ weather: { feelsLikeC: 24 }, situation: 'active_play' });
    const roles = rolesOf(resolveMaterialFamilies(heat, 'best_for_conditions'));
    expect(roles).toContain('base_top');
    expect(roles).toContain('base_bottom');
    expect(roles).not.toContain('base_fullbody');
  });

  it('nyfødt beholder helkropps-base også i varme (heldress/body-form)', () => {
    const heat = intent({ ageMonths: 3, situation: 'stroller_awake', weather: { feelsLikeC: 24 } });
    expect(rolesOf(resolveMaterialFamilies(heat, 'best_for_conditions'))).toContain('base_fullbody');
  });

  it('hode/hender/føtter følger behovsflaggene', () => {
    const cold = resolveMaterialFamilies(intent(), 'best_for_conditions');
    expect(rolesOf(cold)).toEqual(expect.arrayContaining(['headwear', 'handwear', 'footwear']));
    const warm = resolveMaterialFamilies(
      intent({ weather: { feelsLikeC: 24 }, situation: 'active_play' }),
      'best_for_conditions',
    );
    expect(rolesOf(warm)).not.toContain('handwear');
    expect(rolesOf(warm)).toContain('headwear');
  });

  it('deterministisk: samme intent og preferanse gir identisk policy', () => {
    const a = resolveMaterialFamilies(intent(), 'best_for_conditions');
    const b = resolveMaterialFamilies(intent(), 'best_for_conditions');
    expect(a).toEqual(b);
  });
});
