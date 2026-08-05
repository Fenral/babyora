# Fase 4-research: Installasjonsutløsere og distribusjonsformer

**Område:** Hvordan foreldre-/hverdagsapper faktisk anskaffes, og hvilke distribusjonsformer som finnes utover full app-installasjon. Vurdert mot H1 (første-sesong-forskrivning), H2 (beslutningsrouter) og H3 (delta-tjeneste via varsel/widget), og mot Capacitor-arkitekturen.

---

## Del 1 — Hvordan foreldreapper faktisk anskaffes

### 1.1 Helsestasjonskanalen er Norges sterkeste distribusjonsmaskin — og den er politisk betent

Nørs-casen er det viktigste enkeltfunnet: **101 norske kommuner anbefaler appen, ~85 % av førstegangsfødende bruker den, 200 000+ registrerte brukere**. Forretningsmodellen er invertert mot Babyoras: *kommunen* betaler (5 kr/mnd per aktiv bruker, 750–7 500 kr tak), appen er gratis for foreldre, og helsestasjonen publiserer eget innhold gratis i den. I Grünerløkka bydel bruker «nesten alle gravide» Nørs, og en tredjedel av partnerne er aktive brukere (relevant for aktør-matrisens partner-rad, som i dag er blank).

Men: Rådet for sykepleieetikk mener helsesykepleiere **ikke skal medvirke til markedsføring** av kommersielle apper, og Nørs+ (44 kr/mnd premium) kritiseres som «snikinnføring av betaling» i en gratis helsetjeneste. Konsekvens for Babyora: **hard paywall etter én anbefaling er trolig diskvalifiserende for helsestasjonskanalen.** Et produkt som vil inn dit må enten være gratis for forelderen (kommunebetalt à la Nørs) eller holde seg utenfor kanalen. Dette er direkte bevismateriale til premiss 6 i premissloggen.

Stavanger kommunes helsestasjon anbefaler for øvrig kun offentlige/ideelle kilder (Helsenorge, Foreldrehverdag, Ammehjelpen osv.) — kanalens gate er faglig avsender, ikke UX-kvalitet.

### 1.2 Anskaffelsesøyeblikket ligger FØR behovet — i graviditeten

Markeds- og JMIR-forskning på gravid-/barselapper viser et veldefinert nedlastingsvindu: **positiv graviditetstest / første svangerskapskontroll**. Gravide utgjør ~38,6 % av foreldreapp-markedet, og gravidapper (BabyCenter 400M+, Pregnancy+ 80M+) konverterer automatisk til «baby-modus» etter fødsel — de eier brukeren før konkurrentene finnes. Word-of-mouth skjer i barselgrupper, venteværelser og foreldrefora; JMIR-studier viser at anbefaling fra andre mødre og personvern-omdømme styrer valget.

Konsekvens: Babyoras naturlige installasjonsutløser («første kalde dag med barnet») kommer **etter** at Nørs/Babyverden allerede sitter på hjemskjermen. H1s «første sesong» må enten fange brukeren i graviditeten (med et pre-fødsel-verdiforslag appen i dag ikke har) eller vinne et senere, skarpere øyeblikk: **hjemreisen fra sykehuset i kaldt vær, første trilletur, første kuldeperiode** — som matcher fase 2-motkandidatene til «første vinter».

### 1.3 ASO: søk er hovedkanalen, og den norske nisjen ser åpen ut

Apple oppgir at **65 % av App Store-nedlastinger følger et søk** (58 % på Google Play). I norsk App Store finnes ingen synlig konkurrent på selve påkledningsjobben — treffbildet domineres av innholdsapper (Babyverden, Babyhjelpen, Nørs) og redaksjonelle artikler (Babyverden, Småungene, Reima, Naturkompaniet) som eier «hvordan kle barnet»-søk på nett. Nisjeord som «kle barnet etter været» er ubesatt i App Store, men søkevolumet er umålt — samme bevisstatus som premiss 2 («3–8 åpninger/dag»): skal ikke siteres som fakta før målt.

### 1.4 Kjøpsøyeblikket for klær er en dokumentert distribusjonsflate

Reima (finsk barneklærmerke) driver en app hvis kjernefunksjon er **værbaserte påkledningsråd for barn** — født som «Reima Weather», nå koblet til shopping og lojalitet. Det beviser to ting: (a) vær-til-antrekk for barn er en levedyktig produktkategori noen allerede subsidierer med klessalg, (b) vinterdress-kjøpet er et anskaffelsesøyeblikk (QR i butikk/på hengelapp). Weather Fit, Daily Dress Me og iDress for Weather viser samme jobb for voksne/skolebarn — ingen av dem eier den norske 0–24 mnd-nisjen.

### 1.5 Institusjonsdistribusjon (barnehageapper) er tvangs-installasjon — men først fra ~12 mnd

Vigilo, Kidplan, MyKid m.fl. distribueres ved at institusjonen pålegger installasjon. Kanalen er uaktuell for 0–12 mnd (ingen institusjon finnes), men barnehagestart ~12 mnd er et strukturelt anskaffelsesøyeblikk som B11 (pakkeliste) kan hekte seg på senere. Ikke en inngangskile.

---

## Del 2 — Alternative distribusjonsformer

### 2.1 Delt weblenke / handoff-kort (Partiful-modellen)

Partiful beviser modellen: **én delbar lenke, ingen konto, ingen installasjon for mottakeren** — mottakeren får full verdi i nettleseren, og avsenderen er distribusjonskanalen. Dette er nøyaktig formen B4 (handoff-kortet) trenger: primærforelder deler dagens vurdering til partner/besteforelder som aldri installerer noe. Viralloop-litteraturen (Andrew Chen m.fl.) bekrefter at lenke-per-bruksøyeblikk er den sterkeste organiske loopen for hverdagsprodukter. Capacitor-fordel: web-builden finnes allerede — et statisk, tidsstemplet «vurderingskort» på en URL er nær null ny arkitektur og bryter ikke lokal-first (kortet er et øyeblikksbilde, ikke synk). Krav: kortet må ligge **utenfor paywallen**, ellers dør loopen ved første klikk.

### 2.2 PWA som primærdistribusjon

iOS-realiteten 2025/26: ingen `beforeinstallprompt`, manuell «Legg til på Hjem-skjerm», push kun etter installasjon+samtykke, og **cache-eviction ved lengre inaktivitet** — som treffer et pulsprodukt (brukes i kuldeperioder, sover om sommeren) spesielt hardt. Repoets premiss 10 flagger allerede WebView-storage-risikoen. PWA er riktig som *mottaksflate* for delte kort (2.1), feil som primær distribusjonsform for et produkt som lover varsler og widget.

### 2.3 App Clips / Instant Apps

Google Play Instant **legges ned desember 2025** pga lav adopsjon; App Clips har aldri fått bred utbredelse, selv om enkeltcase viser sterk effekt (340 % konverteringsløft i retail-QR-kontekst). For Babyora: en App Clip er teknisk en dårlig match med Capacitor (krever lettvekts native target, WebView-bundelen passer dårlig i størrelsesbudsjettet), og bruksmønsteret (rask, transaksjonell, stedbundet) matcher bare ett scenario: QR-plakat/hengelapp som gir én gratis vurdering uten installasjon. Det scenariet dekkes billigere av en weblenke (2.1).

### 2.4 Widget-først

Locket (80M nedlastinger, «widgeten ER produktet», 2M signups på to uker via TikTok) og Widgetsmith (50M+) beviser at en widget kan bære hele produktidentiteten. Men presedensen har en kritisk nyansering for H3: **widgeten fjerner ikke installasjonen — den forutsetter den.** Locket vokste fordi *venner inviterte venner til å installere* (lenke-loop), ikke fordi widgeten senket anskaffelsesfriksjon. Widget-først endrer altså **dagsflaten og retention**, ikke akkvisisjonen. H3s formulering «utfordrer selve app-installasjonen som premiss» holder derfor bare for varsels-/lenkedelen, ikke widgetdelen.

Capacitor-status: `capacitor-widget-bridge` og `@capgo/capacitor-widget-kit` gir databro (shared UserDefaults/Preferences + timeline-refresh), men **widget-UI må skrives native** (SwiftUI/WidgetKit på iOS, RemoteViews på Android). Delta-innholdet i H3 («to grader kaldere — legg til mellomlaget») er derimot ideelt widget-innhold: liten tilstand, få tegn, deterministisk motor som allerede er en ren funksjon.

### 2.5 Værutløste varsler

Benchmarks 2025: iOS-opt-in ligger på **~56 % snitt, ~52 % for vær/utility** — dvs. nær halvparten av brukerne vil aldri se et H3-produkt som kun lever i varselet. Samtidig er retention-effekten dokumentert sterk (Airship, 63M brukere: 3x retention med push første 90 dager; ukentlige varsler ga 440 % høyere retention). Konklusjon: værutløste delta-varsler er en dokumentert sterk *retention- og verdileveranse-mekanisme*, men en **umulig eneste flate** — H3 trenger en fallback (widget eller hjemkort) for de ~45–50 % som avslår push.

### 2.6 iMessage/WhatsApp-kort

Ingen dokumentert suksess for iMessage-app-extensions som distribusjonsform; kanalen i Norge er fragmentert (Messenger/WhatsApp/SMS deler markedet, iMessage-andelen følger iPhone-andelen). Riktig form er ikke en meldingsapp-extension, men **native share-sheet med rikt lenkekort** (OG-preview av vurderingen) — som allerede er B4s spesifikasjon og fungerer identisk i alle meldingskanaler.

### 2.7 Nullmodellen skjerpes av distribusjonsblikket

Yr (NRK/Meteorologisk institutt) er gratis, faglig autoritativ og de facto forhåndsinstallert vane i norske husholdninger. Enhver distribusjonsform Babyora velger konkurrerer ikke mot andre babyapper om installasjonen — den konkurrerer mot **å ikke installere noe** (Yr + ni-ords-regelen + melding fra partner). Dette bekrefter fase 3-kravet om nullmodell i prototypetesten.

---

## Del 3 — Syntese mot H1/H2/H3

| Form | H1 forskrivning | H2 router | H3 delta |
| --- | --- | --- | --- |
| Helsestasjonskanal | Sterk match (første-sesong = helsestasjonens målgruppe), men hard paywall blokkerer | Nøytral | Svak (kanalen anbefaler apper, ikke varsler) |
| Graviditetsvindu | Krever pre-fødsel-verdi som ikke finnes | Routeren kan ha en gravid-inngang («snart hjemreise») | Svak |
| ASO/søk | Sterk («kle barnet»-søk er forskrivningsspråk) | Middels | Svak (ingen søker etter et varsel) |
| Delt lenke/kort | Retention, ikke akkvisisjon (fase 3-funn står) | **Sterkest**: handoff-inngangen ER et kort | Sterk: deltaet er kortets innhold |
| PWA | Feil primærform | Mottaksflate for kort | Feil (push/widget-krav) |
| App Clips | Nei | Nei (weblenke billigere) | Nei |
| Widget | Sekundærflate | Sekundærflate | **Kjerneflate**, men forutsetter installasjon |
| Værutløst varsel | Re-engasjement ved værskifte | Trigger inn i routeren | Kjerneflate, men ~50 % opt-in-tak |

**Tre funn som bør inn i premissloggen:**
1. **Hard paywall vs. distribusjonsform er en reell konflikt** (premiss 6): paywallen blokkerer helsestasjonskanalen (gratisprinsipp-debatten), dreper lenke-loopen (mottaker møter vegg) og undergraver H3 (verdi må leveres utenfor app-åpning). Kommunebetalt modell à la Nørs er en dokumentert motkandidat til forbrukerabonnement.
2. **H3s installasjonspåstand må presiseres:** widget forutsetter installasjon (Locket-presedensen); det H3 faktisk eliminerer er daglig *åpning*. Kun lenke/varsel-delen utfordrer installasjonen.
3. **Anskaffelsesvinduet ligger i graviditeten** hos dagens vinnere; Babyoras alternative vindu (første kuldeeksponering) er skarpere men senere — dagbokstudien bør kode *når* husholdningen sist installerte en baby-app og hvorfor.

**Capacitor-konsekvens:** lenkekort (web-build gjenbrukes) og push (eksisterer) er nær gratis; widget krever native SwiftUI/RemoteViews via bro-plugin (moderat, dokumentert); App Clips er arkitektonisk dyrt og forkastes.

## TRENDTABELL
| Trend | Klassifisering | Beslutning | Begrunnelse |
|---|---|---|---|
| Helsestasjons-/kommunekanal som distribusjon (Nørs-modellen: kommunen betaler, forelderen får gratis) | etablert | adapt | Norges sterkeste kanal for H1s målgruppe (101 kommuner, ~85 % av førstegangsfødende på Nørs), men gratisprinsipp-debatten gjør hard paywall diskvalifiserende i kanalen. Tas inn som motkandidat til premiss 6: kommunebetalt/gratis basisnivå hvis kanalen skal brukes; ellers holdes produktet bevisst utenfor kanalen. Ikke adopt: Babyora har ikke faglig avsender-legitimitet ennå (premiss 4/5 åpne). |
| Graviditets-nedlastingsvinduet (anskaffelse før behovet, konvertering etter fødsel) | etablert | adapt | Dagens vinnere (BabyCenter, Pregnancy+, Nørs) eier brukeren fra positiv test. Babyora skal ikke bygge gravidapp (feil jobb), men H1/H2 bør teste «hjemreise fra sykehus / første trilletur» som eget senere vindu, og dagbokstudien bør kode når husholdningen faktisk installerte sine baby-apper. Kobles til fase 2-motkandidatene til «første vinter». |
| ASO/søk som dominerende anskaffelseskanal (65 % av App Store-nedlastinger følger søk) | etablert | adopt | Grunnhygiene uansett hypotese; den norske påkledningsnisjen ser ubesatt ut i App Store (kun innholdsapper og redaksjonelle artikler eier «kle barnet»-søk). Forbehold i premisslogg-ånd: norsk søkevolum på nisjeordene er umålt og skal ikke siteres som fakta før verifisert med ASO-verktøy. Sterkest for H1 (søkespråket er forskrivningsspråk), svakest for H3. |
| Lenke-først/no-install-distribusjon (Partiful-modellen: delbart kort uten konto eller app for mottaker) | etablert | adopt | Direkte match med B4 (handoff-kortet) og H2s «noen andre skal passe barnet»-inngang; deltaet i H3 er ideelt kortinnhold. Nær null ny arkitektur i Capacitor (web-builden finnes, kortet er statisk øyeblikksbilde — bryter ikke lokal-first). Hardt krav: kortet må ligge utenfor paywallen, ellers dør loopen ved mottakerens første klikk. Bygges som falsifiseringsinstrument per fase 3-vedtaket (20–25 % per kvalifisert handoff). |
| PWA som primær distribusjonsform på iOS | fallende | reject | Ingen install-prompt på iOS, manuell Add to Home Screen, push kun etter installasjon, og cache-eviction ved inaktivitet — dødelig for et pulsprodukt som sover om sommeren (forsterker premiss 10-risikoen repoet alt har flagget). Beholdes kun som mottaksflate for delte kort (mottakeren trenger aldri installere), ikke som distribusjonsstrategi for H1/H2/H3. |
| App Clips / Instant Apps som installasjonsfri prøvesmak | fallende | reject | Google Play Instant legges ned des. 2025 pga lav adopsjon; App Clips har enkeltsuksesser i sted-/transaksjonskontekst men aldri bred utbredelse. Arkitektonisk dyr mismatch med Capacitor (krever lettvekts native target, WebView-bundle sprenger budsjettet). Det eneste relevante scenariet (QR på helsestasjonsplakat/hengelapp → én gratis vurdering) dekkes billigere av en delt weblenke. |
| Widget-først: widgeten som produktets primærflate (Locket, Widgetsmith) | etablert | adapt | Presedensen beviser at en widget kan bære produktidentiteten — men også at den IKKE fjerner installasjonen (Locket vokste via invitasjonslenker + TikTok, widgeten forutsetter installert app). H3 må derfor presiseres: widgeten eliminerer daglig åpning, ikke installasjon. Deltainnholdet er ideelt widget-innhold (liten tilstand, deterministisk motor). Capacitor-kost er moderat og dokumentert (capacitor-widget-bridge/Capgo widget-kit), men widget-UI må skrives native i SwiftUI/RemoteViews. |
| Værutløste/kontekstuelle varsler som verdileveranse (delta-varselet) | etablert | adapt | Dokumentert sterkeste retention-mekanisme (3x retention med push første 90 dager; vær/utility-kategorien har best innholdsmatch), og nøyaktig H3s form. Men iOS-opt-in på ~52–56 % setter et hardt tak: nær halvparten av brukerne ser aldri et varselbasert produkt. Adopt for H3s leveranse, men H3 kan ikke være varsel-ONLY — krever widget/hjemkort-fallback. For H1 brukes formen som re-engasjement ved værskifte (matcher fingerprint-cachens egen puls-logikk). |
| iMessage-/meldingsapp-extensions som distribusjonsflate | fallende | reject | Ingen dokumentert suksess for extension-formen, og det norske meldingsmarkedet er fragmentert (Messenger/WhatsApp/SMS). Jobben løses kanaluavhengig med native share-sheet + rikt OG-lenkekort — som allerede er B4s spesifikasjon og fungerer i alle meldingsapper uten egen extension-kodebase. |
| Kjøpsøyeblikk-distribusjon via barneklær-retail (Reima-modellen: vær-til-antrekk subsidiert av klessalg) | fremvoksende | reinvent | Reima beviser kategorien (værbaserte påkledningsråd for barn) og at vinterdress-kjøpet er et anskaffelsesøyeblikk — men modellen deres binder rådet til egen merkevare, som kolliderer med Babyoras nøytralitet og tone-doktrine. Reinvent: merkenøytral QR/lenke ved kjøpsøyeblikket (butikk, hengelapp, bruktmarked) som utløser H1-onboarding «første sesong starter nå», uten produktbinding. Testbar uten partneravtale via barselgruppe-seeding. |
| Institusjonspålagt installasjon (barnehageapp-modellen Vigilo/Kidplan) | etablert | reject | Kanalen finnes ikke for 0–12 mnd (ingen institusjon før barnehagestart ~12 mnd), og fase 3 har allerede avgrenset barnehage til pakkejobben B11. Beholdes kun som notat for ekspansjonshypotesen S4 — ikke en inngangskile, og instruksjon av personale er eksplisitt ute av scope. |

## KILDER
- https://sykepleien.no/2025/01/gratisprinsippet-i-helsetjenesten-trues-av-kommersielle-apper-som-nors
- https://www.stavanger.kommune.no/helse-og-omsorg/helsestasjon/
- https://dataintelo.com/report/global-parenting-apps-market
- https://www.jmir.org/2021/9/e27403
- https://mhealth.jmir.org/2022/11/e32757
- https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0318012
- https://link.springer.com/article/10.1186/s12884-024-06959-1
- https://apps.apple.com/no/app/helseoversikt-gravid-foreldre/id1382232674
- https://apps.apple.com/no/app/babyverden-gravid-og-barn/id401129908
- https://apps.apple.com/no/app/babyhjelpen/id6754854299
- https://www.apptweak.com/en/aso-blog/what-is-app-store-optimization-and-why-is-aso-important
- https://www.digitalapplied.com/blog/app-store-optimization-aso-statistics-2026-data
- https://help.partiful.com/hc/en-us/articles/26526377667739-Why-use-Partiful
- https://andrewchen.substack.com/p/braindump-on-viral-loops
- https://www.molfar.io/blog/viral-loops
- https://brainhub.eu/library/pwa-on-ios
- https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide
- https://webscraft.org/blog/pwa-pushspovischennya-na-ios-u-2026-scho-realno-pratsyuye?lang=en
- https://cloudfour.com/thinks/android-instant-apps-are-dead-ios-app-clips-should-follow/
- https://medium.com/@rashadsh/app-clips-in-2025-still-relevant-how-to-build-one-6bbb1cd9cfb8
- https://www.mobiloud.com/blog/what-are-app-clips
- https://www.inc.com/jason-aten/with-over-50-million-downloads-widgetsmith-became-an-overnight-success-12-years-in-making.html
- https://www.david-smith.org/blog/2025/09/18/widgetsmith-at-five/
- https://9to5mac.com/2022/01/13/locket-app-iphone-widgets/
- https://whatastartup.substack.com/p/he-built-an-app-for-his-girlfriend-and-ended-up-having-80-million-total-downloads
- https://techcrunch.com/2025/08/06/photo-sharing-app-locket-is-banking-on-a-new-celebrity-focused-feature-to-fuel-its-growth
- https://www.pushwoosh.com/blog/push-notification-benchmarks/
- https://www.mobiloud.com/blog/push-notification-statistics
- https://www.businessofapps.com/marketplace/push-notifications/research/push-notifications-statistics/
- https://company.reima.com/en/about-reima/innovations
- https://help.reima.com/article/1089-what-is-reima-app
- https://weatherfit.com/
- https://apps.apple.com/us/app/daily-dress-me-what-to-wear/id6447927117
- https://www.commonsensemedia.org/app-reviews/idress-for-weather
- https://github.com/kisimediade/capacitor-widget-bridge
- https://capgo.app/docs/plugins/widget-kit/
- https://medium.com/@kisimedia/how-to-add-widgets-to-your-capacitor-app-ios-android-76fefbea5cb8
- https://vigilobarnehage.zendesk.com/hc/no/articles/360016836160-Vigilo-for-foreldre
- https://www.kidplan.com/en/parents/
- https://en.wikipedia.org/wiki/Yr.no
- https://www.infobip.com/blog/most-popular-messaging-apps-by-country