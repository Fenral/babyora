import { describe, expect, it } from 'vitest';
import {
  EXPECTED_OUTFIT_INVENTORY_V1,
  OUTFIT_INVENTORY_DIMENSIONS_V1,
  assertOutfitInventoryV1,
  runOutfitInventoryV1,
} from '../inventory-v1.js';

const ELEVEN_GARMENT_FIXTURE = [
  'to ullsett oppå hverandre',
  'tykke ullstrømper',
  'ullsokker',
  'ull-jakke',
  'ull-bukse',
  'ekstra ull-lag',
  'isolert vinterkjøredress',
  'balaklava',
  'votter dun',
  'halsedisse',
  'vindvotter (skall)',
] as const;

describe('candidate-local outfit inventory v1', () => {
  it('locks every branch-representative finite dimension', () => {
    expect(OUTFIT_INVENTORY_DIMENSIONS_V1).toEqual({
      ages: [0, 2, 3, 4, 5, 6, 7, 8, 9, 15, 16, 24, 25, 60],
      feelsC: [
        -30, -16, -15, -11, -10, -8, -7, -6, -5, -1, 0, 1, 4, 5, 6, 7,
        8, 9, 10, 14, 15, 16, 17, 18, 21, 22, 23, 24, 27, 28, 29, 40,
      ],
      winds: [0, 3, 5, 7, 8, 10],
      precipitation: [0, 0.2, 0.5, 2],
      symbols: [undefined, 'cloudy_day', 'clearsky_day'],
      calibrations: [-1, 0, 1],
      canRoll: [undefined, false, true],
      activities: ['vogn', 'baeresele', 'utelek', 'soevn'],
    });
  });

  it('reproduces the reviewed 2,036,160-case oracle and exact 11-item truth', () => {
    const inventory = runOutfitInventoryV1();

    expect(inventory.inventoryVersion).toBe(1);
    expect(inventory.metrics).toEqual(EXPECTED_OUTFIT_INVENTORY_V1);
    expect(inventory.maxGarmentCase).toEqual({
      activity: 'vogn',
      weather: {
        feelsLikeC: -30,
        tempC: -30,
        windMs: 8,
        precipMmH: 0,
      },
      child: { ageMonths: 0 },
      childCalibration: 0,
      vognMode: 'awake',
    });
    expect(inventory.maxGarmentItems).toEqual(ELEVEN_GARMENT_FIXTURE);
    expect(inventory.maxGarmentItems).toHaveLength(11);
    expect(inventory.unmappedCatalog).toEqual([]);
    expect(inventory.unmappedBody).toEqual([]);
    expect(() => assertOutfitInventoryV1(inventory)).not.toThrow();
  }, 120_000);
});
