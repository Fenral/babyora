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
    expect(PAGE_CATALOG.map((page) => page.id)).toEqual([
      'onboarding', 'home', 'outfit', 'plan', 'guide', 'find-outfit',
      'clothing-library', 'wardrobe', 'tog', 'warm-cold', 'first-winter',
      'settings', 'paywall',
    ]);
  });

  it('versions the rubric', () => {
    expect(RUBRIC_VERSION).toMatch(/^1\./);
  });

  it('uses current deterministic navigation for onboarding and the calculator', () => {
    const onboarding = PAGE_CATALOG.find((page) => page.id === 'onboarding')!;
    const calculator = PAGE_CATALOG.find((page) => page.id === 'find-outfit')!;
    const tog = PAGE_CATALOG.find((page) => page.id === 'tog')!;
    expect(onboarding.states[0]?.expectedText).toBeUndefined();
    expect(calculator.states[0]?.actions).toContainEqual({ type: 'button', pattern: 'Kleskalkulatoren' });
    expect(tog.states[0]?.actions).toContainEqual({ type: 'button', pattern: 'Soving innendørs' });
    expect(tog.states[0]?.expectedText).toBe('Soving innendørs');
  });
});
