/**
 * asset-rig-check — mekanisk deteksjon av RIGGBLANDING i public/monter/.
 *
 * BAKGRUNN (art bible 2026-08-02, §«Lysriggen»): riggen ble REVIDERT etter
 * ekstern review. V1-riggens «golden studio» ble felt på hvitbalansen; den
 * gjeldende riggen er varmnøytral ~4000–4300 K, «materialet skal gi varmen,
 * ikke et guloransje fargestikk». De 9 proof-assetene i
 * docs/design-notes/b1-proof/ er laget i den reviderte riggen. Assetene i
 * public/monter/ er fra den felte.
 *
 * Risikoen dette verktøyet finnes for (T2-arbeidsplanen, R14): kopierer vi
 * proof-plaggene inn, får noen få assets ny rigg mens resten beholder den
 * gamle — og enhver anbefaling som blander dem viser TO lysrigger i samme
 * vitrine. Det er normaltilstanden, ikke et kanttilfelle. Øyet oppdager det
 * ikke pålitelig på en telefon i 56 px thumbs; en måling gjør det.
 *
 * HVA DET MÅLER
 * 1. UTKLIPPSKONTRAKTEN (strukturell). Art bible: «Transparent objekt og
 *    kontakt-/AO-skygge eksporteres SEPARAT (skyggen bor i UI-laget)» og
 *    «Ingen bakgrunnsfarget rim light, romrefleks eller espresso-/krem-spill
 *    bakt inn». En asset uten gjennomsiktighet har rommet bakt inn i filen.
 *    Da finnes det ikke noe alfa-maskert motiv å måle — tallene under
 *    beskriver rommet, ikke plagget. Derfor er dette FØRSTE sjekk, ikke en
 *    fotnote.
 * 2. RIGGBÅNDET (kolorimetrisk), målt over den eroderte alfamasken i OKLab:
 *    middels luminans (L), middels chroma (C) og middels hue (h).
 * 3. NØKKELLYSETS SIDE. Art bible: «Stor, myk key light ~35–45° ovenfra,
 *    SAMME side på alle assets.» Håndhevet som et FORTEGN (hvilken side
 *    høylysene ligger på), ikke som en amplitude — «samme side» er et
 *    fortegnskrav, og en amplitudeterskel her ville gitt falske funn på
 *    assets med lite fullt-ugjennomsiktig areal.
 *
 * HVA BÅNDET KAN OG IKKE KAN
 * Båndet kalibreres på de 9 proof-assetene og kan derfor bare FALSIFISERE.
 * Et asset innenfor båndet er ikke bevist å være i samme rigg — det er bare
 * ikke motbevist. Art bible sier det samme om QA: «Automatikk måler kant og
 * utsnitt — aldri materialkvalitet.» Verktøyet erstatter ikke blikket; det
 * fanger det blikket ikke ser på 42 filer.
 *
 * HVORFOR OKLab
 * Hue og chroma må måles perseptuelt for at «middels» skal bety noe. Middels
 * hue regnes som vinkelen til MIDDELVEKTOREN (a, b) — ikke som et snitt av
 * vinkler, som er udefinert rundt 0°. Vektorens LENGDE er samtidig hue-ens
 * egen pålitelighetsmåler: er motivet nesten nøytralt, er vinkelen støy.
 * Derfor har hue en chroma-port (HUE_PORT) i begge ender: assets under porten
 * verken kalibrerer båndet eller dømmes på hue.
 *
 * Kjøres:  node tools/asset-rig-check.mjs [--json] [--alle]
 *          --json  maskinlesbar rapport
 *          --alle  vis også assets som ligger innenfor båndet
 * Exit 0 = ingen funn, 2 = funn (samme konvensjon som design-doctrine-lint).
 */
import { readdir, readFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HER = dirname(fileURLToPath(import.meta.url));
export const REPO_ROT = resolve(HER, '..');
export const MONTER_KATALOG = join(REPO_ROT, 'public', 'monter');
export const PROOF_KATALOG = join(REPO_ROT, 'docs', 'design-notes', 'b1-proof');

/**
 * Fasiten: art bible §«B1-proofens omfang» — 6 plagg på tvers av kategorier,
 * 1 maskotpose og 2 værikoner, alle laget i den reviderte riggen. Ingen andre
 * filer i b1-proof/ er assets (resten er porttest-ark, komposittbilder og
 * måleskript), så listen er eksplisitt og ikke et katalog-glob.
 */
export const KALIBRERINGSSETT = Object.freeze([
  'ullsett-tykt.png',
  'ullsokker.png',
  'ull-mellomlag-tykt.png',
  'vinterdress.png',
  'lue-m-ull.png',
  'votter-tykke.png',
  'maskot.png',
  'vaer-delvis-skyet.png',
  'vaer-regn.png',
]);

/**
 * Steg 12 i T2-arbeidsplanen kopierer proof-assetene inn på disse
 * filnavnene i public/monter/. De er allerede produsert i den reviderte
 * riggen, så de skal IKKE telle med i B2-regenereringslisten selv om filen
 * som ligger der i dag er utenfor båndet.
 */
export const DEKKET_AV_PROOF = Object.freeze([
  'plagg-tykt-ullsett.png',
  'plagg-ullsokker.png',
  'plagg-ull-mellomlag.png',
  'plagg-vinterdress.png',
  'plagg-lue-med-ull.png',
  'plagg-votter.png',
  'maskot.png',
  'maskot-nysgjerrig.png',
  'vaer-delvis-skyet.png',
  'vaer-regn.png',
]);

/**
 * Under denne chroma-lengden er motivet praktisk talt nøytralt og hue-vinkelen
 * er støy. Proof-settets vinterdress ligger på 0,019 — den er en mørk, nesten
 * avmettet flate, og vinkelen dens (317°) sier ingenting om riggen. Porten
 * holder den utenfor hue-kalibreringen uten at vi må håndplukke filen.
 */
export const HUE_PORT = 0.03;

/**
 * Båndet er en konvolutt rundt proof-settet, utvidet med 5 % av sitt eget
 * spenn. Marginen finnes fordi konvolutten bygges på 9 referanser: en asset
 * som ligger et hårstrå utenfor ni motiv skal ikke kalles riggbrudd. Den er
 * bevisst liten — poenget er å falsifisere, ikke å slippe alt gjennom.
 */
export const BAND_MARGIN = 0.05;

/**
 * Gulvet for utklippskontrakten. Fordelingen er bimodal i praksis (bakte
 * flater ligger på 0,0 %, ekte utklipp på 58–83 %), så den nøyaktige verdien
 * er ikke bærende — den er satt til halvparten av proof-settets laveste for
 * å ha en kalibrert, ikke gjettet, terskel.
 */
export const UTKLIPP_GULV_ANDEL = 0.5;

/* ── Farge ────────────────────────────────────────────────────────────── */

/** sRGB 0–255 → lineær. LUT: bare 256 mulige inngangsverdier per kanal. */
const LINEAER = new Float64Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  LINEAER[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** sRGB (0–255) → OKLab [L, a, b]. Björn Ottossons matriser. */
export function srgbTilOklab(r8, g8, b8) {
  const r = LINEAER[r8];
  const g = LINEAER[g8];
  const b = LINEAER[b8];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}

/** Grader 0–360 for vektoren (a, b). */
export function hueGrader(a, b) {
  return ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
}

/**
 * Minste sirkelbue som rommer alle vinklene, som { fra, til, spenn }.
 * Nødvendig fordi et vanlig min/max på grader deler seg feil rundt 0°.
 */
export function hueKonvolutt(hues) {
  if (hues.length === 0) return null;
  const sortert = [...hues].sort((a, b) => a - b);
  if (sortert.length === 1) return { fra: sortert[0], til: sortert[0], spenn: 0 };
  let besteGap = -1;
  let besteIndeks = 0;
  for (let i = 0; i < sortert.length; i++) {
    const neste = sortert[(i + 1) % sortert.length];
    const gap = ((neste - sortert[i]) % 360 + 360) % 360;
    if (gap > besteGap) {
      besteGap = gap;
      besteIndeks = i;
    }
  }
  // Alle vinklene identiske: buen er et punkt, ikke hele sirkelen.
  if (besteGap === 0) return { fra: sortert[0], til: sortert[0], spenn: 0 };
  const fra = sortert[(besteIndeks + 1) % sortert.length];
  const til = sortert[besteIndeks];
  return { fra, til, spenn: 360 - besteGap };
}

/** Ligger hue innenfor buen [fra, til] (som kan krysse 0°)? */
export function hueInnenfor(hue, bue) {
  if (!bue) return true;
  const fraStart = ((hue - bue.fra) % 360 + 360) % 360;
  return fraStart <= bue.spenn + 1e-9;
}

/* ── Måling ───────────────────────────────────────────────────────────── */

function persentil(sortert, p) {
  if (sortert.length === 0) return NaN;
  const i = Math.min(sortert.length - 1, Math.max(0, Math.round((p / 100) * (sortert.length - 1))));
  return sortert[i];
}

/**
 * Måler ett asset fra rå RGBA. Skilt fra filesing så måten kan testes uten
 * disk.
 *
 * Masken er ALFA-MASKEN ERODERT 1 px: pikselen og dens fire naboer må være
 * helt ugjennomsiktige. Kantpikslene er delvis gjennomsiktige og blander seg
 * mot bakgrunnsstoffet som ble klippet bort (magenta ved generering) — de
 * ville forurenset både hue og luminans, som er nøyaktig de to tallene
 * riggspørsmålet står på.
 */
export function malRaadata({ data, width, height, channels }) {
  const antallPiksler = width * height;
  const alfa = (x, y) => data[(y * width + x) * channels + 3];

  let helt = 0;
  let delvis = 0;
  let gjennomsiktig = 0;
  for (let i = 3; i < data.length; i += channels) {
    const a = data[i];
    if (a === 255) helt++;
    else if (a === 0) gjennomsiktig++;
    else delvis++;
  }

  const Ls = new Float64Array(antallPiksler);
  const posisjoner = new Int32Array(antallPiksler);
  let n = 0;
  let sumA = 0;
  let sumB = 0;
  let sumC = 0;
  let sumX = 0;
  let sumY = 0;
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (alfa(x, y) !== 255) continue;
      if (alfa(x - 1, y) !== 255 || alfa(x + 1, y) !== 255) continue;
      if (alfa(x, y - 1) !== 255 || alfa(x, y + 1) !== 255) continue;
      const i = (y * width + x) * channels;
      const [L, a, b] = srgbTilOklab(data[i], data[i + 1], data[i + 2]);
      Ls[n] = L;
      posisjoner[n] = y * width + x;
      n++;
      sumA += a;
      sumB += b;
      sumC += Math.hypot(a, b);
      sumX += x;
      sumY += y;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }

  if (n === 0) {
    return {
      bredde: width,
      hoyde: height,
      pikslerIMotiv: 0,
      gjennomsiktigAndel: gjennomsiktig / antallPiksler,
      delvisAndel: delvis / antallPiksler,
      heltAndel: helt / antallPiksler,
      middelLuminans: NaN,
      middelChroma: NaN,
      middelHue: NaN,
      hueVektorChroma: 0,
      nokkellysX: NaN,
      motivBredde: 0,
      motivHoyde: 0,
    };
  }

  const middelA = sumA / n;
  const middelB = sumB / n;
  const sorterteL = Ls.slice(0, n).sort();
  const hoylysTerskel = persentil(sorterteL, 90);

  let hoylysX = 0;
  let hoylysN = 0;
  for (let i = 0; i < n; i++) {
    if (Ls[i] < hoylysTerskel) continue;
    hoylysX += posisjoner[i] % width;
    hoylysN++;
  }

  const motivBredde = x1 - x0 + 1;
  let sumL = 0;
  for (let i = 0; i < n; i++) sumL += Ls[i];

  return {
    bredde: width,
    hoyde: height,
    pikslerIMotiv: n,
    gjennomsiktigAndel: gjennomsiktig / antallPiksler,
    delvisAndel: delvis / antallPiksler,
    heltAndel: helt / antallPiksler,
    middelLuminans: sumL / n,
    middelChroma: sumC / n,
    middelHue: hueGrader(middelA, middelB),
    hueVektorChroma: Math.hypot(middelA, middelB),
    /** Høylysenes tyngdepunkt relativt motivets, i andel av motivbredden.
     *  Negativt = key fra venstre. */
    nokkellysX: (hoylysX / hoylysN - sumX / n) / motivBredde,
    motivBredde,
    motivHoyde: y1 - y0 + 1,
  };
}

/** Middelfarge i et 2 px kantbånd — brukes som bevis for bakt rom. */
export function kantbaandFarge({ data, width, height, channels }, tykkelse = 2) {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const iKant = x < tykkelse || y < tykkelse || x >= width - tykkelse || y >= height - tykkelse;
      if (!iKant) continue;
      const i = (y * width + x) * channels;
      if (data[i + 3] !== 255) continue;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n++;
    }
  }
  if (n === 0) return null;
  const hex = (v) => Math.round(v / n).toString(16).padStart(2, '0').toUpperCase();
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/** Leser én PNG og returnerer målingen + kantbåndfargen. */
export async function malFil(filsti) {
  const { data, info } = await sharp(await readFile(filsti))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const raa = { data, width: info.width, height: info.height, channels: info.channels };
  return {
    fil: basename(filsti),
    sti: filsti,
    ...malRaadata(raa),
    kantbaand: kantbaandFarge(raa),
  };
}

/* ── Bånd ─────────────────────────────────────────────────────────────── */

function konvolutt(verdier, margin) {
  const min = verdier.reduce((a, b) => (b < a ? b : a), Infinity);
  const maks = verdier.reduce((a, b) => (b > a ? b : a), -Infinity);
  const slakk = (maks - min) * margin;
  return { min, maks, lav: min - slakk, hoy: maks + slakk };
}

/**
 * Bygger båndet fra proof-målingene. Båndet er alltid AVLEDET, aldri
 * hardkodet: endres fasiten, flytter båndet seg med den.
 */
export function kalibrerBand(proofMaalinger, { margin = BAND_MARGIN, huePort = HUE_PORT } = {}) {
  if (proofMaalinger.length === 0) throw new Error('Kalibreringssettet er tomt — kan ikke utlede et bånd.');

  const luminans = konvolutt(proofMaalinger.map((m) => m.middelLuminans), margin);
  const chroma = konvolutt(proofMaalinger.map((m) => m.middelChroma), margin);

  const overPort = proofMaalinger.filter((m) => m.hueVektorChroma >= huePort);
  const raaBue = hueKonvolutt(overPort.map((m) => m.middelHue));
  const hueSlakk = raaBue ? raaBue.spenn * margin : 0;
  const hue = raaBue
    ? {
        fraRaa: raaBue.fra,
        tilRaa: raaBue.til,
        fra: ((raaBue.fra - hueSlakk) % 360 + 360) % 360,
        til: (raaBue.til + hueSlakk) % 360,
        spenn: raaBue.spenn + 2 * hueSlakk,
        kalibrertPaa: overPort.length,
        utenforPort: proofMaalinger.length - overPort.length,
      }
    : null;

  const utklippMin = proofMaalinger
    .map((m) => m.gjennomsiktigAndel)
    .reduce((a, b) => (b < a ? b : a), Infinity);

  return {
    antallReferanser: proofMaalinger.length,
    margin,
    huePort,
    luminans,
    chroma,
    hue,
    utklipp: { proofMin: utklippMin, gulv: utklippMin * UTKLIPP_GULV_ANDEL },
    nokkellysVenstre: proofMaalinger.every((m) => m.nokkellysX < 0),
  };
}

/**
 * Dømmer én måling mot båndet. Returnerer listen over avvik — tom liste
 * betyr «ikke motbevist», ikke «bevist samme rigg».
 */
export function vurder(maaling, band) {
  const avvik = [];

  if (maaling.gjennomsiktigAndel < band.utklipp.gulv) {
    avvik.push({
      akse: 'utklipp',
      tekst:
        `bakt rom — ${(maaling.gjennomsiktigAndel * 100).toFixed(1)} % gjennomsiktig` +
        `${maaling.kantbaand ? `, kantbånd ${maaling.kantbaand}` : ''}` +
        ' (L/C/h beskriver da flaten inkl. rommet, ikke plagget)',
    });
  }

  if (!Number.isFinite(maaling.middelLuminans)) {
    avvik.push({ akse: 'motiv', tekst: 'ingen ugjennomsiktige piksler å måle' });
    return avvik;
  }

  if (maaling.middelLuminans < band.luminans.lav || maaling.middelLuminans > band.luminans.hoy) {
    avvik.push({
      akse: 'luminans',
      tekst: `L ${maaling.middelLuminans.toFixed(3)} utenfor ${band.luminans.lav.toFixed(3)}–${band.luminans.hoy.toFixed(3)}`,
    });
  }

  if (maaling.middelChroma < band.chroma.lav || maaling.middelChroma > band.chroma.hoy) {
    avvik.push({
      akse: 'chroma',
      tekst: `C ${maaling.middelChroma.toFixed(4)} utenfor ${band.chroma.lav.toFixed(4)}–${band.chroma.hoy.toFixed(4)}`,
    });
  }

  // Hue vurderes bare over chroma-porten. Et nesten nøytralt motiv har ingen
  // meningsfull vinkel, og å dømme det på hue ville vært å måle støy.
  if (band.hue && maaling.hueVektorChroma >= band.huePort && !hueInnenfor(maaling.middelHue, band.hue)) {
    avvik.push({
      akse: 'hue',
      tekst: `h ${maaling.middelHue.toFixed(1)}° utenfor ${band.hue.fra.toFixed(1)}°–${band.hue.til.toFixed(1)}°`,
    });
  }

  if (band.nokkellysVenstre && Number.isFinite(maaling.nokkellysX) && maaling.nokkellysX >= 0) {
    avvik.push({ akse: 'nøkkellys', tekst: 'høylysene ligger på motsatt side av proof-settets' });
  }

  return avvik;
}

/* ── Rapport ──────────────────────────────────────────────────────────── */

async function malKatalog(katalog, filnavn) {
  const maalinger = [];
  for (const navn of filnavn) maalinger.push(await malFil(join(katalog, navn)));
  return maalinger;
}

export async function kjorAnalyse() {
  const proof = await malKatalog(PROOF_KATALOG, KALIBRERINGSSETT);
  const band = kalibrerBand(proof);

  const monterFiler = (await readdir(MONTER_KATALOG)).filter((f) => f.endsWith('.png')).sort();
  const rader = [];
  for (const navn of monterFiler) {
    const maaling = await malFil(join(MONTER_KATALOG, navn));
    const avvik = vurder(maaling, band);
    rader.push({
      ...maaling,
      avvik,
      innenfor: avvik.length === 0,
      dekketAvProof: DEKKET_AV_PROOF.includes(navn),
    });
  }

  const utenfor = rader.filter((r) => !r.innenfor);
  const maaRegenereres = utenfor.filter((r) => !r.dekketAvProof);

  return { band, proof, rader, utenfor, maaRegenereres };
}

function tallKolonne(v, desimaler) {
  return Number.isFinite(v) ? v.toFixed(desimaler) : '—';
}

function skrivRapport({ band, rader, utenfor, maaRegenereres }, { visAlle }) {
  console.log('asset-rig-check — riggblanding i public/monter/\n');

  console.log(`BÅNDET (kalibrert på ${band.antallReferanser} proof-assets, margin ${(band.margin * 100).toFixed(0)} % av spennet)`);
  console.log(`  gjennomsiktig andel  ≥ ${(band.utklipp.gulv * 100).toFixed(1)} %          (proof lavest: ${(band.utklipp.proofMin * 100).toFixed(1)} %)`);
  console.log(`  middels luminans     ${band.luminans.lav.toFixed(3)} – ${band.luminans.hoy.toFixed(3)}   (proof: ${band.luminans.min.toFixed(3)}–${band.luminans.maks.toFixed(3)})`);
  console.log(`  middels chroma       ${band.chroma.lav.toFixed(4)} – ${band.chroma.hoy.toFixed(4)} (proof: ${band.chroma.min.toFixed(4)}–${band.chroma.maks.toFixed(4)})`);
  if (band.hue) {
    console.log(`  middels hue          ${band.hue.fra.toFixed(1)}° – ${band.hue.til.toFixed(1)}°   (proof: ${band.hue.fraRaa.toFixed(1)}°–${band.hue.tilRaa.toFixed(1)}°, ${band.hue.kalibrertPaa} av ${band.antallReferanser} over chroma-porten ${band.huePort})`);
  }
  console.log(`  nøkkellys            ${band.nokkellysVenstre ? 'venstre for motivets tyngdepunkt (alle referanser)' : 'ikke entydig i proof-settet — fortegnssjekken er av'}`);

  const vist = visAlle ? rader : utenfor;
  console.log(`\n${'FIL'.padEnd(32)}${'GJSIKT'.padStart(8)}${'L'.padStart(8)}${'C'.padStart(9)}${'HUE'.padStart(8)}   AVVIK`);
  for (const r of vist) {
    console.log(
      r.fil.padEnd(32) +
        `${(r.gjennomsiktigAndel * 100).toFixed(1)} %`.padStart(8) +
        tallKolonne(r.middelLuminans, 3).padStart(8) +
        tallKolonne(r.middelChroma, 4).padStart(9) +
        (r.hueVektorChroma >= band.huePort ? `${tallKolonne(r.middelHue, 0)}°` : 'nøytral').padStart(8) +
        '   ' +
        (r.avvik.length ? r.avvik.map((a) => a.akse).join(', ') : 'innenfor'),
    );
  }

  const innenfor = rader.filter((r) => r.innenfor);
  console.log(`\nUTENFOR BÅNDET: ${utenfor.length} av ${rader.length}`);
  console.log(`INNENFOR:       ${innenfor.length}${innenfor.length ? ` (${innenfor.map((r) => r.fil).join(', ')})` : ''}`);

  const dekket = utenfor.filter((r) => r.dekketAvProof);
  console.log(`\nMÅ RE-GENERERES I B2: ${maaRegenereres.length}`);
  console.log(`  (${utenfor.length} utenfor båndet − ${dekket.length} som allerede finnes i proof-settet og kopieres inn i Steg 12)`);
  for (const r of maaRegenereres) {
    console.log(`  ${r.fil.padEnd(32)} ${r.avvik.map((a) => a.tekst).join(' · ')}`);
  }

  console.log(
    '\nMerk: båndet kan bare falsifisere. «Innenfor» betyr ikke motbevist, ikke bevist samme rigg —\n' +
      'materialkvalitet («ser ulla ut som ull?») måles fortsatt av øyet, per art bible.',
  );
}

const kjortDirekte = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (kjortDirekte) {
  const visAlle = process.argv.includes('--alle');
  const somJson = process.argv.includes('--json');
  try {
    const resultat = await kjorAnalyse();
    if (somJson) {
      console.log(
        JSON.stringify(
          {
            band: resultat.band,
            assets: resultat.rader.map((r) => ({
              fil: r.fil,
              gjennomsiktigAndel: r.gjennomsiktigAndel,
              middelLuminans: r.middelLuminans,
              middelChroma: r.middelChroma,
              middelHue: r.middelHue,
              hueVektorChroma: r.hueVektorChroma,
              nokkellysX: r.nokkellysX,
              kantbaand: r.kantbaand,
              innenfor: r.innenfor,
              dekketAvProof: r.dekketAvProof,
              avvik: r.avvik,
            })),
            utenforBandet: resultat.utenfor.length,
            maaRegenereresIB2: resultat.maaRegenereres.map((r) => r.fil),
          },
          null,
          2,
        ),
      );
    } else {
      skrivRapport(resultat, { visAlle });
    }
    process.exit(resultat.utenfor.length === 0 ? 0 : 2);
  } catch (err) {
    console.error('[asset-rig-check] Feilet:', err);
    process.exit(1);
  }
}
