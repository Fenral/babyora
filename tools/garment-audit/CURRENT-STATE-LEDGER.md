# CURRENT-STATE-LEDGER

**Formål:** tvinge hver påstand om denne kodebasen — uansett hvem som fremmet den — gjennom samme beviskrav før den brukes til noe.

**Opprinnelig målt mot:** `feat/kontekstvalg-hjem` @ `19bea32`, avledet av tag `v1.0.18` (`9a72e9b`) — bygget som ligger i TestFlight.

**Sentrale påstander re-sjekket mot:** `4c68a72` 2026-08-09; se `SOL-SVAR-TILBAKE.md`.
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
| `LATENT_HIGH_RISK` | Reell høyrisikofeil i en kodegren som dagens produksjons-UI ikke kan nå; må lukkes før grenen aktiveres |
| `OUT_OF_SCOPE_HIGH_RISK` | Reelt høyrisikofunn som krever en separat autorisert oppgave og egen verifikasjon |

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
| A-5 | 8 kliniske funn eskalert til KRITISK | `OPEN` | Se seksjon D. `docs/DECISION-LOG.md:221-227` aksepterer usignerte legacy-grenser generelt, men navngir ikke de åtte konkrete funnene individuelt |
| A-6 | 12 tekstfikser i `garment-info.ts`, ikke committet | `ikke verifisert` | Ikke undersøkt i denne runden |
| A-7 | Stadium A bommet på 3 «manglende PNG»-funn | `OBSOLETE` | Gjaldt PNG-æraen; alle 72 webp finnes i dag |

**Vurdering:** to av sju påstander er beviselig feil eller foreldet på en måte som ville ført arbeid galt av sted. Filen har fortsatt verdi som audit-bevis — `scorecard.csv` med 60 rader og 60 JSON-filer er reelle data — men den kan ikke brukes som implementeringsbrief.

---

## B — Motorrevisjonen 2026-08-09

Gjelder `src/lib/wool-layers/`. `src/lib/clothing-engine-v2/` er nå revidert i egen lesning — se B-12 og B-16 til B-18.

| # | Funn | Status | Bevis |
|---|---|---|---|
| B-1 | Utetemperatur mates inn i romtemperatur-TOG-tabell | `LATENT_HIGH_RISK` | `recommend.ts:59-61` slår opp `soevn`-tabellen med utendørs `weather.feelsLikeC`; `tables.ts:149-163` definerer tabellen som innendørs. Målt: vogn+sovende beholder 1.0 TOG til og med 27 °C. Produksjons-UI holder Hjem/Planlegg på `awake`, og Finn antrekk sender ikke vognmodus; grenen er derfor ikke nåbar nå |
| B-2 | Direkte `bandForTemp(NaN)` gir kaldeste bånd | `OPEN` som API-hardening; bruker-konsekvensen er `REFUTED` | Direkte kall gir `NaN → ekstrem`, men produksjonsinngangen `recommend()` avviser ikke-finitt `feelsLikeC` i `recommend.ts:193-195` før oppslaget. Det er ikke bevist at appen viser vinterantrekk ved manglende værdata |
| B-3 | `src/lib/research/` importeres av null kjørende linjer | `OPEN` | Søkt: kun to prosakommentarer, `modifiers.ts:481` og `:495` |
| B-4 | Ingen av de 14 kilde-ID-ene reglene siterer finnes i `sources.ts` | `OPEN` | Talt: 0 treff. Union i `safety.ts:26-29`, register i `sources.ts:24-102` |
| B-5 | 19 av 24 regler i HB/CK/SB er døde eller uten effekt | `OPEN` | Per-regel fil:linje i motorrevisjonen |
| B-6 | SIDS/kvelning har ingen håndhevende kode | `OPEN` | HB-1, HB-2, HB-5, HB-10, CK-4 alle døde; kun noter igjen |
| B-7 | App motsier seg selv ved 21 °C | `OPEN` | `conflicts.ts:51` kapper fra 21 → 1.0 TOG; `TogGuideScreen.tsx:118` viser 2.5 |
| B-8 | Vogn 22–27,9 °C utløser alltid CRITICAL fra eget tabellvalg | `OPEN` | `tables.ts:29` legger `tynt teppe`; `safety.ts:234` fjerner alt teppe ≥22 |
| B-9 | `tog-table.ts:6` erklærer seg kryss-validert, er det ikke | `OPEN` | 20 °C: 1.5 mot motorens 2.5. 16 °C: 3.5 mot 2.5. 25 °C: 0.5 mot 1.0 |
| B-10 | Vinden telles to ganger under 10 °C | `OPEN` | Inn i `feelsLikeC` via wind chill, deretter lest av `modifiers.ts:184,196,204,253,380` |
| B-11 | Seks modifiers døde fordi appen aldri sender feltene | `OPEN` | `humidity`, `uvIndex`, `innerJakke`, `context.bilstol`, `exposureMin`, `vognMode` |
| B-12 | To motorer med ulik alderskontrakt — **mekanismen var feil** | `REFUTED` | v2 er aldri skrudd på: alle flagg `false` (`feature-flags.ts:22-26`), `selectEngine` returnerer alltid legacy. `AgeAdaptiveSituationPicker` er aldri montert. 30 mnd krasjer derfor ikke i dag |
| B-16 | `EngineV2Error` fanges ingen steder, og appen har ingen error boundary | `OPEN` | Kastestien er utilgjengelig fordi komponenten ikke er montert — wires den på denne grenen, blir 25+ en ufanget throw under render |
| B-17 | ~58 % av plaggene mangler materiallinje | `OPEN` | Legacy gir 69 distinkte strenger; v2s katalog kjenner 29 |
| B-18 | De to sikkerhetsregelsettene gir motstridende råd | `OPEN` | Målt ved 30 °C / 20 mnd: legacy ingen flagg, v2 `HB-V2-EXTREME-HEAT/HIGH` |
| B-13 | Bæresele mangler fotdekning under 5 °C | `REFUTED` | Fotplagg finnes nøyaktig når det ikke er heldress; fra `kald` overtar kjøredressen |
| B-14 | HB-2 lar teppet ligge i vogn | `REFUTED` | CK-1 (`conflicts.ts:86`) fjerner alt teppe uten aktivitetsvakt og kjører før safety |
| B-15 | `vognMode` hardkodes på HjemScreen.tsx:438 | `REFUTED` | :438 er kommentarstart; hardkodingen står på `:456` |

---

## C — Påstander fra Sol 5.6

| # | Påstand | Status | Bevis |
|---|---|---|---|
| C-1 | Handoffen kan ikke brukes som implementeringsbrief | `OPEN` — bekreftet | Sammenfaller med A-1 til A-3 |
| C-2 | 72 mappede webp i dagens katalog | **Bekreftet** | Målt 72 på v1.0.18. Min egen tidligere telling på 63 var fra `main` og var feil gren |
| C-3 | Produktet er for 0–24 måneder | **Delvis** | Produktgrensen er låst i `AGENTS.md:14` og `docs/DECISION-LOG.md:313`. `clothing-engine-v2` håndhever den (`age.ts:12`), mens produksjonsmotoren `wool-layers` tillater 0–60 (`recommend.ts:205-208`) og onboarding fem år (`OnboardingScreen.tsx:283-286`) |
| C-4 | Impeccable-detektor: 0 regelbrudd på `src/components/hjem` | `OPEN` som funn om porten | På samme flate er målt: innhold krysser tab-baren, ingen mørk modus, 21 slides for 6 plagg. En port som melder grønt der måler feil ting |
| C-5 | 12/40 på Nielsen for handoffen | `REFUTED` som metode | Nielsens heuristikker scorer grensesnitt, ikke dokumenter. FAIL-dommen står; tallet bør strykes |
| C-6 | Sols P0-liste | **Korrigert** | B-1 manglet, men produksjons-UI når ikke `vognMode='sleeping'`. Fører derfor `LATENT_HIGH_RISK` nå og P0-port før aktivering, ikke aktivt produksjons-P0 |
| C-7 | Autoritetsrekkefølgen i masterprompten | **Adoptert og korrigert** | Følger nå repositoryets faktiske presedens fra `AGENTS.md` og plasserer kjørende kode over audit-prosa — nøyaktig feilmekanismen bak A-1 og B-13/B-14 |

---

## D — Kliniske blokkeringer

De åtte fra handoffen. Ingen er faglig avklart; `HELSESOSTER-KRITISK.md` bekrefter at sporet aldri ble startet.

| Plagg | Type | Status |
|---|---|---|
| `regntrekk` | Omgår varmefelle-regel | `OPEN` |
| `sauekinn-i-vogn` | Ingen aldersgate, mykt underlag | `OPEN` |
| `sovepose-2-5-tog` | Under-isolering | `OPEN` |
| `sovepose-1-0-tog` | Tekst på sikkerhetsfelt | `OPEN` |
| `tynt-teppe` | Tekst på sikkerhetsfelt | `OPEN` |
| `pyjamas` | Tekst på sikkerhetsfelt | `OPEN` |
| `tynn-pyjamas` | Tekst på sikkerhetsfelt | `OPEN` |
| `to-ullsett` | Tekst på sikkerhetsfelt | `OPEN` |

### Rekkevidden av eierbeslutningen

Helsesøster-porten er **trukket**. Eier har bekreftet beslutningen fra 2026-07-15: produktet lanseres på dagens containede motor uten ekstern fagsignatur, og ansvaret bæres av disclaimeren.

Følgen for de åtte over er smalere enn først skrevet: de er ikke `BLOCKED_CLINICAL` i betydningen «venter på en obligatorisk v1-signatur», men de er heller ikke individuelt lukket av eierbeslutningen. De forblir åpne safety-funn. Beslutningsloggen aksepterer den generelle risikoen ved usignerte legacy-grenser; den er ikke et blanket unntak for konkrete regex-, copy- eller rutingfeil funnet senere.

Linja i `tables.ts:5-7` som sa «MÅ valideres av helsesøster før produksjons-lansering» er fjernet. Den overlevde beslutningen i juli og gjorde koden til en påstand om egen kvalitet som ikke var dekket.

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
| `OPEN` | 17 |
| `LATENT_HIGH_RISK` | 1 (B-1) |
| `REFUTED` | 6 |
| `OBSOLETE` | 3 |
| Bekreftet eller delvis | 4 |
| `ikke verifisert` | 1 |
| Åpne safety-plagg i A-5 | 8 plagg, se D |

32 rader fra tre kilder. **Seks påstander falt ved etterprøving** — én fra handoffen, fire fra min egen runde, én fra Sols metode. To av mine falt fordi noen målte etter meg: C-2 (jeg talte 63 plagg på feil gren, riktig er 72) og B-12 (jeg beskrev to levende motorer; v2 er aldri skrudd på).

Det er poenget med dokumentet. Ingen av de seks ville blitt fanget av at flere kilder var enige.
