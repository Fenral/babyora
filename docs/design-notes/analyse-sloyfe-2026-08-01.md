# Analysesløyfen 2026-08-01 — vedtak per runde

Grundig UI/UX-analyse av hele appen, forhandlet med ekstern kritiker (Sol) over
minimum 10 runder. Områder: åpning, onboarding, Hjem, Planlegg, Familie.
Runde 2-vedtakene (åpningens kontinuitetskontrakt) står i eget notat:
`aapningskontrakt-2026-08-01.md`. Dette notatet akkumulerer resten.

## Runde 10 — Endelig prioritering + MVP (SLUTTDOM)

| # | Pakke | Dom |
|---|---|---|
| 0 | Tverrgående grunnskinne | Komponentkontraktene de neste flatene faktisk bruker (sheet, focus, selected, motion/RM, kontrast-CI). IKKE full retrofit. |
| 1 | T1 Katalogsannhet | Ubestridt førsteplass. Todelt: **T1A** (5 mismatcher + 60/60 display-navn + språkfeil) og **T1B** (validér katalogfeltene lagrolle/dekning/varme/funksjon/avhengigheter — T3 kan ikke starte før T1B er bevist komplett). |
| 2 | T9A Oppstarts-/datatilstand | Cachematrise, resume ≠ ny prosess, fontberedskap, korrekt første tilstand. Robusthet, ikke polish — forutsetning for T2s friskhetstilstander. |
| 3 | T2 Hjem-troverdighet | Deterministisk forklaring fra motorens faktiske innganger + metodeark (på felles sheet-primitiv) + fire friskhetstilstander. Basisraden flyttet UT (tilhører T6/Planlegg). |
| 4 | T4 Scan V3.1 | Syntesebeat, skip uten layout-shift m/kansellert haptikk, ærlig ventetilstand, samlet landing m/predekodede bilder, full RM-vei. Preferansespørsmålet kan feature-flagges. Ingen falsk progress-semantikk. |
| 5 | T5 + T9B Førstegangsreisen | Monter-port onboarding + native launch/ordmerkekontinuitet som ÉN clean-install-pakke. Etter T2/T4 (kjerneverdien må være troverdig før inngangen perfeksjoneres), før T3. |
| 6 | T3 Bytt V1 | Høy verdi, høyere korrekthetsrisiko; krever T1B. Konsekvensetiketter først når motoren kan BEREGNE dem («Litt varmere» aldri redaksjonell gjetning). |
| 7 | T6 Planlegg-IA | Deles: tidsintegritet → I dag → Fremover. Basisraden hører hjemme her. |
| 8 | T7 Familie-IA V2 | Uten fremtidsstubber — INGEN «Personlig tilpasning»-rad før T8 finnes (ende-til-ende-regelen). |
| 9 | T8 Tillitssløyfe | Først når datamodell + Familie + faktisk tilbakemeldingsgrunnlag finnes. |
| 10 | T10 Soveposeguide | Egen faglig godkjenningsløype før UI. |

**MVP neste TestFlight: T1 + T9A + T2 + T4.** Releasekrav: uendret
motoroutput; 0 kjente katalogmismatcher; normal/skip/tregt nett/offline/
stale/feil/RM testet; fire temamoduser uten regresjon; fysisk test på
eldste støttede iPhone; forklaringen samsvarer med barn/sted/aktivitet/
vær i alle testcaser. Automatisert kontroll for manglende display-navn og
ugyldig bilde-ID.

**Skal IKKE gjøres:** tilpasnings-stub i Familie; konsekvensetiketter før
de kan beregnes; basisrad i Hjem-pakken; synlig Soveposeguide før faglig
godkjenning; global designsystem-retrofit i MVP (kun berørte komponenter
+ migreringsregel); falsk progress-semantikk i scannen.

**Sols tre ting til eieren:** (1) Tillit ER produktet — ett feil
produktbilde eller én usann forklaring skader mer enn en uferdig skygge;
kjeden er korrekt kontekst → konkrete plagg → riktig rekkefølge →
forståelig grunn → mulig korrigering. (2) Hver flate beholder ÉN jobb —
når flatene kopierer hverandre mister appen roen. (3) Særpreget kommer
fra disiplin, ikke flere effekter — Babyora skal føles som et varmt,
presist instrument, ikke en søt app som underholder.

## Runde 1 — prioritering (oppsummert)

Topp-funn i prioritert rekkefølge: (1) rå katalognavn + svakt Bytt-system,
(2) onboarding 2–4 på legacy-design, (3) manglende tillitssløyfe, (4) Planlegg
Uke/Snart uferdig, (5) selected-state-grammatikk, (6) Familie-IA (fane heter
Familie, lander på innstillinger). Fire av mine egne forslag ble STRØKET med
begrunnelse jeg aksepterte: global scale(0.97)-press (1 px + skygge på store
CTA-er holder), stagger-alt (ro er poenget), custom easing-kurver overalt
(grammatikk over kurver), tettere semantisk fargebruk (sparsom semantikk er
riktig). Nytt funn fra Sol: produktbilde-mismatch (tøffelsko vist som sokker)
— bekreftet og utvidet av katalog-auditen (5 mismatcher + rotårsak
`dbStringFor()`; se `katalog-audit/rapport.md`).

## Runde 3 — Onboarding steg 2–4 (+ steg 5)

**Låst flyt:** Navn (valgfritt) → Alder → Sted → Klar → «Lag første antrekk»
→ direkte til Hjem og første scan. **Steg 5 (velkomstskjermen) STRYKES** —
første scan ER velkomsten; dagens skjerm nekter brukeren verdien bak et
ekstra trykk.

- **Monter-port av steg 2–4 er obligatorisk** (registerbrudd i dag). Samme
  grammatikk som steg 1: espresso, ETT hevet kort per steg, segmentbar,
  ordmerke venstrejustert på globalt grid.
- **Nativ datovelger beholdes** (custom hjul avvist av alle tre instanser:
  meg, ekstern kritiker, intern dommer). Babyora eier trigger-raden, kortet
  og tilbakemeldingen; iOS eier datoinntastingen. Krav: max = i dag, ingen
  forhåndsutfylt dato, lokal kalenderdato (aldri UTC-konvertering som kan
  flytte dato), CTA først etter eksplisitt gyldig valg, avklar motorstøtte
  før min settes.
- **Aldersbekreftelse**: under datotriggeren i samme kort, som AVLEDET
  tolkning med egen visuell rolle («✓ Lillian er 9 måneder nå» + rolig
  forklaring «Alderen brukes til å tilpasse lag og størrelser»).
  aria-live kun på ferdig bekreftelse.
- **Steg 3 snus:** stedsøk er PRIMÆR kontroll (åpent søkefelt), «Bruk
  posisjonen min» sekundær — OS-dialogen utløses først ved trykk på den.
  Mikroprimer under knappen («Posisjonen brukes bare til å finne nærmeste
  sted»), ingen mellomskjerm. Ved avslag: ingen skyld, fokus til søket,
  «Posisjon ble ikke brukt. Søk etter stedet i stedet.» Omtrentlig posisjon
  er nok. Monetiseringsspråket («Gratisversjonen …») fjernes.
- **Steg 4:** disclaimer som synlig énlinje («Rådene er veiledende — kjenn
  etter og tilpass barnet») + «Slik vurderer Babyora»-ARK (ikke inline-
  utvidelse). Redigering fra Klar returnerer til sammendraget.
- **Hero-chipen pensjoneres**; stående maskot med steg 1-grammatikk på alle
  steg, men fader ut 120 ms når tastaturet åpnes.
- **Haptikk:** selection ved eksplisitte valg, medium ved CTA-start, success
  først når første resultat faktisk er klart — én sammenhengende handling
  fra «Lag første antrekk» (respons < 100 ms), ALDRI onboarding-success +
  scan-success etter hverandre.
- **Oversette krav:** synlig tilbakekontroll ≥44 px på steg 2–4; segmentbar-
  tilstander (fullført = dempet amber, aktiv = full amber, fremtidig =
  nøytral espresso; VoiceOver «Steg 2 av 4»); avbrutt onboarding
  gjenopptas med svar bevart; lagringshint må være sann mot kontostatus
  (lokal-påstand ryker hvis premium synker); robuste søketilstander;
  lange navn + stor tekst i QA.

## Runde 4 — Hjem

**«Absolutt beholdes» bekreftet av kritiker:** fargeeierskapet
(espresso=miljø, petrol=eksterne data, amber=brukerhandling), tema-konstant
petrolflate, verdistigen, maskot-forankringen, rekkefølge-vitrinen
(innerst→ytterst), skillet seremoniell CTA-scan vs instrumentell
quick-recalc (220 ms).

- **Bytt-systemet (arkitektur godkjent, innhold skjerpes):**
  konsekvensetiketter beskriver HELE ANTREKKETS endring relativt til
  anbefalingen («Antrekket blir litt varmere/kjøligere», «Omtrent samme
  varme», «Mindre fukttransporterende», «Erstatter også mellomlaget»).
  ALDRI TOG-deltatall (falsk presisjon). Kompatibilitet må validere
  kroppsdekning, lagrolle, varmebidrag, fukt/vind/vann-funksjon og
  avhengigheter (mockens «Ullhals, tynn» som alternativ til body var en
  hard feil). Footer-grid strøket i v1 → 3–4 beste + «Flere alternativer ›»
  som liste. Interaksjon: trykk anvender direkte, arket lukkes, berørte
  rader quick-recalces med lokal markering, snackbar «Antrekket ble litt
  varmere · Angre», ingen «Bruk»-knapp.
- **Tillitssløyfen (v1, uten push):** «Kle på, steg for steg»-trykk
  kvalifiserer antrekket som sannsynlig brukt → ved neste naturlige åpning
  samme dag: ikke-blokkerende kort «Hvordan fungerte antrekket for Lillian?
  For varmt · Passe · For kaldt · Ikke brukt». Tilpasningen: liten etter
  ett svar, sterkere etter konsistens, synlig og nullstillbar i Familie,
  lagret med kontekst. Når den påvirker et råd: «Personlig tilpasset: litt
  kjøligere enn standardrådet, basert på tidligere tilbakemelding.»
  Kall det «tilpasning», ikke «læring» (motoren er deterministisk).
- **Resultatforklaring:** én synlig forklaring ALLTID («Hvorfor dette
  antrekket? Det føles som 3°, det er litt vind, og Lillian skal være
  utenfor vognen.») + «Slik vurderer Babyora ›»-ark med værgrunnlag, alder,
  aktivitet, lagdekning, disclaimer. Ikke kollaps alt bak «Hvorfor?»-rad.
- **Stale vær:** petrolpanelet dempes ALDRI. Friskhetslinjen får fire
  tilstander: «● Oppdatert nå» / «Oppdatert for 48 min siden» / «Værdata
  kan være utdaterte · Oppdater» (44 px mål) / «Sist oppdatert 07:40 ·
  Ingen nettforbindelse». Etter oppdatering: quick-recalc + «Oppdatert
  etter nyere værdata» hvis antrekket endret seg.
- **Scan-koreografien (3,2 s eierlåst):** legg til SYNTESEBEAT, ikke fjerde
  sjekkrad. Narrativ: Været nå → Aktivitet → Lillian → «Setter sammen
  lagene» (plagg/lagkonturer begynner å forme resultatet, 1950–2700 ms) →
  komprimering og landing (2700–3200 ms). Ingen ekstra haptikk.
  **Skip:** omdøpes til «Vis antrekket nå», rolig tekstknapp under
  sjekkradene, synlig fra ~650–800 ms. Ved skip: kanseller ventende
  haptikk, kontrollert landing, kun success. ALDRI implisitt preferanse-
  læring — etter 2–3 påfølgende skip: eksplisitt spørsmål «Vil du vanligvis
  hoppe over scannen? Vis alltid direkte · Behold scannen».
- **Tre harde krav før sign-off:** (1) sticky «Kle på, steg for steg» aldri
  under tabbaren (safe-area/stacking-kontrakt — per P11-verifisering ligger
  CTA-en i flyt etter listen og klarerer tabbaren, men kontrakten
  formaliseres i P12), (2) toppoppsummeringen må ikke bryte «Utenfor vogn»
  klønete alene, (3) katalog-auditen validerer både bilde↔navn OG
  funksjonell kompatibilitet.

## Runde 5 — Planlegg

**Dom: behold dagslinjen, én rad per dag og petrol-gradienten.** To harde
faktafunn: (1) met.no Locationforecast gir bare ~9–10 dagers horisont —
premium-løftet «14 dagers utsikt» er uleverbart og endres til «Opptil 9
dagers utsikt»; (2) mock-kalenderen var ett år ute av synk (1. august 2026
er lørdag, mocken viste 2025-ukedager) — nytt testkrav: dato, ukedag og
barnets alder beregnes fra SAMME klokke og Europe/Oslo, aldri separate
fixtures.

- **IA:** fanene omdøpes **«I dag | Fremover»**; Fremover har seksjonene
  I morgen / **Neste 7 dager** (ikke «Neste uke» — rullerende tidsrom) /
  Senere. Antrekkslisten dupliseres ikke: I dag = dagskort + basisrad
  «Antrekket nå · 5 lag · 2 tilbehør · Se på Hjem ›» + dagslinje med kun
  reelle endringer.
- **Babyora dikter ALDRI familiens dagsplan.** «Morgenstell»-noder o.l.
  vises kun hvis brukeren faktisk har planlagt dem. Ellers uttrykkes
  VÆRHENDELSEN med betinget råd: «Vinden øker rundt 10:30 / Hvis dere skal
  ut: legg til vindjakke og tynn lue.»
- **Kildebevisste noder:** passert = dempet nøytral (kollapses til
  «Tidligere i dag» på kvelden), Nå = hul kremring (aldri amber),
  værendring = petrolmarkør/værikon, påkledningshandling = amber-aksent I
  KORTET (ikke noden), stille periode = ingen node. Kombinert hendelse:
  petrol «Regn ventes rundt kl. 14» + amber handling «Legg regntrekket over
  vognen». Chippen «2 endringer i dag» er nøytral hvis den bare informerer
  (amber kun hvis trykkbar).
- **Stille spenn** omformuleres handlingsrettet: «Antrekket holder til
  ca. 10:30» (ikke «Ingen endring i 1 t 15 min»). Ingen spenn-tekst før Nå.
- **Stabile dager:** én rad per dag beholdes, men kortere kopi:
  «Lør · 15° · Samme antrekk». Kun avviksdager får hevet flate, bilde,
  dom og chevron.
- **Senere-flaten (tidl. Snart):** ÉN samlet ærlig flate, ingen falske
  dato-rader, aldri «Kommer snart» om betalt innhold. Kopi: «8.–10. august
  — Prognosen blir mer usikker så langt fram. Babyora viser rådene når
  værgrunnlaget er godt nok.» «Varsle meg» kun hvis varsling er
  implementert ende-til-ende; systemtillatelse først etter trykk.
- **Forbered i kveld:** Fremover alltid tilgjengelig; etter ~kl. 19 vises i
  tillegg et kompakt «Gjør klart til i morgen»-kort i I dag (bak eventuelle
  gjenstående kveldshendelser). Uendret antrekk = rolig bekreftelse uten
  amber-CTA («Antrekket fra i dag holder også i morgen»). De 3 thumbnails
  = mest forberedelseskritiske plagg; «+4» får a11y-navn «Fire flere
  plagg».
- **Petrol-gradienten godkjent** med streng kontrakt: heroens øvre del
  fullverdig petrol, fade kun i overgangen til dagslinjen, aldri generell
  kortstil, tekst testes mot alle gradientstopp, lys modus verifiseres
  separat (fare for grågrønt «slam»).
- **Nå-noden lever:** oppdateres ved resume og minuttgrenser uten visuelle
  hopp. Usikkerhetsspråk («rundt kl. 14», «ventes fra ca. 14»). Planlegg
  får samme bunninset-kontrakt som Hjem.

## Runde 6 — Familie

**IA-en godkjent:** familie-først (barnekort-hero) → Verktøy og guider →
én diskret «Innstillinger og abonnement»-rad. Tre endringer pålagt:

- **Ærlighetsregelen for funksjoner:** Inviter vises IKKE i v1 før hele
  kjeden finnes (konto/auth, utsending, aksept, rettigheter,
  tilbakekalling, synk/konflikt, sletting). Ferdig-men-premiumlåst kan
  vises som «Del med omsorgsperson · Babyora+». Finnes ikke funksjonen,
  finnes ikke raden. Konto medfører krav om kontosletting i appen (Apple).
- **Kopikontrakt etter FAKTISK lagringstilstand:** «Lagres på denne
  enheten» / «Synkroniseres mellom enhetene dine» / «Delt med Karl ·
  Tilgangen kan endres når som helst». Onboarding-varianten med «Du kan
  velge synkronisering og deling senere» KUN hvis det faktisk finnes.
  «Deg · Eier» → «Deg · Administrator».
- **Steder:** Familie er kilden; Hjem/Juster/Planlegg konsumerer og viser
  alltid aktivt sted. Gratis: «Trondheim · Fast sted». Låst: 🔒-rad
  «Flere steder · Babyora+ · Legg til barnehage, hytte …» — ALDRI
  amber-stiplet legg-til for utilgjengelig funksjon (paywall-felle).
  Premiumstatus synlig FØR trykk → låst rad kan åpne paywall direkte.
  Modell: felles familieliste, standardsted per barn, egendefinerte navn.
- **Verktøy og guider:** «TOG-kalkulator» omdøpes **«Soveposeguide»**
  (aldri «kalkulator»/«riktig» i trygg-søvn-domenet) med fagkrav: faktisk
  romtemperatur, produsentens anbefaling, passform + aldri teppe over
  pose, alltid «kjenn etter på barnet» — egen fag-/sikkerhetsgjennomgang
  før lansering; blir i Familie. «Varm eller kald?» beholdes men
  «2-finger-testen» strykes uten faglig kilde («Slik kjenner du i nakken
  eller på brystet»). Guider sesongrangeres (Første vinter ikke topp-3 i
  juli); «Se alle guider» viser alt.
- **Personlig tilpasning** bor i barnekortet: kompakt rad «Personlig
  tilpasning · Litt kjøligere enn standard ›» (eller «· Standard» som
  transparent nulltilstand). Detaljark: justering, antall kvalifiserte
  tilbakemeldinger, siste, «Tilbakestill til standard» (med
  angre-snackbar — aldri nullstill direkte i heroen).
- **Flerbarn:** ved >1 barn får Hjem en 44px selector «Lillian ▾ ·
  9 måneder · Utelek» (ett barn = vanlig tekst). Bytteregler: forrige
  barns resultat fjernes synkront, cachet resultat vises umiddelbart
  ellers 220 ms quick-recalc, ALDRI full scan uten CTA, aldri én frame
  med feil barns antrekk, VoiceOver «Aktivt barn: Oskar». Samme kontekst
  i Planlegg.
- **Hero viser kun navn + alder** (fødselsdato er kildedata → i
  redigeringsarket). Barneark: navn, dato (samme native velger som
  onboarding), avatar, personlig tilpasning, «Fjern barn» nederst.
  Delt profil skiller administrator (slette familiedata) fra
  omsorgsperson (forlate familien).
- **Abonnement i innstillingene:** nær toppen; ikke-abonnent «Babyora+ ·
  Se planer», prøve «7 dagers prøveperiode · 5 dager igjen», abonnent
  «Årlig · fornyes 8. august» + «Administrer abonnement» via native
  StoreKit showManageSubscriptions. Toppnivåradens undertekst adaptiv.
- **Visuell korreksjon:** tre amber-stiplede handlinger i samme hero
  konkurrerer — «Legg til barn» tonal handling, «Inviter» vanlig rad,
  «Legg til sted» tonal når tilgjengelig, premiumlåst = nøytral låserad.

## Runde 7 — Fargearkitektur + valgt-tilstand

**Dom: paletten er moden nok til å låses når kontrastmatrisen og
lysmodusvariantene er maskinverifisert.** Krem-inversjonen beholdes.

- **Valgt-tilstand er KONTROLLTYPE-bevisst, ikke bakgrunns-bestemt:**
  | Kontrolltype | Valgt behandling | Eksempler |
  |---|---|---|
  | Gjensidig utelukkende segment | Krempill + espresso-tekst (på ALLE flater) | I dag/Fremover, Utenfor/I vogn |
  | Navigasjon | Varm selected-surface + fylt ikon + fetere tekst | Tabbar |
  | Valgt listeelement | Varm selected-surface + eksplisitt hake/radio | Bytt-ark, paywall |
  | Fremdrift | Ambersegment | Onboarding-progress |
  Anatomi: avgrenset flate + foreground endrer form/vekt + hake/fylt
  ikon/inversjon + flatere uvalgt nabo + 1 px press.
- **Kontrastfunn:** selected #4A2F21 mot interactive #35261A ≈ 1,19:1 —
  top-light/ring kan ALDRI være eneste valgsignal. Focus-visible får egen
  ring ≥3:1 (aldri selected-surface). WCAG non-text 3:1 gjelder tilstander.
- **Lysmodus-checklist (9):** full kontrastmatrise (amber-500 på krem
  2,18:1 = forbudt som tekst; amber-700 4,60:1 OK; panel-muted 4,71:1 →
  aldri opacity/gradient), verdistigen inverteres IKKE matematisk (fyll+
  kant+skygge gir opplevd dybde), selected testes mot canvas OG nabo,
  petrol-mot-krem (skyggetyngde, glorie-kant, grågrønn gradient-mellomsone,
  tekst over gradientstopp), gradient måles på 0/25/50/75/100 %, alle
  interaksjonstilstander i begge temaer (locked ≠ disabled!), system-
  tilgjengelighet (Increase Contrast, Differentiate Without Color, Reduce
  Transparency, Smart Invert, 200 % tekst, Night Shift, dagslys),
  temaskifte/første paint atomisk, bilde/alfa-QA per tema.
- **Værfamilie-regel låst:** værfarge er ALDRI eneste bærer; hver tilstand
  minst to av ikon/tekst/tall/form/etikett; tinten kan reduseres helt
  under Differentiate Without Color; aldri brødtekst-farging, aldri
  CTA-endring, aldri trygt/utrygt-signal.
- **Semantikk-allowlist:** feil (skjema/lagring/kjøp), advarsel (materielt
  utdatert vær, betalingsproblem), offline/info (nøytral, ikke rød),
  destruktiv (bekreftelsesark), suksess (kjøp/gjenoppretting), kritisk
  ekstern (offisielle farevarsler). IKKE tillatt: antrekksråd,
  tillitssløyfe-svar, valgt tilstand, aktiv fane, låst premium, anbefalt
  plan, personlig tilpasning, loading, vanlige værforhold, disabled.
  **Anbefalt/valgt/nåværende er tre ulike signaler** (badge / surface+hake
  / statuskopi) — aldri samme visuelle uttrykk.
- **Plagg-backplates blir asset-aware:** klassifiser ved katalogimport
  (lys/mørk/blandet); mørke plagg → lysere nøytral plate, lyse → mørkere
  varm, blandet → raised-token. Aldri recoloring, aldri hard kontur (myk
  inner-halo), ~3:1 for nødvendige silhuettkanter. Katalog-auditen
  utvides: alfakutt, normalisert størrelse, innbakt skygge, fargeprofil,
  faktisk plaggfarge, backplate-klasse.
- **Manglende arkitektur som tas inn:** komplett state-tokenmatrise
  (default/interactive/pressed/focused/selected/disabled/locked/loading/
  destructive), overlay-kontrakt (scrim/sheet/modal/toast/snackbar i begge
  temaer + Reduce Transparency), opake kontrastkritiske elementer,
  **amber-budsjett** (maks én dominerende amber-handling per viewport),
  sRGB-låste UI-tokens (P3 kun foto med profil), automatisert
  kontrast-QA i CI, skjermregresjon (lys/mørk/Increase Contrast/
  Differentiate Without Color), atomisk temavalg før første frame.

## Runde 8 — Bevegelse

**Dom: nesten låsbart.** Endringer: asymmetrisk sheet-timing, enklere
detaljovergang, sjeldnere idle-glimt, eksplisitt bevegelsesprioritet.

- **Motion-tokens (5 klasser):** feedback 120 ms (press-inn 70–80 ms /
  slipp 120 ms som retningsvariant), state 180 ms (tekst/farge) / 220 ms
  (geometri/målere), handoff 280 ms (forskjøvet crossfade), sheet 340 ms
  inn / 260 ms ut (myk sprettfri avslutning; spring kun ved sluppet
  brukerdrag), ceremony 3200 ms (dokumentert tidslinje, aldri generell
  transition). Standardkurve .2,.7,.2,1; linear kun for reell fremdrift.
  **Avstandstokens låses også:** 6 px handoff, 8 px resultatlanding.
- **Delt-element-flygingen STRØKET** (FLIP-risiko ved Dynamic Type/
  scroll/rotasjon/avbrudd). Kontinuitet i stedet: kilderad får press/
  selected-respons → ark opp → samme thumbnail+navn materialiseres i
  arkets topp med kort crossfade → kilderaden identifiserbar bak scrim.
  Kan gjeninnføres KUN med bevist 60 fps + alle avbruddstilfeller.
- **Sheet-primitiv (én felles):** drag følger 1:1, avstand ELLER
  nedoverhastighet lukker, ellers rolig snap; lett motstand ved overdrag
  uten sprett; maskinvare-tilbake/scrim/eksplisitt lukk konsistent;
  fokuslås; tastatur+safe-area+scroll før gesten er «ferdig»; ulagrede
  data krever bekreftelse; ALDRI ark over ark. Detents: Bytt =
  innhold/medium (+stor), Slik vurderer = én høyde, Rediger barn =
  stor/full, Vær = naturlig/stor.
- **Idle-glimt nedjustert:** første mulighet 35–55 s reell inaktivitet,
  deretter tilfeldig 60–120 s, **maks to per foreground-sesjon**;
  kanselleres ved trykk/scroll/tastatur/VoiceOver/scan/ark/fanebytte/
  bakgrunn; ingen haptikk/lyd/layoutendring; 300/1200/300 ms beholdes.
  ALDRI koblet til værinnlasting (maskoten skal ikke få data-agens —
  friskhetslinjen + quick-recalc eier bakgrunnsoppdatering).
- **Resultatlanding:** hele vitrinen samlet, opacity + 8 px, 280–300 ms
  i landingsvinduet, ingen radkaskade (pedagogikken bæres av
  syntesebeatet + nummereringen + lagspinen). Success-haptikk når
  innholdet er stabilt. Bilder pre-dekodes, plass reserveres.
- **Reduce Motion-tabellen (komplett):** scan = direkte resultat
  (opacity ≤100 ms) + kun én success-haptikk; quick-recalc crossfade
  ≤100 ms uten målerfjær; målerverdi settes direkte (ingen gust/skvulp);
  idle aldri; posebytte direkte; onboarding→Hjem ≤100 ms uten settling;
  landing fade uten rise; sheets fade ≤100 ms programmatisk (brukerdrag
  følges fortsatt direkte, uten sprett); shared element av; tabbytte
  direkte/≤100 ms aldri slide; press = farge/skygge/hake ≤80–100 ms;
  snackbar fade; loading statisk uten shimmer; bakgrunnsoppdatering uten
  bevegelse. RM styrer IKKE haptikk (separat preferanse), men
  flertrinnssekvenser reduseres.
- **Bevegelsesprioritet:** brukerdrag > navigasjon/sheet > scan > state
  update > idle — lavere nivå kanselleres/utsettes; aldri to dominerende
  bevegelser samtidig. **Avbruddskontrakt:** dobbeltrykk/tilbakegest/
  fanebytte/bakgrunn lander alltid i gyldig tilstand; en scan fortsetter
  aldri halvveis etter resume. **Nettverk vs seremoni:** resultat klart
  tidlig → seremonien holder 3,2 s; ikke klart ved 3,2 s → ærlig
  ventetilstand/feil, aldri falsk landing.
- **Tabbytte:** instant/crossfade 100–120 ms, bevart scrollposisjon per
  fane, ingen karusell. I dag/Fremover: 120–160 ms innholdscrossfade.
  **Loading:** reservert geometri + statiske placeholders (ingen
  shimmer); cache materialiseres først, ferske data erstatter med state.
  **Ytelse:** transform/opacity, pre-dekod maskot/plagg, ingen animert
  blur/store skygger, verifiser på eldste støttede iPhone.
  **Maskot-lean roterer rundt gripelinjen/hendene**, aldri bildesenteret.
  (Idle-frekvens + sesjonstak + lean-origin implementert samme dag,
  commit 871c9fb.)

## Runde 9 — Fredningshierarkiet («absolutt beholdes»)

Min 30-punktsliste blandet tre nivåer; Sol restrukturerte til:

**1. PRODUKTGRUNNLOV** (endres aldri): sannhet (aldri påstå mer enn
systemet gjør, løfter aldri over dokumentert datakapasitet, funksjoner
finnes ende-til-ende før de vises, låst premium synlig før trykk, sann
lagringskopi); **flatenes absolutte jobber** (Åpning = identitet og
kontinuitet uten venteteater · Onboarding = minste nødvendige grunnlag
for første råd · Hjem = hva barnet skal ha på NÅ · Planlegg = hva som kan
endre seg og omtrent når · Familie = hvem rådene gjelder, tilpasning,
steder, verktøy — ingen flate dupliserer en annens hovedjobb);
motorgrensen (isolert, deterministisk, versjonert, testbar motor;
deklarativ, transparent, reversibel tilpasning utenpå);
**tilgjengelighets-invarianten** (44 px mål, Dynamic Type + lange navn,
VoiceOver navn/rekkefølge/status, fokus ≥3:1, aldri farge alene, RM uten
funksjonstap, temaene funksjonelt likeverdige); **katalogsannhet**
(bilde/navn/lagrolle/funksjon/dekning/kompatibilitet beskriver samme
objekt; mapping-audit er releasekrav; produktbilder recolores aldri);
synlig/reversibel tilpasning per barn (forståelig, knyttet til faktisk
tilbakemelding, nullstillbar, ingen skjult profilering);
**tids-/kontekstintegritet** (alder/ukedag/dato/prognose/tidslinje fra
samme klokke og tidssone; aktivt barn/sted/aktivitet/kilde/friskhet
aldri tvetydig); **monetisering uten mørke mønstre** (første verdi leses
i fred, ingen forhåndsvalgt plan, sann tabulær pris, gjenopprett/
administrer lett tilgjengelig, lås merkes før trykk, paywall aldri som
systemfeil); **robusthet før dekorasjon** (ingen layout-shift i kritiske
overganger; loading/tom/feil/offline/stale/gjenopptak på alle flater;
kritiske bilder dekodet før landing; safe-area/tabbar-klaring er
kontrakt; aldri gjenoppta midt i uforståelig animasjon); **konkret
brukerspråk** («Ta på ullbody og sokker», aldri motormodell-språk;
lagforståelse via rekkefølge og nummerering); rolig informasjonsbærende
bevegelse (hendelsesbundet haptikk, passiv stillhet, success først når
verdi er levert; lyskant = hierarki/affordance, aldri dekorasjon).

**2. MERKEVAREKONTRAKT** (endres kun ved eksplisitt merkevarebeslutning):
espresso/petrol/amber-eierskapet, verdistigen, typografihierarkiet
(temperaturens visuelle dominans; Fraunces-rollen), ordmerkegriden,
maskoten (én karakter, begrenset semantisk posevokabular, invariant
gripelinje på alle kantforankrede poser, aldri data-agens).

**3. VERSJONERT IMPLEMENTASJON** (justerbare tokens/kriterier): 3,2 s
(eierlåst releasekrav — prinsippet er «merkbar, ærlig, skippbar seremoni
kun etter eksplisitt CTA»), eksakte motion-tider/avstander, de fire
friskhetstekstene, aktuell prognosehorisont (9 dager i dag), sheet-
detents, poseantall, piksel-/punkttoleranser (1 pt ordmerke = QA-
kriterium; prinsippet er geometrisk kontinuitet), maks-5-haptikk
(sikkerhetsbudsjett), «Slik vurderer»-arket (dagens presentasjon —
prinsippet er kort begrunnelse ved rådet), barneselektoren (vises kun
når reelt valg finnes). «Aldri TOG-tall» avgrenses til antrekk/Bytt —
TOG er legitimt i Soveposeguiden. Native-kontroll-punktet fredes som
plattformkvalitet, ikke ideologi.
