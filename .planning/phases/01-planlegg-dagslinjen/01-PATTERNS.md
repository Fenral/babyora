# Phase 1: Planlegg / Dagslinjen - Pattern Map

**Mapped:** 2026-07-19
**Scope:** Existing Babyora patterns only; no app code or media changed
**Contract:** `.planning/phases/01-planlegg-dagslinjen/01-UI-SPEC.md`

## File Classification

| New/modified file or group | Role | Data flow | Closest existing analog | Match |
|---|---|---|---|---|
| `src/lib/planning/coverage.ts`, `plan-view-model.ts` | pure model/transform | forecast + finalized recommendations -> deterministic view model | `src/lib/recommendation/view.ts:14-52`; current planning helpers | role/data-flow match |
| `src/lib/planning/change-events.ts`, `change-sentence.ts`, `rail-rows.ts` | pure transform/copy | ordered snapshots -> events -> rows/copy | existing files themselves | exact, but contracts must be replaced |
| `src/lib/planning/planned-outfit-context.ts` | boundary DTO + runtime guard | selected event -> readonly transient drill payload | `src/lib/clothing-engine-v2/validation.ts:22-72`; `src/state/child-profile.ts:39-60` | role match |
| `src/components/planning/PlanChangeRail.tsx` and small row components | controlled component | view model -> semantic disclosure events | current `PlanChangeRail`; `PaywallDialog` focus contract | exact structure, state ownership must move |
| `src/screens/UkeScreen.tsx` | route composition/controller | weather/access/child -> planning model -> UI | current `UkeScreen`; shell ownership in `src/App.tsx` | exact, refactor in place |
| `src/App.tsx`, `src/screens/PaakledningScreen.tsx` | navigation/drill coordinator | validated planned context -> dialog -> return | Hjem's `OpenSheetContext` handoff | exact adjacent pattern |
| `src/components/controls/SegmentedControl.tsx` | native form control | selected value -> callback | current component | exact |
| access/premium files and tests | policy/capability | entitlement state + capability -> render decision | `src/lib/access/capabilities.ts:39-46` | exact |
| `src/state/location-pref-store.ts`, `src/hooks/useAutoLocationRefresh.ts`, Hjem/Uke/Settings | fixed-home/effective-place boundary | persisted child home + persisted mode + allowed child-scoped session snapshot -> weather/display place | current store/hook/screens reveal the mutation seam; no safe complete analog | refactor in place; explicit non-persisted separation required |
| minimal weather metadata path | service/hook boundary | cache/network result -> explicit source/currentness | `src/lib/met-no/client.ts:22-64`; `src/hooks/useWeather.ts:19-86` | role match; reviewed path amendment required |
| `src/lib/planning/snart.ts`, `snart-session.ts` and tests | pure policy plus access-first orchestration | live access + fixed-home session -> injected approved evidence/model -> grouped guidance | no safe production analog | none; Node-test call ordering/memoization before UI enablement |
| haptics/nav/tokens | shared adapter/presentation | input -> native/no-op feedback and visual state | `src/lib/haptics/system.ts`; `BottomTabBar.tsx`; design tokens | exact |
| `e2e/planlegg.ts` | executable browser assertion | frozen fixture -> DOM/focus/layout assertions | `e2e/smoke.ts:25-102` | role match; must omit all media capture |

## Pattern Assignments

### Pure planning truth and view models

**Copy the shape, not the inactive V2 source, from** `src/lib/recommendation/view.ts:14-52`:

```ts
export type RecommendationView = { /* explicit typed presentation contract */ };

export function buildRecommendationView(rec: RecommendationV2): RecommendationView {
  const sorted = [...rec.garments].sort(/* deterministic role order */);
  return { recommendation: rec, orderedGarments, fingerprint: rec.fingerprint, /* ... */ };
}
```

Use named exports, explicit return types, immutable inputs, copied arrays before sorting, and no React/service calls. For Phase 1, the input remains the **current production legacy recommendation after `applySwapsFinalized`**; do not route visible advice through V2 or copy V2 thresholds.

The current helpers establish file placement and test style but expose the defects the replacement must eliminate:

- `change-events.ts:9-25` uses hour-only identity and one lossy `garments` list.
- `change-events.ts:29-69` gates on `fingerprint` and creates an empty swap when visible garments did not change.
- `change-sentence.ts:9-25` truncates with `+N til` and cannot say `Bytt fra ... til ...`.
- `rail-rows.ts:17-39` claims `hele dagen` without coverage evidence.

New contracts should use ISO/epoch identity, explicit `Europe/Oslo`, separate added/removed lists, stable sorting/deduplication, explicit evidence intervals/currentness, and a discriminated loading/error/offline/partial/ready model. Repeated execution over the same input must be byte-for-byte stable. Passive weather-only differences emit no clothing marker.

### Existing production recommendation seam

`src/screens/UkeScreen.tsx:400-477` is the required production seam:

```ts
const engineInput: RecommendInput = { weather: /* snapshot */, child, activity, /* vogn */ };
const rec = recommend(engineInput);
// Session swaps always pass the final safety boundary:
const swappedRec = applySwapsFinalized(p.engineInput, p.recommendation, swaps);
```

Planner actions must preserve this order and move only presentation derivation out of the screen. Never reproduce clothing thresholds, mutate `Recommendation.layers` locally, or alter Motor V2 flags.

### Exact planned Outfit context

Use the current Hjem handoff as the closest navigation analog:

- `src/screens/HjemScreen.tsx:85-94` defines an intent-specific payload.
- `src/screens/HjemScreen.tsx:284-290` builds that payload from the already-finalized recommendation.
- `src/App.tsx:95-104` stores it in the discriminated `Drill` union.
- `src/App.tsx:342-359,418-425` passes the payload through the composition root into Outfit.

Phase 1 extends this pattern with one exported readonly `PlannedOutfitContext` rather than adding unrelated scalar props. Build it atomically from the selected event and keep it in memory only. Its guard should follow the fail-fast style of `validateRecommendInputV2()` (`src/lib/clothing-engine-v2/validation.ts:22-72`) and tolerant boundary parsing style of `parseStoredChild()` (`src/state/child-profile.ts:39-60`): validate ISO instant, `Europe/Oslo`, finite/ranged coordinates, known activity/vogn/access values, finalized recommendation, and matching stable event ID.

`PaakledningScreen.tsx:266-278` is the anti-pattern for this branch: it currently recomputes from `useWeather()` and uses current temperature even when a recommendation prop exists. Planned context must be an exclusive render branch; current-context behavior remains the fallback only when no planned context was supplied. Expose planned date/time/place in the dialog header.

### Controlled semantic Dagslinje

Keep the current semantic intent from `PlanChangeRail.tsx:78-95` (`ol`, `li`, action text), but replace row-local state at `:59-75` with parent-controlled props:

```ts
type Props = {
  rows: readonly PlanRailRow[];
  selectedEventId: string | null;
  onSelect: (eventId: string) => void;
  onOpenOutfit: (eventId: string, origin: HTMLElement) => void;
};
```

Every direct `ol` child must be `li`; the decorative line belongs inside/list styling, not as the direct `span` currently at `:81`. Static verified spans are not buttons. Interactive events use a button, `aria-expanded`, real `<time dateTime={iso}>`, marker shape/icon plus verb text, cause, at most three safe decorative thumbnails, visible garment names, and `Se hele antrekket` only with exact context. Selection is parent-owned so zero events expand none, one expands itself, and many expand only the next relevant/selected event. Refresh repairs a stale selected ID deterministically without moving focus.

For imagery, reuse `garmentPngSafe()` and `GENERIC_GARMENT_SVG` from `src/data/garment-illustrations.ts:187-227`; do not create or guess new assets. Text remains authoritative.

### Native view control

Reuse `SegmentedControl.tsx:38-62`: native `fieldset` + named `legend` + visually hidden radio inputs + controlled value. Change only the target/style contract needed by Planlegg: the label at `:29-36` must be at least 44px high and use the approved selected surface/accent. Fire one selection haptic in the owner only when the value actually changes; do not create a second custom tab implementation.

### App shell and Planlegg composition

`src/App.tsx:375-412` is authoritative: App owns the only `<main>`, vertical page scroll and bottom navigation. `design-tokens.css:490-513` implements that shell. Therefore remove from `UkeScreen`:

- nested `<main>` (`UkeScreen.tsx:963-970,1288`),
- `100dvh` (`:525-535`),
- list-local vertical scroll (`:769-778`),
- duplicate hourly garment list after Dagslinjen,
- dead place and bell buttons (`:975-1020`).

Render a section with visible `h1`, child/place/currentness context, native `I dag / Uke / Snart`, verdict/next action, dominant rail, then one collapsed weather-only forecast. Keep screen composition separate from pure truth derivation.

### Access and paywall truth

Use `decideAccess()` (`src/lib/access/capabilities.ts:39-46`) as the single presentation decision. Its `loading` result precedes Free/Plus and prevents entitlement flash. Preserve the test matrix/builder style in `src/lib/access/__tests__/capabilities.test.ts:10-45` and `src/lib/premium/__tests__/plus-features.test.ts:8-55`.

Do not repeat screen-local `isPremium` gating like current `UkeScreen.tsx:331-348,507-508`. A Free future teaser is non-interactive advice-wise and has one contextual paywall CTA; only the CTA opens the paywall. Reuse `PaywallDialog`'s existing focus return at `src/components/PaywallDialog.tsx:609-640`. Every phrase shown by Planlegg must derive from implemented capability availability. `family_sharing` remains false. Snart remains hidden/unavailable until its deterministic model, tests and capability evidence exist; copy alone cannot enable it.

### Fixed home versus effective automatic place

`Child.city/lat/lon` is currently persisted by `children-provider.tsx` whenever `updateChild` changes the list, while both `HjemScreen.tsx` and `UkeScreen.tsx` read the active child coordinates directly for `useWeather`. The current `useAutoLocationRefresh.ts` and Settings confirmation path call `updateChild` with automatic coordinates, so they overwrite the only home snapshot. Do not preserve that pattern.

At Phase-1 cutover, treat the currently stored valid child place as the authoritative fixed home; there is no truthful way to reconstruct an older pre-auto value. Preserve the existing manual home editor. Extend the existing location-preference store with a child-scoped session-only `automaticPlace` and a pure `resolveEffectivePlace` boundary. Its persisted partialization may write only the existing `mode` under the existing key—never coordinates, city, child ID, entitlement or generation. A stored auto preference without a matching live snapshot resolves to fixed home.

App/Settings use one generation- and child-bound one-shot controller that commits only the ephemeral snapshot and clears/ignores it on loading, denial, manual mode, downgrade, child switch, unmount or superseding request. Hjem and Uke resolve the same effective place before `useWeather`, visible context and future DTO capture. Exact labels distinguish `Fast sted · {sted}` from `Nåværende sted · {sted}`. Snart is deliberately different: it derives `homePlaceKey` directly from persisted fixed home, never from the effective/displayed automatic place. Tests must hold fixed home A constant while changing automatic place B and prove Snart input/profile/result/trace invariance, plus byte-identical child storage through success/downgrade/reload.

### Weather source/currentness

Reuse the adapter/hook split:

- `src/lib/met-no/client.ts:22-64` owns cache/network fetching.
- `src/hooks/useWeather.ts:19-86` converts the service result into screen state and uses a cancellation guard.

The current client discards cache provenance and the hook exposes no fetched/stale/source metadata. The planner must explicitly amend the UI-spec allowed path before changing the minimal client/types/hook files. Return a typed result containing data, source and fetched time rather than making the screen inspect localStorage. Preserve expected-error-to-state handling. Do not persist new coordinate history or analytics.

Time grouping currently uses host-local `Date` (`client.ts:108-151,158-210`) and `UkeScreen.pickHourly()` compares only hour (`UkeScreen.tsx:133-150`). New planning identity/order/formatting must use the full instant and explicit `Europe/Oslo`; duplicate autumn hours stay distinct and cross-midnight points never become today's row accidentally.

### Haptics, focus and motion

Use `src/lib/haptics/system.ts` as the canonical haptic abstraction, not the older `src/hooks/useHaptics.ts`. Preserve lazy loading, native/web safe no-op and `HapticTier`. The required correction is narrow: haptic preference and reduced motion are independent, so remove the reduced-motion haptic suppression at `system.ts:168-185` without weakening the explicit haptics-off guard. Selection fires once on a changed view; light fires once on expansion only; collapse is silent.

Replace `BottomTabBar.tsx:212-267` React `focused` state with CSS `:focus-visible`. Reuse the existing focus-return dialog pattern; expanding a row does not move focus, opening Outfit moves focus to its title, and returning restores the origin and Planlegg scroll/selection. Reduced motion resolves immediately and does not change content or haptics.

### Design tokens and styling

Reuse, do not replace, `src/styles/design-tokens.css`:

- palette/type/spacing/motion tokens at `:16-124`,
- temperature-scoped `.ba-temp-root` at `:148-163,408-418`,
- forced-colors hook at `:378-382`,
- app shell at `:490-513`.

Planlegg may add scoped semantic aliases/styles only. Keep the approved four type sizes/two weights, 24px gutter, 44px targets, 3px focus ring with 4px offset, wrapping at 200%, and no nested scroll. Temperature canvas uses selected perceived temperature when exact context exists, otherwise current valid context; do not average days or use color as the only meaning.

### Tests and no-media E2E

Follow existing Vitest patterns: local default-plus-overrides builders, `it.each` matrices, Norwegian behavior names, invariants rather than implementation details, and real pure collaborators. Current examples are `src/lib/planning/__tests__/change-events.test.ts`, `src/lib/met-no/__tests__/client.test.ts:7-69`, and `src/lib/access/__tests__/capabilities.test.ts:10-45`.

For `e2e/planlegg.ts`, copy lifecycle/error handling from `e2e/smoke.ts:25-102`: spawn preview, wait, launch 390x844 Chromium, collect page/console/response errors, `try/finally` cleanup and nonzero failure. Add frozen route/weather/clock/entitlement fixtures and DOM/keyboard/geometry assertions. Do **not** call `page.screenshot()`, record video, enable trace screenshots, or persist any media. Verify one main/scroll owner, radio semantics, zero/one/many and one-expanded invariant, locked teaser, exact Outfit context/focus return, reduced-motion end state, and `scrollWidth <= clientWidth` at 200% text.

## Anti-Patterns / Planner Warnings

1. Do not sample four hours and call it `time for time` or `hele dagen` (`UkeScreen.tsx:366-378`).
2. Do not use localized hour/date text as identity, ordering or dedupe key.
3. Do not derive a clothing event from weather fingerprint alone.
4. Do not let Outfit merge planned advice with current weather.
5. Do not add React-local derivation that belongs in pure planning modules.
6. Do not flash Free/Plus while entitlement is unresolved, leak a locked link, or promise family/Snart before enabled evidence.
7. Do not create a nested main, `100dvh` screen shell, inner list scroll, custom radio tabs, custom focus store, or parallel design system.
8. Do not change recommendation thresholds, safety copy, Motor V2 flags, prices, RevenueCat semantics, family backend, analytics payloads or storage.
9. Do not write automatic coordinates/city into `Child`, persist an effective-place snapshot, reconstruct a pre-cutover home, or let Snart consume the displayed phone place.
10. Do not touch/stage `docs/MARKETING-PLAN-2026.md`, `docs/screenshots/`, or `docs/store-assets-2026/`.
11. Do not generate screenshots/video during implementation; visual/device/VoiceOver/TalkBack/haptic gates remain human Pending.

## No Close Analog

| File/capability | Reason | Planner instruction |
|---|---|---|
| `src/lib/planning/snart.ts` | No approved deterministic 4-6 week garment-preparation policy exists in production | Treat as its own high-risk slice with explicit evidence/rules/tests, or keep capability unavailable; never infer from copy/UI. |
| planned-context focus/scroll restoration across App dialog | Existing Hjem payload and dialog focus return are partial, not full origin-state restoration | Plan an explicit coordinator contract and non-media E2E; do not invent persistence/history. |
| coverage-aware offline planning evidence | Cache timestamp exists internally but provenance/currentness is discarded | Amend allowed paths and expose minimum typed metadata before rendering offline/whole-day claims. |

## Planner Guidance

- Preserve the approved Wave 0-6 order and separate high-risk truth/context/access/Snart candidates from standard UI/native-polish candidates.
- Same-wave plans must not overlap files; `UkeScreen.tsx`, shared tokens/control/nav seams need explicit dependency ordering.
- Create failing deterministic tests before each observable truth/context/access behavior. No dependent task may verify against a not-yet-created test path.
- Every plan names exact allowed paths, no-media commands, rollback, threat model, candidate SHA and fresh independent reviewer. Executor evidence is not independent PASS.
- No new npm package, API, schema, backend, media asset or external production change is required.

## Metadata

**Search scope:** `src/App.tsx`, Planlegg/Outfit screens, planning/access/premium/weather/haptics modules, shared controls/nav/tokens, current tests/E2E, and all `.planning/codebase/*.md`.
**Patterns extracted:** 13 grouped assignments; 4 capability gaps without a complete analog.
**Ready for planning:** Yes, subject to the weather-metadata allowed-path amendment and explicit Snart scope decision already surfaced in research.
