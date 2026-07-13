# Babyora — Asset-spesifikasjon (P9 fra Fable 5)

> Kontrakt for Lillian-avatar (A1–A7) + plagg-thumbnails i ny OKLCH-
> palett. Gemini Nano Banana 2 med referansebetinging.

## Fargekart (fra `src/styles/tokens.css`)

| Token | Verdi (hex for prompt) | Plagg-typer |
|---|---|---|
| `garment-innerst` | `#F2E8D8` (krem-ull) | body, ullundertøy, sokker |
| `garment-mellomlag` | `#4FA3A5` (dempet teal) | fleece, pyjamas, ull-mellomlag |
| `garment-ytterst` | `#2C4A6E` (dyp marine) | kjøredress, jakke, regnskall |
| `garment-ekstra` | `#E8643C` (korall) | lue, votter, sovepose-detaljer |
| `app-bakgrunn` | `#F4F8FB` (blåhvit) | ALLE bilder |
| Hud | varm naturlig | uendret fra dagens Lillian |
| Hår | lys brun | uendret fra dagens Lillian |

**Regel:** hvert plagg = ÉN dominant kategorifarge + maks én nøytral
detalj (knapper, glidelås i off-white/grå). **Aldri beige tekstil.**

## Tier-tabell (verifisert mot `src/lib/avatar-tier.ts`)

| Tier | Navn (TIER_LABEL) | Plagg synlig | Farger |
|---|---|---|---|
| A1 | Sommer-base | Kortermet body, bare bein/føtter | krem |
| A2 | Mild-base | Langermet ullbody + tynn bukse | krem (body) + lett krem (bukse) |
| A3 | Kjølig mellomlag | Ull-mellomlag som ytterste over ullbody | teal mellomlag over krem-glimt i halsen |
| A4 | Lett yttertøy | Kjøredress (lett) | dyp marine, ullkrem synlig i halsen |
| A5 | Vinter | Vinterkjøredress | dyp marine, korall-trim mulig på hette |
| A6 | Ekstrem vinter | Vinterkjøredress isolert + lue + votter | marine dress + korall lue/votter |
| A7 | Søvn | Sovepose (over body) | korall-pose, krem body synlig i halsen |

Note: tier-definisjonene i [src/lib/avatar-tier.ts](src/lib/avatar-tier.ts)
er kanon — denne tabellen er prompt-oversettelse.

## Steg 1 — Master-referanse

Master-prompt:

> A single toddler character "Lillian", stop-motion claymation style,
> soft matte clay texture with subtle handcrafted surface, big friendly
> eyes, light brown hair, warm natural skin tone. Standing pose, facing
> camera, arms relaxed slightly out from body, feet apart and stable.
> Wearing only a cream long-sleeve wool bodysuit (#F2E8D8). Eye-level
> camera, full figure with 10% margin, no crop. Soft studio lighting:
> cool ambient fill (slightly blue, like overcast snow light) with a
> gentle warm key light on the face. Flat solid background #F4F8FB.
> No props, no floor line, only a very soft contact shadow under the
> feet. Centered composition.

## Steg 2 — A-tier-mal

Per tier:

> Use the attached reference image. SAME character, SAME pose, SAME
> camera, SAME lighting, SAME background #F4F8FB, SAME clay style.
> Change ONLY the clothing to: {tier-plagg per tabell}.
> Do not change face, proportions, pose, framing or lighting.
> No beige clothing. No added props.

## Steg 3 — Plagg-thumbnails

Per plagg:

> Same claymation clay material and soft cool studio lighting as the
> attached reference. A single {PLAGG} floating product shot, slight
> 3/4 angle from above, centered, flat background #F4F8FB, soft contact
> shadow. Dominant color {KATEGORIFARGE}. No character, no props,
> no text.

Topp-14 prioritert liste (fra MATRIX-bruk):
1. langermet-body (innerst-krem)
2. langermet-ullbody (innerst-krem)
3. kortermet-body (innerst-krem)
4. ullsokker (innerst-krem)
5. pyjamas (mellomlag-teal)
6. ull-pyjamas (mellomlag-teal)
7. ull-mellomlag (mellomlag-teal)
8. ull-bukse (mellomlag-teal)
9. kjoredress (ytterst-marine)
10. vinterkjoredress (ytterst-marine)
11. regntoy-skall (ytterst-marine)
12. lue (ekstra-korall)
13. votter (ekstra-korall)
14. sovepose-2-5-tog (ekstra-korall, krem body synlig)

## QA-gate (per asset)

- [ ] Komposittert over faktiske tokens-flater på 430 px bredde, vurdert
      i appen (ikke i Gemini-UI)
- [ ] Samme ansikt/proporsjoner som master (side-by-side-sjekk)
- [ ] Ingen beige tekstil; kategorifarge dominerer riktig plagg
- [ ] Lys konsistent (kjølig fyll, varm key) — ingen «varmt studiofoto»
- [ ] Ingen halo/kant-artefakter mot `#F4F8FB`
- [ ] Leselig på 88 px thumbnail OG ~40 % viewport hero
- [ ] Eksport: WebP, 2× størrelse for hero, navn `avatar-A{n}.webp` /
      `garment-{id}.webp`
- [ ] Filstørrelse < 150 kB per asset

## Fallback

Hvis to tiers på rad feiler konsistens-QA mot master etter 3 forsøk:
stopp Gemini-løpet, før opp i `ANOMALIES.md` som beslutningssak.
Alternativ: én illustratør tegner master-settet (engangsjobb,
typisk 7–15 k NOK for 7 tiers + 15 plagg).

## Rekkefølge

1. Master → godkjennes av Sivert (kontrakten)
2. A5 (mest brukte vinter-tier) → komposittest i appen → godkjennes
3. Resten av A-tiers (A1, A2, A3, A4, A6, A7)
4. Topp 14 plagg-thumbnails
5. Generasjonslogg under (oppdateres per asset)

## Generasjonslogg

| Asset | Forsøk | Status | Dato | Notat |
|---|---|---|---|---|
| Master | 1 | **ARKIVERT** | 2026-06-12 | `master.png` — første utkast, armer for langt ut |
| Master v2 | 1 | **GODKJENT** | 2026-06-12 | `master-v2.png` — bedre arm-stilling, sterkere blå-hvit bg |
| A1 (Sommer) | 1 | **DEPLOYED** | 2026-06-12 | krem kortermet body, bare bein, ref-betinget på master-v2 |
| A2 (Mild) | 1 | **DEPLOYED** | 2026-06-12 | krem long-sleeve body + krem bukse |
| A3 (Mellomlag) | 1 | **DEPLOYED** | 2026-06-12 | teal #4FA3A5 chunky genser + teal bukse, krem-collar |
| A4 (Lett ytter) | 1 | **DEPLOYED** | 2026-06-12 | marine kjøredress, hood down, krem collar |
| A5 (Vinter) | 1 | **DEPLOYED** | 2026-06-12 | marine vinterkjøredress, coral hood-trim, krem collar |
| A6 (Ekstrem) | 1 | **DEPLOYED** | 2026-06-12 | marine + coral lue + coral votter |
| A7 (Søvn) | 1 | **DEPLOYED** | 2026-06-12 | coral sovepose, krem body i hals |
| langermet-body | 1 | **DEPLOYED** | 2026-06-12 | krem cotton bodysuit floating |
| langermet-ullbody | 1 | **DEPLOYED** | 2026-06-12 | krem wool bodysuit, fin knit-textur |
| kortermet-body | 1 | **DEPLOYED** | 2026-06-12 | krem short-sleeve cotton bodysuit |
| ullsokker | 1 | **DEPLOYED** | 2026-06-12 | par krem wool socks side-by-side |
| pyjamas | 1 | **DEPLOYED** | 2026-06-12 | teal pyjamas onesie, snap buttons |
| ull-pyjamas | 1 | **DEPLOYED** | 2026-06-12 | teal merino wool pyjamas |
| ull-mellomlag | 1 | **DEPLOYED** | 2026-06-12 | teal chunky knit mid-layer sweater |
| ull-bukse | 1 | **DEPLOYED** | 2026-06-12 | teal wool baby pants |
| kjoredress | 1 | **DEPLOYED** | 2026-06-12 | navy padded stroller overall, hood down |
| vinterkjoredress | 1 | **DEPLOYED** | 2026-06-12 | navy thick insulated snowsuit, hood + cream trim |
| regntoy-skall | 1 | **DEPLOYED** | 2026-06-12 | navy waterproof rain shell, hooded |
| lue | 1 | **DEPLOYED** | 2026-06-12 | coral knit wool beanie med folded brim + button |
| votter | 1 | **DEPLOYED** | 2026-06-12 | par coral knit mittens side-by-side |
| sovepose-2-5-tog | 1 | **DEPLOYED** | 2026-06-12 | coral sleeveless quilted sleep sack |

**Resultat:** alle 22 assets generert i ÉN runde (0 retries). Total
kostnad: $0.86 ≈ 9 NOK av 100 NOK-cap. Master-betinging fungerte
eksepsjonelt — alle A-tiers har konsistent ansikt, proporsjoner og
lyssetning.

## Estimert kostnad

- 7 A-tiers × max 3 forsøk = 21 generations
- 14 plagg × max 3 forsøk = 42 generations
- 1 master × 2 forsøk = 2 generations
- Worst-case: 65 generations × $0.039 ≈ $2.54 ≈ **~27 NOK**

Innenfor 100 NOK-spend-cap. Realistisk forventet: 20-30 generations
hvis master-betinging fungerer = ~12 NOK.
