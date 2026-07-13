/**
 * OutfitState + OutfitLayer per Sivert-spec
 * (avatar-first-claude-code-prompt.md).
 *
 * Mapper en wool-layers Recommendation → OutfitLayer[] med:
 * - id (LayerId)
 * - order (1-4)
 * - name (første plagg-streng)
 * - quantity (antall items i kategorien)
 * - reason (engine-note hvis finnes, ellers template-fallback)
 * - alternatives (fra alternatives.ts hvis finnes)
 * - anchor (hardkodet fra anchors.ts)
 */

import type { Recommendation, Layer, Activity } from './wool-layers/types.js';
import { getAlternatives } from './wool-layers/alternatives.js';
import { ANCHORS } from './anchors';
import type { Anchor } from './anchors';

export type LayerId = 'innerst' | 'mellomlag' | 'yttertoy' | 'ekstra' | 'utstyr';

export interface OutfitLayer {
  id: LayerId;
  order: 1 | 2 | 3 | 4 | 5;
  /** Komma-separert sammendrag av items («lue, votter, ullsokker»). */
  name: string;
  /** P0.2 (Fable 2026-06-12): hver enkelt item som egen streng.
   *  Brukes av collectOrbitalEntries til å vise én tag per plagg. */
  items: string[];
  quantity: number;
  reason: string;
  alternatives: string[];
  anchor: Anchor;
}

export interface OutfitState {
  layers: OutfitLayer[];
  visibleUpTo: LayerId | 'all';
  dressedLayers: Set<LayerId>;
  activity: Activity;
  awake: boolean;
}

// Template-fallback per kategori — brukes når engine ikke har spesifikk note
const REASON_TEMPLATE: Record<LayerId, string> = {
  innerst: 'Ull mot huden — holder varmen samtidig som hun puster og slipper ut svette.',
  mellomlag: 'Mellomlaget binder luft og hindrer varmetap mellom innerst og yttertøy.',
  yttertoy: 'Yttertøyet stopper vind og fukt så hun holder varmen ute.',
  ekstra: 'Tilbehør beskytter de mest utsatte stedene — hode, hender og hals.',
  utstyr: 'Eksternt utstyr beskytter eller varmer uten å være på barnet — som regntrekk på vognen.',
};

// Kategori-rangering (innerst først, ekstra sist) — brukes til å sortere
// før pin-numerering. Selve pin-nummeret renummereres kontinuerlig i
// recommendationToOutfitLayers() så vi unngår hopp (1,2,4) når en
// kategori er tom.
const CATEGORY_RANK: Record<LayerId, number> = {
  innerst: 1,
  mellomlag: 2,
  yttertoy: 3,
  ekstra: 4,
  utstyr: 5,
};

/**
 * Velg en passende engine-note for kategorien hvis den finnes.
 * Returns undefined hvis ingen relevant note.
 */
function noteForLayer(rec: Recommendation, layerId: LayerId): string | undefined {
  const cat = layerId === 'yttertoy' ? 'yttertoy' : layerId;
  for (const note of rec.structuredNotes ?? []) {
    if (note.category === 'overoppheting' || note.category === 'kulde') {
      // bruk første relevante note som starter på kategori
      const lower = note.message.toLowerCase();
      const cue: Record<LayerId, string[]> = {
        innerst: ['ull', 'body', 'innerst'],
        mellomlag: ['mellomlag', 'pyjamas', 'fleece'],
        yttertoy: ['kjøredress', 'vinterdress', 'jakke', 'yttertøy'],
        ekstra: ['lue', 'votter', 'hals', 'sokker', 'tilbehør'],
        utstyr: ['regntrekk', 'vognpose', 'kjørepose', 'utstyr'],
      };
      if (cue[cat].some((c) => lower.includes(c))) {
        return note.message;
      }
    }
  }
  return undefined;
}

export function recommendationToOutfitLayers(rec: Recommendation): OutfitLayer[] {
  const intermediate: Array<Omit<OutfitLayer, 'order'>> = [];
  for (const layer of rec.layers) {
    if (layer.items.length === 0) continue;
    const id = layer.category as LayerId;
    if (!(id in CATEGORY_RANK)) continue;
    intermediate.push({
      id,
      // Komma-separert sammendrag for visning (samme som tidligere oppførsel
      // når items er én lang streng).
      name: layer.items.join(', '),
      items: [...layer.items],
      quantity: layer.items.length,
      reason: noteForLayer(rec, id) ?? REASON_TEMPLATE[id],
      alternatives: alternativesFor(layer),
      anchor: ANCHORS[id],
    });
  }
  // Sortér på kategori-rangering, så renummerér 1..N kontinuerlig.
  // Resultat: aldri hopp (1,2,4) selv om en kategori mangler.
  intermediate.sort((a, b) => CATEGORY_RANK[a.id] - CATEGORY_RANK[b.id]);
  return intermediate.map((l, i) => ({
    ...l,
    // B-2: order kan nå være 1..5 (utstyr legger til en 5. mulig pin).
    // Cast bevart for backward-compat — TS-typer i feature-koden snevret til 1-4
    // tolererer 5 fordi de aldri leser bortenfor lengden de selv produserer.
    order: (i + 1) as 1 | 2 | 3 | 4 | 5,
  }));
}

/**
 * Hent alternativer for første item i kategorien fra ITEM_ALTERNATIVES.
 *
 * B-1 (2026-06-12): nå koblet til alternatives.ts. Tidligere returnerte
 * vi bare `layer.items.slice(1)` — det er andre items i samme kategori,
 * ikke ekte alternativer. Nå slår vi opp ITEM_ALTERNATIVES per layer
 * og returnerer alternative-navn for «bytt plagg»-flow.
 */
function alternativesFor(layer: Layer): string[] {
  const primary = layer.items[0];
  if (!primary) return [];
  const found = getAlternatives(primary);
  return found ? found.alternatives.map((a) => a.name) : [];
}
