import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import manifestJson from '../../../../public/avatars/verified/index.json?raw';
import { recommend } from '../../../lib/wool-layers/recommend.js';
import { createOutfitTruthSnapshot } from '../../../lib/outfit/outfit-truth.js';
import { bandForTemp } from '../../../lib/wool-layers/tables.js';
import { buildOutfitAlternativeOptions } from '../../../lib/outfit/alternative-options.js';
import type { OutfitBundleProducerResult } from '../../../lib/outfit/outfit-bundle-producer.js';
import { OutfitTruthPanel, resolveSelectedAvatarSnapshot } from '../OutfitTruthPanel.js';
import { VerifiedAvatarComposite } from '../VerifiedAvatarComposite.js';
import { OUTFIT_TRUTH_V1_AVAILABLE } from '../../../lib/outfit/feature-flags.js';
import { useOutfitSelectionStore } from '../../../state/outfit-selection-store.js';

type ManifestRow = Readonly<{
  name: string;
  asset: string;
  pose: 'sitting' | 'standing';
  garments: readonly string[];
}>;

const manifest = JSON.parse(manifestJson) as readonly ManifestRow[];
const sourceLabelByCatalogId: Readonly<Record<string, string>> = Object.freeze({
  'kortermet-body': 'kortermet body',
  solhatt: 'solhatt',
  'langermet-body': 'langermet body',
  'lue-tynn': 'tynn lue',
  'ull-jakke': 'ull-jakke',
  'ull-bukse': 'ull-bukse',
  lue: 'lue',
  kjoredress: 'kjøredress',
  'lue-m-ull': 'lue m/ ull',
  'vinterdress-isolert': 'isolert vinterdress',
  votter: 'votter',
  balaklava: 'balaklava',
  'votter-dun': 'votter dun',
  'vintersko-isolerte': 'vintersko isolerte',
  'regntoy-skall': 'regntøy / skall',
  'vindtett-skall': 'vindtett skall',
  hals: 'halsedisse',
  'vindvotter-skall': 'vindvotter (skall)',
  vintersko: 'vintersko',
});

function snapshot() {
  const input = {
    weather: { feelsLikeC: 4, tempC: 5, windMs: 1, precipMmH: 0 },
    child: { ageMonths: 10 },
    activity: 'utelek',
  } as const;
  const result = createOutfitTruthSnapshot({
    transitionContextId: 'panel-fixture',
    input,
    finalizedRecommendation: recommend(input),
    pose: 'sitting',
  });
  if (result.kind !== 'supported') throw new Error('fixture must be supported');
  return result.snapshot;
}

function snapshotForManifestRow(row: ManifestRow) {
  const input = {
    weather: { feelsLikeC: 10, tempC: 10, windMs: 0, precipMmH: 0 },
    child: { ageMonths: 10 },
    activity: 'utelek',
  } as const;
  const result = createOutfitTruthSnapshot({
    transitionContextId: `manifest-${row.name}`,
    input,
    finalizedRecommendation: {
      activity: input.activity,
      tempBand: bandForTemp(input.weather.feelsLikeC),
      layers: [{
        category: 'innerst',
        items: row.garments.map((id) => sourceLabelByCatalogId[id]!),
      }],
      notes: [],
      structuredNotes: [],
      summary: '',
    },
    pose: row.pose,
  });
  if (result.kind !== 'supported') throw new Error(`manifest fixture must be supported: ${row.name}`);
  return result.snapshot;
}

function supportedBundle(): Extract<OutfitBundleProducerResult, { kind: 'supported' }> {
  return Object.freeze({
    kind: 'supported' as const,
    bundleVersion: 1 as const,
    source: Object.freeze({ kind: 'current' as const, sourceContextId: 'panel-fixture' }),
    weather: Object.freeze({ tempC: 5, feelsLikeC: 4 }),
    base: snapshot(),
    options: Object.freeze([]),
  });
}

function unsupportedBundle(): OutfitBundleProducerResult {
  return Object.freeze({
    kind: 'unsupported-cardinality' as const,
    bundleVersion: 1 as const,
    source: Object.freeze({ kind: 'current' as const, sourceContextId: 'eleven-fixture' }),
    weather: Object.freeze({ tempC: -18, feelsLikeC: -20 }),
    truth: Object.freeze({
      kind: 'unsupported-cardinality' as const,
      reason: 'semantic-garment-count-outside-1-10' as const,
      orderedGarments: Object.freeze(Array.from({ length: 11 }, (_, index) => Object.freeze({
        itemId: `item-${index + 1}` as never,
        sourceLabel: `Plagg ${index + 1}`,
        label: `Plagg ${index + 1}`,
        order: index + 1,
      }))),
      equipment: Object.freeze([Object.freeze({
        itemId: 'equipment-1' as never,
        sourceLabel: 'Varmepose',
        label: 'Varmepose',
        catalogGarmentId: 'varmepose',
        order: 1,
      })]),
    }),
  });
}

function selectableBundle(): Extract<OutfitBundleProducerResult, { kind: 'supported' }> {
  const input = {
    weather: { feelsLikeC: -8, tempC: -5, windMs: 2, precipMmH: 0 },
    child: { ageMonths: 10 },
    activity: 'vogn',
  } as const;
  const alternatives = buildOutfitAlternativeOptions({
    transitionContextId: 'selection-fixture',
    input,
    finalizedRecommendation: recommend(input),
    pose: 'sitting',
  });
  if (alternatives.kind !== 'supported' || alternatives.options.length === 0) {
    throw new Error('selection fixture requires a finalized alternative');
  }
  return Object.freeze({
    kind: 'supported' as const,
    bundleVersion: 1 as const,
    source: Object.freeze({ kind: 'current' as const, sourceContextId: 'selection-fixture' }),
    weather: Object.freeze({ tempC: input.weather.tempC, feelsLikeC: input.weather.feelsLikeC }),
    base: alternatives.base,
    options: alternatives.options,
  });
}

describe('OutfitTruthPanel', () => {
  it('keeps the Phase-2 readiness boundary compile-time false without a bypass', () => {
    expect(OUTFIT_TRUTH_V1_AVAILABLE).toBe(false);
    const source = readFileSync(new URL('../../../lib/outfit/feature-flags.ts', import.meta.url), 'utf8');
    expect(source).toMatch(/OUTFIT_TRUTH_V1_AVAILABLE\s*=\s*false/u);
    expect(source).not.toMatch(/localStorage|sessionStorage|import\.meta\.env|URLSearchParams|process\.env/u);
  });

  it('renders supported factory truth with map, exact ordered rows, temperature axis and recovery callback', () => {
    const bundle = supportedBundle();
    const html = renderToStaticMarkup(<OutfitTruthPanel outfitBundle={bundle} onOpenWarmColdGuide={() => undefined} />);
    expect(html).toContain('data-temp="kald"');
    expect(html).toContain('data-outfit-map-node=');
    expect(html).toContain('Ta på innerst først');
    expect(html).toContain('Kjenn nakken');
    expect(html).toContain('Stikk to fingre under genseren bak i nakken');
    for (const garment of bundle.base.garments) expect(html).toContain(garment.label);
  });

  it('keeps landing semantic content and row lifecycle eligible without hidden layers', () => {
    const bundle = supportedBundle();
    const settled = renderToStaticMarkup(<OutfitTruthPanel outfitBundle={bundle} onOpenWarmColdGuide={() => undefined} />);
    const landing = renderToStaticMarkup(<OutfitTruthPanel outfitBundle={bundle} transitionVisualState="landing" onOpenWarmColdGuide={() => undefined} />);
    expect(landing).toContain('data-transition-visual-state="landing"');
    expect(landing).toContain('data-outfit-row=');
    expect(landing).not.toMatch(/display:none|visibility:hidden|\sinert(?:\s|=|>)/u);
    expect(landing.replace('data-transition-visual-state="landing"', '')).toBe(settled.replace('data-transition-visual-state="settled"', ''));
  });

  it('renders the exact eleven garments and separate equipment list-only without graphical or action claims', () => {
    const bundle = unsupportedBundle();
    const html = renderToStaticMarkup(<OutfitTruthPanel outfitBundle={bundle} onOpenWarmColdGuide={() => undefined} />);
    expect(html).toContain('Ta på innerst først');
    for (let index = 1; index <= 11; index += 1) expect(html).toContain(`Plagg ${index}`);
    expect(html).toContain('Varmepose');
    expect(html).not.toContain('data-outfit-map-node=');
    expect(html).not.toContain('data-outfit-row=');
    expect(html).not.toContain('Se alternativ');
    expect(html).not.toContain('<img');
  });

  it('renders unavailable results as neutral with no advice or injected callback control', () => {
    const bundle: OutfitBundleProducerResult = Object.freeze({ kind: 'unavailable' as const, bundleVersion: 1 as const, reason: 'truth-build-failed' as const });
    const html = renderToStaticMarkup(<OutfitTruthPanel outfitBundle={bundle} onOpenWarmColdGuide={() => undefined} />);
    expect(html).toContain('Antrekksanbefalingen er ikke tilgjengelig');
    expect(html).not.toContain('Ta pÃ¥ innerst fÃ¸rst');
    expect(html).not.toContain('Kjenn nakken');
  });

  it('uses only exact factory snapshot/avatar references for an image and ignores legacy asset overrides', () => {
    const truth = snapshot();
    const trusted = renderToStaticMarkup(<VerifiedAvatarComposite snapshot={truth} avatarTruth={truth.avatar} />);
    const forged = renderToStaticMarkup(<VerifiedAvatarComposite snapshot={truth} avatarTruth={{ ...truth.avatar, verifiedAssetPath: '/forged.png' }} />);
    const legacy = renderToStaticMarkup(<VerifiedAvatarComposite stateKey={{ pose: 'sitting' } as never} outfitSummary="forged summary" assetOverride="/looks-real.png" />);
    if (truth.avatar.verifiedAssetPath === null) expect(trusted).not.toContain('<img');
    else expect(trusted).toContain(`src="${truth.avatar.verifiedAssetPath}"`);
    expect(forged).not.toContain('<img');
    expect(legacy).not.toContain('<img');
    expect(legacy).not.toContain('forged summary');
  });

  it('renders only the exact trusted asset for every manifest result and leaves hidden inner garments unclaimed', () => {
    expect(manifest).toHaveLength(24);
    for (const row of manifest) {
      const truth = snapshotForManifestRow(row);
      expect(truth.avatar.verifiedAssetPath, row.name).toBe(row.asset);
      const html = renderToStaticMarkup(<VerifiedAvatarComposite snapshot={truth} avatarTruth={truth.avatar} />);
      expect(html, row.name).toContain(`src="${row.asset}"`);
      expect(html, row.name).toContain(`data-avatar-snapshot="${truth.snapshotId}"`);
    }

    const hiddenInput = {
      weather: { feelsLikeC: 10, tempC: 10, windMs: 0, precipMmH: 0 },
      child: { ageMonths: 10 },
      activity: 'utelek',
    } as const;
    const hiddenBuild = createOutfitTruthSnapshot({
      transitionContextId: 'hidden-inner',
      input: hiddenInput,
      finalizedRecommendation: {
        activity: hiddenInput.activity,
        tempBand: bandForTemp(hiddenInput.weather.feelsLikeC),
        layers: [{ category: 'innerst', items: ['langermet body', 'kjøredress', 'lue m/ ull'] }],
        notes: [],
        structuredNotes: [],
        summary: '',
      },
      pose: 'standing',
    });
    if (hiddenBuild.kind !== 'supported') throw new Error('hidden-inner fixture must be supported');
    const innerAndOuter = hiddenBuild.snapshot;
    const body = innerAndOuter.garments.find((garment) => garment.catalogGarmentId === 'langermet-body');
    expect(body).toBeDefined();
    expect(innerAndOuter.avatar.visibleGarmentIds).not.toContain(body!.itemId);
    expect(innerAndOuter.avatar.visibleGarmentIds).toHaveLength(2);
  });

  it('follows only an exact read-only selection session and fails closed for foreign or inconsistent sessions', () => {
    const bundle = selectableBundle();
    const option = bundle.options[0]!;
    try {
      useOutfitSelectionStore.getState().close();
      expect(resolveSelectedAvatarSnapshot(bundle.base, bundle.options, useOutfitSelectionStore.getState().session)).toBe(bundle.base);

      expect(useOutfitSelectionStore.getState().open(bundle.base, bundle.options).ok).toBe(true);
      expect(useOutfitSelectionStore.getState().select(option).ok).toBe(true);
      expect(resolveSelectedAvatarSnapshot(bundle.base, bundle.options, useOutfitSelectionStore.getState().session)).toBe(option.outcome);

      expect(useOutfitSelectionStore.getState().reset().ok).toBe(true);
      expect(resolveSelectedAvatarSnapshot(bundle.base, bundle.options, useOutfitSelectionStore.getState().session)).toBe(bundle.base);

      useOutfitSelectionStore.setState({
        session: Object.freeze({
          kind: 'open' as const,
          base: option.outcome,
          options: Object.freeze([]),
          current: option.outcome,
          selectedOptionId: null,
          diagnostics: Object.freeze([]),
        }),
      });
      expect(resolveSelectedAvatarSnapshot(bundle.base, bundle.options, useOutfitSelectionStore.getState().session)).toBe(bundle.base);

      useOutfitSelectionStore.setState({
        session: Object.freeze({
          kind: 'open' as const,
          base: bundle.base,
          options: bundle.options,
          current: bundle.base,
          selectedOptionId: option.optionId,
          diagnostics: Object.freeze([]),
        }),
      });
      expect(resolveSelectedAvatarSnapshot(bundle.base, bundle.options, useOutfitSelectionStore.getState().session)).toBeNull();
    } finally {
      useOutfitSelectionStore.getState().close();
    }
  });

  it('keeps panel ownership and avatar resolver boundaries clean', () => {
    const panel = readFileSync(new URL('../OutfitTruthPanel.tsx', import.meta.url), 'utf8');
    const avatar = readFileSync(new URL('../VerifiedAvatarComposite.tsx', import.meta.url), 'utf8');
    expect(panel).not.toMatch(/from ['"].*\/(?:App|HjemScreen|UkeScreen|PaakledningScreen|navigation)/u);
    expect(panel).not.toMatch(/\.open\(|\.select\(|\.reset\(|\.close\(/u);
    expect(avatar).not.toMatch(/avatarAssetFor|avatarStateKeyId|verifiedAvatarAsset/u);
  });
});
