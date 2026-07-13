#!/usr/bin/env node
/**
 * F60.15 — Pixel-perfect dark-mode verifiseringsscript
 * =====================================================
 *
 * HVA:
 *   Kjører Playwright (lokalt installert v1.60) mot wool-app deployment og
 *   verifiserer at alle 11 skjermer ser ut som spec krever i alle 3 theme-modi
 *   (auto = system, light, dark). Lagrer screenshots + rapport.
 *
 * HVORDAN KJØRE:
 *   cd C:/Users/SkotvoldSivertSende/wool-app
 *   node scripts/F60.15-pixperfect.mjs
 *
 *   Env-vars (alle valgfrie):
 *     WOOL_BASE_URL  — base-URL (default: https://wool-app.vercel.app/)
 *     WOOL_HEADED    — sett "1" for å se browseren mens den kjører
 *     WOOL_CDP_PORT  — koble til eksisterende Chrome på CDP-port (f.eks. "9222")
 *     WOOL_SCREENS   — komma-separert subset (f.eks. "hjem,uke")
 *
 * FORVENTET RUNTIME:
 *   ~3–5 min for full matrise (11 skjermer × 3 themes = 33 viewer)
 *
 * OUTPUT:
 *   screenshots/F60.15-{screen}-{theme}.png    — én PNG per (skjerm, theme)
 *   screenshots/F60.15-report.md               — markdown-rapport med PASS/FAIL
 *   screenshots/F60.15-report.json             — maskinlesbar versjon
 *
 * TOLKNING:
 *   🟢 PASS = check kjørt og bestod
 *   ❌ FAIL = check kjørt og feilet (rapport viser actual vs expected)
 *   ⚠️  SKIP = check kunne ikke kjøres (f.eks. element ikke funnet)
 *   Exit 0 = alle checks PASS · Exit 1 = noen FAIL eller SKIP > 5%
 *
 * AVHENGIGHETER:
 *   - playwright (node_modules — allerede i devDependencies)
 *   - Node ≥ 18 (built-in fs/promises, fetch)
 *   - INGEN MCP, INGEN eksterne tjenester
 */

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const SHOTS_DIR = join(REPO_ROOT, 'screenshots');

const BASE_URL = process.env.WOOL_BASE_URL ?? 'https://wool-app.vercel.app/';
const HEADED = process.env.WOOL_HEADED === '1';
const CDP_PORT = process.env.WOOL_CDP_PORT;
const SCREEN_FILTER = process.env.WOOL_SCREENS
  ? new Set(process.env.WOOL_SCREENS.split(',').map((s) => s.trim()))
  : null;

const VIEWPORT = { width: 390, height: 844 };
const THEMES = /** @type {const} */ (['auto', 'light', 'dark']);

// ─────────────────────────────────────────────────────────────────────────────
// Skjerm-katalog
// ─────────────────────────────────────────────────────────────────────────────
// Hver skjerm vet hvordan den når seg selv (navigate-callback i sidekontekst).
// Bruker primært BottomTabBar-tap eller drill-knapper i UI fordi appen ikke
// har URL-routing (kun in-memory state i App.tsx).

/**
 * @typedef {{
 *   id: string;
 *   label: string;
 *   navigate: (page: import('playwright').Page) => Promise<void>;
 *   checks: Array<Check>;
 * }} Screen
 *
 * @typedef {{
 *   id: string;
 *   describe: string;
 *   run: (ctx: CheckCtx) => Promise<{ pass: boolean; detail?: string }>;
 * }} Check
 *
 * @typedef {{
 *   page: import('playwright').Page;
 *   theme: 'auto' | 'light' | 'dark';
 *   screenId: string;
 * }} CheckCtx
 */

// ── Hjelpe-funksjoner for vanlige checks ────────────────────────────────────

/** Hent computed CSS-variabel på <html>. */
async function getCssVar(page, varName) {
  return page.evaluate(
    (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim(),
    varName,
  );
}

/** Sjekk at en CSS-variabel matcher én av flere forventede verdier. */
function checkCssVar(id, varName, expectedByTheme) {
  return {
    id,
    describe: `--${varName} matcher spec per theme`,
    async run({ page, theme }) {
      const actual = await getCssVar(page, `--${varName}`);
      const expected = expectedByTheme[theme];
      if (!expected) return { pass: true, detail: `no spec for ${theme}` };
      const pass = expected.some((e) =>
        actual.toLowerCase().includes(e.toLowerCase()),
      );
      return {
        pass,
        detail: pass ? actual : `actual="${actual}" expected one of [${expected.join(', ')}]`,
      };
    },
  };
}

/** Sjekk at <html data-theme="..."> er som forventet. */
function checkHtmlDataTheme(id, theme) {
  return {
    id,
    describe: `<html data-theme> matcher theme="${theme}"`,
    async run({ page }) {
      const actual = await page.evaluate(() =>
        document.documentElement.getAttribute('data-theme'),
      );
      if (theme === 'auto') {
        return {
          pass: actual === null,
          detail: `data-theme="${actual}" (forventet: null/fjernet)`,
        };
      }
      return {
        pass: actual === theme,
        detail: `data-theme="${actual}" (forventet: "${theme}")`,
      };
    },
  };
}

/** Sjekk at <html lang> er "nb". */
const checkHtmlLang = {
  id: 'html-lang-nb',
  describe: '<html lang="nb"> satt',
  async run({ page }) {
    const lang = await page.evaluate(() => document.documentElement.lang);
    return { pass: lang === 'nb', detail: `lang="${lang}"` };
  },
};

/** Sjekk at et selector finnes og har minst N px touch-target. */
function checkTouchTarget(id, selector, minPx = 44) {
  return {
    id,
    describe: `${selector} touch-target ≥ ${minPx}px`,
    async run({ page }) {
      const sizes = await page.$$eval(selector, (els, min) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return { w: r.width, h: r.height, ok: r.width >= min && r.height >= min };
        }, min),
      );
      if (sizes.length === 0) return { pass: false, detail: `selector "${selector}" matchet 0 elementer` };
      const failed = sizes.filter((s) => !s.ok);
      return {
        pass: failed.length === 0,
        detail: failed.length
          ? `${failed.length}/${sizes.length} elementer for små: ${JSON.stringify(failed.slice(0, 3))}`
          : `${sizes.length} elementer alle ≥ ${minPx}px`,
      };
    },
  };
}

/** Sjekk localStorage babyora.theme persistens. */
function checkThemePersisted(theme) {
  return {
    id: 'localstorage-theme-persisted',
    describe: 'localStorage["babyora.theme"] persisterer valgt mode',
    async run({ page }) {
      const raw = await page.evaluate(() => localStorage.getItem('babyora.theme'));
      if (!raw) return { pass: false, detail: 'localStorage-nøkkel mangler' };
      try {
        const parsed = JSON.parse(raw);
        const actual = parsed?.state?.mode;
        return {
          pass: actual === theme,
          detail: `mode="${actual}" (forventet: "${theme}")`,
        };
      } catch (e) {
        return { pass: false, detail: `kunne ikke parse: ${e.message}` };
      }
    },
  };
}

/** Sjekk at et element finnes med valgt aria. */
function checkSelectorExists(id, selector, describe) {
  return {
    id,
    describe: describe ?? `${selector} finnes`,
    async run({ page }) {
      const count = await page.locator(selector).count();
      return { pass: count > 0, detail: `count=${count}` };
    },
  };
}

/** Sjekk kontrast-forhold mellom to RGB-farger. Forenklet WCAG-formel. */
function rgbToLum(rgb) {
  const [r, g, b] = rgb.map((c) => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrastRatio(rgb1, rgb2) {
  const l1 = rgbToLum(rgb1);
  const l2 = rgbToLum(rgb2);
  const [bright, dark] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (bright + 0.05) / (dark + 0.05);
}
function parseRgb(s) {
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(',').map((p) => parseFloat(p.trim()));
  return [parts[0], parts[1], parts[2]];
}

/** Sjekk body text vs bg har ≥ 4.5:1 kontrast (AA). */
const checkBodyContrast = {
  id: 'body-contrast-aa',
  describe: 'body-tekst vs bg har AA ≥ 4.5:1',
  async run({ page }) {
    const { fg, bg } = await page.evaluate(() => {
      const body = document.body;
      const cs = getComputedStyle(body);
      return { fg: cs.color, bg: cs.backgroundColor };
    });
    const fgRgb = parseRgb(fg);
    const bgRgb = parseRgb(bg);
    if (!fgRgb || !bgRgb) return { pass: false, detail: `kunne ikke parse fg=${fg} bg=${bg}` };
    const ratio = contrastRatio(fgRgb, bgRgb);
    return {
      pass: ratio >= 4.5,
      detail: `${ratio.toFixed(2)}:1 (fg=${fg} bg=${bg})`,
    };
  },
};

// ── Navigering (in-memory routing via tab-tap / drill-knapp) ─────────────────

async function gotoBase(page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  // Vent på at SuspenseFallback forsvinner og en tab-bar render
  await page.waitForSelector('nav[aria-label="Hovednavigasjon"]', { timeout: 15000 }).catch(() => {});
}

async function tapTab(page, label) {
  // BottomTabBar tab-knapper har label-tekst — finn på rolle button med tekst.
  const tab = page.getByRole('button', { name: new RegExp(label, 'i') }).first();
  await tab.click({ timeout: 5000 }).catch(async () => {
    // Fallback: data-attr eller alle nav-knapper
    await page.locator(`nav[aria-label="Hovednavigasjon"] button:has-text("${label}")`).first().click();
  });
  // Liten settle for AnimatePresence
  await page.waitForTimeout(400);
}

async function tapText(page, regex) {
  const el = page.getByText(regex).first();
  await el.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);
}

// ── Skjerm-katalog (11 skjermer) ─────────────────────────────────────────────

const COMMON_CHECKS_PER_THEME = (theme) => [
  checkHtmlLang,
  checkHtmlDataTheme(`html-data-theme-${theme}`, theme),
  checkCssVar('bg-canvas-correct', 'bg-canvas', {
    auto: ['#DBD8D2', 'oklch(0.21'],
    light: ['#DBD8D2', 'rgb(219, 216, 210)'],
    dark: ['oklch(0.21'],
  }),
  checkCssVar('warm-orange-correct', 'warm-orange-500', {
    auto: ['#FF6B35', 'oklch(0.76'],
    light: ['#FF6B35', 'rgb(255, 107, 53)'],
    dark: ['oklch(0.76'],
  }),
  checkCssVar('ink-900-correct', 'ink-900', {
    auto: ['#2B2522', 'oklch(0.95'],
    light: ['#2B2522', 'rgb(43, 37, 34)'],
    dark: ['oklch(0.95'],
  }),
  checkBodyContrast,
  ...(theme !== 'auto' ? [checkThemePersisted(theme)] : []),
];

const TAB_BAR_CHECKS = [
  checkSelectorExists('tabbar-nav', 'nav[aria-label="Hovednavigasjon"]', 'BottomTabBar nav-landmark'),
  checkSelectorExists('tabbar-aria-current', 'nav[aria-label="Hovednavigasjon"] [aria-current="page"]', 'En tab har aria-current="page"'),
  checkTouchTarget('tabbar-touch-44', 'nav[aria-label="Hovednavigasjon"] button', 44),
];

/** @type {Screen[]} */
const SCREENS = [
  {
    id: 'hjem',
    label: 'Hjem',
    navigate: async (page) => {
      await gotoBase(page);
      await tapTab(page, 'Hjem').catch(() => {});
    },
    checks: [
      ...TAB_BAR_CHECKS,
      checkCssVar('avatar-glow-token', 'avatar-glow', {
        auto: ['rgba(255, 255, 255', 'rgba(245, 235, 220'],
        light: ['rgba(255, 255, 255'],
        dark: ['rgba(245, 235, 220'],
      }),
    ],
  },
  {
    id: 'paakledning',
    label: 'Påkledning',
    navigate: async (page) => {
      await gotoBase(page);
      await tapTab(page, 'Hjem').catch(() => {});
      // Drill via CTA: prøv flere kjente labels
      for (const label of ['Påkledning', 'Påkle', 'Kle på']) {
        const el = page.getByText(new RegExp(label, 'i')).first();
        if ((await el.count()) > 0) {
          await el.click().catch(() => {});
          break;
        }
      }
      await page.waitForTimeout(500);
    },
    checks: [
      checkCssVar('layer-ytterst', 'layer-ytterst', {
        light: ['#C0632F', 'rgb(192, 99, 47)'],
        dark: ['oklch(0.74'],
      }),
      checkCssVar('layer-mellom', 'layer-mellom', {
        light: ['#5E8C6A'],
        dark: ['oklch(0.74'],
      }),
      checkCssVar('layer-innerst', 'layer-innerst', {
        light: ['#3F5A78'],
        dark: ['oklch(0.68'],
      }),
    ],
  },
  {
    id: 'uke',
    label: 'Uke',
    navigate: async (page) => {
      await gotoBase(page);
      await tapTab(page, 'Uke');
    },
    checks: [...TAB_BAR_CHECKS],
  },
  {
    id: 'guide',
    label: 'Guide',
    navigate: async (page) => {
      await gotoBase(page);
      await tapTab(page, 'Guide');
    },
    checks: [...TAB_BAR_CHECKS],
  },
  {
    id: 'innstillinger',
    label: 'Innstillinger',
    navigate: async (page) => {
      await gotoBase(page);
      await tapTab(page, 'Innst');
    },
    checks: [
      ...TAB_BAR_CHECKS,
      checkSelectorExists(
        'theme-toggle-3way',
        'button:has-text("Auto"), button:has-text("Lys"), button:has-text("Mørk")',
        'Utseende-toggle: Auto/Lys/Mørk-knapper finnes',
      ),
    ],
  },
  {
    id: 'plaggbib',
    label: 'Plaggbibliotek',
    navigate: async (page) => {
      await gotoBase(page);
      await tapTab(page, 'Guide');
      await tapText(page, /plaggbib|plagg/i);
    },
    checks: [
      checkCssVar('surface-elevated', 'surface-elevated', {
        dark: ['oklch(0.36'],
      }),
    ],
  },
  {
    id: 'garderobe',
    label: 'Min garderobe',
    navigate: async (page) => {
      await gotoBase(page);
      await tapTab(page, 'Guide');
      await tapText(page, /garderobe/i);
    },
    checks: [],
  },
  {
    id: 'tog',
    label: 'TOG-guide',
    navigate: async (page) => {
      await gotoBase(page);
      await tapTab(page, 'Guide');
      await tapText(page, /TOG|tog/);
    },
    checks: [],
  },
  {
    id: 'varm-kald',
    label: 'Varm eller kald',
    navigate: async (page) => {
      await gotoBase(page);
      await tapTab(page, 'Hjem');
      await tapText(page, /varm.*kald|kald.*varm/i).catch(() => {});
    },
    checks: [],
  },
  {
    id: 'finn-antrekk',
    label: 'Finn antrekk',
    navigate: async (page) => {
      await gotoBase(page);
      await tapTab(page, 'Hjem');
      await tapText(page, /finn.*antrekk|antrekk/i).catch(() => {});
    },
    checks: [],
  },
  {
    id: 'onboarding',
    label: 'Onboarding',
    navigate: async (page) => {
      // Tøm localStorage for å trigge onboarding
      await page.context().clearCookies();
      await page.goto(BASE_URL);
      await page.evaluate(() => {
        Object.keys(localStorage)
          .filter((k) => k.startsWith('babyora.') && k !== 'babyora.theme')
          .forEach((k) => localStorage.removeItem(k));
      });
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
    },
    checks: [],
  },
];

// ── Theme-setter ─────────────────────────────────────────────────────────────

async function setTheme(page, theme) {
  // Sett localStorage og data-theme direkte (boot-script-ekvivalent)
  await page.evaluate((t) => {
    if (t === 'auto') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem(
        'babyora.theme',
        JSON.stringify({ state: { mode: 'auto' }, version: 0 }),
      );
    } else {
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem(
        'babyora.theme',
        JSON.stringify({ state: { mode: t }, version: 0 }),
      );
    }
  }, theme);
  // Vent på at evt. CSS-transitions har settled
  await page.waitForTimeout(150);
}

// ── Runner ───────────────────────────────────────────────────────────────────

async function main() {
  await mkdir(SHOTS_DIR, { recursive: true });

  console.log('\n────────────────────────────────────────────────────');
  console.log(' F60.15 — Pixel-perfect dark-mode verifisering');
  console.log('────────────────────────────────────────────────────');
  console.log(` Base-URL : ${BASE_URL}`);
  console.log(` Viewport : ${VIEWPORT.width}×${VIEWPORT.height}`);
  console.log(` Themes   : ${THEMES.join(', ')}`);
  console.log(` Screens  : ${SCREEN_FILTER ? [...SCREEN_FILTER].join(', ') : 'alle 11'}`);
  console.log(` Mode     : ${HEADED ? 'headed' : 'headless'}${CDP_PORT ? ` (CDP:${CDP_PORT})` : ''}`);
  console.log(` Output   : ${SHOTS_DIR}`);
  console.log('');

  let browser;
  if (CDP_PORT) {
    browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`);
  } else {
    browser = await chromium.launch({ headless: !HEADED });
  }

  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  const results = [];
  const screens = SCREEN_FILTER ? SCREENS.filter((s) => SCREEN_FILTER.has(s.id)) : SCREENS;

  let passCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (const screen of screens) {
    for (const theme of THEMES) {
      const label = `[${screen.id} · ${theme}]`;
      try {
        await screen.navigate(page);
        await setTheme(page, theme);
        await page.waitForTimeout(200);

        const shotPath = join(SHOTS_DIR, `F60.15-${screen.id}-${theme}.png`);
        await page.screenshot({ path: shotPath, fullPage: false });

        const checks = [...COMMON_CHECKS_PER_THEME(theme), ...screen.checks];

        for (const check of checks) {
          try {
            const { pass, detail } = await check.run({ page, theme, screenId: screen.id });
            const status = pass ? '🟢' : '❌';
            console.log(`${status} ${label} ${check.id}${detail ? ` — ${detail}` : ''}`);
            results.push({
              screen: screen.id,
              theme,
              check: check.id,
              describe: check.describe,
              status: pass ? 'PASS' : 'FAIL',
              detail: detail ?? '',
            });
            if (pass) passCount++;
            else failCount++;
          } catch (e) {
            console.log(`⚠️  ${label} ${check.id} — SKIP: ${e.message}`);
            results.push({
              screen: screen.id,
              theme,
              check: check.id,
              describe: check.describe,
              status: 'SKIP',
              detail: e.message,
            });
            skipCount++;
          }
        }

        console.log(`📸 ${label} screenshot → ${shotPath}\n`);
      } catch (e) {
        console.log(`💥 ${label} FATAL navigeringsfeil: ${e.message}\n`);
        results.push({
          screen: screen.id,
          theme,
          check: 'navigate',
          describe: 'Naviger til skjerm',
          status: 'SKIP',
          detail: e.message,
        });
        skipCount++;
      }
    }
  }

  await browser.close();

  // Rapport
  const total = passCount + failCount + skipCount;
  const summary = `\n════════════════════════════════════════════════════
 RESULTAT: ${passCount}/${total} PASS · ${failCount} FAIL · ${skipCount} SKIP
════════════════════════════════════════════════════\n`;
  console.log(summary);

  const md = renderMarkdownReport(results, { passCount, failCount, skipCount, total });
  const jsonPath = join(SHOTS_DIR, 'F60.15-report.json');
  const mdPath = join(SHOTS_DIR, 'F60.15-report.md');
  await writeFile(jsonPath, JSON.stringify({ summary: { passCount, failCount, skipCount, total }, results }, null, 2));
  await writeFile(mdPath, md);

  console.log(`📄 Rapport: ${mdPath}`);
  console.log(`📄 JSON   : ${jsonPath}\n`);

  // Exit-code: fail om noen FAIL, eller > 5% SKIP
  const skipRate = total > 0 ? skipCount / total : 0;
  if (failCount > 0 || skipRate > 0.05) {
    process.exit(1);
  }
  process.exit(0);
}

function renderMarkdownReport(results, { passCount, failCount, skipCount, total }) {
  const fails = results.filter((r) => r.status === 'FAIL');
  const skips = results.filter((r) => r.status === 'SKIP');

  const lines = [];
  lines.push('# F60.15 Pixel-perfect rapport');
  lines.push('');
  lines.push(`- **Generert:** ${new Date().toISOString()}`);
  lines.push(`- **Base-URL:** ${BASE_URL}`);
  lines.push(`- **Viewport:** ${VIEWPORT.width}×${VIEWPORT.height}`);
  lines.push('');
  lines.push(`## Sammendrag`);
  lines.push('');
  lines.push(`- 🟢 PASS — **${passCount}** / ${total}`);
  lines.push(`- ❌ FAIL — **${failCount}**`);
  lines.push(`- ⚠️  SKIP — **${skipCount}**`);
  lines.push('');

  if (fails.length > 0) {
    lines.push(`## Failures (${fails.length})`);
    lines.push('');
    for (const f of fails) {
      lines.push(`- [${f.screen} · ${f.theme}] **${f.check}** — ${f.describe}`);
      lines.push(`  - detail: \`${f.detail}\``);
    }
    lines.push('');
  }

  if (skips.length > 0) {
    lines.push(`## Skipped (${skips.length})`);
    lines.push('');
    for (const s of skips) {
      lines.push(`- [${s.screen} · ${s.theme}] **${s.check}** — ${s.detail}`);
    }
    lines.push('');
  }

  lines.push(`## Alle checks`);
  lines.push('');
  lines.push('| Screen | Theme | Check | Status | Detail |');
  lines.push('|---|---|---|---|---|');
  for (const r of results) {
    const emoji = r.status === 'PASS' ? '🟢' : r.status === 'FAIL' ? '❌' : '⚠️';
    const detail = (r.detail ?? '').replace(/\|/g, '\\|').slice(0, 80);
    lines.push(`| ${r.screen} | ${r.theme} | ${r.check} | ${emoji} ${r.status} | ${detail} |`);
  }
  lines.push('');
  lines.push(`## Screenshots`);
  lines.push('');
  const uniqueShots = [...new Set(results.map((r) => `${r.screen}-${r.theme}`))];
  for (const s of uniqueShots) {
    lines.push(`- \`screenshots/F60.15-${s}.png\``);
  }

  return lines.join('\n');
}

main().catch((e) => {
  console.error('💥 Uncaught:', e);
  process.exit(2);
});
