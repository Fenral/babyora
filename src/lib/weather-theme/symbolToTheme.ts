import type { WeatherTheme } from './types.js';

/**
 * Mapper met.no symbol_code til vår WeatherTheme-enum.
 * Symbol-koder dokumentert: https://api.met.no/weatherapi/weathericon/2.0/documentation
 *
 * Vi gjør ikke forskjell på day/night-varianter på tema-nivå — auto-dim håndterer
 * natt separat. Sjekkes mest-spesifikt-først.
 */
export function symbolToTheme(symbolCode: string | null | undefined): WeatherTheme {
  if (!symbolCode) return 'default';
  const s = symbolCode.toLowerCase();

  if (s.includes('thunder') || s.includes('heavyrain')) return 'stormy';
  if (s.includes('snow') || s.includes('sleet')) return 'snowy';
  if (s.includes('rain') || s.includes('drizzle')) return 'rainy';
  if (s.includes('fog')) return 'foggy';
  if (s.includes('partlycloudy')) return 'partly';
  if (s.includes('cloudy')) return 'cloudy';
  if (s.includes('clearsky') || s.includes('fair')) return 'sunny';

  return 'default';
}

const CONDITION_LABEL: Record<string, string> = {
  sunny: 'Sol',
  partly: 'Delvis sol',
  cloudy: 'Skyet',
  rainy: 'Regn',
  snowy: 'Snø',
  foggy: 'Tåke',
  stormy: 'Tordenvær',
  default: '',
};

/** Norsk klartekst for vær-tilstand basert på symbol-kode. */
export function symbolToConditionLabel(symbolCode: string | null | undefined): string {
  return CONDITION_LABEL[symbolToTheme(symbolCode)] ?? '';
}
