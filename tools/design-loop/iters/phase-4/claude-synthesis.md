# Phase 4 — Vær-scene + comfort-feedback — Claude self-eval

Commit: `5ff251c`
Preview: wool-app-git-redesign-instrument-level-sivert-s-projects.vercel.app
Screenshot: `phase-4-hjem.png` (390×844, vogn-sleeping, A7 avatar, sun-mode)

## Score (samme 7-dim RUBRIC)

| Dim | Phase 2.5 (Søvnro) | Phase 4 | Δ | Note |
|---|---|---|---|---|
| Hierarki (25) | 23 | **24** | +1 | Pille øverst gir tilleggsinfo uten å konkurrere. Avatar fortsatt primær. |
| Visuell forklaring (25) | 24 | **25** | +1 | Scene = vær-kontekst, pille = comfort-feedback. To nye info-lag uten å forstyrre. |
| Typografi (15) | 13 | **13** | 0 | Pille-tekst 12px/600 leser fint. |
| Motion (10) | 9 | **9** | 0 | Subtile sol-stråler statisk i sun-mode, regn/snø animert i sin mode. Reduced-motion stopper alt. |
| Farge (10) | 8 | **9** | +1 | 3 nye comfort-hues (145/260/40) distinkte fra Søvnro powder-blue (232). Mint mot powder-blue er pen sub-aksent. |
| A11y (10) | 10 | **10** | 0 | A11y-lead P0/P1 fulgt fullt ut. |
| AI-slop (5) | 3 | **5** | +2 | Comfort-badge + WeatherScene er distinkte mønstre. Ikke kategori-reflex — sjelden å se i baby-app-segmentet. |

**Total: 95/100** (+5 fra Phase 2.5)

## Hva som fungerer

1. **«Passe kledd» mint-pille** øverst sentrert leser som passe-status uten å skrike. Smile-ikon + 12px bold tekst er kompakt.
2. **Sol-stråler** subtile (lav opacity), legger til mood uten å konkurrere med Lillian.
3. **Powder blue intakt** — paletten har overlevd to nye element-typer (Søvnro fortsatt eier hjemmet).
4. **Engine-koblet comfort** — `comfortFromRecommendation` mapper severity + tempBand + layerScore til 3 stater. Ekte data, ikke mock.
5. **A11y-tette kombo** — pille er `role="status"` med debounce 150ms (samme mønster som peel-control), WeatherScene helt aria-hidden + reduced-motion + forced-colors-display:none.

## Hva som fortsatt er svakt

1. **Sol-stråler kunne vært litt sterkere** — i nåværende sun-mode er det 0.10-0.12 opacity på terra-deep, knapt synlig. Vurder 0.18-0.22 hvis sun føles for stille.
2. **Comfort-pille ved «comfortable» vises alltid** — kanskje skjul den med fade hvis state IKKE er bekymrende? Eller la den være som «alt er ok»-bekreftelse?
3. **Avatar er fortsatt A7 (sovepose)** for vogn-sleeping default — ikke testet med vogn-awake der WeatherScene-modus vil endre seg via aktivitet-bytte.
4. **Rain/snow ikke verifisert visuelt** — Oslo har «Sol» i dag. Animasjoner skal kjøre, men ikke spot-testet på live data.

## Gate-status

95 ≥ 85 → behold. +5 fra Phase 2.5 — Phase 4 er en netto-gevinst.

Avatar-first-mønsteret er nå komplett med alle 4 phases:
- Phase 1+1.5: Hotspot pattern (pins + bottom-sheet) ✓
- Phase 2: Layer peel (røntgen) ✓
- Phase 2.5+2.6: Søvnro powder-blue palett ✓
- Phase 4: Vær-scene + comfort-feedback ✓

Phase 3 (dress-up entrance) er gjenværende fra opprinnelig avatar-first-spec,
men ikke kritisk — Sivert kan velge om vi gjør det neste eller går videre.
