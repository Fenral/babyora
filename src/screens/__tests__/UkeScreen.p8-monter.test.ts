/// <reference types="node" />

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * P8 (Planlegg re-skin) — source assertions guarding two doctrine rules
 * that are easy to silently regress in a CSS file with no visual diffing:
 *
 *  1. Typography: "Schibsted everywhere; NO serif headings; Fraunces ONLY
 *     if a hero temperature exists on the selected-day hero" — the single
 *     allowed exception is `.planlegg-weather__temp` (the day-hero temp,
 *     UkeScreen.tsx's `heroWeather.tempC`). Any OTHER rule that reaches for
 *     var(--dw-font-hero)/Fraunces/var(--font-serif)/var(--font-display) is
 *     a regression of the P7 flat-heading finding.
 *  2. Depth doctrine D1: recommendation/reading content lives on ONE raised
 *     surface, never a naked hairline row directly on canvas.
 */

async function ukeScreenCss(): Promise<string> {
  return readFile(fileURLToPath(new URL('../UkeScreen.css', import.meta.url)), 'utf8');
}

describe('Planlegg (UkeScreen) — P8 Monter re-skin contracts', () => {
  it('I dag og I morgen deler hele bredden i en to-kolonners kontroll', async () => {
    const css = await ukeScreenCss();
    const uke = await readFile(fileURLToPath(new URL('../UkeScreen.tsx', import.meta.url)), 'utf8');

    expect(uke).toContain("{ value: 'today', label: 'I dag' }");
    expect(uke).toContain("{ value: 'tomorrow', label: 'I morgen' }");
    expect(uke).not.toContain("label: 'Uke'");
    expect(uke).not.toContain("label: 'Snart'");
    expect(uke).toContain("'Gjør klart kvelden før'");
    expect(uke).toContain('Dette antrekket holder gjennom morgendagen');
    expect(css).toMatch(/\.planlegg-screen__views \.segmented-control__group\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)[^}]*width:\s*100%/su);
  });

  it('Fraunces/serif appears in exactly one rule: the day-hero temperature', async () => {
    const css = await ukeScreenCss();

    // No legacy serif tokens anywhere — those were the F80b Morgennatt
    // display font, explicitly retired for Planlegg in P8.
    expect(css).not.toContain('var(--font-serif)');
    expect(css).not.toContain('var(--font-display)');

    // Exactly one occurrence of the hero font token in the whole file, and
    // it must belong to the day-hero temperature's own rule block — found
    // via plain string scanning (not a single greedy/backtracking regex
    // over the whole file) so this stays fast and unambiguous. Comments are
    // stripped first so a preceding doc-comment doesn't get swept into the
    // "selector" text.
    const withoutComments = css.replace(/\/\*[\s\S]*?\*\//gu, '');
    const heroFontOccurrences = withoutComments.split('var(--dw-font-hero)').length - 1;
    expect(heroFontOccurrences).toBe(1);

    const hitIndex = withoutComments.indexOf('var(--dw-font-hero)');
    const selectorStart = withoutComments.lastIndexOf('}', hitIndex) + 1;
    const braceIndex = withoutComments.indexOf('{', selectorStart);
    const selector = withoutComments.slice(selectorStart, braceIndex).trim();
    expect(selector).toBe('.planlegg-weather__temp');
  });

  it('heading/verdict/status selectors never reach for var(--dw-font-hero)', async () => {
    const css = await ukeScreenCss();
    const headingSelectors = [
      '.planlegg-screen__header h1',
      '.planlegg-screen__verdict',
      '.planlegg-screen__rail h2',
      '.planlegg-status h2',
      '.planlegg-weather__day',
      '.planlegg-weather__condition',
    ];

    for (const selector of headingSelectors) {
      const escaped = selector.replace(/[.$]/gu, '\\$&');
      const ruleMatch = css.match(new RegExp(`${escaped}\\s*\\{[^}]*\\}`, 'su'));
      expect(ruleMatch, `expected a rule for ${selector}`).not.toBeNull();
      expect(ruleMatch![0]).not.toMatch(/font-family:\s*var\(--dw-font-hero\)/u);
    }
  });

  it('depth doctrine D1: verdict/next-action/timeline share one raised surface, not naked rows on canvas', async () => {
    const css = await ukeScreenCss();

    expect(css).toContain('.planlegg-advice');
    const adviceRule = css.match(/\.planlegg-advice\s*\{[^}]*\}/su)?.[0];
    expect(adviceRule).toBeDefined();
    expect(adviceRule).toMatch(/background:\s*var\(--dw-raised\)/u);
    // Light logic (doctrine rule 2): edge-light + a shadow, not a flat fill.
    expect(css).toMatch(/\.planlegg-advice::before\s*\{[\s\S]*?var\(--dw-edge-light-gradient\)/u);
  });

  it('petrol weather module owns the weather/date color role (§13) and nests the forecast disclosure instead of it floating free', async () => {
    const css = await ukeScreenCss();
    const uke = await readFile(fileURLToPath(new URL('../UkeScreen.tsx', import.meta.url)), 'utf8');

    const weatherRule = css.match(/\.planlegg-weather\s*\{[^}]*\}/su)?.[0];
    expect(weatherRule).toBeDefined();
    expect(weatherRule).toMatch(/background:\s*var\(--dw-w-cloudy\)/u);
    expect(css).toContain(".planlegg-weather .planlegg-forecast");

    // The old free-floating ForecastDisclosure render (a sibling of the
    // advice section, gated on the exact same four conditions) is gone —
    // there is now exactly one <ForecastDisclosure in the file, nested
    // inside .planlegg-weather.
    expect(uke.match(/<ForecastDisclosure/gu)).toHaveLength(1);
  });
});
