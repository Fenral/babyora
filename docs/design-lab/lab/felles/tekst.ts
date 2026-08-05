/**
 * Klarspråk-hjelpere for laben — norsk 3.–5. trinn, INV-1-grammatikken:
 * forhold → konsekvens → plagghandling.
 *
 * Skamfri doktrine: tekstene beskriver været og neste handling — de
 * evaluerer ALDRI fortidige valg («i går kledde du for tynt» finnes ikke).
 *
 * Forbudt retorikk (bindende, spec §2.4): ordet «verifisert» og formen
 * «stemte N av N» skal aldri forekomme i noen prototype.
 */

import type { ScenarioWeather } from './scenarier';
import { feelsLikeC } from '@lib/met-no/feels-like';

export const FORBUDTE_MONSTRE: RegExp[] = [
  /verifisert/i,
  /stemte\s+\d+\s+av\s+\d+/i,
];

/** true hvis teksten bryter forbudslisten — brukes i tester/dev-sjekk. */
export function harForbudtSprak(tekst: string): boolean {
  return FORBUDTE_MONSTRE.some((re) => re.test(tekst));
}

export type ForholdKonsekvens = {
  /** Værforholdet i klarspråk («Vind og kulde»). */
  forhold: string;
  /** Konsekvensen for barnet + hva plagget gjør («Vinden biter — …»). */
  konsekvens: string;
};

/**
 * Værforhold → norsk konsekvenssetning. Én dominant innsikt per flate
 * (INV-1): den mest beslutningsrelevante egenskapen ved været vinner.
 */
export function vaerTilKonsekvens(weather: ScenarioWeather): ForholdKonsekvens {
  const feels = feelsLikeC(weather.tempC, weather.windMs);
  const kaldt = feels < 10;
  const sludd =
    weather.precipMmH > 0.3 && weather.tempC >= -1 && weather.tempC <= 2;

  if (sludd) {
    return {
      forhold: 'Sludd rundt frysepunktet',
      konsekvens:
        'Våte klær varmer ikke — tett ytterlag holder barnet tørt og varmt',
    };
  }
  if (weather.precipMmH > 0.3 && weather.tempC > 2) {
    return {
      forhold: 'Regn',
      konsekvens: 'Regnet trekker inn — regntrekk og tett yttertøy holder barnet tørt',
    };
  }
  if (weather.windMs >= 5 && kaldt) {
    return {
      forhold: 'Vind og kulde',
      konsekvens: 'Vinden biter — halsedisse holder trekken ute',
    };
  }
  if (feels <= -10) {
    return {
      forhold: 'Streng kulde',
      konsekvens:
        'Kulden tar raskt på små kropper — korte turer og fullt vinterlag',
    };
  }
  if (feels <= 0) {
    return {
      forhold: 'Frost',
      konsekvens: 'Frosten kjøler hender og hode først — votter og lue på',
    };
  }
  if (feels >= 20) {
    return {
      forhold: 'Varmt',
      konsekvens: 'Barnet blir fort for varmt — tynne lag og skygge',
    };
  }
  return {
    forhold: 'Kjølig og rolig vær',
    konsekvens: 'Vanlige lag holder — kjenn på nakken underveis',
  };
}

/**
 * Svakeste premiss i beslutningsgrunnlaget (INV-3: kvitteringen navngir
 * det usikreste leddet — aldri en seremoni, alltid etterprøvbart).
 */
export function usikrestPremiss(weather: ScenarioWeather): string {
  if (weather.windMs >= 4) return 'vindmålingen';
  if (weather.precipMmH > 0) return 'nedbørsmengden';
  return 'temperaturen om to timer';
}

/**
 * Delta i klarspråk — alltid som neste handling med synlig baseline,
 * aldri dom over gårsdagen (INV-6).
 */
export function deltaSetning(
  iGaar: ScenarioWeather,
  iDag: ScenarioWeather,
): string {
  const feelsIGaar = Math.round(feelsLikeC(iGaar.tempC, iGaar.windMs));
  const feelsIDag = Math.round(feelsLikeC(iDag.tempC, iDag.windMs));
  const diff = feelsIDag - feelsIGaar;
  if (diff <= -3) {
    return `Kaldere enn i går (føltes ${feelsIGaar} °C, føles nå ${feelsIDag} °C) — legg til et lag`;
  }
  if (diff >= 3) {
    return `Varmere enn i går (føltes ${feelsIGaar} °C, føles nå ${feelsIDag} °C) — ta av et lag`;
  }
  return `Omtrent som i går (føltes ${feelsIGaar} °C, føles nå ${feelsIDag} °C) — samme lag holder`;
}

/** Fast, konkret neste sikre handling i degradert tilstand. */
export const DEGRADERT_NESTE_HANDLING =
  'Kle etter årstid. Kjenn på nakken før dere går.';
