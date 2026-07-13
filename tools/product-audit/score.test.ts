import { describe, expect, it } from 'vitest';
import { PAGE_CATALOG, RUBRIC_VERSION } from './config';
import { scoreAudit } from './score';
import type { AuditAnalysis, PageAnalysis } from './types';

const page = (pageId: PageAnalysis['pageId']): PageAnalysis => ({
  pageId,
  dimensionScores: {
    taskClarity: 80, navigationInteraction: 80, visualCraft: 80,
    colorTemperature: 80, copyTrust: 80, productValue: 80,
    accessibilityRobustness: 80,
  },
  strengths: [{ title: 'Tydelig', detail: 'Klar verdi', evidence: 'Skjermbilde', evidenceType: 'rendered' }],
  issues: [], commercialDiagnosis: 'Troverdig verdi', confidence: 'high', confidenceReason: 'Komplett capture',
});

const valid: AuditAnalysis = {
  rubricVersion: RUBRIC_VERSION, productDiagnosis: 'Sterkt produkt', primaryPurchaseBlocker: 'Uklart Plus-skille',
  crossScreenFindings: [], pages: PAGE_CATALOG.map((item) => page(item.id)),
};

describe('audit scoring', () => {
  it('calculates weighted page and app scores', () => {
    const result = scoreAudit(valid);
    expect(result.pages[0]?.score).toBe(80);
    expect(result.totalScore).toBe(80);
    expect(result.complete).toBe(true);
  });

  it('withholds complete total when a weighted page is missing', () => {
    const result = scoreAudit({ ...valid, pages: valid.pages.slice(1) });
    expect(result.complete).toBe(false);
    expect(result.totalScore).toBeNull();
    expect(result.provisionalScore).toBe(80);
  });

  it('rejects scores outside 1 to 100', () => {
    const invalid = structuredClone(valid);
    invalid.pages[0]!.dimensionScores.taskClarity = 101;
    expect(() => scoreAudit(invalid)).toThrow(/validation/i);
  });
});
