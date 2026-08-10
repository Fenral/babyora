import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8').replace(/\r\n/g, '\n');
}

describe('Home shared bottom-sheet motion', () => {
  const transition = source('src/components/hjem/useOriginDialogTransition.ts');
  const css = source('src/components/hjem/origin-dialog-transition.css');

  it('routes garment and situation sheets through one native dialog controller', () => {
    const garment = source('src/components/hjem/GarmentFactSheet.tsx');
    const situation = source('src/components/hjem/HomeSituationSheet.tsx');

    expect(garment).toContain("useOriginDialogTransition({");
    expect(situation).toContain("useOriginDialogTransition({");
    expect(garment).toContain('className="home-origin-sheet hgd-sheet"');
    expect(situation).toContain('className="home-origin-sheet hcs-sheet"');
  });

  it('moves the sheet, never the Home trigger geometry', () => {
    expect(transition).toContain("SHEET_OFFSCREEN_TRANSFORM = 'translate3d(0, 110%, 0) scale(1, 1)'");
    expect(transition).toContain('transform: SHEET_OFFSCREEN_TRANSFORM');
    expect(transition).not.toMatch(/getBoundingClientRect\(\)/u);
    expect(transition).not.toMatch(/width:\s*\[/u);
    expect(transition).not.toMatch(/height:\s*\[/u);
    expect(transition).not.toMatch(/inlineSize|blockSize|margin|padding|inset/u);
  });

  it('uses the established enter/exit grammar and honours both reduced-motion guards', () => {
    expect(transition).toContain('duration: MOTION.sheetEnter');
    expect(transition).toContain('easing: MOTION.iosDrawer');
    expect(transition).toContain('duration: MOTION.sheetExit');
    expect(transition).toContain('easing: MOTION.easeOutExpo');
    expect(transition).toContain("dialog.dataset.motionDisabled = 'true'");
    expect(css).toContain(".home-origin-sheet[data-motion-disabled='true']::backdrop");
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('keeps the backdrop and sheet animation limited to opacity, transform and filters', () => {
    const keyframes = css.match(/@keyframes[\s\S]*?(?=@media|$)/u)?.[0] ?? '';
    expect(keyframes).toMatch(/opacity/u);
    expect(keyframes).toMatch(/backdrop-filter/u);
    expect(keyframes).not.toMatch(/\b(?:width|height|inline-size|block-size|padding|margin|top|right|bottom|left)\s*:/u);
  });
});
