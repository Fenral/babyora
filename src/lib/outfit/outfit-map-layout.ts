import {
  isOutfitTruthSnapshot,
  type OutfitItemId,
  type OutfitSnapshotId,
  type OutfitTruthSnapshotV1,
} from './outfit-truth.js';

export type OutfitMapMode = 'spacious' | 'compact-rails';

export type OutfitMapPoint = Readonly<{
  x: number;
  y: number;
}>;

export type OutfitMapBox = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type OutfitMapNodeLayout = Readonly<{
  itemId: OutfitItemId;
  order: number;
  side: 'left' | 'right';
  railIndex: number;
  box: OutfitMapBox;
  connector: readonly OutfitMapPoint[];
}>;

export type OutfitMapLayoutOptionsV1 = Readonly<{
  textScale?: number;
}>;

export type OutfitMapLayoutV1 = Readonly<{
  kind: 'layout';
  layoutVersion: 1;
  snapshotId: OutfitSnapshotId;
  mode: OutfitMapMode;
  width: number;
  height: number;
  textScale: number;
  avatarBox: OutfitMapBox;
  nodes: readonly OutfitMapNodeLayout[];
}>;

export type OutfitMapIneligibleReason =
  | 'invalid-snapshot'
  | 'unsupported-cardinality'
  | 'invalid-width'
  | 'invalid-constraints'
  | 'missing-body-anchor'
  | 'invalid-body-anchor'
  | 'invalid-geometry';

export type OutfitMapIneligibleV1 = Readonly<{
  kind: 'map-ineligible';
  layoutVersion: 1;
  reason: OutfitMapIneligibleReason;
}>;

export type OutfitMapLayoutResultV1 =
  | OutfitMapLayoutV1
  | OutfitMapIneligibleV1;

const MIN_LAYOUT_WIDTH = 240;
const MAX_LAYOUT_WIDTH = 4096;
const MIN_TEXT_SCALE = 1;
const MAX_TEXT_SCALE = 2;
const MAX_LAYOUT_HEIGHT = 768;
const EPSILON = 1e-7;

type AnchoredGarment = Readonly<{
  itemId: OutfitItemId;
  order: number;
  anchorX: number;
  anchorY: number;
}>;

function mapIneligible(
  reason: OutfitMapIneligibleReason,
): OutfitMapIneligibleV1 {
  return Object.freeze({
    kind: 'map-ineligible',
    layoutVersion: 1,
    reason,
  });
}

function freezeDeep<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const key of Reflect.ownKeys(value)) {
      freezeDeep((value as Record<PropertyKey, unknown>)[key]);
    }
    Object.freeze(value);
  }
  return value;
}

function ownDataValue(
  value: object,
  key: string,
): Readonly<{ found: false }> | Readonly<{ found: true; value: unknown }> {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (
    descriptor === undefined ||
    !('value' in descriptor) ||
    descriptor.get !== undefined ||
    descriptor.set !== undefined
  ) {
    return { found: false };
  }
  return { found: true, value: descriptor.value };
}

function isUnsupportedCardinalityResult(value: unknown): boolean {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return false;
  }
  const kind = ownDataValue(value, 'kind');
  const reason = ownDataValue(value, 'reason');
  return (
    kind.found &&
    kind.value === 'unsupported-cardinality' &&
    reason.found &&
    reason.value === 'semantic-garment-count-outside-1-10'
  );
}

function readTextScale(
  options: OutfitMapLayoutOptionsV1,
): number | null {
  if (
    options === null ||
    typeof options !== 'object' ||
    Array.isArray(options) ||
    Object.getPrototypeOf(options) !== Object.prototype
  ) {
    return null;
  }
  const keys = Reflect.ownKeys(options);
  if (
    keys.some((key) => typeof key !== 'string' || key !== 'textScale')
  ) {
    return null;
  }
  if (!Object.prototype.hasOwnProperty.call(options, 'textScale')) {
    return 1;
  }
  const descriptor = Object.getOwnPropertyDescriptor(options, 'textScale');
  if (
    descriptor === undefined ||
    !('value' in descriptor) ||
    descriptor.get !== undefined ||
    descriptor.set !== undefined ||
    descriptor.enumerable !== true
  ) {
    return null;
  }
  const value = descriptor.value;
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < MIN_TEXT_SCALE ||
    value > MAX_TEXT_SCALE
  ) {
    return null;
  }
  return value;
}

function anchoredGarments(
  snapshot: OutfitTruthSnapshotV1,
): readonly AnchoredGarment[] | OutfitMapIneligibleReason {
  if (snapshot.garments.length < 1 || snapshot.garments.length > 10) {
    return 'unsupported-cardinality';
  }
  if (
    snapshot.avatar.pose !== 'sitting' &&
    snapshot.avatar.pose !== 'standing'
  ) {
    return 'invalid-snapshot';
  }

  const seenItemIds = new Set<OutfitItemId>();
  const equipmentItemIds = new Set(
    snapshot.equipment.map((equipment) => equipment.itemId),
  );
  const anchored: AnchoredGarment[] = [];

  for (const [index, garment] of snapshot.garments.entries()) {
    if (
      garment.order !== index + 1 ||
      typeof garment.itemId !== 'string' ||
      garment.itemId.length === 0 ||
      seenItemIds.has(garment.itemId) ||
      equipmentItemIds.has(garment.itemId)
    ) {
      return 'invalid-snapshot';
    }
    seenItemIds.add(garment.itemId);

    if (garment.bodyRegion === 'unknown' || garment.bodyAnchor === null) {
      return 'missing-body-anchor';
    }
    const anchor = garment.bodyAnchor;
    if (
      anchor.anchorVersion !== 1 ||
      anchor.pose !== snapshot.avatar.pose ||
      !Number.isFinite(anchor.x) ||
      !Number.isFinite(anchor.y) ||
      anchor.x < 0 ||
      anchor.x > 1 ||
      anchor.y < 0 ||
      anchor.y > 1
    ) {
      return 'invalid-body-anchor';
    }
    anchored.push({
      itemId: garment.itemId,
      order: garment.order,
      anchorX: anchor.x,
      anchorY: anchor.y,
    });
  }

  return anchored;
}

function railExtent(
  count: number,
  nodeSize: number,
  gap: number,
): number {
  if (count === 0) return 0;
  return count * nodeSize + (count - 1) * gap;
}

function pointEquals(
  left: OutfitMapPoint,
  right: OutfitMapPoint,
): boolean {
  return (
    Math.abs(left.x - right.x) <= EPSILON &&
    Math.abs(left.y - right.y) <= EPSILON
  );
}

function boxesIntersect(left: OutfitMapBox, right: OutfitMapBox): boolean {
  return (
    left.x < right.x + right.width - EPSILON &&
    left.x + left.width > right.x + EPSILON &&
    left.y < right.y + right.height - EPSILON &&
    left.y + left.height > right.y + EPSILON
  );
}

function segmentIntersectsBoxInterior(
  start: OutfitMapPoint,
  end: OutfitMapPoint,
  box: OutfitMapBox,
): boolean {
  const minimumX = box.x + EPSILON;
  const maximumX = box.x + box.width - EPSILON;
  const minimumY = box.y + EPSILON;
  const maximumY = box.y + box.height - EPSILON;
  if (minimumX >= maximumX || minimumY >= maximumY) return false;

  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  let entry = 0;
  let exit = 1;
  const boundaries = [
    [-deltaX, start.x - minimumX],
    [deltaX, maximumX - start.x],
    [-deltaY, start.y - minimumY],
    [deltaY, maximumY - start.y],
  ] as const;

  for (const [direction, distance] of boundaries) {
    if (Math.abs(direction) <= EPSILON) {
      if (distance < 0) return false;
      continue;
    }
    const ratio = distance / direction;
    if (direction < 0) {
      entry = Math.max(entry, ratio);
    } else {
      exit = Math.min(exit, ratio);
    }
    if (entry > exit) return false;
  }
  return entry <= exit;
}

function orientation(
  first: OutfitMapPoint,
  second: OutfitMapPoint,
  third: OutfitMapPoint,
): number {
  return (
    (second.x - first.x) * (third.y - first.y) -
    (second.y - first.y) * (third.x - first.x)
  );
}

function pointOnSegment(
  point: OutfitMapPoint,
  start: OutfitMapPoint,
  end: OutfitMapPoint,
): boolean {
  return (
    Math.abs(orientation(start, end, point)) <= EPSILON &&
    point.x >= Math.min(start.x, end.x) - EPSILON &&
    point.x <= Math.max(start.x, end.x) + EPSILON &&
    point.y >= Math.min(start.y, end.y) - EPSILON &&
    point.y <= Math.max(start.y, end.y) + EPSILON
  );
}

function collinearOverlapLength(
  firstStart: OutfitMapPoint,
  firstEnd: OutfitMapPoint,
  secondStart: OutfitMapPoint,
  secondEnd: OutfitMapPoint,
): number {
  const useX =
    Math.abs(firstEnd.x - firstStart.x) >=
    Math.abs(firstEnd.y - firstStart.y);
  const first = useX
    ? [firstStart.x, firstEnd.x]
    : [firstStart.y, firstEnd.y];
  const second = useX
    ? [secondStart.x, secondEnd.x]
    : [secondStart.y, secondEnd.y];
  return (
    Math.min(Math.max(...first), Math.max(...second)) -
    Math.max(Math.min(...first), Math.min(...second))
  );
}

function segmentsCross(
  firstStart: OutfitMapPoint,
  firstEnd: OutfitMapPoint,
  secondStart: OutfitMapPoint,
  secondEnd: OutfitMapPoint,
): boolean {
  const firstOrientationStart = orientation(
    firstStart,
    firstEnd,
    secondStart,
  );
  const firstOrientationEnd = orientation(
    firstStart,
    firstEnd,
    secondEnd,
  );
  const secondOrientationStart = orientation(
    secondStart,
    secondEnd,
    firstStart,
  );
  const secondOrientationEnd = orientation(
    secondStart,
    secondEnd,
    firstEnd,
  );

  if (
    firstOrientationStart * firstOrientationEnd < -EPSILON &&
    secondOrientationStart * secondOrientationEnd < -EPSILON
  ) {
    return true;
  }

  const allCollinear =
    Math.abs(firstOrientationStart) <= EPSILON &&
    Math.abs(firstOrientationEnd) <= EPSILON &&
    Math.abs(secondOrientationStart) <= EPSILON &&
    Math.abs(secondOrientationEnd) <= EPSILON;
  if (allCollinear) {
    return (
      collinearOverlapLength(
        firstStart,
        firstEnd,
        secondStart,
        secondEnd,
      ) > EPSILON
    );
  }

  const contacts = [
    {
      point: secondStart,
      touches: pointOnSegment(secondStart, firstStart, firstEnd),
    },
    {
      point: secondEnd,
      touches: pointOnSegment(secondEnd, firstStart, firstEnd),
    },
    {
      point: firstStart,
      touches: pointOnSegment(firstStart, secondStart, secondEnd),
    },
    {
      point: firstEnd,
      touches: pointOnSegment(firstEnd, secondStart, secondEnd),
    },
  ].filter(({ touches }) => touches);
  if (contacts.length === 0) return false;

  return contacts.some(({ point }) => {
    const isFirstEndpoint =
      pointEquals(point, firstStart) || pointEquals(point, firstEnd);
    const isSecondEndpoint =
      pointEquals(point, secondStart) || pointEquals(point, secondEnd);
    return !(isFirstEndpoint && isSecondEndpoint);
  });
}

function boxIsBounded(
  box: OutfitMapBox,
  width: number,
  height: number,
): boolean {
  return (
    Number.isFinite(box.x) &&
    Number.isFinite(box.y) &&
    Number.isFinite(box.width) &&
    Number.isFinite(box.height) &&
    box.x >= 0 &&
    box.y >= 0 &&
    box.width > 0 &&
    box.height > 0 &&
    box.x + box.width <= width + EPSILON &&
    box.y + box.height <= height + EPSILON
  );
}

function geometryIsValid(layout: OutfitMapLayoutV1): boolean {
  if (
    !Number.isFinite(layout.width) ||
    !Number.isFinite(layout.height) ||
    layout.height <= 0 ||
    layout.height > MAX_LAYOUT_HEIGHT ||
    !boxIsBounded(layout.avatarBox, layout.width, layout.height)
  ) {
    return false;
  }

  for (let leftIndex = 0; leftIndex < layout.nodes.length; leftIndex += 1) {
    const node = layout.nodes[leftIndex]!;
    if (
      !boxIsBounded(node.box, layout.width, layout.height) ||
      node.connector.length < 2 ||
      node.connector.some(
        (point) =>
          !Number.isFinite(point.x) ||
          !Number.isFinite(point.y) ||
          point.x < 0 ||
          point.y < 0 ||
          point.x > layout.width + EPSILON ||
          point.y > layout.height + EPSILON,
      )
    ) {
      return false;
    }

    for (
      let rightIndex = leftIndex + 1;
      rightIndex < layout.nodes.length;
      rightIndex += 1
    ) {
      if (boxesIntersect(node.box, layout.nodes[rightIndex]!.box)) {
        return false;
      }
    }

    for (
      let segmentIndex = 1;
      segmentIndex < node.connector.length;
      segmentIndex += 1
    ) {
      const start = node.connector[segmentIndex - 1]!;
      const end = node.connector[segmentIndex]!;
      for (const otherNode of layout.nodes) {
        if (otherNode.itemId === node.itemId) continue;
        if (segmentIntersectsBoxInterior(start, end, otherNode.box)) {
          return false;
        }
      }
    }
  }

  for (let leftIndex = 0; leftIndex < layout.nodes.length; leftIndex += 1) {
    const leftConnector = layout.nodes[leftIndex]!.connector;
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < layout.nodes.length;
      rightIndex += 1
    ) {
      const rightConnector = layout.nodes[rightIndex]!.connector;
      for (
        let leftSegment = 1;
        leftSegment < leftConnector.length;
        leftSegment += 1
      ) {
        for (
          let rightSegment = 1;
          rightSegment < rightConnector.length;
          rightSegment += 1
        ) {
          if (
            segmentsCross(
              leftConnector[leftSegment - 1]!,
              leftConnector[leftSegment]!,
              rightConnector[rightSegment - 1]!,
              rightConnector[rightSegment]!,
            )
          ) {
            return false;
          }
        }
      }
    }
  }

  return true;
}

function buildRailNodes(
  garments: readonly AnchoredGarment[],
  side: 'left' | 'right',
  nodeSize: number,
  railGap: number,
  height: number,
  outerPadding: number,
  width: number,
  avatarBox: OutfitMapBox,
): readonly OutfitMapNodeLayout[] {
  const ordered = [...garments].sort(
    (left, right) =>
      left.anchorY - right.anchorY || left.order - right.order,
  );
  const extent = railExtent(ordered.length, nodeSize, railGap);
  const railTop = (height - extent) / 2;
  const boxX =
    side === 'left'
      ? outerPadding
      : width - outerPadding - nodeSize;

  return ordered.map((garment, railIndex) => {
    const box = {
      x: boxX,
      y: railTop + railIndex * (nodeSize + railGap),
      width: nodeSize,
      height: nodeSize,
    };
    const start = {
      x: side === 'left' ? box.x + box.width : box.x,
      y: box.y + box.height / 2,
    };
    const target = {
      x: avatarBox.x + garment.anchorX * avatarBox.width,
      y: avatarBox.y + garment.anchorY * avatarBox.height,
    };
    return {
      itemId: garment.itemId,
      order: garment.order,
      side,
      railIndex,
      box,
      connector: [start, target],
    };
  });
}

/**
 * Converts immutable semantic body truth into responsive presentation geometry.
 * Selection and focus are deliberately absent from the inputs, and every
 * failure remains a typed signal for the complete ordered-list fallback.
 */
export function layoutOutfitMap(
  snapshot: unknown,
  availableWidth: number,
  options: OutfitMapLayoutOptionsV1 = {},
): OutfitMapLayoutResultV1 {
  let validatedSnapshot: OutfitTruthSnapshotV1;
  try {
    if (isUnsupportedCardinalityResult(snapshot)) {
      return mapIneligible('unsupported-cardinality');
    }
    if (!isOutfitTruthSnapshot(snapshot)) {
      return mapIneligible('invalid-snapshot');
    }
    validatedSnapshot = snapshot;
  } catch {
    return mapIneligible('invalid-snapshot');
  }
  if (
    typeof availableWidth !== 'number' ||
    !Number.isFinite(availableWidth) ||
    availableWidth < MIN_LAYOUT_WIDTH ||
    availableWidth > MAX_LAYOUT_WIDTH
  ) {
    return mapIneligible('invalid-width');
  }
  let textScale: number | null;
  try {
    textScale = readTextScale(options);
  } catch {
    return mapIneligible('invalid-constraints');
  }
  if (textScale === null) {
    return mapIneligible('invalid-constraints');
  }

  const anchored = anchoredGarments(validatedSnapshot);
  if (typeof anchored === 'string') {
    return mapIneligible(anchored);
  }

  const mode: OutfitMapMode =
    anchored.length <= 4 ? 'spacious' : 'compact-rails';
  const nodeSize =
    mode === 'spacious'
      ? 64 + (textScale - 1) * 24
      : 48 + (textScale - 1) * 16;
  const railGap =
    mode === 'spacious'
      ? 24 + (textScale - 1) * 8
      : 12 + (textScale - 1) * 4;
  const verticalPadding = 12;
  const minimumHeight = mode === 'spacious' ? 260 : 280;
  const leftGarments = anchored.filter((_, index) => index % 2 === 0);
  const rightGarments = anchored.filter((_, index) => index % 2 === 1);
  if (
    (mode === 'compact-rails' &&
      (leftGarments.length === 0 ||
        rightGarments.length === 0 ||
        leftGarments.length > 5 ||
        rightGarments.length > 5)) ||
    leftGarments.length > 5 ||
    rightGarments.length > 5
  ) {
    return mapIneligible('invalid-geometry');
  }

  const maximumRailExtent = Math.max(
    railExtent(leftGarments.length, nodeSize, railGap),
    railExtent(rightGarments.length, nodeSize, railGap),
  );
  const height = Math.max(
    minimumHeight,
    maximumRailExtent + 2 * verticalPadding,
  );
  if (!Number.isFinite(height) || height > MAX_LAYOUT_HEIGHT) {
    return mapIneligible('invalid-geometry');
  }

  const outerPadding = availableWidth <= 340 ? 12 : 16;
  const connectorGap = mode === 'spacious' ? 16 : 12;
  const avatarX = outerPadding + nodeSize + connectorGap;
  const avatarWidth = availableWidth - 2 * avatarX;
  if (!Number.isFinite(avatarWidth) || avatarWidth < 64) {
    return mapIneligible('invalid-geometry');
  }
  const avatarBox: OutfitMapBox = {
    x: avatarX,
    y: verticalPadding,
    width: avatarWidth,
    height: height - 2 * verticalPadding,
  };

  const nodes = [
    ...buildRailNodes(
      leftGarments,
      'left',
      nodeSize,
      railGap,
      height,
      outerPadding,
      availableWidth,
      avatarBox,
    ),
    ...buildRailNodes(
      rightGarments,
      'right',
      nodeSize,
      railGap,
      height,
      outerPadding,
      availableWidth,
      avatarBox,
    ),
  ].sort((left, right) => left.order - right.order);

  const layout: OutfitMapLayoutV1 = {
    kind: 'layout',
    layoutVersion: 1,
    snapshotId: validatedSnapshot.snapshotId,
    mode,
    width: availableWidth,
    height,
    textScale,
    avatarBox,
    nodes,
  };
  if (!geometryIsValid(layout)) {
    return mapIneligible('invalid-geometry');
  }
  return freezeDeep(layout);
}
