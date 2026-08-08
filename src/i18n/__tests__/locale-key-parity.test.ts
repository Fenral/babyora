import { describe, expect, it } from 'vitest';

import da from '../locales/da.json';
import de from '../locales/de.json';
import en from '../locales/en.json';
import no from '../locales/no.json';
import sv from '../locales/sv.json';

const LOCALES = { no, en, sv, da, de } as const;

function translationLeaves(
  value: unknown,
  path: readonly string[] = [],
  leaves: Map<string, unknown> = new Map(),
): Map<string, unknown> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      // Translation metadata is not user-facing copy and is intentionally
      // allowed to differ between the source locale and reviewed translations.
      if (key.startsWith('_')) continue;
      translationLeaves(child, [...path, key], leaves);
    }
    return leaves;
  }

  leaves.set(path.join('.'), value);
  return leaves;
}

describe('locale resource key parity', () => {
  const localeLeaves = Object.fromEntries(
    Object.entries(LOCALES).map(([language, locale]) => [language, translationLeaves(locale)]),
  ) as Record<keyof typeof LOCALES, Map<string, unknown>>;
  const canonicalKeys = [...localeLeaves.en.keys()].sort();

  it('keeps all five supported locale trees non-empty and string-only', () => {
    expect(canonicalKeys.length).toBeGreaterThan(0);

    for (const [language, leaves] of Object.entries(localeLeaves)) {
      for (const [key, value] of leaves) {
        expect(typeof value, `${language}.${key} must be a string`).toBe('string');
        expect((value as string).trim().length, `${language}.${key} must not be empty`)
          .toBeGreaterThan(0);
      }
    }
  });

  it.each(Object.keys(LOCALES) as Array<keyof typeof LOCALES>)(
    '%s has exactly the same user-facing keys as English',
    (language) => {
      expect([...localeLeaves[language].keys()].sort()).toEqual(canonicalKeys);
    },
  );
});
