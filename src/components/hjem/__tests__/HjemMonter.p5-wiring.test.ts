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

  it('the weather-ready panel\'s place pill opens the same drill in every sub-branch that renders it (normal + offline — eier-override v3 retired the micropass sub-branch that used to be the third)', () => {
    const contents = source(hjemMonterPath);
    const onAdjustLocationSites = contents.match(/onAdjustLocation=\{handleOpenAdjust\}/gu) ?? [];
    expect(onAdjustLocationSites.length).toBe(2);
  });

  it('keeps ResultSurface free of the retired global why callback and passes the authorized alternative IDs', () => {
    const contents = source(hjemMonterPath);
    const resultSurfaceStart = contents.indexOf('<ResultSurface');
    const resultSurfaceEnd = contents.indexOf('/>', resultSurfaceStart);
    const call = contents.slice(resultSurfaceStart, resultSurfaceEnd);
    expect(call).not.toContain('onWhy=');
    expect(call).toContain('onSwapRow={handleSwapRow}');
    expect(call).toContain('alternativeItemIds={alternativeItemIds}');
  });

  it('the offline ask-block\'s "Prøv å hente været igjen" calls the real retry handler', () => {
    const contents = source(hjemMonterPath);
    expect(contents).toContain('<button type="button" className="hjm-cta-ghost" onClick={onRetryWeather}>\n              {copy.weather.retry}');
  });

  it('"Vis forrige antrekk" (result-stale) is still an explicit stub — no existing drill for it yet', () => {
    const contents = source(hjemMonterPath);
    expect(contents).toContain('<button type="button" className="hjm-cta-ghost" onClick={noopStub}>\n              {copy.stale.showPrevious}');
  });
});

describe('HjemMonter — authorized garment alternatives', () => {
  it('derives allowed alternatives only from the authenticated outfit bundle', () => {
    const contents = source(hjemMonterPath);
    expect(contents).toContain('deriveHomeGarmentAlternativeGroups(currentOutfitBundle, activeLanguage)');
    expect(contents).toContain('new Set(alternativeGroups.map((group) => group.source.itemId))');
  });

  it('fails closed for legacy, unapproved and equipment rows before opening the sheet', () => {
    const contents = source(hjemMonterPath);
    const handlerStart = contents.indexOf('const handleSwapRow = useCallback');
    const handlerEnd = contents.indexOf('}, [alternativeItemIds]);', handlerStart);
    const handler = contents.slice(handlerStart, handlerEnd);
    expect(handler).toContain('if (row.outfitItemId === null || !alternativeItemIds.has(row.outfitItemId)) return;');
    expect(handler).toContain('setOpenAlternativeItemId(row.outfitItemId);');
    expect(handler).not.toContain('onOpenPlaggbib');
    expect(contents).not.toContain('resolveSwapTarget(row)');
  });

  it('mounts the dedicated Alternatives sheet and returns focus to the authorized trigger', () => {
    const contents = source(hjemMonterPath);
    const sheetStart = contents.indexOf('<GarmentAlternativesSheet');
    const sheetEnd = contents.indexOf('/>', sheetStart);
    const sheetCall = contents.slice(sheetStart, sheetEnd);
    expect(sheetCall).toContain('group={openAlternativeGroup}');
    expect(sheetCall).toContain('isOpen={openAlternativeGroup !== null}');
    expect(sheetCall).toContain('onClose={handleCloseAlternatives}');
    expect(sheetCall).toContain('triggerRef={alternativeTriggerRef}');
  });
});
