# Babyora-invarianter — komprimering av fase 5-korpuset (97 prinsipper → 12 invarianter)

**Kilder:** `C:/Users/siver/Downloads/trainer-marketplace-master1/babyora/docs/design-lab/06-mobbin-research.md` + `appendix/fase5/onboarding-kontekst.md`, `resultat-transisjon.md`, `familie-deling.md`, `paywall-premium.md`, `gap-triage-korrigering.md`, `gap-laseskjerm-verifier.md`. Bindende krav: `appendix/fase5/sol-review-svar-fase5.md` (runde 5).

**Evidensmerking (regler som før):**
- **(a)** = belagt i ≥3 uavhengige kilder på tvers av kategorier — etablert mekanisme
- **(b)** = belagt i 1–2 kilder eller via domeneanalogi — bærer hypotesestatus
- **(c)** = lab-internt krav / utledet uten atferdsbelegg — må testes i fase 7

**Sols fellingsregel er anvendt gjennomgående:** Flightys «maks tre linjer», Citizens faste eskaleringslinje-plassering, Stakes tappbare setning og Life360s Bubble-utløp behandles som *spesifikasjoner* der tall, plassering eller grammatikk ellers ville arves. Invarianten beholder kun mekanismen; alle eksakte tall fra én app er tilbakeført til hypotese. Et ekte prinsipp under skal tåle en helt annen visuell implementasjon — testen er brukt på hver enkelt invariant.

---

## DE 12 INVARIANTENE (med kopi-audit)

### INV-1 — Rådsgrammatikken: forhold → konsekvens → plagghandling; handlingen dominant, rådata demotert **(a)**
- **Kilder:** komoot Tips-boks, AllTrails konsekvenssetning, Apple Weather («Wind is making it feel cooler»), Nike Run Club UV-kort; konvergerer med fase 4-vedtaket (MET/Yr-anatomien) og Clues ACOG/WHO-fotnoter (faglig avsender i forbrukerflate).
- **Mekanisme:** rådet fjerner brukerens egen oversettelsesjobb fra data til handling; autoritet flyttes fra tall til utsagn med faglig avsender. Én dominant innsikt per flate (M3-dominans).
- **Domeneavvik:** hele kildekorpuset er friluft/rådgivende for motiverte voksne («consider wearing…»); Babyora er sikkerhetsbærende rutine under tidspress, feilkost er et kaldt barn. Komoot beviser at formen kan presenteres kommersielt — ikke at den er faglig riktig eller forstås under tidspress (Sols P2-forbehold står).
- **IKKE kopieres:** komoots hedging-tone, engelsk setningsbygg, Wherings stumhet (antrekk uten begrunnelse og uten sikkerhetslag), værdashboard med rådata som hovedform.
- **Babyora-transformasjonen:** norsk klarspråk i deklarativ form med faglig avsender og synlig kilde; grammatikken er medium-uavhengig — den skal fungere identisk som tekstkort, opplest råd og fysisk sjekkliste (Protokollen-retningen). Rådata alltid tilgjengelig, alltid ett nivå bak.

### INV-2 — Svaret eldes ærlig: deklarert ferskhet og absolutt gyldighet i selve svaret **(a)**
- **Kilder:** Apple Weather («until 5 PM»), Dot («updated every night»), Bump ferskhetsstempel, Yahoo Finance as-of + tilstandskvalifikator, DoorDash/Bolt absolutte ankomstvinduer, Lumy dobbeltform (relativ + absolutt), Tesla per-verdi-aldersstempel — også i triagekontekst.
- **Mekanisme:** på flater OS-et ikke selv oppdaterer forblir kun absolutt tid sann mens den eldes; relativ tid fryser til løgn. Ferskhet er del av beslutningsgrunnlaget, ikke metadata — på en sikkerhetsnær flate er foreldet data farligere enn manglende.
- **Domeneavvik:** transport-/leveransekorpuset tåler støy fordi feilkost er forsinkelse; Babyoras utløp må utløse synlig degradering, ikke bare et stempel som eldes videre.
- **IKKE kopieres:** Life360s «Your Bubble will pop at 6:40 pm» som mekanikk/copy (spesifikasjon — kun mekanismen «deling/gyldighet er en tilstand med sluttidspunkt» overføres), Moonlitt-nedtelling som eneste form, naken relativ nedtelling (Blinkit/Swiggy-formen).
- **Babyora-transformasjonen:** utløp er en tilstandsovergang: rådet mister påstandsstatus og viser eksplisitt «må beregnes på nytt» i degradert form — ingen referanseapp degraderer sitt eget svar. Samme regel på widget, kort, delt handoff-kort. At stempelet faktisk hindrer bruk av foreldet råd er fortsatt hypotese (Sols antakelse 6) — invarianten er at ærlig aldring er formkrav, effekten må måles.

### INV-3 — Proveniens er en kvittering med svakeste premiss — aldri seremoni **(a)** for begge ledd
- **Kilder:** Cleo («Based on your answers»), Yahoo/NAVER as-of-blokk, Mercedes-skillet (sist sjekket vs. påstand), Lightyear («based on 39 analysts»), Clue-fotnoter. Negativt belegg: 10/10 treff på iscenesatt beregning finnes KUN i éngangs-onboarding, aldri i daglig loop.
- **Mekanisme:** tillit bæres av synlig inputgrunnlag, ikke demonstrert anstrengelse. Sols korreksjon er innarbeidet som del av invarianten: proveniens alene kan bygge *blind* tillit — kvitteringen må bære grunnlag + svakeste premiss + gyldighet, ikke bare datamengde.
- **Domeneavvik:** referanseappene viser proveniens for kredibilitet/salg; Babyora viser den for etterprøvbarhet og *kalibrert* tillit (antakelse 8 — må testes at den ikke bare øker tillit).
- **IKKE kopieres:** Flos «Creating your personal program… 29 %», partikkel-/spinnerteater, Cleos tallscore («63 out of 100»), og — etter Sols felling — skjelett-rendering når svar og data alt finnes (det simulerer lasting). Skjelett kun for faktisk asynkrone data.
- **Babyora-transformasjonen:** kvitteringen navngir svakeste premiss eksplisitt («usikrest: vindmålingen») — finnes ikke i noen referanseapp. Formen tåler ren tekst, tale og print; den er innhold, ikke komponent.

### INV-4 — Usikkerhet er førsteklasses: navngitt intervall, asymmetrisk beskyttelse av kald side — intervallform **(a)**, asymmetri **(c)**
- **Kilder:** Opendoor intervall-som-overskrift, Zillow navngitt range, N26 tre klarspråk-scenarier, Monzo «Likely range» med egen legendepost + ærlighetslinje, Grab «8:15–8:30 · On time», Klarna normalbånd, Lightyear Low/Target/High med proveniens.
- **Mekanisme:** intervallet forhindrer falsk presisjon; et *navn* gjør usikkerheten omtalbar for brukeren. Normalitetsbånd («dette er vanlig januarvær») beroliger uten å alarmere.
- **Domeneavvik:** finansintervaller er symmetriske og tåler at brukeren gambler på ytterpunktet; Babyoras feilkost er asymmetrisk — kald ende skal ha friksjon, ikke glans. Ingen referanse viser asymmetrisk intervall: dette er Babyora-eid terreng.
- **IKKE kopieres:** Crypto.com-kurven som visuelt belønner ytterpunktet, Blooms oppside-salg med forbehold i småskrift, punktestimat med skjult range — og «~40 i stedet for ~60 min»-tallene, som etter Sols felling er hypotese inntil en validert tidsmodell finnes (konkret scene: ja; numerisk presisjon uten modell: nei).
- **Babyora-transformasjonen:** intervallets to ender behandles ulikt funksjonelt og visuelt (varm ende justerbar, kald ende beskyttet); forbeholdet har samme typografiske rang som løftet. Dette er kjernen i Confidence Instrument-retningen.

### INV-5 — Korrigering skjer i rådets egne premisser, i barnets valuta, med deklarert omfang **(a)** for formene, **(c)** for modellkoblingen
- **Kilder:** Stake (premiss som del av rådet), Wealthfront («My assumptions» + håndtak på grafen + undo), Apple Fitness («just for today … does not affect your schedule»), Google Maps («Fastest, despite much heavier traffic» + constraint-chips), Kakao T/Apple Maps (alternativ som likeverdig kort i samme enheter), Realtor.com (modelluenighet vist åpent), Peloton/Tempo («har ikke utstyret» som førsteklasses valg).
- **Mekanisme:** når overstyringen står ved siden av rådet, målt i samme valuta, senkes korrigeringsterskelen og tilliten kalibreres; rådet som innrømmer motargumentet blir troverdig; scoping hindrer at en dagskorrigering stilltiende muterer modellen.
- **Domeneavvik:** korpusets korrigering er preferanse (rute, sparing); Babyoras er sikkerhetsrelevant og mater motoren — skillet dagsoverstyring vs. barneprofil-endring må være eksplisitt i selve kontrollen.
- **IKKE kopieres:** Stakes bokstavelige tappbare-setning-layout (spesifikasjon per Sols felling — mekanismen «korriger premisset der rådet står, ikke i separat skjema» tåler f.eks. fysiske lag-brikker eller en kroppssone-flate), slider-som-salgsprojeksjon, alternativ gjemt bak «avansert», Tempos substitusjon-som-salgsflate.
- **Babyora-transformasjonen:** hver antakelse er et håndtak i barnets valuta (varmegrad/tid ute — aldri poeng); «har ikke plagget» er en premisskorrigering med substitusjonsforslag, aldri feilmelding eller kjøpsanledning; hver overstyring kvitteres med hva den IKKE endret.

### INV-6 — Delta er en handlingsutløser med synlig referansepunkt — aldri dom **(a)**
- **Kilder:** Fi («vs. i går» med begge kurver synlige), Zomato («Delivered 1 min early»), Flightys avvik-fra-forventning, Strava/Bevel normbånd fra egen baseline (beskrivende, ikke evaluerende), Klarna «typical».
- **Mekanisme:** endring-fra-forventning er den informasjonsbærende enheten på null-input-flater; referansepunktet må stå i kortet for at forelderen skal kunne etterprøve; normbånd fra egen historikk beskriver uten å dømme.
- **Domeneavvik:** transport/finans-delta evaluerer ytelse mot mål; Babyoras delta gjelder vær og kontekst — aldri en evaluering av gårsdagens valg eller barnet. Sols antakelse 3 (delta forstås uten gårsdagens grunnlag) er fortsatt ubevist.
- **IKKE kopieres:** GO Clubs skam-delta («96 % lower than yesterday» i rødt), finans-pil+prosent som karakter, streaks/flammer, tallscore — og Flightys «maks tre linjer» som tall (spesifikasjon → hypotese; invarianten er kortformen *tilstand + endring + tidsbundet neste handling, aldri hele bildet*, uansett linjetall).
- **Babyora-transformasjonen:** delta formuleres alltid som neste handling («legg til mellomlaget»), fungerer i varsel, widget og tale, og kan være routerens første inngang (Cleo-inversjonen) — delta og valgflate er ett system, ikke konkurrenter.

### INV-7 — Situasjonsinngangen er en dør uten forpliktelsesvekt; valgrommet krymper med stress **(b)** — router-som-hjem er udokumentert terreng
- **Kilder:** Expensify/Opendoor/Clue (jobb-formulering + «explore later»/«change any time»), Burger King/(Not Boring) Vibes (router-som-hjem), Cleo (utsagns-router), Glovo/Gojek (antimønster: meny), Me+/Netflix/Google Maps/Airalo (én beslutning per skjerm, jeg-stemme, «Only tap if it's safe to do so»).
- **Mekanisme:** innganger i brukerens jobbspråk fjerner oversettelseskostnad; reversibilitetssignatur fjerner valgets forpliktelsesvekt; under tidspress synker kognitiv kapasitet — færre og større valg, formulert som gjenkjennelse, ikke oversettelse.
- **Domeneavvik:** korpusets routere er nesten alltid engangs-onboarding; permanent router-som-hjem har tynt belegg (kun Burger King/Vibes) — reell designrisiko som skal sies høyt i fase 7, ikke en bekreftet konvensjon. Tallene «maks 4 innganger», «2–4 under stress», «maks 2 oppfølgingsspørsmål» er korpus-arvede → **hypoteser**, ikke spesifikasjoner.
- **IKKE kopieres:** superapp-menyen, «Who's watching»-profilveggen (Netflix-premisset — barnet holder enheten — er fraværende; mønsteret er dessuten Mobbin-overrepresentert), quiz-forgreining.
- **Babyora-transformasjonen:** inngangene er situasjoner i forelderens språk og er representasjons-uavhengige — de kan realiseres som knapper, som delta-utsagn med to utganger, eller som fysisk valg (plagg/kroppssone i Physical-first-retningen). Flerbarnsbytte er filter i flaten, aldri vegg foran beslutningsøyeblikket.

### INV-8 — Minste informasjon før første trygge svar; systemet påstår, brukeren korrigerer unntaket **(a)** for mønstrene, **(c)** for p75 ≤ 8 s
- **Kilder:** (Not Boring) Weather/Transit/Tide Guide (én tillatelse + begrunnelse + tillitslinje), IMDb, Credit Karma (inline-spørsmål i kontekst), Hyundai Card-inversjonen (av-hak unntaket), Life Reset to-spor, foodpanda progressiv utdypning, QUITTR/NRC/Fi/Liven (tapp ER innsending, Skip synlig), Grab-rating på låseskjermen, Fitbit («Track live» vs. «Manually log»).
- **Mekanisme:** hver friksjon før svar koster beslutningstid; bevisbyrden flyttes til systemet — brukeren bekrefter eller retter i stedet for å registrere; første tapp er alltid komplett, utdypning er frivillig andreetasje; sanntid («vi går ut nå») og etterkant («hvordan gikk det») er to grammatikker med hver sitt hastighetsbudsjett.
- **Domeneavvik:** korpusets feedback er NPS om appen; Babyoras verifier er sikkerhetsdata om virkeligheten — krever skyldfri «vet ikke»/Skip, aldri engagement-optimalisering. Sols korreksjon er innarbeidet: «én tillatelse + ett felt» er ikke et magisk tall — testen er *minste informasjon før første nyttige og trygge handling*.
- **IKKE kopieres:** arvede tall (to felt, tre fullbredde-knapper, 8-sekunders-estimatene er layout-utledet — må måles i felt), tastatur på defaultbanen, submit-knapp etter entydig valg, obligatorisk andrespørsmål før lagring, alt-i-ett-ark, konfetti, uoppdagbare gester som eneste inngang.
- **Babyora-transformasjonen:** verifieren kan bo på den distribuerte flaten (notification action / terminal Live Activity) og fjerne hele app-åpningskostnaden; smart default forplikter modellen — mønsteret møter kravet bare hvis defaulten treffer ≥p75, så UI-krav og prediksjonskrav er ETT krav med måleplikt.

### INV-9 — Sikkerhetskjernen er alltid gratis, alltid rendret, aldri konverteringsagn **(a)** for antimønstrene, **(c)** som B-ramme-forpliktelse
- **Kilder:** Apple News (soft-gating ved intensjon), Tide Guide (familiedeling som iCloud-toggle + restore-blokk), Oportun (utløp som nøytral tilstandsmaskin), timespent/one year (ærlighet som verdiargument), Fuse/Photoroom (teller på statusflate). Antimønstre: Feeld, Headway, foodpanda, DoorDash, Peanut, Bloom, Flighty PRO-Live-Activity.
- **Mekanisme:** betalt verdi skapes i bekvemmelighetslag (historikk, koordinering, personalisering) mens beslutningsinformasjonen forblir komplett gratis — ellers blir barnets sikkerhet konverteringsagn og tilliten (målet er REKKEVIDDE OG TILLIT) brenner. Gating skjer per verdilag ved intensjon, aldri ved appinngang; sikkerhetsbærende innhold kan aldri være det blurrede.
- **Domeneavvik:** hele paywall-korpuset er anglo-amerikansk B2C-konvertering; Nørs-modellen (invertert betaling) finnes ikke på Mobbin — korpuset kan ikke avgjøre Babyoras forretningsmodell, kun formene.
- **IKKE kopieres:** pass-som-skjult-abonnement (Feeld), tapslister ved utløp, manipulert cancel-hierarki, countdown-rabatt, per-uke-maskering, teller i beslutningsøyeblikket, premium-gating av sikkerhetsbærende låseskjermflate, sosial proof som bevisform.
- **Babyora-transformasjonen:** utløp/graduation er designet utfall («dette kan dere nå» + sikkerhetslaget består alltid); engangskjøp har eget språk og eget visuelt spor; den hendelsesbaserte trialen er udokumentert terreng (hypotese) der kun anatomien løfte→påminnelse→beslutningspunkt arves, med 14-dagerstaket som kommuniserbar dato.

### INV-10 — Verste-utfall-utgangen er alltid forutsigbart til stede, og virkeligheten går foran appen **(a)** for fast utgang + fysisk-først, **(b)** for resten
- **Kilder:** CVS Health (nødlinje på hvert triagesteg), Citizen (synlig under pågående hjelp), Lime, Cuvva («sikre deg selv»-liste FØR kontaktknapp), Wysa (gradert fallback: «Can't make a call?»), Apple Health (deklarert feilmargin + angrevindu).
- **Mekanisme:** under stress må den dyreste utgangen ha null søkekostnad — forutsigbar tilstedeværelse gjennom hele flyten; appen anerkjenner eksplisitt at den er sekundær til fysisk handling (barnet først, appen etterpå); automatikk deklarerer sin feilmargin og gir angrefrist før irreversibel handling; panikkdesign antar at primærhandlingen kan være utilgjengelig.
- **Domeneavvik:** korpuset er USA/911-akutt og engangs; Babyora er gjentatt hverdagsbruk med norsk 113/116117-konvensjon. Citizens *omvendte samtykke* (eskalering som default) er etter Sols felling **forkastet** for daglig bruk (alarmtretthet, helseangst, autoritetsoverføring) — beholdes maks som hypotese i et reelt akuttscenario.
- **IKKE kopieres:** Citizens faste linje som plasseringsspesifikasjon (prinsippet er forutsigbar tilstedeværelse, ikke «nederst» — per Sols felling), fryktøkonomien (nærhetsstatistikk, member stories), countdown-estetikk uten reell klokke, sikkerhetshjelp bak premium.
- **Babyora-transformasjonen:** stoppkriteriet bygges inn i rådets egen grammatikk (Protokollen-retningen: neste handling → kontrollpunkt → stoppkriterium) i stedet for et separat SOS-lag — ingen forbrukerapp i korpuset gjør stoppkriteriet til del av selve anbefalingen.

### INV-11 — Handoff er en tidsavgrenset, lukket sløyfe med minste meningsfulle last **(a)** for kontofritt mottak, **(b)** for sløyfen — ingen ekte forgjenger finnes
- **Kilder:** lululemon («They don't even need an account!» + QR), Mozi (preview + web-lenke), Google Maps (to ambisjonsnivåer), Flo («What your partner can see»), GoHenry (rettighetsliste før relasjon), Character AI (aggregat deles, innhold privat), Life360 (utløp + hendelsesvarsler), Google Photos (gjensidighetssteg), Instacart (aksept argumenterer i mottakerens interesse).
- **Mekanisme:** kontofritt mottak fjerner adopsjonsporten; synlighetskontrakt før sending bygger avsendertillit; utløp gjør deling til en tilstand med sluttidspunkt, ikke en evig relasjon; retursløyfen (B6: «det gikk bra / hen frøs») gjør handoff toveis og gir motoren verifikasjonsdata; kortet bærer antrekk + gyldighet + én kontaktvei — aldri barnets fulle profil.
- **Domeneavvik:** den nærmeste analogien (barnevakt-/barnehage-handoff) finnes ikke i Mobbin — dokumentert hull. Sols P1 står: mottatt→forstått→akseptert→utført→oppdatert/revokert, versjonskonflikt og to omsorgspersoner som endrer premissene er udekket terreng. Closed-loop Briefing-retningen er derfor hypotesebygging, ikke konvensjonsanvendelse.
- **IKKE kopieres:** Life360s Bubble-mekanikk/copy og overvåkningsrelasjonen (kun utløpsmekanismen og hendelsesvarslene overføres), Flos paringsport (app-nedlasting + kode før verdi), GoHenrys kontraktstone for episodiske aktører, Netflix-veggen, konfetti ved fullført handoff.
- **Babyora-transformasjonen:** kortet bærer versjon, mottaks-/korrigeringsmulighet uten konto og endringssignal — «sett» ≠ «forstått». Ingen referansekort i korpuset har versjonssignal eller forståelsesbekreftelse; dette er Babyora-eid.

### INV-12 — Én kanonisk representasjon på alle flater; den distribuerte flaten er handlingsflate med livssyklus **(a)** for kontinuitet, **(b)** for terminal kvittering
- **Kilder:** Gopuff/Instacart (identisk stasjonsbane på Live Activity, Dynamic Island og låseskjerm), Tide Guide (samme kurve i widget og app), Zomato (terminaltilstand med absolutt stempel + delta), Grab (rating direkte i låseskjermflaten), Bump («Respond» i varselet), Flighty (Extensions-hub: én sannhet, mange flater).
- **Mekanisme:** identisk representasjon gjør app-åpning til zoom, ikke kontekstbytte (null re-orientering); jobbens livssyklus avsluttes med kvittering, aldri stille forsvinning; én-tapps handlinger kan bo på flaten selv; hvert ikke-kritisk varsel forbruker tilliten som gjør de kritiske trodd.
- **Domeneavvik:** kontinuitetskorpuset er leveranse/transport der avbrutte løp og støy tåles; Babyoras oppdateringsfrekvens og fallback må settes av risikomodellen, og låseskjermnærværet er reservert sikkerhetsinformasjon.
- **IKKE kopieres:** stasjonsbane-ikonografien selv, PRO-gating av Live Activity (INV-9), kampanje-/curiosity-varsler («New insight! What is it?»), relativ nedtelling på ikke-selvoppdaterende flater (INV-2).
- **Babyora-transformasjonen:** den kanoniske formen er Babyoras egen (f.eks. gyldighetsbue/lagfigur), definert én gang og gjengitt 1:1 overalt; terminalfasen av turens Live Activity bærer verifieren (kobler INV-8) — «turen endte 14:32, anbefalingen holdt: passe / for varm / for kald».

---

## KLASSIFISERING AV RESTEN (Sols krav: eksplisitt)

### Eksempler (illustrasjoner av invariantene — ikke selvstendige prinsipper)
komoot-tipsboksen, AllTrails-setningen, Whering-komposisjonen (én dag, ett svar), Timepage-tidslinjeveven, Headspace-sekvensen, Co-Stars tekstflate, Fitbit/Withings «få ferdigvalgte elementer», Peloton «No equipment, no problem», Vocabulary-togglen og N26s påminnelsestrapp, Strava-beroligelseslinjen, Oportun-tilstandsmaskinen, Tide Guide-togglen, Kit/Acorns/Greenlight-filtermønstrene, Instacart/Abode-akseptskjermene, Deezer-overlay, Lumy-dobbeltformen, Hyundai Card-inversjonen, Fuse-telleren, Wysa-fallbacken, Tesla-skissen, Airalo-jeg-stemmen. Alle siteres videre kun som *belegg for en invariant*, aldri som mal.

### Hypoteser (må testes i fase 7 — ingen kan siteres som bevis)
1. Router-som-permanent-hjem slår direkte svar (tynt belegg: kun Burger King/Vibes).
2. Alle arvede tall: «maks 4 innganger», «2–4 under stress», «maks 2 oppfølgingsspørsmål», «maks tre linjer», «to felt i onboarding», «tre fullbredde-knapper», p75 ≤ 8 s-estimatene (layout-utledet, ikke målt).
3. Én-hånds-/tommelsone-funnene (layout-utledet — egen prototypetest).
4. Spatial triage på barnefigur (Sols felling: representasjonsrisiko i ÉN prototype — falsk medisinsk presisjon + motorisk belastning).
5. Omvendt samtykke — kun i reelt akuttscenario, aldri daglig (Sols felling).
6. Hendelsesbasert trial (ingen lært konvensjon finnes; kun anatomien arves).
7. Konsekvensscener med tall («~40 i stedet for ~60 min») — avvist inntil validert tidsmodell; scenen uten falsk presisjon beholdes.
8. Skjelett-først — revidert per Sols felling: vis svarets struktur umiddelbart, fyll kun faktisk asynkrone data.
9. At ferskhetsstempel hindrer bruk av foreldet råd; at proveniens kalibrerer (ikke bare øker) tillit; at delta forstås uten gårsdagens grunnlag; at alternative kort reduserer overtiltro uten valgparalyse.
10. Hele closed-loop-handoffens stegkjede (mottatt→forstått→utført→revokert) — udokumentert terreng.
11. Brukerstilt alarmbudsjett (Timepage-terskelen) — form finnes, terskler må settes av risikomodellen.
12. Slopes-presedensens kjøpsskjerm (finnes ikke i bildematerialet — verifiseres i appen før fase 6-porten).

### Forkastede kopier (bindende — skal ikke gjenoppstå i fase 7)
Quiz-til-gissel (Calm Sleep/Ahead/Life Reset) · iscenesatt beregning i daglig loop (Flo-spinner + hele 10/10-korpuset) · skam-delta og evaluerende pil/prosent/score (GO Club, Copilot, Cleo 63/100) · streaks og prestasjonspress (Mindvalley, Life Reset «Don't screw it») · countdown-rabatt (Peanut) · pass-som-skjult-abonnement (Feeld) · tapslister ved utløp (Headway) · manipulert cancel-hierarki (foodpanda/DoorDash) · per-uke-prismaskering · fullskjerms profilvegg (Netflix-klassen) · substitusjon-som-salgsflate (Tempo) · sosial proof-vegg (Bloom) · Citizens fryktøkonomi · sikkerhetsminimum bak betaling (Citizen Premium, Flighty PRO-Live-Activity) · naken relativ nedtelling utenfor Live Activity · tastatur på defaultbanen · submit etter entydig valg · alt-i-ett-registreringsark · låseskjerm som kampanjeflate/curiosity-gap · uoppdagbare gester som eneste inngang · konfetti ved hverdagshendelser · triageform brukt i konverteringsøyemed (QUITTR) · falsk hastverk uten reell klokke · Life360s overvåkningsrelasjon som delingsmodell.

---

## Kobling til fase 7-kandidatene (til orientering for retningsarbeidet)
- **Protokollen:** bæres av INV-1, INV-10, INV-2 (grammatikk + stoppkriterium + gyldighet).
- **Confidence Instrument:** bæres av INV-4, INV-3, INV-5, INV-6 (asymmetrisk intervall + svakeste premiss + korrigerbarhet + delta).
- **Closed-loop Briefing:** bæres av INV-11, INV-2, INV-12 (sløyfe + utløp + kanonisk form på mottakerflaten).
- **Physical-first Layering:** bæres av INV-7, INV-8 (+ spatial triage-hypotesen) — og er retningen som bevisst bryter kort/chip-grammatikken alle 12 invariantene ellers må bevise at de tåler.

Husk Sols originalitetsport for fase 7: maks tre lånte primitiver, én Babyora-eid kjerneinteraksjon og én eksplisitt anti-referanse per retning — og hvis en reviewer kan navngi kildeappen fra skjermen, faller retningen. Invariantene over er formulert nettopp for å overleve den porten: hver enkelt tåler en helt annen visuell implementasjon enn kildene sine.

**Regnskap:** 97 innsamlede prinsipper (68 + 29) → 12 invarianter, ~21 navngitte eksempler, 12 hypotesegrupper, 24 forkastede kopier. Ingen rest er uklassifisert.