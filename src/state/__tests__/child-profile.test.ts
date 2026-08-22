/**
 * Motor 2.0 Task 13 — profilmigrering uten datatap (design-spec §14).
 * Lagringsnøkkelen babyora:children:v2 beholdes; parseStoredChild gir
 * trygg default for materialPreference og forkaster aldri resten av
 * profilen på ukjente enum-verdier. FORVENTET RED: modulen finnes ikke.
 */
import { describe, expect, it } from 'vitest';
import {
  parseStoredChild,
  parseStoredChildren,
  prepareChildForPersistence,
  prepareChildUpdate,
  validateChildDob,
} from '../child-profile.js';

const NOW = new Date('2026-08-22T12:00:00.000Z');

const existingV2Child = {
  id: 'child-123',
  name: 'Lillian',
  dob: '2025-10-03',
  city: 'Trondheim',
  lat: 63.4305,
  lon: 10.3951,
  color: '#C25450',
  avatarKey: 'lillian',
  canRoll: 'yes',
};

describe('Motor 2.0 profilmigrering', () => {
  it('defaulter eksisterende lagret barn uten å miste felter', () => {
    expect(parseStoredChild(existingV2Child, NOW)).toEqual({
      ...existingV2Child,
      materialPreference: 'best_for_conditions',
    });
  });

  it('bevarer en gyldig lagret materialpreferanse', () => {
    const parsed = parseStoredChild({ ...existingV2Child, materialPreference: 'avoid_wool' }, NOW);
    expect(parsed?.materialPreference).toBe('avoid_wool');
  });

  it('faller tilbake KUN fra ukjent fremtidig preferanse — resten beholdes', () => {
    const parsed = parseStoredChild({ ...existingV2Child, materialPreference: 'future_value' }, NOW);
    expect(parsed?.materialPreference).toBe('best_for_conditions');
    expect(parsed?.name).toBe(existingV2Child.name);
    expect(parsed?.dob).toBe(existingV2Child.dob);
  });

  it('forkaster kun oppføringer som ikke oppfyller kjerneskjemaet', () => {
    expect(parseStoredChild(null, NOW)).toBeNull();
    expect(parseStoredChild('streng', NOW)).toBeNull();
    expect(parseStoredChild({ id: 'x' }, NOW)).toBeNull(); // mangler resten av kjerneskjemaet
    // Ekstra ukjente felter overlever (fremtidskompatibilitet).
    const withExtra = parseStoredChild({ ...existingV2Child, futureField: 42 }, NOW);
    expect((withExtra as Record<string, unknown>)?.futureField).toBe(42);
  });

  it('parseStoredChildren filtrerer ugyldige og beholder gyldige', () => {
    const list = parseStoredChildren(
      [existingV2Child, null, { id: 'bare-id' }, { ...existingV2Child, id: 'child-2', name: 'Eskil' }],
      NOW,
    );
    expect(list.map((c) => c.id)).toEqual(['child-123', 'child-2']);
    expect(list.every((c) => c.materialPreference === 'best_for_conditions')).toBe(true);
  });

  it('ikke-array input gir tom liste (korrupt lagring)', () => {
    expect(parseStoredChildren('korrupt', NOW)).toEqual([]);
    expect(parseStoredChildren(undefined, NOW)).toEqual([]);
  });

  it.each([
    ['tomt navn', { name: '   ' }],
    ['for langt navn', { name: 'N'.repeat(81) }],
    ['tomt sted', { city: '' }],
    ['for langt sted', { city: 'S'.repeat(121) }],
    ['ugyldig breddegrad', { lat: 90.1 }],
    ['ugyldig lengdegrad', { lon: -180.1 }],
    ['manglende avatarfarge', { color: '' }],
  ])('forkaster korrupt kjerneskjema: %s', (_label, patch) => {
    expect(prepareChildForPersistence({ ...existingV2Child, ...patch }, NOW)).toBeNull();
  });

  it('leser en eldre profil tolerant uten å godkjenne den som ny persistens', () => {
    const legacy = { ...existingV2Child, city: '', lat: 200, color: 'legacy-token' };

    expect(parseStoredChild(legacy, NOW)).toMatchObject({ id: legacy.id, city: '', lat: 200 });
    expect(prepareChildForPersistence(legacy, NOW)).toBeNull();
  });

  it.each(['2026-02-30', '2025-02-29', '2026-8-02', '2026-08-02T00:00:00Z', 'ikke-en-dato']) (
    'forkaster ugyldig ISO-fødselsdato %s',
    (dob) => {
      expect(validateChildDob(dob, NOW).status).toBe('invalid');
      expect(parseStoredChild({ ...existingV2Child, dob }, NOW)).toMatchObject({ dob });
      expect(prepareChildForPersistence({ ...existingV2Child, dob }, NOW)).toBeNull();
    },
  );

  it('forkaster fremtidig fødselsdato før persistens', () => {
    expect(validateChildDob('2026-08-23', NOW)).toEqual({ status: 'future' });
    expect(parseStoredChild({ ...existingV2Child, dob: '2026-08-23' }, NOW)).toMatchObject({
      dob: '2026-08-23',
    });
    expect(prepareChildForPersistence({ ...existingV2Child, dob: '2026-08-23' }, NOW)).toBeNull();
  });

  it('støtter hele aldersbåndet 0–24 måneder', () => {
    expect(validateChildDob('2026-08-22', NOW)).toEqual({ status: 'supported', ageMonths: 0 });
    expect(validateChildDob('2024-08-22', NOW)).toEqual({ status: 'supported', ageMonths: 24 });
    expect(validateChildDob('2024-08-21', NOW)).toEqual({ status: 'supported', ageMonths: 24 });
  });

  it('bevarer en eldre lagret profil, men avviser den som ny persistens', () => {
    const older = { ...existingV2Child, dob: '2024-07-22' };

    expect(validateChildDob(older.dob, NOW)).toEqual({ status: 'unsupported-age', ageMonths: 25 });
    expect(parseStoredChild(older, NOW)).toMatchObject({ id: older.id, dob: older.dob });
    expect(prepareChildForPersistence(older, NOW)).toBeNull();
    expect(prepareChildUpdate(older, { name: 'Nytt navn' }, NOW)).toMatchObject({
      dob: older.dob,
      name: 'Nytt navn',
    });
  });

  it('avviser en oppdatering som flytter et støttet barn utenfor aldersbåndet', () => {
    expect(prepareChildUpdate(existingV2Child, { dob: '2020-01-01' }, NOW)).toBeNull();
    expect(prepareChildUpdate(existingV2Child, { dob: '2026-08-23' }, NOW)).toBeNull();
    expect(prepareChildUpdate(existingV2Child, { dob: '2026-02-30' }, NOW)).toBeNull();
  });
});
