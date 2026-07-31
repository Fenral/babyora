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
 *
 * Eierbeslutning 2026-07-31 (PRODUCT.md, hard paywall): copyen er reframet
 * fra DELTA («I dag → 10 dager») til HELE PRODUKTET — det finnes ikke
 * lenger en gratis baseline å sammenligne mot, så paywallen selger alltid
 * det komplette produktet, uansett hvilken skjerm/trigger som åpnet den.
 */
import {
  PRODUCTS,
  type ProductKey,
} from './products';

/** Paywallen viser årlig (hero) + månedlig. Kvartal («pappaperm») er
 *  provisjonert og definert i products.ts, men ikke surfaced her ennå —
 *  kan legges til PLAN_ORDER hvis eier vil vise pappaperm-planen. */
export const PLAN_ORDER: ReadonlyArray<ProductKey> = ['yearly', 'monthly'];

export const PLAN_DISPLAY_NAME: Record<ProductKey, string> = {
  yearly: 'Årlig',
  quarterly: '3 måneder',
  monthly: 'Månedlig',
};

/**
 * Statisk, ikke-parametrisert brukervendt copy — én kilde for både
 * PaywallDialog-rendring og copy-lint-testen (paywall-copy.test.ts).
 *
 * `trialLine` MÅ være plan-agnostisk (P2 hard paywall-krav): alle tre planer
 * har 7 dagers gratis prøveperiode (StoreKit intro-trial, App Store
 * Connect-side), så teksten skal aldri antyde at prøveperioden kun gjelder
 * årsplanen.
 */
export const PAYWALL_COPY = {
  legend: 'Velg plan',
  closeLabel: 'Lukk',
  genericHeadline: 'Babyora Pluss',
  /** Plan-agnostisk CTA — samme tekst uansett valgt plan, siden alle tre
   *  planer har 7 dagers trial (aldri kun årsplanen). */
  cta: 'Start 7 dager gratis',
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
  trialLine: 'Start med 7 gratisdager uansett plan, deretter prisen for planen du velger. Avslutt når som helst i App Store.',
} as const;

export type CapabilityPaywallPreviewItem = Readonly<{
  key: string;
  label: string;
}>;

export type CapabilityPaywallCopy = Readonly<{
  heading: string;
  body: string;
  trustLine?: string;
  previewItems: readonly CapabilityPaywallPreviewItem[];
}>;

/**
 * De tre faste verdi-punktene i hard-paywall-modellen — hele produktet,
 * alltid i denne rekkefølgen, uavhengig av hvilken skjerm/trigger som åpnet
 * paywallen. Erstatter den forrige delta-drevne CAPABILITY_CLAIMS-listen
 * (som filtrerte løfter per PlusFeatureAvailability-flagg).
 */
export const PAYWALL_VALUE_BULLETS: readonly CapabilityPaywallPreviewItem[] = [
  { key: 'today', label: 'Dagens antrekk, klart hver eneste morgen' },
  { key: 'week', label: 'I morgen og hele neste uke, ferdig planlagt' },
  { key: 'family', label: 'Del med alle som passer barnet' },
] as const;

/**
 * Den eneste kilden til brukervendte Plus-løfter.
 *
 * Hard paywall (2026-07-31): ingen gratis baseline å sammenligne mot lenger,
 * så copyen er alltid hele-produktet-pitchen — den varierer ikke lenger med
 * trigger eller feature-flagg.
 */
export function buildCapabilityPaywallCopy(): CapabilityPaywallCopy {
  return {
    heading: 'Hele Babyora, samlet i én plan',
    body: 'Ett abonnement gir deg alt Babyora kan gjøre — ingen gratis-nivå ved siden av.',
    previewItems: PAYWALL_VALUE_BULLETS,
  };
}

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

export function formatPlanPrice(key: ProductKey): string {
  const product = PRODUCTS[key];
  return `${product.anchorPriceNok} kr${product.periodLabel}`;
}

/**
 * Tilgjengelig navn (aria-label) for plan-kortet — må inneholde ALT som
 * vises visuelt i kortet (P2 a11y-krav, F81.5-W1-spec §Oppgave 3).
 *
 * Hard paywall: trial-suffikset er nå plan-agnostisk (alle tre planer har
 * trialDays > 0) — aria-labelen sier derfor aldri at prøveperioden kun
 * gjelder årsplanen.
 */
export function buildPlanAriaLabel(key: ProductKey): string {
  const product = PRODUCTS[key];
  const name = PLAN_DISPLAY_NAME[key];
  const trialSuffix = product.trialDays > 0 ? `, ${product.trialDays} dager gratis først` : '';
  if (key === 'yearly') {
    const monthlyEq = extractMonthlyEquivalent();
    const savings = computeYearlySavingsPercent();
    return `${name}, ${product.anchorPriceNok} kroner per år, tilsvarer ${monthlyEq} kroner per måned, spar ${savings} prosent${trialSuffix}`;
  }
  if (key === 'monthly') {
    return `${name}, ${product.anchorPriceNok} kroner per måned${trialSuffix}`;
  }
  // quarterly (ikke i PLAN_ORDER, men støttet)
  return `${name}, ${product.anchorPriceNok} kroner per 3 måneder${trialSuffix}`;
}
