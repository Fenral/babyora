# Skjermmanifest

> **GENERERT FIL — IKKE REDIGER FOR HÅND.**
> Regenerer med `node tools/skjermmanifest.mjs --skriv`.
> Kun unntakene skrives for hånd, i `docs/design-notes/skjermmanifest.unntak.json`.
> Håndhevet av `src/styles/__tests__/skjermmanifest.test.ts`, som feiler
> hvis denne filen avviker fra det generatoren utleder av koden.

Kilder: `src/screens/*.tsx` (fasit) krysset mot ruterens fem kilder —
`lazy()`-registeret, `routeKey`-tildelingene, `Drill`-unionen, `src/types/nav.ts`
og ett hopp videre gjennom skjermer som rendrer andre skjermer.
Funnpunktene er løftet fra `docs/design-notes/lanseringsstatus-2026-08-03.md`.

## 1. Tallene

| | |
|---|---|
| Shipping-skjermer på disk | **11** |
| Migreres i fase 3 | **9** |
| Unntatt fra fase 3 | **2** |
| Av fase 3-kohorten: fortsatt umigrert | **7** |
| Eierrapporterte punkter (ALDRI baselinet) | **2** |

## 2. Skjermene

| Skjerm | Filsti | Linjer | Stilflate | `--dw-*` | legacy | Nås via | Migreres | Fase |
|---|---|---:|---|---:|---:|---|---|---|
| Familie (skall) | `src/screens/FamilieScreen.tsx` | 21 | — | 0 | 0 | App.tsx lazy()-register | nei | — |
| Finn antrekk / Juster | `src/screens/FinnAntrekkScreen.tsx` | 1511 | 20 CSSProperties + 4 `style={{` | 62 | 0 | App.tsx lazy()-register | ja | 3 |
| Hjem (referanse) | `src/screens/HjemScreen.tsx` | 1274 | 1 `<style>` + 23 CSSProperties + 6 `style={{` | 11 | 22 | App.tsx lazy()-register | ja | 3 |
| Innstillinger | `src/screens/InnstillingerScreen.tsx` | 6467 | 190 CSSProperties + 53 `style={{` | 337 | 5 | rendres av FamilieScreen.tsx | ja | 3 |
| Onboarding | `src/screens/OnboardingScreen.tsx` | 2009 | 1 CSSProperties | 240 | 34 | App.tsx lazy()-register | ja | 3 |
| Påkledning | `src/screens/PaakledningScreen.tsx` | 445 | — | 0 | 0 | App.tsx lazy()-register | nei | 4 |
| Plaggbibliotek | `src/screens/PlaggbibliotekScreen.tsx` | 1105 | 1 `<style>` + 1 CSSProperties + 12 `style={{` | 101 | 4 | App.tsx lazy()-register | ja | 3 |
| Tog-guide | `src/screens/TogGuideScreen.tsx` | 1236 | 53 CSSProperties + 3 `style={{` | 126 | 11 | App.tsx lazy()-register | ja | 3 |
| Planlegg / Uke | `src/screens/UkeScreen.tsx` | 1130 | `UkeScreen.css` + 1 CSSProperties | 134 | 0 | App.tsx lazy()-register | ja | 3 |
| Varm eller kald | `src/screens/VarmEllerKaldScreen.tsx` | 910 | 1 `<style>` + 29 CSSProperties + 4 `style={{` | 89 | 2 | App.tsx lazy()-register | ja | 3 |
| Vinterprogram | `src/screens/VinterprogramScreen.tsx` | 646 | 29 CSSProperties + 2 `style={{` | 74 | 3 | App.tsx lazy()-register | ja | 3 |

«legacy» = antall UNIKE `var(--…)` som ikke er `--dw-*`. «Stilflate» teller
kommentarstrippet kilde: egen `.css`-fil, `<style>{`-blokker, `CSSProperties`-
objekter og `style={{`-attributter. 10 av 11 skjermer har ingen CSS-fil.

| Skjerm | Migreringsgjeld i dag |
|---|---|
| Familie (skall) | ingen stilflate — ingenting å migrere |
| Finn antrekk / Juster | migrert |
| Hjem (referanse) | umigrert (22 legacy-token, 0 rå hex, 11 `--dw-*`) |
| Innstillinger | umigrert (5 legacy-token, 7 rå hex, 337 `--dw-*`) |
| Onboarding | umigrert (34 legacy-token, 1 rå hex, 240 `--dw-*`) |
| Påkledning | ingen stilflate — ingenting å migrere |
| Plaggbibliotek | umigrert (4 legacy-token, 0 rå hex, 101 `--dw-*`) |
| Tog-guide | umigrert (11 legacy-token, 0 rå hex, 126 `--dw-*`) |
| Planlegg / Uke | migrert |
| Varm eller kald | umigrert (2 legacy-token, 0 rå hex, 89 `--dw-*`) |
| Vinterprogram | umigrert (3 legacy-token, 0 rå hex, 74 `--dw-*`) |

## 3. Unntakene (håndskrevet)

### Familie (skall) — `src/screens/FamilieScreen.tsx`

Ansvarlig fase: **—**. 21-linjers passthrough uten egen stilflate: null CSS-fil, null <style>-blokk, null CSSProperties, null var(). Den rendrer InnstillingerScreen og har bokstavelig talt ingenting aa migrere. Flaten brukeren ser migreres som InnstillingerScreen.

### Påkledning — `src/screens/PaakledningScreen.tsx`

Ansvarlig fase: **4**. Gjenoppbygges, ikke migreres. Eiervedtak 2026-08-04 («Dette kan du bare slette» + «Ingen av disse var de vi jobbet med i gaar») felte BEGGE de gamle grenene - PlannedPaakledningScreen og CurrentPaakledningScreen ligger i samme fil. Aa migrere tokens i kode som skal slettes er sloesing. Se vedtak paakledning-gjenoppbygges og kle-paa-stepper.

### Tilleggsansvar utover fase 3

- `src/screens/InnstillingerScreen.tsx` → fase 6A: Innstillinger-revisjonen falt ut paa en API-feil 2026-08-03 og mangler i tallgrunnlaget (lanseringsstatusen sier det selv, linje 9). Skjermen er 6230 linjer med 190 CSSProperties-objekter og 0 var(--dw-*) - den STOERSTE umaalte flaten i appen. Revisjonen kjores paa nytt i fase 6A og funnene foeres inn i dette manifestet. Det er ogsaa denne skjermen som forsvinner helt hvis noen genererer skjermlista fra lazy()-registeret.

### Heldekkende flater som IKKE er skjermer

De står i ingen av de fem rutekildene og er derfor eksplisitte unntak, ikke
utelatelser — de skal ikke dukke opp som en falsk 12. skjerm.

- `src/screens/onboarding/OnboardingBabyHero.tsx` — Heldekkende hero-flate INNE i OnboardingScreen sitt foerste steg. Ligger i en underkatalog og fanges derfor ikke av src/screens/*.tsx. Har ingen rutenoekkel og kan ikke naas direkte.
- `src/components/AppPaywallGate.tsx` — Ikke-avviselig native <dialog> mountet OVER hele tab-routingen (App.tsx:716). Dekker skjermen helt, men er en gate over ruteren - ikke en rute.
- `src/components/PaywallDialog.tsx` — Heldekkende ark aapnet fra flere skjermer. Samme klasse som AppPaywallGate: overlay, ikke rute.

## 4. Eierrapporterte punkter — utenfor gulvet

Eierrapporterte funn kan ALDRI baselines. De telles her, aldri i baseline-
gulvet, og lukkes først når vedtaket står `laast` i `vedtak.json`.

- `src/screens/PaakledningScreen.tsx` — **paakledning-gjenoppbygges** (status `uportert-sjekk`)
  - BEGGE de gamle Paakledning-grenene (antrekkskartet og listen) slettes. Skjermen gjenoppbygges i monter-spraket fra Hjem: plaggrader med utskarne bilder, plater, vaerstripe, dybdekontrakt. Ingen av grenene var arbeidet fra 2026-08-03.
  - kilde: eier 2026-08-04: «Dette kan du bare slette» + «Ingen av disse var de vi jobbet med i gar» — begge variantene vist pa telefon forst
- `src/screens/PaakledningScreen.tsx` — **kle-paa-stepper** (status `brutt`)
  - Etter CTA og resultat skal hvert plagg komme opp ETT OM GANGEN med «Neste» eller sveip (Kle paa-stepperen). Ett materialpoeng per steg, Bytt-inngang som hevet rad, «Hopp over» finnes ikke.
  - kilde: eier 2026-08-04: «Hvert plagg kom opp med Neste eller swipe etter CTA» + art bible «Kle pa: plagginfo per steg» og «swipe finnes KUN i Kle pa-stegene»

## 5. Funnpunkter per skjerm

Løftet fra lanseringsstatusen som konkrete fil/linje-punkter — T-01-lista,
adresselista (skyggestabler → `--dw-depth-*`) og kosmetisk-lista inkludert.
Et punkt havner på den skjermen lanseringsstatusen faktisk NAVNGIR. Hjem har
null punkter her fordi hele gjelden dens er adressert til
`src/components/hjem/` og `hjem-monter.css` — ikke fordi skjermen er ren.

### Familie (skall) — `src/screens/FamilieScreen.tsx`

Ingen punkter i lanseringsstatusen.

### Finn antrekk / Juster — `src/screens/FinnAntrekkScreen.tsx`

- [ ] **BLOKKERER** `src/screens/FinnAntrekkScreen.tsx:1190-1195` — Juster: demotert resultat dimmes til `opacity 0.55` → 2,31–3,89:1 i BEGGE tema, permanent tilstand
- [ ] **BLOKKERER** `src/screens/FinnAntrekkScreen.tsx:96` — Juster: seremonien har ingen skip-knapp og ingen aria-live (`ScanStatusBlock` aldri importert)
- [ ] **BØR RETTES** _(T-01)_ `src/screens/FinnAntrekkScreen.tsx:989-1000` — Migrer legacy-tokens til `--dw-*` (T-01)
- [ ] **BØR RETTES** `src/screens/FinnAntrekkScreen.tsx:996` — `var(--font-sans)` → `var(--dw-font-ui)`: 9 skjermer rendres i systemfont mens Hjem står i Schibsted
- [ ] **BØR RETTES** _(adresseliste)_ `src/screens/FinnAntrekkScreen.tsx:1126` — Dybdekontrakt: egne skyggestabler → `var(--dw-depth-*)`
- [ ] **BØR RETTES** `src/screens/FinnAntrekkScreen.tsx:1076` — Typeskala → `var(--dw-text-*)`; ~150 rå font-size i 10 skjermer
- [ ] **BØR RETTES** `src/screens/FinnAntrekkScreen.tsx:320` — Bevegelse → `var(--dw-m-*) var(--dw-ease)`; 0 forbruk utenfor Hjem
- [ ] **BØR RETTES** `src/screens/FinnAntrekkScreen.tsx:696` — `:focus-visible` med `var(--dw-focus)` på skjermrot
- [ ] **BØR RETTES** `src/screens/FinnAntrekkScreen.tsx:1266` — `font-variant-numeric: tabular-nums` på alle tallbærere
- [ ] **BØR RETTES** `src/screens/FinnAntrekkScreen.tsx:742-748` — Juster: scan bytter hele panelflaten uten høydegulv, ~74 px hopp i trykkøyeblikket
- [ ] **BØR RETTES** `src/screens/FinnAntrekkScreen.tsx:750-751` — Juster: instrumentets værnyanse hardkodet `'cloudy'`, og «Oppdatert nå» + barnets navn i stedsfeltet
- [ ] **KOSMETISK** `src/screens/FinnAntrekkScreen.tsx:933` — Radkaskaden på Juster mangler forskyvning (`animationDelayMs={null}`)

### Hjem (referanse) — `src/screens/HjemScreen.tsx`

Ingen punkter i lanseringsstatusen.

### Innstillinger — `src/screens/InnstillingerScreen.tsx`

- [ ] **BØR RETTES** _(T-01)_ `src/screens/InnstillingerScreen.tsx:133` — Migrer legacy-tokens til `--dw-*` (T-01)
- [ ] **BØR RETTES** _(adresseliste)_ `src/screens/InnstillingerScreen.tsx:260` — Dybdekontrakt: egne skyggestabler → `var(--dw-depth-*)`
- [ ] **BØR RETTES** `src/screens/InnstillingerScreen.tsx:260` — Lyslogikk på hver hevet flate (inset topplys + `::before` kantlys + depth)
- [ ] **BØR RETTES** `src/screens/InnstillingerScreen.tsx:322` — Typeskala → `var(--dw-text-*)`; ~150 rå font-size i 10 skjermer
- [ ] **BØR RETTES** `src/screens/InnstillingerScreen.tsx:229` — Bunn-fade `mask-image` på hver scroll-container
- [ ] **BØR RETTES** `src/screens/InnstillingerScreen.tsx:236` — `var(--dw-tabbar-clearance)` i stedet for gjettede tall
- [ ] **BØR RETTES** `src/screens/InnstillingerScreen.tsx:4628` — `:focus-visible` med `var(--dw-focus)` på skjermrot
- [ ] **BØR RETTES** `src/screens/InnstillingerScreen.tsx:2049` — `font-variant-numeric: tabular-nums` på alle tallbærere
- [ ] **BØR RETTES** `src/screens/InnstillingerScreen.tsx:918` — `rgba(0,0,0,*)` → `var(--dw-sh-*)`
- [ ] **BØR RETTES** `src/screens/InnstillingerScreen.tsx:276` — Radhøyde ≥ 62 px
- [ ] **BØR RETTES** `src/screens/InnstillingerScreen.tsx:4639` — Amber brukt som brødtekst eller dekorasjon
- [ ] **KOSMETISK** `src/screens/InnstillingerScreen.tsx:511` — To gradienter som ikke gradierer (identiske stopp)

### Onboarding — `src/screens/OnboardingScreen.tsx`

- [ ] **BLOKKERER** `src/screens/OnboardingScreen.tsx:1222` — Onboarding steg 1: maskotskyggen henter `--ink-900` og blir en krem glorie i mørk modus (standardtema, førsteinntrykk)
- [ ] **BØR RETTES** _(T-01)_ `src/screens/OnboardingScreen.tsx` — Migrer legacy-tokens til `--dw-*` (T-01)
- [ ] **BØR RETTES** _(adresseliste)_ `src/screens/OnboardingScreen.tsx:1697` — Dybdekontrakt: egne skyggestabler → `var(--dw-depth-*)`
- [ ] **BØR RETTES** `src/screens/OnboardingScreen.tsx:1456` — Lyslogikk på hver hevet flate (inset topplys + `::before` kantlys + depth)
- [ ] **BØR RETTES** `src/screens/OnboardingScreen.tsx:1173` — Typeskala → `var(--dw-text-*)`; ~150 rå font-size i 10 skjermer
- [ ] **BØR RETTES** `src/screens/OnboardingScreen.tsx:1056` — Plaggplate → `var(--dw-plate)` + `--dw-plate-kant` + `--dw-depth-selected`
- [ ] **BØR RETTES** `src/screens/OnboardingScreen.tsx:1587` — Fraunces kun på hero-temperatur og pris
- [ ] **BØR RETTES** `src/screens/OnboardingScreen.tsx:1477` — `font-variant-numeric: tabular-nums` på alle tallbærere
- [ ] **BØR RETTES** `src/screens/OnboardingScreen.tsx:1114` — Amber brukt som brødtekst eller dekorasjon
- [ ] **BØR RETTES** `src/screens/OnboardingScreen.tsx:1106` — Onboarding: vitrinekortenes skygger inverterer i mørk modus
- [ ] **BØR RETTES** `src/screens/OnboardingScreen.tsx:1446` — Onboarding: aktiv rad i sted-comboboxen måler 1,00:1 lys / 1,13:1 mørk
- [ ] **KOSMETISK** `src/screens/OnboardingScreen.tsx:1396` — 20 døde CSS-klasser + 4 døde tokens, inkl. hel kalendermodul

### Påkledning — `src/screens/PaakledningScreen.tsx`

- [ ] **BLOKKERER** `src/screens/PaakledningScreen.tsx:453` — Påkledning: avgjør hvilken av de to grenene som ER skjermen; den levende er inline-stylet og `.outfit-truth-panel` har ingen CSS-regel i hele `src/`
- [ ] **BØR RETTES** _(T-01)_ `src/screens/PaakledningScreen.tsx` — Migrer legacy-tokens til `--dw-*` (T-01)
- [ ] **BØR RETTES** `src/screens/PaakledningScreen.tsx:518` — Lyslogikk på hver hevet flate (inset topplys + `::before` kantlys + depth)
- [ ] **BØR RETTES** `src/screens/PaakledningScreen.tsx:1016` — Typeskala → `var(--dw-text-*)`; ~150 rå font-size i 10 skjermer
- [ ] **BØR RETTES** `src/screens/PaakledningScreen.tsx:941` — Bunn-fade `mask-image` på hver scroll-container
- [ ] **BØR RETTES** `src/screens/PaakledningScreen.tsx:288-292` — `:focus-visible` med `var(--dw-focus)` på skjermrot
- [ ] **BØR RETTES** `src/screens/PaakledningScreen.tsx:509` — Fraunces kun på hero-temperatur og pris
- [ ] **BØR RETTES** `src/screens/PaakledningScreen.tsx:529` — `font-variant-numeric: tabular-nums` på alle tallbærere
- [ ] **BØR RETTES** `src/screens/PaakledningScreen.tsx:932` — `rgba(0,0,0,*)` → `var(--dw-sh-*)`
- [ ] **BØR RETTES** `src/screens/PaakledningScreen.tsx:1009` — Radhøyde ≥ 62 px
- [ ] **BØR RETTES** `src/screens/PaakledningScreen.tsx:110-112` — Petrol/vær-tokens utenfor instrumentet
- [ ] **KOSMETISK** `src/screens/PaakledningScreen.tsx:1024` — `grid-template-rows` animeres (layout-egenskap uten portgodkjenning)

### Plaggbibliotek — `src/screens/PlaggbibliotekScreen.tsx`

- [ ] **BLOKKERER** `src/screens/PlaggbibliotekScreen.tsx:342` — Plaggbibliotek: FAB og siste rad ligger bak tab-baren (ingen `--dw-tabbar-clearance`)
- [ ] **BØR RETTES** _(T-01)_ `src/screens/PlaggbibliotekScreen.tsx:138` — Migrer legacy-tokens til `--dw-*` (T-01)
- [ ] **BØR RETTES** _(adresseliste)_ `src/screens/PlaggbibliotekScreen.tsx:630` — Dybdekontrakt: egne skyggestabler → `var(--dw-depth-*)`
- [ ] **BØR RETTES** `src/screens/PlaggbibliotekScreen.tsx:778` — Lyslogikk på hver hevet flate (inset topplys + `::before` kantlys + depth)
- [ ] **BØR RETTES** `src/screens/PlaggbibliotekScreen.tsx:237` — Typeskala → `var(--dw-text-*)`; ~150 rå font-size i 10 skjermer
- [ ] **BØR RETTES** `src/screens/PlaggbibliotekScreen.tsx:714` — Bevegelse → `var(--dw-m-*) var(--dw-ease)`; 0 forbruk utenfor Hjem
- [ ] **BØR RETTES** `src/screens/PlaggbibliotekScreen.tsx:840` — Plaggplate → `var(--dw-plate)` + `--dw-plate-kant` + `--dw-depth-selected`
- [ ] **BØR RETTES** `src/screens/PlaggbibliotekScreen.tsx:342` — Bunn-fade `mask-image` på hver scroll-container
- [ ] **BØR RETTES** `src/screens/PlaggbibliotekScreen.tsx:235` — Fraunces kun på hero-temperatur og pris
- [ ] **BØR RETTES** `src/screens/PlaggbibliotekScreen.tsx:244` — `font-variant-numeric: tabular-nums` på alle tallbærere
- [ ] **BØR RETTES** `src/screens/PlaggbibliotekScreen.tsx:136-137` — Petrol/vær-tokens utenfor instrumentet
- [ ] **KOSMETISK** `src/screens/PlaggbibliotekScreen.tsx:840` — To gradienter som ikke gradierer (identiske stopp)

### Tog-guide — `src/screens/TogGuideScreen.tsx`

- [ ] **BLOKKERER** `src/screens/TogGuideScreen.tsx` — Tog-guide: fem hex-literaler bak `--zone-*`-tokens som ikke er deklarert noe sted → fast farge i begge tema
- [ ] **BØR RETTES** _(T-01)_ `src/screens/TogGuideScreen.tsx` — Migrer legacy-tokens til `--dw-*` (T-01)
- [ ] **BØR RETTES** _(adresseliste)_ `src/screens/TogGuideScreen.tsx:428` — Dybdekontrakt: egne skyggestabler → `var(--dw-depth-*)`
- [ ] **BØR RETTES** `src/screens/TogGuideScreen.tsx:428` — Lyslogikk på hver hevet flate (inset topplys + `::before` kantlys + depth)
- [ ] **BØR RETTES** `src/screens/TogGuideScreen.tsx:379` — Typeskala → `var(--dw-text-*)`; ~150 rå font-size i 10 skjermer
- [ ] **BØR RETTES** `src/screens/TogGuideScreen.tsx:617` — Bevegelse → `var(--dw-m-*) var(--dw-ease)`; 0 forbruk utenfor Hjem
- [ ] **BØR RETTES** `src/screens/TogGuideScreen.tsx:734` — Plaggplate → `var(--dw-plate)` + `--dw-plate-kant` + `--dw-depth-selected`
- [ ] **BØR RETTES** `src/screens/TogGuideScreen.tsx:359` — Bunn-fade `mask-image` på hver scroll-container
- [ ] **BØR RETTES** `src/screens/TogGuideScreen.tsx:362` — `var(--dw-tabbar-clearance)` i stedet for gjettede tall
- [ ] **BØR RETTES** `src/screens/TogGuideScreen.tsx:881-884` — `:focus-visible` med `var(--dw-focus)` på skjermrot
- [ ] **BØR RETTES** `src/screens/TogGuideScreen.tsx:622` — `:focus-visible` med `var(--dw-focus)` på skjermrot
- [ ] **BØR RETTES** `src/screens/TogGuideScreen.tsx:670` — Fraunces kun på hero-temperatur og pris
- [ ] **BØR RETTES** `src/screens/TogGuideScreen.tsx:1037` — `font-variant-numeric: tabular-nums` på alle tallbærere
- [ ] **BØR RETTES** `src/screens/TogGuideScreen.tsx:576` — `rgba(0,0,0,*)` → `var(--dw-sh-*)`
- [ ] **BØR RETTES** `src/screens/TogGuideScreen.tsx:718` — Radhøyde ≥ 62 px
- [ ] **BØR RETTES** `src/screens/TogGuideScreen.tsx:383` — Amber brukt som brødtekst eller dekorasjon
- [ ] **BØR RETTES** `src/screens/TogGuideScreen.tsx:858-863` — Petrol/vær-tokens utenfor instrumentet

### Planlegg / Uke — `src/screens/UkeScreen.tsx`

- [ ] **BLOKKERER** `src/screens/UkeScreen.css:436` — `UkeScreen.css:436`: hardkodet `#3A2A1A` på plaggplaten.
- [ ] **BLOKKERER** `src/screens/UkeScreen.css:436` — Planlegg: hardkodet `#3A2A1A` på plaggplaten → mørke firkanter i lys modus + 2,24:1 bokstav-fallback
- [ ] **BØR RETTES** _(adresseliste)_ `src/screens/UkeScreen.css:158` — Dybdekontrakt: egne skyggestabler → `var(--dw-depth-*)`
- [ ] **BØR RETTES** `src/screens/UkeScreen.css:76` — Lyslogikk på hver hevet flate (inset topplys + `::before` kantlys + depth)
- [ ] **BØR RETTES** `src/screens/UkeScreen.css:207` — Typeskala → `var(--dw-text-*)`; ~150 rå font-size i 10 skjermer
- [ ] **BØR RETTES** `src/screens/UkeScreen.css:436` — Plaggplate → `var(--dw-plate)` + `--dw-plate-kant` + `--dw-depth-selected`
- [ ] **BØR RETTES** `src/screens/UkeScreen.css:158` — `rgba(0,0,0,*)` → `var(--dw-sh-*)`
- [ ] **BØR RETTES** `src/screens/UkeScreen.tsx:917` — Planlegg: «Ingen endringer frem til kl. 12:00» på 10-dagersfanen

### Varm eller kald — `src/screens/VarmEllerKaldScreen.tsx`

- [ ] **BLOKKERER** `src/screens/VarmEllerKaldScreen.tsx:384` — Varm eller kald: `neck-orb-pulse` kjører `infinite`
- [ ] **BØR RETTES** _(T-01)_ `src/screens/VarmEllerKaldScreen.tsx` — Migrer legacy-tokens til `--dw-*` (T-01)
- [ ] **BØR RETTES** _(adresseliste)_ `src/screens/VarmEllerKaldScreen.tsx:207` — Dybdekontrakt: egne skyggestabler → `var(--dw-depth-*)`
- [ ] **BØR RETTES** `src/screens/VarmEllerKaldScreen.tsx:203` — Lyslogikk på hver hevet flate (inset topplys + `::before` kantlys + depth)
- [ ] **BØR RETTES** `src/screens/VarmEllerKaldScreen.tsx:629` — Typeskala → `var(--dw-text-*)`; ~150 rå font-size i 10 skjermer
- [ ] **BØR RETTES** `src/screens/VarmEllerKaldScreen.tsx:171` — Bevegelse → `var(--dw-m-*) var(--dw-ease)`; 0 forbruk utenfor Hjem
- [ ] **BØR RETTES** `src/screens/VarmEllerKaldScreen.tsx:470` — Plaggplate → `var(--dw-plate)` + `--dw-plate-kant` + `--dw-depth-selected`
- [ ] **BØR RETTES** `src/screens/VarmEllerKaldScreen.tsx:191` — Bunn-fade `mask-image` på hver scroll-container
- [ ] **BØR RETTES** `src/screens/VarmEllerKaldScreen.tsx:130` — `var(--dw-tabbar-clearance)` i stedet for gjettede tall
- [ ] **BØR RETTES** `src/screens/VarmEllerKaldScreen.tsx:251` — Fraunces kun på hero-temperatur og pris
- [ ] **BØR RETTES** `src/screens/VarmEllerKaldScreen.tsx:75` — Amber brukt som brødtekst eller dekorasjon
- [ ] **BØR RETTES** `src/screens/VarmEllerKaldScreen.tsx:402` — Varm/kald: `<picture>` velger mørk asset når bruker har valgt Lys på mørkt OS
- [ ] **KOSMETISK** `src/screens/VarmEllerKaldScreen.tsx:373-376` — Død keyframe `varmkald-pulse` med F60-oransje som ikke finnes i paletten

### Vinterprogram — `src/screens/VinterprogramScreen.tsx`

- [ ] **BØR RETTES** _(T-01)_ `src/screens/VinterprogramScreen.tsx` — Migrer legacy-tokens til `--dw-*` (T-01)
- [ ] **BØR RETTES** `src/screens/VinterprogramScreen.tsx:479` — Typeskala → `var(--dw-text-*)`; ~150 rå font-size i 10 skjermer
- [ ] **BØR RETTES** `src/screens/VinterprogramScreen.tsx:416` — Bevegelse → `var(--dw-m-*) var(--dw-ease)`; 0 forbruk utenfor Hjem
- [ ] **BØR RETTES** `src/screens/VinterprogramScreen.tsx:339` — Bunn-fade `mask-image` på hver scroll-container
- [ ] **BØR RETTES** `src/screens/VinterprogramScreen.tsx:341` — `var(--dw-tabbar-clearance)` i stedet for gjettede tall
- [ ] **BØR RETTES** `src/screens/VinterprogramScreen.tsx:380` — `font-variant-numeric: tabular-nums` på alle tallbærere
- [ ] **BØR RETTES** `src/screens/VinterprogramScreen.tsx:405` — Radhøyde ≥ 62 px
- [ ] **BØR RETTES** `src/screens/VinterprogramScreen.tsx:214` — Vinterprogram: progresjonstelleren viser «Uke 5 av 8» for gratisbrukere som bare har tilgang til uke 1

## 6. Utgåtte referanser i lanseringsstatusen

Filer lanseringsstatusen peker på som ikke lenger finnes. De er droppet fra
punktlistene over — dette er beviset på at et håndskrevet register råtner.

- `public/illustrations/sjekk-nakke.png`
- `public/monter/plagg-sydvest.png`
- `src/screens/MinGarderobeScreen.tsx`

## 7. Rutekildene som ble lest

- `lazy()`-registeret: 10 moduler
- `routeKey`-tildelinger: 8 — `drill:finn-antrekk`, `drill:plaggbib`, `drill:familie-tool:tog`, `drill:familie-tool:varm-kald`, `drill:familie-tool:forste-vinter`, `tab:hjem`, `tab:plan`, `tab:familie`
- `Drill`-unionens kinds: `familie-tool`, `finn-antrekk`, `paakledning`, `plaggbib`
- `TAB_DEFS`: `hjem`, `plan`, `familie`
- `FamilieToolTarget`: `tog`, `varm-kald`, `forste-vinter`
- `GuideTarget`: `tog`, `varm-kald`, `forste-vinter`, `finn-antrekk`, `plaggbib` — `snart` er et planlegg-view, ikke en skjerm
- Navn som KUN står i App.tsx sine kommentarer (strippet bort): `CurrentPaakledningScreen`, `GuideHubScreen`, `PlannedPaakledningScreen`
