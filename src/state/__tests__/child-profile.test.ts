/**
 * Motor 2.0 Task 13 — profilmigrering uten datatap (design-spec §14).
 * Lagringsnøkkelen babyora:children:v2 beholdes; parseStoredChild gir
 * trygg default for materialPreference og forkaster aldri resten av
 * profilen på ukjente enum-verdier. FORVENTET RED: modulen finnes ikke.
 */
import { describe, expect, it } from 'vitest';
import { parseStoredChild, parseStoredChildren } from '../child-profile.js';

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
    expect(parseStoredChild(existingV2Child)).toEqual({
      ...existingV2Child,
      materialPreference: 'best_for_conditions',
    });
  });

  it('bevarer en gyldig lagret materialpreferanse', () => {
    const parsed = parseStoredChild({ ...existingV2Child, materialPreference: 'avoid_wool' });
    expect(parsed?.materialPreference).toBe('avoid_wool');
  });

  it('faller tilbake KUN fra ukjent fremtidig preferanse — resten beholdes', () => {
    const parsed = parseStoredChild({ ...existingV2Child, materialPreference: 'future_value' });
    expect(parsed?.materialPreference).toBe('best_for_conditions');
    expect(parsed?.name).toBe(existingV2Child.name);
    expect(parsed?.dob).toBe(existingV2Child.dob);
  });

  it('forkaster kun oppføringer som ikke oppfyller kjerneskjemaet', () => {
    expect(parseStoredChild(null)).toBeNull();
    expect(parseStoredChild('streng')).toBeNull();
    expect(parseStoredChild({ id: 'x' })).toBeNull(); // mangler name/dob
    // Ekstra ukjente felter overlever (fremtidskompatibilitet).
    const withExtra = parseStoredChild({ ...existingV2Child, futureField: 42 });
    expect((withExtra as Record<string, unknown>)?.futureField).toBe(42);
  });

  it('parseStoredChildren filtrerer ugyldige og beholder gyldige', () => {
    const list = parseStoredChildren([existingV2Child, null, { id: 'bare-id' }, { ...existingV2Child, id: 'child-2', name: 'Eskil' }]);
    expect(list.map((c) => c.id)).toEqual(['child-123', 'child-2']);
    expect(list.every((c) => c.materialPreference === 'best_for_conditions')).toBe(true);
  });

  it('ikke-array input gir tom liste (korrupt lagring)', () => {
    expect(parseStoredChildren('korrupt')).toEqual([]);
    expect(parseStoredChildren(undefined)).toEqual([]);
  });
});
