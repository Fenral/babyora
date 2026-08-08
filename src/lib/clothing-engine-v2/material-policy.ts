/**
 * Motor 2.0 — rollebasert materialpolicy (design-spec §8.1, validerings-spec §5).
 *
 * Eksplisitt policy-tabell: for hver rolle og kontekst returneres en RANGERT
 * liste materialfamilier. Preferansen anvendes her:
 *  - avoid_wool er hard: ull filtreres bort (mot huden og mellomlag — og vi
 *    filtrerer alle roller; skall/isolasjon har uansett ikke ull).
 *  - prefer_wool er myk: ull løftes først der ull allerede er gyldig, men
 *    erstatter aldri funksjon (skall/isolasjon påvirkes ikke).
 *  - prefer_fleece er tilsvarende myk: fleece løftes kun der fleece allerede
 *    er en gyldig kandidat med samme rolle og varmebehov.
 *  - prefer_cotton er kontekststyrt: resolveren slipper preferansen gjennom
 *    kun for baseplagg i warmDryCalm-vinduet. Bomull kan fortsatt stå som et
 *    senere alternativ ved aktivitet, men løftes aldri foran fukttransport.
 * Syntetisk presenteres aldri som dårligere bare fordi det er syntetisk.
 */

import type { ExplanationCode, MaterialFamily, MaterialPreference, ThermalIntent } from './types.js';

export type MaterialContext = {
  /** Fuktighet er sannsynlig relevant: nedbør, eller aktivt barn (svette). */
  wetLikely: boolean;
  /** Aktivt barn (svettedrevet fukttransport-behov). */
  active: boolean;
  /** Varmt og tørt og rolig — bomullsvinduet (G28). */
  warmDryCalm: boolean;
  /** Kaldt (feels-bånd kjølig eller kaldere ≈ baseWarmth ≥ 2). */
  cold: boolean;
};

export function contextFrom(intent: ThermalIntent): MaterialContext {
  const wetLikely = intent.needsWaterproofShell || intent.intensity === 'active';
  const active = intent.intensity === 'active';
  const cold = intent.baseWarmth >= 2;
  const warmDryCalm = !wetLikely && !cold && intent.baseWarmth <= 1 && intent.intensity !== 'active';
  return { wetLikely, active, cold, warmDryCalm };
}

/** Rangert materialliste for base-roller (innerst). */
export function baseMaterials(ctx: MaterialContext): MaterialFamily[] {
  if (ctx.active) return ['synthetic_wicking', 'wool', 'cotton'];
  if (ctx.cold || ctx.wetLikely) return ['wool', 'synthetic_wicking'];
  if (ctx.warmDryCalm) return ['cotton', 'wool', 'synthetic_wicking'];
  return ['cotton', 'wool', 'synthetic_wicking'];
}

/** Rangert materialliste for mellomlag. */
export function midMaterials(): MaterialFamily[] {
  return ['wool', 'fleece'];
}

/** Rangert materialliste for isolert yttertøy. */
export function insulationMaterials(ctx: MaterialContext): MaterialFamily[] {
  // Vått/skiftende: syntetisk isolasjon prioriteres (robust varme ved fukt).
  if (ctx.wetLikely) return ['synthetic_insulation', 'down'];
  return ['synthetic_insulation', 'down'];
}

export function headwearMaterials(ctx: MaterialContext): MaterialFamily[] {
  if (!ctx.cold) return ['cotton', 'blend'];
  return ['wool', 'fleece', 'blend'];
}

export function handwearMaterials(deepCold: boolean): MaterialFamily[] {
  if (deepCold) return ['down', 'blend', 'wool', 'fleece'];
  return ['blend', 'wool', 'fleece'];
}

export function footwearMaterials(ctx: MaterialContext): MaterialFamily[] {
  if (!ctx.cold) return ['blend', 'cotton', 'synthetic_wicking'];
  return ['wool', 'synthetic_wicking', 'synthetic_insulation', 'blend'];
}

/** Anvend preferansen på en rangert liste. Returnerer også forklaringskoder. */
export function applyPreference(
  ranked: MaterialFamily[],
  preference: MaterialPreference,
): { ranked: MaterialFamily[]; codes: ExplanationCode[] } {
  if (preference === 'avoid_wool') {
    const filtered = ranked.filter((m) => m !== 'wool');
    return {
      ranked: filtered,
      codes: filtered.length !== ranked.length ? ['WOOL_AVOIDED'] : [],
    };
  }
  if (preference === 'prefer_wool' && ranked.includes('wool') && ranked[0] !== 'wool') {
    return {
      ranked: ['wool', ...ranked.filter((m) => m !== 'wool')],
      codes: ['WOOL_PREFERENCE_APPLIED'],
    };
  }
  if (preference === 'prefer_fleece' && ranked.includes('fleece') && ranked[0] !== 'fleece') {
    return {
      ranked: ['fleece', ...ranked.filter((m) => m !== 'fleece')],
      codes: [],
    };
  }
  if (preference === 'prefer_cotton' && ranked.includes('cotton') && ranked[0] !== 'cotton') {
    return {
      ranked: ['cotton', ...ranked.filter((m) => m !== 'cotton')],
      codes: [],
    };
  }
  return { ranked: [...ranked], codes: [] };
}
