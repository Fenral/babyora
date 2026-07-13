#!/usr/bin/env node
import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9224');
let copilotPage = null;
for (const ctx of browser.contexts()) {
  for (const p of ctx.pages()) {
    if (p.url().includes('m365.cloud.microsoft/chat')) copilotPage = p;
  }
}

const info = await copilotPage.evaluate(() => {
  // Find the input
  const input = document.querySelector('[contenteditable="true"][aria-label*="Copilot"]');
  if (!input) return { error: 'no input' };

  // Walk up to find the composer container
  let composer = input;
  for (let i = 0; i < 10; i++) {
    composer = composer.parentElement;
    if (!composer) break;
    // The composer typically has multiple buttons inside
    const btns = composer.querySelectorAll('button');
    if (btns.length >= 2) {
      return {
        composerTag: composer.tagName,
        composerClass: composer.className.slice(0, 100),
        depth: i,
        buttonsInComposer: Array.from(btns).map((b) => ({
          ariaLabel: b.getAttribute('aria-label'),
          title: b.getAttribute('title'),
          dataId: b.getAttribute('data-id'),
          dataTestid: b.getAttribute('data-testid'),
          text: (b.textContent || '').trim().slice(0, 40),
          disabled: b.disabled,
        })),
        fileInputsInComposer: Array.from(composer.querySelectorAll('input[type="file"]')).map((f) => ({
          ariaLabel: f.getAttribute('aria-label'),
          accept: f.accept,
        })),
      };
    }
  }
  return { error: 'no composer with buttons found' };
});

console.log(JSON.stringify(info, null, 2));

// Also check at the document level for any hidden file inputs
const allFileInputs = await copilotPage.$$eval('input[type="file"]', (els) =>
  els.map((f) => ({
    ariaLabel: f.getAttribute('aria-label'),
    accept: f.accept,
    name: f.name,
    id: f.id,
    multiple: f.multiple,
  })),
);
console.log('\nAll file inputs in doc:', JSON.stringify(allFileInputs, null, 2));

await browser.close();
