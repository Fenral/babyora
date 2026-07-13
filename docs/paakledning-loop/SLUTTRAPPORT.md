# Påkledning-loop — Sluttrapport

**Dato:** 2026-06-25
**Iter-runder:** 3 (snitt 72.67 → 71.67 → 75.67, ikke konvergert)
**Beslutning:** 3 distinkte vinner-retninger levert — Sivert velger.

---

## Bakgrunn

Tre runder med `/impeccable`, `/emil-design-eng`, `/ui-ux-pro-max`, `/color-expert`,
`/frontend-design` og `/redesign-existing-projects` ga aldri full konvergens.
Per memo `feedback_critique_rounds_drop_signal.md` skal vi etter 5+ kritikk-runder
uten survivor-design stoppe iter-løpet og lande på det vi har. Vi stopper på 3
fordi tre distinkte retninger har krystallisert seg — videre iter ville tvinge
fram en kompromiss-løsning som ikke nødvendigvis er bedre enn å la Sivert velge
prinsipp først.

**Visuell sammenligning:** `file:///C:/Users/SkotvoldSivertSende/wool-app/public/paakledning-loop/final/index.html`

---

## Vinner-retning A: V1 — Anatomisk ro

> Behold den emosjonelle anatomi-metaforen, men dropp alt det iter-3-skill-konsensusen
> kalte støy: rail, connector, row-name-badges og legend.

**URL:** `file:///C:/Users/SkotvoldSivertSende/wool-app/public/paakledning-loop/final/v1/index.html`

### Strategi
Anatomisk plagg-stack hvor plaggene overlapper vertikalt slik du faktisk kler henne
(lue topp → sokker bunn). ÉN lag-koding: en liten farget anchor-dot på siden av
hvert plagg. Subtil vertikal kropp-akse i bakgrunnen forsterker metaforen.
Hele lag-pedagogikken lever inni bottom-sheet ved tap, ikke i hovedlerretet.

### Skill-scores (estimert)
| Skill | Score | Vurdering |
|---|---:|---|
| /impeccable | 84 | Lavest kognitiv last av de tre |
| /emil-design-eng | 80 | Beholder den emosjonelle "kledd-på-Liv"-følelsen |
| /ui-ux-pro-max | 76 | Mister noe forklaring uten rail |
| /color-expert | 78 | Distinkte lag-farger uten konkurranse |
| /frontend-design | 78 | CSS-variable-drevet, men ikke ekte data-driven |
| /redesign-existing-projects | 74 | 7+ lag kan bli trangt vertikalt |
| **Snitt** | **78.3** | |

### Komplett tiltak-liste for prod-port (React/RN)

1. **Datadrevet stack-layout via custom properties** — port `--w`, `--h`, `--overlap`
   til StyleSheet-genererte verdier per plagg. Bruk `garments[key].layout = { w, h, overlap }`.
2. **Anchor-dot som eneste lag-koding** — dropp `row-name`-badge, `rail`-system og `legend`.
3. **Sheet med ikke-destruktiv override** — implementer `activeKeys` map separat fra
   `originals`. Reset-knapp synlig kun når `activeKeys[key] !== null`.
4. **Pulse-ring og swap-flash via Reanimated** — port CSS-animations til `withTiming`
   + `withSequence` for native 60fps.
5. **Body-axis SVG-decoration** — render som `<Svg>` med linear gradient stroke,
   plassert via `position: absolute` i stack-canvas.
6. **CTA-orange #E85A1F (ikke #FF6B35)** — oppdater token `--cta-orange` globalt,
   bekreft at INGEN annen UI bruker den.
7. **Footer single-primary** — slett `footer-textlink`, behold kun `footer-primary`.
8. **Pro/Con-grid med maks 2 punkter** — slice i `garment.pros.slice(0,2)`.
9. **Spec-line collapsed** — 3 inline spec-items med vertikale dividers (ikke grid).
10. **Pros/cons icons fra Lucide** — `Check` (pro) og `Minus` (con) for konsistens.
11. **A11y** — `aria-label` på alle plagg-knapper, `aria-live="polite"` på undo-toast.

### Manglende assets
| Asset | Beskrivelse | Hvordan skaffe | Kost-estimat |
|---|---|---|---|
| `parkdress-skall.png` | Lettere parkdress-alternativ til vinterdress | Nano Banana prompt: *"Childrens parkdress with hood, lightweight winter shell, terracotta/rust color, transparent background, side view, ~1024x1024, matching existing garments illustration style"* | ~3 NOK |
| `dunvest.png` | Dunvest-alternativ til fleecejakke | Nano Banana prompt: *"Childrens down vest, navy blue, puffy quilted texture, no sleeves, transparent background, side view, matching existing wool-app garment illustrations"* | ~3 NOK |
| `fleecesett-barn.png` | Fleecesett-alternativ til tykt ullsett | Nano Banana prompt: *"Childrens fleece base layer set, top + leggings together, light grey, transparent background, side view, ~1024x1024"* | ~3 NOK |
| `ullbody-tykk.png` | Tykk variant av langermet ullbody | Nano Banana prompt: *"Childrens long-sleeve thick wool body, cream off-white color, 200g/m² appearance, transparent background, matching style of existing langermet-ullbody.png"* | ~3 NOK |
| `syntetisk-body.png` | Syntetisk body-alternativ | Nano Banana prompt: *"Childrens long-sleeve synthetic baselayer body, sky blue, technical fabric texture, transparent background"* | ~3 NOK |
| `ullbukse-tykk.png` | Tykk variant av tynn ullbukse | Nano Banana prompt: *"Childrens thick wool leggings, warm beige, 240g/m² appearance, transparent background"* | ~3 NOK |
| `syntetisk-bukse.png` | Syntetisk bukse-alternativ | Nano Banana prompt: *"Childrens synthetic baselayer leggings, dark slate blue, technical fabric, transparent background"* | ~3 NOK |
| `ulldress-tykk.png` | Tykk ulldress (alternativ til vinterdress) | Nano Banana prompt: *"Childrens thick wool overall/dress, charcoal grey, full-length, transparent background, matches existing ullsett-tykt style but as one-piece"* | ~3 NOK |
| `ullsett-medium.png` | Medium-tykt ullsett | Nano Banana prompt: *"Childrens medium-weight wool base layer set, soft heather grey, top + leggings, transparent background"* | ~3 NOK |
| `ullsokker-tynn.png` | Tynn variant av ullsokker | Bruk eksisterende `ullsokker.png` skalert mindre — eller Nano Banana: *"Childrens thin wool socks, single cream pair, transparent background"* | ~3 NOK |
| `ulldobbel-sokk.png` | Doble ullsokker | Nano Banana: *"Childrens double-layer wool socks pair, charcoal + cream, transparent background, thick winter style"* | ~3 NOK |

**Total asset-kost V1:** ~33 NOK (Nano Banana via Gemini API, Sivert-nøkkel på "nano banan 2.txt")

### Estimert tid for prod-port
- React Native komponenter (Stack, GarmentItem, AnchorDot, Sheet): **2 timer AI-tid**
- Asset-generering (Nano Banana × 11 stk) + integrering: **45 min klokketid**
- Reanimated motion-port (pulse, swap-flash, sheet-slide): **1 time AI-tid**
- Sheet med activeKeys + reset-logic: **45 min AI-tid**
- A11y + reduced-motion + dark-mode adjust: **45 min AI-tid**
- **Total: ~5 timer fra start til committed prod-build**

---

## Vinner-retning B: V2 — Skannbar liste

> Bytt anatomisk overlap-stack mot rad-basert liste, gruppert per lag.
> Mini-stack-preview på toppen for helhetsforståelse.

**URL:** `file:///C:/Users/SkotvoldSivertSende/wool-app/public/paakledning-loop/final/v2/index.html`

### Strategi
Stack-illustrasjonen blir en kompakt 100×160px preview-kort øverst (lue + dress + sokk)
som forklarer "kledd ovenfra-ned"-prinsippet visuelt. Selve plagg-listen er ren
vertikal rad-liste, gruppert under kategori-overskrifter (Innerst → Mellom → Ytterst → Tilbehør).
Hver rad har thumb (60×60), navn, material + vekt, og en venstre-stripe i lag-farge.
Skalerer trivielt fra 3 lag (sommer) til 7+ lag (ekstremvær).

### Skill-scores (estimert)
| Skill | Score | Vurdering |
|---|---:|---|
| /impeccable | 82 | Klart hierarki, lav kognitiv last |
| /emil-design-eng | 72 | Mister noe av den emosjonelle stemningen |
| /ui-ux-pro-max | 88 | Standard liste-pattern, kjent og trygg |
| /color-expert | 80 | Tinted backgrounds gir kontrast uten støy |
| /frontend-design | 86 | Reneste data-modell, gjenbrukbar Row-component |
| /redesign-existing-projects | 90 | Skalerer best fra 3 til 7+ lag |
| **Snitt** | **83.0** ★ | **Høyest snitt** |

### Komplett tiltak-liste for prod-port (React/RN)

1. **Group-array som primær datamodell** — `groupOrder = { innerst: [...], mellom: [...], ... }`
   styrer både gruppering og rad-rekkefølge.
2. **Render Row som FlatList-item** — på native bytt til `SectionList` med `sections=[innerst, mellom, ytterst, tilbehor]`.
3. **Mini-stack-preview som ren illustrasjon** — ikke interaktiv, 3 fixed images
   (lue + dress + sokk) i kompakt vertikal komposisjon.
4. **Lag-stripe (3px) på venstre kant av rad** — bruk `borderLeftWidth: 3` med
   `borderLeftColor: layerColor[g.lag]`.
5. **"Endret"-badge på rad** — render kun når `activeKeys[key] !== null`. Bruk
   `position: absolute` top-right på rad.
6. **Material + vekt inline i rad** — eliminerer behov for å åpne sheet bare for
   grunnleggende spec.
7. **Sheet identisk med V1** — gjenbruk Sheet-komponenten på tvers.
8. **Preview-counts pills** — render dynamisk fra `groupOrder` lengde per kategori.
9. **CTA-orange #E85A1F** (samme som V1).
10. **Chevron som affordance** — `>` på høyre side av hver rad signaliserer tap-til-detalj.
11. **Sticky kategori-headers ved scroll** — i React Native `SectionList` får du
    `stickySectionHeadersEnabled` gratis.
12. **A11y** — `accessibilityRole="button"` på Row, label sier "{name} ({lag}) — trykk for detalj".

### Manglende assets
Samme 11 assets som V1 (samme alternatives-katalog). **Total: ~33 NOK.**

### Estimert tid for prod-port
- React Native komponenter (StackPreview, GroupHeader, GarmentRow, Sheet): **2 timer AI-tid**
- Asset-generering (samme 11 som V1): **45 min klokketid**
- SectionList-setup + sticky headers: **30 min AI-tid**
- Sheet med activeKeys + reset (gjenbruk fra V1): **15 min AI-tid**
- A11y + reduced-motion + dark-mode adjust: **30 min AI-tid**
- **Total: ~4 timer (raskest av de tre — lavest visuell kompleksitet)**

---

## Vinner-retning C: V3 — Datadrevet stack + rail

> Best av iter-3-pakken: faktisk anatomisk stack med dynamisk SVG-connector
> fra plagg til kategori-rail. Datadrevet, ikke hardkodet.

**URL:** `file:///C:/Users/SkotvoldSivertSende/wool-app/public/paakledning-loop/final/v3/index.html`

### Strategi
Behold den anatomiske overlap-stacken, men kobl hvert plagg eksplisitt til en
kategori-rail med en SVG-linje. Linjene tegnes dynamisk fra faktiske
`getBoundingClientRect`-målepunkter (ResizeObserver), så de overlever font-load,
swap, og resize. Kategori-label lever KUN i rail-cap (ikke som row-name badge,
ikke som legend). Reduserer fra 4 parallelle lag-koding-systemer til 2 (anchor-dot + cap).

### Skill-scores (estimert)
| Skill | Score | Vurdering |
|---|---:|---|
| /impeccable | 78 | Mer visuell info enn V1, men ryddet ift iter-3 |
| /emil-design-eng | 82 | Connector-animasjon ved swap gir "lever"-følelse |
| /ui-ux-pro-max | 74 | Krever kort læring av rail-konsept |
| /color-expert | 82 | OKLCH-kalibrert hue-spread 60-70° |
| /frontend-design | 80 | Dyktig SVG + ResizeObserver-arkitektur |
| /redesign-existing-projects | 76 | Rail kan bli trangt med 7+ plagg |
| **Snitt** | **78.7** | |

### Komplett tiltak-liste for prod-port (React/RN)

1. **SVG-connector via react-native-svg** — `<Svg><Line/></Svg>` tegnes i en
   `useEffect` som måler `measure()` på plagg- og cap-refs.
2. **Rail-caps som ÉN lag-label-kilde** — slett `row-name` og `legend` helt.
3. **ResizeObserver-equivalent på native** — bruk `onLayout` på stack + items,
   re-tegne connector i `useCallback` med `useMemo`-cached coords.
4. **OKLCH-kalibrerte lag-farger** — verifiser at delta-E >25 mellom alle fire
   stroke-farger via color-expert-skill etter implementasjon.
5. **CTA-orange #E85A1F skilt fra ytterst-burnt-sienna #B45A24** — bekreft visuelt
   at det aldri oppstår dual-primary-konflikt når sheet åpnes.
6. **Datadrevet plagg-størrelse via `--w/--h/--overlap`** — port til StyleSheet-objekter
   per plagg, eller bedre: lagre på `garments[key].layout`.
7. **Cap-posisjon via gjennomsnitts-Y av items som peker på cap** — gir naturlig
   gruppering uten å trenge gruppe-divider.
8. **Connector re-tegnes ved swap** — `relayoutConnectors()` etter `swapTo()`.
9. **Sheet identisk med V1/V2** — gjenbruk komponenten.
10. **Pulse-ring + swap-flash via Reanimated** — som V1.
11. **A11y** — connector-svg har `aria-hidden="true"`; rail-caps er decorative.
    Lag-info kommuniseres via sheet og plagg-aria-label.
12. **prefers-reduced-motion** — disable connector re-draw under swap (hopp direkte
    til ny posisjon) når brukeren har dette satt.

### Manglende assets
Samme 11 assets som V1/V2. **Total: ~33 NOK.**

### Estimert tid for prod-port
- React Native komponenter (Stack, Rail, ConnectorSvg, AnchorDot, Sheet): **2.5 timer AI-tid**
- ResizeObserver-equivalent (onLayout-orkestrering): **1 time AI-tid**
- Asset-generering (samme 11 som V1): **45 min klokketid**
- OKLCH delta-E verifisering via color-expert + justering: **30 min AI-tid**
- Sheet + connector-re-draw-på-swap: **30 min AI-tid**
- A11y + reduced-motion edge-case: **45 min AI-tid**
- **Total: ~5.5 timer (lengst — mest kompleksitet i layout-orkestrering)**

---

## Anbefaling

Hvis Sivert vil:

- **Maksimere ship-hastighet og skalerbarhet** → **V2 (Liste)**. Høyest skill-snitt (83.0),
  raskeste port (~4 timer), skalerer trivielt fra 3 til 7+ lag. Tap: mister noe av
  Klemegs emosjonelle "kledd-på-Liv"-signatur.

- **Maksimere merke-signatur** → **V1 (Anatomisk ro)**. Beholder anatomi-metaforen som
  er Klemegs identitet, men dropper all støy /impeccable og /emil-design-eng flagget.
  Mellomvei på alle akser.

- **Maksimere informasjonstetthet for power-users** → **V3 (Stack+rail)**. Mest
  pedagogisk korrekt (rail viser eksplisitt hvilket lag plagget tilhører), men
  lengst port og krever brukeren å lære rail-konseptet.

**Min faglige vurdering** (sett fra de 6 skill-perspektivene): start med **V2** for
v1.0, og introduser **V1**-stack-illustrasjonen som senere "se hele antrekket"-modus
hvis brukerne savner den anatomiske metaforen. V3 er for ambisiøst som første port —
trolig power-user-fane senere.

---

## Filer

| Fil | Sti |
|---|---|
| V1 mock | `wool-app/public/paakledning-loop/final/v1/index.html` |
| V2 mock | `wool-app/public/paakledning-loop/final/v2/index.html` |
| V3 mock | `wool-app/public/paakledning-loop/final/v3/index.html` |
| Sammenligning | `wool-app/public/paakledning-loop/final/index.html` |
| Iter-1 | `wool-app/public/paakledning-loop/iter-1/index.html` |
| Iter-2 | `wool-app/public/paakledning-loop/iter-2/index.html` |
| Iter-3 | `wool-app/public/paakledning-loop/iter-3/index.html` |
| Denne rapporten | `wool-app/docs/paakledning-loop/SLUTTRAPPORT.md` |
