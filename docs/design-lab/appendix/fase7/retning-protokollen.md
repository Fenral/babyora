# RETNING: «PROTOKOLLEN» — skjermen du utfører, ikke listen du leser (H1-ætten)

## 0. Kjernepåstand

Alle værapper — inkludert dagens Babyora-hjemskjerm — er *lesbare flater*: data og kort man tolker, og så går man. Protokollen snur premisset: **Babyoras svar er en handlingssekvens med innebygde kontrollpunkter og et stoppkriterium, og skjermen er stedet der sekvensen utføres.** Enheten i grensesnittet er ikke kortet, chipen eller grafen — den er **handlingen**. Avviket fra de andre retningene ligger i beslutningsarkitekturen: systemet gir ETT svar (H1-ætten), tar ansvar for det, og deklarerer eksplisitt hvor ansvaret slutter («du ser barnet — protokollen gjør ikke det», jf. PACE/CUS-strukturen i hoykonsekvens-ppe.md §1.5).

**Eksplisitt anti-referanse:** værdashbordet (Yr/Apple Weather-formen og vår egen nåværende HjemScreen): rådata øverst, kort/chips under, tolkningsjobben hos brukeren. Ingenting i Protokollen skal kunne forveksles med det. (Sols krav om å unngå kort/chip-dashbordet er dermed konstituerende, ikke kosmetisk.)

---

## 1. Filosofi

- **Autoritet med deklarert grense.** Protokollen påstår, brukeren korrigerer unntaket (INV-8). Men autoritetsgrensen er skrevet inn i selve flaten med fast frase, ikke gjemt i vilkår: *«Protokollen ser været. Du ser barnet.»* Uenighet har en formell kanal med definert konsekvens (INV-5, PACE-inversjonen).
- **Tilstand bestemmer format** (tverrsyntesen pkt. 2 i PPE-researchen — funnet som *bærer* denne retningen): normal dag får rask flow-så-verifiser; avvik får langsom steg-for-steg. Én app, to protokollfilosofier, valgt av systemet — aldri av brukeren.
- **Stoppkriteriet bor i rådets egen grammatikk** (INV-10, Babyora-transformasjonen): ingen forbrukerapp i korpuset gjør stoppkriteriet til del av selve anbefalingen. Her er det den atomiske rådsenheten.
- **Skamfri doktrine:** protokollen evaluerer aldri forelderen eller gårsdagens valg. Avvik er en værtilstand, ikke en karakter. «Vet ikke» er alltid et gyldig svar. Ingen streaks, ingen score, ingen «2 av 2»-retorikk, ordet «verifisert» finnes ikke i produktet (fase 6-forbud).

## 2. Beslutningsarkitekturen: to moduser + degradert fallback

Dette er retningens ryggrad, hentet fra luftfartens to sjekklistefilosofier (§1.1) og maritim degradering (§4.2 i handoff-researchen):

**A. Normalprotokoll — «flow, så verifiser»** (challenge-do-verify). Forelderen kler på barnet slik hun pleier, *uten telefonen i hånden*. Etterpå (eller underveis, valgfritt): ÉN verifikasjonsflate som viser hele antrekket som lagstabel og spør: *«Stemmer dette?»* Ett trykk bekrefter alt; kun avvik rettes enkeltvis. Null friksjon på rutinedagen — dette respekterer etterlevelses-advarselen (tverrsyntesen pkt. 8: bekreftelse som koster mer enn ett trykk kollapser).

**B. Avviksprotokoll — «les-utfør-bekreft»** (read-do). Utløses av systemet, aldri valgt av brukeren, når: en hard/soft block fyrer, været krysser definerte terskler, situasjonen er ny for husholdningen (første kuldedag), eller datagrunnlaget er usikkert. Ett steg om gangen, i streng rekkefølge, hvert kritisk steg bekreftes før neste vises. Sikkerhetsreglene slutter å være bannere og blir **steg i sekvensen**: HB-9 blir steget *«Før bilstolen: ta AV dressen — tynne lag, sele tett, dress over som teppe»* plassert nøyaktig der i rekkefølgen handlingen skjer. Alarmtretthet-funnet (68–99 % falske alarmer i klinikk) setter den harde grensen: avviksmodus skal være sjelden og alltid handlingskrevende — fyrer den ofte, er tilstandsskillet ødelagt (måles, se risiko).

**C. Degradert protokoll.** Når data er utløpt (INV-2): det spesifikke svaret **maskeres** (rød-X-mekanismen oversatt — laglinjene mister påstandsstatus strukturelt, aldri via dimming, pga. kontrast-kollaps i sollys), og protokollen faller tilbake til den konservative generiske formen: *«Kle etter årstid. Kjenn på nakken før dere går.»* ECDIS-prinsippet: fortsett å hjelpe, men si tydelig at du navigerer på bestikk. Modusskiftet er ekstra synlig, ikke mindre.

**Tilstandsklassifisering før innhold** (I-PASS-strukturen): øverst på flaten står alltid én av tre faste fraser med definert semantikk — **«Vanlig dag» / «Følg med» / «Avvik»** — aldri glidende synonymer, aldri farge alene. Dette er det graderte hastegradsvokabularet fra luftfart («possible» vs. «practicable») omsatt til norsk klarspråk.

## 3. Rådsenheten — Babyora-eid kjerneinteraksjon

Hvert råd i produktet, på enhver flate, er en **triplett**:

> **neste handling** («Ta på ullbodyen») → **kontrollpunkt** («kjenn på nakken — ikke hendene, de er alltid kalde») → **stoppkriterium** («klam nakke: fjern ett lag; kalde bryst/nakke: inn»)

- Handlingen er dominant, begrunnelsen demotert, rådata to nivåer bak (INV-1).
- Kontrollpunktet er alltid det samme fysiske: **nakke-/brystsjekken med feilkildeavvisning innebygd** (Lullaby Trust-strukturen §2.4) — én veldefinert, énhånds kroppslig handling på tvers av alle situasjoner.
- Standardresponsen er alltid **minste reversible korreksjon** («fjern ett lag»), aldri full reberegning (tverrsyntesen pkt. 7).
- Tripletten er medium-uavhengig: den fungerer identisk som skjermsteg, opplest setning, låseskjermlinje og trykket handoff-kort (INV-1s krav).

**Usikkerhet representeres som kontrollfrekvens, ikke som tall.** PEWS-innsikten (§1.2): systemet svarer på usikkerhet med tettere måling, ikke panikk. Usikker vindmåling gir ikke «72 % konfidens» — den gir protokollen et ekstra kontrollpunkt: *«Vinden er usikker i dag (usikrest: vindmålingen) — kjenn på nakken allerede ved første stopp.»* Dermed løses masterprompt-kravet om usikkerhet uten falsk numerisk presisjon strukturelt, og svakeste premiss navngis i selve rådet (INV-3).

## 4. Onboarding

Minste informasjon før første trygge svar (INV-8): **to inputs** — barnets fødselsmåned og stedstillatelse med én begrunnelsessetning. Deretter rendres dagens protokoll umiddelbart.

Tre grep som er særegne for retningen:

1. **Forutsetninger som preconditions, ikke lisenstekst.** Luftfartens ikke-normal-regel («forutsetninger må bekreftes før man går videre») brukt på scope: *«Protokollen gjelder friske, fullbårne barn. Ved feber eller prematuritet: helsestasjonen, ikke appen.»* Dette kabler risikomodellens to manglende scope-erklæringer (matrise-risiko §2.2–2.3) som copy + flagg — synlig ved profil og på resultat, aldri som diagnose.
2. **Ett memory item læres første gang:** nakkesjekken. Protokollen sier eksplisitt at dette er handlingen som skal kunne utføres *uten appen* — appen designer sin egen overflødighet inn fra første økt (graduation-ærligheten fra H1).
3. Ingen iscenesatt beregning (R1/forkastet kopi): svaret kommer ærlig raskt, strukturen vises umiddelbart, kun faktisk asynkrone data fylles etterpå.

## 5. Hjem — protokollflaten (physical-first, uten kort/chips)

Hjem ER dagens protokoll i sin nåværende tilstand. Én kolonne, tre soner:

- **Topp: tilstandslinjen** («Vanlig dag» / «Følg med» / «Avvik») + absolutt gyldighet («Gjelder til 14:00» — INV-2) på én linje.
- **Midt: lagstabelen.** Den fysiske representasjonen er **påkledningsrekkefølgen selv**: laglinjer ordnet innerst→ytterst slik de faktisk tas på, gruppert i kroppssoner (kjerne → hode → hender → føtter) som seksjoner i sekvensen. Hvert lag bærer sin *funksjon*, ikke bare sitt navn (ECWCS-doktrinen: lag er funksjoner — «ullbody: holder fukten fra huden», «vindlag: stopper trekken i vogna»). Den kanoniske figuren er et **lagsnitt** («løken» — konsentriske omriss som viser hva som ligger innerst/ytterst), IKKE en barnefigur med tappbare soner — spatial triage på barnefigur er allerede flagget som representasjonsrisiko i invariant-hypotesene (hyp. 4) og unngås bevisst. Piktogrammer bærer aldri mening alene (piktogram-funnene §5.2: 85 %-terskelen) — alltid tekst + glyf.
- **Bunn (tommelsonen): situasjonsinngangene** (INV-7) formulert fysisk, som protokollvarianter: *«Vi går ut nå» / «Skal sove i vogna» / «Inn i bilstolen» / «Noen andre tar turen»*. Store treffmål i nedre tredjedel (encumbrance-funnene: ~40 % treffavvik med last). Dette kabler vognMode og bilstol — de to døde sikkerhetsledningene i dagens kode — som førsteklasses innganger, ikke innstillinger. Flerbarn er filter i flaten, aldri vegg (INV-7).

Er protokollen alt utført og været stabilt, viser hjem deltaformen (INV-6): *«Protokollen står seg — samme antrekk som i går. Ett unntak: votter i dag.»* Delta er alltid neste handling, aldri dom.

## 6. Anbefaling og resultat

**Anbefalingen** er den fulle plagglisten — GRATIS, nå/her, alltid (B-rammen, INV-9) — rendret som utførbar sekvens per §5. I avviksmodus rendres samme innhold som read-do-steg.

**Resultatet** (etter verifikasjonspasset) er en **kvittering, aldri seremoni** (INV-3): grunnlag («basert på Yr-varselet 07:12 + Idas alder»), **svakeste premiss navngitt** («usikrest: vindmålingen»), gyldighet («til 14:00»), og turens stoppkriterium i barnets valuta. Ingen konfetti, ingen score.

**Turfasen er en rytme, ikke et øyeblikksbilde** (ACGIH work/warm-up + DLE-strukturen): protokollen fortsetter etter døren med planlagte kontrollpunkter — «ved første stopp: nakkesjekk», «blir hun svett i vogna: fjern luen» (contingency-grenen fra I-PASS). Kontrollpunktene er hendelsesbaserte (ved stopp, ved aktivitetsskifte) inntil en validert tidsmodell finnes — ingen «~40 min»-presisjon (invariant-hypotese 7 respekteres). Terminaltilstanden bærer verifieren (INV-12/INV-8), skyldfri og med «vet ikke» som likeverdig valg: *«Turen er over. Hvordan satt antrekket?» passe / for varm / for kald / vet ikke.* Kalibreringsloopen som i dag er ukablet i koden får dermed sin flate.

## 7. Korrigering og autoritetsgrense

- Hvert steg har «stemmer ikke»-håndtak i steget selv, i barnets valuta (INV-5) — aldri separat skjema.
- «Har ikke plagget» er premisskorrigering med substitusjon fra samme funksjonsklasse («ikke ullbody? bomullsbody + ekstra mellomlag»), aldri feilmelding eller kjøpsanledning.
- Hver overstyring kvitteres med deklarert omfang: *«Endret for i dag. Idas profil er uendret.»*
- **Two-challenge-inversjonen:** overstyrer forelderen samme steg to turer på rad, spør protokollen om profilen skal oppdateres — eksplisitt, aldri stilltiende mutasjon.
- Verste-utfall-utgangen (INV-10) er forutsigbart til stede gjennom hele flyten med norsk konvensjon (113/116117 kun i reelle stoppkriterium-kontekster) — og protokollen sier eksplisitt at virkeligheten går foran appen: *«Barnet først. Appen etterpå.»*

## 8. Planlegging

Planlegg-fanen fjernes (R2). Planlegging i Protokollen er tre ting:

1. **«Ta med, ta på ved»-steget** — militærdoktrinens antisiperende lag («be bold, start cold»-strukturen, faglig validering for inaktive vognbarn kreves): *«Ta med ullgenseren — på ved stopp i parken.»* Egen rådstype i tripletten.
2. **Morgendagens protokoll som én linje + varsel** (deltaform: «i morgen trengs regntrekket»).
3. **Pakkeprotokollen** (barnehage/handoff, B11): samme triplettgrammatikk, pakkelaget som sekvens.

Punkt 2 og 3 er tids-/koordineringsverdi → premiumlaget. Punkt 1 er del av dagens gratis svar.

## 9. Premium og monetisering (B-rammen — gratis sikkerhetskjerne)

**Gratis, ufravikelig (amputasjonstesten skal bestås):** dagens fulle protokoll i begge moduser, alle sikkerhetssteg og stoppkriterier, nakkesjekk-læringen, degradert fallback, tur-rytmens kontrollpunkter (låseskjerm-/varselbårne — Flighty-PRO-gating av sikkerhetsbærende Live Activity er forkastet kopi), enkeltdeling av protokollkortet, verifieren.

**Premium («Rutine»-laget) = tid, minne, koordinering:** morgendagens/ukens protokoll + varsler, pakkeprotokoller, protokollhistorikk med kalibrering («protokollen husker at Ida blir varm i vogna»), stående handoff-koordinering til faste omsorgspersoner, widget/auto-start av turrytme, flere barn med full historikk.

**Monetisering:** 29–39 kr/mnd eller sesongpass 149–199 kr [hypotese-spennene fra 07-business-models, låses ikke før prototypetest]. Reverse-trial av komfortlaget, hendelsesbasert med 14-dagers kommuniserbar dato. Paywall aldri på svarflaten, aldri i farevær; første forespørsel etter et *komfort*-øyeblikk. Utløp er nøytral tilstandsmaskin: komfortlaget sovner, sikkerhetskjernen består, ingen tapsliste. Nøktern status-copy: «Du har brukt protokollen i to ulike situasjoner» + brukerens egen rapport — aldri «verifisert», aldri stemme-retorikk. Institusjonell kanal (helsestasjon/kommune) holdes åpen — se business rationale.

## 10. Navigasjon

Ikke tab-chassis som primærmodell. Tre lag i dybden, ikke bredden: (1) **Protokollflaten** (hjem — alt daglig skjer her, situasjonsinngangene morfer den), (2) **Bak arket** — grunnlaget: rådata, kilder, proveniens, ett nivå bak (INV-1s demoteringsregel gjort til arkitektur), (3) **Garderobe + profil** (substitusjonsgrunnlag, scope-flagg, innstillinger) nås fra toppen, aldri i veien for beslutningen. Deep-linking: hver situasjonsinngang og hvert protokollkort er adresserbart (varsel → rett inn i riktig protokollvariant).

## 11. Motion

Motion er tilstandsskifte, aldri pynt og aldri differensiering (forbudt som primær). Tre bevegelser totalt: steg-bekreftelse (laglinjen setter seg), modusskifte normal↔avvik↔degradert (tydelig, rask, én transisjon), maskering ved utløp. Ingen perpetual motion, ingen 3,2 s-seremoni (fjernet per R1), full respekt for redusert bevegelse — protokollen er identisk lesbar uten animasjon.

## 12. Lys

Lys-først, utendørs-først: produktet brukes i gangen og på trappa, i norsk vinterlys. Kontrast dimensjonert for sollys (kontrastrom-kollapsen fra restgap A): verdikt, tilstandslinje og steg skal overleve i ren gråtone. Alle tilstandssignaler er **strukturelle** (form, maskering, tekststempel) — aldri luminansbaserte (dimming er usynlig ute). Mørkt tema finnes for nattstell, men er sekundært; dark-first-vedtaket utfordres i tråd med A-listen.

## 13. Typografi og spacing

Tre typografiske ranger, strengt: **TILSTAND** (størst, fast plass), **HANDLING** (stor, verb først — «Ta på», «Kjenn», «Fjern»), begrunnelse (demotert, aldri konkurrerende). Forbeholdet har samme rang som løftet (INV-4). Én kolonne hele veien — det er dette som gjør xxxLarge Dynamic Type bevisbar (arbeidshypotesen 15–25 % ikke-standard tekststørrelse). Spacing: generøs vertikal rytme mellom steg (steget er enheten, ikke kortet), nedre tredjedel reservert handling/innganger, treffmål dimensjonert for hanske/barn-på-arm — over WCAG-minimum, konkret terskel settes i prototypetest (hanske-gapet er udekket research, flagges).

## 14. Haptikk

Funksjonell og øyefri: én distinkt bekreftelses-puls per read-do-steg (fungerer med telefonen i lomma på siste steg), én særegen signatur for stoppkriterium/modusskifte til avvik, ingenting ellers. Haptikk er redundans for blikket (hansker, barn på armen), aldri belønning.

## 15. Maskot og illustrasjon

Maskoten finnes ikke på protokollflaten. Den er aldri avsender av verdikt eller sikkerhet (grunnlov); avsenderen av protokollen er den faglige kilden med synlig proveniens. Maskoten lever i én statisk positur (R3) i ikke-besluttende lommer: garderobens tomtilstand, onboardingens velkomst. Illustrasjon er funksjonell: plaggglyfer med tekst, lagsnittet som kanonisk figur (INV-12 — samme figur 1:1 på widget, handoff-kort og i app), sone-glyfer som seksjonsmerker. Ingen gradient/animasjon/maskot som differensiering.

## 16. Tilgjengelighet

Protokollens lineære natur er dens tilgjengelighetsstyrke: én kolonne, én rekkefølge, én handling om gangen — skjermleseropplevelsen er identisk med seendes opplevelse fordi tripletten er medium-uavhengig (INV-1). Krav: fullverdig VoiceOver/TalkBack der hvert steg er én ytring; xxxLarge uten layoutbrudd (bevises per retningskrav); WCAG AAA-kontrast på verdikt/steg pga. sollys; ingen gest-eneste innganger; piktogram aldri alene; «vet ikke»/Skip alltid synlig; énhånds nedre-sone-drift; haptisk redundans. Klarspråk-nivå: korte deklarative setninger, verb først, testes mot lesbarhet i norsk kontekst (5.1-overføringen er (b)).

## 17. Risiko

**ÉN kreativ produktrisiko — utførelsespremisset:** Hele retningen hviler på at foreldre under tidspress vil *utføre* en protokoll (bekrefte, sjekke, følge rekkefølge) og ikke bare *se* et svar og legge bort telefonen. Hvis utførelseslaget oppleves som formynderi eller friksjon, kollapser retningen til en dyr liste — og avviksmodusen er spesialtilfellet som kan utløse alarmtretthet hvis tilstandsklassifiseringen fyrer for ofte.
*Falsifiseringstest:* prototypetest med samme motorsvar i to armer — (A) protokollutførelse, (B) statisk liste (pluss nullmodellen værapp + ni-ords-regel som obligatorisk baseline per fase 3). Mål: faktisk gjennomført nakkesjekk (observert/teach-back, ikke selvrapport), korrekt håndtering av innlagt avvikssteg (bilstol-scenariet), beslutningstid, frafall midt i read-do-sekvens, og andel dager klassifisert som «avvik» over en simulert værmåned. Retningen faller hvis utførelsesarmen ikke gir målbart høyere korrekt håndtering enn liste-armen, eller hvis read-do-frafallet er høyt der det gjelder sikkerhetssteg, eller hvis avviksmodus fyrer så ofte at deltakerne slutter å skille tilstandene (etterlevelses-advarselen, tverrsyntesen pkt. 8, er den forhåndsregistrerte forventningen som kan felle den).

**ÉN representasjonsrisiko — lagstabelen/lagsnittet som primærform:** Den fysiske rekkefølge-representasjonen (lagsnitt + sonegrupperte laglinjer) kan være tregere å avlese enn en enkel liste under stress, og kan avleses med falsk presisjon («snittfiguren viser nøyaktig hvor varm hun er») — samme feilklasse som den forkastede spatial-triage-hypotesen, i mildere form. Piktogram-forskningen (15,7 % besto ANSI-terskelen) advarer direkte mot antatt forståelse.
*Falsifiseringstest:* forståelsestest av lagsnitt + laglinjer mot ren tekstliste hos ikke-innførte foreldre: gjenfortell antrekket (teach-back), utfør på dukke, mål rekkefølgefeil og avlesningstid ved standard og xxxLarge tekst; hvert sikkerhetsbærende element må nå 85 %-terskelen (ANSI-analog) med tekst synlig. Faller representasjonen, beholdes beslutningsarkitekturen (moduser + triplett) med ren tekstsekvens — representasjonen er utskiftbar, arkitekturen er retningen.

## 18. Originalitetsport-regnskap (Sols port)

- **Tre lånte primitiver (maks tre):** (1) to-modus sjekklistefilosofien flow-verify/read-do (luftfart), (2) tilstandsklassifisering-før-innhold med faste graderte fraser (I-PASS/hastegradsvokabular), (3) det fysiske kontrollpunktet med feilkildeavvisning — nakkesjekken (Lullaby Trust).
- **Babyora-eid kjerneinteraksjon:** rådstripletten *neste handling → kontrollpunkt → stoppkriterium* som atomisk, medium-uavhengig enhet, med **usikkerhet representert som kontrollfrekvens** i stedet for tall. Finnes ikke i noen referanseapp eller noe referansedomene i denne sammensetningen.
- **Eksplisitt anti-referanse:** værdashbordet (rådata + kort/chips), inkludert dagens egen HjemScreen.
- Ingen skjerm skal kunne spores til én kildeapp; alle tall fra enkeltkilder (30 min, terskler, priser) bærer hypotesestatus til de er målt eller fagsignert.

## 19. Implementeringskompleksitet

Se feasibility-notatet. Kort: motoren gjenbrukes 100 % — Protokollen er en re-representasjon av eksisterende pipeline-output, og den kabler ved design de to døde sikkerhetsledningene (vognMode, bilstol) som situasjonsinnganger. Størst nybygg: protokollkompilatoren (plagg → påkledningsrekkefølge + kontrollpunktinnsetting) og tilstandsklassifisereren (avledes av eksisterende hard/soft block-signaler). Skrotes: UkeScreen/Planlegg-chunken, FinnAntrekk-drillen, seremonien. Gratis-kjernen krever ingen backend; premium-koordinering arver B-rammens kjente identitets-/backendkostnad. Native widget/Live Activity i Capacitor er dyrest og fases sist — turrytmen starter som in-app + lokale varsler.

## RETNINGSKORT
**PROTOKOLLEN (H1-ætten)** — filosofi: ett svar med deklarert autoritetsgrense («Protokollen ser været. Du ser barnet»); skjermen utføres, ikke leses; tilstand bestemmer format / produktidé: plagglisten som utførbar sikkerhetsprotokoll — atomisk rådsenhet er tripletten neste handling → kontrollpunkt → stoppkriterium (INV-1+INV-10); to moduser: normal = flow-så-verifiser (ett trykk), avvik = read-do steg-for-steg; degradert = maskert svar + konservativ generisk fallback / onboarding: 2 inputs (fødselsmåned + sted), scope som preconditions (feber/prematur → helsestasjon), lærer ETT memory item (nakkesjekken) for liv uten app / hjem: protokollflaten — tilstandslinje («Vanlig dag/Følg med/Avvik») + lagstabel innerst→ytterst gruppert i kroppssoner + situasjonsinnganger i tommelsonen (ut nå/vognsøvn/bilstol/andre tar turen); delta-form når protokollen står seg; INGEN kort/chips / anbefaling: full liste gratis som sekvens; lag bærer funksjon (ECWCS); usikkerhet = tettere kontrollpunkter, aldri tall; svakeste premiss navngis / resultat: kvittering (grunnlag + svakeste premiss + gyldighet til kl.), tur som rytme med hendelsesbaserte kontrollpunkter + contingency-grener; terminal verifier skyldfri med «vet ikke» / planlegging: ingen Planlegg-fane; «ta med, ta på ved»-steg gratis; morgendags-/pakkeprotokoll premium / premium+monetisering: B-rammen — sikkerhetskjerne + turrytme + verifier + enkeltdeling gratis; premium = tid/minne/koordinering (fremtidsprotokoller, historikk/kalibrering, stående handoff, widget); 29–39 kr/mnd el. sesongpass 149–199 kr [hyp.]; reverse-trial 14 d; aldri paywall på svarflate / navigasjon: dybde ikke bredde — protokollflate → «bak arket» (rådata/proveniens) → garderobe/profil; deep-link per situasjon / motion: kun tilstandsskifte (steg setter seg, modusskifte, maskering); ingen seremoni / lys: lys-først, sollys-dimensjonert, tilstandssignal strukturelt aldri luminans / typografi+spacing: 3 ranger (TILSTAND/HANDLING verb-først/begrunnelse), én kolonne = xxxLarge-bevisbar, nedre tredjedel handling, store treffmål / haptikk: øyefri bekreftelsespuls per steg + egen signatur for stoppkriterium; aldri belønning / maskot: fraværende på protokollflaten, aldri verdikt-avsender, én statisk positur i tomtilstander; kanonisk figur = lagsnittet («løken»), ikke barnefigur / tilgjengelighet: lineær protokoll = SR-identisk opplevelse, triplett medium-uavhengig, piktogram aldri alene, AAA-kontrast, «vet ikke» alltid gyldig / business rationale: protokollformat er fagsignerbart (steg+stoppkriterier auditerbare 1:1) → helsestasjonskanalen; differensierer på utførelsesstøtte, ikke data; graduation ærlig (lærer bort memory items) → sesongpass; lånte primitiver: 2-modus sjekkliste, tilstand-før-innhold, nakkesjekk; eid: tripletten + usikkerhet-som-kontrollfrekvens; anti-referanse: værdashbordet inkl. egen HjemScreen

## PRODUKTRISIKO
Utførelsespremisset: retningen hviler på at foreldre under tidspress vil UTFØRE en protokoll (bekrefte steg, gjøre nakkesjekk, følge rekkefølge) — ikke bare se et svar og legge bort telefonen. Slår premisset feil, kollapser retningen til en dyr liste; spesialtilfellet er avviksmodusen, som mister all autoritet hvis tilstandsklassifiseringen fyrer for ofte (alarmtretthet, jf. 68–99 %-funnene og etterlevelses-advarselen: read-back-praksis kollapser under friksjon). FALSIFISERINGSTEST: to-armet prototypetest med samme motorsvar — (A) protokollutførelse vs. (B) statisk liste, pluss obligatorisk nullmodell (værapp + ni-ords-regel). Mål: faktisk gjennomført nakkesjekk (observert/teach-back, ikke selvrapport), korrekt håndtering av innlagt sikkerhetssteg (bilstol-scenariet), beslutningstid, frafall midt i read-do-sekvens, og avviksmodus-frekvens over en simulert værmåned. Retningen felles hvis utførelsesarmen ikke gir målbart høyere korrekt håndtering enn listearmen, hvis read-do-frafall rammer sikkerhetssteg, eller hvis deltakerne slutter å skille tilstandene fordi «Avvik» fyrer for ofte.

## REPRESENTASJONSRISIKO
Lagstabelen/lagsnittet som primærform: den fysiske rekkefølge-representasjonen (konsentrisk lagsnitt + sonegrupperte laglinjer) kan være tregere å avlese enn ren liste under stress, og kan avleses med falsk presisjon (figuren tolkes som måling av barnets faktiske varmetilstand) — samme feilklasse som den forkastede spatial-triage-hypotesen (invariant-hypotese 4), i mildere form; piktogram-forskningen (kun 15,7 % besto ANSI 85 %-terskelen) advarer mot antatt forståelse. FALSIFISERINGSTEST: forståelsestest hos ikke-innførte foreldre — gjenfortell antrekket (teach-back) og utfør på dukke, mål rekkefølgefeil og avlesningstid ved standard og xxxLarge, sammenlignet med ren tekstsekvens; hvert sikkerhetsbærende element må nå 85 %-terskelen med tekst synlig, og ingen deltaker skal beskrive figuren som måling av barnets tilstand. Faller representasjonen, beholdes beslutningsarkitekturen (moduser + triplett) med ren tekstsekvens — representasjonen er utskiftbar, arkitekturen er retningen.

## FEASIBILITY
GJENBRUK (høyt): hele motorpipelinen står urørt — recommend.ts (modifiers→conflicts→softBlocks→hardBlocks + finalizeSafety), tables.ts, tog-table.ts, kalibreringsloopen (i dag ukablet) og alternatives.ts (substitusjon) leverer alt innhold Protokollen trenger; retningen er en re-representasjon av eksisterende output. Situasjonsinngangene kabler ved design de to døde sikkerhetsledningene: vognMode (hardkodet 'awake' i HjemScreen.tsx:433/UkeScreen.tsx:390 tross motorstøtte i recommend.ts:58–60) og bilstol/HB-9 (safety.ts:269–282, aldri satt i produksjon). NYTT (middels): (1) protokollkompilator — mapper motorens plaggsett til påkledningsrekkefølge per sone/lag med innsetting av kontrollpunkter/stoppkriterier fra eksisterende safety-flags; ren TS-modul oppå categories.ts/visibility.ts; (2) tilstandsklassifiserer normal/avvik/degradert — avledes deterministisk av eksisterende hard/soft block-signaler + værterskler + datalder, ingen ny motorlogikk; (3) scope-preconditions (prematur/feber) = copy + ett flagg per matrise-risiko §2.2–2.3; (4) ny protokollflate erstatter HjemScreen. SKROTES: UkeScreen/Planlegg (595 kB-chunk), FinnAntrekk-juster-drillen (erstattes av steg-nivå-korrigering, fjerner samtidig temperaturbånd-inkonsistensen), 3,2 s-seremonien. KOSTNADSDRIVERE: gratis-kjernen krever ingen backend (lokal, som i dag); premium-koordinering arver B-rammens kjente identitets-/backendkostnad (eierport-avhengig); native widget/Live Activity i Capacitor (no.klemeg.app) er dyrest og fases sist — turrytmen starter som in-app-flate + lokale varsler. Samlet kompleksitet: MIDDELS — mest re-representasjon og kabling av eksisterende, minst ny logikk av de tenkelige retningene i H1-ætten; største tekniske usikkerhet er protokollkompilatorens rekkefølgedata (påkledningsrekkefølge finnes ikke eksplisitt i datamodellen i dag og må legges til per plaggkategori).