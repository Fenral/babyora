import { describe, it, expect } from 'vitest';
import { isChildSwitchGated, shouldShowTenDayTeaser } from '../gating';

describe('isChildSwitchGated (F81.5-W2, Flate 4 — barn 2+)', () => {
  it('barn nr. 1 (index 0) er ALDRI gatet, uansett Premium-status', () => {
    expect(isChildSwitchGated(0, false, false)).toBe(false);
    expect(isChildSwitchGated(0, true, false)).toBe(false);
    expect(isChildSwitchGated(0, false, true)).toBe(false);
  });

  it('barn 2+ (index > 0) er gatet for ikke-Premium når det IKKE er aktivt', () => {
    expect(isChildSwitchGated(1, false, false)).toBe(true);
    expect(isChildSwitchGated(2, false, false)).toBe(true);
  });

  it('barn 2+ er ALDRI gatet for Premium-bruker', () => {
    expect(isChildSwitchGated(1, false, true)).toBe(false);
    expect(isChildSwitchGated(2, false, true)).toBe(false);
  });

  it('VIKTIG: aktivt barn 2+ låses ALDRI ut selv om Premium er mistet', () => {
    // Edge-case: bruker nedgraderte mens barn nr. 2 var aktivt barn.
    expect(isChildSwitchGated(1, true, false)).toBe(false);
    expect(isChildSwitchGated(3, true, false)).toBe(false);
  });
});

describe('shouldShowTenDayTeaser (F81.5-W2, Flate 1 — 10 dager)', () => {
  it('"I dag"-tab er ALDRI teaser, uansett Premium-status', () => {
    expect(shouldShowTenDayTeaser('today', false)).toBe(false);
    expect(shouldShowTenDayTeaser('today', true)).toBe(false);
  });

  it('10-dagers-tab er teaser for ikke-Premium', () => {
    expect(shouldShowTenDayTeaser('tenday', false)).toBe(true);
  });

  it('10-dagers-tab er IKKE teaser for Premium', () => {
    expect(shouldShowTenDayTeaser('tenday', true)).toBe(false);
  });
});
