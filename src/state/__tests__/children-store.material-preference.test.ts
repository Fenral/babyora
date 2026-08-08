import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  loadFromStorage,
  saveToStorage,
  type Child,
} from '../children-store';

function child(
  id: string,
  materialPreference: NonNullable<Child['materialPreference']>,
): Child {
  return {
    id,
    name: id,
    dob: '2025-10-03',
    city: 'Trondheim',
    lat: 63.4305,
    lon: 10.3951,
    color: '#C25450',
    materialPreference,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('children-store material preference persistence', () => {
  it('round-trips each child preference independently', () => {
    const values = new Map<string, string>();
    vi.stubGlobal('window', { location: { search: '' } });
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });

    saveToStorage([
      child('fleece-child', 'prefer_fleece'),
      child('wool-child', 'prefer_wool'),
    ]);

    expect(
      loadFromStorage().map(({ id, materialPreference }) => ({
        id,
        materialPreference,
      })),
    ).toEqual([
      { id: 'fleece-child', materialPreference: 'prefer_fleece' },
      { id: 'wool-child', materialPreference: 'prefer_wool' },
    ]);
  });
});
