import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PLAN,
  PAYWALL_TRIGGERS,
  PRODUCTS,
  VALUE_ANCHOR_COPY,
  priceTransparencyText,
} from '../products';

describe('PRODUCTS (eiervedtak 2026-08-14 V1: kun måned og år)', () => {
  it('kun to plantyper — måned og år (kvartal utgår)', () => {
    expect(Object.keys(PRODUCTS).sort()).toEqual(['monthly', 'yearly']);
  });

  it('DEFAULT_PLAN er yearly (anker)', () => {
    expect(DEFAULT_PLAN).toBe('yearly');
  });

  it('yearly: 299 kr, 7 dager trial, månedlig-ekvivalent i description', () => {
    expect(PRODUCTS.yearly.anchorPriceNok).toBe(299);
    expect(PRODUCTS.yearly.trialDays).toBe(7);
    expect(PRODUCTS.yearly.description).toMatch(/24,90/);
  });

  it('monthly: 39 kr, 7 dager trial (P2: trial på alle planer, ikke bare årlig)', () => {
    expect(PRODUCTS.monthly.trialDays).toBe(7);
    expect(PRODUCTS.monthly.anchorPriceNok).toBe(39);
  });
});

describe('priceTransparencyText', () => {
  it('yearly med trial — bruker "Deretter X"', () => {
    expect(priceTransparencyText('yearly')).toBe('Deretter 299 kr/år. Avslutt når som helst.');
  });

  it('monthly med trial (P2) — bruker også "Deretter X"', () => {
    expect(priceTransparencyText('monthly')).toBe('Deretter 39 kr/mnd. Avslutt når som helst.');
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

  it('Snart-triggeren endrer ikke pris, trial eller RevenueCat-ankere', () => {
    expect(PRODUCTS.yearly).toMatchObject({ anchorPriceNok: 299, trialDays: 7 });
    expect(PRODUCTS.monthly).toMatchObject({ anchorPriceNok: 39, trialDays: 7 });
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

  it('kvartals-referanser er fjernet fra products.ts (eiervedtak V1)', () => {
    const source = readFileSync(
      fileURLToPath(new URL('../products.ts', import.meta.url)),
      'utf8',
    );
    expect(source).not.toMatch(/quarterly|pappaperm|3 mnd/i);
    expect(source).not.toContain('PRODUCT_IDS');
    expect(source).not.toContain('no.klemeg.app');
  });
});
