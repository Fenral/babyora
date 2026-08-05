# gjeld-arkitektur
# Babyora — Fase 1-audit: Arkitektur og teknisk gjeld

Dokumentasjon av det som ER, per 2026-08-05, basert på faktisk kodelesing i `C:/Users/siver/Downloads/trainer-marketplace-master1/babyora`. Alle påstander merket som fakta har fil:linje- eller kommando-belegg; antakelser og vurderinger er skilt ut.

## 1. Overordnet struktur

Repoet er en Vite 8 + React 19.2 + TypeScript 6.0-app med Capacitor 8 for iOS/Android. Kildekoden i `src/` er 92 355 linjer TS/TSX (243 kildefiler utenom tester). Git-historikken er 668 commits, alle fra juli 2026 og senere.

**Hovedmapper:**

| Mappe | Rolle | Status |
|---|---|---|
| `src/` | Hovedappen (screens, components, lib, state, hooks, data, styles, i18n) | Aktiv |
| `apps/bare/` | Standalone «naken» build av motoren uten design | Aktiv (bygges i `npm run build`) |
| `api/` | Vercel edge function: met.no-proxy (`api/forecast.ts`) | Aktiv |
| `android/`, `ios/` | Committede native-prosjekter (inkl. `ios/App/BabyoraWidget`) | Aktiv |
| `e2e/` | Playwright-skript kjørt via tsx (ikke @playwright/test) | Aktiv (CI) |
| `tools/` | Verifikasjonsverktøy: design-doctrine-lint, verify-hjem, skjermbilde-rigger, chatgpt-driver, product-audit | Aktiv |
| `scripts/` | ~100 filer, hovedsakelig engangs asset-genererings-pipelines (F60/F79/F80-prefiks, Gemini-bildegen) | Overveiende historisk |
| `docs/` | 300 git-trackede filer, blanding av bindende styringsdokumenter og historiske faserapporter | Blandet (se §7) |
| `public/` | **602 MB** statiske bilder | Delvis død vekt (se §5) |
| `review/`, `proposed/`, `katalog-audit/`, `.planning/` | Eldre analyse-/planrunder | Historisk |

**Styringskjede (fakta fra `CLAUDE.md` og `AGENTS.md`):** `AGENTS.md` → `docs/CLAUDE-START-HERE.md` → `docs/DECISION-LOG.md` → … → arkiv. Aktivt arbeid fra 2026-08-05 styres av `docs/design-lab/00-master-brief.md` med `docs/design-lab/state.json` (activePhase: 1, «Product Audit» — dvs. denne auditen er selv fase 1 i den planen).

## 2. apps/bare — hva er den?

`apps/bare/` er en bevisst «motor uten design»-build, opprettet 2026-06-21 på eiers bestilling («ta med alt av data, motor osv men fjern alt av design») — dokumentert i header-kommentaren i `apps/bare/BareApp.tsx:1-17`. Fakta:

- Egen Vite-config (`apps/bare/vite.config.ts`): `base: '/bare/'`, output til `dist/bare`, gjenbruker `src/lib` + `src/hooks` + `src/data`, null import fra `src/styles`/`src/screens`/`src/components`.
- `BareApp.tsx` er 171 linjer, bruker `useWeather`, `recommend` (wool-layers) og `garmentIdFor` direkte. Hardkodede Elverum-koordinater (60.8867, 11.5614).
- Bygges alltid: `npm run build` kjører `build:bare` (package.json scripts). Live på wool-app.vercel.app/bare/.

Vurdering: dette er et rent referanse-/sandkassespor for redesign — nyttig for designprogrammet fordi den viser motoren isolert, men den dobler build-tiden marginalt og er et ekstra vedlikeholdspunkt.

## 3. Capacitor-oppsettet og native-følelse

**Fakta:**
- `capacitor.config.ts`: appId `no.klemeg.app`, appName «Babyora», `webDir: 'dist'`, iOS `contentInset: 'always'`, Android `androidScheme: 'https'`. App-ID låst med advarselskommentar.
- 11 Capacitor-pakker i dependencies: core/cli/android/ios 8.3.4, app, geolocation, haptics, keyboard, local-notifications, splash-screen, status-bar, pluss `@capacitor-community/in-app-review` og `@revenuecat/purchases-capacitor` 13.1.4.
- `src/lib/native-init.ts` (kalles fra `src/main.tsx` etter render): StatusBar `Style.Dark`, SplashScreen.hide med 200 ms fade, Keyboard `KeyboardResize.Native` (kun iOS), Android back-knapp → history.back() eller `App.minimizeApp()`. Alt gated på `Capacitor.isNativePlatform()` med try/catch per kall.
- Haptikk i to lag: plattformadapter `src/lib/haptics/system.ts` (lazy-import av @capacitor/haptics, native-gate, tiers selection/light/medium/success/error) + semantisk vokabular-lag `src/lib/haptics.ts` som per egen doc-kommentar er «en TYNN overbygning … IKKE en ny parallell implementasjon». Haptikk brukes i 14 komponent-/skjermfiler.
- iOS-prosjektet har et committet widget-target (`ios/App/BabyoraWidget`); widget-injection i CI ble fjernet etter build-feil (kommentar i `codemagic.yaml` ~linje 86-90), widget legges til manuelt i Xcode.
- Codemagic-pipeline (`codemagic.yaml`): rm -rf dist → npm run build → `cap sync ios` → TestFlight-buildnummer hentes fra Apple → selvhelbredende sertifikatrotasjon (sletter eldste cert ved Apples 2-cert-tak).

Vurdering: native-følelse-grunnmuren (statusbar/splash/keyboard/back/haptikk) er reelt implementert og testet (`src/lib/haptics/__tests__/system.test.ts`), ikke bare planlagt.

## 4. Testdekning — hva dekkes IKKE

**Fakta:** 180 testfiler totalt i repoet (172 i src/apps/tools/e2e; resten i api/, scripts/). Ingen vitest.config — vitest kjører med defaults. Fordeling (topp): `src/styles/__tests__` 16, `src/lib/planning` 16, `src/screens` 15, `src/components/hjem` 15, `src/lib/clothing-engine-v2` 12, `src/hooks` 8.

Et særtrekk: 16 av testfilene er **design-doktrine-tester mot CSS/tokens** (`design-tokens-v2.*.test.ts`, `opacity-demping`, `spacing-skala`, `vedtak-register` osv.) — testsuiten håndhever designregler, ikke bare logikk. Dette er koblet til `tools/design-doctrine-lint.mjs`-løypa i `CLAUDE.md`.

**Udekket (verifisert ved fravær av testfiler/grep):**
- **Skjermer uten egne tester:** InnstillingerScreen, FamilieScreen, VinterprogramScreen, PlaggbibliotekScreen, VarmEllerKaldScreen (TogGuideScreen kun indirekte via `guide-routing.test.tsx`). Merk: FamilieScreen er nest største lazy-chunk (105 kB).
- **Betalingslaget:** `src/lib/billing/revenuecat.ts` har 0 tester. Kjøpsflyt dekkes kun av e2e mot web-mock (se §6) — StoreKit/Billing-koden er uverifisert i repoet.
- `src/lib/gdpr/local-data.ts` — 0 tester.
- `src/lib/notifications/morning-notification.ts` — 0 tester.
- `src/components/navigation/` (1 komponent) og `src/components/profile/` (1 komponent) — 0 tester.
- `src/lib/location/` — 0 tester (geocode har 1).
- `App.tsx` (868 linjer, ruting + gating) har kun to smale tester (finn-antrekk-drill, plaggbib-opener).

Kjent flakiness dokumentert i `docs/design-lab/state.json`: «2 flaky filsystemtester i verify-phase3-exact-sha.test.ts under full parallell vitest-last».

## 5. Bundle-størrelse og assets — den store gjelden

**Fakta fra faktisk `npx vite build` (kjørt under auditen, exit 0):**
- `dist/assets/index-*.js`: **603,23 kB** (gzip 185,89 kB)
- `dist/assets/UkeScreen-*.js`: **595,67 kB** (gzip 98,09 kB)
- Vite/rolldown gir eksplisitt advarsel: «Some chunks are larger than 500 kB after minification».
- Screens er ellers godt code-splittet via React.lazy (`src/App.tsx:89-118`, «Native-feel #9»).

**Rotårsak UkeScreen-chunken (verifisert):** `src/lib/planning/snart-climate.ts:1-2` importerer statisk `climate-1991-2020-v1.json` (69 kB) **og** `climate-1991-2020-v1.manifest.json` (477 kB). Manifestet er i hovedsak sha256-er, kildeattribusjon og grid-bindinger — verifikasjonsmetadata som bundles inn i klienten.

**Asset-vekten:** `public/` er **602 MB** og kopieres uavkortet inn i `dist/` (604 MB) ved hver build:
- `public/alle-bilder/` 294 MB (440 filer) — **refereres ikke fra src i det hele tatt** (grep tomt): ren dump av genererte bilderunder.
- `public/illustrations/` 174 MB og `public/avatars/` 103 MB — disse ER runtime-referert (garment-illustrations, avatar-stage m.fl.), men størrelsen er ubeskåret.
- Git-pakken er 447 MiB — bildene er committet.
- `capacitor.config.ts` har `webDir: 'dist'` og `codemagic.yaml` kjører `cap sync ios` rett etter build uten noe prunetrinn (grep etter filtrering ga ingen treff i yaml).

## 6. E2E-oppsettet

**Fakta:** Ingen @playwright/test-runner. E2E er håndskrevne tsx-skript som bruker rå `playwright`/chromium (devDependency): `e2e/smoke.ts` (booter bygget app via vite preview, sjekker onboarding-render + `?seed=demo`-skall, uncaught errors = exit 1) og `e2e/purchase-flow.ts` (driver hard-paywall-gaten og kjøp via **web/dev-mock** — eksplisitt «uten StoreKit», header linje 4-6). Testhåndtak: `?seed=demo`, `?seed=demo&entitlement=none` (dokumentert i `src/state/subscription-store.ts`).

CI (`.github/workflows/ci.yml`): npm ci → lint → test → audit:test → build → playwright install chromium → e2e → `verify:hjem`. `e2e/planlegg.ts`, `e2e/home-outfit-motion.ts` og `e2e/outfit-truth.ts` er ikke wiret inn i package.json-scripts (kjøres manuelt via tsx).

## 7. Avhengighetsrisiko

**Verifiserte fakta:**
- **`leaflet` + `react-leaflet` + `@types/leaflet` er 100 % ubrukt.** Grep over src/apps/e2e/tools/scripts/api gir null treff utenfor node_modules. Tre pakker i dependencies uten én import.
- **`lucide-react` er ubrukt** (0 treff i src).
- **`posthog-js` er de facto død i nåværende build:** `src/lib/analytics/track.ts:106-110` gater på `VITE_POSTHOG_KEY` og lazy-importerer posthog-js — men strengen «posthog» finnes ikke i noen fil i `dist/` (grep tomt). Uten nøkkel i miljøet blir hele analytics-sporet kompilert bort. `track()`-kall i appen er dermed no-ops i det faktiske bygget.
- **Font-dubletter:** `@fontsource-variable/inter`, `@fontsource-variable/schibsted-grotesk`, `@fontsource/schibsted-grotesk`, `@fontsource-variable/fraunces`, `@fontsource/fraunces` ligger i dependencies, men `src/main.tsx:3-13` dokumenterer at Inter/Schibsted-importene er fjernet og at Schibsted+Fraunces nå self-hostes fra `public/fonts/` — kun `@fontsource/dm-serif-display` importeres faktisk.
- `motion` brukes i 4 filer, `react-i18next` i 3. i18n har 5 språk (no/en/sv/da/de, ~10 kB hver, `src/i18n/index.ts:55-58`).
- `.env.local` inneholder en klartekst `CODEMAGIC_API_TOKEN` (verifisert gitignorert via `git check-ignore`).
- Versjonssprik: `package.json` version er **0.1.0** (kilden for `VITE_APP_VERSION` i `vite.config.ts`), mens Codemagic setter marketing version **1.0.11** (`codemagic.yaml`, agvtool-steget). Innstillinger-skjermen viser altså en annen versjon enn App Store.

## 8. Døde/arkiverte spor i docs/ og scripts/

**Aktivt (bindende per CLAUDE.md/AGENTS.md):** `docs/design-lab/` (fase 1 pågår), `DESIGN.md`, `src/styles/design-tokens-v2.css`, `PRODUCT.md`, `docs/CLAUDE-START-HERE.md`, `docs/DECISION-LOG.md`, `docs/PROSESS-PLAN-TIL-KODE.md`, `docs/BABYORA-UX-MOTION-BIBLE.md`, `tools/design-doctrine-lint.mjs`, `tools/chatgpt-driver/daemon.mjs`.

**Historisk/avsluttet (fakta fra filenes egne statusfelt):**
- **F60–F86-dokumentene** er faserapporter fra avsluttede runder: `F60.11-SLUTTRAPPORT.md`, `docs/F79/SLUTTRAPPORT.md`, `docs/paakledning-loop/SLUTTRAPPORT.md`, `F81/prisbeslutning.md` (beslutning tatt), `F86-innholdsplan.md`. Numrene refererer til feature-runder juni–juli 2026.
- **`docs/copilot-rounds/`** ble **aldri aktivert**: README sier eksplisitt «Status (2026-06-19): ikke aktivert. V0-saldo $2 ved oppstart» — det var en beredskapsmappe for fallback fra V0.
- **`docs/v0-rounds/`** er logg fra F28-designloopen mot V0 (avsluttet, siste fil «SHIP»).
- **`docs/gsd/`** inneholder én fil, `planlegg-ingest.yml` — en dokument-presedens-manifest for GSD-arbeidslisten fra juli; GSD-sporet omtales i AGENTS.md som «current approved GSD worklist» (autorisasjon 2026-07-24), men design-lab-planen fra 2026-08-05 er nå det aktive laget over.
- **`docs/archive/codex-2026-07-13/`** er eksplisitt arkiv (nederst i presedensordenen).
- **`scripts/`** er dominert av engangs bildegenererings-pipelines (f79-*, f80-*, F60.15-copilot-*, generate-*, fix-round-2..5) — historiske, men ligger udifferensiert ved siden av de aktive (`generate-rules-docs.ts`, verify-browser-*).
- **Rot-anomalier:** to filer med flatede scratchpad-stier som filnavn (`UserssiverAppDataLocalTemp…debug-paywall-3s.png`/`-8s.png`, 76 kB hver) og 9 `e2e-*.png`-skjermbilder (opptil 985 kB) er git-trackede i rot.

## 9. Ekstra observasjoner

- `api/forecast.ts` er en gjennomtenkt met.no-proxy (edge runtime, User-Agent per met.no-vilkår, 15 min edge-cache) med **in-memory rate-limiting per warm isolate** — koden selv kaller det «best-effort protection».
- CLAUDE.md/state.json advarer om at en **parallell økt jobber aktivt i src/screens** under auditen — koordineringsrisiko for designprogrammet.
- Byggstempel-systemet (`vite.config.ts`: VITE_BUILD_SHA/DATE/VERSION) gjør hvert bygg verifiserbart mot git fra Innstillinger — god praksis som allerede er på plass.

## FAKTA
- src/ er 92 355 linjer TS/TSX fordelt på 243 kildefiler (find+wc under audit); 180 testfiler i repoet totalt
- apps/bare/vite.config.ts: standalone build med base '/bare/', output dist/bare, gjenbruker src/lib+hooks+data, null designimport; apps/bare/BareApp.tsx:1-17 dokumenterer formålet ('fjerner alt av design'), hardkodet Elverum-koordinater linje 26-27
- capacitor.config.ts: appId no.klemeg.app, webDir 'dist', iOS contentInset 'always', androidScheme 'https'
- src/lib/native-init.ts:22-63: StatusBar Style.Dark, SplashScreen.hide fadeOutDuration 200, Keyboard KeyboardResize.Native kun iOS, Android back-knapp med minimizeApp-fallback, alt gated på Capacitor.isNativePlatform()
- Haptikk: adapter i src/lib/haptics/system.ts + semantisk lag i src/lib/haptics.ts (header sier eksplisitt 'IKKE en ny parallell implementasjon'); brukt i 14 tsx-filer (grep)
- npx vite build (kjørt 2026-08-05, exit 0): index-chunk 603,23 kB og UkeScreen-chunk 595,67 kB, med eksplisitt '>500 kB'-advarsel fra rolldown/vite
- Rotårsak UkeScreen-chunk: src/lib/planning/snart-climate.ts:1-2 importerer statisk climate-1991-2020-v1.json (69 kB) + climate-1991-2020-v1.manifest.json (477 kB)
- public/ er 602 MB: alle-bilder 294 MB (440 filer), illustrations 174 MB, avatars 103 MB; kopieres inn i dist/ (604 MB) ved build; git-pack er 447,64 MiB (git count-objects)
- public/alle-bilder/ refereres ikke noe sted i src (grep tomt); illustrations/ og avatars/ er runtime-referert (src/data/garment-illustrations.ts, src/lib/avatar-stage.ts m.fl.)
- leaflet, react-leaflet og @types/leaflet ligger i package.json dependencies men har null importer i src/apps/e2e/tools/scripts/api (grep); lucide-react likeledes 0 treff
- posthog-js lazy-importeres i src/lib/analytics/track.ts:106-110 gated på VITE_POSTHOG_KEY; strengen 'posthog' finnes ikke i noen fil i dist/ etter build (grep tomt) — analytics er kompilert bort i nåværende bygg
- E2E: e2e/smoke.ts og e2e/purchase-flow.ts er håndskrevne tsx-skript med rå playwright chromium (ikke @playwright/test); purchase-flow.ts:4-6 sier eksplisitt at kjøp verifiseres via web/dev-mock 'uten StoreKit'
- .github/workflows/ci.yml kjører: npm ci, lint, test, audit:test, build, playwright install chromium, e2e, verify:hjem
- Skjermer uten egne testfiler (verifisert via ls src/screens/__tests__ + grep): InnstillingerScreen, FamilieScreen, VinterprogramScreen, PlaggbibliotekScreen, VarmEllerKaldScreen; src/lib/billing/revenuecat.ts, src/lib/gdpr/local-data.ts og src/lib/notifications/morning-notification.ts har 0 tester
- 16 testfiler i src/styles/__tests__ håndhever designdoktrine mot tokens/CSS (design-tokens-v2.*.test.ts, opacity-demping, spacing-skala, vedtak-register m.fl.)
- docs/copilot-rounds/README.md: 'Status (2026-06-19): ikke aktivert' — beredskapsmappe som aldri ble tatt i bruk; docs/archive/codex-2026-07-13/ er eksplisitt arkiv; F60/F79/paakledning-loop har SLUTTRAPPORT.md-filer
- Versjonssprik: package.json version er 0.1.0 (kilde for VITE_APP_VERSION via vite.config.ts), mens codemagic.yaml setter marketing version 1.0.11 via agvtool
- Rot inneholder to git-trackede PNG-er med flatede scratchpad-stier som filnavn samt 9 git-trackede e2e-*.png-skjermbilder (git ls-files)
- .env.local inneholder klartekst CODEMAGIC_API_TOKEN; filen er gitignorert (git check-ignore bekreftet)
- Git-historikk: 668 commits, samtlige datert 2026-07-01 eller senere
- docs/design-lab/state.json: activePhase 1 'Product Audit', åpne funn inkluderer parallell økt i src/screens og 2 flaky tester i verify-phase3-exact-sha.test.ts
- api/forecast.ts: Vercel edge-proxy for met.no med User-Agent per vilkår, 15 min edge-cache og in-memory rate-limit per warm isolate (kommentert som best-effort)

## ANTAKELSER
- Native-bundlestørrelse: jeg antar at 'cap sync' kopierer hele dist/ (604 MB) inn i iOS/Android-appen — codemagic.yaml har ingen synlig filtrering, men jeg har ikke verifisert et faktisk IPA/AAB-artefakt eller om Codemagic-bygget feiler/filtrerer på annet vis
- Jeg antar at manifest-JSON-en i UkeScreen-chunken (477 kB) primært brukes til sha-verifikasjon ved last og ikke trenger å skipes i sin helhet til klienten — bruken er lest overfladisk (snart-climate.ts), ikke sporet i detalj
- Jeg antar at scripts/ med F60/F79/F80-prefiks er engangskjøringer som ikke lenger er i bruk — basert på navn, docs-sluttrapporter og fravær fra package.json-scripts, ikke på eksplisitt dødmerking
- Jeg antar at GSD-arbeidslisten (AGENTS.md-autorisasjonen 2026-07-24) i praksis er superseded av design-lab-planen 2026-08-05 — CLAUDE.md peker på design-lab som bindende, men ingen fil sier eksplisitt at GSD-sporet er lukket
- Tallet '178 testfiler' fra oppdraget avviker marginalt fra min telling (180 inkl. api/ og scripts/__tests__; 172 i src/apps/tools/e2e) — antar tellemetode-forskjell, ikke reell endring
- Jeg har ikke kjørt vitest eller e2e selv — CI-grønnhet og flaky-status er tatt fra state.json og workflow-filen, ikke observert

## GJELD
- 602 MB bilder i public/ kopieres inn i hvert bygg og ligger i git (447 MiB pack); 294 MB (alle-bilder/, 440 filer) er ikke referert fra koden i det hele tatt — største enkeltstående tekniske gjeld, og en sannsynlig app-størrelse-bombe for native-bygg siden webDir='dist' og ingen pruning finnes i codemagic.yaml
- To chunks over Vites 500 kB-grense: hovedchunk 603 kB og UkeScreen 595 kB; UkeScreen-gjelden skyldes konkret at et 477 kB verifikasjonsmanifest (JSON) statisk-importeres i snart-climate.ts
- Tre helt ubrukte kart-avhengigheter (leaflet, react-leaflet, @types/leaflet) pluss ubrukt lucide-react og fire ubrukte @fontsource-pakker i dependencies — død vekt og falsk signal om funksjonalitet (kart) som ikke finnes
- Betalingslaget er svakest testet der risikoen er høyest: revenuecat.ts har 0 enhetstester og e2e verifiserer kun web-mocken, aldri StoreKit/Billing; gdpr/local-data.ts og morning-notification.ts er også utestet
- PostHog-analytics er i praksis død kode i nåværende bygg (nøkkel mangler, koden kompileres bort) — beslutninger som antar telemetri har ingen data
- Fem skjermer mangler egne tester (Innstillinger, Familie, Vinterprogram, Plaggbibliotek, VarmEllerKald), og App.tsx (868 linjer ruting/gating) er nesten utestet
- Versjonssprik 0.1.0 (package.json/Innstillinger-visning) vs 1.0.11 (App Store marketing version) — byggstempel-systemet viser feil versjon utad
- Docs- og scripts-trærne skiller ikke aktivt fra historisk: ~100 engangs-scripts, F60–F86-rapporter, v0-rounds og aldri-aktiverte copilot-rounds ligger udifferensiert ved siden av bindende styringsdokumenter; rot har i tillegg git-trackede debug-/e2e-skjermbilder og to filer med korrupte scratchpad-filnavn
- i18n bærer 5 språk mens produktet er norsk — vedlikeholdsflate uten dokumentert beslutning i de leste styringsdokumentene
- Kjent testflakiness (verify-phase3-exact-sha.test.ts under parallell last) og en parallell aktiv økt i src/screens utgjør koordinerings-/CI-risiko for designprogrammet
- E2E-oppsettet er hjemmesnekret (tsx + rå playwright) uten testrunner-features som retries/rapporter; tre av seks e2e-skript er ikke engang wiret inn i npm-scripts