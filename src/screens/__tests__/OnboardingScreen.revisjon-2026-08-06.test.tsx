/**
 * MÅLEPUNKT for de tre [MINDRE]-funnene mot Onboarding i
 * `docs/design-notes/revisjon-prod-2026-08-06.md`.
 *
 * Hver test her skal bli RØD hvis rettingen reverseres — ikke grønn fordi
 * ingenting krasjet. Repoet har ingen jsdom, så flatene måles med
 * `renderToStaticMarkup` (samme konvensjon som OnboardingScreen.step1.test.tsx)
 * og CSS-en leses ut av `STYLE_CSS`-literalen i kilden.
 *
 * IKKE-VAKUØSITET: hver CSS-test henter først ut regelen den skal dømme og
 * feiler hvis selektoren ikke finnes, og reglene om FRAVÆR av en deklarasjon
 * ledsages av en kontroll som beviser at uttrekkeren FINNER den deklarasjonen
 * der den faktisk står. En «finner ikke padding-left»-test som heller ikke
 * ville funnet den om den var der, måler ingenting.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OnboardingScreen } from '../OnboardingScreen';
import { ChildrenProvider } from '../../state/children-provider';

function kilde(sti: string): string {
  return readFileSync(resolve(process.cwd(), sti), 'utf8');
}

const onboardingKilde = kilde('src/screens/OnboardingScreen.tsx');

/**
 * Henter kroppen til ÉN CSS-regel ut av en kildetekst.
 * Kommentarer strippes først: kommentarblokkene i OnboardingScreen nevner
 * både padding-left og --dw-tabbar-clearance i prosa, og uten stripping ville
 * testene under bestått eller strøket på KOMMENTARER i stedet for på kode.
 */
function regelKropp(kildetekst: string, selektor: string): string {
  const utenKommentarer = kildetekst.replace(/\/\*[\s\S]*?\*\//gu, '');
  const start = utenKommentarer.indexOf(`${selektor}{`);
  if (start === -1) return '';
  const fra = start + selektor.length + 1;
  const til = utenKommentarer.indexOf('}', fra);
  return til === -1 ? '' : utenKommentarer.slice(fra, til);
}

function render(): string {
  return renderToStaticMarkup(
    <ChildrenProvider>
      <OnboardingScreen />
    </ChildrenProvider>,
  );
}

describe('Onboarding — revisjon 2026-08-06 ([MINDRE])', () => {
  it('personvernløftet navngir INGEN telefonmodell', () => {
    const html = render();
    // Ikke-vakuøsitet: hjelpeteksten finnes, og det er DEN vi dømmer.
    expect(html, 'hjelpeteksten under navnefeltet mangler helt').toContain('id="ob-name-hint"');
    expect(html).toContain('Brukes bare i teksten og lagres bare på denne telefonen.');
    // Løftet om hvor data lagres må være sant på begge plattformer appen
    // distribueres på (App Store OG Google Play, no.klemeg.app).
    expect(html, 'onboarding navngir igjen en bestemt enhet i personvernløftet')
      .not.toMatch(/iPhone|iPad|Android|Samsung/u);
  });

  it('feltetiketten og hjelpeteksten deler venstrekant med feltet de beskriver', () => {
    const etikett = regelKropp(onboardingKilde, '.ob-field label');
    const hint = regelKropp(onboardingKilde, '.ob-hint');
    // Ikke-vakuøsitet 1: begge reglene finnes og har innhold å dømme.
    expect(etikett, '.ob-field label finnes ikke lenger — testen dømmer tomrom').toContain('font-size');
    expect(hint, '.ob-hint finnes ikke lenger — testen dømmer tomrom').toContain('font-size');

    // Ikke-vakuøsitet 2: MUTASJONSBEVIS. Samme uttrekker finner padding-left
    // der den FAKTISK står (.ob-hint-center nullstiller den eksplisitt), så
    // fraværet under er en måling, ikke en blindsone.
    expect(regelKropp(onboardingKilde, '.ob-hint-center')).toMatch(/padding-left:\s*0/u);

    for (const [navn, kropp] of [['.ob-field label', etikett], ['.ob-hint', hint]] as const) {
      expect(kropp, `${navn} har fått innrykk igjen — kortet får tre venstrekanter`)
        .not.toMatch(/padding-left|padding-inline-start|margin-left/u);
    }
  });

  it('onboarding tar IKKE klaring for en tab-bar den ikke har', () => {
    // MEKANISMEN som skapte de 208 tomme bildepikslene under «Fortsett»:
    // den globale regelen treffer <main class="ob-screen"> fordi skjermen
    // rendres rett under .app-shell. Beviset på at mekanismen fortsatt er
    // levende hører til her — forsvinner den globale regelen, er
    // overstyringen under ufarlig, men da skal noen VITE det.
    const globalKropp = regelKropp(kilde('src/styles/design-tokens.css'), '.app-shell > main ');
    expect(globalKropp, 'fant ikke .app-shell > main i design-tokens.css')
      .toMatch(/padding-bottom:\s*var\(--dw-tabbar-clearance/u);

    const overstyring = regelKropp(onboardingKilde, '.app-shell > main.ob-screen');
    expect(overstyring, 'overstyringen mangler — onboarding får tab-bar-klaring igjen')
      .toMatch(/padding-bottom/u);
    expect(overstyring, 'overstyringen henter tab-bar-klaringen på nytt')
      .not.toContain('--dw-tabbar-clearance');
    // Spesifisitet: (0,2,1) mot den globale regelens (0,1,1). Skrives
    // selektoren om til bare «.ob-screen» (0,1,0) taper den igjen, i stillhet.
    expect(onboardingKilde).toContain('.app-shell > main.ob-screen{');
  });

  it('ledig plass i steg 1 fordeles over OG under kortet, ikke bare under', () => {
    const hero = regelKropp(onboardingKilde, '.ob-s1-hero');
    expect(hero, '.ob-s1-hero finnes ikke lenger').toContain('flow-root');
    expect(hero, 'kortet er låst til toppen igjen — hele tomrommet samler seg under det')
      .toMatch(/margin-block:\s*auto/u);
    expect(hero, 'en fast toppmarg slår ut auto-margen og gjenskaper funnet')
      .not.toMatch(/margin-top:/u);
  });
});
