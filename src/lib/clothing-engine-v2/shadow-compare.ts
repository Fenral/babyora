/**
 * Motor 2.0 — shadow-sammenligning (spec §19/§9 i valideringsdokumentet).
 *
 * Sammenligner legacy- og V2-resultatet for samme input og klassifiserer:
 *   equivalent            samme funksjonelle dekning og sikkerhetsnivå
 *   expected_improvement  bevisst forbedring (materialvalg, aldersform …)
 *   needs_review          uforklart tap av varme/beskyttelse/alvorlighet
 *   legacy_bug_preserved  kjent legacy-feil (settes manuelt i review-filen)
 *
 * Et shadow-resultat VISES ALDRI — selectVisibleResult returnerer alltid
 * legacy (spec §17: «Motorene er uenige under shadow mode → bruk dagens
 * motor i produksjon»).
 */

import { toLegacyRecommendation } from './legacy-adapter.js';
import type { Recommendation } from '../wool-layers/types.js';
import type { RecommendationV2, Severity } from './types.js';

export type ShadowStatus = 'equivalent' | 'expected_improvement' | 'needs_review' | 'legacy_bug_preserved';

export type ShadowComparison = {
  status: ShadowStatus;
  reasons: string[];
  details: {
    sameFingerprintContent: boolean;
    legacyCategories: string[];
    v2Categories: string[];
    legacySeverity: Severity;
    v2Severity: Severity;
  };
};

const SEVERITY_RANK: Record<Severity, number> = {
  NONE: 0, LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4,
};

function hasRainProtection(rec: Recommendation): boolean {
  return rec.layers.some((l) => l.items.some((i) => /regn|vanntett/i.test(i)));
}

export function compareShadow(legacy: Recommendation, v2: RecommendationV2): ShadowComparison {
  const v2AsLegacy = toLegacyRecommendation(v2);
  const reasons: string[] = [];

  const legacyCategories = legacy.layers.filter((l) => l.items.length > 0).map((l) => l.category);
  const v2Categories = v2AsLegacy.layers.map((l) => l.category);

  // Tap av regn-/vannbeskyttelse er alltid review-pliktig.
  if (hasRainProtection(legacy) && !hasRainProtection(v2AsLegacy)) {
    reasons.push('V2 mangler regn-/vannbeskyttelse som legacy har');
  }

  // Alvorlighetsfall er alltid review-pliktig.
  const legacySeverity = (legacy.severity ?? 'NONE') as Severity;
  if (SEVERITY_RANK[v2.severity] < SEVERITY_RANK[legacySeverity]) {
    reasons.push(`Alvorlighet falt fra ${legacySeverity} til ${v2.severity}`);
  }

  // Tapte kles-kategorier (utstyr vurderes separat — kan flyttes bevisst).
  for (const cat of ['innerst', 'yttertoy'] as const) {
    if (legacyCategories.includes(cat) && !v2Categories.includes(cat)) {
      reasons.push(`V2 mangler kategorien ${cat}`);
    }
  }

  const sameCategories =
    legacyCategories.length === v2Categories.length
    && legacyCategories.every((c) => v2Categories.includes(c));

  const status: ShadowStatus = reasons.length > 0
    ? 'needs_review'
    : sameCategories
      ? 'equivalent'
      : 'expected_improvement';

  if (status === 'expected_improvement') {
    reasons.push('Kategoridekningen avviker bevisst (material-/aldersform-forbedring) — krever produktbeslutning i review-filen');
  }

  return {
    status,
    reasons,
    details: {
      sameFingerprintContent: sameCategories,
      legacyCategories,
      v2Categories,
      legacySeverity,
      v2Severity: v2.severity,
    },
  };
}

/** Shadow-resultatet vises aldri — alltid legacy i produksjon. */
export function selectVisibleResult<L, V>(pair: { legacy: L; v2: V }): L {
  return pair.legacy;
}
