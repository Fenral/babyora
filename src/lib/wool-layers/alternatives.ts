/**
 * Alternative-database for wool-layers regelmotoren.
 *
 * Babyora anbefaler ull som default (brand-DNA: "wool-layers"), men de fleste
 * plagg har et ærlig, ofte rimeligere alternativ foreldre bør kunne se. Brukes
 * to steder:
 *   1. Guidens objektive plagg-detalj — «Ull vs. alternativ» med pros/cons.
 *   2. Min garderobe / ownership-override — når et plagg er markert «har ikke»,
 *      bytter motoren til nærmeste EIDE alternativ (nest-beste).
 *
 * `pros`/`cons` er korte, ærlige beslutnings-akser: pris, varme, fukt/svette,
 * vekt, stell/vask, holdbarhet. Poenget er IKKE ull-dogme — det er ofte helt
 * greit å velge noe rimeligere.
 *
 * Innholdet er grunnet i materialforskning (jun 2026):
 *   - Merinoull: temperatur- og fuktregulering, varm selv fuktig, luktsvak
 *     (sjeldnere vask); men dyrere, skånsom vask, mindre slitesterk.
 *   - Fleece/syntet: rask-tørkende, maskinvaskbar, rimelig, mykt; men mindre
 *     fukt/temp-regulering, kan bli klam ved svette.
 *   - Bomull: rimelig og mykt; men holder på fukt og kjøler når våt.
 *   - Dun: maks varme per vekt; men mister varmen våt, tørker tregt, dyrere.
 *   - Syntet-isolasjon: varm selv våt, rimeligere, maskinvask; men tyngre/mer
 *     plasskrevende enn dun.
 *
 * Sikkerhet: soveposer og isolert vinter-yttertøy byttes ALDRI stille ned i
 * varme — vis nærmeste eide trinn MED advarsel (ownership-override har egen
 * SAFETY_CRITICAL-guardrail på dashbordet).
 */

export type Alternative = {
  /** Alternativ-navn (norsk; matcher en streng i garment-illustrations MAP). */
  name: string;
  /** i18n-key (valgfri, ubrukt foreløpig — pros/cons er primær-innholdet). */
  whenKey?: string;
  whyPrimaryKey?: string;
  /** Korte fordeler (+) ved alternativet. */
  pros?: string[];
  /** Korte ulemper (−) ved alternativet. */
  cons?: string[];
};

export type ItemAlternatives = {
  /** Primær item-navn (må matche eksakt streng fra motoren / MAP). */
  itemName: string;
  /** Fordeler (+) ved det anbefalte (primære) plagget. */
  pros?: string[];
  /** Ulemper (−) ved det anbefalte (primære) plagget. */
  cons?: string[];
  /** Ett eller flere alternativer. */
  alternatives: Alternative[];
};

// Gjenbrukte pros/cons for materialer (grunnet i research over).
const WOOL_PROS = ['Regulerer temperatur og fukt', 'Varmer selv om den blir fuktig', 'Luktsvak — sjeldnere vask'];
const WOOL_CONS = ['Dyrere', 'Skånsom vask', 'Mindre slitesterk enn syntet'];
const FLEECE_PROS = ['Rimeligere', 'Tørker raskt', 'Maskinvaskbar og mykt'];
const FLEECE_CONS = ['Regulerer fukt dårligere', 'Kan bli klam ved svette'];
const COTTON_PROS = ['Rimelig og lett å få tak i', 'Mykt mot huden'];
const COTTON_CONS = ['Holder på fukt — kjøler når våt', 'Mindre temperaturregulering enn ull'];

export const ITEM_ALTERNATIVES: ItemAlternatives[] = [
  // ── Innerst (bomulls-varianter — motorens default på milde dager) ─────────
  {
    itemName: 'kortermet body',
    pros: COTTON_PROS,
    cons: COTTON_CONS,
    alternatives: [
      { name: 'kortermet ullbody', pros: WOOL_PROS, cons: WOOL_CONS },
    ],
  },
  {
    itemName: 'langermet body',
    pros: COTTON_PROS,
    cons: COTTON_CONS,
    alternatives: [
      { name: 'langermet ullbody', pros: WOOL_PROS, cons: WOOL_CONS },
    ],
  },
  {
    itemName: 't-skjorte',
    pros: COTTON_PROS,
    cons: COTTON_CONS,
    alternatives: [
      { name: 'kortermet ullbody', pros: WOOL_PROS, cons: WOOL_CONS },
    ],
  },
  {
    itemName: 'shorts',
    pros: COTTON_PROS,
    cons: ['Lite varme ved kjølig vind'],
    alternatives: [
      { name: 'lett bukse', pros: ['Dekker beina mot kjølig vind'], cons: ['Litt varmere — sjekk barnet'] },
    ],
  },
  {
    itemName: 'lett bukse',
    pros: ['Dekker beina mot kjølig vind', 'Lett å bevege seg i'],
    cons: ['For tynn i streng kulde'],
    alternatives: [
      { name: 'ull-bukse', pros: WOOL_PROS, cons: WOOL_CONS },
    ],
  },
  {
    itemName: 'tynn bukse',
    pros: ['Dekker beina', 'Lett mellomlag for milde dager'],
    cons: ['For tynn ved frost'],
    alternatives: [
      { name: 'ull-bukse', pros: WOOL_PROS, cons: WOOL_CONS },
      { name: 'fleecebukse', pros: FLEECE_PROS, cons: FLEECE_CONS },
    ],
  },
  // ── Bomulls-pyjamas (motorens default i milde rom) ──────────────────────
  {
    itemName: 'tynn pyjamas',
    pros: ['Lett to-delt nattøy i bomull', 'Lett å komme i og ut av'],
    cons: ['Mindre varm i kjølige rom'],
    alternatives: [
      { name: 'ull-pyjamas', pros: ['Regulerer varme + fukt gjennom natta'], cons: ['Dyrere', 'Skånsom vask'] },
    ],
  },
  {
    itemName: 'pyjamas',
    pros: COTTON_PROS,
    cons: ['Mindre varm i kjølige rom enn ull'],
    alternatives: [
      { name: 'ull-pyjamas', pros: ['Regulerer varme + fukt gjennom natta'], cons: ['Dyrere', 'Skånsom vask'] },
    ],
  },
  // ── Ull-varianter (typisk ved kjølig/kald) ───────────────────────────────
  {
    itemName: 'kortermet ullbody',
    pros: WOOL_PROS,
    cons: WOOL_CONS,
    alternatives: [
      { name: 'kortermet body', pros: COTTON_PROS, cons: COTTON_CONS },
    ],
  },
  {
    itemName: 'langermet ullbody',
    pros: WOOL_PROS,
    cons: WOOL_CONS,
    alternatives: [
      { name: 'langermet body', pros: COTTON_PROS, cons: COTTON_CONS },
    ],
  },
  {
    itemName: 'langermet ullbody tynn',
    pros: WOOL_PROS,
    cons: WOOL_CONS,
    alternatives: [
      { name: 'langermet body', pros: COTTON_PROS, cons: COTTON_CONS },
    ],
  },
  {
    itemName: 'tynt ullsett',
    pros: ['Bevegelsesfrihet i to deler', ...WOOL_PROS],
    cons: WOOL_CONS,
    alternatives: [
      { name: 'bomullssett', pros: COTTON_PROS, cons: COTTON_CONS },
    ],
  },
  {
    itemName: 'tykt ullsett',
    pros: ['Varm to-delt base', ...WOOL_PROS],
    cons: WOOL_CONS,
    alternatives: [
      { name: 'bomullssett', pros: ['Rimelig', 'Mykt'], cons: ['Mindre varme enn ull', 'Kjøler når våt'] },
    ],
  },
  {
    itemName: 'ullsokker',
    pros: ['Holder varmen selv litt fuktig', 'Luktsvak'],
    cons: ['Dyrere', 'Skånsom vask'],
    alternatives: [
      { name: 'bomullssokker', pros: ['Rimelig', 'Maskinvask'], cons: ['Kald og klam når svett/våt'] },
    ],
  },

  // ── Mellomlag ──────────────────────────────────────────────────────────────
  {
    itemName: 'tynt ull-mellomlag',
    pros: WOOL_PROS,
    cons: WOOL_CONS,
    alternatives: [
      { name: 'tynn fleece', pros: FLEECE_PROS, cons: [...FLEECE_CONS, 'Statisk'] },
    ],
  },
  {
    itemName: 'ull-mellomlag',
    pros: ['Beste varme-til-vekt', ...WOOL_PROS],
    cons: ['Dyrere', 'Kan klø for sarte (velg merino)'],
    alternatives: [
      { name: 'fleecedress', pros: FLEECE_PROS, cons: ['Mister mye varme når våt', 'Demper svette dårligere'] },
    ],
  },
  {
    itemName: 'tykt ull-mellomlag',
    pros: ['Ekstra varme', ...WOOL_PROS],
    cons: WOOL_CONS,
    alternatives: [
      { name: 'tykk fleece', pros: ['Rimeligere', 'Robust og rask-tørkende'], cons: ['Mindre pustende', 'Bygger volum'] },
    ],
  },
  {
    itemName: 'ull-jakke',
    pros: ['Lett å regulere med glidelås', 'Varm og pustende'],
    cons: ['Dyrere enn fleece'],
    alternatives: [
      { name: 'fleecejakke', pros: ['Rimelig', 'Robust mot vask', 'Tørker raskt'], cons: ['Mindre temperaturregulering', 'Klam ved høy aktivitet'] },
    ],
  },
  {
    itemName: 'ull-bukse',
    pros: ['Varmer beina jevnt', 'Puster godt'],
    cons: ['Dyrere', 'Strikk kan tøye seg over tid'],
    alternatives: [
      { name: 'fleecebukse', pros: ['Rimelig', 'Slitesterk', 'Enkel å vaske'], cons: ['Kjøligere når våt', 'Mindre pustende'] },
    ],
  },
  {
    itemName: 'ull-pyjamas',
    pros: ['Jevn varme gjennom natta', 'Regulerer fukt'],
    cons: ['Dyrere', 'Skånsom vask'],
    alternatives: [
      { name: 'pyjamas', pros: ['Rimelig', 'Maskinvask'], cons: ['Mindre varm i kjølige rom'] },
    ],
  },

  // ── Yttertøy ───────────────────────────────────────────────────────────────
  {
    itemName: 'lett kjøredress',
    pros: ['Lett og luftig', 'Nok til milde dager'],
    cons: ['For lite varme ved frost'],
    alternatives: [
      { name: 'kjøredress', pros: ['Mer varme', 'Dekker et bredere temperaturspenn'], cons: ['Kan bli for varmt på milde dager'] },
    ],
  },
  {
    itemName: 'isolert vinterkjøredress',
    pros: ['Maks varme i streng frost', 'Vindtett'],
    cons: ['Kan bli for varmt over −5 °C'],
    alternatives: [
      { name: 'vinterkjøredress', pros: ['Lettere', 'Greit ned mot −7 °C'], cons: ['For lite varme i streng kulde — sjekk barnet'] },
    ],
  },
  {
    itemName: 'isolert vinterdress',
    pros: ['Holder kroppsvarmen under aktiv lek', 'Varm selv ved hvile'],
    cons: ['Klumpete', 'For varmt over 0 °C'],
    alternatives: [
      { name: 'vinterdress', pros: ['Mer bevegelig', 'Greit ned mot −5 °C'], cons: ['For lite varme i frost over lengre tid'] },
    ],
  },

  // ── Ekstra · hender / hode / føtter ─────────────────────────────────────────
  {
    itemName: 'votter',
    pros: ['Varme selv litt fuktige', 'Luktsvak'],
    cons: ['Dyrere'],
    alternatives: [
      { name: 'fleecevotter', pros: ['Rimelig', 'Tørker raskt'], cons: ['Kjøligere når våte', 'Mindre vindtette'] },
    ],
  },
  {
    itemName: 'tykke votter',
    pros: ['God varme for de fleste vinterdager'],
    cons: ['Ikke nok i streng frost'],
    alternatives: [
      { name: 'votter dun', pros: ['Maks varme', 'Lette'], cons: ['Dyrere', 'Dårligere når våte', 'Tørker tregt'] },
    ],
  },
  {
    itemName: 'lue m/ ull',
    pros: ['Dekker ørene', 'Varm i frost'],
    cons: ['For varm på milde dager'],
    alternatives: [
      { name: 'tynn lue', pros: ['Lett', 'Passer milde dager (10–21 °C)'], cons: ['For lite varme i frost'] },
    ],
  },
  {
    itemName: 'vintersko isolerte',
    pros: ['Holder føttene varme i minusgrader'],
    cons: ['Kan bli for varmt over 0 °C'],
    alternatives: [
      { name: 'vintersko', pros: ['Greit ned mot 0 °C', 'Mindre klumpete'], cons: ['For kaldt i streng frost'] },
    ],
  },
  {
    itemName: 'sandaler',
    pros: ['Luftige på varme dager'],
    cons: ['Ingen beskyttelse mot kjølig vær'],
    alternatives: [
      { name: 'tynne sko', pros: ['Dekker foten mer', 'Bedre på ujevnt underlag'], cons: ['Varmere enn sandaler'] },
    ],
  },

  // ── Utstyr · vogn / søvn ────────────────────────────────────────────────────
  {
    itemName: 'varmepose',
    pros: ['Jevn varme i vogn', 'Lukkbar etter behov'],
    cons: ['Kan bli for varmt på milde dager'],
    alternatives: [
      { name: 'varmepose lett', pros: ['Rimeligere', 'Passer milde dager'], cons: ['For lite varme i kulde'] },
    ],
  },
  {
    itemName: 'dunteppe',
    pros: ['Mye ekstra varme i vogn'],
    cons: ['Dårlig når fuktig', 'Aldri over kalesjen'],
    alternatives: [
      { name: 'tynt teppe', pros: ['Lett', 'Rimelig'], cons: ['Lite varme — kun komfort'] },
    ],
  },
  {
    itemName: 'sovepose 1.0 TOG',
    pros: ['Passer de fleste rom (18–21 °C)', 'Trygg jevn varme'],
    cons: ['For varm i varme rom'],
    alternatives: [
      { name: 'sovepose 0.5 TOG', pros: ['Passer varme rom (>24 °C)'], cons: ['For lite varme under 22 °C — øk romtemp eller legg på et lag'] },
    ],
  },
  {
    itemName: 'sovepose 1.5 TOG',
    pros: ['Mellomtrinn mellom lett og medium'],
    cons: ['Sjeldnere — 1.0 og 2.5 dekker de fleste'],
    alternatives: [
      { name: 'sovepose 1.0 TOG', pros: ['Vanlig og lett å få tak i'], cons: ['Litt kjøligere under ~18 °C — sjekk nakken'] },
    ],
  },
  {
    itemName: 'sovepose 2.5 TOG',
    pros: ['Den vanligste hjemmevarmen (16–18 °C)', 'Trygg jevn varme'],
    cons: ['For varm i milde rom'],
    alternatives: [
      { name: 'sovepose 2.0 TOG', pros: ['Nærmeste trinn ned om du ikke har 2.5'], cons: ['Litt kjøligere — øk romtemp eller legg på et tynt lag under'] },
    ],
  },
];

/**
 * Slå opp alternativer for et item-navn. Returnerer undefined hvis item
 * ikke har registrerte alternativer. Match er eksakt streng (case-sensitive).
 */
export function getAlternatives(itemName: string): ItemAlternatives | undefined {
  return ITEM_ALTERNATIVES.find((entry) => entry.itemName === itemName);
}

/** Sjekk om et item har minst ett alternativ (UI: vis (!)-ikon). */
export function hasAlternatives(itemName: string): boolean {
  return getAlternatives(itemName) !== undefined;
}
