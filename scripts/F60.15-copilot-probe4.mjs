#!/usr/bin/env node
import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9224');
let copilotPage = null;
for (const ctx of browser.contexts()) {
  for (const p of ctx.pages()) {
    if (p.url().includes('m365.cloud.microsoft/chat')) copilotPage = p;
  }
}

// Focus input + type a char to make send-button appear
const input = copilotPage.locator('[contenteditable="true"][aria-label*="Copilot"]').first();
await input.click();
await input.type('test');
await copilotPage.waitForTimeout(500);

const sendInfo = await copilotPage.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const visible = btns.filter((b) => b.offsetParent !== null);
  return visible
    .map((b) => ({
      ariaLabel: b.getAttribute('aria-label'),
      dataTestid: b.getAttribute('data-testid'),
      text: (b.textContent || '').trim().slice(0, 30),
      disabled: b.disabled,
    }))
    .filter((b) => {
      const al = (b.ariaLabel || '').toLowerCase();
      const dt = (b.dataTestid || '').toLowerCase();
      return al.includes('send') || al.includes('still') || dt.includes('send') || dt.includes('submit');
    });
});
console.log('Send candidates (after typing):', JSON.stringify(sendInfo, null, 2));

// Clear input
await input.click();
await copilotPage.keyboard.press('Control+A');
await copilotPage.keyboard.press('Delete');

await browser.close();
