import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import da from './locales/da.json';
import de from './locales/de.json';
import en from './locales/en.json';
import no from './locales/no.json';
import sv from './locales/sv.json';
import {
  removeLanguageOverride,
  resolveInitialLanguage,
  SUPPORTED_LANGUAGES,
  syncDocumentLanguage,
  writeLanguageOverride,
  type SupportedLanguage,
} from './language-policy';

/**
 * Babyora localization foundation.
 *
 * Initial-language precedence is deliberately synchronous:
 * 1. explicit user choice in `babyora:languageOverride`;
 * 2. first valid region in navigator.languages, then navigator.language;
 * 3. SE maps to Swedish, DK maps to Danish, and everything else maps to English.
 *
 * Device-derived choices are never cached. Norwegian, English, Swedish,
 * Danish, and German remain available as explicit resource languages.
 */

i18next.on('languageChanged', syncDocumentLanguage);

void i18next
  .use(initReactI18next)
  .init({
    resources: {
      no: { translation: no },
      en: { translation: en },
      sv: { translation: sv },
      da: { translation: da },
      de: { translation: de },
    },
    lng: resolveInitialLanguage(),
    fallbackLng: 'en',
    supportedLngs: [...SUPPORTED_LANGUAGES],
    nonExplicitSupportedLngs: true,
    returnEmptyString: false,
    interpolation: {
      escapeValue: false,
    },
  });

// The listener above handles every change. This also covers implementations
// where initialization completes before the listener's event is observable.
if (i18next.isInitialized) {
  syncDocumentLanguage(i18next.resolvedLanguage ?? i18next.language);
} else {
  i18next.on('initialized', () => {
    syncDocumentLanguage(i18next.resolvedLanguage ?? i18next.language);
  });
}

/** Persist and apply only a user-selected language override. */
export async function setLanguageOverride(language: SupportedLanguage): Promise<void> {
  writeLanguageOverride(language);
  await i18next.changeLanguage(language);
}

/** Remove the explicit choice and immediately resume device-region selection. */
export async function clearLanguageOverride(): Promise<void> {
  removeLanguageOverride();
  await i18next.changeLanguage(resolveInitialLanguage({ storage: null }));
}

export default i18next;
