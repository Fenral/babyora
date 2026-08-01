/**
 * OnboardingScreen — P10/JOB5 (2026-08-01) step-1 v2 re-skin
 * (docs/mocks/monter/onboarding-steg1-v2.html + sol-duel-2026-07-31.md §11,
 * owner-confirmed headline correction same day).
 *
 * Rendered via renderToStaticMarkup — same jsdom-less convention as
 * FinnAntrekkScreen.prefill.test.tsx (this repo has no jsdom/testing-
 * library; ChildrenProvider's storage helpers already guard on
 * `typeof window === 'undefined'` and return safe defaults in Node).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OnboardingScreen } from '../OnboardingScreen';
import { ChildrenProvider } from '../../state/children-provider';

function renderScreen(): string {
  return renderToStaticMarkup(
    <ChildrenProvider>
      <OnboardingScreen />
    </ChildrenProvider>,
  );
}

function source(): string {
  return readFileSync(resolve(process.cwd(), 'src/screens/OnboardingScreen.tsx'), 'utf8');
}

describe('OnboardingScreen — step 1 v2 (Monter re-skin)', () => {
  it('headline is "Hvem kler vi på?" — Schibsted 700, no colored/italic emphasis word', () => {
    const html = renderScreen();
    expect(html).toContain('>Hvem kler vi på?<');
    expect(html).not.toContain('Hva heter');
    expect(html).not.toContain('<em>babyen</em>');
    expect(html).toContain('class="ob-s1-h1"');
  });

  it('the old violations are gone: no italic/colored <em>, no hardcoded lilac card background', () => {
    const contents = source();
    // .ob-h2/.ob-h2-hero headings (steps 2-4/5) now use Schibsted, not Fraunces.
    expect(contents).toContain('font-family:var(--ob-font-sans);font-weight:700');
    expect(contents).not.toContain('font-family:var(--ob-font-serif);font-weight:400');
    expect(contents).not.toContain('font-style:italic;color:var(--ob-terracotta-700)');
    expect(contents).not.toContain('background:#eee9f3');
  });

  it('ingress copy matches the owner-confirmed contract', () => {
    const html = renderScreen();
    expect(html).toContain('Bruk navn eller kallenavn hvis du vil gjøre rådene personlige.');
  });

  it('renders the standing mascot (not the hanging MascotPeek pose, not the old doll asset)', () => {
    const html = renderScreen();
    expect(html).toContain('class="ob-s1-mascot"');
    expect(html).toContain('src="/monter/maskot-staaende-cut-360.png"');
    expect(html).not.toContain('babyora-intro-v3');
    expect(html).not.toContain('hjm-mascot');
  });

  it('name field: label, helper text, no autofocus, optional (Fortsett always active)', () => {
    const html = renderScreen();
    expect(html).toContain('Navn eller kallenavn');
    expect(html).toContain('Valgfritt');
    expect(html).toContain('Brukes bare i teksten og lagres på denne iPhonen.');
    expect(html).not.toContain('autofocus');
    // "Fortsett" CTA has no disabled/aria-disabled attribute on step 1.
    const ctaMatch = html.match(/<button class="ob-btn-primary" type="button">\s*Fortsett/);
    expect(ctaMatch).not.toBeNull();
  });

  it('no separate "Hopp over" exit exists on step 1', () => {
    const html = renderScreen();
    expect(html).not.toContain('Hopp over');
  });

  it('shows the live name-preview line reflecting the (empty) input value', () => {
    const html = renderScreen();
    expect(html).toContain('class="ob-s1-preview-tag">Navnet brukes i rådene<');
    expect(html).toContain('Da er vi klare for');
    expect(html).toContain('class="ob-s1-preview-named">babyen<');
  });

  it('progress is a segment bar only — no duplicate "1 av 4" text, amber only on the active segment', () => {
    const html = renderScreen();
    expect(html).toContain('class="ob-seg-progress"');
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="1"');
    // Exactly 4 segments, only the first one active on step 1.
    expect(html.match(/<i class="active"/gu)?.length).toBe(1);
    expect(html.match(/<i class=""/gu)?.length).toBe(3);
    expect(html).not.toMatch(/>1 av 4</);
  });

  it('P10.1 (judge finding D3): the BABYORA brand row is present on step 1 (was previously suppressed entirely)', () => {
    const html = renderScreen();
    expect(html).toContain('class="ob-s1-brand">BABYORA<');
  });

  it('P10.1 (judge finding D4): no leading person-icon inside the name input — not in the contract, amber is action-only', () => {
    const html = renderScreen();
    expect(html).not.toContain('class="ob-input-icon"');
  });

  it('P10.1 (judge finding D5, rule §13): helper/sub text is never opacity-dimmed', () => {
    const contents = source();
    const hintRuleStart = contents.indexOf('.ob-hint{');
    expect(hintRuleStart).toBeGreaterThan(-1);
    const hintRule = contents.slice(hintRuleStart, contents.indexOf('}', hintRuleStart));
    expect(hintRule).not.toContain('opacity');
    const subRuleStart = contents.indexOf('.ob-s1-sub{');
    expect(subRuleStart).toBeGreaterThan(-1);
    const subRule = contents.slice(subRuleStart, contents.indexOf('}', subRuleStart));
    expect(subRule).not.toContain('opacity');
  });

  it('P10.1 (judge finding D2): mascot+card share an explicit docking container that blocks margin-collapse (flow-root), right-aligned per contract, no deep negative-margin sink', () => {
    const contents = source();
    const heroRuleStart = contents.indexOf('.ob-s1-hero{');
    expect(heroRuleStart).toBeGreaterThan(-1);
    const heroRule = contents.slice(heroRuleStart, contents.indexOf('}', heroRuleStart));
    expect(heroRule).toContain('display:flow-root');
    const mascotRuleStart = contents.indexOf('.ob-s1-mascot{');
    expect(mascotRuleStart).toBeGreaterThan(-1);
    const mascotRule = contents.slice(mascotRuleStart, contents.indexOf('}', mascotRuleStart));
    expect(mascotRule).toContain('right:30px');
    expect(mascotRule).not.toContain('margin:14px auto -50px');
  });

  it('P10.1 (judge finding D7): the CTA zone stays a normal flex-column member (never position:fixed) on a dvh-sized, overflow-hidden root — content scrolls, the CTA/hint/preview are never independently hidden by the keyboard', () => {
    const contents = source();
    expect(contents).not.toMatch(/\.ob-cta-zone\s*\{[^}]*position:\s*fixed/);
    expect(contents).toContain('height:100dvh');
    expect(contents).toContain('min-height:100dvh');
  });

  it('REGRESSION: .ob-seg-progress declares flex-direction:row explicitly — design-tokens.css\'s global ".app-shell > main > div{flex-direction:column;...}" rule ALSO matches this element (.ob-screen is the <main>, this div is a direct child, .ob-screen sits directly under .app-shell pre-onboarding) and has higher specificity than a property .ob-seg-progress never used to declare, which silently zeroed the segments\' height (found during P10/JOB1-5 screenshot QA: an invisible progress bar)', () => {
    const contents = source();
    const ruleStart = contents.indexOf('.ob-screen > .ob-seg-progress{');
    expect(ruleStart).toBeGreaterThan(-1);
    // The rule body ends at the FIRST "}" that isn't inside the doc comment
    // above the declarations — simplest robust check: the actual property
    // declaration string appears somewhere after the selector.
    const ruleSlice = contents.slice(ruleStart, ruleStart + 1400);
    expect(ruleSlice).toContain('display:flex;flex-direction:row;gap:6px;');
  });
});
