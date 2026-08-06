/**
 * Leser byggestatus fra Codemagic uten nettleser.
 *
 * Bakgrunn (2026-08-06): Codemagic-innlogging via GitHub OAuth blir blokkert
 * i et Playwright-styrt vindu (Google svarer «denne nettleseren er muligens
 * ikke sikker»). API-token er den eneste veien som ikke krever at eieren
 * sitter og leser av skjermen.
 *
 * Token: codemagic.io → brukerikon → Settings → «API token» (kopier).
 * Legges i babyora/.env.local som CODEMAGIC_API_TOKEN=... (.env* er
 * gitignorert, linje 40 i .gitignore).
 *
 * Bruk:
 *   node tools/codemagic-status.mjs             # siste 5 bygg
 *   node tools/codemagic-status.mjs --watch     # poller til bygget er ferdig
 *   node tools/codemagic-status.mjs --logg      # + siste feilende steg
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP_ID = '6a6097712c22c108dee42b77';

function token() {
  if (process.env.CODEMAGIC_API_TOKEN) return process.env.CODEMAGIC_API_TOKEN;
  const f = join(ROT, '.env.local');
  if (existsSync(f)) {
    const m = readFileSync(f, 'utf8').match(/^CODEMAGIC_API_TOKEN\s*=\s*(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return null;
}

const TOKEN = token();
if (!TOKEN) {
  console.error(
    'Mangler CODEMAGIC_API_TOKEN.\n' +
      'Hent den på codemagic.io → Settings → API token, og legg linjen\n' +
      '  CODEMAGIC_API_TOKEN=<token>\n' +
      'i babyora/.env.local (den er gitignorert).',
  );
  process.exit(2);
}

async function hentBygg() {
  const r = await fetch(`https://api.codemagic.io/builds?appId=${APP_ID}&limit=5`, {
    headers: { 'x-auth-token': TOKEN },
  });
  if (!r.ok) throw new Error(`Codemagic svarte ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return (await r.json()).builds ?? [];
}

function linje(b) {
  const tag = b.tag ?? b.branch ?? '?';
  const naar = b.startedAt ?? b.createdAt ?? '';
  return `${b.status.padEnd(12)} ${String(b.workflowId ?? '').padEnd(16)} ${tag.padEnd(12)} ${naar}  ${b._id}`;
}

const FERDIG = new Set(['finished', 'failed', 'canceled', 'timeout', 'skipped']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const watch = process.argv.includes('--watch');
const visLogg = process.argv.includes('--logg');

for (let runde = 0; ; runde++) {
  const bygg = await hentBygg();
  if (!bygg.length) {
    console.log('Ingen bygg funnet for appId ' + APP_ID);
    process.exit(1);
  }
  console.log(`— runde ${runde} —`);
  bygg.forEach((b) => console.log(linje(b)));

  const siste = bygg[0];
  if (visLogg || FERDIG.has(siste.status)) {
    const feilende = (siste.buildActions ?? []).filter((a) => a.status === 'failed');
    for (const a of feilende) {
      console.log(`\nFEILENDE STEG: ${a.name}`);
      console.log(String(a.output ?? a.log ?? '(ingen output i API-svaret)').slice(-3000));
    }
  }
  if (!watch || FERDIG.has(siste.status)) {
    process.exit(siste.status === 'finished' ? 0 : 1);
  }
  await sleep(45000);
}
