import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, it, expect } from 'vitest';
import { lintCopy } from '../copy-lint';
import {
  PLUS_FEATURE_AVAILABILITY,
  type PlusFeatureAvailability,
} from '../plus-features';
import type { PaywallTrigger } from '../products';
import {
  PAYWALL_COPY,
  PLAN_ORDER,
  buildPlanAriaLabel,
  buildTransparencyLine,
  computeYearlySavingsPercent,
  extractMonthlyEquivalent,
} from '../paywall-copy';

type CapabilityClaim = {
  key: keyof PlusFeatureAvailability;
  from: string;
  to: string;
};

type CapabilityPaywallCopy = {
  heading: string;
  body: string;
  trustLine?: string;
  previewItems: readonly CapabilityClaim[];
};

type CapabilityCopyBuilder = (
  flags: Readonly<PlusFeatureAvailability>,
  trigger?: PaywallTrigger | null,
) => CapabilityPaywallCopy;

let buildCapabilityPaywallCopy: CapabilityCopyBuilder;

beforeAll(async () => {
  const module = await import('../paywall-copy') as Record<string, unknown>;
  const candidate = module.buildCapabilityPaywallCopy;
  if (typeof candidate !== 'function') {
    throw new Error('MISSING_CAPABILITY_PAYWALL_COPY');
  }
  buildCapabilityPaywallCopy = candidate as CapabilityCopyBuilder;
});

const allDisabled = (
  enabled?: Partial<PlusFeatureAvailability>,
): PlusFeatureAvailability => ({
  today_home: false,
  future_plan: false,
  automatic_location: false,
  extra_children: false,
  family_sharing: false,
  personal_calibration: false,
  soon_preparation: false,
  ...enabled,
});

const unsupportedDefaultWords =
  /sammen|familie|begge foreldre|alle som passer barnet|omsorgsperson|overalt|snart/i;

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
  it('standard-copy er avledet fra aktive kapabiliteter uten deaktiverte løfter', () => {
    const copy = buildCapabilityPaywallCopy(PLUS_FEATURE_AVAILABILITY);
    expect(copy.previewItems.map((item) => item.key)).toEqual([
      'future_plan',
      'automatic_location',
      'extra_children',
    ]);
    expect(JSON.stringify(copy)).not.toMatch(unsupportedDefaultWords);
    expect(copy.heading.length).toBeGreaterThan(5);
    expect(copy.body.length).toBeGreaterThan(5);
    expect(copy.trustLine).toBeUndefined();
  });

  it('tomt eller delvis kapabilitetssett gir bare eksplisitt støttede løfter', () => {
    expect(buildCapabilityPaywallCopy(allDisabled())).toMatchObject({
      previewItems: [],
      trustLine: undefined,
    });

    const capabilityKeys: Array<keyof PlusFeatureAvailability> = [
      'future_plan',
      'automatic_location',
      'extra_children',
      'family_sharing',
      'personal_calibration',
      'soon_preparation',
    ];
    for (const key of capabilityKeys) {
      const copy = buildCapabilityPaywallCopy(allDisabled({ [key]: true }));
      expect(copy.previewItems.map((item) => item.key)).toEqual([key]);
    }

    expect(buildCapabilityPaywallCopy(allDisabled({
      today_home: true,
    })).previewItems).toEqual([]);
  });

  it('familie-tillitslinje finnes bare når family_sharing er aktiv', () => {
    expect(buildCapabilityPaywallCopy(allDisabled()).trustLine).toBeUndefined();
    expect(buildCapabilityPaywallCopy(allDisabled({
      family_sharing: true,
    })).trustLine).toBe('Én Plus — alle som passer barnet');
  });

  it('kontekstoverskrift brukes bare når triggerens kapabilitet er aktiv', () => {
    expect(buildCapabilityPaywallCopy(
      allDisabled({ future_plan: true }),
      'imorgen',
    ).heading).toMatch(/morgen/i);
    expect(buildCapabilityPaywallCopy(
      allDisabled(),
      'imorgen',
    ).heading).not.toMatch(/morgen|fremover/i);
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
