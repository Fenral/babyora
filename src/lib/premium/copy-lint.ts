/**
 * P10.1 (2026-06-13): copy-lint for Premium-tone.
 *
 * Per Premium-plan §6: «funksjoner er en del av Babyora Premium —
 * vi skriver aldri 'låst', 'sperret' eller 'nektet'.»
 *
 * Brukes som vitest-assertion + valgfri runtime-check i Dev-bygg.
 */

const FORBIDDEN_WORDS = [
  /\blåst\b/i,
  /\bsperret\b/i,
  /\bnektet\b/i,
  /\bkrever Premium\b/i, // ALENE — «Krever Premium for X» er OK hvis full setning
];

/** Per Premium-plan §4: sikkerhetsinnhold er ALDRI bak paywall. */
const SAFETY_KEYWORDS_REQUIRING_FREE_ACCESS = [
  /HB-9/i,
  /bilstol/i,
  /safety/i,
  /sikkerhet/i,
  /overoppheting/i,
  /SIDS/i,
  /nakkesjekken?/i,
];

export interface CopyLintResult {
  forbidden: string[];
  safetyGated: string[];
  ok: boolean;
}

export function lintCopy(text: string, isPremiumGated = false): CopyLintResult {
  const forbidden: string[] = [];
  for (const re of FORBIDDEN_WORDS) {
    const match = text.match(re);
    if (match) forbidden.push(match[0]);
  }
  const safetyGated: string[] = [];
  if (isPremiumGated) {
    for (const re of SAFETY_KEYWORDS_REQUIRING_FREE_ACCESS) {
      const match = text.match(re);
      if (match) safetyGated.push(match[0]);
    }
  }
  return { forbidden, safetyGated, ok: forbidden.length === 0 && safetyGated.length === 0 };
}
