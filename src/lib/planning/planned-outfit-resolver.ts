import type { PlanningChangeEvent } from './change-events.js';
import {
  isPlannedOutfitContext,
  type PlannedOutfitContext,
} from './planned-outfit-context.js';

function ownDataValue(value: object, key: PropertyKey): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor && Object.hasOwn(descriptor, 'value')
    ? descriptor.value
    : undefined;
}

export function resolvePlannedOutfitContext(
  eventId: string,
  currentEvents: readonly PlanningChangeEvent[],
  contextsByEventId: ReadonlyMap<string, unknown>,
): PlannedOutfitContext | null {
  try {
    if (
      typeof eventId !== 'string'
      || eventId.length === 0
      || !Array.isArray(currentEvents)
      || Object.getPrototypeOf(currentEvents) !== Array.prototype
      || !Object.isFrozen(currentEvents)
      || typeof contextsByEventId !== 'object'
      || contextsByEventId === null
    ) {
      return null;
    }

    const matchingEvents: PlanningChangeEvent[] = [];
    for (let index = 0; index < currentEvents.length; index++) {
      const event = ownDataValue(currentEvents, String(index));
      if (typeof event !== 'object' || event === null) return null;
      if (ownDataValue(event, 'id') === eventId) {
        matchingEvents.push(event as PlanningChangeEvent);
      }
    }
    if (matchingEvents.length !== 1) return null;

    if (!Map.prototype.has.call(contextsByEventId, eventId)) return null;
    const context = Map.prototype.get.call(contextsByEventId, eventId) as unknown;
    if (!isPlannedOutfitContext(context)) return null;

    const event = matchingEvents[0]!;
    return context.planningEventId === ownDataValue(event, 'id')
      && context.transitionContextId === ownDataValue(event, 'transitionContextId')
      ? context
      : null;
  } catch {
    return null;
  }
}
