#!/usr/bin/env node
/* F80: clay-versjoner av HELE plaggbiblioteket (62 plagg) for porten fra
 * flat-stil garments/ til clay-verdenen. Magenta chroma-key-pipeline
 * (samme mønster som f79-final-pipeline.mjs / f79-kald-thumbs.mjs).
 *
 * VIKTIG: skriver til public/illustrations/garments-clay/ — gamle
 * public/illustrations/garments/ er LIVE i prod og røres IKKE før porten
 * er ferdig.
 *
 * Fargeregler (docs/F79/morgennatt-cta-analyse.md, plaggfarge-seksjonen):
 * naturlige klesfarger harmonisert mot Morgennatt — ull-toner
 * (oat/krem/grå-melert), korall/rust for innerst-plagg, marigold/oker for
 * mellomlag, petrol/skifer for yttertøy. ALDRI magenta/rosa, ALDRI ren
 * svart/hvit. Soveposer koder TOG som krem→oker→petrol-ramp.
 *
 * Resumable: hopper over plagg som allerede har raw + ferdig PNG.
 * Fortsetter ved enkelt-feil, rapporterer feilede til slutt.
 * Exit 0 hvis ≥90 % OK, ellers exit 1.
 *
 * Kost: 62 × ~$0.134 ≈ $8,31 ≈ ~87 NOK (kun for bilder som faktisk genereres).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(__filename));

let API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  try {
    API_KEY = readFileSync(
      'C:\\Users\\SkotvoldSivertSende\\OneDrive - IdrettsKontor\\Skrivebord\\nano banan 2.txt',
      'utf8',
    ).trim();
  } catch {}
}
if (!API_KEY) { console.error('mangler GEMINI_API_KEY'); process.exit(1); }

const API = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image:generateContent?key=${API_KEY}`;
const OUT = join(ROOT, 'public', 'illustrations', 'garments-clay');
const RAW = join(OUT, 'raw');
mkdirSync(RAW, { recursive: true });

const FORCE = process.argv.includes('--force');
const USD_PER_IMAGE = 0.134;
const NOK_PER_USD = 10.5;

const BASE_RULES = `A single piece of baby clothing/accessory, floating, shaped
with soft internal volume as if worn by a chubby 10-month-old baby who is
invisible. NOT flat, NOT folded, NOT a product photo.
Soft 3D claymation render, hand-sculpted plasticine, matte material, soft
top-left studio lighting, premium app-mascot quality.
Item fills ~75-80% of canvas, centered, front-facing, square 1:1.
No text, no watermarks. The item must never contain magenta/pink.
BACKGROUND (CRITICAL): SOLID BRIGHT MAGENTA (#FF00FF), flat and uniform,
covering all canvas outside the item. No gradient, no checkerboard.`;

/* 62 plagg fra src/data/garment-illustrations.ts (MAP, unike id-er) med
 * beskrivelser avledet av src/data/garment-info.ts. De 9 «alternativ»-id-ene
 * (tynn-fleece, fleecedress, fleecejakke, fleecebukse, tykk-fleece,
 * fleecevotter, bomullssokker, bomullssett, tynne-sko) er utelatt — de har
 * ingen beskrivelse i garment-info.ts og dekkes av PLACEHOLDER_PNG. */
const GARMENTS = [
  // ---------- Innerst (korall/rust-familien for ull, krem/oat for bomull) ----------
  { id: 'kortermet-body', text: `A short-sleeve baby bodysuit in light cotton, warm cream (#E8DFCE), snap buttons at the crotch, smooth soft jersey clay surface, both short sleeves slightly out to the sides.` },
  { id: 'kortermet-ullbody', text: `A short-sleeve merino wool baby bodysuit in soft muted coral (#DE7E5C), snap buttons at the crotch, fine brushed wool clay texture, both short sleeves slightly out.` },
  { id: 'langermet-body', text: `A long-sleeve baby bodysuit in light cotton, soft oat (#E3D9C6), snap buttons at the crotch, smooth jersey clay surface, T-shape with both sleeves slightly out.` },
  { id: 'langermet-ullbody', text: `A long-sleeve merino wool baby bodysuit in warm coral/terracotta (#D96B4A), snap buttons at the crotch, soft brushed wool clay. T-shape: both sleeves slightly out to the sides.` },
  { id: 'langermet-ullbody-tynn', text: `A THIN long-sleeve merino wool baby bodysuit in light muted apricot-coral (#E5936F), visibly thinner and lighter knit than a standard wool body, snap buttons at the crotch, both sleeves slightly out.` },
  { id: 'ullsett-tynt', text: `A two-piece THIN merino wool baby set — long-sleeve top and separate leggings shown together as one outfit — in soft rust-coral (#C97757), fine thin-knit texture, the top slightly overlapping the leggings waist.` },
  { id: 'ullsett-tykt', text: `A two-piece THICK merino wool baby set — long-sleeve top and separate leggings shown together as one outfit — in deep rust (#B85A3C), chunky ribbed knit texture, clearly warmer and plumper than a thin set.` },
  { id: 'to-ullsett', text: `TWO wool baby sets layered on top of each other: an outer set in deep rust (#B85A3C) worn slightly open at the neck and cuffs so an inner set in lighter coral (#DE7E5C) peeks out. Double-layer plumpness.` },
  { id: 't-skjorte', text: `A plain short-sleeve baby t-shirt in cotton, warm oat (#D9CDB4), smooth jersey clay, both short sleeves slightly out.` },
  { id: 'shorts', text: `Small baby cotton shorts with an elastic waistband in muted grey-blue heather (#7A8699), both short legs shaped as if filled by chubby baby thighs.` },
  { id: 'lett-bukse', text: `Light soft baby trousers in cotton jersey, oat-grey melange (#B3A88F), elastic waistband, both legs shaped as if filled by chubby baby legs.` },
  { id: 'bleie', text: `A simple soft cloth baby diaper in warm off-white cream (#EDE6D6), rounded plump shape as if worn, soft fabric folds at the waist.` },
  { id: 'ullsokker', text: `A PAIR of thick wool baby socks in warm oat/cream (#C8B99A) with ribbed cuffs, shaped as if filled by tiny baby feet, shown side by side, cozy chunky knit texture.` },

  // ---------- Mellomlag (marigold/oker-familien; bukser i petrol-grå) ----------
  { id: 'tynn-bukse', text: `Thin soft baby jersey trousers in heather grey-blue (#7A8699), elastic waistband, slim legs shaped as if filled by chubby baby legs, visibly lighter than wool trousers.` },
  { id: 'tynn-ull-mellomlag', text: `A THIN wool mid-layer baby sweater in light marigold (#E0A94F), fine knit texture, ribbed hem and cuffs, both sleeves slightly out.` },
  { id: 'ull-mellomlag', text: `A knitted wool mid-layer baby sweater in golden marigold/ochre (#D9962B) with big chunky visible knit stitches, both sleeves slightly out, ribbed hem and cuffs.` },
  { id: 'ull-mellomlag-tykt', text: `A THICK heavy-knit wool baby sweater in deep ochre (#B67C1E), extra chunky plump knit stitches, ribbed hem and cuffs, visibly warmer than a standard sweater.` },
  { id: 'ull-jakke', text: `A knitted wool baby cardigan with a front zipper in ochre-marigold (#C98A2A), chunky knit texture, small soft collar, both sleeves slightly out.` },
  { id: 'ull-bukse', text: `Knitted wool baby trousers in muted blue-grey petrol (#5A7480), elastic waistband, ribbed ankle cuffs, both legs shaped as if filled by chubby baby legs, visible knit texture.` },
  { id: 'tynn-pyjamas', text: `A THIN two-piece baby pyjama — long-sleeve top and trousers shown together — in soft dusty blue-grey (#8C9BAB), smooth light cotton clay, ribbed cuffs.` },
  { id: 'pyjamas', text: `A two-piece baby pyjama — long-sleeve top and trousers shown together — in muted heather lavender-grey (#8B84A3), soft cotton clay, ribbed cuffs and hems.` },
  { id: 'ull-pyjamas', text: `A two-piece WOOL baby pyjama — long-sleeve top and trousers shown together — in deep heather purple-grey (#5C5470), soft knit texture, ribbed cuffs, visibly warmer than cotton pyjamas.` },

  // ---------- Yttertøy (petrol/skifer-familien) ----------
  { id: 'lett-kjoredress', text: `A LIGHT one-piece baby pramsuit with hood (hood empty on top) and front zip, thin smooth shell fabric in light petrol (#4A7482), only slightly padded, full torso and both legs and arms shaped as if filled by a chubby baby.` },
  { id: 'kjoredress', text: `A one-piece baby pramsuit with hood (hood empty on top), moderate soft padding and front zip, petrol teal (#35707F) matte clay, full body shape as if filled by a chubby baby.` },
  { id: 'vinterkjoredress', text: `A padded one-piece WINTER baby pramsuit with hood, soft quilted sections and front zip, deep petrol (#2E5561), plump warm silhouette shaped as if filled by a chubby baby.` },
  { id: 'vinterkjoredress-isolert', text: `A MAXIMALLY insulated one-piece winter baby pramsuit with a big hood, extra thick puffy quilted sections, deep slate-petrol (#26424D), the plumpest warmest silhouette.` },
  { id: 'vinterdress', text: `A one-piece padded baby winter overall in deep forest-slate (#3A5248) with hood, front zip, soft puffy quilted sections, shaped as if filled by a complete chubby baby body — full torso, both legs, both arms slightly out, empty hood on top.` },
  { id: 'vinterdress-isolert', text: `An EXTRA-insulated puffy baby winter overall in deep forest green-slate (#2E443B) with hood and front zip, thick quilted sections, visibly plumper than a standard winter overall.` },
  { id: 'regntoy-skall', text: `A two-piece baby rain shell — hooded jacket and trousers shown together — in petrol rain-blue (#5A8CA8), smooth thin matte shell clay with subtle taped seams.` },
  { id: 'vindtett-skall', text: `A windproof baby shell jacket with hood and front zip in slate blue-grey (#64778C), smooth thin matte clay, both sleeves slightly out.` },

  // ---------- Ekstra: hodeplagg ----------
  { id: 'solhatt', text: `A baby sun hat with a wide soft brim and a small neck flap in warm oat (#D9C79E), light cotton clay, rounded as if fitting an invisible baby head.` },
  { id: 'lue-tynn', text: `A THIN knitted baby beanie in light heather grey-lavender (#8D86A0), fine knit texture, rounded as if fitting an invisible baby head.` },
  { id: 'lue', text: `A warm knitted baby beanie in deep heather purple-grey (#5C5470) with a small soft pom-pom on top and fold-up ribbed brim, rounded to fit a baby head, visible chunky knit stitches.` },
  { id: 'lue-m-ull', text: `A THICK wool baby hat with ear flaps and short tie strings in deep heather (#4E4763), chunky cozy knit, rounded as if fitting an invisible baby head.` },
  { id: 'balaklava', text: `A baby balaclava covering head, ears and neck in one soft piece, slate blue-grey (#4A5568) soft knit, with an empty round face opening (the baby is invisible), shaped as if worn.` },

  // ---------- Ekstra: hender (par) ----------
  { id: 'votter-tynne', text: `A PAIR of THIN knitted baby mittens in light coral-rust (#C97757), thumbless baby style with ribbed cuffs, fine knit, shown side by side angled slightly toward each other.` },
  { id: 'votter', text: `A PAIR of small baby wool mittens in warm coral-rust (#B85A3C), thumbless baby style with ribbed cuffs, shown side by side angled slightly toward each other, soft wool clay texture.` },
  { id: 'votter-tykke', text: `A PAIR of THICK chunky wool baby mittens in deep rust (#A04E33), thumbless with ribbed cuffs, extra plump, shown side by side angled slightly toward each other.` },
  { id: 'votter-dun', text: `A PAIR of puffy DOWN-filled baby mittens in deep petrol-slate (#46656F) with soft quilted sections and snug cuffs, maximum plumpness, shown side by side.` },
  { id: 'vindvotter-skall', text: `A PAIR of windproof SHELL baby mittens in slate blue-grey (#64778C), smooth thin matte clay with long cuffs, shown side by side angled slightly toward each other.` },

  // ---------- Ekstra: hals ----------
  { id: 'hals', text: `A baby neck warmer / tube scarf (buff) in oat-cream melange (#C8B99A), a soft chunky-knit ring shape with soft internal volume as if around an invisible baby neck.` },

  // ---------- Ekstra: føtter (par) ----------
  { id: 'sko', text: `A PAIR of small everyday baby shoes with velcro straps in warm oat-brown (#A89272), soft rounded toes, shown side by side angled slightly toward each other.` },
  { id: 'toffel-sko', text: `A PAIR of soft baby slipper shoes in felted wool, warm taupe (#9C8A74), soft rounded slip-on shape, shown side by side angled slightly toward each other.` },
  { id: 'sandaler', text: `A PAIR of small baby summer sandals with soft rounded straps in warm tan (#B59A78), open toes, shown side by side angled slightly toward each other.` },
  { id: 'vintersko', text: `A PAIR of baby winter boots with matte rubber soles in slate blue-grey (#4E5D6B), velcro straps, softly padded shafts, shown side by side angled slightly toward each other.` },
  { id: 'vintersko-isolerte', text: `A PAIR of THICK insulated baby winter boots in deep slate (#3C4A57), extra puffy padded shafts with a warm oat (#C8B99A) lining rim, shown side by side angled slightly toward each other.` },

  // ---------- Ekstra: vogn-tilbehør ----------
  { id: 'tynt-teppe', text: `A thin soft baby muslin blanket in warm cream (#E5DCC8), draped with soft rounded volume as if gently laid over an invisible baby, soft fabric folds.` },
  { id: 'dunteppe', text: `A thick quilted DOWN baby blanket in warm oat (#CFC0A5), puffy quilted squares, draped with soft rounded plump volume as if laid over an invisible baby.` },
  { id: 'varmepose-lett', text: `A LIGHT pram footmuff (stroller sleeping bag) in light petrol (#6E93A6), thin shell with a soft oat lining visible at the opening, slim rounded bag shape with soft internal volume.` },
  { id: 'varmepose', text: `A padded pram footmuff (stroller sleeping bag) with a front zipper in petrol (#4A7482), soft oat lining at the rim, plump rounded bag shape with soft internal volume.` },
  { id: 'varmepose-dun', text: `A thick DOWN-filled pram footmuff in deep petrol (#2E5561) with puffy quilted channels, maximum plumpness, rounded bag shape with soft internal volume.` },
  { id: 'sauekinn-i-vogn', text: `A natural sheepskin / lambskin pram liner in warm cream (#EAE2D2), fluffy soft curly wool clay texture, gently rounded rectangular shape lying softly.` },
  { id: 'regntrekk', text: `A pram rain cover in pale translucent-looking ice grey-blue (#C3D2DC) matte clay, a smooth rounded dome shape with soft edges as if stretched over an invisible pram hood.` },
  { id: 'regnponcho-over-baeresele', text: `A rain poncho for a parent carrying a baby, petrol rain-blue (#5A8CA8), wide rounded poncho shape with hood on top and a soft rounded bump at the chest as if covering an invisible baby carrier.` },

  // ---------- Ekstra: søvn (TOG-ramp: krem → oat → sand → oker → petrol) ----------
  { id: 'sovepose-0-5-tog', text: `A VERY THIN baby sleeping bag (sleep sack) in pale cream (#E0D6BE), sleeveless with shoulder snaps, slim rounded bag shape with soft internal volume as if an invisible baby is inside.` },
  { id: 'sovepose-1-0-tog', text: `A LIGHT baby sleeping bag (sleep sack) in warm oat (#C8B99A), sleeveless with shoulder snaps, slim rounded bag shape with soft internal volume.` },
  { id: 'sovepose-1-5-tog', text: `A baby sleeping bag (sleep sack) in warm sand (#BFA98A), sleeveless with shoulder snaps, slightly padded rounded bag shape with soft internal volume.` },
  { id: 'sovepose-2-0-tog', text: `A baby sleeping bag (sleep sack) in muted light ochre (#C99B4D), sleeveless with shoulder snaps, moderately padded rounded bag shape with soft internal volume.` },
  { id: 'sovepose-2-5-tog', text: `A MEDIUM baby sleeping bag (sleep sack) in golden ochre (#B67C1E), sleeveless with shoulder snaps, softly quilted rounded bag shape with soft internal volume.` },
  { id: 'sovepose-3-0-3-5-tog', text: `A THICK baby sleeping bag (sleep sack) in petrol (#4A7482), sleeveless with shoulder snaps, puffy quilted rounded bag shape with soft internal volume.` },
  { id: 'sovepose-3-5-tog', text: `The THICKEST baby sleeping bag (sleep sack) in deep petrol (#2E5561), sleeveless with shoulder snaps, extra puffy quilted rounded bag shape, maximum plumpness.` },

  // ---------- Ekstra: hud ----------
  { id: 'ansiktskrem', text: `A small round jar of protective baby face cream: cream-colored (#EAE2D2) rounded clay jar with a petrol (#35707F) lid, soft plump clay shapes, sitting slightly angled.` },
];

/* Chroma-key: magenta → alpha. Standard-varianten MED tredje despill-branch
 * (mag > 15) fra f79-kald-thumbs.mjs. */
async function key(rawPath, outPath) {
  const { data, info } = await sharp(rawPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const mag = Math.min(r, b) - g;
    if (mag > 90) data[i + 3] = 0;
    else if (mag > 40) {
      data[i + 3] = Math.round(255 * (1 - (mag - 40) / 50));
      const avg = Math.round((r + b) / 2);
      data[i] = Math.min(r, avg - Math.round(mag * 0.35));
      data[i + 2] = Math.min(b, avg - Math.round(mag * 0.35));
    } else if (mag > 15) {
      const t = Math.round((g + Math.min(r, b)) / 2);
      data[i] = Math.min(r, t + 10);
      data[i + 2] = Math.min(b, t + 10);
    }
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(outPath);
}

async function gen(prompt, rawPath) {
  const res = await fetch(API, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } },
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${(await res.text()).slice(0, 250)}`);
  const json = await res.json();
  const part = json?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.mimeType?.startsWith('image/'));
  if (!part) throw new Error('ingen bildedata i svaret');
  writeFileSync(rawPath, Buffer.from(part.inlineData.data, 'base64'));
}

const failed = [];
let generated = 0;
let okCount = 0;

console.log(`F80 thumbs-batch: ${GARMENTS.length} plagg → ${OUT}`);
console.log(FORCE ? '--force: regenererer alt\n' : 'resumable: hopper over ferdige\n');

for (let n = 0; n < GARMENTS.length; n++) {
  const { id, text } = GARMENTS[n];
  const rawPath = join(RAW, `${id}-raw.png`);
  const outPath = join(OUT, `${id}.png`);
  const tag = `[${String(n + 1).padStart(2)}/${GARMENTS.length}]`;

  try {
    if (!FORCE && existsSync(outPath) && existsSync(rawPath)) {
      console.log(`${tag} hopper over ${id} (ferdig)`);
      okCount++;
      continue;
    }
    if (!FORCE && existsSync(rawPath)) {
      // raw finnes men ferdig PNG mangler → kun re-key (gratis)
      await key(rawPath, outPath);
      console.log(`${tag} re-key ${id} (raw fantes, ingen API-kost)`);
      okCount++;
      continue;
    }
    const t0 = Date.now();
    await gen(`${BASE_RULES}\n\nITEM: ${text}`, rawPath);
    await key(rawPath, outPath);
    generated++;
    okCount++;
    const usd = generated * USD_PER_IMAGE;
    console.log(
      `${tag} ok   ${id} (${((Date.now() - t0) / 1000).toFixed(1)}s) — løpende kost ~$${usd.toFixed(2)} (~${(usd * NOK_PER_USD).toFixed(0)} NOK)`,
    );
  } catch (err) {
    failed.push({ id, error: String(err.message ?? err) });
    console.error(`${tag} FEIL ${id}: ${err.message ?? err}`);
  }
}

console.log('\n--- F80 thumbs-batch rapport ---');
console.log(`OK: ${okCount}/${GARMENTS.length} (${generated} nygenerert)`);
const usd = generated * USD_PER_IMAGE;
console.log(`Faktisk kost denne kjøringen: ~$${usd.toFixed(2)} (~${(usd * NOK_PER_USD).toFixed(0)} NOK)`);
if (failed.length) {
  console.log(`Feilede plagg (${failed.length}) — kjør scriptet på nytt for å prøve kun disse:`);
  for (const f of failed) console.log(`  - ${f.id}: ${f.error}`);
}
const okShare = okCount / GARMENTS.length;
if (okShare >= 0.9) {
  console.log(okShare === 1 ? 'ferdig: alle plagg OK.' : `ferdig med feil, men ≥90 % OK (${(okShare * 100).toFixed(0)} %).`);
  process.exit(0);
} else {
  console.error(`under 90 % OK (${(okShare * 100).toFixed(0)} %) — exit 1.`);
  process.exit(1);
}
