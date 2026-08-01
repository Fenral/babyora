/**
 * gauge-material.test.ts — P10.2: pure unit tests for the temperature
 * colour interpolation behind VerticalGauge's 'thermal' material. No DOM
 * needed (this repo has no jsdom — see FinnAntrekkScreen's own test
 * header), which is exactly why this logic was pulled into its own
 * dependency-free module in the first place.
 */
import { describe, expect, it } from 'vitest';
import {
  mixHexColors,
  temperatureFillColor,
  temperatureFillDeepColor,
  TEMP_COLD_STOP_C,
  TEMP_MID_STOP_C,
  TEMP_WARM_STOP_C,
} from '../gauge-material';

function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

describe('mixHexColors — generic RGB lerp helper', () => {
  it('t=0 returns the "from" colour exactly', () => {
    expect(mixHexColors('#000000', '#FFFFFF', 0)).toBe('#000000');
  });

  it('t=1 returns the "to" colour exactly', () => {
    expect(mixHexColors('#000000', '#FFFFFF', 1)).toBe('#FFFFFF');
  });

  it('t=0.5 lands on the arithmetic midpoint per channel', () => {
    // 0 -> 255 at t=0.5 rounds to 128 (255*0.5=127.5, Math.round -> 128).
    expect(mixHexColors('#000000', '#FFFFFF', 0.5)).toBe('#808080');
  });

  it('clamps t below 0 to the "from" colour', () => {
    expect(mixHexColors('#102030', '#405060', -5)).toBe('#102030');
  });

  it('clamps t above 1 to the "to" colour', () => {
    expect(mixHexColors('#102030', '#405060', 5)).toBe('#405060');
  });

  it('interpolates each channel independently (not just endpoints)', () => {
    const result = hexToRgb(mixHexColors('#000000', '#0A1E32', 0.5));
    // 0x0A=10 -> 5, 0x1E=30 -> 15, 0x32=50 -> 25
    expect(result).toEqual([5, 15, 25]);
  });
});

describe('temperatureFillColor — 3-stop cold/neutral/warm interpolation', () => {
  it('domain constants match instrument-logic.ts\'s INSTRUMENT_MIN_C/MAX_C (-20/30)', () => {
    expect(TEMP_COLD_STOP_C).toBe(-20);
    expect(TEMP_MID_STOP_C).toBe(0);
    expect(TEMP_WARM_STOP_C).toBe(30);
  });

  it('returns the exact cold stop at -20°C (ice-cold deep petrol, --dw-w-night)', () => {
    expect(temperatureFillColor(-20)).toBe('#0C272D');
  });

  it('returns the exact mid stop at 0°C (neutral petrol, --dw-w-clear)', () => {
    expect(temperatureFillColor(0)).toBe('#114143');
  });

  it('returns the exact warm stop at 30°C (desaturated warm, non-token)', () => {
    expect(temperatureFillColor(30)).toBe('#B4713F');
  });

  it('clamps below -20°C to the cold stop', () => {
    expect(temperatureFillColor(-40)).toBe(temperatureFillColor(-20));
  });

  it('clamps above 30°C to the warm stop', () => {
    expect(temperatureFillColor(60)).toBe(temperatureFillColor(30));
  });

  it('interpolates strictly between cold and mid stops for a mid-negative value', () => {
    const cold = hexToRgb(temperatureFillColor(-20));
    const mid = hexToRgb(temperatureFillColor(0));
    const at = hexToRgb(temperatureFillColor(-10));
    for (let i = 0; i < 3; i++) {
      const lo = Math.min(cold[i]!, mid[i]!);
      const hi = Math.max(cold[i]!, mid[i]!);
      expect(at[i]!).toBeGreaterThanOrEqual(lo);
      expect(at[i]!).toBeLessThanOrEqual(hi);
    }
  });

  it('interpolates strictly between mid and warm stops for a mid-positive value', () => {
    const mid = hexToRgb(temperatureFillColor(0));
    const warm = hexToRgb(temperatureFillColor(30));
    const at = hexToRgb(temperatureFillColor(15));
    for (let i = 0; i < 3; i++) {
      const lo = Math.min(mid[i]!, warm[i]!);
      const hi = Math.max(mid[i]!, warm[i]!);
      expect(at[i]!).toBeGreaterThanOrEqual(lo);
      expect(at[i]!).toBeLessThanOrEqual(hi);
    }
  });

  it('is continuous at the 0°C seam (no colour jump between the two piecewise halves)', () => {
    // Approaching 0 from just below and just above should both land very
    // close to the exact mid-stop colour — no discontinuity at the seam.
    const justBelow = hexToRgb(temperatureFillColor(-0.001));
    const justAbove = hexToRgb(temperatureFillColor(0.001));
    for (let i = 0; i < 3; i++) {
      expect(Math.abs(justBelow[i]! - justAbove[i]!)).toBeLessThanOrEqual(1);
    }
  });

  it('the warm stop stays clearly distinct from --dw-accent CTA amber (#D98E5A) — darker AND less saturated, never the same colour', () => {
    const warm = hexToRgb(temperatureFillColor(30));
    const amber = hexToRgb('#D98E5A');
    // Not equal outright.
    expect(warm).not.toEqual(amber);
    // Darker: warm's own max channel (its "value"/brightness proxy) is
    // meaningfully below amber's.
    const warmMax = Math.max(...warm);
    const amberMax = Math.max(...amber);
    expect(warmMax).toBeLessThan(amberMax - 20);
    // Less saturated: the spread between the warm stop's own max/min
    // channel (a cheap saturation proxy) is meaningfully narrower than
    // amber's spread.
    const warmSpread = Math.max(...warm) - Math.min(...warm);
    const amberSpread = Math.max(...amber) - Math.min(...amber);
    expect(warmSpread).toBeLessThan(amberSpread);
  });
});

describe('temperatureFillDeepColor — bottom-of-fill depth shade', () => {
  it('is darker than temperatureFillColor at the same temperature, in every channel', () => {
    for (const t of [-20, -5, 0, 12, 30]) {
      const top = hexToRgb(temperatureFillColor(t));
      const deep = hexToRgb(temperatureFillDeepColor(t));
      for (let i = 0; i < 3; i++) {
        expect(deep[i]!).toBeLessThanOrEqual(top[i]!);
      }
      // Strictly darker overall (at least one channel actually moved).
      expect(deep).not.toEqual(top);
    }
  });
});
