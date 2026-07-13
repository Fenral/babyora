# Phase 1 — Claude orkestrator-syntese

Commit: `2ef43ac` · Preview: wool-app-git-redesign-instrument-level-sivert-s-projects.vercel.app

## Score (samme 7-dim RUBRIC)

| Dim | Score | Note |
|---|---|---|
| Hierarki (25) | 18 | Avatar er klart primær. Vær-strip + KnowTip + bottom-toggle konkurrerer fortsatt litt. |
| Visuell forklaring (25) | 19 | Hotspot-pins er PRESIS svaret på «hvordan komme nær avatar». Bruker forstår nå at lagene henger på kroppen. |
| Typografi (15) | 10 | DM Serif på «Lillian» OK. Pin-tall 14px bold er passe. Chip-pill 13px medium ok. |
| Motion (10) | 7 | Stagger entrance + breathing pulse er subtil. Sheet slide-up springer naturlig. Hadde scoret 9+ med dress-up-sekvens (Phase 3). |
| Farge (10) | 7 | Court Clay-paletten harmoniserer. Pins er kraftig terra, kanskje overdose hvis bruker ser dem mye. |
| A11y (10) | 9 | Focus-trap + inert + restore-focus implementert. Reduced-motion respektert. Aria-haspopup på pin/chip. |
| AI-slop (5) | 4 | Pattern er Apple-Maps-tier — ekte hotspot-pattern, ikke generisk. |

**Total: 74/100**

## Hovedstyrker

- Pin-pattern løser «hvordan avatar = svaret» — bruker tapper pin, får forklaring + alternativer
- Chip-row + pins synkronisert (Sivert-spec)
- Pedagogisk: «Lag 1 av 4» annonseres til SR
- Bottom sheet med reason + alternatives gir KONKRET INFO bruker kan agere på
- A11y-fixes innbygd fra første commit (focus-trap, inert, restore-focus)

## Problemer

1. **Avatar viser feil tier**: skjermbildet viser A1 (kortermet body, bare bein) selv om aktivitet=vogn + Oslo 14° tilsier minst A3-A4. `tierFromRecommendation` må verifiseres.
2. **Pin-overlapp på lille avatar**: pin 1 ligger over hode av pin 4. Anchor-koordinater må justeres når avataren faktisk har klær på (A3+).
3. **Mangler pin 3 (yttertøy)**: hvis yttertøy-kategori er tom (mellomlag→ekstra-hopp), step-nummerering blir 1,2,4. Bør renummerere til 1-2-3 visuelt.
4. **Vær-strip ovenfor avataren** er fortsatt mørk og tar plass — kan flyttes til side eller forminskes.
5. **«Skal i bilstol»-toggle nederst** er igjen fra gammel kode (utenfor scope iter-007), men dukker opp her — bør droppes fra Hjem.
6. **Bottom-sheet ikke testet med screen reader** — implementasjonen er klar, men praktisk verifikasjon mangler.

## Anbefaling for neste steg

- Sjekk `tierFromRecommendation`-logikken for vogn-mode (default vognMode='sleeping' gir trolig A7-tier som er feil for ute-presentasjon)
- Renummerér pins/chips kontinuerlig (drop tomme kategorier først, deretter 1,2,3,4 i sekvens)
- Pin-anchor x-offset for å unngå overlapp på lite avatar

Hvis Copilot + Fable 5 lander snitt ≥ 85 → Phase 2 (layer peel) starter.
Hvis snitt 75-85 → polish-runde på tier-mapping + pin-renummerering.
Hvis snitt < 75 → stopp og spør Sivert om retning.
