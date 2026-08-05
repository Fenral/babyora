# Hypotese: FORSKRIVNING — «Fortell meg nøyaktig hva barnet skal ha på»

**Fase 2 (User Reality), Babyora Design Lab. Utarbeidet 2026-08-05.**
**Status: hypotesearbeid, ikke brukerresearch. Analytics er død (audit funn 1) — vi har null brukerdata. Hver påstand er merket (a) belagt i repo/faglitteratur, (b) testbar antakelse, eller (c) ren spekulasjon.**

Denne hypotesen er én av tre konkurrerende JTBD-hypoteser Review-boardet (Sol, REVIDER-verdikt) krever: *forskrivning*, *validering*, *koordinering*. Dagens produkt er bygget 100 % på forskrivning — nummerert plaggliste innerst-til-ytterst, «Finn dagens antrekk», deterministisk motor. Hypotesen er derfor også den farligste: den er den eneste av de tre der bekreftelsesbias kan få oss til å lese produktet som bevis. Det er den ikke. Sol formulerte det presist: «Anbefalingen er en mulig mekanisme, ikke et bevist produkt.»

---

## 1. Hypotesen formulert som jobb

> «Når jeg skal ta barnet mitt ut (eller legge det), og jeg ikke stoler på min egen vurdering av vær × barnets alder × aktivitet, vil jeg ha ett autoritativt, konkret svar — plagg for plagg — slik at jeg slipper å tenke, slipper å tvile, og vet at barnet er trygt.»

Merk hva hypotesen krever for å være sann. Den krever **tre ting samtidig**:

1. Forelderen **mangler** svaret (ikke bare vil dobbeltsjekke det) — ellers er jobben validering.
2. Forelderen **aksepterer autoritet** fra en app fremfor egen/families erfaring — ellers følges ikke svaret.
3. Situasjonen oppstår **ofte nok og lenge nok** til å bære et abonnement — ellers er det et engangs-/sesongprodukt i abonnementsklær.

Punkt 3 er hypotesens akilleshæl, og behandles ærlig i §7.

---

## 2. Hvem har denne jobben? Segmentering

Sols P1-funn står: «Produktet behandler 0–24 måneder som ett problemsegment» — det holder ikke. Forskrivningsbehovet er ikke jevnt fordelt; det er konsentrert i **usikkerhetslommer** definert av *forelderens erfaring* × *barnets fase* × *sesongens nyhet*, ikke av barnets alder alene.

### 2.1 Kjernesegment: førstegangsforelderen med barn 0–6 mnd

- **(a) Fysiologisk belegg for at usikkerheten er reell:** RESEARCH.md dokumenterer at 0–3 mnd har umoden termoregulering, begrenset skjelverespons og høyest overflate/masse-forhold (648 cm²/kg); barnet kan verken kompensere eller si fra. F62-researchen viser at selv fagkildene spriker (LUB 18 °C vs AAP 20–22 °C romtemp; ull innerst vs 40 %-ullintoleranse-regelen fra barnelegehold). Når autoritetene er uenige, er lekfolks usikkerhet rasjonell — det er faktisk vanskelig.
- **(b) Testbar antakelse:** at denne objektive vanskeligheten *oppleves* som daglig usikkerhet av førstegangsforeldre, og ikke løses på dag 3 av helsestasjonen, mor i svangerskapsgruppa eller «+1 lag»-regelen. AAPs eneste eksplisitte regel er «one layer more than adult» (RESEARCH.md kilde 6) — **konkurrenten til hele motoren er en setning på ni ord**. Hypotesen krever at foreldre opplever den setningen som utilstrekkelig. Det vet vi ikke.
- **(c) Spekulasjon:** at usikkerheten topper seg rundt *første tur ut alene* (uke 1–3) og *første kuldeperiode*, ikke jevnt utover.

### 2.2 Sterkt sekundærsegment: den overleverte omsorgspersonen

Delvis-pappa-perm-far (nevnt i PRODUCT.md), besteforeldre, barnevakt. Disse har jobben i **ren form**: de mangler den tause kunnskapen primærforelderen har bygget, de har høy frykt for å gjøre feil *på noen andres vegne*, og de har ingen læringskurve som spiser behovet (de passer barnet episodisk).

- **(c) Spekulasjon, men strategisk viktig:** dette kan være segmentet der forskrivning holder lengst — men det er samtidig segmentet dagens produkt er dårligst rigget for (lokal-only, ingen deling, «Familie»-fanen er i praksis Innstillinger — audit + Sol P2). Hvis intervjuer viser at forskrivningsjobben primært bor *her*, kollapser forskrivning delvis inn i koordinerings-hypotesen, og lokal-only-premisset må utfordres.

### 2.3 Svakt segment: den erfarne forelderen

Barn nr. 2+, eller barn nr. 1 etter første gjennomlevde sesong. **(c) Spekulasjon med sterk prior:** disse har internalisert reglene og har egne heuristikker + erfaring med akkurat dette barnets varmerespons (som motoren ikke kjenner — kalibreringssløyfen er bygget men ikke koblet, audit funn 2). For dem er forskrivning i beste fall bekreftelse, i verste fall en fornærmelse («appen tror ikke jeg kan kle mitt eget barn»). Hvis konsepttester viser at også *disse* foretrekker forskrivning, styrkes hypotesen dramatisk; hvis ikke, er markedet ≈ førstegangsforeldre i første sesong — en mye mindre og mer kortlivet TAM.

### 2.4 Sesong som segmentakse

**(b) Testbar antakelse:** forskrivningsbehovet re-trigges ved hvert *sesongskifte barnet ikke har opplevd før i sin nåværende størrelse/mobilitet* — første vinter, første +25 °C-dag (overopphetingspeak 8–9 mnd er reell fysiologi, RESEARCH.md), overgangen vogn→gående. Det betyr at behovet ikke er en jevn daglig strøm men **pulser**: 2–4 intense vinduer i løpet av 24 måneder, med lange flate perioder imellom. Repoet inneholder allerede et indirekte innrømmelse av dette: eier-override v4 (fingerprint-cache) skiller «Finn dagens antrekk» (nytt svar) fra «Vis dagens antrekk» (kjent svar) — **produktet har selv kodet inn at de fleste dager ikke gir noe nytt svar**. I en stabil norsk januaruke er antrekket det samme mandag til fredag.

---

## 3. Beslutningsøyeblikkene

Hypotesen lever eller dør i konkrete øyeblikk, ikke i «daglig bruk» som abstraksjon. Kandidatøyeblikk (alle (b)/(c) — dette er nøyaktig det 7-dagers-dagbokstudien Sol krever skal kartlegge):

| Øyeblikk | Kontekst | Forskrivningsstyrke | Merknad |
|---|---|---|---|
| Morgenpåkledning før tur/levering | Tidspress, én hånd, halvkledd barn som vrir seg | Høy hvis usikker, ellers null | Tidsbudsjett ~sekunder; 3,2 s seremoni konkurrerer med å bare ta på i går-antrekket |
| Spontan tur («sola kom, vi går ut») | Lavere tidspress, værskifte | Høyest — her er svaret faktisk ukjent | Trolig hypotesens beste øyeblikk |
| Soveleggelse (TOG/romtemp) | Kveld, SIDS-frykt, F62: sovepose-sikkerhet | Høy for 0–6 mnd | Egen sub-jobb; sterkest faglig fundament i repoet |
| Værskifte midt på dagen | Barnet er allerede ute/i barnehage | Lav for forskrivning — dette er *varsling/justering*, ikke ny påkledning | Planlegg-flaten antar denne jobben finnes; ubevist (Sol P2) |
| Kvelden før (pakke sekken) | Planlegging | Middels | «Forberedelse» er en annen jobb enn «forskrivning nå» |
| Overganger i samme tur (bil→vogn→butikk→ute) | Sol påpekte at dette mangler helt | Dagens ett-punkts-modell svarer ikke på den | Hvis dagbokstudien viser at *dette* er smerten, er statisk plaggliste feil form uansett |

**Kritisk observasjon (a, fra repo):** PRODUCT.md hevder «3–8 åpninger per dag». Det tallet er udokumentert — analytics har aldri målt det (audit funn 1). Det er en antakelse som er blitt sitert som fakta. Dagbokstudien må behandle frekvens som helt åpen: kan like gjerne være 0,5/dag.

---

## 4. Emosjonelle behov

- **Frykt, ikke bekvemmelighet, er trolig drivstoffet (b):** For 0–6 mnd er nedsiden asymmetrisk og reell — overoppheting er SIDS-assosiert (F62/AAP), hypotermi-risiko <3 mnd (RESEARCH.md). Sol påpekte at Claude ikke har vurdert risikoasymmetrien; for *denne hypotesen* er den selve motoren: forelderen kjøper ikke en plaggliste, de kjøper **fravær av «tenk om jeg gjør feil»**. Testbart: hvis intervjuer viser at foreldre beskriver påkledning med bekymringsspråk («redd for», «usikker på», «sjekket tre ganger») er hypotesen styrket; hvis de beskriver det med logistikkspråk («mas», «tar tid») er jobben en annen (friksjon, ikke usikkerhet).
- **Sosial dom (c):** Feilkledd barn er offentlig synlig — barnehagen, helsesøster, svigermor og fremmede på trikken har meninger. Forskrivning gir også et *forsvar*: «appen sa det». Ren spekulasjon, men intervjubart.
- **Kognitiv avlastning ved søvnmangel (a for premisset, b for effekten):** PRODUCT.md-premisset «sleep-deprived, cognitive load is high» er plausibelt, men at en app-oppslag er *billigere* kognitivt enn en innarbeidet tommelfingerregel er ubevist — å åpne appen, vente på scan og lese 7 rader er også kognitivt arbeid.
- **Motsatt emosjonelt behov — mestring (c):** Foreldre vil også *føle at de kan dette selv*. Et produkt som permanent forskriver kan undergrave mestringsfølelsen og skape stille aversjon. Valideringshypotesen («du valgte riktig») smigrer; forskrivning instruerer. Dette er testbart i konseptduell.

---

## 5. Barrierer mot at forskrivning følges

1. **Garderobegapet (a for problemet, fra Sol):** En forskrivning på 7 plagg er verdiløs hvis familien ikke eier kombinasjonen — og plaggregistrering er allerede avvist som blindgate. Forskrivning er den av de tre hypotesene som er *mest* sårbar for dette, fordi den lover eksakthet («nøyaktig hva»). Validering slipper unna: den vurderer det du har.
2. **Autoritetskonkurransen (a for at den finnes):** Konkurrenten er ikke en app, men Yr + «+1 lag»-regelen + bestemor + barnehagens beskjed (Sol). For at forskrivning skal vinne må appens svar oppleves som *mer* troverdig enn bestemors — uten fagsignatur (audit funn 7: tersklene «MÅ valideres av helsesøster», Motor 2.0 avslått i påvente av signatur) er det i dag et tonefall-løfte, ikke et faglig løfte.
3. **Selvmotsigelsesrisikoen (a):** Audit funn 5 — Hjem og Finn antrekk kan gi ulikt svar for samme vær (feelsLike-inkonsistens). En forskrivningsautoritet som motsier seg selv én gang er ferdig; validering tåler avvik bedre («innenfor rimelig område» er robust språk, «nøyaktig dette» er skjørt språk).
4. **Barnets egne signaler (a for fysiologien):** Nakketesten er den faktiske fasiten (validert i RESEARCH.md mot PMC-kilde). Appen forskriver ex ante; barnet svarer ex post. Uten koblet feedbacksløyfe (audit funn 2) kan appen aldri lukke gapet — den forblir en engangs-orakelmodell (Sol P1).
5. **Ullintoleranse-forgreningen (a):** 40 % av norske barn tåler ikke ull innerst (F62, barnelege Kvenshagen). En forskrivning som defaulter til ull innerst er direkte feil for nesten halvparten — og onboarding samler i dag navn før beslutningskritiske variabler (Sol P2).

---

## 6. Hva falsifiserer hypotesen

Hypotesen er falsifisert (eller må reduseres til nisje-/sesongjobb) hvis noe av dette observeres:

1. **Dagbokstudien viser at foreldre i de fleste beslutningsøyeblikk allerede har et svar** og bare ønsker bekreftelse → validering vinner. Terskel: hvis >60 % av loggede øyeblikk beskrives som «visste omtrent, ville sjekke» fremfor «visste ikke», er forskrivning feil primærform.
2. **Bruksfrekvensen kollapser med læring:** hvis engasjement hos trial-brukere faller >50 % fra uke 1 til uke 3–4 *uten* korrelasjon med værskifte, spiser læringskurven behovet raskere enn abonnementet rekker å fange verdi.
3. **Follow-raten er lav:** hvis en vesentlig andel anbefalinger ikke kan gjennomføres med garderoben familien eier, eller foreldre systematisk avviker fra listen, følges ikke forskrivningen — da er den lest som *referanse*, ikke *instruks*, og det er valideringsjobben i forkledning.
4. **Erfarne foreldre og flergangsforeldre viser null interesse** i konseptduell → markedet er ett-sesongs-førstegangsforeldre, og abonnementsmodellen (spesielt 299 kr/år mot en ≤24 mnd livssyklus der behovet trolig dør etter 3–6 mnd) er feilkonstruert.
5. **Blindtesten feiler:** hvis motorens råd i scenariopanel mot uavhengige fagpersoner avviker uten forsvarlig begrunnelse, kan produktet ikke etisk *forskrive* — da må det nedgraderes til veiledende («innenfor/utenfor rimelig område»), som igjen er validering.
6. **Handoff-funnet:** hvis intervjuer viser at primærforeldre klarer seg med heuristikker mens usikkerheten primært bor hos sekundære omsorgspersoner, er kjernejobben koordinering, og forskrivning bare dens innmat.

---

## 7. Betalingsvilje — og når forskrivning slutter å være verdt noe

### 7.1 Hvordan betalingsvilje henger på hypotesen

Betalingsvilje for forskrivning er en funksjon av **opplevd usikkerhet × opplevd nedside × tillit til avsender**. Alle tre er høyest i uke 0–12 med første barn. Det gir en brutal implikasjon: **betalingsviljen topper før produktet har rukket å bevise seg** — nøyaktig det Sols P0 om hard paywall påpeker fra motsatt kant. Forelderen kan først vurdere kvaliteten etter turer ute i variert vær; hard paywall etter én anbefaling selger altså på frykt-toppen, ikke på demonstrert verdi. Det kan konvertere godt (b — målbart) og samtidig churne brutalt når usikkerheten avtar, fordi kjøpet aldri var forankret i erfart treffsikkerhet.

- **(b):** Konverteringen bør være høyest hos førstegangsforeldre <6 mnd og ved sesongskifte; hvis trial-brukere som opplevde ≥1 reelt værskifte i trial-uken konverterer signifikant bedre enn de med stabil væruke, er «forskrivning ved endring» driveren — og trial-lengden bør garantere et værskifte (7 dager gjør ikke det).
- **(c):** Prisarkitekturen 39/99/299 antar jevn varig verdi. Hvis behovet er pulsbasert (§2.4), er riktigere former trolig sesongpass («Første vinter», «Første sommer»), engangskjøp, eller livstid-for-barnet — Sol har allerede flagget at tre planer kan komplisere et ubevist kjøp.

### 7.2 Når slutter forskrivning å være verdifullt — ærlig vurdering

Dette er hypotesens strukturelle problem, og det må sies rett ut:

1. **Læringskurven er selvdestruerende (b, delvis a):** Produktet lærer bort sitt eget innhold. Reglene er lærbare — motoren er 9 temperaturbånd + modifikatorer, og bransjens hele visdom komprimeres til «+1 lag», nakketest og en TOG-tabell som får plass på en kjøleskapsmagnet. En forelder som følger appen gjennom én vinter *kan* vinteren. Sol listet dette eksplisitt blant ubeviste antakelser («at produktet ikke lærer brukeren så godt at behovet faller»). Et godt forskrivningsprodukt gjør seg selv overflødig; spørsmålet er bare om det tar 3 uker eller 8 måneder — og det tallet avgjør hele forretningsmodellen. Ingen i repoet vet det.
2. **Stabil værperiode dreper daglig relevans (a, fra egen kode):** Fingerprint-cachen («Vis dagens antrekk») dokumenterer at uendret vær = uendret svar. I stabile perioder er produktets ærlige daglige leveranse «samme som i går» — det er ikke abonnementsverdig i seg selv.
3. **Barnet vokser ut av forskrivning i to trinn:** fysiologisk ved ~9–12 mnd (voksen-lik termoregulering, RESEARCH.md — risikoen som driver frykten forsvinner) og atferdsmessig mot 18–24 mnd (barnet har meninger om egne klær; forskrivning møter en 2-årings veto).
4. **Restverdien etter læring er kantene, ikke hverdagen (c):** værskifte, reise til annet klima, sesongdebut, nytt barn (reset av kalibrering, ikke av kunnskap), overlevering til andre. Det er reelle verdier — men de ligner mer på et *sikkerhetsnett man sjelden trenger* (validering/varsling) enn på en daglig forskrivningstjeneste.

**Konklusjon på §7:** Hvis hypotesen er sann, er den trolig sann som **intens, kortvarig, gjentakende puls** — ikke som jevn daglig jobb. Det er forenlig med et godt produkt, men ikke automatisk med dagens hard-paywall-abonnement. Ærligste posisjon: forskrivning kan være **inngangsjobben** (den som skaper nedlastingen og de første ukenes intense bruk), mens varig verdi må komme fra noe annet — validering ved usikkerhet, varsling ved endring, eller handoff til andre omsorgspersoner. Dagens produkt satser alt på inngangsjobben og priser den som en varig jobb.

---

## 8. Forholdet til de to konkurrerende hypotesene

Forskrivning er ikke gjensidig utelukkende med validering/koordinering — trolig er de **faser av samme livsløp**: forskrivning (uke 0–12 / første sesong) → validering (etter læring: «er dette innenfor?») → koordinering (når andre overtar beslutningen). Hvis fase-2-researchen bekrefter dette forløpet, er det riktige produktspørsmålet ikke «hvilken hypotese er sann» men «kan én produktform gli mellom dem» — og det er et fase 3-spørsmål med mandat til å forkaste dagens rene forskrivningsform, slik Sols verdikt krever.

## TESTBARE ANTAKELSER
- Usikkerhets-prevalens: I en 7-dagers dagbokstudie rapporterer >=50 % av førstegangsforeldre med barn <6 mnd reell usikkerhet ('visste ikke hva barnet skulle ha på') i minst 3 av 7 dager. Falsifisert hvis <30 % — da er påkledning et friksjonsproblem, ikke et usikkerhetsproblem, og forskrivning er feil jobb.
- Forskrivning vs validering-preferanse: I konseptduell (forskrivende plaggliste vs 'sjekk antrekket mitt'-validering vs delbar handoff-plan) velger >=40 % av kjernesegmentet forskrivning som førstevalg. Falsifisert hvis validering vinner klart i alle segmenter — måles per segment (førstegangs <6 mnd, erfaren, sekundær omsorgsperson), aldri aggregert.
- Læringskurve-hastighet: Bruksfrekvens hos trial/nye brukere faller <30 % fra uke 1 til uke 4 kontrollert for værstabilitet (krever aktivert analytics). Falsifisert hvis fallet er >50 % uten værskifte-korrelasjon — da spiser læring behovet raskere enn abonnementet fanger verdi.
- Frekvens-premisset '3–8 åpninger/dag' (PRODUCT.md, aldri målt): Median faktiske åpninger per aktiv dag er >=2. Falsifisert hvis median <1 — da er hele 'daglig følgesvenn'-rammen og abonnementslogikken bygget på et dikta tall.
- Follow-rate/garderobegap: >=70 % av viste anbefalinger kan gjennomføres med plagg husholdningen faktisk eier (måles i dagbok/intervju: 'eide du alt på listen?'). Falsifisert hvis >30 % av øktene strander på manglende plagg — forskrivningens eksakthetsløfte kollapser da til referanse.
- Autoritetsaksept: I scenariotest der appens råd avviker fra egen magefølelse/bestemors råd, følger >=50 % appen. Falsifisert hvis flertallet overstyrer — da er produktet de facto validering uansett hva UI-et later som.
- Faglig blindtest: Motorens råd matcher uavhengige fagpersoners vurdering (helsesøster/barnelege-panel) i >=90 % av et definert scenariosett uten sikkerhetsrelevante avvik. Falsifisert ved lavere match — produktet kan da ikke etisk forskrive og må omformuleres til veiledende område.
- Værskifte som betalingsdriver: Trial-brukere som opplever >=1 reelt værskifte (temperaturbånd-bytte) i trial-perioden konverterer signifikant bedre enn brukere med stabil væruke. Falsifisert hvis ingen forskjell — da er 'forskrivning ved endring' ikke kjøpsutløseren, og trial-lengde/paywall-timing mister sitt designrasjonale.
- Sesongpuls: Re-engasjement (returning after >=14 dagers fravær) klynger seg rundt meteorologiske sesongskifter og barnets faseoverganger (vogn→gående). Falsifisert hvis frafall er permanent uten sesong-retur — da finnes ingen puls å prise, kun engangslæring.
- Sekundæromsorgsperson-lokalisering: I separate handoff-intervjuer (Sol-krav: ikke bland med primærforeldre) rapporterer partnere/besteforeldre høyere beslutningsusikkerhet enn primærforeldre etter barnets første 3 mnd. Hvis bekreftet, bor forskrivningsjobben hos mottakeren av en overlevering — og kjernejobben er koordinering, ikke forskrivning.

## BEVISHULL
- Faktisk bruksfrekvens og frekvensforløp over tid er umålbart i dag: PostHog kompileres bort uten nøkkel, 15 av 20 events fyres aldri (audit funn 1). '3–8 åpninger/dag' i PRODUCT.md er en usitert antakelse, ikke måling.
- Ingen kvalitative data finnes overhodet: null kontekstintervjuer, null dagbokstudier, null konsepttester. Alle segmentpåstander i denne analysen (hvem som har jobben, når usikkerheten topper) er hypoteser til Sols krevde studier er gjennomført.
- Læringskurvens hastighet — hvor mange uker/måneder før en forelder har internalisert reglene — kan ikke avgjøres fra repo eller faglitteratur; det finnes ingen studier på foreldres læring av påkledningsheuristikker. Dette tallet avgjør forretningsmodellen og må måles longitudinelt.
- Motorens faktiske treffsikkerhet er umålt: tersklene er ikke helsefaglig signert (audit funn 7), ingen blindtest mot fagpersoner er gjort, og 'korrekt anbefaling' er ikke engang definert operasjonelt (Sols poeng om at suksess observeres subjektivt, forsinket og konfundert).
- Garderobedekning i norske husholdninger (eier folk plaggene motoren forskriver?) er ukjent, og plaggregistrering er avvist som løsning — gapet mellom perfekt anbefaling og faktisk garderobe er udokumentert.
- Betalingsvilje og prisfølsomhet er rene gjetninger: 39/99/299 er ikke datadrevet (Sol P0), trial-trakten har aldri vært målt (trial_started fyrer kun for yearly), og ingen konverterings- eller churndata eksisterer.
- Autoritetshierarkiet i norske familier (app vs helsestasjon vs bestemor vs barnehage) er uutforsket — hvem foreldre faktisk stoler på ved uenighet kan bare avgjøres ved intervju/felttest, ikke resonnering.
- Fordelingen av beslutningsøyeblikk (morgen vs spontan tur vs soveleggelse vs overganger i samme tur) er ukjent; dagens ett-punkts ute/inne-modell kan være for grov (Sols overgangs-funn), men ingen data viser hvilke øyeblikk som dominerer.

## DESIGNIMPLIKASJONER
- Onboarding: Hvis forskrivning er jobben, må beslutningskritiske variabler (vogn/bæresele, ullintoleranse — 40 % av norske barn, kjent varm/kald-tendens) samles FØR navn og varme; navn-først-onboardingen er i dag optimalisert for emosjonell binding, ikke for forskrivningspresisjon (Sol P2 bekreftet av denne analysen).
- Resultatskjermen må bære autoritet den i dag ikke har dekning for: faglig avsender/signatur, kontrolltegn (nakketesten som ex post-fasit), varighetsgrenser (maks 30 min ute <3 mnd) og et ærlig usikkerhetsrom — en nummerert liste uten dette kommuniserer større sikkerhet enn kunnskapsgrunnlaget tåler.
- Én normalisert værkontrakt er en forutsetning for hele hypotesen: en forskrivningsautoritet som gir ulikt svar på Hjem og Juster for samme vær (audit funn 5) er diskvalifisert som autoritet; dette må fikses før noen brukertest av forskrivning gir tolkbare data.
- Garderobegapet trenger en designløsning mellom ytterpunktene full plaggregistrering (avvist) og ingen tilpasning: hvert plaggrad bør ha en lett 'eier ikke → nærmeste trygge alternativ'-vei; forskrivning uten denne degraderes til referanse i praksis.
- Paywall og trial: hvis hypotesen er sann som puls, må trial garanteres å dekke minst ett værskifte (7 kalenderdager gjør ikke det) og verdi må kunne observeres over flere turer før betalingskrav — hard paywall etter én anbefaling selger på frykt-toppen og er både etisk og churn-messig feil timet (i tråd med Sols P0).
- Prisarkitektur: pulsbasert behov peker mot sesongpass ('Første vinter'), engangskjøp eller barn-livstid fremfor tre løpende abonnementsplaner; 299 kr/år mot en livssyklus der kjernebehovet kan dø etter én sesong er en strukturell mismatch som fase 6 må teste, ikke arve.
- Design for graduation: produktet bør planlegge sin egen overflødighet — en eksplisitt glidning fra forskrivning (full liste) til validering ('innenfor området') etter målt læring, i stedet for å late som behovet er konstant; dette gjør også churn til en designet exit med gjenkjøpspunkter (ny sesong, nytt barn, handoff).
- Hjem-flatens seremoni: 3,2-sekunders scan er bygget for å iscenesette forskrivningsautoritet; hvis fase 2 viser at jobben er validering eller at frekvensen er lav, mister seremonien sitt rasjonale — den må stå på REMOVE/KEEP/TEST-listen Sol krever, ikke behandles som låst.
- Hvis forskrivningsjobben viser seg å bo hos sekundære omsorgspersoner, må lokal-only-premisset og 'Familie'-fanens tomhet re-åpnes: forskrivningens mest betalingsverdige form er da en delbar, kortfattet plan (kobling til koordineringshypotesen), ikke en privat skjerm hos den mest erfarne forelderen.