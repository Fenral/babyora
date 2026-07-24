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
  it('renders the four canonical roots in order with exactly one current page', () => {
    const markup = renderToStaticMarkup(
      <BottomTabBar active="plan" onNavigate={vi.fn()} />,
    );

    expect(TAB_DEFS.map(({ label }) => label)).toEqual(['Hjem', 'Planlegg', 'Guide', 'Familie']);
    expect(markup).toMatch(/Hjem.*Planlegg.*Guide.*Familie/u);
    expect((markup.match(/aria-current="page"/gu) ?? [])).toHaveLength(1);
    expect(markup).toContain('aria-current="page"');
    expect(markup).toContain('bottom-tab-bar__indicator');
  });

  it('makes repeat activation a pure no-op', () => {
    expect(decideRootChange('guide', 'guide')).toBeNull();

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
});
