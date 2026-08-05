# motor-data
# Babyora — Fase 1-audit: Designsystem og visuell grammatikk

Dette dokumenterer det som ER i koden per 2026-08-05, med skarpt skille mellom målte fakta, antakelser og vurderinger.

## 1. Tokenarkitekturen: to vokabularer i lag

Appen har **to tokenfiler** som lastes i rekkefølge (`src/main.tsx:14–15`):

1. **`src/styles/design-tokens-v2.css`** — det kanoniske «Monter»-systemet (`--dw-*`), låst 2026-07-31.
2. **`src/styles/design-tokens.css`** — legacy «Morgennatt» (F80b), siden P7 omgjort til et **alias-lag**: nesten alle fargeverdier peker nå på `var(--dw-*)` (f.eks. `--bg-canvas: var(--dw-canvas)` linje 34, `--accent-cta: var(--dw-accent)` linje 46). Infrastruktur-CSS (app-shell, global fokusring, `.ba-press`, reduced-motion-killswitch, 44px-knappegulv) bor fortsatt her.

### Om «temaer petrol/espresso»: det er IKKE to temaer

Petrol og espresso er **to flatefamilier i samme tema**, med eksplisitt fargeeierskap (v2:15–21): espresso = rommet/menneskelig kontekst, petrol = instrumentet/ekstern værdata, amber = handling, ullkrem = typografi. Temaene er **mørk (default) + lys (kalibrert sekundær)**, og petrol-panelet er *tema-konstant* — samme panel- og værfarger i begge moduser (v2:407–410, 485). Lys modus har to speilede innganger (`@media prefers-color-scheme: light` v2:419 og `:root[data-theme="light"]` v2:500) som maskinhåndheves like (`design-tokens-v2.lys-symmetri.test.ts`).

### Hva v2-filen faktisk inneholder

- **Valørstige** med målte OKLCH-L-verdier: canvas #1E140C → glow → panel #113B3E → raised #2C1F13 → plate #3A2A1A → interactive → overlay → accent-surface (v2:36–56).
- **Tre tekstramper**: espresso-ink (hi/mid/low + `--dw-ink-demoted`, v2:59–93), egen kjølig panel-rampe (v2:97–99), og forbud mot opacity-demping av tekst (v2:30 + lang målt begrunnelse v2:62–92).
- **Amber-rampe** der `--dw-accent-300` er *forbudt som tekst* (v2:31, håndhevet av egen test).
- **To fokusringer** (`--dw-focus` / `--dw-focus-panel`) med målt begrunnelse for hvorfor ett token er umulig (v2:109–129); global `:focus-visible`-regel med null spesifisitet i design-tokens.css:535–539.
- **Avstandsskala på 2-punktsrutenett** — *utledet av måling* (750 verdier, tools/spacing-detektor.mjs), ikke 4/8-punkts lærebok; hver token har målt frekvens som kommentar (v2:189–201). Størrelse holdes adskilt fra avstand (`--dw-size-touch/cta/row`, v2:216–218).
- **Fast lysvektor 135°** som tre systemer avledes av: lyspool, kantlys, skyggeretning (v2:248–250); **dybdekontrakt** med fire skyggenivåer der kun fargene tema-flipper (v2:282–285); CTA-skygger med korrigert fortegn (v2:264–285).
- **Bevegelseskontrakt** `--dw-m-*` (10 varigheter + én kurve, v2:379–389) med tre maskinhåndhevede regler: ut raskere enn inn, markøren lander, tokens deklareres én gang.

## 2. Typografi: hvem brukes faktisk

- **Schibsted Grotesk** (UI) og **Fraunces** (hero) er self-hostet som variable latin-subset WOFF2 med preload i index.html og metrisk tilpassede fallbacks (`fonts.css:35–78`, målt med fontkit).
- **Inter brukes IKKE.** Null forekomster i src/. `@fontsource-variable/inter` står igjen som død avhengighet i package.json; main.tsx:3–5 sier eksplisitt at Inter ble fjernet.
- **DM Serif Display lastes fortsatt** (main.tsx:6–7, «serif-fallback bak Fraunces») og står som literal i font-stacker i TogGuideScreen.tsx:392 m.fl.
- **To konkurrerende UI-font-tokens**: `--font-sans` = OS-systemfont (design-tokens.css:126, eiervedtak A2 2026-07-12) mot `--dw-font-ui` = Schibsted Grotesk (v2:395). Typografi ble bevisst holdt utenfor P7-alias-laget (design-tokens.css:123–125). Konsekvensen er dokumentert i appens eget manifest: «9 skjermer rendres i systemfont mens Hjem står i Schibsted» (skjermmanifest.md:110). HjemScreen.tsx bruker selv `var(--font-sans)` 3 steder, mens `.hjem-monter` setter `--dw-font-ui`.
- **Fraunces-regelen brytes bredt.** Doktrinen sier Fraunces KUN på hero-temperatur + pris (v2:27, DESIGN.md:85). Faktisk bruk: overskrifter i OnboardingScreen (8+ steder via `--ob-font-serif`), PaakledningScreen:322/391/494, TogGuideScreen (5 steder), VarmEllerKaldScreen:255, VinterprogramScreen:330/348, PlaggDetailSheet:275, InnstillingerScreen:144. Manifestet fører disse som «BØR RETTES»-punkter.
- Typeskalaen (`--dw-text-*`, ratio 1,2: 13/16/19/23/28 + hero 76) har lavt forbruk; manifestet noterer «~150 rå font-size i 10 skjermer».

## 3. Motion: to systemer side om side

1. **`src/styles/motion-grammar.ts`** (F26, 2026-06-18) — TS-konstantobjekt `MOTION` med kurver/varigheter/press-skalaer. Forbrukes i dag av **3 filer**: VerticalGauge.tsx, OutfitTransitionOverlay.tsx, HjemScreen.tsx.
2. **`--dw-m-*` + `--dw-ease`** (B1-proofen) — forbrukes i **18 filer** (App.tsx, kle-paa-stepper, PlaggDetailSheet, de fleste skjermene).

v2:378 erklærer eksplisitt at motion-grammar.ts er «F26-arven for de gamle skjermene og erstattes ikke av denne blokken». Gating: global reduced-motion-killswitch (design-tokens.css:684–690, 0.01ms på alt) + 12 CSS-filer med egne `prefers-reduced-motion`-blokker + `.ba-temp-root`-snap. Kjent brudd: `neck-orb-pulse` kjører `infinite` i VarmEllerKaldScreen.tsx:384 (BLOKKERER i manifestet); evighetsregel-testen vokter klassen med unntaksliste.

## 4. Doktrine-verktøyene: prosa håndhever ikke seg selv — testene gjør

- **`tools/design-doctrine-lint.mjs`** måler KUN mockene og sier det selv i headeren (linje 1–15): «Grønt herfra er IKKE dekning av appen.» Den ekte porten er **`src/styles/__tests__/design-doktrine-src.test.ts`**: D1–D7 over tre stilflater (.css, template-CSS i .tsx, inline CSSProperties — ~692 inline-objekter), med tallbaseline (D1:2, D2:55, D3:0, D4:20, D5:2, D6:1, D7:17 = **97 frosne doktrinebrudd**), fingeravtrykk-sett som hindrer at gjeld bytter plass, ikke-vakuøsitets-ankre og mutasjonskontrakter (inset-topplys vs inset-posisjonering).
- **`tools/opacity-detektor.mjs`** — finner *hvilende* opacity-demping (tilstand, ikke tone-baner); leser hele verdien inkl. ternaries etter en målt evasjon.
- **`tools/spacing-detektor.mjs`** — instrumentet bak avstandsskalaen; fanger unitless React-verdier.
- Øvrige: `verify-hjem.mjs` (Playwright-måling av Hjem-koreografien), `skjermmanifest.mjs` (genererer manifestet fra ruteren), `retningslys.mjs`/`gradient-retning.mjs`/`vitrine-blindtest.mjs` (lysretning i assets), `muter-klepaa.mjs` (mutasjonsprøve av porten), `contrast_check.py`.
- **`docs/design-notes/vedtak.json`**: 32 vedtak — 20 `laast` (krever peker til eksisterende test), 8 `uportert-sjekk`, **4 `brutt`** (kle-paa-stepper, proofen-er-fasit, klepaa-sirkelplate, portdom-24-luftfordeling).
- **Portene er faktisk røde nå** (kjørt lokalt): 271/273 tester grønne, 2 røde — `panel-tekstrampe.test.ts` (4 brudd mot baseline 3; nytt: WeatherScene.tsx:165 dimmer med espresso-ink på petrol) og `skjermmanifest.test.ts` (manifestet er ikke regenerert etter at FinnAntrekkScreen krympet 1366→1328 linjer).

## 5. Hvor konsekvent følger skjermene systemet?

Det generative skjermmanifestet (docs/design-notes/skjermmanifest.md) er selv fasiten, og bildet er tydelig delt:

| Sone | Status |
|---|---|
| **Hjem-komponentene** (hjem-monter.css: 144 `--dw-*`, referanseflate), KlePaa-stepper, PaywallDialog, primitivene (button/sheet/settings-row.css), PlanChangeRail, BottomTabBar | Konsekvent Monter: dw-tokens, dybdekontrakt, kantlys, bevegelsestokens |
| **HjemScreen.tsx selv** | 0 `--dw-*`, 23 legacy-tokens — skallet rundt referanseflaten er umigrert |
| **9 av 11 skjermer** (Onboarding, Innstillinger 6260 linjer/318 dw/7 rå hex, TogGuide, VarmEllerKald, Vinterprogram, Plaggbibliotek, Uke, FinnAntrekk) | Blandingssone: dw-tokens OG legacy-tokens OG rå hex i samme fil; alle merket «umigrert, fase 3» |
| **PaakledningScreen** | Unntatt — gjenoppbygges i fase 4 etter eiervedtak |

Typiske avvik manifestet fører per skjerm: egne skyggestabler i stedet for `--dw-depth-*`, hevede flater uten lyslogikk, manglende bunn-fade på scroll, gjettede tall i stedet for `--dw-tabbar-clearance`, Fraunces utenfor hero, amber som brødtekst, petrol/vær-tokens utenfor instrumentet, udeklarerte `--zone-*`-tokens i TogGuide (fast farge i begge tema), hardkodet #3A2A1A-plate i UkeScreen.css:436 (mørke firkanter i lys modus).

**Strukturelt særtrekk:** 10 av 11 skjermer har ingen CSS-fil — stilen ligger i inline CSSProperties og template-literaler. Doktrine-porten er derfor bygget for å lese alle tre stilflater, men inline-flaten fingeravtrykkes bare per fil («(inline)»), en kjent svakhet porten selv dokumenterer.

## 6. Vurdering (kort)

Systemet er uvanlig grundig *definert og håndhevet* — tokens med målte kontrastverdier, vedtaksregister med testplikt, baselines som bare kan krympe. Gapet er ikke i systemet, men i *dekningen*: kjernen (Hjem-komponenter + primitiver) lever i Monter, mens flertallet av skjermflater fortsatt er en tre-generasjons arkeologi (F60/F79-rester → Morgennatt-aliaser → Monter). Fase 3-migreringen er planlagt men ikke påbegynt for 9 skjermer.

## FAKTA
- To tokenfiler lastes i rekkefølge: design-tokens.css (legacy) og design-tokens-v2.css (Monter) — src/main.tsx:14–15
- Petrol/espresso er flatefamilier, ikke temaer: espresso=rom, petrol=tema-konstant instrument; temaene er mørk (default) + lys — design-tokens-v2.css:12–21, 407–410, 485
- Lys modus har to speilede innganger: @media prefers-color-scheme:light (v2:419) og :root[data-theme="light"] (v2:500), håndhevet like av design-tokens-v2.lys-symmetri.test.ts
- Legacy-filen er et alias-lag (P7): --bg-canvas→var(--dw-canvas) m.fl. — design-tokens.css:34–59; infrastruktur (app-shell:603, global fokusring:535–539, reduced-motion-killswitch:684–690, 44px-knappegulv:507) bor der fortsatt
- Avstandsskalaen er 2-punkts og UTLEDET av måling (750 verdier, tools/spacing-detektor.mjs); hver token har målt frekvens — design-tokens-v2.css:151–201
- Dybdekontrakt: fire skyggenivåer definert én gang, kun farger tema-flipper — design-tokens-v2.css:282–285, håndhevet av design-tokens-v2.depth.test.ts
- Bevegelseskontrakt --dw-m-* (10 varigheter + --dw-ease) — design-tokens-v2.css:379–389; motion-grammar.ts erklært som F26-arv i v2:378
- motion-grammar.ts (MOTION) forbrukes av kun 3 filer (VerticalGauge.tsx, OutfitTransitionOverlay.tsx, HjemScreen.tsx); --dw-m-* forbrukes i 18 filer (grep 2026-08-05)
- Inter brukes ingen steder i src/ (grep); @fontsource-variable/inter står som død avhengighet i package.json; main.tsx:3–5 bekrefter fjerning
- DM Serif Display lastes fortsatt — main.tsx:6–7 — og står literal i font-stacker i TogGuideScreen.tsx:392/459/496/674/825
- To UI-font-tokens konkurrerer: --font-sans=systemfont (design-tokens.css:126, vedtak A2) vs --dw-font-ui=Schibsted Grotesk (v2:395); HjemScreen.tsx bruker --font-sans 3 steder
- Fraunces-regelen (kun hero-temp+pris, v2:27, DESIGN.md:85) brytes i minst 7 skjermer/komponenter: OnboardingScreen.tsx:1012–1623, PaakledningScreen.tsx:322/391/494, TogGuideScreen.tsx:392+, VarmEllerKaldScreen.tsx:255, VinterprogramScreen.tsx:330/348, PlaggDetailSheet.tsx:275, InnstillingerScreen.tsx:144
- Fonter er self-hostet variable WOFF2 med preload og fontkit-målte metriske fallbacks — src/styles/fonts.css:35–78, index.html:44–52
- tools/design-doctrine-lint.mjs måler KUN mocks og advarer selv om det (linje 1–15); den reelle porten er src/styles/__tests__/design-doktrine-src.test.ts
- Doktrine-porten fryser 97 brudd som baseline: D1:2, D2:55, D3:0, D4:20, D5:2, D6:1, D7:17 — design-doktrine-src.test.ts:119–146, med fingeravtrykk-sett (168–230)
- Testkjøring 2026-08-05: 271/273 grønne, 2 RØDE — panel-tekstrampe.test.ts (4 mot baseline 3; nytt brudd WeatherScene.tsx:165) og skjermmanifest.test.ts (manifest ikke regenerert etter FinnAntrekkScreen 1366→1328 linjer)
- vedtak.json har 32 vedtak: 20 laast, 8 uportert-sjekk, 4 brutt (kle-paa-stepper, proofen-er-fasit, klepaa-sirkelplate, portdom-24-luftfordeling) — docs/design-notes/vedtak.json
- Skjermmanifestet er GENERERT (tools/skjermmanifest.mjs) og viser 11 skjermer: 9 umigrerte i fase 3-kohorten; HjemScreen.tsx har 0 --dw-* og 23 legacy-tokens mens hjem-monter.css har 144 --dw-* — docs/design-notes/skjermmanifest.md:26–56
- 10 av 11 skjermer har ingen CSS-fil; stil ligger i ~692 inline CSSProperties-objekter + template-literaler — design-doktrine-src.test.ts:31–37, 666–681
- InnstillingerScreen.tsx er 6260 linjer med 318 --dw-*, 5 legacy, 7 rå hex — største umålte flate (falt ut av revisjonen 2026-08-03) — skjermmanifest.md:31, 70
- Kjente blokkerende avvik i manifestet: UkeScreen.css:436 hardkodet #3A2A1A-plate, TogGuide udeklarerte --zone-*-tokens, VarmEllerKaldScreen.tsx:384 infinite-animasjon, PlaggbibliotekScreen.tsx:342 FAB bak tab-baren
- Reduced motion: global killswitch (design-tokens.css:684–690) + 12 CSS-filer med egne prefers-reduced-motion-blokker
- opacity-detektor.mjs leser hele opacity-verdien (også ternaries) etter målt evasjon; unntar @keyframes og Framer initial — tools/opacity-detektor.mjs:100–120

## ANTAKELSER
- De to røde testene antas å reflektere CI-tilstand også; jeg kjørte kun lokalt (npx vitest run src/styles/__tests__) og kunne ikke sjekke git-historikk for når de ble røde
- Antar at mørk modus er den primære shippede opplevelsen (DESIGN.md sier dark-first); ikke verifisert på enhet/simulator
- Antar at skjermmanifestets tall for --dw-*/legacy per skjerm er korrekte utover mine stikkprøve-grep (generatoren håndheves av test, men manifestet er akkurat nå i drift)
- Antar at docs/mocks/monter/-mockene fortsatt er referansen for P4-komponentbiblioteket; jeg leste ikke mockene selv
- Antar at 'motion'-pakken i dependencies (Framer Motion-etterfølgeren) brukes til sideskift/AnimatePresence i App.tsx; jeg verifiserte ikke konkrete imports der

## GJELD
- To parallelle token-vokabularer (--dw-* + legacy-aliaser i design-tokens.css) — bevisst P7-valg fremfor big-bang-rename av ~480 forekomster i 36 filer; migreringsansvar skjøvet til fase 3
- To parallelle motion-systemer (motion-grammar.ts F26 + --dw-m-*), med 3 filer fortsatt på det gamle
- 97 doktrinebrudd frosset i baseline (D1–D7); inline-gjeld fingeravtrykkes bare per fil, så bytter innen samme fil er usynlige (kjent, dokumentert svakhet)
- To røde porter i arbeidstreet akkurat nå: panel-tekstrampe over baseline (WeatherScene.tsx:165) og skjermmanifest i drift — begge må lukkes før baseline-regimet er troverdig igjen
- Fraunces-regelen brytes i ~7 skjermer og DM Serif Display skipes fortsatt som tredje serif-kilde; @fontsource-variable/inter er død avhengighet
- UI-font er de facto splittet: Hjem i Schibsted Grotesk, 9 skjermer i systemfont — to eiervedtak (A2 2026-07-12 vs Monter 2026-07-31) er aldri formelt forlikt
- 10 av 11 skjermer har all stil inline i .tsx — svekker verktøybarhet (ingen selektorer å fingeravtrykke, ingen cascade-gjenbruk) og er grunnen til at doktrine-porten må parse tre stilflater
- 4 vedtak står som 'brutt' og 8 som 'uportert-sjekk' i vedtak.json — håndhevingen er ikke komplett for Kle på-flyten
- PaakledningScreen skal gjenoppbygges (fase 4), ikke migreres — to døde grener ligger i samme fil inntil da
- Typeskalaen --dw-text-* har lavt faktisk forbruk (~150 rå font-size-verdier i 10 skjermer ifølge manifestet)