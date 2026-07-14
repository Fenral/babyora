/**
 * F81.0 (2026-07-03): RevenueCat product-IDs og prisanker — «Babyora Pluss».
 *
 * Produkt-IDene må opprettes manuelt i App Store Connect + RevenueCat
 * dashboard FØR første live-kjøp. Tabellen her er sannhet for app-laget;
 * RevenueCat returnerer faktiske priser fra StoreKit (aldri hardkodet).
 *
 * Prisene under er ankerverdier for UI-tekst når StoreKit ikke har levert
 * ennå (offline-fallback) — RevenueCat-pris vinner alltid når den finnes.
 *
 * Prispakke låst per docs/F81/prisbeslutning.md:
 * 49 kr/mnd (anker) · 299 kr/år (HERO, 7 dagers gratis trial) ·
 * 499 kr «Barnetiden» (engangskjøp, non-consumable, alle barna/hele
 * småbarnstiden 0–3 år).
 */

export const PRODUCT_IDS = {
  yearly: 'babyora_yearly_299',
  monthly: 'babyora_monthly_49',
  lifetime: 'babyora_barnetiden_499',
} as const;

export type ProductKey = keyof typeof PRODUCT_IDS;

export interface ProductDescriptor {
  id: string;
  /** Ankerpris i NOK — fallback hvis StoreKit ikke har levert. */
  anchorPriceNok: number;
  /** Periode-tekst som vises i UI («/år», «/mnd», tom for engangskjøp). */
  periodLabel: string;
  /** Auto-fornyelse-flag — påvirker pristransparens-tekst. */
  autoRenews: boolean;
  /** Trial-dager (kun yearly per plan). */
  trialDays: number;
  /** Visningsnavn — kun satt der det avviker fra plan-typen (lifetime → «Barnetiden»). */
  name?: string;
  /** Kort markedsføringsbeskrivelse — vises som sub-tekst under prisen i paywall. */
  description?: string;
}

export const PRODUCTS: Record<ProductKey, ProductDescriptor> = {
  yearly: {
    id: PRODUCT_IDS.yearly,
    anchorPriceNok: 299,
    periodLabel: '/år',
    autoRenews: true,
    trialDays: 7,
    description: 'Tilsvarer 24,90 kr/mnd',
  },
  monthly: {
    id: PRODUCT_IDS.monthly,
    anchorPriceNok: 49,
    periodLabel: '/mnd',
    autoRenews: true,
    trialDays: 0,
  },
  lifetime: {
    id: PRODUCT_IDS.lifetime,
    anchorPriceNok: 499,
    periodLabel: '',
    autoRenews: false,
    trialDays: 0,
    name: 'Barnetiden',
    description: 'Alle barna dine · hele småbarnstiden',
  },
};

/** Default-anker — årlig, forhåndsvalgt i paywall. */
export const DEFAULT_PLAN: ProductKey = 'yearly';

/**
 * Pristransparens-tekst som vises UNDER CTA-knappen.
 * Aldri hardkodet pris-streng — bruk denne helperen.
 *
 * Per Premium-plan: «Deretter 299 kr/år. Avslutt når som helst.»
 */
export function priceTransparencyText(key: ProductKey, priceFromStore?: string): string {
  const product = PRODUCTS[key];
  const priceStr = priceFromStore ?? `${product.anchorPriceNok} kr${product.periodLabel}`;
  if (key === 'lifetime') {
    return `Du betaler ${priceStr}. Engangskjøp — aldri auto-fornying.`;
  }
  if (product.trialDays > 0) {
    return `Deretter ${priceStr}. Avslutt når som helst.`;
  }
  return `${priceStr}. Avslutt når som helst.`;
}

/** Verdiforankrings-mikrocopy per Premium-plan §3 — godkjent verdianker for 299/år-hero. */
export const VALUE_ANCHOR_COPY = 'Mindre enn én ullbody i året.';

/** Tillitslinje under CTA — én Premium = familien. */
export const TRUST_LINE_COPY = 'Én Premium — begge foreldre';

/**
 * Paywall-trigger-strenger.
 * Bruk disse konstant for analytics-konsistens; aldri ad-hoc strings.
 *
 * F81.1: redusert til triggerne fra prisbeslutningen. Droppet:
 * uke_dag, mine_plagg_4 (erstattet av garderobe_tilpasning), soevn_inne
 * (søvn/TOG er sikkerhetsinnhold og kan aldri gates), feedback_proaktiv.
 * R7 Task 7: morgenvarsel droppet — morgenpåminnelsen er en gratis-
 * kapabilitet (capabilities.ts), så den gates aldri bak en paywall.
 */
export const PAYWALL_TRIGGERS = {
  imorgen: 'imorgen',                             // Ser morgendagens antrekk kvelden før
  garderobe_tilpasning: 'garderobe_tilpasning',    // Tilpasser anbefaling til egne plagg
  barn_2: 'barn_2',                                // Legger til barn nr. 2
  forste_vinter: 'forste_vinter',                  // Åpner gated leksjon i Første vinter-programmet (F86)
} as const;

export type PaywallTrigger = keyof typeof PAYWALL_TRIGGERS;

/** Kontekst-overskrift per trigger — navngir det du prøvde, varm og ikke masete tone. */
export const TRIGGER_HEADLINE: Record<PaywallTrigger, string> = {
  imorgen: 'Se morgendagens antrekk i kveld',
  garderobe_tilpasning: 'Anbefalinger fra dine egne plagg',
  barn_2: 'Ett abonnement, alle barna',
  forste_vinter: 'Lær vinterpåkledning, én leksjon i uka',
};
