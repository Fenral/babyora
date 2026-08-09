# Sols svar på etterprøvingen

**Dato:** 9. august 2026

**Etterprøvd mot:** `feat/kontekstvalg-hjem` @ `4c68a72`

**Svar på:** `tools/garment-audit/SVAR-TIL-SOL.md`

## Beslutning

Tre avklaringer er nå låst for videre arbeid:

1. **B-1 er en latent P1 og en obligatorisk P0-port før vognsøvn kan aktiveres.** Når `vognMode === 'sleeping'`, velger `recommend.ts:59-61` `baseTable.soevn` med `weather.feelsLikeC` fra uteturen. `tables.ts:149-163` definerer den tabellen uttrykkelig som innendørs romtemperatur. Dagens UI når ikke denne grenen: Hjem og Planlegg bruker `awake`, og Finn antrekk sender ikke `vognMode`. Feilen er derfor ikke et tredje aktivt produksjons-P0 på denne HEAD-en. Den skal behandles i et separat høyrisikospår før funksjonen kan eksponeres, uten å gjette nye TOG- eller utetemperaturgrenser.

2. **En ny port teller først når den har en negativ kontroll.** Hver produktspesifikk port skal bevise både `PASS` på gyldig fixture og `FAIL` på én isolert, kjent ugyldig fixture eller midlertidig mutasjon. Den negative kontrollen skal ikke endre produksjonskoden, og den skal kjøres av samme CI-kommando som den positive. En generell detektor uten en kjent feiltilstand er et diagnostisk signal, ikke en release-port.

3. **`wool-layers` er eneste produksjonssannhet nå.** Dette er allerede en eierbeslutning i `docs/DECISION-LOG.md:221-227`: v1 lanseres på den containede legacy-motoren. Alle Motor V2-flagg er av i `feature-flags.ts:22-26`; V2 kan ikke aktiveres uten sin eksisterende faglige gate. `clothing-engine-v2` er derfor ikke en alternativ runtime-sannhet, men en inaktiv kandidat og en datakilde enkelte visningslag låner typer/katalogdata fra.

## Konsekvens for den pågående designjobben

Designarbeidet på Home fortsetter uavhengig. Det skal ikke endre `src/lib/wool-layers`, aktivere Motor V2, omskrive temperaturgrenser eller påstå at B-1 er løst. B-1 blokkerer aktivering av vognsøvn; den blokkerer ikke visuell verifikasjon av avatar, rail, typografi, disclosure eller tilgjengelighet.

Den eksisterende eierbeslutningen om å lansere den containede legacy-motoren med disclaimer gjelder usignerte legacy-grenser generelt. Beslutningsloggen sier ikke at hvert av de åtte konkrete auditfunnene er individuelt akseptert eller lukket. De beholdes derfor som åpne safety-funn i et separat høyrisikospår. Disclaimeren lukker heller ikke B-1; dagens mitigasjon er at vognsøvn ikke er tilgjengelig i produksjons-UI.

## To nødvendige korreksjoner i `SVAR-TIL-SOL.md`

### `bandForTemp(NaN)` er ikke dagens brukerflyt

Direkte kall til `bandForTemp(NaN)` faller riktig nok gjennom til `ekstrem`. Men den offentlige produksjonsinngangen `recommend()` kjører `validateInput()` først og avviser ikke-finitt `weather.feelsLikeC` i `recommend.ts:193-195`. Påstanden om at manglende værdata dermed gir et maksimalt vinterantrekk i appen er ikke bevist.

Riktig status er:

- **OPEN / API-hardening:** `bandForTemp` er ikke total for ikke-finite tall og kan misbrukes av nye direkte kall.
- **REFUTED som aktiv brukerfeil:** dagens `recommend()` avviser verdien før tabelloppslaget.

### 0–24 måneder er produktgrense, ikke motorgrense

`AGENTS.md:14`, `PRODUCT.md:5` og `docs/DECISION-LOG.md:313` låser v1 til 0–24 måneder. Samtidig tillater legacy-motoren 0–60 måneder (`recommend.ts:205-208`), og onboardingens datovelger tillater fem år (`OnboardingScreen.tsx:283-286`). Dermed er produktgrensen ikke konsekvent håndhevet i dag.

Dette skal ikke løses ved å skru på Motor V2. Riktig separate oppgave er å håndheve 0–24 ved profil-/onboardinggrensen, definere migrering/feilflate for eksisterende eldre profiler og beholde legacy-motorens defensive kompatibilitet til den oppgaven er ferdig.

## Motoravgjørelse

Det er ikke nødvendig med en ny eierbeslutning for å vite hvilken motor som gjelder **nå**: det er `wool-layers`.

Det kreves derimot en senere eierbeslutning om Motor V2s livsløp. Anbefalingen er:

- Ikke wire eller aktivere V2 i den nåværende designpakken.
- Ikke la V2-katalogen være en stille, ufullstendig fasit for legacy-presentasjon.
- Lag et eget beslutningsgrunnlag med tre alternativer: fullføre og validere V2, arkivere V2 som motor og flytte delt katalog til nøytral modul, eller finansiere en eksplisitt overgang med shadow-måling.
- Ingen side-om-side-produksjon med to regelsett som kan gi ulik severity på samme input.

## Endelig disclaimer-utkast

Kortformen ved anbefalingen kan beholdes:

> Veiledende råd — følg med på barnet og bruk eget skjønn.

Den fulle teksten bør være konkret om Babyoras faktiske blindsoner:

> Babyora gir veiledende forslag basert på værdata for stedet du har valgt. Appen vet ikke hva som allerede ligger i vognen, mikroklimaet akkurat der barnet er, eller hvordan barnet reagerer. Tilpass lagene underveis og kjenn jevnlig i nakken: varm og tørr betyr passe, klam eller svett betyr for varmt, og kald betyr at barnet trenger mer. Anbefalingene erstatter ikke ditt eget skjønn eller råd fra helsepersonell.

Dette er et **copy-utkast, ikke en motorfiks**. Før produksjonsendring skal samme mening lokaliseres eksplisitt til alle støttede språk og passere eksisterende copy-/i18n-tester. Disclaimeren skal ikke brukes som bevis på at B-1 er løst.

## Definition of Done for oppfølgingen

| Område | Ferdig når |
|---|---|
| B-1 | Vognsøvn forblir utilgjengelig frem til utendørs søvn ikke bruker en romtemperaturtabell uten eksplisitt kontrakt; relevante scenarier har RED→GREEN-test og uavhengig høyrisikoreview. |
| Porter | Hver ny produktspesifikk gate har positiv og negativ fixture i samme CI-kommando. |
| Runtime-sannhet | Ingen produksjonsskjerm kaller V2; lånet av V2-katalogdata er kartlagt og målt, ikke omtalt som motorbruk. |
| Aldersgrense | Ny profil kan ikke opprettes utenfor 0–24; eksisterende eldre profiler får definert, testet håndtering uten render-throw. |
| Disclaimer | Kort og full tekst er eksplisitt lokalisert, tilgjengelig i avtalte flater og beskriver blindsoner uten å skjule åpne safety-funn. |

## Hva som ikke er gjort i denne runden

- Ingen motor-, TOG-, sikkerhets- eller terskelkode er endret.
- Ingen Home-/designfiler er endret.
- Ingen commit, push, PR, deploy eller TestFlight-opplasting er gjort.
