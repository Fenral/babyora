import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import type { ComponentType } from 'react';
import { describe, expect, it } from 'vitest';
import { recommend } from '../../../lib/wool-layers/recommend.js';
import {
  buildOutfitAlternativeOptions,
  type OutfitAlternativeOptionV1,
} from '../../../lib/outfit/alternative-options.js';
import { createOutfitTruthSnapshot } from '../../../lib/outfit/outfit-truth.js';
import { useOutfitSelectionStore } from '../../../state/outfit-selection-store.js';
import {
  attachOutfitEscapeListener,
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

const LONGEST_INVENTORY_GARMENT_LABEL =
  'tykke ullsokker (vinterdress dekker)';

function longestInventoryLabelSnapshot() {
  const input = {
    weather: {
      feelsLikeC: -21,
      tempC: -17,
      windMs: 2,
      precipMmH: 0,
    },
    child: { ageMonths: 10 },
    activity: 'utelek',
  } as const;
  const result = createOutfitTruthSnapshot({
    transitionContextId: 'component-longest-inventory-label',
    input,
    finalizedRecommendation: recommend(input),
    pose: 'sitting',
  });
  if (result.kind !== 'supported') {
    throw new Error('longest-label fixture must be supported');
  }
  if (
    !result.snapshot.garments.some(
      (garment) => garment.label === LONGEST_INVENTORY_GARMENT_LABEL,
    )
  ) {
    throw new Error('fixture must contain the longest inventory garment label');
  }
  return result.snapshot;
}

type ComparisonDialogProps = Readonly<{
  option: OutfitAlternativeOptionV1;
  sourceLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}>;

async function comparisonDialogComponent() {
  const module = await import('../OutfitExperience.js');
  return (
    module as unknown as {
      OutfitComparisonDialog?: ComponentType<ComparisonDialogProps>;
    }
  ).OutfitComparisonDialog;
}

function finalizedComparisonFixture(
  input: Parameters<typeof recommend>[0],
  equipment: 'present' | 'empty',
) {
  const result = buildOutfitAlternativeOptions({
    transitionContextId: `component-comparison-${equipment}`,
    input,
    finalizedRecommendation: recommend(input),
    pose: input.child.ageMonths < 12 ? 'sitting' : 'standing',
  });
  if (result.kind !== 'supported') {
    throw new Error(`comparison fixture must be supported: ${result.kind}`);
  }
  const option = result.options.find((candidate) =>
    equipment === 'present'
      ? candidate.outcome.equipment.length > 0
      : candidate.outcome.equipment.length === 0,
  );
  if (option === undefined) {
    throw new Error(`comparison fixture needs ${equipment} equipment`);
  }
  const source = result.base.garments.find(
    (garment) => garment.itemId === option.sourceItemId,
  );
  if (source === undefined) {
    throw new Error('comparison source must belong to the finalized base');
  }
  return { option, sourceLabel: source.label };
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

  it('shows the complete finalized vogn outcome, including equipment, before confirmation', async () => {
    const fixture = finalizedComparisonFixture({
      weather: {
        feelsLikeC: -8,
        tempC: -5,
        windMs: 2,
        precipMmH: 0,
      },
      child: { ageMonths: 10 },
      activity: 'vogn',
    }, 'present');
    const ComparisonDialog = await comparisonDialogComponent();
    expect(ComparisonDialog).toBeTypeOf('function');
    if (ComparisonDialog === undefined) return;

    const html = renderToStaticMarkup(
      <ComparisonDialog
        option={fixture.option}
        sourceLabel={fixture.sourceLabel}
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />,
    );
    const garmentListAt = html.indexOf(
      'data-outfit-comparison-garments',
    );
    const equipmentListAt = html.indexOf(
      'data-outfit-comparison-equipment',
    );
    const confirmationAt = html.indexOf('Velg dette antrekket');

    expect(fixture.option.outcome.equipment.length).toBeGreaterThan(0);
    expect(garmentListAt).toBeGreaterThan(-1);
    expect(equipmentListAt).toBeGreaterThan(garmentListAt);
    expect(confirmationAt).toBeGreaterThan(equipmentListAt);
    expect(html).toMatch(
      /<ol[^>]*data-outfit-comparison-garments/,
    );
    expect(html).toMatch(
      /<h4[^>]*>Utstyr<\/h4><ul[^>]*data-outfit-comparison-equipment/,
    );

    for (const garment of fixture.option.outcome.garments) {
      const labelAt = html.indexOf(garment.label, garmentListAt);
      expect(labelAt, garment.label).toBeGreaterThan(garmentListAt);
      expect(labelAt, garment.label).toBeLessThan(equipmentListAt);
    }
    for (const equipment of fixture.option.outcome.equipment) {
      const labelAt = html.indexOf(equipment.label, equipmentListAt);
      expect(labelAt, equipment.label).toBeGreaterThan(equipmentListAt);
      expect(labelAt, equipment.label).toBeLessThan(confirmationAt);
    }
  });

  it('omits the equipment section instead of rendering an empty placeholder', async () => {
    const fixture = finalizedComparisonFixture({
      weather: {
        feelsLikeC: -12,
        tempC: -10,
        windMs: 2,
        precipMmH: 0,
      },
      child: { ageMonths: 10 },
      activity: 'utelek',
    }, 'empty');
    const ComparisonDialog = await comparisonDialogComponent();
    expect(ComparisonDialog).toBeTypeOf('function');
    if (ComparisonDialog === undefined) return;

    const html = renderToStaticMarkup(
      <ComparisonDialog
        option={fixture.option}
        sourceLabel={fixture.sourceLabel}
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />,
    );

    expect(fixture.option.outcome.equipment).toHaveLength(0);
    expect(html).not.toContain('data-outfit-comparison-equipment');
    expect(html).not.toMatch(/<h4[^>]*>Utstyr<\/h4>/);
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

  it('keeps the longest inventory row intrinsically wrappable at 560px and 200% text', () => {
    const truth = longestInventoryLabelSnapshot();
    const html = renderToStaticMarkup(
      <OutfitExperience snapshot={truth} temp="kald" />,
    );
    const css = readFileSync(
      new URL('../Antrekkskart.css', import.meta.url),
      'utf8',
    );

    expect(html).toContain(
      `<span class="outfit-row__label">${LONGEST_INVENTORY_GARMENT_LABEL}</span>`,
    );
    expect(css).toMatch(
      /\.outfit-row\s*\{[^}]*min-inline-size:\s*0;[^}]*flex-wrap:\s*wrap;/,
    );
    expect(css).toMatch(
      /\.outfit-row\s*\{[^}]*box-sizing:\s*border-box;/,
    );
    expect(css).toMatch(
      /\.outfit-row__label\s*\{[^}]*min-inline-size:\s*0;[^}]*overflow-wrap:\s*anywhere;/,
    );
    expect(css).toMatch(
      /\.outfit-row__detail\s*\{[^}]*min-inline-size:\s*0;[^}]*overflow-wrap:\s*anywhere;/,
    );
    expect(css).not.toContain('(min-resolution: 1.9dppx)');
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

  it('handles Escape without a dialog by clearing transient state and preserving selection', () => {
    const truth = snapshot();
    const lifecycle = createComparisonFocusLifecycle();
    const keys = escapeTarget();
    const selectedId = truth.garments[0]!.itemId;
    let focusId: typeof selectedId | null = truth.garments[1]!.itemId;
    let hoverId: typeof selectedId | null = truth.garments[2]!.itemId;

    const detach = attachOutfitEscapeListener(
      keys.target,
      () => {
        focusId = null;
        hoverId = null;
        lifecycle.close({ restoreFocus: true });
      },
    );

    expect(keys.listenerCount()).toBe(1);
    keys.dispatch('Escape');
    expect(focusId).toBeNull();
    expect(hoverId).toBeNull();
    expect(selectedId).toBe(truth.garments[0]!.itemId);
    expect(lifecycle.isOpen()).toBe(false);

    detach();
    expect(keys.listenerCount()).toBe(0);
  });

  it('closes an open comparison on Escape and cannot steal focus later', () => {
    let focusCount = 0;
    const lifecycle = createComparisonFocusLifecycle();
    const keys = escapeTarget();
    const origin = {
      isConnected: true,
      focus() {
        focusCount += 1;
      },
    };

    lifecycle.open(origin);
    const detachOpen = attachOutfitEscapeListener(
      keys.target,
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

  it('uses the current ink token for AA map-status text on every light temperature canvas', () => {
    const css = readFileSync(
      new URL('../Antrekkskart.css', import.meta.url),
      'utf8',
    );
    const tokens = readFileSync(
      new URL('../../../styles/design-tokens.css', import.meta.url),
      'utf8',
    );
    const ink700 = tokens.match(
      /:root\s*\{[\s\S]*?--ink-700:\s*(#[0-9a-f]{6});/i,
    )?.[1];
    const canvases = [
      [
        'mild',
        tokens.match(
          /:root\s*\{[\s\S]*?--bg-canvas:\s*(#[0-9a-f]{6});/i,
        )?.[1],
      ],
      [
        'kald',
        tokens.match(
          /\.ba-temp-root\[data-temp="kald"\]\s*\{[\s\S]*?--bg-canvas:\s*(#[0-9a-f]{6});/i,
        )?.[1],
      ],
      [
        'varm',
        tokens.match(
          /\.ba-temp-root\[data-temp="varm"\]\s*\{[\s\S]*?--bg-canvas:\s*(#[0-9a-f]{6});/i,
        )?.[1],
      ],
    ] as const;

    expect(css).toMatch(
      /\.outfit-map-status\s*\{\s*color:\s*var\(--ink-700\);\s*\}/,
    );
    expect(ink700).toBeDefined();
    for (const [temperature, canvas] of canvases) {
      expect(canvas, `${temperature} light canvas token`).toBeDefined();
      expect(
        wcagContrast(ink700!, canvas!),
        `${temperature} light map-status contrast`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});
