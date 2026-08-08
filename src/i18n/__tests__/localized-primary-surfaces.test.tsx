import { renderToStaticMarkup } from 'react-dom/server';
import i18next, { type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { BottomTabBar } from '../../components/BottomTabBar';
import { ChildrenProvider } from '../../state/children-provider';
import { InnstillingerScreen } from '../../screens/InnstillingerScreen';
import da from '../locales/da.json';
import en from '../locales/en.json';
import no from '../locales/no.json';
import sv from '../locales/sv.json';

type LaunchLanguage = 'en' | 'sv' | 'da';

const resources = {
  no: { translation: no },
  en: { translation: en },
  sv: { translation: sv },
  da: { translation: da },
};

async function instance(language: LaunchLanguage): Promise<i18n> {
  const next = i18next.createInstance();
  await next.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
  return next;
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
    location: { search: '?seed' },
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

const expectations: Record<LaunchLanguage, Readonly<{
  tabs: readonly string[];
  family: readonly string[];
  forbidden: readonly string[];
}>> = {
  en: {
    tabs: ['Home', 'Plan', 'Tools', 'Family'],
    family: ['Family', 'Children', 'Weather & location', 'Appearance', 'Language', 'Automatic (device)', 'About & support', 'Log out'],
    forbidden: ['>Planlegg<', '>Familie<', '>Vær & sted<', '>Utseende<', '>Logg ut<'],
  },
  sv: {
    tabs: ['Hem', 'Planera', 'Verktyg', 'Familj'],
    family: ['Familj', 'Barn', 'Väder och plats', 'Utseende', 'Språk', 'Automatiskt (enhet)', 'Om och support', 'Logga ut'],
    forbidden: ['>Planlegg<', '>Familie<', '>Vær & sted<', '>Logg ut<'],
  },
  da: {
    tabs: ['Hjem', 'Planlæg', 'Værktøjer', 'Familie'],
    family: ['Familie', 'Børn', 'Vejr og sted', 'Udseende', 'Sprog', 'Automatisk (enhed)', 'Om og support', 'Log ud'],
    forbidden: ['>Planlegg<', '>Vær & sted<', '>Utseende<', '>Logg ut<'],
  },
};

describe.each(Object.entries(expectations) as Array<[LaunchLanguage, typeof expectations.en]>) (
  '%s primary shell and Family surface',
  (language, expected) => {
    it('renders localized root navigation', async () => {
      const i18n = await instance(language);
      const html = renderToStaticMarkup(
        <I18nextProvider i18n={i18n}>
          <BottomTabBar active="plan" onNavigate={() => {}} />
        </I18nextProvider>,
      );

      let cursor = -1;
      for (const label of expected.tabs) {
        const next = html.indexOf(`>${label}<`, cursor + 1);
        expect(next, `${label} must appear in tab order`).toBeGreaterThan(cursor);
        cursor = next;
      }
    });

    it('renders a localized resting Family surface and compact language selector', async () => {
      storage.clear();
      const i18n = await instance(language);
      const html = renderToStaticMarkup(
        <I18nextProvider i18n={i18n}>
          <ChildrenProvider>
            <InnstillingerScreen onNavigate={() => {}} />
          </ChildrenProvider>
        </I18nextProvider>,
      );
      const firstDialog = html.indexOf('<dialog');
      expect(firstDialog).toBeGreaterThan(0);
      const restingSurface = html
        .slice(0, firstDialog)
        .replaceAll('&amp;', '&')
        .replaceAll('&#x27;', "'");

      for (const label of expected.family) expect(restingSurface).toContain(label);
      expect(restingSurface).toContain('<select');
      expect(restingSurface).toContain('value="auto"');
      for (const forbidden of expected.forbidden) expect(restingSurface).not.toContain(forbidden);
    });
  },
);
