# Color-debt — rå fargeverdier i komponentkode

> P1.2 (Fable Q5): iterativ token-migrering, ikke big-bang. Denne filen
> sporer åpenbare hex-forekomster utenfor tokens-systemet for å vise
> «hva som gjenstår» og hindre nye fargeverdier i sniff å passere review.

Snapshot 2026-06-12 etter P7 + P9. Tellinger fra `grep -E '#[0-9A-Fa-f]{3,8}\b'`.

## Filer med høyest debt

| Fil | Antall | Notat |
|---|---|---|
| `src/features/dressup/garments.example.tsx` | 40 | Demo-fil for dressup-paketten (parkert per P7.2) |
| `src/screens/HomeScreen.tsx` | 21 | Hovedsakelig 8 vær-ikon SVG-er + en-gang-inline-stiler |
| `src/screens/PlanScreen.tsx` | 14 | `weatherSvg()` SVG-ikon-funksjoner |
| `src/features/dressup/garment-visuals.tsx` | 6 | SVG `<text>` fyll, brukes kun i sandkasse |
| `src/features/dressup/DressupSandbox.tsx` | 5 | Sandkasse-only |
| `src/state/children-store.tsx` | 4 | `color`-felt på Child (data, ikke styling) |
| `src/screens/OnboardingScreen.tsx` | 1 | Migrert mest til tokens i P4 |

Totalt **91 forekomster** i TSX/TS. CSS-filer: `index.css` (33 etter
B-4 runde 1 — ned fra 76 etter `#fff`→`var(--color-surface)` migrering
2026-06-12), `tokens.css` (15 — hex-fallbacks for OKLCH som er greit).

### B-4 ferdig (3 runder, 2026-06-12)

**Runde 1** (commit 621f704): 41× `#fff` → `var(--color-surface)`.
**Runde 2** (commit 92e103d): nytt `--color-danger` token + `#fcfbf9`
hover-bg via `color-mix(in oklab, --terra 3%, --color-surface)`.
**Runde 3** (commit 755368f): nye tokens `--color-ok-deep`, `--color-warn`,
`--color-warn-deep`. Overheat-card alert-tags bruker nå tokens.

**Resultat: 76 → 24 hex i index.css.**

Av de 24 gjenværende:
- 10 er `var(--color-*, #xxx)` fallback-mønstre (KORREKT — fallback
  hvis variabel ikke er definert; ingen debt)
- 10 er `modell__note-group` kategori-farger (5 distinkte hues for
  varsel-kategorier — bevisst data-viz)
- 2 er `outfit__tier-dot` data (sage/sand for tier 1/2 ramp)
- 2 er a11y-kommentar-referanser (historisk doc)

**0 reelle legacy-hex igjen.** B-4 LUKKET.

## RUST-migrering — cascade-override fikset (2026-06-13)

P8.3 omskrev `styles/tokens.css` til rust og lot legacy-aliasene
(`--terra/--ink/--paper/--hair`) peke mot rust via `var()`. Men det er
`index.css` `:root` som faktisk definerer disse tokenene, og den importeres
**etter** `tokens.css` i `main.tsx`. Samme spesifisitet + sist-lastet vant →
`index.css` sine powder-blå-verdier (hue 230/232/250) overstyrte rust-redirecten,
og hele appen (forside + innstillinger, `--terra` ×72, `--ink` ×62) ble blå
på enheten. Grep-beviset i FABLE-PACKAGE ga falsk grønt fordi det sjekket
hex-tilstedeværelse, ikke *resolved* token-verdi.

**Fiks:** `index.css` `:root` (+ `prefers-contrast`-blokken) bærer nå rust
direkte (hue 35 aksent / hue 85 krem), speiler målene i `tokens.css`.
Verifisert i bygd CSS: 0 av disse tokenene på hue 230/232/250, alle på 35/85.
Lærdom: token-debt-sjekk MÅ verifisere resolved verdi, ikke bare grep på hex.

## Prioritert utfase (B-4 BACKLOG)

1. **HomeScreen vær-ikoner** (sun/cloud/rain/snow/sleet/fog/thunder) —
   bruk semantiske tokens (`--color-cold`, `--color-warm` + 2-3 neutrals).
2. **PlanScreen weatherSvg** — samme prinsipp, fjern duplicering med
   HomeScreen ved å trekke ut delt komponent.
3. **index.css legacy** — full revisjon under iterativ migrering, fil
   for fil (logg her per gang).
4. **Children-store `color`-felt** — data, men kan gjenbruke
   `--garment-*`-tokens om vi vil.

## Sandkasse-stier (parkert)

- `garments.example.tsx` og `garment-visuals.tsx` brukes kun av
  sandkasse-ruten (`?dressup-test=1`). Lavere prioritet.

## Bevisste data-hex (utelates fra debt)

Hex inne i SVG-ikoner som representerer fysiske fenomen er bevisst
data og ikke en kandidat for token-migrering:

- **HomeScreen.tsx vær-ikoner** (sun/cloud/rain/snow/sleet/fog/thunder):
  - Gul sol `#F2C56B` — gull-toned, ikke token-kompatibel
  - Blå-grå skyer `#8FA3BC`, `#A7BAD0` — værspesifikk neutral
  - Mørkeblå dråper `#3D7BB0` — vannrepresentasjon
- **PlanScreen.tsx `weatherSvg()`** — duplikater av samme ikon-set
- **OnboardingScreen.tsx** — 1 hex på decorative figur

Disse 32+ forekomster er bevisst utelukket fra COLOR-DEBT-tellingen.

## Justert tall (post-debt-defs 2026-06-12)

- TSX/TS i scope: ~25 forekomster (ned fra 91)
- index.css: 76 (legacy, iterativ migrering per B-4)
- tokens.css: 15 (OK hex-fallbacks for oklch)

Reelt mål for B-4: index.css legacy.

## Regel

**Ingen NYE rå fargeverdier passerer review** (per P1.2). Bruk
`--color-*` eller `--garment-*` fra `src/styles/tokens.css`. Hvis du
trenger en ny verdi, legg den til som token først.

## Sist-rørte-filer (auto-migrer ved neste touch)

Hvis du redigerer en fil i listen over, **migrer hex til tokens i samme
PR** og oppdater tellingen her. Dette gjør COLOR-DEBT.md selv-rensende
over tid.
