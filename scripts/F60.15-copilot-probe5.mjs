#!/usr/bin/env node
/**
 * Probe 5: bypass Lexical .type() by using execCommand + InputEvent.
 * Goal: prove we can put text into the contenteditable and enable the send button.
 */
import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9224');
let copilotPage = null;
for (const ctx of browser.contexts()) {
  for (const p of ctx.pages()) {
    if (p.url().includes('m365.cloud.microsoft/chat')) copilotPage = p;
  }
}
if (!copilotPage) {
  console.error('No copilot tab');
  process.exit(1);
}
await copilotPage.bringToFront();

const result = await copilotPage.evaluate(async () => {
  const input = document.querySelector('[contenteditable="true"][aria-label*="Copilot"]');
  if (!input) return { error: 'no input' };
  input.focus();
  // Try execCommand insertText (works in Lexical, FB editors, Slate)
  document.execCommand('insertText', false, 'PROBE TEST 12345');
  await new Promise((r) => setTimeout(r, 400));
  const textAfter = (input.textContent || '').trim();
  // Find send button
  const btns = Array.from(document.querySelectorAll('button'));
  const sends = btns
    .filter((b) => b.offsetParent !== null)
    .map((b) => ({
      ariaLabel: b.getAttribute('aria-label'),
      title: b.getAttribute('title'),
      dataTestid: b.getAttribute('data-testid'),
      disabled: b.disabled,
    }))
    .filter((b) => {
      const al = (b.ariaLabel || '').toLowerCase();
      const tl = (b.title || '').toLowerCase();
      const dt = (b.dataTestid || '').toLowerCase();
      return al.includes('send') || tl.includes('send') || dt.includes('send') || al.includes('still');
    });
  return { textAfter, sends };
});

console.log(JSON.stringify(result, null, 2));

// Clean up: clear the input
await copilotPage.evaluate(async () => {
  const input = document.querySelector('[contenteditable="true"][aria-label*="Copilot"]');
  if (!input) return;
  input.focus();
  document.execCommand('selectAll', false, null);
  document.execCommand('delete', false, null);
});

await browser.close();
