/**
 * SYDVESTEN — den ene manuelle masken.
 *
 * ═══ HVORFOR DEN TRENGER SIN EGEN FIL ═════════════════════════════════════
 * `cut-plagg.mjs` klarer 41 av 42 plagg. Sydvesten er den ene den holder
 * tilbake, og den forklarer selv hvorfor:
 *
 *   «morkegronn hakestropp ligger innenfor toleransen mot morkebrun
 *    bakgrunn — flood-fill gaar tvers gjennom stroppen og etterlater tenner.
 *    Ekte mattingsproblem, ikke terskelproblem.»
 *
 * Den diagnosen er riktig, og den er grunnen til at en STRAMMERE terskel
 * ikke hjelper: senker man toleransen, blir bakgrunnen stående igjen som en
 * ramme; hever man den, spises stroppen. Aksen er feil.
 *
 * ═══ MÅLT 2026-08-05: DE ER SKILLBARE PÅ FARGETONE ════════════════════════
 * Histogram over alle piksler i bakgrunnens lyshetsbånd (±12 %):
 *
 *     hue  20–30°   186 424 piksler   ← bakgrunn (brun, 25°)
 *     hue  50–70°    19 272 piksler   ← stroppen (gulgrønn)
 *
 * To klynger med ~25–45° mellomrom. Avstand i RGB skiller dem ikke; HUE gjør
 * det med god margin. Denne filen bytter derfor akse i stedet for terskel:
 * en piksel regnes som bakgrunn bare hvis den er nær i BÅDE farge OG
 * fargetone. Resten av pipelinen er husets egen — flood-fill fra kantene
 * (aldri en global terskel), 1 px erosjon mot halo, og residue-verifisering.
 *
 * SKRIVER ALDRI OVER ORIGINALEN. Utdata går til public/monter/klippet/,
 * samme sted som cut-plagg.mjs, slik at byttet gjøres samlet når eier har
 * sett arket.
 *
 *   node tools/cut-sydvest.mjs           # klipp + rapport
 *   node tools/cut-sydvest.mjs --sjekk   # kun mål, skriv ingenting
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const ROT = process.cwd();
const INN = join(ROT, 'public/monter/plagg-sydvest.png');
const UT_KAT = join(ROT, 'public/monter/klippet');
const UT = join(UT_KAT, 'plagg-sydvest.png');
const BARE_SJEKK = process.argv.includes('--sjekk');

/** Samme grunnterskel som cut-plagg.mjs — aksen er det som er ny. */
const TOL = 34;
/**
 * Hvor mye fargetonen får avvike fra bakgrunnens før pikselen IKKE lenger
 * regnes som bakgrunn. 18° er valgt med margin: klyngene ligger 25–45° fra
 * hverandre, så halvparten av det minste gapet gir slingringsmonn begge veier.
 */
const HUE_TOL = 18;
/** Under denne metningen er hue meningsløs (nær gråtone) — da teller kun avstand. */
const METNING_GULV = 0.05;

function hue([r, g, b]) {
  const R = r / 255; const G = g / 255; const B = b / 255;
  const maks = Math.max(R, G, B); const min = Math.min(R, G, B);
  const d = maks - min;
  if (d === 0) return { h: 0, s: 0 };
  let h;
  if (maks === R) h = ((G - B) / d) % 6;
  else if (maks === G) h = (B - R) / d + 2;
  else h = (R - G) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  const l = (maks + min) / 2;
  return { h, s: d / (1 - Math.abs(2 * l - 1)) };
}

const hueAvstand = (a, b) => Math.abs(((a - b + 540) % 360) - 180);

const { data, info } = await sharp(INN).ensureAlpha().raw()
  .toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const K = 4;
const les = (i) => [data[i * K], data[i * K + 1], data[i * K + 2]];

/* Bakgrunnen leses av hjørnene, ikke antas. */
const hjorner = [0, W - 1, (H - 1) * W, H * W - 1].map(les);
const bg = [0, 1, 2].map((k) => Math.round(hjorner.reduce((s, c) => s + c[k], 0) / hjorner.length));
const bgHue = hue(bg);

const erBakgrunn = (i) => {
  const c = les(i);
  const avstand = Math.abs(c[0] - bg[0]) + Math.abs(c[1] - bg[1]) + Math.abs(c[2] - bg[2]);
  if (avstand > TOL * 3) return false;
  const { h, s } = hue(c);
  /* Nær gråtone: hue bærer ingen informasjon, så avstanden får bestemme. */
  if (s < METNING_GULV || bgHue.s < METNING_GULV) return true;
  return hueAvstand(h, bgHue.h) <= HUE_TOL;
};

/* ── Flood-fill fra kantene ─────────────────────────────────────────────── */
const maske = new Uint8Array(W * H); // 1 = bakgrunn
const ko = [];
for (let x = 0; x < W; x += 1) { ko.push(x, (H - 1) * W + x); }
for (let y = 0; y < H; y += 1) { ko.push(y * W, y * W + W - 1); }
let hode = 0;
while (hode < ko.length) {
  const i = ko[hode]; hode += 1;
  if (maske[i]) continue;
  if (!erBakgrunn(i)) continue;
  maske[i] = 1;
  const x = i % W; const y = (i - x) / W;
  if (x > 0) ko.push(i - 1);
  if (x < W - 1) ko.push(i + 1);
  if (y > 0) ko.push(i - W);
  if (y < H - 1) ko.push(i + W);
}

/* ── OMSLUTTEDE BAKGRUNNSHULL ───────────────────────────────────────────
   Flood-fill fra kantene når ikke inn i lueåpningen. MÅLT: residue etter
   kant-passet er 7082 px fordelt på 503 komponenter — men ÉN av dem er 5330
   px (åpningen), og 492 av dem er under 20 px (til sammen 956 px, altså
   antialiasing langs kanten, ikke hull).
   Terskelen på 30 px skiller derfor de to tingene med god margin: den tar de
   åtte ekte hullene og lar flekkene være. Å ta flekkene også ville betydd å
   spise enkeltpiksler inne i motivet — samme feilklasse som å senke
   toleransen. Samme grep som cut-plagg.mjs gjør for 18 andre plagg. */
const HULL_GULV = 30;
{
  const sett = new Uint8Array(W * H);
  for (let start = 0; start < W * H; start += 1) {
    if (maske[start] || sett[start] || !erBakgrunn(start)) continue;
    const komponent = [start];
    sett[start] = 1;
    const stabel = [start];
    while (stabel.length > 0) {
      const i = stabel.pop();
      const x = i % W; const y = (i - x) / W;
      const naboer = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1,
        y > 0 ? i - W : -1, y < H - 1 ? i + W : -1];
      for (const j of naboer) {
        if (j < 0 || sett[j] || maske[j] || !erBakgrunn(j)) continue;
        sett[j] = 1;
        komponent.push(j);
        stabel.push(j);
      }
    }
    if (komponent.length >= HULL_GULV) for (const i of komponent) maske[i] = 1;
  }
}

/* ── 1 px erosjon innover: halo-randen fra komprimeringen ───────────────── */
const utvidet = Uint8Array.from(maske);
for (let y = 0; y < H; y += 1) {
  for (let x = 0; x < W; x += 1) {
    const i = y * W + x;
    if (maske[i]) continue;
    const nabo = (maske[i - 1] && x > 0) || (maske[i + 1] && x < W - 1)
      || (maske[i - W] && y > 0) || (maske[i + W] && y < H - 1);
    if (nabo) utvidet[i] = 1;
  }
}

let gjennomsiktige = 0;
for (let i = 0; i < W * H; i += 1) {
  if (utvidet[i]) { data[i * K + 3] = 0; gjennomsiktige += 1; }
}

/* ── RESIDUE: bakgrunnsfarge som ble stående INNE i motivet ─────────────── */
let residue = 0;
for (let i = 0; i < W * H; i += 1) {
  if (utvidet[i]) continue;
  if (erBakgrunn(i)) residue += 1;
}

/* ── STROPPEN: overlevde den? Det er hele grunnen til at fila finnes. ───── */
let stropp = 0;
for (let i = 0; i < W * H; i += 1) {
  if (utvidet[i]) continue;
  const { h, s } = hue(les(i));
  if (s >= METNING_GULV && h >= 45 && h <= 75) stropp += 1;
}

const andel = (n) => `${((n / (W * H)) * 100).toFixed(1)} %`;
console.log('── cut-sydvest ──');
console.log(`  bakgrunn lest av hjørnene: rgb(${bg.join(',')}) · hue ${bgHue.h.toFixed(0)}°`);
console.log(`  gjennomsiktig etter kutt:  ${gjennomsiktige} px (${andel(gjennomsiktige)})`);
console.log(`  residue (bakgrunn igjen):  ${residue} px (${andel(residue)})`);
console.log(`  hakestroppen overlevde:    ${stropp} px i hue 45–75°`);

/* Gulvene er MÅLTE, ikke valgte: stroppen ble målt til ~19 000 px før kutt.
   Overlever under halvparten, har hue-aksen ikke reddet den, og da skal
   verktøyet si fra i stedet for å skrive en fil som ser rimelig ut. */
const OK_STROPP = stropp >= 9000;
const OK_RESIDUE = residue < W * H * 0.005;
const OK_KUTT = gjennomsiktige > W * H * 0.10;

if (!OK_STROPP) console.log('  ✗ STROPPEN ER SPIST — hue-aksen holdt ikke. Ikke skrevet.');
if (!OK_RESIDUE) console.log('  ✗ FOR MYE RESIDUE — bakgrunn står igjen inne i motivet. Ikke skrevet.');
if (!OK_KUTT) console.log('  ✗ FOR LITE KUTTET — flood-fill kom ikke inn. Ikke skrevet.');

if (OK_STROPP && OK_RESIDUE && OK_KUTT) {
  if (BARE_SJEKK) {
    console.log('  ✓ alle tre målene holder (--sjekk: ingenting skrevet)');
  } else {
    mkdirSync(UT_KAT, { recursive: true });
    await sharp(data, { raw: { width: W, height: H, channels: K } }).png().toFile(UT);
    console.log(`  ✓ skrevet: ${UT}`);
  }
} else {
  process.exitCode = 1;
}
