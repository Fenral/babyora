/**
 * RevenueCat product-IDs og prisanker — «Babyora Pluss».
 *
 * IDene MÅ matche det som er provisjonert i App Store Connect + RevenueCat
 * (STATUS.md, juni 2026). Eierbeslutning 2026-07-15: behold juni-modellen
 * (39/99/299) — koden er alignet tilbake fra F81-forslaget (49/299/499).
 *
 * Ankerprisene er UI-fallback når StoreKit ikke har levert; RevenueCat-pris
 * vinner alltid når den finnes.
 *
 * Provisjonert (STATUS.md):
 * 39 kr/mnd · 99 kr/3 mnd («pappaperm») · 299 kr/år (HERO).
 * Alle tre auto-renewable, entitlement «premium», offering «default».
 *
 * Eierbeslutning 2026-07-31 (PRODUCT.md, hard paywall): 7 dagers gratis
 * prøveperiode via StoreKit intro-trial gjelder nå ALLE tre planene, ikke
 * bare årlig. Selve trial-konfigurasjonen skjer i App Store Connect, ikke i
 * kode — trialDays her er kun UI-signalet («X dager gratis»-merket per plan
 * + pristransparens-teksten), og må derfor aldri antyde at prøveperioden
 * kun gjelder årsplanen.
 */

export const PRODUCT_IDS = {
  yearly: 'no.klemeg.app.yearly',
  quarterly: 'no.klemeg.app.quarterly',
  monthly: 'no.klemeg.app.monthly',
} as const;

export type ProductKey = keyof typeof PRODUCT_IDS;

export interface ProductDescriptor {
  id: string;
  /** Ankerpris i NOK — fallback hvis StoreKit ikke har levert. */
  anchorPriceNok: number;
  /** Periode-tekst som vises i UI («/år», «/3 mnd», «/mnd»). */
  periodLabel: string;
  /** Auto-fornyelse-flag — påvirker pristransparens-tekst. */
  autoRenews: boolean;
  /** Trial-dager (kun yearly per plan; konfigureres i ASC). */
  trialDays: number;
  /** Visningsnavn — kun satt der det avviker fra plan-typen. */
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
  quarterly: {
    id: PRODUCT_IDS.quarterly,
    anchorPriceNok: 99,
    periodLabel: '/3 mnd',
    autoRenews: true,
    trialDays: 7,
    description: 'Tilsvarer 33 kr/mnd · pappaperm',
  },
  monthly: {
    id: PRODUCT_IDS.monthly,
    anchorPriceNok: 39,
    periodLabel: '/mnd',
    autoRenews: true,
    trialDays: 7,
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
  if (product.trialDays > 0) {
    return `Deretter ${priceStr}. Avslutt når som helst.`;
  }
  return `${priceStr}. Avslutt når som helst.`;
}

/** Verdiforankrings-mikrocopy per Premium-plan §3 — godkjent verdianker for 299/år-hero. */
export const VALUE_ANCHOR_COPY = 'Mindre enn én ullbody i året.';

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
  snart: 'snart',                                  // Åpner nøytral historikk-preview for Snart-forberedelser
} as const;

export type PaywallTrigger = keyof typeof PAYWALL_TRIGGERS;
