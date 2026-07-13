# Babyora — Klesplagg-illustrasjoner (komplett liste)

Generert fra `src/lib/wool-layers/tables.ts` + `modifiers.ts`. Alle unike plagg-strenger som vises som anbefaling i appen, gruppert etter layer-kategori og dedup-et på tvers av aktiviteter (vogn / bæresele / søvn / utelek).

Lever til Nano Banana 2, Midjourney V7, DALL-E 3, eller annen AI-image-generator. Bruk **STYLE_BASE** under for konsistens på tvers av alle 61 plagg.

---

## Stil-retning

Illustrasjonene skal føles:

- **Minimal** — kun det som trengs for å gjenkjenne plagget
- **Precise** — rene konturer, ingen håndtegnet wobble
- **Product-oriented** — som premium teknisk apparel, ikke e-commerce thumbnails
- **Calm and refined** — neutral, ingen visuell støy
- **Slightly technical** — som Apple Weather/Fitness/Health, ikke barnebok

Inspirasjon: Apple system visuals, premium product rendering, tekniske outdoor-merker (Arc'teryx, Norrøna, Patagonia minimalismen — ikke logoene).

Stilen ligger mellom flatt vektor-ikon og fotorealistisk rendering — vi kaller det **"abstracted realism"**.

---

## STYLE_BASE (kopier inn i hver prompt)

```
Minimal, precise product illustration of a single piece of children's
clothing, floating standalone as if laid flat (garment shape only — no
body, no mannequin, no hanger).

Style: abstracted realism — between flat vector and photorealism.
Clean silhouettes, simplified but recognizably real fabric forms. Edges
precise and slightly softened (not sharp vector edges, not hand-drawn).
Subtle structure: seams may be hinted as thin tonal lines, never
detailed. No visible stitching. No fabric texture noise. No wrinkles.
Very soft shading at most, or none at all. No bold outlines.

Visual reference: Apple Weather / Fitness / Health system visuals,
premium technical outdoor apparel product shots, calm UI iconography
for adults.

Composition: front-facing view, centered, 1:1 square, garment occupies
~70% of canvas vertical. No perspective distortion, no tilt, no 3/4
angle. Consistent visual weight across the whole garment set.

Palette (strict):
- Garment base color: muted neutral from {soft white #F2F2F0, warm
  light grey #D8D6D2, mid grey #9B9A96, charcoal #3A3A38, deep navy
  #1E2A38, warm taupe #8B7B6A, sand #C9B89E}. Choose ONE base per
  garment, pick the most natural fit.
- Optional single accent on small details only (zipper, cuff, sole):
  cool slate #4F6477 OR warm rust #B36A3F. Use sparingly.
- No saturated brights. No gradients. No patterns. No prints.

Background: SOLID BRIGHT MAGENTA (#FF00FF) covering the entire canvas
(chroma-key for transparent post-processing). NO gradient, NO scenery,
NO shadow ground, NO floor.

Strict constraints:
- NO text, NO logos, NO numbers, NO brand marks
- NO speech bubbles, NO decorative elements, NO patterns
- NO cartoon simplification, NO playful expression
- NO realistic photograph style
- NO hand-drawn wobble, NO sketchy lines
- NO background color other than #FF00FF
- The garment must NEVER use magenta or pink tones — only the
  background is magenta.
```

---

## Konsistens-regler

Alle 61 illustrasjoner må:
- dele identisk visuelt språk
- ha samme visuelle vekt og strek-tykkelse
- bruke samme strict-palette
- ha samme baseline-alignment (centered, samme vertikal-okkupasjon)
- føles som komponenter i ett system

Ingen plagg skal stikke seg ut stilistisk. En vinterdress og en t-skjorte skal føles som det samme designsystemet — bare ulik form.

---

## 1. INNERST (`innerst`) — 13 illustrasjoner

| # | Norsk (database-streng) | Engelsk prompt-tilskudd |
|---|---|---|
| 1 | `kortermet body` | Short-sleeve infant bodysuit silhouette, snap closure hinted at crotch, base color: soft white #F2F2F0. |
| 2 | `kortermet ullbody` | Short-sleeve wool bodysuit silhouette, slightly thicker fabric than cotton variant, base color: warm light grey #D8D6D2. |
| 3 | `langermet body` | Long-sleeve infant bodysuit silhouette, snap closure at crotch, base color: soft white #F2F2F0. |
| 4 | `langermet ullbody` | Long-sleeve wool bodysuit silhouette, slightly thicker fabric, base color: warm light grey #D8D6D2. |
| 5 | `langermet ullbody tynn` | Long-sleeve thin wool bodysuit silhouette, lighter visual weight than #4, base color: soft white #F2F2F0. |
| 6 | `ullsett tynt` | Two-piece thin wool base layer set (long-sleeve top + leggings) laid flat side by side, base color: warm light grey #D8D6D2. |
| 7 | `ullsett tykt` | Two-piece thick wool base layer set, visibly chunkier than #6, base color: mid grey #9B9A96. |
| 8 | `to ullsett oppå hverandre` | Two wool base layer sets shown stacked, one slightly visible behind the other, suggesting layering. Base color: mid grey #9B9A96. |
| 9 | `t-skjorte` | Plain short-sleeve children's t-shirt silhouette, base color: soft white #F2F2F0. |
| 10 | `shorts` | Plain children's shorts silhouette with hinted elastic waistband, base color: warm taupe #8B7B6A. |
| 11 | `lett bukse` | Lightweight children's trousers silhouette, base color: sand #C9B89E. |
| 12 | `bleie` | Modern reusable cloth diaper silhouette, single small accent slate tab hint, base color: soft white #F2F2F0. |
| 13 | `ullsokker` / `ullstrømper` | Pair of wool socks shown side by side, ribbed cuff hinted, base color: warm light grey #D8D6D2. **Note**: thick variant uses mid grey #9B9A96 to visually distinguish weight. |

---

## 2. MELLOMLAG (`mellomlag`) — 9 illustrasjoner

| # | Norsk | Engelsk prompt-tilskudd |
|---|---|---|
| 1 | `tynn bukse` | Thin mid-layer trousers silhouette (jersey or fleece), base color: warm light grey #D8D6D2. |
| 2 | `tynn ull-mellomlag` | Thin wool mid-layer top silhouette, like a thin sweater, base color: warm light grey #D8D6D2. |
| 3 | `ull-mellomlag` | Standard wool mid-layer top silhouette, slightly more visual weight than #2, base color: mid grey #9B9A96. |
| 4 | `ull-mellomlag tykt` | Thick wool mid-layer top silhouette, chunkier than #3, base color: charcoal #3A3A38. |
| 5 | `ull-jakke` | Wool jacket silhouette with hinted zipper line down the front, base color: deep navy #1E2A38, optional cool slate #4F6477 accent on zipper. |
| 6 | `ull-bukse` | Knit wool trousers silhouette with hinted elastic waistband, base color: mid grey #9B9A96. |
| 7 | `tynn pyjamas` | Two-piece thin children's pyjamas silhouette laid flat (top + bottom), base color: soft white #F2F2F0. |
| 8 | `pyjamas` | Two-piece standard children's pyjamas silhouette, slightly thicker visual weight than #7, base color: warm light grey #D8D6D2. |
| 9 | `ull-pyjamas` | Two-piece wool pyjamas silhouette, hinted ribbed texture at cuffs only, base color: warm taupe #8B7B6A. |

---

## 3. YTTERTØY (`yttertoy`) — 8 illustrasjoner

| # | Norsk | Engelsk prompt-tilskudd |
|---|---|---|
| 1 | `lett kjøredress` | Light one-piece stroller overall silhouette, thin shell, base color: warm light grey #D8D6D2, single hinted zipper line. |
| 2 | `kjøredress` | Standard one-piece stroller overall silhouette, hinted hood and slightly padded form, base color: mid grey #9B9A96. |
| 3 | `vinterkjøredress` | Winter one-piece stroller overall silhouette, visibly more padded than #2, hinted hood, base color: charcoal #3A3A38. |
| 4 | `vinterkjøredress isolert` | Heavily insulated winter one-piece, puffy quilted silhouette with subtle quilt-channel lines, base color: deep navy #1E2A38. |
| 5 | `vinterdress` | Two-piece winter overall (jacket + bib pants shown side by side), padded silhouettes, base color: charcoal #3A3A38. |
| 6 | `vinterdress isolert` | Heavily insulated two-piece winter overall, puffy quilted silhouettes with subtle quilt-channel lines, base color: deep navy #1E2A38. |
| 7 | `regntøy / skall` | Two-piece rain set silhouettes (jacket + trousers side by side), smooth matte shell finish, base color: cool slate #4F6477. |
| 8 | `vindtett skall` | Slim windproof shell jacket silhouette, smooth matte finish, hinted zipper line, base color: charcoal #3A3A38. |

---

## 4. EKSTRA (`ekstra`) — 31 illustrasjoner

### Hodeplagg

| # | Norsk | Engelsk prompt-tilskudd |
|---|---|---|
| 1 | `solhatt` | Children's sun hat silhouette, wide brim, hinted chin strap as thin tonal line, base color: sand #C9B89E. |
| 2 | `caps eller solhatt` | Same as #1. |
| 3 | `lue tynn` | Thin knit beanie silhouette, small hinted pompom on top, base color: soft white #F2F2F0. |
| 4 | `lue` | Standard knit beanie silhouette, hinted folded cuff, base color: warm taupe #8B7B6A. |
| 5 | `lue m/ ull` | Thick wool beanie silhouette with hinted ear flaps and two short braided ties, base color: charcoal #3A3A38. |
| 6 | `balaklava` | Children's balaclava silhouette (full-head hood form with face opening), base color: deep navy #1E2A38. |

### Hender

| # | Norsk | Engelsk prompt-tilskudd |
|---|---|---|
| 7 | `votter tynne` | Pair of thin knit mittens shown side by side, base color: warm light grey #D8D6D2. |
| 8 | `votter` | Pair of standard knit mittens, slightly thicker visual weight than #7, base color: mid grey #9B9A96. |
| 9 | `votter tykke` | Pair of thick chunky mittens, base color: charcoal #3A3A38. |
| 10 | `votter dun` | Pair of puffy down-filled mittens with subtle quilt-channel hint, base color: deep navy #1E2A38. |
| 11 | `vindvotter (skall)` | Pair of windproof shell mittens, smooth matte finish, base color: cool slate #4F6477. |

### Hals

| # | Norsk | Engelsk prompt-tilskudd |
|---|---|---|
| 12 | `hals` | Children's tube-shaped neck warmer / buff silhouette, base color: warm taupe #8B7B6A. |

### Føtter

| # | Norsk | Engelsk prompt-tilskudd |
|---|---|---|
| 13 | `sko` | Children's casual everyday shoe silhouette, hinted Velcro strap as a single tonal line, base color: warm light grey #D8D6D2. |
| 14 | `tøffel-sko` | Soft baby slipper-style shoe silhouette (felted wool form), base color: warm taupe #8B7B6A. |
| 15 | `sandaler` | Children's summer sandal silhouette with hinted straps, base color: sand #C9B89E. |
| 16 | `vintersko` | Children's winter boot silhouette, base color: charcoal #3A3A38. |
| 17 | `vintersko isolerte` | Heavily insulated winter boot silhouette, slightly puffier than #16, base color: deep navy #1E2A38. |

### Vogn-tilbehør

| # | Norsk | Engelsk prompt-tilskudd |
|---|---|---|
| 18 | `tynt teppe` | Thin folded baby blanket silhouette (rectangle with hinted fold line), base color: soft white #F2F2F0. |
| 19 | `dunteppe` | Folded puffy down blanket silhouette with subtle quilt-channel lines, base color: warm light grey #D8D6D2. |
| 20 | `varmepose lett` | Light stroller footmuff silhouette (long tapered envelope shape), thin shell, base color: mid grey #9B9A96. |
| 21 | `varmepose` | Standard stroller footmuff silhouette, padded form, base color: charcoal #3A3A38. |
| 22 | `varmepose dun` | Down-filled stroller footmuff, puffy quilted silhouette with subtle quilt-channel lines, base color: deep navy #1E2A38. |
| 23 | `sauekinn i vogn` | Sheepskin stroller liner silhouette (rounded rectangular pelt form, hinted wool texture only at the edges), base color: warm light grey #D8D6D2. |
| 24 | `regntrekk` | Stroller rain cover silhouette (transparent dome shape), hinted as a clean outline with very subtle interior tonal shift, base color near-transparent off-white #EEEFEE with cool slate #4F6477 edge. |
| 25 | `regnponcho over bæresele` | Rain poncho silhouette designed to cover both parent and baby (long flared shape with hood), smooth matte shell finish, base color: cool slate #4F6477. |

### Søvn

For sleep bags: differentiate **only by visual padding weight**, not by labels or numbers (the spec forbids text). Use base color to encode warmth tier.

| # | Norsk | Engelsk prompt-tilskudd |
|---|---|---|
| 26 | `sovepose 0.5 TOG` | Very thin sleeveless sleep sack silhouette, almost flat, base color: soft white #F2F2F0. |
| 27 | `sovepose 1.0 TOG` | Light sleeveless sleep sack silhouette, slight padding hint, base color: warm light grey #D8D6D2. |
| 28 | `sovepose 2.5 TOG` | Medium sleeveless sleep sack silhouette, visible padding, base color: mid grey #9B9A96. |
| 29 | `sovepose 3.0–3.5 TOG` | Thick sleeveless sleep sack silhouette, puffy quilted form with subtle quilt-channel lines, base color: charcoal #3A3A38. |
| 30 | `sovepose 3.5 TOG` | Heaviest sleeveless sleep sack silhouette, very puffy quilted form, base color: deep navy #1E2A38. |

### Hud / skin

| # | Norsk | Engelsk prompt-tilskudd |
|---|---|---|
| 31 | `ansiktskrem` | Small children's face cream tube silhouette, smooth cylindrical form with hinted cap, base color: soft white #F2F2F0 with hinted cool slate #4F6477 cap. |

---

## Etterprosess (samme som avatarene)

1. Generer alle 61 med magenta-bakgrunn via STYLE_BASE
2. Kjør gjennom `scripts/remove-avatar-bg.mjs` for transparens (adaptiv chroma-key + despill)
3. Lagre i `public/illustrations/garments/<filnavn>.png` med slugified database-strenger som filnavn:
   - `kortermet-ullbody.png`
   - `vinterkjoredress-isolert.png`
   - `sovepose-3-5-tog.png`
4. Når alle er ferdig, lag `src/data/garment-illustrations.ts` med mapping streng → filsti.

---

## Tellinger

- **Innerst**: 13
- **Mellomlag**: 9
- **Yttertøy**: 8
- **Ekstra**: 31

**Totalt: 61 unike illustrasjoner.**

Anslått Nano Banana-kost: 61 × $0.039 ≈ **$2.40 ≈ 25 NOK**.

---

## Items som IKKE trenger illustrasjon

- `ekstra ull-lag` — modifier-tillegg, generisk, ingen unik visuell identitet
- `lett kortermet body (valgfritt)` — identisk med kortermet body
- `tynne ullstrømper` / `ullstrømper tykke` — varianter av ullsokker, dekkes med samme illustrasjon + tykkelse-variant-fargen som beskrevet

---

## Anti-mønstre å unngå

Disse er allerede i STYLE_BASE, men vi gjentar dem her som sanity-check:

- ❌ Cartoon-stil eller barnebok-uttrykk
- ❌ Bright eller saturated farger (Pinterest barneklær-stil)
- ❌ Fabric-tekstur, rynker, kompleks skygge
- ❌ "Personality" eller uttrykk i plagget (vi vil ha objekter, ikke karakterer)
- ❌ E-commerce-produktkort-stil
- ❌ Bold outline rundt hele plagget
- ❌ Hand-drawn wobble
- ❌ 3D-render-glans
- ❌ Geometrisk vektor-ikon-stil (for abstrakt)
- ❌ Logoer, tekst, tall, eller tag-prints på plagget

---

## Validerings-test

Når du har de første ~5 illustrasjonene, gjør **squint-testen**:

1. Legg dem ved siden av hverandre på en mobilskjerm i appens layer-row-størrelse (~44px ikon)
2. Lukk øynene halvveis
3. Føles de som ett system, eller som 5 ulike apper?
4. Kan du fortsatt gjenkjenne hvilket plagg som er hva?

Hvis svaret er "ja og ja" → kjør resten. Hvis "nei" → juster STYLE_BASE før de neste 56 brennes.

---

## TILLEGG (jun 2026): Alternativer + nye TOG-trinn — `--set=alternatives`

Disse plaggene er lagt til for **Min garderobe** / pros-cons-sammenligningen
(ull-først, men vis et rimeligere alternativ). De er allerede wiret i
`garment-illustrations.ts` (MAP + `PLACEHOLDER_PNG`) og i
`scripts/generate-garments.mjs` (`set: "alternatives"`). Inntil PNG-ene
genereres viser appen ull-/standard-varianten som plassholder.

Generer lokalt (krever `GEMINI_API_KEY`):

```
node scripts/generate-garments.mjs --set=alternatives
node scripts/remove-avatar-bg.mjs   # samme transparens-etterprosess
```

| # | filnavn (id) | plagg | plassholder til generert |
|---|---|---|---|
| 1 | `tynn-fleece` | Tynn fleece (alt. til tynn ull-mellomlag) | tynn-ull-mellomlag |
| 2 | `fleecedress` | Fleecedress (alt. til ull-mellomlag) | ull-mellomlag |
| 3 | `fleecejakke` | Fleecejakke (alt. til ull-jakke) | ull-jakke |
| 4 | `fleecebukse` | Fleecebukse (alt. til ull-bukse) | ull-bukse |
| 5 | `tynne-sko` | Tynne sko (alt. til sandaler) | sko |
| 6 | `sovepose-1-5-tog` | Sovepose 1.5 TOG (nytt trinn) | sovepose-1-0-tog |
| 7 | `sovepose-2-0-tog` | Sovepose 2.0 TOG (nytt trinn) | sovepose-2-5-tog |

**Anslått kost:** 7 × $0,039 ≈ **$0,27 ≈ ~3 NOK.** (Flere fleece-varianter kan
komme når alternativ-dekningen utvides til alle ull-lag.)
