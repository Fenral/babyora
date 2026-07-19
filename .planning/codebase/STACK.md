# Technology Stack

**Analysis Date:** 2026-07-19

## Languages

**Primary:**
- TypeScript 6.0.2 - React application, domain engines, Vercel Edge handler, tests, and developer tooling in `src/`, `api/forecast.ts`, `e2e/`, and `tools/product-audit/`; the constraint is `~6.0.2` in `package.json`.

**Secondary:**
- JavaScript (ECMAScript modules) - Vite/ESLint configuration and browser, asset-generation, and verification scripts in `vite.config.ts`, `eslint.config.js`, and `scripts/*.mjs`; ESM mode is set by `package.json`.
- CSS - Handwritten design tokens and application styles in `src/styles/design-tokens.css` and component/screen imports under `src/`; no Tailwind package or Tailwind configuration is present in `package.json`.
- Swift 5.0 with Swift tools 5.9 - Capacitor iOS host, native widget, and widget bridge in `ios/App/App/`, `ios/App/BabyoraWidget/`, and `ios/App/CapApp-SPM/Package.swift`.
- Java 17 and Groovy/Gradle - Android host and build configuration in `android/app/src/main/java/no/klemeg/app/MainActivity.java`, `android/app/build.gradle`, and `codemagic.yaml`.
- Kotlin (version not pinned in the repository) - Android widget bridge source in `android/app/src/main/java/no/klemeg/app/plugins/WidgetBridgePlugin.kt`.
- Ruby - Native project helper retained in `scripts/add-widget-target.rb`.

## Runtime

**Environment:**
- Modern browser or Capacitor WebView targeting ES2023 and DOM APIs, configured in `tsconfig.app.json` and bootstrapped by `index.html` and `src/main.tsx`.
- Capacitor 8.3.4 native runtime for iOS and Android, configured by `capacitor.config.ts`, `ios/App/CapApp-SPM/Package.swift`, and `android/capacitor.settings.gradle`.
- Vercel Edge runtime for the weather proxy, declared in `api/forecast.ts`.
- Node.js 24 in GitHub Actions and Node.js 22 in Codemagic; no local Node version is pinned by `package.json`, `.nvmrc`, or an engines field, while CI versions are explicit in `.github/workflows/ci.yml` and `codemagic.yaml`.

**Package Manager:**
- npm (version not pinned) - Installation and scripts are defined in `package.json`, `.github/workflows/ci.yml`, and `codemagic.yaml`.
- Lockfile: present, lockfile version 3 in `package-lock.json`.

## Frameworks

**Core:**
- React 19.2.6 and React DOM 19.2.6 - Component UI and browser mounting in `src/App.tsx` and `src/main.tsx`; versions are declared in `package.json`.
- Capacitor 8.3.4 - Packages the web application as `no.klemeg.app` for iOS and Android via `capacitor.config.ts`, `ios/App/`, and `android/`.
- Zustand 5.0.14 - Local application state with persisted browser storage in `src/state/theme-store.ts`, `src/state/subscription-store.ts`, `src/state/location-pref-store.ts`, and related stores.
- i18next 26.3.1, react-i18next 17.0.8, and browser language detection 8.2.1 - Bundled Norwegian, Danish, German, English, and Swedish localization in `src/i18n/index.ts` and `src/i18n/locales/`.

**Testing:**
- Vitest 4.1.8 - Unit and product-audit tests colocated under `src/**/__tests__/`, `src/**/*.test.ts`, and `tools/product-audit/*.test.ts`; commands are in `package.json`.
- Playwright 1.60.0 - Browser smoke, purchase-flow, screenshot, and product-audit automation in `e2e/`, `scripts/verify-browser-*.mjs`, and `tools/product-audit/capture.ts`.
- JUnit 4.13.2 and AndroidX test libraries - Generated/native Android test targets in `android/app/src/test/` and `android/app/src/androidTest/`, configured by `android/variables.gradle` and `android/app/build.gradle`.

**Build/Dev:**
- Vite 8.0.12 with `@vitejs/plugin-react` 6.0.1 - Main and bare web builds in `vite.config.ts` and `apps/bare/vite.config.ts`.
- TypeScript project references - Type-checking through `tsc -b` using `tsconfig.json`, `tsconfig.app.json`, and `tsconfig.node.json` before the Vite build in `package.json`.
- ESLint 10.3.0 with TypeScript ESLint 8.59.2 and React Hooks/Refresh plugins - Static analysis configured in `eslint.config.js` and invoked by `package.json`.
- Capacitor CLI 8.3.4, Gradle 8.14.3, and Android Gradle Plugin 8.13.0 - Native synchronization and Android builds configured in `package.json`, `android/gradle/wrapper/gradle-wrapper.properties`, and `android/build.gradle`.
- Codemagic and GitHub Actions - Mobile publishing workflows and repository verification in `codemagic.yaml` and `.github/workflows/ci.yml`.

## Key Dependencies

**Critical:**
- `@revenuecat/purchases-capacitor` 13.1.4 - Native subscription offerings, purchases, restores, and `premium` entitlement checks in `src/lib/billing/revenuecat.ts` and `src/lib/premium/use-access.ts`.
- `posthog-js` 1.386.6 - Optional, privacy-filtered product analytics initialized from `src/lib/analytics/track.ts` and called from `src/main.tsx`.
- `motion` 12.40.0, `gsap` 3.15.0, and `@gsap/react` 2.1.2 - Screen transitions and onboarding animation in `src/App.tsx`, `src/screens/HjemScreen.tsx`, and `src/screens/onboarding/IntroHeroAnimator.tsx`.
- `@lottiefiles/dotlottie-react` 0.19.5 - Self-contained weather animation playback in `src/components/WeatherLottie.tsx`.
- `@fontsource/dm-serif-display` 5.2.8 - Bundled display font CSS imported by `src/main.tsx` for offline-capable native/web rendering.

**Infrastructure:**
- Capacitor plugins for app lifecycle, status bar, splash screen, keyboard, haptics, local notifications, and in-app review - Native integration points in `src/lib/native-init.ts`, `src/lib/haptics/system.ts`, `src/lib/notifications/morning-notification.ts`, and `src/lib/feedback/app-rate.ts`.
- Native widget bridge - A custom Capacitor plugin connects `src/lib/widget/bridge.ts` to `ios/App/App/Plugins/WidgetBridgePlugin.swift` and `android/app/src/main/java/no/klemeg/app/plugins/WidgetBridgePlugin.kt`.
- `culori` 4.0.2 and Playwright - Developer-side color auditing, screenshots, and product verification under `scripts/` and `tools/product-audit/`, declared in `package.json`.
- Leaflet/react-leaflet and lucide-react are declared in `package.json`, but no active imports are detected under `src/` or `apps/`; do not assume map or icon-library runtime usage from the manifest alone.

## Configuration

**Environment:**
- Vite client configuration uses `VITE_REVENUECAT_PUBLIC_KEY_IOS`, `VITE_REVENUECAT_PUBLIC_KEY_ANDROID`, `VITE_POSTHOG_KEY`, optional `VITE_POSTHOG_HOST`, and native-build `VITE_FORECAST_PROXY`; consumers are `src/lib/billing/revenuecat.ts`, `src/lib/analytics/track.ts`, and `src/lib/met-no/client.ts`.
- Build metadata `VITE_BUILD_SHA`, `VITE_BUILD_DATE`, and `VITE_APP_VERSION` is injected by `vite.config.ts`; `src/lib/app-version.ts` consumes the application version.
- Mobile CI supplies platform keys and signing material through Codemagic environment groups/integrations referenced by name in `codemagic.yaml`; values are not stored in application source.
- Asset-generation tools use `GEMINI_API_KEY` and optional `GEMINI_IMAGE_MODEL` in scripts such as `tools/avatar-gen/generate.ts` and `scripts/generate-avatars.mjs`; browser verification accepts optional `WOOL_*` and `HEADLESS` controls in `scripts/F60.15-pixperfect.mjs` and `scripts/verify-browser-*.mjs`.
- `.env.example` exists as an environment-configuration example and `.gitignore` excludes `.env*` except that example; no environment-file contents are part of this analysis.

**Build:**
- Main build order is TypeScript project checking, Vite main build, and the separate bare-app Vite build, defined in `package.json`, `vite.config.ts`, and `apps/bare/vite.config.ts`.
- Web output is `dist/`, with the secondary app emitted to `dist/bare/`; locations are defined in `capacitor.config.ts` and `apps/bare/vite.config.ts`.
- Native identifiers and WebView behavior are configured in `capacitor.config.ts`; platform projects live in `ios/App/` and `android/app/`.
- TypeScript uses bundler resolution, ES2023 targets, `react-jsx`, no emit, unused-symbol checks, and switch fallthrough checks in `tsconfig.app.json` and `tsconfig.node.json`.

## Platform Requirements

**Development:**
- Use npm with a Node.js release compatible with Vite 8 and TypeScript 6; repository CI validates on Node.js 24 in `.github/workflows/ci.yml`, while mobile builds run on Node.js 22 in `codemagic.yaml`.
- Web development uses `npm run dev`, tests use `npm test`, and production verification uses `npm run lint`, `npm run build`, and `npm run e2e`, all defined in `package.json` and exercised in `.github/workflows/ci.yml`.
- iOS development requires Xcode with iOS 15+ support and Swift Package Manager, as configured in `ios/App/App.xcodeproj/project.pbxproj` and `ios/App/CapApp-SPM/Package.swift`.
- Android development requires JDK 17, Android SDK compile/target 36, minimum SDK 24, and Gradle 8.14.3, as configured in `codemagic.yaml`, `android/variables.gradle`, and `android/gradle/wrapper/gradle-wrapper.properties`.

**Production:**
- Web assets and the Edge weather proxy deploy to Vercel, evidenced by `api/forecast.ts`, `apps/bare/vite.config.ts`, and the production proxy address configured in `codemagic.yaml`.
- iOS packages target iOS 15+ and publish to TestFlight through the Codemagic `ios-internal` workflow in `codemagic.yaml`.
- Android packages target API 36 with minimum API 24 and publish draft bundles to Google Play Internal through the Codemagic `android-internal` workflow in `codemagic.yaml` and settings in `android/app/build.gradle`.

---

*Stack analysis: 2026-07-19*
