import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('HjemScreen city label', () => {
  it('passes the exact effective city without a location-mode prefix', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/screens/HjemScreen.tsx'),
      'utf8',
    );

    expect(source).toContain("const cityLabel = effectivePlace?.city ?? 'Sted mangler';");
    expect(source).not.toMatch(/`(?:Fast sted|Nåværende sted) · \$\{effectivePlace\.city\}`/u);
  });
});
