# Hypotese: VALIDERING — «Verifiereren»

**Fase 2 (User Reality), Babyora Design Lab. Hypotesearbeid — null brukerdata (analytics er død, jf. audit funn 1). Hver påstand er merket (a) belagt i repo/faglitteratur, (b) testbar antakelse, eller (c) ren spekulasjon.**

## 1. Hypotesen i én setning

Forelderens egentlige jobb er ikke «fortell meg hva barnet skal ha på», men **«bekreft at det jeg selv har valgt er trygt og fornuftig — og si fra hvis det ikke er det»**. Babyora er i dag et orakel (vær inn → én nummerert fasitliste ut); Verifiereren snur retningen: forelderen kommer med et kandidat-antrekk, appen dømmer det mot et trygt område og gir ett konkret justeringsforslag pluss ett kontrolltegn.

**Belegg for at hypotesen fortjener behandling (a):**
- Sols REVIDER-verdikt løfter den eksplisitt som alternativ retning («Verifiereren», `sol-review-svar.md`), og lister som utfordret premiss både «at foreldre ønsker autoritet mer enn de ønsker bekreftelse og et sikkerhetsnett» og «at de ønsker en forskrivende plaggliste fremfor en rask validering av det de allerede har valgt».
- **Tone/produktform-dissonansen:** PRODUCT.md sin egen tone-doktrine sier «Never patronizing — parent knows their child best, app supports judgment». Merkevaren har altså allerede valideringsfilosofi, mens produktformen (nummerert fasitliste, 3,2 s orakel-seremoni) er forskrivende. Verifiereren er den produktformen tonen alltid har lovet.
- F62-forskningen underminerer «én korrekt liste»: ~40 % av norske barn tåler ikke ull innerst (Kvenshagen/barnelegeforening) — familiens legitime valg varierer, og et fasit-orakel som anbefaler ullbody er direkte feil for nesten halvparten. En validator håndterer dette naturlig fordi input er familiens faktiske plagg.
- Garderobeproblemet (Sol: «en perfekt anbefaling er verdiløs hvis familien ikke eier kombinasjonen»; garderoberegistrering allerede avvist som blindgate): validering er per definisjon mellompunktet Sol etterlyser — input er det forelderen står med i hånden, som alltid finnes i garderoben.

## 2. Hvem — segmenter og deres valideringsbehov

| Segment | Valideringsbehov | Merking |
|---|---|---|
| **Førstegangsforeldre, barn 0–6 mnd** | Høyest. Umoden thermoregulering hos barnet (RESEARCH.md), umoden heuristikk hos forelderen. Søvn/TOG-valg bærer SIDS-angst — validering av soveantrekk er sannsynligvis det emosjonelt tyngste enkeltøyeblikket. | (a) fysiologi; (b) at angsten faktisk søker validering |
| **Delvis-perm-far / sekundær omsorgsperson** | Validerer ikke primært mot fysiologi, men mot *den andre forelderens standard*: «ville mor godkjent dette?» Appens verdikt er ryggdekning. | (c), testbar via intervjuer |
| **Erfarne foreldre / barn nr. 2** | Episodisk: første kuldeperiode, hetebølge (overheating-peak 8–9 mnd, PMC12386404), sykt barn, ny sesong. Daglig validering er overflødig for dem. | (b) |
| **Besteforeldre/handoff** | Validering som sosial beskyttelse: «appen sa det var greit» flytter ansvar. Kobler mot Sols Omsorgshandoff-retning. | (c) |

Skjult prinsipal (c, viktig): valideringen kan like gjerne rettes mot *sosial dom* som mot barnet — den norske kulturelle sanksjonen mot «for tynt kledd barn» (kommentarer fra fremmede, barnehagen, svigermor) er en velkjent trope. Hvis dette stemmer, er jobben «ingen skal kunne si jeg kledde barnet feil», og verdiktet må være *siterbart*, ikke bare følt.

## 3. Når — beslutningsøyeblikkene

1. **Ved døren, barnet allerede halvkledd** — 10–30 sekunders vindu, én hånd, ofte hansker (PRODUCT.md). Kandidat-antrekket eksisterer allerede; spørsmålet er «er dette nok/for mye?». (b)
2. **Kvelden før / leggetid** — soveposevalg mot romtemperatur. TOG-tabellene finnes allerede i repo (RESEARCH.md, F62). Høyest innsats, lavest tidspress. (a på fagunderlag, b på at øyeblikket søker app)
3. **Værskifte/sesongovergang** — heuristikken fra forrige uke er utdatert; usikkerheten kommer tilbake episodisk. (b)
4. **Handoff** — «jeg har lagt frem dette til barnehagen/besteforeldre, er det riktig?». (c)

## 4. Emosjonelle behov

- **Bekreftelse og selv-efficacy:** verdiktet «du hadde rett» bygger mestringsfølelse, mens et orakel som overstyrer bygger avhengighet eller trass. (c, forankret i selvbestemmelses-/mestringslitteratur som retning, ikke bevist for dette domenet)
- **Samvittighet/skyldfrihet:** grønt lys er en kvittering forelderen kan legge fra seg bekymringen med. Betalingsdriveren er forsikringslogikk — man betaler for fravær av tvil, ikke for informasjon. (c)
- **Frykt for å feile som forelder:** asymmetrisk — frykten for *underkledning i kulde* (synlig, sosialt sanksjonert) vs. den medisinsk farligere *overkledningen* (SIDS-koblet, RESEARCH.md). En validator som kjenner denne asymmetrien kan korrigere det foreldre systematisk gjør feil (for mange lag av angst) — det er en genuin, forskningsbelagt verdi et rent orakel ikke leverer like tydelig. (a på fysiologien, b på at foreldre faktisk overkler av angst)

## 5. Hva modellen krever av produktet

**Garderobeinput — den kritiske barrieren.** Full garderoberegistrering er avvist (a, Sol + eierhistorikk). Minimum levedyktig input: kanoniske lag-chips (body/ullbody → mellomlag → dress/jakke → lue/votter/pose), forhåndsutfylt med motorens egen gjetning slik at forelderen bare *korrigerer avvik* i stedet for å beskrive fra null. Terskel: hvis median inputtid énhåndsbetjent overstiger ~15 sekunder, dør modellen i døråpningen. (b, konkret målbar)

**Motoren må få en invers modus:** `evaluate(antrekk, vær, kontekst) → verdikt + delta`. Repo-avstanden er kortere enn den ser ut (a): motorens 10 evidensmerkede hard blocks + soft blocks *er allerede en validator-kjerne* (de definerer «utenfor trygt område»); Motor 2.0s strukturerte plaggkatalog (ferdigbygget, 100 % avslått i påvente av fagsignatur) er nøyaktig det attributt-vokabularet en isolasjons-scoring trenger; og Juster-drillen (FinnAntrekk) er allerede en manuell inngangsflate — men merk audit funn 5: den beregner føles-som annerledes enn Hjem, og en validator tåler null slik inkonsistens.

**Kontrolltegn må bli kjerneleveranse, ikke fotnote:** «Kjenn på nakken» finnes allerede i i18n og er validert mot PMC12386404 (a). Verifiererens kontrakt er verdikt + ett kontrolltegn med tidspunkt («kjenn på nakken etter 10 minutter ute») — det gjør verdiktet etterprøvbart for forelderen selv og senker appens fasit-byrde.

**Feedback-sløyfen vekkes naturlig:** `feedback-store.ts` (kald/passe/varm, ±1 lag bias, guardrails) er bygget men ukablet (a, audit funn 2). Validering før turen og «var det passe?» etter turen er samme sløyfe sett fra to sider — Verifiereren gir den sovende kalibreringen en grunn til å eksistere.

## 6. Orakelansvar og tillit — ærlig vurdering

Sol hevder Verifiereren «reduserer orakelansvaret». **Delvis sant, delvis omvendt:**

- *Redusert:* appen hevder ikke lenger at én korrekt liste finnes (utfordret premiss #2 hos Sol), den slipper garderobekonflikten, og den stiller seg *ved siden av* forelderen (co-pilot) i stedet for over (orakel) — i tråd med egen tone-doktrine. (a på premissene, c på effekten)
- *Skjerpet:* et grønt lys er en **sertifisering**, og sertifiseringsfeil er verre enn anbefalingsfeil. En validator som sier «greit» til et underkledd barn i −12° tar over ansvaret i nøyaktig det øyeblikket forelderen selv tvilte — «appen sa det var greit» er en farligere setning enn «appen foreslo noe annet». Falsk trygghet-asymmetrien Sol etterlyste risikomodell for blir *mer* akutt, ikke mindre. Konsekvens: fagsignaturen (audit funn 7, lanseringsblokker) blir viktigere i denne modellen, fordi rødt/gult/grønt-tersklene er eksplisitte sikkerhetspåstander. Verdiktspråket må være intervallbasert og aldri absolutt («innenfor det trygge området for kort tur», aldri «riktig»), og hard blocks (søvnsikkerhet, nyfødt-kuldegrense) må forbli absolutte og udiskutable.
- *Drift tilbake til forskrivning:* hvert gult/rødt verdikt må si hva som skal endres — som er en mini-forskrivning. Ærlig syntese: Verifiereren er sannsynligvis ikke en erstatning av motoren men en **inversjon av inngangen** over samme motor («valider først, foreskriv delta»). Det gjør hypotesen billig å teste: samme regelverk, ny interaksjonsmodell. (b)

**Seremonikonflikt (a→b):** den låste 3,2 s scan-seremonien er bygget for orakelrollen («Babyora tenker for deg»). En validator belønnes for *hastighet på verdiktet* — forelderen står ved døren og vil ha ja/nei. Hvis validering er kjernejobben, er seremonien feil kontrakt for denne flaten (Sols P2 om seremonien forsterkes).

## 7. Betalingsvilje

- **For:** forsikrings-/trygghetsprodukter bærer abonnement bedre enn informasjonsprodukter — man betaler for fravær av tvil. Verdien av validering *oppleves umiddelbart* (lettelse ved grønt lys), mens forskrivningens kvalitet først kan observeres etter turen — det svekker delvis Sols P0 om at hard paywall utløses før verdi kan observeres. (c/b)
- **Mot:** et grønt hakemerke kommodifiseres — gratisalternativene (partner, mammagruppe på Facebook, barnehagens beskjed, egen tommelfingerregel) er sterke, og Sol påpeker at konkurrenten ikke er en app. Verre: validering *lærer forelderen raskere* enn forskrivning (selv-efficacy bygges for hvert bekreftede valg) → naturlig behovsfall → «graduation»-churn akselererer. Abonnementet 39/99/299 kr passer dårlig; **sesongpass («første vinter») eller livsfasepris** matcher jobbens faktiske levetid bedre. (b, prisbar i test)
- Betalingstoppen ligger sannsynligvis hos førstegangsforeldre 0–6 mnd + første vintersesong, og faller bratt derfra. (b)

## 8. Barrierer og falsifisering av hypotesen

**Barrierer:** (1) inputfriksjon énhåndsbetjent — hovedrisiko; (2) vokabulargap mellom foreldres plaggord og motorens katalog; (3) verdikt-tynnhet — «betale for et grønt hakemerke» kan oppleves som for lite produkt; (4) juridisk/tillitsmessig sertifiseringsansvar; (5) akselerert selvutlæring.

**Hypotesen er falsifisert hvis:** flertallet av reelle beslutningsøyeblikk starter *uten* kandidat-antrekk («aner ikke»-modus); eller foreldre i prototype konsekvent hopper over valideringsinput og trykker «bare gi meg svaret»; eller inputtiden ikke kan presses under énhånds-terskelen; eller valideringsverdikt oppleves som *mindre* troverdige enn lister (vinglete i stedet for støttende). Alle fire er målbare uten lansering — dagbokstudie + Wizard-of-Oz-prototype dekker dem, og faller sammen med Sols allerede-bindende krav om dagbokstudie og tre JTBD-hypoteser.

## 9. Konklusjon

Verifiereren er den av de tre JTBD-hypotesene (forskrivning/validering/koordinering) som (a) allerede er lovet av merkevarens egen tone, (b) løser garderobeproblemet strukturelt i stedet for å omgå det, (c) gjenbruker mest av eksisterende motor-maskineri (hard blocks, Motor 2.0-katalog, feedback-store), og (d) er billigst å teste fordi den er en inngangsinversjon, ikke en motorutskifting. Dens to eksistensielle risikoer er inputfriksjonen ved døren og at et sertifiserende grønt lys *skjerper* — ikke reduserer — kravet til helsefaglig signatur. Den bør ikke antas sann: den bør stå som likestilt kandidat i dagbokstudien, med de falsifiseringstersklene som er definert over.

## TESTBARE ANTAKELSER
- Kandidat-antrekk-andelen: I en 7-dagers dagbokstudie (Sols krav) registreres for hvert påkledningsøyeblikk om forelderen HADDE et konkret kandidat-antrekk før de søkte støtte. Hypotesen styrkes hvis ≥60 % av øyeblikkene starter med kandidat; falsifiseres hvis <40 % (da er jobben forskrivning, ikke validering).
- Inputfriksjon: Med chip-basert lag-input forhåndsutfylt fra motorens gjetning måles median tid til fullført antrekksbeskrivelse, énhåndsbetjent på mobil. Terskel: ≤15 sekunder median og ≤10 % avbrudd i input-steget; over dette er valideringsmodellen ubrukelig i dør-øyeblikket.
- Modus-preferanse: A/B-prototype (Wizard-of-Oz, ingen kodeendring i motor) med «Sjekk antrekket» vs. «Finn dagens antrekk» som primær-CTA på identisk værgrunnlag. Falsifiseres hvis >50 % av validerings-armen aktivt bytter til «bare gi meg svaret» innen tre bruk.
- Verdikt-tillit: Etter simulert bruk måles selvrapportert trygghet (før/etter-skala) og tillit til appen i begge moduser. Hypotesen krever at intervallbasert verdikt («innenfor trygt område» + kontrolltegn) skårer minst likt med nummerert fasitliste; falsifiseres hvis verdiktet systematisk oppleves som «vinglete» eller mindre kompetent.
- Betalingsramme: Van Westendorp / valgeksperiment med tre innramminger — måneds-abonnement (dagens), sesongpass «første vinter», engangskjøp. Hypotesen om forsikringslogikk falsifiseres hvis validerings-innramming ikke gir høyere aksepterte prispunkter enn liste-innramming hos førstegangsforeldre 0–6 mnd.
- Sertifiseringsrisiko/blindtest: Motorens rød/gul/grønn-verdikter på et definert scenariosett sammenlignes blindt med minst to uavhengige fagpersoner (Sols krav gjenbrukt). Falsifiseres som trygg modell hvis appen gir grønt der fagperson gir rødt i ETT ENESTE scenario — nulltoleranse på falsk trygghet.
- Segmentgradient: Kontekstintervjuer på tvers av Sols tre segmenter (ikke-mobil baby / overgang / mobil smårolling, førstegangs- og erfarne) må vise at valideringsbehovet er sterkest hos førstegangsforeldre 0–6 mnd og episodisk hos erfarne; hvis behovet er flatt eller omvendt, er segmentmodellen i denne rapporten feil.
- Selvutlæring/churn: I dagbok- eller lengre pilotperiode måles om andelen «appen bekreftet det jeg allerede visste»-svar stiger uke for uke. Hypotesen om akselerert graduation styrkes ved stigende trend; da er abonnement feil prismodell og sesongpass må testes.

## BEVISHULL
- Ingen data på om foreldre faktisk søker bekreftelse fremfor svar — analytics er død (audit funn 1), så selv grunnfrekvensen av appåpninger og Juster-bruk er ukjent. Alt om beslutningsøyeblikk hviler på dagbokstudien som ikke er gjennomført.
- Den sosiale dommen-mekanismen (validering mot svigermor/barnehage/fremmede, ikke mot fysiologi) er ren kulturell spekulasjon — kan bare avgjøres gjennom kontekstintervjuer, ikke fra repo eller litteratur.
- Om et grønt verdikt bærer betalingsvilje over tid (forsikringslogikk) eller kommodifiseres mot gratis alternativer (partner, mammagrupper) kan ikke avgjøres uten pristest med reelle brukere.
- Foreldres faktiske plaggvokabular vs. motorens katalog — vokabulargapet er umålt; chip-taksonomien kan ikke designes ferdig uten å observere hvordan foreldre selv beskriver antrekk.
- Sekundær-omsorgsperson-hypotesen (far-i-perm validerer mot primærforelders standard) er udokumentert; Sols krav om egen handoff-studie adskilt fra primærforeldre står uinnfridd.
- Falsk trygghet-asymmetrien: hvor foreldre legger ansvaret når et app-godkjent antrekk viser seg feil («appen sa det var greit») er uobservert — dette avgjør om Verifiereren reduserer eller skjerper tillitsrisikoen, og kan ikke avledes fra kode.
- Om intervallbaserte verdikter oppleves som ærlighet eller inkompetanse i akkurat dette domenet er uavgjort — generell UX-litteratur om usikkerhetskommunikasjon finnes, men ingenting for påkledning av spedbarn.
- Selvutlæringstakten (hvor raskt validering gjør forelderen selvhjulpen) er umålt og avgjør hele prismodellen.

## DESIGNIMPLIKASJONER
- Hjem inverteres: primær-CTA blir «Sjekk antrekket» med lag-chips forhåndsutfylt fra motorens egen gjetning (forelderen korrigerer avvik, beskriver ikke fra null); «Finn dagens antrekk» (fasitlisten) degraderes til fallback for aner-ikke-øyeblikk. Begge moduser deler samme motor — dette er en inngangsinversjon, ikke motorutskifting.
- 3,2-sekunders scan-seremonien er feil kontrakt for validering: verdiktet må komme nær-øyeblikkelig (forelderen står ved døren). Seremonien kan eventuelt overleve i forskrivnings-fallbacken, men det låste eiervedtaket om seremoni på hver ny beregning må reforhandles hvis validering blir kjernejobb.
- Resultatflaten bytter fra nummerert fasitliste til verdikt + intervall + delta + kontrolltegn: «Innenfor det trygge området for en kort trilletur. Blir dere ute over en time: ta med votter. Kjenn på nakken etter 10 minutter.» «Kjenn på nakken» (finnes i i18n, fagvalidert mot PMC12386404) promoteres fra fotnote til kjerneleveranse.
- Onboarding prioriterer beslutningskritiske variabler foran navn (i tråd med Sols P2): ullintoleranse-spørsmål er obligatorisk (40 % av barn, F62) fordi en validator må respektere familiens reelle plagg; navn kan komme senere.
- Paywall-innramming skifter fra «riktig antrekk hver dag» til «trygghet før dere går ut»; trial må gi nok validerte turer i variert vær til at verdiktkvaliteten kan observeres (adresserer Sols P0 om at hard paywall utløses før verdi kan vurderes). Sesongpass («første vinter») testes som alternativ til dagens tre abonnementsplaner.
- Verdiktspråket blir intervallbasert og aldri absolutt; rød/gul/grønn-terskler er eksplisitte sikkerhetspåstander, så helsefaglig signatur (audit funn 7) blir hardere lanseringsblokker i denne modellen enn i orakel-modellen. Hard blocks (søvnsikkerhet, nyfødtgrenser) forblir absolutte og kan aldri overstyres av kalibrering.
- Feedback-sløyfen (feedback-store.ts, bygget men ukablet — audit funn 2) kables: validering før tur + «var det passe?» etter tur er samme sløyfe, og gir den sovende kalibreringen eksistensberettigelse med eksisterende guardrails (maks ±1 lag).
- Vær/kontekst-kontrakten må normaliseres først (audit funn 5: Juster og Hjem beregner føles-som ulikt) — en validator tåler null selvmotsigelse, siden hele produktet ER dommen; dette er en forutsetning, ikke en forbedring.
- Handoff-forlengelse: et verdikt er naturlig delbart («godkjent-lapp» til besteforeldre/barnehage) og bygger bro til Sols Omsorgshandoff-retning — men krever at lokal-only-premisset utfordres, så det holdes som separat beslutning.