import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { classifyOutfitItem } from '../../src/lib/outfit/body-anchor-catalog.js';
import { recommend } from '../../src/lib/wool-layers/recommend.js';
import type {
  Activity,
  LayerCategory,
  RecommendInput,
} from '../../src/lib/wool-layers/types.js';

export const OUTFIT_INVENTORY_DIMENSIONS_V1 = Object.freeze({
  ages: Object.freeze([0, 2, 3, 4, 5, 6, 7, 8, 9, 15, 16, 24, 25, 60]),
  feelsC: Object.freeze([
    -30, -16, -15, -11, -10, -8, -7, -6, -5, -1, 0, 1, 4, 5, 6, 7,
    8, 9, 10, 14, 15, 16, 17, 18, 21, 22, 23, 24, 27, 28, 29, 40,
  ]),
  winds: Object.freeze([0, 3, 5, 7, 8, 10]),
  precipitation: Object.freeze([0, 0.2, 0.5, 2]),
  symbols: Object.freeze([undefined, 'cloudy_day', 'clearsky_day']),
  calibrations: Object.freeze([-1, 0, 1] as const),
  canRoll: Object.freeze([undefined, false, true]),
  activities: Object.freeze<Activity[]>([
    'vogn',
    'baeresele',
    'utelek',
    'soevn',
  ]),
});

export type OutfitInventoryMetricsV1 = Readonly<{
  scenarioCount: number;
  uniqueOutputs: number;
  catalogCoverage: string;
  uniqueSemanticGarments: number;
  garmentBodyCoverage: string;
  uniqueSemanticEquipment: number;
  maxSemanticEquipment: number;
  maxSemanticGarments: number;
  aboveTen: number;
  belowOne: number;
}>;

export const EXPECTED_OUTFIT_INVENTORY_V1: OutfitInventoryMetricsV1 =
  Object.freeze({
    scenarioCount: 2_036_160,
    uniqueOutputs: 70,
    catalogCoverage: '70/70',
    uniqueSemanticGarments: 57,
    garmentBodyCoverage: '57/57',
    uniqueSemanticEquipment: 13,
    maxSemanticEquipment: 6,
    maxSemanticGarments: 11,
    aboveTen: 12_960,
    belowOne: 0,
  });

export type OutfitInventoryOutputV1 = Readonly<{
  label: string;
  engineCategories: readonly LayerCategory[];
  catalogGarmentId: string | null;
  catalogCategory: string | null;
  semanticKind: 'equipment' | 'garment' | 'unknown';
  bodyRegion: string | null;
}>;

export type OutfitInventoryV1 = Readonly<{
  inventoryVersion: 1;
  metrics: OutfitInventoryMetricsV1;
  branchRepresentatives: typeof OUTFIT_INVENTORY_DIMENSIONS_V1;
  maxGarmentCase: RecommendInput | null;
  maxGarmentItems: readonly string[];
  maxEquipmentCase: RecommendInput | null;
  maxEquipmentItems: readonly string[];
  outputs: readonly OutfitInventoryOutputV1[];
  unmappedCatalog: readonly OutfitInventoryOutputV1[];
  unmappedBody: readonly OutfitInventoryOutputV1[];
}>;

type SeenOutput = {
  engineCategories: Set<LayerCategory>;
  catalogGarmentId: string | null;
  catalogCategory: string | null;
  semanticKind: 'equipment' | 'garment' | 'unknown';
  bodyRegion: string | null;
};

let memoizedInventory: OutfitInventoryV1 | undefined;

function readonlyInput(input: RecommendInput): RecommendInput {
  return Object.freeze({
    ...input,
    weather: Object.freeze({ ...input.weather }),
    child: Object.freeze({ ...input.child }),
    ...(input.context === undefined
      ? {}
      : { context: Object.freeze({ ...input.context }) }),
  });
}

export function runOutfitInventoryV1(): OutfitInventoryV1 {
  if (memoizedInventory !== undefined) return memoizedInventory;

  const dimensions = OUTFIT_INVENTORY_DIMENSIONS_V1;
  const seen = new Map<string, SeenOutput>();
  let scenarioCount = 0;
  let maxSemanticGarments = -1;
  let maxSemanticEquipment = -1;
  let maxGarmentCase: RecommendInput | null = null;
  let maxEquipmentCase: RecommendInput | null = null;
  let maxGarmentItems: string[] = [];
  let maxEquipmentItems: string[] = [];
  let belowOne = 0;
  let aboveTen = 0;

  for (const ageMonths of dimensions.ages) {
    for (const feelsLikeC of dimensions.feelsC) {
      for (const activity of dimensions.activities) {
        const winds = activity === 'soevn' ? [0] : dimensions.winds;
        const precipitation =
          activity === 'soevn' ? [0] : dimensions.precipitation;
        const symbols =
          activity === 'soevn' ? [undefined] : dimensions.symbols;
        const vognModes =
          activity === 'vogn'
            ? (['awake', 'sleeping'] as const)
            : ([undefined] as const);
        const innerJakkes =
          activity === 'baeresele' ? [false, true] : [false];
        const bilstolModes = activity === 'vogn' ? [false, true] : [false];

        for (const windMs of winds) {
          for (const precipMmH of precipitation) {
            for (const symbolCode of symbols) {
              for (const childCalibration of dimensions.calibrations) {
                for (const canRoll of dimensions.canRoll) {
                  for (const vognMode of vognModes) {
                    for (const innerJakke of innerJakkes) {
                      for (const bilstol of bilstolModes) {
                        const input: RecommendInput = {
                          activity,
                          weather: {
                            feelsLikeC,
                            tempC: feelsLikeC,
                            windMs,
                            precipMmH,
                            ...(symbolCode === undefined
                              ? {}
                              : { symbolCode }),
                          },
                          child: {
                            ageMonths,
                            ...(canRoll === undefined ? {} : { canRoll }),
                          },
                          childCalibration,
                          ...(vognMode === undefined ? {} : { vognMode }),
                          ...(innerJakke ? { innerJakke: true } : {}),
                          ...(bilstol
                            ? { context: { bilstol: true } }
                            : {}),
                        };

                        const recommendation = recommend(input);
                        scenarioCount += 1;
                        const garments: string[] = [];
                        const equipment: string[] = [];

                        for (const layer of recommendation.layers) {
                          for (const sourceLabel of layer.items) {
                            const classified = classifyOutfitItem(
                              sourceLabel,
                              layer.category,
                            );
                            if (classified.kind === 'equipment') {
                              equipment.push(sourceLabel);
                            } else {
                              garments.push(sourceLabel);
                            }

                            const existing = seen.get(sourceLabel);
                            if (existing === undefined) {
                              seen.set(sourceLabel, {
                                engineCategories: new Set([layer.category]),
                                catalogGarmentId:
                                  classified.catalogGarmentId,
                                catalogCategory:
                                  classified.catalogCategory,
                                semanticKind: classified.kind,
                                bodyRegion: classified.bodyRegion,
                              });
                            } else {
                              existing.engineCategories.add(layer.category);
                            }
                          }
                        }

                        if (garments.length < 1) belowOne += 1;
                        if (garments.length > 10) aboveTen += 1;
                        if (garments.length > maxSemanticGarments) {
                          maxSemanticGarments = garments.length;
                          maxGarmentCase = readonlyInput(input);
                          maxGarmentItems = garments;
                        }
                        if (equipment.length > maxSemanticEquipment) {
                          maxSemanticEquipment = equipment.length;
                          maxEquipmentCase = readonlyInput(input);
                          maxEquipmentItems = equipment;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  const outputs = [...seen.entries()]
    .map(([label, value]): OutfitInventoryOutputV1 =>
      Object.freeze({
        label,
        engineCategories: Object.freeze(
          [...value.engineCategories].sort(),
        ),
        catalogGarmentId: value.catalogGarmentId,
        catalogCategory: value.catalogCategory,
        semanticKind: value.semanticKind,
        bodyRegion: value.bodyRegion,
      }),
    )
    .sort((left, right) => left.label.localeCompare(right.label, 'nb'));
  const semanticGarments = outputs.filter(
    (output) => output.semanticKind !== 'equipment',
  );
  const semanticEquipment = outputs.filter(
    (output) => output.semanticKind === 'equipment',
  );
  const unmappedCatalog = outputs.filter(
    (output) => output.catalogGarmentId === null,
  );
  const unmappedBody = semanticGarments.filter(
    (output) =>
      output.semanticKind !== 'garment' ||
      output.bodyRegion === null ||
      output.bodyRegion === 'unknown',
  );

  const metrics = Object.freeze({
    scenarioCount,
    uniqueOutputs: outputs.length,
    catalogCoverage: `${outputs.length - unmappedCatalog.length}/${outputs.length}`,
    uniqueSemanticGarments: semanticGarments.length,
    garmentBodyCoverage: `${semanticGarments.length - unmappedBody.length}/${semanticGarments.length}`,
    uniqueSemanticEquipment: semanticEquipment.length,
    maxSemanticEquipment,
    maxSemanticGarments,
    aboveTen,
    belowOne,
  });

  memoizedInventory = Object.freeze({
    inventoryVersion: 1,
    metrics,
    branchRepresentatives: dimensions,
    maxGarmentCase,
    maxGarmentItems: Object.freeze([...maxGarmentItems]),
    maxEquipmentCase,
    maxEquipmentItems: Object.freeze([...maxEquipmentItems]),
    outputs: Object.freeze(outputs),
    unmappedCatalog: Object.freeze(unmappedCatalog),
    unmappedBody: Object.freeze(unmappedBody),
  });
  return memoizedInventory;
}

export function assertOutfitInventoryV1(
  inventory: OutfitInventoryV1 = runOutfitInventoryV1(),
): void {
  const errors: string[] = [];
  for (const [key, expected] of Object.entries(
    EXPECTED_OUTFIT_INVENTORY_V1,
  )) {
    const actual =
      inventory.metrics[key as keyof OutfitInventoryMetricsV1];
    if (actual !== expected) {
      errors.push(`${key}: expected ${expected}, received ${actual}`);
    }
  }
  if (inventory.unmappedCatalog.length > 0) {
    errors.push(
      `unmapped catalog labels: ${inventory.unmappedCatalog.map((item) => item.label).join(', ')}`,
    );
  }
  if (inventory.unmappedBody.length > 0) {
    errors.push(
      `unmapped body labels: ${inventory.unmappedBody.map((item) => item.label).join(', ')}`,
    );
  }
  if (errors.length > 0) {
    throw new Error(`Outfit inventory v1 assertion failed:\n${errors.join('\n')}`);
  }
}

function isDirectInvocation(): boolean {
  const invoked = process.argv[1];
  if (invoked === undefined) return false;
  return pathToFileURL(resolve(invoked)).href === import.meta.url;
}

if (isDirectInvocation()) {
  const inventory = runOutfitInventoryV1();
  if (process.argv.includes('--assert')) {
    assertOutfitInventoryV1(inventory);
  }
  process.stdout.write(
    `${JSON.stringify(
      {
        inventoryVersion: inventory.inventoryVersion,
        metrics: inventory.metrics,
        maxGarmentCase: inventory.maxGarmentCase,
        maxGarmentItems: inventory.maxGarmentItems,
        maxEquipmentCase: inventory.maxEquipmentCase,
        maxEquipmentItems: inventory.maxEquipmentItems,
      },
      null,
      2,
    )}\n`,
  );
}
