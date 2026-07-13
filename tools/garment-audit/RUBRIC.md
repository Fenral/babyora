# Plagg-audit — 5-punkts rubrikk (100 poeng per plagg)

Brukes av BÅDE Claude (Stadium A) OG Fable 5 (Stadium B) for å score hvert enkelt plagg.
Hvert mål gir 0–maks. Avvik klassifiseres `kritisk | hoy | medium | lav`.
Medisinske terskel-avvik (mål 3/4) er ALLTID **forslag** — aldri auto-endring.

| # | Mål | Vekt | Hva som scorer høyt |
|---|---|---|---|
| 1 | **Struktur** | 20 | `what` + `when` finnes, komplett, samme mønster/lengde/tone som søsken-plagg i samme kategori. `whyForGarment`-gren finnes (ikke fallback). Ingen plagg uten info-oppføring. |
| 2 | **Utseende** | 20 | PNG i `public/illustrations/garments/<id>.png` viser RIKTIG plagg, matcher `dbString`-navnet, stil-konsistent med resten, ingen artefakter/feil farge/feil plaggtype. |
| 3 | **Seleksjon vs kilder** | 25 | Temp-bånd × aktivitet × modifiers der plagget velges er pediatrisk forsvarlig, vurdert mot `sources.ts` (11 kilder) + web-søk der dekningen er tynn. Ingen plagg anbefalt i farlig kontekst (overoppheting/SIDS/kvelning). |
| 4 | **Tekst ↔ logikk** | 25 | `when`-teksten OG `whyForGarment`-grenen beskriver de SAMME forholdene som motoren faktisk velger plagget under (`tables.ts` + `modifiers.ts` + safety). Ingen drift (f.eks. `when` sier "5–12 °C" men motoren velger det ved −5 °C). |
| 5 | **Alternativer** | 10 | Der det er et reelt alternativ (ull↔fleece, dun↔syntet, tykkelse-trinn) tilbys det i `alternatives.ts`, med riktig "når" og "hvorfor ull først". Manglende relevant alternativ = trekk. |

## Severity-skala

- **kritisk** — sikkerhets-/helsefare (feil plagg i farlig kontekst, SIDS/kvelning/overoppheting, frostskaderisiko underkommunisert).
- **hoy** — bruker villedes (tekst↔logikk-drift som gir feil påkledning), manglende info-oppføring for et plagg motoren faktisk anbefaler.
- **medium** — inkonsistent struktur/tone, manglende relevant alternativ, illustrasjon litt off.
- **lav** — kosmetisk (ordvalg, liten tone-forskjell).

## Score-felt per plagg (begge perspektiv fyller samme form)

```
struktur:    0–20  + kommentar
utseende:    0–20  + kommentar
seleksjon:   0–25  + kommentar (+ kilde/URL ved avvik)
tekstLogikk: 0–25  + kommentar (konkret bånd/temp der drift oppstår)
alternativer:0–10  + kommentar
total:       0–100
verdikt:     kort fritekst
funn[]:      { severity, mal (1–5), beskrivelse, forslag, kilde? }
```

## Konvensjon

- Rør ALDRI tall/terskler i denne runden. Avvik → `funn` med `forslag` + `kilde`.
- Kjente hull (skal gi struktur-funn med severity `hoy`): `fleecedress`, `tynn fleece`,
  `fleecejakke`, `fleecebukse`, `ekstra ull-lag (spedbarn)` — finnes i `tables.ts`/`modifiers.ts`
  men MANGLER i `garment-info.ts`.
