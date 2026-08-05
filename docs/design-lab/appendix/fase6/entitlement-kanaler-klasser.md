## Fase 6 (Challenge the Business) — tre tverrgående leveranser til EIERPORTEN

**Grunnlag lest:** 05-global-design-research.md (inkl. hele revisjonsblokken), appendix/fase4/{abonnement-etikk, distribusjon-installasjon, emosjonell-trygghet, hig-native-monstre, sol-review-svar-fase4}.md, 04-challenge-the-brief.md, premisslogg.md, samt fase 5-flatene som binder matrisen (appendix/fase5/{paywall-premium, gap-laseskjerm-verifier}.md). 07-business-models.md er bekreftet tom («IKKE PÅBEGYNT»). Telleverifikasjon av de 41: abonnement 9 + distribusjon 11 + emosjonell trygghet 10 + HIG/native 11 = 41.

**Hovedfunn 1 — entitlement-matrisen tvinger frem en forretningsmodell-konsekvens.** Når Sols operasjonelle gratisminimum tas på alvor (er den nummererte plagglisten nødvendig for trygg handling, ER listen del av gratislaget), pluss de tre bindende kravene fra research (delt kort utenfor paywall, sikkerhetsvarsler aldri premium, sikkerhetsbærende låseskjermflate aldri betalt — Flighty-antimalen), da inneholder gratislaget i praksis dagens konkrete anbefaling med gyldighet, datakvalitet og kontrolltegn. Konsekvens: **eiervedtaket «hard paywall etter én anbefaling» (premiss 6) overlever ikke matrisen i sin nåværende form.** Det som kan selges er bekvemmelighet og kontinuitet: garderobematching/substitusjon, planlegging frem i tid, historikk/verifikasjonslogg, komfort-deltaer og proaktive varsler, koordinering. Dette er et funn til eierporten, ikke et vedtak — og det åpne motspørsmålet (Sols antakelse 10) er om gratisminimumet etterlater en betalingsverdig jobb i det hele tatt. Det er ubevist begge veier.

**Hovedfunn 2 — de tre kanalmodellene er reelt åpne, og de utelukker hverandre ikke helt.** Rent forbrukerprodukt er eneste modell som kan startes uten eksterne motparter, men den låser produktet ute av helsestasjonskanalen så lenge betaling ligger nær kjernen. Gratis offentlig sikkerhetskjerne (Sols «Public Safety Utility») er den eneste veien inn i kanalen som ikke gjentar Nørs+-konflikten — men den krever faglig signatur (premiss 4/5 er HARD BLOKKER) og governance-/merkevareseparasjon som i dag ikke finnes. Kommunalt finansiert nytteflate har sterkest presedens (Nørs) men hviler på leverandørpåstander (101/85 er merket slik), krever backend/telemetri som bryter med lokal-first (premiss 10), og har lengst og dyrest salgssyklus. Modell 2 kan kombineres med modell 1 (kjerne gratis, kommersiell app separat) og er en mulig bro til modell 3 — men hver kombinasjon arver begge modellers bevisbyrde.

**Hovedfunn 3 — klasseinndelingen viser at produktmodellvalget ikke kan tas på fase 4-researchen.** Av 41 oppføringer er 11 dokumenterte brukerfunn, 19 analogi-presedens, 9 plattform-/lovkrav, 1 tilgjengelighetskrav, 1 uprøvd hypotese (som primær evidensbasis). Men ingen av de 11 brukerfunnene er målt på Babyoras egne brukere eller den norske påkledningsjobben — de setter rammer (paywall-plassering, trial-lengdens irrelevans, ~52 % varsel-opt-in som hardt tak for H3-varsel-only, graviditetsvinduet), men ingen måler om foreldre vil forskrives (H1), diagnostiseres (H2) eller motta delta (H3). Det bekrefter matrisens 0/35: jobbpreferansen avgjøres først av dagbokstudien, H2-routeren som instrument og prototypetest mot nullmodellen.

**Eierportens reelle valg (ikke forhåndsvalgt):**
1. **Kanalmodell** — velg 1, 2, 3 eller sekvens (f.eks. 1 nå med 2 som opsjon). Hver modell har egne krav/risiko/bevisplikter i leveranse 2.
2. **Verdilagets grense** — aksepter matrisens gratisminimum og definer betalingsjobben som bekvemmelighet/kontinuitet, eller utfordre grensedragningen eksplisitt (da må eier argumentere mot etikk-mandatet, forbudslistens punkt 7 og Røde Kors-/farevarsel-normen samtidig).
3. **Prisarkitektur-test** — premiss 7-eksperimentet må teste innramminger, ikke bare prispunkter: sesongpass (ikke-fornyende) vs. månedlig vs. engangskjøp vs. gratis sikkerhetskjerne (Sols P2-krav — fire armer, ikke tre).
4. **Evalueringsmekanikk** — «to relevante situasjoner, senest 14 dager» implementert som gratis evalueringsperiode FØR kjøp (ikke StoreKit-trial); at brukere forstår hendelsesstyrt evaluering er uprøvd (Sols antakelse 3/4) og må testes før den bygges.

**Hypotese-merking:** Alle terskler uten kilde i leveransene er merket [hypotese] (ferskhetsterskel offline, «to situasjoner/14 dager», Slopes-kjøpsskjermen som fortsatt ikke er verifisert i appen — flagget i fase 5). Nørs-tallene omtales konsekvent som leverandørpåstander.

**Filstier (grunnlag):**
- C:\Users\siver\Downloads\trainer-marketplace-master1\babyora\docs\design-lab\05-global-design-research.md
- C:\Users\siver\Downloads\trainer-marketplace-master1\babyora\docs\design-lab\appendix\fase4\abonnement-etikk.md
- C:\Users\siver\Downloads\trainer-marketplace-master1\babyora\docs\design-lab\appendix\fase4\distribusjon-installasjon.md
- C:\Users\siver\Downloads\trainer-marketplace-master1\babyora\docs\design-lab\appendix\fase4\emosjonell-trygghet.md
- C:\Users\siver\Downloads\trainer-marketplace-master1\babyora\docs\design-lab\appendix\fase4\hig-native-monstre.md
- C:\Users\siver\Downloads\trainer-marketplace-master1\babyora\docs\design-lab\appendix\fase4\sol-review-svar-fase4.md
- C:\Users\siver\Downloads\trainer-marketplace-master1\babyora\docs\design-lab\premisslogg.md
- C:\Users\siver\Downloads\trainer-marketplace-master1\babyora\docs\design-lab\07-business-models.md (tom — mottaker av dette materialet)

## ENTITLEMENT-MATRISE
## Entitlement-matrise — tilstand × flate

**Sikkerhetsminimum (SM) — rendres ALLTID der flaten viser innhold; kan aldri gates, blurres eller utløpe stille:**
- **S1 Trygg handling nå:** konkret anbefaling i enkleste handlingsform. Sols regel: er den nummererte plagglisten nødvendig for trygg handling, ER listen del av gratislaget.
- **S2 Grenser:** hard blocks, TOG-grenser, nyfødt-tidsgrenser, ut-av-scope (sykdom/feber/prematuritet).
- **S3 Gyldighetsvindu** i absolutt tid (aldri naken relativ nedtelling utenfor Live Activity).
- **S4 Datakvalitet/proveniens:** «beregnet kl. X av værdata fra kl. Y».
- **S5 Avbrudds-/kontrollkriterium:** når rådet skal sjekkes/avbrytes (nakkesjekk 10–15 min).
- **S6 Kontrolltegn:** input-ekko (temperatur, vind, vogn/bæring, varighet).
- Kompakt SM for små flater (varsel/widget/kort): minimum S1+S3+S4.

**Verdilag (kan gates — endrer aldri hvilken handling som er trygg):** garderobematching/substitusjon, planlegging frem i tid, historikk/verifikasjonslogg, komfort-deltaer og proaktive varsler, koordinering/familie, flere barneprofiler, interaktive liveflater utover basiskortet.

**Invarianter:** (I1) Ingen celle viser et ugyldig råd som gyldig (stale-safe). (I2) Barnets sikkerhet er aldri konverteringsagn — ingen teller/paywall i beslutningsøyeblikket. (I3) Betaling endrer aldri hvilken handling som anses trygg.

| Tilstand \ Flate | Hjem | Resultat | Planlegg | Varsel | Widget | Delt kort |
|---|---|---|---|---|---|---|
| **Gratis** | Dagens vurdering i SM-form + vær nå. Gates: fremtidsblikk, historikk, garderobe. | Komplett basisanbefaling (nummerert liste) + full SM. Gates: substitusjon («har ikke»), lagre/planlegg, komfortoptimalisering. | Værutsikt (rå fakta) + «rådet beregnes når dagen kommer» + ett tapp til nå-rådet. Gates: frem-i-tid-råd, pakkeliste. Ingen falsk fremtidstrygghet. | Sikkerhetsklassen (hard-block-utløsende værskifte, utløp av aktivt råd) sendes ALLTID gratis. Gates: komfort-delta («legg til mellomlag»). | Basiskort: dagens råd + absolutt gyldighetsvindu + alder. Gates: delta-/interaktiv widget. Gyldighetsvindu aldri premium (Flighty-antimal). | Fullt kort (SM + basisliste) for mottaker uten konto/app; deling mulig fra gratis. Gates: live-oppdatering/historikk hos avsender. Kortet ligger utenfor paywallen. |
| **Evaluering** (gratis periode FØR kjøp, ikke StoreKit-trial; «2 relevante situasjoner, senest 14 dager» [hypotese]) | Som Betalt. | Som Betalt. Teller vises ALDRI her (I2). | Som Betalt. | Som Betalt. Ingen konverteringsbudskap i varselkanalen. | Som Betalt. | Som Betalt. |
| — evaluering, felles | Status/teller («øyeblikk brukt», dato-tak) KUN på egen statusflate. Påminnelse før overgang som brukerens valg (toggle). Ingen kortinnhenting ved start. | | | | | |
| **Betalt** | Alt: vurdering + fremtidsblikk + garderobestatus. SM uendret. | Basis + substitusjon + varighetsoptimalisering + lagre/verifiser. SM uendret. | Frem-i-tid-råd med EGET gyldighetsvindu og datakvalitetsmerke + pakkeliste. | To varselklasser med ulikt formspråk: sikkerhet (som gratis) + komfort-delta. Aldri delt semantikk. | Basis + delta/interaktiv; Live Activity kun etter startet/planlagt tur, med utløp og terminal kvittering. | Som gratis + oppdaterbart kort og historikk hos avsender. |
| **Utløpt** (sesongpass/abo slutt — graduation er designet utfall) | Gratis-cellen + «dette kan dere nå»-innramming. Ingen tapslister eller retention-modaler. | Gratis-cellen; verifisert historikk fra betalt periode forblir lesbar (Slopes-presedens [analogi]). | Gratis-cellen + nøytral tilstandsmaskin: hva består, sluttdato, hva skjer etterpå (Oportun-mønsteret). Re-kjøp nøytralt tilgjengelig. | Sikkerhetsklassen fortsetter uendret. Komfort-deltaer opphører med varslet, nøytral stopp — aldri stille. | Basiskortet består; delta-widget degraderes til basiskort — aldri en «lås opp»-flate på sikkerhetsbærende posisjon. | Deling består (del av gratislaget). Gamle kort beholder sitt eget utløpsstempel. |
| **Offline** (ingen ferske værdata; lokal motor virker) | Råd på cachede data med tydelig alder (S4). Over ferskhetsterskel [hypotese — settes av risikomodellen]: degrader til trygt intervall + konservativ basisregel + «hent nye data». | Som hjem; beregning kjører lokalt. Usikkerhet ved gammel data uttrykkes som handling («ta med ekstra lag»), aldri som konfidensprosent. | Utilgjengelig uten data: ærlig tomtilstand + siste kjente utsikt med alder. Aldri gammel utsikt som fersk. | Ingen nye værvarsler kan genereres; lokal klokke varsler fortsatt utløp av aktivt råd (S3 er lokal). | Siste kort med absolutt vindu + alder; ved passert vindu → Utdatert-raden. | Sending køes med tydelig «ikke sendt». Mottatt kort er statisk snapshot med tidsstempel. |
| **Utdatert råd** (vindu passert eller kontekst ugyldig: tid/sted/barn/aktivitet/værgrunnlag) | Rådet merkes utløpt + ett-tapps re-beregning. Re-beregning annonseres eksplisitt (IKEA-banner-mønsteret), skjer aldri stille. | Utløpt råd vises kun som historikk med utløpsstempel; handling krever ny beregning. Umulig re-beregning → offline-fallback (intervall + kontrollkriterium). | Passerte planer arkiveres. Gammel fremtidsberegning gjenbrukes aldri. | Sendt varsel følges av utløpsoppdatering eller auto-utløp. Live Activity termineres med kvittering («turen endte kl. X») — aldri stille forsvinning. | «Utløpt kl. Z — åpne for nytt råd». Aldri gammel plaggliste som gyldig: utløpt råd på låseskjerm er farligere enn ingen. | Kortet bærer eget utløpsstempel; etter utløp: «utløpt» + inngang til ferskt kort. Aldri gammelt råd som gyldig. |

**Kontroll av kravet «trygg minimumsbeslutning i hver celle»:** hver celle gir enten (a) gyldig SM, eller (b) ærlig ugyldiggjøring + konservativ fallback (trygt intervall + kontrollkriterium) + korteste vei til ferskt råd. Offline- og Utdatert-radene gjelder alle betalingstilstander likt — stale-safe og offline-fallback er SM og kan aldri gates.

**Forretningskonsekvens (til eierporten):** matrisen innebærer at premiss 6 («hard paywall etter én anbefaling») ikke overlever i nåværende form — gratislaget inneholder dagens konkrete anbefaling. Betalingsjobben blir bekvemmelighet/kontinuitet. Om den jobben er betalingsverdig (Sols antakelse 10) er ubevist og testes i premiss 7-eksperimentet.

## KANALMODELLER
## Tre kanalmodeller — krav, risiko, bevisbehov

### Modell 1 — Rent forbrukerprodukt (B2C)
Sesongpass (ikke-fornyende, 4–6 mnd) primært + månedlig fleksibelt; gratis evalueringsperiode før kjøp («2 relevante situasjoner, senest 14 dager» [hypotese]); paywall tidligst etter første verifiserte anbefaling (anbefaling + tur + bekreftelse); entitlement-matrisens gratisminimum alltid åpent.

**Krav:**
- Entitlement-matrisen implementert som kontrakt (SM aldri gated, delt kort utenfor paywall, to varselklasser).
- Evalueringsperioden bygges som egen logikk FØR kjøp — ikke StoreKit-trial (StoreKit har kun faste perioder).
- Non-renewing subscription via App Store/RevenueCat (støttet produkttype); sesongpass og abonnement i adskilte visuelle spor med eksplisitt «betales én gang — fornyes ikke» (Feeld-antimalen må være umulig).
- Norsk digitalytelseslov: maks 6 mnd binding, total pris før avtale, kansellering i samme medium, aktiv-avtale-varsel hver 6. mnd — sesongpasset oppfyller dette by design.
- 7-punkts forbudsliste håndhevet (inkl. aldri barnets sikkerhet som konverteringsagn).

**Risiko:**
- Diskvalifiserer trolig helsestasjonskanalen så lenge betaling ligger nær kjernen (Nørs+-konflikten som presedens).
- Gratisminimumet kan kannibalisere betalingsviljen — betalingsjobben (bekvemmelighet/kontinuitet) kan vise seg for tynn.
- Anskaffelsesvinduet eies av gravidapper; Babyoras vindu (første kuldeeksponering) kommer senere.
- Værskifte-evaluering har ingen lært konvensjon (fase 5: 10/10 trial-tidslinjer er kalenderbaserte) — udokumentert terreng.

**Må bevises:**
- Premiss 7-eksperiment med FIRE innramminger: sesongpass / månedlig / engangskjøp / gratis sikkerhetskjerne (Sols P2).
- At brukere forstår og aksepterer hendelsesstyrt evalueringsvindu (Sols antakelse 3/4).
- At gratisminimumet etterlater en betalingsverdig jobb (antakelse 10) — funnel-måling etter verifikasjonsøyeblikk (krever premiss 2-analytics).
- Norsk ASO-søkevolum målt før nisjepåstanden brukes; Slopes' faktiske kjøpsskjerm verifisert i appen.

### Modell 2 — Gratis offentlig sikkerhetskjerne («Public Safety Utility», Sols tredje vei)
Institusjonelt isolert, faglig signert, gratis sikkerhetsprotokoll (SM-laget som selvstendig flate) distribuert via helsestasjon, barselkurs, QR og delt lenke — uten kryssalg i helsestasjonsløpet. Kommersiell app (modell 1) lever separat med governance- og merkevareseparasjon.

**Krav:**
- Faglig avsender med navngitt signatur: premiss 4/5-blindtest bestått (HARD BLOKKER — nulltoleranse falsk grønn) FØR noe tilbys kanalen.
- Governance-struktur og merkevareseparasjon som tåler Rådet for sykepleieetikk-testen: ingen kommersiell lenking i helsestasjonsløpet.
- Universell utforming (Dynamic Type, WCAG, kontrast) — kjernen retter seg mot offentlig anbefaling.
- ROS-/personvernsdokumentasjon og forvaltningsplan (hvem drifter, hvem finansierer vedlikehold av gratislaget).

**Risiko:**
- Enhver oppfattet kobling til kommersiell flate kan velte hele kanalen (Nørs+-kritikken: «snikinnføring av betaling»).
- Dobbel kostnadsbase: gratislaget koster drift uten inntekt; den kommersielle appen gir sin sterkeste feature til gratislaget.
- Kanalens gate er faglig avsender, ikke UX (Stavanger-presedensen: kun offentlige/ideelle kilder) — Babyora mangler legitimiteten i dag.

**Må bevises:**
- At helsestasjoner faktisk vil distribuere en gratis kjerne som sameksisterer med en separat kommersiell tjeneste (Sols antakelse 1) — intervjuer med helsesykepleiere/kommuner.
- At Babyora kan dokumentere faglig kvalitet, forvaltning og universell tilgang godt nok for offentlig anbefaling (antakelse 2).
- At kjernen etterlater betalingsverdig jobb i den kommersielle appen (antakelse 10 — samme som modell 1, skjerpet).

### Modell 3 — Kommunalt finansiert nytteflate (Nørs-invertert)
Kommunen betaler (per aktiv bruker à la Nørs' 5 kr/mnd [leverandørpåstand]), gratis for foreldre; helsestasjonen publiserer/anbefaler.

**Krav:**
- Offentlig anskaffelse: rammeavtaler/innkjøpsprosess per kommune, SLA, support, lokal tilpasning (språk, lokal info).
- Databehandleravtale + DPIA per kommune; rapportering av aktive brukere til fakturering — krever backend/telemetri som lokal-first-arkitekturen (premiss 10) ikke har i dag.
- Faglig kvalitetssikring på nivå med offentlig helseinformasjon; WCAG-krav.

**Risiko:**
- Lang, dyr salgssyklus mot 100+ kommuner; politisk betent kanal (gratisprinsipp-debatten pågår allerede).
- Nørs har førstemoverfordel og bred foreldrestøtte-flate; Babyora selger en nisje (påkledning) — kommunal betalingsvilje for nisjen er ukjent.
- Aktiv-bruker-fakturering utfordrer personvernposisjonen som i dag er et fortrinn.
- Produktet formes av innkjøperen (kommunen), ikke brukeren (forelderen) — risiko for kravdrift.

**Må bevises:**
- Nørs-tallene (101 kommuner / 85 % / 200k) uavhengig verifisert — i dag leverandørpåstander.
- Kommunal betalingsvilje for en påkledningsnisje spesifikt (ikke antatt fra Nørs' brede tilbud).
- At påkledning kvalifiserer som helsestasjonsfaglig anbefalingsområde; enhetsøkonomi ved nisjevolum.

### Tvers av modellene
Modellene er ikke gjensidig utelukkende: modell 2 kan legges oppå modell 1 (kjerne gratis, app kommersiell) og er en mulig bro til modell 3 — men hver kombinasjon arver begge modellers bevisbyrde og governance-krav. Felles gulv for alle tre: entitlement-matrisens SM, forbudslisten, og at ingen modell bruker barnets sikkerhet som konverterings- eller salgsargument (verken mot forelder eller kommune).

## KLASSEINNDELING AV DE 41
## Klasseinndeling av de 41 fase 4-oppføringene

Klassifiseringsdisiplin: klassen angir oppføringens PRIMÆRE evidensbasis slik den brukes i beslutningen. **Dokumentert brukerfunn** = publisert, systematisk måling av brukeratferd/-respons (felteksperiment, stor-N atferdsdata, fagfellevurdert forskning). **Analogi-presedens** = enkeltselskaps-case, bransjekonvensjon, leverandørpåstand. **Plattform-/lovkrav** = App Store-regler, OS-fakta, HIG-normer, regulatoriske krav. Avledede reinvent-beslutninger (værskifte-evaluering, sesongpass-for-Babyora, utendørsmodus, to-stemmer-grensen, én sannferdig «pust») er uprøvde hypoteser UANSETT klassen på trenden de springer ut av.

| # | Oppføring | Rapport | Klasse | Merknad |
|---|---|---|---|---|
| 1 | Hard paywall ved onboarding | abonnement | Dokumentert brukerfunn | RevenueCat/Adapty stor-N atferdsdata; leverandøraggregert, survivor-bias flagget; kategorinivå, ikke Babyora |
| 2 | Kalenderbasert 7-dagers trial | abonnement | Dokumentert brukerfunn | Randomisert felteksperiment (PMC) + Recurly; avledet værskifte-evaluering er uprøvd hypotese |
| 3 | Reverse trial | abonnement | Analogi-presedens | Strava/Ladder-case |
| 4 | Ikke-fornyende sesongpass | abonnement | Analogi-presedens | Slopes beviser kun at kjøpstypen finnes (Sol P2); kjøpsskjerm ikke verifisert |
| 5 | Lifetime-tilbud | abonnement | Analogi-presedens | Bryllupskategori-observasjon |
| 6 | Apple/Google familiedeling | abonnement | Plattform-/lovkrav | Plattforminfrastruktur; trials deles ikke (plattformfakta) |
| 7 | Multi-seat familieplaner | abonnement | Analogi-presedens | Spotify-mønsteret; avvist på arkitektur + fase 3-vedtak |
| 8 | Tre-plans årsanker | abonnement | Analogi-presedens | SaaS-konvensjon; reinvent (sesongpass+månedlig) er uprøvd hypotese |
| 9 | Mørke mønstre-forbud | abonnement | Plattform-/lovkrav | FTC/ROSCA + digitalytelsesloven; forbudslisten er etikkvedtak, ikke trend |
| 10 | Helsestasjons-/kommunekanal (Nørs) | distribusjon | Analogi-presedens | 101/85-tallene er LEVERANDØRPÅSTANDER; konflikten (Sykepleien) er dokumentert, adopsjonen er ikke |
| 11 | Graviditets-nedlastingsvinduet | distribusjon | Dokumentert brukerfunn | JMIR/markedsforskning på anskaffelsesatferd; kategorinivå |
| 12 | ASO/søk (norsk nisje åpen) | distribusjon | Uprøvd hypotese | 65 %-tallet er global plattformstatistikk; den norske nisjepåstanden er umålt (Sols nedgradering) |
| 13 | Lenke-først/no-install (Partiful) | distribusjon | Analogi-presedens | Sols antakelse 9 (lenke > tekstmelding) må bevises |
| 14 | PWA som primærdistribusjon | distribusjon | Plattform-/lovkrav | iOS-begrensninger er dokumenterte plattformfakta |
| 15 | App Clips / Instant Apps | distribusjon | Plattform-/lovkrav | Play Instant nedlagt (plattformfakta); Sol: behold som senere motkandidat |
| 16 | Widget-først (Locket) | distribusjon | Analogi-presedens | Case; beviser retention-flate, ikke akkvisisjon |
| 17 | Værutløste varsler | distribusjon | Dokumentert brukerfunn | Opt-in ~52 % / retention-benchmarks (Airship 63M); leverandøraggregert; setter hardt tak for varsel-only H3 |
| 18 | iMessage-extensions | distribusjon | Analogi-presedens | Fravær av dokumentert suksess |
| 19 | Reima-modellen (retail-distribusjon) | distribusjon | Analogi-presedens | Enkeltcase; reinvent (merkenøytral QR) er uprøvd hypotese |
| 20 | Institusjonspålagt installasjon (Vigilo) | distribusjon | Analogi-presedens | Kanal-observasjon; irrelevant 0–12 mnd |
| 21 | Faglig avsender-lag | emosjonell | Dokumentert brukerfunn | BMC-systematisk analyse (15 apper, ekspertinvolvering) |
| 22 | Sosial proof på sikkerhetsflater | emosjonell | Dokumentert brukerfunn | 0,6 %-anmeldelsesanalysen (samme BMC-korpus som #21) |
| 23 | Maskot som omsorgsobjekt | emosjonell | Analogi-presedens | Finch/Duolingo selskapsrapporterte effekter; to-stemmer-grensen er designhypotese (Sol) |
| 24 | Farevarsel-anatomi (MET/Yr) | emosjonell | Analogi-presedens | Norsk konvensjon; inneholder ett brukerfunn (Yrs fargetest); Sol advarer mot overbruk på ikke-farevarsler |
| 25 | Reservert kritisk formspråk / alarm-budsjett | emosjonell | Dokumentert brukerfunn | Klinisk alarm fatigue-forskning (85–99 % falske alarmer); kryssdomene |
| 26 | Handlingsbasert usikkerhetskommunikasjon | emosjonell | Dokumentert brukerfunn | PMC/Annual Reviews-forskning; reinvent-formen (B10) er uprøvd hypotese |
| 27 | Kontrolltegn/verifiserbarhet (XAI) | emosjonell | Dokumentert brukerfunn | JMIR/PMC mHealth-usabilitystudier |
| 28 | Skamfri, atferdsrettet UX-tekst | emosjonell | Dokumentert brukerfunn | Skyld/skam-psykologi + 77 %-foreldresurvey — nærmest målgruppen av alle 41 |
| 29 | Gamification/streaks | emosjonell | Analogi-presedens | Duolingo/Finch-case; avvisningen hviler på målgruppe-resonnement (premiss 2 ubevist) |
| 30 | Sikkerhetsinnhold aldri bak paywall | emosjonell | Analogi-presedens | Røde Kors/farevarsel-NORM; operasjonalisert som etikk-krav i entitlement-matrisen |
| 31 | Liquid Glass / iOS 26 | hig | Plattform-/lovkrav | Plattformretning |
| 32 | Systemflate-distribusjon (widgets/LA/StandBy) | hig | Analogi-presedens | 05 §3.5 eksplisitt: «tatt på presedens (Moonlitt/Locket), ikke målt norsk brukeratferd»; infrastrukturen er plattformfakta, adopsjonen er presedens |
| 33 | App Intents / intent-first | hig | Plattform-/lovkrav | Per Sol: infrastruktur, tatt UT av trendpoenggivning; validerer ikke H2 |
| 34 | Progressive disclosure-onboarding | hig | Plattform-/lovkrav | HIG-norm |
| 35 | Content-first navigasjon | hig | Plattform-/lovkrav | HIG/iOS 26-retning |
| 36 | Adaptiv lyspalett (Tide Guide) | hig | Analogi-presedens | Én sjangervinner; vedtas ikke (Sol P1) — utendørsmodus-testen er uprøvd hypotese |
| 37 | Dynamic Type / tilgjengelighet | hig | Tilgjengelighetskrav | Per Sol: kvalitetskrav, tatt UT av trendpoenggivning; doktrinehull uansett hypotese |
| 38 | M3 Expressive dominans-hierarki | hig | Dokumentert brukerfunn | 46 studier / 18 000+ deltakere; leverandørutført (Google), kryssdomene |
| 39 | Iscenesatt latens (seremoni) | hig | Analogi-presedens | HIG-norm + ADA-fravær; Sol: «trendretorikk, ikke årsaksbevis» — én sannferdig «pust» beholdes som hypotese |
| 40 | Maskot i familiesegmentet (Sago Mini) | hig | Analogi-presedens | ADA-vinner-observasjon; målgruppen er barn, ikke voksne |
| 41 | Haptikk som betydningsbærende bekreftelse | hig | Plattform-/lovkrav | HIG-norm; doktrinehull |

### Opptelling

| Klasse | Antall | Andel |
|---|---|---|
| Plattform-/lovkrav | 9 | 22 % |
| Tilgjengelighetskrav | 1 | 2 % |
| **Dokumentert brukerfunn** | **11** | **27 %** |
| Analogi-presedens | 19 | 46 % |
| Uprøvd hypotese (som primær evidensbasis) | 1 | 2 % |
| **Sum** | **41** | 100 % |

### Hva opptellingen betyr (Sols regel: kun brukerfunn kan avgjøre produktmodell)

**11 av 41 er dokumenterte brukerfunn — men null av dem er målt på Babyoras egne brukere, den norske målgruppen eller påkledningsjobben.** De er kategorinivå (paywall-/trial-atferd, anskaffelsesvindu, varsel-opt-in), kryssdomene (alarm fatigue, usikkerhetskommunikasjon) eller leverandørutført (M3E). De setter RAMMER for produktmodellen: paywall-plassering etter verifikasjon (#1), trial-lengdens irrelevans (#2), ~52 % opt-in som hardt tak for varsel-only H3 (#17), anskaffelse før behovet (#11). Men ingen måler kjernespørsmålet — om foreldre vil forskrives (H1), diagnostiseres (H2) eller motta delta (H3). Det er konsistent med aktør×øyeblikk-matrisens 0/35: **produktmodellvalget kan ikke avgjøres av fase 4-researchen; det krever dagbokstudien (premiss 1/3), H2-routeren som måleinstrument og prototypetest mot nullmodellen.** 46 % av oppføringene er analogi-presedens — nyttige som formgivere, ugyldige som bevis for produktmodell.