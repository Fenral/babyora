/**
 * R7/UI-plan Task 2 — AvatarStateKey (konsolidert plan §3).
 *
 * Nøkkelen beskriver KUN det som faktisk er synlig: positur, ytterste
 * kroppsplagg, hodeplagg, hender, hals og relevant fottøy. Skjulte base-/
 * mellomlag inngår aldri — de forblir i den kanoniske plagglisten.
 *
 * Manifestet over godkjente kompositter er TOMT til R8 leverer (maks 24,
 * menneskelig godkjent). Ukjent nøkkel → null → eksplisitt nøytral fallback.
 * Det er forbudt å vise nærmeste plausible, men feil antrekk.
 */

import type { RecommendationV2, ResolvedGarment } from '../clothing-engine-v2/types.js';

export type AvatarPose = 'sitting' | 'standing';

export type AvatarStateKey = {
  pose: AvatarPose;
  /** Ytterste synlige kroppsplagg (variant-ID) — isolert > skall > mid > base. */
  outerBody: string | null;
  headwear: string | null;
  handwear: string | null;
  /** Hals — finnes ikke i V2 v1-katalogen; feltet er del av den låste kontrakten. */
  neck: string | null;
  /** Synlig ytterfottøy (aldri sokker under dress). */
  footwear: string | null;
};

const OUTER_PRIORITY = ['insulated_fullbody', 'shell_fullbody', 'shell_top', 'mid_fullbody', 'mid_top', 'base_fullbody', 'base_top'];

function findOuterBody(garments: readonly ResolvedGarment[]): string | null {
  for (const role of OUTER_PRIORITY) {
    const hit = garments.find((g) => g.role === role);
    if (hit) return hit.variantId;
  }
  return null;
}

export function deriveAvatarStateKey(rec: RecommendationV2): AvatarStateKey {
  const pose: AvatarPose = rec.ageStage === 'young_toddler' ? 'standing' : 'sitting';
  return {
    pose,
    outerBody: findOuterBody(rec.garments),
    headwear: rec.garments.find((g) => g.role === 'headwear')?.variantId ?? null,
    handwear: rec.garments.find((g) => g.role === 'handwear')?.variantId ?? null,
    neck: null,
    footwear: rec.garments.find((g) => g.role === 'footwear' && g.conceptId === 'footwear-outer')?.variantId ?? null,
  };
}

/** Stabil ID for manifest-oppslag og crossfade-sammenligning. */
export function avatarStateKeyId(key: AvatarStateKey): string {
  return [key.pose, key.outerBody ?? '-', key.headwear ?? '-', key.handwear ?? '-', key.neck ?? '-', key.footwear ?? '-'].join('|');
}

/**
 * Manifest over GODKJENTE kompositter (R8 fyller — maks 24, menneskelig
 * kontrollert mot identitet/anatomi/plagg/materiale). Nøkler er
 * avatarStateKeyId-strenger; verdier er asset-stier.
 */
const APPROVED_COMPOSITES: Readonly<Record<string, string>> = Object.freeze({
  // Fylles i R8 etter fem-foreldre-porten. Tomt = alltid nøytral fallback.
});

/** Godkjent asset for nøkkelen, eller null (→ nøytral fallback i UI). */
export function avatarAssetFor(key: AvatarStateKey): string | null {
  return APPROVED_COMPOSITES[avatarStateKeyId(key)] ?? null;
}
