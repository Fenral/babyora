# MODELL C — «Delta-abonnement» (Fase 6, Challenge the Business)

> Utarbeidet 2026-08-05. Kilder: 05-global-design-research.md (revisjonsblokken), appendix/fase4/abonnement-etikk.md, appendix/fase4/distribusjon-installasjon.md, 04-challenge-the-brief.md, premisslogg.md. Alle tall uten kilde er merket **(hypotese)**. Dette er portmateriale — eier velger; ingenting her er forhåndsvalgt.

## 1. Modellen i én setning

Husholdningen betaler et lavpriset, løpende, auto-fornyende abonnement for å få **endringen levert dit den trengs** — delta-varsler («To grader kaldere enn i går — legg til mellomlaget»), widget/hjemkort og delte vurderingskort — mens appen er konfigurasjons- og fallbackflate, og **alle mottakere av delte kort alltid er gratis** (Partiful-kravet: kortet ligger utenfor paywallen, ellers dør loopen ved første klikk).

Auto-fornyelse er ærlig i akkurat denne modellen fordi verdien leveres kontinuerlig (abonnement-etikk §3 og §7) — i motsetning til H1, der årsplan mot et kjent 4–6 mnd behov er etikkbrudd. Det er modellens etiske fundament, og det står og faller med at leveransen faktisk ER kontinuerlig (se §6 om sovende sesong).

## 2. Overlever modellen H3s tre vilkår?

Revisjonsblokken pkt. 6 setter tre vilkår. Ærlig status per vilkår:

### 2.1 Stale-safe — LØSBART, men som hard designkontrakt, ikke som feature

Utløpt råd på låseskjerm er farligere enn ingen råd. Delta-abonnementet selger nettopp systemflater der innhold kan overleve sin egen gyldighet. Kontrakten som må være absolutt (nulltoleranse, jf. B12 gyldighetsvindu):

- **Hvert delta-utsagn bærer eksplisitt gyldighetsvindu** og følger farevarsel-anatomien (handling → konsekvens → gyldighetsperiode).
- **Widget degraderes aktivt ved utløp**: aldri gammelt plaggråd, men en nøytral «Vurderingen er utdatert — åpne appen»-tilstand. Dette gjelder i ALLE entitlement-tilstander, også betalt.
- **Live Activity kun etter startet/planlagt tur, med utløp** (revisjonsblokkens presisering) — aldri som vedvarende værkort.
- **Delte kort er tidsstemplede øyeblikksbilder** med synlig utløp; etter utløp viser web-mottaksflaten «denne vurderingen gjaldt tirsdag 09–12» — ikke rådet som gjeldende. Kritisk fordi mottakerne (besteforeldre) er de minst kalibrerte brukerne.
- **Offline = siste kjente data med tydelig tidsstempel**, samme degradering etter vinduet.

Stale-safe er en *kostnad* modellen må bære før den kan prises: degraderingslogikken må bygges i native widget-lag på begge plattformer. Men den er løsbar, og den er samtidig modellens potensielle særpreg («lyset skal kommunisere noe sant» — gyldighetshorisont som semantikk).

### 2.2 Plattformparitet — DELVIS LØSBART; modellen kan ikke prises på iOS-eksklusive flater

- Widget finnes på begge plattformer (SwiftUI/WidgetKit + RemoteViews via capacitor-widget-bridge/Capgo — moderat, dokumentert kost, men native UI-arbeid ×2). Skal kostnadssettes FØR fase 8-porten (vedtatt i 05).
- **Live Activities er iOS-only**; Android-ekvivalenten er vedvarende varsel — svakere flate. Konsekvens: Live Activity kan være delight, aldri kjerneverdiløfte i markedsføring eller paywall-tekst.
- **Abonnementspause er native på Google Play, ikke på App Store** — paritetsproblem for den etisk viktige pausemekanismen (§6). På iOS må pause løses som «enkel kansellering + friksjonsfri reaktivering med bevart konfigurasjon», og det må kommuniseres likt.
- Push-adferd, varselkategorier og opt-in-flyt divergerer; entitlement-matrisen (§4) må verifiseres per plattform.

Paritetsregelen for Modell C: **det betalte løftet defineres som «endringen levert utenfor appåpning» (varsel + widget + kort), som kan innfris likt på begge plattformer** — alt plattformspesifikt er bonus.

### 2.3 Selvstendig verdi — MODELLENS SVAKESTE PUNKT, og jeg vil ikke pynte på det

Et delta er meningsløst uten baseline. «Legg til mellomlaget» forutsetter at systemet vet hva barnet hadde på i går, og at brukeren delte den forståelsen. Baseline kan komme fra tre steder:

1. **Fra H1** (forskrivningen etablerte gårsdagens antrekk) → da er H3 avhengig, ikke selvstendig.
2. **Fra brukerbekreftelse** («dette hadde vi på, det funket») → krever verifikasjonsmekanismen som per premiss 5 *ikke engang er kablet ennå* (varm/kald-feedback).
3. **Fra en normativ antakelse** (motoren antar riktig gårsdagsantrekk) → da er deltaet i praksis en komprimert forskrivning, og feil antakelse gir feil delta — en sikkerhetsrisiko, ikke bare en UX-svakhet.

Ærlig konklusjon: **Delta-abonnementet har bare selvstendig verdi hvis baseline-etablering bygges inn som en lettvekts onboarding-handling** (én bekreftet basispåkledning + løpende mikrobekreftelser, B6 etter-turen-mikrosjekk). Det er en reell produktbygging, ikke gratis. Hvis dagbokstudien/prototypen viser at brukere ikke setter eller vedlikeholder baseline (terskel i suksesskriteriene), faller vilkåret — og da faller Modell C som selvstendig produktmodell, jf. §7. Dette skal sies høyt ved porten: **Modell C er den av de tre modellene som er mest avhengig av et ubevist brukeratferdspremiss.**

I tillegg: distribusjonsresearchen fastslår at widget forutsetter installasjon (Locket-presedensen) og at varsler har ~52 % opt-in i vær/utility-kategorien (Pushwoosh/Mobiloud-benchmarks — bransjetall, ikke egne data). H3 kan altså aldri leve i varselet alene; widget/hjemkort-fallback er obligatorisk, og ASO-flaten er svak («ingen søker etter et varsel»). Akkvisisjonen må komme fra delte kort-loopen og fra kombinasjonen med H1-pakken (§5) — Modell C er strukturelt en **retention-sterk, akkvisisjons-svak** modell.

## 3. Gratisnivået — operasjonelt beslutningsminimum (Sols krav)

Regelen: er den konkrete anbefalingen nødvendig for trygg handling, ER den del av gratislaget. En hard block uten handlingsalternativ er juridisk gratis men praktisk ubrukelig. Modell C trekker derfor grensen mellom **pull og push, aldri mellom trygt og utrygt**:

- **Gratis (pull):** åpne appen → full dagens vurdering inkludert komplett sikkerhetslag (hard blocks, TOG-grenser, ut-av-scope-deteksjon) MED den konkrete handlingen som gjør trygg handling mulig. Manuell deling av vurderingskort (loopen skal leve i gratislaget). Mottak av kort: alltid gratis, uten konto/installasjon.
- **Gratis (push, sikkerhet):** delta-varsler som krysser en sikkerhetsgrense («vindkjøling under −10 siden i går — [konkret handling]») sendes ALLE med varsler på, uavhengig av betaling. Sikkerhetsminimum kan ikke ligge bak betaling — og disse varslene inneholder aldri oppsalg, CTA eller premium-referanse (barnets sikkerhet er aldri konverteringsagn).
- **Betalt (push, komfort/bekvemmelighet):** daglige komfort-deltaer, widget/hjemkort, Live Activity på tur, automatisk kortlevering til faste mottakere (f.eks. til partner hver morgen), flere barn/profiler.

Grensen sikkerhets-delta vs. komfort-delta er glidende og må defineres av det faglige scenariokorpuset (premiss 4/5), ikke av konverteringshensyn — dette er en åpen risiko jeg fører i etikk-innvendingene.

## 4. Entitlement-matrise (kravet fra revisjonsblokken pkt. 3)

| Tilstand | Vurdering i app (pull) | Sikkerhetslag + sikkerhetsvarsler | Komfort-deltaer/widget/auto-kort | Delte kort (mottak) | Stale-degradering |
| --- | --- | --- | --- | --- | --- |
| Gratis | Full, med konkret handling | Full | Nei (widget viser nøytral «åpne appen»-tilstand, aldri teaser av skjult råd) | Full | Aktiv |
| Evaluering | Full | Full | Full | Full | Aktiv |
| Betalt | Full | Full | Full | Full | Aktiv |
| Utløpt | Full (= gratis, ingen nedgradering av pull) | Full | Nei; widget degraderes samme dag til nøytral tilstand — aldri frosset gammelt råd | Full | Aktiv |
| Offline | Siste kjente m/ tidsstempel | Hard blocks virker (ren funksjon, lokal-first) | Siste kjente m/ tidsstempel til vinduet utløper | Kort er statiske snapshots — upåvirket | Aktiv, skjerpet |
| Utdatert data | «Utdatert — kan ikke vurdere» + ni-ords-regelen som nødfallback (hypotese: riktig fallback, testes) | Grenser vises fortsatt | Nøytral tilstand | Utløpsbanner | ER tilstanden |

Prinsippet: **kolonnene 2 og 5 og raden «stale-degradering» er invariante** — de endres aldri av betalingstilstand. Bare kolonne 3 er kommersiell.

## 5. Kombinasjon med engangskjøp «første sesong» — JA, og det er modellens sterkeste konfigurasjon

Sesongpasset (ikke-fornyende, 4–6 mnd, Slopes-presedens, App Store-støttet, oppfyller digitalytelseslovens 6-mnd-tak by design) og delta-abonnementet løser **ulike faser av samme læringskurve** og er komplementære, ikke konkurrerende:

- **Første sesong (engangskjøp, ikke-fornyende):** intensivproduktet — full forskrivning + hele delta/widget/kort-laget inkludert. Graduation er designet utfall med ærlig exit.
- **Ved sesongslutt:** eksplisitt, skamfri overgang: «Dere kan dette nå. Vil dere beholde bare endringsvarslene?» → lavpriset løpende delta-abonnement som **vedlikeholdsprodukt etter graduation**.

Dette løser H1s ærligste selvmotsigelse (graduation dreper evig abonnement) uten å gi avkall på løpende inntekt: det som abonneres på etter læring er nøyaktig det som fortsatt har verdi etter læring — endringen, ikke forskrivningen. Deltaet forutsetter kompetanse hos mottakeren; graduerte foreldre er delta-modellens ideelle kunde. Og sesongpasset løser samtidig Modell C's baseline-problem (§2.3): en gjennomført første sesong ETABLERER baselinen deltaet trenger. **Kombinasjonen er derfor sterkere enn Modell C alene** — det skal eier vite når kortene sammenlignes.

Forbehold: kombinasjonen må ikke bli en abonnementsfelle i forkledning. Overgangen sesongpass → abonnement skal være aktivt opt-in (aldri auto-konvertering av et ikke-fornyende kjøp), med totalpris synlig.

## 6. Prislogikk og tall — alle tall er hypoteser til premiss 7-eksperimentet

- **Delta-abonnement: 19–29 kr/mnd (hypotese).** Ankere: under Nørs+ (44 kr/mnd, sykepleien.no) for ikke å konkurrere om «premium babyapp»-posisjonen; lav nok til at kansellering/reaktivering er friksjonsfri beslutning. Premiss 7 (39/99/299) er ÅPEN — Van Westendorp ved porten tester innramminger, ikke bare punkter.
- **Sesongpass «Første sesong»: ~299–399 kr engangs (hypotese)** — testes i samme eksperiment.
- **Totalpris-ærlighet:** 29 kr × 20 mnd ≈ 580 kr > sesongpass. Modellen forplikter seg til å vise forventet totalkost og aktivt anbefale sesongpass når det er billigere for brukerens situasjon — motsatt av mørkt mønster 5 (skjult plan-forvalg).
- **Sovende sesong:** et delta-abonnement som fakturerer gjennom en verdiløs sommer er inntekt fra glemsel i sakte film — samme etiske feil som årsplanen, bare mindre per måned. Mekanisme: **proaktivt pauseforslag** («Det er juni — vil dere pause til høsten? Konfigurasjonen bevares.»). Native pause på Google Play; på iOS som veiledet kansellering + ett-trykks reaktivering. Dette går LENGER enn digitalytelseslovens minstekrav (aktiv-avtale-varsel hver 6. mnd) og er modellens tydeligste etiske differensiering — men det koster bevisst inntekt, og eier skal se den kostnaden: estimert 3–4 sovende måneder/år (hypotese) reduserer effektiv ARPU tilsvarende.
- **Prøvetid:** gratis **evalueringsperiode før kjøp** (IKKE StoreKit-trial, jf. trial-korreksjonen): fullt delta-lag til husholdningen har opplevd to kvalifiserte endringssituasjoner (min. ett værskifte + én verifisert tur), kalendertak 14 dager. Ingen kortinnhenting før kjøpsbeslutning (reverse-trial-logikken fra abonnement-etikk §2 — måler verdi uforurenset). Varsel før enhver overgang til betaling.
- **Paywall-øyeblikk:** etter første *verifiserte delta-verdi* — brukeren har satt baseline, mottatt minst ett komfort-delta og bekreftet det nyttig. Aldri før (A26/Sol P0-3: tillit kan ikke opptjenes på én visning), og aldri i sikkerhetsflater.
- **Familie:** Apple/Google familiedeling aktiveres (gratis, null arkitektur, lokal-first-kompatibel). Ingen egen familieplan-prising (premiss 9: «Familie» markedsføres ikke før 20–25 %-terskelen per kvalifisert handoff er målt). Mottakere av kort er per definisjon gratis — husholdningen er betalingsenheten, aldri enkeltpersoner rundt barnet.
- **Helsestasjonskanalen:** Modell C er svak i kanalen («kanalen anbefaler apper, ikke varsler») og gjør ikke krav på den. Den er derimot kompatibel med tredje vei («Public Safety Utility»): sikkerhetslaget er allerede gratis og oppsalgsfritt by design.

## 7. Hva skjer hvis H3 nedgraderes til distribusjonslag? (ærlig svar)

**Da dør Modell C som selvstendig forretningsmodell, og det finnes ingen omformulering som redder den.** Man kan ikke ta løpende betalt for en kanal — betalingsviljen ligger da i innholdet kanalen leverer (H1s forskrivning eller H2s router), og prislogikken flytter dit. Konkret arv ved nedgradering:

1. **Delta-varsler** blir re-engasjementsmekanisme i H1-sesongpasset (dokumentert sterk retention: 3× med push første 90 dager, Airship — leverandørpåstand) — inkludert i passets pris, ikke egen SKU.
2. **Delte kort** forblir gratis viral loop uansett modell (kravet om kort utenfor paywall er modelluavhengig).
3. **Widget** blir sekundærflate i vinnermodellen; native-kostnaden må da re-begrunnes av retention alene.
4. **Vedlikeholdsabonnementet etter graduation** (§5) kan overleve som lavt priset tilleggs-SKU under H1 — men da er det H1s modellkort som eier det, ikke et eget kort.

Nedgraderingstriggeren er presis: H3 nedgraderes hvis den ikke gir verdi uten H1/H2 (revisjonsblokken pkt. 6) — operasjonalisert i §2.3: faller baseline-premisset, faller selvstendigheten. Eier skal derfor ikke velge Modell C isolert på tro; §5-kombinasjonen er den varianten som er robust mot nedgradering, fordi den allerede plasserer deltaet nedstrøms for forskrivningen.

## 8. Innstilling til porten (uten å forhåndsvelge)

Modell C ren: høyest etisk integritet i abonnementsformen (kontinuerlig leveranse = ærlig auto-fornyelse), sterkest retention-mekanikk, men svakest akkvisisjon, dyrest plattformkost (native widget ×2 + stale-safe-kontrakt) og hviler på det mest ubeviste atferdspremisset (baseline-vedlikehold). Modell C kombinert med sesongpass: løser baseline-problemet og graduation-ærligheten samtidig, men er da reelt en hybrid der eier må avgjøre hvilken modell som fører. Begge varianter krever at premiss 2 (bruksfrekvens) og verifikasjonskabling (premiss 5) leveres før noen kan påstå at deltaet har målt verdi.

## MODELLKORT
MODELL C — Delta-abonnement · Verdihypotese: husholdningen betaler for å få ENDRINGEN levert uten appåpning — delta-varsler, widget/hjemkort og delte vurderingskort med gyldighetsvindu; appen er konfigurasjons- og fallbackflate; forutsetter etablert baseline (svakeste premiss, ubevist). · Gratisnivå: full vurdering i app (pull) inkl. komplett sikkerhetslag med konkret handling; ALLE sikkerhets-deltaer pushes gratis uten oppsalg; manuell kortdeling gratis; mottak av kort alltid gratis uten konto/installasjon. · Premium: komfort-deltaer som push, widget/hjemkort, Live Activity på tur (iOS-bonus, aldri kjerneverdiløfte), automatisk kortlevering til faste mottakere, flere barneprofiler. · Prøvetid: gratis evalueringsperiode FØR kjøp (ikke StoreKit-trial) — to kvalifiserte endringssituasjoner (min. ett værskifte + én verifisert tur), kalendertak 14 dager, ingen kortinnhenting. · Paywall-øyeblikk: etter første verifiserte delta-verdi (baseline satt + minst ett komfort-delta bekreftet nyttig); aldri i sikkerhetsflater. · Prislogikk: 19–29 kr/mnd løpende auto-fornyende (hypotese; ærlig fordi verdien leveres kontinuerlig) + valgfri kombinasjon: ikke-fornyende «Første sesong»-pass ~299–399 kr (hypotese) med delta-laget inkludert og opt-in-overgang til delta-abonnement etter graduation; totalpris vises, sesongpass anbefales aktivt når billigere; proaktiv sesongpause (native på Android, veiledet kansellering + ett-trykks reaktivering på iOS). · Familieplan: Apple/Google familiedeling aktiveres (gratis, lokal-first-kompatibel); ingen egen familieplan-SKU før 20–25 %-handoff-terskel er målt; husholdningen er betalingsenheten, mottakere alltid gratis. · Retention: værskifte-drevne varsler (3× retention-benchmark, leverandørpåstand) + widget som dagsflate + kort-loop; strukturelt retention-sterk men akkvisisjons-svak (ingen søker etter et varsel). · Churn-risiko: push-opt-in-tak ~52 % (bransjetall) krever widget-fallback; sovende sommer gir naturlig pause/churn (3–4 mnd/år, hypotese) som modellen aksepterer bevisst; baseline-forvitring dreper verdien; hvis H3 nedgraderes til distribusjonslag dør modellen som selvstendig SKU og arven foldes inn i H1/H2.

## ETISKE INNVENDINGER
- Sovende sesong-fakturering er inntekt fra glemsel i sakte film — samme feil som årsplanen, bare mindre per måned. Adressert: proaktivt pauseforslag ved sesongslutt, aktiv-avtale-varsler, kansellering i appen like lett som kjøp; innrømmet rest: App Store mangler native pause, så iOS-løsningen (veiledet kansellering + reaktivering) er svakere enn Android-løsningen, og mekanismen koster bevisst inntekt.
- Grensen sikkerhets-delta vs. komfort-delta er glidende, og feil trekking gjør at trygg handling i praksis ligger bak betaling (brudd på gratis beslutningsminimum). Adressert: grensen defineres av det faglige scenariokorpuset (premiss 4/5), aldri av konverteringshensyn; entitlement-matrisen gjør sikkerhetskolonnen invariant; innrømmet rest: korpuset finnes ikke ennå — grensen er udefinert inntil fagpanelet har levert.
- Gratis sikkerhetsvarsler kan fungere som konverteringsagn selv uten CTA (eksponering skaper kjøpspress hos engstelige foreldre). Adressert: sikkerhetsvarsler inneholder aldri oppsalg, premium-referanse eller lenke til kjøpsflate, og widgetens gratistilstand er nøytral — aldri teaser av skjult råd; foreslått audit-punkt før lansering.
- Push-kanal til søvndepriverte foreldre er oppmerksomhetsbeskatning av en sårbar gruppe, og varselvolum kan drive engstelse. Adressert: alarm-budsjett (vedtatt i 05), delta sendes kun ved reell endring («samme antrekk holder» er også et gyldig, sjeldent svar), skamfri tekstdoktrine; innrømmet rest: modellens inntekt korrelerer med varselvolum — en strukturell fristelse som må overvåkes med volumtak.
- Stale råd hos gratis-mottakere (besteforeldre som ser et utløpt kort) er en sikkerhetsrisiko modellen selv skaper ved å distribuere råd til ukalibrerte tredjeparter. Adressert: kort er tidsstemplede snapshots med synlig gyldighetsvindu og aktiv degradering etter utløp — utløpt kort viser aldri rådet som gjeldende; nulltoleranse-krav i suksesskriteriene.
- «Billig per måned» kan bli dyrere totalt enn sesongpass over 0–24 mnd (29 kr × 20 mnd ≈ 580 kr > ~299–399 kr) — lavpris-innrammingen kan skjule totalkost. Adressert: forventet totalkost vises før kjøp, og produktet anbefaler aktivt sesongpass når det er billigere for brukerens situasjon; testes som innramming i premiss 7-eksperimentet.
- Kombinasjonen sesongpass → delta-abonnement kan gli mot abonnementsfelle (intensivprodukt som «myk inngang» til evig trekk). Adressert: overgangen er aktivt opt-in — et ikke-fornyende kjøp auto-konverteres aldri; exit-meldingen ved graduation er skamfri og nevner at de fleste klarer seg uten.
- Alle sentrale tall i modellen (pris, opt-in, pausemåneder, retention-effekt) er hypoteser eller leverandørpåstander, ikke egne målinger. Adressert: eksplisitt merking i rapport og modellkort, og modellen bindes til premiss 2-analytics og premiss 7-eksperimentet før noen påstand siteres som fakta ved porten.

## SUKSESSKRITERIER
- Stale-safe (invariant, nulltoleranse): 0 tilfeller der utløpt råd rendres som gyldig i widget, varsel, Live Activity eller delt kort i prototypetest — ett bekreftet tilfelle stanser systemflate-lansering til årsak er fjernet.
- Selvstendig verdi / baseline: ≥70 % (hypotese-terskel) av aktive husholdninger setter baseline innen 7 dager OG vedlikeholder den via mikrobekreftelser i minst 2 uker; under 50 % falsifiserer selvstendighetsvilkåret og nedgraderer H3 til distribusjonslag (Modell C dør som egen SKU, arven foldes inn i H1/H2).
- Nullmodell-porten: delta-varselet må slå nullmodellen (Yr + ni-ords-regelen + melding fra partner) målbart på beslutningstid, forståelse eller korrekt håndtering; ingen målbar forskjell = modellen drepes (samme baseline-krav som kilen i fase 3).
- Dekningsgrad utenfor appåpning: push-opt-in ≥55 % (hypotese; bransjetall ~52 %) OG widget-adopsjon ≥30 % blant dem som avslår push; samlet dekning under 60 % av aktive husholdninger falsifiserer «levert uten appåpning»-løftet.
- Delta-treffsikkerhet: ≥60 % (hypotese) av komfort-deltaer bekreftes som fulgt/nyttige i etter-turen-mikrosjekk; under 40 % betyr at deltaet ikke er til å stole på — modellen stanses inntil motor/baseline er forbedret (fagkonflikt-regelen fra fase 3 gjelder uendret: ett bekreftet «app grønn / fagperson rød» stanser alt).
- Betalingsvilje: konvertering etter fullført evalueringsperiode ≥8 % (hypotese-terskel, kalibreres mot RevenueCat-benchmarks ved porten) OG Van Westendorp-akseptabelt prisbånd som overlapper 19–29 kr; konvertering under 3 % falsifiserer at endringsleveranse alene bærer betalingsvilje.
- Sesongreaktivering (ærlighetstesten på løpende-formen): ≥40 % (hypotese) av pausede/kansellerte husholdninger reaktiverer ved neste kuldeperiode; under 20 % viser at behovet reelt er én sesong — modellen omformes da til ikke-fornyende sesongpass og løpende-formen skrotes.
- Plattformparitet: det betalte kjerneløftet (varsel + widget + kort) demonstrert funksjonelt likeverdig på iOS og Android før prising kommuniseres; klarer ikke Android-widgeten paritet, fjernes widget fra betalt løfte på begge plattformer heller enn å selge ulikt produkt.
- Kort-loop: ≥20 % (hypotese, speiler handoff-terskelen 20–25 %) av betalende husholdninger deler minst ett kort per kvalifisert handoff-uke, og mottakere åpner uten installasjonsvegg; under terskelen markedsføres deling ikke, og loopen består kun som stille funksjon.
- Etikk-audit før lansering: uavhengig gjennomgang bekrefter at ingen sikkerhetsflate inneholder oppsalg/CTA, at kansellering skjer i appen like lett som kjøp, og at totalpris + sesongpass-alternativ vises før abonnementskjøp — ett funn er blokkerende, ikke rådgivende.