# Requirements

## REQ-dagslinjen-authorization-boundary
- source: docs/superpowers/plans/2026-07-19-planlegg-dagslinjen-gsd-implementation-plan.md
- description: Treat the Dagslinjen plan as a bounded package that does not itself authorize app-code changes.
- acceptance: Implementation begins only after explicit owner authorization. The package does not change clothing thresholds, guardrails, Motor V2 activation, family sharing/backend, live tracking, notification infrastructure, App Store products, pricing, RevenueCat semantics, unrelated Guide/Family/onboarding surfaces, the design system, or avatar assets. Min Garderobe is not removed until replacement entry points work and are verified, and the existing untracked docs/screenshots directory remains outside candidate commits unless the owner changes its status.
- scope: implementation authorization, package boundary, non-goals

## REQ-dagslinjen-gsd-bootstrap
- source: docs/superpowers/plans/2026-07-19-planlegg-dagslinjen-gsd-implementation-plan.md
- description: Establish GSD planning artifacts and a Planlegg/Dagslinjen milestone before coding.
- acceptance: The checked-in ingest manifest is used through the document-ingest workflow, document selection is approved, and unresolved locked-decision conflicts stop routing. The resulting milestone preserves the sequential Waves 0-6, dependencies, and risk boundaries even if routing creates multiple phases. Before execution, UI-SPEC and PLAN converge on the locked hierarchy, state matrix, behavioral TDD, allowed paths, non-goals, risk/model/test/evidence/rollback data, and no unresolved high or actionable medium review finding.
- scope: GSD ingest, milestone creation, plan convergence

## REQ-deferred-visual-capture
- source: docs/superpowers/plans/2026-07-19-planlegg-dagslinjen-gsd-implementation-plan.md
- description: Defer new screenshots and video while the implementation is changing without treating visual verification as passed.
- acceptance: In-progress waves may use DOM assertions, component tests, accessibility checks, and browser interaction without persisted visual media. The visual gate is recorded as pending. Deterministic screenshots, video evidence, and final 90-plus visual PASS occur only after a stable candidate exists.
- scope: evidence timing, visual verification

## REQ-dagslinjen-contract-freeze
- source: docs/superpowers/plans/2026-07-19-planlegg-dagslinjen-gsd-implementation-plan.md
- description: Freeze the Dagslinjen UI and implementation contract before app-code work begins, and require explicit owner authorization after plan review.
- acceptance: UI-SPEC covers normal, no-change, one-change, many-change, rain, location, extreme-temperature, loading, error, offline, Free, Plus, Soon, dark, 200-percent-text, reduced-motion, and focus states. It preserves the locked hierarchy, copy, motion, and haptic grammar. File-level plans identify allowed paths, non-goals, risk lane, model/effort, tests, candidate commit, rollback, baseline evidence, and governing source SHAs. GSD plan review and independent external review have no unresolved high or actionable medium findings before owner authorization.
- scope: GSD bootstrap, UI specification, pre-implementation gate

## REQ-risk-routed-execution
- source: docs/superpowers/plans/2026-07-19-planlegg-dagslinjen-gsd-implementation-plan.md
- description: Execute Dagslinjen work in separate standard-risk and high-risk candidate slices with independent verification.
- acceptance: Layout, component, navigation, motion, and accessibility work remains standard risk. Coverage claims, action sentences, exact future context, Free/Plus access, and Snart advice remain high risk. Standard and high-risk changes use separate candidate commits; each PASS is tied to an immutable SHA from a fresh verifier context, and any edit invalidates the prior PASS. Missing an approved high-risk verifier blocks rather than downgrades the gate.
- scope: risk lanes, candidate commits, independent verification

## REQ-truthful-planning-model
- source: docs/superpowers/plans/2026-07-19-planlegg-dagslinjen-gsd-implementation-plan.md
- description: Build a presentation-layer planning model that expresses only evidence-supported recommendation changes without modifying recommendation rules.
- acceptance: Events use stable ISO timestamp identity, preserve separate added and removed garments, support add/remove/swap/rain/location/prep, carry a plain-language weather cause and destination context ID, and generate verb-led actions. Additional detail never leads with +N. Coverage distinguishes contiguous hourly data from samples; hour/day/same-outfit-until claims require evidence. Weather-only changes create no clothing marker. Tests cover change cardinality, action types, coverage, ordering, duplicate fingerprints, DST, Europe/Oslo, and safe loading/error/offline output.
- scope: planning view model, coverage truth, change events

## REQ-exact-future-outfit-context
- source: docs/superpowers/plans/2026-07-19-planlegg-dagslinjen-gsd-implementation-plan.md
- description: Opening a future planning event must preserve and render that event's exact Outfit context.
- acceptance: One immutable payload carries child and age inputs, ISO date/time and timezone, place label and coordinates without location history, activity and stroller mode, weather snapshot, finalized recommendation, planning event ID, and access state. Outfit does not recompute from current time or current weather when this payload exists. Deterministic E2E evidence proves date, place, activity, temperature, and garments all belong to the selected event, followed by independent high-risk review of the exact SHA.
- scope: future Outfit drill, immutable planning context, E2E

## REQ-semantic-dagslinjen
- source: docs/superpowers/plans/2026-07-19-planlegg-dagslinjen-gsd-implementation-plan.md
- description: Render Dagslinjen as one accessible semantic ordered list with one expanded recommendation-changing event.
- acceptance: The component is controlled by selectedEventId, onSelect, and onOpenOutfit; has exactly one expanded event; represents unchanged spans as static list items; uses marker shape and verb text rather than color alone; emits real time values; shows one action, cause, at most three safe thumbnails, and Se hele antrekket. It preserves aria-expanded and focus, 44-point targets, large-text reflow, forced colors, calm 200-280 ms motion, immediate reduced-motion state, and exactly one light haptic per expansion.
- scope: Dagslinjen component, semantics, accessibility, motion

## REQ-planlegg-screen
- source: docs/superpowers/plans/2026-07-19-planlegg-dagslinjen-gsd-implementation-plan.md
- description: Make Dagslinjen the dominant Planlegg composition on the existing temperature-reactive canvas.
- acceptance: App owns the only main landmark and vertical page scroll. The screen shows Planlegg, compact child/place context, a restrained I dag/Uke/Snart control, a current verdict and next action before the rail, and secondary forecast disclosure. It removes the mega-card, repeated white event cards, duplicate hourly list, burden pills, dead place/bell controls, and persistent bottom-tab touch outline. Real accessible loading, error, and offline states remain and the 390 by 844 matrix plus shared-navigation regressions pass.
- scope: Planlegg screen, composition, navigation, responsive states

## REQ-free-plus-snart
- source: docs/superpowers/plans/2026-07-19-planlegg-dagslinjen-gsd-implementation-plan.md
- description: Preserve the complete supported today-at-home experience for Free while exposing only implemented future and preparation value for Plus.
- acceptance: Free gets the complete today-at-home Dagslinje and one truthful future example, not unlocked advice. Plus gets implemented future days and places. Locked content is not an Outfit link; closing the paywall restores focus and its claims map only to enabled capabilities. Snart deterministically produces cautious four-to-six-week must-have, nice-to-have, and not-yet groups; size wording stays probabilistic, har allerede remains lightweight, and former wardrobe routes move only after replacements work. Advice, access, entitlement, and location changes remain separately verified high-risk slices.
- scope: Free/Plus entitlement, future planning, Snart, paywall truth

## REQ-native-polish
- source: docs/superpowers/plans/2026-07-19-planlegg-dagslinjen-gsd-implementation-plan.md
- description: Complete native interaction, accessibility, contrast, and shared-navigation behavior for Planlegg.
- acceptance: View/date change produces selection haptic and event expansion produces one light haptic; preference-off and web paths are safe no-ops. Focus uses focus-visible. Bottom navigation uses a filled or stronger icon, stronger label, and quiet mint pool without a permanent outline. Light, dark, cold, mild, and warm contrast passes; 200-percent text has no clipping or horizontal page scroll; screen-reader order is title, context, view control, verdict, rail; motion is restrained and immediate when reduced. Shared navigation is checked on all four roots.
- scope: native interaction, accessibility, haptics, shared navigation

## REQ-dagslinjen-release-evidence
- source: docs/superpowers/plans/2026-07-19-planlegg-dagslinjen-gsd-implementation-plan.md
- description: Close the Dagslinjen package only with deterministic, independent, physical-device, and final clean-checkout evidence.
- acceptance: Current and future copy matches evaluated data coverage; exact future context, Free/Plus boundaries, one-main/one-scroll structure, and dominant Dagslinjen all hold. Every enabled representative state scores at least 90/100, with no truth, entitlement, safety, accessibility, P0, or P1 failure. Final diff, tests, lint, build, audit, and E2E checks pass on the final SHA and clean checkout. Fixtures freeze 390 by 844, Europe/Oslo, clock, forecast, child, and entitlement. VoiceOver/TalkBack, text scaling, haptic behavior, one-handed use, and visual fit receive physical-device evidence; missing required device evidence blocks completion.
- scope: Definition of Done, deterministic verification, physical-device UAT, release gate

## REQ-dagslinjen-review-loop
- source: docs/superpowers/plans/2026-07-19-planlegg-dagslinjen-gsd-implementation-plan.md
- description: Execute and review one wave at a time, preserving the wave-specific risk gate and immutable evidence chain.
- acceptance: Each executor produces focused evidence and an atomic candidate commit; independent code, work, and UI verification review the exact candidate SHA. A gap produces a new gap plan, a new SHA, and a repeated independent review cycle. Continuing model disagreement after one unsuccessful repair cycle escalates to the owner instead of being auto-approved.
- scope: wave execution, gap closure, escalation

## REQ-dagslinjen-approval-ownership
- source: docs/superpowers/plans/2026-07-19-planlegg-dagslinjen-gsd-implementation-plan.md
- description: Preserve explicit authority boundaries for scope, implementation, verification, human evidence, and phase closure.
- acceptance: The owner authorizes scope, material changes, exceptions, and release. Plan/UI checkers approve planning completeness only. Executors cannot PASS their own work. Fresh standard and approved high-risk verifiers PASS their respective immutable SHAs; external review supplies adversarial findings without self-fixing and approving the same candidate. A human attests physical behavior, and GSD records state and blocks closure whenever required evidence is missing.
- scope: governance, approval authority, phase closure
