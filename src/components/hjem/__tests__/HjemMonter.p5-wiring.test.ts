/**
 * HjemMonter — P5: verifies the previously no-op TODO(P5) stubs are now
 * wired to real handlers, and that the two left for later (P6+) — "Bytt"
 * (onSwapRow) and "Vis forrige antrekk" — are still explicit no-ops rather
 * than silently broken.
 *
 * Source-text verification (not renderToStaticMarkup + a click): SSR never
 * runs click handlers, and this repo has no jsdom, so "does clicking X call
 * Y" isn't reachable through renderToStaticMarkup regardless of how HjemMonter
 * wires the button — see HjemMonter.test.tsx's own header comment. The data
 * CONTRACT (what buildAdjustPrefill packages) is instead covered directly,
 * without rendering, by adjust-prefill.test.ts.
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
    // "Bytt" (garment swap) has no existing drill to trivially wire to —
    // stays a stub per the P5 task scope.
    expect(call).toContain('onSwapRow={noopStub}');
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
