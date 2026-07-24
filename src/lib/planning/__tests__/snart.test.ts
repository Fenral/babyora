import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SNART_COPY } from '../snart-copy.nb';
import { buildSnartPlan, type SnartPlanInput } from '../snart';

const ALL_CONCEPTS = [
  'snart.base_layer',
  'snart.mid_layer',
  'snart.insulated_outer',
  'snart.cold_headwear',
  'snart.handwear',
  'snart.weather_shell',
] as const;

const validInput = (overrides: Partial<SnartPlanInput> = {}): SnartPlanInput => ({
  asOfLocalDate: '2026-01-01',
  timezone: 'Europe/Oslo',
  homePlaceKey: 'no-city:v1:oslo:599139:107522',
  climateProfileId: 'snart-profile:v2:no-city:v1:oslo:599139:107522',
  ageEligibleForWholeWindow: true,
  alreadyHaveConceptIds: new Set<string>(),
  ...overrides,
});

const expectUnavailableWithoutAdvice = (result: ReturnType<typeof buildSnartPlan>) => {
  expect(result.status).toBe('unavailable');
  expect(Object.keys(result).sort()).toEqual(['copy', 'reason', 'status']);
  expect(result.copy).toBe('Vi har ikke godt nok historisk grunnlag for dette stedet akkurat nå.');
  expect(JSON.stringify(result)).not.toMatch(/snart\.|ruleId|conceptId|items|groups|signalValue/u);
};

const expectDeepFrozen = (value: unknown): void => {
  if (!value || typeof value !== 'object') return;
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value)) expectDeepFrozen(child);
};

describe('Snart plan model', () => {
  it('accepts only the six exact own input fields', () => {
    const requiredKeys = Object.keys(validInput());
    for (const missingKey of requiredKeys) {
      const candidate = { ...validInput() } as Record<string, unknown>;
      delete candidate[missingKey];
      expectUnavailableWithoutAdvice(buildSnartPlan(candidate as SnartPlanInput));
    }

    for (const forbiddenKey of [
      'childId',
      'birthLocalDate',
      'coordinates',
      'actionTimestamp',
      'name',
      'extra',
    ]) {
      const candidate = { ...validInput(), [forbiddenKey]: 'forbidden' };
      expectUnavailableWithoutAdvice(buildSnartPlan(candidate as SnartPlanInput));
    }

    const inherited = Object.assign(
      Object.create({ childId: 'inherited' }) as Record<string, unknown>,
      validInput(),
    );
    expectUnavailableWithoutAdvice(buildSnartPlan(inherited as SnartPlanInput));

    const symbolKey = { ...validInput() } as SnartPlanInput & { [key: symbol]: boolean };
    symbolKey[Symbol('childId')] = true;
    expectUnavailableWithoutAdvice(buildSnartPlan(symbolKey));
  });

  it('requires an exact native Set containing only known concept IDs and never mutates it', () => {
    const invalidSets: unknown[] = [
      ['snart.base_layer'],
      new Map(),
      new Set([42]),
      new Set(['snart.unknown']),
      Object.assign(new Set<string>(), { extra: true }),
    ];
    class SetSubclass extends Set<string> {}
    invalidSets.push(new SetSubclass());
    const symbolSet = new Set<string>() as Set<string> & { [key: symbol]: boolean };
    symbolSet[Symbol('unexpected')] = true;
    invalidSets.push(symbolSet);

    for (const alreadyHaveConceptIds of invalidSets) {
      expectUnavailableWithoutAdvice(buildSnartPlan(validInput({
        alreadyHaveConceptIds: alreadyHaveConceptIds as ReadonlySet<string>,
      })));
    }

    const alreadyHaveConceptIds = new Set<string>(['snart.base_layer']);
    const before = [...alreadyHaveConceptIds];
    const result = buildSnartPlan(validInput({ alreadyHaveConceptIds }));
    expect([...alreadyHaveConceptIds]).toEqual(before);
    const serializedResult = JSON.stringify(result);
    alreadyHaveConceptIds.add('snart.mid_layer');
    expect(JSON.stringify(result)).toBe(serializedResult);
  });

  it('returns exact immutable presentation copy and traceable row copy', () => {
    const result = buildSnartPlan(validInput());
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;

    expect(result.startLocalDate).toBe('2026-01-29');
    expect(result.endLocalDate).toBe('2026-02-12');
    expect(result.copy).toEqual({
      title: 'Planlegg for 2026-01-29–2026-02-12',
      subtitle: 'Basert på månedlige normaler for 1991–2020, ikke et værvarsel.',
      groups: {
        check_first: 'Sjekk først',
        available_if_needed: 'Kan være greit å ha tilgjengelig',
        not_highlighted: 'Ikke fremhevet for perioden',
      },
      note: 'Dette er en Babyora-planleggingsregel basert på historiske månedsnormaler. Sjekk dagens vær og egne behov nærmere datoen.',
      source: 'Månedsnormaler 1991–2020: Meteorologisk institutt (MET Norway). Bearbeidet av Babyora.',
    });
    expect(result.items.every((item) => (
      item.copy === SNART_COPY.rules[item.ruleId as keyof typeof SNART_COPY.rules]
      && item.startLocalDate === result.startLocalDate
      && item.endLocalDate === result.endLocalDate
      && item.rulesetVersion === 'babyora-snart-heuristics@2'
      && item.evidenceType === 'product_heuristic'
      && item.policyOwner === 'Babyora'
    ))).toBe(true);
    expectDeepFrozen(SNART_COPY);
    expectDeepFrozen(result);
    expect(JSON.stringify(result)).toBe(JSON.stringify(buildSnartPlan(validInput())));
  });

  it('removes only actionable Har allerede winners and returns empty only when no row remains', () => {
    const cold = buildSnartPlan(validInput());
    expect(cold.status).toBe('ready');
    if (cold.status !== 'ready') return;
    expect(cold.items.every((item) => item.group !== 'not_highlighted')).toBe(true);

    const empty = buildSnartPlan(validInput({
      alreadyHaveConceptIds: new Set(ALL_CONCEPTS),
    }));
    expect(empty.status).toBe('empty');
    if (empty.status === 'empty') {
      expect(empty.copy).toEqual({
        title: 'Planlegg for 2026-01-29–2026-02-12',
        empty: 'Ingenting å forberede akkurat nå.',
        source: 'Månedsnormaler 1991–2020: Meteorologisk institutt (MET Norway). Bearbeidet av Babyora.',
      });
      expectDeepFrozen(empty);
    }
  });

  it('keeps not_highlighted visible and non-markable after every actionable winner is marked', () => {
    const warmInput = validInput({ asOfLocalDate: '2026-06-01' });
    const initial = buildSnartPlan(warmInput);
    expect(initial.status).toBe('ready');
    if (initial.status !== 'ready') return;
    const actionable = initial.items
      .filter((item) => item.canMarkAlreadyHave)
      .map((item) => item.conceptId);
    const notHighlighted = initial.items
      .filter((item) => !item.canMarkAlreadyHave)
      .map((item) => item.conceptId);
    expect(notHighlighted.length).toBeGreaterThan(0);

    const filtered = buildSnartPlan(validInput({
      asOfLocalDate: '2026-06-01',
      alreadyHaveConceptIds: new Set([...actionable, ...notHighlighted]),
    }));
    expect(filtered.status).toBe('ready');
    if (filtered.status !== 'ready') return;
    expect(filtered.items.map((item) => item.conceptId)).toEqual(notHighlighted);
    expect(filtered.items.every((item) => (
      item.group === 'not_highlighted' && item.canMarkAlreadyHave === false
    ))).toBe(true);
  });

  it('fails closed on invalid age, timezone, date and profile without advice', () => {
    expectUnavailableWithoutAdvice(buildSnartPlan(validInput({ ageEligibleForWholeWindow: false })));
    expectUnavailableWithoutAdvice(buildSnartPlan(validInput({ timezone: 'UTC' as 'Europe/Oslo' })));
    expectUnavailableWithoutAdvice(buildSnartPlan(validInput({ asOfLocalDate: '2026-02-30' })));
    expectUnavailableWithoutAdvice(buildSnartPlan(validInput({ climateProfileId: 'unknown' })));
  });

  it('keeps visible copy clear of blocked Norwegian morphology and MET endorsement', () => {
    const visibleCopy = JSON.stringify(SNART_COPY).normalize('NFC');
    const blockedPatterns = [
      /trygg(?:het|heten|hets|e|ere|est)?/iu,
      /sikker(?:het|heten|hets|e|ere|est)?/iu,
      /helse(?:råd|faglig|messig|påstand)?/iu,
      /medisin(?:sk|ske|en)?/iu,
      /(?:kulde)?eksponerings?(?:fare|tid|råd)?/iu,
      /spedbarns?(?:råd)?/iu,
      /sol(?:hatt|krem|beskyttelse|dekkende)?/iu,
      /uv(?:-?indeks|stråling)?/iu,
      /størrels(?:e|er|es|esråd)/iu,
      /passform(?:en|er|råd)?/iu,
      /kjøp(?:e|er|spåbud)?/iu,
      /material(?:e|er|valg|rangering)/iu,
      /(?:MET|Meteorologisk institutt)(?:s)?\s+(?:regel|grense|anbefaling)/iu,
      /anbefalt\s+av\s+(?:MET|Meteorologisk institutt)/iu,
    ];
    for (const pattern of blockedPatterns) expect(visibleCopy).not.toMatch(pattern);
  });

  it('keeps runtime imports and source boundaries pure while capability remains false', () => {
    const runtimeSources = [
      '../snart-climate.ts',
      '../snart-copy.nb.ts',
      '../snart-date-window.ts',
      '../snart-heuristics-v1.ts',
      '../snart.ts',
    ].map((path) => readFileSync(new URL(path, import.meta.url), 'utf8'));
    const modelSource = readFileSync(new URL('../snart.ts', import.meta.url), 'utf8');
    const capabilitySource = readFileSync(
      new URL('../../premium/plus-features.ts', import.meta.url),
      'utf8',
    );

    for (const source of runtimeSources) {
      expect(source).not.toMatch(/node:|scripts\/|fetch\s*\(|XMLHttpRequest|WebSocket/iu);
      expect(source).not.toMatch(/localStorage|sessionStorage|indexedDB|CacheStorage|posthog|analytics|console\./iu);
    }
    expect(modelSource).not.toMatch(/childId|birthLocalDate|coordinates|actionTimestamp|\bname\b/iu);
    expect(capabilitySource).toMatch(/soon_preparation:\s*false/u);
    expect(capabilitySource).toMatch(/family_sharing:\s*false/u);
    expect(capabilitySource).toMatch(/personal_calibration:\s*false/u);
  });
});
