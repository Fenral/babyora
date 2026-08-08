import type { GarmentCategory } from '../../data/garment-category.js';
import type { MaterialFamily } from '../../lib/clothing-engine-v2/types.js';
import type { LayerCategory } from '../../lib/wool-layers/types.js';

export type KlePaaLanguage = 'da' | 'en' | 'no' | 'sv';

export type KlePaaCopy = Readonly<{
  stepper: Readonly<{
    label: string;
    close: string;
    empty: string;
    step: (position: number, total: number) => string;
    liveStep: (position: number, total: number, garment: string) => string;
    swap: string;
    swapAria: (garment: string) => string;
    previous: string;
    next: string;
    finish: string;
  }>;
  detail: Readonly<{
    closeAria: string;
    factTitle: string;
    whenTitle: string;
    advantages: string;
    disadvantages: string;
    alternatives: string;
    advantagePrefix: string;
    disadvantagePrefix: string;
    libraryLink: string;
    sourceAria: (source: string) => string;
  }>;
  roles: Readonly<Record<LayerCategory, string>>;
  categories: Readonly<Record<GarmentCategory, string>>;
  materialPoints: Readonly<Record<MaterialFamily, string>>;
}>;

const ENGLISH = {
  stepper: {
    label: 'Dress step by step',
    close: 'Close',
    empty: 'There are no garments to show.',
    step: (position: number, total: number) => `Step ${position} of ${total}`,
    liveStep: (position: number, total: number, garment: string) =>
      `Step ${position} of ${total}. ${garment}.`,
    swap: 'Change garment',
    swapAria: (garment: string) => `Change garment: ${garment}`,
    previous: 'Previous',
    next: 'Next',
    finish: 'Done',
  },
  detail: {
    closeAria: 'Close garment details',
    factTitle: 'Good to know',
    whenTitle: 'When it works well',
    advantages: 'Advantages',
    disadvantages: 'Trade-offs',
    alternatives: 'Alternative garments',
    advantagePrefix: 'Advantage: ',
    disadvantagePrefix: 'Trade-off: ',
    libraryLink: 'See alternatives in the library',
    sourceAria: (source: string) => `Source: ${source}. Opens in a new window.`,
  },
  roles: {
    innerst: 'Base layer',
    mellomlag: 'Mid layer',
    yttertoy: 'Outer layer',
    ekstra: 'Accessory',
    utstyr: 'Accessory',
  },
  categories: {
    innerst: 'Base layer',
    mellomlag: 'Mid layer',
    yttertoy: 'Outerwear',
    ekstra: 'Accessories',
    utstyr: 'Equipment',
  },
  materialPoints: {
    wool: 'Wool manages moisture and helps even out temperature.',
    synthetic_wicking: 'Technical fibres move moisture away from the skin.',
    fleece: 'Fleece is lightweight and quick-drying; add a shell for wind.',
    cotton: 'Cotton holds moisture and dries slowly, so it works best when dry.',
    shell: 'A shell blocks wind and rain but adds little warmth on its own.',
    synthetic_insulation: 'Synthetic insulation can retain warmth when damp.',
    down: 'Down is warm for its weight but performs less well when wet.',
    blend: 'A fabric blend balances warmth and drying time.',
  },
} satisfies KlePaaCopy;

const SWEDISH = {
  stepper: {
    label: 'Klä på steg för steg',
    close: 'Stäng',
    empty: 'Det finns inga plagg att visa.',
    step: (position: number, total: number) => `Steg ${position} av ${total}`,
    liveStep: (position: number, total: number, garment: string) =>
      `Steg ${position} av ${total}. ${garment}.`,
    swap: 'Byt plagg',
    swapAria: (garment: string) => `Byt plagg: ${garment}`,
    previous: 'Föregående',
    next: 'Nästa',
    finish: 'Klar',
  },
  detail: {
    closeAria: 'Stäng plagginformationen',
    factTitle: 'Bra att veta',
    whenTitle: 'När det passar bra',
    advantages: 'Fördelar',
    disadvantages: 'Avvägningar',
    alternatives: 'Alternativa plagg',
    advantagePrefix: 'Fördel: ',
    disadvantagePrefix: 'Avvägning: ',
    libraryLink: 'Se alternativ i biblioteket',
    sourceAria: (source: string) => `Källa: ${source}. Öppnas i ett nytt fönster.`,
  },
  roles: {
    innerst: 'Innerlager',
    mellomlag: 'Mellanlager',
    yttertoy: 'Ytterlager',
    ekstra: 'Tillbehör',
    utstyr: 'Tillbehör',
  },
  categories: {
    innerst: 'Innerlager',
    mellomlag: 'Mellanlager',
    yttertoy: 'Ytterkläder',
    ekstra: 'Tillbehör',
    utstyr: 'Utrustning',
  },
  materialPoints: {
    wool: 'Ull hanterar fukt och hjälper till att jämna ut temperaturen.',
    synthetic_wicking: 'Tekniska fibrer leder bort fukt från huden.',
    fleece: 'Fleece är lätt och snabbtorkande; lägg till ett skal mot vind.',
    cotton: 'Bomull håller kvar fukt och torkar långsamt, så det passar bäst när det är torrt.',
    shell: 'Ett skal stoppar vind och regn men värmer lite på egen hand.',
    synthetic_insulation: 'Syntetisk isolering kan behålla värmen när den är fuktig.',
    down: 'Dun är varmt i förhållande till vikten men fungerar sämre när det blir vått.',
    blend: 'Ett blandmaterial balanserar värme och torktid.',
  },
} satisfies KlePaaCopy;

const DANISH = {
  stepper: {
    label: 'Giv tøjet på trin for trin',
    close: 'Luk',
    empty: 'Der er ingen beklædning at vise.',
    step: (position: number, total: number) => `Trin ${position} af ${total}`,
    liveStep: (position: number, total: number, garment: string) =>
      `Trin ${position} af ${total}. ${garment}.`,
    swap: 'Skift beklædning',
    swapAria: (garment: string) => `Skift beklædning: ${garment}`,
    previous: 'Forrige',
    next: 'Næste',
    finish: 'Færdig',
  },
  detail: {
    closeAria: 'Luk beklædningsdetaljer',
    factTitle: 'Godt at vide',
    whenTitle: 'Hvornår det passer godt',
    advantages: 'Fordele',
    disadvantages: 'Afvejninger',
    alternatives: 'Alternative beklædningsdele',
    advantagePrefix: 'Fordel: ',
    disadvantagePrefix: 'Afvejning: ',
    libraryLink: 'Se alternativer i biblioteket',
    sourceAria: (source: string) => `Kilde: ${source}. Åbnes i et nyt vindue.`,
  },
  roles: {
    innerst: 'Inderste lag',
    mellomlag: 'Mellemlag',
    yttertoy: 'Yderlag',
    ekstra: 'Tilbehør',
    utstyr: 'Tilbehør',
  },
  categories: {
    innerst: 'Inderste lag',
    mellomlag: 'Mellemlag',
    yttertoy: 'Ydertøj',
    ekstra: 'Tilbehør',
    utstyr: 'Udstyr',
  },
  materialPoints: {
    wool: 'Uld håndterer fugt og hjælper med at udligne temperaturen.',
    synthetic_wicking: 'Tekniske fibre leder fugt væk fra huden.',
    fleece: 'Fleece er let og hurtigtørrende; tilføj en skal mod vind.',
    cotton: 'Bomuld holder på fugt og tørrer langsomt, så det passer bedst i tørt vejr.',
    shell: 'En skal stopper vind og regn, men varmer kun lidt i sig selv.',
    synthetic_insulation: 'Syntetisk isolering kan bevare varmen, når den er fugtig.',
    down: 'Dun er varmt i forhold til vægten, men fungerer dårligere, når det bliver vådt.',
    blend: 'Et blandingsmateriale balancerer varme og tørretid.',
  },
} satisfies KlePaaCopy;

const NORWEGIAN = {
  stepper: {
    label: 'Kle på, steg for steg',
    close: 'Lukk',
    empty: 'Ingen plagg å vise.',
    step: (position: number, total: number) => `Steg ${position} av ${total}`,
    liveStep: (position: number, total: number, garment: string) =>
      `Steg ${position} av ${total}. ${garment}.`,
    swap: 'Bytt plagg',
    swapAria: (garment: string) => `Bytt plagg: ${garment}`,
    previous: 'Forrige',
    next: 'Neste',
    finish: 'Ferdig',
  },
  detail: {
    closeAria: 'Lukk plaggdetaljer',
    factTitle: 'Kort fortalt',
    whenTitle: 'Når passer det',
    advantages: 'Fordeler',
    disadvantages: 'Ulemper',
    alternatives: 'Alternative plagg',
    advantagePrefix: 'Fordel: ',
    disadvantagePrefix: 'Ulempe: ',
    libraryLink: 'Se alternativer i biblioteket',
    sourceAria: (source: string) => `Kilde: ${source}. Åpnes i nytt vindu.`,
  },
  roles: {
    innerst: 'Innerst',
    mellomlag: 'Mellomlag',
    yttertoy: 'Ytterst',
    ekstra: 'Tilbehør',
    utstyr: 'Tilbehør',
  },
  categories: {
    innerst: 'Innerst',
    mellomlag: 'Mellomlag',
    yttertoy: 'Yttertøy',
    ekstra: 'Ekstra',
    utstyr: 'Utstyr',
  },
  materialPoints: {
    wool: 'Ull håndterer fukt og bidrar til jevnere temperatur.',
    synthetic_wicking: 'Tekniske fibre leder fukt bort fra huden.',
    fleece: 'Fleece er lett og hurtigtørkende; legg til et skall mot vind.',
    cotton: 'Bomull holder på fukt og tørker sakte, så det passer best når det er tørt.',
    shell: 'Et skall stopper vind og regn, men varmer lite i seg selv.',
    synthetic_insulation: 'Syntetisk isolasjon kan holde på varmen når den er fuktig.',
    down: 'Dun er varmt i forhold til vekten, men fungerer dårligere når det blir vått.',
    blend: 'Et blandingsstoff balanserer varme og tørketid.',
  },
} satisfies KlePaaCopy;

const COPY: Readonly<Record<KlePaaLanguage, KlePaaCopy>> = {
  da: DANISH,
  en: ENGLISH,
  no: NORWEGIAN,
  sv: SWEDISH,
};

export function resolveKlePaaLanguage(
  i18nextLanguage: string | null | undefined,
  htmlLanguage?: string | null,
): KlePaaLanguage {
  const active = i18nextLanguage?.trim() || htmlLanguage?.trim() || '';
  const base = active.toLowerCase().split(/[-_]/, 1)[0];
  if (base === 'sv' || base === 'da' || base === 'no') return base;
  if (base === 'nb' || base === 'nn') return 'no';
  return 'en';
}

export function klePaaCopyFor(
  i18nextLanguage: string | null | undefined,
  htmlLanguage?: string | null,
): KlePaaCopy {
  return COPY[resolveKlePaaLanguage(i18nextLanguage, htmlLanguage)];
}
