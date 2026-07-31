/// <reference types="node" />

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * P8 (light-mode calibration pass) — hjem-monter.css was built dark-first
 * (P4) and had several literal-hex "shortcuts" that silently assumed a dark
 * canvas: a hardcoded #33241674 gradient stop, and box-shadow rgba(0,0,0,*)
 * values tuned for a dark backdrop (too heavy once --dw-raised flips to a
 * light card in light mode). Both are now token-driven — this test guards
 * the regression, not the doctrine's explicit, intentional exceptions:
 *
 *  - #3A2A1A (the garment/thumb vitrine background) is deliberately
 *    theme-constant per DESIGN.md's depth doctrine ("asset vitrine
 *    treatment" — a lit-object thumb frame, not a themed surface).
 *  - The five --dw-w-* weather-nuance colors (panel fill) are deliberately
 *    theme-constant per DESIGN.md ("weather reactivity lives ONLY in the
 *    panel nuance... canvas and ink stay constant").
 */

async function hjemMonterCss(): Promise<string> {
  return readFile(fileURLToPath(new URL('../hjem-monter.css', import.meta.url)), 'utf8');
}

const ALLOWED_THEME_CONSTANT_HEX = new Set([
  '#3a2a1a', // vitrine thumb bg — doctrine-documented theme-constant exception
]);

describe('hjem-monter.css — P8 light-mode token consumption', () => {
  it('has no hardcoded dark-canvas/raised hex outside the documented theme-constant exception', async () => {
    const css = await hjemMonterCss();
    // Strip /* ... */ comments first — this guards actual rules, not the
    // file's own prose explaining WHY a token was chosen (which legitimately
    // needs to spell out hex values for the reader).
    const withoutComments = css.replace(/\/\*[\s\S]*?\*\//gu, '');
    const hexLiterals = [...withoutComments.matchAll(/#[0-9A-Fa-f]{6}(?![0-9A-Fa-f])/gu)]
      .map((match) => match[0].toLowerCase());

    const undeclared = hexLiterals.filter((hex) => !ALLOWED_THEME_CONSTANT_HEX.has(hex));
    expect(undeclared, `unexpected hardcoded hex literal(s) in hjem-monter.css: ${undeclared.join(', ')}`).toEqual([]);
  });

  it('surface shadows are component-scoped custom properties with a light-mode override, not raw rgba(0,0,0,*) baked into each rule', async () => {
    const css = await hjemMonterCss();

    for (const token of ['--hjm-shadow-panel', '--hjm-shadow-lift', '--hjm-shadow-cta', '--hjm-shadow-thumb', '--hjm-shadow-prev', '--hjm-shadow-strip', '--hjm-mascot-shadow']) {
      // Declared once with a dark default...
      expect(css, `${token} missing a default declaration`).toContain(`${token}: 0`);
      // ...and consumed via var() at its use site instead of a literal
      // rgba(0,0,0,*) baked directly into .hjm-panel/.hjm-rows/etc.
      expect(css, `${token} is declared but never consumed via var()`).toContain(`var(${token})`);
    }

    // Both the auto (prefers-color-scheme) and explicit data-theme="light"
    // paths must override these — same two-block pattern already used by
    // design-tokens-v2.css for --dw-raised etc.
    expect(css).toMatch(/@media \(prefers-color-scheme: light\)\s*\{\s*:root:not\(\[data-theme="dark"\]\) \.hjem-monter/u);
    expect(css).toMatch(/:root\[data-theme="light"\] \.hjem-monter\s*\{/u);

    // Light shadows must actually be smaller/sharper AND warm-toned
    // (rgba(42, 29, 18, *) — the same warm-brown anchor as --dw-hairline /
    // --dw-shadow-raise), never a bare black shadow inherited unchanged.
    const lightBlockMatch = css.match(/:root\[data-theme="light"\] \.hjem-monter\s*\{([\s\S]*?)\}/u);
    expect(lightBlockMatch).not.toBeNull();
    const lightBlock = lightBlockMatch![1]!;
    expect(lightBlock).not.toMatch(/rgba\(0,\s*0,\s*0,/u);
    expect(lightBlock.match(/rgba\(42,\s*29,\s*18,/gu)?.length).toBe(7);
  });

  it('the top-of-card gradient stop is derived from the theme-aware canvas-glow token, not a dark-mode-only literal', async () => {
    const css = await hjemMonterCss();
    const withoutComments = css.replace(/\/\*[\s\S]*?\*\//gu, '');

    // The old dark-only literal must be gone from actual CODE (a comment is
    // allowed to still name it for context — see test 1's comment-aware hex
    // scan, which is the authoritative "no stray hex" guard).
    expect(withoutComments).not.toMatch(/#332416/iu);
    expect(css).toMatch(/color-mix\(in srgb, var\(--dw-canvas-glow\)\s*45%,\s*transparent\)/u);
  });

  it('.hjem-monter consumes the shared floating-tab-bar clearance token for its own bottom padding (it manages its own nested scroll)', async () => {
    const css = await hjemMonterCss();
    const rootRule = css.match(/\.hjem-monter\s*\{[^}]*\}/su)?.[0];

    expect(rootRule).toBeDefined();
    expect(rootRule).toMatch(/padding:[^;]*var\(--dw-tabbar-clearance/u);
  });
});
