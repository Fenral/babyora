# Roadmap: Babyora — UX/Motion milestone

## Overview

This roadmap first delivers the bounded, already-reviewed Planlegg candidate, then implements the owner-approved UX & Motion Bible as three dependent phases: Outfit truth, Living Home/signature transition, and final cross-surface convergence. The existing design system is evolved rather than replaced. Deterministic evidence precedes media capture; the final 90+ visual gate remains pending until the candidate is stable and the owner permits capture.

## Phases

**Phase Numbering:**

- Integer phases are planned milestone work.
- Decimal phases are reserved for urgent inserted work.

- [ ] **Phase 1: Planlegg/Dagslinjen** - Deliver the stable, truthful, capability-gated and accessible Dagslinjen candidate with deterministic checks green and the final media gate honestly pending.
- [ ] **Phase 2: Outfit truth and Antrekkskart** - Deliver the scalable body-connected garment map, ordered interaction, real alternatives and warm/cold recovery.
- [ ] **Phase 3: Living Home and signature transition** - Deliver calm weather ambience and the explanatory Home-to-Outfit garment transfer with static equivalence.
- [ ] **Phase 4: Cross-surface convergence** - Complete accessibility, theme, motion, tactile, media and 90+ UX gates across the core journey.

## Phase Details

### Phase 1: Planlegg/Dagslinjen

**Goal**: Parents receive one truthful, immediate clothing decision through a calm Dagslinje; Free is complete for supported today at one fixed home, Plus exposes only implemented future/automatic-place value plus independently approved Snart guidance, and every future drill preserves exact context. Family sharing remains the product direction but stays disabled and unclaimed until a later authorized implementation.
**Depends on**: Nothing (bounded brownfield package on the existing Babyora baseline)
**Requirements**: GOV-01, GOV-02, EVID-01, GOV-03, GOV-04, TRUTH-01, CTXT-01, UI-01, UI-02, ACCESS-01, A11Y-01, EVID-02, GOV-05, GOV-06
**Success Criteria** (what must be TRUE):

  1. A parent opening Planlegg sees a visible title and compact child/place context, one restrained I dag/Uke/Snart control, one dominant current verdict and next action, then a semantic Dagslinje containing only recommendation-changing or action-bearing moments; unchanged spans stay compact and exactly one selected event expands with a verb-led action, cause, safe garment preview, and real Outfit action when available.
  2. A Free parent receives the complete supported today-at-one-fixed-home Dagslinje plus one truthful future weather example when valid evidence exists (otherwise a neutral unavailable state), never unlocked advice; a Plus parent sees only implemented future/place/Snart capability, locked content cannot masquerade as an Outfit link, paywall claims match enabled capabilities, and closing it restores focus.
  3. Selecting a future event opens Outfit with the same immutable child/age, ISO date/time/timezone, place, activity/stroller, weather snapshot, finalized garments, planning event, and access state that produced that event; current time or weather never silently recomputes the selected result and no location history is created.
  4. Planlegg remains operable across loading, error, offline, dark/temperature themes, forced colors, 200% text, keyboard, screen reader, reduced motion, haptic preference-off, web, iOS, and Android paths with one app-owned main landmark/page scroll, 44-point targets, focus-visible, correct reading order, shape-plus-text meaning, and regression-safe four-root navigation.
  5. The reviewed stable candidate passes deterministic truth, exact-context, access, accessibility, test, lint, build, source/privacy, and no-media E2E checks on its immutable SHA through the required standard/high-risk review loop; no new app screenshot/video is captured while implementation changes, and the final physical-device/media-based 90+ visual and owner release gates remain explicitly Pending until the owner authorizes capture.

**Plans**: 2/18 plans executed

- [x] 01-01-PLAN.md
- [x] 01-02-PLAN.md
- [ ] 01-03-PLAN.md
- [ ] 01-04-PLAN.md
- [ ] 01-05-PLAN.md
- [ ] 01-06-PLAN.md
- [ ] 01-07-PLAN.md
- [ ] 01-08-PLAN.md
- [ ] 01-09-PLAN.md
- [ ] 01-10-PLAN.md
- [ ] 01-11-PLAN.md
- [ ] 01-12-PLAN.md
- [ ] 01-13-PLAN.md
- [ ] 01-14-PLAN.md
- [ ] 01-15-PLAN.md
- [ ] 01-16-PLAN.md
- [ ] 01-17-PLAN.md
- [ ] 01-18-PLAN.md

- [x] `01-01-PLAN.md` — Wave 0 deterministic fixtures and no-media verification harness
- [ ] `01-02-PLAN.md` — Wave 1 forecast provenance/currentness/coverage and atomic weather-hook behavior (high risk)
- [ ] `01-03-PLAN.md` — Wave 1 stable events, action copy, coverage rows and aggregate view model (high risk)
- [ ] `01-04-PLAN.md` — Wave 2 validated transient planned-Outfit DTO with distinct identifiers (high risk)
- [ ] `01-05-PLAN.md` — Wave 2 fail-closed exact-context resolver and trusted App/Outfit boundary (high risk)
- [ ] `01-06-PLAN.md` — Wave 3 atomic Uke/rail migration, controlled semantic Dagslinjen and exact-context E2E (entire candidate escalated to high-risk Fable; separate UI verifier)
- [ ] `01-07-PLAN.md` — Wave 4 Dagslinjen-led one-scroll Planlegg composition (standard risk)
- [ ] `01-08-PLAN.md` — Wave 5 generic runtime capability/access policy with compatibility bridge (high risk)
- [ ] `01-09-PLAN.md` — Wave 5 fail-closed single-flight RevenueCat entitlement freshness (high risk)
- [ ] `01-10-PLAN.md` — Wave 5 capability-derived paywall plus Today/Uke/App access presentation (high risk)
- [ ] `01-11-PLAN.md` — Wave 5 automatic-location storage/cache/resolver foundation (high risk)
- [ ] `01-12-PLAN.md` — Wave 5 intent-aware automatic-location integration, exact current Outfit context and E2E (high risk)
- [ ] `01-13-PLAN.md` — Wave 5 blocking Snart policy/evidence approval and climate-artifact checkpoint (non-autonomous high risk)
- [ ] `01-14-PLAN.md` — Wave 5 approved offline Snart climate decoder, pure model and immutable model candidate (high risk)
- [ ] `01-15-PLAN.md` — Wave 5 exhaustive Snart component and access-first fixed-home session orchestration (high risk)
- [ ] `01-16-PLAN.md` — Wave 5 Snart capability enablement and no-media browser regression matrix (high risk)
- [ ] `01-17-PLAN.md` — Wave 5 route-only Min garderobe → verified Snart migration using App state-router semantics (standard risk)
- [ ] `01-18-PLAN.md` — Wave 6 native haptics/navigation polish and deterministic text-only final candidate evidence (standard plus final cross-risk review)

**UI hint**: yes

### Phase 2: Outfit truth and Antrekkskart

**Goal**: Make the Outfit screen explain every recommended garment, body relationship, dressing order and safe adjustment without hiding information or overstating the avatar.
**Depends on**: Phase 1
**Requirements**: OUTFIT-01, OUTFIT-02
**Success Criteria**:

  1. Every canonical garment appears simultaneously as a numbered node and ordered row; 1–10 garments fit without `+N`, overlap or hidden nodes.
  2. Connector lines map garments to body regions and remain visible at low contrast; selected/focused node and row cross-highlight with non-color cues.
  3. Alternative actions exist only when a real engine-backed alternative exists and open a working comparison/swap surface.
  4. Warm/cold recovery is explicit, cautious and accessible without changing recommendation thresholds or activating Motor V2.
  5. Reduced motion, keyboard, screen reader, 200% text and canonical recommendation/avatar truth tests pass.

**Plans**: To be produced by Phase 2 planning after Phase 1 completion.
**UI hint**: yes

### Phase 3: Living Home and signature transition

**Goal**: Turn Home into a calm, living weather ritual and make opening Outfit visibly explain how garment anchors become the ordered recommendation.
**Depends on**: Phase 2
**Requirements**: HOME-01, MOTION-01
**Success Criteria**:

  1. Weather atmosphere responds to perceived temperature, weather and night without delaying or obscuring today's answer.
  2. Opening Outfit preserves visual continuity: matching garment anchors detach, travel and land in matching ordered rows before explanation enters.
  3. Large explanatory motion stays within the approved 900–1400 ms range; normal interactions remain approximately 180–250 ms.
  4. Reduced motion and media failure resolve immediately to an equally understandable static state with correct focus.
  5. Dark/light and cold/mild/warm states remain intentional and readable.

**Plans**: To be produced by Phase 3 planning after Phase 2 completion.
**UI hint**: yes

### Phase 4: Cross-surface convergence

**Goal**: Verify the completed core experience as one coherent, premium and accessible product before release.
**Depends on**: Phases 1–3
**Requirements**: CONV-01
**Success Criteria**:

  1. Automated tests, lint, builds, route journeys, contrast, reduced motion and large-text matrices pass on one immutable candidate SHA.
  2. VoiceOver/TalkBack, physical haptics, OS text scaling and one-handed reach are verified on physical devices.
  3. No P0 or P1 UX issue remains across onboarding, Home, Planlegg and Outfit.
  4. Owner-authorized screenshots/video support the final 90+ audit only after the candidate is stable.
  5. Owner gives the final release decision; unverified gates remain Pending rather than being inferred.

**Plans**: To be produced by Phase 4 planning after Phase 3 completion.
**UI hint**: yes

## Progress

**Execution Order:** Execute Phase 1 plans `01-01` through `01-18` strictly in order; 01-13 blocks non-autonomously while any Snart approval/evidence artifact is Pending. Then plan and execute Phases 2, 3 and 4 in dependency order.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Planlegg/Dagslinjen | 2/18 | In Progress|  |
| 2. Outfit truth and Antrekkskart | 0/TBD | Pending Phase 1 | - |
| 3. Living Home and signature transition | 0/TBD | Pending Phase 2 | - |
| 4. Cross-surface convergence | 0/TBD | Pending Phases 1–3 | - |
