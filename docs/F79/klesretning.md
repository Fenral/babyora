# F79 Phase 3 — Klesretning: stil-valg for avatar + plagg + vær-ikoner

**Metode:** 4 stil-prøver generert via `scripts/f79-klesretning.mjs`
(gemini-3-pro-image, samme baby via avatar-A2-referanse, samme 3-lags
antrekk i Brevann-avledede farger: korall #D96B4A innerst, marigold
#D9962B mellom, dyp petrol #1E4750 ytterst).
💰 Kost: 4 × ~$0.134 ≈ 5,6 NOK.

**Dommer:** Fable 5 (hovedloop) direkte på bildene, kriterier fra
F79-planen: stil-koherens med Brevann + 3D-vær-ikoner, anatomi-egnethet
for layer-stack, særpreg.

## Prøvene

| Fil | Stil |
|---|---|
| `public/avatars/f79-poc/stil-a-strikk.png` | A — Skandinavisk strikk-realisme |
| `public/avatars/f79-poc/stil-b-clay.png` | B — Myk 3D clay-render |
| `public/avatars/f79-poc/stil-c-flat.png` | C — Flat vektor-illustrativ |
| `public/avatars/f79-poc/stil-d-akvarell.png` | D — Akvarell/organisk |

## Vurdering

### A — Strikk-realisme (runner-up)
+ Nydelig taktil tekstur (synlige masker), varm, lag leses tydelig
+ Ren anatomi, god kant-kvalitet for stacking
− «Nordisk bildebok» er et kjent register — moderat særpreg
− Matcher ikke 3D-render-ambisjonen for vær-ikonene (to render-språk)

### B — Myk 3D clay-render (VINNER)
+ **Samme render-språk som 3D-vær-ikonene** Sivert ønsker → ÉN samlet
  visuell verden (clay-baby + volumetriske clay-skyer/sol)
+ Høyest særpreg i baby-app-kategorien (Not Boring/Alan-klasse mascot)
+ Matte clay med topp-venstre-lys gir kontrollerbar lyssetting for
  layer-stack (alle overlays genereres med samme lysretning)
+ Marigold strikk-tekstur leses selv i clay — lag-fargene bærer
+ Premium-koherens med Brevann-signaturens «marigold-lykt mot petrol»
− Hodet leser litt «dukke-skallet» — Phase 4-basen skal få litt mer
  hår/varme i ansiktet
− Konsekvens: de 62 flate plagg-thumbs i popupen bør på sikt
  re-genereres i clay for full koherens (~62 × 1,4 NOK ≈ 90–140 NOK
  m/retries — flagges i beslutningspakken, IKKE gjort nå)

### C — Flat vektor
+ Skarpeste kanter (teknisk best for stacking), nærmest dagens thumbs
− Lavest særpreg — generisk cartoon-outline, gjettbar fra kategorien
− Kolliderer med 3D-ambisjonen

### D — Akvarell
+ Mest håndlaget/menneskelig følelse
− Bløende kanter = synlige sømmer når lag stables — teknisk dårligst
  for layer-stack-metoden
− Risiko for å vaskes ut mot drenched turkis canvas

## Beslutning

**B — Myk 3D clay-render** låses som stil-univers for: avatar-base,
plagg-overlays (layer-stack), 3D-vær-ikoner. A beholdes som
dokumentert alternativ hvis Sivert overprøver i beslutningspakken.

## Konsekvenser for Phase 4 (PoC)

1. Base-baby genereres i clay-stil med stil-b som stil-referanse,
   kun bleie/inner-tilstand, MER hår + varme enn stil-b-prøven
2. Plagg-overlays genereres med base-bildet som posisjons-referanse:
   «kun plagget, formet som om det sitter PÅ denne babyen, transparent
   ellers» — anatomi-fiksen
3. Vær-ikon (klarvær): volumetrisk clay-sol i marigold (reservert
   sol-aksent per farge-analysen) + off-white sky-varianter senere
4. Alle genereres med samme topp-venstre-lys for stack-koherens
