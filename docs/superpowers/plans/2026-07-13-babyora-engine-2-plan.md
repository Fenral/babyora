# Babyora Motor 2.0 Implementation Plan

> **For Claude Code:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task by task. Use `superpowers:test-driven-development` for every behavior change and `superpowers:verification-before-completion` before claiming a phase complete.

**Goal:** Replace the wool-first recommendation model with a deterministic, material-aware engine for outdoor clothing from 0–24 months, while first containing known legacy post-safety mutation risks and then preserving safe production behavior through a tested adapter and staged feature flags.

**Architecture:** Build Motor 2.0 beside `src/lib/wool-layers`. It derives an age/situation-aware `ThermalIntent`, resolves materials and structured garment variants, applies safety after calibration, emits `RecommendationV2`, and adapts that result to the current `Recommendation` shape. Roll out first in shadow mode, then by age stage. Do not rewrite screens until the engine contracts and regressions are green.

**Tech Stack:** TypeScript, React 19, Vite, Vitest, ESLint, localStorage, existing PostHog wrapper, existing Supabase plan.

**Product references:**

- `docs/superpowers/specs/2026-07-13-babyora-engine-2-design.md`
- `docs/superpowers/specs/2026-07-13-babyora-engine-2-validation.md`
- `docs/superpowers/plans/2026-07-13-babyora-verification-protocol.md`

---

## Execution rules

1. Never implement directly on an unprotected folder. Complete Task 0 first.
2. Do not change temperature thresholds, safety severity or Norwegian safety copy while building the structural engine unless a separate reviewed decision records the change.
3. Add a failing test, run it and observe the expected failure before adding production behavior.
4. Keep `src/lib/wool-layers` intact until the V2 adapter, shadow comparison and rollback tests pass.
5. Do not add wardrobe registration, photos, AI, affiliate products or brand-specific garments.
6. Do not gate material preference, valid situations or safety explanations behind Plus.
7. Use neutral fallback icons when a material-specific illustration does not exist.
8. One task equals one reviewable commit. If Git is not available, stop rather than simulating commit history.
9. Reject ages 25+ in v1. Do not implement toddler/preschool cohorts from superseded 0–71-month drafts.
10. A safe rollback means the contained legacy path from Task 0A, never the pre-containment legacy path.

## Task 0: Establish a protected baseline

**Files:**

- Create: `docs/superpowers/evidence/engine-2-baseline.md`
- Verify: `.git/`
- Verify: `package-lock.json`

**Step 1: Verify repository protection**

Run:

```powershell
git status --short
git branch --show-current
git rev-parse --show-toplevel
```

Expected: all commands identify the intended `Fenral/babyora` repository and current branch/commit. The repository is now git-backed; stop if a different or unexplained working copy is open.

**Step 2: Record the baseline**

Run:

```powershell
node --version
npm --version
npm test
npm run audit:test
npm run build
npm run lint
```

Write exact outputs, current commit and lockfile hash into `docs/superpowers/evidence/engine-2-baseline.md`. The known starting point is 222 unit tests passing, 19 audit tests passing, build passing, and lint failing with 17 errors and 2 warnings.

**Step 3: Commit baseline evidence only**

```powershell
git add docs/superpowers/evidence/engine-2-baseline.md
git commit -m "docs: record engine 2 baseline"
```

Do not stage source or script files in this commit.

## Task 0A: Contain legacy post-safety mutations

**Files:**

- Create: `src/lib/wool-layers/finalize-safety.ts`
- Create: `src/lib/wool-layers/__tests__/finalize-safety.test.ts`
- Modify: `src/lib/wool-layers/recommend.ts`
- Modify: `src/screens/HjemScreen.tsx`
- Modify only if required by the failing matrix: `src/lib/garments/ownership-override.ts`
- Create: `docs/superpowers/evidence/legacy-safety-containment.md`

**Step 1: Prove the current gap with failing tests**

Add named cases showing that category overrides, child calibration, ownership substitution and session/UI swaps cannot reintroduce a combination removed by conflicts, soft blocks or hard safety. Include car-seat insulated outerwear, sleep headwear/blanket, stacked stroller insulation, weather-protection preservation and calibration bounds.

Run the focused matrix and capture the expected failures against the current ordering.

**Step 2: Establish one finalization boundary**

All post-recommendation mutations must pass through one pure finalizer after the last allowed change. The finalizer applies the approved conflict, soft-block and hard-safety semantics without changing temperature thresholds or unrelated recommendations. Screens may request a swap; they may not construct a trusted final `Recommendation` by mapping arrays locally.

**Step 3: Prove safe rollback and stable behavior**

- Existing recommendations remain byte/semantic equivalent except where the new tests prove an unsafe post-safety mutation.
- All legacy consumers use the contained path.
- Motor V2 all-flags-off rollback selects this contained legacy path.
- A fresh independent reviewer checks the full diff and guardrail matrix.

**Step 4: Verify and commit**

Run focused tests, all existing guardrails, `npm test`, `npm run audit:test`, `npm run build`, and lint delta. Record exact evidence and commit only this safety package:

```powershell
git commit -m "fix(safety): contain post-recommendation mutations"
```

## Task 0B: Make the known lint baseline green

**Files:**

- Modify only the files named by the recorded lint output.
- Modify: `docs/superpowers/evidence/engine-2-baseline.md`

**Step 1: Fix baseline lint separately**

Make only lint-preserving refactors. Do not change engine rules in this step. Re-run the specific file test after every hook refactor, then run the full suite.

**Step 2: Verify the clean gate**

Expected:

```text
npm test          PASS
npm run audit:test PASS
npm run build     PASS
npm run lint      PASS
```

Record the clean outputs and a short list of mechanical fixes in the evidence document.

**Step 3: Review and commit only named files**

```powershell
git status --short
git diff --check
# Stage the evidence file and each explicitly reviewed lint-fix file by full path.
git commit -m "chore: establish clean engine 2 baseline"
```

Never use `git add src`, `git add scripts` or `git add -A` in a dirty worktree.

## Task 1: Add V2 domain contracts and typed validation errors

**Files:**

- Create: `src/lib/clothing-engine-v2/types.ts`
- Create: `src/lib/clothing-engine-v2/errors.ts`
- Create: `src/lib/clothing-engine-v2/validation.ts`
- Create: `src/lib/clothing-engine-v2/__tests__/validation.test.ts`
- Create: `src/lib/clothing-engine-v2/index.ts`

**Step 1: Write failing contract tests**

```ts
import { describe, expect, it } from 'vitest';
import { validateRecommendInputV2 } from '../validation.js';

describe('Motor 2.0 input validation', () => {
  it.each([-1, 25])('rejects unsupported age %s', (ageMonths) => {
    expect(() => validateRecommendInputV2(validInput({ ageMonths })))
      .toThrowError(expect.objectContaining({ code: 'unsupported_age' }));
  });

  it('rejects an invalid low-mobility situation for the oldest supported stage', () => {
    expect(() => validateRecommendInputV2(validInput({ ageMonths: 24, situation: 'awake_low_mobility' })))
      .toThrowError(expect.objectContaining({ code: 'invalid_situation_for_age' }));
  });
});
```

Run: `npx vitest run src/lib/clothing-engine-v2/__tests__/validation.test.ts`

Expected: FAIL because the module does not exist.

**Step 2: Add the minimum contracts**

Define `AgeStage`, `Situation`, `ActivityIntensity`, `MaterialPreference`, `MaterialFamily`, `WarmthLevel`, `ThermalIntent`, `GarmentRole`, `GarmentVariant`, `ResolvedGarment`, `RecommendationV2`, and `RecommendInputV2` exactly as approved in the design spec. Reuse `WeatherInput`, `TempBand`, `SafetyFlag` and `Severity` through type-only imports where semantics match.

```ts
export type EngineV2ErrorCode =
  | 'invalid_number'
  | 'unsupported_age'
  | 'invalid_situation_for_age'
  | 'invalid_material_preference'
  | 'unresolved_material_constraint';

export class EngineV2Error extends Error {
  constructor(public readonly code: EngineV2ErrorCode, message: string) {
    super(message);
    this.name = 'EngineV2Error';
  }
}
```

**Step 3: Re-run the focused test**

Expected: PASS.

**Step 4: Run typecheck/build**

Run: `npm run build`

Expected: PASS.

**Step 5: Commit**

```powershell
git add src/lib/clothing-engine-v2
git commit -m "feat(engine-v2): define domain contracts"
```

## Task 2: Implement age stages and valid situations

**Files:**

- Create: `src/lib/clothing-engine-v2/age.ts`
- Create: `src/lib/clothing-engine-v2/situations.ts`
- Modify: `src/lib/clothing-engine-v2/validation.ts`
- Modify: `src/lib/clothing-engine-v2/__tests__/validation.test.ts`

**Step 1: Add boundary tests**

```ts
it.each([
  [0, 'newborn'], [5, 'newborn'], [6, 'mobile_baby'], [11, 'mobile_baby'],
  [12, 'young_toddler'], [23, 'young_toddler'], [24, 'young_toddler'],
] as const)('%s months maps to %s', (age, expected) => {
  expect(ageStageFor(age)).toBe(expected);
});
```

Add table-driven tests for every allowed and forbidden cell in the validation matrix.

**Step 2: Observe failure**

Run the focused test and confirm missing implementations fail.

**Step 3: Implement pure lookup functions**

```ts
export function ageStageFor(ageMonths: number): AgeStage {
  if (!Number.isFinite(ageMonths) || ageMonths < 0 || ageMonths >= 25) {
    throw new EngineV2Error('unsupported_age', 'Motor 2.0 v1 supports ages 0–24 months');
  }
  if (ageMonths < 6) return 'newborn';
  if (ageMonths < 12) return 'mobile_baby';
  return 'young_toddler';
}
```

Store situation profiles as explicit frozen data. `indoor_sleep` must only accept the first three age stages.

**Step 4: Verify**

Run focused test, full tests, lint and build.

**Step 5: Commit**

```powershell
git add src/lib/clothing-engine-v2
git commit -m "feat(engine-v2): model age-aware situations"
```

## Task 3: Create the structured garment catalog

**Files:**

- Create: `src/lib/clothing-engine-v2/catalog.ts`
- Create: `src/lib/clothing-engine-v2/catalog-validation.ts`
- Create: `src/lib/clothing-engine-v2/__tests__/catalog.test.ts`

**Step 1: Write catalog integrity tests**

```ts
it('has unique stable variant ids', () => {
  const ids = GARMENT_VARIANTS.map((item) => item.id);
  expect(new Set(ids).size).toBe(ids.length);
});

it('never labels a fleece variant with a wool illustration', () => {
  for (const item of GARMENT_VARIANTS.filter((item) => item.material === 'fleece')) {
    expect(item.illustrationId).not.toMatch(/ull|wool/i);
  }
});
```

Also assert every item has a valid role, material, age stage, warmth level, Norwegian legacy label, and either a verified illustration or `null`.

**Step 2: Observe failure**

Run: `npx vitest run src/lib/clothing-engine-v2/__tests__/catalog.test.ts`

**Step 3: Add the minimum catalog**

Start with generic concepts needed by all 36 revised 0–24-month gold scenarios. Model function separately from wording:

```ts
{
  id: 'base-fullbody-wool-light-infant',
  role: 'base_fullbody',
  material: 'wool',
  warmth: 1,
  windproof: false,
  waterproof: false,
  moistureManagement: 'high',
  validAgeStages: ['newborn', 'mobile_baby', 'young_toddler'],
  legacyNameNb: 'tynn ullbody og ullongs',
  illustrationId: null,
}
```

Do not use regex to infer material. Do not reuse an illustration when it visually claims the wrong material.

**Step 4: Verify and commit**

Run focused test, full test, lint, build; then commit:

```powershell
git add src/lib/clothing-engine-v2
git commit -m "feat(engine-v2): add structured garment catalog"
```

## Task 4: Derive thermal intent without garment text

**Files:**

- Create: `src/lib/clothing-engine-v2/thermal-intent.ts`
- Create: `src/lib/clothing-engine-v2/exposure.ts`
- Create: `src/lib/clothing-engine-v2/__tests__/thermal-intent.test.ts`

**Step 1: Write relationship tests first**

```ts
it('active play never needs more insulation than calm outdoors', () => {
  const active = calculateThermalIntent(input({ situation: 'active_play' }));
  const calm = calculateThermalIntent(input({ situation: 'calm_outdoors' }));
  expect(active.insulationWarmth).toBeLessThanOrEqual(calm.insulationWarmth);
});

it('rain adds waterproof intent without changing material preference', () => {
  const intent = calculateThermalIntent(input({ precipMmH: 2 }));
  expect(intent.needsWaterproofShell).toBe(true);
});
```

Add age, wind, precipitation, UV, exposure and temperature-boundary cases from the validation spec.

**Step 2: Observe failure**

Run the focused test.

**Step 3: Implement the pure calculation**

Reuse `bandForTemp()` initially to prevent accidental threshold drift. The output must contain only needs and explanation codes; an assertion must reject Norwegian garment labels.

```ts
const intensityDelta: Record<ActivityIntensity, -1 | 0 | 1> = {
  active: -1,
  mixed: 0,
  resting: 1,
};
```

Clamp warmth to `0..4`. Weather protection booleans are independent of insulation warmth.

**Step 4: Verify and commit**

Run focused test, full test, lint, build. Commit:

```powershell
git add src/lib/clothing-engine-v2
git commit -m "feat(engine-v2): derive thermal intent"
```

## Task 5: Move personal calibration before safety

**Files:**

- Create: `src/lib/clothing-engine-v2/calibration.ts`
- Create: `src/lib/clothing-engine-v2/__tests__/calibration.test.ts`

**Step 1: Write failing calibration tests**

```ts
it.each([-1, 0, 1] as const)('changes warmth by at most one for %s', (bias) => {
  const base = intent({ insulationWarmth: 2 });
  const result = applyThermalCalibration(base, bias);
  expect(Math.abs(result.insulationWarmth - base.insulationWarmth)).toBeLessThanOrEqual(1);
});

it('does not alter shell or equipment needs', () => {
  const base = intent({ needsWaterproofShell: true, equipment: ['stroller_rain_cover'] });
  expect(applyThermalCalibration(base, -1)).toMatchObject({
    needsWaterproofShell: true,
    equipment: ['stroller_rain_cover'],
  });
});
```

**Step 2: Implement only warmth adjustment**

Never add garment names such as `halsedisse` during calibration. Return a new intent and add a stable explanation code.

**Step 3: Verify and commit**

Run all engine tests and existing feedback-store tests. Commit:

```powershell
git add src/lib/clothing-engine-v2
git commit -m "feat(engine-v2): calibrate thermal intent safely"
```

## Task 6: Resolve material families

**Files:**

- Create: `src/lib/clothing-engine-v2/material-policy.ts`
- Create: `src/lib/clothing-engine-v2/material-resolver.ts`
- Create: `src/lib/clothing-engine-v2/__tests__/material-resolver.test.ts`

**Step 1: Write preference and condition tests**

```ts
it('produces no wool candidates when wool is avoided', () => {
  const result = resolveMaterialFamilies(intent(), 'avoid_wool');
  expect(result.flatMap((r) => r.rankedMaterials)).not.toContain('wool');
});

it('keeps shell first when wool is preferred in rain', () => {
  const result = resolveMaterialFamilies(intent({ needsWaterproofShell: true }), 'prefer_wool');
  expect(result.find((r) => r.role === 'shell_fullbody')?.rankedMaterials[0]).toBe('shell');
});
```

Cover all rows in the material decision matrix.

**Step 2: Implement an explicit policy table**

Resolver output should be ranked material candidates per garment role. It must not select a catalog item or label yet.

**Step 3: Verify and commit**

Run focused tests plus all tests, lint and build. Commit:

```powershell
git add src/lib/clothing-engine-v2
git commit -m "feat(engine-v2): resolve functional material choices"
```

## Task 7: Resolve age-appropriate garments and equipment

**Files:**

- Create: `src/lib/clothing-engine-v2/garment-resolver.ts`
- Create: `src/lib/clothing-engine-v2/equipment-resolver.ts`
- Create: `src/lib/clothing-engine-v2/__tests__/garment-resolver.test.ts`

**Step 1: Write failing role/material/age tests**

```ts
it('selects only variants valid for the age stage', () => {
  const result = resolveGarments(intent({ ageStage: 'young_toddler' }), policy());
  expect(result.every((item) => item.variant.validAgeStages.includes('young_toddler'))).toBe(true);
});

it('keeps stroller rain cover as equipment, not a garment', () => {
  const result = resolveRecommendationParts(intent({ equipment: ['stroller_rain_cover'] }), policy());
  expect(result.garments.every((item) => item.role !== 'equipment')).toBe(true);
  expect(result.equipment).toContainEqual(expect.objectContaining({ id: 'stroller_rain_cover' }));
});
```

**Step 2: Implement deterministic ranking**

Sort by role order, material rank, warmth distance, age validity, then stable variant ID. If no valid candidate satisfies `avoid_wool`, throw `unresolved_material_constraint`.

**Step 3: Verify and commit**

Run focused tests, all tests, lint and build. Commit.

## Task 8: Port safety rules to structured garments

**Files:**

- Create: `src/lib/clothing-engine-v2/safety.ts`
- Create: `src/lib/clothing-engine-v2/__tests__/safety.test.ts`
- Reference only: `src/lib/wool-layers/safety.ts`
- Reference only: `src/lib/wool-layers/softBlocks.ts`
- Reference only: `src/lib/wool-layers/conflicts.ts`

**Step 1: Convert every current guardrail into a V2 test**

Name tests by existing rule code such as `HB-9`, `SB-8` and `CK-5`. Assert structured roles/materials, not Norwegian regex strings.

```ts
it('HB-9 removes insulated outerwear under car-seat straps', () => {
  const result = applySafety(input({ carSeat: true }), partsWithInsulatedSuit());
  expect(result.garments).not.toContainEqual(expect.objectContaining({ role: 'insulated_fullbody' }));
  expect(result.flags).toContainEqual(expect.objectContaining({ code: 'HB-9', severity: 'CRITICAL' }));
});
```

**Step 2: Observe failures before porting behavior**

Run both V2 safety tests and existing guardrails.

**Step 3: Implement structured rules**

Each rule must use typed role/function fields. Regex is allowed only inside the legacy adapter, never as V2 safety truth.

**Step 4: Prove post-calibration safety**

Add tests for G30/G31 showing safety runs after calibrated intent and cannot be weakened.

**Step 5: Verify and commit**

Run both old and new engine suites, then all quality commands. Commit.

## Task 9: Build explanations, severity and stable fingerprints

**Files:**

- Create: `src/lib/clothing-engine-v2/explanations.ts`
- Create: `src/lib/clothing-engine-v2/fingerprint.ts`
- Create: `src/lib/clothing-engine-v2/__tests__/fingerprint.test.ts`
- Modify: `src/i18n/locales/no.json`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/sv.json`
- Modify: `src/i18n/locales/da.json`
- Modify: `src/i18n/locales/de.json`

**Step 1: Test semantic stability and privacy**

```ts
it('ignores personal identity in fingerprints', () => {
  expect(fingerprint(rec({ childName: 'A' }))).toBe(fingerprint(rec({ childName: 'B' })));
});

it('contains no forbidden personal fields', () => {
  expect(JSON.stringify(rec())).not.toMatch(/name|dob|lat|lon|childId/i);
});
```

**Step 2: Implement code-based explanations**

`Explanation` stores a stable code and interpolation values. Translation happens at the presentation boundary. Norwegian copy must avoid `perfekt`, `garantert` and absolute safety claims.

**Step 3: Add all locale keys**

Do not ship raw Norwegian labels into other locales. A native-language review remains a release gate; machine translations can be marked internally but not presented as reviewed.

**Step 4: Verify and commit**

Run copy lint tests, all tests, lint and build. Commit.

## Task 10: Assemble `recommendV2()` and encode the 36 gold scenarios

**Files:**

- Create: `src/lib/clothing-engine-v2/recommend.ts`
- Create: `src/lib/clothing-engine-v2/__tests__/gold-scenarios.ts`
- Create: `src/lib/clothing-engine-v2/__tests__/gold-scenarios.test.ts`
- Modify: `src/lib/clothing-engine-v2/index.ts`

**Step 1: Add all gold fixtures**

Represent every revised G01–G36 0–24-month scenario with complete input and expected semantic constraints.

```ts
export const GOLD_SCENARIOS: GoldScenario[] = [{
  id: 'G23',
  input: makeInput({ ageMonths: 18, situation: 'stroller_awake', feelsLikeC: -4, materialPreference: 'avoid_wool' }),
  assert(result) {
    expect(result.garments.some((item) => item.material === 'wool')).toBe(false);
  },
}];
```

**Step 2: Observe failure**

Run the gold scenario test before wiring `recommendV2()`.

**Step 3: Assemble the approved pipeline**

```ts
export function recommendV2(input: RecommendInputV2): RecommendationV2 {
  const validated = validateRecommendInputV2(input);
  const rawIntent = calculateThermalIntent(validated);
  const intent = applyThermalCalibration(rawIntent, validated.childCalibration ?? 0);
  const policy = resolveMaterialFamilies(intent, validated.materialPreference);
  const parts = resolveRecommendationParts(intent, policy);
  const safe = applySafety(validated, parts);
  return buildRecommendation(validated, intent, safe);
}
```

**Step 4: Run property/invariant tests**

Generate bounded combinations of age stages, temperature bands, situations and preferences. Avoid random tests without a seed.

**Step 5: Verify and commit**

Run all quality commands and commit.

## Task 11: Add the legacy adapter

**Files:**

- Create: `src/lib/clothing-engine-v2/legacy-adapter.ts`
- Create: `src/lib/clothing-engine-v2/__tests__/legacy-adapter.test.ts`
- Reference: `src/lib/wool-layers/types.ts`

**Step 1: Write adapter snapshots**

Cover one warm, mild, rainy, frost, stroller-equipment, car-seat and wool-free result.

```ts
it('maps equipment separately from garments', () => {
  const legacy = toLegacyRecommendation(v2WithRainCover());
  expect(legacy.layers.find((layer) => layer.category === 'utstyr')?.items)
    .toContain('regntrekk på vognen');
});
```

**Step 2: Implement mapping only**

The adapter maps roles to legacy categories and uses `legacyNameNb`. It may not calculate warmth, resolve materials or suppress safety flags.

**Step 3: Verify and commit**

Run adapter snapshots, old UI-facing tests, full suite, lint and build. Commit.

## Task 12: Add shadow comparison and rollback flags

**Files:**

- Create: `src/lib/clothing-engine-v2/feature-flags.ts`
- Create: `src/lib/clothing-engine-v2/shadow-compare.ts`
- Create: `src/lib/clothing-engine-v2/__tests__/shadow-compare.test.ts`

**Step 1: Test feature routing**

```ts
it('uses legacy output when all V2 display flags are off', () => {
  expect(selectEngine({ ageMonths: 18 }, allFlagsOff)).toBe('legacy');
});

it('never displays a shadow result', () => {
  expect(selectVisibleResult(shadowPair())).toBe(shadowPair().legacy);
});
```

**Step 2: Implement local constants and typed comparison**

Flags: `engine_v2_shadow`, `engine_v2_infant`, and `engine_v2_young_toddler`. Classify comparisons as `equivalent`, `expected_improvement`, `needs_review`, or `legacy_bug_preserved`.

**Step 3: Add rollback test**

Turning every V2 display flag off must use the untouched legacy motor without deleting V2 profile data.

**Step 4: Verify and commit**

Run all quality commands and commit.

## Task 13: Migrate child material preference without data loss

**Files:**

- Create: `src/state/child-profile.ts`
- Create: `src/state/__tests__/child-profile.test.ts`
- Modify: `src/state/children-store.tsx`

**Step 1: Extract profile type and parser tests**

```ts
it('defaults an existing stored child without losing fields', () => {
  expect(parseStoredChild(existingV2Child)).toEqual({
    ...existingV2Child,
    materialPreference: 'best_for_conditions',
  });
});

it('falls back from an unknown future preference only', () => {
  const parsed = parseStoredChild({ ...existingV2Child, materialPreference: 'future_value' });
  expect(parsed.materialPreference).toBe('best_for_conditions');
  expect(parsed.name).toBe(existingV2Child.name);
});
```

**Step 2: Keep the existing storage key**

Do not bump `babyora:children:v2` and do not force onboarding. Route `loadFromStorage()` through `parseStoredChild()` and filter only entries that cannot satisfy the core child schema.

**Step 3: Preserve Fast Refresh**

Move non-component types/parsers into `child-profile.ts`; this should also resolve the current Fast Refresh lint issue instead of adding an exception.

**Step 4: Verify and commit**

Run storage tests, full tests, lint and build. Commit.

## Task 14: Add privacy-safe analytics events

**Files:**

- Modify: `src/lib/analytics/track.ts`
- Create: `src/lib/analytics/__tests__/track.test.ts`

**Step 1: Test sanitization and event contracts**

Add typed events:

```ts
| { type: 'engine_v2_shadow_compared'; same_fingerprint: boolean; age_stage: AgeStage; situation: Situation; temp_band: TempBand }
| { type: 'material_preference_changed' }
| { type: 'material_alternative_opened'; material: MaterialFamily; role: GarmentRole }
| { type: 'engine_v2_fallback_used'; reason: EngineV2FallbackReason }
```

Test that exact age, material preference, name, DOB, coordinates and child/account IDs cannot be attached.

**Step 2: Implement no new identity layer**

Use the existing analytics wrapper and opt-out behavior. Do not add session recording or autocapture.

**Step 3: Verify and commit**

Run analytics tests, full tests, lint and build. Commit.

## Task 15: Add age-adaptive situation UI and material settings

**Files:**

- Create: `src/components/controls/AgeAdaptiveSituationPicker.tsx`
- Create: `src/components/profile/MaterialPreferenceSheet.tsx`
- Create: `src/components/controls/__tests__/AgeAdaptiveSituationPicker.test.tsx`
- Modify: `src/screens/HjemScreen.tsx`
- Modify: `src/screens/FinnAntrekkScreen.tsx`
- Modify: `src/screens/InnstillingerScreen.tsx`
- Modify: locale JSON files

**Step 1: Write interaction and accessibility tests**

Assert maximum three primary choices, correct choices for every age stage, keyboard/screen-reader labels, and no paywall trigger. Test that changing material preference regenerates the recommendation and reports the semantic difference.

**Step 2: Implement with the existing design system**

Reuse current spacing, typography, colors, focus rings and haptic abstraction. This task does not redesign the app or introduce a new palette. Material preference appears after first value, not as an onboarding blocker.

**Step 3: Keep legacy display through the adapter**

Until the UI 90+ plan builds the canonical `RecommendationView`, screens consume `toLegacyRecommendation(recommendV2(...))` only when the relevant display flag is enabled.

**Step 4: Verify and commit**

Run component tests, all quality commands and browser/device checks from the verification protocol. Commit.

## Task 16: Export the expert review packet

**Files:**

- Create: `scripts/export-engine-v2-review.ts`
- Create: `docs/superpowers/evidence/engine-v2-scenarios.json`
- Create: `docs/superpowers/evidence/engine-v2-expert-review.md`
- Add package script: `engine:v2:review`

**Step 1: Write an export test**

The export must contain G01–G36 exactly once, source input, intent, resolved roles/materials, safety flags, legacy difference and blank review decision fields. It must contain no PII.

**Step 2: Implement deterministic export**

The generated artifact must sort by scenario ID and produce byte-identical output for the same commit.

**Step 3: Generate and inspect**

Run:

```powershell
npm run engine:v2:review
$first = (Get-FileHash docs/superpowers/evidence/engine-v2-scenarios.json).Hash
npm run engine:v2:review
$second = (Get-FileHash docs/superpowers/evidence/engine-v2-scenarios.json).Hash
if ($first -ne $second) { throw 'Review export is not deterministic' }
```

After the artifact is committed, run the generator once more and require `git diff --exit-code -- docs/superpowers/evidence/engine-v2-scenarios.json` to pass.

**Step 4: Commit**

```powershell
git add scripts package.json docs/superpowers/evidence
git commit -m "docs(engine-v2): generate expert review packet"
```

## Task 17: Complete shadow review and activate only an approved cohort

**Files:**

- Modify: `src/lib/clothing-engine-v2/feature-flags.ts`
- Modify: `docs/superpowers/evidence/engine-v2-expert-review.md`
- Create: `docs/superpowers/evidence/engine-v2-release-evidence.md`

**Step 1: Keep all display flags off until external signoff**

`engine_v2_shadow` may run in demo/test. Infant and young-toddler display flags remain false.

**Step 2: Review every shadow difference**

No `needs_review` result may remain. Record each deliberate `expected_improvement` with its test and product rationale.

**Step 3: Receive external scenario signoff**

This is a human gate. Claude cannot approve its own safety work. Attach signed status and copy changes to the evidence file; rejected scenarios return to the relevant earlier task with a failing regression test.

**Step 4: Verify release gate**

Run:

```powershell
npm test
npm run audit:test
npm run lint
npm run build
npm run engine:v2:review
```

Then perform physical-device, reduced-motion, screen-reader, large-text, offline and rollback checks from the verification protocol.

**Step 5: Activate one cohort only**

Enable `engine_v2_infant` first. The 12–24-month `engine_v2_young_toddler` cohort requires its own evidence and commit. Never enable both display cohorts in one change.

**Step 6: Commit**

```powershell
git add src/lib/clothing-engine-v2/feature-flags.ts docs/superpowers/evidence
git commit -m "feat(engine-v2): activate approved infant cohort"
```

---

## Definition of done

Motor 2.0 is not done merely because tests pass. A cohort is done only when:

- Git and rollback are verified;
- all baseline and V2 tests, audit, lint and build pass;
- all relevant gold scenarios are automated;
- existing and revised 0–24-month safety guardrails remain green;
- no unexplained shadow differences remain;
- material constraints and age boundaries are proven;
- the expert packet is signed for that cohort;
- physical-device and accessibility evidence is recorded;
- current screens can fall back to the legacy motor without profile data loss.
