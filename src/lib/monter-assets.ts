/**
 * monter-assets — bildeoppslag for P4 "Monter"-UI-et på Hjem.
 *
 * Rene, side-effekt-frie oppslagsfunksjoner. Ingen React her (testes uten
 * DOM). To ansvar:
 *
 *  1. getGarmentImage(id) — plagg-id (SAMME kanoniske vokabular som
 *     public/plagg-katalog.json sin `id`-kolonne, og som allerede brukes av
 *     src/data/garment-illustrations.ts sin garmentIdFor()) → det komplette,
 *     flate WebP-settet i public/illustrations/garments/. Alle katalogplagg
 *     har sitt eget motiv. En framtidig/ukjent id får den delte generiske
 *     plaggillustrasjonen, aldri en bokstavflis eller en sti som kan 404-e.
 *
 *  2. getWeatherIcon(symbolCode) — met.no-symbolkode → ett av de 7 filt-
 *     værikonene (klart/delvis/skyet/regn/sno/taake/natt).
 *
 * MONTER_GARMENT_SLUGS beholdes som et eksplisitt inventar for QA av den
 * eldre Monter-assetpakken. Ingen plaggflate bruker den pakken lenger.
 *
 * ASSET-KONTRAKT (2026-08-03): filene disse stiene peker på er UTKLIPP med
 * gjennomsiktig bakgrunn — art bible: «Skygger bor i UI-laget, ikke i asseten;
 * assetene forblir rene utklipp.» Kalleren eier altså flaten OG skyggen bak
 * plagget; asseten leverer bare motivet, og kan derfor vises i både mørk og
 * lys modus. Et nytt plagg-PNG med innbakt bakgrunn stryker
 * __tests__/monter-assets.alfa.test.ts. Ett dokumentert unntak i dag:
 * plagg-sydvest.png venter på manuell maske (MANUELL-listen i
 * tools/cut-plagg.mjs) og er fortsatt ugjennomsiktig.
 */

import { garmentPngSafe } from '../data/garment-illustrations.js';

const MONTER_BASE = `${import.meta.env.BASE_URL}monter/`;

function weatherPath(slug: string): string {
  return `${MONTER_BASE}vaer-${slug}.webp`;
}

/** De 42 plagg-slug-ene som faktisk har en Monter-PNG i public/monter/. */
export const MONTER_GARMENT_SLUGS = Object.freeze([
  'badebukse', 'balaklava', 'cardigan', 'dunjakke', 'fleecebukse',
  'fleecejakke', 'halsedisse', 'kortermet-ullbody', 'kyse',
  'langermet-bomullsbody', 'langermet-ullbody', 'lue-med-ull', 'pysjamas',
  'regnbukse', 'regndress', 'regnhatt-innerlue', 'regnvotter', 'shorts',
  'skallbukse', 'skalljakke', 'solhatt', 'sommerbody', 'sommerbukse',
  'sovepose', 'stroempebukse', 'sydvest', 'toffelsko', 'tskjorte',
  'tykt-ullsett', 'tynn-lue', 'tynne-ullvotter', 'ull-mellomlag', 'ullbukse',
  'ullhals-tynn', 'ullkjeledress', 'ullsokker', 'uvtroye', 'varparkdress',
  'vindjakke', 'vinterdress', 'vintersokker', 'votter',
] as const);

/**
 * Katalog-id (samme vokabular som garmentIdFor() i data/garment-
 * illustrations.ts og public/plagg-katalog.json) → flat WebP. Ukjente
 * verdier får den delte generiske SVG-en, slik at alle konsumenter har samme
 * feiltrygge bildekontrakt.
 */
export function getGarmentImage(id: string | null | undefined): string {
  return garmentPngSafe(id);
}

type FeltWeatherSlug = 'klarvaer' | 'delvis-skyet' | 'skyet' | 'regn' | 'sno' | 'taake' | 'natt';

const NIGHT_CLEAR_BASES = new Set(['clearsky', 'fair']);

function feltSlugForBase(base: string): FeltWeatherSlug {
  if (base === 'clearsky') return 'klarvaer';
  if (base === 'fair' || base === 'partlycloudy') return 'delvis-skyet';
  if (base === 'cloudy') return 'skyet';
  if (base === 'fog') return 'taake';
  if (base.includes('snow') || base.includes('sleet')) return 'sno';
  if (base.includes('rain')) return 'regn';
  // Ukjent/uventet base-kode → nøytral skyet-nyanse (aldri undefined).
  return 'skyet';
}

/**
 * met.no symbolCode (f.eks. "clearsky_day", "lightrainshowers_night") → ett
 * av de 7 filt-værikonene i public/monter/. `undefined` (vær ikke lastet
 * ennå) → `null`, kalleren viser sin egen loading-tilstand.
 *
 * Natt-varianten brukes KUN når base-tilstanden i seg selv er klar/delvis
 * skyet (samme skille som already-eksisterende weatherIconFor i HjemScreen)
 * — nedbør/tåke om natten skal fortsatt vise regn/sno/tåke-ikonet, siden
 * værtilstanden er mer informativ enn klokkeslettet der.
 */
export function getWeatherIcon(symbolCode: string | undefined | null): string | null {
  if (!symbolCode) return null;
  const isNight = /_night$/.test(symbolCode) || /_polartwilight$/.test(symbolCode);
  const base = symbolCode.replace(/_(day|night|polartwilight)$/, '');
  if (isNight && NIGHT_CLEAR_BASES.has(base)) {
    return weatherPath('natt');
  }
  return weatherPath(feltSlugForBase(base));
}

export type WeatherNuance = 'clear' | 'cloudy' | 'rain' | 'snow' | 'night';

/**
 * met.no symbolCode → én av de 5 panel-nyansene (DESIGN.md «Weather nuances
 * (panel only)»). Samme natt-/nedbør-prioritering som getWeatherIcon (nedbør
 * slår natt — «bring regntøy» er mer nyttig enn klokkeslettet), men
 * kollapset til 5 buckets i stedet for 7 ikon-varianter siden panelfargen
 * kun har 5 tokens (--dw-w-clear/cloudy/rain/snow/night). `undefined`
 * (vær ikke lastet ennå) → 'cloudy', som ER `--dw-panel` sin base-verdi
 * (samme farge vises uansett, helt til vær faktisk er kjent).
 */
export function getWeatherNuance(symbolCode: string | undefined | null): WeatherNuance {
  if (!symbolCode) return 'cloudy';
  const isNight = /_night$/.test(symbolCode) || /_polartwilight$/.test(symbolCode);
  const base = symbolCode.replace(/_(day|night|polartwilight)$/, '');
  if (base.includes('snow') || base.includes('sleet')) return 'snow';
  if (base.includes('rain')) return 'rain';
  if (isNight && NIGHT_CLEAR_BASES.has(base)) return 'night';
  if (base === 'clearsky') return 'clear';
  return 'cloudy';
}

type ConditionLanguage = 'da' | 'en' | 'no' | 'sv';
type ConditionKey =
  | 'loading'
  | 'clear'
  | 'fair'
  | 'partlyCloudy'
  | 'cloudy'
  | 'fog'
  | 'lightRain'
  | 'rain'
  | 'heavyRain'
  | 'lightSnow'
  | 'snow'
  | 'heavySnow'
  | 'sleet'
  | 'weather';

const CONDITION_LABELS: Readonly<Record<ConditionLanguage, Readonly<Record<ConditionKey, string>>>> = {
  en: {
    loading: 'Loading weather', clear: 'Clear', fair: 'Mostly clear',
    partlyCloudy: 'Partly cloudy', cloudy: 'Cloudy', fog: 'Fog',
    lightRain: 'Light rain', rain: 'Rain', heavyRain: 'Heavy rain',
    lightSnow: 'Light snow', snow: 'Snow', heavySnow: 'Heavy snow',
    sleet: 'Sleet', weather: 'Weather',
  },
  sv: {
    loading: 'Hämtar väder', clear: 'Klart', fair: 'Mestadels klart',
    partlyCloudy: 'Delvis molnigt', cloudy: 'Molnigt', fog: 'Dimma',
    lightRain: 'Lätt regn', rain: 'Regn', heavyRain: 'Kraftigt regn',
    lightSnow: 'Lätt snöfall', snow: 'Snö', heavySnow: 'Kraftigt snöfall',
    sleet: 'Snöblandat regn', weather: 'Väder',
  },
  da: {
    loading: 'Henter vejret', clear: 'Klart', fair: 'Let skyet',
    partlyCloudy: 'Delvist skyet', cloudy: 'Overskyet', fog: 'Tåge',
    lightRain: 'Let regn', rain: 'Regn', heavyRain: 'Kraftig regn',
    lightSnow: 'Let sne', snow: 'Sne', heavySnow: 'Kraftig sne',
    sleet: 'Slud', weather: 'Vejr',
  },
  no: {
    loading: 'Henter vær', clear: 'Klarvær', fair: 'Lettskyet',
    partlyCloudy: 'Delvis skyet', cloudy: 'Skyet', fog: 'Tåke',
    lightRain: 'Lett regn', rain: 'Regn', heavyRain: 'Kraftig regn',
    lightSnow: 'Lett snø', snow: 'Snø', heavySnow: 'Kraftig snø',
    sleet: 'Sludd', weather: 'Vær',
  },
};

function conditionLanguage(language: string | null | undefined): ConditionLanguage {
  if (!language) return 'no';
  const base = language.trim().toLowerCase().split(/[-_]/, 1)[0];
  if (base === 'no' || base === 'sv' || base === 'da') return base;
  return 'en';
}

/** met.no symbolCode → localized weather text for the compact weather strip. */
export function getConditionLabel(
  symbolCode: string | undefined | null,
  language?: string | null,
): string {
  const labels = CONDITION_LABELS[conditionLanguage(language)];
  if (!symbolCode) return labels.loading;
  const base = symbolCode.replace(/_(day|night|polartwilight)$/, '');
  switch (base) {
    case 'clearsky': return labels.clear;
    case 'fair': return labels.fair;
    case 'partlycloudy': return labels.partlyCloudy;
    case 'cloudy': return labels.cloudy;
    case 'fog': return labels.fog;
    case 'lightrain':
    case 'lightrainshowers': return labels.lightRain;
    case 'rain':
    case 'rainshowers': return labels.rain;
    case 'heavyrain':
    case 'heavyrainshowers': return labels.heavyRain;
    case 'lightsnow':
    case 'lightsnowshowers': return labels.lightSnow;
    case 'snow':
    case 'snowshowers': return labels.snow;
    case 'heavysnow':
    case 'heavysnowshowers': return labels.heavySnow;
    case 'sleet':
    case 'sleetshowers': return labels.sleet;
    default: return labels.weather;
  }
}
