/**
 * verified-avatar — pragmatisk oppslag fra dagens (legacy) anbefaling til et
 * R8-verifisert komposittbilde (eierbeslutning 2026-07-15).
 *
 * Avataren viser YTTERSTE synlige kroppsplagg (planens scope), så vi matcher på
 * nettopp det + positur. Snødress + balaklava løftes til ekstrem-varianten så
 * lua stemmer. Ukjent ytterplagg → null → nøytral silhuett (aldri feil
 * ytterplagg). Strengere full-nøkkel-match kommer med Motor V2.
 */
import { garmentIdFor } from '../../data/garment-illustrations.js';

export type AvatarPose = 'standing' | 'sitting';

/** Ytterste kroppsplagg (slug) → varmenivå-asset (1–8). */
const OUTER_TO_LEVEL: Readonly<Record<string, number>> = {
  'kortermet-body': 1, 'kortermet-ullbody': 1,
  'langermet-body': 2, 'langermet-ullbody': 2, 'langermet-ullbody-tynn': 2, 'ullsett-tynt': 2,
  'ull-jakke': 3, 'ull-mellomlag': 3, 'ull-mellomlag-tykt': 3, 'ull-bukse': 3, 'ullsett-tykt': 3, 'to-ullsett': 3,
  'lett-kjoredress': 4, 'kjoredress': 4,
  'vinterdress': 5, 'vinterdress-isolert': 5,
  'vinterkjoredress': 5, 'vinterkjoredress-isolert': 6,
  'regntoy-skall': 7, 'vindtett-skall': 8,
};

const LEVEL_NAME: Readonly<Record<number, string>> = {
  1: '1-sommer', 2: '2-mild', 3: '3-kjolig', 4: '4-kald',
  5: '5-vinter', 6: '6-ekstrem', 7: '7-regn', 8: '8-vind',
};

/**
 * Asset-sti for en anbefaling, eller null (→ silhuett). `outerBodyLabel` og
 * `headwearLabel` er de norske plaggnavnene fra scenemodellen.
 */
export function verifiedAvatarAsset(
  pose: AvatarPose,
  outerBodyLabel: string | null,
  headwearLabel: string | null,
): string | null {
  if (!outerBodyLabel) return null;
  const outerSlug = garmentIdFor(outerBodyLabel);
  if (!outerSlug) return null;
  let level = OUTER_TO_LEVEL[outerSlug];
  if (level === undefined) return null;
  // Snødress + balaklava = ekstrem-varianten (så lua stemmer).
  if (level === 5 && headwearLabel && garmentIdFor(headwearLabel) === 'balaklava') {
    level = 6;
  }
  const name = LEVEL_NAME[level];
  if (!name) return null;
  const prefix = pose === 'standing' ? 'std' : 'sit';
  return `${import.meta.env.BASE_URL}avatars/verified/${prefix}-${name}.png`;
}
