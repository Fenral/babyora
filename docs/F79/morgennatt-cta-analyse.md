# F79 — Morgennatt: CTA-fargeanalyse + plaggfarge-avledning

Palett 1 «Vinternatt» → omdøpt **«Morgennatt»** (valgt av Sivert 2026-07-02). Alle kontrast-ratioer under er **faktisk beregnet** med WCAG 2.x relative luminance på endelige sRGB-hex (node-script, ikke OKLCH-kilden — jf. gamut-clipping-regelen). Krav: CTA-label/CTA-fill ≥ 4.5:1, CTA-fill/canvas ≥ 3.0:1, non-text ≥ 3.0:1.

Canvas-tilstander brukt i matten:

| Modus | Kald | Mild | Varm |
|---|---|---|---|
| Lys | `#CCDCF7` | `#DAD8EE` | `#EED1E0` |
| Mørk | `#131A2D` | `#1A1828` | `#251724` |

---

## CTA-kandidat-tabell

Fill/canvas oppgis som kald / mild / varm.

| Kandidat | Hex lys (fill · ink) | Hex mørk (fill · ink) | Label/fill lys | Label/fill mørk | Fill/canvas lys | Fill/canvas mørk | Kollisjonsvurdering |
|---|---|---|---|---|---|---|---|
| **A — Dagens korall** | `#B6322B` · `#FCF3ED` | `#F47C6B` · `#231933` | 5.51 ✓ | 6.31 ✓ | 4.35 / 4.32 / 4.26 ✓ | 6.55 / 6.59 / 6.47 ✓ | **ALVORLIG i mørk:** `#F47C6B` er OKLCH(0.72 0.150 29.6°) — bare **7.8° hue-avstand** fra plagg-korall `#D96B4A` (0.652 0.146 37.4°), med nesten identisk L og C. På mørk canvas er CTA og ullbody i praksis samme farge. Lys-CTA `#B6322B` (0.52, hue 27.8°) er mørkere/dypere, men fortsatt samme familie. I tillegg: layer-ytterst mørk `#F89177` (35°) og status-warm `#FF987E` (35°) bor i samme bånd — fire «varme punkter» konkurrerer. |
| **A2 — Rubinkorall (justert)** | `#B6322B` · `#FCF3ED` (uendret) | `#EF7179` · `#231933` (hue 29.6°→18.1°) | 5.51 ✓ | 5.81 ✓ | 4.35 / 4.32 / 4.26 ✓ | 6.02 / 6.06 / 5.96 ✓ | Øker avstanden til plagg-korall fra 7.8° til **19.3°** — bedre, men rubin og korall er fortsatt samme varme familie for søvnige øyne kl. 06. Løser symptomet, ikke strukturen: det varme båndet forblir overbefolket når avataren bærer korall body + marigold genser rett over CTA-en. |
| **B — Marigold/rav** | `#8A5601` · `#FCF3ED` | `#D49838` · `#231933` | 5.62 ✓ | 6.63 ✓ | 4.44 / 4.41 / 4.35 ✓ | 6.88 / 6.93 / 6.81 ✓ | **FORKASTES.** (1) Mørk-fill `#D49838` er 1.4° fra genser-marigold `#D9962B` (73.6°) — direkte kollisjon med lag-2-plagget. (2) Rå `#D9962B` som lys-CTA feiler hardt (1.78–1.81 mot alle lyse canvas); den WCAG-tvungne lys-varianten `#8A5601` er nøyaktig den «mudrete brun-raven» dommerne slaktet i Brevann. Marigold arver begge kjente feil. |
| **C — Gran/mynte (nytt forslag)** | `#267147` · `#F2FBF5` | `#65D097` · `#0F2B1D` | 5.63 ✓ | 7.97 ✓ | 4.28 / 4.25 / 4.20 ✓ | 9.08 / 9.15 / 8.99 ✓ | **INGEN kollisjon.** Hue 155–158° ligger ≥59° fra nærmeste plagg (petrol 214°) og ≥70° fra alle varme plagg (korall 37°, marigold 74°), utenfor hele canvas-rotasjonen (262–345°) og utenfor det overbefolkede fiolett-båndet (292–300°). Settets beste marginer: mørk fill/canvas ~9:1. Mint-hvit ink lys (`#F2FBF5`) og gran-ink mørk (`#0F2B1D`) holder begge med god margin. |

Verifikasjonsnotat: status-warm mørk `#FF987E` og temp-aksent varm `#F8907C` forblir i korall-båndet — akseptabelt for små indikatorer, men de skal aldri brukes på knapper.

## Anbefalt CTA + begrunnelse

**Anbefaling: Kandidat C — «Granmynte». Lys `#267147` (oklch 0.49 0.10 155), mørk `#65D097` (oklch 0.78 0.13 158).**

1. **Premisset bak korall-CTA-en er dødt når plaggene rendres.** Dommernes ros («korall er det eneste varme punktet og finnes på under ett sekund») gjaldt en plagg-fri hero-mock. I den faktiske appen bærer avataren korall ullbody + marigold genser *rett over* CTA-en — skjermen får en klynge av varme punkter, og mørk-CTA `#F47C6B` er målt 7.8° fra plagg-korallen. Da svekkes begge signaler, nøyaktig som fryktet: lag-kodingen mister eierskap til korall, og CTA-en mister finnes-på-under-ett-sekund-egenskapen.
2. **Grønn gjenoppretter glimt-egenskapen strukturelt, ikke kosmetisk.** Som eneste grønne objekt på skjermen (alle plagg, alle lag-tokens, canvas-rotasjonen og fiolett-båndet ligger ≥59° unna) blir CTA-en igjen umulig å bomme på — og den avlaster samtidig det overbefolkede varme båndet og fiolett-båndet i én operasjon.
3. **Beste kontrast-matte i settet** (mørk ~9:1 mot alle tre temp-canvas, label 7.97; lys 4.20–4.28 / 5.63 — alt passerer med margin), og semantikken er riktig for handlingen: grønn = «klar, kle på». Gran/mynte sitter dessuten naturlig i ull/barskog-universet.

Fallback hvis varm CTA er ufravikelig for brand-følelsen: **A2 Rubinkorall** (behold lys `#B6322B`, mørk → `#EF7179`) — passerer alt, men aksepter da at CTA og lag-1 deler varm familie. Jf. mock-før-lås-regelen: mock begge på faktisk mørk-canvas med plagg-avatar før endelig lås.

## Plaggfarge-vurdering per plagg

Plaggene ble avledet av **Brevann**-verdenen (turkis) — Morgennatt-valget krever re-vurdering. Målt som flat silhuett-kontrast mot alle seks canvas-tilstander (clay-assets har innvendig skygge/AO som hjelper, så <3:1 er et varsel, ikke automatisk stryk):

| Plagg | Hex | Verst lys | Verst mørk | Vs. CTA-anbefaling (grønn 155°) | Konklusjon |
|---|---|---|---|---|---|
| Ullbody korall | `#D96B4A` | 2.41 (varm) | 5.02 ✓ | 118° unna — ingen kollisjon | **BEHOLD.** Glimrende i mørk (palettens hjem). Lys-modus 2.41–2.46 er under 3:1 som flatfarge, men clay-skyggen bærer silhuetten; med grønn CTA er korall dessuten entydig = lag 1. |
| Bukse petrol-grå | `#5A7480` | 3.49 ✓ | 3.46 ✓ | 60–73° unna, mye lavere C — ingen kollisjon | **BEHOLD.** Eneste plagg som passerer ≥3:1 mot alle seks tilstander. |
| Genser marigold | `#D9962B` | 1.78 (varm) | 6.81 ✓ | 81° unna — ingen kollisjon | **BEHOLD (med merknad).** Svakest i lys modus (1.78–1.81), men strålende «lykt» i mørk. Re-gen til mørkere oker ville koste lykt-kvaliteten og gi Brevanns gjørme-problem. Verifiser i lys-modus-mock; re-gen kun hvis den reelt drukner der. |
| Jakke dyp petrol | `#1E4750` | 7.16 ✓ | **1.69–1.72 ✗** | — | **RE-GEN → `#35707F`** (oklch 0.51 0.065 217). Dagens jakke drukner totalt på mørk indigo-canvas — og dette er kjernescenarioet (kald, mørk morgen = jakken er det ytterste, mest synlige laget i palettens hjem-modus). `#35707F` er målt 3.93 verst-lys / 3.08 verst-mørk — passerer begge. Beholder petrol-identiteten (avledet av samme hue). Merknad: nær bukse i luminans (1.12:1), skilles på chroma (0.065 teal vs 0.036 grå) + silhuett — ikke forvekslingskritisk. 💰 Utgift: ~1,4 NOK (1 plagg). |

**Netto: 1 av 4 plagg re-genereres.** Total kostnad ~1,4 NOK.

## Endelige Morgennatt-tokens for mock-retheming

Endringer vs. Vinternatt-mocken: (1) `--accent-cta`/`--accent-cta-ink` → Granmynte, (2) lag-tokens omkodet til plagg-alignerte huer (innerst=korall 40°, mellom=oker 80°, ytterst=petrol 215°) — dette fjerner fiolett layer-mellom (300°) og løser «fiolett-båndet er overbefolket»-innvendingen, samtidig som chip-swatch og faktisk plagg nå deler hue. Alle nye lag-tokens er målt 4.43–7.31 mot sine surfaces (krav 3:1 non-text). Alt annet (canvas, ink, status, focus, temp-akse) beholdes uendret fra den godkjente mocken.

```css
/* ============ TOKENS — Morgennatt (F79, låst kandidat) ============ */
:root, [data-theme="light"] {
  --bg-canvas:      oklch(0.89 0.030 290);  /* #DAD8EE */
  --surface:        oklch(0.965 0.012 290); /* #F3F2FB */
  --ink-primary:    oklch(0.24 0.045 295);  /* #211B32 */
  --ink-secondary:  oklch(0.45 0.050 292);  /* #56506F */
  --accent-cta:     oklch(0.49 0.100 155);  /* #267147  gran — 5.63/4.20+ */
  --accent-cta-ink: oklch(0.98 0.012 157);  /* #F2FBF5 */
  --layer-innerst:  oklch(0.55 0.130 40);   /* #AF5331  korall (= ullbody-hue) — 4.61 vs surface */
  --layer-mellom:   oklch(0.55 0.110 80);   /* #93690D  oker (= marigold-hue) — 4.43 vs surface */
  --layer-ytterst:  oklch(0.45 0.060 214);  /* #285E6A  petrol (= jakke-hue) — 6.52 vs surface */
  --status-cold:    oklch(0.46 0.100 250);  /* #265B8D */
  --status-warm:    oklch(0.53 0.150 35);   /* #B14328 */
  --focus-ring:     oklch(0.50 0.140 292);  /* #6750AB */
  --avatar-glow:    #EFECFC;
  --temp-aksent:    #6654A1;
  --bezel: #14111f;
  --shadow-frame: 0 40px 90px -30px rgba(23, 16, 46, 0.45), 0 12px 30px -14px rgba(23, 16, 46, 0.35);
  color-scheme: light;
}
[data-theme="dark"] {
  --bg-canvas:      oklch(0.22 0.030 290);  /* #1A1828 */
  --surface:        oklch(0.28 0.035 290);  /* #282639 */
  --ink-primary:    oklch(0.94 0.015 290);  /* #EBEAF5 */
  --ink-secondary:  oklch(0.77 0.028 290);  /* #B3B2C5 */
  --accent-cta:     oklch(0.78 0.130 158);  /* #65D097  mynte — 7.97/8.99+ */
  --accent-cta-ink: oklch(0.26 0.043 159);  /* #0F2B1D */
  --layer-innerst:  oklch(0.75 0.119 40);   /* #EE9373 — 6.35 vs surface */
  --layer-mellom:   oklch(0.78 0.120 85);   /* #DBB155 — 7.31 vs surface */
  --layer-ytterst:  oklch(0.72 0.070 215);  /* #6FB0C0 — 6.06 vs surface */
  --status-cold:    oklch(0.74 0.090 245);  /* #79B1E0 */
  --status-warm:    oklch(0.78 0.130 35);   /* #FF987E — kun små indikatorer, aldri knapper */
  --focus-ring:     oklch(0.70 0.120 295);  /* #A48FE1 */
  --avatar-glow:    #4D4869;
  --temp-aksent:    #A89AD7;
  --bezel: #060510;
  --shadow-frame: 0 44px 100px -30px rgba(0, 0, 0, 0.75), 0 14px 34px -14px rgba(0, 0, 0, 0.6);
  color-scheme: dark;
}
/* Temp-akse: hue-rotasjon av canvas (isblå 262° ← indigo 290° → lyng/rosé 345°) — uendret */
[data-theme="light"][data-temp="kald"], :root[data-temp="kald"]:not([data-theme="dark"]) {
  --bg-canvas: oklch(0.89 0.042 262); /* #CCDCF7 */
  --avatar-glow: #E1ECFC;
  --temp-aksent: #2B5C97;
}
[data-theme="dark"][data-temp="kald"] {
  --bg-canvas: oklch(0.22 0.040 268); /* #131A2D */
  --avatar-glow: #384D73;
  --temp-aksent: #79B0E8;
}
[data-theme="light"][data-temp="varm"], :root[data-temp="varm"]:not([data-theme="dark"]) {
  --bg-canvas: oklch(0.89 0.038 345); /* #EED1E0 */
  --avatar-glow: #FDE5E1;
  --temp-aksent: #B54436;
}
[data-theme="dark"][data-temp="varm"] {
  --bg-canvas: oklch(0.23 0.032 330); /* #251724 */
  --avatar-glow: #6E4358;
  --temp-aksent: #F8907C;
}
```

CTA-kontrast for de låste tokens (målt, alle temp-states):

| Par | Kald | Mild | Varm | Krav |
|---|---|---|---|---|
| cta-ink / accent-cta (lys) | 5.63 | 5.63 | 5.63 | 4.5 ✓ |
| cta-ink / accent-cta (mørk) | 7.97 | 7.97 | 7.97 | 4.5 ✓ |
| accent-cta / bg-canvas (lys) | 4.28 | 4.25 | 4.20 | 3.0 ✓ |
| accent-cta / bg-canvas (mørk) | 9.08 | 9.15 | 8.99 | 3.0 ✓ |

Neste steg (mock-før-lås): retheme mocken med blokken over + plagg-avatar synlig, vis lys/mørk × kald/mild/varm side om side med A2-rubin-varianten, og la Sivert velge visuelt før endelig lås og jakke-re-gen.
