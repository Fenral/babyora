/**
 * P5 — "Juster" drill navigation (App.tsx wiring) + "no re-scan on return".
 *
 * App.tsx pulls in far too many stores/providers (children, weather, access,
 * subscription, outfit-transition, location-pref …) to fully render in this
 * repo's jsdom-less test environment — same constraint documented in
 * src/screens/__tests__/HjemScreen.flag.test.tsx and guide-routing.test.tsx,
 * which verify wiring via source-text assertions instead. This file follows
 * the same convention for the P5 drill.
 *
 * "Back returns to Hjem's result without retriggering a scan" is proven in
 * two parts, split across the two files that actually own the behaviour:
 *  1. HERE: closing the drill (`setDrill(null)`) never touches `tab` state
 *     (only `onNavigate`/the swipe-back-with-no-drill fallback call setTab,
 *     neither of which fires on this path) — so the tab that was active
 *     when "Juster" was opened (Hjem, since that's the only opener) is
 *     still active afterwards, and HjemScreen/HjemMonter mount fresh.
 *  2. src/components/hjem/__tests__/HjemMonter.test.tsx (P4, unmodified by
 *     P5) + scan-orchestration.test.ts already prove that a fresh HjemMonter
 *     mount consults the persistent scan-cache-store BEFORE ever entering
 *     'scanning': `decideScanEntry` returns `{kind:'show-cached'}` whenever
 *     an EXACT identity match already exists, and HjemMonter's mount effect
 *     (untouched by this package) short-circuits straight to 'result-current'
 *     in that case, never visiting 'scanning'. Since opening/closing the
 *     drill doesn't change childId/date/place/activity, the identity is
 *     unchanged and the slot committed by the original scan is still exact.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8').replace(/\r\n/g, '\n');
}

const appPath = 'src/App.tsx';
const hjemMonterPath = 'src/components/hjem/HjemMonter.tsx';

describe('App.tsx — P5 "Juster" drill wiring', () => {
  it('the Drill union carries an optional live-weather prefill for finn-antrekk', () => {
    const app = source(appPath);
    expect(app).toContain("import type { FinnAntrekkPrefill } from './screens/finn-antrekk-prefill';");
    expect(app).toContain("| { kind: 'finn-antrekk'; prefill?: FinnAntrekkPrefill }");
  });

  it('onOpenAdjust opens the drill carrying the prefill it was given', () => {
    const app = source(appPath);
    expect(app).toContain('const onOpenAdjust = useCallback((prefill: FinnAntrekkPrefill) => {');
    expect(app).toContain("setDrill({ kind: 'finn-antrekk', prefill });");
  });

  it('onOpenAdjust + onOpenWarmColdGuide are threaded down into HjemScreen', () => {
    const app = source(appPath);
    const hjemCallStart = app.indexOf('<HjemScreen');
    const hjemCallEnd = app.indexOf('/>', hjemCallStart);
    const hjemCall = app.slice(hjemCallStart, hjemCallEnd);
    expect(hjemCall).toContain('onOpenAdjust={onOpenAdjust}');
    expect(hjemCall).toContain('onOpenWarmColdGuide={onOpenWarmColdGuide}');
  });

  it('the finn-antrekk route passes the drill\'s prefill through and uses the direction-aware close callback', () => {
    const app = source(appPath);
    const branchStart = app.indexOf("activeDrill?.kind === 'finn-antrekk'");
    const branchEnd = app.indexOf('} else if', branchStart);
    const branch = app.slice(branchStart, branchEnd);
    expect(branch).toContain('<FinnAntrekkScreen onBack={closeDrill} prefill={activeDrill.prefill} />');

    const closeStart = app.indexOf('const closeDrill = useCallback');
    const closeEnd = app.indexOf('// P1:', closeStart);
    const closeCallback = app.slice(closeStart, closeEnd);
    expect(closeCallback).toContain('setRouteDirection(-1);');
    expect(closeCallback).toContain('setDrill(null);');
    expect(closeCallback).not.toContain('setTab(');
  });

  it('closing any drill never calls setTab — only onNavigate (tab bar) and the no-drill swipe-back fallback do', () => {
    const app = source(appPath);
    // Every setTab( call site in the file — there should be exactly the
    // two known, drill-unrelated ones. If another ever appears near
    // setDrill(null), that would mean closing a drill starts forcing tab
    // changes, which could route somewhere OTHER than Hjem's cached result.
    const setTabCallSites = app.match(/setTab\(/gu) ?? [];
    expect(setTabCallSites.length).toBe(2);
  });

  it('finn-antrekk still maps to the "hjem" tab in activeTabForBar (unchanged from P1)', () => {
    const app = source(appPath);
    expect(app).toMatch(/if \(activeDrill === null\) \{\s*\n\s*activeTabForBar = tab;\s*\n\s*\} else if \(activeDrill\.kind === 'familie-tool'\) \{\s*\n\s*activeTabForBar = 'familie';\s*\n\s*\} else \{\s*\n\s*activeTabForBar = 'hjem';/u);
  });
});

describe('HjemMonter.tsx — cache-hit-on-mount logic is untouched by P5 (proves no re-scan on drill return)', () => {
  it('the mount effect still consults decideScanEntry/getSlotForIdentity before ever starting a scan', () => {
    const hjemMonter = source(hjemMonterPath);
    const mountEffectStart = hjemMonter.indexOf('// ── Mount / identitetsendring');
    const mountEffectEnd = hjemMonter.indexOf('const handleFindOutfitTap');
    const mountEffect = hjemMonter.slice(mountEffectStart, mountEffectEnd);
    expect(mountEffect).toContain('const exact = getSlotForIdentity(slots, identity);');
    expect(mountEffect).toContain('const decision = decideScanEntry(exact);');
    expect(mountEffect).toContain("if (decision.kind === 'show-cached') {");
    expect(mountEffect).toContain('scan.scanStarted(identity);');
    expect(mountEffect).toContain('scan.scanCompleted(decision.resultKey);');
  });
});
