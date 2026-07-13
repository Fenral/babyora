/**
 * Generer 2 ekspert-leveranser fra wool-layers engine:
 *   1) public/regelverk.md    — komplett audit-dokument
 *   2) public/fagavstemning.html — visuell standalone-side
 *
 * Kjør: npx tsx scripts/generate-rules-docs.ts
 */

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

import { baseTable, bandForTemp } from '../src/lib/wool-layers/tables.js';
import type { Activity, TempBand } from '../src/lib/wool-layers/types.js';

const __filename = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(__filename));

const BASE_URL = 'https://wool-app.vercel.app';

// ── Data ─────────────────────────────────────────────────────────────────

const ACTIVITIES: Array<{ id: Activity; label: string; desc: string }> = [
  { id: 'vogn', label: 'Vogn', desc: 'Ute, foreldre triller — barnet ligger/sitter rolig.' },
  { id: 'baeresele', label: 'Bæresele', desc: 'Ute, foreldre bærer barnet inntil seg.' },
  { id: 'utelek', label: 'Utelek', desc: 'Aktivt ute, barnet beveger seg.' },
  { id: 'soevn', label: 'Søvn', desc: 'Innendørs — feels-like tolkes som romtemperatur.' },
];

const BANDS: Array<{ id: TempBand; label: string; range: string }> = [
  { id: 'ekstrem_varme', label: 'Ekstrem varme', range: '≥ 28 °C' },
  { id: 'tropisk', label: 'Tropisk', range: '22–27 °C' },
  { id: 'varm', label: 'Varm', range: '16–21 °C' },
  { id: 'mild', label: 'Mild', range: '10–15 °C' },
  { id: 'kjolig', label: 'Kjølig', range: '5–9 °C' },
  { id: 'kald', label: 'Kald', range: '0–4 °C' },
  { id: 'frost', label: 'Frost', range: '−7 til −1 °C' },
  { id: 'streng_frost', label: 'Streng frost', range: '−15 til −8 °C' },
  { id: 'ekstrem', label: 'Ekstrem kulde', range: '< −15 °C' },
];

type Garment = {
  id: string;
  label: string;
  category: string;
  subcategory?: string;
  aliases: string[];
  illustration: string;
  what: string;
  when: string;
};

// Plagg-katalog hardkodes fra eksisterende public/plagg-katalog.json
// (gjenbruker det vi allerede har generert)
import garmentsJson from '../public/plagg-katalog.json' with { type: 'json' };
const GARMENTS: Garment[] = (garmentsJson as { items: Garment[] }).items;

// ── Sources ──────────────────────────────────────────────────────────────

const SOURCE_LABEL: Record<string, string> = {
  'AAP-2022': 'AAP — Safe Sleep Practices (2022)',
  'AAP-HC': 'AAP HealthyChildren',
  'NHS': 'NHS UK — Reduce SIDS',
  'LT-RT': 'Lullaby Trust — Room temperature',
  'LT-TOG': 'Lullaby Trust — TOG-guide',
  'LT-PRAM': 'Lullaby Trust — Don\'t cover the pram',
  'RN-AU': 'Red Nose Australia — Safe sleeping',
  'RN-WRAP': 'Red Nose Australia — Wrapping',
  'CDC-NICHD': 'CDC Safe to Sleep',
  'ASTM-2024': 'ASTM F3633 — weighted sleep ban',
  'NHTSA': 'NHTSA — Car seats',
  'Pediatrics-Pram': 'Pediatrics — pram heat-trap study',
  'IHDI': 'International Hip Dysplasia Institute',
  'POLICY': 'Babyora produktpolicy (begrunnet)',
};

const SOURCE_URL: Record<string, string> = {
  'AAP-2022': 'https://publications.aap.org/pediatrics/article/150/1/e2022057990',
  'AAP-HC': 'https://www.healthychildren.org',
  'NHS': 'https://www.nhs.uk/conditions/baby/caring-for-a-newborn/reduce-the-risk-of-sudden-infant-death-syndrome/',
  'LT-RT': 'https://www.lullabytrust.org.uk/safer-sleep-advice/room-temperature/',
  'LT-TOG': 'https://www.lullabytrust.org.uk/safer-sleep-advice/room-temperature/',
  'LT-PRAM': 'https://www.lullabytrust.org.uk/never-cover-pram',
  'RN-AU': 'https://rednose.org.au/section/safe-sleeping',
  'RN-WRAP': 'https://rednose.org.au/article/wrapping-babies',
  'CDC-NICHD': 'https://safetosleep.nichd.nih.gov',
  'ASTM-2024': 'https://www.cpsc.gov',
  'NHTSA': 'https://www.nhtsa.gov/road-safety/car-seats-and-booster-seats',
  'Pediatrics-Pram': 'https://www.lullabytrust.org.uk/never-cover-pram',
  'IHDI': 'https://hipdysplasia.org',
};

// ── Rule descriptions ────────────────────────────────────────────────────

type Rule = {
  code: string;
  title: string;
  trigger: string;
  effect: string;
  noteText?: string;
  sources: string[];
};

const MODIFIERS: Rule[] = [
  { code: 'M-1', title: 'Lett nedbør → regntrekk', trigger: 'precipMmH ≥ 0.5 mm/t', effect: 'Legger til regntrekk (vogn) / regntøy (utelek) / regnponcho (bæresele)', sources: ['POLICY'] },
  { code: 'M-2', title: 'Kraftig nedbør', trigger: 'precipMmH ≥ 2 mm/t', effect: 'Note: «høljer ned, kort tur eller overbygd»', sources: ['POLICY'] },
  { code: 'M-3', title: 'Lett yr', trigger: 'precipMmH 0.2–0.5 mm/t', effect: 'Note: «lett yr, kalesjen holder»', sources: ['POLICY'] },
  { code: 'M-4', title: 'Vindtett skall (utelek)', trigger: 'windMs ≥ 5 + feels < 10°C + activity=utelek', effect: 'Legger til vindtett skall i yttertøy', sources: ['POLICY'] },
  { code: 'M-5', title: 'Hals ved vind+kulde', trigger: 'windMs ≥ 5 + feels < 5°C', effect: 'Legger til hals (ekstra)', sources: ['POLICY'] },
  { code: 'M-6', title: 'Hals ved sterk vind', trigger: 'windMs ≥ 8', effect: 'Legger til hals uavhengig av temp', sources: ['POLICY'] },
  { code: 'M-7', title: 'Vindvotter', trigger: 'windMs ≥ 8 + feels < 0°C', effect: 'Legger til vindvotter (skall)', sources: ['POLICY'] },
  { code: 'M-8', title: 'Friskt vind-note', trigger: 'windMs ≥ 10 (≥7 for <6 mnd)', effect: 'Note: «det blåser friskt, hold turen kort»', sources: ['POLICY'] },
  { code: 'M-9', title: 'Ullsokker ved kjølig', trigger: 'feels ≤ 5°C', effect: 'Legger til ullsokker (innerst)', sources: ['POLICY'] },
  { code: 'M-10', title: 'Fuktig kulde', trigger: 'humidity ≥ 80% + feels < 10°C', effect: 'Note: «fuktig kulde føles kaldere»', sources: ['POLICY'] },
  { code: 'M-11', title: 'Universell kjenn-på-nakken', trigger: 'Alltid', effect: 'Note: «kjenn på nakken med to fingre»', sources: ['NHS', 'LT-RT'] },
  { code: 'M-12', title: 'Spedbarn termoregulering', trigger: 'ageMonths ≤ 3', effect: 'Note + ekstra ull-lag ved <5°C; «maks 30 min ute ved <0°C»', sources: ['AAP-HC', 'NHS'] },
  { code: 'M-13', title: 'Vogn-tildekkings-warning', trigger: 'activity=vogn alltid', effect: 'Note: «aldri teppe over kalesjen»', sources: ['LT-PRAM', 'Pediatrics-Pram'] },
  { code: 'M-14', title: 'Sol + sol-symbol', trigger: 'symbolCode=sun/clearsky/fair/partlycloudy + feels ≥ 10°C', effect: 'Sol-note (<6 mnd: «skygge», ≥6 mnd: «solhatt + solkrem»)', sources: ['AAP-HC'] },
  { code: 'M-15', title: 'Bilstol-vinterdress', trigger: 'Har vinterdress/vinterkjøredress', effect: 'Note: «ta av tykke dressen i bilstolen»', sources: ['AAP-HC', 'NHTSA'] },
  { code: 'M-16', title: 'Peak overheating 7–9 mnd', trigger: 'ageMonths 7-9 + feels ≥ 22°C', effect: 'Note + drop topmost insulation', sources: ['AAP-HC', 'POLICY'] },
  { code: 'M-17', title: 'Fottøy-alders-justering', trigger: 'activity=utelek/baeresele + alder', effect: '<9 mnd: ingen sko, ullsokker; 9-15 mnd: tøffel-sko; 16+: vintersko', sources: ['POLICY'] },
];

const HARD_BLOCKS: Rule[] = [
  { code: 'HB-1', title: 'Ingen hodeplagg under søvn', trigger: 'activity=soevn AND has(hat)', effect: 'BLOCK + fjern hodeplagg', sources: ['AAP-2022', 'NHS', 'LT-RT'] },
  { code: 'HB-2', title: 'Ingen tepper over sovepose', trigger: 'has(sovepose) AND has(teppe)', effect: 'BLOCK + fjern teppe', sources: ['AAP-2022', 'LT-TOG', 'RN-AU', 'CDC-NICHD'] },
  { code: 'HB-3', title: 'Aldri flere soveposer', trigger: 'count(sovepose) > 1', effect: 'BLOCK + dedupe', sources: ['LT-TOG'] },
  { code: 'HB-4', title: 'Ingen vektede produkter', trigger: 'has(weighted/vektet)', effect: 'BLOCK + fjern', sources: ['AAP-2022', 'ASTM-2024'] },
  { code: 'HB-5', title: 'Ingen myke gjenstander i seng', trigger: 'activity=soevn AND has(pute/kosedyr/bumper)', effect: 'BLOCK + fjern', sources: ['AAP-2022', 'NHS', 'RN-AU', 'CDC-NICHD'] },
  { code: 'HB-6', title: 'Stopp svøping når barnet kan rulle', trigger: 'has(svøp) AND (canRoll=true OR alder ≥ 4 mnd)', effect: 'BLOCK + fjern svøp', sources: ['AAP-2022', 'RN-WRAP'] },
  { code: 'HB-7', title: 'Hofte-trygg svøping', trigger: 'has(svøp)', effect: 'Note: «armer løse, hofter løse, ansikt fritt»', sources: ['RN-WRAP', 'IHDI'] },
  { code: 'HB-8', title: 'Aldri dekk vogn i varme', trigger: 'activity=vogn AND feels ≥ 22°C', effect: 'BLOCK + fjern teppe-over-kalesje', sources: ['LT-PRAM', 'Pediatrics-Pram'] },
  { code: 'HB-9', title: 'Aldri vinterdress i bilstol', trigger: 'context.bilstol=true AND has(vinterdress)', effect: 'BLOCK + fjern vinterdress', sources: ['AAP-HC', 'NHTSA'] },
];

const CONFLICTS: Array<Rule & { type: 'evidence' | 'policy' }> = [
  { code: 'CK-1', title: 'Sovepose × teppe', trigger: 'has(sovepose) AND has(teppe)', effect: 'Fjern teppe', sources: ['LT-TOG', 'AAP-2022'], type: 'evidence' },
  { code: 'CK-2', title: 'To soveposer', trigger: 'count(sovepose) > 1', effect: 'Dedupe (HB-3)', sources: ['LT-TOG'], type: 'evidence' },
  { code: 'CK-3', title: 'TOG > maxForRoom', trigger: 'activity=soevn AND sovepose-TOG > maxTOG(roomC)', effect: 'Bytt til riktig TOG (eller fjern hvis room ≥ 26°C)', sources: ['LT-TOG'], type: 'evidence' },
  { code: 'CK-4', title: 'Sovepose × hodeplagg innendørs', trigger: 'activity=soevn AND has(sovepose) AND has(hodeplagg)', effect: 'Fjern hodeplagg', sources: ['AAP-2022', 'LT-RT'], type: 'evidence' },
  { code: 'CK-5', title: 'Varmepose × dunteppe i vogn', trigger: 'activity=vogn AND has(varmepose) AND has(dunteppe)', effect: 'Behold varmepose, fjern dunteppe (unntak: vognMode=awake AND feels<-5)', sources: ['LT-PRAM', 'POLICY'], type: 'policy' },
  { code: 'CK-6', title: '2-ullsett-grense', trigger: 'feels > -15°C AND has(to ullsett)', effect: 'Bytt til ullsett tykt (kun ekstrem frost gir 2-stack)', sources: ['POLICY'], type: 'policy' },
  { code: 'CK-7', title: 'Vinterdress × bilstol', trigger: 'context.bilstol=true AND has(vinterdress)', effect: 'BLOCK via HB-9', sources: ['AAP-HC', 'NHTSA'], type: 'evidence' },
  { code: 'CK-8', title: 'Høy TOG × pyjamas i mildt rom', trigger: 'activity=soevn AND sovepose-TOG ≥ 2.5 AND roomC > 21°C AND has(pyjamas)', effect: 'Bytt pyjamas til kortermet body', sources: ['LT-TOG'], type: 'evidence' },
  { code: 'CK-9', title: 'Bæresele × innerJakke × barnejakke', trigger: 'activity=baeresele AND innerJakke=true AND has(barnejakke)', effect: 'Fjern barnejakke', sources: ['RN-AU', 'POLICY'], type: 'policy' },
];

const SOFT_BLOCKS: Rule[] = [
  { code: 'SB-1', title: 'TOG vs romtemp (justering)', trigger: 'sovepose-TOG > maxTOGforRoom', effect: 'Dekkes av CK-3', sources: ['LT-TOG'] },
  { code: 'SB-2', title: 'For mange lag', trigger: 'count(layers) > maxLayersForFeels', effect: 'Fjern lavest-impact (dunteppe → varmepose lett → tynt teppe)', sources: ['POLICY'] },
  { code: 'SB-3', title: 'Varmt rom (≥24°C)', trigger: 'activity=soevn AND roomC ≥ 24°C', effect: 'Tving kortermet body + 0.5 TOG. Ved ≥26°C: kun body/bleie', sources: ['LT-TOG', 'NHS'] },
  { code: 'SB-4', title: 'Bæresele + innerJakke', trigger: 'activity=baeresele AND innerJakke=true', effect: 'Fjern yttertøy, swap tykke til tynne mellomlag', sources: ['RN-AU', 'POLICY'] },
  { code: 'SB-5', title: 'Peak overheating 7-9 mnd', trigger: 'ageMonths 7-9 + feels ≥ 22°C', effect: 'Drop topmost insulation', sources: ['AAP-HC', 'POLICY'] },
  { code: 'SB-6', title: 'Lang vognetur', trigger: 'activity=vogn AND feels ≥ 18°C AND exposureMin ≥ 60', effect: 'Fjern varmepose lett + dunteppe + skygge-note', sources: ['LT-PRAM', 'LT-RT'] },
  { code: 'SB-7', title: 'Spedbarn ekstrem hete', trigger: 'feels ≥ 28°C AND ageMonths < 6', effect: 'Note: «maks 15 min uten skygge»', sources: ['AAP-HC'] },
];

// ── Helpers ──────────────────────────────────────────────────────────────

function findBaseTableEntries(garmentId: string): Array<{ activity: Activity; band: TempBand; category: string }> {
  // Reverse-lookup: hvilke (aktivitet, bånd) inneholder dette plagget?
  // Match på alle aliaser
  const garment = GARMENTS.find((g) => g.id === garmentId);
  if (!garment) return [];
  const aliasSet = new Set(garment.aliases.map((a) => a.toLowerCase()));

  const results: Array<{ activity: Activity; band: TempBand; category: string }> = [];
  for (const activity of Object.keys(baseTable) as Activity[]) {
    for (const band of Object.keys(baseTable[activity]) as TempBand[]) {
      const layers = baseTable[activity][band];
      for (const layer of layers) {
        for (const item of layer.items) {
          if (aliasSet.has(item.toLowerCase())) {
            results.push({ activity, band, category: layer.category });
          }
        }
      }
    }
  }
  return results;
}

function findConflictsForGarment(garmentId: string): Array<{ code: string; with: string; reason: string }> {
  const garment = GARMENTS.find((g) => g.id === garmentId);
  if (!garment) return [];

  const conflicts: Array<{ code: string; with: string; reason: string }> = [];
  const labelLower = garment.label.toLowerCase();

  // Manuell mapping basert på conflicts.ts + safety.ts regex-match
  if (garment.id.startsWith('sovepose-')) {
    conflicts.push({ code: 'HB-2 / CK-1', with: 'tepper, pledd, dunteppe', reason: 'Løst sengetøy + sovepose = SIDS-risiko' });
    conflicts.push({ code: 'CK-4', with: 'hodeplagg', reason: 'Hodeplagg innendørs blokkerer varme-avgivelse' });
    conflicts.push({ code: 'HB-3', with: 'andre soveposer', reason: 'Stablet TOG = overoppheting' });
    conflicts.push({ code: 'CK-8', with: 'pyjamas (rom >21°C)', reason: 'For mye varme' });
  }
  if (labelLower.includes('vinterdress') || labelLower.includes('vinterkjøredress')) {
    conflicts.push({ code: 'HB-9 / CK-7', with: 'bilstol-bruk', reason: 'Tykt fôr komprimeres ved kollisjon, sele festes løst' });
  }
  if (labelLower.includes('teppe') || labelLower.includes('dunteppe') || labelLower.includes('pledd')) {
    conflicts.push({ code: 'HB-2 / CK-1', with: 'sovepose', reason: 'Sovepose ER tildekkingen' });
    if (labelLower.includes('over kalesje') || labelLower.includes('dunteppe')) {
      conflicts.push({ code: 'HB-8', with: 'vogn ved feels ≥ 22°C', reason: 'Tildekket vogn = +4-15°C på 60 min' });
    }
  }
  if (labelLower.includes('hodeplagg') || labelLower.includes('lue') || labelLower.includes('hat') || labelLower.includes('balaklava') || labelLower.includes('caps')) {
    conflicts.push({ code: 'HB-1 / CK-4', with: 'søvn innendørs', reason: 'Hodet er hovedvarme-avgivelses-flate' });
  }
  if (garment.id === 'varmepose' || garment.id === 'varmepose-dun' || garment.id === 'varmepose-lett') {
    conflicts.push({ code: 'CK-5', with: 'dunteppe i vogn', reason: 'Stable insulasjon = redusert airflow' });
  }
  if (labelLower.includes('svøp') || labelLower.includes('swaddle')) {
    conflicts.push({ code: 'HB-6', with: 'barn som ruller (>4 mnd)', reason: 'Svøpt + ruller på mage = kveling' });
  }
  if (garment.id === 'to-ullsett') {
    conflicts.push({ code: 'CK-6', with: 'temp > -15°C', reason: '2-stack ull er kun for ekstrem frost' });
  }
  return conflicts;
}

function findAgeReplacements(garmentId: string): string[] {
  const replacements: string[] = [];
  const id = garmentId;
  if (id === 'sko') {
    replacements.push('<9 mnd: fjernes (vinterdress dekker)');
    replacements.push('9-15 mnd: tøffel-sko');
    replacements.push('16+ mnd: sko som-er');
  }
  if (id === 'vintersko' || id === 'vintersko-isolerte') {
    replacements.push('<9 mnd: tykke ullsokker (innerst)');
    replacements.push('9-15 mnd: tøffel-sko + tykke ullsokker');
    replacements.push('16+ mnd: vintersko / vintersko isolerte');
  }
  if (id === 'sandaler') {
    replacements.push('<9 mnd: fjernes');
    replacements.push('9-15 mnd: barfot eller tynne tøfler');
    replacements.push('16+ mnd: sandaler');
  }
  if (id === 'toffel-sko' || id === 'tøffel-sko') {
    replacements.push('Brukes 9-15 mnd som overgang mellom barfot og full sko');
  }
  return replacements;
}

function findTriggers(garmentId: string): string[] {
  const triggers: string[] = [];
  const id = garmentId;
  if (id === 'regntrekk') triggers.push('M-1: precipMmH ≥ 0.5 mm/t (vogn)');
  if (id === 'regntoy-skall') triggers.push('M-1: precipMmH ≥ 0.5 mm/t (utelek)');
  if (id === 'regnponcho-over-baeresele') triggers.push('M-1: precipMmH ≥ 0.5 mm/t (bæresele)');
  if (id === 'vindtett-skall') triggers.push('M-4: windMs ≥ 5 + feels < 10°C + utelek');
  if (id === 'hals') triggers.push('M-5: vind ≥5 + feels <5°C', 'M-6: vind ≥8');
  if (id === 'vindvotter-skall') triggers.push('M-7: vind ≥8 + feels <0°C');
  if (id === 'ullsokker') triggers.push('M-9: feels ≤ 5°C', 'Spedbarn: alltid ved ute-aktivitet');
  if (id === 'ansiktskrem') triggers.push('Frost (≤-5°C) + ute-aktivitet');
  if (id === 'tykke-ullsokker') triggers.push('M-17: <9 mnd + utelek/baeresele + ≤10°C');
  return triggers;
}

// ── Markdown render ──────────────────────────────────────────────────────

function renderMarkdown(): string {
  const date = '2026-06-10';
  const sections: string[] = [];

  sections.push(`# Babyora — Regelverk for fagavstemning

Generert: ${date}
Mål: pediatri-/helsesøster-ekspert kan verifisere at engine-anbefalingene stemmer med klinisk praksis.

## Sjekklist-format

For hver regel/tabell-rad: ✅ Klinisk korrekt   ⚠️ Tvilsom   ❌ Feil
Kommentar-felt for å notere endringsforslag.

---

## Kilde-koder`);

  sections.push(
    Object.entries(SOURCE_LABEL)
      .map(([k, v]) => `- **${k}** = ${v} ${SOURCE_URL[k] ? `([lenke](${SOURCE_URL[k]}))` : ''}`)
      .join('\n'),
  );

  sections.push(`---

## 1. Temperaturbånd

Engine klassifiserer føles-som-temperatur (eller romtemp for søvn) til 9 bånd.

| Bånd | Range |
|---|---|`);
  sections.push(BANDS.map((b) => `| **${b.label}** (\`${b.id}\`) | ${b.range} |`).join('\n'));

  sections.push(`\n---

## 2. Base-tabell per aktivitet × bånd

Hver aktivitet har 9 temp-bånd. Tabell viser plagg per lag-kategori.`);

  for (const activity of ACTIVITIES) {
    sections.push(`\n### ${activity.label}\n\n*${activity.desc}*\n`);
    sections.push(`| Bånd | Innerst | Mellomlag | Yttertøy | Ekstra | Sjekk |
|---|---|---|---|---|---|`);
    for (const band of BANDS) {
      const layers = baseTable[activity.id][band.id];
      const get = (cat: string) =>
        layers.find((l) => l.category === cat)?.items.join(', ') ?? '—';
      sections.push(
        `| **${band.label}** | ${get('innerst')} | ${get('mellomlag')} | ${get('yttertoy')} | ${get('ekstra')} | ☐ ☐ ☐ |`,
      );
    }
  }

  sections.push(`\n---

## 3. Modifier-regler (17 stk)

Regler som legger på toppen av base-tabellen.\n`);
  for (const rule of MODIFIERS) {
    sections.push(`### ${rule.code} — ${rule.title}

- **Trigger:** ${rule.trigger}
- **Effekt:** ${rule.effect}
- **Kilde:** ${rule.sources.map((s) => `[${s}](${SOURCE_URL[s] ?? '#'})`).join(', ')}
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________
`);
  }

  sections.push(`---

## 4. Hard blocks (HB-1..HB-9)

Engine SKAL håndheve — aldri overstyrbart.\n`);
  for (const hb of HARD_BLOCKS) {
    sections.push(`### ${hb.code} — ${hb.title}

- **Trigger:** ${hb.trigger}
- **Effekt:** ${hb.effect}
- **Kilde:** ${hb.sources.map((s) => `[${s}](${SOURCE_URL[s] ?? '#'})`).join(', ')}
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________
`);
  }

  sections.push(`---

## 5. Combination conflicts (CK-1..CK-9)

Konfliktgraf kjøres FØR safety. \`evidence\` = direkte medisinsk kilde; \`policy\` = produktpolicy.\n`);
  for (const ck of CONFLICTS) {
    sections.push(`### ${ck.code} — ${ck.title} *(${ck.type})*

- **Trigger:** ${ck.trigger}
- **Effekt:** ${ck.effect}
- **Kilde:** ${ck.sources.map((s) => `[${s}](${SOURCE_URL[s] ?? '#'})`).join(', ')}
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________
`);
  }

  sections.push(`---

## 6. Soft blocks (SB-1..SB-7)

Justeringer som reduserer lag eller flagger advarsler, ikke avvisning.\n`);
  for (const sb of SOFT_BLOCKS) {
    sections.push(`### ${sb.code} — ${sb.title}

- **Trigger:** ${sb.trigger}
- **Effekt:** ${sb.effect}
- **Kilde:** ${sb.sources.map((s) => `[${s}](${SOURCE_URL[s] ?? '#'})`).join(', ')}
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________
`);
  }

  sections.push(`---

## 7. Plagg-katalog (60 plagg)

Komplett liste med visning av regel-trigger per plagg ligger på den visuelle siden:

**https://wool-app.vercel.app/fagavstemning.html**

Anbefalt format for ekspert-tilbakemelding:
- Print denne fila som PDF (Ctrl+P → Save as PDF)
- Marker sjekklister + skriv kommentar i marg
- Sjekk visuell side parallelt for konkrete plagg-eksempler
- Send tilbakemelding til **sivertskotvold@gmail.com**

---

*Generert av \`scripts/generate-rules-docs.ts\` — kjør \`npm run generate:rules\` for å oppdatere.*
`);

  return sections.join('\n');
}

// ── HTML render ──────────────────────────────────────────────────────────

function renderHtml(): string {
  const date = '2026-06-10';

  const garmentData = GARMENTS.map((g) => {
    const baseEntries = findBaseTableEntries(g.id);
    const conflicts = findConflictsForGarment(g.id);
    const replacements = findAgeReplacements(g.id);
    const triggers = findTriggers(g.id);
    return {
      ...g,
      baseEntries,
      conflicts,
      replacements,
      triggers,
    };
  });

  const dataJson = JSON.stringify(garmentData);

  return `<!doctype html>
<html lang="nb">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Babyora — Fagavstemning</title>
  <style>
    :root {
      --terra: oklch(64% 0.16 40);
      --terra-deep: oklch(38% 0.10 38);
      --ink: oklch(20% 0.02 230);
      --paper: oklch(98% 0.005 60);
      --krem: #fff;
      --mute: oklch(54% 0.02 60);
      --hair: oklch(90% 0.008 60);
      --safety-critical: oklch(48% 0.18 25);
      --sans: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
      --serif: 'DM Serif Display', Georgia, serif;
    }
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: var(--sans);
      background: var(--paper);
      color: var(--ink);
      -webkit-font-smoothing: antialiased;
    }
    .page { max-width: 1280px; margin: 0 auto; padding: 24px; }
    header { padding: 16px 0 24px; border-bottom: 1px solid var(--hair); margin-bottom: 24px; }
    h1 { font-family: var(--serif); font-size: 32px; color: var(--terra-deep); margin: 0 0 8px; }
    .intro { color: var(--mute); max-width: 640px; line-height: 1.5; font-size: 15px; margin: 0 0 12px; }
    .meta { font-size: 13px; color: var(--mute); }
    .toolbar { display: flex; gap: 12px; flex-wrap: wrap; margin: 16px 0; align-items: center; }
    .search-input { flex: 1; min-width: 220px; padding: 10px 14px; border: 1px solid var(--hair); border-radius: 999px; font: inherit; font-size: 14px; background: #fff; }
    .filter-btn { padding: 8px 14px; border: 1px solid var(--hair); border-radius: 999px; background: #fff; font: 600 13px/1 var(--sans); color: var(--ink); cursor: pointer; transition: all 160ms; }
    .filter-btn[data-active="true"] { background: var(--terra); color: #fff; border-color: var(--terra); }
    .filter-label { font: 700 11px/1 var(--sans); color: var(--mute); text-transform: uppercase; letter-spacing: 0.12em; margin-right: 4px; }
    main { display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 1024px) { main { grid-template-columns: 1fr 380px; align-items: start; } }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
    .card { background: #fff; border: 1px solid var(--hair); border-radius: 12px; padding: 12px; text-align: center; cursor: pointer; transition: all 160ms; }
    .card:hover { border-color: var(--terra); transform: translateY(-1px); }
    .card[data-selected="true"] { border-color: var(--terra); background: color-mix(in oklab, var(--terra) 6%, #fff); }
    .card img { width: 80px; height: 80px; object-fit: contain; display: block; margin: 0 auto 8px; }
    .card-label { font: 600 13px/1.3 var(--sans); color: var(--ink); }
    .card-badge { display: inline-block; margin-top: 6px; padding: 2px 8px; background: var(--paper); color: var(--terra-deep); border-radius: 99px; font: 700 10px/1.4 var(--sans); text-transform: uppercase; letter-spacing: 0.08em; }
    .detail { position: sticky; top: 24px; background: #fff; border: 1px solid var(--hair); border-radius: 14px; padding: 20px; min-height: 400px; }
    .detail-empty { color: var(--mute); font-size: 14px; line-height: 1.6; text-align: center; padding: 60px 16px; }
    .detail-hero { text-align: center; padding: 12px; background: var(--paper); border-radius: 10px; margin-bottom: 16px; }
    .detail-hero img { width: 180px; height: 180px; object-fit: contain; }
    .detail h2 { font-family: var(--serif); font-size: 22px; color: var(--terra-deep); margin: 0 0 4px; }
    .detail-category { font: 700 11px/1 var(--sans); color: var(--terra); text-transform: uppercase; letter-spacing: 0.14em; margin-bottom: 12px; }
    .detail h3 { font: 700 11px/1 var(--sans); color: var(--mute); text-transform: uppercase; letter-spacing: 0.14em; margin: 16px 0 8px; }
    .detail p, .detail li { font-size: 14px; line-height: 1.45; color: var(--ink); }
    .detail ul { padding-left: 18px; margin: 4px 0; }
    .aliases { font-size: 12px; color: var(--mute); margin: 0 0 12px; }
    .recommended-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 4px; }
    .recommended-list li { padding: 6px 10px; background: var(--paper); border-radius: 8px; font-size: 13px; display: flex; justify-content: space-between; gap: 8px; }
    .recommended-list .activity { font-weight: 700; color: var(--terra-deep); }
    .recommended-list .band { color: var(--mute); font-size: 12px; }
    .conflict-item { padding: 10px 12px; background: color-mix(in oklab, var(--safety-critical) 8%, #fff); border-left: 3px solid var(--safety-critical); border-radius: 8px; margin: 6px 0; }
    .conflict-code { font: 800 10px/1 var(--sans); color: var(--safety-critical); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
    .conflict-with { font: 700 13px/1.3 var(--sans); color: var(--ink); }
    .conflict-reason { font: 500 12px/1.4 var(--sans); color: var(--mute); margin-top: 4px; }
    .replacement-item { padding: 8px 12px; background: var(--paper); border-radius: 8px; margin: 4px 0; font-size: 13px; }
    .trigger-item { padding: 6px 10px; background: color-mix(in oklab, var(--terra) 8%, #fff); border-radius: 8px; margin: 4px 0; font: 500 13px/1.3 var(--sans); color: var(--terra-deep); }
    .empty { color: var(--mute); font-size: 13px; font-style: italic; padding: 4px 0; }
    footer { margin-top: 48px; padding: 24px 0; border-top: 1px solid var(--hair); color: var(--mute); font-size: 13px; }
    footer a { color: var(--terra-deep); text-decoration: underline; }
    @media print {
      body { background: #fff; }
      .toolbar { display: none; }
      main { grid-template-columns: 1fr; }
      .detail { display: none; }
      .grid { grid-template-columns: repeat(2, 1fr); }
      .card { break-inside: avoid; page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="page">
    <header>
      <h1>Babyora — Fagavstemning</h1>
      <p class="intro">Visuell oversikt over alle 60 plagg som engine kan anbefale, hvilke betingelser som utløser dem, og hvilke kombinasjoner som er forbudt. Klikk et plagg for detaljer i panelet til høyre.</p>
      <p class="meta">Generert ${date} · 60 plagg · Eksperten kommenterer til <a href="mailto:sivertskotvold@gmail.com">sivertskotvold@gmail.com</a></p>
    </header>

    <div class="toolbar">
      <input class="search-input" id="search" placeholder="Søk i plagg-navn …" />
      <span class="filter-label">Kategori:</span>
      <button class="filter-btn" data-filter="cat" data-value="all" data-active="true">Alle</button>
      <button class="filter-btn" data-filter="cat" data-value="innerst">Innerst</button>
      <button class="filter-btn" data-filter="cat" data-value="mellomlag">Mellomlag</button>
      <button class="filter-btn" data-filter="cat" data-value="yttertoy">Yttertøy</button>
      <button class="filter-btn" data-filter="cat" data-value="ekstra">Ekstra</button>
    </div>

    <main>
      <div class="grid" id="grid"></div>
      <aside class="detail" id="detail">
        <div class="detail-empty">Velg et plagg fra grid-en til venstre for å se hvor, når og hvorfor det anbefales — pluss hvilke kombinasjoner det aldri er med i.</div>
      </aside>
    </main>

    <footer>
      <p>Engine-versjon: main. Komplett regelverk-fil: <a href="/regelverk.md">regelverk.md</a>. Babyora wool-layers © Sivert Skotvold 2026.</p>
    </footer>
  </div>

  <script>
    const GARMENTS = ${dataJson};
    const ACTIVITY_LABEL = { vogn: 'Vogn', baeresele: 'Bæresele', utelek: 'Utelek', soevn: 'Søvn' };
    const BAND_LABEL = {
      ekstrem_varme: 'Ekstrem varme (≥28°)', tropisk: 'Tropisk (22-27°)', varm: 'Varm (16-21°)',
      mild: 'Mild (10-15°)', kjolig: 'Kjølig (5-9°)', kald: 'Kald (0-4°)',
      frost: 'Frost (-7 til -1°)', streng_frost: 'Streng frost (-15 til -8°)', ekstrem: 'Ekstrem kulde (<-15°)',
    };

    const grid = document.getElementById('grid');
    const detail = document.getElementById('detail');
    const searchInput = document.getElementById('search');
    let filterCat = 'all';
    let searchTerm = '';

    function renderGrid() {
      const filtered = GARMENTS.filter((g) => {
        if (filterCat !== 'all' && g.category !== filterCat) return false;
        if (searchTerm && !g.label.toLowerCase().includes(searchTerm)) return false;
        return true;
      });
      grid.innerHTML = filtered.map((g) => \`
        <div class="card" data-id="\${g.id}" onclick="selectGarment('\${g.id}')">
          <img src="\${g.illustration}" alt="" loading="lazy" />
          <div class="card-label">\${g.label}</div>
          \${g.subcategory ? \`<span class="card-badge">\${g.subcategory}</span>\` : ''}
        </div>
      \`).join('');
    }

    function selectGarment(id) {
      document.querySelectorAll('.card').forEach((c) => c.dataset.selected = (c.dataset.id === id ? 'true' : 'false'));
      const g = GARMENTS.find((x) => x.id === id);
      if (!g) return;

      const recommendedHtml = g.baseEntries.length > 0
        ? '<ul class="recommended-list">' + g.baseEntries.map((e) => \`
            <li><span class="activity">\${ACTIVITY_LABEL[e.activity]}</span><span class="band">\${BAND_LABEL[e.band]}</span></li>
          \`).join('') + '</ul>'
        : '<p class="empty">Ikke i noen base-tabell direkte — trigges kun av modifiers (se under).</p>';

      const triggersHtml = g.triggers.length > 0
        ? g.triggers.map((t) => \`<div class="trigger-item">\${t}</div>\`).join('')
        : '<p class="empty">Ingen modifier-trigger — anbefales kun fra base-tabell.</p>';

      const conflictsHtml = g.conflicts.length > 0
        ? g.conflicts.map((c) => \`
            <div class="conflict-item">
              <div class="conflict-code">\${c.code}</div>
              <div class="conflict-with">Aldri sammen med: \${c.with}</div>
              <div class="conflict-reason">\${c.reason}</div>
            </div>
          \`).join('')
        : '<p class="empty">Ingen kjente konflikter.</p>';

      const replacementsHtml = g.replacements.length > 0
        ? g.replacements.map((r) => \`<div class="replacement-item">\${r}</div>\`).join('')
        : '<p class="empty">Ingen alders-baserte erstatninger.</p>';

      detail.innerHTML = \`
        <div class="detail-hero"><img src="\${g.illustration}" alt="\${g.label}" /></div>
        <h2>\${g.label}</h2>
        <p class="detail-category">\${g.category}\${g.subcategory ? ' · ' + g.subcategory : ''}</p>
        <p class="aliases">Database-strenger: \${g.aliases.join('; ')}</p>

        <h3>Hva er det</h3>
        <p>\${g.what}</p>

        <h3>Når brukes det</h3>
        <p>\${g.when}</p>

        <h3>Anbefalt i base-tabell</h3>
        \${recommendedHtml}

        <h3>Trigget av modifier-regler</h3>
        \${triggersHtml}

        <h3>Aldri kombinert med</h3>
        \${conflictsHtml}

        <h3>Erstattes av (alder)</h3>
        \${replacementsHtml}
      \`;
    }

    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.toLowerCase();
      renderGrid();
    });

    document.querySelectorAll('.filter-btn[data-filter="cat"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn[data-filter="cat"]').forEach((b) => b.dataset.active = 'false');
        btn.dataset.active = 'true';
        filterCat = btn.dataset.value;
        renderGrid();
      });
    });

    renderGrid();
  </script>
</body>
</html>
`;
}

// ── Run ──────────────────────────────────────────────────────────────────

const mdPath = resolve(ROOT, 'public', 'regelverk.md');
const htmlPath = resolve(ROOT, 'public', 'fagavstemning.html');

writeFileSync(mdPath, renderMarkdown(), 'utf8');
writeFileSync(htmlPath, renderHtml(), 'utf8');

console.log(`Wrote ${mdPath}`);
console.log(`Wrote ${htmlPath}`);
console.log('Done.');
