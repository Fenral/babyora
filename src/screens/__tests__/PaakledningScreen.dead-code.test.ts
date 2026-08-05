/**
 * PaakledningScreen — den unådde grenen er BORTE, og skal bli det.
 *
 * ═══ HISTORIKKEN, KORT ════════════════════════════════════════════════════
 * P6 fant at `CurrentPaakledningScreen` aldri kunne rendre: wrapperen valgte
 * `PlannedPaakledningScreen` så lenge EN av de to kontekstene fantes, og begge
 * kallsteder i App.tsx sendte alltid en. Denne fila dokumenterte funnet i to
 * faser — og grenen ble liggende. 495 linjer som ble lest, vedlikeholdt og
 * målt av portene uten å kunne vises for et menneske en eneste gang.
 *
 * SLETTET 2026-08-05 (DoD fase 4), da CTA-en fikk `KlePaaOverlay` og den gamle
 * flaten gikk fra to reserver til én.
 *
 * ═══ HVORFOR PORTEN SNUDDE I STEDET FOR Å BLI SLETTET ═════════════════════
 * En test som bare BESKREV død kode var et notat med testsyntaks: den ville
 * blitt rød hvis noen ryddet, og grønn så lenge søppelet lå der. Nøyaktig feil
 * vei. Nå måler den det som betyr noe — at grenen ikke kommer tilbake, og at
 * wrapperen fortsatt bare har én vei ut.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function kilde(sti: string): string {
  return readFileSync(resolve(process.cwd(), sti), 'utf8');
}

const SKJERM = kilde('src/screens/PaakledningScreen.tsx');
const APP = kilde('src/App.tsx');

/** Kommentarer strippet: filhodet FORKLARER slettingen og ville gitt treff. */
const SKJERM_KODE = SKJERM.replace(/\/\*[\s\S]*?\*\//gu, '').replace(/\/\/[^\n]*/gu, '');

describe('PaakledningScreen — den unådde grenen kommer ikke tilbake', () => {
  it('CurrentPaakledningScreen finnes ikke lenger i koden', () => {
    expect(
      SKJERM_KODE.includes('CurrentPaakledningScreen'),
      'CurrentPaakledningScreen er tilbake. Den kan ikke rendres: wrapperen '
      + 'velger PlannedPaakledningScreen så lenge én kontekst finnes, og begge '
      + 'kallsteder sender alltid en. En gren ingen kan nå blir lest og '
      + 'vedlikeholdt som om den levde.',
    ).toBe(false);
  });

  it('wrapperen har ÉN vei ut, og returnerer null uten kontekst', () => {
    expect(SKJERM_KODE).toContain('const exactContext = props.currentContext ?? props.plannedContext;');
    expect(
      /return null;/u.test(SKJERM_KODE),
      'uten kontekst skal wrapperen returnere null — ikke tegne en skjerm som '
      + 'later som den har data',
    ).toBe(true);
    const grener = [...SKJERM_KODE.matchAll(/<\w*PaakledningScreen[\s/>]/gu)];
    expect(
      grener.length,
      `wrapperen rendrer ${grener.length} skjermer. Én er kontrakten — to betyr `
      + 'at det har oppstått en ny gren som kanskje ikke kan nås.',
    ).toBe(1);
  });

  it('IKKE-VAKUØSITET: kommentarstrippingen har ikke spist hele fila', () => {
    /* Uten denne kunne en regex-feil tømt SKJERM_KODE, og målingen over ville
       vært triumferende grønn på en tom streng. */
    expect(
      SKJERM_KODE.replace(/\s+/gu, '').length,
      'den kommentarfrie kilden er tom — da måler porten ingenting',
    ).toBeGreaterThan(2000);
    expect(SKJERM_KODE).toContain('export function PaakledningScreen');
  });

  it('begge kallsteder i App.tsx sender fortsatt en kontekst', () => {
    const kallsteder = APP.split('<PaakledningScreen').slice(1);
    expect(
      kallsteder.length,
      'antall kallsteder endret seg — sjekk at forutsetningen for slettingen holder',
    ).toBe(2);
    for (const kall of kallsteder) {
      const props = kall.slice(0, kall.indexOf('/>'));
      expect(props).toMatch(/currentContext=|plannedContext=/u);
    }
  });
});
