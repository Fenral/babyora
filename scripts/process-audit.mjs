import fs from 'node:fs';
import path from 'node:path';

const OUT = process.argv[2];
const DEST = 'C:\\Users\\SkotvoldSivertSende\\wool-app\\tools\\garment-audit';

const raw = fs.readFileSync(OUT, 'utf8');
let data;
try {
  data = JSON.parse(raw);
} catch {
  const s = raw.indexOf('{');
  const e = raw.lastIndexOf('}');
  data = JSON.parse(raw.slice(s, e + 1));
}
const findings = Array.isArray(data)
  ? data
  : data.findings ?? data.result?.findings ?? data.result?.result?.findings;
if (!Array.isArray(findings)) {
  console.error('Fant ikke findings-array. Toppnøkler:', Object.keys(data), 'result-nøkler:', data.result && Object.keys(data.result));
  process.exit(1);
}

fs.mkdirSync(path.join(DEST, 'plagg'), { recursive: true });

const rows = [['id', 'kategori', 'struktur', 'utseende', 'seleksjon', 'tekstLogikk', 'alternativer', 'total_claude', 'total_fable']];
const sev = { kritisk: [], hoy: [], medium: [], lav: [] };
const log = [];

for (const f of findings) {
  fs.writeFileSync(
    path.join(DEST, 'plagg', `${f.id}.json`),
    JSON.stringify({ claude: f, fable: null }, null, 2),
  );
  rows.push([
    f.id, f.kategori,
    f.struktur?.score ?? '', f.utseende?.score ?? '', f.seleksjon?.score ?? '',
    f.tekstLogikk?.score ?? '', f.alternativer?.score ?? '', f.total ?? '', '',
  ]);
  for (const funn of f.funn ?? []) {
    if (sev[funn.severity]) sev[funn.severity].push({ id: f.id, mal: funn.mal, beskrivelse: funn.beskrivelse, forslag: funn.forslag, kilde: funn.kilde ?? '' });
  }
  log.push({ id: f.id, total: f.total, funn: (f.funn ?? []).length });
}

fs.writeFileSync(path.join(DEST, 'scorecard.csv'), rows.map((r) => r.join(',')).join('\n'));
fs.writeFileSync(path.join(DEST, 'log.jsonl'), log.map((l) => JSON.stringify(l)).join('\n'));

const avg = (k) => (findings.reduce((a, f) => a + (f[k]?.score ?? 0), 0) / findings.length).toFixed(1);
const summary = {
  plagg: findings.length,
  snittTotal: (findings.reduce((a, f) => a + (f.total ?? 0), 0) / findings.length).toFixed(1),
  snittPerMaal: { struktur: avg('struktur'), utseende: avg('utseende'), seleksjon: avg('seleksjon'), tekstLogikk: avg('tekstLogikk'), alternativer: avg('alternativer') },
  funnCounts: { kritisk: sev.kritisk.length, hoy: sev.hoy.length, medium: sev.medium.length, lav: sev.lav.length },
  lavesteTotal: [...findings].sort((a, b) => (a.total ?? 0) - (b.total ?? 0)).slice(0, 12).map((f) => ({ id: f.id, total: f.total })),
};
fs.writeFileSync(path.join(DEST, '_summary.json'), JSON.stringify({ summary, kritisk: sev.kritisk, hoy: sev.hoy }, null, 2));

console.log(JSON.stringify(summary, null, 2));
