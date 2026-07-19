# Testing Patterns

**Analysis Date:** 2026-07-19

## Test Framework

**Runner:**
- Vitest 4.1.8, declared in \`package.json\`; the current suite runs 56 test files and 567 tests.
- Config: no dedicated Vitest config is present; \`vite.config.ts\` contains build configuration only, so tests use Vitest's default Node environment. Browser-dependent units provide local shims in \`src/hooks/__tests__/useOverrides.test.tsx\` and \`src/hooks/__tests__/useTooltipSeen.test.tsx\`.

**Assertion Library:**
- Vitest's built-in \`expect\`, imported explicitly with \`describe\` and \`it\` in files such as \`src/lib/clothing-engine-v2/__tests__/validation.test.ts\` and \`tools/product-audit/capture.test.ts\`.

**Run Commands:**
\`\`\`bash
npm test                  # Run all Vitest tests once; package.json
npm run test:watch        # Run Vitest in watch mode; package.json
npm run audit:test        # Run the product-audit subset; package.json
\`\`\`

## Test File Organization

**Location:**
- Co-locate focused tests beside small modules, as in \`src/lib/weather-tip.test.ts\`, \`src/lib/summary.test.ts\`, and \`tools/product-audit/score.test.ts\`.
- Use a feature-local \`__tests__/\` directory for larger subsystems, as in \`src/lib/clothing-engine-v2/__tests__/\`, \`src/lib/wool-layers/__tests__/\`, \`src/hooks/__tests__/\`, and \`src/state/__tests__/\`.
- Store generated snapshots in the adjacent \`__tests__/__snapshots__/\` directory, as in \`src/lib/clothing-engine-v2/__tests__/__snapshots__/legacy-adapter.test.ts.snap\` and \`src/lib/wool-layers/__tests__/__snapshots__/finalize-safety.test.ts.snap\`.

**Naming:**
- Name executable Vitest files \`*.test.ts\` or \`*.test.tsx\`, following \`src/lib/clothing-engine-v2/__tests__/safety.test.ts\` and \`src/hooks/__tests__/useTooltipSeen.test.tsx\`.
- Name reusable test data without the \`.test\` segment when it should be imported rather than collected independently, as with \`src/lib/clothing-engine-v2/__tests__/gold-scenarios.ts\`.

**Structure:**
\`\`\`text
src/<feature>/
├── implementation.ts
├── implementation.test.ts
└── __tests__/
    ├── behavior.test.ts
    ├── fixtures.ts
    └── __snapshots__/
\`\`\`
This pattern is represented by \`src/lib/wool-layers/visibility.test.ts\` and \`src/lib/clothing-engine-v2/__tests__/\`.

## Test Structure

**Suite Organization:**
\`\`\`typescript
import { describe, expect, it } from 'vitest';
import { validateRecommendInputV2 } from '../validation.js';

describe('Motor 2.0 input validation', () => {
  it.each([-1, 25, 36])('avviser alder utenfor 0–24: %s', (ageMonths) => {
    expect(() => validateRecommendInputV2(validInput({ ageMonths })))
      .toThrowError(expect.objectContaining({ code: 'unsupported_age' }));
  });
});
\`\`\`
This is the table-driven pattern used in \`src/lib/clothing-engine-v2/__tests__/validation.test.ts\`.

**Patterns:**
- Group by function, rule family, or contract with \`describe\`, and name \`it\` cases in Norwegian or concise domain language that states the expected behavior, as in \`src/lib/clothing-engine-v2/__tests__/safety.test.ts\` and \`src/state/__tests__/child-profile.test.ts\`.
- Use small local builders to establish valid defaults and override only the field under test, such as \`validInput\`, \`pipelineTo\`, and \`point\` in \`src/lib/clothing-engine-v2/__tests__/validation.test.ts\`, \`src/lib/clothing-engine-v2/__tests__/safety.test.ts\`, and \`src/lib/met-no/__tests__/client.test.ts\`.
- Use \`it.each\` for boundaries and matrices, and generated loops for named contract catalogs, as in \`src/lib/clothing-engine-v2/__tests__/validation.test.ts\` and \`src/lib/clothing-engine-v2/__tests__/gold-scenarios.test.ts\`.
- Use \`beforeAll\` to install a process-local browser shim once and \`beforeEach\` to clear state, following \`src/hooks/__tests__/useOverrides.test.tsx\` and \`src/lib/feedback/__tests__/feedback-store.test.ts\`.
- Assert semantic structure, invariants, purity, and stable error codes rather than only display copy, following \`src/lib/clothing-engine-v2/__tests__/safety.test.ts\` and \`src/lib/clothing-engine-v2/__tests__/validation.test.ts\`.

## Mocking

**Framework:** Vitest supplies mocking APIs through \`vitest\`, but the current tests do not use \`vi.mock\`, \`vi.fn\`, or \`vi.spyOn\`; they use hand-built browser shims and injected deterministic data in \`src/hooks/__tests__/useOverrides.test.tsx\`, \`src/hooks/__tests__/useTooltipSeen.test.tsx\`, and \`tools/product-audit/capture.ts\`.

**Patterns:**
\`\`\`typescript
beforeAll(() => {
  const store = new Map<string, string>();
  globalThis.sessionStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  } as Storage;
});

beforeEach(() => {
  sessionStorage.clear();
});
\`\`\`
This condenses the in-memory \`Storage\` pattern in \`src/hooks/__tests__/useOverrides.test.tsx\`.

**What to Mock:**
- Replace browser-only storage with minimal in-memory implementations under the Node runner, following \`src/hooks/__tests__/useOverrides.test.tsx\`, \`src/hooks/__tests__/useTooltipSeen.test.tsx\`, and \`src/lib/garments/__tests__/ownership.test.ts\`.
- Supply deterministic local weather and route interception instead of depending on live services, following \`src/lib/met-no/__tests__/client.test.ts\` and \`tools/product-audit/capture.ts\`.
- Use React server rendering for simple initial hook/component output that does not require browser effects, following \`src/hooks/__tests__/useTooltipSeen.test.tsx\`.

**What NOT to Mock:**
- Do not mock pure domain collaborators inside pipeline tests; exercise validation, thermal intent, material resolution, garment resolution, and safety together as in \`src/lib/clothing-engine-v2/__tests__/safety.test.ts\`.
- Do not replace the built application shell in smoke verification; \`e2e/smoke.ts\` launches Chromium against a local Vite preview and observes page, console, and response failures.
- Do not hit production purchase services in automated E2E; \`e2e/purchase-flow.ts\` explicitly exercises the web/dev purchase simulation rather than StoreKit or RevenueCat production state.

## Fixtures and Factories

**Test Data:**
\`\`\`typescript
function validInput(partial?: Partial<RecommendInputV2>): RecommendInputV2 {
  return {
    weather: { tempC: 4, feelsLikeC: 2, windMs: 3, precipMmH: 0 },
    ageMonths: 8,
    situation: 'stroller_awake',
    ...partial,
  };
}
\`\`\`
This default-plus-overrides factory comes from \`src/lib/clothing-engine-v2/__tests__/validation.test.ts\`.

**Location:**
- Keep one-off factories and fixtures in the test file, as in \`src/lib/met-no/__tests__/client.test.ts\`, \`src/lib/clothing-engine-v2/__tests__/safety.test.ts\`, and \`src/state/__tests__/child-profile.test.ts\`.
- Keep shared, named acceptance scenarios in a feature-local fixture module, as in \`src/lib/clothing-engine-v2/__tests__/gold-scenarios.ts\`, then iterate them in \`src/lib/clothing-engine-v2/__tests__/gold-scenarios.test.ts\`.
- Keep deterministic tooling fixtures close to the production helper when they are also used by browser capture, as with \`buildForecastFixture\` in \`tools/product-audit/capture.ts\`.

## Coverage

**Requirements:** None enforced; \`package.json\` has no coverage script or Vitest coverage provider, and \`.github/workflows/ci.yml\` gates lint, unit tests, product-audit tests, build, and E2E smoke without a percentage threshold.

**View Coverage:**
\`\`\`bash
# Not configured; package.json defines no coverage command or provider.
\`\`\`

## Test Types

**Unit Tests:**
- Pure domain logic, parsers, copy rules, stores, and view-model helpers make up the main suite under \`src/lib/**\`, \`src/state/__tests__/\`, \`src/data/*.test.ts\`, and \`src/components/**/__tests__/\`.
- Hook tests isolate pure helpers or initial server-rendered state because the runner is Node rather than jsdom, as documented in \`src/hooks/__tests__/useCountUp.test.ts\`, \`src/hooks/__tests__/useOverrides.test.tsx\`, and \`src/hooks/__tests__/useTooltipSeen.test.tsx\`.

**Integration Tests:**
- Engine pipeline and safety tests compose several real modules and assert cross-stage invariants in \`src/lib/clothing-engine-v2/__tests__/safety.test.ts\`, \`src/lib/clothing-engine-v2/__tests__/gold-scenarios.test.ts\`, and \`src/lib/wool-layers/__tests__/finalize-safety.test.ts\`.
- Product-audit tests cover capture planning, deterministic forecasts, scoring, prompts, and reports in \`tools/product-audit/*.test.ts\`; the subset runs through \`npm run audit:test\` in \`package.json\` and \`.github/workflows/ci.yml\`.
- Native Android files contain only generated example JUnit tests in \`android/app/src/test/java/com/getcapacitor/myapp/ExampleUnitTest.java\` and \`android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java\`; they are not part of the npm CI job in \`.github/workflows/ci.yml\`.

**E2E Tests:**
- Playwright 1.60.0 is used through executable TypeScript scripts rather than the Playwright test runner; \`e2e/smoke.ts\` launches a preview server and verifies onboarding plus the demo app shell.
- \`e2e/purchase-flow.ts\` covers yearly purchase, monthly purchase, and restore paths against the browser/dev mock; \`package.json\` exposes it as \`npm run e2e:purchase\`.
- CI runs \`npm run e2e\` after build and Chromium installation, but does not run \`npm run e2e:purchase\`, as shown in \`.github/workflows/ci.yml\`.

## Common Patterns

**Async Testing:**
\`\`\`typescript
it('finaliserer sikkerhet dynamisk', async () => {
  const { finalizeSafety } = await import('../finalize-safety.js');
  const finalized = finalizeSafety(input, rec.layers, rec.structuredNotes, []);
  expect(finalized.layers).toEqual(rec.layers);
});
\`\`\`
This matches the dynamic-import async pattern in \`src/lib/wool-layers/__tests__/finalize-safety.test.ts\`; browser-level async flows use explicit waits and \`try/finally\` cleanup in \`e2e/smoke.ts\`.

**Error Testing:**
\`\`\`typescript
expect(() => validateRecommendInputV2(validInput({ ageMonths: 25 })))
  .toThrowError(expect.objectContaining({ code: 'unsupported_age' }));
\`\`\`
Use stable error codes and object matching for typed domain failures, as in \`src/lib/clothing-engine-v2/__tests__/validation.test.ts\`; use \`expect.unreachable\` plus \`try/catch\` only when individual error fields need inspection in the same file.

---

*Testing analysis: 2026-07-19*
