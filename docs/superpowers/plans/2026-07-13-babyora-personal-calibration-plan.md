# Babyora Personal Calibration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Learn whether each child tends to need a slightly lighter or warmer recommendation using minimal, explainable, reversible feedback.

**Architecture:** Feedback is append-only and context-bound to the deterministic Motor 2.0 recommendation fingerprint. A pure calibration function derives only `-1|0|1` after sufficient comparable evidence; Motor 2.0 applies it to `ThermalIntent` before garment resolution and final safety guardrails, and UI always explains or resets it.

**Tech Stack:** TypeScript/Vitest, Motor 2.0 contracts, Supabase Postgres/RLS, React.

## Global Constraints

- Apply `2026-07-13-babyora-verification-protocol.md`; algorithm and engine integration require fresh-context review plus the full guardrail matrix.
- One response never changes a recommendation.
- Minimum three usable observations and two comparable contexts; five observations are required for strong confidence.
- Calibration never removes required weather protection or overrides safety.
- No free text, photo, precise location, or clinical claim is stored.
- **Execution model:** Use Sonnet 5 High for Tasks 1, 4, and 5. Use Fable 5 Extra for Tasks 2 (calibration algorithm) and 3 (safety-engine integration). If Fable is unavailable or paid usage is not approved, use Opus 4.8 Extra.

---

### Task 1: Feedback schema and repository

**Files:** Create `supabase/migrations/202607130002_feedback.sql`, SQL RLS tests, `src/lib/calibration/types.ts`, `feedback-repository.ts`, `supabase-feedback-repository.ts`, tests.

**Interfaces:** `FeedbackValue='warm'|'comfortable'|'cold'`; `FeedbackContext` includes fingerprint, perceived-temp band, activity, garment categories, and observedAt; `Calibration=-1|0|1`.

- [ ] Write RLS tests: owner/guardian/caregiver may insert for accessible child; read-only/cross-household/revoked cannot; events cannot be updated; guardian can mark an event excluded without deleting audit history.
- [ ] Create `child_feedback_events` and `child_calibrations`; index child/time and child/context band; use checks for allowed categorical values and bounded offset.
- [ ] Implement `submitFeedback({ operationId, childId, value, context })` idempotently and queue it offline.
- [ ] Run SQL/repository tests; commit `feat: store attributable child comfort feedback`.

### Task 2: Deterministic calibration algorithm

**Files:** Create `src/lib/calibration/derive-calibration.ts` and exhaustive tests.

**Interfaces:** `deriveCalibration(events, now): { offset:-1|0|1; confidence:'none'|'emerging'|'strong'; usableCount:number; agreement:number; explanationKey:string }`.

- [ ] Write failing tests for 0–2 events, three consistent comparable events, five recent events, contradictory caregivers, excluded events, 180-day age decay, warm→`-1`, cold→`+1`, comfortable→`0`, and hard bounds.
- [ ] Implement weights: ignore excluded/invalid; weight ≤30 days `1`, 31–90 `0.6`, 91–180 `0.3`, older `0`; map warm `-1`, comfortable `0`, cold `+1`; require usable count ≥3, two context buckets, weighted agreement ≥0.70; require count ≥5 and agreement ≥0.80 for strong confidence.
- [ ] If warm and cold each hold ≥30% of non-comfortable weight, return standard with `conflicting_feedback`.
- [ ] Round only to `-1|0|1`; never expose a floating score to the recommendation engine.
- [ ] Run mutation/fixture tests; commit `feat: derive bounded explainable calibration`.

### Task 3: Engine safety integration

**Files:** Modify `src/lib/clothing-engine-v2/calibration.ts`, `recommend.ts`, `safety.ts`, Motor 2.0 and legacy guardrail tests; consume `src/lib/clothing-engine-v2/fingerprint.ts`.

- [ ] Write failing tests proving `-1|0|1` changes thermal warmth by at most one bounded step, precipitation/wind/UV/equipment needs remain, and safety output is identical or safer after calibration.
- [ ] Apply calibration to `ThermalIntent` before material/garment resolution and final `safety.ts`; record a structured explanation key in the recommendation.
- [ ] Include the applied offset—not the child identity—in the recommendation fingerprint.
- [ ] Run the full Motor 2.0 gold matrix, existing wool-layers matrix and guardrail suite; commit `feat: apply calibration beneath Babyora safety rules`.

### Task 4: Feedback and evidence UX

**Files:** Modify `src/screens/VarmEllerKaldScreen.tsx`, `src/screens/PaakledningScreen.tsx`; create `src/components/calibration/ComfortGauge.tsx`, `ComfortFeedback.tsx`, `CalibrationSummary.tsx`, `CalibrationEvidenceSheet.tsx`; modify `src/screens/family/ChildProfileScreen.tsx`.

- [ ] Write UI tests for warm/passe/cold, sign-in requirement, offline queued state, insufficient evidence, emerging/strong explanation, caregiver attribution, exclusion, pause, and reset.
- [ ] Ask after a relevant period rather than immediately on recommendation render; one-tap choices use selection haptic and a non-clinical neck-check explanation.
- [ ] Implement Warm/Passe/Cold as an accessible three-radio tactile gauge with one sliding indicator; center is visually neutral, and color is never the only signal.
- [ ] Display “Tilpasset [navn]: ett lettere/varmere mellomplagg” only when offset is applied; show evidence count and last updated in the detail sheet.
- [ ] Guardians can exclude an erroneous event, pause learning, and reset calibration; caregivers can submit but not alter evidence.
- [ ] Run accessibility, copy, screenshot, and focused tests; commit `feat: explain and control personal calibration`.

### Task 5: Sync, analytics, and release evidence

**Files:** Modify `src/lib/analytics/track.ts`, sync subscriptions, privacy copy; create `docs/superpowers/evidence/calibration.md`.

- [ ] Extend typed analytics with categorical `feedback_submitted`, `calibration_changed`, `calibration_reset`; prohibit child/member/fingerprint/context identifiers.
- [ ] Recompute calibration server-side or in a trusted transaction after event insert/exclusion; clients may preview but server row is shared truth.
- [ ] Test concurrent caregiver submissions, offline replay, member revocation, timezone boundaries, and two-device convergence.
- [ ] Run `npm test`, build, lint delta, RLS suite, and 20-fixture safety matrix; document exact results.
- [ ] Commit `docs: verify Babyora personal calibration`.
