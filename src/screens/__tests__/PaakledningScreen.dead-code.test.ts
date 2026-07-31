/**
 * PaakledningScreen — CurrentPaakledningScreen is unreachable (P6 finding).
 *
 * Discovered while wiring the P6 "Bytt" affordance: PaakledningScreen.tsx
 * exports a `PaakledningScreen` wrapper that always renders
 * `PlannedPaakledningScreen` whenever `currentContext ?? plannedContext` is
 * truthy, falling back to `CurrentPaakledningScreen` only when NEITHER is
 * supplied. Every real caller (App.tsx's two drill branches) and every test
 * in PaakledningScreen.outfit-truth.test.tsx supplies one of the two — so
 * `CurrentPaakledningScreen` (the ring-UI component with its own
 * `handleOpenNode`/`PlaggDetailSheet` instance) never actually renders.
 * Not part of this package's scope to delete (P6 only removes GuideHubScreen)
 * — documented here so it isn't mistaken for a live integration point.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('PaakledningScreen — CurrentPaakledningScreen is dead code', () => {
  it('the exported wrapper only falls back to CurrentPaakledningScreen when neither context prop is given', () => {
    const contents = source('src/screens/PaakledningScreen.tsx');
    expect(contents).toContain('const exactContext = props.currentContext ?? props.plannedContext;');
    expect(contents).toContain('if (exactContext) {');
    expect(contents).toContain('return <CurrentPaakledningScreen {...props} />;');
  });

  it('every live caller (App.tsx) supplies currentContext or plannedContext', () => {
    const app = source('src/App.tsx');
    const paakledningCallSites = app.split('<PaakledningScreen').slice(1);
    expect(paakledningCallSites.length).toBe(2);
    for (const call of paakledningCallSites) {
      const props = call.slice(0, call.indexOf('/>'));
      expect(props).toMatch(/currentContext=|plannedContext=/u);
    }
  });
});
