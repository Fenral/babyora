import { afterEach, describe, expect, it, vi } from 'vitest';
import { ACTIVE_KEY, STORAGE_KEY, loadActiveId, loadFromStorage, saveToStorage } from './children-store';

const validChild = {
  id: 'child-1',
  name: 'Lillian',
  dob: '2025-10-03',
  city: 'Trondheim',
  lat: 63.4305,
  lon: 10.3951,
  color: '#C25450',
};

class MemoryStorage implements Storage {
  readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function installStorage(): MemoryStorage {
  const storage = new MemoryStorage();
  vi.stubGlobal('window', { location: { search: '' }, localStorage: storage });
  vi.stubGlobal('localStorage', storage);
  return storage;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('children storage recovery', () => {
  it('reiser seg fra korrupt JSON uten å krasje', () => {
    const storage = installStorage();
    storage.setItem(STORAGE_KEY, '{ikke-json');

    expect(loadFromStorage()).toEqual([]);
  });

  it('filtrerer korrupte profiler uten å slette gyldige eller eldre profiler', () => {
    const storage = installStorage();
    const olderChild = { ...validChild, id: 'child-older', dob: '2020-01-01' };
    const legacyChild = { ...validChild, id: 'child-legacy', city: '', lat: 200 };
    storage.setItem(STORAGE_KEY, JSON.stringify([
      validChild,
      { id: 'child-corrupt' },
      olderChild,
      legacyChild,
    ]));

    expect(loadFromStorage().map(({ id }) => id)).toEqual(['child-1', 'child-older', 'child-legacy']);
    expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? '[]')).toHaveLength(4);
  });

  it('faller tilbake fra ukjent aktiv-ID', () => {
    const storage = installStorage();
    storage.setItem(ACTIVE_KEY, 'missing-child');

    expect(loadActiveId('child-1', ['child-1'])).toBe('child-1');
  });

  it('lar appen fortsette når lagring er utilgjengelig', () => {
    const storage = installStorage();
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });

    expect(() => saveToStorage([validChild])).not.toThrow();
  });
});
