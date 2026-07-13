/**
 * useCountUp helpers — test pure-funksjoner (easeOutQuart, interpolate).
 * Hook-rendering testes ikke direkte (Vitest kjører node-miljø uten
 * jsdom — prosjektet bruker react-dom/server statisk-markup-pattern).
 */
import { describe, it, expect } from 'vitest';
import { easeOutQuart, interpolate } from '../useCountUp.js';

describe('easeOutQuart', () => {
  it('starter på 0 og slutter på 1', () => {
    expect(easeOutQuart(0)).toBe(0);
    expect(easeOutQuart(1)).toBe(1);
  });

  it('clampes utenfor [0,1]', () => {
    expect(easeOutQuart(-0.5)).toBe(0);
    expect(easeOutQuart(1.5)).toBe(1);
  });

  it('er ease-out (kommer raskt opp tidlig)', () => {
    // ved t=0.5 skal verdien være > 0.5 (ease-out)
    expect(easeOutQuart(0.5)).toBeGreaterThan(0.5);
  });
});

describe('interpolate', () => {
  it('returnerer from ved t=0', () => {
    expect(interpolate(10, 20, 0)).toBe(10);
  });

  it('returnerer to ved t=1', () => {
    expect(interpolate(10, 20, 1)).toBe(20);
  });

  it('runder til 0 desimaler default', () => {
    const v = interpolate(0, 100, 0.5);
    expect(Number.isInteger(v)).toBe(true);
  });

  it('respekterer decimals-option', () => {
    const v = interpolate(0, 10, 0.5, 2);
    expect(v.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
  });
});
