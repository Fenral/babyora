/**
 * Avatar-stage-bildevalg for dressing-sekvensen (F79/F80 clay-verdenen).
 *
 * R3 (2026-07-14): flyttet ut av HjemScreen.tsx (react-refresh krever at
 * komponentfiler kun eksporterer komponenter). Delt av HjemScreen og
 * PaakledningScreen.
 */

/**
 * Hodeplagg PÅ avataren når anbefalingen inneholder det (kjernesignal).
 * Sluttbildet i sekvensen byttes til hodeplagg-variant der den finnes;
 * mellom-stadier er bare. Manglende kombo → bar stage (graceful).
 * Genererte varianter (F80): 1/2-solhatt, 2/3/4-lue.
 */
const HEADWEAR_VARIANTS: Record<string, true> = {
  'stage-1-solhatt': true,
  'stage-2-solhatt': true,
  'stage-2-lue': true,
  'stage-3-lue': true,
  'stage-4-lue': true,
};

/** Vær-tiers fra F80a-batchen: sluttbildet for ytterpunkt-vær.
 *  A2-A4 dekkes av stagene (+hodeplagg-varianter); disse fire er
 *  dedikerte antrekk generert via edit-kjeden (samme baby). */
const TIER_FINALS: Partial<Record<string, string>> = {
  A1: '/avatars/f79-poc/tier-A1-sommer.webp',
  A5: '/avatars/f79-poc/tier-A5-vinter.webp',
  A6: '/avatars/f79-poc/tier-A6-ekstrem.webp',
  A7: '/avatars/f79-poc/tier-A7-sovn.webp',
};

export function stageSrc(
  stageIdx: number,
  targetStage: number,
  headwear: 'lue' | 'solhatt' | 'none',
  tier?: string,
): string {
  if (stageIdx === targetStage) {
    // Ytterpunkt-vær (sommer/vinter/ekstrem/sovn): dedikert tier-antrekk
    if (tier && TIER_FINALS[tier]) return TIER_FINALS[tier] as string;
    if (headwear !== 'none' && HEADWEAR_VARIANTS[`stage-${stageIdx}-${headwear}`]) {
      return `/avatars/f79-poc/stage-${stageIdx}-${headwear}.webp`;
    }
  }
  return `/avatars/f79-poc/stage-${stageIdx}.webp`;
}
