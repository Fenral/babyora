# Codebase Structure

**Analysis Date:** 2026-07-19

## Directory Layout

```text
wool-app-main/
├── .github/workflows/       # Repository CI (`.github/workflows/ci.yml`)
├── .planning/codebase/      # Generated GSD codebase maps
├── android/                 # Capacitor Android host and plugin code
├── api/                     # Vercel edge/serverless handlers
├── apps/bare/               # Separate unstyled diagnostic application
├── docs/                    # Product, process, design, evidence, and handoff documents
├── e2e/                     # Playwright smoke and purchase-flow programs
├── icons/                   # Packaged icon source variants
├── ios/                     # Capacitor iOS host, plugin, and widget extension
├── proposed/                # Proposed catalog artifacts outside production source
├── public/                  # Vite-served artwork, icons, avatars, and review mocks
├── resources/               # Capacitor icon and splash source images
├── review/                  # Committed visual-review evidence and generated candidates
├── screenshots/             # Committed UI verification screenshots
├── scripts/                 # Build, generation, export, audit, and browser-verification scripts
├── src/                     # Main React/TypeScript application
│   ├── components/          # Reusable UI and feature components
│   ├── data/                # Static catalog/content data and mappings
│   ├── hooks/               # Reusable React lifecycle/integration hooks
│   ├── i18n/                # i18next bootstrap and locale JSON
│   ├── lib/                 # Domain logic and integration adapters
│   ├── screens/             # Lazy-loaded route-level UI
│   ├── state/               # Child context and Zustand stores
│   ├── styles/              # Global design tokens and motion grammar
│   └── types/               # Cross-feature navigation types
├── tools/                   # Product/design/garment audit tooling and run artifacts
├── verify/                  # Committed verification images
├── index.html               # Main Vite HTML entry
├── package.json             # Runtime packages and task commands
├── vite.config.ts           # Main web build configuration
└── capacitor.config.ts      # Native wrapper configuration
```

## Directory Purposes

**`src/`:**
- Purpose: Contains all production web-layer code for the main Babyora application.
- Contains: React components, route screens, state, hooks, domain logic, integrations, static data, translations, and CSS.
- Key files: `src/main.tsx`, `src/App.tsx`, `src/styles/design-tokens.css`

**`src/screens/`:**
- Purpose: Contains screen-sized, lazy-loaded application surfaces selected by `src/App.tsx`.
- Contains: Root tabs, onboarding, guide drills, clothing flow, and settings/family UI; onboarding support is under `src/screens/onboarding/`.
- Key files: `src/screens/HjemScreen.tsx`, `src/screens/UkeScreen.tsx`, `src/screens/GuideHubScreen.tsx`, `src/screens/FamilieScreen.tsx`, `src/screens/OnboardingScreen.tsx`

**`src/components/`:**
- Purpose: Contains reusable presentation and interaction units shared by screens.
- Contains: Global components plus feature groupings in `src/components/controls/`, `src/components/family/`, `src/components/instrument/`, `src/components/navigation/`, `src/components/outfit/`, `src/components/paywall/`, `src/components/planning/`, and `src/components/profile/`.
- Key files: `src/components/BottomTabBar.tsx`, `src/components/PaywallDialog.tsx`, `src/components/PlaggDetailSheet.tsx`, `src/components/instrument/TemperatureInstrument.tsx`

**`src/lib/`:**
- Purpose: Contains presentation-independent domain behavior and external/native adapters.
- Contains: Recommendation engines, weather client/transforms, premium/billing, analytics, research, planning, recommendation view models, notifications, widgets, GDPR, garment ownership, geocoding, haptics, and shared helpers.
- Key files: `src/lib/wool-layers/recommend.ts`, `src/lib/clothing-engine-v2/recommend.ts`, `src/lib/met-no/client.ts`, `src/lib/premium/use-access.ts`, `src/lib/native-init.ts`

**`src/state/`:**
- Purpose: Contains shared mutable state and persistence facades.
- Contains: Child React context/provider, stored-child parser, persisted Zustand preference/access stores, and a session-only swap store.
- Key files: `src/state/children-store.tsx`, `src/state/children-provider.tsx`, `src/state/child-profile.ts`, `src/state/subscription-store.ts`, `src/state/theme-store.ts`

**`src/hooks/`:**
- Purpose: Contains reusable React hooks that connect components to weather, device settings, location refresh, haptics, focus, and UI lifecycle behavior.
- Contains: Side-effect hooks and colocated hook tests under `src/hooks/__tests__/`.
- Key files: `src/hooks/useWeather.ts`, `src/hooks/useAutoLocationRefresh.ts`, `src/hooks/useNativeSettings.ts`, `src/hooks/useHaptics.ts`

**`src/data/`:**
- Purpose: Contains static, typed datasets and catalog-to-asset mappings.
- Contains: Garment metadata/illustrations/categories, Norwegian city search data, and winter-program content.
- Key files: `src/data/garment-info.ts`, `src/data/garment-illustrations.ts`, `src/data/no-cities.ts`, `src/data/vinterprogram.ts`

**`src/i18n/`:**
- Purpose: Configures language detection and bundled translations.
- Contains: `src/i18n/index.ts` and locale JSON files in `src/i18n/locales/`.
- Key files: `src/i18n/index.ts`, `src/i18n/locales/no.json`, `src/i18n/locales/en.json`

**`api/`:**
- Purpose: Contains deployment-hosted HTTP functions that cannot run inside the browser/WebView.
- Contains: The coordinate-validating met.no proxy and cache policy.
- Key files: `api/forecast.ts`

**`apps/bare/`:**
- Purpose: Provides a separately built semantic-HTML view of core weather and recommendation behavior without main-app design code.
- Contains: Its own HTML entry, React entry, app component, and Vite configuration.
- Key files: `apps/bare/index.html`, `apps/bare/main.tsx`, `apps/bare/BareApp.tsx`, `apps/bare/vite.config.ts`

**`ios/`:**
- Purpose: Contains the Capacitor iOS application project and the iOS widget implementation.
- Contains: Xcode project metadata, app delegate/entitlements/assets, Capacitor plugin bridge, SwiftUI widget target, and SPM package glue.
- Key files: `ios/App/App/AppDelegate.swift`, `ios/App/App/Plugins/WidgetBridgePlugin.swift`, `ios/App/BabyoraWidget/BabyoraWidget.swift`, `ios/App/App.xcodeproj/project.pbxproj`

**`android/`:**
- Purpose: Contains the Capacitor Android application project and native bridge code.
- Contains: Gradle project files, manifest/resources, the `BridgeActivity` host, and a widget snapshot plugin stub.
- Key files: `android/app/src/main/AndroidManifest.xml`, `android/app/src/main/java/no/klemeg/app/MainActivity.java`, `android/app/src/main/java/no/klemeg/app/plugins/WidgetBridgePlugin.kt`, `android/app/build.gradle`

**`e2e/`:**
- Purpose: Contains executable end-to-end checks against the built application.
- Contains: Boot/render smoke coverage and a purchase-flow scenario.
- Key files: `e2e/smoke.ts`, `e2e/purchase-flow.ts`

**`tools/`:**
- Purpose: Contains maintained audit/generation programs plus committed evidence and run outputs.
- Contains: Product audit TypeScript in `tools/product-audit/`, garment audit datasets in `tools/garment-audit/`, design-loop artifacts in `tools/design-loop/`, avatar generation in `tools/avatar-gen/`, and App Store setup code in `tools/appstore/`.
- Key files: `tools/product-audit/cli.ts`, `tools/product-audit/config.ts`, `tools/avatar-gen/generate.ts`, `tools/contrast_check.py`

**`scripts/`:**
- Purpose: Contains repository-level one-off and repeatable automation invoked directly or through `package.json`.
- Contains: Engine review export, rule documentation, asset generation/post-processing, audit orchestration, and Playwright visual verification.
- Key files: `scripts/export-engine-v2-review.ts`, `scripts/generate-rules-docs.ts`, `scripts/verify-all.mjs`, `scripts/verify-browser-forside.mjs`

**`docs/`:**
- Purpose: Holds the repository's durable product/process/design source of truth and verification evidence.
- Contains: Current handoff/decision/process files, approved plans/specs under `docs/superpowers/`, active design records, screenshots, and lower-precedence archive material under `docs/archive/`.
- Key files: `docs/CLAUDE-START-HERE.md`, `docs/PROSESS-PLAN-TIL-KODE.md`, `docs/DECISION-LOG.md`, `docs/CURRENT-HANDOFF.md`

**`public/`:**
- Purpose: Supplies files copied unchanged into the Vite build and accessed by stable public paths.
- Contains: Production illustrations/icons/weather assets alongside numerous design and screen mock collections.
- Key files: `public/illustrations/`, `public/icons/`, `public/avatars/`, `public/weather-bgs/`

## Key File Locations

**Entry Points:**
- `index.html`: Main HTML document and pre-React document/theme setup.
- `src/main.tsx`: Main React composition root and runtime initializer.
- `src/App.tsx`: Application shell and in-memory route switch.
- `api/forecast.ts`: Vercel edge request entry for forecasts.
- `apps/bare/main.tsx`: React entry for the separate bare build.
- `ios/App/App/AppDelegate.swift`: iOS native host entry.
- `android/app/src/main/java/no/klemeg/app/MainActivity.java`: Android native host entry.

**Configuration:**
- `package.json`: Package versions and build/test/lint/audit/E2E commands.
- `vite.config.ts`: React/Vite build and injected build metadata.
- `apps/bare/vite.config.ts`: Independent `/bare/` build and output configuration.
- `capacitor.config.ts`: App id/name, native platform settings, and web output directory.
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`: TypeScript project references and compilation scopes.
- `eslint.config.js`: Repository lint configuration.
- `.github/workflows/ci.yml`: GitHub validation pipeline.
- `codemagic.yaml`: iOS TestFlight and Android internal-build workflows.
- `.env.example`: Environment configuration example is present; its contents are intentionally not part of this map.

**Core Logic:**
- `src/lib/wool-layers/recommend.ts`: Visible production recommendation pipeline.
- `src/lib/wool-layers/finalize-safety.ts`: Mandatory post-mutation safety boundary.
- `src/lib/clothing-engine-v2/recommend.ts`: Engine 2.0 deterministic pipeline.
- `src/lib/clothing-engine-v2/feature-flags.ts`: Engine 2.0 static display/shadow flags and selector.
- `src/lib/met-no/client.ts`: Cached forecast fetch and weather projections.
- `src/state/children-provider.tsx`: Child aggregate behavior and persistence lifecycle.
- `src/lib/premium/use-access.ts`: Screen-facing premium access facade.

**Testing:**
- `src/**/__tests__/*.test.ts`, `src/**/__tests__/*.test.tsx`: Colocated module and hook/component tests.
- `src/**/*.test.ts`: Colocated tests for data and standalone library modules.
- `tools/product-audit/*.test.ts`: Audit-tool unit tests.
- `e2e/smoke.ts`: Built-app boot/render smoke test used by CI.
- `e2e/purchase-flow.ts`: Browser-driven premium flow coverage.
- `android/app/src/test/`, `android/app/src/androidTest/`: Capacitor-generated Android example test locations.

## Naming Conventions

**Files:**
- Route components use PascalCase plus `Screen.tsx`, for example `src/screens/HjemScreen.tsx` and `src/screens/OnboardingScreen.tsx`.
- React components use PascalCase `.tsx`, for example `src/components/BottomTabBar.tsx` and `src/components/profile/MaterialPreferenceSheet.tsx`.
- Hooks use camelCase `use*.ts` or `use*.tsx`, for example `src/hooks/useWeather.ts` and `src/hooks/useOverrides.ts`.
- Domain modules use lowercase kebab-case `.ts`, for example `src/lib/clothing-engine-v2/thermal-intent.ts` and `src/lib/planning/change-events.ts`; a few compact service names use lowercase words such as `src/lib/met-no/client.ts`.
- State modules use kebab-case `*-store.ts` or role names such as `src/state/children-provider.tsx` and `src/state/child-profile.ts`.
- Tests are `.test.ts`/`.test.tsx`, either colocated beside the module or under `__tests__/`, for example `src/data/garment-info.test.ts` and `src/lib/clothing-engine-v2/__tests__/safety.test.ts`.
- Native types use platform conventions: PascalCase Swift files such as `ios/App/BabyoraWidget/WidgetSnapshot.swift`, PascalCase Java/Kotlin files such as `android/app/src/main/java/no/klemeg/app/MainActivity.java`.

**Directories:**
- Feature/domain directories use lowercase kebab-case, for example `src/lib/clothing-engine-v2/`, `src/lib/weather-notes/`, and `src/components/paywall/`.
- Test directories are named `__tests__`, for example `src/hooks/__tests__/` and `src/lib/widget/__tests__/`.
- Route-level UI remains flat in `src/screens/` unless it has a supporting subfeature, as in `src/screens/onboarding/`.
- Native directories follow generated Capacitor/Xcode/Gradle conventions under `ios/App/` and `android/app/src/`.

## Where to Add New Code

**New Feature:**
- Primary code: Put a route surface in `src/screens/<Feature>Screen.tsx`, reusable UI in `src/components/<feature>/`, pure policy/transforms in `src/lib/<feature>/`, and static content/mappings in `src/data/`.
- Tests: Place pure-module tests in `src/lib/<feature>/__tests__/` or beside small modules as `src/<area>/<name>.test.ts`; use `src/hooks/__tests__/` for hook tests and `e2e/` only for built-app journeys.
- Routing: Register lazy screens and tab/drill selection in `src/App.tsx`; update root-tab types/data in `src/types/nav.ts` and rendering in `src/components/BottomTabBar.tsx` only when the four-root information architecture changes.

**New Component/Module:**
- Implementation: Put broadly shared components directly in `src/components/`; put domain-specific components in `src/components/<domain>/`, following `src/components/planning/` and `src/components/profile/`.
- State: Add independent shared preferences/access state in `src/state/<feature>-store.ts`; extend the child aggregate through `src/state/children-store.tsx`, `src/state/children-provider.tsx`, and `src/state/child-profile.ts` together.
- Recommendation behavior: Extend the visible legacy pipeline under `src/lib/wool-layers/` and preserve `src/lib/wool-layers/finalize-safety.ts`; Engine 2.0 work stays under `src/lib/clothing-engine-v2/` with scenario tests in its `__tests__/` directory.
- External service: Put the client/SDK adapter under `src/lib/<service>/`; place server-required HTTP behavior under `api/`; keep direct SDK imports out of new screen code in `src/screens/`.
- Native capability: Add a TypeScript facade under `src/lib/`, matching iOS code under `ios/App/App/Plugins/` or the relevant target, and matching Android code under `android/app/src/main/java/no/klemeg/app/`.

**Utilities:**
- Shared helpers: Put small cross-feature pure helpers in `src/lib/utils/`; keep feature-specific helpers with their domain in `src/lib/<feature>/` rather than growing an undifferentiated utility module.
- React lifecycle helpers: Put reusable behavior in `src/hooks/use<Name>.ts`, following `src/hooks/useWeather.ts` and `src/hooks/useAutoLocationRefresh.ts`.
- Repository automation: Put product-grade multi-module tools in `tools/<tool>/`; put build/export/generation/verification entry scripts in `scripts/` and expose repeated commands through `package.json`.

## Special Directories

**`.planning/codebase/`:**
- Purpose: Contains generated codebase reference documents for planning/execution agents.
- Generated: Yes, by the mapper workflow writing `.planning/codebase/*.md`.
- Committed: Not detected in the current tracked-file list; `.planning/codebase/` is empty before this map.

**`dist/`:**
- Purpose: Contains the Vite production web output consumed by deployments and Capacitor synchronization.
- Generated: Yes, by `npm run build` from `package.json` and `vite.config.ts`.
- Committed: No; `dist` is excluded by `.gitignore`.

**`node_modules/`:**
- Purpose: Contains installed npm dependencies for `package.json`/`package-lock.json`.
- Generated: Yes, by npm installation.
- Committed: No; `node_modules` is excluded by `.gitignore`.

**`ios/App/App/public/` and `android/app/src/main/assets/public/`:**
- Purpose: Receive synchronized web assets for the native Capacitor hosts.
- Generated: Yes, by `npx cap sync` in `codemagic.yaml`.
- Committed: No; both paths are excluded by `.gitignore`.

**`public/`:**
- Purpose: Holds stable-path browser assets, production artwork, and numerous mock/review collections copied by Vite.
- Generated: Mixed; production assets and checked-in generated visual artifacts coexist under `public/`.
- Committed: Yes; tracked files include `public/illustrations/`, `public/icons/`, `public/avatars/`, and mock directories.

**`tools/product-audit/runs/`:**
- Purpose: Stores screenshot captures, manifests, analysis, scores, reports, and next prompts emitted by `tools/product-audit/cli.ts`.
- Generated: Yes, by `npm run audit:prepare` and `npm run audit:finalize` from `package.json`.
- Committed: Yes; existing run artifacts are present in the tracked `tools/` tree.

**`review/`, `screenshots/`, and `verify/`:**
- Purpose: Preserve visual candidates, audit evidence, and screenshot-based verification outside production runtime code.
- Generated: Mixed; scripts under `scripts/` and manual review workflows both contribute artifacts.
- Committed: Yes; all three roots have tracked files, while `docs/screenshots/` also has current untracked files.

**`docs/archive/`:**
- Purpose: Preserves lower-precedence historical Codex outputs and plan copies under the hierarchy defined by `docs/CLAUDE-START-HERE.md`.
- Generated: No; it is maintained as documentation history.
- Committed: Yes; archived files are tracked under `docs/archive/codex-2026-07-13/`.

**`.superpowers/`:**
- Purpose: Contains local planning/brainstorm workflow material outside the durable repository source of truth.
- Generated: Mixed, by local workflow use.
- Committed: No; `.superpowers/` is excluded by `.gitignore`.

---

*Structure analysis: 2026-07-19*
