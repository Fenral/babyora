/**
 * cut-vintersokker — klipper vintersokk-renderet til gjennomsiktighet.
 *
 * ASSET-KONTRAKT (monter-assets.ts, 2026-08-03): filene i
 * public/illustrations/garments/ er UTKLIPP med gjennomsiktig bakgrunn —
 * «Skygger bor i UI-laget, ikke i asseten».
 *
 * Kilden er en render på FLAT HVIT bakgrunn. Vi kan derfor ikke terskle på
 * lysstyrke alene: sokkens lyseste partier ville forsvunnet sammen med
 * bakgrunnen. Vi flood-filler i stedet INNOVER FRA KANTEN, slik at bare
 * hvitt som HENGER SAMMEN med rammen fjernes. Hvite flekker inne i motivet
 * (høylys på strikken) blir stående fordi de ikke er naboer til kanten.
 *
 * Skriptet nekter å skrive filen om ikke alle tre målene holder:
 *   1. bakgrunnen faktisk ble fjernet (nok gjennomsiktige piksler),
 *   2. motivet står igjen (nok ugjennomsiktige piksler),
 *   3. ingen store hull inne i motivet (flood-fillen lekket ikke inn).
 * Et utklipp som «nesten» virker er verre enn ingen fil: det ser riktig ut
 * i miniatyr og feiler i detaljvisningen.
 */
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const INN = process.argv[2] ?? 'scratch-sokk/front.png';
const UT = process.argv[3] ?? 'public/illustrations/garments/vintersokker.png';

/* Hvor nær hvitt en piksel må være for å regnes som bakgrunn. Målt mot
   kilden: rammen ligger på 255,255,255; sokkens lyseste høylys på ~198. */
const HVIT_TERSKEL = 236;

const bilde = sharp(INN).ensureAlpha();
const { data, info } = await bilde.raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

const erHvit = (i) => data[i] >= HVIT_TERSKEL && data[i + 1] >= HVIT_TERSKEL && data[i + 2] >= HVIT_TERSKEL;

/* Flood fill fra hele rammen, iterativt (ingen rekursjon — 1M piksler). */
const bakgrunn = new Uint8Array(W * H);
const ko = [];
const dytt = (x, y) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const p = y * W + x;
  if (bakgrunn[p]) return;
  if (!erHvit(p * C)) return;
  bakgrunn[p] = 1;
  ko.push(p);
};
for (let x = 0; x < W; x += 1) { dytt(x, 0); dytt(x, H - 1); }
for (let y = 0; y < H; y += 1) { dytt(0, y); dytt(W - 1, y); }
while (ko.length) {
  const p = ko.pop();
  const x = p % W; const y = (p - x) / W;
  dytt(x + 1, y); dytt(x - 1, y); dytt(x, y + 1); dytt(x, y - 1);
}

/* MÅL 1 og 2 */
let gjennomsiktige = 0;
for (let p = 0; p < W * H; p += 1) {
  if (bakgrunn[p]) { data[p * C + 3] = 0; gjennomsiktige += 1; }
}
const totalt = W * H;
const andelBakgrunn = gjennomsiktige / totalt;
const andelMotiv = 1 - andelBakgrunn;

/* MÅL 3: hull. Et hull er en sammenhengende gjennomsiktig flate som IKKE
   henger sammen med rammen — den finnes ikke etter en kant-flood, så vi
   leter i stedet etter store HVITE flater som IKKE ble merket bakgrunn.
   Er de store, har flood-fillen ikke nådd inn der den burde. */
const sett = new Uint8Array(W * H);
let storsteHull = 0;
for (let p0 = 0; p0 < W * H; p0 += 1) {
  if (sett[p0] || bakgrunn[p0] || !erHvit(p0 * C)) continue;
  let n = 0;
  const stakk = [p0];
  sett[p0] = 1;
  while (stakk.length) {
    const p = stakk.pop();
    n += 1;
    const x = p % W; const y = (p - x) / W;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx; const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const q = ny * W + nx;
      if (sett[q] || bakgrunn[q] || !erHvit(q * C)) continue;
      sett[q] = 1; stakk.push(q);
    }
  }
  if (n > storsteHull) storsteHull = n;
}

console.log('bakgrunn fjernet: ' + (andelBakgrunn * 100).toFixed(1) + '%');
console.log('motiv beholdt:    ' + (andelMotiv * 100).toFixed(1) + '%');
console.log('største hvite flate inne i motivet: ' + storsteHull + ' px');

const feil = [];
if (andelBakgrunn < 0.35) feil.push('for lite bakgrunn fjernet (' + (andelBakgrunn * 100).toFixed(1) + '% < 35%) — terskelen traff ikke');
if (andelMotiv < 0.10) feil.push('for lite motiv igjen (' + (andelMotiv * 100).toFixed(1) + '% < 10%) — flood-fillen lekket inn i sokken');
if (storsteHull > 4000) feil.push('hull på ' + storsteHull + ' px inne i motivet — kilden er ikke lukket');

if (feil.length) {
  console.error('\nSKRIVER IKKE FILEN:');
  feil.forEach((f) => console.error('  · ' + f));
  process.exit(1);
}

const ut = await sharp(data, { raw: { width: W, height: H, channels: C } }).png().toBuffer();
writeFileSync(UT, ut);
console.log('\nskrev ' + UT);
