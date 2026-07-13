# F79 — Farge-analyse: Taste-scoring av de fire palett-kandidatene

Beregnet med rebalansert vekting: **distinctness ×2, benchmark ×1.5, emil/color/uipro ×1**. Impeccable kjøres som guardrail (pass/fail), ikke som scoret linse.

## Resultat-tabell

| Rang | Palett | Navn | Taste-score | Guardrail |
|------|--------|------|-------------|-----------|
| 1 | 2 | Brevann (drenched bre-turkis) | **78.8** | PASS |
| 2 | 1 | Vinternatt (committed indigo) | 77.3 | PASS |
| 3 | 3 | Byggekloss (full-palette treleke) | 72.3 | PASS |
| 4 | 0 | Bakstehuset (restrained kontroll) | 42.5 | PASS |

Alle fire paletter passerer guardrailen uten brudd — kontrast, token-hygiene og tilgjengelighet er ikke differensiatoren. Differensiatoren er identitet og glimt-lesbarhet.

## Vinner: Palett 2 — Brevann (78.8)

Brevann vinner fordi den er **den eneste kandidaten der canvaset selv er identiteten**. Med et drenched bre-turkis uten én beige piksel blir «den turkise babyappen» en bokstavelig identifikator (distinctness 88 — settets høyeste). Full-verden-hue-rotasjonen 222° → 195° → 105° gjør at temperaturen kan leses av fargen alene i et 5-sekunders glimt — mekanikken bærer mest mening av alle fire kandidater.

Dommerne konvergerer på tre styrker:

1. **Distinctness (88):** Ingen i kategorien ligner. Petrol-natt med marigold-lykt (8.26:1) beskrives som «byrå-nivå komplementærlogikk».
2. **Emil/motion (88):** Størst animert payload — hele canvaset er farge (C 0.055) og roterer 117°, så temp-overgangen «føles som vær som trekker over skjermen». Eneste mock som stager to tidsakser (220ms tekst-crossfade oppå 600ms fargeskift).
3. **Color-mekanikk (79):** Reneste temp-mekanikk i settet — konstant L OG konstant chroma, kun hue roterer. Dokumentert gamut-clamping og settets beste mørk-CTA.

Vinneren er **ikke** enstemmig: uipro ga Brevann sin laveste score (61) fordi det drenchede canvaset konkurrerer med informasjonen, og benchmark (72) trakk hardt for varm-tilstanden. Men den rebalanserte vektingen (distinctness ×2) premierer nettopp det Brevann leverer: eierskap til en hue ingen konkurrent har, og et fargesystem som ER produktmekanikken. Vinternatt (77.3) tapte med 1.5 poeng fordi indigo/lavendel er kjent wellness-genre (Clue/Tolan-naboskap) som svekker eierskapet.

**Kjent svakhet som må fikses:** Varm-tilstanden er svakeste ledd hos tre av fem dommere — oliven `#E3E1B5` leses «gjørmete/datert» snarere enn «sol på vann», og lys-modus-CTA `#9D5809` er «en mudret brun-rav på turkis som Apple Weather aldri ville godkjent». Kald↔mild-differensieringen (222° vs 195°, begge cyan) er også for subtil i lys modus.

## Per palett: styrker og svakheter

### Palett 0 — Bakstehuset (42.5)

**Styrker:**
- Best hierarki-disiplin av de rolige palettene (uipro 72): surface-card rundt anbefalingen, CTA som eneste mettede blokk (4.23:1), 96px temp på 11:1
- Sunn token-graf, disiplinert konstant-L, korrekt re-tonet mørk CTA
- Solid håndverk gjennomgående

**Svakheter:**
- Per definisjon ikke-distinkt (distinctness 27): warm-grey + terracotta er nøyaktig «2026 AI warm neutral»-refleksen — gjettbar fra ordet «babyapp»
- Temp-aksen er en hvisking (ΔC ~0.02–0.05) som ikke registreres i et glimt; mild-tilstanden er et «dødt grått canvas»
- Mild (hue 70) → varm (hue 80) er nesten ren chroma-endring i samme varme bånd — nøytral-tilstanden lyver om temperatur
- Benchmark (38): «Trygg, kompetent, glemt i morgen — og kjedelig er en feil»

### Palett 1 — Vinternatt (77.3)

**Styrker:**
- Eneste kandidat med ekte brand-hue-eierskap på Clue-nivå (benchmark 85): committed indigo 290° der mørk modus er palettens hjem — «03:07»-statusbaren er Not Boring-klasse storytelling for kl. 06-våkne foreldre
- Perseptuelt smørmyk hue-rotasjon ved konstant L (262°–290°–345°) med fast korall-CTA som stabilt anker — riktig motion-hierarki
- Én-varm-aksent-disiplinen er perfekt for glimt: korall er det eneste varme punktet og finnes på under ett sekund
- Eneste med native oklch()-tokens; Fraunces med kontekst-styrt opsz (144/90/40) er reelt typografisk håndverk

**Svakheter:**
- Lavendel/fiolett er kjent wellness-genre (Clue/Tolan-naboskap) — svekker eierskapet
- Kald vs mild er 28° innenfor samme kalde familie — knapt skillbart for søvnige øyne
- Fiolett-båndet er overbefolket (layer-mellom 300°, focus-ring 292°, temp-aksent) — lagenes hue-koding svekkes
- Varm-staten i lys modus (#EED1E0 rosé) sklir ironisk mot rosa-pastell-baby-klisjeen paletten hevder å unngå
- Anbefalingen står ukortet rett på canvas; condition i kursiv aksent på 3.86:1

### Palett 2 — Brevann (78.8) — VINNER

**Styrker:**
- Canvaset selv er identiteten; ingen i kategorien ligner (distinctness 88)
- Reneste temp-mekanikk: konstant L og chroma, kun hue roterer 117° — perseptuelt kraftfullt
- Marigold-lykt mot petrol-natt (8.26:1) — settets beste mørk-CTA og «det vakreste enkelt-øyeblikket i hele settet»
- Størst animert payload; eneste mock med to stagede tidsakser (emil 88, «genuint Kowalski-nivå»)

**Svakheter:**
- Varm-tilstanden: oliven #E3E1B5 leser datert/grumsete; lys-modus-CTA #9D5809 er mudret brun-rav
- Brand-huen okkuperer den kalde polen: mild bre-turkis FØLES kald — kald/mild blir to blåtilstander (kun 27° fra hverandre i lys modus)
- Lag-visningen er svakest av alle fire (9px-swatches + ink-secondary i én trang pille); layer-mellom (180°) drukner i canvas-verdenen
- Det fargerike canvaset konkurrerer med informasjonen (uipro 61 — settets laveste enkelt-score blant topp 3)

### Palett 3 — Byggekloss (72.3)

**Styrker:**
- Sunneste temperatursemantikk (color 88): mild er ekte nøytral krem, kald iser tydelig til 230°, varm soltørker synlig til honning — materialmetaforen bærer mening fysisk
- Suverent lag-system: kobolt/gress/oker ved C 0.12–0.135 er maksimalt hue-separert med egne edge-tokens — lag-antall leses på 5 meter (best glimt-lesbarhet i settet, uipro 88)
- Best taktil mikro-fysikk: Duplo-CTA med translateY(3px) og kollapsende edge-shadow er ekte press-mekanikk
- Eneste palett der fargerikdom ER informasjonen — anbefalingen avleses uten å lese ett ord

**Svakheter:**
- Identifikatoren er formen, ikke fargen: baby→leker→primærfarger er kategorigjettbar 2.-ordens-refleks
- Mild-canvaset #F0EBDC er i praksis beige igjen; svak mild↔varm-differensiering (krem↔honning på samme hue 90°)
- Harde 0–4px offset-skygger + fire fullmettede primærfarger lander i Duolingo/leke-arkade-registeret spec-en selv hevder å unngå
- Temp-aksen svakest her: klossene står semantisk stille, 600ms-transisjonen bærer lite følelse der det teller
- Okers hårfine 3.04:1-margin i lys modus

## Konsekvenser for nedstrøms-faser

Klesfargene og komponent-tonene avledes av Brevann-verdenen. Konkrete anbefalinger:

### Plagg-lag (innerst / mellom / ytterst)

Brevanns svakeste dommer-punkt er nettopp lag-visningen (drukner i turkis canvas, layer-mellom på 180° er for nær canvas-huen). Nedstrøms-fasen bør derfor **låne Byggekloss-prinsippet** (maksimal hue-separasjon, C 0.12–0.135, egne edge-tokens) men i Brevann-kompatible toner:

- **Innerst:** varm hue klart utenfor canvas-verdenen (222°–105°-rotasjonen) — f.eks. korall/terrakotta rundt hue 25–40°, C ≥ 0.12. Varm hud-nær semantikk, maksimal kontrast mot turkis.
- **Mellom:** flytt bort fra dagens 180° (drukner i canvas). Bruk marigold/oker-familien (~75–85°) som allerede er palettens etablerte lykt-aksent — men i egen L-posisjon så den ikke kolliderer med CTA. Verifiser ≥3:1 mot alle tre canvas-tilstander (jf. okers 3.04:1-felle i palett 3).
- **Ytterst:** dyp petrol/ink fra natt-modusens mørke ende (~220°, lav L) — «skall»-semantikk, leses som den tyngste/tetteste fargen. Alternativt kobolt ~262° hvis mer separasjon trengs.
- Hvert lag trenger egen edge-token (Byggekloss-lærdommen) slik at lag-antall leses på avstand også på turkis bakgrunn.

### Vær-ikoner

- Ikonene skal IKKE bære temperatur — det gjør canvaset (222° kald → 195° mild → 105° varm). Ikonene tegnes i **ink/off-white nøytral** (samme ink-tokens som tekst) så de leses på alle tre canvas-verdener.
- Unntak: sol-/UV-ikon kan bruke marigold-aksenten (samme token som mørk-CTA-lykta) — men da må marigold reserveres og ikke gjenbrukes vilkårlig.
- Nedbør/vind-ikoner må testes spesielt mot kald-canvas (222°) der cyan-på-cyan-risikoen er størst.

### Avatar-glow

- Emil-linsen bekreftet at Brevann har radial-gradient + animerbar accent-ring: bruk denne mekanikken som scene-lys på avataren.
- **Mørk modus (hjemmet kl. 06):** marigold-glow mot petrol-natt — dommernes «perfekte lyskilde for glow-fysikk» (8.26:1). Dette bør være signaturøyeblikket.
- **Lys modus:** glow i canvas-huens komplement, ikke i canvas-huen selv (ellers forsvinner den i det drenchede turkiset — uipro-innvendingen).
- Glow-fargen bør tweenes med samme 600ms-akse som canvas ved temp-skifte, med avataren som stabilt anker (Vinternatt-lærdommen: fast ankerpunkt mens verden roterer).

### Generelt

- **Varm-tilstanden må re-tunes FØR plagg-fargene låses:** oliven #E3E1B5 og CTA #9D5809 skal erstattes (mer gyllen/rav-ren retning, mindre grønn-grå), ellers arver alle nedstrøms varm-toner gjørme-problemet.
- Kald/mild-avstanden i lys modus (27°) bør økes eller kompenseres med sekundærsignal (ikon/tekst) siden glimt-lesbarheten der er dokumentert svak.
- Re-valider kontrast etter enhver hue-justering (OKLCH gamut-clipping kan maskere luminans-endringer).

## Forbehold — hva Sivert bør se på selv i beslutningspakken

1. **Marginen er 1.5 poeng (78.8 vs 77.3).** Vinternatt vinner faktisk benchmark-linsen (85 vs 72) og uipro (79 vs 61). Brevann vinner på distinctness-dobbeltvektingen. Hvis Sivert vekter «holder i selskap med Clue/Not Boring» høyere enn «ingen ligner», er Vinternatt reelt vinneren. Se begge mocks side om side før lås.
2. **Varm-tilstanden i Brevann er usett i fikset form.** Tre dommere slaktet oliven/brun-rav. Scoren 78.8 gjelder paletten MED denne svakheten; en fikset varm-state bør mockes og godkjennes separat (jf. mock-før-lås-regelen).
3. **Kald vs mild i lys modus er nesten uskillbar (222° vs 195°).** Test selv med 5-sekunders glimt på faktisk telefon i morgenlys — dette er kjernebruksmønsteret, og to dommere flagget det uavhengig.
4. **Lag-visningen (kjernefunksjonen!) er Brevanns svakeste komponent** — mens taperen på totalscore (Byggekloss) har settets beste. Nedstrøms-planen over låner Byggekloss-mekanikken inn i Brevann-verdenen; verifiser at hybriden faktisk fungerer på turkis canvas før plagg-fargene låses.
5. **Drenched canvas er en forpliktelse.** uipro advarte at fargen konkurrerer med informasjonen. Test med reelt innhold (lange plaggnavn, mange lag, varsler) — ikke bare hero-mocken.
6. **Guardrail = pass betyr minimum, ikke godkjent design.** Impeccable sjekket brudd, ikke skjønnhet; okers 3:1-marginer og lignende grenser bør re-verifiseres etter enhver tone-justering.
