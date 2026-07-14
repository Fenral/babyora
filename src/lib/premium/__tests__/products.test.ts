import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PLAN,
  PAYWALL_TRIGGERS,
  PRODUCTS,
  PRODUCT_IDS,
  TRIGGER_HEADLINE,
  TRUST_LINE_COPY,
  VALUE_ANCHOR_COPY,
  priceTransparencyText,
} from '../products';

describe('PRODUCT_IDS (F81.0)', () => {
  it('inneholder de 3 forventede produktene', () => {
    expect(PRODUCT_IDS.yearly).toBe('babyora_yearly_299');
    expect(PRODUCT_IDS.monthly).toBe('babyora_monthly_49');
    expect(PRODUCT_IDS.lifetime).toBe('babyora_barnetiden_499');
  });

  it('DEFAULT_PLAN er yearly (anker)', () => {
    expect(DEFAULT_PLAN).toBe('yearly');
  });

  it('yearly har 7 dager trial', () => {
    expect(PRODUCTS.yearly.trialDays).toBe(7);
  });

  it('yearly viser månedlig ekvivalent i description', () => {
    expect(PRODUCTS.yearly.description).toMatch(/24,90/);
  });

  it('monthly har ingen trial', () => {
    expect(PRODUCTS.monthly.trialDays).toBe(0);
    expect(PRODUCTS.monthly.anchorPriceNok).toBe(49);
  });

  it('lifetime har autoRenews=false', () => {
    expect(PRODUCTS.lifetime.autoRenews).toBe(false);
  });

  it('lifetime heter «Barnetiden» og koster 499', () => {
    expect(PRODUCTS.lifetime.name).toBe('Barnetiden');
    expect(PRODUCTS.lifetime.anchorPriceNok).toBe(499);
    expect(PRODUCTS.lifetime.description).toMatch(/Alle barna dine/);
  });
});

describe('priceTransparencyText', () => {
  it('yearly med trial — bruker "Deretter X"', () => {
    expect(priceTransparencyText('yearly')).toBe('Deretter 299 kr/år. Avslutt når som helst.');
  });

  it('monthly uten trial — bruker direkte pris', () => {
    expect(priceTransparencyText('monthly')).toBe('49 kr/mnd. Avslutt når som helst.');
  });

  it('lifetime — engangskjøp-tekst', () => {
    expect(priceTransparencyText('lifetime')).toMatch(/engangskj/i);
    expect(priceTransparencyText('lifetime')).toMatch(/aldri auto/i);
    expect(priceTransparencyText('lifetime')).toMatch(/499 kr/);
  });

  it('respekterer pris fra StoreKit hvis levert', () => {
    expect(priceTransparencyText('yearly', '399 kr/år')).toBe('Deretter 399 kr/år. Avslutt når som helst.');
  });
});

describe('Paywall trigger-strenger', () => {
  it('inneholder nøyaktig de 4 låste triggerne (R7 Task 7: morgenvarsel er gratis)', () => {
    expect(PAYWALL_TRIGGERS).toEqual({
      imorgen: 'imorgen',
      garderobe_tilpasning: 'garderobe_tilpasning',
      barn_2: 'barn_2',
      forste_vinter: 'forste_vinter',
    });
  });

  it('morgenvarsel er IKKE en paywall-trigger (gratis-kapabilitet, jf. capabilities.ts)', () => {
    expect('morgenvarsel' in PAYWALL_TRIGGERS).toBe(false);
  });

  it('hver trigger har kontekst-overskrift', () => {
    for (const key of Object.keys(PAYWALL_TRIGGERS) as Array<keyof typeof PAYWALL_TRIGGERS>) {
      expect(TRIGGER_HEADLINE[key]).toBeTruthy();
      expect(TRIGGER_HEADLINE[key].length).toBeGreaterThan(5);
      // Aldri generisk «Oppgrader til Premium»
      expect(TRIGGER_HEADLINE[key]).not.toMatch(/oppgrader til premium/i);
    }
  });

  it('forbidden-ord IKKE i kontekst-overskrifter', () => {
    const forbidden = /låst|sperret|nektet|krever/i;
    for (const headline of Object.values(TRIGGER_HEADLINE)) {
      expect(headline).not.toMatch(forbidden);
    }
  });
});

describe('Copy-konstanter', () => {
  it('verdiforankring matches plan §3', () => {
    expect(VALUE_ANCHOR_COPY).toMatch(/ullbody/);
  });

  it('tillitslinje nevner begge foreldre', () => {
    expect(TRUST_LINE_COPY).toMatch(/begge foreldre/i);
  });
});
