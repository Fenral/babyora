import fs from 'node:fs';
import path from 'node:path';

const DEST = 'C:\\Users\\SkotvoldSivertSende\\wool-app\\tools\\garment-audit';
const PLAGG = path.join(DEST, 'plagg');
const RAW = path.join(DEST, 'fable-raw');

// browser_evaluate kan ha lagret rå streng (evt. JSON-encoded). Robust parse:
function loadRaw(file) {
  let s = fs.readFileSync(file, 'utf8').trim();
  // Hvis hele fila er en JSON-streng (med ytre quotes), unwrap én gang
  try {
    const once = JSON.parse(s);
    if (typeof once === 'string') s = once;
    else return once; // allerede objekt
  } catch { /* ikke ytre-encoded */ }
  // Strip ev. ```json fences
  s = s.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  // Klipp til ytterste { ... }
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  if (a >= 0 && b > a) s = s.slice(a, b + 1);
  return JSON.parse(s);
}

const rawFiles = fs.readdirSync(RAW).filter((f) => f.endsWith('.json'));
let merged = 0;
const failed = [];
for (const rf of rawFiles) {
  const id = rf.replace(/\.json$/, '');
  const plaggPath = path.join(PLAGG, `${id}.json`);
  if (!fs.existsSync(plaggPath)) { failed.push(`${id} (ingen plagg-fil)`); continue; }
  let fable;
  try { fable = loadRaw(path.join(RAW, rf)); } catch (e) { failed.push(`${id} (parse: ${e.message})`); continue; }
  const obj = JSON.parse(fs.readFileSync(plaggPath, 'utf8'));
  obj.fable = fable;
  fs.writeFileSync(plaggPath, JSON.stringify(obj, null, 2));
  merged++;
}

const all = fs.readdirSync(PLAGG).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(PLAGG, f), 'utf8')));
const done = all.filter((it) => it.fable);
console.log(`Merget ${merged} Fable-verdikter. Totalt ${done.length}/${all.length} plagg har Fable-dom.`);
if (failed.length) console.log('Feilet:', failed.join(', '));
const pending = all.filter((it) => !it.fable).map((it) => it.claude.id);
if (pending.length) console.log(`Mangler (${pending.length}):`, pending.join(', '));
