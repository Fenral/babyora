#!/usr/bin/env node
/* F30.auto: V0 → Copilot handover-automatisering (Sivert 2026-06-19).
 *
 * Bruk:
 *   node scripts/v0-handover.mjs              # vis status + hjelp
 *   node scripts/v0-handover.mjs --regen      # regenererer handover-fila
 *                                              # fra siste git-state + v0-rounds
 *   node scripts/v0-handover.mjs --check 1.50 # sjekk saldo (gir inn saldo)
 *                                              # exit 1 hvis ≤ trigger
 *   node scripts/v0-handover.mjs --full       # regen + commit + push
 *                                              # (browser-delen via MCP separat)
 *
 * F30-protokoll: ved hver V0-runde-end skal Claude sjekke V0-saldo via
 * Playwright MCP. Hvis ≤ $0.5 → kjøres --full her, deretter Claude
 * navigerer Playwright til https://github.com/copilot og sender
 * handover-fila som åpningsmelding.
 *
 * Hvorfor ikke fullt automatisk Playwright her: V0 og Copilot bruker
 * session cookies fra Sivert's Edge. Standalone Playwright headless
 * trenger CDP-tilkobling til Edge eller separat login. For F30 holder
 * vi browser-delen i Claude's MCP-flyt.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { exit, argv } from 'node:process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const V0_ROUNDS_DIR = resolve(REPO_ROOT, 'docs/v0-rounds');
const COPILOT_ROUNDS_DIR = resolve(REPO_ROOT, 'docs/copilot-rounds');
const HANDOVER_FILE = resolve(V0_ROUNDS_DIR, 'HANDOVER-TO-COPILOT.md');
const TRIGGER_SALDO = 0.5;

const args = argv.slice(2);
const flag = (name) => args.includes(name);
const flagValue = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

if (args.length === 0 || flag('--help')) {
  printHelp();
  exit(0);
}

if (flag('--check')) {
  const saldoStr = flagValue('--check');
  if (saldoStr == null) {
    console.error('--check trenger saldo-arg: node scripts/v0-handover.mjs --check 1.50');
    exit(2);
  }
  const saldo = parseFloat(saldoStr);
  if (Number.isNaN(saldo)) {
    console.error(`ugyldig saldo: ${saldoStr}`);
    exit(2);
  }
  if (saldo <= TRIGGER_SALDO) {
    console.log(`⚠ V0-saldo $${saldo.toFixed(2)} ≤ $${TRIGGER_SALDO.toFixed(2)} → TRIGGER HANDOVER`);
    console.log(`→ kjør: node scripts/v0-handover.mjs --full`);
    exit(1);
  }
  console.log(`✓ V0-saldo $${saldo.toFixed(2)} > $${TRIGGER_SALDO.toFixed(2)} — fortsett V0-loop`);
  exit(0);
}

if (flag('--regen') || flag('--full')) {
  regenerateHandover();
  if (flag('--full')) {
    commitAndPush();
    printNextSteps();
  } else {
    console.log(`\n✓ Handover regenerert: ${HANDOVER_FILE}`);
    console.log(`→ commit + push manuelt, eller kjør --full`);
  }
  exit(0);
}

console.error(`ukjent flag: ${args.join(' ')}`);
printHelp();
exit(2);

function printHelp() {
  console.log(`
F30.auto: V0 → Copilot handover-automatisering

Bruk:
  node scripts/v0-handover.mjs --check 1.50   # sjekk om saldo trigger
                                                # exit 1 hvis ≤ $${TRIGGER_SALDO.toFixed(2)}
  node scripts/v0-handover.mjs --regen        # regenererer handover-fila
                                                # basert på git-state + v0-rounds/
  node scripts/v0-handover.mjs --full         # --regen + commit + push
                                                # (browser-bytte gjøres via MCP)

Status nå:
  HANDOVER-FIL:    ${existsSync(HANDOVER_FILE) ? '✓ finnes' : '✗ mangler'}
  V0-ROUNDS-DIR:   ${existsSync(V0_ROUNDS_DIR) ? '✓ ' + countMd(V0_ROUNDS_DIR) + ' filer' : '✗ mangler'}
  COPILOT-MAPPE:   ${existsSync(COPILOT_ROUNDS_DIR) ? '✓ klar' : '✗ mangler'}
  TRIGGER-SALDO:   $${TRIGGER_SALDO.toFixed(2)}
  REPO-COMMIT:     ${gitShort()}
`);
}

function countMd(dir) {
  return readdirSync(dir).filter((f) => f.endsWith('.md')).length;
}

function gitShort() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: REPO_ROOT }).toString().trim();
  } catch {
    return '(unknown)';
  }
}

function gitLastCommitMsg() {
  try {
    return execSync('git log -1 --pretty=%s', { cwd: REPO_ROOT }).toString().trim();
  } catch {
    return '(unknown)';
  }
}

function gitLog(n = 10) {
  try {
    return execSync(`git log --oneline -${n}`, { cwd: REPO_ROOT }).toString().trim();
  } catch {
    return '(unknown)';
  }
}

function readV0Rounds() {
  if (!existsSync(V0_ROUNDS_DIR)) return [];
  const files = readdirSync(V0_ROUNDS_DIR)
    .filter((f) => f.endsWith('.md') && !f.startsWith('HANDOVER'))
    .sort();
  return files.map((f) => ({
    name: f,
    content: readFileSync(resolve(V0_ROUNDS_DIR, f), 'utf-8'),
  }));
}

function extractScoreTrend(rounds) {
  const trend = [];
  for (const r of rounds) {
    const scoreMatch = r.content.match(/score[:\s]+\*?\*?(\d{2,3})\/100/i);
    const screenMatch = r.name.match(/F28\.(\d+(?:\.\w+)?)-(\w+)/);
    if (screenMatch) {
      trend.push({
        file: r.name,
        commit: screenMatch[1],
        skjerm: screenMatch[2],
        score: scoreMatch ? scoreMatch[1] : '—',
      });
    }
  }
  return trend;
}

function regenerateHandover() {
  if (!existsSync(V0_ROUNDS_DIR)) {
    console.error(`mangler ${V0_ROUNDS_DIR}`);
    exit(2);
  }

  const rounds = readV0Rounds();
  const trend = extractScoreTrend(rounds);
  const lastCommit = gitShort();
  const lastMsg = gitLastCommitMsg();
  const recentLog = gitLog(10);

  const trendTable = trend.length
    ? trend.map((t) => `| ${t.commit} | ${t.skjerm} | ${t.score} | ${t.file} |`).join('\n')
    : '| — | — | — | (ingen V0-runder funnet) |';

  const filelist = rounds.map((r) => `- \`${r.name}\``).join('\n');

  const tpl = `# HANDOVER til Copilot — Babyora F28-loop fasit-rolle

> **AUTO-GENERERT** av \`scripts/v0-handover.mjs\` ved
> ${new Date().toISOString().slice(0, 10)} (timestamp utelatt — re-generering
> ved Sivert/Claude utgivelse, ikke runtime).

**Aktiveres når:** V0-saldo ≤ $${TRIGGER_SALDO.toFixed(2)}

---

## 1. Hvem du er, hva du gjør

Du er **GitHub Copilot** og tar over som **design-fasit-partner** i
Babyora F28-loopen — V0's rolle gjennom F28.21-28.

Sivert (eier) forventer:
- **Score 96+/100** før vi stopper på en skjerm
- **Brutal ærlighet, ikke ja-mann.** Utfordre Claude hvis han tar feil.
- **Korte konkrete svar.** Score + 1-2 konkrete tiltak per runde.
- **Spec-disiplin.** Instrument-DNA (TrackMan / Apple Weather / Things 3).

Anti-mønstre (Sivert-direktiv):
- Konsensus-først er bias-felle — utfordre Claude alltid
- Ja-mann-respons er forbudt
- «Begge alternativene er bra» er forbudt — gi sterkeste mening først

---

## 2. Babyora — kondensert context

**Hva:** Norsk PWA som hjelper foreldre kle på spedbarn (0-3 år) etter været.
**Live:** https://wool-app.vercel.app
**Stack:** React + Vite + TypeScript + Capacitor (iOS+Android), Vercel auto-deploy.

**Design-DNA:**
- Instrument-metafor (TrackMan / Apple Weather / Things 3)
- Palette: terracotta (#AD4B2A 600 ink, #D98A6A 400 line, #F6E3D9 100 tint),
  sand-100 #F4EEE7 bg, ink-300/500/700/900
- Font: Schibsted Grotesk (sans only — DROP serif)
- ° baseline (ikke superscript), tabular-nums
- Atmosphere-gradient kontinuerlig mix (cold top → warm bottom), aldri 3 faste klasser
- Form-baserte LayerSymbol (outline/halv/solid)
- Native \`<dialog showModal>\` for focus-trap

---

## 3. Hvor V0-loopen sluttet (frosset state)

**Siste commit:** \`${lastCommit}\` — ${lastMsg}
**Triggered ved:** V0-saldo ≤ $${TRIGGER_SALDO.toFixed(2)}
**Skjerm vi sto på:** se siste fil i seksjon 10

**Siste 10 commits:**
\`\`\`
${recentLog}
\`\`\`

---

## 4. V0-score-tabell (auto fra v0-rounds/)

| F28.X | Skjerm | Score | Fil |
|---|---|---|---|
${trendTable}

---

## 5. V0's mest sentrale verdikter (verbatim sitater)

Disse er **bar for kvalitet du forventes å levere som fasit:**

**Engine-splaining:**
> «Components should explain themselves. En banner som forteller hvorfor
> færre lag ER engine-splaining — flytt til 'Hvorfor?'-expander.»

**Atmosphere-konsistens:**
> «Kontinuerlig mix() cold→mild→warm, aldri tre faste klasser, transition:
> background var(--dur-slow) så skiftet føles levende, ikke hopp.»

**Instrument-DNA:**
> «Bare-nivå gjennomført (ingen surface-bokser rundt temp/condition/
> anbefaling), ° på baseline med tabular-nums + clamp() for 1.4.4.
> Det er ekte 96-kandidat-arbeid.»

**Kolonnelås:**
> «Misalignment vises først nedover i lista, ikke i toppraden du ser i
> preview. Spec'en kaller dette 'det dyreste enkeltproblemet for
> betalingsvilje'.»

**Språk-presisjon:**
> «Inkonsistent ordstilling mellom skjermer ('ull-mellomlag tykt' cold
> vs 'tynn ull-mellomlag' mild). Maskinell ordstilling leser som
> DB-nøkler. Naturlig: 'isolert vinterdress', 'tynt ullsett'.»

**Ærlighet i UI-state:**
> «Bakgrunnen representerer dayIdx, men hvis raden ikke har et synlig
> valgt-tilstand, kan brukeren ikke se hvilken dag gradienten viser →
> bakgrunnen oppleves som om den 'lyver'.»

**TILTAK 5b condition-lag:**
> Lag 1 Tone (alltid): temperaturgradient (~70% av været).
> Lag 2 Condition (BAK avataren): klarvær mykt lyspunkt, skyet flatere,
> snø 12-15 partikler slow drift (ENESTE bevegelses-lag), regn statisk haze.
> Lag 3 Grounding: shadow-ground.

---

## 6. A11y-policy ved uenighet med Claude/Sivert

Sivert valgte **Hybrid (B med presisering):** Visuell form fra fasit (V0/deg),
semantisk/ARIA fra accessibility-lead.

Eksempler:
- atmosphere \`transition: background\` BEHOLDT ved prefers-reduced-motion
  (a11y-lead: «color is not motion»)
- SegmentToggle ser ut som A3-pille men kan ha ulike ARIA-roles
  (radiogroup / switch / tabs)
- Status-dot må aldri være eneste signal — alltid tekst-label
- Inline-expander: aria-expanded + aria-controls + return focus

A11y-lead vinner ved semantisk uenighet. Du eier visuell form.

---

## 7. Loop-protokoll (slik V0 fungerte best)

**Hva gikk galt:** Vedlegg (screenshots) spiste V0's context-limit
hver gang. Tekst-only fungerte.

**Anbefalt mønster:**
- **Tekst-only** — drop screenshots og vedlegg
- **2-3 spørsmål per melding**, kort svar pr linje
- **Be om score 0-100 eksplisitt** + 1-2 konkrete tiltak + SHIP-verdikt
- **Bevisst kort prolog** (V0-context-limit triggered etter ~3000 tegn)
- **Aldri konsensus-først** — utfordre Claude og Sivert tilbake

Hver runde dekker:
1. Skjerm-navn + commit-hash
2. Hva som er endret siden forrige runde
3. 2-3 spørsmål: ny score? hva mangler for 96+? SHIP eller ikke?

---

## 8. F28-rekkefølge (status ved bytte)

1. ✅ Forside (B1) — F27.3 + F28.28 (sannsynlig ~96 SHIP, V0-runde 10 kuttet)
2. ✅ Uke (B2) — 97/100 SHIP (V0-runde 8)
3. ⏳ Guide-hub (B3) — NESTE
4. ⏳ Innstillinger (B7-3)
5. ✅ Påkledning (LayerDetailSheet) — F28.21-24, ~93 forventet
6. ⏳ Plaggbibliotek (B4)
7. ⏳ Plagg-detalj (B5)
8. ⏳ Finn antrekk (B6)
9. ⏳ Varm/kald (B7-1)
10. ⏳ TOG-veiledning (B7-2)
11. ⏳ Onboarding

---

## 9. Hvordan du fortsetter

1. **Bekreft kontekst:** Si fra at du har lest handover-fila + nevn ett
   eller flere V0-sitat verbatim for å vise du har den
2. **Ta neste skjerm** (Guide-hub) eller bekreft Forsiden+Påkledning SHIP
3. **Lagre svarene dine** i \`wool-app/docs/copilot-rounds/F28.X-skjerm.md\`
   (samme struktur som \`docs/v0-rounds/\`)
4. **Bruk samme tekst-only-protokoll** som V0

Lykke til. Vær brutal. Sivert vil ha 96+.

---

## 10. V0-runde-arkivet (alle filer)

${filelist}

---

*Regenerer fila: \`node scripts/v0-handover.mjs --regen\`*
*Full bytte: \`node scripts/v0-handover.mjs --full\` (regen + commit + push)*
`;

  if (!existsSync(V0_ROUNDS_DIR)) mkdirSync(V0_ROUNDS_DIR, { recursive: true });
  writeFileSync(HANDOVER_FILE, tpl, 'utf-8');
  console.log(`✓ Regenerert ${HANDOVER_FILE}`);
  console.log(`  - ${rounds.length} V0-runder lest`);
  console.log(`  - score-trend: ${trend.length} skjermer`);
  console.log(`  - siste commit: ${lastCommit}`);
}

function commitAndPush() {
  try {
    execSync('git add docs/v0-rounds/HANDOVER-TO-COPILOT.md', { cwd: REPO_ROOT, stdio: 'inherit' });
    const msg = `F30.trigger: regenerert HANDOVER-TO-COPILOT.md (V0-saldo lav)`;
    execSync(`git commit -m "${msg}"`, { cwd: REPO_ROOT, stdio: 'inherit' });
    execSync('git push origin main', { cwd: REPO_ROOT, stdio: 'inherit' });
    console.log(`\n✓ Pushed`);
  } catch (e) {
    console.error(`✗ commit/push feilet: ${e.message}`);
    exit(1);
  }
}

function printNextSteps() {
  console.log(`
─── NESTE STEG ───

  1. Naviger Playwright (via Claude MCP) til https://github.com/copilot
  2. Åpne ny chat
  3. Lim inn innholdet i ${HANDOVER_FILE} som åpningsmelding
  4. Vent Copilot's bekreftelse + første respons
  5. Lagre Copilot-rundene i docs/copilot-rounds/F28.X-skjerm.md

(Browser-delen håndteres av Claude i hovedflyten — script-en gjør
file-genereringen + git-push for å spare manuelle steg.)
`);
}
