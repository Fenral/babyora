/**
 * Abonnementsplaner og prisanker for «Babyora Pluss».
 *
 * Eiervedtak 2026-08-14 (loop/referanse/EIERVEDTAK-BETALING-2026-08-14.md):
 *  V1: To planer — måned og år. Kvartal utgår.
 *  V2: Appen kjenner PLANTYPER, ikke Apples produkt-IDer. Butikk-navn løses
 *      i RevenueCat-tilbudet via package_type (annual/monthly).
 *  V3: Faktisk provisjonert hos Apple: `babyora_yearly_299`,
 *      `babyora_monthly_49`. IDene håndteres i RevenueCat-portalen, aldri her.
 *  V4: Ankerprisene under er fallback når butikken ikke har svart. SN-W03
 *      eier verifisering mot App Store Connect før innsending.
 *
 * Ankerprisene brukes kun som UI-fallback; RevenueCat-pris vinner alltid
 * når den finnes.
 */

export type PlanKey = 'yearly' | 'monthly';

export interface ProductDescriptor {
  /** Ankerpris i NOK — fallback hvis StoreKit ikke har levert. */
  anchorPriceNok: number;
  /** Periode-tekst som vises i UI («/år», «/mnd»). */
  periodLabel: string;
  /** Auto-fornyelse-flag — påvirker pristransparens-tekst. */
  autoRenews: boolean;
  /** Trial-dager (konfigureres i ASC; verdien her er kun UI-signalet). */
  trialDays: number;
  /** Visningsnavn — kun satt der det avviker fra plan-typen. */
  name?: string;
  /** Kort markedsføringsbeskrivelse — vises som sub-tekst under prisen i paywall. */
  description?: string;
}

export const PRODUCTS: Record<PlanKey, ProductDescriptor> = {
  yearly: {
    anchorPriceNok: 299,
    periodLabel: '/år',
    autoRenews: true,
    trialDays: 7,
    description: 'Tilsvarer 24,90 kr/mnd',
  },
  monthly: {
    anchorPriceNok: 39,
    periodLabel: '/mnd',
    autoRenews: true,
    trialDays: 7,
  },
};

/** Default-anker — årlig, forhåndsvalgt i paywall. */
export const DEFAULT_PLAN: PlanKey = 'yearly';

/**
 * Pristransparens-tekst som vises UNDER CTA-knappen.
 * Aldri hardkodet pris-streng — bruk denne helperen.
 *
 * Per Premium-plan: «Deretter 299 kr/år. Avslutt når som helst.»
 */
export function priceTransparencyText(key: PlanKey, priceFromStore?: string): string {
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
