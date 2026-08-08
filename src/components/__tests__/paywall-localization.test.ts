import { describe, expect, it } from 'vitest';
import {
  paywallCopyFor,
  resolvePaywallLanguage,
} from '../paywall-localization.js';

describe('paywall locale policy', () => {
  it.each([
    ['sv-SE', 'sv'],
    ['da-DK', 'da'],
    ['no-NO', 'no'],
    ['nb-NO', 'no'],
    ['nn-NO', 'no'],
    ['en-US', 'en'],
    ['de-DE', 'en'],
    ['fi-FI', 'en'],
    [null, 'en'],
  ] as const)('resolves %s to %s', (language, expected) => {
    expect(resolvePaywallLanguage(language)).toBe(expected);
  });

  it.each([
    ['en', 'Yearly', 'Best value', 'Start free – then 299 kr/year', '8 August'],
    ['sv', 'Årsvis', 'Bäst värde', 'Börja gratis – därefter 299 kr/år', '8 augusti'],
    ['da', 'Årlig', 'Bedste værdi', 'Start gratis – derefter 299 kr/år', '8. august'],
    ['no', 'Årlig', 'Best verdi', 'Start gratis – deretter 299 kr/år', '8. august'],
  ] as const)('localizes plan rows, CTA and renewal details in %s', (
    language,
    planName,
    badge,
    cta,
    renewalDate,
  ) => {
    const paywall = paywallCopyFor(language);
    const fromMs = new Date(2026, 7, 1, 12, 0, 0).getTime();

    expect(paywall.planRow('yearly')).toMatchObject({ name: planName, badge });
    expect(paywall.armedCtaLabel('yearly')).toBe(cta);
    expect(paywall.planBreakdown('yearly', fromMs).renewalDateLabel).toBe(renewalDate);
    expect(paywall.planAriaLabel('yearly')).toContain('299');
    expect(paywall.planAriaLabel('yearly')).toContain('36');
  });

  it('keeps purchase, restore, privacy and error states localized, with German on English', () => {
    const german = paywallCopyFor('de-DE').text;
    const swedish = paywallCopyFor('sv-SE').text;
    const danish = paywallCopyFor('da-DK').text;

    expect(german.statusProcessing).toBe('Processing purchase …');
    expect(german.errorPurchaseException).toBe('Something went wrong during the purchase. Try again.');
    expect(swedish.statusRestoreChecking).toBe('Kontrollerar tidigare köp …');
    expect(swedish.privacyLinkAriaLabel).toContain('öppnas i webbläsaren');
    expect(danish.errorRestoreException).toContain('internetforbindelsen');
    expect(danish.termsLinkLabel).toBe('Vilkår');
  });
});
