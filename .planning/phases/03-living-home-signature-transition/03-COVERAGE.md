# Phase 3 Source and Ownership Coverage

## Multi-source coverage audit

| Source | ID | Feature / constraint | Plans | Status |
|---|---|---|---|---|
| GOAL | — | Calm Living Home plus explanatory Home-to-Outfit garment transfer with static equivalence | 03-01, 03-04, 03-06, 03-07, 03-08 | COVERED |
| REQ | HOME-01 | Same-snapshot temperature/weather/daylight atmosphere; answer immediate; static equivalence | 03-01, 03-04, 03-06, 03-08 | COVERED |
| REQ | MOTION-01 | Exact branded garments land in rows in 900–1400 ms with semantic T0/static parity | 03-02, 03-03, 03-05, 03-06, 03-07, 03-08 | COVERED |
| RESEARCH | R-ATM | Pure resolver and bounded CSS/DOM background | 03-01 | COVERED |
| RESEARCH | R-HOME | New-file composition followed by sole post-gate Home wiring | 03-04, 03-06 | COVERED |
| RESEARCH | R-TIME | Injected bounded timeline and App-lifetime replay | 03-02 | COVERED |
| RESEARCH | R-STATIC | Immutable capture and fail-closed eligibility | 03-03 | COVERED |
| RESEARCH | R-P2 | `feature_flag: true`; exact imported `OutfitTruthSnapshotV1`, `AvatarVisibleSlot`, `AvatarVisualCoverage`, `OutfitBundleProducerResult`, and `RegisterOutfitRow`; selection only from `base.avatar.visibleGarmentIds`, exact resolution in `base.garments`, `visibleOnAvatar`/`avatarCoverage` slots-rank-occlusion validation, and scalar-only `transitionVisualState` | 03-05, 03-06, 03-07 | COVERED |
| RESEARCH | R-LIFE | Batched rectangles, lifecycle cancellation, transient registries | 03-06 | COVERED |
| RESEARCH | R-MOTION | Existing Motion API plus shared motion grammar | 03-07 | COVERED |
| RESEARCH | R-MATRIX | 320/390, 200%, forced colors, theme/temperature cross-product, semantic T0, timing logs | 03-06, 03-08 | COVERED |
| CONTEXT | D-01 | Non-blocking same-snapshot Living Home | 03-01, 03-04, 03-06 | COVERED |
| CONTEXT | D-02 | Existing stack, NOK0-compatible, no package or parallel design system | 03-01, 03-04, 03-07, 03-08 | COVERED |
| CONTEXT | D-03 | Semantic-first Outfit and decorative overlay | 03-03, 03-06, 03-07 | COVERED |
| CONTEXT | D-04 | Exact triple and geometry fail closed | 03-03, 03-05, 03-06 | COVERED |
| CONTEXT | D-05 | Unknown/null/hidden/occluded/ambiguous/equipment truth remains static; exhaustive visibility/occlusion adapter matrix | 03-05, 03-06, 03-07 | COVERED |
| CONTEXT | D-06 | 900–1400 ms explanatory; 180–250 ms ordinary | 03-02, 03-07, 03-08 | COVERED |
| CONTEXT | D-07 | One exact-triple attempt in App memory | 03-02, 03-06 | COVERED |
| CONTEXT | D-08 | Deterministic Phase-3 evidence; hardware/optional media in Phase 4 | 03-06, 03-08 | COVERED |
| CONTEXT | D-09 | New-file foundations before exact Phase-2 integration | 03-01 through 03-06 | COVERED |
| CONTEXT | D-10 | Isolated worktrees and serialized shared ownership | all | COVERED |
| CONTEXT | D-11 | NOK 0 and no unapproved commitment above NOK 1,000 | all | COVERED |
| CONTEXT | D-12 | Autonomous exact-SHA independent gates; final candidate/two reviews/log under absolute external `BABYORA_PHASE3_EVIDENCE_ROOT` | all | COVERED |

Deferred Phase-4 items are exclusions, not gaps. No GOAL, REQ, RESEARCH, or CONTEXT source item is unplanned.

## Dependency waves

```text
Wave 1: 03-01 atmosphere primitives || 03-02 timeline/replay
Wave 2: 03-03 capture/eligibility || 03-04 new-file Living Home composition
Wave 3: 03-05 exact Phase-2 adapter gate
Wave 4: 01-18 + 03-02 + 03-04 + 03-05 -> 03-06 sole Hjem/App wiring and coordinator
Wave 5: 03-07 Motion overlay/Outfit integration
Wave 6: 03-08 final deterministic matrix and exact-SHA gate
```

Same-wave plans have no overlapping `files_modified`.

## File ownership

| Path | Ownership rule |
|---|---|
| `src/screens/HjemScreen.tsx` | `03-06` only, after exact Phase-1 and Phase-2 gates. |
| `src/App.tsx` | `03-06`, then `03-07` serially after exact gates. |
| `src/screens/PaakledningScreen.tsx` | Phase 2 exclusive and enabled at `02-09`; Phase 3 never edits it. |
| `src/lib/outfit/*`, `src/components/outfit/*` | Phase 2 exclusive; Phase 3 imports but never edits. |
| `src/styles/motion-grammar.ts` | `03-07` only; active shared timing source. |
| `src/styles/design-tokens.css` | Not modified; new Phase-3 CSS consumes existing tokens. |
| `e2e/planlegg.ts` | Phase 1 exclusive; Phase 3 owns `e2e/home-outfit-motion.ts`. |
| Dependency manifests/lockfiles | Never modified by Phase 3. |
| `scripts/verify-phase3-final.mjs` and its test | `03-08` only; checked-in path-safe final collection/verification runner using environment lookup and process argument arrays. |
| Final candidate/review/log evidence | Orchestrator-created absolute `BABYORA_PHASE3_EVIDENCE_ROOT` outside every checkout; never listed in the detached candidate or hashed through the summary. |

Integration consumes exact `candidate_sha` from `.planning/phases/01-planlegg-dagslinjen/01-18-SUMMARY.md` (normalized internally only after strict parsing), Phase 2's labeled `phase2_candidate_sha`, and labeled Phase-3 dependency SHAs from clean isolated worktrees.
