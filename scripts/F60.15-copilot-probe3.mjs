#!/usr/bin/env node
import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9224');
let copilotPage = null;
for (const ctx of browser.contexts()) {
  for (const p of ctx.pages()) {
    if (p.url().includes('m365.cloud.microsoft/chat')) copilotPage = p;
  }
}

// Find send button by searching all visible buttons with aria-label matching "send" or "submit"
const info = await copilotPage.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const visible = btns.filter((b) => b.offsetParent !== null);
  const sendCandidates = visible.filter((b) => {
    const al = (b.getAttribute('aria-label') || '').toLowerCase();
    const tl = (b.getAttribute('title') || '').toLowerCase();
    const dt = (b.getAttribute('data-testid') || '').toLowerCase();
    return al.includes('send') || tl.includes('send') || dt.includes('send') ||
           al.includes('submit') || al.includes('still') || al.includes('still en');
  });
  return sendCandidates.map((b) => ({
    ariaLabel: b.getAttribute('aria-label'),
    title: b.getAttribute('title'),
    dataTestid: b.getAttribute('data-testid'),
    text: (b.textContent || '').trim().slice(0, 40),
    disabled: b.disabled,
  }));
});
console.log('Send candidates:', JSON.stringify(info, null, 2));

// Also: check the typical structure of a message in the chat (so we can poll for new responses)
const msgInfo = await copilotPage.evaluate(() => {
  // Various selectors Microsoft uses
  const candidates = [
    '[data-tid="chat-pane-message"]',
    '[data-tid="messageEntity"]',
    '[role="listitem"]',
    '[data-testid="messageBubble"]',
    '.ms-ChatItem',
    '[class*="messageBubble"]',
    '[class*="ChatMessage"]',
    '[class*="responseMessage"]',
  ];
  const results = {};
  for (const sel of candidates) {
    results[sel] = document.querySelectorAll(sel).length;
  }
  return results;
});
console.log('\nMessage selectors:', JSON.stringify(msgInfo, null, 2));

await browser.close();
