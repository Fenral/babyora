# Fase 1 — onboarding-research

**Dato:** 2026-08-07

## Hva som faktisk ble gjort

- Mobbin MCP ble brukt direkte mot iOS-biblioteket: fire søk etter komplette flyter og fire dype skjermsøk, til sammen 16 visuelt inspiserte referanser.
- Apple Human Interface Guidelines, Nielsen Norman Group, Page Flows og Growth.Design ble lest via kildesøk 2026-08-07.
- Ingen referanse er behandlet som effektbevis. Mobbin og Page Flows viser hva andre har bygget, ikke at løsningen virker.
- Higgsfield ble ikke brukt. Fasekontrakten forbyr omfattende generering før EIERPORT 1.

## Referansematrise

`Observasjon` er det som var synlig i kilden. `Dom` er Babyora-tolkningen.

| # | Kilde | Observasjon | Mediets jobb | Uten mediet | Dom |
|---:|---|---|---|---|---|
| 1 | [GoHenry — Onboarding, 24 skjermer](https://mobbin.com/flows/24719932-c82c-4512-a140-d4421b8b7d78) | Sterk lilla foto-/produktåpning etterfulgt av mange ordinære profil- og verifiseringsskjermer. | Setter kategori og forelder/barn-kontekst. | Selve skjemaet virker fortsatt. | Foto kan forklare kategori, men 24 steg er et friksjonsvarsel, ikke en mal. |
| 2 | [Peanut — Adding lifestage, 10 skjermer](https://mobbin.com/flows/420b8821-bcff-4357-8910-fcd18f5d6265) | Native, tekst- og kontrolltung livsfase/DOB-flyt; foto dukker først opp når identitet faktisk skal verifiseres. | Foto løser verifisering, ikke pynt. | Personaliseringen er forståelig. | Sterkt no-photo-bevis som mønster, ikke effektmåling. |
| 3 | [Hyundai Card — Turning on location, 5 skjermer](https://mobbin.com/flows/30dd9038-b12a-452b-834e-35e07ce031f6) | Værnytten vises i grensesnittet før systemets posisjonstillatelse; etter samtykke kommer værfeltet til syne. | UI demonstrerer årsak og gevinst. | Fotografisk media er unødvendig. | Relevant for Babyoras stedssteg: vis lokal verdi før samtykke. |
| 4 | [(Not Boring) Weather — Onboarding, 7 skjermer](https://mobbin.com/flows/9b497adc-67c2-4da9-b1bc-9fc583083113) | Sparsomme, mørke, animerte merkevareskjermer med hopp over; ender direkte i visuelt betalingspress. | Spektakel og tone. | Værjobben kan fortsatt forklares. | Anti-mønster: bevegelse erstatter ikke produktforklaring. |
| 5 | [Life Reset — Setting up profile, 12 skjermer](https://mobbin.com/flows/e91bc9a4-db92-449a-8de2-2d5e81381f6b) | Dramatisk, sannsynlig syntetisk landskap og spørsmål som ender i en diagnostisk, følelsesladet «innsikt». | Emosjonell priming og autoritet. | Spørsmålene virker, men avsløringen mister teater. | Forkast som retning: manipulerende og for sterk slutning fra svake data. |
| 6 | [stoic. — Onboarding, 14 skjermer](https://mobbin.com/flows/948a7285-9f2f-46d1-8d82-32da2d4ce828) | Native spørsmål og planlegging uten foto; deretter synlig «forbereder»-lasting og betalingsvegg. | UI bærer tillit; lasting dramatiserer arbeid. | Hovedflyten er forståelig. | God no-photo-referanse, men lang flyt og lasteteater er svake for Babyora. |
| 7 | [pliability — Customizing an experience, 7 skjermer](https://mobbin.com/flows/55148cf9-a50f-41d4-b9b0-e8e836ca850d) | Enkle mørke spørsmål først; ekte person i fullflate-media først når en faktisk treningsøkt kan startes. | Demonstrerer tjenesten på bruksstedet. | Profileringen virker; økten blir mindre konkret. | Sterkt timingprinsipp: media etter input når det demonstrerer selve leveransen. |
| 8 | [Replika — Selecting a character type, 9 skjermer](https://mobbin.com/flows/b558f09a-f3ae-422d-98c6-ad93bc0f49e5) | Fotorealistisk/syntetisk ansikt og 3D-avatar er selve produktet og dominerer flyten. | Skaper en personrelasjon. | Produktidentiteten faller sammen. | Anti-mønster for Babyora: et syntetisk barn ville late som det er produktet. |
| 9 | [Cleo AI — fullflate-foto](https://mobbin.com/screens/f221fb25-448c-49ed-b64c-061508f9d546) | Mediterende person bak «You're ready to save» etter fullført oppsett. | Markerer overgang og ønsket fremtid. | Budskap og CTA står alene. | Foto kan gi emosjonell markør, men forklarer ikke mekanismen. |
| 10 | [Fi — fullflate-foto](https://mobbin.com/screens/37e410b0-4e63-4334-8948-681ae0454dc3) | Nærbilde av hund med produktet, én «Continue»-knapp. | Viser målgruppe og fysisk produkt samtidig. | Kategorien blir langt mindre tydelig. | Godt foto fordi objektet er sant og synlig; Babyoras råd er ikke et fysisk plagg. |
| 11 | [Moonly — før/etter](https://mobbin.com/screens/be9b1658-d3ea-4eb8-ab40-0c7f89bf6397) | To selvrapporterende livstilstander og presse-logoer. | Lover transformasjon og sosialt bevis. | Påstanden er fortsatt lesbar. | Anti-mønster: uetterprøvbar identitetsendring, uegnet i en omsorgskontekst. |
| 12 | [Opal — før/etter](https://mobbin.com/screens/aa59fc65-fff7-4fa0-8d67-32ede1ed2d85) | Konkret skjermtidsgraf før/etter, fordeler, anmeldelser og CTA. | Kvantifiserer ønsket resultat. | Teksten kan forklare, men grafen gjør forskjellen skannbar. | Relevant struktur: vis konkret utdata, ikke emosjonelt løfte. |
| 13 | [Me+ — videoinstruksjon](https://mobbin.com/screens/10d088bd-6234-4e32-bd37-82ad9c7409f8) | Telefonramme med videominiatyr, play-symbol og hånd som viser sveip. | Lærer en bestemt gest og innholdstype. | Instruksjonen kan skrives, men blir mindre umiddelbar. | Motion er berettiget når den lærer en handling; ikke bare for varme. |
| 14 | [MyDyson — produktdemo](https://mobbin.com/screens/3442937f-a3de-4aff-bd66-3c1b32499ea4) | Foto av hånd som fjernstyrer det faktiske produktet, med «Total control». | Beviser fysisk årsak–virkning. | Påstanden mister konkret belegg. | God mediejobb; Babyora kan etterligne årsak–virkning native med vær → lagliste. |
| 15 | [Pillow — venting i betalingsflate](https://mobbin.com/screens/a8e5459d-f0dc-46bf-a2ff-8d0dbec02788) | Medielogoer, pris og deaktivert «Please wait…» i samme kort. | Lasting holder igjen kjøpshandlingen. | Betalingsinformasjonen står. | Anti-mønster: venting uten synlig produktverdi. |
| 16 | [Evernote — «personalizing» 40 %](https://mobbin.com/screens/19a20326-23a4-4ec5-b56c-e75d95358a64) | Prosent-ring, generell prosesspåstand, anmeldelse og deaktivert plan-CTA. | Iscenesetter arbeid og sosialt bevis. | Ingen faktisk verdi går tapt. | Anti-mønster for Babyora; dagens 3,2 s skann er allerede nok venting. |

### Samme materiale i kontraktens analysematrise

| App/kilde | Lenke | Bildetype | Bildets jobb | Når i flyten | Hva skjer uten bildet? | Overførbart prinsipp | Babyora-risiko | ADOPT/ADAPT/REINVENT/REJECT |
|---|---|---|---|---|---|---|---|---|
| GoHenry | [Flyt](https://mobbin.com/flows/24719932-c82c-4512-a140-d4421b8b7d78) | Ekte foto + produkt | Setter forelder/barn-kategori | Åpning | Skjemaet virker, kategori svekkes | Vis kategori konkret | Lang og tung flyt | ADAPT kun kategorisignal |
| Peanut | [Flyt](https://mobbin.com/flows/420b8821-bcff-4357-8910-fcd18f5d6265) | Native UI, foto ved verifisering | Løser identitet | Sent, ved behov | Oppsettet er intakt | Media må ha nødvendig jobb | Selvfie kan mistolkes som generell norm | ADOPT timingprinsippet |
| Hyundai Card | [Flyt](https://mobbin.com/flows/30dd9038-b12a-452b-834e-35e07ce031f6) | Native vær-UI | Forklarer lokal gevinst | Før tillatelse | Ingen meningssvikt | Vis nytte før samtykke | Kan bli en falsk værfixture | REINVENT med sann Babyora-data |
| (Not Boring) Weather | [Flyt](https://mobbin.com/flows/9b497adc-67c2-4da9-b1bc-9fc583083113) | Motion/3D | Merkevarespektakel | Før produkt/betaling | Værjobben kan forklares raskere | Motion må lære | Forsinkelse og show før verdi | REJECT |
| Life Reset | [Flyt](https://mobbin.com/flows/e91bc9a4-db92-449a-8de2-2d5e81381f6b) | Sannsynlig AI-fotorealisme | Emosjonell priming | Gjennom spørsmål/reveal | Teateret forsvinner | Ikke overdriv innsikt | Falsk autoritet | REJECT |
| stoic. | [Flyt](https://mobbin.com/flows/948a7285-9f2f-46d1-8d82-32da2d4ce828) | Native no-photo | Bærer spørsmål og plan | Hele oppsettet | Hovedflyten er intakt | Native kan skape ro/tillit | Lang flyt og lasteteater | ADAPT native ro; REJECT lasting |
| pliability | [Flyt](https://mobbin.com/flows/55148cf9-a50f-41d4-b9b0-e8e836ca850d) | Ekte treningsmedia | Demonstrerer økten | Rett før faktisk økt | Oppsettet virker, økten blir mindre konkret | Media nær leveransen | Generisk livsstilsfølelse | ADOPT timingprinsippet |
| Replika | [Flyt](https://mobbin.com/flows/b558f09a-f3ae-422d-98c6-ad93bc0f49e5) | AI-/3D-person | Er selve produktet | Fra start | Produktidentiteten kollapser | Personmedia må være produktet | Syntetisk barn blir falsk relasjon | REJECT |
| Cleo AI | [Skjerm](https://mobbin.com/screens/f221fb25-448c-49ed-b64c-061508f9d546) | Fullflate livsstilsfoto | Markerer ønsket fremtid | Etter oppsett | CTA/budskap står | Foto som overgang, ikke forklaring | Generisk velvære | ADAPT kun som test |
| Fi | [Skjerm](https://mobbin.com/screens/37e410b0-4e63-4334-8948-681ae0454dc3) | Ekte produktfoto | Viser målgruppe og enhet | Åpning | Kategorien blir uklar | Vis sann fysisk gjenstand | Babyora har ikke ett fysisk antrekk | REINVENT som UI, ikke foto |
| Moonly | [Skjerm](https://mobbin.com/screens/be9b1658-d3ea-4eb8-ab40-0c7f89bf6397) | Illustrert før/etter | Lover identitetsendring | Før CTA | Påstanden står | Gjør forskjell skannbar | Uetterprøvbar transformasjon | REJECT |
| Opal | [Skjerm](https://mobbin.com/screens/aa59fc65-fff7-4fa0-8d67-32ede1ed2d85) | Native graf, no-photo | Kvantifiserer resultat | Før kjøps-CTA | Tekst blir mindre konkret | Vis virkelig utdata | Kan overselge effekt | ADAPT struktur |
| Me+ | [Skjerm](https://mobbin.com/screens/10d088bd-6234-4e32-bd37-82ad9c7409f8) | Videominiatyr + gest | Lærer sveip og format | Tidlig | Instruksjon kan skrives | Motion for handling | Video blir feature-tour | ADAPT mekanismen |
| MyDyson | [Skjerm](https://mobbin.com/screens/3442937f-a3de-4aff-bd66-3c1b32499ea4) | Foto av produktbruk | Beviser årsak–virkning | Etter tilkobling | Påstanden mister belegg | Vis input → effekt | Foto kan late som faglig bevis | REINVENT native |
| Pillow | [Skjerm](https://mobbin.com/screens/a8e5459d-f0dc-46bf-a2ff-8d0dbec02788) | Logoer + spinner | Holder kjøpsflate igjen | Ved betaling | Ingen produktverdi tapes | Lasting må være ekte/nødvendig | Betalingspress | REJECT |
| Evernote | [Skjerm](https://mobbin.com/screens/19a20326-23a4-4ec5-b56c-e75d95358a64) | Native progress, no-photo | Iscenesetter personalisering | Før plan-CTA | Ingen faktisk verdi tapes | Synliggjør bare ekte arbeid | Lasteteater | REJECT |

**Fire tydelige no-photo-referanser:** Peanut, Hyundai Card, stoic. og Opal. Evernote er et femte no-photo-eksempel, men et anti-eksempel. **Minst tre anti-eksempler:** (Not Boring) Weather, Life Reset, Replika, Moonly, Pillow og Evernote.

## Seks referanser undersøkt i dybden

### Peanut: bildet må ha en nødvendig jobb

Flyten samler livsfase og fødselsdato med standardkontroller. Ansiktsfoto introduseres først når handlingen er identitetsverifisering. Det er et renere kriterium enn «foto føles varmt»: hvis bildet fjernes og oppgaven fortsatt er like forståelig, er det sannsynligvis pynt.

### Hyundai Card: forklar posisjon med produktet

Værfordelen er synlig før systemdialogen. Dette svarer direkte på Babyoras stedssteg: en liten, sann lokal eksempelrad kan forklare hvorfor hjemsted trengs bedre enn et generisk fotografi. Systemdialogen bør komme etter en brukerutløst handling, ikke som kald oppstart.

### (Not Boring) Weather: premiumbevegelse er ikke det samme som verdi

Den visuelle signaturen er konsistent og selvsikker, men skjermene bruker tid før brukeren får løse væroppgaven, og flyten leder til betaling. Relevansen for Babyora er negativ: en Higgsfield-sekvens kan se dyr ut og samtidig øke tid til første råd.

### Life Reset: emosjonell relevans kan bli falsk autoritet

Fotorealistisk dramatikk, personlige spørsmål og en sterk «diagnose» skaper et inntrykk av dyp forståelse uten at inputen forsvarer konklusjonen. For Babyora er dette en særlig risiko fordi foreldre allerede vurderer trygghet. Et bilde av en rolig, velkledd baby kan feilaktig leses som dokumentasjon på anbefalingen.

### Replika: syntetiske personer endrer produktløftet

Her er den kunstige personen produktet. Samme grep i Babyora ville flytte oppmerksomheten fra værgrunnlag og lagrekkefølge til «er dette barnet ekte, og er antrekket korrekt?». Det legger to tillitsspørsmål oppå et produkt som allerede må være presist.

### pliability: legg media nær faktisk bruk

Flyten holder oppsettet native og bruker ekte menneskemedia når brukeren står foran en økt som kan startes. Overført til Babyora betyr det: hvis foto senere viser seg nyttig, test det nær ferdig råd eller forklaring — ikke automatisk i første ramme.

## Eksterne prinsipper

- [Apple HIG — Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding): onboarding bør være rask, valgfri og helst lære gjennom interaksjon; store nedlastinger skal ikke hindre oppstart; kjøp bør komme etter at brukeren har opplevd produktet.
- [Apple HIG — Launching](https://developer.apple.com/design/human-interface-guidelines/launching/): oppstart skal være umiddelbar, launch-skjermen ligne første skjerm, og forrige tilstand bør gjenopprettes.
- [Apple HIG — Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy): be om tillatelse når behovet er tydelig, helst når brukeren utløser funksjonen som trenger den.
- [Apple HIG — Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility/) og [VoiceOver](https://developer.apple.com/design/human-interface-guidelines/voiceover): større tekst, mørk modus, reduserte automatiske bevegelser og meningsfulle bildebeskrivelser er produktkrav, ikke etterarbeid.
- [NN/g — Animation for Attention and Comprehension](https://www.nngroup.com/articles/animation-usability/): bevegelse bør forklare tilstand eller årsak–virkning; repetert eller perifer bevegelse bruker opp oppmerksomhet.
- [Page Flows — Onboarding](https://pageflows.com/resources/user-onboarding-how-to-perfect-the-process/): de fremhever produkt-før-registrering og gradvis læring. Dette er redaksjonell mønsteranalyse, ikke et Babyora-resultat.
- [Growth.Design — Headspace onboarding](https://growth.design/case-studies/headspace-user-onboarding): negativ problemramming og betaling før opplevd verdi svekker historien; dette er en case-tolkning, ikke et kontrollert forsøk her.
- [Growth.Design — Blinkist onboarding](https://growth.design/case-studies/blinkist-user-onboarding): spørsmål skaper forventning om synlig personalisering. Babyora må derfor gjøre koblingen vær + alder + aktivitet → råd lesbar.

## Hva researchen støtter — og ikke støtter

**Støtter som designretning:** Vis en liten, sann produktprøve tidlig. Bruk motion bare for å forklare årsak–virkning. Bruk foto bare når motivet gjør kategori, objekt eller handling mer konkret. Bevar en fullverdig statisk/offline vei.

**Avkrefter som premiss:** «Mer media gir mer tillit», «fotorealisme er autentisitet» og «synlig venting får rådet til å virke grundigere» har ingen dekning i materialet. Flere referanser viser det motsatte som en troverdig risiko.

**Fortsatt ukjent:** Om Babyoras foreldre faktisk forstår, stoler på eller foretrekker foto, motion eller no-photo. Det krever bake-off med brukere; referansebiblioteker kan ikke avgjøre det.

### Hva bilder kan gjøre

De kan gjøre en fysisk målgruppe, gjenstand eller handling konkret; markere en følelsesmessig overgang; eller demonstrere bruk når selve motivet er sant. I Babyora er den sterkeste legitime jobben situasjonsgjenkjenning, ikke antrekksfasit.

### Hva de ikke bør gjøre

De bør ikke late som de dokumenterer faglig presisjon, være en syntetisk «ekte baby», holde CTA tilbake, skjule betaling eller erstatte forklaringen av vær + alder + situasjon → lagrekkefølge.

### Hva Babyora må teste

Test korrekt produktforklaring, tillit uten overpresisjon, emosjonell relevans og tid til første gyldige råd. Test deretter om foto eller motion tilfører noe utover en native minidemonstrasjon. Estetisk preferanse kommer sist.

### Tre analyselag

- **Visuell konvensjon:** fullflate-foto, avatar, progress-ring, før/etter-graf eller motion-sekvens.
- **Underliggende UX-prinsipp:** kategorigjenkjenning, årsak–virkning, forventningssetting, tillatelsesbegrunnelse eller status.
- **Original Babyora-tolkning:** vis en sann, ordnet lagliste tidlig; bruk mediet bare hvis det slår denne på målbar forståelse/tillit uten tids- eller robusthetstap.
