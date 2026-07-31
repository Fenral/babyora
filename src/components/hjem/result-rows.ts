/**
 * result-rows — avleder den nummererte plaggisten (innerst→ytterst) for
 * ResultSurface fra en ferdig anbefaling (P4).
 *
 * Ren avledning, ingen React. `deriveSceneModelFromLegacy` (scene.ts, R7)
 * avleder KUN de 3–5 ytterste SYNLIGE ankrene til den gamle «Scenen» — den
 * nye Monter-resultatlisten skal derimot vise ALLE plagg i antrekket
 * (matcher hjem-result.html sin «7 plagg … innerst til ytterst»), så denne
 * filen flatmapper hele `recommendation.layers` i en fast kategori-
 * rekkefølge i stedet. scene.ts er IKKE endret eller importert her — kun
 * `LayerCategory`/`Recommendation`-TYPENE fra wool-layers (skrivebeskyttet
 * lesing, samme mønster som HjemScreen selv allerede bruker).
 */
import type { LayerCategory, Recommendation } from '../../lib/wool-layers/types.js';
import { garmentIdFor } from '../../data/garment-illustrations.js';

export type ResultRow = Readonly<{
  key: string;
  position: number;
  label: string;
  roleLabel: string;
  garmentId: string | null;
}>;

/** Dressing-rekkefølge — DESIGN.md «Numbered vertical rows show dressing order, inner to outer.» */
const CATEGORY_ORDER: readonly LayerCategory[] = ['innerst', 'mellomlag', 'yttertoy', 'ekstra', 'utstyr'];

/** Mock-tekstene ordrett — jf. docs/mocks/monter/hjem-result.html sine `.g-role`-verdier. */
export const ROLE_LABEL_BY_CATEGORY: Readonly<Record<LayerCategory, string>> = {
  innerst: 'Innerst',
  mellomlag: 'Mellomlag',
  yttertoy: 'Ytterst',
  ekstra: 'Tilbehør',
  utstyr: 'Tilbehør',
};

export function deriveResultRows(
  recommendation: Recommendation | null | undefined,
): readonly ResultRow[] {
  if (!recommendation) return [];
  const rows: ResultRow[] = [];
  for (const category of CATEGORY_ORDER) {
    const layer = recommendation.layers.find((candidate) => candidate.category === category);
    if (!layer) continue;
    layer.items.forEach((label, indexInLayer) => {
      rows.push({
        key: `${category}:${indexInLayer}:${label}`,
        position: rows.length + 1,
        label,
        roleLabel: ROLE_LABEL_BY_CATEGORY[category],
        garmentId: garmentIdFor(label),
      });
    });
  }
  return rows;
}
