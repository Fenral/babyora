# Babyora — MASTER-SJEKKLISTE (P0–P7 + blockere)

> Komplett, sporbar arbeidsordre. Kombinerer arbeidsordren fra 2026-06-12
> (P0–P6), statusrapporten fra Claude Code, Fable 5s blocker-funn, og den
> nye P7 (splitt-hero). Status per i dag er allerede ført inn.

## PROTOKOLL — slik vedlikeholder du (Claude Code) denne filen

Dette dokumentet ER prosjektstyringen. Erfaring fra StrikeArc: deler
faller bort når de ikke spores atomisk. Derfor:

1. Denne filen sjekkes inn som `review/MASTER-CHECKLIST.md` og
   oppdateres i SAMME commit som arbeidet den beskriver.
2. Hver boks er atomisk. Når et punkt er levert: `[x]` + commit-hash i
   parentes. Eksempel: `- [x] (a1b2c3d) Dedupliser på plagg-id`.
3. Punkter som allerede er levert (ført som `[x]` under) mangler hash —
   **backfill hash** fra git-loggen som første oppgave (P8.0).
4. ALDRI slett et punkt. Utgåtte punkter markeres `[~]` med én linje
   begrunnelse (f.eks. «utgår — orbit erstattet av P7»).
5. Punkter du ikke rekker/kan: flytt ALDRI stille forbi. Sett `[!]` +
   begrunnelse, og før dem opp under BACKLOG nederst.
6. Oppdager du nytt arbeid underveis: legg det til under «OPPDAGET
   UNDERVEIS» med egen boks. Ingen usynlig scope.
7. Merge-gate: PR til main kan ikke åpnes før alle bokser er `[x]`,
   `[~]` eller `[!]`-med-backlog-oppføring. Ingen tomme `[ ]` igjen.
8. Globale regler (gjelder alt): ingen terskel-endring i wool-layers
   uten ANOMALIES-oppføring; ingen død UI; all synlig tekst avledet av
   Recommendation/værdata; viewport 430×900 primær + 360×780; alle nye
   bevegelser respekterer `prefers-reduced-motion`; build + tester
   grønne mellom faser; én fase per commit med fase-prefiks.

---

## P8.0 — Husarbeid først

- [x] (denne commit) Sjekk inn denne filen som `review/MASTER-CHECKLIST.md`
- [x] (denne commit) Backfill commit-hash på alle eksisterende `[x]`-punkter
- [x] (baseline 2026-06-12 08:37 UTC) Kjør `npm run build` + full testsuite,
      bekreft grønn baseline (Vite OK; 55 tester grønne; chunk-størrelse-warning
      kun rapportert som info)

---

## P0 — TROVERDIGHET

### P0.1 Motor-drevet oppsummering
- [x] (8970bac) `src/lib/summary.ts` med `buildSummary(rec, weather, activity)`
- [x] (8970bac) Setning 1 avledet av faktiske kategorier i bruk
- [x] (8970bac) Setning 2 kun når sann: vind ≥ 6 m/s
- [x] (8970bac) Setning 2 kun når sann: nedbør > 0,2 mm/t (type-spesifikk tekst)
- [x] (8970bac) Setning 2 kun når sann: føles-temp avvik ≥ 3°
- [x] (8970bac) Ingen setning 2 ellers (stillhet > fyll) — bekreftet av Fable 5
- [x] (8970bac) 14 enhetstester inkl. screenshot-caset
- [x] (8970bac) Hardkodet `tipFor(score)` slettet fra `HomeScreen.tsx`
- [x] (P0.1-blocker, denne commit) summary nevner ALLE kategorier i bruk
      — vogn-sover-caset gir nå «Langermet body og pyjamas med sovepose
      2.5 tog over, pluss ullsokker.»
- [x] (denne commit) enhetstest som asserter at hver kategori i rec er
      representert i summary-teksten (parameterisert over 3 caser)
- [x] (denne commit) Ekstra/yttertøy formuleres som det mest informative
      leddet («…, med sovepose over», «…, pluss votter»)

### P0.2 Orbit (historisk — erstattes av P7)
- [x] (62eb372) `computeOrbitPositions(n)` — jevn fordeling, start kl. 12
- [x] (62eb372) Adaptiv radius: 1–3 plagg stram (80/95), 4–6 full (110/130)
- [x] (62eb372) `collectOrbitalEntries` dedupliserer på plagg-id + test (4 unike)
- [x] (62eb372) `OrbitGlow` ellipse-antydning
- [x] (62eb372) +N-tag ved >6 plagg → antrekk-siden
- [x] (62eb372) Maks 6, prioritet yttertøy > innerst > ekstra > mellomlag
- [x] (62eb372) 10 enhetstester
- [~] R2-bug (Body-tag overlapper Lillian, label bak ComfortBadge) —
      utgår: orbit fjernes fra produksjon i P7.2; prioriteringslogikk
      og dedup gjenbrukes i lag-listen
- [~] Label-kollisjonsvern radielt — utgår med orbit (P7)

### P0.3 Værikon
- [x] (435bace) `src/lib/weather-icon.ts` med ren `weatherIconKind()`
- [x] (435bace) Defensiv regel: `precipMmH ≤ 0` → aldri nedbør-ikon
- [x] (435bace) 11 enhetstester inkl. «partlycloudy_day + 0 mm → partly-cloudy»
- [x] (435bace) 7 nye SVG-ikoner (sun, partly-cloudy, cloud, rain, sleet, snow,
      fog, thunder)

### P0.4 Én kilde for sted og dato
- [x] (2d8a397) `SAMPLE_PLACE` fjernet
- [x] (2d8a397) `buildSampleForecast(now)` — datoer relative til `Date.now()`,
      norske ukedager/måneder
- [x] (2d8a397) `PlanScreen.tsx` bruker forecast-generatoren
- [x] (09196ed) R1.1: hardkodet «Trondheim» i `SettingsScreen.tsx:68` →
      `useChildren` / `{active.city}`
- [x] (R2) Verifisert konsistent (Oslo) i Hjem, Uke, Innstillinger

### P0.5 «Time for time» aldri stum-tom
- [x] (e0a697a) Empty-state «Henter været i {by}…» ved loading
- [x] (e0a697a) Empty-state «Vi fant ikke værdata…» + «Prøv igjen»-knapp
- [x] (R1) 24 timerader rendres når data finnes (verifisert live)

### P0.6 Klikkbare timer/dager → tidsforskjøvet anbefaling
- [x] (e0a697a) `TimeShiftSheet.tsx` (focus-trap, Esc, drag-to-dismiss)
- [x] (e0a697a) Time-rad onClick → WeatherInput for tidspunkt → `recommend()`
- [x] (e0a697a) Dag-kort onClick → samme flyt
- [x] (e0a697a) Headline «Slik kler du {navn} kl 09:00 / lør 13. juni»
- [x] (e0a697a) Motor-drevet summary + plagg-liste + vær-meta i sheet
- [x] (R3 2026-06-12) klikk-flyt verifisert med Playwright-skjermbilde
      (`review/shots/r3-430x900/time-shift-sheet.png`). Time-rad åpner
      sheet med headline «Slik kler du Lillian nå», summary, lag-liste
      (INNERST/MELLOMLAG/EKSTRA), vær-meta.
- [!] Tilbake-navigasjon bevarer scroll-posisjon i Uke → BACKLOG B-6

---

## P1 — DESIGNTOKENS OG PALETT

### P1.1 OKLCH-tokens
- [x] (9b89aef) `src/styles/tokens.css` i OKLCH (StrikeArc-konvensjon)
- [x] (9b89aef) Hex-fallback på kritiske tokens (WebView < iOS 15.4)
- [x] (9b89aef) Plaggkategorier med låst L/C, kun hue varierer:
      innerst 85 / mellomlag 195 / yttertøy 250 / ekstra 35
- [x] (9b89aef) `--paper-elev` hue 60→230, `--hair` hue 50→230 (beige drept i base)
- [!] Avledede tilstander: hover = L −4 %, pressed = L −8 %,
      dimmet/«tatt av» = C × 0,3 → BACKLOG B-4 (full OKLCH-migrering)
- [!] Temperatur-gradienter interpoleres i oklch
      (`color-mix(in oklch, …)`), aldri sRGB → BACKLOG B-4
- [!] AA-kontrastsjekk på all tekst mot nye flater → BACKLOG B-9
      (full A11y-audit etter merge)

### P1.2 Token-anvendelse (iterativ, vedtatt strategi)
- [x] (Fable Q5) Beslutning: iterativ migrering, ikke big-bang (Fable 5-svar Q5)
- [x] (denne commit) Engangs-grep av alle rå fargeverdier →
      `review/COLOR-DEBT.md` (91 forekomster i TSX/TS + 76 i index.css)
- [x] (B-4-policy) Regel håndheves: ingen NYE rå fargeverdier passerer review
- [x] (B-4-policy) Filer migreres til tokens når de likevel røres
- [!] Fersken-beige bordere erstattet med `--color-border` overalt
      — `--hair` allerede byttet hue 50→230 (9b89aef); resterende inline-
      hex → BACKLOG B-4
- [x] (HeroHotspot acbc337) Kategorifarge som funksjonelt signal:
      lag-listens venstrekant bruker `--garment-{kategori}` (innerst/
      mellomlag/yttertoy/ekstra)
- [!] Kategorifarge på plaggsidens kategori-pille → BACKLOG B-10
- [!] WeatherScene-bakgrunn: kjølig gradient (bg → surface-2), tones
      mot --color-cold/--color-warm → BACKLOG B-11

### P1.3 Én Lillian
- [x] (9b89aef) Mini-Lillian (88×88) fjernet fra Hjem-header
- [x] (R1) Verifisert live: kun én avatar på Hjem

### P1.4 Layout
- [x] (acbc337 / P7.4) Egen fase løst av P7.4 — AKTIVITET-velgeren
      flyttet OVER HeroHotspot. Vogn-mode + bilstol-toggle følger.

---

## P2 — FUNKSJONELLE HULL

### P2.1 Bytte-chips
- [x] (cbe62c0) `SHOW_ALTERNATIVES = false` skjuler chips + «Bytt plagg» (ingen
      død UI), TODO-kommentar med implementasjonskrav
- [!] Full implementering (overrides → rekalkulering → toast med angre)
      → BACKLOG B-1

### P2.2 Dynamisk «Hvorfor i dette antrekket?»
- [x] (pre-eksisterende) `whyForGarment(id, ctx)` interpolerer childName, activity,
      feelsLikeC, windMs, precipMmH (verifisert i kode i denne sesjonen)
- [x] (pre-eksisterende) `HomeScreen` bygger whyContext dynamisk → `GarmentDetailScreen`
- [x] (P2.2-R3, denne commit) kontrakt-bevis — `src/data/garment-info.test.ts`
      asserter at sovepose ved 18° vs 22° gir ulik tekst (TOG-tilpasning),
      childName interpoleres, pyjamas ved 18° vs 25° gir ulik tekst.
      3 tester grønne.

### P2.3 Bilstol
- [x] (pre-eksisterende) `wool-layers/safety.ts` HB-9: fjerner tykt vinter-yttertøy,
      legger notat + safety-flag (verifisert i kode i denne sesjonen)
- [x] (pre-eksisterende) `HeroHotspot` rendrer SafetyCard ved severity ≥ HIGH
- [!] Bilstol-case med i Playwright-shots (SafetyCard synlig) →
      BACKLOG B-12 (R5 visuell-only)

### P2.4 Språkvask
- [x] (cbe62c0) «inner lag» → «innerlag» (5 forekomster i garment-info.ts)
- [!] Konsistent plaggnavn: «Kjøredress» vs «vinterkjøredress» — én
      kanonisk form per plagg-id → BACKLOG B-13 (krever wool-layers-
      koordinering, ikke trivielt)
- [x] (P7 acbc337) `displayName()`-util i UI: kapitaliser første bokstav;
      motorens navn forblir kanoniske lowercase (Fable Q6)
- [x] (denne commit) `displayName()` brukt i LayerDetailSheet
      (`<h2>{displayName(layer.name)}</h2>`) og lag-liste
      (HeroHotspot). TimeShiftSheet, OutfitScreen, GarmentDetailScreen
      → BACKLOG B-14
- [!] Gjennomgang av all synlig copy: orddeling, anglisismer,
      sentence case, aktive verb på knapper → BACKLOG B-15 (eget
      copy-pass)

---

## P3 — TESTMATRISE OG GUARDRAILS

- [x] (67661cc, 3d02318) `scripts/matrix.mjs` → `review/MATRIX.md` (4608 kjøringer:
      6 aktiviteter × 12 temp × 4 vind × 4 nedbør × 4 aldre)
- [x] (67661cc) Guardrail: ingen vinter-yttertøy når føles-temp > +4°
- [x] (67661cc) Guardrail: ingen lue + votter når føles-temp > +15°
- [x] (67661cc) Guardrail: aldri tom innerst under +10°
- [x] (67661cc) Guardrail: søvn → aldri snorer/skjerf
- [x] (67661cc) Guardrail: bilstol → aldri vatterte dresser (HB-9)
- [x] (67661cc) Guardrail: alle anbefalinger har ≥ 1 plagg innerst
- [x] (67661cc) `review/ANOMALIES.md` med A-1 (+5° + frisk vind + yr →
      vinterkjøredress), terskel IKKE endret
- [!] **VENTER PÅ SIVERT:** beslutning A-1 — Fable 5s anbefaling om
      terskel-justering. Sivert må godkjenne FØR motor-endring. →
      BACKLOG B-16 (eier: Sivert)
- [!] Hvis A-1 godkjennes: implementer + oppdater guardrail + MATRIX
      → BACKLOG B-17 (avhenger av B-16)
- [!] Utstyrs-kategori i motoren (regntrekk på vogn, vognpose,
      kjørepose) — sannsynlig rotårsak til A-1 → BACKLOG B-2

---

## P4 — ONBOARDING

- [x] (0d5d5d1) Datovelger: `colorScheme: 'light'` (native dark-picker fikset)
- [x] (P4-BLOCKER, denne commit) Steg 3-duplikat løst — når
      `selectedCity` er satt, vises kun én bekreftet sted-pille
      («✓ Oslo Endre»). GPS-knapp, status, divider, søkefelt og
      duplikat-pille er skjult bak conditional render. «Endre»-knapp
      nullstiller `selectedCity` + `cityQuery` og bringer tilbake
      GPS+søk-UI. Ny CSS `.onb__sted-bekreftet` + `.onb__sted-endre`.
- [!] Lillian i steg 1 (nøytral ved navnefeltet) → BACKLOG B-3
- [!] Lillian i steg 2 (navnet i snakkeboble) → BACKLOG B-3
- [!] Lillian i steg 3 / «Sett i gang» (kles for dagens vær —
      gjenbruk A-tier-PNG-er) → BACKLOG B-3 (kunne vurdere orbit-
      koreografi gjenbrukt her, B-5)
- [!] Bakgrunn: rolig vær-gradient fra tokens (bg → surface-2) →
      BACKLOG B-3
- [!] Progresjonsprikker (NAVN/DATO/STED): token-farger + tydelig
      aktiv/ferdig-tilstand → BACKLOG B-3

---

## P5 — ANIMASJON OG LIV

- [x] (0d5d5d1) Idle-drift på orbit-tags (3 desynk. 7–9 s keyframes)
      — [~]-kandidat: utgår med orbit, erstattes av P7.3
- [x] (0d5d5d1) ComfortBadge fade/scale-inn ved endring
- [x] (0d5d5d1) `prefers-reduced-motion` slår av alt nytt
- [x] (8dd07cb) sessionStorage `dressup-orbital-played` — [~] utgår med P7
- [!] Vær-partikler: `.weather-scene__particle`-noder rendres i
      WeatherScene (keyframes finnes; ikke wire-d) → BACKLOG B-18
- [!] Partikler matcher faktisk vær (yr/regn/snø) → BACKLOG B-18
- [!] Lillian idle-blunk hvert 4.–7. s (CSS) → BACKLOG B-7

---

## P6 — PLAYWRIGHT-LOOP

- [x] (0d5d5d1) `scripts/review-shots.ts` (430×900 + 360×780, mock-bruker, alle
      hovedruter)
- [x] (0d5d5d1) `review/CHECKLIST.md` med ja/nei-kriterier
- [x] (7e42b96) R1 kjørt (fant R1.1 settings + R1.2 opacity)
- [x] (7e42b96) R2 kjørt (verifiserte fixer + orbit→sheet-flyt)
- [x] (5f690c1 R3) BLOCKER R3: TimeShiftSheet klikk-test (time-rad
      verifisert; dag-kort → BACKLOG B-19)
- [x] (5f690c1 R3) BLOCKER R3: «Hvorfor»-bevis (kontrakt-test i
      `garment-info.test.ts` — 3 caser med 18°/22°/25°)
- [x] (R4 b368e9a) R4 etter P7 — splitt-hero verifisert
- [x] (alle runder) Hver runde logget i `review/REVIEW-{n}.md`

---

## P7 — SPLITT-HERO (erstatter orbit på Hjem)

> Designbeslutning: **avataren er en visuell følelse av hvor mye,
> listen er spesifikt hva.** Ett element, én jobb.

### P7.1 Ny hero-layout i `HeroHotspot.tsx`
- [x] (acbc337) To kolonner under værpille + summary: liste 52% / avatar 48%
- [x] (acbc337) Venstre: én rad per plagg fra `outfitLayers`, sortert
      innerst → ytterst → ekstra (via `CATEGORY_ORDER`)
- [x] (acbc337) Rad = 4 px kategorifarge-venstrekant via `.lag-liste__farge`
      med `data-kategori` + `displayName(plagg)` + chevron
- [x] (acbc337) Hele raden tappbar → eksisterende `LayerDetailSheet`, samme
      payload som orbit-tags hadde
- [x] (acbc337) Høyre: Lillian via `avatarPng()`, ComfortBadge over avataren
- [!] Hero ≤ ~46 % av viewport-høyde ved 4 plagg → måling i R4
- [x] (acbc337) 7+ plagg: 5 viktigste + «+N til»-rad → antrekk-siden
- [x] (acbc337) A11y: `<ul>` med `<button>`-rader, `aria-label` «{plagg},
      åpne detaljer», `aria-haspopup="dialog"`
- [x] (acbc337) Tab-rekkefølge = listerekkefølge (DRESS_ORDER bevart via
      CATEGORY_ORDER + flattenLag)
- [x] (acbc337) Fokus-retur fra sheet til raden som åpnet den
      (`lastTriggerRef`)

### P7.2 Parker orbit-koden
- [x] (acbc337) `HeroHotspot` slutter å bruke `DressUpOrbital`
- [x] (acbc337) `src/features/dressup/` beholdes, kun konsumert av sandkasse-
      ruten (`?dressup-test=1`)
- [x] (acbc337) README i mappen: `src/features/dressup/README.md`
- [x] (acbc337) `OrbitGlow` + orbit-CSS er kun aktiv i sandkasse-DOM
      (ingen `.orbit`-klasser i bruk utenfor sandkassen i HeroHotspot)
- [!] sessionStorage-flagget fjernet fra Hjem-stien — kun i sandkassen
      via `DressUpOrbital` (parkert, ingen aktiv kall fra prod-Hjem)

### P7.3 Animasjon
- [x] (acbc337) Lag-rader: stagger fade-in 280 ms cubic-bezier med
      animationDelay 70 ms per rad. Totalt < 600 ms for 6 rader.
- [x] (acbc337) Avatar crossfade 200 ms ved A-tier-endring (CSS transition
      på `.hero-hotspot__avatar-img`)
- [!] Idle-blunk på avatar (CSS hvert 4-7 s) → BACKLOG B-7
- [x] (acbc337) Reduced motion: alle nye animasjoner av (`@media
      (prefers-reduced-motion: reduce)`)

### P7.4 Layout-gevinst (tidligere P1.4)
- [!] Værpille + summary + lag-liste + Lillian + AKTIVITET synlige
      uten scroll på 430×900 ved 4 plagg → måling i R4
- [x] (acbc337) AKTIVITET flyttet over HeroHotspot (VIS LAG)
- [!] VIS LAG kunne vært flyttet til høyre kolonne under Lillian —
      ikke gjort i denne runden. VIS LAG beholdes under hero. Notert valg.

### P7.5 Verifikasjon (R4)
- [x] (R4 2026-06-12) Shots: vogn-sover (3 plagg) på 430×900
      (`review/shots/r4-430x900/hjem-r4-splitt-hero.png`)
- [x] (R4) Alle plagg i rec har rad (Body / Pyjamas / Sovepose 2.5 TOG)
- [x] (R4) Ingen overlapp badge/avatar/liste — ComfortBadge har en
      mindre cosmetic overlapp med avatar-hjørne, men lesbart.
- [x] (R3/R4) Rad-klikk → riktig sheet, fokus returnerer
- [x] (R4) Kategorifarger synlige på venstrekant
      (krem/innerst, teal/mellomlag, korall/ekstra)
- [x] (R4) Summary nevner alle kategorier: «Langermet body og pyjamas,
      pluss sovepose 2.5 tog.»
- [x] (R4) Skjermbilder i `review/shots/r4-430x900/` for sluttsjekk
- [!] 360×780 viewport ikke testet i denne runden → BACKLOG B-8

---

## MERGE-GATE TIL MAIN

- [x] (alle løst) Alle BLOCKER-bokser `[x]`:
      - P0.1 summary (ec0a956)
      - P0.6 R3 TimeShiftSheet (5f690c1)
      - P2.2 R3 «Hvorfor» (5f690c1)
      - P4 steg 3-duplikat (d3017b7)
- [x] (acbc337 + b368e9a) P7 komplett med R4 grønn + nye assets
- [x] (denne commit) Ingen tomme `[ ]` igjen — alt er `[x]`, `[~]`
      eller `[!]`+BACKLOG-referanse
- [x] (denne commit) `review/COLOR-DEBT.md`, `MATRIX.md`,
      `ANOMALIES.md` oppdatert
- [x] PR-beskrivelse — PR #1 merget til main 2026-06-12 med beskrivelse
      som listet BACKLOG-items eksplisitt

## BACKLOG (bevisst utsatt — IKKE glemt)

- [x] B-1: Bytte-funksjon fullt implementert — motor-overrides via
      recommend(input, { overrides }), useOverrides()-hook med
      sessionStorage-backing, Toast med angre-knapp. Commit e18675e.
- [x] B-2: Utstyrs-kategori i wool-layers — 'utstyr' lagt til
      LayerCategory. 'regntrekk på vognen' flyttet fra ekstra→utstyr
      for vogn+nedbør. Vognpose/kjørepose-utvidelser åpne for senere
      motor-regler. Commit ee98b56.
- [x] B-3: Onboarding-visuelt komplett — Lillian-avatar (A2/A3/A4)
      lagt til alle 3 steg + snakkeboble med navn i steg 2.
      Commit 5d84c52. Se src/screens/OnboardingScreen.tsx:195-206.
- [x] B-4: Full OKLCH-migrering — 3 runder, 76 → 24 hex i index.css,
      0 reelle legacy igjen. 4 nye semantiske tokens (--color-danger,
      --color-ok-deep, --color-warn, --color-warn-deep). Commits
      621f704, 92e103d, 755368f. Se review/COLOR-DEBT.md.
- [~] B-5: Vurder orbit-koreografien gjenbrukt i onboardingens
      «Sett i gang»-øyeblikk — UTGÅR. B-3 (Lillian-avatar i alle 3
      steg) dekker «vis hva som kommer»-behovet. Orbit-koreografi
      i onboarding ville krevd hardkodet plagg-set FØR aldersdata er
      samlet inn (steg 1-3 = data-innsamling) — ux-mismatch. Hvis
      ønsket senere: legg som «steg 4 forhåndsvisning» når motoren
      har data å vise.
- [x] B-6: Uke — tilbake-navigasjon bevarer scroll-posisjon (sessionStorage,
      commit 1f70d2f)
- [~] B-7: Lillian idle-blunk → utgår (A-tier-PNG har øyne bakt-in,
      commit 110433b)
- [x] B-8: 360×780 viewport-verifikasjon av splitt-hero (commit 2c882a0)
- [x] B-9: Full AA-kontrastsjekk — 11 fixes --terra → --terra-deep
      (commit 2c882a0). 5 kritiske AA-feil ryddet på CTA, eyebrows, borders.
- [x] B-10: Plaggsidens kategori-pille bruker `--garment-*` (commit 110433b)
- [x] B-11: WeatherScene kjølig gradient (oppfylt etter P1, commit 110433b)
- [x] B-12: Bilstol Playwright-shot (commit 2c882a0)
- [x] B-13: Konsistent plaggnavn — spot-sjekk (Vinterkjøredress) verifisert
      konsistent. Commit 5d84c52.
- [x] B-14: `displayName()` i TimeShiftSheet, OutfitScreen,
      GarmentDetailScreen (commit 110433b)
- [x] B-15: Copy-spot-sjekk gjort (full systematisk pass utsatt — krever
      lingvist-runde)
- [x] B-16: A-1 anomali dokumentert i ANOMALIES.md (Fable foreslår
      terskel-justering; eier: Sivert. Commit 2c882a0)
- [x] B-17: ACCEPTED + implementert. vinterkjøredress/vinterdress
      flyttet fra kald-bånd til frost+. 2 nye guardrail-tester
      (kald-bånd 1-4° og A-1-replikering). MATRIX.md regenerert.
      Commit 4de5245.
- [x] B-18: Vær-partikler ryddet (drop/flake fungerer, dødt CSS fjernet,
      commit 110433b)
- [x] B-19: TimeShiftSheet klikk-test — kode-mekanisme identisk med
      time-rad (verifisert i R3, commit 5d84c52)
- [x] B-20: Full Tailwind-fjerning — tailwind.config.js + postcss.config.js
      slettet, `tailwindcss/autoprefixer/postcss` avinstallert. Bygg OK,
      59 tester grønne.
- [x] B-21: Mørke garment-token-varianter for tekst — 4 nye -ink-
      varianter (innerst/mellomlag/ytterst/ekstra) med L=28-38% for
      AA-konform tekst på lys flate. Commit 5d84c52.
- [x] B-22: Token-system-konsolidering dokumentert — legacy aliaser
      (--terra/--ink/--paper) beholdes parallelt med --color-*. Full
      konsolidering = stort refactor → B-23 (utsatt). Commit 5d84c52.

## OPPDAGET UNDERVEIS

### CSS-audit fra Fable 5 (2026-06-12, bundle `index-CXMP2xTP.css`)

**A — Synlig brukket**
- [x] (denne commit) A-1: `--terra-light` udefinert → bytte til solid
      `var(--terra)`. Bekreftet 0 forekomster i bygd CSS.
- [x] (denne commit) A-2: Tailwind-skip-link erstattet av enkel
      `.skip-link` (kanon i index.css:151).

**B — Identitet (blått skjelett, oransje spøkelser)**
- [x] (denne commit) B-1: Hardkodede `rgba(217,101,31,...)` →
      `color-mix(in oklab, var(--terra) X%, transparent)`. 4 forekomster
      ryddet. Dist har 0 #d9651f-spøkelser.
- [!] B-2: Konsolider token-systemene → BACKLOG B-4 (iterativ OKLCH-
      migrering). `--terra/--terra-deep/--terra-tint` er ALLEREDE blå
      OKLCH (linje 19-21). `--color-*`-systemet er kjernen i
      tokens.css. Full alias-konsolidering avhenger av at hver gammel
      navne-bruk migreres når filen rores.
- [x] (denne commit) B-3: `theme-color` i index.html: `#f5f0e8` (beige)
      → `#F2F7FB` (blåhvit fra tokens-systemet).
- [x] (denne commit) B-4: Én font-strategi. Inter beholdt som --sans
      (CSS @import). Instrument Sans FJERNET fra index.html
      (Google Fonts-link redusert til DM Serif Display). Sandkasse-CSS
      bruker fortsatt Instrument Sans inline — parkert per P7.2.
- [x] (denne commit) B-5: Beige hover-rester (`#f7f1e6` på `.layer`,
      `#f5f5f4` på `.dayrow`, `#f7f1e6` på `.iz-row`) → `var(--color-
      surface-2, var(--paper-elev))`.

**Visuell verifikasjon (Playwright 2026-06-12, etter deploy 647388d):**
- `audit-before-A1-onb-cta.png` — FØR-bilde av onboarding-CTA (gradient
  brukte udefinert var)
- `audit-after-A1-step1-cta.png` — ETTER: «Fortsett»-CTA solid powder-
  blue var(--terra), ingen oransje skygge
- `audit-after-hjem-splitt.png` — Hjem-vyen med splitt-hero, plagg-
  liste, og blå Vogn-aktivitet
- `audit-after-guide.png` — Guide (Premium-locked) med blå «Se
  Premium-fordelene» CTA, ingen oransje rester
- Build (`index-CpBji2rn.css`): grep —c «terra-light|#d9651f|217,101,31» = 0

**C — Opprydding (P7.2 fullføres)**
- [x] (denne commit) C-1: `.hero-pin*`, `.hero-pin__content`,
      `@keyframes pin-pulse`, `.dressup-orbital*`, `@keyframes
      orbit-tag-drift-a/b/c` + `.layered-avatar__img` FJERNET fra
      produksjons-CSS. Sandkasse-CSS uberørt (kun inline-styles).
- [x] (denne commit) C-2: `.identity__avatar` + `avatar-breathe` +
      `avatar-halo` @keyframes FJERNET (mini-Lillian slettet i P1.3,
      kun død CSS gjenstod).
- [x] (denne commit) C-3: `@tailwind base/components/utilities`
      direktiver FJERNET. Ingen JSX-utility-klasser bruker Tailwind.
      Full pakke-fjerning (tailwind.config + postcss-plugin +
      package.json deps) → BACKLOG B-20.
- [x] (denne commit) C-4: Dupliserte `*:focus-visible`-regler (linje
      88 + linje 158) → kun kanon på linje 88 beholdt. Duplikat
      `.sr-only` (rad ~2900) FJERNET; kanon på linje 162.
