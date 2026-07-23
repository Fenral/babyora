import type { ChangeEvent, PlanningChangeEvent } from './change-events.js';

function planningList(garments: readonly string[]): string {
  return garments.join(', ');
}

export function planningChangeActionSentence(event: PlanningChangeEvent): string {
  switch (event.kind) {
    case 'add':
      return `Ta på ${planningList(event.addedGarments)}`;
    case 'remove':
      return `Ta av ${planningList(event.removedGarments)}`;
    case 'swap':
      return `Bytt fra ${planningList(event.removedGarments)} til ${planningList(event.addedGarments)}`;
    case 'rain':
      if (event.transition?.kind !== 'rain') return '';
      return `${event.transition.action === 'bring' ? 'Ta med' : 'Ta på'} ${planningList(event.transition.garments)}`;
    case 'location':
      if (event.transition?.kind !== 'location') return '';
      return `Når dere kommer til ${event.transition.placeLabel}: ${event.transition.action}`;
    case 'prep':
      if (event.transition?.kind !== 'prep') return '';
      return `Forbered ${planningList(event.transition.garments)}`;
  }
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
