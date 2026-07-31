import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Guide route migration', () => {
  it('offers only truthful Guide targets and routes Snart through the App dispatcher', () => {
    const guide = source('src/screens/GuideHubScreen.tsx');
    const app = source('src/App.tsx');

    expect(guide).toContain("| 'snart'");
    expect(guide).toContain("target: 'snart'");
    expect(guide).not.toContain("'min-garderobe'");
    expect(guide).not.toMatch(/Min garderobe|Mine plagg/u);
    expect(app).toContain("const onOpenGuideTarget");
    expect(app).toContain("target === 'snart'");
    expect(app).not.toContain('MinGarderobeScreen');
    expect(app).not.toContain("target === 'min-garderobe'");
  });

  it('keeps all eight lesson identities while its CTA labels match real targets', () => {
    const program = source('src/data/vinterprogram.ts');

    expect([...program.matchAll(/^\s+id: '([^']+)',$/gmu)].map((match) => match[1])).toEqual([
      'ull-mot-huden',
      'lag-pa-lag',
      'vind-skjult-faktor',
      'vogn-baeresele-lek',
      'sjekk-nakken',
      'sove-ute-vinter',
      'frost-dager',
      'din-garderobe-din-anbefaling',
    ]);
    expect(program).toContain("tryDet: { label: 'Se ull og bomull i Plaggbiblioteket', target: 'plaggbib' }");
    expect(program).toContain("tryDet: { label: 'Se historiske månedsnormaler', target: 'snart' }");
    expect(program).not.toContain("target: 'min-garderobe'");
    expect(program).not.toMatch(/Mine plagg|egne plagg|personliggjør/u);
  });

  // P1 (nav 4→3 skeleton, 2026-07-30): Guide-tab-roten er fjernet. Denne
  // beskrivelsen dekker hva som erstattet den — GuideHubScreen.tsx består
  // uendret (leksjons-/tryDet-dataene over refererer den fortsatt via
  // GuideHubTarget-typen), men mountes ikke lenger fra tab-navigasjon.
  describe('nav 4→3: Guide-huben er avmontert, ikke slettet', () => {
    it('App.tsx mounter ikke lenger GuideHubScreen fra fanenavigasjon', () => {
      const app = source('src/App.tsx');

      expect(app).not.toMatch(/const GuideHubScreen = lazy/u);
      expect(app).not.toContain('<GuideHubScreen');
      expect(app).not.toContain("tab === 'guide'");
      // Type-only import av GuideHubTarget skal fortsatt stå — VinterprogramScreen
      // og vinterprogram.ts bruker den fortsatt (type-imports trekker ikke kode).
      expect(app).toContain("import type { GuideHubTarget } from './screens/GuideHubScreen';");
    });

    it('Drill-unionen har ingen guide-kind lenger — tog/varm-kald/forste-vinter er familie-tool', () => {
      const app = source('src/App.tsx');

      expect(app).not.toContain("kind: 'guide'");
      expect(app).not.toContain("kind === 'guide'");
      expect(app).toContain("| { kind: 'familie-tool'; target: FamilieToolTarget }");
      // P5: finn-antrekk carries an optional live-weather prefill now (the
      // "Juster" drill, opened from Hjem's result) — the plain guide-target
      // opener below still constructs it without one.
      expect(app).toContain("| { kind: 'finn-antrekk'; prefill?: FinnAntrekkPrefill }");
      expect(app).toContain("| { kind: 'plaggbib' }");
    });

    it('onOpenGuideTarget ruter finn-antrekk/plaggbib til egne drill-kinder, resten til familie-tool', () => {
      const app = source('src/App.tsx');

      expect(app).toContain("setDrill({ kind: 'finn-antrekk' });");
      expect(app).toContain("setDrill({ kind: 'plaggbib' });");
      expect(app).toContain("setDrill({ kind: 'familie-tool', target });");
    });

    it('VinterprogramScreen forblir mountet som familie-tool-drill med samme onOpenTarget-wiring', () => {
      const app = source('src/App.tsx');

      expect(app).toContain("activeDrill?.kind === 'familie-tool' && activeDrill.target === 'forste-vinter'");
      expect(app).toContain('<VinterprogramScreen');
      expect(app).toContain('onOpenTarget={onOpenGuideTarget}');
    });

    it('activeTabForBar mapper familie-tool til familie og finn-antrekk/plaggbib til hjem', () => {
      const app = source('src/App.tsx');

      expect(app).toContain("activeDrill.kind === 'familie-tool'");
      expect(app).toMatch(/activeTabForBar = 'familie';/u);
    });

    it('Familie sin nye Verktøy-seksjon åpner de tre gjenværende Guide-skjermene', () => {
      const tools = source('src/components/family/ToolsSection.tsx');
      const familie = source('src/screens/FamilieScreen.tsx');
      const innstillinger = source('src/screens/InnstillingerScreen.tsx');

      expect(tools).toContain("target: 'tog'");
      expect(tools).toContain("target: 'varm-kald'");
      expect(tools).toContain("target: 'forste-vinter'");
      expect(tools).toContain('onOpenTool(row.target)');
      expect(familie).toContain('onOpenTool');
      expect(innstillinger).toContain('<ToolsSection onOpenTool={onOpenTool} />');
    });

    it('nav.ts sin TabKey-union har ingen guide-medlem lenger', () => {
      const nav = source('src/types/nav.ts');

      expect(nav).toContain("export type TabKey = 'hjem' | 'plan' | 'familie';");
      expect(nav).toContain('FamilieToolTarget');
    });
  });
});
