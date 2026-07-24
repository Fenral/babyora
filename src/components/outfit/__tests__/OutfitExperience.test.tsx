import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { recommend } from '../../../lib/wool-layers/recommend.js';
import type { OutfitAlternativeOptionV1 } from '../../../lib/outfit/alternative-options.js';
import { createOutfitTruthSnapshot } from '../../../lib/outfit/outfit-truth.js';
import { useOutfitSelectionStore } from '../../../state/outfit-selection-store.js';
import {
  attachComparisonEscapeListener,
  createComparisonFocusLifecycle,
  type ComparisonEscapeTarget,
  OutfitExperience,
} from '../OutfitExperience.js';

function snapshot() {
  const input = { weather: { feelsLikeC: 4, tempC: 5, windMs: 1, precipMmH: 0 }, child: { ageMonths: 18 }, activity: 'utelek' } as const;
  const result = createOutfitTruthSnapshot({ transitionContextId: 'component-test', input, finalizedRecommendation: recommend(input), pose: 'standing' });
  if (result.kind !== 'supported') throw new Error('fixture must be supported');
  return result.snapshot;
}

function relativeLuminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function wcagContrast(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function escapeTarget() {
  const listeners = new Set<(event: KeyboardEvent) => void>();
  const target: ComparisonEscapeTarget = {
    addEventListener(type, listener) {
      if (type === 'keydown') listeners.add(listener);
    },
    removeEventListener(type, listener) {
      if (type === 'keydown') listeners.delete(listener);
    },
  };
  return {
    target,
    listenerCount: () => listeners.size,
    dispatch(key: string) {
      for (const listener of [...listeners]) {
        listener({ key } as KeyboardEvent);
      }
    },
  };
}

describe('OutfitExperience', () => {
  it('renders every garment once as an accessible numbered map node and once as ordered text', () => {
    const truth = snapshot();
    const html = renderToStaticMarkup(<OutfitExperience snapshot={truth} temp="mild" />);
    expect(html).toContain('Ta på innerst først');
    expect((html.match(/data-outfit-map-node=/g) ?? []).length).toBe(truth.garments.length);
    expect((html.match(/data-outfit-row=/g) ?? []).length).toBe(truth.garments.length);
    expect((html.match(/data-outfit-connector=/g) ?? []).length).toBe(truth.garments.length);
    expect(html).toContain('aria-pressed="false"');
  });

  it('fails closed before exposing rejected or hostile alternative props', () => {
    const truth = snapshot();
    useOutfitSelectionStore.getState().close();
    const rejected = Object.freeze([
      Object.freeze({ sourceItemId: truth.garments[0]!.itemId }),
    ]) as unknown as readonly OutfitAlternativeOptionV1[];
    const hostile = new Proxy([], {
      get() {
        throw new Error('untrusted options must not be reflected by render');
      },
    }) as unknown as readonly OutfitAlternativeOptionV1[];

    const rejectedHtml = renderToStaticMarkup(
      <OutfitExperience snapshot={truth} options={rejected} temp="mild" />,
    );
    expect(rejectedHtml).not.toContain('Se alternativ');
    expect(() =>
      renderToStaticMarkup(
        <OutfitExperience snapshot={truth} options={hostile} temp="mild" />,
      ),
    ).not.toThrow();
  });

  it('uses truthful non-modal dialog semantics for the inline comparison', () => {
    const source = readFileSync(
      new URL('../OutfitExperience.tsx', import.meta.url),
      'utf8',
    );
    expect(source).toContain('<dialog');
    expect(source).not.toContain('aria-modal="true"');
    expect(source).not.toContain('role="dialog"');
  });

  it('renders the conservative 320px/200% layout geometry without a fixed 560px rail', () => {
    const truth = snapshot();
    const html = renderToStaticMarkup(
      <OutfitExperience snapshot={truth} temp="mild" />,
    );
    expect(html).toContain('data-outfit-layout-width="320"');
    expect(html).toContain('data-outfit-text-scale="2"');
    expect(html).toMatch(/aspect-ratio:320\s*\/\s*\d+/);
    const source = readFileSync(
      new URL('../Antrekkskart.tsx', import.meta.url),
      'utf8',
    );
    expect(source).not.toContain('layoutOutfitMap(snapshot, 560)');
  });

  it('restores the comparison origin once and makes every later close idempotent', () => {
    let focusCount = 0;
    const lifecycle = createComparisonFocusLifecycle();
    const origin = {
      isConnected: true,
      focus() {
        focusCount += 1;
      },
    };

    lifecycle.open(origin);
    expect(lifecycle.isOpen()).toBe(true);
    expect(lifecycle.close({ restoreFocus: true })).toBe(true);
    expect(focusCount).toBe(1);
    expect(lifecycle.isOpen()).toBe(false);

    expect(lifecycle.close({ restoreFocus: true })).toBe(false);
    expect(focusCount).toBe(1);

    lifecycle.open(origin);
    expect(lifecycle.close({ restoreFocus: false })).toBe(true);
    expect(lifecycle.close({ restoreFocus: true })).toBe(false);
    expect(focusCount).toBe(1);
  });

  it('listens for Escape only while comparison is open and cannot steal focus later', () => {
    let focusCount = 0;
    const lifecycle = createComparisonFocusLifecycle();
    const keys = escapeTarget();
    const origin = {
      isConnected: true,
      focus() {
        focusCount += 1;
      },
    };

    const detachClosed = attachComparisonEscapeListener(
      keys.target,
      false,
      () => lifecycle.close({ restoreFocus: true }),
    );
    expect(keys.listenerCount()).toBe(0);
    detachClosed();

    lifecycle.open(origin);
    const detachOpen = attachComparisonEscapeListener(
      keys.target,
      lifecycle.isOpen(),
      () => lifecycle.close({ restoreFocus: true }),
    );
    expect(keys.listenerCount()).toBe(1);

    keys.dispatch('Enter');
    expect(focusCount).toBe(0);
    keys.dispatch('Escape');
    expect(focusCount).toBe(1);
    expect(lifecycle.isOpen()).toBe(false);

    detachOpen();
    expect(keys.listenerCount()).toBe(0);
    keys.dispatch('Escape');
    expect(focusCount).toBe(1);
  });

  it('drops detached and unmounted comparison origins without focusing them', () => {
    let focusCount = 0;
    const lifecycle = createComparisonFocusLifecycle();
    const detached = {
      isConnected: false,
      focus() {
        focusCount += 1;
      },
    };
    const connected = {
      isConnected: true,
      focus() {
        focusCount += 1;
      },
    };

    lifecycle.open(detached);
    expect(lifecycle.close({ restoreFocus: true })).toBe(true);
    expect(focusCount).toBe(0);

    lifecycle.open(connected);
    lifecycle.clear();
    expect(lifecycle.close({ restoreFocus: true })).toBe(false);
    expect(focusCount).toBe(0);
  });

  it('keeps every local dark connector variable above 3:1 and forced colors intact', () => {
    const css = readFileSync(
      new URL('../Antrekkskart.css', import.meta.url),
      'utf8',
    );
    const darkMatrix = [
      ['mild', '#c6c5d8', '#1a1828'],
      ['kald', '#79b1e0', '#131a2d'],
      ['varm', '#ff987e', '#251724'],
    ] as const;

    for (const [temperature, connector, canvas] of darkMatrix) {
      expect(
        wcagContrast(connector, canvas),
        `${temperature} dark connector contrast`,
      ).toBeGreaterThanOrEqual(3);
      expect(css).toContain(`--outfit-connector-dark-${temperature}: ${connector}`);
    }

    expect(css).toContain(
      ':root[data-theme="dark"] .outfit-experience',
    );
    expect(css).toContain(
      ':root:not([data-theme="light"]) .outfit-experience',
    );
    expect(css).toMatch(
      /@media \(forced-colors: active\)[\s\S]*stroke: ButtonText;[\s\S]*stroke: Highlight;/,
    );
  });
});
