import { describe, expect, it, vi } from 'vitest';

import {
  LANGUAGE_OVERRIDE_STORAGE_KEY,
  firstValidDeviceRegion,
  htmlLanguageFor,
  resolveDeviceLanguage,
  resolveInitialLanguage,
  syncDocumentLanguage,
} from '../language-policy';

describe('device locale region policy', () => {
  it.each([
    [['sv-SE'], 'sv'],
    [['en-SE'], 'sv'],
    [['da-DK'], 'da'],
    [['en-Latn-DK'], 'da'],
    [['nb-NO'], 'en'],
    [['de-DE'], 'en'],
    [['es-419'], 'en'],
  ] as const)('maps the first valid region in %j to %s', (locales, expected) => {
    expect(resolveDeviceLanguage(locales)).toBe(expected);
  });

  it('skips malformed and regionless candidates before the first valid region', () => {
    expect(firstValidDeviceRegion(['not_a_locale', 'sv', 'en', 'da-DK', 'sv-SE']))
      .toBe('DK');
    expect(resolveDeviceLanguage(['not_a_locale', 'sv', 'en', 'da-DK', 'sv-SE']))
      .toBe('da');
  });

  it('stops at the first valid region even when a later region has a Nordic mapping', () => {
    expect(firstValidDeviceRegion(['nb-NO', 'sv-SE'])).toBe('NO');
    expect(resolveDeviceLanguage(['nb-NO', 'sv-SE'])).toBe('en');
  });

  it.each([
    { label: 'missing', locales: undefined },
    { label: 'empty', locales: [] },
    { label: 'regionless', locales: ['sv'] },
    { label: 'malformed', locales: ['not_a_locale'] },
    { label: 'mixed invalid', locales: ['', '   ', 'en'] },
  ])('falls back to English for $label locales', ({ locales }) => {
    expect(resolveDeviceLanguage(locales)).toBe('en');
  });
});

describe('initial language precedence and persistence boundary', () => {
  it.each(['no', 'en', 'sv', 'da', 'de'] as const)(
    'lets the explicit %s override win over the device region',
    (override) => {
      const storage = {
        getItem: vi.fn((key: string) => key === LANGUAGE_OVERRIDE_STORAGE_KEY ? override : null),
        setItem: vi.fn(),
      };

      expect(resolveInitialLanguage({
        storage,
        navigator: { languages: ['en-SE'], language: 'en-SE' },
      })).toBe(override);
      expect(storage.getItem).toHaveBeenCalledWith(LANGUAGE_OVERRIDE_STORAGE_KEY);
      expect(storage.setItem).not.toHaveBeenCalled();
    },
  );

  it('ignores invalid overrides and does not read the former detector cache key', () => {
    const storage = {
      getItem: vi.fn((key: string) => {
        if (key === 'babyora:lng') return 'sv';
        if (key === LANGUAGE_OVERRIDE_STORAGE_KEY) return 'nb-NO';
        return null;
      }),
      setItem: vi.fn(),
    };

    expect(resolveInitialLanguage({
      storage,
      navigator: { languages: ['da-DK'], language: 'da-DK' },
    })).toBe('da');
    expect(storage.getItem).toHaveBeenCalledTimes(1);
    expect(storage.getItem).not.toHaveBeenCalledWith('babyora:lng');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('falls back safely when browser APIs are absent or storage access throws', () => {
    expect(resolveInitialLanguage({ storage: null, navigator: null })).toBe('en');
    expect(resolveInitialLanguage({
      storage: { getItem: () => { throw new Error('blocked'); } },
      navigator: { languages: ['sv-SE'], language: 'sv-SE' },
    })).toBe('sv');
  });
});

describe('document language synchronization', () => {
  it.each([
    ['no', 'nb'],
    ['en', 'en'],
    ['sv', 'sv'],
    ['da', 'da'],
    ['de', 'de'],
    ['malformed', 'en'],
  ])('maps i18n language %s to HTML language %s', (language, expected) => {
    expect(htmlLanguageFor(language)).toBe(expected);
  });

  it('updates the document element for every language change', () => {
    const documentLike = {
      documentElement: { lang: 'en', dir: 'rtl' },
    };

    syncDocumentLanguage('sv', documentLike);
    expect(documentLike.documentElement).toEqual({ lang: 'sv', dir: 'ltr' });

    syncDocumentLanguage('no', documentLike);
    expect(documentLike.documentElement).toEqual({ lang: 'nb', dir: 'ltr' });
  });
});
