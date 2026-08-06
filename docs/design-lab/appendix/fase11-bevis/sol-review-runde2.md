# Sol — Fase 11 runde 2 — 2026-08-06

Verdikt: REVIDER

Kort tese: De tidligere P0-funnene er løst, og bevispakken er vesentlig mer troverdig. Arkitekturene kan nå vurderes på egne premisser. Tre gjenværende P1-funn hindrer likevel PASS: P3/P4 viser fortsatt operatørkontroller og logg i deltakermodus, P2s sikkerhetsbærende grenseetiketter kolliderer med markøren, og P4 presenterer to konkurrerende handlinger i samme brief.

Verifiserte tiltak: 1) P1 og P2 starter nå direkte i oppgaven uten scenario-, variant- og Williams-kontroller. Faseinndelingen gjør P1 til en faktisk protokoll fremfor en udifferensiert liste.

P1s komplette sløyfe er synlig: påkledning→nakkekontroll→«Alt vel»/«Noe stemmer ikke». Kontrollpunktet har observasjonssted, feilkildeavvisning og konkret stopprespons.

HB-9 er nå synlig som steg 7 før kjøredressen, med riktig sekvenskontekst og stoppkriterium. Det tidligere bevisgapet er lukket.

Utløpt råd har egen tilgjengelighetsstatus, én forklaring, fallback og «Beregn på nytt». «Avvik»-forvekslingen og duplikatet er borte.

P2 tester nå reelle feilplasseringer. Kald kandidat ligger under gulvet, varm kandidat over det inverterte harde taket ved søvn, og årsakskjeden knytter valgt plagg til markørbevegelsen.

Manglende værdata bruker «Kan ikke beregnes», deaktiverte valg, én recovery-handling og separat fallback. Utløpssemantikken er fjernet.

P3s V2 er handlingskomplett: plagg, plassering og kjent baseline står i briefen. Forsinket V1 forkastes synlig, og det ekte utløpsbeviset viser at handlingen er strukturelt fjernet.

P4 dokumenterer nå identitet og semantisk kontinuitet fra brief til protokoll: samme brief, versjon, delta, plagg og kontrollpunkt. Det er ikke lenger bare en lenke uten synlig overgang.

Bevisvakten er en reell kvalitetsforbedring. At skjermdumpen avvises når DOM-tilstanden ikke samsvarer med påstanden, lukker den konkrete feilen fra forrige runde.

Gjenstående P0/P1: Ingen gjenværende P0 i den vedlagte webpakken.

P1 — deltakermodus er ikke ferdig isolert i P3/P4. Første viewport viser «Simulert klokke», spoleknapper og hendelseslogg. Dette er operatørutstyr og kan påvirke tid, oppmerksomhet og forståelse av versjonslogikken. Flytt tidsstyring og logg til separat operatørflate; deltakeren skal bare se oppgaveprompt og produktflaten.

P1 — P2 har kollisjon i begge sikkerhetsytterpunktene. I kaldtilstanden ligger «Deres antrekk», stiplet linje og «Under kaldgulvet» oppå hverandre. Samme problem finnes ved det harde varmetaket i søvnscenarioet. Dette gjør den sikkerhetsbærende grensen delvis uleselig og kan ugyldiggjøre Spenn-avlesningsporten. Gi grenseetikett, terskellinje og kandidatmarkør separate spor; legg til kollisjonstest ved standard og stor tekst.

P1 — P4 har to konkurrerende imperativer. Briefen sier både «Ta på tykt ullsett» og «Legg ull-jakke mellom …». Oppgaven ber om neste handling, men begge kan forsvarlig gjengis. Gjør hierarkiet entydig: «Neste steg: Ta på tykt ullsett» og «Endring senere i protokollen: ull-jakke …», eller velg deltaet som eneste primærhandling. Scoringsfasiten må akseptere nøyaktig det UI-et fremhever.

P2/P3: P2s gjentatte rammer og svært kraftige typografi er funksjonelle i forskningsmodus, men kan gi visuell tretthet og overdrive autoritet. Dette kan itereres etter at forståelsesporten er bestått.

P1s 16 steg er nå tydelige, men arbeidsbelastningen er fortsatt en reell brukerhypotese. Ikke komprimer sekvensen før foreldretesten viser hvor frafall, feil eller protokolltretthet oppstår.

P2s kandidatvalg via sele-prop er akseptabelt for denne runden, men bør få en stabil fixture-ID eller URL-tilstand dersom bevisene skal kunne reproduseres manuelt uten intern kunnskap.

Native troverdighet, reell widgetoppdatering, systemflate-Dynamic Type/VoiceOver og glance-bruk er fortsatt korrekt sperret. Disse er ikke mangler ved webbeviset så lenge de ikke brukes som konklusjoner.

Krav for neste review: 1) Fjern tidskontroller og hendelseslogg fullstendig fra P3/P4s deltakermodus. Automatisering og operatør skal fortsatt kunne styre dem utenfor deltakerens DOM/viewport.

Gjør P2s markør, grenseetikett og terskellinje kollisjonsfrie i både kald- og varmtilstanden, inkludert stor tekst. Generer nye ærlighetsverifiserte bevis for begge.

Reduser P4 til én visuelt primær neste handling og én sekundær deltaopplysning. Oppdater scoringsfasiten og legg til test som feiler dersom to elementer får primær handlingssemantikk.

Kjør test- og bevisvakten på nytt etter disse tre endringene. Dersom de passerer uten regresjon, kan webprototypeloopen få PASS; native-spiken og foreldretesten forblir separate porter.
