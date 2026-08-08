import {
  PRODUCTS,
  type ProductKey,
} from '../lib/premium/products.js';

export type PaywallLanguage = 'da' | 'en' | 'no' | 'sv';

export const LOCALIZED_PLAN_ORDER = Object.freeze([
  'yearly',
  'quarterly',
  'monthly',
] as const satisfies readonly ProductKey[]);

export type LocalizedPaywallPreviewItem = Readonly<{
  key: string;
  label: string;
  lead: string;
}>;

export type LocalizedPlanRow = Readonly<{
  name: string;
  badge: string | null;
  note: string;
  sum: string;
  per: string;
}>;

export type LocalizedPlanBreakdown = Readonly<{
  todayLabel: string;
  todayAmount: string;
  renewalDateLabel: string;
  renewalAmount: string;
  note: string;
}>;

type PlanCopy = Readonly<{
  name: string;
  ariaName: string;
  per: string;
  note: (monthlyPrice: number, savingPercent: number) => string;
  cadence: string;
  priceAria: (price: number) => string;
  ctaPrice: (price: number) => string;
}>;

type PaywallStaticCopy = Readonly<{
  locale: string;
  closeLabel: string;
  sheetAriaLabel: string;
  legend: string;
  breakdownAriaPrefix: string;
  bestValueBadge: string;
  chooseHintDefault: string;
  chooseHintSelected: string;
  ctaPending: string;
  ctaResting: string;
  statusProcessing: string;
  statusActivated: string;
  statusActivatedTestmode: string;
  statusRestoreChecking: string;
  statusNoRestore: string;
  errorPurchaseFailed: string;
  errorPurchaseException: string;
  errorRestoreDevOnly: string;
  errorRestoreException: string;
  restoreLabel: string;
  privacyLinkLabel: string;
  privacyLinkAriaLabel: string;
  termsLinkLabel: string;
  termsLinkAriaLabel: string;
  capability: Readonly<{
    heading: string;
    body: string;
    previewItems: readonly LocalizedPaywallPreviewItem[];
  }>;
  plan: Readonly<Record<ProductKey, PlanCopy>>;
  trialSuffix: (days: number) => string;
  yearlyEquivalent: (amount: string) => string;
  yearlySaving: (percent: number) => string;
  quarterlyPeriod: (price: number) => string;
  armedCta: (price: string) => string;
  today: string;
  renewalNote: (cadence: string) => string;
}>;

export type PaywallLocalizer = Readonly<{
  text: PaywallStaticCopy;
  planRow: (key: ProductKey) => LocalizedPlanRow;
  planAriaLabel: (key: ProductKey) => string;
  armedCtaLabel: (key: ProductKey) => string;
  planBreakdown: (key: ProductKey, fromMs: number) => LocalizedPlanBreakdown;
}>;

function yearlySavingsPercent(): number {
  const yearly = PRODUCTS.yearly.anchorPriceNok;
  const monthlyAnnualized = PRODUCTS.monthly.anchorPriceNok * 12;
  if (monthlyAnnualized <= 0) return 0;
  return Math.round((1 - yearly / monthlyAnnualized) * 100);
}

function monthlyEquivalent(language: PaywallLanguage): string {
  const source = PRODUCTS.yearly.description?.match(/[\d,]+/u)?.[0]
    ?? (PRODUCTS.yearly.anchorPriceNok / 12).toFixed(2);
  return language === 'en' ? source.replace(',', '.') : source.replace('.', ',');
}

function renewalDate(fromMs: number, trialDays: number): Date {
  return new Date(fromMs + trialDays * 24 * 60 * 60 * 1000);
}

function makeLocalizer(
  language: PaywallLanguage,
  text: PaywallStaticCopy,
): PaywallLocalizer {
  const planRow = (key: ProductKey): LocalizedPlanRow => {
    const product = PRODUCTS[key];
    const words = text.plan[key];
    const divisor = key === 'yearly' ? 12 : key === 'quarterly' ? 3 : 1;
    return {
      name: words.name,
      badge: key === 'yearly' ? text.bestValueBadge : null,
      note: words.note(
        Math.round(product.anchorPriceNok / divisor),
        yearlySavingsPercent(),
      ),
      sum: `${product.anchorPriceNok} kr`,
      per: words.per,
    };
  };

  const planAriaLabel = (key: ProductKey): string => {
    const product = PRODUCTS[key];
    const words = text.plan[key];
    const trial = product.trialDays > 0 ? text.trialSuffix(product.trialDays) : '';
    if (key === 'yearly') {
      return [
        words.ariaName,
        words.priceAria(product.anchorPriceNok),
        text.yearlyEquivalent(monthlyEquivalent(language)),
        text.yearlySaving(yearlySavingsPercent()),
      ].join(', ') + trial;
    }
    if (key === 'quarterly') {
      return `${words.ariaName}, ${text.quarterlyPeriod(product.anchorPriceNok)}${trial}`;
    }
    return `${words.ariaName}, ${words.priceAria(product.anchorPriceNok)}${trial}`;
  };

  const armedCtaLabel = (key: ProductKey): string => {
    const product = PRODUCTS[key];
    return text.armedCta(text.plan[key].ctaPrice(product.anchorPriceNok));
  };

  const planBreakdown = (key: ProductKey, fromMs: number): LocalizedPlanBreakdown => {
    const product = PRODUCTS[key];
    const date = renewalDate(fromMs, product.trialDays);
    return {
      todayLabel: text.today,
      todayAmount: '0 kr',
      renewalDateLabel: new Intl.DateTimeFormat(text.locale, {
        day: 'numeric',
        month: 'long',
      }).format(date),
      renewalAmount: `${product.anchorPriceNok} kr`,
      note: text.renewalNote(text.plan[key].cadence),
    };
  };

  return Object.freeze({ text, planRow, planAriaLabel, armedCtaLabel, planBreakdown });
}

const ENGLISH_TEXT = {
  locale: 'en-GB',
  closeLabel: 'Close',
  sheetAriaLabel: 'Continue with Babyora',
  legend: 'Choose a plan',
  breakdownAriaPrefix: 'Price details for',
  bestValueBadge: 'Best value',
  chooseHintDefault: 'Every plan starts with 7 free days. Choose the plan that suits you.',
  chooseHintSelected: 'Every plan starts with 7 free days.',
  ctaPending: 'Processing …',
  ctaResting: 'Choose a plan to start free',
  statusProcessing: 'Processing purchase …',
  statusActivated: 'Babyora Plus activated.',
  statusActivatedTestmode: 'Babyora Plus activated (test mode).',
  statusRestoreChecking: 'Checking previous purchases …',
  statusNoRestore: 'No active purchases were found to restore.',
  errorPurchaseFailed: 'The purchase was not completed. Try again or check your internet connection.',
  errorPurchaseException: 'Something went wrong during the purchase. Try again.',
  errorRestoreDevOnly: 'Restore works after a real purchase in the App Store or Google Play.',
  errorRestoreException: 'Could not restore right now. Check your internet connection and try again.',
  restoreLabel: 'Restore purchases',
  privacyLinkLabel: 'Privacy',
  privacyLinkAriaLabel: 'Privacy policy (opens in browser)',
  termsLinkLabel: 'Terms',
  termsLinkAriaLabel: 'Terms of use (opens in browser)',
  capability: {
    heading: 'You’ve seen today’s free outfit',
    body: 'Continue with Babyora for tomorrow and each of your children.',
    previewItems: [
      { key: 'today', label: 'Today’s outfit, ready every morning', lead: 'Today’s outfit' },
      { key: 'tomorrow', label: 'Tomorrow’s outfit, ready the night before', lead: 'Tomorrow’s outfit' },
      { key: 'family', label: 'A separate profile for each of your children', lead: 'A separate profile' },
    ],
  },
  plan: {
    yearly: {
      name: 'Yearly', ariaName: 'Yearly', per: 'per year', cadence: 'yearly',
      note: (monthlyPrice, saving) => `${monthlyPrice} kr per month · save ${saving}% compared with monthly`,
      priceAria: (price) => `${price} Norwegian kroner per year`,
      ctaPrice: (price) => `${price} kr/year`,
    },
    quarterly: {
      name: 'Quarterly', ariaName: '3 months', per: 'per quarter', cadence: 'every quarter',
      note: (monthlyPrice) => `${monthlyPrice} kr per month`,
      priceAria: (price) => `${price} Norwegian kroner per quarter`,
      ctaPrice: (price) => `${price} kr/3 months`,
    },
    monthly: {
      name: 'Monthly', ariaName: 'Monthly', per: 'per month', cadence: 'monthly',
      note: () => 'Renews monthly',
      priceAria: (price) => `${price} Norwegian kroner per month`,
      ctaPrice: (price) => `${price} kr/month`,
    },
  },
  trialSuffix: (days) => `, ${days} free days first`,
  yearlyEquivalent: (amount) => `equivalent to ${amount} Norwegian kroner per month`,
  yearlySaving: (percent) => `save ${percent} percent`,
  quarterlyPeriod: (price) => `${price} Norwegian kroner per 3 months`,
  armedCta: (price) => `Start free – then ${price}`,
  today: 'Today',
  renewalNote: (cadence) => `Then renews ${cadence} at the same price. Cancel in the App Store.`,
} satisfies PaywallStaticCopy;

const SWEDISH_TEXT = {
  locale: 'sv-SE',
  closeLabel: 'Stäng',
  sheetAriaLabel: 'Fortsätt med Babyora',
  legend: 'Välj plan',
  breakdownAriaPrefix: 'Prisöversikt för',
  bestValueBadge: 'Bäst värde',
  chooseHintDefault: 'Alla planer börjar med 7 gratisdagar. Välj planen som passar er.',
  chooseHintSelected: 'Alla planer börjar med 7 gratisdagar.',
  ctaPending: 'Behandlar …',
  ctaResting: 'Välj en plan för att börja gratis',
  statusProcessing: 'Behandlar köpet …',
  statusActivated: 'Babyora Plus har aktiverats.',
  statusActivatedTestmode: 'Babyora Plus har aktiverats (testläge).',
  statusRestoreChecking: 'Kontrollerar tidigare köp …',
  statusNoRestore: 'Hittade inga aktiva köp att återställa.',
  errorPurchaseFailed: 'Köpet slutfördes inte. Försök igen eller kontrollera internetanslutningen.',
  errorPurchaseException: 'Något gick fel under köpet. Försök igen.',
  errorRestoreDevOnly: 'Återställning fungerar efter ett riktigt köp i App Store eller Google Play.',
  errorRestoreException: 'Det gick inte att återställa just nu. Kontrollera internetanslutningen och försök igen.',
  restoreLabel: 'Återställ köp',
  privacyLinkLabel: 'Integritet',
  privacyLinkAriaLabel: 'Integritetspolicy (öppnas i webbläsaren)',
  termsLinkLabel: 'Villkor',
  termsLinkAriaLabel: 'Användarvillkor (öppnas i webbläsaren)',
  capability: {
    heading: 'Du har sett dagens kostnadsfria kläder',
    body: 'Fortsätt med Babyora för morgondagen och vart och ett av dina barn.',
    previewItems: [
      { key: 'today', label: 'Dagens kläder, klara varje morgon', lead: 'Dagens kläder' },
      { key: 'tomorrow', label: 'Morgondagens kläder, klara kvällen före', lead: 'Morgondagens kläder' },
      { key: 'family', label: 'En egen profil för vart och ett av dina barn', lead: 'En egen profil' },
    ],
  },
  plan: {
    yearly: {
      name: 'Årsvis', ariaName: 'Årsvis', per: 'per år', cadence: 'årsvis',
      note: (monthlyPrice, saving) => `${monthlyPrice} kr per månad · spara ${saving}% jämfört med månadsplanen`,
      priceAria: (price) => `${price} kronor per år`,
      ctaPrice: (price) => `${price} kr/år`,
    },
    quarterly: {
      name: 'Kvartal', ariaName: '3 månader', per: 'per kvartal', cadence: 'varje kvartal',
      note: (monthlyPrice) => `${monthlyPrice} kr per månad`,
      priceAria: (price) => `${price} kronor per kvartal`,
      ctaPrice: (price) => `${price} kr/3 månader`,
    },
    monthly: {
      name: 'Månadsvis', ariaName: 'Månadsvis', per: 'per månad', cadence: 'månadsvis',
      note: () => 'Förnyas varje månad',
      priceAria: (price) => `${price} kronor per månad`,
      ctaPrice: (price) => `${price} kr/månad`,
    },
  },
  trialSuffix: (days) => `, först ${days} gratisdagar`,
  yearlyEquivalent: (amount) => `motsvarar ${amount} kronor per månad`,
  yearlySaving: (percent) => `spara ${percent} procent`,
  quarterlyPeriod: (price) => `${price} kronor per 3 månader`,
  armedCta: (price) => `Börja gratis – därefter ${price}`,
  today: 'I dag',
  renewalNote: (cadence) => `Förnyas därefter ${cadence} till samma pris. Avslutas i App Store.`,
} satisfies PaywallStaticCopy;

const DANISH_TEXT = {
  locale: 'da-DK',
  closeLabel: 'Luk',
  sheetAriaLabel: 'Fortsæt med Babyora',
  legend: 'Vælg plan',
  breakdownAriaPrefix: 'Prisoversigt for',
  bestValueBadge: 'Bedste værdi',
  chooseHintDefault: 'Alle planer starter med 7 gratisdage. Vælg den plan, der passer jer.',
  chooseHintSelected: 'Alle planer starter med 7 gratisdage.',
  ctaPending: 'Behandler …',
  ctaResting: 'Vælg en plan for at starte gratis',
  statusProcessing: 'Behandler købet …',
  statusActivated: 'Babyora Plus er aktiveret.',
  statusActivatedTestmode: 'Babyora Plus er aktiveret (testtilstand).',
  statusRestoreChecking: 'Kontrollerer tidligere køb …',
  statusNoRestore: 'Fandt ingen aktive køb at gendanne.',
  errorPurchaseFailed: 'Købet blev ikke gennemført. Prøv igen, eller kontroller din internetforbindelse.',
  errorPurchaseException: 'Noget gik galt under købet. Prøv igen.',
  errorRestoreDevOnly: 'Gendannelse virker efter et rigtigt køb i App Store eller Google Play.',
  errorRestoreException: 'Kunne ikke gendanne lige nu. Kontroller internetforbindelsen, og prøv igen.',
  restoreLabel: 'Gendan køb',
  privacyLinkLabel: 'Privatliv',
  privacyLinkAriaLabel: 'Privatlivspolitik (åbnes i browseren)',
  termsLinkLabel: 'Vilkår',
  termsLinkAriaLabel: 'Brugsvilkår (åbnes i browseren)',
  capability: {
    heading: 'Du har set dagens gratis tøj',
    body: 'Fortsæt med Babyora til i morgen og til hvert af dine børn.',
    previewItems: [
      { key: 'today', label: 'Dagens tøj, klart hver morgen', lead: 'Dagens tøj' },
      { key: 'tomorrow', label: 'Morgendagens tøj, klart aftenen før', lead: 'Morgendagens tøj' },
      { key: 'family', label: 'En særskilt profil til hvert af dine børn', lead: 'En særskilt profil' },
    ],
  },
  plan: {
    yearly: {
      name: 'Årlig', ariaName: 'Årlig', per: 'om året', cadence: 'årligt',
      note: (monthlyPrice, saving) => `${monthlyPrice} kr om måneden · spar ${saving}% i forhold til månedsplanen`,
      priceAria: (price) => `${price} kroner om året`,
      ctaPrice: (price) => `${price} kr/år`,
    },
    quarterly: {
      name: 'Kvartal', ariaName: '3 måneder', per: 'per kvartal', cadence: 'hvert kvartal',
      note: (monthlyPrice) => `${monthlyPrice} kr om måneden`,
      priceAria: (price) => `${price} kroner per kvartal`,
      ctaPrice: (price) => `${price} kr/3 måneder`,
    },
    monthly: {
      name: 'Månedlig', ariaName: 'Månedlig', per: 'om måneden', cadence: 'månedligt',
      note: () => 'Fornyes hver måned',
      priceAria: (price) => `${price} kroner om måneden`,
      ctaPrice: (price) => `${price} kr/måned`,
    },
  },
  trialSuffix: (days) => `, først ${days} gratisdage`,
  yearlyEquivalent: (amount) => `svarer til ${amount} kroner om måneden`,
  yearlySaving: (percent) => `spar ${percent} procent`,
  quarterlyPeriod: (price) => `${price} kroner per 3 måneder`,
  armedCta: (price) => `Start gratis – derefter ${price}`,
  today: 'I dag',
  renewalNote: (cadence) => `Fornyes derefter ${cadence} til samme pris. Opsiges i App Store.`,
} satisfies PaywallStaticCopy;

const NORWEGIAN_TEXT = {
  locale: 'nb-NO',
  closeLabel: 'Lukk',
  sheetAriaLabel: 'Fortsett med Babyora',
  legend: 'Velg plan',
  breakdownAriaPrefix: 'Prisoversikt for',
  bestValueBadge: 'Best verdi',
  chooseHintDefault: 'Alle planer starter med 7 gratisdager. Velg planen som passer dere.',
  chooseHintSelected: 'Alle planer starter med 7 gratisdager.',
  ctaPending: 'Behandler …',
  ctaResting: 'Velg en plan for å starte gratis',
  statusProcessing: 'Behandler kjøp …',
  statusActivated: 'Babyora Pluss aktivert.',
  statusActivatedTestmode: 'Babyora Pluss aktivert (testmodus).',
  statusRestoreChecking: 'Sjekker tidligere kjøp …',
  statusNoRestore: 'Fant ingen aktive kjøp å gjenopprette.',
  errorPurchaseFailed: 'Kjøpet ble ikke fullført. Prøv igjen, eller sjekk nettilkoblingen din.',
  errorPurchaseException: 'Noe gikk galt under kjøpet. Prøv igjen.',
  errorRestoreDevOnly: 'Gjenoppretting fungerer først etter et ekte kjøp i App Store eller Google Play.',
  errorRestoreException: 'Kunne ikke gjenopprette akkurat nå. Sjekk nettilkoblingen og prøv igjen.',
  restoreLabel: 'Gjenopprett kjøp',
  privacyLinkLabel: 'Personvern',
  privacyLinkAriaLabel: 'Personvernerklæring (åpnes i nettleser)',
  termsLinkLabel: 'Vilkår',
  termsLinkAriaLabel: 'Vilkår for bruk (åpnes i nettleser)',
  capability: {
    heading: 'Du har sett dagens gratis antrekk',
    body: 'Fortsett med Babyora for morgendagen og hvert av barna dine.',
    previewItems: [
      { key: 'today', label: 'Dagens antrekk, klart hver eneste morgen', lead: 'Dagens antrekk' },
      { key: 'tomorrow', label: 'Morgendagens antrekk, klart kvelden før', lead: 'Morgendagens antrekk' },
      { key: 'family', label: 'Egen profil for hvert av barna dine', lead: 'Egen profil' },
    ],
  },
  plan: {
    yearly: {
      name: 'Årlig', ariaName: 'Årlig', per: 'per år', cadence: 'årlig',
      note: (monthlyPrice, saving) => `${monthlyPrice} kr per måned · spar ${saving} % mot månedsplan`,
      priceAria: (price) => `${price} kroner per år`,
      ctaPrice: (price) => `${price} kr/år`,
    },
    quarterly: {
      name: 'Kvartal', ariaName: '3 måneder', per: 'per kvartal', cadence: 'hvert kvartal',
      note: (monthlyPrice) => `${monthlyPrice} kr per måned`,
      priceAria: (price) => `${price} kroner per kvartal`,
      ctaPrice: (price) => `${price} kr/3 mnd`,
    },
    monthly: {
      name: 'Månedlig', ariaName: 'Månedlig', per: 'per måned', cadence: 'månedlig',
      note: () => 'Fornyes månedlig',
      priceAria: (price) => `${price} kroner per måned`,
      ctaPrice: (price) => `${price} kr/mnd`,
    },
  },
  trialSuffix: (days) => `, ${days} dager gratis først`,
  yearlyEquivalent: (amount) => `tilsvarer ${amount} kroner per måned`,
  yearlySaving: (percent) => `spar ${percent} prosent`,
  quarterlyPeriod: (price) => `${price} kroner per 3 måneder`,
  armedCta: (price) => `Start gratis – deretter ${price}`,
  today: 'I dag',
  renewalNote: (cadence) => `Fornyes deretter ${cadence} til samme pris. Avsluttes i App Store.`,
} satisfies PaywallStaticCopy;

const LOCALIZERS: Readonly<Record<PaywallLanguage, PaywallLocalizer>> = Object.freeze({
  en: makeLocalizer('en', ENGLISH_TEXT),
  sv: makeLocalizer('sv', SWEDISH_TEXT),
  da: makeLocalizer('da', DANISH_TEXT),
  no: makeLocalizer('no', NORWEGIAN_TEXT),
});

/** German and unknown languages intentionally use the English fallback. */
export function resolvePaywallLanguage(language: unknown): PaywallLanguage {
  if (typeof language !== 'string') return 'en';
  const base = language.trim().toLowerCase().split(/[-_]/u, 1)[0];
  if (base === 'nb' || base === 'nn') return 'no';
  if (base === 'sv' || base === 'da' || base === 'no') return base;
  return 'en';
}

export function paywallCopyFor(language: unknown): PaywallLocalizer {
  return LOCALIZERS[resolvePaywallLanguage(language)];
}
