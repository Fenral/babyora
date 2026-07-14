/**
 * Motor 2.0 Task 16 — eksport-test: G01–G36 nøyaktig én gang, determinisme,
 * blanke beslutningsfelter, ingen PII.
 */
import { describe, expect, it } from 'vitest';
import { buildReviewExport } from '../../../../scripts/export-engine-v2-review.js';

describe('Motor 2.0 fagpakke-eksport', () => {
  const exported = buildReviewExport() as { scenarioer: Array<Record<string, unknown>> };

  it('inneholder G01–G36 nøyaktig én gang, sortert', () => {
    const ids = exported.scenarioer.map((s) => s.id as string);
    expect(ids.length).toBe(36);
    expect(new Set(ids).size).toBe(36);
    expect(ids).toEqual([...ids].sort((a, b) => a.localeCompare(b)));
    for (let n = 1; n <= 36; n++) {
      expect(ids).toContain(`G${String(n).padStart(2, '0')}`);
    }
  });

  it('hvert scenario har blanke beslutningsfelter', () => {
    for (const s of exported.scenarioer) {
      const f = s.faglig as Record<string, string>;
      expect(f.status).toBe('');
      expect(f.fagperson).toBe('');
      expect(f.signatur).toBe('');
    }
  });

  it('feilscenarioene observerer forventet typet feil', () => {
    const g22 = exported.scenarioer.find((s) => s.id === 'G22')!;
    expect(g22.observertFeil).toBe('unsupported_age');
    const g35 = exported.scenarioer.find((s) => s.id === 'G35')!;
    expect(g35.observertFeil).toBe('invalid_situation_for_age');
  });

  it('er deterministisk: to bygg gir byte-identisk JSON', () => {
    const a = JSON.stringify(buildReviewExport());
    const b = JSON.stringify(buildReviewExport());
    expect(a).toBe(b);
  });

  it('inneholder ingen PII-felt', () => {
    const serialized = JSON.stringify(exported);
    expect(serialized).not.toMatch(/"(name|childName|dob|birthDate|latitude|longitude|childId|accountId|householdId|email)"\s*:/i);
  });
});
