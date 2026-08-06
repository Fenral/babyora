import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * SVARET PÅ TOG-SKJERMEN SKAL ALDRI KRYMPES BORT.
 *
 * Målt 2026-08-06: under prefers-reduced-motion: reduce kollapset
 * «ANBEFALT TOG»-kortet fra 350×193 til 350×48. Padding alene er 46 px, så
 * innholdsboksen var 2 px. Tallet «2.5» lå der fortsatt — dets egen boks
 * målte 109×103 uendret — men ble klippet bort av kortets overflow: hidden.
 *
 * Årsaken er flexbox, ikke bevegelse. Rullecontaineren er en flex-kolonne;
 * når innholdet blir høyere enn den, krymper barna. min-height: auto ville
 * normalt hindret det, men spesifikasjonen slår av den beskyttelsen for
 * elementer med overflow ≠ visible. Kortet var det eneste barnet med
 * overflow: hidden og absorberte hele krympingen alene.
 *
 * HVA DENNE PORTEN ER, OG HVA DEN IKKE ER
 * Den leser kilden, ikke pikslene. Den kan derfor si at vernet STÅR DER,
 * ikke at kortet faktisk har full høyde i en nettleser. Den ekte målingen
 * er revisjonens skjermbilde, som kjøres med reducedMotion: 'reduce'
 * (capture.ts) — det var nettopp den som avslørte feilen.
 *
 * Porten finnes fordi den ekte målingen krever en nettleser og et
 * menneske som ser på bildet. Denne kjører på hver commit og fanger den
 * ene endringen som ville brakt feilen tilbake: at flex-shrink forsvinner.
 */
const KILDE = resolve(process.cwd(), 'src/screens/TogGuideScreen.tsx');

function kilde(): string {
  return readFileSync(KILDE, 'utf8').replace(/\r\n/g, '\n');
}

function stilobjekt(src: string, navn: string): string {
  const start = src.indexOf(`const ${navn}: CSSProperties = {`);
  if (start < 0) throw new Error(`fant ikke ${navn}`);
  const slutt = src.indexOf('\n  };', start);
  if (slutt < 0) throw new Error(`fant ikke slutten på ${navn}`);
  return src.slice(start, slutt);
}

describe('TOG — svaret krympes ikke bort', () => {
  it('kortet med anbefalt TOG kan ikke krympe i flex-kolonnen', () => {
    const hero = stilobjekt(kilde(), 'togHeroStyle');

    // IKKE-VAKUØSITET: det er nettopp kombinasjonen overflow: hidden i en
    // flex-kolonne som gjør vernet nødvendig. Forsvinner overflow-en, er
    // testen ikke lenger om det den ble skrevet for.
    expect(
      /overflow:\s*'hidden'/u.test(hero),
      'togHeroStyle har ikke lenger overflow: hidden. Da gjelder min-height: '
      + 'auto igjen og flex-vernet er kanskje unødvendig — men da skal denne '
      + 'testen skrives om, ikke stå og måle noe annet enn den sier.',
    ).toBe(true);

    expect(
      /flexShrink:\s*0/u.test(hero),
      'togHeroStyle mangler flexShrink: 0. Kortet ligger i en flex-KOLONNE, '
      + 'og fordi det har overflow: hidden gir spesifikasjonen det automatisk '
      + 'minstestørrelse 0. Det krymper da til 48 px — 2 px innhold — og '
      + '«2.5 tog» klippes bort. Målt under prefers-reduced-motion: reduce '
      + '2026-08-06. Svaret skjermen finnes for er det SISTE som skal gi '
      + 'etter for plassmangel, ikke det første.',
    ).toBe(true);
  });

  it('rullecontaineren er fortsatt en flex-kolonne — ellers gjelder ikke premisset', () => {
    /* Uten dette ville porten over kunne stå grønn lenge etter at grunnen
       til at den finnes var borte. En regel som overlever begrunnelsen sin
       skjuler den neste regresjonen. */
    const scroll = stilobjekt(kilde(), 'scrollStyle');
    expect(scroll).toMatch(/display:\s*'flex'/u);
    expect(scroll).toMatch(/flexDirection:\s*'column'/u);
  });
});
