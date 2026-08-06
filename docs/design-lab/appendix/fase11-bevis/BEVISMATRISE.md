# Bevismatrise — fase 11 runde 2 (deltakermodus)

Kobler hvert manifestkrav (`lab/p*/manifest.ts`: oppgaver + farlige feil)
til skjermbevisene i denne mappen. Alle skudd er tatt i **låst
deltakermodus** (`?modus=deltaker&arm=…&scenario=…&bekreftet=1`, 390×844,
2× DPR) av `tools/lab-skjermbevis-r2.mjs`, som **verifiserer hver påstått
tilstand i DOM-en før skuddet regnes som bevis** (58 verifiseringer, exit 1
ved avvik). `01-forste-viewport--*.png` er rene viewport-skudd (første
faktiske skjermhøyde); øvrige er fullPage.

Metodenotat (P2-kandidatene): `kandidatId` er selens prop (default
`trygg`) og er ikke URL-eksponert. Kald/varm er derfor konstruert på
deltakerflaten med samme mutasjon som `forhaandsdefinertKandidat`
(fjern kritiske lag, varmest kategori først / legg til `VARM_TILLEGG`),
og posisjonen er verifisert i figurens tekstparitet (figcaption). Ingen
kandidat merkes som «riktig» i UI.

Metodenotat (klokkespoling): Operatør-panelet finnes ikke i
deltakermodus. P3/P4 bærer sin egen simulerte klokke som del av
retningen («Simulert klokke» + spol-knapper) — utløpet i
`06-p3-endret-vaer--3-utlopt-maskert.png` er drevet av den, og skriptet
verifiserer at klokka står forbi gyldigTil (12:00 > 11:45) og at rådet
er strukturelt fjernet før skuddet tas.

## Felles (Sols krav 1: deltakerbevis uten testsele)

| Krav | Bevis | Verifisert i DOM | Web/native |
|---|---|---|---|
| Første viewport = oppgaveprompt + retningens kjerne, uten scenario­velger, armknapper, klokkepanel, Williams, hendelseslogg | `01-forste-viewport--p1/p2/p3/p4/null-paakledning.png` | Ingen `select`, ingen «Operatør»/«Williams»/loggknapper; oppgaveprompt fra manifestet synlig | Gyldig i web |
| Oppgavespesifikke nullarmer | `01-forste-viewport--null-paakledning.png` (påkledningsarmen; validering/handoff har egne prompts og sluttEvents i `nullarmer.ts`) | Prompten «Bestem hva barnet skal ha på …» | Gyldig i web |

## P1 — Protokollen

| Manifestkrav | Skjerm før handling | Skjerm etter | Degradert tilstand | Forventet fasit | Web/native |
|---|---|---|---|---|---|
| Oppgave: les tilstandslinjen (teach-back) | `01-forste-viewport--p1.png`, `03-p1-normal--1-faseliste.png` («Vanlig dag» + hvorfor) | — | — | Frase + én setnings hvorfor gjenfortelles | Gyldig i web (selve teach-backen krever deltaker) |
| Oppgave: normalmodus — ett bekreft-trykk + nakkesjekk | `03-p1-normal--1-faseliste.png` (faser «På barnet» / «I vognen / uteklart») | `03-p1-normal--2-nakkekontroll.png` → `03-p1-normal--3-alt-vel.png` → `03-p1-normal--4-kvittering.png` | — | Bekreft alt → nakkekontroll → «Alt vel» → kvittering med grunnlag | Gyldig i web; fysisk nakkesjekk krever observasjon (native/felt) |
| Oppgave: avviksmodus steg for steg inkl. bilstol-steget | `02-p1-bilstol--steg-01.png` … `steg-06.png` | `02-p1-bilstol--steg-07-hb9.png` (HB-9 = steg 7 av 16, FØR kjøredressen) → `02-p1-bilstol--nakkekontroll.png` → `02-p1-bilstol--kvittering.png` | — | HB-9 bekreftes som eget kritisk steg før ytterlaget | Gyldig i web |
| Oppgave: reager på stoppkriterium | `02-p1-bilstol--steg-07-hb9.png` («Stopp hvis» i steget) | `02-p1-bilstol--stemmer-ikke.png` (korreksjonsgrenen) | — | «Bytt eller fjern ett lag — minste endring først» | Gyldig i web |
| Oppgave: utløp midt i oppgaven | — | — | `04-p1-utlopt--topptekst.png` («Rådet er utløpt» + fallback + «Beregn på nytt»; verifisert UTEN «Avvik»-drakt og uten «Gjelder til»-linje) | Fallback følges, «Beregn på nytt» brukes | Gyldig i web (ekte bakgrunnsutløp krever native) |
| Farlig feil: bilstol bekreftet uten HB-9 | `02-p1-bilstol--steg-01..06.png` viser at HB-9 IKKE kan hoppes over (ett steg om gangen) | `02-p1-bilstol--steg-07-hb9.png` | — | Kritisk steg krever egen bekreftelse | Gyldig i web |
| Farlig feil: degradert lest som «ødelagt app» / gammel liste følges | — | — | `04-p1-utlopt--topptekst.png`, `04-p1-mangler--kan-ikke-beregnes.png` (ingen plaggliste synlig i degradert) | Kun fallback + gjenoppretting | Gyldig i web |
| Farlig feil: avviksmodus omgått med ett trykk | `02-p1-bilstol--steg-*.png` (ingen «bekreft alt»-knapp i avvik) | — | — | Kun steg-for-steg | Gyldig i web |
| Farlig feil: nakkesjekk nås aldri | — | `02-p1-bilstol--nakkekontroll.png` (steg 16 av 16, autoritetslinjen) | — | Nakkesjekken er alltid siste steg | Gyldig i web (frafall måles med deltakere) |
| Farlig feil: stoppkriterium lest som info | `02-p1-bilstol--steg-07-hb9.png` («Stopp hvis:» i selve steget) | — | — | Teach-back på «klam nakke» | Krever deltakertest |

## P2 — Spennet

| Manifestkrav | Skjerm før handling | Skjerm etter | Degradert tilstand | Forventet fasit | Web/native |
|---|---|---|---|---|---|
| Oppgave «Holder dette?» — kandidat **trygg** | `05-p2-normal-dag--trygg-i-spennet.png`, `05-p2-sovende-vognbarn--trygg-i-spennet.png` | — | — | Posisjon **i-spennet** (figcaption «i trygt spenn» verifisert) | Gyldig i web; detent-haptikk krever native |
| Oppgave «Holder dette?» — kandidat **kald** | `05-p2-normal-dag--kald-under-gulv.png`, `05-p2-sovende-vognbarn--kald-under-gulv.png` | Fastkoblet respons «Legg til ett lag …» synlig i samme skudd | — | Posisjon **under-gulv** (verifisert «under kaldgulvet») | Gyldig i web |
| Oppgave «Holder dette?» — kandidat **varm** | `05-p2-normal-dag--varm-over-tak.png`, `05-p2-sovende-vognbarn--varm-over-tak.png` (invertert: varmetaket hard grense verifisert) | Respons «Fjern ett lag …» i samme skudd | — | Posisjon **over-tak** (verifisert «over varmetaket») | Gyldig i web |
| Årsakskjeden (hva flyttet markøren) | `05-p2-normal-dag--trygg-i-spennet.png` | `05-p2--aarsakskjede.png` («Pluss ekstra teppe — markøren steg mot taket») | — | Endringsforklaring per chip | Gyldig i web |
| Oppgave «Hva skal hen ha på?» (kontrast, ikke-scorbar) | `01-forste-viewport--p2.png` (oppgavevelgeren synlig) | — | — | Ren liste uten dom | Gyldig i web |
| Farlig feil: «appen har målt barnet» | Hypotese-etiketten i alle P2-skudd | — | — | Hard stopp beholdt (Sols krav) | Krever deltakertest |
| Farlig feil: under-gulv/invertert lest som trygt | `05-p2-*--kald-under-gulv.png`, `05-p2-sovende-vognbarn--varm-over-tak.png` | — | — | Tekstparitet bærer dommen | Gyldig i web |
| Farlig feil: HB-9 oversett i spennet | (P2 bærer hendelsen via HendelsesListe — se P1-bevis for sekvensen) | — | — | Hard hendelse dominerer | Gyldig i web |
| Farlig feil: maskert/utløpt spenn brukt | — | — | `05-p2--manglende-vaerdata.png` («Kan ikke beregnes», chips deaktivert, verifisert UTEN utløpssemantikk) | Én gjenoppretting: «Hent værdata på nytt» | Gyldig i web |

## P3 — Ambient Briefing

| Manifestkrav | Skjerm før handling | Skjerm etter | Degradert tilstand | Forventet fasit | Web/native |
|---|---|---|---|---|---|
| Oppgave: les brief, oppgi handling uten app | `06-p3-endret-vaer--1-v1-brief.png` (V1: «Samme antrekk som i går holder — tykt ullsett, ull-mellomlag, kjøredress.») | — | — | Handlingskomplett brief (Sols P3-P0) | SIMULERT WIDGET — krever native verifisering (levering/bakgrunn) |
| Oppgave: oppdag V2-endringen | `06-p3-endret-vaer--1-v1-brief.png` | `06-p3-endret-vaer--2-v2-brief.png` (V2: «Legg ull-jakke mellom ull-mellomlag og vinterkjøredress.») — **handlingsendring tekstlig verifisert i skriptet** (Sols P3-P1) | — | V2 endrer handlingen reelt, med versjonert antrekksbaseline | Gyldig i web (leveringstid krever native) |
| Oppgave: forklar maskert utløp | `06-p3-endret-vaer--2-v2-brief.png` | — | `06-p3-endret-vaer--3-utlopt-maskert.png` (klokke 12:00 > gyldigTil 11:45; «Må beregnes på nytt»; **verifisert at V2-handlingen er fjernet fra flaten**) | Strukturell maskering + fallback, aldri dimming | Gyldig i web (OS-drevet utløp krever native) |
| Oppgave: app-fallback samme versjonsstempel + «Åpnet» | «Åpne appen (full liste)»-knappen synlig i alle P3-skudd | — | — | Samme Brief #N i app-fallback | Gyldig i web |
| Farlig feil: forsinket V1 vises som gjeldende | — | `06-p3-endret-vaer--2-v2-brief.png` og hendelsesloggen i `--3` («10:30 Forkastet: Brief #1 — grunn: maskert-enveis») | — | I1/I2: eldre versjon forkastes synlig | Gyldig i web |
| Farlig feil: innhold fra maskert brief brukt | — | — | `06-p3-endret-vaer--3-utlopt-maskert.png` | Kun fallback etter utløp | Gyldig i web |
| Farlig feil: delta lest i feil retning | `06-p3-endret-vaer--2-v2-brief.png` («Kaldere enn i går» + «Legg …») | — | — | Retning ligger i handlingsteksten | Krever deltakertest |

## P4 — Ambient Protokoll

| Manifestkrav | Skjerm før handling | Skjerm etter | Degradert tilstand | Forventet fasit | Web/native |
|---|---|---|---|---|---|
| Oppgave: utfør steg 1 fra briefen | `07-p4-normal-dag--1-brief.png` (steg 1 + «Steg 1 av N» + Brief #1 · normal-dag-b1) | — | — | Brief-handling == protokollens steg 1 | SIMULERT BRIEF-FLATE — krever native verifisering |
| Oppgave: versjon+gyldighet fra stempellinjen | `07-p4-normal-dag--1-brief.png`, `07-p4-endret-vaer--1-brief.png` | — | — | briefId + versjon + utstedt + gyldig-til synlig | Gyldig i web |
| Oppgave: åpne protokollen — samme versjon | `07-p4-normal-dag--1-brief.png` | `07-p4-normal-dag--2-protokoll.png` («Samme brief som flaten — normal-dag-b1 · Brief #1») → `07-p4-normal-dag--3-retur.png` — **briefId+versjon tekstlig verifisert lik på alle tre flater** (Sols P4-P0) | — | Kontinuitet brief↔protokoll↔retur | Gyldig i web |
| Oppgave: endret vær — delta + første protokollhandling | `07-p4-endret-vaer--1-brief.png` (V2: delta «Kaldere enn i går», «Legg ull-jakke …», Referanse i går V1, + steg 1) | `07-p4-endret-vaer--2-protokoll.png` → `--3-retur.png` (Brief #2 · endret-vaer-b2 hele veien) | — | Delta OG første protokollhandling uten ny anbefaling (Sols P4-P1) | Gyldig i web |
| Oppgave: forklar maskert tilstand etter utløp | — | — | Samme brief-maskin som P3 (`06-p3-endret-vaer--3-utlopt-maskert.png`); P4s maskerte drakt deler P4_TEKST.maskert | Fallback, aldri gammelt innhold | Gyldig i web |
| Farlig feil: versjonsbrudd ved åpning | — | `07-p4-*--2-protokoll.png` (match verifisert i skript; brudd ville vist feiltilstand) | — | Skal være umulig via brief-maskinen (property-testet) | Gyldig i web |
| Farlig feil: HB-9 mangler i brief/protokoll | (bilstol-protokollen dokumentert i P1-sekvensen; P4 gjenbruker samme kompilat) | — | — | Semantikk-porten (snitt) håndhever | Gyldig i web (kodebevis + P1-skudd) |
| Farlig feil: kontrollpunktet nås aldri | `07-p4-*--2-protokoll.png` (nakkesjekken sist i den åpnede protokollen med egen bekreft-knapp) | — | — | Kontrollpunkt sist, bekreftbart | Gyldig i web |

## A11y (Sols krav: egne skjermbevis, ikke inferens)

| Krav | Bevis | Verifisert i DOM | Web/native |
|---|---|---|---|
| Dynamic Type 1.4× uten kutt/overlapp | `08-a11y-p1--stor-tekst.png`, `08-a11y-p2--stor-tekst.png` | Rotskala ≥ 22 px målt i inline-stil | Ekte Dynamic Type/VoiceOver krever native |
| Utendørslys / maksimal kontrast | `08-a11y-p1--hoykontrast.png`, `08-a11y-p2--hoykontrast.png` | Ren sort (#000) tekstfarge målt | Ekte utendørs lesbarhet krever native/felt |

## Kjente begrensninger i denne pakken

- Nullarmene validering/handoff har egne prompts/sluttEvents i koden, men
  kun påkledningsarmen er skutt her (grunnlinjen for de fem armene).
- P2-figurens sonetekst «Under kaldgulvet — for kaldt» overlappes delvis
  av «Deres antrekk»-markøren når kandidaten står under gulvet (synlig i
  `05-p2-*--kald-under-gulv.png`) — lesbarheten bæres av tekstpariteten
  under figuren, men overlappen bør ryddes i neste UI-runde.
- Alt P3/P4-bevis er per definisjon simulert flate (merket i selve
  skjermbildet); leveringstid, bakgrunnsutløp og låseskjerm er sperret
  til native spike.
