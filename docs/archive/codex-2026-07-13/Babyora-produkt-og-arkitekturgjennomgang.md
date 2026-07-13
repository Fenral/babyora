# Babyora — produkt- og arkitekturgjennomgang

Dato: 12. juli 2026  
Repo: `C:\Users\siver\Documents\Apper 2026\wool-app-main`

## Mandat og avgrensning

Dette startet som en skrivebeskyttet gjennomgang av kildekoden. Ingen kildekodefiler i Babyora-repoet er endret. Repo-kopien mangler `.git`, men avhengighetene ble senere installert med `npm ci`, og test, lint og produksjonsbygg ble kjørt 12. juli 2026. Resultatene er tatt inn i rapporten under.

Produktretningen rapporten vurderer mot er:

> Gratis = i dag hjemme.  
> Plus = fremover, overalt og sammen med familien.

## Kort konklusjon

Babyora har en reell og forholdsvis avansert kjerne: en deterministisk anbefalingsmotor, værintegrasjon, sikkerhetsregler, god mobiltilpasning og et gjennomarbeidet designsystem. Appen er teknisk langt forbi prototypefasen.

Det som ikke er klart, er Plus-produktet. Dagens kode selger i stor grad **morgenvarsel, garderobetilpasning, flere barn og vinterkurs**, mens ønsket retning er **fremtid, automatisk sted og familiedeling**. Flere av løftene på paywall og i onboarding er dessuten ikke koblet til fungerende produktflyter.

Før videre designarbeid bør fire forhold avklares:

1. Betalingsoppsettet i appen og det dokumenterte RevenueCat/App Store-oppsettet må få én felles sannhetskilde.
2. Plus-funksjonen «fremover» må faktisk åpne anbefalingen for valgt tidspunkt og dag.
3. Stedsmodellen må deles i fast hjemsted og midlertidig/nåværende sted.
4. Familiedeling krever konto, backend, roller, invitasjoner og en eksplisitt modell for hvem sitt abonnement familien arver.

## 1. Arkitekturkart

### Klient og mobil

- React 19 + TypeScript + Vite.
- Capacitor 8 for iOS og Android.
- Én hovedapp og en separat, enkel «bare»-visning som gjenbruker motoren.
- Skjermene lastes lazy fra `src/App.tsx`.
- Navigasjonen er egen state i `App.tsx`, ikke en ruter med URL-/historikkmodell.

Hovedfanene er i dag:

- Hjem
- Uke
- Guide
- Innstillinger

`App.tsx` har i tillegg drill-down-state for påkledning og guideskjermer. Dette fungerer for dagens app, men mangler en robust back stack og deep-link-modell. Familielinker og invitasjoner vil gjøre denne begrensningen tydelig.

### Tilstand og lagring

- Barn lagres i en egen React Context og `localStorage`.
- Preferanser for sted, varsler, tema, referansetime og abonnementscache lagres med Zustand Persist.
- Plaggstatus, feedback, vinterprogram, widget-cache og vær/geokoding har egne `localStorage`-nøkler.
- Det finnes ingen aktiv database, innlogging, synkronisering eller kontomodell i appkoden.
- Supabase er omtalt i `.env.example` og dokumentasjon, men klientbibliotek og datalag er ikke implementert.

Konsekvens: appen er i praksis **én enhet, én lokal familie**. Data og Plus-status kan ikke deles på en kontrollert måte mellom foreldre eller omsorgspersoner.

### Eksterne tjenester

- met.no via en Vercel edge-proxy (`api/forecast.ts`).
- Nominatim/OpenStreetMap direkte fra klienten for geokoding.
- RevenueCat native SDK for kjøp og entitlement.
- Valgfri PostHog Cloud EU for analyse.
- Lokale varsler via Capacitor.

## 2. Navigasjon og informasjonarkitektur

Den eksisterende fanestrukturen er kodefast og tydelig, men «Uke» og «Innstillinger» er for smale navn for den nye produktretningen.

Anbefalt målstruktur:

| Fane | Produktspørsmål | Innhold |
|---|---|---|
| Hjem | Hva gjelder nå? | Hjemsted/nåværende sted, dagens vær, situasjon og dagens antrekk |
| Planlegg | Hva skjer senere? | Resten av dagen, kommende dager, andre steder, «snart» og pakkeforslag |
| Guide | Hvordan vurderer jeg dette? | Finn antrekk, varm/kald, TOG, materialer og korte guider |
| Familie | Hvem gjelder dette for? | Barn, medlemmer, invitasjoner, steder, varsler, abonnement og innstillinger |

Det bør ikke gjøres en stor rutermigrering bare for å bytte fanenavn. Men før familiedeling bør navigasjonen få en reell route/back-stack-modell, fordi invitasjonslenker og deep links må kunne åpne en bestemt skjerm og returnere riktig.

### Konkrete navigasjonsfunn

- Android back-knappen bruker nettleserhistorikk (`window.history.back()`), mens intern navigasjon ikke skriver til historikken. Intern drill-state og Android-back er derfor ikke samme system.
- Uke-skjermens stedsknapp og varselknapp gir kun haptikk; de navigerer ikke noe sted.
- Innstillinger viser en «Sted»-rad, men klikket er koblet til en `noop`, selv om hjelpeteksten sier at sted kan endres der.
- Guide-skjermen hevder at antrekk lagres i historikk og kan finnes ved å sveipe på Hjem. Ingen slik historikkflyt finnes i kildekoden.

## 3. Anbefalingsmotoren

Motoren i `src/lib/wool-layers/` er produktets sterkeste tekniske del.

Flyten er:

1. Valider input.
2. Velg temperaturbånd basert på opplevd temperatur.
3. Hent basisantrekk per aktivitet og temperaturbånd.
4. Legg på vær-, alder-, varighet- og aktivitetsmodifikatorer.
5. Løs kombinasjonskonflikter.
6. Bruk myke begrensninger.
7. Bruk harde sikkerhetsregler.
8. Anvend eventuelle bruker-overstyringer og kalibrering.
9. Returner strukturerte plagg, notater, sikkerhetsflagg og alvorlighetsgrad.

Styrker:

- Ren og deterministisk funksjon uten IO.
- Separat datamodell for aktivitet, vær, barn, lagkategori og sikkerhetsnotater.
- God testdekning av basisbånd og mange guardrails.
- Forklarbar logikk, som passer bedre enn runtime-AI for et tillitsprodukt.
- Støtte for vogn, bæresele, utelek, søvn, bilstol-kontekst og vognsøvn.

### Kritisk latent sikkerhetsrisiko

Koden kjører harde sikkerhetsregler **før** bruker-overrides og personlig kalibrering (`recommend.ts:67–85`). Det betyr at et senere override i prinsippet kan gjeninnføre et plagg som en hard regel nettopp fjernet. Kalibrering `+1` kan også legge til halsedisse etter sikkerhetspipelinen, inkludert i en søvnssituasjon der HB-10 ellers forbyr løse halsplagg.

Disse funksjonene er ikke ferdig koblet til hovedflyten i dag, så risikoen er hovedsakelig latent. Rekkefølgen må likevel endres før garderobetilpasning eller personlig kalibrering aktiveres: sluttresultatet skal alltid gjennom en siste sikkerhetspassasje.

### Personlig kalibrering finnes, men er ikke koblet

`feedback-store.ts` lagrer «kald / passe / varm» og beregner en forsiktig bias etter tre like svar. Ingen produksjonsskjerm kaller `addFeedback()` eller `getBias()`, og ingen anbefaling i appflyten sender `childCalibration` til motoren.

Onboarding lover likevel at appen husker hva som fungerte og lærer over tid. Dette er et eksempel på copy som ligger foran produktet.

### Faglig validering

Motoren har omfattende kildekommentarer og sikkerhetsregler, men `tables.ts` sier eksplisitt at tabellene må valideres av helsesykepleier før produksjonslansering. Denne gjennomgangen har ikke vurdert medisinsk korrekthet uavhengig. Faglig validering er fortsatt en lanseringsblokkering fordi designet og språket gir rådene høy autoritet.

## 4. Dagens gratis/Plus-logikk

### Gratis i koden nå

- Dagens anbefaling.
- Time-for-time i dag.
- Ett aktivt barn.
- Automatisk posisjon.
- Værendrings-toggle.
- Hele «Finn antrekk»-kalkulatoren med vilkårlig temperatur, vind og nedbør.
- Registrering av ubegrenset antall garderobeplagg.
- Tilgang til de fleste guider og første vinterleksjon.
- Mulighet til å legge til flere barn, selv om bytte til barn 2+ gates senere.

### Plus i koden nå

- Antrekk for 10 dager.
- Morgenvarsel.
- Bytte til barn 2+.
- Leksjon 2–8 i vinterprogrammet.
- Garderobetilpasning i teorien.

### Viktige avvik

1. **Automatisk sted er gratis**, selv om dette er valgt som en sentral Plus-verdi.
2. **Morgenvarslet er Plus**, selv om det sannsynligvis bør bygge gratisvanen.
3. **Garderobetilpasning selges, men brukes ikke i anbefalingsflyten.** `ownership-override.ts` er ikke importert av noen produksjonsskjerm.
4. **Værendringsvarslet kan slås på, men det finnes ingen weather-service eller bakgrunnsjobb som oppdager endringen og sender varselet.** Helperen oppretter bare kanal/rydder gammel plan.
5. **Barn nummer to kan opprettes gratis; først når brukeren forsøker å bytte til barnet kommer paywall.** Det skaper lagret data brukeren ikke kan bruke.
6. **Fremtidsrader beregner riktig anbefaling, men åpner dagens antrekk.** Koden kommenterer selv at per-fase-context ikke er koblet (`UkeScreen.tsx:1175–1180`). Dette bryter selve Plus-løftet.
7. **«Én Premium — begge foreldre» er bare copy.** Det finnes ingen konto, innlogging eller deling av entitlement.

## 5. Anbefalt produktkontrakt

### Gratis — i dag hjemme

- Ett barn.
- Ett fast, manuelt hjemsted.
- Komplett anbefaling for i dag.
- Nødvendige situasjoner: lek, vogn og bæresele når motoren støtter det godt nok.
- Time-for-time i dag, komprimert til meningsfulle endringer.
- Plaggdetaljer, alternativer og sikkerhetsforklaringer.
- Enkel morgenpåminnelse.
- Varm/kald-guiden og grunnleggende sikkerhetsinnhold.

Gratisrådet må være like trygt og korrekt som Plus. Plus skal utvide tid, sted og samarbeid — ikke korrigere et mangelfullt gratisråd.

### Plus — fremover, overalt og sammen

- Resten av dagen og kommende dager med korrekte, klikkbare antrekk.
- Automatisk nåværende sted.
- Flere lagrede steder og midlertidig reisested.
- Flere barn.
- Familie- og omsorgsdeling.
- Smarte varsler når anbefalingen faktisk endrer seg.
- «Hva trenger barnet snart?» basert på alder, valgfri størrelse, årstid og lokalt klima.
- Personlig varm/kald-kalibrering etter at sikkerhetsrekkefølgen er korrigert.
- Widget senere, når appen faktisk skriver snapshots til native bridge.

## 6. Stedsmodellen må bygges om

I dag ligger `city`, `lat` og `lon` direkte på barnet. Automatisk posisjon oppdaterer disse feltene. Det betyr at telefonens nåværende posisjon overskriver barnets registrerte hjemsted.

Dette er uforenlig med «gratis = hjemme, Plus = overalt».

Anbefalt modell:

```text
ChildProfile
  homeLocationId

SavedLocation
  id
  householdId
  label
  city
  lat
  lon

WeatherContext (device/session)
  mode: home | current | saved | temporary
  resolvedLocation
  expiresAt?
```

Nåværende GPS-posisjon bør være en enhets-/sesjonskontekst, ikke en mutasjon av barnets profil. Når bestemor åpner appen, kan hennes telefon beregne været der hun er uten at barnets «hjem» flyttes.

### Konkret feil ved barn nummer to

Skjemaet ber om et nytt sted, men lagrer koordinatene fra det aktive barnet og bare bytter bynavnet (`InnstillingerScreen.tsx:1181–1196`). Et barn kan derfor stå som «Bergen» mens været hentes for Trondheim. Dette må fikses før flere barn markedsføres.

## 7. Familiedeling: nødvendig arkitektur

Familiedeling kan ikke bygges som en liten UI-funksjon oppå dagens localStorage-modell.

Minimumsmodell:

```text
User
Household
HouseholdMembership (owner | caregiver)
ChildProfile
SavedLocation
Invitation
Entitlement/PlanOwner
```

Roller:

- Eier: abonnement, barnedata, invitasjoner og sletting.
- Omsorgsperson: ser anbefalinger, velger situasjon og sted på egen telefon, og kan gi varm/passe/kald-feedback.

Betalingsmodell:

- RevenueCat må initialiseres med en stabil app-user-ID fra innloggingen.
- Et server-side webhook-lag må synkronisere aktiv entitlement til husholdningen.
- Inviterte medlemmer arver tilgang til husholdningens delte barn, ikke nødvendigvis et globalt personlig Plus-abonnement.
- RLS/tilgangsregler må sikre at en omsorgsperson bare ser husholdninger vedkommende faktisk er medlem av.

Eksakt live-posisjon bør normalt ikke synkroniseres til familien. Den som passer barnet bruker sin egen telefon til å løse lokalt vær.

## 8. Betaling og paywall

### Blokkerende konfigurasjonsavvik

Koden bruker disse produkt-ID-ene:

- `babyora_yearly_299`
- `babyora_monthly_49`
- `babyora_barnetiden_499`

`STATUS.md` dokumenterer derimot et aktivt RevenueCat/App Store-oppsett med månedlig, kvartalsvis og årlig plan, blant annet:

- `no.klemeg.app.monthly`
- `no.klemeg.app.quarterly`
- `no.klemeg.app.yearly`
- RevenueCat-pakker `$rc_monthly`, `$rc_three_month`, `$rc_annual`

`purchasePackage()` søker etter enten package identifier eller product identifier. Hvis dashboardet fortsatt matcher `STATUS.md`, vil ingen av appens tre nåværende ID-er matche, og kjøpet vil feile.

Dette må verifiseres mot faktisk RevenueCat-dashboard før noe annet betalingsarbeid.

### Prisene hentes ikke fra butikken i UI

Kommentaren i `products.ts` sier at StoreKit-pris skal vinne. Paywallen kaller aldri `getOfferings()` for å vise priser; den viser alltid ankerprisene fra koden. Kjøpsdialogen kan derfor vise en annen pris eller plan enn butikken faktisk har.

### Entitlement ved nettverksfeil

`checkPremium()` returnerer `false` ved feil, og synkefunksjonen lagrer deretter `false`. En SDK-/nettverksfeil kan dermed se ut som en reell nedgradering. «Ukjent/kunne ikke synke» må være en annen tilstand enn «bekreftet ikke Premium».

### Paywallens produktfortelling

Paywallen viser hovedsakelig overskrift og tre prisvalg. Den viser ikke tydelig de tre ønskede verdiområdene. Generisk åpning leder med «Våkn opp til ferdig antrekk», altså en funksjon som etter anbefalt modell bør være gratis vane.

Ny generisk struktur:

> **Fremover, overalt og sammen**  
> Planlegg kommende dager, få råd automatisk der barnet er, og del med alle som passer.

Vis tre konkrete eksempler før pris:

- I morgen blir det kaldere — fleece legges til.
- Hos bestemor brukes været der hun er.
- Alle omsorgspersoner ser samme anbefaling.

Fjern garderobe og vinterkurs som hovedargumenter. De kan være støtteverdi, ikke Plus-historien.

### Onboarding

Brukeren må gjennom et eget Plus-teaser-steg før appen åpnes. Begge knappene på velkomststeget fører til teaseren. Det betyr at brukeren ser paywallmuligheten før den første virkelige anbefalingen.

Anbefalt rekkefølge:

1. Opprett barn og hjemsted.
2. Vis faktisk antrekk for barnet i dag.
3. La brukeren oppleve detaljene.
4. Introduser Plus kontekstuelt når brukeren trykker «i morgen», automatisk sted eller deling.

## 9. Design tokens og temperaturbakgrunn

### Det som fungerer

- Et samlet tokenark finnes i `design-tokens.css`.
- Light, dark og auto støttes.
- Farger, kontrast, touchmål, safe areas og redusert bevegelse er gjennomtenkt.
- Temperaturbakgrunnen er faktisk aktiv på Hjem, Uke, påkledningsmodalen og Finn antrekk.

### Hva temperaturen faktisk gjør

Bakgrunnen er ikke en kontinuerlig temperaturgradient. Den velger tre diskrete tilstander:

- kald: under 5 °C
- mild: 5–18 °C
- varm: over 18 °C

På Hjem og Uke brukes opplevd temperatur. I Finn antrekk brukes sliderens rå temperatur. Det fungerer visuelt, men logikken er duplisert i flere skjermer.

`AtmosphereBackground.tsx` inneholder en mer omfattende gradient-/partikkelløsning, men komponenten importeres ingen steder. `PRODUCT.md` sier samtidig at atmosfærisk bakgrunn er droppet. Dette er død kode og dokumentasjonsdrift, ikke aktivt produkt.

### Token-gjeld

- Aliaset `--warm-orange-500` peker nå på grønn CTA.
- Gamle terracotta-, Morgennatt-, orange- og nye grønne navn lever parallelt.
- Store deler av skjermdesignene ligger som inline style-objekter i svært store filer.

Dette gjør det vanskeligere å håndheve «fersken forteller, mint handler» eller andre semantiske regler. Ikke redesign alt. Gjør en kontrollert opprydding:

1. Innfør semantiske navn som `--action-primary`, `--temperature-warm`, `--editorial-accent`, `--surface-*`.
2. Behold gamle aliaser midlertidig.
3. Flytt gjentatte dialog-, rad- og kontrollstiler til delte komponenter.
4. Samle temperaturterskler og mapping i én modul.

### UI-copy som må korrigeres

- Guide sier at utendørskalkulatoren er bygget på TOG-standarden. TOG skal holdes til søvn.
- Guide lover historikk som ikke finnes.
- Onboarding lover læring fra varm/kald-feedback som ikke er koblet.
- Vinterprogrammet lærer brukeren at Plus bygger anbefalinger fra egne plagg, selv om produksjonsflyten ikke bruker ownership-overrides.
- Hjelp sier at værkilde kan byttes, men kun met.no finnes.

## 10. Analyse og produktmåling

PostHog er integrert som valgfri SDK, med autocapture og session recording slått av. PII-nøkler filtreres. Det er en god start.

Men bare disse eventene kalles i produksjonskoden:

- `app_opened` — alltid med source `direct`
- `paywall_viewed`
- `paywall_converted`
- `trial_started`

Eventtypene for onboarding, vist anbefaling, guide, feedback, varsler, widget og plagg finnes bare i typeunionen. De sendes ikke.

Dermed kan man ikke svare på:

- Ser brukeren sin første anbefaling?
- Kommer vedkommende tilbake neste morgen?
- Hvilken Plus-funksjon forsøker brukeren å åpne?
- Blir en kjøpt funksjon faktisk brukt?
- Fullføres familieinvitasjon?

Minimum før betalingsoptimalisering:

- onboarding startet/fullført
- første anbefaling vist
- antrekksdetalj åpnet
- tilbakekomst dag 1 og dag 7
- Plus-trigger og paywall
- kjøp/restore med faktisk butikkutfall
- valgt fremtidsdag åpnet
- auto-sted aktivert
- invitasjon startet/akseptert
- varm/passe/kald registrert

### Personvernkonflikt

`PRIVACY.md` og personverndialogen nevner ikke PostHog, mens appen kan sende en vedvarende anonym distinct ID og events til PostHog EU. Det finnes kode for opt-out, men ingen UI som bruker den.

Personvernteksten sier også at koordinater sendes til met.no, men reverse geocoding sender dem til Nominatim/OpenStreetMap. Tredjepartslisten mangler både PostHog og Nominatim.

## 11. Data, personvern og sletting

Barneprofilen inneholder navn, full fødselsdato, by og koordinater i `localStorage`. Dette er enkelt og lokalt, men må behandles som persondata.

GDPR-export/sletting tar bare nøkler med `babyora:` og `klemeg:`. Den utelater blant annet:

- `metno:*` — vær-cache nøstet etter koordinat
- `nominatim:*` — søk og reverse-geocode-cache
- `native-settings:*`

«Slett alle lokale data» er derfor ikke komplett. Dokumentasjonen hevder at localStorage er komplett datakilde, men helperen eksporterer/sletter ikke alle appens nøkler.

Før familiedeling må det i tillegg finnes server-side eksport og sletting, medlemsfjerning, invitasjonssletting og håndtering av RevenueCat-identitet.

## 12. Vær, caching og drift

Styrker:

- met.no går via egen proxy med korrekt User-Agent og edge-cache.
- Klienten har én times lokal cache.
- Forecast parsing har egne tester.

Risikoer:

- Når lokal cache er utløpt og nettet feiler, brukes ikke den gamle cachen som stale fallback. Den daglige kjernesiden går direkte i feiltilstand.
- Det finnes ingen eksplisitt «sist oppdatert» eller stale-markering.
- Direkte Nominatim-kall er en ekstern tilgjengelighets- og policyavhengighet. Kommentaren om at Capacitor sender egen User-Agent stemmer ikke med at vanlig `fetch()` brukes.
- Værendringsvarsler har ingen bakgrunnstjeneste.
- Det finnes ingen sentral feilrapportering; produksjonsfeil går i hovedsak til `console.warn/error`.

Anbefaling: behold siste gode værdata i opptil eksempelvis 6–12 timer og merk tydelig at dataene er utdaterte. For en morgenapp er et litt gammelt svar ofte bedre enn tom skjerm, så lenge tidspunktet vises.

## 13. Tester og CI

Det finnes 203 enhetstester fordelt på 21 testfiler. `npm test` ble kjørt 12. juli 2026: alle 21 testfiler og alle 203 tester besto.

Styrken ligger i:

- anbefalingsmotor
- sikkerhetsregler
- betalingscopy og rene gating-predikater
- værparsing
- garderobehelpers
- feedback-bias

Svakheter:

- Ingen integrert skjermtest av faktisk gratis/Plus-adferd.
- Ingen test av at valgt fremtidsrad åpner riktig anbefaling.
- Ingen test av at appens produkt-ID-er matcher RevenueCat-offering.
- Ingen test av offline-/ukjent entitlement.
- Ingen test av at overrides og kalibrering fortsatt passerer hard safety.
- Playwright-skript finnes, men de er ikke koblet til `npm test`.
- `codemagic.yaml` kjører build og Capacitor sync, men ikke test eller lint.
- Dokumentasjonens 203/203-tall er bekreftet. Dokumentasjonen omtaler også et `e2e-flows.mjs`-løp, men repoet inneholder ingen slik fil.

### Faktiske kontrollresultater 12. juli 2026

- `npm test`: **bestått** — 21/21 testfiler, 203/203 tester.
- `npm run build`: **bestått** — TypeScript, hovedapp og separat `bare`-bygg.
- `npm run lint`: **feilet** — 17 feil og 2 advarsler.
- `npm ci`: installerte 618 pakker og rapporterte 12 kjente avhengighetssårbarheter (1 lav, 3 moderate, 8 høye). Ingen automatisk `npm audit fix` ble kjørt.

Lint-feilene består hovedsakelig av React 19-regler om synkrone state-endringer i effects, men inkluderer også:

- parse-feil (`return` utenfor funksjon) i `scripts/garment-audit.workflow.js`
- ubrukte variabler i `scripts/generate-rules-docs.ts` og `src/lib/garments/ownership.ts`
- ref-oppdatering under render i `useAutoLocationRefresh.ts`
- Fast Refresh-regler i `HjemScreen.tsx` og `children-store.tsx`
- memoiseringsavvik i `UkeScreen.tsx`

Bygget er dermed leverbart på kompilatornivå, men repoet oppfyller ikke sin egen lint-kvalitetsport.

Minimum CI-gate:

1. `npm test`
2. `npm run lint`
3. `npm run build`
4. Et lite Playwright-smokesett for onboarding, dagens antrekk, fremtids-paywall, kjøpsvisning og riktig valgt fremtidsantrekk.

## 14. Vedlikeholdsrisiko

Flere skjermer er svært store:

- Innstillinger: ca. 6 081 linjer
- Onboarding: ca. 1 631 linjer
- Finn antrekk: ca. 1 369 linjer
- Uke: ca. 1 248 linjer
- Guide: ca. 1 072 linjer

Mye layout og interaksjon er inline. Dette gjør små produktendringer risikable og fører til duplisering av dialoger, temperaturmapping, close-knapper, rader og fargestiler.

Ikke gjør en generell rewrite. Ekstraher etter produktbehov:

1. `LocationPicker` og lokasjonsmodell.
2. `FeatureGate`/Plus-kontrakt.
3. `PaywallDialog` med butikkpriser.
4. Delte dialogrammer og settings-rader.
5. `PlanRecommendationContext` for valgt time/dag.
6. Familie- og invitasjonsmoduler.

## 15. Prioritert gjennomføringsplan

### P0 — før betaling eller bred lansering

1. Verifiser faktiske App Store/Play/RevenueCat-produkt-ID-er og oppdater én kanonisk konfigurasjon.
2. Hent og vis faktiske butikkpriser/offeringer på paywallen.
3. Skill entitlement `unknown/error` fra bekreftet gratis.
4. Koble valgt time/dag til korrekt påkledningsmodal.
5. Rett feil sted/koordinat ved opprettelse av barn nummer to.
6. Fjern eller merk ikke-implementerte løfter: garderobetilpasning, læring, historikk og værendringsvarsler.
7. Flytt safety til siste steg etter overrides/kalibrering.
8. Oppdater personvern for PostHog og Nominatim, og gjør eksport/sletting komplett.
9. Faglig valider anbefalings- og sikkerhetstabellene.
10. Kjør test/lint/build i CI.

### P1 — lås produktmodellen

1. Lag én sentral Feature Access-kontrakt for «today/home/future/auto-location/multi-child/family».
2. Gjør enkel morgenpåminnelse gratis.
3. Gate auto-posisjon og flere steder som Plus.
4. Skill `homeLocation` fra enhetens `currentLocation`.
5. Endre Uke til Planlegg og vis meningsfulle endringer, ikke bare antall plagg.
6. Bygg om paywall og onboarding rundt «fremover, overalt og sammen».
7. Fjern Min garderobe fra hovedretningen; behold eventuelt funksjonen skjult som eksperiment.

### P2 — bygg det reelle Plus-produktet

1. Innlogging og husholdningsmodell.
2. Familieinvitasjoner og roller.
3. RevenueCat-user mapping og webhook-synk av entitlement.
4. Flere lagrede steder/reise.
5. Smarte anbefalingsendringsvarsler.
6. «Hva trenger barnet snart?» med valgfri nåværende størrelse.

### P3 — differensiering

1. Koble varm/passe/kald-feedback til motoren, med siste safety-pass.
2. Widget med faktisk snapshot-oppdatering.
3. Pakk for i morgen.
4. Bedre offline-/stale-opplevelse og feilobservabilitet.

## Endelig vurdering

Babyora trenger ikke en ny visuell identitet eller en ny anbefalingsmotor nå. Den trenger en opprydding i sannheten mellom produkt, copy og kode.

Den riktige tekniske retningen er:

> Behold den lokale, deterministiske anbefalingsmotoren.  
> Bygg en tydelig tids- og stedskontekst rundt den.  
> Legg husholdning, roller og entitlement som et eget delingslag.  
> La gratis løse dagens situasjon helt; la Plus koordinere resten av hverdagen.

Når de blokkerende avvikene er rettet, er kodebasen et godt fundament for «i dag hjemme / fremover, overalt og sammen». I dagens tilstand er gratisproduktet sterkere enn Plus-produktet, og det er nettopp derfor betalingsarbeidet bør starte med kontrakt og arkitektur — ikke flere funksjoner eller mer paywall-polish.
