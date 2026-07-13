/**
 * garment-catalog-helpers — delte hjelpefunksjoner for skjermer som viser
 * HELE plagg-katalogen (GARMENTS_BY_CATEGORY): PlaggbibliotekScreen og
 * MinGarderobeScreen.
 *
 * Utpakket fra PlaggbibliotekScreen (F84.5) så MinGarderobeScreen kan
 * gjenbruke SAMME lesbare-navn- og materiale-heuristikk i stedet for å
 * duplisere/drifte fra den.
 */
import { dbStringFor, type GarmentId } from './garment-illustrations';

export type MaterialKey = 'ull' | 'bomull' | 'vanntett' | 'mix';

export function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Lesbart navn: kanonisk db-streng, ellers humanisert id (sovepose-2-5-tog
 *  → «Sovepose 2,5 TOG»). */
export function titleFor(id: GarmentId): string {
  const db = dbStringFor(id);
  if (db !== id) return capitalize(db);
  const humanized = id
    .replace(/-(\d)-(\d)-tog\b/g, ' $1,$2 tog')
    .replace(/-(\d)-tog\b/g, ' $1,0 tog')
    .replace(/-/g, ' ')
    .replace(/\btog\b/g, 'TOG');
  return capitalize(humanized);
}

/** Heuristisk materiale fra plagg-id. null = tilbehør uten tydelig materiale
 *  (lue, votter, hals, ansiktskrem) → ingen materiale-tag på kortet. */
export function materialFor(id: string): { key: MaterialKey; label: string } | null {
  if (/regn|skall|vind|trekk|poncho/.test(id)) return { key: 'vanntett', label: 'Vanntett' };
  if (/kjoredress|vinterdress|dress/.test(id)) return { key: 'mix', label: 'Skall + fôr' };
  if (/dun/.test(id)) return { key: 'mix', label: 'Dun' };
  if (/sovepose/.test(id)) return { key: 'mix', label: 'Sovepose' };
  if (/varmepose|teppe|sauekinn/.test(id)) return { key: 'mix', label: 'Vogn-varme' };
  if (/ull/.test(id)) return { key: 'ull', label: 'Ull' };
  if (/body|t-skjorte|shorts|bukse|pyjamas|bleie/.test(id)) return { key: 'bomull', label: 'Bomull' };
  if (/sko|sandal|toffel/.test(id)) return { key: 'mix', label: 'Fottøy' };
  return null;
}
