# Advokatsak — Inngangskile: «Tur- og overgangsplanlegging»

> Fase 3, Challenge the Brief. Rolle: advokat for at Turprotokollen skal være Babyoras første grunn til å installere og komme tilbake. Alle påstander merket (a) belagt / (b) testbar / (c) spekulasjon. Kilder: `docs/design-lab/02-current-product-audit.md`, `docs/design-lab/03-user-reality.md` (revidert), `docs/design-lab/premisslogg.md`, `docs/design-lab/appendix/fase2/sol-review-svar-fase2.md`, `docs/design-lab/appendix/fase2/segmenter-behov.md`, `PRODUCT.md`, samt kodeverifikasjon i `src/lib/wool-layers/`.

## 1. Tesen i én setning

Babyoras første jobb bør ikke være «hva skal barnet ha på nå?» men **«få oss trygt gjennom hele turen»**: ett startantrekk, en kort ha-med-liste, og justeringspunkter bundet til overgangene (hjem→bil→vogn→butikk→ute→soving) — fordi det er i overgangene, ikke i punkttilstanden, at både den asymmetriske nedsiden og konkurransefortrinnet ligger.

## 2. Hvorfor akkurat denne kilen — kjerneargumentene

### 2.1 Punktsvarets eksistensielle risiko er overgangens styrke

Fase 2 dokumenterte forskrivningens eksistensielle risiko: konkurrenten er en ni-ords regel («ett lag mer enn deg selv»), og behovet pulserer i stedet for å strømme daglig (a — `03-user-reality.md` §1). Men ni-ords-regelen svarer bare på punkttilstanden. Den svarer **ikke** på:

- «Skal dressen på før eller etter bilstolen?» — der svaret har sikkerhetskonsekvens: tykk vinterdress i bilstol gjør selen for løs (b — regelen finnes evidensmerket i motoren som HB-9, `src/lib/wool-layers/safety.ts:269–276`, men den fagkilden er ennå ikke dokumentert i repoets research, se §7)
- «Hva når hen sovner i vogna underveis?» — overoppheting under vognsøvn er fryktdriveren fase 2 identifiserte som drivstoffet i S1–S2 (b — `03-user-reality.md` §5)
- «Hva gjør jeg med dressen inne på butikken?» — 20 minutter innendørs i full vinterbekledning er et reelt justeringsøyeblikk ingen tommelfingerregel adresserer (c — plausibelt, umålt)

Punkttilstanden er lett; **kjeden av tilstander med skift imellom er der lekfolks heuristikk faktisk slutter å hjelpe**. Hvis Babyora skal være verdt penger mot en gratis ni-ords regel, må den svare på noe regelen ikke kan. (b — testbart i konseptduell.)

### 2.2 Fingerprint-paradokset løses i stedet for å ignoreres

Auditens ubehageligste funn for forskrivning: appen har selv kodet inn at behovet pulserer — fingerprint-cachen antar få nye svar per dag (a — `02-current-product-audit.md` §1, PRODUCT.md owner-override v4). Samme vær → samme svar → ingen grunn til å åpne appen.

En turprotokoll bryter dette **legitimt**: samme vær med ulik reise (bil eller ikke, soving eller ikke, 20 eller 90 minutter) gir ulikt svar, fordi svaret avhenger av reisen, ikke bare været. Beslutningsøyeblikk per kvalifisert dag (Sols skjerpede metrikk, ikke app-åpninger) blir strukturelt flere uten at vi jukser med engagement-mekanikk. (b — falsifiserbart: hvis dagbokstudien viser at reisene i praksis er like hver dag, kollapser dette til samme puls som punktsvaret.)

### 2.3 Kilens opphav er reviewerens egen felling — ikke vår ønsketenkning

Sol skrev selv, under «Hva Claude ikke har vurdert»: *«Overgangsreisen mangler. Hjem → bilstol → vogn → butikk → utendørs → soving er én sammenhengende beslutningskjede, ikke én tilstand»* (a — `sol-review-svar-fase2.md`), og listet «Tur- og overgangsplanlegging» som én av de fire lovlige kilene. I tillegg dekker kilen to andre av Sols udekkede punkter i samme grep: «plagget er utilgjengelig» (reserveplagg-seksjonen adresserer substitusjon delvis) og «etter-turen-øyeblikket» (protokollens justeringspunkter gir en naturlig lære-etterpå-krok). Ærlig merking: at reviewer påpekte hullet er et argument for at hullet er reelt i *analysen* — det er **ikke** brukerbevis for at hullet er reelt i *livet* (c inntil dagbokstudie).

### 2.4 Beslutningsøyeblikket ligger innendørs — kilen slipper det svekkede hanske-premisset

Premiss 15 (vinterhansker-bruk) er SVEKKET: Sols r2 påpekte at bruken trolig skjer innendørs før avreise (a — `premisslogg.md` #15). Tur- og overgangsplanlegging er den eneste av de fire kilene hvis kjerneøyeblikk *per definisjon* er innendørs-før-avreise, med to hender og tid til å lese tre seksjoner. Kilen bygger altså på det brukerbildet som overlevde review, ikke det som falt. (b — feltobservasjon av beslutningsøyeblikkets sted er allerede planlagt test for premiss 15.)

### 2.5 Motorens eget sikkerhetsdomene omfatter allerede overgangene

Verifisert i kode: `context.bilstol` med hard block HB-9, `vognMode: 'awake' | 'sleeping'` med sovepose-tabell, `exposureMin` for varighet — alt i motorens inputkontrakt, testet, evidensmerket (a — `src/lib/wool-layers/types.ts:50–65`, `safety.ts:269`; audit funn 2). **Regel-disiplin:** motor-tilstedeværelse er ikke brukerbevis, og arbeidsmengde er ikke et argument. Poenget er et annet: motorens *evidensmerkede sikkerhetsomfang* — det laget som faktisk skal fagsigneres — strekker seg allerede over overgangene. Kilen ber altså ikke produktet om å påstå noe nytt faglig; den ber UI-et slutte å skjule det motorens sikkerhetslag allerede mener er beslutningskritisk. Kilene «validering» og «koordinering» krever derimot nye faglige påstander (grønt-lys-sertifisering, mottakerkommunikasjon) utenfor dagens signerings-scope.

### 2.6 Trial-mekanikken begynner å virke

Premiss 12: 7 dagers trial dekker ikke garantert et værskifte (a — `premisslogg.md` #12). Men 7 dager dekker mange *turer*. Hvis verdiøyeblikket er per tur i stedet for per værskifte, får trialen vist verdien flere ganger før betalingsbeslutningen — uten å endre StoreKit-mekanikk. (b — måles i trial-funnel når analytics er aktiv; ingen kodebasert måling omtales som bevis før da.)

## 3. Hvem og hvilket øyeblikk

**Primærbruker:** omsorgspersonen som gjennomfører dagens tur med barn 0–12 mnd (aktør- og situasjonsdefinert per revidert arbeidsmodell — ikke alderssegment; kohorthypotesen S1–S2 brukes kun til rekruttering). Typisk i permisjon, gjennomfører vogntur der barnet sover ute, og/eller kjører bil til aktiviteter. (b — kohorthypotese, krever rekruttering per Sols krav-liste inkl. fedre, aleneforeldre, flerspråklige.)

**Kjerneøyeblikk:** innendørs, 5–15 minutter før avreise, i planlegge/pakke-cellene i aktør×øyeblikk-kartet. Sekundærøyeblikk: justere-underveis (ved overgangene) og lære-etterpå (kom hjem — stemte det?). Kilen eier planlegge/pakke og *forbereder* justere-underveis; den later ikke som forelderen skal skjerm-interagere med barnet på armen i overgangen (se svakhet W5).

## 4. Hvorfor betalbar

1. **Sammensatt artefakt, ikke faktaoppslag.** Startantrekk + ha-med + justeringspunkter er en komposisjon per reise×vær×barn — vanskeligere å erstatte med huskeregel eller gratis værapp enn et punktsvar. (c → b via konseptduell med betalingsvilje-måling.)
2. **Asymmetrisk nedside ved overgangene.** Bilstol-sikkerhet og vognsøvn-overoppheting er øyeblikkene der feil koster mest og der sosial dom («ingen skal kunne si jeg kledde barnet feil», fase 2 §5) gjør verdiktet siterbart. Betalingsvilje følger frykt-asymmetri, ikke bekvemmelighet. (c — mekanismen er hypotese; prissettes i Van Westendorp per premiss #7.)
3. **Flere legitime beslutningsøyeblikk per dag** enn punktforskrivning (§2.2). (b.)
4. **Trial får vist verdien** flere ganger (§2.6). (b.)

## 5. Hva kilen krever av produktet — konkret

**Onboarding (endres):** Etter fødselsdato, to nye spørsmål med motorverdi: (1) «Hvordan ser en typisk tur ut?» — flervalg: vogn / bæresele / bil først / sover ute i vogn; (2) ull-toleranse som preferansevalg (ikke diagnose, per revidert premiss #17). Dette løser samtidig Sols P2 om at navn-først prioriterer feil (premiss #13) — reisekontekst ER de beslutningskritiske variablene. Navnet beholdes, men flyttes bak.

**Hjem (justeres, ikke bygges om):** Værflaten og CTA-en består. Over CTA-en: reisevelger som chips — «Bil først», «Vogn», «Skal sove ute», varighet (kort/vanlig/lang → `exposureMin`). Fingerprint-nøkkelen (`src/lib/scan/result-key.ts`) utvides med reisekomposisjon: ny reise×vær → full seremoni («Finn turens antrekk»), kjent → direkte («Vis turens antrekk»). Eier-override v4-logikken gjenbrukes uendret i prinsipp.

**Resultat (utvides fra én liste til tre seksjoner):**
1. **Startantrekk** — dagens nummererte innerst-til-ytterst-liste, uendret komponent.
2. **Ha med** — reserveplagg avledet av reisen: dress-som-teppe ved bil (HB-9-noten finnes allerede formulert i koden: «I bilstolen: tynne lag + sele tett. Legg dressen over som teppe etter at selen er stram»), regntrekk, ekstra lue, sovepose ved planlagt vognsøvn.
3. **Underveis** — 2–4 justeringspunkter bundet til overgangene, hver med samme varm-norske notesystem og evidensmerking som dagens hard blocks. Maks-lengde håndheves (kognitiv last, se W4).

**Paywall (omformuleres):** Verdiløftet blir «Hele turen — ikke bare ut døra». Første frie visning viser hele protokollen (alle tre seksjoner) slik at det betalbare er synlig før gaten. «Del med alle som passer barnet»-copyen fjernes (allerede P0 fra fase 2). Hard-paywall-arkitekturen består teknisk; premiss #6 (om hard paywall etter én visning er riktig) forblir åpen og eies av fase 6-porten.

**Nye forpliktelser kilen utløser (ærlig kostside):** (1) HB-9s AAP-forankring må kildebelegges før UI-kabling — repo-researchen dokumenterer den ikke i dag (a — `segmenter-behov.md` kunnskapshull). (2) Faglig blindtest (premiss #4/#5, hard lanseringsblokker) må utvides med overgangsscenarioer: bilstol, vognsøvn, inne-stopp. (3) Vognsøvn-råd nærmer seg søvn-domenet der SUDI-evidensen ligger — formuleringer må gjennom samme «ikke grønt-lys-sertifisering»-disiplin som felte valideringskilen delvis.

## 6. Hva kilen eksplisitt IKKE er

- **Ikke omsorgshandoff.** Ingen deling, ingen mottakerflater, ingen CareCircle-aktivering i v1. (Protokollen er riktignok et bedre fremtidig delingsobjekt enn et punktsvar — men det er ekspansjonshypotese, ikke kile.)
- **Ikke kandidatvalidering.** Ingen «sjekk mitt valg»-inngang. Verifiereren parkeres.
- **Ikke barnehage-/ukelogistikk.** Barnehagesekk-pakking, ukes-avvik og S4-jobbene nedprioriteres; Uke-flaten er ikke kilens hjem.
- **Ikke medisinsk, ikke søvnrådgiver.** Feber/sykdom er eksplisitt ut-av-scope med synlig fall-ut («i dag gjelder ikke standardrådene»); vognsøvn-punktet henviser til kontrolltegn (nakketest), det utsteder ikke trygghetsgarantier.
- **Ikke en erstatning for punktsvaret.** «Rask tur ut» er protokollens degenererte spesialtilfelle (én etappe) — dagens kjerneflyt består som gulv, ikke som identitet.

## 7. Minimal testbar versjon

**Trinn 0 — før bygging (brukerstudier, eiervendt):**
- Dagbokstudien (premiss #1, allerede planlagt) får tre tilleggsspørsmål: beskriv gårsdagens lengste tur etappe for etappe; hvor mange klesjusteringer gjorde du underveis; hva hadde du med som ikke ble brukt/manglet. **Falsifisering: hvis median kvalifisert dag har <1 flerleddstur eller flerleddsturene har <2 beslutningsøyeblikk, faller kilen.** (b)
- Konseptduell: protokoll-resultat vs. punkt-resultat som statiske prototyper, tvunget valg + betalingsvilje, mot samme deltakerutvalg som CTA-duellen i premiss #3. (b)
- Faglig blindtest-scenariosettet utvides med overgangscase før noen UI-kabling av HB-9/vognMode. (Krav, ikke test.)

**Trinn 1 — i app (bak eksisterende paywall):** reisevelger (3 chips + varighet) på Hjem → kabler `bilstol`, `vognMode`, `exposureMin` til eksisterende motorinput → treseksjons-resultat. Ingen backend, ingen motorendring, forenlig med lokal-first. Måling først når analytics er aktiv (PostHog-nøkkel er eieroppgave): andel beregninger med ≥1 reisevalg, retur per kvalifisert dag, trial-konvertering — ingen kodebasert bruksmåling siteres som bevis før da.

## 8. Gjenbruk vs. skrot av dagens flater

| Flate/system | Skjebne | Begrunnelse |
| --- | --- | --- |
| wool-layers-motor inkl. HB-9, vognMode, exposureMin | **Gjenbrukes fullt** | Inputkontrakten dekker allerede kilen (a) |
| Resultatlisten (innerst-til-ytterst) | **Gjenbrukes** som seksjon 1 av 3 | Låst eiervedtak består |
| Scan-seremoni + fingerprint-cache | **Gjenbrukes**, nøkkel utvides med reise | v4-prinsippet («ny beregning oppleves, ferdig svar utsettes ikke») passer kilen bedre enn punktsvaret |
| Monter-designsystem + doktrinetester | **Gjenbrukes** | Uavhengig av kilevalg |
| Onboarding-skjelett | **Gjenbrukes**, to spørsmål inn, navn flyttes bak | Løser premiss #13 samtidig |
| Planlegg «I morgen»-widget | **Gjenbrukes** som «morgendagens tur» | Naturlig protokollhjem for kveldsplanlegging |
| Paywall-infrastruktur | **Gjenbrukes**, copy omskrives | «Del med alle»-løftet fjernes uansett |
| FinnAntrekk/Juster-slidere | **Nedprioriteres** til verktøy under Familie | Punkt-tuning er ikke kilens jobb; feelsLikeC-inkonsistensen (audit funn 5) må dog fikses uansett skjebne |
| Uke-visningen (595 kB) | **Parkeres** | Premiss #14 ubevist; ikke kilens behov |
| CareCircle-preview | **Forblir dev-only** | Allerede håndtert per Sols P0-3 |
| Maskot + seremoni | **Beholdes, testes** | Premiss #11 uendret av kilevalg |

## 9. Svakheter — det ærligste jeg har (utdypet i weaknesses-feltet)

Kilens tre farligste hull: (1) null brukerbevis for at flerleddsturer *oppleves* som planleggingsproblem — folkeprotokollen «ta med et ekstra lag og kjenn på nakken» er ti ord og kan dekke alt; (2) opphavet er reviewer-observasjon pluss motorkapabilitet — to insider-kilder, null bruker-kilder; (3) protokollen er *mer* innhold til appens mest søvndepriverte bruker, i direkte spenning med fase 2s funn om kognitiv last som svakeste tilgjengelighetsdimensjon. Alle tre er falsifiserbare i trinn 0 før en linje UI bygges — det er sakens reelle styrke: den er billigst å *felle* tidlig av de fire, fordi dagbokstudien som uansett skal kjøres (premiss #1) avgjør den med tre tilleggsspørsmål.

## KJERNEPÅSTANDER
- (a) Motorens inputkontrakt dekker allerede overgangene: context.bilstol med hard block HB-9 (src/lib/wool-layers/safety.ts:269), vognMode='awake'|'sleeping' og exposureMin (src/lib/wool-layers/types.ts:50–65) er implementert og testet, men ingen skjerm kabler dem (audit funn 2).
- (a) Sols runde 2-review navnga selv overgangsreisen (hjem→bilstol→vogn→butikk→ute→soving) som en manglende sammenhengende beslutningskjede og listet tur- og overgangsplanlegging som én av fire lovlige inngangskiler.
- (a) Fingerprint-cachen (eier-override v4) koder inn at punktsvaret pulserer — samme vær gir samme svar og ingen grunn til retur; premiss #2 forbyr å sitere '3–8 åpninger/dag' som fakta.
- (a) HB-9s påståtte AAP-forankring er ikke dokumentert i repoets research (segmenter-behov.md kunnskapshull) — kildebelegg er forutsetning før UI-kabling.
- (b) Flerleddsturer gir flere legitime beslutningsøyeblikk per kvalifisert dag enn punktforskrivning, fordi ulik reise gir ulikt svar ved samme vær — falsifiseres i dagbokstudien hvis median kvalifisert dag har <1 flerleddstur eller <2 beslutningsøyeblikk per tur.
- (b) Kilens kjerneøyeblikk er innendørs før avreise og bygger dermed på det brukerbildet som overlevde Sols review (premiss #15 SVEKKET: bruken skjer trolig inne, ikke i hansker ute).
- (b) 7-dagers trial dekker mange turer selv uten værskifte — verdiøyeblikk per tur reparerer trial-svakheten i premiss #12; måles først når analytics er aktiv.
- (b) Protokollformens merverdi over punktsvar og betalingsvilje avgjøres i konseptduell med tvunget valg — ikke antatt.
- (c) Justeringspunktene ved overgangene (bilstol-sikkerhet, vognsøvn-overoppheting, inne-stopp) er der lekfolks ni-ords-heuristikk slutter å hjelpe og der betalingsvilje oppstår — plausibel mekanisme, null brukerdata.
- (c) At norske vognturer med utesoving er høyfrekvente nok til daglig relevans er kulturell allmennkunnskap uten kilde i repoet.

## SVAKHETER (egeninnrømmet)
- Null brukerbevis for at flerleddsturer oppleves som et planleggingsproblem: folkeprotokollen 'ta med et ekstra lag og kjenn på nakken' er ti ord, gratis og kan dekke hele jobben — kilen har nøyaktig samme eksistensielle risiko som forskrivningen den vil erstatte, bare ett nivå opp.
- Opphavet er dobbelt innsideargument: Sols reviewer-observasjon pluss motorkapabilitet. Ingen av delene er brukerfunn, og å kable sovende motorfunksjoner risikerer å validere appen gjennom appens egen arkitektur — presis den feilen Sol advarte mot (P1: terskler som måler produktbruk, ikke problemverdi).
- Protokollen er MER innhold (tre seksjoner) til appens mest søvndepriverte bruker — i direkte spenning med fase 2s funn om at kognitiv last er svakeste tilgjengelighetsdimensjon og at 3,2s-seremonien allerede er additiv kost. Risiko: protokollen leses som lekser, ikke lettelse.
- Justeringspunktene konsumeres i verst tenkelige interaksjonsøyeblikk (barn på armen ved bilen, i butikken) — protokollen må være memorerbar fra før-avreise-lesingen, ellers feiler underveis-seksjonen i praksis. Helt utestet.
- Kilen øker den faglige signeringsbyrden: vognsøvn-råd grenser mot SUDI-/søvndomenet der Sol allerede felte tallpåstander, HB-9s fagkilde er udokumentert i repoet, og fagsignatur er allerede hard lanseringsblokker (premiss #5). Kilen gjør appen MER helsenær, i spenning med anti-referansen 'ikke medisinsk app'.
- Hvis protokollen er god pedagogikk, kan graduation gå RASKERE enn ved punktsvar — en protokoll lærer bort struktur, og premiss om at læring spiser behovet (antakelse #6 i 03) rammer kilen med ekstra kraft. Abonnementslogikken kan undergraves av produktets egen kvalitet.
- Reise-dimensjonen kompliserer fingerprint-modellen (reise×vær×barn gir flere nøkler): enten flere fulle seremonier (mer friksjon) eller cache-redesign — v4-vedtakets eleganse er ikke gratis å bevare.
- Frekvensantakelsen (daglige vognturer med utesoving året rundt) er kulturell allmennkunnskap uten kilde i repoet, og gjelder skjevt: bil-lette byhusholdninger og familier uten vognsøvn-praksis får en tynnere protokoll — kilen kan i praksis være smalere enn den ser ut.