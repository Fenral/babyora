# designsystem
# Babyora — Fase 1-audit: Anbefalingsmotor og data

Dokumentasjon av det som ER i koden per 2026-08-05. Alle stier er relative til `C:/Users/siver/Downloads/trainer-marketplace-master1/babyora/`.

## 1. Arkitektur i ett avsnitt

Appen har **to anbefalingsmotorer**: den aktive legacy-motoren `src/lib/wool-layers/` («wool-layers») og en parallellbygget «Motor 2.0» i `src/lib/clothing-engine-v2/` som er **helt avslått bak feature-flags** (alle tre flagg er `false`, `feature-flags.ts:22–26`; `selectEngine` returnerer alltid `'legacy'` i produksjon). Vær hentes fra api.met.no via en egen Vercel edge-proxy (`api/forecast.ts`). **All brukerdata lagres lokalt** (localStorage/sessionStorage) — det finnes ingen Supabase eller egen backend; eneste eksterne parter er met.no (vær), Nominatim (geokoding), RevenueCat (kvitteringer) og PostHog (analytics, opt-out-bart).

## 2. Motorens input→output-kontrakt (wool-layers)

**Inngang** — `RecommendInput` (`src/lib/wool-layers/types.ts:45–82`):

| Felt | Type | Merknad |
|---|---|---|
| `weather.feelsLikeC` | number | Ute: føles-som. Ved `activity='soevn'`: **romtemperatur** |
| `weather.tempC` | number | Faktisk lufttemp |
| `weather.windMs`, `precipMmH` | number ≥ 0 | Valideres hardt (`recommend.ts:188–211`) |
| `weather.humidity?`, `symbolCode?`, `uvIndex?` | valgfrie | **Aldri levert fra produksjons-kallsteder** (se §6) |
| `child.ageMonths` | heltall 0–60 | Målgruppe 0–24; >24 er soft-warning i UI, ikke motorfeil |
| `child.canRoll?` | boolean | HB-6-svøperegel; fallback: alder ≥ 4 mnd (`safety.ts:203–204`) |
| `activity` | `'vogn' \| 'baeresele' \| 'utelek' \| 'soevn'` | soevn = innendørs |
| `exposureMin?` (default 60), `innerJakke?`, `vognMode?` (`'awake'\|'sleeping'`), `context.bilstol?`, `childCalibration?` (−1/0/+1) | | |

**Utgang** — `Recommendation` (`types.ts:120–136`): `activity`, `tempBand`, `layers` (kategoriene `innerst | mellomlag | yttertoy | ekstra | utstyr`, items som **norske fritekst-strenger**), `notes` (flat) + `structuredNotes` (kategorisert: overoppheting/kulde/sol/nedbor/sikkerhet/alder), `summary`, `safetyFlags[]` (kode, melding, kildereferanser, severity) og aggregert `severity` (NONE→CRITICAL).

**Pipeline** (`recommend.ts:46–123`) — ren funksjon, ingen IO/Date.now():

```
validateInput → bandForTemp(feelsLikeC) → baseTable[aktivitet][bånd]
  → applyModifiers (17 regler)
  → applyConflicts (CK-1..CK-9)
  → applySoftBlocks (SB-2..SB-8)
  → applySafety (HB-1..HB-10, hard blocks)
  → [bruker-overrides] → [kalibrering ±1]
  → finalizeSafety (KUN hvis overrides/kalibrering muterte — re-kjører hele
    conflicts→soft→safety-kjeden som siste grense, R2-containment)
```

`finalizeSafety` (`finalize-safety.ts:43–60`) er den «endelige sikkerhetsgrensen»: swaps fra UI går utelukkende via `applySwapsFinalized`, slik at ingen skjerm kan gjeninnføre noe safety fjernet (f.eks. vinterdress i bilstol).

## 3. Regler og terskler (faktisk kodede verdier)

**Temperaturbånd** (`tables.ts:8–18`): ekstrem_varme ≥28 · tropisk 22–27 · varm 16–21 · mild 10–15 · kjolig 5–9 · kald 0–4 · frost −7..−1 · streng_frost −15..−8 · ekstrem <−15. Kommentar i fila: kalibrert mot Babyverden/Reima, «MÅ valideres av helsesøster før produksjons-lansering» (`tables.ts:5–7`).

**Basetabell** (`tables.ts:25–245`): 4 aktiviteter × 9 bånd med lagslister. Søvn-tabellen er TOG-mappet (Lullaby Trust/AAP-2022): ≥28° bleie alene → 22–27° 1.0 TOG → 16–21° 2.5 TOG → 0–4° 3.5 TOG (`tables.ts:135–193`).

**Modifikatorer** (`modifiers.ts:74–554`), utvalg av terskler: nedbør ≥0.5 mm/t → regntrekk/regntøy/regnponcho per aktivitet, ≥2 «hølje»-note, 0.2–0.5 yr-note; vind ≥5 m/s + <16° utelek → vindtett skall, ≥5 + <5° → halsedisse, ≥8 → halsedisse alltid + vindvotter ved <0°; feels ≤5° → ullsokker; luftfuktighet ≥80 % + <10° → note; <3 mnd: ekstra ull-lag ved <5°, maks-30-min-note ved <0°; vogn ≥15° + solsymbol → varmepose-lett fjernes; 7–9 mnd + ≥22° → peak-overheating-note (kilde PMC-12386404); fottøy aldersjusteres (<9 mnd: ingen sko; 9–15 mnd: tøffel-sko; 16+: tabellens sko). Notetekster går via i18next med hardkodet norsk fallback (`modifiers.ts:42–46`).

**Konflikter CK-1..CK-9** (`conflicts.ts`): sovepose×teppe, TOG-tak per romtemp (`maxTOGForRoom`: ≥26°→0, ≥24°→0.5, ≥21°→1.0, ≥16°→2.5, ellers 3.5, `conflicts.ts:48–55`), hodeplagg innendørs, varmepose×dunteppe, to-ullsett kun ≤−15°, høy-TOG×pyjamas i mildt rom, innerJakke×barnejakke.

**Soft blocks SB-2..SB-8** (`softBlocks.ts`): maks antall items per feels-like (≥16°→6, ≥5°→9, ≥−5°→12, ellers 14, `softBlocks.ts:54–59`); romtemp ≥26/≥24 tvinger minimal påkledning; 7–9-mnd-reduksjon (apply-once-vakt); frostskadesjekk ved ≤−10° og >30 min.

**Hard blocks HB-1..HB-10** (`safety.ts:115–285`): hvert flagg bærer evidenskilder (AAP-2022, NHS, Lullaby Trust, Red Nose, CDC-NICHD, ASTM-2024, NHTSA, POLICY — `safety.ts:7–29`): ingen hodeplagg/snorer/myke gjenstander/vektede produkter under søvn, aldri teppe+sovepose, aldri to soveposer, svøpestopp ved rulling, aldri dekket vogn ved ≥22°, aldri vinterdress i bilstol. Item-gjenkjenning skjer med **regex mot de norske strengene** (`safety.ts:50–61`).

**Kalibrering** (`recommend.ts:138–160`): +1 → legger «halsedisse (kalibrert)» hvis feels <8° og ikke hals fra før; −1 → popper ett mellomlag-item hvis >1. Bias beregnes i `src/lib/feedback/feedback-store.ts`: ≥3 konsistente «kald»/«varm»-svar innen 14 dager → ±1 (`feedback-store.ts:95–112`).

**Doku-generering**: `npm run generate:rules` (`scripts/generate-rules-docs.ts`) genererer `public/regelverk.md` + `public/fagavstemning.html` direkte fra `baseTable` — regelverket har altså et menneskelesbart, autogenerert speil.

## 4. Motor 2.0 (clothing-engine-v2) — bygget, ikke i bruk

Domenemodell per spec `docs/superpowers/specs/2026-07-13-babyora-engine-2-design.md` (`types.ts:1–203`): aldersstadier (`newborn` 0–5, `mobile_baby` 6–11, `young_toddler` 12–24), 7 situasjoner (erstatter 4 aktiviteter), materialmodell (`MaterialPreference`/`MaterialFamily`), `WarmthLevel` 0–4, strukturert plaggkatalog (`GarmentVariant` med rolle/materiale/varme/vind-/vanntetthet), `ThermalIntent` (termisk behov FØR plaggvalg), og `RecommendationV2` med `schemaVersion: 2`, stabile `ExplanationCode`-er (ingen fritekst i motoren) og `fingerprint`. Deler `WeatherInput`/`TempBand`/`SafetyFlag` med legacy via type-import (`types.ts:11–12`). Visningsflagg skal være false til «kohortens fagpakke er eksternt signert (Task 17)» (`feature-flags.ts:4–7`); shadow-sammenligning (`shadow-compare.ts`) og legacy-adapter finnes, `npm run engine:v2:review` eksporterer sammenligningsscenarier.

## 5. Værintegrasjon (api.met.no)

- **Proxy**: `api/forecast.ts` (Vercel edge) kaller `https://api.met.no/weatherapi/locationforecast/2.0/compact` med UA `Babyora/1.0 (https://wool-app.vercel.app; sivertskotvold@gmail.com)` (linje 17–19), CORS åpen, edge-cache `s-maxage=900` (15 min). Egen `cacheScope=memory-only`-modus (privacy for automatisk posisjon) med no-store og rate-limit 30 req/min per IP (linje 20–22).
- **Klient**: `src/lib/met-no/client.ts`. URL fra `VITE_FORECAST_PROXY` (native/Capacitor) eller `/api/forecast` (web) (linje 31–32). localStorage-cache per koordinat (2 desimaler), TTL 1 t, maks stale-gjenbruk 6 t (linje 34–38); stale cache brukes som fallback ved nettverksfeil (linje 522–525). Egen minne-koordinator for memory-only-scope (maks 32 nøkler).
- **Validering**: `isMetForecast` er en streng runtime-kontrakt — eksakt enhetskontrakt (celsius/mm/m/s/grader/%), whitelist over ~40 symbolkoder, plausibilitetsintervaller (temp −80..60, vind 0..100 osv.), strengt stigende tidsserie (linje 42–308).
- **Avledninger**: `extractNow` (krever nøyaktig ett dekkende 1-timesintervall), `extractHourly`, `extractDailyAtHour` (Uke-skjermens «vær kl. refHour»), `extractDaily`.
- **Føles-som** (`feels-like.ts:17–43`): NWS wind chill ved T≤10° og vind >1.3 m/s; Steadman heat index ved T≥25°; ellers lufttemp.

## 6. Hvordan motoren faktisk mates (kablingsfakta)

- **HjemScreen** (`src/screens/HjemScreen.tsx:442–465`): `engineInput` = `{tempC, feelsLikeC, windMs, precipMmH, symbolCode}` fra `useWeather` + `child: { ageMonths }` (fra `dobToAgeMonths(active.dob)`) + `activity` (state, default `'utelek'`). `vognMode` er hardkodet `'awake'` («Søvn/våken-toggle på vogn fjernet», linje 432–433). Swaps går via `applySwapsFinalized` (linje 477–480).
- **FinnAntrekkScreen** (`FinnAntrekkScreen.tsx:453–463, 602–612`): slider-drevet; setter `feelsLikeC: tempC` — **wind chill-formelen brukes ikke her**; vind påvirker kun modifier-regler, ikke båndvalg.
- **Ikke koblet i produksjon** (verifisert med grep, ingen ikke-test-kallsteder):
  - `childCalibration`/`getBias()` — kalibreringsloopen er ferdig i motor+store, men **ingen skjerm kaller `addFeedback`/`getBias`**.
  - `child.canRoll` — lagres i profilen (`'yes'|'no'|'unknown'`), men mappes aldri til motorens boolean; HB-6 kjører alltid på aldersproxy.
  - `weather.uvIndex` og `weather.humidity` — finnes i typene, men `WeatherNow` (`met-no/types.ts` via `extractNow`) eksponerer dem ikke, og ingen kallsteder sender dem. UV-noten (`modifiers.ts:413`) og fuktig-kulde-noten (`modifiers.ts:218`) kan aldri fyre i produksjon.

## 7. Barneprofil-modellen

`ChildProfile` (`src/state/child-profile.ts:13–26`): `id`, `name`, `dob` (ISO-dato; alder avledes), `city`, `lat`, `lon`, `color`, `avatarKey?`, `canRoll?`, `materialPreference` (default `'best_for_conditions'`). Parseren er tolerant: forkaster kun oppføringer uten id/name/dob; ukjente enum-verdier migreres til default uten nøkkel-bump (`child-profile.ts:39–53`). Flerbarnsstøtte med aktivt barn; onboarding tvinges når listen er tom; demo-data kun ved `?seed=demo` (`children-store.tsx:84–114`).

## 8. Hva lagres hvor

**Ingen backend for brukerdata.** `package.json` har ingen Supabase-avhengighet; kommentarer sier «uten Supabase ennå» (`children-store.tsx:4`) og «synces til Supabase senere» (`feedback-store.ts:4`, `ownership.ts:4`).

localStorage (kolon-prefiks): `babyora:children:v2`, `babyora:activeChildId:v2`, `babyora:feedback:<childId>`, `babyora:bias:<childId>`, `babyora:owned:<childId>` (garderobe: default alt eid, kun «har ikke» lagres), `babyora:widget:lastSnapshot`, `babyora:analytics:opt_out`/`distinct_id`, `babyora:vinterprogram:start`, `babyora:tooltip-seen:*`, `babyora:lng`, `metno:<lat,lon>` (værcache), Nominatim-cache. sessionStorage: `babyora:overrides:<childId>` (dagsutløpende «bytt plagg»). Zustand-persist (punktum-prefiks): `babyora.location-pref`, `babyora.scan-cache`, `babyora.notifications`, `babyora.refHour`, `babyora.theme`, `babyora.ui`.

**GDPR** (`src/lib/gdpr/local-data.ts`): eksport/sletting itererer localStorage og matcher **kun prefiksene `babyora:` og `klemeg:`** (linje 19) — zustand-nøklene `babyora.*` (punktum) faller utenfor både innsyn og sletting.

## 9. Vurderinger (kort, adskilt fra fakta)

Motoren er uvanlig godt inngjerdet (ren funksjon, evidensmerkede flags, endelig sikkerhetsgrense, autogenerert regelverksdok), men datamodellen dens er fritekst-strenger med regex-gjenkjenning — nøyaktig det Motor 2.0 er designet for å erstatte. Den største designmessige observasjonen for Fase 1 er gapet mellom hva motoren KAN ta imot (kalibrering, canRoll, UV, fukt, vognMode sleeping) og hva skjermene faktisk sender: en betydelig del av regelverket er sovende i produksjon.

## FAKTA
- To motorer: aktiv legacy i src/lib/wool-layers/, parallell Motor 2.0 i src/lib/clothing-engine-v2/ bak flagg som alle er false (src/lib/clothing-engine-v2/feature-flags.ts:22–26); selectEngine returnerer 'legacy' når flagg er av (feature-flags.ts:28–35)
- Pipeline: validateInput → bandForTemp → baseTable → applyModifiers → applyConflicts → applySoftBlocks → applySafety → overrides → kalibrering → finalizeSafety kun ved mutasjon (src/lib/wool-layers/recommend.ts:46–123)
- recommend() er ren funksjon uten IO/Date.now() og validerer input hardt: ageMonths heltall 0–60, windMs/precipMmH ≥ 0 (recommend.ts:188–211)
- 9 temperaturbånd med eksplisitte grenser 28/22/16/10/5/0/−7/−15 (src/lib/wool-layers/tables.ts:8–18); kommentar sier terskler 'MÅ valideres av helsesøster før produksjons-lansering' (tables.ts:5–7)
- Basetabell 4 aktiviteter × 9 bånd; søvn er TOG-mappet 0/1.0/2.5/3.5 TOG mot Lullaby Trust/AAP-2022 (tables.ts:135–193)
- Hard blocks HB-1..HB-10 med evidenskilder (AAP-2022, NHS, LT, RN, CDC, ASTM-2024, NHTSA) og severity CRITICAL; item-matching via regex på norske strenger (src/lib/wool-layers/safety.ts:50–61, 115–285)
- TOG-tak per romtemp: ≥26→0, ≥24→0.5, ≥21→1.0, ≥18→2.5, ≥16→2.5, ellers 3.5 (src/lib/wool-layers/conflicts.ts:48–55)
- Item-tak per feels-like: ≥16°→6, ≥5°→9, ≥−5°→12, ellers 14 (src/lib/wool-layers/softBlocks.ts:54–59)
- finalizeSafety re-kjører conflicts→soft→safety som siste grense etter overrides/kalibrering/swaps; applySwapsFinalized er eneste lovlige swap-vei (src/lib/wool-layers/finalize-safety.ts:43–60, 74–80)
- Kalibrering: +1 legger 'halsedisse (kalibrert)' ved feels <8°, −1 popper ett mellomlag-item (recommend.ts:138–160); bias krever ≥3 konsistente svar innen 14 dager (src/lib/feedback/feedback-store.ts:95–112)
- Kalibreringsloopen er IKKE koblet i produksjon: addFeedback/getBias har ingen kallsteder utenfor tester (grep i src uten __tests__)
- child.canRoll lagres i profilen som 'yes'|'no'|'unknown' (src/state/child-profile.ts:23) men mappes aldri til motorens boolean i noe produksjons-kallsted; HB-6 bruker aldersproxy ≥4 mnd (safety.ts:203–204)
- weather.uvIndex og weather.humidity finnes i WeatherInput (types.ts:19–23) men leveres aldri: HjemScreen sender kun tempC/feelsLikeC/windMs/precipMmH/symbolCode (src/screens/HjemScreen.tsx:442–456); WeatherNow fra extractNow har ikke feltene (src/lib/met-no/client.ts:556–583)
- FinnAntrekkScreen setter feelsLikeC = tempC (slider) — wind chill brukes ikke for båndvalg der (src/screens/FinnAntrekkScreen.tsx:453–463, 602–612)
- vognMode er hardkodet 'awake' i HjemScreen — sove-i-vogn-modusen i motoren er ikke eksponert (HjemScreen.tsx:432–433)
- Vær hentes via Vercel edge-proxy api/forecast.ts mot api.met.no locationforecast/2.0/compact med UA 'Babyora/1.0 (https://wool-app.vercel.app; sivertskotvold@gmail.com)' (api/forecast.ts:17–19), edge-cache 15 min, memory-only-modus med rate-limit 30/min (linje 20–22, 40–48)
- Klient-cache: localStorage per koordinat (2 desimaler), TTL 1 time, stale-fallback opptil 6 timer (src/lib/met-no/client.ts:34–38, 522–525); streng runtime-validering med enhetskontrakt, symbolkode-whitelist og plausibilitetsintervaller (client.ts:42–308)
- Føles-som: NWS wind chill (T≤10°, vind >1.3 m/s), Steadman heat index (T≥25°), ellers lufttemp (src/lib/met-no/feels-like.ts:17–43)
- Ingen Supabase: package.json har ingen supabase-avhengighet; kommentarer sier 'uten Supabase ennå' (children-store.tsx:4) og 'synces til Supabase senere' (feedback-store.ts:4)
- Barneprofil i localStorage 'babyora:children:v2' + 'babyora:activeChildId:v2' (children-store.tsx:78–80); tolerant parser som kun krever id/name/dob og defaulter materialPreference (child-profile.ts:39–53)
- GDPR-eksport/sletting matcher kun prefiksene 'babyora:' og 'klemeg:' (src/lib/gdpr/local-data.ts:19); zustand-persist-nøkler bruker punktum: babyora.location-pref, babyora.scan-cache, babyora.notifications, babyora.refHour, babyora.theme, babyora.ui (src/state/*, grep name:)
- Motor 2.0-datamodell: 3 aldersstadier, 7 situasjoner, materialmodell, WarmthLevel 0–4, strukturert plaggkatalog, ThermalIntent, RecommendationV2 med schemaVersion 2, stabile ExplanationCodes og fingerprint (src/lib/clothing-engine-v2/types.ts:16–203)
- npm run generate:rules genererer public/regelverk.md + public/fagavstemning.html direkte fra baseTable (scripts/generate-rules-docs.ts:1–8, package.json:15)
- Garderobe ('Mine plagg') lagres i localStorage babyora:owned:<childId>; alt eies som default, registrering er ubegrenset gratis (src/lib/garments/ownership.ts:13, 63–89)
- Bruker-overrides ('bytt plagg') lagres per (barn, dag) i sessionStorage babyora:overrides:<childId> og utløper neste dag (src/hooks/useOverrides.ts:1–48)

## ANTAKELSER
- Antar at HjemScreen og FinnAntrekkScreen er de eneste produksjonsflatene som kaller recommend() direkte — grep viste kun disse pluss tester/adaptere, men jeg har ikke lest alle 60 filer som importerer fra wool-layers (bl.a. PaakledningScreen, UkeScreen, planned-outfit-context er ikke gjennomgått linje for linje)
- Antar at flaggene i feature-flags.ts er eneste motor-valgmekanisme (ingen remote config funnet, men ikke uttømmende verifisert)
- Antar at proxyen er deployet på wool-app.vercel.app slik UA-strengen antyder — ikke verifisert mot faktisk Vercel-prosjekt
- Antar at RevenueCat/PostHog ikke mottar barneprofildata — basert på gdpr/local-data.ts sin egen påstand og at jeg ikke fant slike kall, men analytics/track.ts er ikke fullstendig gjennomgått
- Antar at zustand-persist bruker localStorage (default) for babyora.*-nøklene — ikke verifisert at ingen custom storage er satt i alle seks stores

## GJELD
- Datamodellen i den aktive motoren er norske fritekst-strenger med regex-gjenkjenning i safety/conflicts/soft-blocks — skjørt ved omdøping av items; Motor 2.0 er den planlagte fiksen men er 100 % avslått i påvente av ekstern fagsignatur (Task 17)
- Sovende funksjonalitet: kalibreringsloop (feedback→bias→childCalibration), canRoll-mapping, uvIndex, humidity og vognMode='sleeping' er implementert og testet i motoren, men ikke kablet fra noen skjerm — reglene de styrer kan aldri fyre i produksjon
- GDPR-prefiks-mismatch: eksport/sletting dekker 'babyora:'/'klemeg:' men ikke zustand-nøklene 'babyora.*' (punktum) — innsyn og sletting er ufullstendig for location-pref, scan-cache, notifications, refHour, theme, ui
- FinnAntrekk bruker rå tempC som feelsLikeC mens Hjem bruker beregnet føles-som — samme vær kan gi ulikt temperaturbånd på de to flatene
- Temperaturtersklene bærer fortsatt kommentaren 'MÅ valideres av helsesøster før produksjons-lansering' (tables.ts:5–7) — helsefaglig validering er dokumentert som utestående i koden
- To motorer vedlikeholdes parallelt (wool-layers + clothing-engine-v2 med egne tester, katalog og shadow-sammenligning) — dobbel vedlikeholdsflate til V2 enten skrus på eller skrotes
- Værcache i localStorage er nøklet på koordinater med 2 desimaler — posisjonshistorikk ligger igjen lokalt for fast-sted-modus (memory-only-scope beskytter kun automatisk posisjon)