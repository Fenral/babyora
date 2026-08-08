import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Guide route migration', () => {
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
    expect(program).toContain("tryDet: { label: 'Åpne plaggbiblioteket', target: 'plaggbib' }");
    expect(program).not.toContain("target: 'min-garderobe'");
    expect(program).not.toMatch(/Mine plagg|egne plagg|personliggjør/u);
  });

  /* SLETTET 2026-08-04 pa eiervedtak: «Min garderobe ble spurt om vi skulle
     beholde. Jeg stemmer for a fjerne den.»
     Skjermen var 932 linjer umontert kode med sju defekter av blokkerende
     klasse, og den la som eneste apne punkt i fase 6B. Testen sjekket for at
     den forble UMONTERT; na sjekker den at den er BORTE — samme monster som
     GuideHubScreen fikk i P6. Historikken beholder filen om vi vil hente den
     tilbake. */
  it('MinGarderobeScreen er slettet, ikke bare umontert', () => {
    expect(existsSync(resolve(process.cwd(), 'src/screens/MinGarderobeScreen.tsx'))).toBe(false);
    const app = source('src/App.tsx');
    expect(app).not.toContain('MinGarderobeScreen');
    expect(app).not.toContain("target === 'min-garderobe'");
  });

  // P1 (nav 4→3 skeleton, 2026-07-30) avmonterte GuideHubScreen fra tab-
  // navigasjonen uten å slette filen. P6 (2026-07-31) fullfører retirement-et:
  // filen er nå slettet, og `GuideHubTarget`-typen den eksporterte lever
  // videre som `GuideTarget` i src/types/nav.ts (samme union, nytt hjem).
  describe('P6: Guide-huben er slettet, ikke bare avmontert', () => {
    it('GuideHubScreen.tsx eksisterer ikke lenger', () => {
      expect(existsSync(resolve(process.cwd(), 'src/screens/GuideHubScreen.tsx'))).toBe(false);
    });

    it('ingen kildefil importerer fra det slettede GuideHubScreen-modulet lenger, og GuideHubTarget brukes kun i historikk-kommentarer, aldri som type', () => {
      const app = source('src/App.tsx');
      const vinterprogram = source('src/data/vinterprogram.ts');
      const vinterprogramScreen = source('src/screens/VinterprogramScreen.tsx');

      for (const contents of [app, vinterprogram, vinterprogramScreen]) {
        expect(contents).not.toMatch(/from ['"].*GuideHubScreen['"]/u);
        // GuideHubTarget kan nevnes i forklarende kommentarer (historikk),
        // men skal ALDRI brukes som en faktisk type-annotasjon lenger.
        expect(contents).not.toMatch(/[:<]\s*GuideHubTarget\b/u);
      }
      expect(app).not.toContain('<GuideHubScreen');
      expect(app).not.toContain("tab === 'guide'");
    });

    it('App.tsx / vinterprogram.ts / VinterprogramScreen.tsx bruker GuideTarget fra types/nav.ts i stedet', () => {
      const app = source('src/App.tsx');
      const vinterprogram = source('src/data/vinterprogram.ts');
      const vinterprogramScreen = source('src/screens/VinterprogramScreen.tsx');

      expect(app).toContain("import type { FamilieToolTarget, GuideTarget, TabKey } from './types/nav';");
      expect(vinterprogram).toContain("import type { GuideTarget } from '../types/nav';");
      expect(vinterprogramScreen).toContain("import type { GuideTarget } from '../types/nav';");

      const nav = source('src/types/nav.ts');
      expect(nav).toContain('export type GuideTarget = FamilieToolTarget');
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
      expect(app).toContain("| { kind: 'plaggbib' };");
    });

    it('onOpenGuideTarget ruter finn-antrekk/plaggbib til egne drill-kinder, resten til familie-tool', () => {
      const app = source('src/App.tsx');

      expect(app).toContain('const onOpenGuideTarget = useCallback((target: GuideTarget) => {');
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
