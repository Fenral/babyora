import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OnboardingBabyHero } from '../OnboardingBabyHero.js';

describe('OnboardingBabyHero', () => {
  it('viser Babyora som ekte tekst og spiller signatursekvensen én gang', () => {
    const html = renderToStaticMarkup(<OnboardingBabyHero reducedMotion={false} />);

    expect(html).toContain('>Babyora<');
    expect(html).toContain('/illustrations/onboarding/babyora-intro-v3.mp4');
    expect(html).toContain('/monter/maskot-staaende-cut-360.webp');
    expect(html).toContain('autoPlay');
    expect(html).toContain('playsInline');
    expect(html).not.toContain('loop');
  });

  it('viser bare stillbildet når redusert bevegelse er aktivert', () => {
    const html = renderToStaticMarkup(<OnboardingBabyHero reducedMotion />);

    expect(html).toContain('>Babyora<');
    expect(html).toContain('/monter/maskot-staaende-cut-360.webp');
    expect(html).not.toContain('<video');
  });

  it('starter ikke videoen igjen etter at sekvensen er sett', () => {
    const html = renderToStaticMarkup(
      <OnboardingBabyHero reducedMotion={false} playMotion={false} />,
    );

    expect(html).toContain('/monter/maskot-staaende-cut-360.webp');
    expect(html).not.toContain('<video');
  });

  it('bruker den rolige babyfiguren med kontekstmarkør på senere steg', () => {
    const html = renderToStaticMarkup(
      <OnboardingBabyHero
        reducedMotion={false}
        playMotion={false}
        variant="compact"
        context="birthday"
      />,
    );

    expect(html).toContain('ob-baby-hero compact');
    expect(html).toContain('ob-baby-context birthday');
    expect(html).toContain('/monter/maskot-staaende-cut-360.webp');
    expect(html).not.toContain('/illustrations/onboarding/onboarding-step2-birthday.webp');
    expect(html).not.toContain('<video');
    expect(html).not.toContain('>Babyora<');
  });
});
