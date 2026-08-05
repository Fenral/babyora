/**
 * OPACITY-DETEKTOREN — finner HVILENDE demping, ikke toninger.
 *
 * ═══ HVA DEN LETER ETTER, OG HVORFOR SKILLET ER HELE POENGET ══════════════
 * `opacity` er helt legitim i bevegelse: et element toner inn fra 0 til 1 og
 * ENDER på 1. Feilklassen er en annen — en verdi mellom 0 og 1 som blir
 * STÅENDE som en tilstand.
 *
 * MÅLT 2026-08-05 i Juster: `opacity: 0.55` på hele resultatflaten når svaret
 * var utdatert. Den tok ink-mid fra 10,1:1 til 3,89:1, ink-low fra 6,5:1 til
 * 2,85:1, og i lys modus falt selv ink-hi fra 15,0:1 til 3,66:1. Fem av seks
 * tekstnivåer under kravet — og signalet var samtidig usynlig for skjermleser,
 * fordi alpha ikke sier noe til noen.
 *
 * Petrol-panelet har hatt forbudet siden tokenfilen ble skrevet
 * (design-tokens-v2.css:30). Espresso-siden hadde det ikke. Det er
 * asymmetrien Impeccable fant (A1), og denne detektoren er den målbare
 * halvdelen av rettingen.
 *
 * ═══ HVA SOM IKKE ER ET FUNN ══════════════════════════════════════════════
 *  · `opacity: 1` — ingen demping.
 *  · Alt inne i `@keyframes` — det er en bane, ikke en hviletilstand.
 *  · `from`/`to`/`0%`/`100%`-steg.
 *  · Startverdier i Framer Motion (`initial`) — de er en banes begynnelse.
 *
 * Alt annet er en HVILENDE demping og må stå i registeret med en grunn.
 *
 * Kjør: node tools/opacity-detektor.mjs [--json]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROT = process.cwd();
const SRC = join(ROT, 'src');

function filer(dir) {
  const ut = [];
  for (const navn of readdirSync(dir)) {
    const sti = join(dir, navn);
    if (statSync(sti).isDirectory()) {
      if (navn === '__tests__' || navn === 'node_modules') continue;
      ut.push(...filer(sti));
    } else if (/\.(tsx?|css)$/u.test(navn)) {
      ut.push(sti);
    }
  }
  return ut;
}

/** Blank ut i stedet for å slette, så linjenumre i funn er sanne. */
const blank = (t) => t.replace(/[^\n]/gu, ' ');
const utenKommentar = (k) =>
  k.replace(/\/\*[\s\S]*?\*\//gu, blank).replace(/(?<!:)\/\/[^\n]*/gu, blank);

/** [start, slutt] for hver @keyframes-blokk — en bane, ikke en hviletilstand. */
function keyframeomraader(css) {
  const ut = [];
  for (const m of css.matchAll(/@keyframes[^{]*\{/gu)) {
    let dybde = 0;
    for (let i = m.index + m[0].length - 1; i < css.length; i += 1) {
      if (css[i] === '{') dybde += 1;
      else if (css[i] === '}') {
        dybde -= 1;
        if (dybde === 0) {
          ut.push([m.index, i]);
          break;
        }
      }
    }
  }
  return ut;
}

const linjeAv = (t, pos) => t.slice(0, pos).split('\n').length;

/** Er treffet inne i en `initial={{ … }}`-prop? Da er det en banes start. */
function erInitial(kode, pos) {
  const foran = kode.slice(Math.max(0, pos - 240), pos);
  return /\binitial\s*=\s*\{\{[^}]*$/u.test(foran) || /\bfrom\s*:\s*\{[^}]*$/u.test(foran);
}

const funn = [];
for (const fil of filer(SRC)) {
  const raa = readFileSync(fil, 'utf8');
  const kode = utenKommentar(raa);
  const rel = relative(ROT, fil).replace(/\\/gu, '/');
  const baner = keyframeomraader(kode);
  const iBane = (p) => baner.some(([a, b]) => p >= a && p <= b);

  /* HELE VERDIEN LESES, ikke bare et tall rett etter kolon.
     MÅLT 2026-08-05, av portens egen mutasjonsprøve: første utgave krevde et
     tall umiddelbart etter `opacity:`, og var derfor blind for
     `opacity: demoted ? 0.55 : 1` — NØYAKTIG formen den opprinnelige feilen
     i Juster hadde. Detektoren ville ha meldt «rent» mens bruddet sto i
     koden. En detektor som ikke ser feilen den ble laget for, er verre enn
     ingen: den høres ut som en godkjenning.
     Nå plukkes ALLE tall i verdien, og et hvilket som helst tall strengt
     mellom 0 og 1 er et funn. `opacity: reduceMotion ? 0 : 1` går fritt —
     der finnes ingen demping, bare av og på. */
  for (const m of kode.matchAll(/\bopacity\s*:\s*([^;\n}]+)/gu)) {
    const rå = m[1].trim();
    /* EN ARRAY ER EN BANE, ikke en hviletilstand. `opacity: [1, 0.96, 0]` er
       Framer Motions måte å skrive en tidslinje på — samme kategori som
       @keyframes, og like lite en dempet tilstand. */
    if (rå.startsWith('[')) continue;

    const tall = [...rå.matchAll(/(?<![\w.])(\d*\.\d+|\d+)/gu)]
      .map((t) => Number.parseFloat(t[1]))
      .filter((v) => Number.isFinite(v) && v > 0 && v < 1);
    if (tall.length === 0) continue;   // ingen demping (eller var(), som ikke kan leses her)
    if (iBane(m.index)) continue;      // @keyframes
    if (erInitial(kode, m.index)) continue;

    const linje = linjeAv(kode, m.index);
    const tekst = raa.split('\n')[linje - 1]?.trim() ?? '';
    /* FØRSTE brøk, ikke den minste. `0.55 + ((i * 0.13) % 0.3)` hviler på
       0,55–0,85; rapporterer man minsteverdien blir tallet 0,13 — et tall
       flaten aldri har. Et register bygget på det ville navngitt en demping
       som ikke finnes. */
    funn.push({ fil: rel, linje, verdi: tall[0], tekst: tekst.slice(0, 110) });
  }
}

funn.sort((a, b) => (a.fil === b.fil ? a.linje - b.linje : a.fil.localeCompare(b.fil)));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(funn, null, 2));
} else {
  console.log(`HVILENDE OPACITY-DEMPING I src/ — ${funn.length} funn\n`);
  let sisteFil = '';
  for (const f of funn) {
    if (f.fil !== sisteFil) {
      console.log(`\n${f.fil}`);
      sisteFil = f.fil;
    }
    console.log(`  ${String(f.linje).padStart(5)}  ${String(f.verdi).padEnd(6)} ${f.tekst}`);
  }
  console.log(`\n${funn.length} hvilende dempinger. @keyframes og initial-verdier er utelatt.`);
}
