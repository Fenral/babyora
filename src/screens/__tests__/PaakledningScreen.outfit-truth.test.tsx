import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { recommend } from '../../lib/wool-layers/recommend.js';
import type { RecommendInput } from '../../lib/wool-layers/types.js';
import {
  createCurrentOutfitContext,
  createPlannedOutfitContext,
} from '../../lib/planning/planned-outfit-context.js';
import { produceOutfitBundle } from '../../lib/outfit/outfit-bundle-producer.js';

const screenPath = 'src/screens/PaakledningScreen.tsx';
const appPath = 'src/App.tsx';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

function supportedBundle(
  kind: 'current' | 'planned' = 'current',
  accessAllowed = true,
) {
  const input: RecommendInput = {
    weather: {
      tempC: 5,
      feelsLikeC: 4,
      windMs: 1,
      precipMmH: 0,
      humidity: 72,
      symbolCode: 'cloudy',
      uvIndex: 0,
    },
    child: { ageMonths: 10, canRoll: true },
    activity: 'utelek',
    exposureMin: 45,
    innerJakke: false,
    context: { bilstol: false },
    childCalibration: 0,
  };
  const finalizedRecommendation = recommend(input);
  const plannedForIso = '2026-02-12T11:00:00.000Z';
  const garments = finalizedRecommendation.layers
    .filter((layer) => layer.category !== 'utstyr')
    .flatMap((layer) => layer.items);
  const equipment = finalizedRecommendation.layers
    .filter((layer) => layer.category === 'utstyr')
    .flatMap((layer) => layer.items);
  const contextInput = {
    planningEventId: 'paak-screen-current',
    transitionContextId: kind === 'current'
      ? `current-transition:${plannedForIso}:current-finalized:${JSON.stringify([
          garments,
          equipment,
          input.weather.tempC,
          input.weather.feelsLikeC,
          input.weather.windMs,
          input.weather.precipMmH,
          input.weather.symbolCode,
        ])}`
      : `planning-transition:${plannedForIso}:planned-finalized:${JSON.stringify([
          garments,
          equipment,
        ])}`,
    child: { id: 'paak-child', name: 'Ada', ageMonths: input.child.ageMonths },
    plannedForIso,
    timeZone: 'Europe/Oslo',
    place: { label: 'Hjemme', lat: 59.9139, lon: 10.7522, source: 'configured-place' },
    activity: input.activity,
    vognMode: null,
    weather: {
      tempC: input.weather.tempC,
      feelsLikeC: input.weather.feelsLikeC,
      windMs: input.weather.windMs,
      precipMmH: input.weather.precipMmH,
      symbolCode: input.weather.symbolCode ?? 'unknown',
    },
    recommendInput: input,
    finalizedRecommendation,
    access: accessAllowed
      ? { capability: 'today_home' as const, allowed: true, reason: 'free' as const }
      : { capability: 'future_plan' as const, allowed: false, reason: 'expired' as const },
  };
  const context = kind === 'current'
    ? createCurrentOutfitContext(contextInput)
    : createPlannedOutfitContext(contextInput);
  if (context.sourceKind !== 'phase2-outfit-truth') throw new Error('expected real producer context');
  const bundle = produceOutfitBundle({
    seed: context.producerSeed,
    source: kind === 'current'
      ? { kind: 'current', sourceContextId: context.producerSeed.sourceContextId }
      : {
          kind: 'planned',
          sourceContextId: context.producerSeed.sourceContextId,
          planningEventId: context.planningEventId,
          plannedForIso: context.plannedForIso,
        },
  });
  if (bundle.kind !== 'supported') throw new Error('expected real supported producer result');
  return { bundle, context };
}

afterEach(() => {
  vi.doUnmock('../../lib/outfit/feature-flags.js');
  vi.doUnmock('../../components/outfit/OutfitTruthPanel.js');
  vi.resetModules();
});

describe('PaakledningScreen outfit truth integration', () => {
  it('keeps the production bundle branch behind one literal compile-time flag without recomputation', async () => {
    const screen = source(screenPath);
    const flags = source('src/lib/outfit/feature-flags.ts');
    expect(flags).toMatch(
      /OUTFIT_TRUTH_V1_AVAILABLE\s*=\s*(?:false|true)\s+as\s+const/u,
    );
    expect(flags).not.toMatch(
      /localStorage|sessionStorage|import\.meta\.env|URLSearchParams|process\.env/u,
    );
    expect(screen).toContain('OUTFIT_TRUTH_V1_AVAILABLE && outfitBundle !== undefined');
    expect(screen).toContain('if (exactContext)');
    expect(screen).not.toMatch(/produceOutfitBundle\s*\(/u);

    const { bundle, context } = supportedBundle();
    const renderPanel = vi.fn(() => (
      <section data-outfit-truth-panel="mocked">mocked panel</section>
    ));
    vi.doMock('../../lib/outfit/feature-flags.js', () => ({
      OUTFIT_TRUTH_V1_AVAILABLE: false,
    }));
    vi.doMock('../../components/outfit/OutfitTruthPanel.js', () => ({
      OutfitTruthPanel: renderPanel,
    }));
    const { PaakledningScreen } = await import('../PaakledningScreen.js');
    const html = renderToStaticMarkup(
      <PaakledningScreen
        onBack={() => undefined}
        currentContext={context}
        outfitBundle={bundle}
      />,
    );
    expect(renderPanel).not.toHaveBeenCalled();
    expect(html).not.toContain('mocked panel');
  });

  it('forwards an exact real producer result and stable transition props only through the enabled branch', async () => {
    const { bundle, context } = supportedBundle();
    let panelProps: Record<string, unknown> | null = null;
    vi.doMock('../../lib/outfit/feature-flags.js', () => ({
      OUTFIT_TRUTH_V1_AVAILABLE: true,
    }));
    vi.doMock('../../components/outfit/OutfitTruthPanel.js', () => ({
      OutfitTruthPanel: (props: Record<string, unknown>) => {
        panelProps = props;
        return <section data-outfit-truth-panel="mocked">mocked panel</section>;
      },
    }));
    const { PaakledningScreen } = await import('../PaakledningScreen.js');
    const registerOutfitRow = vi.fn();
    const onOpenWarmColdGuide = vi.fn();
    const html = renderToStaticMarkup(
      <PaakledningScreen
        onBack={() => undefined}
        currentContext={context}
        outfitBundle={bundle}
        registerOutfitRow={registerOutfitRow}
        transitionVisualState="settled"
        onOpenWarmColdGuide={onOpenWarmColdGuide}
      />,
    );
    expect(html).toContain('mocked panel');
    expect(panelProps).toMatchObject({
      outfitBundle: bundle,
      registerOutfitRow,
      transitionVisualState: 'settled',
      onOpenWarmColdGuide,
    });
    const capturedPanelProps = panelProps as unknown as Record<string, unknown>;
    expect(capturedPanelProps.outfitBundle).toBe(bundle);
    expect(capturedPanelProps.registerOutfitRow).toBe(registerOutfitRow);
    expect(capturedPanelProps.onOpenWarmColdGuide).toBe(onOpenWarmColdGuide);
  });

  it('keeps the exact current and planned context shell around one enabled panel', async () => {
    const current = supportedBundle('current');
    const planned = supportedBundle('planned');
    vi.doMock('../../lib/outfit/feature-flags.js', () => ({
      OUTFIT_TRUTH_V1_AVAILABLE: true,
    }));
    vi.doMock('../../components/outfit/OutfitTruthPanel.js', () => ({
      OutfitTruthPanel: () => <section className="outfit-truth-panel">panel</section>,
    }));
    const { PaakledningScreen } = await import('../PaakledningScreen.js');
    const currentHtml = renderToStaticMarkup(
      <PaakledningScreen onBack={() => undefined} currentContext={current.context} outfitBundle={current.bundle} />,
    );
    const plannedHtml = renderToStaticMarkup(
      <PaakledningScreen onBack={() => undefined} plannedContext={planned.context} outfitBundle={planned.bundle} />,
    );

    for (const html of [currentHtml, plannedHtml]) {
      expect(html).toContain('aria-labelledby="planned-outfit-title"');
      expect(html).toContain('id="planned-outfit-title"');
      expect(html).toContain('>Ada</h2>');
      expect(html).toContain('Hjemme');
      expect(html).toContain('Utelek');
      expect(html).toContain('10 mnd');
      expect(html).toContain('skyet');
      expect(html).toContain('5°');
      expect(html).toContain('føles som');
      expect(html).toContain('4°');
      expect(html).toContain('Hvorfor dette antrekket?');
      expect(html).toContain('vind på 1 m/s');
      expect(html).toContain('nedbør på 0 mm/t');
      expect(html).toContain('data-outfit-access-capability="today_home"');
      expect(html).not.toContain('planned-garments-title');
      expect(html).not.toContain('Tilgang:');
      expect((html.match(/outfit-truth-panel/g) ?? [])).toHaveLength(1);
    }
    expect(currentHtml).toContain('Dagens antrekk');
    expect(currentHtml).toContain('aria-label="Dagens situasjon"');
    expect(plannedHtml).toContain('Planlagt antrekk');
    expect(plannedHtml).toContain('aria-label="Planlagt situasjon"');
  });

  it('mounts one panel and retains no second garment list in the enabled branch', async () => {
    const { bundle, context } = supportedBundle();
    vi.doMock('../../lib/outfit/feature-flags.js', () => ({
      OUTFIT_TRUTH_V1_AVAILABLE: true,
    }));
    vi.doMock('../../components/outfit/OutfitTruthPanel.js', () => ({
      OutfitTruthPanel: () => (
        <section className="outfit-truth-panel">
          <section className="outfit-list">real panel garment rows</section>
        </section>
      ),
    }));
    const { PaakledningScreen } = await import('../PaakledningScreen.js');
    const html = renderToStaticMarkup(
      <PaakledningScreen onBack={() => undefined} currentContext={context} outfitBundle={bundle} />,
    );
    expect((html.match(/class="outfit-truth-panel/g) ?? [])).toHaveLength(1);
    expect((html.match(/class="outfit-list/g) ?? [])).toHaveLength(1);
    expect(html).not.toContain('planned-garments-title');
    expect(html).not.toContain('sr-only');
    const screen = source(screenPath);
    const gate = screen.indexOf('OUTFIT_TRUTH_V1_AVAILABLE && outfitBundle !== undefined');
    const legacyReturn = screen.indexOf('\n  return (', gate);
    expect((screen.match(/<OutfitTruthPanel/g) ?? [])).toHaveLength(1);
    expect(screen.slice(gate, legacyReturn)).not.toContain('planned-garments-title');
  });

  it('keeps access denial ahead of the enabled exact-bundle branch', async () => {
    const { bundle, context } = supportedBundle('planned', false);
    const renderPanel = vi.fn(() => <section>panel</section>);
    vi.doMock('../../lib/outfit/feature-flags.js', () => ({
      OUTFIT_TRUTH_V1_AVAILABLE: true,
    }));
    vi.doMock('../../components/outfit/OutfitTruthPanel.js', () => ({
      OutfitTruthPanel: renderPanel,
    }));
    const { PaakledningScreen } = await import('../PaakledningScreen.js');
    const html = renderToStaticMarkup(
      <PaakledningScreen onBack={() => undefined} plannedContext={context} outfitBundle={bundle} />,
    );
    expect(renderPanel).not.toHaveBeenCalled();
    expect(html).toContain('Planlagt antrekk er ikke tilgjengelig');
    expect(html).not.toContain('data-outfit-access-capability');
  });

  it('keeps the native dialog close and Escape hooks unconditional before the feature gate', () => {
    const screen = source(screenPath);
    const functionStart = screen.indexOf('function PlannedPaakledningScreen');
    const gate = screen.indexOf('OUTFIT_TRUTH_V1_AVAILABLE && outfitBundle !== undefined', functionStart);
    expect(functionStart).toBeGreaterThanOrEqual(0);
    expect(screen.indexOf('dialog.showModal()', functionStart)).toBeLessThan(gate);
    expect(screen.indexOf("addEventListener('cancel', handleCancel)", functionStart)).toBeLessThan(gate);
    expect(screen.indexOf('if (!plannedContext.access.allowed)', functionStart)).toBeLessThan(gate);
  });

  it('keeps App production propagation event-owned, source-explicit, and free of render recomputation', () => {
    const app = source(appPath);
    expect(app).toContain(
      "import { useOutfitTransitionCoordinator } from './hooks/useOutfitTransitionCoordinator';",
    );
    expect(app).toContain(
      'const outfitTransition = useOutfitTransitionCoordinator();',
    );
    expect(app).toContain(
      'registerOutfitRow={outfitTransition.registerOutfitRow}',
    );
    expect(app).not.toContain('createOutfitRowRegistrationRegistry');
    expect(app).not.toContain('outfitRowRegistry');
    expect(app).toContain("kind: 'current',");
    expect(app).toContain("kind: 'planned',");
    expect(app).toContain('seed: currentContext.producerSeed');
    expect(app).toContain('seed: plannedContext.producerSeed');
    expect(app).toContain('planningEventId: plannedContext.planningEventId');
    expect(app).toContain('plannedForIso: plannedContext.plannedForIso');
    expect(app).toContain('outfitBundle={activeDrill.outfitBundle}');
    expect(app).toContain(
      "transitionSnapshot !== null\n    && transitionPresentation !== null",
    );
    const visualStateProps = app.match(
      /transitionVisualState=\{transitionIsLanding \? 'landing' : 'settled'\}/gu,
    ) ?? [];
    expect(visualStateProps).toHaveLength(2);
    expect(app.match(/transitionVisualState=/gu)).toHaveLength(2);
    expect(app).toContain("outfitTransition.settle('completed')");
    expect(app).toContain("outfitTransition.abort('motion-ineligible')");
    expect(app).toContain("setDrill({ kind: 'familie-tool', target: 'varm-kald' });");
    expect(app).not.toContain('outfitProducerSeed');
    expect((app.match(/produceOutfitBundle\s*\(/gu) ?? [])).toHaveLength(2);
  });
});
