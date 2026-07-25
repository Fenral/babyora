import {
  categoryFor,
  type GarmentCategory,
} from '../../data/garment-category.js';
import {
  garmentIdFor,
  type GarmentId,
} from '../../data/garment-illustrations.js';
import type { LayerCategory } from '../wool-layers/types.js';

export type BodyRegion =
  | 'head'
  | 'neck'
  | 'torso'
  | 'arms'
  | 'hands'
  | 'hips'
  | 'legs'
  | 'feet'
  | 'whole_body'
  | 'unknown';

export type OutfitAvatarPose = 'sitting' | 'standing';

export type NormalizedBodyAnchor = Readonly<{
  anchorVersion: 1;
  pose: OutfitAvatarPose;
  x: number;
  y: number;
}>;

type SemanticGarmentClassification = Readonly<{
  kind: 'garment';
  sourceLabel: string;
  catalogGarmentId: GarmentId;
  catalogCategory: Exclude<GarmentCategory, 'utstyr'>;
  bodyRegion: Exclude<BodyRegion, 'unknown'>;
  bodyAnchor: NormalizedBodyAnchor;
}>;

type SemanticEquipmentClassification = Readonly<{
  kind: 'equipment';
  sourceLabel: string;
  catalogGarmentId: GarmentId | null;
  catalogCategory: GarmentCategory | null;
  bodyRegion: null;
  bodyAnchor: null;
}>;

type UnknownGarmentClassification = Readonly<{
  kind: 'unknown';
  sourceLabel: string;
  catalogGarmentId: null;
  catalogCategory: null;
  bodyRegion: 'unknown';
  bodyAnchor: null;
}>;

export type SemanticOutfitItemClassification =
  | SemanticGarmentClassification
  | SemanticEquipmentClassification
  | UnknownGarmentClassification;

const REGION_CATALOG_IDS = {
  head: [
    'solhatt',
    'lue-tynn',
    'lue',
    'lue-m-ull',
    'balaklava',
  ],
  neck: ['hals'],
  torso: [
    'kortermet-body',
    'kortermet-ullbody',
    'langermet-body',
    'langermet-ullbody',
    'langermet-ullbody-tynn',
    't-skjorte',
    'tynn-ull-mellomlag',
    'ull-mellomlag',
    'ull-mellomlag-tykt',
    'ull-jakke',
    'tynn-pyjamas',
    'pyjamas',
    'ull-pyjamas',
  ],
  arms: [],
  hands: [
    'votter-tynne',
    'votter',
    'votter-tykke',
    'votter-dun',
    'vindvotter-skall',
  ],
  hips: ['bleie'],
  legs: ['shorts', 'lett-bukse', 'tynn-bukse', 'ull-bukse'],
  feet: [
    'ullsokker',
    'sko',
    'toffel-sko',
    'sandaler',
    'vintersko',
    'vintersko-isolerte',
  ],
  whole_body: [
    'ullsett-tynt',
    'ullsett-tykt',
    'to-ullsett',
    'lett-kjoredress',
    'kjoredress',
    'vinterkjoredress',
    'vinterkjoredress-isolert',
    'vinterdress',
    'vinterdress-isolert',
    'regntoy-skall',
    'vindtett-skall',
  ],
} as const satisfies Readonly<
  Record<Exclude<BodyRegion, 'unknown'>, readonly GarmentId[]>
>;

const BODY_REGION_BY_CATALOG_ID: Readonly<
  Record<GarmentId, Exclude<BodyRegion, 'unknown'>>
> = Object.freeze(
  Object.entries(REGION_CATALOG_IDS).reduce<
    Record<GarmentId, Exclude<BodyRegion, 'unknown'>>
  >((catalog, [region, ids]) => {
    for (const id of ids) {
      catalog[id] = region as Exclude<BodyRegion, 'unknown'>;
    }
    return catalog;
  }, {}),
);

const ANCHOR_POINTS = Object.freeze({
  standing: Object.freeze({
    head: [0.5, 0.12] as const,
    neck: [0.5, 0.24] as const,
    torso: [0.5, 0.38] as const,
    arms: [0.5, 0.42] as const,
    hands: [0.5, 0.56] as const,
    hips: [0.5, 0.58] as const,
    legs: [0.5, 0.74] as const,
    feet: [0.5, 0.94] as const,
    whole_body: [0.5, 0.5] as const,
  }),
  sitting: Object.freeze({
    head: [0.5, 0.14] as const,
    neck: [0.5, 0.27] as const,
    torso: [0.5, 0.4] as const,
    arms: [0.5, 0.44] as const,
    hands: [0.5, 0.58] as const,
    hips: [0.5, 0.58] as const,
    legs: [0.5, 0.7] as const,
    feet: [0.5, 0.84] as const,
    whole_body: [0.5, 0.52] as const,
  }),
}) satisfies Readonly<
  Record<
    OutfitAvatarPose,
    Readonly<Record<Exclude<BodyRegion, 'unknown'>, readonly [number, number]>>
  >
>;

function makeAnchor(
  region: Exclude<BodyRegion, 'unknown'>,
  pose: OutfitAvatarPose,
): NormalizedBodyAnchor {
  const [x, y] = ANCHOR_POINTS[pose][region];
  return Object.freeze({
    anchorVersion: 1,
    pose,
    x,
    y,
  });
}

export function bodyRegionForCatalogGarment(
  catalogGarmentId: GarmentId,
): Exclude<BodyRegion, 'unknown'> | null {
  return Object.hasOwn(BODY_REGION_BY_CATALOG_ID, catalogGarmentId)
    ? BODY_REGION_BY_CATALOG_ID[catalogGarmentId]
    : null;
}

export function normalizedBodyAnchorFor(
  catalogGarmentId: GarmentId,
  pose: OutfitAvatarPose,
): NormalizedBodyAnchor | null {
  const region = bodyRegionForCatalogGarment(catalogGarmentId);
  return region === null ? null : makeAnchor(region, pose);
}

export function classifyOutfitItem(
  sourceLabel: string,
  engineCategory: LayerCategory,
  pose: OutfitAvatarPose = 'standing',
): SemanticOutfitItemClassification {
  const normalizedSourceLabel = sourceLabel.trim();
  const resolvedCatalogGarmentId = Object.hasOwn(
    Object.prototype,
    normalizedSourceLabel,
  )
    ? null
    : garmentIdFor(sourceLabel);
  const catalogGarmentId =
    typeof resolvedCatalogGarmentId === 'string'
      ? resolvedCatalogGarmentId
      : null;
  const catalogCategory =
    catalogGarmentId === null ? null : categoryFor(catalogGarmentId);

  if (engineCategory === 'utstyr' || catalogCategory === 'utstyr') {
    return Object.freeze({
      kind: 'equipment',
      sourceLabel,
      catalogGarmentId,
      catalogCategory,
      bodyRegion: null,
      bodyAnchor: null,
    });
  }

  if (catalogGarmentId === null || catalogCategory === null) {
    return Object.freeze({
      kind: 'unknown',
      sourceLabel,
      catalogGarmentId: null,
      catalogCategory: null,
      bodyRegion: 'unknown',
      bodyAnchor: null,
    });
  }

  const bodyRegion = bodyRegionForCatalogGarment(catalogGarmentId);
  const bodyAnchor = normalizedBodyAnchorFor(catalogGarmentId, pose);
  if (bodyRegion === null || bodyAnchor === null) {
    return Object.freeze({
      kind: 'unknown',
      sourceLabel,
      catalogGarmentId: null,
      catalogCategory: null,
      bodyRegion: 'unknown',
      bodyAnchor: null,
    });
  }

  return Object.freeze({
    kind: 'garment',
    sourceLabel,
    catalogGarmentId,
    catalogCategory,
    bodyRegion,
    bodyAnchor,
  });
}
