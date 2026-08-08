import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SOURCE = readFileSync(
  resolve(__dirname, '../OnboardingScreen.tsx'),
  'utf8',
).replace(/\r\n/gu, '\n');

describe('Onboarding sidebevegelse og rytme', () => {
  it('gir frem og tilbake hver sin horisontale retning', () => {
    expect(SOURCE).toContain('data-step-direction={stepDirection}');
    expect(SOURCE).toContain('@keyframes ob-content-in-forward');
    expect(SOURCE).toContain('translate3d(14px,0,0)');
    expect(SOURCE).toContain('@keyframes ob-content-in-backward');
    expect(SOURCE).toContain('translate3d(-14px,0,0)');
  });

  it('bruker den diskrete selection-pulsen for ordinære stegbytter', () => {
    const navigationBlock = SOURCE.slice(
      SOURCE.indexOf('const advanceStep'),
      SOURCE.indexOf('const requestLocation'),
    );

    expect(navigationBlock).toContain("fire('selection')");
    expect(navigationBlock).not.toContain("fire('medium')");
  });
});
