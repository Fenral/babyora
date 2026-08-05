# Webresearch fase 7-forberedelse — rom 3, 4, 5 + fase 4-restgap
**Babyora Design Lab, ikke-Mobbin-runde. 2026-08-05.**
Merking per lab-konvensjon: **(a)** belagt med kilde, **(b)** testbar antakelse, **(c)** spekulasjon. Ingen mønstre kopieres; hvert funn oppgis med underliggende mekanisme og hva som *ikke* skal arves. Eksakte tall fra én app/ett produkt behandles som hypoteser (Sols krav, sol-review-svar-fase5.md linje 53).

---

## Rom 3 — Closed-loop omsorgshandoff

### 3.1 Sykepleie-/legevaktskifter: I-PASS og SBAR

- **(a)** I-PASS-studien (Starmer et al., NEJM 2014, 10 740 innleggelser, 9 pediatriske programmer) fant 23 % reduksjon i medisinske feil (24,5→18,8 per 100 innleggelser, p<0,001) og 30 % reduksjon i forebyggbare uønskede hendelser (4,7→3,3, p<0,001) — **uten at overleveringen tok lengre tid** (2,4 vs 2,5 min per pasient, p=0,55). Kilder: [NEJM](https://www.nejm.org/doi/full/10.1056/NEJMsa1405556), [PubMed](https://pubmed.ncbi.nlm.nih.gov/25372088/).
- **(a)** Den bærende mekanismen i I-PASS er ikke sjekklisten alene, men strukturen: alvorlighetsgrad → sammendrag → handlingsliste → situasjonsbevissthet/*contingency plans* → **syntese av mottaker** (mottakeren gjenforteller med egne ord). Overleveringen er ikke ferdig før mottakeren har produsert innholdet selv.
- **(a)** SBAR/read-back: strukturert kommunikasjon + read-back er anerkjent som feilreduserende på tvers av bransjer; Joint Commission har krevd read-back av kritiske prøvesvar. Men implementeringsgapet er reelt: én studie fant at read-back-verifisering bare skjedde i ~60 % av tilfellene. Kilder: [readback-studie, PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3418160/), [SBAR-review](https://scholar.utc.edu/honors-theses/66/), [closed-loop-oversikt](https://www.statdebrief.com/post/optimizing-patient-safety-through-closed-loop-communication-in-healthcare).

**Mekanisme, ikke form:** feilreduksjonen kommer av (1) fast informasjonsrekkefølge, (2) eksplisitte *contingencies* («hvis X skjer, gjør Y»), (3) mottaker-produsert syntese. **Kopieres ikke:** mnemonikken, klinisk terminologi, muntlig-format. **Domeneavvik:** vaktskifter skjer mellom trente fagfolk med felles opplæring; Babyoras mottaker (besteforelder, dagmamma) har null opplæring og ingen konto — synteseleddet må derfor være trivielt lett, ellers skjer det ikke (jf. 60 %-gapet selv blant fagfolk).

### 3.2 Barnehage–foreldre-praksis

- **(a, svak kildekvalitet)** Bransjekildene (Brightwheel, Lillio, LineLeader m.fl.) er leverandørmarkedsføring, ikke forskning. De dokumenterer likevel en etablert *praksisform*: daglig rapport med basisbehov (mat/søvn/bleie), dagens høydepunkt og toveiskanal, og hevder at hyppighet driver tillit («76 % av foreldre vil høre fra barnehagen minst ukentlig» — utestbart leverandørtall, behandles som **(c)**). Kilder: [Brightwheel](https://mybrightwheel.com/communication/), [LineLeader](https://blog.lineleader.com/parent-app-for-childcare-trust-and-communication).
- **(a)** Henteautorisasjon er det mest interessante funnet: barnehager løser «betrodd mottak uten konto» analogt hver dag — navngitt liste satt opp av forelderen på forhånd, ukjent person verifiseres mot listen + foto-ID, og personalet er trent i hva de gjør ved avvik. Autorisasjon er altså *pre-deklarert av avsender*, verifisert *i øyeblikket*, uten at mottakeren har noen konto. Kilder: [Brightwheel pickup-form](https://mybrightwheel.com/blog/childcare-pickup-authorization-form), [Playto](https://playto.com/blog/daycare-pick-up-and-drop-off-procedures), [Childspace policy](https://www.childspacedaycare.com/for-parents/policies/pickup-of-children-policy/).

### 3.3 «Sett ≠ forstått»

- **(a)** CHI-forskning på read receipts viser at «sett»-kvittering *øker* feiltolkning: avsender antar handling er i gang, mottaker har bare åpnet meldingen; asymmetrien skaper friksjon, ikke trygghet. Kilder: [CHI 2022, ACM](https://dl.acm.org/doi/fullHtml/10.1145/3491102.3517496), [Lynden & Rasmussen](https://tidsskrift.dk/mef-journal/article/download/28781/25181/67875).
- **(a)** Teach-back er den best dokumenterte «forstått»-mekanismen i helse: mottaker gjenforteller med egne ord; assosiert med bedre forståelse, etterlevelse og færre reinnleggelser (hjertesvikt), særlig hos lav helsekompetanse. Kilder: [PLOS One systematic review](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0231350), [AHRQ Tool 5](https://www.ahrq.gov/health-literacy/improve/precautions/tool5.html).

### 3.4 Mottaksbekreftelse uten konto — mekanismekatalog

Tre dokumenterte mekanismer som ikke krever mottakerkonto:
1. **(a)** Read-back/teach-back: mottaker produserer innholdet (3.1, 3.3).
2. **(a)** Pre-deklarert autorisasjonsliste + verifisering i øyeblikket (3.2).
3. **(a)** Meldingsbårne livssyklusfelt: CAP-standarden (OASIS) gir hver melding `sent`/`effective`/`onset`/`expires` og meldingstyper for oppdatering, kansellering og kvittering — livsløpet ligger *i meldingen*, ikke i en konto. Kilde: [CAP v1.2, OASIS](https://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2-os.html).

**Implikasjon for Closed-loop Briefing (retningskandidat):** Sols kjede mottatt→forstått→akseptert→utført→oppdatert/revokert har nå belagte forbilder for hvert ledd: mottatt (kvitteringstype à la CAP Ack), forstått (mikro-teach-back: mottaker svarer på ett kontrollspørsmål eller reproduserer stoppkriteriet — ikke «OK»-knapp), akseptert (eksplisitt overtakelse à la vaktskifte), oppdatert/revokert (Update/Cancel-semantikk med versjon). **(b)** At en kontofri mottaker faktisk gjennomfører et mikro-teach-back-ledd er en testbar antakelse — 60 %-gapet blant fagfolk tilsier at leddet må koste <5 sekunder. **Anti-referanse:** read receipt («Sett av Kari 14:02») er dokumentert villedende og bør eksplisitt ikke bygges som tillitssignal.

---

## Rom 4 — Degraderte/offline tilstander

### 4.1 Luftfart: masker ugyldig data, ikke vis siste verdi

- **(a)** Glass-cockpit-doktrinen: når en sensor feiler, legges en rød X *over* det aktuelle displayfeltet. Prinsippet er at **plausibel-men-ugyldig data er farligere enn synlig fravær** — instrumentet fortsetter aldri å vise siste kjente verdi som om den var gjeldende. Delvis feil er dokumentert som kognitivt verre enn total feil (unaturlig skanning). Kilder: [Flying Magazine](https://www.flyingmag.com/dont-fear-the-red-x/), [Aviation Safety](https://aviationsafetymagazine.com/features/glass-cockpit-partial-panel/).

### 4.2 Maritimt: konservativ degradering med eksplisitt modusskifte

- **(a)** Når ECDIS mister GPS, skifter systemet til bestikkregning (dead reckoning) — det fortsetter å estimere, men **må** varsle hørbart og vise moduset eksplisitt (IMO MSC.232(82)). Dokumentert svikt: enkelte systemer viste DR-status bare som en liten rute — regnet som utilstrekkelig. Degradert modus krever altså *økt*, ikke redusert, synlighet. Kilder: [Nautical Institute](https://www.nautinst.org/resources-page/position-sources-for-ecdis.html), [ECDIS alarms-guide](https://www.marinepublic.com/blogs/training/829098-ecdis-alarms-alerts-the-complete-watchkeeper-s-guide).

### 4.3 Varslingssystemer: utløp bæres av innholdet

- **(a)** CAP: `expires` definerer «tidspunktet der informasjonen skal regnes som foreldet og ikke lenger brukes»; feltet er obligatorisk i amerikansk IPAWS-videreformidling. Kilde: [CAP v1.2](https://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2-os.html).
- **(a)** Skredvarsler (SLF, avalanche.org): utstedt-tidspunkt + gyldighetsperiode (typisk 24–48 t) trykkes på selve varselet; brukeropplæringen sier eksplisitt «sjekk at varselet gjelder dagen du skal ut». Kilder: [SLF](https://www.slf.ch/en/avalanche-bulletin-and-snow-situation/about-the-avalanche-bulletin/the-avalanche-bulletin/), [REI-guide](https://www.rei.com/learn/expert-advice/how-to-read-an-avalanche-forecast.html), [avalanche.org](https://avalanche.org/avalanche-encyclopedia/human/resources/avalanche-forecast/).

### 4.4 Babymonitorer: «overvåking avbrutt» er selv en alarmtilstand

- **(a)** Owlet: basestasjon varsler med lys/lyd også når *målingen er avbrutt* (ikke bare når verdier er utenfor normal); Bluetooth-fallback når wifi dør. Nanit: fortsetter lokal strømming på hjemmenettet uten internett. Mekanisme: tap av forbindelse behandles som hendelse med egen varsling, og kritisk funksjon flyttes lokalt. Kilder: [Owlet support](https://support.owletcare.com/hc/en-us/articles/21518439993869-BabySat-Alarms-Know-what-s-going-on), [Kido Bébé-sammenligning](https://kidobebe.com/blogs/the-adventure-of-motherhood/owlet-vs-nanit-whats-the-difference).

### 4.5 Dashboards: foreldelse skal synes

- **(a)** Industripraksis for sanntidsdashboards: eksplisitt «sist oppdatert», synlig degradering (dimming/banner) når data eldes, siste-kjente-verdi alltid merket («Data per 10:42»). Stale data er en topp-årsak til tapt tillit i dataplattformer. Kilder: [Smashing Magazine](https://www.smashingmagazine.com/2025/09/ux-strategies-real-time-dashboards/), [IBM](https://www.ibm.com/think/topics/stale-data), [Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards).

### 4.6 Kostnaden ved konservativ varsling: alarmtretthet

- **(a)** I klinisk overvåking er 68–99 % av alarmer falske eller ikke-handlingskrevende; bare 5–13 % av ICU-alarmer er handlingskrevende. Konsekvens: desensitivisering, avslåtte alarmer, farlige workarounds. Kilder: [AHRQ/NCBI](https://www.ncbi.nlm.nih.gov/books/NBK555522/), [PSNet](https://psnet.ahrq.gov/perspective/reducing-safety-hazards-monitor-alert-and-alarm-fatigue). Dette belegger Sols P2-advarsel mot Citizen-lignende eskalering-som-default: konservativ *varsling* skalerer ikke til gjentatt daglig bruk; konservativ *degradering* (vis mindre, påstå mindre) gjør det. **(b)**

**Implikasjon for Babyora (alle retninger, særlig Protokollen og Confidence Instrument):** Det belagte tverrdomene-prinsippet er: *aldri la foreldet spesifikt råd se gjeldende ut*. Degraderingsstigen blir: fersk → aldrende (synlig stempel) → utløpt (spesifikt råd maskeres, à la rød X) → fallback til konservativt generisk råd som ikke avhenger av ferske data («kle etter årstid + sjekk nakken») — det maritime DR-mønsteret oversatt: fortsett å hjelpe, men si tydelig at du navigerer på bestikk. **(b)** At maskering + generisk fallback slår «vis gammelt tall med liten timestamp» på faktisk atferd, er testbar. **Kopieres ikke:** rød X-symbolet, alarmlyd, DR-terminologi.

---

## Rom 5 — Lav lese-/funksjonsevne

### 5.1 Klarspråk

- **(a)** Ca. 1 av 5 voksne (USA) leser på ≤5. klassetrinn, mens helsemateriell typisk skrives på ≥10. trinn; anbefalt nivå for pasientmateriell er 3.–5. trinn. Systematisk review (29 424 materialer, 1990–2022): de fleste over anbefalt nivå. Lesbarhetsformler (Flesch-Kincaid) er utilstrekkelige alene — syntaks/semantikk avgjør forståelse. Kilder: [CHCS](https://www.chcs.org/resource/improving-written-communication-to-promote-health-literacy/), [ScienceDirect-review](https://www.sciencedirect.com/science/article/pii/S0738399125000230), [AHRQ toolkit](https://www.ahrq.gov/sites/default/files/wysiwyg/professionals/quality-patient-safety/quality-resources/tools/literacy-toolkit/healthlittoolkit2_tool11.pdf). Norske tall er ikke verifisert i denne runden — overføring til norsk kontekst er **(b)**.

### 5.2 Piktogrammer: hjelper, men langt svakere enn antatt

- **(a)** Terskler: ISO 3864 krever 66,7 % korrekt forståelse, ANSI Z535.3 krever 85 %. I en filippinsk studie besto bare 17 av 108 USP/FIP-piktogrammer (15,7 %) ANSI-kravet; i en annen studie nådde 55 % ISO-kravet og bare 30 % ANSI-kravet. Lavkompetente grupper skårer systematisk lavere, og litteraturen advarer eksplisitt mot **falsk trygghet** — brukeren tror hun forsto. Kilder: [PMC Philippines-studie](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8991701/), [PMC lav-literacy](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10623492/), [systematic review](https://www.sciencedirect.com/science/article/abs/pii/S1551741123004904).
- **Implikasjon:** Babyoras plaggikoner kan ikke *antas* forstått; hvert sikkerhetsbærende ikon må testes mot 85 %-terskelen med tekstlig belte-og-seler. Dette svekker en ren piktogram-strategi for stoppkriterier. **(b)**

### 5.3 IKEA: ordløshet er system, ikke stil

- **(a)** IKEAs designprinsipper er *klarhet* (hvert steg umiddelbart forståelig) og *kontinuitet* (stegene lærer brukeren manualens «språk», så ny læringskostnad synker per steg); ordløsheten er en skaleringsstrategi på tvers av språk. Nabosteg viser samme deler i ulike stadier — sekvensen bærer forståelsen. Kilder: [Fast Company](https://www.fastcompany.com/3052604/how-ikea-designs-its-infamous-instruction-manuals), [Cadasio](https://www.cadasio.com/post/designing-assembly-instructions-without-words). **Mekanisme til Physical-first Layering:** stegvis, tilstands-differensiell fremstilling («barnet nå» vs «barnet etter neste lag») kan bære lagrekkefølge uten tekst — men jf. 5.2: kontroll-/stopp-punkter kan ikke være ordløse alene. **(b)**

### 5.4 Énhåndsbruk under fysisk belastning

- **(a)** Hoober (1 333 observasjoner): 49 % énhåndsgrep, ~75 % tommelstyrt; komfortsonen er nedre tredjedel, og «dødsonen» øverst vokser med skjermstørrelse. Kilder: [A List Apart](https://alistapart.com/article/how-we-hold-our-gadgets/), [Smashing Magazine](https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/).
- **(a)** Encumbrance-forskningen (Brewster m.fl., Glasgow): å bære noe mens man bruker mobil reduserer treffsikkerhet målbart — tommel-treffavvik økte ~40 % (4,2 mm), og indeksfinger-treff falt til 48,1 % nøyaktighet under belastning + gange. Kilder: [Springer](https://link.springer.com/chapter/10.1007/978-3-642-40477-1_6), [Glasgow eprints](https://eprints.gla.ac.uk/117068/1/117068.pdf). Et barn på armen er ikke testet i disse studiene — overføringen er **(b)**, men retningen (større treffmål, nedre sone, færre presisjonskrav) er belagt.

---

## Fase 4-restgap A: faktisk utendørs-/Dynamic Type-bruk

- **(a, én-produkts-telemetri → hypotese per lab-regel)** PSPDFKits telemetri (2018): ~20 % av iOS-brukere har større enn standard tekst. Kilder: [PSPDFKit-blogg](https://pspdfkit.com/blog/2018/improving-dynamic-type-support/), [Yahoo Finance-omtale](https://finance.yahoo.com/news/1-5-iphone-users-prefers-133000992.html). Tallet «40 %+» som sirkulerer ([dev.to](https://dev.to/fassko/embracing-the-dynamic-type-37m6), MoldStud) er ukildebelagt og behandles som **(c)**. Arbeidshypotese: **(b)** 15–25 % av Babyora-brukere vil ha ikke-standard tekststørrelse; alle tre retninger må bevise layout ved minst «xxxLarge».
- **(a)** Utendørs lesbarhet: direkte sollys krever i praksis 1 000–1 500+ nits, og refleksjoner hever effektivt svartnivå slik at **kontrastrommet kollapser** — mørke gråtoner og subtile fargeforskjeller forsvinner først. Kilder: [AbraxSys](https://www.abraxsyscorp.com/how-many-nits-does-my-screen-need-for-sunlight-readability/), [How-To Geek](https://www.howtogeek.com/is-smartphone-sunlight-readability-an-overrated-smartphone-spec/).
- **Funnet spenning (viktig):** dashboard-praksisens «dim det som er foreldet» (4.5) kolliderer med sollys-fysikken — dimming er nettopp det som blir usynlig ute. Stale-signal utendørs må derfor være *strukturelt* (maskering, form, tekststempel), ikke *luminans-basert*. **(b)** Dette er et konkret krav ingen Mobbin-referanse ville avdekket.
- **Restgap som består:** hanskebruk/kalde fingre ble ikke kildebelagt i denne runden (encumbrance dekker last, ikke hansker), og faktisk felttest med norsk vinterlys/vott er fortsatt ugjort — layoutobservasjoner teller ikke som brukerbevis (Sols linje 57).

## Fase 4-restgap B: hele stale-state-livsløpet

Syntese av 4.1–4.5 gir et belagt livsløp som kan porteres til Babyora-kortet: **utstedt → gjelder-fra → gjelder-til → foreldet(maskert) → oppdatert(versjon) → tilbakekalt**, der (a) utløp bæres av innholdet selv (CAP/skredvarsel), (b) foreldelse aldri fremstår som gyldighet (rød X), (c) degradering skifter modus eksplisitt og fortsetter konservativt (ECDIS DR), og (d) avbrutt datatilførsel selv er en hendelse (Owlet). Koblet til rom 3 lukkes sløyfen: en handoff som endres av avsender skal sende Update/Cancel-semantikk til mottakerflaten uten konto. **(b)** At dette livsløpet faktisk hindrer bruk av foreldet råd (Sols antakelse 6) er fortsatt utestet og må i fase 7-prototypene.

---

## Konsekvens for de fire retningskandidatene

1. **Protokollen:** styrket. I-PASS beviser at strukturert protokoll med contingencies reduserer feil uten tidskostnad **(a)**; alarmtretthet-litteraturen setter grensen: stoppkriterier må være få og handlingskrevende **(a)**.
2. **Confidence Instrument:** betinget styrket. Skredvarselets utstedt/gyldig-til + «svakeste premiss» har direkte forbilde **(a)**, men piktogram-funnene advarer mot at instrumentgrafikk forstås dårligere enn designere tror **(a)** — falsk trygghet er den dokumenterte risikoen.
3. **Closed-loop Briefing:** mest beriket av runden. Hele kjeden har nå kontofrie, belagte mekanismer (3.4 + livsløpet i B). Kjernehypotesen som må testes: mikro-teach-back på <5 sek **(b)**.
4. **Physical-first Layering:** IKEA-kontinuitet + encumbrance/tommel-sone gir belagt grunnlag for stegvis, nedre-sone, store-mål-interaksjon **(a)**, men sikkerhetsbærende punkter kan ikke være rent ordløse **(a)**.

**Stoppkriterium-vurdering (Sols linje 55):** de to siste søkebatchene endret ingen retning, men skjerpet premisser (kontrast-kollaps ute, piktogram-terskler, mikro-teach-back-kostnad). Ytterligere websøk i disse tre rommene forventes ikke å flytte noe — gjenstående bevisbyrde ligger i prototype-testing (teach-back-kostnad, stale-maskering vs. timestamp, xxxLarge-layout) og i felt (sollys/hansker), ikke i mer research.

## Kildeliste (hoved)
- [Starmer et al., NEJM 2014 — I-PASS](https://www.nejm.org/doi/full/10.1056/NEJMsa1405556) / [PubMed-abstract](https://pubmed.ncbi.nlm.nih.gov/25372088/)
- [Readback i kirurgi, PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3418160/) · [SBAR-litteraturreview](https://scholar.utc.edu/honors-theses/66/)
- [Teach-back systematic review, PLOS One](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0231350) · [AHRQ Tool 5](https://www.ahrq.gov/health-literacy/improve/precautions/tool5.html)
- [Read receipts, CHI 2022](https://dl.acm.org/doi/fullHtml/10.1145/3491102.3517496)
- [Brightwheel henteautorisasjon](https://mybrightwheel.com/blog/childcare-pickup-authorization-form) · [Childspace-policy](https://www.childspacedaycare.com/for-parents/policies/pickup-of-children-policy/)
- [Rød X / glass cockpit, Flying Magazine](https://www.flyingmag.com/dont-fear-the-red-x/) · [Aviation Safety, partial panel](https://aviationsafetymagazine.com/features/glass-cockpit-partial-panel/)
- [ECDIS posisjonskilder, Nautical Institute](https://www.nautinst.org/resources-page/position-sources-for-ecdis.html)
- [CAP v1.2, OASIS](https://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2-os.html) · [SLF skredvarsel](https://www.slf.ch/en/avalanche-bulletin-and-snow-situation/about-the-avalanche-bulletin/the-avalanche-bulletin/) · [REI-guide](https://www.rei.com/learn/expert-advice/how-to-read-an-avalanche-forecast.html)
- [Owlet alarmtyper](https://support.owletcare.com/hc/en-us/articles/21518439993869-BabySat-Alarms-Know-what-s-going-on)
- [Stale data, IBM](https://www.ibm.com/think/topics/stale-data) · [Smashing Magazine, real-time dashboards](https://www.smashingmagazine.com/2025/09/ux-strategies-real-time-dashboards/)
- [Alarm fatigue, AHRQ/NCBI](https://www.ncbi.nlm.nih.gov/books/NBK555522/) · [PSNet](https://psnet.ahrq.gov/perspective/reducing-safety-hazards-monitor-alert-and-alarm-fatigue)
- [Piktogrammer, Filippinene-studie](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8991701/) · [Lav-literacy piktogrammer](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10623492/) · [Systematic review](https://www.sciencedirect.com/science/article/abs/pii/S1551741123004904)
- [IKEA-manualer, Fast Company](https://www.fastcompany.com/3052604/how-ikea-designs-its-infamous-instruction-manuals)
- [Klarspråk-review, ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0738399125000230) · [CHCS helsekommunikasjon](https://www.chcs.org/resource/improving-written-communication-to-promote-health-literacy/)
- [Hoober, A List Apart](https://alistapart.com/article/how-we-hold-our-gadgets/) · [Encumbrance, Springer](https://link.springer.com/chapter/10.1007/978-3-642-40477-1_6) · [Glasgow eprints](https://eprints.gla.ac.uk/117068/1/117068.pdf)
- [PSPDFKit Dynamic Type-telemetri](https://pspdfkit.com/blog/2018/improving-dynamic-type-support/) · [AbraxSys nits-guide](https://www.abraxsyscorp.com/how-many-nits-does-my-screen-need-for-sunlight-readability/)