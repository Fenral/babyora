#!/usr/bin/env node
/**
 * gradient-retning — lysretning og amplitude som HANDHEVET regel i appen.
 *
 * Eierregel: lyset kommer ovenfra. Da skal enhver lysflate vare LYSEST
 * OVERST, og fallet ma vare STORT NOK til a leses pa en telefon.
 *
 * Eieren har korrigert oss TO ganger pa nettopp dette:
 *   1. «Hvis lyset kommer fra toppen — er det ikke naturlig at det er lysest
 *      overst i boksen?»  (retningen var invertert)
 *   2. «Mener det gikk fra lyst til morkt pa listen»  (retningen var riktig,
 *      men fallet var skrumpet til 4,8 trinn og leste som flatt)
 * Derfor sjekker denne bade RETNING og AMPLITUDE. Portert fra den beviste
 * referansen docs/design-notes/b1-proof/gradient-retning.mjs.
 *
 * ── LARDOMMEN SOM STYRER HELE PARSEREN ──────────────────────────────────
 * Forste versjon av proof-sjekken hoppet STILLTIENDE over `.vitrine` fordi
 * regexet ikke taklet var() inne i gradienten — altsa nettopp flaten saken
 * gjaldt. En sjekk som ikke ser en flate, sier «rent» om den.
 *
 * Derfor gjelder to absolutte regler her:
 *   A. TELL PARENTESER, ikke gjett. var(), rgba() og color-mix() inne i en
 *      gradient avslutter ikke uttrykket.
 *   B. INGEN STILLE HOPP. Hver eneste linear-gradient i kilden skal dukke
 *      opp i utskriften — enten med en dom, eller med en NAVNGITT grunn til
 *      at den ikke domres. Et regnskap sammenligner rat antall
 *      `linear-gradient(` i kilden mot antall sjekken faktisk sa; avviker de,
 *      er instrumentet odelagt (exit 2), ikke flaten ren.
 *   Og selvtesten under (--selftest, kjores automatisk ved HVER kjoring)
 *   beviser A og B pa en fikstur som inneholder nettopp de formene som
 *   knekker naive regexer.
 *
 * Bruk:
 *   node tools/gradient-retning.mjs [filer...]     (uten arg: standardfilene)
 *   node tools/gradient-retning.mjs --selftest     (kun selvtesten, ordrikt)
 *
 * Exit: 0 = rent · 1 = funn (feil retning / for svakt fall) · 2 = sjekken
 * selv er odelagt (selvtest ryker, regnskap avviker, eller en farge kan ikke
 * leses — da vet vi ikke hva flaten gjor, og det skal aldri lese som «rent»).
 *
 * Modellvalg (dokumentert, ikke skjult):
 *  - Luminans = 0.2126R + 0.7152G + 0.0722B pa sRGB-byte, samme skala som
 *    proofen. MIN_FALL = 8 er kalibrert mot NETTOPP den skalaen.
 *  - Halvgjennomsiktige fargestopp komponeres mot regelens EGEN
 *    background-color (ellers --dw-canvas for temaet). Proofen komponerte
 *    implisitt mot svart, som gir meningslost store fall i lys modus.
 *    Bakgrunnen som ble brukt star i utskriften.
 *  - 0deg peker mot toppen, 180deg mot bunnen; forste fargestopp ligger i
 *    motsatt ende av retningen. Gradienter uten vertikal komponent
 *    (~horisontale) har ingen lysretning og domres ikke — men de TELLES.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, isAbsolute, relative, resolve } from 'node:path';

const ROT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Luminanstrinn (0-255). Under dette leser flaten som flat pa en telefon. */
const MIN_FALL = 8;
/** Endepunkter naermere hverandre enn dette er dekorativt slor, ikke en lysflate. */
const SLOR = 0.5;
/** Innenfor 5 grader av horisontalen finnes det ingen «overst». */
const HORISONTAL_GRENSE = Math.sin((5 * Math.PI) / 180);

const STANDARDFILER = [
  'src/components/hjem/hjem-monter.css',
  'src/styles/design-tokens-v2.css',
];
/** Tokenkilden — hva var() faktisk peker pa, per tema. */
const TOKENFIL = 'src/styles/design-tokens-v2.css';
const TEMAER = ['dark', 'light'];

/* ══════════════════════════════════════════════════════════════════════════
   1. Skjelett: kommentarer bort, strengers STRUKTURTEGN bort
   ══════════════════════════════════════════════════════════════════════════
   Kommentarer blankes helt (men nylinjer beholdes, sa linjenumre stemmer).
   Strenger blankes ogsa — ellers ville `content: 'linear-gradient(…)'` telt
   som en gradient. UNNTAK: strenger inne i en attributtselektor beholdes, sa
   [data-theme="light"] fortsatt kan leses av temaskillet. Skjelettet har
   NOYAKTIG samme lengde som kilden, sa alle offsets er felles. */
function skjelettAv(raw) {
  const ut = raw.split('');
  let i = 0;
  let iKlammer = 0; // [ … ] utenfor strenger = attributtselektor
  while (i < raw.length) {
    if (raw[i] === '/' && raw[i + 1] === '*') {
      let slutt = raw.indexOf('*/', i + 2);
      slutt = slutt === -1 ? raw.length : slutt + 2;
      for (let k = i; k < slutt; k++) if (ut[k] !== '\n') ut[k] = ' ';
      i = slutt;
      continue;
    }
    if (raw[i] === '"' || raw[i] === "'") {
      const q = raw[i];
      let j = i + 1;
      while (j < raw.length && raw[j] !== q) {
        if (raw[j] === '\\') j += 1;
        j += 1;
      }
      for (let k = i + 1; k < j && k < raw.length; k++) {
        if (ut[k] === '\n') continue;
        if (iKlammer > 0 ? '{};'.includes(ut[k]) : true) ut[k] = ' ';
      }
      i = j + 1;
      continue;
    }
    if (raw[i] === '[') iKlammer += 1;
    else if (raw[i] === ']') iKlammer = Math.max(0, iKlammer - 1);
    i += 1;
  }
  return ut.join('');
}

const linjekart = (raw) => {
  const start = [0];
  for (let i = 0; i < raw.length; i++) if (raw[i] === '\n') start.push(i + 1);
  return (indeks) => {
    let lo = 0;
    let hi = start.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (start[mid] <= indeks) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
};

/* ══════════════════════════════════════════════════════════════════════════
   2. Blokkstruktur: tell KLAMMER, ikke gjett hvor en blokk slutter
   ══════════════════════════════════════════════════════════════════════════
   Proofen fant blokkslutt med indexOf('\n  }') — det virker bare sa lenge
   innrykket er akkurat det forventede. Her telles { og } sa nostede @media-
   og @keyframes-blokker handteres riktig. */
function parseBlokker(skjelett) {
  const blokker = [];
  const stabel = [];
  let preludeStart = 0;
  for (let i = 0; i < skjelett.length; i++) {
    const c = skjelett[i];
    if (c === '{') {
      const forelder = stabel.length ? stabel[stabel.length - 1] : -1;
      const idx = blokker.length;
      blokker.push({
        prelude: skjelett.slice(preludeStart, i).trim().replace(/\s+/g, ' '),
        preludeStart,
        bodyStart: i + 1,
        bodyEnd: -1,
        forelder,
        barn: [],
      });
      if (forelder >= 0) blokker[forelder].barn.push(idx);
      stabel.push(idx);
      preludeStart = i + 1;
    } else if (c === '}') {
      const idx = stabel.pop();
      if (idx !== undefined) blokker[idx].bodyEnd = i;
      preludeStart = i + 1;
    } else if (c === ';') {
      preludeStart = i + 1;
    }
  }
  for (const b of blokker) if (b.bodyEnd === -1) b.bodyEnd = skjelett.length;
  return blokker;
}

/** Blokkens EGEN kropp: barneblokkenes spenn blankes ut, sa en @media-blokk
 *  ikke arver deklarasjonene til reglene inni seg. */
function egenKropp(blokker, idx, skjelett) {
  const b = blokker[idx];
  const buf = skjelett.slice(b.bodyStart, b.bodyEnd).split('');
  for (const barn of b.barn) {
    const c = blokker[barn];
    for (let k = c.preludeStart; k <= c.bodyEnd && k < b.bodyEnd; k++) {
      const p = k - b.bodyStart;
      if (p >= 0 && buf[p] !== '\n') buf[p] = ' ';
    }
  }
  return buf.join('');
}

/** Deklarasjoner i en blokk: splitt pa `;` PA DYBDE 0 (parenteser teller).
 *  Verdiene leses fra SKJELETTET, ikke kilden — ellers ville en gradient inne
 *  i en streng (content: 'linear-gradient(…)') telle som en ekte gradient, og
 *  regnskapet mot fasiten ville sprike. */
function deklarasjoner(blokker, idx, kilde) {
  const b = blokker[idx];
  const kropp = egenKropp(blokker, idx, kilde.skjelett);
  const ut = [];
  let dybde = 0;
  let start = 0;
  const skyv = (slutt) => {
    const bit = kropp.slice(start, slutt);
    if (bit.trim()) {
      const kolon = finnKolon(bit);
      if (kolon > 0) {
        const verdiRa = bit.slice(kolon + 1);
        const foran = verdiRa.length - verdiRa.trimStart().length;
        ut.push({
          prop: bit.slice(0, kolon).trim().toLowerCase(),
          verdi: verdiRa.trim(),
          verdiStart: b.bodyStart + start + kolon + 1 + foran,
        });
      }
    }
    start = slutt + 1;
  };
  for (let i = 0; i < kropp.length; i++) {
    const c = kropp[i];
    if (c === '(') dybde += 1;
    else if (c === ')') dybde = Math.max(0, dybde - 1);
    else if (c === ';' && dybde === 0) skyv(i);
  }
  skyv(kropp.length);
  return ut;
}

function finnKolon(bit) {
  let dybde = 0;
  for (let i = 0; i < bit.length; i++) {
    const c = bit[i];
    if (c === '(') dybde += 1;
    else if (c === ')') dybde = Math.max(0, dybde - 1);
    else if (c === ':' && dybde === 0) return i;
  }
  return -1;
}

/** Splitt pa komma pa DYBDE 0 — var(--a, #fff) og rgba(1,2,3) skal overleve. */
function deleTopp(tekst) {
  const ut = [];
  let dybde = 0;
  let start = 0;
  for (let i = 0; i < tekst.length; i++) {
    const c = tekst[i];
    if (c === '(') dybde += 1;
    else if (c === ')') dybde = Math.max(0, dybde - 1);
    else if (c === ',' && dybde === 0) {
      ut.push(tekst.slice(start, i).trim());
      start = i + 1;
    }
  }
  ut.push(tekst.slice(start).trim());
  return ut.filter((s) => s.length > 0);
}

/** Hent innholdet i en funksjon ved a TELLE PARENTESER fra apningen.
 *  Dette er kjernen i A-regelen — var()/rgba()/color-mix() inni avslutter ikke. */
function innholdFra(tekst, apnParen) {
  let dybde = 1;
  let i = apnParen + 1;
  while (i < tekst.length && dybde > 0) {
    if (tekst[i] === '(') dybde += 1;
    else if (tekst[i] === ')') dybde -= 1;
    i += 1;
  }
  return { innhold: tekst.slice(apnParen + 1, i - 1), slutt: i };
}

/* ══════════════════════════════════════════════════════════════════════════
   3. Tokens per tema
   ══════════════════════════════════════════════════════════════════════════ */
const erRotSelektor = (sel) =>
  /^(:root|html)\b/.test(sel.replace(/:not\([^)]*\)/g, '').trim()) &&
  !/\s/.test(sel.replace(/:not\([^)]*\)/g, '').trim());

/** Hvilke temaer gjelder denne blokken for? :not(...) fjernes FOR testen —
 *  ellers leser `:root:not([data-theme="dark"])` som en mork-blokk. */
function temaFor(atRegler, selektor) {
  const sel = selektor.replace(/:not\([^)]*\)/g, ' ');
  const at = atRegler.join(' ');
  if (/prefers-color-scheme\s*:\s*light/.test(at)) return ['light'];
  if (/prefers-color-scheme\s*:\s*dark/.test(at)) return ['dark'];
  if (/\[data-theme\s*=\s*["']?light["']?\]/.test(sel)) return ['light'];
  if (/\[data-theme\s*=\s*["']?dark["']?\]/.test(sel)) return ['dark'];
  return [...TEMAER];
}

function atReglerFor(blokker, idx) {
  const ut = [];
  let p = blokker[idx].forelder;
  while (p >= 0) {
    if (blokker[p].prelude.startsWith('@')) ut.push(blokker[p].prelude);
    p = blokker[p].forelder;
  }
  return ut;
}

function byggTokens(kilder) {
  const tokens = { dark: {}, light: {} };
  const lysBlokker = [];
  for (const kilde of kilder) {
    const { blokker } = kilde;
    blokker.forEach((b, idx) => {
      if (!erRotSelektor(b.prelude)) return;
      const temaer = temaFor(atReglerFor(blokker, idx), b.prelude);
      const par = {};
      for (const d of deklarasjoner(blokker, idx, kilde)) {
        if (d.prop.startsWith('--')) par[d.prop] = d.verdi;
      }
      if (!Object.keys(par).length) return;
      for (const t of temaer) Object.assign(tokens[t], par);
      if (temaer.length === 1 && temaer[0] === 'light') {
        lysBlokker.push({ selektor: b.prelude, fil: kilde.navn, par });
      }
    });
  }
  return { tokens, lysBlokker };
}

/** Lys modus er definert TO steder (@media + [data-theme="light"]). Driver de
 *  fra hverandre, maler sjekken feil tema for den ene veien. */
function sjekkLysDublett(lysBlokker) {
  const avvik = [];
  for (let i = 1; i < lysBlokker.length; i++) {
    const a = lysBlokker[0];
    const b = lysBlokker[i];
    const navn = new Set([...Object.keys(a.par), ...Object.keys(b.par)]);
    for (const n of navn) {
      if ((a.par[n] ?? '(mangler)') !== (b.par[n] ?? '(mangler)')) {
        avvik.push(`${n}: «${a.selektor}» = ${a.par[n] ?? '(mangler)'} · «${b.selektor}» = ${b.par[n] ?? '(mangler)'}`);
      }
    }
  }
  return avvik;
}

/* ══════════════════════════════════════════════════════════════════════════
   4. Farger
   ══════════════════════════════════════════════════════════════════════════ */
const NAVNGITTE = {
  transparent: { r: 0, g: 0, b: 0, a: 0 },
  black: { r: 0, g: 0, b: 0, a: 1 },
  white: { r: 255, g: 255, b: 255, a: 1 },
};

function hexFarge(txt) {
  const m = /^#([0-9a-fA-F]{3,8})$/.exec(txt);
  if (!m) return null;
  const h = m[1];
  const dbl = (s) => parseInt(s + s, 16);
  if (h.length === 3 || h.length === 4) {
    return {
      r: dbl(h[0]), g: dbl(h[1]), b: dbl(h[2]),
      a: h.length === 4 ? dbl(h[3]) / 255 : 1,
    };
  }
  if (h.length === 6 || h.length === 8) {
    const n = parseInt(h.slice(0, 6), 16);
    return {
      r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255,
      a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
    };
  }
  return null;
}

/** Los et fargeuttrykk til {r,g,b,a}. Returnerer null nar den ikke KAN leses —
 *  og da er det en hoyt ropt feil hos kalleren, aldri et stille hopp. */
function losFarge(uttrykk, tema, tokens, dybde = 0) {
  const txt = (uttrykk ?? '').trim();
  if (!txt || dybde > 12) return null;
  const lav = txt.toLowerCase();
  if (NAVNGITTE[lav]) return { ...NAVNGITTE[lav] };
  const hex = hexFarge(txt);
  if (hex) return hex;

  if (lav.startsWith('var(')) {
    const { innhold } = innholdFra(txt, txt.indexOf('('));
    const deler = deleTopp(innhold);
    const navn = deler[0];
    const fallback = deler.slice(1).join(',');
    const verdi = tokens[tema]?.[navn];
    if (verdi !== undefined) return losFarge(verdi, tema, tokens, dybde + 1);
    if (fallback) return losFarge(fallback, tema, tokens, dybde + 1);
    return null;
  }

  if (lav.startsWith('rgb(') || lav.startsWith('rgba(')) {
    const { innhold } = innholdFra(txt, txt.indexOf('('));
    const tall = innhold.match(/-?[\d.]+%?/g);
    if (!tall || tall.length < 3) return null;
    const kanal = (s) => (s.endsWith('%') ? (parseFloat(s) / 100) * 255 : parseFloat(s));
    const alfa = tall[3] === undefined
      ? 1
      : tall[3].endsWith('%') ? parseFloat(tall[3]) / 100 : parseFloat(tall[3]);
    return { r: kanal(tall[0]), g: kanal(tall[1]), b: kanal(tall[2]), a: alfa };
  }

  if (lav.startsWith('color-mix(')) {
    const { innhold } = innholdFra(txt, txt.indexOf('('));
    const deler = deleTopp(innhold);
    if (deler.length < 3) return null;
    const les = (bit) => {
      const m = /\s(-?[\d.]+)%\s*$/.exec(' ' + bit);
      return m
        ? { farge: bit.slice(0, bit.length - m[0].length + 1).trim(), pst: parseFloat(m[1]) / 100 }
        : { farge: bit.trim(), pst: null };
    };
    const a = les(deler[1]);
    const b = les(deler[2]);
    let pa = a.pst;
    let pb = b.pst;
    if (pa === null && pb === null) { pa = 0.5; pb = 0.5; }
    else if (pa === null) pa = 1 - pb;
    else if (pb === null) pb = 1 - pa;
    const sum = pa + pb;
    if (sum > 0) { pa /= sum; pb /= sum; }
    const fa = losFarge(a.farge, tema, tokens, dybde + 1);
    const fb = losFarge(b.farge, tema, tokens, dybde + 1);
    if (!fa || !fb) return null;
    const alfa = pa * fa.a + pb * fb.a;
    if (alfa === 0) return { r: 0, g: 0, b: 0, a: 0 };
    return {
      r: (pa * fa.a * fa.r + pb * fb.a * fb.r) / alfa,
      g: (pa * fa.a * fa.g + pb * fb.a * fb.g) / alfa,
      b: (pa * fa.a * fa.b + pb * fb.a * fb.b) / alfa,
      a: alfa,
    };
  }
  return null;
}

const lumRGB = (f) => 0.2126 * f.r + 0.7152 * f.g + 0.0722 * f.b;
const lumOver = (f, bak) => (f.a >= 1 ? lumRGB(f) : f.a * lumRGB(f) + (1 - f.a) * lumRGB(bak));

/* ══════════════════════════════════════════════════════════════════════════
   5. Gradientens retning
   ══════════════════════════════════════════════════════════════════════════ */
const NOKKELRETNING = { top: 0, right: 90, bottom: 180, left: 270 };

/** Tolk en tekst som EN retning. Null = teksten er ikke en retning. */
function tolkVinkeltekst(tekst) {
  const t = (tekst ?? '').trim().toLowerCase();
  const vinkel = /^(-?[\d.]+)(deg|rad|grad|turn)$/.exec(t);
  if (vinkel) {
    const v = parseFloat(vinkel[1]);
    const grader =
      vinkel[2] === 'deg' ? v
      : vinkel[2] === 'rad' ? (v * 180) / Math.PI
      : vinkel[2] === 'grad' ? v * 0.9
      : v * 360;
    return { grader, eksplisitt: true, erStopp: false };
  }
  if (t.startsWith('to ')) {
    const ord = t.slice(3).trim().split(/\s+/).filter((o) => o in NOKKELRETNING);
    if (!ord.length) return null;
    // Hjornekombinasjoner: gjennomsnittsretningen holder for FORTEGNET pa den
    // vertikale komponenten, som er alt regelen trenger.
    const vert = ord.includes('top') ? 0 : ord.includes('bottom') ? 180 : null;
    const hori = ord.includes('right') ? 90 : ord.includes('left') ? 270 : null;
    let grader;
    if (vert !== null && hori !== null) grader = hori === 90 ? (vert === 0 ? 45 : 135) : (vert === 0 ? 315 : 225);
    else grader = vert !== null ? vert : hori;
    return { grader, eksplisitt: true, erStopp: false };
  }
  if (/^in\s+/.test(t)) return { grader: 180, eksplisitt: false, erStopp: false }; // fargerom-hint
  return null;
}

/**
 * Retningen til en gradient — inkludert nar den ligger i et TOKEN.
 * design-tokens-v2.css har `--dw-lys-vinkel: 135deg`, sa
 * `linear-gradient(var(--dw-lys-vinkel), a, b)` er en reell form. Uten dette
 * oppslaget ville den lest som «ingen retning» og stille blitt antatt 180deg —
 * samme klasse feil som .vitrine-hoppet. Kan retningen ikke avgjores,
 * returneres null og kalleren roper (blind), aldri en antakelse.
 */
function tolkRetning(forsteDel, tema, tokens) {
  const t = (forsteDel ?? '').trim();
  const direkte = tolkVinkeltekst(t);
  if (direkte) return direkte;

  const heleErVar = /^var\s*\(/i.test(t) && innholdFra(t, t.indexOf('(')).slutt === t.length;
  if (heleErVar) {
    const { innhold } = innholdFra(t, t.indexOf('('));
    const deler = deleTopp(innhold);
    const verdi = tokens[tema]?.[deler[0]] ?? deler.slice(1).join(',');
    const via = verdi ? tolkVinkeltekst(String(verdi).trim()) : null;
    if (via) return { ...via, via: `${deler[0]} = ${String(verdi).trim()}` };
    if (losFarge(t, tema, tokens)) return { grader: 180, eksplisitt: false, erStopp: true };
    return null; // verken vinkel eller farge — vi VET ikke, og later ikke som
  }
  return { grader: 180, eksplisitt: false, erStopp: true }; // CSS-standard «to bottom»
}

/** dy > 0 = retningen peker NEDOVER = forste fargestopp ligger OVERST. */
function vertikalKomponent(grader) {
  const n = (((grader % 360) + 360) % 360) * (Math.PI / 180);
  return -Math.cos(n);
}

/** Et posisjonsledd. Enheten er VALGFRI — «#E8E2D6 0 4px» har et bart 0, og
 *  et posisjonsledd som blir hengende igjen gjor fargen uleselig. */
const POSISJON = /^-?[\d.]+(%|px|r?em|vh|vw|vmin|vmax|ch|ex|cm|mm|q|in|pt|pc|deg)?$/i;
/** Et bart posisjonsledd (fargeovergangs-hint) er ikke et fargestopp. */
const erBartHint = (bit) => POSISJON.test(bit.trim());

/** Skrell posisjonene av «<farge> <pos>? <pos>?» — telt pa DYBDE 0. */
function fargedelAv(stopp) {
  const biter = [];
  let dybde = 0;
  let start = 0;
  for (let i = 0; i <= stopp.length; i++) {
    const c = stopp[i];
    if (c === '(') dybde += 1;
    else if (c === ')') dybde = Math.max(0, dybde - 1);
    else if ((i === stopp.length || /\s/.test(c)) && dybde === 0) {
      const bit = stopp.slice(start, i).trim();
      if (bit) biter.push(bit);
      start = i + 1;
    }
  }
  const farge = biter.filter((b) => !POSISJON.test(b));
  return farge.join(' ') || stopp.trim();
}

/* ══════════════════════════════════════════════════════════════════════════
   6. Selve analysen
   ══════════════════════════════════════════════════════════════════════════ */
const FLATEEGENSKAPER = /^(background|background-image|-webkit-background|--)/;
const IKKE_FLATE = {
  'mask-image': 'maske, ikke lysflate',
  '-webkit-mask-image': 'maske, ikke lysflate',
  mask: 'maske, ikke lysflate',
  '-webkit-mask': 'maske, ikke lysflate',
  'border-image': 'kantbilde, ikke lysflate',
  'border-image-source': 'kantbilde, ikke lysflate',
};

function lesKilde(navn, raw) {
  const skjelett = skjelettAv(raw);
  return { navn, raw, skjelett, blokker: parseBlokker(skjelett), linje: linjekart(raw) };
}

/** Rat antall gradienter i kilden — regnskapets fasit (B-regelen). */
const raTelling = (skjelett) =>
  (skjelett.match(/(?:repeating-)?linear-gradient\s*\(/g) ?? []).length;
const raAndreGradienter = (skjelett) =>
  (skjelett.match(/(?:repeating-)?(?:radial|conic)-gradient\s*\(/g) ?? []).length;

/** Finn ALLE gradienter i en kilde, med selektor, egenskap, tema og linje. */
function finnGradienter(kilde) {
  const ut = [];
  kilde.blokker.forEach((b, idx) => {
    // ALLE blokker leses — ogsa @keyframes-steg og @font-face. En gradient
    // inne i en keyframe er like mye en flate som en i en vanlig regel.
    const atRegler = atReglerFor(kilde.blokker, idx);
    const temaer = temaFor(atRegler, b.prelude);
    for (const d of deklarasjoner(kilde.blokker, idx, kilde)) {
      const re = /(?:repeating-)?linear-gradient\s*\(/g;
      let m;
      while ((m = re.exec(d.verdi))) {
        const apn = m.index + m[0].length - 1;
        const { innhold, slutt } = innholdFra(d.verdi, apn);
        ut.push({
          fil: kilde.navn,
          linje: kilde.linje(d.verdiStart + m.index),
          selektor: [...atRegler].reverse().concat(b.prelude).join(' > '),
          egenskap: d.prop,
          gjentakende: m[0].startsWith('repeating'),
          innhold,
          temaer,
          blokk: idx,
        });
        re.lastIndex = slutt;
      }
    }
  });
  return ut;
}

/** Regelens egen bakgrunnsfarge — det halvgjennomsiktige stopp faktisk ligger pa. */
function bakgrunnFor(kilde, blokkIdx, tema, tokens) {
  let kandidat = null;
  for (const d of deklarasjoner(kilde.blokker, blokkIdx, kilde)) {
    if (d.prop === 'background-color') kandidat = d.verdi;
    else if (d.prop === 'background' && !/gradient\s*\(/.test(d.verdi)) {
      const f = losFarge(deleTopp(d.verdi)[0] ?? d.verdi, tema, tokens);
      if (f) kandidat = d.verdi;
    }
  }
  if (kandidat) {
    const f = losFarge(kandidat.trim(), tema, tokens);
    if (f) return { farge: f, kilde: kandidat.trim() };
  }
  const canvas = losFarge('var(--dw-canvas)', tema, tokens);
  return { farge: canvas ?? { r: 0, g: 0, b: 0, a: 1 }, kilde: 'var(--dw-canvas)' };
}

/**
 * Dom en enkelt gradient i ett tema.
 * Returnerer alltid en post — aldri undefined, aldri et stille hopp.
 */
function domGradient(g, tema, tokens, bakgrunn) {
  const deler = deleTopp(g.innhold);
  const retning = tolkRetning(deler[0], tema, tokens);
  if (!retning) {
    return { status: 'blind', tekst: `kan ikke tolke retningen «${deler[0]}»` };
  }
  const stoppRa = (retning.erStopp ? deler : deler.slice(1)).filter((s) => !erBartHint(s));
  if (stoppRa.length < 2) {
    return { status: 'hopp', tekst: `under to fargestopp (${stoppRa.length})` };
  }
  const dy = vertikalKomponent(retning.grader);
  const retningsTekst = retning.eksplisitt
    ? `${Math.round(retning.grader)}deg`
    : `${Math.round(retning.grader)}deg (underforstatt «to bottom»)`;
  if (Math.abs(dy) < HORISONTAL_GRENSE) {
    return { status: 'horisontal', tekst: `${retningsTekst} — horisontal, ingen lysretning` };
  }

  const farger = [];
  for (const s of stoppRa) {
    const uttrykk = fargedelAv(s);
    const f = losFarge(uttrykk, tema, tokens);
    if (!f) return { status: 'blind', tekst: `kan ikke lese fargen «${uttrykk}»` };
    farger.push({ uttrykk, f, lum: lumOver(f, bakgrunn.farge) });
  }
  // dy > 0: forste stopp ligger overst. dy < 0: siste stopp ligger overst.
  const fraTopp = dy > 0 ? farger : [...farger].reverse();
  const overst = fraTopp[0];
  const nederst = fraTopp[fraTopp.length - 1];
  const fall = overst.lum - nederst.lum;
  const gjennomsiktig = farger.some((x) => x.f.a < 1);

  if (Math.abs(fall) < SLOR) {
    return {
      status: 'slor',
      tekst: `${retningsTekst} — endepunktene er like (fall ${fall.toFixed(1)}), dekorativt slor`,
      overst: overst.lum, nederst: nederst.lum, fall, retningsTekst, gjennomsiktig,
    };
  }

  const lysere = fraTopp.slice(1).find((x) => x.lum > overst.lum + 0.5);
  const felles = {
    overst: overst.lum, nederst: nederst.lum, fall, retningsTekst, gjennomsiktig,
    bakgrunn: bakgrunn.kilde,
  };
  if (fall < 0) {
    return { ...felles, status: 'invertert', tekst: `MORKT OVERST (fall ${fall.toFixed(1)})` };
  }
  if (lysere) {
    return {
      ...felles, status: 'invertert',
      tekst: `et stopp lenger ned er lysere enn toppen («${lysere.uttrykk}», ${lysere.lum.toFixed(1)} > ${overst.lum.toFixed(1)})`,
    };
  }
  if (fall < MIN_FALL) {
    return { ...felles, status: 'svak', tekst: `for svakt fall (${fall.toFixed(1)} < ${MIN_FALL})` };
  }
  return { ...felles, status: 'ok', tekst: 'lyst overst' };
}

function analyser(kilder, tokens, { skrivUt = true } = {}) {
  const resultat = { domt: 0, invertert: 0, svak: 0, blind: 0, sett: 0, regnskap: [], linjer: [] };
  const skriv = (s) => { resultat.linjer.push(s); if (skrivUt) console.log(s); };

  for (const kilde of kilder) {
    const gradienter = finnGradienter(kilde);
    const ra = raTelling(kilde.skjelett);
    const andre = raAndreGradienter(kilde.skjelett);
    resultat.regnskap.push({ fil: kilde.navn, ra, sett: gradienter.length, andre });
    resultat.sett += gradienter.length;

    skriv('');
    skriv(kilde.navn);
    if (!gradienter.length) skriv('  (ingen linear-gradient)');

    for (const g of gradienter) {
      const merke = g.gjentakende ? 'repeating-linear-gradient' : 'linear-gradient';
      skriv(`  L${String(g.linje).padEnd(4)} ${g.selektor}`);
      skriv(`         ${g.egenskap}: ${merke}(…)`);
      const ikkeFlate = IKKE_FLATE[g.egenskap];
      if (ikkeFlate) {
        skriv(`         · ${ikkeFlate} — telt, ikke domt`);
        continue;
      }
      if (!FLATEEGENSKAPER.test(g.egenskap)) {
        skriv(`         · «${g.egenskap}» er ikke en flateegenskap — telt, ikke domt`);
        continue;
      }
      for (const tema of g.temaer) {
        const bakgrunn = bakgrunnFor(kilde, g.blokk, tema, tokens);
        const d = domGradient(g, tema, tokens, bakgrunn);
        const merkelapp = { ok: '✓', invertert: '✗', svak: '✗', blind: '‼', horisontal: '·', slor: '·', hopp: '·' }[d.status];
        if (d.status === 'ok' || d.status === 'invertert' || d.status === 'svak') {
          resultat.domt += 1;
          if (d.status === 'invertert') resultat.invertert += 1;
          if (d.status === 'svak') resultat.svak += 1;
          const bak = d.gjennomsiktig ? `  [pa ${d.bakgrunn}]` : '';
          skriv(
            `         ${merkelapp} ${tema.padEnd(5)} ${d.overst.toFixed(1).padStart(6)} → ${d.nederst.toFixed(1).padEnd(6)}` +
            ` fall ${(d.fall >= 0 ? '+' : '') + d.fall.toFixed(1)}   ${d.tekst}${bak}`,
          );
        } else {
          if (d.status === 'blind') resultat.blind += 1;
          skriv(`         ${merkelapp} ${tema.padEnd(5)} ${d.tekst}`);
        }
        // Horisontale/slor-gradienter er tema-uavhengige — én linje holder.
        if (d.status === 'horisontal' || d.status === 'hopp') break;
      }
    }
  }
  return resultat;
}

/* ══════════════════════════════════════════════════════════════════════════
   7. SELVTESTEN — beviser at sjekken faktisk SER alle gradientene
   ══════════════════════════════════════════════════════════════════════════
   Uten denne er «0 funn» ikke verdt noe: proofens forste sjekk sa 0 funn pa
   .vitrine fordi den ikke sa .vitrine. Fiksturen inneholder derfor nettopp
   de formene som knekker naive regexer, og selvtesten krever at ALLE blir
   funnet — og at de tre domsformene (ok / invertert / for svak) faktisk kan
   inntreffe. En sjekk som ikke kan bli rod, er ikke en sjekk. */
const FIKSTUR = `
:root {
  --tok-lys: #E8E2D6;
  --tok-mork: #241A10;
  --tok-nesten: #2B2118;
  --tok-flate: #2C1F13;
  --tok-vinkel: 168deg;
  --dw-canvas: #1E140C;
  --kant: linear-gradient(90deg, transparent, #F2C08A, transparent);
}
:root[data-theme="light"] {
  --tok-lys: #FFFCF4;
  --tok-mork: #E4DBC9;
  --tok-nesten: #F4EFE4;
  --tok-flate: #FFFCF4;
  --dw-canvas: #F9F5EB;
}
/* Var() inne i gradienten — NOYAKTIG .vitrine-feilen som ble hoppet over */
.var-stopp { background: linear-gradient(168deg, var(--tok-lys) 0%, var(--tok-mork) 46%); }
/* color-mix med var() inni: to nivaer parenteser */
.mix-stopp {
  background: linear-gradient(178deg, color-mix(in srgb, var(--tok-lys) 45%, transparent) 0%, var(--tok-flate) 14%);
  background-color: var(--tok-flate);
}
/* Ingen retning i det hele tatt — CSS-standard er «to bottom» */
.uten-retning { background: linear-gradient(#E8E2D6, #241A10); }
/* Nokkelord i stedet for grader */
.nokkelord { background: linear-gradient(to bottom, #E8E2D6, #241A10); }
.hjorne { background: linear-gradient(to bottom right, #E8E2D6, #241A10); }
/* Desimal og negativ vinkel, samt turn-enhet */
.desimal { background: linear-gradient(177.5deg, #E8E2D6, #241A10); }
.turn { background: linear-gradient(0.5turn, #E8E2D6, #241A10); }
/* Retningen ligger i et TOKEN (design-tokens-v2.css har --dw-lys-vinkel) */
.var-retning { background: linear-gradient(var(--tok-vinkel), #E8E2D6, #241A10); }
/* Retning fra et token som ikke finnes: skal rope, ikke anta 180deg */
.blind-retning { background: linear-gradient(var(--finnes-ikke), #E8E2D6, #241A10); }
/* Flerlinjes gradient med to lag i samme deklarasjon */
.to-lag {
  background:
    linear-gradient(180deg,
      #E8E2D6 0%,
      #241A10 100%),
    linear-gradient(180deg, #241A10, #E8E2D6);
}
/* Invertert og for svak — de to feilene eieren faktisk fant */
.invertert { background: linear-gradient(180deg, #241A10, #E8E2D6); }
.for-svak { background: linear-gradient(180deg, #2B2118, #241A10); }
/* Maske og repeating: telles, domres ikke som lysflate */
.maske { mask-image: linear-gradient(to bottom, black 92%, transparent 100%); }
.stripet { background: repeating-linear-gradient(180deg, #E8E2D6 0 4px, #241A10 4px 8px); }
/* Horisontal: ingen lysretning */
.horisontal { background: linear-gradient(90deg, transparent 4%, rgba(242, 192, 138, 0.75) 50%, transparent 96%); }
/* Inne i @media — skal fanges, og bare i lys modus */
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) .kun-lys { background: linear-gradient(180deg, #FFFCF4, #E4DBC9); }
}
/* Kommentert ut: skal IKKE telles av verken fasit eller parser
   .skjult { background: linear-gradient(180deg, #fff, #000); } */
.streng::after { content: 'linear-gradient(180deg, #fff, #000)'; }
`;

function selvtest({ ordrik = false } = {}) {
  const feil = [];
  const krev = (ok, tekst) => { if (!ok) feil.push(tekst); else if (ordrik) console.log(`  ✓ ${tekst}`); };

  const kilde = lesKilde('(fikstur)', FIKSTUR);
  const { tokens } = byggTokens([kilde]);
  const gradienter = finnGradienter(kilde);
  const ra = raTelling(kilde.skjelett);

  // B-regelen: fasit == sett. Ingen stille hopp.
  krev(ra === gradienter.length,
    `regnskapet stemmer: ${ra} linear-gradient i fiksturen, ${gradienter.length} sett av parseren`);

  // Kommentert-ut og streng-innhold skal vare ute av BEGGE tellinger.
  krev(!gradienter.some((g) => g.selektor.includes('skjult')),
    'kommentert-ut gradient telles ikke');
  krev(!gradienter.some((g) => g.egenskap === 'content'),
    'gradient inne i en streng telles ikke');

  const forventet = [
    '.var-stopp', '.mix-stopp', '.uten-retning', '.nokkelord', '.hjorne',
    '.desimal', '.turn', '.var-retning', '.blind-retning', '.to-lag',
    '.invertert', '.for-svak', '.maske', '.stripet', '.horisontal',
    '.kun-lys', ':root',
  ];
  for (const sel of forventet) {
    krev(gradienter.some((g) => g.selektor.includes(sel)), `sjekken ser ${sel}`);
  }
  krev(gradienter.filter((g) => g.selektor.includes('.to-lag')).length === 2,
    'begge lagene i .to-lag telles hver for seg');

  // Beviset for at parenteselling slar den naive regex-familien proofen startet med.
  const naivt = [...kilde.skjelett.matchAll(/linear-gradient\(\s*(\d+)deg\s*,/g)].length;
  krev(naivt < gradienter.length,
    `naiv «(\\d+)deg»-regex ville sett ${naivt} av ${gradienter.length} — parenteselling ser resten`);

  // Domsformene: alle tre skal kunne inntreffe.
  const dom = (sel, tema) => {
    const g = gradienter.find((x) => x.selektor.includes(sel));
    if (!g) return { status: '(ikke funnet)' };
    return domGradient(g, tema, tokens, bakgrunnFor(kilde, g.blokk, tema, tokens));
  };
  krev(dom('.var-stopp', 'dark').status === 'ok', 'var()-gradient med stort fall domres ok');
  krev(dom('.invertert', 'dark').status === 'invertert', 'morkt-overst fanges (eierfunn 1)');
  krev(dom('.for-svak', 'dark').status === 'svak', 'for lite fall fanges (eierfunn 2)');
  krev(dom('.horisontal', 'dark').status === 'horisontal', 'horisontal gradient domres ikke');
  krev(dom('.uten-retning', 'dark').status === 'ok', 'gradient uten retning leses som «to bottom»');
  krev(dom('.nokkelord', 'dark').status === 'ok', '«to bottom» leses som 180deg');
  krev(dom('.hjorne', 'dark').status === 'ok', '«to bottom right» har nedovergaende komponent');
  krev(dom('.desimal', 'dark').status === 'ok', 'desimalvinkel (177.5deg) tolkes');
  krev(dom('.turn', 'dark').status === 'ok', 'turn-enheten tolkes');
  krev(dom('.var-retning', 'dark').status === 'ok', 'retning hentet fra et token slas opp (var(--tok-vinkel) = 168deg)');
  krev(dom('.blind-retning', 'dark').status === 'blind',
    'uleselig retning roper (blind) i stedet for a anta 180deg');

  // color-mix + halvgjennomsiktig stopp skal komponeres, ikke gi «blind».
  const mixMork = dom('.mix-stopp', 'dark');
  const mixLys = dom('.mix-stopp', 'light');
  krev(mixMork.status !== 'blind' && mixLys.status !== 'blind',
    'color-mix(in srgb, var(...) 45%, transparent) leses i begge tema');
  krev(mixLys.overst !== undefined && mixLys.overst > 200,
    `halvgjennomsiktig stopp komponeres mot flaten, ikke mot svart (lys topp = ${mixLys.overst?.toFixed(1)})`);

  // Tema: @media-blokken gjelder kun lys.
  const kunLys = gradienter.find((g) => g.selektor.includes('.kun-lys'));
  krev(kunLys && kunLys.temaer.length === 1 && kunLys.temaer[0] === 'light',
    'regel i prefers-color-scheme:light domres kun i lys modus');
  krev(tokens.light['--tok-lys'] === '#FFFCF4' && tokens.dark['--tok-lys'] === '#E8E2D6',
    ':root[data-theme="light"] overstyrer tokens for lys modus');

  // Ingen ANNEN gradient enn den bevisst uleselige skal ende som «blind».
  const blinde = [];
  for (const g of gradienter) {
    if (IKKE_FLATE[g.egenskap] || !FLATEEGENSKAPER.test(g.egenskap)) continue;
    if (g.selektor.includes('.blind-retning')) continue; // bevisst kontrolltilfelle
    for (const tema of g.temaer) {
      if (domGradient(g, tema, tokens, bakgrunnFor(kilde, g.blokk, tema, tokens)).status === 'blind') {
        blinde.push(`${g.selektor} (${tema})`);
      }
    }
  }
  krev(blinde.length === 0, `ingen fargeuttrykk i fiksturen er uleselige${blinde.length ? ': ' + blinde.join(', ') : ''}`);

  return feil;
}

/* ══════════════════════════════════════════════════════════════════════════
   8. Kjoring
   ══════════════════════════════════════════════════════════════════════════ */
function main() {
  const argv = process.argv.slice(2);
  const kunSelvtest = argv.includes('--selftest') || argv.includes('--selvtest');
  const filer = argv.filter((a) => !a.startsWith('--'));

  console.log('gradient-retning — lyset kommer ovenfra: lysest overst, fall ≥ ' + MIN_FALL + ' luminanstrinn');

  const selvtestFeil = selvtest({ ordrik: kunSelvtest });
  if (selvtestFeil.length) {
    console.log('\nSELVTESTEN RYKER — sjekken kan ikke stoles pa:');
    for (const f of selvtestFeil) console.log(`  ✗ ${f}`);
    console.log('\nEn sjekk som ikke ser alle gradientene, sier «rent» om dem den ikke ser.');
    return 2;
  }
  console.log('selvtest: OK (parseren ser alle formene i fiksturen, og kan bli rod)');
  if (kunSelvtest) return 0;

  const stier = (filer.length ? filer : STANDARDFILER).map((f) => (isAbsolute(f) ? f : resolve(ROT, f)));
  const kilder = stier.map((s) => lesKilde(relative(ROT, s).replace(/\\/g, '/'), readFileSync(s, 'utf8')));

  const tokenSti = resolve(ROT, TOKENFIL);
  const tokenKilde = kilder.find((k) => resolve(ROT, k.navn) === tokenSti)
    ?? lesKilde(TOKENFIL, readFileSync(tokenSti, 'utf8'));
  const { tokens, lysBlokker } = byggTokens([tokenKilde]);
  console.log(`tokenkilde: ${TOKENFIL} — ${Object.keys(tokens.dark).length} mork, ${Object.keys(tokens.light).length} lys`);

  const dublettAvvik = sjekkLysDublett(lysBlokker);
  const res = analyser(kilder, tokens);

  console.log('');
  console.log('─'.repeat(78));
  for (const r of res.regnskap) {
    const ok = r.ra === r.sett;
    console.log(
      `regnskap  ${r.fil}: ${r.ra} i kilden, ${r.sett} sett ${ok ? '✓' : '✗ AVVIK — sjekken er blind for ' + (r.ra - r.sett)}` +
      (r.andre ? `  (+${r.andre} radial/conic — utenfor denne regelen)` : ''),
    );
  }
  console.log(
    `${res.domt} domte lysflate-tilfeller · ${res.invertert} invertert · ${res.svak} for svake` +
    (res.blind ? ` · ${res.blind} uleselige` : ''),
  );

  if (dublettAvvik.length) {
    console.log('\nLYS MODUS ER DEFINERT TO STEDER MED ULIKE VERDIER — sjekken maler feil tema:');
    for (const a of dublettAvvik) console.log(`  ✗ ${a}`);
  }

  const regnskapAvvik = res.regnskap.filter((r) => r.ra !== r.sett);
  if (regnskapAvvik.length || res.blind || dublettAvvik.length) return 2;
  return res.invertert + res.svak ? 1 : 0;
}

/* Kjor kun som CLI. Eksporten under lar en test (eller en kryssjekk mot
   b1-proofen) bruke de samme funksjonene uten a duplisere dem. */
const kjortDirekte = process.argv[1]
  && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (kjortDirekte) process.exit(main());

export {
  MIN_FALL, SLOR, HORISONTAL_GRENSE,
  lesKilde, byggTokens, finnGradienter, bakgrunnFor, domGradient,
  losFarge, lumRGB, lumOver, tolkRetning, vertikalKomponent,
  raTelling, analyser, selvtest, main,
};
