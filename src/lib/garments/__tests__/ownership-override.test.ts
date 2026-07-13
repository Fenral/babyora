/**
 * F81.5-W2 (Flate 3): buildOwnershipOverrides() er nå gatet bak et påkrevd
 * `isPremium`-parameter — gratis-bruker skal ALLTID få standard-anbefalingen
 * uendret, uansett hva som er registrert i «Mine plagg» (ownership.ts er
 * fortsatt ubegrenset gratis å registrere i, jf. F81.1 — kun SELVE
 * SUBSTITUSJONEN her er en Babyora Pluss-funksjon).
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { buildOwnershipOverrides } from '../ownership-override';
import { toggleOwnership } from '../ownership';
import type { Recommendation } from '../../wool-layers/types';

beforeAll(() => {
  if (typeof globalThis.localStorage === 'undefined') {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      get length() { return store.size; },
      key(i: number) { return Array.from(store.keys())[i] ?? null; },
      getItem(k: string) { return store.get(k) ?? null; },
      setItem(k: string, v: string) { store.set(k, v); },
      removeItem(k: string) { store.delete(k); },
      clear() { store.clear(); },
    } as Storage;
  }
});

beforeEach(() => localStorage.clear());

function makeRec(items: string[]): Recommendation {
  return {
    activity: 'utelek',
    tempBand: 'mild',
    layers: [{ category: 'innerst', items }],
    notes: [],
    structuredNotes: [],
    summary: '',
  } as unknown as Recommendation;
}

describe('buildOwnershipOverrides (F81.5-W2, Flate 3)', () => {
  it('isPremium=false: alltid standard-anbefaling, ingen overrides/replacements/missing', () => {
    // 'langermet ullbody' markert IKKE eid, med et eid alternativ tilgjengelig
    // ('langermet body') — dette ville normalt gitt en replacement for Premium.
    toggleOwnership('lillian', 'langermet ullbody', true);
    const rec = makeRec(['langermet ullbody']);

    const result = buildOwnershipOverrides('lillian', rec, false);

    expect(result).toEqual({ overrides: {}, replacements: [], missing: [] });
  });

  it('isPremium=true: bytter til eid alternativ når motor-plagget ikke er eid', () => {
    toggleOwnership('lillian', 'langermet ullbody', true);
    const rec = makeRec(['langermet ullbody']);

    const result = buildOwnershipOverrides('lillian', rec, true);

    expect(result.replacements).toEqual([
      { original: 'langermet ullbody', replacement: 'langermet body', layerId: 'innerst' },
    ]);
    expect(result.overrides.innerst).toEqual(['langermet body']);
    expect(result.missing).toEqual([]);
  });

  it('isPremium=true: alt eid → ingen overrides (standard-anbefaling uendret)', () => {
    const rec = makeRec(['langermet ullbody']);
    const result = buildOwnershipOverrides('lillian', rec, true);
    expect(result).toEqual({ overrides: {}, replacements: [], missing: [] });
  });
});
