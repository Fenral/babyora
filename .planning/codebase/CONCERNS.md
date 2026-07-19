# Codebase Concerns

**Analysis Date:** 2026-07-19

## Tech Debt

**Oversized screen modules and embedded presentation code:**
- Issue: Major screens combine feature state, native integrations, modal workflows, copy, SVGs, and large inline style systems. `InnstillingerScreen.tsx` is 5,629 lines; several other screens exceed 1,000 lines.
- Files: `src/screens/InnstillingerScreen.tsx`, `src/screens/OnboardingScreen.tsx`, `src/screens/FinnAntrekkScreen.tsx`, `src/screens/UkeScreen.tsx`, `src/screens/TogGuideScreen.tsx`
- Impact: Small changes have a wide review surface, component tests are difficult to isolate, and merge conflicts concentrate in a few files.
- Fix approach: Split each screen by owned workflow (profile, privacy, notifications, billing, location, legal) and move repeated dialog/style primitives into focused modules under `src/components/` while preserving route-level lazy loading in `src/App.tsx`.

**Fragmented local persistence:**
- Issue: Child profiles, entitlements, location preferences, feedback, wardrobe ownership, analytics identity, widget snapshots, geocode caches, and weather caches write directly to `localStorage` under inconsistent key namespaces. Most write failures are swallowed.
- Files: `src/state/children-store.tsx`, `src/state/subscription-store.ts`, `src/state/location-pref-store.ts`, `src/lib/feedback/feedback-store.ts`, `src/lib/garments/ownership.ts`, `src/lib/analytics/track.ts`, `src/lib/widget/bridge.ts`, `src/lib/geocode/nominatim.ts`, `src/lib/met-no/client.ts`
- Impact: Export/deletion is incomplete, schema migration is scattered, quota failures are invisible, and multi-device synchronization cannot be added behind one storage boundary.
- Fix approach: Introduce a typed persistence adapter with a key registry, schema versions, migration hooks, quota/error reporting, and explicit categories for profile data, caches, and third-party state.

**Product access rules have two enforcement paths:**
- Issue: `decideAccess()` is documented as the single capability contract, but screens and garment logic still branch directly on `isPremium` or use separate gating helpers.
- Files: `src/lib/access/capabilities.ts`, `src/lib/premium/gating.ts`, `src/lib/premium/use-access.ts`, `src/screens/InnstillingerScreen.tsx`, `src/screens/MinGarderobeScreen.tsx`, `src/lib/garments/ownership-override.ts`
- Impact: Product rules can drift between paywall copy, UI controls, and recommendation behavior.
- Fix approach: Route every gated operation through `decideAccess()` and keep screen code limited to rendering the returned decision and trigger.

**Stale implementation comments conflict with executable configuration:**
- Issue: The RevenueCat wrapper still declares a product-ID mismatch although the product catalog uses the provisioned `no.klemeg.app.*` IDs. Other source comments describe morning notifications as a Plus flagship while the capability contract makes them free.
- Files: `src/lib/billing/revenuecat.ts`, `src/lib/premium/products.ts`, `src/lib/notifications/morning-notification.ts`, `src/lib/access/capabilities.ts`, `docs/DECISION-LOG.md`
- Impact: Future billing or entitlement work can follow obsolete warnings and reintroduce a resolved configuration error.
- Fix approach: Keep operational warnings generated from tested constants or remove them when the corresponding decision is represented in code and tests.

## Known Bugs

**Delete-data and logout actions do not return the running app to onboarding:**
- Symptoms: `resetAll()` empties the child list, but `App` renders onboarding from a separate `onboardingDone` state initialized only once. The app shell remains mounted with the placeholder child after deletion/logout.
- Files: `src/App.tsx`, `src/state/children-provider.tsx`, `src/screens/InnstillingerScreen.tsx`
- Trigger: Complete onboarding, open settings, confirm "delete all local data" or logout, and remain in the same app session.
- Workaround: Fully reload or restart the app after deletion.

**"Delete all local data" leaves Babyora data behind:**
- Symptoms: The deletion helper removes only `babyora:` and `klemeg:` keys. Zustand keys such as `babyora.theme`, `babyora.subscription`, `babyora.location-pref`, and `babyora.notifications`, plus `metno:` and `nominatim:` coordinate caches, survive.
- Files: `src/lib/gdpr/local-data.ts`, `src/state/theme-store.ts`, `src/state/subscription-store.ts`, `src/state/location-pref-store.ts`, `src/state/notification-pref-store.ts`, `src/lib/met-no/client.ts`, `src/lib/geocode/nominatim.ts`
- Trigger: Use the app, enable preferences/location, then invoke the GDPR deletion action and inspect storage.
- Workaround: Clear the application's complete site/app storage at the operating-system or browser level.

**Removing the active child can persist an invalid active ID:**
- Symptoms: `removeChild()` chooses `list[0]` from the pre-removal closure. When the removed active child is the first element, its ID remains selected even though `active` falls back to another child.
- Files: `src/state/children-provider.tsx`, `src/state/children-store.tsx`
- Trigger: Create at least two children, select the first child, remove it, and inspect the persisted `babyora:activeChildId:v2` value.
- Workaround: Select another child explicitly or restart after the list has persisted.

**Out-of-scope ages receive clipped toddler recommendations:**
- Symptoms: The approved v1 boundary is 0-24 months, but onboarding accepts roughly three years, profile editing accepts dates back to 2018, and `dobToAgeMonths()` clips every older child to 36 months. The legacy engine then produces a recommendation rather than rejecting the age.
- Files: `AGENTS.md`, `src/screens/OnboardingScreen.tsx`, `src/screens/InnstillingerScreen.tsx`, `src/lib/utils/dob-to-age-months.ts`, `src/lib/wool-layers/recommend.ts`
- Trigger: Save a birth date older than 24 months in onboarding or the profile editor and open a recommendation screen.
- Workaround: Keep profiles within 0-24 months manually.

**A missing platform-specific RevenueCat key can clear cached Premium status:**
- Symptoms: `isRevenueCatConfigured()` returns true when either platform key exists. On the other platform, initialization exits without setting `initialized`, then entitlement sync receives `false` from `checkPremium()` and writes a non-Premium cache value.
- Files: `src/lib/billing/revenuecat.ts`, `src/lib/premium/use-access.ts`, `src/state/subscription-store.ts`, `src/main.tsx`
- Trigger: Build one native platform with only the other platform's public RevenueCat key and resume/start the app with a cached Premium state.
- Workaround: Always provide both platform keys in every native build environment.

## Security Considerations

**Child and location data are readable by any script in the app origin:**
- Risk: Child name, birth date, city, coordinates, feedback, and wardrobe choices are stored unencrypted in `localStorage`. A future XSS or compromised dependency can read all of it.
- Files: `src/state/children-store.tsx`, `src/lib/feedback/feedback-store.ts`, `src/lib/garments/ownership.ts`, `index.html`
- Current mitigation: React escapes rendered strings, external font/CDN scripts are absent, and Android mixed content is disabled in `capacitor.config.ts`.
- Recommendations: Add a restrictive Content Security Policy, minimize retained coordinates, keep dependencies audited, and use platform-protected storage for sensitive profile data if the threat model requires confidentiality at rest.

**Forecast proxy is an unrestricted public relay:**
- Risk: Any origin can call the endpoint because CORS is `*`; four-decimal coordinate cache keys allow high-cardinality requests that consume edge and upstream capacity.
- Files: `api/forecast.ts`, `src/lib/met-no/client.ts`
- Current mitigation: The upstream host and path are fixed, inputs are numeric/range validated, and successful responses have edge caching.
- Recommendations: Add rate limiting and abuse monitoring, restrict allowed origins where practical, normalize coordinates consistently, and cap request concurrency/timeouts.

**No authorization boundary exists for planned shared data:**
- Risk: Family sharing, cross-device profiles, and server-side calibration cannot be exposed safely until authentication, ownership rules, and row-level authorization exist.
- Files: `src/lib/access/capabilities.ts`, `src/state/children-store.tsx`, `src/lib/premium/plus-features.ts`, `docs/superpowers/plans/2026-07-13-babyora-family-sync-plan.md`
- Current mitigation: Shared/authenticated capabilities remain unavailable and `family_sharing` is false.
- Recommendations: Keep all shared features disabled until authenticated integration tests prove tenant isolation and RLS/authorization policies.

**Production dependency audit reports two moderate advisories:**
- Risk: The installed graph contains vulnerable `dompurify@3.4.10` through PostHog and vulnerable `tar` versions through Capacitor tooling; the audit reports fixes available.
- Files: `package.json`, `package-lock.json`, `src/lib/analytics/track.ts`
- Current mitigation: PostHog disables autocapture and session recording; archive tooling is not part of app runtime behavior.
- Recommendations: Upgrade the transitive chains, rerun `npm audit --omit=dev`, and verify analytics and native asset/build workflows after lockfile changes.

## Performance Bottlenecks

**Production output includes the entire public design/archive asset tree:**
- Problem: A fresh production build is about 284 MB. Vite copies prototype pages, review shots, duplicate garment sets, and all public images into `dist/` regardless of runtime use.
- Files: `public/illustrations/`, `public/avatars/`, `public/design-2026/`, `public/review-shots/`, `vite.config.ts`, `dist/`
- Cause: `public/illustrations/` is about 173 MB and `public/avatars/` about 102 MB; flat and clay garment sets coexist as runtime fallbacks, while prototype directories share the production public root.
- Improvement path: Move review/prototype assets outside `public/`, generate a production allowlist, convert large PNGs to optimized WebP/AVIF where supported, and add a build-size budget.

**Large initial JavaScript and settings route chunk:**
- Problem: The production entry chunk is about 450 kB (145 kB gzip), and the lazy Familie/settings chunk is about 98 kB before gzip.
- Files: `src/main.tsx`, `src/App.tsx`, `src/screens/FamilieScreen.tsx`, `src/screens/InnstillingerScreen.tsx`, `dist/assets/`
- Cause: Cross-cutting providers/integrations load at boot, while the settings route owns many unrelated dialogs and feature workflows in one module.
- Improvement path: Preserve route splitting, lazy-load analytics/native-only integrations after readiness, and split settings workflows into on-demand subchunks.

**Persistent caches and feedback grow without eviction:**
- Problem: Whole forecast payloads are stored per rounded coordinate, geocode entries accumulate per query/coordinate, and feedback history appends indefinitely.
- Files: `src/lib/met-no/client.ts`, `src/lib/geocode/nominatim.ts`, `src/lib/feedback/feedback-store.ts`
- Cause: TTL checks ignore expired records without deleting them, and feedback recomputation filters in memory without pruning the stored array.
- Improvement path: Delete expired entries on read, cap each cache with LRU/maximum counts, and persist only the feedback window needed for calibration.

## Fragile Areas

**Safety-sensitive legacy recommendation pipeline:**
- Files: `src/lib/wool-layers/recommend.ts`, `src/lib/wool-layers/finalize-safety.ts`, `src/lib/wool-layers/conflicts.ts`, `src/lib/wool-layers/softBlocks.ts`, `src/lib/wool-layers/safety.ts`
- Why fragile: Ordering is safety-critical, overrides and calibration mutate results after the first safety pass, and several legacy rules recognize Norwegian garment labels with regular expressions.
- Safe modification: Preserve the final `finalizeSafety()` boundary, add a failing guardrail scenario before changing labels/order, and require the repository's high-risk review process for recommendation behavior.
- Test coverage: The engine has strong unit/snapshot/gold-scenario coverage, but screen-to-engine wiring and native user flows do not prove every final displayed outfit.

**Profile lifecycle state:**
- Files: `src/App.tsx`, `src/state/children-provider.tsx`, `src/state/children-store.tsx`, `src/screens/InnstillingerScreen.tsx`
- Why fragile: Routing state and profile state have separate sources of truth; persistence helpers silently fall back; active-child repair uses closure state.
- Safe modification: Derive shell/onboarding routing from an explicit lifecycle state machine and update list plus active ID atomically from the same functional state transition.
- Test coverage: Only the pure parser in `src/state/__tests__/child-profile.test.ts` is tested; provider add/remove/reset and App rerouting have no automated coverage.

**Native billing and notification behavior:**
- Files: `src/lib/billing/revenuecat.ts`, `src/lib/premium/use-access.ts`, `src/components/PaywallDialog.tsx`, `src/lib/notifications/morning-notification.ts`, `src/lib/native-init.ts`
- Why fragile: Web paths intentionally simulate/no-op native behavior, while production behavior depends on platform keys, StoreKit/Play Billing state, permissions, resume events, and installed plugins.
- Safe modification: Keep web mocks explicit, add wrapper-level failure-state tests, and validate each change on sandbox devices with configured native builds.
- Test coverage: `e2e/purchase-flow.ts` covers only the web/dev mock; real purchase, restore, expiration, notification scheduling, and permission transitions are not automated.

## Scaling Limits

**Device-local profile model:**
- Current capacity: One browser/webview installation with profiles and preferences stored in local storage; profile IDs use millisecond timestamps.
- Limit: Data does not synchronize across devices or caregivers, clearing app storage loses it, and concurrent family edits have no conflict model.
- Scaling path: Add authenticated server persistence, stable server-generated IDs, versioned migrations, conflict handling, and offline reconciliation before enabling sharing.

**Forecast edge function:**
- Current capacity: Anonymous GET requests backed by Vercel edge caching for 15 minutes and client caching for one hour.
- Limit: Cache cardinality grows with four-decimal coordinates; there is no quota, rate limit, timeout, or circuit breaker.
- Scaling path: Normalize coordinate precision, enforce per-client/global limits, add upstream timeouts and metrics, and serve stale cached data during upstream failures.

**Local storage quota:**
- Current capacity: Browser-dependent, typically only a few megabytes shared by child profiles, preferences, full forecast responses, geocode results, feedback, widget snapshots, and analytics persistence.
- Limit: Writes fail silently when quota is reached, producing stale or lost preferences without user-visible recovery.
- Scaling path: Separate bounded caches from durable data, monitor write failures, prune automatically, and move durable synchronized state to a backend.

## Dependencies at Risk

**PostHog / DOMPurify chain:**
- Risk: `posthog-js` brings the moderate `dompurify` advisory reported by the installed lockfile audit.
- Impact: Analytics is optional, but the vulnerable transitive package remains in the production dependency graph and increases browser attack surface.
- Migration plan: Upgrade PostHog to a resolved chain or isolate/remove analytics until the advisory is cleared; retain the typed PII-sanitizing wrapper in `src/lib/analytics/track.ts`.

**Capacitor CLI and asset tooling / tar chain:**
- Risk: The lockfile contains vulnerable `tar` versions through `@capacitor/cli` and the older CLI nested under `@capacitor/assets`.
- Impact: Archive extraction risk affects developer/CI build tooling and duplicated Capacitor CLI majors increase maintenance uncertainty.
- Migration plan: Upgrade the Capacitor asset toolchain to a version aligned with Capacitor 8, keep CLI packages in development dependencies where feasible, and regenerate native assets in a clean CI environment.

**Unused direct dependencies:**
- Risk: `leaflet`, `react-leaflet`, `@types/leaflet`, `lucide-react`, `@capacitor/geolocation`, and two variable font packages have no source imports; source comments say the variable fonts are removed.
- Impact: The lockfile, install time, audit surface, and upgrade workload are larger than the executable feature set.
- Migration plan: Remove unused packages after a clean build/native sync check and add dependency-linting to prevent drift.

## Missing Critical Features

**Accurate, published privacy and terms package:**
- Problem: `PRIVACY.md` is explicitly a draft with placeholders and claims that conflict with precise auto-location and PostHog analytics behavior. The handoff still requires a published policy and store privacy forms.
- Blocks: Store submission, reliable GDPR disclosure, and informed consent for production analytics/location behavior.

**Family authentication and sharing backend:**
- Problem: Family sharing, account identity, server persistence, and row-level authorization are absent; availability flags keep the feature hidden.
- Blocks: The approved Plus promise of sharing with caregivers and cross-device continuity.

**Motor V2 and verified avatar activation:**
- Problem: All V2 display flags are false and the approved avatar manifest is empty even though verified assets exist. Production continues to use the contained legacy engine and neutral/fallback avatar path.
- Blocks: Structured 0-24-month recommendation output, verified outfit composites, and the planned cohort rollout until the required professional review/signature is satisfied.

**Native release evidence and signing completion:**
- Problem: Provisioning/TestFlight, real sandbox purchase/restore, VoiceOver, haptics, text scaling, and store metadata/privacy steps remain manual gates.
- Blocks: A verified iOS/Android release despite green web build, lint, unit tests, and mock E2E.

## Test Coverage Gaps

**Profile deletion, removal, and onboarding routing:**
- What's not tested: Provider-level add/remove/reset transitions, active-ID repair, GDPR deletion key coverage, and App rerouting after the last child is removed.
- Files: `src/App.tsx`, `src/state/children-provider.tsx`, `src/lib/gdpr/local-data.ts`, `src/screens/InnstillingerScreen.tsx`
- Risk: Users can remain in an invalid placeholder state or retain data after a deletion claim.
- Priority: High

**Age boundary enforcement:**
- What's not tested: End-to-end rejection or warning for 25+ months across onboarding, profile editing, age conversion, and recommendation entry points.
- Files: `src/screens/OnboardingScreen.tsx`, `src/screens/InnstillingerScreen.tsx`, `src/lib/utils/dob-to-age-months.ts`, `src/lib/wool-layers/recommend.ts`
- Risk: Safety-sensitive recommendations are shown outside the approved product population.
- Priority: High

**Native purchases and entitlement lifecycle:**
- What's not tested: Platform-specific configuration, real offerings, purchase cancellation/error states, receipt entitlement, restore, expiration, and external subscription changes.
- Files: `src/lib/billing/revenuecat.ts`, `src/lib/premium/use-access.ts`, `src/components/PaywallDialog.tsx`, `e2e/purchase-flow.ts`
- Risk: Paying users can be denied access or purchases can fail only in production-native conditions.
- Priority: High

**Native permissions, notifications, location, and widget bridge:**
- What's not tested: iOS/Android permission variants, denied/revoked permissions, schedule delivery, app resume, native geolocation, and plugin absence/version mismatch.
- Files: `src/lib/notifications/morning-notification.ts`, `src/hooks/useAutoLocationRefresh.ts`, `src/lib/widget/bridge.ts`, `src/lib/native-init.ts`
- Risk: Native-only failures remain invisible to the Node/web suite.
- Priority: High

**Forecast proxy behavior:**
- What's not tested: HTTP methods other than GET/OPTIONS, upstream timeout/malformed payload, cache headers, CORS policy, abuse limits, and response-schema validation.
- Files: `api/forecast.ts`, `src/lib/met-no/client.ts`
- Risk: Weather outages or malformed upstream data can degrade every recommendation screen, while the public endpoint can be abused unnoticed.
- Priority: High

**Screen interaction and accessibility regression:**
- What's not tested: The 13 production screens have no colocated component tests; `e2e/smoke.ts` verifies only onboarding and a demo shell, and audit screenshots are not assertions for keyboard, focus, reduced motion, or screen-reader behavior.
- Files: `src/screens/`, `src/components/`, `e2e/smoke.ts`, `tools/product-audit/`
- Risk: Large inline screen changes can break navigation, dialogs, focus, and responsive layouts while unit tests remain green.
- Priority: Medium

**Coverage enforcement:**
- What's not tested: No line/branch/function threshold is configured and the default test command does not produce a coverage gate.
- Files: `package.json`, `vite.config.ts`
- Risk: The suite can grow in test count while critical integration paths remain unmeasured.
- Priority: Medium

---

*Concerns audit: 2026-07-19*
