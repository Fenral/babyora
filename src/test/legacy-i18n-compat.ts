import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import no from '../i18n/locales/no.json';

/**
 * Historic component tests render isolated screens without importing the app's
 * i18n bootstrap or mounting an I18nextProvider. Give only that Vitest-only
 * environment the former Norwegian baseline. Production startup continues to
 * resolve SE -> sv, DK -> da, and every other automatic region -> en.
 */
if (!i18next.isInitialized) {
  await i18next
    .use(initReactI18next)
    .init({
      resources: { no: { translation: no } },
      lng: 'no',
      fallbackLng: 'no',
      initAsync: false,
      interpolation: { escapeValue: false },
    });
}
