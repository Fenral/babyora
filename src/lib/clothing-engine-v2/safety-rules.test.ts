import { describe, expect, it } from 'vitest';
import {
  SAFETY_RULESET_VERSION,
  SAFETY_RULES,
  SAFETY_RULE_IDS,
  SAFETY_SOURCES,
  UnreviewedSafetyRulesError,
  assertSafetyRulesApprovedForProduction,
  buildSafetyFlag,
  validateSafetyRuleRegistry,
  type SafetyRuleDefinition,
} from './safety-rules.js';

describe('Motor 2.0 safety rule register', () => {
  it('has a stable version and one unique definition for every emitted rule ID', () => {
    expect(SAFETY_RULESET_VERSION).toMatch(/^v\d+\.\d+\.\d+$/);
    expect(new Set(SAFETY_RULE_IDS).size).toBe(SAFETY_RULE_IDS.length);
    expect(Object.keys(SAFETY_RULES)).toEqual(SAFETY_RULE_IDS);

    for (const ruleId of SAFETY_RULE_IDS) {
      expect(SAFETY_RULES[ruleId].id).toBe(ruleId);
      expect(SAFETY_RULES[ruleId].rulesetVersion).toBe(SAFETY_RULESET_VERSION);
    }
  });

  it('keeps every rule non-overridable and immutable at runtime', () => {
    expect(Object.isFrozen(SAFETY_RULES)).toBe(true);

    for (const rule of Object.values(SAFETY_RULES)) {
      expect(rule.nonOverrideable).toBe(true);
      expect(Object.isFrozen(rule)).toBe(true);
      expect(Object.isFrozen(rule.sourceIds)).toBe(true);
      expect(Object.isFrozen(rule.countryReview)).toBe(true);
    }
  });

  it('links every rule to at least one registered evidence source, not policy alone', () => {
    expect(() => validateSafetyRuleRegistry(Object.values(SAFETY_RULES), SAFETY_SOURCES)).not.toThrow();

    for (const rule of Object.values(SAFETY_RULES)) {
      expect(rule.sourceIds.length).toBeGreaterThan(0);
      expect(rule.sourceIds.some((sourceId) => SAFETY_SOURCES[sourceId].kind !== 'product-policy')).toBe(true);
      for (const sourceId of rule.sourceIds) {
        expect(SAFETY_SOURCES[sourceId]).toBeDefined();
      }
    }
  });

  it('keeps source records identifiable and external references on HTTPS', () => {
    for (const [sourceId, sourceRecord] of Object.entries(SAFETY_SOURCES)) {
      expect(sourceRecord.id).toBe(sourceId);
      expect(sourceRecord.title.trim()).not.toBe('');
      expect(sourceRecord.publisher.trim()).not.toBe('');
      if (sourceRecord.kind === 'product-policy') {
        expect(sourceRecord.url).toBeNull();
      } else {
        expect(sourceRecord.url).toMatch(/^https:\/\//);
      }
    }
  });

  it('rejects a rule with no source before production use', () => {
    const invalid = [{
      ...SAFETY_RULES['HB-1'],
      sourceIds: [],
    }] as unknown as SafetyRuleDefinition[];

    expect(() => validateSafetyRuleRegistry(invalid, SAFETY_SOURCES)).toThrow(/HB-1.*source/i);
  });

  it('rejects a rule that points to an unknown source', () => {
    const invalid = [{
      ...SAFETY_RULES['HB-1'],
      sourceIds: ['UNKNOWN-SOURCE'],
    }] as unknown as SafetyRuleDefinition[];

    expect(() => validateSafetyRuleRegistry(invalid, SAFETY_SOURCES)).toThrow(/UNKNOWN-SOURCE/);
  });

  it('builds flag severity and sources only from the canonical definition', () => {
    for (const ruleId of SAFETY_RULE_IDS) {
      const flag = buildSafetyFlag(ruleId, 'Testmelding', 'sikkerhet');
      expect(flag).toEqual({
        code: ruleId,
        message: 'Testmelding',
        sources: [...SAFETY_RULES[ruleId].sourceIds],
        severity: SAFETY_RULES[ruleId].severity,
        category: 'sikkerhet',
      });
    }
  });

  it.each(['NO', 'SE', 'DK'] as const)(
    'blocks %s production use while any V2 rule is pending external review',
    (country) => {
      expect(() => assertSafetyRulesApprovedForProduction(country)).toThrow(UnreviewedSafetyRulesError);

      try {
        assertSafetyRulesApprovedForProduction(country);
      } catch (error) {
        expect(error).toMatchObject({
          code: 'unreviewed_country_rules',
          country,
          ruleIds: SAFETY_RULE_IDS,
        });
      }
    },
  );
});
