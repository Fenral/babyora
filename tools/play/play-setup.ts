/**
 * play-setup — Playwright-assistert Play Console-oppsett.
 *
 * Samme mønster som tools/appstore/asc-setup.ts: ekte (headed) nettleser med
 * VARIG profil, så Google-innlogging + 2FA gjøres ÉN gang og persisteres.
 *
 * HVORFOR IKKE FULLAUTOMATISK: Google avviser innlogging i et
 * Playwright-styrt vindu («denne nettleseren er muligens ikke sikker») —
 * målt 2026-08-06, se commit 26fb127. Med varig profil og MANUELL
 * innlogging holder økta seg mellom kjøringer. Skriptet fjerner
 * navigasjonsfriksjonen og legger fasiten på skjermen; du gjør klikkene.
 *
 * Kjør:  npx tsx tools/play/play-setup.ts
 * (Nettleseren blir stående åpen — lukk vinduet når du er ferdig.)
 */
import { chromium } from 'playwright';
import { resolve } from 'node:path';

const PROFILE = resolve(process.cwd(), '.play-profile'); // gitignorert

const PAGES = {
  apper: 'https://play.google.com/console/developers',
  hjelpAbonnement: 'https://support.google.com/googleplay/android-developer/answer/140504',
};

function banner(): void {
  console.log(`
════════════════════════════════════════════════════════════════════
  BABYORA — Play Console-oppsett (guidet)
════════════════════════════════════════════════════════════════════
  1) Logg inn med Google-kontoen i vinduet (kun første gang).

  STEG 1 — Opprett appen
  ------------------------------------------------------------------
    • Create app
    • Appnavn:      Babyora
    • Språk:        norsk (bokmål) – no-NO
    • App eller spill: App
    • Gratis eller betalt: Gratis  (kjøp skjer i appen)
    • Package name: no.klemeg.app

  STEG 2 — Tre abonnementer
  ------------------------------------------------------------------
    Monetize → Products → Subscriptions → Create subscription

    Product ID                  Base plan    Pris     Periode
    klemeg_premium_monthly      monthly       39 NOK   1 mnd
    klemeg_premium_quarterly    quarterly     99 NOK   3 mnd
    klemeg_premium_yearly       yearly       299 NOK   1 år

    Navn (no-NO), samme som App Store:
      monthly    → «Babyora Pluss»
      quarterly  → «Babyora Pluss 3 mnd»
      yearly     → «Babyora Pluss 1 år»

    ÅRLIG: legg på Offer → Free trial · 7 dager.

  STEG 3 — Service account til RevenueCat
  ------------------------------------------------------------------
    Setup → API access → opprett service account, gi
    «Financial data / Manage orders and subscriptions», last ned JSON.
    Den limes inn i RevenueCat under Android-appen.

  SANNFERDIGHET (samme ramme som i appen og på App Store):
    Ingen «trygt/riktig»-påstander, ingen ekspert- eller
    helsepersonell-påstander. Familiedeling er IKKE bygget — ikke lov det.
════════════════════════════════════════════════════════════════════
`);
}

async function main(): Promise<void> {
  banner();
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    headless: false,
    viewport: null,
    args: ['--start-maximized'],
  });
  const [tab] = ctx.pages();
  const page = tab ?? (await ctx.newPage());
  await page.goto(PAGES.apper).catch(() => {});
  console.log('Nettleser åpnet. Lukk vinduet når du er ferdig.\n');
  await new Promise<void>((res) => ctx.on('close', () => res()));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
