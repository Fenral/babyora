---
phase: 01-planlegg-dagslinjen
artifact: snart-autonomous-rules
ruleset_version: babyora-snart-heuristics@2
derivation_version: babyora-monthly-normal-pack@2
status: locked_for_autonomous_implementation
created: 2026-07-19
revised: 2026-07-24
age_scope_months: 0-24
timezone: Europe/Oslo
target_window: D+28 through D+42 inclusive
source_dataset: MET seNorge_2018
normal_period: 1991-2020
expected_new_cost_nok: 0
formal_privacy_review: deferred
---

# Snart — autonomt, historisk forberedelsesgrunnlag

## Beslutningsstatus

Dette dokumentet er den bindende produkt- og datakontrakten for plan 01-13–01-18. Den erstatter det tidligere `pending_approval`-utkastet og alle seks manuelle forhåndsgodkjenninger. Gjeldende eierfullmakt i `AGENTS.md` og `docs/DECISION-LOG.md` 2026-07-24 gjør arbeidslisten autonom så lenge scope, sannhet, kostnad og tekniske porter holdes.

Snart er **nøytral historisk forberedelse**, ikke et værvarsel, helseråd eller sikkerhetsråd. En teknisk port kan gi `FAIL`, holde `soon_preparation` av eller gjøre et sted `unavailable`; den skal ikke erstattes av eierbekreftelse eller en udokumentert antakelse.

## Låste beslutninger

| ID | Beslutning | Konsekvens |
|---|---|---|
| D-01 | Plan 01-13–01-18 kjøres autonomt. | Ingen menneskelig stopptask, eiergodkjenning, fagport eller manuelt gjenopptakssignal. |
| D-02 | Snart beskriver historisk grunnlag, aldri prognose. | All synlig copy sier 1991–2020 og «ikke et værvarsel». |
| D-03 | MET `seNorge_2018` er eneste klimakilde. | Uthenting skjer i en separat, reproduserbar build-time-pipeline; appen har ingen runtime klima-API. |
| D-04 | Data skal aldri fabrikeres eller erstattes stille. | Manglende/ugyldig profil, kilde, dekning, schema, lisens eller hash gir `unavailable`. Ingen Frost-, forecast-, nabo- eller syntetisk fallback. |
| D-05 | Tallgrensene eies av Babyora. | `babyora-snart-heuristics@2` er en versjonert produktheuristikk, ikke en MET-, helse- eller sikkerhetsgrense. |
| D-06 | Sol-, helse-, kuldeeksponerings-, sikkerhets-, størrelse- og passformpåstander er ute. | Ingen solsignal, UV-copy, medisinsk rationale, eksponeringsråd, størrelsesinput eller passformnote finnes i modell eller UI. |
| D-07 | `Har allerede` er session-only. | Ingen URL, storage, logger, analytics, backend, barn-ID eller tidspunktshistorikk; state nullstilles ved relevante grenser. |
| D-08 | Høyrisiko krever determinisme og to uavhengige reviewer. | Den aktive `gsd-executor` spawner begge etter immutable kandidatcommit med `fork_turns: "none"`, bruker sin collaboration-gitte canonical agent/task-identitet som eksklusjons-ID og reviewer aldri eget arbeid. Lokale receipts er konsistensbevis, ikke kryptografisk proveniens. |
| D-09 | Forventet ny kostnad er NOK 0. | Ingen betalt fallback eller ekstra kreditt. Ny enkelt- eller aggregert forpliktelse over NOK 1 000 krever separat eierbeslutning og pådras ikke av disse planene. |
| D-10 | Capability aktiveres først når eksakt kandidat er grønn. | `soon_preparation=false` gjennom data-, modell- og UI-planene; en mislykket port ruller tilbake til false. |
| D-11 | Ubygde løfter forblir av. | `family_sharing=false` og `personal_calibration=false`; de nevnes ikke som leverte fordeler. |
| D-12 | Ingen ny appmedia mens flaten endres. | Tester bruker tekst, DOM, tilgjengelighet og E2E uten screenshot, video eller trace. Fase 4 eier senere fysisk/visuell konvergens. |

## Formål og ikke-mål

Snart svarer bare på:

> Hvilke eksisterende plaggkategorier kan det være nyttig å sjekke at er tilgjengelige for perioden 28–42 lokale kalenderdager fra i dag, basert på validerte historiske værmønstre ved fast hjemsted?

Funksjonen:

- viser kategorier, ikke produkter, kjøpspåbud, materialrangering eller en konkret dags anbefaling;
- bruker bare fast hjemsted og en forhåndsbygget klimatologiprofil;
- viser eksakt målperiode og historisk kildegrunnlag;
- lar brukeren markere handlingspunkter som `Har allerede` i aktiv React-session;
- endrer ikke anbefalingsmotor, plaggkatalog, terskler, guardrails eller Motor V2.

Følgende finnes ikke i Snart v1:

- helseråd, sikkerhetsråd, medisinske påstander eller råd om kuldeeksponering;
- sol, UV, solhatt eller soldekkende regler;
- størrelse, passform, vekst, fødselsdato eller aldersutledet plaggvalg;
- automatisk telefonposisjon, korttidsvarsel, sesongvarsel eller runtime klimakall;
- garderoberegister, barn-ID, navn, koordinathistorikk, tidsstempler fra brukerhandlinger eller telemetry.

## Klimakilde og build-time-kontrakt

### Kilde

Pakken bygges kun fra METs offisielle, kompakte `seNorge_2018` månedsnormaler for 1991–2020:

- `tg_normal_1991_2020_monthly_MM.nc` med variabel `tg`, enhet `Celsius`, `time: mean`, filversjon `1.0` og kildeversjon `v23_09`;
- `rr_normal_1991_2020_monthly_MM.nc` med variabel `rr`, enhet `mm`, `time: sum`, filversjon `1.0` og kildeversjon `v23_11`.

`MM` er eksakt `01`–`12`. Katalog-URL-ene er attribusjon, ikke dynamiske redirect-/discoveryinnganger. Kontrakten genererer en eksakt allowlist med 24 dataset-URL-er — to variabelfamilier × tolv måneder — og ingen andre datasettnavn kan hentes.

Alle nettverkskall følger den maskinlesbare `httpPolicy` i autonomikontrakten:

- URL-skjema er eksakt `https:`, hostname er eksakt ASCII `thredds.met.no`, effektiv port er 443 (`URL.port` bare tom eller `443`), og username/password/hash er tomme;
- pathname matcher eksakt `^/thredds/dodsC/senorge/seNorge_2018/aggregated_products/(tg|rr)/seNorge2018_(tg|rr)_normal_1991_2020_monthly_(0[1-9]|1[0-2])\.nc\.(dds|das|ascii)$`; mappefamilie og variabelnavn må være identiske, URL-en må finnes i den genererte 24-elementers allowlisten, og `.ascii`-query parses strukturelt og tillater bare `time,lat,lon,tg,rr` med heltallsindekser innen validerte DDS-dimensjoner;
- `fetch` bruker `redirect: "manual"`; alle 3xx, off-host `Location`, HTTPS→HTTP-downgrade, ukjent status og ukjent content type er terminal FAIL og følges aldri;
- timeout er 20 000 ms per forsøk; body leses streaming med hard grense 2 MiB for DDS/DAS/punkt-ASCII og 96 MiB for den ene koordinatgrid-responsen; avbrutt, trunkert eller større body er FAIL og caches ikke;
- bare HTTP 200 aksepteres. Bare 429, 500, 502, 503 og 504 kan retries, maksimalt tre totale forsøk med 1 s og 2 s eksponentiell venting. Gyldig numerisk eller IMF-date `Retry-After` brukes som `max(backoff, retryAfter)` og clampes til 0–30 s;
- `User-Agent` er frosset til eksakt `klemeg/1.0 (sivertskotvold@gmail.com)`, samme verdi som `VITE_METNO_USER_AGENT` i `.env.example`; kontrakttesten feiler dersom repositoryverdien mangler eller avviker, og builderen sender kontraktverdien uendret på hvert kall;
- off-host redirect, downgrade, timeout, abort, trunkering, oversize, 429 med/uten `Retry-After`, retrybar 5xx, ikke-retrybar status og feil User-Agent har frosne boundary-fixtures og tester.

Appens produksjonskode importerer bare den committede pakken. Den kan ikke importere builder, `fetch`, THREDDS, Frost eller andre klimaendepunkter.

### Støttede steder

`src/data/no-cities.ts#NO_CITIES` er kanonisk build-input. Kontroll 2026-07-24 fant 60 oppføringer og 60 unike kanoniske nøkler. Antallet avledes alltid fra kildearrayen og hardkodes aldri i builder eller validator.

`home-place-key@1` er eksakt:

1. `nameNfc` = Unicode NFC etter trim og kollaps av enhver Unicode-whitespace-run til én U+0020; `nameKey` = locale-uavhengig `nameNfc.toLowerCase()`;
2. `latE4`/`lonE4` er signed heltall i 10⁻⁴ grad. Kildeverdien må være endelig, innen gyldig lat/lon-område og ligge innen `1e-8` av et heltall etter multiplikasjon med 10 000; ellers avvises hele kontraktbyggingen;
3. `homePlaceKey` = `no-city:v1:${encodeURIComponent(nameKey)}:${latE4}:${lonE4}`;
4. den kanoniske projeksjonen er `{homePlaceKey,nameNfc,latE4,lonE4}` sortert stigende etter UTF-8-bytes i `homePlaceKey`, serialisert som canonical JSON UTF-8/LF og SHA-256-hashet;
5. runtime-match krever samme normaliserte navn og eksakt samme `latE4`/`lonE4`. Ingen prefix-, fuzzy-, koordinat-radius- eller automatic/effective-place-match er tillatt. Samme koordinat med ulikt navn, som de eksisterende Rana-oppføringene, er distinkte nøkler.

Gridbinding `nearest-grid-cell@1` er også eksakt:

- beregn Haversine-avstand med jordradius 6 371 008,8 m fra stedets `latE4/lonE4` til hver endelig gridkoordinat;
- kvantiser positiv avstand til millimeter med half-away-from-zero, sorter på `[distanceMillimetres,Y,X]`, og velg bare første geometriske celle; lik millimeteravstand brytes med laveste `Y`, deretter `X`;
- maksimal avstand er 5 000 000 mm. Over grensen gir eksplisitt `grid_too_far`;
- valgt celle må ha endelig lat/lon og en endelig, ikke-`_FillValue` verdi for både `tg` og `rr` i alle tolv måneder. Hav/ugyldig celle eller ett manglende månedsfelt gir eksplisitt `grid_invalid_or_sea`; builderen prøver aldri nest nærmeste celle i stillhet;
- boundary-fixtures dekker eksakt treff, sub-millimeter/tie, Y/X-tiebreak, 5 000 000/5 000 001 mm, invalid/havcelle og to navn med samme koordinat.

Manifestet registrerer hele kanoniske projeksjonshashen, hver binding, faktisk `canonicalPlaceCount`, `supportedProfileCount` og én eksplisitt unavailable-grunn per ikke-støttet oppføring. Validatoren krever at støttet + unavailable er eksakt lik den aktuelle hashede `NO_CITIES`-projeksjonen.

Ugyldig eller ikke-kanonisk hjemsted velger aldri nærmeste profil ved runtime. Det gir `unavailable`.

### Reproduserbarhet og proveniens

Build-pipelinen skal:

1. preflighte alle 24 månedlige DDS/DAS-skjemaer, kildeinstitusjon, fil-/kildeversjoner, periode, enheter, aggregation-attributt, `_FillValue` og lisens gjennom den frosne HTTP-policyen;
2. løse gridceller med `nearest-grid-cell@1` og aldri nabo-fallback;
3. hente ett sted, én variabel og én måned om gangen med maksimal samtidighet én, begrenset retry/backoff og resumérbar cache under ignorert `tmp/`;
4. parse bare validert DAP2-ASCII og binde hvert svar til kontraktens eksakte variabel, måned og gridindeks;
5. avvise ukjente felt, duplikate/manglende måneder, ikke-endelige tall og `_FillValue`;
6. derivere, sortere og serialisere med stabile nøkler, dokumentert avrunding, UTF-8 og LF;
7. bygge to ganger fra separate tomme outputmapper mot den samme hashede råkilde-cachen;
8. kreve byte-identisk pack- og manifest-hash;
9. validere pakken offline i vanlige tester og build;
10. bevare siste validerte committede pakke dersom et senere refresh feiler; et mislykket refresh får aldri overskrive den.

Manifestet inneholder minst:

`schemaVersion`, `derivationVersion`, `rulesetVersion`, `normalPeriod`, `createdFromGitSha`, `sourceCatalogUrls`, eksakt 24 `sourceDatasets[{url,family,variable,month,metadataSha256,responseSha256[]}]`, `sourceFileVersions`, `sourceVariableVersions`, `sourceUnits`, `sourceAggregations`, `sourceInstitution`, `sourceLicenseUri`, `httpPolicyVersion`, `homePlaceKeyVersion`, `gridPolicyVersion`, `targetWindowDerivationVersion`, `placeGridBindings`, `monthCount`, `roundingPolicy`, `canonicalPlacesSha256`, `packSha256`, `builderSha256` og `contractSha256`.

`generatedAt` kan bare ligge i et ikke-identitetsbærende kjørespor. Kandidatidentiteten er Git-SHA + kontrakt-SHA + datapakke-SHA.

### Lisens og attribusjon

Manifest og kildevisning skal vise:

- `Meteorologisk institutt (MET Norway)`;
- eksakt datasettnavn, variabelversjoner, normalperiode og kilde-URL-er;
- lisens-URI fra faktisk MET-metadata;
- `Bearbeidet av Babyora`;
- forklaring om at kildefilene er METs offisielle månedsnormalprodukter, mens Babyoras målperiodeberegning og plaggheuristikker verken er et MET-varsel eller en MET-anbefaling.

## Datapakke `babyora-monthly-normal-pack@2`

Hver støttet hjemstedsprofil har eksakt tolv rader, sortert fra januar til desember:

```text
{month, meanTemperatureC, monthlyPrecipitationMm}
```

`month` må være hvert heltall 1–12 nøyaktig én gang. Begge verdier må være endelige og ikke lik kildens `_FillValue`. Temperatur og nedbør serialiseres med én desimal; gridavstand med null desimaler. Alle bruker half-away-from-zero, `-0` normaliseres til `0`, JSON bruker aldri eksponentform, og runtimeberegning/terskelsammenligning bruker uavrundede kildeverdier. Ett avvik gjør hele stedsprofilen `unavailable`; delvise råd er ikke tillatt.

## Modellinput og målperiode

Den rene modellen mottar bare:

- `asOfLocalDate: YYYY-MM-DD`;
- `timezone: "Europe/Oslo"`;
- `homePlaceKey`;
- `ageEligibleForWholeWindow: boolean`, beregnet oppstrøms uten at fødselsdato eller barn-ID krysser Snart-grensen;
- `climateProfileId`;
- et immutable sett `alreadyHaveConceptIds`.

Målperioden er D+28 til D+42, begge ender inkludert, alltid 15 unike lokale datoer. Kalenderregning bruker ISO-år/måned/dag i `Europe/Oslo`, ikke millisekunddøgn, og testes over begge DST-overganger.

`ageEligibleForWholeWindow` er true bare når hele vinduet ligger i 0–24 måneder. Oppstrøms beregning lager 25-månedersdagen med kalender-månedsaddisjon og end-of-month-clamp; resultatet er eksakt `targetEndLocalDate < addCalendarMonthsClamped(birthLocalDate, 25)`. En 25-månedersdag på D+28, D+35 eller D+42 gjør hele resultatet `unavailable`; først D+43 er tillatt. Boundary-fixtures dekker dag 28/35/42/43 samt fødselsdag 29., 30. og 31. over februar/skuddår. Bare booleanen krysser Snart-grensen.

## Avledede signaler

`babyora-target-window-monthly-weighting@1` grupperer målperiodens 15 datoer etter kalendermåned:

- `targetMeanTemperatureC = Σ(meanTemperatureC_month × targetDaysInMonth) / 15`;
- `targetPrecipitationMm = Σ(monthlyPrecipitationMm_month / daysInMonth(targetYear, month) × targetDaysInMonth)`.

Dette skalerer historiske månedsnormaler til den konkrete 15-dagersperioden. Det er aldri et værvarsel. Skuddår håndteres bare ved faktisk antall dager i den berørte februar; det finnes ingen 29.-februar-profil eller kalenderdagsfallback.

## Produktheuristikk `babyora-snart-heuristics@2`

Alle rader har `policyOwner: "Babyora"` og `evidenceType: "product_heuristic"`.

| Regel-ID | Trigger | Intern gruppe | Konsept | Synlig setning |
|---|---|---|---|---|
| `SNART-H2-BASE-CHECK` | `targetMeanTemperatureC <= 12` | `check_first` | `snart.base_layer` | `Sjekk om dere har et lett innerlag tilgjengelig for perioden.` |
| `SNART-H2-BASE-AVAILABLE` | `12 < targetMeanTemperatureC <= 16` | `available_if_needed` | `snart.base_layer` | `Et lett innerlag kan være greit å finne fram dersom perioden blir kjøligere enn det historiske mønsteret.` |
| `SNART-H2-BASE-NOT-HIGHLIGHTED` | `targetMeanTemperatureC > 16` | `not_highlighted` | `snart.base_layer` | `Innerlag er ikke fremhevet av denne historiske perioden.` |
| `SNART-H2-MID-CHECK` | `targetMeanTemperatureC <= 7` | `check_first` | `snart.mid_layer` | `Sjekk om dere har et mellomlag tilgjengelig for perioden.` |
| `SNART-H2-MID-AVAILABLE` | `7 < targetMeanTemperatureC <= 12` | `available_if_needed` | `snart.mid_layer` | `Et mellomlag kan være greit å finne fram dersom perioden blir kjøligere enn det historiske mønsteret.` |
| `SNART-H2-MID-NOT-HIGHLIGHTED` | `targetMeanTemperatureC > 12` | `not_highlighted` | `snart.mid_layer` | `Mellomlag er ikke fremhevet av denne historiske perioden.` |
| `SNART-H2-OUTER-CHECK` | `targetMeanTemperatureC <= 2` | `check_first` | `snart.insulated_outer` | `Sjekk om dere har et isolert ytterlag tilgjengelig for perioden.` |
| `SNART-H2-OUTER-AVAILABLE` | `2 < targetMeanTemperatureC <= 7` | `available_if_needed` | `snart.insulated_outer` | `Et isolert ytterlag kan være greit å ha tilgjengelig dersom perioden blir kjøligere enn det historiske mønsteret.` |
| `SNART-H2-OUTER-NOT-HIGHLIGHTED` | `targetMeanTemperatureC > 7` | `not_highlighted` | `snart.insulated_outer` | `Isolert ytterlag er ikke fremhevet av denne historiske perioden.` |
| `SNART-H2-HEAD-CHECK` | `targetMeanTemperatureC <= 7` | `check_first` | `snart.cold_headwear` | `Sjekk om dere har et hodeplagg tilgjengelig for perioden.` |
| `SNART-H2-HEAD-AVAILABLE` | `7 < targetMeanTemperatureC <= 12` | `available_if_needed` | `snart.cold_headwear` | `Et hodeplagg kan være greit å ha tilgjengelig dersom perioden blir kjøligere enn det historiske mønsteret.` |
| `SNART-H2-HEAD-NOT-HIGHLIGHTED` | `targetMeanTemperatureC > 12` | `not_highlighted` | `snart.cold_headwear` | `Hodeplagg er ikke fremhevet av denne historiske perioden.` |
| `SNART-H2-HAND-CHECK` | `targetMeanTemperatureC <= 2` | `check_first` | `snart.handwear` | `Sjekk om dere har håndplagg tilgjengelig for perioden.` |
| `SNART-H2-HAND-AVAILABLE` | `2 < targetMeanTemperatureC <= 7` | `available_if_needed` | `snart.handwear` | `Håndplagg kan være greit å ha tilgjengelig dersom perioden blir kjøligere enn det historiske mønsteret.` |
| `SNART-H2-HAND-NOT-HIGHLIGHTED` | `targetMeanTemperatureC > 7` | `not_highlighted` | `snart.handwear` | `Håndplagg er ikke fremhevet av denne historiske perioden.` |
| `SNART-H2-WET-CHECK` | `targetPrecipitationMm >= 50` | `check_first` | `snart.weather_shell` | `Historisk nedbørsmengde er høyere for perioden. Sjekk om et værbeskyttende ytterlag er tilgjengelig.` |
| `SNART-H2-WET-AVAILABLE` | `20 <= targetPrecipitationMm < 50` | `available_if_needed` | `snart.weather_shell` | `Et værbeskyttende ytterlag kan være greit å ha tilgjengelig ut fra historisk nedbørsmengde.` |
| `SNART-H2-WET-NOT-HIGHLIGHTED` | `targetPrecipitationMm < 20` | `not_highlighted` | `snart.weather_shell` | `Værbeskyttende ytterlag er ikke fremhevet av periodens historiske nedbørsmengde.` |

Rekkefølge etter deduplisering:

`snart.base_layer` → `snart.mid_layer` → `snart.insulated_outer` → `snart.cold_headwear` → `snart.handwear` → `snart.weather_shell`.

Hvert konsept har nøyaktig én vinnende regel. Gruppeprioritet er `check_first` → `available_if_needed` → `not_highlighted`. Regler velger aldri materiale, varmegrad, antall lag, produkt eller kjøp.

## Presentasjon og eksakt copy

| Element | Copy |
|---|---|
| Tittel | `Planlegg for {fraDato}–{tilDato}` |
| Undertekst | `Basert på månedlige normaler for 1991–2020, ikke et værvarsel.` |
| Gruppe 1 | `Sjekk først` |
| Gruppe 2 | `Kan være greit å ha tilgjengelig` |
| Gruppe 3 | `Ikke fremhevet for perioden` |
| Global note | `Dette er en Babyora-planleggingsregel basert på historiske månedsnormaler. Sjekk dagens vær og egne behov nærmere datoen.` |
| Utilgjengelig | `Vi har ikke godt nok historisk grunnlag for dette stedet akkurat nå.` |
| Tom | `Ingenting å forberede akkurat nå.` |
| Kilde | `Månedsnormaler 1991–2020: Meteorologisk institutt (MET Norway). Bearbeidet av Babyora.` |

Copykontrakten blokkerer påstander om sikkerhet, helse, medisin, eksponeringsfare, spedbarnsråd, sol/UV, størrelse/passform og MET-anbefaling. Testen skal dekke bøyninger og sammensatte varianter, ikke bare eksakt streng.

## Resultatmodell

| Tilstand | Kriterium | Payload |
|---|---|---|
| `ready` | Alle innganger, versjoner, profil og dekning er valide, og minst ett synlig element finnes. | Eksakte datoer, kilde/versjon, grupper, elementer og sporbarhet. |
| `empty` | Evidensen er valid, men ingen synlige elementer gjenstår etter deduplisering og sessionvalg. | Bare tom-copy, periode og kildeidentitet; ingen plaggpåstand. |
| `unavailable` | Alderport, tidssone, hjemsted, profil, schema, hash, dekning eller versjon er ugyldig/mangler. | Bare nøytral utilgjengelig-copy og maskinlesbar grunn; ingen konsepter eller skjult råd. |

Hvert `ready`-element bærer `rulesetVersion`, `ruleId`, `conceptId`, gruppe, målperiode, `profileId`, `packSha256`, signalnavn/verdi og `evidenceType`.

## `Har allerede` og teknisk personvern

- Kontroll vises bare for `check_first` og `available_if_needed`.
- `not_highlighted` kan ikke markeres eller skjules med kontrollen.
- Et markert handlingskonsept kan ikke komme tilbake gjennom en lavere prioritert regel.
- Hvis alle handlingspunkter er markert og `not_highlighted` fortsatt finnes, er resultatet `ready` med bare denne gruppen.
- `empty` brukes bare når ingen synlig rad finnes.
- Mengden lever kun i React-minne for aktiv Snart-visning og nullstilles ved unmount, profilbytte, fast-hjem-profilbytte eller nytt D+28–D+42-vindu.
- Modellen, komponenten, URL-en, historystate, `localStorage`, `sessionStorage`, IndexedDB, Cache API, logger, analytics, tracing, backend og reviewfixtures inneholder ingen barn-ID, navn, rå fødselsdato eller brukerhandlingstidspunkt.
- Formell personverngjennomgang er utsatt; statiske og dynamiske tester av disse invariantene er releaseblokkerende for capability.

## Capability, tilgang og fallback

- `soon_preparation` forblir false gjennom 01-13, 01-14 og 01-15.
- I Plan 01-16 gjør den aktive executoren flagget true før siste test/build og kandidatcommit. Begge reviewer vurderer dermed den faktiske aktiverte SHA-en; ingen capability-byte kan endres etter PASS.
- Free/loading evaluerer ikke modell eller profil og beholder ingen betalt payload.
- Plus bruker kun aktivt barns validerte faste hjem. Automatisk/effective place er ikke representerbart i Snart-input.
- `family_sharing` og `personal_calibration` forblir false og skal ikke vises i paywallcopy.
- Enhver kilde-, schema-, hash-, dekning-, review- eller privacyfeil gjør resultatet `unavailable` eller holder capability av.

## Uavhengig review

Plan 01-13 oppretter `scripts/snart/review-gate.ts` med subkommandoene `candidate`, `receipt` og `validate`. Hver plan 01-13–01-18 bruker eksakt:

```text
.planning/phases/01-planlegg-dagslinjen/evidence/{plan}-candidate.json
.planning/phases/01-planlegg-dagslinjen/evidence/{plan}-review-a.json
.planning/phases/01-planlegg-dagslinjen/evidence/{plan}-review-b.json
```

Den samme aktive `gsd-executor` eier hele planens implementasjon→review-loop i én agenttur. Etter at den har kjørt taskverifikasjon og committet immutable kandidat, leser den sin faktiske canonical task name/agent ID fra collaboration-konteksten den ble spawnet med. Denne identiteten er `implementerAgentId`/`implementerCanonicalTaskName` og brukes bare til eksklusjon.

Executoren sender identiteten både som eksplisitte CLI-felt og som `executorIdentity` JSON på stdin:

```text
npx tsx scripts/snart/review-gate.ts candidate --plan <plan> --attempt <N> --implementer-agent-id "<actual executor agent ID>" --implementer-task-name "<actual executor canonical task name>" --evidence-dir .planning/phases/01-planlegg-dagslinjen/evidence
```

`candidate` feiler hvis identitetsfeltene mangler, er tomme eller avviker fra stdin-envelope. Før hver autoritativ `<automated>`-kontroll eksporterer den aktive executoren den samme faktiske agent-ID-en som `BABYORA_IMPLEMENTER_AGENT_ID`; kontrollen feiler med exit 97 dersom variabelen mangler og sender den eksplisitt til `validate --implementer-agent-id`. Dette er en lokal consistency-check; verktøyet autentiserer ikke Codex-identiteten. Det recomputer faktisk `git rev-parse HEAD`, tree/commit existence, clean worktree, `contractSha256`, `packSha256`, canonical `evidenceSha256` og changed paths.

For hvert attempt `N ∈ {1,2,3}` kaller executoren selv disse collaboration-primitivene etter commit og starter begge før venting:

```text
collaboration.spawn_agent({agent_type:"gsd-code-reviewer",fork_turns:"none",task_name:"snart_<plan>_review_a_attempt_<N>",message:"READ ONLY. Do not modify files. Independently review lane A against evidence/<plan>-candidate.json. You are not the implementer. Return one FINAL_ANSWER containing snart-review-result@1 JSON."})
collaboration.spawn_agent({agent_type:"gsd-security-auditor",fork_turns:"none",task_name:"snart_<plan>_review_b_attempt_<N>",message:"READ ONLY. Do not modify files. Independently review lane B against evidence/<plan>-candidate.json. You are not the implementer. Return one FINAL_ANSWER containing snart-review-result@1 JSON."})
```

`<plan>` erstattes med for eksempel `01_13`; task names er unike per plan/lane/attempt. Executoren bruker `collaboration.wait_agent` og `collaboration.list_agents`, tar reviewer canonical task name/agent ID bare fra toolresultatene og tar exact `FINAL_ANSWER` bare fra completion-eventen. `fork_turns: "none"` er eneste tillatte stavemåte. Hvis `spawn_agent`, `wait_agent`, `list_agents`, canonical ID eller `FINAL_ANSWER` ikke er tilgjengelig i executorens agenttur, feiler planen lukket.

Etter completion skriver executoren receipts fra de faktiske toolresultatene med exact event-JSON på stdin:

```text
npx tsx scripts/snart/review-gate.ts receipt --plan <plan> --lane A --attempt <N> --out .planning/phases/01-planlegg-dagslinjen/evidence/<plan>-review-a.json
npx tsx scripts/snart/review-gate.ts receipt --plan <plan> --lane B --attempt <N> --out .planning/phases/01-planlegg-dagslinjen/evidence/<plan>-review-b.json
npx tsx scripts/snart/review-gate.ts validate --plan <plan> --implementer-agent-id "<actual executor agent ID>" --evidence-dir .planning/phases/01-planlegg-dagslinjen/evidence
```

Hver `*-review-{a,b}.json` har eksakt schema:

```text
schemaVersion: "codex-collaboration-review-receipt@1"
planId, lane: "A"|"B", attempt
implementer: {canonicalTaskName, agentId}
spawnRequest: {agent_type, fork_turns: "none", task_name, messageSha256}
spawnResult: {canonicalTaskName, agentId}
finalEvent: {messageType: "FINAL_ANSWER", canonicalTaskName, agentId, payload}
candidate: {gitSha, treeSha, contractSha256, packSha256, evidenceSha256}
finalAnswerSha256
transcriptSha256
```

`finalAnswerSha256 = SHA256(exact UTF-8 bytes of finalEvent.payload)`. `transcriptSha256 = SHA256(canonical JSON UTF-8/LF of {spawnRequest,spawnResult,finalEvent})`; canonical JSON bruker leksikografisk sorterte objektnøkler, bevarer arrayrekkefølge og normaliserer ikke payload/newlines. `finalEvent.payload` må parse som `snart-review-result@1` med samme plan/lane/attempt/kandidattuple, `verdict: "PASS"|"FAIL"` og `findings[]`.

Den lokale `review-gate.ts` kan bare validere schema, hash-/digestkonsistens, faktisk HEAD/tree/worktree, kandidat-/evidencetuple, distinkte reviewer canonical task names/agent IDs, begge reviewer-ID-er ulik `implementerAgentId`, og PASS uten blocker/high. Den kan ikke kryptografisk autentisere Codex-tooloutput og skal aldri påstå slik provenance. Executoren reconciler receiptfeltene/digestene mot toolresultatene den nettopp mottok i samme agenttur. En ytre root-task kan senere auditere transcriptet, men dette er ikke en nødvendig mid-plan handoff eller execution-port.

I Plan 01-16 aktiverer executoren bare `soon_preparation` etter at false-state/preflight-testene er grønne, kjører hele aktiverte testmatrisen og committer deretter kandidaten med flagget true. `candidate` og begge receipts binder denne faktiske aktiverte Git-SHA/tree. Ved review-/toolfeil setter executoren flagget false og verifiserer skjult rollback før reparasjon; en ny true-kandidat får ny SHA og to nye reviewer. Etter dobbel PASS er enhver sourcebyteendring forbudt, så ingen post-review flaggpatch kan ugyldiggjøre PASS.

En byteendring i kode, kontrakt, pack, command evidence eller receipt ugyldiggjør reviewporten. Ved FAIL gjør executoren nødvendige reparasjoner, committer ny SHA og spawner to nye reviewer med nye task names; gamle PASS kan aldri gjenbrukes. Maksimalt tre komplette kandidat/review-forsøk per plan. Etter tredje mislykkede forsøk setter executoren `gateStatus="FAIL_REVIEW_CYCLES_EXHAUSTED"` i candidatefilen, beholder/tilbakestiller `soon_preparation=false` og avslutter teknisk FAIL uten menneskelig port.

Ved vedvarende ekstern kildefeil beholdes siste validerte pakke; uten en slik pakke forblir capability av. Bare faktisk scopeutvidelse, credential/betalt tjeneste eller kostnad over NOK 1 000 går utenfor den autonome fullmakten.

## Plan- og testsporbarhet

| Område | Eierplan | Minimumsport |
|---|---|---|
| Kontrakt, generator, proveniens, lisens, dekning, validator og datapakke | 01-13 | Fixturetester, full refresh, to byte-identiske bygg, offline validator, review A+B |
| Runtime-decoder, D+28–D+42, heuristikker, copy og ren modell | 01-14 | Boundary/golden/property/copy/privacy-tester, review A+B |
| UI, session-only state, fast-hjem- og access-first-orkestrering | 01-15 | Component/session/static privacy/access-tester, capability fortsatt false, review A+B |
| Capability og dynamisk no-leak/E2E | 01-16 | Eksakt kandidat-tuple, full browsermatrise, rollback til false, review A+B |
| Route-migrering | 01-17 | Kun etter grønn 01-16; typed én-gangsroute, høy-risiko regresjoner, review A+B |
| Haptikk, navigasjon og endelig integrasjon | 01-18 | Full tekst/DOM/E2E/CI uten media og to executor-spawnede `fork_turns: "none"` finalreviewer |

## Rollback og fail-closed

- En refresh skriver til midlertidig output og bytter aldri inn en pakke før alle validatorer er grønne.
- Den committede siste validerte pakken kan beholdes ved senere kildefeil; en gammel pakke med annen kontrakt-/rulesetversjon kan ikke brukes.
- Modell/UI behandler ukjent/manglende profil som `unavailable`.
- Capability kan slås av uten å slette pakken eller sessiondata; reload nullstiller sessiondata.
- Route-migrering skjer først etter grønn capability-kandidat og kan reverseres uten å endre regler/data.
- Ingen rollback introduserer runtime klima-API, syntetiske data, nabo-match eller helse-/sikkerhetscopy.
- Hver autonom review-/repairloop stopper etter tre komplette forsøk. Uttømming registreres maskinelt som FAIL og holder capability false; den konverteres aldri til en menneskelig godkjennings- eller gjenopptaksport.

## Kilder

- `AGENTS.md`
- `docs/DECISION-LOG.md` (2026-07-24)
- `.planning/phases/01-planlegg-dagslinjen/01-SNART-AUTONOMOUS-RESEARCH.md`
- `.planning/phases/01-planlegg-dagslinjen/01-UI-SPEC.md`
- `src/data/no-cities.ts`
- [MET seNorge_2018](https://github.com/metno/seNorge_docs/wiki/seNorge_2018)
- [MET seNorge variables](https://github.com/metno/seNorge_docs/wiki/Variables)
- [MET THREDDS temperatur-månedsnormaler](https://thredds.met.no/thredds/catalog/senorge/seNorge_2018/aggregated_products/tg/catalog.html)
- [MET THREDDS nedbør-månedsnormaler](https://thredds.met.no/thredds/catalog/senorge/seNorge_2018/aggregated_products/rr/catalog.html)
- [MET licensing and attribution](https://www.met.no/frie-meteorologiske-data/lisensiering-og-kreditering)
