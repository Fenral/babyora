/**
 * Items som er for intuitive til å bli listet som anbefalinger i UI.
 *
 * Bleie: alle babyer har bleie alltid (Sivert 2026-06-14). Engine-laget
 * (tables.ts) returnerer fortsatt bleie der det er medisinsk korrekt
 * (soevn.ekstrem_varme: «bleie alene»), men UI-overflater filtrerer det
 * bort så lag-listen ikke inneholder «kapteinen åpenbar».
 *
 * Engine + bibliotek + detalj-skjerm + avatar-tier beholder bleie i
 * underliggende data — filteret er strengt visuelt for lag-rad-render.
 */
const HIDDEN_FROM_LAYER_LIST = new Set<string>([
  'bleie',
]);

export function hideIntuitiveItems(items: readonly string[]): string[] {
  return items.filter((i) => !HIDDEN_FROM_LAYER_LIST.has(i));
}
