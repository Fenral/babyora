import { isOutfitBundleProducerResult } from '../outfit/outfit-bundle-producer.js';
import {
  bodyRegionForCatalogGarment,
  normalizedBodyAnchorFor,
} from '../outfit/body-anchor-catalog.js';
import type {
  OutfitBundleProducerResult,
} from '../outfit/outfit-bundle-producer.js';
import type {
  AvatarVisibleSlot,
  AvatarVisualCoverage,
  BodyRegion,
  OutfitItemId,
  OutfitTruthSnapshotV1,
} from '../outfit/outfit-truth.js';
import type {
  OutfitTransitionVisualState,
  RegisterOutfitRow,
} from '../outfit/outfit-transition-contract.js';

export type RegisterHomeAnchor = (
  itemId: OutfitItemId,
  element: HTMLElement | null,
) => void;

export type Phase2TransitionRegistration = Readonly<{
  itemId: OutfitItemId;
  element: HTMLElement;
}>;

export type Phase2TransitionStaticReason =
  | 'absent-bundle'
  | 'invalid-bundle-provenance'
  | 'unsupported-cardinality'
  | 'unavailable'
  | 'invalid-visual-state'
  | 'invalid-identity'
  | 'empty-visible-set'
  | 'invalid-visible-id'
  | 'duplicate-visible-id'
  | 'duplicate-garment-id'
  | 'missing-garment'
  | 'equipment-collision'
  | 'garment-not-visible'
  | 'invalid-body-anchor'
  | 'invalid-avatar-coverage'
  | 'ambiguous-avatar-coverage'
  | 'hidden-visible-garment'
  | 'missing-home-anchor'
  | 'duplicate-home-anchor'
  | 'unexpected-home-anchor'
  | 'invalid-home-anchor'
  | 'missing-outfit-row'
  | 'duplicate-outfit-row'
  | 'unexpected-outfit-row'
  | 'invalid-outfit-row'
  | 'invalid-bundle-content';

export type Phase2TransitionAdapterResult =
  | Readonly<{
      kind: 'ready';
      identity: Readonly<{
        snapshotId: string;
        recommendationFingerprint: string;
        transitionContextId: string;
      }>;
      itemIds: readonly OutfitItemId[];
      homeAnchors: readonly Phase2TransitionRegistration[];
      outfitRows: readonly Phase2TransitionRegistration[];
      transitionVisualState: OutfitTransitionVisualState;
    }>
  | Readonly<{
      kind: 'static-only';
      reason: Phase2TransitionStaticReason;
    }>;

type StaticOnlyResult = Extract<
  Phase2TransitionAdapterResult,
  { kind: 'static-only' }
>;

export type Phase2HomeSourceDescriptor = Readonly<{
  itemId: OutfitItemId;
  label: string;
}>;

export type Phase2HomeSourceSelection =
  | Readonly<{
      kind: 'ready';
      identity: Readonly<{
        snapshotId: string;
        recommendationFingerprint: string;
        transitionContextId: string;
      }>;
      sources: readonly Phase2HomeSourceDescriptor[];
    }>
  | StaticOnlyResult;

export type Phase2TransitionAdapter = Readonly<{
  registerHomeAnchor: RegisterHomeAnchor;
  registerOutfitRow: RegisterOutfitRow;
  selectHomeSources: (
    outfitBundle: OutfitBundleProducerResult | null | undefined,
  ) => Phase2HomeSourceSelection;
  evaluate: (input: Readonly<{
    outfitBundle: OutfitBundleProducerResult | null | undefined;
    transitionVisualState: OutfitTransitionVisualState;
  }>) => Phase2TransitionAdapterResult;
  clear: () => void;
}>;

const AVATAR_VISIBLE_SLOTS: ReadonlySet<AvatarVisibleSlot> = new Set([
  'head',
  'neck',
  'torso',
  'arms',
  'hands',
  'hips',
  'legs',
  'feet',
]);

const BODY_REGIONS: ReadonlySet<BodyRegion> = new Set([
  'head',
  'neck',
  'torso',
  'arms',
  'hands',
  'hips',
  'legs',
  'feet',
  'whole_body',
  'unknown',
]);

type ResolvedGarment = OutfitTruthSnapshotV1['garments'][number];

type ValidatedGarment = Readonly<{
  garment: ResolvedGarment;
  coverage: AvatarVisualCoverage;
}>;

type ResolvedSupportedTruth = Readonly<{
  kind: 'resolved';
  identity: Readonly<{
    snapshotId: string;
    recommendationFingerprint: string;
    transitionContextId: string;
  }>;
  itemIds: readonly OutfitItemId[];
  garments: readonly ValidatedGarment[];
}>;

function staticOnly(
  reason: Phase2TransitionStaticReason,
): StaticOnlyResult {
  return Object.freeze({ kind: 'static-only', reason });
}

function isDenseArray(value: readonly unknown[]): boolean {
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.hasOwn(value, index)) return false;
  }
  return true;
}

function validSlotArray(
  value: readonly AvatarVisibleSlot[],
  allowEmpty: boolean,
): boolean {
  if (
    !Array.isArray(value)
    || !isDenseArray(value)
    || (!allowEmpty && value.length === 0)
  ) {
    return false;
  }
  const seen = new Set<AvatarVisibleSlot>();
  for (const slot of value) {
    if (
      !AVATAR_VISIBLE_SLOTS.has(slot)
      || seen.has(slot)
    ) {
      return false;
    }
    seen.add(slot);
  }
  return true;
}

function validateCoverage(
  value: AvatarVisualCoverage | null,
): AvatarVisualCoverage | null {
  if (
    value === null
    || value.coverageVersion !== 1
    || !validSlotArray(value.bodyCoverage, false)
    || !validSlotArray(value.visibleSlots, false)
    || !validSlotArray(value.occludesSlots, true)
    || !Number.isFinite(value.visualLayerRank)
  ) {
    return null;
  }

  const bodySlots = new Set(value.bodyCoverage);
  if (
    value.visibleSlots.some((slot) => !bodySlots.has(slot))
    || value.occludesSlots.some((slot) => !bodySlots.has(slot))
  ) {
    return null;
  }
  return value;
}

function hasValidBodyAnchor(
  garment: ResolvedGarment,
  avatarPose: OutfitTruthSnapshotV1['avatar']['pose'],
): boolean {
  const anchor = garment.bodyAnchor;
  const region = garment.bodyRegion;
  if (
    !BODY_REGIONS.has(region)
    || region === 'unknown'
    || anchor === null
    || anchor.anchorVersion !== 1
    || (avatarPose !== 'sitting' && avatarPose !== 'standing')
    || anchor.pose !== avatarPose
    || !Number.isFinite(anchor.x)
    || !Number.isFinite(anchor.y)
    || anchor.x < 0
    || anchor.x > 1
    || anchor.y < 0
    || anchor.y > 1
    || typeof garment.catalogGarmentId !== 'string'
  ) {
    return false;
  }

  const catalogGarmentId = garment.catalogGarmentId as
    Parameters<typeof bodyRegionForCatalogGarment>[0];
  const expectedRegion = bodyRegionForCatalogGarment(catalogGarmentId);
  const expectedAnchor = normalizedBodyAnchorFor(
    catalogGarmentId,
    avatarPose,
  );

  return (
    expectedRegion === region
    && expectedAnchor !== null
    && expectedAnchor.pose === anchor.pose
    && expectedAnchor.x === anchor.x
    && expectedAnchor.y === anchor.y
  );
}

function resolveVisibleGarments(
  base: OutfitTruthSnapshotV1,
):
  | Readonly<{
      kind: 'resolved';
      itemIds: readonly OutfitItemId[];
      garments: readonly ValidatedGarment[];
    }>
  | Readonly<{
      kind: 'static-only';
      reason: Phase2TransitionStaticReason;
    }> {
  const visibleIds = base.avatar.visibleGarmentIds;
  if (
    !Array.isArray(visibleIds)
    || !isDenseArray(visibleIds)
    || visibleIds.length === 0
  ) {
    return staticOnly('empty-visible-set');
  }

  const seenVisibleIds = new Set<OutfitItemId>();
  for (const itemId of visibleIds) {
    if (typeof itemId !== 'string' || itemId.trim().length === 0) {
      return staticOnly('invalid-visible-id');
    }
    const exactItemId = itemId as OutfitItemId;
    if (seenVisibleIds.has(exactItemId)) {
      return staticOnly('duplicate-visible-id');
    }
    seenVisibleIds.add(exactItemId);
  }

  const garmentById = new Map<OutfitItemId, ResolvedGarment>();
  for (const garment of base.garments) {
    if (garmentById.has(garment.itemId)) {
      return staticOnly('duplicate-garment-id');
    }
    garmentById.set(garment.itemId, garment);
  }

  const equipmentIds = new Set<OutfitItemId>();
  for (const equipment of base.equipment) {
    equipmentIds.add(equipment.itemId);
  }

  const garments: ValidatedGarment[] = [];
  for (const itemId of visibleIds) {
    if (equipmentIds.has(itemId)) {
      return staticOnly('equipment-collision');
    }
    const garment = garmentById.get(itemId);
    if (garment === undefined) {
      return staticOnly('missing-garment');
    }
    if (garment.visibleOnAvatar !== true) {
      return staticOnly('garment-not-visible');
    }
    if (!hasValidBodyAnchor(garment, base.avatar.pose)) {
      return staticOnly('invalid-body-anchor');
    }
    const coverage = validateCoverage(garment.avatarCoverage);
    if (coverage === null) {
      return staticOnly('invalid-avatar-coverage');
    }
    garments.push(Object.freeze({ garment, coverage }));
  }

  const winningIds = new Set<OutfitItemId>();
  for (const slot of AVATAR_VISIBLE_SLOTS) {
    const candidates: ValidatedGarment[] = [];
    for (const candidate of garments) {
      if (candidate.coverage.visibleSlots.includes(slot)) {
        candidates.push(candidate);
      }
    }
    if (candidates.length === 0) continue;

    let highestRank = Number.NEGATIVE_INFINITY;
    for (const candidate of candidates) {
      highestRank = Math.max(
        highestRank,
        candidate.coverage.visualLayerRank,
      );
    }
    const winners: ValidatedGarment[] = [];
    for (const candidate of candidates) {
      if (candidate.coverage.visualLayerRank === highestRank) {
        winners.push(candidate);
      }
    }
    if (winners.length !== 1) {
      return staticOnly('ambiguous-avatar-coverage');
    }

    const winner = winners[0]!;
    for (const candidate of candidates) {
      if (
        candidate.garment.itemId !== winner.garment.itemId
        && !winner.coverage.occludesSlots.includes(slot)
      ) {
        return staticOnly('ambiguous-avatar-coverage');
      }
    }
    winningIds.add(winner.garment.itemId);
  }

  for (const itemId of visibleIds) {
    if (!winningIds.has(itemId)) {
      return staticOnly('hidden-visible-garment');
    }
  }

  return Object.freeze({
    kind: 'resolved',
    itemIds: Object.freeze([...visibleIds]),
    garments: Object.freeze(garments),
  });
}

function resolveSupportedTruth(
  base: OutfitTruthSnapshotV1,
): ResolvedSupportedTruth | StaticOnlyResult {
  if (
    typeof base.snapshotId !== 'string'
    || base.snapshotId.length === 0
    || typeof base.recommendationFingerprint !== 'string'
    || base.recommendationFingerprint.length === 0
    || typeof base.transitionContextId !== 'string'
    || base.transitionContextId.length === 0
  ) {
    return staticOnly('invalid-identity');
  }

  const visible = resolveVisibleGarments(base);
  if (visible.kind === 'static-only') return visible;
  if (visible.garments.some(
    ({ garment }) => (
      typeof garment.label !== 'string'
      || garment.label.trim().length === 0
    ),
  )) {
    return staticOnly('invalid-bundle-content');
  }

  return Object.freeze({
    kind: 'resolved',
    identity: Object.freeze({
      snapshotId: base.snapshotId,
      recommendationFingerprint: base.recommendationFingerprint,
      transitionContextId: base.transitionContextId,
    }),
    itemIds: visible.itemIds,
    garments: visible.garments,
  });
}

function selectHomeSources(
  outfitBundle: unknown,
): Phase2HomeSourceSelection {
  try {
    if (outfitBundle === null || outfitBundle === undefined) {
      return staticOnly('absent-bundle');
    }
    if (!isOutfitBundleProducerResult(outfitBundle)) {
      return staticOnly('invalid-bundle-provenance');
    }
    if (outfitBundle.kind === 'unsupported-cardinality') {
      return staticOnly('unsupported-cardinality');
    }
    if (outfitBundle.kind === 'unavailable') {
      return staticOnly('unavailable');
    }

    const truth = resolveSupportedTruth(outfitBundle.base);
    if (truth.kind === 'static-only') return truth;
    return Object.freeze({
      kind: 'ready',
      identity: truth.identity,
      sources: Object.freeze(truth.garments.map(
        ({ garment }) => Object.freeze({
          itemId: garment.itemId,
          label: garment.label,
        }),
      )),
    });
  } catch {
    return staticOnly('invalid-bundle-content');
  }
}

function createRegistry(): Readonly<{
  register: (
    itemId: OutfitItemId,
    element: HTMLElement | null,
  ) => void;
  read: () => ReadonlyMap<OutfitItemId, readonly HTMLElement[]>;
  clear: () => void;
}> {
  const elementsByItemId = new Map<OutfitItemId, HTMLElement[]>();

  const register = (
    itemId: OutfitItemId,
    element: HTMLElement | null,
  ): void => {
    if (element === null) {
      elementsByItemId.delete(itemId);
      return;
    }
    const elements = elementsByItemId.get(itemId);
    if (elements === undefined) {
      elementsByItemId.set(itemId, [element]);
      return;
    }
    if (!elements.includes(element)) {
      elements.push(element);
    }
  };

  return Object.freeze({
    register,
    read: () => elementsByItemId,
    clear: () => elementsByItemId.clear(),
  });
}

function hasUsableGeometry(element: HTMLElement): boolean {
  try {
    if (
      typeof Element === 'undefined'
      || !(element instanceof Element)
      || element.isConnected !== true
    ) {
      return false;
    }
    const rectangle = element.getBoundingClientRect();
    return (
      Number.isFinite(rectangle.x)
      && Number.isFinite(rectangle.y)
      && Number.isFinite(rectangle.width)
      && Number.isFinite(rectangle.height)
      && rectangle.width > 0
      && rectangle.height > 0
    );
  } catch {
    return false;
  }
}

function resolveRegistrations(
  itemIds: readonly OutfitItemId[],
  registrations: ReadonlyMap<OutfitItemId, readonly HTMLElement[]>,
  side: 'home' | 'outfit',
):
  | Readonly<{
      kind: 'resolved';
      registrations: readonly Phase2TransitionRegistration[];
    }>
  | Readonly<{
      kind: 'static-only';
      reason: Phase2TransitionStaticReason;
    }> {
  const intendedIds = new Set(itemIds);
  for (const itemId of registrations.keys()) {
    if (!intendedIds.has(itemId)) {
      return staticOnly(
        side === 'home'
          ? 'unexpected-home-anchor'
          : 'unexpected-outfit-row',
      );
    }
  }

  const resolved: Phase2TransitionRegistration[] = [];
  const seenElements = new Set<HTMLElement>();
  for (const itemId of itemIds) {
    const elements = registrations.get(itemId);
    if (elements === undefined || elements.length === 0) {
      return staticOnly(
        side === 'home'
          ? 'missing-home-anchor'
          : 'missing-outfit-row',
      );
    }
    if (elements.length !== 1) {
      return staticOnly(
        side === 'home'
          ? 'duplicate-home-anchor'
          : 'duplicate-outfit-row',
      );
    }
    const element = elements[0]!;
    if (seenElements.has(element)) {
      return staticOnly(
        side === 'home'
          ? 'duplicate-home-anchor'
          : 'duplicate-outfit-row',
      );
    }
    seenElements.add(element);
    if (!hasUsableGeometry(element)) {
      return staticOnly(
        side === 'home'
          ? 'invalid-home-anchor'
          : 'invalid-outfit-row',
      );
    }
    resolved.push(Object.freeze({ itemId, element }));
  }

  return Object.freeze({
    kind: 'resolved',
    registrations: Object.freeze(resolved),
  });
}

function evaluateSupportedBundle(
  base: OutfitTruthSnapshotV1,
  transitionVisualState: OutfitTransitionVisualState,
  homeRegistry: ReadonlyMap<OutfitItemId, readonly HTMLElement[]>,
  outfitRegistry: ReadonlyMap<OutfitItemId, readonly HTMLElement[]>,
): Phase2TransitionAdapterResult {
  const truth = resolveSupportedTruth(base);
  if (truth.kind === 'static-only') return truth;

  const home = resolveRegistrations(
    truth.itemIds,
    homeRegistry,
    'home',
  );
  if (home.kind === 'static-only') return home;

  const outfit = resolveRegistrations(
    truth.itemIds,
    outfitRegistry,
    'outfit',
  );
  if (outfit.kind === 'static-only') return outfit;

  return Object.freeze({
    kind: 'ready',
    identity: truth.identity,
    itemIds: truth.itemIds,
    homeAnchors: home.registrations,
    outfitRows: outfit.registrations,
    transitionVisualState,
  });
}

function readEvaluationEnvelope(
  input: unknown,
): Readonly<{
  outfitBundle: unknown;
  transitionVisualState: unknown;
}> | null {
  try {
    if (
      input === null
      || typeof input !== 'object'
      || Array.isArray(input)
      || Object.getPrototypeOf(input) !== Object.prototype
    ) {
      return null;
    }

    const expectedKeys = new Set([
      'outfitBundle',
      'transitionVisualState',
    ]);
    const keys = Reflect.ownKeys(input);
    if (
      keys.length !== expectedKeys.size
      || keys.some(
        (key) => typeof key !== 'string' || !expectedKeys.has(key),
      )
    ) {
      return null;
    }

    const outfitBundle = Object.getOwnPropertyDescriptor(
      input,
      'outfitBundle',
    );
    const transitionVisualState = Object.getOwnPropertyDescriptor(
      input,
      'transitionVisualState',
    );
    if (
      outfitBundle === undefined
      || !Object.hasOwn(outfitBundle, 'value')
      || outfitBundle.enumerable !== true
      || transitionVisualState === undefined
      || !Object.hasOwn(transitionVisualState, 'value')
      || transitionVisualState.enumerable !== true
    ) {
      return null;
    }

    return {
      outfitBundle: outfitBundle.value,
      transitionVisualState: transitionVisualState.value,
    };
  } catch {
    return null;
  }
}

export function createPhase2TransitionAdapter(): Phase2TransitionAdapter {
  const home = createRegistry();
  const outfit = createRegistry();

  return Object.freeze({
    registerHomeAnchor: home.register,
    registerOutfitRow: outfit.register,
    selectHomeSources,
    evaluate: (input): Phase2TransitionAdapterResult => {
      try {
        const envelope = readEvaluationEnvelope(input);
        if (envelope === null) {
          return staticOnly('invalid-bundle-content');
        }
        const { outfitBundle, transitionVisualState } = envelope;
        if (
          transitionVisualState !== 'settled'
          && transitionVisualState !== 'landing'
        ) {
          return staticOnly('invalid-visual-state');
        }
        if (outfitBundle === null || outfitBundle === undefined) {
          return staticOnly('absent-bundle');
        }
        if (!isOutfitBundleProducerResult(outfitBundle)) {
          return staticOnly('invalid-bundle-provenance');
        }
        if (outfitBundle.kind === 'unsupported-cardinality') {
          return staticOnly('unsupported-cardinality');
        }
        if (outfitBundle.kind === 'unavailable') {
          return staticOnly('unavailable');
        }
        const base: OutfitTruthSnapshotV1 = outfitBundle.base;
        return evaluateSupportedBundle(
          base,
          transitionVisualState,
          home.read(),
          outfit.read(),
        );
      } catch {
        return staticOnly('invalid-bundle-content');
      }
    },
    clear: () => {
      home.clear();
      outfit.clear();
    },
  });
}
