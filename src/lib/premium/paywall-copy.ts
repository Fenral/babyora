/**
 * paywall-copy — F81.5-W1: rene copy-byggere for den delte PaywallDialog.
 *
 * Holdt i en egen modul UTEN React/Capacitor-avhengigheter slik at innholdet
 * kan importeres og copy-lintes trygt fra vitest (node-miljø, ingen jsdom) —
 * PaywallDialog.tsx selv importerer @capacitor/core transitivt (via
 * billing/revenuecat.ts) og er ikke trygt å importere utenfor en
 * nettleser/WebView-kontekst.
 *
 * Kilde for tall: PRODUCTS-tabellen i ./products.ts. Vi hardkoder aldri
 * priser/prosenter her — de utledes fra PRODUCTS, bortsett fra
 * månedlig-ekvivalent-teksten som parses fra PRODUCTS.yearly.description
 * (samme godkjente tekst som F81.1 allerede har låst i products.test.ts).
 */
import {
  PRODUCTS,
  priceTransparencyText,
  type ProductKey,
} from './products';

/** R7 Task 1 (låst beslutning 2026-07-13): lifetime/«Barnetiden» publiseres
 *  ikke — SKU-en beholdes definert i products.ts, men vises aldri. */
export const PLAN_ORDER: ReadonlyArray<ProductKey> = ['yearly', 'monthly'];

export const PLAN_DISPLAY_NAME: Record<ProductKey, string> = {
  yearly: 'Årlig',
  monthly: 'Månedlig',
  lifetime: PRODUCTS.lifetime.name ?? 'Barnetiden',
};

/**
 * Statisk, ikke-parametrisert brukervendt copy — én kilde for både
 * PaywallDialog-rendring og copy-lint-testen (paywall-copy.test.ts).
 */
export const PAYWALL_COPY = {
  legend: 'Velg plan',
  closeLabel: 'Lukk',
  genericHeadline: 'Babyora Pluss',
  /** F86-F1: morgenvarselet er Pluss-flaggskipet (dokumentert sterkeste
   *  betalingsdriver = veiledning/proaktivitet) — generiske paywall-åpninger
   *  leder med det i stedet for å gjenta produktnavnet. */
  flagshipHeadline: 'Våkn opp til ferdig antrekk',
  trustLine: 'Én Plus — alle som passer barnet',
  ctaYearly: 'Start 7 dager gratis',
  ctaOther: 'Kjøp Babyora Pluss',
  ctaPending: 'Behandler …',
  restoreLabel: 'Gjenopprett kjøp',
  statusProcessing: 'Behandler kjøp …',
  statusActivated: 'Babyora Pluss aktivert.',
  statusActivatedTestmode: 'Babyora Pluss aktivert (testmodus).',
  statusRestoreChecking: 'Sjekker tidligere kjøp …',
  statusNoRestore: 'Fant ingen aktive kjøp å gjenopprette.',
  errorPurchaseFailed: 'Kjøpet ble ikke fullført. Prøv igjen, eller sjekk nettilkoblingen din.',
  errorPurchaseException: 'Noe gikk galt under kjøpet. Prøv igjen.',
  errorRestoreDevOnly: 'Gjenoppretting fungerer først etter et ekte kjøp i App Store eller Google Play.',
  errorRestoreException: 'Kunne ikke gjenopprette akkurat nå. Sjekk nettilkoblingen og prøv igjen.',
  privacyLinkLabel: 'Personvernerklæring (åpnes i nettleser)',
  termsLinkLabel: 'Vilkår for bruk (åpnes i nettleser)',
} as const;

/** Prosent spart på årlig vs. 12× månedlig — utledet, aldri hardkodet. */
export function computeYearlySavingsPercent(): number {
  const yearlyCost = PRODUCTS.yearly.anchorPriceNok;
  const monthlyAnnualized = PRODUCTS.monthly.anchorPriceNok * 12;
  if (monthlyAnnualized <= 0) return 0;
  return Math.round((1 - yearlyCost / monthlyAnnualized) * 100);
}

/** Månedlig-ekvivalent («24,90») parset fra PRODUCTS.yearly.description. */
export function extractMonthlyEquivalent(): string {
  const match = PRODUCTS.yearly.description?.match(/[\d,]+/);
  if (match) return match[0];
  return (PRODUCTS.yearly.anchorPriceNok / 12).toFixed(2).replace('.', ',');
}

function lowerFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export function formatPlanPrice(key: ProductKey): string {
  const product = PRODUCTS[key];
  return `${product.anchorPriceNok} kr${product.periodLabel}`;
}

/**
 * Tilgjengelig navn (aria-label) for plan-kortet — må inneholde ALT som
 * vises visuelt i kortet (P2 a11y-krav, F81.5-W1-spec §Oppgave 3).
 */
export function buildPlanAriaLabel(key: ProductKey): string {
  const product = PRODUCTS[key];
  const name = PLAN_DISPLAY_NAME[key];
  if (key === 'yearly') {
    const monthlyEq = extractMonthlyEquivalent();
    const savings = computeYearlySavingsPercent();
    return `${name}, ${product.anchorPriceNok} kroner per år, tilsvarer ${monthlyEq} kroner per måned, spar ${savings} prosent, ${product.trialDays} dager gratis først`;
  }
  if (key === 'monthly') {
    return `${name}, ${product.anchorPriceNok} kroner per måned`;
  }
  const desc = lowerFirst((product.description ?? '').replace(' · ', ', '));
  return `${name}, ${product.anchorPriceNok} kroner, engangskjøp, ${desc}`;
}

/** Total-transparens-linje vist under plan-velgeren. */
export function buildTransparencyLine(key: ProductKey): string {
  const base = priceTransparencyText(key);
  if (key !== 'yearly') return base;
  return `7 dager gratis, ${lowerFirst(base)}`;
}
