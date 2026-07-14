/**
 * Motor 2.0 — materialresolver (engine-2-plan Task 6).
 *
 * Avleder hvilke roller antrekket trenger fra ThermalIntent, og rangerer
 * materialfamilier per rolle via policy-tabellen. Velger ALDRI katalogvariant
 * eller label — det er plaggresolverens jobb (Task 7).
 *
 * Rolleavledning:
 *  - base: alltid; todelt (top+bottom) for mobile/toddler i tropisk+ varme,
 *    ellers helkropps (nyfødt beholder alltid helkropps-form).
 *  - mid: insulationWarmth ≥ 1 og feels-bånd kaldere enn varm.
 *  - insulated_fullbody: insulationWarmth ≥ 3 (G01: aldri tung isolasjon
 *    uten reelt behov).
 *  - shell_fullbody: regnbehov, eller vindbehov uten isolert helplagg
 *    (isolerte dresser i katalogen er vindtette).
 *  - headwear/handwear/footwear: behovsflaggene fra intenten.
 */

import {
  applyPreference,
  baseMaterials,
  contextFrom,
  footwearMaterials,
  handwearMaterials,
  headwearMaterials,
  insulationMaterials,
  midMaterials,
} from './material-policy.js';
import type {
  ExplanationCode,
  GarmentRole,
  MaterialFamily,
  MaterialPreference,
  ThermalIntent,
} from './types.js';

export type RoleMaterialPolicy = {
  role: GarmentRole;
  rankedMaterials: MaterialFamily[];
  explanationCodes: ExplanationCode[];
};

const HEAT_BANDS = new Set(['tropisk', 'ekstrem_varme']);
const COLD_MID_EXCLUDED = new Set(['varm', 'tropisk', 'ekstrem_varme']);

export function resolveMaterialFamilies(
  intent: ThermalIntent,
  preference: MaterialPreference,
): RoleMaterialPolicy[] {
  const ctx = contextFrom(intent);
  const entries: Array<{ role: GarmentRole; ranked: MaterialFamily[]; extra?: ExplanationCode[] }> = [];

  // Base — form etter alder og varme (spec §6-tabellen: nyfødt = body/heldress).
  const twoPieceHeat = HEAT_BANDS.has(intent.tempBand) && intent.ageStage !== 'newborn';
  const base = baseMaterials(ctx);
  // Plaggform følger alltid alder (spec §6-tabellen) — hver anbefaling får
  // dermed minst én forklaring (G11).
  const baseCodes: ExplanationCode[] = ['AGE_APPROPRIATE_GARMENT_FORM'];
  if (ctx.active) baseCodes.push('WICKING_SYNTHETIC_FOR_ACTIVITY');
  if (ctx.warmDryCalm && base[0] === 'cotton') baseCodes.push('COTTON_ONLY_WARM_DRY');
  if (twoPieceHeat) {
    entries.push({ role: 'base_top', ranked: base, extra: baseCodes });
    entries.push({ role: 'base_bottom', ranked: base, extra: baseCodes });
  } else {
    entries.push({ role: 'base_fullbody', ranked: base, extra: baseCodes });
  }

  // Mellomlag.
  if (intent.insulationWarmth >= 1 && !COLD_MID_EXCLUDED.has(intent.tempBand)) {
    entries.push({ role: 'mid_fullbody', ranked: midMaterials() });
  }

  // Isolert yttertøy.
  const needsInsulated = intent.insulationWarmth >= 3;
  if (needsInsulated) {
    entries.push({ role: 'insulated_fullbody', ranked: insulationMaterials(ctx) });
  }

  // Skall — regn alltid; vind bare når intet isolert (vindtett) helplagg.
  if (intent.needsWaterproofShell || (intent.needsWindShell && !needsInsulated)) {
    entries.push({ role: 'shell_fullbody', ranked: ['shell'] });
  }

  // Kroppsdeler.
  if (intent.needsHeadwear) {
    entries.push({ role: 'headwear', ranked: headwearMaterials(ctx) });
  }
  if (intent.needsHandwear) {
    entries.push({ role: 'handwear', ranked: handwearMaterials(intent.insulationWarmth >= 3) });
  }
  if (intent.needsFootwear) {
    entries.push({ role: 'footwear', ranked: footwearMaterials(ctx) });
  }

  return entries.map(({ role, ranked, extra }) => {
    // Skall er funksjon, ikke materialvalg — preferansen påvirker aldri skall.
    const applied = role.startsWith('shell_')
      ? { ranked, codes: [] as ExplanationCode[] }
      : applyPreference(ranked, preference);
    return {
      role,
      rankedMaterials: applied.ranked,
      explanationCodes: [...(extra ?? []), ...applied.codes],
    };
  });
}
