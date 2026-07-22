# Phase 01 Research: Planlegg / Dagslinjen

**Phase:** `01-planlegg-dagslinjen`
**Research date:** 2026-07-19
**Mode:** Read-only codebase and product-contract research
**Confidence:** High for the current repository; runtime confidence is limited to the focused tests listed below
**Media status:** New app screenshots and video are intentionally deferred

## Summary

Phase 01 should be implemented as a truth-and-context refactor first and a visual composition refactor second. The repository already contains useful foundations—finalized clothing recommendations, 48 hourly weather points, centralized capability decisions, a planning rail prototype, shared design tokens, and native haptics—but the current Planlegg screen samples only four hours, conflates visible clothing changes with weather fingerprints, loses the exact future context when Outfit opens, duplicates the rail with a second hourly list, and spreads access behavior across more than one contract. [VERIFIED: codebase — `src/screens/UkeScreen.tsx`, `src/lib/planning/change-events.ts`, `src/App.tsx`, `src/lib/access/capabilities.ts`]

The recommended implementation boundary is therefore:

1. Freeze the contract and establish deterministic, non-media verification.
2. Build an evidence-aware planning presentation model without changing the recommendation engine.
3. Carry one immutable future context into Outfit and prevent current-weather recomputation.
4. Make Dagslinjen one controlled, accessible ordered list and the dominant Planlegg composition.
5. Apply capability-backed Free/Plus behavior, keeping unavailable claims hidden.
6. Finish native polish, accessibility, haptics, and shared navigation behavior.

This ordering matches the approved product direction: **Free = today at one fixed home; Plus = future, everywhere, and shared with family**, while not claiming family/everywhere functionality that the current capability flags do not actually enable. [VERIFIED: governing sources — `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/phases/01-planlegg-dagslinjen/01-EDGE-REQUIREMENTS.json`; codebase — `src/lib/premium/plus-features.ts`]

No new package is needed. The existing React, TypeScript, Vitest, Playwright, Motion, Capacitor, and haptic dependencies are sufficient. [VERIFIED: codebase — `package.json`]

## Architectural Responsibility Map

| Responsibility | Current owner | Current condition | Phase 01 direction |
|---|---|---|---|
| Root navigation and drill-in | `src/App.tsx` | App owns the main landmark and root scroll, but the Outfit drill payload contains no exact future context. | Preserve App as the single shell owner; add one typed transient planned-outfit payload and origin restoration. |
| Planlegg composition | `src/screens/UkeScreen.tsx` | Nested `main`, its own `100dvh`/inner scroll, four sampled hours, duplicate rail/list, dead controls. | One section-based page inside App's `main`; Dagslinjen dominant; forecast secondary; no nested page scroll. |
| Recommendation truth | Legacy `recommend` flow plus `applySwapsFinalized` | This is the production path; Motor V2 is not enabled. | Consume finalized outputs only; do not change thresholds, guardrails, swaps, or engine activation. |
| Change derivation | `src/lib/planning/change-events.ts` | Hour-only IDs, fingerprint-driven empty swaps, no explicit preparation event, swap loses from/to. | Stable ISO event IDs, separate added/removed garments, evidence-aware coverage and visible-delta-only clothing events. |
| Action language | `src/lib/planning/change-sentence.ts` | Can emit `+N til`; swap lacks source/destination. | Deterministic verb-led Norwegian, no hidden garment count, truthful from/to and cause. |
| Rail row model | `src/lib/planning/rail-rows.ts` | Claims “hele dagen” without proving coverage; hour-only identity. | Coverage-aware unchanged spans, ISO boundaries, deterministic ordering/deduplication. |
| Dagslinjen UI | `src/components/planning/PlanChangeRail.tsx` | Each marker owns expansion state, so multiple may open; incomplete details/CTA; invalid direct child inside `ol`. | Controlled selection with exactly one expanded change event and semantic `li` children. |
| View selection | `src/components/controls/SegmentedControl.tsx` and local Uke buttons | Shared native radio control exists; current Uke view uses custom buttons. | Reuse native radio semantics and raise every visual target to at least 44 points. |
| Capability decisions | `src/lib/access/capabilities.ts` | Central `decideAccess()` exists. | Treat it as the presentation-access source of truth; test each capability independently. |
| Product availability | `src/lib/premium/plus-features.ts` | Future plan, auto-location, and extra children are true; family sharing and personal calibration are false. | Render only capability-backed claims; do not imply family sharing exists. |
| Runtime entitlement | `src/lib/premium/use-access.ts`, RevenueCat integration | Client entitlement state exists; loading is currently ignored in `UkeScreen`. | Model loading/error/free/plus explicitly; never render unlocked advice during unknown state. |
| Weather evidence | `src/hooks/useWeather.ts`, `src/lib/met-no/client.ts` | 48 hourly and ten daily forecast points; cache age is internal and not surfaced to UI. | Add scoped currentness/source metadata or amend the allowed paths so truthful offline copy can be produced. |
| Outfit rendering | `src/screens/PaakledningScreen.tsx` | Optional context-like props exist but current weather still drives visible temp/condition unless the flow is redesigned. | Add one immutable planned context branch; do not recompute a selected future event. |
| Haptics | `src/hooks/useHaptics.ts`, `src/lib/haptics/system.ts` | Native/web no-op foundation exists, but reduced motion currently suppresses haptics. | Make motion and haptic preferences independent; one light expansion haptic and selection haptic only. |
| Shared bottom navigation | `src/components/BottomTabBar.tsx` | Focus state is stored on any focus and can leave a persistent outline after touch. | Use CSS `:focus-visible`; retain active fill, stronger label, and quiet mint pool. |
| Design system | `src/styles/design-tokens.css` | Existing dark temperature-reactive canvas, surfaces, type, focus and timing tokens. | Extend only semantic/scoped Planlegg tokens; do not replace the palette or design system. |

[VERIFIED: codebase — all paths and behaviors in the table were inspected directly]

## Phase Requirements

<phase_requirements>

| ID | Requirement | Research finding and implementation consequence |
|---|---|---|
| GOV-01 | Authorized package boundary | The required UI can be delivered in Planlegg, planning-domain helpers, App drill state, Outfit's planned-context branch, shared segmented control/navigation/haptics, and scoped tests. Recommendation thresholds, Motor V2, pricing, RevenueCat semantics, backend/family infrastructure, Guide, onboarding, and avatar assets must remain untouched. Preserve the three unrelated untracked documentation/media paths. [VERIFIED: governing sources and `git status`; codebase paths inspected] |
| GOV-02 | GSD package preserves order/risk boundaries | The approved implementation plan already separates high-risk truth/context/access work from standard-risk composition/a11y work. Downstream plans must retain this split and resolve all high/actionable-medium review findings before execution. [VERIFIED: `docs/superpowers/plans/2026-07-19-planlegg-dagslinjen-gsd-implementation-plan.md`, `docs/PROSESS-PLAN-TIL-KODE.md`] |
| EVID-01 | No new app media during change | Existing `scripts/verify-browser-uke.mjs` calls `page.screenshot()` and must not be run in implementation waves. Use Vitest plus non-media Playwright DOM/keyboard/focus assertions. The media visual gate stays Pending until a stable candidate and owner permission. [VERIFIED: codebase — `scripts/verify-browser-uke.mjs`; governing edge requirement] |
| GOV-03 | Freeze reviewed UI/implementation contract | `01-UI-SPEC.md` names the needed loading, error, offline, access, large text, motion, focus, temperature and cardinality states. The detailed plan must add exact files, commands, evidence, rollback, and base/candidate SHAs before changing app code. [VERIFIED: `.planning/phases/01-planlegg-dagslinjen/01-UI-SPEC.md`, process docs] |
| GOV-04 | Separate immutable risk slices | `change-events`, coverage, future context, access, and Snart are high-risk because they can create false advice or access leakage. Composition, motion, navigation, and styling are standard-risk. Do not combine their candidate commits or verification records. [VERIFIED: governing plan/process classification] |
| TRUTH-01 | Truthful Dagslinjen presentation model | Current event derivation violates this requirement through hour-only identities, fingerprint-triggered empty swaps, lossy swap representation, and unsupported whole-day claims. A new pure model must consume finalized recommendation snapshots plus explicit coverage/currentness evidence and emit stable ISO event/row data. [VERIFIED: codebase — `src/lib/planning/change-events.ts`, `change-sentence.ts`, `rail-rows.ts`] |
| CTXT-01 | Exact immutable future Outfit context | Current Uke row navigation calls `onOpenSheet()` without a payload; `App.tsx` stores only a generic Outfit drill; `PaakledningScreen` reads current weather. Add a readonly planned-context type carrying child/age inputs, ISO instant/timezone, place/coordinates, activity/stroller mode, weather snapshot, finalized recommendation, event ID, and access state. [VERIFIED: codebase — `src/screens/UkeScreen.tsx`, `src/App.tsx`, `src/screens/PaakledningScreen.tsx`] |
| UI-01 | One controlled accessible Dagslinjen | Current marker-local state allows multiple expanded markers. Refactor `PlanChangeRail` to receive `selectedEventId`, `onSelect`, and `onOpenOutfit`; render only `li` children in its `ol`; make unchanged spans static; expose `aria-expanded`, deterministic focus, verb/cause/context, up to three thumbnails and one truthful action. [VERIFIED: codebase — `src/components/planning/PlanChangeRail.tsx`; UI contract] |
| UI-02 | Dominant native Planlegg composition | `UkeScreen` currently owns a nested `main`, `100dvh`, inner vertical scroll, large/repeated cards, duplicate hourly list, and inert city/bell controls. Remove these and keep App's `main` as sole landmark/scroll owner. Preserve the temperature-reactive canvas and make forecast secondary. [VERIFIED: codebase — `src/screens/UkeScreen.tsx`, `src/App.tsx`, `src/styles/design-tokens.css`] |
| ACCESS-01 | Free/Plus capability truth | `decideAccess()` can express Free today-home and Plus future behavior, but `UkeScreen` ignores entitlement loading and the Snart module does not exist. Keep complete supported today-home content Free, expose only a non-interactive truthful future example when locked, and keep Snart/family claims hidden until their implementations and flags exist. [VERIFIED: codebase — access/premium files and absence search for Snart implementation] |
| A11Y-01 | Native interaction/a11y/haptic/navigation | Native radio semantics are available in `SegmentedControl`; its labels need 44-point targets. Bottom nav must move to `:focus-visible`. Haptic and reduced-motion preferences must be independent. Browser tests can verify semantics, keyboard, focus, one main and no horizontal scroll; physical screen-reader and haptic behavior remains human Pending. [VERIFIED: codebase — segmented control, bottom bar, haptic files, design tokens] |
| EVID-02 | Independent deterministic stable-candidate evidence | Existing focused planning/access tests pass, but no exact-context, coverage/DST, screen composition, entitlement-state or Planlegg E2E suite exists. Add frozen fixtures and non-media assertions; then run full test/lint/build/security/audit on a clean immutable SHA. Device behavior, new media, 90+ score, and release approval remain Pending. [VERIFIED: test inventory and focused runtime execution] |
| GOV-05 | One wave at a time, atomic evidence | The file boundaries below support atomic commits and independent re-verification. A failing or incomplete wave produces a gap plan/new SHA rather than opportunistic edits in the verifier step. [VERIFIED: process docs] |
| GOV-06 | Separated authority | The executor can produce tests and evidence but cannot issue the independent PASS for its own candidate. Exact-SHA code/work/UI verification must be performed by fresh approved verifiers; humans attest physical-device behavior and authorize later media. [VERIFIED: process docs and edge requirements] |

</phase_requirements>

## Project Constraints That Must Survive the Refactor

- Free remains a complete answer for today at one fixed home; Plus extends time/place/family but must not make Free unsafe or incomplete. [VERIFIED: `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`]
- Phase 01 remains within the current v1 age range of 0–24 months. Extending the motor to six years is outside this phase. [VERIFIED: `AGENTS.md`, `.planning/PROJECT.md`]
- The production engine stays on the existing legacy recommendation path followed by finalized safety swaps. Motor V2 flags remain unchanged. [VERIFIED: `src/screens/UkeScreen.tsx` and engine configuration inspected]
- Clothing thresholds, weather guardrails and safety copy are inputs, not redesign material. The new timeline may explain an existing finalized change; it may not invent a recommendation. [VERIFIED: authorized scope and UI spec]
- No family-sharing backend, live child tracking, notification infrastructure, pricing/product changes, or new analytics payload is authorized. [VERIFIED: edge requirements]
- The current design system is the source system. Phase 01 may add semantic or Planlegg-scoped aliases; it may not introduce a replacement palette, typography system, or unrelated avatar work. [VERIFIED: UI spec and `src/styles/design-tokens.css`]
- App owns the sole `main` landmark and page scroll. Each screen is content inside that shell. [VERIFIED: `src/App.tsx`, `src/styles/design-tokens.css`, UI spec]
- Do not touch or stage `docs/MARKETING-PLAN-2026.md`, `docs/screenshots/`, or `docs/store-assets-2026/`. [VERIFIED: current `git status` and task constraint]

## Existing Stack and Tool Availability

| Tool/runtime | Verified version or status | Phase use |
|---|---|---|
| Node.js | `v24.14.1` | Scripts, Vite, Vitest, Playwright automation. |
| npm | `11.11.0` | Existing lockfile/package scripts only. |
| React | `19.2.6` | Existing component model; no new UI framework. |
| TypeScript | `6.0.2` | Strict typed planning/context contracts. |
| Vite | `8.0.12` | Build and local browser verification. |
| Vitest | `4.1.8` | Pure planning, context, access and state-model tests. |
| Playwright | `1.60.0` | Non-media DOM, keyboard, focus and layout assertions. |
| Capacitor | `8.3.4` | Native shell and haptics. |
| Claude Code | `2.1.112` | Available for an external plan/code review role if assigned. |
| Codex desktop/current session | Available | Planning/research/implementation role; desktop task can coordinate fresh verifier roles. |
| Codex CLI | Executable found, but invocation returned access denied | Do not depend on CLI for a required gate; use desktop/current-session or another approved reviewer. |
| Browser runtime | Installed Playwright browser cache found | Non-media E2E is feasible. |

[VERIFIED: local runtime commands and `package.json`; no external lookup]

No package installation is recommended. The present Node test environment does not include a DOM test runner or Testing Library, so pure behavior should be factored into testable functions and real interaction should be verified through the existing Playwright/browser path. [VERIFIED: codebase — Vitest configuration/package inventory]

## Current Baseline: Exact Symbols and Gaps

### Planning truth model

`PlanPoint` currently carries `hour`, `fingerprint`, `orderedGarments`, `equipment`, `feelsLikeC`, and `symbolCode`. `ChangeKind` is limited to `add | remove | rain | swap | location`, and `ChangeEvent` carries only one `garments` list. [VERIFIED: `src/lib/planning/change-events.ts`]

Consequences:

- `hour` is not a stable identity across dates, DST repetitions, place changes, or forecast refreshes.
- A fingerprint change can produce an empty `swap` even if visible garments did not change, violating the “passive weather-only changes create no marker” requirement.
- `swap` cannot state what is removed and what is added.
- There is no preparation action, evidence interval, destination context, or source cause.
- The sentence helper limits listed garments to three and adds `+N til`, which hides part of the required action.

[VERIFIED: `src/lib/planning/change-events.ts`, `src/lib/planning/change-sentence.ts`]

`buildRailRows(startHour, endHour, events)` emits an “unchanged whole day” row whenever no events exist, even though the inputs do not prove full forecast coverage or currentness. Its labels and keys are hour-based. [VERIFIED: `src/lib/planning/rail-rows.ts`]

### Screen and navigation model

`UkeScreen` creates four `todayHourSlots` around midday (`-6`, `-2`, `+2`, `+6`) and calls this “Time for time.” It builds recommendations through the production legacy/finalized path, but its timeline cannot truthfully describe unsampled intervals. [VERIFIED: `src/screens/UkeScreen.tsx`]

The same screen renders both `PlanChangeRail` and a repeated hourly recommendation list. It also renders a nested `main`, a `100dvh` shell, an inner `overflowY: auto` area, and city/bell controls without a product action. These conflict with the one-main/one-scroll and dominant-Dagslinjen contract. [VERIFIED: `src/screens/UkeScreen.tsx`, `src/App.tsx`]

`PlanChangeRail` stores expansion state inside each `ChangeMarker`, so multiple markers can be expanded. Its ordered list contains a direct decorative `span` sibling rather than only `li` children; event times lack a machine-readable date/time; and expanded content has no exact context, cause, deterministic thumbnail rule or Outfit action. [VERIFIED: `src/components/planning/PlanChangeRail.tsx`]

### Exact future context

The existing `Phase` object in `UkeScreen` contains date/hour/recommendation/engine input but not a complete immutable weather/place/access payload. Selecting a future row calls a no-argument `onOpenSheet()`. `App.tsx` then stores only `{ kind: 'paakledning' }`. [VERIFIED: `src/screens/UkeScreen.tsx`, `src/App.tsx`]

`PaakledningScreenProps` has optional `location`, `temp`, `condition`, and `recommendation` fields, but the component still obtains current `useWeather()` data and derives visible weather context from it. Supplying a future recommendation alone therefore does not prove that date, place, temperature, activity and garments remain the selected event's exact snapshot. [VERIFIED: `src/screens/PaakledningScreen.tsx`]

### Access and product truth

`decideAccess()` is an existing centralized capability decision contract and should be extended/tested rather than replaced with screen-local checks. `PLUS_FEATURE_AVAILABILITY` currently reports `future_plan`, `automatic_location`, and `extra_children` as available, while `family_sharing` and `personal_calibration` are false. [VERIFIED: `src/lib/access/capabilities.ts`, `src/lib/premium/plus-features.ts`]

`UkeScreen` consumes access state but does not render a separate loading/unknown entitlement state. There is no current `Snart` domain module or deterministic must-have/nice-to-have/not-yet advice implementation. Therefore, Snart must remain hidden/disabled until its own model and tests exist; it cannot be enabled by copy alone. [VERIFIED: codebase inspection and repository search]

### Weather, timezone and offline evidence

`useWeather()` exposes 48 hourly forecast points and ten daily points at a reference hour. The MET client has a one-hour cache, but `WeatherState` does not expose `fetchedAt`, data source, staleness or offline-cache status. Formatting/grouping uses host-local `Date` behavior rather than an explicit `Europe/Oslo` presentation contract. [VERIFIED: `src/hooks/useWeather.ts`, `src/lib/met-no/client.ts`, `src/lib/met-no/types.ts`]

The offline requirement cannot be implemented truthfully from the current public weather state alone. The detailed plan must explicitly amend the reviewed allowed-path list to include the minimal weather metadata path—most likely `src/hooks/useWeather.ts`, `src/lib/met-no/client.ts`, their types/tests—or introduce a scoped adapter with equivalent evidence. This is a required implementation-path amendment, not a product question. [VERIFIED: codebase gap against `TRUTH-01`/`UI-02`]

### Design, motion, haptics and shared navigation

The shared tokens already provide canvas/surface/text/CTA/focus/type/easing primitives. `.ba-temp-root` transitions temperature atmosphere over 600 ms; the Planlegg contract asks for a calmer scoped 280 ms atmosphere, so use a screen-scoped semantic timing rule rather than replacing global palette behavior. Global reduced-motion styles already collapse transitions effectively to an immediate end state. [VERIFIED: `src/styles/design-tokens.css`, UI spec]

`SegmentedControl` uses a native `fieldset` plus radio inputs, which is the preferred base, but the visible labels currently have a 36-point minimum height. `BottomTabBar` stores focus in React on all focus events, allowing a touch-induced persistent outline. Use a 44-point label target and CSS `:focus-visible`. [VERIFIED: `src/components/controls/SegmentedControl.tsx`, `src/components/BottomTabBar.tsx`]

`useHapticSystem` exits when reduced motion is enabled. The contract treats motion and haptic preferences as independent, so that coupling must be removed. Browser and preference-off paths must remain safe no-ops. [VERIFIED: `src/hooks/useHaptics.ts`, `src/lib/haptics/system.ts`, UI spec]

## Recommended Architecture Pattern

Use a one-way, immutable presentation pipeline:

```text
weather coverage + child/place/activity inputs
                    |
                    v
existing production recommendation + finalized swaps (unchanged)
                    |
                    v
readonly PlanSnapshot[] with ISO instant, timezone, evidence and context
                    |
                    v
pure derivePlanEvents() -> pure buildPlanRows() -> PlanViewModel
                    |                                  |
                    |                                  +--> loading/error/offline/access view state
                    v
controlled PlanChangeRail(selectedEventId)
                    |
                    v
readonly PlannedOutfitContext selected by event ID
                    |
                    v
App drill state -> PaakledningScreen planned-context branch (no recomputation)
```

[VERIFIED: recommended pattern derived from inspected boundaries and governing requirements]

### Recommended domain contracts

The exact names may vary, but the contracts should carry equivalent information:

```ts
type IsoInstant = string;

interface ForecastEvidence {
  readonly source: 'live' | 'cache';
  readonly fetchedAt: IsoInstant;
  readonly coverageStart: IsoInstant;
  readonly coverageEnd: IsoInstant;
  readonly isComplete: boolean;
}

interface PlanSnapshot {
  readonly id: string;
  readonly instant: IsoInstant;
  readonly timeZone: 'Europe/Oslo';
  readonly place: Readonly<{ label: string; lat: number; lon: number }>;
  readonly childInput: Readonly<ChildRecommendationInput>;
  readonly activity: Activity;
  readonly strollerMode: StrollerMode;
  readonly weather: Readonly<WeatherSnapshot>;
  readonly recommendation: Readonly<FinalizedRecommendation>;
  readonly evidence: ForecastEvidence;
}

interface PlanChangeEvent {
  readonly id: string;
  readonly instant: IsoInstant;
  readonly kind: 'add' | 'remove' | 'swap' | 'rain' | 'location' | 'preparation';
  readonly addedGarments: readonly GarmentRef[];
  readonly removedGarments: readonly GarmentRef[];
  readonly cause: Readonly<ChangeCause>;
  readonly destination: Readonly<PlanDestination>;
}

interface PlannedOutfitContext {
  readonly eventId: string;
  readonly instant: IsoInstant;
  readonly timeZone: 'Europe/Oslo';
  readonly place: Readonly<{ label: string; lat: number; lon: number }>;
  readonly childInput: Readonly<ChildRecommendationInput>;
  readonly activity: Activity;
  readonly strollerMode: StrollerMode;
  readonly weather: Readonly<WeatherSnapshot>;
  readonly recommendation: Readonly<FinalizedRecommendation>;
  readonly access: Readonly<AccessDecision>;
}
```

These should be structurally readonly and built once from the selected snapshot. Runtime guards should reject non-finite coordinates, invalid ISO values, unsupported timezone, missing finalized recommendations and mismatched event IDs before navigation. The payload should remain transient/in-memory and must not create location history. [VERIFIED: architecture recommendation required by `CTXT-01` and privacy boundary]

### Truth derivation rules

1. Generate a finalized recommendation for every available forecast point in the requested evidence window using the existing engine path.
2. Order by epoch instant, not localized hour text.
3. Deduplicate exact duplicate instants deterministically.
4. Compare visible finalized garment/equipment identities, not weather fingerprints alone.
5. Emit no clothing event when only weather metadata changes and the finalized outfit does not.
6. Represent swaps with separate removed and added collections.
7. Attach a plain-language cause only when evidence supports it; otherwise use a neutral deterministic cause rather than inference.
8. State “unchanged” only across a proven, contiguous evidence interval; never infer “hele dagen” from zero events alone.
9. Format display times in `Europe/Oslo`; keep ISO/epoch identity through fall-back and spring-forward DST boundaries.
10. Treat loading, error and offline/currentness as explicit view-model states, not visual decorations on assumed-current advice.

[VERIFIED: derived directly from `TRUTH-01`, current gaps and weather data shape]

### Dagslinjen component responsibilities

- `PlanleggScreen/UkeScreen`: selects view/date, resolves access/loading/offline state, owns `selectedEventId`, composes title/context/verdict/next action/rail/secondary forecast.
- `PlanChangeRail`: renders one semantic ordered list; it does not derive advice, own multiple independent expansion states, or initiate a paywall without a parent decision.
- `PlanChangeRow`: renders static unchanged spans or an interactive change row with time, marker shape, verb and non-color cause/destination.
- Expanded row: exactly one action, one cause, up to three deterministic safe thumbnails, and “Se hele antrekket” when the complete outfit exceeds what can be represented safely.
- App drill coordinator: accepts only a validated `PlannedOutfitContext`, remembers the invoking control, opens Outfit, and restores focus/scroll on close.
- Outfit: if planned context exists, renders it exclusively; otherwise retains the normal current-context path.

[VERIFIED: recommended component split against existing source and UI contract]

## Recommended Waves and File Boundaries

### Wave 0 — Contract, baseline and non-media verification plumbing

**Risk:** Governance/evidence only; no app behavior.
**Purpose:** Record base SHA, freeze approved spec/edge requirements, add or specify deterministic fixtures/commands, and explicitly forbid media scripts until the stable gate.

Candidate paths:

- `.planning/phases/01-planlegg-dagslinjen/01-UI-SPEC.md` only if a reviewed clarification is required
- `.planning/phases/01-planlegg-dagslinjen/01-EDGE-REQUIREMENTS.json`
- Detailed GSD plan/check artifacts
- `e2e/planlegg.ts` for no-media verification, if introduced as test plumbing

Do not run `scripts/verify-browser-uke.mjs`, `npm run audit:prepare`, or `npm run audit:finalize`, because those paths persist app media. [VERIFIED: scripts inspected]

### Wave 1 — Truth, coverage, timezone and currentness

**Risk:** High.
**Purpose:** Replace hour/fingerprint heuristics with ISO/evidence/finalized-visible-change semantics while leaving the engine untouched.

Primary paths:

- `src/lib/planning/change-events.ts`
- `src/lib/planning/change-sentence.ts`
- `src/lib/planning/rail-rows.ts`
- New scoped `src/lib/planning/plan-view-model.ts`
- New scoped `src/lib/planning/forecast-evidence.ts` or equivalent
- Planning unit tests
- Minimal weather currentness metadata paths and their tests, after allowed-path amendment

This candidate must be independently verified before any UI uses the new model.

### Wave 2 — Exact future context and Outfit handoff

**Risk:** High.
**Purpose:** Create the immutable planned context, select it by stable event ID, carry it through App, and render it in Outfit without current-weather recomputation.

Primary paths:

- New `src/lib/planning/planned-outfit-context.ts`
- `src/screens/UkeScreen.tsx`
- `src/App.tsx`
- `src/screens/PaakledningScreen.tsx`
- Context/runtime-guard unit tests
- Non-media exact-context E2E assertions

Verification must compare selected date, timezone, place, activity, weather and full garment identities end-to-end.

### Wave 3 — Controlled semantic Dagslinjen

**Risk:** Standard UI, consuming previously verified truth contracts.
**Purpose:** Make one controlled ordered list with exactly one expanded event and native interaction semantics.

Primary paths:

- `src/components/planning/PlanChangeRail.tsx`
- Optional small subcomponents under `src/components/planning/`
- `src/components/controls/SegmentedControl.tsx`
- Scoped component/model tests and non-media browser interaction assertions

Do not mix new recommendation/access logic into this candidate.

### Wave 4 — Planlegg composition and states

**Risk:** Standard UI.
**Purpose:** Remove nested main/inner scroll/duplicate list/dead controls, make Dagslinjen dominant, and implement loading/error/offline/large-text/temperature composition.

Primary paths:

- `src/screens/UkeScreen.tsx`
- `src/styles/design-tokens.css` for semantic/scoped aliases only
- `e2e/planlegg.ts`

This wave may expose already-verified truth/currentness state but must not change its derivation.

### Wave 5A — Access boundaries and locked future example

**Risk:** High.
**Purpose:** Resolve entitlement loading/free/plus states centrally, keep Free today-home complete, render a truthful non-interactive future example, and restore focus after paywall close.

Primary paths:

- `src/lib/access/capabilities.ts`
- `src/lib/premium/gating.ts`
- `src/lib/premium/plus-features.ts` only if an already implemented capability is being accurately exposed
- `src/lib/premium/use-access.ts`
- `src/screens/UkeScreen.tsx`
- Access tests and non-media E2E

Family-sharing and everywhere claims stay absent unless the respective capability is implemented and independently verified.

### Wave 5B — Snart deterministic guidance

**Risk:** High and separate from 5A.
**Purpose:** Only if included in Phase 01, create cautious 4–6-week deterministic guidance, probabilistic size language, and lightweight “har allerede” state before enabling the tab/capability.

Primary paths:

- New isolated `src/lib/planning/snart.ts` and tests
- `src/screens/UkeScreen.tsx`
- Access/capability tests

Do not enable Snart merely to satisfy navigation appearance. If its rule/evidence scope is not approved, keep it visibly unavailable and defer the implementation.

### Wave 6 — Native polish, haptics and shared navigation

**Risk:** Standard UI.
**Purpose:** Complete selection/expansion haptics, preference independence, focus-visible behavior, active root navigation, forced colors, large text and reduced-motion behavior.

Primary paths:

- `src/hooks/useHaptics.ts`
- `src/lib/haptics/system.ts`
- `src/components/BottomTabBar.tsx`
- `src/components/controls/SegmentedControl.tsx`
- `src/styles/design-tokens.css`
- Non-media browser/a11y assertions

Physical VoiceOver, TalkBack and haptic checks remain human Pending even after automated PASS.

## What Not to Hand-Roll

- Do not create a second clothing recommendation engine or duplicate thresholds inside planning helpers. Reuse the production `recommend` plus finalized swaps. [VERIFIED: existing production flow]
- Do not create a custom segmented accessibility pattern. Reuse the existing native radio/fieldset base. [VERIFIED: `SegmentedControl.tsx`]
- Do not create a custom focus state store. Use native focus and `:focus-visible`. [VERIFIED: current bottom-bar issue]
- Do not implement custom timezone arithmetic with hour labels. Use epoch/ISO identity and `Intl.DateTimeFormat` with explicit `Europe/Oslo` for display. [VERIFIED: DST requirement and current host-local gap]
- Do not create custom gesture scrolling or a nested page shell. App already owns the main scroll. [VERIFIED: App/design tokens]
- Do not invent an entitlement cache or bypass RevenueCat semantics. Extend the existing access/capability presentation contract only. [VERIFIED: premium/access architecture]
- Do not store future planned contexts or coordinates as history. A transient readonly drill payload is sufficient. [VERIFIED: CTXT/privacy scope]
- Do not add a screenshot library or visual-regression package. Media is deferred; existing browser automation is sufficient for non-media DOM assertions. [VERIFIED: EVID-01 and package inventory]
- Do not conflate reduced motion with disabled haptics; treat them as independent user preferences. [VERIFIED: A11Y contract]

## Common Failure Modes to Prevent

1. **Pretty but false markers:** firing a timeline event because temperature/symbol changed while finalized garments did not.
2. **False whole-day confidence:** showing “samme hele dagen” from four samples or incomplete/stale coverage.
3. **Selected-event drift:** opening Outfit with the right garments but today's date, current place or current temperature.
4. **DST identity collision:** using `hour` as key on a repeated autumn hour or skipping ordering across spring transition.
5. **Access flash:** briefly showing future advice while entitlement is loading or errors.
6. **Locked link leakage:** a Free future teaser remains interactive and reaches Outfit.
7. **Unavailable product claims:** presenting family sharing/Snart as live when capability flags or modules are absent.
8. **Multiple open events:** keeping row-local expansion state rather than one parent-selected event ID.
9. **Color-only meaning:** relying on garment-layer colors without marker shape, time and verb text.
10. **Landmark/scroll regression:** retaining Uke's nested `main`, `100dvh`, and inner `overflowY` after composition changes.
11. **Persistent touch focus:** reusing React `onFocus` visual state instead of `:focus-visible`.
12. **Motion/haptic coupling:** disabling haptics when reduced motion is on.
13. **Media policy violation:** running the stale Uke verifier or audit capture scripts during implementation.
14. **Self-approval:** treating executor test output as independent exact-SHA PASS.

[VERIFIED: each mode maps to an inspected current gap or an explicit edge requirement]

## Validation Architecture

### Current verified baseline

The following focused command was run in this repository:

```powershell
npm test -- --run src/lib/planning/__tests__ src/lib/access/__tests__/capabilities.test.ts src/lib/premium/__tests__/gating.test.ts src/lib/premium/__tests__/plus-features.test.ts
```

Result: **6 files, 52 tests passed**, Vitest runtime approximately 809 ms. [VERIFIED: local runtime execution on 2026-07-19]

This confirms only the current focused helpers/access suite. It does not verify the planned requirements, full app suite, lint, build, browser behavior, physical device behavior, or stable-candidate audit. [VERIFIED: command scope]

### Wave 0 test gaps to add before or with the owning implementation wave

| Test area | Proposed path | Minimum deterministic cases |
|---|---|---|
| Coverage/currentness | `src/lib/planning/__tests__/forecast-evidence.test.ts` | complete interval, gap, partial start/end, cache timestamp, offline cache, invalid order |
| Event truth | Extend `change-events.test.ts` | add, remove, swap from/to, rain, location, preparation, passive weather-only no-op, dedupe, deterministic order |
| Language | Extend `change-sentence.test.ts` | verb-led Norwegian, no `+N til`, full action or full-outfit fallback, cause/destination |
| Rail rows | Extend `rail-rows.test.ts` | proven unchanged span, no false whole-day claim, ISO identity, boundary coverage |
| Timezone/DST | `src/lib/planning/__tests__/timezone.test.ts` | Europe/Oslo spring gap, autumn repeated hour, cross-midnight ordering |
| View model | `src/lib/planning/__tests__/plan-view-model.test.ts` | loading, error, offline, ready, access loading, Free, Plus, empty/no-advice |
| Exact context | `src/lib/planning/__tests__/planned-outfit-context.test.ts` | immutable selected snapshot, runtime guard, current weather cannot replace selected future snapshot |
| Selection | `src/lib/planning/__tests__/selection.test.ts` | exactly one selected ID, deselect/reselect, stale selected ID after refresh |
| Access | Extend access/premium tests | today-home Free, future teaser locked/noninteractive, unknown entitlement, implemented-feature checks independently |
| Snart, only if built | `src/lib/planning/__tests__/snart.test.ts` | 4–6-week window, cautious size copy, deterministic categories, already-owned state, unavailable evidence |
| Browser interaction | `e2e/planlegg.ts` | one main, one page scroll, radio semantics, one expanded event, keyboard/focus restore, locked teaser, exact Outfit context, 200% text/no horizontal overflow |

[VERIFIED: gap analysis against existing test inventory]

No `page.screenshot()`, video recording, trace screenshots, or persisted visual artifacts may be configured in `e2e/planlegg.ts` during implementation. DOM geometry assertions are permitted when they do not write media. [VERIFIED: EVID-01]

### Fast feedback commands

Use these after their respective files exist:

```powershell
npx vitest run src/lib/planning/__tests__
npx vitest run src/lib/access/__tests__/capabilities.test.ts src/lib/premium/__tests__
npx eslint src/lib/planning src/components/planning src/screens/UkeScreen.tsx
```

Target: pure planning/access feedback under 30 seconds on the verified local environment. [VERIFIED: current focused suite completed in under one second; future duration is a planning target]

### Package/stable-candidate gates

On a clean checkout of the exact candidate SHA, after all implementation waves:

```powershell
npm test
npm run lint
npm run build
```

Then run the approved non-media Planlegg browser flow with frozen clock, `Europe/Oslo`, fixed forecast, child, home/place and entitlement fixtures. The existing smoke script is insufficient because it verifies onboarding/shell only. [VERIFIED: `e2e/smoke.ts` and package scripts]

Audit/security gates should run only commands that do not capture app media during implementation. Any audit command whose current behavior persists screenshots must remain Pending or be split into a no-media mode first. [VERIFIED: scripts inspected and media constraint]

### Requirement-to-evidence matrix

| Requirement | Automated evidence | Static/process evidence | Human-only/Pending |
|---|---|---|---|
| GOV-01 | Changed-path allowlist and diff checks | Scope review against edge requirements | Owner resolves requested scope expansion |
| GOV-02 | Plan schema/dependency checks where GSD supports them | Cross-review detailed plan/risk lanes | Owner escalation after unresolved repair cycle |
| EVID-01 | Assert no screenshot/video calls/config in implementation E2E | Command log excludes media scripts | Owner later authorizes stable media |
| GOV-03 | Spec/state fixture coverage audit | Frozen reviewed UI/edge contract and SHAs | Owner approval of any contract amendment |
| GOV-04 | Per-wave changed paths, tests and exact SHA | Separate evidence records | Fresh verifier PASS |
| TRUTH-01 | Pure model, coverage, language, DST and property-style fixture tests | Review no engine-rule changes | Domain reviewer if safety meaning changes |
| CTXT-01 | Unit context guard plus end-to-end selected-event equality | Trace typed payload from Uke→App→Outfit | Device spot-check later |
| UI-01 | Non-media DOM/keyboard/focus assertions | Semantic component review | Screen-reader navigation check |
| UI-02 | One-main, overflow, hierarchy-presence/absence, state fixtures | Composition review | Final visual score/media later |
| ACCESS-01 | Free/Plus/loading/error capability matrix and locked-link test | Claim/flag/module review | Store/RevenueCat device check if native entitlement is changed; it should not be in this phase |
| A11Y-01 | Axe-equivalent available checks if present, plus DOM roles, keyboard, focus-visible, 200% text geometry, reduced-motion state | Contrast token review | VoiceOver, TalkBack, physical haptic |
| EVID-02 | Full test/lint/build/non-media E2E on clean SHA | Evidence manifest and frozen fixture review | Physical device, media, 90+ score, release approval |
| GOV-05 | Immutable commit/SHA sequencing | Gap-plan records | Owner escalation when required |
| GOV-06 | Evidence records identify executor/verifier | Authority/role review | Human attestations and phase closure |

### Sampling and fixture rules

- Truth/access/context tests: every relevant implementation commit; full focused suite before handoff.
- Standard UI tests: every UI candidate commit; browser assertions after the composed screen is runnable.
- Full test/lint/build: once per immutable package candidate and after any repair SHA.
- Clean-checkout non-media E2E: package candidate and every replacement candidate.
- Physical screen reader/haptics: stable candidate only, human Pending.
- New screenshots/video and 90+ visual review: stable candidate only, owner-authorized Pending.

[VERIFIED: recommended sampling follows process/edge requirements]

## Security and Privacy Review (ASVS L1 Scope)

### Applicable areas

- **V4 Access Control:** Applicable to presentation/access boundaries. `decideAccess()` and feature availability must prevent unlocked future advice during Free/loading/error states. Native RevenueCat remains authoritative for entitlement; this phase must not redefine billing semantics. [VERIFIED: access architecture]
- **V5 Validation/Sanitization:** Applicable to the in-memory planned-context boundary. Validate finite coordinates, valid ISO instants, the supported timezone, known activity/stroller/access enum values, stable event ID, and a finalized recommendation before Outfit renders it. [VERIFIED: CTXT requirement]
- **Privacy/data minimization:** Applicable because the context contains place coordinates and child inputs. Keep the payload transient, do not create location history, do not add analytics containing coordinates/child details, and do not add persistence/backend writes. [VERIFIED: authorized scope]

### Not introduced by this phase

- No authentication/session system or server endpoint is added.
- No cryptographic design is added; do not hand-roll cryptography.
- No database/schema or family-sharing backend is added.
- No live child tracking or notification infrastructure is added.
- No App Store product, price, RevenueCat semantic, or secret handling change is added.

[VERIFIED: phase scope]

### Threats and controls

| Threat | Risk | Required control |
|---|---|---|
| Current weather overwrites selected future advice | High safety/truth risk | Readonly context built from selected event; planned Outfit branch cannot call/reconcile against current weather. |
| Free/loading user reaches unlocked future Outfit | High access/truth risk | Central capability decision before link creation and again before navigation; locked teaser has no Outfit action. |
| Event/context mismatch after forecast refresh | High truth risk | Stable event ID plus atomic snapshot selection; reject stale ID and ask user to reselect rather than silently choosing another event. |
| Forged/invalid in-memory coordinates or timestamps | Medium integrity risk | Runtime guard, finite/range checks, ISO parse, explicit timezone and known enums. |
| Coordinates become history/analytics | Medium privacy risk | Transient payload only; no localStorage, backend or analytics addition. |
| Client feature flag treated as server authorization | Medium architecture risk | Treat client access as presentation control; preserve RevenueCat authority and current purchase semantics. |
| Excess event computation/duplicate rows | Low availability risk | Bound processing to supplied forecast window, deterministic dedupe and linear/sorted derivation. |

[VERIFIED: threat model derived from current client architecture and phase contract]

## Resolved Decisions (No Open Product Questions)

- **Engine source:** Use the current production legacy recommendation plus finalized swaps; Motor V2 remains off. [RESOLVED: codebase and scope]
- **Timeline identity:** ISO/epoch identity with explicit `Europe/Oslo` display, never hour text as an ID. [RESOLVED: TRUTH-01]
- **Weather-only changes:** No clothing marker unless finalized visible advice changes. [RESOLVED: TRUTH-01]
- **Expansion:** One parent-controlled selected event; exactly one expanded change row. [RESOLVED: UI-01]
- **Future Outfit:** One immutable transient context; no recomputation from current time/weather. [RESOLVED: CTXT-01]
- **Scrolling/landmarks:** App owns the only `main` and vertical page scroll. [RESOLVED: UI-02 and current shell]
- **Free behavior:** Complete today-home Dagslinjen plus a truthful non-interactive future example; no unlocked future advice. [RESOLVED: ACCESS-01]
- **Snart:** Keep unavailable until a deterministic module and its capability evidence exist; do not simulate availability with copy. [RESOLVED: codebase absence and ACCESS-01]
- **Family/everywhere claims:** Show only implemented, flag-backed capabilities; family sharing is currently unavailable. [RESOLVED: current feature flags]
- **Haptics/motion:** Independent preferences; web/preference-off safe no-op. [RESOLVED: A11Y-01]
- **Design direction:** Preserve the existing design system and temperature canvas; apply scoped semantic refinements only. [RESOLVED: UI spec]
- **Media:** No app screenshots/video during implementation; final stable media gate remains Pending. [RESOLVED: owner instruction/EVID-01]
- **Offline truth:** Amend the detailed allowed-path plan to expose minimal cache/currentness evidence before implementing offline copy. [RESOLVED: required technical path correction]

## Sources

### Primary governing sources

- `AGENTS.md`
- `docs/CLAUDE-START-HERE.md`
- `docs/PROSESS-PLAN-TIL-KODE.md`
- `docs/CURRENT-HANDOFF.md`
- `docs/DECISION-LOG.md`
- `docs/superpowers/plans/2026-07-19-planlegg-dagslinjen-gsd-implementation-plan.md`
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/phases/01-planlegg-dagslinjen/01-UI-SPEC.md`
- `.planning/phases/01-planlegg-dagslinjen/01-EDGE-REQUIREMENTS.json`

### Primary code sources

- `src/App.tsx`
- `src/screens/UkeScreen.tsx`
- `src/screens/PaakledningScreen.tsx`
- `src/components/planning/PlanChangeRail.tsx`
- `src/components/controls/SegmentedControl.tsx`
- `src/components/BottomTabBar.tsx`
- `src/lib/planning/change-events.ts`
- `src/lib/planning/change-sentence.ts`
- `src/lib/planning/rail-rows.ts`
- `src/lib/planning/__tests__/change-events.test.ts`
- `src/lib/planning/__tests__/change-sentence.test.ts`
- `src/lib/planning/__tests__/rail-rows.test.ts`
- `src/lib/access/capabilities.ts`
- `src/lib/premium/gating.ts`
- `src/lib/premium/plus-features.ts`
- `src/lib/premium/use-access.ts`
- `src/hooks/useWeather.ts`
- `src/lib/met-no/client.ts`
- `src/lib/met-no/types.ts`
- `src/hooks/useHaptics.ts`
- `src/lib/haptics/system.ts`
- `src/styles/design-tokens.css`
- `scripts/verify-browser-uke.mjs`
- `e2e/smoke.ts`
- `.github/workflows/ci.yml`
- `package.json`

No web research was needed. The phase is governed by repository-specific product decisions and the relevant implementation facts were available in first-party local sources. [VERIFIED: research scope]

## Final Research Recommendation

Proceed to detailed planning, not app-code execution, with the six-wave structure above. The plan reviewer must specifically check: (1) the weather/currentness allowed-path amendment, (2) immutable selected-event context, (3) separation of high-risk and standard-risk commits, (4) Snart remaining unavailable until implemented, (5) the no-media verification route, and (6) fresh exact-SHA independent verification authority. Once those are explicit and review-clean, implementation can begin without reopening the product direction. [VERIFIED: synthesis of governing requirements and inspected codebase]
