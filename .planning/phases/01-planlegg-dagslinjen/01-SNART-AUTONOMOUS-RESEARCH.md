# Snart: autonomt beslutningsgrunnlag for plan 01-13–01-18

**Forskningsdato:** 2026-07-24
**Domene:** historisk klimagrunnlag, produktheuristikker, personverninvarianter og autonome kvalitetsporter
**Samlet konfidens:** MEDIUM — kilde- og repositoryfakta er kontrollert mot offisielle primærkilder og kodebasen; statistiske grenser og produktregler er eksplisitte Babyora-valg, ikke eksternt validerte faggrenser.

## Kort beslutning

Plan 01-13–01-18 kan kjøres uten eierporter dersom omfanget fryses slik:

1. Bruk METs `seNorge_2018`-arkiv som eneste klimakilde. Bygg en statisk Babyora-klimatologi fra daglige `tg`, `tn`, `tx` og `rr` for 1991–2020. Kall resultatet **«Babyora-avledet 1991–2020-klimatologi basert på MET seNorge_2018 v23.09/v23.11»**, aldri «MET-normal», «offisiell normal» eller værvarsel. [VERIFIED: MET seNorge documentation and THREDDS metadata]
2. Kjør uthenting sekvensielt ved build-time via THREDDS OPeNDAP `.ascii` og eksisterende Node/TypeScript-verktøy. Ingen runtime-kall, ny pakke eller credential er nødvendig. [VERIFIED: official THREDDS endpoint probe; repository package.json]
3. Begrens v1 til den aktuelle hashede `NO_CITIES`-projeksjonen: 60 oppføringer og 60 unike `home-place-key@1` ved kontroll 2026-07-24. Antallet avledes, aldri hardkodes. Et annet eller ugyldig hjemsted gir `unavailable`; aldri velg «nærmeste» profil i stillhet. [VERIFIED: repository `src/data/no-cities.ts`]
4. Frys temperatur- og nedbørsgrensene som `babyora-snart-heuristics@1`. Merk dem i schema, manifest og copy som Babyora-produktheuristikker. Fjern sol-, helse-, sikkerhets- og størrelsesreglene fra Snart v1.
5. Utsett formell personverngjennomgang uten å lempe på tekniske grenser: session-only; ingen URL, lagring, logger, analyse, backend, barn-ID eller tidspunkthistorikk.
6. Erstatt alle godkjenningsporter med deterministiske validatorer og to reviewer som den aktive `gsd-executor` spawner etter kandidatcommit med `fork_turns: "none"`. Executoren bruker sin collaboration-gitte ID som implementøreksklusjon og reconciler receipts mot toolresultatene i samme agenttur; SHA-er er consistency-only.
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

### Valgt grunnlag: MET seNorge_2018

MET beskriver `seNorge_2018` som griddede observasjonsbaserte datasett for Norge med daglig middel-, minimums- og maksimumstemperatur samt døgnnedbør på et 1 km UTM33-rutenett. [CITED: https://github.com/metno/seNorge_docs/wiki/seNorge_2018] Historikkarkivet inneholder årsfilene 1991–2020, med temperaturvariablene `tg`, `tn`, `tx` i versjon 23.09 og `rr` i versjon 23.11. [CITED: https://github.com/metno/seNorge_docs/wiki/Variables] [CITED: https://github.com/metno/seNorge_docs/wiki/Data-stores]

METs metadata sier at observasjonene er automatisk kvalitetskontrollert, og at nedbør er justert for vindindusert målefeil. Det gjør ikke hver rute eller avledet Babyora-statistikk til en «offisiell normal»; særlig tynt stasjonsgrunnlag, randsoner og nordlige områder må behandles som dekningsrisiko. [CITED: https://www.met.no/publikasjoner/met-report/met-report-2021/_/attachment/download/5abd0cf0-9a45-4c38-8ee2-1484150009f9%3Aaa5a68ca6035f7baa3856a0d371f6a822c23c29b/MET-report-7-2021.pdf]

### Eksakte offisielle endepunkter og format

| Formål | Endepunkt | Forventet format |
|---|---|---|
| Arkivkatalog | `https://thredds.met.no/thredds/catalog/senorge/seNorge_2018/Archive/catalog.html` | THREDDS HTML-katalog |
| Maskinlesbar katalog | `https://thredds.met.no/thredds/catalog/senorge/seNorge_2018/Archive/catalog.xml` | THREDDS XML |
| Årsdatasett | `https://thredds.met.no/thredds/dodsC/senorge/seNorge_2018/Archive/seNorge2018_{YYYY}.nc` | OPeNDAP/DAP2 |
| Datasettskjema | samme års-URL med suffiks `.dds` | DAP2 DDS |
| Datasetmetadata | samme års-URL med suffiks `.das` | DAP2 DAS |
| Avgrenset tekstrespons | samme års-URL med suffiks `.ascii?{constraint}` | DAP2 ASCII |
| Hel årsfil, kun nød-/reproduserbarhetsrute | `https://thredds.met.no/thredds/fileServer/senorge/seNorge_2018/Archive/seNorge2018_{YYYY}.nc` | NetCDF |

[VERIFIED: official THREDDS catalog XML and successful DDS/DAS/ASCII probes]

En konkret punktspørring skal bygges deterministisk slik, med riktig siste tidsindeks lest fra årets DDS:

```text
https://thredds.met.no/thredds/dodsC/senorge/seNorge_2018/Archive/seNorge2018_2020.nc.ascii?tg[0:1:365][Y:Y][X:X],tn[0:1:365][Y:Y][X:X],tx[0:1:365][Y:Y][X:X],rr[0:1:365][Y:Y][X:X]
```

`Y` og `X` er heltallsindekser i rutenettet, ikke brukerkoordinater. Builderen finner og fryser dem ved å sammenligne hvert kanoniske sted mot datasettenes `latitude[Y][X]` og `longitude[Y][X]`; etter dette inngår sted, original lat/lon, valgt indeks, rutens lat/lon og avstand i manifestet. Denne algoritmen er Babyoras byggemetode, ikke en MET-anbefaling.

Årsmetadata kontrollert for 2020 har dimensjonene `time=366`, `Y=1550`, `X=1195`, `_FillValue=-999.99`, og gridvariablene `tg`, `tn`, `tx`, `rr`, `latitude` og `longitude`. [VERIFIED: official 2020 DDS/DAS response] Builderen må lese dimensjoner og metadata per årsfil; den skal ikke anta 365 dager eller kopiere 2020-dimensjoner blindt til andre år.

### Lisens og kreditering

MET oppgir NLOD eller CC BY 4.0 som standard for åpne data og krever kreditering. [CITED: https://www.met.no/frie-meteorologiske-data/lisensiering-og-kreditering] THREDDS/seNorge-metadata peker tilsvarende på åpen lisens og MET som institusjon. [VERIFIED: official THREDDS DAS metadata]

Pakken og appens kildevisning skal derfor inneholde:

- `sourceOrganization: "Meteorologisk institutt (MET Norway)"`
- eksakt datasettnavn, variabelversjoner og normalperiode;
- eksakte katalog-/dataset-URL-er;
- lisens-URI hentet fra faktisk metadata;
- teksten «Bearbeidet av Babyora»;
- en eksplisitt forklaring om at Babyora har avledet statistikken, og at den ikke er et MET-varsel eller en offisiell MET-normal.

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

1. `preflight`: hent katalog-XML og årsfilenes DDS/DAS for 1991–2020 sekvensielt. Kontroller HTTPS-host, eksakt `urlPath`, variabler, dimensjoner, tidsdekning, `_FillValue`, source/institution, versjon og lisens.
2. `resolve-grid`: hent `latitude` og `longitude` én gang, bruk den frosne nearest-cell/mm/Y/X-policyen for hver aktuell `NO_CITIES`-oppføring, og skriv en sortert sted→rute-tabell. Nærmeste invalid/havcelle eller >5 km gjør stedet unavailable; ingen stille nabo brukes.
3. `fetch-points`: hent alle fire variabler for ett sted og ett år i samme `.ascii`-request. Maks én request er aktiv om gangen; bruk diskcache, tydelig identitet, begrenset retry med backoff og resume. MET ber THREDDS-klienter unngå parallell nedlasting. [CITED: https://thredds.met.no/thredds/catalog/senorge/seNorge_2018/Archive/catalog.html]
4. `normalize`: parse bare det eksplisitt validerte DAP2-ASCII-formatet; avvis ukjente felt, duplikate datoer, ikke-endelige tall og `_FillValue`.
5. `derive`: beregn kalenderdagsverdier med den frosne Babyora-metoden under.
6. `serialize`: bruk sorterte nøkler, stabil tallavrunding og UTF-8/LF for byte-identisk JSON.
7. `validate`: kjør schema-, dekning-, plausibilitets-, lisens-, copy-, privacy- og hashkontroller.
8. `reproduce`: bygg to ganger fra tomme, separate arbeidskataloger. `packSha256` og `manifestSha256` må være identiske.
9. `review`: etter kandidatcommit spawner den aktive executoren to uavhengige reviewer med `fork_turns: "none"`, lagrer receipts etter `FINAL_ANSWER` og reconciler dem mot sine faktiske toolresultater.
10. `publish`: commit pakken først når alle porter er grønne. Runtime leser kun den committede pakken og gjør aldri klimakall.

Builderen bør implementeres med eksisterende `tsx`/TypeScript samt Node sine innebygde `fetch`- og `crypto`-API-er. Det unngår nye installasjoner; repositoryet har allerede `tsx`, TypeScript og Vitest. [VERIFIED: repository `package.json`]

### Statistisk kontrakt: `babyora-climate-derivation@1`

Dette er anbefalte, transparente produktvalg — ikke offisielle MET-definisjoner:

- Normalperiode: kildedatoer 1991-01-01 til 2020-12-31 inklusivt.
- For hver kalenderdag brukes et sentrert femdagers vindu (`D-2` til `D+2`, syklisk over årsskiftet) på tvers av de 30 årene. Dette gir flere observasjoner rundt 29. februar og reduserer dag-til-dag-støy.
- `p10MinC`: Type-7-kvantilen av gyldig `tn`.
- `p50MeanC`: Type-7-kvantilen av gyldig `tg`.
- `p90MaxC`: Type-7-kvantilen av gyldig `tx`.
- `wetProbability`: andel gyldige `rr` der `rr >= 1.0`.
- Tall lagres med eksplisitt, testet avrunding; råverdier sammenlignes før avrunding.
- Hver dag/variabel må ha minst 27 representerte år og minst 90 % av de forventede femdagersobservasjonene. Ellers er hele stedsprofilen `unavailable`.
- Profilen bærer faktisk gyldig antall, manglende antall og min/maks per variabel; validatoren godtar ikke `null` som «normalverdi».

Disse valgene skal stå både i kontrakten og manifestet. Endres vindu, kvantilalgoritme, terskel eller avrunding, kreves ny `derivationVersion`, ny datapakke og nye golden tests.

### Proveniensmanifest

Manifestet skal minst inneholde:

```text
schemaVersion
derivationVersion
rulesetVersion
normalPeriod
createdFromGitSha
sourceCatalogUrl
sourceDatasetUrls[]
sourceVariableVersions
sourceInstitution
sourceLicenseUri
sourceMetadataSha256
sourceResponseSha256[]
placeGridBindings[]
coveragePolicy
quantileMethod
packSha256
builderSha256
```

`generatedAt` kan finnes i en separat, ikke-hashet kjøresporfil, men skal ikke gjøre pakken ikke-reproduserbar. Kandidatidentiteten er Git-SHA + kontrakt-SHA + data-SHA, ikke et flytende tidspunkt.

## Fail-closed dekning og fallback

V1 støtter bare en eksakt, stabil `homePlaceKey` fra `NO_CITIES`; onboarding kan fortsatt lagre andre koordinater for øvrige appfunksjoner, men Snart svarer `unavailable` for dem. [VERIFIED: repository supports canonical cities and arbitrary onboarding locations] Dette er mer sannferdig enn å merke en fjern profil som lokal eller å bygge en nasjonal mobilpakke uten størrelsesbudsjett.

Følgende skal gi `unavailable`, ingen plaggresultat og fortsatt `soon_preparation=false` under bygging:

- offisiell katalog/årsfil kan ikke hentes;
- endpointet begynner å kreve credential;
- host, dataset-ID, variabler, versjon, periode eller lisens avviker;
- sted→rute-binding mangler eller bryter avstandsgrensen;
- dekningen bryter 27-års-/90 %-kravet;
- parseren ser ukjent format, `_FillValue`, NaN eller duplikater;
- reproduserbarhets-hashene avviker;
- en deterministisk validator eller én AI-review returnerer FAIL;
- reviewrapportens Git-/kontrakt-/datahash avviker fra kandidaten.

Hvis en allerede committet pakke er fullstendig validert mot samme kontrakt, kan appen fortsette å bruke denne «last known good»-pakken. Byggejobben skal aldri overskrive den ved feil. Hvis ingen slik pakke finnes, forblir funksjonen utilgjengelig. Ingen syntetisk data, eldre 1961–1990-normal, live forecast, Frost-kall eller betalt datakilde brukes som fallback.

## Babyora-heuristikker og nøytral copy

### Frosset heuristikk v1

De eksisterende grensene kan kjøres autonomt når de navngis som produktvalg, ikke fagfakta:

| Signal | Babyora-grenser | Tillatte konsepter |
|---|---|---|
| `coldTailC` | `0`, `5`, `10`, `16` °C | innerlag, mellomlag, isolert ytterlag, hodeplagg, håndplagg |
| `expectedWetDays` | `2.0`, `4.0` av 15 | værbeskyttende ytterlag |

[VERIFIED: proposed values in repository `01-SNART-RULES.md`] Grensene er **ikke** verifisert av MET, helsemyndighet eller medisinsk fagperson. De skal merkes `policyOwner: "Babyora"`, `evidenceType: "product_heuristic"` og `rulesetVersion: "babyora-snart-heuristics@1"`.

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
| Undertekst | `Basert på historiske værmønstre 1991–2020, ikke et værvarsel.` |
| Gruppe 1 | `Sjekk først` |
| Gruppe 2 | `Kan være greit å ha tilgjengelig` |
| Gruppe 3 | `Ikke fremhevet for perioden` |
| Temperatur-rad | `Sjekk om dere har {kategori} tilgjengelig for perioden.` |
| Sekundær temperatur-rad | `{Kategori} kan være greit å finne fram dersom perioden blir kjøligere enn det historiske mønsteret.` |
| Nedbørs-rad | `Historikken har flere nedbørsdager i denne perioden. Sjekk om et værbeskyttende ytterlag er tilgjengelig.` |
| Global note | `Dette er en Babyora-planleggingsregel basert på historiske data. Sjekk dagens vær og egne behov nærmere datoen.` |
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

Den aktive `gsd-executor` fortsetter som post-candidate review-orchestrator i samme agenttur. Den leser sin collaboration-gitte canonical task name/agent ID, sender den eksplisitt til candidate CLI som `implementerAgentId`, og spawner lane A med `agent_type:"gsd-code-reviewer"` og lane B med `agent_type:"gsd-security-auditor"`, begge `fork_turns:"none"` og unik task name per plan/lane/attempt. Etter `wait_agent`/`list_agents` tar executoren canonical reviewer-ID-er fra toolresultatene og exact `FINAL_ANSWER` fra completion-eventene, skriver receipts og reconciler digests lokalt.

Review A eier datakilde, lisens, proveniens, beregning, dekning, determinisme og fail-closed-adferd. Review B eier produktgrense, nøytral copy, personverninvarianter, tilgang, routing og sikker databehandling. Begge må gi PASS. Endres én kandidatbyte, kontrakten eller Git-SHA-en, blir begge rapportene ugyldige og kjøres på nytt.

`review-gate.ts` validerer schemaer, hasher, distinkte reviewer-ID-er, implementøreksklusjon og digestkonsistens, men kan ikke kryptografisk autentisere Codex-tooloutput. Manglende executoridentitet, spawn/wait/list eller completion-payload er fail-closed. En ytre root-task kan auditere senere, men er ikke en nødvendig mid-plan handoff. Dette er uavhengig review, ikke ekstern MET-, helse-, personvern- eller releasegodkjenning.

## Ny rekkefølge for 01-13–01-18

| Plan | Autonomt ansvar | Obligatorisk utgangsport |
|---|---|---|
| **01-13** | Frys full data-/nettverk-/reviewkontrakt, bygg boundary-fixtures, extractor, validator og statisk pack/manifest, og opprett shared receipt-/consistency-gate. | Task-1 kontrakttest er selvstendig grønn; 60 aktuelle unike keys avledes; byte-identisk pack; eksakt HTTP/SSRF-port; executor-reconciled review A+B |
| **01-14** | Implementer strict decoder, D+28–D+42/leap/alder-kalender, Babyora-heuristikk, copy og ren tretilstandsmodell med TDD. | Date/leap/25-måneders-/heuristikkgrenser grønne; ukjent sted/data/hash fail-closed; executor-reconciled reviewpar; capability false |
| **01-15** | Implementer Snart-komponent, exact-home/access-first session-evaluator, statisk privacyport og skjult Uke-integrasjon. | Ingen persistence/URL/logger/analytics/backend/identitet/timestamp; UI/session-tester; executor-reconciled reviewpar; capability false |
| **01-16** | Legg til truthful paywall/accesscopy, aktiver før final commit, review faktisk activated SHA og kjør dynamisk privacy/access/browsermatrise + false rollback ved feil. | Capability viser bare validert fixed-home; family/calibration false; actual activated SHA review A+B |
| **01-17** | Bygg typed App→Uke én-gangsrequest og migrer Guide/program/Min garderobe-route når Snart er tilgjengelig. | Cross-root/no-replay/exact-context-regresjoner og executor-reconciled reviewpar |
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

- `scripts/snart/__tests__/contract-fixtures.test.ts`: exact home/grid/http/time/leap/rounding/age/reviewkontrakt uten builder.
- `scripts/snart/__tests__/climate-pipeline.test.ts`: DAP2, redirects/timeouts/body/retry, `_FillValue`, 60 avledede stedbindinger, lisens/dekning/hash og stabil serialisering.
- `scripts/snart/__tests__/review-gate.test.ts`: actual HEAD/clean/evidencehash, receipt-schema/digests, `fork_turns: "none"`, distinkte tool-observerte IDs, implementøreksklusjon, eksplisitt no-provenance-claim og tre-forsøks FAIL.
- `src/lib/planning/__tests__/snart-date-window.test.ts`: D+28–D+42, DST, leap-policy og 25-månedersgrense.
- `src/lib/planning/__tests__/snart-heuristics-v1.test.ts`: eksakte `0/5/10/16` og `2/4`, deduplisering og ingen sol/size/health.
- `src/lib/planning/__tests__/snart-privacy-contract.test.ts`: forbudte imports/API-er og minimal input/output-shape.
- `src/components/planning/__tests__/SnartPlan.test.tsx` og `e2e/planlegg.ts --case snart`: state/session/access/route/responsive/fail-closed.

Live MET-nettverk skal ikke være nødvendig i den vanlige hurtigtesten eller browser-suiten. De bruker små, committede DDS/DAS/ASCII-fixtures med kilde-URL og SHA. En eksplisitt `snart:data:refresh`-jobb gjør nettverksbygget sekvensielt; CI validerer den committede pakken offline.

## Miljø og sikkerhetsdomene

Node 24.14.1, npm 11.11.0, Git, curl og prosjektets eksisterende `tsx`/Vitest-verktøy var tilgjengelige under research. `ncdump` og Python-modulene xarray/netCDF4/NumPy/pyproj var ikke installert. [VERIFIED: local command/version probes, 2026-07-24] Den anbefalte ASCII-pipelinen trenger ingen av de manglende verktøyene og introduserer derfor ingen ny package-install eller package-legitimitetsport.

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
| Feil gridcelle eller kyst-/havcelle | Middels | Høy | lat/lon-avstand, gyldige fire variabler, stedbinding i manifest | Sted ikke støttet |
| For svak historisk dekning | Middels lokalt | Middels–høy | 27-års-/90 %-port per dag og variabel | Hele profilen unavailable |
| Pakke er ikke reproduserbar | Lav–middels | Høy | to rene bygg og bytehash | Ingen commit/aktivering |
| Produktheuristikk oppfattes som fag-/MET-råd | Middels | Høy | schema-eierskap, fast copy, blokkord, AI-review B | Review/copytest FAIL |
| Helse-/sikkerhetscopy lekker tilbake | Middels | Høy | ingen sol/size-regler, blokklist + snapshots | Build/test FAIL |
| Sessionvalg persisteres eller spores | Lav–middels | Høy | statisk scan + dynamiske spies | UI-port FAIL |
| Review gjelder gammel kandidat | Middels | Høy | tre immutable SHA-er i begge rapporter | Rapporter ugyldige |
| Nettverkshenting belaster MET | Lav–middels | Middels | én request av gangen, cache, backoff, resume | Jobb stopper/pause; aldri parallell storm |
| Ny kostnad eller betalt fallback | Lav | Høy prosessrisiko | kostnadsfelt NOK 0, ingen betalings-/credentialsteg | Utenfor scope; ingen autonom bestilling |

## Hva kan kjøres uten et menneske

Følgende kan gjennomføres autonomt under gjeldende fullmakt: kontraktfrysing innen denne anbefalingen, gratis MET-preflight og sekvensiell datauthenting, datapakkebygg, tester, lint/build, browsermatrise, executor-spawnede `fork_turns: "none"` AI-reviewer, feilretting/omplanlegging, dokumentasjon, scoped commits og grønne GitHub-pushes. [VERIFIED: repository `AGENTS.md`; `docs/DECISION-LOG.md` 2026-07-24]

Det autonome løpet må stoppe eller avgrense funksjonen — ikke be om en mekanisk godkjenning — når teknisk evidens mangler. Bare en faktisk scopeutvidelse som krever credential-/betalt tjeneste, eller ny kostnadsforpliktelse over NOK 1 000, trenger ny eierbeslutning. Denne anbefalingen er utformet slik at ingen av delene er nødvendig.

## Antakelseslogg

| ID | Antakelse/produktvalg | Risiko hvis feil | Håndtering |
|---|---|---|---|
| A1 | Femdagers sentrert vindu og Type-7-kvantiler er egnet Babyora-metode. | Klimaprofilen kan bli for glatt eller avvike fra forventet kalenderdagssemantikk. | Versjoner metoden, golden fixtures og tydelig Babyora-merking; aldri kall den offisiell normal. |
| A2 | 27 representerte år og 90 % observasjoner er tilstrekkelig produktdekning. | Svak lokal dekning kan fremstå mer presis enn den er. | Fail closed per hel stedsprofil; vis ingen delråd. |
| A3 | Eksisterende grenser `0/5/10/16` og `2/4` gir nyttig, nøytral planlegging. | For mange/få kategorier fremheves. | Eies som `babyora-snart-heuristics@1`, boundary-tester, telemetry-fri senere produktrevisjon med ny versjon. |
| A4 | De 60 aktuelle, unike kanoniske nøklene er et akseptabelt v1-omfang. | Brukere med egendefinert hjemsted får `unavailable`. | Hash den aktuelle projeksjonen; sannferdig unavailable-state; utvid senere med ny validert pakke, aldri fuzzy fallback. |
| A5 | Målrettede OPeNDAP ASCII-requests kan fullføre innen akseptabel build-tid. | Første bygg kan bli langsomt eller ratebegrenset. | Sekvensiell diskcache/resume; behold capability av ved vedvarende feil. |

Alle A-punktene er `[ASSUMED]` i betydningen produktvalg som ikke er validert av en ekstern autoritet. De er likevel beslutningsklare fordi de er eksplisitte, versjonerte, reversible og fail-closed.

## Kilder

### Primære/offisielle kilder

- [MET seNorge_2018-dokumentasjon](https://github.com/metno/seNorge_docs/wiki/seNorge_2018)
- [MET seNorge variabler og versjoner](https://github.com/metno/seNorge_docs/wiki/Variables)
- [MET seNorge datalagre](https://github.com/metno/seNorge_docs/wiki/Data-stores)
- [MET THREDDS seNorge-arkiv](https://thredds.met.no/thredds/catalog/senorge/seNorge_2018/Archive/catalog.html)
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
