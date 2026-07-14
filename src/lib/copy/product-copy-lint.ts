/**
 * R7 Task 6 — produkt-copy-lint. Håndhever de LÅSTE beslutningene i
 * brukerrettet tekst (decision-log 2026-07-13/14, UI-plan Task 6):
 *
 *  - Aldri det gamle appnavnet KLEMEG (appen heter Babyora internt).
 *  - Aldri absolutte trygghets-/riktighetspåstander («garantert», «alltid
 *    trygt», «helt trygt», «100 % riktig», «perfekt») — motoren gir råd,
 *    ikke garantier (engine-2-design §16).
 *  - Aldri utendørs-TOG-påstander (TOG gjelder kun innesøvn).
 *  - Aldri berøringsenhet-tastaturhint («trykk Enter», «tastatur»).
 *
 * Rene funksjoner — brukes som vitest-assertion over locale-filene.
 */

export type CopyRule = {
  id: string;
  test: RegExp;
  why: string;
};

export const PRODUCT_COPY_RULES: readonly CopyRule[] = [
  { id: 'no-klemeg', test: /\bklemeg\b/i, why: 'Gammelt appnavn — appen heter Babyora' },
  { id: 'no-absolute-safe', test: /\b(garantert|helt trygt|alltid trygt|100\s?%\s?(riktig|trygt)|perfekt)\b/i, why: 'Absolutt trygghets-/riktighetspåstand' },
  { id: 'no-outdoor-tog', test: /\butend[øo]rs\b[^.]{0,40}\bTOG\b|\bTOG\b[^.]{0,40}\butend[øo]rs\b/i, why: 'TOG gjelder kun innesøvn' },
  { id: 'no-kbd-hint', test: /\btrykk enter\b|\bpå tastaturet\b/i, why: 'Berøringsenhet-tastaturhint' },
];

export type CopyViolation = { path: string; ruleId: string; match: string; why: string };

/** Sjekk én streng mot alle regler. */
export function lintString(text: string): Array<{ ruleId: string; match: string; why: string }> {
  const out: Array<{ ruleId: string; match: string; why: string }> = [];
  for (const rule of PRODUCT_COPY_RULES) {
    const m = text.match(rule.test);
    if (m) out.push({ ruleId: rule.id, match: m[0], why: rule.why });
  }
  return out;
}

/** Rekursivt gjennom et locale-objekt; returnerer alle brudd med sti. */
export function lintLocaleTree(tree: unknown, prefix = ''): CopyViolation[] {
  const violations: CopyViolation[] = [];
  if (typeof tree === 'string') {
    for (const v of lintString(tree)) {
      violations.push({ path: prefix, ...v });
    }
  } else if (tree && typeof tree === 'object') {
    for (const [key, value] of Object.entries(tree)) {
      // Interne meta-nøkler (starter med _) er ikke brukerrettet.
      if (key.startsWith('_')) continue;
      violations.push(...lintLocaleTree(value, prefix ? `${prefix}.${key}` : key));
    }
  }
  return violations;
}
