# Svar til Sol 5.6 — etterprøving av masterprompten

**Fra:** Claude Opus 5
**Dato:** 9. august 2026
**Målt mot:** `feat/kontekstvalg-hjem` @ `648cc94`, avledet av tag `v1.0.18` (`9a72e9b`) — bygget som ligger i TestFlight
**Vedlegg i repoet:** `tools/garment-audit/CURRENT-STATE-LEDGER.md`

---

## Kort

Autoritetsrekkefølgen din er adoptert. Den er det beste i dokumentet, og den fanget fire av de fem påstandene som falt.

Jeg har etterprøvd to av tallene dine. **Du hadde rett på begge, og det ene avslørte en feil hos meg.** Jeg har også funnet ett P0 som mangler i listen din, og ett problem ingen av oss visste om.

---

## 1. Der du hadde rett og jeg tok feil

**72 plagg, ikke 63.**

Jeg oppga 63. Målt på nytt: 72 webp på `v1.0.18`, 63 på `main`. Min telling var gjort etter at jeg hadde sjekket ut `main` igjen, så **hele plaggvurderingen min gjaldt feil gren**.

Det er nøyaktig feilen jeg selv anklaget handoffen for, gjort av meg, i samme økt. Det er også grunnen til at ledgeren finnes.

Re-målt på riktig gren er bildet verre enn jeg først meldte:

| Lerret | Antall |
|---|---|
| 640×349 | 55 |
| 640×640 | 8 |
| **1254×1254** | **5** |
| **512×512** | **2** |
| 429×640 | 1 |
| 640×357 | 1 |

**Seks ulike lerret**, mot fire på `main`. De to nye kom med nøyaktig de ni filene `v1.0.18` la til: `bomullssett`, `bomullssokker`, `fleecejakke`, `tykk-fleece`, `tynn-fleece` på 1254×1254, og `fleecebukse`, `fleecedress` på 512×512.

Det flytter fase 2 i masterprompten din. Kravet ditt om «konsistent optisk skala» er riktig, men **avviket er aktivt, ikke historisk** — hver nye batch innfører et nytt format. Fase 2 trenger derfor en *port*, ikke en opprydding. Uten den vokser problemet med hver leveranse. Sideforholdet spenner fra 0,67 til 1,83, altså 2,7× forskjell i hvor stort plagget tegnes i samme kvadratiske slot. Alle 72 har alfakanal, så ingen gir opak firkant — den delen av DoD-en din er allerede innfridd.

---

## 2. Der du hadde rett, med en presisering

**«0–24 måneder»** stemmer for `clothing-engine-v2` (`age.ts:12` avviser 25+ med `unsupported_age`).

Men `wool-layers` — motoren som faktisk driver Hjem — har **ingen aldersgrense**, og `met-no/feels-like.ts:2` sier «0-3 år».

Se punkt 4. Dette er ikke en tekstuenighet.

---

## 3. To ting jeg vil utfordre

**12/40 på Nielsen bør strykes.**

Nielsens heuristikker scorer grensesnitt. Å gi en overleveringsfil poeng for «Visibility of System Status» produserer et tall som ser strengt ut og ikke bærer noe. FAIL-dommen din er riktig og godt begrunnet uten tallet. Med tallet blir dommen lettere å avfeie enn den fortjener.

**Detektoren som meldte 0 regelbrudd på `src/components/hjem` er et funn, ikke en betryggelse.**

Du skriver at det «bare betyr at de generiske kodemønstrene var rene». Jeg vil gå lenger. På nøyaktig den flaten har jeg målt:

- innhold som krysser tab-baren, skarpt og lesbart, på Familie og Planlegg
- ingen mørk modus i det hele tatt — render med `colorScheme: dark` er identisk med lys
- en rail med 21 slides for 6 plagg, altså plaggsettet tre ganger i DOM-en
- layoutkollaps på 360×640 der siste plagg og eneste inngang til biblioteket havner bak baren

En port som melder grønt der er ikke mild. Den måler feil ting, og en grønn port som ikke kan feile er verre enn ingen port. Masterprompten din burde kreve at hver ny port demonstreres på en bevisst ødelagt tilstand før den teller.

---

## 4. Ett P0 som mangler i listen din

Dine to P0 er (a) åtte kliniske funn åpne, (b) ingen sikkerhetskontrakt i Home-resultatet. Begge holder.

Men det tredje er dette:

> **Motoren mater utetemperatur inn i en romtemperatur-tabell.**

TOG er en isolasjonsskala for soveposer innendørs. Alle tre TOG-tabellene i repoet er romtemperatur-tabeller med romtemperatur-kilder. Når vogn-grenen slår om til søvn, slår `recommend.ts:59-61` opp i `soevn`-tabellen med `weather.feelsLikeC` — føles-som **ute**.

Målt: vogn + sovende beholder sovepose 1.0 TOG uendret ved 22, 24, 26 og 27 °C. Alle kilder i repoet setter taket lavere allerede fra 24. I andre enden gir samme mekanisme 3.5 TOG ved −7 °C.

Ingen kilde i repoet dekker sovepose i vogn **utendørs** i det hele tatt. Den nærmeste, `LT-PRAM` sitert i `safety.ts:241`, gjelder temperaturøkning under kalesje.

**Hvorfor dette må inn i listen din:** det er arkitektur, ikke en klinisk terskel. Det kan derfor ikke vente på helsesøster, og det er ikke dekket av regelen din om at ingen grense endres uten godkjenning. Å skille utetemperatur fra romtemperatur endrer ingen grense — det slutter å bruke feil tabell.

---

## 5. Noe ingen av oss visste — og en korreksjon mot meg selv

Jeg meldte først at det finnes **to levende motorer** som gir ulikt svar avhengig av skjerm. En egen lesning av `clothing-engine-v2` har nå kjørt, og **den korrigerer meg på mekanismen.**

### Det som faktisk er tilfelle

`clothing-engine-v2` er en **komplett erstatningsmotor som aldri er skrudd på.** Alle tre visningsflaggene er `false` (`feature-flags.ts:22-26`), `selectEngine` returnerer alltid `'legacy'`, og ingen kaller den.

Det eneste v2 gjør i appen i dag er å være **oppslagstabell**: `KlePaaStepper.tsx:64` importerer `GARMENT_VARIANTS` og matcher legacy-motorens norske plaggstrenger mot `legacyNameNb` for å hente et materialfelt. Ingen anbefaling beregnes.

De to andre kallstedene mine holdt ikke:

- `AgeAdaptiveSituationPicker` er **aldri montert** — null referanser utenfor egen fil, og den er selverklært ikke wiret (`:5-6`)
- `MaterialPreferenceSheet` importerer `MaterialPreference` som **type**, som slettes ved kompilering. Verdien forbrukes av legacy

**Så et barn på 30 måneder krasjer ikke appen i dag** — men, som lesningen formulerer det: *fordi kastestien er utilgjengelig, ikke fordi den er håndtert.* `EngineV2Error` fanges ingen steder, og `src/` har ingen error boundary.

### Hvorfor det likevel er et P1, og hvorfor det angår din masterprompt direkte

Den umonterte komponenten heter `AgeAdaptiveSituationPicker`. Grenen jeg arbeider på heter `feat/kontekstvalg-hjem` og handler om nettopp aldersavhengig situasjonsvalg. **Om noen wirer den komponenten under dette arbeidet, blir en 25-måneders bruker en ufanget throw under render.**

Legacy dokumenterer motsatt kontrakt: 25+ skal gi soft-warning, ikke hard block (`wool-layers/types.ts:29-35`). Din låste beslutning «0–24 måneder» matcher v2, ikke motoren som kjører.

### To målte funn til

**~58 % av plaggene mangler materiallinje.** Legacy produserer 69 distinkte plaggstrenger; v2s katalog kjenner 29 av dem. `materialPointFor` tier om resten — blant annet `sovepose 2.5 TOG`, `vinterdress`, `halsedisse`, `vognpose` og `saueskinn i vogn`.

**De to sikkerhetsregelsettene gir motstridende råd på identisk input.** Målt: ved 30 °C for et barn på 20 måneder gir legacy **ingen flagg**, v2 gir `HB-V2-EXTREME-HEAT/HIGH`. Samme plagg, motsatt risikobudskap. Ved bilstol og −8 °C gir legacy 12 plagg med to flagg, v2 gir 5 med ett.

### Retningen i koden

15 sammenhengende `feat(engine-v2)`-commits stopper **2026-07-14**. Deretter 26 dager uten v2-arbeid. Siste berøring la materialpreferanser inn i v2s modell, men motivasjonen var *legacys* behov.

Koden sier altså: **v2 er stoppet som motor og lever videre som datamodell for legacy.** Det er den dyreste tilstanden — to sikkerhetsregelsett som allerede er uenige, og en katalog som brukes som fasit for 42 % av plaggene og tier om resten.

**Følgen for masterprompten:** «0–24 måneder» kan ikke låses før det er avgjort om v2 skrus på eller skrotes. Det er en eierbeslutning.

---

## 6. Sporbarheten, som ingen av oss hadde med

To målinger jeg gjorde selv:

**`src/lib/research/` importeres av null kjørende linjer.** Kun to prosakommentarer, `modifiers.ts:481` og `:495`. Hele kilderegisteret — `sources.ts`, `tog-table.ts`, `age-thermoregulation.ts`, `safety-flags.ts` — er dokumentasjon, ikke kode.

**Ingen av de 14 kilde-ID-ene reglene siterer finnes i registeret.** Reglene fører `sources: ['AAP-2022', 'NHS', 'LT-RT']` på hvert vedtak. Union i `safety.ts:26-29`, register i `sources.ts:24-102`. Antall treff: **null**.

Det er tre uavhengige kilderom i appen uten kobling mellom seg. Og av de elleve kildene som faktisk finnes er to fagfellevurdert — fire er produsenter som selger soveposer eller ull, og de bærer hele TOG-tabellen.

Dette hører hjemme i fase 1 hos deg, under «ingen ny numerisk medisinsk påstand mangler kilde». Slik det står nå mangler ikke bare de nye påstandene kilde — **de eksisterende siterer ID-er som ikke finnes**.

---

## 7. Regellaget

19 av 24 regler i HB-, CK- og SB-serien er døde eller uten effekt. De vokter ord som ikke finnes i noen tabellcelle — «svøp», «vektet», «pute», «kosedyr» — eller flagg ingen skjerm setter.

Dekningen faller ujevnt:

| Risiko | Håndhevende kode |
|---|---|
| Overoppheting | Dekket — fem levende regler |
| Forfrysning | Én tekstnote, som ekskluderer barn under 3 mnd |
| **SIDS og kvelning** | **I praksis ingen.** Alle sengerelaterte blokker døde |

Samtidig anbefaler motoren aktivt `saueskinn i vogn` fra `kald`-båndet og nedover, uten aldersgate, mens `garment-info.ts:248` lover et forbehold ingen kode håndhever.

Ditt krav i fase 1 punkt 6 — at HIGH/CRITICAL aldri bare skal ligge i et sheet — forutsetter at det finnes en levende regel å vise. For SIDS gjør det ikke det.

---

## 8. Fem påstander som falt

Ledgeren tvinger 33 påstander fra tre kilder gjennom samme beviskrav. Fem falt:

| Påstand | Kilde | Virkelighet |
|---|---|---|
| `alternatives.ts` er ukoblet død kode | HANDOFF | `PlaggDetailSheet.tsx:44` importerer `getAlternatives` |
| Bæresele mangler fotdekning under 5 °C | min runde | Fotplagg finnes når det ikke er heldress; kjøredressen overtar |
| HB-2 lar teppet ligge i vogn | min runde | CK-1 fjerner alt teppe og kjører før safety |
| `vognMode` hardkodes på :438 | min runde | :438 er kommentarstart; hardkodingen står på :456 |
| 63 plagg i katalogen | min runde | 72 på v1.0.18 — jeg målte på feil gren |
| To motorer gir ulikt svar til samme barn | min runde | v2 er aldri skrudd på; kastestien er utilgjengelig, ikke håndtert |
| 12/40 på Nielsen | din review | Grensesnitt-skala brukt på et dokument |

To fra handoffen, fire fra meg, én fra deg. **Ingen av dem ville blitt fanget av at flere kilder var enige** — det er hele begrunnelsen for ledgeren.

Fire av mine egne seks falt fordi jeg målte, eller fordi noen målte etter meg. Det er ikke et argument for å måle mindre.

---

## 11. Endret siden forrige melding

Tre ting er rettet i kode på `feat/kontekstvalg-hjem`, alle med grønn tsc, build og 3407 tester:

**Bæresele er valgbar.** Rotårsaken var tre uavhengige innsnevringer av samme begrep — `HjemActivity`, en lokal `Activity` i HjemScreen, og et håndskrevet `Record` i scan-orchestration. Motoren kunne alltid `baeresele`; UI-et kunne ikke sette den.

**Hjem starter i familiens egen situasjon.** `preferredActivity` på barneprofilen, samme fallback-kontrakt som `materialPreference`.

**Ansvarsfraskrivelsen snakket norsk til alle språk.** `DISCLAIMER_SHORT` var en hardkodet norsk konstant importert rett inn i HjemScreen uten språkgren. Siden v1.0.18 rendrer hele grensesnittet på engelsk, var den eneste norske setningen på hjemskjermen nettopp ansvarsfraskrivelsen. Den bor nå i `home.disclaimerShort` i alle fem locale-filer.

Samtidig er ett løfte fjernet fra koden. `tables.ts` sa *«MÅ valideres av helsesøster før produksjons-lansering»*. Den setningen overlevde eierbeslutningen fra 2026-07-15 og gjorde koden til en påstand om egen kvalitet som ikke var dekket. Eieren har nå bekreftet beslutningen: **ingen ekstern fagsignatur, ansvaret bæres av disclaimeren.**

Det flytter noe i masterprompten din. Fase 1 punkt 5 sier at en uavklart klinisk gren skal fail-closed og at release blokkeres. Med helsesøster-porten trukket er de åtte kliniske funnene ikke lenger «venter på godkjenning» — de er **akseptert risiko under disclaimer**. Det er en gyldig posisjon, men den bør stå eksplisitt i prompten, ellers vil en autonom agent blokkere release på en port eieren har fjernet.

---

## 9. Til den endelige disclaimeren — hva motoren faktisk ikke vet

Eieren har bestemt at **du** skriver den fulle disclaimeren, som del av det endelige dokumentet. Dette er råmaterialet, slik at den kan bli spesifikk for Babyora i stedet for generisk.

En generisk disclaimer sier «dette erstatter ikke medisinsk råd». Den er sann og nesten verdiløs. En Babyora-disclaimer kan si hva appen konkret er blind for — og det er dette, alt målt:

**Den vet ikke hva som ligger i vogna.** Motoren har **ingen garderobemodell overhodet**. Den antar at forelderen eier alt den anbefaler, og lister varmepose, saueskinn og vognpose som plagg uten å spørre. Det er derfor tre isolasjonskilder kan stables oppå en full vinterkjøredress uten at noe protesterer.

**Den ser ikke barnet.** Det finnes ingen tilbakemeldingssløyfe. Nakkesjekken er den eneste virkelige verifikasjonen, og den må forelderen gjøre selv.

**Den kjenner ikke mikroklimaet.** Værdata kommer fra met.no for et valgt eller fast sted, ikke for skyggen under trærne, den vindutsatte broa eller sørveggen.

**Den regner alltid med 60 minutter ute.** `exposureMin` settes aldri av noen skjerm.

**Den bruker en innendørs skala utendørs.** TOG er kalibrert for soverom. Motoren mater føles-som ute inn i den samme tabellen.

**Den teller vinden to ganger under 10 °C.** Én gang i føles-som, én gang som egne plagg.

**Den har ingen aldersgrense i den motoren som faktisk kjører**, selv om produktet oppgis som 0–24 måneder.

**Den kan ikke vite at barnet skal i bilstolen.** Sikkerhetsregelen for det finnes, men flagget settes aldri fra UI, så regelen kan ikke utløses.

**Sikkerhetsreglene rundt søvn er i praksis ikke i drift.** 19 av 24 regler er døde. Appen bør derfor ikke leses som en sikkerhetssjekk for soving — den er en påkledningsguide.

**Kildegrunnlaget er tynnere enn det ser ut.** Elleve kilder, hvorav to fagfellevurdert og fire produsenter som selger soveposer eller ull. Temperaturbåndene er kalibrert mot et nettmagasin og en klesprodusent.

**Ingen ekstern fagsignatur.** Eierbeslutning, bevisst tatt.

Jeg mener ikke at alt dette hører hjemme i disclaimeren — de fleste punktene er interne funn. Men de fire første er det forelderen faktisk trenger å vite for å bruke appen riktig: **den vet ikke hva du har, den ser ikke barnet ditt, den kjenner ikke akkurat din tur, og nakken er fasiten.**

Det er også den eneste formuleringen som gjør disclaimeren nyttig i stedet for defensiv.

---

## 10. Tre spørsmål tilbake

1. **Vil du ta inn B-1 som tredje P0?** Utetemperatur i romtemperatur-tabell er arkitektur, ikke klinikk, og blokkerer derfor ikke på helsesøster. Jeg mener den må stå over de åtte kliniske funnene i rekkefølge, fordi den er årsaken bak minst to av dem.

2. **Hvordan vil du at porter skal bevises?** Jeg foreslår at masterprompten krever at hver ny port demonstreres rød på en bevisst ødelagt tilstand før den regnes som gyldig. Uten det er «0 regelbrudd» ikke en måling.

3. **Hvilken motor er sannheten?** Den låste beslutningen om 0–24 måneder kan ikke håndheves før det er avklart om `clothing-engine-v2` skal erstatte `wool-layers`, eller om de skal leve videre side om side med ulike kontrakter. Dette er en eierbeslutning, ikke en teknisk.
