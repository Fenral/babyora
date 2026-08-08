import type { WhyContext } from '../../data/garment-info';

export type ResultLanguage = 'da' | 'en' | 'no' | 'sv';

type ResultCopy = Readonly<{
  carouselLabel: string;
  title: string;
  hint: string;
  empty: string;
  progressLabel: string;
  previous: string;
  next: string;
  whyButton: string;
  whyTitle: string;
  whyAria: string;
  factTitle: string;
  factAria: string;
  details: string;
  sourceNewWindow: (source: string) => string;
  detailAria: (name: string, role: string) => string;
  order: (position: number, total: number) => string;
  progress: (position: number, total: number) => string;
  childSummary: (count: number, childName: string) => string;
  role: (role: string) => string;
}>;

const ROLE: Record<ResultLanguage, Record<string, string>> = {
  en: { Innerst: 'Base layer', Mellomlag: 'Mid layer', Ytterst: 'Outer layer', Tilbehør: 'Accessory' },
  sv: { Innerst: 'Innerlager', Mellomlag: 'Mellanlager', Ytterst: 'Ytterlager', Tilbehør: 'Tillbehör' },
  da: { Innerst: 'Inderste lag', Mellomlag: 'Mellemlag', Ytterst: 'Yderlag', Tilbehør: 'Tilbehør' },
  no: { Innerst: 'Innerst', Mellomlag: 'Mellomlag', Ytterst: 'Ytterst', Tilbehør: 'Tilbehør' },
};

const COPY: Record<ResultLanguage, ResultCopy> = {
  en: {
    carouselLabel: 'Dress step by step',
    title: "Today's outfit",
    hint: 'Swipe sideways, from the base layer to the outer layer.',
    empty: 'No garments to show yet.',
    progressLabel: 'Dressing order',
    previous: 'Previous garment',
    next: 'Next garment',
    whyButton: 'Why this outfit?',
    whyTitle: 'Why today',
    whyAria: 'Why this garment',
    factTitle: 'Good to know',
    factAria: 'Garment fact',
    details: 'See details',
    sourceNewWindow: (source) => `Source: ${source}. Opens in a new window.`,
    detailAria: (name, role) => `${name}, ${role}. Details.`,
    order: (position, total) => `Garment ${position} of ${total}`,
    progress: (position, total) => `Garment ${position} of ${total}`,
    childSummary: (count, childName) => `${count} garments for ${childName}, base to outer layer`,
    role: (role) => ROLE.en[role] ?? role,
  },
  sv: {
    carouselLabel: 'Klä på steg för steg',
    title: 'Dagens kläder',
    hint: 'Svep åt sidan, från innersta till yttersta lagret.',
    empty: 'Det finns inga plagg att visa ännu.',
    progressLabel: 'Påklädningsordning',
    previous: 'Föregående plagg',
    next: 'Nästa plagg',
    whyButton: 'Varför just de här kläderna?',
    whyTitle: 'Varför i dag',
    whyAria: 'Varför det här plagget',
    factTitle: 'Bra att veta',
    factAria: 'Fakta om plagget',
    details: 'Visa detaljer',
    sourceNewWindow: (source) => `Källa: ${source}. Öppnas i ett nytt fönster.`,
    detailAria: (name, role) => `${name}, ${role}. Detaljer.`,
    order: (position, total) => `Plagg ${position} av ${total}`,
    progress: (position, total) => `Plagg ${position} av ${total}`,
    childSummary: (count, childName) => `${count} plagg för ${childName}, innerst till ytterst`,
    role: (role) => ROLE.sv[role] ?? role,
  },
  da: {
    carouselLabel: 'Giv tøjet på trin for trin',
    title: 'Dagens tøj',
    hint: 'Stryg til siden, fra det inderste til det yderste lag.',
    empty: 'Der er ingen beklædning at vise endnu.',
    progressLabel: 'Påklædningsrækkefølge',
    previous: 'Forrige beklædningsdel',
    next: 'Næste beklædningsdel',
    whyButton: 'Hvorfor netop dette tøj?',
    whyTitle: 'Hvorfor i dag',
    whyAria: 'Hvorfor denne beklædningsdel',
    factTitle: 'Godt at vide',
    factAria: 'Fakta om beklædningen',
    details: 'Se detaljer',
    sourceNewWindow: (source) => `Kilde: ${source}. Åbnes i et nyt vindue.`,
    detailAria: (name, role) => `${name}, ${role}. Detaljer.`,
    order: (position, total) => `Del ${position} af ${total}`,
    progress: (position, total) => `Del ${position} af ${total}`,
    childSummary: (count, childName) => `${count} dele til ${childName}, inderst til yderst`,
    role: (role) => ROLE.da[role] ?? role,
  },
  no: {
    carouselLabel: 'Kle på, steg for steg',
    title: 'Dagens antrekk',
    hint: 'Sveip bortover, fra innerst til ytterst.',
    empty: 'Ingen plagg å vise ennå.',
    progressLabel: 'Påkledningsrekkefølge',
    previous: 'Forrige plagg',
    next: 'Neste plagg',
    whyButton: 'Hvorfor akkurat dette?',
    whyTitle: 'Hvorfor i dag',
    whyAria: 'Hvorfor dette plagget',
    factTitle: 'Kort fortalt',
    factAria: 'Fakta om plagget',
    details: 'Se detaljer',
    sourceNewWindow: (source) => `Kilde: ${source}. Åpnes i nytt vindu.`,
    detailAria: (name, role) => `${name}, ${role}. Detaljer.`,
    order: (position, total) => `Plagg ${position} av ${total}`,
    progress: (position, total) => `Plagg ${position} av ${total}`,
    childSummary: (count, childName) => `${count} plagg for ${childName}, innerst til ytterst`,
    role: (role) => ROLE.no[role] ?? role,
  },
};

export function resultLanguage(language: string | null | undefined): ResultLanguage {
  const base = language?.trim().toLowerCase().split(/[-_]/, 1)[0];
  if (base === 'sv' || base === 'da' || base === 'no') return base;
  return 'en';
}

export function resultCopyFor(language: string | null | undefined): ResultCopy {
  return COPY[resultLanguage(language)];
}

const MID_IDS = /(ull-mellomlag|ull-jakke|ull-bukse|fleece)/i;
const OUTER_IDS = /(dress|skall|regntoy|regnponcho)/i;
const TARGETED_IDS = /(lue|balaklava|hals|vott|sko|sokk)/i;
const SLEEP_IDS = /(sovepose|pyjamas)/i;

export function localizedWhyForGarment(
  id: string,
  context: WhyContext,
  language: string | null | undefined,
  localizedRole: string,
): string {
  const lang = resultLanguage(language);
  const feels = Math.round(context.feelsLikeC);
  const rainy = context.precipMmH >= 0.2;
  const windy = context.windMs >= 5;

  if (OUTER_IDS.test(id) && rainy) {
    if (lang === 'sv') return 'Regn väntas, så detta hjälper till att hålla lagren under torra.';
    if (lang === 'da') return 'Der ventes regn, så dette hjælper med at holde lagene under tørt.';
    if (lang === 'no') return 'Det er ventet regn, så dette bidrar til å holde lagene under tørre.';
    return 'Rain is expected, so this helps keep the layers underneath dry.';
  }
  if (OUTER_IDS.test(id) && windy) {
    if (lang === 'sv') return `Vinden är ${Math.round(context.windMs)} m/s, så detta skyddar de varma lagren under.`;
    if (lang === 'da') return `Vinden er ${Math.round(context.windMs)} m/s, så dette beskytter de varme lag under.`;
    if (lang === 'no') return `Vinden er ${Math.round(context.windMs)} m/s, så dette beskytter de varme lagene under.`;
    return `The wind is ${Math.round(context.windMs)} m/s, so this protects the warm layers underneath.`;
  }
  if (SLEEP_IDS.test(id)) {
    if (lang === 'sv') return `Vid ${feels} °C ingår detta i den valda lager-på-lager-lösningen för sömn.`;
    if (lang === 'da') return `Ved ${feels} °C indgår dette i den valgte lag-på-lag-løsning til søvn.`;
    if (lang === 'no') return `Ved ${feels} °C inngår dette i lagene som er valgt for søvn.`;
    return `At ${feels}°C, this forms part of the selected sleep layering.`;
  }
  if (MID_IDS.test(id)) {
    if (lang === 'sv') return `Vid ${feels} °C ger detta ${context.childName} ett mellanlager som är lätt att justera.`;
    if (lang === 'da') return `Ved ${feels} °C giver dette ${context.childName} et mellemlag, som er let at justere.`;
    if (lang === 'no') return `Ved ${feels} °C gir dette ${context.childName} et mellomlag som er lett å justere.`;
    return `At ${feels}°C, this gives ${context.childName} an adjustable mid layer.`;
  }
  if (TARGETED_IDS.test(id)) {
    if (lang === 'sv') return `Vid ${feels} °C ger detta riktad värme där den behövs.`;
    if (lang === 'da') return `Ved ${feels} °C giver dette målrettet varme, hvor der er brug for den.`;
    if (lang === 'no') return `Ved ${feels} °C gir dette ekstra varme der det trengs.`;
    return `At ${feels}°C, this adds targeted warmth where it is needed.`;
  }

  if (lang === 'sv') return `Det här är lagret “${localizedRole.toLowerCase()}” som Babyora valt vid ${feels} °C.`;
  if (lang === 'da') return `Dette er laget “${localizedRole.toLowerCase()}”, som Babyora har valgt ved ${feels} °C.`;
  if (lang === 'no') return `Dette er laget «${localizedRole.toLowerCase()}» som Babyora har valgt ved ${feels} °C.`;
  return `This is the ${localizedRole.toLowerCase()} Babyora chose at ${feels}°C.`;
}
