import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { indexFromScrollPosition } from '../KlePaaStepper';

const ROOT = process.cwd();
const SOURCE = readFileSync(
  join(ROOT, 'src/components/klepaa/KlePaaStepper.tsx'),
  'utf8',
);
const CSS = readFileSync(
  join(ROOT, 'src/components/klepaa/kle-paa-stepper.css'),
  'utf8',
);

describe('KlePaaStepper native scroll gesture contract', () => {
  it('derives the nearest snapped index from the passive scroll position', () => {
    expect(indexFromScrollPosition(0, 320, 4)).toBe(0);
    expect(indexFromScrollPosition(159, 320, 4)).toBe(0);
    expect(indexFromScrollPosition(161, 320, 4)).toBe(1);
    expect(indexFromScrollPosition(5000, 320, 4)).toBe(3);
  });

  it('uses a native horizontal scroll container with snap points', () => {
    expect(CSS).toMatch(/\.kps-viewport\s*\{[\s\S]*?overflow-x:\s*auto;/u);
    expect(CSS).toMatch(/\.kps-viewport\s*\{[\s\S]*?scroll-snap-type:\s*x\s+mandatory;/u);
    expect(CSS).toMatch(/\.kps-slide\s*\{[\s\S]*?scroll-snap-align:\s*start;/u);
    expect(SOURCE).toContain('onScroll={onScroll}');
  });

  it('does not capture pointers, axis-lock gestures, or translate a synthetic track', () => {
    expect(SOURCE).not.toMatch(/onPointer(?:Down|Move|Up|Cancel)|setPointerCapture|pointerId/u);
    expect(SOURCE).not.toMatch(/AKSE|axisLock|dragRef|setDragPx/u);
    expect(CSS).not.toMatch(/touch-action\s*:|translate3d\(|--kps-drag/u);
  });

  it('keeps direct motion for reduced-motion users', () => {
    expect(SOURCE).toContain('useNativeSettings');
    expect(SOURCE).toContain("behavior: reducedMotion ? 'auto' : 'smooth'");
    expect(SOURCE).toContain("style={reducedMotion ? { scrollBehavior: 'auto' } : undefined}");
    expect(CSS).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.kps-viewport\s*\{[\s\S]*?scroll-behavior:\s*auto;/u,
    );
  });
});
