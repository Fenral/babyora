import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import {
  getFreeLimit,
  getNotOwnedCount,
  isOwned,
  toggleOwnership,
} from '../ownership';

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

describe('ownership (P9.6)', () => {
  it('default eier alt', () => {
    expect(isOwned('lillian', 'Ullbody')).toBe(true);
    expect(getNotOwnedCount('lillian')).toBe(0);
  });

  it('toggle markerer som ikke-eid', () => {
    const r = toggleOwnership('lillian', 'Ullbody', false);
    expect(r).toEqual({ ok: true, nowOwned: false });
    expect(isOwned('lillian', 'Ullbody')).toBe(false);
    expect(getNotOwnedCount('lillian')).toBe(1);
  });

  it('toggle navn case-insensitiv', () => {
    toggleOwnership('lillian', 'Ullbody', false);
    expect(isOwned('lillian', 'ULLBODY')).toBe(false);
    expect(isOwned('lillian', '  ullbody  ')).toBe(false);
  });

  it('F81.1: ubegrenset registrering — gratis-bruker kan toggle mer enn 3', () => {
    expect(toggleOwnership('lillian', 'A', false).ok).toBe(true);
    expect(toggleOwnership('lillian', 'B', false).ok).toBe(true);
    expect(toggleOwnership('lillian', 'C', false).ok).toBe(true);
    expect(getNotOwnedCount('lillian')).toBe(3);
  });

  it('F81.1: 4. og videre er lov for gratis-bruker (ingen premium_required)', () => {
    toggleOwnership('lillian', 'A', false);
    toggleOwnership('lillian', 'B', false);
    toggleOwnership('lillian', 'C', false);
    const r = toggleOwnership('lillian', 'D', false);
    expect(r).toEqual({ ok: true, nowOwned: false });
    expect(isOwned('lillian', 'D')).toBe(false);
  });

  it('gratis og premium: 100 registreringer er lov uansett isPremium', () => {
    for (let i = 0; i < 100; i++) {
      const r = toggleOwnership('lillian', `Plagg-${i}`, false);
      expect(r.ok).toBe(true);
    }
    expect(getNotOwnedCount('lillian')).toBe(100);
  });

  it('premium: 4. og 100. lov', () => {
    for (let i = 0; i < 100; i++) {
      const r = toggleOwnership('lillian', `Plagg-${i}`, true);
      expect(r.ok).toBe(true);
    }
    expect(getNotOwnedCount('lillian')).toBe(100);
  });

  it('toggle tilbake til eid fjerner fra not-owned (alltid lov)', () => {
    toggleOwnership('lillian', 'A', false);
    toggleOwnership('lillian', 'B', false);
    toggleOwnership('lillian', 'C', false);
    // Toggle A tilbake til eid
    const r = toggleOwnership('lillian', 'A', false);
    expect(r).toEqual({ ok: true, nowOwned: true });
    expect(getNotOwnedCount('lillian')).toBe(2);
    // Nå kan vi markere ny som ikke-eid uten å treffe noen grense
    expect(toggleOwnership('lillian', 'D', false).ok).toBe(true);
  });

  it('isolasjon mellom barn', () => {
    toggleOwnership('lillian', 'A', false);
    expect(isOwned('lillian', 'A')).toBe(false);
    expect(isOwned('emil', 'A')).toBe(true);
  });

  it('F81.1: getFreeLimit() returnerer Infinity (ingen grense lenger)', () => {
    expect(getFreeLimit()).toBe(Infinity);
  });
});
