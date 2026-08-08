/**
 * HjemScreen.flag — P4: forgreningen mellom det nye Monter-treet og det
 * gamle legacy-treet skjer ALENE på HJEM_SCAN_UI_ENABLED (flags.ts),
 * lest ved render-tid slik at den er vi.mock-bar (jf. flags.ts sin egen
 * filhode-kommentar).
 *
 * Samme mønster som HjemScreen.outfit-transition.test.tsx (kildetekst-
 * verifikasjon + et fåtall rene render-forsøk) — HjemScreen trekker inn
 * mange stores/hooks (vær, barn, tilgang, abonnement, native-settings) som
 * ingen eksisterende test fullrendrer, så denne filen holder seg til det
 * som er stabilt å påstå uten et fullt Capacitor/DOM-testmiljø: at BEGGE
 * grenene fortsatt finnes ordrett i kildekoden, og at selve forgrenings-
 * logikken (import + tidlig-return-mønsteret) er korrekt kablet.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8').replace(/\r\n/g, '\n');
}

const screenPath = 'src/screens/HjemScreen.tsx';

describe('HjemScreen — P4 flag branch wiring', () => {
  it('imports HJEM_SCAN_UI_ENABLED directly from flags.ts (vi.mock-able) rather than a copied/inlined constant', () => {
    const contents = source(screenPath);
    expect(contents).toContain("import { HJEM_SCAN_UI_ENABLED } from '../components/hjem/flags';");
    expect(contents).toContain("import { HjemMonter } from '../components/hjem/HjemMonter';");
  });

  it('reads the flag binding directly in the render body (if (HJEM_SCAN_UI_ENABLED))', () => {
    const contents = source(screenPath);
    expect(contents).toMatch(/if \(HJEM_SCAN_UI_ENABLED\) \{\s*\n\s*return \(\s*\n\s*<HjemMonter/);
  });

  it('the ENTIRE engine chain (weather/recommendation/currentOutfitContext/outfit-transition wiring) sits ABOVE the flag branch, unmodified from its historical form', () => {
    const contents = source(screenPath);
    const flagBranchIndex = contents.indexOf('if (HJEM_SCAN_UI_ENABLED)');
    // Every one of these engine-chain anchors must appear BEFORE the branch —
    // i.e. they still run unconditionally regardless of which tree renders.
    const anchors = [
      'const recommendation = useMemo<Recommendation | null>(',
      'const resolvedRecommendation = useMemo<Recommendation | null>(',
      'const currentOutfitContext = useMemo<PlannedOutfitContext | null>(',
      'const currentOutfitBundle = useMemo(',
      'const homeSourceSelection = useMemo(',
      'observeTransitionBundle(currentOutfitBundle)',
      'markFirstRecommendationSeen()',
      'const sceneModel = useMemo(',
    ];
    for (const anchor of anchors) {
      const anchorIndex = contents.indexOf(anchor);
      expect(anchorIndex, `expected to find: ${anchor}`).toBeGreaterThan(-1);
      expect(anchorIndex).toBeLessThan(flagBranchIndex);
    }
  });

  it('the legacy JSX tree (old Hjem UI) is still fully present and compilable after the flag branch — untouched for rollback', () => {
    const contents = source(screenPath);
    expect(contents).toContain('id="hjem-current-outfit-trigger"');
    expect(contents).toContain('Se dagens antrekk');
    expect(contents).toContain("id=\"ba-hjem-title\"");
    expect(contents).toContain('ba-hjem-press-cta');
  });

  it('the new HjemMonter branch is wired with the exact prop names HjemMonter.tsx declares', () => {
    const contents = source(screenPath);
    const monterCallStart = contents.indexOf('<HjemMonter');
    const monterCallEnd = contents.indexOf('/>', monterCallStart);
    const monterCall = contents.slice(monterCallStart, monterCallEnd);
    for (const prop of [
      'cityLabel', 'lat', 'lon', 'now', 'weatherStatus', 'activity',
      'onActivityChange', 'childId', 'childName', 'ageMonths', 'recommendation',
      'reducedMotion', 'outfitTransitionStatus',
    ]) {
      expect(monterCall, `expected <HjemMonter> call to pass ${prop}`).toContain(`${prop}=`);
    }
  });
});
