/**
 * Motor 2.0 — gullscenarioene G01–G36 (validerings-spec §7).
 * Hvert scenario = navngitt fixture + semantiske forventninger. Filen er også
 * grunnlaget for fagpersonens kontrollskjema (Task 16-eksporten).
 */

import { expect } from 'vitest';
import type { RecommendationV2, RecommendInputV2 } from '../types.js';

export type GoldScenario = {
  id: string;
  title: string;
  input: RecommendInputV2;
  assert: (r: RecommendationV2) => void;
};

type W = Partial<RecommendInputV2['weather']>;

function makeInput(
  ageMonths: number,
  situation: RecommendInputV2['situation'],
  weather: W,
  rest?: Partial<RecommendInputV2>,
): RecommendInputV2 {
  return {
    weather: { tempC: weather.feelsLikeC ?? 5, feelsLikeC: 5, windMs: 2, precipMmH: 0, ...weather },
    ageMonths,
    situation,
    ...rest,
  };
}

const roles = (r: RecommendationV2) => r.garments.map((g) => g.role);
const hasRole = (r: RecommendationV2, role: string) => roles(r).some((x) => x === role || x.startsWith(role));
const materials = (r: RecommendationV2) => r.garments.map((g) => g.material);

export const GOLD_SCENARIOS: GoldScenario[] = [
  {
    id: 'G01', title: 'Nyfødt mild vogn',
    input: makeInput(2, 'stroller_awake', { feelsLikeC: 12 }),
    assert(r) {
      expect(hasRole(r, 'base_fullbody')).toBe(true);
      expect(hasRole(r, 'insulated_fullbody')).toBe(false);
    },
  },
  {
    id: 'G02', title: 'Nyfødt kjølig vogn',
    input: makeInput(2, 'stroller_awake', { feelsLikeC: 4 }),
    assert(r) {
      expect(hasRole(r, 'insulated_fullbody')).toBe(true);
      expect(r.intent.insulationWarmth).toBeGreaterThan(2);
    },
  },
  {
    id: 'G03', title: 'Nyfødt frost og vind',
    input: makeInput(3, 'stroller_awake', { feelsLikeC: -6, windMs: 6 }),
    assert(r) {
      expect(['HIGH', 'CRITICAL']).toContain(r.severity);
      expect(r.safetyFlags.some((f) => f.code === 'HB-V2-NB-COLD')).toBe(true); // legacy: ≤ 3 mnd
      // Vindbeskyttelse: isolert dress (vindtett) eller eksplisitt skall.
      expect(hasRole(r, 'insulated_fullbody') || hasRole(r, 'shell_')).toBe(true);
    },
  },
  {
    id: 'G04', title: 'Nyfødt i bæresele under jakke',
    input: makeInput(4, 'carrier', { feelsLikeC: 2 }, { carrierUnderParentJacket: true }),
    assert(r) {
      expect(hasRole(r, 'insulated_fullbody')).toBe(false);
      expect(hasRole(r, 'shell_')).toBe(false);
    },
  },
  {
    id: 'G05', title: 'Nyfødt i bæresele utenpå jakke',
    input: makeInput(4, 'carrier', { feelsLikeC: 2 }),
    assert(r) {
      expect(hasRole(r, 'insulated_fullbody')).toBe(true); // mer værbeskyttelse enn G04
    },
  },
  {
    id: 'G06', title: 'Mobil baby varm dag',
    input: makeInput(9, 'awake_low_mobility', { feelsLikeC: 22, symbolCode: 'clearsky_day' }),
    assert(r) {
      expect(r.intent.needsSunProtection).toBe(true);
      expect(hasRole(r, 'mid_')).toBe(false);
      expect(hasRole(r, 'insulated_fullbody')).toBe(false);
      const head = r.garments.find((g) => g.role === 'headwear');
      expect(head?.variantId).toBe('headwear-cotton-0-sun');
    },
  },
  {
    id: 'G07', title: 'Mobil baby kort aktiv lek',
    input: makeInput(10, 'active_play', { feelsLikeC: 14 }),
    assert(r) {
      expect(r.intent.explanationCodes).toContain('ACTIVE_CHILD_LESS_INSULATION');
    },
  },
  {
    id: 'G08', title: 'Mobil baby regn i vogn',
    input: makeInput(10, 'stroller_awake', { feelsLikeC: 8, precipMmH: 1.5, symbolCode: 'rain' }),
    assert(r) {
      expect(r.equipment.some((e) => e.id === 'stroller_rain_cover')).toBe(true);
      // Ikke unødvendig varm: aldri tykkere enn kjøredress-nivå (w2→'kjøredress').
      const ins = r.garments.find((g) => g.role === 'insulated_fullbody');
      if (ins) expect(ins.labelNb).toBe('kjøredress');
    },
  },
  {
    id: 'G09', title: 'Ung smårolling kald vogn',
    input: makeInput(15, 'stroller_awake', { feelsLikeC: 0 }),
    assert(r) {
      expect(hasRole(r, 'insulated_fullbody')).toBe(true);
      expect(r.ageStage).toBe('young_toddler');
    },
  },
  {
    id: 'G10', title: 'Ung smårolling aktiv kulde',
    input: makeInput(15, 'active_play', { feelsLikeC: 0 }),
    assert(r) {
      // Mindre isolasjon enn G09 (gaten under 3) — men samme værbeskyttelse.
      expect(hasRole(r, 'insulated_fullbody')).toBe(false);
      expect(hasRole(r, 'mid_')).toBe(true);
    },
  },
  {
    id: 'G11', title: 'Ung smårolling blandet barnehagedag',
    input: makeInput(20, 'mixed_day', { feelsLikeC: 7 }),
    assert(r) {
      expect(hasRole(r, 'mid_')).toBe(true);
      expect(r.explanations.length).toBeGreaterThan(0);
    },
  },
  {
    id: 'G12', title: 'Ung smårolling varm og våt',
    input: makeInput(22, 'active_play', { feelsLikeC: 18, precipMmH: 1.2, symbolCode: 'rain' }),
    assert(r) {
      expect(hasRole(r, 'shell_fullbody')).toBe(true);
      expect(hasRole(r, 'mid_')).toBe(false); // lett base uten tungt mellomlag
    },
  },
  {
    id: 'G13', title: 'Øvre alder aktiv høst',
    input: makeInput(24, 'active_play', { feelsLikeC: 9 }),
    assert(r) {
      expect(r.ageStage).toBe('young_toddler');
      expect(r.intent.explanationCodes).toContain('ACTIVE_CHILD_LESS_INSULATION');
    },
  },
  {
    id: 'G14', title: 'Øvre alder rolig høst',
    input: makeInput(24, 'calm_outdoors', { feelsLikeC: 9 }),
    assert(r) {
      expect(r.intent.insulationWarmth).toBeGreaterThanOrEqual(2);
    },
  },
  {
    id: 'G15', title: 'Øvre alder blandet regndag',
    input: makeInput(24, 'mixed_day', { feelsLikeC: 6, precipMmH: 2, symbolCode: 'rain' }),
    assert(r) {
      expect(hasRole(r, 'shell_fullbody')).toBe(true);
      const base = r.garments.find((g) => g.role.startsWith('base'));
      expect(base?.material).not.toBe('cotton'); // fuktrobust base
    },
  },
  {
    id: 'G16', title: 'Øvre alder vogn ved behov',
    input: makeInput(24, 'stroller_awake', { feelsLikeC: 3 }),
    assert(r) {
      expect(hasRole(r, 'insulated_fullbody')).toBe(true);
    },
  },
  {
    id: 'G17', title: 'Før skogrensen',
    input: makeInput(8, 'awake_low_mobility', { feelsLikeC: 8 }),
    assert(r) {
      const foot = r.garments.filter((g) => g.role === 'footwear');
      expect(foot.length).toBeGreaterThan(0);
      expect(foot.every((g) => g.conceptId === 'footwear-socks')).toBe(true);
    },
  },
  {
    id: 'G18', title: 'Over første skogrense',
    input: makeInput(9, 'awake_low_mobility', { feelsLikeC: 8 }),
    assert(r) {
      expect(r.garments.some((g) => g.variantId === 'footwear-blend-1-soft')).toBe(true);
    },
  },
  {
    id: 'G19', title: 'Siste myke fottøygruppe',
    input: makeInput(15, 'active_play', { feelsLikeC: 0 }),
    assert(r) {
      const outer = r.garments.filter((g) => g.conceptId === 'footwear-outer');
      expect(outer.every((g) => g.variantId === 'footwear-blend-1-soft')).toBe(true);
    },
  },
  {
    id: 'G20', title: 'Første ordinære skogruppe',
    input: makeInput(16, 'active_play', { feelsLikeC: 0 }),
    assert(r) {
      expect(r.garments.some((g) => g.variantId === 'footwear-syn-3-winter')).toBe(true);
    },
  },
  {
    id: 'G21', title: 'Øvre støttet alder',
    input: makeInput(24, 'mixed_day', { feelsLikeC: 5 }),
    assert(r) {
      expect(r.ageStage).toBe('young_toddler');
      expect(r.garments.length).toBeGreaterThan(0);
    },
  },
  // G22 (25 mnd → unsupported_age) og G35 (ugyldig situasjon) testes som
  // feilscenarioer i gold-scenarios.test.ts — de har ingen RecommendationV2.
  {
    id: 'G23', title: 'Ullfri kulde',
    input: makeInput(18, 'stroller_awake', { feelsLikeC: -4 }, { materialPreference: 'avoid_wool' }),
    assert(r) {
      expect(materials(r)).not.toContain('wool');
      expect(r.explanations.some((e) => e.code === 'WOOL_AVOIDED')).toBe(true);
    },
  },
  {
    id: 'G24', title: 'Ullfri aktiv regndag',
    input: makeInput(20, 'active_play', { feelsLikeC: 6, precipMmH: 1.5 }, { materialPreference: 'avoid_wool' }),
    assert(r) {
      expect(materials(r)).not.toContain('wool');
      const base = r.garments.find((g) => g.role.startsWith('base'));
      expect(base?.material).toBe('synthetic_wicking');
      expect(hasRole(r, 'shell_fullbody')).toBe(true);
    },
  },
  {
    id: 'G25', title: 'Ullpreferanse kaldt/tørt',
    input: makeInput(18, 'stroller_awake', { feelsLikeC: -4 }, { materialPreference: 'prefer_wool' }),
    assert(r) {
      expect(r.garments.find((g) => g.role === 'base_fullbody')?.material).toBe('wool');
      // Funksjonelt ytterlag beholdes — aldri ull som isolert dress.
      const ins = r.garments.find((g) => g.role === 'insulated_fullbody');
      expect(ins).toBeDefined();
      expect(ins?.material).not.toBe('wool');
    },
  },
  {
    id: 'G26', title: 'Ullpreferanse vått ytterlag',
    input: makeInput(20, 'mixed_day', { feelsLikeC: 5, precipMmH: 1.5 }, { materialPreference: 'prefer_wool' }),
    assert(r) {
      const shell = r.garments.find((g) => g.role === 'shell_fullbody');
      expect(shell?.material).toBe('shell'); // preferansen overstyres av funksjon
    },
  },
  {
    id: 'G27', title: 'Balansert aktiv og svett',
    input: makeInput(20, 'active_play', { feelsLikeC: 8, humidity: 85 }),
    assert(r) {
      const base = r.garments.find((g) => g.role.startsWith('base'));
      expect(['synthetic_wicking', 'wool']).toContain(base?.material);
      expect(base?.material).not.toBe('cotton');
    },
  },
  {
    id: 'G28', title: 'Balansert varm og rolig',
    input: makeInput(20, 'calm_outdoors', { feelsLikeC: 21 }),
    assert(r) {
      const base = r.garments.find((g) => g.role.startsWith('base'));
      expect(base?.material).toBe('cotton'); // gyldig — ingen moralsk rangering
    },
  },
  {
    id: 'G29', title: 'Bilstol etter tur',
    input: makeInput(12, 'stroller_awake', { feelsLikeC: 1 }, { carSeat: true }),
    assert(r) {
      // Ingen tykk dress (varme ≥ 3) under selene; kjørepose beskrives som løsning.
      const thick = r.garments.filter((g) => g.role === 'insulated_fullbody' && g.variantId.includes('-3') || g.variantId.includes('-4'));
      expect(thick.filter((g) => g.role === 'insulated_fullbody')).toEqual([]);
      expect(r.equipment.some((e) => e.id === 'car_seat_pouch')).toBe(true);
    },
  },
  {
    id: 'G30', title: 'Kalibrering mot varmere',
    input: makeInput(20, 'stroller_awake', { feelsLikeC: -2 }, { childCalibration: 1 }),
    assert(r) {
      expect(r.explanations.some((e) => e.code === 'CALIBRATION_WARMER')).toBe(true);
      expect(r.intent.insulationWarmth).toBeLessThanOrEqual(4);
    },
  },
  {
    id: 'G31', title: 'Kalibrering mot kjøligere',
    input: makeInput(20, 'stroller_awake', { feelsLikeC: 12, precipMmH: 1, symbolCode: 'rain' }, { childCalibration: -1 }),
    assert(r) {
      expect(r.explanations.some((e) => e.code === 'CALIBRATION_COOLER')).toBe(true);
      expect(hasRole(r, 'shell_fullbody')).toBe(true); // nødvendig skall fjernes ikke
    },
  },
  {
    id: 'G32', title: 'Ekstrem varme spedbarn',
    input: makeInput(5, 'stroller_awake', { feelsLikeC: 29, symbolCode: 'clearsky_day' }),
    assert(r) {
      expect(['HIGH', 'CRITICAL']).toContain(r.severity);
      expect(r.safetyFlags.some((f) => f.code === 'SB-7')).toBe(true);
      expect(hasRole(r, 'mid_')).toBe(false);
    },
  },
  {
    id: 'G33', title: 'Ekstrem kulde spedbarn',
    input: makeInput(5, 'stroller_awake', { feelsLikeC: -18 }),
    assert(r) {
      expect(['HIGH', 'CRITICAL']).toContain(r.severity);
      expect(r.safetyFlags.some((f) => f.code === 'HB-V2-EXTREME-COLD')).toBe(true);
      expect(r.safetyFlags.some((f) => f.code === 'SB-8')).toBe(true);
    },
  },
  {
    id: 'G34', title: 'Manglende illustrasjon',
    input: makeInput(20, 'active_play', { feelsLikeC: 6 }, { materialPreference: 'avoid_wool' }),
    assert(r) {
      // Nye syntetvarianter har nøytral fallback (null) — aldri feil ullillustrasjon.
      const synthetic = r.garments.filter((g) => g.material === 'synthetic_wicking' || g.material === 'fleece');
      expect(synthetic.length).toBeGreaterThan(0);
      for (const g of synthetic) {
        expect(g.illustrationId === null || !/ull|wool/i.test(g.illustrationId)).toBe(true);
      }
    },
  },
  {
    id: 'G36', title: 'Determinisme',
    input: makeInput(14, 'stroller_awake', { feelsLikeC: -3, windMs: 6, precipMmH: 0.7 }),
    assert() {
      // Selve 100-kjøringssjekken ligger i testfilen (trenger recommendV2-referansen).
    },
  },
];
