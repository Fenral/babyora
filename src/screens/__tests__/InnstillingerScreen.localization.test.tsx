import { renderToStaticMarkup } from 'react-dom/server';
import i18next, { type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { ChildrenProvider } from '../../state/children-provider';
import da from '../../i18n/locales/da.json';
import de from '../../i18n/locales/de.json';
import en from '../../i18n/locales/en.json';
import no from '../../i18n/locales/no.json';
import sv from '../../i18n/locales/sv.json';
import { InnstillingerScreen } from '../InnstillingerScreen';

type TestLanguage = 'en' | 'sv' | 'da' | 'no' | 'de';

const resources = {
  en: { translation: en },
  sv: { translation: sv },
  da: { translation: da },
  no: { translation: no },
  de: { translation: de },
};

async function i18nFor(language: TestLanguage): Promise<i18n> {
  const instance = i18next.createInstance();
  await instance.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
  return instance;
}

const storageValues = new Map<string, string>();
const storage = {
  getItem: (key: string) => storageValues.get(key) ?? null,
  setItem: (key: string, value: string) => void storageValues.set(key, value),
  removeItem: (key: string) => void storageValues.delete(key),
  clear: () => storageValues.clear(),
  key: (index: number) => [...storageValues.keys()][index] ?? null,
  get length() { return storageValues.size; },
};

beforeAll(() => {
  vi.stubGlobal('localStorage', storage);
  vi.stubGlobal('window', {
    location: { search: '?seed=demo' },
    localStorage: storage,
    matchMedia: () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
    addEventListener: () => {},
    removeEventListener: () => {},
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

const expected: Record<TestLanguage, readonly string[]> = {
  en: [
    'Morning reminder time', 'Help and guidance', 'Send feedback', 'Privacy and terms',
    'Switch child', 'Reference time', 'Add another child', 'Use current location',
    'Weather-change alerts', 'Delete all my data?', 'Weather source', 'Rate Babyora',
    'Material preference', 'Cotton first',
  ],
  sv: [
    'Tid för morgonpåminnelse', 'Hjälp och vägledning', 'Skicka feedback',
    'Integritet och villkor', 'Byt barn', 'Referenstid', 'Lägg till ett barn',
    'Använd aktuell plats', 'Notiser om väderförändringar', 'Radera alla mina data?',
    'Väderkälla', 'Betygsätt Babyora', 'Materialval', 'Bomull först',
  ],
  da: [
    'Tidspunkt for morgenpåmindelse', 'Hjælp og vejledning', 'Send feedback',
    'Privatliv og vilkår', 'Skift barn', 'Referencetid', 'Tilføj et barn',
    'Brug aktuel placering', 'Notifikationer om vejrændringer', 'Slet alle mine data?',
    'Vejrkilde', 'Bedøm Babyora', 'Materialevalg', 'Bomuld først',
  ],
  no: [
    'Tidspunkt for morgenvarsel', 'Hjelp og veiledning', 'Send tilbakemelding',
    'Personvern og vilkår', 'Bytt barn', 'Referansetime', 'Legg til nytt barn',
    'Bruk posisjon automatisk', 'Værendring-varsel', 'Slett alle mine data?',
    'Værkilde', 'Vurder Babyora', 'Materialvalg', 'Bomull først',
  ],
  de: [
    'Morning reminder time', 'Help and guidance', 'Send feedback', 'Privacy and terms',
    'Switch child', 'Reference time', 'Add another child', 'Use current location',
    'Weather-change alerts', 'Delete all my data?', 'Weather source', 'Rate Babyora',
    'Material preference', 'Cotton first',
  ],
};

describe.each(Object.entries(expected) as Array<[TestLanguage, readonly string[]]>) (
  '%s Settings dialogs',
  (language, markers) => {
    it('renders all secondary surfaces in the resolved language', async () => {
      const i18n = await i18nFor(language);
      const html = renderToStaticMarkup(
        <I18nextProvider i18n={i18n}>
          <ChildrenProvider>
            <InnstillingerScreen onNavigate={() => {}} onOpenTool={() => {}} />
          </ChildrenProvider>
        </I18nextProvider>,
      );

      for (const marker of markers) expect(html).toContain(marker);
      if (language !== 'no') {
        expect(html).not.toContain('Tidspunkt for morgenvarsel');
        expect(html).not.toContain('Værendring-varsel');
        expect(html).not.toContain('Vurder Babyora');
      }
    });
  },
);
