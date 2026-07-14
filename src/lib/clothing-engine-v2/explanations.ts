/**
 * Motor 2.0 — forklaringer (spec §16).
 * Motoren produserer KUN stabile koder; all tekst ligger i i18n-filene og
 * oversettes i presentasjonslaget. Norsk copy unngår absolutte ord
 * («perfekt», «garantert», «alltid trygg») — testet.
 */

import type { Explanation, ExplanationCode } from './types.js';

/** Bygg deduplisert forklaringliste fra koder; rekkefølgen bevares. */
export function buildExplanations(codes: readonly ExplanationCode[]): Explanation[] {
  const seen = new Set<ExplanationCode>();
  const result: Explanation[] = [];
  for (const code of codes) {
    if (seen.has(code)) continue;
    seen.add(code);
    result.push({ code });
  }
  return result;
}

/** i18n-nøkkelen for en forklaringskode. */
export function explanationI18nKey(code: ExplanationCode): string {
  return `engineV2.explanations.${code}`;
}
