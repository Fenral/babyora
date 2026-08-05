/**
 * Sol-review P0-6 (2026-08-05): GDPR-innsyn/-sletting skal deterministisk
 * dekke ALLE nøkkelfamilier appen faktisk skriver til localStorage — ikke
 * bare `babyora:`/`klemeg:`. Testen seeder én representativ nøkkel per
 * reelle familie (verifisert i fase 1-auditen, appendix/fase1/) og krever
 * at eksport fanger alt og sletting fjerner alt, uten å røre fremmede nøkler.
 *
 * localStorage/window stubbes som i feedback-store.test.ts (node-miljø).
 */
import { beforeEach, describe, expect, it } from 'vitest';

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
// collectLocalData/deleteAllLocalData gater på `typeof window` — gi noden et vindu.
if (typeof globalThis.window === 'undefined') {
  (globalThis as Record<string, unknown>).window = globalThis;
}

const { collectLocalData, deleteAllLocalData } = await import('../local-data');

/** Én representativ nøkkel per lagringsfamilie appen bruker i produksjon. */
const APP_KEYS: Record<string, string> = {
  'babyora:children:v2': '[{"id":"a","name":"X","dob":"2025-10-03"}]',
  'babyora:analytics:distinct_id': 'uuid-123',
  'babyora.subscription': '{"state":{"isPremium":true}}',
  'babyora.scan-cache': '{"state":{}}',
  'klemeg:legacy-nokkel': '1',
  'metno:63.43,10.40': '{"forecast":"..."}',
  'nominatim:trondheim': '{"lat":63.43}',
  'native-settings:statusbar': 'dark',
  ph_abc123_posthog: '{"distinct_id":"x"}',
};

const FOREIGN_KEYS: Record<string, string> = {
  CapacitorStorage_other: 'ikke vår',
  helt_urelatert: '1',
};

beforeEach(() => {
  localStorage.clear();
  for (const [k, v] of Object.entries({ ...APP_KEYS, ...FOREIGN_KEYS })) {
    localStorage.setItem(k, v);
  }
});

describe('gdpr/local-data — full dekning av appens nøkkelfamilier', () => {
  it('eksporten (Art. 15) inneholder hver eneste app-nøkkelfamilie', () => {
    const payload = collectLocalData('test');
    for (const key of Object.keys(APP_KEYS)) {
      expect(payload.localStorage, `eksport mangler ${key}`).toHaveProperty([key]);
    }
  });

  it('eksporten tar ikke med fremmede nøkler', () => {
    const payload = collectLocalData('test');
    for (const key of Object.keys(FOREIGN_KEYS)) {
      expect(payload.localStorage).not.toHaveProperty([key]);
    }
  });

  it('sletting (Art. 17) fjerner alle app-nøkler og bevarer fremmede', () => {
    const { removed } = deleteAllLocalData();
    expect(removed).toBe(Object.keys(APP_KEYS).length);
    for (const key of Object.keys(APP_KEYS)) {
      expect(localStorage.getItem(key), `${key} overlevde sletting`).toBeNull();
    }
    for (const [key, value] of Object.entries(FOREIGN_KEYS)) {
      expect(localStorage.getItem(key)).toBe(value);
    }
  });

  it('abonnementscachen overlever IKKE «slett alt» lenger (P0-6-regresjonen)', () => {
    deleteAllLocalData();
    expect(localStorage.getItem('babyora.subscription')).toBeNull();
  });
});
