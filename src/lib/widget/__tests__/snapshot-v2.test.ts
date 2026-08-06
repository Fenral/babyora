/**
 * Native spike (2026-08-06): kontrakt v2 — brief-felter + utløpssemantikk.
 *
 * Bevisene her speiler brief-maskinens regler (docs/design-lab/lab/p3/
 * brief-maskin.ts): halvåpent gyldighetsintervall (Sols avvik e) og at
 * v2 er en ren, bakoverkompatibel utvidelse av v1.
 */
import { describe, it, expect } from 'vitest';
import {
  buildSnapshot,
  withBriefFields,
  erSnapshotUtlopt,
  type WidgetSnapshot,
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
    { category: 'yttertoy', items: ['kjøredress'] },
  ],
  notes: [],
  structuredNotes: [],
  summary: 'Vogn',
  safetyFlags: [],
  severity: 'NONE',
};

const nowISO = '2026-08-06T07:30:00.000Z';

function v1Snapshot(): WidgetSnapshot {
  return buildSnapshot({ childName: 'Lillian', weather, rec, activity: 'vogn', nowISO });
}

const briefFields = {
  expiresAtISO: '2026-08-06T09:30:00.000Z',
  versjon: 3,
  briefId: 'brief-2026-08-06-morgen',
  deltaTekst: '+1 ull-lag: føles 6° kaldere enn i går',
};

describe('withBriefFields (v2)', () => {
  it('løfter v1 → v2 med alle fire brief-felter', () => {
    const snap = withBriefFields(v1Snapshot(), briefFields);
    expect(snap.v).toBe(2);
    expect(snap.expiresAtISO).toBe(briefFields.expiresAtISO);
    expect(snap.versjon).toBe(3);
    expect(snap.briefId).toBe('brief-2026-08-06-morgen');
    expect(snap.deltaTekst).toBe('+1 ull-lag: føles 6° kaldere enn i går');
  });

  it('peker deepLink på briefen: babyora://brief/<briefId>', () => {
    const snap = withBriefFields(v1Snapshot(), briefFields);
    expect(snap.deepLink).toBe('babyora://brief/brief-2026-08-06-morgen');
  });

  it('beholder alle v1-felter uendret (bakoverkompat)', () => {
    const v1 = v1Snapshot();
    const snap = withBriefFields(v1, briefFields);
    expect(snap.childName).toBe(v1.childName);
    expect(snap.updatedAtISO).toBe(v1.updatedAtISO);
    expect(snap.tempC).toBe(v1.tempC);
    expect(snap.feelsLikeC).toBe(v1.feelsLikeC);
    expect(snap.conditionKey).toBe(v1.conditionKey);
    expect(snap.layerCount).toBe(v1.layerCount);
    expect(snap.layerBadgeBand).toBe(v1.layerBadgeBand);
    expect(snap.topGarments).toEqual(v1.topGarments);
    expect(snap.toppTilTaa).toEqual(v1.toppTilTaa);
    expect(snap.activity).toBe(v1.activity);
  });

  it('muterer ikke input-snapshotet', () => {
    const v1 = v1Snapshot();
    withBriefFields(v1, briefFields);
    expect(v1.v).toBe(1);
    expect(v1.expiresAtISO).toBeUndefined();
    expect(v1.deepLink).toBe('babyora://hjem');
  });
});

describe('erSnapshotUtlopt — halvåpent intervall (Sols avvik e)', () => {
  const snap = withBriefFields(v1Snapshot(), briefFields);

  it('før expiresAt → ikke utløpt', () => {
    expect(erSnapshotUtlopt(snap, '2026-08-06T09:29:59.999Z')).toBe(false);
  });

  it('NØYAKTIG på expiresAt → utløpt (nå >= gyldigTil, ikke >)', () => {
    expect(erSnapshotUtlopt(snap, '2026-08-06T09:30:00.000Z')).toBe(true);
  });

  it('etter expiresAt → utløpt', () => {
    expect(erSnapshotUtlopt(snap, '2026-08-06T10:00:00.000Z')).toBe(true);
  });

  it('v1-snapshot uten expiresAtISO har ingen utløpstilstand', () => {
    expect(erSnapshotUtlopt(v1Snapshot(), '2099-01-01T00:00:00.000Z')).toBe(false);
  });
});
