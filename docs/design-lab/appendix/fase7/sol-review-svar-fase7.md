# Sol — Fase 7 retningsscoring — 2026-08-05

Verdikt: REVIDER

Kort tese: Dette er tre genuint sterke arkitekturhypoteser, men risikobudsjettene er underrapportert og Ambient er fortsatt i fare for å være Protokollen distribuert på systemflater. Spennet har størst originalitet og størst forståelsesrisiko; Protokollen har størst klarhet og svakest betalingsgrunn; Ambient har størst native- og retensjonspotensial, men bare dersom briefen er en komplett beslutningsenhet. Ingen totalscore kan kompensere for svikt i sikkerhet eller forståelse.

Scoringstabell:

Dimensjon	Protokollen	Spennet	Ambient Briefing
Originalitet	4	5	4
Native UX	4	3	5
Klarhet	5	2	3
Tillit	4	3	4
Emosjonell verdi	3	4	3
Premiumfølelse	3	5	4
Betalingsvilje	2	4	4
Retention	3	4	4
Tilgjengelighet	4	2	4
Differensiering	4	5	4
Uvektet sum	36/50	37/50	39/50

Protokollen får 5 i klarhet fordi arkitekturen oversetter rådet direkte til handling, kontroll og stopp. Den får 2 i betalingsvilje fordi den viktigste verdien er sikkerhetskjernen som etter modell B skal være gratis, samtidig som brukeren kan lære sekvensen og slutte å trenge produktet.

Spennet får 5 i originalitet og differensiering fordi asymmetrisk varmeområde, svakeste premiss og kandidatens posisjon utgjør en annen epistemologi enn «app gir liste». Premiumscoren er potensial, ikke dokumentert utførelse. Klarhet og tilgjengelighet får 2 fordi terreng, asymmetri og premisshåndtak kan kreve mer tolkning enn problemet tåler.

Ambient får 5 i native UX fordi verdien er formet rundt operativsystemets egne flater og korte interaksjoner. Retention får ikke 5: færre appåpninger kan bety høy nytte, men også glemsel, deaktivert widget eller sviktende bakgrunnsoppdatering. Tabellen må derfor ikke brukes som automatisk rangering.

P0/P1-funn: 1) P0 — risikobudsjettene er ikke reelle. Alle tre har minst én skjult modellrisiko i tillegg til oppgitt produkt- og representasjonsrisiko.

P0 — Protokollens skjulte risiko er klassifiseringen mellom «vanlig dag», «følg med» og «avvik». Feil modus kan enten skjule nødvendig informasjon eller påføre normalbruk medisinsk friksjon. Dette er en sikkerhets- og motorbeslutning, ikke bare presentasjon.

P0 — Spennets skjulte risiko er modellvaliditet. Et deterministisk råd blir ikke automatisk et faglig kalibrert intervall fordi UI-et tegner et spenn. Kaldgulv, varmetak, terreng og asymmetri krever egne faglige definisjoner og testkorpus. Ellers er det falsk vitenskapelig presisjon.

P0 — Ambients skjulte risiko er distribuert tilstandskonsistens. Widget, app, varsel og delt kort kan vise ulike versjoner på grunn av caching, offlinebruk og forsinkede oppdateringer. «Identisk brief» er en kontrakt som må bevises teknisk, ikke et designvedtak.

P1 — betalingsvilje er ikke sammenlignbar ennå. Retningene beskriver gratis beslutningsarkitektur, men ikke like presist hva som kjøpes under B. Spennets personalisering og Ambients koordinering ser mer betalbare ut enn Protokollen fordi de implisitt inkluderer premiumjobber. Det skjevfordeler scoringen.

P1 — den degraderte fallbacken «kle etter årstid, kjenn på nakken» kan være for svak når systemet mangler data i krevende forhold. Degradering må kunne ende i «Babyora kan ikke gi råd nå», med konkret neste sikre handling. En konservativ gjetning er fortsatt en gjetning.

P1 — «Protokollen ser været. Du ser barnet.» er en sterk autoritetsgrense, men kan også bli en ansvarsfraskrivelse dersom rådet er for spesifikt. Den må kobles til hva forelderen faktisk skal observere og hva som utløser endring.

P2/P3-funn: 1) Protokollen risikerer protokolltretthet. Kontrollpunkter må være risikostyrte; dersom hvert normalt antrekk får bekreftelsesritual, blir ett trykk raskt tom compliance-teater.

PEWS-inspirasjonen bør ikke eksponeres som medisinsk språk. Kontrollfrekvens er forståelig, men klinisk semantikk kan gjøre normal værusikkerhet til helseangst.

Spennets fire jobb-dører kan bli en ny hovedmeny forkledd som router. «Maks dybde 2» er heller ingen verdi dersom brukeren først må klassifisere sin egen jobb feilfritt.

Kandidat-antrekket forutsetter at brukeren kan beskrive klær raskt og i samme materialtaksonomi som motoren. Ellers måler instrumentet kvaliteten på input, ikke antrekket.

Ambient mangler en stabil definisjon av delta: endring siden siste åpning, siste utsendte brief, siste bekreftede brief eller samme tidspunkt i går gir forskjellige råd. Baseline må være synlig og versjonert.

Mottaksbekreftelse uten identitet beviser at lenken ble aktivert, ikke hvem som har ansvar eller om rådet ble forstått. Ikke kall det closed-loop før forståelse eller eksplisitt overtakelse er testet.

Premium- og emosjonsscorene er foreløpige. Arkitektur kan skape potensialet, men uten de faktiske native skjermene, bevegelsen, typografien og tilgjengelighetstilstandene kan disse dimensjonene ikke endelig bedømmes.

Falsk differensiering: Protokollen og Spennet blir samme produkt dersom Spennet ender med «legg til ett lag og kontroller nakken», mens Protokollen viser den samme lagstabelen og det samme kontrollpunktet. Da er forskjellen bare metafor.

Ambient blir falskt differensiert dersom briefen bare er Protokollens toppkort sendt til widget og varsel. Systemflate er distribusjon, ikke produktmodell. Ambient består kun dersom brukeren kan forstå endringen, handle trygt og oppdage utløp uten å åpne hovedappen.

Spennets router kan dessuten sluke alle tre retningene: «Hva skal hen ha på?» åpner Protokollen, «Holder dette?» åpner Spennet og «Noen andre tar over» åpner Ambient. Da er retning 2 egentlig et navigasjonsskall rundt hele produktet.

For å bevare testbar forskjell må Protokollen eie én anbefalt sekvens, Spennet eie sammenligning og usikkerhet uten å kollapse til én fasit, og Ambient eie en komplett tidsbegrenset beslutning uten appåpning. Brytes disse grensene, tester fase 8 bare tre innganger til samme motorresultat.

Avvisningsgrunner per retning: Protokollen felles dersom systemvalgt modus klassifiserer ett sikkerhetsrelevant scenario feil; dersom kontrollpunktet regelmessig hoppes over; dersom normalbruk tar lengre tid enn nullmodellen uten bedre handling; dersom foreldrene tolker «bekreft» som dokumentasjon på at barnet faktisk er trygt; eller dersom bruken faller fordi sekvensen læres etter få ganger uten en selvstendig betalt jobb.

Spennet felles dersom én vesentlig andel tolker figuren som måling av barnet; dersom beslutningstid eller uro øker mot nullmodellen; dersom brukerne ikke kan plassere kandidat-antrekk raskt; dersom kaldgulv/varmetak ikke kan faglig valideres; dersom tilgjengelig tekstalternativ gir en annen beslutning enn figuren; eller dersom brukeren fortsatt spør «men hva skal jeg faktisk ta på?».

Ambient felles dersom briefen krever at appen åpnes for trygg handling; dersom brukere handler på feil baseline; dersom utløpt maskering tolkes som feil eller tom widget; dersom én flate kan vise en eldre gyldig versjon etter at nyere råd er sendt; dersom bakgrunnsleveransen er for upålitelig; dersom låseskjermen eksponerer sensitiv informasjon; eller dersom mottaksbekreftelsen gir falsk trygghet om ansvarsovertakelse.

Syntesevurdering: Ingen full syntese er dokumentert bedre enn beste rene retning ennå. Å kombinere router, spenn, protokoll, widget og handoff vil sannsynligvis produsere et kompetent, men ordinært superprodukt med høyere læringskostnad.

Den eneste objektivt plausible syntesen er Ambient Protokoll: Briefens handling er første komplette og trygge steg i Protokollen; brukeren åpner appen bare for resten av sekvensen, kontrollpunktet eller begrunnelsen. Ingen router og intet spenn i denne kandidaten. Den kan slå Protokollen på friksjon og retention og Ambient på sikkerhetsfullstendighet.

Spennet bør testes rent. Dets verdi er nettopp å utfordre fasitmodellen; som tillegg til Protokollen blir det lett en avansert «Juster»-flate dere allerede har besluttet å fjerne. Syntese er bare tillatt dersom Ambient Protokoll slår begge rene retninger på korrekt handling og tid uten å tape tillit, stale-forståelse eller tilgjengelighet.

Krav for neste review: 1) Revider risikoregisteret med modellrisiko, klassifikasjonsrisiko, tilstands-/leveranserisiko, atferdsrisiko og forretningsrisiko per retning. «Én + én» skal være kreativt risikobudsjett, ikke full risikobeskrivelse.

Definer betalt jobb likt presist for hver retning under B. Gratisinnholdet må være identisk sikkert; betalingsvilje skal måles på det som faktisk gates.

Test retningene mot samme oppgaver og nullmodell: normal dag, grensevær, sovende vogn, bilstol, manglende værdata, endret vær, utløpt råd, ny omsorgsperson, Dynamic Type og utendørslys.

Gjør sikkerhet og forståelse til ikke-kompenserbare porter. Ingen høy totalscore på premium, originalitet eller retention kan oppveie én systematisk farlig feiltolkning.

Mål korrekt første handling, farlig utelatelse, tid til beslutning, gjenfortelling av svakeste premiss, respons på stoppkriterium, stale-forståelse, opplevd autoritet, uro, return-intent og betalingshandling etter erfart verdi. Preferanse alene er sekundært.

Protokollens tre moduser må få eksplisitte motorgrenser og overgangstilstander. Spennets intervall må få faglig definisjon uavhengig av grafikken. Ambient må få én autoritativ versjons- og cachekontrakt på tvers av alle flater.

Prototypene må ha lik visuell kvalitet, lik mengde forklaring og samme underliggende scenariodata. Test retningene før navnene «Protokollen», «Spennet» og «Ambient» eksponeres; navnene kan styre forventning og tillit.

Ta med bare én syntesekandidat i fase 8: Ambient Protokoll. Den skal konkurrere mot de tre rene retningene og nullmodellen, ikke automatisk arve en plass i sluttproduktet.
