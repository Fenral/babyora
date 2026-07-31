/**
 * HjemMonter — P5: verifies the previously no-op TODO(P5) stubs are now
 * wired to real handlers. "Bytt" (onSwapRow) got its P6 wiring — see the
 * dedicated describe block below; "Vis forrige antrekk" is still an
 * explicit no-op (no existing drill for it yet).
 *
 * Source-text verification (not renderToStaticMarkup + a click): SSR never
 * runs click handlers, and this repo has no jsdom, so "does clicking X call
 * Y" isn't reachable through renderToStaticMarkup regardless of how HjemMonter
 * wires the button — see HjemMonter.test.tsx's own header comment. The data
 * CONTRACT (what buildAdjustPrefill packages, and what resolveSwapTarget
 * decides for "Bytt") is instead covered directly, without rendering, by
 * adjust-prefill.test.ts and swap-row.test.ts respectively.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8').replace(/\r\n/g, '\n');
}

const hjemMonterPath = 'src/components/hjem/HjemMonter.tsx';

describe('HjemMonter — P5 stub wiring', () => {
  it('handleOpenAdjust builds the prefill from (now ?? lastKnownNow) and only calls onOpenAdjust when one exists', () => {
    const contents = source(hjemMonterPath);
    expect(contents).toContain('const adjustSource = now ?? lastKnownNow;');
    expect(contents).toContain('const handleOpenAdjust = useCallback(() => {');
    expect(contents).toContain('const prefill = buildAdjustPrefill(adjustSource, activity, cityLabel);');
    expect(contents).toContain('if (prefill !== null) onOpenAdjust(prefill);');
  });

  it('WeatherStrip\'s Juster button (result-current) is wired to handleOpenAdjust, not the no-op stub', () => {
    const contents = source(hjemMonterPath);
    const stripStart = contents.indexOf('<WeatherStrip');
    const stripEnd = contents.indexOf('/>', stripStart);
    expect(contents.slice(stripStart, stripEnd)).toContain('onAdjust={handleOpenAdjust}');
  });

  it('the weather-ready panel\'s place pill opens the same drill in BOTH sub-branches (normal + offline)', () => {
    const contents = source(hjemMonterPath);
    const onAdjustLocationSites = contents.match(/onAdjustLocation=\{handleOpenAdjust\}/gu) ?? [];
    expect(onAdjustLocationSites.length).toBe(2);
  });

  it('"Hvorfor akkurat dette?" (ResultSurface.onWhy) opens the Varm-eller-kald guide via the same callback PaakledningScreen uses', () => {
    const contents = source(hjemMonterPath);
    const resultSurfaceStart = contents.indexOf('<ResultSurface');
    const resultSurfaceEnd = contents.indexOf('/>', resultSurfaceStart);
    const call = contents.slice(resultSurfaceStart, resultSurfaceEnd);
    expect(call).toContain('onWhy={onOpenWarmColdGuide}');
    // P6: "Bytt" (garment swap) is wired now — see the dedicated describe
    // block below for the full resolveSwapTarget/PlaggDetailSheet wiring.
    expect(call).toContain('onSwapRow={handleSwapRow}');
  });

  it('the offline ask-block\'s "Prøv å hente været igjen" calls the real retry handler', () => {
    const contents = source(hjemMonterPath);
    expect(contents).toContain('<button type="button" className="hjm-cta-ghost" onClick={onRetryWeather}>\n              Prøv å hente været igjen');
  });

  it('"Vis forrige antrekk" (result-stale) is still an explicit stub — no existing drill for it yet', () => {
    const contents = source(hjemMonterPath);
    expect(contents).toContain('<button type="button" className="hjm-cta-ghost" onClick={noopStub}>\n              Vis forrige antrekk');
  });
});

describe('HjemMonter — P6 "Bytt" wiring (garment swap → PlaggDetailSheet, no dead-end)', () => {
  it('handleSwapRow resolves via the pure swap-row decision and opens the detail sheet, capturing the clicked row as the focus-return target', () => {
    const contents = source(hjemMonterPath);
    expect(contents).toContain("import { resolveSwapTarget } from './swap-row.js';");
    expect(contents).toContain("import { PlaggDetailSheet } from '../PlaggDetailSheet.js';");
    expect(contents).toContain('const handleSwapRow = useCallback((row: ResultRow, event: MouseEvent<HTMLButtonElement>) => {');
    expect(contents).toContain('const resolution = resolveSwapTarget(row);');
    expect(contents).toContain('detailTriggerRef.current = event.currentTarget;');
    expect(contents).toContain('setDetailGarmentId(resolution.garmentId);');
  });

  it('falls back to onOpenPlaggbib (never a dead end) when resolveSwapTarget cannot resolve a garmentId', () => {
    const contents = source(hjemMonterPath);
    const handlerStart = contents.indexOf('const handleSwapRow = useCallback');
    const handlerEnd = contents.indexOf('}, [onOpenPlaggbib]);', handlerStart);
    const handler = contents.slice(handlerStart, handlerEnd);
    expect(handler).toContain("if (resolution.kind === 'library') {");
    expect(handler).toContain('onOpenPlaggbib();');
  });

  it('mounts PlaggDetailSheet in the result-current branch, wired to onOpenPlaggbib as the library affordance', () => {
    const contents = source(hjemMonterPath);
    const sheetStart = contents.indexOf('<PlaggDetailSheet');
    const sheetEnd = contents.indexOf('/>', sheetStart);
    const sheetCall = contents.slice(sheetStart, sheetEnd);
    expect(sheetCall).toContain('garmentId={detailGarmentId}');
    expect(sheetCall).toContain('onClose={handleCloseDetail}');
    expect(sheetCall).toContain('onOpenLibrary={onOpenPlaggbib}');
  });
});
