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
  PurchasesOfferings,
  PurchasesPackage,
} from '@revenuecat/purchases-capacitor';
import { PACKAGE_TYPE, PURCHASES_ERROR_CODE } from '@revenuecat/purchases-capacitor';

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

function makePricedPackage(
  packageType: PACKAGE_TYPE,
  price: number,
  priceString: string,
  pricePerMonthString: string | null,
): PurchasesPackage {
  const pkg = makePackage(packageType);
  return {
    ...pkg,
    product: {
      ...pkg.product,
      price,
      priceString,
      pricePerMonthString,
    },
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

function makeOfferings(
  defaultOffering: PurchasesOffering | null,
  current: PurchasesOffering | null = defaultOffering,
): PurchasesOfferings {
  return {
    all: defaultOffering ? { default: defaultOffering } : {},
    current,
  } as PurchasesOfferings;
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
  it('PLAN_TO_PACKAGE_TYPE inneholder KUN yearly og monthly (ingen quarterly)', async () => {
    // V1: kvartal utgår. Runtime-verifikasjon at oppslagstabellen ikke
    // rommer den utgåtte plantypen — TS-kompilatoren dekker unionen,
    // denne testen fanger drift i verdien.
    const mod = await importFresh();
    const keys = Object.keys(mod.PLAN_TO_PACKAGE_TYPE).sort();
    expect(keys).toEqual(['monthly', 'yearly']);
  });

  it('purchasePlan("yearly") ser etter PACKAGE_TYPE.ANNUAL i tilbudet (ikke kvartal)', async () => {
    const { purchasePlan } = await bootInitialized();
    const captured: string[] = [];
    const offering = makeOffering([
      {
        identifier: 'probe',
        packageType: PACKAGE_TYPE.ANNUAL,
        product: { identifier: 'probe-product' } as PurchasesPackage['product'],
        offeringIdentifier: 'default',
        presentedOfferingContext: {} as PurchasesPackage['presentedOfferingContext'],
      } as PurchasesPackage,
    ]);
    // Spion på .find sitt predikat ved å legge en «probe»-pakke først;
    // hvis oppslaget faktisk sjekker packageType, treffer det. Hvis noen
    // fremtidig endring legger til en 'quarterly'-oppføring, må testen
    // her oppdateres eksplisitt.
    purchasesMock.getOfferings.mockResolvedValue(makeOfferings(offering));
    purchasesMock.purchasePackage.mockImplementation((arg) => {
      captured.push((arg as { aPackage: PurchasesPackage }).aPackage.identifier);
      return Promise.resolve({ customerInfo: makeCustomerInfo(true) });
    });
    const result = await purchasePlan('yearly');
    expect(result.status).toBe('success');
    expect(captured).toEqual(['probe']);
  });
});

// ─── V2 · Plantype-lookup via PACKAGE_TYPE, ikke Apple-produkt-ID ─────────

describe('SN-W01 V2 · plantype-lookup', () => {
  it('getOfferings velger offering-id "default" selv når current peker på et annet tilbud', async () => {
    const { getOfferings } = await bootInitialized();
    const defaultOffering = makeOffering([makePackage(PACKAGE_TYPE.ANNUAL)]);
    const targetedOffering = {
      ...makeOffering([makePackage(PACKAGE_TYPE.MONTHLY)]),
      identifier: 'targeted-promo',
    } as PurchasesOffering;
    purchasesMock.getOfferings.mockResolvedValue({
      all: { default: defaultOffering, 'targeted-promo': targetedOffering },
      current: targetedOffering,
    } satisfies PurchasesOfferings);

    await expect(getOfferings()).resolves.toBe(defaultOffering);
  });

  it('getOfferings avviser et vilkårlig current-tilbud når "default" mangler', async () => {
    const { getOfferings } = await bootInitialized();
    const targetedOffering = {
      ...makeOffering([makePackage(PACKAGE_TYPE.ANNUAL)]),
      identifier: 'targeted-promo',
    } as PurchasesOffering;
    purchasesMock.getOfferings.mockResolvedValue({
      all: { 'targeted-promo': targetedOffering },
      current: targetedOffering,
    } satisfies PurchasesOfferings);

    await expect(getOfferings()).resolves.toBeNull();
  });

  it('kontrakten navngir premium-entitlement og default-offering eksplisitt', async () => {
    const mod = await importFresh();
    expect(mod.REVENUECAT_ENTITLEMENT_ID).toBe('premium');
    expect(mod.REVENUECAT_OFFERING_ID).toBe('default');
  });

  it('purchasePlan("yearly") velger pakken med PACKAGE_TYPE.ANNUAL — ikke etter produktnavn', async () => {
    const { purchasePlan } = await bootInitialized();
    const annualPkg = makePackage(PACKAGE_TYPE.ANNUAL, 'default-annual');
    const monthlyPkg = makePackage(PACKAGE_TYPE.MONTHLY, 'default-monthly');
    const offering = makeOffering([annualPkg, monthlyPkg]);
    purchasesMock.getOfferings.mockResolvedValue(makeOfferings(offering));
    purchasesMock.purchasePackage.mockResolvedValue({
      customerInfo: makeCustomerInfo(true),
    });

    const result = await purchasePlan('yearly');
    expect(result.status).toBe('success');
    expect(purchasesMock.purchasePackage).toHaveBeenCalledWith({ aPackage: annualPkg });
  });

  it('purchasePlan("monthly") velger pakken med PACKAGE_TYPE.MONTHLY', async () => {
    const { purchasePlan } = await bootInitialized();
    const annualPkg = makePackage(PACKAGE_TYPE.ANNUAL, 'default-annual');
    const monthlyPkg = makePackage(PACKAGE_TYPE.MONTHLY, 'default-monthly');
    const offering = makeOffering([annualPkg, monthlyPkg]);
    purchasesMock.getOfferings.mockResolvedValue(makeOfferings(offering));
    purchasesMock.purchasePackage.mockResolvedValue({
      customerInfo: makeCustomerInfo(true),
    });

    const result = await purchasePlan('monthly');
    expect(result.status).toBe('success');
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
    purchasesMock.getOfferings.mockResolvedValue(makeOfferings(offering));

    const result = await purchasePlan('yearly');
    expect(result).toMatchObject({ status: 'unavailable', reason: 'plan_unavailable' });
    expect(purchasesMock.purchasePackage).not.toHaveBeenCalled();
  });
});

// ─── V5 · Ingen stille feil ───────────────────────────────────────────────

describe('SN-W01 V5 · ingen stille feil', () => {
  it('alle ikke-suksessutfall har reason og brukervendt message', async () => {
    const { purchasePlan } = await bootInitialized();
    purchasesMock.getOfferings.mockResolvedValue(makeOfferings(null));
    const result = await purchasePlan('yearly');
    expect(result.status).not.toBe('success');
    if (result.status !== 'success') {
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
    expect(result).toMatchObject({ status: 'unavailable', reason: 'not_configured' });
  });

  it('reason "no_offering": når RevenueCat ikke har et aktivt tilbud', async () => {
    const { purchasePlan } = await bootInitialized();
    purchasesMock.getOfferings.mockResolvedValue(makeOfferings(null));
    const result = await purchasePlan('yearly');
    expect(result).toMatchObject({ status: 'unavailable', reason: 'no_offering' });
  });

  it('reason "plan_unavailable": tilbudet mangler den etterspurte plantypen', async () => {
    const { purchasePlan } = await bootInitialized();
    const monthlyOnly = makeOffering([makePackage(PACKAGE_TYPE.MONTHLY)]);
    purchasesMock.getOfferings.mockResolvedValue(makeOfferings(monthlyOnly));
    const result = await purchasePlan('yearly');
    expect(result).toMatchObject({ status: 'unavailable', reason: 'plan_unavailable' });
  });

  it('reason "no_entitlement": kjøp fullført men Premium ble ikke aktivert', async () => {
    const { purchasePlan } = await bootInitialized();
    const annualPkg = makePackage(PACKAGE_TYPE.ANNUAL);
    purchasesMock.getOfferings.mockResolvedValue(makeOfferings(makeOffering([annualPkg])));
    purchasesMock.purchasePackage.mockResolvedValue({
      customerInfo: makeCustomerInfo(false),
    });
    const result = await purchasePlan('yearly');
    expect(result).toMatchObject({
      status: 'entitlement_missing',
      reason: 'no_entitlement',
    });
  });

  it('reason "user_cancelled": bruker avbrøt kjøpsflyten', async () => {
    const { purchasePlan } = await bootInitialized();
    const annualPkg = makePackage(PACKAGE_TYPE.ANNUAL);
    purchasesMock.getOfferings.mockResolvedValue(makeOfferings(makeOffering([annualPkg])));
    purchasesMock.purchasePackage.mockRejectedValue({ userCancelled: true });
    const result = await purchasePlan('yearly');
    expect(result).toMatchObject({ status: 'cancelled', reason: 'user_cancelled' });
  });

  it('reason "store_error": andre feil fra StoreKit/RevenueCat', async () => {
    const { purchasePlan } = await bootInitialized();
    const annualPkg = makePackage(PACKAGE_TYPE.ANNUAL);
    purchasesMock.getOfferings.mockResolvedValue(makeOfferings(makeOffering([annualPkg])));
    purchasesMock.purchasePackage.mockRejectedValue(new Error('nettverksfeil'));
    const result = await purchasePlan('yearly');
    expect(result).toMatchObject({ status: 'error', reason: 'store_error' });
  });

  it('logger tydelig til konsoll ved alle feilbaner utenom user_cancelled', async () => {
    const consoleErrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { purchasePlan } = await bootInitialized();
      // no_offering
      purchasesMock.getOfferings.mockResolvedValue(makeOfferings(null));
      await purchasePlan('yearly');
      expect(consoleErrSpy).toHaveBeenCalled();
      const noOfferingMessages = consoleErrSpy.mock.calls.map((c) => String(c[0]));
      expect(noOfferingMessages.some((m) => m.includes('no_offering'))).toBe(true);

      // user_cancelled skal IKKE logge feil
      consoleErrSpy.mockClear();
      const annualPkg = makePackage(PACKAGE_TYPE.ANNUAL);
      purchasesMock.getOfferings.mockResolvedValue(makeOfferings(makeOffering([annualPkg])));
      purchasesMock.purchasePackage.mockRejectedValue({ userCancelled: true });
      await purchasePlan('yearly');
      expect(consoleErrSpy).not.toHaveBeenCalled();
    } finally {
      consoleErrSpy.mockRestore();
    }
  });
});

// ─── TASK-022 · Uttømmende kjøpsutfall + dobbelttrykk-vakt ───────────────

describe('TASK-022 · typed purchase contract', () => {
  it('skiller success fra alle ikke-suksessutfall', async () => {
    const { purchasePlan } = await bootInitialized();
    const annualPkg = makePackage(PACKAGE_TYPE.ANNUAL);
    purchasesMock.getOfferings.mockResolvedValue(makeOfferings(makeOffering([annualPkg])));
    purchasesMock.purchasePackage.mockResolvedValue({ customerInfo: makeCustomerInfo(true) });

    const result = await purchasePlan('yearly');

    expect(result.status).toBe('success');
  });

  it('mapper RevenueCat cancellation-koden til cancelled', async () => {
    const { purchasePlan } = await bootInitialized();
    const annualPkg = makePackage(PACKAGE_TYPE.ANNUAL);
    purchasesMock.getOfferings.mockResolvedValue(makeOfferings(makeOffering([annualPkg])));
    purchasesMock.purchasePackage.mockRejectedValue({
      code: PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR,
      userCancelled: false,
    });

    const result = await purchasePlan('yearly');

    expect(result).toMatchObject({ status: 'cancelled', reason: 'user_cancelled' });
  });

  it('mapper ask-to-buy/payment-pending til pending, ikke error', async () => {
    const { purchasePlan } = await bootInitialized();
    const annualPkg = makePackage(PACKAGE_TYPE.ANNUAL);
    purchasesMock.getOfferings.mockResolvedValue(makeOfferings(makeOffering([annualPkg])));
    purchasesMock.purchasePackage.mockRejectedValue({
      code: PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR,
    });

    const result = await purchasePlan('yearly');

    expect(result).toMatchObject({ status: 'pending', reason: 'payment_pending' });
  });

  it('mapper RevenueCats operation-in-progress-kode til pending', async () => {
    const { purchasePlan } = await bootInitialized();
    const annualPkg = makePackage(PACKAGE_TYPE.ANNUAL);
    purchasesMock.getOfferings.mockResolvedValue(makeOfferings(makeOffering([annualPkg])));
    purchasesMock.purchasePackage.mockRejectedValue({
      code: PURCHASES_ERROR_CODE.OPERATION_ALREADY_IN_PROGRESS_ERROR,
    });

    const result = await purchasePlan('yearly');

    expect(result).toMatchObject({ status: 'pending', reason: 'purchase_in_progress' });
  });

  it('skiller unavailable fra generell butikkfeil', async () => {
    const { purchasePlan } = await bootInitialized();
    purchasesMock.getOfferings.mockResolvedValue(makeOfferings(null));

    const result = await purchasePlan('yearly');

    expect(result).toMatchObject({ status: 'unavailable', reason: 'no_offering' });
  });

  it('skiller entitlement_missing fra generell butikkfeil', async () => {
    const { purchasePlan } = await bootInitialized();
    const annualPkg = makePackage(PACKAGE_TYPE.ANNUAL);
    purchasesMock.getOfferings.mockResolvedValue(makeOfferings(makeOffering([annualPkg])));
    purchasesMock.purchasePackage.mockResolvedValue({ customerInfo: makeCustomerInfo(false) });

    const result = await purchasePlan('yearly');

    expect(result).toMatchObject({ status: 'entitlement_missing', reason: 'no_entitlement' });
  });

  it('slipper bare ett butikk-kall gjennom ved samtidige dobbelttrykk', async () => {
    const { purchasePlan } = await bootInitialized();
    const annualPkg = makePackage(PACKAGE_TYPE.ANNUAL);
    purchasesMock.getOfferings.mockResolvedValue(makeOfferings(makeOffering([annualPkg])));
    let finishPurchase!: (value: { customerInfo: CustomerInfo }) => void;
    purchasesMock.purchasePackage.mockImplementation(
      () =>
        new Promise<{ customerInfo: CustomerInfo }>((resolve) => {
          finishPurchase = resolve;
        }),
    );

    const first = purchasePlan('yearly');
    await vi.waitFor(() => expect(purchasesMock.purchasePackage).toHaveBeenCalledTimes(1));
    const duplicate = await purchasePlan('yearly');

    expect(duplicate).toMatchObject({
      status: 'pending',
      reason: 'purchase_in_progress',
    });
    expect(purchasesMock.purchasePackage).toHaveBeenCalledTimes(1);

    finishPurchase({ customerInfo: makeCustomerInfo(true) });
    await expect(first).resolves.toMatchObject({ status: 'success' });

    purchasesMock.purchasePackage.mockResolvedValue({ customerInfo: makeCustomerInfo(true) });
    await expect(purchasePlan('yearly')).resolves.toMatchObject({ status: 'success' });
    expect(purchasesMock.purchasePackage).toHaveBeenCalledTimes(2);
  });
});

describe('TASK-024 · store offer snapshot', () => {
  it('returnerer begge påkrevde pakker med butikkens lokaliserte priser', async () => {
    const { getStoreOfferSnapshot } = await bootInitialized();
    const annual = makePricedPackage(PACKAGE_TYPE.ANNUAL, 299, '299,00 kr', '24,92 kr');
    const monthly = makePricedPackage(PACKAGE_TYPE.MONTHLY, 49, '49,00 kr', '49,00 kr');
    purchasesMock.getOfferings.mockResolvedValue(
      makeOfferings(makeOffering([annual, monthly])),
    );

    await expect(getStoreOfferSnapshot()).resolves.toEqual({
      status: 'ready',
      plans: {
        yearly: { price: 299, priceString: '299,00 kr', pricePerMonthString: '24,92 kr' },
        monthly: { price: 49, priceString: '49,00 kr', pricePerMonthString: '49,00 kr' },
      },
    });
  });

  it('returnerer unavailable når default-offering mangler en påkrevd pakke', async () => {
    const { getStoreOfferSnapshot } = await bootInitialized();
    const monthly = makePricedPackage(PACKAGE_TYPE.MONTHLY, 49, '49,00 kr', '49,00 kr');
    purchasesMock.getOfferings.mockResolvedValue(makeOfferings(makeOffering([monthly])));

    await expect(getStoreOfferSnapshot()).resolves.toMatchObject({
      status: 'unavailable',
      reason: 'packages_missing',
      missingPlans: ['yearly'],
    });
  });

  it('avviser tomme priser og bruker samme første pakke som kjøpsoppslaget', async () => {
    const { getStoreOfferSnapshot } = await bootInitialized();
    const firstAnnual = makePricedPackage(PACKAGE_TYPE.ANNUAL, 299, '299,00 kr', null);
    const duplicateAnnual = makePricedPackage(PACKAGE_TYPE.ANNUAL, 999, '999,00 kr', null);
    const invalidMonthly = makePricedPackage(PACKAGE_TYPE.MONTHLY, 49, '   ', '49,00 kr');
    purchasesMock.getOfferings.mockResolvedValue(
      makeOfferings(makeOffering([firstAnnual, duplicateAnnual, invalidMonthly])),
    );

    await expect(getStoreOfferSnapshot()).resolves.toMatchObject({
      status: 'unavailable',
      reason: 'invalid_prices',
      missingPlans: ['monthly'],
    });

    const validMonthly = makePricedPackage(PACKAGE_TYPE.MONTHLY, 49, '49,00 kr', null);
    purchasesMock.getOfferings.mockResolvedValue(
      makeOfferings(makeOffering([firstAnnual, duplicateAnnual, validMonthly])),
    );
    await expect(getStoreOfferSnapshot()).resolves.toMatchObject({
      status: 'ready',
      plans: { yearly: { priceString: '299,00 kr' } },
    });
  });

  it('returnerer error når RevenueCat-kallet feiler', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { getStoreOfferSnapshot } = await bootInitialized();
      purchasesMock.getOfferings.mockRejectedValue(new Error('offline'));

      await expect(getStoreOfferSnapshot()).resolves.toMatchObject({ status: 'error' });
    } finally {
      consoleSpy.mockRestore();
    }
  });
});

// ─── Suksess-banen ────────────────────────────────────────────────────────

describe('SN-W01 suksess-banen', () => {
  it('returnerer status:success og customerInfo når entitlement er aktivt etter kjøp', async () => {
    const { purchasePlan } = await bootInitialized();
    const annualPkg = makePackage(PACKAGE_TYPE.ANNUAL);
    const info = makeCustomerInfo(true);
    purchasesMock.getOfferings.mockResolvedValue(makeOfferings(makeOffering([annualPkg])));
    purchasesMock.purchasePackage.mockResolvedValue({ customerInfo: info });
    const result = await purchasePlan('yearly');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.customerInfo).toBe(info);
    }
  });
});
