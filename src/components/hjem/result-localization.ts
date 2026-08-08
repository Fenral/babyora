export type ResultLanguage = 'da' | 'en' | 'no' | 'sv';

type ResultCopy = Readonly<{
  carouselLabel: string;
  carouselHint: string;
  title: string;
  overviewTitle: string;
  overviewProgress: string;
  empty: string;
  progressLabel: string;
  details: string;
  moreInfo: string;
  goodToKnow: string;
  alternatives: string;
  alternativesAria: (name: string) => string;
  detailAria: (name: string, role: string) => string;
  openGarment: (name: string) => string;
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
    carouselHint: 'Move horizontally between the outfit overview and each garment.',
    title: "Today's outfit",
    overviewTitle: 'All garments',
    overviewProgress: 'Outfit overview',
    empty: 'No garments to show yet.',
    progressLabel: 'Dressing order',
    details: 'See details',
    moreInfo: 'More info',
    goodToKnow: 'Good to know',
    alternatives: 'Alternatives',
    alternativesAria: (name) => `Compare alternatives to ${name}`,
    detailAria: (name, role) => `${name}, ${role}. Details.`,
    openGarment: (name) => `Show ${name}`,
    order: (position, total) => `Garment ${position} of ${total}`,
    progress: (position, total) => `Garment ${position} of ${total}`,
    childSummary: (count, childName) => `${count} garments for ${childName}, base to outer layer`,
    role: (role) => ROLE.en[role] ?? role,
  },
  sv: {
    carouselLabel: 'Klä på steg för steg',
    carouselHint: 'Flytta i sidled mellan klädöversikten och varje plagg.',
    title: 'Dagens kläder',
    overviewTitle: 'Alla plagg',
    overviewProgress: 'Klädöversikt',
    empty: 'Det finns inga plagg att visa ännu.',
    progressLabel: 'Påklädningsordning',
    details: 'Visa detaljer',
    moreInfo: 'Mer info',
    goodToKnow: 'Bra att veta',
    alternatives: 'Alternativ',
    alternativesAria: (name) => `Jämför alternativ till ${name}`,
    detailAria: (name, role) => `${name}, ${role}. Detaljer.`,
    openGarment: (name) => `Visa ${name}`,
    order: (position, total) => `Plagg ${position} av ${total}`,
    progress: (position, total) => `Plagg ${position} av ${total}`,
    childSummary: (count, childName) => `${count} plagg för ${childName}, innerst till ytterst`,
    role: (role) => ROLE.sv[role] ?? role,
  },
  da: {
    carouselLabel: 'Giv tøjet på trin for trin',
    carouselHint: 'Bevæg dig sidelæns mellem tøjoversigten og hver beklædningsdel.',
    title: 'Dagens tøj',
    overviewTitle: 'Alt tøj',
    overviewProgress: 'Tøjoversigt',
    empty: 'Der er ingen beklædning at vise endnu.',
    progressLabel: 'Påklædningsrækkefølge',
    details: 'Se detaljer',
    moreInfo: 'Mere info',
    goodToKnow: 'Godt at vide',
    alternatives: 'Alternativer',
    alternativesAria: (name) => `Sammenlign alternativer til ${name}`,
    detailAria: (name, role) => `${name}, ${role}. Detaljer.`,
    openGarment: (name) => `Vis ${name}`,
    order: (position, total) => `Del ${position} af ${total}`,
    progress: (position, total) => `Del ${position} af ${total}`,
    childSummary: (count, childName) => `${count} dele til ${childName}, inderst til yderst`,
    role: (role) => ROLE.da[role] ?? role,
  },
  no: {
    carouselLabel: 'Kle på, steg for steg',
    carouselHint: 'Flytt bortover mellom antrekksoversikten og hvert plagg.',
    title: 'Dagens antrekk',
    overviewTitle: 'Alle plagg',
    overviewProgress: 'Antrekkoversikt',
    empty: 'Ingen plagg å vise ennå.',
    progressLabel: 'Påkledningsrekkefølge',
    details: 'Se detaljer',
    moreInfo: 'Mer info',
    goodToKnow: 'Godt å vite',
    alternatives: 'Alternativer',
    alternativesAria: (name) => `Sammenlign alternativer til ${name}`,
    detailAria: (name, role) => `${name}, ${role}. Detaljer.`,
    openGarment: (name) => `Vis ${name}`,
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
