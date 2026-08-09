# CURRENT-STATE-LEDGER

**Formål:** tvinge hver påstand om denne kodebasen — uansett hvem som fremmet den — gjennom samme beviskrav før den brukes til noe.

**Målt mot:** `feat/kontekstvalg-hjem` @ `d08b1d0`, avledet av tag `v1.0.18` (`9a72e9b`) — bygget som ligger i TestFlight.
**Dato:** 2026-08-09
**Kilder som er vurdert:** `tools/garment-audit/HANDOFF.md`, motorrevisjonen av 2026-08-09 (fem parallelle lesninger), og `BABYORA-AGENCY-POLISH-MASTERPROMPT.md` (Sol 5.6).

## Statuskoder

| Kode | Betyr |
|---|---|
| `OPEN` | Verifisert at problemet finnes på HEAD |
| `ALREADY_FIXED` | Var et problem, er løst nå |
| `OBSOLETE` | Gjaldt en annen kodebase eller et annet tidspunkt |
| `REFUTED` | Påstanden er feil — etterprøvd og avvist |
| `BLOCKED_CLINICAL` | Reelt, men kan ikke løses uten medisinsk godkjenning |

**Beviskrav:** hver rad må ha fil:linje, en kjørt måling, eller eksplisitt `ikke verifisert`. Enighet mellom flere kilder teller ikke som bevis.

---

## A — Påstander fra HANDOFF.md

`HANDOFF.md` kom inn med repoets første commit (`939043b`, 2026-07-13, «Initialize Babyora project and planning archive») og er aldri endret. Den beskriver forgjengeren: repo `Fenral/wool-app`, mappe `C:\Users\SkotvoldSivertSende\wool-app`, appen kalt «Klemeg». `capacitor.config.ts:9` bekrefter at Klemeg er Babyoras tidligere navn — samme produkt, tidligere repo.

| # | Påstand | Status | Bevis |
|---|---|---|---|
| A-1 | `alternatives.ts` er ukoblet død kode; blokkerer «Mål 5» | `REFUTED` | `PlaggDetailSheet.tsx:44` importerer `getAlternatives`; `garment-category.test.ts:9` importerer `ITEM_ALTERNATIVES` |
| A-2 | 60 plagg i katalogen | `OBSOLETE` | Målt: 72 webp på v1.0.18, 63 på `main` |
| A-3 | Plaggbilder er PNG | `OBSOLETE` | Alle 72 er webp, alle med alfakanal (målt) |
| A-4 | `sauekinn-i-vogn` mangler aldersgate | `OPEN` | `tables.ts:56,62,68,74` uten gate; `garment-info.ts:248` lover forbehold ingen kode håndhever |
| A-5 | 8 kliniske funn eskalert til KRITISK | `BLOCKED_CLINICAL` | Se seksjon D |
| A-6 | 12 tekstfikser i `garment-info.ts`, ikke committet | `ikke verifisert` | Ikke undersøkt i denne runden |
| A-7 | Stadium A bommet på 3 «manglende PNG»-funn | `OBSOLETE` | Gjaldt PNG-æraen; alle 72 webp finnes i dag |

**Vurdering:** to av sju påstander er beviselig feil eller foreldet på en måte som ville ført arbeid galt av sted. Filen har fortsatt verdi som audit-bevis — `scorecard.csv` med 60 rader og 60 JSON-filer er reelle data — men den kan ikke brukes som implementeringsbrief.

---

## B — Motorrevisjonen 2026-08-09

Gjelder `src/lib/wool-layers/`. **`src/lib/clothing-engine-v2/` er ikke revidert** — se B-12.

| # | Funn | Status | Bevis |
|---|---|---|---|
| B-1 | Utetemperatur mates inn i romtemperatur-TOG-tabell | `OPEN` | `recommend.ts:59-61` slår opp `soevn`-tabellen med `weather.feelsLikeC`. Målt: vogn+sovende beholder 1.0 TOG til og med 27 °C |
| B-2 | `bandForTemp(NaN)` gir kaldeste bånd | `OPEN` | Kjørt: `NaN → ekstrem`, `-Infinity → ekstrem`. `tables.ts:8-18`, alle `>=` usanne mot NaN |
| B-3 | `src/lib/research/` importeres av null kjørende linjer | `OPEN` | Søkt: kun to prosakommentarer, `modifiers.ts:481` og `:495` |
| B-4 | Ingen av de 14 kilde-ID-ene reglene siterer finnes i `sources.ts` | `OPEN` | Talt: 0 treff. Union i `safety.ts:26-29`, register i `sources.ts:24-102` |
| B-5 | 19 av 24 regler i HB/CK/SB er døde eller uten effekt | `OPEN` | Per-regel fil:linje i motorrevisjonen |
| B-6 | SIDS/kvelning har ingen håndhevende kode | `OPEN` | HB-1, HB-2, HB-5, HB-10, CK-4 alle døde; kun noter igjen |
| B-7 | App motsier seg selv ved 21 °C | `OPEN` | `conflicts.ts:51` kapper fra 21 → 1.0 TOG; `TogGuideScreen.tsx:118` viser 2.5 |
| B-8 | Vogn 22–27,9 °C utløser alltid CRITICAL fra eget tabellvalg | `OPEN` | `tables.ts:29` legger `tynt teppe`; `safety.ts:234` fjerner alt teppe ≥22 |
| B-9 | `tog-table.ts:6` erklærer seg kryss-validert, er det ikke | `OPEN` | 20 °C: 1.5 mot motorens 2.5. 16 °C: 3.5 mot 2.5. 25 °C: 0.5 mot 1.0 |
| B-10 | Vinden telles to ganger under 10 °C | `OPEN` | Inn i `feelsLikeC` via wind chill, deretter lest av `modifiers.ts:184,196,204,253,380` |
| B-11 | Seks modifiers døde fordi appen aldri sender feltene | `OPEN` | `humidity`, `uvIndex`, `innerJakke`, `context.bilstol`, `exposureMin`, `vognMode` |
| B-12 | **To motorer med ulik alderskontrakt** | `OPEN` | Hjem/Uke/FinnAntrekk bruker `wool-layers`; KlePaaStepper/MaterialPreferenceSheet bruker `clothing-engine-v2`. Kjørt: 30 mnd gir 8 plagg i wool-layers, `unsupported_age` i v2 |
| B-13 | Bæresele mangler fotdekning under 5 °C | `REFUTED` | Fotplagg finnes nøyaktig når det ikke er heldress; fra `kald` overtar kjøredressen |
| B-14 | HB-2 lar teppet ligge i vogn | `REFUTED` | CK-1 (`conflicts.ts:86`) fjerner alt teppe uten aktivitetsvakt og kjører før safety |
| B-15 | `vognMode` hardkodes på HjemScreen.tsx:438 | `REFUTED` | :438 er kommentarstart; hardkodingen står på `:456` |

---

## C — Påstander fra Sol 5.6

| # | Påstand | Status | Bevis |
|---|---|---|---|
| C-1 | Handoffen kan ikke brukes som implementeringsbrief | `OPEN` — bekreftet | Sammenfaller med A-1 til A-3 |
| C-2 | 72 mappede webp i dagens katalog | **Bekreftet** | Målt 72 på v1.0.18. Min egen tidligere telling på 63 var fra `main` og var feil gren |
| C-3 | Produktet er for 0–24 måneder | **Delvis** | Gjelder `clothing-engine-v2` (`age.ts:12`). `wool-layers` har ingen aldersgrense; `feels-like.ts:2` sier «0-3 år». Se B-12 |
| C-4 | Impeccable-detektor: 0 regelbrudd på `src/components/hjem` | `OPEN` som funn om porten | På samme flate er målt: innhold krysser tab-baren, ingen mørk modus, 21 slides for 6 plagg. En port som melder grønt der måler feil ting |
| C-5 | 12/40 på Nielsen for handoffen | `REFUTED` som metode | Nielsens heuristikker scorer grensesnitt, ikke dokumenter. FAIL-dommen står; tallet bør strykes |
| C-6 | Sols P0-liste | Ufullstendig | B-1 mangler. Det er arkitektur, ikke klinisk terskel, og kan derfor ikke vente på helsesøster |
| C-7 | Autoritetsrekkefølgen (masterprompt l. 74–82) | **Anbefales adoptert** | Plasserer kjørende kode over audit-prosa — nøyaktig feilmekanismen bak A-1 og B-13/B-14 |

---

## D — Kliniske blokkeringer

De åtte fra handoffen. Ingen er faglig avklart; `HELSESOSTER-KRITISK.md` bekrefter at sporet aldri ble startet.

| Plagg | Type | Status |
|---|---|---|
| `regntrekk` | Omgår varmefelle-regel | `BLOCKED_CLINICAL` |
| `sauekinn-i-vogn` | Ingen aldersgate, mykt underlag | `BLOCKED_CLINICAL` |
| `sovepose-2-5-tog` | Under-isolering | `BLOCKED_CLINICAL` |
| `sovepose-1-0-tog` | Tekst på sikkerhetsfelt | `BLOCKED_CLINICAL` |
| `tynt-teppe` | Tekst på sikkerhetsfelt | `BLOCKED_CLINICAL` |
| `pyjamas` | Tekst på sikkerhetsfelt | `BLOCKED_CLINICAL` |
| `tynn-pyjamas` | Tekst på sikkerhetsfelt | `BLOCKED_CLINICAL` |
| `to-ullsett` | Tekst på sikkerhetsfelt | `BLOCKED_CLINICAL` |

Og porten koden selv setter, `tables.ts:5-7`:

> *«MÅ valideres av helsesøster før produksjons-lansering.»*

Ingen sporbar kvittering funnet. Tabellen er i TestFlight.

---

## E — Plaggkatalogen, målt på riktig gren

Min opprinnelige måling ble gjort på `main` og gjaldt derfor feil gren. Målt på nytt her:

| Lerret | Antall |
|---|---|
| 640×349 | 55 |
| 640×640 | 8 |
| **1254×1254** | **5** |
| **512×512** | **2** |
| 429×640 | 1 |
| 640×357 | 1 |

**Seks ulike lerret**, mot fire på `main`. Sideforholdet spenner fra 0,67 til 1,83 — **2,7× forskjell i hvor stort plagget tegnes** i samme kvadratiske miniatyr.

De to nye lerretene kom med de ni filene v1.0.18 la til: `bomullssett`, `bomullssokker`, `fleecejakke`, `tykk-fleece`, `tynn-fleece` på 1254×1254, og `fleecebukse`, `fleecedress` på 512×512.

**Avviket er aktivt, ikke historisk.** Hver nye batch innfører et nytt format. Alle 72 har alfakanal, så ingen gir opak firkant. Vekt: median 19 KB, største 186 KB, totalt 1,9 MB.

---

## Oppsummering

| Status | Antall |
|---|---|
| `OPEN` | 16 |
| `REFUTED` | 5 |
| `OBSOLETE` | 3 |
| `BLOCKED_CLINICAL` | 8 |
| `ikke verifisert` | 1 |

**Fem av 33 påstander falt ved etterprøving** — to fra handoffen, to fra min egen første runde, én fra Sols metode. Én av dem, C-2, var min feil: jeg målte på feil gren og oppga 63 der det riktige er 72.

Det er poenget med dette dokumentet. Ingen av de fem ville blitt fanget av at flere kilder var enige.
