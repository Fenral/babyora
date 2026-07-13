#!/usr/bin/env node
/**
 * F60.15 — Copilot-loop
 * =====================
 * Tar screenshots av wool-app (11 skjermer) på iPhone-viewport, sender hver
 * screenshot + designkriterier til M365 Copilot via en åpen CDP-fane,
 * parser SCORE + 3 TILTAK fra responsen og logger til
 * docs/F60.15-copilot-loop.md.
 *
 * KJØRES SLIK:
 *   1. Start Chromium med --remote-debugging-port=9224 og åpne
 *      https://m365.cloud.microsoft/chat (logg inn manuelt).
 *   2. node scripts/F60.15-copilot-loop.mjs
 *
 * INGEN COMMIT — kjøres ad-hoc.
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
const SCREEN_FILTER = process.env.WOOL_SCREENS
  ? new Set(process.env.WOOL_SCREENS.split(',').map((s) => s.trim()))
  : null;
const MAX_WAIT_RESPONSE_MS = Number(process.env.WOOL_MAX_RESPONSE_MS ?? 180_000);
const POLL_INTERVAL_MS = 1500;
const SETTLE_AFTER_RESPONSE_MS = 4000;

const VIEWPORT = { width: 390, height: 844 };

// ── Skjerm-katalog ───────────────────────────────────────────────────────────

/**
 * @typedef {{
 *   id: string;
 *   label: string;
 *   navigate: (page: import('playwright').Page) => Promise<void>;
 * }} Screen
 */

async function gotoBase(page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page
    .waitForSelector('nav[aria-label="Hovednavigasjon"]', { timeout: 15000 })
    .catch(() => {});
}

async function tapTab(page, label) {
  const tab = page.getByRole('button', { name: new RegExp(label, 'i') }).first();
  await tab.click({ timeout: 5000 }).catch(async () => {
    await page
      .locator(`nav[aria-label="Hovednavigasjon"] button:has-text("${label}")`)
      .first()
      .click()
      .catch(() => {});
  });
  await page.waitForTimeout(600);
}

async function tapText(page, regex) {
  const el = page.getByText(regex).first();
  await el.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(600);
}

/** @type {Screen[]} */
const SCREENS = [
  {
    id: 'hjem',
    label: 'Hjem',
    navigate: async (page) => {
      await gotoBase(page);
      await tapTab(page, 'Hjem').catch(() => {});
    },
  },
  {
    id: 'paakledning',
    label: 'Påkledning (CTA)',
    navigate: async (page) => {
      await gotoBase(page);
      await tapTab(page, 'Hjem').catch(() => {});
      for (const label of ['Påkledning', 'Påkle', 'Kle på']) {
        const el = page.getByText(new RegExp(label, 'i')).first();
        if ((await el.count()) > 0) {
          await el.click().catch(() => {});
          break;
        }
      }
      await page.waitForTimeout(600);
    },
  },
  {
    id: 'uke',
    label: 'Uke',
    navigate: async (page) => {
      await gotoBase(page);
      await tapTab(page, 'Uke');
    },
  },
  {
    id: 'guide',
    label: 'Guide-hub',
    navigate: async (page) => {
      await gotoBase(page);
      await tapTab(page, 'Guide');
    },
  },
  {
    id: 'plaggbib',
    label: 'Plaggbibliotek (sub)',
    navigate: async (page) => {
      await gotoBase(page);
      await tapTab(page, 'Guide');
      await tapText(page, /plaggbib|plagg/i);
    },
  },
  {
    id: 'garderobe',
    label: 'Min garderobe (sub)',
    navigate: async (page) => {
      await gotoBase(page);
      await tapTab(page, 'Guide');
      await tapText(page, /garderobe/i);
    },
  },
  {
    id: 'tog',
    label: 'TOG-guide (sub)',
    navigate: async (page) => {
      await gotoBase(page);
      await tapTab(page, 'Guide');
      await tapText(page, /TOG|tog/);
    },
  },
  {
    id: 'varm-kald',
    label: 'Varm eller kald (sub)',
    navigate: async (page) => {
      await gotoBase(page);
      await tapTab(page, 'Guide');
      await tapText(page, /varm.*kald|kald.*varm/i).catch(async () => {
        // fallback: try from Hjem
        await tapTab(page, 'Hjem');
        await tapText(page, /varm.*kald|kald.*varm/i).catch(() => {});
      });
    },
  },
  {
    id: 'finn-antrekk',
    label: 'Finn antrekk (Guide → tap)',
    navigate: async (page) => {
      await gotoBase(page);
      await tapTab(page, 'Guide');
      await tapText(page, /finn.*antrekk|antrekk/i).catch(async () => {
        await tapTab(page, 'Hjem');
        await tapText(page, /finn.*antrekk|antrekk/i).catch(() => {});
      });
    },
  },
  {
    id: 'innstillinger',
    label: 'Innstillinger',
    navigate: async (page) => {
      await gotoBase(page);
      await tapTab(page, 'Innst');
    },
  },
  {
    id: 'onboarding',
    label: 'Onboarding',
    navigate: async (page) => {
      await page.goto(BASE_URL);
      await page.evaluate(() => {
        Object.keys(localStorage)
          .filter((k) => k.startsWith('babyora.') && k !== 'babyora.theme')
          .forEach((k) => localStorage.removeItem(k));
      });
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(900);
    },
  },
];

// ── Theme: dark ──────────────────────────────────────────────────────────────

async function setDark(page) {
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem(
      'babyora.theme',
      JSON.stringify({ state: { mode: 'dark' }, version: 0 }),
    );
  });
  await page.waitForTimeout(200);
}

// ── Copilot interaktion ──────────────────────────────────────────────────────

const INPUT_SELECTOR = '[contenteditable="true"][aria-label*="Copilot"]';
const SEND_BUTTON_SELECTOR = 'button[aria-label="Send"]';
const FILE_INPUT_SELECTOR = 'input#upload-file-button';

function promptFor(screen) {
  return `Vurder denne Babyora ${screen.label}-skjermen (norsk baby-påkledning-PWA, dark-mode aktivert).

Kriterier:
- Pixel-perfect mot V2-Skannbar-design-system (warm-grey + DM Serif + warm orange)
- Native iOS-feel (44px+ touch, spring-physics, safe-area)
- Glove-friendly (en hånd, mørk gang)
- PRODUCT.md prinsipp #1 «Recommendation IS the product»

Returner KUN formatet under, ingen annen tekst:
SCORE: NN/100
TILTAK 1: <konkret tiltak>
TILTAK 2: <konkret tiltak>
TILTAK 3: <konkret tiltak>`;
}

async function getCurrentMessageCount(page) {
  return page.evaluate(() => {
    // Copilot bruker fai-/data-tid varianter; vi prøver flere
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
    // Hent siste store tekstblokk fra Copilot — best effort.
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
    // Fallback: alle <p>/<div> med >100 tegn, returner den siste
    const all = Array.from(document.querySelectorAll('p, div'))
      .map((el) => (el.innerText || '').trim())
      .filter((t) => t.length > 60 && /SCORE|TILTAK|score|tiltak/i.test(t));
    return all.length ? all[all.length - 1] : '';
  });
}

async function isResponseStreaming(page) {
  return page.evaluate(() => {
    // Streaming indicator: typing-dot, stop-button, etc.
    const stop = document.querySelector('button[aria-label*="Stopp" i], button[aria-label*="Stop" i]');
    if (stop && stop.offsetParent !== null) return true;
    const typing = document.querySelector('[class*="typing"], [class*="streaming"], [class*="generating"]');
    if (typing && typing.offsetParent !== null) return true;
    return false;
  });
}

async function sendPromptWithImage(copilotPage, prompt, imagePath, log) {
  // 1) Focus input + clear any old text
  const input = copilotPage.locator(INPUT_SELECTOR).first();
  await input.scrollIntoViewIfNeeded().catch(() => {});
  await input.click({ timeout: 10_000 });
  await copilotPage.keyboard.press('Control+A').catch(() => {});
  await copilotPage.keyboard.press('Delete').catch(() => {});
  await copilotPage.waitForTimeout(150);

  // 2) Type the prompt
  // Bruk input.type med lav delay slik at Copilot ikke mister tegn
  await input.type(prompt, { delay: 8 });
  await copilotPage.waitForTimeout(400);

  // 3) Upload image via file input
  try {
    const fileInput = copilotPage.locator(FILE_INPUT_SELECTOR);
    await fileInput.setInputFiles(imagePath, { timeout: 15_000 });
    log(`    📎 Lastet opp: ${imagePath}`);
    // Vent til chip vises (Copilot indekserer bildet)
    await copilotPage.waitForTimeout(4000);
  } catch (e) {
    log(`    ⚠️  Bilde-upload feilet: ${e.message} — sender uten bilde`);
  }

  // 4) Hent baseline message count
  const baselineCount = await getCurrentMessageCount(copilotPage);

  // 5) Klikk Send
  const send = copilotPage.locator(SEND_BUTTON_SELECTOR).first();
  // Hvis send-knappen ikke er der, prøv Enter
  if ((await send.count()) === 0) {
    log('    ⚠️  Send-knapp ikke synlig, prøver Enter');
    await copilotPage.keyboard.press('Enter');
  } else {
    await send.click({ timeout: 10_000 });
  }
  log(`    ⏳ Venter på Copilot-respons...`);

  // 6) Vent på ny melding + at streaming stopper
  const start = Date.now();
  let newCount = baselineCount;
  let lastSeenText = '';
  let stableSince = 0;

  while (Date.now() - start < MAX_WAIT_RESPONSE_MS) {
    await copilotPage.waitForTimeout(POLL_INTERVAL_MS);

    newCount = await getCurrentMessageCount(copilotPage);
    const text = await getLastAssistantText(copilotPage);
    const streaming = await isResponseStreaming(copilotPage);

    if (newCount > baselineCount && text && /SCORE|TILTAK|score|tiltak/i.test(text)) {
      if (text === lastSeenText && !streaming) {
        if (!stableSince) stableSince = Date.now();
        if (Date.now() - stableSince > SETTLE_AFTER_RESPONSE_MS) {
          return text;
        }
      } else {
        stableSince = 0;
        lastSeenText = text;
      }
    } else if (newCount > baselineCount && text && !streaming) {
      // Response uten SCORE — kan være at modellen returnerte annet format
      if (text === lastSeenText) {
        if (!stableSince) stableSince = Date.now();
        if (Date.now() - stableSince > SETTLE_AFTER_RESPONSE_MS) {
          return text;
        }
      } else {
        stableSince = 0;
        lastSeenText = text;
      }
    }
  }

  // Timeout — returner det vi har
  return lastSeenText || '(timeout — ingen respons)';
}

function parseScoreAndTiltak(text) {
  const scoreMatch = text.match(/SCORE\s*[:：]\s*(\d{1,3})\s*\/?\s*100?/i);
  const score = scoreMatch ? Number(scoreMatch[1]) : null;
  const tiltak = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/TILTAK\s*\d?\s*[:：\-]\s*(.+)$/i);
    if (m) tiltak.push(m[1].trim());
  }
  // Fallback: ta hele blokken hvis ingen "TILTAK:" prefix
  if (tiltak.length === 0) {
    const candidates = lines
      .map((l) => l.trim())
      .filter((l) => l.length > 20 && !/^score/i.test(l));
    tiltak.push(...candidates.slice(0, 3));
  }
  return { score, tiltak: tiltak.slice(0, 3) };
}

// ── Main loop ────────────────────────────────────────────────────────────────

async function main() {
  await mkdir(SHOTS_DIR, { recursive: true });
  await mkdir(DOCS_DIR, { recursive: true });

  console.log('\n────────────────────────────────────────────────────');
  console.log(' F60.15 — Copilot-loop');
  console.log('────────────────────────────────────────────────────');
  console.log(` Base-URL : ${BASE_URL}`);
  console.log(` CDP      : ${CDP_URL}`);
  console.log(` Viewport : ${VIEWPORT.width}×${VIEWPORT.height}`);
  console.log(` Screens  : ${SCREEN_FILTER ? [...SCREEN_FILTER].join(', ') : 'alle 11'}`);
  console.log(` Report   : ${REPORT_PATH}`);
  console.log('');

  const browser = await chromium.connectOverCDP(CDP_URL);
  const contexts = browser.contexts();
  if (contexts.length === 0) {
    console.error('💥 Ingen contexts funnet på CDP — er Chromium åpen?');
    process.exit(2);
  }
  const ctx = contexts[0];

  // Finn Copilot-fanen
  let copilotPage = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('m365.cloud.microsoft/chat')) {
      copilotPage = p;
      break;
    }
  }
  if (!copilotPage) {
    console.error('💥 Copilot-fane ikke funnet (forventet m365.cloud.microsoft/chat)');
    process.exit(2);
  }
  console.log(`✅ Copilot-fane funnet: ${copilotPage.url()}`);

  // Lag en ny fane for wool-app i samme context
  const woolPage = await ctx.newPage();
  // iPhone-emulering via viewport + UA via CDP
  await woolPage.setViewportSize(VIEWPORT);
  // (Vi kan ikke endre UA/isMobile etter creation på en bestående context, men
  // wool-app er en responsive PWA og oppfører seg korrekt på 390×844)
  console.log(`✅ Wool-app-fane åpnet`);

  const screens = SCREEN_FILTER ? SCREENS.filter((s) => SCREEN_FILTER.has(s.id)) : SCREENS;

  // Init rapport
  const reportHeader = `# F60.15 Copilot-loop rapport

- **Generert:** ${new Date().toISOString()}
- **Base-URL:** ${BASE_URL}
- **Viewport:** ${VIEWPORT.width}×${VIEWPORT.height} (iPhone)
- **Theme:** dark
- **Antall skjermer:** ${screens.length}

## Per-skjerm-rangering

`;
  await writeFile(REPORT_PATH, reportHeader);

  const results = [];
  const log = (msg) => {
    console.log(msg);
  };

  for (const screen of screens) {
    console.log(`\n──── ${screen.id} (${screen.label}) ────`);
    let shotPath = '';
    let response = '';
    let parsed = { score: null, tiltak: [] };
    let error = null;

    try {
      // 1. Naviger wool-app
      await screen.navigate(woolPage);
      await setDark(woolPage);
      await woolPage.waitForTimeout(800);

      // 2. Screenshot
      shotPath = join(SHOTS_DIR, `F60.15-copilot-${screen.id}.png`);
      await woolPage.screenshot({ path: shotPath, fullPage: false });
      log(`  📸 ${shotPath}`);

      // 3. Bring Copilot to front, send prompt + image
      await copilotPage.bringToFront();
      await copilotPage.waitForTimeout(500);

      response = await sendPromptWithImage(copilotPage, promptFor(screen), shotPath, log);
      parsed = parseScoreAndTiltak(response);

      log(`  📊 SCORE: ${parsed.score ?? 'n/a'} — ${parsed.tiltak.length} tiltak`);
    } catch (e) {
      error = e.message;
      log(`  💥 Feil: ${e.message}`);
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

    // Append til rapport per skjerm (for safety hvis script crashes)
    const block = `### ${screen.id} — ${screen.label}

- **Screenshot:** \`${shotPath.replace(REPO_ROOT.replace(/\\/g, '/'), '').replace(/^[\\/]/, '')}\`
- **SCORE:** ${parsed.score !== null ? `${parsed.score}/100` : 'n/a'}
${error ? `- **Feil:** ${error}\n` : ''}
**Topp 3 tiltak:**
${parsed.tiltak.length > 0 ? parsed.tiltak.map((t, i) => `${i + 1}. ${t}`).join('\n') : '_(ingen tiltak parset)_'}

<details><summary>Rå Copilot-respons</summary>

\`\`\`
${(response || '').slice(0, 2000)}
\`\`\`

</details>

`;
    await appendFile(REPORT_PATH, block);
  }

  // Sammendrag
  const klare = results.filter((r) => r.score !== null && r.score >= 90);
  const trengerFix = results.filter((r) => r.score !== null && r.score < 90);
  const ukjent = results.filter((r) => r.score === null);

  const summary = `\n## Sammendrag

| Status | Antall | Skjermer |
|---|---|---|
| ✅ Klar (≥90) | ${klare.length} | ${klare.map((r) => r.id).join(', ') || '_(ingen)_'} |
| 🛠 Trenger fix (<90) | ${trengerFix.length} | ${trengerFix.map((r) => `${r.id} (${r.score})`).join(', ') || '_(ingen)_'} |
| ❓ Ukjent (ingen score parset) | ${ukjent.length} | ${ukjent.map((r) => r.id).join(', ') || '_(ingen)_'} |

**Total:** ${results.length} skjermer evaluert.
`;
  await appendFile(REPORT_PATH, summary);

  console.log('\n════════════════════════════════════════════════════');
  console.log(` RESULTAT: ${klare.length} klare · ${trengerFix.length} trenger fix · ${ukjent.length} ukjent`);
  console.log('════════════════════════════════════════════════════');
  console.log(`📄 Rapport: ${REPORT_PATH}`);

  // Vi disconnecter, ikke close (browseren tilhører Sivert)
  await browser.close().catch(() => {});
  process.exit(0);
}

main().catch((e) => {
  console.error('💥 Uncaught:', e);
  process.exit(1);
});
