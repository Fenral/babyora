# Babyora F79 — Baseline-analyse

Syntese av 6 skill-evalueringer + Mobbin-benchmark. Dato: 2026-07-02.
Eierens prioritet: **det visuelle som differensiator** — 4 problemområder: avatar-liv, fargesærpreg, plagg-popup, vær-wow.

## Baseline-score

**Baseline-snitt (alle dimensjoner): 40,8 / 100**

| Dimensjon | Total | Avatar | Farge | Popup | Vær |
|---|---|---|---|---|---|
| Struktur + anti-patterns (impeccable) | 43 | 48 | 55 | 28 | 34 |
| Motion + polish (Emil Kowalski) | 41 | 28 | 55 | 35 | 40 |
| Farge (OKLCH / token-graf) | 41 | 38 | 48 | 42 | 30 |
| Patterns + pixel-spec (premium-benchmark) | 41 | 30 | 42 | 38 | 28 |
| Distinctness + production-grade | 41 | 30 | 45 | 34 | 32 |
| Industri-benchmark (Apple Weather, Whering, Headspace…) | 38 | 30 | 46 | 28 | 34 |
| **Snitt** | **40,8** | **34,0** | **48,5** | **34,2** | **33,0** |

## Per problemområde

| Problemområde | Snitt | Diagnose (kondensert) |
|---|---|---|
| **Vær** | **33,0** | Svakest. AtmosphereBackground (appens mest særpregede komponent) er død kode; værvisningen er 46px stock-Lottie fra CDN i off-brand farger. Skjermen er piksel-identisk ved −8° og +24°. |
| **Avatar** | **34,0** | Statisk PNG-src-swap uten crossfade/koreografi. Eneste liv er en generisk 5,2s float. Appens eneste ekte differensiator er et stillbilde. |
| **Popup** | **34,2** | Settings-liste-DNA (56px thumbs + 3px striper + chevrons). Presenterer et antrekk som en kvittering. Ingen stagger, ingen exit, desktop-sentrert dialog. |
| **Farge** | **48,5** | Best, men «trygg 2026-generisk warm-grey + terracotta». Lag-rampen (eneste ownable fargeidé) er redusert til 3px striper. Null temp-respons. Hardkodede GROUPS-hexer brekker dark mode. |

## Topp 12 tiltak (rangert globalt: impact × antall skills)

Score = gjennomsnittlig impact × antall skills som foreslo lignende tiltak.

### 1. Avatar-påklednings-sekvens: barnet kles på lag for lag (score 45 — 5/6 skills, impact 9)
**Område: avatar.** Splitt avataren i stablede garment-lag (base + innerst + mellom + ytterst + lue som absolutt-posisjonerte PNG/SVG i samme stage). Ved tier-/toggle-bytte animeres hvert lag PÅ innerst→ytterst med 60–120ms stagger (staggerDelay/easeOutSoft finnes ferdig i motion-grammar.ts), avsluttet med squash-settle + glow-puff/terracotta-ring-puls. Idle-liv: blink hvert 4. sekund, hutre-shake ved frost, lue-dusk-sving ved vind. Synk stageShadow i motfase med floaten. Kjernehandlingen (anbefaling endres) blir appens signaturøyeblikk.
- Mobbin: **Tolan** (levende karakter i miljø, idle-loop) https://mobbin.com/screens/87dcfb12-8ba2-4ad5-8173-11d42c0d7e13 · **Finch** (emosjonell reaksjon + mikrofeiring) https://mobbin.com/screens/a8aef0d4-5147-406d-a904-b4715cf698e4 · **Gentler Streak** (2D-karakter i enkel værscene — billigere vei enn 3D) https://mobbin.com/screens/322c5860-1a91-49ee-820b-d16812c4dfac

### 2. Gjenoppliv AtmosphereBackground — været eier canvas og blir avatarens verden (score 42 — 5/6 skills, impact ~8,4)
**Område: vær.** Monter den ferdigbygde AtmosphereBackground (temp-normalisert toneGradient + sun-bloom + snø/regn-partikler + reduced-motion-guard) bak Hjem-innholdet, og koble den til avatar-scenen: snø faller BAK og lander ved avatarens føtter, sol-bloom bak hodet, regn gir våt gulv-refleksjon. Temp-tallet integreres i scenen (DM Serif, større, mock-ens 96px temp-hero gjenreises). Skjermen skal ALDRI se lik ut to dager på rad.
- Mobbin: **Sunlitt** (full-bleed atmosfærisk gradient bærer værstemning) https://mobbin.com/screens/6939e78b-ae10-4d7a-aea0-0493a5290bc2 · **Lumy** (simulert himmel-nå som hero, natt/kveld-modus) https://mobbin.com/screens/14d8bf9f-bc95-47c7-854a-ea2653871cb8 · **(Not Boring) Weather** (hele skjermen er én værscene) https://mobbin.com/screens/6e535b76-89ac-4b43-a6ae-572cd3af381e

### 3. Popup som antrekks-komposisjon, ikke settings-liste (score 33 — 4/6 skills, impact ~8,3)
**Område: popup.** Fjern side-stripes og identiske chevron-rader. Konverter til bottom-sheet (drag-handle, slide-up 400ms iosDrawer) med hero-sone øverst: plaggene komponert som antrekk — vertikal stabel i påkledningsrekkefølge (innerst→ytterst), 72–88px+ thumbs som overlapper, nummer-badges 1-2-3 i lag-fargene, evt. sticky mini-avatar som kles på ved scroll. Kategorilisten demoteres til kompakt detaljnivå under. Rader entrer med stagger.
- Mobbin: **Whering Dress Me** (vertikal slot-stabel i kroppsrekkefølge, swipe per slot) https://mobbin.com/screens/787fda0a-7189-455a-bf5f-e7724e1f9d1b · **Whering Outfit Canvas** (flat-lay-collage «lagt frem på stellebordet») https://mobbin.com/screens/96fec075-07cf-47c6-9015-708aed4070c3 · **Hollister** (look-komposisjon først, produktliste under, pagination mellom looks) https://mobbin.com/screens/f97a6bb4-00b5-4111-b00c-0e7b6028ce73 · **lululemon** (hero-plagg + mindre kompletterende kort) https://mobbin.com/screens/68961af3-adb0-4b44-96d0-0e6c2e5e6ba2 · **Bonobos** (lås-per-plagg + refresh gjør anbefalingen leken) https://mobbin.com/screens/6dc78a8a-1032-4380-b5f6-9d731295d721

### 4. Temperatur-reaktiv canvas i OKLCH (score 30 — 4/6 skills, impact 7,5)
**Område: farge/vær.** Interpolér --bg-canvas + --avatar-glow etter tempC i OKLCH med konstant L (±0,01) så ink-rampen beholder AA: frost oklch(0.89 0.025 235), mildt dagens warm-grey oklch(0.87 0.008 75), sommer oklch(0.90 0.05 75). cityDot/eyebrow følger kald/varm-aksen. 800ms transition så fargen «åndes inn» når været laster. Hele skjermens temperatur FØLES før man leser tallet. Husk OKLCH-gamut-revalidering av kontrast per bånd.
- Mobbin: **Sunlitt** (fargen selv bærer værstemning) https://mobbin.com/screens/6939e78b-ae10-4d7a-aea0-0493a5290bc2 · **(Not Boring) Weather** (mørk kull ved overskyet, varm krem ved lettvær) https://mobbin.com/screens/6e535b76-89ac-4b43-a6ae-572cd3af381e · **Lumy** (himmel-gradient per tid/tilstand) https://mobbin.com/screens/14d8bf9f-bc95-47c7-854a-ea2653871cb8

### 5. Ett brand-tegnet værspråk — dropp CDN-Lottie, én illustrasjonskontrakt (score 30 — 4/6 skills, impact ~7,4)
**Område: vær/helhet.** Erstatt de TRE ukoordinerte værikon-settene (stock-Lottie fra 4 ulike LottieFiles-pakker, fallback-SVG, UkeScreens WeatherIcon) med ETT egen-tegnet 100–120px SVG-sett i brand-paletten (terracotta-sol, warm-grey-skyer, ink-regn, 2.2px stroke, felles lyskilde). Langsom CSS-drift (skyer 18–30s, sol-breathe 8s) gir liv uten CDN-avhengighet — fungerer offline og i reduced-motion. Slett UkeScreens duplikat til fordel for delt komponent.
- Mobbin: **(Not Boring) Weather Toy-tema** (myke lekekloss-former — mest Babyora-relevante estetikken, treffer baby-domenet) https://mobbin.com/screens/b998bfe3-fafc-4142-8891-4a87aecd2d9a · **(Not Boring) Weather** (rekomponerbar scene per værkode — rimeligere enn unike illustrasjoner) https://mobbin.com/screens/4c22a6e7-e681-4aeb-a023-3f9e6c640525 · **zenly** (squishy volumetrisk 3D-ikon, pre-rendret PNG/WebP holder) https://mobbin.com/screens/16acfebe-6571-49b8-98be-53e82f0f679c

### 6. Lag-rampen som brand-signatur på tvers av skjermer (score 27 — 4/6 skills, impact ~6,8)
**Område: farge/helhet.** Promover innerst/mellom/ytterst-rampen (navy→sage→terracotta) fra 3px-striper til appens gjenkjennelige visuelle språk: unifiser til ÉN OKLCH-ramp (erstatter både --layer-* og GROUPS-hexene), bruk som thumbnail-bakgrunn i popupen, som stablede lag-chips/ringer under avataren på Hjem («3 lag mot kulda» leses som farge), som konsentrisk lag-ring-glyf i city-pill og Uke-rader, og som gradient-kant på CTA. 5-sekunders-glimtet viser da ANTALL + HVILKE lag.
- Mobbin: **Clue** (omsorgsapp som eier én uventet dyp primærfarge + organiske former som signatur) https://mobbin.com/screens/4109e86e-82be-4437-8709-fa3f54efcdda · **(Not Boring) Weather Toy** (fargekoding kan være leken uten pastell-klisjé) https://mobbin.com/screens/b998bfe3-fafc-4142-8891-4a87aecd2d9a

### 7. Popup-motion: origin-aware enter, ekte exit, staggered rader (score 16 — 2/6 skills, impact 8)
**Område: popup.** Transform-origin fra CTA-knappens senterpunkt (getBoundingClientRect → CSS-var), enter scale(0.92→1)+translateY(24→0) 400ms iosDrawer-kurve, backdrop-blur 0→3px. Exit 240ms easeOutExpo FØR dialog.close() (i dag: instant forsvinning). Plagg-rader translateY(10px)+opacity med 40ms stagger (maks 480ms), eyebrows 20ms før sine rader. sheetExit og staggerDelay ligger ferdig ubrukt i motion-grammar.ts.
- Mobbin: **Hollister** (bottom-sheet-grammatikk for look-presentasjon) https://mobbin.com/screens/f97a6bb4-00b5-4111-b00c-0e7b6028ce73

### 8. Token-drevne kategori-tints med light/dark-par — slett GROUPS-hardkodingen (score 14 — 2/6 skills, impact 7)
**Område: popup/farge.** Slett GROUPS-hexene (PaakledningScreen.tsx:91-97) og definer per kategori --layer-X / --layer-X-tint / --ink-on-layer-X-tint med dark-overrides (tint oklch(0.30 0.04 hue), ink oklch(0.85 0.06 hue)). Fikser 1,5:1-kontrast-bugen i dark mode OG gir popupen fargevarme. Store luftige plaggkort i stedet for 56px-frimerker.
- Mobbin: **ZARA Kids** (redaksjonelt galleri: store bilder, generøs luft — plagg som produkter man har lyst på) https://mobbin.com/screens/f1b46b23-4f55-44f9-9b71-f71e97b05e5b

### 9. Stemme-copy: barnet som avsender (score 7 — 1/6 skills, impact 7)
**Område: helhet.** Eyebrow «ANBEFALT NÅ» → «Nora trenger»; CTA «Se påkledning» → «Kle på Nora» (verb + navn = handling). Rett skrivefeil «Sovn» → «Søvn» og død ternary `items.length === 1 ? 'plagg' : 'plagg'`.
- Mobbin: **Finch** (copy i karakterens stemme skaper omsorgs-relasjon) https://mobbin.com/screens/a8aef0d4-5147-406d-a904-b4715cf698e4

### 10. --weather-accent: værfarge som propagerer ut av ikonet (score 6 — 1/6 skills, impact 6)
**Område: vær.** Én CSS-var per symbolCode (sol oklch(0.75 0.14 75), regn oklch(0.62 0.09 245), snø oklch(0.85 0.03 230), sky oklch(0.70 0.03 250)) brukt på °-symbolet, city-dot og en 72px radial bloom bak værikonet.
- Mobbin: **zenly** (værfarge som gradientkort rundt ikonet) https://mobbin.com/screens/16acfebe-6571-49b8-98be-53e82f0f679c

### 11. Håndhev motion-grammar som eneste sannhet (score 5 — 1/6 skills, impact 5)
**Område: helhet.** motion-grammar.ts har i dag NULL importører. Erstatt alle inline `ease`/`120ms`/`140ms` med MOTION/TRANSITION-konstanter, fjern duplikat-tokens i design-tokens.css, unifiser press-skala (CTA 0.97, kort 0.985, ikon-knapp 0.92) og fjern døde transform-transitions i UkeScreen.

### 12. Kontrast- og semantikk-opprydding (score 4 — 1/6 skills, impact 4)
**Område: farge.** Eyebrow «ANBEFALT NÅ» #FF6B35 på #DBD8D2 ≈ 2,2:1 → --warm-orange-700 eller mørkere. Flytt --status-ok til grønn hue (i dag hue-kollapset med --status-warm). Egen tint-bg per status. Definer --surface-elevated og --sage-* også i light-blokken.

## Alle svakheter per dimensjon

### Struktur + anti-patterns (impeccable) — 43
- ABSOLUTE BAN: side-stripes to steder i popupen (3px rad-stripe L579-591 + 3x14px eyebrow-stripe L490-498); kombinert med identiske chevron-rader = mest gjettbare settings-liste-struktur.
- Hjem stryker AI-slop-testen: city-pill + bjelle + serif-temp + 46px ikon + segmented control + sentrert hero + uppercase eyebrow + full-bredde oransje CTA = hero-metric-malen, 100 % gjettbart fra kategori.
- Avataren er hard img-src-swap mellom statiske PNG-er; eneste liv er baHjemFloat 5,2s. Ingen garment-layering, ingen værreaksjon.
- Værvisning = tredjeparts stock-Lottie i off-brand farger; AtmosphereBackground droppet; TRE ukoordinerte værikon-språk.
- Nivådisiplin brytes: inline ms/bezier tross forbud i motion-grammar.ts; GROUPS-hexer brekker dark mode; død ternary; «Sovn»-skrivefeil; ubegrunnet glassmorphism-blur i UkeScreen.

### Motion + polish (Emil Kowalski) — 41
- motion-grammar.ts er 100 % dødt system (null imports); skjermene hardkoder generisk `ease` og feil bezier.
- Avataren hard-swapper PNG uten transition; ingen crossfade/blur-maskering/påkledningssekvens; float bruker ease-in-out.
- Popupen bryter tre Emil-regler: ikke origin-aware, INGEN exit-animasjon, ingen stagger (tross ferdige staggerDelay/ENTRY_RISE).
- AtmosphereBackground ferdigbygget og reduced-motion-sikret — ikke montert; vær redusert til 46px CDN-Lottie.
- Tre konkurrerende press-feedback-sannheter (0.997 vs 0.98 vs 0.96 vs 0.92); døde transform-transitions i UkeScreen.

### Farge (OKLCH / token-graf) — 41
- Temperatur bærer NULL farge på Hjem; appen ser identisk ut ved −15° og +25°; ubrukt toneGradient() er i HSL (luminans-drift).
- Tre parallelle hardkodede paletter (GROUPS, UkeScreen TOKENS) divergerer fra tokens og flipper aldri i dark mode (~1,5:1 kontrast).
- Fargestrategien «restrained til det generiske»; lag-rampen (eneste domenespesifikke idé) redusert til 3px-striper.
- Status-tokens hue-kollapset (--status-warm hue ~35 vs --status-ok hue ~40 uskillelige); felles --surface-soft for alle statuser.
- Kontrasthull: eyebrow ≈2,2:1; hardkodet lys-modus city-glow; --surface-elevated/--sage-* kun i dark-blokk; værikonfarger utenfor token-grafen.

### Patterns + pixel-spec — 41
- AtmosphereBackground (298 linjer) er DØD KODE; canvas flat #DBD8D2 uansett vær.
- Avatar statisk PNG-swap; stageShadow statisk mens avataren flyter; MOTION.scaleAvatar definert, aldri brukt.
- Popup er desktop-sentrert dialog, ikke bottom-sheet; drag-to-dismiss droppet; rader = inventar, ikke antrekk; død ternary.
- «3D-vær» = 46px stock-Lottie fra CDN; mockens 96px temp-hero krympet til frimerke; nettverksavhengig.
- Palett = 2026-standard «AI-app warm neutral»; lag-rampen aldri på 5-sekunders-glimtet.

### Distinctness + production-grade — 41
- Fem uharmoniserte renderingsspråk (4 ulike Lottie-forfattere, fallback-SVG, UkeScreen-ikoner, render-PNG-avatar, flate plagg-PNGer) — byrå-testen stryker her først.
- Avatar uten liv, ikke engang tappbar.
- Palett generisk og bokstavelig talt delt med Klemeg; det mest særpregede (AtmosphereBackground) droppet.
- Popup = settings-liste-estetikk; GROUPS utenfor token-systemet; stagger ubrukt.
- CDN-avhengighet er produksjonsrisiko i PWA: offline gir permanent fallback etter 2,5s.

### Industri-benchmark — 38
- Null Headspace/Duolingo-nivå karakterliv i appens eneste potensielle signatur-asset.
- Fire stock-Lottie-filer samme som tusenvis av tutorial-apper, i fremmed fargeverden.
- Eneste særpregede komponent bygget ferdig og droppet; Apple Weather/Carrot lar scenen fortelle været.
- Popupen presenterer antrekket som kvittering; Whering/Drest viser outfit på kropp.
- Paletten 2024-26-default og 100 % statisk; ingen token endres av tempBand/symbolCode.

## Mobbin-funn (komplett liste)

### Tema 1: Differensierende værvisualisering
| App | Pattern | URL |
|---|---|---|
| (Not Boring) Weather | Hele skjermen én volumetrisk 3D-scene; været ER heroen, gyro-parallakse | https://mobbin.com/screens/6e535b76-89ac-4b43-a6ae-572cd3af381e |
| (Not Boring) Weather | Betingelses-drevet scenekomposisjon i lys modus; elementer rekomponeres per værtype | https://mobbin.com/screens/4c22a6e7-e681-4aeb-a023-3f9e6c640525 |
| (Not Boring) Weather | «Toy»-tema: værdata som lekekloss-former i pastell/primærfarger — mest Babyora-relevante estetikken | https://mobbin.com/screens/b998bfe3-fafc-4142-8891-4a87aecd2d9a |
| zenly | Glossy volumetrisk «squishy» 3D-værikon på mettet gradientkort | https://mobbin.com/screens/16acfebe-6571-49b8-98be-53e82f0f679c |
| Sunlitt | Full-bleed atmosfærisk gradient som bærer værstemning; data i chips nederst | https://mobbin.com/screens/6939e78b-ae10-4d7a-aea0-0493a5290bc2 |
| Lumy | Fotorealistisk himmel-gradient som hero; månebane; glass-kort — natt/kveld-referanse | https://mobbin.com/screens/14d8bf9f-bc95-47c7-854a-ea2653871cb8 |

### Tema 2: Visuell identitet uten rosa-pastell-klisjé
| App | Pattern | URL |
|---|---|---|
| (Not Boring) Weather | Været som skulptur: monumentale 3D-tall, skjermstemning skifter med været | https://mobbin.com/screens/6e535b76-89ac-4b43-a6ae-572cd3af381e |
| Tolan | 3D-clay-karakter i full høyde med idle-animasjon, i miljø med skumrings-gradient | https://mobbin.com/screens/87dcfb12-8ba2-4ad5-8173-11d42c0d7e13 |
| Finch | Omsorgs-relasjon som kjerneloop; mikro-feiringer; copy i babyens stemme; blålilla, ikke rosa | https://mobbin.com/screens/a8aef0d4-5147-406d-a904-b4715cf698e4 |
| Gentler Streak | Flat vektorkarakter i minimalistisk landskapsscene; rolig base + få mettede aksenter | https://mobbin.com/screens/322c5860-1a91-49ee-820b-d16812c4dfac |
| ZARA | Kids-plagg som redaksjonelt galleri: store flat-lay-fotos, generøs luft | https://mobbin.com/screens/f1b46b23-4f55-44f9-9b71-f71e97b05e5b |
| Clue | Nekter rosa: dyp indigo + organiske blob-former + én varm aksent — gjenkjennelig på 5 meter | https://mobbin.com/screens/4109e86e-82be-4437-8709-fa3f54efcdda |

### Tema 3: Outfit-presentasjon som komponert antrekk
| App | Pattern | URL |
|---|---|---|
| Whering (Dress Me) | Vertikal «slot machine» i kroppsrekkefølge, swipe per slot, pin for å låse | https://mobbin.com/screens/787fda0a-7189-455a-bf5f-e7724e1f9d1b |
| Whering (Outfit Canvas) | Antrekk som organisk flat-lay-collage — magasinoppslag, ikke grid | https://mobbin.com/screens/96fec075-07cf-47c6-9015-708aed4070c3 |
| Whering (Planner) | Vær + antrekk som ETT samlet dagskort — konteksten og svaret leses som enhet | https://mobbin.com/screens/d7fed624-ca7e-4e42-af16-ec723ee0a146 |
| Hollister Co. | «Look 2 of 3» bottom-sheet: komposisjon først, produktliste under, pagination mellom looks | https://mobbin.com/screens/f97a6bb4-00b5-4111-b00c-0e7b6028ce73 |
| lululemon | Asymmetrisk 2-kolonne: hero-kort for hovedplagg + mindre kompletterende kort | https://mobbin.com/screens/68961af3-adb0-4b44-96d0-0e6c2e5e6ba2 |
| Bonobos (Outfitter) | Lås-toggle per plagg + «REFRESH OUTFIT» + kontekst-label — anbefaling som lek | https://mobbin.com/screens/6dc78a8a-1032-4380-b5f6-9d731295d721 |
