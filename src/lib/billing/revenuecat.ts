/**
 * RevenueCat-wrapper.
 *
 * Eiervedtak 2026-08-14 (loop/referanse/EIERVEDTAK-BETALING-2026-08-14.md):
 *  V2: appen spør RevenueCat om PLANTYPE (månedlig/årlig), ikke Apples
 *      produkt-ID. RevenueCat-tilbudet avgjør hvilket faktisk butikk-
 *      produkt det er per plattform.
 *  V5: kjøp skal aldri feile stille. Enhver ikke-suksess returnerer en
 *      typet `reason` og en tekst kalleren kan vise brukeren; ingen
 *      `false` uten forklaring.
 *
 * RevenueCat Capacitor-pluginen håndterer iOS + Android.
 */

import { Capacitor } from '@capacitor/core';
import {
  Purchases,
  LOG_LEVEL,
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesPackage,
} from '@revenuecat/purchases-capacitor';
import { type PlanKey } from '../premium/products';

export const REVENUECAT_ENTITLEMENT_ID = 'premium';
export const REVENUECAT_OFFERING_ID = 'default';

const PUBLIC_KEY_IOS = import.meta.env.VITE_REVENUECAT_PUBLIC_KEY_IOS as string | undefined;
const PUBLIC_KEY_ANDROID = import.meta.env.VITE_REVENUECAT_PUBLIC_KEY_ANDROID as string | undefined;

let initialized = false;

/** Sjekk om RevenueCat er konfigurert (API-keys i env). */
export function isRevenueCatConfigured(): boolean {
  return Boolean(PUBLIC_KEY_IOS || PUBLIC_KEY_ANDROID);
}

/** Initialiser RevenueCat. Kalles én gang ved app-start. */
export async function initRevenueCat(userId?: string): Promise<void> {
  if (initialized || !isRevenueCatConfigured()) return;
  if (!Capacitor.isNativePlatform()) return; // RevenueCat-plugin er native-only

  const apiKey = Capacitor.getPlatform() === 'ios' ? PUBLIC_KEY_IOS : PUBLIC_KEY_ANDROID;
  if (!apiKey) return;

  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.WARN });
    await Purchases.configure({ apiKey, appUserID: userId ?? null });
    initialized = true;
  } catch {
    console.error('[Babyora] RevenueCat init feilet');
  }
}

/** Sjekk om bruker har aktiv Premium-entitlement. */
export async function checkPremium(): Promise<boolean> {
  if (!initialized || !Capacitor.isNativePlatform()) return false;
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return Boolean(customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID]);
  } catch {
    console.error('[Babyora] checkPremium feilet');
    return false;
  }
}

/** Hent det kontraktsfestede standardtilbudet fra App Store / Play. */
export async function getOfferings() {
  if (!initialized || !Capacitor.isNativePlatform()) return null;
  try {
    const { all } = await Purchases.getOfferings();
    return all[REVENUECAT_OFFERING_ID] ?? null;
  } catch {
    console.error('[Babyora] getOfferings feilet');
    return null;
  }
}

/**
 * Alle kjøpsutfall har en diskriminerende status. Ikke-suksess får i tillegg
 * en typet grunn og en tekst PaywallDialog kan vise uten å tolke SDK-feil.
 */
export type PurchaseUnavailableReason =
  | 'not_configured'
  | 'no_offering'
  | 'plan_unavailable'
  | 'store_unavailable';

export type PurchasePendingReason = 'payment_pending' | 'purchase_in_progress';

export type PurchaseReason =
  | PurchaseUnavailableReason
  | PurchasePendingReason
  | 'no_entitlement'
  | 'user_cancelled'
  | 'store_error';

export type PurchaseResult =
  | { status: 'success'; customerInfo: CustomerInfo }
  | { status: 'cancelled'; reason: 'user_cancelled'; message: string }
  | { status: 'pending'; reason: PurchasePendingReason; message: string }
  | { status: 'unavailable'; reason: PurchaseUnavailableReason; message: string }
  | { status: 'entitlement_missing'; reason: 'no_entitlement'; message: string }
  | { status: 'error'; reason: 'store_error'; message: string };

const REASON_MESSAGE: Record<PurchaseReason, string> = {
  not_configured:
    'Kjøp er ikke aktivert i denne versjonen. Åpne appen fra App Store eller Google Play for å kjøpe.',
  no_offering:
    'Kunne ikke hente prisene fra butikken. Sjekk nettilkoblingen og prøv igjen.',
  plan_unavailable:
    'Denne planen er ikke tilgjengelig i butikken akkurat nå. Prøv en annen plan, eller kom tilbake senere.',
  store_unavailable:
    'Butikken tillater ikke dette kjøpet akkurat nå. Sjekk kontoen din, eller prøv igjen senere.',
  no_entitlement:
    'Kjøpet ble registrert, men vi fant ikke tilgangen din. Prøv å gjenopprette kjøp, eller kontakt support.',
  user_cancelled: 'Kjøpet ble avbrutt.',
  payment_pending:
    'Kjøpet venter på godkjenning. Tilgangen aktiveres automatisk når betalingen er godkjent.',
  purchase_in_progress: 'Et kjøp behandles allerede. Vent til butikkvinduet er ferdig.',
  store_error:
    'Noe gikk galt under kjøpet. Prøv igjen, eller sjekk nettilkoblingen din.',
};

function unavailable(reason: PurchaseUnavailableReason): PurchaseResult {
  return { status: 'unavailable', reason, message: REASON_MESSAGE[reason] };
}

function pending(reason: PurchasePendingReason): PurchaseResult {
  return { status: 'pending', reason, message: REASON_MESSAGE[reason] };
}

function purchaseErrorCode(error: unknown): PURCHASES_ERROR_CODE | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const code = (error as Partial<PurchasesError>).code;
  return typeof code === 'string' ? code : undefined;
}

/**
 * Plan-nøkkel → RevenueCat package_type. Legges ikke til før eier har vedtatt
 * en ny plan-type. Eksportert slik at V1-testen kan bekrefte at kvartal er
 * borte fra runtime-tabellen (ikke bare fra TS-unionen).
 */
export const PLAN_TO_PACKAGE_TYPE: Record<PlanKey, string> = {
  yearly: PACKAGE_TYPE.ANNUAL,
  monthly: PACKAGE_TYPE.MONTHLY,
};

/**
 * Kjøp en plan (V2: plantype, ikke Apple-produkt-ID). Finner riktig pakke i
 * det aktive tilbudet via `packageType` og gjennomfører kjøpet. Enhver ikke-
 * suksess får en typet grunn og en brukervendt tekst.
 */
let purchaseInFlight: Promise<PurchaseResult> | null = null;

async function performPurchase(plan: PlanKey): Promise<PurchaseResult> {
  if (!initialized || !Capacitor.isNativePlatform()) {
    console.error('[Babyora] purchasePlan: RevenueCat ikke initialisert (native only)');
    return unavailable('not_configured');
  }

  // getOfferings() fanger sine egne feil og returnerer null — én sti holder.
  const offering = await getOfferings();
  if (!offering) {
    console.error('[Babyora] purchasePlan: no_offering (intet aktivt tilbud i RevenueCat)');
    return unavailable('no_offering');
  }

  const wantedType = PLAN_TO_PACKAGE_TYPE[plan];
  const pkg: PurchasesPackage | undefined = offering.availablePackages.find(
    (p) => p.packageType === wantedType,
  );

  if (!pkg) {
    console.error(
      `[Babyora] purchasePlan: fant ingen pakke med packageType=${wantedType} for plan=${plan} i tilbud=${offering.identifier}`,
    );
    return unavailable('plan_unavailable');
  }

  let customerInfo: CustomerInfo;
  try {
    const result = await Purchases.purchasePackage({ aPackage: pkg });
    customerInfo = result.customerInfo;
  } catch (err: unknown) {
    const code = purchaseErrorCode(err);
    const legacyUserCancelled = (err as { userCancelled?: boolean })?.userCancelled === true;
    if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR || legacyUserCancelled) {
      return {
        status: 'cancelled',
        reason: 'user_cancelled',
        message: REASON_MESSAGE.user_cancelled,
      };
    }
    if (code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
      return pending('payment_pending');
    }
    if (code === PURCHASES_ERROR_CODE.OPERATION_ALREADY_IN_PROGRESS_ERROR) {
      return pending('purchase_in_progress');
    }
    if (
      code === PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR ||
      code === PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR
    ) {
      return unavailable('store_unavailable');
    }
    console.error(
      `[Babyora] purchasePlan: butikk-kall feilet (code=${code ?? 'unknown'})`,
    );
    return { status: 'error', reason: 'store_error', message: REASON_MESSAGE.store_error };
  }

  if (!customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID]) {
    console.error('[Babyora] purchasePlan: kjøp gjennomført, men entitlement mangler');
    return {
      status: 'entitlement_missing',
      reason: 'no_entitlement',
      message: REASON_MESSAGE.no_entitlement,
    };
  }

  return { status: 'success', customerInfo };
}

/** Kjøp én plan. Samtidige kall avvises før et nytt butikk-kall kan starte. */
export function purchasePlan(plan: PlanKey): Promise<PurchaseResult> {
  if (purchaseInFlight) {
    return Promise.resolve(pending('purchase_in_progress'));
  }

  const attempt = performPurchase(plan);
  purchaseInFlight = attempt;
  return attempt.finally(() => {
    if (purchaseInFlight === attempt) purchaseInFlight = null;
  });
}

/** Restore-funksjon — kalles fra paywall hvis bruker har kjøpt før. */
export async function restorePurchases(): Promise<boolean> {
  if (!initialized || !Capacitor.isNativePlatform()) return false;
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    return Boolean(customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID]);
  } catch {
    console.error('[Babyora] restorePurchases feilet');
    return false;
  }
}
