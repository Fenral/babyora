---
phase: 01-planlegg-dagslinjen
plan: "18"
subsystem: native-shell-and-final-evidence
tags: [haptics, bottom-navigation, accessibility, deterministic-e2e, review-gate]
status: PASS

candidate_sha: 5cf7df85014fa51096b06a7e381926ebb4601798
candidate_tree_sha: 968a6d1db29138f0886d4a1d9c8091358bc45d61
contract_sha256: f223636699eb0b654ad29ab08b407237db6e5ee224aeb8f0720e4c80a0f05033
pack_sha256: e222950d15e49a98e5aeb65516219f6a4adda5a618e6ad1ae98ad6193136457b
evidence_sha256: 867576f203a30f563ac5409c35aa003bf89a1f40bf79ea03ef2fcd373736749a

review_a_agent_id: /root/review_01_18_a3_canonical_a
review_a_canonical_task_name: /root/review_01_18_a3_canonical_a
review_a_fresh_context: true
review_a_verdict: PASS
review_b_agent_id: /root/review_01_18_a3_canonical_b
review_b_canonical_task_name: /root/review_01_18_a3_canonical_b
review_b_fresh_context: true
review_b_verdict: PASS
review_receipts_bind_same_tuple: true
reviewer_contexts_distinct: true
review_attempts: 3
local_receipts_are_not_cryptographic_provenance: true

requires:
  - phase: 01-17
    provides: reviewed truthful routing into Planlegg and Snart
provides:
  - native-only and preference-aware haptic dispatch with browser no-op behavior
  - accessible four-root bottom navigation with semantic and visual redundancy
  - deterministic production-preview E2E harness for cold lazy-route verification
  - one immutable Phase 1 candidate accepted by two distinct fresh-context reviewers
affects: [02-05, phase-2, phase-3, phase-4]

tech-stack:
  added: []
  patterns:
    - native capability dispatch with injected test seams and fail-silent platform fallback
    - CSS-owned focus-visible and forced-colors behavior
    - temporary production-preview E2E with manifest and process-ownership proof
    - canonical-LF exact-lock independent review worktrees

key-files:
  created:
    - .planning/phases/01-planlegg-dagslinjen/evidence/01-18-candidate.json
    - .planning/phases/01-planlegg-dagslinjen/evidence/01-18-review-a.json
    - .planning/phases/01-planlegg-dagslinjen/evidence/01-18-review-b.json
  modified:
    - e2e/planlegg.ts
    - src/components/BottomTabBar.css
    - src/components/BottomTabBar.tsx
    - src/components/__tests__/BottomTabBar.test.tsx
    - src/lib/haptics/__tests__/system.test.ts
    - src/lib/haptics/system.ts

key-decisions:
  - "Haptics are native-only; web, SSR, unavailable plugin and adapter failures are quiet no-ops."
  - "Reduced motion controls animation only; the separate haptics preference controls tactile feedback."
  - "Bottom navigation focus is represented by scoped :focus-visible CSS rather than persistent React focus state."
  - "Cold lazy-route behavior is verified against an owned temporary production preview, not a dev server that may reload during dependency optimization."
  - "Review receipts prove local tuple consistency and reviewer separation, not cryptographic provenance."

requirements-completed: [GOV-01, GOV-04, GOV-05, GOV-06, UI-02, A11Y-01, EVID-01, EVID-02]

coverage:
  - id: HAPTICS-01
    description: "Native haptic tiers dispatch through the canonical adapter while web, disabled preference and adapter errors remain no-op."
    requirement: UI-02
    verification:
      - kind: unit
        ref: "src/lib/haptics/__tests__/system.test.ts"
        status: pass
    human_judgment: false
  - id: NAV-01
    description: "Exactly four root tabs expose one aria-current state, 44px targets, focus-visible, forced-colors and reduced-motion behavior."
    requirement: A11Y-01
    verification:
      - kind: unit
        ref: "src/components/__tests__/BottomTabBar.test.tsx"
        status: pass
      - kind: e2e
        ref: "npx tsx e2e/planlegg.ts --case native-polish"
        status: pass
    human_judgment: false
  - id: EVIDENCE-01
    description: "The final no-media Phase 1 candidate passed two distinct independent reviews on one exact tuple."
    requirement: EVID-02
    verification:
      - kind: other
        ref: "scripts/snart/review-gate.ts validate --plan 01-18"
        status: pass
    human_judgment: false

duration: 2h31m
completed: 2026-07-25
---

# Phase 1 Plan 18: Native shell and final Phase 1 evidence

**Babyora now has native-only haptics, an accessible four-root bottom navigation, and one deterministic Phase 1 candidate accepted by two independent reviewers on canonical source bytes.**

## Performance

- **Started:** 2026-07-24T22:49:00+02:00
- **Completed:** 2026-07-25T01:20:00+02:00
- **Duration:** 2 h 31 min
- **Source paths changed:** 6
- **New packages or services:** 0
- **External cost:** NOK 0

## Accomplishments

- Replaced browser vibration behavior with a native-only, injected haptic adapter that respects the tactile preference independently of reduced motion.
- Converted the bottom navigation to one typed four-root component with CSS-owned keyboard focus, safe-area handling, forced-colors support and non-color active-state redundancy.
- Added deterministic native-polish and complete Planlegg/Snart browser coverage without screenshot, video or trace evidence.
- Hardened cold-route verification around an owned temporary production build and preview with manifest, emitted-file, process, URL, HTTP, teardown and temporary-directory proof.
- Froze candidate `5cf7df85014fa51096b06a7e381926ebb4601798` and passed two distinct fresh-context reviews with zero findings.

## Task commits

1. **Specify and implement native-only haptics:** `3016b7c`, `041754b`
2. **Specify and implement accessible root navigation:** `929f5c2`, `3cb3ca5`
3. **Build the final browser matrix and harden cold-route evidence:** `c94d015`, `c2ddffa`, `689b2de`, `4e04c04`, `1a03256`, `650be26`
4. **Let reduced-motion reset navigation follow normal actionability:** `5cf7df8`

## Immutable candidate

- **Git SHA:** `5cf7df85014fa51096b06a7e381926ebb4601798`
- **Tree SHA:** `968a6d1db29138f0886d4a1d9c8091358bc45d61`
- **Contract SHA-256:** `f223636699eb0b654ad29ab08b407237db6e5ee224aeb8f0720e4c80a0f05033`
- **Climate pack SHA-256:** `e222950d15e49a98e5aeb65516219f6a4adda5a618e6ad1ae98ad6193136457b`
- **Evidence SHA-256:** `867576f203a30f563ac5409c35aa003bf89a1f40bf79ea03ef2fcd373736749a`
- **Review gate attempt:** `3`
- **Gate:** `PASS`

## Changed-path manifest

| Path | Result |
|---|---|
| `src/lib/haptics/system.ts` | Native-only haptic dispatcher with injected platform and adapter seams |
| `src/lib/haptics/__tests__/system.test.ts` | Native mapping, preference, reduced-motion independence, error and browser no-op coverage |
| `src/components/BottomTabBar.tsx` | Typed four-root navigation and pure change-dispatch behavior |
| `src/components/BottomTabBar.css` | Target size, safe area, focus-visible, forced-colors and reduced-motion styling |
| `src/components/__tests__/BottomTabBar.test.tsx` | Markup, cardinality, state, focus and CSS contract coverage |
| `e2e/planlegg.ts` | Native-polish, complete no-media matrix and owned production-preview cold-route harness |

No other candidate source path changed from the reviewed 01-17 completion.

## Verification matrix

### Implementer candidate

- Focused haptics/navigation tests: **26 passed**
- Climate contract and pack: **60/60 supported profiles, PASS**
- Full Vitest suite: **83 files, 945 passed, 1 existing todo**
- TypeScript project build: **PASS**
- ESLint: **PASS**
- Main production build: **PASS**
- Bare production build: **PASS**
- Harness self-tests: **PASS**
- `native-polish`: **PASS**
- One post-commit cold standalone `snart`: **PASS**
- One separate post-cold `all`: **PASS**
- Diff, changed-path scope, package, media and secret scans: **PASS**
- Preview shutdown, port release and temporary artifact removal: **PASS**

### Independent Lane A

- **Reviewer:** `/root/review_01_18_a3_canonical_a`
- Exact-lock versions: Playwright `1.60.0`, Vite `8.0.14`, tsx `4.22.4`
- Climate validator first: **PASS**
- Focused haptics/navigation: **26 passed**
- Full test suite: **945 passed, 1 todo**
- TypeScript, lint, main build, bare build and native-polish: **PASS**
- One cold standalone `snart`: **PASS**
- Critical file byte parity and clean before/after: **PASS**
- **Verdict:** `PASS`, findings `[]`

### Independent Lane B

- **Reviewer:** `/root/review_01_18_a3_canonical_b`
- Climate validator first: **PASS**
- Focused containment/data suite: **10 files, 65 tests**
- Full test suite: **945 passed, 1 todo**
- TypeScript, lint, main build and bare build: **PASS**
- First and only `all` run: **PASS**
- Package, media, secret, privacy, capability and changed-path containment: **PASS**
- Critical file byte parity and clean before/after: **PASS**
- **Verdict:** `PASS`, findings `[]`

The local review gate stored both receipts unchanged and confirmed distinct reviewer identities, one exact tuple, attempt 3, zero findings and `gateStatus: PASS`.

## Review-cycle and harness history

- Attempt 1 produced a candidate, but Lane B observed a non-deterministic cold browser failure. It was not accepted.
- Attempt 2 produced a new candidate, but both fresh reviewers reproduced cold-route failures, including an `__name` callback-serialization error and fallback context. It was not accepted.
- The attempt-3 pre-candidate gate then exposed four independent harness defects:
  1. ANSI-formatted Vite output was not normalized before strict URL ownership matching.
  2. The no-prewarm source guard matched its own forbidden string literals.
  3. Vite dev-server dependency optimization could reload the document during a genuinely cold lazy route.
  4. Two reset clicks used `force: true` while reduced-motion emulation remounted the underlying button.
- Each defect was repaired without retry, longer timeout, app-route changes or browser prewarming.
- These attempt-3 failures occurred before immutable candidate generation and before both independent review lanes. Under `01-SNART-RULES.md`, they did not consume an additional complete candidate/review cycle.
- One initial Lane A checkout was rejected before receipt storage because global Windows `core.autocrlf=true` translated canonical files. Fresh canonical-LF worktrees were created with byte parity and exact lockfile dependencies; only their two PASS receipts are part of the final gate.

## Security, privacy and evidence boundaries

- No browser haptic fallback or `navigator.vibrate` path remains.
- No storage, analytics, child/profile identity, runtime climate API or new network capability was introduced.
- No package manifest, lockfile, climate data, threshold, pricing, RevenueCat, schema or backend source changed.
- No screenshot, video, trace or other app media was created.
- Source and evidence scans found no added secret material.
- Review receipts demonstrate local consistency and separation of reviewers; they are explicitly **not cryptographic provenance**.

## Deferred physical and visual evidence

Physical device haptics, VoiceOver/TalkBack behavior, final device/WebView polish, app screenshots/video and visual convergence to the 90+ target remain Phase 4 responsibilities. They are not claimed by this no-media Phase 1 candidate and do not block Phase 1 completion.

## User setup required

None. No external access, payment, service configuration, deployment or TestFlight action was required.

## Next-phase readiness

- Phase 1 is complete at the reviewed candidate SHA above.
- Plan 02-05 may consume the exact labeled Phase 1 tuple and merge the reviewed Phase 2 plan-04 lineage without guessing at branch tips.
- Plan 03-03 can now use this summary in its final exact-SHA verifier.
- No GitHub push, Vercel deployment, Codemagic action, TestFlight upload or production publication was performed by this plan.

---
*Phase: 01-planlegg-dagslinjen*
*Completed: 2026-07-25*
