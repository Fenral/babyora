/**
 * Tester for weatherIconKind — P0.3 fra Fable 5 review.
 *
 * Kjernesak: ikon viser ALDRI nedbør når precipMmH = 0, uansett
 * hva symbolCode hevder.
 */

import { describe, expect, it } from 'vitest';
import { weatherIconKind } from './weather-icon';

describe('weatherIconKind — nedbør = 0 (tørrvær)', () => {
  it('partlycloudy_day + 0 mm/h → partly-cloudy (IKKE rain — Fable bug)', () => {
    expect(weatherIconKind('partlycloudy_day', 0)).toBe('partly-cloudy');
  });

  it('clearsky_day + 0 mm/h → sun', () => {
    expect(weatherIconKind('clearsky_day', 0)).toBe('sun');
  });

  it('cloudy + 0 mm/h → cloud', () => {
    expect(weatherIconKind('cloudy', 0)).toBe('cloud');
  });

  it('rain symbolCode med 0 nedbør → cloud (regelvern)', () => {
    // Defensiv: hvis symbolCode er stale eller feil mot precipMmH, vinner precip.
    expect(weatherIconKind('rain', 0)).toBe('cloud');
  });

  it('fog + 0 mm/h → fog', () => {
    expect(weatherIconKind('fog', 0)).toBe('fog');
  });

  it('undefined symbolCode + 0 mm/h → cloud (fallback)', () => {
    expect(weatherIconKind(undefined, 0)).toBe('cloud');
  });
});

describe('weatherIconKind — nedbør > 0', () => {
  it('rain + 2 mm/h → rain', () => {
    expect(weatherIconKind('rain', 2)).toBe('rain');
  });

  it('lightrain + 0.5 mm/h → rain', () => {
    expect(weatherIconKind('lightrain', 0.5)).toBe('rain');
  });

  it('snow + 1 mm/h → snow', () => {
    expect(weatherIconKind('snow', 1)).toBe('snow');
  });

  it('sleet + 1 mm/h → sleet', () => {
    expect(weatherIconKind('sleet', 1)).toBe('sleet');
  });

  it('thundershowers + 5 mm/h → thunder', () => {
    expect(weatherIconKind('heavyrainshowersandthunder', 5)).toBe('thunder');
  });
});
