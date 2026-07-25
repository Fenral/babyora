const NORMAL_UI_DURATION_MIN_MS = 180;
const NORMAL_UI_DURATION_MAX_MS = 250;
const EXPLANATORY_DURATION_MIN_MS = 900;
const EXPLANATORY_DURATION_MAX_MS = 1_400;
const MIN_GARMENT_COUNT = 1;
const MAX_GARMENT_COUNT = 10;
const MAX_ITEM_OFFSET_SHARE = 0.24;

export type OutfitTransitionTimingContract = Readonly<{
  normalUiDurationMs: number;
  explanatoryDurationMs: number;
}>;

export type OutfitTransitionTimelineItem = Readonly<{
  index: number;
  delayMs: number;
  durationMs: number;
  endMs: number;
}>;

export type OutfitTransitionTimeline = Readonly<{
  normalUiDurationMs: number;
  totalDurationMs: number;
  items: readonly OutfitTransitionTimelineItem[];
}>;

export type OutfitTransitionSettlementReason =
  | 'completed'
  | 'cancelled'
  | 'backgrounded'
  | 'reduced-motion';

export type SettledOutfitTransitionTimeline = Readonly<{
  status: 'settled';
  reason: OutfitTransitionSettlementReason;
  overallProgress: 1;
  itemProgress: readonly 1[];
}>;

function requireDurationInRange(
  value: number,
  minimum: number,
  maximum: number,
  label: string,
): void {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum} ms`);
  }
}

function requireSupportedGarmentCount(garmentCount: number): void {
  if (
    !Number.isInteger(garmentCount) ||
    garmentCount < MIN_GARMENT_COUNT ||
    garmentCount > MAX_GARMENT_COUNT
  ) {
    throw new RangeError(
      `garmentCount must be an integer between ${MIN_GARMENT_COUNT} and ${MAX_GARMENT_COUNT}`,
    );
  }
}

function clampProgress(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function requireFiniteElapsedMs(elapsedMs: number): void {
  if (!Number.isFinite(elapsedMs)) {
    throw new RangeError('elapsedMs must be finite');
  }
}

export function createOutfitTransitionTimeline(
  timing: OutfitTransitionTimingContract,
  garmentCount: number,
): OutfitTransitionTimeline {
  requireDurationInRange(
    timing.normalUiDurationMs,
    NORMAL_UI_DURATION_MIN_MS,
    NORMAL_UI_DURATION_MAX_MS,
    'normalUiDurationMs',
  );
  requireDurationInRange(
    timing.explanatoryDurationMs,
    EXPLANATORY_DURATION_MIN_MS,
    EXPLANATORY_DURATION_MAX_MS,
    'explanatoryDurationMs',
  );
  requireSupportedGarmentCount(garmentCount);

  const totalDurationMs = timing.explanatoryDurationMs;
  const maximumDelayMs = Math.round(
    totalDurationMs * MAX_ITEM_OFFSET_SHARE,
  );
  const items = Array.from({ length: garmentCount }, (_, index) => {
    const delayMs =
      garmentCount === 1
        ? 0
        : Math.round((maximumDelayMs * index) / (garmentCount - 1));

    return Object.freeze({
      index,
      delayMs,
      durationMs: totalDurationMs - delayMs,
      endMs: totalDurationMs,
    });
  });

  return Object.freeze({
    normalUiDurationMs: timing.normalUiDurationMs,
    totalDurationMs,
    items: Object.freeze(items),
  });
}

export function getOverallTimelineProgress(
  timeline: OutfitTransitionTimeline,
  elapsedMs: number,
): number {
  requireFiniteElapsedMs(elapsedMs);
  return clampProgress(elapsedMs / timeline.totalDurationMs);
}

export function getItemTimelineProgress(
  timeline: OutfitTransitionTimeline,
  itemIndex: number,
  elapsedMs: number,
): number {
  requireFiniteElapsedMs(elapsedMs);

  if (!Number.isInteger(itemIndex) || itemIndex < 0 || itemIndex >= timeline.items.length) {
    throw new RangeError('itemIndex must identify an item in the timeline');
  }

  const item = timeline.items[itemIndex];
  return clampProgress((elapsedMs - item.delayMs) / item.durationMs);
}

export function settleOutfitTransitionTimeline(
  timeline: OutfitTransitionTimeline,
  reason: OutfitTransitionSettlementReason,
): SettledOutfitTransitionTimeline {
  return Object.freeze({
    status: 'settled',
    reason,
    overallProgress: 1,
    itemProgress: Object.freeze(timeline.items.map(() => 1 as const)),
  });
}
