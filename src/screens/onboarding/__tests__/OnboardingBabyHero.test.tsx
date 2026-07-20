import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OnboardingBabyHero } from '../OnboardingBabyHero.js';

describe('OnboardingBabyHero', () => {
  it('viser Babyora som ekte tekst og spiller signatursekvensen én gang', () => {
    const html = renderToStaticMarkup(<OnboardingBabyHero reducedMotion={false} />);

    expect(html).toContain('>Babyora<');
    expect(html).toContain('/illustrations/onboarding/babyora-intro-v3.mp4');
    expect(html).toContain('/illustrations/onboarding/babyora-intro-v3.webp');
    expect(html).toContain('autoPlay');
    expect(html).toContain('playsInline');
    expect(html).not.toContain('loop');
  });

  it('viser bare stillbildet når redusert bevegelse er aktivert', () => {
    const html = renderToStaticMarkup(<OnboardingBabyHero reducedMotion />);

    expect(html).toContain('>Babyora<');
    expect(html).toContain('/illustrations/onboarding/babyora-intro-v3.webp');
    expect(html).not.toContain('<video');
  });
});
