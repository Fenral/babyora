import { describe, expect, it } from 'vitest';
import { SNART_COPY } from '../snart-copy.nb';
import {
  evaluateSnartHeuristics,
  SNART_RULESET_VERSION,
} from '../snart-heuristics-v1';

const EPSILON = 1e-9;
const CONCEPT_ORDER = [
  'snart.base_layer',
  'snart.mid_layer',
  'snart.insulated_outer',
  'snart.cold_headwear',
  'snart.handwear',
  'snart.weather_shell',
] as const;

const EXPECTED_RULE_COPY = {
  'SNART-H2-BASE-CHECK': 'Sjekk om dere har et lett innerlag tilgjengelig for perioden.',
  'SNART-H2-BASE-AVAILABLE': 'Et lett innerlag kan være greit å finne fram dersom perioden blir kjøligere enn det historiske mønsteret.',
  'SNART-H2-BASE-NOT-HIGHLIGHTED': 'Innerlag er ikke fremhevet av denne historiske perioden.',
  'SNART-H2-MID-CHECK': 'Sjekk om dere har et mellomlag tilgjengelig for perioden.',
  'SNART-H2-MID-AVAILABLE': 'Et mellomlag kan være greit å finne fram dersom perioden blir kjøligere enn det historiske mønsteret.',
  'SNART-H2-MID-NOT-HIGHLIGHTED': 'Mellomlag er ikke fremhevet av denne historiske perioden.',
  'SNART-H2-OUTER-CHECK': 'Sjekk om dere har et isolert ytterlag tilgjengelig for perioden.',
  'SNART-H2-OUTER-AVAILABLE': 'Et isolert ytterlag kan være greit å ha tilgjengelig dersom perioden blir kjøligere enn det historiske mønsteret.',
  'SNART-H2-OUTER-NOT-HIGHLIGHTED': 'Isolert ytterlag er ikke fremhevet av denne historiske perioden.',
  'SNART-H2-HEAD-CHECK': 'Sjekk om dere har et hodeplagg tilgjengelig for perioden.',
  'SNART-H2-HEAD-AVAILABLE': 'Et hodeplagg kan være greit å ha tilgjengelig dersom perioden blir kjøligere enn det historiske mønsteret.',
  'SNART-H2-HEAD-NOT-HIGHLIGHTED': 'Hodeplagg er ikke fremhevet av denne historiske perioden.',
  'SNART-H2-HAND-CHECK': 'Sjekk om dere har håndplagg tilgjengelig for perioden.',
  'SNART-H2-HAND-AVAILABLE': 'Håndplagg kan være greit å ha tilgjengelig dersom perioden blir kjøligere enn det historiske mønsteret.',
  'SNART-H2-HAND-NOT-HIGHLIGHTED': 'Håndplagg er ikke fremhevet av denne historiske perioden.',
  'SNART-H2-WET-CHECK': 'Historisk nedbørsmengde er høyere for perioden. Sjekk om et værbeskyttende ytterlag er tilgjengelig.',
  'SNART-H2-WET-AVAILABLE': 'Et værbeskyttende ytterlag kan være greit å ha tilgjengelig ut fra historisk nedbørsmengde.',
  'SNART-H2-WET-NOT-HIGHLIGHTED': 'Værbeskyttende ytterlag er ikke fremhevet av periodens historiske nedbørsmengde.',
} as const;

type ExpectedTemperatureRows = readonly [
  base: string,
  mid: string,
  outer: string,
  head: string,
  hand: string,
];

const temperatureCases: ReadonlyArray<readonly [number, ExpectedTemperatureRows]> = [
  [2 - EPSILON, ['SNART-H2-BASE-CHECK', 'SNART-H2-MID-CHECK', 'SNART-H2-OUTER-CHECK', 'SNART-H2-HEAD-CHECK', 'SNART-H2-HAND-CHECK']],
  [2, ['SNART-H2-BASE-CHECK', 'SNART-H2-MID-CHECK', 'SNART-H2-OUTER-CHECK', 'SNART-H2-HEAD-CHECK', 'SNART-H2-HAND-CHECK']],
  [2 + EPSILON, ['SNART-H2-BASE-CHECK', 'SNART-H2-MID-CHECK', 'SNART-H2-OUTER-AVAILABLE', 'SNART-H2-HEAD-CHECK', 'SNART-H2-HAND-AVAILABLE']],
  [7 - EPSILON, ['SNART-H2-BASE-CHECK', 'SNART-H2-MID-CHECK', 'SNART-H2-OUTER-AVAILABLE', 'SNART-H2-HEAD-CHECK', 'SNART-H2-HAND-AVAILABLE']],
  [7, ['SNART-H2-BASE-CHECK', 'SNART-H2-MID-CHECK', 'SNART-H2-OUTER-AVAILABLE', 'SNART-H2-HEAD-CHECK', 'SNART-H2-HAND-AVAILABLE']],
  [7 + EPSILON, ['SNART-H2-BASE-CHECK', 'SNART-H2-MID-AVAILABLE', 'SNART-H2-OUTER-NOT-HIGHLIGHTED', 'SNART-H2-HEAD-AVAILABLE', 'SNART-H2-HAND-NOT-HIGHLIGHTED']],
  [12 - EPSILON, ['SNART-H2-BASE-CHECK', 'SNART-H2-MID-AVAILABLE', 'SNART-H2-OUTER-NOT-HIGHLIGHTED', 'SNART-H2-HEAD-AVAILABLE', 'SNART-H2-HAND-NOT-HIGHLIGHTED']],
  [12, ['SNART-H2-BASE-CHECK', 'SNART-H2-MID-AVAILABLE', 'SNART-H2-OUTER-NOT-HIGHLIGHTED', 'SNART-H2-HEAD-AVAILABLE', 'SNART-H2-HAND-NOT-HIGHLIGHTED']],
  [12 + EPSILON, ['SNART-H2-BASE-AVAILABLE', 'SNART-H2-MID-NOT-HIGHLIGHTED', 'SNART-H2-OUTER-NOT-HIGHLIGHTED', 'SNART-H2-HEAD-NOT-HIGHLIGHTED', 'SNART-H2-HAND-NOT-HIGHLIGHTED']],
  [16 - EPSILON, ['SNART-H2-BASE-AVAILABLE', 'SNART-H2-MID-NOT-HIGHLIGHTED', 'SNART-H2-OUTER-NOT-HIGHLIGHTED', 'SNART-H2-HEAD-NOT-HIGHLIGHTED', 'SNART-H2-HAND-NOT-HIGHLIGHTED']],
  [16, ['SNART-H2-BASE-AVAILABLE', 'SNART-H2-MID-NOT-HIGHLIGHTED', 'SNART-H2-OUTER-NOT-HIGHLIGHTED', 'SNART-H2-HEAD-NOT-HIGHLIGHTED', 'SNART-H2-HAND-NOT-HIGHLIGHTED']],
  [16 + EPSILON, ['SNART-H2-BASE-NOT-HIGHLIGHTED', 'SNART-H2-MID-NOT-HIGHLIGHTED', 'SNART-H2-OUTER-NOT-HIGHLIGHTED', 'SNART-H2-HEAD-NOT-HIGHLIGHTED', 'SNART-H2-HAND-NOT-HIGHLIGHTED']],
];

const precipitationCases = [
  [20 - EPSILON, 'SNART-H2-WET-NOT-HIGHLIGHTED'],
  [20, 'SNART-H2-WET-AVAILABLE'],
  [20 + EPSILON, 'SNART-H2-WET-AVAILABLE'],
  [50 - EPSILON, 'SNART-H2-WET-AVAILABLE'],
  [50, 'SNART-H2-WET-CHECK'],
  [50 + EPSILON, 'SNART-H2-WET-CHECK'],
] as const;

describe('Snart product heuristics', () => {
  it('locks all eighteen exact Norwegian rule sentences', () => {
    expect(SNART_RULESET_VERSION).toBe('babyora-snart-heuristics@2');
    expect(SNART_COPY.rules).toEqual(EXPECTED_RULE_COPY);
    expect(Object.keys(SNART_COPY.rules)).toHaveLength(18);
  });

  it.each(temperatureCases)('selects exact temperature winners at %s °C', (temperature, expectedRuleIds) => {
    const rows = evaluateSnartHeuristics({
      targetMeanTemperatureC: temperature,
      targetPrecipitationMm: 30,
    });

    expect(rows.slice(0, 5).map((row) => row.ruleId)).toEqual(expectedRuleIds);
    expect(rows[5].ruleId).toBe('SNART-H2-WET-AVAILABLE');
  });

  it.each(precipitationCases)('selects exact precipitation winner at %s mm', (precipitation, expectedRuleId) => {
    const rows = evaluateSnartHeuristics({
      targetMeanTemperatureC: 10,
      targetPrecipitationMm: precipitation,
    });

    expect(rows[5].ruleId).toBe(expectedRuleId);
  });

  it('returns one immutable, ordered, copy-bound winner per concept', () => {
    const rows = evaluateSnartHeuristics({
      targetMeanTemperatureC: 7,
      targetPrecipitationMm: 50,
    });

    expect(rows.map((row) => row.conceptId)).toEqual(CONCEPT_ORDER);
    expect(new Set(rows.map((row) => row.conceptId)).size).toBe(CONCEPT_ORDER.length);
    expect(rows.map((row) => row.group)).toEqual([
      'check_first',
      'check_first',
      'available_if_needed',
      'check_first',
      'available_if_needed',
      'check_first',
    ]);
    expect(rows.every((row) => (
      row.policyOwner === 'Babyora'
      && row.evidenceType === 'product_heuristic'
      && row.copy === EXPECTED_RULE_COPY[row.ruleId as keyof typeof EXPECTED_RULE_COPY]
      && Object.isFrozen(row)
    ))).toBe(true);
    expect(Object.isFrozen(rows)).toBe(true);
  });

  it('fails closed for non-finite signals', () => {
    for (const invalid of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(evaluateSnartHeuristics({
        targetMeanTemperatureC: invalid,
        targetPrecipitationMm: 30,
      })).toEqual([]);
      expect(evaluateSnartHeuristics({
        targetMeanTemperatureC: 10,
        targetPrecipitationMm: invalid,
      })).toEqual([]);
    }
  });
});
