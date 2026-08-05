# state-premium
# Babyora — Informasjonsarkitektur og brukerflyter (Fase 1: som-det-er)

## 1. Overordnet navigasjonsmodell

Babyora har **ingen router** (ingen react-router/URL-ruter). All navigasjon er lokal React-state i `App.tsx`:

- **`tab`-state** (`useState<TabKey>('hjem')`) — tre sidestilte røtter: **Hjem · Planlegg · Familie** (`types/nav.ts:11-19`). Tab-bytte er **crossfade** (0,14s inn / 0,10s ut), aldri push (`App.tsx:74-87, 784-801`).
- **`drill`-state** (`useState<Drill>(null)`) — ett nivå ned. Drill-typene er en union (`App.tsx:162-197`): `paakledning` (current/planned), `familie-tool` (tog/varm-kald/forste-vinter), `finn-antrekk` (m/valgfri prefill) og `plaggbib`. Drills **pusher vertikalt** en skjermhøyde (340ms inn / 280ms ut, målt scenehøyde — ikke `y:'100%'`, `App.tsx:786-795`).
- **Sheet/modal-lag** — `PaakledningScreen` og `KlePaaOverlay` mountes som søsken-overlay OPPÅ aktiv rute med native `<dialog>.showModal()`; BottomTabBar fjernes helt mens de er åpne (`App.tsx:685, 815-856`).

Navigasjonsgrammatikk (dokumentert i koden selv): faner er sidestilte (crossfade), drills er hierarkiske (push). Tab-bytte nullstiller alltid drill (`onNavigate`, `App.tsx:303-308`). Back-oppførsel: drill lukkes først; står man på en tab ≠ hjem går man til Hjem (`App.tsx:495-511`). Edge-swipe fra venstre (24px trigger, 60px commit) utfører samme back (`App.tsx:513-610`). Skjermene lastes via `React.lazy` + `Suspense` med `RouteSkeleton`-fallback (`App.tsx:89-147`).

Aktiv tab i baren under en drill mappes til opener-konteksten: `familie-tool` → Familie, `finn-antrekk`/`plaggbib`/`paakledning` → Hjem (`App.tsx:673-680`).

## 2. Flytdiagram (tekstform)

```
[App-start]
  needsOnboarding? ──ja──► ONBOARDING (fullskjerm, ingen tab-bar)
  │                          1 Navn → 2 Bursdag → 3 Sted (geoloc/typeahead)
  │                          → 4 Klar (sammendrag + rediger) ── completeOnboarding()
  │                          → 5 Velkomst ── «Inn i appen» → onComplete
  └─nei──► APP-SHELL (BottomTabBar: Hjem · Planlegg · Familie)
             │
   ┌─────────┼───────────────────────┬─────────────────────────┐
   ▼                                 ▼                         ▼
 TAB HJEM (HjemMonter-fasemaskin)  TAB PLANLEGG (UkeScreen)  TAB FAMILIE
   weather-ready ──CTA──► scanning   undertabs: I dag · Uke    (= InnstillingerScreen)
   (3,2s seremoni / direkte hvis     · Snart (skjules hvis     Barn / De som passer /
   kjent fingerprint) ──►            hidden)                   Vær&sted / Varsler /
   result-current                    rad i Dagslinjen ──►      VERKTØY ──► drills:
   │  ├─ «Kle på, steg for steg» ──► │ PaakledningScreen        · TOG-guiden
   │  │   KlePaaOverlay (stepper)    │ (planned, modal)         · Varm eller kald?
   │  │   eller PaakledningScreen    │                          · Første vinter ──«Prøv
   │  ├─ «Bytt» (rad) ──► PlaggDetail│ «Snart» kan også nås       selv»──► finn-antrekk/
   │  │   Sheet ──► Plaggbibliotek   │ fra Vinterprogram          plaggbib/snart/verktøy
   │  ├─ «Hvorfor akkurat dette?» ──► VarmEllerKald-drill      + Utseende/Native/Pluss/
   │  ├─ «Juster» (WeatherStrip) ──► FinnAntrekk-drill (prefill)  Om&støtte/Logg ut
   │  └─ aktivitetsbytte ──► recalculating ──► result-current    (sheets: bytt barn,
   └─ result-stale ──«Beregn på nytt»──► scanning                 legg til barn, m.fl.)

 GLOBALT OVERLAY: AppPaywallGate (ikke-avviselig PaywallDialog) når
 onboarding ferdig + første anbefaling sett + les-ferdig-vindu stengt
 + ikke Premium + entitlement ferdig lastet. Trykk på Planlegg-fanen
 stenger vinduet umiddelbart (App.tsx:307).
```

## 3. Onboarding steg for steg

`OnboardingScreen.tsx` — 4 steg + velkomst (`Step = 1|2|3|4|5`, linje 91):
1. **Navn** — input; «Fortsett» er alltid aktiv på steg 1 (linje 815-818).
2. **Bursdag** — dag/mnd/år, auto-beregnet alder («under 1 mnd» → «X år Y mnd», linje 133-141). Gyldighet: år 2018–inneværende+1 (linje 113-120).
3. **Sted** — geolocation (8s timeout; feil → manuelt søk vises, linje 307-332) eller APG-typeahead: lokal by-database instant + debounced Nominatim 450ms (linje 345-370). Default-sted er Trondheim (linje 59-63).
4. **Klar** — sammendrag med rediger-knapper (hopper tilbake til aktuelt steg, `goEdit` linje 298-304). «Ferdig» kaller `completeOnboarding()` (persisterer barn i localStorage, `children-store.tsx:120-152`) og setter steg 5 (linje 397-409).
5. **Velkomst** — hero + «Inn i appen» → `onComplete` → `App.tsx` flipper `onboardingDone` (`App.tsx:651-659`). Viktig detalj: `needsOnboarding` flippes allerede på steg 4, derfor styrer App på egen `onboardingDone`-state (`App.tsx:228-234`).

ESC går tilbake på steg 2–4 (linje 419-428). Ingen tab-bar; egen `<main>`/`<h1>`.

## 4. Hjem — fasemaskin (HjemMonter)

`HjemScreen.tsx` beregner alt (vær → `recommend()` → swap-finalisert anbefaling → outfit-context/bundle) og render-forgrener på flagget `HJEM_SCAN_UI_ENABLED = true` (`flags.ts:13`; `HjemScreen.tsx:977`). Legacy-treet (linje 1006+) ligger igjen som rollback.

Faser (`HjemMonter.tsx:7-18`):
- **weather-ready** — fullt værpanel + maskot + «Klar for en liten tur?» + CTA. CTA-tekst velges av fingerprint (`cta-fingerprint.ts:35-36`): ukjent nøkkel → «Finn dagens antrekk» → full 3,2s scan-koreografi; kjent nøkkel → «Vis dagens antrekk» → rett til cachet resultat (eier-override v4, `HjemMonter.tsx:28-44`).
- **scanning/recalculating** — ScanOverlay erstatter panelet; aktivitetsbytte i etablert fase trigger auto-rekalkulering; feilet rekalk → result-stale (`HjemMonter.tsx:46-52`).
- **result-current** — komprimert WeatherStrip + ResultSurface (nummererte plaggrader). Utganger: «Kle på, steg for steg» (`ResultSurface.tsx:83-84`) → App åpner KlePaaOverlay-stepperen hvis bundle er 'supported', ellers PaakledningScreen-listen (`kle-paa-rute.ts:42-49`, `App.tsx:823-855`); «Bytt»-chip per rad → PlaggDetailSheet → «Se alternativer i biblioteket» → Plaggbibliotek-drill; «Hvorfor akkurat dette?» → Varm-eller-kald-drill; «Juster» (hele WeatherStrip er knappen, `WeatherStrip.tsx:51-61`) → FinnAntrekk-drill med vær-prefill.
- **result-stale** — fullt panel igjen + kontekstuell overskrift + «Beregn på nytt» (full seremoni).

Første viste anbefaling markeres idempotent i subscription-store (`HjemScreen.tsx:489-493`) — det er dette som senere armerer paywallen.

## 5. Anbefalings-/justeringsflyt (FinnAntrekkScreen)

CTA-drevet instrumentpanel (eier-redesign 2026-08-01, `FinnAntrekkScreen.tsx:1-61`): tre vertikale gauges (Temperatur/Vind/Nedbør) + aktivitetsvalg. Fasemaskin `idle → scanning (3,2s ScanOverlay) → fresh → stale → scanning…` (`finn-antrekk-calc.ts:11-17`). Slidere oppdaterer IKKE svaret live; «Finn antrekk»/«Beregn på nytt» committer. Stale-låsen er symmetrisk: drar man parametrene tilbake til committed verdi går fasen tilbake til fresh (`finn-antrekk-calc.ts:64-74`). Resultat = samme plaggrad-presentasjon som Hjem + «hvorfor»-boks; vises fra første beregning og skjules aldri (demoteres visuelt ved stale, linje 91-99). Åpnes fra Hjem (med prefill — «SEED WINS») eller fra Vinterprogrammets «Prøv selv» (uten prefill).

## 6. Plan/fremtid (UkeScreen «Planlegg»)

Tre undervisninger via SegmentedControl: **I dag · Uke · Snart** (`UkeScreen.tsx:80, 936-947`); «Snart» skjules helt når `soonAccess.presentation === 'hidden'` (linje 941-943). Innhold: petrol værmodul (hero + ForecastDisclosure nested, linje 957-991), rådgivningsmodul med verdikt + plagg-thumbs + «Dagslinjen» (PlanChangeRail, linje 1016-1105). Rad-trykk åpner planlagt antrekk som modal (`App.tsx:380-409`) — gated på `future_plan`-capability; drillen lukkes automatisk hvis tilgang faller bort (`App.tsx:206-225, 465-473`). Snart-visningen bygges av en sesjons-evaluator med klimaprofil pr. sted (linje 429-449). «Snart» kan også bestilles utenfra (fra Vinterprogram) via token-basert `requestedPlanView` (`App.tsx:313-320`, `UkeScreen.tsx:399-410`). E2E-fixtures kan overstyre entitlement/sted via `window.__BABYORA_PLANLEGG_E2E__` (linje 85-116).

## 7. Familie/Innstillinger

`FamilieScreen.tsx:18-20` er en tynn wrapper rundt `InnstillingerScreen` (eksplisitt midlertidig — «til R7 Task 7 restrukturerer»). Seksjonsrekkefølge i renderen: **Barn** (1833) → **De som passer** (1934) → **Vær & sted** (1952) → **Varsler** (2062) → **Verktøy** (ToolsSection, 2156 — åpner tog/varm-kald/forste-vinter-drills) → **Utseende** (2161) → **Native-følelse** (2187) → **Babyora Pluss** (2214) → **Om & støtte** (2250) → **Logg ut** (2400, `window.confirm`, linje 1779). Tolv inline `<dialog>`-sheets (bytt barn, legg til barn, morgenvarsel-time, ref-time, auto-posisjon, værendring-varsel, værkilde, hjelp/FAQ, tilbakemelding, personvern, slett data, vurder appen). Filen er 6259 linjer.

## 8. Kunnskaps-drills

- **TogGuideScreen** — sovepose-TOG fra romtemperatur (slider), statisk innhold + PlaggDetailSheet.
- **VarmEllerKaldScreen** — tre statiske statusrader (varm/perfekt/kald); tidligere falske knapper gjort om til statisk info (`VarmEllerKaldScreen.tsx:8-13`).
- **VinterprogramScreen** — 8 leksjoner; leksjon 1 gratis, 2–8 bak Pluss (PaywallDialog trigger `forste_vinter`) + drip (leksjon N åpner N-1 uker etter første besøk) (`VinterprogramScreen.tsx:8-11, 48-51`). «Prøv selv»-CTA kan navigere videre til finn-antrekk/plaggbib/snart via `GuideTarget` (`types/nav.ts:39`).
- **PlaggbibliotekScreen** — katalog med søk/filterchips/2-kol grid; nås fra PlaggDetailSheet («Se alternativer i biblioteket») og fra Vinterprogram.

Merk: Guide-tab-en er fjernet (nav 4→3, `types/nav.ts:1-5`); alle tidligere Guide-skjermer lever videre som drills.

## 9. Paywall-flyt

`AppPaywallGate` mountes over hele tab-routingen (`App.tsx:760`). Ikke-avviselig PaywallDialog når ALLE fem: onboarding ferdig, første anbefaling sett, øktens «les ferdig»-vindu stengt, ikke Premium, entitlement ferdig lastet (`AppPaywallGate.tsx:76-85`). Vinduet stenges av trykk på Planlegg-fanen (`App.tsx:299-308`) eller neste kalde app-åpning. Det finnes ikke lenger et gratisnivå — gaten er eneste håndheving (`AppPaywallGate.tsx:23-27`). PaywallDialog eier hele kjøpsflyten (RevenueCat purchase/restore) og gjenbrukes dismissable fra Innstillinger/Vinterprogram med ulik `trigger`.

## 10. Tilstander: tom / laster / feil / utdatert

| Flate | Tom | Laster | Feil | Utdatert |
|---|---|---|---|---|
| Rutebytte | — | `RouteSkeleton` (canvas, role=status) `App.tsx:133-147` | — | — |
| Vær (hook) | `freshness:'missing'` | `status:'loading'` | `status:'error'` m/`lastFetchedAt` | `freshness:'stale'` + `fetchedAt` (`useWeather.ts:15-25, 53-55, 72`) |
| Hjem | offline uten sist-kjent: «Henter vær» | «Henter vær…» | 'error' behandles som 'offline' → «Prøv å hente været igjen» (`HjemMonter.tsx:840-893`) | «Sist oppdatert HH:MM» (warn) + «Sist kjente vær»-badge; result-stale-fase m/«Beregn på nytt» |
| Planlegg | 'empty' → «Antrekket holder» + «Ingen endringer frem til kl. HH:MM» (`UkeScreen.tsx:1024-1056`) | `PlanleggStatusNotice` loading (826-827) | error → hele view-velgeren settes `inert` (933-934); retry | 'offline' m/`cachedAtIso` + retry; 'partial' ved hullete dekning (843-848) |
| Tilgangssjekk | — | «Sjekker tilgang til …» (neutral presentation, 1002-1006, 1107-1123) | — | — |
| FinnAntrekk | 'idle' (ingen resultat ennå) | 'scanning' (3,2s) | — | 'stale' → resultat demoteres, «Beregn på nytt» |
| Onboarding sted | — | locationStatus 'loading' | 'error' → manuelt søk åpnes automatisk (307-332) | — |

## 11. Vurderinger (min tolkning, ikke fakta)

- IA-en er uvanlig disiplinert for en app uten router: én Drill-union som eneste sannhet for «hvor kan man være», rene beslutningsfunksjoner (kle-paa-rute, cta-fingerprint, finn-antrekk-calc) skilt ut nettopp for målbarhet.
- Familie-fanen er IA-ens svakeste punkt: etiketten lover «Familie», innholdet er en 6259-linjers innstillingsskjerm med 10 seksjoner + 12 sheets.
- Tre parallelle «bytt plagg»-mønstre eksisterer samtidig (PlaggDetailSheet informasjons-only, OutfitTruthPanel committed-swap, swap-override-store) — dokumentert bevisst, men kognitivt krevende.

## FAKTA
- Navigasjonen er ren React-state uten router: tab-state med tre røtter Hjem/Planlegg/Familie (src/types/nav.ts:11-19, src/App.tsx:236) + drill-state som union av paakledning|familie-tool|finn-antrekk|plaggbib (src/App.tsx:162-197)
- Tab-bytte crossfader (0,14s/0,10s), drills pusher vertikalt målt scenehøyde (340/280ms) — erFane() skiller grammatikkene (src/App.tsx:74-87, 784-801)
- Tab-bytte nullstiller alltid drill og aborterer outfit-transition (src/App.tsx:303-308); back = lukk drill først, ellers til Hjem (src/App.tsx:495-511); edge-swipe back med 24px trigger/60px commit (src/App.tsx:513-610)
- Alle skjermer lazy-lastes med RouteSkeleton-fallback (src/App.tsx:89-147); lastegrensen ligger INNE i motion-diven slik at push-animasjonen tegnes (src/App.tsx:803-808)
- Onboarding er 4 steg (Navn/Bursdag/Sted/Klar) + velkomststeg 5; completeOnboarding() kalles på steg 4 og persisterer barnet i localStorage (src/screens/OnboardingScreen.tsx:91, 397-409; src/state/children-store.tsx:120-152); App styrer derfor på egen onboardingDone-state (src/App.tsx:228-234)
- Geolocation-feil i onboarding åpner manuelt søk automatisk; typeahead = lokal by-DB instant + Nominatim debounced 450ms; default-sted Trondheim (src/screens/OnboardingScreen.tsx:59-63, 307-332, 345-370)
- Hjem render-forgrener på HJEM_SCAN_UI_ENABLED=true (src/components/hjem/flags.ts:13, src/screens/HjemScreen.tsx:977); legacy-treet ligger igjen kompilerbart (HjemScreen.tsx:1006+)
- HjemMonter har fire faser: weather-ready, scanning/recalculating, result-current, result-stale (src/components/hjem/HjemMonter.tsx:7-18); CTA-tekst/vei velges av resultat-fingerprint: «Finn dagens antrekk» (full 3,2s) vs «Vis dagens antrekk» (cachet) (src/components/hjem/cta-fingerprint.ts:35-36, HjemMonter.tsx:28-44)
- weatherStatus 'error' behandles som 'offline' på Hjem → retry-UI «Prøv å hente været igjen» i stedet for evig «Henter vær…» (src/components/hjem/HjemMonter.tsx:840-893)
- «Kle på, steg for steg»-CTA ruter til KlePaaOverlay-stepper KUN for current-drill med bundle.kind='supported'; planlagte antrekk og usupporterte bundles får listeflaten (src/components/klepaa/kle-paa-rute.ts:42-49, src/App.tsx:823-855)
- PaakledningScreen mountes som native <dialog>.showModal()-overlay OPPÅ aktiv rute; BottomTabBar droppes helt mens den er åpen (src/App.tsx:684-685, 813-856); CurrentPaakledningScreen-grenen omtales i koden som unreachable dead code (src/App.tsx:347-349)
- Planlegg har undervisninger today/tenday/soon; «Snart» skjules når presentation='hidden' (src/screens/UkeScreen.tsx:80, 936-947); ved vær-error settes hele view-velgeren inert (UkeScreen.tsx:933-934)
- Planlagt-antrekk-drill er gated på future_plan og auto-lukkes hvis tilgang faller bort (src/App.tsx:206-225, 380-409, 465-481)
- «Snart» kan bestilles utenfra via token-basert requestedPlanView (src/App.tsx:313-320, src/screens/UkeScreen.tsx:399-410)
- FamilieScreen er en tynn wrapper rundt InnstillingerScreen (src/screens/FamilieScreen.tsx:18-20); seksjoner: Barn(1833), De som passer(1934), Vær&sted(1952), Varsler(2062), Verktøy(2156), Utseende(2161), Native-følelse(2187), Babyora Pluss(2214), Om&støtte(2250), Logg ut(2400 m/window.confirm:1779) — alle i src/screens/InnstillingerScreen.tsx
- Guide-tab er fjernet (nav 4→3); tidligere Guide-skjermer nås som drills fra Familie/Verktøy og fra Hjems resultat (src/types/nav.ts:1-5, 21-39)
- Vinterprogram: leksjon 1 gratis, 2-8 bak Pluss (PaywallDialog trigger 'forste_vinter') + drip N-1 uker (src/screens/VinterprogramScreen.tsx:8-11, 48-51)
- AppPaywallGate er ikke-avviselig og due når 5 vilkår holder (enabled, onboardingDone, firstRecommendationSeenAt, !graceWindow, !isPremium, !loading) (src/components/AppPaywallGate.tsx:76-85); Planlegg-trykk konsumerer grace-vinduet (src/App.tsx:299-308); det finnes ikke lenger gratisnivå — gaten er eneste håndheving (AppPaywallGate.tsx:23-27)
- Første anbefaling markeres idempotent fra HjemScreen (src/screens/HjemScreen.tsx:482-493)
- useWeather eksponerer status idle/loading/ready/offline/error + freshness fresh/stale/missing/error med fetchedAt (src/hooks/useWeather.ts:15-25, 53-55, 72)
- FinnAntrekk er CTA-drevet med faser idle/scanning/fresh/stale; stale→fresh er symmetrisk når parametre dras tilbake til committed verdi (src/screens/finn-antrekk-calc.ts:20, 64-74); resultat skjules aldri, demoteres ved stale (finn-antrekk-calc.ts:91-99)
- Planlegg-tomtilstand viser ekte verdict + «Ingen endringer frem til kl. HH:MM» (src/screens/UkeScreen.tsx:1024-1056)
- E2E-fixtures kan overstyre entitlement/sted i Planlegg via window.__BABYORA_PLANLEGG_E2E__, kun bak VITE_PLANLEGG_E2E (src/screens/UkeScreen.tsx:85-116)

## ANTAKELSER
- Jeg har ikke kjørt appen — fasebeskrivelser og animasjonsvarigheter er lest fra kode/kommentarer, ikke observert på enhet
- Antar at HJEM_SCAN_UI_ENABLED=true er tilstanden som faktisk shippes (flagget kan i prinsippet flippes i en build jeg ikke har sett)
- Antar at PaywallDialog-kjøpsflyten (RevenueCat purchase/restore) fungerer som kommentert — jeg har lest wiring i main.tsx og PaywallDialog-grep, ikke verifisert mot RevenueCat-SDK-oppsettet i lib/billing
- Antar at Android hardware-back håndteres i lib/native-init (kommentar i main.tsx:54-57) — jeg har ikke lest den filen
- KlePaaOverlay-stepperens interne steg-flyt er ikke lest i detalj (kun ruting inn til den)
- Kommentarenes datering/eierbeslutninger (P1-P10, R7, eier-overrides) er tatt som troverdig historikk uten kryssjekk mot git-logg (mappen er ikke et git-repo lokalt)

## GJELD
- FamilieScreen er en midlertidig wrapper: fanen heter Familie men viser hele InnstillingerScreen (6259 linjer, 10 seksjoner + 12 inline-dialoger) — R7 Task 7-restruktureringen er eksplisitt utestående (src/screens/FamilieScreen.tsx:2-5)
- Dødkode-lag beholdt for rollback: hele legacy-render-treet i HjemScreen (linje 1006+) og CurrentPaakledningScreen-grenen som per kommentar er unreachable (src/App.tsx:347-349) — to sannheter om Hjem-UI-et lever i samme fil
- Tre parallelle plaggbytte-mønstre (PlaggDetailSheet informasjons-only, OutfitTruthPanel/OutfitExperience committed-swap, session-swap-override-store) — bevisst, men dokumentasjonstungt og lett å koble feil (src/App.tsx:336-349)
- HjemScreen-props-signaturen beholder ubrukt onNavigate (void _onNavigate, src/screens/HjemScreen.tsx:373-375) — rester etter global tab-bar-flytting
- Logg ut bruker window.confirm i stedet for appens egne dialog-primitiver (src/screens/InnstillingerScreen.tsx:1779)
- E2E-hooks (window.__BABYORA_PLANLEGG_E2E__) bor i produksjonskomponenten UkeScreen, riktignok env-gatet (src/screens/UkeScreen.tsx:85-116)
- Paywall-armering er distribuert over tre filer (App.tsx onNavigate, HjemScreen markFirstRecommendationSeen, AppPaywallGate/subscription-store) — flyten er kun holdt sammen av kommentarer, ingen samlet tilstandsmaskin
- GuideTarget-typen overlever som limtype etter slettet GuideHubScreen (src/types/nav.ts:30-39) — navnet peker på en skjerm som ikke finnes lenger
- Skjermfiler med inline <style>-blokker på 1200-1800 linjer (OnboardingScreen, FinnAntrekkScreen) gjør IA-endringer dyre å diffe