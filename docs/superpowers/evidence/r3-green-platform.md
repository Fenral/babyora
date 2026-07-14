# R3 — Grønn arbeidsplattform: pakke-evidens

**Dato:** 2026-07-14 · **Basis:** commit `da217fb` (R2) · **Gate: test + audit + build + lint + E2E grønne på samme SHA — BESTÅTT**

Fersk verifisering: [r3-green-verification.txt](./r3-green-verification.txt) — lint **0 problemer** (fra 17 errors + 2 warnings), test **249/249**, audit **19/19**, build **grønn**, E2E-røyk **2/2**.

## R3.1 — Atferdsbevarende lint-opprydding (19 → 0)

Alle rettelser er mekaniske/strukturelle; ingen terskler, copy eller produktlogikk endret. Full testsuite grønn etter hver kategori.

| Fil | Problem | Fix |
|---|---|---|
| eslint.config.js | — | `scripts/*.workflow.js` i ignores (Claude Workflow-DSL, ikke node-kode); `argsIgnorePattern: '^_'` (underscore-konvensjon for API-kompat-parametre → løser `ownership.ts _isPremium`) |
| scripts/generate-rules-docs.ts | 2× no-unused-vars | Fjernet ubrukt import `bandForTemp` + konstant `BASE_URL` |
| src/hooks/useTooltipSeen.ts | set-state-in-effect | Render-justering (React-dokumentert «adjust state on prop change») |
| src/hooks/useOverrides.ts | set-state-in-effect | Render-justering på childId-bytte |
| src/hooks/useWeather.ts | set-state-in-effect | Render-justering på param-endring (`fetchKey`); mount dekkes av initial `'loading'` |
| src/hooks/useCountUp.ts | set-state-in-effect | RM-snap i one-shot rAF med cleanup (async setState; fortsatt instant) |
| src/hooks/useAutoLocationRefresh.ts | refs-during-render | Ref-synk i effect; konsumenter leser i async callbacks |
| src/components/WeatherLottie.tsx | set-state-in-effect | Render-justering på condition-bytte |
| src/screens/FinnAntrekkScreen.tsx | set-state-in-effect | Engangsinit av slidere via render-justering; guard-ref → state (leses under render) |
| src/screens/InnstillingerScreen.tsx | set-state-in-effect | Form-reset ved dialog-åpning via render-justering (blank FØR fokus-effekten) |
| src/screens/PaakledningScreen.tsx | set-state-in-effect + 2 unused disables | Instant-gren: no-op-setter fjernet (state alt initialisert), statusMsg → setTimeout(0) m/cleanup; koreografi-gren: statusMsg → timer; 2 unødvendige eslint-disable slettet |
| src/screens/UkeScreen.tsx | preserve-manual-memoization | `activeDob` hoistet så deps matcher inferens |
| src/screens/HjemScreen.tsx | 2× react-refresh | `tempAxisFor` → **src/lib/temp-axis.ts** (ny), `stageSrc` → **src/lib/avatar-stage.ts** (ny); PaakledningScreen-import oppdatert |
| src/state/children-store.tsx | react-refresh | `ChildrenProvider` → **src/state/children-provider.tsx** (ny); store-filen eier typer/context/useChildren/hjelpere (@internal-eksportert); main.tsx-import oppdatert |

**A11y-review (accessibility-lead, batch):** APPROVE WITH NOTES — verifisert at ingen live-region/fokus/ARIA-flate berøres; Paakledning-statusMsg ett makrotask senere annonseres *mer* pålitelig (etablert live-region); begge hygiene-punkter (timer-cleanup, rAF-avbrudd) er implementert.

## R3.2 — CI

`.github/workflows/ci.yml`: lint → test → audit → build → Playwright chromium → E2E-røyk på push/PR mot main. Node 24, npm ci, 20-min timeout.

## R3.3 — E2E-røyktest

`e2e/smoke.ts` (+ `npm run e2e`): bygger på **eksisterende** playwright-devDependency (gjenbruk fra product-audit — ingen nye avhengigheter). Server dist via `vite preview`, 390×844:
1. Fersk bruker → onboarding rendrer (`main h1` synlig).
2. `?seed=demo` → app-skall med bunn-nav «Hjem».

Fatal = pageerror, console-error eller 4xx/5xx på ressurser. Presist unntak: `/api/forecast` (vær-proxy finnes ikke i preview — håndtert app-tilstand) og met.no-nettverksfeil. Ekte asset-/chunk-404 feiler testen.

## Kjente rester (bevisst utenfor R3)

- React-DevTools-«Download»-info og evt. tredjeparts-noise er ikke-blokkerende.
- Fast-Refresh-strukturen i children-store løses ytterligere av Motor V2 Task 13 (child-profile.ts) — R3-splitten er kompatibel med den planen.
