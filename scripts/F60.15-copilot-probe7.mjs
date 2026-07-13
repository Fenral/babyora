#!/usr/bin/env node
/**
 * Probe 7: dump every [role="article"] in chat with its author/text.
 */
import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9224');
let p = null;
for (const ctx of browser.contexts())
  for (const pg of ctx.pages())
    if (pg.url().includes('m365.cloud.microsoft/chat')) p = pg;

const articles = await p.evaluate(() => {
  const els = Array.from(document.querySelectorAll('[role="article"]'));
  return els.map((el, i) => ({
    i,
    ariaLabel: el.getAttribute('aria-label'),
    dataTid: el.getAttribute('data-tid'),
    text: (el.innerText || el.textContent || '').slice(0, 300),
  }));
});

console.log(JSON.stringify(articles, null, 2));
await browser.close();
