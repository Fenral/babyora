import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'C:\\Users\\SkotvoldSivertSende\\wool-app';
const DEST = path.join(ROOT, 'tools', 'garment-audit');
const PLAGG = path.join(DEST, 'plagg');
const OUT = path.join(DEST, 'fable-raw', 'prompts');
fs.mkdirSync(OUT, { recursive: true });

// Parse what/when from garment-info.ts
const infoSrc = fs.readFileSync(path.join(ROOT, 'src', 'data', 'garment-info.ts'), 'utf8');
const info = {};
const re = /'([^']+)':\s*\{\s*what:\s*'([\s\S]*?)',\s*when:\s*'([\s\S]*?)',\s*\}/g;
let m;
while ((m = re.exec(infoSrc)) !== null) {
  info[m[1]] = { what: m[2].replace(/\s+/g, ' ').trim(), when: m[3].replace(/\s+/g, ' ').trim() };
}

const flat = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

const files = fs.readdirSync(PLAGG).filter((f) => f.endsWith('.json'));
let n = 0;
for (const file of files) {
  const { claude: c } = JSON.parse(fs.readFileSync(path.join(PLAGG, file), 'utf8'));
  const id = c.id;
  const inf = info[id] ?? { what: '(mangler what i garment-info.ts)', when: '(mangler when)' };
  const trace = flat(c.seleksjon?.trace ?? c.seleksjon?.kommentar ?? 'ukjent');
  const funnTxt = (c.funn ?? [])
    .map((f) => `[${f.severity}/mål${f.mal}] ${flat(f.beskrivelse)}`)
    .join(' ; ') || 'ingen funn registrert';

  const prompt =
    `Du er en uavhengig kvalitets-dommer for Klemeg, en norsk påkledningsapp for barn 0-3 år. ` +
    `Vurder ÉTT plagg mot 5 mål, basert på det vedlagte illustrasjons-bildet OG dataene under. ` +
    `PLAGG: «${c.dbString}» (id ${id}, kategori ${c.kategori}). ` +
    `TEKST I APPEN — Hva: «${flat(inf.what)}» Når: «${flat(inf.when)}». ` +
    `MOTORENS FAKTISKE SELEKSJON (trace fra koden): ${trace}. ` +
    `CLAUDE (1. analyse) ga total ${c.total}/100. Claudes funn — UTFORDRE dem, ikke bare bekreft: ${funnTxt}. ` +
    `DIN OPPGAVE: gi score + konkret kommentar på HVERT mål. ` +
    `1 Struktur (0-20): er forklaringen (hva/når + dynamisk hvorfor) komplett og konsistent med søsken-plagg? ` +
    `2 Utseende (0-20): VURDER DET VEDLAGTE BILDET — viser det riktig plagg? Stil-konsistent? Artefakter? Feil farge/type? ` +
    `3 Seleksjon vs kilder (0-25): er forholdene plagget velges i pediatrisk forsvarlige (overoppheting/SIDS/frost)? ` +
    `4 Tekst↔logikk (0-25): stemmer «når»-teksten med faktisk seleksjon over? Pek på konkret drift (temp-bånd). ` +
    `5 Alternativer (0-10): mangler et reelt alternativ (ull/fleece/syntet/tykkelse)? ` +
    `Rør ALDRI tall/terskler — medisinske avvik er forslag. ` +
    `Svar KUN som ETT JSON-objekt (ingen tekst rundt) med feltene: ` +
    `struktur{score,kommentar}, utseende{score,kommentar}, seleksjon{score,kommentar}, ` +
    `tekstLogikk{score,kommentar}, alternativer{score,kommentar}, total, verdikt, uenig_med_claude, ` +
    `funn (liste med {severity=kritisk|hoy|medium|lav, mal=1-5, beskrivelse, forslag}).`;

  fs.writeFileSync(path.join(OUT, `${id}.txt`), prompt.replace(/\r?\n/g, ' '));
  n++;
}
console.log(`Skrev ${n} prompt-filer til ${OUT}. Parsed ${Object.keys(info).length} info-oppføringer.`);
