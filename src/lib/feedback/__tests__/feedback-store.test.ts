import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import {
  addFeedback,
  clearFeedback,
  getBias,
  getFeedback,
  recomputeBias,
  type FeedbackEntry,
} from '../feedback-store';

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

const entry = (over: Partial<FeedbackEntry> = {}): FeedbackEntry => ({
  date: '2026-06-13',
  activity: 'vogn',
  feelsLikeC: 2,
  layerCount: 3,
  value: 'passe',
  tsMs: Date.now(),
  ...over,
});

describe('feedback-store (P9.5)', () => {
  it('add + get roundtrip', () => {
    addFeedback('lillian', entry({ value: 'passe' }));
    addFeedback('lillian', entry({ value: 'kald' }));
    expect(getFeedback('lillian')).toHaveLength(2);
  });

  it('bias = 0 ved tom historikk', () => {
    expect(getBias('lillian')).toBe(0);
  });

  it('bias = 0 ved bare 2 kald (under MIN_CONSISTENT=3)', () => {
    addFeedback('lillian', entry({ value: 'kald' }));
    addFeedback('lillian', entry({ value: 'kald' }));
    expect(getBias('lillian')).toBe(0);
  });

  it('bias = +1 ved 3 påfølgende kald', () => {
    addFeedback('lillian', entry({ value: 'kald', tsMs: Date.now() - 1000 }));
    addFeedback('lillian', entry({ value: 'kald', tsMs: Date.now() - 500 }));
    addFeedback('lillian', entry({ value: 'kald' }));
    expect(getBias('lillian')).toBe(1);
  });

  it('bias = -1 ved 3 påfølgende varm', () => {
    addFeedback('lillian', entry({ value: 'varm', tsMs: Date.now() - 1000 }));
    addFeedback('lillian', entry({ value: 'varm', tsMs: Date.now() - 500 }));
    addFeedback('lillian', entry({ value: 'varm' }));
    expect(getBias('lillian')).toBe(-1);
  });

  it('bias = 0 ved blandet (kald + varm + kald)', () => {
    addFeedback('lillian', entry({ value: 'kald', tsMs: Date.now() - 1000 }));
    addFeedback('lillian', entry({ value: 'varm', tsMs: Date.now() - 500 }));
    addFeedback('lillian', entry({ value: 'kald' }));
    expect(getBias('lillian')).toBe(0);
  });

  it('gamle (> 14 dager) svar ekskluderes', () => {
    const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1000;
    addFeedback('lillian', entry({ value: 'kald', tsMs: fifteenDaysAgo }));
    addFeedback('lillian', entry({ value: 'kald', tsMs: fifteenDaysAgo + 1000 }));
    addFeedback('lillian', entry({ value: 'kald' }));
    // Bare 1 fersk svar — under MIN_CONSISTENT
    expect(recomputeBias('lillian')).toBe(0);
  });

  it('bias er ALDRI utenfor [-1, 1]', () => {
    for (let i = 0; i < 10; i++) {
      addFeedback('lillian', entry({ value: 'kald', tsMs: Date.now() - i * 1000 }));
    }
    expect(getBias('lillian')).toBe(1);
  });

  it('clearFeedback fjerner alt + bias', () => {
    addFeedback('lillian', entry({ value: 'kald' }));
    addFeedback('lillian', entry({ value: 'kald' }));
    addFeedback('lillian', entry({ value: 'kald' }));
    expect(getBias('lillian')).toBe(1);
    clearFeedback('lillian');
    expect(getFeedback('lillian')).toEqual([]);
    expect(getBias('lillian')).toBe(0);
  });

  it('childId-isolasjon', () => {
    addFeedback('lillian', entry({ value: 'kald', tsMs: Date.now() - 1000 }));
    addFeedback('lillian', entry({ value: 'kald', tsMs: Date.now() - 500 }));
    addFeedback('lillian', entry({ value: 'kald' }));
    expect(getBias('lillian')).toBe(1);
    expect(getBias('emil')).toBe(0);
  });
});
