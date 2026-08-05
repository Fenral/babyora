# MODELL A — «Evalueringsport»

> Fase 6 (Challenge the Business), eierportmateriale. Modelleier: agent A. Bygger på eiervedtaket 2026-07-31 (hard paywall, premiss 6: ÅPEN — akseptert risiko med motkandidatplikt), Sols runde 4-korreksjoner (05, revisjonsblokk pkt. 2–4), abonnement-etikk-appendixen og 7-punkts forbudslisten. Alle tall uten kilde er merket **[hypotese]**; leverandørtall (RevenueCat/Adapty/Nørs) er merket som leverandørpåstander per Nørs-korreksjonen.

## 1. Modellens idé i én setning

Babyora selger verdilaget bak en hard, men **ærlig plassert** mur: brukeren betaler først **etter** at rådet har bevist seg i brukerens eget liv (to relevante situasjoner, senest 14 dager, uten kortforpliktelse) — mens et **operasjonelt gratis sikkerhetsminimum** alltid er tilgjengelig, i alle tilstander, for alltid.

Dette er ikke en oppmykning av eiervedtaket — det er dets sterkeste form. En hard paywall etter én *visning* selger et uverifisert løfte (Flo-mønsteret som får tillitsstraff i egne anmeldelser). En hard paywall etter én *verifikasjon* selger et bevist produkt. RevenueCats egne data (leverandørpåstand) sier at sene konverterere retainer bedre enn dag-0-konverterere — muren blir *sterkere* av å flyttes, ikke svakere.

## 2. De tre bærende konstruksjonene

### 2.1 Evalueringsperioden (ikke StoreKit-trial)

Per revisjonsblokkens pkt. 4: StoreKit har kun faste kalenderprøver, så evalueringen implementeres **app-side, før noe kjøpsobjekt finnes**:

- **Definisjon:** «to relevante situasjoner» = minst ett reelt værskifte **og** én verifisert tur (anbefaling → tur → mikrosjekk-bekreftelse, B6). Kalendertak: 14 dager.
- **Ingen kortforpliktelse, ingen konto.** Lokal-first (premiss 10) betyr lokal teller. Det gjør også at stille trial-til-betalt-konvertering (forbudsliste pkt. 2) er *strukturelt umulig* — det finnes ingenting å konvertere stille.
- **Ærlig telling, aldri nedtellingsteater:** appen viser «1 av 2 situasjoner opplevd», aldri «3 dager igjen!»-press (forbudsliste pkt. 3).
- **Gulvregel (nytt designforslag til eier):** Definisjonen «senest 14 dager» har et etisk hull — en stillestående høytrykksuke kan brenne hele vinduet uten én eneste kvalifisert situasjon. Da møter brukeren muren uten verdibevis, som er nøyaktig det modellen lover å ikke gjøre. Forslag: evalueringen utløper aldri før **minst én** kvalifisert situasjon har inntruffet, med absolutt tak 21 dager. Dette er en endring av portformuleringen og må eiervedtas.
- **Håndhevingssvakhet innrømmes:** uten konto kan reinstall nullstille telleren. Alternativet (DeviceCheck/enhets-fingerprinting) er en personvernavveining som strider mot lokal-first-løftet. Modell A velger bevisst svak håndheving fremfor sporing, og bokfører inntektstapet som etikk-kostnad. **[hypotese: tapet er lite — de som reinstaller for å omgå en 39–99 kr-mur var neppe betalere]**

### 2.2 Operasjonelt gratis sikkerhetsminimum (Nørs-korreksjonens grense)

Revisjonsblokkens pkt. 3 er modellens hardeste krav: *«er den nummererte listen nødvendig for trygg handling, ER listen del av gratislaget.»* En hard block uten den konkrete handlingen er juridisk gratis men praktisk ubrukelig — og da er sikkerheten i praksis bak betaling, som er etikkbrudd.

Grensen trekkes slik, og den er **testbar** (se suksesskriterier):

**Alltid gratis, i alle tilstander (også utløpt, offline, utdatert):**
- Alle hard/soft blocks, TOG-grenser, nyfødt-tidsgrenser, ut-av-scope-deteksjon (feber/sykdom/prematur-gate)
- **Den konkrete trygge handlingen ved hver block**, i farevarsel-anatomi (handling → konsekvens → gyldighetsperiode, MET/Yr-konvensjonen): ikke bare «ikke gå ut nå», men «vent til etter kl. 14 / korngrense: maks 20 min / dekk til ansikt»
- Ni-ords-regelen (AAP «+1 lag») som gratis basisråd — gratislaget skal minst matche nullmodellen (Yr + tommelfingerregel), ellers er det verre enn ingenting
- **Det delte kortet (B4) i sin helhet** — mottaker får full verdi uten konto/installasjon (Partiful-kravet fra distribusjonsrapporten: kortet bak paywall dreper loopen ved første klikk)
- Overoppheting-/nedkjølingssjekkpunkter etter tur (sikkerhetsdelen av mikrosjekken)

**Bak muren (verdilaget):**
- Den fulle, situasjonsspesifikke plagglisten i *normale* forhold (optimalisering, ikke sikkerhet)
- Begrunnelser/kontrolltegn, varighet i anbefalingen (B5), gyldighetsvindu-fornyelse (B12)
- Delta-varsler og widget («to grader kaldere — legg til mellomlaget»)
- Garderobe-lite/substitusjon (B7), planlegg-funksjonalitet (hvis premiss 14 overlever)

**Modellens eksistensielle test, sagt rett ut:** Hvis fagpanelet (premiss 4/5-blindtesten) konkluderer at den fulle plagglisten er *nødvendig* for trygg handling i vanlige norske vinterforhold — ikke bare i block-scenarier — kollapser verdilaget inn i gratislaget, og Modell A mister produktet sitt. Det er ikke en risiko som skal skjules for eier; det er falsifiseringsvilkår nr. 1.

### 2.3 Entitlement-matrisen (Sols krav, portleveranse)

| Tilstand | Vurderingsflate | Hard blocks / sikkerhet | Delt kort | Varsel/widget |
|---|---|---|---|---|
| **Gratis (aldri evaluert)** | Ni-ords-basisråd + invitasjon til evaluering | Fullt, operasjonelt | Kan motta, fullt | Farevarsler: ja. Delta: nei |
| **Evaluering** | Full verdi, situasjonsteller synlig | Fullt | Sende + motta | Fullt |
| **Betalt** | Full verdi | Fullt | Sende + motta | Fullt |
| **Utløpt** | Sikkerhetsminimum + skamfri melding («Sesongen er over — dette kan dere nå» ved graduation; «Verdilaget krever pass» ellers). Aldri skyld, aldri frykt-CTA | Fullt — identisk med betalt | Kan motta fullt; sending viser siste betalte vurdering, aldri stale | Farevarsler: ja. Delta: av |
| **Offline** | Sist beregnede råd MED gyldighetsvindu og tydelig alder-stempel | Cachede grenser gjelder; konservativ degradering | Sist genererte | Fryses med utløp (stale-safe-kontrakten fra H3-vilkåret) |
| **Utdatert (stale)** | Utløpt råd degraderes til sikkerhetsminimum + «sjekk været» — utløpt grønt råd er farligere enn ingen | Fullt | Kortet bærer tidsstempel + utløp synlig for mottaker | Utløpt Live Activity/widget viser aldri gammelt verdikt som gyldig |

Nøkkelprinsipp: **kolonnen «Hard blocks/sikkerhet» er identisk i alle rader.** Det er dette som gjør at helsestasjons-innvendingen kan *besvares* (om ikke vinnes): ingen forelder står noensinne uten sikkerhetsminimum fordi de ikke betalte.

## 3. Paywall-øyeblikket — flyttet, og hvorfor det er forsvar av eiervedtaket, ikke omkamp

Eiervedtaket 2026-07-31: hard paywall etter **én anbefaling**. Modell A flytter muren til **etter første verifikasjonsøyeblikk**: anbefaling gitt → tur gjennomført → mikrosjekk bekreftet («stemte det?») — eller til evalueringens utløp, det som kommer først.

Begrunnelse (fra abonnement-etikk-appendixen):
1. Babyora er et tillitsprodukt der verdien *ikke kan verifiseres på skjermen* — bare ute, med barnet. Mur før verifikasjon = selge et uverifisert løfte (Flo-skrekkeksemplet).
2. RevenueCat (leverandørpåstand): sene konverterere retainer bedre. Muren etter verifikasjon kjøper bedre kunder, ikke bare flere.
3. Randomisert felteksperiment (PMC12217587): konvertering drives av *opplevd verdi*, ikke tidspress. Å la verdien inntreffe før muren er derfor konverteringsoptimalt, ikke bare etisk.

**Plasseringsregler (bindende for design):**
- Muren vises aldri midt i en pågående vurdering, aldri i farevær, aldri i en hard block-situasjon (forbudsliste pkt. 7: barnets sikkerhet er aldri konverteringsagn — heller ikke som *timing*).
- Murskjermen viser hva som ble verifisert: «Rådet stemte for dere 2 av 2 ganger» — kjøpsargumentet er brukerens egen erfaring, ikke vår påstand.
- App Store 3.1.2(c): muren beskriver presist hva som fås (og entitlement-matrisen gjør «hva mister jeg»-listen ærlig).

## 4. Prislogikk — sesongpass primært, månedlig fleksibelt (fase 4-vedtaket forsvart, med én utfordring)

**Primærtilbud: ikke-fornyende sesongpass, 4–6 mnd** (Slopes-presedensen, støttet produkttype i App Store, RevenueCat støtter det).
- Løser H1s graduation-ærlighet: churn ved sesongslutt er *designet utfall*, feiret exit («dere kan dette nå») — ikke tap.
- Oppfyller norsk digitalytelseslov by design (maks 6 mnd binding, total pris synlig, ingen auto-fornyet binding).
- Årsplan mot kjent 4–6 mnd behov er prising mot glemsel = etikkbrudd (forbudsliste pkt. 6, A27). **Ingen årsplan. Ingen lifetime** (behovet er strukturelt tidsavgrenset 0–24 mnd).

**Sekundært: månedlig auto-fornyende** — for episodiske brukere, sen-sesong-startere og de som ikke vil forplikte seg. Kansellering i appen, like lett som kjøp (forbudsliste pkt. 1 + norsk lovkrav). Aktiv-avtale-varsel minst hver 6. mnd.

**Én utfordring til fase 4-vedtaket som er spesifikk for Modell A:** sesongpass-primært betyr at *første* kjøpsbeslutning bak en hard mur er den *største* (sesongpris, **[hypotese: 249–299 kr]**), tatt av en søvndeprivert forelder rett etter verifikasjon. I modell B/C kan brukeren gli inn via små steg; i A er muren binær. Det kan presse konvertering ned eller presse valget mot månedlig (som gir dårligere graduation-ærlighet). Derfor: **premiss 7-eksperimentet (Van Westendorp med innramminger, ikke bare prispunkter) må i Modell A spesifikt teste rekkefølgen sesongpass-først vs. månedlig-først på murskjermen.** 39/99/299-ankrene er og forblir **[hypotese]** — ingen betalingsdata finnes (premiss 7 ÅPEN).

**Plan-presentasjon:** ingen forhåndsvalgt dyreste plan (forbudsliste pkt. 5); totalpris per periode synlig for begge.

## 5. Familieplan — Apple/Google-deling, med et hull ingen har flagget før

Fase 4-vedtak: ADOPT familiedeling (gratis, null arkitektur, lokal-first-kompatibel), REJECT egen multi-seat-plan (krever konto; forskutterer handoff-jobben før 20–25 %-terskelen er målt).

**Nytt funn — kollisjon mellom to ADOPT-vedtak:** Apples Family Sharing gjelder auto-fornyende abonnement og non-consumables — **ikke-fornyende abonnement (sesongpassets produkttype) kan ikke familiedeles.** Google-siden er tilsvarende begrenset. Konsekvens: slik vedtakene står, får bare månedlig-planen familiedeling, mens primærtilbudet ikke får det — altså at den *ærligste* planen straffes. To løsningskandidater til fase 8:
1. Sesongpass implementeres som **non-consumable med app-side utløpsdato i entitlementen** (RevenueCat støtter ikke-abonnements-entitlements med varighet) — non-consumables ER delbare. Må avklares mot App Store 3.1.2 (tjenester over tid «bør» være abonnement; Slopes-presedensen viser at ikke-fornyende aksepteres, men delbarhets-varianten er uprøvd for oss). **[hypotese: gjennomførbart]**
2. Aksepter hullet, og la husholdningsbehovet dekkes av det som uansett er gratis: det delte kortet (B4). Partneren som bare *mottar* vurderinger trenger aldri entitlement — det er H2s «noen andre skal passe barnet»-inngang, og den ligger utenfor muren by design.

Merk også: StoreKit-trials kan ikke deles — men Babyoras evaluering er app-side, så den begrensningen treffer oss ikke. Derimot: uten konto har partnerens enhet sin *egen* evalueringsteller. Det er en feature (partneren kan evaluere selv), ikke en bug, men det skal sies høyt.

## 6. Retention innenfor modellen

- **Innen sesongen:** verifikasjonssløyfen (mikrosjekk B6) + delta-varsler ved værskifte + gyldighetsvindu (B12) gir naturlig puls uten engasjementspress. Gamification/streaks er REJECT (fase 4): redusert bruk kan bety mestring — Modell A måler *verdi per værskifte*, ikke DAU.
- **Graduation som designet exit:** ved sesongslutt sier appen det H1 lover: «dere kan dette nå.» Ingen winback-teater, ingen skyld.
- **Re-aktivering er ærlig og strukturell:** nytt sesongpass ved neste sesong, nytt barn, eller S3-overgang (8–12 mnd endrer behovet, premiss 8). Værutløst re-engasjement ved første kuldeperiode (distribusjonsrapportens re-engasjementsmønster for H1) — men aldri frykt-basert («risiko for overoppheting!» som push er forbudsliste pkt. 7).

## 7. Hva Modell A ærlig taper mot B og C

Mitt mandat er å gjøre eiers valg reelt. Her er kostnadene, uten pynt:

**Mot B (soft/reverse trial-modellen):**
1. **Volum.** Hard paywall filtrerer; den konverterer ikke bedre. RevenueCats 10,7 % vs. 2,1 % download-to-paid er overlevertall med survivor-bias, og helse-/tillitsnære kategorier rapporteres å få 2–3× flere totale abonnenter med soft (leverandørpåstander begge veier). A optimaliserer inntekt per install; B optimaliserer totalbase og word-of-mouth-flate.
2. **Måling.** H2-routerens kjerneverdi er å måle spontan jobbpreferanse *uforurenset*. En kjent, kommende mur forurenser atferden i evalueringen (samme logikk som Sols P0 om paywall i kiletesten). B måler renere.
3. **Sene konverterere.** A mister brukere som ville betalt i uke 6 — de møter muren i uke 2. RevenueCat sier nettopp disse retainer best. A kaster sine beste fremtidige kunder først.
4. **Loop-asymmetri.** Kortet er gratis å motta, men mottakerens *egen* bruk gates raskt. Bs mottakere kan bli fullbrukere før de møter noen mur.

**Mot C (kommunebetalt/Public Safety Utility-modellen):**
5. **Helsestasjonskanalen — Norges sterkeste distribusjonsmaskin — er trolig stengt for A.** Nørs: 101 kommuner, ~85 % av førstegangsfødende, 200 000+ brukere (leverandørpåstander, men retningen er utvetydig), og Rådet for sykepleieetikk protesterer allerede mot premium i kanalen. Selv med operasjonelt gratis sikkerhetsminimum er A en kommersiell app med mur — helsesykepleiere vil ikke anbefale den. A må vinne på ASO (søkevolum **umålt**, skal ikke siteres som fakta) og organisk deling. Det er en smalere og dyrere vei.
6. **Fordelingsprofil.** De som mest trenger presis påkledningsstøtte (lavinntekt, lav helsekompetanse, kaldest boliger) er de mest prissensitive. A gir dem sikkerhetsminimum gratis — men verdilaget, som er *produktets egentlige bidrag*, når dem ikke. C når alle. Dette er en reell samfunnskostnad ved A, og den skal stå i eiers beslutningsgrunnlag.
7. **Legitimitet.** C kan bygge faglig avsender-legitimitet (premiss 4/5) *gjennom* kanalen; A må bygge den alene, utenfra.

**As motsvar (så eier ser begge sider):** A er den eneste av de tre som er bevist selvfinansierende fra dag én uten kommunal anskaffelsesprosess (C: 12–24 mnd salgssykluser mot kommuner, **[hypotese]**) og uten freemium-basens skjulte kostnad (B: majoritet som aldri betaler men koster support/API-kall). A er også den mest ærlige mot brukeren om hva produktet ER: et betalt verktøy, ikke en gratis app som senere skrur til.

## 8. Avhengigheter før porten kan lukkes

- **Premiss 2 (analytics):** uten PostHog-nøkkel er hele funnelet umålbart — Modell A kan ikke engang falsifiseres i dag. Blokker.
- **Premiss 4/5 (fagpanel-blindtest):** avgjør om verdi/sikkerhets-grensen holder (modellens eksistensvilkår).
- **Premiss 7-eksperimentet:** innramminger, ikke bare prispunkter; inkl. sesongpass-først vs. månedlig-først på mur.
- **Fase 8-avklaring:** sesongpass-produkttype vs. familiedeling (pkt. 5-kollisjonen).
- **Eierbeslutning:** gulvregelen for evalueringsutløp (2.1) — endrer portformuleringen «senest 14 dager».

## MODELLKORT
MODELL A — «EVALUERINGSPORT» · Verdihypotese: Betalingsvilje oppstår i verifikasjonsøyeblikket — forelderen betaler for et råd som allerede har bevist seg på deres egen tur, ikke for et løfte; hard mur etter verifisert verdi kjøper færre, men bedre kunder (sene konverterere retainer best — leverandørpåstand, RevenueCat). · Gratisnivå: Operasjonelt gratis sikkerhetsminimum i ALLE tilstander (også utløpt/offline): alle hard/soft blocks, TOG- og nyfødt-grenser, ut-av-scope-deteksjon, den konkrete trygge handlingen i farevarsel-anatomi (handling→konsekvens→gyldighet), ni-ords-basisråd, og hele det delte kortet (B4) for mottakere — er den nummererte listen nødvendig for trygg handling, ER den gratis (Nørs-korreksjonen). · Premium: Full situasjonsspesifikk plaggliste i normale forhold, begrunnelser/kontrolltegn, varighet + gyldighetsvindu (B5/B12), delta-varsler/widget, garderobe-substitusjon (B7). · Prøvetid: Gratis evalueringsperiode app-side (IKKE StoreKit-trial), uten kort/konto: to relevante situasjoner (min. ett værskifte + én verifisert tur), senest 14 dager; ærlig situasjonsteller, aldri nedtelling; foreslått gulvregel: utløper aldri før ≥1 kvalifisert situasjon (tak 21 d, krever eiervedtak); reinstall-reset innrømmes som bevisst svak håndheving fremfor sporing. · Paywall-øyeblikk: Flyttet fra «etter én anbefaling» til ETTER første verifikasjonsøyeblikk (anbefaling+tur+bekreftelse) eller evalueringsutløp; aldri midt i vurdering, aldri i farevær/hard block; murskjermen siterer brukerens egen verifikasjon («stemte 2 av 2»). · Prislogikk: Ikke-fornyende sesongpass 4–6 mnd primært (Slopes-modellen, digitalytelseslov-kompatibel by design) + månedlig auto-fornyende fleksibelt; INGEN årsplan (prising mot glemsel = etikkbrudd), ingen lifetime; 39/99/299-ankere er hypotese til Van Westendorp med innramminger; ingen plan forhåndsvalgt. · Familieplan: Apple/Google familiedeling aktiveres (null arkitektur, lokal-first-kompatibel) — MEN flagget kollisjon: ikke-fornyende abonnement kan ikke familiedeles hos Apple; løses via non-consumable m/ app-side utløp (avklares fase 8) eller aksepteres fordi delt kort (B4, gratis) dekker husholdningsjobben; ingen egen multi-seat-plan før 20–25 %-handoff-terskelen er målt. · Retention: Verifikasjonssløyfe + delta-varsler ved værskifte + gyldighetsvindu innen sesongen; graduation som designet, feiret exit («dere kan dette nå»); re-aktivering strukturelt (ny sesong/nytt barn/S3-overgang); ingen streaks/gamification — redusert bruk kan bety mestring. · Churn-risiko: (1) Stille høytrykksuke brenner evalueringsvinduet uten verdibevis → mur uten verifikasjon (gulvregelen adresserer); (2) filtrerer bort sene konverterere og totalvolum vs. soft (2–3× i helsenære kategorier, leverandørpåstand); (3) diskvalifisert fra helsestasjonskanalen → dyr akkvisisjon på umålt ASO-nisje; (4) eksistensvilkår: kollapser fagpanelet verdi/sikkerhets-grensen, mister modellen produktet.

## ETISKE INNVENDINGER
- Grensedragningen verdi/sikkerhet i et produkt der anbefalingen ER sikkerhetsbærende: hvis den fulle plagglisten trengs for trygg handling i vanlige (ikke bare block-) forhold, ligger sikkerhet i praksis bak betaling. Adressert: operasjonelt-gratis-regelen (nødvendig liste = gratis liste) + fagpanel-blindtest som eksplisitt falsifiseringsvilkår. Innrømmet: skjer dette ofte, er modellen hul — det finnes ingen designfiks, bare modellbytte.
- Evalueringen kan utløpe uten én eneste kvalifisert situasjon (stillestående høytrykksuke) — da møter brukeren muren uten verdibevis, som er nøyaktig løftebruddet modellen skal unngå. Adressert: foreslått gulvregel (utløper aldri før ≥1 kvalifisert situasjon, tak 21 d) — krever eiervedtak fordi det endrer «senest 14 dager»-formuleringen.
- Kjøpspress mot en sårbar, søvndeprivert målgruppe i et usikkerhetsøyeblikk. Adressert: mur aldri i farevær/hard block/midt i vurdering, skamfri tekstdoktrine, ingen nedtelling/confirmshaming/frykt-CTA (7-punkts forbudsliste er bindende), murargumentet er brukerens egen verifikasjon, ikke frykt.
- Fordelingsskjevhet: de som mest trenger presis påkledningsstøtte (lavinntekt, lav helsekompetanse) er mest prissensitive og filtreres bort fra verdilaget. Delvis adressert av gratis sikkerhetsminimum + gratis delt kort; ikke løst — dette er en reell samfunnskostnad ved A som C ikke har, og den skal stå åpent i eiers beslutningsgrunnlag.
- Helsestasjonsdiskvalifikasjon: A kan ikke ærlig søke kanalen og samtidig ha mur (Rådet for sykepleieetikks protest mot Nørs+). Adressert ved å IKKE late som: A holder seg bevisst utenfor kanalen i stedet for å smyge premium inn i en gratis helsetjeneste.
- Håndheving av evalueringen uten konto: sterk håndheving krever enhetssporing (DeviceCheck) som bryter lokal-first-løftets ånd. Adressert: bevisst valg av svak håndheving fremfor sporing; inntektstapet bokføres som etikk-kostnad. Innrømmet: udokumentert antagelse om at tapet er lite [hypotese].
- Familiedelings-hullet: primærtilbudet (ikke-fornyende sesongpass) kan ikke familiedeles hos Apple — den ærligste planen straffes, og en husholdning kan ende med å måtte kjøpe to. Adressert: to løsningskandidater flagget til fase 8 (non-consumable m/ app-side utløp, eller delt-kort-dekning); ikke vedtatt løst.

## SUKSESSKRITERIER
- Konvertering ved verifisert mur: ≥8 % av brukere som fullfører to kvalifiserte situasjoner kjøper innen 7 dager etter mur [hypotese-terskel — kalibreres mot RevenueCats 10,7 % download-to-paid, som er leverandørtall med survivor-bias]. Falsifisering: <4 % etter ≥200 fullførte evalueringer → paywall-plasseringen eller verdilaget er feil; modell A REVIDERES.
- Evalueringsfullføring: ≥60 % av påbegynte evalueringer når to kvalifiserte situasjoner innen kalendertaket. Falsifisering: <40 % (og frafallskoding viser vær-stillstand, ikke UX-friksjon) → hendelsesdefinisjonen er feil dimensjonert; gulvregelen må vedtas eller situasjonskravet senkes.
- Verifikasjonskvalitet (forutsetning for å i det hele tatt selge): ≥80 % av mikrosjekker svarer «stemte» [hypotese-terskel, avhenger av premiss 5-blindtest]. Falsifisering: <70 % → produktet er ikke klart for noen betalingsmodell; muren fryses (å selge et råd som ikke stemmer er verre enn å ikke selge).
- Sikkerhetsminimum-testen (eksistensvilkår): fagpanel (≥2 fagpersoner, nulltoleranse falsk grønn, premiss 4/5-protokollen) bekrefter at gratislaget ALENE muliggjør trygg handling i samtlige hard-block-scenarier i scenariokorpuset. Falsifisering: fagpanelet krever verdilagets fulle liste for trygghet i >0 block-scenarier → listen flyttes til gratis; kreves den i vanlige forhold → modell A FALLER.
- Loop-overlevelse under mur: delt-kort-sending ≥5 % ukentlig blant aktive (premiss 9-MVH-terskelen), målt separat i evaluerings- og utløpt-tilstand. Falsifisering: utløpt-tilstand deler <½ av betalt-tilstand → muren dreper loopen indirekte og distribusjonskostnaden ved A er undervurdert.
- Prisinnramming (premiss 7-eksperimentet): ved fri presentasjon uten forvalg velger ≥50 % sesongpass fremfor månedlig [hypotese]. Falsifisering: <30 % → sesongpass-primært re-vurderes som murens førstetilbud (månedlig-først med sesongpass som ærlig oppgradering).
- Sikkerhetsmetrikk (må aldri forverres): andel brukere i utløpt tilstand som eksponeres for hard-block-situasjon og får operasjonelt råd = 100 % i entitlement-testing; null tilfeller av «app grønn / fagperson rød» (ett bekreftet tilfelle stanser alt, jf. kill-switch i 04). I tillegg: ingen målbar økning i evaluerings-frafall i farevær-perioder (muren skal aldri møtes i farevær — 0 forekomster i event-logg).
- Målbarhets-forutsetning: PostHog-analytics (premiss 2) er live FØR modellen dømmes — ingen av tersklene over kan leses uten; inntil da er samtlige tall hypoteser og porten kan ikke lukkes på modell A.