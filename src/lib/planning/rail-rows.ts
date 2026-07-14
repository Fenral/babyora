/**
 * R7 Task 5 — bygg rad-sekvensen for endringsrailen.
 * Kollapsede perioder («Samme antrekk frem til …») er egne rader mellom
 * endringene (a11y-lead krav 1: hver rad er en <li>, også de uendrede).
 */

import type { ChangeEvent } from './change-events.js';

export type RailRow =
  | { type: 'collapsed'; untilLabel: string }
  | { type: 'change'; event: ChangeEvent };

function hhmm(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

export function buildRailRows(
  startHour: number,
  endHour: number,
  events: readonly ChangeEvent[],
): RailRow[] {
  if (events.length === 0) {
    return [{ type: 'collapsed', untilLabel: 'hele dagen' }];
  }
  const rows: RailRow[] = [];
  // Fra start til første endring.
  if (events[0].hour > startHour) {
    rows.push({ type: 'collapsed', untilLabel: hhmm(events[0].hour) });
  }
  events.forEach((event, i) => {
    rows.push({ type: 'change', event });
    const next = events[i + 1];
    if (next) {
      rows.push({ type: 'collapsed', untilLabel: hhmm(next.hour) });
    } else if (event.hour < endHour) {
      rows.push({ type: 'collapsed', untilLabel: 'resten av dagen' });
    }
  });
  return rows;
}
