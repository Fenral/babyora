# Babyora — Planlegg/Dagslinjen

## What This Is

Babyora — Planlegg/Dagslinjen is a bounded brownfield feature package inside the existing Babyora web/PWA and Capacitor app. It turns Planlegg into one calm, continuous Dagslinje that gives parents an immediate clothing decision, shows only evidence-supported recommendation changes, and opens future events in their exact saved context.

This is not a greenfield whole-app roadmap. Existing recommendation and safety rules remain authoritative; this package changes the planning presentation, context handoff, access behavior, and verification evidence only within the authorized scope.

## Core Value

Give parents one truthful, immediate clothing decision; Free is today at one fixed home and Plus expands to future/everywhere/family only when those capabilities exist.

## Business Context

- **Customer**: Parents and caregivers of children aged 0–24 months.
- **Revenue model**: Free delivers the complete supported today-at-home decision; Plus may expose future, additional-place, and family value only when the corresponding runtime capability exists.
- **Success metric**: A stable Planlegg candidate with deterministic truth, exact-context, access-boundary, and accessibility checks green; the final media-based 90+ visual gate remains pending until the owner permits new app screenshot/video capture.
- **Strategy notes**: This package follows the effective 2026-07-19 Dagslinjen decision and the current owner authorization, not superseded historical variants.

## Requirements

### Validated

- ✓ The existing React application shell provides the four Hjem, Planlegg, Guide, and Familie roots and shared drill/navigation behavior — existing brownfield baseline.
- ✓ The existing weather and contained legacy recommendation pipeline produces deterministic recommendations without requiring Motor V2 activation — existing brownfield baseline.
- ✓ The existing planning flow already derives change events and rail rows behind the Planlegg route and premium boundary — existing brownfield baseline.
- ✓ Vitest, Playwright, lint/build checks, accessibility assertions, Capacitor haptics, and iOS/Android wrappers exist as verification and runtime foundations — existing brownfield baseline.

### Active

- [ ] **GOV-01** — Keep implementation inside the explicitly authorized Dagslinjen package boundary.
- [ ] **GOV-02** — Bootstrap the approved ingest into one GSD milestone while preserving ordered wave dependencies and risk boundaries for plan-phase.
- [ ] **EVID-01** — Defer new app screenshots/video while implementation changes and keep the visual gate visibly pending.
- [ ] **GOV-03** — Freeze the UI, state, path, test, evidence, rollback, and review contract before app-code execution.
- [ ] **GOV-04** — Route standard-risk and high-risk work through separate immutable candidates and independent verification.
- [ ] **TRUTH-01** — Derive only evidence-supported recommendation-change events without changing clothing rules.
- [ ] **CTXT-01** — Preserve an exact immutable future Outfit context from Dagslinjen selection to render.
- [ ] **UI-01** — Render one semantic accessible Dagslinje with exactly one expanded selected event.
- [ ] **UI-02** — Make Dagslinjen the dominant Planlegg composition on the existing temperature-reactive canvas.
- [ ] **ACCESS-01** — Keep Free complete for supported today-at-home use and expose only implemented Plus/Snart value.
- [ ] **A11Y-01** — Complete native interaction, navigation, contrast, large-text, focus, motion, and haptic behavior.
- [ ] **EVID-02** — Produce deterministic candidate evidence now and reserve final media, physical-device, 90+, and release evidence for the authorized final gate.
- [ ] **GOV-05** — Execute and review one wave at a time with a repeatable gap-and-reverification loop.
- [ ] **GOV-06** — Preserve explicit owner, planner, executor, verifier, human-attestation, and phase-closure authority boundaries.

### Out of Scope

- Clothing thresholds, safety guardrails, recommendation semantics, or Motor V2 activation — the Dagslinjen package is a presentation/context layer over the contained current engine.
- A whole-app redesign or unrelated Guide, Familie, onboarding, notification, widget, calibration, or household/backend work — this roadmap is limited to Planlegg/Dagslinjen and required shared-navigation regressions.
- Family sharing, automatic location, additional children, or other Plus claims before their runtime capabilities are implemented and explicitly enabled — the paywall and access model must remain truthful.
- App Store products, prices, RevenueCat entitlement semantics, or commercial configuration — no commercial mutation is authorized here.
- Replacing the design system or regenerating/modifying avatar assets — existing visual foundations and verified assets are preserved.
- Wardrobe-photo ingestion or making wardrobe registration a core feature — these remain product-wide non-goals.
- Removing Min Garderobe before verified replacement entry points exist — migration/removal is conditional, not assumed.
- New app screenshots or video during changing implementation — final capture waits for a stable candidate and explicit owner permission.
- Adding the existing untracked docs/screenshots directory to candidate commits — its status remains unchanged unless the owner decides otherwise.

## Context

- The brownfield app is a TypeScript/React client-first SPA/PWA packaged through Capacitor for iOS and Android. `src/App.tsx` owns root and drill navigation; route screens compose weather, recommendation, access, and native behavior.
- The current Planlegg implementation lives in the existing planning route and already uses planning transforms under `src/lib/planning/`. This package refines that path rather than introducing a parallel planner.
- The contained legacy recommendation engine and its final safety boundary remain the visible production source. Dagslinjen may explain and compare its evaluated outputs but may not invent coverage, silently merge add/remove actions, or alter recommendation rules.
- The effective owner decision is the 2026-07-19 Dagslinjen contract: one vertical main scroll, compact child/place context, one I dag/Uke/Snart control, one dominant answer, and a semantic timeline containing only real recommendation changes. Superseded historical entries remain history only.
- The current owner authorization is locked for initializing and planning this bounded package. App-code execution remains conditioned on an unchanged reviewed contract; material scope changes, exceptions, and release still require owner authority.
- The developer-facing completion target is a stable candidate whose deterministic truth/context/access/accessibility checks are green. Final screenshot/video-based scoring is intentionally not claimed and remains pending.

## Constraints

- **Tech stack**: TypeScript 6, React 19, Vite 8 web/PWA, Capacitor 8 iOS/Android — work within the existing runtime and architecture.
- **Package boundary**: One sequential Phase 1 named Planlegg/Dagslinjen — wave and plan splitting belongs to plan-phase; `.planning/codebase/` is preserved.
- **Recommendation safety**: Presentation logic consumes finalized recommendations and must not change thresholds, guardrails, engine selection, or post-safety output.
- **Truth**: Stable ISO timestamps, Europe/Oslo/DST behavior, separate added/removed garments, real data-coverage claims, and exact future context are mandatory.
- **Product access**: Free remains complete for supported today at one fixed home; Plus/family/everywhere promises appear only when capabilities are implemented and enabled.
- **Accessibility**: One app-owned main landmark and page scroll, semantic ordered-list behavior, focus-visible, 44-point targets, contrast/forced-colors support, 200% text reflow, restrained haptics, and immediate reduced-motion state are required.
- **Verification**: Standard and high-risk slices use separate immutable candidate SHAs and fresh independent review; edits invalidate prior PASS evidence.
- **Visual capture**: DOM, component, accessibility, and browser assertions are allowed during implementation. No new app screenshot/video is captured until the candidate is stable and the owner grants permission; the media-based 90+ gate remains Pending until then.
- **Privacy**: Exact context may contain a place label and coordinates for the chosen event but must not create location history or imply child tracking.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Planlegg is one calm continuous Dagslinje, not a card dashboard | The parent should see one dominant answer and only recommendation-changing or action-bearing moments | Locked |
| The owner authorizes initialization and planning of this bounded package | This turn supplies the required owner authority while preserving review, material-change, exception, and release gates | Locked |
| The roadmap contains one sequential Phase 1: Planlegg/Dagslinjen | This is a bounded brownfield feature package; wave/plan decomposition belongs to plan-phase | Locked |
| Free is complete today at one fixed home; Plus expands only through implemented capabilities | Access and paywall copy must never outrun runtime truth | Locked |
| Dagslinjen is a presentation/context layer over the contained legacy engine | Clothing thresholds, guardrails, and Motor V2 activation are outside this package | Locked |
| New app screenshot/video capture waits for a stable candidate and owner permission | Changing implementation may use deterministic DOM/component/a11y/browser assertions without falsely passing the visual gate | Locked |
| Developer candidate success and final visual release approval are separate gates | Deterministic truth/context/access/a11y can go green while the media-based 90+ gate honestly remains Pending | Locked |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-19 after ingest-derived initialization*
