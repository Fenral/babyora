<!-- refreshed: 2026-07-19 -->
# Architecture

**Analysis Date:** 2026-07-19

## System Overview

```text
┌──────────────────────────────────────────────────────────────┐
│                 React application shell                       │
├──────────────────┬──────────────────┬───────────────────────┤
│ Tab/drill routing │ Screens/components │ Capacitor adapters    │
│ `src/App.tsx`    │ `src/screens/`    │ `src/lib/native-init.ts`│
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌───────────────────────────────────────────────────────────────┐
│                   Application/domain layer                    │
│ `src/hooks/` + `src/state/` + `src/lib/` + `src/data/`       │
└───────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│ Browser storage, native plugins, and external services         │
│ `src/state/`, `api/forecast.ts`, `ios/`, `android/`           │
└──────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Web bootstrap | Loads global styles and i18n, initializes analytics, billing, and native behaviors, then mounts the provider-wrapped app. | `src/main.tsx` |
| Application shell | Owns onboarding takeover, tab/drill/modal navigation, lazy screen loading, transitions, and the global bottom bar. | `src/App.tsx` |
| Child profile context | Owns the child list, active child, onboarding state, and persistence through one React context API. | `src/state/children-store.tsx`, `src/state/children-provider.tsx` |
| Feature settings | Holds persisted theme, location, notification, reference-hour, and subscription state plus session-only garment swaps. | `src/state/` |
| Weather adapter | Fetches and caches forecasts, then derives now/hour/day view models for screens. | `src/hooks/useWeather.ts`, `src/lib/met-no/client.ts` |
| Weather proxy | Validates coordinates and proxies met.no from a Vercel edge function with server-side identification and caching headers. | `api/forecast.ts` |
| Production recommendation engine | Produces deterministic legacy recommendations through modifiers, conflicts, soft blocks, hard safety, overrides/calibration, and a final safety boundary. | `src/lib/wool-layers/recommend.ts`, `src/lib/wool-layers/finalize-safety.ts` |
| Engine 2.0 | Implements a separate deterministic typed pipeline, adapter, review export, and engine-selection flags; all visible-engine flags are false. | `src/lib/clothing-engine-v2/` |
| Presentation screens | Compose child, weather, recommendation, access, haptics, and local interaction state into route-level UI. | `src/screens/` |
| Reusable presentation | Supplies shared navigation, controls, sheets, paywall, instruments, family, planning, and outfit primitives. | `src/components/` |
| Premium boundary | Wraps RevenueCat and exposes premium status through one hook backed by a persisted cache. | `src/lib/billing/revenuecat.ts`, `src/lib/premium/use-access.ts`, `src/state/subscription-store.ts` |
| Native shells | Package the web build for iOS and Android and expose selected native/plugin surfaces. | `capacitor.config.ts`, `ios/`, `android/` |
| Bare diagnostic app | Reuses weather and the production recommendation engine without the main visual component layer. | `apps/bare/BareApp.tsx`, `apps/bare/vite.config.ts` |

## Pattern Overview

**Overall:** Client-first layered React SPA packaged by Capacitor, with feature-oriented domain modules and adapter boundaries around external/native services (`src/main.tsx`, `src/App.tsx`, `src/lib/`, `capacitor.config.ts`).

**Key Characteristics:**
- Keep route-level orchestration in lazy-loaded screens while `src/App.tsx` owns the four roots and guide/modal drill state.
- Keep recommendation logic pure and deterministic in `src/lib/wool-layers/` and `src/lib/clothing-engine-v2/`; screens build inputs and render returned models.
- Keep user data local by default through `src/state/`, `src/lib/feedback/`, and `src/lib/garments/`; only weather, analytics, billing, geocoding, and native bridges cross process boundaries.
- Treat `src/lib/wool-layers/finalize-safety.ts` as the last trusted boundary after overrides, calibration, or session swaps.
- Gate native APIs with `Capacitor.isNativePlatform()` in `src/lib/native-init.ts`, `src/lib/billing/revenuecat.ts`, `src/lib/widget/bridge.ts`, and `src/lib/notifications/morning-notification.ts`.

## Layers

**Bootstrap and Shell Layer:**
- Purpose: Start the runtime, initialize cross-cutting services, provide child state, and select the visible screen.
- Location: `index.html`, `src/main.tsx`, `src/App.tsx`
- Contains: HTML boot setup, React root creation, provider mounting, lazy route imports, tab/drill state, and global navigation.
- Depends on: `src/state/`, `src/hooks/`, `src/lib/`, `src/screens/`, `src/components/`
- Used by: Browser deployments, the Capacitor WebView configured by `capacitor.config.ts`, and smoke checks in `e2e/smoke.ts`.

**Presentation Layer:**
- Purpose: Render onboarding, recommendations, planning, guides, family/settings, dialogs, and reusable controls.
- Location: `src/screens/`, `src/components/`, `src/styles/design-tokens.css`
- Contains: Route components, domain subcomponents, CSS design tokens, motion behavior, and accessibility interaction code.
- Depends on: `src/hooks/`, `src/state/`, `src/lib/`, `src/data/`, `src/types/`
- Used by: The route switch and modal host in `src/App.tsx`; the bare app intentionally bypasses this layer in `apps/bare/BareApp.tsx`.

**Application State and Hooks Layer:**
- Purpose: Coordinate React lifecycle with persisted preferences, child profiles, weather requests, haptics, focus, and device behavior.
- Location: `src/state/`, `src/hooks/`
- Contains: React context, Zustand stores, localStorage persistence, and reusable side-effect hooks.
- Depends on: Browser APIs, Capacitor packages, and service/domain modules under `src/lib/`.
- Used by: Route screens in `src/screens/`, the shell in `src/App.tsx`, and shared components in `src/components/`.

**Domain Layer:**
- Purpose: Calculate clothing recommendations, safety results, access decisions, planning deltas, display models, weather transforms, and catalog mappings.
- Location: `src/lib/`, `src/data/`
- Contains: Pure recommendation pipelines, typed rules/tables, adapters, catalog data, planning transforms, premium policy, and presentation-independent helpers.
- Depends on: Domain-local types/data; boundary modules such as `src/lib/met-no/client.ts` and `src/lib/billing/revenuecat.ts` additionally depend on fetch, storage, or native SDKs.
- Used by: `src/screens/`, `src/components/`, `src/hooks/`, `apps/bare/BareApp.tsx`, and scripts such as `scripts/export-engine-v2-review.ts`.

**Platform and Service Adapter Layer:**
- Purpose: Isolate network, billing, analytics, notifications, geolocation, widget, and host-platform behavior.
- Location: `api/forecast.ts`, `src/lib/analytics/`, `src/lib/billing/`, `src/lib/geocode/`, `src/lib/met-no/`, `src/lib/notifications/`, `src/lib/widget/`, `ios/`, `android/`
- Contains: Vercel edge handler, SDK wrappers, Capacitor plugins, Swift/Kotlin bridge code, and native project configuration.
- Depends on: met.no, Nominatim, PostHog, RevenueCat, browser APIs, Capacitor, iOS, and Android APIs.
- Used by: Hooks and domain-facing adapters rather than direct imports from most screens; geolocation is also invoked directly by `src/screens/OnboardingScreen.tsx` and `src/screens/InnstillingerScreen.tsx`.

## Data Flow

### Primary Request Path

1. `src/main.tsx:32` mounts `src/App.tsx` inside `src/state/children-provider.tsx`; `src/App.tsx:287` selects onboarding or the app shell.
2. A route such as `src/screens/HjemScreen.tsx:226` asks `src/hooks/useWeather.ts` for weather, which calls `src/lib/met-no/client.ts:52` and reaches `api/forecast.ts:31` on web/native-configured deployments.
3. `src/screens/HjemScreen.tsx:238` builds a typed `RecommendInput`, and `src/screens/HjemScreen.tsx:257` invokes `src/lib/wool-layers/recommend.ts`.
4. `src/lib/wool-layers/recommend.ts` applies base tables, modifiers, conflicts, soft blocks, hard safety, and the final containment boundary in `src/lib/wool-layers/finalize-safety.ts` when post-safety mutations exist.
5. `src/screens/HjemScreen.tsx:273` applies session swaps through the same final safety boundary and passes the trusted recommendation to visual components or the modal context owned by `src/App.tsx:345`.

### Onboarding and Profile Persistence

1. `src/App.tsx:287` renders `src/screens/OnboardingScreen.tsx` whenever the child store is empty.
2. `src/screens/OnboardingScreen.tsx:512` validates the form locally and calls `completeOnboarding` with name, date of birth, and location.
3. `src/state/children-provider.tsx:75` creates the child and updates context state; effects at `src/state/children-provider.tsx:36` persist the child list and active id through helpers in `src/state/children-store.tsx`.

### Ten-Day Planning Flow

1. `src/screens/UkeScreen.tsx:325` loads hourly and daily-at-hour projections through `src/hooks/useWeather.ts`.
2. `src/screens/UkeScreen.tsx:400` and `src/screens/UkeScreen.tsx:431` build one recommendation input per displayed time/day and call the production engine.
3. `src/screens/UkeScreen.tsx:462` reapplies session swaps safely, then `src/lib/planning/change-events.ts` and `src/lib/planning/rail-rows.ts` derive the visible change rail.
4. `src/lib/premium/use-access.ts` and `src/lib/premium/gating.ts` decide whether ten-day clothing detail is visible, with `src/components/PaywallDialog.tsx` handling conversion UI.

### Premium Entitlement Flow

1. `src/main.tsx:28` initializes `src/lib/billing/revenuecat.ts` and then calls `syncPremiumEntitlement` from `src/lib/premium/use-access.ts`.
2. `src/lib/premium/use-access.ts:44` checks RevenueCat only in a configured native runtime and writes the result to `src/state/subscription-store.ts`.
3. Screens read `{ isPremium, loading }` through `useAccess` in `src/lib/premium/use-access.ts`; purchase and restore actions live in `src/components/PaywallDialog.tsx` and `src/lib/billing/revenuecat.ts`.

**State Management:**
- Use React context for the child aggregate through `src/state/children-store.tsx` and `src/state/children-provider.tsx`.
- Use small Zustand stores in `src/state/` for independent preferences and access state; persisted stores use `zustand/middleware`, while `src/state/swap-override-store.ts` is session-only.
- Use component-local React state for navigation and interaction state in `src/App.tsx` and `src/screens/`; there is no URL router in `package.json` or `src/App.tsx`.
- Use localStorage-backed modules for weather cache, garment ownership, feedback, analytics preferences, geocoding cache, i18n, and widget snapshots under `src/lib/` and `src/i18n/index.ts`.

## Key Abstractions

**Recommendation:**
- Purpose: Represents the trusted legacy output consumed by the visible UI.
- Examples: `src/lib/wool-layers/types.ts`, `src/lib/wool-layers/recommend.ts`, `src/lib/wool-layers/finalize-safety.ts`
- Pattern: Pure pipeline plus an explicit final safety boundary for every post-engine mutation.

**RecommendationV2:**
- Purpose: Represents Engine 2.0 thermal intent, resolved garments/equipment, explanations, safety flags, and a deterministic fingerprint.
- Examples: `src/lib/clothing-engine-v2/types.ts`, `src/lib/clothing-engine-v2/recommend.ts`, `src/lib/clothing-engine-v2/legacy-adapter.ts`
- Pattern: Typed staged pipeline behind static selection flags in `src/lib/clothing-engine-v2/feature-flags.ts`; visible flags are false and production screens import the legacy engine directly.

**ChildrenStore:**
- Purpose: Provides the active child and mutations while hiding storage parsing/persistence from screens.
- Examples: `src/state/children-store.tsx`, `src/state/children-provider.tsx`, `src/state/child-profile.ts`
- Pattern: React context facade with storage helpers and tolerant schema parsing.

**WeatherState:**
- Purpose: Gives screens a single asynchronous state model containing current, hourly, daily, and raw forecast data.
- Examples: `src/hooks/useWeather.ts`, `src/lib/met-no/types.ts`, `src/lib/met-no/client.ts`
- Pattern: Hook over a cached service adapter and pure forecast extraction functions.

**useAccess:**
- Purpose: Hides entitlement synchronization and the persisted subscription cache from premium-aware screens.
- Examples: `src/lib/premium/use-access.ts`, `src/state/subscription-store.ts`, `src/lib/billing/revenuecat.ts`
- Pattern: Hook facade over a native-only SDK adapter with web/development no-op behavior.

**WidgetSnapshot:**
- Purpose: Defines the JSON contract shared by the web layer and native widget bridges.
- Examples: `src/lib/widget/snapshot.ts`, `src/lib/widget/bridge.ts`, `ios/App/BabyoraWidget/WidgetSnapshot.swift`
- Pattern: Versioned DTO plus platform adapters; production callers of `buildSnapshot`/`pushWidgetSnapshot` are not present outside tests and the bridge modules.

## Entry Points

**Main Web Application:**
- Location: `index.html`, `src/main.tsx`
- Triggers: Vite development/build output loaded by a browser or Capacitor WebView.
- Responsibilities: Pre-React document setup, imports, service initialization, provider composition, React render, and native initialization.

**Application Router/Shell:**
- Location: `src/App.tsx`
- Triggers: React render from `src/main.tsx`.
- Responsibilities: Onboarding gate, four root tabs, guide drills, clothing modal, lazy loading, focus/back gestures, and global bottom navigation.

**Weather Edge Function:**
- Location: `api/forecast.ts`
- Triggers: HTTP `GET` or `OPTIONS` requests to `/api/forecast` on the Vercel deployment.
- Responsibilities: Coordinate validation, met.no request identification, CORS, error translation, and edge caching.

**Bare Application:**
- Location: `apps/bare/index.html`, `apps/bare/main.tsx`, `apps/bare/BareApp.tsx`
- Triggers: The separate Vite build under `/bare/` configured by `apps/bare/vite.config.ts`.
- Responsibilities: Exercise weather and recommendation behavior using semantic HTML without main-app screens, components, or styles.

**Native Hosts:**
- Location: `ios/App/App/AppDelegate.swift`, `android/app/src/main/java/no/klemeg/app/MainActivity.java`
- Triggers: iOS or Android application launch after Capacitor synchronization.
- Responsibilities: Host the compiled web application and route native lifecycle/plugin integration through Capacitor.

**Engine Review Export:**
- Location: `scripts/export-engine-v2-review.ts`, `src/lib/clothing-engine-v2/review-export.ts`
- Triggers: `npm run engine:v2:review` from `package.json`.
- Responsibilities: Execute Engine 2.0 scenarios and shadow comparisons outside visible app routing.

## Architectural Constraints

- **Threading:** UI and domain code run on the browser/WebView event loop in `src/`; server-side weather proxy work runs per edge request in `api/forecast.ts`; native plugin calls cross the Capacitor bridge in `src/lib/native-init.ts` and `src/lib/widget/bridge.ts`.
- **Global state:** Module-level singletons include i18next in `src/i18n/index.ts`, analytics client state in `src/lib/analytics/track.ts`, RevenueCat initialization state in `src/lib/billing/revenuecat.ts`, premium readiness/listeners in `src/lib/premium/use-access.ts`, and Zustand stores in `src/state/`.
- **Circular imports:** No known circular dependency chain is evident in production imports under `src/`; preserve the direction `screens/components -> hooks/state/lib/data`, with `src/main.tsx` and `src/App.tsx` at the composition root.
- **Navigation:** Route state is in-memory and centralized in `src/App.tsx`; browser URLs do not identify root tabs or drills, and `src/lib/native-init.ts` uses browser history for Android back while `src/App.tsx` separately handles edge-swipe back.
- **Persistence:** Child and preference data are localStorage-first in `src/state/` and `src/lib/gdpr/local-data.ts`; no application database or login/session layer exists in production code under `src/` or `api/`.
- **Safety:** Never mutate a trusted legacy recommendation after `src/lib/wool-layers/finalize-safety.ts`; use `applySwapsFinalized` for session swaps and preserve the pipeline order in `src/lib/wool-layers/recommend.ts`.
- **Engine selection:** Visible screens import `src/lib/wool-layers/recommend.ts`; Engine 2.0 remains isolated under `src/lib/clothing-engine-v2/`, and all display flags in `src/lib/clothing-engine-v2/feature-flags.ts` are false.
- **Native parity:** Native capabilities require both TypeScript bridge code under `src/lib/` and matching platform registration/code under `ios/` and `android/`; the Android widget receiver referenced by `android/app/src/main/java/no/klemeg/app/plugins/WidgetBridgePlugin.kt` is not present.

## Anti-Patterns

### Screen-Local Service and Domain Orchestration

**What happens:** Large route components combine network hooks, domain input construction, recommendation error handling, local state, presentation markup, and extensive inline styling in files such as `src/screens/InnstillingerScreen.tsx`, `src/screens/FinnAntrekkScreen.tsx`, and `src/screens/UkeScreen.tsx`.
**Why it's wrong:** The same weather-to-recommendation assembly is repeated across `src/screens/HjemScreen.tsx`, `src/screens/PaakledningScreen.tsx`, `src/screens/FinnAntrekkScreen.tsx`, and `src/screens/UkeScreen.tsx`, increasing the chance that feels-like calculation, safety context, calibration, or error policy diverges.
**Do this instead:** Put reusable orchestration in a focused hook under `src/hooks/` and pure mapping in `src/lib/`; keep screens responsible for route-level composition, following the separation already used by `src/hooks/useWeather.ts` and `src/lib/met-no/client.ts`.

### Two Recommendation Models Without One Production Facade

**What happens:** Production screens call `src/lib/wool-layers/recommend.ts` directly, while `src/lib/clothing-engine-v2/` has its own engine selector, result type, adapter, and review flow but no visible-screen caller.
**Why it's wrong:** Callers own the engine choice, so cohort selection, fallback analytics, shadow comparison, and adapter use cannot be enforced consistently from one boundary.
**Do this instead:** Route screen-facing recommendations through one domain facade colocated with `src/lib/clothing-engine-v2/index.ts`; return the legacy `Recommendation` contract via `src/lib/clothing-engine-v2/legacy-adapter.ts` where compatibility is required, and keep `src/lib/wool-layers/finalize-safety.ts` as the legacy mutation boundary.

### Parallel Persistence Mechanisms

**What happens:** `src/state/children-provider.tsx` uses custom localStorage helpers, most preference stores use Zustand persist in `src/state/`, and other features access localStorage directly in `src/lib/feedback/feedback-store.ts`, `src/lib/garments/ownership.ts`, `src/lib/met-no/client.ts`, and `src/lib/widget/bridge.ts`.
**Why it's wrong:** Storage failure behavior, key naming, migrations, reset/export coverage, and React update semantics are distributed across unrelated modules.
**Do this instead:** Keep storage behind each domain's exported store/adapter, register every user-data key with the export/delete behavior in `src/lib/gdpr/local-data.ts`, and avoid direct localStorage access from new screens under `src/screens/`.

## Error Handling

**Strategy:** Convert expected boundary failures into explicit state/no-op results, keep pure domain validation throwable, and prevent external/native initialization failures from blocking React startup (`src/hooks/useWeather.ts`, `src/lib/wool-layers/recommend.ts`, `src/main.tsx`).

**Patterns:**
- `src/hooks/useWeather.ts` maps rejected forecast promises to `{ status: 'error', error }`; weather-consuming screens render loading/error/empty states.
- `api/forecast.ts` validates input and translates network/upstream failures to JSON HTTP responses with `400` or `502`/upstream status.
- `src/lib/wool-layers/recommend.ts` and `src/lib/clothing-engine-v2/validation.ts` throw on invalid domain input; screens such as `src/screens/HjemScreen.tsx` catch and return `null`.
- `src/lib/native-init.ts`, `src/lib/billing/revenuecat.ts`, and `src/lib/premium/use-access.ts` catch SDK failures and log warnings/errors while preserving web or cached behavior.
- Storage helpers in `src/state/children-store.tsx` and local adapters under `src/lib/` catch unavailable/quota/parse failures and use empty, fallback, or no-op behavior.

## Cross-Cutting Concerns

**Logging:** Use `src/lib/analytics/track.ts` for typed product analytics and PII filtering; runtime diagnostics use `console.warn`/`console.error` at adapters such as `src/lib/native-init.ts`, `src/lib/billing/revenuecat.ts`, and exceptional screen paths such as `src/screens/FinnAntrekkScreen.tsx`.
**Validation:** Validate weather coordinates at `api/forecast.ts`, legacy engine inputs at `src/lib/wool-layers/recommend.ts`, Engine 2.0 inputs at `src/lib/clothing-engine-v2/validation.ts`, stored child profiles at `src/state/child-profile.ts`, and UI form state within `src/screens/OnboardingScreen.tsx`.
**Authentication:** No application authentication provider or server session is present in `src/` or `api/`; profiles are device-local through `src/state/children-provider.tsx`, while native purchase identity/entitlement is delegated to RevenueCat through `src/lib/billing/revenuecat.ts`.

---

*Architecture analysis: 2026-07-19*
