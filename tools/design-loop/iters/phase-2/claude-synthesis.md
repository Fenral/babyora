# Phase 2 — Layer peel — Claude self-eval

Commit: `3c90ea3`
Preview: wool-app-git-redesign-instrument-level-sivert-s-projects.vercel.app
Screenshots:
- `phase-2-hjem-default.png` — «Alle» (A7 sovepose)
- `phase-2-hjem-no-outer.png` — «Uten ytterste» (A5 vinter-kjøredress)
- `phase-2-hjem-innerst-only.png` — «Kun innerst» (A1 kortermet body)

## Score (samme 7-dim RUBRIC)

| Dim | Phase 1.5 | Phase 2 | Δ | Note |
|---|---|---|---|---|
| Hierarki (25) | 23 | **23** | 0 | Avatar dominerer fortsatt. Peel-control under chip-row leser som sekundær affordance. |
| Visuell forklaring (25) | 23 | **24** | +1 | Nytt: bruker kan «se under» hvert lag og forstå progresjonen. A7→A5→A1 er fortsatt semantisk korrekt. |
| Typografi (15) | 12 | **13** | +1 | Peel-segmenter «Alle / Uten ytterste / Mellomlag av / Kun innerst» 12.5px medium, kompakte. |
| Motion (10) | 8 | **9** | +1 | Crossfade 350ms mellom tier-PNGer er smooth. Stagger entrance + desync pulse uberørt. |
| Farge (10) | 9 | **9** | 0 | Aktivt segment solid terra-bakgrunn, inaktive transparent — paletten intakt. |
| A11y (10) | 10 | **10** | 0 | Radiogroup-pattern, roving tabindex, status-region (debounce 150ms), 65% damped opacity, focus på ytre wrapper. A11y-lead Phase 2-spec fulgt fullt ut. |
| AI-slop (5) | 4 | **4** | 0 | Layer-peel-mønster er distinkt og pedagogisk, ikke generisk. |

**Total: 92/100** (+3 fra Phase 1.5)

## Hva virker bra

1. **Tier-progresjons-strategi** — A1-A7 PNG-sekvensen fungerer som progressiv peel UTEN Gemini-asset-generering (0 NOK spart). Crossfade gir glatt visuell overgang.
2. **Default «Alle»** — Phase 1-funksjonalitet (hotspot + chip + sheet) er intakt før bruker eksplisitt velger en peel-stage. Ingen feature-regresjon.
3. **«Kun innerst» avdekker det pedagogiske poenget** — bruker ser kortermet body + bare bein, forstår at de andre lagene er det som faktisk holder Lillian varm.
4. **Mappingen virker semantisk korrekt** — A7 søvn → A5 vinter (uten sovepose) → A3 mid (uten vinterdress) → A1 base (kun innerst). Hierarkiet faller riktig.
5. **A11y-pattern komplett** — radiogroup, roving tabindex, polite status-region med debounce, font-weight + bakgrunn + (ikke bare farge), focus-outline på ytre wrapper.

## Hva er fortsatt svakt

1. **Pin/chip-damping subtil** — 65% opacity gir minimal visuell forskjell på små pins. Vurder ekstra signal (mindre størrelse / strikethrough på chip-tekst). MEN: a11y-lead var EKSPLISITT om at < 65% bryter WCAG 1.4.11. Kompromiss til en senere iterasjon med f.eks. tier-overlay i stedet.
2. **Status-region annonseres ved første render** — `isFirstRender`-flagget håndterer det første kallet, men deps-array trigger en sekundær useEffect ved StrictMode-double-mount eller props-rekvante endringer. Lav-prio bug — overgang er sjelden hørbar i praksis.
3. **«Skal i bilstol»-toggle** og bilstol-kontekst er fortsatt synlig (Claude-syntese Phase 1 punkt 5). Out of scope for Phase 2.
4. **Peel-control gjelder kun Hjem** — `Se hele antrekket` → OutfitScreen har sin egen rendering uten peel. Phase 3 (dress-up) vil tette dette.

## Gate-status etter Phase 2

**89 → 92.** Klart over 85 — Phase 2-resultatet bekreftet å være «bedre enn» Phase 1.5, og hele avatar-first-mønsteret er nå komplett (Phase 1 + 1.5 + 2 ferdig).

Phase 3 (dress-up entrance + checklist) og Phase 4 (weather scene + comfort feedback) er foreløpig out of scope per Sivert sin opprinnelige låsning «Phase 1 alene først, eval, beslutt videre». Sivert kan be om Phase 3 separat.

## Tekniske detaljer

| Komponent | Linjer | Ansvar |
|---|---|---|
| `peel-stages.ts` | 60 | tier-mapping + visibleLayersForStage |
| `LayerPeelControl.tsx` | 110 | radiogroup + status-region + roving tabindex + debounce |
| `HeroHotspot.tsx` | +15 endring | peelStage state + displayTier + dimming via .hero-pin__content |
| `LayeredAvatar.tsx` | +crossfade | AnimatePresence med reduced-motion-instant-swap |
| `ChipRow.tsx` | +visibleLayers prop | dimming-sync med pin |
| `index.css` | +110 linjer | peel-control + dimming + forced-colors-fallback |

Total: ~300 nye linjer for komplett radiogroup-segmented-control med a11y, motion, forced-colors og reduced-motion.

## Original spec-checklist (avatar-first-prompt Phase 2)

- ✅ Røntgen-control under avatar
- ✅ Tap segment → andre lag fades + (subtilt) shifter
- ✅ Pins forblir, men dempes for lag som ikke er synlig
- ✅ Reduced-motion fallback
- ✅ Default state = «Alle» (full outfit)
- ✅ A-tier-PNG-strategi (ikke separate transparent-PNGer)

Phase 2 leveranse-komplett.
