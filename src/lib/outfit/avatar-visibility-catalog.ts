export type AvatarVisibleSlot =
  | 'head'
  | 'neck'
  | 'torso'
  | 'arms'
  | 'hands'
  | 'hips'
  | 'legs'
  | 'feet';

export type AvatarVisualCoverage = Readonly<{
  coverageVersion: 1;
  bodyCoverage: readonly AvatarVisibleSlot[];
  visibleSlots: readonly AvatarVisibleSlot[];
  visualLayerRank: number;
  occludesSlots: readonly AvatarVisibleSlot[];
}>;

const SLOT_SETS = {
  shortBody: ['torso', 'hips'],
  longBody: ['torso', 'arms', 'hips'],
  fullBase: ['torso', 'arms', 'hips', 'legs'],
  torso: ['torso', 'arms'],
  lower: ['hips', 'legs'],
  wholeBody: ['torso', 'arms', 'hips', 'legs'],
  head: ['head'],
  neck: ['neck'],
  hands: ['hands'],
  feet: ['feet'],
} as const satisfies Readonly<Record<string, readonly AvatarVisibleSlot[]>>;

function coverage(
  slots: readonly AvatarVisibleSlot[],
  visualLayerRank: number,
): AvatarVisualCoverage {
  return Object.freeze({
    coverageVersion: 1,
    bodyCoverage: Object.freeze([...slots]),
    visibleSlots: Object.freeze([...slots]),
    visualLayerRank,
    occludesSlots: Object.freeze([...slots]),
  });
}

const COVERAGE_BY_CATALOG_ID: Readonly<
  Record<string, AvatarVisualCoverage>
> = Object.freeze({
  'kortermet-body': coverage(SLOT_SETS.shortBody, 10),
  'kortermet-ullbody': coverage(SLOT_SETS.shortBody, 10),
  'langermet-body': coverage(SLOT_SETS.longBody, 10),
  'langermet-ullbody': coverage(SLOT_SETS.longBody, 10),
  'langermet-ullbody-tynn': coverage(SLOT_SETS.longBody, 10),
  'ullsett-tynt': coverage(SLOT_SETS.fullBase, 10),
  'ullsett-tykt': coverage(SLOT_SETS.fullBase, 10),
  'to-ullsett': coverage(SLOT_SETS.fullBase, 10),
  't-skjorte': coverage(SLOT_SETS.torso, 10),
  shorts: coverage(SLOT_SETS.lower, 10),
  'lett-bukse': coverage(SLOT_SETS.lower, 10),
  bleie: coverage(['hips'], 10),
  ullsokker: coverage(SLOT_SETS.feet, 10),

  'tynn-bukse': coverage(SLOT_SETS.lower, 20),
  'tynn-ull-mellomlag': coverage(SLOT_SETS.torso, 20),
  'ull-mellomlag': coverage(SLOT_SETS.torso, 20),
  'ull-mellomlag-tykt': coverage(SLOT_SETS.torso, 20),
  'ull-jakke': coverage(SLOT_SETS.torso, 20),
  'ull-bukse': coverage(SLOT_SETS.lower, 20),
  'tynn-pyjamas': coverage(SLOT_SETS.fullBase, 20),
  pyjamas: coverage(SLOT_SETS.fullBase, 20),
  'ull-pyjamas': coverage(SLOT_SETS.fullBase, 20),

  'lett-kjoredress': coverage(SLOT_SETS.wholeBody, 30),
  kjoredress: coverage(SLOT_SETS.wholeBody, 30),
  vinterkjoredress: coverage(SLOT_SETS.wholeBody, 30),
  'vinterkjoredress-isolert': coverage(SLOT_SETS.wholeBody, 30),
  vinterdress: coverage(SLOT_SETS.wholeBody, 30),
  'vinterdress-isolert': coverage(SLOT_SETS.wholeBody, 30),
  'regntoy-skall': coverage(SLOT_SETS.wholeBody, 40),
  'vindtett-skall': coverage(SLOT_SETS.wholeBody, 40),

  solhatt: coverage(SLOT_SETS.head, 40),
  'lue-tynn': coverage(SLOT_SETS.head, 40),
  lue: coverage(SLOT_SETS.head, 40),
  'lue-m-ull': coverage(SLOT_SETS.head, 40),
  balaklava: coverage(['head', 'neck'], 50),
  'votter-tynne': coverage(SLOT_SETS.hands, 40),
  votter: coverage(SLOT_SETS.hands, 40),
  'votter-tykke': coverage(SLOT_SETS.hands, 40),
  'votter-dun': coverage(SLOT_SETS.hands, 50),
  'vindvotter-skall': coverage(SLOT_SETS.hands, 60),
  hals: coverage(SLOT_SETS.neck, 40),
  sko: coverage(SLOT_SETS.feet, 40),
  'toffel-sko': coverage(SLOT_SETS.feet, 40),
  sandaler: coverage(SLOT_SETS.feet, 40),
  vintersko: coverage(SLOT_SETS.feet, 40),
  'vintersko-isolerte': coverage(SLOT_SETS.feet, 50),
});

export function avatarCoverageForCatalogGarment(
  catalogGarmentId: string,
): AvatarVisualCoverage | null {
  return Object.hasOwn(COVERAGE_BY_CATALOG_ID, catalogGarmentId)
    ? COVERAGE_BY_CATALOG_ID[catalogGarmentId]
    : null;
}
