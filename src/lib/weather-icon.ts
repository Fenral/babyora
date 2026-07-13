/**
 * Ren mapping fra met.no symbolCode + nedbør → ikon-type.
 *
 * P0.3 fra Fable 5 review (2026-06-12): live-builden viste regnsky-ikon
 * over «Delvis skyet · 0,0 mm/t». Roten var at samme rainIcon() ble
 * rendret uavhengig av faktisk vær.
 *
 * Regel: ikon viser ALDRI nedbør når precipMmH = 0, uansett hva
 * symbolCode sier.
 */

export type WeatherIconKind =
  | 'sun'
  | 'partly-cloudy'
  | 'cloud'
  | 'rain'
  | 'sleet'
  | 'snow'
  | 'fog'
  | 'thunder';

/** Konvertér met.no symbolCode + nedbør til ikon-type. */
export function weatherIconKind(
  symbolCode: string | undefined,
  precipMmH: number,
): WeatherIconKind {
  const s = (symbolCode ?? '').toLowerCase();

  // Tørr-vær (precipMmH = 0): bruk himmel-ikon uavhengig av rain/sleet/snow
  // i symbolCode (forhindrer at vi viser nedbør når det ikke regner).
  if (precipMmH <= 0) {
    if (s.includes('clearsky') || s.includes('fair') || s === 'clear' || s.includes('sun')) {
      return 'sun';
    }
    if (s.includes('partlycloudy')) return 'partly-cloudy';
    if (s.includes('fog')) return 'fog';
    return 'cloud';
  }

  // Nedbør > 0
  if (s.includes('thunder')) return 'thunder';
  if (s.includes('snow')) return 'snow';
  if (s.includes('sleet') || s.includes('sludd')) return 'sleet';
  if (s.includes('rain') || s.includes('drizzle') || s.includes('shower')) return 'rain';
  // Sjelden case: precipMmH > 0 men symbolCode er klart — fall til regn
  return 'rain';
}
