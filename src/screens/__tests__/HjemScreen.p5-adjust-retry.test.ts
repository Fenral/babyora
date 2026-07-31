/**
 * HjemScreen — P5 wiring: the "Juster" drill opener + offline weather retry.
 *
 * Same source-text-verification convention as HjemScreen.flag.test.tsx
 * (HjemScreen pulls in too many stores/hooks for a full render in this
 * repo's jsdom-less test environment).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8').replace(/\r\n/g, '\n');
}

const screenPath = 'src/screens/HjemScreen.tsx';

describe('HjemScreen — P5 onOpenAdjust / onOpenWarmColdGuide threading', () => {
  it('accepts both callbacks as props and forwards them straight into HjemMonter', () => {
    const contents = source(screenPath);
    expect(contents).toContain('onOpenAdjust: (prefill: FinnAntrekkPrefill) => void;');
    expect(contents).toContain('onOpenWarmColdGuide: () => void;');

    const monterCallStart = contents.indexOf('<HjemMonter');
    const monterCallEnd = contents.indexOf('/>', monterCallStart);
    const monterCall = contents.slice(monterCallStart, monterCallEnd);
    expect(monterCall).toContain('onOpenAdjust={onOpenAdjust}');
    expect(monterCall).toContain('onOpenWarmColdGuide={onOpenWarmColdGuide}');
    expect(monterCall).toContain('onRetryWeather={handleRetryWeather}');
  });
});

describe('HjemScreen — P6 onOpenPlaggbib threading', () => {
  it('accepts onOpenPlaggbib as a prop and forwards it straight into HjemMonter', () => {
    const contents = source(screenPath);
    expect(contents).toContain('onOpenPlaggbib: () => void;');

    const monterCallStart = contents.indexOf('<HjemMonter');
    const monterCallEnd = contents.indexOf('/>', monterCallStart);
    const monterCall = contents.slice(monterCallStart, monterCallEnd);
    expect(monterCall).toContain('onOpenPlaggbib={onOpenPlaggbib}');
  });
});

describe('HjemScreen — P5 offline weather retry (refreshKey)', () => {
  it('drives useWeather\'s existing refreshKey param from a bump-only counter, not touching the hook itself', () => {
    const contents = source(screenPath);
    expect(contents).toContain('const [weatherRefreshKey, setWeatherRefreshKey] = useState(0);');
    expect(contents).toContain('const weather = useWeather(lat, lon, 12, weatherRefreshKey, {');
    expect(contents).toContain('const handleRetryWeather = useCallback(() => {');
    expect(contents).toContain('setWeatherRefreshKey((key) => key + 1);');
  });

  it('useWeather itself (src/hooks/useWeather.ts) is not an engine directory and already declared refreshKey — this package only drives it', () => {
    const hook = source('src/hooks/useWeather.ts');
    // The 4th positional param already existed before P5 — proves P5 did not
    // need to (and did not) modify the hook to add refresh support.
    expect(hook).toContain('refreshKey: number = 0,');
    expect(hook).toContain('lat, lon, refHour, refreshKey');
  });
});
