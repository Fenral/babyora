import { describe, it, expect } from 'vitest';
import {
  buildSnapshot,
  conditionKeyFromSymbol,
  layerBadgeBandFor,
} from '../snapshot';
import type { Recommendation, WeatherInput } from '../../wool-layers/types.js';

const weather: WeatherInput = {
  feelsLikeC: 1,
  tempC: 4,
  windMs: 2,
  precipMmH: 0,
  symbolCode: 'partlycloudy_day',
};

const rec: Recommendation = {
  activity: 'vogn',
  tempBand: 'kjolig',
  layers: [
    { category: 'innerst', items: ['ullsett tynt'] },
    { category: 'mellomlag', items: ['ull-mellomlag'] },
    { category: 'yttertoy', items: ['kjøredress'] },
    { category: 'ekstra', items: ['lue', 'votter'] },
  ],
  notes: [],
  structuredNotes: [],
  summary: 'Vogn (1 °C føles): ullsett tynt • ull-mellomlag • kjøredress • lue',
  safetyFlags: [],
  severity: 'NONE',
};

describe('layerBadgeBandFor', () => {
  it('mapper lavt antall til lett', () => {
    expect(layerBadgeBandFor(0)).toBe('lett');
    expect(layerBadgeBandFor(1)).toBe('lett');
  });
  it('mapper midt-spenn til medium', () => {
    expect(layerBadgeBandFor(2)).toBe('medium');
    expect(layerBadgeBandFor(3)).toBe('medium');
  });
  it('mapper høyt antall til mye', () => {
    expect(layerBadgeBandFor(4)).toBe('mye');
    expect(layerBadgeBandFor(5)).toBe('mye');
  });
});

describe('conditionKeyFromSymbol', () => {
  it.each([
    ['clearsky_day', 'clearsky'],
    ['partlycloudy_night', 'partly-cloudy'],
    ['fair_day', 'partly-cloudy'],
    ['cloudy', 'cloudy'],
    ['rain', 'rain'],
    ['lightrain', 'rain'],
    ['snow', 'snow'],
    ['sleet', 'sleet'],
    ['fog', 'fog'],
    ['heavyrainandthunder', 'thunder'],
    [undefined, 'cloudy'],
    ['ukjent', 'cloudy'],
  ] as const)('symbol %s → %s', (sym, expected) => {
    expect(conditionKeyFromSymbol(sym as string | undefined)).toBe(expected);
  });
});

describe('buildSnapshot', () => {
  const nowISO = '2026-06-13T07:30:00.000Z';

  it('returnerer v=1 kontrakt', () => {
    const snap = buildSnapshot({
      childName: 'Lillian',
      weather,
      rec,
      activity: 'vogn',
      nowISO,
    });
    expect(snap.v).toBe(1);
    expect(snap.childName).toBe('Lillian');
    expect(snap.updatedAtISO).toBe(nowISO);
    expect(snap.deepLink).toBe('babyora://hjem');
  });

  it('skiller topp-til-tå (lue/votter) fra topGarments', () => {
    const snap = buildSnapshot({
      childName: 'Lillian',
      weather,
      rec,
      activity: 'vogn',
      nowISO,
    });
    expect(snap.toppTilTaa).toEqual(['lue', 'votter']);
    expect(snap.topGarments).toEqual(['ullsett tynt', 'ull-mellomlag', 'kjøredress']);
  });

  it('layerCount teller kategorier med items, ikke totalantall', () => {
    const snap = buildSnapshot({
      childName: 'Lillian',
      weather,
      rec,
      activity: 'vogn',
      nowISO,
    });
    expect(snap.layerCount).toBe(4);
    expect(snap.layerBadgeBand).toBe('mye');
  });

  it('runder tempC og feelsLikeC til heltall', () => {
    const snap = buildSnapshot({
      childName: 'Lillian',
      weather: { ...weather, tempC: 4.7, feelsLikeC: 0.3 },
      rec,
      activity: 'vogn',
      nowISO,
    });
    expect(snap.tempC).toBe(5);
    expect(snap.feelsLikeC).toBe(0);
  });

  it('inkluderer aldri persondata utover childName', () => {
    const snap = buildSnapshot({
      childName: 'Lillian',
      weather,
      rec,
      activity: 'vogn',
      nowISO,
    });
    // Sjekk at ingen felt har lat/lon, fødselsdato, e-post, child-id
    const serialized = JSON.stringify(snap);
    expect(serialized).not.toMatch(/lat|lon|dob|email|childId|child_id/i);
  });
});
