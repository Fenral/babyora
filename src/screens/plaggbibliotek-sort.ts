/**
 * Sorteringen i Plaggbiblioteket — egen modul, ikke fordi den er stor, men
 * fordi den må kunne importeres av porten uten å dra en komponentfil med seg.
 * (`react-refresh/only-export-components`: en fil som eksporterer bade en
 * komponent og en funksjon bryter hot reload.)
 *
 * FUNN 2026-08-06: sorteringskontrollen ble malt til ~35 px glyf uten synlig
 * flate ved siden av en tilbakeknapp med 88 px. Da flaten skulle gis, viste
 * knappen seg a vaere DOD — `handleSort` var `void fire('selection')` og
 * ingenting mer. A gi en dod kontroll samme vekt som tilbakeknappen ville
 * gjort logen storre, ikke mindre. Dette er logikken den manglet.
 */

export type PlaggSortMode = 'katalog' | 'alfabetisk';

/**
 * Sorterer INNENFOR en gruppe. Grupperingen (Innerlag/Mellomlag/Ytterlag) er
 * skjermens ryggrad og røres ikke — et alfabetisk kaos på tvers av lag ville
 * vært en dårligere skjerm, ikke en sortert en.
 */
export function sortGarmentItems<T extends { title: string }>(
  items: readonly T[],
  mode: PlaggSortMode,
): readonly T[] {
  if (mode === 'katalog') return items;
  // localeCompare med 'nb' så æ/ø/å havner sist, ikke der Unicode vil ha dem.
  return [...items].sort((a, b) => a.title.localeCompare(b.title, 'nb'));
}
