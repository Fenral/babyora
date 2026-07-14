/**
 * Motor 2.0 Task 7 — plagg- og utstyrsresolver.
 * Deterministisk valg fra katalogen: nærmeste varmenivå → materialrang → stabil ID.
 * Fottøyreglene under 9 / 9–15 / 16+ mnd håndheves her (konsolidert plan §4).
 * FORVENTET RED: modulene finnes ikke.
 */
import { describe, expect, it } from 'vitest';
import { resolveGarments, resolveRecommendationParts } from '../garment-resolver.js';
import { resolveEquipment } from '../equipment-resolver.js';
import { resolveMaterialFamilies } from '../material-resolver.js';
import { calculateThermalIntent } from '../thermal-intent.js';
import { validateRecommendInputV2 } from '../validation.js';
import type { RecommendInputV2, ThermalIntent } from '../types.js';

type Overrides = Omit<Partial<RecommendInputV2>, 'weather'> & {
  weather?: Partial<RecommendInputV2['weather']>;
};

function makeIntent(partial?: Overrides): { intent: ThermalIntent; ageMonths: number } {
  const { weather, ...rest } = partial ?? {};
  const input = validateRecommendInputV2({
    weather: { tempC: 0, feelsLikeC: -2, windMs: 3, precipMmH: 0, ...weather },
    ageMonths: 18,
    situation: 'stroller_awake',
    ...rest,
  });
  return { intent: calculateThermalIntent(input), ageMonths: input.ageMonths };
}

function parts(partial?: Overrides, preference: 'best_for_conditions' | 'prefer_wool' | 'avoid_wool' = 'best_for_conditions') {
  const { intent, ageMonths } = makeIntent(partial);
  const policy = resolveMaterialFamilies(intent, preference);
  return resolveRecommendationParts(intent, policy, ageMonths);
}

describe('Motor 2.0 plaggresolver — grunnvalg', () => {
  it('velger kun varianter gyldige for aldersstadiet', () => {
    const { intent, ageMonths } = makeIntent({ ageMonths: 18 });
    const policy = resolveMaterialFamilies(intent, 'best_for_conditions');
    const garments = resolveGarments(intent, policy, ageMonths);
    expect(garments.length).toBeGreaterThan(0);
    // Katalog-kryssjekk skjer via variantId — resolveren returnerer aldri
    // en variant hvis validAgeStages ikke dekker stadiet (testes negativt
    // ved at ingen 'footwear-blend-0-sandals' o.l. dukker opp for newborn under).
  });

  it('avoid_wool: ingen valgt variant har wool-materiale (G23)', () => {
    const g = parts({ weather: { feelsLikeC: -4 } }, 'avoid_wool').garments;
    expect(g.length).toBeGreaterThan(0);
    expect(g.every((item) => item.material !== 'wool')).toBe(true);
  });

  it('prefer_wool: base og mellomlag blir ull i kulde (G25)', () => {
    const g = parts({ weather: { feelsLikeC: -4 } }, 'prefer_wool').garments;
    expect(g.find((i) => i.role === 'base_fullbody')?.material).toBe('wool');
    expect(g.find((i) => i.role === 'mid_fullbody')?.material).toBe('wool');
  });

  it('regn: skall er med og er vanntett-varianten (G08)', () => {
    const g = parts({ weather: { precipMmH: 2, feelsLikeC: 8 } }).garments;
    const shell = g.find((i) => i.role === 'shell_fullbody');
    expect(shell).toBeDefined();
    expect(shell?.variantId).toBe('shell-fullbody-rain');
  });

  it('deterministisk: samme input gir identisk plaggliste (G36)', () => {
    expect(parts().garments).toEqual(parts().garments);
  });

  it('alle valgte plagg har stabil rolle, materialfamilie og conceptId (invariant 10)', () => {
    for (const item of parts().garments) {
      expect(item.variantId).toMatch(/^[a-z0-9-]+$/);
      expect(item.conceptId.length).toBeGreaterThan(0);
      expect(item.labelNb.length).toBeGreaterThan(0);
    }
  });
});

describe('Motor 2.0 plaggresolver — fottøyregler (G17–G20)', () => {
  it('under 9 mnd: aldri sko — kun sokker/strømper (G17)', () => {
    const g = parts({ ageMonths: 8, situation: 'awake_low_mobility', weather: { feelsLikeC: 8 } }).garments;
    const foot = g.filter((i) => i.role === 'footwear');
    expect(foot.length).toBeGreaterThan(0);
    expect(foot.every((i) => /sokker|strømper/i.test(i.labelNb))).toBe(true);
  });

  it('9–15 mnd: mykt fottøy er lov, ordinære sko/vintersko er det ikke (G18/G19)', () => {
    const g = parts({ ageMonths: 15, situation: 'active_play', weather: { feelsLikeC: 0 } }).garments;
    const foot = g.filter((i) => i.role === 'footwear');
    expect(foot.some((i) => /tøffel|sokker|strømper/i.test(i.labelNb))).toBe(true);
    expect(foot.every((i) => i.variantId !== 'footwear-syn-3-winter' && i.variantId !== 'footwear-blend-0-shoes')).toBe(true);
  });

  it('16+ mnd: ordinært vinterfottøy kan velges (G20)', () => {
    const g = parts({ ageMonths: 16, situation: 'active_play', weather: { feelsLikeC: 0 } }).garments;
    expect(g.some((i) => i.variantId === 'footwear-syn-3-winter')).toBe(true);
  });

  it('varmedag 18 mnd: lett fottøy, ikke vinterfottøy (G06-familien)', () => {
    const g = parts({ ageMonths: 18, situation: 'active_play', weather: { feelsLikeC: 24, symbolCode: 'clearsky_day' } }).garments;
    const foot = g.filter((i) => i.role === 'footwear');
    expect(foot.every((i) => i.variantId !== 'footwear-syn-3-winter')).toBe(true);
  });
});

describe('Motor 2.0 plaggresolver — varme og feil', () => {
  it('sterk kulde gir varmere valg enn mild (monotoni i praksis)', () => {
    const extreme = parts({ weather: { feelsLikeC: -18 } }).garments;
    const mild = parts({ weather: { feelsLikeC: 12 } }).garments;
    const ins = extreme.find((i) => i.role === 'insulated_fullbody');
    expect(ins).toBeDefined();
    expect(mild.find((i) => i.role === 'insulated_fullbody')).toBeUndefined();
  });

  it('ekstrem kulde + avoid_wool: hodeplagg blir vindtett balaklava (nærmeste varme vinner over materialrang)', () => {
    const g = parts({ weather: { feelsLikeC: -18 } }, 'avoid_wool').garments;
    const head = g.find((i) => i.role === 'headwear');
    expect(head?.variantId).toBe('headwear-blend-3-balaclava');
  });

  it('kaster unresolved_material_constraint når ingen kandidat finnes', () => {
    const { intent, ageMonths } = makeIntent();
    // Syntetisk policy som krever et materiale ingen katalogvariant har for rollen.
    const impossible = [{ role: 'mid_fullbody' as const, rankedMaterials: ['down' as const], explanationCodes: [] }];
    expect(() => resolveGarments(intent, impossible, ageMonths))
      .toThrowError(expect.objectContaining({ code: 'unresolved_material_constraint' }));
  });
});

describe('Motor 2.0 utstyrsresolver', () => {
  it('regntrekk er utstyr, aldri plagg (invariant 5)', () => {
    const p = parts({ weather: { precipMmH: 2 } });
    expect(p.garments.every((i) => i.role !== 'equipment')).toBe(true);
    expect(p.equipment).toContainEqual(expect.objectContaining({ id: 'stroller_rain_cover', labelNb: 'regntrekk på vognen' }));
  });

  it('kald vogn gir vognpose; bilstol gir kjørepose', () => {
    const cold = parts({ weather: { feelsLikeC: 2 } });
    expect(cold.equipment.some((e) => e.id === 'stroller_warm_pouch')).toBe(true);
    const car = parts({ carSeat: true });
    expect(car.equipment.some((e) => e.id === 'car_seat_pouch')).toBe(true);
  });

  it('resolveEquipment er ren og deterministisk', () => {
    const { intent } = makeIntent({ weather: { precipMmH: 1 } });
    expect(resolveEquipment(intent)).toEqual(resolveEquipment(intent));
  });
});
