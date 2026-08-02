/* Eierregel: lyset kommer ovenfra. Da skal enhver flate vare LYSEST OVERST,
   og fallet ma vare STORT NOK til a leses pa en telefon.

   Eieren har korrigert meg to ganger pa nettopp dette:
     1. «Hvis lyset kommer fra toppen — er det ikke naturlig at det er lysest
        overst i boksen?» (retning var invertert)
     2. «Mener det gikk fra lyst til morkt pa listen» (retningen var riktig,
        men fallet var skrumpet til 4,8 trinn og leste som flatt)
   Derfor sjekker denne bade RETNING og AMPLITUDE.

   Forste versjon av denne sjekken hoppet stilltiende over .vitrine fordi
   regexet ikke taklet var() inne i gradienten — altsa nettopp flaten saken
   gjaldt. Nal teller vi parenteser i stedet for a gjette. */
import { readFileSync } from 'node:fs';

const MIN_FALL = 8; // luminanstrinn (0-255). Under dette leser flaten som flat.

const src = readFileSync(process.argv[2] ?? 'b1-slice.template.html', 'utf8');

const tokensFra = (start) => {
  const slutt = src.indexOf('\n  }', start);
  return Object.fromEntries(
    [...src.slice(start, slutt).matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))/g)].map((m) => [m[1], m[2]]),
  );
};
const rot = tokensFra(src.indexOf(':root {'));
const tokens = { dark: rot, light: { ...rot, ...tokensFra(src.indexOf('[data-mode="light"] {')) } };

const lum = (farge) => {
  const hex = farge.match(/^#([0-9a-fA-F]{6})$/);
  const rgba = farge.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/);
  let r, g, b, a = 1;
  if (hex) { const n = parseInt(hex[1], 16); r = n >> 16; g = (n >> 8) & 255; b = n & 255; }
  else if (rgba) { [r, g, b] = [+rgba[1], +rgba[2], +rgba[3]]; a = rgba[4] === undefined ? 1 : +rgba[4]; }
  else return null;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) * a;
};
const slaOpp = (uttrykk, tema) => {
  const v = uttrykk.match(/var\((--[\w-]+)/);
  if (v) return tokens[tema][v[1]] ?? null;
  const d = uttrykk.match(/#[0-9a-fA-F]{6}|rgba?\([^)]*\)/);
  return d ? d[0] : null;
};
/* CSS: 0deg peker mot toppen, 180deg mot bunnen. Forste fargestopp ligger
   i motsatt ende av retningen. */
const forsteErOverst = (g) => { const n = ((g % 360) + 360) % 360; return n > 90 && n < 270; };

/* Hent hele gradientinnholdet ved a telle parenteser — var() og rgba() inni
   skal ikke avslutte uttrykket. */
function gradienter(tekst) {
  const ut = [];
  const re = /linear-gradient\(\s*(\d+)deg\s*,/g;
  let m;
  while ((m = re.exec(tekst))) {
    let dybde = 1, i = re.lastIndex;
    while (i < tekst.length && dybde > 0) {
      if (tekst[i] === '(') dybde += 1;
      else if (tekst[i] === ')') dybde -= 1;
      i += 1;
    }
    ut.push({ grader: Number(m[1]), innhold: tekst.slice(re.lastIndex, i - 1), pos: m.index });
  }
  return ut;
}

const regler = [...src.matchAll(/([.#][\w-][^\n{]*)\{([^}]*)\}/g)];
let sjekket = 0, feilRetning = 0, forSvak = 0;
console.log(`flate                     tema    overst→nederst    fall   dom`);
console.log('─'.repeat(74));
for (const r of regler) {
  const velger = r[1].trim().slice(0, 24);
  for (const g of gradienter(r[2])) {
    const stopp = g.innhold.split(/,(?![^(]*\))/).map((s) => s.trim()).filter(Boolean);
    if (stopp.length < 2) continue;
    for (const tema of ['dark', 'light']) {
      const a = slaOpp(stopp[0], tema), b = slaOpp(stopp[stopp.length - 1], tema);
      if (!a || !b) continue;
      const la = lum(a), lb = lum(b);
      if (la === null || lb === null) continue;
      const overst = forsteErOverst(g.grader) ? la : lb;
      const nederst = forsteErOverst(g.grader) ? lb : la;
      const fall = overst - nederst;
      if (Math.abs(fall) < 0.5) continue;      // dekorativt slor, ikke en lysflate
      sjekket += 1;
      let dom = 'lyst overst ✓';
      if (fall < 0) { dom = 'MORKT OVERST ✗'; feilRetning += 1; }
      else if (fall < MIN_FALL) { dom = `for svakt (< ${MIN_FALL}) ✗`; forSvak += 1; }
      console.log(`${velger.padEnd(25)} ${tema.padEnd(7)} ${overst.toFixed(1).padStart(6)}→${nederst.toFixed(1).padEnd(7)} ${fall.toFixed(1).padStart(6)}  ${dom}`);
    }
  }
}
console.log('─'.repeat(74));
console.log(`${sjekket} lysflater · ${feilRetning} invertert · ${forSvak} for svake`);
process.exitCode = feilRetning + forSvak ? 1 : 0;
