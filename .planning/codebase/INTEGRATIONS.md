# External Integrations

**Analysis Date:** 2026-07-19

## APIs & External Services

**Weather:**
- MET Norway Locationforecast 2.0 - Supplies compact forecast data used by the recommendation UI through the server-side proxy in `api/forecast.ts` and client in `src/lib/met-no/client.ts`.
  - SDK/Client: Native `fetch`; response types and transformations live in `src/lib/met-no/types.ts` and `src/lib/met-no/client.ts`.
  - Auth: No API key; the proxy supplies the service-required application `User-Agent` in `api/forecast.ts`.
- Vercel Edge weather proxy - Adds the MET Norway `User-Agent`, CORS, validation, and edge caching for web and native clients in `api/forecast.ts`.
  - SDK/Client: Vercel filesystem API route plus native `Request`, `Response`, and `fetch` APIs in `api/forecast.ts`.
  - Auth: None; native endpoint selection uses `VITE_FORECAST_PROXY` in `src/lib/met-no/client.ts` and `codemagic.yaml`.

**Geocoding & Location:**
- OpenStreetMap Nominatim - Performs forward and reverse geocoding with a five-result limit and local rate-conscious caching in `src/lib/geocode/nominatim.ts`; automatic refresh is initiated by `src/hooks/useAutoLocationRefresh.ts`.
  - SDK/Client: Native browser `fetch` and `navigator.geolocation` in `src/lib/geocode/nominatim.ts` and `src/hooks/useAutoLocationRefresh.ts`.
  - Auth: No API key; the client sends an application `User-Agent` where the platform permits it in `src/lib/geocode/nominatim.ts`.

**Subscriptions & Stores:**
- RevenueCat - Provides native offerings, purchase, restore, and `premium` entitlement checks in `src/lib/billing/revenuecat.ts`, with foreground synchronization in `src/lib/premium/use-access.ts`.
  - SDK/Client: `@revenuecat/purchases-capacitor` from `package.json`, used by `src/lib/billing/revenuecat.ts`.
  - Auth: `VITE_REVENUECAT_PUBLIC_KEY_IOS` or `VITE_REVENUECAT_PUBLIC_KEY_ANDROID`, consumed only for the matching native platform in `src/lib/billing/revenuecat.ts`.
- Apple App Store and Google Play - Receive Codemagic internal-test builds and handle subscription-management/review destinations from `codemagic.yaml`, `src/screens/InnstillingerScreen.tsx`, and `src/lib/feedback/app-rate.ts`.
  - SDK/Client: Codemagic publishers plus `@capacitor-community/in-app-review` in `codemagic.yaml`, `package.json`, and `src/lib/feedback/app-rate.ts`.
  - Auth: App Store Connect integration, Android signing configuration, and `CM_GOOGLE_PLAY_KEY_JSON` are managed by named Codemagic integrations/groups in `codemagic.yaml`.

**Analytics:**
- PostHog EU - Receives an allowlisted, PII-sanitized event surface with autocapture, pageview capture, and session recording disabled in `src/lib/analytics/track.ts`; initialization begins in `src/main.tsx`.
  - SDK/Client: Dynamically imported `posthog-js` from `package.json` in `src/lib/analytics/track.ts`.
  - Auth: Optional `VITE_POSTHOG_KEY`; optional `VITE_POSTHOG_HOST` overrides the EU default in `src/lib/analytics/track.ts`.

**Native Device Services:**
- Capacitor plugins - App lifecycle, status bar, splash, keyboard, haptics, local notifications, geolocation-related browser APIs, and in-app review are integrated in `src/lib/native-init.ts`, `src/lib/haptics/system.ts`, `src/lib/notifications/morning-notification.ts`, `src/hooks/useAutoLocationRefresh.ts`, and `src/lib/feedback/app-rate.ts`.
  - SDK/Client: Capacitor 8 packages are declared in `package.json`; lifecycle/status/splash/keyboard/haptics and RevenueCat entries appear in `android/capacitor.settings.gradle` and `ios/App/CapApp-SPM/Package.swift`, while local notifications and in-app review are dynamically imported by `src/lib/notifications/morning-notification.ts` and `src/lib/feedback/app-rate.ts` but are absent from those generated native dependency lists.
  - Auth: OS permissions for notifications and location, requested or checked by `src/lib/notifications/morning-notification.ts`, `src/screens/InnstillingerScreen.tsx`, and `src/hooks/useAutoLocationRefresh.ts`.

**Developer Tooling:**
- Google Gemini image-generation API - Generates and revises checked-in visual assets through `tools/avatar-gen/generate.ts` and multiple `scripts/generate-*.mjs`/`scripts/f79-*.mjs` tools.
  - SDK/Client: Native Node.js `fetch` against the Google Generative Language API in `tools/avatar-gen/generate.ts` and `scripts/compare-nano-banana-pro.mjs`.
  - Auth: `GEMINI_API_KEY`; optional model selection uses `GEMINI_IMAGE_MODEL` in `tools/avatar-gen/generate.ts`.
- Browser-based Microsoft Copilot, RevenueCat, App Store Connect, and Play Console automation - Uses Playwright for assisted review and store bootstrap flows in `scripts/copilot-browser-spawn.mjs`, `scripts/bootstrap-revenuecat.mjs`, `scripts/connect-revenuecat-apple.mjs`, and `scripts/bootstrap-stores.mjs`.
  - SDK/Client: `playwright` from `package.json`.
  - Auth: Interactive browser sessions/profiles outside tracked source, with ignored profile paths defined in `.gitignore`; no credentials are embedded by these integration descriptions.

**Configured but Inactive:**
- Supabase - A project/setup is documented, but no Supabase SDK dependency, runtime import, schema, or authenticated client is present in `package.json`, `src/state/children-store.tsx`, or `SUPABASE-SETUP.md`.
  - SDK/Client: Not detected in `package.json` or `src/`; application data remains local in `src/state/children-store.tsx` and `src/lib/gdpr/local-data.ts`.
  - Auth: Not implemented; environment variable names are documented in `SUPABASE-SETUP.md` but have no consumer under `src/` or `api/`.

## Data Storage

**Databases:**
- No application database client is active; child profiles, preferences, ownership, feedback, entitlements cache, and analytics identifiers are stored in browser/WebView `localStorage` by `src/state/children-store.tsx`, `src/state/*.ts`, `src/lib/garments/ownership.ts`, `src/lib/feedback/feedback-store.ts`, and `src/lib/analytics/track.ts`.
  - Connection: Not applicable; no connection variable is consumed by `src/` or `api/`, and the Supabase setup remains inactive as recorded in `SUPABASE-SETUP.md`.
  - Client: Browser `localStorage`, Zustand `persist`, and direct storage helpers in `src/state/` and `src/lib/gdpr/local-data.ts`.
- RevenueCat stores purchase receipts and entitlement state on its service, while the app only reads entitlement/customer information through `src/lib/billing/revenuecat.ts` and keeps UI fallback state in `src/state/subscription-store.ts`.
  - Connection: Platform public SDK keys named in `src/lib/billing/revenuecat.ts`.
  - Client: `@revenuecat/purchases-capacitor` used by `src/lib/billing/revenuecat.ts`.

**File Storage:**
- Static application assets are repository files bundled from `public/` and imported/self-hosted resources referenced by `src/data/garment-illustrations.ts`, `src/components/WeatherLottie.tsx`, and `src/main.tsx`; no cloud object-storage SDK is detected in `package.json`.
- Widget snapshots use an iOS App Group JSON file through `ios/App/App/Plugins/WidgetBridgePlugin.swift` and `ios/App/BabyoraWidget/WidgetSnapshot.swift`, and Android shared preferences through `android/app/src/main/java/no/klemeg/app/plugins/WidgetBridgePlugin.kt`; the web bridge is `src/lib/widget/bridge.ts`.

**Caching:**
- MET Norway responses are cached for one hour in `localStorage` by `src/lib/met-no/client.ts`, while the Edge proxy adds 15-minute shared caching and 10-minute stale revalidation in `api/forecast.ts`.
- Nominatim responses are cached for 24 hours in `localStorage` by `src/lib/geocode/nominatim.ts`.
- Session-scoped UI flags and overrides use `sessionStorage` in `src/hooks/useOverrides.ts`, `src/hooks/useTooltipSeen.ts`, and `src/screens/PaakledningScreen.tsx`.

## Authentication & Identity

**Auth Provider:**
- No application authentication provider is implemented; `src/state/children-store.tsx`, `src/components/family/CareCircle.tsx`, and `src/lib/premium/plus-features.ts` explicitly keep user data local and gate family sharing because auth/RLS/backend support is absent.
  - Implementation: Anonymous local profiles in `src/state/children-store.tsx`; RevenueCat is configured with a null app user ID unless an optional ID is passed to `initRevenueCat` in `src/lib/billing/revenuecat.ts`.

## Monitoring & Observability

**Error Tracking:**
- None detected; no Sentry or equivalent error-tracking package/import exists in `package.json`, `src/`, or `api/forecast.ts`.

**Logs:**
- Browser/native integration failures use `console.warn`/`console.error` with graceful fallbacks in `src/lib/native-init.ts`, `src/lib/billing/revenuecat.ts`, `src/lib/notifications/morning-notification.ts`, and `src/lib/widget/bridge.ts`.
- Product analytics is separate from error tracking and flows through the sanitized PostHog wrapper in `src/lib/analytics/track.ts`.
- CI/build logs and artifacts are retained by GitHub Actions and Codemagic according to `.github/workflows/ci.yml` and `codemagic.yaml`.

## CI/CD & Deployment

**Hosting:**
- Vercel hosts the web app, `/bare/` build, and `api/forecast.ts` Edge function; deployment URLs are referenced by `apps/bare/vite.config.ts`, `api/forecast.ts`, and `codemagic.yaml`.
- Apple TestFlight and Google Play Internal are the native distribution targets in the `ios-internal` and `android-internal` workflows in `codemagic.yaml`.

**CI Pipeline:**
- GitHub Actions runs npm install, ESLint, Vitest, product-audit tests, production build, Playwright browser installation, and E2E smoke on pushes and pull requests to `main` in `.github/workflows/ci.yml`.
- Codemagic builds/syncs native platforms, signs iOS, creates Android bundles, and publishes internal-test artifacts through `codemagic.yaml`; iOS triggers on `main`, while the Android automatic trigger is disabled in that file and remains manually runnable.

## Environment Configuration

**Required env vars:**
- Native weather builds require `VITE_FORECAST_PROXY` because a Capacitor origin cannot use the web-relative `/api/forecast`; the consumer is `src/lib/met-no/client.ts` and the mobile value is supplied by `codemagic.yaml`.
- RevenueCat activation requires the relevant `VITE_REVENUECAT_PUBLIC_KEY_IOS` and/or `VITE_REVENUECAT_PUBLIC_KEY_ANDROID`; missing keys produce an intentional no-op/local fallback in `src/lib/billing/revenuecat.ts` and `src/lib/premium/use-access.ts`.
- PostHog activation requires `VITE_POSTHOG_KEY`; `VITE_POSTHOG_HOST` is optional and defaults in `src/lib/analytics/track.ts`.
- Gemini-powered asset scripts require `GEMINI_API_KEY`; `GEMINI_IMAGE_MODEL` is optional in `tools/avatar-gen/generate.ts` and related scripts under `scripts/`.
- Android store publishing requires `CM_GOOGLE_PLAY_KEY_JSON` plus signing/integration configuration managed by Codemagic, referenced without embedded values in `codemagic.yaml`.
- `VITE_BUILD_SHA`, `VITE_BUILD_DATE`, and `VITE_APP_VERSION` are generated by `vite.config.ts`, not operator-supplied secrets.
- `VITE_SUPABASE_URL` and Supabase publishable/anonymous-key names are documented in `SUPABASE-SETUP.md` but are not required by the active code because no consumer exists in `src/` or `api/`.

**Secrets location:**
- Local environment files are excluded by `.gitignore`; only `.env.example` is tracked, and no environment-file contents are included in this audit.
- Mobile signing and service values live in Codemagic environment groups and integrations referenced by `codemagic.yaml`; Vercel runtime/build variables are managed outside the repository, with variable consumers in `src/lib/met-no/client.ts`, `src/lib/analytics/track.ts`, and `src/lib/billing/revenuecat.ts`.
- Interactive store/tool sessions use ignored browser-profile directories listed in `.gitignore`; credential and key files are not part of the integration map.

## Webhooks & Callbacks

**Incoming:**
- None detected; `api/forecast.ts` is a public GET/OPTIONS proxy endpoint rather than a webhook or provider callback.

**Outgoing:**
- No outgoing webhooks are implemented; direct runtime API/SDK calls originate from `api/forecast.ts`, `src/lib/geocode/nominatim.ts`, `src/lib/analytics/track.ts`, and `src/lib/billing/revenuecat.ts`.

---

*Integration audit: 2026-07-19*
