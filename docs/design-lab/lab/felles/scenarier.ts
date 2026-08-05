/**
 * Ti deterministiske scenarier — delt fikstursett for alle fire prototyper
 * (spec §2.3 / Sols ti scenarier). Ingen IO, ingen Date.now(): all tid er
 * fikserte klokkeslett-strenger slik at hver kjøring er identisk.
 *
 * Barnet er 8 mnd i alle scenarier (S2/S3-grensen — mest informative alder
 * for motorens aldersbetingede regler).
 */

import type { Activity } from '@lib/wool-layers/types';

export type ScenarioWeather = {
  tempC: number;
  windMs: number;
  precipMmH: number;
  /** met.no symbolCode, eks. "partlycloudy_day", "sleet", "lightsnow". */
  symbolCode: string;
};

export type ScenarioFlags = {
  /** UI-flagg: Dynamic Type-tilstand — all tekst skaleres 1.4×. */
  storTekst?: boolean;
  /** UI-flagg: utendørslys — maksimal kontrast (rent sort på hvitt). */
  hoyKontrast?: boolean;
  /** Rådet vises for en annen omsorgsperson enn den som ba om det. */
  nyOmsorgsperson?: boolean;
  /** Rådets gyldighet er passert → strukturell maskering (INV-2). */
  utlopt?: boolean;
};

export type Scenario = {
  id: string;
  navn: string;
  beskrivelse: string;
  /** null = værdata mangler → degradert tilstand (aldri gjetting). */
  weather: ScenarioWeather | null;
  /** Kun endret-vaer: gårsdagens datasett, for delta med synlig baseline. */
  weatherIGaar?: ScenarioWeather;
  child: { ageMonths: number };
  activity: Activity;
  vognMode?: 'awake' | 'sleeping';
  /** Skal barnet i bilstol etter/under turen? (HB-9-kontekst.) */
  bilstol?: boolean;
  /** Fiksert «nå»-klokkeslett for scenariet (determinisme). */
  naa: string;
  /** Absolutt gyldighet for rådet, «HH:MM» (INV-2). */
  gyldigTil: string;
  flags: ScenarioFlags;
};

const BARN_8_MND = { ageMonths: 8 } as const;

export const SCENARIER: Scenario[] = [
  {
    id: 'normal-dag',
    navn: 'Normal dag',
    beskrivelse:
      'Vanlig kjølig høstdag, vogntur. Ingen blocks, ingen særtilstander — grunnlinjen alle andre scenarier avviker fra.',
    weather: { tempC: 5, windMs: 3, precipMmH: 0, symbolCode: 'partlycloudy_day' },
    child: BARN_8_MND,
    activity: 'vogn',
    vognMode: 'awake',
    naa: '10:15',
    gyldigTil: '12:00',
    flags: {},
  },
  {
    id: 'grensevaer',
    navn: 'Grensevær (0 °C sludd)',
    beskrivelse:
      'Rundt frysepunktet med sludd — våt kulde, den farligste sonen for feilkledning. Tester nedbørs- og fuktlogikk.',
    weather: { tempC: 0, windMs: 4, precipMmH: 1.2, symbolCode: 'sleet' },
    child: BARN_8_MND,
    activity: 'vogn',
    vognMode: 'awake',
    naa: '09:40',
    gyldigTil: '11:30',
    flags: {},
  },
  {
    id: 'sovende-vognbarn',
    navn: 'Sovende vognbarn (−5 °C)',
    beskrivelse:
      'Barnet sover i vognen i frost. Base-outfit hentes fra søvntabellen (temp-aware sovepose), utendørs-modifikatorer gjelder fortsatt.',
    weather: { tempC: -5, windMs: 2, precipMmH: 0, symbolCode: 'clearsky_day' },
    child: BARN_8_MND,
    activity: 'vogn',
    vognMode: 'sleeping',
    naa: '12:30',
    gyldigTil: '14:00',
    flags: {},
  },
  {
    id: 'bilstol',
    navn: 'Bilstol i vinterkulde',
    beskrivelse:
      'Barnet skal i bilstol etter turen, −8 °C. HB-9 skal fjerne vatterte dresser og foreslå kjørepose i stedet.',
    weather: { tempC: -8, windMs: 3, precipMmH: 0, symbolCode: 'cloudy' },
    child: BARN_8_MND,
    activity: 'vogn',
    vognMode: 'awake',
    bilstol: true,
    naa: '15:05',
    gyldigTil: '16:30',
    flags: {},
  },
  {
    id: 'manglende-vaerdata',
    navn: 'Manglende værdata',
    beskrivelse:
      'Værtjenesten svarer ikke — motoren har ingen input. Degradert tilstand: strukturell maskering + konkret neste sikre handling.',
    weather: null,
    child: BARN_8_MND,
    activity: 'vogn',
    vognMode: 'awake',
    naa: '08:20',
    gyldigTil: '08:20',
    flags: {},
  },
  {
    id: 'endret-vaer',
    navn: 'Endret vær (delta)',
    beskrivelse:
      'Mildt i går, vind og kulde i dag. Delta skal vises med synlig, versjonert baseline — aldri dom over gårsdagens valg (INV-6).',
    weather: { tempC: 0, windMs: 7, precipMmH: 0, symbolCode: 'cloudy' },
    weatherIGaar: { tempC: 6, windMs: 2, precipMmH: 0, symbolCode: 'fair_day' },
    child: BARN_8_MND,
    activity: 'vogn',
    vognMode: 'awake',
    naa: '10:00',
    gyldigTil: '11:45',
    flags: {},
  },
  {
    id: 'utlopt-raad',
    navn: 'Utløpt råd',
    beskrivelse:
      'Rådet ble beregnet i morges og gyldigheten er passert. Stale = strukturell maskering, aldri dimming (INV-2).',
    weather: { tempC: 3, windMs: 3, precipMmH: 0.3, symbolCode: 'lightrain' },
    child: BARN_8_MND,
    activity: 'vogn',
    vognMode: 'awake',
    naa: '13:50',
    gyldigTil: '09:30',
    flags: { utlopt: true },
  },
  {
    id: 'ny-omsorgsperson',
    navn: 'Ny omsorgsperson',
    beskrivelse:
      'Samme vær som normal dag, men rådet leses av en som ikke ba om det (besteforelder/barnevakt). Proveniens og gyldighet må bære seg selv.',
    weather: { tempC: 5, windMs: 3, precipMmH: 0, symbolCode: 'partlycloudy_day' },
    child: BARN_8_MND,
    activity: 'vogn',
    vognMode: 'awake',
    naa: '10:15',
    gyldigTil: '12:00',
    flags: { nyOmsorgsperson: true },
  },
  {
    id: 'dynamic-type',
    navn: 'Dynamic Type (stor tekst)',
    beskrivelse:
      'Brukeren har stor tekst aktivert i OS-et. All tekst skaleres 1.4× — layouten må tåle det uten kutt eller overlapp.',
    weather: { tempC: 5, windMs: 3, precipMmH: 0, symbolCode: 'partlycloudy_day' },
    child: BARN_8_MND,
    activity: 'vogn',
    vognMode: 'awake',
    naa: '10:15',
    gyldigTil: '12:00',
    flags: { storTekst: true },
  },
  {
    id: 'utendorslys',
    navn: 'Utendørslys (høykontrast)',
    beskrivelse:
      'Skjermen leses i direkte dagslys med hansker halvt på. Maksimal kontrast, ingen lyse gråtoner.',
    weather: { tempC: -2, windMs: 5, precipMmH: 0, symbolCode: 'clearsky_day' },
    child: BARN_8_MND,
    activity: 'vogn',
    vognMode: 'awake',
    naa: '11:10',
    gyldigTil: '12:45',
    flags: { hoyKontrast: true },
  },
];

export function scenarioForId(id: string): Scenario | undefined {
  return SCENARIER.find((s) => s.id === id);
}
