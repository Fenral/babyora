/**
 * asc-setup — Playwright-assistert App Store Connect-oppsett.
 *
 * Åpner en ekte (headed) nettleser med VARIG profil, så du logger inn med
 * Apple-ID + 2FA ÉN gang (persisteres til neste kjøring). Navigerer rett til
 * de to gjenstående stegene og skriver ut nøyaktig hva som skal gjøres.
 *
 * ASC er en tung SPA med skiftende selektorer — vi auto-klikker IKKE blindt
 * (ville brutt). Du gjør de faktiske klikkene; skriptet fjerner navigasjons-
 * friksjonen og gir eksakte verdier. Se docs/APP-STORE-ASC-CHECKLIST.md.
 *
 * Kjør:  npx tsx tools/appstore/asc-setup.ts
 * (Nettleseren blir stående åpen — lukk vinduet når du er ferdig.)
 */
import { chromium } from 'playwright';
import { resolve } from 'node:path';

const PROFILE = resolve(process.cwd(), '.asc-profile'); // gitignorert — holder innlogging

const APP = '6776416135';
const PAGES = {
  apiKeys: 'https://appstoreconnect.apple.com/access/integrations/api',
  monthly: `https://appstoreconnect.apple.com/apps/${APP}/distribution/subscriptions/6776416692`,
  quarterly: `https://appstoreconnect.apple.com/apps/${APP}/distribution/subscriptions/6776418068`,
  yearly: `https://appstoreconnect.apple.com/apps/${APP}/distribution/subscriptions/6776417937`,
};

function banner(): void {
  console.log(`
════════════════════════════════════════════════════════════════════
  BABYORA — App Store Connect-oppsett (guidet)
════════════════════════════════════════════════════════════════════
  1) Logg inn med Apple-ID + 2FA i vinduet (kun første gang).

  STEG A — Ny API-nøkkel med App Manager (låser opp TestFlight-bygget)
  ------------------------------------------------------------------
  Fane «API Keys»:
    • Team Keys → Generate API Key / «+»
    • Navn:    Codemagic Babyora
    • Access:  App Manager   ← viktig (Developer-rollen var årsaken)
    • Generate → LAST NED .p8 (kan kun lastes ned én gang!)
    • Noter Key ID + Issuer ID
    → Legg nøkkelen inn i Codemagic (Team → Integrations → Developer
      Portal → Add key) og oppdater key-referansen i codemagic.yaml.

  STEG B — Pris + norsk localization per abonnement (3 faner)
  ------------------------------------------------------------------
  Månedlig (fane 2):  Pris 39 NOK · Display «Babyora Pluss»
  Kvartal  (fane 3):  Pris 99 NOK · Display «Babyora Pluss 3 mnd»
  Årlig    (fane 4):  Pris 299 NOK · Display «Babyora Pluss 1 år»
                      + Introductory Offer: Free · 1 week (7 dagers trial)
  (Full copy/beskrivelser: docs/APP-STORE-ASC-CHECKLIST.md)

  Når STEG A er gjort: push til main → grønt Codemagic-bygg → TestFlight.
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
  await page.goto(PAGES.apiKeys).catch(() => {});
  for (const url of [PAGES.monthly, PAGES.quarterly, PAGES.yearly]) {
    const p = await ctx.newPage();
    await p.goto(url).catch(() => {});
  }
  console.log('Nettleser åpnet med 4 faner. Lukk vinduet når du er ferdig.\n');
  // Hold prosessen i live til brukeren lukker nettleseren.
  await new Promise<void>((res) => ctx.on('close', () => res()));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
