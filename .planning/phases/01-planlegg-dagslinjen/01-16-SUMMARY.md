---
phase: 01-planlegg-dagslinjen
plan: "16"
subsystem: planning-activation
tags: [snart, premium, paywall, privacy, accessibility, fixed-home, review-gate]

requires:
  - phase: 01-15
    provides: reviewed Snart model, session-only UI seam and fixed-home privacy boundary
provides:
  - live Plus-gated Snart preparation view based on monthly 1991-2020 normals
  - truthful contextual paywall copy without forecast or health claims
  - dynamic browser proof for access, privacy, reset and automatic-place isolation
  - canonical LF candidate record and two distinct independent PASS receipts
affects: [01-17, 01-18, planlegg, premium, paywall, snart]

tech-stack:
  added: []
  patterns:
    - compile-time-only E2E fixture availability override
    - fail-closed canonical hash readiness before browser startup
    - pre-armed live-region assertions for transient purchase status
    - reversible capability activation after full false-state verification

key-files:
  created:
    - .planning/phases/01-planlegg-dagslinjen/evidence/01-16-candidate.json
    - .planning/phases/01-planlegg-dagslinjen/evidence/01-16-review-a.json
    - .planning/phases/01-planlegg-dagslinjen/evidence/01-16-review-b.json
  modified:
    - e2e/fixtures/planlegg.ts
    - e2e/planlegg.ts
    - src/components/PaywallDialog.tsx
    - src/lib/planning/__tests__/snart.test.ts
    - src/lib/planning/snart-session.ts
    - src/lib/planning/snart.ts
    - src/lib/premium/__tests__/paywall-copy.test.ts
    - src/lib/premium/__tests__/plus-features.test.ts
    - src/lib/premium/__tests__/products.test.ts
    - src/lib/premium/paywall-copy.ts
    - src/lib/premium/plus-features.ts
    - src/lib/premium/products.ts
    - src/screens/UkeScreen.tsx

key-decisions:
  - "Snart is a Plus preparation surface based on monthly 1991-2020 normals, never a forecast."
  - "Snart always resolves from the exact committed fixed home; automatic location cannot change its output."
  - "The production capability is activated only after false-state readiness and the full browser matrix pass."
  - "Family sharing and personal calibration remain unavailable and unclaimed."
  - "Review receipts are local consistency evidence, not cryptographic provenance."

requirements-completed: [GOV-01, GOV-04, GOV-05, GOV-06, ACCESS-01, COPY-01, COPY-02, A11Y-01, UI-02, EVID-01, EVID-02]
completed: 2026-07-24
status: complete
---

# Phase 1 Plan 16: Activate Reviewed Snart Preparation

**The reviewed Snart preparation surface is now live behind Babyora Plus with truthful historical-normal copy, exact fixed-home isolation, session-only interaction state and two independent PASS reviews on the exact activated source tree.**

## Outcome

- Activated implementation candidate: `719c418e7d74fb86ead620d346e91e4989c76519`.
- Activated candidate tree: `c9d843c466beacdb52125e950356ec216813374b`.
- Review-gate attempt: `2`.
- Lane A: `PASS`, `findings: []`, clean before and after.
- Lane B: `PASS`, `findings: []`, clean before and after.
- Full suite: **80 files passed; 929 tests passed; 1 todo**.
- TypeScript, ESLint and production builds: `PASS`.
- Browser gates: `access`, `snart`, `automatic-location`, `exact-context`, `semantic-rail` and `composition` all `PASS`.
- `soon_preparation=true`.
- `family_sharing=false`.
- `personal_calibration=false`.
- No new dependency, backend, schema, runtime climate API, analytics event or media.
- New external cost: **NOK 0**.
- No push, TestFlight upload or production deployment was performed.

## Closed Dependency and Canonical Candidate

Plan 01-16 starts from the completed 01-15 record:

| Identity | Exact value |
|---|---|
| Plan 01-15 completion commit | `c4a7a4104803621a3c2cfa3a4cb75d647e387291` |
| Plan 01-15 completion tree | `108e3ca8953f6754011a41c00706cb4a394f4d07` |
| Plan 01-15 reviewed candidate | `cd95820d4edcaf9357058f01b17cd37c9f8209a0` |

The final Plan 01-16 candidate was generated from a clean detached LF checkout so the candidate hashes match the canonical repository bytes:

| Identity | Exact value |
|---|---|
| Plan | `01-16` |
| Attempt | `2` |
| Candidate Git SHA | `719c418e7d74fb86ead620d346e91e4989c76519` |
| Candidate tree SHA | `c9d843c466beacdb52125e950356ec216813374b` |
| Contract SHA-256 | `f223636699eb0b654ad29ab08b407237db6e5ee224aeb8f0720e4c80a0f05033` |
| Pack SHA-256 | `e222950d15e49a98e5aeb65516219f6a4adda5a618e6ad1ae98ad6193136457b` |
| Evidence SHA-256 | `647caca8fbb81788fe4f5caefb97d00ab3aeefa609ba81919770b76844d57f0c` |
| Gate before receipts | `PENDING_REVIEW` |
| Local receipts are cryptographic provenance | `false` |
| Authenticated provenance | `false` |

An initial candidate-record draft was generated in the ordinary Windows checkout and therefore reflected CRLF working-tree bytes. It was stopped before review, replaced by the canonical LF record above, and never accepted as evidence.

## Truthful Access and Paywall Contract

The typed `snart` trigger leaves all product identifiers, prices, trial lengths and RevenueCat behavior unchanged.

The contextual paywall describes:

- preparation four to six weeks ahead;
- monthly historical normals for 1991-2020;
- a historical preparation aid, not a weather forecast.

Tests reject forecast, daily-observation, quantile, wet-day, health, approval, family-sharing and personal-calibration claims. The paywall only surfaces capabilities whose implementation flags are true.

The purchase and restore live status briefly became fully clipped when the extra Snart preview row made the scrollable paywall body denser. The final fix prevents the live status region from shrinking while preserving the existing delayed close and focus return. The browser test pre-arms the exact visible `role=status` assertion before purchase or restore, then verifies dialog close, Plus content and main focus.

## Activation Readiness and Fail-Closed Data

Before the production flag is read, the Snart browser preflight:

- reconstructs and validates the exact 01-13, 01-14 and 01-15 reviewed candidate tuples;
- checks both independent receipts for each prior slice;
- recomputes canonical contract, climate-pack, manifest, builder, model, UI/session and evidence hashes;
- materializes canonical Git-object bytes in a temporary directory;
- runs the committed climate-bundle validator;
- verifies that every prior candidate is an ancestor of the activated HEAD;
- rejects an invalid climate-profile hash before model materialization;
- confirms `family_sharing=false` and `personal_calibration=false`.

The readiness path is offline, deterministic and uses no runtime climate endpoint.

## Dynamic Access, Privacy and Reset Matrix

The final `--case snart` matrix verifies:

| Area | Verified behavior |
|---|---|
| Loading | No preparation advice or paid concept payload materializes |
| Free | Truthful historical teaser and contextual paywall only |
| Plus ready | Complete canonical model output, including `not_highlighted` rows |
| Plus empty | Exact empty state after all actionable rows are marked |
| Unavailable | Unsupported home, invalid profile/hash and age-ineligible window fail closed |
| Fixed home | Home A produces identical output while automatic place changes B1 to B2 |
| Reload | In-memory `Har allerede` marks reset |
| Real unmount | Hjem to Planlegg remount resets marks |
| Profile/window | Profile or target-window change resets marks |
| URL/history | Query, hash and history state remain byte-identical |
| Storage | localStorage, sessionStorage, IndexedDB and Cache API remain key/byte-identical |
| Transport | No Snart payload through fetch, XHR, beacon, backend or external media |
| Telemetry | No console, logger, analytics, PostHog or tracing payload |
| Identity | No child ID, raw birth date or action timestamp in DOM, requests or fixtures |
| Accessibility | Semantic radios, keyboard path, visible focus, 44px targets, forced colors and 200% zoom |

The ordinary `access`, `automatic-location`, `exact-context`, `semantic-rail` and `composition` browser cases remain green after activation.

## Activation and Rollback Proof

The capability was never left true after a failing gate:

1. An early activation was committed only to exercise the route and was immediately rolled back in `dba8267` after the candidate was rejected.
2. Later activation checks that found stale test assumptions or composition/access regressions restored `soon_preparation=false` before repair.
3. The paywall live-region clipping issue was repaired and verified while the production flag was false.
4. Only after all focused and full gates passed was the final activation committed as `719c418`.

The final activation commit changes only:

- `src/lib/premium/plus-features.ts`: `soon_preparation false -> true`;
- `src/lib/premium/__tests__/plus-features.test.ts`: the corresponding expected live value.

Rollback remains one reversible flag change to `false`; the reviewed data, model and session implementation require no migration or data recovery.

## Independent Review

Both reviewers inspected the full 13-file baseline-to-candidate diff, even though the candidate tool's contiguous-subject path list begins after one worker commit whose subject omitted `(01-16)`. The candidate Git/tree tuple still binds the complete source state, and the complete 13-file inventory is recorded above.

| Lane | Canonical task and agent ID | Focus | Verdict | Findings | Clean before/after |
|---|---|---|---|---|---|
| A | `/root/review_01_16_a2_lane_a` | Data, model, session, capability, fail-closed and readiness evidence | `PASS` | `[]` | `true` / `true` |
| B | `/root/review_01_16_a2_lane_b` | UI, Free/Plus, paywall, accessibility, privacy, transport and browser behavior | `PASS` | `[]` | `true` / `true` |

Lane A reviewed all 13 files, passed 83 focused tests across nine files, passed TypeScript and verified the canonical hashes.

Lane B reviewed all 13 files, passed the access case, passed the Snart case twice consecutively and passed 49 focused tests. Its first Snart invocation had a transient lazy-navigation timeout; two clean consecutive reruns passed on the unchanged tuple. The root-orchestrator's independent Snart run and all other browser gates were already green.

The checked-in validator returned:

```json
{"attempt":2,"gateStatus":"PASS","localReceiptsAreNotCryptographicProvenance":true,"planId":"01-16","provenanceAuthenticated":false,"reviewerAgentIds":["/root/review_01_16_a2_lane_a","/root/review_01_16_a2_lane_b"],"reviewerCanonicalTaskNames":["/root/review_01_16_a2_lane_a","/root/review_01_16_a2_lane_b"],"valid":true}
```

Both receipt files use schema `babyora-independent-review-receipt@2`, contain the same five-hash candidate tuple, use distinct reviewer identities, report clean before/after and contain zero unresolved findings.

## Verification Results

| Gate | Result |
|---|---|
| Candidate tuple and canonical LF hashes | PASS |
| Full Vitest suite | PASS: 929 passed, 1 todo |
| ESLint | PASS |
| TypeScript project build | PASS |
| Vite production and bare builds | PASS |
| `--case access` | PASS |
| `--case snart` | PASS |
| `--case automatic-location` | PASS |
| `--case exact-context` | PASS |
| `--case semantic-rail` | PASS |
| `--case composition` | PASS |
| Independent Lane A | PASS, zero findings |
| Independent Lane B | PASS, zero findings |
| Review-gate validation | PASS |

The production build retains the existing non-blocking large-chunk warning; Plan 01-16 does not add a dependency or enlarge the runtime contract.

## Publication, Cost and Source Freeze

- No source byte changed after both independent PASS verdicts.
- This completion record adds only planning evidence and documentation after the immutable source candidate.
- No paid service or API was used; external cost is NOK 0.
- No branch was pushed and no deployment or TestFlight publication was performed.
- The exact activated tree is the entry gate for Plan 01-17.
