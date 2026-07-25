import type { ChangeEvent, PlanningChangeEvent } from './change-events.js';

function planningList(garments: readonly string[]): string {
  return garments.join(', ');
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null;
}

function isActionList(value: unknown): value is readonly string[] {
  return Array.isArray(value)
    && value.length > 0
    && value.every((item) => typeof item === 'string' && item.trim().length > 0);
}

export function planningChangeActionSentence(event: PlanningChangeEvent): string {
  if (!isRecord(event) || typeof event.kind !== 'string') return '';
  switch (event.kind) {
    case 'add':
      if (!isActionList(event.addedGarments)) return '';
      return `Ta på ${planningList(event.addedGarments)}`;
    case 'remove':
      if (!isActionList(event.removedGarments)) return '';
      return `Ta av ${planningList(event.removedGarments)}`;
    case 'swap':
      if (!isActionList(event.removedGarments) || !isActionList(event.addedGarments)) return '';
      return `Bytt fra ${planningList(event.removedGarments)} til ${planningList(event.addedGarments)}`;
    case 'rain':
      if (
        !isRecord(event.transition)
        || event.transition.kind !== 'rain'
        || (event.transition.action !== 'bring' && event.transition.action !== 'wear')
        || !isActionList(event.transition.garments)
      ) return '';
      return `${event.transition.action === 'bring' ? 'Ta med' : 'Ta på'} ${planningList(event.transition.garments)}`;
    case 'location':
      if (
        !isRecord(event.transition)
        || event.transition.kind !== 'location'
        || typeof event.transition.placeLabel !== 'string'
        || event.transition.placeLabel.trim().length === 0
        || typeof event.transition.action !== 'string'
        || event.transition.action.trim().length === 0
      ) return '';
      return `Når dere kommer til ${event.transition.placeLabel}: ${event.transition.action}`;
    case 'prep':
      if (
        !isRecord(event.transition)
        || event.transition.kind !== 'prep'
        || !isActionList(event.transition.garments)
      ) return '';
      return `Forbered ${planningList(event.transition.garments)}`;
  }
  return '';
}

function listGarments(garments: readonly string[]): string {
  const shown = garments.slice(0, 3).join(', ');
  const rest = garments.length - 3;
  return rest > 0 ? `${shown} +${rest} til` : shown;
}

/**
 * @deprecated Behavior-frozen sentence adapter for the current PlanChangeRail.
 * New planning code must use planningChangeActionSentence.
 */
export function changeActionSentence(event: ChangeEvent): string {
  const list = listGarments(event.garments);
  switch (event.kind) {
    case 'add':
      return `Ta på ${list}`;
    case 'remove':
      return `Ta av ${list}`;
    case 'rain':
      return list ? `Ta på ${list}` : 'Ta på regnbeskyttelse';
    case 'swap':
      return list ? `Bytt til ${list}` : 'Antrekket justeres';
    case 'location':
      return 'Nytt sted';
    default:
      return 'Antrekket endres';
  }
}
