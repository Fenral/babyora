import { describe, expect, it } from 'vitest';
import { recommend } from '../../wool-layers/recommend.js';
import type {
  RecommendInput,
  Recommendation,
} from '../../wool-layers/types.js';
import {
  createOutfitTruthSnapshot,
  type OutfitItemId,
  type OutfitTruthBuildResultV1,
  type OutfitTruthSnapshotV1,
} from '../outfit-truth.js';
import {
  layoutOutfitMap,
  type OutfitMapBox,
  type OutfitMapLayoutV1,
  type OutfitMapNodeLayout,
  type OutfitMapPoint,
} from '../outfit-map-layout.js';

const EPSILON = 1e-7;
const REQUIRED_WIDTHS = [320, 390, 560] as const;
const TEXT_MODELS = [
  { label: '100% text', textScale: 1 },
  { label: '200% text', textScale: 2 },
] as const;

const ORDERED_GARMENT_FIXTURE = [
  'langermet ullbody',
  'bleie',
  'ull-jakke',
  'tynn bukse',
  'isolert vinterdress',
  'balaklava',
  'halsedisse',
  'votter dun',
  'vintersko isolerte',
  'ullsokker',
] as const;

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

const BASE_INPUT: RecommendInput = {
  weather: {
    feelsLikeC: 4,
    tempC: 5,
    windMs: 1,
    precipMmH: 0,
  },
  child: { ageMonths: 18 },
  activity: 'utelek',
};

function recommendationWithLayers(
  layers: Recommendation['layers'],
  input: RecommendInput = BASE_INPUT,
): Recommendation {
  return {
    ...recommend(input),
    layers: layers.map((layer) => ({
      category: layer.category,
      items: [...layer.items],
    })),
  };
}

function createTruth(
  finalizedRecommendation: Recommendation,
  input: RecommendInput = BASE_INPUT,
  transitionContextId = 'transition:layout-fixture',
): OutfitTruthBuildResultV1 {
  return createOutfitTruthSnapshot({
    transitionContextId,
    input,
    finalizedRecommendation,
    pose: 'standing',
  });
}

function snapshotForCount(count: number): OutfitTruthSnapshotV1 {
  const result = createTruth(
    recommendationWithLayers([
      {
        category: 'innerst',
        items: ORDERED_GARMENT_FIXTURE.slice(0, count),
      },
    ]),
    BASE_INPUT,
    `transition:layout-count-${count}`,
  );
  if (result.kind !== 'supported') {
    throw new Error(`Expected supported ${count}-garment fixture`);
  }
  return result.snapshot;
}

function expectLayout(
  value: ReturnType<typeof layoutOutfitMap>,
): asserts value is OutfitMapLayoutV1 {
  expect(value.kind).toBe('layout');
  if (value.kind !== 'layout') {
    throw new Error(`Expected layout, received ${value.reason}`);
  }
}

function pointEquals(
  left: OutfitMapPoint,
  right: OutfitMapPoint,
  tolerance = EPSILON,
): boolean {
  return (
    Math.abs(left.x - right.x) <= tolerance &&
    Math.abs(left.y - right.y) <= tolerance
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

  const properIntersection =
    firstOrientationStart * firstOrientationEnd < -EPSILON &&
    secondOrientationStart * secondOrientationEnd < -EPSILON;
  if (properIntersection) return true;

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

  const contactPoints = [
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
  if (contactPoints.length === 0) return false;

  return contactPoints.some(({ point }) => {
    const isFirstEndpoint =
      pointEquals(point, firstStart) || pointEquals(point, firstEnd);
    const isSecondEndpoint =
      pointEquals(point, secondStart) || pointEquals(point, secondEnd);
    return !(isFirstEndpoint && isSecondEndpoint);
  });
}

function connectorSegments(
  node: OutfitMapNodeLayout,
): readonly Readonly<{
  start: OutfitMapPoint;
  end: OutfitMapPoint;
}>[] {
  return node.connector.slice(1).map((end, index) => ({
    start: node.connector[index]!,
    end,
  }));
}

function assertGeometry(
  snapshot: OutfitTruthSnapshotV1,
  layout: OutfitMapLayoutV1,
): void {
  expect(layout.width).toBeGreaterThanOrEqual(320);
  expect(layout.height).toBeGreaterThan(0);
  expect(layout.height).toBeLessThanOrEqual(768);
  expect(layout.avatarBox.width).toBeGreaterThan(0);
  expect(layout.avatarBox.height).toBeGreaterThan(0);

  const everyBox = [layout.avatarBox, ...layout.nodes.map((node) => node.box)];
  for (const box of everyBox) {
    for (const value of [box.x, box.y, box.width, box.height]) {
      expect(Number.isFinite(value)).toBe(true);
    }
    expect(box.x).toBeGreaterThanOrEqual(-EPSILON);
    expect(box.y).toBeGreaterThanOrEqual(-EPSILON);
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
    expect(box.x + box.width).toBeLessThanOrEqual(
      layout.width + EPSILON,
    );
    expect(box.y + box.height).toBeLessThanOrEqual(
      layout.height + EPSILON,
    );
  }

  for (let leftIndex = 0; leftIndex < layout.nodes.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < layout.nodes.length;
      rightIndex += 1
    ) {
      expect(
        boxesIntersect(
          layout.nodes[leftIndex]!.box,
          layout.nodes[rightIndex]!.box,
        ),
      ).toBe(false);
    }
  }

  for (const node of layout.nodes) {
    expect(node.connector.length).toBeGreaterThanOrEqual(2);
    for (const point of node.connector) {
      expect(Number.isFinite(point.x)).toBe(true);
      expect(Number.isFinite(point.y)).toBe(true);
      expect(point.x).toBeGreaterThanOrEqual(-EPSILON);
      expect(point.y).toBeGreaterThanOrEqual(-EPSILON);
      expect(point.x).toBeLessThanOrEqual(layout.width + EPSILON);
      expect(point.y).toBeLessThanOrEqual(layout.height + EPSILON);
    }

    const garment = snapshot.garments[node.order - 1]!;
    expect(garment.itemId).toBe(node.itemId);
    expect(garment.bodyAnchor).not.toBeNull();
    const bodyAnchor = garment.bodyAnchor!;
    const expectedTarget = {
      x: layout.avatarBox.x + bodyAnchor.x * layout.avatarBox.width,
      y: layout.avatarBox.y + bodyAnchor.y * layout.avatarBox.height,
    };
    expect(
      pointEquals(node.connector[node.connector.length - 1]!, expectedTarget),
    ).toBe(true);

    const expectedStart = {
      x:
        node.side === 'left'
          ? node.box.x + node.box.width
          : node.box.x,
      y: node.box.y + node.box.height / 2,
    };
    expect(pointEquals(node.connector[0]!, expectedStart)).toBe(true);

    for (const segment of connectorSegments(node)) {
      for (const otherNode of layout.nodes) {
        if (otherNode.itemId === node.itemId) continue;
        expect(
          segmentIntersectsBoxInterior(
            segment.start,
            segment.end,
            otherNode.box,
          ),
        ).toBe(false);
      }
    }
  }

  for (let leftIndex = 0; leftIndex < layout.nodes.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < layout.nodes.length;
      rightIndex += 1
    ) {
      const leftSegments = connectorSegments(layout.nodes[leftIndex]!);
      const rightSegments = connectorSegments(layout.nodes[rightIndex]!);
      for (const leftSegment of leftSegments) {
        for (const rightSegment of rightSegments) {
          expect(
            segmentsCross(
              leftSegment.start,
              leftSegment.end,
              rightSegment.start,
              rightSegment.end,
            ),
          ).toBe(false);
        }
      }
    }
  }
}

describe('outfit map responsive geometry', () => {
  for (const count of Array.from({ length: 10 }, (_, index) => index + 1)) {
    for (const width of REQUIRED_WIDTHS) {
      for (const model of TEXT_MODELS) {
        it(`lays out ${count} garment(s) at ${width}px and ${model.label}`, () => {
          const snapshot = snapshotForCount(count);
          const originalSnapshot = structuredClone(snapshot);
          const result = layoutOutfitMap(snapshot, width, {
            textScale: model.textScale,
          });
          expectLayout(result);

          expect(result).toEqual(
            layoutOutfitMap(snapshot, width, {
              textScale: model.textScale,
            }),
          );
          expect(result.snapshotId).toBe(snapshot.snapshotId);
          expect(result.textScale).toBe(model.textScale);
          expect(result.mode).toBe(
            count <= 4 ? 'spacious' : 'compact-rails',
          );
          expect(result.nodes).toHaveLength(count);
          expect(result.nodes.map((node) => node.itemId)).toEqual(
            snapshot.garments.map((garment) => garment.itemId),
          );
          expect(result.nodes.map((node) => node.order)).toEqual(
            Array.from({ length: count }, (_, index) => index + 1),
          );
          expect(new Set(result.nodes.map((node) => node.itemId)).size).toBe(
            count,
          );
          expect(
            result.nodes.some((node) =>
              Object.hasOwn(node, 'aggregatedCount'),
            ),
          ).toBe(false);

          if (count >= 5) {
            const left = result.nodes.filter(
              (node) => node.side === 'left',
            );
            const right = result.nodes.filter(
              (node) => node.side === 'right',
            );
            expect(left.length).toBeGreaterThan(0);
            expect(right.length).toBeGreaterThan(0);
            expect(left.length).toBeLessThanOrEqual(5);
            expect(right.length).toBeLessThanOrEqual(5);
            for (const rail of [left, right]) {
              const visualOrder = [...rail].sort(
                (first, second) => first.railIndex - second.railIndex,
              );
              const expectedOrder = [...rail].sort((first, second) => {
                const firstAnchor =
                  snapshot.garments[first.order - 1]!.bodyAnchor!;
                const secondAnchor =
                  snapshot.garments[second.order - 1]!.bodyAnchor!;
                return (
                  firstAnchor.y - secondAnchor.y ||
                  first.order - second.order
                );
              });
              expect(visualOrder.map((node) => node.itemId)).toEqual(
                expectedOrder.map((node) => node.itemId),
              );
              expect(visualOrder.map((node) => node.railIndex)).toEqual(
                Array.from(
                  { length: visualOrder.length },
                  (_, index) => index,
                ),
              );
            }
          }

          assertGeometry(snapshot, result);
          expect(snapshot).toEqual(originalSnapshot);
          for (const garment of snapshot.garments) {
            expect(Object.hasOwn(garment, 'box')).toBe(false);
            expect(Object.hasOwn(garment, 'connector')).toBe(false);
            expect(Object.hasOwn(garment, 'nodeAnchor')).toBe(false);
          }
          expect(Object.isFrozen(result)).toBe(true);
          expect(Object.isFrozen(result.nodes)).toBe(true);
          expect(result.nodes.every((node) => Object.isFrozen(node))).toBe(
            true,
          );
        });
      }
    }
  }

  it('allows 200% text to grow targets without changing mode or order', () => {
    for (const count of Array.from(
      { length: 10 },
      (_, index) => index + 1,
    )) {
      const snapshot = snapshotForCount(count);
      const normal = layoutOutfitMap(snapshot, 320, { textScale: 1 });
      const doubled = layoutOutfitMap(snapshot, 320, { textScale: 2 });
      expectLayout(normal);
      expectLayout(doubled);

      expect(doubled.mode).toBe(normal.mode);
      expect(doubled.nodes.map((node) => node.itemId)).toEqual(
        normal.nodes.map((node) => node.itemId),
      );
      for (let index = 0; index < count; index += 1) {
        expect(doubled.nodes[index]!.box.width).toBeGreaterThanOrEqual(
          normal.nodes[index]!.box.width,
        );
        expect(doubled.nodes[index]!.box.height).toBeGreaterThanOrEqual(
          normal.nodes[index]!.box.height,
        );
      }
    }
  });

  it('keeps geometry deeply equal for every possible selected item', () => {
    for (const count of Array.from(
      { length: 10 },
      (_, index) => index + 1,
    )) {
      const snapshot = snapshotForCount(count);
      for (const width of REQUIRED_WIDTHS) {
        for (const { textScale } of TEXT_MODELS) {
          const baseline = layoutOutfitMap(snapshot, width, { textScale });
          for (const selectedItemId of [
            null,
            ...snapshot.garments.map((garment) => garment.itemId),
          ]) {
            const presentationState = { selectedItemId };
            expect(presentationState.selectedItemId).toBe(selectedItemId);
            expect(layoutOutfitMap(snapshot, width, { textScale })).toEqual(
              baseline,
            );
          }
        }
      }
    }
  });

  it('keeps selectedItemId outside the layout options contract', () => {
    const snapshot = snapshotForCount(1);
    const attemptSelectionCoupling = (selectedItemId: OutfitItemId) => {
      // @ts-expect-error Selection belongs to paired UI state, not geometry.
      return layoutOutfitMap(snapshot, 320, {
        textScale: 1,
        selectedItemId,
      });
    };
    expect(attemptSelectionCoupling).toBeTypeOf('function');
  });
});

describe('outfit map fail-closed boundaries', () => {
  it('excludes semantic equipment before node and connector allocation', () => {
    const result = createTruth(
      recommendationWithLayers([
        {
          category: 'innerst',
          items: ORDERED_GARMENT_FIXTURE.slice(0, 3),
        },
        {
          category: 'ekstra',
          items: [
            'varmepose dun',
            'saueskinn i vogn',
            'ansiktskrem',
          ],
        },
        {
          category: 'utstyr',
          items: ['regntrekk på vognen'],
        },
      ]),
    );
    expect(result.kind).toBe('supported');
    if (result.kind !== 'supported') return;

    expect(result.snapshot.garments).toHaveLength(3);
    expect(result.snapshot.equipment).toHaveLength(4);
    const layout = layoutOutfitMap(result.snapshot, 320);
    expectLayout(layout);
    expect(layout.nodes.map((node) => node.itemId)).toEqual(
      result.snapshot.garments.map((garment) => garment.itemId),
    );
    expect(
      layout.nodes.some((node) =>
        result.snapshot.equipment.some(
          (equipment) => equipment.itemId === node.itemId,
        ),
      ),
    ).toBe(false);
  });

  it('returns typed ineligibility for missing semantic body anchors', () => {
    const result = createTruth(
      recommendationWithLayers([
        {
          category: 'innerst',
          items: ['ukjent fremtidig plagg'],
        },
      ]),
    );
    expect(result.kind).toBe('supported');
    if (result.kind !== 'supported') return;

    expect(result.snapshot.garments[0]).toMatchObject({
      bodyRegion: 'unknown',
      bodyAnchor: null,
    });
    expect(layoutOutfitMap(result.snapshot, 320)).toEqual({
      kind: 'map-ineligible',
      layoutVersion: 1,
      reason: 'missing-body-anchor',
    });
  });

  it.each([
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    -1,
    0,
    239,
    4097,
  ])('returns typed ineligibility for invalid width %s', (width) => {
    expect(layoutOutfitMap(snapshotForCount(1), width)).toEqual({
      kind: 'map-ineligible',
      layoutVersion: 1,
      reason: 'invalid-width',
    });
  });

  it.each([
    Number.NaN,
    Number.POSITIVE_INFINITY,
    -1,
    0,
    2.01,
  ])('returns typed ineligibility for invalid text scale %s', (textScale) => {
    expect(
      layoutOutfitMap(snapshotForCount(1), 320, { textScale }),
    ).toEqual({
      kind: 'map-ineligible',
      layoutVersion: 1,
      reason: 'invalid-constraints',
    });
  });

  it('rejects structurally asserted snapshots and invalid garment counts', () => {
    const canonical = snapshotForCount(1);
    const clone = structuredClone(canonical);
    const zeroGarments = Object.freeze({
      ...clone,
      garments: Object.freeze([]),
    }) as unknown as OutfitTruthSnapshotV1;
    const elevenGarments = Object.freeze({
      ...clone,
      garments: Object.freeze(
        Array.from({ length: 11 }, (_, index) =>
          Object.freeze({
            ...clone.garments[0]!,
            itemId: `asserted:${index}` as OutfitItemId,
            order: index + 1,
          }),
        ),
      ),
    }) as unknown as OutfitTruthSnapshotV1;

    for (const asserted of [clone, zeroGarments, elevenGarments]) {
      expect(layoutOutfitMap(asserted, 320)).toEqual({
        kind: 'map-ineligible',
        layoutVersion: 1,
        reason: 'invalid-snapshot',
      });
    }
  });

  it('keeps the exact tracked 11-garment result complete and list-only', () => {
    const input: RecommendInput = {
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
    };
    const result = createOutfitTruthSnapshot({
      transitionContextId: 'transition:tracked-eleven',
      input,
      finalizedRecommendation: recommend(input),
      pose: 'sitting',
    });

    expect(result.kind).toBe('unsupported-cardinality');
    if (result.kind !== 'unsupported-cardinality') return;
    expect(result.reason).toBe(
      'semantic-garment-count-outside-1-10',
    );
    expect(result.orderedGarments.map((item) => item.sourceLabel)).toEqual(
      ELEVEN_GARMENT_FIXTURE,
    );
    expect(result.orderedGarments.map((item) => item.order)).toEqual(
      Array.from({ length: 11 }, (_, index) => index + 1),
    );
    expect(result.orderedGarments).toHaveLength(11);
    expect('snapshot' in result).toBe(false);
    expect(layoutOutfitMap(result, 320)).toEqual({
      kind: 'map-ineligible',
      layoutVersion: 1,
      reason: 'unsupported-cardinality',
    });
    expect(result.orderedGarments.map((item) => item.sourceLabel)).toEqual(
      ELEVEN_GARMENT_FIXTURE,
    );
  });
});
