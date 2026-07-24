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
    expect(app).toContain("onOpenCard={onOpenGuideTarget}");
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
});
