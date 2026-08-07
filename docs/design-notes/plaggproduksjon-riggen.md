# Å rendre et plagg inn i settet

Skrevet 2026-08-07, da `sovepose-1-5-tog` og `sovepose-2-0-tog` ble laget.
Notatet finnes fordi neste plagg skal kunne lages uten å gjette, og fordi
`garments-clay/` er slettet: mangler et plagg nå, er svaret å rendre det i
riggen — ikke å hente det fra et annet materiale.

Bindende kilder: `docs/design-notes/art-bible-2026-08-02.md` (§Lysriggen,
§Kamera, §Materialer) og `DESIGN.md` (§Art direction). Dette notatet er
oppskriften, ikke en ny beslutning.

## 1. Referanser

Bruk ALLTID to eksisterende plagg fra `public/illustrations/garments/` som
referansebilder — ett lettere og ett tyngre enn det du skal lage. Uten dem
driver palett og silhuett.

Filene i repoet er komprimerte (maks 640 px). Hent full oppløsning fra
historikken:

```
git show dde5be6^:public/illustrations/garments/<navn>.png > ref.png
```

`dde5be6^` er siste commit før PNG-ene ble slettet.

## 2. Prompten

Skriv riggen inn, ikke en stemning. Denne teksten produserte begge
soveposene, med `nano_banana_pro` og begge referansene som `image`-medias:

> Product illustration of a baby sleeping bag (sleeveless wearable blanket),
> rendered to EXACTLY match the two reference images in style, lighting,
> camera and palette. This is a **N TOG** weight: *…beskriv loft og quilting
> relativt til de to referansene…*
>
> MANDATORY, matching the references:
> - Front-facing, symmetrical, floating with no floor, no hanger, no props,
>   no baby inside.
> - Same silhouette: *…kategoriens faste trekk…*
> - Warm neutral palette *…* with muted terracotta-rust piping — exactly the
>   accent tone used in the references.
> - Matte, real textile. NEVER plastic, glossy, clay-like, toy-like or
>   3D-cartoon.
> - Large soft key light from roughly 40 degrees above and to the upper left,
>   same side as the references. Warm-neutral white balance around
>   4000-4300K — the material provides the warmth, not an orange colour cast.
>   Moderate 2:1 key-to-fill, no crushed shadows, no blown-out highlights.
> - Roughly 85mm product-photography feel, slight frontal elevation, no
>   wide-angle distortion.
> - Completely plain white background, no shadow on the ground, no rim light,
>   no reflections, no gradient, no text, no labels, no watermark.
> - Same visual scale within the frame as the references.

Generer minst fire varianter. Velg den som leser tydelig FORSKJELLIG fra
naboene i skalaen — to plagg som ser like ut, er to plagg som ikke hjelper.

## 3. Fristilling

Bakgrunnen fjernes etterpå (Higgsfields `remove_background` gjorde det her).
Art bible krever transparent objekt; kontakt-/AO-skygge hører hjemme i
UI-laget.

## 4. Normalisering — dette er det som får plagget til å slutte å hoppe

Settets konvensjon, målt på de fem soveposene som fantes fra før:

| Egenskap | Verdi |
| --- | --- |
| Lerret | 1408 × 768 |
| Plaggets høyde | 0,94 av lerrethøyden |
| Senter | x = 0,50 |

```python
im = Image.open(kilde).convert('RGBA')
im = im.crop(im.split()[-1].getbbox())          # til alfa-boksen
mh = round(768 * 0.940); r = mh / im.size[1]
im = im.resize((round(im.size[0] * r), mh), Image.LANCZOS)
lerret = Image.new('RGBA', (1408, 768), (0, 0, 0, 0))
lerret.paste(im, ((1408 - im.size[0]) // 2, (768 - im.size[1]) // 2), im)
```

Deretter samme komprimering som resten av settet: lengste side 640, WebP
kvalitet 82. Et plagg lander da på 12–20 KB.

## 5. Porten

`npx vitest run src/screens/__tests__/PlaggbibliotekScreen.plassregnskapet.test.tsx`
måler at HVERT plagg fyller ≥ 80 % av bilderammens høyde etter
`object-fit: contain`. Den leser de ekte målene fra disk, så et plagg med
feil sideforhold felles her og ikke i en anmeldelse.

Se på skjermbildet etterpå. `npm run build && npm run preview -- --port 4173`
og `npx tsx tools/product-audit/cli.ts prepare`.

## Kjent avvik

`sovepose-2-5-tog` står på skrå og halvt sammenfoldet, mens alle de andre
står frontalt. Det bryter §Kamera («plagg vises frontalt, flytende») og var
slik før 2026-08-07. Skal rekka bli helt jevn, rendres den på nytt etter
oppskriften over.
