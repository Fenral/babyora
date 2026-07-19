# Requirements: Babyora — Planlegg/Dagslinjen

**Defined:** 2026-07-19
**Core Value:** Give parents one truthful, immediate clothing decision; Free is today at one fixed home and Plus expands to future/everywhere/family only when those capabilities exist.

## v1 Requirements

These 14 requirements are the complete committed scope for this bounded feature package. Each maps exactly once to Phase 1.

### Governance and Contract

- [ ] **GOV-01**: Implementation stays inside the explicitly authorized Planlegg/Dagslinjen package boundary.
  - **Source intel:** `REQ-dagslinjen-authorization-boundary`
  - **Acceptance:** Work does not change clothing thresholds, guardrails, Motor V2 activation, family-sharing backend, live tracking, notification infrastructure, App Store products, pricing, RevenueCat semantics, unrelated Guide/Familie/onboarding surfaces, the design system, or avatar assets. Min Garderobe is removed only after replacement entry points work and are verified. Existing untracked docs/screenshots remain outside candidate commits unless the owner changes their status.

- [ ] **GOV-02**: The approved ingest is represented by a GSD package whose downstream plans preserve the authorized sequence, dependencies, and risk boundaries.
  - **Source intel:** `REQ-dagslinjen-gsd-bootstrap`
  - **Acceptance:** PROJECT, REQUIREMENTS, ROADMAP, and STATE are derived from the approved ingest with no unresolved locked-decision conflict. This roadmap stays one Phase 1; plan-phase must split the authorized sequential Waves 0–6 without weakening dependencies or risk lanes. Before execution, UI-SPEC and PLAN converge on hierarchy, state matrix, behavioral tests, allowed paths, non-goals, risk/model/test/evidence/rollback data, and contain no unresolved high or actionable medium review finding.

- [ ] **GOV-03**: The Dagslinjen UI and implementation contract is frozen and reviewed before app-code execution.
  - **Source intel:** `REQ-dagslinjen-contract-freeze`
  - **Acceptance:** UI-SPEC covers normal, no-change, one-change, many-change, rain, location, extreme-temperature, loading, error, offline, Free, Plus, Snart, dark, 200%-text, reduced-motion, and focus states while preserving the locked hierarchy, copy, motion, and haptic grammar. File-level plans identify allowed paths, non-goals, risk lane, model/effort, tests, candidate commit, rollback, baseline evidence, and governing-source SHAs. The current owner authorization is locked for this unchanged bounded scope; a material deviation requires renewed authorization after review.

- [ ] **GOV-04**: Standard-risk and high-risk work is isolated into separately verified immutable candidate slices.
  - **Source intel:** `REQ-risk-routed-execution`
  - **Acceptance:** Layout, component, navigation, motion, and accessibility work remains standard risk. Coverage claims, action sentences, exact future context, Free/Plus access, and Snart advice remain high risk. Each lane has a separate candidate commit and fresh independent PASS bound to its exact SHA; any edit invalidates that PASS. Missing approved high-risk verification blocks rather than downgrades the gate.

- [ ] **GOV-05**: Execution and review proceed one wave at a time through an immutable evidence and gap-closure loop.
  - **Source intel:** `REQ-dagslinjen-review-loop`
  - **Acceptance:** Each executor produces focused evidence and an atomic candidate commit. Independent code, work, and UI verification review that exact SHA. A gap creates a gap plan, new SHA, and repeated independent review. Continued verifier disagreement after one unsuccessful repair cycle escalates to the owner and is never auto-approved.

- [ ] **GOV-06**: Authority for scope, implementation, verification, human evidence, and phase closure remains explicit and separated.
  - **Source intel:** `REQ-dagslinjen-approval-ownership`
  - **Acceptance:** The owner controls scope, material changes, exceptions, and release. Plan/UI checkers approve planning completeness only. Executors cannot PASS their own work. Fresh standard and approved high-risk verifiers PASS exact immutable SHAs; adversarial external review does not self-fix and approve the same candidate. A human attests required physical behavior, and GSD blocks closure when required evidence is absent.

### Truth and Exact Context

- [ ] **TRUTH-01**: Dagslinjen derives a truthful presentation model containing only evidence-supported recommendation changes without modifying recommendation rules.
  - **Source intel:** `REQ-truthful-planning-model`
  - **Acceptance:** Events use stable ISO timestamp identity; keep added and removed garments distinct; support add, remove, swap, rain, location, and preparation actions; carry plain-language weather cause and destination context; and generate verb-led actions without leading with `+N`. Coverage distinguishes contiguous hourly data from samples, and hour/day/same-outfit-until claims require evidence. Passive weather-only change creates no clothing marker. Tests cover change cardinality, action types, coverage, ordering, duplicate fingerprints, DST, Europe/Oslo, and safe loading/error/offline output.

- [ ] **CTXT-01**: Opening a future Dagslinjen event renders that event's exact immutable Outfit context.
  - **Source intel:** `REQ-exact-future-outfit-context`
  - **Acceptance:** One immutable payload carries child/age inputs, ISO date/time and timezone, place label and coordinates without location history, activity and stroller mode, weather snapshot, finalized recommendation, planning event ID, and access state. Outfit does not recompute from current time or current weather when this payload exists. Deterministic end-to-end evidence proves date, place, activity, temperature, and garments all belong to the selected event, followed by independent high-risk review of the exact SHA.

### Interface and Access

- [ ] **UI-01**: Dagslinjen renders as one accessible semantic ordered list with exactly one expanded selected recommendation-changing event.
  - **Source intel:** `REQ-semantic-dagslinjen`
  - **Acceptance:** The component is controlled by `selectedEventId`, `onSelect`, and `onOpenOutfit`; unchanged spans are static list items; marker shape and verb text carry meaning beyond color; and real time values are emitted. The expanded row shows one action, cause, at most three safe garment thumbnails, and `Se hele antrekket` when needed. It preserves `aria-expanded`, focus, 44-point targets, large-text reflow, forced colors, calm 200–280 ms motion, immediate reduced-motion state, and exactly one light haptic per expansion.

- [ ] **UI-02**: Dagslinjen is the dominant Planlegg composition on the existing temperature-reactive canvas.
  - **Source intel:** `REQ-planlegg-screen`
  - **Acceptance:** The app owns the only `main` landmark and vertical page scroll. Planlegg shows a visible title, compact child/place context, restrained I dag/Uke/Snart control, current verdict and next action before the rail, and secondary forecast disclosure. The mega-card, repeated white event cards, duplicate hourly list, burden pills, dead place/bell controls, and persistent bottom-tab touch outline are absent. Accessible loading, error, and offline states remain, and the 390×844 matrix plus shared-navigation regressions pass.

- [ ] **ACCESS-01**: Free retains the complete supported today-at-home Dagslinje while Plus and Snart expose only implemented, capability-backed value.
  - **Source intel:** `REQ-free-plus-snart`
  - **Acceptance:** Free receives the complete today-at-one-fixed-home experience and one truthful future example without unlocked advice. Plus receives only implemented future days and places; family/everywhere claims remain absent until their capability flags are enabled. Locked content is not an Outfit link; closing the paywall restores focus; paywall claims map only to enabled capabilities. Snart deterministically groups cautious 4–6 week must-have, nice-to-have, and not-yet guidance; size wording remains probabilistic and `har allerede` lightweight. Former wardrobe routes move only after verified replacements exist. Advice, access, entitlement, and location changes remain separately verified high-risk slices.

- [ ] **A11Y-01**: Planlegg has complete native interaction, accessibility, contrast, large-text, motion, haptic, and shared-navigation behavior.
  - **Source intel:** `REQ-native-polish`
  - **Acceptance:** View/date changes use selection haptic and event expansion one light haptic; preference-off and web paths are safe no-ops. Focus uses `focus-visible`. Active bottom navigation uses a stronger/filled icon, stronger label, and quiet mint pool without permanent outline. Light, dark, cold, mild, and warm contrast passes; 200% text has no clipping or horizontal page scroll; screen-reader order is title, context, view control, verdict, rail; reduced motion resolves immediately; all four root screens retain correct shared navigation.

### Evidence and Release Gates

- [ ] **EVID-01**: New app screenshot/video capture is deferred while implementation changes, without recording the visual gate as passed.
  - **Source intel:** `REQ-deferred-visual-capture`
  - **Acceptance:** In-progress work may use DOM assertions, component tests, accessibility checks, and browser interaction without persisted visual media. No new app screenshots or video are captured during changing implementation. The media-based visual gate remains explicitly `Pending` and can begin only after a stable candidate exists and the owner grants permission.

- [ ] **EVID-02**: The stable candidate has deterministic independent evidence, while final media, physical-device, 90+, and release approval remain gated honestly.
  - **Source intel:** `REQ-dagslinjen-release-evidence`
  - **Acceptance:** Current/future copy matches evaluated data coverage; exact future context, Free/Plus boundaries, one-main/one-scroll structure, and dominant Dagslinjen hold. Truth, context, access, accessibility, tests, lint, build, audit, and deterministic E2E checks pass on the final candidate SHA and clean checkout using fixtures that freeze 390×844, Europe/Oslo, clock, forecast, child, and entitlement. No truth, entitlement, safety, accessibility, P0, or P1 failure remains. VoiceOver/TalkBack, text scaling, haptics, one-handed use, and visual fit still require final physical-device evidence. Deterministic screenshots/video and the 90+ visual score remain `Pending` until the candidate is stable and the owner authorizes capture; the package cannot claim final release completion before those gates pass.

## v2 Requirements

None inside this bounded package. Unavailable family sharing, calibration, notifications, widgets, and other whole-app capabilities require their own implementation, capability enablement, authorization, and roadmap update before they may be promised.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Clothing-rule, threshold, guardrail, or Motor V2 changes | Dagslinjen consumes finalized recommendations; it does not alter the engine. |
| Family backend, live tracking, notification infrastructure, widgets, or calibration | Unrelated whole-app capabilities are outside this feature package. |
| App Store products, pricing, or RevenueCat semantic changes | Commercial configuration is not authorized here. |
| Unrelated Guide, Familie, onboarding, design-system, or avatar work | Only required Planlegg and shared-navigation integration is in scope. |
| Wardrobe-photo ingestion or wardrobe registration as a core feature | Explicit product non-goal. |
| Premature Min Garderobe removal | Removal waits for working, verified replacement entry points. |
| New app screenshots/video during changing implementation | Capture waits for a stable candidate and explicit owner permission. |
| Adding existing untracked docs/screenshots to candidate commits | Their repository status is preserved unless the owner changes it. |

## Definition of Done

- **Developer candidate:** A stable Planlegg candidate exists and deterministic truth, exact-context, access, accessibility, test, lint, build, audit, and E2E checks are green on the reviewed immutable SHA.
- **Final visual/release gate:** Remains `Pending` until the stable candidate exists, the owner permits new app screenshot/video capture, the media-based 90+ audit and required physical-device evidence pass, and the owner approves release.
- A requirement becomes Complete only after its implementation, exact-SHA verification, and required evidence are recorded; owner-authorized deferral must never be represented as a PASS.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GOV-01 | Phase 1 | Pending |
| GOV-02 | Phase 1 | Pending |
| GOV-03 | Phase 1 | Pending |
| GOV-04 | Phase 1 | Pending |
| GOV-05 | Phase 1 | Pending |
| GOV-06 | Phase 1 | Pending |
| TRUTH-01 | Phase 1 | Pending |
| CTXT-01 | Phase 1 | Pending |
| UI-01 | Phase 1 | Pending |
| UI-02 | Phase 1 | Pending |
| ACCESS-01 | Phase 1 | Pending |
| A11Y-01 | Phase 1 | Pending |
| EVID-01 | Phase 1 | Pending |
| EVID-02 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0 ✓
- Duplicate mappings: 0 ✓

---
*Requirements defined: 2026-07-19*
*Last updated: 2026-07-19 after roadmap traceability mapping*
