import { renderToStaticMarkup } from 'react-dom/server';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import {
  BottomTabBar,
  decideRootChange,
  dispatchRootChange,
} from '../BottomTabBar.js';
import { TAB_DEFS } from '../../types/nav.js';

describe('BottomTabBar root navigation', () => {
  it('renders the three canonical roots in order with exactly one current page', () => {
    const markup = renderToStaticMarkup(
      <BottomTabBar active="plan" onNavigate={vi.fn()} />,
    );

    expect(TAB_DEFS.map(({ label }) => label)).toEqual(['Hjem', 'Planlegg', 'Familie']);
    expect(markup).toMatch(/Hjem.*Planlegg.*Familie/u);
    expect((markup.match(/aria-current="page"/gu) ?? [])).toHaveLength(1);
    expect(markup).toContain('aria-current="page"');
    expect(markup).toContain('bottom-tab-bar__indicator');
  });

  it('no longer renders a Guide root (P1: nav 4→3 skeleton)', () => {
    const markup = renderToStaticMarkup(
      <BottomTabBar active="hjem" onNavigate={vi.fn()} />,
    );

    expect(markup).not.toMatch(/Guide/u);
  });

  it('makes repeat activation a pure no-op', () => {
    expect(decideRootChange('familie', 'familie')).toBeNull();

    const onNavigate = vi.fn();
    const onCue = vi.fn();
    dispatchRootChange(null, { onNavigate, onCue });

    expect(onNavigate).not.toHaveBeenCalled();
    expect(onCue).not.toHaveBeenCalled();
  });

  it('dispatches one navigation and one selection cue for a genuine root change', () => {
    const onNavigate = vi.fn();
    const onCue = vi.fn();
    const decision = decideRootChange('plan', 'familie');

    dispatchRootChange(decision, { onNavigate, onCue });

    expect(decision).toEqual({ nextRoot: 'familie', cue: 'selection' });
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith('familie');
    expect(onCue).toHaveBeenCalledTimes(1);
    expect(onCue).toHaveBeenCalledWith('selection');
  });

  it('uses a restrained press scale and keeps reduced motion free of transforms', async () => {
    const source = (await import('../BottomTabBar.tsx?raw') as { default: string }).default;

    expect(source).toContain('whileTap={{ scale: 0.97 }}');
    expect(source).toMatch(/if \(reducedMotion\) \{[\s\S]*?<button/su);
    expect(source).not.toMatch(/navigator\.vibrate/u);
  });

  it('keeps geometry and focus behavior in scoped CSS rather than component state', async () => {
    const css = await readFile(fileURLToPath(new URL('../BottomTabBar.css', import.meta.url)), 'utf8');
    const source = (await import('../BottomTabBar.tsx?raw') as { default: string }).default;

    expect(css).toMatch(/min-(?:inline-)?size:\s*44px/u);
    expect(css).toMatch(/min-(?:block-)?size:\s*44px/u);
    expect(css).toMatch(/env\(safe-area-inset-bottom/u);
    expect(css).toMatch(/:focus-visible/u);
    expect(css).toMatch(/outline:\s*3px/u);
    expect(css).toMatch(/@media\s*\(forced-colors:\s*active\)/u);
    expect(source).not.toMatch(/useState|onFocus|onBlur|style=/u);
  });

  it('P8: floats per duel §7 — fixed position, side inset, pill radius, warm shadow, one muted edge-light', async () => {
    const css = await readFile(fileURLToPath(new URL('../BottomTabBar.css', import.meta.url)), 'utf8');

    expect(css).toMatch(/\.bottom-tab-bar\s*\{[^}]*position:\s*fixed/su);
    // ~16px side inset (duel spec), not edge-to-edge.
    expect(css).toMatch(/left:\s*var\(--dw-tabbar-inset/u);
    expect(css).toMatch(/right:\s*var\(--dw-tabbar-inset/u);
    // radius ~28pt.
    expect(css).toMatch(/border-radius:\s*var\(--dw-tabbar-radius,\s*28px\)/u);
    // exactly one edge-light pseudo-element, muted (not hero-strength 0.9-1.0).
    const edgeLightOpacities = [...css.matchAll(/\.bottom-tab-bar::before\s*\{[\s\S]*?opacity:\s*([\d.]+)/gu)];
    expect(edgeLightOpacities).toHaveLength(1);
    expect(Number(edgeLightOpacities[0]![1])).toBeLessThan(0.5);
    // warm low shadow (not a neutral/cool tone).
    expect(css).toMatch(/box-shadow:\s*0\s+18px\s+36px\s+-16px\s+rgba\(20,\s*12,\s*4,/u);
  });

  it('P8: renders with a blur-fallback structure — opaque solid default, translucent+blur behind @supports', async () => {
    const css = await readFile(fileURLToPath(new URL('../BottomTabBar.css', import.meta.url)), 'utf8');

    // Base rule (no @supports) declares the SOLID, non-transparent-reading
    // fallback background before any @supports block appears.
    const baseRuleIndex = css.indexOf('.bottom-tab-bar {');
    const supportsIndex = css.indexOf('@supports');
    expect(baseRuleIndex).toBeGreaterThanOrEqual(0);
    expect(supportsIndex).toBeGreaterThan(baseRuleIndex);
    const baseRule = css.slice(baseRuleIndex, supportsIndex);
    expect(baseRule).toMatch(/background:\s*var\(--dw-tabbar-surface,/u);

    // @supports gate covers both the standard and -webkit- prefixed forms
    // (Safari/iOS still needs the prefix) and upgrades to the translucent +
    // blur(20px) saturate(1.08) surface from the duel spec.
    expect(css).toMatch(
      /@supports\s*\(backdrop-filter:\s*blur\(20px\)\)\s*or\s*\(-webkit-backdrop-filter:\s*blur\(20px\)\)/u,
    );
    const supportsBlock = css.slice(supportsIndex);
    expect(supportsBlock).toMatch(/background:\s*var\(--dw-tabbar-surface-blur,/u);
    expect(supportsBlock).toMatch(/backdrop-filter:\s*blur\(20px\)\s+saturate\(1\.08\)/u);
    expect(supportsBlock).toMatch(/-webkit-backdrop-filter:\s*blur\(20px\)\s+saturate\(1\.08\)/u);
  });

  it('P8: selected tab reads as icon+text+subtle accent-surface pill, never a separate button (no border/box-shadow on the pill)', async () => {
    const css = await readFile(fileURLToPath(new URL('../BottomTabBar.css', import.meta.url)), 'utf8');
    const indicatorRuleMatch = css.match(/\.bottom-tab-bar__indicator\s*\{[^}]*\}/su);

    expect(indicatorRuleMatch).not.toBeNull();
    const indicatorRule = indicatorRuleMatch![0];
    expect(indicatorRule).toMatch(/background:\s*var\(--dw-accent-surface,/u);
    expect(indicatorRule).not.toMatch(/border(?!-radius):/u);
    expect(indicatorRule).not.toMatch(/box-shadow/u);
  });

  it('P8: app shell scroll container carries matching bottom clearance so floated content is never permanently hidden', async () => {
    const tokens = await readFile(
      fileURLToPath(new URL('../../styles/design-tokens-v2.css', import.meta.url)),
      'utf8',
    );
    const shell = await readFile(
      fileURLToPath(new URL('../../styles/design-tokens.css', import.meta.url)),
      'utf8',
    );

    expect(tokens).toMatch(/--dw-tabbar-clearance:\s*calc\(/u);
    expect(shell).toMatch(/\.app-shell > main\s*\{[\s\S]*?padding-bottom:\s*var\(--dw-tabbar-clearance/u);
  });
});
