---
phase: 01-planlegg-dagslinjen
plan: "15"
subsystem: planning-ui
tags: [snart, react, session-state, fixed-home, privacy, accessibility, review-gate]

requires:
  - phase: 01-14
    provides: exact reviewed Snart historical model, climate pack, manifest and capability gate
provides:
  - exhaustive semantic renderer for the ready, empty and unavailable model states
  - access-first exact fixed-home projection with no automatic or effective-place fallback
  - memory-only already-have state reset across unmount, access, profile and target-window boundaries
  - hidden Uke integration seam with the live capability still false
  - two distinct final PASS receipts on one exact candidate tuple
affects: [01-16, 01-17, 01-18, snart, planning, premium]

tech-stack:
  added: []
  patterns:
    - React useSyncExternalStore over a framework-free session evaluator
    - exhaustive discriminated-union rendering without local model filtering
    - exact home-place-key@1 derivation bound to committed manifest support
    - rejected review attempts remain narrative and never become final receipts

key-files:
  created:
    - src/components/planning/SnartPlan.tsx
    - src/components/planning/SnartPlan.css
    - src/components/planning/__tests__/SnartPlan.test.tsx
    - src/lib/planning/snart-session.ts
    - src/lib/planning/__tests__/snart-session.test.ts
    - src/lib/planning/__tests__/snart-privacy-contract.test.ts
    - .planning/phases/01-planlegg-dagslinjen/evidence/01-15-candidate.json
    - .planning/phases/01-planlegg-dagslinjen/evidence/01-15-review-a.json
    - .planning/phases/01-planlegg-dagslinjen/evidence/01-15-review-b.json
  modified:
    - src/screens/UkeScreen.tsx

key-decisions:
  - "SnartPlan displays every item supplied by the model in fixed group order; it does not filter or synthesize model content."
  - "Denied, neutral or unavailable access clears the session and returns before fixed-home resolution, climate lookup or model construction."
  - "Only an exact committed fixed-home binding may select a climate profile; automatic and effective place cannot affect Snart."
  - "Already-have marks live only in the active evaluator and are cleared on every declared boundary."
  - "The final receipts are local consistency evidence with explicit false authenticated provenance."

requirements-completed: [GOV-01, GOV-04, GOV-05, GOV-06, ACCESS-01, UI-02, A11Y-01, EVID-01]
completed: 2026-07-24
status: complete
---

# Phase 1 Plan 15: Snart Session and Hidden UI Seam

**The reviewed Snart model now has an exhaustive, accessible renderer and an access-first, fixed-home, session-only Uke integration, while the live capability remains disabled.**

## Outcome

- Final implementation candidate: `cd95820d4edcaf9357058f01b17cd37c9f8209a0`.
- Final candidate tree: `a04e21046c794d74f5b6fa579e42df82621ee000`.
- Review-gate attempt: `2`.
- Final independent review: Lane A `PASS`, Lane B `PASS`, both clean before and after, with `findings: []`.
- Focused verification: **6 files passed, 45 tests passed**.
- Full suite: **926 passed, 1 todo**.
- TypeScript, ESLint and production build: `PASS`.
- Runtime publication remains disabled: `soon_preparation=false`.
- `family_sharing=false` and `personal_calibration=false`.
- No dependency, route, backend, storage, analytics, transport or media change.
- New cost: **NOK 0**.
- No push or deployment was performed.

## Closed Dependency and Candidate Tuple

Plan 01-15 starts from the completed Plan 01-14 record and retains its exact reviewed data identities:

| Identity | Exact value |
|---|---|
| Plan 01-14 completion commit | `e80aed5f860ede88a97f30b5610b1e7f8da6b972` |
| Plan 01-14 completion tree | `32c55bade846144768250c98e999f2d86ac9999c` |
| Plan 01-14 reviewed candidate | `1b8e1c9a7e32e90cca825d78ea3a3ea83a44dc31` |
| Plan 01-14 reviewed tree | `75b9251c5981d7fe894575ff9263441701afc693` |
| Contract SHA-256 | `f223636699eb0b654ad29ab08b407237db6e5ee224aeb8f0720e4c80a0f05033` |
| Pack SHA-256 | `e222950d15e49a98e5aeb65516219f6a4adda5a618e6ad1ae98ad6193136457b` |
| Plan 01-14 evidence SHA-256 | `9f8fa471a2c9fc3723155bd4a9b3a82eeab066ce838d2051fae85e6cee186c8a` |

The final Plan 01-15 candidate file was generated from a clean detached worktree:

| Identity | Exact value |
|---|---|
| Plan | `01-15` |
| Attempt | `2` |
| Candidate Git SHA | `cd95820d4edcaf9357058f01b17cd37c9f8209a0` |
| Candidate tree SHA | `a04e21046c794d74f5b6fa579e42df82621ee000` |
| Contract SHA-256 | `f223636699eb0b654ad29ab08b407237db6e5ee224aeb8f0720e4c80a0f05033` |
| Pack SHA-256 | `e222950d15e49a98e5aeb65516219f6a4adda5a618e6ad1ae98ad6193136457b` |
| Evidence SHA-256 | `43be1aadae4eec239cfb566b63bb0ad7c153c5adb9aa7fad57b2d6b4883cdcd7` |
| Candidate gate status before receipts | `PENDING_REVIEW` |
| Local receipts are cryptographic provenance | `false` |
| Authenticated provenance | `false` |

The candidate changes exactly these seven implementation and test paths:

1. `src/components/planning/SnartPlan.css`
2. `src/components/planning/SnartPlan.tsx`
3. `src/components/planning/__tests__/SnartPlan.test.tsx`
4. `src/lib/planning/__tests__/snart-privacy-contract.test.ts`
5. `src/lib/planning/__tests__/snart-session.test.ts`
6. `src/lib/planning/snart-session.ts`
7. `src/screens/UkeScreen.tsx`

The completion-record commit follows the immutable implementation candidate and adds only the candidate record, two receipts and this summary.

## RED to GREEN and Review Repair

The first implementation sequence produced candidate `b211907dbaf72dba92b798026adfca3e98789dfe` without a preceding committed RED test. This is recorded as a process deviation rather than rewritten as test-first history.

| Stage | Commit / tuple | Result |
|---|---|---|
| Initial implementation | `fde4e1a` through `b211907` | Renderer, session evaluator and hidden Uke seam existed, but the final review found two P1 contract gaps |
| Rejected attempt 1 | candidate `b211907`, tree `221a7162c2135d3ff5007f9e428f7c2d11171024`, evidence `d3b7b9b4c5a935a9a0a3942f4daceffd60be58d83fa28c29ba83328a873ee977` | Lane A failed; Lane B passed, but its receipt was discarded with the failed attempt |
| Repair RED | `6a46f5496916bee536ddd106385ff44f001d9c14` — `test(01-15): enforce canonical Snart UI boundary` | Eight focused failures reproduced exhaustive-renderer, canonical-home, climate seam, cache and reset gaps |
| Repair GREEN | `cd95820d4edcaf9357058f01b17cd37c9f8209a0` — `fix(01-15): enforce canonical Snart session rendering` | All focused and repository gates pass |

The final GREEN commit is the direct child of the repair RED commit.

Attempt 1 Lane A findings were:

- `P1-LOCAL-RENDERER-FILTERING`: `SnartPlan` used local `.filter`, conflicting with the pure exhaustive renderer contract.
- `P1-NONCANONICAL-FIXED-HOME-PROJECTION`: the Uke seam used a trim/lowercase/rounding projection without complete NFC, Unicode whitespace, exact E4 and committed-manifest validation.

The repair removes local item filtering and adds an exact, fail-closed `home-place-key@1` resolver bound to supported committed manifest rows.

## Renderer State Matrix

| Model state | Rendered surface | Prohibited surface |
|---|---|---|
| `ready` | Model title, subtitle, every supplied item in fixed `check_first`, `available_if_needed`, `not_highlighted` order, note and source | No locally invented item, copy, classification or filtering |
| `empty` | Model title, exact empty copy and source | No item, action or advice row |
| `unavailable` | Exact unavailable copy in a polite live region | No item, group, source-derived detail or advice |

`SnartPlan` buckets every supplied item in one exhaustive pass. It does not call `.filter`. A `Har allerede` button exists only when the model row has `canMarkAlreadyHave=true`; non-actionable `not_highlighted` rows remain visible without a button.

The semantic surface uses headings, sections and lists. Controls preserve a 44px minimum target, visible focus, forced-colors support and narrow-layout reflow.

## Access-First Fixed-Home Boundary

`projectSnartSession` requires all three access facts before doing any paid work:

- `state === 'allowed'`
- `allowed === true`
- `implementationAvailable === true`

Denied, neutral, loading-equivalent or implementation-unavailable inputs return `null` before `resolveExactHome`, `lookupClimateProfile` or `buildModel` can run. The evaluator clears any prior paid payload on that path.

The fixed-home resolver:

- normalizes the city to NFC;
- trims and collapses Unicode whitespace;
- accepts only finite in-range coordinates exactly representable at E4 within the locked tolerance;
- derives the exact `home-place-key@1` key;
- requires an exact supported manifest binding, coordinate/name match and canonical profile ID;
- has no nearest, fuzzy, automatic-place or effective-place fallback.

Only scalar, immutable values cross the model boundary: local date, literal `Europe/Oslo`, exact home key, exact climate profile ID and a precomputed whole-window age boolean. Child ID, name, birth date, coordinates, action time and place-mode state do not enter `buildSnartPlan`.

Static and executable tests demonstrate that changes to automatic/effective place cannot change the Snart request; only the validated fixed home can.

## Session-Only Already-Have State

The evaluator key contains the opaque access generation, exact home key, climate profile ID, profile version and target window. A change to any key component clears marks and cached model output.

The evaluator:

- retains marks only in a private in-memory `Set`;
- returns defensive copies of the mark set;
- memoizes the current model only inside the active session;
- rebuilds after an actionable mark;
- clears on denied/non-ready access, boundary-key change and teardown/unmount;
- exposes a subscription/current-value seam consumed through `useSyncExternalStore`;
- performs no URL, browser storage, IndexedDB, cache, network, backend, log or analytics write.

Uke hides the Snart segment while the capability presentation is hidden. If activated in a later plan, the Snart view suppresses the ordinary weather advice, status and forecast surfaces rather than mixing forecast guidance into the historical-normal presentation.

## Privacy and Capability Proof

The static privacy contract rejects Snart use of identity, birth date, coordinates beyond fixed-home resolution, action timestamps, automatic/effective place, history, persistent storage, transport, telemetry and runtime script imports.

Capability values at the reviewed candidate:

| Capability | Value |
|---|---|
| `soon_preparation` | `false` |
| `family_sharing` | `false` |
| `personal_calibration` | `false` |

No capability byte was flipped. The live app therefore exposes no Snart control or surface from this plan.

## Independent Review Gate

Two new, distinct reviewer tasks inspected the exact attempt-2 tuple. Neither reviewer was the executor or reused from attempt 1.

| Lane | Canonical task / agent ID | Review capability | Fresh attempt-2 task | Verdict | Findings | Clean before/after |
|---|---|---|---|---|---|---|
| A | `/root/phase1_01_15_execute_fast/review_01_15_lane_a_attempt2` | code/contract review (`gsd-code-reviewer`) | `true` | `PASS` | `[]` | `true` / `true` |
| B | `/root/phase1_01_15_execute_fast/review_01_15_lane_b_attempt2` | security/privacy audit (`gsd-security-auditor`) | `true` | `PASS` | `[]` | `true` / `true` |

The receipt schema is exactly `babyora-independent-review-receipt@2`. It has no session or freshness fields, so no unsupported keys were added. The canonical task name and agent ID are the complete reviewer identity fields exposed to the receipt. Freshness and reviewer capability are recorded here as orchestration evidence, not as cryptographic proof.

The executor canonical task was `/root/phase1_01_15_execute_fast`. Execution continued in a new task turn after an orchestration boundary; no same-turn or authenticated-provenance claim is made.

The checked-in validator returned:

```json
{"attempt":2,"gateStatus":"PASS","localReceiptsAreNotCryptographicProvenance":true,"planId":"01-15","provenanceAuthenticated":false,"reviewerAgentIds":["/root/phase1_01_15_execute_fast/review_01_15_lane_a_attempt2","/root/phase1_01_15_execute_fast/review_01_15_lane_b_attempt2"],"reviewerCanonicalTaskNames":["/root/phase1_01_15_execute_fast/review_01_15_lane_a_attempt2","/root/phase1_01_15_execute_fast/review_01_15_lane_b_attempt2"],"valid":true}
```

Validation command:

```text
npx tsx scripts/snart/review-gate.ts validate --plan 01-15 --implementer-agent-id "/root/phase1_01_15_execute_fast" --evidence-dir .planning/phases/01-planlegg-dagslinjen/evidence
```

Both raw reviewer responses were stored unchanged through the review-gate receipt command. The final receipts repeat the same five-hash tuple and contain zero unresolved findings.

## Verification Results

| Gate | Final result |
|---|---|
| Candidate generation | PASS; clean detached worktree, attempt 2, exact seven-path scope |
| Focused Snart/UI/access suites | PASS; 6 files, 45 tests |
| TypeScript project build | PASS |
| Full test suite | PASS; 926 passed, 1 todo |
| ESLint | PASS |
| Vite production build | PASS; non-blocking chunk-size warning only |
| Diff whitespace check | PASS |
| Exhaustive renderer/static privacy checks | PASS |
| Access-first zero-call and session reset matrix | PASS |
| Exact fixed-home and automatic-place invariance | PASS |
| Two-lane local review gate | PASS; distinct identities, same tuple, clean before/after, zero findings |
| Capability gate | PASS; all three future capabilities remain false |

## Process Deviations and Workspace Hygiene

- The initial implementation did not start with a committed RED test. The rejected attempt is recorded truthfully; the final repair has a direct committed RED-to-GREEN chain.
- The two attempt-2 reviewers ran sequentially because the global four-task concurrency limit was occupied. They were still separately spawned, fresh, distinct and read-only.
- The primary Windows checkout reported two unrelated snapshot paths as modified because of line-ending smudge behavior. Their working-tree blobs were verified byte-identical to `HEAD` with matching object hashes and a quiet diff. They were never edited, restored, staged or included.
- Clean detached worktrees with automatic line-ending conversion disabled were used for candidate generation, review and authoritative gate validation.
- No unrelated file was staged or committed.

## Cost, Publication and Rollback

- No paid API, credential, purchase, media generation or new dependency was used.
- New external cost is `NOK 0`.
- No branch was pushed and nothing was deployed.
- Rollback is to revert the scoped Plan 01-15 implementation commits while preserving the completed Plan 01-14 model and evidence.
