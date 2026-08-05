# Fase 3 — Challenge the Brief: Rivningsrapport

> Utført 2026-08-05 av rivningsagent (Claude, Design Lab fase 3). Mandat: utfordre HELE
> dagens brief fra first principles. Merking: **(a)** belagt (fil/vedtak/kode finnes),
> **(b)** testbar antakelse (protokoll kan defineres), **(c)** spekulasjon.
> Regler fulgt: motor-tilstedeværelse ≠ brukerbevis; ingen kodebasert bruksmåling er
> brukerbevis før analytics er aktiv; ingen overselgende formuleringer.
> Avgrensning mot Sol: Sols runde 2-funn (segmentakser, trukne tall, pappaperm,
> livsløpssekvens, CareCircle m.fl.) gjenbrukes IKKE som egne punkter under — de refereres
> kun der et eget funn bygger videre. Alle 24 antakelser under er nye vinkler.

---

## Del A — 24 utfordrede antakelser

### Onboarding

**A1. «Appen trenger en barneprofil før den kan gi verdi.»**
Motoren nøkler i praksis på aldersbånd + vær + aktivitet; navn og emosjonsfelt er
retorisk innpakning. (a) at profilen kreves før første anbefaling er belagt i flyten;
(c) at profilen øker opplevd verdi er spekulasjon. First principles-alternativet er
null-input: stedstilgang + én aldersglider gir en fullverdig anbefaling på under 10
sekunder. Hvert obligatorisk felt før første verdi er en veddemålsinnsats uten data.
**Test:** A/B time-to-first-value med 2 felt vs. dagens 4 steg; drop-off per steg (krever analytics).

**A2. «Navn-først gir emosjonell binding» har en ubetalt motkostnad: appen ber om barnets navn og viser deretter et fremmed barn (maskoten).**
Premisslogg #13 dekker rekkefølgen; dette er en annen påstand: personaliseringen i
onboarding og avpersonaliseringen på Hjem-flaten drar i hver sin retning. Enten er
figuren «ditt barn» (da åpner det kjønn/hudtone/gjenkjennelses-forventninger) eller en
merkevarefigur (da er navninnsamlingen løsrevet fra flaten den skulle lade). (c) med
testbar kjerne. **Test:** konsepttest der samme anbefaling presenteres med/uten navnebruk
i kombinasjon med maskot; mål opplevd «dette er til mitt barn».

**A3. «Fødselsdato er nok» — onboarding stiller ingen scope-spørsmål.**
Motoren har evidensmerkede hard blocks (a), men onboarding screener ikke for
prematuritet/korrigert alder eller andre ut-av-scope-situasjoner. Sol reiste
risikomodellen; det egne funnet her er *plasseringen*: scope-gaten hører hjemme i
onboarding (én skjerm: «gjelder dette barnet?»), ikke i en fremtidig risikomodell.
Uten den kan appen gi trygt utseende råd til barn den ikke er bygget for. (b).
**Test:** fagpanelet (premiss #4/#5) bes eksplisitt vurdere onboarding-scope, ikke bare motorsvar.

**A4. «Én husholdning = ett barn = én enhet» er bakt inn i profilmodellen.**
Lokal-first uten backend gjør flerbarns- og flerenhets-realiteten strukturelt usynlig
allerede i onboarding — før man i det hele tatt når delingsspørsmålet (premiss #9/#10).
(a) for arkitekturen; (b) for hvor mange husholdninger dette rammer.
**Test:** rekrutteringskravene fra Sols runde 2 + ett spørsmål i dagbokstudien om antall barn/enheter.

### Navigasjon

**A5. «Tab-bar er riktig chassis» — for et produkt som selv erklærer at «anbefalingen er produktet».**
Tre faner signaliserer bredde produktet ikke har bevist: Planlegg er ubevist
betalingsdriver (premiss #14, åpen), Familie er i praksis Innstillinger (audit).
First principles: én flate + drills kan bære hele den validerte verdien. Tab-baren er
arvet konvensjon, ikke et vedtak med begrunnelse mot alternativet. (a) for fanestatus;
(c) for at én-flate er bedre. **Test:** prototype-duell én-flate vs. tre faner i fase 7/9.

**A6. «Familie»-navnet skriver en sjekk arkitekturen ikke kan innløse.**
Fanenavnet er vedtatt brand-bærende (a), men lokal-first uten deling gjør at fanens
løfte (familie som koordineringsenhet) ikke kan leveres. Dette er samme integritetsklasse
som paywall-formuleringen audit flagget: navnet lover en jobb koden ikke kan gjøre. (a)
for gapet; (b) for om brukere faktisk leser løftet inn i navnet.
**Test:** ordassosiasjonstest på fanenavn («hva forventer du bak denne fanen?»).

**A7. «Ingen router» blokkerer de flatene som kan bli produktets viktigste.**
Crossfade-søsken uten adresserbar tilstand gjør deep-linking umulig: push-varsler,
widgets, delte handoff-lenker og «fortsett der du slapp» kan ikke lande riktig. Hvis
beslutningsøyeblikket ligger utenfor app-åpningen (se mulighet B2), er dagens IA en
strukturell sperre mot produktets sannsynlig beste distribusjonsform. (a) for
arkitekturen; (b) for konsekvensen. **Test:** teknisk spike på adresserbar tilstand + ett
varsel-scenario ende-til-ende.

**A8. Egen-motsigelse: «én hånd i vinterhansker» som prinsipp, edge-swipe som mekanikk.**
Edge-swipe back er en presisjonsgest ved skjermkant — nettopp det prinsipp 4 forbyr
(«no nested gestures», store mål). Premiss #15 (hanskene) er svekket, men selv med bare
hender og barn på armen er kant-gester de mest feilutsatte. (a) for motsigelsen i
dokumentene; (b) for feilraten. **Test:** én-hånds-oppgavetest med barnedukke på arm,
mål feiltreff på edge-gest.

### Anbefalingsmodell

**A9. «Absolutt liste hver gang» — men gjentaksbrukerens spørsmål er trolig et delta.**
Den nummererte innerst-til-ytterst-listen er optimalisert for førstegangs full
påkledning. Fra dag 2 er det reelle spørsmålet sannsynligvis «noe annerledes enn i
går?». Fingerprint-infrastrukturen (a, `computeScanResultKey`) kan uttrykke akkurat
dette, men UI-et har ikke delta-vokabular. NB: at cachen finnes er ikke bevis for at
behovet pulserer (Sols P2) — dette er en designhypotese. (b).
**Test:** dagbokspørsmål «hva lurte du egentlig på?» + prototype med delta-linje øverst.

**A10. «Full skråsikkerhet i alle værbånd» — UI-et har ingen representasjon av usikkerhet.**
Motoren er deterministisk (a), men ved båndgrenser (sludd/regn, rundt 0 °C, vind-kast)
er det ærlige svaret et intervall eller et betinget valg. Dagens UI presenterer
grensetilfeller med samme autoritet som klare tilfeller. For et tillitsprodukt er
falsk presisjon en større risiko enn innrømmet tvil — og fagpanel-blindtesten vil
trolig straffe nettopp grensetilfellene. (b).
**Test:** inkluder grensescenarioer eksplisitt i blindtesten; konsepttest «enten/eller»-svar vs. ett svar.

**A11. «Anbefalingen gjelder et punkt i tid» — men turen er et forløp.**
Anbefalingen nøkles på nå-vær (+feelsLike), mens en trilletur på to timer kan krysse
temperaturfall, sol/skygge og soving. Timedata hentes allerede (Planlegg finnes), men
resultatflaten integrerer ikke varighet. Anbefalingens tidsgyldighet er udefinert i UI
(«gyldig til når?»). (a) for at varighet ikke er input; (b) for hvor ofte det gir feil
svar. **Test:** scenariosett i blindtesten med varighet som variabel; feltobservasjon av turlengder.

**A12. «Juster-drillen (sliders) er en verdiflate» — den er kilden til produktets eneste kjente selvmotsigelse.**
Audit funn 5: FinnAntrekk setter `feelsLikeC = tempC`, Hjem bruker beregnet føles-som —
samme vær kan gi ulikt svar på to flater (a). Dypere: en manuell slider-flate motsier
prinsippet «we compute, we don't accumulate/ask». Flaten eksisterer fordi Guide-fanen
ble nedlagt og innholdet måtte et sted (arv, ikke vedtak). (a) for inkonsistensen; (c)
for at flaten har positiv nettoverdi. **Test:** bruk av drillen når analytics er på; inntil
da: fiks inkonsistensen eller fjern flaten (se Del C).

### Maskot

**A13. «Maskoten bygger tillit» er låst produksjonsretning uten at avsenderspørsmålet er stilt.**
Premiss #11 dekker maskot-vs-faglig-avsender. Det egne funnet: maskoten henger over
*resultatflaten* — den flaten der differensieringen (forklaringene, plaggene) skal bo.
Selv om maskoten vinner tillitstesten som merkevare, konkurrerer den romlig med
innholdet der den er plassert. Plassering og eksistens er to separate spørsmål som i
dag er slått sammen i ett eiervedtak. (a) for vedtaket; (b) for plasseringseffekten.
**Test:** samme skjerm med maskot på Hjem-hvile men ikke over resultat, mål lesetid/gjenkalling av plaggliste.

**A14. «Cream kortermet body er nøytral» — i minus ti grader kan den avlese som feil.**
Eieren forkastet bleie-varianten pga. vinterkontekst-dissonans (a) — men en bararmet
body over et −10°-panel har samme problem i mildere grad, og for den
sikkerhetsengstelige S1-brukeren kan «lettkledd baby i kulde» trigge nettopp den
uroen appen skal dempe. (c) med klar testbar kjerne.
**Test:** vis vinter-skjermbildet til foreldre i målgruppen, spør åpent hva de legger merke til; mål ubehag/forvirring.

**A15. «Hvileblikket (glance hvert 20.–30. s) er verdt sitt eget asset- og regelapparat.»**
Suppresjonsreglene (reduced motion, bakgrunn, sheet, tastatur, 30 s etter resume …) er
allerede et komplekst kontrakts-regime (a) for en mikrobevegelse på en flate hvis jobb
er et blikk på under 10 sekunder. Værscene-regelen forbyr «perpetual motion» — et
tilbakevendende blikk er periodisk bevegelse med samme oppmerksomhetskostnad. (c) for
netto sjarmverdi. **Test:** fjern i én prototypegren; mål om noen savner det (preferansetest), veid mot QA-kost.

### Motion / seremoni

**A16. «3,2 s-seremonien bygger tillit» — den er iscenesatt arbeid i et produkt som ellers håndhever ærlighet.**
Motoren er en ren, øyeblikkelig funksjon (a). Seremonien fremfører en beregning som
ikke pågår. Eierens dokumenterte rasjonale var «as it is now, nobody sees it» — det er
et produsentbehov (arbeidet skal synes), ikke et brukerbehov. Design Lab har selv
plassert fiktive statuser i en integritetsklasse (Sols P0-3); iscenesatt beregning er
en mildere slektning av samme klasse. I tillegg treffer kostnaden appens mest reduserte
bruker (søvndeprivert S1, fase 2 §5). (a) for at motoren er øyeblikkelig; (b) for
tillitseffekten i begge retninger. **Test:** skip-rate (når analytics er på) + tillitsmåling
med 3,2 s vs. ≤800 ms ærlig transisjon med synlig forklaring.

**A17. «Fingerprint-styrt seremoni (v4) er forutsigbar» — cache-tilstand lekker inn i primær-CTA-ens semantikk.**
CTA-en veksler mellom «Finn dagens antrekk» og «Vis dagens antrekk» styrt av en
intern nøkkel brukeren ikke kan resonnere om (a). Utfallsbasert nøkkel gir også det
motsatte tillitsproblemet: været har endret seg, antrekket ble likt → ingen seremoni →
«sjekket den i det hele tatt?». Regelen er teknisk elegant og opplevelsesmessig
uforklarlig. (b). **Test:** be brukere forutsi hva som skjer ved neste trykk i en
tenke-høyt-test; mål forklaringsevne.

### Lys / tema

**A18. «Dark-first» optimaliserer for minoritetskonteksten — etter eierens eget rasjonale.**
Runde 4-vedtaket sier selv: primærbruk er utendørs i dagslys, og lys variant scoret
høyest av alle skjermer i review (a). Likevel består «dark-first» som designfilosofi.
Begrunnelsen som gjenstår er anti-AI-cream-differensiering — et merkevareargument, ikke
et brukerargument, i et produkt som selv erklærer «product register, not brand
register». (a) for motsigelsen i dokumentene; (b) for utendørs lesbarhet.
**Test:** lesbarhetstest utendørs i dagslys, samme innhold mørk vs. lys, armlengdes avstand.

**A19. «Petrol er tema-konstant» og «panelet er vær-reaktivt» er to fargeregler som underforstått konkurrerer.**
Hvis panelfargen aldri koder noe (konstant petrol), er den ren merkevare; hvis
vær-nyanser skal tintes inn, koder fargen vær — men da er konstansen brutt. Briefen
holder begge uten å definere hva farge *betyr* på instrumentflaten. Semantisk uavklart
fargebruk blir dyr i fase 7 når tre retninger skal divergere. (a) for at begge regler
står; (c) for brukerkonsekvens. **Test:** definer fargesemantikk eksplisitt før fase 7;
kontrasttest per værstate er allerede DoD-krav i doktrinen.

### Hierarki

**A20. «Sju likestilte rader er riktig hierarki» — det kritiske er flatet ut med det trivielle.**
Body og regntrekk har samme visuelle vekt. For en bruker på 5 sekunder er spørsmålet
sjelden «alle sju», men «den ene tingen jeg ellers glemmer» (votter? regntrekk?
solhatt?). Sikkerhetskritiske elementer (hard block-utfall) har ikke dokumentert egen
hierarkiklasse på resultatflaten. (a) for flat liste; (b) for hva brukeren faktisk
skanner etter. **Test:** blikksporing/5-sekunders gjenkallingstest på resultatskjermen; hva huskes?

**A21. «Forklaringene er differensieringen» — men hierarkiet behandler dem som fotnoter.**
Audit-vurderingen sier at differensieringen i dag ligger i tonen og forklaringene, ikke
i målt treffsikkerhet (a). Samtidig er «Hvorfor akkurat dette?» demotert til
kontekstuell drill (eiervedtak Familie-IA). Det som hevdes å bære produktet, er
hierarkisk sekundært på flaten der det trengs. (a) for plasseringen; (b) for om løftede
forklaringer øker tillit/betalingsvilje. **Test:** variant med én-linjes «hvorfor» inline
per kritisk plagg vs. dagens drill; tillits- og forståelsesmåling.

### Typografi

**A22. Typografi-splitten er kjent (audit funn 8) — det uutfordrede er om webfonter hører hjemme i det hele tatt.**
To uforlikte vedtak (A2 systemfont vs. Monter Schibsted) må uansett forlikes (a). Det
dypere spørsmålet: i en én-hånds 5-sekunders utendørsflate er systemfont raskere, alltid
riktig i Dynamic Type, og null vedlikehold. Fraunces display-serif drar mot
redaksjonelt register — som briefen selv avviser («not editorial»). Fontvalget er i dag
et identitetsvalg som ikke er prøvd mot bruksvalget. (a) for splitten; (c) for at
systemfont vinner totalvurderingen. **Test:** fase 7-retningene tvinges til å begrunne
fontvalg mot utendørs lesbarhet + Dynamic Type, ikke bare mot identitet.

**A23. «Tabular numerals everywhere» tjener et produkt som har erklært at det ikke er et tallprodukt.**
Anti-referansen er eksplisitt: «not a number-and-symbol product»; verdien er sanselig
språk, ikke måltall (a). Et typografiprinsipp som optimaliserer for tallkolonner
signaliserer instrument-identitet — i strid med produktets egen posisjonering. Liten
sak isolert, men symptom: typografiprinsippene er arvet fra verktøy-estetikk, ikke
utledet av registeret. (a) for motsigelsen; (c) for brukerkonsekvens.
**Test:** ingen egen test nødvendig — avgjøres som designvedtak i fase 7 med begrunnelse.

### Spacing / doktrine

**A24. «Doktrinen låses før designet er validert» — håndhevingsapparatet beskytter et system som ennå ikke har bevist seg.**
16 testfiler, frossen baseline (97 kjente brudd), 20 vedtak med testplikt — bygget mens
9 av 11 skjermer er umigrert (a). Fase 7 skal levere «tre radikale retninger», men
enhver radikal retning vil kollidere med maskinelt håndhevede spacing-/lysvektor-/
dybdekontrakter. Apparatet er imponerende — og det er også en strukturell konservatisme
som kan gjøre fase 7 til tre varianter av Monter i stedet for tre retninger. (a) for
tilstanden; (b) for om apparatet faktisk hindrer divergens.
**Test:** eksplisitt fritaksregime for fase 7-prototyper (doktrinen suspendert i lab-grener), gjeninnføres ved fase 8-vedtak.

### IA / premiummodell

**A25. «Planlegg fortjener fane-status» — flaten kan være en notifikasjon forkledd som en fane.**
Premiss #14 er åpen. Egen vinkel: «I morgen»-jobbens naturlige form er et tidsstyrt
kort/varsel kvelden før, ikke en flate man browser. Fane-statusen finnes trolig fordi
tab-baren trengte en tredje fane (chassis-logikk, jf. A5), ikke fordi jobben krever
navigasjonsplass. 595 kB for ubevist verdi (a). (b) for jobbens form.
**Test:** dagbok («planla du klær i går for i morgen? hvor/når?») + varsel-prototype mot fane-prototype.

**A26. «Betalingsbeslutningen kan tas før første verifikasjonsøyeblikk» — paywallen står på det punktet i reisen der brukeren vet minst.**
Hard paywall etter én anbefaling (premiss #6, akseptert risiko) har en udiskutert
egenskap: brukeren har ennå ikke vært UTE med anbefalingen. Produktets verdi kan
per definisjon ikke verifiseres innendørs — verifikasjonen skjer etter turen
(nakkesjekk, «det stemte»). Betalingsmuren står altså foran det eneste øyeblikket som
kan skape berettiget tillit. 7-dagers StoreKit-trial bøter delvis på dette, men
trial-start krever kortforpliktelse ved maksimal uvitenhet. (a) for plasseringen; (b)
for konverteringseffekten. **Test:** trial-variant der porten først lukkes etter N
gjennomførte uteturer eller ett værskifte (motkandidatplikten i premiss #6 gjort konkret).

**A27. «Tre planer med identisk innhold er en prisarkitektur» — det er ren forpliktelsesprising uten opptjent tillit.**
39/99/299 differensierer kun på varighet (a). Forpliktelsesprising fungerer når
produktet har rukket å bevise seg; her møter den brukeren ved første kontakt (jf. A26).
Sesongpuls-alternativet står i premisslogg #7; egen tilføyelse: årsplanen selger 12
måneder av et behov som etter både graduation-premisset (#6 i 03-dok) og
sesonglogikken kan vare 4–6. Det er en churn-bombe med forsinket lunte — refusjoner og
1-stjerners «betalte for et år, trengte tre måneder». (b).
**Test:** Van Westendorp + valgeksperiment med sesongpass-innramming (allerede planlagt, premiss #7) — men nå med churn-scenarioet som eksplisitt målepunkt.

**A28. «Paywall-kopien selger koordinering» — den mest betalbare jobben i hypoteselaget er den arkitekturen ikke kan levere.**
«Del med alle som passer barnet» (screenshot 05) mot `family_sharing=false` (a, audit).
Audit noterte avviket; det egne funnet er strategisk: hvis delingsløftet faktisk driver
konvertering, konverterer appen på en funksjon som ikke finnes — og hvis det ikke
driver, er det død kopi på produktets viktigste skjerm. Begge utfall krever handling
før lansering. (a) for gapet; (b) for hvilken effekt kopien har.
**Test:** paywall-variant uten delingslinjen; konverteringsdelta (krever analytics + StoreKit-data).

---

## Del B — 12 nye produktmuligheter

Alle er hypoteser (b)/(c) inntil testet; ingen er anbefalinger ennå.

1. **Delta-anbefaling.** «Som i går, men bytt til tynn lue» som primærlinje for kjente
   fingerprints. Gjenbruker eksisterende nøkkel-infrastruktur; svarer på A9. (b)
2. **Widget/varsel som primærflate.** Dagens anbefaling på låseskjerm/widget kl. 07 og
   før registrerte turtider — verdi uten app-åpning. Krever adresserbar tilstand (A7).
   Ærlig konsekvens: aksepterer at «åpninger/dag» kan være feil verdimodell. (b)
3. **Verifier-inngang («Sjekk det jeg har valgt»).** Inngangsinversjon over samme motor,
   chip-basert input, p75 ≤ 8 s (Sols terskel). Allerede hypotese i fase 2 — mulig
   konkretisering: kandidat bygges ved å avkrysse fra forrige anbefaling, ikke fritekst. (b)
4. **Handoff-kort.** Statisk delbart kort (native share): dagens antrekk + gyldighetsvindu
   + «sjekk nakken»-linje. MVH for koordinering uten backend; måles per kvalifisert
   handoff (20–25 %-terskelen). (b)
5. **Varighet i anbefalingen.** «Trilletur ~2 timer» som input → intervallanbefaling +
   eventuelt justeringsvarsel underveis. Bruker timedata som allerede hentes. Svarer på A11. (b)
6. **Etter-turen-mikrosjekk.** Ett varsel etter hjemkomst: «Varm / passe / kald i
   nakken?» — én tapp. Kobler den byggede, døde kalibreringsloopen (audit funn 2) og
   adresserer etter-turen-blindsonen. NB: loopens eksistens i kode er ikke bevis for at
   brukere vil svare. (b)
7. **Garderobe-lite.** «Har ikke dette plagget» på plaggrad → umiddelbar substitusjon,
   og appen husker valget. Adresserer ≥90 %-garderobekravet uten full
   garderoberegistrering. (b)
8. **Sesongpass som prisinnramming.** «Første vinter»-pakke (f.eks. okt–mars) som
   primærtilbud, abonnement som sekundær. Matcher pulsbehov-hypotesen; testes i
   premiss #7-eksperimentet. (b)
9. **Sovende vognbarn-modus.** Kable `vognMode='sleeping'` til én toggle på
   aktivitetsvalget. Trolig hyppig S1–S2-situasjon (hypotese — prevalens umålt). (b)
10. **Grensevær-ærlighet.** Ved båndgrenser: vis «enten/eller» med ett
    oppfølgingsspørsmål («blir det mest gåing eller vognsitting?») i stedet for falsk
    presisjon. Gjør determinismens svakhet til tillitsfunksjon. Svarer på A10. (c→b)
11. **Barnehage-pakkeliste.** Avgrenset til pakkejobben (ikke instruksjon av personalet):
    morgendagens skiftetøy basert på prognose. Sols P2 åpnet at barnehagen kan være
    bruksårsak uten å være mottaker. (b)
12. **Gyldighetsvindu på hvert svar.** «Gjelder til ca. kl. 14 — da kommer regnet.»
    Tidsavgrenser anbefalingen ærlig, skaper legitim re-engasjementsgrunn uten mørke
    mønstre, og løser stale-tilstandens tillitsproblem. (b)

---

## Del C — 6 kandidater til FJERNING eller radikal forenkling

| # | Kandidat | Hva som spares | Hva som tapes |
|---|---|---|---|
| R1 | **3,2 s-seremonien** → ≤800 ms ærlig transisjon (eller full fjerning) | Kognitiv kost for appens mest reduserte bruker; hele v4-maskineriet (CTA-veksling, cache-koreografi, skip-knapp); asset-pipeline for scanning-pose; integritetsrisikoen ved iscenesatt beregning (A16) | Et låst eiervedtak med dokumentert rasjonale; opplevd grundighet («den jobber for meg»); et rituelt særpreg konkurrenter ikke har. Tapet er reelt hvis tillitstesten viser at seremonien faktisk bygger tillit — derfor test før riving |
| R2 | **Planlegg som fane** → «I morgen»-kort på Hjem + tidsstyrt varsel | 595 kB chunk; en tredjedel av IA-flaten; vedlikehold av tre prognoseflater; fane-chassisets bredde-krav (A5/A25) | Browsebar ukeoversikt; opplevd innholdsbredde bak paywallen (tre faner selger mer enn én); muligheten til å *måle* Planlegg-bruk før fjerning — fjernes den før analytics er aktiv, får premiss #14 aldri data |
| R3 | **Juster-drillen (slider-flaten)** | Produktets eneste kjente selvmotsigelse (feelsLike-inkonsistensen, audit funn 5) elimineres som klasse; en flate som motsier «we compute»-prinsippet; Guide-arvens siste rest | Utforskningsverktøy for nysgjerrige brukere; «hva hvis»-læring; en flate eieren har investert i. Minimumsalternativ: behold, men tving identisk feelsLike-beregning (fjerner funn 5 uten å fjerne flaten) |
| R4 | **Maskotens bevegelsesapparat** (glance-pose, suppresjonsregler, scan-pose-veksling) — behold én statisk positur | Asset-produksjon i låst stilfamilie; motion-QA på tvers av reduced-motion/keyboard/sheet-tilstander; A15-kompleksiteten | Levendegjøring som kan være del av varmen; deler av et låst eiervedtak (v3/v4); sunk cost i allerede produserte poser. Selve maskoten består — kun animasjonslaget fjernes |
| R5 | **Onboarding-felt utover fødselsmåned + sted** (navn, øvrige steg) → 2 felt, resten progressivt etter første verdi | Time-to-first-value; drop-off-flate før paywall; A2-mismatchen (navn → fremmed maskot) | Emosjonell binding-hypotesen (premiss #13) mister sin flate; personalisert kopi («Emma trenger…») krever navnet senere; onboarding som forventningsstyring forsvinner |
| R6 | **Tre prisplaner → én plan + ev. sesongpass** | Valgparalyse på en ikke-avviselig skjerm; StoreKit/RevenueCat-testmatrise (audit funn 6: svakest testet der risikoen er høyest); trial-variantkompleksitet | Ankerprising (299 gjør 99 attraktiv); ARPU-optimaliseringsrom; ombestemmelse blir dyrere etter lansering (prisendring er synlig). Bør uansett avgjøres av premiss #7-eksperimentet, ikke av magefølelse |

I tillegg, ukontroversielt (teknisk, ikke design): 294 MB urefererte bilder i `public/`
og døde avhengigheter (leaflet m.fl.) fjernes uansett — spart app-størrelse, tapt: ingenting kjent (a, audit funn 4/10).

---

## Del D — Prioritert liste: hva som må BEVISES før design kan låses

Rekkefølgen er avhengighetsstyrt: 1 er forutsetning for 5, 8, 10; 2 avgjør flest designvalg per krone.

1. **Analytics aktiv i produksjon** (PostHog-nøkkel + events kablet). Ikke et bevis i
   seg selv, men porten for alle kvantitative terskler. Inntil da er enhver
   bruksformulering hypotese — ingen unntak. (Premiss #2; audit funn 1.)
2. **Beslutningsøyeblikkets anatomi** (dagbok + feltobservasjon): hvor skjer valget
   (inne/ute), hendersituasjon, med/uten kandidat-antrekk, varighet av turen som
   planlegges. Avgjør samtidig: forskrivning vs. validering (premiss #3), dark/light-
   prioritet (A18), hanskekravet (premiss #15), seremonibudsjettet (A16), delta vs.
   absolutt (A9), Planleggs form (A25). Høyest designavkastning per studie.
3. **Faglig blindtest av motoren** — allerede lanseringsblokker (premiss #4/#5), nå
   utvidet med grensevær-scenarioer (A10), varighetsscenarioer (A11) og
   onboarding-scope (A3). Rapporterer scenarioantall, konfidens og uenighetshåndtering
   (Sols krav).
4. **Paywall-moment og prisinnramming**: kan betalingsbeslutning tas før første
   verifikasjonsøyeblikk (A26)? Trial-motkandidat (N uteturer / ett værskifte) mot
   dagens variant; én plan + sesongpass mot tre planer (premiss #6/#7, R6).
5. **Seremoniens tillitseffekt**: skip-rate (krever 1) + kvalitativ tillitsmåling 3,2 s
   vs. ærlig rask transisjon (A16/R1). Låser motion-kontrakten.
6. **Maskotens tillitseffekt og plassering**: maskot vs. faglig avsender (premiss #11)
   OG over-resultat vs. kun-hvileflate (A13), inkl. vinterkontekst-avlesning (A14).
   Låser asset-produksjonen — som i dag ligger foran beviset.
7. **Utendørs lesbarhet**: mørk vs. lys, armlengde, dagslys, Dynamic Type (A18, A22–23).
   Låser tema-strategi og typografi-forliket (audit funn 8 må uansett forlikes).
8. **Handoff-MVH**: delknapp/handoff-kort målt per kvalifisert handoff, 20–25 %-terskel
   (premiss #9, B4). Avgjør om «Familie» kan bety familie (A6) og om paywall-kopien
   får dekning (A28).
9. **Garderobedekning og substitusjon**: ≥90 % kategoriekvivalens eller umiddelbar
   substitusjon (premiss-terskel etter Sols skjerping; B7 som mottiltak).
10. **Frekvens og graduation**: åpninger/beslutningsøyeblikk per kvalifisert dag og
    bruksfall uke 1→4 værkorrigert (premiss #2, graduation-antakelsen). Avgjør om
    abonnement i det hele tatt er riktig fangstmekanisme — og dermed hele fase 6.

**Konsekvensregel:** Ingen av vedtakene som i dag er «låst» (seremoni-koreografi,
maskotstil, dark-first, tab-struktur, hard paywall-plassering) hviler på punktene
over. De er eiervedtak — legitime som retningsvalg, men de skal i fase 8 re-prøves mot
bevisene fra denne listen, ikke arves som fakta. Det som ikke er bevist innen fase
8-porten, skal eksplisitt merkes som akseptert risiko med motkandidatplikt (samme
mekanisme som premiss #6 allerede bruker).

## KJERNEPÅSTANDER
- A16: Regelmotoren er en ren, øyeblikkelig funksjon (a — belagt i audit/motor-appendiks); 3,2 s-seremonien fremfører derfor arbeid som ikke pågår, og dens tillitseffekt i begge retninger er (b) testbar via skip-rate og tillitsmåling — den er aldri målt.
- A18: Eierens eget runde 4-vedtak sier at primærbruk er utendørs i dagslys og at lys variant scoret høyest i review (a); at dark-first likevel er riktig filosofi er (b) testbar via utendørs lesbarhetstest og i dag ubevist.
- A26: Hard paywall står før brukerens første mulige verifikasjonsøyeblikk (etter en faktisk tur) — plasseringen er (a) belagt i flyten; konverteringseffekten av å flytte porten bak N uteturer/ett værskifte er (b) testbar og ukjent.
- A12/R3: FeelsLike-inkonsistensen mellom Juster-drillen og Hjem er (a) belagt (audit funn 5); at drillen har positiv nettoverdi som flate er (c) spekulasjon uten bruksdata.
- A7: Fravær av router gjør deep-linking fra varsler/widgets/delte lenker umulig (a — belagt i IA-audit); at varsel/widget er en bedre primærflate enn app-åpning er (b) testbar hypotese, ikke et funn.
- A24: Doktrine-håndhevingsapparatet (16 testfiler, frossen baseline, testpliktige vedtak) er bygget mens 9 av 11 skjermer er umigrert (a); at det strukturelt vil dempe fase 7-divergens er (b) testbar via et fritaksregime for lab-grener.
- A13/A14: Maskotstilen er låst ved eiervedtak uten brukervalidering (a — premisslogg #11); at cream-body over vinterpanel avleses som dissonant av S1-foreldre er (c) spekulasjon med definert test.
- A9: Fingerprint-nøkkelen finnes i kode (a), men at gjentaksbrukerens reelle spørsmål er et delta («noe annerledes enn i går?») er (b) testbar hypotese — kodens eksistens er ikke brukerbevis.
- A27: At tre planer med identisk innhold og kun varighetsdifferensiering skaper churn-risiko ved pulsbehov er (b) testbar via premiss #7-eksperimentet med churn-scenario som målepunkt; ingen betalingsdata finnes i dag.
- A28: Paywall-kopien «Del med alle som passer barnet» mot family_sharing=false er (a) belagt (audit); hvilken konverteringseffekt linjen har er (b) testbar først når analytics er aktiv.
- Del D: Ingen av de låste vedtakene (seremoni, maskot, dark-first, tab-struktur, paywall-plassering) hviler på gjennomførte bevis — (a) belagt ved at premissloggen viser ÅPEN/SVEKKET/OMSTRIDT på alle tilhørende premisser.

## SVAKHETER (egeninnrømmet)
- Rivningsagenten har samme bevisproblem som briefen: samtlige av mine motforslag (delta-anbefaling, widget-først, verifier-inngang) er selv (b)/(c)-hypoteser uten brukerdata — jeg river en ubevist brief med ubeviste alternativer, og listen i Del D gjelder derfor like mye mine forslag som dagens design.
- Rollen skaper systematisk rivningsbias: en agent bedt om å finne minst 20 problemer finner 20 problemer, uavhengig av om briefen fortjener dem — flere av A-punktene (A19, A23) er små og kunne vært utelatt i en nøytral vurdering.
- R1 (fjern seremonien) angriper et eiervedtak med dokumentert rasjonale og to runders historikk (v3→v4); eieren har allerede observert at «ingen ser den» og valgt bevisst — min ærlighetsinnramming kan undervurdere at opplevd grundighet er en reell tillitsmekanisme i andre produkter (f.eks. sikkerhetsskannere), og testen kan vise at eieren har rett.
- A24 undervurderer trolig doktrine-apparatets verdi: regresjonsvern og maskinell håndheving er nettopp det audit roste som uvanlig solid, og alternativet (ingen håndheving under fase 7) har sin egen dokumenterte feilmodus — visuell drift som allerede rammer 9 av 11 skjermer.
- R2 (fjern Planlegg) har en selvmotsigelse jeg selv påpeker: fjernes fanen før analytics er aktiv, blir premiss #14 aldri falsifiserbar — riving ødelegger måleinstrumentet.
- Flere utendørs-argumenter (A8, A18, A20) hviler på antakelsen om at beslutningsøyeblikket skjer ute — som premisslogg #15 og Sols r2 eksplisitt har svekket; skjer valget innendørs før avreise, faller deler av kraften i dark-first- og hanske-kritikken.
- Jeg har ikke snakket med eieren om hvorfor tab-strukturen og forpliktelsesprisingen ble valgt; det kan finnes udokumenterte forretningsgrunner (App Store-forventninger, ASO, refusjonserfaring) som gjør A5 og A27 svakere enn de fremstår.
- Kostnadssiden i Del C er asymmetrisk vurdert: «hva som spares» er konkret (kB, QA-tid), «hva som tapes» er vagt (varme, særpreg) — den asymmetrien favoriserer fjerning strukturelt, og minnet feedback_no_effort_factor forbyr nettopp å la arbeidsmengde/kost styre anbefalinger.