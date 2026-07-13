# Bestilling — Babyora: native-følelse (v2, m/A4 token-migrering)

> KØET — start KUN på Siverts eksplisitte signal (2026-07-11: «ikke start før jeg sier ifra i likhet med den forrige jobben»).
> Vedlegg: docs/babyora-tokens.css. Blokk B gated på asset-budsjett.


**Repo:** `Fenral/wool-app` · **branch:** main
**Stack:** Capacitor 7 + React 19 + Vite + Supabase + RevenueCat
**Intensitet:** `ponytail` full — minimal kode, ingen nye avhengigheter uten grunn.

## Kontekst
Mock-review av 14 skjermer ga 76/100. Brandet, paletten og temp-drevet fargeskift sitter. Det som drar ned er (1) fire ulike illustrasjonsspråk samtidig, (2) fravær av bevegelse/haptikk (leser som webview), (3) type-ramp + safe area ikke forankret til OS.

Bestillingen er delt i to blokker med vilje:

- **Blokk A** er ren kode. Ingen nye assets. Kan startes nå.
- **Blokk B** krever nye 3D-assets (genereres utenfor Claude Code) og **skal ikke startes før asset-budsjett er avklart.**

---

## BLOKK A — Ren kode, ingen nye assets

### A1 · Bevegelse & haptikk
- Spring-fysikk på alle sheet-transitions (plagg-detalj, bilde 3). Erstatt evt. instant/CSS-ease med spring (stiv, kort demping).
- **Drag-to-dismiss** på sheet: grabber finnes allerede — legg til rubber-band-drag med velocity-threshold for dismiss, snap tilbake under terskel.
- Tab-bar (bilde 1): active-state med spring på ikon-scale + selected pill. Ikke instant fargebytte.
- Momentum + overscroll-bounce på lister: plaggbibliotek, garderobe, uke-timeline.
- Haptikk (Capacitor Haptics):
  - `impactMedium` på «Se dagens antrekk»
  - `selection` / lett detent ved hvert lag-skift i Finn antrekk-sliderne (temp/vind/nedbør)
  - `selection` på segment-toggle (Utenfor vogn / I vogn, Lek ute / I vogn) og tab-bytte
  - `impactLight` på «Bytte til»-swap i plagg-detalj

**Akseptanse A1:** sheet kan dras vekk med finger og fjærer; alle tre sliderne gir haptisk detent; ingen synlig instant-transition igjen.

### A2 · Type & safe area
- Innfør systemfont (SF Pro / Roboto via system-stack) på UI-labels og brødtekst. **Behold serif kun til display/tall** (grader, «2 lag», H1-titler).
- `font-variant-numeric: tabular-nums` på alle tall som endrer seg live: 23°, «2 lag», klokke, uke-temperaturer. Hindrer horisontalt hopp.
- Safe area: forankre header til `env(safe-area-inset-top)`. **Fjern hardkodet «16:23» fra hjem-skjermen** (bilde 1) — den kolliderer med OS-statusbar. Enten dropp helt eller flytt ned i innhold.
- Kontrast: løft dempet lilla-grå brødtekst på lavendel (guide-skjermene, bilde 5–7) til minst WCAG AA. Nå utvasket.

**Akseptanse A2:** tallene hopper ikke ved endring; ingen egen-tegnet klokke oppe i statusbar-sonen; brødtekst består AA-kontrastsjekk på lavendel.

### A3 · Konsistens (raske treff)
- **Innst.-ikon: sol → tannhjul.** Sol = forvirrende for settings.
- Bunnmeny: én ikonfamilie/-vekt gjennomgående.
- Solhatt-thumbnail i orbital-layout (bilde 2): fjern den hvite boks-bakgrunnen så den matcher cutout-stilen til kort 1 og 2. (Midlertidig — erstattes i Blokk B.)

**Akseptanse A3:** tannhjul på Innst.; alle fire bunn-ikoner samme vekt; ingen boksa thumbnail i orbital.

### A4 · Semantisk fargesystem (token-migrering)
Vedlagt fil: **`babyora-tokens.css`** — legges inn som eneste kilde for farge. Prinsipp: **én rolle per hue**. Ingen komponent refererer rå oklch etter migrering.

Rollefordeling (fullt definert i token-fila):
- **Grønn = handling.** Kun CTA-er og bekreftelser (`--action`).
- **Rust = struktur/brand.** Lag-badges, INNERST-pill, editorial (`--structure`).
- **Premium flyttes UT av grønn** → furu + gull (`--premium` / `--premium-accent`). Gjelder alle Pluss-badges, paywall, «Prøv 7 dager gratis».
- **Kroppsstatus** (nakketest, varm/kald-varsler) er appens eneste mettede farger (`--status-hot/-ok/-cold`). Deles aldri med metadata.
- **Materialprikker** (ull/bomull/vanntett/mellomlag) → dempet jordskala (`--material-*`). Lav chroma så de aldri forveksles med status.
- **«Middels N»-score i uke:** gull-sirkelen fjernes → nøytral pill (`--score-pill-*`), tallet bærer informasjonen.
- **Badge 3 «tilbehør»** bytter fra teal til `--structure` eller nøytral — rekkefølge-info, ikke egen semantikk.
- **Grunn-rampen** (temp-drevet rosa→isblå) beholdes og formaliseres via `--ground-*`-stoppene. Lavendel (`--ground-calm`) låses som fast «stille flate» for Guide/Innst.

**Akseptanse A4:** grep etter `oklch(` i komponentkode gir null treff utenfor token-fila; ingen grønn Pluss-badge igjen; ingen gull i uke-score; materialprikker og nakketest-signaler deler ingen fargeverdier.

---

## BLOKK B — Material-unifisering (KREVER nye 3D-assets)

> **Ikke start før asset-budsjett er avklart.** Selve gen-jobben gjøres utenfor Claude Code (Higgsfield / Nano Banana). Claude Codes del er kun integrasjon.

### B1 · Asset-produksjon (utenfor Claude Code)
Mål: alt rendres i ett 3D-språk, samme som babyen.

- Plagg-katalog: **62 plagg** → 3D-render hver.
- Avatar-lag: hvis worn-versjon på babyen skal matche katalogen → **inntil 62 til**. (Se spørsmål i chat — dette er hovedkostnaden.)
- Editorial/guide: garn, snømann/vott, anatomisk nakketegning, kalkulator-kort, de to verktøykortene → **~8**.

**Tekstilpalett (obligatorisk i alle gen-prompts):** definert nederst i `babyora-tokens.css` under «Asset art direction». Kortversjon:
- Plagg fargekodes **ikke** etter UI-tokens — plagg er innhold, ikke UI.
- Tekstiler holder lav chroma (maks ~0.08): ecru, havre, kamel, dus rust, støvblå, salvie, skifer, krem.
- **Forbudt på tekstil:** klar rød-oransje (~hue 28), klar grønn (~hue 155), klar blå (~hue 245) i høy metning — reservert kroppsstatus i UI. Regelen: *mettet = UI snakker, dempet = plagg.*
- Fast kamera (3/4 hero katalog, låst frontal worn), fast studiolys, samme matte Pixar-materialfølelse som babyen, nøytral bakgrunn. Låst oppsett er det som presser iterasjonsfaktoren ned.

### B2 · Kode-integrasjon (Claude Code)
- Bytt ut asset-referanser (katalog + avatar-lag + guide).
- Sørg for @2x/@3x og konsistent skygge/glow-behandling på tvers.
- Fjern midlertidig solhatt-fiks fra A3 når ekte 3D-hatt er inne.

**Akseptanse B:** ingen flat illustrasjon eller strektegning igjen i appen; katalog og avatar bruker samme render-kilde.

---

## Rekkefølge
Kjør **A helt ferdig først** (A4 inkludert), mål native-følelsen, **så beslutt B**. A henter mesteparten av gevinsten for ren Fable-kost; B er den dyre asset-jobben. A4 skal være ferdig **før** B1 starter, slik at nye assets produseres rett inn i det ferdige fargesystemet i stedet for å tilpasses etterpå.

## Vedlegg
- `babyora-tokens.css` — UI-tokens + migrasjonsnotat + tekstilpalett for asset-produksjon.

## Ikke gjør
- Ikke rør anbefalingsmotor / lag-logikk / fysikk.
- Ikke reintroduser instant/web-transitions.
- Ikke lever delvis og merge — hele akseptansekriteriet per blokk skal være grønt.
