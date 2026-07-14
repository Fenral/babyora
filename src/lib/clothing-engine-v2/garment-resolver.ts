/**
 * Motor 2.0 — plaggresolver (engine-2-plan Task 7).
 *
 * Deterministisk valg av katalogvarianter fra rolle-policyen:
 *   1. filtrer på rolle + aldersstadium (+ fottøyets månedsregler),
 *   2. behold kandidatene nærmest rollens varmemål,
 *   3. innen den gruppen: best materialrang, deretter stabil variant-ID.
 *
 * Presisering av planens sorteringsrekkefølge («material rank, warmth
 * distance»): varmeavstand prunes FØRST til nærmeste gruppe, deretter
 * materialrang. Ellers ville avoid_wool i ekstrem kulde valgt fleecelue (w2)
 * foran vindtett balaklava (w3) — materialrang skal aldri koste et helt
 * varmetrinn. Dokumentert avvik, testet eksplisitt.
 *
 * Fottøyregler (G17–G20, konsolidert plan §4): < 9 mnd kun sokker/strømper;
 * 9–15 mnd også mykt fottøy; 16+ mnd også ordinære sko/vintersko.
 */

import { GARMENT_VARIANTS } from './catalog.js';
import { EngineV2Error } from './errors.js';
import { resolveEquipment } from './equipment-resolver.js';
import type { RoleMaterialPolicy } from './material-resolver.js';
import type {
  GarmentRole,
  GarmentVariant,
  ResolvedEquipment,
  ResolvedGarment,
  ThermalIntent,
  WarmthLevel,
} from './types.js';

/** Rollerekkefølge i output — innerst først (påkledningsrekkefølgen). */
const ROLE_ORDER: GarmentRole[] = [
  'base_fullbody', 'base_top', 'base_bottom',
  'mid_fullbody', 'mid_top', 'mid_bottom',
  'insulated_fullbody', 'shell_fullbody', 'shell_top', 'shell_bottom',
  'headwear', 'handwear', 'footwear', 'equipment',
];

/** Fottøyklasser for månedsreglene. Føtter er TO delslots: sokker (varmelag)
 *  og ytterfottøy (sko/tøfler) — G17–G20. */
const SOCKS_IDS = new Set(['footwear-wool-1-socks', 'footwear-wool-2-stockings', 'footwear-syn-1-socks']);
const SOFT_IDS = new Set(['footwear-blend-1-soft']);
const SANDAL_IDS = new Set(['footwear-blend-0-sandals']);
// Øvrige footwear-varianter (sko/vintersko) er «ordinære» — kun 16+.

/** Situasjoner der ytterfottøy er relevant (barnet er ute av vogn/sele). */
const OUTER_FOOTWEAR_SITUATIONS = new Set([
  'active_play', 'calm_outdoors', 'mixed_day', 'awake_low_mobility',
]);

const HEAT_BANDS = new Set(['tropisk', 'ekstrem_varme']);

function clampWarmth(n: number): WarmthLevel {
  return Math.max(0, Math.min(4, n)) as WarmthLevel;
}

/** Varmemål per rolle, avledet av intentens isolasjonsnivå. */
function targetWarmthFor(role: GarmentRole, intent: ThermalIntent): WarmthLevel {
  const w = intent.insulationWarmth;
  const cold = intent.baseWarmth >= 2;
  switch (role) {
    case 'base_fullbody':
    case 'base_top':
    case 'base_bottom':
      if (intent.tempBand === 'tropisk' || intent.tempBand === 'ekstrem_varme') return 0;
      return w >= 3 ? 2 : 1;
    case 'mid_fullbody':
    case 'mid_top':
    case 'mid_bottom':
      return clampWarmth(Math.max(1, w - 1));
    case 'insulated_fullbody':
      return clampWarmth(w);
    case 'shell_fullbody':
    case 'shell_top':
    case 'shell_bottom':
      return 0;
    case 'headwear':
      if (!cold) return 0;
      return clampWarmth(Math.min(3, w));
    case 'handwear':
      return clampWarmth(Math.min(3, Math.max(1, w - 1)));
    case 'footwear':
      return cold ? clampWarmth(Math.min(3, Math.max(1, w - 1))) : 0;
    default:
      return 0;
  }
}

function pickBest(
  candidates: GarmentVariant[],
  ranked: readonly GarmentVariant['material'][],
  target: WarmthLevel,
): GarmentVariant {
  const minDist = Math.min(...candidates.map((v) => Math.abs(v.warmth - target)));
  const nearest = candidates.filter((v) => Math.abs(v.warmth - target) === minDist);
  nearest.sort((a, b) => {
    const rankDiff = ranked.indexOf(a.material) - ranked.indexOf(b.material);
    if (rankDiff !== 0) return rankDiff;
    return a.id.localeCompare(b.id);
  });
  return nearest[0];
}

/**
 * Fottøy (G17–G20): sokker som varmelag (hoppes over i hete-bånd), pluss
 * ytterfottøy når barnet er ute av vogn/sele og gammelt nok:
 *   < 9 mnd: aldri ytterfottøy — dressens fottak + sokker varmer.
 *   9–15 mnd: kun mykt (tøffel-sko).
 *   16+ mnd: også ordinære sko/vintersko; sandaler kun i hete-bånd.
 */
function resolveFootwear(
  intent: ThermalIntent,
  ranked: readonly GarmentVariant['material'][],
  ageMonths: number,
): GarmentVariant[] {
  const stageValid = GARMENT_VARIANTS.filter(
    (v) => v.role === 'footwear' && v.validAgeStages.includes(intent.ageStage),
  );
  const cold = intent.baseWarmth >= 2;
  const heat = HEAT_BANDS.has(intent.tempBand);
  const picks: GarmentVariant[] = [];

  // Sokker — alltid utenom hete-bånd.
  if (!heat) {
    const socks = stageValid.filter((v) => SOCKS_IDS.has(v.id) && ranked.includes(v.material));
    if (socks.length > 0) {
      const sockTarget = (cold ? (intent.insulationWarmth >= 3 ? 2 : 1) : 1) as WarmthLevel;
      picks.push(pickBest(socks, ranked, sockTarget));
    }
  }

  // Ytterfottøy — situasjons- og aldersstyrt.
  if (OUTER_FOOTWEAR_SITUATIONS.has(intent.situation) && ageMonths >= 9) {
    let outer = stageValid.filter((v) => !SOCKS_IDS.has(v.id));
    if (ageMonths < 16) outer = outer.filter((v) => SOFT_IDS.has(v.id));
    outer = heat
      ? outer.filter((v) => SANDAL_IDS.has(v.id) || SOFT_IDS.has(v.id))
      : outer.filter((v) => !SANDAL_IDS.has(v.id));
    // Ytterfottøy er form/beskyttelse mer enn materialvalg — ikke preferansestyrt.
    if (outer.length > 0) {
      const outerTarget = (cold ? 3 : 0) as WarmthLevel;
      const allMaterials = [...new Set(outer.map((v) => v.material))];
      picks.push(pickBest(outer, allMaterials, outerTarget));
    }
  }

  return picks;
}

export function resolveGarments(
  intent: ThermalIntent,
  policy: readonly RoleMaterialPolicy[],
  ageMonths: number,
): ResolvedGarment[] {
  const resolved: ResolvedGarment[] = [];

  for (const entry of policy) {
    // Fottøy har egne delslots (sokker + ytterfottøy) og månedsregler.
    if (entry.role === 'footwear') {
      const picks = resolveFootwear(intent, entry.rankedMaterials, ageMonths);
      if (picks.length === 0) {
        // Hete-bånd: barbeint spedbarn / barn i vogn er korrekt (G06/G32) —
        // tomt fottøy er et gyldig svar, ikke en materialkonflikt.
        if (HEAT_BANDS.has(intent.tempBand)) continue;
        throw new EngineV2Error(
          'unresolved_material_constraint',
          `Ingen gyldig fottøyvariant for materialene [${entry.rankedMaterials.join(', ')}]`,
        );
      }
      for (const chosen of picks) {
        resolved.push({
          conceptId: SOCKS_IDS.has(chosen.id) ? 'footwear-socks' : 'footwear-outer',
          variantId: chosen.id,
          role: chosen.role,
          material: chosen.material,
          labelNb: chosen.legacyNameNb,
          illustrationId: chosen.illustrationId,
          required: true,
        });
      }
      continue;
    }

    const candidates = GARMENT_VARIANTS.filter(
      (v) => v.role === entry.role
        && v.validAgeStages.includes(intent.ageStage)
        && entry.rankedMaterials.includes(v.material),
    );
    if (candidates.length === 0) {
      throw new EngineV2Error(
        'unresolved_material_constraint',
        `Ingen gyldig katalogvariant for rollen ${entry.role} med materialene [${entry.rankedMaterials.join(', ')}]`,
      );
    }

    const target = targetWarmthFor(entry.role, intent);
    const chosen = pickBest([...candidates], entry.rankedMaterials, target);

    resolved.push({
      conceptId: `${entry.role}-w${target}`,
      variantId: chosen.id,
      role: chosen.role,
      material: chosen.material,
      labelNb: chosen.legacyNameNb,
      illustrationId: chosen.illustrationId,
      required: true,
    });
  }

  resolved.sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));
  return resolved;
}

export function resolveRecommendationParts(
  intent: ThermalIntent,
  policy: readonly RoleMaterialPolicy[],
  ageMonths: number,
): { garments: ResolvedGarment[]; equipment: ResolvedEquipment[] } {
  return {
    garments: resolveGarments(intent, policy, ageMonths),
    equipment: resolveEquipment(intent),
  };
}
