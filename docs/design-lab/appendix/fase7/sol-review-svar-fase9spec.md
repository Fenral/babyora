# Sol — Fase 9 prototype-spec, før-implementeringsreview — 2026-08-06

Verdikt: REVIDER

Kort tese: Fire prototyper er forsvarlig fordi maksimal divergens er et eksplisitt eiervalg, men dagens vertikale skive er definert som skjermrekke fremfor komplett beslutningssløyfe. Tre forhold blokkerer byggestart: felles sikkerhets-UI forurenser retningene, testdesignet håndterer ikke læring mellom fire prototyper, og web-widgeten kan ikke bevise H3s viktigste premiss om tidsriktig levering. Dette krever en avgrenset spec-revisjon, ikke ny produktresearch.

P0/P1-funn: 1) P0 — «onboarding→kjerne→degradert» er ikke en vertikal beslutningsskive. Skiven må gå fra utløser→forstått situasjon→første handling→eventuell korrigering→kontroll/avslutning. Degradert tilstand må oppstå som en overgang i samme oppgave, ikke som en separat demoskjerm.

P0 — «identisk sikkerhetslag i farevarsel-anatomi» motsier Protokollens kjernepremiss om at sikkerhetsregler blir steg fremfor bannere. Fellesgrunnlaget skal dele sikkerhetsinnhold, prioritet, stopplogikk og forventet handling — ikke samme komponent, plassering eller informasjonsrekkefølge. Ellers sniker Protokollen eller dagens appmodell seg inn i alle fire.

P0 — felles motoradapter kan gjøre retningene til fire view-lag over én reseptmodell. Adapteren må eksponere nøytrale fakta: kontekst, værgrunnlag, datakvalitet, baseplagg, safety events og gyldighet. Deretter trenger hver retning sin egen eksplisitte transformator: protokollkompilator, hypotetisk spennmodell og brief-/deltabygger. Ingen delt RecommendationViewModel.

P0 — P3s «widget-fetch» kan ikke behandles som bevist leveransemekanisme. WidgetKit bruker tidslinjer, oppdateringsbudsjett og systemstyrt batching; Apple sier uttrykkelig at oppdatering kan skje senere enn ønsket tidspunkt. Web kan teste briefen, men ikke om rådet faktisk kommer eller maskeres tidsnok. Apple om WidgetKit-tidslinjer
 og WidgetKit-strategi

P1 — fire prototyper gir sterk lærings- og rekkefølgeeffekt. Den som ser nullmodellen eller Protokollen først, lærer scenarioet og vil løse Spennet/Ambient raskere. Specen må definere motbalansert rekkefølge, ekvivalente scenariofamilier og separasjon mellom trening og måling.

P1 — identisk onboarding er testforurensning for Ambient, hvis påstand er verdi uten appbesøk. Bygg onboarding én gang som felles scenariooppsett og ekskluder den fra arkitekturens tidsscore. P3 skal starte på brief-flaten; P4 på brief→protokoll. Lik kvalitet krever ikke identisk inngang.

P1 — P2s hypoteseetikett beskytter mot faktisk bruk, men svekker samtidig testen av falsk autoritet. En synlig «hypotese»-merking kan redusere nettopp feillesningen dere prøver å måle. Testen kan derfor måle forståelse og interaksjon, men ikke produksjonsrealistisk tillit. Dette må stå som metodisk begrensning.

P1 — briefId, versjon og utløp er ikke nok til cachekontrakten. Den trenger minst issuedAt, validFrom, expiresAt, supersedes, baselineversjon, scenariofingerprint og eksplisitte regler for offline, forsinkelse, rekkefølgefeil og klokkeavvik.

P2/P3-funn: 1) Onboardingens to felt trenger ikke implementeres fire ganger. Bruk én testsele som setter opp fiktivt barn og scenario; la hver prototype begynne der dens produktløfte begynner.

P1 må vise både normal flyt og avvik, men trenger ikke full navigasjon. Kritisk skive er: system velger modus→brukeren forstår hvorfor→utfører→gjør kontroll→reagerer på stoppkriterium. Regeltabellen må definere prioritet ved kombinasjoner som bilstol + kulde + sovende barn og falle til avvik/ukjent, aldri optimistisk normalmodus.

P2 trenger kandidat-input og responsen på kandidaten. Fire fullt implementerte routerdører er ikke nødvendig for å teste Spennets epistemologi og innfører en separat navigasjonshypotese. Bruk én aktiv «Holder dette?»-oppgave og eventuelt én direkte forskrivningsoppgave som kontrast.

P3 trenger en tidslinje, ikke én widgetmock: baseline V1→endring V2→forsinket V1→utløp→fallback. Bruk virtuell klokke og bevis at eldre versjoner aldri gjenopplives.

P4 trenger brief→komplett første handling→åpning av samme versjon i protokoll→kontrollpunkt. Dersom brukeren må rekonstruere baseline før første handling, har syntesen feilet.

Premiummerking bør ikke være synlig under kjerneoppgaven. Selv nøytral merking kan øke forventet kvalitet og rapportert betalingsvilje. Vis grensen etter oppgaven i en separat verdikartlegging.

Ikke bygg Supabase i denne prototyperunden. Simuler delt kort og distribuerte hendelser lokalt med den planlagte kontrakten. Backendinvestering er først berettiget dersom briefen består forståelses- og selvstendighetsporten.

Antakelser som må bevises: 1) At modusklassifisereren aldri velger normalmodus når konteksten er ukjent eller motstridende. 2) At kontrollpunkt faktisk utføres og ikke bare kvitteres ut. 3) At Spennet forstås som beslutningsområde, ikke måling eller individuell termometri. 4) At brukeren kan beskrive kandidat-antrekk raskt nok til at H2 ikke returnerer beslutningsbyrden. 5) At en brief inneholder nok baseline til trygg handling. 6) At «maskert fordi utløpt» forstås som sikker degradering, ikke teknisk feil. 7) At P4 forbedrer P1/P3 uten å skape versjons- eller kontekstbrudd. 8) At felles tekstinnhold kan uttrykkes arkitekturspesifikt uten semantisk forskjell. 9) At resultatene overlever motbalansert testrekkefølge. 10) At webforståelse overfører til reell låseskjerm og widget. 11) At sikkerhetsfasit og «korrekt første handling» kan scores entydig per scenario. 12) At en forskningsprototyp med fiktive data ikke blir brukt som faktisk påkledningsråd.

Hva Claude ikke har vurdert: Web-simuleringen kan gyldig måle informasjonsrekkefølge, tekstforståelse, oppdagelse av versjon/gyldighet, konseptuell stale-forståelse, tappeflyt og om brukeren kan gjenfortelle neste handling. Med virtuell tid kan den også validere den logiske tilstandsmaskinen.

Den kan ikke validere reell widgetstørrelse og trunkering, systemfonter i alle familier, Dynamic Type, VoiceOver-rekkefølge, låseskjermens personvern, Always-On-rendering, faktisk deep-linking, bakgrunnsoppdatering, cache mellom app og extension, leveringstid, batterikostnad, widgetinstallasjon eller glance-bruk i hverdagen. Apple presiserer også at en widget-extension ikke alltid kjører og derfor ikke kan oppdatere innhold direkte når den ønsker. Apples dokumentasjon om dynamiske widgetdata

Det største metodiske hullet er carryover. Fire retninger og én nullmodell gir fem eksponeringer. Uten randomisering vil den siste prototypen ofte vinne på læring. Samme værscenario kan ikke repeteres ukritisk; forskjellige scenarier kan heller ikke brukes uten dokumentert lik vanskelighetsgrad.

Claude har heller ikke skilt mellom felles semantikk og felles design. Samme komponentbasis kan sikre kvalitet, men kan også fjerne Spennets instrumentkarakter og Ambients OS-karakter. Apple anbefaler blant annet systemtilpasset tilgjengelighet og store tekststørrelser; dette kan ikke representeres tilstrekkelig av én fast web-frame. Apples tilgjengelighetsretningslinjer

Alternative retninger: 1) Bygg én felles eksperimentsele og fire smale beslutningssløyfer fremfor fire mini-apper. Testselen eier scenario, fiktivt barn, logging, klokke, rekkefølge og forskningsdisclaimer. Retningene eier all beslutningspresentasjon.

Del P3/P4 i to bevisnivåer: først webbasert «brief semantics», deretter en minimal native feasibility-spike med én widgetfamilie, én deep link og én utløpstilstand. Native-spiken skal ikke poleres som femte prototype.

Gjør P2 til en ren instrumenttest. Routeren kan ligge som ikke-scorbar ramme eller utsettes. Ellers vet dere ikke om resultatet skyldes Spennet eller jobbvalget.

La P4 komponere de allerede validerte kontraktene fra P1 og P3. Den skal ikke ha en egen variant av protokoll, brief eller sikkerhetstekst; bare overgangen mellom dem er ny.

Krav for neste review: 1) Erstatt skjermdefinisjonen av vertikal skive med én komplett, målbar beslutningssløyfe per prototype og beskriv start, slutt og feilstater.

Del fellesgrunnlaget i semantiske invarianter og retningsspesifikke presentasjoner. Fjern alle delte anbefalings-, safety-card- og fallback-viewmodeller som kan forme arkitekturen.

Lever et eksperimentmanifest per retning: primær hypotese, isolert variabel, aktive oppgaver, forventet korrekt handling, farlige feil, stoppregel, loggede events og hvilke funn prototypen uttrykkelig ikke kan støtte.

Legg inn motbalansert testrekkefølge, scenarioekvivalens og analyseplan for carryover. Nullmodellen må også randomiseres, ikke alltid vises først.

Implementer deterministisk virtuell klokke og hendelsesrekkefølge for P3/P4, inkludert forsinket V1 etter V2, offline, utløp og revokering. Dokumenter at eldre eller ugyldig brief ikke kan bli autoritativ igjen.

Merk alle widget-/låseskjermfunn som enten «gyldig i web» eller «krever native verifisering». Native UX, leveringspålitelighet og stale-timing kan ikke bestå fase 10 på webbevis.

Definer forskningssikkerheten: bare fiktive barn og scenarioer, ingen sanntidsposisjon eller faktisk påkledning, tydelig prototypeinformasjon før oppgaven og logget begrensning på tillitsmålingen.

Fjern premiummerking fra den målte kjerneoppgaven. Kartlegg opplevd betalt verdi etter gjennomført scenario.

Definer ANSI-portens navn, metode, nøytrale spørsmål og kodingsregel. En ledende formulering som nevner «målt barnet» gjør porten ugyldig.

Når disse punktene er skrevet inn og kontrakttestene for classifier, direction adapters og brief-state-maskinen er spesifisert, gis bygging klarsignal.
