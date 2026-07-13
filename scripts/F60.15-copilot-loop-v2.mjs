#!/usr/bin/env node
/**
 * F60.15 — Copilot-loop v2 (text-only, 5 screens)
 * ================================================
 * Sends ren tekst-prompt for hver av 5 prioriterte skjermer til M365 Copilot
 * via en åpen CDP-fane (port 9224), parser SCORE + 3 tiltak fra responsen
 * og logger til docs/F60.15-copilot-loop.md.
 *
 * Bypasser Lexical .type()-timeout ved å bruke execCommand('insertText').
 */

import { chromium } from 'playwright';
import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const SHOTS_DIR = join(REPO_ROOT, 'screenshots');
const DOCS_DIR = join(REPO_ROOT, 'docs');
const REPORT_PATH = join(DOCS_DIR, 'F60.15-copilot-loop.md');

const BASE_URL = process.env.WOOL_BASE_URL ?? 'https://wool-app.vercel.app/';
const CDP_URL = process.env.WOOL_CDP_URL ?? 'http://localhost:9224';
const MAX_WAIT_RESPONSE_MS = Number(process.env.WOOL_MAX_RESPONSE_MS ?? 120_000);
const POLL_INTERVAL_MS = 2000;
const SETTLE_AFTER_RESPONSE_MS = 5000;

const VIEWPORT = { width: 390, height: 844 };

// 5 priority screens
const ALL_SCREENS = [
  { id: 'hjem',          label: 'Hjem',          navigate: gotoHjem },
  { id: 'paakledning',   label: 'Påkledning',    navigate: gotoPaakledning },
  { id: 'uke',           label: 'Uke',           navigate: gotoUke },
  { id: 'guide',         label: 'Guide-hub',     navigate: gotoGuide },
  { id: 'innstillinger', label: 'Innstillinger', navigate: gotoInnstillinger },
];
const SCREEN_FILTER = process.env.WOOL_SCREENS
  ? new Set(process.env.WOOL_SCREENS.split(',').map((s) => s.trim()))
  : null;
const SCREENS = SCREEN_FILTER ? ALL_SCREENS.filter((s) => SCREEN_FILTER.has(s.id)) : ALL_SCREENS;

async function gotoBase(page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForSelector('nav[aria-label="Hovednavigasjon"]', { timeout: 15000 }).catch(() => {});
}

async function tapTab(page, label) {
  const sel = `nav[aria-label="Hovednavigasjon"] button:has-text("${label}")`;
  await page.locator(sel).first().click({ timeout: 5000 }).catch(async () => {
    await page.getByRole('button', { name: new RegExp(label, 'i') }).first().click({ timeout: 5000 }).catch(() => {});
  });
  await page.waitForTimeout(900);
}

async function gotoHjem(page) {
  await gotoBase(page);
  await tapTab(page, 'Hjem').catch(() => {});
}

async function gotoPaakledning(page) {
  await gotoBase(page);
  await tapTab(page, 'Hjem').catch(() => {});
  for (const label of ['Se påkledning', 'Påkledning', 'Påkle', 'Kle på']) {
    const el = page.getByText(new RegExp(label, 'i')).first();
    if ((await el.count()) > 0) {
      await el.click({ timeout: 3000 }).catch(() => {});
      break;
    }
  }
  await page.waitForTimeout(900);
}

async function gotoUke(page) {
  await gotoBase(page);
  await tapTab(page, 'Uke');
}

async function gotoGuide(page) {
  await gotoBase(page);
  await tapTab(page, 'Guide');
}

async function gotoInnstillinger(page) {
  await gotoBase(page);
  await tapTab(page, 'Innst');
}

async function setDark(page) {
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    try {
      localStorage.setItem('babyora.theme', JSON.stringify({ state: { mode: 'dark' }, version: 0 }));
    } catch {}
  });
  await page.waitForTimeout(200);
}

function promptFor(screen) {
  return `Jeg har en Babyora-app for baby-påkledning. Skjermen ${screen.label} i dark-mode warm-grey #1A1816 bg + warm orange #FF8550 CTA + DM Serif Display + Schibsted Grotesk. Vurder design fra perspektivet 'sliten norsk mor utendørs med vinter-hansker, én hånd'. Score 0-100 (overall) + 3 konkrete forbedrings-tiltak. Format svaret slik: SCORE: NN/100\n1. ...\n2. ...\n3. ...`;
}

// ── Copilot interaction ──────────────────────────────────────────────────────

async function getMessageCount(page) {
  return page.evaluate(() => {
    const sels = [
      '[data-tid="chat-pane-message"]',
      '[data-tid="messageEntity"]',
      '[data-testid="messageBubble"]',
      '[class*="messageBubble"]',
      '[class*="ChatMessage"]',
      '[role="article"]',
    ];
    let max = 0;
    for (const sel of sels) {
      const n = document.querySelectorAll(sel).length;
      if (n > max) max = n;
    }
    return max;
  });
}

async function getLastAssistantText(page) {
  return page.evaluate(() => {
    const sels = [
      '[data-tid="chat-pane-message"]',
      '[data-tid="messageEntity"]',
      '[data-testid="messageBubble"]',
      '[class*="messageBubble"]',
      '[class*="ChatMessage"]',
      '[role="article"]',
    ];
    for (const sel of sels) {
      const els = Array.from(document.querySelectorAll(sel));
      if (els.length === 0) continue;
      const last = els[els.length - 1];
      const text = (last.innerText || last.textContent || '').trim();
      if (text.length > 0) return text;
    }
    return '';
  });
}

async function isStreaming(page) {
  return page.evaluate(() => {
    const stop = document.querySelector(
      'button[aria-label*="Stopp" i], button[aria-label*="Stop" i], button[aria-label*="Avbryt" i]'
    );
    if (stop && stop.offsetParent !== null) return true;
    return false;
  });
}

async function clearInput(page) {
  await page.evaluate(async () => {
    const input = document.querySelector('[contenteditable="true"][aria-label*="Copilot"]');
    if (!input) return;
    input.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
  });
  await page.waitForTimeout(200);
}

async function insertPromptText(page, text) {
  // Lexical reacts to execCommand('insertText') with proper InputEvent
  return page.evaluate(async (t) => {
    const input = document.querySelector('[contenteditable="true"][aria-label*="Copilot"]');
    if (!input) return { ok: false, error: 'no input' };
    input.focus();
    // Insert in chunks so very long strings don't get truncated
    const chunkSize = 800;
    for (let i = 0; i < t.length; i += chunkSize) {
      document.execCommand('insertText', false, t.slice(i, i + chunkSize));
      await new Promise((r) => setTimeout(r, 30));
    }
    return { ok: true, length: (input.textContent || '').length };
  }, text);
}

async function clickSend(page) {
  // Use both aria-label and title (probe5 confirmed both work)
  const send = page.locator('button[aria-label="Send"], button[title="Send"]').first();
  await send.waitFor({ state: 'visible', timeout: 10_000 });
  // Wait for it to be enabled
  for (let i = 0; i < 20; i++) {
    const disabled = await send.evaluate((el) => el.disabled);
    if (!disabled) break;
    await page.waitForTimeout(200);
  }
  await send.click({ timeout: 10_000 });
}

async function sendPromptAndWait(copilotPage, prompt, log) {
  // 1) Clear
  await clearInput(copilotPage);

  // 2) Baseline message count BEFORE typing/send
  const baseline = await getMessageCount(copilotPage);

  // 3) Insert text
  const ins = await insertPromptText(copilotPage, prompt);
  log(`    inserted ${ins.length ?? '?'} chars`);
  await copilotPage.waitForTimeout(400);

  // 4) Send
  await clickSend(copilotPage);
  log(`    sent, polling for response (max ${MAX_WAIT_RESPONSE_MS / 1000}s)`);

  // 5) Poll for new message, stabilize after response
  const start = Date.now();
  let lastText = '';
  let stableSince = 0;
  while (Date.now() - start < MAX_WAIT_RESPONSE_MS) {
    await copilotPage.waitForTimeout(POLL_INTERVAL_MS);
    const count = await getMessageCount(copilotPage);
    const streaming = await isStreaming(copilotPage);
    const text = await getLastAssistantText(copilotPage);

    if (count > baseline && text) {
      if (text === lastText && !streaming) {
        if (!stableSince) stableSince = Date.now();
        if (Date.now() - stableSince > SETTLE_AFTER_RESPONSE_MS) {
          return text;
        }
      } else {
        stableSince = 0;
        lastText = text;
      }
    }
  }
  return lastText || '(timeout — ingen respons)';
}

function parseScoreAndTiltak(text) {
  if (!text) return { score: null, tiltak: [] };
  const scoreMatch = text.match(/SCORE\s*[:：]\s*(\d{1,3})\s*\/?\s*100?/i);
  const score = scoreMatch ? Number(scoreMatch[1]) : null;
  const tiltak = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*(?:TILTAK\s*)?(\d)[\.\):：\-]\s*(.+)$/i);
    if (m && m[2].trim().length > 5) tiltak.push(m[2].trim());
  }
  if (tiltak.length === 0) {
    // Fallback: any substantive non-score lines
    const fallback = lines
      .map((l) => l.trim())
      .filter((l) => l.length > 20 && !/^score/i.test(l));
    tiltak.push(...fallback.slice(0, 3));
  }
  return { score, tiltak: tiltak.slice(0, 3) };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  await mkdir(SHOTS_DIR, { recursive: true });
  await mkdir(DOCS_DIR, { recursive: true });

  console.log('────────────────────────────────────────────────────');
  console.log(' F60.15 — Copilot-loop v2 (text-only, 5 screens)');
  console.log('────────────────────────────────────────────────────');

  const browser = await chromium.connectOverCDP(CDP_URL);
  const contexts = browser.contexts();
  if (contexts.length === 0) {
    console.error('No contexts on CDP');
    process.exit(2);
  }

  // Find Copilot in any context
  let copilotPage = null;
  let ctxForCopilot = null;
  for (const ctx of contexts) {
    for (const p of ctx.pages()) {
      if (p.url().includes('m365.cloud.microsoft/chat')) {
        copilotPage = p;
        ctxForCopilot = ctx;
        break;
      }
    }
    if (copilotPage) break;
  }
  if (!copilotPage) {
    console.error('Copilot tab not found');
    process.exit(2);
  }
  console.log('Copilot tab:', copilotPage.url().slice(0, 80));

  // Find existing wool-app page or open new one in same context
  let woolPage = null;
  for (const p of ctxForCopilot.pages()) {
    if (p.url().includes('wool-app.vercel.app')) {
      woolPage = p;
      break;
    }
  }
  if (!woolPage) {
    woolPage = await ctxForCopilot.newPage();
  }
  await woolPage.setViewportSize(VIEWPORT);
  console.log('Wool-app tab ready');

  // Re-init report
  const header = `# F60.15 Copilot-loop rapport (v2)

- **Generert:** ${new Date().toISOString()}
- **Base-URL:** ${BASE_URL}
- **Viewport:** ${VIEWPORT.width}×${VIEWPORT.height}
- **Theme:** dark
- **Antall skjermer:** ${SCREENS.length}
- **Modus:** ren tekst (ingen bilde-upload)

## Per-skjerm

`;
  await writeFile(REPORT_PATH, header);

  const results = [];
  let consecutiveSelectorFails = 0;

  for (const screen of SCREENS) {
    console.log(`\n──── ${screen.id} (${screen.label}) ────`);
    let shotPath = '';
    let response = '';
    let parsed = { score: null, tiltak: [] };
    let error = null;

    try {
      // 1. Navigate wool-app
      await woolPage.bringToFront().catch(() => {});
      await screen.navigate(woolPage);
      await setDark(woolPage);
      await woolPage.waitForTimeout(1000);

      // 2. Screenshot
      shotPath = join(SHOTS_DIR, `F60.15-copilot-${screen.id}.png`);
      await woolPage.screenshot({ path: shotPath, fullPage: false });
      console.log('  screenshot:', shotPath);

      // 3. Bring Copilot forward, send prompt
      await copilotPage.bringToFront();
      await copilotPage.waitForTimeout(500);

      response = await sendPromptAndWait(copilotPage, promptFor(screen), (m) => console.log(m));
      parsed = parseScoreAndTiltak(response);
      console.log(`  SCORE: ${parsed.score ?? 'n/a'} — ${parsed.tiltak.length} tiltak`);
      consecutiveSelectorFails = 0;
    } catch (e) {
      error = e.message;
      console.log('  ERROR:', e.message.split('\n')[0]);
      if (/locator|selector|setInputFiles|waitFor/i.test(e.message)) {
        consecutiveSelectorFails += 1;
      }
    }

    results.push({
      id: screen.id,
      label: screen.label,
      shotPath,
      score: parsed.score,
      tiltak: parsed.tiltak,
      rawResponse: response,
      error,
    });

    const block = `### ${screen.id} — ${screen.label}

- **Screenshot:** \`screenshots/F60.15-copilot-${screen.id}.png\`
- **SCORE:** ${parsed.score !== null ? `${parsed.score}/100` : 'n/a'}
${error ? `- **Feil:** ${error.split('\n')[0]}\n` : ''}
**Topp 3 tiltak:**
${parsed.tiltak.length > 0 ? parsed.tiltak.map((t, i) => `${i + 1}. ${t}`).join('\n') : '_(ingen tiltak parset)_'}

<details><summary>Rå Copilot-respons</summary>

\`\`\`
${(response || '').slice(0, 2500)}
\`\`\`

</details>

`;
    await appendFile(REPORT_PATH, block);

    if (consecutiveSelectorFails >= 3) {
      console.log('  3 selector-fails — skipper resterende');
      break;
    }
  }

  // Summary
  const klare = results.filter((r) => r.score !== null && r.score >= 90);
  const trengerFix = results.filter((r) => r.score !== null && r.score < 90);
  const ukjent = results.filter((r) => r.score === null);

  const summary = `\n## Sammendrag

| Status | Antall | Skjermer |
|---|---|---|
| Klar (≥90) | ${klare.length} | ${klare.map((r) => `${r.id} (${r.score})`).join(', ') || '_ingen_'} |
| Trenger fix (<90) | ${trengerFix.length} | ${trengerFix.map((r) => `${r.id} (${r.score})`).join(', ') || '_ingen_'} |
| Ukjent | ${ukjent.length} | ${ukjent.map((r) => r.id).join(', ') || '_ingen_'} |

**Total:** ${results.length} skjermer evaluert.
`;
  await appendFile(REPORT_PATH, summary);

  console.log('\n════════════════════════════════════════════════════');
  console.log(` ${klare.length} klar · ${trengerFix.length} trenger fix · ${ukjent.length} ukjent`);
  console.log(` Rapport: ${REPORT_PATH}`);
  console.log('════════════════════════════════════════════════════');

  await browser.close().catch(() => {});
  process.exit(0);
}

main().catch((e) => {
  console.error('Uncaught:', e);
  process.exit(1);
});
