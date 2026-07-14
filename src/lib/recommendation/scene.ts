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
import type { Recommendation } from '../wool-layers/types.js';

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

/**
 * Legacy-inngangen — brukes av skjermene SÅ LENGE kohortflaggene er av
 * (UI-planens grunnregel: konsumér legacy til en kohort er aktivert).
 * Samme SceneModel-form; ytterste synlige = yttertøy[0] (ellers mellomlag[0],
 * ellers innerst[0]) + lue/votter/hals fra ekstra + utstyr.
 */
export function deriveSceneModelFromLegacy(rec: Recommendation): SceneModel {
  const items = (category: string): string[] =>
    rec.layers.find((l) => l.category === category)?.items ?? [];

  const outerBodyLabel =
    items('yttertoy')[0] ?? items('mellomlag')[0] ?? items('innerst')[0] ?? null;

  const anchors: SceneAnchor[] = [];
  if (outerBodyLabel) anchors.push({ label: outerBodyLabel, role: 'shell_fullbody' });
  const ekstra = items('ekstra');
  const headwear = ekstra.find((i) => /lue|balaklava|solhatt|caps/i.test(i));
  const handwear = ekstra.find((i) => /votter/i.test(i));
  const neck = ekstra.find((i) => /halsedisse|hals/i.test(i));
  if (headwear) anchors.push({ label: headwear, role: 'headwear' });
  if (handwear) anchors.push({ label: handwear, role: 'handwear' });
  if (neck) anchors.push({ label: neck, role: 'headwear' });
  for (const eq of items('utstyr')) {
    if (anchors.length >= 5) break;
    anchors.push({ label: eq, role: 'equipment' });
  }

  return {
    headline: outerBodyLabel ? `${capitalize(outerBodyLabel)}-dag` : 'Dagens antrekk',
    anchors: anchors.slice(0, 5),
    outerBodyLabel,
  };
}
