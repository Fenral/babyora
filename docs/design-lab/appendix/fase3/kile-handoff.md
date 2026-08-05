# Fase 3 — Advokatsak for inngangskilen «Omsorgshandoff»

> Rolle: ADVOKAT for kile 4 (omsorgshandoff) i Sols pålagte kilevalg. Alle påstander er merket
> (a) belagt / (b) testbar antakelse / (c) spekulasjon. Kryssjekket mot premissloggen og Sols
> bindende krav fra fase 2. Ingen kodebasert bruksmåling omtales som brukerbevis — analytics er død (a).

## 1. Kilen i én setning

**Gjør primærforelderens vurdering overførbar:** når noen andre skal kle barnet, sender forelderen
en delbar plan — plaggliste med begrunnelse og kontrolltegn — der avsenderen betaler og mottakeren
får alt gratis uten app. Trinn 0 er native share av ren tekst.

## 2. Hvem og hvilket øyeblikk

**Avsenderen** er den omsorgspersonen som har kalibrert kunnskapen om akkurat dette barnet
(toleranser, garderobe, hva som funket sist) og som nå gir fra seg kontrollen. **Mottakeren** er
enhver som skal kle barnet uten den kunnskapen: partner, besteforelder, avlastning, den andre
forelderen ved delt bosted. Merk Sols blindsone: «avsender» er en rolle, ikke «mor» — hvem som
faktisk besitter kunnskapen må testes, ikke antas (b).

**Øyeblikket** er kvalifisert handoff: et konkret tidspunkt der (1) en annen enn avsenderen skal
kle barnet for uteeksponering, (2) avsenderen ikke er fysisk til stede ved påkledningen, og
(3) avsenderen har en mening om resultatet. Kandidat-øyeblikk: partner tar barnet ut alene i helgen,
besteforeldre passer en ettermiddag, permisjonsbytte, henting ved delt bosted. Frekvensantakelsen —
median ≥2 slike øyeblikk/uke (premisslogg #9) — er UVERIFISERT (b) og er kilens bærende risiko.

## 3. Hvorfor denne kilen — de fem sterkeste argumentene

**3.1 Den eneste jobben som overlever graduation (b).** Forskrivning og validering har innebygd
utløpsdato: forelderen lærer, og premiss #1/#6 (graduation-hastighet) truer hele abonnementslogikken.
Handoff-behovet regenereres derimot av strukturen rundt barnet — hver ny omsorgsperson nullstiller
kompetansen, uavhengig av hvor flink avsenderen er blitt. Dette er fase 2-analysens eget argument
(03 §1) og det står uimotsagt etter Sols runde 2. En erfaren forelder trenger ikke appen for seg
selv — men trenger den fortsatt idet svigermor skal trille vogna i −8.

**3.2 Betalingsviljen sitter der tapsfrykten sitter (b/c).** Fase 2 §5 identifiserte sosial dom
(«ingen skal kunne si jeg kledde barnet feil») som mekanisme som gjør verdiktet *siterbart* viktigere
enn følt. Handoff er nøyaktig situasjonen der dette spisses: avsenderen bærer ansvaret for et utfall
hen ikke kontrollerer. Å betale for informasjon man snart kan selv er svakt; å betale for ro når man
gir fra seg kontrollen er en annen kategori. Dette er en testbar hypotese (betalingsvilje-eksperiment,
premiss #7-rammen), ikke et faktum.

**3.3 Merverdien over tekstmelding er artikulerbar og bygger på det som allerede finnes (a/b).**
Konkurrenten er en fire-sekunders SMS («ulldress og vott»). Det SMS-en ikke bærer: (1) begrunnelsen
i varm-norsk tone som motoren allerede genererer per plagg (a — forklaringene ligger i wool-layers-
output), (2) kontrolltegn («kjenn på nakken etter 20 min — svett = ett lag av»), (3) rekkefølge
innerst-til-ytterst, (4) gyldighet («gjelder til ca. kl. 15; snur vinden, ta regntrekket»).
En mottaker uten kalibrert kunnskap trenger ikke bare konklusjonen, men *handlingsreglene rundt den* —
det er dette som skiller en plan fra en beskjed. At denne differansen faktisk oppleves som verdi av
mottakeren er Sols eksplisitte ubeviste antakelse og MVH-ens hovedspørsmål (b).

**3.4 Kilen har innebygd distribusjon (c).** Hver deling er en produktdemonstrasjon inn i en ny
husholdning (besteforeldre med flere barnebarn, venninnen i samme barselgruppe). Ingen av de tre
andre kilene sprer seg selv. Dette er spekulasjon inntil delingsdata finnes, men det er den eneste
kilen der vekstmekanismen og kjerneverdien er samme handling.

**3.5 Trinn 0 er forenlig med alt som er låst (a).** Native share av tekst krever ingen backend
(lokal-first består, premiss #10 uberørt), ingen mottaker-app, ingen CareCircle-aktivering, ingen
Motor 2.0. Delingsteksten er en ren funksjon over eksisterende motoroutput. Avsender-betaler-modellen
er forenlig med hard paywall (eiervedtak 2026-07-31) fordi betaleren er den som allerede er inne i
appen. Norsk todelt foreldrepermisjon gir mange reelle bytter som rekrutteringskontekst — men brukes
IKKE som «garantert tidspunkt» (premiss #18 SVEKKET, uttak varierer i lengde/gradering/tidspunkt).

## 4. Hva kilen krever av produktet — konkret

**Onboarding:** Ett nytt steg: «Hvem kler {navn} i løpet av uka?» — roller (partner/besteforelder/
annen), ikke kontakter, ikke invitasjoner, ingen backend. Formålet er todelt: (1) etablere at appen
handler om *alle* som kler barnet, (2) gi analytics en kvalifisert-handoff-baseline. Aha-øyeblikket
omrammes fra «her er dagens antrekk» til «her er planen — og den kan gis videre». Navn-først-spørsmålet
(premiss #13, ÅPEN) berøres ikke; steget legges etter dagens fire.

**Hjem:** Uendret fasemaskin og seremoni (v4-fingerprint består). Én tilføyelse i result-tilstanden:
sekundærhandling «Del planen» under plagglisten. Ingen ny fane, ingen ny IA.

**Resultat:** Delingsblokken genereres fra eksisterende output: nummerert liste innerst-til-ytterst +
én setnings begrunnelse (eksisterende forklaringstekst) + 1–2 kontrolltegn + gyldighetsvindu.
Kontrolltegn formuleres som observasjon («kjenn på nakken»), aldri som garanti — dette er samme
integritetsklasse som Sols P0 om falsk grønn: et delt råd som er feil skader *mer* enn et fulgt råd,
fordi avsenderen har stilt sin troverdighet bak det. Fagsignatur-blokkeren (premiss #5) skjerpes
derfor av kilen, den løses ikke av den.

**Paywall:** Copy-løftet «Del med alle som passer barnet» (screenshot 05) — i dag udekket i kode
(family_sharing=false, a) — blir *sant* på billigste mulige måte: trinn 0 leverer løftet uten backend.
Trial-kravet omformuleres: 7-dagersvinduet må sannsynliggjøre ≥1 kvalifisert handoff (analog til
premiss #12s værskifte-krav); hvis handoff-frekvensen er ukentlig, er 7 dager på grensen — måles.

**Mottaker:** Trinn 0: ren tekst, null krav. Trinn 1 (kun hvis trinn 0 består): statisk web-visning
med payload i URL-fragment — ingen serverlagring, lokal-first intakt. Alt utover det (oppdatering ved
væromslag, toveis kvittering) er R9/backend og eksplisitt UTENFOR kilen.

## 5. Hva kilen eksplisitt IKKE er — nedprioriterte jobber

Per Sols krav: én jobb vinner, og disse er ikke primærjobben:

1. **Daglig forskrivningsstrøm** — «3–8 åpninger/dag» (premiss #2) får ikke bære forretningsmodellen.
   Forskrivningen består som *motor* for det som deles, men er ikke installasjonsgrunnen vi selger.
2. **Kandidatvalidering ved døren** — egen kile, egen advokat; 8-sekunders-inputkravet er dens problem.
3. **Tur- og overgangsplanlegging** — Planlegg/Uke (595 kB, premiss #14) nedprioriteres; ingen ny
   utvikling der før kilevalget er testet.
4. **Barnehagepakking** — avgrenset bort som annen jobb (skift-logistikk, ikke vurderingsoverføring);
   Sols P2-poeng om at barnehagen likevel kan være bruksårsak noteres som ekspansjonshypotese.
5. **Sanntids familiesynk** — CareCircle med auth/RLS/backend forblir R9; dev-preview forblir dev-only.
6. **Medisinsk sertifisering** — den delte planen er en overføring av forelderens vurdering, ikke en
   attest fra Babyora.

## 6. Minimal testbar versjon (MVH)

**Bygges (a — verifisert at ingenting av dette finnes: null navigator.share/@capacitor/share i src/):**
1. `buildShareText()` — ren funksjon over eksisterende anbefalingsobjekt (plagg + forklaring +
   kontrolltegn + gyldighet). Testbar uten UI.
2. Capacitor Share-plugin + «Del planen»-knapp i result-tilstanden.
3. Onboarding-steg «Hvem kler barnet?» (roller, lokal lagring).
4. Analytics-events: `handoff_declared`, `plan_shared`, `share_completed` — **forutsetter at
   PostHog-nøkkelen aktiveres først** (Sols absolutte krav; uten den finnes ingen test).

**Måles (Sols skjerpede terskler, bindende):**
- Deling per **kvalifisert handoff**, ikke per uke. Kjernejobb-terskel: **20–25 %** av kvalifiserte
  handoffs bruker delingen eller gir dokumentert bedre informasjon enn tekstmelding. 5 % ukentlig
  er falsifiseringsgulv for sekundærfunksjon, ikke bevis for kile.
- Mottakerundersøkelse (kvalitativ, ≥8 mottakere): var teksten mer handlingsbar enn en vanlig
  melding ville vært? Dette tester Sols antakelse «deling > tekstmelding» direkte.
- Handoff-frekvens i dagbokstudien (premiss #9): median ≥2 øyeblikk/uke der en annen kler barnet
  OG avsenderen vil påvirke. Faller denne, faller kilen.

**Falsifiseringskriterium:** hvis <20 % av kvalifiserte handoffs bruker delingen ETTER at
delingsknappen er synlig og friksjonsfri, og mottakere ikke rapporterer merverdi over melding,
er kilen felt — da er handoff en sekundærfunksjon i en forskrivnings-app, og kilevalget gjøres om.

## 7. Gjenbruk vs. skrot av dagens bygde flater

**Gjenbrukes uendret (a):** wool-layers-motoren med forklaringer og hard blocks; resultatskjermens
plaggliste (innerst-til-ytterst er nøyaktig formatet en mottaker trenger); tone-systemet
(varm-norsk begrunnelse ER delingsinnholdet); onboarding-rammeverket; RevenueCat/paywall-infrastruktur;
Monter-designsystemet; `care-circle-model.ts` som ren datamodell for omsorgsperson-roller.

**Gjenbrukes med endring:** paywall-copy (løftet gjøres sant); Familie-fanen (omsorgspersonliste blir
reell minimal liste fra onboarding-steget i stedet for dev-preview); resultatskjermen (+ delknapp).

**Skrotes/fryses for kilen:** CareCircle-*UI-previewen* med fiktive statuser (forblir dev-only eller
fjernes — Sols P0-3); UkeScreen-videreutvikling; Motor 2.0-aktivering er ikke en forutsetning;
scan-seremonien er irrelevant for mottakersiden og røres ikke; sovende motorfunksjoner
(kalibrering, vognMode) forblir ukablet — de tilhører andre kiler.

## 8. Ærlig svakhetsregnskap

Se `weaknesses`-listen — de ti innvendingene der, særlig #1 (install-siden av kilen er svakere enn
retention-siden), #2 (SMS-konkurrenten) og #4 (kilen hviler på ubevist motortillit), er reelle og
uavklarte. Advokatens posisjon er ikke at kilen er bevist, men at den er den **billigste å teste**
(trinn 0 uten backend), den **eneste som overlever graduation**, og den eneste der Sols egen
falsifiseringsmekanikk (kvalifisert-handoff-måling) allerede er definert og bindende. Hvis den felles,
felles den raskt og billig — det er også et argument for å teste den først.

## KJERNEPÅSTANDER
- (a) Ingen delingsfunksjonalitet finnes i koden i dag — null treff på navigator.share/@capacitor/share i src/; CareCircle er dev-only preview uten backend (care-circle-model.ts er ren modell, InnstillingerScreen gater på import.meta.env.DEV).
- (a) Motorens forklaringstekster og plagglisten innerst-til-ytterst eksisterer allerede som output — delingsteksten i trinn 0 er en ren funksjon over eksisterende data, uten backend, forenlig med lokal-first (premiss #10) og hard paywall (eiervedtak 2026-07-31).
- (a) Paywall-løftet «Del med alle som passer barnet» er i dag udekket i kode (family_sharing=false) — trinn 0 er den billigste måten å gjøre løftet sant på.
- (b) Handoff er den eneste av de fire kilene som overlever graduation: behovet regenereres av hver ny omsorgsperson, uavhengig av avsenderens læringskurve — mens forskrivning og validering eroderes av premiss #6 (graduation-hastighet).
- (b) Betalingsviljen er sterkere ved kontrolloverføring enn ved egen usikkerhet, drevet av sosial dom-mekanismen fra fase 2 §5 — testbar via betalingsvilje-eksperiment, ikke belagt.
- (b) Merverdien over tekstmelding ligger i begrunnelse + kontrolltegn + rekkefølge + gyldighetsvindu — Sols eksplisitte ubeviste antakelse, testes direkte i MVH med mottakerundersøkelse.
- (b) Kvalifisert handoff-frekvens median ≥2/uke (premiss #9) er kilens bærende, uverifiserte antakelse; faller den i dagbokstudien, faller kilen.
- (b) MVH-terskel per Sols bindende krav: 20–25 % av kvalifiserte handoffs må bruke delingen eller gi dokumentert bedre informasjon enn melding; 5 % ukentlig er kun falsifiseringsgulv for sekundærfunksjon.
- (c) Hver deling er en produktdemonstrasjon inn i en ny husholdning — kilen har innebygd distribusjon som de tre andre mangler; ren spekulasjon inntil delingsdata finnes.
- (c) Norsk todelt foreldrepermisjon gir mange reelle omsorgsbytter som rekrutteringskontekst — men brukes ikke som garantert tidspunkt (premiss #18 SVEKKET per NAV-variasjon).

## SVAKHETER (egeninnrømmet)
- Install-siden er kilens svakeste ledd: man installerer neppe en app for å dele noe man ennå ikke har. Handoff bærer retention og betalingsvilje bedre enn førsteinstallasjon — første nedlasting drives trolig av egen usikkerhet (forskrivning). Kilen kan altså være riktig som verdikjerne men feil som bokstavelig «første grunn til å installere», og da er innrammingen delvis feil.
- Konkurrenten er en fire-sekunders tekstmelding med null friksjon. Merverdien (begrunnelse, kontrolltegn) er artikulerbar men ubevist, og Sol P2 står: 5 % ukentlig deling beviser ingen kjernejobb. Kilen kan ende som en god sekundærfunksjon i en forskrivnings-app — som ville felle den som inngangskile selv om delefunksjonen er verdifull.
- Handoff-frekvensen er trolig lavere enn daglig påkledning (kanskje 1–3/uke), og abonnement på lavfrekvent jobb er strukturelt vanskeligere; 7-dagers trial dekker ikke sikkert en eneste kvalifisert handoff.
- Kilen hviler på ubevist motortillit: avsenderen deler bare det hen selv stoler på, og et DELT feilråd skader mer enn et fulgt — avsenderen har stilt sin troverdighet bak det. Fagsignatur-blokkeren (premiss #4/#5, hard blokker) skjerpes av kilen; den kan ikke omgås.
- Alt over trinn 0 drar mot backend: mottakerflate med oppdatering ved væromslag, kvittering, CareCircle — og bryter da lokal-first (premiss #10). Kilens langsiktige form kan tvinge arkitekturbeslutningen fase 8 skyver på.
- Mottaker-gratis kan kannibalisere: i husholdninger der begge foreldre er likestilte beslutningstakere er «mottakeren» en medbetaler-kandidat, og gratis mottak kan fjerne andre-forelder-konvertering.
- Mor-som-kunnskapskilde ligger implisitt i handoff-fortellingen (Sols blindsone): aleneforeldre, delt bosted, medmødre og besteforeldre-som-daglig-omsorg har andre mønstre — «avsender» er ikke alltid veldefinert, og ved delt bosted kan begge være avsendere uten felles datagrunnlag (lokal-first gjør synk umulig i dag).
- Pappaperm-ankeret er svekket (premiss #18): uttak varierer i lengde, gradering og tidspunkt — permisjonsbyttet kan brukes som rekrutteringskontekst, ikke som strukturelt argument.
- Målingen forutsetter aktiv analytics (PostHog-nøkkel hos eier) og selvrapportert handoff-baseline — «kvalifisert handoff» er vanskelig å operasjonalisere uten dagbok/felttest, som er eiervendte oppgaver Design Lab ikke kan utføre selv.
- Barnehage-avgrensningen kan være feil vei: Sol P2 påpeker at pakking/ankomstvalg kan være en større og hyppigere jobb enn omsorgshandoff (Sols eksplisitte antakelse 11) — nedprioriteringen i §5 er et veddemål, ikke et funn.