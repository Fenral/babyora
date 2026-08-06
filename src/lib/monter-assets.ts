/**
 * monter-assets — bildeoppslag for P4 "Monter"-UI-et på Hjem.
 *
 * Rene, side-effekt-frie oppslagsfunksjoner. Ingen React her (testes uten
 * DOM). To ansvar:
 *
 *  1. getGarmentImage(id) — plagg-id (SAMME kanoniske vokabular som
 *     public/plagg-katalog.json sin `id`-kolonne, og som allerede brukes av
 *     src/data/garment-illustrations.ts sin garmentIdFor()) → Monter-vitrine-
 *     PNG i public/monter/. Ikke alle 60 katalog-id-er har et eget bilde ennå
 *     (kun 42 plagg-PNG-er finnes, se docs/mocks/monter/assets-v1/MANIFEST.md)
 *     — ukjent/udekket id gir `null`, og kalleren (MonterGarmentRow) tegner en
 *     nøytral vitrine-plassholder (forbokstav på #3A2A1A) i stedet. Dette er
 *     et BEVISST produktvalg, ikke en bug: fremfor å gjette feil bilde for et
 *     plagg vi ikke har en trygg visuell match for, viser vi ingenting heller
 *     enn noe misvisende.
 *
 *  2. getWeatherIcon(symbolCode) — met.no-symbolkode → ett av de 7 filt-
 *     værikonene (klart/delvis/skyet/regn/sno/taake/natt).
 *
 * Se BUNNEN av filen for mappings-notatene (hvilke av de 42 plagg-bildene som
 * IKKE er bundet til en katalog-id, og hvorfor).
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

const MONTER_BASE = `${import.meta.env.BASE_URL}monter/`;

function garmentPath(slug: string): string {
  return `${MONTER_BASE}plagg-${slug}.png`;
}

function weatherPath(slug: string): string {
  return `${MONTER_BASE}vaer-${slug}.png`;
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

type MonterGarmentSlug = (typeof MONTER_GARMENT_SLUGS)[number];

/**
 * Katalog-id → Monter-plagg-slug. Kun id-er med et rimelig sikkert visuelt
 * treff er med her — se mappings-notatene nederst i filen for id-er som
 * BEVISST er utelatt (får `null` → nøytral vitrine-plassholder).
 */
const GARMENT_ID_TO_SLUG: Readonly<Record<string, MonterGarmentSlug>> = {
  'kortermet-body': 'sommerbody',
  'kortermet-ullbody': 'kortermet-ullbody',
  'langermet-body': 'langermet-bomullsbody',
  'langermet-ullbody': 'langermet-ullbody',
  'langermet-ullbody-tynn': 'langermet-ullbody',
  'ullsett-tykt': 'tykt-ullsett',
  't-skjorte': 'tskjorte',
  'shorts': 'shorts',
  'lett-bukse': 'sommerbukse',
  'ullsokker': 'ullsokker',
  'tynn-bukse': 'fleecebukse',
  'ull-mellomlag': 'ull-mellomlag',
  'ull-mellomlag-tykt': 'ull-mellomlag',
  'ull-jakke': 'cardigan',
  'ull-bukse': 'ullbukse',
  'tynn-pyjamas': 'pysjamas',
  'pyjamas': 'pysjamas',
  'ull-pyjamas': 'pysjamas',
  'lett-kjoredress': 'varparkdress',
  'vinterkjoredress': 'vinterdress',
  'vinterkjoredress-isolert': 'vinterdress',
  'vinterdress': 'vinterdress',
  'vinterdress-isolert': 'vinterdress',
  'regntoy-skall': 'regndress',
  'vindtett-skall': 'vindjakke',
  'solhatt': 'solhatt',
  'lue-tynn': 'tynn-lue',
  'lue-m-ull': 'lue-med-ull',
  'balaklava': 'balaklava',
  'votter-tynne': 'tynne-ullvotter',
  'votter': 'votter',
  'votter-tykke': 'votter',
  'votter-dun': 'votter',
  'vindvotter-skall': 'regnvotter',
  'hals': 'halsedisse',
  'toffel-sko': 'toffelsko',
  'sovepose-0-5-tog': 'sovepose',
  'sovepose-1-0-tog': 'sovepose',
  'sovepose-2-5-tog': 'sovepose',
  'sovepose-3-0-3-5-tog': 'sovepose',
  'sovepose-3-5-tog': 'sovepose',
  /* FRIGJORT 2026-08-06. Filhodets eget notat sa: «vintersokker — ingen
     tilsvarende id finnes i plagg-katalog.json sitt naavaerende
     vokabular». Bildet laa altsaa ubundet fordi raden ikke fantes.
     Eierbeslutningen «faa egen rad» lager den id-en, og bildet faar
     hjemmet sitt. Ingen ny asset var noedvendig i vitrinen. */
  vintersokker: 'vintersokker',
};

/**
 * Katalog-id (samme vokabular som garmentIdFor() i data/garment-
 * illustrations.ts og public/plagg-katalog.json) → Monter-vitrine-PNG, eller
 * `null` når ingen trygg match finnes (kalleren tegner nøytral plassholder).
 */
export function getGarmentImage(id: string | null | undefined): string | null {
  if (!id) return null;
  const slug = GARMENT_ID_TO_SLUG[id];
  return slug ? garmentPath(slug) : null;
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

/**
 * met.no symbolCode → norsk værtekst for `.hjm-note`/scan-radene. Speiler
 * HjemScreen sin egen `symbolToLabel` (legacy-treet, uendret av P4) 1:1 —
 * duplisert bevisst i stedet for eksportert derfra, siden HjemScreen ikke
 * skal endres i det hele tatt utover selve render-forgreningen.
 */
export function getConditionLabel(symbolCode: string | undefined | null): string {
  if (!symbolCode) return 'Henter vær';
  const base = symbolCode.replace(/_(day|night|polartwilight)$/, '');
  switch (base) {
    case 'clearsky': return 'Klarvær';
    case 'fair': return 'Lettskyet';
    case 'partlycloudy': return 'Delvis skyet';
    case 'cloudy': return 'Skyet';
    case 'fog': return 'Tåke';
    case 'lightrain':
    case 'lightrainshowers': return 'Lett regn';
    case 'rain':
    case 'rainshowers': return 'Regn';
    case 'heavyrain':
    case 'heavyrainshowers': return 'Kraftig regn';
    case 'lightsnow':
    case 'lightsnowshowers': return 'Lett snø';
    case 'snow':
    case 'snowshowers': return 'Snø';
    case 'heavysnow':
    case 'heavysnowshowers': return 'Kraftig snø';
    case 'sleet':
    case 'sleetshowers': return 'Sludd';
    default: return 'Vær';
  }
}

/*
 * ── Mappings-notater (2026-07-31, P4 asset-pipeline; revidert T1A 2026-08-02
 *    etter katalog-audit/rapport.md) ────────────────────────────────────────
 *
 * T1A-oppryddingen fjernet fire koblinger som brøt modulens eget «heller
 * ingen bilde enn feil bilde»-prinsipp (alle visuelt verifisert i auditen):
 *   - kjoredress → dunjakke        (jakke uten bein vs. heldress; også
 *     vurdert mot plagg-vinterdress.png: den er en QUILTET vinterdress med
 *     fotposer — feil varme-/materialsignal for en mellomtykk kjøredress,
 *     og ville kollapset kjoredress/vinterkjoredress/vinterdress-stigen
 *     visuelt. Derfor nøytral plassholder.)
 *   - ullsett-tynt → ullkjeledress (to-delt sett vs. en-delt strikket)
 *   - lue → kyse                   (pull-over-lue vs. knyte-kyse)
 *   - tynn-ull-mellomlag → fleecejakke (ull vs. fleece — feil materialsignal
 *     i en ull-spesifikk app)
 * I tillegg ble de to døde nøklene sovepose-1-5-tog/sovepose-2-0-tog fjernet
 * (id-ene finnes ikke i katalogen — uoppnåelig kode).
 *
 * 28 av de 42 tilgjengelige plagg-bildene er bundet til minst én katalog-id
 * over (flere sovepose-/vinterdress-/pysjamas-variant-id-er gjenbruker
 * bevisst samme bilde — kun tykkelse/isolasjon skiller dem, ikke silhuett).
 *
 * 14 bilder er IKKE bundet til noen katalog-id (ingen match god nok til at
 * vi tør bruke dem — heller ingen bilde enn feil bilde):
 *   - badebukse, stroempebukse, uvtroye, vintersokker — ingen tilsvarende
 *     id finnes i plagg-katalog.json sitt nåværende vokabular.
 *   - regnbukse, skalljakke, skallbukse — «regntoy-skall»/«vindtett-skall»
 *     er allerede bundet (til hhv. regndress/vindjakke); disse tre er
 *     alternative visuelle varianter av samme konsept uten egen id.
 *   - regnhatt-innerlue, sydvest — regn-hodeplagg uten egen katalog-id.
 *   - ullhals-tynn — «hals» er allerede bundet til halsedisse (buff-varianten).
 *   - kyse, dunjakke, ullkjeledress, fleecejakke — ble frigjort av T1A-
 *     oppryddingen over (de var kun bundet via de fire fjernede koblingene).
 *
 * Følgende katalog-id-er har BEVISST `null` (ingen visuell match, uansett
 * hvilket av de 42 bildene): to-ullsett (representerer et lag-PRINSIPP, ikke
 * et enkeltplagg), bleie, sko, sandaler, vintersko, vintersko-isolerte,
 * tynt-teppe, dunteppe, varmepose-lett/varmepose/varmepose-dun (fotpose ≠
 * sovepose visuelt, og vi har bare ett sovepose-bilde), sauekinn-i-vogn,
 * regntrekk, regnponcho-over-baeresele, ansiktskrem — og etter T1A også
 * kjoredress, ullsett-tynt, lue og tynn-ull-mellomlag (se over).
 */
