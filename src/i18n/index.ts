import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import da from './locales/da.json';
import de from './locales/de.json';
import en from './locales/en.json';
import no from './locales/no.json';
import sv from './locales/sv.json';

/**
 * Babyora i18n-config.
 *
 * Språk-strategi (jun 2026):
 * - Norsk (no) = primært + fallback. Tone-of-voice etablert i wool-layers/modifiers.
 * - Engelsk (en) = sekundært. Britisk-norsk-vennlig, ikke amerikansk slang.
 * - Svensk (sv), dansk (da) = lett oversettelse, samme språk-familie som norsk.
 * - Tysk (de) = du-form (ikke Sie) for warm parenting.
 * - Finsk (fi) er DROPPET fra v1.0 — krever native reviewer Babyora ikke har
 *   ennå. Git-historikk (commit 3ae66e4) bevarer AI-utkastet for senere
 *   gjeninnføring sammen med native review.
 *
 * Språk-deteksjon-rekkefølge:
 * 1. localStorage `babyora:lng` (bruker-valg fra Innstillinger)
 *    (Legacy-nøkkel `klemeg:lng` brukes fortsatt som fallback for å bevare
 *    eksisterende installasjoner — kan fjernes etter v1.1.)
 * 2. navigator.language (browser/OS-språk)
 * 3. Fallback: no
 *
 * BCP 47-noter (per a11y-spec):
 * - 'no' beholdes som locale-nøkkel for å unngå breaking change, men HTML
 *   `<html lang>`-attributtet settes til 'nb' (bokmål) ved språkskifte for
 *   korrekt screen-reader-stemme-valg.
 * - Alle andre språk: 2-letter primary subtag holder (sv/da/fi/de/en).
 */
const NO_TO_BCP47: Record<string, string> = {
  no: 'nb', // norsk bokmål
  en: 'en',
  sv: 'sv',
  da: 'da',
  de: 'de',
};

void i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      no: { translation: no },
      en: { translation: en },
      sv: { translation: sv },
      da: { translation: da },
      de: { translation: de },
    },
    fallbackLng: 'no',
    supportedLngs: ['no', 'en', 'sv', 'da', 'de'],
    nonExplicitSupportedLngs: true, // 'no-NO' → 'no', 'sv-SE' → 'sv'
    returnEmptyString: false, // a11y: tomme strings til SR forbys, faller tilbake til key/fallbackLng
    interpolation: {
      escapeValue: false, // React escaper allerede
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'babyora:lng',
    },
  });

// Dynamisk HTML lang-attribute (a11y: SR observerer attribute-endringer
// for å bytte tale-syntese ved språkskifte).
function updateHtmlLang(lng: string): void {
  if (typeof document !== 'undefined') {
    const bcp47 = NO_TO_BCP47[lng] ?? lng;
    document.documentElement.lang = bcp47;
    document.documentElement.dir = 'ltr'; // alle 6 språk er LTR
  }
}

i18next.on('languageChanged', updateHtmlLang);

// Initial sync etter i18next-init (deteksjon ferdig).
if (i18next.isInitialized) {
  updateHtmlLang(i18next.language);
} else {
  i18next.on('initialized', () => updateHtmlLang(i18next.language));
}

export default i18next;
