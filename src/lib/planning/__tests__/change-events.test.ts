/**
 * R7 Task 5 — deriveChangeEvents: kun MENINGSFULLE (fingerprint-)endringer
 * gjennom dagen får en markør; uendrede perioder kollapser. Markørtype
 * kommuniserer handling (legg til / ta av / regnbeskyttelse / sted).
 * FORVENTET RED: modulen finnes ikke.
 */
import { describe, expect, it } from 'vitest';
import { deriveChangeEvents, type PlanPoint } from '../change-events.js';

function point(hour: number, fingerprint: string, garments: string[], equipment: string[] = []): PlanPoint {
  return { hour, fingerprint, orderedGarments: garments, equipment, feelsLikeC: 5, symbolCode: 'cloudy' };
}

describe('deriveChangeEvents', () => {
  it('gir ingen markør når fingerprint er uendret hele dagen', () => {
    const events = deriveChangeEvents([
      point(8, 'fp-a', ['ullsett', 'kjøredress']),
      point(12, 'fp-a', ['ullsett', 'kjøredress']),
      point(16, 'fp-a', ['ullsett', 'kjøredress']),
    ]);
    expect(events).toEqual([]);
  });

  it('markerer et plagg som TAS AV', () => {
    const events = deriveChangeEvents([
      point(8, 'fp-a', ['ullsett', 'kjøredress']),
      point(12, 'fp-b', ['ullsett']),
    ]);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ hour: 12, kind: 'remove' });
    expect(events[0].garments).toContain('kjøredress');
  });

  it('markerer et plagg som LEGGES TIL', () => {
    const events = deriveChangeEvents([
      point(12, 'fp-a', ['ullsett']),
      point(16, 'fp-b', ['ullsett', 'kjøredress']),
    ]);
    expect(events[0]).toMatchObject({ hour: 16, kind: 'add' });
    expect(events[0].garments).toContain('kjøredress');
  });

  it('markerer regnbeskyttelse (utstyr) separat', () => {
    const events = deriveChangeEvents([
      point(8, 'fp-a', ['ullsett'], []),
      point(12, 'fp-b', ['ullsett'], ['regntrekk på vognen']),
    ]);
    expect(events[0].kind).toBe('rain');
  });

  it('flere endringer gjennom dagen får hver sin markør', () => {
    const events = deriveChangeEvents([
      point(8, 'fp-a', ['ullsett', 'kjøredress']),
      point(12, 'fp-b', ['ullsett']),
      point(16, 'fp-c', ['ullsett', 'kjøredress', 'regntrekk på vognen'], ['regntrekk på vognen']),
    ]);
    expect(events.map((e) => e.hour)).toEqual([12, 16]);
  });

  it('første punkt er alltid utgangspunkt (ingen markør på seg selv)', () => {
    const events = deriveChangeEvents([point(8, 'fp-a', ['ullsett'])]);
    expect(events).toEqual([]);
  });

  it('kombinert legg-til + regn i samme steg gir rain-prioritet men lister begge', () => {
    const events = deriveChangeEvents([
      point(8, 'fp-a', ['ullsett']),
      point(12, 'fp-b', ['ullsett', 'kjøredress', 'regntrekk på vognen'], ['regntrekk på vognen']),
    ]);
    expect(events[0].kind).toBe('rain');
    expect(events[0].garments).toEqual(expect.arrayContaining(['kjøredress', 'regntrekk på vognen']));
  });

  it('er deterministisk', () => {
    const seq = [point(8, 'a', ['x']), point(12, 'b', ['x', 'y'])];
    expect(deriveChangeEvents(seq)).toEqual(deriveChangeEvents(seq));
  });
});
