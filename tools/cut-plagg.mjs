/**
 * Klipper plagg-assetene fra sin innbakte bakgrunn.
 *
 * FUNNET (2026-08-03): alle 42 `public/monter/plagg-*.png` er HELT
 * ugjennomsiktige — under 0,5 % gjennomsiktige piksler. De er ikke utklipp;
 * bakgrunnen er en del av fila. Art bible-en krever det motsatte: «Skygger bor
 * i UI-laget, ikke i asseten. Assetene forblir rene utklipp.» Med innbakt
 * bakgrunn kan samme plagg ikke bo i begge temaer — en mork flate pa krem er
 * feil, og dybdekontrakten far ikke styre dem.
 *
 * Bakgrunnen er MALT ensartet mork espresso uten innbakt kontaktskygge, sa de
 * kan klippes maskinelt i stedet for a genereres pa nytt. Provekutt over alle
 * 42: 36 rene, 6 med plaggfarge naer bakgrunnen, 0 totalfeil.
 *
 * Pipelinen er den samme som cut-standing-mascot.mjs: flood-fill fra kantene
 * (aldri en global fargeterskel — den spiser plaggets egne morke partier),
 * deretter 1 px erosjon mot halo, og en RESIDUE-verifisering til slutt.
 *
 * Skriver ALDRI over originalene. Utdata gar til public/monter/klippet/, og
 * en QA-kontaktkopi legges i tools/garment-audit/. Byttet gjores forst nar
 * eier har sett arket.
 *
 *   node tools/cut-plagg.mjs            # klipp + rapport
 *   node tools/cut-plagg.mjs --sjekk    # kun mal, skriv ingenting
 */
import { createRequire } from 'node:module';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const INN = 'public/monter';
const UT = 'public/monter/klippet';
const ARK = 'tools/garment-audit';
const KUN_SJEKK = process.argv.includes('--sjekk');

/** Toleranse mot bakgrunnsfargen. Malt: hjornene varierer under 8, sa 34 gir
 *  rom for kompresjonsstoy uten a spise morke plagg. */
const TOL = 34;
/** Et plagg med mer enn denne andelen bakgrunnsfarge IGJEN inne i motivet har
 *  farge for naer bakgrunnen — flagges for tilsyn i stedet for a skrives. */
const RISIKO_GRENSE = 0.004;

const avstand = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);

async function klipp(navn) {
  const { data, info } = await sharp(join(INN, navn)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: ch } = info;
  const px = (x, y) => { const i = (y * W + x) * ch; return [data[i], data[i + 1], data[i + 2]]; };
  const bg = px(2, 2);

  // ── flood-fill fra alle kantpiksler ────────────────────────────────────
  const ute = new Uint8Array(W * H);
  const ko = [];
  for (let x = 0; x < W; x += 1) ko.push(x, 0, x, H - 1);
  for (let y = 0; y < H; y += 1) ko.push(0, y, W - 1, y);
  while (ko.length) {
    const y = ko.pop(), x = ko.pop();
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const i = y * W + x;
    if (ute[i] || avstand(px(x, y), bg) > TOL) continue;
    ute[i] = 1;
    ko.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }

  // ── 1 px erosjon innover: fjerner halo-randen fra komprimeringen ───────
  const erodert = Uint8Array.from(ute);
  for (let y = 1; y < H - 1; y += 1) for (let x = 1; x < W - 1; x += 1) {
    const i = y * W + x;
    if (ute[i]) continue;
    if (ute[i - 1] || ute[i + 1] || ute[i - W] || ute[i + W]) erodert[i] = 1;
  }

  // ── INNBAKT KONTAKTSKYGGE ──────────────────────────────────────────────
  // QA-arket avslorte morke flekker UNDER plaggene som overlevde flood-fillen.
  // De er MORKERE enn bakgrunnen, altsa utenfor toleransen, og omsluttet av
  // bakgrunn pa alle kanter — sa de blir sin egen komponent.
  // Min forste maling bommet: jeg sjekket en global topp/bunn-gradient, mens
  // skyggen er en liten lokal ellipse rett under plagget.
  // Art bible: «Skygger bor i UI-laget, ikke i asseten.» De skal bort.
  // Metode: behold BARE den storste sammenhengende komponenten. Alt annet er
  // enten skyggerest eller stoy.
  {
    const merke = new Int32Array(W * H).fill(-1);
    const storrelser = [];
    for (let start = 0; start < erodert.length; start += 1) {
      if (erodert[start] || merke[start] !== -1) continue;
      const id = storrelser.length;
      let n = 0;
      const stabel = [start];
      merke[start] = id;
      while (stabel.length) {
        const i = stabel.pop();
        n += 1;
        const x = i % W, y = (i / W) | 0;
        for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
          if (j >= 0 && !erodert[j] && merke[j] === -1) { merke[j] = id; stabel.push(j); }
        }
      }
      storrelser.push(n);
    }
    let storst = 0;
    for (let i = 1; i < storrelser.length; i += 1) if (storrelser[i] > storrelser[storst]) storst = i;
    let fjernet = 0;
    for (let i = 0; i < erodert.length; i += 1) {
      if (!erodert[i] && merke[i] !== storst) { erodert[i] = 1; fjernet += 1; }
    }
    var losdeler = storrelser.length - 1, losPiksler = fjernet;
    var storsteLos = storrelser.filter((_, i) => i !== storst).reduce((a, c) => Math.max(a, c), 0);
    var losAndelAvMotiv = storrelser[storst] ? storsteLos / storrelser[storst] : 0;
  }

  // ── residue: bakgrunnsfarge som ble staaende inne i motivet ────────────
  let rest = 0, beholdt = 0;
  for (let i = 0; i < erodert.length; i += 1) {
    if (erodert[i]) continue;
    beholdt += 1;
    const x = i % W, y = (i / W) | 0;
    if (avstand(px(x, y), bg) <= 12) rest += 1;
  }
  const restAndel = rest / (W * H);

  // ── skriv alfa ─────────────────────────────────────────────────────────
  const ut = Buffer.from(data);
  for (let i = 0; i < erodert.length; i += 1) ut[i * ch + 3] = erodert[i] ? 0 : 255;

  return { W, H, ch, ut, restAndel, beholdtAndel: beholdt / (W * H), bg, losdeler, losPiksler, losAndelAvMotiv };
}

const filer = readdirSync(INN).filter((f) => f.startsWith('plagg-') && f.endsWith('.png'));
if (!KUN_SJEKK) { mkdirSync(UT, { recursive: true }); mkdirSync(ARK, { recursive: true }); }

const rene = [], tilsyn = [];
for (const navn of filer) {
  const r = await klipp(navn);
  const post = { navn, rest: r.restAndel, beholdt: r.beholdtAndel, los: r.losdeler, losPx: r.losPiksler,
    losAndel: r.losAndelAvMotiv };
  // VAKT: en kontaktskygge er LITEN. Er den storste losdelen en merkbar andel
  // av motivet, har «behold storste komponent» spist en del av selve plagget —
  // en hatterand sett gjennom en apning, et morkt fôr, en lokk som ikke henger
  // sammen med hovedmassen. QA-arket avslorte nettopp det pa bottehatten.
  if (r.losAndelAvMotiv > 0.02) { post.grunn = `losdel er ${(r.losAndelAvMotiv * 100).toFixed(0)} % av motivet — trolig plagg, ikke skygge`; tilsyn.push(post); continue; }
  if (r.restAndel > RISIKO_GRENSE) { post.grunn = `${(r.restAndel * 100).toFixed(1)} % bakgrunnsfarge inne i motivet`; tilsyn.push(post); continue; }
  rene.push(post);
  if (!KUN_SJEKK) {
    await sharp(r.ut, { raw: { width: r.W, height: r.H, channels: r.ch } })
      .png({ compressionLevel: 9 }).toFile(join(UT, navn));
  }
}

console.log(`\n── cut-plagg: ${filer.length} plagg ──`);
console.log(`  ${rene.length} klippet rent${KUN_SJEKK ? ' (ikke skrevet — --sjekk)' : ` → ${UT}/`}`);
const medSkygge = rene.filter((r) => r.los > 0);
console.log(`  ${medSkygge.length} hadde innbakt kontaktskygge/løsdeler som er fjernet` +
  ` (${medSkygge.reduce((a, c) => a + c.losPx, 0)} piksler totalt)`);
console.log(`  ${tilsyn.length} holdt tilbake for tilsyn (plaggfarge nær bakgrunnen):`);
for (const t of tilsyn) console.log(`      ${t.navn.padEnd(30)} ${t.grunn}`);
console.log(`\n  De tilbakeholdte skrives IKKE. Veien videre for dem er å re-generere`);
console.log(`  mot magenta bakgrunn — «aldri rens det generering kan la være å lage».`);

if (!KUN_SJEKK && rene.length) {
  // Kontaktark for menneskelig AD-sjekk. Automatikk måler kant og utsnitt;
  // aldri om ulla ser ut som ull (art bible, QA per asset).
  const kol = 6, rute = 150;
  const rader = Math.ceil(rene.length / kol);
  const lag = await Promise.all(rene.map(async (r, i) => ({
    input: await sharp(join(UT, r.navn)).resize(rute - 16, rute - 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(),
    left: (i % kol) * rute + 8, top: ((i / kol) | 0) * rute + 8,
  })));
  await sharp({ create: { width: kol * rute, height: rader * rute, channels: 4, background: { r: 241, g: 233, b: 218, alpha: 1 } } })
    .composite(lag).png().toFile(join(ARK, 'klippet-pa-krem.png'));
  await sharp({ create: { width: kol * rute, height: rader * rute, channels: 4, background: { r: 30, g: 20, b: 12, alpha: 1 } } })
    .composite(lag).png().toFile(join(ARK, 'klippet-pa-espresso.png'));
  console.log(`\n  QA-kontaktark: ${ARK}/klippet-pa-krem.png og -espresso.png`);
  console.log(`  Begge temaer, fordi hele poenget med utklipp er at samme asset bor i begge.`);
}

process.exit(tilsyn.length ? 2 : 0);
