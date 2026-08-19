# Prototype Foundation Inventory

Assessment date: 2026-08-19

Scope: current runtime code under `src/` plus the service and native boundaries
that determine whether existing behavior is reusable. This inventory separates
product foundations from prototype presentation; it is not approval of the
current identity, monetization model, or visual direction.

## Labels

| Label | Meaning for later tasks |
|---|---|
| **Preserve** | Keep the verified contract or behavior. Refactoring is allowed when its tests and observable guarantees remain intact. |
| **Adapt** | Reuse the foundation, but close the named contract, privacy, reliability, or product gap before treating it as complete. |
| **Replace** | The current implementation is presentation-specific and may be redesigned without carrying its visual choices forward. |
| **Investigate** | Do not commit to preservation or removal until a named product, safety, identity, or evidence gate is resolved. |

Labels apply to the named responsibility, not automatically to every line in the
directory. A preserved behavior does not preserve the component styling that
currently renders it.

## Product boundary

- **Preserve:** four root destinations—Hjem, Planlegg, Verktøy, Familie—as the
  starting information architecture recorded in the latest owner decision.
- **Adapt:** the current runtime has three root tabs (`hjem`, `plan`, `familie`)
  and nests tools under Familie. The existing router is therefore reusable
  machinery, not a verified implementation of the four-tab structure.
- **Replace:** all current palette values, typography, spacing, elevation,
  component appearance, imagery treatment, and page composition.
- **Investigate:** public identity and the fixed-home/later-session monetization
  conflict before either is encoded into redesigned user-facing copy.

## Domain logic

| Responsibility and evidence | Label | Decision |
|---|---|---|
| Final legacy safety boundary: `src/lib/wool-layers/finalize-safety.ts` and `src/lib/wool-layers/__tests__/finalize-safety.test.ts` | **Preserve** | Keep the rule that overrides, calibration, and swaps pass through final safety. Do not preserve its current messages as visual copy by implication. |
| Deployed recommendation pipeline: `src/lib/wool-layers/recommend.ts`, types, tables, and engine tests | **Adapt** | Reuse the deterministic rule foundation, but route callers through one canonical facade, pass every safety input including `canRoll`, add explicit boundary determinism, and expose a bounded error result. |
| Engine V2: `src/lib/clothing-engine-v2/` | **Adapt** | Its typed validation, explanations, fingerprints, and gold scenarios are useful, but it is not the deployed engine. Reconcile it with the production facade instead of enabling it merely because it exists. |
| Safety sources, thresholds, and country applicability in both engines | **Investigate** | Preserve no rule as NO/SE/DK-approved until the versioned rule register and qualified country review exist. Unreviewed safety logic remains contained evidence, not Scandinavian approval. |
| Outfit truth snapshot and stable identifiers: `src/lib/outfit/outfit-truth.ts` and its tests | **Preserve** | Keep the presentation-independent garment/equipment truth, strict input checks, stable identities, and neutral fallback behavior. |
| Safe substitution machinery: `src/state/outfit-selection-store.ts` and `applySwapsFinalized` in `src/lib/wool-layers/finalize-safety.ts` | **Adapt** | Retain safety-finalized candidates and reset capability; expose a real undo path and align the visible route with the canonical result contract. |
| Pure planning transforms: `src/lib/planning/` and colocated tests | **Preserve** | Keep tested date, change-event, rail, access, and context transforms. Their current screen composition and paywall placement are separate decisions. |

## Weather and location

| Responsibility and evidence | Label | Decision |
|---|---|---|
| MET edge proxy: `api/forecast.ts` and `api/__tests__/forecast.test.ts` | **Adapt** | Keep validation, service identification, cache headers, and memory-only mode; make upstream failures and retry behavior a typed end-to-end contract. |
| Forecast client and hook: `src/lib/met-no/client.ts`, `src/hooks/useWeather.ts`, freshness tests | **Adapt** | Reuse extraction, caching, and freshness models, but stop collapsing failures into generic errors and verify offline/stale rendering against a real cached outfit. |
| Location preference and automatic refresh: `src/state/location-pref-store.ts`, `src/hooks/useAutoLocationRefresh.ts` | **Adapt** | Keep generation guards and the manual/automatic distinction; ensure automatic coordinates and derived outfit data never cross a persistent store, widget, log, or analytics boundary. |
| Geocoding adapter: `src/lib/geocode/nominatim.ts` | **Adapt** | Keep the adapter boundary and rate-conscious caching, but validate platform headers, privacy scope, typed failure states, and Scandinavian locale behavior before release. |

## State and persistence

| Responsibility and evidence | Label | Decision |
|---|---|---|
| Child context facade: `src/state/children-store.tsx`, `src/state/children-provider.tsx`, `src/state/child-profile.ts` | **Adapt** | Preserve the screen-facing API and local-first model; enforce the PRD schema before writes and migrate invalid legacy records safely. |
| Small isolated Zustand-store pattern in `src/state/` | **Preserve** | Continue using narrow stores with explicit persistence boundaries. Existing storage keys and persisted fields are not automatically preserved. |
| Scan and widget cache state: `src/state/scan-cache-store.ts`, `src/lib/widget/` | **Adapt** | Fixed-home caching needs a renderable recommendation plus freshness; automatic-location scans and widget snapshots must be memory-only and cleared across all persistence paths. |
| Session-only swap overrides: `src/state/swap-override-store.ts` | **Preserve** | Keep garment changes session-scoped and safety-finalized. |
| Feedback and garment ownership storage: `src/lib/feedback/`, `src/lib/garments/ownership.ts` | **Investigate** | Decide whether these are required for the validation MVP and audit child linkage, deletion, migration, and analytics before expanding them. |

## Billing and access

| Responsibility and evidence | Label | Decision |
|---|---|---|
| RevenueCat adapter boundary: `src/lib/billing/revenuecat.ts` and its tests | **Adapt** | Keep package-type lookup and native isolation; return typed entitlement/purchase/restore outcomes, reject duplicate package types, preserve last-known entitlement offline, and use live store prices. |
| Capability/access policy: `src/lib/access/`, `src/lib/premium/` | **Adapt** | A centralized policy boundary is useful, but its gates must follow the unresolved authoritative free-today rule until monetization is reconciled. Remove production demo entitlement bypasses. |
| Subscription state: `src/state/subscription-store.ts` | **Adapt** | Keep first-value and cached-entitlement concepts; distinguish unavailable from inactive, and do not encode a later-session paywall as approved while the governing conflict remains open. |
| Paywall presentation: `src/components/PaywallDialog.tsx`, `src/components/AppPaywallGate.tsx` | **Replace** | Purchase and restore semantics may be reused through adapters, but current layout, pricing rows, copy hierarchy, colors, and animation are prototype UI. |

## Analytics and observability

| Responsibility and evidence | Label | Decision |
|---|---|---|
| Central analytics wrapper: `src/lib/analytics/track.ts` | **Adapt** | Keep one SDK boundary, opt-out-first initialization, disabled autocapture/session recording, and coarse events; make properties closed typed allowlists and test the real sanitizer behavior. |
| Existing event taxonomy and call sites | **Adapt** | Map only the validation funnel, remove unrestricted strings, and verify no child identity, exact location, garment payload, raw safety data, or free text can be emitted. |
| Error observability | **Investigate** | No Sentry implementation exists. Introduce it only through the PRD scrub/release/environment contract and verify source-map handling before production. |

## Navigation

| Responsibility and evidence | Label | Decision |
|---|---|---|
| Four-root product IA: Hjem, Planlegg, Verktøy, Familie | **Preserve** | This is the starting product structure, independent of visual tab styling or the current runtime implementation. |
| Current root definitions: `src/types/nav.ts` and its tests | **Adapt** | They explicitly implement three roots and must be reconciled with the four-root decision. Keep typed route data and reachability tests. |
| App shell and drill state: `src/App.tsx` | **Adapt** | Keep onboarding takeover, lazy loading, drill ownership, focus restoration, and back behavior where verified; simplify orchestration and add the fourth root without copying current layout or motion values. |
| Bottom navigation component: `src/components/BottomTabBar.tsx` and CSS | **Replace** | Retain semantic tab behavior through a new/adapted contract, but icon treatment, geometry, labels, colors, and animation are not design requirements. |

## Screens

| Responsibility and evidence | Label | Decision |
|---|---|---|
| Onboarding workflow: `src/screens/OnboardingScreen.tsx` | **Adapt** | Reuse the local child/location flow and permission sequencing; harden validation and redesign the screen hierarchy, copy, visuals, and assets independently. |
| Home orchestration: `src/screens/HjemScreen.tsx` | **Adapt** | Reuse weather, engine, access, haptics, and outfit-transition boundaries; split the oversized orchestration, expose all four activities, pass complete inputs, and add explicit error/privacy states. |
| Dressing/result route: `src/screens/PaakledningScreen.tsx` and `src/components/klepaa/` | **Adapt** | Preserve ordered garment truth and safety-finalized interaction; add rationale, safety explanation, undo, stale/offline behavior, and a replaceable presentation layer. |
| Planning route: `src/screens/UkeScreen.tsx` and `src/components/planning/` | **Adapt** | Keep tested projections and meaningful-change logic; revisit information density, access placement, and visuals after the core answer is validated. |
| Guide/tool screens: `FinnAntrekkScreen`, `TogGuideScreen`, `VarmEllerKaldScreen`, `VinterprogramScreen`, `PlaggbibliotekScreen` | **Investigate** | Determine the minimum Verktøy-tab content and safety/country evidence before carrying every prototype tool into the validation MVP. |
| Family/settings surface: `src/screens/FamilieScreen.tsx`, `src/screens/InnstillingerScreen.tsx` | **Investigate** | Keep local settings required for privacy, restore, deletion, and sources; defer or hide family collaboration until auth/RLS exists. |

## Components

| Responsibility and evidence | Label | Decision |
|---|---|---|
| Tested semantic behavior—focus return, keyboard activation, reduced motion, labels, and touch-target contracts across component tests | **Preserve** | These are accessibility and interaction guarantees, not a visual design lock. |
| Outfit, transition, control, planning, and profile component boundaries under `src/components/` | **Adapt** | Reuse boundaries that reduce screen coupling, but update props to canonical product contracts and keep presentational decisions replaceable. |
| Current cards, sheets, instruments, atmospheric backgrounds, mascot blocks, and inline screen markup | **Replace** | They encode a prior visual direction. Rebuild or remove them according to the selected provisional direction instead of polishing them by default. |

## Styles, themes, and assets

| Responsibility and evidence | Label | Decision |
|---|---|---|
| Token values in `src/styles/design-tokens.css` and `src/styles/design-tokens-v2.css` | **Replace** | The files may inspire a future token architecture, but no current color, spacing, radius, shadow, or elevation value is mandatory. |
| Font loading in `src/styles/fonts.css`, `src/main.tsx`, and `public/fonts/` | **Replace** | Current families, weights, and typographic hierarchy are open; performance and offline self-hosting remain implementation requirements. |
| Screen/component CSS and inline visual styles | **Replace** | Existing selectors, page layouts, atmospheric treatments, card geometry, and decorative motion are prototype presentation. |
| Reduced-motion, focus-visible, contrast, and readable-target behavior enforced by style/component tests | **Preserve** | Preserve the accessible outcome. Exact focus color, duration, easing, and visual expression may change when the new direction is tested. |
| Theme modes and weather-reactive presentation: `src/state/theme-store.ts`, `src/lib/weather-theme/`, `src/components/LivingHomeAtmosphere.tsx`, `src/components/LivingHomeBackground.tsx` | **Investigate** | Weather meaning may support the product, but dark/light defaults, palette mapping, atmosphere, and theme controls require comparison in TASK-005/006. |
| Avatars, garment illustrations, icons, Lottie/weather media, and generated composites under `public/` | **Investigate** | Evaluate comprehension, truthfulness, accessibility, crop quality, and fit with each design direction. Presence in the repository is not a reason to ship an asset. |
| Logo, wordmark, app-name artwork, and brand assets under `public/brand/` and native projects | **Investigate** | Do not propagate them until the Babyora/Snudly source-of-truth conflict and availability gate are resolved. |

## Platform and verification foundations

| Responsibility and evidence | Label | Decision |
|---|---|---|
| Capacitor projects, bundle identifier, build configuration, CI, and the bare diagnostic app | **Preserve** | Keep the working packaging and verification foundation. Bundle/product identifiers remain owner-controlled irreversible boundaries. |
| Native initialization, haptics, notifications, widgets, and lifecycle adapters under `src/lib/`, `ios/`, and `android/` | **Adapt** | Preserve adapter isolation, but verify actual plugin registration, physical-device behavior, privacy scope, and parity before depending on each capability. |

## Visual lock audit

- Existing visual assets or token values labeled **Preserve** solely because
  they already exist: **0**.
- Current token values, fonts, CSS layouts, component appearance, and paywall
  presentation are **Replace**.
- Current themes, avatars, illustrations, weather media, logos, and wordmarks
  are **Investigate**, not mandatory inputs to the next design direction.
- The only visual-adjacent **Preserve** items are measurable accessibility
  outcomes such as focus, reduced motion, contrast, and readable targets. Their
  exact styling remains open.

## Handoff rule

TASK-004 and TASK-005 may use the existing app to understand workflows and
constraints, but must not use “already implemented” as evidence for a visual
choice. Any future item promoted from **Adapt** or **Investigate** to
**Preserve** needs behavior, user, safety, or release evidence—not sunk cost.
