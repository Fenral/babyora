# F79 SLUTTRAPPORT — Visual-first differensieringsloop

**Kjørt:** 2026-07-01 → 2026-07-02 · **Kost:** ~50 av 150 NOK PoC-ramme
**Beslutningspakke:** https://wool-app.vercel.app/design-2026/f79-sammenligning/

## Reisen

| Fase | Resultat |
|---|---|
| Baseline (6 skills) | **40,8/100** — vær 33, avatar 34, popup 34, farge 48,5 |
| Farge-pivot | 4 systemer bygget → panel valgte Brevann (78,8) → **Sivert overstyrte: Morgennatt** (eks-Vinternatt, 77,3) |
| Klesretning | 4 stil-prøver → **B: myk 3D clay-render** (koherens m/3D-vær) |
| Avatar-anatomi | **LØST via edit-kjede** — hvert steg redigerer forrige bilde, babyen re-tegnes aldri. Ny ekte spedbarns-baby etter Sivert-feedback (hode 1/3, trekk lavt, lubben) |
| Alpha-pipeline | Modellen leverer aldri ekte alpha → magenta chroma-key + sharp despill (gjenbrukbar: `scripts/f79-final-pipeline.mjs`) |
| CTA-analyse | Korall kolliderte m/plagg-korall (7,8° hue-avstand) → **Granmynte #267147/#65D097** (alle par PASS, eneste grønne objekt). Fallback: rubinkorall #EF7179 |
| Re-score-loop | 4 iter, ærlige dommere: Hjem A 66→**83,1** (topp), Påkledning C 71,8 (koherens-pass). 95-målet ikke nådd — gjenstående gap er distinctness-nyanser, ikke feil |
| Vinnere | **Hjem A** (Sonnet-fikset + Morgennatt) + **Påkledning A** (Siverts eksplisitte valg, komposisjons-mønsteret) |
| A11y | Pre-clearance + post-sweep: Hjem A SHIP, Påkledning A REWORK→fikset (transitionend-guard, 44px targets, forced-colors-state, aria-live) |
| Guide-analyse | Fasit-autoritet 48, læring 62, innhold 40, kilder 25 → tiltakene i `guide-analyse.md` |

## Vinner-leveranser (live)

- **Hjem A (Morgennatt):** /design-2026/f79-hjem-a/ — 196px temp-mast, clay-sol, dressing ved load, Granmynte-CTA, temp-akse isblå 262°→lyng-rosé 345°
- **Påkledning A (Morgennatt):** /design-2026/f79-paakledning-a/ — antrekks-komposisjon m/klikkbare plagg-kort (i-badge + hover-lift + detalj-panel) og alternativ-indikator (stablet kort + «2 alternativer» + i aria-label)
- **Avatar-PoC:** /design-2026/f79-avatar-poc/ — påkledningssekvens stage-0→4

## Gjenstående svakheter (ærlig, fra dommerne + Fable-evaluering)

1. Distinctness-gap mot 95: statement-elementer kan differensieres mer (mast vs avatar-størrelse), atmos-grain/tekstur tynn i Hjem A
2. Påkledning A: body-thumben leser litt merkelig rotert; avatar kunne vært større i komposisjonen
3. Stage-4: korall-body synlig ved hoften (edit-artefakt — leser som lag-fortelling, men QA-es i batch)
4. Kald/mild-differensiering i Morgennatt lys modus er 28° — test på ekte telefon i morgenlys
5. Guide-tiltakene er analysert men ikke implementert (F80)

## F80 — anbefalt scope + kost

| Post | Innhold | Est. kost |
|---|---|---|
| Prod-port | Hjem + Påkledning-popup → React (tokens, komponenter, dressing-sekvens, affordances) | 0 NOK (AI-tid ~3-5 t) |
| Avatar-batch | Tier-states i clay via edit-kjede (7 tiers × vær-varianter, ~10-20 bilder) | ~15-30 NOK |
| Plagg-thumbs | 62 stk re-gen i clay m/magenta-pipeline (koherens i popup) | ~90-140 NOK |
| Vær-ikoner | 6-8 clay-ikoner (delvis/skyet/regn/snø/tåke/natt) | ~10-15 NOK |
| Guide-løft | Verdikt-hero i FinnAntrekk + autoritets-copy + kilder + tillits-bugs | 0 NOK |
| **Total** | | **~115-185 NOK + AI-tid** |

## Beslutninger til Sivert (gate)

1. Godkjenn Morgennatt-implementeringen som F80-retning (Hjem A + Påkledning A)
2. CTA: Granmynte (anbefalt) eller rubinkorall-fallback
3. Full asset-batch ~115-185 NOK
4. Guide-løftet inn i F80-scope
5. Babyen: riktig alder/uttrykk, eller justering før batch
