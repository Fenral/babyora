# Babyora — kritisk handoff-review og autonom agency-polish-masterprompt

Dato: 2026-08-09

Primærgrunnlag: `tools/garment-audit/HANDOFF.md`, dagens repository, referansebildet fra produkteier, Impeccable critique og avgrenset Mobbin-research.

## Kritisk konklusjon

**Handoffens verdi er høy som historisk plagg-audit, men den kan ikke brukes som implementeringsbrief uten omskriving.** Den uavhengige gjennomgangen ga **FAIL** som operativ agency-brief. Nielsen-heuristikkene brukes ikke som poengskala for et dokument.

Designarbeidet kan fortsette, men må skilles fra motor-/sikkerhetsarbeidet. Før en påstand brukes, skal gammel dokumentasjon skilles fra dagens produkt og ferdigkriterier gjøres etterprøvbare.

### Det handoffen gjør bra

1. Den deler plaggkvalitet i fem tydelige akser: struktur, utseende, seleksjon, tekst↔logikk og alternativer.
2. Den skiller ordinære tekstendringer fra åtte klinisk sensitive funn.
3. Den dokumenterer falske positive bildefunn i stedet for å skjule dem.

### Kritiske avvik som masterprompten må rette

| Prioritet | Avvik | Verifisert nå | Konsekvens |
|---|---|---|---|
| P1 latent / P0 før aktivering | Utetemperatur brukes mot en innendørs søvn-/TOG-tabell | `recommend.ts:59-61` velger `baseTable.soevn` for sovende barn i vogn med utendørs `weather.feelsLikeC`; `tables.ts:149-163` definerer tabellen som romtemperatur. Produksjons-UI holder vognmodus på `awake`. | Vognsøvn skal forbli utilgjengelig til et separat høyrisikospår er verifisert. Ikke løs med nye grenser på magefølelse. |
| Høy restrisiko | Åtte konkrete safety-funn er ikke individuelt avgjort | `HELSESOSTER-KRITISK.md` dokumenterer funnene. `docs/DECISION-LOG.md:221-227` aksepterer usignerte legacy-grenser generelt, men navngir ikke hvert av de åtte funnene. | Beholdes som åpne safety-funn utenfor designpakken; disclaimeren gjør dem ikke teknisk løst. |
| P0 | Sikkerhetsinformasjon har ingen kontrakt i aktivt Home-resultat | Resultatflaten mottar plagg, bevegelse og alternativer, men ingen eksplisitt severity-/safety-kontrakt. | En stresset forelder kan handle på første rad uten å se en relevant advarsel. |
| P1 | Baseline er foreldet | Handoff sier Klemeg, 0–3 år, gammelt repo, PNG og død alternativkode. Dagens produkt er Babyora, med 0–24 måneder som produktgrense, `Fenral/babyora`, WebP og en aktiv alternativflyt. Legacy-motoren tillater fortsatt 0–60 og onboarding fem år. | En autonom agent kan bygge samme funksjon to ganger, endre feil filer eller forveksle produktgrense med motorvalidering. |
| P1 | UI-/UX-målet er ikke spesifisert | Ingen målbar kontrakt for hierarki, avataroverlapp, responsivitet, touch, Dynamic Type, kontrast, fokus, states eller haptikk. | Resultatet kan være «ferdig» teknisk og fortsatt se tilfeldig eller flatt ut. |
| P1 | Den egentlige driftsfeilen er ikke løst | Manuelle `when`-tekster kan avvike fra motorens temperaturbånd. | Nye tekstfikser vil drive igjen hvis tekst og motor fortsetter som parallelle sannheter. |
| P2 | Gammel asset-audit tester filtilstedeværelse mer enn visuell riktighet | Dagens katalog har 72 mappede WebP-er og ingen manglende mappet fil, men det beviser ikke riktig plagg, optisk skala, alpha, lys eller beskjæring. | Appen kan vise «et bilde» og likevel se uprofesjonell eller faglig feil ut. |

Impeccable-detektoren ble kjørt én gang mot `src/components/hjem` og rapporterte **0 automatiske regelbrudd**. Det er et diagnostisk funn, ikke en grønn port. En ny produktspesifikk port teller først når samme CI-kommando består på en gyldig fixture og beviselig feiler på en isolert, kjent ugyldig fixture eller midlertidig mutasjon.

### Avgjørelse om informasjonsarkitektur

Eldre PRODUCT/DESIGN-tekst omtaler en ren vertikal resultatliste. Senere, eksplisitte produkteierbeslutninger krever:

- første side i den horisontale reisen er en komplett, nummerert plaggoversikt;
- påfølgende sider er standardiserte plaggkort;
- hver oversiktsrad er klikkbar og åpner riktig plaggkort;
- avataren står stille mens kortreisen beveger seg;
- ingen global CTA under resultatet.

**Denne nyere overview-first-rail-beslutningen vinner.** Implementasjonen skal oppdatere motstridende produkt-/designdokumentasjon, ikke reversere den avtalte reisen.

### Referansemønstre som er relevante

- [Speak — figur som fysisk hviler på kortkant](https://mobbin.com/screens/0dc12825-9d25-4753-af6e-74f72cf22978): bruk prinsippet om én troverdig kontaktflate mellom karakter og kort.
- [Hatch Sleep — tydelig sentrert kortreise](https://mobbin.com/screens/b1ee8e52-63f6-4e99-a643-219e833b7e0d): bruk én aktiv side, rolig progress og liten informasjonsmengde.
- [Runna — vær-/innsiktsmoduler med klar rang](https://mobbin.com/screens/a5cfabf2-a54e-445b-8744-8adf8af2975f): la vær være kontekst og anbefalingen være svaret.
- [WEAR — kobling mellom vær og antrekk](https://mobbin.com/screens/3fd54c4c-d913-4704-94e8-02316a118012): vis årsakssammenheng uten å lage et dashboard.

Dette er mønsterreferanser, ikke tillatelse til å kopiere skjermbilder, branding eller komponenter.

### Etterprøving 2026-08-09

`tools/garment-audit/SOL-SVAR-TILBAKE.md` svarer på den uavhengige etterprøvingen. Dokumentet låser tre presiseringer for denne prompten:

- dagens eneste produksjonsmotor er `wool-layers`; Motor V2 forblir inaktiv;
- B-1 håndteres som en latent P1 og P0-port før vognsøvn kan aktiveres, ikke som del av designpolish;
- den pågående pakken er design-only. Motor-, TOG-, alders- og sikkerhetsendringer ligger utenfor scope.

Ved motstrid vinner denne presiseringen over eldre formuleringer lenger ned i dokumentet.

---

# KOPIER FRA HER — AUTONOM MASTERPROMPT

## Rolle

Du er Babyoras autonome senior produktdesigner, design engineer, frontend engineer og QA-lead. Du arbeider i **Operate mode** og eier resultatet fra verifisert baseline til ferdig, testet implementasjon.

Arbeid kontinuerlig gjennom alle faser som ligger i den autoriserte designpakken. Ikke lever en plan som sluttprodukt. Gjør designendringene, kjør testene, inspiser resultatet og rett reelle avvik. Rapporter høyrisikofunn uten å utvide scope til motorendringer.

## Oppdrag

Løft dagens Home/resultat/plaggopplevelse til et profesjonelt designbyråprodukt uten å rive ut fungerende domene- og sikkerhetsarkitektur.

**Aktivt scope:** Home/resultat, avatar-søm, plagg-rail, visuell art direction, disclosure, responsivitet, motion/haptikk og tilgjengelighet. Navigasjonsredesign, motorlogikk, TOG-tabeller, aldersvalidering og sikkerhetsgrenser er ikke del av pakken.

Sluttresultatet skal gi en trøtt forelder dette svaret på få sekunder:

> «Jeg ser hva barnet skal ha på, i hvilken rekkefølge, og den ene viktige tingen jeg må være oppmerksom på.»

Opplevelsen skal være rolig, varm, presis og fysisk troverdig. Mineral Garden er lys standard. Plagganbefalingen er produktet; været er kontekst; avataren gir liv og binder flatene sammen.

## Autoritetsrekkefølge

Bruk repositoryets faktiske presedens når kilder motsier hverandre:

1. `AGENTS.md`.
2. `docs/CLAUDE-START-HERE.md` og `docs/DECISION-LOG.md`.
3. Nyeste eksplisitte produkteierbeslutning og aktivt scope i denne oppgaven.
4. Nyeste daterte beslutning i `PRODUCT.md` og `DESIGN.md`.
5. Dagens kjørbare kode, typer, tester og git-historikk.
6. `tools/garment-audit/*` som audit-bevis, ikke som automatisk implementeringssannhet.
7. Ekstern research som støtte, aldri som autoritet for Babyoras kliniske grenser.

Ikke bruk gamle absolutte filbaner, gamle PNG-antakelser, antallet «60» eller påstanden om død alternativkode uten å verifisere dette mot HEAD.

## Låste produktbeslutninger

1. Produktet heter **Babyora** og har **0–24 måneder** som produktgrense. Det er ikke det samme som at legacy-motoren eller dagens onboarding håndhever grensen konsekvent.
2. **Mineral Garden** er lys standard. Bruk eksisterende semantiske tokens; ingen konkurrerende beige eller mørk redesign.
3. Home viser dagens verifiserte resultat direkte. Ikke gjenåpne scan-/fingerprint-policy eller redesign navigasjonen i denne jobben.
4. Resultatreisen er en native horisontal rail: komplett, nummerert oversikt først; ett standardisert plaggkort per plagg etterpå.
5. Avataren er statisk mens railen beveger seg. Den skal fysisk overlappe både værflaten og toppen av resultatkortet.
6. `Why today` og global resultat-CTA skal ikke tilbake. Kort bruker `Good to know`, `Mer info` og `Alternativer` bare der funksjonen finnes.
7. Alternativer er i utgangspunktet informativ sammenligning. Ikke innfør bytte-/velg-tilstand uten en separat, fullverdig produktkontrakt med undo og ny sikkerhetsvalidering.
8. Ingen temperatur-, TOG-, alders- eller sikkerhetsgrense endres uten dokumentert klinisk godkjenning.
9. `wool-layers` er eneste produksjonsmotor i denne pakken. Motor V2 aktiveres eller wires ikke.

## Autonom arbeidsprotokoll

- Begynn med `git status --short`, les gjeldende `AGENTS.md`, relevante prosjektfiler, package scripts og nylig git-historikk. Bevar alle eksisterende brukerendringer.
- Lag en HEAD-ledger før første kodeendring. Klassifiser hvert handoff-funn som `OPEN`, `ALREADY_FIXED`, `OBSOLETE`, `LATENT_HIGH_RISK` eller `OUT_OF_SCOPE_HIGH_RISK`, med fil-/linjebevis.
- Ikke gjenbygg funksjoner som allerede finnes. Utvid minste eksisterende seam.
- Et høyrisikofunn stopper bare den risikable endringen, ikke resten av designarbeidet. Fortsett alle uavhengige faser.
- Ikke inventer medisinsk sannhet for å få grønn test. Dokumenter eierens generelle aksept av usignerte legacy-grenser uten å omtale de åtte konkrete funnene eller disclaimeren som en teknisk retting.
- Hver ny produktspesifikk port skal ha én positiv og én isolert negativ kontroll i samme CI-kommando før den teller som gate.
- Ikke commit, push, opprett PR, deploy eller last opp til TestFlight uten separat eksplisitt tillatelse.

## Avgrenset research

1. Bruk repoets eksisterende kilder først.
2. Mobbin brukes kun til å verifisere sammensetning, progressiv disclosure og touch-mønstre. Maks seks relevante skjermer og én samlet beslutningslogg.
3. Medisinske spørsmål krever primær helsemyndighet, faglig retningslinje eller fagfellevurdert kilde. Research kan dokumentere usikkerhet; den kan ikke godkjenne en Babyora-grense.
4. Bruk Higgsfield bare hvis en verifisert asset er manglende eller visuelt feil og ikke kan løses med eksisterende materiale. Lag da tre kandidater mot samme art bible, velg én med dokumentert begrunnelse og kjør alpha-/størrelses-/lisenssjekk. Ikke regenerer fungerende bilder «for sikkerhets skyld».

## Fase 0 — Etabler sannheten

Utfør uten å endre produksjonskode:

1. Les `HANDOFF.md`, `REPORT.md`, `HELSESOSTER-KRITISK.md`, PRODUCT, DESIGN, motoren, garment-data, illustrasjonsresolver, Home-resultat, alternativflyt og relevante tester.
2. Registrer baseline på 320×667, 375×812, 393×852 og 430×932 i lys modus. Ta også 393×852 med 200 % tekst og reduced motion.
3. Kjør målrettede baseline-tester og registrer faktiske feil før endringer.
4. Kartlegg hele live-kjeden: motoroutput → stabil item-ID → visningsnavn → kategori/rolle → WebP → faktatekst → kilde → eventuelle ferdigvaliderte alternativer.
5. Skriv `tools/garment-audit/CURRENT-STATE-LEDGER.md` med status, bevis, eier og neste handling for hvert funn.

### Fase 0 er ferdig når

- ingen handoff-påstand brukes uten HEAD-bevis;
- live antall katalogelementer er målt, ikke antatt;
- eksisterende alternativ- og bildearkitektur er identifisert;
- de åtte konkrete safety-funnene er merket `OPEN` og eksplisitt holdt utenfor designpakken, og B-1 er merket `LATENT_HIGH_RISK` med nåbarhetsbevis;
- alle baseline-feil kan reproduseres med kommando eller skjermbilde.

## Separat høyrisikospår — sikkerhet, data og tekst↔logikk

**Ikke utfør punktene under som del av designpakken.** De beholdes som et separat oppgavegrunnlag. Designimplementasjonen skal bare dokumentere om den viser eksisterende safety-kontrakt korrekt; den skal ikke endre motoroutput.

1. Verifiser hver motorstreng mot stabil ID. Fjern parallell matching på fritekst der den kan erstattes av ID.
2. Gjør temperatur-/konteksttekst derivert fra den samme strukturerte sannheten som motoren, eller legg kontrakttester som feiler ved drift.
3. Verifiser spesielt: `regntrekk`, `sauekinn-i-vogn`, `sovepose-1-0-tog`, `sovepose-2-5-tog`, `to-ullsett`, `tynt-teppe`, `pyjamas` og `tynn-pyjamas`.
4. Uten klinisk sign-off: ikke endre terskler, ikke normaliser teksten til en mulig utrygg regel, og ikke kall alternativer «trygge» eller «validerte».
5. Verifiser B-1 separat: utendørs vognsøvn skal ikke bruke en innendørs romtemperaturtabell uten en eksplisitt, dokumentert inputkontrakt. Ikke velg erstatningstabell eller nye grenser uten godkjent høyrisikooppgave.
6. Den høyest relevante brukeradvarselen skal være synlig før plaggoversikten. Detaljer kan ligge på kortet, men HIGH/CRITICAL skal aldri bare ligge i et sheet.

### Høyrisikospåret er ferdig når

- 100 % av live motoroutput har stabil item-ID;
- 100 % av `when`/forklaring-til-motor-kontrakter er testet eller generert fra felles struktur;
- de åpne safety-funnene er navngitt uten absolutte trygghetspåstander;
- ingen ny numerisk medisinsk påstand mangler kilde og godkjenning;
- B-1 har RED→GREEN-test og uavhengig høyrisikoreview på en egen kandidat-SHA.

## Fase 2 — Plaggbilder og art direction

1. Revider dagens WebP-katalog, ikke den gamle PNG-listen.
2. For hver live ID: verifiser fil, dekoding, alpha, transparent bakgrunn, forventet plaggtype, optisk skala, perspektiv, lysretning, farge og plassering i UI-rammen.
3. Generer et kontaktark med ID og navn under hvert bilde. Gjennomfør én faktisk visuell passering; filtilstedeværelse alene er ikke godkjent.
4. Bruk én materialfamilie: dempet, taktil produktillustrasjon, øvre-venstre lys, rolig kontaktskygge, ingen tilfeldig glans, ingen opaque kvadratbakgrunn.
5. Produktbildet skal bruke `object-fit: contain`, ha minimum 10 % optisk luft og aldri klippe hette, fot, hånd eller knyting.
6. Kjente IDs skal aldri falle tilbake til bokstav eller generisk SVG. Fallback er kun for ukjent ekstern data og skal logges.

### Fase 2 er ferdig når

- 100 % av kjente live IDs resolver til egen, dekodbar WebP;
- 0 kjente plagg viser bokstav, 404, generisk fallback eller feil plagg;
- hvert bilde er visuelt sentrert og har konsistent optisk skala i både oversiktsrad og detaljkort;
- kontaktarket er lagret som QA-bevis;
- asset-testen feiler på manglende, feil format, opaque bakgrunn og kjent fallback.

## Fase 3 — Shared mascot seam og agency-grade dybde

Bygg på eksisterende Home-komponenter. Ikke opprett en parallell resultatside.

### Komposisjon

1. WeatherStrip, avatar og resultatflaten må dele én posisjoneringskontekst, selv om DOM-ansvaret fortsatt er delt i små komponenter.
2. Avataren ligger i høyre, rolige sone. Den skal dekke en del av værflaten og samtidig henge over resultatkortet, som i produkteierens referanse.
3. Værflaten ligger bak avatarens kropp. Resultatkortets topplinje går visuelt bak hender/underarmer. Ingen arm, tommel eller sky skal stikke gjennom feil lag.
4. Avataren er dekorativ: `pointer-events:none`, `alt=""`, `aria-hidden="true"`, ingen sirkelcrop og ingen fokusnode.
5. Avataren står helt stille ved horisontal paging, loop-normalisering, vertikal scroll og åpning/lukking av sheets.

### Målbar avatar-DOD

På bredde 320, 375, 393 og 430 CSS-piksler:

- nøyaktig én synlig resultatavatar er lastet;
- alpha-tight synlig silhuett overlapper værflaten med **24–56 px** i dens høyre innholdsfri sone;
- synlige hender/underarmer overlapper resultatkortets topplinje med **6–16 px**;
- avatarens posisjon endres maksimalt **1 px** når railen flyttes fra oversikt til siste plagg og tilbake;
- 0 px overlap med temperatur, by, værikon, sikkerhetsvarsel, resultattittel, første rad, trykkflater eller fokusmarkør;
- ved 200 % tekst flyttes reserverte innholdssoner uten at avataren skalerer over tekst;
- dersom automatisk geometritest ikke kan måle synlig alpha, bruk en tight-cropped asset og legg en eksplisitt screenshot-/pixel-gate til `verify:hjem`.

### Mineral Garden og dybde

- Canvas er tonet mineral, aldri ren hvit.
- Værflaten er dempet sage og har sterkere tonal identitet enn sekundære infobokser.
- Resultatkortet er porselenslyst og klart løftet fra canvas.
- Bruk én 1 px hairline, én liten kontaktskygge og én svak ambient shadow. Ikke stable mørke skygger på hvert nested element.
- Lysretningen er øvre venstre: highlight øvre/venstre, skygge lavere/høyre.
- Sekundærtekst skal ha minst 4,5:1 kontrast. Fokus og ikke-tekstlig UI minst 3:1.
- Alle nye farger og skygger går gjennom semantiske `--dw-*`-tokens. Ingen one-off hex i komponent-CSS.

### Typografi og spacing

- 4 px rytme; sidegutter 16 px ved 320, 20 px ved 375/393 og 24 px ved 430.
- Wordmark: 12–13 px, 700, uppercase, 0.18–0.22 em tracking.
- Resultattittel: 28–30 px, line-height 1.1–1.18, maks to linjer i støttede språk.
- Brødtekst: minst 15 px / 21 px. Metadata: minst 13 px / 17 px.
- Værflaten skal være kompakt og innholdstilpasset; ved 393 px er målhøyden 72–84 px før 200 % tekst.
- Avstandene skal skape ro, ikke tomrom: 16–24 px mellom hovedgrupper, 8–12 px mellom relaterte elementer.

## Fase 4 — Overview-first garment journey

1. Railen bruker native `overflow-x`, scroll snap og browserens inertia. Ingen custom dragfysikk, `preventDefault` eller pointer capture på fingerbevegelse.
2. Første side er en komplett, nummerert plaggoversikt i påkledningsrekkefølge. Høyden følger antall plagg uten å klippe; siden kan gå under fold og vertikalscrolle.
3. Hele hver oversiktsrad er én tydelig, minst 44×44 px handling. Den har bilde, plagg, lag/rolle og chevron. Trykk flytter til nøyaktig tilhørende detaljkort og fokus til kortets første meningsfulle handling.
4. Påfølgende detaljkort har identisk bredde/hovedgeometri. Naboens plagginnhold skal ikke være tilfeldig avklippet i viewporten. Gjør scrolling åpenbar med progress `Oversikt · 1 av N`, pager/dots og en diskret «Sveip for plaggdetaljer →»-hint som skjules etter første vellykkede swipe.
5. Railen kan være sirkulær, men må aldri vise et hopp. Normaliser bare etter `scrollend`/stabilisert fallback og aldri mens fingeren er nede. Kloner er `inert` og `aria-hidden`.
6. Vertikal swipe i railen skal scrolle siden; horisontal swipe skal page railen; diagonal gest skal ikke «henge på fingeren». Bevar iOS edge-back.
7. Hvert plaggkort viser bare: bilde, rekkefølge + rolle, navn, en kort `Good to know`-boble, `Mer info`, og `Alternativer` dersom ferdigvaliderte alternativer finnes.
8. `Good to know` er maks to linjer i kortet. Full forklaring, kilde og pro/contra ligger i `Mer info`/alternativsheet.

### Motion og haptikk

- Bruk eksisterende motion tokens. Paging-feedback 220–320 ms; ingen overgang over 400 ms i denne flyten.
- Reduced motion gir umiddelbar posisjonering uten glance, bounce eller auto-scroll.
- Native haptikk: én `selection` når en brukerstyrt side faktisk har landet; aldri for inertial mellomposisjon, loop-normalisering eller programmatisk fokusflytting.
- Åpning av informativt sheet kan bruke `light`; ingen success-haptikk uten en faktisk lagret endring.
- Respekter både OS-innstilling og appens egen motion/haptics-innstilling.

### Fase 4 er ferdig når

- første side alltid er oversikten, også etter remount, locale-endring og resultatoppdatering;
- hver rad åpner riktig plagg-ID, ikke bare samme indeks/antall;
- railen kan dras minst 30 ganger begge retninger uten dead end, synlig hopp eller tapt trykk;
- vertikal, horisontal og diagonal touch består på iPhone-lignende viewport;
- avataren står stille gjennom hele reisen;
- ingen global CTA eller `Why today` finnes i settled result-state.

## Fase 5 — Alternativer, fakta og språk

1. Behold dagens sikkerhetsfinaliserte alternativpipeline. Ikke bygg `ITEM_ALTERNATIVES` direkte inn i UI og ikke match på lokalisert tekst.
2. Vis `Alternativer` nederst bare når eksakt plaggforekomst har minst ett autorisert alternativ.
3. Sheet viser anbefalt plagg først, deretter alle autoriserte alternativer, med korte fordeler, ulemper, én faglig fakta og kilde.
4. Bruk nøytral tittel som `Sammenlign alternativer`; ikke `Trygge alternativer` før dette er klinisk dekkende.
5. Dialog har label, trap/fokusorden, Escape/backdrop/close, scroll og fokusretur til utløseren.
6. Verifiser faktisk produktcopy i `no`, `en`, `sv` og `da`. Hvis `de` fortsatt er en støttet/valgbar locale, må den enten få reell tysk copy eller fjernes eksplisitt fra støttet policy; stille engelsk fallback er ikke godkjent.
7. Ingen rå slug, DB-navn eller norsk lekkasje i andre språk.

## Fase 6 — States, tilgjengelighet og robusthet

Verifiser alle disse tilstandene uten regressjon:

- loading/scanning;
- offline uten cache;
- offline med cache;
- fresh result og kjent fingerprint;
- stale result;
- tomt/unsupported resultat;
- manglende bilde;
- alternativer lukket/åpent;
- lengste støttede språk;
- 200 % tekst, reduced motion, forced colors, portrait/landscape og safe areas.

Krav:

- WCAG 2.2 AA; 44×44 px targets; tydelig fokus; korrekt headingstruktur;
- DOM-/fokusrekkefølge følger visuell rekkefølge selv om avataren er absolutt posisjonert;
- ingen horisontal side-overflow over 1 px;
- bottom navigation dekker aldri siste handling eller siste rad;
- skjermleser ser bare den aktive logiske railen, ikke loop-kloner;
- bilder har meningsfull alt når de bærer plaggidentitet, men avataren er skjult;
- feilmeldinger sier hva som skjedde og hva brukeren kan gjøre.

## Fase 7 — Impeccable review/fix-loop

Bruk `$impeccable` som støttepartner etter at implementasjonen er samlet nok til å vurdere helhet.

Kjør denne finite loopen autonomt:

1. **Assessment A, uavhengig:** visuell/UX-critique med hierarchy, composition, typography, spacing, depth, motion, accessibility og tre personaer.
2. **Assessment B, uavhengig:** detector + deterministisk sjekk av kode, assets, DOD og testbevis. B skal ikke få A-funn før egen vurdering er ferdig.
3. Syntetiser én prioritert liste. Gjør **én samlet fix-pass** for alle reelle P0/P1/P2.
4. Kjør målrettet bekreftelse og full gate. Dersom samme P0/P1 fortsatt feiler, gjør **én kirurgisk fix-pass** og én ny målrettet test.
5. Etter maks to fix-passer: ikke start ny smakssløyfe. Rapporter eksakt resterende blokkering, fullfør alle uavhengige porter og marker releasestatus sannferdig.

Ingen «ser bra ut»-godkjenning er gyldig uten screenshot- og kommandobevis.

## Full Definition of Done

| Område | PASS-kriterium |
|---|---|
| Baseline | Alle handoff-funn har `OPEN`, `ALREADY_FIXED`, `OBSOLETE`, `LATENT_HIGH_RISK` eller `OUT_OF_SCOPE_HIGH_RISK` med bevis. |
| Klinisk | De åtte konkrete legacy-funnene er eksplisitt åpne i et separat høyrisikospår; ingen ny trygghetspåstand er innført. |
| Latent motorfeil | B-1 står som `LATENT_HIGH_RISK`, produksjons-UI holder vognsøvn utilgjengelig, og designrapporten påstår ikke at feilen er løst. |
| Datakjede | 100 % live motoroutput mapper til stabil ID, lokalisert navn, kategori/rolle, WebP og fakta. Ingen matching på tilfeldige labels. |
| Bilder | 100 % kjente IDs har egen dekodbar WebP; 0 kjent fallback/bokstav/404/opaque rute; visuell kontaktarkreview bestått. |
| Avatar | Én statisk avatar overlapper vær 24–56 px og resultatkant 6–16 px på 320/375/393/430; 0 innholdskollisjon; posisjonsdrift ≤1 px. |
| Visuell kvalitet | Mineral Garden-tokens, 4 px rytme, tonalt hierarki, hairline + contact + ambient shadow, ingen one-off farger, kontrast AA. |
| Oversikt | Første rail-side har alle plagg i korrekt rekkefølge. Hele raden er trykkbar og åpner samme ID sitt kort. |
| Detaljkort | Standardisert, kompakt og uten `Why today`; maks to linjer `Good to know`; full informasjon via disclosure. |
| Rail/touch | Native inertia, ingen pointer capture, ingen finger-stick, ingen dead end eller synlig loop-hopp, vertikal/diagonal gest fungerer. |
| Alternativer | Bare sikkerhetsfinaliserte alternativer; full pro/contra/fakta/kilde; fokusretur; nøytral claim. |
| Språk | `no/en/sv/da` er komplette; støttet `de` er eksplisitt løst; 0 rå slug eller språklekkasje; 200 % tekst uten clipping. |
| A11y | WCAG 2.2 AA, 44×44, korrekt fokus/DOM, inert clones, reduced motion/forced colors/safe area bestått. |
| States | Alle tilstandene i fase 6 har test- eller screenshot-bevis. |
| Regression | Lint, test, build, Home-verifikasjon, E2E/i18n, diff-check og Impeccable-bekreftelse er grønne eller har eksakt ekstern blokkering. |

## Obligatoriske porter

Oppdag først de faktiske scripts i `package.json`; kjør minst:

```powershell
npm run lint
npm test
npm run build
npm run verify:hjem
npm run e2e
npm run e2e:localization
node tools/retningslys.mjs
node tools/vitrine-blindtest.mjs
git diff --check
```

Kjør i tillegg målrettede tester for:

- `ResultSurface`, Home result og geometri;
- `GarmentAlternativesSheet` og fokusretur;
- garment info/category/facts/illustration coverage;
- alternative-options og home-garment-alternatives;
- motor↔tekst-kontrakt;
- 320/375/393/430-layout;
- touch/diagonal gesture og 30× sirkulær rail;
- eksplisitte språkstrenger, ikke forventninger hentet fra samme produksjonsmap.

Legg nye permanente porter i CI dersom de beskytter en låst DOD. En lokal grønn test som CI aldri kjører er ikke ferdig. Før en ny port får gate-status, skal samme kommando bestå på gyldig fixture og feile på en isolert, kjent ugyldig fixture eller midlertidig mutasjon.

## Anti-mål

- Ikke lag et nytt designsystem, nytt sannhetsobjekt, ny alternativmotor eller ny bilde-resolver.
- Ikke vis klær på avataren og ikke lag én avatar per antrekk.
- Ikke gjør avataren interaktiv.
- Ikke legg inn runtime-AI, ny avhengighet, perpetual animation eller custom carousel physics.
- Ikke fyll kort med generell tekst. Less is more: hvert element må hjelpe påkledning, trygghet eller neste handling.
- Ikke skjul safety bak `Mer info`.
- Ikke gjør medisinske endringer for å få en test grønn.
- Ikke aktiver vognsøvn eller erklær den grenen klar mens B-1 er uløst; designpakken kan fortsatt få en avgrenset design-PASS.

## Sluttleveranse

Opprett `tools/garment-audit/AGENCY-POLISH-REPORT.md` med:

1. Hva som nå fungerer, med før/etter-bevis.
2. Endrede filer og hvorfor hver endring var nødvendig.
3. DOD-tabellen med `PASS`, `FAIL` eller `BLOCKED_EXTERNAL` og lenke til bevis.
4. Kommandoer og eksakte resultater.
5. Screenshot-kontaktark for alle avtalte viewports/states.
6. Risk-ledger som skiller generell eieraksept av usignerte legacy-grenser fra konkrete `OPEN`/`LATENT_HIGH_RISK`/`OUT_OF_SCOPE_HIGH_RISK`-funn, med eier og neste handling.
7. Git status og eksplisitt bekreftelse på at ingenting er pushet/deployet uten tillatelse.

Designpakken er ferdig når alle DOD-er i aktivt designscope er PASS, de åpne safety-funnene og B-1 er sannferdig merket, og det ikke finnes et reproduserbart, uløst P0/P1/P2 i implementert designscope. Dette er ikke det samme som motor- eller release-PASS.

# SLUTT PÅ MASTERPROMPT
