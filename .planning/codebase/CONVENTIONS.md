# Coding Conventions

**Analysis Date:** 2026-07-19

## Naming Patterns

**Files:**
- Use PascalCase for React screens and visual components, matching the exported component name: \`src/screens/HjemScreen.tsx\`, \`src/components/BottomTabBar.tsx\`, and \`src/components/controls/SegmentedControl.tsx\`.
- Use a \`use\` prefix plus camelCase for hook files: \`src/hooks/useWeather.ts\`, \`src/hooks/useOverrides.ts\`, and \`src/lib/premium/use-access.ts\`.
- Use lower-case kebab-case for domain helpers, stores, and feature modules: \`src/lib/clothing-engine-v2/material-resolver.ts\`, \`src/state/child-profile.ts\`, and \`src/components/family/care-circle-model.ts\`.
- Name tests \`*.test.ts\` or \`*.test.tsx\`; either place them beside the implementation, as in \`src/lib/weather-tip.test.ts\`, or under a local \`__tests__/\` directory, as in \`src/lib/clothing-engine-v2/__tests__/validation.test.ts\`.

**Functions:**
- Use camelCase for functions and methods, including exported domain operations such as \`recommendV2\`, \`validateRecommendInputV2\`, and \`parseStoredChild\` in \`src/lib/clothing-engine-v2/recommend.ts\`, \`src/lib/clothing-engine-v2/validation.ts\`, and \`src/state/child-profile.ts\`.
- Use PascalCase for React components and \`use\`-prefixed camelCase for hooks, as shown by \`ScreenHeader\` in \`src/components/navigation/ScreenHeader.tsx\` and \`useWeather\` in \`src/hooks/useWeather.ts\`.
- Name callbacks for intent: props use \`onBack\`, \`onChange\`, and \`onNavigate\`, while local handlers use forms such as \`onTouchStart\` and \`openPaywall\` in \`src/components/navigation/ScreenHeader.tsx\`, \`src/App.tsx\`, and \`e2e/purchase-flow.ts\`.

**Variables:**
- Use camelCase for locals and object fields, including \`calibrationOffset\`, \`materialPreference\`, and \`dailyAtHour\` in \`src/lib/clothing-engine-v2/recommend.ts\`, \`src/state/child-profile.ts\`, and \`src/hooks/useWeather.ts\`.
- Use SCREAMING_SNAKE_CASE for module constants and fixed catalogs, such as \`CACHE_TTL_MS\`, \`TAB_TITLES\`, \`GOLD_SCENARIOS\`, and \`SITUATION_PROFILES\` in \`src/lib/met-no/client.ts\`, \`src/App.tsx\`, and \`src/lib/clothing-engine-v2/__tests__/gold-scenarios.ts\`.
- Prefix boolean concepts with \`is\`, \`has\`, \`can\`, \`needs\`, or a state adjective where practical, as in \`isRevenueCatConfigured\`, \`canGoBack\`, \`needsOnboarding\`, and \`initialized\` in \`src/lib/billing/revenuecat.ts\` and \`src/App.tsx\`.
- Prefix intentionally unused parameters or variables with \`_\`; \`@typescript-eslint/no-unused-vars\` explicitly allows that convention in \`eslint.config.js\`.

**Types:**
- Use PascalCase for type aliases, interfaces, classes, and unions: \`RecommendInputV2\`, \`WeatherState\`, \`BottomTabBarProps\`, and \`EngineV2Error\` in \`src/lib/clothing-engine-v2/types.ts\`, \`src/hooks/useWeather.ts\`, \`src/components/BottomTabBar.tsx\`, and \`src/lib/clothing-engine-v2/errors.ts\`.
- Prefer string-literal unions for closed domain vocabularies and discriminants, as in \`Situation\`, \`MaterialPreference\`, \`ThemeMode\`, and \`Drill\` in \`src/lib/clothing-engine-v2/types.ts\`, \`src/state/theme-store.ts\`, and \`src/App.tsx\`.
- Use \`type\` heavily for unions and compact shapes, but use \`interface\` for extensible public object contracts where the local module already does so, such as \`BottomTabBarProps\` in \`src/components/BottomTabBar.tsx\` and \`OverridesAPI\` in \`src/hooks/useOverrides.ts\`.

## Code Style

**Formatting:**
- No Prettier or Biome configuration is present in the package tooling; formatting is maintained in source and checked indirectly by TypeScript/ESLint through \`package.json\` and \`eslint.config.js\`.
- Use two-space indentation, single-quoted strings, trailing commas in multiline literals/calls, and multiline JSX attributes, following \`src/App.tsx\`, \`src/lib/clothing-engine-v2/recommend.ts\`, and \`src/components/navigation/ScreenHeader.tsx\`.
- Preserve the nearest subsystem's semicolon style: the newer engine and shared controls consistently use semicolons in \`src/lib/clothing-engine-v2/recommend.ts\` and \`src/components/controls/SegmentedControl.tsx\`, while older entry code uses fewer semicolons in \`src/main.tsx\`. No formatter in \`package.json\` enforces a repository-wide rewrite.
- Keep CSS values on design tokens where the surrounding UI does so, using variables such as \`var(--surface)\` and \`var(--ink-900)\` in \`src/components/controls/SegmentedControl.tsx\` and \`src/components/navigation/ScreenHeader.tsx\`.

**Linting:**
- Run \`npm run lint\`, which maps to \`eslint .\` in \`package.json\`; the current flat configuration is \`eslint.config.js\`.
- Apply the recommended JavaScript, TypeScript, React Hooks, and Vite React Refresh rule sets configured in \`eslint.config.js\`.
- Keep hooks unconditional and dependency arrays accurate; \`react-hooks\` flat recommended rules are enabled in \`eslint.config.js\`, and the top-level hook ordering is documented in \`src/App.tsx\`.
- Do not leave unused locals or parameters: TypeScript enables \`noUnusedLocals\` and \`noUnusedParameters\` in \`tsconfig.app.json\`; use an underscore only for intentionally unused API-compatible values allowed by \`eslint.config.js\`.
- Keep code compatible with erasable TypeScript syntax and prevent switch fallthrough, as required by \`erasableSyntaxOnly\` and \`noFallthroughCasesInSwitch\` in \`tsconfig.app.json\`.

## Import Organization

**Order:**
1. Import runtime values and types from external packages first, using inline \`type\` modifiers where concise; see \`src/App.tsx\`, \`src/lib/billing/revenuecat.ts\`, and \`e2e/smoke.ts\`.
2. Import local runtime modules next, then local type-only dependencies with \`import type\`; see \`src/lib/clothing-engine-v2/recommend.ts\` and \`src/hooks/useWeather.ts\`.
3. Keep startup-only side-effect imports together at the entry point, including fonts, \`src/styles/design-tokens.css\`, and \`src/i18n/index.ts\` as imported by \`src/main.tsx\`.

**Path Aliases:**
- No source alias is configured: \`tsconfig.app.json\` has no \`baseUrl\` or \`paths\`, so use relative imports as in \`src/hooks/useWeather.ts\` and \`src/components/navigation/ScreenHeader.tsx\`.
- Within \`src/lib/clothing-engine-v2/\` and \`src/lib/wool-layers/\`, use explicit \`.js\` relative specifiers to match the ESM-facing convention in \`src/lib/clothing-engine-v2/recommend.ts\` and \`src/lib/wool-layers/index.ts\`.
- Outside those engine modules, mirror the neighboring file's extension convention; \`src/main.tsx\` imports \`./App.tsx\`, while \`src/App.tsx\` and \`src/hooks/useWeather.ts\` generally use extensionless relative paths.

## Error Handling

**Patterns:**
- Throw a typed domain error when invalid input must stop computation; \`EngineV2Error\` carries stable codes in \`src/lib/clothing-engine-v2/errors.ts\`, and validation raises it from \`src/lib/clothing-engine-v2/validation.ts\`.
- Throw on failed HTTP boundaries and translate errors at the consuming layer; \`src/lib/met-no/client.ts\` throws HTTP errors, while \`src/hooks/useWeather.ts\` catches them and exposes \`status: 'error'\` plus a user-safe message.
- Return explicit fallback values for optional platform integrations: RevenueCat operations return \`false\` or \`null\` after logging in \`src/lib/billing/revenuecat.ts\`, and storage helpers return empty/null defaults in \`src/hooks/useOverrides.ts\` and \`src/lib/geocode/nominatim.ts\`.
- For HTTP handlers, validate early and return status-specific JSON responses rather than leaking exceptions, following \`api/forecast.ts\`.
- Use cancellation guards for async React effects to avoid setting state after unmount, as implemented by the \`cancelled\` flag in \`src/hooks/useWeather.ts\`.

## Logging

**Framework:** Console; application diagnostics use \`console.warn\`/\`console.error\` in \`src/lib/native-init.ts\`, \`src/lib/billing/revenuecat.ts\`, and \`src/components/PaywallDialog.tsx\`, while command-line tools use \`console.log\`/\`console.error\` in \`tools/product-audit/cli.ts\` and \`e2e/smoke.ts\`.

**Patterns:**
- Prefix user-app integration failures with a stable subsystem label such as \`[Babyora]\`, \`[native-init]\`, or \`[morning-notification]\`, following \`src/lib/billing/revenuecat.ts\`, \`src/lib/native-init.ts\`, and \`src/lib/notifications/morning-notification.ts\`.
- Log only caught, actionable boundary failures; expected storage limitations are handled silently in \`src/hooks/useOverrides.ts\`, and unavailable optional analytics is a silent no-op in \`src/lib/analytics/track.ts\`.
- Keep CLI success/failure text deterministic and convert failure to a nonzero exit status, following \`tools/product-audit/cli.ts\` and \`e2e/smoke.ts\`.

## Comments

**When to Comment:**
- Use module headers to record the feature contract, safety invariant, accessibility rule, or integration constraint, as in \`src/lib/clothing-engine-v2/recommend.ts\`, \`src/components/controls/SegmentedControl.tsx\`, and \`api/forecast.ts\`.
- Explain why a fallback, ordering rule, or seemingly unusual implementation exists; examples include safety running last in \`src/lib/clothing-engine-v2/recommend.ts\`, render-time state adjustment in \`src/hooks/useWeather.ts\`, and focus behavior in \`src/components/navigation/ScreenHeader.tsx\`.
- Keep comments close to the protected behavior and use the repository's Norwegian product vocabulary where the surrounding module does, as in \`src/App.tsx\` and \`src/state/child-profile.ts\`.

**JSDoc/TSDoc:**
- Use JSDoc for exported contracts, storage formats, privacy rules, and non-obvious parameters/returns, following \`src/hooks/useOverrides.ts\`, \`src/state/child-profile.ts\`, and \`src/lib/analytics/track.ts\`.
- Use short property-level documentation for fields whose unit, persistence meaning, or safety role is not obvious, as in \`ChildProfile\` at \`src/state/child-profile.ts\` and \`WeatherState\` at \`src/hooks/useWeather.ts\`.

## Function Design

**Size:** Keep domain functions focused and composable, following the staged pipeline in \`src/lib/clothing-engine-v2/recommend.ts\` and the pure parsers in \`src/state/child-profile.ts\`. UI screens are substantially larger in \`src/screens/InnstillingerScreen.tsx\` and \`src/screens/OnboardingScreen.tsx\`; place new reusable or testable logic in sibling modules such as \`src/components/family/care-circle-model.ts\` and \`src/components/instrument/instrument-logic.ts\`.

**Parameters:** Use a typed object when a function accepts a domain request with multiple related fields, as in \`RecommendInputV2\` consumed by \`src/lib/clothing-engine-v2/recommend.ts\`; use short positional parameters for compact helpers such as \`extractDailyAtHour(forecast, refHour, days)\` in \`src/lib/met-no/client.ts\`.

**Return Values:** Give exported domain and boundary functions explicit return types, including nullable/fallback cases such as \`ChildProfile | null\`, \`Promise<boolean>\`, and \`WeatherState\` in \`src/state/child-profile.ts\`, \`src/lib/billing/revenuecat.ts\`, and \`src/hooks/useWeather.ts\`. Return new objects/arrays from engine operations rather than mutating inputs, as enforced by \`src/lib/clothing-engine-v2/__tests__/safety.test.ts\`.

## Module Design

**Exports:** Prefer named exports for domain functions, hooks, types, and shared controls, as in \`src/lib/clothing-engine-v2/recommend.ts\`, \`src/hooks/useWeather.ts\`, and \`src/components/controls/SegmentedControl.tsx\`. Preserve default exports where the UI module already exposes one, including \`src/App.tsx\`, \`src/screens/HjemScreen.tsx\`, and \`src/components/BottomTabBar.tsx\`.

**Barrel Files:** Use barrels only for deliberate public feature APIs: \`src/lib/clothing-engine-v2/index.ts\`, \`src/lib/wool-layers/index.ts\`, \`src/lib/research/index.ts\`, and \`src/i18n/index.ts\`. Most components, hooks, and stores are imported directly from their implementation files, as shown in \`src/App.tsx\` and \`src/main.tsx\`.

---

*Convention analysis: 2026-07-19*
