# 12 — Prototype-spec v2 (Fase 9)

> v2 2026-08-06 etter Sols før-implementeringsreview (REVIDER,
> `appendix/fase7/sol-review-svar-fase9spec.md`). Alle P0/P1 innarbeidet.
> Byggeklarsignal gis av Sol når v2 + kontrakttestene under er godkjent.

## 1. Arkitekturprinsipp (Sols P0-korreksjoner)

1. **Vertikal skive = komplett beslutningssløyfe**, ikke skjermrekke:
   utløser → forstått situasjon → første handling → ev. korrigering → kontroll/avslutning.
   Degradert tilstand oppstår som OVERGANG i samme oppgave (virtuell klokke), aldri som
   separat demoskjerm. Start-, slutt- og feilstater defineres per sløyfe (§3).
2. **Felles semantikk, ikke felles presentasjon.** Fellesgrunnlaget deler
   sikkerhetsINNHOLD, prioritet, stopplogikk og forventet handling — som datakontrakt.
   Ingen delte anbefalings-/safety-card-/fallback-viewmodeller. `felles/komponenter.tsx`
   fra fundament-commiten omklassifiseres til FELLES-fanens demokatalog og testselens
   nøytrale flater — retningene FORBYS å importere dem for kjernepresentasjon.
3. **Nøytral faktaadapter + retningsvise transformatorer.** `felles/motor.ts` utvides
   til å eksponere `NoytraleFakta` {kontekst, værgrunnlag, datakvalitet, baseplagg,
   safetyEvents (innhold+prioritet+stoppkriterium, presentasjonsløst), gyldighet}.
   Hver retning har sin eksplisitte transformator: `p1/protokollkompilator.ts`,
   `p2/spennmodell.ts` (hypotese-deklarert), `p3/briefbygger.ts`. P4 KOMPONERER P1s og
   P3s allerede validerte kontrakter — kun overgangen brief→protokoll er ny kode.
4. **Testsele eier eksperimentet:** scenario, fiktivt barn, logging, virtuell klokke,
   rekkefølge, forskningsdisclaimer («fiktive barn og vær — ikke ekte påkledningsråd»,
   vises FØR oppgaven). Retningene eier all beslutningspresentasjon. Onboarding bygges
   ikke per retning — selen setter opp; P3 starter på brief-flaten, P4 på brief→protokoll
   (Ambients tidsscore ekskluderer oppsett).

## 2. Eksperimentdesign (Sols P1-krav)

- **Motbalansert rekkefølge:** latinsk kvadrat over de fem eksponeringene (P1–P4 +
  nullmodell — nullmodellen randomiseres også); scenariofamilier med dokumentert
  ekvivalent vanskelighetsgrad (samme motorutfall-klasse, ulike overflateverdier);
  trenings- vs. målescenarier adskilt; carryover-analyseplan i manifestet.
- **Premiummerking fjernet fra målt kjerneoppgave** — opplevd betalt verdi kartlegges i
  egen sekvens ETTER gjennomført scenario.
- **P2 er ren instrumenttest:** routeren er ikke-scorbar ramme (én aktiv «Holder
  dette?»-oppgave + én forskrivningsoppgave som kontrast). Metodisk begrensning
  loggført: hypotese-etiketten reduserer feillesningen vi måler — testen måler
  forståelse/interaksjon, ikke produksjonsrealistisk tillit.
- **P3 er en TIDSLINJE, ikke én mock:** baseline V1 → endring V2 → forsinket V1 ankommer
  etter V2 → utløp → fallback, drevet av virtuell klokke. Bevisplikt: eldre/ugyldig
  brief kan aldri bli autoritativ igjen.
- **Funn-merking:** hvert widget-/låseskjermfunn klassifiseres «gyldig i web»
  (informasjonsrekkefølge, tekstforståelse, versjonsoppdagelse, konseptuell
  stale-forståelse, tappeflyt, tilstandsmaskin-logikk) eller «krever native
  verifisering» (leveringstid, trunkering, Dynamic Type/VoiceOver, personvern på
  låseskjerm, bakgrunnsoppdatering, batteri). Native UX kan ikke bestå fase 10 på
  webbevis. P3/P4 får senere en minimal native feasibility-spike (én widgetfamilie,
  én deep link, én utløpstilstand) — upolert, ikke femte prototype. **Ingen Supabase i
  denne runden** — delt kort simuleres lokalt mot kontrakten.

## 3. Eksperimentmanifest per retning (leveres som filer i lab/, mal)

Per retning: primær hypotese · isolert variabel · aktive oppgaver · forventet korrekt
handling per scenario (entydig scoringsfasit) · farlige feil (nulltoleranse) ·
stoppregel · loggede events · **hva prototypen uttrykkelig IKKE kan støtte**.
Beslutningssløyfene:

- **P1:** system velger modus → brukeren forstår hvorfor → utfører → kontrollpunkt →
  reagerer på stoppkriterium. Regeltabellen definerer prioritet ved kombinasjoner
  (bilstol + kulde + sovende barn) og faller ALLTID til avvik/ukjent, aldri optimistisk
  normal. Full navigasjon bygges ikke.
- **P2:** kandidat-input (chips, p75 ≤8 s-mål) → posisjon i spennet → respons →
  korrigering via premisshåndtak → kontrolltegn.
- **P3:** brief V1 forstått → handling → V2 ankommer → bruker oppdager endring →
  utløp/maskering forstått som trygg degradering (ikke feil) → fallback.
- **P4:** brief → komplett første handling UTEN baseline-rekonstruksjon → åpning viser
  SAMME versjon i protokoll → kontrollpunkt. Versjons-/kontekstbrudd = syntesen feilet.

## 4. Kontrakttester (spesifiseres og bygges FØR UI — Sols klarsignalvilkår)

1. **Modusklassifisereren (P1):** tabelldrevet test — hver kombinasjon av
   safety-signaler/værterskler/datakvalitet → forventet modus; ukjent/motstridende →
   aldri normal.
2. **Retningstransformatorene:** samme `NoytraleFakta` inn → hver transformator
   produserer sin kontrakt; test at semantikken er identisk (samme sikkerhetsinnhold,
   stoppkriterier og gyldighet finnes i alle tre uttrykk) mens formen er fri.
3. **Brief-tilstandsmaskinen (P3/P4):** cachekontrakt med issuedAt, validFrom,
   expiresAt, supersedes, baselineVersjon, scenarioFingerprint; regler for offline,
   forsinkelse, rekkefølgefeil, klokkeavvik; property-test: eldre versjon kan aldri
   vinne over nyere, utløpt kan aldri re-autoriseres.
4. **ANSI-forståelsesporten (P2, metode):** navn «Spenn-avlesningsporten»; nøytrale
   spørsmål («Hva sier appen at du skal gjøre nå?» / «Hva bygger appen dette på?» —
   aldri ledende formuleringer som nevner måling); kodingsregel definert før test;
   terskel ≥85 % korrekt handlingsavlesning per sikkerhetsbærende tilstand.

## 5. Felles fundament (fra commit f3c22e6 — omklassifisert etter v2)

Beholdes: vite-oppsettet, scenariene (utvides til familier m/ekvivalensdokumentasjon),
tekst-hjelperne (semantikk), motoradapteren (utvides med NoytraleFakta-laget),
FELLES-fanen som katalog. Omklassifisert: de delte UI-komponentene er testsele-/
demoflater, ikke retningsbyggeklosser.

## 6. DoD fase 9 (uendret fra v1) + forskningssikkerhet

Alle sløyfer kjørbare ende-til-ende m/virtuell klokke; screenshots/opptak per scenario;
avvik loggført; ingen P0 i kjernesløyfer; kompromisser dokumentert. Forskningssikkerhet:
kun fiktive barn/vær, ingen sanntidsposisjon, prototypeinformasjon før oppgave,
tillitsmålingens begrensning logget.
