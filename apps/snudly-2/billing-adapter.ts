import {
  checkPremium,
  getStoreOfferSnapshot,
  initRevenueCat,
  purchasePlan,
  restorePurchases,
  type PurchaseReason,
} from '../../src/lib/billing/revenuecat';
import type { PlanKey } from '../../src/lib/premium/products';

export type ProductKey = PlanKey;

export type VerifiedStoreTrial = Readonly<{
  unit: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
  value: number;
}>;

export type StorePlanDetails = Readonly<{
  priceString: string;
  pricePerMonthString: string | null;
  trial: VerifiedStoreTrial | null;
}>;

export type StorePlans = Readonly<Record<ProductKey, StorePlanDetails | null>>;

export type BillingSnapshot = Readonly<{
  entitlementActive: boolean;
  plans: StorePlans;
}>;

const EMPTY_PLANS: StorePlans = { yearly: null, monthly: null };

export async function loadBillingSnapshot(): Promise<BillingSnapshot> {
  try {
    await initRevenueCat();
    const [entitlement, offering] = await Promise.all([checkPremium(), getStoreOfferSnapshot()]);
    const plans = offering.status === 'ready'
      ? {
          yearly: { ...offering.plans.yearly, trial: null },
          monthly: { ...offering.plans.monthly, trial: null },
        }
      : EMPTY_PLANS;
    return { entitlementActive: entitlement.status === 'active', plans };
  } catch {
    return { entitlementActive: false, plans: EMPTY_PLANS };
  }
}

export async function purchaseVerifiedPlan(
  plan: ProductKey,
  details: StorePlanDetails | null,
): Promise<{ success: true } | { success: false; reason: PurchaseReason }> {
  if (!details) return { success: false, reason: 'plan_unavailable' };
  const result = await purchasePlan(plan);
  if (result.status === 'success') return { success: true };
  return { success: false, reason: result.reason };
}

export async function restoreVerifiedPurchase(): Promise<boolean> {
  return (await restorePurchases()).status === 'restored';
}
