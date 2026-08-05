/**
 * monter-assets.alfa — plagg-assetene skal være rene UTKLIPP, aldri bilder med
 * innbakt bakgrunn.
 *
 * Art bible-en (docs/design-notes/art-bible-2026-08-02.md, «Teknisk
 * produksjon»): «Skygger bor i UI-laget, ikke i asseten. […] assetene forblir
 * rene utklipp.» Grunnen er ikke estetisk pedanteri: et asset med innbakt
 * bakgrunn maler sin egen espresso-flate oppå kremen i lys modus, så SAMME
 * asset kan ikke bo i begge temaer — og dybdekontrakten (--dw-depth- og
 * --dw-sh-tokenene) får aldri styre skyggen, fordi asseten har sin egen.
 *
 * DEFEKTEN denne testen lukker (målt 2026-08-03, før byttet): alle 42
 * `public/monter/plagg-*.png` hadde **0,000 %** gjennomsiktige piksler, mens
 * de 11 andre assetene i SAMME mappe (maskot + værikoner) lå på 74–83 %.
 * Plaggene var det eneste som brøt kontrakten. Uten en test kunne en ny
 * generert batch trille inn med bakgrunn igjen uten at noen så det før på
 * telefonen, i lys modus.
 *
 * ── FORUTSETNINGER, ikke bare krav ──────────────────────────────────────────
 * Lærdom fra verify-hjem: en port som passerer på FRAVÆR er ikke en port.
 * Denne testen kan derfor ikke bestå ved at den ikke finner noe, eller ved at
 * målemetoden svarer «utklipp» på alt:
 *
 *   1. FILSETT: filene på disk må stemme nøyaktig med MONTER_GARMENT_SLUGS
 *      (samme liste som getGarmentImage faktisk peker på). Null filer, eller
 *      41 av 42, er en FEIL — ikke en stille pass.
 *   2. NEGATIV KONTROLL: en syntetisk, helt ugjennomsiktig 512×512-flate lages
 *      i minnet og MÅ klassifiseres som «ikke utklipp». Kan detektoren ikke si
 *      NEI, betyr et JA ingenting.
 *   3. POSITIV KONTROLL: maskot- og vær-assetene i samme mappe var utklipp
 *      allerede før dette arbeidet, og MÅ måles som utklipp. Fanger en
 *      terskel eller en sharp-lesing som har begynt å svare feil vei.
 *   4. UNNTAKET FORELDES: plagg-sydvest.png står med manuell maske til gode
 *      (tools/cut-plagg.mjs sin MANUELL-liste). Testen krever at unntaket
 *      fortsatt ER ugjennomsiktig — blir sydvesten maskert, stryker testen og
 *      ber deg fjerne unntaket. Et unntak som overlever sin egen grunn er en
 *      løgn i testsuiten.
 */
import { createRequire } from 'node:module';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { MONTER_GARMENT_SLUGS } from '../monter-assets.js';

const require = createRequire(import.meta.url);
// sharp er en native CJS-modul; createRequire holder den utenfor Vites
// modulgraf (samme grep som tools/cut-plagg.mjs).
const sharp = require('sharp') as typeof import('sharp');

const ROOT = process.cwd();
const MONTER = resolve(ROOT, 'public/monter');
const CUTTER = resolve(ROOT, 'tools/cut-plagg.mjs');

/** Alfa under dette regnes som gjennomsiktig (PNG-komprimering gir ikke
 *  eksakt 0 i alle kodere). */
const ALFA_GULV = 8;

/**
 * Nedre grense for hvor mye av flaten et ekte utklipp har som gjennomsiktig.
 * Målt fasit: de 41 klippede plaggene ligger 64,4–90 %, værikonene 77,8–83,2 %.
 * 15 % er derfor over 4× margin under det laveste ekte utklippet, men godt
 * OVER det en juks-variant ville gitt: en 10 px gjennomsiktig ramme rundt et
 * 512×512-bilde er 7,7 %, en 1 px ramme 0,8 %. Grensen skiller «ekte utklipp»
 * fra «noen la på en kant for å blidgjøre testen».
 */
const MIN_GJENNOMSIKTIG_ANDEL = 0.15;

type AlfaMaal = Readonly<{
  fil: string;
  bredde: number;
  hoyde: number;
  gjennomsiktigAndel: number;
  hjorner: readonly number[];
}>;

async function malAlfa(fil: string, bilde: string | Buffer): Promise<AlfaMaal> {
  const { data, info } = await sharp(bilde)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let gjennomsiktige = 0;
  for (let i = 0; i < width * height; i += 1) {
    if (data[i * channels + 3] < ALFA_GULV) gjennomsiktige += 1;
  }
  const hjorner = ([[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]] as const)
    .map(([x, y]) => data[(y * width + x) * channels + 3]);
  return {
    fil,
    bredde: width,
    hoyde: height,
    gjennomsiktigAndel: gjennomsiktige / (width * height),
    hjorner,
  };
}

/** Et utklipp har gjennomsiktige hjørner OG en reell gjennomsiktig andel.
 *  Hjørnene alene fanges av en 1 px-ramme; andelen alene av et bilde med
 *  gjennomsiktig motiv midt i en ugjennomsiktig ramme. Begge kreves. */
function erUtklipp(m: AlfaMaal): boolean {
  return m.hjorner.every((a) => a < ALFA_GULV)
    && m.gjennomsiktigAndel >= MIN_GJENNOMSIKTIG_ANDEL;
}

const beskriv = (m: AlfaMaal) =>
  `${m.fil}: ${(m.gjennomsiktigAndel * 100).toFixed(2)} % gjennomsiktig, `
  + `hjørne-alfa [${m.hjorner.join(', ')}]`;

/** MANUELL-listen i tools/cut-plagg.mjs — assets der automatisk klipping ikke
 *  holder og som venter på håndmaskering. Leses fra kilden i stedet for å
 *  kopieres, slik at unntakslisten ikke kan vokse to steder uavhengig. */
function manuellListeFraCutter(): readonly string[] | null {
  const kilde = readFileSync(CUTTER, 'utf8');
  const start = kilde.indexOf('const MANUELL = {');
  /* En TOM liste skrives `const MANUELL = {};` — da finnes ingen `\n};`.
     Uten dette returnerte parseren [] både når lista var tom OG når den
     ikke ble funnet, og de to tilstandene betyr stikk motsatte ting. */
  if (start < 0) return null;
  const slutt = kilde.indexOf('};', start);
  if (slutt < 0) return null;
  return [...kilde.slice(start, slutt).matchAll(/'(plagg-[a-z0-9-]+\.png)'\s*:/g)]
    .map((treff) => treff[1]);
}

const plaggFiler = readdirSync(MONTER)
  .filter((f) => f.startsWith('plagg-') && f.endsWith('.png'))
  .sort();

/** Allerede-korrekte utklipp i SAMME mappe — den positive kontrollen. */
const KONTROLL_UTKLIPP = readdirSync(MONTER)
  .filter((f) => f.endsWith('.png') && (f.startsWith('vaer-') || f.startsWith('maskot')))
  .sort();

let maalt: readonly AlfaMaal[] = [];
let kontroll: readonly AlfaMaal[] = [];
let ugjennomsiktigKontroll: AlfaMaal;

describe('monter plagg-assets er rene utklipp', () => {
  beforeAll(async () => {
    maalt = await Promise.all(plaggFiler.map((f) => malAlfa(f, resolve(MONTER, f))));
    kontroll = await Promise.all(KONTROLL_UTKLIPP.map((f) => malAlfa(f, resolve(MONTER, f))));
    // Syntetisk, helt ugjennomsiktig flate i espresso — samme størrelse som
    // de ekte assetene. Lages i minnet, aldri skrevet til disk.
    const flate = await sharp({
      create: { width: 512, height: 512, channels: 4, background: { r: 30, g: 20, b: 12, alpha: 1 } },
    }).png().toBuffer();
    ugjennomsiktigKontroll = await malAlfa('(syntetisk ugjennomsiktig flate)', flate);
  }, 60_000);

  it('FORUTSETNING 1: filsettet på disk er nøyaktig de slugene oppslaget peker på', () => {
    // Uten denne kan testen «bestå» ved å ikke finne noen filer i det hele tatt.
    expect(plaggFiler.length).toBeGreaterThan(0);
    const forventet = MONTER_GARMENT_SLUGS.map((s) => `plagg-${s}.png`).sort();
    expect(plaggFiler).toEqual(forventet);
    expect(plaggFiler).toHaveLength(42);
  });

  it('FORUTSETNING 2: detektoren sier NEI til en helt ugjennomsiktig flate', () => {
    // Kan den ikke si nei, betyr et ja ingenting.
    expect(ugjennomsiktigKontroll.gjennomsiktigAndel).toBe(0);
    expect(erUtklipp(ugjennomsiktigKontroll)).toBe(false);
  });

  it('FORUTSETNING 3: maskot- og værassetene i samme mappe måles som utklipp', () => {
    // De var utklipp før dette arbeidet. Stryker de, er det målemetoden som
    // har flyttet seg — ikke plaggene.
    expect(kontroll.length).toBeGreaterThanOrEqual(8);
    const feil = kontroll.filter((m) => !erUtklipp(m));
    expect(feil.map(beskriv)).toEqual([]);
  });

  it('KRAV: ingen plagg-asset er helt ugjennomsiktig — bakgrunnen bor i UI-laget', () => {
    const unntak = new Set(manuellListeFraCutter());
    const kandidater = maalt.filter((m) => !unntak.has(m.fil));
    // Unntakslisten kan ikke sluke hele testen.
    expect(kandidater.length).toBeGreaterThanOrEqual(plaggFiler.length - 1);

    const innbaktBakgrunn = kandidater.filter((m) => !erUtklipp(m));
    expect(
      innbaktBakgrunn.map(beskriv),
      'Disse assetene har innbakt bakgrunn. Art bible: «Skygger bor i UI-laget, '
      + 'ikke i asseten; assetene forblir rene utklipp.» Klipp dem med '
      + 'tools/cut-plagg.mjs, eller legg dem i MANUELL-listen der med en grunn.',
    ).toEqual([]);
  });

  it('KRAV: utklippene beholder 512×512 — ingen bbox-krymping som endrer skala i vitrinen', () => {
    // Klippingen skal fjerne bakgrunn, ikke normalisere utsnittet: plagget må
    // ligge på samme piksler som før, ellers skifter visuell skala mellom
    // plagg som er klippet og plagg som ikke er det.
    for (const m of maalt) {
      expect(`${m.fil} ${m.bredde}×${m.hoyde}`).toBe(`${m.fil} 512×512`);
    }
  });

  it('FORUTSETNING 4: MANUELL-listen inneholder ingen foreldede fritak', () => {
    /* OMSKREVET 2026-08-06. Testen krevde at lista IKKE var tom, som en
       ikke-vakuøsitetsvakt: «finner vi ingenting, har parsingen røket».
       Den antakelsen holdt så lenge det FANTES et unntak. Da sydvesten ble
       klippet og lista ble lovlig tom, ble testen rød av at jobben var
       gjort — akkurat den feilen dette filhodet selv advarer mot, bare med
       motsatt fortegn.
       Nå skiller parseren de to tilstandene: `null` = fant ikke lista
       (parsingen røk), `[]` = lista finnes og er tom (alt er klippet).
       Vakten står altså igjen — den måler bare riktig ting. */
    const unntak = manuellListeFraCutter();
    expect(existsSync(CUTTER), `${CUTTER} finnes ikke — unntakslisten kan ikke verifiseres`).toBe(true);
    expect(
      unntak,
      'fant ikke MANUELL-erklæringen i tools/cut-plagg.mjs — parsingen har røket',
    ).not.toBeNull();
    for (const fil of unntak ?? []) {
      const m = maalt.find((x) => x.fil === fil);
      expect(m, `${fil} står i MANUELL-listen, men finnes ikke i public/monter/`).toBeDefined();
      expect(
        erUtklipp(m!),
        `${fil} ER nå et utklipp (${(m!.gjennomsiktigAndel * 100).toFixed(2)} % gjennomsiktig) `
        + '— fjern den fra MANUELL-listen i tools/cut-plagg.mjs. Et unntak som '
        + 'overlever sin egen grunn skjuler neste regresjon.',
      ).toBe(false);
    }
  });
});
