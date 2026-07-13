import { PAGE_BY_ID, PAGE_CATALOG, RUBRIC, RUBRIC_VERSION } from './config';
import type {
  AuditAnalysis, AuditFinding, AuditIssue, Confidence, EvidenceType,
  PageAnalysis, PageId, ScoredAudit, ScoredPage, Severity,
} from './types';

const pageIds = new Set(PAGE_CATALOG.map((page) => page.id));
const evidenceTypes = new Set<EvidenceType>(['rendered', 'repository', 'inference', 'uncertainty']);
const severities = new Set<Severity>(['critical', 'high', 'medium', 'low']);
const confidences = new Set<Confidence>(['high', 'medium', 'low']);

function fail(message: string): never {
  throw new Error(`Audit validation failed: ${message}`);
}

function nonEmpty(value: unknown, path: string): string {
  if (typeof value !== 'string' || !value.trim()) fail(`${path} must be a non-empty string`);
  return value;
}

function validateFinding(value: AuditFinding, path: string): void {
  nonEmpty(value?.title, `${path}.title`);
  nonEmpty(value?.detail, `${path}.detail`);
  nonEmpty(value?.evidence, `${path}.evidence`);
  if (!evidenceTypes.has(value?.evidenceType)) fail(`${path}.evidenceType is invalid`);
}

function validateIssue(value: AuditIssue, path: string): void {
  validateFinding(value, path);
  if (!severities.has(value?.severity)) fail(`${path}.severity is invalid`);
  nonEmpty(value?.impact, `${path}.impact`);
  nonEmpty(value?.recommendation, `${path}.recommendation`);
}

function validatePage(page: PageAnalysis, index: number): void {
  const path = `pages[${index}]`;
  if (!pageIds.has(page?.pageId)) fail(`${path}.pageId is invalid`);
  for (const dimension of RUBRIC) {
    const value = page.dimensionScores?.[dimension.id];
    if (!Number.isInteger(value) || value < 1 || value > 100) fail(`${path}.dimensionScores.${dimension.id} must be an integer 1–100`);
  }
  if (!Array.isArray(page.strengths) || page.strengths.length < 1 || page.strengths.length > 3) fail(`${path}.strengths must contain 1–3 items`);
  page.strengths.forEach((item, itemIndex) => validateFinding(item, `${path}.strengths[${itemIndex}]`));
  if (!Array.isArray(page.issues) || page.issues.length > 3) fail(`${path}.issues must contain 0–3 items`);
  page.issues.forEach((item, itemIndex) => validateIssue(item, `${path}.issues[${itemIndex}]`));
  nonEmpty(page.commercialDiagnosis, `${path}.commercialDiagnosis`);
  if (!confidences.has(page.confidence)) fail(`${path}.confidence is invalid`);
  nonEmpty(page.confidenceReason, `${path}.confidenceReason`);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function pageScore(page: PageAnalysis): number {
  return round1(RUBRIC.reduce((sum, dimension) => sum + page.dimensionScores[dimension.id] * dimension.weight / 100, 0));
}

export function scoreAudit(analysis: AuditAnalysis, previous?: ScoredAudit | null): ScoredAudit {
  if (analysis?.rubricVersion !== RUBRIC_VERSION) fail(`rubricVersion must be ${RUBRIC_VERSION}`);
  nonEmpty(analysis.productDiagnosis, 'productDiagnosis');
  nonEmpty(analysis.primaryPurchaseBlocker, 'primaryPurchaseBlocker');
  if (!Array.isArray(analysis.crossScreenFindings)) fail('crossScreenFindings must be an array');
  analysis.crossScreenFindings.forEach((item, index) => validateIssue(item, `crossScreenFindings[${index}]`));
  if (!Array.isArray(analysis.pages) || analysis.pages.length === 0) fail('pages must contain at least one page');
  analysis.pages.forEach(validatePage);
  const unique = new Set(analysis.pages.map((page) => page.pageId));
  if (unique.size !== analysis.pages.length) fail('pageId values must be unique');

  const pages: ScoredPage[] = analysis.pages.map((page) => {
    const definition = PAGE_BY_ID.get(page.pageId)!;
    const score = pageScore(page);
    const previousPage = previous?.rubricVersion === RUBRIC_VERSION
      ? previous.pages.find((candidate) => candidate.pageId === page.pageId)
      : undefined;
    return { ...page, label: definition.label, appWeight: definition.appWeight, score, delta: previousPage ? round1(score - previousPage.score) : null };
  });
  const missingPages = PAGE_CATALOG.filter((definition) => !unique.has(definition.id)).map((definition) => definition.id);
  const presentWeight = pages.reduce((sum, page) => sum + page.appWeight, 0);
  const weighted = pages.reduce((sum, page) => sum + page.score * page.appWeight / 100, 0);
  const provisionalScore = round1(weighted / (presentWeight / 100));
  const complete = missingPages.length === 0;
  const sorted = [...pages].sort((a, b) => b.score - a.score);
  const issueCounts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const issue of [...analysis.crossScreenFindings, ...pages.flatMap((page) => page.issues)]) issueCounts[issue.severity] += 1;

  return {
    rubricVersion: RUBRIC_VERSION,
    complete,
    totalScore: complete ? round1(weighted) : null,
    provisionalScore,
    unweightedMean: round1(pages.reduce((sum, page) => sum + page.score, 0) / pages.length),
    highestPage: { id: sorted[0]!.pageId, label: sorted[0]!.label, score: sorted[0]!.score },
    lowestPage: { id: sorted.at(-1)!.pageId, label: sorted.at(-1)!.label, score: sorted.at(-1)!.score },
    issueCounts,
    productDiagnosis: analysis.productDiagnosis,
    primaryPurchaseBlocker: analysis.primaryPurchaseBlocker,
    crossScreenFindings: analysis.crossScreenFindings,
    missingPages: missingPages as PageId[],
    pages,
  };
}

