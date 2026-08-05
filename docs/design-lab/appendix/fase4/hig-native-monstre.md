# Fase 4 — Global Native Design Research: Apple HIG, Apple Design Awards og Material 3

> Utført 2026-08-05. Ekstern research (websøk/fetch), holdt opp mot `docs/design-lab/04-challenge-the-brief.md` (H1/H2/H3), `premisslogg.md` og fase 1-auditen av Monter (`appendix/fase1/designsystem.md`). Regel fulgt: analyser/tilpass/forkast — aldri kopier.

## 1. Gjeldende HIG-retning: Liquid Glass og hva som faktisk er substansen

iOS 26 (høst 2025) er den største visuelle omleggingen siden iOS 7. «Liquid Glass» er et refraktivt, halvtransparent materiale som nå er standard på systembarer, og HIG er omskrevet rundt tre prinsipper: **hierarki, harmoni, konsistens** (createwithswift.com, learnui.design). Overflate-trenden er glasseffekten; substansen er tre dypere skift:

1. **Innhold først, krom trekker seg unna.** Tab-baren flyter over innholdet, kan minimeres ved scroll (`tabBarMinimizeBehavior`), og navigasjonsbarer blir gjennomsiktige kanter i stedet for faste soner (Donny Wals, createwithswift). HIG restaterer samtidig hardt at tab-barer er for *toppnivånavigasjon mellom seksjoner* — ikke handlingsknapper.
2. **Materialet bærer hierarkiet.** Glass brukes kun på det øverste interaksjonslaget; innholdslaget skal være rolig og opakt. Dette er samme logikk som Monters flatefamilier (espresso=rom, petrol=instrument) — Monter er altså i takt med *prinsippet* uten å dele *materialet*.
3. **Kjent tilgjengelighetskost.** Transparens over kompleks bakgrunn svekker lesbarhet; kritikken er så etablert at «iOS 27-kurskorreksjon» allerede omtales (letsdev.de, aprenderhub). Monters forbud mot opacity-dempet tekst og målte OKLCH-kontraster er her *foran* Apples egen praksis.

**Kritisk realitet for Babyora:** appen er Capacitor/WebView. Ekte Liquid Glass (systemmaterialer, scroll-edge-effekter, native tab-bar-minimering) er utilgjengelig uten native lag. Å *imitere* glass i CSS ville være ren overflate-kopi — det doktrinen selv forbyr. Monters egen materialitet (fast lysvektor 135°, dybdekontrakt, kantlys) er en legitim egen identitet, men avstanden til plattformens texture vil øke gjennom 2026–27 etter hvert som brukerne kalibreres av systemappene.

## 2. Systemflatene: widgets, Live Activities, App Intents, StandBy — Apples egentlige retning

Den strategisk viktigste HIG-bevegelsen for Babyora er ikke estetikken, men at **appen som destinasjon svekkes til fordel for appen som system-tjeneste**:

- **App Intents** er nå rammeverket som mater Siri, Spotlight, interaktive widgets, kontroller, Action Button og Apple Intelligence — «one App Intent, many places» (developer.apple.com, blakecrosley.com). Bransjelesningen for 2026 er eksplisitt: *brukerintensjon foran UI*.
- **Interaktive widgets** (WidgetKit + App Intents) kan utføre handlinger uten å åpne appen; de kjører også på låst skjerm og **StandBy** (nattbordsmodus — relevant for foreldre som sjekker morgenen før barnet våkner).
- **Live Activities** har egne HIG-normer: glanceable, ingen knappe-lookalikes, tre presentasjoner i Dynamic Island, ren forgrunn uten bakgrunnsbilder (developer.apple.com/news, Swiggy Design).

**Kobling til hypotesene:** Dette er *nøyaktig* H3-deltatjenestens distribusjonsform («To grader kaldere enn i går — legg til mellomlaget» som varsel/widget/StandBy-kort). Plattformretningen gir H3 ekstern medvind som fase 3-dokumentet ikke kunne kreditere: Apple bygger aktivt infrastrukturen for «aldri åpne appen»-verdi. Samtidig er dette Babyoras svakeste tekniske flanke — Capacitor gir ikke WidgetKit/ActivityKit gratis; et native Swift-lag (eller community-plugin) kreves. Hvis H3 vinner fase 8-porten, blir dette arkitekturbeslutning, ikke detalj. Merk også: Live Activities-formatet («tidsavgrenset aktivitet med start/slutt») passer *turen* perfekt — gyldighetsvindu på hvert svar (B12) kan uttrykkes som en Live Activity med utløp, en mer idiomatisk form enn et vindu inne i appen.

## 3. Apple Design Awards 2025–2026: hva vinnerne beviser

**2026-vinnere med direkte relevans** (apple.com/newsroom, developer.apple.com/design/awards):

- **Moonlitt: Moon Phase Tracker** (Interaction-vinner) — naturdata-verktøy i samme sjanger-familie som Babyora: én datastrøm (månen) gjort glanceable via Home Screen-, Lock Screen-, Watch- og **StandBy-widgets pluss Live Activities**, med «best-in-class» Liquid Glass-integrasjon. Beviset: et lite verktøy vinner på *distribusjonsbredde over systemflater*, ikke på flere skjermer i appen. Dette er H3s eksistensbevis i miniatyr.
- **Tide Guide: Charts & Tables** (Visuals and Graphics-vinner, også Interaction-finalist) — utendørs værbetinget beslutningsverktøy (når kan jeg gå ut på fjæra?). Nøkkelgrepet: **paletten adapterer til himmelens faktiske farge gjennom dagen** — lys i dagslys, mørk om natten. Dette er den sterkeste eksterne datapunkten mot Babyoras dark-first-vedtak: sjangerens beste utøver velger *kontekststyrt* lys, ikke fast mørk.
- **Sago Mini Jinja's Garden** (Interaction-vinner, barn) — karakterdrevet, taktil interaksjon vinner *i barnesegmentet*. Merk skillet: Babyoras brukere er søvndepriverte voksne, ikke barn. Ingen 2025/2026-vinner i verktøy/helse-kategoriene bruker maskot mot voksne.
- **grug** (Delight and Fun) — «daglig visdom»-mikroformat; viser at ett-kort-om-dagen-produkter kan bære premium-følelse.

**2025-vinnere** (apple.com/newsroom 2025, TechCrunch): **Speechify** (Inclusivity — VoiceOver + **Dynamic Type** som kjernekvalitet), **Train Fitness** (CoreMotion/CoreML-tilgjengelighet), **CapWords** (læring via hverdagsobjekter), **Evolve** (helse, trygg tone). Mønsteret over begge årganger: **tilgjengelighet er premiert konkurransekraft, ikke compliance**, og vinnerverktøyene er smale, dype og system-integrerte.

## 4. Material 3 Expressive som kontrastfolie

M3 Expressive (mai 2025) er Googles mest researchede oppdatering noensinne: 46 studier, 18 000+ deltakere (design.google, supercharge.design). Funnene som betyr noe for Babyora:

- Ekspressive skjermer lot brukere finne nøkkelelementer **opptil 4× raskere** — fordi ekspressivitet i M3-forstand primært er *skjerpet hierarki*: én dominant form/handling per skjerm, resten demotert.
- Ekspressiv design skåret høyere på **opplevd modernitet og troverdighet** — lekenhet og tillit er ikke motsetninger *når hierarkiet holder*.
- Men: M3E er kalibrert for merkevare-emosjon i konsumentapper; Dezeen-dekningen kaller det «wild and way-too-playful». For et helsenært forskrivningsprodukt er dosen feil selv om mekanismen er riktig.

**Lærdom for Monter:** fase 3-rivningen fant at Babyoras resultatflate «flater kritisk med trivielt» (A20/A21). M3E-forskningen gir ekstern støtte til nøyaktig den prioriteringen: én visuelt dominant beslutningsbærer per skjerm er målbart bedre — adopter *mekanismen* (dominans-hierarki), forkast *tonen* (leken maksimalisme).

## 5. Fokusområdene mot Monter-doktrinen

### Onboarding: progressive disclosure er normen
HIG-normen er entydig: kort onboarding (≤3 skjermer), skippbar, **verdi før datainnsamling**, konto/oppsett etter første suksessøyeblikk (HIG patterns, designstudiouiux). Fase 3-forslaget om 2-felts onboarding (R6) er altså i takt med plattformnormen. **Navn-først-onboardingen (premiss 13) avviker fra normen** — HIG-logikken sier at beslutningskritiske felt (ull-toleranse, kontekst) eller null-input («vis meg et svar først») er idiomatisk riktig. H2-routerens «spør etter situasjonen, ikke barnets navn» er faktisk den mest HIG-idiomatiske av de tre modellene: intent-first er nøyaktig App Intents-æraens mønster.

### Navigasjon: tab bar består, men krymper
HIG beholder tab-baren som toppnivånorm, men iOS 26 gjør den mindre påtrengende (flytende, minimeres ved scroll). To konsekvenser: (a) R2 (fjerne Planlegg-fanen til fordel for kort+varsel) er i takt med retningen «færre, renere seksjoner»; (b) en én-flate-modell (H2/H3) er *ikke* et HIG-brudd — Moonlitt og grug viser at smale verktøy uten dyp navigasjon premieres. Babyoras tab-chassis (utfordret i A-serien) bør re-prøves per produktmodell, ikke arves.

### Motion og haptikk: formål, retning, ærlighet
Monters bevegelseskontrakt («ut raskere enn inn», «markøren lander», maskinhåndhevet) er *foran* bransjenorm — dette er i takt med vilje. To avvik: (1) **3,2 s-seremonien** står mot HIG-prinsippet om at motion aldri skal iscenesette ventetid en øyeblikkelig operasjon ikke har — kunstig latens er en fallende praksis, og R1 har nå ekstern støtte; (2) `neck-orb-pulse infinite` (VarmEllerKaldScreen.tsx:384) bryter både egen doktrine og reduced-motion-ånden — allerede BLOKKERER i manifestet. Haptikk-normen (sparsom, betydningsbærende) er udekket i Monter: doktrinen har ingen haptikk-kontrakt i det hele tatt, et hull hvis Kle på-stepperen skal føles native.

### Tilgjengelighet: Dynamic Type er det åpne såret
Reduced motion: global killswitch + 12 per-fil-blokker — i takt, over norm. Kontrast: målte OKLCH-verdier, forbud mot opacity-tekst, to fokusringer — i takt, over norm. **Men typeskalaen (13/16/19/23/28 + hero 76) er fast px uten Dynamic Type-respons.** App Store-review flagger nå tekst som ignorerer Dynamic Type, og to av tre siste ADA-Inclusivity-vinnere har det som kjernekvalitet. For søvndepriverte foreldre i dagslys er justerbar tekststørrelse ikke nice-to-have. Dette er et **avvik ved uhell** — doktrinen har bare aldri adressert det. WebView gjør `font: -apple-system`-dynamikk vanskeligere, men `rem`-basert skala + oppfanget systempreferanse er mulig.

### Lys/mørk for utendørsapper: dark-first står mot bruksmiljøet
Ekstern praksis er samstemt: lys modus vinner lesbarhet i dagslys/utendørs; anbefalingen for mobile utendørsbrukere er AAA-kontrast på kritisk tekst og *kontekstvalg av modus* (uxgen.academy, dogtownmedia). Tide Guide — sjangervinneren — lar himmelens faktiske lys styre paletten. Babyoras beslutningsøyeblikk er (per 03-user-reality/fase 3) ofte i gangen ved dagslys eller ute. **Dark-first er et avvik med vilje (eiervedtak) som fase 3-rivningen allerede har utfordret mot eierens eget dagslys-rasjonale — ekstern evidens forsterker utfordringen.** Monter har en kalibrert, maskinhåndhevet lys modus (lys-symmetri-testen), så kostnaden ved å snu default eller gjøre den kontekststyrt (klokkeslett/lyssensor) er lav. Dette bør inn som eksplisitt testpunkt før fase 8-porten, koblet til premiss 11/vedtakslisten i §4 av 04-dokumentet.

## 6. Samlet dom over Monter-doktrinen

**I takt (behold og vær stolt av):** håndhevede tokens med målt begrunnelse; dybdekontrakt/flatefamilier (samme logikk som Liquid Glass' lagdeling, egen materialisering); reduced-motion-regime; kontrastdisiplin over Apples egen glass-praksis; «ut raskere enn inn»-motion; 44px-gulv og fokusringer.

**Avvik med vilje (legitime, men re-prøv mot bevis):** dark-first (nå med ekstern motvind fra utendørspraksis og Tide Guide); egen-fonter fremfor systemfont (ADA-vinnere går begge veier — dette er forsvarlig identitet, men det *uforlikte* dobbeltvedtaket A2 vs. Monter må forlikes); egen materialitet i stedet for plattformmaterial (riktig så lenge WebView er chassiset).

**Avvik ved uhell (hull doktrinen aldri har adressert):** ingen Dynamic Type-strategi; ingen haptikk-kontrakt; ingen systemflate-doktrine (widgets/Live Activities/StandBy er fraværende i Monter-vokabularet — kritisk hvis H3 vinner); 3,2 s-seremonien og infinite-pulsen som motion-ærlighetsbrudd; Fraunces-regelen brutt i 7+ skjermer (dokumentert gjeld, ikke uenighet).

**Konsekvens for H1/H2/H3:** Ekstern retning gir H3 sterkest plattformmedvind (systemflate-æraen) og H2 sterkest idiomatisk medvind (intent-first), mens H1s fulle appdestinasjon med tab-chassis er den modellen plattformen gjør minst for å styrke. Ingen av delene er brukerbevis — matrisen har fortsatt 0/35 celler — men det justerer teknisk risikoprofil: H3 krever native lag oppå Capacitor og bør kostnadssettes i fase 10, ikke oppdages der.

## TRENDTABELL
| Trend | Klassifisering | Beslutning | Begrunnelse |
|---|---|---|---|
| Liquid Glass / iOS 26-designspråket (translusent materiale, content-first krom) | etablert | adapt | Prinsippene (lagdelt hierarki, krom som viker for innhold, materiale kun på interaksjonslaget) er allerede Monters egen logikk med espresso/petrol-flatefamilier og dybdekontrakt — adopter prinsippene eksplisitt i doktrinen. Selve glasseffekten forkastes: Capacitor/WebView kan ikke få ekte systemmateriale, og CSS-imitasjon ville være overflate-kopi med dokumentert lesbarhetskost som Monters kontrastdisiplin allerede er bedre enn. Gjelder alle tre hypoteser likt. |
| Systemflate-distribusjon: widgets, Live Activities, StandBy, låst skjerm | etablert | adopt | Dette ER H3-deltatjenestens distribusjonsform, og Moonlitt (ADA 2026 Interaction-vinner) beviser at et smalt naturdata-verktøy vinner nettopp på widget/StandBy/Live Activity-bredde. Live Activity med utløp er dessuten en mer idiomatisk form for gyldighetsvinduet (B12) enn et vindu i appen. Krever native Swift-lag oppå Capacitor — må kostnadssettes før fase 8-porten hvis H3 står, ikke oppdages i fase 10. |
| Intent-first inngang (App Intents: brukerintensjon foran UI) | fremvoksende | adopt | Apples hele 2025–26-retning (App Intents mater Siri/Spotlight/widgets/Apple Intelligence) er strukturelt identisk med H2-routeren: første flate spør etter situasjonen, ikke identiteten. Gir H2 ekstern idiomatisk støtte og betyr at routerens fire innganger bør designes så de senere kan eksponeres som intents — samme enhet, mange flater. |
| Progressive disclosure-onboarding: verdi før datainnsamling | etablert | adopt | HIG-normen (≤3 skjermer, skippbar, suksessøyeblikk før konto/oppsett) sammenfaller med fase 3-forslaget R6 (2-felts onboarding) og svekker navn-først-vedtaket (premiss 13, ÅPEN) ytterligere: beslutningskritiske felt eller null-input er idiomatisk riktig rekkefølge. A/B-testen i fase 9 består, men normen flytter bevisbyrden til navn-først-siden. |
| Content-first navigasjon: tab-bar som minimeres, færre og renere seksjoner | fremvoksende | adapt | iOS 26 beholder tab-baren som norm men gjør den vikende — og ADA-vinnerne viser at smale én-flate-verktøy premieres. Støtter R2 (Planlegg-fanen → kort+varsel) og betyr at tab-chassiset (utfordret i A-serien) ikke skal arves inn i H2/H3 av vane. Adapt, ikke adopt: WebView har ikke native minimeringsatferd, så Babyora må velge færre faner fremfor å imitere scroll-krymping. |
| Adaptiv lyspalett styrt av faktisk lyskontekst (Tide Guide-mønsteret) | fremvoksende | reinvent | Utendørspraksis er samstemt om lys modus i dagslys, og sjangervinneren Tide Guide lar himmelens lys styre paletten. Babyoras beslutningsøyeblikk er dagslys/utendørs, så dark-first (eiervedtak, premiss 11-klyngen) står mot bruksmiljøet — men Monter har allerede en maskinhåndhevet, symmetrisk lys modus, så en kontekststyrt default (klokkeslett/soloppgang styrer modus, manuell overstyring består) er en billig reinvention som bevarer merkevarens mørke identitet om kvelden. Testpunkt før fase 8-porten, ikke stille vedtak. |
| Tilgjengelighet som premiert konkurransekraft: Dynamic Type, VoiceOver, reduced motion | etablert | adopt | To årganger ADA-Inclusivity-vinnere (Speechify, Train Fitness) og App Store-review-praksis gjør Dynamic Type til de facto krav. Monter er over norm på reduced motion og kontrast, men typeskalaen er fast px uten Dynamic Type-respons — et avvik ved uhell doktrinen aldri har adressert. Rem-basert skala + oppfanget systempreferanse må inn i doktrinen uavhengig av hvilken hypotese som vinner; for søvndepriverte foreldre i dagslys er dette kjerneverdi, ikke compliance. |
| Ekspressivt dominans-hierarki (Material 3 Expressive: én dominant form per skjerm) | fremvoksende | adapt | Googles 46-studiers research (18 000+ deltakere) viser opptil 4× raskere lokalisering av nøkkelelementer og økt opplevd troverdighet når én handling/form dominerer skjermen — ekstern støtte til fase 3-funnet A20/A21 om at resultatflaten flater kritisk med trivielt. Adopter mekanismen (autoritær, dominant plaggliste med demotert sekundærinnhold) i alle tre hypoteser; forkast tonen (leken maksimalisme) som feil dose for et helsenært forskrivningsprodukt. |
| Iscenesatt latens / seremoniell beregningsteater | fallende | reject | HIG-normen er ærlig respons: motion skal aldri gi en øyeblikkelig operasjon kunstig ventetid, og ingen ADA-vinner 2025–26 bruker fake-beregning som tillitsgrep. 3,2 s-seremonien (låst eiervedtak, premiss 11, ÅPEN) får dermed ekstern motvind i tillegg til R1-fjerningskandidaturet — behold en ærlig, rask transisjon med Monters bevegelseskontrakt, mål skip-rate hvis eier vil beholde den til fase 8-porten. |
| Maskot/karakterdrevet UI i familiesegmentet | etablert | adapt | Karakterdrevet interaksjon vinner ADA — men kun i barnesegmentet (Sago Mini, målgruppe: barnet selv). Ingen 2025/2026-vinner i verktøy/helse mot voksne bruker maskot, og Babyoras bruker er en søvndeprivert voksen i et beslutningsøyeblikk. Støtter R5: reduser til én statisk positur som avsender-signatur, ikke bevegelsesapparat; full tillitsmåling maskot vs. faglig avsender (premiss 11) består som porten. |
| Haptikk som betydningsbærende, sparsom bekreftelse | etablert | adopt | HIG-normen er sparsom, konsistent haptikk knyttet til betydning (bekreftelse, grenser) — Monter har i dag ingen haptikk-kontrakt overhodet, et hull ved uhell. Capacitor Haptics-plugin gjør dette billig; relevant særlig for Kle på-stepper og eventuelle widget-handlinger i H3. Doktrinen bør få en haptikk-blokk med samme håndhevingslogikk som bevegelseskontrakten. |

## KILDER
- https://www.apple.com/newsroom/2026/06/apple-reveals-winners-of-the-2026-apple-design-awards/
- https://developer.apple.com/design/awards/
- https://www.apple.com/newsroom/2025/06/apple-unveils-winners-and-finalists-of-the-2025-apple-design-awards/
- https://techcrunch.com/2025/06/04/apple-names-2025-design-awards-winners/
- https://developer.apple.com/design/human-interface-guidelines
- https://www.createwithswift.com/liquid-glass-redefining-design-through-hierarchy-harmony-and-consistency/
- https://www.learnui.design/blog/ios-design-guidelines-templates.html
- https://letsdev.de/en/blog/ios-26-in-detail-liquid-glass-ui-between-usability-and-accessibility
- https://www.donnywals.com/exploring-tab-bars-on-ios-26-with-liquid-glass/
- https://www.createwithswift.com/making-the-tab-bar-collapse-while-scrolling/
- https://developer.apple.com/design/new-design-gallery-2026
- https://developer.apple.com/documentation/appintents
- https://developer.apple.com/videos/play/wwdc2025/244/
- https://blakecrosley.com/blog/ios-26-widget-and-control-surface
- https://developer.apple.com/news/?id=bkm73839
- https://medium.com/swiggydesign/designing-with-constraints-live-activity-and-dynamic-island-71271c454bcb
- https://design.google/library/expressive-material-design-google-research
- https://supercharge.design/blog/material-3-expressive
- https://www.dezeen.com/2025/05/28/google-ushers-in-age-of-expressive-interfaces-with-material-design-update/
- https://www.flippinghues.com/moonlitt
- https://apps.apple.com/us/app/tide-guide-charts-tables/id1406371071
- https://www.macrumors.com/2026/06/02/apple-design-award-winners-2026/
- https://www.designstudiouiux.com/blog/mobile-app-onboarding-best-practices/
- https://uxgen.academy/learn-how-to-build-light-mode-ux-that-looks-good-in-day-night/
- https://www.dogtownmedia.com/dark-mode-vs-light-mode-in-mobile-app-design-finding-the-right-balance/
- C:/Users/siver/Downloads/trainer-marketplace-master1/babyora/docs/design-lab/04-challenge-the-brief.md
- C:/Users/siver/Downloads/trainer-marketplace-master1/babyora/docs/design-lab/premisslogg.md
- C:/Users/siver/Downloads/trainer-marketplace-master1/babyora/docs/design-lab/appendix/fase1/designsystem.md