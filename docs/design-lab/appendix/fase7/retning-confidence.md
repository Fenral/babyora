# RETNING: CONFIDENCE INSTRUMENT — «Spennet» (H2-ætten)

**Babyora Design Lab fase 7 · radikal retning 2 av 3 · 2026-08-05**
Felles grunnlov: de 12 invariantene (`appendix/fase7-forberedelse/invarianter-kopiaudit.md`). Felles sikkerhetslag: risikomodellen (`appendix/fase3/matrise-risiko.md` §2). Forretningsramme: Modell B «gratis sikkerhetskjerne» som primærhypotese (eierport 1, `07-business-models.md`).

---

## 1. Filosofi

**Appen slutter å late som ett eksakt antrekk er sannheten.** Ingen modell kan vite at akkurat denne kombinasjonen er riktig for akkurat dette barnet i akkurat denne vinden — å påstå det er falsk presisjon, og falsk presisjon i et sikkerhetsprodukt er en tillitsbombe med tidsinnstilling. Confidence Instrument bytter orakelrollen mot instrumentrollen: produktet **diagnostiserer situasjonen** og viser det **trygge spennet** av svar, med den kalde grensen beskyttet hardere enn den varme (INV-4 — asymmetrien er Babyora-eid terreng ingen referanseapp dekker), med **svakeste premiss synlig** (INV-3) og med **korrigering i rådets egne premisser** (INV-5).

Avviket fra de andre retningene ligger i **beslutningsarkitekturen**, ikke stilen: der Protokollen sier «gjør dette, sjekk her, stopp hvis», sier Spennet «her er terrenget, her er gulvet du ikke skal under, her er hvor deres valg står i det». Forelderen beholder dømmekraften; appen leverer grensene og det svakeste leddet i sin egen vurdering.

Fire faglige ankere utenfor app-verdenen bærer filosofien (hoykonsekvens-ppe.md):
- **ISO 11079:** utilstrekkelig beskyttelse konverteres aldri til «for kaldt» — den konverteres til et tidsbudsjett med kontrollpunkt. Spennet svarer aldri bare nei; det svarer «med det dere har: trygt en stund til — kjenn på nakken, så revurder».
- **PEWS:** en trygghetsverdi uten fastkoblet respons er verdiløs. Hver sone i spennet eier sin handling, og **økt sjekkfrekvens er en legitim mellomrespons** — appen kan foreslå hyppigere fysisk nakkesjekk i stedet for å eskalere rådet.
- **Lullaby Trust:** minste reversible korreksjon («fjern ett lag») er standardrespons, og kontrollpunktet er kroppslig med feilkilde-avvisning innebygd («kjenn på nakken — ikke hendene, de er alltid kalde»).
- **Skredvarselet:** utstedt-tidspunkt + gyldig-til trykkes på selve svaret; foreldet svar mister påstandsstatus (INV-2).

**Originalitetsport-regnskap (Sols krav):** Maks tre lånte primitiver: (1) skredvarselets utstedt/gyldig-til-stempel, (2) PEWS' nivå-med-fastkoblet-respons, (3) ISO 11079s underdekning-til-tidsbudsjett. Én Babyora-eid kjerneinteraksjon: **det asymmetriske varmespennet med premisshåndtak** (ingen referanse har asymmetrisk intervall — INV-4 (c)). Én eksplisitt anti-referanse: **Owlet/babymonitor-estetikken** — instrumentet måler ikke barnet, det vurderer situasjonen; all medisinsk måleapparat-visualitet (kurver, sensortall, puls-språk) er forbudt, fordi den ville påstå en presisjon produktet ikke har.

---

## 2. Produktidé

### Kjerneinteraksjonen: Varmespennet

Én kanonisk figur (INV-12), definert én gang, gjengitt 1:1 på alle flater: en vertikal sone-figur med tre felt og to grenser.

- **Kaldgulvet** (nedre grense): rendret som *terreng* — tykk, skravert, fysisk. Det er ikke en strek, det er et gulv. Å plassere et antrekk under gulvet krever bevisst handling med friksjon (se §13 Haptikk). Gulvet flytter seg aldri av brukerens justeringer — kun av risikomodellen (alder, vind, varighet, søvn).
- **Varmetaket** (øvre grense): tynnere, justerbart terreng. Overoppheting er reell (SIDS-forskningen, SB-3), så taket er ingen pynt — men i utekontekst er feilkosten asymmetrisk, og figuren viser det: gulvet er visuelt og funksjonelt tyngre enn taket. **Asymmetrien eies av risikomodellen, ikke av flaten:** i vogn-søvn-modus inverterer den (kjøligere er tryggere enn for varm — Lullaby Trust), og figuren rendrer da taket som det harde terrenget. Samme figur, situasjonsstyrt asymmetri.
- **Spennet** (mellom grensene): det trygge området. Bredden er ærlig: usikre premisser (vindkast, grensevær) **utvider terrengsonene innover** — usikkerhet spiser av spennet fra den beskyttede siden, aldri omvendt. Usikkerhet er altså representert *fysisk i figuren* — som terreng som vokser — ikke som fotnote eller prosentsats. Ingen tall på aksen: soner, ikke skala (ingen falsk numerisk presisjon).

På spennet plasseres **antrekk som posisjoner**: appens anbefalte plaggliste står som en markør midt i spennet; et kandidat-antrekk forelderen selv har komponert dømmes ved at det plasseres der det faktisk havner — i spennet, nær gulvet, under gulvet, over taket. Dommen er aldri en score, alltid **posisjon + fastkoblet respons** (PEWS): «I spennet — gå ut» / «Nær kaldgulvet — greit for en kort tur; kjenn på nakken etter en liten stund» / «Under gulvet — ett lag til før dere går» / «Over taket — fjern ett lag, hen blir svett». Sonen «nær gulvet» utløser aldri alarm, den utløser økt sjekkfrekvens — det er ISO/ACGIH-strukturen: underdekning blir rytme med kontrollpunkter, ikke forbud. NB: inntil en validert tidsmodell finnes oppgis **ingen minutt-tall** («trygt i ~40 min» er forbudt per Sols felling og hypotesegruppe 7) — kontrollpunktene er hendelses- og kroppsbaserte («ved stopp», «kjenn på nakken», «ved sludd: inn»), ikke numeriske.

### Premisshåndtakene (INV-5)

Under figuren står premissene rådet hviler på, hver som et håndtak i barnets valuta: «8 mnd» · «vindutsatt vogn» · «våken og aktiv» · «ute ca. én time». Å dra i et håndtak endrer spennet umiddelbart og synlig — korrigering skjer i rådets egne premisser, aldri i et separat skjema. «Har ikke ullbody» er et premisshåndtak med substitusjonsforslag fra `alternatives.ts` — aldri feilmelding, aldri kjøpsanledning. Hver overstyring kvitteres med omfang: **«Gjelder bare denne turen — endrer ikke profilen til Astrid.»** Profilendring er et eksplisitt eget valg (scoping-regelen fra Apple Fitness-mekanismen, INV-5).

### Svakeste premiss (INV-3)

Kvitteringslinjen står alltid på svarflaten, aldri bak et info-ikon: «Bygger på: målt vær Blindern 07:40 · alder · vogntype. **Usikrest: vindmålingen.**» Svakeste ledd navngis eksplisitt — dette finnes ikke i noen referanseapp og er lab-eid form. Forbeholdet har samme typografiske rang som løftet.

---

## 3. Onboarding

Minste informasjon før første trygge svar (INV-8). To felt + én tillatelse:

1. **Barnets fødselsmåned** (gir alder — motorens eneste obligatoriske personinput).
2. **Scope-porten:** «Født mer enn tre uker før termin, eller syk i dag?» — Ja ruter til klartekst: «Da gjelder ikke standardrådene våre. Snakk med helsestasjonen.» (risikomodellen 2.2/2.3: scope-avgrensning som copy + flagg, ingen diagnosemotor). Dette er ikke friksjon — det er den billigste sikkerhetsfunksjonen i hele produktet.
3. **Posisjon** med begrunnelse i én setning («Vi henter været der dere er — ingenting annet»).

Deretter rendres hjemflaten umiddelbart med dagens spenn og premissene synlige som håndtak: **systemet påstår, brukeren korrigerer unntaket** (Hyundai-inversjonen, INV-8). Ingen quiz, ingen iscenesatt beregning (forkastet kopi-listen er bindende), ingen konto. Vogntype, ullpreferanse og garderobe er frivillig andreetasje som kan korrigeres første gang de faktisk er feil — i selve håndtaket, i kontekst.

---

## 4. Hjem: Situasjonsrouteren

Hjemflaten ER routeren (H2) — fire dører i forelderens jobbspråk (INV-7), plassert i nedre to tredjedeler (tommelsonen, encumbrance-funnene):

1. **«Hva skal hen ha på?»** → forskrivning: full plaggliste plassert midt i spennet. Gratis, alltid (INV-9 / B-rammen).
2. **«Holder dette?»** → validering: forelderen komponerer/velger kandidat-antrekket, som dømmes mot spennet med posisjon + minste reversible justering.
3. **«Vi blir ute en stund»** → varighetsmodus: samme spenn, men varighet og aktivitet er løftet til primærhåndtak, og svaret inkluderer rytme («ta med ekstra lag, på ved stopp» — ECWCS-doktrinen: antrekket er en plan over tid) og kroppslige kontrollpunkter.
4. **«Noen andre tar over»** → eksport: den kanoniske spennfiguren + gyldighet + svakeste premiss + én kontaktvei som delbart kort (native share, kontofritt mottak — INV-11 minstelast). Retningen bygger bevisst ikke Closed-loop-sløyfen (det er retning 3s terreng); den eksporterer kun sin kanoniske representasjon.

Øverst: dagens spenn i kompaktform med ferskhetsstempel («Beregnet 07:42 · gjelder til 11») — status, ikke beslutning. Én beslutning per skjerm. Flerbarnsbytte er et filter i toppen av flaten, aldri en vegg (Netflix-veggen er forkastet kopi). **Ærlig deklarasjon:** router-som-permanent-hjem har tynt belegg (INV-7 (b), hypotesegruppe 1) — dette er retningens strukturelle veddemål og sies høyt, med testplan i §17.

---

## 5. Anbefaling

Rådsgrammatikken (INV-1) ligger over figuren: forhold → konsekvens → plagghandling, handlingen dominant. «Vind gjør at det kjennes som −7. **Ullbody, mellomlag og dress — og lue som dekker ørene.**» Rådata (temperatur, vind, målestasjon) alltid tilgjengelig, alltid ett nivå bak. Plaggene vises som funksjonslag (fukttransport/isolasjon/vind — ECWCS-strukturen), ikke som merkevarer. Delta fra i går er en handlingsutløser med synlig referansepunkt (INV-6): «Kaldere enn i går — mellomlaget inn igjen», aldri dom over gårsdagens valg. Skamfri doktrine gjelder overalt: «vet ikke» er alltid et gyldig svar i verifieren, overstyringer kommenteres aldri moralsk, og «2 av 2 stemte»-retorikk samt ordet «verifisert» er forbudt (Sols runde 6-krav).

## 6. Resultat og aldring

Etter valget: kvitteringen (grunnlag + svakeste premiss + gyldig-til). Svaret eldes ærlig (INV-2) med **strukturell** degradering — ikke luminans, som kollapser i sollys (fase 4-restgap A): fersk → aldrende (synlig absolutt stempel) → **utløpt: spennfiguren maskeres** (glass-cockpit-prinsippet: plausibel-men-ugyldig er farligere enn synlig fravær) og flaten faller tilbake til konservativt generisk råd som ikke avhenger av ferske data: «Rådet er utløpt. Inntil nytt: kle etter årstid, og kjenn på nakken.» Det maritime DR-mønsteret: fortsett å hjelpe, men si tydelig at du navigerer på bestikk. Etter turen: mikroverifier med tre skyldfrie valg (passe / for varm / for kald / vet ikke) som mater kalibreringsloopen (i dag ukablet — audit funn 2) og på sikt smalner spennet per barn.

## 7. Planlegging

Planlegg-fanen som egen flate skrotes (R2). Planlegging er ett spørsmål: «Hvordan blir spennet i morgen?» — levert som delta («I morgen: kaldere. Mellomlaget frem») om kvelden, pluss pakkeliste generert fra morgendagens spenn (B11-jobben). Fri bruk: sjekk i appen (pull). Premium: levert ferdig som varsel/widget (push) — tid og minne, aldri sikkerhet (se §8).

## 8. Premium og monetisering (B-rammen)

**Gratis, alltid, uamputert:** hele svarflaten — full plaggliste nå/her, hele spennet med asymmetri, validering av kandidat-antrekk, alle premisshåndtak, hele sikkerhetslaget (hard/soft blocks, scope-porter, kaldgulvet), enkeltdeling av kortet, verifieren. Amputasjonstesten håndhever grensen: en uerfaren forelder skal kunne velge trygt antrekk med KUN gratispakken i samtlige in-scope-scenarier. Dommen over et antrekk er sikkerhetsinformasjon og kan aldri gates.

**Premium = tid, minne, koordinering:** delta-varsler og widget (endringen levert uten appåpning), historikk («sist det var −8 brukte dere dette — det holdt»), garderobematching mot eget skap, morgendagens spenn + pakkeliste levert, stående familiedeling med automatisk kortlevering, Live Activity på tur med spennet i terminalfase som bærer verifieren (INV-12). Prishypoteser fra fase 6 (testes, låses ikke): 29–39 kr/mnd, sesongpass 149–199 kr. Reverse-trial av komfortlaget med deterministisk, synlig evalueringsstatus — været er aldri en skjult forbruksmåler. Paywall aldri på svarflaten, aldri i farevær; første forespørsel ved intensjon på komfortflate etter et verifisert komfortøyeblikk. Ved utløp: dvale, ikke tapsliste. Kommunal per-aktiv-lisens (helsestasjonskanalen) består som undermodell.

## 9. Navigasjon

Ingen tab-bar. Routeren er roten; hver dør er en modus ett nivå ned; kvittering/rådata er ett nivå bak svaret. Tilbake går alltid til routeren. Innstillinger/profil bak én rolig dør øverst. Hver modus er en egen rute (deep-linking, som dagens tab-fravær sperrer — A-punktet fra fase 3). Maks dybde: to nivåer fra rot til alt.

## 10. Motion

Bevegelse er epistemisk, aldri dekorativ, og aldri primær differensiering (bindende regel). Den eneste betydningsbærende animasjonen er **instrumentets 1:1-respons på premisshåndtakene** — direkte manipulasjon uten easing-teater, slik at forelderen ser årsak→virkning i spennet. Transisjoner ≤200 ms. Ingen iscenesatt beregning (motoren er øyeblikkelig og skal se slik ut — 3,2 s-seremonien er skrotet, R1). Ingen perpetual motion. `prefers-reduced-motion`: alle tilstandsskift blir øyeblikkelige; informasjonen ligger aldri i bevegelsen alene.

## 11. Lys

Lys-først (dagslys-rasjonalet + sollysfysikken: kontrastrommet kollapser ute, 1000+ nits-realiteten). All betydning bæres strukturelt: terreng-skravur, form og tekst — aldri subtile gråtoner eller luminansforskjeller alene. Kaldgulvet er skravert mønster + tekst, ikke bare farge (fargeblindhet + sollys). Mørk modus finnes som semantiske tokens, men degradering/staleness signaliseres alltid strukturelt (maskering + stempel), aldri ved dimming.

## 12. Typografi og spacing

Norsk klarspråk på 3.–5.-trinnsnivå (rom 5-funnene); én dominant innsikt per flate. Handlingen er typografisk størst; tall (temperatur, klokkeslett) er sekundære og settes i tabulære sifre i stempler. Forbehold («Usikrest: …») har samme typografiske rang som løftet — aldri småskrift (INV-4). Spacing er romslig med berøringsmål ≥48 pt i nedre sone; layouten skal bevises ved Dynamic Type xxxLarge: ved store størrelser **omformes spennfiguren tapsfritt til stablet tekstform** («Under trygt / Trygt spenn / For varmt» som seksjoner med samme innhold) — figuren har en kanonisk setningsform som alltid finnes (se §15).

## 13. Haptikk

Haptikk er gulvets fysikk: å dra et håndtak slik at antrekket faller under kaldgulvet gir en hard detent (rigid impact) og krever en bevisst andre gest for å bekrefte — friksjon på kald side er funksjonell asymmetri, ikke straff. Bevegelse innenfor spennet gir lette ticks. Ingen suksess-/feiringshaptikk (konfetti-klassen er forkastet kopi). Haptikk bærer aldri informasjon alene (tilgjengelighet).

## 14. Maskot og illustrasjon

Maskoten er **aldri avsender av verdikt eller sikkerhet** (bindende). Den finnes kun i nøytrale mellomrom: onboarding-velkomst, tomtilstander («vi venter på været»), én statisk positur (R-vedtaket). På svarflaten er avsenderen faglig: «Grensene bygger på Lullaby Trust / MET / AAP» med synlig kilde (INV-1). Illustrasjon ellers er funksjonell: plaggikoner som må bestå forståelsestesting (se §15), aldri stemningsbærende gradient-teater — animasjon/gradient/maskot er forbudt som differensiering.

## 15. Tilgjengelighet

- **Tekstparitet som lov:** hver instrumenttilstand har en kanonisk setningsform («Antrekket ligger i trygt spenn, nær den kalde grensen. Minste justering: legg til ullbody. Kjenn på nakken underveis.») — det VoiceOver leser, det xxxLarge viser, det kortet eksporterer, det en skjermleser-bruker og en seende bruker får, er samme innhold (INV-12 + piktogramrisikoen: sikkerhetsbærende punkter kan aldri være ordløse alene).
- Dynamic Type til xxxLarge uten tap (arbeidshypotese: 15–25 % har ikke-standard tekststørrelse).
- Kontrast og struktur dimensjonert for sollys; aldri mening i luminans alene.
- Énhåndsbruk under belastning: alle primærhandlinger i nedre tredjedel, store mål (encumbrance: ~40 % økt treffavvik med last).
- Hvert sikkerhetsbærende ikon testes mot 85 %-terskelen (ANSI Z535.3) med tekst som belte-og-seler.
- WCAG 2.2 AA som gulv; verste-utfall-utgangen (113/116117-henvisning ved scope-brudd) forutsigbart til stede i alle moduser (INV-10).

## 16. Business rationale

B-rammen er den eneste modellen der instrumentets ærlighet ikke er en konverteringstrussel: et produkt som viser sin egen usikkerhet kan ikke samtidig selge sikkerhet — men det kan selge **tid, minne og koordinering** oppå en gratis, komplett sikkerhetskjerne. Ærligheten ER distribusjonsstrategien: målet er rekkevidde og tillit, og «appen som viser sitt svakeste premiss» er den eneste påkledningsappen en helsesøster kan anbefale uten å gå god for en svart boks — det kjøper helsestasjonskanalen, Norges sterkeste distribusjonsmaskin. Differensieringen ligger i beslutningsarkitektur ingen kan skjermkopiere seg til: det asymmetriske intervallet finnes ikke i noen referanse (INV-4), og verifier-loopen som smalner spennet per barn bygger en datamur som samtidig er premium-innholdet (historikk/kalibrering). Retningen konkurrerer ikke med værappene om rådata og ikke med Whering-klassen om garderobe — den eier spørsmålet «hvor går grensene for mitt barn, akkurat nå».

## 17. Risiko (nøyaktig én av hver — falsifiseringstester i egne felt)

- **Kreativ produktrisiko:** intervallet kan undergrave lettelsesjobben — se eget felt.
- **Representasjonsrisiko:** instrumentfiguren kan avleses som måling/presisjon eller med feil beskyttet ende — se eget felt.
- Deklarerte sekundærhypoteser (ikke retningens veddemål, felles lab-plikter): router-som-hjem (INV-7 (b)) testes som del av produktrisikotesten; at ferskhetsstempel faktisk hindrer bruk av foreldet råd (Sols antakelse 6) testes i stale-prototypen.

## 18. Implementeringskompleksitet

Se feasibility-feltet. Kort: motoren og sikkerhetslaget gjenbrukes fullt; spennberegning er en API-utvidelse av eksisterende tabellverk; instrumentkomponenten med tekstparitet er den største nye flaten; tab-chassis, seremoni, Planlegg-fane og Juster-drill skrotes; ingen backend for kjernen.

## 19. Invariant-dekning (kvittering)

INV-1 (§5) · INV-2 (§6) · INV-3 (§2) · INV-4 (§2 — bærende) · INV-5 (§2 håndtak) · INV-6 (§5/§7) · INV-7 (§4 — deklarert hypotese) · INV-8 (§3) · INV-9 (§8) · INV-10 (§15) · INV-11 (§4 dør 4, kun minstelast) · INV-12 (§2/§15 kanonisk form + tekstparitet). Forkastede kopier-listen er respektert i sin helhet; ingen minutt-tall uten validert tidsmodell; skamfri tekstdoktrine gjennomgående.

## RETNINGSKORT
**CONFIDENCE INSTRUMENT — «Spennet» (H2-ætten)**
**Filosofi:** Instrument, ikke orakel — appen diagnostiserer situasjonen og viser det trygge spennet med asymmetrisk beskyttet kald side (INV-4, Babyora-eid); svakeste premiss alltid synlig; forelderen beholder dømmekraften.
**Produktidé:** Varmespennet — kanonisk sonefigur med Kaldgulv (hardt terreng) og Varmetak (mykere, inverteres ved vogn-søvn); usikkerhet vises fysisk som terreng som spiser av spennet; antrekk dømmes som posisjon + fastkoblet respons (PEWS), aldri score; premisshåndtak korrigerer i rådets egne premisser med scope-kvittering; underdekning → rytme med kroppslige kontrollpunkter (ISO 11079), aldri minutt-tall uten validert modell. Lånte primitiver (3): skredvarsel-stempel, PEWS-respons, DLE-struktur. Anti-referanse: Owlet/måleapparat-estetikk.
**Onboarding:** 2 felt (fødselsmåned + scope-port prematur/syk→helsestasjon) + posisjon m/begrunnelse; systemet påstår, brukeren korrigerer; ingen quiz/konto/seremoni.
**Hjem:** Situasjonsrouteren — fire dører i jobbspråk («Hva skal hen ha på?» / «Holder dette?» / «Vi blir ute en stund» / «Noen andre tar over») i tommelsonen; dagens spenn kompakt øverst m/gyldig-til; router-som-hjem deklarert som hypotese.
**Anbefaling:** INV-1-grammatikk (forhold→konsekvens→plagghandling, handling dominant); funksjonslag, ikke merkevarer; delta som handling uten dom; rådata ett nivå bak.
**Resultat:** Kvittering m/grunnlag + «Usikrest: …» + gyldig-til; aldring strukturell: fersk→stemplet→maskert figur→konservativt generisk fallback; skyldfri mikroverifier (inkl. «vet ikke») mater kalibrering.
**Planlegging:** Planlegg-fanen skrotet; morgendagens spenn som delta + pakkeliste; pull gratis, push premium.
**Premium+monetisering:** B-rammen — hele svarflaten, validering og sikkerhetslag gratis (amputasjonstest); premium = delta-varsler/widget, historikk, garderobematching, levert planlegging, stående deling, Live Activity; 29–39 kr/mnd / sesongpass 149–199 (hypoteser); reverse-trial m/synlig status; aldri paywall på svarflate/farevær; dvale ved utløp.
**Navigasjon:** Ingen tabs; router som rot, moduser ett nivå ned, maks dybde 2, deep-link per modus.
**Motion:** Epistemisk 1:1-respons på håndtak, ≤200 ms, ingen seremoni/perpetual motion; reduced-motion = øyeblikkelig.
**Lys:** Lys-først for sollys; mening i struktur (skravur/form/tekst), aldri luminans; mørk modus via tokens.
**Typografi+spacing:** Klarspråk 3.–5. trinn; handling typografisk størst; forbehold samme rang som løfte; tabulære sifre i stempler; ≥48 pt mål nedre sone; xxxLarge → tapsfri stablet tekstform.
**Haptikk:** Hard detent + bekreftelsesgest under Kaldgulvet; lette ticks i spennet; aldri feiring; aldri informasjonsbærer alene.
**Maskot:** Kun nøytrale mellomrom, statisk, aldri avsender av verdikt/sikkerhet; faglig avsender på svarflaten.
**Tilgjengelighet:** Kanonisk setningsform for hver instrumenttilstand (VoiceOver/xxxLarge/kort = samme innhold); ikoner testes mot 85 %-terskel m/tekst; énhånds nedre tredjedel; WCAG 2.2 AA; 113/116117 forutsigbart til stede.
**Business rationale:** Ærlighet som distribusjonsstrategi — eneste app en helsesøster kan anbefale uten å gå god for svart boks (helsestasjonskanalen); asymmetrisk intervall kan ikke skjermkopieres; verifier-loop bygger datamur = premium-innhold; eier spørsmålet «hvor går grensene for mitt barn, nå».

## PRODUKTRISIKO
**Risiko:** Intervallet kan undergrave selve lettelsesjobben. Forelderen under tidspress vil bli fortalt hva hen skal gjøre; et spenn med synlig svakeste premiss kan gi oversettelsesjobben tilbake («velg selv innenfor terrenget») — nettopp den jobben INV-1 skal fjerne — og dermed ØKE beslutningstid og uro sammenlignet med en autoritativ plaggliste. Ærligheten som skal bygge tillit kan i praksis leses som usikkerhet hos avsenderen. **Falsifiseringstest:** Prototypetest med tre armer på identisk motor og likeverdig merkevarekvalitet (fase 3-kravet): (1) Spennet, (2) autoritativ punktliste, (3) nullmodellen (værapp + ni-ords-regel + tekstmelding). 12+ scenarier inkludert grensevær og underdekning, målt på beslutningstid, forståelse (kan deltakeren forklare hvorfor antrekket er trygt?), korrekt håndtering av underdekningsscenariet og selvrapportert trygghet — pluss spontan dørpreferanse i routeren (H2-instrumentmålingen). **Fellingskriterium:** retningen faller hvis Spennet gir høyere median beslutningstid enn punktlisten UTEN målbart bedre korrekt håndtering eller forståelse i grensevær-/underdekningsscenariene — da leverer intervallet kostnad uten sikkerhetsgevinst, og ærligheten må flyttes ned til kvitteringsnivå i en punktliste-arkitektur.

## REPRESENTASJONSRISIKO
**Risiko:** Instrumentfiguren avleses feil — den dokumenterte piktogram-/instrumentrisikoen (rom 5: bare 15,7–30 % av testede piktogrammer består ANSI-kravet; falsk trygghet rammer lavkompetente hardest, og PPE-notatet flagger nettopp Confidence Instrument for dette). To konkrete feilmoduser: (1) forelderen tror figuren MÅLER barnet (måleapparat-avlesning → falsk trygghet i sanntid), (2) forelderen forveksler hvilken ende som er beskyttet — spesielt når asymmetrien inverterer i vogn-søvn-modus — og leser «nær gulvet» som godkjent-uten-forbehold. Sollys, stress og xxxLarge forsterker alle tre. **Falsifiseringstest:** Forståelsestest etter ANSI-metode på ≥20 målgruppeforeldre (rekruttert med spredning i lesekompetanse, inkl. xxxLarge-brukere; gjennomført både innendørs og i simulert sollys/utendørs): vis instrumenttilstander uten opplæring og spør «hva sier appen at du skal gjøre nå?» og «hva bygger appen dette på?». **Fellingskriterier:** hver sikkerhetsbærende tilstand må nå ≥85 % korrekt handlingsavlesning; ÉN deltaker som leser en under-gulvet- eller inverte-asymmetri-tilstand som «trygt», eller som svarer at appen har målt barnet, utløser omdesign til tekst-først-representasjon (setningsformen som primærflate, figuren som illustrasjon) før retningen kan gå videre.

## FEASIBILITY
**Gjenbruk (størst):** Hele motor-pipelinen (`src/lib/wool-layers/`: modifiers→conflicts→softBlocks→hardBlocks, `finalizeSafety`) gjenbrukes urørt som sikkerhetslag — retningskravet om felles risikomodell er oppfylt av eksisterende arkitektur. `alternatives.ts` bærer substitusjonshåndtaket direkte; `tables.ts`+TOG-tabellen gir båndene spennet beregnes fra; i18n, plaggdata og verifier-/kalibreringskoden (bygget, ukablet — audit funn 2) kables inn. **Nytt:** (1) Spenn-API i motoren — i dag returnerer `recommend.ts` punktliste; det trengs en intervallberegning (min/maks akseptabel isolasjon fra eksisterende bånd + usikkerhetsutvidelse fra premisskvalitet) — moderat, tabellverket finnes; (2) instrumentkomponenten med kanonisk tekstparitet og xxxLarge-omforming — største nye UI-flate; (3) premisshåndtak med scope-kvittering; (4) stale-livsløpet (utstedt/gyldig-til/maskering/fallback); (5) router-hjem. **Skrotes:** 3,2 s-seremonien, Planlegg-fanen (595 kB chunk for ubevist verdi), tab-chassiset, FinnAntrekk-drillen (erstattes av valideringsdøren — NB: dagens temperaturbånd-inkonsistens, audit funn 5 med `feelsLikeC = tempC` rå slider, må dø med den, ellers arves en tillitsfeil inn i dommen). **Må kables (felles sikkerhetsgjeld som denne retningen aktiverer):** `vognMode` hardkodet 'awake' (`HjemScreen.tsx:433`, `UkeScreen.tsx:390`) må kobles for at asymmetri-inverteringen skal virke; `context.bilstol` (HB-9, død kode) får UI-inngang som premisshåndtak; scope-portene (prematur/sykdom) er copy + flagg uten ny motorlogikk. **Arkitektur:** Kjernen er lokal-only uten backend — gratis sikkerhetskjerne krever null ny infrastruktur; premium-laget (historikk, stående deling, push-delta) krever identitet+backend senere (Bs deklarerte arkitekturkostnad, fase 6 punkt 6). **Kompleksitet samlet: middels.** Største tekniske risiko er spennberegning uten validert tidsmodell — løst ved at varighetsmodusen shipper med hendelses-/kroppsbaserte kontrollpunkter i stedet for minutt-tall, så ingen del av bygget venter på tidsmodellen.