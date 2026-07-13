# Babyora Independent Verification Protocol

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:verification-before-completion after every implementation task and superpowers:requesting-code-review before every package gate. This protocol is mandatory; an implementation session cannot waive it.

**Goal:** Prevent incomplete, visually inaccurate, unsafe, or untested work from being reported as finished.

**Architecture:** Every task uses evidence-based TDD followed by a fresh-context review. The implementer produces artifacts but cannot grant PASS; the verifier checks the original requirements, diff, tests, runtime states, and screenshots independently. High-risk work uses a two-key model rule.

**Tech Stack:** Git diff/status, Vitest, Playwright, product-audit tooling, Supabase local tests/advisors, native iOS/Android builds, structured Markdown evidence.

## Global Constraints

- “Looks correct”, “tests should pass”, and implementation summaries are not evidence.
- A PASS requires fresh command output captured after the final edit.
- The verifier receives the task/spec and repository state, not the implementer's reasoning or desired conclusion.
- The verifier reports first and does not edit code in the same pass.
- Any FAIL reopens the task; fixes require a new complete verification run.
- No critical/high finding may be accepted silently.

---

## 1. Required task lifecycle

### Phase A — Preflight

- [ ] Start from a clean git-backed working copy and record `git status --short`.
- [ ] Copy the exact task acceptance criteria into `docs/superpowers/evidence/tasks/<task-id>.md`.
- [ ] List the allowed create/modify/delete paths. Any unexpected file later fails scope review.
- [ ] Record focused tests expected to fail before implementation and global commands required at completion.

### Phase B — TDD implementation

- [ ] Add the smallest failing test for the next behavior.
- [ ] Run it and capture the expected failure reason.
- [ ] Implement only enough to pass.
- [ ] Run focused tests and capture PASS.
- [ ] Repeat per behavior; do not batch unverified behavior.

### Phase C — Implementer evidence

- [ ] Run fresh focused tests, `npm test`, `npm run build`, and lint delta after the final edit.
- [ ] Capture deterministic screenshots for every changed visual state.
- [ ] Record permission/offline/error/reduced-motion/large-text states required by the task.
- [ ] Record `git diff --stat`, `git diff --check`, and `git status --short`.
- [ ] Do not write “complete”; mark the evidence `READY_FOR_INDEPENDENT_REVIEW`.

### Phase D — Fresh-context verification

- [ ] Run `/clear` or open a new Claude Code session.
- [ ] Load only the original specification section, the exact task, this protocol, and the repository diff.
- [ ] Re-run commands instead of trusting copied output.
- [ ] Inspect changed code for scope, safety, data/privacy, accessibility, and consistency with existing patterns.
- [ ] Inspect screenshots at 390 × 844 and every task-specific state.
- [ ] Produce the structured verdict below without editing code.

### Phase E — Close or reopen

- [ ] PASS: attach verifier output, commit, and move to the next task.
- [ ] FAIL: record findings with file/line/evidence, return to implementation, and repeat Phases C–E in full.
- [ ] BLOCKED: state the external requirement or missing authority; never convert it into PASS.

## 2. Structured verifier verdict

Every review ends with exactly this structure:

```markdown
# Verification: <task-id>

Verdict: PASS | FAIL | BLOCKED
Reviewer model/session: <model> / fresh-context yes|no
Reviewed commit/diff: <sha or working-tree identifier>

## Acceptance criteria
- PASS|FAIL — <criterion> — <file/test/screenshot evidence>

## Commands rerun
- `<command>` — PASS|FAIL — <exact summary>

## Scope review
- Expected files: <list>
- Unexpected files: none | <list and reason>
- `git diff --check`: PASS|FAIL

## Runtime and visual states
- <state> — PASS|FAIL — <artifact>

## Security/privacy/accessibility
- <check> — PASS|FAIL — <evidence>

## Findings
- None | P0/P1/P2/P3: <file:line, impact, required correction>

## Final reason
<One paragraph explaining why the evidence supports the verdict.>
```

PASS is forbidden when any acceptance criterion or required command is missing, not run, or failed.

## 3. Model separation

| Work | Implementer | Independent verifier |
|---|---|---|
| UI and ordinary tests | Sonnet 5 High | New Sonnet 5 High session |
| Visual signature/90+ audit | Sonnet 5 High | Fable 5 High if paid credits approved; otherwise Opus 4.8 Extra or new Sonnet session plus human screenshot review |
| Supabase schema/RLS/invitations | Fable 5 Extra | Opus 4.8 Extra in a fresh session |
| RevenueCat entitlement | Fable 5 Extra | Opus 4.8 Extra in a fresh session |
| Calibration/safety engine | Fable 5 Extra | Opus 4.8 Extra plus full guardrail matrix |
| Notification scheduler/privacy | Fable 5 Extra | Opus 4.8 Extra plus payload inspection |
| Native widgets | Sonnet 5 High | Fresh Sonnet 5 High plus physical-device review |

If the preferred model is unavailable or paid credits are not approved, use a fresh Sonnet 5 High session and add explicit human review for security/visual conclusions. Never let the original implementation conversation act as the independent verifier.

## 4. Visual verification gate

For every changed screen/component:

- [ ] Capture fixed fixtures at 390 × 844: default, loading, error/offline, coldest, mild, warmest, largest supported text, reduced motion, keyboard focus.
- [ ] Compare against the visual-signature specification—not a generic “premium app” standard.
- [ ] Confirm one dominant physical metaphor per screen.
- [ ] Confirm no clipped text, overlap, bottom-nav collision, unreadable temperature background, false avatar garment, or sub-44-point target.
- [ ] Run the same 1–100 rubric and attach category scores plus concrete deductions.
- [ ] Require ≥90 overall and no critical/high issue before the surface passes.
- [ ] Require human review for generated assets, anatomy, garment identity, and subjective brand fit.

## 5. Security and data verification gate

For family/Supabase/billing/calibration/notifications:

- [ ] Run owner, guardian, caregiver, read-only, revoked, unauthenticated, and cross-household cases.
- [ ] Verify RLS with direct database/API attempts, not UI hiding.
- [ ] Verify invitation replay, expiry, recipient mismatch, and concurrent acceptance.
- [ ] Verify clients cannot grant role or entitlement by changing local/server-writable state.
- [ ] Verify migration idempotency, rollback, conflict, offline replay, and delete propagation.
- [ ] Search event, push, widget, and logs for name, DOB, coordinates, household/child identifiers, email, and feedback history.
- [ ] Run Supabase security/performance advisors and resolve every relevant warning.
- [ ] Require a human decision before production secrets, billing products, push credentials, or destructive migrations are activated.

## 6. Package verification gate

After all tasks in a package pass independently:

- [ ] Run the complete test/build/lint/audit suite from a clean checkout.
- [ ] Review the package's combined diff for interactions missed by task reviews.
- [ ] Run the package's end-to-end user journeys, including failure/recovery.
- [ ] Confirm documentation, analytics allowlist, privacy copy, feature flags, and paywall claims match runtime behavior.
- [ ] Produce `docs/superpowers/evidence/packages/<package-id>.md` with task verdict links.
- [ ] Tag the package `VERIFIED` only after the independent package review passes.

## 7. Stop conditions

Claude must stop and request direction when:

- the working copy is not git-backed or contains unexplained user changes;
- a migration may destroy or irreversibly transform production data;
- a secret, store credential, paid usage credit, or external production change is required;
- tests expose a safety-rule regression;
- an implemented capability cannot meet its advertised paywall claim;
- physical iOS/Android verification is required but unavailable;
- the verifier and implementer disagree after one documented repair cycle.
