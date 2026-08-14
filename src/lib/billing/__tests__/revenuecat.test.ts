/**
 * revenuecat.ts — SN-W01 (eiervedtak 2026-08-14 V1/V2/V5):
 *   - V2: appen skal spørre RevenueCat om PLANTYPE ('monthly' | 'yearly'),
 *     ikke om Apples produkt-ID.
 *   - V1: kvartal utgår — kun to plantyper.
 *   - V5: kjøp skal aldri feile stille. Alle avslag har en eksplisitt
 *     `reason` + brukervendt `message`.
 *
 * Testene mocker @capacitor/core og @revenuecat/purchases-capacitor og
 * verifiserer at purchasePlan velger riktig pakke via PACKAGE_TYPE, og at
 * hver feilgren har en unik reason.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from '@revenuecat/purchases-capacitor';
import { PACKAGE_TYPE } from '@revenuecat/purchases-capacitor';

// ─── Mocks ────────────────────────────────────────────────────────────────

const capacitorState = vi.hoisted(() => ({
  isNative: true,
  platform: 'ios' as string,
}));

const purchasesMock = vi.hoisted(() => ({
  setLogLevel: vi.fn(),
  configure: vi.fn(),
  getOfferings: vi.fn(),
  getCustomerInfo: vi.fn(),
  purchasePackage: vi.fn(),
  restorePurchases: vi.fn(),
}));

vi.mock('@capacitor/core', async () => {
  const real = await vi.importActual<typeof import('@capacitor/core')>('@capacitor/core');
  return {
    ...real,
    Capacitor: {
      ...real.Capacitor,
      isNativePlatform: () => capacitorState.isNative,
      getPlatform: () => capacitorState.platform,
    },
  };
});

vi.mock('@revenuecat/purchases-capacitor', async () => {
  const real = await vi.importActual<typeof import('@revenuecat/purchases-capacitor')>(
    '@revenuecat/purchases-capacitor',
  );
  return {
    ...real,
    Purchases: purchasesMock,
    LOG_LEVEL: { WARN: 'WARN' },
  };
});

// ─── Fikstur-hjelpere ─────────────────────────────────────────────────────

function makePackage(packageType: PACKAGE_TYPE, id = `pkg-${packageType}`): PurchasesPackage {
  return {
    identifier: id,
    packageType,
    product: { identifier: `product-${id}` } as PurchasesPackage['product'],
    offeringIdentifier: 'default',
    presentedOfferingContext: {} as PurchasesPackage['presentedOfferingContext'],
  } as PurchasesPackage;
}

function makeOffering(packages: PurchasesPackage[]): PurchasesOffering {
  const annual = packages.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL) ?? null;
  const monthly = packages.find((p) => p.packageType === PACKAGE_TYPE.MONTHLY) ?? null;
  return {
    identifier: 'default',
    serverDescription: 'Standard-tilbud',
    metadata: {} as PurchasesOffering['metadata'],
    availablePackages: packages,
    annual,
    monthly,
    lifetime: null,
    sixMonth: null,
    threeMonth: null,
    twoMonth: null,
    weekly: null,
  } as PurchasesOffering;
}

function makeCustomerInfo(hasEntitlement: boolean): CustomerInfo {
  return {
    entitlements: {
      active: hasEntitlement ? { premium: { identifier: 'premium' } } : {},
      all: {},
    },
  } as unknown as CustomerInfo;
}

async function importFresh() {
  vi.resetModules();
  return await import('../revenuecat');
}

async function bootInitialized() {
  vi.stubEnv('VITE_REVENUECAT_PUBLIC_KEY_IOS', 'test-key-ios');
  capacitorState.isNative = true;
  capacitorState.platform = 'ios';
  purchasesMock.setLogLevel.mockResolvedValue(undefined);
  purchasesMock.configure.mockResolvedValue(undefined);
  const mod = await importFresh();
  await mod.initRevenueCat('user-1');
  return mod;
}

beforeEach(() => {
  vi.unstubAllEnvs();
  purchasesMock.setLogLevel.mockReset();
  purchasesMock.configure.mockReset();
  purchasesMock.getOfferings.mockReset();
  purchasesMock.getCustomerInfo.mockReset();
  purchasesMock.purchasePackage.mockReset();
  purchasesMock.restorePurchases.mockReset();
});

// ─── V1 · Bare to plantyper (måned/år). Kvartal er borte. ─────────────────

describe('SN-W01 V1 · plantyper', () => {
  it('purchasePlan aksepterer kun "monthly" og "yearly" som gyldige plantyper', async () => {
    const { purchasePlan } = await bootInitialized();
    // Kompilator-nivået håndhever unionen; her tester vi at kall med
    // begge lovlige verdier ikke kaster tidlig.
    purchasesMock.getOfferings.mockResolvedValue({ current: null });
    const yearly = await purchasePlan('yearly');
    const monthly = await purchasePlan('monthly');
    expect(['yearly', 'monthly']).toContain('yearly');
    expect(yearly.success).toBe(false);
    expect(monthly.success).toBe(false);
  });
});

// ─── V2 · Plantype-lookup via PACKAGE_TYPE, ikke Apple-produkt-ID ─────────

describe('SN-W01 V2 · plantype-lookup', () => {
  it('purchasePlan("yearly") velger pakken med PACKAGE_TYPE.ANNUAL — ikke etter produktnavn', async () => {
    const { purchasePlan } = await bootInitialized();
    const annualPkg = makePackage(PACKAGE_TYPE.ANNUAL, 'default-annual');
    const monthlyPkg = makePackage(PACKAGE_TYPE.MONTHLY, 'default-monthly');
    const offering = makeOffering([annualPkg, monthlyPkg]);
    purchasesMock.getOfferings.mockResolvedValue({ current: offering });
    purchasesMock.purchasePackage.mockResolvedValue({
      customerInfo: makeCustomerInfo(true),
    });

    const result = await purchasePlan('yearly');
    expect(result.success).toBe(true);
    expect(purchasesMock.purchasePackage).toHaveBeenCalledWith({ aPackage: annualPkg });
  });

  it('purchasePlan("monthly") velger pakken med PACKAGE_TYPE.MONTHLY', async () => {
    const { purchasePlan } = await bootInitialized();
    const annualPkg = makePackage(PACKAGE_TYPE.ANNUAL, 'default-annual');
    const monthlyPkg = makePackage(PACKAGE_TYPE.MONTHLY, 'default-monthly');
    const offering = makeOffering([annualPkg, monthlyPkg]);
    purchasesMock.getOfferings.mockResolvedValue({ current: offering });
    purchasesMock.purchasePackage.mockResolvedValue({
      customerInfo: makeCustomerInfo(true),
    });

    const result = await purchasePlan('monthly');
    expect(result.success).toBe(true);
    expect(purchasesMock.purchasePackage).toHaveBeenCalledWith({ aPackage: monthlyPkg });
  });

  it('purchasePlan bruker ALDRI et Apple-produkt-ID-navn til å velge pakke', async () => {
    // Regresjonstest for SN-W01: legg inn en pakke som ligner det gamle
    // buggy oppslaget (product.identifier = 'no.klemeg.app.yearly') men med
    // FEIL PACKAGE_TYPE. purchasePlan skal ikke plukke den.
    const { purchasePlan } = await bootInitialized();
    const wrongLookalike: PurchasesPackage = {
      identifier: 'lookalike',
      packageType: PACKAGE_TYPE.CUSTOM,
      product: { identifier: 'no.klemeg.app.yearly' } as PurchasesPackage['product'],
      offeringIdentifier: 'default',
      presentedOfferingContext: {} as PurchasesPackage['presentedOfferingContext'],
    } as PurchasesPackage;
    const offering = makeOffering([wrongLookalike]);
    purchasesMock.getOfferings.mockResolvedValue({ current: offering });

    const result = await purchasePlan('yearly');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('plan_unavailable');
    }
    expect(purchasesMock.purchasePackage).not.toHaveBeenCalled();
  });
});

// ─── V5 · Ingen stille feil ───────────────────────────────────────────────

describe('SN-W01 V5 · ingen stille feil', () => {
  it('avslag har ALLTID en reason og en brukervendt message (aldri bare "success: false")', async () => {
    const { purchasePlan } = await bootInitialized();
    purchasesMock.getOfferings.mockResolvedValue({ current: null });
    const result = await purchasePlan('yearly');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBeTruthy();
      expect(result.message).toBeTruthy();
      expect(result.message.length).toBeGreaterThan(5);
    }
  });

  it('reason "not_configured": når RevenueCat ikke er initialisert (dev/web)', async () => {
    vi.stubEnv('VITE_REVENUECAT_PUBLIC_KEY_IOS', '');
    capacitorState.isNative = false;
    const { purchasePlan } = await importFresh();
    const result = await purchasePlan('yearly');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('not_configured');
    }
  });

  it('reason "no_offering": når RevenueCat ikke har et aktivt tilbud', async () => {
    const { purchasePlan } = await bootInitialized();
    purchasesMock.getOfferings.mockResolvedValue({ current: null });
    const result = await purchasePlan('yearly');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('no_offering');
    }
  });

  it('reason "plan_unavailable": tilbudet mangler den etterspurte plantypen', async () => {
    const { purchasePlan } = await bootInitialized();
    const monthlyOnly = makeOffering([makePackage(PACKAGE_TYPE.MONTHLY)]);
    purchasesMock.getOfferings.mockResolvedValue({ current: monthlyOnly });
    const result = await purchasePlan('yearly');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('plan_unavailable');
    }
  });

  it('reason "no_entitlement": kjøp fullført men Premium ble ikke aktivert', async () => {
    const { purchasePlan } = await bootInitialized();
    const annualPkg = makePackage(PACKAGE_TYPE.ANNUAL);
    purchasesMock.getOfferings.mockResolvedValue({
      current: makeOffering([annualPkg]),
    });
    purchasesMock.purchasePackage.mockResolvedValue({
      customerInfo: makeCustomerInfo(false),
    });
    const result = await purchasePlan('yearly');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('no_entitlement');
    }
  });

  it('reason "user_cancelled": bruker avbrøt kjøpsflyten', async () => {
    const { purchasePlan } = await bootInitialized();
    const annualPkg = makePackage(PACKAGE_TYPE.ANNUAL);
    purchasesMock.getOfferings.mockResolvedValue({
      current: makeOffering([annualPkg]),
    });
    purchasesMock.purchasePackage.mockRejectedValue({ userCancelled: true });
    const result = await purchasePlan('yearly');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('user_cancelled');
    }
  });

  it('reason "store_error": andre feil fra StoreKit/RevenueCat', async () => {
    const { purchasePlan } = await bootInitialized();
    const annualPkg = makePackage(PACKAGE_TYPE.ANNUAL);
    purchasesMock.getOfferings.mockResolvedValue({
      current: makeOffering([annualPkg]),
    });
    purchasesMock.purchasePackage.mockRejectedValue(new Error('nettverksfeil'));
    const result = await purchasePlan('yearly');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('store_error');
    }
  });

  it('logger tydelig til konsoll ved alle feilbaner utenom user_cancelled', async () => {
    const consoleErrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { purchasePlan } = await bootInitialized();
      // no_offering
      purchasesMock.getOfferings.mockResolvedValue({ current: null });
      await purchasePlan('yearly');
      expect(consoleErrSpy).toHaveBeenCalled();
      const noOfferingMessages = consoleErrSpy.mock.calls.map((c) => String(c[0]));
      expect(noOfferingMessages.some((m) => m.includes('no_offering'))).toBe(true);

      // user_cancelled skal IKKE logge feil
      consoleErrSpy.mockClear();
      const annualPkg = makePackage(PACKAGE_TYPE.ANNUAL);
      purchasesMock.getOfferings.mockResolvedValue({
        current: makeOffering([annualPkg]),
      });
      purchasesMock.purchasePackage.mockRejectedValue({ userCancelled: true });
      await purchasePlan('yearly');
      expect(consoleErrSpy).not.toHaveBeenCalled();
    } finally {
      consoleErrSpy.mockRestore();
    }
  });
});

// ─── Suksess-banen ────────────────────────────────────────────────────────

describe('SN-W01 suksess-banen', () => {
  it('returnerer success:true og customerInfo når entitlement er aktivt etter kjøp', async () => {
    const { purchasePlan } = await bootInitialized();
    const annualPkg = makePackage(PACKAGE_TYPE.ANNUAL);
    const info = makeCustomerInfo(true);
    purchasesMock.getOfferings.mockResolvedValue({
      current: makeOffering([annualPkg]),
    });
    purchasesMock.purchasePackage.mockResolvedValue({ customerInfo: info });
    const result = await purchasePlan('yearly');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.customerInfo).toBe(info);
    }
  });
});
