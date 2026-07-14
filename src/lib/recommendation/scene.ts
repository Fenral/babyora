/**
 * R7 Task 4 — scenemodellen for retning B («Scenen»).
 *
 * Ren avledning fra RecommendationView: det dominante svaret
 * («Vinterkjøredress-dag») og de 3–5 ytterste SYNLIGE plaggene som
 * orbital-ankere. Skjulte base-/mellomlag vises aldri i scenen — de bor i
 * «innerst først»-listen (Antrekk-drillen). Plaggnavn kommer ordrett fra
 * motoren (aldri parafrase — R4-review-læringen).
 */

import type { RecommendationView } from './view.js';
import type { ResolvedGarment } from '../clothing-engine-v2/types.js';

export type SceneAnchor = {
  label: string;
  role: ResolvedGarment['role'] | 'equipment';
};

export type SceneModel = {
  /** Dominant svar, f.eks. «Vinterkjøredress-dag». */
  headline: string;
  /** 3–5 ytterste synlige plagg/tilbehør (aldri skjulte lag). */
  anchors: SceneAnchor[];
  /** Ytterste kroppsplagg-label (grunnlaget for headline). */
  outerBodyLabel: string | null;
};

const OUTER_BODY_ROLES = ['insulated_fullbody', 'shell_fullbody', 'shell_top', 'mid_fullbody', 'mid_top', 'base_fullbody', 'base_top'];
const VISIBLE_ACCESSORY_ROLES = ['headwear', 'handwear'];

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function deriveSceneModel(view: RecommendationView): SceneModel {
  const garments = view.recommendation.garments;

  // Ytterste kroppsplagg = første treff i prioritetsrekkefølgen.
  let outerBody: ResolvedGarment | null = null;
  for (const role of OUTER_BODY_ROLES) {
    const hit = garments.find((g) => g.role === role);
    if (hit) { outerBody = hit; break; }
  }

  const anchors: SceneAnchor[] = [];
  if (outerBody) anchors.push({ label: outerBody.labelNb, role: outerBody.role });
  for (const role of VISIBLE_ACCESSORY_ROLES) {
    const hit = garments.find((g) => g.role === role);
    if (hit) anchors.push({ label: hit.labelNb, role: hit.role });
  }
  const outerFoot = garments.find((g) => g.role === 'footwear' && g.conceptId === 'footwear-outer');
  if (outerFoot) anchors.push({ label: outerFoot.labelNb, role: outerFoot.role });
  for (const eq of view.recommendation.equipment) {
    if (anchors.length >= 5) break;
    anchors.push({ label: eq.labelNb, role: 'equipment' });
  }

  const headline = outerBody
    ? `${capitalize(outerBody.labelNb)}-dag`
    : 'Dagens antrekk';

  return {
    headline,
    anchors: anchors.slice(0, 5),
    outerBodyLabel: outerBody?.labelNb ?? null,
  };
}
