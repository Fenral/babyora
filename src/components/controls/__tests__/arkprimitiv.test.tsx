/**
 * ARK-PRIMITIVEN — porten som holder dialogflatene i sjakk.
 *
 * Fase 2B målte 19 dialogflater i 12 varianter. Tolv av dem bor i samme fil
 * (Innstillinger) og følger tre ulike oppskrifter som varierer i radius
 * (20 mot 22), bredde (420 mot 460) og om de i det hele tatt har maksimal
 * høyde. Radius på tvers av appen: 24, 22, 20 og 0.
 *
 * FIRE MÅLTE FEIL PORTEN HINDRER I Å OPPSTÅ PÅ NYTT:
 *
 *   1. `<dialog open>` uten showModal(). Én flate gjør det, og mister tre
 *      ting på én gang: Escape fyrer aldri, tabrekkefølgen går ut i siden
 *      bak, og bakgrunnen er både rullbar og klikkbar.
 *   2. Fokus settes ikke inn (3 av 12) og gis ikke tilbake.
 *   3. Ingen bakgrunnslukking.
 *   4. Rulling på selve <dialog>-elementet, uten overscroll-containment.
 *
 * OG ÉN SOM ER LETT Å OVERSE: den globale reduced-motion-killswitchen
 * bruker `*, *::before, *::after`, og treffer derfor IKKE `::backdrop`.
 * Teppet fader inn selv når brukeren har bedt om ro. Primitiven har en egen
 * regel; porten sjekker at den fortsatt står der.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROT = process.cwd();

/**
 * KOMMENTARENE MÅ STRIPPES FØRST. Fire av åtte sjekker under bestod ikke
 * fordi de traff primitivens EGEN dokumentasjon: kommentaren forklarer
 * hvorfor `<dialog open>` er feil, hvorfor autoFocus ikke skal stå der, og
 * siterer `button { min-height: 44px }` — og den siste `}` kuttet
 * selektorblokken midt i. Nøyaktig samme felle som da et råt
 * `indexOf('@media')` traff ordet inne i en filkommentar og kuttet skopet
 * før målene. Nyliner beholdes så linjenumre ikke forskyves.
 */
const utenKommentar = (kilde: string): string =>
  kilde.replace(/\/\*[\s\S]*?\*\//gu, (m) => m.replace(/[^\n]/gu, ' '));

const CSS = utenKommentar(readFileSync(join(ROT, 'src/components/controls/sheet.css'), 'utf8'));
const TSX = utenKommentar(readFileSync(join(ROT, 'src/components/controls/Sheet.tsx'), 'utf8'));

describe('ark-primitiven', () => {
  it('IKKE-VAKUØSITET: filene finnes og har innhold å måle', () => {
    expect(CSS.replace(/\s+/gu, '').length, 'sheet.css har ingen regler utenom kommentarer')
      .toBeGreaterThan(400);
    expect(TSX.replace(/\s+/gu, '').length, 'Sheet.tsx har ingen kode utenom kommentarer')
      .toBeGreaterThan(400);
  });

  it('åpner ALLTID med showModal(), aldri med open-attributtet', () => {
    expect(TSX, 'showModal() mangler — uten den finnes verken top-layer, '
      + 'inert bakgrunn eller native Escape').toContain('showModal()');
    /* `<dialog open>` i JSX ville gitt en ikke-modal dialog. */
    expect(TSX, 'open settes som attributt på <dialog> — det gir en ikke-modal dialog')
      .not.toMatch(/<dialog[^>]*\sopen[=\s>]/u);
  });

  it('gir fokus TILBAKE til det som åpnet arket', () => {
    expect(TSX).toMatch(/triggerRef\??\.current\?\.focus/u);
    expect(TSX, 'fokus-retur må skje etter at <dialog> selv har flyttet fokus')
      .toContain('requestAnimationFrame');
  });

  it('stjeler ikke fokus fra innholdets eget mål', () => {
    /* showModal() velger elementet med `autofocus` foran det første
       fokuserbare. Setter primitiven autoFocus på lukkeknappen, står den
       først i dokumentet og vinner over innholdet — materialarket ville
       mistet sin «fokus på valgt radio». */
    expect(TSX, 'autoFocus i primitiven overstyrer innholdets eget fokusmål')
      .not.toMatch(/\bautoFocus\b(?!\s*=\s*\{?false)/u);
  });

  it('lukkes ved klikk utenfor kortet', () => {
    expect(TSX, 'ingen bakdropp-lukking — å trykke utenfor er det folk prøver først')
      .toContain('getBoundingClientRect');
  });

  it('ruller i en INDRE beholder, med overscroll-containment', () => {
    expect(CSS, 'ingen indre rulleflate — ruller man på selve <dialog> mister '
      + 'man både containment og et fast bunnfelt')
      .toMatch(/\.dw-sheet-innhold\s*\{[^}]*overflow-y:\s*auto/u);
    expect(CSS, 'uten containment drar en rulling i arket siden bak med seg')
      .toMatch(/\.dw-sheet-innhold\s*\{[^}]*overscroll-behavior-y:\s*contain/u);
    expect(CSS, 'ingen maksimal høyde — innholdet kan klippes ved stor systemtekst')
      .toMatch(/\.dw-sheet\s*\{[^}]*max-height:/u);
  });

  it('bunnen klarer hjemindikatoren', () => {
    expect(CSS).toMatch(/env\(safe-area-inset-bottom/u);
  });

  it('::backdrop respekterer redusert bevegelse — `*` treffer den ikke', () => {
    const blokk = /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/u.exec(CSS);
    expect(blokk, 'ingen reduced-motion-blokk i sheet.css').not.toBeNull();
    expect(
      blokk![1],
      'backdroppen er ikke nevnt i reduced-motion-blokken. Den globale '
      + 'killswitchen bruker `*, *::before, *::after` og treffer IKKE ::backdrop.',
    ).toContain('::backdrop');
  });

  it('bruker tokenene som allerede fantes for nettopp denne flaten', () => {
    /* --dw-overlay er kommentert «nivå 3 · sheets/dialog» i tokenfilen og
       traff 2 av 19 flater. Dybdekontrakten traff 0 av 19 — tre
       konkurrerende hardkodede skygge-oppskrifter i stedet. */
    expect(CSS, '--dw-overlay er tokenet for nettopp denne flaten').toContain('var(--dw-overlay)');
    expect(CSS, 'dybdekontrakten hadde null forbrukere blant dialogene')
      .toMatch(/box-shadow:\s*var\(--dw-depth-/u);
    /* IKKE `\s*(?!var\()`: `\s*` backtracker til null tegn, lookaheaden ser
       et mellomrom i stedet for `var(`, og sperren slipper alt gjennom.
       Fang verdien først, filtrer etterpå. */
    const hardkodet = [...CSS.matchAll(/box-shadow:\s*([^;]+);/gu)]
      .map((m) => m[1].trim())
      .filter((v) => !v.startsWith('var('));
    expect(hardkodet, `hardkodede skygger i ark-primitiven:\n  ${hardkodet.join('\n  ')}`).toEqual([]);
  });

  it('lukkeknappen holder trykkmålet i BEGGE retninger', () => {
    /* Tolv lukkeknapper i appen har driftet til to størrelser; fem er 36 px
       brede og reddes bare av den globale `button { min-height: 44px }` —
       altså 36x44, ikke 44x44. */
    const blokk = /\.dw-sheet-lukk\s*\{([^}]*)\}/u.exec(CSS);
    expect(blokk, 'fant ikke lukkeknappen').not.toBeNull();
    expect(blokk![1], 'min-width mangler — knappen blir smalere enn trykkmålet')
      .toMatch(/min-width:\s*var\(--dw-size-touch\)/u);
    expect(blokk![1], 'min-height mangler')
      .toMatch(/min-height:\s*var\(--dw-size-touch\)/u);
  });
});
