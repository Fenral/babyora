# Babyora — Regelverk for fagavstemning

Generert: 2026-06-10
Mål: pediatri-/helsesøster-ekspert kan verifisere at engine-anbefalingene stemmer med klinisk praksis.

## Sjekklist-format

For hver regel/tabell-rad: ✅ Klinisk korrekt   ⚠️ Tvilsom   ❌ Feil
Kommentar-felt for å notere endringsforslag.

---

## Kilde-koder
- **AAP-2022** = AAP — Safe Sleep Practices (2022) ([lenke](https://publications.aap.org/pediatrics/article/150/1/e2022057990))
- **AAP-HC** = AAP HealthyChildren ([lenke](https://www.healthychildren.org))
- **NHS** = NHS UK — Reduce SIDS ([lenke](https://www.nhs.uk/conditions/baby/caring-for-a-newborn/reduce-the-risk-of-sudden-infant-death-syndrome/))
- **LT-RT** = Lullaby Trust — Room temperature ([lenke](https://www.lullabytrust.org.uk/safer-sleep-advice/room-temperature/))
- **LT-TOG** = Lullaby Trust — TOG-guide ([lenke](https://www.lullabytrust.org.uk/safer-sleep-advice/room-temperature/))
- **LT-PRAM** = Lullaby Trust — Don't cover the pram ([lenke](https://www.lullabytrust.org.uk/never-cover-pram))
- **RN-AU** = Red Nose Australia — Safe sleeping ([lenke](https://rednose.org.au/section/safe-sleeping))
- **RN-WRAP** = Red Nose Australia — Wrapping ([lenke](https://rednose.org.au/article/wrapping-babies))
- **CDC-NICHD** = CDC Safe to Sleep ([lenke](https://safetosleep.nichd.nih.gov))
- **ASTM-2024** = ASTM F3633 — weighted sleep ban ([lenke](https://www.cpsc.gov))
- **NHTSA** = NHTSA — Car seats ([lenke](https://www.nhtsa.gov/road-safety/car-seats-and-booster-seats))
- **Pediatrics-Pram** = Pediatrics — pram heat-trap study ([lenke](https://www.lullabytrust.org.uk/never-cover-pram))
- **IHDI** = International Hip Dysplasia Institute ([lenke](https://hipdysplasia.org))
- **POLICY** = Babyora produktpolicy (begrunnet) 
---

## 1. Temperaturbånd

Engine klassifiserer føles-som-temperatur (eller romtemp for søvn) til 9 bånd.

| Bånd | Range |
|---|---|
| **Ekstrem varme** (`ekstrem_varme`) | ≥ 28 °C |
| **Tropisk** (`tropisk`) | 22–27 °C |
| **Varm** (`varm`) | 16–21 °C |
| **Mild** (`mild`) | 10–15 °C |
| **Kjølig** (`kjolig`) | 5–9 °C |
| **Kald** (`kald`) | 0–4 °C |
| **Frost** (`frost`) | −7 til −1 °C |
| **Streng frost** (`streng_frost`) | −15 til −8 °C |
| **Ekstrem kulde** (`ekstrem`) | < −15 °C |

---

## 2. Base-tabell per aktivitet × bånd

Hver aktivitet har 9 temp-bånd. Tabell viser plagg per lag-kategori.

### Vogn

*Ute, foreldre triller — barnet ligger/sitter rolig.*

| Bånd | Innerst | Mellomlag | Yttertøy | Ekstra | Sjekk |
|---|---|---|---|---|---|
| **Ekstrem varme** | kortermet body | — | — | solhatt | ☐ ☐ ☐ |
| **Tropisk** | kortermet ullbody | — | — | solhatt, tynt teppe | ☐ ☐ ☐ |
| **Varm** | langermet ullbody tynn | tynn bukse | — | lue tynn | ☐ ☐ ☐ |
| **Mild** | ullsett tynt | tynn ull-mellomlag | lett kjøredress | lue tynn, varmepose lett | ☐ ☐ ☐ |
| **Kjølig** | ullsett tynt | ull-mellomlag | kjøredress | lue, votter tynne, varmepose | ☐ ☐ ☐ |
| **Kald** | ullsett tykt | ull-mellomlag | vinterkjøredress | lue, votter, varmepose, saueskinn i vogn | ☐ ☐ ☐ |
| **Frost** | ullsett tykt, ullstrømper | ull-mellomlag, ull-jakke | vinterkjøredress | lue m/ ull, votter tykke, hals, varmepose dun, saueskinn i vogn | ☐ ☐ ☐ |
| **Streng frost** | to ullsett oppå hverandre, ullstrømper tykke | ull-jakke, ull-bukse | vinterkjøredress isolert | balaklava, votter dun, varmepose dun, saueskinn i vogn, ansiktskrem | ☐ ☐ ☐ |
| **Ekstrem kulde** | to ullsett oppå hverandre, ullstrømper tykke | ull-jakke, ull-bukse | vinterkjøredress isolert | balaklava, votter dun, varmepose dun, saueskinn i vogn, ansiktskrem | ☐ ☐ ☐ |

### Bæresele

*Ute, foreldre bærer barnet inntil seg.*

| Bånd | Innerst | Mellomlag | Yttertøy | Ekstra | Sjekk |
|---|---|---|---|---|---|
| **Ekstrem varme** | kortermet body | — | — | solhatt | ☐ ☐ ☐ |
| **Tropisk** | kortermet ullbody | — | — | solhatt | ☐ ☐ ☐ |
| **Varm** | kortermet ullbody | tynn bukse | — | solhatt | ☐ ☐ ☐ |
| **Mild** | langermet ullbody | tynn bukse | — | lue tynn | ☐ ☐ ☐ |
| **Kjølig** | ullsett tynt | tynn ull-mellomlag | — | lue, tøffel-sko | ☐ ☐ ☐ |
| **Kald** | ullsett tynt | ull-mellomlag | lett kjøredress | lue, votter tynne | ☐ ☐ ☐ |
| **Frost** | ullsett tykt | ull-mellomlag | kjøredress | lue m/ ull, votter, hals | ☐ ☐ ☐ |
| **Streng frost** | ullsett tykt | ull-mellomlag, ull-jakke | vinterkjøredress | balaklava, votter tykke, hals | ☐ ☐ ☐ |
| **Ekstrem kulde** | to ullsett oppå hverandre | ull-jakke | vinterkjøredress isolert | balaklava, votter dun, hals, ansiktskrem | ☐ ☐ ☐ |

### Utelek

*Aktivt ute, barnet beveger seg.*

| Bånd | Innerst | Mellomlag | Yttertøy | Ekstra | Sjekk |
|---|---|---|---|---|---|
| **Ekstrem varme** | t-skjorte, shorts | — | — | solhatt, sandaler | ☐ ☐ ☐ |
| **Tropisk** | t-skjorte, shorts | — | — | solhatt, sandaler | ☐ ☐ ☐ |
| **Varm** | langermet ullbody tynn, lett bukse | — | — | caps eller solhatt, sko | ☐ ☐ ☐ |
| **Mild** | ullsett tynt | tynn ull-mellomlag | — | lue tynn, sko | ☐ ☐ ☐ |
| **Kjølig** | ullsett tynt | ull-jakke, ull-bukse | — | lue, sko, votter tynne | ☐ ☐ ☐ |
| **Kald** | ullsett tykt | ull-mellomlag | vinterdress | lue, votter, vintersko | ☐ ☐ ☐ |
| **Frost** | ullsett tykt | ull-mellomlag | vinterdress | lue m/ ull, votter tykke, hals, vintersko isolerte | ☐ ☐ ☐ |
| **Streng frost** | to ullsett oppå hverandre | ull-mellomlag tykt | vinterdress isolert | balaklava, votter tykke, hals, vintersko isolerte | ☐ ☐ ☐ |
| **Ekstrem kulde** | to ullsett oppå hverandre | ull-mellomlag tykt | vinterdress isolert | balaklava, votter dun, hals, vintersko isolerte, ansiktskrem | ☐ ☐ ☐ |

### Søvn

*Innendørs — feels-like tolkes som romtemperatur.*

| Bånd | Innerst | Mellomlag | Yttertøy | Ekstra | Sjekk |
|---|---|---|---|---|---|
| **Ekstrem varme** | bleie, lett kortermet body (valgfritt) | — | — | — | ☐ ☐ ☐ |
| **Tropisk** | kortermet body | — | — | sovepose 1.0 TOG | ☐ ☐ ☐ |
| **Varm** | langermet body | tynn pyjamas | — | sovepose 2.5 TOG | ☐ ☐ ☐ |
| **Mild** | langermet body | pyjamas | — | sovepose 2.5 TOG | ☐ ☐ ☐ |
| **Kjølig** | langermet body, ullsokker | pyjamas | — | sovepose 2.5 TOG | ☐ ☐ ☐ |
| **Kald** | langermet ullbody, ullsokker | ull-pyjamas | — | sovepose 3.5 TOG | ☐ ☐ ☐ |
| **Frost** | langermet ullbody, ullsokker | ull-pyjamas | — | sovepose 3.5 TOG | ☐ ☐ ☐ |
| **Streng frost** | langermet ullbody, ullsokker | ull-pyjamas | — | sovepose 3.5 TOG | ☐ ☐ ☐ |
| **Ekstrem kulde** | langermet ullbody, ullsokker | ull-pyjamas | — | sovepose 3.5 TOG | ☐ ☐ ☐ |

---

## 3. Modifier-regler (17 stk)

Regler som legger på toppen av base-tabellen.

### M-1 — Lett nedbør → regntrekk

- **Trigger:** precipMmH ≥ 0.5 mm/t
- **Effekt:** Legger til regntrekk (vogn) / regntøy (utelek) / regnponcho (bæresele)
- **Kilde:** [POLICY](#)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### M-2 — Kraftig nedbør

- **Trigger:** precipMmH ≥ 2 mm/t
- **Effekt:** Note: «høljer ned, kort tur eller overbygd»
- **Kilde:** [POLICY](#)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### M-3 — Lett yr

- **Trigger:** precipMmH 0.2–0.5 mm/t
- **Effekt:** Note: «lett yr, kalesjen holder»
- **Kilde:** [POLICY](#)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### M-4 — Vindtett skall (utelek)

- **Trigger:** windMs ≥ 5 + feels < 10°C + activity=utelek
- **Effekt:** Legger til vindtett skall i yttertøy
- **Kilde:** [POLICY](#)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### M-5 — Hals ved vind+kulde

- **Trigger:** windMs ≥ 5 + feels < 5°C
- **Effekt:** Legger til hals (ekstra)
- **Kilde:** [POLICY](#)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### M-6 — Hals ved sterk vind

- **Trigger:** windMs ≥ 8
- **Effekt:** Legger til hals uavhengig av temp
- **Kilde:** [POLICY](#)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### M-7 — Vindvotter

- **Trigger:** windMs ≥ 8 + feels < 0°C
- **Effekt:** Legger til vindvotter (skall)
- **Kilde:** [POLICY](#)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### M-8 — Friskt vind-note

- **Trigger:** windMs ≥ 10 (≥7 for <6 mnd)
- **Effekt:** Note: «det blåser friskt, hold turen kort»
- **Kilde:** [POLICY](#)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### M-9 — Ullsokker ved kjølig

- **Trigger:** feels ≤ 5°C
- **Effekt:** Legger til ullsokker (innerst)
- **Kilde:** [POLICY](#)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### M-10 — Fuktig kulde

- **Trigger:** humidity ≥ 80% + feels < 10°C
- **Effekt:** Note: «fuktig kulde føles kaldere»
- **Kilde:** [POLICY](#)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### M-11 — Universell kjenn-på-nakken

- **Trigger:** Alltid
- **Effekt:** Note: «kjenn på nakken med to fingre»
- **Kilde:** [NHS](https://www.nhs.uk/conditions/baby/caring-for-a-newborn/reduce-the-risk-of-sudden-infant-death-syndrome/), [LT-RT](https://www.lullabytrust.org.uk/safer-sleep-advice/room-temperature/)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### M-12 — Spedbarn termoregulering

- **Trigger:** ageMonths ≤ 3
- **Effekt:** Note + ekstra ull-lag ved <5°C; «maks 30 min ute ved <0°C»
- **Kilde:** [AAP-HC](https://www.healthychildren.org), [NHS](https://www.nhs.uk/conditions/baby/caring-for-a-newborn/reduce-the-risk-of-sudden-infant-death-syndrome/)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### M-13 — Vogn-tildekkings-warning

- **Trigger:** activity=vogn alltid
- **Effekt:** Note: «aldri teppe over kalesjen»
- **Kilde:** [LT-PRAM](https://www.lullabytrust.org.uk/never-cover-pram), [Pediatrics-Pram](https://www.lullabytrust.org.uk/never-cover-pram)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### M-14 — Sol + sol-symbol

- **Trigger:** symbolCode=sun/clearsky/fair/partlycloudy + feels ≥ 10°C
- **Effekt:** Sol-note (<6 mnd: «skygge», ≥6 mnd: «solhatt + solkrem»)
- **Kilde:** [AAP-HC](https://www.healthychildren.org)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### M-15 — Bilstol-vinterdress

- **Trigger:** Har vinterdress/vinterkjøredress
- **Effekt:** Note: «ta av tykke dressen i bilstolen»
- **Kilde:** [AAP-HC](https://www.healthychildren.org), [NHTSA](https://www.nhtsa.gov/road-safety/car-seats-and-booster-seats)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### M-16 — Peak overheating 7–9 mnd

- **Trigger:** ageMonths 7-9 + feels ≥ 22°C
- **Effekt:** Note + drop topmost insulation
- **Kilde:** [AAP-HC](https://www.healthychildren.org), [POLICY](#)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### M-17 — Fottøy-alders-justering

- **Trigger:** activity=utelek/baeresele + alder
- **Effekt:** <9 mnd: ingen sko, ullsokker; 9-15 mnd: tøffel-sko; 16+: vintersko
- **Kilde:** [POLICY](#)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

---

## 4. Hard blocks (HB-1..HB-9)

Engine SKAL håndheve — aldri overstyrbart.

### HB-1 — Ingen hodeplagg under søvn

- **Trigger:** activity=soevn AND has(hat)
- **Effekt:** BLOCK + fjern hodeplagg
- **Kilde:** [AAP-2022](https://publications.aap.org/pediatrics/article/150/1/e2022057990), [NHS](https://www.nhs.uk/conditions/baby/caring-for-a-newborn/reduce-the-risk-of-sudden-infant-death-syndrome/), [LT-RT](https://www.lullabytrust.org.uk/safer-sleep-advice/room-temperature/)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### HB-2 — Ingen tepper over sovepose

- **Trigger:** has(sovepose) AND has(teppe)
- **Effekt:** BLOCK + fjern teppe
- **Kilde:** [AAP-2022](https://publications.aap.org/pediatrics/article/150/1/e2022057990), [LT-TOG](https://www.lullabytrust.org.uk/safer-sleep-advice/room-temperature/), [RN-AU](https://rednose.org.au/section/safe-sleeping), [CDC-NICHD](https://safetosleep.nichd.nih.gov)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### HB-3 — Aldri flere soveposer

- **Trigger:** count(sovepose) > 1
- **Effekt:** BLOCK + dedupe
- **Kilde:** [LT-TOG](https://www.lullabytrust.org.uk/safer-sleep-advice/room-temperature/)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### HB-4 — Ingen vektede produkter

- **Trigger:** has(weighted/vektet)
- **Effekt:** BLOCK + fjern
- **Kilde:** [AAP-2022](https://publications.aap.org/pediatrics/article/150/1/e2022057990), [ASTM-2024](https://www.cpsc.gov)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### HB-5 — Ingen myke gjenstander i seng

- **Trigger:** activity=soevn AND has(pute/kosedyr/bumper)
- **Effekt:** BLOCK + fjern
- **Kilde:** [AAP-2022](https://publications.aap.org/pediatrics/article/150/1/e2022057990), [NHS](https://www.nhs.uk/conditions/baby/caring-for-a-newborn/reduce-the-risk-of-sudden-infant-death-syndrome/), [RN-AU](https://rednose.org.au/section/safe-sleeping), [CDC-NICHD](https://safetosleep.nichd.nih.gov)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### HB-6 — Stopp svøping når barnet kan rulle

- **Trigger:** has(svøp) AND (canRoll=true OR alder ≥ 4 mnd)
- **Effekt:** BLOCK + fjern svøp
- **Kilde:** [AAP-2022](https://publications.aap.org/pediatrics/article/150/1/e2022057990), [RN-WRAP](https://rednose.org.au/article/wrapping-babies)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### HB-7 — Hofte-trygg svøping

- **Trigger:** has(svøp)
- **Effekt:** Note: «armer løse, hofter løse, ansikt fritt»
- **Kilde:** [RN-WRAP](https://rednose.org.au/article/wrapping-babies), [IHDI](https://hipdysplasia.org)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### HB-8 — Aldri dekk vogn i varme

- **Trigger:** activity=vogn AND feels ≥ 22°C
- **Effekt:** BLOCK + fjern teppe-over-kalesje
- **Kilde:** [LT-PRAM](https://www.lullabytrust.org.uk/never-cover-pram), [Pediatrics-Pram](https://www.lullabytrust.org.uk/never-cover-pram)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### HB-9 — Aldri vinterdress i bilstol

- **Trigger:** context.bilstol=true AND has(vinterdress)
- **Effekt:** BLOCK + fjern vinterdress
- **Kilde:** [AAP-HC](https://www.healthychildren.org), [NHTSA](https://www.nhtsa.gov/road-safety/car-seats-and-booster-seats)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

---

## 5. Combination conflicts (CK-1..CK-9)

Konfliktgraf kjøres FØR safety. `evidence` = direkte medisinsk kilde; `policy` = produktpolicy.

### CK-1 — Sovepose × teppe *(evidence)*

- **Trigger:** has(sovepose) AND has(teppe)
- **Effekt:** Fjern teppe
- **Kilde:** [LT-TOG](https://www.lullabytrust.org.uk/safer-sleep-advice/room-temperature/), [AAP-2022](https://publications.aap.org/pediatrics/article/150/1/e2022057990)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### CK-2 — To soveposer *(evidence)*

- **Trigger:** count(sovepose) > 1
- **Effekt:** Dedupe (HB-3)
- **Kilde:** [LT-TOG](https://www.lullabytrust.org.uk/safer-sleep-advice/room-temperature/)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### CK-3 — TOG > maxForRoom *(evidence)*

- **Trigger:** activity=soevn AND sovepose-TOG > maxTOG(roomC)
- **Effekt:** Bytt til riktig TOG (eller fjern hvis room ≥ 26°C)
- **Kilde:** [LT-TOG](https://www.lullabytrust.org.uk/safer-sleep-advice/room-temperature/)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### CK-4 — Sovepose × hodeplagg innendørs *(evidence)*

- **Trigger:** activity=soevn AND has(sovepose) AND has(hodeplagg)
- **Effekt:** Fjern hodeplagg
- **Kilde:** [AAP-2022](https://publications.aap.org/pediatrics/article/150/1/e2022057990), [LT-RT](https://www.lullabytrust.org.uk/safer-sleep-advice/room-temperature/)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### CK-5 — Varmepose × dunteppe i vogn *(policy)*

- **Trigger:** activity=vogn AND has(varmepose) AND has(dunteppe)
- **Effekt:** Behold varmepose, fjern dunteppe (unntak: vognMode=awake AND feels<-5)
- **Kilde:** [LT-PRAM](https://www.lullabytrust.org.uk/never-cover-pram), [POLICY](#)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### CK-6 — 2-ullsett-grense *(policy)*

- **Trigger:** feels > -15°C AND has(to ullsett)
- **Effekt:** Bytt til ullsett tykt (kun ekstrem frost gir 2-stack)
- **Kilde:** [POLICY](#)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### CK-7 — Vinterdress × bilstol *(evidence)*

- **Trigger:** context.bilstol=true AND has(vinterdress)
- **Effekt:** BLOCK via HB-9
- **Kilde:** [AAP-HC](https://www.healthychildren.org), [NHTSA](https://www.nhtsa.gov/road-safety/car-seats-and-booster-seats)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### CK-8 — Høy TOG × pyjamas i mildt rom *(evidence)*

- **Trigger:** activity=soevn AND sovepose-TOG ≥ 2.5 AND roomC > 21°C AND has(pyjamas)
- **Effekt:** Bytt pyjamas til kortermet body
- **Kilde:** [LT-TOG](https://www.lullabytrust.org.uk/safer-sleep-advice/room-temperature/)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### CK-9 — Bæresele × innerJakke × barnejakke *(policy)*

- **Trigger:** activity=baeresele AND innerJakke=true AND has(barnejakke)
- **Effekt:** Fjern barnejakke
- **Kilde:** [RN-AU](https://rednose.org.au/section/safe-sleeping), [POLICY](#)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

---

## 6. Soft blocks (SB-1..SB-7)

Justeringer som reduserer lag eller flagger advarsler, ikke avvisning.

### SB-1 — TOG vs romtemp (justering)

- **Trigger:** sovepose-TOG > maxTOGforRoom
- **Effekt:** Dekkes av CK-3
- **Kilde:** [LT-TOG](https://www.lullabytrust.org.uk/safer-sleep-advice/room-temperature/)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### SB-2 — For mange lag

- **Trigger:** count(layers) > maxLayersForFeels
- **Effekt:** Fjern lavest-impact (dunteppe → varmepose lett → tynt teppe)
- **Kilde:** [POLICY](#)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### SB-3 — Varmt rom (≥24°C)

- **Trigger:** activity=soevn AND roomC ≥ 24°C
- **Effekt:** Tving kortermet body + 0.5 TOG. Ved ≥26°C: kun body/bleie
- **Kilde:** [LT-TOG](https://www.lullabytrust.org.uk/safer-sleep-advice/room-temperature/), [NHS](https://www.nhs.uk/conditions/baby/caring-for-a-newborn/reduce-the-risk-of-sudden-infant-death-syndrome/)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### SB-4 — Bæresele + innerJakke

- **Trigger:** activity=baeresele AND innerJakke=true
- **Effekt:** Fjern yttertøy, swap tykke til tynne mellomlag
- **Kilde:** [RN-AU](https://rednose.org.au/section/safe-sleeping), [POLICY](#)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### SB-5 — Peak overheating 7-9 mnd

- **Trigger:** ageMonths 7-9 + feels ≥ 22°C
- **Effekt:** Drop topmost insulation
- **Kilde:** [AAP-HC](https://www.healthychildren.org), [POLICY](#)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### SB-6 — Lang vognetur

- **Trigger:** activity=vogn AND feels ≥ 18°C AND exposureMin ≥ 60
- **Effekt:** Fjern varmepose lett + dunteppe + skygge-note
- **Kilde:** [LT-PRAM](https://www.lullabytrust.org.uk/never-cover-pram), [LT-RT](https://www.lullabytrust.org.uk/safer-sleep-advice/room-temperature/)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

### SB-7 — Spedbarn ekstrem hete

- **Trigger:** feels ≥ 28°C AND ageMonths < 6
- **Effekt:** Note: «maks 15 min uten skygge»
- **Kilde:** [AAP-HC](https://www.healthychildren.org)
- **Sjekk:** ☐ Korrekt   ☐ Tvilsom   ☐ Feil
- **Kommentar:** ___________________________

---

## 7. Plagg-katalog (60 plagg)

Komplett liste med visning av regel-trigger per plagg ligger på den visuelle siden:

**https://wool-app.vercel.app/fagavstemning.html**

Anbefalt format for ekspert-tilbakemelding:
- Print denne fila som PDF (Ctrl+P → Save as PDF)
- Marker sjekklister + skriv kommentar i marg
- Sjekk visuell side parallelt for konkrete plagg-eksempler
- Send tilbakemelding til **sivertskotvold@gmail.com**

---

*Generert av `scripts/generate-rules-docs.ts` — kjør `npm run generate:rules` for å oppdatere.*
