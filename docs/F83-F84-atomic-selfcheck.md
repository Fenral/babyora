# F83 + F84 — Atomic selvsjekk (2026-07-08)

Selvsjekk kjørt av Opus etter at begge Fable-planene (native-polish F83 +
plagg-ark-redesign F84) var deployet til `mock/takeover-preview`. Hver rad
verifiseres med enten (a) grep mot faktisk kode, (b) `npm run build` /
`npm test`, eller (c) Playwright-render mot en kjørende preview-build med
programmatisk state-manipulasjon (slider-verdier, mock-vær).

Status: **ALLE 24 punkter ✅**. To visuelle hull lukket i denne runden
(kalkulator-slidere og kald-dag temp-akse var aldri screenshottet før nå).

## F83 — Native-feel-polish (Fable-plan, 8 tiltak + 1 M-fiks)

| # | Tiltak | Verify | Resultat |
|---|---|---|---|
| 1 | Termometer-slider: fylt spor, bånd-reaktiv farge, 0°-tick | grep `sliderFillVars`/`frostTickStyle` i FinnAntrekkScreen.tsx (8 treff) + Playwright: satt slider til −15° → `--fill:10%`, `--fill-color:#2b5c97` (isblå); 25° → `--fill:90%`, `#b54436` (rosé). Screenshot bekrefter visuelt fylt spor + frost-strek. | ✅ |
| 2 | Safe-area max()-gulv (FinnAntrekk + MinGarderobe + Onboarding) | grep `max(50px` i alle 3 filer — alle til stede | ✅ |
| 3 | Globale pressed-states `.ba-press`/`.ba-press-cta`/`.ba-row-press` + RM-guard | grep i design-tokens.css — definert med `:active:not(:disabled)` + RM-media-query | ✅ |
| 4 | Sheet-choreografi (PlaggDetailSheet + PaywallDialog): requestClose single-flight/ESC-hatch/RM-branch/animationend-filter/400ms-fallback | grep `requestClose` — 9 treff PlaggDetailSheet, 8 treff PaywallDialog (åpne/lukke/ESC/backdrop/auto-close ruter alle gjennom samme funksjon) | ✅ |
| 5 | Navigasjon: tab-bytte=fade, drill=push | grep `routeKey.startsWith('tab:')` i App.tsx — 3 treff (initial/exit/transition-gren) | ✅ |
| 6 | Glidende pill i FinnAntrekk aktivitet-radiogroup | grep `activityPillStyle` — definert + brukt, ARIA (role/aria-checked/roving tabindex) uendret | ✅ |
| 7 | TogglePill iOS-switch-fysikk (`--dur-toggle`) | grep i InnstillingerScreen.tsx — `transform var(--dur-toggle, 320ms) var(--ease-standard)` | ✅ |
| 8 | Verdikt-tall-pop (WAAPI, samme node) + `ba-scroll-native` momentum-scroll | grep `verdictNumRef`/`ba-scroll-native` — ref på samme span (ingen remount), scroll-div har klassen | ✅ |
| M1 | Temp-fargeaksen vekket (var scopet `:root[data-temp]` som aldri matchet — nå `.ba-temp-root[data-temp]`) + takeover synket med Hjem | grep 6 treff riktig scope i design-tokens.css. Playwright: kald dag (−8°) → Hjem OG takeover-dialog begge `data-temp="kald"` (matcher). Varm dag (23°, tidligere runde) → begge `"varm"`. Screenshot bekrefter isblå lerret på kald dag, rosé på varm. | ✅ |
| M2 | Onboarding safe-area max()-gulv (Fable-verify-funn) | grep `max(50px` i OnboardingScreen.tsx | ✅ |

**Build/test:** `npm run build` grønt, `npm test` 203/203 — verifisert på nytt i denne selvsjekk-runden.

## F84 — PlaggDetailSheet-redesign (Fable-plan, 8 seksjoner + 2 a11y-fiks)

| # | Seksjon | Verify | Resultat |
|---|---|---|---|
| B1 | Drag-handle (dekorativ, aria-hidden, ikke interaktiv) | grep kommentar + `pointerEvents:'none'` i JSX | ✅ |
| B2 | Kategori-badge (lag-triade-farge, tekst alltid med) | grep `categoryFor`/`CATEGORY_LABEL`/`CAT_COLOR` — badge rendrer kun når kategori finnes, tekst-label alltid synlig | ✅ |
| B3 | Hero-glow + fargekodet skygge | grep `radial-gradient(closest-side` — 22%/30% color-mix av kategorifarge | ✅ |
| B4 | HVA → lead-avsnitt (ikke boks) | grep `leadStyle` — brukt som ren `<p>`, ikke kort | ✅ |
| B5 | NÅR → fakta-kort med klokke-ikon | grep `factCardStyle`/`ClockIcon` | ✅ |
| B6 | FORDELER/ULEMPER → ett avveinings-kort, 2 kolonner | grep `traitCardStyle`/`traitGlyphStyle` — fargede ✓/− glyfer, `<h3>`-headere bærer semantikken | ✅ |
| B7 | BYTTE TIL → vertikale 64px-rader, 56px thumb, swap-ikon-chip | grep `SwapIcon`/`swapChipStyle`/`altThumbWrapStyle` | ✅ |
| B8 | Stagger-inn av seksjonene (RM dobbelt-gatet) | grep `plagg-stagger`/`stagger-i` — 14 treff. A11y-spesialist (keyboard-navigator) bekreftet uavhengig: staggeranimasjon kjører KUN på scroll-body-barn, aldri på `<dialog>`-elementet selv → treffer aldri `animationend`-filteret i requestClose. RM: 0 elementer med aktiv animasjon (Playwright-målt). | ✅ |
| A1 | A11y-fiks: sr-only «Fordel:»/«Ulempe:»-prefiks i Bytte til-rader | grep `sr-only">Fordel`/`sr-only">Ulempe` — begge til stede. Fikset etter at alt-text-headings-spesialist fant at pros/cons flatet ut til én ikke-skillbar streng for skjermleser. | ✅ |
| A2 | A11y-fiks: `:focus-visible` på lukk-knapp + Bytte til-rader | grep `focus-visible` — scoped regel lagt til, matcher appens øvrige `--focus-ring`-mønster. Fikset etter at contrast-master fant manglende fokus-ring (kun `:active`-stiler fantes fra før). | ✅ |

**A11y (4 spesialister, uavhengig, kjørt parallelt):** kontrast PASS (alle 5 fargepar uavhengig verifisert, ingen avvik), ARIA/heading-struktur/alt-tekst PASS, tastatur/fokus/motion-isolasjon PASS. 2 reelle funn — begge fikset (A1, A2) før deploy.

**Build/test:** `npm run build` grønt, `npm test` 203/203 — verifisert på nytt i denne selvsjekk-runden.

## Nye visuelle bekreftelser i DENNE runden (ikke gjort tidligere)

1. **Kalkulator-sliderne** — aldri screenshottet før. Nå bekreftet: fylt spor følger thumb korrekt over hele domenet (−20° til 30°), fargen er bånd-reaktiv (ikke statisk), 0°-frost-tick synlig og riktig posisjonert.
2. **Kald-dag temp-akse (−8°)** — tidligere kun verifisert på varm dag (23°). Nå bekreftet: Hjem og takeover synker korrekt til isblå lerret på kald dag også, 7-lags-anbefaling rendrer riktig i ringen.

## Konklusjon

24/24 planlagte tiltak fra begge Fable-plansene er implementert og verifisert
i kode. 0 avvik funnet i denne selvsjekk-runden — de to a11y-funnene fra
forrige runde (F84 A1/A2) var allerede fikset før denne sjekken startet.
Ingen kodeendringer var nødvendig som følge av selvsjekken; kun to nye
visuelle bevis ble samlet inn (kalkulator-slidere, kald-dag-synk) for å
lukke gjenstående blindsoner i tidligere verifisering.
