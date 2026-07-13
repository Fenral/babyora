export type PageId =
  | 'onboarding'
  | 'home'
  | 'outfit'
  | 'plan'
  | 'guide'
  | 'find-outfit'
  | 'clothing-library'
  | 'wardrobe'
  | 'tog'
  | 'warm-cold'
  | 'first-winter'
  | 'settings'
  | 'paywall';

export type AuditDimensionId =
  | 'taskClarity'
  | 'navigationInteraction'
  | 'visualCraft'
  | 'colorTemperature'
  | 'copyTrust'
  | 'productValue'
  | 'accessibilityRobustness';

export type EvidenceType = 'rendered' | 'repository' | 'inference' | 'uncertainty';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type Confidence = 'high' | 'medium' | 'low';

export interface AuditDimension {
  id: AuditDimensionId;
  label: string;
  weight: number;
  question: string;
}

export interface CaptureStateDefinition {
  id: string;
  label: string;
  required: boolean;
  actions: CaptureAction[];
  expectedText?: string;
}

export type CaptureAction =
  | { type: 'clear-storage' }
  | { type: 'reload' }
  | { type: 'tab'; name: string }
  | { type: 'text'; pattern: string }
  | { type: 'button'; pattern: string }
  | { type: 'wait'; milliseconds: number };

export interface PageDefinition {
  id: PageId;
  label: string;
  appWeight: number;
  role: string;
  states: CaptureStateDefinition[];
}

export interface CaptureResult {
  pageId: PageId;
  pageLabel: string;
  stateId: string;
  stateLabel: string;
  required: boolean;
  file: string | null;
  status: 'captured' | 'failed';
  error: string | null;
  capturedAt: string;
}

export interface CaptureManifest {
  runId: string;
  rubricVersion: string;
  baseUrl: string;
  viewport: { width: number; height: number };
  locale: string;
  createdAt: string;
  captures: CaptureResult[];
}

export interface AuditFinding {
  title: string;
  detail: string;
  evidence: string;
  evidenceType: EvidenceType;
}

export interface AuditIssue extends AuditFinding {
  severity: Severity;
  impact: string;
  recommendation: string;
}

export interface PageAnalysis {
  pageId: PageId;
  dimensionScores: Record<AuditDimensionId, number>;
  strengths: AuditFinding[];
  issues: AuditIssue[];
  commercialDiagnosis: string;
  confidence: Confidence;
  confidenceReason: string;
}

export interface AuditAnalysis {
  rubricVersion: string;
  productDiagnosis: string;
  primaryPurchaseBlocker: string;
  crossScreenFindings: AuditIssue[];
  pages: PageAnalysis[];
}

export interface ScoredPage extends PageAnalysis {
  label: string;
  appWeight: number;
  score: number;
  delta: number | null;
}

export interface ScoredAudit {
  rubricVersion: string;
  complete: boolean;
  totalScore: number | null;
  provisionalScore: number | null;
  unweightedMean: number;
  highestPage: { id: PageId; label: string; score: number };
  lowestPage: { id: PageId; label: string; score: number };
  issueCounts: Record<Severity, number>;
  productDiagnosis: string;
  primaryPurchaseBlocker: string;
  crossScreenFindings: AuditIssue[];
  missingPages: PageId[];
  pages: ScoredPage[];
}

