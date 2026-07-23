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
  type PaywallTrigger,
  type ProductKey,
} from './products';
import type { PlusFeatureAvailability } from './plus-features';

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
 */
export const PAYWALL_COPY = {
  legend: 'Velg plan',
  closeLabel: 'Lukk',
  genericHeadline: 'Babyora Pluss',
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

type ClaimCapability = Exclude<keyof PlusFeatureAvailability, 'today_home'>;

export type CapabilityPaywallPreviewItem = Readonly<{
  key: ClaimCapability;
  from: string;
  to: string;
}>;

export type CapabilityPaywallCopy = Readonly<{
  heading: string;
  body: string;
  trustLine?: string;
  previewItems: readonly CapabilityPaywallPreviewItem[];
}>;

type ClaimDefinition = CapabilityPaywallPreviewItem & Readonly<{
  body: string;
  triggers?: readonly PaywallTrigger[];
  contextualHeading?: string;
}>;

const CAPABILITY_CLAIMS: readonly ClaimDefinition[] = [
  {
    key: 'future_plan',
    from: 'I dag',
    to: '10 dager fremover',
    body: 'Se ukeplanen lenger frem.',
    triggers: ['imorgen'],
    contextualHeading: 'Se morgendagens antrekk i kveld',
  },
  {
    key: 'automatic_location',
    from: 'Valgt sted',
    to: 'Automatisk sted',
    body: 'Bruk automatisk sted i planleggingen.',
  },
  {
    key: 'extra_children',
    from: 'Ett barn',
    to: 'Flere barn',
    body: 'Legg til flere barn i samme app.',
    triggers: ['barn_2'],
    contextualHeading: 'Planlegg for flere barn',
  },
  {
    key: 'family_sharing',
    from: 'Bare deg',
    to: 'Del med omsorgspersoner',
    body: 'Del barnets plan med inviterte omsorgspersoner.',
  },
  {
    key: 'personal_calibration',
    from: 'Standardråd',
    to: 'Tilpasset barnet',
    body: 'Tilpass rådene med personlig kalibrering.',
    triggers: ['garderobe_tilpasning'],
    contextualHeading: 'Tilpass rådene til barnet',
  },
  {
    key: 'soon_preparation',
    from: 'Dagens plan',
    to: 'Forberedelser snart',
    body: 'Se godkjente forberedelser barnet kan trenge snart.',
  },
] as const;

/**
 * Den eneste kilden til brukervendte Plus-løfter.
 *
 * Hvert konkret løfte og hver kontekstoverskrift filtreres gjennom samme
 * tilgjengelighetskart. Et tomt kart gir bare nøytral abonnementstekst.
 */
export function buildCapabilityPaywallCopy(
  flags: Readonly<PlusFeatureAvailability>,
  trigger: PaywallTrigger | null = null,
): CapabilityPaywallCopy {
  const enabled = CAPABILITY_CLAIMS.filter((claim) => flags[claim.key]);
  const contextualClaim = trigger
    ? enabled.find((claim) => claim.triggers?.includes(trigger))
    : undefined;
  const previewItems = enabled.map(({ key, from, to }) => ({ key, from, to }));

  return {
    heading: contextualClaim?.contextualHeading ?? 'Mer med Babyora Pluss',
    body: enabled.length > 0
      ? enabled.map((claim) => claim.body).join(' ')
      : 'Velg en plan og administrer abonnementet på ett sted.',
    trustLine: flags.family_sharing
      ? 'Én Plus — alle som passer barnet'
      : undefined,
    previewItems,
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
  // quarterly (ikke i PLAN_ORDER, men støttet)
  return `${name}, ${product.anchorPriceNok} kroner per 3 måneder`;
}

/** Total-transparens-linje vist under plan-velgeren. */
export function buildTransparencyLine(key: ProductKey): string {
  const base = priceTransparencyText(key);
  if (key !== 'yearly') return base;
  return `7 dager gratis, ${lowerFirst(base)}`;
}
