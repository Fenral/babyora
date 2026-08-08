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
import type {
  OutfitItemId,
  OutfitTruthSnapshotV1,
} from '../../lib/outfit/outfit-truth.js';
import { garmentIdFor } from '../../data/garment-illustrations.js';
import { displayNameForDbString } from '../../data/garment-display-names.js';

export type ResultRow = Readonly<{
  key: string;
  /** Forekomst-ID fra den sikkerhetsvaliderte antrekksbundelen. */
  outfitItemId: OutfitItemId | null;
  position: number;
  /** Rå motor-streng ORDRETT (aldri parafrasert) — data-/oppslagsverdi. */
  label: string;
  /** T1A: brukersynlig navn (garment-display-names.ts) — det UI faktisk viser. */
  displayLabel: string;
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
        outfitItemId: null,
        position: rows.length + 1,
        label,
        displayLabel: displayNameForDbString(label),
        roleLabel: ROLE_LABEL_BY_CATEGORY[category],
        garmentId: garmentIdFor(label),
      });
    });
  }
  return rows;
}

/**
 * Hjem bruker denne varianten når den autoritative antrekksbundelen finnes.
 * Forekomst-ID-en gjør at to like plagg kan ha ulike, sikkerhetsgodkjente
 * alternativer uten å kobles sammen via navn eller array-indeks.
 */
export function deriveResultRowsFromTruth(
  snapshot: OutfitTruthSnapshotV1,
): readonly ResultRow[] {
  const garments = snapshot.garments.map((item) => ({
    itemId: item.itemId,
    label: item.label,
    category: item.category,
    order: item.order,
    garmentId: item.catalogGarmentId ?? garmentIdFor(item.label),
  }));
  const equipment = snapshot.equipment.map((item) => ({
    itemId: item.itemId,
    label: item.label,
    category: 'utstyr' as const,
    order: item.order,
    garmentId: item.catalogGarmentId ?? garmentIdFor(item.label),
  }));

  return [...garments, ...equipment]
    .sort((left, right) => left.order - right.order)
    .map((item, index) => ({
      key: item.itemId,
      outfitItemId: item.itemId,
      position: index + 1,
      label: item.label,
      displayLabel: displayNameForDbString(item.label),
      roleLabel: ROLE_LABEL_BY_CATEGORY[item.category],
      garmentId: item.garmentId,
    }));
}
