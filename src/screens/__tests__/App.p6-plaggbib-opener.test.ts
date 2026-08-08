/**
 * P6 — the Plaggbibliotek drill finally gets an opener.
 *
 * App.tsx pulls in too many stores/providers to fully render in this repo's
 * jsdom-less test environment — same constraint as guide-routing.test.tsx
 * and App.finn-antrekk-drill.test.ts, which verify wiring via source-text
 * assertions instead. This file follows the same convention.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8').replace(/\r\n/g, '\n');
}

const appPath = 'src/App.tsx';

describe('App.tsx — P6 "onOpenPlaggbib" wiring', () => {
  it('defines onOpenPlaggbib as a dedicated opener (same replace-in-place pattern as onOpenWarmColdGuide)', () => {
    const app = source(appPath);
    expect(app).toContain('const onOpenPlaggbib = useCallback(() => {');
    expect(app).toContain("setDrill({ kind: 'plaggbib' });");
  });

  it('is threaded into HjemScreen', () => {
    const app = source(appPath);
    const hjemCallStart = app.indexOf('<HjemScreen');
    const hjemCallEnd = app.indexOf('/>', hjemCallStart);
    const hjemCall = app.slice(hjemCallStart, hjemCallEnd);
    expect(hjemCall).toContain('onOpenPlaggbib={onOpenPlaggbib}');
  });

  // NOT threaded into PaakledningScreen: its live branch
  // (PlannedPaakledningScreen) renders no PlaggDetailSheet at all — planned/
  // current outfits' alternative-picking UI is OutfitExperience's "Se
  // alternativer" (engine-connected, src/lib/outfit, a deliberately separate
  // committed-swap flow). PaakledningScreen's own PlaggDetailSheet instance
  // lives only in CurrentPaakledningScreen, which is dead code (every caller
  // supplies currentContext/plannedContext, so the wrapper always renders
  // PlannedPaakledningScreen instead — see PaakledningScreen.dead-code.test.ts).
  it('is used exactly once — only HjemScreen has a live PlaggDetailSheet reachable from it', () => {
    const app = source(appPath);
    const plaggbibSites = app.match(/onOpenPlaggbib=\{onOpenPlaggbib\}/gu) ?? [];
    expect(plaggbibSites.length).toBe(1);
    expect(app).not.toMatch(/<PaakledningScreen[\s\S]*?onOpenPlaggbib/u);
  });

  it('closing any drill still never calls setTab (onOpenPlaggbib follows the same setDrill-only pattern)', () => {
    const app = source(appPath);
    const setTabCallSites = app.match(/setTab\(/gu) ?? [];
    expect(setTabCallSites.length).toBe(2);
    const closeCallback = app.slice(
      app.indexOf('const closeDrill = useCallback'),
      app.indexOf('// P1:', app.indexOf('const closeDrill = useCallback')),
    );
    expect(closeCallback).toContain('setDrill(null);');
    expect(closeCallback).not.toContain('setTab(');
  });
});
