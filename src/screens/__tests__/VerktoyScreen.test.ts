import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('VerktoyScreen', () => {
  it('owns exactly the four requested tool destinations', async () => {
    const source = await readFile(
      fileURLToPath(new URL('../VerktoyScreen.tsx', import.meta.url)),
      'utf8',
    );

    expect(source).toContain("openTool('finn-antrekk')");
    expect(source).toContain("target: 'tog'");
    expect(source).toContain("target: 'forste-vinter'");
    expect(source).toContain("target: 'varm-kald'");
  });

  it('uses one primary weather surface and one grouped guide list', async () => {
    const source = await readFile(
      fileURLToPath(new URL('../VerktoyScreen.tsx', import.meta.url)),
      'utf8',
    );
    const css = await readFile(
      fileURLToPath(new URL('../VerktoyScreen.css', import.meta.url)),
      'utf8',
    );

    expect(source).toContain('className="verktoy-screen__weather"');
    expect(source).toContain('className="verktoy-screen__guide-list"');
    expect(css).toMatch(/\.verktoy-screen__guide-list button\s*\{[^}]*min-block-size:\s*92px/su);
    expect(css).toMatch(/button:focus-visible/u);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/u);
  });
});
