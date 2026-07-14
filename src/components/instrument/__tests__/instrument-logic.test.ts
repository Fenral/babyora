/**
 * R7 Task 3A — instrumentlogikk: snapping, grenser, valuetext, båndkryssing.
 */
import { describe, expect, it } from 'vitest';
import { bandForTemp } from '../../../lib/wool-layers/tables.js';
import {
  bandBoundaries, columnFraction, crossedBand, instrumentValueText, snapDegree,
} from '../instrument-logic.js';

describe('temperaturinstrument — logikk', () => {
  it('snapper til hel grad og klemmer på min/maks', () => {
    expect(snapDegree(3.4)).toBe(3);
    expect(snapDegree(3.6)).toBe(4);
    expect(snapDegree(-25)).toBe(-20);
    expect(snapDegree(99)).toBe(30);
  });

  it('kolonneposisjon er 0 ved −20 og 1 ved 30, monotont', () => {
    expect(columnFraction(-20)).toBe(0);
    expect(columnFraction(30)).toBe(1);
    expect(columnFraction(5)).toBeCloseTo(0.5, 5);
    let prev = -1;
    for (let t = -20; t <= 30; t += 5) {
      const f = columnFraction(t);
      expect(f).toBeGreaterThan(prev);
      prev = f;
    }
  });

  it('valuetext staver ut minus (a11y-lead-krav)', () => {
    expect(instrumentValueText(-4, 'frost')).toBe('minus 4 grader, frost');
    expect(instrumentValueText(12, 'mild')).toBe('12 grader, mild');
    expect(instrumentValueText(0, 'kald')).toBe('0 grader, kald');
  });

  it('båndkryssing detekteres eksakt på bandForTemp-grensene (ingen drift)', () => {
    expect(crossedBand(4, 5)).toBe(true);   // kald → kjolig
    expect(crossedBand(5, 6)).toBe(false);
    expect(crossedBand(-7, -8)).toBe(true); // frost → streng_frost
    expect(crossedBand(0, -0.4)).toBe(false); // snapper til samme grad
  });

  it('markørgrensene matcher bandForTemp nøyaktig', () => {
    for (const b of bandBoundaries()) {
      expect(bandForTemp(b)).not.toBe(bandForTemp(b - 1));
    }
    expect(bandBoundaries()).toEqual([-15, -7, 0, 5, 10, 16, 22, 28]);
  });
});
