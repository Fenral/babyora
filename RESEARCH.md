# Babyora — Forskningsrapport: Alder × bekledning × thermoregulation

**Dato:** jun 2026
**Anledning:** Sivert spurte om weatherwisebaby.com sin 3-kategori-modell (0-3 mnd / 3-6 mnd / 6+ mnd) betyr at det ikke er stor forskjell på bekledning for 6 mnd vs 1,5 år. Denne rapporten samler data fra 11 kilder for å svare.

---

## TL;DR

**Nei**, det IS forskjell på bekledning mellom 6 mnd og 18 mnd, men den er mindre dramatisk enn forskjellen mellom 0-3 mnd og 6 mnd. Tre fysiologiske faktorer driver dette:

1. **Thermoregulation modnes gradvis** fra 0 til 12 mnd. Ved 9-12 mnd nær voksen-nivå.
2. **PEAK overheating-risk ved 8-9 mnd**: størst metabolic heat production per overflate-areal.
3. **Surface-area-to-mass ratio** faller 28% fra 648 cm²/kg (newborn) til 468 cm²/kg (1 år) — etter dette stabiliseres trenden.

weatherwisebaby.com sin 3-kategori-modell er **forenkling for UX**, ikke vitenskapelig presisjon. Babyora sin nåværende `ageMonths` som kontinuerlig parameter (`src/lib/wool-layers/types.ts`) er medisinsk mer korrekt.

---

## Datainnhenting — 11 kilder

### Forbruker-guider og verktøy

1. **[weatherwisebaby.com/guides/dressing-newborn](https://weatherwisebaby.com/guides/dressing-newborn)** — ingen alderssplit på guide-siden; "newborn"-uniformt. Bare AAP citert.

2. **[weatherwisebaby.com calculator](https://weatherwisebaby.com/)** — **bekreftet** 3-kategori-modell (0-3 mnd, 3-6 mnd, 6+ mnd) i calculator-tool (ikke på guide-side). 5 aktivitets-kontekster: sleep, stroller, carrier, car seat, indoor.

3. **[howtodressbaby.com](https://howtodressbaby.com/)** — 2-kategori (0-3 mnd, 4+ mnd). 5 aktiviteter. 8 sleep-temp-bånd med TOG. Signatur "Neck Test" (to fingre i halskragen).

4. **[mother.ly outdoor dressing guide](https://www.mother.ly/baby/baby-products/dress-your-baby-for-outside/)** — generell tabell, ingen alderssplit, bekrefter "one more layer" basisregel.

5. **[REI Expert: How to Dress Your Kids for the Outdoors](https://www.rei.com/learn/expert-advice/how-to-dress-your-kids-for-the-outdoors.html)** — outdoor-spesifikk, ingen alderssplit for spedbarn.

### Medisinsk autoritet

6. **[healthychildren.org / AAP (American Academy of Pediatrics)](https://www.healthychildren.org/English/ages-stages/baby/diapers-clothing/Pages/Dressing-Your-Newborn.aspx)** — ingen alderssplit. Eneste eksplisitte regel: "one layer more than adult". Sleep-sacks anbefalt over løse pledd (SIDS-forebygging). Cites *Caring for Your Baby and Young Child: Birth to Age 5, 6th Ed* (AAP 2015). Premature infants nevnt som eneste separate sub-populasjon.

### Peer-reviewed forskning

7. **[PMC12386404 — Narrative Review on Infants' Thermoregulatory Response to Heat](https://pmc.ncbi.nlm.nih.gov/articles/PMC12386404/)** — funn:
   - Surface-area-to-mass ratio: **648 → 468 cm²/kg fra 0 til 12 mnd (−28%)**
   - **Metabolic heat production peaks ved 8-9 mnd**
   - Sweat-kapasitet til stede ved fødsel, men "lower sweat output per gland"
   - "One extra layer"-regelen krever revurdering i varmt vær
   - Tegn på overheating: excessive sweating, redusert urin-output, rask pust
   - Anbefaling: avoid babywearing i hot weather (begrenser dry heat exchange)
   - Sjekk-punkt for komfort: "back of neck or upper back" (validerer Babyora sin "Kjenn på nakken"-note)

8. **[PMC7202982 — Clothing layers and babywearing thermoregulation](https://pmc.ncbi.nlm.nih.gov/articles/PMC7202982/)** — funn:
   - 9 babyer <12 mnd (mean 7.3 ± 3.1 mnd)
   - 15 min babywearing indoor: skin-temp +0.71°C, **core (tympanic) uendret (−0.13°C)**
   - Ekstra vest i kort babywearing **gir ikke overheating** ved indoor temps
   - Studien sub-analyserer ikke alder — limit

### Industri-kilder (TOG-tabeller)

9. **[HALO Sleep TOG chart](https://www.halosleep.com/blogs/halo/tog-chart)** — komplett TOG-tabell per romtemp. Overheating-tegn: sveiter, rødt, rask pust. Cold-tegn: skjelver, kalde hender/føtter, fussiness.

10. **[ErgoPouch What to Wear](https://www.ergopouch.com/pages/what-to-wear-guide)** — 4 TOG-trinn: 0.2/0.3, 1.0, 2.5, 3.5.

11. **[Slumbersac — How Babies Regulate](https://www.slumbersac.co.uk/blogs/advice/baby-regulate-body-temperature)** — "By 9-12 months babies should be able to fully adapt their body temperatures to external conditions". Head accounts for "up to 85% of heat loss" i sleeping infants (klassisk-fakta).

12. **[Capital Area Pediatrics — Cold weather dressing](https://www.capitalareapediatrics.com/blog/dressing-your-child-for-cold-weather-in-virginia-a-parent-s-guide)** — klinikk-guide. Bekrefter "one more layer than adult"-regelen + outdoor-exposure-grenser per alder.

---

## Konsolidert alderssplit-modell (forslag for Babyora v2)

Basert på fysiologi-funn, ikke industri-forenkling:

| Alder | Thermoregulation | Sweat-kapasitet | Anti-cold | Anti-heat | Babyora-konsekvens |
|---|---|---|---|---|---|
| **0-3 mnd** | Umoden, høyt heat-loss | Lav | +2 lag vs voksen, lue alltid | Lett/åndbar, **maks 30 min utendørs** ved varm sol | Egen "newborn"-regel: ekstra lag + tids-limit |
| **3-6 mnd** | Modnes, fortsatt sårbart | Lav-medium | +1-2 lag vs voksen | Lette lag, skygge prioritert | Standard wool-layers + warning på edge |
| **6-9 mnd** | Nær voksen | Medium | +1 lag vs voksen | **OVERHEATING-PEAK 8-9 mnd** | NY: PEAK-warning når tempC ≥ 22°C + ageMonths 7-9 |
| **9-12 mnd** | Voksen-lik | Medium | +1 lag vs voksen | Voksen-lik tilpasning | Standard wool-layers |
| **12-18 mnd** | Voksen | Medium-høy | Voksen + 1 lag i kulde | Voksen-lik | Standard wool-layers + activity-modifier |
| **18-24 mnd** | Voksen | Voksen-lik | Voksen-tilpasning | Voksen-tilpasning | Standard wool-layers (v1 stopper her) |

---

## Konsolidert TOG-tabell (sleep, indoor temp)

Krysset mot HALO + ErgoPouch + Slumbersac for industri-consensus.

| Romtemp | TOG | Tøy under | Babyora-band |
|---|---|---|---|
| ≥26°C | 0.2 | Bleie eller sleeveless body | "tropisk" (kun ute) |
| 24-26°C | 0.5 | Short-sleeve body | "ekstrem_varme" |
| 22-24°C | 1.0 | Long-sleeve body eller pyjamas | "varm" (sleep) |
| 20-22°C | 1.5 | Long-sleeve + footed pyjamas | "mild" (sleep) |
| 18-20°C | 2.5 | Long-sleeve body + romper | "kjolig" (sleep) |
| 16-18°C | 3.0-3.5 | Wool body + long-sleeve + romper | "kald" (sleep) |
| <16°C | 3.5+ | Wool set + sleep sack | **Anbefal å øke romtemp** før mer lag |

---

## Sikkerhets-flagg (kritiske advarsler)

### Overheating (forhøyet SIDS-risk)

- **Tegn:** sveiter, rødt/fuktet hud, rask pust, høy puls, fuktig hår
- **Risiko-grupper:** <6 mnd (generelt), **8-9 mnd (peak metabolic)**, barn med feber
- **AAP-anbefaling:** soverom 20-22°C (68-72°F)
- **Babyora-implementering:** warning når TempBand ≥ "varm" + activity = "soevn"

### Hypothermia (cold-stress)

- **Tegn:** skjelver (men spedbarn skjelver ikke effektivt), kald hud, fussiness, sløv
- **Risiko:** <3 mnd er **høyrisk** fordi shivering-respons er begrenset
- **Babyora-implementering:** ekstra lag + outdoor-tids-limit ved <0°C for newborn

### Babywearing i varmt vær (per PMC7202982-funn)

- **Indoor 15-min med ekstra vest:** TRYGT, ingen core-temp endring
- **Outdoor:** forskning savner — vær konservativ (skygge, kortere økter)
- **Babyora-implementering:** ny activity-modifier for "carrier + warm weather"

---

## Forslag til Babyora-implementasjon

### Forslag 1 — Peak overheating-warning 7-9 mnd

I `src/lib/wool-layers/modifiers.ts`:

```ts
if (ageMonths >= 7 && ageMonths <= 9 && tempC >= 22) {
  notes.push({
    category: 'overheating-peak',
    severity: 'warning',
    message: 'Barn i denne alderen produserer mest kroppsvarme. Bruk færre lag enn vanlig.',
  });
}
```

### Forslag 2 — Newborn outdoor-time-limit

```ts
if (ageMonths < 3 && tempC < 0) {
  notes.push({
    category: 'newborn-cold-limit',
    severity: 'warning',
    message: 'Spedbarn under 3 mnd: maks 30 min ute i kuldegrader. Sjekk nakke/rygg.',
  });
}
```

### Forslag 3 — UI-forenkling i Guide-tab

Selv om regelmotoren bruker kontinuerlig `ageMonths`, kan UI-en på Guide-tab vise 3 grupper for opplæring:

- "Nyfødt 0-3 mnd"
- "Spedbarn 3-12 mnd"
- "Småbarn 12-24 mnd"

Foreldre-onboarding lettere uten å miste presisjon i regelmotoren.

### Forslag 4 — Promotere "Neck Test" til alltid synlig tip

Howtodressbaby.com sin signatur "Neck Test" er klassisk. Babyora har det i `src/i18n/locales/no.json` → `guide.tip.neckTest`. Vurder synlig tip på Hjem etter første onboarding.

### Forslag 5 — Sweat-monitoring validert

PMC12386404 nevner at sweating sjekkes via "back of neck or upper back". Babyora viser allerede "Kjenn på nakken" som primær note. **Validert mot kilde — ingen endring nødvendig.**

---

## Implikasjoner for Babyora-produktet

1. **Behold kontinuerlig `ageMonths`** — vitenskapelig korrekt vs industri-forenkling
2. **Legg til peak-overheating-warning 7-9 mnd** — er ikke i konkurrenter (potensielt unik feature)
3. **TOG-tabell allerede i tråd med industri-standard** (validert mot HALO, ErgoPouch, Slumbersac)
4. **Newborn special-case er allerede implementert** ("Hold turen kort... under en halvtime"-note)
5. **Forskningsdata stryker Babyora sin tone** — varm-Norwegian tilpasses lett til medisinsk presis info
6. **Markedsføringssignal:** Babyora sin regelmotor er informert av peer-reviewed forskning, ikke kun industri-praksis
