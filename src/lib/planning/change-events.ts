import { parseStrictIsoInstant } from '../met-no/types.js';

export type PlanningChangeKind = 'add' | 'remove' | 'swap' | 'rain' | 'location' | 'prep';

export type PlanningTransition =
  | Readonly<{
    kind: 'rain';
    action: 'bring' | 'wear';
    garments: readonly string[];
  }>
  | Readonly<{
    kind: 'location';
    placeLabel: string;
    action: string;
  }>
  | Readonly<{
    kind: 'prep';
    garments: readonly string[];
  }>;

export type PlanningPoint = Readonly<{
  atIso: string;
  finalizedFingerprint: string;
  orderedGarments: readonly string[];
  equipment: readonly string[];
  cause: string;
  transitionContextId: string;
  transition?: PlanningTransition;
}>;

export type PlanningChangeEvent = Readonly<{
  id: string;
  atIso: string;
  kind: PlanningChangeKind;
  addedGarments: readonly string[];
  removedGarments: readonly string[];
  cause: string;
  transitionContextId: string;
  transition?: PlanningTransition;
}>;

const PLANNING_KIND_PRIORITY: Readonly<Record<PlanningChangeKind, number>> = {
  location: 0,
  prep: 1,
  rain: 2,
  swap: 3,
  remove: 4,
  add: 5,
};

function normalizedText(value: string): string {
  return value.normalize('NFC').trim();
}

function normalizedList(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = normalizedText(value);
    if (normalized.length === 0 || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

function normalizedTransition(transition: PlanningTransition | undefined): PlanningTransition | undefined {
  if (!transition) return undefined;
  if (transition.kind === 'location') {
    const placeLabel = normalizedText(transition.placeLabel);
    const action = normalizedText(transition.action);
    if (placeLabel.length === 0 || action.length === 0) return undefined;
    return { kind: 'location', placeLabel, action };
  }
  const garments = normalizedList(transition.garments);
  if (garments.length === 0) return undefined;
  if (transition.kind === 'rain') {
    return { kind: 'rain', action: transition.action, garments };
  }
  return { kind: 'prep', garments };
}

function serializedTransition(transition: PlanningTransition | undefined): readonly unknown[] | null {
  if (!transition) return null;
  if (transition.kind === 'location') {
    return [transition.kind, transition.placeLabel, transition.action];
  }
  if (transition.kind === 'rain') {
    return [transition.kind, transition.action, [...transition.garments]];
  }
  return [transition.kind, [...transition.garments]];
}

function eventIdentityContent(event: Omit<PlanningChangeEvent, 'id'>): string {
  return JSON.stringify([
    event.atIso,
    event.kind,
    [...event.addedGarments],
    [...event.removedGarments],
    event.cause,
    event.transitionContextId,
    serializedTransition(event.transition),
  ]);
}

function fnv1a64(value: string): string {
  let hash = 0xcbf29ce484222325n;
  const bytes = new TextEncoder().encode(value);
  for (const byte of bytes) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, '0');
}

export function stablePlanningEventId(event: Omit<PlanningChangeEvent, 'id'>): string {
  return `planning-event-${fnv1a64(eventIdentityContent(event))}`;
}

function normalizedPoint(point: PlanningPoint): PlanningPoint | null {
  if (parseStrictIsoInstant(point.atIso) === null) return null;
  const finalizedFingerprint = normalizedText(point.finalizedFingerprint);
  const cause = normalizedText(point.cause);
  const transitionContextId = normalizedText(point.transitionContextId);
  if (finalizedFingerprint.length === 0 || cause.length === 0 || transitionContextId.length === 0) return null;
  const transition = normalizedTransition(point.transition);
  if (point.transition && !transition) return null;
  return {
    atIso: point.atIso,
    finalizedFingerprint,
    orderedGarments: normalizedList(point.orderedGarments),
    equipment: normalizedList(point.equipment),
    cause,
    transitionContextId,
    ...(transition ? { transition } : {}),
  };
}

function pointCanonicalContent(point: PlanningPoint): string {
  return JSON.stringify([
    point.atIso,
    point.finalizedFingerprint,
    [...point.orderedGarments],
    [...point.equipment],
    point.cause,
    point.transitionContextId,
    serializedTransition(point.transition),
  ]);
}

function visibleItems(point: PlanningPoint): string[] {
  return normalizedList([...point.orderedGarments, ...point.equipment]);
}

function differenceInOrder(values: readonly string[], excluded: ReadonlySet<string>): string[] {
  return values.filter((value) => !excluded.has(value));
}

function eventKind(
  transition: PlanningTransition | undefined,
  addedGarments: readonly string[],
  removedGarments: readonly string[],
): PlanningChangeKind | null {
  if (transition) return transition.kind;
  if (addedGarments.length > 0 && removedGarments.length > 0) return 'swap';
  if (removedGarments.length > 0) return 'remove';
  if (addedGarments.length > 0) return 'add';
  return null;
}

function compareEvents(a: PlanningChangeEvent, b: PlanningChangeEvent): number {
  const epochDelta = (parseStrictIsoInstant(a.atIso) ?? 0) - (parseStrictIsoInstant(b.atIso) ?? 0);
  if (epochDelta !== 0) return epochDelta;
  const kindDelta = PLANNING_KIND_PRIORITY[a.kind] - PLANNING_KIND_PRIORITY[b.kind];
  if (kindDelta !== 0) return kindDelta;
  return eventIdentityContent(a).localeCompare(eventIdentityContent(b), 'nb-NO');
}

export function derivePlanningChangeEvents(points: readonly PlanningPoint[]): PlanningChangeEvent[] {
  const normalized = points.map(normalizedPoint);
  if (normalized.some((point) => point === null)) return [];

  const canonicalPoints = [...normalized as PlanningPoint[]]
    .sort((a, b) => {
      const epochDelta = (parseStrictIsoInstant(a.atIso) ?? 0) - (parseStrictIsoInstant(b.atIso) ?? 0);
      if (epochDelta !== 0) return epochDelta;
      const aPriority = a.transition ? PLANNING_KIND_PRIORITY[a.transition.kind] : Number.MAX_SAFE_INTEGER;
      const bPriority = b.transition ? PLANNING_KIND_PRIORITY[b.transition.kind] : Number.MAX_SAFE_INTEGER;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return pointCanonicalContent(a).localeCompare(pointCanonicalContent(b), 'nb-NO');
    })
    .filter((point, index, sorted) => (
      index === 0 || pointCanonicalContent(point) !== pointCanonicalContent(sorted[index - 1]!)
    ));

  const events: PlanningChangeEvent[] = [];
  for (let index = 1; index < canonicalPoints.length; index++) {
    const previous = canonicalPoints[index - 1]!;
    const current = canonicalPoints[index]!;
    const previousItems = visibleItems(previous);
    const currentItems = visibleItems(current);
    const previousSet = new Set(previousItems);
    const currentSet = new Set(currentItems);
    const finalizedChanged = previous.finalizedFingerprint !== current.finalizedFingerprint;
    const addedGarments = finalizedChanged ? differenceInOrder(currentItems, previousSet) : [];
    const removedGarments = finalizedChanged ? differenceInOrder(previousItems, currentSet) : [];
    const kind = eventKind(current.transition, addedGarments, removedGarments);
    if (!kind) continue;

    const eventWithoutId: Omit<PlanningChangeEvent, 'id'> = {
      atIso: current.atIso,
      kind,
      addedGarments,
      removedGarments,
      cause: current.cause,
      transitionContextId: current.transitionContextId,
      ...(current.transition ? { transition: current.transition } : {}),
    };
    events.push({
      id: stablePlanningEventId(eventWithoutId),
      ...eventWithoutId,
    });
  }

  const uniqueEvents = new Map(events.map((event) => [event.id, event]));
  return [...uniqueEvents.values()].sort(compareEvents);
}

/**
 * @deprecated Hour-only compatibility shape for the current UkeScreen and
 * PlanChangeRail. Plan 01-06 owns their atomic canonical migration.
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

/**
 * @deprecated Hour-only compatibility shape for the current UkeScreen and
 * PlanChangeRail. It deliberately has no canonical ISO/event identity.
 */
export type ChangeEvent = {
  hour: number;
  kind: ChangeKind;
  /** Plaggene/utstyret som endret seg (lagt til, tatt av, eller ny beskyttelse). */
  garments: string[];
};

const RAIN_RE = /regntrekk|regn|vanntett/i;

/**
 * @deprecated Behavior-frozen adapter for the current UkeScreen. New planning
 * code must use derivePlanningChangeEvents.
 */
export function deriveChangeEvents(points: readonly PlanPoint[]): ChangeEvent[] {
  const events: ChangeEvent[] = [];

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    if (prev.fingerprint === curr.fingerprint) continue;

    const prevSet = new Set([...prev.orderedGarments, ...prev.equipment]);
    const currSet = new Set([...curr.orderedGarments, ...curr.equipment]);
    const added = [...currSet].filter((garment) => !prevSet.has(garment));
    const removed = [...prevSet].filter((garment) => !currSet.has(garment));
    const rainAdded = added.some((garment) => RAIN_RE.test(garment))
      || curr.equipment.some((garment) => RAIN_RE.test(garment) && !prev.equipment.includes(garment));

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
      kind = 'swap';
      garments = [];
    }

    events.push({ hour: curr.hour, kind, garments });
  }

  return events;
}
