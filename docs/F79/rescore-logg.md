# F79 — Rescore-logg

## Score-utvikling per mock (tabell iter × mock)

| Mock | Iter 1 | Iter 2 | Iter 3 | Iter 4 |
|---|---|---|---|---|
| f79-hjem-a | 66 ✅ | 73 ✅ | 80.2 ✅ | 83.1 ❌ |
| f79-hjem-b | 69.7 ❌ | 61.6 ❌ | 76 ❌ | 74.4 ✅ |
| f79-paakledning-a | 59.4 ❌ | 67.2 ✅ | 70.8 ✅ | 73.6 ❌ |
| f79-paakledning-b | 62.2 ❌ | 76 ❌ | 75.3 ✅ | 76.2 ❌ |
| f79-paakledning-c | 58.5 ❌ | 57.5 ❌ | 66.2 ❌ | 71.8 ✅ |

✅ = pass, ❌ = fail (terskel per iterasjonens kriterier)

## Sluttresultat + vinner per kategori

| Mock | Navn | Score | Pass |
|---|---|---|---|
| f79-hjem-a | Hjem A (Brevann ren) | 83.1 | ❌ |
| **f79-hjem-b** | **Hjem B (overshoot)** | **74.4** | **✅** |
| f79-paakledning-a | Påkledning A (antrekks-komposisjon) | 73.6 | ❌ |
| f79-paakledning-b | Påkledning B (editorial lag-fortelling) | 76.2 | ❌ |
| **f79-paakledning-c** | **Påkledning C (inline uten popup)** | **71.8** | **✅** |

**Vinner Hjem-kategori:** f79-hjem-b — Hjem B (overshoot), score 74.4, pass, ingen brudd.

**Vinner Påkledning-kategori:** f79-paakledning-c — Påkledning C (inline uten popup), score 71.8, pass, ingen brudd.

Merk: f79-hjem-a har høyest rå score (83.1) av alle fem, men er diskvalifisert (fail) på to preclearance-brudd (a11y): manglende pause-kontroll for evig idle-animasjon og en 36px touch-target under 44px-kravet.

## Gjenstående svakheter (fra siste runde-tiltak som IKKE ble tatt)

### f79-hjem-a
- [distinctness] Fjern det duplikate 32px temp-tallet i `.weather-hero` (behold kun sr-only/meta-tekst for aria-live) slik at 196px temp-masten står som skjermens ENE anker — to tall som sier "12°" svekker masten som signatur.
- [distinctness] La temp-masten blø mot canvas-kanten: øk font-size til ~230px og gi negativ margin-left slik at første siffer klippes av telefonrammen (overflow:hidden finnes allerede på `.phone`) — sentrert-og-trygt er det eneste ved masten som fortsatt er forsiktig.
- [distinctness] Drench bunn-navigasjonen: bytt den nesten-hvite surface-blur bakgrunnen i `.app-nav` til `color-mix(in srgb, var(--bg-canvas) 70%, var(--surface))` og gi aktivt element konsekvent 24/24/24/8-signaturformen — navbaren er nå den mest generiske AI-flaten på skjermen.
- [benchmark] Fjern duplikat-tallet: den kompakte 32px `.temp` i `.weather-hero` gjentar mastens "12°" — la 196px temp-masten være ENESTE tall (behold `#temp-display` kun som sr-only for aria-live), og la meta-linjen (Klarvær · føles som 10°) stå alene. Ett anker = Apple Weather-hierarki.
- [benchmark] Skaler `.sun-wrap` fra 92px til ~124px og flytt den slik at halo-gradienten overlapper mastens øvre høyre hjørne — nå er solen for liten til å lese som fysisk lyskilde ved siden av 196px-tallet (Not Boring Weather-testen: lyset må ha en kilde med vekt).

### f79-hjem-b
- [distinctness] Skaler temp-tallet forbi Hjem A: sett `.temp-big` til `clamp(180px, 50vw, 210px)` og la grad-tegnet klippes bak/under solen ved høyre kant — en overshoot-mock som har MINDRE tall enn den "rene" varianten oppfyller ikke rollen sin.
- [distinctness] La avataren fysisk overlappe temp-tallet (negativ margin-top på `.avatar-zone`, z-sandwich tall→avatar→chips som Hjem A sin mast) — nå er komposisjonen en konvensjonell topp-til-bunn-stabel tross de store enkeltelementene.
- [distinctness] Bryt pill-perfeksjonen i `.layers-list`: gi hver `.layer-row` egen liten rotasjon (-2/1.5/-1/2.5deg) og asymmetrisk radius (à la Påkledning A sine thumbs), og koble "→ 4 lag"-tallet til raden med en 3px marigold-strek — chipsene er i dag fire identiske generiske piller.
- [benchmark] Gi barnet scenen tilbake: øk `.stack` fra 208px til ~248px og la avatar-zone overlappe temp-tallets nedre del (avatar z-index over, margin-top ~-34px) — i en påkledningsapp må barnet vinne mot tallet og solen, nå er helten minst av tre konkurrerende elementer.
- [benchmark] Trekk solen inn: `right:-60px` klipper nesten halve clay-solen og leser som uhell — sett `right:-24px` (≥75% synlig) og øk sun-halo-spredningen inn på canvas (`inset -32px`) så den beholder overshoot-energien men leser intendert.

### f79-paakledning-a
- [distinctness] Forleng konnektorene fra 13px-ticks til ~35-40% av vektoren avatar→thumb, tegnet som 2.5px stiplet strek (`stroke-dasharray 4 5`) med samme circle-endepunkt — 13px leser som støy på 390px, ikke som eksplosjonstegning; `TICK_LEN`-konstanten og `wireConnectors()` finnes allerede, kun lengde + dasharray endres.
- [distinctness] Erstatt 44px `.temp-glimpse` i tittelraden med et 120-140px Fraunces watermark-tall ("4" eller "12°") bak avatar-hero (aria-hidden, `color-mix` 30% mot ink, soft-light) — sheet-headeren er i dag familiens svakeste temp-anker og komposisjonen mangler bakgrunnsdybde.
- [distinctness] Løft hierarkiet i komposisjonen: skaler `.avatar-hero` til ~240px og gi den 2deg rotasjon, og reduser største thumb (`--thumb-size` lag-4) fra 112px til 100px — nå er største thumb over halvparten av heltens størrelse og eksplosjonstegningen mangler tydelig sentrum.
- [benchmark] Forleng konnektor-ticksene: `TICK_LEN` 13px → 28px og gjør dem stiplede (`stroke-dasharray 4 3` på faktisk lengde, ikke pathLength 1) — 13px-segmenter med 3px-dot leser som støvkorn, ikke eksplosjonstegning; hele komposisjonens idé står og faller på at strukturen synes.
- [benchmark] Fjern `.temp-glimpse-wrap` (44px tall + 34px vær-ikon) fra tittelraden — den dupliserer home-hinten bak scrimmen. Løft i stedet "4 lag"-svaret fra 11.5px eyebrow til Fraunces 28px over tittelen, så sheeten har ett fokus: komposisjonen + kvantum.

### f79-paakledning-b
- [distinctness] Øk fargedrenchen i `.layer-section` fra 11% til 18-20% lag-mix og løft `.layer-watermark` fra 30% til ~45% mix (behold soft-light) — re-verifiser lag-*-ink-kontrastene mot ny drench i spec-tabellen; i dag er oppslagene så bleke at editorial-signaturen nesten forsvinner i 5-sekunders glimtet.
- [distinctness] Gjør chips-collagen over folden synlig: bytt ±1-3px translate på `.summary-chip:nth-child` til ekte rotasjoner (-3/2/-1.5/3deg) og øk negativ margin til -60px slik at chipsene tydelig overlapper avataren — nå er "scattered"-intensjonen umerkelig.
- [distinctness] Gi `.cta` Babyora-signaturformen fra Hjem A: `border-radius 24px 24px 24px 8px` + 3px marigold topplinje (`::before` med `color-mix(in srgb, var(--lag-3) 55%, white)`) — dagens 20px-radius knapp er generisk og bryter formfamilien på tvers av skjermene.
- [benchmark] Løft lag-drenchen i `.layer-section` fra 11% til 20% lag-mix mot bg-canvas — på lys modus leser oppslagene nå som blek tint, ikke "fargedrenket editorial"; lag-*-ink-tokenene er allerede dokumentert mot 22%-drench i spec-historikken, så kontrasten holder med #6B490D-mønsteret.
- [benchmark] Gjør glimt-svaret til anker: "4 lag for klarvær" (21px header-summary) er svaret søvnige foreldre trenger kl. 06 — løft `.header-count` til Fraunces 34-38px på egen linje under eyebrow, samme visuelle nivå som header-temp, så temp og kvantum leses i ett blikk.

### f79-paakledning-c
- [distinctness] Sett "12° → 4 lag" i mast-skala: øk `.hero-figure .temp/.count` fra 76px til ~110-120px, la pilen tegne seg inn som animert stroke ved load (`stroke-dasharray`/`dashoffset` transition i `.load-in-ready`) — 76px er midt-i-mellom og eier ikke skjermen slik statement-ideen krever.
- [distinctness] Bytt begge CTA-ene fra generisk 999px-pill til familiens signaturform: `.confirm-cta` får `border-radius 24px 24px 24px 8px` + 3px marigold topplinje (`::before`), `.cta-toggle` samme radius med outline-stil — pill-knappene er mockens tydeligste generisk-AI-signal.
- [distinctness] Flytt FLIP-fly-in til førsteinntrykket: kjør en kort auto-sekvens ved load (ekspander `#reveal`, spill `runDressSequence`, kollaps etter ~2.5s, gated på `prefers-reduced-motion`) — mockens eneste magiske signaturmoment er i dag gjemt bak "Vis påkledning"-toggelen og sees aldri i 5-sekunders glimtet.
- [benchmark] Gi rest-state atmosfæren fra Hjem-mockene: kopier `.atmos-lag`-mønsteret (tre stablede radial-gradient-lag + feTurbulence-grain) fra Hjem A inn i `#phone` — nå er canvas en flat pastellflate uten dybde, den eneste av de fem uten grain/atmos, og det er dette som gjør den generisk i benchmark-selskap.
- [benchmark] Differensier statement-tallene: begge på 76px konkurrerer — sett `.temp` til 56px i accent-temp og `.count` ("4 lag") til 88px ink-primary, så SVARET er størst og premisset sekundært (Things 3-prinsippet: én ting eier skjermen).

## Anbefaling til beslutningspakken

Vinner Hjem: **f79-hjem-b** (74.4, pass). Vinner Påkledning: **f79-paakledning-c** (71.8, pass).

Hjem A har høyest score totalt (83.1) men diskvalifiseres av to reelle a11y-brudd (manglende pause for evig idle-animasjon, touch-target under 44px), begge raske å fikse — verdt en femte iterasjon før endelig lås om Hjem A skal vurderes fremfor Hjem B. Påkledning-feltet er jevnt (71.8–76.2), men A og B faller på ekte tekst-mot-tekst-motsigelser mellom temp/lag-verdier ved state-bytte, mens C vinner på ren koherens; anbefaler å gå videre med Hjem B + Påkledning C som beslutningspakkens kandidater, med mulighet til å re-teste Hjem A etter a11y-fiksene.
