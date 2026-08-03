/**
 * asset-rig-check — mekanisk kontroll av UTKLIPPSKONTRAKTEN i public/monter/,
 * med en vakt som gjør det umulig for verktøyet å frikjenne sin egen fasit.
 *
 * ── HVA SOM BLE FUNNET, OG HVORFOR FILEN SER ANNERLEDES UT ENN FØR ──────────
 *
 * Verktøyets første versjon dømte assets mot et FARGEBÅND (middels luminans,
 * chroma og hue) kalibrert på de 9 proof-assetene, maskoten inkludert. Den
 * rapporterte «42 må re-genereres i B2». Tre uavhengige målinger felte det
 * tallet:
 *
 * 1. MASKOTEN FRIKJENTE SEG SELV. `public/monter/maskot.png` og
 *    `docs/design-notes/b1-proof/maskot.png` er samme asset (begge 512×512,
 *    ΔL 0,022, ΔC 0,0014, Δh 3,3°, gjennomsiktighet 74,4 % mot 74,3 %).
 *    Maskoten kalibrerte altså båndet og ble så dømt av det. Den åpnet
 *    hue-buen alene i den varme enden (46,8° mot lue-m-ull på 51,3°) fordi
 *    den har eget materiale — hud og hår. De tre maskotene var de ENESTE
 *    3 av 53 som besto. Tar man maskoten ut, faller 53 av 53.
 *
 *    Art bible §«Lysriggen» sier det selv: «Maskot og værikoner deler
 *    lysretning og skyggemykhet, men KAN HA EGNE MATERIALPROFILER.» Et
 *    fargebånd bygget på materialprofiler som eksplisitt har lov til å avvike,
 *    kan ikke dømme plagg. Kalibreringssettet er derfor de 6 PLAGGENE alene.
 *
 * 2. FARGEBÅNDET MÅLER PLAGGET, IKKE RIGGEN. Middels hue over et alfa-maskert
 *    plagg er plaggets egen farge. Art bible §«Materialer»: «ALDRI recoloring
 *    av plagg for å passe tema. Plaggets farge er INNHOLD.» Å felle
 *    plagg-badebukse på h 219° er å felle den for å være blå.
 *    Kontrollmåling: mot de RENE utklippene i `public/monter/` — der
 *    utklippsforskjellen er borte og bare fargen står igjen — faller
 *    41 av 41, inkludert plagg-tykt-ullsett, som er samme plaggtype som
 *    kalibratoren. Et bånd som feller sin egen plaggtype måler noe annet
 *    enn det påstår.
 *    Jeg testet også en rigg-invariant kandidat (hue/chroma-skiftet mellom
 *    høylys og skygge INNE i hvert asset, der plaggets egenfarge kansellerer):
 *    proof Δhue 67–162°, app Δhue 34–233° — ingen separasjon.
 *    Art bible §«Teknisk produksjon» hadde allerede satt grensen:
 *    «Automatikk måler KANT OG UTSNITT — aldri materialkvalitet.»
 *
 * 3. NØKKELLYS-FORTEGNET VAR EN PORT SOM ALDRI FYRTE. `nokkellysX` er
 *    høylysenes tyngdepunkt og er konfundert av plaggform — nøyaktig det
 *    `tools/retningslys.mjs` ble bygget for å normalisere bort. Den felte
 *    ingen: begge de dokumenterte avvikene som retningslys finner
 *    (plagg-vinterdress: lys NEDENFRA venstre, 51°; plagg-balaklava:
 *    SPEILVENDT, 261°) fikk «venstre — består» her (−0,151 og −0,219).
 *    En svakere kopi av et instrument som allerede finnes, og som slipper
 *    gjennom begge kjente feil, er en falsk frikjennelse. Lysretningen
 *    tilhører retningslys.mjs; den måles ikke her.
 *
 * Det som står igjen er den ene aksen som faktisk er strukturell,
 * innholdsuavhengig og art-bible-hjemlet:
 *
 *   «Transparent objekt og kontakt-/AO-skygge eksporteres SEPARAT (skyggen
 *   bor i UI-laget som standardiserte tokens)» — §Lysriggen
 *   «Skygger bor i UI-laget, ikke i asseten» — §Teknisk produksjon
 *
 * Et asset uten gjennomsiktighet har rommet og bakkeskyggen bakt inn i filen.
 * Det er ikke en smakssak: assetet skal bo i BEGGE rom (espresso natt og krem
 * morgen), og en bakt espressoflate er usynlig i mørk modus og en mørk firkant
 * i lys modus. Delt-asset-premisset faller.
 *
 * ── PORTENE, MED FORUTSETNING ──────────────────────────────────────────────
 * Hver port har både et KRAV og en FORUTSETNING. Uten forutsetningen består en
 * port på FRAVÆR — den fyrer aldri, og stillheten leses som godkjent.
 *
 *   Vakten mot selvdom  krav: ingen asset i både kalibrering og vurdert sett.
 *                       forutsetning: begge sett ikke-tomme, OG identitets-
 *                       testen må fyre på hvert kalibrerings-asset mot SEG
 *                       SELV. Gjør den ikke det, kan «ingen kollisjon» ikke
 *                       stoles på, og vakten kaster.
 *   Utklippskontrakten  krav: gjennomsiktig andel ≥ gulvet.
 *                       forutsetning: gulvet utledes av kalibratorene, så hver
 *                       kalibrator må SELV ha et ekte utklipp. Har én av dem
 *                       rommet bakt inn, blir gulvet 0 og porten kan aldri
 *                       fyre — da kaster kalibreringen i stedet.
 *   Ferdig-utklipp      krav: kandidaten i klippet/ er bevist samme rendering.
 *                       forutsetning: samme dimensjoner, ≥ 1000 sammenlignede
 *                       piksler, og kandidaten må selv bestå utklipps-
 *                       kontrakten. Ellers er «bevist» et ord uten måling.
 *
 * ── TILSTAND VED OMSKRIVINGEN (2026-08-03) ─────────────────────────────────
 * Da målingene over ble tatt hadde alle 42 plagg-PNG-ene i public/monter/
 * 0,0 % gjennomsiktighet — rommet og bakkeskyggen var bakt inn i filen appen
 * serverer — mens et rent utklipp av 41 av dem allerede lå i
 * public/monter/. Underveis ble de 41 promotert (commit «Assets: 41 av
 * 42 klippet — sydvesten trenger manuell maske»). Etter promoteringen står
 * ÉN igjen: plagg-sydvest.png. Poenget står uansett: dette var aldri en
 * re-genereringsjobb på 42 assets — renderingene fantes, alfakanalen manglet.
 *
 * ── HVA VERKTØYET IKKE GJØR ────────────────────────────────────────────────
 * Det avgjør ikke om to assets er i samme LYSRIGG. Den målingen er gjort, og
 * den er formnormalisert: `node tools/retningslys.mjs`. Konklusjonen der er at
 * det ikke finnes en batch-vid riggfeil — 12 av 14 består, med to
 * dokumenterte enkeltavvik. Dette verktøyet motsier den ikke lenger.
 *
 * Kjøres:  node tools/asset-rig-check.mjs [--json] [--alle]
 *          --json  maskinlesbar rapport
 *          --alle  vis også assets som består kontrakten
 * Exit 0 = ingen funn, 2 = funn (samme konvensjon som design-doctrine-lint).
 */
import { readdir, readFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HER = dirname(fileURLToPath(import.meta.url));
export const REPO_ROT = resolve(HER, '..');
export const MONTER_KATALOG = join(REPO_ROT, 'public', 'monter');
/* Assetene er PROMOTERT: de klippede ble byttet inn i public/monter/ og
   public/monter/klippet/ fjernet. Katalogen peker derfor på samme sted som
   MONTER_KATALOG. Kommentaren i testen lovet nettopp dette («så saken ikke
   råtner når assets promoteres») — men konstanten fulgte ikke med, og CI
   var rød i tre commits på ENOENT. */
export const KLIPPET_KATALOG = MONTER_KATALOG;
export const PROOF_KATALOG = join(REPO_ROT, 'docs', 'design-notes', 'b1-proof');

/**
 * Fasiten: de 6 PLAGGENE fra art bible §«B1-proofens omfang», laget i den
 * reviderte riggen. Maskot og værikoner er bevisst UTE — se punkt 1 i
 * hodekommentaren. De har egne materialprofiler per art bible, og maskoten
 * frikjente seg selv så lenge den sto her.
 */
export const KALIBRERINGSSETT = Object.freeze([
  'ullsett-tykt.png',
  'ullsokker.png',
  'ull-mellomlag-tykt.png',
  'vinterdress.png',
  'lue-m-ull.png',
  'votter-tykke.png',
]);

/**
 * Assets i b1-proof/ som IKKE kalibrerer, og hvorfor. Listen er dokumentasjon,
 * ikke logikk — den finnes for at «hvorfor er ikke maskoten med?» skal ha et
 * svar i filen og ikke bare i en portdom.
 */
export const EGEN_MATERIALPROFIL = Object.freeze({
  'maskot.png': 'hud og hår — egen materialprofil (art bible §Lysriggen); åpnet hue-buen alene og dømte seg selv',
  'maskot-nysgjerrig.png': 'samme karakter, samme materialprofil',
  'vaer-delvis-skyet.png': 'filt/ull-ikon — egen materialprofil (art bible §Materialer)',
  'vaer-regn.png': 'filt/ull-ikon — egen materialprofil',
});

/**
 * Steg 12 i T2-arbeidsplanen kopierer proof-assetene inn på disse
 * filnavnene i public/monter/. Brukes til to ting: å merke assets som allerede
 * har en erstatning på vei, og å gi vakten en NAVNE-identitet i tillegg til
 * pikselidentiteten — etter Steg 12 er `plagg-tykt-ullsett.png` bokstavelig
 * talt `ullsett-tykt.png`, og da må vakten fyre.
 */
export const DEKKET_AV_PROOF = Object.freeze({
  'ullsett-tykt.png': 'plagg-tykt-ullsett.png',
  'ullsokker.png': 'plagg-ullsokker.png',
  'ull-mellomlag-tykt.png': 'plagg-ull-mellomlag.png',
  'vinterdress.png': 'plagg-vinterdress.png',
  'lue-m-ull.png': 'plagg-lue-med-ull.png',
  'votter-tykke.png': 'plagg-votter.png',
  'maskot.png': 'maskot.png',
  'maskot-nysgjerrig.png': 'maskot-nysgjerrig.png',
  'vaer-delvis-skyet.png': 'vaer-delvis-skyet.png',
  'vaer-regn.png': 'vaer-regn.png',
});

/**
 * Under denne chroma-lengden er motivet praktisk talt nøytralt og hue-vinkelen
 * er støy. Brukes to steder: i fargeKONTEKSTEN (som ikke er en dom) og i
 * vaktens identitetstest, der en nøytral flate ikke skal skilles fra en annen
 * nøytral flate på en vinkel ingen av dem egentlig har.
 */
export const HUE_PORT = 0.03;

/** Konvolutten rundt fasiten, utvidet med 5 % av sitt eget spenn. */
export const BAND_MARGIN = 0.05;

/**
 * Gulvet for utklippskontrakten, som andel av kalibratorenes laveste
 * gjennomsiktighet. Fordelingen er bimodal i praksis (bakte flater ligger på
 * 0,0 %, ekte utklipp på 58–83 %), så den nøyaktige verdien er ikke bærende —
 * den er satt til halvparten av fasitens laveste for å ha en kalibrert, ikke
 * gjettet, terskel.
 */
export const UTKLIPP_GULV_ANDEL = 0.5;

/**
 * Fingeravtrykket som avgjør om to filer er SAMME asset: et 8×8-rutenett med
 * middels alfa (silhuetten) og alfa-vektet middels L (lyssettingen) per rute.
 *
 * Første forsøk brukte middelverdiene (L, C, h, gjennomsiktighet). Det var for
 * svakt: proof/vinterdress.png og monter/plagg-skallbukse.png er begge mørke og
 * nesten avmettede flater, og kollapset til «samme asset» — vakten fyrte på to
 * plagg som ikke har noe med hverandre å gjøre. Et middeltall er ikke et
 * fingeravtrykk; silhuetten er.
 */
export const FINGERAVTRYKK_RUTER = 8;

/**
 * Målt 2026-08-03 over de aktuelle parene:
 *   samme asset:   maskot ΔAlfa 0,0161 ΔLum 0,0042 · maskot-nysgjerrig 0,0151 / 0,0076
 *   ulike assets:  nærmeste falske kandidat er 0,2671 (vinterdress mot
 *                  plagg-vinterdress — samme plagg, ULIK rendering)
 * Terskelen ligger ~3,7× over de ekte parene og ~4,5× under den nærmeste
 * falske. Bredt nok til re-eksport, trangt nok til å ikke slå sammen plagg.
 */
export const FINGERAVTRYKK_TOLERANSE = Object.freeze({ dAlfa: 0.06, dLum: 0.03 });

/**
 * Toleransen for et ANNET spørsmål: er RGB under masken uendret, altså er
 * utklippet samme rendering som den bakte filen? Klipping som bare nuller alfa
 * gir Δ = 0; alt over dette er en ny rendering.
 */
export const BEVIS_TOLERANSE = Object.freeze({ dL: 0.05, dC: 0.01, dHue: 6 });

/** Minste antall sammenlignede piksler før «bevist samme rendering» betyr noe. */
export const BEVIS_MIN_PIKSLER = 1000;

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

/** Korteste vinkelavstand mellom to hue-grader, 0–180. */
export function hueAvstand(a, b) {
  const d = (((a - b) % 360) + 360) % 360;
  return d > 180 ? 360 - d : d;
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
    const gap = (((neste - sortert[i]) % 360) + 360) % 360;
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
  const fraStart = (((hue - bue.fra) % 360) + 360) % 360;
  return fraStart <= bue.spenn + 1e-9;
}

/* ── Måling ───────────────────────────────────────────────────────────── */

/**
 * 8×8-fingeravtrykk: middels alfa per rute (silhuetten) og alfa-vektet middels
 * L per rute (lyssettingen). Ruter uten dekning får lum 0 og sammenlignes ikke
 * på lum — der er verdien meningsløs.
 */
export function fingeravtrykk({ data, width, height, channels }) {
  const R = FINGERAVTRYKK_RUTER;
  const alfa = new Float64Array(R * R);
  const lum = new Float64Array(R * R);
  const antall = new Float64Array(R * R);
  const vekt = new Float64Array(R * R);
  for (let y = 0; y < height; y++) {
    const cy = Math.min(R - 1, Math.floor((y * R) / height));
    for (let x = 0; x < width; x++) {
      const c = cy * R + Math.min(R - 1, Math.floor((x * R) / width));
      const i = (y * width + x) * channels;
      const a = data[i + 3] / 255;
      alfa[c] += a;
      antall[c]++;
      if (a > 0.5) {
        const [L] = srgbTilOklab(data[i], data[i + 1], data[i + 2]);
        lum[c] += L * a;
        vekt[c] += a;
      }
    }
  }
  for (let c = 0; c < R * R; c++) {
    alfa[c] = antall[c] > 0 ? alfa[c] / antall[c] : 0;
    lum[c] = vekt[c] > 0 ? lum[c] / vekt[c] : 0;
  }
  return { ruter: R, bredde: width, hoyde: height, alfa: Array.from(alfa), lum: Array.from(lum) };
}

/** Største rutevise avvik mellom to fingeravtrykk. Ulik form ⇒ uendelig. */
export function fingeravtrykkAvstand(a, b) {
  if (!a || !b || a.ruter !== b.ruter || a.bredde !== b.bredde || a.hoyde !== b.hoyde) {
    return { dAlfa: Infinity, dLum: Infinity, sammenlignbar: false };
  }
  let dAlfa = 0;
  let dLum = 0;
  for (let c = 0; c < a.ruter * a.ruter; c++) {
    dAlfa = Math.max(dAlfa, Math.abs(a.alfa[c] - b.alfa[c]));
    if (a.alfa[c] >= 0.5 && b.alfa[c] >= 0.5) dLum = Math.max(dLum, Math.abs(a.lum[c] - b.lum[c]));
  }
  return { dAlfa, dLum, sammenlignbar: true };
}

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
 * ville forurenset både hue og luminans.
 *
 * `nokkellysX` beregnes fortsatt, men er IKKE en dom: den er konfundert av
 * plaggform og slipper gjennom begge de dokumenterte lysretningsavvikene.
 * Se hodekommentaren punkt 3 og `tools/retningslys.mjs`.
 */
export function malRaadata(raa) {
  const { data, width, height, channels } = raa;
  const antallPiksler = width * height;
  const alfa = (x, y) => data[(y * width + x) * channels + 3];
  const avtrykk = fingeravtrykk(raa);

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
      fingeravtrykk: avtrykk,
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
    /** Konfundert av form — rapporteres, dømmes ikke. Se retningslys.mjs. */
    nokkellysX: (hoylysX / hoylysN - sumX / n) / motivBredde,
    motivBredde,
    motivHoyde: y1 - y0 + 1,
    fingeravtrykk: avtrykk,
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

/** Leser én PNG som rå RGBA. */
export async function lesRaa(filsti) {
  const { data, info } = await sharp(await readFile(filsti))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

/** Leser én PNG og returnerer målingen + kantbåndfargen. */
export async function malFil(filsti) {
  const raa = await lesRaa(filsti);
  return {
    fil: basename(filsti),
    sti: filsti,
    ...malRaadata(raa),
    kantbaand: kantbaandFarge(raa),
  };
}

/* ── Vakt mot selvdom ─────────────────────────────────────────────────── */

/**
 * Er dette samme asset? Avgjøres av fingeravtrykket — silhuett og lyssetting
 * rute for rute. Middelverdier duger ikke: to mørke, avmettede plagg har samme
 * middel-L og middel-C uten å ha noe med hverandre å gjøre.
 *
 * FORUTSETNING: begge målinger må HA et fingeravtrykk. En identitetstest uten
 * fingeravtrykk kan bare falle tilbake på middelverdier, og et fall tilbake til
 * en svakere test er nøyaktig hvordan en vakt begynner å frikjenne. Mangler
 * det, kaster funksjonen i stedet for å gjette.
 */
export function erSammeAsset(a, b, tol = FINGERAVTRYKK_TOLERANSE) {
  if (!a?.fingeravtrykk || !b?.fingeravtrykk) {
    throw new Error(
      `erSammeAsset: mangler fingeravtrykk for ${!a?.fingeravtrykk ? (a?.fil ?? 'a') : (b?.fil ?? 'b')}. ` +
        'En identitetstest uten fingeravtrykk kan ikke frikjenne.',
    );
  }
  const d = fingeravtrykkAvstand(a.fingeravtrykk, b.fingeravtrykk);
  if (!d.sammenlignbar) return false;
  return d.dAlfa <= tol.dAlfa && d.dLum <= tol.dLum;
}

/**
 * KRAV: ingen asset skal være både kalibrator og dømt. Et verktøy som
 * kalibrerer på det det dømmer, frikjenner seg selv — det var nøyaktig
 * maskotens rolle i første versjon.
 *
 * FORUTSETNING (ellers består vakten på fravær):
 *   a) begge sett må være ikke-tomme — en vakt over 0 par kan aldri fyre;
 *   b) identitetstesten må fyre på hvert kalibrerings-asset mot SEG SELV.
 *      Det er den ene sammenligningen som alltid skal gi treff. Gjør den ikke
 *      det, er testen ødelagt, og «ingen kollisjon» er en påstand testen ikke
 *      kan bære — da kaster vakten i stedet for å tie.
 *
 * NAVNEOVERLAPP kaster IKKE. `plagg-tykt-ullsett.png` er i dag en annen
 * rendering enn `ullsett-tykt.png`; at Steg 12 planlegger å erstatte den er en
 * plan, ikke en identitet. Når kopieringen faktisk har skjedd, blir
 * fingeravtrykkene like og vakten fyrer av seg selv. Overlappet rapporteres
 * som varsel, slik at det ikke forsvinner.
 *
 * @returns {{ sammenlignedePar, selvtestet, navneoverlapp }}
 * @throws  hvis en forutsetning eller kravet brytes
 */
export function vaktIngenSelvdom(kalibrering, vurdert, { erSamme = erSammeAsset } = {}) {
  if (kalibrering.length === 0) {
    throw new Error('Vakt: kalibreringssettet er tomt — en vakt over 0 par kan aldri fyre.');
  }
  if (vurdert.length === 0) {
    throw new Error('Vakt: det vurderte settet er tomt — en vakt over 0 par kan aldri fyre.');
  }

  for (const m of kalibrering) {
    if (!erSamme(m, m)) {
      throw new Error(
        `Vakt: identitetstesten fyrer ikke på ${m.fil ?? '(uten navn)'} mot seg selv. ` +
          'Da kan «ingen kollisjon» ikke stoles på — vakten nekter å frikjenne.',
      );
    }
  }

  const kollisjoner = [];
  const navneoverlapp = [];
  for (const k of kalibrering) {
    const planlagtNavn = DEKKET_AV_PROOF[k.fil];
    for (const v of vurdert) {
      if (Boolean(k.fil) && (k.fil === v.fil || planlagtNavn === v.fil)) {
        navneoverlapp.push({ kalibrator: k.fil, dømt: v.fil });
      }
      if (erSamme(k, v)) {
        const d = fingeravtrykkAvstand(k.fingeravtrykk, v.fingeravtrykk);
        kollisjoner.push({
          kalibrator: k.fil ?? '(uten navn)',
          dømt: v.fil ?? '(uten navn)',
          dAlfa: d.dAlfa,
          dLum: d.dLum,
        });
      }
    }
  }

  if (kollisjoner.length > 0) {
    const linjer = kollisjoner
      .map((k) => `  ${k.kalibrator} = ${k.dømt}  (ΔAlfa ${k.dAlfa.toFixed(4)}, ΔLum ${k.dLum.toFixed(4)})`)
      .join('\n');
    throw new Error(
      `Vakt: ${kollisjoner.length} asset(s) er både kalibrator og dømt. ` +
        'Verktøyet ville frikjent sin egen fasit.\n' +
        linjer,
    );
  }

  return {
    sammenlignedePar: kalibrering.length * vurdert.length,
    selvtestet: kalibrering.length,
    navneoverlapp,
  };
}

/* ── Kalibrering ──────────────────────────────────────────────────────── */

function konvolutt(verdier, margin) {
  const min = verdier.reduce((a, b) => (b < a ? b : a), Infinity);
  const maks = verdier.reduce((a, b) => (b > a ? b : a), -Infinity);
  const slakk = (maks - min) * margin;
  return { min, maks, lav: min - slakk, hoy: maks + slakk };
}

/**
 * Bygger kontrakten fra kalibreringsmålingene. Alltid AVLEDET, aldri
 * hardkodet: endres fasiten, flytter gulvet seg med den.
 *
 * `farge` er KONTEKST, ikke en dom — se hodekommentaren punkt 2. Den regnes
 * fordi tallene er nyttige å se, ikke fordi de kan felle et plagg.
 *
 * FORUTSETNING for utklippsporten: hver kalibrator må selv ha et ekte utklipp.
 * Har én av dem rommet bakt inn, blir gulvet 0 og porten fyrer aldri.
 */
export function kalibrerBand(kalibrering, { margin = BAND_MARGIN, huePort = HUE_PORT } = {}) {
  if (kalibrering.length === 0) {
    throw new Error('Kalibreringssettet er tomt — kan ikke utlede en kontrakt.');
  }

  const utenUtklipp = kalibrering.filter((m) => !(m.gjennomsiktigAndel > 0));
  if (utenUtklipp.length > 0) {
    throw new Error(
      'Kalibrering: ' +
        utenUtklipp.map((m) => m.fil ?? '(uten navn)').join(', ') +
        ' har 0 % gjennomsiktighet. Gulvet ville blitt 0 og utklippsporten kunne aldri fyre.',
    );
  }

  const utklippMin = kalibrering
    .map((m) => m.gjennomsiktigAndel)
    .reduce((a, b) => (b < a ? b : a), Infinity);
  const gulv = utklippMin * UTKLIPP_GULV_ANDEL;
  if (!(gulv > 0)) {
    throw new Error(`Kalibrering: utledet gulv ${gulv} er ikke positivt — porten ville vært tom.`);
  }

  const luminans = konvolutt(kalibrering.map((m) => m.middelLuminans), margin);
  const chroma = konvolutt(kalibrering.map((m) => m.middelChroma), margin);

  const overPort = kalibrering.filter((m) => m.hueVektorChroma >= huePort);
  const raaBue = hueKonvolutt(overPort.map((m) => m.middelHue));
  const hueSlakk = raaBue ? raaBue.spenn * margin : 0;
  const hue = raaBue
    ? {
        fraRaa: raaBue.fra,
        tilRaa: raaBue.til,
        fra: (((raaBue.fra - hueSlakk) % 360) + 360) % 360,
        til: (raaBue.til + hueSlakk) % 360,
        spenn: raaBue.spenn + 2 * hueSlakk,
        kalibrertPaa: overPort.length,
        utenforPort: kalibrering.length - overPort.length,
      }
    : null;

  return {
    antallReferanser: kalibrering.length,
    margin,
    huePort,
    utklipp: { proofMin: utklippMin, gulv },
    /** KONTEKST — ikke en dom. Plaggets farge er innhold (art bible §Materialer). */
    farge: { luminans, chroma, hue },
  };
}

/* ── Dom ──────────────────────────────────────────────────────────────── */

/**
 * Dømmer én måling mot UTKLIPPSKONTRAKTEN. Det er den eneste aksen dette
 * verktøyet dømmer på — den er strukturell, innholdsuavhengig og direkte
 * hjemlet i art bible. Tom liste = kontrakten er holdt.
 */
export function vurder(maaling, band) {
  const avvik = [];

  if (maaling.gjennomsiktigAndel < band.utklipp.gulv) {
    avvik.push({
      akse: 'utklipp',
      tekst:
        `bakt rom — ${(maaling.gjennomsiktigAndel * 100).toFixed(1)} % gjennomsiktig` +
        `${maaling.kantbaand ? `, kantbånd ${maaling.kantbaand}` : ''}` +
        ' (skygge og rom skal bo i UI-laget, ikke i filen)',
    });
  }

  if (!Number.isFinite(maaling.middelLuminans)) {
    avvik.push({ akse: 'motiv', tekst: 'ingen ugjennomsiktige piksler å måle' });
  }

  return avvik;
}

/**
 * Fargemålingen mot kalibratorenes konvolutt. RAPPORTERES, dømmer ikke.
 * Et utslag her betyr «dette plagget har en annen egenfarge enn de seks
 * ullplaggene i fasiten» — som oftest er riktig og alltid tillatt.
 */
export function fargeavvik(maaling, band) {
  const ute = [];
  const f = band.farge;
  if (!Number.isFinite(maaling.middelLuminans)) return ute;

  if (maaling.middelLuminans < f.luminans.lav || maaling.middelLuminans > f.luminans.hoy) {
    ute.push({
      akse: 'luminans',
      tekst: `L ${maaling.middelLuminans.toFixed(3)} utenfor ${f.luminans.lav.toFixed(3)}–${f.luminans.hoy.toFixed(3)}`,
    });
  }
  if (maaling.middelChroma < f.chroma.lav || maaling.middelChroma > f.chroma.hoy) {
    ute.push({
      akse: 'chroma',
      tekst: `C ${maaling.middelChroma.toFixed(4)} utenfor ${f.chroma.lav.toFixed(4)}–${f.chroma.hoy.toFixed(4)}`,
    });
  }
  if (f.hue && maaling.hueVektorChroma >= band.huePort && !hueInnenfor(maaling.middelHue, f.hue)) {
    ute.push({
      akse: 'hue',
      tekst: `h ${maaling.middelHue.toFixed(1)}° utenfor ${f.hue.fra.toFixed(1)}°–${f.hue.til.toFixed(1)}°`,
    });
  }
  return ute;
}

/* ── Bevis: finnes det allerede et ferdig utklipp? ────────────────────── */

/** Middel-L/C/h for `bilde` begrenset til `maske`s helt ugjennomsiktige piksler. */
export function malUnderMaske(bilde, maske) {
  if (bilde.width !== maske.width || bilde.height !== maske.height) return null;
  let n = 0;
  let sumL = 0;
  let sumA = 0;
  let sumB = 0;
  const antall = maske.width * maske.height;
  for (let p = 0; p < antall; p++) {
    if (maske.data[p * maske.channels + 3] !== 255) continue;
    const j = p * bilde.channels;
    const [L, a, b] = srgbTilOklab(bilde.data[j], bilde.data[j + 1], bilde.data[j + 2]);
    sumL += L;
    sumA += a;
    sumB += b;
    n++;
  }
  if (n === 0) return null;
  return { L: sumL / n, C: Math.hypot(sumA / n, sumB / n), h: hueGrader(sumA / n, sumB / n), n };
}

/**
 * Er `utklipp` det SAMME renderte bildet som `uklippet`, bare med rommet
 * fjernet? Måler `uklippet` sine RGB-verdier under `utklipp` sin alfamaske og
 * sammenligner med utklippets egne. Klipping som bare nuller alfa gir Δ = 0.
 *
 * FORUTSETNING: like dimensjoner og ≥ BEVIS_MIN_PIKSLER sammenlignede piksler.
 * Uten den er «bevist» et ord uten måling, og funksjonen svarer nei med grunn.
 */
export function bevisSammeRendering(uklippet, utklipp, tol = BEVIS_TOLERANSE) {
  if (uklippet.width !== utklipp.width || uklippet.height !== utklipp.height) {
    return { sammeRendering: false, grunn: `ulike dimensjoner (${uklippet.width}×${uklippet.height} mot ${utklipp.width}×${utklipp.height})` };
  }
  const a = malUnderMaske(uklippet, utklipp);
  const b = malUnderMaske(utklipp, utklipp);
  if (!a || !b) return { sammeRendering: false, grunn: 'ingen felles ugjennomsiktige piksler å måle' };
  if (a.n < BEVIS_MIN_PIKSLER) {
    return { sammeRendering: false, grunn: `bare ${a.n} sammenlignede piksler (krever ${BEVIS_MIN_PIKSLER})`, piksler: a.n };
  }
  const dL = Math.abs(a.L - b.L);
  const dC = Math.abs(a.C - b.C);
  const dHue = hueAvstand(a.h, b.h);
  const sammeRendering = dL <= tol.dL && dC <= tol.dC && dHue <= tol.dHue;
  return { sammeRendering, dL, dC, dHue, piksler: a.n };
}

/* ── Rapport ──────────────────────────────────────────────────────────── */

async function finnesKatalog(katalog) {
  try {
    await readdir(katalog);
    return true;
  } catch {
    return false;
  }
}

export async function kjorAnalyse() {
  const kalibrering = [];
  for (const navn of KALIBRERINGSSETT) kalibrering.push(await malFil(join(PROOF_KATALOG, navn)));

  const monterFiler = (await readdir(MONTER_KATALOG)).filter((f) => f.endsWith('.png')).sort();
  const harKlippet = await finnesKatalog(KLIPPET_KATALOG);
  const klippetFiler = harKlippet
    ? new Set((await readdir(KLIPPET_KATALOG)).filter((f) => f.endsWith('.png')))
    : new Set();

  const rader = [];
  for (const navn of monterFiler) {
    const raa = await lesRaa(join(MONTER_KATALOG, navn));
    const maaling = { fil: navn, sti: join(MONTER_KATALOG, navn), ...malRaadata(raa), kantbaand: kantbaandFarge(raa) };
    rader.push({ raa, maaling });
  }

  // Vakten kjører FØR kontrakten utledes: en kontrakt bygget på et sett som
  // inneholder det den dømmer, er ugyldig uansett hvor pent tallene ser ut.
  const vakt = vaktIngenSelvdom(kalibrering, rader.map((r) => r.maaling));
  const band = kalibrerBand(kalibrering);

  const ferdige = [];
  for (const r of rader) {
    r.avvik = vurder(r.maaling, band);
    r.innenfor = r.avvik.length === 0;
    r.farge = fargeavvik(r.maaling, band);

    r.ferdigUtklipp = null;
    if (!r.innenfor && klippetFiler.has(r.maaling.fil)) {
      const kandidatRaa = await lesRaa(join(KLIPPET_KATALOG, r.maaling.fil));
      const kandidat = malRaadata(kandidatRaa);
      const bevis = bevisSammeRendering(r.raa, kandidatRaa);
      // FORUTSETNING: kandidaten må selv bestå kontrakten, ellers er den
      // ikke et utklipp — bare en annen fil med samme navn.
      const beståttSelv = kandidat.gjennomsiktigAndel >= band.utklipp.gulv;
      r.ferdigUtklipp = { ...bevis, beståttSelv, gjennomsiktigAndel: kandidat.gjennomsiktigAndel };
      if (bevis.sammeRendering && beståttSelv) ferdige.push(r.maaling.fil);
    }
    r.raa = null; // slipp bufferet
  }

  const utenfor = rader.filter((r) => !r.innenfor);
  const manglerUtklipp = utenfor.filter((r) => !(r.ferdigUtklipp?.sammeRendering && r.ferdigUtklipp?.beståttSelv));

  return { vakt, band, kalibrering, rader, utenfor, ferdige, manglerUtklipp, harKlippet };
}

function tallKolonne(v, desimaler) {
  return Number.isFinite(v) ? v.toFixed(desimaler) : '—';
}

function skrivRapport({ vakt, band, rader, utenfor, ferdige, manglerUtklipp, harKlippet }, { visAlle }) {
  console.log('asset-rig-check — utklippskontrakten i public/monter/\n');

  console.log(`KALIBRERING (${band.antallReferanser} plagg fra b1-proof/)`);
  console.log(`  ute av settet       ${Object.keys(EGEN_MATERIALPROFIL).join(', ')}`);
  console.log('                      — egne materialprofiler (art bible §Lysriggen); maskoten dømte seg selv');
  console.log(`  vakt mot selvdom    ${vakt.sammenlignedePar} par sammenlignet, ${vakt.selvtestet} selvtester fyrte, 0 kollisjoner`);
  if (vakt.navneoverlapp.length > 0) {
    console.log(`  navneoverlapp       ${vakt.navneoverlapp.length} (Steg 12 planlegger å erstatte disse med kalibratoren —`);
    console.log('                      skjer det, blir fingeravtrykkene like og vakten stopper kjøringen)');
    for (const n of vakt.navneoverlapp) console.log(`                        ${n.kalibrator} → ${n.dømt}`);
  }
  console.log(`  gjennomsiktig andel ≥ ${(band.utklipp.gulv * 100).toFixed(1)} %   (kalibratorenes laveste: ${(band.utklipp.proofMin * 100).toFixed(1)} %)`);

  const vist = visAlle ? rader : utenfor;
  console.log(`\nDOM — utklippskontrakten (art bible §Lysriggen, §Teknisk produksjon)`);
  console.log(`${'FIL'.padEnd(32)}${'GJSIKT'.padStart(8)}  ${'KANTBÅND'.padEnd(10)}FERDIG UTKLIPP I klippet/`);
  for (const r of vist) {
    const m = r.maaling;
    let ferdig = '';
    if (r.innenfor) ferdig = '— (består kontrakten)';
    else if (!harKlippet) ferdig = 'klippet/ finnes ikke';
    else if (!r.ferdigUtklipp) ferdig = 'ingen kandidat';
    else if (!r.ferdigUtklipp.beståttSelv) ferdig = 'kandidat er selv ikke et utklipp';
    else if (!r.ferdigUtklipp.sammeRendering) ferdig = `kandidat er en ANNEN rendering (${r.ferdigUtklipp.grunn ?? `ΔL ${r.ferdigUtklipp.dL.toFixed(4)}`})`;
    else ferdig = `ja — bevist samme rendering (ΔL ${r.ferdigUtklipp.dL.toFixed(4)}, ${r.ferdigUtklipp.piksler} px)`;
    console.log(
      m.fil.padEnd(32) +
        `${(m.gjennomsiktigAndel * 100).toFixed(1)} %`.padStart(8) +
        '  ' +
        (m.kantbaand ?? '—').padEnd(10) +
        ferdig,
    );
  }

  const innenfor = rader.filter((r) => r.innenfor);
  console.log(`\nUTENFOR KONTRAKTEN: ${utenfor.length} av ${rader.length}`);
  console.log(
    `INNENFOR:           ${innenfor.length}` +
      (visAlle && innenfor.length ? ` (${innenfor.map((r) => r.maaling.fil).join(', ')})` : ''),
  );
  console.log(`\n  · ${ferdige.length} har allerede et FERDIG UTKLIPP i public/monter/, bevist samme rendering`);
  console.log(`  · ${manglerUtklipp.length} mangler utklipp${manglerUtklipp.length ? `: ${manglerUtklipp.map((r) => r.maaling.fil).join(', ')}` : ''}`);
  console.log('\n  Dette er en KLIPPE-jobb, ikke en re-genereringsjobb: renderingene');
  console.log('  finnes allerede, det er alfakanalen som mangler i filen appen serverer.');

  console.log('\nMÅLT FARGE — KONTEKST, IKKE EN DOM');
  console.log(`  kalibratorenes spenn: L ${band.farge.luminans.lav.toFixed(3)}–${band.farge.luminans.hoy.toFixed(3)}  ` +
    `C ${band.farge.chroma.lav.toFixed(4)}–${band.farge.chroma.hoy.toFixed(4)}` +
    (band.farge.hue ? `  h ${band.farge.hue.fra.toFixed(1)}°–${band.farge.hue.til.toFixed(1)}°` : ''));
  const medFargeavvik = rader.filter((r) => r.farge.length > 0);
  console.log(`  ${medFargeavvik.length} av ${rader.length} ligger utenfor det spennet. Det er FORVENTET:`);
  console.log('  middels hue over et plagg er plaggets egen farge, og «plaggets farge er');
  console.log('  innhold» (art bible §Materialer). Automatikk måler kant og utsnitt —');
  console.log('  aldri materialkvalitet (§Teknisk produksjon).');

  console.log('\nLYSRETNING måles IKKE her. `nokkellysX` er konfundert av plaggform og');
  console.log('slipper gjennom begge de dokumenterte avvikene. Bruk `node tools/retningslys.mjs`.');
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
            vakt: resultat.vakt,
            band: resultat.band,
            assets: resultat.rader.map((r) => ({
              fil: r.maaling.fil,
              gjennomsiktigAndel: r.maaling.gjennomsiktigAndel,
              middelLuminans: r.maaling.middelLuminans,
              middelChroma: r.maaling.middelChroma,
              middelHue: r.maaling.middelHue,
              hueVektorChroma: r.maaling.hueVektorChroma,
              kantbaand: r.maaling.kantbaand,
              innenfor: r.innenfor,
              avvik: r.avvik,
              fargeKontekst: r.farge,
              ferdigUtklipp: r.ferdigUtklipp,
            })),
            utenforKontrakten: resultat.utenfor.length,
            harFerdigUtklipp: resultat.ferdige,
            manglerUtklipp: resultat.manglerUtklipp.map((r) => r.maaling.fil),
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
