/**
 * R7 Task 5 — meningsfulle endringer gjennom dagen (visual-signature-spec §6).
 *
 * Planlegg viser KUN de øyeblikkene der plagganbefalingen faktisk endres
 * (fingerprint-skift), aldri repeterte værkort. Uendrede perioder kollapser
 * («Samme antrekk frem til 18:00»). Markørformen kommuniserer handlingen.
 */

export type PlanPoint = {
  hour: number;
  fingerprint: string;
  orderedGarments: string[];
  equipment: string[];
  feelsLikeC: number;
  symbolCode: string;
};

export type ChangeKind = 'add' | 'remove' | 'rain' | 'swap' | 'location';

export type ChangeEvent = {
  hour: number;
  kind: ChangeKind;
  /** Plaggene/utstyret som endret seg (lagt til, tatt av, eller ny beskyttelse). */
  garments: string[];
};

const RAIN_RE = /regntrekk|regn|vanntett/i;

export function deriveChangeEvents(points: readonly PlanPoint[]): ChangeEvent[] {
  const events: ChangeEvent[] = [];

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    if (prev.fingerprint === curr.fingerprint) continue;

    const prevSet = new Set([...prev.orderedGarments, ...prev.equipment]);
    const currSet = new Set([...curr.orderedGarments, ...curr.equipment]);
    const added = [...currSet].filter((g) => !prevSet.has(g));
    const removed = [...prevSet].filter((g) => !currSet.has(g));

    // Regnbeskyttelse prioriteres som egen markørtype, men lister alt som kom til.
    const rainAdded = added.some((g) => RAIN_RE.test(g)) || curr.equipment.some((g) => RAIN_RE.test(g) && !prev.equipment.includes(g));

    let kind: ChangeKind;
    let garments: string[];
    if (rainAdded) {
      kind = 'rain';
      garments = added.length > 0 ? added : removed;
    } else if (added.length > 0 && removed.length === 0) {
      kind = 'add';
      garments = added;
    } else if (removed.length > 0 && added.length === 0) {
      kind = 'remove';
      garments = removed;
    } else if (added.length > 0 && removed.length > 0) {
      kind = 'swap';
      garments = [...added, ...removed];
    } else {
      // Fingerprint endret uten synlig plaggforskjell (f.eks. kalibrering) —
      // fremdeles meningsfullt, marker som swap med tom liste.
      kind = 'swap';
      garments = [];
    }

    events.push({ hour: curr.hour, kind, garments });
  }

  return events;
}
