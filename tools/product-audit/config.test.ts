import { describe, expect, it } from 'vitest';
import { PAGE_CATALOG, RUBRIC, RUBRIC_VERSION } from './config';

describe('product audit configuration', () => {
  it('keeps rubric dimensions at 100 percent', () => {
    expect(RUBRIC.reduce((sum, item) => sum + item.weight, 0)).toBe(100);
  });

  it('keeps app page weights at 100 percent', () => {
    expect(PAGE_CATALOG.reduce((sum, page) => sum + page.appWeight, 0)).toBe(100);
  });

  it('contains every approved page family', () => {
    // P1 (nav 4→3 skeleton): Guide-tab-roten er fjernet. 'guide' (huben) er
    // fjernet uten erstatning; 'find-outfit'/'clothing-library'/'wardrobe'
    // var kun nåbare via Guide-huben og har ingen synlig opener ennå — de
    // gjeninnføres når P5/P6 gir dem et entry-point fra Hjem.
    expect(PAGE_CATALOG.map((page) => page.id)).toEqual([
      'onboarding', 'home', 'outfit', 'plan',
      'tog', 'warm-cold', 'first-winter',
      'settings', 'paywall',
    ]);
  });

  it('versions the rubric', () => {
    expect(RUBRIC_VERSION).toMatch(/^1\./);
  });

  it('uses current deterministic navigation for onboarding and the Familie-hosted tools', () => {
    const onboarding = PAGE_CATALOG.find((page) => page.id === 'onboarding')!;
    const tog = PAGE_CATALOG.find((page) => page.id === 'tog')!;
    const warmCold = PAGE_CATALOG.find((page) => page.id === 'warm-cold')!;
    const firstWinter = PAGE_CATALOG.find((page) => page.id === 'first-winter')!;
    expect(onboarding.states[0]?.expectedText).toBeUndefined();
    expect(tog.states[0]?.actions).toContainEqual({ type: 'tab', name: 'Familie' });
    expect(tog.states[0]?.actions).toContainEqual({ type: 'button', pattern: 'Soveguiden' });
    expect(tog.states[0]?.expectedText).toBe('Soving innendørs');
    expect(warmCold.states[0]?.actions).toContainEqual({ type: 'tab', name: 'Familie' });
    expect(firstWinter.states[0]?.actions).toContainEqual({ type: 'tab', name: 'Familie' });
  });
});
