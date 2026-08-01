# Analysesløyfen 2026-08-01 — vedtak per runde

Grundig UI/UX-analyse av hele appen, forhandlet med ekstern kritiker (Sol) over
minimum 10 runder. Områder: åpning, onboarding, Hjem, Planlegg, Familie.
Runde 2-vedtakene (åpningens kontinuitetskontrakt) står i eget notat:
`aapningskontrakt-2026-08-01.md`. Dette notatet akkumulerer resten.

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
