import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import { ChildrenProvider } from '../../state/children-provider';
import {
  OnboardingScreen,
  type OnboardingStep,
} from '../OnboardingScreen';
import { onboardingCopyFor } from '../onboarding/onboarding-copy';

const STEPS: readonly OnboardingStep[] = [1, 2, 3, 4, 5, 6];

async function renderJourney(language: 'en' | 'sv' | 'da'): Promise<string> {
  await i18n.changeLanguage(language);
  return STEPS.map((initialStep) => renderToStaticMarkup(
    <ChildrenProvider>
      <OnboardingScreen initialStep={initialStep} />
    </ChildrenProvider>,
  )).join('\n').replace(/<style>[\s\S]*?<\/style>/gu, '');
}

describe('OnboardingScreen localization', () => {
  it('renders the complete English journey without Norwegian UI copy', async () => {
    const html = await renderJourney('en');
    expect(html).toContain('Who are we dressing?');
    expect(html).toContain('When was your baby');
    expect(html).toContain('Where is <em>home</em>?');
    expect(html).toContain('Which materials work for you?');
    expect(html).toContain('Wool first');
    expect(html).toContain('Fleece first');
    expect(html).toContain('Cotton first');
    expect(html).toContain('Almost done');
    expect(html).toContain('Babyora is ready');
    expect(html).toContain('aria-label="Step 2 of 5"');
    expect(html).not.toMatch(/Hvem kler|Når er|Hvor er dere|Nesten ferdig|Fortsett/u);
  });

  it('renders polished Swedish throughout the journey', async () => {
    const html = await renderJourney('sv');
    expect(html).toContain('Vem klär vi på?');
    expect(html).toContain('<em>föddes</em> barnet?');
    expect(html).toContain('Var är ni <em>hemma</em>?');
    expect(html).toContain('Vilka material passar er?');
    expect(html).toContain('Ull först');
    expect(html).toContain('Fleece först');
    expect(html).toContain('Bomull först');
    expect(html).toContain('Nästan klart');
    expect(html).toContain('Babyora är redo');
    expect(html).toContain('aria-label="Steg 2 av 5"');
    expect(html).not.toMatch(/Hvem kler|Når er|Hvor er dere|Nesten ferdig|Fortsett/u);
  });

  it('renders polished Danish throughout the journey', async () => {
    const html = await renderJourney('da');
    expect(html).toContain('Hvem klæder vi på?');
    expect(html).toContain('Hvornår er barnet <em>født</em>?');
    expect(html).toContain('Hvor er I <em>hjemme</em>?');
    expect(html).toContain('Hvilke materialer passer hos jer?');
    expect(html).toContain('Uld først');
    expect(html).toContain('Fleece først');
    expect(html).toContain('Bomuld først');
    expect(html).toContain('Næsten færdig');
    expect(html).toContain('Babyora er klar');
    expect(html).toContain('aria-label="Trin 2 af 5"');
    expect(html).not.toMatch(/Hvem kler|Når er|Hvor er dere|Nesten ferdig|Fortsett/u);
  });

  it.each(['en', 'sv', 'da'] as const)(
    '%s copy localizes hidden search, status, summary, month and action text',
    (language) => {
      const copy = onboardingCopyFor(language);
      const localized = [
        copy.months.join(' '),
        copy.step3.searchInputLabel,
        copy.step3.searchMore,
        copy.step3.resultCount(2),
        copy.step3.noResultsYet,
        copy.step3.error,
        copy.step5.summaryLabel,
        copy.step5.editMaterial,
        copy.navigation.completed,
        copy.actions.createFirstOutfit,
      ].join(' | ');
      expect(localized).not.toMatch(/Ingen treff ennå|Søk etter by|Endre materialvalg|Lag første antrekk/u);
    },
  );
});
