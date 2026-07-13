import { describe, expect, it } from 'vitest';
import { PAGE_CATALOG, RUBRIC_VERSION } from './config';
import { renderNextPrompt, renderReport } from './report';
import type { ScoredAudit, ScoredPage } from './types';

const pages = PAGE_CATALOG.map((definition, index): ScoredPage => ({
  pageId: definition.id, label: definition.label, appWeight: definition.appWeight,
  score: 80 - index, delta: null,
  dimensionScores: { taskClarity: 80, navigationInteraction: 80, visualCraft: 80, colorTemperature: 80, copyTrust: 80, productValue: 80, accessibilityRobustness: 80 },
  strengths: [{ title: 'Styrke', detail: 'Godt hierarki', evidence: 'Skjermbilde', evidenceType: 'rendered' }],
  issues: [{ title: `Problem ${index}`, detail: 'Uklar verdi', evidence: 'Skjermbilde', evidenceType: 'rendered', severity: index < 2 ? 'high' : 'medium', impact: 'Svekker forståelse', recommendation: 'Gjør utfallet konkret' }],
  commercialDiagnosis: 'Bidrar til verdi', confidence: 'high', confidenceReason: 'Komplett capture',
}));

const fixture: ScoredAudit = {
  rubricVersion: RUBRIC_VERSION, complete: true, totalScore: 74, provisionalScore: 74,
  unweightedMean: 74, highestPage: { id: 'onboarding', label: 'Onboarding', score: 80 },
  lowestPage: { id: 'paywall', label: 'Betalingsvegg', score: 68 },
  issueCounts: { critical: 0, high: 2, medium: 11, low: 0 },
  productDiagnosis: 'God grunnmur', primaryPurchaseBlocker: 'Uklart Plus-utfall',
  crossScreenFindings: [], missingPages: [], pages,
};

describe('audit output', () => {
  it('renders totals and every page', () => {
    const report = renderReport(fixture);
    expect(report).toContain('Vektet totalscore');
    for (const page of PAGE_CATALOG) expect(report).toContain(`## ${page.label}`);
  });

  it('limits next prompt to five initiatives', () => {
    const prompt = renderNextPrompt(fixture);
    expect((prompt.match(/^### Tiltak /gm) ?? []).length).toBeLessThanOrEqual(5);
    expect(prompt).toContain('Dette skal bevares');
    expect(prompt).toContain('Ikke gjør');
  });
});
