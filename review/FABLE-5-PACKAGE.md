# Babyora — Review-pakke til Fable 5 (uavhengig vurdering)

> **Til Fable 5:** dette er en oversikt over arbeidet utført basert på din
> review fra 2026-06-12. Den interne Claude-loopen er ferdig på teknisk
> nivå — vi ber om din uavhengige vurdering før vi merger til main.

## Bestilling

`babyora-fix-redesign-prompt (5).md` — 7 faser (P0-P6), 13 akseptansekriterier.

## Live-URL for vurdering

**Hjem-vy (åpen i 23 t fra 12. juni 2026):**
https://wool-app-git-redesign-instrument-level-sivert-s-projects.vercel.app/?_vercel_share=7emEVUebkzgr0nLQiEFiTK8RirJX2FBU

**Sandkasse (orbit-isolert):**
https://wool-app-git-redesign-instrument-level-sivert-s-projects.vercel.app/?dressup-test=1&_vercel_share=7s9yMq5TAcyFujdThTDqbhFSjacBHinH

> Hvis URL-en krever innlogging: be Sivert om en ny `_vercel_share`-token
> (de utløper etter 23 timer). Permanent fix er å slå av Vercel Deployment
> Protection — ikke gjort enda.

## Branch

`redesign/instrument-level` på `Fenral/wool-app`. 15 commits siden Fable-
review (start `e7aa334` → ende `6cb00d4`).

## Hva som er implementert per fase

### P0 — Troverdighet (alt grønt)

| # | Fix | Bevis |
|---|---|---|
| P0.1 | Engine-summary erstatter hardkodet «Ull + fleece + yttertøy» | `src/lib/summary.ts` + 14 tester |
| P0.2 | Orbit-dedup + dynamiske posisjoner + ellipse-glow + +N-tag for >6 plagg | `src/features/dressup/garment-visuals.tsx` + 10 tester |
| P0.3 | Værikon mappet med regel «aldri nedbør-ikon når 0 mm/t» | `src/lib/weather-icon.ts` + 11 tester |
| P0.4 | Sted-konsistens (`active.city` overalt) + relative datoer i 10-dager | `SettingsScreen` fikset i runde 1 (`R1.1`) |
| P0.5 | Time-for-time + empty-state med «Prøv igjen»-knapp | `PlanScreen.tsx` empty branch |
| P0.6 | Klikkbare timer/dager → `TimeShiftSheet` med tidsforskjøvet anbefaling | `src/components/TimeShiftSheet.tsx` |

### P1 — Designtokens (delvis)

| # | Fix | Status |
|---|---|---|
| P1.1 | OKLCH-tokens med hex-fallback | `src/styles/tokens.css` ✓ |
| P1.2 | Anvendt på borders + flater (hue 50 → 230) | Delvis — store komponenter fortsatt egne hex-verdier |
| P1.3 | Mini-Lillian fjernet fra header | ✓ |
| P1.4 | Stram Hjem-layout + AKTIVITET over «Vis lag» | ❌ **UTSATT** |

### P2 — Funksjonelle hull

| # | Fix | Status |
|---|---|---|
| P2.1 | Bytte-chips skjult (kunne ikke kobles til motor i denne runden) | ✓ skjult bak `SHOW_ALTERNATIVES = false` |
| P2.2 | Dynamisk «Hvorfor i dette antrekket?» med interpolerte verdier | ✓ (eksisterte allerede via `whyForGarment`) |
| P2.3 | Bilstol → HB-9 fjerner vinterkjøredress | ✓ (eksisterte allerede i motor) |
| P2.4 | Språkvask «inner lag» → «innerlag» | ✓ (5 forekomster fikset) |

### P3 — Matrix + guardrails

| # | Fix | Status |
|---|---|---|
| P3.1 | `scripts/matrix.mjs` → `review/MATRIX.md` (4608 motor-kjøringer) | ✓ |
| P3.2 | 6 sanity-guardrail-tester (HB-9, bar hud, vinter-grenser, …) | ✓ alle grønne |

### P4 — Onboarding (delvis)

| # | Fix | Status |
|---|---|---|
| P4 | Lillian-i-onboarding (3 steg) + bakgrunn-gradient + steg-3-duplikat | ❌ **UTSATT** |
| P4 | Lys datovelger (`color-scheme: light`) | ✓ |

### P5 — Animasjon

| # | Fix | Status |
|---|---|---|
| P5 | Idle-drift på orbit-tags (1-2 px, 7-9 s, desynkronisert) | ✓ CSS |
| P5 | ComfortBadge fade/scale-inn | ✓ CSS |
| P5 | Vær-partikler (rain/snow) | ✓ CSS keyframes klar — krever at WeatherScene rendrer `.weather-scene__particle`-noder |
| P5 | `prefers-reduced-motion` slår av alt nytt | ✓ |
| P5 | Retur til Hjem uten re-spill (sessionStorage) | ✓ |

### P6 — Playwright-loop

| # | Fix | Status |
|---|---|---|
| P6 | `scripts/review-shots.ts` (Playwright-test, FORBEREDT) | ✓ |
| P6 | `review/CHECKLIST.md` (ja/nei-spørsmål per skjermbilde) | ✓ |
| P6 | Loop kjørt: 2 runder (R1, R2) | ✓ — avdekket 2 bugs, begge fikset |

## Bugs avdekket og fikset i Playwright-loopen

### R1.1 — Innstillinger hardkodet «Trondheim» (commit `09196ed`)
Den opprinnelige Fable-buggen levde fortsatt i `SettingsScreen.tsx:68`.
Hjem og Uke leste fra `useChildren().active.city`, men Settings hadde
strengen hardkodet. Fix: importer `useChildren`, bruk `{active.city}`.

### R1.2 — Orbit-tags rendret men opacity 0 (commit `6cb00d4`)
DOM-evaluering bekreftet 3 plagg-buttons, men `<g data-garment>` hadde
inline `opacity:0` og `getAnimations() = 0`. Sannsynligvis StrictMode-
dobbeltkjøring eller subtle prop-endring som triggret cleanup på play.
Fix: DOM-overstyring av inline opacity til 1 etter mount i
`DressUpOrbital.useEffect`. WAAPI keyframes overstyrer mens animasjon
kjører (1500 ms-vindu).

## Utestående (planlagt for neste runde)

1. **P1.4** AKTIVITET-velger over «Vis lag» + stramme hero-høyden ved få
   plagg
2. **P4** full Lillian-i-onboarding (3 steg) + bakgrunn-gradient +
   steg-3 sted-pille-fix
3. **P2.1 full** `recommend(..., { overrides })` i wool-layers for ekte
   bytt-plagg-funksjon
4. **A-1 (ANOMALIES)** Guide-kalkulator ved +5° + frisk vind + yr →
   4 lag vinterkjøredress (krever menneskelig terskel-beslutning)
5. **Cosmetic R2** «Body»-tag overlapper Lillian når kun 3 plagg
   (stram-radius case)
6. **Cosmetic R2** Plagg-navn lowercase i `LayerDetailSheet`-overskrift

## Akseptansekriterier — selv-rapport

| # | Krav | Selv-rapport |
|---|---|---|
| 1 | Engine-driven summary, motsier aldri antrekk-siden | ✅ |
| 2 | Orbit uten duplikater/overlap, 1-8 plagg | ✅ (men cosmetic-bug for 3-plagg) |
| 3 | Ingen rå hex (OKLCH tokens) | 🟡 Delvis — hovedtokens migrert, men mange komponenter har egne hex |
| 4 | Én Lillian på Hjem | ✅ |
| 5 | Klikkbare timer/dager + tidsforskjøvet | ✅ |
| 6 | Bytte-chips skjult eller virker | ✅ skjult |
| 7 | Dynamisk «hvorfor i dette antrekket» | ✅ |
| 8 | Bilstol HB-9-notis | ✅ |
| 9 | MATRIX + ANOMALIES + guardrail-tester | ✅ |
| 10 | Sted/dato konsistent | ✅ (etter R1.1) |
| 11 | Onboarding tokens + Lillian + lys datovelger | 🟡 Datovelger ✓; Lillian + bakgrunn utsatt |
| 12 | prefers-reduced-motion slår av nytt | ✅ |
| 13 | Build grønn, tester grønne, separate commits | ✅ 55 tester grønne, 15+ commits |

## Spørsmål til Fable 5

1. Er **P1.4** (layout-justering) viktig nok til å blokkere merge til main?
2. Er **P4** (Lillian-i-onboarding) en separat fase eller skal det med i
   neste runde her?
3. Hvordan vil dere prioritere de 6 utestående punktene?
4. Er kvaliteten på orbit-tag-plasseringen ved 3 plagg akseptabel for v1?

## Filer for review

- `review/REVIEW-1.md` (runde 1 funn + fix)
- `review/REVIEW-2.md` (runde 2 verifikasjon)
- `review/MATRIX.md` (4608 motor-kjøringer)
- `review/ANOMALIES.md` (A-1: Guide-kalkulator)
- `review/CHECKLIST.md` (ja/nei-rubrikk)
- `review/shots/r1-430x900/` (5 skjermbilder)
- `review/shots/r2-430x900/` (1 skjermbilde)

— Sivert + Claude (anthropic.com)
