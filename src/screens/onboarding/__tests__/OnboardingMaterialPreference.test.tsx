import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import i18n from '../../../i18n';
import { OnboardingMaterialPreference } from '../OnboardingMaterialPreference';
import {
  SELECTABLE_MATERIAL_PREFERENCES,
  materialPreferenceLabel,
  onboardingCopyFor,
} from '../onboarding-copy';

function renderPreference(value: 'best_for_conditions' | 'prefer_fleece' | 'prefer_cotton'): string {
  return renderToStaticMarkup(
    <OnboardingMaterialPreference value={value} onChange={vi.fn()} />,
  );
}

describe('OnboardingMaterialPreference', () => {
  it('offers conditions, wool, fleece and cotton with neutral selected by default', async () => {
    await i18n.changeLanguage('en');
    const html = renderPreference('best_for_conditions');

    expect(SELECTABLE_MATERIAL_PREFERENCES).toEqual([
      'best_for_conditions',
      'prefer_wool',
      'prefer_fleece',
      'prefer_cotton',
    ]);
    expect(html.match(/type="radio"/gu)).toHaveLength(4);
    expect(html).toMatch(
      /<input[^>]*checked=""[^>]*value="best_for_conditions"/u,
    );
  });

  it.each([
    ['en', 'Wool first', 'Benefit', 'Good to know'],
    ['sv', 'Ull först', 'Fördel', 'Bra att veta'],
    ['da', 'Uld først', 'Fordel', 'Værd at vide'],
  ] as const)('renders complete %s material copy', async (language, wool, benefit, tradeoff) => {
    await i18n.changeLanguage(language);
    const html = renderPreference('prefer_fleece');

    expect(html).toContain(wool);
    expect(html).toContain(benefit);
    expect(html).toContain(tradeoff);
    expect(html).toContain('class="ob-material-option selected"');
    expect(html).toMatch(
      /<input[^>]*checked=""[^>]*value="prefer_fleece"/u,
    );
  });

  it('uses conservative source-aligned wool and fleece comparisons', () => {
    const copy = onboardingCopyFor('en').material;
    expect(copy.options.prefer_wool.advantage).toMatch(/temperature and moisture/u);
    expect(copy.options.prefer_wool.tradeoff).toMatch(/gentler care/u);
    expect(copy.options.prefer_fleece.advantage).toMatch(/lightweight and quick-drying/iu);
    expect(copy.options.prefer_fleece.tradeoff).toMatch(/less wind protection/u);
    expect(copy.options.prefer_cotton.advantage).toMatch(/soft|easy to wash/iu);
    expect(copy.options.prefer_cotton.tradeoff).toMatch(/moisture|cold|wet/iu);
    expect(copy.reassurance).toMatch(/safety always come first/u);
  });

  it('renders cotton as a first-class selected strategy', async () => {
    await i18n.changeLanguage('en');
    const html = renderPreference('prefer_cotton');
    expect(html).toContain('Cotton first');
    expect(html).toMatch(/<input[^>]*checked=""[^>]*value="prefer_cotton"/u);
  });

  it('presents legacy avoid_wool as the compatible fleece-first choice', () => {
    const copy = onboardingCopyFor('sv').material;
    expect(materialPreferenceLabel('avoid_wool', copy)).toBe('Fleece först');
  });

  it('falls back safely to English for German and unknown languages', () => {
    expect(onboardingCopyFor('de')).toBe(onboardingCopyFor('en'));
    expect(onboardingCopyFor('fr-FR')).toBe(onboardingCopyFor('en'));
  });
});
