# Lanseringsstatus mot designsystemet

Generert 2026-08-03 av workflow `babyora-designsystem-revisjon`: 11 skjermer,
en revisor per skjerm, og hvert funn som pasto a BLOKKERE lansering ble sendt
til en egen dommer med mandat om a felle det. Funn som ikke overlevde er
fjernet fra lista. 68 agenter, 7.0 mill. tokens,
64 malbare regler destillert fra DESIGN.md og art bible.

Innstillinger-revisjonen falt ut pa en API-feil og mangler i tallgrunnlaget.

---

# Babyora — lanseringsklar mot designsystemet

## 1. Tallet

**60 %**

`(Hjem 88×20 + Påkledning 32×18 + Onboarding 48×12 + Planlegg 71×11 + Familie 60×10 + Juster 68×8 + Plaggbibliotek 58×6 + Tog 54×5 + Varm/kald 29×5 + Vinterprogram 75×5) / 100 = 59,75 → 60 %`

Vekt = skjermens andel av produktet, ikke antall linjer. Min garderobe er holdt utenfor: den er umontert og kan ikke blokkere noe.

## 2. Per skjerm

| Skjerm | % | Det ENE som mangler mest |
|---|---|---|
| Min garderobe* | 29 | Umontert i 932 linjer — avgjør sletting eller port |
| Varm eller kald | 29 | 0 av 34 `var()` er `--dw-*`; hele skjermen er pre-v2 |
| Påkledning (resultatet) | 32 | To skjermer i én fil; den levende er en ustylet dialog |
| Onboarding | 48 | 0 `--dw-*` i 927 linjer CSS; maskotskyggen inverterer i mørk |
| Tog-guide | 54 | `--zone-*`-tokens er aldri deklarert; hex faller gjennom i begge tema |
| Plaggbibliotek | 58 | FAB ligger bak tab-baren; material-prikker usynlige i ett tema hver |
| Familie | 60 | 52 inline style-objekter i én fil — ingen CSS å måle på |
| Finn antrekk / Juster | 68 | Demotert resultat dimmes under lesbarhetsgrensen |
| Planlegg / Uke | 71 | Dybdekontrakten forbrukes ikke; hardkodet `#3A2A1A` |
| Vinterprogram | 75 | 30 legacy-tokennavn — ellers strukturelt ferdig |
| Hjem (referanse) | 88 | CTA −48 px under fold på iPhone SE |

\* utenfor regnestykket

## 3. Atomic liste

### BLOKKERER LANSERING

> **REVIDERT 2026-08-05 (DoD fase 6A).** Hvert punkt er MÅLT mot koden slik
> den står nå, ikke antatt rettet. Fem er grønne, åtte står åpne.
>
> Skillet er ikke pedanteri. Ved forrige runde krysset jeg av et punkt fordi
> jeg hadde jobbet med det, ikke fordi jeg hadde målt det — og tok feil.
> Hvert punkt under bærer derfor tallet eller kommandoen som ga svaret.

**GRØNT — målt, ikke antatt:**

- [x] `--dw-depth-action`: CTA-skyggen er nå MØRKERE enn lerretet —
      0,73× og 0,56× lerretets luminans. Var 3,3× lysere.
- [x] Hjems CTA over fold på 375×667: **28 px klaring** (krav 12).
      Målt av `tools/verify-hjem.mjs` port 9, ved hver kjøring.
- [x] Juster: opacity-demoteringen er borte. Farge + ordet «Utdatert»,
      håndhevet av `src/styles/__tests__/opacity-demping.test.ts` (fase 5).
- [x] Juster: `ScanStatusBlock` rendres — skip-knapp OG aria-live (fase 5).
- [x] Juster: stale-låsen slipper taket når parametrene settes tilbake.
      `finn-antrekk-calc.ts`, mutasjonstestet 3/3 (fase 5).

**ÅPENT — målt 2026-08-05, venter på at eier låser listen:**

- [ ] `--dw-accent-300` har fortsatt INGEN lys-verdi: null deklarasjoner i
      begge lys-blokkene. Lys modus arver derfor mørk-verdien `#E7B087`.
- [ ] `.outfit-truth-panel` har fortsatt ingen CSS-regel i hele `src/`.
      To-gren-spørsmålet er derimot løst: den unådde grenen ble slettet i
      fase 4, og porten holder den borte.
- [ ] `Antrekkskart.css`: 13 rå hex, deriblant kald blå `#79b1e0` og `#fff`.
- [ ] `UkeScreen.css:436`: hardkodet `#3A2A1A` på plaggplaten.
- [ ] Onboardings maskotskygge: tokenet er byttet fra `--ink-900` til
      `--dw-ink-hi` — men `--dw-ink-hi` ER kremfarget i mørk modus, så
      glorien er nøyaktig den samme. **Byttet flyttet symptomet fra et
      legacy-token til et nytt uten å røre årsaken.** Verdt å merke seg som
      mønster: en tokenmigrering er ikke en retting.
- [ ] Plaggbibliotek: `--dw-tabbar-clearance` brukes null ganger i skjermen.
      FAB og siste rad ligger fortsatt bak tab-baren.
- [ ] Varm eller kald: `neck-orb-pulse ... infinite` kjører fortsatt —
      evighetsbevegelse i hvile.
- [ ] Tog-guide: `--zone-*` brukes fem steder og er deklarert INGEN steder.
      Fallback-hexene treffer derfor alltid, og fargene er identiske i
      begge temaer — tokenet er en fasade.

> **REVIDERT 2026-08-05 (DoD fase 6A).** Hvert punkt er MÅLT mot koden slik
> den star na, ikke antatt rettet. Fem er gronne, atte star apne. Statusen
> er skrevet av revisjonen, ikke av en hukommelse — kommandoen som gav
> hvert tall star i punktet.

**GRONT — malt, ikke antatt:**

- [x] : CTA-skyggen er na MORKERE enn lerretet
      (0,73x og 0,56x lerretets luminans). Var 3,3x lysere.
- [x] Hjems CTA over fold pa 375x667: **28 px klaring** (krav 12).
      Malt av  port 9, hver kjoring.
- [x] Juster: opacity-demotering fjernet. Farge + ordet «Utdatert»,
      handhevet av  (fase 5).
- [x] Juster:  rendres — skip-knapp OG aria-live (fase 5).
- [x] Juster: stale-lasen slipper taket nar parametrene settes tilbake
      (, mutasjonstestet, fase 5).

**APENT — malt 2026-08-05, venter pa eiervedtak:**

- [ ]  har fortsatt INGEN lys-verdi: 0 deklarasjoner i
      begge lys-blokkene. Lys modus arver darfor mork-verdien #E7B087.
- [ ]  har fortsatt ingen CSS-regel i hele .
      (To-gren-sporsmalet er lost: den unadde grenen ble slettet i fase 4.)
- [ ] : 13 raa hex, deriblant kald bla  og .
- [ ] : hardkodet  pa plaggplaten.
- [ ] Onboarding maskotskygge: tokenet er byttet fra  til
      , men problemet star — ink-hi ER kremfarget i mork modus,
      sa glorien er den samme. Byttet flyttet symptomet, ikke arsaken.
- [ ] Plaggbibliotek:  brukes 0 ganger i skjermen.
- [ ] Varm eller kald:  kjorer fortsatt.
- [ ] Tog-guide:  brukes 5 steder og er deklarert INGEN steder.
      Fallbacken treffer alltid, sa fargene er identiske i begge tema.

- [ ] `--dw-depth-action` gir i mørk modus en skygge 3,3× lysere enn lerretet — treffer CTA på alle skjermer — `src/styles/design-tokens-v2.css:161-164`
- [ ] `--dw-accent-300` mangler lys-verdi i begge lys-inngangene → målt 1,87:1 (Tog) og 1,47:1 (Varm/kald) — `src/styles/design-tokens-v2.css:262-318` + `:324-366`
- [ ] Hjems CTA ligger −48 px under fold på iPhone SE 375×667 — `src/components/hjem/hjem-monter.css:35` (kjent defekt, ikke re-målt)
- [ ] Påkledning: avgjør hvilken av de to grenene som ER skjermen; den levende er inline-stylet og `.outfit-truth-panel` har ingen CSS-regel i hele `src/` — `src/screens/PaakledningScreen.tsx:453, 476-552`
- [ ] Påkledning: 13 rå hex i den levende CSS-en, deriblant kald blå `#79b1e0` og `var(--surface-elevated, #fff)` — `src/components/outfit/Antrekkskart.css:1-33`
- [ ] Planlegg: hardkodet `#3A2A1A` på plaggplaten → mørke firkanter i lys modus + 2,24:1 bokstav-fallback — `src/screens/UkeScreen.css:436, 444`
- [ ] Juster: demotert resultat dimmes til `opacity 0.55` → 2,31–3,89:1 i BEGGE tema, permanent tilstand — `src/screens/FinnAntrekkScreen.tsx:1190-1195` (påført `:916`)
- [ ] Juster: seremonien har ingen skip-knapp og ingen aria-live (`ScanStatusBlock` aldri importert) — `src/screens/FinnAntrekkScreen.tsx:96, 742-763`
- [ ] Juster: stale-låsen tvinger ny 3,2 s seremoni for et svar appen alt har — `finn-antrekk-calc.ts:51`
- [ ] Onboarding steg 1: maskotskyggen henter `--ink-900` og blir en krem glorie i mørk modus (standardtema, førsteinntrykk) — `src/screens/OnboardingScreen.tsx:1222`
- [ ] Plaggbibliotek: FAB og siste rad ligger bak tab-baren (ingen `--dw-tabbar-clearance`) — `src/screens/PlaggbibliotekScreen.tsx:342, 385-406`
- [ ] Varm eller kald: `neck-orb-pulse` kjører `infinite` — evighetsbevegelse i hvile — `src/screens/VarmEllerKaldScreen.tsx:384`
- [ ] Tog-guide: fem hex-literaler bak `--zone-*`-tokens som ikke er deklarert noe sted → fast farge i begge tema — `src/screens/TogGuideScreen.tsx` (zone-fallbacks, linje ikke oppgitt i revisjonen)

### BØR RETTES

Systemiske — én operasjon på tvers av mange skjermer:

- [ ] Migrer legacy-tokens til `--dw-*` (T-01) — Påkledning, Onboarding, Juster `:989-1000`, Familie `:133`, Plaggbibliotek `:138`, MinGarderobe, Varm/kald, Tog, Vinterprogram
- [ ] `var(--font-sans)` → `var(--dw-font-ui)`: 9 skjermer rendres i systemfont mens Hjem står i Schibsted — `src/screens/FinnAntrekkScreen.tsx:996` + samme mønster i Innstillinger, TogGuide, VarmEllerKald, Vinterprogram, Plaggbibliotek, MinGarderobe, PlaggDetailSheet
- [ ] Dybdekontrakt: egne skyggestabler → `var(--dw-depth-*)` — `UkeScreen.css:158, 273, 437`, `SnartPlan.css:20`, `FinnAntrekkScreen.tsx:1126, 1218`, `InnstillingerScreen.tsx:260, 918`, `OnboardingScreen.tsx:1697`, `PlaggbibliotekScreen.tsx:630, 724`, `TogGuideScreen.tsx:428, 607, 712`, `VarmEllerKaldScreen.tsx:207, 298`, `MinGarderobeScreen.tsx:186`
- [ ] Lyslogikk på hver hevet flate (inset topplys + `::before` kantlys + depth) — `UkeScreen.css:76, 310`, `PaakledningScreen.tsx:518, 544`, `InnstillingerScreen.tsx:260, 410`, `OnboardingScreen.tsx:1456`, `vertical-gauge.css:233`, `PlaggbibliotekScreen.tsx:778`, `MinGarderobeScreen.tsx:373`, `VarmEllerKaldScreen.tsx:203, 295`, `TogGuideScreen.tsx:428, 710`
- [ ] Typeskala → `var(--dw-text-*)`; ~150 rå font-size i 10 skjermer — `PaakledningScreen.tsx:1016`, `UkeScreen.css:207`, `FinnAntrekkScreen.tsx:1076`, `InnstillingerScreen.tsx:322`, `OnboardingScreen.tsx:1173`, `PlaggbibliotekScreen.tsx:237`, `MinGarderobeScreen.tsx:156`, `VarmEllerKaldScreen.tsx:629`, `TogGuideScreen.tsx:379`, `VinterprogramScreen.tsx:479`
- [ ] Bevegelse → `var(--dw-m-*) var(--dw-ease)`; 0 forbruk utenfor Hjem — `FinnAntrekkScreen.tsx:320`, `PlaggbibliotekScreen.tsx:714`, `MinGarderobeScreen.tsx:400`, `VarmEllerKaldScreen.tsx:171`, `TogGuideScreen.tsx:617`, `VinterprogramScreen.tsx:416`, `PlanChangeRail.css:175`
- [ ] Plaggplate → `var(--dw-plate)` + `--dw-plate-kant` + `--dw-depth-selected` — `PlaggbibliotekScreen.tsx:840`, `OnboardingScreen.tsx:1056`, `TogGuideScreen.tsx:734`, `VarmEllerKaldScreen.tsx:470`, `UkeScreen.css:436`
- [ ] Bunn-fade `mask-image` på hver scroll-container — `PaakledningScreen.tsx:941`, `InnstillingerScreen.tsx:229` (+ 9 dialoger), `PlaggbibliotekScreen.tsx:342`, `MinGarderobeScreen.tsx:341`, `VarmEllerKaldScreen.tsx:191`, `TogGuideScreen.tsx:359`, `VinterprogramScreen.tsx:339`
- [ ] `var(--dw-tabbar-clearance)` i stedet for gjettede tall — `InnstillingerScreen.tsx:236` (110), `MinGarderobeScreen.tsx:342` (110), `TogGuideScreen.tsx:362` (40), `VinterprogramScreen.tsx:341` (120), `VarmEllerKaldScreen.tsx:130` (100vh spiser klaringen)
- [ ] `:focus-visible` med `var(--dw-focus)` på skjermrot — `InnstillingerScreen.tsx:4628` (`outline:'none'` uten erstatning), `FinnAntrekkScreen.tsx:696`, `TogGuideScreen.tsx:881-884, 1013, 1063` (feil token + `onFocus`), `TogGuideScreen.tsx:622` (slideren har ingen ring i det hele tatt), `PaakledningScreen.tsx:288-292` (feil token), Varm/kald (ingen)
- [ ] Fraunces kun på hero-temperatur og pris — `PaakledningScreen.tsx:509`, `OnboardingScreen.tsx:1587`, `PlaggbibliotekScreen.tsx:235`, `MinGarderobeScreen.tsx:155`, `VarmEllerKaldScreen.tsx:251`, `TogGuideScreen.tsx:670`
- [ ] `font-variant-numeric: tabular-nums` på alle tallbærere — `PaakledningScreen.tsx:529`, `InnstillingerScreen.tsx:2049`, `OnboardingScreen.tsx:1477`, `PlaggbibliotekScreen.tsx:244`, `MinGarderobeScreen.tsx:229`, `TogGuideScreen.tsx:1037`, `VinterprogramScreen.tsx:380`, `FinnAntrekkScreen.tsx:1266`
- [ ] `rgba(0,0,0,*)` → `var(--dw-sh-*)` — `UkeScreen.css:158, 228, 273, 437`, `SnartPlan.css:20`, `PaakledningScreen.tsx:932`, `InnstillingerScreen.tsx:918`, `TogGuideScreen.tsx:576`, `vertical-gauge.css:83-85, 95, 165`
- [ ] Radhøyde ≥ 62 px — `InnstillingerScreen.tsx:276` (52), `MinGarderobeScreen.tsx:391` (60), `VinterprogramScreen.tsx:405` (60), `PaakledningScreen.tsx:1009` (56), `TogGuideScreen.tsx:718` (44 deklarert)
- [ ] Amber brukt som brødtekst eller dekorasjon — `TogGuideScreen.tsx:383, 401, 679, 774`, `VarmEllerKaldScreen.tsx:75, 245`, `InnstillingerScreen.tsx:4639, 2362`, `MinGarderobeScreen.tsx:274, 292`, `PlanChangeRail.css:103, 114, 135`, `OnboardingScreen.tsx:1114, 1753`
- [ ] Petrol/vær-tokens utenfor instrumentet — `PaakledningScreen.tsx:110-112`, `PlaggbibliotekScreen.tsx:136-137`, `TogGuideScreen.tsx:858-863`
- [ ] Åpne portene mot `src/`: doktrine-linten leser bare mocks, bevegelsesdetektoren bare `.css` — `tools/design-doctrine-lint.mjs:24`, `src/styles/__tests__/design-tokens-v2.motion.test.ts:394`

Enkeltmålte defekter:

- [ ] Juster: gauge-fyll mot spor 1,02–1,31:1 i kjerneområdet −20 til 0 °C; ingen synlig håndtak — `src/components/instrument/vertical-gauge.css:82, 214`
- [ ] Juster: scan bytter hele panelflaten uten høydegulv, ~74 px hopp i trykkøyeblikket — `src/screens/FinnAntrekkScreen.tsx:742-748`
- [ ] Juster: instrumentets værnyanse hardkodet `'cloudy'`, og «Oppdatert nå» + barnets navn i stedsfeltet — `src/screens/FinnAntrekkScreen.tsx:750-751, 773`
- [ ] Planlegg: dagslinjens vertikale ryggrad 1,97:1 lys / 2,91:1 mørk — `src/components/planning/PlanChangeRail.css:26`
- [ ] Planlegg: «Ingen endringer frem til kl. 12:00» på 10-dagersfanen — `src/screens/UkeScreen.tsx:917, 1054`
- [ ] Onboarding: vitrinekortenes skygger inverterer i mørk modus — `src/screens/OnboardingScreen.tsx:1106, 1650, 1656`
- [ ] Onboarding: aktiv rad i sted-comboboxen måler 1,00:1 lys / 1,13:1 mørk — `src/screens/OnboardingScreen.tsx:1446`
- [ ] Varm/kald: `<picture>` velger mørk asset når bruker har valgt Lys på mørkt OS — `src/screens/VarmEllerKaldScreen.tsx:402, 466`
- [ ] Varm/kald: begge illustrasjoner har mørkt RGB-residue i alfa-kanten (100 % av alfa=0-piksler) — `public/illustrations/sjekk-nakke.png` + `-dark.png`
- [ ] Sydvesten mangler manuell maske — `public/monter/plagg-sydvest.png`
- [ ] Vinterprogram: progresjonstelleren viser «Uke 5 av 8» for gratisbrukere som bare har tilgang til uke 1 — `src/screens/VinterprogramScreen.tsx:214`
- [ ] Død knapp «Vis forrige antrekk» med tom `onClick` på Hjems feilskjerm — `src/components/hjem/` (kjent defekt)
- [ ] Min garderobe: avgjør sletting eller port — 932 linjer umontert kode med 7 defekter av blokkerende klasse — `src/screens/MinGarderobeScreen.tsx`, låst av `guide-routing.test.tsx:27`

### KOSMETISK

- [ ] `grid-template-rows` animeres (layout-egenskap uten portgodkjenning) — `PaakledningScreen.tsx:1024`, `PlanChangeRail.css:175`, `vertical-gauge.css:105`
- [ ] 20 døde CSS-klasser + 4 døde tokens, inkl. hel kalendermodul — `src/screens/OnboardingScreen.tsx:1396`
- [ ] Død keyframe `varmkald-pulse` med F60-oransje som ikke finnes i paletten — `src/screens/VarmEllerKaldScreen.tsx:373-376`
- [ ] To gradienter som ikke gradierer (identiske stopp) — `InnstillingerScreen.tsx:511`, `PlaggbibliotekScreen.tsx:840`
- [ ] `backdrop-filter: blur(14px)` på ugjennomsiktig flate — koster GPU, gjør ingenting — `MinGarderobeScreen.tsx:373`
- [ ] Emoji som barneavatar ved siden av clay-rendrede plagg — `MinGarderobeScreen.tsx:786`
- [ ] Radkaskaden på Juster mangler forskyvning (`animationDelayMs={null}`) — `FinnAntrekkScreen.tsx:933`

## 4. Mønstre

Det er **ett** problem, ikke ti. Kontraktene ble skrevet ferdig, men aldri forbrukt: `grep var(--dw-depth-` gir 6 treff i hele `src/`, alle i `hjem-monter.css`. Samme bilde for `--dw-plate`, `--dw-edge-light-gradient`, `--dw-text-*` og `--dw-m-*`. Hjem er ikke bare referanse — den er eneste forbruker.

Det kunne skje stille fordi portapparatet ikke ser koden: doktrine-linten leser `docs/mocks/monter/*.html`, bevegelsesdetektoren leser bare `.css`, og seks av elleve skjermer har ingen CSS-fil i det hele tatt — stilene ligger som inline `CSSProperties` i `.tsx`. Alle skjermene består derfor portene ved fravær, ikke ved kvalitet.

Legacy-alias-laget i `design-tokens.css` gjør at fargene lander riktig i mørk modus og skjuler at lys modus aldri ble kalibrert. Nesten hver eneste målte kontrastfeil i denne revisjonen er i lys modus, og ingen av dem ville blitt fanget av et hex-grep — de er alle `var()`-baserte.

**Svaret på spørsmålet ditt: nei, det tar ikke like lang tid per side.** Sytten av linjene over er søk-og-erstatt på tvers av ni skjermer, ikke ni separate oppgaver. To av dem er én linje hver i tokenfilen og retter målte feil på flere skjermer samtidig.

**Bedre enn ventet:** a11y-modellen på Påkledning er reelt implementert (inert under reveal, ordinal i tilgjengelig navn, native dialog med focus-trap). Planlegg består kontrastmatrisen på 20 av 22 par, og lys-symmetrien mellom de to lys-inngangene er helt tom i begge retninger. Vinterprogram har alle 13 tekst/flate-par over 4,5:1 i begge tema. Motoren under skjermene er gjennomgående i orden — tellere og alternativer deriveres fra store, ingen oppdiktet status noe sted.

## 5. Rekkefølge

1. **De to tokenlinjene + Hjems CTA-fold.** `--dw-depth-action` og `--dw-accent-300` retter målte feil på fire skjermer med to linjer. Alt annet arbeid måles mot Hjem, så Hjem må være sann først.
2. **Åpne portene mot `src/`** (doktrine-linten + bevegelsesdetektoren på `.tsx`). Uten dette er hver retting i punkt 3 usynlig for CI og kommer tilbake — feilklassen har allerede gjentatt seg sju ganger.
3. **Kjør token-migreringen som ÉN runde over alle ni skjermer**, ikke ni runder. Den lukker T-01, TX-05, TX-06, B-01, D-01, D-06, D-11 og D-14 samtidig. Flytt stilene ut av `.tsx` der det trengs — `::before`-kantlys og `:focus-visible` kan ikke uttrykkes inline uansett.
4. **Ta Påkledning-avgjørelsen.** Det er kjerneleveransen, 18 % av vekten, og står på 32 % fordi halve filen er død kode og den levende halvdelen ikke er stylet. Ingen migrering hjelper før du har valgt hvilken gren som er skjermen.
5. **De fire målte feilene i Juster** (opacity-demoteringen, skip-knappen, stale-låsen, gauge-kontrasten). Det er den eneste skjermen der brukeren faktisk kan bli stående fast eller lese noe som ikke er lesbart.
