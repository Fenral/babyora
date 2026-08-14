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
  type CustomerInfo,
  type PurchasesPackage,
} from '@revenuecat/purchases-capacitor';
import { type PlanKey } from '../premium/products';

const ENTITLEMENT_ID = 'premium';

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
  } catch (err) {
    console.error('[Babyora] RevenueCat init feilet', err);
  }
}

/** Sjekk om bruker har aktiv Premium-entitlement. */
export async function checkPremium(): Promise<boolean> {
  if (!initialized || !Capacitor.isNativePlatform()) return false;
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID]);
  } catch (err) {
    console.error('[Babyora] checkPremium feilet', err);
    return false;
  }
}

/** Hent tilgjengelige tilbud (products fra App Store / Play). */
export async function getOfferings() {
  if (!initialized || !Capacitor.isNativePlatform()) return null;
  try {
    const { current } = await Purchases.getOfferings();
    return current ?? null;
  } catch (err) {
    console.error('[Babyora] getOfferings feilet', err);
    return null;
  }
}

/**
 * Feilgrunner et kjøp kan strande på — V5-krav: hver grunn har en typet
 * kode PaywallDialog kan slå opp en brukervendt tekst for. Byggeren av
 * `purchasePlan` skal aldri returnere `{ success: false }` uten en grunn.
 */
export type PurchaseFailureReason =
  | 'not_configured'
  | 'no_offering'
  | 'plan_unavailable'
  | 'no_entitlement'
  | 'user_cancelled'
  | 'store_error';

export type PurchaseResult =
  | { success: true; customerInfo: CustomerInfo }
  | { success: false; reason: PurchaseFailureReason; message: string };

const REASON_MESSAGE: Record<PurchaseFailureReason, string> = {
  not_configured:
    'Kjøp er ikke aktivert i denne versjonen. Åpne appen fra App Store eller Google Play for å kjøpe.',
  no_offering:
    'Kunne ikke hente prisene fra butikken. Sjekk nettilkoblingen og prøv igjen.',
  plan_unavailable:
    'Denne planen er ikke tilgjengelig i butikken akkurat nå. Prøv en annen plan, eller kom tilbake senere.',
  no_entitlement:
    'Kjøpet ble registrert, men vi fant ikke tilgangen din. Prøv å gjenopprette kjøp, eller kontakt support.',
  user_cancelled: 'Kjøpet ble avbrutt.',
  store_error:
    'Noe gikk galt under kjøpet. Prøv igjen, eller sjekk nettilkoblingen din.',
};

function fail(reason: PurchaseFailureReason): PurchaseResult {
  return { success: false, reason, message: REASON_MESSAGE[reason] };
}

/** Plan-nøkkel → RevenueCat package_type. Legges ikke til før eier har vedtatt en ny plan-type. */
const PLAN_TO_PACKAGE_TYPE: Record<PlanKey, string> = {
  yearly: PACKAGE_TYPE.ANNUAL,
  monthly: PACKAGE_TYPE.MONTHLY,
};

/**
 * Kjøp en plan (V2: plantype, ikke Apple-produkt-ID). Finner riktig pakke i
 * det aktive tilbudet via `packageType` og gjennomfører kjøpet. Enhver ikke-
 * suksess får en typet grunn og en brukervendt tekst.
 */
export async function purchasePlan(plan: PlanKey): Promise<PurchaseResult> {
  if (!initialized || !Capacitor.isNativePlatform()) {
    console.error('[Babyora] purchasePlan: RevenueCat ikke initialisert (native only)');
    return fail('not_configured');
  }

  let offering;
  try {
    offering = await getOfferings();
  } catch (err) {
    console.error('[Babyora] purchasePlan: no_offering (getOfferings kastet)', err);
    return fail('no_offering');
  }
  if (!offering) {
    console.error('[Babyora] purchasePlan: no_offering (intet aktivt tilbud i RevenueCat)');
    return fail('no_offering');
  }

  const wantedType = PLAN_TO_PACKAGE_TYPE[plan];
  const pkg: PurchasesPackage | undefined = offering.availablePackages.find(
    (p) => p.packageType === wantedType,
  );

  if (!pkg) {
    console.error(
      `[Babyora] purchasePlan: fant ingen pakke med packageType=${wantedType} for plan=${plan} i tilbud=${offering.identifier}`,
    );
    return fail('plan_unavailable');
  }

  let customerInfo: CustomerInfo;
  try {
    const result = await Purchases.purchasePackage({ aPackage: pkg });
    customerInfo = result.customerInfo;
  } catch (err: unknown) {
    const userCanceled = (err as { userCancelled?: boolean })?.userCancelled;
    if (userCanceled) {
      return fail('user_cancelled');
    }
    console.error('[Babyora] purchasePlan: butikk-kall feilet', err);
    return fail('store_error');
  }

  if (!customerInfo.entitlements.active[ENTITLEMENT_ID]) {
    console.error(
      '[Babyora] purchasePlan: kjøp gjennomført, men entitlement mangler',
      customerInfo,
    );
    return { success: false, reason: 'no_entitlement', message: REASON_MESSAGE.no_entitlement };
  }

  return { success: true, customerInfo };
}

/** Restore-funksjon — kalles fra paywall hvis bruker har kjøpt før. */
export async function restorePurchases(): Promise<boolean> {
  if (!initialized || !Capacitor.isNativePlatform()) return false;
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    return Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID]);
  } catch (err) {
    console.error('[Babyora] restorePurchases feilet', err);
    return false;
  }
}
