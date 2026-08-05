# Hypotese: KOORDINERING — «sørg for at alle som passer barnet gjør samme vurdering»

**Design Lab fase 2 (User Reality) — hypotesearbeid, 2026-08-05.**
Dette er hypoteseutvikling, ikke brukerresearch. Vi har null brukerdata (analytics er bekreftet død, audit funn 1). Hver påstand er merket **(a)** belagt i repo/faglitteratur, **(b)** testbar antakelse, eller **(c)** ren spekulasjon.

---

## 1. Hypotesen formulert uten appfunksjoner

> Det underliggende problemet er ikke «hva skal barnet ha på?», men «hvordan sikrer jeg at *alle* som kler barnet gjør samme vurdering som jeg ville gjort — uten at jeg må stå over dem?» Verdien ligger i overførbarheten av vurderingen, ikke i vurderingen selv.

Dette er Sols «Omsorgshandoff»-retning (sol-review-svar.md, «Alternative retninger» #3) og hans observasjon under «Hva Claude ikke har vurdert»: *«Den mest betalingsverdige jobben kan være å gjøre beslutningen overførbar til partner, besteforelder eller barnehage – ikke å hjelpe den mest erfarne forelderen.»* **(a — belagt i review-dokumentet som hypotese, ikke som bevist funn.)**

Hypotesen snur produktlogikken: dagens produkt optimaliserer for den mest kompetente brukeren (primærforelderen som allerede åpner appen 3–8 ganger daglig per PRODUCT.md — et tall som selv er ubelagt). Koordineringshypotesen sier at primærforelderen *minst* trenger rådet — hen har allerede internalisert mønstrene (Sols «graduation»-risiko) — men *mest* trenger at andre treffer samme nivå.

### Hvorfor hypotesen er strukturelt attraktiv

1. **Den løser graduation-problemet.** Sol påpeker at et godt læringsprodukt destruerer sitt eget behov (utfordret premiss #19). Koordinering eldes annerledes: selv når mor har lært alt, har farmor ikke. Hver ny omsorgsperson nullstiller behovet. **(c — logisk plausibelt, ikke belagt.)**
2. **Den er udekket av konkurrentene.** Sols reelle konkurrentliste (værapp, tommelfingerregel, besteforelder, ekstra plagg i vesken) løser alle *individuell* vurdering. Ingen av dem overfører vurderingen — bortsett fra én: en tekstmelding. Det er den egentlige konkurrenten (se §6). **(a for konkurrentlisten / c for udekket-påstanden.)**
3. **Repoet peker allerede hit uten å levere.** Familie er en av tre faner; PRODUCT.md definerer besteforeldre/omsorgspersoner som sekundærbrukere; paywallen *lovte* «Del med alle som passer barnet» før Sol P0-4 tvang det ut (`paywall-copy.ts:140-143`); `CareCircle`-komponenten tegner barnet omringet av omsorgspersoner med status «Deler» — drevet av hardkodet preview-data (`InnstillingerScreen.tsx:1157`). Produktet har med andre ord *intuert* koordineringsbehovet gjentatte ganger, men aldri bygget det. **(a — alt verifisert i kode.)** Det kan tolkes to veier: som signal om ekte behov, eller som ren feature-fantasi. Repoet kan ikke skille dem.

---

## 2. Scenariene — tre svært ulike handoff-typer

Norsk kontekst gjør denne hypotesen mer interessant enn i de fleste markeder: to-inntektsnorm, øremerket fedrekvote som flytter primæromsorg mellom foreldrene midt i barnets første leveår, og nær universell barnehagestart rundt 12 mnd. **(a — allmenn norsk velferdsfakta, ikke belagt i repo; eksakte kvoteuker o.l. må sjekkes før bruk i copy.)**

### 2.1 Partner (symmetrisk handoff)

- **Situasjon:** begge er kompetente i prinsippet, men én har som regel akkumulert kalibreringen («hun blir fort varm i vognen», «ullbodyen klør ham»). Forskning på «cognitive household labor» viser at planleggings- og overvåkingsarbeidet i husholdninger er systematisk skjevt fordelt, og at det *usynlige* arbeidet (forutse, beslutte, følge opp) er tyngst — ikke utførelsen. **(a — faglitteratur: Daminger 2019 «The Cognitive Dimension of Household Labor»; Allen & Hawkins 1999 om maternal gatekeeping.)**
- **Handoff-øyeblikk:** (i) morgenen der den andre leverer i barnehagen; (ii) «jeg er på jobb, du tar turen»; (iii) **pappaperm-byttet** — det norske spesialtilfellet der primærrollen skifter person over natten etter 6–9 mnd, og den nye primærforelderen er novise akkurat idet barnet passerer overopphetings-peaken 8–9 mnd (RESEARCH.md). Dette er potensielt produktets sterkeste enkeltscenario: en strukturelt garantert, tidfestet kompetanseoverføring i hvert eneste norske hushold med to foreldre i jobb. **(b/c — mekanismen er reell, at den oppleves som et *problem* er utestet.)**
- **Emosjonell kjerne:** ikke informasjon, men *å slippe å instruere*. Å sende partneren en plaggliste kan leses som mistillit; å la «appen si det» eksternaliserer autoriteten og avvæpner konflikten. **(c — spekulasjon med støtte i gatekeeping-litteraturen: mødre begrenser ofte delegering fordi instruering koster mer enn å gjøre det selv.)**

### 2.2 Besteforeldre (asymmetrisk, episodisk handoff)

- **Situasjon:** lav frekvens (henting, barnevakt, feriedøgn), lav kontekst (kjenner ikke barnets respons), og en klassisk generasjonskonflikt: eldre generasjoners bekledningsnormer (mer lag, «barnet fryser») mot dagens overopphetings-bevissthet (AAP/LUB i F62-researchen advarer eksplisitt mot overbundling). **(a for det faglige grunnlaget i F62/RESEARCH.md; c for at generasjonskonflikten faktisk utspiller seg rundt bekledning i målgruppen — velkjent anekdotisk, ubelagt.)**
- **Emosjonell kjerne:** forelderen vil ha kontroll uten å fornærme. «Appen sier ullbody + parkdress» er en nøytral tredjepart; «jeg synes du kler ham for varmt» er en familiekonflikt. Babyoras evidensmerkede hard blocks (AAP/NHS/Lullaby Trust, audit §1) gir artefakten en autoritet en tekstmelding fra datteren ikke har. **(c — dette er hypotesens mest emosjonelt ladde og minst belagte ledd.)**
- **Barriere:** besteforelderen installerer ikke en app, og møter i dagens modell en **ikke-avviselig hard paywall** etter én anbefaling hvis hen gjør det. Koordinering via «alle har appen» er økonomisk død i dagens modell. **(a — paywall-mekanikken er verifisert i audit §1/`AppPaywallGate`.)** Mottakeren må derfor kunne motta *uten app* (se §5).

### 2.3 Barnehage (institusjonell handoff — sannsynligvis en annen jobb)

Her må hypotesen være ærlig mot seg selv. Norsk barnehagepraksis er at *personalet* kler barna for utetid, etter egen profesjonell rutine, fra det tøyet foreldrene har lagt på plassen. Koordineringsartefakten mellom hjem og barnehage er ikke en daglig plaggliste — det er **garderoben som er levert** (skiftetøy, parkdress, votter i riktig størrelse, regntøy når det meldes regn). **(c — beskrivelse av vanlig praksis, ubelagt i repo; må verifiseres med barnehageintervjuer.)** To konsekvenser:

1. En app som sender barnehagen instrukser vil trolig bli ignorert eller oppleves som mistillit til fagfolk. Koden selv innrømmer maktforholdet: den eneste barnehagereferansen i hele motoren er noten *«sjekk hva barnehagen anbefaler for ute-lek i dag»* (`modifiers.ts:353`) — appen underordner seg barnehagen, ikke omvendt. **(a — verifisert.)**
2. Den reelle barnehage-jobben er **«har jeg levert riktig tøy for de neste dagene?»** — som er en pakke-/forberedelsesjobb, ikke en samme-vurdering-jobb. Den peker mot Sols «Turprotokoll»-retning og mot Planlegg/«I morgen»-widgeten, ikke mot deling. Koordineringshypotesen bør derfor **avgrense seg til partner + episodiske omsorgspersoner** og eksplisitt overlate barnehagen til pakke-hypotesen. Å late som barnehagen er et delingsscenario ville gjenta paywall-løftefeilen i strategisk skala.

---

## 3. Handoff-øyeblikkets anatomi

Fire strukturelt ulike øyeblikk, med ulik designkonsekvens: **(alt c/b — taksonomi, ikke funn)**

| Type | Eksempel | Tidskritikk | Hva overføres | Kanal i dag |
|---|---|---|---|---|
| Synkron | begge hjemme, én kler | ingen | muntlig vurdering | roping mellom rom |
| Asynkron samme dag | partner henter kl. 15 | timer | plan + begrunnelse | melding «ta med regndress» |
| Delegert episode | farmor har barnet i morgen | kveld før | plan + kontrolltegn + kalibrering («hun blir fort varm») | telefonsamtale, bag pakket av forelder |
| Institusjonell | barnehageuken | dager | garderobe, ikke plan | fysisk levering av tøy |

Nøkkelinnsikt: i tre av fire tilfeller pakker/forbereder primærforelderen ofte *fysisk* selv (bagen til farmor, skiftetøyet til barnehagen). Handoff-artefakten konkurrerer altså ikke bare med en melding, men med **å bare gjøre det selv** — som er gatekeeping-litteraturens hovedfunn om hvorfor delegering feiler. Et produkt som gjør delegering *billigere enn å gjøre det selv* angriper det reelle problemet; et produkt som bare formaterer en plaggliste pent gjør det ikke. **(a for litteraturmekanismen / c for anvendelsen her.)**

---

## 4. Emosjonelle behov — hva som egentlig kjøpes

1. **Kontroll uten tilstedeværelse** — vite at vurderingen skjer riktig når du ikke er der. **(c)**
2. **Tillit med verifikasjon** — kontrollpunktet («kjenn på nakken», validert i RESEARCH.md mot PMC12386404) er kanskje viktigere enn plagglisten i handoff: det gir mottakeren et selvstendig feedback-verktøy i stedet for blind lydighet. En delt plan bør alltid inneholde kontrolltegnet. **(a for det faglige kontrollpunktet / b for at det øker mottaker-etterlevelse.)**
3. **Konfliktavvæpning** — ekstern autoritet («appen sier») som erstatning for instruks. **(c)**
4. **Avlastning av bekymring, ikke av arbeid** — primærforelderen sparer kanskje null minutter, men slipper å *tenke på det* mens hen er borte. Betalingsviljen, hvis den finnes, ligger trolig her: dette er et trygghetskjøp, samme kategori som babycall. **(c — men babycall-analogien gir en testbar prisreferanse.)**
5. **Mottakerens behov er speilvendt:** ikke å bli instruert, men å *slippe å ringe og spørre* — og å kunne vise at de gjorde det riktig. En god handoff-artefakt gjør mottakeren kompetent, ikke lydig. **(c)**

---

## 5. Konflikten med lokal-only — ærlig vurdering

**Dagens arkitektur er verifisert fullstendig delings-udyktig (a):** ingen backend for brukerdata, all state i WebView-localStorage, ingen auth (audit §1); `family_sharing` er `false` og listet under `REQUIRES_AUTH` — koden vet selv at ekte deling krever konto (`capabilities.ts:55`); null share-API-er i hele repoet; hard paywall gjør mottaker-installasjon meningsløs. Sols utfordrede premiss #15 («at lokal-only kan beholdes dersom omsorgspersonkoordinering viser seg å være kjernejobben») er reell — men den har en trapp, ikke en klippe:

**Trinn 0 — Minimum viable handoff (ingen arkitekturendring):** en «Del»-knapp på resultat/plan som genererer **tekst (evt. + bilde) gjennom OS-ets native share sheet** — plaggliste i påkledningsrekkefølge, én setnings værbegrunnelse, ett kontrolltegn, gyldighetstidspunkt. Sendes som iMessage/WhatsApp til hvem som helst. Ingen backend, ingen konto, mottaker trenger ingen app, GDPR-nøytralt (brukeren deler selv, data forlater aldri appen uten eksplisitt handling — konsistent med lokal-first-prinsippet i PRODUCT.md). Estimert én skjermkomponent + `navigator.share`/Capacitor Share. **Dette er også det perfekte falsifiseringsinstrumentet:** hvis ingen trykker på den, er hypotesen død før noen bygger sync. **(a for teknisk gjennomførbarhet / b som test.)**

**Trinn 1 — Delbar lenke:** statisk render av planen på en URL (edge-funksjon, ephemeral, ingen brukerkonto). Bryter «ingen data forlater enheten» marginalt; krever samtykke-design fordi innholdet gjelder et barn. **(a for at det bryter premisset.)**

**Trinn 2 — Ekte familiesync:** kontoer, sync, mottakermodus. Dette er et *annet produkt* arkitektonisk, og skal per master-briefen ikke bygges før trinn 0 har produsert bevis. Merk prismodell-konsekvensen: koordinering fungerer bare hvis **avsender betaler, mottaker er gratis** (mottaker-lesemodus utenfor paywallen) — ellers dør nettverket i første ledd.

**Ærlig motargument (c):** en tekstmelding er gratis, og «husk parkdress» tar fire sekunder å skrive. Trinn 0 må bevise at den *genererte* artefakten (komplett, begrunnet, med kontrolltegn, autorisert av evidensmerkede regler) er nok bedre enn fire sekunders fritekst til at folk endrer vane. Det er en høy list, og det er nøyaktig det testen skal måle.

---

## 6. Betalingsvilje

- **Hvem betaler:** primærforelderen, for at andre skal treffe. Enkeltbetaler-modellen (39/99/299 kr) er kompatibel; det som IKKE er kompatibelt er at mottakere møter paywall. **(a for prisstruktur / c for motiv.)**
- **Hvorfor det kan bære abonnement der ren anbefaling ikke gjør det:** anbefalingen degraderer i verdi når forelderen lærer (Sols graduasjon); koordineringsbehovet fornyes ved hver ny omsorgskonstellasjon (perm-bytte, barnevakt, ny sesong hos besteforeldre). **(c)**
- **Hvorfor det kan feile som betalingsdriver:** behovet kan være for episodisk (2–3 ganger i måneden for besteforeldre-scenariet) til å motivere månedspris; og verdien realiseres hos en som ikke betaler, som svekker betalerens opplevde egeninteresse. **(c)**
- Sols krav står: hard paywall-beslutninger uten fungerende analytics er tro, ikke vedtak. Ingen prissetting av koordinering kan skje før trinn 0-adopsjon er målt. **(a — bindende fra review.)**

---

## 7. Falsifisering — hva som dreper hypotesen

Hypotesen er falsifisert hvis: (1) dagbokstudien viser at handoff-øyeblikk med reell usikkerhet er sjeldne (< ~2/uke median per husholdning); (2) deltakerne rapporterer at melding/muntlig beskjed fungerer friksjonsfritt; (3) en skipbar Del-knapp får neglisjerbar bruk over 2 uker; (4) mottakere i felt ignorerer eller overstyrer planen i flertallet av tilfellene; (5) et handoff-løfte i paywall (først når funksjonen finnes — aldri før, jf. Sol P0-4) ikke flytter konvertering. Konkrete terskler i testlisten under. Sols krav om **separat** handoff-studie (ikke blandet med primærforeldre-svar) er bindende metodekrav.

## 8. Konklusjon

Koordinering er den av de tre JTBD-hypotesene (forskrivning/validering/koordinering) med **sterkest strukturell logikk** (løser graduation, udekket av konkurrenter, norsk permisjonskontekst) og **svakest empirisk grunnlag** (null brukerdata, null delingsfunksjon å lære fra, emosjonskjernene er ren spekulasjon). Den krever ikke at lokal-only forkastes for å testes — trinn 0 (native share av generert tekst) er både billigste MVH og skarpeste falsifiseringsinstrument. Barnehage-scenariet bør eksplisitt avgrenses bort til pakke-/forberedelses-hypotesen. CareCircle-previewen med fiktive «Deler»-statuser er et løfte uten funksjon i samme klasse som paywall-teksten Sol felte, og bør fjernes eller merkes til deling finnes.

## TESTBARE ANTAKELSER
- Handoff-frekvens: I en 7-dagers dagbokstudie (Sols krav, N >= 12 husholdninger med barn 0-24 mnd, minst 3 segmenter) logger primærforeldre hvert øyeblikk der en ANNEN person kler/skal kle barnet og forelderen kjenner behov for å påvirke vurderingen. Falsifisert hvis median < 2 slike øyeblikk/uke per husholdning.
- Utilstrekkelighet av dagens kanal: Samme studie + kontekstintervjuer måler hvordan handoff løses i dag (melding/muntlig/pakker selv) og rapportert friksjon/uro (1-5). Falsifisert hvis >= 70 % rapporterer at dagens kanal fungerer uten nevneverdig friksjon (<= 2 av 5).
- MVH-adopsjon: Bygg Del-knapp (native share sheet, generert tekst: plaggliste + begrunnelse + kontrolltegn) på resultatskjermen, med analytics reparert og verifisert ende-til-ende først (Sol-krav). Mål share_tapped/result_shown per aktiv bruker over 14 dager. Falsifisert hvis < 5 % av aktive brukere deler minst én gang per uke.
- Mottaker-etterlevelse: I felttest med >= 10 avsender-mottaker-par (partner og besteforeldre separat, per Sols metodekrav), sjekk om mottakeren fulgte planen og om kontrolltegnet ble brukt. Falsifisert hvis mottakere ignorerer/overstyrer i > 50 % av tilfellene eller opplever artefakten som mistillit.
- Pappaperm-toppen: Intervju >= 5 fedre i/rett før permisjonsstart om usikkerhet ved overtakelse av bekledningsvurderingen og hvordan kompetansen faktisk overføres. Falsifisert hvis overgangen gjennomgående beskrives som uproblematisk eller løst på 1-2 dager med muntlig overlevering.
- Barnehage-avgrensningen: Intervju 3-5 barnehager (styrer + 1 ansatt) om de vil ta imot per-barn daglige bekledningsinstrukser fra en foreldreapp. Antatt svar nei (hypotesen avgrenser seg da til partner/episodisk); hvis uventet ja, gjenåpnes barnehage som delingsscenario.
- Betalingskobling: Først når deling faktisk finnes: paywall-variant med handoff-løfte vs uten (krever fungerende trial-/konverterings-events, som i dag er døde — trial_started fyrer kun for yearly). Falsifisert hvis handoff-varianten ikke gir målbart løft i trial-start eller konvertering.
- Konfliktavvæpnings-mekanismen: I intervjuer, test formuleringen «appen sier» vs egen instruks overfor besteforeldre/partner. Falsifisert hvis foreldre ikke gjenkjenner instrueringskostnaden eller foretrekker å instruere selv.

## BEVISHULL
- Null atferdsdata: PostHog kompileres bort uten nøkkel, 15 av 20 events fyres aldri (audit funn 1). Vi vet ikke engang om Familie-fanen besøkes, langt mindre hvor ofte flere personer kler samme barn.
- Handoff-frekvens og -friksjon i virkelige husholdninger kan ikke avgjøres uten dagbokstudien — repoet inneholder ingen brukerkontakt overhodet.
- De emosjonelle kjernepåstandene (kontroll uten mas, konfliktavvæpning via ekstern autoritet, trygghetskjøp) er ren spekulasjon støttet av generell litteratur om kognitivt husholdsarbeid/gatekeeping — ikke undersøkt i denne målgruppen eller dette domenet.
- Mottakersiden er fullstendig ukjent: om partnere/besteforeldre vil lese, følge eller irritere seg over en delt plan finnes det ingen data på, og mottakere kan ikke studeres via appen siden ingen delingsfunksjon eksisterer.
- Norsk barnehagepraksis rundt bekledningsinstrukser fra foreldre er beskrevet fra allmennkunnskap, ikke kilder — må verifiseres med faktiske barnehager før scenariet avgrenses endelig bort.
- Betalingsvilje for koordinering kan ikke estimeres: trial-trakten er umålbar i dag, og ingen priseksperimenter kan kjøres før analytics er reparert (Sol-krav før nye monetiseringsbeslutninger).
- Pappaperm-scenariets styrke hviler på velferdsordningsfakta som ikke er dokumentert i repoet; eksakte kvoteregler og hvor mange som faktisk deler permisjon jevnt må sjekkes før det brukes i strategi eller copy.
- Om en generert plan faktisk slår en fire-sekunders tekstmelding («husk parkdress») i opplevd verdi er ukjent og er hele hypotesens sentrale usikkerhet.

## DESIGNIMPLIKASJONER
- Onboarding: spør «hvem kler barnet?» (jeg alene / partner og jeg / også besteforeldre/barnevakt) — gir segmentsignal for koordineringsbehovet og adresserer Sols P2 om at onboarding prioriterer navn foran beslutningskritiske variabler. Gjelder KUN hvis hypotesen overlever dagbok-/intervjutestene.
- Resultatskjermen: «Del»-knapp som trinn 0-MVH — native share sheet med generert tekst (plaggliste i rekkefølge, én værbegrunnelse, kontrolltegnet «kjenn på nakken», gyldighetstidspunkt). Ingen backend, forenlig med lokal-only, og fungerer samtidig som hypotesens falsifiseringsinstrument.
- Familie-fanen: binært valg — enten blir den et reelt koordinasjonsområde (mottakere, delingshistorikk, mottaker-lesemodus) etter bevis, eller den omdøpes til Innstillinger (Sols P2). CareCircle-previewen med fiktive «Deler»/«Venter på svar»-statuser fjernes eller merkes som illustrasjon til ekte deling finnes — samme løfte-uten-funksjon-klasse som paywall-teksten Sol felte (P0-4).
- Paywall: intet koordineringsløfte før funksjonen eksisterer (claims-matrise-kravet). Hvis trinn 2 (ekte sync) noen gang bygges: avsender betaler, mottaker leser gratis utenfor paywallen — dagens ikke-avviselige hard paywall for alle dreper ethvert koordineringsnettverk i første ledd.
- Planlegg: «I morgen»-widgeten er det naturlige delingsobjektet for kveldshandoff («farmor henter i morgen») — en delbar forberedelsesartefakt binder koordineringshypotesen til pakke-/turprotokoll-hypotesen i stedet for å konkurrere med den.
- Hjem: hvis deling får bruk, viser åpningen etter en mottatt/delt plan et kvitteringsspor («delt med Ola 07:42») — kontroll-uten-mas-behovet handler om å VITE at vurderingen nådde frem, ikke om flere funksjoner.
- Barnehage designes som pakkejobb, ikke delingsjobb: ukens garderobesjekk («regn onsdag — ligger regntøyet i barnehagen?») hører til Planlegg/Snart, og appen skal ikke late som den instruerer barnehagepersonalet (koden delegerer allerede autoritet til barnehagen i modifiers.ts:353).