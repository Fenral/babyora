# Onboarding imagery — dagens flyt og baseline

**Kandidat:** `03a5c410401f604f58bfd7dcf346a2518ff9b6bb`  
**Viewport:** 390×844 CSS-piksler, DPR 2, Playwright Chromium  
**Viktig avgrensning:** Dette er reproduserbar web-preview-evidens. Det er
ikke fysisk-iPhone-timing, faktisk VoiceOver-test eller menneskelig oppgavetid.

## Faktisk flyt

| # | Flate | Brukerjobb og handling | Data | Media/motion | Avbrudd og fallback |
|---:|---|---|---|---|---|
| 0 | Native/web launch | Ingen handling | Ingen | SVG-ordmerke; opptil 520 ms inn, men flaten slipper når React har malt | 4 s nødutgang; Reduce Motion uten transform |
| 1 | «Hvem kler vi på?» | Navn/kallenavn og `Fortsett` | Navn | 9,4 kB stående maskot; 8 px inn-fade | CTA er umiddelbar; navnet kalles valgfritt, men blir senere påkrevd |
| 2 | Fødselsdato | Velg dato og `Fortsett` | DOB → alder | Samme maskot med kalendermerke | Tilbake; native datovelger; ugyldig dato blokkerer |
| 3 | Hjemsted | Bruk posisjon eller søk, så fortsett | By, lat/lon, ev. nøyaktighet | Samme maskot med stedmerke | Posisjonsfeil åpner manuelt søk; lokalt bysøk virker uten fjernsøk |
| 4 | Sammendrag | Kontroller/endrer, så `Lag første antrekk` | Navn, DOB, sted persisteres lokalt | Samme maskot med klar-merke | Tre editknapper; full disclaimer; tomt navn blokkerer uten forklaring |
| 5 | Velkomst | `Vis dagens antrekk` | Ingen nye | Større maskot, to feature-rader | Sier rådet er klart før beregningen på Hjem er kjørt |
| 6 | Hjem værklar | `Finn dagens antrekk` | Vær, aktivitet og profil | Værscene + hengende maskot | Offline/error har separat sist-kjent/retry-tilstand |
| 7 | Scan → resultat | Vent eller hopp over scan | Ingen nye | 3,2 s funksjonell scan; resultat-rader stagger inn | Reduce Motion forkorter; resultatet er ordnet plaggliste |

## Målt baseline

`tools/onboarding-imagery/capture-baseline.mjs` kjører hele flyten med fast
MET-fixture og eksplisitt geolokasjon. Rådata ligger i
`evidence/onboarding-imagery/baseline/metrics.json`.

| Mål | Lys | Mørk | Tolkning |
|---|---:|---:|---|
| Første synlige, aktive kontroll | 482 ms | 618 ms | Web-preview floor; ingen media blokkerer CTA |
| Automatisert første kontroll → første resultatheading | 5 024 ms | 5 382 ms | Ingen menneskelig lese-/skrivetid |
| Automatisert første kontroll → stabil resultatliste | 6 032 ms | 6 383 ms | Inkluderer rad-stagger |
| Hjem-CTA → første resultatheading | 3 578 ms | 3 574 ms | Domineres av låst 3,2 s scan |
| Hjem-CTA → stabil resultatliste | 4 586 ms | 4 575 ms | Hele plaggrekkefølgen kan skannes |
| Automatiserte handlinger | 9 | 9 | Navneinntasting, dato, sted og CTA-er; OS-tillatelse kan komme i tillegg |
| Konsoll-/sidefeil | 0 | 0 | Med fast forecast-fixture |

### Størrelse

| Element | Målt størrelse |
|---|---:|
| Stående onboardingmaskot | 9 366 byte |
| Bygget onboarding-JS-chunk | 64,87 kB / 18,87 kB gzip |
| Hele `public/monter/` | 804 142 byte |
| Arkivert intro-MP4, ikke i produksjonsflyten | 126 765 byte |

## Testet versus ikke testet

| Tilstand | Status | Bevis |
|---|---|---|
| Lys og mørk | **TESTET i web-preview** | steg 1, steg 4, velkomst og første anbefaling |
| 320×568, 390×844, 430×932 | **TESTET** | 15/15 layoutkontroller passerte |
| Reduce Motion | **TESTET som browserpreferanse** | ingen onboarding-transition; egen capture |
| Stor tekst | **WEB-PROXY, ikke Dynamic Type** | 125 % root-font capture; mye onboardingtypografi er fortsatt fast `px` |
| VoiceOver | **IKKE TESTET** | ARIA-tre er lagret, men er ikke fysisk skjermleserbevis |
| Offline/slow/error | **KODEINSPISERT, ikke full flyt-testet** | sted har lokal/error-fallback; Hjem har retry/sist-kjent |
| App-resume | **KODEINSPISERT** | varm resume beholder React-state; prosessdød før steg 4 mister progresjon |
| Low Power | **UKJENT** | ingen onboarding-spesifikk mekanisme funnet |

## Baselinefunn som påvirker bake-offen

1. Kontrollens styrke er robusthet: ingen foto/video må lastes før CTA-en kan
   brukes, og maskoten koster bare 9,4 kB.
2. Kontrollens svakeste forståelsespunkt er at den starter med *hvem* før den
   viser konkret hva Babyora gjør; verdiløftet kommer sent i steg 5.
3. «Valgfritt» navn er faktisk obligatorisk. Capture
   `k0-no-name-dead-end-light.png` viser deaktivert slutt-CTA.
4. Velkomststeget lover «Dagens råd er klart», men brukeren må fortsatt trykke
   på Hjem og vente på scan. Det er et tillitsproblem, ikke et medieproblem.
5. Tilbake- og editkontroller er under bindende 44 pt. En visuelt pen
   utfordrer taper dersom den kopierer denne gjelden.

## Evidensfiler

- `evidence/onboarding-imagery/baseline/k0-step1-{light,dark}.png`
- `evidence/onboarding-imagery/baseline/k0-step4-{light,dark}.png`
- `evidence/onboarding-imagery/baseline/k0-welcome-{light,dark}.png`
- `evidence/onboarding-imagery/baseline/k0-first-recommendation-{light,dark}.png`
- `evidence/onboarding-imagery/baseline/k0-cold-to-first-recommendation-dark.webm`

## MUST PRESERVE / OPEN TO CHALLENGE / UNKNOWN

| Klasse | Innhold |
|---|---|
| **MUST PRESERVE** | sann motorinput, første anbefaling før paywall, lokal lagring, kontekstuell posisjon, systemtema, umiddelbar CTA, mediafri fallback |
| **OPEN TO CHALLENGE** | behov for intro, maskot på fem flater, velkomststeget, rekkefølge på verdi og profil, foto, motion, minidemonstrasjon |
| **UNKNOWN** | faktisk menneskelig forståelsestid, fotoets tillitseffekt, AI-fotorealismens tillitskostnad, VoiceOver på enhet, ekte Dynamic Type, Low Power, innholdsdrift |

## Fase-0-exit

Dagens flyt og bindende kontrakter er nå dokumentert. Konseptarbeidet kan
starte, men kandidatene får ikke bruke baselinefeilene som «gevinst» uten å
merke at forsøket da blander medieeffekt med generell flytforbedring.

