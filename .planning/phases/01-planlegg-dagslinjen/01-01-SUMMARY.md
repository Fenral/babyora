---
phase: 01-planlegg-dagslinjen
plan: "01"
subsystem: testing
tags: [vitest, playwright, deterministic-fixtures, no-media, wave-0]

requires:
  - phase: repository-baseline
    provides: Babyora app shell, Playwright/Vitest toolchain, and approved Planlegg contract
provides:
  - Frozen invented Planlegg clocks, forecast, child, location, recommendation, access, and Snart fixtures
  - Forty-five named pending Wave-0 contracts across six Vitest suites
  - Case-selectable text-only Playwright harness at 390x844 in Europe/Oslo
affects: [01-planlegg-dagslinjen, forecast-truth, exact-context, snart, browser-evidence]

tech-stack:
  added: []
  patterns: [explicit-clock fixtures, pending-contract-first tests, no-write browser evidence]

key-files:
  created:
    - src/lib/planning/__tests__/planlegg-fixtures.ts
    - src/lib/planning/__tests__/forecast-evidence.test.ts
    - src/lib/planning/__tests__/timezone.test.ts
    - src/lib/planning/__tests__/plan-view-model.test.ts
    - src/lib/planning/__tests__/planned-outfit-context.test.ts
    - src/lib/planning/__tests__/planning-interaction.test.ts
    - src/lib/planning/__tests__/snart.test.ts
    - e2e/fixtures/planlegg.ts
    - e2e/planlegg.ts
  modified: []

key-decisions:
  - "Wave 0 uses explicit ISO clocks and Europe/Oslo; no fixture or contract depends on Date.now()."
  - "The initial browser registry exposes only harness; later cases remain owned by their later plans."
  - "Executor checks are evidence of harness/test-infrastructure readiness, not an independent standard-risk PASS."

patterns-established:
  - "Pending contracts name later behavior without importing production modules that do not exist yet."
  - "Browser evidence selects a frozen case, checks DOM/runtime failures, and emits identifiers only."

requirements-completed: [GOV-01, GOV-02, EVID-01, GOV-03, GOV-04]

coverage:
  - id: D1
    description: "Frozen invented fixtures and 45 named Wave-0 pending contracts"
    requirement: GOV-03
    verification:
      - kind: unit
        ref: "npx vitest run src/lib/planning/__tests__/forecast-evidence.test.ts src/lib/planning/__tests__/timezone.test.ts src/lib/planning/__tests__/plan-view-model.test.ts src/lib/planning/__tests__/planned-outfit-context.test.ts src/lib/planning/__tests__/planning-interaction.test.ts src/lib/planning/__tests__/snart.test.ts"
        status: pass
    human_judgment: true
    rationale: "The command proves all 45 pending contracts are registered and parse, but TODOs intentionally do not prove later production behavior."
  - id: D2
    description: "Case-selectable no-media browser harness with real app-shell DOM assertions"
    requirement: EVID-01
    verification:
      - kind: e2e
        ref: "cmd.exe /d /s /c npm run build && npx tsx e2e/planlegg.ts --case harness"
        status: pass
      - kind: other
        ref: "rg static no-media/no-writer scan of e2e/planlegg.ts and e2e/fixtures/planlegg.ts"
        status: pass
      - kind: e2e
        ref: "two consecutive npx tsx e2e/planlegg.ts --case harness runs plus OS listener and connection-refusal checks on port 4191"
        status: pass
    human_judgment: false
  - id: D3
    description: "Immutable Wave-0 candidate remains separated from product waves and carries an exact-SHA independent review"
    requirement: GOV-04
    verification:
      - kind: other
        ref: "git diff --name-only 70ae7e6..9115aeb and git diff --check 70ae7e6..9115aeb"
        status: pass
    human_judgment: true
    rationale: "Fresh independent verification passed repaired candidate 9115aeb; the plan/UI checker found the plan package sound and requested only Wave-0 bookkeeping plus a clean exact-HEAD re-check."

duration: 27min
completed: 2026-07-22
status: complete
---

# Phase 1 Plan 01: Freeze Planlegg Delivery Contracts Summary

**Deterministic invented Planlegg fixtures, 45 explicitly pending contracts, and a repeat-safe no-write Playwright harness bound to repaired candidate `9115aeb`.**

## Performance

- **Duration:** 27 min
- **Started:** 2026-07-22T21:20:00+02:00
- **Completed:** 2026-07-22T21:47:00+02:00
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Frozen normal-day, DST-boundary, TTL, forecast-validity, child, location, finalized-recommendation, Free/Plus/loading, and Snart gate fixtures using invented data only.
- Registered 45 named `it.todo` contracts across forecast, timezone, view-model, exact-context, interaction, and future approved-rule Snart ownership without treating a TODO as PASS evidence.
- Added `PLANLEGG_E2E_FIXTURES` and a strict `--case harness` runner that boots the demo seed at 390x844 in `Europe/Oslo`, collects runtime/network failures, asserts one app-owned `main`, verifies Hjem/Planlegg/Guide/Familie, and synchronously releases its preview process and port.

## Task Commits

1. **Task 1: Freeze deterministic fixtures and pending contracts** — `093d13d` (`test`)
2. **Task 1 cleanup: normalize contract file endings** — `b82214d` (`style`)
3. **Task 2: Add the case-selectable no-media browser harness** — `d45cde0` (`test`)
4. **Verifier repair: terminate the actual preview process and await port release** — `130733f` (`fix`)
5. **Failure-path hardening: guarantee preview cleanup if browser cleanup throws** — `9115aeb` (`fix`)

**Plan metadata:** recorded by the final GSD documentation commit.

## Files Created/Modified

- `src/lib/planning/__tests__/planlegg-fixtures.ts` — Frozen invented Wave-0 truth/context/access/Snart fixtures.
- `src/lib/planning/__tests__/forecast-evidence.test.ts` — Pending provenance/currentness and atomic-resolution contracts.
- `src/lib/planning/__tests__/timezone.test.ts` — Pending normal-day and Oslo DST contracts.
- `src/lib/planning/__tests__/plan-view-model.test.ts` — Pending loading/error/offline/coverage/cardinality contracts.
- `src/lib/planning/__tests__/planned-outfit-context.test.ts` — Pending immutable exact-context and fail-closed transport contracts.
- `src/lib/planning/__tests__/planning-interaction.test.ts` — Pending selection, cue, repair, and focus contracts.
- `src/lib/planning/__tests__/snart.test.ts` — Pending future approved-rule gate and exact `ready | empty | unavailable` contracts.
- `e2e/fixtures/planlegg.ts` — Frozen `harness` case registry.
- `e2e/planlegg.ts` — Executable local-preview DOM/runtime harness with no persistence writer.

## Deterministic Evidence

Current immutable candidate independently reviewed: `9115aeb`.

| Identity | Lane | Candidate | Verdict/evidence |
|---|---|---|---|
| Independent fresh verifier | Standard independent review | `d45cde0` | **BLOCK** — Windows `shell: true` killed only the shell-facing process and leaked the actual Vite preview child/port |
| Codex GSD executor, repair session | Standard test infrastructure | `9115aeb` | `READY_FOR_REVIEW`; exact command, repeat-run, port-release, static, and scope checks green; executor does not issue independent PASS |
| Codex independent verifier, fresh context | Standard independent review | `9115aeb` | **PASS** — exact build/harness, two consecutive repeat runs, success/failure cleanup, port/process release, static scans, scope and diff checks passed on the detached SHA |
| Fresh plan/UI checker | Standard contract review | `c6691c5` working lineage | **Plan package PASS; operational re-check pending** — requested Wave-0 bookkeeping correction and a clean exact-HEAD re-check before 01-02 |

- Focused Vitest command: PASS as infrastructure — 6 suites skipped by design, 45 TODOs registered, 0 TODOs counted as passed behavior.
- Exact build/harness command: PASS — main and bare builds green; `PLANLEGG HARNESS PASS: case=harness fixture=planlegg-harness-v1`.
- Repeat-run/port-release check: PASS — the exact build/harness run plus two consecutive direct harness runs report `PLANLEGG PREVIEW STOPPED: port=4191`; port 4191 and the candidate Vite process are absent after every run.
- Failure-path cleanup check: PASS — forcing Playwright browser launch to fail still reports `PLANLEGG PREVIEW STOPPED: port=4191`, exits nonzero, and leaves no listener or candidate Vite process.
- Unknown case check: PASS — exit 1 and reports `Støttede case: harness`.
- Static capture scan: PASS — no matches for the prohibited capture/audit API tokens.
- Static writer/environment/payload/shell scan: PASS — no filesystem writer, environment access/dump, payload serialization or shell interpolation; the fixed Vite CLI arguments use `process.execPath` with `shell: false`.
- Scope check: PASS — `70ae7e6..9115aeb` contains exactly the nine Plan 01-01 target files plus the already-required Summary/State/Roadmap bookkeeping.
- `git diff --check 70ae7e6..9115aeb`: PASS.
- Approved source baseline `e669aff` to execution start `70ae7e6` changed planning/governance documents only; no production app file changed between those SHAs.

## Decisions Made

- Used explicit ISO instants for the normal clock, both Oslo DST boundaries, TTL, and TTL+1; later contracts cannot silently depend on wall-clock time.
- Kept Snart rule IDs empty and the approval gate `pending_approval`; Wave 0 does not invent garment rules or pre-approve Plan 01-13 evidence.
- Limited the first browser registry to `harness`; access, location, exact-context, Snart, route, and native-polish cases remain owned by their named later plans.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed trailing blank lines caught by the staged whitespace check**
- **Found during:** Task 1 commit verification.
- **Issue:** PowerShell continued to the commit after `git diff --cached --check` reported one trailing blank line in each new Task 1 file.
- **Fix:** Removed only those seven blank lines and recorded a narrow follow-up commit instead of rewriting history.
- **Files modified:** The seven Task 1 files.
- **Verification:** Focused Vitest command and committed-range `git diff --check` pass.
- **Committed in:** `b82214d`.

**2. [Rule 1 - Bug] Restored the proven Windows preview spawn pattern**
- **Found during:** Task 2 exact build/harness verification.
- **Issue:** A warning-avoidance attempt using `npx.cmd` with `shell: false` failed with `spawn EINVAL` on Windows after the build completed.
- **Fix:** Initially restored the repository's fixed-argument `spawn('npx', ..., shell: process.platform === 'win32')` pattern.
- **Files modified:** `e2e/planlegg.ts`.
- **Verification:** The exact Task 2 command passed locally, but independent review later proved that the shell intermediary left the actual Vite child alive; candidate `d45cde0` was correctly BLOCKED.
- **Committed in:** `d45cde0`.

**3. [Rule 1 - Bug] Eliminated the leaked Windows preview child found by independent review**
- **Found during:** Fresh independent verification of candidate `d45cde0`.
- **Issue:** `server.kill()` targeted the `shell: true` process rather than the actual Vite preview child and did not await tree/port shutdown.
- **Fix:** Resolve the repository-local Vite CLI, spawn it directly with `process.execPath` and `shell: false`, terminate and await the real child in a nested `finally` even if browser cleanup throws, escalate on timeout, then await connection refusal on port 4191 before reporting PASS.
- **Files modified:** `e2e/planlegg.ts`.
- **Verification:** Exact build/harness PASS; two consecutive harness invocations PASS; final port listener count zero; connection refused; no user-controlled shell interpolation.
- **Committed in:** `130733f`, hardened in `9115aeb`.

**Total deviations:** 3 auto-fixed Rule 1 bugs.
**Impact on plan:** No scope expansion, dependency, production behavior, media, or persisted artifact was added.

## Known Stubs

- All 45 `it.todo` entries are intentional Wave-0 contracts. Their production implementations and PASS evidence belong to Plans 01-02 through 01-18; they are not counted as completed behavior here.
- `planningSnartFixture.approvedRuleIds` and all three Snart fixture groups are intentionally empty while `approvedRulesGate` is `pending_approval`. Plan 01-13 owns the blocking human approvals and climate artifacts.

These intentional stubs do not block Plan 01-01's goal, which is to freeze pending contracts before production work.

## Issues Encountered

- Independent review correctly blocked `d45cde0` for a Windows process-lifecycle leak that a single local run did not reveal. Candidate `9115aeb` removes the shell intermediary, guarantees nested cleanup, and adds deterministic repeat/port-release evidence.

## User Setup Required

None — no external service, credential, package, or environment change is required.

## Remaining Gates

- Fresh exact-HEAD plan/UI re-check after the Wave-0 bookkeeping correction.
- All production Wave 0–6 contracts remain pending their owning plans.
- Six Snart approvals and independently supplied climate artifacts remain Pending and block Plan 01-13.
- VoiceOver, TalkBack, physical haptics, OS text scaling, one-handed reach, app media, media-based 90+, and owner release approval remain Pending.

## Next Phase Readiness

- The exact-SHA independent reviewer gate is closed with PASS on `9115aeb`; the plan package has passed checker review, with one clean exact-HEAD operational re-check remaining before Plan 01-02 proceeds.
- No product logic, package, dependency, API, schema, recommendation, pricing, RevenueCat, analytics, media, marketing, brand, store, or onboarding-verification artifact changed.

## Self-Check: PASSED

All nine target files, this summary, and commits `093d13d`, `b82214d`, `d45cde0`, `130733f`, and `9115aeb` exist.

---
*Phase: 01-planlegg-dagslinjen*
*Completed: 2026-07-22*
