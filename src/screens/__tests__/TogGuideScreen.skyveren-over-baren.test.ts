import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * PLASSREGNSKAPET PÅ TOG-SKJERMEN SKAL IKKE REVERSERES.
 *
 * MÅLINGEN SOM ER FASIT (ikke et anslag):
 * `tools/product-audit/runs/2026-08-06T12-07-31-457Z/screenshots/tog--default.png`,
 * 390×844 ved deviceScaleFactor 2, hentet fra produksjonsbygget.
 *
 *   tab-barens overkant   bilde-y 1536  →  768 CSS-px
 *   «SETT ROMTEMPERATUR»  bilde-y 1535  →  767,5 CSS-px  (glyf-topp)
 *   «Skyv eller velg under» bilde-y 1533 → 766,5 CSS-px
 *
 * De to tekstene startet altså NØYAKTIG på barens kant, og alt under dem —
 * skinnen, håndtaket, de fem trinn-etikettene — lå bak baren.
 *
 * 768 er ikke et tilfeldig tall: baren er `position: fixed` med
 * `bottom: var(--dw-tabbar-gap) + safe-area` og `min-block-size:
 * var(--dw-tabbar-height)` (BottomTabBar.css), så overkanten er
 * 844 − 16 − 60 − 0 = 768.
 *
 * HVORFOR BUNN-PADDING IKKE VAR SVARET
 * `--dw-tabbar-clearance` på rullecontaineren gir luft ETTER siste element.
 * Den flytter ikke ett eneste element oppover i hviletilstand. Kollisjonen
 * her var et REGNESTYKKE: innholdet over skyveren var ~118 px høyere enn de
 * 768 pikslene som fantes. Eierbeslutning B+A (commit e418354) hentet inn
 * akkurat de pikslene med to grep:
 *
 *   B  introavsnittet fjernet   0,90625rem × 1,5 × 3 linjer  ≈ 66 px
 *   A  soveposen 176 → 124 px                                =  52 px
 *                                                             ────────
 *                                                              ~118 px
 *
 * → «SETT ROMTEMPERATUR» flytter seg fra 767,5 til ~649 CSS-px, altså
 * ~119 px klaring til barens kant.
 *
 * HVA DENNE PORTEN ER, OG HVA DEN IKKE ER
 * jsdom har ingen layout — den kan ikke måle at teksten ligger på y 649.
 * Den ekte målingen er revisjonens skjermbilde. Porten holder derimot
 * BEGGE SIDER av ulikheten fast: de to grepene som skaffet pikslene, og
 * tab-bar-geometrien som bestemmer hvor mange piksler som finnes. Vokser
 * baren, eller kommer avsnittet/høyden tilbake, er regnestykket ikke lenger
 * det som ble målt — og da skal noen måle på nytt, ikke gjette.
 */
const SKJERM = resolve(process.cwd(), 'src/screens/TogGuideScreen.tsx');
const TOKENS = resolve(process.cwd(), 'src/styles/design-tokens-v2.css');

function les(sti: string): string {
  return readFileSync(sti, 'utf8').replace(/\r\n/gu, '\n');
}

/** Fjerner blokk- og linjekommentarer, så vi måler koden og ikke prosaen om den. */
function utenKommentarer(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//gu, '').replace(/^\s*\/\/.*$/gmu, '');
}

function stilobjekt(src: string, navn: string): string {
  const start = src.indexOf(`const ${navn}: CSSProperties = {`);
  if (start < 0) throw new Error(`fant ikke ${navn}`);
  const slutt = src.indexOf('\n  };', start);
  if (slutt < 0) throw new Error(`fant ikke slutten på ${navn}`);
  return src.slice(start, slutt);
}

describe('TOG — skyveren og overskriften står over tab-baren', () => {
  it('kommentar-strippingen virker (ellers måler resten av fila ingenting)', () => {
    /* IKKE-VAKUØSITET. Introavsnittet står fortsatt i fila — som KOMMENTAR,
       der det dokumenterer eierbeslutningen. Hvis stripperen sluttet å
       virke, ville testen under funnet setningen i kommentaren og vært
       grønn uansett hva JSX-en gjorde. Fiksturet bevises på syntetisk
       tekst, ikke på fila selv, så porten ikke blir avhengig av at
       kommentaren blir stående. */
    expect(utenKommentarer('a /* Skyv på guiden */ b').trim()).toBe('a  b');
    expect(utenKommentarer('  // Skyv på guiden\nb').trim()).toBe('b');
  });

  it('introavsnittet er ikke tilbake i JSX-en (grep B, ~66 px)', () => {
    const kode = utenKommentarer(les(SKJERM));

    expect(
      kode.includes('Skyv på guiden'),
      'Introavsnittet «Skyv på guiden og finn anbefalt sovepose etter '
      + 'temperaturen på rommet.» er tilbake i JSX-en. Det er ~66 px, og '
      + 'skjermen har dem ikke: målt 2026-08-06 lå «SETT ROMTEMPERATUR» på '
      + 'y 767,5 med tab-barens kant på y 768. Setningen sto dessuten tre '
      + 'ganger — «SETT ROMTEMPERATUR · Skyv eller velg under» står rett '
      + 'over skyveren, og skyveren viser TOG-verdien mens man drar. '
      + 'Eierbeslutning B+A, commit e418354.',
    ).toBe(false);

    expect(
      kode.includes('heroSubStyle'),
      'heroSubStyle er tilbake. Stilen ble slettet sammen med avsnittet '
      + 'nettopp fordi en ubrukt stil er en invitasjon til å sette teksten '
      + 'tilbake uten å se på plassregnskapet som gjorde at den måtte vekk.',
    ).toBe(false);
  });

  it('soveposen er 124 px, ikke 176 (grep A, 52 px)', () => {
    const scene = stilobjekt(les(SKJERM), 'sceneStyle');
    const treff = /height:\s*(\d+)/u.exec(scene);

    expect(treff, 'sceneStyle har ikke lenger en tallfestet height').not.toBeNull();
    expect(
      Number(treff?.[1]),
      'Sovepose-scenen har vokst igjen. Eierbeslutning 2026-08-06: den skal '
      + 'IKKE tilbake til 176 px — de 52 pikslene er halvparten av det '
      + 'skyveren trenger for å stå over tab-baren i hvile. (Under ~100 px '
      + 'leses den som et ikon, så den skal heller ikke krympes videre uten '
      + 'ny beslutning.)',
    ).toBe(124);
  });

  it('rullecontaineren beholder tab-bar-klaringen for SISTE element', () => {
    /* Den andre halvparten av problemet, og en annen mekanisme: klaringen
       gjør at innholdet man ruller TIL slutten av ikke ender bak baren.
       Den gjorde aldri noe med hviletilstanden — det er derfor grep A og B
       måtte til. Begge står her så ingen bytter den ene mot den andre. */
    const scroll = stilobjekt(les(SKJERM), 'scrollStyle');
    expect(scroll).toMatch(/var\(--dw-tabbar-clearance/u);
  });

  it('tab-bar-geometrien er den regnestykket ble målt mot', () => {
    /* Den andre siden av ulikheten. 768 CSS-px kommer fra 844 − gap − høyde.
       Vokser baren, spiser den opp klaringen grep A+B skaffet, og da er
       ~119 px ikke lenger sant — uten at noe i TogGuideScreen.tsx endret
       seg. Da skal noen måle på nytt. */
    const tokens = les(TOKENS);
    expect(tokens).toMatch(/--dw-tabbar-height:\s*60px/u);
    expect(tokens).toMatch(/--dw-tabbar-gap:\s*16px/u);
  });
});
