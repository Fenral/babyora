import { describe, expect, it } from 'vitest';
import { PAGE_CATALOG, RUBRIC, RUBRIC_VERSION } from './config';

describe('product audit configuration', () => {
  it('keeps rubric dimensions at 100 percent', () => {
    expect(RUBRIC.reduce((sum, item) => sum + item.weight, 0)).toBe(100);
  });

  it('keeps app page weights at 100 percent', () => {
    expect(PAGE_CATALOG.reduce((sum, page) => sum + page.appWeight, 0)).toBe(100);
  });

  it('contains every approved page family', () => {
    // P1 (nav 4→3 skeleton): Guide-tab-roten er fjernet. 'guide' (huben) er
    // fjernet uten erstatning; 'find-outfit'/'clothing-library'/'wardrobe'
    // var kun nåbare via Guide-huben og hadde ingen synlig opener — de
    // gjeninnføres når de får et entry-point fra Hjem.
    // P5: 'find-outfit' (FinnAntrekkScreen, nå "Juster") fikk sin CTA
    // (WeatherStrip + vær-panelet på Hjems resultat) og er tilbake.
    // P6: 'clothing-library' (PlaggbibliotekScreen) fikk sin CTA
    // (PlaggDetailSheet sin "Se alternativer i biblioteket", åpnet fra Hjems
    // Bytt-rad) og er tilbake. 'wardrobe' (MinGarderobeScreen) fikk ingen
    // opener i P6 og forblir utenfor katalogen.
    expect(PAGE_CATALOG.map((page) => page.id)).toEqual([
      'onboarding', 'home', 'outfit', 'find-outfit', 'plan', 'clothing-library',
      'tog', 'warm-cold', 'first-winter',
      'settings', 'paywall',
    ]);
  });

  it('versions the rubric', () => {
    expect(RUBRIC_VERSION).toMatch(/^1\./);
  });

  it('uses current deterministic navigation for onboarding and the Familie-hosted tools', () => {
    const onboarding = PAGE_CATALOG.find((page) => page.id === 'onboarding')!;
    const tog = PAGE_CATALOG.find((page) => page.id === 'tog')!;
    const warmCold = PAGE_CATALOG.find((page) => page.id === 'warm-cold')!;
    const firstWinter = PAGE_CATALOG.find((page) => page.id === 'first-winter')!;
    expect(tog.states[0]?.actions).toContainEqual({ type: 'tab', name: 'Familie' });
    expect(tog.states[0]?.actions).toContainEqual({ type: 'button', pattern: 'Soveguiden' });
    expect(tog.states[0]?.expectedText).toBe('Soving innendørs');
    expect(warmCold.states[0]?.actions).toContainEqual({ type: 'tab', name: 'Familie' });
    expect(firstWinter.states[0]?.actions).toContainEqual({ type: 'tab', name: 'Familie' });
    expect(onboarding.states[0]?.expectedText).toBeTruthy();
  });

  /* SNUDD 2026-08-06. Linjen som sto her het
       expect(onboarding.states[0]?.expectedText).toBeUndefined()
     — en test som LÅSTE FAST at onboarding ikke beviste noe. Den var
     grønn hele tiden, og det den voktet var et hull.

     Det er samme feilklasse som resten av økta har handlet om: en port
     kan være grønn fordi jobben IKKE er gjort. Her var den grønn fordi
     jobben ikke var gjort NOE STED, og fraværet var skrevet inn som om
     det var en egenskap.

     Kravet er nå snudd og gjelder alle: hver tilstand må si hva som
     beviser at fangsten traff riktig skjerm. Målt effekt samme dag —
     revisjonen gikk fra «11/11 fanget» til «10/11 fanget, betalingsmuren
     nås ikke», som er det sanne tallet. */
  it('hver fangst sier hva som beviser at den traff riktig skjerm', () => {
    const utenBevis: string[] = [];
    for (const side of PAGE_CATALOG) {
      for (const tilstand of side.states) {
        const t = tilstand.expectedText;
        if (typeof t !== 'string' || t.trim().length < 3) {
          utenBevis.push(`${side.id}/${tilstand.id}`);
        }
      }
    }
    expect(
      utenBevis,
      'Disse fangstene kan fange feil skjerm og likevel melde grønt. '
      + 'expectedText skal være noe MÅLSKJERMEN har og de andre ikke har.',
    ).toEqual([]);

    // Ikke-vakuøsitet: det finnes faktisk tilstander å kreve dette av.
    const antall = PAGE_CATALOG.reduce((n, s) => n + s.states.length, 0);
    expect(antall).toBeGreaterThanOrEqual(11);
  });
});
