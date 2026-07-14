/**
 * Motor 2.0 — utstyrsresolver.
 * Utstyr er eksterne hjelpemidler, aldri klær på barnet (invariant 5).
 * Labels matcher legacy-motorens utstyr-strenger 1:1 for adapteren (Task 11).
 */

import type { EquipmentNeed, ResolvedEquipment, ThermalIntent } from './types.js';

const EQUIPMENT_LABELS: Record<EquipmentNeed, string> = {
  stroller_rain_cover: 'regntrekk på vognen',
  stroller_warm_pouch: 'vognpose',
  car_seat_pouch: 'kjørepose',
};

export function resolveEquipment(intent: ThermalIntent): ResolvedEquipment[] {
  return intent.equipment.map((id) => ({
    id,
    labelNb: EQUIPMENT_LABELS[id],
    illustrationId: null,
  }));
}
