# Product Roadmap — Snudly

> **Roadmap status:** 7/56 tasks closed — 6 complete, 1 waived
>
> **Primary launch:** Norwegian iOS validation and release
>
> **Expansion:** Sweden and Denmark only after local safety review and pilot evidence
>
> **Working model:** The existing app is a functional prototype. Reuse verified logic and integrations; visual design remains open and reversible.

## Build Philosophy

1. **Prove the decision before expanding the product.** The first question is whether parents repeatedly want one trusted answer and will pay for it.
2. **Preserve verified foundations, not accidental styling.** Keep working domain logic, native projects, and integrations; colors, typography, layout, and components may change.
3. **Build the smallest complete vertical slice.** Every phase ends in something a founder or tester can use and verify.
4. **Treat safety as deterministic product logic.** Safety rules, sources, country review status, and boundary tests are versioned and cannot be overridden by UI preferences.
5. **Measure behavior with minimal data.** Collect only the events needed for the agreed funnel; never send child identity, exact location, or recommendation contents.
6. **Let evidence change the roadmap.** Pricing, visual direction, country expansion, and post-MVP features remain provisional until user behavior supports them.

## Phase 0: Baseline, Prototype Audit & Open Design Exploration

> **Goal:** Establish a trusted technical baseline, separate reusable behavior from replaceable presentation, and choose only a provisional visual direction.

**Reference sections — read before starting:**

- Product Vision: `MVP Definition`, `Product Principles`, `Visual Design Direction`
- PRD: `1. Overview`, `2. Technical Architecture`, `8. UI/UX Requirements`, `14. Open Questions`
- Validation: `docs/validation-report.md` — biggest risks and 14-day test

**Phase prompt — give this to Codex:**

> Read `docs/VISION.md`, `docs/product-vision.md`, `docs/prd.md`, and this phase completely. Work on branch `phase-0/baseline-and-design-exploration`. Treat the current UI as a prototype, not a design contract. Complete one task per session, preserve unrelated user changes, run the task's verification, and update only that task checkbox after evidence exists.

- [x] **TASK-001** — Capture a clean technical baseline without changing product behavior.
  Files: `docs/evidence/baseline.md`, `package.json`
  Notes: Record install, test, lint, build, and smoke commands plus current pass/fail output; do not fix unrelated failures in this task. Verify: another session can reproduce every recorded command.

- [x] **TASK-002** — Map current implementation against the PRD requirements.
  Files: `docs/evidence/implementation-matrix.md`, `docs/prd.md`
  Notes: Mark every `FR-001`–`FR-016` as verified, partial, missing, or conflicting and cite concrete files/tests. Verify: every requirement has exactly one status and one evidence link.

- [x] **TASK-003** — Separate reusable product foundations from replaceable prototype UI.
  Files: `docs/evidence/prototype-inventory.md`, `src/`
  Notes: Inventory domain logic, weather, state, billing, analytics, navigation, screens, components, and styles; label each preserve, adapt, replace, or investigate. Verify: no visual asset or token is labeled mandatory solely because it already exists.

- [x] **TASK-004** — Write the open visual exploration brief.
  Files: `docs/design-exploration.md`, `docs/product-vision.md`
  Notes: Define audience, emotion, accessibility, trust, magic moment, exclusions, and evaluation questions without selecting colors or a style. Verify: the brief permits at least three meaningfully different visual directions.

- [x] **TASK-005** — Produce three distinct low-cost visual directions from external references.
  Files: `docs/design-options.md`, `design-lab/`
  Notes: Create one representative onboarding/home/result concept per direction; vary color, type, density, imagery, and component character rather than making palette swaps. Verify: a reviewer can distinguish each direction without reading its title.

- [x] **TASK-006 — WAIVED BY OWNER 2026-08-22** — Test visual directions with five target dads.
  Files: `docs/evidence/design-test.md`, `docs/design-options.md`
  Notes: The owner explicitly skipped this test after confirming it required five real people. Participant evidence remains 0/5; close this task only as waived, never passed or validated. The current live layout remains the production base and visual choices remain reversible because preference evidence was not collected.

- [x] **TASK-007** — Record a provisional, versioned design direction.
  Files: `docs/design.md`, `docs/evidence/design-test.md`
  Notes: Build a new v0.1 design system on the current live layout, information order, and four-tab structure; replace visual tokens and component styling only where supported by evidence. Document tokens and interaction rules, explicitly listing what remains open and how the direction may change. Verify: `docs/design.md` contains a version, decision date, evidence, preserved-layout contract, and reversible assumptions.

- [ ] **TASK-008** — Inventory runtime configuration and owner-controlled console actions.
  Files: `.env.example`, `docs/evidence/environment-inventory.md`
  Notes: List required Vercel, MET, RevenueCat, PostHog, Sentry, Apple, and deferred Supabase settings without real secrets. Verify: secret values are absent and every variable in PRD section 2 has an owner and environment.

- [ ] **TASK-009** — Define release and country gates independently of locale.
  Files: `src/config/release-gates.ts`, `src/config/release-gates.test.ts`
  Notes: Model Norway production, Sweden pilot, and Denmark pilot status separately from selected language; default unknown countries to unavailable. Verify: unit tests cover every gate and unknown input.

- [ ] **TASK-010** — Close Phase 0 with a reproducible working shell.
  Files: `docs/evidence/phase-0-verification.md`, `docs/product-roadmap.md`
  Notes: Re-run the baseline commands, open the current app shell, and record accepted exceptions plus next-phase blockers. Verify: the shell runs, navigation opens, and no product behavior was lost during documentation work.

## Phase 1: Core Recommendation & Safety Proof

> **Goal:** Deliver the complete no-account magic moment: valid child and location inputs produce one deterministic, safety-checked outfit in dressing order.

**Reference sections — read before starting:**

- Product Vision: `Core User Journey`, `MVP Definition`, `Key Product Decisions`
- PRD: `3. Data Model`, `4. API Specification`, `5. User Stories`, `6. Functional Requirements`, `11. Edge Cases & Error Handling`
- Design: `docs/design.md` v0.1, while preserving its explicitly open decisions

**Phase prompt — give this to Codex:**

> Read the listed references and inspect existing implementations before editing. Work on branch `phase-1/core-recommendation`. Reuse verified engine and weather code, replace UI only where the provisional design requires it, and never weaken a safety rule to make a test pass. Complete and verify one roadmap task per session.

- [ ] **TASK-011** — Harden the single local child profile contract for ages 0–24 months.
  Files: `src/state/children.tsx`, `src/state/children.test.tsx`
  Notes: Validate date of birth, migrate known stored shapes, recover from corrupt storage, and reject unsupported ages without deleting data. Verify: tests cover valid, future, corrupt, migrated, and over-age profiles.

- [ ] **TASK-012** — Harden manual home location and session-only automatic location.
  Files: `src/state/location.ts`, `src/state/location.test.ts`, `src/lib/gdpr/local-data.ts`
  Notes: Persist only manual home details and location mode; keep automatic coordinates in memory and discard stale generation responses. Verify: storage inspection and tests show automatic coordinates never persist.

- [ ] **TASK-013** — Validate the MET forecast proxy contract and failure behavior.
  Files: `api/forecast.ts`, `api/__tests__/forecast.test.ts`, `src/lib/met-no/`
  Notes: Validate coordinates/payloads, preserve compliant identification, implement bounded retry and cache scope, and return typed safe errors. Verify: tests cover invalid coordinates, timeout, 429, malformed upstream data, fixed cache, and memory-only no-store.

- [ ] **TASK-014** — Make recommendation inputs explicit and activity-complete.
  Files: `src/lib/clothing-engine-v2/types.ts`, `src/lib/clothing-engine-v2/input.test.ts`
  Notes: Support stroller, carrier, outdoor play, and indoor sleep plus car-seat context where applicable; reject impossible combinations. Verify: every activity has valid fixtures and invalid-context tests.

- [ ] **TASK-015** — Prove deterministic engine behavior at temperature and activity boundaries.
  Files: `src/lib/clothing-engine-v2/`, `src/lib/clothing-engine-v2/boundary.test.ts`
  Notes: Route UI-facing calls through one canonical pure engine and freeze boundary expectations with named fixtures. Verify: repeated runs produce byte-equivalent canonical results for the same input.

- [ ] **TASK-016** — Version safety rules, sources, and country-review status.
  Files: `src/lib/clothing-engine-v2/safety-rules.ts`, `src/lib/clothing-engine-v2/safety-rules.test.ts`, `docs/safety/rule-register.md`
  Notes: Give every rule stable ID, severity, source IDs, non-override flag, and NO/SE/DK review status. Verify: tests reject missing sources and production use of unreviewed country rules.

- [ ] **TASK-017** — Implement the fast Home input-to-answer interaction.
  Files: `src/screens/HjemScreen.tsx`, `src/components/`, `src/screens/HjemScreen.test.tsx`
  Notes: Keep child, activity, weather status, and one primary action clear; do not add decorative work outside `docs/design.md` v0.1. Verify: a component test reaches calculation with keyboard and touch-sized controls.

- [ ] **TASK-018** — Render one complete numbered outfit in dressing order.
  Files: `src/screens/PaakledningScreen.tsx`, `src/screens/PaakledningScreen.test.tsx`
  Notes: Show layers, short reason, weather time, safety notices, and text fallbacks; never present a partial result as complete. Verify: populated, stale, missing-image, and engine-error states pass.

- [ ] **TASK-019** — Re-run safety finalization after every garment substitution.
  Files: `src/lib/clothing-engine-v2/substitution.ts`, `src/lib/clothing-engine-v2/substitution.test.ts`, `src/screens/PaakledningScreen.tsx`
  Notes: Reject unsafe alternatives, preserve canonical order, and explain why a blocked preference lost to safety. Verify: hard-rule substitution fixtures cannot be bypassed through UI state.

- [ ] **TASK-020** — Verify the complete core magic moment end to end.
  Files: `e2e/core-recommendation.spec.ts`, `docs/evidence/phase-1-verification.md`
  Notes: Cover onboarding, manual/automatic location, all four activities, one denied permission, one weather failure, and one safety override. Verify: tests pass and the recorded returning-user path completes in under 5 seconds on the test device.

## Phase 2: Subscription, Analytics & Reliability

> **Goal:** Show real value before a truthful paywall, support monthly/annual purchases safely, and measure the validation funnel without collecting sensitive child data.

**Reference sections — read before starting:**

- Product Vision: `Business Model`, `Success Metrics`, `Risks & Mitigations`
- PRD: `9. Auth Implementation`, `10. Payment Integration`, `12. Dependencies & Integrations`, `14. Open Questions`
- Validation: `docs/validation-report.md` — willingness-to-pay risk

**Phase prompt — give this to Codex:**

> Work on branch `phase-2/subscription-and-observability`. Keep authentication deferred. Use RevenueCat as native entitlement authority, live store prices as display authority, and the analytics wrapper as the only event surface. Complete one task at a time and stop for owner-controlled console evidence when required.

- [ ] **TASK-021** — Audit RevenueCat entitlement, offering, and package mappings.
  Files: `src/lib/billing/revenuecat.ts`, `docs/evidence/revenuecat-config.md`
  Notes: Confirm entitlement `premium`, offering `default`, and monthly/annual packages without hard-coded product IDs in components. Verify: configured sandbox offering returns both required package types.

- [ ] **TASK-022** — Replace ambiguous billing outcomes with a typed purchase contract.
  Files: `src/lib/billing/revenuecat.ts`, `src/lib/billing/revenuecat.test.ts`
  Notes: Distinguish success, cancellation, pending, unavailable, entitlement-missing, and error; guard duplicate taps. Verify: adapter tests cover every outcome without real billing calls.

- [ ] **TASK-023** — Gate the paywall until after the first genuine recommendation.
  Files: `src/state/subscription.ts`, `src/components/PaywallDialog.tsx`, `src/state/subscription.test.ts`
  Notes: Persist first-value state safely and define the approved next value action/session that may open the paywall. Verify: a new user reads one full result before any paywall can appear.

- [ ] **TASK-024** — Render truthful monthly and annual offers from the store.
  Files: `src/components/PaywallDialog.tsx`, `src/components/PaywallDialog.test.tsx`
  Notes: Show localized live prices, renewal/cancellation copy, loading, missing-offering, error, and success states; anchor prices are never purchasable. Verify: tests cover two live packages and an unavailable offering.

- [ ] **TASK-025** — Implement restore, expiry, refund, and manage-subscription behavior.
  Files: `src/state/subscription.ts`, `src/screens/FamilieScreen.tsx`, `src/state/subscription.test.ts`
  Notes: Refresh customer info at safe lifecycle points, relock on inactive entitlement, preserve local data, and expose restore/manage actions. Verify: active, expired, refunded, nothing-to-restore, and offline cases pass.

- [ ] **TASK-026** — Resolve the 39-versus-49 NOK owner configuration mismatch.
  Files: `docs/evidence/store-pricing.md`, `src/config/products.ts`
  Notes: Record App Store Connect and RevenueCat evidence for live monthly/annual prices and trial; keep UI store-driven regardless of result. Verify: no conflicting purchasable price string remains in user-facing code.

- [ ] **TASK-027** — Enforce a privacy-safe PostHog funnel schema.
  Files: `src/lib/analytics/track.ts`, `src/lib/analytics/track.test.ts`, `docs/analytics-event-schema.md`
  Notes: Allow only approved events and coarse properties; drop names, DOB, exact age, city, coordinates, garments, free text, and raw safety flags. Verify: forbidden-property tests fail closed and opt-out stops capture.

- [ ] **TASK-028** — Add scrubbed Sentry error reporting and release source maps.
  Files: `src/lib/monitoring/sentry.ts`, `src/main.tsx`, `vite.config.ts`, `src/lib/monitoring/sentry.test.ts`
  Notes: Initialize only when configured, disable replay, scrub PII/location/receipt data, and keep auth token CI-only. Verify: synthetic errors arrive with source maps and the scrub fixture contains no forbidden data.

- [ ] **TASK-029** — Verify the native purchase journey on a physical iPhone.
  Files: `e2e/purchase-flow.spec.ts`, `docs/evidence/phase-2-ios-purchase.md`
  Notes: Record first value, paywall, monthly/annual sandbox purchase, cancel, restore, expiry simulation, and cold-start entitlement. Verify: screenshots/logs identify device/build and every required scenario has pass/fail evidence.

## Phase 3: Localization, Country Safety Gates & Pilot Readiness

> **Goal:** Make Norwegian release-quality, prepare Swedish and Danish pilot builds, and create an ethical, measurable 20-dad validation setup.

**Reference sections — read before starting:**

- Product Vision: `Target Market`, `Go-To-Market Strategy`, `Success Metrics`
- PRD: `7. Non-Functional Requirements`, `8. UI/UX Requirements`, `11. Edge Cases & Error Handling`
- Vision: `docs/VISION.md` — country order and accepted pilot thresholds

**Phase prompt — give this to Codex:**

> Work on branch `phase-3/localization-and-pilot`. Language completion does not equal safety approval. Keep Sweden and Denmark pilot-only unless their rule register shows qualified review. Complete one task per session and preserve Norwegian as the production default.

- [ ] **TASK-030** — Complete and test Norwegian core-flow localization.
  Files: `src/i18n/locales/no/`, `src/i18n/i18n.test.ts`
  Notes: Cover onboarding, permissions, activities, result, safety, paywall, restore, errors, privacy, and deletion with natural Norwegian. Verify: no missing/fallback key appears in the production core flow.

- [ ] **TASK-031** — Complete Swedish pilot localization independently of safety approval.
  Files: `src/i18n/locales/sv/`, `src/i18n/i18n.test.ts`
  Notes: Translate the same core-flow inventory and mark internal pilot builds outside ordinary user copy. Verify: Swedish core flow has no missing keys while its public-release gate remains closed.

- [ ] **TASK-032** — Complete Danish pilot localization independently of safety approval.
  Files: `src/i18n/locales/da/`, `src/i18n/i18n.test.ts`
  Notes: Translate the same core-flow inventory and mark internal pilot builds outside ordinary user copy. Verify: Danish core flow has no missing keys while its public-release gate remains closed.

- [ ] **TASK-033** — Create the qualified country safety-review evidence pack.
  Files: `docs/safety/review-template.md`, `docs/safety/no-review.md`, `docs/safety/se-review.md`, `docs/safety/dk-review.md`
  Notes: Include reviewer qualification, sources, scenario fixtures, disagreements, decision date, rule version, and signature/status without inventing approval. Verify: each country has an explicit pending or approved status.

- [ ] **TASK-034** — Bind country review status to build/release behavior.
  Files: `src/config/release-gates.ts`, `src/lib/clothing-engine-v2/country-policy.ts`, `src/lib/clothing-engine-v2/country-policy.test.ts`
  Notes: Allow internal SE/DK pilot use with visible status but block production promotion when review is pending. Verify: build-policy tests fail closed for missing, expired, or mismatched rule versions.

- [ ] **TASK-035** — Prepare the 20-dad cohort and consent materials.
  Files: `docs/pilot/recruitment.md`, `docs/pilot/consent-and-privacy.md`, `docs/pilot/cohort.csv.example`
  Notes: Define 10 NO, 5 SE, and 5 DK dads, inclusion criteria, voluntary participation, data scope, withdrawal, and pseudonymous IDs. Verify: materials collect no child identity or unnecessary health data.

- [ ] **TASK-036** — Build the pilot scorecard and payment-commitment rubric.
  Files: `docs/pilot/scorecard.md`, `docs/pilot/payment-commitment.md`
  Notes: Predefine repeat-use threshold, genuine commitment examples, disallowed polite-intent answers, funnel definitions, and pass/iterate/stop decisions. Verify: the score can be calculated without changing definitions after results arrive.

- [ ] **TASK-037** — Create the pilot feedback and support loop.
  Files: `docs/pilot/feedback-script.md`, `docs/pilot/support-runbook.md`
  Notes: Use short day-1, midpoint, and exit questions; define response handling for safety concerns, crashes, payment issues, and withdrawal. Verify: every issue class has an owner, response time, and escalation action.

- [ ] **TASK-038** — Produce and dry-run country-specific TestFlight pilot builds.
  Files: `codemagic.yaml`, `docs/evidence/phase-3-testflight.md`
  Notes: Preserve bundle ID, use safe environment groups, expose intended pilot markers, and test install/update on representative iPhones. Verify: NO, SE, and DK configurations install and reach a valid recommendation with correct release gates.

## Phase 4: Fourteen-Day Behavioral Validation

> **Goal:** Run the agreed test, keep participants safe and supported, and make a product decision from behavior rather than compliments.

**Reference sections — read before starting:**

- Validation: `docs/validation-report.md` — validation plan and verdict
- Product Vision: `Success Metrics`, `Risks & Mitigations`, `Strategic Positioning`
- Pilot pack: all files under `docs/pilot/`

**Phase prompt — give this to Codex:**

> Work on branch `phase-4/behavioral-validation`. Do not redefine success after launch. Keep raw identifiable participant information outside the repository. Codex may prepare, aggregate, and analyze pseudonymous evidence; Sivert owns recruitment, direct participant contact, and genuine payment conversations.

- [ ] **TASK-039** — Freeze the pilot build, rule versions, cohort IDs, and measurement window.
  Files: `docs/pilot/run-register.md`, `docs/evidence/pilot-build.md`
  Notes: Record commit/build, engine/rule versions, country gates, start/end times, expected cohort counts, and rollback build. Verify: later analysis can identify exactly what every tester used.

- [ ] **TASK-040** — Validate day-one onboarding and event delivery.
  Files: `docs/pilot/day-1-check.md`, `docs/evidence/pilot-events-day-1.md`
  Notes: Confirm all participants can install, consent, reach one answer, and emit only allowlisted events; resolve P0 safety/privacy blockers before continuing. Verify: cohort counts reconcile without storing child data.

- [ ] **TASK-041** — Triage pilot issues with a fixed severity policy.
  Files: `docs/pilot/issue-log.md`, `docs/pilot/support-runbook.md`
  Notes: Classify P0 safety/privacy, P1 blocked journey/payment, and P2 polish issues; do not ship visual preference changes during the frozen test. Verify: every issue has severity, country/build, owner, status, and evidence.

- [ ] **TASK-042** — Run the midpoint retention and comprehension check.
  Files: `docs/pilot/midpoint.md`, `docs/evidence/pilot-events-midpoint.md`
  Notes: Aggregate active days, answer completion, failures, and short comprehension feedback without judging final success early. Verify: all 20 pseudonymous IDs are accounted for as active, inactive, or withdrawn.

- [ ] **TASK-043** — Close the measurement window and export aggregate behavior.
  Files: `docs/pilot/results.csv.example`, `docs/evidence/pilot-events-final.md`
  Notes: Freeze event definitions and calculate per-participant active days, successful answers, paywall exposure, and purchase/trial state. Verify: totals reconcile with the cohort register and contain no prohibited properties.

- [ ] **TASK-044** — Record genuine payment commitments using the predefined rubric.
  Files: `docs/pilot/payment-results.md`, `docs/pilot/payment-commitment.md`
  Notes: Sivert records anonymized qualifying actions or specific commitments, not general enthusiasm; include price shown and country. Verify: every counted commitment cites the rubric criterion it satisfies.

- [ ] **TASK-045** — Score the pilot without moving the thresholds.
  Files: `docs/pilot/decision-scorecard.md`, `docs/pilot/scorecard.md`
  Notes: Calculate whether at least 12 of 20 used Snudly on 4+ days and at least 5 made genuine payment commitments; report country splits as directional only. Verify: another reviewer can reproduce both headline numbers.

- [ ] **TASK-046** — Write the evidence-based continue, iterate, or stop decision.
  Files: `docs/pilot/decision-memo.md`, `docs/product-roadmap.md`
  Notes: Separate product-value, trust, usability, pricing, and country findings; recommend one next move and explicitly reject unsupported scope. Verify: the memo names the decision, evidence, largest uncertainty, and next test.

- [ ] **TASK-047** — Convert accepted pilot findings into bounded PRD changes.
  Files: `docs/prd.md`, `docs/product-vision.md`, `docs/product-roadmap.md`
  Notes: Update only decisions supported by the memo, preserve a changelog, and do not silently promote SE/DK or family features. Verify: every changed requirement cites the pilot finding that caused it.

- [ ] **TASK-048** — Close Phase 4 with a founder-readable evidence index.
  Files: `docs/evidence/phase-4-index.md`, `docs/pilot/`
  Notes: Link build, cohort, event, issue, payment, score, and decision evidence with sensitive-data locations excluded. Verify: Sivert can audit the decision from one page in under 10 minutes.

## Phase 5: Norwegian iOS Launch Hardening

> **Goal:** If validation passes, turn the tested product into an accessible, private, supportable Norwegian App Store release.

**Reference sections — read before starting:**

- Pilot: `docs/pilot/decision-memo.md` and accepted PRD changes
- PRD: `7. Non-Functional Requirements`, `10. Payment Integration`, `11. Edge Cases & Error Handling`
- Design: current version of `docs/design.md`, including unresolved/reversible decisions

**Phase prompt — give this to Codex:**

> Start only if the Phase 4 decision authorizes a Norwegian launch. Work on branch `phase-5/norway-ios-launch`. Fix evidence-backed blockers first, keep visual changes within the current provisional design version, and require owner evidence for Apple/RevenueCat console state.

- [ ] **TASK-049** — Fix the highest-priority validated product blocker.
  Files: `docs/pilot/decision-memo.md`, `src/`, `docs/evidence/launch-fix-1.md`
  Notes: Implement only the memo's top authorized issue with focused tests and no bundled redesign. Verify: the failing pilot scenario now passes and unrelated core tests remain green.

- [ ] **TASK-050** — Complete core-flow accessibility hardening.
  Files: `src/screens/`, `src/components/`, `docs/evidence/accessibility.md`
  Notes: Verify semantic labels, focus, 44×44 targets, contrast, reduced motion, Dynamic Type, and VoiceOver across onboarding, answer, paywall, and settings. Verify: automated checks and a physical-iPhone manual pass are recorded.

- [ ] **TASK-051** — Harden offline, denied-permission, stale-data, and recovery states.
  Files: `src/screens/`, `src/state/`, `e2e/recovery.spec.ts`
  Notes: Keep the user oriented, preserve safe inputs, distinguish unavailable from stale, and never show partial recommendations. Verify: recovery E2E scenarios pass without restart or data loss.

- [ ] **TASK-052** — Meet launch performance and reliability budgets.
  Files: `vite.config.ts`, `src/`, `docs/evidence/performance.md`
  Notes: Measure cold start, returning answer time, bundle size, memory warnings, and crash-free sessions before optimization. Verify: PRD thresholds pass or an explicit documented exception blocks launch.

- [ ] **TASK-053** — Finalize Norwegian privacy, safety, source, support, and deletion surfaces.
  Files: `src/screens/`, `docs/privacy.md`, `docs/support.md`, `docs/safety/no-review.md`
  Notes: Align in-app wording with actual local/remote data flow and avoid medical claims; ensure deletion and analytics opt-out work. Verify: copy, behavior, source links, and reviewer status pass a release checklist.

- [ ] **TASK-054** — Complete App Store metadata, screenshots, naming, and subscription disclosures.
  Files: `docs/store/app-store-no.md`, `docs/evidence/app-store-connect.md`, `assets/store/`
  Notes: Verify Snudly name availability, use real tested screens, state trial/renewal clearly, and avoid unsupported claims. Verify: every required App Store field and screenshot size has owner evidence.

- [ ] **TASK-055** — Run the full release candidate regression on physical iPhones.
  Files: `e2e/`, `docs/evidence/release-candidate.md`
  Notes: Cover install/update, onboarding, all activities, safety boundaries, offline recovery, paywall, purchase, restore, settings, opt-out, and deletion. Verify: no open P0/P1 defect and all required checks are green on the recorded build.

- [ ] **TASK-056** — Submit and monitor a staged Norwegian iOS release.
  Files: `docs/release/runbook.md`, `docs/evidence/app-store-release.md`
  Notes: Record submission, review responses, rollout percentage, dashboards, support owner, rollback criteria, and rollback action; Sweden/Denmark remain closed. Verify: production install works and the first 72-hour safety, purchase, crash, and funnel checks are recorded.

## Evidence-Gated Expansion Backlog

These are not committed build tasks. Promote one item into a newly planned phase only when Phase 4/5 evidence and country safety review support it:

1. Public Swedish iOS release after Swedish safety sign-off and a successful country pilot.
2. Public Danish iOS release after Danish safety sign-off and a successful country pilot.
3. Android release after Norwegian iOS retention and payment behavior justify store/billing work.
4. Multi-child and family sharing with Supabase Auth/RLS after repeated user demand.
5. Planning, reminders, or calibration only when measured behavior identifies the specific retention or premium-value gap.

## Agent Session Guide

1. Open this roadmap and the phase's listed reference sections; do not rely on memory or summaries.
2. Select the first unchecked task in the active authorized phase and work only on that task.
3. Inspect existing code before editing, preserve unrelated changes, and treat visual decisions as provisional unless the current `docs/design.md` explicitly says otherwise.
4. Run the exact verification in the task plus the narrowest relevant automated checks; save evidence in the named file.
5. Mark the task complete only after verification passes, update the `completed/total` count, and hand off the next unchecked task and any blocker.
