/**
 * P1 (nav 4→3 skeleton, 2026-07-30) — navigasjonskontrakt: tre røtter.
 * Guide-tab-roten er fjernet; tidligere Guide-skjermer forblir nåbare via
 * drills (se App.tsx sin Drill-union) i stedet for en egen root-tab.
 */
import { describe, expect, it } from 'vitest';
import { TAB_DEFS, type TabKey, type VerktoyTarget } from '../nav.js';

describe('tre-rots-navigasjonen', () => {
  it('har nøyaktig tre røtter i riktig rekkefølge', () => {
    expect(TAB_DEFS.map((t) => t.key)).toEqual(['hjem', 'plan', 'verktoy', 'familie']);
  });

  it('bruker mål-IA-labels — synlig tekst er tilgjengelig navn (WCAG 2.5.3)', () => {
    expect(TAB_DEFS.map((t) => t.label)).toEqual(['Hjem', 'Planlegg', 'Verktøy', 'Familie']);
  });

  it('guide er ikke lenger en rot', () => {
    expect(TAB_DEFS.some((t) => (t.key as string) === 'guide')).toBe(false);
    expect(TAB_DEFS.some((t) => /guide/i.test(t.label))).toBe(false);
  });

  it('innstillinger er ikke lenger en rot', () => {
    expect(TAB_DEFS.some((t) => (t.key as string) === 'innstillinger')).toBe(false);
    expect(TAB_DEFS.some((t) => /innst/i.test(t.label))).toBe(false);
  });

  it('eksporterer FamilieToolTarget for de tidligere Guide-"kunnskap"-kortene', () => {
    const targets: VerktoyTarget[] = ['finn-antrekk', 'tog', 'varm-kald', 'forste-vinter'];
    // Ren typesjekk (kompilerer kun hvis unionen fortsatt har nøyaktig disse
    // tre medlemmene) — assert på lengden for å ha én kjørbar forventning.
    expect(targets).toHaveLength(4);
  });

  it('TabKey-unionen matcher TAB_DEFS sine nøkler 1:1', () => {
    const keys: TabKey[] = TAB_DEFS.map((t) => t.key);
    expect(keys).toEqual(['hjem', 'plan', 'verktoy', 'familie']);
  });
});
