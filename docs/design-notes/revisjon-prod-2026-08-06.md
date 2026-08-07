# Produktrevisjon 2026-08-06 — MOT PRODUKSJONSBYGGET

> Ti kritikere, ett bilde hver, fanget fra `npm run preview` — ikke fra
> utviklingsserveren. Den forrige runden (62 funn) kjørte mot `vite dev` og
> meldte blant annet BLOKKERENDE på «De som passer»-listen, som ligger bak
> `import.meta.env.DEV` og aldri sendes til en forelder.

**46 funn: 4 blokkerende, 10 alvorlige, 32 mindre.**

## Status 2026-08-06, andre økt: alle blokkerende og alle alvorlige er lukket

Bekreftet mot produksjonsbygget, kjøring
`tools/product-audit/runs/2026-08-06T18-08-01-470Z`.

| Funn | Status |
| --- | --- |
| 4 blokkerende | Rettet i første økt, bekreftet i piksler nå |
| Antrekk — svaret delt i 8 steg | **Ingen endring nødvendig.** Kritikeren fanget `KlePaaOverlay` isolert. `PaakledningScreen` viser hele antrekket som ring + nummerert `<ol>` (`PaakledningScreen.tsx:450`); stepperen er et overlegg man åpner FRA lista. Eierbeslutning står. |
| Juster — nedbør motsier tallverdien | Rettet. Fyllet er reelt 0 px ved minimum, meniskusen portes på at det finnes fyll, markøren klemmes 10 px inn fra pilleendene. Bonus: vindens skrå overkant fjernet. |
| Plan — «Dagslinjen» uten tidslinje | Rettet. Viser nå 19:00/20:00/21:00/22:00 med værikon, temperatur og antrekksmerke. Gjentakelsen og det løsrevne kulepunktet er borte. |
| Plaggbiblioteket — materialprikker | Rettet i første økt, bekreftet: alle tre prikkene lesbare. |
| Innstillinger — bryteren leste «på» | Rettet i første økt. |
| TOG — overskrift kolliderer med baren | **Var allerede borte** etter eierbeslutning B+A (commit `e418354`). Nå bekreftet i piksler: ~118 px klaring. |
| Varm eller kald — handlingsbrikkene | Rettet i første økt, bekreftet: rene etiketter uten pille. |
| Første vinter — listen renner gjennom baren | Rettet, se nytt funn under. |
| Første vinter — åpen leksjon lik de låste | Rettet. Anbefalt kort ligger på `--dw-accent-surface` med accent-kant og «ANBEFALT DENNE UKA». |
| Første vinter — fem av seks tidslåst | Rettet. Låsene er rådgivende: «Anbefalt uke N» i stedet for «Åpnes om N dager», og ingressen sier «du bestemmer tempoet selv». Betalingsmuren er eneste lås igjen. |

### Nytt funn samme dag, funnet i pikslene under etterprøvingen

Bunn-faden var feil på ALLE fanenivå-flater, ikke bare Første vinter.
`--dw-fade-bunn` er `linear-gradient(to bottom, black 92%, transparent 100%)`
— den når full gjennomsiktighet først ved containerBUNNEN, altså 0 px over
kanten, mens den flytende baren begynner ~76 px lenger opp og har en
gjennomskinnelig flate. Innhold krysset barens overkant i full dekkevne.
Målt på TOG («Slik kler du på · 2 LAG» lesbar under baren) og på
Plaggbiblioteket (plaggrutenettet).

Nytt token `--dw-fade-over-tabbar` stopper der baren begynner, forankret i
barens egne mål. Tatt i bruk på Første vinter, TOG og Plaggbiblioteket.
`--dw-fade-bunn` er urørt — ark, dialoger og onboarding har ikke noe under
seg og bruker den fortsatt riktig.

## Andre økt, del 2: 11/11 fanget, mindre funn lukket

Kjøring `tools/product-audit/runs/2026-08-07T00-00-57-339Z`.

### Betalingsmuren er endelig revidert

Den manglet aldri et produkthåndtak — revisjonen brukte ikke det som fantes.
`?seed=demo&entitlement=none` har ligget i `src/state/subscription-store.ts`
hele tiden, dokumentert i filhodet, dekket av test og i aktiv bruk av
`e2e/purchase-flow.ts`. `?seed=demo` alene seeder en mock-ABONNENT, og en som
allerede betaler har ingen betalingsmur å vise.

Muren selv er solid: hard og ikke-avvislig (ingen «Lukk»), tre likeverdige
prisrader med «Best verdi» på Årlig og ekte månedspris per rad, syv
gratisdager, og lenkeraden Gjenopprett kjøp · Personvern · Vilkår.

**Til eier — én avveining, ikke en feil.** Ingen plan er forhåndsvalgt, og
CTA-en hviler («Velg en plan for å starte gratis») til et aktivt valg er
gjort. Det er en BEVISST beslutning, dokumentert i `PaywallDialog.tsx`
(«ALDRI et forhåndsvalgt kort»), og den er etisk forsvarlig: en betalt plan
skal ikke stå ferdig avkrysset. Prisen er konvertering — standardmønsteret
forhåndsvelger den anbefalte planen så knappen er handlingsklar med én gang.
Endres dette, er det en kommersiell beslutning, ikke en designrettelse.

**Observert samtidig:** ~200 px død plass mellom gratisdager-linjen og
CTA-en, og løftet om syv gratisdager — det som senker terskelen for å trykke
— er skjermens minste og svakeste tekst.

### Mindre funn

Lukket i denne økta: nb-NO desimalkomma i Juster · AKTIVITET-velgerens valgte
segment · trelinjers undertittel · ⌘K-badgen byttet mot en ekte tøm-knapp ·
plaggrammen 11/6 så illustrasjonen fyller ≥80 % · «63» står ett sted ·
sorteringsknappen fikk flate — og den SORTERER nå, den var haptikk uten
handling · oransje frigjort fra «BEHOLD» så «Ferdig» er eneste aksent ·
symmetrisk snøfnugg · «I dag» står ett sted på Plan · gradtegnet hevet på
både Plan og Hjem · chevronene er strøkne ikoner, ikke bokstavglyfen «⌄» ·
onboardingens venstrekant, «denne iPhonen» og tomrommet · bryterens form,
hengende skilletegn, «Trondheim» ×3, orddelingen, bunn-faden og «Bytt
barn»-ikonet i Innstillinger · ordmerket BABYORA 3,67:1 → 5,67:1 ·
stedsraden fikk synlig pille · inaktive faner 3,93:1 → 6,07:1.

Nytt token `--dw-fade-bunn-kort` for det tredje fade-tilfellet: containere
som allerede klarerer baren via `--dw-tabbar-clearance`, der den
prosentbaserte `--dw-fade-bunn` dimmet ekte innhold ~50 px oppe.

**Gjenstår, til eier:** hjem-funnet «vis et hint om svaret før trykk» er
IKKE gjort — eierbeslutningen «Hjem beholdes som den er (scan-seremonien er
produktet)» står, og hintet ville tære på den. Plaggkortenes nye ramme
(11/6) er verifisert matematisk, ikke med et blikk på hver av de 63.

> RETTET 2026-08-06: skjermen het «Garderobe» i denne rapporten. Det var
> MITT navn — workflow-skriptet mitt kalte den det, og kritikeren gjentok
> det. Skjermen heter **Plaggbiblioteket**. «Min garderobe»
> (MinGarderobeScreen) er en ANNEN skjerm som ble slettet; den finnes ikke
> lenger i kodebasen. Feil navn i en funnrapport sender neste runde til
> feil sted. (Forrige runde: 62 / 7.)

Tre av de fire blokkerende var SAMME feil — innhold bak tab-baren. Målt med
`tools/verify-tabbar-klaring.mjs` viste det seg å gjelde FEM skjermer, ikke tre:
Innstillinger, TOG, Varm eller kald, Første vinter og Plaggbiblioteket.

Alle fem bare I HVILE — ingen etter rulling. Portens første utgave rullet
før den målte og var derfor grønn på 7/7 mens feilene sto der.

## [BLOKKERENDE] Plaggbiblioteket
**«+ Legg til plagg»-knappen ligger oppå tab-baren og dekker Planlegg-fanen helt**

- *Hvorfor:* Midtfanen er den lettest tilgjengelige med tommelen når man holder barnet med den andre armen. Den er nå fysisk utilgjengelig — et trykk der treffer «Legg til plagg» i stedet. Forelderen ser ikonet, trykker på det, og havner et helt annet sted enn ventet.
- *Bevis:* Ved y=1560 går tab-bar-bakgrunnen (#3B2719) fra x=67 til x=737, mens knappepillen (#523723) ligger over den fra x=253 til x=549 og vertikalt fra y=1536 til y=1648. Planlegg-fanen er sentrert på x≈390 — midt i pillen. Kalenderikonet og ordet «Planlegg» (#A79A82) skinner gjennom pillen i akkurat de samme pikslene som knappeteksten.
- *Forslag:* Løft knappen ut av tab-bar-sonen (plasser den over baren med margin, eller gjør den til en ikon-FAB nederst til høyre), eller flytt «Legg til plagg» inn i sidehodet ved siden av sorteringsikonet.

## [BLOKKERENDE] Plaggbiblioteket
**Teksten «+ Legg til plagg» er mørkere enn knappen den står på — kontrast 1,5:1**

- *Hvorfor:* Skjermens eneste handlingsknapp er praktisk talt usynlig. Kl. 07 i dårlig lys ser forelderen bare en brun flekk over menyen; ingen forklarende tekst redder dette, for teksten er selve problemet.
- *Bevis:* Glyfpiksler i teksten måler #2B1D10 mot pillbakgrunn #523723 (målt langs y=1590, x=480–500 mot x=520–540). Det gir kontrastforhold 1,51:1 — under WCAG-minimum 3:1 selv for stor tekst. Teksten er faktisk mørkere enn sidebakgrunnen (#2C1F13) rundt.
- *Forslag:* Bruk lys tekst (samme krem som «Hjem»-etiketten, ~#F2EDE4) på den brune pillen, eller snu pillen til lys fyllfarge med mørk tekst. Sikt på minst 4,5:1.

## [BLOKKERENDE] TOG
**Temperatur-skyveren – skjermens eneste betjeningselement – tegnes bak den nederste tab-baren**

- *Hvorfor:* Ingressen ber forelderen «Skyv på guiden og finn anbefalt sovepose etter temperaturen på rommet», men selve skyveren ligger under tab-baren. Med én hånd kl. 07 treffer tommelen «Planlegg»/«Hjem» og bytter fane i stedet for å endre temperaturen. Skjermen ber om en handling den samtidig gjør umulig.
- *Bevis:* Nederst i bildet (y≈1620–1670) går en horisontal skyve-skinne med skalastreker tvers gjennom hele bredden BAK tab-bar-pillen. Den runde håndtaks-knappen merket «20°» ligger midt bak teksten «Planlegg» – tallet er synlig gjennom/rundt fane-etiketten (x≈340–440). Skinnen slutter ca. 18 px over nedre skjermkant (siste piksellinje y=1687), altså uten luft under.
- *Forslag:* Legg hele «Sett romtemperatur»-seksjonen over tab-baren: gi scroll-containeren bunn-padding lik tab-barens høyde + safe-area, eller flytt skyveren opp i kortet under «Anbefalt tog». Håndtaket må ha minst 44 px fri høyde som ikke deles med fanenavigasjonen.

## [BLOKKERENDE] Varm eller kald
**Skjermens hovedhandling «Ferdig →» ligger BAK bunnfanelinja og er praktisk talt usynlig og utilgjengelig**

- *Hvorfor:* Forelderen som er ferdig med nakketesten har ingen synlig vei ut av skjermen. Knappen er ikke bare stygg – den er overlappet av fanelinja, så trykk treffer sannsynligvis «Planlegg»-fanen i stedet og kaster forelderen ut av flyten. Med én hånd kl. 07 er dette et fullstendig brudd på oppgaven.
- *Bevis:* Nederst i bildet står ordet «Ferdig» med en pil → tegnet oppå fanelinja, midt over kalenderikonet og delvis oppå fane-etiketten «Planlegg», slik at begge tekstene smelter sammen til uleselig grøt. Målt kontrast for «Ferdig»-teksten mot fanelinjens brune flate er 1,5:1 (mørkeste glyf-piksel RGB 43,29,16 mot flate RGB 82,55,35). En oransje pill-kant stikker ut nedenfor og til venstre for fanelinja – det er knappens bakgrunn som blir dekket. Samtidig er området fra y=1215 til fanelinjas overkant (y≈1508) helt tomt, ca. 146 CSS-px ubrukt plass rett over knappen.
- *Forslag:* Reserver plass til fanelinja i sidens layout (padding-bottom = fanelinjens høyde + safe-area) og flytt «Ferdig»-knappen opp i den tomme sonen som allerede finnes, i full bredde og med oransje fyll slik den åpenbart er ment å se ut.

## [ALVORLIG] Antrekk
**Svaret er delt opp i 8 steg, og skjermen viser bare ett plagg av gangen — samtidig står nedre 40 % av skjermen helt tom**

- *Hvorfor:* Forelderen med én hånd kl. 07 trenger å vite HELE antrekket for å kunne kle på barnet. Her må hun trykke «Neste» sju ganger til for å få svaret, mens det finnes rikelig plass på samme skjerm til å vise resten. Det motsier prinsippet om at svaret skal forstås før man leser videre.
- *Bevis:* Toppen sier «Steg 1 av 8» med 8 prikker (én oransje, sju grå). Under teksten «Ull holder på varmen selv når den blir fuktig.» (slutter ca. y=845 av 1688) er det ingen piksler i det hele tatt før knappene starter ca. y=1540 — omtrent 700 px / 40 % av skjermhøyden er tom bakgrunn.
- *Forslag:* Fyll det tomme feltet med hele lagrekken (f.eks. kompakt liste innerst→ytterst der aktivt lag er uthevet), slik at steget blir en fordypning i noe forelderen allerede ser i sin helhet — ikke den eneste veien til svaret.

## [ALVORLIG] Juster
**Nedbør-slideren motsier sin egen tallverdi ved minimum: håndtaket er klippet bort av sporets avrundede bunn, og det ligger en tydelig teal fyllkile OVER håndtaket selv om avlesningen sier 0.0 mm/t.**

- *Hvorfor:* Hele skjermens jobb er at forelderen skal stole på tre tall. Når stolpen viser «litt nedbør» mens tallet sier 0.0, må forelderen stoppe og tolke i stedet for å kjenne igjen svaret. I dårlig lys med barnet masende er en stolpe som ikke matcher tallet verre enn ingen stolpe.
- *Bevis:* 5x-utsnitt av nedbør-sporets bunn (x≈555-670, y≈770-860): den lyse håndtakslinjen vises kun som en kort stubb ca. en tredjedel så bred som håndtakene i temperatur- og vindsporet, og den er kuttet av bunn-radiusen. Rett over stubben ligger en teal kile som fyller nedre del av sporet. Til sammenligning har vindsporet (2 m/s) full håndtaksbredde med fyllet UNDER linjen.
- *Forslag:* Klipp fyll og håndtak til sporets form, og gi håndtaket et innrykk (inset) slik at det aldri havner utenfor det avrundede endestykket. Ved verdi 0 skal fyllet være reelt null — ingen kile.

## [ALVORLIG] Plan
**«Dagslinjen» inneholder ingen tidslinje – bare én generell setning uten klokkeslett**

- *Hvorfor:* Overskriften lover forelderen dagens forløp time for time. Det som leveres er én kulepunkt-setning uten et eneste klokkeslett, altså mindre presist enn linjen rett over («Ingen endringer frem til kl. 18:00»). Forelderen med én hånd ledig kl. 07 scanner overskriften, forventer timer, og får ingenting å handle på. Seksjonen tar plass uten å svare.
- *Bevis:* Under skillelinjen ved y≈1160 står overskriften «Dagslinjen» (tekstrad y 1194–1234), og deretter finnes nøyaktig én tekstrad i kortet: y 1294–1318 («Samme antrekk i de vurderte tidspunktene»). Kortet slutter ved y≈1376, og pikslene under er ren bakgrunn (RGB 29,19,11) helt ned til den flytende tab-baren ved y≈1530 – ingenting er klippet bort eller skjult under folden, seksjonen har faktisk bare denne ene linjen.
- *Forslag:* Vis faktiske tidspunkt i Dagslinjen (f.eks. 07 / 12 / 18 med temperatur og et lite antrekksmerke per punkt), eller fjern overskriften og la «Ingen endringer frem til kl. 18:00» stå alene. En overskrift som lover en linje må vise en linje.

## [ALVORLIG] Plaggbiblioteket
**Materialprikkene for Bomull og Vanntett er usynlige, mens Ull sin lyser**

- *Hvorfor:* Fargeprikken er systemets raske materialsignal — det du skal lese før teksten. Den virker for ett av tre materialer. Forelderen får en tom sirkel ved to av kategoriene og må lese ordet likevel, samtidig som Ull framstår som «uthevet» uten at det er ment.
- *Bevis:* Brighteste piksel i Bomull-prikken er #1E3638 og i Vanntett-prikken #113B3E, mot chip-bakgrunn #382817 — ca. 1,1:1, altså ingen synlig forskjell. Ull-prikken måler #F2C08A og er tydelig. Samme mønster gjentar seg på kortene: prikken foran «Bomull» (y≈1113) forsvinner, prikken foran «Ull» synes.
- *Forslag:* Lysne de kalde materialfargene kraftig for mørk bakgrunn (f.eks. teal → ~#6FC3C8, blå → ~#8FB8E8) slik at alle prikkene ligger på samme lyshetsnivå som Ull-prikken.

## [ALVORLIG] Innstillinger
**Bryteren «Bruk posisjon automatisk» motsier seg selv — den ser på samtidig som den er av**

- *Hvorfor:* I dårlig lys kl. 07 leser man bryterens FARGE først, ikke knottens posisjon. Lys/utfylt spor betyr «på» i alle apper. Her er sporet lyst beige mens knotten står til venstre og undertittelen sier «Bruker valgt sted» (altså av). Forelderen må lese teksten for å vite om appen henter vær der hun faktisk er — akkurat det som ikke skal kreve lesing.
- *Bevis:* Kontrollen ved høyre kant av raden (ca. x=622–722, y=995–1073): en stor hvit knott ligger HELT TIL VENSTRE inne i et lyst beige/tan spor. Samme skjerm bruker mørk brun bakgrunn for alt annet inaktivt. Undertittelen rett til venstre står «Bruker valgt sted».
- *Forslag:* Gi av-tilstanden mørkt spor (samme familie som kortbakgrunnen) med tydelig kantlinje, og reserver den lyse/aksentfargen for på. Behold knott-posisjonen som sekundært signal.

## [ALVORLIG] TOG
**Seksjonsoverskriften «SETT ROMTEMPERATUR» og hjelpeteksten «Skyv eller velg under» kolliderer med tab-baren**

- *Hvorfor:* Forelderen skal forstå svaret før hun leser forklarende tekst; her må hun først tyde tekst som ligger delvis under en annen flate. Overlappende lag signaliserer «ødelagt app» og gjør at instruksjonen om hvor man skyver, ikke leses.
- *Bevis:* Ved y≈1542 ligger «SETT ROMTEMPERATUR» og «Skyv eller velg under» oppå tab-bar-pillens øvre kant. «SE» i SETT er merkbart nedtonet der pillen dekker den (målt topplyshet 142 mot 186 for resten av samme ord), og en tynn strek fra skyve-skinnen skjærer gjennom mellomrommet mellom de to tekstene.

## [ALVORLIG] Varm eller kald
**«TA AV» / «BEHOLD» / «LEGG TIL» er formet som trykknapper, men er bare ~52×23 CSS-px**

- *Hvorfor:* De ser ut som handlingsknapper (avrundet pille, ramme, versaler, én av dem i uthevet oransje). Enten er de trykkbare – og da er trykkflaten omtrent halvparten av 44px-minimum, umulig å treffe med tommelen på en mobil kl. 07 – eller så er de bare etiketter, og da inviterer de til trykk som ikke gir noe. Begge deler koster forelderen tid i det verste øyeblikket.
- *Bevis:* Målt på «TA AV»-pillen i bildet: ramme fra y=707 til y=753 og x=612 til x=717 i et 2x-bilde (780×1688 for 390×844 viewport) = 52,5 × 23 CSS-px. «BEHOLD» har samme høyde (y=842→888). Ingen av dem har synlig ekstra klikkflate rundt seg – radskillelinjene ligger tett inntil.
- *Forslag:* Bestem hva de er. Er de statiske råd: fjern rammen og pille-formen, sett dem som ren tekst/merkelapp. Er de handlinger: gjør dem minst 44px høye i full høyde av raden.

## [ALVORLIG] Første vinter
**Den eneste tilgjengelige leksjonen ser nøyaktig ut som de låste — ingenting i flaten sier hva forelderen kan trykke på**

- *Hvorfor:* Kl. 07 med én hånd ledig skanner forelderen former og lysstyrke, ikke småtekst. Når kort 1 og kort 2–6 har identisk bakgrunn, identisk ramme og identisk hvit fet tittel, må hun lese undertekst-linjen på hvert kort for å finne ut at fem av dem ikke gjør noe. Svaret kommer etter lesing, ikke før. Resultatet er bomtrykk på kort som ikke reagerer, og et inntrykk av at appen henger.
- *Bevis:* Pikselmåling av kortflatene: kort 1 «Ull mot huden» og kort 2 «Lag på lag» har begge fyllfargen #382817, samme avrundede ramme og samme titteltekstfarge #F1E9DA i samme fete vekt. Tallsirklene 1–6 er tegnet i samme dempede brune omriss. Eneste synlige forskjeller er den lille chevronen «›» helt til høyre på kort 1, og småteksten «Åpnes om 7 dager» på kort 2. Ingen hengelås, ingen nedtoning, ingen opacitet-forskjell noe sted.
- *Forslag:* Gi det åpne kortet tydelig forrang: lysere flate eller markert ramme, og la de låste falle tilbake (redusert opacitet på tittel + hengelås-ikon i tallsirkelen). Forelderen skal se ett kort som «lyser» før hun leser et eneste ord.

## [ALVORLIG] Første vinter
**Listen renner rett gjennom tab-baren nederst — tekst ligger oppå ikoner og navigasjonsetiketter**

- *Hvorfor:* Den flytende tab-baren har ingen ugjennomsiktig eller sløret bakplate, så innholdet bak den er fullt synlig og kolliderer med navigasjonen. Både leksjonsteksten og navigasjonsetikettene blir vanskelige å lese i det området, og i dårlig morgenlys er det akkurat den typen rot som får forelderen til å miste tråden i hvor hun er.
- *Bevis:* Nederst i bildet (utsnitt y≈1470–1688): tittelen «Sove ute i vinter» på kort 6 løper rett over hus-ikonet for «Hjem», og undertekstlinjen leser «…pnes om 35 dage…» fordi «Å» ligger bak hus-ikonet og «r» bak kalender-ikonet for «Planlegg». Kortets avrundede ramme og tallsirkelen «6» er synlige tvers gjennom hele tab-bar-flaten.
- *Forslag:* Legg en ugjennomsiktig (eller kraftig slørt + mørkere) bakplate under tab-baren, slik at rullende innhold forsvinner under den i stedet for å blande seg med den.

## [ALVORLIG] Første vinter
**Fem av seks synlige leksjoner er tidslåst i opptil 35 dager — inkludert den mest sikkerhetsnære sjekken**

- *Hvorfor:* Skjermen sier selv at innholdet er «de samme helsesøster-rådene som anbefalingene i appen», altså råd som allerede finnes i produktet. Likevel er de holdt tilbake på klokke. En forelder i sin aller første vinter får ikke vite hvordan hun sjekker nakken før om fire uker, og har ikke noe synlig valg for å lese videre nå. Det bryter med at gratis aldri skal gjøres bevisst ufullstendig, og det er ikke et Plus-spørsmål — det er innhold som holdes tilbake fra alle.
- *Bevis:* Radene leser «2 Lag på lag / Åpnes om 7 dager», «3 Vind er den skjulte faktoren / Åpnes om 14 dager», «4 Vogn, bæresele eller lek / Åpnes om 21 dager», «5 Sjekk nakken / Åpnes om 28 dager», «6 Sove ute i vinter / Åpnes om 35 dager». Ingressen over sier «Bygget på de samme helsesøster-rådene som anbefalingene i appen». Ingen knapp eller lenke på skjermen tilbyr å åpne alt nå.
- *Forslag:* Behold ukerytmen som anbefalt tempo, men gjør den valgfri: la forelderen åpne neste leksjon når hun vil, eller flytt minst den sikkerhetsnære («Sjekk nakken») til uke 1 sammen med «Ull mot huden».

## [MINDRE] Onboarding
**Feltetiketten og hjelpeteksten står 8 px (4 pt) lenger inn enn resten av kortet, så kortet har tre ulike venstrekanter**

- *Hvorfor:* «NAVN ELLER KALLENAVN · VALGFRITT» og «NAVNET BRUKES I RÅDENE» er samme etikett-stil med samme startbokstav N, men de starter ikke på samme linje. Det gir en ujevn venstrekant midt i kortet — det leses som slurv på den aller første skjermen forelderen ser, og undergraver inntrykket av at appen er nøye laget.
- *Bevis:* Målt første blekk-piksel per tekstblokk: etikett 1 «NAVN ELLER…» starter x=101, etikett 2 «NAVNET BRUKES…» starter x=93 — samme glyf N, samme farge (#847766), samme maks-intensitet 118. Hjelpeteksten «Brukes bare i teksten…» starter også x=101. Selve inputfeltets venstre ramme ligger på x=92–93, overskriften «H» på x=95 og sitatet «Da er vi klare…» på x=92. Etiketten og hjelpeteksten som beskriver feltet, ligger altså IKKE på samme kant som feltet de hører til.
- *Forslag:* Fjern den ekstra venstre-innrykk-verdien på feltgruppen (etikett + hjelpetekst) slik at alt i kortet deler samme venstrekant som inputfeltets ramme, x=93.

## [MINDRE] Onboarding
**Personvernløftet navngir én bestemt telefonmodell: «lagres på denne iPhonen»**

- *Hvorfor:* Dette er setningen som skal gjøre det trygt å skrive inn barnets navn. Hvis den samme strengen vises på en Android-telefon, sier den noe som er synlig usant om enheten brukeren holder i hånden — og en påstand om personvern som er feil om enheten, er den dårligste påstanden å ta feil om.
- *Bevis:* Zoomet utsnitt av hjelpeteksten under inputfeltet viser ordrett «…agres på denne iPhonen.» — enhetsnavnet står som fast tekst i strengen, ikke som en nøytral formulering.
- *Forslag:* Bytt til enhetsnøytral tekst («lagres bare på denne telefonen» / «lagres bare her på telefonen din»), eller sett inn enhetsnavnet fra plattformen hvis det virkelig skal være modellspesifikt.

## [MINDRE] Onboarding
**Nedre 28 % av skjermen er tom: 270 px mellom kortet og «Fortsett», og 208 px under knappen**

- *Hvorfor:* Første onboarding-steg får en hul underdel — knappen svever i et tomrom i stedet for å være tydelig forankret. Med 104 pt luft under knappen ser bunnen ufullført ut, og skjermen mister den roen en trøtt forelder kl. 07 trenger for å se «her er svaret, her er neste steg».
- *Bevis:* Målte kanter: kortet slutter y=1102, knappen starter y=1372 (270 px = 135 pt tomrom), knappen slutter y=1480 mens bildet er 1688 høyt (208 px = 104 pt tomrom). Skanning av y=1490–1687 fant 0 piksler lysere enn 60 — området er helt tomt. Tomrommet under knappen er langt større enn en home-indicator-sone.
- *Forslag:* Stram bunnmargen mot trygg sone og la mellomrommet mellom kort og knapp bære forskjellen, eller la illustrasjon/kort ta mer av høyden — slik at knappen ser forankret ut i stedet for å flyte.

## [MINDRE] Hjem
**Skjermens største og tyngste element er temperaturen, ikke Babyoras eget svar. Ordet «antrekk» finnes kun inne i knappen; ingen plagg, lag eller anbefaling er synlig før forelderen trykker.**

- *Hvorfor:* Kl. 07 med én hånd ledig får forelderen først en værmelding hun kan få fra hvilken som helst app, og må gjøre ett trykk til for det Babyora faktisk er til for. Samtidig er den setningen som forklarer forskjellen («rådet tilpasset barnet ditt») skjermens minste tekst — differensiatoren er satt i minste type.
- *Bevis:* Sifferet «1» er 106 px høyt i bildet (≈53 css) og er den største formen på skjermen. Kvitteringslinjen «Været fra met.no, rådet tilpasset barnet ditt» har glyfhøyde 19 px (≈9,5 css versalhøyde, ca. 13 px skrift) og er minste tekst i bildet. Ingen steder i pikslene står det et plaggnavn eller antall lag.
- *Forslag:* La hjem vise ett konkret hint om svaret allerede før trykk — f.eks. antall lag eller ytterste plagg som liten linje under «Klar for en liten tur?» — og gi temperaturen litt mindre visuell vekt i forhold til det.

## [MINDRE] Hjem
**Ordmerket BABYORA har for lav kontrast mot bakgrunnsgløden det ligger oppå.**

- *Hvorfor:* Under WCAG AA-grensen på 4,5:1 for tekst i denne størrelsen. I dårlig morgenlys med lav skjermlysstyrke forsvinner merket nesten helt. Lav risiko fordi det bærer ingen informasjon, men det er skjermens eneste måling under grensen.
- *Bevis:* Målt tekstfarge rgb(167,154,130) mot nærmeste bakgrunn rgb(83,61,41) gir kontrast 3,66:1. Versalhøyde 19 px i bildet = 9,5 css (ca. 12–13 px skrift). Alle andre tekster på skjermen måler 5,1–15,3:1.
- *Forslag:* Løft ordmerket til minst 4,5:1, eller flytt det vekk fra den lyseste delen av bakgrunnsgløden.

## [MINDRE] Hjem
**Gradtegnet i «1°» sitter loddrett midt på sifferet i stedet for opp mot toppen, og leses som en løs ring ved siden av tallet.**

- *Hvorfor:* Et gradtegn som er trukket ned til midten mister koblingen til tallet og leses et øyeblikk som et eget tegn. I hovedavlesningen som skal forstås på et halvt sekund er det unødvendig friksjon.
- *Bevis:* Sifferet «1» har bbox y 510–615 i bildet. Ringen har bbox y 547–567 — sentrum 557 mot sifferets topp på 510, altså midt på sifferhøyden, med 10 px gap mellom glyfene. Til sammenligning står gradtegnet i «Føles som –2°» normalt hevet.
- *Forslag:* Sett gradtegnet i linje med sifferets toppkant (baseline-shift opp) og stram gapet, slik at «1°» leses som én enhet.

## [MINDRE] Hjem
**Eneste synlige tegn på at stedet kan endres er en 8,5 px høy chevron etter «Fast sted · Trondheim». Raden har ingen knapp-, ramme- eller flatemarkering.**

- *Hvorfor:* Forelderen som er på et annet sted enn vanlig kl. 07 må oppdage at raden er trykkbar. Et lite piltegn er svak affordans i dårlig lys. Merk: jeg ser bare det visuelle tegnet i pikslene — selve trykkflaten kan godt være hele raden.
- *Bevis:* Chevronens bbox er y 407–423 (17 px i bildet = 8,5 css høy). Raden har samme bakgrunn som resten av værkortet — ingen kant, fyll eller skille markerer den som interaktiv.
- *Forslag:* Gi stedsraden en synlig trykkflate (lett fyll eller pille rundt tekst + chevron) og forstørr chevronen, så det er tydelig i mørket at stedet kan byttes.

## [MINDRE] Antrekk
**«Forrige»-knappen ser trykkbar ut på steg 1 av 8, der det ikke finnes noe forrige steg**

- *Hvorfor:* To knapper i samme rad der den ene ikke kan gjøre noe, koster lesetid og et bomtrykk i dårlig lys — og den stjeler bredde fra den ene knappen som faktisk betyr noe.
- *Bevis:* Nede til venstre står «Forrige» i en synlig avrundet ramme med lys grå tekst (samme lyshet som «Steg 1 av 8»-teksten oppe). Ingenting i pikslene skiller den fra en aktiv knapp: ramme, fyll og tekst har full opasitet, mens headeren samtidig sier «Steg 1 av 8» og første prikk er den fylte.
- *Forslag:* Skjul «Forrige» helt på første steg og la «Neste» ta full bredde, eller gi den en tydelig deaktivert tilstand (markant nedtonet tekst og ramme).

## [MINDRE] Antrekk
**Ingen temperatur eller værkontekst noe sted på skjermen**

- *Hvorfor:* Forelderen kan ikke kontrollere at anbefalingen gjelder dagen i dag. Uten et tall å knytte den til må hun stole blindt på et ullsett hun ser isolert.
- *Bevis:* Hele topplinjen består bare av kryss, «Steg 1 av 8» og prikkeindikatoren. Ingen gradtall, ingen værsymbol, ingen stedsangivelse er synlig i noen del av bildet.
- *Forslag:* Vis en kort kontekstlinje i headeren eller rett over plagget, f.eks. gradtall + føles-som, så anbefalingen er forankret i noe forelderen kan etterprøve.

## [MINDRE] Antrekk
**Lukkekrysset er den eneste utgangen og har ingen synlig trykkflate rundt seg**

- *Hvorfor:* Er trykkflaten lik glyfen, er den langt under 44 px. Øvre venstre hjørne er dessuten den vanskeligste sonen å nå med én hånd, og dette er eneste vei ut av flyten.
- *Bevis:* Krysset oppe til venstre er en tynn strekglyf på ca. 32×32 px i et bilde som er 780 px bredt (2x av 390 px logisk bredde) — altså ca. 16 pt. Det er ingen ramme, sirkel eller flatefarge rundt glyfen som viser et større treffområde, i motsetning til «Forrige» som har synlig ramme.
- *Forslag:* Gi krysset en synlig, minst 44×44 pt stor flate (svak sirkel eller flatefarge), slik at treffområdet er lesbart og ikke bare et strektegn.

## [MINDRE] Juster
**Fyllnivået i vindsporet står ikke i flukt med markørlinjen: fyllets overkant er en skrå kile som bare møter linjen helt til høyre, og etterlater et mørkt gap under venstre halvdel.**

- *Hvorfor:* Markør og fyll er to representasjoner av samme tall. Når de peker på hvert sitt nivå, mister den raske avlesningen presisjon nettopp der brukeren skal justere finmasket.
- *Bevis:* 2x-utsnitt av sporene (y≈500-880): i vindkolonnen ligger den lyse linjen vannrett, mens det teal fyllet under skrår fra nede-venstre til oppe-høyre og berører linjen kun ved høyre kant. Temperatursporet (1°) har derimot et fyll med vannrett/avrundet overkant rett under linjen.
- *Forslag:* La fyllets overkant være vannrett og låst til markørposisjonen; hvis «væske»-effekten skal beholdes, la bølgen svinge om markørnivået, ikke under det.

## [MINDRE] Juster
**Nedbørsverdien skrives «0.0 mm/t» med punktum, ikke norsk desimalkomma, og det er unormalt stor luft rundt punktumet så den leses som «0 . 0».**

- *Hvorfor:* Appen er norsk og alle andre etiketter er det. Et engelsk desimalskille i det største tallet på skjermen er akkurat den typen mikro-friksjon som tvinger et ekstra blikk kl. 07.
- *Bevis:* 3x-utsnitt (x≈460-760, y≈300-400): glyfene viser «0.0 mm/t» med punktum, og mellomrommet på hver side av punktumet er omtrent like bredt som selve sifferet.
- *Forslag:* Formatér tall med norsk lokalitet (nb-NO) slik at det blir «0,0 mm/t», og stram inn tegnavstanden rundt desimalskillet.

## [MINDRE] Juster
**Valgt tilstand i AKTIVITET-velgeren bæres nesten bare av typografi — flatefargen på valgt og uvalgt segment er praktisk talt lik.**

- *Hvorfor:* «Utenfor vogn» vs «I vogn» endrer anbefalingen vesentlig. Hvilken som er på må leses av formen, ikke av at man sammenligner skriftvekt på to ord.
- *Bevis:* Målt fyllfarge i pillen «Utenfor vogn» er #382817 og i «I vogn»-området #2C1F13 — 1,13:1 mellom flatene. Forskjellen som faktisk skiller dem i utsnittet er skriftvekt (fet vs normal) og tekstlyshet (#F1E9DA vs #CDC0AB).
- *Forslag:* Gi valgt segment en flate som er tydelig lysere eller aksentfarget mot sporet, slik at valget kan avleses perifert uten å lese ordene.

## [MINDRE] Juster
**Undertittelen i toppen er en firedelt punktseparert streng som brekker over to linjer og etterlater «været nå» alene på siste linje.**

- *Hvorfor:* Dette er forklarende tekst plassert der blikket lander først, og den må parses ord for ord før forelderen kommer til tallene som faktisk gir svaret.
- *Bevis:* 3x-utsnitt av headeren: «Lillian, 10 mnd · Fast sted · Trondheim · basert på været nå» brekker etter «på», og «været nå» står som eneste innhold på linje tre, rett over toppen av værkortet.
- *Forslag:* Behold barnet på linje én og flytt sted/datakilde til en kortere sekundærlinje (f.eks. «Trondheim · nå»), slik at headeren aldri blir tre linjer.

## [MINDRE] Plan
**Samme faktum sagt to ganger, andre gang vagere og i systemspråk («de vurderte tidspunktene»)**

- *Hvorfor:* Kortet sier først presist «Ingen endringer frem til kl. 18:00», så gjentar det seg selv med «Samme antrekk i de vurderte tidspunktene». Den andre setningen legger ikke til informasjon, og «de vurderte tidspunktene» er appens interne beregningsraster – forelderen vet ikke hvilke tidspunkt det gjelder og kan ikke se dem noe sted på skjermen.
- *Bevis:* To tekstrader i samme kort med samme budskap: y 1086–1114 «Ingen endringer frem til kl. 18:00.» (lys tekst RGB 205,192,171) og y 1294–1318 «Samme antrekk i de vurderte tidspunktene» (dus tekst RGB 167,154,130). Ingen steder i pikslene vises hvilke tidspunkt som er vurdert.
- *Forslag:* Kutt gjentakelsen. Hvis linjen skal bli stående, navngi tidspunktene forelderen faktisk kan se («Samme antrekk kl. 07, 12 og 18»).

## [MINDRE] Plan
**Kulepunktet er løsrevet fra sin egen tekst og bryter kortets venstremarg**

- *Hvorfor:* Punktmerket henger alene i tomrommet ca. 35 px (CSS) fra teksten sin, og verken merket eller teksten står i flukt med resten av innholdet i kortet. I dårlig lys leses det som en flekk på skjermen, ikke som et listepunkt, og den ujevne venstrekanten gjør kortet urolig å scanne.
- *Bevis:* Horisontal måling på tekstraden y 1288–1325: all annen tekst i kortet («Dagslinjen», «Ingen endringer…», antrekksrutenettet) starter ved x≈79. Kulen ligger x 96–103, og teksten starter først ved x≈172. Det gir tre forskjellige venstrekanter i samme kort: 79 / 96 / 172 (bildepiksler, 2x).
- *Forslag:* Sett listen i samme tekstkolonne som resten av kortet (marker og tekst venstrejustert mot x≈79 i bildepiksler) og reduser avstanden merke–tekst til normal listeavstand, ca. 8–12 px CSS.

## [MINDRE] Plan
**Utvid-indikatoren på «Vis full værprognose» er en bokstav «v», ikke et chevron-ikon**

- *Hvorfor:* Den eneste affordansen som forteller at værkortet kan utvides, tegnes som en typografisk bokstav med flate serif-aktige avslutninger. Den leses som et tegn som har falt ut av teksten, ikke som «trykk for å åpne». Forelderen som skal forstå før hun leser, mister signalet om at det finnes mer vær bak kortet.
- *Bevis:* Utsnitt forstørret 4x rundt x 580–780, y 640–750: glyfen ved x≈680, y 654–666 har to rette streker som møtes i en spiss med flate, avkuttede topper – en bokstavform i tekstfonten, ikke en jevn strøket ikon-chevron. Høyden er ca. 12 px CSS, det minste merket på skjermen, ved siden av en etikett som er over 160 px bred.
- *Forslag:* Bytt til det samme strøkne chevron-ikonet som brukes ellers i appen, minst 20x20 px CSS og optisk sentrert på etikettens midtlinje.

## [MINDRE] Plan
**Gradtegnet på hovedtemperaturen står midt på sifferet i stedet for hevet**

- *Hvorfor:* Temperaturen er det tallet forelderen ser først. Når ringen sitter i sifferets midthøyde i stedet for oppe ved versalhøyden, leses «1°» som «1 o» i et halvsekunds blikk i dårlig lys. Det er det ene tallet som ikke har råd til å nøle.
- *Bevis:* Vertikal måling: sifferet «1» dekker y 411–482 (kolonne x 95–120). Ringen dekker y 441–454 (kolonne x 122–148). Ringens senter ligger på y≈447, sifferets senter på y≈446 – altså nøyaktig midtstilt, ikke hevet mot versalhøyden ved y≈411.
- *Forslag:* Hev gradtegnet til versalhøyde (vertical-align mot toppen av sifferet, eller bruk et ekte °-glyf i samme fontstørrelse med baseline-justering) og stram luften mellom tall og tegn.

## [MINDRE] Plan
**«I dag» står to ganger med 40 px mellomrom: som aktiv fane og som etikett øverst i værkortet**

- *Hvorfor:* Den aktive fanen er allerede markert med lys pille. At det første forelderen møter inne i hovedkortet er den samme etiketten igjen, koster en linje øverst på den viktigste flaten uten å svare på noe. Ved kl. 07 er hver linje over folden dyr.
- *Bevis:* Den aktive pillen «I dag» dekker y 193–285 (hvit flate RGB 241,233,218, x 44–178). Etiketten «I DAG» inne i det teal kortet ligger på y 365–383 (RGB 198,207,196) – ca. 40 px CSS under fanen, med samme ord.
- *Forslag:* Fjern «I DAG»-etiketten i kortet når fanen «I dag» er aktiv, eller erstatt den med noe som faktisk tilfører kontekst (f.eks. «Trondheim nå kl. 07»).

## [MINDRE] Plaggbiblioteket
**«⌘K»-hurtigtastbadge i søkefeltet på en telefonskjerm**

- *Hvorfor:* Det er en desktop-detalj som har fulgt med til mobil. En forelder med telefon i én hånd har ingen ⌘-tast. Badgen ser trykkbar ut og gjør ingenting, og den okkuperer plassen der en tøm-/diktér-knapp ville hørt hjemme.
- *Bevis:* Badge med teksten «⌘K» ligger inne i søkefeltet ved x≈655–715, y≈352–392, i et 780×1688 px portrettbilde med tab-bar nederst — altså en ren mobilflate.
- *Forslag:* Skjul badgen når peker/tastatur ikke er tilgjengelig (pointer: coarse), eller bytt den ut med en mikrofon-/tøm-knapp.

## [MINDRE] Plaggbiblioteket
**Hvert plaggkort bruker ~538 px høyde på et plagg som tegnes i ~150 px**

- *Hvorfor:* Med 63 plagg i katalogen ser forelderen bare fire kort (to rader) om gangen, og bare den øverste raden er komplett med materialetikett. Å finne riktig plagg krever mye scrolling med den ene hånden som er ledig.
- *Bevis:* Radavstand målt fra tittel «Kortermet body» (y≈662) til «Langermet body» (y≈1200) = 538 px. Selve plaggillustrasjonen dekker bare ca. y=840–970 inne i en tom ramme fra y=735 til y=1070.
- *Forslag:* Stram inn bilderammens sideforhold (f.eks. 4:5 i stedet for tilnærmet kvadrat) og la illustrasjonen fylle mer av rammen, slik at tre rader får plass over folden.

## [MINDRE] Plaggbiblioteket
**Antallet 63 gjentas to ganger i toppen, og sorteringskontrollen er en 35 px glyf uten ramme**

- *Hvorfor:* «Hele katalogen · 63 plagg» og «Plaggbiblioteket 63» sier det samme innenfor 100 px, mens den eneste kontrollen for å sortere 63 plagg leses som dekor ved siden av en tilbakeknapp som har tydelig 88 px flate. Vekten ligger på repetisjon i stedet for på handlingen.
- *Bevis:* Underteksten «Hele katalogen · 63 plagg» står på y≈160 og tallet «63» gjentas ved siden av tittelen på y≈260. Sorteringsikonet øverst til høyre måler ca. 35 px bredt (x≈680–715) uten synlig bakgrunnsflate, mens tilbakeknappens ramme måler 88×88 px.
- *Forslag:* Fjern tallet ett av stedene, og gi sorteringsikonet samme 88×88 px flate og bakgrunn som tilbakeknappen.

## [MINDRE] Innstillinger
**Bryterens form er nesten sirkulær, ikke en pille — den leser ikke som en bryter**

- *Hvorfor:* Når sporet er omtrent like høyt som det er bredt, forsvinner «skinne med to endestillinger»-metaforen. Objektet ser ut som en avkuttet knapp eller en grafisk feil i stedet for en av/på-kontroll.
- *Bevis:* Kontrollen måler grovt 100 px bredt mot 78 px høyt (x≈622–722, y≈995–1073) — forholdstall ca. 1,3. Den hvite knotten fyller nesten hele høyden og mesteparten av venstre halvdel, slik at bare en tynn tan sigd er synlig til høyre.
- *Forslag:* Sett sporbredden til ca. 1,8× høyden og krymp knotten til ~85 % av sporhøyden, slik at begge endestillingene er synlige.

## [MINDRE] Innstillinger
**Hengende skilletegn «·» på slutten av linje 1 i barnekortet**

- *Hvorfor:* Punktet peker mot noe som ikke står der; øyet leter etter mer innhold på samme linje før det finner fortsettelsen under. Bråstopp i et kort som skal leses på ett blikk.
- *Bevis:* I barnekortet står «10 mnd · Trondheim ·» på første linje (y≈423), og «03. okt. 2025» begynner på ny linje under (y≈466). Skilletegnet blir stående alene ytterst til høyre på linje 1.
- *Forslag:* Bruk ikke-brytende mellomrom rundt skilletegnene, eller del meta-linja bevisst: alder + sted på linje 1, fødselsdato som egen dempet linje uten separator.

## [MINDRE] Innstillinger
**«Trondheim» står tre ganger på samme skjerm**

- *Hvorfor:* Gjentakelsen gir inntrykk av tre uavhengige innstillinger for sted, og forelderen må selv finne ut hvilken som faktisk styrer været. Det koster lesetid der skjermen ellers er raskt skannbar.
- *Bevis:* Synlig samtidig: pillen «TRONDHEIM» oppe til høyre (y≈210), «10 mnd · Trondheim ·» i barnekortet (y≈423), og raden «Sted → Trondheim» (y≈898).
- *Forslag:* Fjern stedspillen i toppen på denne skjermen (den hører hjemme på hjem-/planlegg-flatene) og la «Sted»-raden være eneste kilde til sannhet.

## [MINDRE] Innstillinger
**Undertittelen på «Referansetime» brekker med bindestrek over tre linjer**

- *Hvorfor:* Orddeling midt i et ord tvinger fram bokstavlesing i stedet for ordgjenkjenning — treg i dårlig lys. Raden blir også nesten dobbelt så høy som naboradene og bryter rytmen i kortet.
- *Bevis:* Teksten står som «Hvilket klokkeslett vises på hjem-» (y≈1311) / «skjerm» (y≈1345), altså orddelt bindestrek. Alle andre rader i samme kort har énlinjes undertittel.
- *Forslag:* Slå av automatisk orddeling for undertitler og kort teksten til f.eks. «Klokkeslettet hjemskjermen viser».

## [MINDRE] Innstillinger
**Bunn-fade dimmer ekte innhold langt over tab-baren**

- *Hvorfor:* «VARSLER» og kortet under ser deaktivert ut, ikke bare avskåret. Forelderen kan tro at varsler er utilgjengelig i stedet for at hun må scrolle.
- *Bevis:* Seksjonsetiketten «VARSLER» (y≈1435) er merkbart mørkere enn «BARN» (y≈294) og «VÆR & STED» (y≈808), som har identisk rolle og stil. Kortet under (y≈1450–1500) er nesten usynlig mot bakgrunnen, ca. 60 px før tab-baren begynner.
- *Forslag:* Start maskegradienten rett over tab-baren og la den gå til maks ~40 % opasitet, slik at neste seksjonsetikett fortsatt leses i full styrke.

## [MINDRE] Innstillinger
**«Bytt barn» bruker et tilbake-/angre-pilikon**

- *Hvorfor:* Ikonet leser «gå tilbake», ikke «velg et annet barn». Med én hånd og barnet masende er ikonet det som treffes først av blikket, og det peker feil vei.
- *Bevis:* Ikonruten til venstre for «Bytt barn» (x≈65–125, y≈545–605) viser en pil som svinger mot venstre — samme form som en angre-/tilbakepil. Raden under bruker et «+» for «Legg til nytt barn», som er entydig.
- *Forslag:* Bytt til to motsatte piler (bytt/veksle) eller et personikon med veksle-symbol.

## [MINDRE] TOG
**Skjermtittelen «SOVING INNENDØRS» har fargesplitt (cyan/varm kant) som ingen annen tekst på skjermen har**

- *Hvorfor:* I dårlig lys leses fargeskimmer på tekst som uskarphet eller en renderingsfeil, ikke som stil. Det er den eneste teksten på skjermen som ser «rar» ut, og den sitter øverst der blikket lander først.
- *Bevis:* Piksel (337,187) inne i tittelen er (R=31, G=117, B=136) – klart cyan, med varm kant på motsatt side av glyfene. Til sammenligning er høyeste blå-over-rød-verdi i «ANBEFALT TOG», «ROMTEMPERATUR» og «Komfortsone…» −25, altså gjennomgående varm/nøytral uten splitt.
- *Forslag:* Fjern den kromatiske forskyvningen/animasjonen på tittelen, eller la den bare gjelde ved bevisst hendelse – i hvile skal tittelen rendere med samme rene, varme farge som de andre etikettene.

## [MINDRE] Varm eller kald
**Oransje CTA-farge brukes på «BEHOLD» i «Perfekt»-raden – på skjermens eneste rad der forelderen ikke skal gjøre noe**

- *Hvorfor:* Oransje er systemets handlingsfarge. Blikket trekkes derfor først til den ene raden som betyr «ikke gjør noe», mens den ekte handlingen («Ferdig») er usynlig. De to elementene motsier hverandre om hva som er viktigst på skjermen.
- *Bevis:* «BEHOLD» i rad 2 er den eneste pillen med oransje ramme og oransje tekst (RGB 217,142,90) på fylt flate; «TA AV» og «LEGG TIL» har nøytral grå ramme og lys tekst. Ingen andre oransje flater er synlige på skjermen bortsett fra den skjulte knappekanten under fanelinja.
- *Forslag:* Gi de tre radene lik visuell vekt (nøytral merkelapp på alle tre), og la oransje være forbeholdt «Ferdig»-knappen.

## [MINDRE] Varm eller kald
**Snøfnugg-ikonet for «For kald» er asymmetrisk og leses som et flytt-/størrelsesikon**

- *Hvorfor:* Skannet på et halvt sekund i dårlig lys skal ikonet si «kaldt» før teksten leses. Piler opp/ned sier «flytt», ikke «kaldt».
- *Bevis:* I 6x-oppforstørrelse av ikonet i rad 3 (x≈130–230, y≈955–1055) har bare den loddrette aksen pilhoder oppe og nede; de to diagonale armene er glatte streker uten grener eller pilhoder. Symmetrien et snøfnugg trenger mangler, og formen ligner et opp/ned-pilikon med kryss over.
- *Forslag:* Bytt til et symmetrisk snøfnugg der alle seks armer har samme endeform, eller bruk et entydig kuldesymbol (termometer med lav søyle) som speiler termometeret i rad 1.

## [MINDRE] Varm eller kald
**Inaktive fane-etiketter har for lav kontrast mot fanelinja**

- *Hvorfor:* I dårlig morgenlys med lav skjermlysstyrke blir «Hjem» og «Planlegg» vanskelige å lese, og forelderen mister orienteringen om hvor hun kan gå videre.
- *Bevis:* «Hjem»-etiketten måler 3,93:1 mot fanelinjens flate (lysest tekstpiksel L=0,3294 mot flate L=0,0465). Det er under 4,5:1 for tekst i denne størrelsen. Den aktive «Familie»-etiketten er tydelig lysere hvit til sammenligning.
- *Forslag:* Løft inaktiv fanefarge til minst 4,5:1 mot fanelinjeflaten; behold aktiv tilstand som hvit + fylt pille slik den er nå.
