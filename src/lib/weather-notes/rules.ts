import type { WeatherHourly, WeatherNow } from '../met-no/types.js';
import type { MockActivity } from '../../mock-data.js';
import type { WeatherNote } from './types.js';

/**
 * Hver regel returnerer en WeatherNote eller null.
 * Rene funksjoner — gjør dem enkle å snapshot-teste senere.
 */

const CLEAR_SKY_REGEX = /clearsky|fair/i;
const SNOW_REGEX = /snow|sleet/i;

/** "20° men vind 7 m/s — føles som 14°" */
export function windInWarmth(now: WeatherNow): WeatherNote | null {
  if (now.tempC < 15) return null;
  const delta = now.tempC - now.feelsLikeC;
  if (delta < 4) return null;
  return {
    id: 'wind-in-warmth',
    severity: 'tip',
    message: `Det er ${Math.round(now.tempC)}° i lufta, men vinden gjør at det føles som ${Math.round(now.feelsLikeC)}°. Pass på å legge på ett ekstra lag — særlig i skyggen.`,
  };
}

/** Sol vs skygge i vogn ved 15–25° klart vær */
export function sunShadeStroller(
  now: WeatherNow,
  activity: MockActivity,
): WeatherNote | null {
  if (activity !== 'vogn') return null;
  if (now.tempC < 15 || now.tempC > 25) return null;
  if (!CLEAR_SKY_REGEX.test(now.symbolCode)) return null;
  return {
    id: 'sun-shade-stroller',
    severity: 'tip',
    message: `Varmt i sola, men under vogn-kalesjen i skygge kan det føles 3–5° kjøligere. Ha et lett lag tilgjengelig.`,
  };
}

/** Stor temperatur-svingning i løpet av 12 t → kveldtur-tips */
export function tempDrop(hourly: WeatherHourly[]): WeatherNote | null {
  if (hourly.length < 4) return null;
  const feels = hourly.map((h) => h.feelsLikeC);
  const max = Math.max(...feels);
  const min = Math.min(...feels);
  if (max - min < 6) return null;
  const coldHour = hourly[feels.indexOf(min)];
  if (!coldHour) return null;
  const coldClock = coldHour.time.toLocaleTimeString('nb-NO', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return {
    id: 'temp-drop',
    severity: 'tip',
    message: `Stor temperatur-forskjell i dag (${Math.round(min)}–${Math.round(max)}°). Kjøligst rundt kl ${coldClock} — ha et ekstra lag tilgjengelig.`,
  };
}

/**
 * Tur-spesifikk: kombinerer 24t-vær til en kort pakkeliste.
 * Kun aktiv når aktivitet='tur'. Bytter ut tempDrop + precipitationOnTheWay
 * for å unngå støy — turforeldre vil ha ett samlet svar.
 */
export function tripPackingTip(
  now: WeatherNow,
  hourly: WeatherHourly[],
  activity: MockActivity,
): WeatherNote | null {
  if (activity !== 'tur') return null;
  if (hourly.length < 6) return null;

  const window = hourly.slice(0, 24);
  const feels = window.map((h) => h.feelsLikeC);
  const max = Math.max(...feels);
  const min = Math.min(...feels);
  const spread = max - min;
  const rainComing = window.some((h) => h.precipMmH >= 0.5);
  const snowComing = window.some((h) => /snow|sleet/i.test(h.symbolCode));
  const strongWind = now.windMs >= 8;

  const items: string[] = [];
  if (spread >= 5) items.push('ett ekstra ull-lag (temperaturen svinger)');
  if (snowComing) items.push('vanntett yttertøy + varmepose');
  else if (rainComing) items.push('regntrekk eller skall');
  if (strongWind) items.push('vindtett ytterlag');
  if (min < 0) items.push('reservevotter');

  if (items.length === 0) {
    return {
      id: 'trip-packing',
      severity: 'info',
      message: `Stabilt vær på turen: ${Math.round(min)}–${Math.round(max)}° gjennom dagen. Vanlig pakke holder.`,
    };
  }

  return {
    id: 'trip-packing',
    severity: 'tip',
    message: `På tur: ${Math.round(min)}–${Math.round(max)}° i løpet av dagen. Pakk ${items.join(', ')}.`,
  };
}

/** Lett regn eller snø på vei innen 6 timer */
export function precipitationOnTheWay(
  now: WeatherNow,
  hourly: WeatherHourly[],
): WeatherNote | null {
  // Snø-varsel har høyere prioritet enn regn
  const snowSoon = hourly.slice(0, 6).find((h) => SNOW_REGEX.test(h.symbolCode));
  if (snowSoon) {
    const clock = snowSoon.time.toLocaleTimeString('nb-NO', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return {
      id: 'snow-soon',
      severity: 'warning',
      message: `Snø forventet ca kl ${clock}. Vurder vanntett yttertøy og varmepose.`,
    };
  }

  // Regn senere — kun hvis det er tørt akkurat nå
  if (now.precipMmH >= 0.2) return null;
  const next6 = hourly.slice(0, 6);
  const rainStart = next6.find((h) => h.precipMmH >= 0.2);
  if (!rainStart) return null;
  const clock = rainStart.time.toLocaleTimeString('nb-NO', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return {
    id: 'rain-soon',
    severity: 'info',
    message: `Lett regn forventet ca kl ${clock}. Ta med regntrekk eller skall.`,
  };
}
