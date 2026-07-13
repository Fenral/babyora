# Babyora — design-signatur

**Versjon:** v1 (2026-06-15)
**Status:** LÅST (alle design-valg orienteres mot dette)

## Setningen

> **«Babyora er et taktilt instrument, ikke en list-app.»**

Lane: **instrument** (TrackMan / Apple Weather / Apple Watch Activity).

## Hva det betyr i praksis

### Form (visuelt)

- **Stack-metaforer** over flat card-grid. Lag presenteres som
  stablede fysiske objekter (LayerBlocks-stil), ikke som likeverdige
  kort.
- **Fysisk dybde** via shadow-systemet. Grønnlig-tonet shadow på
  top-elementer, ingen shadow på bunn-elementer. Lager visuelt
  «vekt-hierarki».
- **Datavisualisering der det er meningsfullt:**
  - Termometer-input i Guide
  - TOG-skala-bar i sovepose-detalj
  - Vær-pille som instrument-display (temp + symbol + meta-rad)
  - Lag-rad-thumb-mini som «valgte plagg-status»
- **Aksent-farger som instrument-LED:**
  - `--terra-deep` (rust) — primær brand
  - `--premium` (gull) — KUN på låste Premium-element
  - Ingen tertiær aksent. Disiplinert palett.
- **Inter** som monospace-ish, presisjons-font (tabular-numbers
  i count-up-displays). Ikke editorial.
- **DM Serif Display** brukes BARE på navne-hero («Lillian»,
  plagg-tittel, paywall-headline) — IKKE som body.

### Bevegelse (motion)

- **Lav motion-intensitet, høy presisjon.** Hver micro-anim har et
  formål (state-bytte, data-update, feedback). Aldri dekorativ
  bevegelse.
- **Custom ease-out-curves** (cubic-bezier 0.23, 1, 0.32, 1 default).
  Ingen `ease-in` på enter. Ingen overshoot/bounce på primary.
- **Spring-følelse via duration + curve, ikke via translateY-overshoot.**
- **Blur-bridge** for tier-bytter (gjenspeiler kamera-fokusering på
  instrument-skjerm).
- **Count-up** for tall-displays (vær-temp, layer-count) — gir
  inntrykk av instrument som måler kontinuerlig.

### Følelse (taktil)

- **Press-feedback overalt.** Hvert tappable element scaler (0.97)
  på `:active`. Differensiert haptikk per intent (selection/light/medium/heavy).
- **Instrument-respons:** appen RESPONDERER til berøring, ikke
  «ignorerer» tap.
- **Predictable.** Same trykk → samme feedback. Aldri tilfeldig.

### Skrive-stemme

- **Direkte, ikke vennlig-pratsom.** «Sjekk nakken hver 15. minutt»,
  ikke «Husk å sjekke nakken med jevne mellomrom 😊».
- **Verb-først CTAer:** «Finn antrekk», «Sett i gang», «Bytt plagg».
- **Tall + enheter med presisjon.** «10° · Føles 9° · 2.3 m/s» —
  instrument-meta, ikke skjult.

## Mot-eksempler — det vi IKKE er

| Lane | Eksempel-app | Hvorfor ikke Babyora |
|---|---|---|
| Stille assistent | Headspace, Calm | Lav motion-intensitet OK, men vi krever instrument-respons og press-feedback |
| Redaksjonell rådgiver | Medium, Substack | DM Serif everywhere ville gjøre oss til magazine. Vi har serif kun på hero |
| Flat Material Design | Google-apps | Ingen fysisk dybde. Instrument-lane krever shadow-stack |
| Playful onboarding-app | Duolingo, Babbel | Bounce + emojis = casual. Vi er rolig, presis |
| SaaS-dashboard | Notion, Linear | Datavisualisering OK, men vi er ikke produktivt verktøy — vi er hverdagsråd |

## Hva dette betyr for fremtidige beslutninger

Hver design-beslutning skal kunne svare på:

> «Forsterker dette en instrument-følelse — taktil presisjon — eller
> bryter det den?»

Konkrete tester:
- **Animer aldri en transition lengre enn 360ms** (over det → magazine-tempo)
- **Bruk aldri side-stripe borders** (det er liste-tegn, ikke instrument)
- **Vis tall med presisjon** (10° ikke «10 grader», 2.3 m/s ikke «litt vind»)
- **Stack > grid** ved konkurrerende konsepter (LayerBlocks vs gruppert liste)
- **Press-feedback er obligatorisk** på alle tappable element

## Versjons-disiplin

Når noen i fremtiden vil endre design-DNA, må de:
1. Oppdatere denne fila først
2. Begrunne hvorfor signaturen må endres
3. Eskalere til Sivert + arkitekt-runde

Det er ikke et tilfeldig stilvalg. Det er Babyora's identitet.
