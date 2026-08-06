# Sol — Fase 10 visual review, runde 1 — 2026-08-06

Verdikt: REVIDER

Kort tese: Kodebeviset er sterkt, men skjermbeviset består ikke ennå. To P0-er er direkte synlige: deltakerskjermen domineres av testselen, og bilde 9 dokumenterer ikke den påståtte utløpstilstanden. Retningsgrensene holder bare delvis: P2 er tydelig differensiert, P1 bare i avviksmodus, mens P3 ikke er en komplett beslutningsenhet og P4s overgang ikke er bevist.

P0/P1-funn (per prototype): Felles — P0: I alle tolv bilder ligger scenario, P1–P4/NULL, laboratorieklokke, spolekontroller, Williams-knapp og hendelseslogg i deltakerens flate. På en faktisk 390×844-viewport skyves kjerneproduktet under første skjermhøyde. Bevis: bildene 1–12. Forventet effekt: kunstig høy beslutningstid, laboratoriepriming, lav native troverdighet og mulighet til å omgå tildelt rekkefølge. Anbefaling: bygg en låst «deltakermodus» der operatørkontroller og logg finnes i separat panel/vindu. Første viewport skal vise oppgaveprompt og retningens kjerne.

P1 Protokollen — P1: Normalmodus er visuelt en lang liste med ni handlinger og «bekreft alt» (bilde 1). Kontrollpunkt og avslutning er ikke synlig, og retningen ligner dagens plaggliste uten bilder. Forventet effekt: falsk differensiering og tom bekreftelsesatferd. Anbefaling: grupper i meningsfulle faser som «på barnet» og «i vognen», og dokumenter hele sløyfen etter bekreftelse — særlig faktisk nakkekontroll og respons på «noe stemmer ikke».

P1 Protokollen — P1: Bilstolbeviset viser «Steg 1 av 16», men det synlige sikkerhetssteget gjelder to ullsett ved ekstrem frost, ikke HB-9-regelen som bevispakken fremhever (bilde 2). Forventet effekt: den viktigste mutasjonsbeviste regelen mangler visuelt bevis, mens 16 steg signaliserer høy arbeidsbelastning. Anbefaling: legg ved sekvensbevis som viser HB-9, plasseringen i forløpet, korreksjonsgrenen og avslutningen.

P1 Protokollen — P1: Utløpt tilstand har duplisert tekst, sier både at rådet er utløpt og «Gjelder til 09:30», og bruker «Avvik» som om dette var en aktiv værmodus (bilde 3). Forventet effekt: brukeren kan misforstå et utilgjengelig råd som et gyldig avviksråd. Anbefaling: separer beslutningsmodus fra tilgjengelighetsstatus. Toppteksten skal være «Rådet er utløpt», etterfulgt av én forklaring, fallback og konkret «Beregn på nytt».

P2 Spennet — P0: De viste kandidatene er anbefalingen og plasseres per definisjon midt i spennet (bildene 4–5). Dermed tester prototypen bekreftelse, ikke diagnostisering eller korrigering. Forventet effekt: kunstig høy forståelse og ingen bevis for om brukeren kan handle ved for kaldt eller for varmt antrekk. Anbefaling: dokumenter minst tre forhåndsdefinerte kandidater per relevant tilstand: under gulv, innenfor spenn og over tak. Ingen av dem skal avsløres som «riktig» på forhånd.

P2 Spennet — P1: Spennet er originalt, men avlesningen er svak: stor tom flate, liten «trygt spenn»-etikett og markøren «Deres antrekk» uten synlig forbindelse mellom valgte klær og posisjon (bildene 4–5). Forventet effekt: instrumentet kan leses som måling eller dekorasjon. Anbefaling: gjør årsakskjeden eksplisitt: «Beregnet fra klærne du valgte», vis hva som flyttet markøren, og gjør svakeste premiss mer fremtredende enn sekundær metadata.

P2 Spennet — P1: Ved manglende værdata er instrumentet korrekt maskert, men jobbvalgene forblir aktive og teksten blander «manglende data» med et råd som «gjaldt til 08:20» (bilde 6). Forventet effekt: brukeren kan tro at et tidligere spenn eksisterte eller forsøke å fortsette i en utilgjengelig funksjon. Anbefaling: deaktiver instrumentinteraksjonen, bruk «Kan ikke beregnes» fremfor utløpssemantikk og tilby én gjenopprettingshandling.

P3 Ambient — P0: «Legg til et lag» er ikke en komplett beslutningsenhet for målgruppen. Briefen sier ikke hvilket lag, hvor eller relativt til hvilket faktisk antrekk; baseline er bare gårsdagens temperatur (bildene 7–9). Knappen «Åpne appen (full liste)» bekrefter avhengigheten. Forventet effekt: feilplagg, gjetting eller nødvendig appåpning. Anbefaling: briefen må inneholde en konkret, trygg endring knyttet til kjent antrekksbaseline, eksempelvis «Legg ull-mellomlaget mellom ullsett og dress». Hvis det ikke lar seg gjøre, nedgrader P3 til distribusjonslag.

P3 Ambient — P0: Bevisbeskrivelsen sier at bilde 9 viser «utløp→maskering», men skjermen viser klokken 11:30, gyldighet til 11:45 og et fortsatt aktivt råd. Dette er ikke utløpsbevis. Forventet effekt: bevispakken påstår en tilstand den ikke viser. Anbefaling: erstatt bildet med 11:45 eller senere, synlig maskering og fallback. Revider bildetekstene mot faktiske piksler.

P3 Ambient — P1: V2 endrer versjon og prognose, men beholder samme handling «Legg til et lag» (bilde 8). Forventet effekt: versjonsmaskineriet kan forstås uten at den sentrale endringsjobben testes. Anbefaling: inkluder en sekvens der V2 faktisk endrer eller trekker tilbake handlingen.

P4 Ambient Protokoll — P0: Den påståtte overgangen er ikke vist. Bildene 10–11 stopper før «Åpne hele protokollen», så kontinuitet i briefId, versjon, steg og sikkerhetssemantikk er usynlig. Forventet effekt: P4 kan være en lenke til P1 fremfor en sammenhengende arkitektur. Anbefaling: dokumenter før trykk, første protokollskjerm og kontroll/retur med samme versjon.

P4 Ambient Protokoll — P1: Normal og endret vær viser i praksis P1s første steg i P3s kortform. Endret-vær-briefen uttrykker ikke deltaet (bildene 10–11). Forventet effekt: falsk syntese — Protokollen med widgetdrakt. Anbefaling: briefen må kombinere endringen og første konkrete protokollhandling uten å introdusere en ny anbefaling.

P2/P3-funn: P2: Kontrast, store trykkflater og bruk av mønster i tillegg til posisjon er robuste tilgjengelighetsgrep. Ingen retning er avhengig av farge alene.

P2: Hierarkiet er grensetungt og generisk. Nesten alle elementer har boks eller kraftig strek, slik at sikkerhet, instrument, metadata og laboratoriekontroller konkurrerer visuelt. Forventet effekt: redusert skannbarhet og manglende premium-/nativefølelse. Anbefaling: fjern ikke-semantiske rammer, behold sterke grenser rundt sikkerhetskritiske eller interaktive elementer og bruk typografi/avstand for resten.

P2: Prototypene ser ut som et tilgjengelig webverktøy, ikke en troverdig native app. Det er akseptabelt for logikkverifisering, men utilstrekkelig for å måle premiumfølelse, emosjonell verdi eller native preferanse. Disse målene må sperres til en likt polert deltakermodus eller native spike.

P2: Nullmodellen inkluderer en meldingsoppgave som ikke er synlig parallelt i de andre retningene (bilde 12). Dersom denne inngår i samme tidsscore, er sammenligningen skjev. Bruk oppgavespesifikke nullarmer: påkledning, validering og handoff må ha hver sin sammenlignbare slutt.

P3: Tekststørrelser og berøringsflater ser gjennomgående brukbare ut, men Dynamic Type, fokusrekkefølge, skjermlesersemantikk og 200 % tekst er ikke visuelt bevist. Legg ved egne skjermbevis og automatisert tilgjengelighetsrapport; ikke inferer dette fra standardvisningen.

Differensieringsgrensene holder dermed slik: P1 eier sekvens bare i avviksmodus; normalmodus er foreløpig en flat liste. P2 eier sammenligning/usikkerhet tydeligst, men midtpunktskonstrueringen svekker testen. P3 består ikke kravet om komplett beslutning. P4 kan være riktig komponert i kode, men den nye overgangen er ikke dokumentert visuelt.

Svar på avvik a–e: a. Ikke utvid marginen bare for å få delta-scenariet klassifisert som avvik. Delta og sikkerhetsavvik er forskjellige akser. Men en fast ±1°-margin er utilstrekkelig dersom erklært måleusikkerhet kan krysse terskelen. Bruk maks(hysterese, relevant usikkerhetsbånd); inntil dette er definert bør scenarioet klassifiseres «Følg med», ikke «Vanlig dag».

b. Dagens løsning er feil. Det trengs ikke en fjerde beslutningsmodus; det trengs en separat tilgjengelighetsstatus. Når rådet er utløpt eller datagrunnlaget mangler, skal «Vanlig dag/Følg med/Avvik» erstattes av «Rådet er utløpt» eller «Kan ikke beregnes».

c. Hypotesemerkingen er riktig, men modellen er for selvbekreftende. At anbefalt antrekk alltid står midt i spennet er akseptabelt som intern referanse, men kan ikke være hovedtesten. Test bevisst feiljusterte kandidater. Poeng→grader må ikke brukes som faglig eller sikkerhetsmessig utsagn.

d. Ikke stramt nok. Når en bestemt brief én gang er observert som stale, utløpt, maskert eller revokert, skal den aldri bli autoritativ igjen uten en nyere gyldig versjon. Klokketilbakerulling må ikke reaktivere råd.

e. Endres til nå >= gyldigTil. Et utløpstempel bør representere et halvåpent intervall: rådet er gyldig før tidspunktet, ikke gjennom det. Nåværende regel gir én grensetilstand der et råd merket «til 09:30» fortsatt er aktivt klokken 09:30.

Krav for neste review: 1) Lever deltakerbevis uten testsele, variantknapper, klokkeverktøy eller hendelseslogg. Vis første faktiske 390×844-viewport for alle fem armer.

Rett P1s degraderte hierarki, dupliserte tekst, recovery-handling og utløpsgrense. Legg ved synlig HB-9- og korreksjonssekvens.

Utvid P2-beviset med kald, trygg og varm kandidat samt synlig korreksjon. Behold hard stopp for «appen har målt barnet».

Gjør P3-briefen handlingskomplett eller merk den formelt som distribusjonslag. Erstatt det feilmerkede utløpsbildet og vis V2 som faktisk endrer handling.

Vis P4-overgangen ende-til-ende med samme briefId/versjon før og etter åpning. Endret-vær-varianten må bevise både delta og første protokollhandling.

Gjør stale/revoked monotont og rett >=-grensen før flere visuelle iterasjoner bygger på feil tilstand.

Skill nullmodellene per oppgave og dokumenter hva som inngår i beslutningstiden.

Legg ved en bevismatrise som kobler hvert manifestkrav til skjerm før handling, skjerm etter handling, degradert tilstand, loggutdrag og forventet fasit. 226 grønne tester er sterkt kodebevis, men kan ikke erstatte de manglende piksel- og interaksjonsbevisene.
