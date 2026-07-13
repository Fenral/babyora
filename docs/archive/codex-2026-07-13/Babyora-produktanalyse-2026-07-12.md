# Babyora — produktreise-audit

- **Vektet totalscore:** 73.3/100
- **Uvektet gjennomsnitt:** 73.3/100
- **Sterkeste side:** Varm eller kald (83)
- **Svakeste side:** Min garderobe (64)
- **Problemer:** 3 kritiske · 16 høye · 9 middels · 2 lave

Babyora har en uvanlig sterk visuell grunnmur og flere sider som føles som et reelt, særpreget foreldreprodukt. Kjernen er lett å forstå når antrekket først åpnes, men Hjem krever fortsatt et ekstra trykk før forelderen får svaret, og Plan gjentar data fremfor å forklare hva som endrer handlingen. Den største kommersielle svakheten er at betalingsveggen selger dagens ferdige antrekk, mens ønsket Plus-retning er fremover, overalt og sammen. Appen fremstår derfor mer moden visuelt enn den nåværende Plus-fortellingen og tilgangsmodellen.

**Viktigste barriere for kjøpsvilje:** Plus viser ikke én sammenhengende, troverdig utvidelse av gratisproduktet: automatisk sted er tilgjengelig uten Plus, morgenpåminnelsen er låst, familiepåstanden er ikke støttet av en synlig delingsflyt, og paywallen selger hovedsakelig dagens antrekk som gratisproduktet skal bevise.

## Scoreoversikt

| Side | Score | Totalvekt | Endring |
|---|---:|---:|---:|
| Hjem | 79.4 | 15% | — |
| Betalingsvegg | 64.7 | 14% | — |
| Påkledning | 77.8 | 12% | — |
| Onboarding | 72 | 10% | — |
| Uke / Planlegg | 67.9 | 10% | — |
| Guide | 72.6 | 7% | — |
| Finn antrekk | 76 | 6% | — |
| TOG | 82 | 5% | — |
| Varm eller kald | 83 | 5% | — |
| Første vinter | 70 | 5% | — |
| Innstillinger | 70.9 | 5% | — |
| Plaggbibliotek | 72.1 | 3% | — |
| Min garderobe | 64 | 3% | — |

## Funn på tvers av sider

- **CRITICAL — Gratis- og Plus-logikken forteller feil historie:** De mest synlige tilgangsvalgene støtter ikke prinsippet om i dag hjemme kontra fremover, overalt og sammen.
  - Evidens: repository — Settings viser automatisk posisjon uten Plus-merke og Morgenvarsel med Plus-merke; paywallen leder med «Våkn opp til ferdig antrekk». Koden i InnstillingerScreen gater morgenvarsel, mens automatisk posisjon ikke sjekker premium.
  - Effekt: Brukeren får ikke et intuitivt svar på hvorfor abonnementet er nødvendig, og paywallen risikerer å kannibalisere tilliten til gratisløftet.
  - Retning: La gratis beholde dagens komplette anbefaling og enkel morgenpåminnelse; samle Plus rundt kommende dager, automatisk sted, flere steder/barn og reell omsorgsdeling før dette markedsføres.
- **HIGH — Språk og merkevare skifter mellom skjermene:** Babyora bruker både «lag» og «plagg», både «Plus» og «Premium», og Guide viser fortsatt KLEMEG som avsender.
  - Evidens: rendered — Påkledning viser «8 lag», Finn antrekk viser «4 lag», garderoben bruker «plagg», paywallen bruker Babyora Plus og samtidig «Én Premium», mens Guide har KLEMEG i toppteksten.
  - Effekt: Ujevn terminologi gjør produktet mindre presist og får flere sterke skjermer til å føles som ulike versjoner av appen.
  - Retning: Bruk «plagg» i brukergrensesnittet, «Babyora Plus» konsekvent og Babyora som eneste synlige produktnavn.
- **HIGH — Faglig autoritet kommuniseres for kategorisk:** Flere sider bruker helsesøster- og sikkerhetsspråk som virker mer endelig enn skjermbildet eller funksjonen kan dokumentere.
  - Evidens: rendered — Guide og Finn antrekk kobler utendørskalkulatoren til «TOG-standarden», TOG leder med «Riktig varme for natten», og Varm eller kald sier at kalde hender og føtter ikke betyr at barnet fryser.
  - Effekt: Den visuelle presisjonen kan gi forelderen større sikkerhet i utsagnene enn det er grunnlag for, noe som øker tillits- og sikkerhetsrisiko.
  - Retning: Skill TOG tydelig fra uteklær, moderer absolutte formuleringer og vis relevante forbehold eller produsentråd uten å fylle skjermene med juridisk tekst.
- **MEDIUM — Illustrasjonssystemet mangler én tydelig familie:** Myk 3D, akvarell, emoji-avatar og flate instruksjonsillustrasjoner opptrer som likeverdige identitetsbærere.
  - Evidens: rendered — Hjem og Påkledning bruker 3D-baby og plagg, onboarding bruker akvarell, Min garderobe bruker emoji-baby og Varm eller kald bruker flat illustrasjon.
  - Effekt: Fragmenteringen reduserer merkevaregjenkjennelse selv om hver enkelt illustrasjon kan være attraktiv.
  - Retning: Definer ett funksjonelt 3D-system og ett sekundært kunnskapssystem, og fjern emoji som profilbærer.

## Onboarding

**Score: 72/100 — Tydelig forbedringsrom**  
Kommersiell rolle: Onboardingen bygger varme og personalisering, men kjøpsviljen blir sterkere hvis svarene umiddelbart demonstrerer hva de låste opp.  
Vurderingssikkerhet: medium — Første steg er fanget fullstendig, men senere steg og tidspunktet for første paywall er vurdert med repository- og tidligere flytkontekst fremfor nye skjermbilder.

### Delkarakterer

| Område | Score | Vekt |
|---|---:|---:|
| Oppgaveforståelse og hierarki | 68 | 20% |
| Navigasjon og interaksjon | 70 | 15% |
| Visuell kvalitet og konsistens | 82 | 15% |
| Farge og temperaturuttrykk | 80 | 10% |
| Tekst, tillit og troverdighet | 80 | 15% |
| Produktverdi og kjøpsbidrag | 60 | 20% |
| Tilgjengelighet og robusthet | 72 | 5% |

### Det som fungerer

- **Varm og menneskelig inngang:** Navn, fødselsdato og sted kan gi en reelt personlig anbefaling, og teksten forklarer hvorfor navnet etterspørres. _(rendered: onboarding--start.png)_
- **Tydelig fremdrift:** Steg 1 av 4 gjør arbeidsmengden forutsigbar. _(rendered: onboarding--start.png)_

### Det som bør forbedres

- **HIGH — Verdien ligger utenfor første skjerm:** Den første viewporten bruker mye plass på illustrasjon og profilfelt, mens en faktisk antrekksanbefaling ikke er synlig.
  - Evidens: rendered — onboarding--start.png
  - Effekt: En ny bruker må investere før Babyora beviser hva produktet gjør.
  - Retning: Komprimer illustrasjonen og la onboarding munne direkte ut i en ekte, personlig anbefaling før Plus eller varseltillatelse introduseres.
- **LOW — Overlappende fremdriftssignaler:** Både «Steg 1 av 4» og vertikale prikker viser den samme informasjonen.
  - Evidens: rendered — onboarding--start.png
  - Effekt: Det skaper unødvendig visuell konkurranse i en allerede lang skjerm.
  - Retning: Behold én fremdriftsindikator og bruk den frigjorte plassen til felt eller verdi.

## Hjem

**Score: 79.4/100 — Tydelig forbedringsrom**  
Kommersiell rolle: Hjem har høy daglig bruksverdi og sterk merkevare, men bør bevise gratisløftet uten trykk før det kan fungere som grunnlag for senere Plus-salg.  
Vurderingssikkerhet: high — Komplett standardtilstand er fanget med deterministisk vær.

### Delkarakterer

| Område | Score | Vekt |
|---|---:|---:|
| Oppgaveforståelse og hierarki | 76 | 20% |
| Navigasjon og interaksjon | 82 | 15% |
| Visuell kvalitet og konsistens | 86 | 15% |
| Farge og temperaturuttrykk | 88 | 10% |
| Tekst, tillit og troverdighet | 78 | 15% |
| Produktverdi og kjøpsbidrag | 72 | 20% |
| Tilgjengelighet og robusthet | 82 | 5% |

### Det som fungerer

- **Særpreget temperaturatmosfære:** Kuldepaletten, været og 3D-babyen gir Babyora et tydelig uttrykk som ikke ligner en generisk værapp. _(rendered: home--default.png)_
- **God tommelflyt:** Aktivitetsvalg og hovedknapp ligger i komfortabel rekkevidde, og CTA-en er visuelt entydig. _(rendered: home--default.png)_

### Det som bør forbedres

- **HIGH — Kjernesvaret krever et ekstra trykk:** Hjem viser vær, aktivitet og en naken baby, men ikke hvilke plagg som anbefales før «Se dagens antrekk» åpnes.
  - Evidens: rendered — home--default.png
  - Effekt: Gratisproduktets aha-øyeblikk blir langsommere og hjemmeskjermen beviser mindre verdi ved et raskt morgenblikk.
  - Retning: Vis en kort antrekksoppsummering og påkledd avatar automatisk; behold knappen som «Se detaljer».
- **MEDIUM — Stor flate uten beslutningsinformasjon:** Babyillustrasjonen dominerer høyden, men den er naken og forklarer derfor ikke anbefalingen.
  - Evidens: rendered — home--default.png
  - Effekt: Den sterkeste visuelle flaten kommuniserer mindre enn værteksten og CTA-en.
  - Retning: La babyen bære anbefalingen eller reduser høyden og bruk plassen til plagg og neste værendring.

## Påkledning

**Score: 77.8/100 — Tydelig forbedringsrom**  
Kommersiell rolle: Denne siden beviser kjernemotorens verdi svært godt og kan være hovedbeviset før Plus introduseres, forutsatt at språk og skannelengde strammes inn.  
Vurderingssikkerhet: high — Hele første viewport og starten av plaggrekkefølgen er tydelig fanget.

### Delkarakterer

| Område | Score | Vekt |
|---|---:|---:|
| Oppgaveforståelse og hierarki | 82 | 20% |
| Navigasjon og interaksjon | 68 | 15% |
| Visuell kvalitet og konsistens | 88 | 15% |
| Farge og temperaturuttrykk | 82 | 10% |
| Tekst, tillit og troverdighet | 65 | 15% |
| Produktverdi og kjøpsbidrag | 82 | 20% |
| Tilgjengelighet og robusthet | 72 | 5% |

### Det som fungerer

- **Babyoras sterkeste visuelle demonstrasjon:** Plaggene rundt barnet, nummereringen og listen gjør antrekket konkret og personlig. _(rendered: outfit--recommendation.png)_
- **Rekkefølgen er handlingsklar:** «Rekkefølge · innerst først» svarer direkte på hvordan plaggene tas på. _(rendered: outfit--recommendation.png)_

### Det som bør forbedres

- **HIGH — Brukerbegrepet er fortsatt «lag»:** Topplinjen sier «8 lag», selv om innholdet omfatter sokker, hals, lue og votter som brukeren enklere forstår som plagg.
  - Evidens: rendered — outfit--recommendation.png
  - Effekt: Det introduserer faglig friksjon på appens viktigste svar og bryter med garderobens «plagg»-språk.
  - Retning: Vis «8 plagg» og la rekkefølgen formidle lag-på-lag-prinsippet.
- **MEDIUM — Informasjonen dupliseres over en lang scroll:** Alle åtte plagg vises både i en stor sirkel og i en omfattende liste.
  - Evidens: rendered — outfit--recommendation.png
  - Effekt: Den vakre presentasjonen gjør den praktiske sjekklisten tregere å skanne.
  - Retning: Behold avatar og en kompakt oppsummering øverst, og gjør detaljlisten tettere eller progressivt utvidbar.

## Uke / Planlegg

**Score: 67.9/100 — Blandet**  
Kommersiell rolle: Plan burde være den naturlige Plus-motoren, men den nåværende skjermen viser gjentakelse fremfor forberedelse og skaper derfor begrenset kjøpspress.  
Vurderingssikkerhet: high — Dagens plan og den låste ukefanen er synlige i samme capture.

### Delkarakterer

| Område | Score | Vekt |
|---|---:|---:|
| Oppgaveforståelse og hierarki | 68 | 20% |
| Navigasjon og interaksjon | 78 | 15% |
| Visuell kvalitet og konsistens | 74 | 15% |
| Farge og temperaturuttrykk | 72 | 10% |
| Tekst, tillit og troverdighet | 60 | 15% |
| Produktverdi og kjøpsbidrag | 58 | 20% |
| Tilgjengelighet og robusthet | 74 | 5% |

### Det som fungerer

- **Tydelig tidsstruktur:** Klokkeslett, temperatur og antrekksindikator kan leses raskt i én kolonne. _(rendered: plan--default.png)_

### Det som bør forbedres

- **HIGH — Fire rader gir samme upresise beskjed:** Alle tidspunkter viser «8 · Mye på» selv om temperaturen varierer.
  - Evidens: rendered — plan--default.png
  - Effekt: Siden viser værdata, men hjelper ikke forelderen forstå hva som faktisk endrer seg eller hva som bør gjøres.
  - Retning: Komprimer uendret anbefaling og fremhev bare handlingsendringer, for eksempel «samme antrekk hele dagen» eller «legg til X kl. 18».
- **HIGH — Plus-forhåndsvisningen forklarer ikke fremtidsverdien:** «Uke PLUS» er synlig, men dagens flate viser ingen konkret eksempelverdi fra kommende dager.
  - Evidens: rendered — plan--default.png
  - Effekt: Brukeren må kjøpe for å forstå hva ukevisningen faktisk løser.
  - Retning: Vis én ekte teaser som «I morgen blir det 7 grader kaldere — ett ekstra plagg anbefales».

## Guide

**Score: 72.6/100 — Tydelig forbedringsrom**  
Kommersiell rolle: Guide bygger tillit og opplevd bredde, men bør støtte kjerneproduktet og faglig presisjon fremfor å være en separat innholdsverden.  
Vurderingssikkerhet: high — Guidehubens viktigste seksjoner er synlige.

### Delkarakterer

| Område | Score | Vekt |
|---|---:|---:|
| Oppgaveforståelse og hierarki | 73 | 20% |
| Navigasjon og interaksjon | 78 | 15% |
| Visuell kvalitet og konsistens | 83 | 15% |
| Farge og temperaturuttrykk | 78 | 10% |
| Tekst, tillit og troverdighet | 58 | 15% |
| Produktverdi og kjøpsbidrag | 68 | 20% |
| Tilgjengelighet og robusthet | 75 | 5% |

### Det som fungerer

- **Sterk redaksjonell identitet:** Seriftypografi, store illustrerte kort og tydelige seksjoner gir Guide en premium kunnskapsfølelse. _(rendered: guide--hub.png)_
- **God gruppering:** Kalkulator, verktøy og kunnskap har tydelig visuelt hierarki. _(rendered: guide--hub.png)_

### Det som bør forbedres

- **HIGH — Feil faglig kobling i heroen:** Kleskalkulatoren for utebruk markedsføres som bygget på «TOG-standarden».
  - Evidens: repository — guide--hub.png og samme tekst i GuideHubScreen.tsx
  - Effekt: TOG forbindes med soveposer og innendørs søvn; blandingen svekker faglig presisjon.
  - Retning: Beskriv uteverktøyet med alder, aktivitet, lag-på-lag-prinsipp og norske værforhold; behold TOG i søvnverktøyet.
- **MEDIUM — Utdatert produktnavn:** Toppteksten viser KLEMEG, mens resten av appen og betalingsproduktet heter Babyora.
  - Evidens: rendered — guide--hub.png
  - Effekt: Det ser ut som en uferdig migrering og reduserer merkevaresammenheng.
  - Retning: Bytt KLEMEG til Babyora og kvalitetssikre alle synlige tidligere navn.

## Finn antrekk

**Score: 76/100 — Tydelig forbedringsrom**  
Kommersiell rolle: Verktøyet demonstrerer motorens dybde og kan styrke tillit, men full manuell frihet kan også omgå fremtidsverdien hvis det forblir helt gratis.  
Vurderingssikkerhet: high — Alle hovedkontroller og resultatets start er synlige.

### Delkarakterer

| Område | Score | Vekt |
|---|---:|---:|
| Oppgaveforståelse og hierarki | 78 | 20% |
| Navigasjon og interaksjon | 75 | 15% |
| Visuell kvalitet og konsistens | 78 | 15% |
| Farge og temperaturuttrykk | 84 | 10% |
| Tekst, tillit og troverdighet | 66 | 15% |
| Produktverdi og kjøpsbidrag | 78 | 20% |
| Tilgjengelighet og robusthet | 72 | 5% |

### Det som fungerer

- **Tydelig årsak og virkning:** Brukeren kan justere temperatur, vind, nedbør og aktivitet og se anbefalingen endre seg. _(rendered: find-outfit--default.png)_
- **Temperaturfargen fungerer som signatur:** Den kalde blå flaten støtter tallet og gjør verktøyet mer minneverdig. _(rendered: find-outfit--default.png)_

### Det som bør forbedres

- **HIGH — Resultatet bruker igjen «lag»:** Resultatkortet viser «4 lag» i stedet for et konkret plaggantall og antrekksoppsummering.
  - Evidens: rendered — find-outfit--default.png
  - Effekt: Den viktigste verdien blir en abstrakt måling fremfor et direkte svar.
  - Retning: Vis plaggantall og de viktigste plaggene; behold lag som intern modell.
- **MEDIUM — Vind og nedbør krever faglig tolkning:** 3 m/s og 0.0 mm/t vises uten menneskelige beskrivelser eller forklaring på hva endringen gjør med antrekket.
  - Evidens: rendered — find-outfit--default.png
  - Effekt: Forelderen ser rådata, men lærer ikke hvorfor anbefalingen endres.
  - Retning: Legg til sekundære etiketter som «lett vind» og «ingen nedbør», samt en kort endringsforklaring.

## Plaggbibliotek

**Score: 72.1/100 — Tydelig forbedringsrom**  
Kommersiell rolle: Biblioteket bygger faglig verdi, men er mer retention og støtte enn en direkte betalingsgrunn.  
Vurderingssikkerhet: high — Oversikten, filtre og de første plaggene er tydelig fanget.

### Delkarakterer

| Område | Score | Vekt |
|---|---:|---:|
| Oppgaveforståelse og hierarki | 75 | 20% |
| Navigasjon og interaksjon | 66 | 15% |
| Visuell kvalitet og konsistens | 76 | 15% |
| Farge og temperaturuttrykk | 70 | 10% |
| Tekst, tillit og troverdighet | 78 | 15% |
| Produktverdi og kjøpsbidrag | 68 | 20% |
| Tilgjengelighet og robusthet | 70 | 5% |

### Det som fungerer

- **Godt visuelt oppslagsverk:** Plaggbilder, materiale og kategorier gjør innholdet lett å kjenne igjen. _(rendered: clothing-library--overview.png)_

### Det som bør forbedres

- **MEDIUM — 62 plagg presenteres som et tungt katalogarbeid:** To-kolonners grid, kategoriantall og horisontalt avklipte filterchips gir høy informasjonsmengde på mobil.
  - Evidens: rendered — clothing-library--overview.png
  - Effekt: Oppslagsverket føles mer som inventar enn rask hjelp i en foreldresituasjon.
  - Retning: Prioriter søk og de vanligste kategoriene, og vurder én mer lesbar liste eller færre tydelige kort per viewport.
- **LOW — Desktop-snarvei i mobilgrensesnitt:** Søkefeltet viser ⌘K selv i iPhone-viewport.
  - Evidens: rendered — clothing-library--overview.png
  - Effekt: Det signaliserer webkomponent fremfor mobiltilpasset produkt.
  - Retning: Skjul tastatursnarveien på touch-enheter og bruk plassen til et tydelig søkeikon eller filterstatus.

## Min garderobe

**Score: 64/100 — Blandet**  
Kommersiell rolle: Garderoben har den svakeste balansen mellom innsats og verdi og bør ikke bære Plus-fortellingen selv om implementasjonen kan tilpasse forslag.  
Vurderingssikkerhet: high — Hele toppflyten, Plus-banneret og flere eierskapsrader er synlige.

### Delkarakterer

| Område | Score | Vekt |
|---|---:|---:|
| Oppgaveforståelse og hierarki | 65 | 20% |
| Navigasjon og interaksjon | 72 | 15% |
| Visuell kvalitet og konsistens | 70 | 15% |
| Farge og temperaturuttrykk | 68 | 10% |
| Tekst, tillit og troverdighet | 62 | 15% |
| Produktverdi og kjøpsbidrag | 50 | 20% |
| Tilgjengelighet og robusthet | 72 | 5% |

### Det som fungerer

- **Tydelig status og filtrering:** Har, mangler og totalantall er lett å forstå, og hver rad har en tydelig eierskapsstatus. _(rendered: wardrobe--default.png)_

### Det som bør forbedres

- **HIGH — Høy vedlikeholdsinnsats for uklar gevinst:** Forelderen forventes å administrere 62 generiske plagg for at Plus skal bruke dem i anbefalingen.
  - Evidens: rendered — wardrobe--default.png
  - Effekt: Funksjonen legger arbeid på brukeren og konkurrerer med Babyoras løfte om mindre gjetting og mindre innsats.
  - Retning: Ton ned eller fjern garderoben fra hovedflyten; prioriter lavfriksjonsfunksjoner som hva barnet trenger snart og personlig varm/kald-kalibrering.
- **MEDIUM — Demoen starter med alt eid:** 62 av 62 plagg og «Mangler 0» gjør personaliseringsverdien vanskelig å demonstrere og virker lite realistisk.
  - Evidens: rendered — wardrobe--default.png
  - Effekt: Plus-løftet kan ikke sees i praksis, og skjermen ligner en administrasjonsoppgave uten tydelig resultat.
  - Retning: Bruk en realistisk fixture eller vis et konkret før/etter-eksempel på hvordan anbefalingen endres.

## TOG

**Score: 82/100 — Sterk**  
Kommersiell rolle: TOG er et sterkt tillits- og retention-verktøy, men bør forbli tilgjengelig sikkerhetsinnhold fremfor hovedgrunn til abonnement.  
Vurderingssikkerhet: high — Hero, anbefaling og hele temperaturkontrollen er fanget.

### Delkarakterer

| Område | Score | Vekt |
|---|---:|---:|
| Oppgaveforståelse og hierarki | 84 | 20% |
| Navigasjon og interaksjon | 83 | 15% |
| Visuell kvalitet og konsistens | 88 | 15% |
| Farge og temperaturuttrykk | 86 | 10% |
| Tekst, tillit og troverdighet | 70 | 15% |
| Produktverdi og kjøpsbidrag | 82 | 20% |
| Tilgjengelighet og robusthet | 80 | 5% |

### Det som fungerer

- **Sterk og fokusert veileder:** Romtemperatur, anbefalt TOG og soveposevisualisering er samlet i én tydelig oppgave. _(rendered: tog--default.png)_
- **Svært god visuell temperaturkontroll:** Gradient, temperaturpunkter og TOG-verdier gjør sammenhengen lett å utforske. _(rendered: tog--default.png)_

### Det som bør forbedres

- **HIGH — Overskriften lover et fasitsvar:** «Riktig varme for natten» kan tolkes som en individuell sikkerhetsgaranti.
  - Evidens: rendered — tog--default.png
  - Effekt: Foreldre kan overvurdere hvor presist én TOG-tabell beskriver barn, rom og produkt.
  - Retning: Bruk «Finn et godt utgangspunkt» eller tilsvarende og vis produsentens råd og nakkesjekk nært resultatet.
- **MEDIUM — Begrenset synlig kontekst:** Første viewport viser anbefalingen, men ikke forbehold om produsent, klær under posen eller individuell variasjon.
  - Evidens: rendered — tog--default.png
  - Effekt: Den svært polerte fremstillingen fremstår mer endelig enn rådet bør være.
  - Retning: Legg en kort, rolig kontekstlinje rett under anbefalingen uten å svekke hovedhierarkiet.

## Varm eller kald

**Score: 83/100 — Sterk**  
Kommersiell rolle: Dette er en av appens sterkeste tillitsfunksjoner og et godt grunnlag for senere personlig kalibrering, men selve sikkerhetsguiden bør ikke låses.  
Vurderingssikkerhet: high — Hele funksjonen og alle tre utfall er synlige i én viewport.

### Delkarakterer

| Område | Score | Vekt |
|---|---:|---:|
| Oppgaveforståelse og hierarki | 90 | 20% |
| Navigasjon og interaksjon | 86 | 15% |
| Visuell kvalitet og konsistens | 82 | 15% |
| Farge og temperaturuttrykk | 78 | 10% |
| Tekst, tillit og troverdighet | 72 | 15% |
| Produktverdi og kjøpsbidrag | 85 | 20% |
| Tilgjengelighet og robusthet | 84 | 5% |

### Det som fungerer

- **Umiddelbart handlingsrettet:** Forelderen får én kontroll, tre mulige signaler og konkret handling uten å måtte lære et system. _(rendered: warm-cold--default.png)_
- **God semantisk fargebruk:** Varm, passe og kald kombinerer tekst, ikon og farge slik at mening ikke er fargeavhengig. _(rendered: warm-cold--default.png)_

### Det som bør forbedres

- **HIGH — Bunnpåstanden er for absolutt:** «Kalde hender og føtter er normalt og betyr ikke at barnet fryser» utelukker kontekst og andre tegn.
  - Evidens: rendered — warm-cold--default.png
  - Effekt: En nyttig huskeregel kan bli lest som en garanti.
  - Retning: Skriv at hender og føtter ofte kan være kjøligere og at nakke og barnets allmenntilstand gir bedre veiledning.

## Første vinter

**Score: 70/100 — Tydelig forbedringsrom**  
Kommersiell rolle: Programmet kan støtte retention og tillit, men tekstinnhold og sikkerhetsgrunnlag er en svakere abonnementskjerne enn automatikk, fremtid og familie.  
Vurderingssikkerhet: high — Programoversikten viser titler, gratis smakebit og Plus-merking.

### Delkarakterer

| Område | Score | Vekt |
|---|---:|---:|
| Oppgaveforståelse og hierarki | 72 | 20% |
| Navigasjon og interaksjon | 72 | 15% |
| Visuell kvalitet og konsistens | 82 | 15% |
| Farge og temperaturuttrykk | 76 | 10% |
| Tekst, tillit og troverdighet | 64 | 15% |
| Produktverdi og kjøpsbidrag | 58 | 20% |
| Tilgjengelighet og robusthet | 74 | 5% |

### Det som fungerer

- **Oversiktlig læringspakke:** Åtte korte temaer er lettere å forstå enn en lang artikkelsamling, og den første smakebiten er tydelig. _(rendered: first-winter--overview.png)_

### Det som bør forbedres

- **HIGH — Sikkerhetsnære temaer ligger bak Plus:** Temaene «Vogn, bæresele eller lek» og «Sjekk nakken» er merket Med Babyora Plus.
  - Evidens: rendered — first-winter--overview.png
  - Effekt: Det kan oppleves som at grunnleggende korrekt og trygg bruk holdes tilbake for betaling, i konflikt med gratisproduktets troverdighet.
  - Retning: Gjør sikkerhetskritisk kjerneinformasjon gratis; bruk Plus til planlegging, progresjon, personalisering eller sesongpåminnelser.
- **MEDIUM — Ukentlig pacing kan hindre behovsstyrt læring:** «Én i uka» antyder at forelderen må følge rekkefølgen selv når et senere tema er aktuelt nå.
  - Evidens: rendered — first-winter--overview.png
  - Effekt: Innholdet føles mer som kursretention enn hjelp i øyeblikket.
  - Retning: La temaene være søkbare og tilgjengelige etter behov; bruk en anbefalt rekkefølge uten tvungen venting.

## Innstillinger

**Score: 70.9/100 — Tydelig forbedringsrom**  
Kommersiell rolle: Innstillinger avslører den strategiske inkonsistensen tydeligst og må reflektere den nye gratis/Plus-modellen før paywallen kan bli troverdig.  
Vurderingssikkerhet: high — Relevant profil-, sted- og varslingsinnhold er synlig, og tilgangshåndteringen er bekreftet i kode.

### Delkarakterer

| Område | Score | Vekt |
|---|---:|---:|
| Oppgaveforståelse og hierarki | 75 | 20% |
| Navigasjon og interaksjon | 76 | 15% |
| Visuell kvalitet og konsistens | 76 | 15% |
| Farge og temperaturuttrykk | 72 | 10% |
| Tekst, tillit og troverdighet | 70 | 15% |
| Produktverdi og kjøpsbidrag | 58 | 20% |
| Tilgjengelighet og robusthet | 76 | 5% |

### Det som fungerer

- **God gruppering av profil og sted:** Barn, lokasjon, værkilde og varsler har tydelige seksjoner og store kontrollflater. _(rendered: settings--default.png)_

### Det som bør forbedres

- **CRITICAL — Tilgangsreglene er motsatt av produktretningen:** Automatisk posisjon vises som vanlig innstilling, mens det enkle morgenvarselet er merket Plus.
  - Evidens: repository — settings--default.png og gating-logikken i InnstillingerScreen.tsx
  - Effekt: Gratisbrukeren får «overalt», men må betale for vanemekanismen som kunne etablert daglig bruk hjemme.
  - Retning: Gjør enkel morgenpåminnelse gratis og flytt automatisk sted/flere steder til Plus, med tydelig fallback til hjemsted.
- **HIGH — Familieverdien er ikke synlig:** Skjermen tilbyr barn og sted, men ingen omsorgspersoner, invitasjoner eller tilgangsroller.
  - Evidens: rendered — settings--default.png
  - Effekt: Påstanden om én betaling for familien kan ikke oppleves eller forstås fra produktet.
  - Retning: Ikke markedsfør familie som levert før en enkel Familie-flate med eier, omsorgsperson og invitasjonsflyt finnes.

## Betalingsvegg

**Score: 64.7/100 — Blandet**  
Kommersiell rolle: Paywallen er ryddig som prisvelger, men den mangler selve Plus-produktet: konkrete utfall, produktforhåndsvisning og en sammenhengende grunn til å abonnere.  
Vurderingssikkerhet: high — Hele paywallen, alle planer, CTA og tillitslinje er synlige; produkt- og copykildene er bekreftet i kode.

### Delkarakterer

| Område | Score | Vekt |
|---|---:|---:|
| Oppgaveforståelse og hierarki | 60 | 20% |
| Navigasjon og interaksjon | 74 | 15% |
| Visuell kvalitet og konsistens | 76 | 15% |
| Farge og temperaturuttrykk | 74 | 10% |
| Tekst, tillit og troverdighet | 62 | 15% |
| Produktverdi og kjøpsbidrag | 48 | 20% |
| Tilgjengelighet og robusthet | 78 | 5% |

### Det som fungerer

- **Pris og valgt plan er lett å se:** Årsplanen er forhåndsvalgt, besparelse og gratisperiode er synlige, og CTA-en gjentar prøveperioden. _(rendered: paywall--default.png)_
- **Transparenslinjen reduserer noe risiko:** Skjermen sier hva årsplanen koster etter syv dager og at abonnementet kan avsluttes. _(rendered: paywall--default.png)_

### Det som bør forbedres

- **CRITICAL — Paywallen selger gratisproduktets kjerne:** Overskriften «Våkn opp til ferdig antrekk» handler om dagens antrekk, ikke fremover, automatisk sted eller familiekoordinering.
  - Evidens: repository — paywall--default.png og PAYWALL_COPY.flagshipHeadline
  - Effekt: Brukeren kan oppfatte gratisløftet som en demo eller ikke forstå hva abonnementet utvider.
  - Retning: Led med «Fremover, overalt og sammen» og vis tre konkrete situasjoner: morgendagens endring, råd hos bestemor og delt anbefaling.
- **HIGH — Tre prisvalg konkurrerer uten verdibevis:** Årlig, månedlig og Barnetiden fyller nesten hele skjermen før konkrete Plus-fordeler vises; 499 kr er dessuten nær to års årspris.
  - Evidens: repository — paywall--default.png og products.ts
  - Effekt: Brukeren må først ta en komplisert prisbeslutning, og engangskjøpet kan svekke abonnementsøkonomien.
  - Retning: Vis to hovedvalg med årsplan anbefalt, legg engangskjøp under flere alternativer eller pris det som et tydelig langsiktig pass, og vis verdien før prisene.
- **HIGH — Familiepåstanden er vag og inkonsistent:** «Én Premium — begge foreldre» bruker et annet produktnavn enn Plus og lover en familieverdi som ikke er synlig i appen.
  - Evidens: repository — paywall--default.png og TRUST_LINE_COPY
  - Effekt: En sterk mulig betalingsgrunn blir en troverdighetsrisiko når brukeren ikke kan se hvordan deling fungerer.
  - Retning: Bruk «Én Plus — alle som passer barnet» først når den faktiske invitasjons- og rolleflyten er levert; ellers fjern påstanden midlertidig.
