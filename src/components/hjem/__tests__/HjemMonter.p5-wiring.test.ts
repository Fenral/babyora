/**
 * HjemMonter — P5: verifies the previously no-op TODO(P5) stubs are now
 * wired to real handlers. Garment rows now own their detail bottom sheet via
 * ResultSurface; "Vis forrige antrekk" is still an explicit no-op (no
 * existing drill for it yet).
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

  it('keeps ResultSurface free of retired callbacks and passes full authorized alternative groups', () => {
    const contents = source(hjemMonterPath);
    const resultSurfaceStart = contents.indexOf('<ResultSurface');
    const resultSurfaceEnd = contents.indexOf('/>', resultSurfaceStart);
    const call = contents.slice(resultSurfaceStart, resultSurfaceEnd);
    expect(call).not.toContain('onWhy=');
    expect(call).not.toContain('onSwapRow=');
    expect(call).not.toContain('alternativeItemIds=');
    expect(call).toContain('alternativeGroups={alternativeGroups}');
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
  it('derives allowed alternatives only from the authenticated outfit bundle and active language', () => {
    const contents = source(hjemMonterPath);
    expect(contents).toContain('deriveHomeGarmentAlternativeGroups(currentOutfitBundle, activeLanguage)');
    expect(contents).toContain('[activeLanguage, currentOutfitBundle]');
  });

  it('delegates row matching and sheet ownership to ResultSurface without a second alternatives dialog', () => {
    const contents = source(hjemMonterPath);
    expect(contents).not.toContain('handleSwapRow');
    expect(contents).not.toContain('openAlternativeItemId');
    expect(contents).not.toContain('<GarmentAlternativesSheet');
    expect(contents).not.toContain('resolveSwapTarget(row)');
  });
});
