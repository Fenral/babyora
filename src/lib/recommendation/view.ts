/**
 * R7/UI-plan Task 2 — kanonisk RecommendationView (konsolidert plan §3).
 *
 * ALLE flater (Hjem, Antrekk, Plan-rader, widget, varsler) konsumerer dette
 * presentasjonsobjektet. Ingen skjerm teller plagg, bygger forklaring eller
 * utleder fingerprint på egen hånd. Fingerprintet konsumeres fra Motor 2.0
 * og re-beregnes aldri fra oversatte labels.
 */

import { explanationI18nKey } from '../clothing-engine-v2/explanations.js';
import { deriveAvatarStateKey, type AvatarStateKey } from './avatar-state.js';
import type { GarmentRole, RecommendationV2 } from '../clothing-engine-v2/types.js';

export type RecommendationView = {
  recommendation: RecommendationV2;
  /** Antall synlige PLAGG (aldri kategorier, aldri utstyr). */
  garmentCount: number;
  /** Norske labels i påkledningsrekkefølge: innerst → … → utstyr sist. */
  orderedGarments: string[];
  summary: string;
  /** i18n-nøkler — presentasjonslaget oversetter. */
  explanation: string[];
  fingerprint: string;
  avatarStateKey: AvatarStateKey | null;
};

/** Innerst-først-rekkefølge (samme semantikk som legacy-adapterens kategorier). */
const ROLE_ORDER: GarmentRole[] = [
  'base_fullbody', 'base_top', 'base_bottom',
  'mid_fullbody', 'mid_top', 'mid_bottom',
  'insulated_fullbody', 'shell_fullbody', 'shell_top', 'shell_bottom',
  'headwear', 'handwear', 'footwear', 'equipment',
];

export function buildRecommendationView(rec: RecommendationV2): RecommendationView {
  const sorted = [...rec.garments].sort(
    (a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role),
  );
  const orderedGarments = [
    ...sorted.map((g) => g.labelNb),
    ...rec.equipment.map((e) => e.labelNb), // utstyr alltid sist
  ];

  return {
    recommendation: rec,
    garmentCount: rec.garments.length,
    orderedGarments,
    summary: orderedGarments.join(' • '),
    explanation: rec.explanations.map((e) => explanationI18nKey(e.code)),
    fingerprint: rec.fingerprint,
    avatarStateKey: deriveAvatarStateKey(rec),
  };
}
