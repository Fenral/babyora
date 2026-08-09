import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { auditRuntimeRecommendationTruth } from '../runtime-truth-audit.js';
import { recommend } from '../recommend.js';
import { canonicalRecommendationDecision } from '../consistency-contract.js';
import {
  canonicalizeSurfaceRecommendInput,
  recommendForFindSurface,
  recommendForHomeSurface,
  recommendForPlanSurface,
  recommendForTogSurface,
  type SurfaceRecommendInput,
} from '../surface-recommendation.js';

function productionSources(): Record<string, string> {
  const root = resolve(process.cwd(), 'src');
  const result: Record<string, string> = {};
  const visit = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const absolute = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '__tests__') continue;
        visit(absolute);
        continue;
      }
      if (!/\.(?:ts|tsx)$/u.test(entry.name) || /\.test\./u.test(entry.name)) continue;
      const path = relative(root, absolute).replaceAll('\\', '/');
      result[path] = readFileSync(absolute, 'utf8');
    }
  };
  visit(root);
  return result;
}

describe('runtime recommendation truth gate', () => {
  it('accepts current production sources only when all recommendation surfaces converge', () => {
    expect(auditRuntimeRecommendationTruth(productionSources())).toEqual([]);
  });

  it('proves the gate catches deliberate source-level drift without editing production', () => {
    const sources = productionSources();
    const home = String(sources['screens/HjemScreen.tsx']);
    const plan = String(sources['screens/UkeScreen.tsx']);
    const find = String(sources['screens/FinnAntrekkScreen.tsx']);
    const malformed = {
      ...sources,
      'screens/HjemScreen.tsx': `import { recommendV2 as hiddenEngine } from '../lib/clothing-engine-v2/recommend';\nhiddenEngine({});\n${home}`,
      'screens/UkeScreen.tsx': `${plan}\nconst drift = { vognMode: 'sleeping' };`,
      'screens/FinnAntrekkScreen.tsx': `import { recommend as bypass } from '../lib/wool-layers/recommend';\n${find.replaceAll('recommendForFindSurface', 'notTheAdapter')}\nvoid bypass;`,
      'screens/TogGuideScreen.tsx': `${sources['screens/TogGuideScreen.tsx']}\nfunction tempToTog() { return null; }`,
    };

    const codes = auditRuntimeRecommendationTruth(malformed).map((issue) => issue.code);
    expect(codes).toContain('runtime-v2-call');
    expect(codes).toContain('production-stroller-sleeping');
    expect(codes).toContain('surface-direct-engine-call');
    expect(codes).toContain('surface-adapter-missing');
    expect(codes).toContain('tog-secondary-table');
  });

  it('rejects direct-engine bypasses added outside the registered surface list', () => {
    const malformed = {
      ...productionSources(),
      'screens/HiddenRecommendationScreen.tsx': [
        "import { recommend as hiddenEngine } from '../lib/wool-layers';",
        'export const hiddenResult = hiddenEngine;',
      ].join('\n'),
      'lib/presentation/hidden-recommendation-helper.ts': [
        "export { recommend as hiddenHelper } from '../wool-layers/recommend.js';",
      ].join('\n'),
    };

    const directIssues = auditRuntimeRecommendationTruth(malformed)
      .filter((issue) => issue.code === 'surface-direct-engine-call')
      .map((issue) => issue.path);
    expect(directIssues).toEqual(expect.arrayContaining([
      'screens/HiddenRecommendationScreen.tsx',
      'lib/presentation/hidden-recommendation-helper.ts',
    ]));
  });

  it('canonicalizes every authorized surface input through the active engine', () => {
    const input: SurfaceRecommendInput = {
      weather: { tempC: 4, feelsLikeC: 2, windMs: 3, precipMmH: 0 },
      child: { ageMonths: 8 },
      activity: 'vogn',
      materialPreference: 'prefer_fleece',
      vognMode: 'awake',
    };
    const canonical = canonicalizeSurfaceRecommendInput(input);
    expect(canonical.vognMode).toBe('awake');
    expect(canonical.materialPreference).toBe('prefer_fleece');
    expect(recommendForTogSurface(input)).toEqual(recommend(canonical));
  });

  it('keeps Home, Plan, and Find behaviorally identical for one canonical fixture', () => {
    const input: SurfaceRecommendInput = {
      weather: { tempC: -4, feelsLikeC: -6, windMs: 3, precipMmH: 0 },
      child: { ageMonths: 14 },
      activity: 'vogn',
      materialPreference: 'prefer_fleece',
      vognMode: 'awake',
    };
    const decisions = [
      recommendForHomeSurface(input),
      recommendForPlanSurface(input),
      recommendForFindSurface(input),
    ].map(canonicalRecommendationDecision);

    expect(decisions[1]).toEqual(decisions[0]);
    expect(decisions[2]).toEqual(decisions[0]);

    const materialDrift = canonicalRecommendationDecision(
      recommendForPlanSurface({ ...input, materialPreference: 'prefer_wool' }),
    );
    expect(materialDrift).not.toEqual(decisions[0]);
  });

  it('proves the parity sentinel detects drift across an existing temperature boundary', () => {
    const colder: SurfaceRecommendInput = {
      weather: { tempC: -7.01, feelsLikeC: -7.01, windMs: 0, precipMmH: 0 },
      child: { ageMonths: 14 },
      activity: 'utelek',
      materialPreference: null,
      vognMode: null,
    };
    const warmer: SurfaceRecommendInput = {
      ...colder,
      weather: { ...colder.weather, tempC: -6.99, feelsLikeC: -6.99 },
    };

    expect(canonicalRecommendationDecision(recommendForHomeSurface(colder)))
      .not.toEqual(canonicalRecommendationDecision(recommendForHomeSurface(warmer)));
  });

  it.each([
    ['sleeping stroller', { materialPreference: null, vognMode: 'sleeping' }],
    ['missing stroller mode', { materialPreference: null, vognMode: null }],
  ] as const)('fails closed for unauthorized %s surface input', (_label, fields) => {
    expect(() => recommendForHomeSurface({
      weather: { tempC: 4, feelsLikeC: 2, windMs: 3, precipMmH: 0 },
      child: { ageMonths: 8 },
      activity: 'vogn',
      ...fields,
    })).toThrow(Error);
  });

  it('fails closed when a caller bypasses required explicit context fields', () => {
    const malformed = {
      weather: { tempC: 4, feelsLikeC: 2, windMs: 3, precipMmH: 0 },
      child: { ageMonths: 8 },
      activity: 'utelek',
    } as unknown as SurfaceRecommendInput;
    expect(() => recommendForHomeSurface(malformed)).toThrow(/angi materialpreferanse og vognmodus/u);
  });
});
