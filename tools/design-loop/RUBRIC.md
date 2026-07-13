# Babyora — Design score-rubrikk (100 poeng)

Brukes av alle tre challengers (Microsoft Copilot, /impeccable, /emil-design-eng) for å score hver iter av Hjem-skjermen. Maks 100. Mål: ≥ 95.

| Dimensjon | Vekt | Hva som scorer høyt |
|---|---|---|
| **Hierarki & klarhet** | 25 | Hero dominerer (≥45% above-fold). Én primær beslutning per skjerm. Tertiær info er klart underordnet. |
| **Visuell forklaring** | 25 | Lag-stabling synes uten å lese tekst. Bruker forstår antrekket på <1 sekund. Cause→effect tydelig. |
| **Typografi & tekst-økonomi** | 15 | Ingen redundant tekst. Tekst-skala har ≥1.25-ratio mellom hierarki-nivåer. Maks 1 setning per nivå. |
| **Motion & feedback** | 10 | Animasjon har formål (cause→effect, stack build-up). Easing er strong (ease-out-quart-stil). Reduced-motion respektert. |
| **Farge & depth** | 10 | OKLCH-palett konsistent (Court Clay). Kun heroen har sterk skygge. Tertiær elementer flate. |
| **Touch-target & a11y** | 10 | Alle tappebare ≥44px. ARIA-strukturer riktig. Kontrast ≥4.5:1 på normal tekst, 3:1 på UI-komponenter. |
| **AI-slop-test** | 5 | Designet føles ikke generisk SaaS. Ingen «gradient-text», «hero-metric-template», «identiske card-grids». |

## Score-aggregering

For hver dimensjon: gi 0–maks-vekt. Summer. Total er rapporterings-score.

## Konvergens-signal

Hvis to runder på rad gir < 5-poeng økning OG ingen challenger anbefaler stor strukturell endring → **STOPP** (designet har konvergert nær lokalt maksimum; videre iter er polish-jakt).

## Survivor-design-regel

Hvis alle tre challengers identifiserer SAMME konkrete problem to runder på rad uten at det er løst → **STOPP og pivot** — det betyr enten at problemet ikke kan løses uten større refaktor, eller at challengers er låst i samme blindsone.
