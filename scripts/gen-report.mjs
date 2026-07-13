import fs from 'node:fs';
import path from 'node:path';

const DEST = 'C:\\Users\\SkotvoldSivertSende\\wool-app\\tools\\garment-audit';
const PLAGG = path.join(DEST, 'plagg');

const files = fs.readdirSync(PLAGG).filter((f) => f.endsWith('.json'));
const items = files.map((f) => JSON.parse(fs.readFileSync(path.join(PLAGG, f), 'utf8')));

const SEV_ORDER = { kritisk: 0, hoy: 1, medium: 2, lav: 3 };
const MAL_NAVN = { 1: 'Struktur', 2: 'Utseende', 3: 'Seleksjon vs kilder', 4: 'Tekst↔logikk', 5: 'Alternativer' };

const all = [];
for (const it of items) {
  const c = it.claude;
  for (const funn of c.funn ?? []) all.push({ id: c.id, kategori: c.kategori, total: c.total, ...funn });
}
all.sort((a, b) => (SEV_ORDER[a.severity] - SEV_ORDER[b.severity]) || (a.mal - b.mal) || a.id.localeCompare(b.id));

const bySev = (s) => all.filter((f) => f.severity === s);
const avg = (k) => (items.reduce((a, it) => a + (it.claude[k]?.score ?? 0), 0) / items.length).toFixed(1);
const fableDone = items.filter((it) => it.fable).length;

// Claude visuell-korreksjoner (mål 2)
let visual = null;
try { visual = JSON.parse(fs.readFileSync(path.join(DEST, 'claude-visual.json'), 'utf8')); } catch { /* valgfri */ }

const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

let md = '';
md += '# Klemeg — Plagg-audit-rapport (Stadium A: Claude-perspektiv)\n\n';
md += `Generert fra ${items.length} per-plagg-analyser. Hvert plagg vurdert mot 5 mål (struktur, utseende, seleksjon vs kilder, tekst↔logikk, alternativer).\n`;
md += `**Stadium B (Fable 5-dommer): ${fableDone}/${items.length} fullført.**\n\n`;
md += '> Ingen kode er endret. Dette er en ren rapport. Medisinske terskel-avvik er **forslag** — endres aldri uten godkjenning + helsesøster-validering.\n\n';

md += '## Sammendrag\n\n';
md += `- **Snitt total:** ${(items.reduce((a, it) => a + (it.claude.total ?? 0), 0) / items.length).toFixed(1)} / 100\n`;
md += `- **Snitt per mål:** Struktur ${avg('struktur')}/20 · Utseende ${avg('utseende')}/20 · Seleksjon ${avg('seleksjon')}/25 · Tekst↔logikk ${avg('tekstLogikk')}/25 · Alternativer ${avg('alternativer')}/10\n`;
md += `- **Funn:** ${bySev('kritisk').length} kritiske · ${bySev('hoy').length} høy · ${bySev('medium').length} medium · ${bySev('lav').length} lav\n\n`;

// Tema-klynger
const driftHoy = bySev('hoy').filter((f) => f.mal === 4).length;
const pngHoy = bySev('hoy').filter((f) => f.mal === 2).length;
const safetyHoy = bySev('hoy').filter((f) => f.mal === 3).length;
md += '### Hovedtemaer (høy alvorlighet)\n\n';
md += `1. **Tekst↔logikk-drift (${driftHoy} plagg):** \`when\`/\`whyForGarment\`-tekst beskriver andre temperatur-bånd enn motoren faktisk velger plagget i. Kan villede påkledning.\n`;
md += `2. **Sikkerhets-/seleksjons-flagg (${safetyHoy}):** plagg som omgår eller motsier sikkerhetslaget (HB-8 varmefelle, SIDS/saueskinn, TOG-underisolering).\n`;
md += `3. **Manglende illustrasjoner (${pngHoy}):** PNG-fil mangler → brutt bilde i UI.\n\n`;

// Fable 5 — 2. perspektiv
const fableItems = items.filter((it) => it.fable);
if (fableItems.length) {
  md += `## Fable 5 — 2. perspektiv (${fableItems.length} plagg)\n\n`;
  md += 'Uavhengig dom på claude.ai (Fable 5-modellen), instruert til å UTFORDRE Claudes funn. Der Fable og Claude er uenige er begge tall vist.\n\n';
  md += '| Plagg | Claude | Fable | Fable-verdikt / uenighet |\n|---|---|---|---|\n';
  for (const it of fableItems.sort((a, b) => (a.fable.total ?? 0) - (b.fable.total ?? 0))) {
    const uenig = esc(it.fable.uenig_med_claude || it.fable.verdikt || '').slice(0, 240);
    md += `| \`${it.claude.id}\` | ${it.claude.total} | **${it.fable.total}** | ${uenig} |\n`;
  }
  md += '\n';
  // Fable-eskaleringer: funn med severity kritisk/hoy som Fable la til
  const esc2 = [];
  for (const it of fableItems) for (const f of it.fable.funn ?? []) if (f.severity === 'kritisk' || f.severity === 'hoy') esc2.push({ id: it.claude.id, ...f });
  if (esc2.length) {
    md += '### Fable sine kritiske/høy-funn\n\n| Plagg | Sev | Mål | Funn | Forslag |\n|---|---|---|---|---|\n';
    esc2.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
    for (const f of esc2) md += `| \`${f.id}\` | ${f.severity} | ${MAL_NAVN[f.mal] ?? f.mal} | ${esc(f.beskrivelse)} | ${esc(f.forslag)} |\n`;
    md += '\n';
  }
}

// Claude visuell-korreksjon (mål 2)
if (visual) {
  md += '## Visuell korreksjon (Claude, mål 2)\n\n';
  md += 'Illustrasjonene vurdert direkte med vision. **Stadium A bommet på 3 «manglende PNG»-funn — alle filene finnes.**\n\n';
  for (const k of visual.korreksjoner ?? []) md += `- \`${k.id}\`: ~~${esc(k.stadiumAFunn)}~~ → ${esc(k.korreksjon)}\n`;
  md += '\nMindre visuelle merknader:\n';
  for (const m of visual.visuelleMerknader ?? []) md += `- \`${m.id}\`: ${esc(m.merknad)}\n`;
  md += '\n';
}

const renderTable = (rows) => {
  let t = '| Plagg | Mål | Funn | Forslag | Kilde |\n|---|---|---|---|---|\n';
  for (const f of rows) {
    t += `| \`${f.id}\` | ${MAL_NAVN[f.mal] ?? f.mal} | ${esc(f.beskrivelse)} | ${esc(f.forslag)} | ${esc(f.kilde)} |\n`;
  }
  return t + '\n';
};

md += '## Kritiske funn\n\n';
md += bySev('kritisk').length ? renderTable(bySev('kritisk')) : '_Ingen kritiske funn._\n\n';

md += '## Høy-funn\n\n';
md += '### Sikkerhet & seleksjon (prioriter disse)\n\n';
md += renderTable(bySev('hoy').filter((f) => f.mal === 3));
md += '### Manglende illustrasjoner\n\n';
md += renderTable(bySev('hoy').filter((f) => f.mal === 2));
md += '### Tekst↔logikk-drift\n\n';
md += renderTable(bySev('hoy').filter((f) => f.mal === 4 || (f.mal !== 2 && f.mal !== 3)));

md += '## Medium-funn\n\n';
md += renderTable(bySev('medium'));

md += '## Lav-funn\n\n';
md += `${bySev('lav').length} lav-funn (kosmetiske / mindre forbedringer). Full detalj per plagg i \`plagg/<id>.json\`. Fordeling per plagg:\n\n`;
const lavPer = {};
for (const f of bySev('lav')) lavPer[f.id] = (lavPer[f.id] ?? 0) + 1;
md += Object.entries(lavPer).sort((a, b) => b[1] - a[1]).map(([id, n]) => `- \`${id}\`: ${n}`).join('\n') + '\n\n';

// Scorecard per kategori
md += '## Scorecard per kategori\n\n';
const kats = [...new Set(items.map((it) => it.claude.kategori))];
md += '| Kategori | Antall | Snitt total | Svakeste mål |\n|---|---|---|---|\n';
for (const k of kats) {
  const sub = items.filter((it) => it.claude.kategori === k);
  const t = (sub.reduce((a, it) => a + (it.claude.total ?? 0), 0) / sub.length).toFixed(0);
  const maals = ['struktur', 'utseende', 'seleksjon', 'tekstLogikk', 'alternativer'];
  const maxScore = { struktur: 20, utseende: 20, seleksjon: 25, tekstLogikk: 25, alternativer: 10 };
  let worst = null, worstPct = 2;
  for (const m of maals) {
    const pct = (sub.reduce((a, it) => a + (it.claude[m]?.score ?? 0), 0) / sub.length) / maxScore[m];
    if (pct < worstPct) { worstPct = pct; worst = m; }
  }
  md += `| ${k} | ${sub.length} | ${t}/100 | ${worst} (${(worstPct * 100).toFixed(0)}%) |\n`;
}
md += '\n';

md += '## Neste steg\n\n';
md += '1. **Stadium B** — Fable 5 (claude.ai) dømmer hvert plagg på alle 5 mål via Playwright/Edge. Krever innlogget claude.ai-økt.\n';
md += '2. **Fiks-runde** (etter din godkjenning): tekst-justeringer (mål 4), generer manglende PNG-er, utvid alternativer. Sikkerhets-flagg (HB-8/saueskinn/TOG) krever helsesøster-validering før terskel-endring.\n';

fs.writeFileSync(path.join(DEST, 'REPORT.md'), md);
console.log(`REPORT.md skrevet — ${all.length} funn (${bySev('hoy').length} høy, ${bySev('medium').length} medium, ${bySev('lav').length} lav).`);
