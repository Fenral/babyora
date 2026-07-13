/**
 * RevenueCat-wrapper for Babyora.
 *
 * Iter 31: kobler `useAccess` til faktiske abonnementer når RevenueCat
 * API-keys er konfigurert. Fallback: localStorage-mock (trial-modus).
 *
 * Setup:
 * 1. Opprett konto på https://app.revenuecat.com/
 * 2. Sett `VITE_REVENUECAT_PUBLIC_KEY_IOS` og `_ANDROID` i .env
 * 3. Opprett products i App Store Connect + Play Console:
 *    - klemeg.monthly  (Apple ID + Play SKU)
 *    - klemeg.quarterly
 *    - klemeg.yearly
 * 4. Map products til Babyora-pricing-IDs i RevenueCat-dashbord
 * 5. Opprett ett entitlement "premium" som tildeles alle 3 plans
 *
 * Følger Ryddy-mønsteret. RevenueCat Capacitor-plugin håndterer både
 * iOS StoreKit og Android Billing automatisk.
 */

import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL, type CustomerInfo } from '@revenuecat/purchases-capacitor';

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

/** Kjøp ett produkt — kalles fra PaywallScreen ved valg av plan. */
export async function purchasePackage(packageId: string): Promise<{ success: boolean; customerInfo?: CustomerInfo }> {
  if (!initialized || !Capacitor.isNativePlatform()) {
    return { success: false };
  }
  try {
    const offerings = await getOfferings();
    if (!offerings) return { success: false };

    const pkg = offerings.availablePackages.find(
      (p) => p.identifier === packageId || p.product.identifier === packageId,
    );
    if (!pkg) return { success: false };

    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    return {
      success: Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID]),
      customerInfo,
    };
  } catch (err: unknown) {
    const userCanceled = (err as { userCancelled?: boolean })?.userCancelled;
    if (!userCanceled) console.error('[Babyora] purchasePackage feilet', err);
    return { success: false };
  }
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
