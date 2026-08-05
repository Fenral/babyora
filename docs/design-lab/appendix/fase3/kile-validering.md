# ADVOKATSAK: «Kandidatvalidering ved døren» som Babyoras inngangskile

> Fase 3 (Challenge the Brief), 2026-08-05. Rolle: advokat for én av fire kandidatkiler (Sols krav: fase 3 MÅ velge én inngangskile og si hva som ikke er primærjobben). Merking: (a) belagt i repo/dokumenter, (b) testbar antakelse, (c) spekulasjon. Trukne tall (overopphetingstopp 8–9 mnd, ~40 % ull-intoleranse) brukes ikke. Ingen kodebasert bruksmåling omtales som brukerbevis — analytics er død (audit funn 1).

## 1. Kilen i én setning

Forelderen har allerede valgt et antrekk og står ved døren; Babyora dømmer det mot et trygt område og svarer med **verdikt + delta + ett kontrolltegn** («Innenfor trygt område for en kort trilletur. Blir dere ute over en time: ta med votter. Kjenn på nakken etter 10 minutter»). Hard grense: p75 ≤8 sekunder input, énhåndsbetjent, målt med barn på armen (Sols skjerpede terskel, bindende).

## 2. Hvem og hvilket øyeblikk

**Primær:** førstegangsforelder med barn 0–6 mnd i sin første kuldeperiode. (a) på at fysiologien er reelt vanskelig i denne fasen (RESEARCH.md via 03 §2, S1–S2-kohorthypotesen — kun kohorthypotese, ikke segmentmodell); (b) på at usikkerheten faktisk søker validering fremfor fasit.

**Sekundær:** erfarne foreldre *episodisk* (første kuldeperiode med barn nr. 2, sesongskifte) og sekundæromsorg som validerer mot primærforelderens standard. (b/c). Dette er kilens brede kant: Sols eget aktør×øyeblikk-kart viser at «validere» er et øyeblikk som finnes hos flere aktører samme dag — forskrivning er derimot mest verdifull kun for den uerfarne. (a på at Sol selv felte livsløpssekvensen med nettopp dette argumentet.)

**Øyeblikket:** ved døren, barnet halvkledd, 10–30 sekunders vindu, én hånd. (b — vinterhanske-premisset er SVEKKET i premisslogg #15; bruken kan skje innendørs før avreise, hvilket faktisk *hjelper* kilen: innendørs, bare hender, men fortsatt tidspress.)

## 3. Den sterkeste saken — fem søyler

**Søyle 1 — Merkevaren har allerede lovet det. (a)** PRODUCT.md-tonen er eksplisitt: «Never patronizing — parent knows their child best, app supports judgment.» Dagens produktform (nummerert fasitliste, 3,2 s orakelseremoni) motsier dette løftet. Kandidatvalidering er den produktformen tonen alltid har beskrevet. Ingen annen kile lukker denne dissonansen; forskrivning forsterker den.

**Søyle 2 — Den løser garderobeproblemet strukturelt, ikke som patch. (a på problemet, b på løsningen)** Sols garderobekrav er hevet til ≥90 % kategoriekvivalens eller umiddelbar substitusjon — en brutal terskel for forskrivning, som må gjette hva familien eier. Validering snur bevisbyrden: input ER det forelderen står med i hånden, som per definisjon finnes i garderoben. Forskrivning må bestå 90 %-testen; validering slipper å ta den. Det gjelder også de ull-avvikende familiene (behov modellert som toleranse-/preferansevalg etter runde 2, ikke prevalens): en validator respekterer familiens faktiske plagg uten å trenge et prevalenstall.

**Søyle 3 — Den vinner der ni-ords-regelen taper. (b)** Forskrivningens eksistensielle risiko (03 §1) er at konkurrenten er «ett lag mer enn deg selv» — gratis, null input. Men regelen gir *ingen dom over ditt konkrete valg* i grensetilfellene der tvilen faktisk oppstår: vind + fukt + vognpose + varighet. Valideringsøyeblikket er nøyaktig der heuristikken slutter å svare. Og motorens reelle faglige innhold — 10 evidensmerkede hard blocks, konfliktregler, `finalizeSafety` (a, audit §1) — er allerede en *dommer*, ikke en liste: hard blocks definerer «utenfor trygt område». Kilen bruker motorens sterkeste, mest evidensnære del som kjerneleveranse i stedet for å gjemme den bak en liste.

**Søyle 4 — Verdien oppleves i kjøpsøyeblikket. (c, prisbar)** Sols P0 mot hard paywall var at tillit ikke kan opptjenes på én anbefaling — forskrivningens kvalitet observeres først *etter* turen. Et verdikt gir derimot umiddelbar lettelse (grønt lys) eller umiddelbar konkret hjelp (delta), *før* turen. Forsikringslogikk — betale for fravær av tvil — er den innrammingen som best kan bære betaling i denne kategorien. Dette er spekulasjon inntil pristest, men det er den eneste av de fire kilene der verdiøyeblikket og betalingsøyeblikket kan falle sammen.

**Søyle 5 — Den er billigst å falsifisere. (a)** Dette er en inngangsinversjon over samme motor, ikke en motorutskifting: `evaluate(antrekk, vær, kontekst) → verdikt + delta` gjenbruker hard/soft blocks direkte, Motor 2.0s plaggkatalog (ferdigbygget, avslått i påvente av fagsignatur) er attributt-vokabularet en slik scoring trenger, og FinnAntrekk er allerede en manuell inngangsflate. Feedback-sløyfen (`feedback-store.ts`, bygget men ukablet — audit funn 2) får eksistensberettigelse: validering før tur og «var det passe?» etter tur er samme sløyfe. Merk regelen: motor-tilstedeværelse er IKKE brukerbevis — det er kun et kostnadsargument for testing, aldri et behovsargument.

## 4. Hvorfor betalbar

- Innramming: «trygghet før dere går ut», ikke «riktig antrekk hver dag». (c)
- Prisarkitektur: kilens ærlige levetid er en sesong/livsfase — **sesongpass («første vinter») testes likestilt med abonnement** i Van Westendorp/valgeksperiment (premiss #7 er alt ÅPEN på dette). Validering lærer forelderen raskere opp (selv-efficacy per bekreftet valg) → abonnement passer dårligere enn for forskrivning; å late som noe annet ville være et skjult hull Sol feller. (b)
- Betalingstopp: førstegangsforeldre 0–6 mnd i første kuldeperiode; bratt fall derfra. (b)

## 5. Hva kilen krever av produktet — konkret

**Onboarding:** beslutningskritiske variabler foran navn (Sols P2, premiss #13): fødselsdato/korrigert alder-flagg, ull-toleransevalg (uten årsaksantakelse), typisk kontekst (vogn/bæresele/bil). Navn flyttes bakover. Prematuritet rutes til egen scope-/risikohåndtering, adskilt fra JTBD (Sols krav om separat risikomodell).

**Hjem:** primær-CTA inverteres til **«Sjekk antrekket»**. Input = kanoniske lag-chips (innerst/mellom/ytterst/tilbehør) **forhåndsutfylt med motorens egen gjetning** slik at forelderen kun korrigerer avvik — dette er den eneste kjente mekanismen som kan nå p75 ≤8 sek, for å beskrive fra null taper mot null-input-konkurrenten. «Finn dagens antrekk» (fasitlisten) beholdes som fallback for aner-ikke-øyeblikk. 3,2 s-seremonien er feil kontrakt på valideringsflaten — verdiktet må komme nær-øyeblikkelig; dette KREVER reforhandling av eiervedtak v4 for denne flaten (eksplisitt konflikt, se svakheter).

**Resultat:** verdikt + intervall + delta + kontrolltegn erstatter nummerert liste som primærflate. Verdiktspråk alltid intervallbasert («innenfor trygt område for kort tur»), aldri absolutt («riktig»/«trygt» uten kvalifikator). «Kjenn på nakken» promoteres fra fotnote til kjerneleveranse med tidspunkt — det gjør verdiktet etterprøvbart for forelderen selv og senker fasit-byrden. Hard blocks forblir absolutte og kan aldri overstyres av kalibrering.

**Paywall:** beholder hard-paywall-vedtaket (premiss #6, akseptert risiko m/ motkandidatplikt) men reframes: trial må dekke ≥1 værskifte med flere validerte turer, slik at verdiktkvalitet kan observeres før betaling. Motkandidat i test: sesongpass.

**Forutsetning (ikke forbedring):** audit funn 5 — FinnAntrekk setter `feelsLikeC = tempC` mens Hjem beregner føles-som. En validator tåler null selvmotsigelse, for hele produktet ER dommen. Dette må fikses før noen valideringsflate bygges. (a)

## 6. Hva kilen eksplisitt IKKE er — nedprioriterte jobber

1. **Ikke forskrivning som primærjobb.** Fasitlisten degraderes til fallback. Førstegangsforeldre i «aner ikke»-modus betjenes fortsatt — men flaten optimaliseres ikke for dem.
2. **Ikke koordinering/omsorgshandoff i v1.** Et verdikt er naturlig delbart senere («godkjent-lapp»), men deling krever at lokal-only utfordres (premiss #10) og egen handoff-studie (premiss #9). Ut av kilen; inn som ekspansjonshypotese.
3. **Ikke tur- og overgangsplanlegging.** Planlegg/Uke (595 kB, ubevist verdi — premiss #14) fryses funksjonelt; ingen videre investering før kilen er avgjort.
4. **Ikke soveromsvalidering i v1-kilen.** Søvn er høyeste innsats (SIDS-nær) og skjerper sertifiseringsansvaret maksimalt; hard blocks for søvnsikkerhet består i motoren, men kilen markedsfører kun det utendørs dør-øyeblikket inntil fagsignatur foreligger. (Vurdering: å starte der tilliten er dyrest å miste er dårlig sekvensering.)
5. **Ikke barnehagepakking.** Sannsynligvis en annen jobb (pakking/logistikk); avgrenses bort som i 03 §1.

## 7. Minimal testbar versjon

**Trinn 0 — uten kode (dekker Sols bindende studiekrav):** 7-dagers dagbokstudie med kandidat-antrekk-andel per beslutningsøyeblikk (≥60 % styrker; <40 % feller kilen til fordel for forskrivning — premisslogg #3) + Wizard-of-Oz: papir/Figma-chips, stoppeklokke, barn på armen, p75 ≤8 sek-måling, og kalibreringstest med plantede tvilsomme råd (følge korrekte advarsler OG avvise plantede feil — blind lydighet er ikke suksess).

**Trinn 1 — tynn kodeprototype:** chip-inngang over eksisterende `finn-antrekk-calc`-flate + tynn `evaluate()`-wrapper rundt wool-layers (diff mellom kandidat og motorens svar → delta; hard block-treff → rødt). Web-bygg, bak dev-flagg, ingen App Store-endring. A/B: «Sjekk antrekket» vs. «Finn dagens antrekk» som primær-CTA; feller kilen hvis >50 % av validerings-armen aktivt bytter til «bare gi meg svaret» innen tre bruk.

**Port før lansering:** faglig blindtest (≥2 uavhengige fagpersoner, rapportert scenarioantall/konfidens/uenighetshåndtering, nulltoleranse for app-grønn/fagperson-rød) — hardere blokker i denne kilen enn i orakelmodellen, fordi rød/gul/grønn er eksplisitte sikkerhetspåstander. (a på at kravet allerede står i kode-kommentar og premiss #4/#5.)

## 8. Gjenbruk vs. skrot av dagens bygde flater

**Gjenbrukes (a, fra audit):** wool-layers-motoren komplett (hard/soft blocks blir validator-kjernen); Motor 2.0-plaggkatalogen (aktiveres som chip-vokabular — betinget av fagsignatur); FinnAntrekk/Juster-flaten (ombygges fra slidere til chips; føles-som-fiksen først); feedback-store + guardrails (kables endelig); «kjenn på nakken»-i18n; met.no-proxy; Monter-designsystemet uendret; onboarding-skjelettet (omsortert); paywall-infrastruktur (reframet); maskotens «kikker ned»-pose passer faktisk dommerrollen.

**Skrotes/parkeres:** 3,2 s-seremonien på valideringsflaten (krever eiervedtak — v4-fingerprint-maskineriet består ev. i fasit-fallbacken); UkeScreen/Planlegg-investering fryses; CareCircle-preview forblir dev-only; navn-først-onboarding; nummerert liste som *primær*flate (består som fallback og som delta-kilde). Ingenting av motoren skrotes — det er kilens hovedpoeng.

## 9. Ærlige svakheter (utdypet i eget felt)

Se `weaknesses` — de fem alvorligste er inputfriksjonen mot null-input-konkurrenter, sertifiseringsansvaret ved grønt lys, ukjent kandidat-andel, akselerert selvutlæring mot abonnementsmodellen, og at kilen krever reforhandling av to låste eiervedtak (seremoni, ev. paywall-innramming). Saken står og faller med dagbokstudien og p75-målingen — begge er eiervendte (rekruttering), ingen kan avgjøres fra repo.

## KJERNEPÅSTANDER
- (a) PRODUCT.md-tonen («parent knows their child best, app supports judgment») lover validering, mens dagens produktform (fasitliste + orakelseremoni) er forskrivende — kilen lukker en dokumentert dissonans i merkevarens egne dokumenter.
- (a) Motorens hard/soft blocks + finalizeSafety utgjør allerede en dommer («utenfor trygt område»), og Motor 2.0s plaggkatalog er attributt-vokabularet en evaluate()-modus trenger — kilen er en inngangsinversjon over samme motor, ikke en motorutskifting. Dette er et kostnadsargument for testing, IKKE brukerbevis.
- (a) Audit funn 5 (FinnAntrekk bruker rå tempC som feelsLikeC, Hjem beregner føles-som) er en hard forutsetning: en validator tåler null selvmotsigelse fordi hele produktet er dommen.
- (b) Kandidat-antrekk-andel: ≥60 % av beslutningsøyeblikk starter med kandidat → validering er jobben; <40 % feller kilen (premisslogg #3, dagbokstudie).
- (b) p75 ≤8 sek énhåndsbetjent input med barn på armen er oppnåelig KUN med lag-chips forhåndsutfylt fra motorens gjetning (korriger avvik, ikke beskriv fra null) — målbart i Wizard-of-Oz uten kode.
- (b) Validering slipper Sols ≥90 % garderobekrav strukturelt fordi input er plagg familien beviselig har — forskrivning må bestå kravet, validering tar det ikke.
- (b) Kalibreringstest (følge korrekte advarsler OG avvise plantede tvilsomme råd) erstatter autoritetsaksept som suksesskriterium — blind lydighet er ikke suksess.
- (b) Sesongpass («første vinter»-innramming) må testes likestilt med abonnement, fordi validering trolig akselererer selvutlæring og forkorter betalingsvinduet.
- (c) Verdikt-øyeblikket (lettelse/delta FØR turen) lar verdi og betaling falle sammen i tid, i motsetning til forskrivning der kvalitet først observeres etter turen — forsikringslogikk, uprøvd inntil pristest.
- (c) Verdiktet kan rettes like mye mot sosial dom («ingen skal kunne si jeg kledde barnet feil») som mot fysiologi — ren kulturell spekulasjon, kun avgjørbar i kontekstintervjuer.

## SVAKHETER (egeninnrømmet)
- Inputfriksjonen kan være uløselig: konkurrentene er null input (ni-ords-regelen, egen dømmekraft) og en fire-sekunders tekstmelding. Selv 8 sekunder er en kostnad forelderen betaler hver gang; klarer ikke chip-modellen p75 ≤8 sek med barn på armen, dør kilen i døråpningen — og det finnes ingen plan B for input (foto/garderoberegistrering er avvist).
- Grønt lys er en sertifisering, og sertifiseringsfeil er verre enn anbefalingsfeil: «appen sa det var greit» til et underkledd barn i −12° overtar ansvaret i nøyaktig det øyeblikket forelderen tvilte. Kilen SKJERPER kravet til helsefaglig signatur (allerede lanseringsblokker, premiss #4/#5) — den reduserer det ikke. Sols uprøvde antakelse står: at et grønt verdikt kan uttrykkes uten å tolkes som medisinsk sertifisering.
- Kandidat-andelen er ukjent: hvis flertallet av reelle øyeblikk starter i «aner ikke»-modus (<40 %), er jobben forskrivning og hele saken faller. Ingen data finnes — analytics er død og dagbokstudien er ikke gjennomført; alt hviler på en eiervendt studie som krever rekruttering.
- Sols uprøvde kjerneantakelse er ikke besvart: at validering gir BEDRE beslutninger enn forskrivning, ikke bare mer interaksjon. Kilen kan vinne engasjement og tape utfall — kalibreringstesten måler dette, men den er ikke kjørt.
- Akselerert graduation: hvert bekreftede valg bygger forelderens selv-efficacy og spiser behovet. Abonnementsmodellen (39/99/299 kr, hard paywall) passer strukturelt dårlig; sesongpass er uprøvd og krever ny prisarkitektur — kilen utfordrer dermed to låste eiervedtak (3,2 s-seremonien på valideringsflaten og paywall-innrammingen), og eieren kan si nei til begge.
- Vokabulargapet er umålt: foreldres plaggord («den blå fleecen») vs. motorens kanoniske kategorier. Chip-taksonomien kan ikke designes ferdig uten å observere hvordan foreldre faktisk beskriver antrekk — feil taksonomi ødelegger både 8-sekunderskravet og verdiktkvaliteten.
- Verdikt-tynnhet og kommodifisering: «betale for et grønt hakemerke» kan oppleves som for lite produkt mot gratisalternativene (partner, mammagruppe, egen regel). Intervallbaserte verdikter kan dessuten leses som vingling i stedet for ærlighet — uavgjort i dette domenet.
- Delta-svaret er en mini-forskrivning i forkledning: hvert gult/rødt verdikt må si hva som skal endres, og deltaet møter garderobeproblemet igjen (de anbefalte vottene kan ligge i vask). Skillet validering/forskrivning er skarpere i analysen enn det vil være i produktet.
- Erfarne foreldres behov er episodisk (få betalbare øyeblikk per år), og betalingstoppen (førstegangsforeldre 0–6 mnd, første kuldeperiode) er et smalt og selvtømmende marked — kilens brede kant i §2 er hypotese, ikke belegg.