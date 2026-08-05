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

/**
 * Betalingsvegg v2 (docs/design-notes/sol-duel-2026-07-31.md §8, docs/mocks/
 * monter/paywall-v2*.html): TRE likeverdige prisrader — Årlig, Kvartal
 * («pappaperm»), Månedlig. Utvidet fra de to (Årlig+Månedlig) den forrige
 * hard-paywall-versjonen viste.
 */
export const PLAN_ORDER: ReadonlyArray<ProductKey> = ['yearly', 'quarterly', 'monthly'];

/** Visningsnavn i selve plan-raden (paywall-v2.html: "Kvartal", ikke "3 måneder"). */
export const PLAN_DISPLAY_NAME: Record<ProductKey, string> = {
  yearly: 'Årlig',
  quarterly: 'Kvartal',
  monthly: 'Månedlig',
};

/**
 * Tilgjengelig-navn-varianten for buildPlanAriaLabel — HOLDT UTE fra
 * PLAN_DISPLAY_NAME bevisst: quarterly sin aria-label er en låst kontrakt
 * (paywall-copy.test.ts) som staver ut "3 måneder", selv om selve KORTET nå
 * viser "Kvartal" visuelt (v2-redesignet). Yearly/monthly er identiske i
 * begge kart, så kun quarterly faktisk avviker.
 */
const PLAN_ARIA_NAME: Record<ProductKey, string> = {
  yearly: 'Årlig',
  quarterly: '3 måneder',
  monthly: 'Månedlig',
};

/** "per år" / "per kvartal" / "per måned" — linjen UNDER prissummen i hver plan-rad (paywall-v2.html sin `.p-per`). */
export const PLAN_PER_LABEL: Record<ProductKey, string> = {
  yearly: 'per år',
  quarterly: 'per kvartal',
  monthly: 'per måned',
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
  /** Plan-agnostisk CTA — BEHOLDT for bakoverkompatibilitet (products.test.ts
   *  låser denne eksakte verdien). IKKE lenger det som faktisk rendres i
   *  v2-redesignet — se `ctaResting`/`buildArmedCtaLabel` under, som
   *  PaywallDialog.tsx faktisk bruker (resting/armert CTA, §8). */
  cta: 'Start 7 dager gratis',
  ctaPending: 'Behandler …',
  /** v2 (§8): CTA hviler til et AKTIVT planvalg er gjort — ingen forhåndsvalgt plan. */
  ctaResting: 'Velg en plan for å starte gratis',
  /** v2: liten tekst-badge på Årlig sin rad ("Best verdi", IKKE en beregnet prosent-badge). */
  bestVerdiBadge: 'Best verdi',
  /** v2: hint-linjen mellom planvelgeren og CTA-en. Kortere når en plan allerede er valgt. */
  chooseHintDefault: 'Alle planer starter med 7 gratisdager. Velg planen som passer dere.',
  chooseHintSelected: 'Alle planer starter med 7 gratisdager.',
  /** v2: sheetens tilgjengelige navn (aria-label på plan-seksjonen, paywall-v2.html). */
  sheetAriaLabel: 'Fortsett med Babyora',
  /** v2: forklarings-etiketten over "I dag / <fornyelsesdato>"-oppstillingen. */
  breakdownAriaPrefix: 'Prisoversikt for',
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
  /** Kort synlig lenketekst (paywall-v2.html sin `.links`-rad). */
  privacyLinkLabel: 'Personvern',
  termsLinkLabel: 'Vilkår',
  /** Fyldigere tilgjengelig navn (aria-label) — lenken åpner i ekstern
   *  nettleser, samme kontekst den forrige, lengre synlige teksten ga. */
  privacyLinkAriaLabel: 'Personvernerklæring (åpnes i nettleser)',
  termsLinkAriaLabel: 'Vilkår for bruk (åpnes i nettleser)',
  trialLine: 'Start med 7 gratisdager uansett plan, deretter prisen for planen du velger. Avslutt når som helst i App Store.',
} as const;

export type CapabilityPaywallPreviewItem = Readonly<{
  key: string;
  label: string;
  /**
   * P10.1 (judge finding B3): the leading keyword phrase rendered in the
   * heavier ink-hi/600 weight (paywall-v2.html's own `<b>` treatment
   * inside `.v-list`); the remainder of `label` renders in the regular
   * ink-mid body weight. Always an exact PREFIX of `label` — `label`
   * itself stays the one full, plain-text sentence (a11y/copy-lint see a
   * single string; only the visual weighting is split in the renderer).
   */
  lead: string;
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
  { key: 'today', label: 'Dagens antrekk, klart hver eneste morgen', lead: 'Dagens antrekk' },
  { key: 'week', label: 'I morgen og hele neste uke, ferdig planlagt', lead: 'I morgen og hele neste uke' },
  // Sol-review P0-4 (2026-08-05): «Del med alle som passer barnet» lovet
  // deling som ikke finnes (family_sharing=false, lokal-only). Løftet byttet
  // til noe produktet faktisk leverer: egne profiler per barn (extra_children).
  { key: 'family', label: 'Egen profil for hvert av barna dine', lead: 'Egen profil' },
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
    // v2 (§8): "Du har sett dagens gratis antrekk" — samme headline uansett
    // trigger (hele-produktet-pitchen varierer aldri, se testen under).
    heading: 'Du har sett dagens gratis antrekk',
    body: 'Fortsett med Babyora for morgendagen, uken og hvert av barna dine.',
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
  const name = PLAN_ARIA_NAME[key];
  const trialSuffix = product.trialDays > 0 ? `, ${product.trialDays} dager gratis først` : '';
  if (key === 'yearly') {
    const monthlyEq = extractMonthlyEquivalent();
    const savings = computeYearlySavingsPercent();
    return `${name}, ${product.anchorPriceNok} kroner per år, tilsvarer ${monthlyEq} kroner per måned, spar ${savings} prosent${trialSuffix}`;
  }
  if (key === 'monthly') {
    return `${name}, ${product.anchorPriceNok} kroner per måned${trialSuffix}`;
  }
  // quarterly
  return `${name}, ${product.anchorPriceNok} kroner per 3 måneder${trialSuffix}`;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Betalingsvegg v2 — plan-rad-innhold, armert CTA, fornyelses-breakdown
 * (docs/mocks/monter/paywall-v2*.html + sol-duel-2026-07-31.md §8).
 * ───────────────────────────────────────────────────────────────────────── */

export type PlanRowContent = Readonly<{
  name: string;
  /** "Best verdi" for yearly, ellers null — IKKE en beregnet prosent-badge (§8: "ikke ... glød"). */
  badge: string | null;
  note: string;
  sum: string;
  per: string;
}>;

/**
 * Sub-tekst-linjen i hver plan-rad:
 *  - yearly: «25 kr per måned · spar 36 % mot månedsplan» — 25 er en
 *    AVRUNDET månedlig-ekvivalent (mock-tallet), atskilt fra den PRESISE
 *    24,90-verdien buildPlanAriaLabel/extractMonthlyEquivalent bruker (den
 *    er en LÅST a11y-kontrakt og skal ikke endres).
 *  - quarterly: «33 kr per måned» (99/3, avrundet).
 *  - monthly: «Fornyes månedlig» (statisk — ingen sammenligningstall å vise).
 */
export function buildPlanNote(key: ProductKey): string {
  const product = PRODUCTS[key];
  if (key === 'yearly') {
    const monthlyRounded = Math.round(product.anchorPriceNok / 12);
    return `${monthlyRounded} kr per måned · spar ${computeYearlySavingsPercent()} % mot månedsplan`;
  }
  if (key === 'quarterly') {
    const monthlyRounded = Math.round(product.anchorPriceNok / 3);
    return `${monthlyRounded} kr per måned`;
  }
  return 'Fornyes månedlig';
}

/** Fullt plan-rad-innhold — PaywallDialog.tsx sin eneste kilde for hva som vises i en plan-rad. */
export function buildPlanRowContent(key: ProductKey): PlanRowContent {
  const product = PRODUCTS[key];
  return {
    name: PLAN_DISPLAY_NAME[key],
    badge: key === 'yearly' ? PAYWALL_COPY.bestVerdiBadge : null,
    note: buildPlanNote(key),
    sum: `${product.anchorPriceNok} kr`,
    per: PLAN_PER_LABEL[key],
  };
}

/** Armert CTA («Start gratis – deretter 299 kr/år») — vises kun når en plan faktisk er valgt (§8: ingen forhåndsvalgt plan). */
export function buildArmedCtaLabel(key: ProductKey): string {
  return `Start gratis – deretter ${formatPlanPrice(key)}`;
}

const RENEWAL_CADENCE_LABEL: Record<ProductKey, string> = {
  yearly: 'årlig',
  quarterly: 'hvert kvartal',
  monthly: 'månedlig',
};

/** «Fornyes deretter årlig til samme pris. Avsluttes i App Store.» — plan-spesifikk fornyelses-kadens. */
export function buildRenewalNote(key: ProductKey): string {
  return `Fornyes deretter ${RENEWAL_CADENCE_LABEL[key]} til samme pris. Avsluttes i App Store.`;
}

const NORWEGIAN_MONTHS = [
  'januar', 'februar', 'mars', 'april', 'mai', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'desember',
] as const;

/** Ren dato-aritmetikk — tar imot "nå" eksplisitt (ingen skjult Date.now()-lesing) for testbarhet. */
export function computeRenewalDate(fromMs: number, trialDays: number): Date {
  return new Date(fromMs + trialDays * 24 * 60 * 60 * 1000);
}

/** «7. august» — dag + norsk måned, uten år (matcher paywall-v2-valgt.html sin `.bd-row`). */
export function formatRenewalDateLabel(date: Date): string {
  return `${date.getDate()}. ${NORWEGIAN_MONTHS[date.getMonth()]}`;
}

export type PlanBreakdown = Readonly<{
  todayLabel: string;
  todayAmount: string;
  renewalDateLabel: string;
  renewalAmount: string;
  note: string;
}>;

/**
 * «I dag: 0 kr / <fornyelsesdato>: <pris> / Fornyes deretter …» — vises kun
 * under den VALGTE raden (paywall-v2-valgt.html). `fromMs` er "i dag" sitt
 * tidspunkt, gitt eksplisitt av kalleren (PaywallDialog fanger Date.now()
 * ved åpne-overgangen — samme "adjusting state" mønster som resten av
 * dialogen, se PaywallDialog.tsx) — denne funksjonen selv leser aldri klokka.
 */
export function buildPlanBreakdown(key: ProductKey, fromMs: number): PlanBreakdown {
  const product = PRODUCTS[key];
  const renewalDate = computeRenewalDate(fromMs, product.trialDays);
  return {
    todayLabel: 'I dag',
    todayAmount: '0 kr',
    renewalDateLabel: formatRenewalDateLabel(renewalDate),
    renewalAmount: `${product.anchorPriceNok} kr`,
    note: buildRenewalNote(key),
  };
}
