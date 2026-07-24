import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PLAN,
  PAYWALL_TRIGGERS,
  PRODUCTS,
  PRODUCT_IDS,
  VALUE_ANCHOR_COPY,
  priceTransparencyText,
} from '../products';

describe('PRODUCT_IDS (provisjonert — STATUS.md, juni 2026)', () => {
  it('matcher de provisjonerte no.klemeg.app.*-IDene', () => {
    expect(PRODUCT_IDS.yearly).toBe('no.klemeg.app.yearly');
    expect(PRODUCT_IDS.quarterly).toBe('no.klemeg.app.quarterly');
    expect(PRODUCT_IDS.monthly).toBe('no.klemeg.app.monthly');
  });

  it('DEFAULT_PLAN er yearly (anker)', () => {
    expect(DEFAULT_PLAN).toBe('yearly');
  });

  it('yearly: 299 kr, 7 dager trial, månedlig-ekvivalent i description', () => {
    expect(PRODUCTS.yearly.anchorPriceNok).toBe(299);
    expect(PRODUCTS.yearly.trialDays).toBe(7);
    expect(PRODUCTS.yearly.description).toMatch(/24,90/);
  });

  it('quarterly: 99 kr, 3 mnd (pappaperm), auto-renews, ingen trial', () => {
    expect(PRODUCTS.quarterly.anchorPriceNok).toBe(99);
    expect(PRODUCTS.quarterly.periodLabel).toBe('/3 mnd');
    expect(PRODUCTS.quarterly.autoRenews).toBe(true);
    expect(PRODUCTS.quarterly.trialDays).toBe(0);
    expect(PRODUCTS.quarterly.description).toMatch(/pappaperm/);
  });

  it('monthly: 39 kr, ingen trial', () => {
    expect(PRODUCTS.monthly.trialDays).toBe(0);
    expect(PRODUCTS.monthly.anchorPriceNok).toBe(39);
  });
});

describe('priceTransparencyText', () => {
  it('yearly med trial — bruker "Deretter X"', () => {
    expect(priceTransparencyText('yearly')).toBe('Deretter 299 kr/år. Avslutt når som helst.');
  });

  it('monthly uten trial — bruker direkte pris', () => {
    expect(priceTransparencyText('monthly')).toBe('39 kr/mnd. Avslutt når som helst.');
  });

  it('quarterly uten trial — direkte pris per 3 mnd', () => {
    expect(priceTransparencyText('quarterly')).toBe('99 kr/3 mnd. Avslutt når som helst.');
  });

  it('respekterer pris fra StoreKit hvis levert', () => {
    expect(priceTransparencyText('yearly', '399 kr/år')).toBe('Deretter 399 kr/år. Avslutt når som helst.');
  });
});

describe('Paywall trigger-strenger', () => {
  it('inneholder de låste triggerne inkludert Snart uten å endre produktkontrakten', () => {
    expect(PAYWALL_TRIGGERS).toEqual({
      imorgen: 'imorgen',
      garderobe_tilpasning: 'garderobe_tilpasning',
      barn_2: 'barn_2',
      forste_vinter: 'forste_vinter',
      snart: 'snart',
    });
  });

  it('Snart-triggeren endrer ikke produkt-ID, pris, trial eller RevenueCat-ankere', () => {
    expect(PRODUCT_IDS).toEqual({
      yearly: 'no.klemeg.app.yearly',
      quarterly: 'no.klemeg.app.quarterly',
      monthly: 'no.klemeg.app.monthly',
    });
    expect(PRODUCTS.yearly).toMatchObject({ anchorPriceNok: 299, trialDays: 7 });
    expect(PRODUCTS.quarterly).toMatchObject({ anchorPriceNok: 99, trialDays: 0 });
    expect(PRODUCTS.monthly).toMatchObject({ anchorPriceNok: 39, trialDays: 0 });
  });

  it('morgenvarsel er IKKE en paywall-trigger (gratis-kapabilitet, jf. capabilities.ts)', () => {
    expect('morgenvarsel' in PAYWALL_TRIGGERS).toBe(false);
  });

});

describe('Copy-konstanter', () => {
  it('verdiforankring matches plan §3', () => {
    expect(VALUE_ANCHOR_COPY).toMatch(/ullbody/);
  });

  it('legacy tillitslinje og familie/caregiver-løfter er fjernet fra products', () => {
    const source = readFileSync(
      fileURLToPath(new URL('../products.ts', import.meta.url)),
      'utf8',
    );
    expect(source).not.toContain('TRUST_LINE_COPY');
    expect(source).not.toMatch(/begge foreldre|alle som passer barnet|omsorgsperson/i);
  });
});
