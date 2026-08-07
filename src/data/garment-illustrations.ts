/**
 * Mapping fra database-streng (slik den ligger i wool-layers/tables.ts) til
 * PNG-illustrasjons-id (filnavn uten extension i public/illustrations/garments/).
 *
 * Modifier-tilsetninger fra modifiers.ts (regntøy, vindtett skall, hals, etc.)
 * inkludert. Fallback gjenbruker eksisterende plagg når flere database-strenger
 * deler samme illustrasjon (eks: "caps eller solhatt" → solhatt).
 */

export type GarmentId = string;

const MAP: Record<string, GarmentId> = {
  // Innerst
  'kortermet body': 'kortermet-body',
  'lett kortermet body (valgfritt)': 'kortermet-body',
  'kortermet ullbody': 'kortermet-ullbody',
  'langermet body': 'langermet-body',
  'langermet ullbody': 'langermet-ullbody',
  'langermet ullbody tynn': 'langermet-ullbody-tynn',
  // F28.22: adj-først-rekkefølge (V0 P0 norsk-ordstilling)
  'tynt ullsett': 'ullsett-tynt',
  'tykt ullsett': 'ullsett-tykt',
  'to ullsett oppå hverandre': 'to-ullsett',
  't-skjorte': 't-skjorte',
  'shorts': 'shorts',
  'lett bukse': 'lett-bukse',
  'bleie': 'bleie',
  'ullsokker': 'ullsokker',
  'tykke ullsokker': 'ullsokker',
  /* EGEN ID, IKKE ET ALIAS FOR ULLSOKKER (2026-08-06, eierbeslutning).

     Motoren dooper om «vintersko isolerte» til dette navnet for barn
     9-15 mnd, fordi vinterdressen dekker foten (modifiers.ts:539). Det
     er FOTTOEYETS plass, ikke et ekstra par sokker — men raden laa paa
     samme id som «ullsokker» og fikk derfor samme bilde.

     Foelgen var maalt i revisjonen 2026-08-06: rad 2 «Ullsokker» og rad
     8 «Tykke ullsokker (vinterdress dekker)» hadde pikselidentiske
     miniatyrer, men ble telt som to av aatte plagg. En forelder som
     skanner listen med en haand ser samme sokk to ganger og maa stoppe
     opp for aa avgjoere om appen mener det.

     Merk at aliaset «tykke ullsokker» UTEN parentes blir staaende paa
     ullsokker. Det er en annen sak: der ERSTATTER motoren «ullsokker»
     (modifiers.ts:522-523), saa de to kan aldri opptre samtidig og det
     finnes ingen dublett aa skille. */
  'tykke ullsokker (vinterdress dekker)': 'vintersokker',
  'ullstrømper': 'ullsokker',
  'tykke ullstrømper': 'ullsokker',

  // Mellomlag
  'tynn bukse': 'tynn-bukse',
  'tynt ull-mellomlag': 'tynn-ull-mellomlag',
  'ull-mellomlag': 'ull-mellomlag',
  'tykt ull-mellomlag': 'ull-mellomlag-tykt',
  'ull-jakke': 'ull-jakke',
  'ull-bukse': 'ull-bukse',
  'tynn pyjamas': 'tynn-pyjamas',
  'pyjamas': 'pyjamas',
  'ull-pyjamas': 'ull-pyjamas',
  'ekstra ull-lag': 'tynn-ull-mellomlag',

  // Yttertøy
  'lett kjøredress': 'lett-kjoredress',
  'kjøredress': 'kjoredress',
  'vinterkjøredress': 'vinterkjoredress',
  'isolert vinterkjøredress': 'vinterkjoredress-isolert',
  'vinterdress': 'vinterdress',
  'isolert vinterdress': 'vinterdress-isolert',
  'regntøy / skall': 'regntoy-skall',
  'vindtett skall': 'vindtett-skall',
  // Tabell-emisjon fra utelek/kald — 'dress' er kortform for mellomtykk
  // overall (mellom kjøredress og vinterdress). Mappes til kjoredress-PNG
  // som nærmeste visuelle treff.
  'dress': 'kjoredress',

  // Ekstra · hodeplagg
  'solhatt': 'solhatt',
  'caps eller solhatt': 'solhatt',
  'tynn lue': 'lue-tynn',
  'lue': 'lue',
  'lue m/ ull': 'lue-m-ull',
  'balaklava': 'balaklava',

  // Ekstra · hender
  'tynne votter': 'votter-tynne',
  'votter': 'votter',
  'tykke votter': 'votter-tykke',
  'votter dun': 'votter-dun',
  'vindvotter (skall)': 'vindvotter-skall',

  // Ekstra · hals
  'halsedisse': 'hals',
  'halsedisse (kalibrert)': 'hals',

  // Ekstra · føtter
  'sko': 'sko',
  'tøffel-sko': 'toffel-sko',
  // T1A (katalog-audit 1a, 2026-08-01): den sammensatte anbefalingen viste
  // tidligere KUN sokken ('ullsokker') — katalogen selv (plagg-katalog.json,
  // id toffel-sko) lister denne strengen som alias til toffel-sko, og
  // toffel-sko.png viser faktisk skoen. Ligger BEVISST etter 'tøffel-sko'
  // over: ID_TO_DB tar FØRSTE treff per id, og dbStringFor('toffel-sko')
  // må forbli den kanoniske korte strengen (brukes som motor-/alternativ-
  // oppslagsnøkkel i PlaggDetailSheet/getAlternatives).
  'tøffel-sko + tykke ullsokker': 'toffel-sko',
  'sandaler': 'sandaler',
  'vintersko': 'vintersko',
  'vintersko isolerte': 'vintersko-isolerte',
  // Modifier-output fra modifiers.ts (alders-fottøy-justering 9-15 mnd)
  'barfot eller tynne tøfler': 'toffel-sko',

  // Ekstra · vogn-tilbehør
  'tynt teppe': 'tynt-teppe',
  'dunteppe': 'dunteppe',
  'varmepose lett': 'varmepose-lett',
  'varmepose': 'varmepose',
  'varmepose dun': 'varmepose-dun',
  'saueskinn i vogn': 'sauekinn-i-vogn',
  'regntrekk': 'regntrekk',
  'regnponcho over bæresele': 'regnponcho-over-baeresele',
  // Modifier-output fra modifiers.ts (utstyr-kategori).
  // Disse er ikke selvstendige klesplagg, men vises som rad i Påkledning
  // og må ha en illustrasjon for å unngå broken-img-fallback.
  'regntrekk på vognen': 'regntrekk',
  'vognpose': 'varmepose',
  'kjørepose': 'varmepose-dun',

  // Ekstra · søvn
  'sovepose 0.5 TOG': 'sovepose-0-5-tog',
  'sovepose 1.0 TOG': 'sovepose-1-0-tog',
  'sovepose 1.5 TOG': 'sovepose-1-5-tog',
  'sovepose 2.0 TOG': 'sovepose-2-0-tog',
  'sovepose 2.5 TOG': 'sovepose-2-5-tog',
  'sovepose 3.0–3.5 TOG': 'sovepose-3-0-3-5-tog',
  'sovepose 3.5 TOG': 'sovepose-3-5-tog',

  // Ekstra · hud
  'ansiktskrem': 'ansiktskrem',

  // Alternativer (ikke-ull) — PNG genereres lokalt (set=alternatives i
  // generate-garments.mjs). Plassholder-bilde settes i PLACEHOLDER_PNG.
  'tynn fleece': 'tynn-fleece',
  'fleecedress': 'fleecedress',
  'fleecejakke': 'fleecejakke',
  'fleecebukse': 'fleecebukse',
  'tykk fleece': 'tykk-fleece',
  'fleecevotter': 'fleecevotter',
  'bomullssokker': 'bomullssokker',
  'bomullssett': 'bomullssett',
  'tynne sko': 'tynne-sko',
};

/** Slå opp PNG-id fra norsk database-streng. Returnerer null hvis ikke funnet. */
export function garmentIdFor(dbString: string): GarmentId | null {
  return MAP[dbString.trim()] ?? null;
}

/** Invers: id → kanonisk database-streng (første treff i MAP).
 *
 *  T1A (2026-08-02): dbStringFor er nå KUN en motor-/db-oppslagsnøkkel
 *  (getAlternatives, eierskaps-nøkler i Min garderobe, GarmentDetail-
 *  navigasjon). Brukersynlige plaggnavn kommer ALLTID fra
 *  src/data/garment-display-names.ts (garmentDisplayName /
 *  displayNameForDbString) — aldri herfra. */
const ID_TO_DB: Record<GarmentId, string> = (() => {
  const out: Record<string, string> = {};
  for (const [db, id] of Object.entries(MAP)) {
    if (!(id in out)) out[id] = db;
  }
  return out;
})();

/** Kanonisk norsk database-streng for et plagg-id. Faller tilbake til id-en. */
export function dbStringFor(id: GarmentId): string {
  return ID_TO_DB[id] ?? id;
}

/**
 * Plagg som ennå ikke har egen PNG → vis nærmeste eksisterende illustrasjon
 * som plassholder inntil den genereres (jf. `scripts/generate-garments.mjs`).
 * Brukes for nye alternativ-plagg og nye TOG-trinn.
 */
const PLACEHOLDER_PNG: Record<GarmentId, GarmentId> = {
  'sovepose-1-5-tog': 'sovepose-1-0-tog',
  'sovepose-2-0-tog': 'sovepose-2-5-tog',
  // Ikke-ull-alternativer — vis ull-/standard-varianten til ekte PNG finnes.
  'tynn-fleece': 'tynn-ull-mellomlag',
  'fleecedress': 'ull-mellomlag',
  'fleecejakke': 'ull-jakke',
  'fleecebukse': 'ull-bukse',
  'tykk-fleece': 'ull-mellomlag-tykt',
  'fleecevotter': 'votter',
  'bomullssokker': 'ullsokker',
  'bomullssett': 'ullsett-tynt',
  'tynne-sko': 'sko',
};

/* ETT PLAGGSETT, IKKE TO (eierbeslutning 2026-08-07).

   Her sto også `garmentClayPng()`, som pekte på `illustrations/garments-clay/`.
   Begge settene var i bruk samtidig: Plaggbiblioteket, plaggdetaljarket og
   Plan tegnet dette, mens antrekks-stepperen og TOG-guiden tegnet clay. Samme
   plagg så altså ulikt ut avhengig av skjerm — vinterdressen var marineblå i
   biblioteket og grønn i antrekket.

   Art bible («Materialer», 2026-08-02) avgjør: «Ullplagg: ekte
   strikkefiber-detalj (masker, fibre), ALDRI plastisk.» Clay-settet er
   nettopp plastisk, og DESIGN.md krever ÉN materialfamilie for maskot,
   plagg og værscener. Clay kom inn i F80a, altså før art bible ble skrevet.

   `garments-clay/` er slettet. Mangler et plagg her, er svaret å RENDRE det
   i riggen — ikke å hente det fra et annet materiale. */

/** Bygg bildesti relativt til app-root (Vite BASE_URL). Faller tilbake til
 *  en plassholder for plagg som ennå ikke er generert. */
export function garmentPng(id: GarmentId): string {
  const file = PLACEHOLDER_PNG[id] ?? id;
  return `${import.meta.env.BASE_URL}illustrations/garments/${file}.webp`;
}

/**
 * Generisk SVG-fallback for plagg uten egen PNG eller PLACEHOLDER_PNG-mapping.
 * Inline data-URL (ingen ekstra fetch) — bruk i <img onError> eller som
 * `src`-fallback når `garmentPng(id)` returnerer en sti som kan 404.
 *
 * Designet matcher app-paletten (warm taupe + sand) og gir en abstrakt
 * "klesplagg-folded"-form. Garantert ingen 404, ingen layout-shift.
 */
export const GENERIC_GARMENT_SVG = (() => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#D8D6D2"/>
      <stop offset="1" stop-color="#9B9A96"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" fill="none"/>
  <path d="M22 12 L42 12 L48 20 L42 24 L42 52 Q42 54 40 54 L24 54 Q22 54 22 52 L22 24 L16 20 Z"
        fill="url(#g)" stroke="#8B7B6A" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M28 12 Q32 16 36 12" fill="none" stroke="#8B7B6A" stroke-width="1.2" stroke-linecap="round"/>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
})();

/**
 * Trygg PNG-resolver: returnerer PNG-sti hvis id-en har en kjent fil eller
 * placeholder-mapping, ellers den generiske SVG-fallback-data-URL-en.
 *
 * Bruk denne i UI-komponenter der vi ikke kan vite om en framtidig id i
 * recommend()/modifiers vil ha en illustrasjon — den garanterer at det
 * ALDRI vises broken-image-ikon. For id-er som er kjent å eksistere er
 * det helt OK å bruke `garmentPng(id)` direkte.
 */
export function garmentPngSafe(id: GarmentId | null | undefined): string {
  if (!id) return GENERIC_GARMENT_SVG;
  // Hvis vi har en PLACEHOLDER_PNG-entry eller id matcher en kjent kanonisk
  // streng (via ID_TO_DB), så har vi rimelig grad av sikkerhet for at PNG-en
  // finnes. Ellers fall tilbake til SVG umiddelbart.
  if (PLACEHOLDER_PNG[id] || ID_TO_DB[id]) {
    return garmentPng(id);
  }
  return GENERIC_GARMENT_SVG;
}
