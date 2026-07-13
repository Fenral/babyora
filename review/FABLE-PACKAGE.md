# Fable 5 — Verifikasjonspakke for SAMLET arbeidsordre

**Build:** `99c56f9` · **Dato:** 2026-06-13 · **Hovedgren:** `main`

---

## A) Build-stempel

| Felt | Verdi |
|---|---|
| Git SHA | `99c56f9` |
| Bygg-dato | 2026-06-13 |
| Tester | 153/153 grønne |
| TSC | ren |
| Vite build | OK (~1.1 s) |
| Live preview | https://wool-app.vercel.app/ |
| Innstillinger-versjon-rad | `v1.0.1 · 99c56f9 · 2026-06-13 · met.no` |

## B) Status-sammendrag per fase

| Fase | [x] | [~] | [!] | [?] | Total | Status |
|---|---|---|---|---|---|---|
| 0 Byggkjeden | 5 | 0 | 0 | 0 | 5 | Ferdig |
| 1 Forsiden | 4 | 0 | 4 | 0 | 8 | Delvis (lag-rad-omlegging utestående) |
| 2 Rust-palett | 7 | 0 | 0 | 0 | 7 | Ferdig |
| 3 Utstyr | 5 | 1 | 0 | 0 | 6 | Ferdig |
| 4 Guide-hub | 5 | 0 | 3 | 0 | 8 | Hub klar, 3 underseksjoner stub |
| 5 Rester | 2 | 0 | 0 | 0 | 2 | Delvis |
| 6 Playwright | 0 | 0 | 1 | 0 | 1 | Avslutt-pakke = denne fila |

## C) Full liste over `[!]` (overført til neste runde)

| Fase | Punkt | Begrunnelse |
|---|---|---|
| 1 | Lag-rader = LAG (innerst→4) + topp-til-tå + I vogna | Krever stor refaktor av HeroHotspot. Utestående til neste UI-runde — topp-til-tå-helper ferdig (FASE 3 commit `99c56f9`). |
| 1 | Avatar-crossfade 200 ms | CSS-skjelett ferdig, tier-bytte-trigger manglende. |
| 1 | Mini-værhint i topp-til-tå-rad | Avhenger av lag-rad-omlegging. |
| 1 | «I vogna»-rad med sovepose + Sover-chip | Avhenger av lag-rad-omlegging. |
| 4 | Plaggbiblioteket-detalj | Placeholder vises. Trenger gruppert plagg-liste. |
| 4 | TOG-guiden-detalj | Placeholder. Trenger TOG-stige + kilder. |
| 4 | Søvn inne-detalj | Placeholder. Trenger romtemp-slider + alder. |
| 4 | Varm eller kald?-detalj | Placeholder. Trenger nakkesjekken-innhold. |
| 6 | 13 Playwright-shots | Krever live-deploy-verifisering — kan kjøres etter Fable-tilbakemelding. |

## D) Grep-bevis

| Bevis | Resultat | Tolking |
|---|---|---|
| `#d9651f` i `dist/` | 0 | Gammel terra-farge er borte |
| `--terra-light` i `dist/` | 0 | Udefinert token-referanse er borte |
| `#F2F7FB` i `dist/` (gammel petrol-bg) | 0 | Petrol-bg er erstattet med krem |
| `oklch(97.5% 0.008 85)` i bygd CSS | ≥1 | Ny krem-bg er aktiv |
| `oklch(42% 0.11 35)` i bygd CSS | ≥1 | --brand rust er aktiv |
| `theme-color #FAF6EF` i index.html | 1 | Status-bar matcher bg |
| **`--terra/--ink/--paper/--hair` på hue 230/232/250 i bygd CSS** | **0** | **De FAKTISKE app-tokenene er rust/krem (ikke blå)** |
| **`--terra/--ink/--paper/--hair` på hue 35/85 i bygd CSS** | **≥1 hver** | **Rust-verdiene nådde skjermen** |

> ⚠️ **Retting 2026-06-13:** den opprinnelige grep-pakken over ga falsk
> «grønt». Den sjekket at `oklch(42% 0.11 35)` *fantes* i CSS (det gjorde
> det — definert i `tokens.css`), men ikke hva `--terra/--ink/--paper/
> --hair` faktisk *resolverte* til. `index.css` `:root` lastet etter
> `tokens.css` og re-deklarerte de samme tokenene som powder-blå (hue
> 230/232/250) → appen var blå på enheten selv om grep var «0 #d9651f».
> Roten er nå fikset i `index.css` (tokenene bærer rust direkte), og de to
> nye radene over er den korrekte *resolved-value*-sjekken.

TOG-kompletthetssjekk: **utsatt til neste runde** (krever full plagg-database-gjennomgang).

## E) Fase-leveranse-detaljer

### Fase 0 — Byggkjeden
- `vite.config.ts` injiserer `VITE_BUILD_SHA` + `VITE_BUILD_DATE`
- `SettingsScreen` viser stempelet
- `.gitignore` ekskluderer `ios/App/App/public/` + `android/.../assets/public/`
- `codemagic.yaml` har rekkefølgen: `npm ci → build → sync ios → archive` ✓
- Røyktest lokalt: `npm run build && npx cap sync ios` kjører grønt

### Fase 1 — Forsiden
- Liten avatar (88 px) i header, venstre for navn
- DM Serif-tittel i `--brand` (rust)
- Sover/Våken-toggle FJERNET fra hero
- Bilstol-toggle FJERNET fra hero (flyttes til Innst i neste runde)
- VIS LAG / LayerPeelControl beholdes inntil videre (parkering kommer i Fase 5 neste runde)

### Fase 2 — Rust-paletten
- `tokens.css` omskrevet: rust hue 35, krem-bg hue 85
- `--brand-cta` lysere rust for handlinger
- `--garment-ekstra` flyttet korall→rav (hue 75)
- Legacy aliases `--terra/--terra-deep/--paper/--hair` redirected via `var()` → ingen breaking change i eksisterende CSS

### Fase 3 — Utstyr
- B-2 ferdig fra forrige runde: regntrekk + vognpose + kjørepose i `utstyr`
- B-17 ferdig: vinterkjøredress kun ved føles ≤ 0°
- Topp-til-tå-helper i `src/lib/garments/topp-til-taa.ts` med 4 slots
- Sovepose-modell dokumentert i `review/ANOMALIES.md`

### Fase 4 — Guide-hub
- `GuideHubScreen` med 5 kort + ikoner i rust-aksent
- `Finn antrekk` åpner eksisterende GuideScreen med tilbakeknapp
- Resten viser placeholder med «kommer i neste oppdatering»
- Note nederst: «Varm eller kald?» er alltid gratis
- Event `guide_opened{section}` for hver kort-klikk

## F) Shot-indeks (utsatt)

Playwright-shots utsatt til neste runde slik at Fable kan se preview
før de tas. Live-preview-link i toppen er sufficient for første review.

## G) Anbefalt vurdering fra Fable

1. **Rust-palett:** ser hue 35 + hue 85 godt sammen visuelt på preview?
2. **Forsiden:** er Header-layout (88 px avatar + DM Serif-navn + dato)
   en tydelig forenkling fra forrige iter, eller mister vi varme?
3. **Guide-hub:** er 5-korts-strukturen rett, eller burde noen kort
   slås sammen?
4. **Topp-til-tå:** dekker de 4 slot-mønstrene (hode/hender/hals/fotter)
   alle realistiske plagg, eller mangler vi noe?
5. **Sovepose-modell:** OK at sovepose forblir i `ekstra`-kategori og
   ikke flyttes til `utstyr` (dokumentert i ANOMALIES)?

---

**Status:** Pakken er klar — last opp denne fila + live-preview-link
til Fable 5. **IKKE merget videre** før Fable-go.
