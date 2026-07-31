import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { lintCopy } from '../copy-lint';
import { PRODUCTS } from '../products';
import {
  PAYWALL_COPY,
  PAYWALL_VALUE_BULLETS,
  PLAN_ORDER,
  buildCapabilityPaywallCopy,
  buildPlanAriaLabel,
  computeYearlySavingsPercent,
  extractMonthlyEquivalent,
} from '../paywall-copy';

describe('paywall-copy (P2 hard paywall) — copy-lint', () => {
  it('all statisk copy passerer lintCopy (ingen «låst/sperret/nektet»)', () => {
    for (const [key, value] of Object.entries(PAYWALL_COPY)) {
      const result = lintCopy(value);
      expect(result.ok, `PAYWALL_COPY.${key} = "${value}" feiler copy-lint: ${JSON.stringify(result)}`).toBe(true);
    }
  });

  it('verdi-bulletsene passerer lintCopy', () => {
    for (const item of PAYWALL_VALUE_BULLETS) {
      const result = lintCopy(item.label);
      expect(result.ok, `"${item.label}" feiler copy-lint`).toBe(true);
    }
  });

  it('plan-aria-labels passerer lintCopy for viste plan', () => {
    for (const key of PLAN_ORDER) {
      const label = buildPlanAriaLabel(key);
      expect(lintCopy(label).ok, `"${label}" feiler copy-lint`).toBe(true);
    }
  });
});

describe('paywall-copy — hele-produktet-innhold (P2 hard paywall, PRODUCT.md 2026-07-31)', () => {
  it('de tre låste verdi-bulletsene vises alltid, i låst rekkefølge', () => {
    const copy = buildCapabilityPaywallCopy();
    expect(copy.previewItems).toEqual([
      { key: 'today', label: 'Dagens antrekk, klart hver eneste morgen' },
      { key: 'week', label: 'I morgen og hele neste uke, ferdig planlagt' },
      { key: 'family', label: 'Del med alle som passer barnet' },
    ]);
  });

  it('copyen varierer ALDRI — samme hele-produktet-pitch uansett kall', () => {
    expect(buildCapabilityPaywallCopy()).toEqual(buildCapabilityPaywallCopy());
    expect(buildCapabilityPaywallCopy().heading.length).toBeGreaterThan(5);
    expect(buildCapabilityPaywallCopy().body.length).toBeGreaterThan(5);
  });

  it('trial-linjen er plan-agnostisk — antyder aldri at prøveperioden kun gjelder årsplanen', () => {
    expect(PAYWALL_COPY.trialLine).toBe(
      'Start med 7 gratisdager uansett plan, deretter prisen for planen du velger. Avslutt når som helst i App Store.',
    );
    expect(PAYWALL_COPY.trialLine).not.toMatch(/årsplan|kun.*år|bare.*år/i);
  });

  it('CTA-en er plan-agnostisk — samme tekst uansett hvilken plan som er valgt', () => {
    expect(PAYWALL_COPY.cta).toBe('Start 7 dager gratis');
  });

  it('alle tre produkter har trial (P2: 7 dager på alle planer, ikke bare årlig)', () => {
    expect(PRODUCTS.yearly.trialDays).toBeGreaterThan(0);
    expect(PRODUCTS.monthly.trialDays).toBeGreaterThan(0);
    expect(PRODUCTS.quarterly.trialDays).toBeGreaterThan(0);
  });

  it('legacy trust-copy og statisk flaggskip-løfte er fjernet', () => {
    const source = readFileSync(
      fileURLToPath(new URL('../paywall-copy.ts', import.meta.url)),
      'utf8',
    );
    expect('trustLine' in PAYWALL_COPY).toBe(false);
    expect('flagshipHeadline' in PAYWALL_COPY).toBe(false);
    expect(source).not.toContain("trustLine: 'Én Plus — alle som passer barnet'");
    expect(source).not.toContain("'Fremover, overalt og sammen'");
  });

  it('PaywallDialog beholder eksisterende focus-return ved lukk', () => {
    const source = readFileSync(
      fileURLToPath(new URL('../../../components/PaywallDialog.tsx', import.meta.url)),
      'utf8',
    );
    expect(source).toContain('returnFocusTo?.focus?.()');
  });

  it('årlig aria-label matcher a11y-kravet (spar 36 % vs 12×39) og nevner trial plan-agnostisk', () => {
    expect(buildPlanAriaLabel('yearly')).toBe(
      'Årlig, 299 kroner per år, tilsvarer 24,90 kroner per måned, spar 36 prosent, 7 dager gratis først',
    );
  });

  it('kvartal aria-label nevner nå også trial (P2: trial på alle tre planer)', () => {
    expect(buildPlanAriaLabel('quarterly')).toBe('3 måneder, 99 kroner per 3 måneder, 7 dager gratis først');
  });

  it('månedlig aria-label nevner nå også trial (P2: trial på alle tre planer)', () => {
    expect(buildPlanAriaLabel('monthly')).toBe('Månedlig, 39 kroner per måned, 7 dager gratis først');
  });

  it('spar-prosent er 36 (299 kr/år vs. 12×39 kr/mnd)', () => {
    expect(computeYearlySavingsPercent()).toBe(36);
  });

  it('månedlig-ekvivalent er 24,90 (parset fra PRODUCTS.yearly.description)', () => {
    expect(extractMonthlyEquivalent()).toBe('24,90');
  });
});
