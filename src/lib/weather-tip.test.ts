import { describe, it, expect } from 'vitest';
import { weatherTip } from './weather-tip.js';
import type { WeatherInput } from './wool-layers/types.js';

function w(over: Partial<WeatherInput>): WeatherInput {
  return {
    tempC: 10,
    feelsLikeC: 9,
    windMs: 2,
    precipMmH: 0,
    symbolCode: 'partlycloudy_day',
    ...over,
  };
}

describe('weatherTip', () => {
  it('vind + frost trigger mest-alvorlig kombo-tipset', () => {
    const tip = weatherTip(w({ feelsLikeC: -8, windMs: 6 }), 'vogn');
    expect(tip).toMatch(/[Vv]ind|farligere|kinnene|fingrene/);
  });

  it('regn trigger regn-tipset uavhengig av kulde', () => {
    const tip = weatherTip(w({ precipMmH: 1.2, feelsLikeC: 5 }), 'vogn');
    expect(tip).toMatch(/[Rr]egn|regnskall|varmepose/);
  });

  it('kulde uten vind/regn trigger kald-fingre-tipset', () => {
    const tip = weatherTip(w({ feelsLikeC: -3, windMs: 1, precipMmH: 0 }), 'vogn');
    expect(tip).toMatch(/[Kk]alde fingre|15. minutt/);
  });

  it('sterk vind uten kulde trigger vind-tipset', () => {
    const tip = weatherTip(w({ feelsLikeC: 12, windMs: 10 }), 'utelek');
    expect(tip).toMatch(/[Ff]risk vind|hetten/);
  });

  it('sol + varm trigger sol-tipset', () => {
    const tip = weatherTip(w({ tempC: 24, feelsLikeC: 23, symbolCode: 'clearsky_day' }), 'vogn');
    expect(tip).toMatch(/[Ss]ol|solhatt/);
  });

  it('lett yr trigger yr-tipset', () => {
    const tip = weatherTip(w({ precipMmH: 0.15 }), 'vogn');
    expect(tip).toMatch(/[Ll]ett yr|vannavvisende/);
  });

  it('normalt vær uten utløsere gir behagelig overgangs-tip (F9 2026-06-15)', () => {
    const tip = weatherTip(w({ tempC: 12, feelsLikeC: 11, windMs: 2, precipMmH: 0 }), 'vogn');
    expect(tip).toMatch(/[Bb]ehagelig overgangsvær|ett lag mer enn deg selv/);
  });

  it('søvn: kald romtemp gir søvn-tipset', () => {
    const tip = weatherTip(w({ tempC: 14 }), 'soevn');
    expect(tip).toMatch(/[Ll]avere romtemperatur|nakken|hendene/);
  });

  it('søvn: varm romtemp gir søvn-tipset', () => {
    const tip = weatherTip(w({ tempC: 24 }), 'soevn');
    expect(tip).toMatch(/[Hh]øyere romtemperatur|sval|svett/);
  });

  it('søvn: normal romtemp gir default søvn-sjekk-tipset', () => {
    const tip = weatherTip(w({ tempC: 19 }), 'soevn');
    expect(tip).toMatch(/[Kk]jenn på nakken|sval/);
  });

  it('regn vinner over kulde i prioritet', () => {
    const tip = weatherTip(w({ feelsLikeC: -2, precipMmH: 0.8, windMs: 2 }), 'vogn');
    expect(tip).toMatch(/[Rr]egn/);
  });

  it('vind+frost vinner over alt annet ute', () => {
    const tip = weatherTip(w({ feelsLikeC: -10, precipMmH: 0.5, windMs: 7 }), 'vogn');
    expect(tip).toMatch(/[Vv]inden gjør kulda farligere/);
  });
});
