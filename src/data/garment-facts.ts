import type { GarmentId } from './garment-illustrations';

export type GarmentFactLanguage = 'da' | 'en' | 'no' | 'sv';

export type GarmentFact = {
  text: string;
  sourceLabel: string;
  sourceUrl: string;
};

type FactKey =
  | 'cotton'
  | 'fleece'
  | 'headAndNeck'
  | 'layers'
  | 'mittens'
  | 'sleep'
  | 'stroller'
  | 'wool'
  | 'footwear';

const SOURCES = {
  helsenorge: {
    label: 'Helsenorge',
    url: 'https://www.helsenorge.no/forstehjelp/sikkerhet-for-sma-barn/',
  },
  nps: {
    label: 'National Park Service',
    url: 'https://www.nps.gov/teachers/classrooms/dressing-for-winter.htm',
  },
  nhs: {
    label: 'NHS',
    url: 'https://www.nhs.uk/best-start-in-life/baby/baby-basics/caring-for-your-baby/how-to-dress-a-newborn/',
  },
  polartec: {
    label: 'Polartec',
    url: 'https://www.polartec.com/fabrics/base/power-grid',
  },
  rei: {
    label: 'REI Co-op',
    url: 'https://www.rei.com/learn/expert-advice/snow-gloves-and-mittens--how-to-choose.html',
  },
  woolmark: {
    label: 'Woolmark',
    url: 'https://www.woolmark.com/fibre/',
  },
} as const;

type LocalizedFact = Record<GarmentFactLanguage, string> & {
  source: keyof typeof SOURCES;
};

const FACTS: Record<FactKey, LocalizedFact> = {
  wool: {
    source: 'woolmark',
    en: 'Wool handles moisture vapour and helps even out temperature, which makes it useful across changing conditions.',
    sv: 'Ull hanterar fuktånga och hjälper till att jämna ut temperaturen när vädret skiftar.',
    da: 'Uld håndterer fugtdamp og hjælper med at udligne temperaturen, når vejret skifter.',
    no: 'Ull håndterer fuktdamp og bidrar til jevnere temperatur når været skifter.',
  },
  fleece: {
    source: 'polartec',
    en: 'Fleece is lightweight and quick-drying, so it works well as an adjustable mid layer.',
    sv: 'Fleece är lätt och snabbtorkande och fungerar därför bra som ett justerbart mellanlager.',
    da: 'Fleece er let og hurtigtørrende og fungerer derfor godt som et justerbart mellemlag.',
    no: 'Fleece er lett og hurtigtørkende, og fungerer derfor godt som et justerbart mellomlag.',
  },
  mittens: {
    source: 'rei',
    en: 'Mittens are usually warmer than gloves made from the same materials because the fingers share warmth.',
    sv: 'Vantar är oftast varmare än handskar i samma material eftersom fingrarna delar värme.',
    da: 'Luffer er oftest varmere end handsker i samme materiale, fordi fingrene deler varmen.',
    no: 'Votter er som regel varmere enn hansker i samme materiale fordi fingrene deler varmen.',
  },
  footwear: {
    source: 'helsenorge',
    en: 'Socks and footwear should leave enough room to move; tight layers insulate less effectively.',
    sv: 'Strumpor och skor bör ge plats för rörelse; för trånga lager isolerar sämre.',
    da: 'Sokker og fodtøj bør give plads til bevægelse; for stramme lag isolerer dårligere.',
    no: 'Sokker og fottøy bør gi plass til bevegelse; for trange lag isolerer dårligere.',
  },
  headAndNeck: {
    source: 'helsenorge',
    en: 'In cold weather, cover the head and neck and check that hands and feet still feel warm.',
    sv: 'I kallt väder bör huvud och hals täckas. Kontrollera också att händer och fötter känns varma.',
    da: 'I koldt vejr bør hoved og hals dækkes. Tjek også, at hænder og fødder føles varme.',
    no: 'I kaldt vær bør hode og hals dekkes. Sjekk også at hender og føtter kjennes varme.',
  },
  sleep: {
    source: 'nhs',
    en: 'Remove hats and extra outdoor layers indoors or in the car, and check that the baby is not getting too warm.',
    sv: 'Ta av mössa och extra ytterlager inomhus eller i bilen, och kontrollera att barnet inte blir för varmt.',
    da: 'Tag hue og ekstra yderlag af indendørs eller i bilen, og tjek at barnet ikke får det for varmt.',
    no: 'Ta av lue og ekstra ytterlag inne eller i bilen, og sjekk at barnet ikke blir for varmt.',
  },
  cotton: {
    source: 'nps',
    en: 'Cotton holds on to moisture and dries slowly, so it is least forgiving in damp, cold conditions.',
    sv: 'Bomull håller kvar fukt och torkar långsamt, så det passar sämre i fuktigt och kallt väder.',
    da: 'Bomuld holder på fugten og tørrer langsomt, så det er mindre velegnet i fugtigt og koldt vejr.',
    no: 'Bomull holder på fukt og tørker langsomt, så det passer dårligere i fuktig og kaldt vær.',
  },
  stroller: {
    source: 'helsenorge',
    en: 'Wind can make it feel colder. Use adjustable layers and check the neck for warmth or dampness.',
    sv: 'Vind kan göra att det känns kallare. Använd justerbara lager och känn i nacken efter värme eller fukt.',
    da: 'Vind kan få det til at føles koldere. Brug justerbare lag og mærk i nakken efter varme eller fugt.',
    no: 'Vind kan få det til å kjennes kaldere. Bruk justerbare lag og kjenn i nakken etter varme eller fukt.',
  },
  layers: {
    source: 'nps',
    en: 'A base layer manages moisture, a mid layer insulates, and the outer layer blocks wind and rain.',
    sv: 'Innerlagret hanterar fukt, mellanlagret isolerar och ytterlagret skyddar mot vind och regn.',
    da: 'Det inderste lag håndterer fugt, mellemlaget isolerer, og yderlaget beskytter mod vind og regn.',
    no: 'Innerlaget håndterer fukt, mellomlaget isolerer og ytterlaget beskytter mot vind og regn.',
  },
};

const FLEECE_IDS = /fleece/i;
const MITTEN_IDS = /vott/i;
const FOOTWEAR_IDS = /(sko|sokk|toffel|sandal)/i;
const HEAD_AND_NECK_IDS = /(lue|balaklava|hals|solhatt)/i;
const SLEEP_IDS = /(sovepose|pyjamas)/i;
const COTTON_IDS = /(body|t-skjorte|shorts|lett-bukse|tynn-bukse|bomull)/i;
const STROLLER_IDS = /(teppe|varmepose|sauekinn|regntrekk)/i;
const WOOL_IDS = /ull/i;

export function garmentFactFor(
  id: GarmentId,
  language: string | null | undefined,
): GarmentFact {
  const languageBase = language?.trim().toLowerCase().split(/[-_]/, 1)[0];
  const normalizedLanguage: GarmentFactLanguage =
    languageBase === 'sv' || languageBase === 'da' || languageBase === 'no'
      ? languageBase
      : 'en';

  let key: FactKey = 'layers';
  if (FLEECE_IDS.test(id)) key = 'fleece';
  else if (MITTEN_IDS.test(id)) key = 'mittens';
  else if (FOOTWEAR_IDS.test(id)) key = 'footwear';
  else if (HEAD_AND_NECK_IDS.test(id)) key = 'headAndNeck';
  else if (SLEEP_IDS.test(id)) key = 'sleep';
  else if (STROLLER_IDS.test(id)) key = 'stroller';
  else if (WOOL_IDS.test(id)) key = 'wool';
  else if (COTTON_IDS.test(id)) key = 'cotton';

  const fact = FACTS[key];
  const source = SOURCES[fact.source];
  return {
    text: fact[normalizedLanguage],
    sourceLabel: source.label,
    sourceUrl: source.url,
  };
}
