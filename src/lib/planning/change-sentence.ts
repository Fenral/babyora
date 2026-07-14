/**
 * R7 Task 5 — handlingssetning per endringsmarkør (design-spec §6).
 * Setningen navngir verbet slik at skjermlesere gjenskaper handlingen uten
 * ikonet (a11y-lead krav 2). Maks tre plagg listes; resten som «+N til».
 */

import type { ChangeEvent } from './change-events.js';

function listGarments(garments: readonly string[]): string {
  const shown = garments.slice(0, 3).join(', ');
  const rest = garments.length - 3;
  return rest > 0 ? `${shown} +${rest} til` : shown;
}

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
