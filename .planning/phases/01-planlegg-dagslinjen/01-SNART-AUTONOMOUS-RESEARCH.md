# Snart: autonomt beslutningsgrunnlag for plan 01-13–01-18

**Forskningsdato:** 2026-07-24
**Domene:** historisk klimagrunnlag, produktheuristikker, personverninvarianter og autonome kvalitetsporter
**Samlet konfidens:** MEDIUM — kilde- og repositoryfakta er kontrollert mot offisielle primærkilder og kodebasen; statistiske grenser og produktregler er eksplisitte Babyora-valg, ikke eksternt validerte faggrenser.

## Kort beslutning

Plan 01-13–01-18 kan kjøres uten eierporter dersom omfanget fryses slik:

1. Bruk METs 24 kompakte `seNorge_2018` månedsnormalfiler som eneste klimakilde: tolv `tg_normal_1991_2020_monthly_MM.nc` og tolv `rr_normal_1991_2020_monthly_MM.nc`. Kildefilene er offisielle månedsnormalprodukter; Babyoras 15-dagers skalering og plaggheuristikker er ikke MET-varsel eller MET-anbefaling. [VERIFIED: official THREDDS DDS/DAS/ASCII responses]
2. Kjør uthenting sekvensielt og resumérbart ved build-time via THREDDS OPeNDAP `.ascii` og eksisterende Node/TypeScript-verktøy. Ingen runtime-kall, ny pakke eller credential er nødvendig. [VERIFIED: official THREDDS endpoint probes; repository package.json]
3. Begrens v1 til den aktuelle hashede `NO_CITIES`-projeksjonen: 60 oppføringer og 60 unike `home-place-key@1` ved kontroll 2026-07-24. Antallet avledes, aldri hardkodes. Et annet eller ugyldig hjemsted gir `unavailable`; aldri velg «nærmeste» profil i stillhet. [VERIFIED: repository `src/data/no-cities.ts`]
4. Frys temperatur- og nedbørsgrensene som `babyora-snart-heuristics@2`. Merk dem i schema, manifest og copy som Babyora-produktheuristikker. Fjern sol-, helse-, sikkerhets- og størrelsesreglene fra Snart v1.
5. Utsett formell personverngjennomgang uten å lempe på tekniske grenser: session-only; ingen URL, lagring, logger, analyse, backend, barn-ID eller tidspunkthistorikk.
6. Erstatt alle godkjenningsporter med deterministiske validatorer og to distinkte, uavhengige read-only reviewer som root-orchestratoren innhenter på eksakt kandidat-SHA/tree/contract/pack. Eksisterende ikke-implementerende revieweragenter kan gjenbrukes. Identitetssignerte JSON-receipts er consistency-only, ikke kryptografisk proveniens.
7. Ved kilde-, dekning-, hash-, review- eller credentialproblem: behold capability av og returner `unavailable`. Ikke generer syntetiske profiler, ikke bruk Frost som skjult fallback, og ikke muter siste validerte pakke.

**Primær anbefaling:** La 01-13 fryse kontrakten og produsere/låse datapakken, la 01-14 bygge runtime-modellen, la 01-15 holde capability false, og la samme executor i 01-16 aktivere før final kandidatcommit slik at begge reviewer vurderer den faktiske aktiverte SHA-en.

## Prosjektbegrensninger fra AGENTS.md

- Den godkjente GSD-arbeidslisten kan planlegges, implementeres, testes, reviewes, dokumenteres, committes og pushes autonomt så lenge scope, sannhetskrav og tekniske porter holdes. [VERIFIED: repository `AGENTS.md`, 2026-07-24]
- Snart skal bare gi nøytral, historisk forberedelsesveiledning. Helse- og sikkerhetspåstander er utenfor scope; MET leverer data, mens terskler eies og versjoneres av Babyora. [VERIFIED: repository `AGENTS.md`]
- Formell personverngjennomgang er utsatt, men session-only/no-persistence/no-analytics-invariantene er obligatoriske og automatiske. [VERIFIED: repository `AGENTS.md`]
- Ingen enkeltutgift eller samlet ny kostnadsforpliktelse over NOK 1 000 kan pådras uten eksplisitt eiergodkjenning. Gratis offentlige kilder og allerede inkluderte abonnementskvoter kan brukes; ekstra kreditter kan ikke antas inkludert. [VERIFIED: repository `AGENTS.md`; `docs/DECISION-LOG.md` 2026-07-24]
- Hemmeligheter, lokale `.env`-filer, credentials og private nøkler skal ikke pushes. Fullføring kan ikke påstås uten kjørte og rapporterte kontroller. [VERIFIED: repository `AGENTS.md`]

Den anbefalte Snart-ruten har forventet ny direkte kostnad NOK 0: offisiell MET-data, eksisterende Node/TypeScript-verktøy og eksisterende CI brukes. Ingen autonom planoppgave får kjøpe kreditter, opprette betalt tjeneste eller anta at en betalt kvote finnes. Hvis en senere endring forventes å skape en ny samlet forpliktelse over NOK 1 000, er det en reell kostnadsport utenfor disse seks planene.

## Kildebeslutning

### Valgt grunnlag: MET seNorge_2018 månedsnormaler

MET publiserer ferdig aggregerte, griddede månedsnormaler for 1991–2020 på det samme 1 km UTM33-rutenettet. `tg`-filene oppgir `air_temperature`, enhet `Celsius`, `time: mean`, filversjon `1.0` og kildeversjon `v23_09`. `rr`-filene oppgir `precipitation_amount`, enhet `mm`, `time: sum`, filversjon `1.0` og kildeversjon `v23_11`. Begge har `time=1`, `Y=1550`, `X=1195`, `lat`, `lon`, `_FillValue=-999.99`, MET som institusjon og åpen lisens. [VERIFIED: official monthly-normal DDS/DAS responses]

Kildefilene er offisielle månedsnormalprodukter. Det Babyora lager oppå dem — skalering til D+28–D+42, plagggrupper og terskler — er et eget produktvalg og skal aldri omtales som MET-varsel eller MET-anbefaling.

### Eksakte offisielle endepunkter og format

| Formål | Endepunkt | Forventet format |
|---|---|---|
| Temperaturkatalog | `https://thredds.met.no/thredds/catalog/senorge/seNorge_2018/aggregated_products/tg/catalog.xml` | THREDDS XML |
| Nedbørkatalog | `https://thredds.met.no/thredds/catalog/senorge/seNorge_2018/aggregated_products/rr/catalog.xml` | THREDDS XML |
| Temperaturdatasett | `https://thredds.met.no/thredds/dodsC/senorge/seNorge_2018/aggregated_products/tg/seNorge2018_tg_normal_1991_2020_monthly_MM.nc` | OPeNDAP/DAP2 |
| Nedbørdatasett | `https://thredds.met.no/thredds/dodsC/senorge/seNorge_2018/aggregated_products/rr/seNorge2018_rr_normal_1991_2020_monthly_MM.nc` | OPeNDAP/DAP2 |
| Datasettskjema/metadata | samme datasett-URL med suffiks `.dds` / `.das` | DAP2 DDS/DAS |
| Avgrenset punktrespons | samme datasett-URL med suffiks `.ascii?{constraint}` | DAP2 ASCII |

[VERIFIED: official THREDDS catalog XML and successful DDS/DAS/ASCII probes]

En konkret punktspørring bygges deterministisk fra én av de eksakte 24 allowlistede URL-ene:

```text
https://thredds.met.no/thredds/dodsC/senorge/seNorge_2018/aggregated_products/tg/seNorge2018_tg_normal_1991_2020_monthly_01.nc.ascii?time[0:1:0],tg[0:1:0][Y:Y][X:X]
```

`Y` og `X` er heltallsindekser i rutenettet, ikke brukerkoordinater. Builderen finner og fryser dem ved å sammenligne hvert kanoniske sted mot datasettenes `lat[Y][X]` og `lon[Y][X]`; etter dette inngår sted, original lat/lon, valgt indeks, rutens lat/lon og avstand i manifestet. Valgt celle må ha gyldig `tg` og `rr` for alle tolv måneder. Denne algoritmen er Babyoras byggemetode, ikke en MET-anbefaling.

### Forkastet rute: rå daglige årsdata

Den første prototypen forsøkte årsfilene i `Archive/`. DDS/DAS og koordinatgrid fungerte, men en full års punktspørring med alle variabler traff den frosne 20-sekunders timeouten gjentatte ganger. Enkeltvariabler tok omtrent 16,8–19,4 sekunder; 31 dagers alle-variabler tok 6,4 sekunder, 91 dager 16,2 sekunder, mens 182 dager og helår feilet. Selv binær `.dods` returnerte bare 803 byte før timeout. Å partisjonere hele jobben ville krevd om lag 7 200 kall og mer enn 30 timer. Det ble forkastet av hensyn til METs delte tjeneste og høflig ressursbruk, ikke fordi dataene var faglig uegnede.

### Lisens og kreditering

MET oppgir NLOD eller CC BY 4.0 som standard for åpne data og krever kreditering. [CITED: https://www.met.no/frie-meteorologiske-data/lisensiering-og-kreditering] THREDDS/seNorge-metadata peker tilsvarende på åpen lisens og MET som institusjon. [VERIFIED: official THREDDS DAS metadata]

Pakken og appens kildevisning skal derfor inneholde:

- `sourceOrganization: "Meteorologisk institutt (MET Norway)"`
- eksakt datasettnavn, variabelversjoner og normalperiode;
- eksakte katalog-/dataset-URL-er;
- lisens-URI hentet fra faktisk metadata;
- teksten «Bearbeidet av Babyora»;
- en eksplisitt forklaring om at kildefilene er offisielle MET-månedsnormaler, mens Babyoras målperiodeberegning og plaggheuristikker ikke er MET-varsel eller MET-anbefaling.

Ikke hardkod en eldre lisensvariant fra et eksempel i Frost-dokumentasjonen. Manifestet skal bevare den lisens-URI-en som følger det faktisk brukte seNorge-datasettet.

## Frost: status og hvorfor det ikke er primærruten

Alle Frost-dataforespørsler krever en klient-ID; for åpne data kan klient-ID brukes som Basic-auth-brukernavn med tomt passord. [CITED: https://frost.met.no/authentication.html] Frosts dokumenterte observasjons- og klimanormalgrensesnitt er `v0`; API-referansen merker versjonen som testing, mens Frost v1 fortsatt beskrives som arbeid under utvikling. [CITED: https://frost.met.no/reference] [CITED: https://frost.met.no/changelog2.html] Dokumentasjonen gir ikke grunnlag for å kalle hele v0 «avviklet»; korrekt planformulering er at v0 er det nåværende dokumenterte grensesnittet for disse datasettene, mens v1 er under utvikling.

Frosts offisielle brukeroppgave for klimanormaler beskriver 1931–1960 og 1961–1990, ikke den ønskede 1991–2020-pakken. [CITED: https://frost.met.no/ex_userquest] Frost skal derfor ikke brukes til å gi denne fasen et falskt 1991–2020-grunnlag.

Frost dokumenterer `qualityCode`, blant annet kontrollerte, korrigerte, interpolerte, usikre og feilaktige observasjoner. [CITED: https://frost.met.no/dataclarifications.html] Disse kodene gjelder ikke den valgte seNorge-pakken. Hvis en senere fase innfører Frost, må aksepterte kvalitetskoder bli en ny, eksplisitt og versjonert policy; «alle ikke-feilaktige» er ikke en trygg standard.

### Relevante miljøvariabelnavn — aldri verdier

| Navn | Status for Snart |
|---|---|
| `VITE_METNO_USER_AGENT` | Finnes i `.env.example`, men er ikke nødvendig credential for den valgte build-time THREDDS-ruten. [VERIFIED: repository grep] |
| `VITE_FORECAST_PROXY` | Brukes av eksisterende korttidsvarsel/proxy og er utenfor Snart-klimatologien. [VERIFIED: repository grep] |
| `FROST_CLIENT_ID` | Skal **ikke** innføres for plan 01-13–01-18; nevnes bare som navn for en eventuell separat fremtidig Frost-integrasjon. |

Ingen credentialnavn eller credentialverdi skal inn i klimamanifest, datapakke, testfixture, logger eller AI-reviewrapport.

## Reproduserbar build-time-pipeline

### Ansvarsdeling

| Kapabilitet | Primær tier | Sekundær tier | Begrunnelse |
|---|---|---|---|
| Kildeuthenting og klimatologi | Build-time tooling | Offisiell MET-tjeneste | Ingen nettverksavhengighet i appen |
| Pakkevalidering og hash | Build-time tooling/CI | — | Må være deterministisk og fail-closed |
| Regelkjøring | Ren domenemodell | — | Samme input og versjon skal gi samme resultat |
| `Har allerede` | React session state | Ren domenemodell | Skal aldri persisteres eller sendes ut |
| Tilgang og presentasjon | UI/routing | Capability-register | Aktivert først etter låste porter |

### Foreslått pipeline

1. `preflight`: generer den eksakte 24-URL-allowlisten og hent DDS/DAS sekvensielt. Kontroller HTTPS-host, eksakt `urlPath`, mappe/variabel/måned, dimensjoner, periode, enheter, aggregation, `_FillValue`, source/institution, fil-/kildeversjon og lisens.
2. `resolve-grid`: hent `lat` og `lon` én gang, bruk den frosne nearest-cell/mm/Y/X-policyen for hver aktuell `NO_CITIES`-oppføring, og skriv en sortert sted→rute-tabell. Nærmeste invalid/havcelle, manglende måned eller >5 km gjør stedet unavailable; ingen stille nabo brukes.
3. `fetch-points`: hent én variabel for ett sted og én måned i hver `.ascii`-request. Maks én request er aktiv om gangen; bruk diskcache, tydelig identitet, begrenset retry med backoff og resume.
4. `normalize`: parse bare det eksplisitt validerte DAP2-ASCII-formatet; avvis ukjente felt, duplikate/manglende måneder, ikke-endelige tall og `_FillValue`.
5. `derive`: bygg eksakt tolv `{month, meanTemperatureC, monthlyPrecipitationMm}`-rader per støttet sted.
6. `serialize`: bruk sorterte nøkler, stabil tallavrunding og UTF-8/LF for byte-identisk JSON.
7. `validate`: kjør schema-, dekning-, plausibilitets-, lisens-, copy-, privacy- og hashkontroller.
8. `reproduce`: bygg to ganger fra tomme, separate arbeidskataloger. `packSha256` og `manifestSha256` må være identiske.
9. `review`: etter kandidatcommit innhenter root-orchestratoren to uavhengige read-only review på eksakt tuple og lagrer deres identitetssignerte JSON-receipts uendret.
10. `publish`: commit pakken først når alle porter er grønne. Runtime leser kun den committede pakken og gjør aldri klimakall.

Builderen bør implementeres med eksisterende `tsx`/TypeScript samt Node sine innebygde `fetch`- og `crypto`-API-er. Det unngår nye installasjoner; repositoryet har allerede `tsx`, TypeScript og Vitest. [VERIFIED: repository `package.json`]

### Datakontrakt: `babyora-monthly-normal-pack@2`

Dette er anbefalte, transparente produktvalg — ikke offisielle MET-definisjoner:

- Normalperiode: 1991–2020, dokumentert av de offisielle månedsnormalfilene.
- Hver profil inneholder måned 1–12 nøyaktig én gang.
- `meanTemperatureC` kommer direkte fra månedens `tg`-normal (`time: mean`, Celsius).
- `monthlyPrecipitationMm` kommer direkte fra månedens `rr`-normal (`time: sum`, mm).
- Tall lagres med eksplisitt, testet half-away-from-zero-avrunding; råverdier brukes før avrunding i senere signalberegning.
- Ett manglende, ukjent, ikke-endelig eller `_FillValue`-felt gjør hele stedsprofilen `unavailable`.

Disse valgene skal stå både i kontrakten og manifestet. Endres kildefamilie, månedssemantikk, målperiodevekting eller avrunding, kreves ny `derivationVersion`, ny datapakke og nye golden tests.

### Proveniensmanifest

Manifestet skal minst inneholde:

```text
schemaVersion
derivationVersion
rulesetVersion
normalPeriod
createdFromGitSha
sourceCatalogUrls[]
sourceDatasets[{url,family,variable,month,metadataSha256,responseSha256[]}]
sourceVariableVersions
sourceFileVersions
sourceUnits
sourceAggregations
sourceInstitution
sourceLicenseUri
placeGridBindings[]
monthCount
targetWindowDerivationVersion
roundingPolicy
packSha256
builderSha256
```

`generatedAt` kan finnes i en separat, ikke-hashet kjøresporfil, men skal ikke gjøre pakken ikke-reproduserbar. Kandidatidentiteten er Git-SHA + kontrakt-SHA + data-SHA, ikke et flytende tidspunkt.

## Fail-closed dekning og fallback

V1 støtter bare en eksakt, stabil `homePlaceKey` fra `NO_CITIES`; onboarding kan fortsatt lagre andre koordinater for øvrige appfunksjoner, men Snart svarer `unavailable` for dem. [VERIFIED: repository supports canonical cities and arbitrary onboarding locations] Dette er mer sannferdig enn å merke en fjern profil som lokal eller å bygge en nasjonal mobilpakke uten størrelsesbudsjett.

Følgende skal gi `unavailable`, ingen plaggresultat og fortsatt `soon_preparation=false` under bygging:

- én offisiell katalog/månedsnormalfil kan ikke hentes;
- endpointet begynner å kreve credential;
- host, dataset-ID, variabler, versjon, periode eller lisens avviker;
- sted→rute-binding mangler eller bryter avstandsgrensen;
- en av de tolv månedene eller én `tg`/`rr`-verdi mangler;
- parseren ser ukjent format, `_FillValue`, NaN eller duplikater;
- reproduserbarhets-hashene avviker;
- en deterministisk validator eller én AI-review returnerer FAIL;
- reviewrapportens Git-/kontrakt-/datahash avviker fra kandidaten.

Hvis en allerede committet pakke er fullstendig validert mot samme kontrakt, kan appen fortsette å bruke denne «last known good»-pakken. Byggejobben skal aldri overskrive den ved feil. Hvis ingen slik pakke finnes, forblir funksjonen utilgjengelig. Ingen syntetisk data, eldre 1961–1990-normal, live forecast, Frost-kall eller betalt datakilde brukes som fallback.

## Babyora-heuristikker og nøytral copy

### Frosset heuristikk v2

De eksisterende grensene kan kjøres autonomt når de navngis som produktvalg, ikke fagfakta:

| Signal | Babyora-grenser | Tillatte konsepter |
|---|---|---|
| `targetMeanTemperatureC` | `2`, `7`, `12`, `16` °C | innerlag, mellomlag, isolert ytterlag, hodeplagg, håndplagg |
| `targetPrecipitationMm` | `20`, `50` mm for målperioden | værbeskyttende ytterlag |

[VERIFIED: locked values in repository `01-SNART-RULES.md`] Grensene er **ikke** verifisert av MET, helsemyndighet eller medisinsk fagperson. De skal merkes `policyOwner: "Babyora"`, `evidenceType: "product_heuristic"` og `rulesetVersion: "babyora-snart-heuristics@2"`.

Målperiodesignaler beregnes av `babyora-target-window-monthly-weighting@1`: middeltemperaturen vektes etter antall måldatoer i hver måned, og månedsnedbøren skaleres med `monthlyPrecipitationMm / daysInMonth × targetDaysInMonth`. Februar bruker faktisk 28 eller 29 dager i målåret. Resultatet er historisk normalgrunnlag, aldri en prognose.

Fjern fra v1:

- `maxSolarElevationDeg`, `sun_hat`, `sun_covering` og all UV-/solcopy;
- `currentSizeLabel`, `sizeCheckedAtLocalDate`, `fitSignal` og alle vekst-/passformnoter;
- rationale om kulderisiko, våte plagg, kroppstemperatur, spedbarn, aktivitet, bilstol eller «trygt»;
- kildehenvisninger til Helsenorge, DSA og 1177 i Snart-regelregisteret.

Dette gjør ikke tersklene «faglig riktige»; det gjør eierskapet sant, testbart og innenfor det godkjente nøytrale planleggingsomfanget.

### Anbefalt ordlyd

| Element | Nøytral copy |
|---|---|
| Tittel | `Planlegg for {fraDato}–{tilDato}` |
| Undertekst | `Basert på månedlige normaler for 1991–2020, ikke et værvarsel.` |
| Gruppe 1 | `Sjekk først` |
| Gruppe 2 | `Kan være greit å ha tilgjengelig` |
| Gruppe 3 | `Ikke fremhevet for perioden` |
| Temperatur-rad | `Sjekk om dere har {kategori} tilgjengelig for perioden.` |
| Sekundær temperatur-rad | `{Kategori} kan være greit å finne fram dersom perioden blir kjøligere enn det historiske mønsteret.` |
| Nedbørs-rad | `Historisk nedbørsmengde er høyere for denne perioden. Sjekk om et værbeskyttende ytterlag er tilgjengelig.` |
| Global note | `Dette er en Babyora-planleggingsregel basert på historiske månedsnormaler. Sjekk dagens vær og egne behov nærmere datoen.` |
| Utilgjengelig | `Vi har ikke godt nok historisk grunnlag for dette stedet akkurat nå.` |

Forbudt copy-liste bør minst omfatte bøyninger og kombinasjoner av: `trygg`, `sikker`, `helse`, `medisinsk`, `risiko`, `fryse`, `overoppheting`, `må`, `bør`, `spedbarn`, `UV`, `solbeskyttelse`, `beskytter`, `farlig`, `romslig`, `for trangt`, `anbefalt av MET` og `MET anbefaler`. Det må finnes både eksakt snapshot-test av all synlig copy og en token-/regex-basert blokklistetest.

## Personvern uten manuell port

Den formelle personverngjennomgangen markeres **utsatt**, ikke «godkjent». Følgende maskinelle invarianter er likevel releaseblokkerende:

- `alreadyHaveConceptIds` finnes bare i komponent-/hook-minne for aktiv Snart-visning;
- ingen URL/query/hash/history-state;
- ingen `localStorage`, `sessionStorage`, IndexedDB eller Cache API;
- ingen logger, error telemetry, PostHog, analytics eller tracing-payload;
- ingen `fetch`, Supabase, API-route eller annen backendtransport fra Snart-modulene;
- ingen barn-ID, navn, rå fødselsdato eller timestamp/tidspunkthistorikk i Snart-state, output eller reviewfixture; aldersporten beregnes oppstrøms og sender bare `ageEligibleForWholeWindow`;
- state nullstilles ved unmount, barn-/profilbytte og nytt D+28–D+42-vindu;
- den rene modellen mottar bare støttet `homePlaceKey`, målperiodens lokale datoer, `ageEligibleForWholeWindow`, klimaprofil-ID og et immutable sett av konsept-ID-er;
- appen bruker aldri automatisk telefonposisjon for Free/Snart v1.

En statisk import/API-skann og en dynamisk nettleserspy skal begge kreves. Dynamisk test tar snapshot av URL og alle støttede lagringsflater, spy-er logger/analytics/backend, klikker `Har allerede`, bytter profil/vindu og avmonterer. Enhver observerbar write eller transport er FAIL.

## To uavhengige AI-reviewer på immutable kandidat

Ingen AI-review kan erstatte schema-, hash-, dekning-, copy- eller privacytester. AI-reviewene fanger tverrgående feil som er vanskelige å uttrykke fullstendig som assertions.

Etter immutable kandidatcommit innhenter root-orchestratoren lane A og B fra to distinkte, uavhengige read-only reviewer. Nye agenter er ikke et krav; eksisterende agenter kan gjenbrukes når de ikke har implementert kandidaten. Begge mottar og vurderer eksakt kandidat-SHA/tree/contract/pack/evidence.

Review A eier datakilde, lisens, proveniens, beregning, dekning, determinisme og fail-closed-adferd. Review B eier produktgrense, nøytral copy, personverninvarianter, tilgang, routing og sikker databehandling. Begge må gi PASS. Endres én kandidatbyte, kontrakten eller Git-SHA-en, blir begge rapportene ugyldige og kjøres på nytt.

`review-gate.ts` validerer schema, eksakt tuple, identisk reviewer/signaturidentitet, distinkte reviewer-ID-er, ren worktree før/etter, PASS-kommandoer og null uløste findings. Den kan ikke kryptografisk autentisere Codex-output; receipts er konsistensevidens. Dette er uavhengig review, ikke ekstern MET-, helse-, personvern- eller releasegodkjenning.

## Ny rekkefølge for 01-13–01-18

| Plan | Autonomt ansvar | Obligatorisk utgangsport |
|---|---|---|
| **01-13** | Frys full data-/nettverk-/reviewkontrakt, bygg boundary-fixtures, extractor, validator og statisk pack/manifest, og opprett shared receipt-/consistency-gate. | Task-1 kontrakttest er selvstendig grønn; 60 aktuelle unike keys avledes; byte-identisk pack; eksakt HTTP/SSRF-port; uavhengig review A+B |
| **01-14** | Implementer strict decoder, D+28–D+42/alder-kalender, månedsvektede målperiodesignaler, Babyora-heuristikk, copy og ren tretilstandsmodell med TDD. | 12-måneds-/dato-/skuddårs-/25-måneders-/terskelgrenser grønne; ukjent sted/data/hash fail-closed; uavhengig review A+B; capability false |
| **01-15** | Implementer Snart-komponent, exact-home/access-first session-evaluator, statisk privacyport og skjult Uke-integrasjon. | Ingen persistence/URL/logger/analytics/backend/identitet/timestamp; UI/session-tester; uavhengig review A+B; capability false |
| **01-16** | Legg til truthful paywall/accesscopy, aktiver før final commit, review faktisk activated SHA og kjør dynamisk privacy/access/browsermatrise + false rollback ved feil. | Capability viser bare validert fixed-home; family/calibration false; actual activated SHA review A+B |
| **01-17** | Bygg typed App→Uke én-gangsrequest og migrer Guide/program/Min garderobe-route når Snart er tilgjengelig. | Cross-root/no-replay/exact-context-regresjoner og uavhengig review A+B |
| **01-18** | Legg til nav/haptics via eksisterende adapter, kjør full CI/Playwright/native-kontrakt der miljøet støtter det, samle endelig evidens og gjennomfør siste to-review-kontroll dersom kandidaten har endret seg. | Full deterministisk suite grønn; samme kandidat-SHA i evidens og reviews; ingen påstand om fysisk enhet som ikke faktisk er testet |

Avhengighetsrekkefølgen er streng: `13 → 14 → 15 → 16 → 17 → 18`. Appkode starter ikke før kontrakten er grønn. I 01-16 aktiveres flagget i den lokale finalkandidaten før review, men kandidaten kan ikke regnes som leverbar før pakke, modell, UI, privacy og begge reviews gjelder nøyaktig denne aktiverte SHA-en.

## Konkrete filer og tester planner bør opprette

### Kontrakt og data

- `.planning/phases/01-planlegg-dagslinjen/01-SNART-AUTONOMY-CONTRACT.json`
- `scripts/snart/build-climate-pack.ts`
- `scripts/snart/validate-climate-pack.ts`
- `scripts/snart/review-gate.ts`
- `scripts/snart/fixtures/met-boundaries-v1.json`
- `src/data/snart/climate-1991-2020-v1.json`
- `src/data/snart/climate-1991-2020-v1.manifest.json`

### Domene og UI

- `src/lib/planning/snart-climate.ts`
- `src/lib/planning/snart-date-window.ts`
- `src/lib/planning/snart-heuristics-v1.ts`
- `src/lib/planning/snart.ts`
- `src/lib/planning/snart-copy.nb.ts`
- `src/components/planning/SnartPlan.tsx`
- eksisterende capability-/routefiler fra 01-16/01-17, endret først når deres porter er grønne

### Raske testmål

- `scripts/snart/__tests__/contract-fixtures.test.ts`: exact home/grid/http/24-URL/måned/rounding/age/reviewkontrakt uten builder.
- `scripts/snart/__tests__/climate-pipeline.test.ts`: månedlig DAP2, redirects/timeouts/body/retry, `_FillValue`, 60 avledede stedbindinger, lisens/12-månedsdekning/hash og stabil serialisering.
- `scripts/snart/__tests__/review-gate.test.ts`: actual HEAD/clean/evidencehash, identitetssignert receipt-schema, distinkte reviewer-ID-er, eksakt tuple, PASS/zero-unresolved, eksplisitt no-provenance-claim og tre-forsøks FAIL.
- `src/lib/planning/__tests__/snart-date-window.test.ts`: D+28–D+42, DST, faktisk antall dager i måned og 25-månedersgrense.
- `src/lib/planning/__tests__/snart-heuristics-v1.test.ts`: eksakte `2/7/12/16` °C og `20/50` mm, deduplisering og ingen sol/size/health.
- `src/lib/planning/__tests__/snart-privacy-contract.test.ts`: forbudte imports/API-er og minimal input/output-shape.
- `src/components/planning/__tests__/SnartPlan.test.tsx` og `e2e/planlegg.ts --case snart`: state/session/access/route/responsive/fail-closed.

Live MET-nettverk skal ikke være nødvendig i den vanlige hurtigtesten eller browser-suiten. De bruker små, committede månedlige DDS/DAS/ASCII-fixtures med kilde-URL og SHA. En eksplisitt `snart:data:refresh`-jobb gjør nettverksbygget sekvensielt/resumérbart; CI validerer den committede pakken offline.

## Miljø og sikkerhetsdomene

Node 24.14.1, npm 11.11.0, Git, curl og prosjektets eksisterende `tsx`/Vitest-verktøy var tilgjengelige under research. `ncdump` og Python-modulene xarray/netCDF4/NumPy/pyproj var ikke installert. [VERIFIED: local command/version probes, 2026-07-24] Den anbefalte månedlige ASCII-pipelinen trenger ingen av de manglende verktøyene og introduserer derfor ingen ny package-install eller package-legitimitetsport.

| ASVS-/sikkerhetsområde | Gjelder | Automatisk kontroll |
|---|---|---|
| V2 autentisering | Nei for valgt kilde | Credential-fritt THREDDS-preflight; ethvert authkrav gir FAIL |
| V3 session management | Ja, lokalt UI-minne | Reset-/reload-/unmount-tester; ingen persistent session |
| V4 access control | Ja | Capability + Plus/fixed-home-port testes separat fra modellen |
| V5 input validation | Ja | Strengt schema for kontrakt, DAP2-respons, manifest, pack og AI-rapport |
| V6 cryptography | Ja, integritet | Node `crypto` SHA-256; ingen egen hash-/kryptoalgoritme |

Viktigste trusler er manipulert datapakke (Tampering), gammel review mot ny kandidat (Tampering/Repudiation), kilde-URL-drift eller vilkårlig host (SSRF/Spoofing), og lekkasje av sessionvalg (Information Disclosure). Host-allowlist, HTTPS, immutable SHA-er, strikt parser, offline runtime og statiske/dynamiske privacytester er de bindende mitigasjonene.

## Risikomatrise

| Risiko | Sannsynlighet | Konsekvens | Automatisk kontroll | Fail-closed-resultat |
|---|---:|---:|---|---|
| Kilden kan ikke hentes / krever credential | Middels | Høy | HTTPS-preflight, status/content-type/schema | Ingen ny pakke; capability av |
| Dataset/format/version endres | Lav–middels | Høy | DDS/DAS-, attributt- og source-hasher | Builder stopper før output |
| Feil gridcelle eller kyst-/havcelle | Middels | Høy | lat/lon-avstand, gyldig `tg` og `rr` for alle tolv måneder, stedbinding i manifest | Sted ikke støttet |
| Ufullstendig månedsprofil | Lav–middels lokalt | Middels–høy | eksakt måned 1–12 og to endelige felt per rad | Hele profilen unavailable |
| Pakke er ikke reproduserbar | Lav–middels | Høy | to rene bygg og bytehash | Ingen commit/aktivering |
| Produktheuristikk oppfattes som fag-/MET-råd | Middels | Høy | schema-eierskap, fast copy, blokkord, AI-review B | Review/copytest FAIL |
| Helse-/sikkerhetscopy lekker tilbake | Middels | Høy | ingen sol/size-regler, blokklist + snapshots | Build/test FAIL |
| Sessionvalg persisteres eller spores | Lav–middels | Høy | statisk scan + dynamiske spies | UI-port FAIL |
| Review gjelder gammel kandidat | Middels | Høy | tre immutable SHA-er i begge rapporter | Rapporter ugyldige |
| Nettverkshenting belaster MET | Lav–middels | Middels | én request av gangen, cache, backoff, resume | Jobb stopper/pause; aldri parallell storm |
| Ny kostnad eller betalt fallback | Lav | Høy prosessrisiko | kostnadsfelt NOK 0, ingen betalings-/credentialsteg | Utenfor scope; ingen autonom bestilling |

## Hva kan kjøres uten et menneske

Følgende kan gjennomføres autonomt under gjeldende fullmakt: kontraktfrysing innen denne anbefalingen, gratis MET-preflight og sekvensiell datauthenting, datapakkebygg, tester, lint/build, browsermatrise, root-innhentede uavhengige read-only AI-reviewer, feilretting/omplanlegging, dokumentasjon, scoped commits og grønne GitHub-pushes. [VERIFIED: repository `AGENTS.md`; `docs/DECISION-LOG.md` 2026-07-24]

Det autonome løpet må stoppe eller avgrense funksjonen — ikke be om en mekanisk godkjenning — når teknisk evidens mangler. Bare en faktisk scopeutvidelse som krever credential-/betalt tjeneste, eller ny kostnadsforpliktelse over NOK 1 000, trenger ny eierbeslutning. Denne anbefalingen er utformet slik at ingen av delene er nødvendig.

## Antakelseslogg

| ID | Antakelse/produktvalg | Risiko hvis feil | Håndtering |
|---|---|---|---|
| A1 | Månedlige normaler skalert etter måldager gir tilstrekkelig nøytral fire–seks-ukers forberedelse. | Månedsgrunnlaget glatter ut kortvarige variasjoner. | Si eksplisitt månedlige normaler/ikke værvarsel; versjoner vektingen og bruk aldri dags- eller prognosespråk. |
| A2 | Eksakt 12 måneder med gyldig `tg` og `rr` er et tilstrekkelig teknisk dekningskrav. | Lokal gridusikkerhet kan fremstå mer presis enn den er. | Fail closed per hel stedsprofil; vis ingen delråd. |
| A3 | Grensene `2/7/12/16` °C og `20/50` mm gir nyttig, nøytral planlegging. | For mange/få kategorier fremheves. | Eies som `babyora-snart-heuristics@2`, boundary-tester, telemetry-fri senere produktrevisjon med ny versjon. |
| A4 | De 60 aktuelle, unike kanoniske nøklene er et akseptabelt v1-omfang. | Brukere med egendefinert hjemsted får `unavailable`. | Hash den aktuelle projeksjonen; sannferdig unavailable-state; utvid senere med ny validert pakke, aldri fuzzy fallback. |
| A5 | Målrettede OPeNDAP-kall mot kompakte månedsnormalfiler kan fullføre innen akseptabel build-tid. | Første bygg kan bli langsomt eller ratebegrenset. | Sekvensiell diskcache/resume; behold capability av ved vedvarende feil. |

Alle A-punktene er `[ASSUMED]` i betydningen produktvalg som ikke er validert av en ekstern autoritet. De er likevel beslutningsklare fordi de er eksplisitte, versjonerte, reversible og fail-closed.

## Kilder

### Primære/offisielle kilder

- [MET seNorge_2018-dokumentasjon](https://github.com/metno/seNorge_docs/wiki/seNorge_2018)
- [MET seNorge variabler og versjoner](https://github.com/metno/seNorge_docs/wiki/Variables)
- [MET seNorge datalagre](https://github.com/metno/seNorge_docs/wiki/Data-stores)
- [MET THREDDS temperatur-månedsnormaler](https://thredds.met.no/thredds/catalog/senorge/seNorge_2018/aggregated_products/tg/catalog.html)
- [MET THREDDS nedbør-månedsnormaler](https://thredds.met.no/thredds/catalog/senorge/seNorge_2018/aggregated_products/rr/catalog.html)
- [MET THREDDS-bruk](https://api.met.no/doc/thredds)
- [MET Report 07/2021: seNorge_2018](https://www.met.no/publikasjoner/met-report/met-report-2021/_/attachment/download/5abd0cf0-9a45-4c38-8ee2-1484150009f9%3Aaa5a68ca6035f7baa3856a0d371f6a822c23c29b/MET-report-7-2021.pdf)
- [MET lisensiering og kreditering](https://www.met.no/frie-meteorologiske-data/lisensiering-og-kreditering)
- [Frost autentisering](https://frost.met.no/authentication.html)
- [Frost API-referanse](https://frost.met.no/reference)
- [Frost klimanormal-eksempel](https://frost.met.no/ex_userquest)
- [Frost datakvalitet](https://frost.met.no/dataclarifications.html)
- [Frost v1/changelog](https://frost.met.no/changelog2.html)

### Repositoryevidens

- `AGENTS.md`
- `docs/DECISION-LOG.md`
- `.planning/PROJECT.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/phases/01-planlegg-dagslinjen/01-UI-SPEC.md`
- `.planning/phases/01-planlegg-dagslinjen/01-PATTERNS.md`
- `.planning/phases/01-planlegg-dagslinjen/01-SNART-RULES.md`
- `.planning/phases/01-planlegg-dagslinjen/01-13-PLAN.md` til `01-18-PLAN.md`
- `src/data/no-cities.ts`
- `.env.example`
- `api/forecast.ts`
- `src/lib/met-no/client.ts`
- `package.json`

## Konfidensvurdering

| Område | Nivå | Begrunnelse |
|---|---|---|
| Offisiell kilde, format og lisens | HIGH for observerte metadata; MEDIUM samlet | Kontrollert mot MET-dokumentasjon og direkte offisielle DDS/DAS/ASCII-responser |
| Frost-status og credentialkrav | MEDIUM | Offisiell Frost-dokumentasjon; v1 er i utvikling og kan endres |
| Build-arkitektur | MEDIUM | Bygger på verifisert endpoint og eksisterende stack; full 30-års/60-steds kjøretid er ennå ikke målt |
| Produktheuristikker/copy | LOW som ekstern fagfakta, HIGH som tydelig produktkontrakt | Bevisst Babyora-policy uten helse-/MET-endorsement |
| Personverninvarianter | HIGH som teknisk kontrakt | Direkte testbare; formell personvernreview er eksplisitt utsatt |

**Gyldighet:** kildeendepunkt, lisens og datasetmetadata bør preflightes på nytt ved hvert eksplisitt datapakkerefresh. Produkt- og repositoryfunn gjelder til kontrakten eller planene endres.
