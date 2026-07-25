---
phase: 01-planlegg-dagslinjen
plan: "17"
subsystem: planning-navigation
tags: [snart, routing, guide, vinterprogram, accessibility, review-gate]

requires:
  - phase: 01-16
    provides: activated and independently reviewed Snart preparation surface
provides:
  - App-owned typed one-shot routing from Guide and Vinterprogram to Planlegg/Snart
  - truthful Guide and Vinterprogram destinations without an accessible Min garderobe route
  - preserved eight-lesson Vinterprogram identity and ordering
  - immutable route candidate with two distinct independent PASS receipts
affects: [01-18, planlegg, guide, vinterprogram, snart]

tech-stack:
  added: []
  patterns:
    - opaque monotonic request token consumed at most once
    - one App-owned dispatcher for cross-root Guide and Vinterprogram navigation
    - immutable candidate tuple reviewed by two read-only agents

key-files:
  created:
    - .planning/phases/01-planlegg-dagslinjen/evidence/01-17-candidate.json
    - .planning/phases/01-planlegg-dagslinjen/evidence/01-17-review-a.json
    - .planning/phases/01-planlegg-dagslinjen/evidence/01-17-review-b.json
  modified:
    - e2e/planlegg.ts
    - src/App.tsx
    - src/data/vinterprogram.ts
    - src/lib/planning/__tests__/planning-interaction.test.ts
    - src/lib/planning/planning-interaction.ts
    - src/screens/GuideHubScreen.tsx
    - src/screens/UkeScreen.tsx
    - src/screens/__tests__/guide-routing.test.tsx

key-decisions:
  - "Guide and Vinterprogram share one App-owned typed dispatcher instead of introducing a router or browser-history state."
  - "The Snart request token is opaque, monotonic, session-local and contains no clock, profile identity or route history."
  - "Only the inaccessible Min garderobe route branch and misleading entry copy were removed; legacy screen, catalog and engine files remain untouched."
  - "Material education routes to Plaggbibliotek, while week 8 routes to Snart historical normals without changing lesson identity or order."
  - "Review receipts are local consistency evidence, not cryptographic provenance."

patterns-established:
  - "Cross-root request pattern: produce a new opaque token in App, consume it once in Uke, and never replay it after remount or root changes."
  - "Capability migration pattern: replace only visible claims and route branches after the destination capability has an independently reviewed green tree."

requirements-completed: [GOV-01, GOV-04, GOV-05, GOV-06, ACCESS-01, UI-02, EVID-01, EVID-02]

coverage:
  - id: D1
    description: "Guide and Vinterprogram open Planlegg/Snart once through the App-owned typed dispatcher without replay or identity-bearing state."
    requirement: UI-02
    verification:
      - kind: unit
        ref: "src/lib/planning/__tests__/planning-interaction.test.ts"
        status: pass
      - kind: e2e
        ref: "npx tsx e2e/planlegg.ts --case route-migration"
        status: pass
    human_judgment: false
  - id: D2
    description: "Visible Guide/program copy and targets are truthful; material education opens Plaggbibliotek and week 8 opens historical Snart normals."
    requirement: GOV-04
    verification:
      - kind: unit
        ref: "src/screens/__tests__/guide-routing.test.tsx"
        status: pass
      - kind: e2e
        ref: "route-migration, exact-context, access, automatic-location and snart browser cases"
        status: pass
    human_judgment: false
  - id: D3
    description: "The immutable candidate passed two distinct independent read-only reviews with zero findings."
    requirement: EVID-02
    verification:
      - kind: other
        ref: "scripts/snart/review-gate.ts validate --plan 01-17"
        status: pass
    human_judgment: false

duration: 27min
completed: 2026-07-24
status: complete
---

# Phase 1 Plan 17: Route Guide and Vinterprogram to Reviewed Snart

**Babyora now routes truthful Guide and Vinterprogram entries to the reviewed Snart surface through one typed, non-replaying App dispatcher while preserving the legacy implementation outside the accessible route.**

## Performance

- **Duration:** 27 min
- **Started:** 2026-07-24T22:15:46+02:00
- **Completed:** 2026-07-24T22:43:08+02:00
- **Tasks:** 3
- **Source files modified:** 8
- **New external cost:** NOK 0

## Accomplishments

- Added an opaque one-shot `snart` request that App creates and Uke consumes at most once, without timestamps, child/profile identity, storage or browser-history semantics.
- Migrated the visible Guide and Vinterprogram entries away from the unavailable Min garderobe route while retaining unrelated legacy screen, catalog and engine files.
- Preserved all eight Vinterprogram lesson IDs and their order; the material lesson now opens Plaggbibliotek and lesson 8 opens reviewed historical monthly normals in Snart.
- Proved route, focus, no-replay, exact-context, access, automatic-location and Snart behavior in unit and browser tests.
- Froze candidate `ffc336a52edec649a47787cbf575ea2b24d7c171` and passed two distinct independent reviews with no findings.

## Task Commits

1. **Task 1: Build typed one-shot Snart request through App and Uke** — `29916f9`
2. **Task 2: Wire both entries and remove only the Min garderobe route branch** — `5b95251`
3. **Task 3: Prove cross-root routing and freeze the immutable candidate** — `ffc336a`

## Immutable Candidate

- **Git SHA:** `ffc336a52edec649a47787cbf575ea2b24d7c171`
- **Tree SHA:** `60d4a13d9aa5ac9417c5970f223536eb949ea0ac`
- **Contract SHA-256:** `f223636699eb0b654ad29ab08b407237db6e5ee224aeb8f0720e4c80a0f05033`
- **Climate pack SHA-256:** `e222950d15e49a98e5aeb65516219f6a4adda5a618e6ad1ae98ad6193136457b`
- **Evidence SHA-256:** `04257804edef99ab574a5e8691aabfe1c40c30eae9804b0390c187b725cdec31`
- **Review attempt:** `1`
- **Gate result:** `PASS`

## Entry and CTA Inventory

| Entry | Previous meaning | Final target | Final truth |
|---|---|---|---|
| Guide preparation card | Min garderobe/personal wardrobe | `snart` | Historical monthly preparation normals |
| Vinterprogram lesson 1 material CTA | Generic material continuation | `plaggbib` | Wool and cotton in Plaggbiblioteket |
| Vinterprogram lesson 8 CTA | Personal wardrobe recommendation | `snart` | Historical monthly normals |

The eight lesson IDs remain, in order:

1. `ull-mot-huden`
2. `lag-pa-lag`
3. `vind-skjult-faktor`
4. `vogn-baeresele-lek`
5. `sjekk-nakken`
6. `sove-ute-vinter`
7. `frost-dager`
8. `din-garderobe-din-anbefaling`

Lesson 8 keeps its existing ID and week position so persisted progress and ordering remain stable; only its user-facing claim and destination changed.

## Source-Byte and Scope Preflight

- The 01-16 Snart contract and climate pack hashes match the activated reviewed baseline.
- Protected Snart, session, access, exact-context, model, capability and climate-data sources are byte-identical to 01-16.
- `UkeScreen.tsx` changed only through the declared typed one-shot request seam.
- No new router, browser-history state, storage, backend, schema, endpoint, package, analytics event or media was introduced.
- The legacy Min garderobe screen, catalog and recommendation engine remain on disk and unchanged.

## Verification

- Focused Vitest review suite: **41 tests passed**.
- TypeScript project build: `PASS`.
- ESLint: `PASS`.
- Production build: `PASS`.
- `route-migration`: `PASS`.
- `exact-context`: `PASS`.
- `access`: `PASS`.
- `automatic-location`: `PASS`.
- `snart`: `PASS`.
- `git diff --check`: `PASS`.
- Final candidate tuple and clean-tree audit: `PASS`.

The Snart browser case encountered two non-deterministic failures in unrelated Familie/navigation assertions during Lane B review; a third unchanged sequential run passed. The reviewer confirmed no candidate-related finding, and all other browser, unit, build, lint and containment checks remained green.

## Independent Reviews

### Lane A — typed route/state/focus/no-replay

- **Reviewer:** `/root/review_01_17_a1_lane_a`
- **Agent ID:** `/root/review_01_17_a1_lane_a`
- **Verdict:** `PASS`
- **Findings:** `[]`
- **Clean before/after:** `true` / `true`
- **Primary checks:** full candidate diff, planning interaction and Guide routing tests, TypeScript, lint, route/token/source scans and final tuple recomputation.

### Lane B — source containment/access/privacy/copy

- **Reviewer:** `/root/review_01_17_a1_lane_b`
- **Agent ID:** `/root/review_01_17_a1_lane_b`
- **Verdict:** `PASS`
- **Findings:** `[]`
- **Clean before/after:** `true` / `true`
- **Primary checks:** protected-source byte audit, build, all five required browser cases, focused 41-test suite, lint and final tuple audit.

The deterministic review gate accepted both receipts unchanged and confirmed distinct reviewer identities, one exact tuple, attempt 1, zero findings and `gateStatus: PASS`.

## Decisions Made

- Followed the locked capability-migration contract: expose only a capability already activated and independently reviewed in 01-16.
- Kept navigation inside App's existing state router and avoided a new browser router or history model.
- Preserved legacy implementation files to keep rollback bounded and prevent unrelated deletion.

## Deviations from Plan

None — the implementation, bounded legacy retention, entry migration, immutable-candidate review and evidence gate followed the approved plan.

## Issues Encountered

- The Snart E2E case showed two intermittent failures at pre-existing Familie/navigation assertions during one independent review. The unchanged third run passed, the required route migration assertions passed, and the reviewer found no source-level regression. This is recorded as harness flakiness rather than hidden as a clean first-attempt run.

## User Setup Required

None — no external service, payment, package or account configuration was added.

## Next Phase Readiness

- Plan 01-18 can start from the reviewed 01-17 completion tree.
- Guide and Vinterprogram now have a truthful, typed route into Snart without widening Free/Plus capabilities.
- No TestFlight upload, production deployment or external push was performed.

---
*Phase: 01-planlegg-dagslinjen*
*Completed: 2026-07-24*
