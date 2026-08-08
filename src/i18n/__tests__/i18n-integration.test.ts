import { afterEach, describe, expect, it, vi } from 'vitest';

import { LANGUAGE_OVERRIDE_STORAGE_KEY } from '../language-policy';

describe('i18next browser integration', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('syncs HTML lang and persists only explicit overrides', async () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: vi.fn((key: string) => values.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => values.set(key, value)),
      removeItem: vi.fn((key: string) => values.delete(key)),
    };
    const documentElement = { lang: 'en', dir: 'rtl' };

    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('navigator', {
      languages: ['sv', 'en-SE'],
      language: 'sv',
    });
    vi.stubGlobal('document', { documentElement });

    const { clearLanguageOverride, default: i18n, setLanguageOverride } = await import('../index');
    if (!i18n.isInitialized) {
      await new Promise<void>((resolve) => {
        i18n.on('initialized', () => resolve());
      });
    }

    expect(i18n.resolvedLanguage).toBe('sv');
    expect(documentElement).toEqual({ lang: 'sv', dir: 'ltr' });
    expect(storage.setItem).not.toHaveBeenCalled();

    await setLanguageOverride('no');
    expect(values.get(LANGUAGE_OVERRIDE_STORAGE_KEY)).toBe('no');
    expect(documentElement.lang).toBe('nb');

    await clearLanguageOverride();
    expect(values.has(LANGUAGE_OVERRIDE_STORAGE_KEY)).toBe(false);
    expect(i18n.resolvedLanguage).toBe('sv');
    expect(documentElement.lang).toBe('sv');
    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });
});
