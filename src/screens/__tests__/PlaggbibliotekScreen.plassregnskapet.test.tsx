/**
 * PLAGGBIBLIOTEKET — TRE [MINDRE]-FUNN FRA PRODUKSJONSREVISJONEN 2026-08-06.
 *
 * Kilde: docs/design-notes/revisjon-prod-2026-08-06.md, seksjonene
 * «⌘K-hurtigtastbadge», «~538 px høyde på et plagg som tegnes i ~150 px» og
 * «Antallet 63 gjentas to ganger».
 *
 * Repoet har INGEN jsdom (ingen testEnvironment satt, ingen
 * @testing-library/react i package.json), så porten renderer med
 * `renderToStaticMarkup` og måler på markupen — samme mønster som
 * UkeScreen.dagslinjen.test.tsx.
 *
 * ═══ HVA HVER PORT FAKTISK MÅLER ═════════════════════════════════════════
 *
 * 1. ⌘K: at strengen ikke finnes i markupen OG at ingen fil under src/
 *    binder en Cmd/Ctrl-K-lytter. Den andre halvdelen er poenget: badgen var
 *    ikke «feil på mobil», den lovet en snarvei som ikke fantes noe sted.
 *    Skulle noen senere IMPLEMENTERE snarveien, feiler denne porten og skal
 *    da leses på nytt — det er riktig oppførsel, ikke en falsk alarm.
 *
 * 2. Bilderammen: porten leser den EKTE bredden og høyden ut av PNG-headeren
 *    på disk, leser `aspectRatio` og bildets høyde-prosent ut av markupen, og
 *    REGNER UT hvor stor andel av rammehøyden illustrasjonen fyller etter
 *    `object-fit: contain`. Med den gamle kvadratiske rammen gir regnestykket
 *    0,426; kravet er ≥ 0,80. Porten er altså ikke «aspectRatio === '11 / 6'»
 *    — den ville også fanget at noen byttet ut PNG-ene med kvadratiske uten
 *    å røre rammen, og den ville godtatt et hvilket som helst annet
 *    sideforhold som faktisk fyller rammen.
 *
 * 3. Tallet: at «63» (TOTAL_COUNT) står nøyaktig én gang i toppen.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/haptics/system', () => ({
  useHapticSystem: () => ({ fire: () => Promise.resolve() }),
}));

vi.mock('../../hooks/useNativeSettings', () => ({
  useNativeSettings: () => ({ reducedMotion: false }),
}));

const SRC = resolve(__dirname, '../..');

/** Skjermens kilde. Uten jsdom kan enkelte tilstander bare måles som tekst. */
const KILDE = readFileSync(resolve(SRC, 'screens/PlaggbibliotekScreen.tsx'), 'utf8').replace(
  /\r\n/gu,
  '\n',
);
const GARMENT_DIR = resolve(__dirname, '../../../public/illustrations/garments');

async function render(): Promise<string> {
  const { PlaggbibliotekScreen } = await import('../PlaggbibliotekScreen');
  return renderToStaticMarkup(<PlaggbibliotekScreen onBack={() => {}} />);
}

/**
 * Bredde/høyde ut av en bildefil. Leste tidligere PNG-headeren direkte
 * (IHDR på byte 16-24); da plaggene ble konvertert til WebP 2026-08-07 var
 * den parseren plutselig feil format. sharp leser alle formatene huset
 * bruker, og er allerede en avhengighet (se monter-assets.alfa.test.ts).
 */
async function bildeMaal(file: string): Promise<{ w: number; h: number }> {
  const { default: sharp } = await import('sharp');
  const m = await sharp(file).metadata();
  return { w: m.width ?? 0, h: m.height ?? 0 };
}

/** Alle .ts/.tsx-filer under src/, rekursivt. */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = resolve(dir, e.name);
    if (e.isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(e.name) ? [full] : [];
  });
}

describe('Plaggbiblioteket — ⌘K-badgen lovet en snarvei som ikke fantes', () => {
  it('rendrer ikke ⌘K noe sted i markupen', async () => {
    expect(await render()).not.toContain('⌘');
  });

  it('har fortsatt ingen Cmd/Ctrl-K-lytter i src/ — badgen var ikke bare en mobilfeil', () => {
    // Kommentarer strippes først: denne portens egen begrunnelse i
    // PlaggbibliotekScreen.tsx nevner `metaKey`, og en port som utløses av
    // sin egen forklaring måler ingenting.
    const utenKommentarer = (kilde: string): string =>
      kilde.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

    const treff = sourceFiles(SRC)
      .filter((f) => !f.includes('__tests__'))
      .filter((f) => /metaKey|ctrlKey/.test(utenKommentarer(readFileSync(f, 'utf8'))));

    expect(
      treff,
      'Finner du en Cmd/Ctrl-lytter her: les kommentaren ved `searchClear` i ' +
        'PlaggbibliotekScreen.tsx før du setter badgen tilbake.',
    ).toEqual([]);
  });

  it('gir en ekte tøm-knapp plassen badgen hadde, med 44 px trykkflate', () => {
    const kilde = readFileSync(
      resolve(SRC, 'screens/PlaggbibliotekScreen.tsx'),
      'utf8',
    );
    expect(kilde).toContain('aria-label={copy.library.clearSearch}');
    // searchClear-blokken må beholde 44×44. Hentes ut som tekst fordi knappen
    // først rendres når feltet har innhold, og uten jsdom kan vi ikke skrive
    // i det.
    const blokk = kilde.slice(
      kilde.indexOf('searchClear: {'),
      kilde.indexOf('} satisfies CSSProperties,', kilde.indexOf('searchClear: {')),
    );
    expect(blokk).toMatch(/width:\s*44/);
    expect(blokk).toMatch(/height:\s*44/);
  });
});

describe('Plaggbiblioteket — bilderammen må ha plaggets sideforhold', () => {
  it('hvert eneste plagg fyller ≥ 80 % av rammehøyden etter object-fit: contain', async () => {
    // 1. Rammen: les aspectRatio og bildets fyllprosent ut av markupen.
    const html = await render();

    const rammeForhold = /aspect-ratio:\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/.exec(html);
    expect(rammeForhold, 'fant ingen aspect-ratio på bilderammen').not.toBeNull();
    const ramme = Number(rammeForhold![1]) / Number(rammeForhold![2]);

    const fyll = /(?:^|;)\s*height:\s*(\d+(?:\.\d+)?)%/m.exec(html.slice(html.indexOf('<img')));
    expect(fyll, 'fant ingen høyde-prosent på plaggbildet').not.toBeNull();
    const fyllAndel = Number(fyll![1]) / 100;

    // 2. Assets: katalogen er IKKE ensartet. 52 stk. 1408×768, 7 stk.
    //    1024×1024, «vintersokker» 1376×768 og «varmepose-dun» 848×1264.
    //    Derfor måles hver enkelt fil, ikke et snitt: rammen må fungere for
    //    det verste tilfellet, og hvilket det er avhenger av rammens form.
    const bilder = readdirSync(GARMENT_DIR).filter((f) => f.endsWith('.webp'));
    expect(bilder.length).toBeGreaterThan(50);

    // object-fit: contain. Boksen er fyllAndel × ramme bred og fyllAndel høy,
    // regnet i enheter av rammehøyden. Bildet begrenses av BREDDEN når det er
    // bredere enn boksen, ellers av høyden.
    const boksBredde = fyllAndel * ramme;
    const boksHoyde = fyllAndel;
    const tegnetHoyde = (bildeforhold: number): number =>
      bildeforhold > boksBredde / boksHoyde ? boksBredde / bildeforhold : boksHoyde;

    const malt = await Promise.all(
      bilder.map(async (f) => {
        const { w, h } = await bildeMaal(resolve(GARMENT_DIR, f));
        return { f, andel: tegnetHoyde(w / h), w, h };
      }),
    );
    const verst = malt.sort((a, b) => a.andel - b.andel)[0]!;

    expect(
      verst.andel,
      `«${verst.f}» (${verst.w}×${verst.h}) fyller bare ` +
        `${(verst.andel * 100).toFixed(1)} % av rammehøyden. ` +
        `Ramme ${ramme.toFixed(3)}:1, bildefyll ${fyllAndel}. ` +
        'Den kvadratiske rammen ga 42,6 % for de 53 liggende plaggene — ' +
        'se kommentaren over thumbnail-diven.',
    ).toBeGreaterThanOrEqual(0.8);
  });
});

describe('Plaggbiblioteket — antallet skal stå ett sted i toppen', () => {
  it('nevner totalen nøyaktig én gang, og med enhet', async () => {
    const html = await render();
    const topp = html.slice(0, html.indexOf('role="search"'));

    const { GARMENTS_BY_CATEGORY } = await import('../../data/garment-category');
    const total = Object.values(GARMENTS_BY_CATEGORY).reduce(
      (n, arr) => n + arr.length,
      0,
    );

    const forekomster = topp.split(String(total)).length - 1;
    expect(
      forekomster,
      `«${total}» står ${forekomster} ganger over søkefeltet. ` +
        'Eyebrow-en («Hele katalogen · N plagg») er den ene som skal ha det.',
    ).toBe(1);
    expect(topp).toContain(`${total} plagg`);
  });

  /* ────────────────────────────────────────────────────────────────────
     SORTERINGSKONTROLLEN — halve funnet var umålt.

     Funnet var todelt: «antallet 63 gjentas to ganger, OG
     sorteringskontrollen er en 35 px glyf uten ramme ved siden av en
     tilbakeknapp med 88 px flate». Bare den første halvdelen hadde port.
     Settes `background` og `borderColor` tilbake til 'transparent', ble
     alle de andre portene grønne — og slettet man sorteringen helt, merket
     ingen test det.

     Da flaten skulle gis, viste knappen seg dessuten å være DØD:
     `handleSort` var `void fire('selection')` og ingenting mer. Derfor
     måler testene her BEGGE deler — at flaten finnes, og at den sorterer.
     ──────────────────────────────────────────────────────────────────── */

  it('sorteringsknappen har samme synlige flate som tilbakeknappen', () => {
    const blokk = /topbarAction:\s*\{([\s\S]*?)\n {2}\}/u.exec(KILDE)?.[1] ?? '';
    expect(blokk, 'fant ikke topbarAction-blokken').not.toBe('');

    // Selve funnet: glyfen sto uten flate.
    expect(blokk).not.toMatch(/background:\s*'transparent'/u);
    expect(blokk).not.toMatch(/border:\s*`?1px solid transparent/u);
    expect(blokk).toMatch(/background:\s*'var\(--dw-overlay\)'/u);
    // 44×44 er doktrinens minimum og samme flate som backBtn.
    expect(blokk).toMatch(/width:\s*44/u);
    expect(blokk).toMatch(/height:\s*44/u);
  });

  it('knappen sorterer faktisk — den var haptikk uten handling', async () => {
    const { sortGarmentItems } = await import('../plaggbibliotek-sort');
    const rader = [{ title: 'Ullgenser' }, { title: 'Bomullsbody' }, { title: 'Åklede' }];

    // Katalogmodus lar rekkefølgen stå som katalogen bestemte.
    expect(sortGarmentItems(rader, 'katalog').map((r) => r.title)).toEqual([
      'Ullgenser',
      'Bomullsbody',
      'Åklede',
    ]);

    // Alfabetisk må faktisk endre rekkefølgen — og norsk kollasjon setter Å
    // sist, ikke rett etter A slik en ren kodepunkt-sortering ville.
    const alfabetisk = sortGarmentItems(rader, 'alfabetisk').map((r) => r.title);
    expect(alfabetisk).toEqual(['Bomullsbody', 'Ullgenser', 'Åklede']);
    expect(alfabetisk).not.toEqual(rader.map((r) => r.title));
  });

  it('sorteringstilstanden er lesbar for skjermleser og bundet til lista', () => {
    // Uten aria-pressed er en toggle usynlig for skjermleser.
    expect(KILDE).toMatch(/aria-pressed=\{sortMode === 'alfabetisk'\}/u);
    // Og uten dette kallet er sorteringen frakoblet lista igjen.
    expect(KILDE).toMatch(/sortGarmentItems\(items, sortMode\)/u);
  });
});
