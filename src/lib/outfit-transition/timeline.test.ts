import { describe, expect, it } from 'vitest';
import {
  createOutfitTransitionTimeline,
  getItemTimelineProgress,
  getOverallTimelineProgress,
  settleOutfitTransitionTimeline,
} from './timeline.js';

const lockedTimingContract = {
  normalUiDurationMs: 220,
  explanatoryDurationMs: 1_250,
} as const;

describe('createOutfitTransitionTimeline', () => {
  it.each(Array.from({ length: 10 }, (_, index) => index + 1))(
    'keeps %i garments inside one 1250 ms explanatory timeline',
    (garmentCount) => {
      const timeline = createOutfitTransitionTimeline(
        lockedTimingContract,
        garmentCount,
      );

      expect(timeline.totalDurationMs).toBe(1_250);
      expect(timeline.normalUiDurationMs).toBe(220);
      expect(timeline.items).toHaveLength(garmentCount);
      expect(timeline.items[0]?.delayMs).toBe(0);

      for (const item of timeline.items) {
        expect(item.delayMs).toBeGreaterThanOrEqual(0);
        expect(item.durationMs).toBeGreaterThan(0);
        expect(item.delayMs + item.durationMs).toBe(1_250);
      }

      for (let index = 1; index < timeline.items.length; index += 1) {
        const previous = timeline.items[index - 1];
        const current = timeline.items[index];

        expect(current.delayMs).toBeGreaterThan(previous.delayMs);
        expect(current.delayMs).toBeLessThan(
          previous.delayMs + previous.durationMs,
        );
      }
    },
  );

  it('accepts the complete explanatory and ordinary-feedback duration bands', () => {
    for (const explanatoryDurationMs of [900, 1_250, 1_400]) {
      const timeline = createOutfitTransitionTimeline(
        {
          normalUiDurationMs: 220,
          explanatoryDurationMs,
        },
        10,
      );

      expect(timeline.totalDurationMs).toBe(explanatoryDurationMs);
      expect(Math.max(...timeline.items.map((item) => item.endMs))).toBe(
        explanatoryDurationMs,
      );
    }

    for (const normalUiDurationMs of [180, 220, 250]) {
      expect(
        createOutfitTransitionTimeline(
          {
            normalUiDurationMs,
            explanatoryDurationMs: 1_250,
          },
          4,
        ).normalUiDurationMs,
      ).toBe(normalUiDurationMs);
    }
  });

  it.each([
    [{ normalUiDurationMs: 179, explanatoryDurationMs: 1_250 }, 4],
    [{ normalUiDurationMs: 251, explanatoryDurationMs: 1_250 }, 4],
    [{ normalUiDurationMs: 220, explanatoryDurationMs: 899 }, 4],
    [{ normalUiDurationMs: 220, explanatoryDurationMs: 1_401 }, 4],
    [{ normalUiDurationMs: 220, explanatoryDurationMs: 1_250 }, 0],
    [{ normalUiDurationMs: 220, explanatoryDurationMs: 1_250 }, 11],
    [{ normalUiDurationMs: 220, explanatoryDurationMs: 1_250 }, 1.5],
  ])('rejects unsupported timing or garment count %#', (timing, garmentCount) => {
    expect(() =>
      createOutfitTransitionTimeline(timing, garmentCount),
    ).toThrow(RangeError);
  });

  it('keeps ordinary UI feedback separate from explanatory scheduling', () => {
    const fastFeedback = createOutfitTransitionTimeline(
      {
        normalUiDurationMs: 180,
        explanatoryDurationMs: 1_250,
      },
      6,
    );
    const slowFeedback = createOutfitTransitionTimeline(
      {
        normalUiDurationMs: 250,
        explanatoryDurationMs: 1_250,
      },
      6,
    );

    expect(fastFeedback.items).toEqual(slowFeedback.items);
    expect(fastFeedback.totalDurationMs).toBe(
      slowFeedback.totalDurationMs,
    );
  });
});

describe('outfit-transition progress', () => {
  const timeline = createOutfitTransitionTimeline(lockedTimingContract, 4);

  it('calculates overall progress from one finite clock', () => {
    expect(getOverallTimelineProgress(timeline, -1)).toBe(0);
    expect(getOverallTimelineProgress(timeline, 0)).toBe(0);
    expect(getOverallTimelineProgress(timeline, 625)).toBe(0.5);
    expect(getOverallTimelineProgress(timeline, 1_250)).toBe(1);
    expect(getOverallTimelineProgress(timeline, 5_000)).toBe(1);
  });

  it('calculates each item from its overlapping delay to the shared deadline', () => {
    const delayedItem = timeline.items[3];

    expect(getItemTimelineProgress(timeline, 3, delayedItem.delayMs - 1)).toBe(
      0,
    );
    expect(getItemTimelineProgress(timeline, 3, delayedItem.delayMs)).toBe(0);
    expect(getItemTimelineProgress(timeline, 3, 1_250)).toBe(1);
    expect(() => getItemTimelineProgress(timeline, -1, 0)).toThrow(RangeError);
    expect(() => getItemTimelineProgress(timeline, 4, 0)).toThrow(RangeError);
  });

  it.each(['cancelled', 'backgrounded', 'reduced-motion'] as const)(
    'settles immediately on %s',
    (reason) => {
      const settled = settleOutfitTransitionTimeline(timeline, reason);

      expect(settled).toEqual({
        status: 'settled',
        reason,
        overallProgress: 1,
        itemProgress: [1, 1, 1, 1],
      });
    },
  );
});
