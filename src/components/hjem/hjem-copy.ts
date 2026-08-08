import type { ScanStaleReason } from '../../lib/scan/types.js';

export type HjemLanguage = 'da' | 'en' | 'no' | 'sv';
export type HjemActivity = 'utelek' | 'vogn';

type ActivityCopy = Readonly<{
  context: string;
  toggle: string;
  lower: string;
}>;

export type HjemCtaCopy = Readonly<{
  ceremony: Readonly<{ label: string; line: string }>;
  reveal: Readonly<{ label: string; line: string }>;
}>;

export type HjemStaleCopy = Readonly<{
  headline: (reason: ScanStaleReason, activity: HjemActivity) => string;
  cta: (reason: ScanStaleReason, activity: HjemActivity) => string;
  changeChip: (from: HjemActivity, to: HjemActivity) => string;
  previousLabel: string;
  previousCount: (count: number) => string;
  showPrevious: string;
}>;

export type HjemCopy = Readonly<{
  activity: Readonly<Record<HjemActivity, ActivityCopy>>;
  ageMonths: (count: number) => string;
  weather: Readonly<{
    panelAria: (city: string) => string;
    fetching: string;
    feelsLike: (temperature: string) => string;
    freshNow: string;
    lastUpdated: (time: string) => string;
    weatherBased: (condition: string) => string;
    unavailable: string;
    lastKnownBadge: (time: string) => string;
    offlineTitle: string;
    offlineAge: (time: string) => string;
    retry: string;
    readyTitle: string;
    activityAria: string;
    adjustAria: string;
    adjust: string;
  }>;
  scan: Readonly<{
    panelAria: string;
    weatherNow: string;
    activity: string;
    layerByLayer: string;
    assembling: string;
    ready: string;
    calculating: (childName: string) => string;
    recalculating: (childName: string) => string;
    subline: string;
    skip: string;
  }>;
  stale: HjemStaleCopy;
  cta: HjemCtaCopy;
}>;

const ENGLISH_ACTIVITY: Readonly<Record<HjemActivity, ActivityCopy>> = {
  utelek: { context: 'Outdoor play', toggle: 'Out of stroller', lower: 'outdoor play' },
  vogn: { context: 'Stroller', toggle: 'In stroller', lower: 'the stroller' },
};

const SWEDISH_ACTIVITY: Readonly<Record<HjemActivity, ActivityCopy>> = {
  utelek: { context: 'Utomhuslek', toggle: 'Utanför barnvagnen', lower: 'utomhuslek' },
  vogn: { context: 'Barnvagn', toggle: 'I barnvagnen', lower: 'barnvagnen' },
};

const DANISH_ACTIVITY: Readonly<Record<HjemActivity, ActivityCopy>> = {
  utelek: { context: 'Udendørs leg', toggle: 'Uden for barnevognen', lower: 'udendørs leg' },
  vogn: { context: 'Barnevogn', toggle: 'I barnevognen', lower: 'barnevognen' },
};

const NORWEGIAN_ACTIVITY: Readonly<Record<HjemActivity, ActivityCopy>> = {
  utelek: { context: 'Utelek', toggle: 'Utenfor vogn', lower: 'utelek' },
  vogn: { context: 'Vogn', toggle: 'I vogn', lower: 'vogn' },
};

function englishStale(
  reason: ScanStaleReason,
  activity: HjemActivity,
): string {
  if (reason === 'identity-changed') {
    return `New outfit for ${ENGLISH_ACTIVITY[activity].lower}?`;
  }
  if (reason === 'weather-basis') return 'The weather has changed';
  return 'Could not calculate the outfit';
}

function swedishStale(
  reason: ScanStaleReason,
  activity: HjemActivity,
): string {
  if (reason === 'identity-changed') {
    return `Nya kläder för ${SWEDISH_ACTIVITY[activity].lower}?`;
  }
  if (reason === 'weather-basis') return 'Vädret har förändrats';
  return 'Kunde inte beräkna kläderna';
}

function danishStale(
  reason: ScanStaleReason,
  activity: HjemActivity,
): string {
  if (reason === 'identity-changed') {
    return `Nyt tøj til ${DANISH_ACTIVITY[activity].lower}?`;
  }
  if (reason === 'weather-basis') return 'Vejret har ændret sig';
  return 'Kunne ikke beregne tøjet';
}

function norwegianStale(
  reason: ScanStaleReason,
  activity: HjemActivity,
): string {
  if (reason === 'identity-changed') {
    return `Nytt antrekk for ${NORWEGIAN_ACTIVITY[activity].lower}?`;
  }
  if (reason === 'weather-basis') return 'Været har endret seg';
  return 'Fikk ikke beregnet antrekket';
}

const ENGLISH = {
  activity: ENGLISH_ACTIVITY,
  ageMonths: (count) => `${count} ${count === 1 ? 'month' : 'months'}`,
  weather: {
    panelAria: (city) => `Weather now in ${city}`,
    fetching: 'Fetching weather …',
    feelsLike: (temperature) => `Feels like ${temperature}°`,
    freshNow: 'Updated now',
    lastUpdated: (time) => `Last updated ${time}`,
    weatherBased: (condition) => `Weather-based: ${condition.toLocaleLowerCase('en-GB')}.`,
    unavailable: 'Weather is unavailable right now.',
    lastKnownBadge: (time) => `Last known weather · ${time}`,
    offlineTitle: 'The last known weather is enough',
    offlineAge: (time) => `From ${time} · outdoor conditions usually change little in an hour`,
    retry: 'Try fetching the weather again',
    readyTitle: 'Ready for a little trip?',
    activityAria: 'Activity',
    adjustAria: 'Adjust weather, location or activity',
    adjust: 'Adjust',
  },
  scan: {
    panelAria: 'Calculating outfit',
    weatherNow: 'Weather now',
    activity: 'Activity',
    layerByLayer: 'Layer by layer',
    assembling: 'putting it together…',
    ready: 'The outfit is ready',
    calculating: (childName) => `Putting together ${childName}’s outfit…`,
    recalculating: (childName) => `Updating ${childName}’s outfit…`,
    subline: 'Just a moment.',
    skip: 'Show the answer now',
  },
  stale: {
    headline: englishStale,
    cta: (reason, activity) => reason === 'identity-changed'
      ? `Show outfit for ${ENGLISH_ACTIVITY[activity].lower}`
      : 'Calculate again',
    changeChip: (from, to) =>
      `You changed from ${ENGLISH_ACTIVITY[from].lower} to ${ENGLISH_ACTIVITY[to].lower}`,
    previousLabel: 'PREVIOUS OUTFIT',
    previousCount: (count) => `${count} ${count === 1 ? 'garment' : 'garments'} calculated.`,
    showPrevious: 'Show previous outfit',
  },
  cta: {
    ceremony: {
      label: 'Find today’s outfit',
      line: 'Weather from met.no, guidance tailored to your child',
    },
    reveal: {
      label: 'Show today’s outfit',
      line: 'Same outfit as last time – it’s ready',
    },
  },
} satisfies HjemCopy;

const SWEDISH = {
  activity: SWEDISH_ACTIVITY,
  ageMonths: (count) => `${count} ${count === 1 ? 'månad' : 'månader'}`,
  weather: {
    panelAria: (city) => `Vädret just nu i ${city}`,
    fetching: 'Hämtar väder …',
    feelsLike: (temperature) => `Känns som ${temperature}°`,
    freshNow: 'Uppdaterat nu',
    lastUpdated: (time) => `Senast uppdaterat ${time}`,
    weatherBased: (condition) => `Väderbaserat: ${condition.toLocaleLowerCase('sv-SE')}.`,
    unavailable: 'Vädret är inte tillgängligt just nu.',
    lastKnownBadge: (time) => `Senast kända väder · ${time}`,
    offlineTitle: 'Vi klarar oss med det senast kända vädret',
    offlineAge: (time) => `Från ${time} · vädret utomhus förändras oftast lite på en timme`,
    retry: 'Försök hämta vädret igen',
    readyTitle: 'Redo för en liten tur?',
    activityAria: 'Aktivitet',
    adjustAria: 'Justera väder, plats eller aktivitet',
    adjust: 'Justera',
  },
  scan: {
    panelAria: 'Beräknar kläder',
    weatherNow: 'Vädret nu',
    activity: 'Aktivitet',
    layerByLayer: 'Lager för lager',
    assembling: 'sätter ihop…',
    ready: 'Kläderna är klara',
    calculating: (childName) => `Sätter ihop kläder för ${childName}…`,
    recalculating: (childName) => `Uppdaterar kläderna för ${childName}…`,
    subline: 'Det tar bara ett ögonblick.',
    skip: 'Visa svaret direkt',
  },
  stale: {
    headline: swedishStale,
    cta: (reason, activity) => reason === 'identity-changed'
      ? `Visa kläder för ${SWEDISH_ACTIVITY[activity].lower}`
      : 'Beräkna på nytt',
    changeChip: (from, to) =>
      `Du bytte från ${SWEDISH_ACTIVITY[from].lower} till ${SWEDISH_ACTIVITY[to].lower}`,
    previousLabel: 'FÖREGÅENDE KLÄDER',
    previousCount: (count) => `${count} ${count === 1 ? 'plagg beräknat' : 'plagg beräknade'}.`,
    showPrevious: 'Visa föregående kläder',
  },
  cta: {
    ceremony: {
      label: 'Hitta dagens kläder',
      line: 'Vädret från met.no, rådet anpassat till ditt barn',
    },
    reveal: {
      label: 'Visa dagens kläder',
      line: 'Samma kläder som sist – de är klara',
    },
  },
} satisfies HjemCopy;

const DANISH = {
  activity: DANISH_ACTIVITY,
  ageMonths: (count) => `${count} ${count === 1 ? 'måned' : 'måneder'}`,
  weather: {
    panelAria: (city) => `Vejret nu i ${city}`,
    fetching: 'Henter vejr …',
    feelsLike: (temperature) => `Føles som ${temperature}°`,
    freshNow: 'Opdateret nu',
    lastUpdated: (time) => `Sidst opdateret ${time}`,
    weatherBased: (condition) => `Vejrbaseret: ${condition.toLocaleLowerCase('da-DK')}.`,
    unavailable: 'Vejret er ikke tilgængeligt lige nu.',
    lastKnownBadge: (time) => `Senest kendte vejr · ${time}`,
    offlineTitle: 'Vi klarer os med det senest kendte vejr',
    offlineAge: (time) => `Fra ${time} · vejret udenfor ændrer sig som regel kun lidt på en time`,
    retry: 'Prøv at hente vejret igen',
    readyTitle: 'Klar til en lille tur?',
    activityAria: 'Aktivitet',
    adjustAria: 'Juster vejr, sted eller aktivitet',
    adjust: 'Juster',
  },
  scan: {
    panelAria: 'Beregner tøj',
    weatherNow: 'Vejret nu',
    activity: 'Aktivitet',
    layerByLayer: 'Lag for lag',
    assembling: 'sætter sammen…',
    ready: 'Tøjet er klart',
    calculating: (childName) => `Sammensætter tøj til ${childName}…`,
    recalculating: (childName) => `Opdaterer tøjet til ${childName}…`,
    subline: 'Det tager kun et øjeblik.',
    skip: 'Vis svaret med det samme',
  },
  stale: {
    headline: danishStale,
    cta: (reason, activity) => reason === 'identity-changed'
      ? `Vis tøj til ${DANISH_ACTIVITY[activity].lower}`
      : 'Beregn igen',
    changeChip: (from, to) =>
      `Du skiftede fra ${DANISH_ACTIVITY[from].lower} til ${DANISH_ACTIVITY[to].lower}`,
    previousLabel: 'FORRIGE TØJ',
    previousCount: (count) =>
      `${count} ${count === 1 ? 'beklædningsdel beregnet' : 'beklædningsdele beregnet'}.`,
    showPrevious: 'Vis forrige tøj',
  },
  cta: {
    ceremony: {
      label: 'Find dagens tøj',
      line: 'Vejret fra met.no, rådet tilpasset dit barn',
    },
    reveal: {
      label: 'Vis dagens tøj',
      line: 'Samme tøj som sidst – det er klart',
    },
  },
} satisfies HjemCopy;

const NORWEGIAN = {
  activity: NORWEGIAN_ACTIVITY,
  ageMonths: (count) => `${count} ${count === 1 ? 'måned' : 'måneder'}`,
  weather: {
    panelAria: (city) => `Været nå i ${city}`,
    fetching: 'Henter vær …',
    feelsLike: (temperature) => `Føles som ${temperature}°`,
    freshNow: 'Oppdatert nå',
    lastUpdated: (time) => `Sist oppdatert ${time}`,
    weatherBased: (condition) => `Værbasert: ${condition.toLocaleLowerCase('nb-NO')}.`,
    unavailable: 'Får ikke tak i været akkurat nå.',
    lastKnownBadge: (time) => `Sist kjente vær · ${time}`,
    offlineTitle: 'Vi klarer oss med sist kjente vær',
    offlineAge: (time) => `Fra ${time} · endringer ute er som regel små på en time`,
    retry: 'Prøv å hente været igjen',
    readyTitle: 'Klar for en liten tur?',
    activityAria: 'Aktivitet',
    adjustAria: 'Juster vær, sted eller aktivitet',
    adjust: 'Juster',
  },
  scan: {
    panelAria: 'Beregner antrekk',
    weatherNow: 'Været nå',
    activity: 'Aktivitet',
    layerByLayer: 'Lag for lag',
    assembling: 'setter sammen…',
    ready: 'Antrekket er klart',
    calculating: (childName) => `Kler på ${childName} i tankene…`,
    recalculating: (childName) => `Kler på ${childName} på nytt…`,
    subline: 'Tar bare et lite øyeblikk.',
    skip: 'Vis svaret med en gang',
  },
  stale: {
    headline: norwegianStale,
    cta: (reason, activity) => reason === 'identity-changed'
      ? `Se antrekk for ${NORWEGIAN_ACTIVITY[activity].lower}`
      : 'Beregn på nytt',
    changeChip: (from, to) =>
      `Du byttet fra ${NORWEGIAN_ACTIVITY[from].lower} til ${NORWEGIAN_ACTIVITY[to].lower}`,
    previousLabel: 'FORRIGE ANTREKK',
    previousCount: (count) => `${count} plagg beregnet.`,
    showPrevious: 'Vis forrige antrekk',
  },
  cta: {
    ceremony: {
      label: 'Finn dagens antrekk',
      line: 'Været fra met.no, rådet tilpasset barnet ditt',
    },
    reveal: {
      label: 'Vis dagens antrekk',
      line: 'Samme antrekk som sist – det er klart',
    },
  },
} satisfies HjemCopy;

const COPY: Readonly<Record<HjemLanguage, HjemCopy>> = Object.freeze({
  en: ENGLISH,
  sv: SWEDISH,
  da: DANISH,
  no: NORWEGIAN,
});

/** German and unknown languages intentionally use the English fallback. */
export function resolveHjemLanguage(language: unknown): HjemLanguage {
  if (typeof language !== 'string') return 'en';
  const base = language.trim().toLowerCase().split(/[-_]/u, 1)[0];
  if (base === 'nb' || base === 'nn') return 'no';
  if (base === 'sv' || base === 'da' || base === 'no') return base;
  return 'en';
}

export function hjemCopyFor(language: unknown): HjemCopy {
  return COPY[resolveHjemLanguage(language)];
}
