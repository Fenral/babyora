/**
 * R7 Task 6 — produkt-copy-lint over alle språkfiler + regel-enheter.
 */
import { describe, expect, it } from 'vitest';
import { lintLocaleTree, lintString } from '../product-copy-lint.js';
import no from '../../../i18n/locales/no.json';
import en from '../../../i18n/locales/en.json';
import sv from '../../../i18n/locales/sv.json';
import da from '../../../i18n/locales/da.json';
import de from '../../../i18n/locales/de.json';

describe('produkt-copy-lint — regler', () => {
  it('fanger KLEMEG-restord', () => {
    expect(lintString('Velkommen til Klemeg').some((v) => v.ruleId === 'no-klemeg')).toBe(true);
  });

  it('fanger absolutte trygghetspåstander', () => {
    for (const s of ['garantert riktig', 'helt trygt', 'alltid trygt', '100 % riktig', 'perfekt antrekk']) {
      expect(lintString(s).some((v) => v.ruleId === 'no-absolute-safe'), s).toBe(true);
    }
  });

  it('fanger utendørs-TOG-påstand', () => {
    expect(lintString('TOG-verdi for utendørs bruk').some((v) => v.ruleId === 'no-outdoor-tog')).toBe(true);
  });

  it('godtar legitim innesøvn-TOG og vanlig «trygt nok»-formulering', () => {
    expect(lintString('Riktig sovepose-TOG for romtemperatur')).toEqual([]);
    expect(lintString('Kjenn på nakken — varm og tørr betyr passe')).toEqual([]);
  });
});

describe('produkt-copy-lint — alle språkfiler er rene', () => {
  it.each([
    ['no', no], ['en', en], ['sv', sv], ['da', da], ['de', de],
  ])('%s.json har ingen brudd på låste beslutninger', (_lang, tree) => {
    const violations = lintLocaleTree(tree);
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
});
