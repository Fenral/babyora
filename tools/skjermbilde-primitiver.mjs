/**
 * skjermbilde-primitiver.mjs — bilder av det fase 2B faktisk bygget.
 *
 * Tre grupper, og skillet mellom dem er med vilje:
 *
 *   1. EKTE I APPEN NÅ  — Familie-skjermens verktøyrader (SettingsRow) og
 *      den globale fokusringen. Begge rendres i den kjørende appen.
 *   2. FØR/ETTER         — fokusringen med og uten den nye globale regelen,
 *      tatt på samme knapp i samme tilstand.
 *   3. IKKE KOBLET INN   — Button og Sheet. De finnes og er portet, men
 *      ingen skjerm bruker dem ennå; det er fase 3. Bildene er derfor
 *      merket, så de ikke leses som «slik ser appen ut nå».
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { mkdirSync, readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const VITE = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');
const UT = 'tools/primitiv-skjermbilder';
mkdirSync(UT, { recursive: true });

async function ledigPort() {
  const net = await import('node:net');
  return new Promise((res) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); });
  });
}

const PORT = await ledigPort();
const BASE = `http://localhost:${PORT}`;
const server = spawn(process.execPath, [VITE, 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 80; i += 1) {
  try { if ((await fetch(BASE)).ok) break; } catch { /* ikke oppe */ }
  await new Promise((r) => setTimeout(r, 300));
}

const { forecastPartlyCloudy1C } = await import('../e2e/fixtures/forecast-1c-partlycloudy.js');
const browser = await chromium.launch();

async function side(tema = 'dark') {
  const p = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, colorScheme: tema });
  await p.route('**/api/forecast*', (r) => r.fulfill({
    contentType: 'application/json', body: JSON.stringify(forecastPartlyCloudy1C()) }));
  await p.goto(`${BASE}/?seed=demo`, { waitUntil: 'domcontentloaded' });
  await p.addStyleTag({ content: '.hjem-monter{padding-top:71px !important}' });
  await p.waitForTimeout(2400);
  return p;
}

/** Naviger til Familie-fanen via tabbaren, slik en bruker ville gjort. */
async function tilFamilie(p) {
  const fane = p.locator('nav button, [class*="tab"] button').filter({ hasText: /Familie/iu }).first();
  if (await fane.count() === 0) return false;
  await fane.click();
  await p.waitForTimeout(700);
  return true;
}

const rapport = [];

/* ── 1. RADENE, EKTE I APPEN ─────────────────────────────────────────── */
for (const tema of ['dark', 'light']) {
  const p = await side(tema);
  const ok = await tilFamilie(p);
  if (ok) {
    const seksjon = p.locator('[aria-labelledby="sec-verktoy"]');
    if (await seksjon.count() > 0) {
      await seksjon.evaluate((el) => el.scrollIntoView({ block: 'center' }));
      await p.waitForTimeout(300);
      await seksjon.screenshot({ path: `${UT}/rader-${tema}.png` });
      rapport.push(`rader-${tema}.png — verktøyradene (SettingsRow), ekte i appen`);
    } else {
      rapport.push(`rader-${tema}: fant ikke verktøyseksjonen`);
    }
  } else {
    rapport.push(`rader-${tema}: kom ikke til Familie-fanen`);
  }
  await p.close();
}

/* ── 2. FOKUSRINGEN, FØR OG ETTER ────────────────────────────────────
   MÅ tas på en knapp som IKKE hadde ring fra før. Første forsøk brukte
   Hjem-skjermens CTA — men den ligger inne i `.hjem-monter`, som har hatt
   sin egen scopede ring hele tiden. Bildet viste altså den gamle regelen og
   beviste ingenting. Verktøyradene på Familie ligger utenfor det scopet, og
   er blant de flatene som faktisk sto uten ring. */
for (const [navn, slaAv] of [['etter', false], ['for', true]]) {
  const p = await side('dark');
  if (slaAv) {
    await p.addStyleTag({ content: `
      :where(button, [role='button'], a[href], summary, select, input, textarea,
             [tabindex]:not([tabindex='-1'])):focus-visible {
        outline: revert !important; outline-offset: revert !important;
      }` });
  }
  const ok = await tilFamilie(p);
  const rad = p.locator('[aria-labelledby="sec-verktoy"] button').first();
  if (ok && await rad.count() > 0) {
    await rad.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await p.waitForTimeout(200);
    /* :focus-visible krever tastaturheuristikk — et ekte Tab-trykk gir den. */
    await rad.evaluate((el) => el.focus());
    await p.keyboard.press('Shift+Tab');
    await p.keyboard.press('Tab');
    await p.waitForTimeout(250);
    const b = await rad.boundingBox();
    await p.screenshot({
      path: `${UT}/fokusring-${navn}.png`,
      /* Ringen ligger 3 px UTENFOR kanten, og raden er full bredde — et
         stramt utsnitt klipper den vekk. 30 px luft rundt.  */
      clip: {
        x: Math.max(0, b.x - 30),
        y: Math.max(0, b.y - 30),
        width: Math.min(860 - Math.max(0, b.x - 30), b.width + 60),
        height: b.height + 60,
      },
    });
    rapport.push(`fokusring-${navn}.png — verktøyrad ${slaAv ? 'UTEN' : 'MED'} den nye globale regelen`);
  } else {
    rapport.push(`fokusring-${navn}: fant ikke verktøyraden`);
  }
  await p.close();
}

/* ── 3. KNAPP OG ARK — IKKE KOBLET INN, MERKET SOM SÅDAN ─────────────── */
{
  const p = await side('dark');
  /* FUNN 2026-08-05: stilarket til Button er IKKE i appens bygg. Komponenten
     har ingen levende bruker (MaterialPreferenceSheet har null kallsteder),
     saa byggeverktoeyet fjerner bade komponenten og CSS-en. Uten dette
     injiseringen ble alle knappene GRAA — nettleserens standardknapp.
     Fase 3 gir primitiven ekte forbrukere; da bundles den av seg selv. */
  await p.addStyleTag({ content: readFileSync('src/components/controls/button.css', 'utf8') });
  await p.evaluate(() => {
    const v = document.createElement('div');
    v.id = 'primitiv-visning';
    v.style.cssText = 'position:fixed;inset:0;z-index:99999;background:var(--dw-canvas);'
      + 'padding:28px 20px;display:flex;flex-direction:column;gap:18px;font-family:var(--dw-font-ui)';
    v.innerHTML = `
      <div style="font:600 11px/1 system-ui;letter-spacing:1.6px;text-transform:uppercase;
                  color:var(--dw-ink-low)">Ikke koblet inn i noen skjerm ennå</div>
      <button class="dw-btn dw-btn--primary dw-btn--cta dw-btn--full">Finn dagens antrekk</button>
      <button class="dw-btn dw-btn--ghost dw-btn--cta dw-btn--full">Ikke nå</button>
      <button class="dw-btn dw-btn--destructive dw-btn--compact">Slett barnet</button>
      <button class="dw-btn dw-btn--primary dw-btn--cta dw-btn--full" disabled>Deaktivert</button>
      <button class="dw-btn dw-btn--primary dw-btn--cta dw-btn--full" aria-busy="true">Lagrer</button>
      <button class="dw-btn dw-btn--quiet dw-btn--compact">Stille knapp</button>`;
    document.body.appendChild(v);
  });
  await p.waitForTimeout(400);
  await p.locator('#primitiv-visning').screenshot({ path: `${UT}/knapp-varianter.png` });
  rapport.push('knapp-varianter.png — Button, alle varianter og tilstander (IKKE i appen ennå)');
  await p.close();
}

await browser.close();
server.kill();
console.log(`\n── skrev til ${UT} ──`);
for (const r of rapport) console.log(`  ${r}`);
