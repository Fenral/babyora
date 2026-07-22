---
phase: 01-planlegg-dagslinjen
artifact: snart-rules-evidence
ruleset_version: snart-v1.0-draft
status: pending_approval
created: 2026-07-19
age_scope_months: 0-24
timezone: Europe/Oslo
target_window: D+28 through D+42 inclusive
---

# Snart v1 — konservativt regel- og evidensgrunnlag

## Beslutningsstatus

**Pending. Ingen regel i dette dokumentet er godkjent for produksjon ennå.**

Dette er et pre-code-grunnlag for `Snart`, ikke en implementasjon og ikke en medisinsk retningslinje. Dokumentet avgrenser hvilke råd Babyora kan gi på en forsvarlig og etterprøvbar måte fire til seks uker frem i tid. Det endrer ikke dagens påkledningsmotor, temperaturterskler, sikkerhetsregler, plaggkatalog, Plus-tilgang eller andre appflater.

Før den kanoniske capability-en `soon_preparation` kan settes til tilgjengelig, må alle sju radene i godkjenningsjournalen være godkjent:

1. Produkteier godkjenner produktprinsipp og gruppesemantikk.
2. Produkteier og høy-risiko-fagreview godkjenner de numeriske produktgrensene.
3. Relevant norsk fagperson godkjenner helse-/sikkerhetscopy og avgrensninger.
4. Data-/høy-risiko-reviewer godkjenner klimadatapakken, proveniens og validator.
5. Produkteier og fagreview godkjenner størrelsesnotene.
6. Produkteier og personvernreview godkjenner den session-only/no-persistence-kontrakten for `Har allerede`.
7. En uavhengig høy-risiko-verifikator godkjenner implementasjonen på eksakt kandidat-SHA.

Etter de seks første godkjenningene, men før modellkode eller kandidat-hash, skal dette dokumentet gjennomgå en eksplisitt, ikke-normativ statusovergang: `ruleset_version` blir `snart-v1.0-approved`, `status` blir `approved_for_model_candidate`, beslutningsstatus og regel-/størrelsesannotasjoner peker til de seks daterte bevisene, og delen med uavklarte beslutninger erstattes av et bevisbundet beslutningsreferat. Bare status, revieweridentitet, dato og evidensreferanser kan endres i denne overgangen; triggere, terskler, grupper, copy, kilde-ID-er, input-/resultatskjema og personvernsemantikk skal være uendret. En substansiell endring krever ny planlegging og fersk uavhengig kontroll. `Implementasjon` forblir alene `Pending` til eksakt kandidat er eksternt godkjent.

Inntil da skal fanen være skjult eller vise en sannferdig `unavailable`-tilstand. Den skal ikke vise syntetiske eksempelråd som kan forveksles med personlige råd.

## Formål og ikke-medisinsk grense

`Snart` skal svare på et begrenset spørsmål:

> Hvilke **plaggkategorier kan det være fornuftig å sjekke** før perioden 28–42 lokale kalenderdager fra i dag, basert på barnets alder, fast hjemsted og historisk klima?

Funksjonen skal:

- hjelpe med forberedelse, ikke stille diagnose eller fastsette en sikkerhetsgrense;
- gi kategorier, ikke handlepåbud, merker, produkter eller affiliate-lenker;
- bruke forsiktig språk som `kan bli aktuelt`, `sjekk at dere har`, og `ut fra normalen`;
- skille historisk klimatologi fra et værvarsel;
- forklare usikkerhet og be brukeren kontrollere korttidsvarsel, UV-varsel, passform og barnet nærmere dagen;
- respektere at barn reagerer ulikt, beveger seg ulikt og vokser ulikt;
- aldri gjøre nødvendig sikkerhetsinformasjon avhengig av Plus.

Funksjonen skal ikke svare på om barnet er korrekt kledd i en konkret situasjon. Dagens anbefaling og den eksisterende påkledningsmotoren er fortsatt fasit for den konkrete dagen.

## Kilder og hva de faktisk støtter

Alle kilder ble kontrollert 2026-07-19. Kildene støtter generelle prinsipper. De støtter **ikke** Babyoras eksakte numeriske Snart-grenser; disse er eksplisitt merket produktpolicy og står Pending.

| Kilde | Direkte støtte | Begrensning |
|---|---|---|
| [Helsenorge: Sikkerhet for nyfødte og små barn](https://www.helsenorge.no/forstehjelp/sikkerhet-for-sma-barn/) | Barn blir raskere kalde enn voksne; vind øker kulderisiko; klær tilpasses aktivitet; lag-på-lag; romslige klær/sko; dekk hode/hals; økt oppmerksomhet ved omtrent −10 til −15 °C, særlig med vind. | Gir ikke en handleliste, sesonggrense eller fire–seks-ukers prediksjon. |
| [Helsenorge: Solbeskyttelse – barn og sol](https://www.helsenorge.no/sykdom/hud-og-har/solbeskyttelse-barn-og-sol/) | Spedbarn under ett år bør ikke være i direkte sol; barn 1–3 år beskyttes hovedsakelig med klær, solhatt og solbriller; UV-varsel må sjekkes. | Temperatur og kalendermåned kan ikke brukes som erstatning for UV-varsel. |
| [DSA: Solbeskyttelse i skoler og barnehager](https://www.dsa.no/sol-og-solarium/solbeskyttelse-i-skoler-og-barnehager) | Barn trenger ekstra solbeskyttelse; klær og hodeplagg beskytter; følg UV-varsel. | Underbygger ikke en bestemt solsesong eller solhatt fra en bestemt dato. |
| [DSA: Kva slags klede gir best solbeskyttelse?](https://www.dsa.no/sol-og-solarium/kva-slags-klede-gir-best-solbeskyttelse) | Klær kan gi god UV-beskyttelse; beskyttelsen varierer med stoff, vev, farge og om plagget er vått. | Babyora kan derfor ikke love UV-beskyttelse bare ut fra generisk plaggnavn. |
| [1177: Att klä barn för att vara ute](https://www.1177.se/Stockholm/barn--gravid/att-ta-hand-om-barn/praktiska-rad-i-vardagen/att-kla-barnet-for-att-vara-ute/) | Offentlig svensk helseinformasjon: klær avhenger av alder, vær og aktivitet; flere tynne lag; fukt kjøler; yngre/stillesittende barn trenger annen tilpasning; våte plagg byttes. | Sekundær nordisk støtte. Norske kilder har forrang ved konflikt. |
| [MET: Hva er en klimanormal?](https://www.met.no/vaer-og-klima/ny-normal-i-klimaforskningen) | En klimanormal er et 30-årsgjennomsnitt som beskriver typisk klima på et sted. | En normal er ikke et konkret værvarsel og kan ikke love hva som skjer i målperioden. |
| [MET: Klimadata](https://www.met.no/vaer-og-klima/sesongvarsel/klimadata) | MET bruker normalperioden 1991–2020 for temperatur og nedbør i dagens klimafremstilling. | Sesongoversikt er grov og må ikke presenteres som lokal dagsprognose. |
| [MET Locationforecast 2.0](https://api.met.no/weatherapi/locationforecast/2.0/documentation) og [datamodellen](https://docs.api.met.no/doc/locationforecast/datamodel.html) | Locationforecast dekker omtrent ni dager; mellomlangt varsel bruker ensembledata. | De ni dagene kan ikke strekkes, kopieres eller interpoleres til D+28–D+42. |
| [MET: Spørsmål og svar om sesongvarsel](https://www.met.no/vaer-og-klima/sesongvarsel/sporsmal-og-svar) | Lang horisont er sannsynlighetsvarsling; sesongvarsling er særlig usikker i våre områder; temperatur er generelt sikrere enn nedbør. | V1 bruker ikke sesongvarsel til konkrete plaggpåstander. |
| [Frost API: historiske vær- og klimadata](https://frost.met.no/howto.html) og [Climate normals-endepunktet](https://frost.met.no/reference) | METs arkiv gir tilgang til kvalitetssikrede daglige/månedlige observasjoner og klimanormaler med kilde-/periodeproveniens. | Ingen ny runtime-API-avhengighet er godkjent. V1 krever en forhåndsbygget, versjonert datapakke. |

## Samsvar med dagens produksjonsmodell

Snart velger planleggingskonsepter, ikke nye motorplagg. Konseptene må kunne spores til eksisterende produksjonsroller:

| Snart-konsept | Eksisterende rolle/kategori | Eksempler som finnes i dagens katalog | Begrensning |
|---|---|---|---|
| `snart.base_layer` | `base_fullbody`, `base_top`, `base_bottom` / `innerst` | body, teknisk undertøysett, ullsett, T-skjorte, bukse | Snart velger ikke materiale eller eksakt variant. |
| `snart.mid_layer` | `mid_fullbody`, `mid_top`, `mid_bottom` / `mellomlag` | mellomlag i ull eller fleece | Materialpreferanse og konkret vær avgjøres senere av motoren. |
| `snart.weather_shell` | `shell_fullbody` / `yttertoy` | regndress, vinddress | Historisk nedbørsrisiko kan bare begrunne beredskap, ikke si at det vil regne. |
| `snart.insulated_outer` | `insulated_fullbody` / `yttertoy` | lett/varm kjøredress eller vinterdress | Eksakt variant avhenger av situasjon, aktivitet og konkret vær; aldri anbefal tykk dress i bilstol. |
| `snart.cold_headwear` | `headwear` / `ekstra` | tynn lue, lue, balaklava | Snart velger ikke varmegrad eller sier at balaklava er nødvendig. |
| `snart.handwear` | `handwear` / `ekstra` | tynne/varme votter, regnvotter | Konkret type avgjøres nærmere dagen. |
| `snart.sun_hat` | `headwear` / `ekstra` | solhatt | Solhatt erstatter ikke skygge eller kontroll av UV-varsel. |
| `snart.sun_covering` | `base_*` / `innerst` | lette, dekkende klær | Ingen generell UPF-påstand uten dokumentert plaggdata. |

Kildekode kontrollert uten endring:

- `src/lib/clothing-engine-v2/age.ts` støtter 0–24 måneder og beskriver aldersgrenser som produktgrenser.
- `src/lib/clothing-engine-v2/types.ts` har eksplisitte roller og materialealternativer, inkludert ull, fukttransporterende syntet, fleece, bomull, skall og syntetisk isolasjon.
- `src/lib/clothing-engine-v2/catalog.ts` inneholder eksisterende varianter for innerlag, mellomlag, skall, isolert yttertøy, hode, hender og føtter.
- `src/data/garment-category.ts` grupperer dagens plagg i `innerst`, `mellomlag`, `yttertoy`, `ekstra` og `utstyr`.
- Legacy-tabellene har konkrete temperaturgrenser som selv sier at de må fagvalideres. De er ikke faglig evidens for Snart og skal ikke kopieres ukritisk.

## V1-inndata

Alle felt valideres før en regel kjøres. Ukjent eller ugyldig verdi skal gi `unavailable`, ikke et standardråd.

| Felt | Krav | Bruk |
|---|---|---|
| `asOfLocalDate` | Gyldig `YYYY-MM-DD` | D0 for kalenderregning. |
| `timezone` | Eksakt `Europe/Oslo` i v1 | Hindrer DST- og dagsskiftfeil. |
| `birthDate` | Gyldig lokal fødselsdato | Beregner hele måneder på hver dato i målperioden; aldri aldersbasert klesstørrelse. |
| `homePlaceKey` | Fast hjemsted, ikke løpende telefonposisjon | Slår opp én godkjent klimaprofil uten posisjonshistorikk. |
| `climateProfile` | `valid`, versjonert og proveniensmerket 1991–2020-profil | Eneste langhorisont-værgrunnlag i v1. |
| `alreadyHaveConceptIds` | Mengde av stabile Snart-konsept-ID-er | Lettvektsvalget `Har allerede`; ikke en garderobedatabase. |
| `currentSizeLabel` | Valgfri, behandles som ugjennomsiktig tekst | Kan vises i en forsiktig passformnote; brukes aldri i matematikk. |
| `sizeCheckedAtLocalDate` | Valgfri gyldig lokal dato | Avgjør om størrelsesinformasjon er fersk nok til å omtales. |
| `fitSignal` | Valgfri `roomy | fits | tight | unknown` | Brukerstyrt passformsignal; aldri utledet fra alder eller bilde. |
| `materialPreference` | Eksisterende enum | Sikrer at senere konkret anbefaling ikke bryter brukerens ullpreferanse. Snart-teksten er materialnøytral. |

Ikke-inndata i v1:

- løpende GPS eller barnets posisjon;
- ni-/ti-dagers værvarsel som bevis for målperioden;
- bilder, merke, pris, beholdning, antall plagg eller kjøpshistorikk;
- utviklingsmilepæler som antas fra alder, for eksempel at barnet går;
- medisinske tilstander, diagnose eller individuell temperaturtoleranse.

## Eksakt tidsvindu

La `D0 = asOfLocalDate` i `Europe/Oslo`.

- Første måldato: `D0 + 28 kalenderdager`.
- Siste måldato: `D0 + 42 kalenderdager`.
- Begge ender er inkludert.
- Vinduet har alltid 15 unike lokale datoer.
- Regning skjer med lokale kalenderdatoer, ikke `24 * 60 * 60 * 1000`; overgang til/fra sommertid får derfor ikke duplisere eller hoppe over en dato.
- Barnets alder må være 0–24 hele måneder på **alle** 15 datoer. Hvis vinduet krysser ut av støttet alder, blir resultatet `unavailable` for hele vinduet; v1 lager ikke et delvis råd.
- Brukerrettet periodeetikett viser eksakte datoer, for eksempel `29. august–12. september`, og undertekst `historisk normal, ikke værvarsel`.

## Klimagrunnlag og avledede signaler

### Datapakke

V1 skal ikke ringe Frost eller et nytt klima-API under bruk. En separat, godkjent build-prosess kan lage `snart-climate-1991-2020-v1` fra kvalitetssikrede MET-data. Hver profil må minst ha:

- stabil `profileId`, datapakkeversjon og normalperiode `1991/2020`;
- sted-/stasjon-/rutenettproveniens og lisens;
- metode og kvalitet/status fra en separat validator;
- per lokal kalenderdag historisk `p10` for døgnminimum, `p50` for døgnmiddel og `p90` for døgnmaksimum;
- per lokal kalenderdag historisk sannsynlighet for minst 1 mm døgnnedbør;
- datadekning og antall gyldige år.

Hvis godkjent daglig 1991–2020-data ikke kan produseres for hjemstedet, skal resultatet være `unavailable`. Månedsgjennomsnitt må ikke late som det er en daglig fordeling. En eventuell månedlig fallback krever en ny beslutning og er ikke godkjent her.

### Avledning for de 15 datoene

| Signal | Deterministisk definisjon | Betydning og begrensning |
|---|---|---|
| `coldTailC` | Minimum av de 15 dagverdiene for historisk `p10(døgnminimum)` | Konservativt planleggingssignal for kjølige utfall som historisk har forekommet. Ikke et temperaturvarsel. |
| `warmTailC` | Maksimum av de 15 dagverdiene for historisk `p90(døgnmaksimum)` | Kun kontekst/QA i v1; brukes ikke til å love varme. |
| `expectedWetDays` | Sum av de 15 historiske sannsynlighetene for `døgnnedbør ≥ 1 mm` | Forventningsverdi fra historikk, ikke antall dager det vil regne. |
| `maxSolarElevationDeg` | Maksimal astronomisk solhøyde for hjemstedet blant de 15 datoene | Angir at solbeskyttelse kan bli relevant. Er ikke UV-indeks og erstatter ikke UV-varsel. |

Locationforecast-data kan vises i `Uke` for datoer tjenesten faktisk dekker, men må aldri fylle, ekstrapolere eller overstyre disse Snart-signalene. Sesongvarsel er eksplisitt utelatt i v1 fordi MET beskriver høy usikkerhet i våre områder.

## Resultatmodell og tilstander

### Tre separate tilstander

| Tilstand | Eksakt kriterium | Presentasjon |
|---|---|---|
| `ready` | Alle obligatoriske inndata og klimaprofil er gyldige; minst ett synlig element finnes etter regelkjøring, deduplisering og `Har allerede`-behandling. | Vis eksakte måldatoer, `Ut fra historisk normal`, de tre gruppene i fast rekkefølge og en usikkerhetsnote. Tomme grupper kan vises med `Ingen punkter`. |
| `empty` | Evidensen er gyldig, men ingen synlige elementer gjenstår i noen gruppe. | `Ingenting å forberede akkurat nå.` Hvis alle handlingspunkter er merket `Har allerede`, kan sekundær tekst være `Du har markert det aktuelle som klart.` |
| `unavailable` | Ugyldig/ukjent alder, målperioden går utenfor 0–24 måneder, manglende fast hjemsted, manglende/ugyldig klimaprofil, ukjent tidssone eller regler/datakilde ikke godkjent. | `Vi har ikke godt nok grunnlag for råd fire til seks uker frem.` Ingen plagg, skjulte råd eller påstått eksempelresultat. |

Entitlement-loading er en separat tilgangstilstand og skal ikke tolkes som `unavailable`. Free skal ikke få regelresultatet beregnet og skjult i DOM/logg; Free får bare den godkjente, kontekstuelle Plus-forklaringen.

### Grupper

1. `must_have` → synlig overskrift **Bør ha**.
2. `nice_to_have` → synlig overskrift **Kjekt å ha**.
3. `not_yet` → synlig overskrift **Ikke prioritert nå** med fast forklaring: `Ikke prioritert for denne perioden ut fra historisk normal. Sjekk korttidsvarselet nærmere dagen.`

`Ikke prioritert nå` betyr aldri at plagget garantert ikke blir nødvendig. Regler får bare plassere en kategori her når en sterk historisk hale ligger på den milde siden av grensen. Nedbørs- og solkategorier plasseres aldri her i v1.

## Regelregister

### Felles regelkrav

- Alle numeriske grenser i tabellene under er **produktpolicy-only**. De er valgt for et testbart, konservativt utkast og er ikke medisinske grenser.
- `Bør ha` betyr `sjekk at kategorien er tilgjengelig`, ikke `kjøp nå`.
- Copy skal alltid etterfølges av global note: `Dette bygger på historisk normal, ikke et værvarsel. Sjekk været, aktiviteten og barnet nærmere dagen.`
- En regel kan aldri velge materiale, varmegrad, TOG, spesifikt plagg eller produkt.
- Alle regler har status `Pending` frem til godkjenningene øverst er registrert.

### Temperatur og kulde

| Stabil regel-ID | Eksakt trigger | Gruppe | Konsept/kategori | Forsiktig norsk copy | Rasjonale og kilder | Eksklusjoner | Usikkerhet / godkjenning |
|---|---|---|---|---|---|---|---|
| `SNART-V1-COLD-BASE-001` | `coldTailC <= 10` | `must_have` | `snart.base_layer` / innerst | `Kjølige dager har forekommet ofte nok i denne perioden til at det er lurt å sjekke et lett, justerbart innerlag.` | Lag-på-lag og tørr/varmeregulering støttes av Helsenorge og 1177. | Ingen materialrangering; ingen ullpåstand; ikke søvn/TOG. | Grensen 10 °C og gruppen er produktpolicy-only. `Pending`. |
| `SNART-V1-COLD-BASE-002` | `10 < coldTailC <= 16` | `nice_to_have` | `snart.base_layer` / innerst | `Et lett innerlag kan være nyttig hvis perioden blir kjøligere enn normalt.` | Samme lagprinsipp som over. | Ikke si at kulde er ventet. | 16 °C er produktpolicy-only. `Pending`. |
| `SNART-V1-COLD-MID-003` | `coldTailC <= 5` | `must_have` | `snart.mid_layer` / mellomlag | `Sjekk at dere har et mellomlag som enkelt kan tas av og på.` | Flere tynne lag gjør justering mulig; aktivitet påvirker behovet. Helsenorge og 1177. | Ikke velg ull/fleece; ikke angi antall lag. | 5 °C er produktpolicy-only. `Pending`. |
| `SNART-V1-COLD-MID-004` | `5 < coldTailC <= 10` | `nice_to_have` | `snart.mid_layer` / mellomlag | `Et lett mellomlag kan være fint å ha klart til kjølige dager.` | Helsenorge/1177 støtter justerbare lag, ikke terskelen. | Ingen kjøpsoppfordring. | Produktpolicy-only. `Pending`. |
| `SNART-V1-COLD-MID-005` | `coldTailC > 10` | `not_yet` | `snart.mid_layer` / mellomlag | `Et eget varme-mellomlag er ikke prioritert for denne perioden ut fra historisk normal.` | Dette er en planleggingsfraværsregel, ikke helseråd. | Må ikke vises som garanti; fjernes hvis profilens datakvalitet ikke er godkjent. | Sterk-hale-metode og grense er produktpolicy-only. `Pending`. |
| `SNART-V1-COLD-OUTER-006` | `coldTailC <= 0` | `must_have` | `snart.insulated_outer` / isolert yttertøy | `Sjekk at dere har isolerende yttertøy som kan tilpasses aktivitet og konkret vær.` | Barn blir raskere kalde; vind og aktivitet betyr noe. Helsenorge. | Ingen eksakt dress/varmegrad; aldri bilstolråd; ikke si `trygt`. | 0 °C er produktpolicy-only. `Pending`. |
| `SNART-V1-COLD-OUTER-007` | `0 < coldTailC <= 5` | `nice_to_have` | `snart.insulated_outer` / isolert yttertøy | `Et varmere ytterplagg kan være nyttig hvis perioden blir kjøligere enn normalt.` | Generelt kuldeprinsipp fra Helsenorge; ikke terskelen. | Ikke anbefal vinterdress som eneste løsning. | Produktpolicy-only. `Pending`. |
| `SNART-V1-COLD-OUTER-008` | `coldTailC > 10` | `not_yet` | `snart.insulated_outer` / isolert yttertøy | `Tungt isolert yttertøy er ikke prioritert for denne perioden ut fra historisk normal.` | Planleggingsfraværsregel. | Må ikke skjule at korttidsværet kan avvike; ingen fraværsregel mellom 5 og 10 °C. | Produktpolicy-only. `Pending`. |
| `SNART-V1-COLD-HEAD-009` | `coldTailC <= 5` | `must_have` | `snart.cold_headwear` / hodeplagg | `Sjekk at et hodeplagg som kan tilpasses været er klart.` | Helsenorge peker på ører/hode/hals og vind som relevante i kulde. | Ikke velg balaklava eller varmegrad; ingen løse snorer/skjerf-råd. | 5 °C er produktpolicy-only. `Pending`. |
| `SNART-V1-COLD-HEAD-010` | `5 < coldTailC <= 10` | `nice_to_have` | `snart.cold_headwear` / hodeplagg | `Et lett hodeplagg kan være fint å ha klart til kjølige dager.` | Helsenorge/1177 støtter værtilpasning. | Ikke påstå at barn under ett må bruke lue hele året. | Produktpolicy-only. `Pending`. |
| `SNART-V1-COLD-HAND-011` | `coldTailC <= 5` | `must_have` | `snart.handwear` / håndplagg | `Sjekk at dere har votter som passer situasjonen og ikke sitter trangt.` | Hender er utsatt i kulde; passform og vind betyr noe. Helsenorge. | Ikke velg materiale, vanntetthet eller varmegrad fra klimatologi alene. | 5 °C er produktpolicy-only. `Pending`. |
| `SNART-V1-COLD-HAND-012` | `5 < coldTailC <= 10` | `nice_to_have` | `snart.handwear` / håndplagg | `Et lett par votter kan være fint å ha klart hvis perioden blir kjølig.` | Generelt kuldeprinsipp; terskelen er ikke kildebestemt. | Ikke anta aktiv lek fra alder. | Produktpolicy-only. `Pending`. |

### Nedbør

| Stabil regel-ID | Eksakt trigger | Gruppe | Konsept/kategori | Forsiktig norsk copy | Rasjonale og kilder | Eksklusjoner | Usikkerhet / godkjenning |
|---|---|---|---|---|---|---|---|
| `SNART-V1-WET-SHELL-013` | `expectedWetDays >= 4.0` | `must_have` | `snart.weather_shell` / værbeskyttende ytterlag | `Historikken viser flere våte dager i denne perioden. Sjekk at et værbeskyttende ytterlag er klart.` | Fukt kjøler, og ytterlag brukes for å holde barnet tørt; 1177. Frost/MET gir historisk nedbørsgrunnlag. | Ikke si at det vil regne; ikke velg regndress kontra vognregntrekk; ingen regnvotter uten konkret situasjon. | `≥4 av 15 forventede våtdager` er produktpolicy-only. Nedbør har høy usikkerhet. `Pending`. |
| `SNART-V1-WET-SHELL-014` | `2.0 <= expectedWetDays < 4.0` | `nice_to_have` | `snart.weather_shell` / værbeskyttende ytterlag | `Et værbeskyttende ytterlag kan være nyttig hvis perioden blir våtere enn normalt.` | Samme fukt-/ytterlagsprinsipp. | Ingen `not_yet`-regel for regn; lav historisk verdi utelukker ikke regn. | Produktpolicy-only. `Pending`. |

### Solbeskyttelse

| Stabil regel-ID | Eksakt trigger | Gruppe | Konsept/kategori | Forsiktig norsk copy | Rasjonale og kilder | Eksklusjoner | Usikkerhet / godkjenning |
|---|---|---|---|---|---|---|---|
| `SNART-V1-SUN-HAT-015` | `maxSolarElevationDeg >= 30` | `must_have` | `snart.sun_hat` / solhatt | `Solbeskyttelse kan bli aktuelt i denne perioden. Ha gjerne solhatt klart og sjekk UV-varselet nærmere dagen.` | Helsenorge og DSA anbefaler klær/hodeplagg og kontroll av UV-varsel for barn. | Solhatt erstatter ikke skygge; ingen UPF-påstand; ingen direkte-sol-oppfordring. | 30° solhøyde er kun en produktpolicy for å vise forberedelsesrådet, ikke en UV-grense. `Pending`. |
| `SNART-V1-SUN-COVER-016` | `maxSolarElevationDeg >= 30` | `must_have` | `snart.sun_covering` / lette, dekkende klær | Alder 0–11 mnd: `Spedbarn bør ikke være i direkte sol. Ha lette, dekkende klær klart og prioriter skygge.` Alder 12–24 mnd: `Ha lette, dekkende klær klart, og sjekk UV-varselet nærmere dagen.` | Direkte aldersavgrenset solråd fra Helsenorge; klær støttes av DSA. | Ikke anbefal en bestemt solkrem; ikke hevde at generisk klær har bestemt UPF. | Solhøyde-triggeren er produktpolicy-only; helseordlyden krever faglig kontroll. `Pending`. |

### Bevisst utelatte regler

Følgende er **ikke** v1-regler:

- vindbasert handleliste: ingen godkjent lokal 28–42-dagers vindprofil og terskel;
- sko/vintersko fra alder: alder er ikke bevis på at barnet går, og passform må prøves;
- `overgangsdress`: dette er ikke et eget stabilt produksjonskonsept i dagens V2-katalog;
- eksakt ull/bomull/syntet-anbefaling: konkret materiale avhenger av vær, aktivitet og preferanse;
- frostkrem/ansiktskrem, hals/skjerf, bilstol, søvn, TOG eller vognpose: høyere sikkerhets- og situasjonsavhengighet enn denne planleggingsflaten kan bære;
- generisk `regnvotter` til alle: behovet avhenger av om hendene faktisk eksponeres og av aktivitet;
- utviklingsmilepæler, barnehagestart eller reisebehov utledet fra alder;
- produkt-/butikkforslag og affiliate-lenker.

## Størrelsesnoter — sannsynlighet uten falsk presisjon

Størrelse utledes aldri fra alder, vekstkurve eller et standardisert alder–størrelse-kart. `currentSizeLabel` er en visningsverdi, ikke et tall motoren regner på.

| Stabil regel-ID | Eksakt trigger | Resultat | Kilde/rasjonale | Status |
|---|---|---|---|---|
| `SNART-V1-SIZE-001` | `fitSignal == tight`, `currentSizeLabel` finnes, og `0 <= daysSince(sizeCheckedAtLocalDate) <= 30` | Gruppens fotnote: `Barn vokser ulikt. Hvis {size} allerede sitter trangt, kan neste størrelse bli aktuell før perioden begynner. Sjekk barnets mål og plaggets størrelsesguide.` | Helsenorge sier klær og sko må være romslige nok; for trangt kan gjøre barnet kaldere. Neste størrelse er en mulighet, ikke en prognose. | 30-dagersgrensen og copy er produktpolicy-only. `Pending`. |
| `SNART-V1-SIZE-002` | `fitSignal in {fits, roomy, unknown}`, gyldig/fersk `currentSizeLabel` | Global note: `Størrelse kan endre seg før perioden. Sjekk passformen i {size} nærmere datoen.` | Ingen vekstantakelse. | `Pending`. |
| `SNART-V1-SIZE-003` | størrelse mangler, dato mangler, eller `daysSince > 30` | `Størrelse er ikke anslått. Sjekk dagens passform og plaggets størrelsesguide før eventuelt kjøp.` | Hindrer falsk presisjon. | `Pending`. |

Reglene skal aldri skrive `størrelse 86 om seks uker`, beregne `neste = nå + 6`, rangere merke eller anbefale å kjøpe større `for sikkerhets skyld`.

## `Har allerede`

- Brukeren kan merke et stabilt Snart-konsept som `Har allerede`.
- Valget finnes kun som `alreadyHaveConceptIds` i aktiv Planlegg/Snart-minnetilstand. Det skrives aldri til lokal lagring, URL, logger, analyse eller backend og inneholder ingen `childId`, tidspunkt, bilde, merke, antall eller pris.
- Tilstanden nullstilles når Snart avmonteres, barnet/profilen endres eller D+28–D+42-vinduet endres. Hvert nytt uforanderlig ID-sett sendes inn i den rene modellen; UI filtrerer aldri et allerede bygget resultat på egen hånd.
- Et merket konsept fjernes fra `Bør ha`/`Kjekt å ha` og kan vises i en liten `Allerede klart`-oppsummering.
- Valget endrer aldri dagens anbefalingsmotor og brukes ikke til å anta at hele garderoben er komplett.
- `Har allerede` brukes ikke på `Ikke prioritert nå`.
- Hvis alle handlingspunkter er merket og ingen synlige `not_yet`-konsepter gjenstår, blir tilstanden `empty`, ikke en ny salgsmelding. Hvis minst ett vinnende `not_yet`-konsept fortsatt er synlig, forblir resultatet `ready` med bare disse punktene.

## Deterministisk prioritering og deduplisering

### Gruppeprioritet

`must_have` > `nice_to_have` > `not_yet`.

Hvis flere regler produserer samme `conceptId`, beholdes konseptet bare i høyeste gruppe. Rasjonale og kilde-ID-er slås sammen i stigende regel-ID-rekkefølge. Copy kommer fra den vinnende regelen; ingen tilfeldig eller språkmodellgenerert sammenslåing.

### Stabil konseptrekkefølge

1. `snart.base_layer`
2. `snart.mid_layer`
3. `snart.weather_shell`
4. `snart.insulated_outer`
5. `snart.cold_headwear`
6. `snart.handwear`
7. `snart.sun_hat`
8. `snart.sun_covering`

Innen samme konsept brukes laveste stabile regel-ID som tie-breaker. Samme inndata og samme dataversjon skal gi byte-identisk domenerekkefølge uavhengig av innsettingsrekkefølge, enhetens språkinnstilling og klokkeslett.

### Konflikter

- `not_yet` taper alltid for `nice_to_have` eller `must_have` for samme konsept.
- Solhatt og kaldt hodeplagg er separate konsepter og kan begge vises ved skiftende vår-/høstforhold; copy forklarer ulike formål.
- `weather_shell` og `insulated_outer` er separate funksjoner og kan begge vises. UI skal ikke påstå at ett spesifikt plagg må dekke begge.
- `alreadyHaveConceptIds` filtreres etter deduplisering, aldri før. Et konsept med vinnende `must_have`/`nice_to_have` som er merket, fjernes helt og kan ikke dukke opp igjen via en lavere `not_yet`-regel. Et konsept hvis vinnende resultat allerede er `not_yet`, filtreres aldri av `alreadyHaveConceptIds` og viser ingen `Har allerede`-handling.

## Forbudte påstander

Følgende ordlyd eller logikk blokkerer release:

- `Dette er trygt`, `barnet vil ikke fryse`, `garantert`, eller andre sikkerhetsløfter;
- `du må kjøpe`, `mangler`, `nødvendig` uten den avtalte, forsiktige gruppekonteksten;
- eksakt vær, nedbør, temperatur, dato eller UV fire til seks uker frem;
- å beskrive Locationforecast-data som dekning for D+28–D+42;
- eksakt klesstørrelse eller veksttempo fra alder;
- at ull alltid er tryggere eller at syntet/bomull er uakseptabelt;
- at generiske klær har en bestemt UPF;
- at `Ikke prioritert nå` betyr at plagget umulig blir nødvendig;
- merke-, butikk-, pris- eller affiliateprioritering;
- usynlig råd i DOM, logger eller analysehendelser til en Free-bruker;
- koordinater, barnets navn/fødselsdato, plaggvalg eller `Har allerede` i analysepayload;
- råd om bilstol, søvn/TOG, medisinske tilstander eller behandling;
- å bruke alder som bevis på gange, aktivitet, barnehagestart eller annen milepæl.

## Sporbarhet

Hvert domeneelement må bære:

```text
rulesetVersion
ruleIds[]
conceptId
group
windowStartLocalDate
windowEndLocalDate
timezone
climateProfileId
climateDataVersion
normalPeriod
evidenceSourceIds[]
uncertaintyCode
sizeNoteRuleId?
```

`uncertaintyCode` er én av:

- `HISTORICAL_NORMAL_NOT_FORECAST`
- `PRECIPITATION_HIGH_VARIABILITY`
- `UV_REQUIRES_NEAR_DATE_CHECK`
- `SIZE_REQUIRES_FIT_CHECK`
- `PROFILE_UNAVAILABLE`

Brukerrettet copy skal komme fra versjonerte strenger knyttet til regel-ID. Ingen generativ tekstproduksjon er tillatt i denne funksjonen.

## Minimum testfixtures før implementasjonen kan godkjennes

Alle fixtures fryser `Europe/Oslo`, `rulesetVersion`, klimadataversjon, fødselsdato, D0 og `alreadyHaveConceptIds`.

| Fixture | Inndata/signal | Påkrevd bevis |
|---|---|---|
| `S01-cool-wet-sun` | Gyldig alder; `coldTailC=7`, `expectedWetDays=5`, `maxSolarElevationDeg=35` | `base_layer` Bør ha; `mid_layer`, `cold_headwear`, `handwear` Kjekt å ha; `weather_shell`, `sun_hat`, `sun_covering` Bør ha; ingen `insulated_outer`. |
| `S02-deep-cold` | `coldTailC=-12`, `expectedWetDays=1`, `maxSolarElevationDeg=5` | Base, mellomlag, isolert yttertøy, kaldt hodeplagg og håndplagg i Bør ha; ingen sol- eller regnregel. Global copy sier historisk normal, ikke varsel. |
| `S03-mild-wet` | `coldTailC=12`, `expectedWetDays=6`, `maxSolarElevationDeg=10` | Base Kjekt å ha, skall Bør ha; mellomlag og isolert yttertøy i Ikke prioritert nå; ingen solregel. |
| `S04-warm-sun` | `coldTailC=17`, `expectedWetDays=0.5`, `maxSolarElevationDeg=40` | Solhatt og dekkende klær Bør ha; mellomlag og isolert yttertøy Ikke prioritert nå; ingen base-/regnregel. |
| `S05-owned-empty` | Alle ellers synlige handlingskonsepter i `alreadyHaveConceptIds`, ingen `not_yet` | `empty`, korrekt copy, ingen paywall/ny kjøpsoppfordring. |
| `S18-owned-actionable-with-not-yet` | Alle vinnende `must_have`/`nice_to_have`-konsepter i `alreadyHaveConceptIds`, minst ett annet vinnende `not_yet`-konsept | `ready`; bare `not_yet` er synlig, ingen `Har allerede`-handling på disse punktene, og ingen merket handlingsregel gjenoppstår i lavere gruppe. |
| `S06-missing-profile` | `climateProfile.status != valid` | `unavailable`; ingen regelresultat eller skjult plaggcopy. |
| `S07-unsupported-age` | Barnet er 25 måneder på minst én måldato | `unavailable`; ingen delvis periode. |
| `S08-DST-spring` | D0 slik at D+28–D+42 krysser siste søndag i mars | Eksakt 15 unike lokale datoer; ingen duplikat/hopp. |
| `S09-DST-autumn` | D0 slik at vinduet krysser siste søndag i oktober | Samme invarians som S08. |
| `S10-boundaries` | Separate cases for `coldTailC={0,5,10,16}`, `expectedWetDays={2,4}`, `maxSolarElevationDeg=30` | Inklusive/eksklusive grenser matcher tabellene eksakt. |
| `S11-dedup-order` | Regler levert i reversert og tilfeldig rekkefølge | Identiske grupper, stable concept order og sammenslåtte source IDs. |
| `S12-owned-no-resurface` | Konsept treffes av både høy og lav gruppe og er merket eid | Konseptet dukker ikke opp igjen i lavere gruppe. |
| `S13-size-tight` | Fersk størrelse + `tight` | Kun probabilistisk `neste størrelse kan bli aktuell`; ingen tallberegning. |
| `S14-size-stale` | Størrelsesdato >30 dager | Ingen størrelsesprognose; bare passform-/guidekontroll. |
| `S15-age-solar-copy` | Samme solsignal med alder 10 og 14 måneder | Under ett-års-copy nevner å unngå direkte sol; 12–24-copy gjør ikke en falsk spedbarnspåstand. |
| `S16-no-forecast-leak` | Ni-dagers forecast endres mens klimaprofilen er lik | Snart-domenet forblir byte-identisk. |
| `S17-profile-version` | Samme data med ulik godkjent `climateDataVersion` | Resultatet bærer riktig versjon/proveniens; cache kan ikke gjenbrukes på tvers. |

I tillegg kreves property-/invarianttester for:

- alle støttede datoer og DST-overganger gir 15 måldatoer;
- ingen konsept-ID forekommer mer enn én gang;
- hver synlig rad har minst én stabil regel-ID og kilde-ID;
- ingen output inneholder forbudte ord som `garantert`, `trygt` eller `må kjøpe`;
- alle 0–24-månedersaldre enten gir deterministisk resultat eller sannferdig `unavailable`;
- ukjent enum, NaN, ugyldig dato, feil tidssone eller manglende proveniens feiler lukket;
- Free-tilgang kan ikke materialisere rådgivningspayloaden;
- resultatet endrer ikke dagens motorinput, motoroutput eller plaggkatalog.

## Godkjenningsjournal

| Beslutning | Eier | Status | Bevis som mangler |
|---|---|---|---|
| Produktprinsipp og gruppesemantikk | Produkteier | **Pending** | Eksplisitt godkjenning av `Bør ha`, `Kjekt å ha`, `Ikke prioritert nå`. |
| Numeriske produktgrenser | Produkteier + høy-risiko-fagreview | **Pending** | Gjennomgang av 0/5/10/16 °C, 2/4 våtdager og 30° solhøyde. |
| Helse-/sikkerhetscopy | Norsk relevant fagperson | **Pending** | Dokumentert gjennomgang mot Helsenorge/DSA. |
| Klimadatapakke 1991–2020 | Data-/høy-risiko-reviewer | **Pending** | Reproduserbar byggemetode, lisens, dekning, kvalitetskontroll og profilvalidator. |
| Størrelsesnoter | Produkteier + fagreview | **Pending** | Godkjenning av 30-dagers ferskhet og probabilistisk språk. |
| Personvern for `Har allerede` | Produkteier + personvernreview | **Pending** | Godkjenning av eksakt session-only/no-persistence-kontrakt og kontroll av at ingen analysepayload lekker data. |
| Implementasjon | Uavhengig høy-risiko-verifikator | **Pending** | Tester og PASS på eksakt kandidat-SHA. |

## Uavklarte beslutninger som må løses før koding av Snart

1. Om de foreslåtte numeriske produktgrensene skal godkjennes, justeres eller fjernes.
2. Hvem som er navngitt norsk fagperson for helse-/sikkerhetscopy.
3. Hvordan den forhåndsbygde 1991–2020-klimadatapakken produseres, dekkes geografisk og versjoneres uten ny runtime-integrasjon.
4. Om `currentSizeLabel` og `fitSignal` kan brukes som eksplisitte, session-only modellinndata innenfor godkjent personvern- og faseomfang; ingen av dem eller `Har allerede` kan persisteres i denne fasen.

Avklart presentasjonsbeslutning: intern `not_yet`-semantikk beholdes, mens synlig overskrift er `Ikke prioritert nå`. Denne ordlydsavklaringen godkjenner ikke tersklene eller den øvrige produkt-/helsepolicyen.

Ved manglende godkjenning skal Snart forbli `unavailable`; implementasjonen skal ikke fylle hull med magefølelse, butikkdata eller generert tekst.
