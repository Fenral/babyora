import { renderToStaticMarkup } from 'react-dom/server';
import i18next, { type i18n } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import da from '../../i18n/locales/da.json';
import en from '../../i18n/locales/en.json';
import no from '../../i18n/locales/no.json';
import sv from '../../i18n/locales/sv.json';

vi.mock('../../hooks/useWeather', () => ({
  useWeather: () => ({
    status: 'loading',
    forecast: null,
    offlineForecast: null,
    hourly: [],
    evidence: null,
    now: null,
  }),
}));

vi.mock('../../state/children-store', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useChildren: () => ({
    active: {
      id: 'child-1',
      name: 'Mia',
      dob: '2025-08-01',
      city: 'Oslo',
      lat: 59.9139,
      lon: 10.7522,
    },
  }),
}));

vi.mock('../../state/location-pref-store', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useLocationPref: (selector: (state: Record<string, unknown>) => unknown) => selector({
    mode: 'manual',
    automaticPlace: null,
    automaticGeneration: 0,
  }),
}));

vi.mock('../../state/swap-override-store', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useSwapOverride: (selector: (state: Record<string, unknown>) => unknown) => selector({ swaps: {} }),
}));

vi.mock('../../lib/premium/use-access', () => ({
  useAccess: () => ({ isPremium: true, loading: false }),
}));

vi.mock('../../lib/haptics/system', () => ({
  useHapticSystem: () => ({ fire: async () => {}, prepare: async () => {} }),
}));

const { UkeScreen } = await import('../UkeScreen');

type LaunchLanguage = 'en' | 'sv' | 'da';

async function instance(language: LaunchLanguage): Promise<i18n> {
  const next = i18next.createInstance();
  await next.use(initReactI18next).init({
    resources: {
      no: { translation: no },
      en: { translation: en },
      sv: { translation: sv },
      da: { translation: da },
    },
    lng: language,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
  return next;
}

const expectations = {
  en: ['Plan', 'Mia · Fixed location · Oslo', 'Choose planning view', 'Today', 'Tomorrow', "Loading today's plan …"],
  sv: ['Planera', 'Mia · Fast plats · Oslo', 'Välj planvy', 'I dag', 'I morgon', 'Hämtar dagens plan …'],
  da: ['Planlæg', 'Mia · Fast sted · Oslo', 'Vælg planvisning', 'I dag', 'I morgen', 'Henter dagens plan …'],
} as const;

describe.each(Object.entries(expectations) as Array<[LaunchLanguage, readonly string[]]>) (
  '%s Plan surface',
  (language, labels) => {
    it('renders localized heading, context, controls, and loading state', async () => {
      const i18n = await instance(language);
      const html = renderToStaticMarkup(
        <I18nextProvider i18n={i18n}>
          <UkeScreen onNavigate={() => {}} onOpenSheet={() => {}} onOpenPlannedOutfit={() => {}} />
        </I18nextProvider>,
      ).replaceAll('&#x27;', "'");

      for (const label of labels) expect(html).toContain(label);
      if (language !== 'da') {
        expect(html).not.toContain('Velg planvisning');
        expect(html).not.toContain('Planlegg</h1>');
      }
    });
  },
);
