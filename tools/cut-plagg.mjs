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

async function klipp(navn, tol = TOL) {
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
    if (ute[i] || avstand(px(x, y), bg) > tol) continue;
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

    // En SKYGGE er ikke bare «liten» — den er MORKERE enn plagget og ligger
    // UNDER det. Ren storrelsesregel felte ekte plaggdeler: sydvestens
    // hakestropp og den ene av et par toffelsko. Vi skiller pa hva en skygge
    // faktisk ER, ikke pa hvor stor den er.
    const stats = storrelser.map(() => ({ n: 0, sumL: 0, sumY: 0,
      x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity, bredde: 0, hoyde: 0 }));
    for (let i = 0; i < erodert.length; i += 1) {
      if (erodert[i] || merke[i] < 0) continue;
      const x = i % W, y = (i / W) | 0;
      const c = px(x, y);
      const st = stats[merke[i]];
      st.n += 1; st.sumL += 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; st.sumY += y;
      if (x < st.x0) st.x0 = x; if (x > st.x1) st.x1 = x;
      if (y < st.y0) st.y0 = y; if (y > st.y1) st.y1 = y;
    }
    for (const st of stats) { st.bredde = st.x1 - st.x0 + 1; st.hoyde = st.y1 - st.y0 + 1;
      st.avstandTilHoved = Infinity; }
    // Naboskap: en komponent som har en piksel innen 3 px av hovedmassen er
    // festet til den, ikke en fritt svevende skygge.
    for (let i = 0; i < erodert.length; i += 1) {
      if (erodert[i] || merke[i] !== storst) continue;
      const x = i % W, y = (i / W) | 0;
      for (let dy = -3; dy <= 3; dy += 1) for (let dx = -3; dx <= 3; dx += 1) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (erodert[j] || merke[j] < 0 || merke[j] === storst) continue;
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        if (d < stats[merke[j]].avstandTilHoved) stats[merke[j]].avstandTilHoved = d;
      }
    }
    const hoved = stats[storst];
    const hovedL = hoved.sumL / hoved.n, hovedY = hoved.sumY / hoved.n;
    let fjernet = 0;
    for (let i = 0; i < erodert.length; i += 1) {
      if (erodert[i] || merke[i] === storst) continue;
      const st = stats[merke[i]];
      const erMorkere = st.sumL / st.n < hovedL * 0.75;
      const liggerUnder = st.sumY / st.n > hovedY;
      const erLiten = st.n < hoved.n * 0.06;
      // FORMKRAV: en kontaktskygge er BRED og FLAT — en ellipse under motivet.
      // Uten dette ble sydvestens morkegronne hakestropp klassifisert som
      // skygge, fordi den bade er morkere og ligger under. En stropp er smal
      // og hoy; en skygge er ikke det.
      const erBred = st.bredde > st.hoyde * 1.6;
      // NAERHET: en kontaktskygge har LUFT mellom seg og motivet. En del som
      // ligger inntil hovedmassen er festet — den ble bare kuttet av 1 px-
      // erosjonen. Sydvestens hakestropp er nettopp det: morkere, under, og
      // bred som en U — den bestod alle tre skyggetestene og ble slettet, med
      // tenner igjen der den var festet.
      const naerHoved = st.avstandTilHoved <= 3;
      if (!naerHoved && ((erMorkere && liggerUnder && erBred) || erLiten)) { erodert[i] = 1; fjernet += 1; }
    }
    var losdeler = storrelser.length - 1, losPiksler = fjernet;
    var storsteLos = storrelser.filter((_, i) => i !== storst).reduce((a, c) => Math.max(a, c), 0);
    var losAndelAvMotiv = storrelser[storst] ? storsteLos / storrelser[storst] : 0;
  }

  // ── OMSLUTTEDE BAKGRUNNSHULL ───────────────────────────────────────────
  // De 8 tilbakeholdte var ikke et toleranseproblem. Flood-fill fra KANTEN
  // naar aldri bakgrunn som er OMSLUTTET av plagg: apningen i en lue, gapet
  // mellom tommel og hand i en vott, hullet i en solhatt. De ble staaende som
  // «bakgrunnsfarge inne i motivet» og utloste risikoflagget.
  // Losning: finn sammenhengende komponenter av BEHOLDTE piksler som ligner
  // bakgrunnen, og som ikke rorer bildekanten. De er hull, ikke plagg.
  {
    const besokt = new Uint8Array(W * H);
    let hull = 0;
    for (let start = 0; start < erodert.length; start += 1) {
      if (erodert[start] || besokt[start]) continue;
      const sx = start % W, sy = (start / W) | 0;
      if (avstand(px(sx, sy), bg) > 7) continue;       // stram: morkegronn ull ligger naer morkebrun bakgrunn
      const komp = [];
      const stabel = [start];
      besokt[start] = 1;
      let rorerKant = false;
      while (stabel.length) {
        const i = stabel.pop();
        komp.push(i);
        const x = i % W, y = (i / W) | 0;
        if (x === 0 || y === 0 || x === W - 1 || y === H - 1) rorerKant = true;
        for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
          if (j < 0 || besokt[j] || erodert[j]) continue;
          const jx = j % W, jy = (j / W) | 0;
          if (avstand(px(jx, jy), bg) > 7) continue;
          besokt[j] = 1; stabel.push(j);
        }
      }
      // Omsluttet OG bakgrunnsfarget => hull. Rorer den kanten er den ikke det.
      if (!rorerKant) { for (const i of komp) erodert[i] = 1; hull += komp.length; }
    }
    var hullPiksler = hull;
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

  const rand = randethet(erodert, W, H);
  return { W, H, ch, ut, restAndel, rand, tol, beholdtAndel: beholdt / (W * H), bg, losdeler, losPiksler, losAndelAvMotiv, hullPiksler };
}

/** Randethet: omkrets^2 / areal. En ren silhuett har lav verdi; en kant som
 *  flood-fillen har spist seg inn i (fordi plaggfargen ligger innenfor
 *  toleransen) blir FLISETE og far hoy verdi. Sydvestens morkegronne
 *  hakestropp mot morkebrun bakgrunn var nettopp det: fillen gikk rett
 *  gjennom stroppen og etterlot tenner. */
function randethet(maske, W, H) {
  let areal = 0, omkrets = 0;
  for (let y = 1; y < H - 1; y += 1) for (let x = 1; x < W - 1; x += 1) {
    const i = y * W + x;
    if (maske[i]) continue;
    areal += 1;
    if (maske[i - 1] || maske[i + 1] || maske[i - W] || maske[i + W]) omkrets += 1;
  }
  return areal ? (omkrets * omkrets) / areal : Infinity;
}

/** Assets der automatisk klipping IKKE holder, og hvorfor. Portdom 29:
 *  «manuell maske forst — det bevarer noyaktig plagg, farge og form.
 *  Regenerer bare nar selve originalen er faglig eller visuelt ubrukelig.»
 *  Disse skrives ikke; originalen blir staaende til den er maskert for hand. */
const MANUELL = {
  'plagg-sydvest.png':
    'morkegronn hakestropp ligger innenfor toleransen mot morkebrun bakgrunn — '
    + 'flood-fill gaar tvers gjennom stroppen og etterlater tenner. Ekte '
    + 'mattingsproblem, ikke terskelproblem. Selvkorrigerende toleranse (24/18/13) '
    + 'loste det ikke: kanten er ikke flisete nok til aa utlose retesten, '
    + 'fordi selve stroppen forsvinner i stedet for aa bli oppflist.',
};

const filer = readdirSync(INN).filter((f) => f.startsWith('plagg-') && f.endsWith('.png'));
if (!KUN_SJEKK) { mkdirSync(UT, { recursive: true }); mkdirSync(ARK, { recursive: true }); }

const rene = [], tilsyn = [];
for (const navn of filer) {
  if (MANUELL[navn]) { tilsyn.push({ navn, grunn: 'MANUELL MASKE: ' + MANUELL[navn] }); continue; }
  let r = await klipp(navn);
  // SELVKORRIGERING: er kanten flisete, har fillen spist seg inn i plagget.
  // Prov strammere toleranse og behold den reneste kanten. Bedre enn en
  // global lav toleranse, som ville latt halo sta igjen pa alle de andre.
  if (r.rand > 90) {
    for (const t of [24, 18, 13]) {
      const alt = await klipp(navn, t);
      if (alt.rand < r.rand * 0.75) r = alt;
      if (r.rand <= 90) break;
    }
  }
  const post = { navn, rest: r.restAndel, beholdt: r.beholdtAndel, los: r.losdeler, losPx: r.losPiksler,
    losAndel: r.losAndelAvMotiv, hull: r.hullPiksler, rand: r.rand, tol: r.tol };
  // VAKT: en kontaktskygge er LITEN. Er den storste losdelen en merkbar andel
  // av motivet, har «behold storste komponent» spist en del av selve plagget —
  // en hatterand sett gjennom en apning, et morkt fôr, en lokk som ikke henger
  // sammen med hovedmassen. QA-arket avslorte nettopp det pa bottehatten.
  // Vakten malte losdelens STORRELSE. Det var riktig sa lenge alt utenfor
  // hovedmassen ble slettet — da var en stor losdel et varsel om at vi spiste
  // plagg. Na skiller diskriminatoren pa hva en skygge ER (morkere OG under),
  // sa ekte plaggdeler beholdes: sydvestens hakestropp, den ene av et par sko.
  // Storrelse er derfor ikke lenger et faresignal, og vakten er fjernet.
  // Residue-sjekken under star igjen og vokter fargeblodning.
  if (r.restAndel > RISIKO_GRENSE) { post.grunn = `${(r.restAndel * 100).toFixed(1)} % bakgrunnsfarge inne i motivet`; tilsyn.push(post); continue; }
  rene.push(post);
  if (!KUN_SJEKK) {
    await sharp(r.ut, { raw: { width: r.W, height: r.H, channels: r.ch } })
      .png({ compressionLevel: 9 }).toFile(join(UT, navn));
  }
}

console.log(`\n── cut-plagg: ${filer.length} plagg ──`);
console.log(`  ${rene.length} klippet rent${KUN_SJEKK ? ' (ikke skrevet — --sjekk)' : ` → ${UT}/`}`);
const medHull = rene.filter((r) => r.hull > 0);
console.log(`  ${medHull.length} hadde omsluttede bakgrunnshull (lueåpning, vottegap) — ${medHull.reduce((a,c)=>a+c.hull,0)} piksler`);
const medSkygge = rene.filter((r) => r.los > 0);
console.log(`  ${medSkygge.length} hadde innbakt kontaktskygge/løsdeler som er fjernet` +
  ` (${medSkygge.reduce((a, c) => a + c.losPx, 0)} piksler totalt)`);
const strammet = rene.filter((r) => r.tol !== TOL);
if (strammet.length) console.log(`  ${strammet.length} trengte strammere toleranse mot fargeblødning: ` +
  strammet.map((r) => `${r.navn.replace('plagg-','').replace('.png','')} (${r.tol})`).join(', '));
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
