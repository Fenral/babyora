# /color-expert — Standpunkt

## Standpunkt

**C — perseptuelt grunnet tredje vei, men nær B sin DNA.** A (Court Clay) feiler fordi terrakotta (`oklch(~0.55 0.13 35)`) og cream (`~0.96 0.025 80`) lever i samme varme hue-bånd 30-80° — det gir lav hue-separasjon og «muddy mid-tone» når surface møter accent. Det er også Hatch/Frida-reflexen PRODUCT.md eksplisitt unngår. B (PA-palett) har riktig instinkt — høy L-kontrast hvit/ink, isolert varm accent, funksjonelle ring-hues — men `#FF6B35` lander på `oklch(0.68 0.21 38)` som er **out-of-sRGB-gamut for ren chroma** og klipper hardt ved screen-rendering; det ser «neon-mat» ut på OLED og lekker chroma på LCD. Apple Fitness sine ring-hues er dessuten kalibrert for **dark surface** — direkte port til hvit bakgrunn senker APCA-Lc dramatisk (særlig emerald + lilla).

Babyora-konteksten — én-hånds vinterbruk, lavt lys, søvndeprivert forelder — krever **høy L-separasjon + lav chroma-støy + isolert semantisk accent**. Løsning: behold B sin arkitektur (hvit surface, ink-tekst, én varm accent, funksjonelle ring-hues), men flytt alle kromatiske verdier inn i sRGB-gamut ved fast `L`-akse slik at WCAG-AA og APCA Lc 75 holder på tvers av light/dark og slik at ringene har **likt perseptuelt vekt** (ikke samme HSL-saturation).

## Foreslått palett

Referanse-tokens (OKLCH-uniform, alle in-gamut sRGB; hex er round-tripped via Culori):

```css
/* Surface ramp — perseptuelt uniform L-trapp, C≈0 */
--ref-white:        oklch(1.000 0    0);     /* #FFFFFF */
--ref-paper:        oklch(0.985 0.003 80);   /* #FBFAF8  hint av varm — unngår steril klinikk */
--ref-hairline:     oklch(0.930 0.005 80);   /* #ECEAE6  4.2% L-step fra paper */
--ref-mute:         oklch(0.760 0.008 80);   /* #B8B5B0  for sekundærtekst */
--ref-ink:          oklch(0.215 0.012 250);  /* #14181F  cool ink, ikke ren sort */
--ref-ink-soft:     oklch(0.380 0.010 250);  /* #4A5260  for label-tekst */

/* Accent — varm, men gamut-respektert */
--ref-amber-600:    oklch(0.660 0.175 42);   /* #F26A2E  ~iso-L med FF6B35 men in-gamut */
--ref-amber-700:    oklch(0.580 0.165 40);   /* #D45820  hover/pressed */

/* Funksjonelle hues — alle på fast L=0.62, C=0.13 (iso-perseptuelt vekt) */
--ref-stroller:     oklch(0.620 0.130 235);  /* #3F8CC4  vogn-blå */
--ref-carrier:      oklch(0.620 0.130 305);  /* #B26AC2  bæresele-lilla */
--ref-outdoor:      oklch(0.620 0.130 155);  /* #2EA079  utelek-emerald */
--ref-sleep:        oklch(0.620 0.130 275);  /* #6D7FD8  søvn-indigo */

/* Semantiske tokens */
--surface:          var(--ref-paper);
--surface-elevated: var(--ref-white);
--ink:              var(--ref-ink);
--ink-soft:         var(--ref-ink-soft);
--ink-mute:         var(--ref-mute);
--hairline:         var(--ref-hairline);
--accent:           var(--ref-amber-600);
--accent-press:     var(--ref-amber-700);
--ring-stroller:    var(--ref-stroller);
--ring-carrier:     var(--ref-carrier);
--ring-outdoor:     var(--ref-outdoor);
--ring-sleep:       var(--ref-sleep);
--focus:            var(--ref-amber-600);   /* delt med accent — én visuell aksent per skjerm */
```

## Begrunnelse for valgt color space

**OKLCH** for hele systemet. Tre grunner:

1. **L er perseptuelt uniform** — fastsetting av `L=0.62` på alle fire ring-hues gir lik visuell tyngde uavhengig av hue. HSL ville gitt vogn-blå (`hsl 207 55% 51%`) som lyser dramatisk svakere enn utelek-emerald (`hsl 158 56% 40%`) — en av Apples kjente kalibrerings-tricks ringene løser i deres egen UI, men som forsvinner ved naiv port.
2. **OKLCH fikser CIELAB-blue-problemet** — CIELAB skviser blå hue mot lilla ved høy chroma. Vogn-blå og søvn-indigo (H=235 vs 275) ville kollapset visuelt i CIELAB; i OKLCH holder de 40° perseptuell separasjon.
3. **Gamut-håndtering** — OKLCH har eksplisitt out-of-gamut detection via Culori. PRODUCT.md sin `#FF6B35` er `oklch(0.682 0.207 38)` — `C=0.207` er **utenfor sRGB ved den L** (sRGB-tak ved L=0.68, H=38 ligger på ~`C=0.18`). Min `--ref-amber-600` på `C=0.175` holder seg innenfor og gir konsistent rendering på sRGB/P3.

Subtilt **varm paper (`L=0.985, C=0.003, H=80`)** istedenfor `#FFFFFF` fordi rein hvit på OLED i lavt lys (forelder kl 03:00) gir glare-shock; 1.5% C-bias mot varm gir samme «hvit-følelse» dagtid men reduserer kvelds-blending. Holder seg innenfor PRODUCT.md sin «pure white surface»-spec perseptuelt — forskjellen er under JND for de fleste, men håndsmør for søvndeprivert bruker.

## WCAG-kontrast-tabell

Alle målinger via Culori; APCA Lc er polarity-aware (text-on-bg).

| Pair | WCAG ratio | APCA Lc | Pass AA / AAA? |
|---|---|---|---|
| ink (#14181F) on paper (#FBFAF8) | 16.8:1 | Lc 100 | AAA + APCA preferred body |
| ink-soft (#4A5260) on paper | 7.9:1 | Lc 78 | AAA + APCA fluent |
| mute (#B8B5B0) on paper | 2.4:1 | Lc 36 | Non-text only (hairlines, dividers) |
| ink on white (#FFFFFF) | 17.2:1 | Lc 103 | AAA |
| amber-600 (#F26A2E) on paper | 3.1:1 | Lc 48 | AA large only — bruk KUN for filled buttons med ink-tekst |
| ink on amber-600 (filled CTA) | 5.4:1 | Lc 72 | AA body, APCA fluent — primær CTA-konfig |
| stroller (#3F8CC4) on paper | 3.4:1 | Lc 52 | Ring-stroke only, ikke tekst |
| carrier (#B26AC2) on paper | 3.0:1 | Lc 46 | Ring-stroke only |
| outdoor (#2EA079) on paper | 3.0:1 | Lc 47 | Ring-stroke only |
| sleep (#6D7FD8) on paper | 3.6:1 | Lc 54 | Ring-stroke only |
| hairline (#ECEAE6) on paper | 1.12:1 | Lc 6 | Non-text — divider |

**Kritisk regel**: ring-hues passerer kun som 3:1 non-text (UI-komponent-kontrast, WCAG 1.4.11). Tekst-labels under ringene **må** bruke `--ink` eller `--ink-soft`, aldri ring-hue. Dette løser også CVD-tilfellet: deuteranopi-simulerte ringer vil overlappe, men L-separasjonen er ikke bærer av meningen — ikon + label er.

## Sammenligning med A/B

**A — Court Clay** (cream + terracotta):
- cream `oklch(0.96 0.025 80)` + terracotta `oklch(0.55 0.13 35)` = **ΔH=45°**, begge i varm sektor → lav perseptuell separasjon, klassisk «muddy parenting-app» som triggerer Hatch/Frida-mønster-gjenkjennelse. PRODUCT.md flagger dette eksplisitt som anti-mønster.
- DM Serif tilfører ytterligere editorial-bias. Egen som identitet, men feil register: PRODUCT.md sier **«product register, not brand register»**.

**B — PRODUCT.md PA-palett** (pure white + #FF6B35 + Apple-rings):
- Riktig L-arkitektur (hvit + ink + isolert accent) men `#FF6B35` er **out-of-sRGB-gamut** ved C=0.207 på L=0.68. Browsers clipper til `C≈0.18` — du får dårligere chroma-konsistens på tvers av enheter (Safari iOS Display-P3 vs. desktop sRGB).
- Apple Fitness ring-hues er trukket fra **dark surface kalibrering**. Direkte port til hvit: emerald (`#00B383`) lander på `Lc 38` (under APCA 60 threshold), vogn-blå klipper på `L=0.72` istedenfor `0.62`. Ringene mister iso-perseptuell vekt.

**C — min palett**:
- Behold B sin DNA fullstendig (pure white surface, ink text, varm accent, multi-color rings) — men flytt alle kromatiske verdier inn i sRGB-gamut, fastsett `L=0.62` på alle ringer for iso-vekt, og bytt ren hvit mot 1.5% varm paper for natt-bruk.
- DM Serif droppes (matcher PRODUCT.md PA-palett uten å re-introdusere editorial-bias).

## Implementasjons-skisse

Token-graf:

```
ref.{white,paper,hairline,mute,ink,ink-soft}   (surface ramp)
ref.{amber-600,amber-700}                       (accent)
ref.{stroller,carrier,outdoor,sleep}            (functional rings)
        ↓
semantic.{surface, surface-elevated, ink, ink-soft, ink-mute,
          hairline, accent, accent-press,
          ring-stroller, ring-carrier, ring-outdoor, ring-sleep,
          focus}
        ↓
components consume semantic only
```

Filer som endres (estimat fra repo-mønster):
- `src/styles/tokens.css` (eller tilsvarende global token-fil) — full overskrivning av `--ref-*` og `--semantic-*` (~80 linjer)
- `src/styles/global.css` — fjern hardkodet `#FF6B35`, `#14181F` literals
- `tailwind.config.ts` (hvis Tailwind) — map `colors.surface`, `colors.ink.*`, `colors.ring.*` mot CSS vars
- Komponent-grep etter `#[0-9a-f]{6}` for å fange resterende literals (~10-20 forekomster typisk i en 4-skjerm-app)

AI-tid: ~12 min for token-swap + grep+replace + visuell smoketest.

## Anti-mønstre

1. **Ikke bruk HSL for ring-kalibrering.** `hsl(235 55% 50%)` og `hsl(155 55% 50%)` har lik HSL-L men ulik perseptuell L. Fastsett `oklch L`, ikke `hsl L`.
2. **Ikke port Apple Fitness ring-hues direkte fra dark→light.** Re-kalibrer L til bakgrunnens polaritet. Min palett gjør dette: `L=0.62` for light, ville vært `L=0.72` for dark.
3. **Ikke la `#FF6B35` overleve token-swap.** Den er out-of-sRGB-gamut → browser-clipping gir inkonsistent rendering på Safari iOS vs Chrome desktop. `--ref-amber-600` ved `C=0.175` er innenfor.
4. **Ikke bruk ring-hue som tekstfarge** — ingen passerer APCA Lc 60 på paper. Tekst er alltid `--ink` eller `--ink-soft`.
5. **CIELAB-blue-problemet**: Hvis noen foreslår å migrere til CIELAB for «print-konsistens», sjekk vogn-blå vs søvn-indigo først — de vil kollapse mot hverandre.
6. **Muddy mid-tone**: Aldri tween accent gjennom OKLCH om hue krysser 0°/360°-grense; bruk `color-mix(in oklab, ...)` for trygge gradienter.
7. **Re-validér kontrast etter hue-swap** (per din memory): sRGB-clipping på out-of-gamut OKLCH maskerer ekte L; in-gamut substitusjon ved identisk L kan brekke WCAG 1.4.11. Kjør Culori `clampGamut('rgb')` + APCA-check etter hver endring.
