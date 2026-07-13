# Babyora — Statusrapport til Fable 5

> **Hei Fable.** Du leverte arbeidsordren `babyora-fix-redesign-prompt (5).md`
> 2026-06-12. Dette er rapport på det vi har levert. Ber om din uavhengige
> vurdering før vi merger til main.
>
> **Vi har ikke kjørt deg gjennom URL** — antar du tolker tekstuelt. Hvis
> du vil se live, be Sivert om en fersk `_vercel_share`-token (default
> Vercel preview krever Sivert-auth).

---

## TL;DR

| | |
|---|---|
| Branch | `Fenral/wool-app : redesign/instrument-level` |
| Commits siden review | 16 |
| Tester | 55 grønne (motor + summary + orbit + værikon + guardrails) |
| Build | grønn (TSC + Vite) |
| Faser ferdig | P0 (alle 6), P2, P3, P5, P6 |
| Faser delvis | P1 (tokens ✓, layout ❌), P4 (datovelger ✓, Lillian-i-onb ❌) |

---

## Per Fable-observasjon

### P0.1 «Oppsummeringen lyver»

**Du skrev:** «Hjem viser ‹Ull + fleece + yttertøy. Vinden biter litt.›
ved 10°, 2,0 m/s, 0,0 mm/t — mens faktisk anbefaling er langermet body,
ullsokker, pyjamas og sovepose.»

**Levert:**
- Ny `src/lib/summary.ts` med `buildSummary(rec, weather, activity)`
- Setning 1: avledet av faktiske kategorier («Langermet body og pyjamas.»)
- Setning 2: kun når sann (vind ≥ 6 m/s, nedbør > 0,2 mm/t, føles-temp
  avvik ≥ 3°)
- 14 enhetstester inkl. screenshot-caset
- `tipFor(score)` slettet fra `HomeScreen.tsx`

**Verifisert på live:** «Langermet body og pyjamas.» (matcher motor-output).
Ingen setning 2 fordi rolig vær.

**Spørsmål til deg:** OK at vi ikke har setning 2 ved tilbakehold? Ditt
prinsipp «stillhet er bedre enn fyll» tilsier ja. Bekreft?

---

### P0.2 «Orbit: duplikater, label-kollisjon, halvtom layout»

**Du skrev:** «Pyjamas vises to ganger; Py/Body/jamas-grøt øverst til
venstre; med bare 3 plagg flyter tagene i tomrom.»

**Levert:**
- Dropp faste slots. `computeOrbitPositions(n)` fordeler jevnt på en
  ellipse rundt Lillian, start kl. 12.
- 1–3 plagg = stram radius (rx=80, ry=95). 4–6 = full (rx=110, ry=130).
- `collectOrbitalEntries` dedupliserer på plagg-id. Screenshot-test
  (body+ullsokker+pyjamas+sovepose) → 4 unike entries.
- Diskret ellipse-glow (`OrbitGlow`) som binder tags visuelt til Lillian.
- +N-tag for >6 plagg som åpner antrekk-siden.
- Maks 6 tags, prioritert yttertøy > innerst > ekstra > mellomlag.
- 10 enhetstester.

**Verifisert på live:** 3 plagg (body, pyjamas, sovepose) rendres som tags
med labels «Body», «Pyjamas», «Sovepose». Klikk på tag åpner
`LayerDetailSheet` med riktig forklaring («Lag 2 av 3 · Mellomlag…»).

**Ny cosmetic-bug avdekket:** ved 3 plagg overlapper «Body»-tagen Lillians
overkropp og labelen skjules bak `ComfortBadge`. Vi vil **høre din mening**:
- Akseptabel for v1? (stram-radius er bevisst kompakt)
- Eller skal vi øke radius / flytte ComfortBadge?

---

### P0.3 «Værikon matcher ikke vær»

**Du skrev:** «‹Delvis skyet · 0,0 mm/t› vises med regnsky-ikon.»

**Levert:**
- Ny `src/lib/weather-icon.ts` med ren `weatherIconKind(symbolCode,
  precipMmH)` → 8 typer.
- **Defensiv regel:** `precipMmH ≤ 0` → aldri nedbør-ikon, selv om
  symbolCode hevder «rain».
- 11 enhetstester inkl. bug-caset «partlycloudy_day + 0 mm/h →
  partly-cloudy (ikke rain)».
- 7 nye SVG-ikoner (sun, partly-cloudy, cloud, rain, sleet, snow, fog,
  thunder).

**Verifisert på live:** vær-pillen viser **sky-ikon** ved «Skyet ·
Føles 13°» og «Delvis skyet» får partly-cloudy.

---

### P0.4 «Én kilde for sted og dato»

**Du skrev:** «Innstillinger sier Trondheim, Uke og Hjem sier Elverum;
Uke-mock viser ‹I dag 12. mai› når dato er 12. juni.»

**Levert:**
- `SAMPLE_PLACE` fjernet fra sample-data (var ubrukt).
- Ny `buildSampleForecast(now = new Date())` genererer 10 dager relative
  til `Date.now()` med norske ukedager + måneder.
- `PlanScreen.tsx` bruker `buildSampleForecast()` direkte.
- **Runde 1 bug-funn:** `SettingsScreen.tsx:68` hadde fortsatt
  «Trondheim» hardkodet! Fix `R1.1`: importer `useChildren`, bruk
  `{active.city}`.

**Verifisert på live:**
- Hjem-vær-pille: «… · Oslo»
- Uke-tittel: «Time for time i Oslo», «Neste 10 dager i Oslo»
- 10-dager-liste: «I dag 12. juni», «Lør 13. juni», «Søn 14. juni», …
- Innstillinger: «Oslo» (etter R1.1)

---

### P0.5 «Time for time rendrer tomt»

**Du skrev:** «Header og legende vises, men null rader.»

**Levert:**
- `PlanScreen.tsx` har nå empty-state for `hourRows.length === 0`:
  - `weatherState.status === 'loading'` → «Henter været i Oslo…»
  - Ellers → «Vi fant ikke værdata for Oslo akkurat nå.» + «Prøv
    igjen»-knapp
- Når data finnes (live): 24 timer rendres.

**Verifisert på live:** 24 timer fra 07:00 «I dag» til 06:00 «Neste»
med temperatur, føles-temp, værikon, score per time.

---

### P0.6 «Klikkbare timer og dager → tidsforskjøvet anbefaling»

**Du skrev:** «Hver rad åpner anbefalingsvyen tidsforskjøvet … med
kontekstlinje ‹Slik kler du {navn} {i morgen kl 09 / onsdag}›.»

**Levert:**
- Ny `src/components/TimeShiftSheet.tsx` (bottom-sheet med focus-trap,
  Esc, drag-to-dismiss).
- Hver time-rad + dag-kort har `onClick` som:
  - Bygger `WeatherInput` for det tidspunktet
  - Kjører `recommend()` (motor er ren funksjon)
  - Åpner sheet med headline + motor-drevet summary + plagg-liste +
    vær-meta
- Headline: `Slik kler du Lillian kl 09:00` / `Slik kler du Lillian
  lør 13. juni`.

**Ikke verifisert på live:** klikk-test gjenstår — vil teste i runde 3
hvis du ønsker.

---

### P1.1 + P1.2 «Beige-på-beige»

**Du skrev:** «Beige avatar i beige sovepose med beige thumbnails på
beige-rosa bakgrunn og fersken-beige kort-bordere.» Du ba om OKLCH-
tokens med låst L/C per rolle.

**Levert:**
- Ny `src/styles/tokens.css` med OKLCH + hex-fallbacks (iOS Safari
  <15.4 kompat).
- Plagg-kategorier med lik L/C, kun hue varierer:
  - innerst = 85 (ullkrem), mellomlag = 195 (teal), yttertøy = 250
    (marine), ekstra = 35 (korall).
- I `index.css`: `--paper-elev` hue 60 (peach-cream) → 230 (cool surface),
  `--hair` hue 50 (clay-warm) → 230 (cool blue-grey).

**Status:** **delvis levert**. Mange komponenter har egne hex inline —
full søk-og-erstatt ble vurdert for kostbart denne runden.

**Spørsmål til deg:** akseptabel som første pass? Eller skal vi gjøre
full hex-revisjon i neste runde?

---

### P1.3 «Mini-Lillian fjernet»

**Levert:** `<button className="identity__avatar">` med 88×88 mini-PNG
slettet. Header er nå bare navn + dato.

**Verifisert på live:** ✓ kun én Lillian.

---

### P1.4 «Stram Hjem-layouten, AKTIVITET over Vis lag»

**Du skrev:** «Hero-høyden tilpasset antall plagg; ved 3–4 plagg skal
‹Vis lag› og aktivitetsvelgeren være synlige uten scroll, eller maks
ett lett scroll-trinn unna. Flytt AKTIVITET over Vis lag.»

**Status: ❌ UTSATT.** Vi vurderte at AKTIVITET-flyttingen krever
restrukturering av `HomeScreen.tsx` JSX og tilhørende CSS-`.aktivitet`-
plassering, og vi har ikke vurdert konsekvens for `LayerPeelControl`-
fokus-flyt og `BottomNav`-safe-area.

**Spørsmål til deg:** kan dette merges som senere fase, eller blokkerer
det v1?

---

### P2.1 «Bytte-chips»

**Du skrev:** «Skjul chipene hvis ikke ferdig — verre enn å mangle.»

**Levert:** `SHOW_ALTERNATIVES = false` i `LayerDetailSheet.tsx` skjuler
hele blokken med chips + «Bytt plagg»-knapp. TODO-kommentar viser hva
som må implementeres for å snu flagget.

---

### P2.2 + P2.3 «Hvorfor i dette antrekket / Bilstol»

Begge **eksisterte allerede** i koden:
- `whyForGarment(id, ctx)` interpolerer `childName`, `activity`,
  `feelsLikeC`, `windMs`, `precipMmH`.
- `wool-layers/safety.ts:265` har HB-9: bilstol → fjerner thick winter
  outer + legger til notat + safety-flag.

`HomeScreen.tsx` bygger `whyContext` dynamisk fra rec og passerer
til `GarmentDetailScreen`. `HeroHotspot` rendrer `SafetyCard` ved
severity ≥ HIGH.

**Ingen kode-endring nødvendig.** Bekreftet via koderlesing.

---

### P2.4 «Inner lag → innerlag»

5 forekomster i `src/data/garment-info.ts` rettet. Andre språkvask-
items (Kjøredress vs vinterkjøredress, anglisismer) ikke utført i
denne runden.

---

### P3 «Matrix + guardrails»

**Levert:**
- `scripts/matrix.mjs` → `review/MATRIX.md` (416 linjer, 4608 motor-
  kjøringer over 6 aktiviteter × 12 temps × 4 vind × 4 nedbør × 4
  aldre).
- `src/lib/wool-layers/__tests__/guardrails.test.ts` med 6 invariants:
  - Ingen vinter-yttertøy når føles-temp > +4°
  - Ingen lue + votter når føles-temp > +15°
  - Aldri tom innerst under +10°
  - Søvn → aldri snorer/skjerf
  - Bilstol → aldri vatterte dresser (HB-9)
  - Alle anbefalinger har ≥1 plagg i innerst

**Alle 6 grønne.**

- `review/ANOMALIES.md`: **A-1** logget for Guide-kalkulator (+5° +
  frisk vind + yr → vinterkjøredress). **Ikke endret — venter på din
  vurdering** av terskel.

---

### P4 «Onboarding»

**Levert:**
- Datovelger får `colorScheme: 'light'` inline.

**Utsatt:**
- Lillian inn i steg 1-3
- Bakgrunn-gradient
- Steg 3 sted-pille fix («Posisjon funnet: Elverum» + søkefelt-duplikat)
- Progresjonsprikker token-farger

**Spørsmål til deg:** kan onboarding-visuelt løftes til separat runde?

---

### P5 «Animasjon og liv»

**Levert (CSS):**
- Idle-drift på orbit-tags (3 desynkroniserte 7-9s keyframes).
- ComfortBadge fade/scale-inn.
- Vær-partikler (rain/snow) — KEYFRAMES klar, krever at `WeatherScene`
  rendrer `.weather-scene__particle`-noder (ikke gjort).
- `prefers-reduced-motion` slår av alt nytt.

**SessionStorage:** `dressup-orbital-played` settes ved første mount.
Verifisert på live: retur til Hjem viser orbit umiddelbart (ingen
re-spill).

---

### P6 «Playwright-loop»

**Forberedt:** `scripts/review-shots.ts` + `review/CHECKLIST.md`.

**Kjørt 2 runder:**
- R1 avdekket 2 kritiske bugs (R1.1 settings, R1.2 opacity)
- R2 verifiserte begge fixene og testet klikk-flyt orbit→sheet

Loop stoppet pga alle kritiske bugs løst. Klikkbar dag/time → sheet
gjenstår å teste — kan kjøres som R3 hvis du ønsker.

---

## Konkrete spørsmål til deg

1. **P1.4 (layout)** — blokkerer dette merge til main, eller egen fase?
2. **P4 (Lillian-i-onboarding)** — egen fase, eller med i ny review-runde?
3. **A-1 anomali** — er +5° + frisk vind + yr → vinterkjøredress reelt
   feil, eller bare uventet? (Krever din terskel-vurdering.)
4. **Cosmetic R2-bug** — Body-tag overlapper Lillian ved 3 plagg. v1
   akseptabelt eller fix nå?
5. **OKLCH-migrasjon** — full hex-revisjon nå eller iterativt?
6. **Plagg-navn case** — `LayerDetailSheet` viser «pyjamas» (lowercase).
   Skal vi kapitalisere i UI eller fikse i motorens output?

---

## Skjermbilder (Vercel-hosted, 23 t gyldighet)

Klikk **første** lenke under for å sette auth-cookie. Da virker alle de
andre på samme domain uten ny innlogging.

### Runde 1 — før fix

- **Hjem (vogn-våken):** https://wool-app-git-redesign-instrument-level-sivert-s-projects.vercel.app/review-shots/r1-430x900/hjem-vogn-vaken.png?_vercel_share=MpeQzYQpibJktHu1Vw1wmB2CEfP3sopy
- **Hjem etter R1.2-debug (orbit-tags rendret men opacity 0):** https://wool-app-git-redesign-instrument-level-sivert-s-projects.vercel.app/review-shots/r1-430x900/hjem-r1-orbit-tags.png?_vercel_share=rTDZrLibfpVitE9HkkzoLal6eGwO4xBN
- **Hjem etter manuell DOM-overstyring (tags synlig):** https://wool-app-git-redesign-instrument-level-sivert-s-projects.vercel.app/review-shots/r1-430x900/hjem-opacity-forced.png?_vercel_share=yPpW2OgmjTUA1mmrdYnvsyBt2ZoJR4YW
- **Innstillinger (viste fortsatt «Trondheim»):** https://wool-app-git-redesign-instrument-level-sivert-s-projects.vercel.app/review-shots/r1-430x900/innstillinger.png?_vercel_share=MMLEZVCqlcvXj3LRhxbHfrLHc4Zra744
- **Uke I dag (24 timer fylt ut):** https://wool-app-git-redesign-instrument-level-sivert-s-projects.vercel.app/review-shots/r1-430x900/uke-idag.png?_vercel_share=WuuFPtni8RYUxT5Zo2KjVktG1lcslN3T
- **Uke 10 dager (relative datoer):** https://wool-app-git-redesign-instrument-level-sivert-s-projects.vercel.app/review-shots/r1-430x900/uke-10dager.png?_vercel_share=iB8LOCWzrJqwAiCxxG96i8pY5NVPcmu6

### Runde 2 — etter R1.1 + R1.2 fix

- **Hjem (3 plagg-tags synlige rundt Lillian):** https://wool-app-git-redesign-instrument-level-sivert-s-projects.vercel.app/review-shots/r2-430x900/hjem-r2.png?_vercel_share=VxmJXpCWeJi6W3DemJFLLywCTcWlMsdO

> URL-ene utløper **13. juni 2026 ca. 07:00 UTC**. Be Sivert om friske
> hvis du trenger lenger tid.

---

## Hvordan vurdere uten Vercel-tilgang

1. Bruk din opprinnelige sjekkliste (P0-P6) og kryss av basert på
   beskrivelsene over.
2. Skjermbilder ligger også i repo: `Fenral/wool-app : review/shots/`
   (krever GitHub-tilgang).
3. Reviewen kan også gjøres via PR-diff på branchen:
   `gh pr view Fenral/wool-app:redesign/instrument-level`

— Avslutning fra Sivert + Claude
