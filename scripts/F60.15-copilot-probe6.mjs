#!/usr/bin/env node
/**
 * Probe 6: inspect actual message DOM in Copilot after our prompts have been sent.
 * Loops should have left 5 prompts + 5 responses in the chat.
 */
import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9224');
let copilotPage = null;
for (const ctx of browser.contexts()) {
  for (const p of ctx.pages()) {
    if (p.url().includes('m365.cloud.microsoft/chat')) copilotPage = p;
  }
}
if (!copilotPage) { console.error('no'); process.exit(1); }
await copilotPage.bringToFront();

const info = await copilotPage.evaluate(() => {
  // Try a wide range of selectors and report counts + sample text
  const sels = [
    '[data-tid="chat-pane-message"]',
    '[data-tid="messageEntity"]',
    '[data-testid="messageBubble"]',
    '[class*="messageBubble"]',
    '[class*="ChatMessage"]',
    '[role="article"]',
    '[role="listitem"]',
    '[data-author-role]',
    '[data-tid="message"]',
    '[data-content-type="message"]',
    '.chat-message',
  ];
  const result = {};
  for (const sel of sels) {
    const els = document.querySelectorAll(sel);
    if (els.length > 0) {
      const last = els[els.length - 1];
      result[sel] = {
        count: els.length,
        lastText: (last.innerText || last.textContent || '').slice(0, 200),
      };
    }
  }
  // Also: search for any element containing "SCORE" text
  const allWithScore = Array.from(document.querySelectorAll('*'))
    .filter((el) => {
      const t = (el.textContent || '').slice(0, 500);
      return /SCORE\s*:\s*\d/.test(t) && el.children.length < 30;
    })
    .slice(0, 5)
    .map((el) => ({
      tag: el.tagName,
      class: (el.className || '').toString().slice(0, 80),
      dataTid: el.getAttribute('data-tid'),
      dataTestid: el.getAttribute('data-testid'),
      role: el.getAttribute('role'),
      text: (el.textContent || '').slice(0, 300),
    }));
  return { selectorHits: result, elementsWithScore: allWithScore };
});

console.log(JSON.stringify(info, null, 2));
await browser.close();
