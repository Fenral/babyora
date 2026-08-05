// ChatGPT-driver: holder et vedvarende, synlig Chromium-vindu åpent og
// utfører kommandoer lagt som JSON-filer i cmds/. Resultat skrives til results/.
// Protokoll: cmds/<id>.json  ->  results/<id>.json  (ferdigbehandlet cmd slettes)
// Kommandoer:
//   {action:'goto', url}
//   {action:'read', limit?}          -> siste meldinger [{role, text}]
//   {action:'send', text}            -> sender og venter på komplett svar, returnerer det
//   {action:'screenshot'}            -> {file}
//   {action:'eval', script}          -> {value} (page.evaluate)
//   {action:'stop'}                  -> lukker nettleser og avslutter daemonen
import { createRequire } from 'node:module';
import { mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire('C:/Users/siver/Downloads/trainer-marketplace-master1/babyora/package.json');
const { chromium } = require('playwright');

const BASE = dirname(fileURLToPath(import.meta.url));
const CMDS = join(BASE, 'cmds');
const RESULTS = join(BASE, 'results');
const PROFILE = join(BASE, 'profile');
for (const d of [CMDS, RESULTS, PROFILE]) mkdirSync(d, { recursive: true });

const context = await chromium.launchPersistentContext(PROFILE, {
  headless: false,
  viewport: { width: 1280, height: 900 },
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = context.pages()[0] ?? await context.newPage();
await page.goto('https://chatgpt.com/');
writeFileSync(join(BASE, 'daemon-ready.txt'), String(Date.now()));
console.log('daemon ready');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function readMessages(limit = 6) {
  return page.evaluate((lim) => {
    const nodes = [...document.querySelectorAll('[data-message-author-role]')];
    return nodes.slice(-lim).map((n) => ({
      role: n.getAttribute('data-message-author-role'),
      text: n.innerText.trim(),
    }));
  }, limit);
}

async function isGenerating() {
  return page.evaluate(() =>
    !!document.querySelector('button[data-testid="stop-button"], [data-testid="composer-moderation-stop-button"]')
  );
}

async function waitForReply(prevCount, timeoutMs = 300000) {
  const t0 = Date.now();
  // Vent til et nytt assistentsvar finnes og genereringen har stoppet, og teksten er stabil.
  let stableText = '';
  let stableSince = 0;
  while (Date.now() - t0 < timeoutMs) {
    await sleep(1200);
    const msgs = await readMessages(30);
    const assistants = msgs.filter((m) => m.role === 'assistant');
    const generating = await isGenerating();
    if (assistants.length > prevCount && !generating) {
      const last = assistants[assistants.length - 1].text;
      if (last === stableText && Date.now() - stableSince > 2500) return last;
      if (last !== stableText) { stableText = last; stableSince = Date.now(); }
    }
  }
  throw new Error('timeout waiting for reply');
}

async function handle(cmd) {
  switch (cmd.action) {
    case 'goto': {
      await page.goto(cmd.url, { waitUntil: 'domcontentloaded' });
      await sleep(2000);
      return { ok: true, url: page.url(), title: await page.title() };
    }
    case 'read': {
      return { ok: true, url: page.url(), messages: await readMessages(cmd.limit ?? 6) };
    }
    case 'send': {
      const before = (await readMessages(50)).filter((m) => m.role === 'assistant').length;
      const composer = page.locator('#prompt-textarea, [data-testid="composer"] [contenteditable="true"]').first();
      await composer.click();
      // Lim inn via clipboard-API-fri metode: fyll contenteditable direkte
      await composer.evaluate((el, text) => {
        el.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, text);
      }, cmd.text);
      await sleep(400);
      const sendBtn = page.locator('button[data-testid="send-button"], #composer-submit-button').first();
      await sendBtn.click();
      const reply = await waitForReply(before, cmd.timeoutMs ?? 300000);
      return { ok: true, reply };
    }
    case 'click': {
      let loc = page.locator(cmd.selector);
      if (cmd.text) loc = loc.filter({ hasText: cmd.text });
      await loc.first().click({ timeout: cmd.timeoutMs ?? 8000 });
      await sleep(cmd.waitMs ?? 1200);
      return { ok: true };
    }
    case 'press': {
      await page.keyboard.press(cmd.key);
      await sleep(600);
      return { ok: true };
    }
    case 'attach': {
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(cmd.files);
      await sleep(cmd.waitMs ?? 6000); // gi opplastingen tid før send
      return { ok: true, attached: cmd.files.length };
    }
    case 'screenshot': {
      const file = join(BASE, `shot-${Date.now()}.png`);
      await page.screenshot({ path: file, fullPage: false });
      return { ok: true, file };
    }
    case 'eval': {
      const value = await page.evaluate(cmd.script);
      return { ok: true, value };
    }
    case 'stop': {
      setTimeout(async () => { await context.close(); process.exit(0); }, 500);
      return { ok: true, stopping: true };
    }
    default:
      return { ok: false, error: 'unknown action' };
  }
}

for (;;) {
  await sleep(500);
  let files;
  try { files = readdirSync(CMDS).filter((f) => f.endsWith('.json')).sort(); } catch { continue; }
  for (const f of files) {
    const path = join(CMDS, f);
    let cmd;
    try { cmd = JSON.parse(readFileSync(path, 'utf8')); } catch { continue; } // kan være halvskrevet — prøv neste runde
    rmSync(path);
    let result;
    try { result = await handle(cmd); } catch (e) { result = { ok: false, error: String(e) }; }
    writeFileSync(join(RESULTS, f), JSON.stringify(result, null, 2));
    console.log(f, '->', result.ok ? 'ok' : result.error);
  }
}
