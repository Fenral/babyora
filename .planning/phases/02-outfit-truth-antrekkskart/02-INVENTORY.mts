import { garmentIdFor } from '../../../src/data/garment-illustrations.ts';
import { categoryFor, type GarmentCategory } from '../../../src/data/garment-category.ts';
import { recommend } from '../../../src/lib/wool-layers/recommend.ts';
import type {
  Activity,
  LayerCategory,
  RecommendInput,
} from '../../../src/lib/wool-layers/types.ts';

/**
 * Read-only Phase 2 planning inventory.
 *
 * The arrays contain one representative on every side of each
 * garment-affecting legacy-engine threshold. Age representatives cover every
 * age predicate equivalence class. Wind/rain/symbol/calibration/mode booleans
 * cover every branch that can add, remove, or replace an item. Humidity, UV
 * and exposure are intentionally omitted because the current source uses them
 * for notes only; Phase 2 does not copy those notes into garment truth.
 */
const AGES = [0, 2, 3, 4, 5, 6, 7, 8, 9, 15, 16, 24, 25, 60] as const;
const FEELS_C = [
  -30, -16, -15, -11, -10, -8, -7, -6, -5, -1, 0, 1, 4, 5, 6, 7,
  8, 9, 10, 14, 15, 16, 17, 18, 21, 22, 23, 24, 27, 28, 29, 40,
] as const;
const WINDS = [0, 3, 5, 7, 8, 10] as const;
const PRECIP = [0, 0.2, 0.5, 2] as const;
const SYMBOLS = [undefined, 'cloudy_day', 'clearsky_day'] as const;
const CALIBRATIONS = [-1, 0, 1] as const;
const CAN_ROLL = [undefined, false, true] as const;
const ACTIVITIES: readonly Activity[] = ['vogn', 'baeresele', 'utelek', 'soevn'];

type BodyRegion =
  | 'head'
  | 'neck'
  | 'torso'
  | 'arms'
  | 'hands'
  | 'hips'
  | 'legs'
  | 'feet'
  | 'whole_body';

const BODY_BY_ID: ReadonlyArray<readonly [RegExp, BodyRegion]> = [
  [/^(solhatt|lue|balaklava)/, 'head'],
  [/^(votter|vindvotter)/, 'hands'],
  [/^hals$/, 'neck'],
  [/^(ullsokker|sko|toffel-sko|sandaler|vintersko)/, 'feet'],
  [/^bleie$/, 'hips'],
  [/(dress|regntoy-skall|vindtett-skall)/, 'whole_body'],
  [/(bukse|shorts)$/, 'legs'],
  [/(jakke|mellomlag)/, 'torso'],
  [/(body|ullsett|t-skjorte|pyjamas)/, 'torso'],
];

function bodyRegionFor(id: string): BodyRegion | null {
  return BODY_BY_ID.find(([pattern]) => pattern.test(id))?.[1] ?? null;
}

function catalogCategory(label: string): {
  id: string | null;
  category: GarmentCategory | null;
} {
  const id = garmentIdFor(label);
  return { id, category: id === null ? null : categoryFor(id) };
}

type Seen = {
  engineCategories: Set<LayerCategory>;
  catalogId: string | null;
  catalogCategory: GarmentCategory | null;
  semanticEquipment: boolean;
  bodyRegion: BodyRegion | null;
};

const seen = new Map<string, Seen>();
let scenarioCount = 0;
let maxGarments = -1;
let maxEquipment = -1;
let maxGarmentCase: RecommendInput | null = null;
let maxEquipmentCase: RecommendInput | null = null;
let maxGarmentItems: string[] = [];
let maxEquipmentItems: string[] = [];
let belowOne = 0;
let aboveTen = 0;

for (const ageMonths of AGES) {
  for (const feelsLikeC of FEELS_C) {
    for (const activity of ACTIVITIES) {
      const winds = activity === 'soevn' ? [0] as const : WINDS;
      const precipitation = activity === 'soevn' ? [0] as const : PRECIP;
      const symbols = activity === 'soevn' ? [undefined] as const : SYMBOLS;
      const vognModes = activity === 'vogn'
        ? ['awake', 'sleeping'] as const
        : [undefined] as const;
      const innerJakkes = activity === 'baeresele'
        ? [false, true] as const
        : [false] as const;
      const bilstolModes = activity === 'vogn'
        ? [false, true] as const
        : [false] as const;

      for (const windMs of winds) {
        for (const precipMmH of precipitation) {
          for (const symbolCode of symbols) {
            for (const childCalibration of CALIBRATIONS) {
              for (const canRoll of CAN_ROLL) {
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
                          ...(symbolCode === undefined ? {} : { symbolCode }),
                        },
                        child: {
                          ageMonths,
                          ...(canRoll === undefined ? {} : { canRoll }),
                        },
                        childCalibration,
                        ...(vognMode === undefined ? {} : { vognMode }),
                        ...(innerJakke ? { innerJakke: true } : {}),
                        ...(bilstol ? { context: { bilstol: true } } : {}),
                      };

                      const result = recommend(input);
                      scenarioCount += 1;
                      let garments = 0;
                      let equipment = 0;
                      const garmentItems: string[] = [];
                      const equipmentItems: string[] = [];

                      for (const layer of result.layers) {
                        for (const label of layer.items) {
                          const catalog = catalogCategory(label);
                          const semanticEquipment =
                            layer.category === 'utstyr' || catalog.category === 'utstyr';
                          if (semanticEquipment) {
                            equipment += 1;
                            equipmentItems.push(label);
                          } else {
                            garments += 1;
                            garmentItems.push(label);
                          }

                          const existing = seen.get(label);
                          if (existing) {
                            existing.engineCategories.add(layer.category);
                          } else {
                            seen.set(label, {
                              engineCategories: new Set([layer.category]),
                              catalogId: catalog.id,
                              catalogCategory: catalog.category,
                              semanticEquipment,
                              bodyRegion:
                                semanticEquipment || catalog.id === null
                                  ? null
                                  : bodyRegionFor(catalog.id),
                            });
                          }
                        }
                      }

                      if (garments < 1) belowOne += 1;
                      if (garments > 10) aboveTen += 1;
                      if (garments > maxGarments) {
                        maxGarments = garments;
                        maxGarmentCase = input;
                        maxGarmentItems = garmentItems;
                      }
                      if (equipment > maxEquipment) {
                        maxEquipment = equipment;
                        maxEquipmentCase = input;
                        maxEquipmentItems = equipmentItems;
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
  .map(([label, value]) => ({
    label,
    engineCategories: [...value.engineCategories].sort(),
    catalogId: value.catalogId,
    catalogCategory: value.catalogCategory,
    semanticEquipment: value.semanticEquipment,
    bodyRegion: value.bodyRegion,
  }))
  .sort((a, b) => a.label.localeCompare(b.label, 'nb'));

const garments = outputs.filter((item) => !item.semanticEquipment);
const equipment = outputs.filter((item) => item.semanticEquipment);
const unmappedCatalog = outputs.filter((item) => item.catalogId === null);
const unmappedBody = garments.filter((item) => item.bodyRegion === null);

process.stdout.write(`${JSON.stringify({
  inventoryVersion: 1,
  scenarioCount,
  branchRepresentatives: {
    ages: AGES,
    feelsC: FEELS_C,
    winds: WINDS,
    precipitation: PRECIP,
    symbols: SYMBOLS.map((value) => value ?? '<absent>'),
    calibrations: CALIBRATIONS,
    canRoll: CAN_ROLL.map((value) => value ?? '<absent>'),
    activities: ACTIVITIES,
  },
  measured: {
    maxSemanticGarments: maxGarments,
    maxSemanticEquipment: maxEquipment,
    belowOne,
    aboveTen,
    uniqueOutputs: outputs.length,
    uniqueSemanticGarments: garments.length,
    uniqueSemanticEquipment: equipment.length,
    catalogCoverage: `${outputs.length - unmappedCatalog.length}/${outputs.length}`,
    garmentBodyCoverage: `${garments.length - unmappedBody.length}/${garments.length}`,
  },
  maxGarmentCase,
  maxGarmentItems,
  maxEquipmentCase,
  maxEquipmentItems,
  semanticallyReclassifiedEquipment: equipment.filter(
    (item) => !item.engineCategories.includes('utstyr'),
  ),
  unmappedCatalog,
  unmappedBody,
  outputs,
}, null, 2)}\n`);
