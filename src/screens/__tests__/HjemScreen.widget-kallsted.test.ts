/**
 * MÅLEPUNKT: kallstedet som manglet.
 *
 * Funnet 2026-08-06 var at widget-broen ikke hadde noen kaller i appen —
 * `pushWidgetSnapshot` ble kun kalt fra det slettede spike-panelet. Rettelsen
 * er én linje i HjemScreen. Fjernes den linjen igjen, dør widgeten stille:
 * ingen typefeil, ingen krasj, ingen annen test som merker det.
 *
 * Denne testen leser kilden fordi den ikke KAN rendres: repoet har ingen
 * jsdom, og renderToStaticMarkup kjører aldri useEffect (samme begrunnelse
 * som HjemMonter.test.tsx sin header). Kildelesing er ikke elegant, men den
 * er ikke-vakuøs: den feiler nøyaktig når koblingen forsvinner.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const hjemScreenKilde = readFileSync(
  fileURLToPath(new URL('../HjemScreen.tsx', import.meta.url)),
  'utf8',
);

describe('HjemScreen mater widgeten', () => {
  it('importerer useWidgetSnapshot fra widget-modulen', () => {
    expect(hjemScreenKilde).toMatch(
      /import\s*\{\s*useWidgetSnapshot\s*\}\s*from\s*'\.\.\/lib\/widget\/use-widget-snapshot'/,
    );
  });

  it('kaller hooken på toppnivå i komponenten', () => {
    expect(hjemScreenKilde).toMatch(/\n\s*useWidgetSnapshot\(\{/);
  });

  it('mater den med barnets navn, været, den finaliserte anbefalingen og aktiviteten', () => {
    const kall = /useWidgetSnapshot\(\{([\s\S]*?)\}\);/.exec(hjemScreenKilde);
    expect(kall).not.toBeNull();
    const args = kall![1];
    expect(args).toContain('childName: active.name');
    expect(args).toContain('weather: engineInput?.weather ?? null');
    // Den SWAP-FINALISERTE anbefalingen, ikke den rå `recommendation` —
    // widgeten skal vise det samme som skjermen.
    expect(args).toContain('rec: resolvedRecommendation');
    expect(args).toContain('activity,');
  });

  it('står før den flag-gatede returen, så hook-rekkefølgen er lik i begge render-grener', () => {
    const kallIndeks = hjemScreenKilde.indexOf('useWidgetSnapshot({');
    const returIndeks = hjemScreenKilde.indexOf('if (HJEM_SCAN_UI_ENABLED)');
    expect(kallIndeks).toBeGreaterThan(0);
    expect(returIndeks).toBeGreaterThan(0);
    expect(kallIndeks).toBeLessThan(returIndeks);
  });
});
