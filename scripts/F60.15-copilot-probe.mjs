#!/usr/bin/env node
/**
 * Probe Copilot DOM to figure out chat input + send button + upload button.
 * Run: node scripts/F60.15-copilot-probe.mjs
 */
import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9224');
const contexts = browser.contexts();
console.log('Contexts:', contexts.length);

let copilotPage = null;
for (const ctx of contexts) {
  for (const p of ctx.pages()) {
    const url = p.url();
    console.log('  page:', url);
    if (url.includes('m365.cloud.microsoft/chat')) {
      copilotPage = p;
    }
  }
}

if (!copilotPage) {
  console.error('Copilot tab not found');
  process.exit(1);
}

console.log('\n=== Probing Copilot DOM ===');

const info = await copilotPage.evaluate(() => {
  const findInput = () => {
    // Textareas
    const tas = Array.from(document.querySelectorAll('textarea'));
    // Contenteditable
    const ces = Array.from(document.querySelectorAll('[contenteditable="true"]'));
    return {
      textareas: tas.map((t) => ({
        id: t.id,
        name: t.name,
        placeholder: t.placeholder,
        ariaLabel: t.getAttribute('aria-label'),
        role: t.getAttribute('role'),
        visible: t.offsetParent !== null,
      })),
      contenteditables: ces.map((c) => ({
        ariaLabel: c.getAttribute('aria-label'),
        role: c.getAttribute('role'),
        dataId: c.getAttribute('data-id'),
        placeholder: c.getAttribute('data-placeholder'),
        visible: c.offsetParent !== null,
        text: (c.textContent || '').slice(0, 50),
      })),
    };
  };

  const findButtons = () => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns
      .filter((b) => b.offsetParent !== null)
      .map((b) => ({
        ariaLabel: b.getAttribute('aria-label'),
        title: b.getAttribute('title'),
        dataId: b.getAttribute('data-id'),
        text: (b.textContent || '').trim().slice(0, 40),
      }))
      .filter((b) => b.ariaLabel || b.title || b.text);
  };

  const findFileInputs = () => {
    const fis = Array.from(document.querySelectorAll('input[type="file"]'));
    return fis.map((f) => ({
      ariaLabel: f.getAttribute('aria-label'),
      accept: f.accept,
      multiple: f.multiple,
      visible: f.offsetParent !== null,
    }));
  };

  return {
    inputs: findInput(),
    buttons: findButtons().slice(0, 40),
    fileInputs: findFileInputs(),
    url: window.location.href,
  };
});

console.log(JSON.stringify(info, null, 2));
await browser.close();
