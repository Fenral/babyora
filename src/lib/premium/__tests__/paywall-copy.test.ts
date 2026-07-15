import { describe, it, expect } from 'vitest';
import { lintCopy } from '../copy-lint';
import {
  PAYWALL_COPY,
  PLAN_ORDER,
  buildPlanAriaLabel,
  buildTransparencyLine,
  computeYearlySavingsPercent,
  extractMonthlyEquivalent,
} from '../paywall-copy';

describe('paywall-copy (F81.5-W1) — copy-lint', () => {
  it('all statisk copy passerer lintCopy (ingen «låst/sperret/nektet»)', () => {
    for (const [key, value] of Object.entries(PAYWALL_COPY)) {
      const result = lintCopy(value);
      expect(result.ok, `PAYWALL_COPY.${key} = "${value}" feiler copy-lint: ${JSON.stringify(result)}`).toBe(true);
    }
  });

  it('plan-aria-labels passerer lintCopy for viste plan', () => {
    for (const key of PLAN_ORDER) {
      const label = buildPlanAriaLabel(key);
      expect(lintCopy(label).ok, `"${label}" feiler copy-lint`).toBe(true);
    }
  });

  it('transparency-linjer passerer lintCopy for viste plan', () => {
    for (const key of PLAN_ORDER) {
      const line = buildTransparencyLine(key);
      expect(lintCopy(line).ok, `"${line}" feiler copy-lint`).toBe(true);
    }
  });
});

describe('paywall-copy — innhold', () => {
  it('generisk flaggskip-headline er reframet til Plus-verdiløftet (R7 Task 7)', () => {
    // Morgenvarsel er gratis → den generiske paywallen leder aldri lenger med
    // den. Plus = «Fremover, overalt og sammen».
    expect(PAYWALL_COPY.flagshipHeadline).toBe('Fremover, overalt og sammen');
  });

  it('årlig aria-label matcher a11y-kravet (spar 36 % vs 12×39)', () => {
    expect(buildPlanAriaLabel('yearly')).toBe(
      'Årlig, 299 kroner per år, tilsvarer 24,90 kroner per måned, spar 36 prosent, 7 dager gratis først',
    );
  });

  it('kvartal aria-label (pappaperm, ikke i PLAN_ORDER men støttet)', () => {
    expect(buildPlanAriaLabel('quarterly')).toBe('3 måneder, 99 kroner per 3 måneder');
  });

  it('månedlig aria-label inneholder pris og periode', () => {
    expect(buildPlanAriaLabel('monthly')).toBe('Månedlig, 39 kroner per måned');
  });

  it('spar-prosent er 36 (299 kr/år vs. 12×39 kr/mnd)', () => {
    expect(computeYearlySavingsPercent()).toBe(36);
  });

  it('månedlig-ekvivalent er 24,90 (parset fra PRODUCTS.yearly.description)', () => {
    expect(extractMonthlyEquivalent()).toBe('24,90');
  });

  it('årlig transparency-linje inneholder «7 dager gratis, deretter 299 kr/år»', () => {
    expect(buildTransparencyLine('yearly')).toContain('7 dager gratis, deretter 299 kr/år');
  });

  it('månedlig/kvartal transparency-linje er uendret priceTransparencyText', () => {
    expect(buildTransparencyLine('monthly')).toBe('39 kr/mnd. Avslutt når som helst.');
    expect(buildTransparencyLine('quarterly')).toBe('99 kr/3 mnd. Avslutt når som helst.');
  });
});
