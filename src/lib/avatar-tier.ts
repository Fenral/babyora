/**
 * Map fra wool-layers Recommendation → avatar-tier (A1-A7).
 *
 * Tier = hva som er det YTTERSTE laget barnet har på i dag.
 * Avatar viser barnet iført det laget, ikke antall lag.
 *
 *   A1 — Sommer-base       (kortermet body + bare bein)
 *   A2 — Mild-base          (langermet ullbody + tynn bukse)
 *   A3 — Kjølig mellomlag   (ull-mellomlag som ytterste)
 *   A4 — Lett yttertøy      (kjøredress / lett kjøredress)
 *   A5 — Vinter             (vinterkjøredress / vinterdress)
 *   A6 — Ekstrem vinter     (vinterkjøredress isolert / vinterdress isolert)
 *   A7 — Søvn               (sovepose, alle TOG)
 */

import type { Recommendation, Activity } from './wool-layers/types.js';

export type AvatarTier = 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'A7';

export const TIER_LABEL: Record<AvatarTier, string> = {
  A1: 'Sommer-base',
  A2: 'Mild-base',
  A3: 'Kjølig mellomlag',
  A4: 'Lett yttertøy',
  A5: 'Vinter',
  A6: 'Ekstrem vinter',
  A7: 'Søvn',
};

const ISOLATED = /isolert/i;
const WINTER_OUTER = /^(vinterkjøredress|vinterdress)/i;
const LIGHT_OUTER = /(kjøredress|skall|regntøy)/i;
const MID_LAYER = /(mellomlag|ull-jakke|ull-bukse|fleece)/i;
const MILD_BASE = /(langermet ullbody|t-skjorte|shorts|lett bukse|tynn bukse)/i;
const SUMMER_BASE = /(kortermet body|kortermet ullbody|bleie)/i;

const SOLHATT = /solhatt/i;
const LUE = /(\blue\b|balaclava|beanie|lue tynn)/i;

export type Headwear = 'none' | 'solhatt' | 'lue';

function flatItems(rec: Recommendation): string[] {
  return rec.layers.flatMap((l) => l.items.map((i) => i.toLowerCase()));
}

/**
 * Avgjør hvilken type hodeplagg som er anbefalt i denne recommendation.
 * Brukes til å velge riktig avatar-variant (A1-hat / A2-hat).
 */
export function headwearFromRecommendation(rec: Recommendation): Headwear {
  const items = flatItems(rec);
  if (items.some((i) => SOLHATT.test(i))) return 'solhatt';
  if (items.some((i) => LUE.test(i))) return 'lue';
  return 'none';
}

/**
 * Hovedfunksjon: avgjør tier basert på aktivitet + ytterste lag i recommendation.
 *
 * Søvn-aktivitet → alltid A7 uavhengig av tempbånd.
 *
 * For ute-aktiviteter (vogn/bæresele/utelek) leter vi opp den "tyngste" plagg-
 * strengen i rec.layers og mapper til tier basert på regex-matchere over.
 */
export function tierFromRecommendation(rec: Recommendation, activity: Activity): AvatarTier {
  if (activity === 'soevn') return 'A7';

  const items = flatItems(rec);

  // Sovepose vises i lag-listen via PlaggDetailSheet (senere phase), aldri på avatar.
  // Avatar skal være base-tier (A1-A6) basert på UNDERLIGGENDE klær.

  // Finn ytterste lag — prioritert rekkefølge fra "tyngst" til "lettest"
  if (items.some((i) => WINTER_OUTER.test(i) && ISOLATED.test(i))) return 'A6';
  if (items.some((i) => WINTER_OUTER.test(i))) return 'A5';
  if (items.some((i) => LIGHT_OUTER.test(i))) return 'A4';
  if (items.some((i) => MID_LAYER.test(i))) return 'A3';
  if (items.some((i) => MILD_BASE.test(i))) return 'A2';
  if (items.some((i) => SUMMER_BASE.test(i))) return 'A1';

  // Fallback hvis ingenting matcher
  return 'A2';
}

/**
 * Bygg PNG-sti for tier-avatar relativt til app-root (Vite BASE_URL).
 *
 * A1 og A2 har hat/uten-hat varianter — velg riktig variant basert på om
 * engine anbefaler solhatt (sommer) eller lue (mild). A3-A6 har hat bakt
 * inn i base-PNG (engine anbefaler nesten alltid hat ved de temperaturene).
 * A7 har aldri hat (sovepose-inne).
 */
export function avatarPng(tier: AvatarTier, headwear: Headwear = 'none'): string {
  const base = `${import.meta.env.BASE_URL}avatars/avatar-`;
  if (tier === 'A1' && headwear === 'solhatt') return `${base}A1-hat.png`;
  if (tier === 'A2' && headwear === 'lue') return `${base}A2-hat.png`;
  return `${base}${tier}.png`;
}
