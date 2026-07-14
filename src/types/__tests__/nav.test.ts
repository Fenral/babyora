/**
 * R7 Task 3 — navigasjonskontrakt: fire røtter med målarkitekturens labels.
 */
import { describe, expect, it } from 'vitest';
import { TAB_DEFS } from '../nav.js';

describe('fire-rots-navigasjonen', () => {
  it('har nøyaktig fire røtter i riktig rekkefølge', () => {
    expect(TAB_DEFS.map((t) => t.key)).toEqual(['hjem', 'plan', 'guide', 'familie']);
  });

  it('bruker mål-IA-labels — synlig tekst er tilgjengelig navn (WCAG 2.5.3)', () => {
    expect(TAB_DEFS.map((t) => t.label)).toEqual(['Hjem', 'Planlegg', 'Guide', 'Familie']);
  });

  it('innstillinger er ikke lenger en rot', () => {
    expect(TAB_DEFS.some((t) => (t.key as string) === 'innstillinger')).toBe(false);
    expect(TAB_DEFS.some((t) => /innst/i.test(t.label))).toBe(false);
  });
});
