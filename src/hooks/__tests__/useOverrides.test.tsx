/**
 * B-1 (2026-06-12): tester for useOverrides()-helpers (load/save + dato-expiry).
 *
 * Selve React-hook'en testes via Playwright/e2e — her tester vi at:
 * - sessionStorage roundtrip fungerer
 * - childId-keying er isolert
 * - date-expiry sletter gårsdagens overrides
 */

import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { KEY_PREFIX, load, today, type StoredOverrides } from '../useOverrides';

// Node-miljø har ingen sessionStorage — sett opp minimal in-memory mock.
beforeAll(() => {
  if (typeof globalThis.sessionStorage === 'undefined') {
    const store = new Map<string, string>();
    globalThis.sessionStorage = {
      get length() { return store.size; },
      key(i: number): string | null { return Array.from(store.keys())[i] ?? null; },
      getItem(k: string): string | null { return store.get(k) ?? null; },
      setItem(k: string, v: string): void { store.set(k, v); },
      removeItem(k: string): void { store.delete(k); },
      clear(): void { store.clear(); },
    } as Storage;
  }
});

beforeEach(() => {
  sessionStorage.clear();
});

describe('useOverrides helpers (B-1)', () => {
  it('today() returnerer YYYY-MM-DD-format', () => {
    const t = today();
    expect(t).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('load() returnerer tomt objekt når childId ikke har data', () => {
    expect(load('lillian')).toEqual({});
  });

  it('load() returnerer dagens overrides intakt', () => {
    const data: StoredOverrides = {
      yttertoy: { items: ['custom'], original: ['vinterkjøredress'], date: today() },
    };
    sessionStorage.setItem(KEY_PREFIX + 'lillian', JSON.stringify(data));
    const loaded = load('lillian');
    expect(loaded.yttertoy?.items).toEqual(['custom']);
    expect(loaded.yttertoy?.original).toEqual(['vinterkjøredress']);
  });

  it('load() filtrerer bort gårsdagens overrides', () => {
    const yesterday = '2026-06-11';
    const data: StoredOverrides = {
      yttertoy: { items: ['gammel'], original: ['orig'], date: yesterday },
    };
    sessionStorage.setItem(KEY_PREFIX + 'lillian', JSON.stringify(data));
    expect(load('lillian')).toEqual({});
  });

  it('load() bevarer dagens og filtrerer gårsdagens i blandet sett', () => {
    const yesterday = '2026-06-11';
    const data: StoredOverrides = {
      yttertoy: { items: ['gammel'], original: ['orig'], date: yesterday },
      innerst:  { items: ['ny'],     original: ['orig'], date: today() },
    };
    sessionStorage.setItem(KEY_PREFIX + 'lillian', JSON.stringify(data));
    const loaded = load('lillian');
    expect(loaded.innerst?.items).toEqual(['ny']);
    expect(loaded.yttertoy).toBeUndefined();
  });

  it('load() tåler korrupt JSON og returnerer tomt', () => {
    sessionStorage.setItem(KEY_PREFIX + 'lillian', 'not-json{');
    expect(load('lillian')).toEqual({});
  });

  it('childId-isolasjon: keys er separate', () => {
    const dataLillian: StoredOverrides = {
      yttertoy: { items: ['lillian-plagg'], original: ['orig'], date: today() },
    };
    sessionStorage.setItem(KEY_PREFIX + 'lillian', JSON.stringify(dataLillian));
    expect(load('emil')).toEqual({});
    expect(load('lillian').yttertoy?.items).toEqual(['lillian-plagg']);
  });
});
