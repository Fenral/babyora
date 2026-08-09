import { finalizeSafety } from './finalize-safety.js';
import { recommend } from './recommend.js';
import type { SafetyFlag, Severity } from './safety.js';
import { bandForTemp } from './tables.js';
import { buildRecommendationSummary } from './recommendation-summary.js';
import type {
  LayerCategory,
  Recommendation,
  RecommendInput,
} from './types.js';

const CATEGORY_ORDER: readonly LayerCategory[] = [
  'innerst',
  'mellomlag',
  'yttertoy',
  'ekstra',
  'utstyr',
];

const SEVERITY_RANK: Readonly<Record<Severity, number>> = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

export type RecommendationConsistencyIssueCode =
  | 'activity-mismatch'
  | 'temp-band-mismatch'
  | 'duplicate-category'
  | 'category-order'
  | 'empty-layer'
  | 'blank-item'
  | 'duplicate-item'
  | 'notes-mismatch'
  | 'summary-mismatch'
  | 'duplicate-flag'
  | 'missing-safety-flag'
  | 'safety-provenance-mismatch'
  | 'severity-mismatch'
  | 'not-finalized';

export type RecommendationConsistencyIssue = Readonly<{
  code: RecommendationConsistencyIssueCode;
  detail: string;
}>;

/**
 * Safety truth captured from the finalized result before it crosses a mutable
 * presentation/session boundary. Layers are deliberately excluded: the
 * validator must accept legitimate swaps without replaying their provenance.
 */
export type RecommendationSafetyProvenance = Readonly<{
  safetyFlags: readonly SafetyFlag[];
  severity: Severity;
}>;

function highestSeverity(flags: readonly SafetyFlag[]): Severity {
  let highest: Severity = 'NONE';
  for (const flag of flags) {
    if (SEVERITY_RANK[flag.severity] > SEVERITY_RANK[highest]) {
      highest = flag.severity;
    }
  }
  return highest;
}

function sameData(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function noteIdentity(category: string, message: string): string {
  return `${category}\u0000${message}`;
}

/** Copy-free projection: locale may alter messages, never these decisions. */
export function canonicalRecommendationDecision(rec: Recommendation) {
  return {
    activity: rec.activity,
    tempBand: rec.tempBand,
    layers: rec.layers.map((layer) => ({
      category: layer.category,
      items: [...layer.items],
    })),
    safetyFlags: (rec.safetyFlags ?? []).map((flag) => ({
      code: flag.code,
      severity: flag.severity,
      category: flag.category,
      sources: [...flag.sources],
      displayInSheet: flag.displayInSheet ?? true,
    })),
    severity: rec.severity ?? 'NONE',
  } as const;
}

/**
 * Audits structural truth and reuses finalizeSafety for safety truth. It does
 * not duplicate or add any clinical threshold.
 *
 * Trust boundary: callers must retain the finalized safety projection before
 * a result crosses a mutable override/swap/session boundary. A canonical
 * replay supplies only the ordinary engine-note allow-list; it is never used
 * as the expected recommendation because legitimate returned layers may
 * differ. Every additional `sikkerhet` note must retain its matching flag.
 */
export function validateRecommendationConsistency(
  input: RecommendInput,
  rec: Recommendation,
  expectedSafety: RecommendationSafetyProvenance,
): RecommendationConsistencyIssue[] {
  const issues: RecommendationConsistencyIssue[] = [];
  const add = (code: RecommendationConsistencyIssueCode, detail: string): void => {
    issues.push({ code, detail });
  };

  if (rec.activity !== input.activity) {
    add('activity-mismatch', `${rec.activity} != ${input.activity}`);
  }
  const expectedBand = bandForTemp(input.weather.feelsLikeC);
  if (rec.tempBand !== expectedBand) {
    add('temp-band-mismatch', `${rec.tempBand} != ${expectedBand}`);
  }

  const seenCategories = new Set<LayerCategory>();
  const seenItems = new Set<string>();
  let previousCategoryIndex = -1;
  for (const layer of rec.layers) {
    const categoryIndex = CATEGORY_ORDER.indexOf(layer.category);
    if (seenCategories.has(layer.category)) {
      add('duplicate-category', layer.category);
    }
    if (categoryIndex < previousCategoryIndex) {
      add('category-order', layer.category);
    }
    previousCategoryIndex = Math.max(previousCategoryIndex, categoryIndex);
    seenCategories.add(layer.category);

    if (layer.items.length === 0) add('empty-layer', layer.category);
    for (const item of layer.items) {
      if (item.trim().length === 0) add('blank-item', layer.category);
      if (seenItems.has(item)) add('duplicate-item', item);
      seenItems.add(item);
    }
  }

  const noteMessages = rec.structuredNotes.map((note) => note.message);
  if (!sameData(rec.notes, noteMessages)) {
    add('notes-mismatch', 'notes must mirror structuredNotes messages');
  }

  const expectedSummary = buildRecommendationSummary(input, rec.layers);
  if (rec.summary !== expectedSummary) {
    add('summary-mismatch', 'summary must describe final layers');
  }

  const flags = rec.safetyFlags ?? [];
  if (
    !sameData(flags, expectedSafety.safetyFlags)
    || (rec.severity ?? 'NONE') !== expectedSafety.severity
  ) {
    add(
      'safety-provenance-mismatch',
      'returned safety flags and severity must match finalized safety provenance',
    );
  }
  const seenFlags = new Set<string>();
  const flagNotes = new Set<string>();
  for (const flag of flags) {
    const identity = `${flag.code}\u0000${flag.message}`;
    if (seenFlags.has(identity)) add('duplicate-flag', flag.code);
    seenFlags.add(identity);
    flagNotes.add(noteIdentity(flag.category, flag.message));
  }

  const canonical = recommend(input);
  const canonicalFlagNotes = new Set(
    (canonical.safetyFlags ?? []).map((flag) => noteIdentity(flag.category, flag.message)),
  );
  const ordinaryCanonicalNotes = new Set(
    canonical.structuredNotes
      .map((note) => noteIdentity(note.category, note.message))
      .filter((identity) => !canonicalFlagNotes.has(identity)),
  );
  for (const note of rec.structuredNotes) {
    if (note.category !== 'sikkerhet') continue;
    const identity = noteIdentity(note.category, note.message);
    if (!ordinaryCanonicalNotes.has(identity) && !flagNotes.has(identity)) {
      add('missing-safety-flag', note.message);
    }
  }
  const expectedSeverity = highestSeverity(flags);
  if ((rec.severity ?? 'NONE') !== expectedSeverity) {
    add('severity-mismatch', `${rec.severity ?? 'NONE'} != ${expectedSeverity}`);
  }

  const finalized = finalizeSafety(
    input,
    rec.layers,
    rec.structuredNotes,
    flags,
  );
  if (!sameData(finalized.layers, rec.layers)) {
    add('not-finalized', 'final safety boundary changes the returned layers');
  }

  return issues;
}
