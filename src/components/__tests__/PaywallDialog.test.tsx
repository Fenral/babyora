/**
 * PaywallDialog — P2 hard paywall `dismissable` contract (structural render
 * check, same renderToStaticMarkup pattern already used throughout this
 * codebase's screen/component tests — no @capacitor/core mocking needed in
 * this node test environment).
 *
 * P10/JOB2 (2026-08-01): re-skinnet til betalingsvegg v2
 * (docs/mocks/monter/paywall-v2.html + paywall-v2-valgt.html,
 * docs/design-notes/sol-duel-2026-07-31.md §8). Denne filen dekker BÅDE den
 * uendrede dismissable-kontrakten OG v2-designets nye SSR-observerbare
 * kontrakt: default-tilstand har INGEN forhåndsvalgt plan (resting CTA),
 * tre likeverdige prisrader, ingen glødende ring/preselect. `selectedPlan`
 * er intern React-state (kun observerbar via faktisk klikk-interaksjon,
 * som denne repoens jsdom-løse testmiljø ikke støtter) — "valgt-tilstand"
 * (accent-surface/fylt radio/breakdown/armert CTA) er derfor dekket av
 * CSS-kontraktstester (klasse-tilstedeværelse, `:checked + …`-selektorer)
 * pluss et par kildeteksts-verifiseringer, samme fallback-konvensjon som
 * resten av denne repoen bruker for ikke-SSR-observerbar atferd (se f.eks.
 * App.finn-antrekk-drill.test.ts).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n/index.js';
import { PaywallDialog } from '../PaywallDialog';

beforeEach(async () => {
  await i18n.changeLanguage('no');
});

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8').replace(/\r\n/g, '\n');
}

const dialogPath = 'src/components/PaywallDialog.tsx';

describe('PaywallDialog dismissable contract', () => {
  it('default (dismissable omitted) renders a close button — existing call sites unaffected', () => {
    const html = renderToStaticMarkup(
      <PaywallDialog open trigger={null} onClose={vi.fn()} />,
    );
    expect(html).toContain('aria-label="Lukk"');
  });

  it('dismissable=true explicitly renders a close button', () => {
    const html = renderToStaticMarkup(
      <PaywallDialog open trigger={null} onClose={vi.fn()} dismissable />,
    );
    expect(html).toContain('aria-label="Lukk"');
  });

  it('dismissable=false renders NO close button (AppPaywallGate contract)', () => {
    const html = renderToStaticMarkup(
      <PaywallDialog open trigger={null} onClose={vi.fn()} dismissable={false} />,
    );
    expect(html).not.toContain('aria-label="Lukk"');
    // Restore/purchase controls must remain available — only dismissal is
    // blocked. v2: the CTA is RESTING by default ("Velg en plan for å
    // starte gratis"), not the old plan-agnostic "Start 7 dager gratis" —
    // no plan is preselected in the non-dismissable hard-wall gate either.
    expect(html).toContain('Gjenopprett kjøp');
    expect(html).toContain('Velg en plan for å starte gratis');
  });
});

describe('PaywallDialog v2 — no preselected plan, resting CTA (§8: "aktivt valg kreves")', () => {
  it('opens with NO plan checked and an aria-disabled resting CTA', () => {
    const html = renderToStaticMarkup(
      <PaywallDialog open trigger={null} onClose={vi.fn()} />,
    );
    expect(html).not.toContain('checked=""');
    expect(html).not.toContain('checked/>');
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('>Velg en plan for å starte gratis<');
    // No breakdown block should render before any plan is selected (the
    // STYLE_CSS block legitimately DEFINES the .pw-breakdown class — check
    // for an actual element using it, not the bare class-name substring).
    expect(html).not.toContain('class="pw-breakdown"');
  });

  it('renders exactly three equal plan rows: Årlig, Kvartal, Månedlig', () => {
    const html = renderToStaticMarkup(
      <PaywallDialog open trigger={null} onClose={vi.fn()} />,
    );
    expect(html.match(/class="pw-plan-label"/gu)?.length).toBe(3);
    expect(html).toContain('>Årlig<span class="pw-p-badge">Best verdi</span>');
    expect(html).toContain('>Kvartal<');
    expect(html).toContain('>Månedlig<');
    expect(html).toContain('25 kr per måned · spar 36 % mot månedsplan');
    expect(html).toContain('33 kr per måned');
    expect(html).toContain('Fornyes månedlig');
    expect(html).toContain('<span class="pw-p-sum">299 kr</span><span class="pw-p-per">per år</span>');
    expect(html).toContain('<span class="pw-p-sum">99 kr</span><span class="pw-p-per">per kvartal</span>');
    expect(html).toContain('<span class="pw-p-sum">39 kr</span><span class="pw-p-per">per måned</span>');
  });

  it('the old serif-hero copy, green trial text, and glow-border design are gone', () => {
    const html = renderToStaticMarkup(
      <PaywallDialog open trigger={null} onClose={vi.fn()} />,
    );
    expect(html).not.toContain('Hele Babyora, samlet i én plan');
    expect(html).not.toContain('SPAR 36 %');
    expect(html).toContain('Du har sett dagens gratis antrekk');
  });

  it('value section shows the three checkmark bullets', () => {
    const html = renderToStaticMarkup(
      <PaywallDialog open trigger={null} onClose={vi.fn()} />,
    );
    expect(html.match(/<svg width="15" height="15"/gu)?.length).toBe(3);
  });
});

describe('PaywallDialog v2 — selected-state contract (CSS + source-text, no jsdom interaction)', () => {
  it('accent-surface background + filled radio on :checked, no separate ring/glow rule', () => {
    const html = renderToStaticMarkup(
      <PaywallDialog open trigger={null} onClose={vi.fn()} />,
    );
    expect(html).toContain('.pw-plan-input:checked + .pw-plan-unit {\n  background: var(--dw-accent-surface);\n}');
    expect(html).toContain('.pw-plan-input:checked + .pw-plan-unit .pw-p-radio {');
    expect(html).not.toContain('outline: 3px solid var(--dw-accent-300)');
  });

  it('the armed CTA and the breakdown block are wired from the selected plan (source-text — behaviour needs a real click)', () => {
    const contents = source(dialogPath);
    expect(contents).toContain('paywall.armedCtaLabel(selectedPlan)');
    expect(contents).toContain("selected && breakdown && (");
    expect(contents).toContain('paywall.planBreakdown(selectedPlan, renewalBaseMs)');
  });

  it('Fraunces WONK-0 is used ONLY on the price sums, never elsewhere in the dialog', () => {
    const contents = source(dialogPath);
    expect(contents.match(/font-family: var\(--dw-font-hero\)/gu)?.length).toBe(1);
    expect(contents).toContain("font-variation-settings: 'WONK' 0;");
  });

  it('the renewal date is computed from the REAL current time (+trial days), never hardcoded', () => {
    const contents = source(dialogPath);
    expect(contents).toContain('setRenewalBaseMs(Date.now())');
    expect(contents).not.toMatch(/renewalDateLabel.*['"]7\. august['"]/);
  });

  it('REGRESSION: .pw-plan-unit and .pw-breakdown are explicit display:block — both are <span>s (inline by default) containing display:flex/block children, and an inline box painting a background/border-radius around block children fragments PER ANONYMOUS BLOCK instead of as one shape, which is exactly what produced stray accent-surface padding-box chips above "I dag" and below "Avsluttes i App Store" during QA screenshotting', () => {
    const contents = source(dialogPath);
    expect(contents).toMatch(/\.pw-plan-unit\s*\{[^}]*display:\s*block/);
    expect(contents).toMatch(/\.pw-breakdown\s*\{\s*display:\s*block/);
  });

  it('REGRESSION: the CTA is focused imperatively right after showModal(), not left to the React autoFocus prop alone — autoFocus never sets a real HTML autofocus attribute (React does an imperative .focus() on commit instead), so it can lose the race against <dialog>.showModal()\'s OWN default-focus algorithm, which otherwise lands on the fieldset\'s first radio input and draws a stray :focus-visible ring around Årlig on the RESTING (no-selection) screen — directly contradicting §8\'s "no preselected/highlighted plan"', () => {
    const contents = source(dialogPath);
    expect(contents).toContain('ctaRef.current?.focus();');
    const showModalIdx = contents.indexOf('dlg.showModal();');
    const focusIdx = contents.indexOf('ctaRef.current?.focus();');
    expect(showModalIdx).toBeGreaterThan(-1);
    expect(focusIdx).toBeGreaterThan(showModalIdx);
  });
});

describe('PaywallDialog v2 — links row (Gjenopprett kjøp · Personvern · Vilkår)', () => {
  it('all three links/buttons are present, ≥13px and ≥44pt tall', () => {
    const html = renderToStaticMarkup(
      <PaywallDialog open trigger={null} onClose={vi.fn()} />,
    );
    expect(html).toContain('>Gjenopprett kjøp<');
    expect(html).toContain('>Personvern<');
    expect(html).toContain('>Vilkår<');
    expect(html).toContain('min-height:44px');
    expect(html.match(/min-height:44px/gu)!.length).toBeGreaterThanOrEqual(3);
  });

  it('Personvern/Vilkår remain real external links (App Store compliance — never plain buttons)', () => {
    const html = renderToStaticMarkup(
      <PaywallDialog open trigger={null} onClose={vi.fn()} />,
    );
    expect(html).toContain('href="https://babyora.no/personvern"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });
});

describe('PaywallDialog v2 — behaviour preserved (entitlement/purchase/restore/haptics untouched)', () => {
  it('PaywallDialog beholder eksisterende focus-return ved lukk', () => {
    const contents = source(dialogPath);
    expect(contents).toContain('returnFocusTo?.focus?.()');
  });

  it('P9 haptics vocabulary (prepare on mount, selection on plan pick, no haptic on the purchase tap itself) is unchanged', () => {
    const contents = source(dialogPath);
    expect(contents).toContain('void prepareHaptics();');
    expect(contents).toContain('void fireSelection();');
    expect(contents).toContain('INGEN haptikk på selve kjøpsknapp-trykket');
  });

  it('purchase/restore still update subscription-store and fire the same analytics events', () => {
    const contents = source(dialogPath);
    expect(contents).toContain('setPremium(true);');
    expect(contents).toContain("track({ type: 'paywall_converted', plan });");
    expect(contents).toContain("track({ type: 'trial_started', plan });");
  });
});

describe('PaywallDialog localization', () => {
  it.each([
    ['sv', 'Stäng', 'Du har sett dagens kostnadsfria kläder', 'Årsvis', 'Återställ köp', 'Integritet'],
    ['da', 'Luk', 'Du har set dagens gratis tøj', 'Årlig', 'Gendan køb', 'Privatliv'],
    ['en', 'Close', 'You’ve seen today’s free outfit', 'Yearly', 'Restore purchases', 'Privacy'],
    ['de', 'Close', 'You’ve seen today’s free outfit', 'Yearly', 'Restore purchases', 'Privacy'],
  ])('renders %s copy (German intentionally falls back to English)', async (
    language,
    close,
    heading,
    yearly,
    restore,
    privacy,
  ) => {
    await i18n.changeLanguage(language);

    const html = renderToStaticMarkup(
      <PaywallDialog open trigger={null} onClose={vi.fn()} />,
    );

    expect(html).toContain(`aria-label="${close}"`);
    expect(html).toContain(heading);
    expect(html).toContain(`>${yearly}<span class="pw-p-badge">`);
    expect(html).toContain(`>${restore}<`);
    expect(html).toContain(`>${privacy}<`);
    if (language !== 'no') expect(html).not.toContain('Gjenopprett kjøp');
  });
});
