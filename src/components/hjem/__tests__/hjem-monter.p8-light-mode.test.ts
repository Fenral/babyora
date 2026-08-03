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

  /**
   * R1 (2026-08-03) — MIGRERT, ikke svekket.
   *
   * P8 krevde her at skjermen hadde EGNE --hjm-shadow-*-tokens med en egen
   * lys-blokk. Det var riktig mot problemet P8 så (hardkodet rgba(0,0,0,*)),
   * men det sementerte to feil:
   *
   *  1. Skyggene falt RETT NED (0 18px 40px) mens art bible og resten av
   *     appen lyser fra øvre venstre og kaster mot høyre (3px 14px).
   *     Hovedskjermen motsa lysretningen assetene måles mot.
   *  2. Dybdekontrakten (--dw-depth-*) — skrevet nettopp etter eierfunnet
   *     «den lyse føles flatere enn den mørke» — hadde NULL forbrukere.
   *
   * Kontraktens regel er «strukturen defineres én gang; temaene overstyrer
   * kun fargetokens». Denne testen håndhever nå DEN regelen på skjermen, som
   * er strengere enn den gamle: en egen per-tema skyggeblokk her er ikke
   * lenger tillatt i det hele tatt.
   */
  it('surfaces consume the shared depth contract instead of declaring their own per-theme shadow stacks', async () => {
    const css = await hjemMonterCss();
    const withoutComments = css.replace(/\/\*[\s\S]*?\*\//gu, '');

    // FORUTSETNING: flatene finnes. Uten den ville testen bestå på en tom fil.
    for (const surface of ['.hjm-panel', '.hjm-cta', '.hjm-rows', '.hjm-thumb', '.hjm-prev', '.hjm-strip']) {
      expect(withoutComments, `${surface} mangler i arket`).toContain(`${surface} {`);
    }

    // Hver box-shadow-erklæring må hente høydenivået fra kontrakten. Innfelte
    // topplyskanter (…inset) er tema-konstant lyslogikk og teller ikke som
    // høyde — de får stå som literal.
    const skygger = [...withoutComments.matchAll(/box-shadow:\s*([^;]+);/gu)].map((m) => m[1]!);
    expect(skygger.length, 'ingen box-shadow å måle — porten kan ikke bestå på fravær').toBeGreaterThan(0);
    const utenKontrakt = skygger
      .map((v) => v.split(',').filter((del) => !del.includes('inset')).join(','))
      .filter((v) => /\d+px/u.test(v) && !v.includes('var(--dw-depth-'));
    expect(utenKontrakt, `box-shadow uten dybdekontrakt: ${utenKontrakt.join(' | ')}`).toEqual([]);

    // Ingen egen skyggeblokk per tema i dette arket. Temaflippen skjer i
    // design-tokens-v2.css, håndhevet av design-tokens-v2.depth.test.ts.
    expect(withoutComments).not.toMatch(/--hjm-shadow-/u);
    expect(withoutComments).not.toMatch(/:root\[data-theme="light"\] \.hjem-monter\s*\{/u);

    // Maskoten kan ikke bruke --dw-depth-* (drop-shadow støtter ikke spread),
    // men må hente FARGEN fra de samme tokenene så den flipper med temaet —
    // og kaste mot høyre, ikke rett ned.
    const maskot = css.match(/--hjm-mascot-shadow:([\s\S]*?);/u)?.[1] ?? '';
    expect(maskot, 'maskotskyggen henter ikke farge fra de delte skyggetokenene').toMatch(/var\(--dw-sh-/u);
    expect(maskot, 'maskotskyggen kaster rett ned — art bible krever lys fra øvre venstre')
      .toMatch(/drop-shadow\(\s*[1-9]\d*px/u);
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
