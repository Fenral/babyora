import type { WeatherHourly, WeatherNow } from '../met-no/types.js';
import type { MockActivity } from '../../mock-data.js';
import {
  precipitationOnTheWay,
  sunShadeStroller,
  tempDrop,
  tripPackingTip,
  windInWarmth,
} from './rules.js';
import type { WeatherNote } from './types.js';

/**
 * Kjører alle regler og returnerer notatene i rekkefølge:
 * warning først (nedbør/snø), så tips, så info.
 * Maks 3 notater synlig i UI.
 *
 * Tur-modus: tripPackingTip slår sammen 24t-vær til én samlet pakkeliste,
 * og erstatter tempDrop + precipitationOnTheWay for å unngå støy.
 */
export function analyze(
  now: WeatherNow,
  hourly: WeatherHourly[],
  activity: MockActivity,
): WeatherNote[] {
  const isTrip = activity === 'tur';

  const candidates: (WeatherNote | null)[] = isTrip
    ? [
        tripPackingTip(now, hourly, activity),
        windInWarmth(now),
      ]
    : [
        precipitationOnTheWay(now, hourly),
        windInWarmth(now),
        sunShadeStroller(now, activity),
        tempDrop(hourly),
      ];

  const notes = candidates.filter((n): n is WeatherNote => n !== null);
  const order: Record<WeatherNote['severity'], number> = {
    warning: 0,
    tip: 1,
    info: 2,
  };
  notes.sort((a, b) => order[a.severity] - order[b.severity]);
  return notes.slice(0, 3);
}
