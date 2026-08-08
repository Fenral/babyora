export type GarmentNameLanguage = 'da' | 'en' | 'sv';

type Names = Readonly<Record<GarmentNameLanguage, string>>;

/**
 * User-facing garment names for the automatic launch languages.
 * Norwegian remains canonical engine/data vocabulary; these names are
 * presentation-only and never flow back into recommendation lookups.
 */
export const LOCALIZED_GARMENT_NAMES: Readonly<Record<string, Names>> = {
  ansiktskrem: { en: 'Face cream', sv: 'Ansiktskräm', da: 'Ansigtscreme' },
  balaklava: { en: 'Balaclava', sv: 'Balaklava', da: 'Balaclava (elefanthue)' },
  bleie: { en: 'Nappy', sv: 'Blöja', da: 'Ble' },
  dunteppe: { en: 'Down blanket', sv: 'Duntäcke', da: 'Duntæppe' },
  hals: { en: 'Neck warmer', sv: 'Halskrage', da: 'Halsedisse' },
  kjoredress: { en: 'Pramsuit', sv: 'Åkoverall', da: 'Køredragt' },
  'kortermet-body': { en: 'Short-sleeved bodysuit', sv: 'Kortärmad body', da: 'Kortærmet body' },
  'kortermet-ullbody': { en: 'Short-sleeved wool bodysuit', sv: 'Kortärmad ullbody', da: 'Kortærmet uldbody' },
  'langermet-body': { en: 'Long-sleeved bodysuit', sv: 'Långärmad body', da: 'Langærmet body' },
  'langermet-ullbody': { en: 'Long-sleeved wool bodysuit', sv: 'Långärmad ullbody', da: 'Langærmet uldbody' },
  'langermet-ullbody-tynn': { en: 'Lightweight wool bodysuit', sv: 'Tunn långärmad ullbody', da: 'Tynd langærmet uldbody' },
  'lett-bukse': { en: 'Light trousers', sv: 'Tunna byxor', da: 'Lette bukser' },
  'lett-kjoredress': { en: 'Light pramsuit', sv: 'Tunn åkoverall', da: 'Let køredragt' },
  lue: { en: 'Beanie', sv: 'Mössa', da: 'Hue' },
  'lue-m-ull': { en: 'Wool beanie', sv: 'Ullmössa', da: 'Uldhue' },
  'lue-tynn': { en: 'Light beanie', sv: 'Tunn mössa', da: 'Tynd hue' },
  pyjamas: { en: 'Pyjamas', sv: 'Pyjamas', da: 'Pyjamas' },
  'regnponcho-over-baeresele': { en: 'Rain poncho over the carrier', sv: 'Regnponcho över bärselen', da: 'Regnponcho over bæreselen' },
  'regntoy-skall': { en: 'Rainwear / shell', sv: 'Regnkläder / skal', da: 'Regntøj / skal' },
  regntrekk: { en: 'Rain cover', sv: 'Regnskydd', da: 'Regnslag' },
  sandaler: { en: 'Sandals', sv: 'Sandaler', da: 'Sandaler' },
  'sauekinn-i-vogn': { en: 'Sheepskin stroller liner', sv: 'Lammskinn i vagnen', da: 'Lammeskind i barnevognen' },
  shorts: { en: 'Shorts', sv: 'Shorts', da: 'Shorts' },
  sko: { en: 'Shoes', sv: 'Skor', da: 'Sko' },
  solhatt: { en: 'Sun hat', sv: 'Solhatt', da: 'Solhat' },
  'sovepose-0-5-tog': { en: '0.5 TOG sleep sack', sv: 'Sovsäck 0,5 TOG', da: 'Sovepose 0,5 TOG' },
  'sovepose-1-0-tog': { en: '1.0 TOG sleep sack', sv: 'Sovsäck 1,0 TOG', da: 'Sovepose 1,0 TOG' },
  'sovepose-1-5-tog': { en: '1.5 TOG sleep sack', sv: 'Sovsäck 1,5 TOG', da: 'Sovepose 1,5 TOG' },
  'sovepose-2-0-tog': { en: '2.0 TOG sleep sack', sv: 'Sovsäck 2,0 TOG', da: 'Sovepose 2,0 TOG' },
  'sovepose-2-5-tog': { en: '2.5 TOG sleep sack', sv: 'Sovsäck 2,5 TOG', da: 'Sovepose 2,5 TOG' },
  'sovepose-3-0-3-5-tog': { en: '3.0–3.5 TOG sleep sack', sv: 'Sovsäck 3,0–3,5 TOG', da: 'Sovepose 3,0–3,5 TOG' },
  'sovepose-3-5-tog': { en: '3.5 TOG sleep sack', sv: 'Sovsäck 3,5 TOG', da: 'Sovepose 3,5 TOG' },
  't-skjorte': { en: 'T-shirt', sv: 'T-shirt', da: 'T-shirt' },
  'to-ullsett': { en: 'Two layered wool sets', sv: 'Två ullset i lager', da: 'To uldsæt i lag' },
  'toffel-sko': { en: 'Soft booties', sv: 'Mjuka tossor', da: 'Bløde futter' },
  'tynn-bukse': { en: 'Light trousers', sv: 'Tunna byxor', da: 'Tynde bukser' },
  'tynn-pyjamas': { en: 'Light pyjamas', sv: 'Tunn pyjamas', da: 'Tynd pyjamas' },
  'tynn-ull-mellomlag': { en: 'Light wool mid layer', sv: 'Tunt mellanlager i ull', da: 'Tyndt mellemlag i uld' },
  'tynt-teppe': { en: 'Light blanket', sv: 'Tunn filt', da: 'Tyndt tæppe' },
  'ull-bukse': { en: 'Wool trousers', sv: 'Ullbyxor', da: 'Uldbukser' },
  'ull-jakke': { en: 'Wool jacket', sv: 'Ulljacka', da: 'Uldjakke' },
  'ull-mellomlag': { en: 'Wool mid layer', sv: 'Mellanlager i ull', da: 'Mellemlag i uld' },
  'ull-mellomlag-tykt': { en: 'Warm wool mid layer', sv: 'Varmt mellanlager i ull', da: 'Varmt mellemlag i uld' },
  'ull-pyjamas': { en: 'Wool pyjamas', sv: 'Ullpyjamas', da: 'Uldpyjamas' },
  'ullsett-tykt': { en: 'Warm wool set', sv: 'Varmt ullset', da: 'Varmt uldsæt' },
  'ullsett-tynt': { en: 'Light wool set', sv: 'Tunt ullset', da: 'Tyndt uldsæt' },
  ullsokker: { en: 'Wool socks', sv: 'Ullstrumpor', da: 'Uldsokker' },
  varmepose: { en: 'Footmuff', sv: 'Åkpåse', da: 'Kørepose' },
  'varmepose-dun': { en: 'Down footmuff', sv: 'Dunåkpåse', da: 'Dunkørepose' },
  'varmepose-lett': { en: 'Light footmuff', sv: 'Tunn åkpåse', da: 'Let kørepose' },
  'vindtett-skall': { en: 'Windproof shell', sv: 'Vindtätt skal', da: 'Vindtæt skal' },
  'vindvotter-skall': { en: 'Windproof shell mittens', sv: 'Vindvantar', da: 'Vindluffer' },
  vinterdress: { en: 'Snowsuit', sv: 'Vinteroverall', da: 'Flyverdragt' },
  'vinterdress-isolert': { en: 'Insulated snowsuit', sv: 'Fodrad vinteroverall', da: 'Foret flyverdragt' },
  vinterkjoredress: { en: 'Winter pramsuit', sv: 'Vinteråkoverall', da: 'Vinterkøredragt' },
  'vinterkjoredress-isolert': { en: 'Insulated winter pramsuit', sv: 'Fodrad vinteråkoverall', da: 'Foret vinterkøredragt' },
  vintersko: { en: 'Winter boots', sv: 'Vinterskor', da: 'Vinterstøvler' },
  'vintersko-isolerte': { en: 'Insulated winter boots', sv: 'Fodrade vinterskor', da: 'Forede vinterstøvler' },
  vintersokker: { en: 'Thick wool socks', sv: 'Tjocka ullstrumpor', da: 'Tykke uldsokker' },
  votter: { en: 'Mittens', sv: 'Vantar', da: 'Luffer' },
  'votter-dun': { en: 'Down mittens', sv: 'Dunvantar', da: 'Dunluffer' },
  'votter-tykke': { en: 'Warm mittens', sv: 'Tjocka vantar', da: 'Tykke luffer' },
  'votter-tynne': { en: 'Light mittens', sv: 'Tunna vantar', da: 'Tynde luffer' },

  // Equivalent alternatives emitted by the preference engine.
  'tynn-fleece': { en: 'Light fleece', sv: 'Tunn fleece', da: 'Tynd fleece' },
  fleecedress: { en: 'Fleece suit', sv: 'Fleeceoverall', da: 'Fleecedragt' },
  fleecejakke: { en: 'Fleece jacket', sv: 'Fleecejacka', da: 'Fleecejakke' },
  fleecebukse: { en: 'Fleece trousers', sv: 'Fleecebyxor', da: 'Fleecebukser' },
  'tykk-fleece': { en: 'Warm fleece', sv: 'Tjock fleece', da: 'Tyk fleece' },
  fleecevotter: { en: 'Fleece mittens', sv: 'Fleece-vantar', da: 'Fleeceluffer' },
  bomullssokker: { en: 'Cotton socks', sv: 'Bomullsstrumpor', da: 'Bomuldssokker' },
  bomullssett: { en: 'Cotton set', sv: 'Bomullsset', da: 'Bomuldssæt' },
  'tynne-sko': { en: 'Light shoes', sv: 'Tunna skor', da: 'Lette sko' },
};

export function normalizeGarmentNameLanguage(language: string | null | undefined): GarmentNameLanguage | null {
  const base = language?.trim().toLowerCase().split(/[-_]/, 1)[0];
  return base === 'en' || base === 'sv' || base === 'da' ? base : null;
}

export function localizedGarmentName(
  id: string,
  language: string | null | undefined,
): string | null {
  const normalized = normalizeGarmentNameLanguage(language);
  if (normalized === null) return null;
  return LOCALIZED_GARMENT_NAMES[id]?.[normalized] ?? null;
}
