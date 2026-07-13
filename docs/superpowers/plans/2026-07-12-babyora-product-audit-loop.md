# Babyora Product Audit Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and run a read-only audit loop that captures every Babyora page, prepares a rigorous vision-analysis prompt, validates page scores, calculates the app total, and produces a prioritized improvement prompt without changing product code.

**Architecture:** A small TypeScript tool under `tools/product-audit` owns route/state capture, rubric configuration, prompt assembly, score validation, and Markdown reporting. The tool has a two-phase boundary: `prepare` creates screenshots and the analysis packet; `finalize` accepts structured analysis JSON and creates the scored report and next prompt. This keeps the reusable loop independent of any one AI provider while allowing the current Codex session to complete the first audit unattended.

**Tech Stack:** Node.js, TypeScript via `tsx`, Playwright, Vitest, JSON, Markdown.

---

## File structure

| File | Responsibility |
|---|---|
| `tools/product-audit/config.ts` | Page catalog, state definitions, rubric, weights, score anchors, versioning |
| `tools/product-audit/types.ts` | Shared manifest, score, issue, report, and run types |
| `tools/product-audit/capture.ts` | Safe Playwright capture and capture validation |
| `tools/product-audit/prompt.ts` | Analysis packet and provider-neutral vision prompt |
| `tools/product-audit/score.ts` | JSON validation, weighted page scores, app totals, previous-run deltas |
| `tools/product-audit/report.ts` | Markdown report and bounded next-implementation prompt |
| `tools/product-audit/cli.ts` | `prepare`, `finalize`, and `all` command orchestration |
| `tools/product-audit/reference-principles.md` | Distilled inspiration from the supplied Mobbin and UX Peak notes, with cautions |
| `tools/product-audit/product-context.md` | Babyora product direction and page-role context |
| `tools/product-audit/*.test.ts` | Unit tests for configuration, validation, scoring, prompt and report output |
| `tools/product-audit/runs/<timestamp>/` | Generated manifest, screenshots, prompts, JSON, and reports |
| `package.json` | Adds read-only audit scripts |

No file under `src`, `public`, `api`, `apps`, `ios`, or `android` is modified.

### Task 1: Define stable audit types, rubric, and page weights

**Files:**
- Create: `tools/product-audit/types.ts`
- Create: `tools/product-audit/config.ts`
- Test: `tools/product-audit/config.test.ts`

- [ ] **Step 1: Write failing configuration tests**

```ts
import { describe, expect, it } from 'vitest';
import { PAGE_CATALOG, RUBRIC, RUBRIC_VERSION } from './config';

describe('product audit configuration', () => {
  it('keeps rubric dimensions at 100 percent', () => {
    expect(RUBRIC.reduce((sum, item) => sum + item.weight, 0)).toBe(100);
  });

  it('keeps app page weights at 100 percent', () => {
    expect(PAGE_CATALOG.reduce((sum, page) => sum + page.appWeight, 0)).toBe(100);
  });

  it('contains every approved page family', () => {
    expect(PAGE_CATALOG.map((page) => page.id)).toEqual([
      'onboarding', 'home', 'outfit', 'plan', 'guide', 'find-outfit',
      'clothing-library', 'wardrobe', 'tog', 'warm-cold', 'first-winter',
      'settings', 'paywall',
    ]);
  });

  it('versions the rubric', () => {
    expect(RUBRIC_VERSION).toMatch(/^1\./);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails because the modules do not exist**

Run: `npx vitest run tools/product-audit/config.test.ts`  
Expected: FAIL with module resolution errors for `./config`.

- [ ] **Step 3: Implement shared types and immutable configuration**

Define `PageId`, `AuditDimensionId`, `PageDefinition`, `CaptureState`, `CaptureManifest`, `PageAnalysis`, `AuditAnalysis`, `ScoredAudit`, `AuditIssue`, and `AuditRun`. Add the seven approved rubric dimensions and page weights from the design specification. Each page definition includes its role in the free/Plus story and required capture states.

- [ ] **Step 4: Run the configuration test**

Run: `npx vitest run tools/product-audit/config.test.ts`  
Expected: 4 tests pass.

### Task 2: Encode Babyora context and source-inspired review principles

**Files:**
- Create: `tools/product-audit/product-context.md`
- Create: `tools/product-audit/reference-principles.md`
- Test: `tools/product-audit/prompt.test.ts`

- [ ] **Step 1: Write failing prompt-context tests**

```ts
import { describe, expect, it } from 'vitest';
import { buildAnalysisPrompt } from './prompt';

describe('analysis prompt', () => {
  it('states the product principle and evidence boundary', () => {
    const prompt = buildAnalysisPrompt({ manifest: { captures: [] } as never });
    expect(prompt).toContain('Gratis = i dag hjemme');
    expect(prompt).toContain('inspirasjon, ikke fasit');
    expect(prompt).toContain('ekspertinferens');
  });

  it('forbids generic and manipulative advice', () => {
    const prompt = buildAnalysisPrompt({ manifest: { captures: [] } as never });
    expect(prompt).toContain('fake urgency');
    expect(prompt).toContain('generiske');
  });
});
```

- [ ] **Step 2: Run the test and verify the prompt builder is missing**

Run: `npx vitest run tools/product-audit/prompt.test.ts`  
Expected: FAIL resolving `./prompt`.

- [ ] **Step 3: Write product context**

Document the target parent, morning/low-light context, core clothing decision, the “plagg” vocabulary decision, temperature-reactive background, trust/safety expectations, and the free/Plus product principle. Include repository-confirmed risks separately from hypotheses.

- [ ] **Step 4: Distill the two supplied learning documents**

Capture only relevant principles:

- value before signup or paywall;
- paywall as a journey, not a single screen;
- outcomes before features;
- trial clarity and risk reduction;
- smart defaults and reduced decision cost;
- thumb-zone and navigation clarity;
- dashboard/home should recommend the next action;
- polish supports trust but never replaces product truth.

Label empirical percentages and causal claims as unverified inspiration. Explicitly reject manipulative loss framing, fake scarcity, forced streaks, and copying reference aesthetics.

- [ ] **Step 5: Implement the first prompt builder and run tests**

The builder loads the two context documents, rubric, page definitions, and manifest; it outputs Norwegian instructions with strict JSON shape.  
Run: `npx vitest run tools/product-audit/prompt.test.ts`  
Expected: 2 tests pass.

### Task 3: Build safe page capture and manifest generation

**Files:**
- Create: `tools/product-audit/capture.ts`
- Test: `tools/product-audit/capture.test.ts`

- [ ] **Step 1: Write failing tests for capture planning and safety**

```ts
import { describe, expect, it } from 'vitest';
import { buildCapturePlan, assertReadOnlyAction } from './capture';

describe('capture plan', () => {
  it('covers all page families', () => {
    expect(new Set(buildCapturePlan().map((item) => item.pageId)).size).toBe(13);
  });

  it('blocks dangerous actions', () => {
    expect(() => assertReadOnlyAction('confirm-purchase')).toThrow(/read-only/i);
    expect(() => assertReadOnlyAction('delete-child')).toThrow(/read-only/i);
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npx vitest run tools/product-audit/capture.test.ts`  
Expected: FAIL resolving `./capture`.

- [ ] **Step 3: Implement deterministic capture planning**

Use a 390×844 viewport, Norwegian locale, reduced motion, dark theme, and local fixture state. Reuse existing navigation knowledge but do not import or alter product code. Page actions use visible roles/text with explicit fallbacks and record capture failures instead of hiding them.

- [ ] **Step 4: Implement screenshot validation**

Reject zero-byte images, screenshots below a minimum byte threshold, pages still showing obvious loading text, and routes that fail to expose a page-specific heading or landmark. Write `manifest.json` with route, state, file, status, error, and timestamp.

- [ ] **Step 5: Run capture unit tests**

Run: `npx vitest run tools/product-audit/capture.test.ts`  
Expected: all tests pass without starting the app.

### Task 4: Complete the provider-neutral analysis packet

**Files:**
- Modify: `tools/product-audit/prompt.ts`
- Modify: `tools/product-audit/prompt.test.ts`

- [ ] **Step 1: Add failing tests for page completeness and JSON contract**

```ts
it('lists every captured page and requires strict JSON', () => {
  const prompt = buildAnalysisPrompt({ manifest: completeManifest });
  expect(prompt).toContain('OUTPUT_JSON_ONLY');
  for (const capture of completeManifest.captures) {
    expect(prompt).toContain(capture.file);
  }
  expect(prompt).toContain('confidence');
  expect(prompt).toContain('evidenceType');
});
```

- [ ] **Step 2: Run the test and verify it fails on the incomplete prompt**

Run: `npx vitest run tools/product-audit/prompt.test.ts`  
Expected: FAIL on missing JSON and evidence fields.

- [ ] **Step 3: Implement complete analysis instructions**

The prompt must require scores for all seven dimensions, strengths, issues, severity, commercial impact, confidence, and evidence type. It must distinguish rendered fact, repository fact, inference, and uncertainty. It must explicitly assess onboarding, Home, Plan, and Paywall against the supplied inspiration without treating it as truth.

- [ ] **Step 4: Run prompt tests**

Run: `npx vitest run tools/product-audit/prompt.test.ts`  
Expected: all prompt tests pass.

### Task 5: Validate and calculate page and app scores

**Files:**
- Create: `tools/product-audit/score.ts`
- Test: `tools/product-audit/score.test.ts`

- [ ] **Step 1: Write failing score tests**

```ts
import { describe, expect, it } from 'vitest';
import { scoreAudit } from './score';

describe('audit scoring', () => {
  it('calculates a weighted page score', () => {
    const result = scoreAudit(validAnalysisFixture);
    expect(result.pages[0].score).toBe(80);
  });

  it('withholds a complete total when a weighted page is missing', () => {
    const result = scoreAudit(missingPageFixture);
    expect(result.complete).toBe(false);
    expect(result.totalScore).toBeNull();
    expect(result.provisionalScore).not.toBeNull();
  });

  it('rejects unsupported scores and malformed issues', () => {
    expect(() => scoreAudit(invalidFixture)).toThrow(/validation/i);
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npx vitest run tools/product-audit/score.test.ts`  
Expected: FAIL resolving `./score`.

- [ ] **Step 3: Implement strict validation and calculations**

Validate page IDs, unique pages, 1–100 integer dimensions, issue severity, evidence, impact, confidence, and page coverage. Calculate weighted page scores, weighted app total, unweighted mean, high/low page, issue counts, provisional incomplete score, and deltas only when rubric versions match.

- [ ] **Step 4: Run score tests**

Run: `npx vitest run tools/product-audit/score.test.ts`  
Expected: all score tests pass.

### Task 6: Generate the report and bounded next prompt

**Files:**
- Create: `tools/product-audit/report.ts`
- Test: `tools/product-audit/report.test.ts`

- [ ] **Step 1: Write failing output tests**

```ts
import { describe, expect, it } from 'vitest';
import { renderReport, renderNextPrompt } from './report';

describe('audit output', () => {
  it('renders totals and every page', () => {
    const report = renderReport(scoredFixture);
    expect(report).toContain('Vektet totalscore');
    expect(report.match(/^## /gm)).toHaveLength(14);
  });

  it('limits the next prompt to five initiatives', () => {
    const prompt = renderNextPrompt(scoredFixture);
    expect((prompt.match(/^### Tiltak /gm) ?? []).length).toBeLessThanOrEqual(5);
    expect(prompt).toContain('Dette skal bevares');
    expect(prompt).toContain('Ikke gjør');
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npx vitest run tools/product-audit/report.test.ts`  
Expected: FAIL resolving `./report`.

- [ ] **Step 3: Implement report rendering**

Lead with outcome, score table, strongest/weakest page, main purchase blocker, page details, cross-screen findings, and evidence confidence. Keep generated prompts concrete and bounded to five initiatives selected by severity, app weight, and commercial impact.

- [ ] **Step 4: Run report tests**

Run: `npx vitest run tools/product-audit/report.test.ts`  
Expected: all report tests pass.

### Task 7: Add CLI orchestration and package scripts

**Files:**
- Create: `tools/product-audit/cli.ts`
- Create: `tools/product-audit/README.md`
- Modify: `package.json`
- Test: `tools/product-audit/cli.test.ts`

- [ ] **Step 1: Write failing argument tests**

```ts
import { describe, expect, it } from 'vitest';
import { parseArgs } from './cli';

describe('audit CLI', () => {
  it('supports prepare and finalize without mutation flags', () => {
    expect(parseArgs(['prepare']).command).toBe('prepare');
    expect(parseArgs(['finalize', '--run', 'abc']).run).toBe('abc');
    expect(() => parseArgs(['apply'])).toThrow(/prepare|finalize/i);
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npx vitest run tools/product-audit/cli.test.ts`  
Expected: FAIL resolving `./cli`.

- [ ] **Step 3: Implement CLI commands**

`prepare` connects to the supplied local URL, creates a timestamped run, captures pages, writes manifest and analysis prompt, then stops. `finalize --run <path>` reads `analysis.json`, validates it, writes `scored-analysis.json`, `report.md`, and `next-improvement-prompt.md`. There is no `apply` command.

- [ ] **Step 4: Add package scripts**

```json
{
  "audit:prepare": "tsx tools/product-audit/cli.ts prepare",
  "audit:finalize": "tsx tools/product-audit/cli.ts finalize",
  "audit:test": "vitest run tools/product-audit"
}
```

- [ ] **Step 5: Document exact usage and safety boundary**

The README explains local server setup, run folder structure, analyzer handoff, finalization, optional Mobbin references, common failures, and the guarantee that audit runs never edit product files.

- [ ] **Step 6: Run CLI and full tool tests**

Run: `npm run audit:test`  
Expected: all product-audit tests pass.

### Task 8: Run the first complete Babyora audit

**Files:**
- Generate: `tools/product-audit/runs/<timestamp>/manifest.json`
- Generate: `tools/product-audit/runs/<timestamp>/screenshots/*.png`
- Generate: `tools/product-audit/runs/<timestamp>/analysis-prompt.md`
- Generate: `tools/product-audit/runs/<timestamp>/analysis.json`
- Generate: `tools/product-audit/runs/<timestamp>/scored-analysis.json`
- Generate: `tools/product-audit/runs/<timestamp>/report.md`
- Generate: `tools/product-audit/runs/<timestamp>/next-improvement-prompt.md`

- [ ] **Step 1: Start the local app without modifying source**

Run: `npm run dev -- --host 127.0.0.1`  
Expected: Vite reports a local URL and continues running.

- [ ] **Step 2: Prepare the audit**

Run: `npm run audit:prepare -- --base-url http://127.0.0.1:5173`  
Expected: a new run folder with validated screenshots, manifest, and analysis prompt.

- [ ] **Step 3: Inspect every screenshot and complete structured analysis**

Use the generated prompt and screenshots in the current Codex session. Where helpful, use Mobbin only for relevant onboarding/paywall/navigation patterns. Write valid `analysis.json` and label screenshot fact, repository fact, inference, and uncertainty distinctly.

- [ ] **Step 4: Finalize the report**

Run: `npm run audit:finalize -- --run tools/product-audit/runs/<timestamp>`  
Expected: complete scored JSON, report, and next prompt; no product source changes.

- [ ] **Step 5: Verify the full repository proportionately**

Run: `npm run audit:test`  
Expected: product-audit tests pass.  
Run: `npm test`  
Expected: existing product tests pass.  
Run: `npm run build`  
Expected: TypeScript and production builds pass.  
Run: `npm run lint`  
Expected: record existing and new lint findings separately; no new product-audit errors.

- [ ] **Step 6: Confirm mutation boundary**

List file modification timestamps or checksums for `src`, `public`, `api`, `apps`, `ios`, and `android` before and after the audit. Expected: no audit-caused product file changes.

## Execution note

The user requested an unattended, long-horizon session, so execution proceeds inline with `superpowers:executing-plans`. Subagents are not used. Git commit steps are omitted because this repository copy has no `.git` directory; the tool does not initialize a repository or make external changes.
