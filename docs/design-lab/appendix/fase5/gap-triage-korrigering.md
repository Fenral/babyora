# Fase 5-SUPPLERING — Sols krav 1/2: Triage under tidspress + korrigerbare anbefalinger

> Utført 2026-08-05, Mobbin deep-modus, iOS. Alle omtalte skjermer er visuelt inspisert; hver er sitert med mobbin_url. Ingen overlapp med 06-rapportens korpus (router, komoot, éntillatelse, handoff, Flighty, proveniens) — dette dekker de to hullene Sol påpekte: beslutning under stress og overstyrbare algoritmiske råd.

## A. BESLUTNING/TRIAGE UNDER TIDSPRESS

### A1. Omvendt samtykke: trygg default + aktiv avkreftelse
[Citizen Dynamic Island-flyten](https://mobbin.com/flows/ea81f127-8434-4d97-8faa-6c33ddad195c) er gapets sterkeste enkeltfunn: en nedtelling (00:48) i Dynamic Island med nøyaktig to utganger — rød **SOS** og blå **Check In** ([skjerm](https://mobbin.com/screens/99eba79c-29fa-4caf-bae4-420911f1caaf)). Renner tiden ut, eskalerer appen; brukeren må aktivt avkrefte fare. Kvitteringen gjenforteller konsekvensen i klartekst: «Check in successful — You confirmed you are safe at [sted]». Under tidspress er altså *eskalering default* og trygghet det aktive valget — det motsatte av normal app-logikk. Apple Healths Crash Detection ([flyt](https://mobbin.com/flows/5bccd175-8464-4fef-8958-87ab42b65074)) viser samme arkitektur med to ærlighetstrekk: deklarert angrevindu («iPhone will start a countdown and sound an alarm before the call») og deklarert feilmargin («iPhone cannot detect all crashes»).

### A2. Hva gjør skjermen lesbar og handlebar på <5 sekunder
På tvers av korpuset er <5s-anatomien konsistent: (1) **ett tall eller én tilstand** som eneste store element (nedtellingen hos Citizen); (2) **maks to fargekodede utganger** der farge = konsekvensretning (rød eskalerer, blå avkrefter); (3) **verb på knappene**, aldri substantiv; (4) **null navigasjonskrom** — [Citizens broadcast-nedtelling](https://mobbin.com/screens/238c1a90-83c3-4c28-8207-579d5ca195ea) er bare tallet «3» og «Cancel» på svart; (5) **høy kontrast på mørk flate**. [Bloom-krisen](https://mobbin.com/screens/9a7c29f6-faae-40c9-9a16-bc339fa12e8f) reduserer til ett telefonnummer + Cancel — panikkskjermen har null valgfrihet utover ut/inn.

### A3. Eskaleringslinjen har fast plass, aldri bak navigasjon
Tre uavhengige apper konvergerer: [CVS Health-triagen](https://mobbin.com/screens/d0cb8fa4-16aa-4fac-8a3b-b25a68236b5b) fester «If you're experiencing a medical emergency, call 911 immediately» nederst på *hvert* triagesteg; [Citizens agentsamtale](https://mobbin.com/flows/d6c5ca1f-dc81-45a8-9e98-6b4b6d44f35a) holder «Is this an emergency? CALL 911» synlig *mens* hjelpen pågår; [Lime](https://mobbin.com/screens/f8e1daa3-c9d0-4735-ae49-9069da78c7cd) åpner selve skademeldingsskjemaet med nødnummerlinjen. Verste-utfall-utgangen er et fast, forutsigbart UI-element gjennom hele triagen.

### A4. Sikkerhetsinstruks FØR kontaktknapp
[Cuvvas havariskjerm](https://mobbin.com/screens/a3506335-4092-45c3-9509-5d6a400106bc) setter en firepunkts «sikre deg selv»-liste (kjør inntil, nødblink, noter posisjon, forlat bilen trygt) OVER CTA-en «Call the breakdown line», med eskaleringsunntaket («…call 999 first») som egen linje. Rekkefølgen er doktrine: *gjør situasjonen trygg → så bruk appen.* For Babyoras akutte kuldescenario: barnet håndteres først, appen dokumenterer etterpå.

### A5. Én beslutning per skjerm; valg i brukerens stemme; tak på 4–7
[Me+](https://mobbin.com/screens/2c86746d-e449-4279-b43f-5cc7fde315d2) (ett spørsmål, Ja/Nei), [Netflix](https://mobbin.com/screens/503f041d-b558-4f24-bbd7-1f6317c895ca) (4 kategorier + «Another Issue»), [Google Maps-rapportpanelet](https://mobbin.com/screens/7e3b6798-0461-449e-88e1-d7ccb909acef) (7 ikonknapper, med sikkerhetsklausulen «Only tap if it's safe to do so» — appen anerkjenner selv at brukeren er i en risikosituasjon). [Airalo](https://mobbin.com/screens/474886b4-cd8c-49f2-a1da-eccad4278318) formulerer hvert valg i jeg-form («I had trouble adding the eSIM») — valget gjenkjennes, ikke oversettes. Konvergerer med 06-rapportens router-tak på fire, og strekker det: under stress er taket lavere (2–4), og over 4 må valgene være ikoner med én-ords etikett.

### A6. Spatial triage: pek på tegningen i stedet for å navngi
Når problemet er fysisk, er skjema-over-ord raskere: [Tesla «Flat Tire»](https://mobbin.com/screens/9eb04173-56f5-49fd-8054-6e1750606c21) lar deg velge dekk på en bilskisse — og kombinerer tre Babyora-relevante grep i én skjerm: spatial seleksjon, ferskhetsstempel per verdi («44 psi, 2 hours ago») og referanseverdi («Recommended Cold Pressure: 42 psi»). [Lime](https://mobbin.com/screens/f8e1daa3-c9d0-4735-ae49-9069da78c7cd) nummererer hotspots på sparkesykkelen; [Flo](https://mobbin.com/screens/4a36a2d3-e6ef-4027-9d71-0c9bac827218)/[Alan](https://mobbin.com/screens/28579194-a284-411b-ae06-079a5aae598f) bruker kroppskart for smerte. For Babyora: pek på barnefigur/plaggsoner («hvor er barnet kaldt?») i stedet for tekstliste.

### A7. Gradert fallback når primærhandlingen er utilgjengelig
[Wysas SOS](https://mobbin.com/flows/ea7ba581-a50e-4a6d-8f68-e3216d578e80): to hotlines øverst, deretter «Can't make a call? Access these» → Safety Plan / Grounding. Panikkdesignet antar at det anbefalte kan være umulig i øyeblikket og har et neste-beste-lag klart — aldri en blindvei.

## B. KORRIGERBARE ANBEFALINGER MED USIKKERHET

### B1. Alternativet er et likeverdig kort, priset i samme valuta
[Kakao T](https://mobbin.com/screens/d3a5385f-5e4a-4184-a50a-c474fd955013) viser «anbefalt rute» og «gratisrute» som to sidestilte kort med identiske metrikker (14 min / ₩17 700 vs 14 min / ₩17 600) — anbefalingen er forhåndsvalgt men visuelt likestilt. [Apple Maps](https://mobbin.com/screens/579c8b7d-ef57-4855-a9d0-9ff4c7f86289) legger begge på kartet (19 min «Fastest» vs 21 min), begge tappbare. Overstyring er ikke en «avansert innstilling» — den står ved siden av rådet, målt i samme enheter (for Babyora: varmegrad/tid ute, ikke abstrakte poeng).

### B2. Rådet begrunner seg — og innrømmer motargumentet
[Google Maps](https://mobbin.com/screens/9fae97f1-4455-4041-bb5a-d8af97e4e4b0): «Fastest route, **despite much heavier traffic than usual**» + gul advarsel om begrensninger, med brukerens aktive constraints synlige som chip («Avoiding motorways and tolls»). [Grab](https://mobbin.com/screens/d3e54b54-989f-41bb-8497-accc33bf451e) begrunner konkret og sosialt: «2 traffic lights», «Taken by many Grab drivers». Anbefalingens hvorfor inkluderer ulempen — det er det som gjør «Best»-merket troverdig.

### B3. Den redigerbare setningen
[Stake](https://mobbin.com/screens/ce18ad8f-e135-49e4-a66e-3783e89b2d9e) skriver prognosen som en setning der parametrene er tappbare felt i selve setningen: «Projection of [$10,000] + [$1,000] every [month] earning [5.50%]». Dette er MET/Yr-anatomien (forhold → konsekvens → handling) gjort redigerbar: brukeren korrigerer premisset direkte i rådets egen grammatikk, ikke i et separat skjema.

### B4. Konsekvens vises som konkret hverdagseksempel, før bekreftelse
[GoHenry](https://mobbin.com/screens/896f2123-8e23-480d-8e95-e07a125d2060): slider + «If [barnet] had £50 in their savings, you would pay them around £0.42 next month». [Acorns](https://mobbin.com/screens/c051a8c7-11fc-481a-aa2c-ee3da2471d4b): «Ex: If you buy lunch for $10, we will automatically invest $0.50». Justeringens konsekvens oversettes til én konkret scene, ikke prosent. Babyora-form: «Med ett lag mindre: komfortabel i ~40 min i stedet for ~60.»

### B5. Intervallet er førsteklasses — og har navn
Fire uavhengige former: (1) intervall SOM overskrift — [Opendoor](https://mobbin.com/screens/cae1bdca-625f-462d-abd9-1f7a02e5a60f) «Estimated sale price $1.3M – $1.5M»; (2) punkt + navngitt range — [Zillow](https://mobbin.com/screens/2456fa98-a78c-4cc5-8cf2-9d3b262f111b) Zestimate med «Estimated sales range» rett under; (3) tre navngitte scenarier — [N26](https://mobbin.com/screens/6a9dd8cf-c682-47dc-b198-0f3c66713512) «Unfavorable €9,810 / Average €11,100 / Favorable €12,740» i klarspråk; (4) bånd med legendepost — [Monzo](https://mobbin.com/screens/4f4be597-6fa7-458e-a388-346907b2a011) tegner «Likely range» som skravert vifte MED egen legendeoppføring, pluss ærlighetslinje utenfor kortet («You could get back less than you invest»). [Lightyear](https://mobbin.com/screens/f0b6b888-65ef-47ca-9a65-cf1eb0e6ef0c) viser Low/Target/High med nåposisjon markert + proveniens («based on 39 analysts»). Direkte råmateriale til Sols «Confidence Instrument»-retningskandidat: intervallet vises alltid sammen med punktet, og intervallet har et navn brukeren kan si høyt.

### B6. Overstyring med deklarert omfang (scoped override)
[Apple Fitness](https://mobbin.com/screens/ae83e28a-287b-4852-9708-f5bf37448a7a): «Set a **temporary** Move goal **just for today** … This does **not** affect your current goal schedule.» Justeringen sier eksplisitt hva den IKKE endrer. [Wealthfront](https://mobbin.com/screens/0687053c-46dd-4469-826e-312cfb03c535) legger til en undo-pil ved slideren. Babyora-kritisk: «jeg overstyrer dagens råd» må ikke stilltiende omtrene modellen eller endre barneprofilen — omfanget deklareres i selve kontrollen.

### B7. Antakelsene er synlige — og hver antakelse er et håndtak
[Wealthfront](https://mobbin.com/screens/0687053c-46dd-4469-826e-312cfb03c535) er gullstandarden: verdiktlinje («On track to retire comfortably at 75»), «My assumptions»-seksjon som lister premissene (inflasjon, avkastning, trygd), og et dragbart «Retire at»-håndtak PÅ selve grafen. [Realtor.com](https://mobbin.com/screens/f419bebd-fed0-4b34-9460-d5ef7204d2c5) går lenger: tre uavhengige modell-leverandører listes med hver sin verdi (inkl. «No est») — modelluenighet vises som ærlighet, ikke skjules bak et snitt.

### B8. Normbånd fra egen historikk, beskrivende — ikke evaluerende
[Strava](https://mobbin.com/screens/fff0b506-9862-44e7-80a9-e1e447d404d9) «Suggested Range (From 3-Week Average)» som lilla bånd; [Bevel](https://mobbin.com/screens/953c3a4c-960d-4fdd-98cc-3a0a7bac470b) «Normal range 10–67%» som nøytral etikett ved scoren. Båndet er definert av brukerens egen baseline og beskriver, dømmer ikke — den konstruktive motsatsen til 06-rapportens skam-delta-forbud.

## Kobling til Babyora-hypotesene
- **H2-routeren** får et stress-modus-krav fra A2/A5: når situasjonen er akutt tipper taket fra fire innganger til to, og eskaleringsutgangen (A3) får fast plass.
- **B12 gyldighetsvindu** bekreftes fra ny vinkel: Tesla stempler hver måleverdi med alder også i en triagekontekst — ferskhet er del av beslutningsgrunnlaget, ikke metadata.
- **Confidence Instrument** (Sols retningskandidat) har nå komplett mønsterbibliotek: N26-scenarier + Monzo-bånd + Wealthfront-antakelser + Apple Fitness-scoping = intervall, drivere, kontrolltegn og korrigerbarhet i etablerte former.
- **Risiko/begrensning:** hele gap A-korpuset er engelskspråklig og USA-tungt (911-konvensjoner); norsk nødnummer-konvensjon (113/116117-skillet) må kalibreres separat. Finanskorpusets intervaller tåler at brukeren gambler på ytterpunktet — Babyoras intervall må asymmetrisk beskytte kald-siden (feilkost er ikke symmetrisk).

## OVERFØRBARE PRINSIPPER
- Omvendt samtykke under stress: trygg default + aktiv avkreftelse — appen eskalerer med mindre brukeren sjekker inn; kvitteringen gjenforteller konsekvensen i klartekst (Citizen Dynamic Island-flyt, Apple Health Crash Detection)
- <5s-anatomien: ett stort tall/én tilstand, maks to fargekodede utganger der farge = konsekvensretning, verb på knappene, null navigasjonskrom, høy kontrast (Citizen SOS/Check In, Bloom-krisen, Citizen broadcast-nedtelling)
- Eskaleringslinjen har fast, forutsigbar plass på hvert triagesteg — også MENS hjelpen pågår; aldri bak navigasjon (CVS Health 911-linje, Citizen agent-samtale, Lime skjemaåpning)
- Sikkerhetsinstruks FØR kontaktknapp: gjør situasjonen trygg → så bruk appen; eskaleringsunntaket som egen klausul (Cuvva havariskjerm) — for Babyora: barnet først, appen etterpå
- Under stress: én beslutning per skjerm, tak 2–4 valg (ikoner med én-ords etikett opp til 7), valg formulert i brukerens jeg-stemme, appen anerkjenner risikosituasjonen eksplisitt (Me+, Netflix, Google Maps «Only tap if it's safe to do so», Airalo)
- Spatial triage: pek på tegningen i stedet for å navngi — kombinert med ferskhetsstempel per verdi og synlig referanseverdi (Tesla Flat Tire, Lime hotspots, Flo/Alan kroppskart) — Babyora: pek på barnefigur/plaggsoner
- Gradert fallback: panikkdesignet antar at primærhandlingen kan være utilgjengelig og har et neste-beste-lag klart (Wysa «Can't make a call? Access these»)
- Sikkerhetsautomatikk deklarerer sin feilmargin og gir angrevindu før irreversibel handling (Apple Health: «iPhone cannot detect all crashes» + nedtelling med alarm)
- Alternativet er et likeverdig kort ved siden av rådet, priset i samme enheter; anbefalingen er forhåndsvalgt men visuelt likestilt (Kakao T anbefalt vs gratis rute, Apple Maps 19 vs 21 min på kartet)
- Rådet begrunner seg og innrømmer motargumentet; brukerens aktive constraints vises som synlige chips (Google Maps «Fastest, despite much heavier traffic», Grab «2 traffic lights»)
- Den redigerbare setningen: parametrene er tappbare felt i selve rådssetningen, ikke i et separat skjema — MET/Yr-anatomien gjort korrigerbar (Stake compound-kalkulator)
- Justeringens konsekvens vises umiddelbart som ett konkret hverdagseksempel, ikke abstrakt prosent (GoHenry «£0.42 next month», Acorns lunsj-eksempel) — Babyora: «ett lag mindre: ~40 min i stedet for ~60»
- Intervallet er førsteklasses og har navn: intervall-som-overskrift (Opendoor), punkt + navngitt range (Zillow), tre navngitte scenarier i klarspråk (N26 Unfavorable/Average/Favorable), bånd med egen legendepost (Monzo «Likely range») — med proveniens (Lightyear «39 analysts»)
- Scoped override: justeringen deklarerer hva den IKKE endrer («just for today … does not affect your schedule») og er reversibel med undo (Apple Fitness dagsmål, Wealthfront) — overstyring av dagens råd må aldri stilltiende endre barneprofilen
- Antakelsene er synlige og hver antakelse er et håndtak — helst på selve grafen; modelluenighet vises som ærlighet, ikke skjules bak snitt (Wealthfront «My assumptions» + dragbart håndtak, Realtor.com tre leverandør-estimater)
- Normbånd fra brukerens egen historikk er beskrivende, aldri evaluerende (Strava «Suggested Range from 3-Week Average», Bevel «Normal range») — konstruktiv motsats til skam-delta
- Norsk kalibrering kreves: gap A-korpuset er 911/USA-tungt; Babyoras intervall må dessuten beskytte kald-siden asymmetrisk — finansintervallers symmetri overføres ikke

## IKKE KOPIER
- Citizens frykt-økonomi: nedtellingsmekanikken overføres, men gamifisert nærhets-frykt («2.4K users within 0.5 km», member stories som markedsføring av utrygghet) er engasjementsdrift på foreldres redsel — direkte giftig i babykategorien
- Sikkerhetsminimum bak betaling/premium-innpakning: Citizens agenter er Premium-vare og CREDs roadside-hjelp er concierge-markedsføring — kolliderer med Nørs-korreksjonen (sikkerhetsprotokollen kan ikke ligge bak betaling); DoorDashs gratis SafeDash er riktig referanse
- Konsekvens-slider som salgsprojeksjon: Bloom gjør hypotetisk avkastning («$427,172 by age 64») til hovedbudskap med forbeholdet i småskrift — konsekvensvisningen skal informere valget, ikke selge oppsiden; hos Babyora må forbeholdet ha samme typografiske rang som løftet
- Interaktiv risikokurve som lokker mot ytterpunktet (Crypto.com Earn-kurven der høyest tall visuelt belønnes): intervall-interaksjon skal aldri gjøre den risikable enden mest attraktiv — Babyoras kalde ende skal ha friksjon, ikke glans
- Triage-grammatikk brukt som kald-lesing/salg (QUITTR symptomliste med ladede formuleringer og «Reboot my brain»-CTA): utvider 06-rapportens quiz-til-gissel — selve triageformen (avkrysning, ett spørsmål per skjerm) må aldri gjenbrukes i konverteringsøyemed
- Falsk hastverk utenfor reelle nødsituasjoner: nedtellings- og countdown-formene (Citizen, Manus slette-konto-timer) er legitime kun når klokken er reell — å låne stress-estetikken for vanlige valg undergraver den dagen det faktisk haster

## SØKELOGG
- search_screens (ios, deep, 10): «emergency SOS screen with countdown timer and prominent cancel button» → Citizen x2, DoorDash Dasher, Bloom, Cuvva, Opal, Manus m.fl.
- search_screens (ios, deep, 10): «symptom checker triage screen asking about urgency with large answer options» → CVS Health, Flo, Alan, Apple Health, Me+, Headspace, Zocdoc, QUITTR m.fl.
- search_flows (ios, 4): «activating emergency SOS alert with countdown then connecting to safety agent» → Citizen Dynamic Island-flyt, Citizen Calling an agent, Apple Health Crash Detection, Wysa SOS
- search_screens (ios, deep, 10): «map with alternative route options showing different arrival times to choose between» → Kakao T, Google Maps, Apple Maps, Grab, Alipay, Waymo m.fl.
- search_screens (ios, deep, 10): «insulin dose or medication dose calculator showing recommended dose the user can adjust» → Hevy warm-up-kalkulator, Apple Fitness dagsmål, Stake, Withings m.fl. (ingen ekte insulin-app i treff — dose-gapet dekket via trenings-/finansanalogier, notert som begrensning)
- search_screens (ios, deep, 10): «retirement or savings projection with sliders that update the projected outcome chart» → Monzo, Stake, Wealthfront, Bloom, GoHenry, N26, Acorns, Lightyear m.fl.
- search_screens (ios, deep, 10): «forecast or estimate shown as a range with uncertainty band or confidence indicator» → Bevel, Strava, Opendoor, Monzo, Zillow, N26, Realtor.com, Apple Weather m.fl.
- search_screens (ios, deep, 10): «roadside assistance screen choosing problem type with large tappable options» → Tesla Flat Tire, Lime, Bird, Turo, Rivian, Google Maps rapportpanel, Airalo, Netflix, CRED m.fl.