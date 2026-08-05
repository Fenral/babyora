# 02 — Current Product Audit (Fase 1)

> Utført 2026-08-05 av Claude (CD/TL) med fem parallelle audit-agenter (619k tokens, 191
> verktøykall over kodebasen). Fullrapportene med fil:linje-belegg ligger i
> `appendix/fase1/`. Auditen beskriver commit `bd0f0c6` (main); en parallell økt jobber
> samtidig i `src/screens/`, så enkeltskjermer kan ha flyttet seg.
> Screenshots: `assets/fase1/01–06` (bygget app, 390×844, vær-fikstur).

## 1. Hva produktet ER i dag (fakta)

**Kjerne:** Norsk påkledningsapp for foreldre 0–24 mnd. Vær (met.no via egen edge-proxy)
→ deterministisk regelmotor (`wool-layers`) → nummerert plaggliste innerst-til-ytterst med
varm-norske forklaringer. Ingen backend for brukerdata — alt i WebView-localStorage.
Capacitor 8 for iOS/Android; native-følelse (statusbar, splash, haptikk i 14 filer,
back-håndtering) er reelt implementert. 92 355 linjer TS/TSX, 668 commits (alle fra juli 2026+).

**Forretningsmodell (i kode):** Hard paywall (eiervedtak 2026-07-31). Etter onboarding + én
fri leseøkt av første anbefaling krever hele appen `premium`-entitlement. Ikke-avviselig gate
(`AppPaywallGate` → `PaywallDialog dismissable={false}`). 7 dagers StoreKit intro-trial på
alle tre planer (39/99/299 kr), ingen app-side trial-maskin. RevenueCat kun native; web/dev
er mock. Free/Plus-nivåmodellen som eldre docs beskriver **finnes ikke lenger i koden**.

**IA:** Ingen router — tre faner (Hjem/Planlegg/Familie) som crossfade-søsken + vertikale
drill-push + native `<dialog>`-sheets. Edge-swipe back. Hjem er en fasemaskin
(weather-ready → scanning 3,2 s seremoni → result-current/stale) der scan-seremonien styres
av anbefalings-fingerprint (eier-override v4): nytt svar = full seremoni, kjent svar = direkte.

**Motor:** `wool-layers` er en ren funksjon med 9 temperaturbånd, 17 modifikatorer,
9 konfliktregler, soft blocks og 10 evidensmerkede hard blocks (AAP/NHS/Lullaby Trust m.fl.),
med `finalizeSafety` som siste grense. Motor 2.0 (strukturert plaggkatalog, stabile
forklaringskoder) er ferdigbygget men 100 % avslått i påvente av ekstern fagsignatur.

**Designsystem:** «Monter» (`--dw-*`, låst 2026-07-31): dark-first, espresso=rom /
petrol=tema-konstant instrument / amber=handling / ullkrem=typografi. Målt 2-punkts
avstandsskala, fast lysvektor 135°, dybde- og bevegelseskontrakt. Uvanlig: 16 testfiler
håndhever doktrinen maskinelt med frossen baseline (97 kjente brudd som bare kan krympe)
og vedtaksregister (32 vedtak, 20 låst med testplikt).

## 2. Toppfunn (prioritert)

| # | Funn | Belegg | Konsekvens |
|---|---|---|---|
| 1 | **Analytics er død i praksis.** PostHog kompileres bort uten `VITE_POSTHOG_KEY`; 15 av 20 deklarerte events fyres aldri; `trial_started` fyres kun for yearly | gjeld §7, state-premium §8 | Monetiseringsbeslutninger (fase 6) har null data; trial-trakt og churn er umålbare |
| 2 | **Sovende motorfunksjoner.** Kalibreringsloop (feedback→bias), `canRoll`, `uvIndex`, `humidity`, `vognMode='sleeping'` er implementert og testet, men ingen skjerm kabler dem | motor §6 | Deler av regelverket kan aldri fyre; «personlig kalibrering» eksisterer ikke reelt |
| 3 | **GDPR-hull.** «Mine data»/«Slett alt» matcher kun `babyora:`/`klemeg:`-prefiks; alle zustand-nøkler (`babyora.*` med punktum), nominatim- og PostHog-lagring fanges ikke | state-premium §3 | Personvernløftet i egen kode holdes ikke; abonnementsstatus overlever «slett alt» |
| 4 | **602 MB i `public/`** kopieres inn i hvert bygg; 294 MB (`alle-bilder/`) er ikke referert fra kode; ingen pruning i Codemagic før `cap sync` | gjeld §5 | Sannsynlig app-størrelsesbombe for native; git-pack 447 MiB |
| 5 | **Temperaturbånd-inkonsistens.** FinnAntrekk setter `feelsLikeC = tempC` (rå slider) mens Hjem bruker beregnet føles-som | motor §6 | Samme vær kan gi ulikt bånd/antrekk på to flater — undergraver tillit |
| 6 | **Betalingslaget er svakest testet der risikoen er høyest.** `revenuecat.ts` 0 tester; e2e dekker kun web-mock, aldri StoreKit | gjeld §4 | Kjøpsfeil oppdages først i produksjon |
| 7 | **Helsefaglig validering utestående.** `tables.ts:5–7`: terskler «MÅ valideres av helsesøster før produksjons-lansering»; Motor 2.0 venter på samme signatur | motor §3 | Lanseringsblokker og tillitsrisiko i kjerneverdien |
| 8 | **Typografi-splitt.** To uforlikte eiervedtak: `--font-sans`=systemfont (A2, 2026-07-12) vs `--dw-font-ui`=Schibsted (Monter, 2026-07-31). 9 skjermer i systemfont, Hjem i Schibsted; Fraunces-regelen brytes i ~7 skjermer | design §2 | Visuelt usammenhengende app; to vedtak må forlikes |
| 9 | **9 av 11 skjermer umigrert** til Monter (blandingssone: dw + legacy + rå hex); 10 av 11 har all stil inline i .tsx; 2 doktrineporter er røde akkurat nå (parallell økt midt i arbeid) | design §5 | Fase 3-migrering planlagt, ikke påbegynt; systemet er sterkt, dekningen svak |
| 10 | **Død vekt og versjonssprik.** leaflet/react-leaflet/lucide/4 fontpakker ubrukt; versjon 0.1.0 (vises i app) vs 1.0.11 (App Store) | gjeld §7 | Falske signaler, feil versjon utad |

Mindre, synlige fra screenshots: plagg uten illustrasjon viser bokstav-placeholder
(06); Familie-fanen har tittelen «Innstillinger» (04); paywall-løftet «Del med alle som
passer barnet» (05) mot `family_sharing=false` i kode må avklares (kan sikte til
omsorgspersonlisten, ikke deling).

## 3. Fakta vs. antakelser vs. vurderinger

**Verifiserte fakta:** alt i §1–2 med fil:linje i appendiksene.

**Antakelser (ikke verifiserbare fra kode):** at RevenueCat/ASC faktisk har entitlement/
produkter provisjonert som STATUS.md hevder; at StoreKit-trial er konfigurert for alle tre
planer; at `VITE_REVENUECAT_*`/`VITE_POSTHOG_KEY` er satt i Codemagic-bygget (uten dem er
billing OG analytics no-ops i produksjon — **kritisk å verifisere før lansering**); at
WebView-localStorage overlever OS-lagringspress (hele persistenslaget hviler på dette).

**Vurderinger (Claude, CD/TL):** Motoren og designsystemets *håndhevingsapparat* er
uvanlig solid — dette er ikke en prototype-kodebase. Gapet er konsekvent det samme
mønsteret tre steder: **bygget men ikke koblet** (motor-funksjoner, analytics-events,
Motor 2.0, paywall-triggere, designsystem-dekning). Produktet har én verdikjerne
(anbefalingen) og den fungerer, men differensieringen ligger i dag i *tonen og
seremonien*, ikke i målbar treffsikkerhet — treffsikkerheten er hverken helsefaglig
signert eller brukermålt.

## 4. Kjerneflytenes tilstand (bevis)

| Flyt | Screenshot | Status |
|---|---|---|
| Onboarding (4 steg + velkomst) | 01 | Fungerer; varm, progresjonsbar, maskot |
| Hjem weather-ready | 02/04 | Fungerer; petrol-panel, CTA, «sist kjente vær»-fallback ved værfeil |
| Anbefaling/resultat | 06 | Fungerer; 7 plagg innerst-til-ytterst; illustrasjonshull synlige |
| Planlegg (I dag/Uke/Snart) | 03 | Fungerer; feiltilstand ryddig ved manglende vær |
| Familie | 04 | Fungerer; tittel «Innstillinger» avviker fra fanenavn |
| Hard paywall | 05 | Fungerer; ikke-avviselig, 3 planer, restore/personvern/vilkår |

E2E: røyk 2/2, kjøpsflyt (web-mock) 4/4 i CI. Enhetstester 2679/2682 (2 flaky filsystem).

## 5. Til Fase 2/3 (det som må utfordres)

1. Er hard paywall etter ÉN gratis anbefaling riktig — uten data (funn 1) er det en tro, ikke et vedtak.
2. Er «anbefalingen er produktet» sann for brukeren, når kalibrering/personalisering ikke er koblet (funn 2)?
3. Tåler tilliten at to flater kan gi ulikt svar for samme vær (funn 5)?
4. Hva er verdien av Planlegg/Snart målt mot at UkeScreen koster 595 kB alene?
5. Maskotens rolle: låst produksjonsretning (matte 3D) — men aldri brukervalidert.

## 6. Work-review

Problemformulerings-review sendt til Work (GPT-5.6 Sol) 2026-08-05 — se
`11-independent-review.md` for verdikt og utfordrede premisser.
