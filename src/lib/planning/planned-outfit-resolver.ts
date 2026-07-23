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

function isPlainData(value: unknown, seen: WeakSet<object>): boolean {
  if (typeof value !== 'object' || value === null) {
    return (
      value === null
      || typeof value === 'string'
      || typeof value === 'number'
      || typeof value === 'boolean'
      || typeof value === 'undefined'
    );
  }
  if (seen.has(value)) return false;
  seen.add(value);

  const isPlainArray = Array.isArray(value)
    && Object.getPrototypeOf(value) === Array.prototype;
  const isPlainObject = !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
  if (!isPlainArray && !isPlainObject) return false;

  return Reflect.ownKeys(value).every((key) => {
    if (typeof key !== 'string' || (isPlainArray && key === 'length')) return isPlainArray && key === 'length';
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return Boolean(
      descriptor
      && Object.hasOwn(descriptor, 'value')
      && isPlainData(descriptor.value, seen),
    );
  });
}

function clonePlainEvent(value: object): PlanningChangeEvent | null {
  if (!isPlainData(value, new WeakSet())) return null;
  const eventValue = value;
  const clone = structuredClone(eventValue) as unknown;
  return (
    typeof clone === 'object'
    && clone !== null
    && !Array.isArray(clone)
    && Object.getPrototypeOf(clone) === Object.prototype
  )
    ? clone as PlanningChangeEvent
    : null;
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
      const eventValue = ownDataValue(currentEvents, String(index));
      if (typeof eventValue !== 'object' || eventValue === null) return null;
      const event = clonePlainEvent(eventValue);
      if (!event) return null;
      if (ownDataValue(event, 'id') === eventId) {
        matchingEvents.push(event);
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
