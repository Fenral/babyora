import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TAB_DEFS } from '../nav';

const source = (path: string): string => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Snudly root shell contract', () => {
  it('has the four owner-approved root tabs in the template order', () => {
    expect(TAB_DEFS).toEqual([
      { key: 'hjem', label: 'Hjem' },
      { key: 'plan', label: 'Planlegg' },
      { key: 'verktoy', label: 'Verktøy' },
      { key: 'familie', label: 'Familie' },
    ]);
  });

  it('routes the Tools root without moving its guides into Family', () => {
    const app = source('src/App.tsx');
    expect(app).toContain("tab === 'verktoy'");
    expect(app).toContain('<VerktoyScreen onOpenTool={onOpenTool} />');
  });

  it('uses Snudly as the public app name while preserving the bundle id', () => {
    const capacitor = source('capacitor.config.ts');
    expect(capacitor).toContain("appId: 'no.klemeg.app'");
    expect(capacitor).toContain("appName: 'Snudly'");
  });

  it('loads the template-derived light design tokens after legacy styles', () => {
    const main = source('src/main.tsx');
    const tokens = source('src/styles/snudly.css');
    expect(main.indexOf("./styles/snudly.css")).toBeGreaterThan(main.indexOf("./styles/design-tokens-v2.css"));
    expect(tokens).toContain('--sn-canvas: #f3f7f5');
    expect(tokens).toContain('--sn-plate: #fffdf9');
    expect(tokens).toContain('--sn-sage-deep: #20594f');
    expect(tokens).toContain('--sn-rust: #b0512a');
  });
});
