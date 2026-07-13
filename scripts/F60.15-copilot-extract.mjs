#!/usr/bin/env node
/**
 * F60.15 — Extract Copilot responses from live chat DOM and write final report.
 * Handles virtualized chat by snapshotting at multiple scroll positions and
 * merging unique (prompt, response) pairs.
 */
import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const REPORT_PATH = join(REPO_ROOT, 'docs', 'F60.15-copilot-loop.md');

const browser = await chromium.connectOverCDP('http://localhost:9224');
let p = null;
for (const ctx of browser.contexts())
  for (const pg of ctx.pages())
    if (pg.url().includes('m365.cloud.microsoft/chat')) p = pg;
if (!p) { console.error('no copilot tab'); process.exit(1); }
await p.bringToFront();

async function snapshotArticles() {
  return p.evaluate(() => {
    const els = Array.from(document.querySelectorAll('[role="article"]'));
    return els.map((el) => (el.innerText || el.textContent || '').trim());
  });
}

async function getScroller() {
  return p.evaluate(() => {
    const article = document.querySelector('[role="article"]');
    if (!article) return null;
    let s = article.parentElement;
    while (s && s !== document.body) {
      const oy = getComputedStyle(s).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && s.scrollHeight > s.clientHeight) {
        return { top: s.scrollTop, max: s.scrollHeight - s.clientHeight };
      }
      s = s.parentElement;
    }
    return null;
  });
}

async function scrollTo(pos) {
  await p.evaluate((target) => {
    const article = document.querySelector('[role="article"]');
    if (!article) return;
    let s = article.parentElement;
    while (s && s !== document.body) {
      const oy = getComputedStyle(s).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && s.scrollHeight > s.clientHeight) {
        s.scrollTop = target === 'top' ? 0 : target === 'bottom' ? s.scrollHeight : target;
        return;
      }
      s = s.parentElement;
    }
  }, pos);
  await p.waitForTimeout(1200);
}

// Collect across several scroll positions to handle virtualization
const allTexts = new Set();
const stops = ['bottom', 'top', 'bottom'];
for (const stop of stops) {
  await scrollTo(stop);
  const arts = await snapshotArticles();
  for (const t of arts) allTexts.add(t);
  // Scroll incrementally to capture middle
  const info = await getScroller();
  if (info && info.max > 0) {
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      await scrollTo(Math.round((info.max * i) / steps));
      const more = await snapshotArticles();
      for (const t of more) allTexts.add(t);
    }
  }
}

// Pair prompts → responses based on text content
const userPrompts = [];
const copilotResponses = [];
for (const t of allTexts) {
  if (t.startsWith('You said:')) userPrompts.push(t);
  else if (t.startsWith('Copilot said:')) copilotResponses.push(t);
}

console.log(`Found ${userPrompts.length} user prompts, ${copilotResponses.length} responses, ${allTexts.size} total articles`);

// Match each prompt to the response that appears nearest in DOM-order
// Strategy: snapshot once more and walk the visible order, matching adjacent pairs
await scrollTo('bottom');
await p.waitForTimeout(800);

const SCREEN_KEYS = [
  { id: 'hjem',          label: 'Hjem',          re: /Skjermen Hjem\s+i/i },
  { id: 'paakledning',   label: 'Påkledning',    re: /Skjermen P[åa]kledning\s+i/i },
  { id: 'uke',           label: 'Uke',           re: /Skjermen Uke\s+i/i },
  { id: 'guide',         label: 'Guide-hub',     re: /Skjermen Guide-hub\s+i/i },
  { id: 'innstillinger', label: 'Innstillinger', re: /Skjermen Innstillinger\s+i/i },
];

function parseScore(text) {
  const m = text.match(/SCORE\s*[:：]\s*(\d{1,3})\s*\/?\s*100?/i);
  return m ? Number(m[1]) : null;
}

function parseTiltak(text) {
  const after = text.split(/SCORE\s*:\s*\d+\/100\s*\n/i)[1] || '';
  const lines = after
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*\d+[\.\)\-:]\s*/, '').trim())
    .filter((l) => l.length > 15 && !/^copilot$/i.test(l))
    .slice(0, 3);
  return lines;
}

// For each screen, find its prompt and pick the response whose first ~200 chars
// contain plausible content. Strategy: scroll until that prompt is visible,
// snapshot, find prompt index, return the next article.
const byScreen = {};
for (const sk of SCREEN_KEYS) {
  // Find the matching user prompt
  const matchingPrompt = userPrompts.find((t) => sk.re.test(t));
  if (!matchingPrompt) {
    console.log(`  ${sk.id}: no prompt found`);
    continue;
  }
  // Find a response that follows this prompt in DOM at any scroll snapshot
  // We do it by re-checking: scroll to bottom, then top, then look for adjacency
  // Strategy: scan every scroll-snapshot, accept ANY response that follows a
  // matching prompt AND contains "SCORE:". If multiple, prefer the one with
  // highest score (latest answer is usually best).
  const candidates = [];
  const seenInSnapshot = new Set();
  const tryAdjacency = (arts) => {
    for (let i = 0; i < arts.length - 1; i++) {
      if (sk.re.test(arts[i]) && arts[i].startsWith('You said:') && arts[i + 1].startsWith('Copilot said:')) {
        const resp = arts[i + 1];
        if (/SCORE\s*:\s*\d/.test(resp) && !seenInSnapshot.has(resp)) {
          seenInSnapshot.add(resp);
          candidates.push(resp);
        }
      }
    }
  };
  for (const stop of ['bottom', 'top']) {
    await scrollTo(stop);
    await p.waitForTimeout(800);
    tryAdjacency(await snapshotArticles());
    const info = await getScroller();
    if (info && info.max > 0) {
      for (let s = 0; s <= 8; s++) {
        await scrollTo(Math.round((info.max * s) / 8));
        await p.waitForTimeout(400);
        tryAdjacency(await snapshotArticles());
      }
    }
  }
  // Prefer the LAST candidate (most recent re-run)
  const foundResponse = candidates.length > 0 ? candidates[candidates.length - 1] : null;

  if (!foundResponse) {
    console.log(`  ${sk.id}: prompt found but no adjacent response`);
    continue;
  }
  byScreen[sk.id] = {
    ...sk,
    score: parseScore(foundResponse),
    tiltak: parseTiltak(foundResponse),
    rawResponse: foundResponse,
  };
}

// Build report
const lines = [];
lines.push('# F60.15 Copilot-loop rapport (v2 — final)');
lines.push('');
lines.push(`- **Generert:** ${new Date().toISOString()}`);
lines.push('- **Base-URL:** https://wool-app.vercel.app/');
lines.push('- **Viewport:** 390×844 (iPhone)');
lines.push('- **Theme:** dark');
lines.push('- **Modus:** ren tekst-prompt (ingen bilde-upload)');
lines.push(`- **Skjermer evaluert:** ${Object.keys(byScreen).length}/${SCREEN_KEYS.length}`);
lines.push('');
lines.push('## Per-skjerm');
lines.push('');

for (const sk of SCREEN_KEYS) {
  const r = byScreen[sk.id];
  lines.push(`### ${sk.id} — ${sk.label}`);
  lines.push('');
  lines.push(`- **Screenshot:** \`screenshots/F60.15-copilot-${sk.id}.png\``);
  if (!r) {
    lines.push('- **SCORE:** _(ingen respons funnet i chat)_');
    lines.push('');
    continue;
  }
  lines.push(`- **SCORE:** ${r.score !== null ? `${r.score}/100` : 'n/a'}`);
  lines.push('');
  lines.push('**Topp 3 tiltak:**');
  if (r.tiltak.length > 0) {
    r.tiltak.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
  } else {
    lines.push('_(ingen tiltak parset)_');
  }
  lines.push('');
  lines.push('<details><summary>Rå Copilot-respons</summary>');
  lines.push('');
  lines.push('```');
  lines.push(r.rawResponse.slice(0, 3000));
  lines.push('```');
  lines.push('');
  lines.push('</details>');
  lines.push('');
}

const evald = Object.values(byScreen);
const klare = evald.filter((r) => r.score !== null && r.score >= 90);
const fix = evald.filter((r) => r.score !== null && r.score < 90);
const ukjent = SCREEN_KEYS.length - evald.length;

lines.push('## Sammendrag');
lines.push('');
lines.push('| Status | Antall | Skjermer |');
lines.push('|---|---|---|');
lines.push(`| Klar (≥90) | ${klare.length} | ${klare.map((r) => `${r.id} (${r.score})`).join(', ') || '_ingen_'} |`);
lines.push(`| Trenger fix (<90) | ${fix.length} | ${fix.map((r) => `${r.id} (${r.score})`).join(', ') || '_ingen_'} |`);
lines.push(`| Ukjent / ikke evaluert | ${ukjent} | ${SCREEN_KEYS.filter((sk) => !byScreen[sk.id]).map((sk) => sk.id).join(', ') || '_ingen_'} |`);
lines.push('');
const avg = evald.length > 0 ? Math.round(evald.reduce((s, r) => s + (r.score ?? 0), 0) / evald.length) : 'n/a';
lines.push(`**Snitt-score:** ${avg}/100`);
lines.push('');

await mkdir(dirname(REPORT_PATH), { recursive: true });
await writeFile(REPORT_PATH, lines.join('\n'));

console.log(`Wrote ${REPORT_PATH}`);
console.log(`Screens evaluated: ${evald.length}/${SCREEN_KEYS.length}`);
for (const sk of SCREEN_KEYS) {
  const r = byScreen[sk.id];
  console.log(`  ${sk.id.padEnd(15)} ${r ? `${r.score}/100 (${r.tiltak.length} tiltak)` : '— (ingen respons)'}`);
}

await browser.close();
