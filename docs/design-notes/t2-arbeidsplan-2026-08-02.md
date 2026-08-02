# T2 — Samlet arbeidsplan: Hjem, scan og resultat i «Atelier × Quiet Instrument»

## Dommen først (det de fire kartleggingene egentlig sier samlet)

Alle fire peker på **samme rotårsak**: `HjemMonter.tsx` er fem uavhengige `return`-trær (L546, L587, L630, L696, L740). Alt annet — maskot-remount, hoppende panelmargin, ulåst panelhøyde, manglende overgang til resultat — er symptomer på den ene strukturen.

Art-bibelen krever to ting som trekker i **motsatt retning** og derfor må løses i samme runde:
- §«Scan er en TILSTAND» (L217–233): scan skal **slutte** å være en egen visning.
- Sideskift-tabellen (L174): resultat skal **bli** en egen flate med 340 ms vertikal push.

Gjør du bare det første får du «scan som tilstand *og* resultat som tilstand» — dagens modell, bare penere. Det er den fella planen er bygget for å unngå.

**Motormappene er ikke i veien.** Monter-treet leser kun `Recommendation`-*typer* (`result-rows.ts:14`) og får ferdige verdier som props. Det er LEGACY-grenen (`HjemScreen.tsx:61-71`) som importerer `lib/recommendation/scene`. Hele T2 kan gjøres uten å åpne én forbudt fil. Detaljert avgrensning i §«Forbudte mapper» nedenfor.

---

## FORUTSETNING (ikke et steg — en portdom)

**Det finnes null maskinell verifikasjon av appen i dag.** `verify-cta.mjs` måler kun `b1-slice.html`. Repoet har ingen jsdom (`vite.config.ts` har ingen `test`-blokk); alle komponenttester bruker `renderToStaticMarkup`. **Ingen eksisterende test kan bevise timing, bevegelse, remount eller stillhet.** Art-bibelens krav er formulert som *maskinmålte* (L136, L230, L314) — uten en tilsvarende runner mot appen håndhever ingenting seg selv (jf. `project_babyora_designverifikasjon`).

Derfor: **Steg 1 er måleinstrumentet, og det skal være RØDT før ombyggingen.** Et steg som ikke kan bli grønt av en maskin er ikke et steg i denne planen.

---

## STEGREKKEFØLGE

### Steg 0 — Nullmåling · SMAL · ingen filendringer
Kjør og skriv ned: `npm test`, `node tools/design-doctrine-lint.mjs`, `npm run build`, `npm run e2e`.

**Spesifikt å avklare:** `e2e/home-outfit-motion.ts:128/187` og `e2e/outfit-truth.ts:360-483` klikker `#hjem-current-outfit-trigger`. Den id-en finnes **ikke i noe** `src/components/hjem/*.tsx` — kun i legacy-treet, som aldri rendres (`flags.ts:13` = `true`). Disse to e2e-filene er enten allerede røde eller kjøres ikke. Det avgjør om Steg 13 er billig eller dyrt.

**Grønt:** en skriftlig baseline av hva som faktisk er grønt i dag.

---

### Steg 1 — Måleinstrumentet · SMAL · kun nye filer
**Oppretter:**
- `tools/verify-hjem.mjs` — Playwright mot bygget app (samme mønster som `e2e/smoke.ts`: `vite preview` + `chromium`), `?seed=demo`, `page.route('**/api/forecast*')` → fixture. Ingen appkode røres for å gjøre den testbar.
- `e2e/fixtures/forecast-1c-partlycloudy.json`, `forecast-rain.json`, `forecast-offline.json` (route→abort)
- `tools/verify-hjem.baseline.json`

**Måler nøyaktig det `verify-cta.mjs:24-127` måler, mot ekte app:**
1. maskotens `offsetTop/offsetLeft` konstant gjennom hele CTA-momentet
2. `.hjm-panel` `offsetHeight` konstant
3. samlet maskotdekning (`oNorm + oCur`) ≥ 0,999 i hver frame
4. håndgli ≤ 1,00 px per hånd (samme `HANDS`-matrise, `measure-hands.mjs`-verdiene)
5. antall distinkte rotasjonsvinkler (bevegelse, ikke hopp)
6. lengden på stillheten mellom siste bevegelse og push — krav ≥ 500 ms
7. antall samtidig synlige flater gjennom momentet

**Grønt:** runneren kjører og er **RØD** på minst punkt 1, 2, 3, 5, 6. Er den grønn er den feil skrevet.

> Uten dette steget er alt som følger «verifisert med øyet» — og det var øyet som lot lys modus falle ut av dybdekontrakten.

---

### Steg 2 — Bevegelsestokens · SMAL
`design-tokens-v2.css` har **null** bevegelsestokens. Slicen er 100 % var-drevet (13 varigheter, 2 kurver). Drift er allerede i gang: `cubic-bezier(.2,.7,.2,1)` finnes hardkodet i `OnboardingScreen.tsx:931`, `(.2,.7,.3,1)` i `VarmEllerKaldScreen.tsx:171,364`, `(.22,.7,.2,1)` i slicen.

**Endrer:** `src/styles/design-tokens-v2.css` (ren tilføyelse, nytt `--dw-m-*`-blokk: `feedback 120 / state 220 / handoff 280 / push 340 / push-back 280 / step 260 / bow-in 420 / bow-out 240 / marker 180 / atmo 300`, `--dw-ease`, `--dw-ease-settle`).
**Oppretter:** `src/styles/__tests__/design-tokens-v2.motion.test.ts` — hvert token deklarert nøyaktig 1 gang; `hjem-monter.css` inneholder **ingen** rå `\d+ms`/`cubic-bezier(` utenfor `var()`.

**Grønt:** ny test grønn, `design-tokens-v2.depth.test.ts` uendret grønn (den leser kun `--dw-depth-*`/`--dw-sh-*`).

---

### Steg 3 — Dybdekontrakten får konsumenter · SMAL (1 CSS-fil + 1 test) — **krever eierbeslutning**
**Dette er R1 og kan ikke oppdages i CI — det må avgjøres.** `hjem-monter.p8-light-mode.test.ts:45-70` låser **nøyaktig det mønsteret dybdekontrakten forbyr**: sju `--hjm-shadow-*` deklarert (L48) + konsumert via `var()` (L53), begge temablokker (L59-60), og presis **7** `rgba(42, 29, 18, *)` i lys-blokken (L69). Art-bibelen L361-368 kaller dette rotårsaken til «den lyse føles flatere enn den mørke».

`--dw-depth-hero|raised|action|selected` (`design-tokens-v2.css:104-107`) har **null konsumenter i hele `src/`**. Kontrakten er grønn mens skjermene står utenfor den.

**Endrer:**
- `src/components/hjem/hjem-monter.css` — `.hjm-panel` (L121), `.hjm-rows` (L587), `.hjm-cta` (L479), `.hjm-thumb`, `.hjm-strip`, `.hjm-prev` → `var(--dw-depth-hero|raised|action|selected)`. Slett `--hjm-shadow-*`-blokken (L44-49) og begge lys-overstyringene (L61-67, L71-77).
- `src/components/hjem/__tests__/hjem-monter.p8-light-mode.test.ts` — test 2 **snus**: `--hjm-shadow-*` skal ikke lenger finnes; `var(--dw-depth-` skal forekomme ≥ 4 ganger. Test 1 (hex-lint, kun `#3a2a1a`), test 3 og 4 beholdes ordrett.

**Oppretter/endrer:** `src/styles/__tests__/design-tokens-v2.depth.test.ts` — 16. test: kontrakten skal ha konsumenter (grep `src/**/*.css` etter `var(--dw-depth-`, ≥ 4 treff utenfor definisjonen).

**Grønt:** begge testfiler grønne samtidig — det er umulig i dag, og det er poenget.

> **Ikke port slicens fem kontraktsbrudd** (R4): `.toggle button.sel` (:152 `rgba(0,0,0,.3)`), `.sumstrip` (:230), `.kp-plate` (:280), `.cta:active` (:163) og drop-shadows på `.wicon`/`.plate img` er hardkodet kun-mørke. Testen kan ikke se dem — de må avvises manuelt her.

---

### Steg 4 — Ett skall i stedet for fem trær · **BRED** · hjertet i T2
**Endrer:** `src/components/hjem/HjemMonter.tsx` (den store), `src/components/hjem/hjem-monter.css` (L88-90, L266-340)

Nytt tre, ett sted, over fasebyttet:
```
<div className="hjem-monter">
  <div className="hjm-top">…merke…</div>
  <div className="hjm-panel-slot">          ← FAST margin, ingen data-compact
    <div className="hjm-mascot-wrap">       ← ETT objekt, aldri remountet
      <img .hjm-mascot-normal/><img .hjm-mascot-curious/>
    </div>
    <WeatherScene …>{panelContent}</WeatherScene>   ← children-sloten finnes allerede (WeatherScene.tsx:61,158, ubrukt i dag)
  </div>
  <div className="hjm-body">{bodyContent}</div>
</div>
```
Fasen velger **kun** `panelContent` og `bodyContent` — aldri komponenttype for maskot eller panel.

**Slett:** `data-compact`-koblingen til fasen (`.hjm-panel-slot[data-compact]`, css L90; `data-compact` på maskoten, css L280). Kompaktstrategi må eventuelt komme fra viewport, aldri fra scan-fasen.

**Behold urørt (vakter som fungerer):** `isScanOverlaySuppressed` i begge lag (`ScanOverlay.tsx:61,122` + orkestratoren), `decideScanEntry`→`show-cached`-grenen (`HjemMonter.tsx:432-445`), `awaitingScanData`-effekten (L406-409), a11y-kontrakten (sr-only `aria-live` «Beregner antrekk» + synlig `aria-hidden` overskrift).

**Rør ikke:** mount-effekten L428-454. Den har `scan` i deps, og `scan`-objektet er nytt ved hver fase-endring (`useScanCoordinator.ts:33-36`) → effekten kjører ved hvert fasebytte med `seenIdentityRef` som eneste vern. Flytt den ikke inn i en ny wrapper.

**Tester som brekker og må skrives om i SAMME commit:**
| Fil | Hvorfor | Hva den skal bli |
|---|---|---|
| `__tests__/HjemMonter.test.tsx:139-176` | Krever `data-pose="curious"` i scanning og **fravær** i weather-ready. Med én maskot finnes begge poser alltid. | Assert på `data-pose`-attributtet + at **antall** `.hjm-mascot`-elementer er identisk i alle fem faser |
| `__tests__/HjemMonter.p5-wiring.test.ts:43-44` | Teller nøyaktig **2** `onAdjustLocation={handleOpenAdjust}` | Ett kallsted igjen → tell 1, eller bedre: assert på at WeatherScene alltid får propen |
| `__tests__/MascotIdle.test.tsx` | 11 kildetekst-kontrakter på innrykk og JSX-rekkefølge | Oppførselstester |
| `__tests__/HjemMonter.p5-wiring.test.ts:60,65` | Matcher eksakt JSX-streng **inkludert innrykk** for de to ghost-knappene | Assert på tekst + `onClick`-mål, ikke formatering |

**Grønt:** `verify-hjem.mjs` punkt 1 (posisjon konstant) og 2 (panelhøyde — foreløpig via innholdstilfeldighet) går fra RØD til GRØNN. Alle omskrevne tester grønne. Punkt 3/5/6 fortsatt røde (Steg 6–9).

---

### Steg 5 — Reservert panelhøyde · SMAL · **her lyver slicen**
Slicen låser `min-height` til `max(hWeather, hScan)` målt **ved oppstart** (`b1-slice.template.html:443-452`) med `1°`, `Trondheim`, `Lillian · 4 måneder` — alt hardkodet.

I produksjon endrer panelet innhold hele tiden: `tempC=null` → `«–»`; `cityLabel='Sted mangler'` (`HjemScreen.tsx:410-414`); `freshnessLine` veksler «Oppdatert nå» / «Sist oppdatert 06:40» / «Henter vær …» (`HjemMonter.tsx:147-169`); `staleBadgeLabel` dukker opp og forsvinner (`WeatherScene.tsx:132-137`); Dynamic Type. **Portdommen sier det rett ut** (`portdom-runde21.txt:49`): *«320px må være reservert minimumshøyde, ikke låst maksimum. Dynamic Type og lange stedsnavn må kunne utvide panelet.»*

**Endrer:** `hjem-monter.css` (`.hjm-panel { min-height: var(--hjm-panel-floor, 320px) }`), `HjemMonter.tsx` (`useLayoutEffect` som måler **scan-tilstandens** intrinsiske høyde én gang og setter gulvet — aldri et tak).

**Grønt:** `verify-hjem.mjs` punkt 2 grønn **og** en ny assertion: panelhøyden med `cityLabel="Nord-Trøndelag øvre bygdeallmenning"` + `staleBadge` synlig skal være **≥**, aldri klippet. En låst maks ville bestått punkt 2 og strøket her.

---

### Steg 6 — Bøyningen · SMAL
`hjem-monter.css:291-297` setter `transition: opacity …, transform …` på de **samme** `<img>`-ene som bærer lean-transformen (L302-309). Art-bibelen L270-274 navngir dette som fella: `transition` er en shorthand, og bøyningen hopper til sluttvinkelen.

**Endrer:** `hjem-monter.css` L266-340 (skrives om), `MascotPeek.tsx` (wrapper-element rundt de to `<img>`).
- Bevegelse på `.hjm-mascot-wrap`: `transform-origin: 52% 74.6%` (kontaktlinjen — 78,7 % er fingertuppene, art bible L248-250), `rotate(1.2deg) scaleY(.975)`, inn `var(--dw-m-bow-in)` 420 ms / ut 240 ms.
- Opasitet på bildene: inn 150 ms; ut holder full dekning til 120 ms, kuttes så på 40 ms (kompenserte kurver, art bible L213-215).
- **Slett** `rotate(3deg) translateY(4px)` med origin `52% 79%` (L302-309) og `data-compact`-koblingen.

**Grønt:** `verify-hjem.mjs` punkt 3 (dekning ≥ 0,999), 4 (håndgli ≤ 1,00 px — 3,2° gir 2,46 px og **stryker**, taket er 1,29°) og 5 (mange distinkte vinkler) grønne.

---

### Steg 7 — Kadens, markørtid og haptikk · SMAL i kode, **BRED i konsekvens**
**Endrer:** `src/components/hjem/scan-orchestration.ts`
- Erstatt ratio-modellen (`FULL_SCAN_CHECK_DELAY_RATIOS`, L39-43, avledet fra en pensjonert 2,1 s-mock) med absolutte `[450, 950, 1450]`.
- Nye konstanter: `SCAN_MARKER_MS = 2500`, `SCANLINE_DURATION_MS = 2500`, `MASCOT_RELEASE_MS = 2260`, `SKIP_REVEAL_MS = 700`, `SYNTH_REVEAL_MS = 1950`.
- `FULL_SCAN_DURATION_MS = 3200` **røres ikke** — eierlåst (art bible L124).
- Haptikk: `10@0, 6@450/950/1450, prepare@2500, [12,60,18]@3200`. **Ingen success ved markøren** (art bible L120-121).

**Låser som må rives (samme commit):** `__tests__/scan-orchestration.test.ts:48` (`[838, 1600, 2362]`), `:63` (haptikk-atMs), `__tests__/ScanOverlay.test.tsx:127-132` (`animation-delay:550/1050/1550ms`).

**Fallgruve — Juster driver:** `FinnAntrekkScreen.tsx:96-100` importerer `FULL_SCAN_DURATION_MS` + `fullScanHapticSchedule` og har **egen kopi** av timer/haptikk-kablingen (L497-508, 542-566), egen fasemaskin (`finn-antrekk-calc.ts`), ingen maskot, ingen skip, ingen `awaitingScanData`. Enten trekkes koreografien ut i én delt `useScanChoreography`-hook som begge kaller, eller så divergerer flatene ved neste endring. `FinnAntrekkScreen.instrument-panel.test.tsx:132-159` har kildetekst-asserts på nettopp disse importstrengene.

**Grønt:** omskrevne enhetstester grønne; `verify-hjem.mjs` punkt 6 (stillhet) går fra 0 ms til > 500 ms først når Steg 8 og 9 også er på plass — **noter at dette steget alene ikke gjør punkt 6 grønt.**

---

### Steg 8 — Fullføringsmarkøren · SMAL · **selve eierfunnet, og der slicen lyver verst**
I dag: rad 4 spinner `hjm-spin 1s linear infinite` (css L391) med statisk «setter sammen…». Ceremonien mangler punktum.

**Endrer:** `ScanOverlay.tsx` — ny prop:
```ts
completion:
  | { kind: 'pending' }
  | { kind: 'done'; garmentCount: number; silhouettes: readonly (string|null)[] }
  | { kind: 'awaiting' }
```
Ved `done`: rad 4 får hake + «Lag for lag / N plagg», silhuetter til full opacity, overskrift → «Antrekket er klart», underlinje → «Innerst til ytterst, klart for {navn}.»

**Slicens snarvei som ikke overlever:** slicen skriver `'6 plagg'` som en streng-literal. I appen kommer tallet fra `deriveResultRows(recommendation).length` — og `recommendation` kan være `null` ved 2500 ms. `recommend()` er try/catch'et til `null` (`HjemScreen.tsx:458-465`), og `awaitingScanData` (`HjemMonter.tsx:321,383) er nettopp tilstanden «timeren fyrte før motoren hadde svar». **En markør som lander med «6 plagg» når det ikke finnes et resultat er en løgn.** Derfor `kind:'awaiting'`: markøren lander ikke, teksten forblir ærlig ventende, og `awaitingScanData` får endelig UI (i dag leses den aldri i JSX — kommentaren L313-321 lover en «ærlig lastetilstand» som ikke finnes).

**Silhuettene:** `getGarmentImage(row.garmentId)` returnerer `null` for 32 av 60 katalog-id-er (`monter-assets.ts:104-108`, «heller ingen bilde enn feil bilde», testlåst). Slicen har fire alltid-tilstedeværende bilder. Rendre kun ikke-null, maks 4.

**Oppretter:** `src/lib/copy/__tests__/scan-marker-copy.test.ts` — «Ferdig analysert» og ordet «analysert» er **FORBUDT** (art bible L118-119, grunnlovens regel om at Babyora snakker i plagg og handlinger). «Antrekket er klart» i sentence case, ikke versaler, ikke med hake.

**Grønt:** ny copy-test grønn; `ScanOverlay.test.tsx` utvidet med `awaiting`-grenen; `verify-hjem.mjs` viser markøren lande innen 180 ms fra 2500.

---

### Steg 9 — Analysestreken · SMAL · **appen er her bedre enn slicen**
I dag: `translateY(238px)` **hardkodet** (css L359), varighet = hele 3200 ms, fader ut med opacity. Art bible L138-145 forbyr eksplisitt en hardkodet verdi og krever at streken går **helt ut** før den stopper (målt: passerer panelbunnen ved 2462 ms).

**Endrer:** `ScanOverlay.tsx` (`useLayoutEffect` setter `--hjm-scan-travel: ${panel.offsetHeight + 6}px` **før** paint), `hjem-monter.css` L353-360 (`translateY(var(--hjm-scan-travel))`, varighet `var(--dw-m-scanline)` = 2500 ms, fjern opacity-uttoningen — den skal forlate boksen, ikke oppløses).

**Kritisk arkitektur-note:** slicen trengte en egen `.scanclip` (`:197`) fordi den la maskoten **inne i** `.panel` og derfor måtte fjerne `overflow:hidden`. Appen har maskoten som **søsken** av `.hjm-panel` i `.hjm-panel-slot`, og `.hjm-panel` eier allerede `overflow: hidden` (css L119, D1-doktrinens klippekontekst). **Ikke port `.scanclip`, og ikke flytt maskoten inn i panelet** — det ville brutt D1 i `tools/design-doctrine-lint.mjs` og krevd et ekstra lag uten gevinst.

**Grønt:** `hjem-monter.css` inneholder ingen px-literal i `@keyframes hjm-scan-sweep` (ny lint-assertion i `p8-light-mode.test.ts`); `verify-hjem.mjs` måler at streken er ute av panelet ved ≤ 2500 ms og deretter **helt stille** → punkt 6 (stillhet ≥ 500 ms) blir grønn her.

---

### Steg 10 — Resultatet blir en flate med push · **BRED**
**Endrer:** `HjemMonter.tsx` + `hjem-monter.css`. Ny intern to-lags push inne i `.hjem-monter`: begge flater beveger seg samtidig, 340 ms opp, `transform` alene — aldri `scrollTop` (art bible L192).

**Ikke som en route-endring.** App bruker `AnimatePresence mode="wait"` + lazy route (`App.tsx:723-744`); en route-veksling ville unmountet Hjem, nullstilt den komponent-lokale koordinatoren (`useScanCoordinator` lager ny per mount, `coordinator.ts:106` starter alltid i `weather-ready`), og brutt scrollposisjon. Art-bibelen L179 sier dessuten at hovedfaner **aldri** pusher. Pushen må derfor bo inne i Hjem.

**Rør ikke tab-baren:** `BottomTabBar` mountes globalt av `App.tsx:750-752`. Slicens `.tabbar`-div er mock. Skallet står stille (art bible L182-185).

**RM:** `pushTo` kollapser til direkte bytte (slicen `:470`). Gjentatte trykk låses mens overgangen pågår.

**Grønt:** `verify-hjem.mjs` punkt 7 — gjennom hele CTA-momentet skal **kun én** flate være synlig; under selve pushen skal ingen frame ha to halvgjennomsiktige flater (art bible L314). Hjem tilbakestilles først 380 ms etter (`PUSH_PAGE + 40`, slicen `:557`) — ellers ser man panelet falle tilbake til værtilstand mens det fortsatt skyves ut.

---

### Steg 11 — Atmosfæren · SMAL
`design-tokens-v2.css` har ingen atmosfære-tokens i det hele tatt. `LivingHomeBackground.css` er et annet system (F79-arv), ikke dette.

**Endrer:** `design-tokens-v2.css` (`--dw-atmo-hjem/-res`, mørk alpha **.32 — aldri høyere**, lys .12–.18, art bible L342-348), `hjem-monter.css` (`.hjm-atmo`-lag, 300 ms krysstoning).

**Grønt:** ny test i `design-tokens-v2.motion.test.ts`: alpha i mørk `--dw-atmo-*` ≤ .32; poolen har `transition: opacity` og **ingen** `transform` (den får aldri gli med pushen — art bible L187-190).

---

### Steg 12 — De 9 proof-assetene inn · SMAL i diff, **stor i konsekvens**
Assetene i `docs/design-notes/b1-proof/` er datert **2. aug 18:16–20:11** og laget i den reviderte riggen (varmnøytral 4000–4300 K, art bible L34-37). Assetene i `public/monter/` er fra **31. juli 21:27–22:17** — den «golden studio»-riggen ekstern review **felte**.

**Kopieres (10 filer):**
| proof | → public/monter/ | treffer også |
|---|---|---|
| `ullsett-tykt.png` | `plagg-tykt-ullsett.png` | — |
| `ullsokker.png` | `plagg-ullsokker.png` | — |
| `ull-mellomlag-tykt.png` | `plagg-ull-mellomlag.png` | **også `ull-mellomlag`** |
| `vinterdress.png` | `plagg-vinterdress.png` | **4 id-er** (`vinterkjoredress`, `-isolert`, `vinterdress`, `-isolert`) |
| `lue-m-ull.png` | `plagg-lue-med-ull.png` | — |
| `votter-tykke.png` | `plagg-votter.png` | **også `votter`, `votter-dun`** |
| `maskot.png` | `maskot.png` | Hjem + scan |
| `maskot-nysgjerrig.png` | `maskot-nysgjerrig.png` | scan |
| `vaer-delvis-skyet.png` | `vaer-delvis-skyet.png` | `fair`, `partlycloudy` |
| `vaer-regn.png` | `vaer-regn.png` | alle `*rain*` |

**Den ekte risikoen:** 6 av 42 plagg og 2 av 7 værikoner får ny rigg. **Enhver anbefaling som blander re-belyste og gamle plagg viser to lysrigger i samme vitrine** — og det er den vanligste tilstanden, ikke et kanttilfelle. Værikonet og plaggene deler ikke skjerm i dag (panel vs. resultatliste), men silhuettene i synteseblokken (Steg 8) og resultatlisten gjør det.

**Oppretter:** `tools/asset-rig-check.mjs` — leser alfa-maskerte piksler per asset (`sharp` er allerede devDependency), regner middels hue/chroma/luminans, og feiler når et asset ligger utenfor den nye riggens bånd. Kjøres over hele `public/monter/`. **Dette er den eneste måten å oppdage riggblanding uten øyet.** Resultatet er en liste over de 36 plaggene som må re-genereres i B2 — den listen er en leveranse i seg selv.

**Grønt:** `plagg-katalog-integritet.test.ts` fortsatt grønn (alle 60 PNG-er finnes, `getGarmentImage` peker aldri på 404, de 4 T1A-nullene urørt); `asset-rig-check.mjs` kjører og rapporterer et tall.

---

### Steg 13 — Legacy-riving · **BRED** · valgfri, sist
Bare hvis Steg 0 viste at e2e-kostnaden er akseptabel.

**Sletter:** `HjemScreen.tsx` L1006-1235 (legacy-treet + `<style>`-blokken L1010-1034), `src/components/hjem/flags.ts`, importene `HjemScreen.tsx:61-71` (`lib/recommendation/scene`, `verified-avatar`, `avatar-tier`) — **da forsvinner Hjems siste kobling til `recommendation/` helt**.

**Endrer:** `__tests__/HjemScreen.flag.test.tsx` (krever i dag at BEGGE grener finnes ordrett, L64-70), `__tests__/HjemScreen.outfit-transition.test.tsx` (rendrer legacy-eksporten `HomeGarmentPills`), `e2e/home-outfit-motion.ts:1017-1045` (`assertProductionWiring` krever `LivingHomeAtmosphere`, `HomeGarmentPills`, `selectHomeSources`, `data-outfit-transition-source={source.itemId}`), `e2e/outfit-truth.ts:360-483`.

---

## FORBUDTE MAPPER — hva som ikke kan gjøres, og hvordan vi unngår det

**Låst (kun lesing):** `src/lib/wool-layers`, `clothing-engine-v2`, `met-no`, `planning`, `outfit` (visningskomponenter unntatt), `recommendation`.

| Ønske | Blokkert av | Slik unngås det i T2 |
|---|---|---|
| «N plagg» i markøren | — | `deriveResultRows(recommendation).length`. `result-rows.ts:14` importerer kun *typer* fra wool-layers. Fritt. |
| Silhuetter i synteseblokken | — | `getGarmentImage` (`lib/monter-assets.ts`). Fritt. |
| Deterministisk vær i testrunneren | `met-no` låst | **Playwright `page.route('**/api/forecast*')`.** Klienten går via egen proxy (`client.ts:19-22`), ikke direkte mot met.no. Null appkode endres. |
| Egen feil-UI når `recommend()` kaster | `recommendation` låst | `HjemScreen.tsx:458-465` fanger allerede til `null`. Vi leser bare `recommendation === null` i HjemMonter. Fritt. |
| «Vis forrige antrekk» (i dag no-op, `HjemMonter.tsx:498,673-675`) | `scan-cache-store` er ikke låst | Krever at cachen beholder FORRIGE slot, ikke bare gjeldende. **Reelt scope-arbeid — hold utenfor T2.** Med nytt designspråk får knappen mer visuell vekt og leser som en feil; **fjern den heller i Steg 4** enn å la den stå. |
| Alternativ-blokken i Kle på (slicen `:566-581`) | `wool-layers/alternatives.ts` låst; T1B-feltene mangler | **Utenfor T2 i sin helhet.** Slicens tre eksempler («To ullsett oppå hverandre», «Ull-jakke + ull-bukse», «Balaklava») finnes **ikke** i `ITEM_ALTERNATIVES`; faktiske alternativer er `bomullssett`, `tykk fleece`, `tynn lue`. Og «Ull-jakke + ull-bukse» er en **komposisjon av to plagg** — `Alternative.name: string` kan ikke modellere det. `katalog-audit/t1b-validering.md` slår formelt fast at T3 ikke kan starte. En ny alternativ-datakilde må bo utenfor de låste mappene. |
| Få «6 plagg» på Hjem til å matche antall steg i Kle på | `outfit/` låst | `result-rows.ts:37-38` kollapser `ekstra`+`utstyr` til «Tilbehør», mens `currentOutfitContext` splitter dem (`HjemScreen.tsx:510-515`) og `OutfitGarmentList` viser to seksjoner. **Hjem og Kle på teller ulikt i dag.** Vi kan endre HjemScreens splitting (tillatt), men det endrer hva `outfit/` mottar. **Ikke rør i T2 — legg inn en test som dokumenterer avviket** (se R7 nedenfor). |

---

## RISIKOREGISTER — hver risiko med sin detektor

| # | Risiko | Oppdages av |
|---|---|---|
| R1 | `hjem-monter.p8-light-mode.test.ts` og dybdekontrakten kan **ikke begge** passere etter Steg 3 | Ingen test — **eierbeslutning før Steg 3.** Dette er den eneste posten som må avgjøres, ikke oppdages. |
| R2 | Kildetekst-tester rødner på ren omskriving uten at noe er ødelagt (`p5-wiring.test.ts:43-44,60,65`, `MascotIdle.test.tsx`, `FinnAntrekkScreen.instrument-panel.test.tsx:132-159`) | Ved design: **hvert steg som rører TSX skriver om sine kildetekst-tester til oppførselstester i samme commit.** Ellers blir CI-rødt støy, ikke signal. |
| R3 | Maskoten hopper / remountes | `verify-hjem.mjs` punkt 1 + 5 |
| R4 | `transition`-shorthand dreper transformen igjen | `verify-hjem.mjs` punkt 5: **antall distinkte rotasjonsvinkler**. Ett hopp = 2 verdier. |
| R5 | Panelet endrer størrelse i trykkøyeblikket | `verify-hjem.mjs` punkt 2 |
| R6 | Panelet **låses** for lavt og klipper lange stedsnavn / Dynamic Type | Steg 5-assertion med lang `cityLabel` + synlig stale-badge |
| R7 | Hjem og Kle på teller plagg ulikt («6 plagg» ≠ antall steg) | Ny ren test: `deriveResultRows(rec).length` vs. `orderedGarments.length + equipment.length` for et fikstur-antrekk med `utstyr`. Skal **feile med en dokumentert forventning**, ikke stilles. |
| R8 | Markøren lander med et tall motoren ikke har | Ny test på `completion`-propen: `recommendation === null` ved `SCAN_MARKER_MS` → `kind:'awaiting'`, aldri `'done'` |
| R9 | «analysert»/«Ferdig analysert» sniker seg inn | `scan-marker-copy.test.ts` (Steg 8) |
| R10 | Delt CSS treffer fire andre flater | Grep-test: `.hjm-panel/.hjm-rows/.hjm-result/.hjm-cta/.hjm-prev/.hjm-trust` og `--hjm-shadow-panel` brukes av `FinnAntrekkScreen.tsx:92`; **`UkeScreen.tsx:1046,1080` bruker `.hjm-sr-only` uten å importere CSS-filen** (virker kun fordi fila er i bundelen). Ny test: enhver `hjm-*`-klasse som brukes utenfor `components/hjem/` skal fortsatt finnes i `hjem-monter.css`. |
| R11 | Juster-flaten driver fra Hjem | `FinnAntrekkScreen.tsx:96-100` importerer konstantene. Ny test: begge flater bruker **samme** `fullScanHapticSchedule`-kilde; ingen andre `setTimeout(…, 3200)` i `src/screens/`. |
| R12 | Slicens lyse verdier under AA (`#8A7660` ≈ 3,6:1, `#B4622F` ≈ 3,68:1) portes | Kontrast-test på `--dw-ink-low`/`--dw-accent` i lys blokk ≥ 4,5:1 mot `--dw-canvas` og `--dw-raised` (mønsteret finnes allerede i `design-tokens-v2.css:188-194`) |
| R13 | Slicens faste panelgradient (`#0D3036` = `--dw-w-rain`) kortslutter værsystemet | Test: `hjem-monter.css` inneholder ingen fast gradient-bunn på `.hjm-panel`; alle fem `[data-nuance]`-regler finnes. Bruk `color-mix` derivert per nyanse, ikke ett fast par. |
| R14 | Riggblanding i vitrinen (6 nye vs. 36 gamle assets) | `tools/asset-rig-check.mjs` (Steg 12) |
| R15 | Fasemaskinen nullstilles utilsiktet av en ny wrapper med egen nøkkel | `verify-hjem.mjs`-scenario: åpne Hjem → scan → resultat → bytt til Planlegg → tilbake. Resultatet skal komme umiddelbart (via `scan-cache-store`), ikke ask-blokken. |
| R16 | Slicen har **null** `focus`/`outline`-regler (grep = 0 treff) | Behold `.hjem-monter :focus-visible` (css L93-97). Test: hver ny interaktiv klasse har en `:focus-visible`-regel. |
| R17 | Fraunces brukes i 10 roller i slicen mot doktrinens «NØYAKTIG én» (`design-tokens-v2.css:27`); `hjem-monter.css:631-633` dokumenterer det motsatte for `.row .n` | **Eierbeslutning.** Deretter håndhevbar begge veier med en tellende CSS-test. |
| R18 | Amber som brødtekst (`design-tokens-v2.css:18`: «Aldri brødtekst») brytes av slicens `.kp-name`, `.row .n` | Samme test som R17 |
| R19 | Reduce Motion: alle 4 haptikk-cues fyrer samtidig (`HjemMonter.tsx:362-370`) | Eksisterende oppførsel, ikke ny — men noter den; med den nye kadensen blir «4 pulser i samme tick» tydeligere |

---

## SLICENS SNARVEIER SOM IKKE OVERLEVER PRODUKSJON

1. **`lockPanelHeight()` låser et MAKS** målt på hardkodet innhold. Produksjon har seks kilder til høydeendring. Portdommen krever reservert minimum. *(Steg 5)*
2. **`'6 plagg'` er en streng-literal.** Produksjon kan ikke garantere et resultat ved 2500 ms — `awaitingScanData` finnes nettopp fordi motoren kan være treg. Markøren trenger en tredje tilstand. *(Steg 8)*
3. **Fire alltid-tilstedeværende silhuetter.** 32 av 60 katalog-id-er gir `null`. *(Steg 8)*
4. **Scan-radene er hardkodede strenger** (`Trondheim`, `Lillian`, `1°`). `now` kan bli `null` midt i en scan.
5. **`.scanclip` + maskot inne i panelet** løser et problem appen ikke har — og ville brutt D1. *(Steg 9)*
6. **`--petrol-deep: #0D3036` ER `--dw-w-rain`.** Slicens faste gradient gjør at panelbunnen leser «regn» i alt vær og opphever hele `[data-nuance]`-systemet. *(R13)*
7. **Lysmodus under AA** på to farger som brukes bredt. *(R12)*
8. **Null fokusstiler.** *(R16)*
9. **Fem hardkodede kun-mørke skygger** utenfor dybdekontrakten (`:152, :163, :230, :280` + drop-shadows). Testen kan ikke se dem. *(Steg 3-note)*
10. **`.kp-swap` bruker `var(--r,16px)` — `--r` defineres aldri.** Dødt token. `--plate-dark` er deklarert (`:10`) og aldri referert. Ikke port dem.
11. **~15 px-verdier utenfor skalaen.** Presedensen i `hjem-monter.css:1-18` («mocken er kontrakten» → hardkod når token ikke matcher) er nøyaktig det som skapte dagens gjeld. Gjentas den, arver de nye skjermene den.
12. **Alternativ-blokken bygger på katalogdata som ikke finnes.** *(se Forbudte mapper)*
13. **`.tabbar` er en mock-div.** Den ekte er global i App.

---

## BESLUTNINGER SOM MÅ TAS FØR KODING (ikke oppdages i CI)

1. **R1:** dybdekontrakten eller `--hjm-shadow-*`. Begge kan ikke være grønne. → Steg 3
2. **R17/R18:** Fraunces i 1 rolle eller 10; amber som tekst eller ikke. → Steg 3/11
3. **Steg 13:** rive legacy nå eller la den stå. Avgjøres av Steg 0.
4. **«Vis forrige antrekk»:** fjern knappen eller finansier cachen. → Steg 4

---

## SMAL / BRED-oversikt

| Steg | Bredde | Nøkkelfil |
|---|---|---|
| 0 Nullmåling | SMAL | — |
| 1 Måleinstrument | SMAL | `tools/verify-hjem.mjs` (ny) |
| 2 Bevegelsestokens | SMAL | `design-tokens-v2.css` |
| 3 Dybdekontrakt | SMAL (2 filer) — **men eierlås** | `hjem-monter.css` + `p8-light-mode.test.ts` |
| 4 Ett skall | **BRED** | `HjemMonter.tsx` + 4 testfiler |
| 5 Panelgulv | SMAL | `hjem-monter.css`, `HjemMonter.tsx` |
| 6 Bøyningen | SMAL | `hjem-monter.css` L266-340, `MascotPeek.tsx` |
| 7 Kadens | SMAL kode, **BRED** konsekvens (Juster) | `scan-orchestration.ts` + 3 testfiler |
| 8 Fullføringsmarkør | SMAL | `ScanOverlay.tsx` |
| 9 Scanlinjen | SMAL | `ScanOverlay.tsx`, `hjem-monter.css` |
| 10 Push til resultat | **BRED** | `HjemMonter.tsx`, `hjem-monter.css` |
| 11 Atmosfære | SMAL | `design-tokens-v2.css`, `hjem-monter.css` |
| 12 Assets | SMAL diff, stor konsekvens | `public/monter/` (10 filer) + `tools/asset-rig-check.mjs` |
| 13 Legacy-riving | **BRED**, valgfri | `HjemScreen.tsx`, 2 testfiler, 2 e2e-filer |

Kritisk sti til at `verify-hjem.mjs` blir helt grønn: **1 → 4 → 5 → 6 → 7 → 8 → 9 → 10.** Steg 2, 3, 11, 12 kan flyte parallelt; Steg 13 helt til slutt.