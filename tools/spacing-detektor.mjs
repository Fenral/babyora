/**
 * spacing-detektor.mjs — hva appen FAKTISK bruker av avstander.
 *
 * BAKGRUNN (2026-08-04). Fase 2B skulle utlede en `--dw-space-*`-skala av
 * kodens egne tall i stedet for å hente et 8-punktsrutenett fra en lærebok.
 * Første måling ble gjort som en engangsjobb, og et dommerpanel klarte ikke
 * å reprodusere den: 72 kombinasjoner av filskop, egenskapsklasse og
 * telleform ga aldri samtidig totalen OG fordelingen. Årsaken ble funnet av
 * en annen dommer: **618 unitless spacing-verdier** i React-inline-stiler
 * (`padding: 12` → 12px) er usynlige for en px-detektor. Korpuset var altså
 * omtrent dobbelt så stort som målt, og modusen snur når de telles med.
 *
 * En måling ingen kan reprodusere er ikke en måling. Derfor er detektoren nå
 * en FIL i repoet med eksplisitt erklært skop, ikke et tall i en rapport.
 *
 * TRE KLASSER, holdt fra hverandre med vilje. Forrige runde blandet dem, og
 * dekningstallet ble 84,53 % — men telleren inneholdt 44px («touch-target»)
 * som har NULL forekomster i en avstandsegenskap. Alle 19 er height/width.
 * Å telle en høyde som en avstand kjøper dekning man ikke har.
 *
 *   AVSTAND  margin/padding/gap/inset/top/right/bottom/left
 *   STORRELSE width/height med min- og max-varianter (egen skala, egen dekning)
 *   KANT     border-width/outline-width/outline-offset
 *
 * `border-radius` er utelatt: allerede tokenisert (--dw-r-*).
 *
 * FIRE KILDER, fordi appen har fire måter å skrive en avstand på:
 *   1. .css-filer
 *   2. <style>-blokker i .tsx (template literals)
 *   3. inline style-objekter med streng: style={{ padding: '12px' }}
 *   4. inline style-objekter UTEN enhet: style={{ padding: 12 }}   ← de 618
 *
 * Kjør:  node tools/spacing-detektor.mjs            (sammendrag)
 *        node tools/spacing-detektor.mjs --full     (hver forekomst)
 *        node tools/spacing-detektor.mjs --json     (skriver artefakt)
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROT = process.cwd();
const SRC = join(ROT, 'src');

/** Motorkatalogene leses aldri. De eier sin egen verden. */
const MOTOR = new Set([
  'wool-layers', 'clothing-engine-v2', 'met-no', 'planning', 'outfit', 'recommendation',
]);

const KLASSER = {
  avstand: /^(margin|padding)(-(top|right|bottom|left|block|inline|block-start|block-end|inline-start|inline-end))?$|^(row-|column-)?gap$|^inset(-(block|inline))?$|^(top|right|bottom|left)$/u,
  storrelse: /^(min-|max-)?(width|height)$/u,
  kant: /^(border(-(top|right|bottom|left))?-width|outline-width|outline-offset)$/u,
};

/** camelCase fra JSX → kebab-case, så begge kilder klassifiseres likt. */
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/gu, '$1-$2').toLowerCase();

function klassenTil(egenskap) {
  for (const [navn, re] of Object.entries(KLASSER)) if (re.test(egenskap)) return navn;
  return null;
}

function filer(dir, ut = []) {
  for (const navn of readdirSync(dir)) {
    const sti = join(dir, navn);
    if (statSync(sti).isDirectory()) {
      if (MOTOR.has(navn) || navn === '__tests__' || navn === 'node_modules') continue;
      filer(sti, ut);
    } else if (navn.endsWith('.css') || navn.endsWith('.tsx')) {
      ut.push(sti);
    }
  }
  return ut;
}

const funn = [];
const hoppet = { null: 0, relativ: 0, variabel: 0, safeArea: 0, calcIndre: 0 };

/**
 * Én verdi-streng ("20px 22px 14px") → tallene i den.
 *
 * calc() og var() håndteres EKSPLISITT i stedet for å bli en skjønnsvurdering
 * begravd i en regex — det var nettopp den slags uerklærte valg som gjorde
 * forrige måling umulig å reprodusere. env(safe-area-*) markeres separat,
 * fordi safe-area står på unntakslisten og aldri skal tokeniseres.
 */
function tallI(verdi, kilde) {
  const ut = [];
  const harSafeArea = /env\(\s*safe-area/u.test(verdi);
  const harCalc = /\bcalc\(/u.test(verdi);
  const harVar = /\bvar\(\s*--/u.test(verdi);

  if (harSafeArea) { hoppet.safeArea += 1; return ut; }

  /* MIGRERTE AVSTANDER TELLES MED (2026-08-05).
     Etter fase 3 ble 502 av 750 rå avstander byttet mot `var(--dw-space-N)`.
     Da kollapset dekningstallet fra 89 % til 70 % — ikke fordi noe ble
     verre, men fordi de EKSAKTE treffene forsvant ut av nevneren og bare
     restene ble igjen. Målet endret betydning uten at tallet sa fra.

     Et skalatrinn brukt gjennom sitt navn er fortsatt en avstand på
     skalaen. Vi leser N ut av tokenet og teller den som et treff, med
     `fraToken` satt, så drift-tellingen kan holde de to fra hverandre. */
  const tokenTreff = [...verdi.matchAll(/var\(\s*--dw-space-(\d+)\s*\)/gu)];
  if (tokenTreff.length > 0) {
    for (const t of tokenTreff) ut.push({ px: Number(t[1]), iCalc: harCalc, fraToken: true });
    return ut;
  }

  if (harVar && !harCalc) { hoppet.variabel += 1; return ut; }

  for (const m of verdi.matchAll(/(-?\d*\.?\d+)(px|rem|em|%|vh|vw|dvh|ch)?(?![\w.])/gu)) {
    const tall = Number(m[1]);
    const enhet = m[2];
    if (!Number.isFinite(tall)) continue;
    if (tall === 0) { hoppet.null += 1; continue; }
    if (enhet && enhet !== 'px') { hoppet.relativ += 1; continue; }
    // Unitless er BARE en px-verdi i JSX. I CSS er «padding: 12» ugyldig.
    if (!enhet && kilde !== 'jsx-unitless') continue;
    if (harCalc) hoppet.calcIndre += 1;
    ut.push({ px: tall, iCalc: harCalc });
  }
  return ut;
}

function linjeAv(tekst, indeks) {
  let n = 1;
  for (let i = 0; i < indeks && i < tekst.length; i += 1) if (tekst[i] === '\n') n += 1;
  return n;
}

/** Kilde 1 + 2: ekte CSS-deklarasjoner. Kommentarer strippes først. */
function lesCss(tekst, fil, kilde) {
  const rein = tekst.replace(/\/\*[\s\S]*?\*\//gu, (m) => m.replace(/[^\n]/gu, ' '));
  for (const m of rein.matchAll(/(^|[;{\s])([a-z-]+)\s*:\s*([^;{}]+)/gu)) {
    const egenskap = m[2];
    const klasse = klassenTil(egenskap);
    if (!klasse) continue;
    for (const t of tallI(m[3].trim(), kilde)) {
      funn.push({ ...t, egenskap, klasse, kilde, fil, linje: linjeAv(rein, m.index) });
    }
  }
}

/**
 * Kilde 3 + 4: inline style-objekter i JSX.
 *
 * Nøkkelen er at `padding: 12` — uten enhet — er en gyldig og VANLIG
 * React-avstand. Det var disse 618 en px-detektor ikke så, og de er nok til
 * å snu histogrammets modus. Vi leter derfor etter camelCase-nøkler med et
 * bart tall ELLER en px-streng.
 */
function lesJsx(tekst, fil) {
  const rein = tekst.replace(/\/\*[\s\S]*?\*\//gu, (m) => m.replace(/[^\n]/gu, ' '));
  for (const m of rein.matchAll(/([a-zA-Z][a-zA-Z0-9]*)\s*:\s*(-?\d*\.?\d+)\s*(?=[,}\n])/gu)) {
    const egenskap = kebab(m[1]);
    const klasse = klassenTil(egenskap);
    if (!klasse) continue;
    for (const t of tallI(m[2], 'jsx-unitless')) {
      funn.push({ ...t, egenskap, klasse, kilde: 'jsx-unitless', fil, linje: linjeAv(rein, m.index) });
    }
  }
  for (const m of rein.matchAll(/([a-zA-Z][a-zA-Z0-9]*)\s*:\s*(['"`])([^'"`]*?)\2/gu)) {
    const egenskap = kebab(m[1]);
    const klasse = klassenTil(egenskap);
    if (!klasse) continue;
    for (const t of tallI(m[3], 'jsx-streng')) {
      funn.push({ ...t, egenskap, klasse, kilde: 'jsx-streng', fil, linje: linjeAv(rein, m.index) });
    }
  }
}

const alleFiler = filer(SRC);
for (const sti of alleFiler) {
  const tekst = readFileSync(sti, 'utf8');
  const fil = relative(ROT, sti).replace(/\\/gu, '/');
  if (sti.endsWith('.css')) {
    lesCss(tekst, fil, 'css');
  } else {
    // <style>-blokker og styled-template-literals leses som CSS.
    for (const blokk of tekst.matchAll(/<style[^>]*>\{?`([\s\S]*?)`\}?<\/style>/gu)) {
      lesCss(blokk[1], fil, 'tsx-style');
    }
    lesJsx(tekst, fil);
  }
}

/* ── IKKE-VAKUOSITET ──────────────────────────────────────────────────────
   Detektoren skal ikke kunne rapportere «ingenting å se her». Referanse-
   skjermen er den mest gjennomarbeidede flaten i appen; finner vi ikke
   avstander DER, måler vi feil sted og skal si fra høylytt i stedet for å
   levere et pent, tomt tall. */
const fraReferansen = funn.filter((f) => f.fil.includes('hjem-monter.css')).length;
const fraJsxUtenEnhet = funn.filter((f) => f.kilde === 'jsx-unitless').length;
if (alleFiler.length < 40 || fraReferansen < 20) {
  console.error(`\n  FORUTSETNING FEILET: ${alleFiler.length} filer, ${fraReferansen} funn i referanseskjermen.`);
  console.error('  Detektoren måler feil sted — resultatet skal ikke brukes.\n');
  process.exit(2);
}

const perKlasse = {};
for (const f of funn) {
  const k = (perKlasse[f.klasse] ??= { total: 0, verdier: new Map(), egenskaper: new Map() });
  k.total += 1;
  k.verdier.set(f.px, (k.verdier.get(f.px) ?? 0) + 1);
  k.egenskaper.set(f.egenskap, (k.egenskaper.get(f.egenskap) ?? 0) + 1);
}

/* Kjørt direkte = rapport. Importert av en port = bare data, ingen støy. */
const direkte = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (direkte) {
  console.log('\n── spacing-detektor ──');
  console.log(`  ${alleFiler.length} filer skannet · ${funn.length} verdier · `
    + `${fraJsxUtenEnhet} av dem unitless JSX (usynlige for en px-detektor)`);
  console.log(`  hoppet over: ${hoppet.null} nuller · ${hoppet.relativ} relative enheter · `
    + `${hoppet.variabel} var() · ${hoppet.safeArea} safe-area · ${hoppet.calcIndre} inne i calc()`);

  for (const [klasse, k] of Object.entries(perKlasse)) {
    const sortert = [...k.verdier.entries()].sort((a, b) => b[1] - a[1]);
    console.log(`\n  ${klasse.toUpperCase()} — ${k.total} verdier, ${sortert.length} distinkte`);
    console.log(`    ${sortert.slice(0, 22).map(([px, n]) => `${px}px×${n}`).join('  ')}`);
    const topp = sortert.slice(0, 22).reduce((s, [, n]) => s + n, 0);
    console.log(`    de 22 vanligste dekker ${topp}/${k.total} = ${((topp / k.total) * 100).toFixed(1)} %`);
  }

  if (process.argv.includes('--full')) {
    for (const f of [...funn].sort((a, b) => a.px - b.px)) {
      console.log(`  ${String(f.px).padStart(6)}px  ${f.klasse.padEnd(9)} ${f.egenskap.padEnd(16)} ${f.fil}:${f.linje}`);
    }
  }
}

if (direkte && process.argv.includes('--json')) {
  const sti = 'docs/design-notes/spacing-histogram.json';
  writeFileSync(sti, `${JSON.stringify({
    filer: alleFiler.length,
    verdier: funn.length,
    hoppet,
    klasser: Object.fromEntries(Object.entries(perKlasse).map(([k, v]) => [k, {
      total: v.total,
      verdier: Object.fromEntries([...v.verdier.entries()].sort((a, b) => b[1] - a[1])),
      egenskaper: Object.fromEntries([...v.egenskaper.entries()].sort((a, b) => b[1] - a[1])),
    }])),
    funn,
  }, null, 2)}\n`);
  console.log(`\n  skrev ${sti}`);
}

export { funn, perKlasse };
