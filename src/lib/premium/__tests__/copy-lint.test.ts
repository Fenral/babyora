import { describe, it, expect } from 'vitest';
import { lintCopy } from '../copy-lint';

describe('copy-lint (P10.1)', () => {
  it('passerer Premium-toneriktig copy', () => {
    expect(lintCopy('Se hele uka til Lillian').ok).toBe(true);
    expect(lintCopy('Time for time, 10 dager fremover').ok).toBe(true);
    expect(lintCopy('Er en del av Babyora Premium').ok).toBe(true);
  });

  it('fanger forbudte ord', () => {
    expect(lintCopy('Denne funksjonen er låst').forbidden).toContain('låst');
    expect(lintCopy('Sperret tilgang').forbidden).toContain('Sperret');
    expect(lintCopy('Du nektet kjøp').forbidden).toContain('nektet');
  });

  it('fanger sikkerhetsinnhold gated bak Premium', () => {
    const result = lintCopy('HB-9 bilstol-varsel kun for Premium', true);
    expect(result.safetyGated.length).toBeGreaterThan(0);
    expect(result.ok).toBe(false);
  });

  it('tillater sikkerhetsinnhold UTEN gating', () => {
    const result = lintCopy('HB-9 bilstol-varsel vises alltid', false);
    expect(result.safetyGated).toEqual([]);
    expect(result.ok).toBe(true);
  });
});
