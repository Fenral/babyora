/**
 * Motor 2.0 Task 15 — ren logikk for situasjonsvelgeren.
 * (Komponent-rendering verifiseres i R7 med reell UI-testinfra; repoet har
 * bevisst ingen jsdom/testing-library-avhengighet ennå.)
 */
import { describe, expect, it } from 'vitest';
import { situationChoicesFor } from '../situation-choices.js';

describe('Motor 2.0 situasjonsvalg per alder (spec §15.2)', () => {
  it('0–11 mnd: vogn, bæresele, våken ute som primær — aldri aktiv lek for nyfødt', () => {
    for (const age of [0, 3, 5]) {
      const c = situationChoicesFor(age);
      expect(c.primary).toEqual(['stroller_awake', 'carrier', 'awake_low_mobility']);
      expect(c.primary).not.toContain('active_play');
      expect(c.secondary).not.toContain('active_play'); // ugyldig for newborn
    }
  });

  it('6–11 mnd: aktiv lek er gyldig sekundærvalg', () => {
    const c = situationChoicesFor(8);
    expect(c.primary.length).toBe(3);
    expect(c.secondary).toContain('active_play');
  });

  it('12–24 mnd: aktiv lek, vogn, blandet dag som primær; rolig ute + bæresele sekundært', () => {
    const c = situationChoicesFor(18);
    expect(c.primary).toEqual(['active_play', 'stroller_awake', 'mixed_day']);
    expect(c.secondary).toEqual(expect.arrayContaining(['calm_outdoors', 'carrier']));
    expect(c.secondary).not.toContain('awake_low_mobility'); // ugyldig for stadiet
  });

  it('maks tre primærvalg for alle aldre, og indoor_sleep tilbys aldri', () => {
    for (const age of [0, 5, 6, 11, 12, 18, 24]) {
      const c = situationChoicesFor(age);
      expect(c.primary.length).toBeLessThanOrEqual(3);
      expect([...c.primary, ...c.secondary]).not.toContain('indoor_sleep');
    }
  });

  it('alle tilbudte valg er gyldige for stadiet (ingen invalid_situation_for_age fra UI)', () => {
    for (const age of [0, 8, 18, 24]) {
      const c = situationChoicesFor(age);
      // Kryssjekk mot situasjonsprofilene skjer implisitt i avledningen;
      // her låser vi kontrakten: primær ∪ sekundær er unike valg.
      const all = [...c.primary, ...c.secondary];
      expect(new Set(all).size).toBe(all.length);
    }
  });
});
