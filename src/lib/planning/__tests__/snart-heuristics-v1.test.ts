import { describe, expect, it } from 'vitest';
import { evaluateSnartHeuristics, SNART_RULESET_VERSION } from '../snart-heuristics-v1';

describe('Snart product heuristics', () => {
  it('keeps Babyora thresholds and stable concepts explicit', () => {
    expect(SNART_RULESET_VERSION).toBe('babyora-snart-heuristics@2');
    const rows = evaluateSnartHeuristics({ targetMeanTemperatureC: 7, targetPrecipitationMm: 50 });
    expect(rows.map((row) => row.group)).toEqual(['check_first', 'check_first', 'available_if_needed', 'check_first', 'available_if_needed', 'check_first']);
    expect(rows.every((row) => row.policyOwner === 'Babyora' && row.evidenceType === 'product_heuristic')).toBe(true);
  });
});
