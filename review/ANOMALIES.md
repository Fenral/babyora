# wool-layers anomalier

Liste over input/output-kombinasjoner som virker urimelige men ikke
er endret uten menneskebeslutning. Per P3 fra Fable 5-prompten skal
ALDRI numeriske terskler endres autonomt.

## Format

```
### A-{nr} — kort tittel

**Input:**
- temp: ...
- vind: ...
- ...

**Output:**
- ...

**Hvorfor virker det feil:**
- ...

**Foreslått terskelendring:**
- ...

**Status:** open / accepted / rejected
```

## Eksisterende anomalier

### A-1 — Guide-kalkulator 5°C + frisk vind + yr → 4 lag + vinterkjøredress (rapportert i Fable 5)

**Input:**
- tempC: 5
- feelsLikeC: 3
- windMs: 6
- precipMmH: 0.5 (yr)
- activity: vogn-våken
- alder: 14 mnd

**Output:**
- Kjøredress eller vinterkjøredress + 4 lag

**Hvorfor virker det feil:**
De fleste foreldre vil oppfatte +5° (føles 3°) med frisk vind og yr
som «kjøredress + en god under», ikke vinterdress-ekvivalent. Mock
4-lag-anbefaling matcher ikke norske foreldres erfaring.

**Foreslått tiltak:**
- Verifisere via review/MATRIX.md (kjør `node scripts/matrix.mjs` etter
  TS-konversjon av motor-import — eller via vitest-bundle)
- Hvis bekreftet: vurdere terskel for kjølig→kald-band

**Status:** ACCEPTED — implementert 2026-06-12 per Sivert's «ja, alle»-godkjenning.

### B-17 Implementering (2026-06-12)

Sivert godkjente Fable's anbefaling. Endringer:

**`src/lib/wool-layers/tables.ts`** — kald-bånd (0-4° føles) byttet
vinter-grade yttertøy med mellomtykk:
- `vogn.kald.yttertoy`: `vinterkjøredress` → `kjøredress` (+ oppgradert varmepose til dun)
- `utelek.kald.yttertoy`: `vinterdress` → `dress`
- `baeresele.kald.yttertoy`: allerede `lett kjøredress` (urørt)

Frost-bånd (-7 til 0°) og kaldere beholder vinter-grade yttertøy.
Vinterkjøredress isolert / vinterdress isolert kun ved streng_frost/ekstrem.

**`src/lib/wool-layers/__tests__/guardrails.test.ts`** — 2 nye tester:
- «ingen vinter-yttertøy ved føles +1° til +4° (kald-bånd)» loop over [1,2,3,4]°
- «A-1 anomali: vogn-våken +3° føles + frisk vind + yr → ingen vinterkjøredress»

**`review/MATRIX.md`** — regenerert (363 linjer) med nye anbefalinger.

Status: **ACCEPTED + IMPLEMENTERT**. 61 tester grønne (var 59).

### Sovepose-modell (FASE 3, 2026-06-13)

**Beslutning:** sovepose hører hjemme i kategorien `ekstra` (ikke i ny
`utstyr`-kategori), per nåværende baseTable[soevn] og vogn-sleeping-mode.

**Begrunnelse:**
- Sovepose ER på barnet (gå inn i posen), i motsetning til regntrekk
  (på vognen) eller vognpose (under barnet). Konseptuelt = «klær».
- baseTable[soevn] returnerer sovepose 0.5/1.0/2.5/3.5 TOG via `ekstra`-
  layer. Endring ville krevd å oppdatere hele soevn-baseTable + vogn-
  sleeping-mode + 4 garment-info-bilder + a lot tests.
- «Avatar viser aldri sovepose» — håndteres av `avatarTier`-helperen
  (tier beregnes fra ytterste KLESPLAGG, ikke `ekstra`/`utstyr`).

**Konsekvens for «I vogna»-rad-spec i SAMLET-arbeidsordre §1.6:**
«I vogna»-raden viser items fra `ekstra` med sovepose-match + utstyr-
items. Raden filtrerer mot regex `/sovepose/i` på `ekstra.items` +
hele `utstyr.items`-lista.

### Topp-til-tå-mapping (FASE 3, 2026-06-13)

**Implementert:** `src/lib/garments/topp-til-taa.ts` med 4 slots
(hode/hender/hals/fotter) basert på regex-mønster. 19 tester
verifiserer at varmepose/saueskinn/ansiktskrem IKKE er topp-til-tå
(de hører i ekstra-laget eller utstyr).

### TOG 1.5 og 2.0 mangler i sovepose-katalogen (2026-06-14)

**Spørsmål fra Sivert via gallery-review:** Hvorfor mangler TOG 1.5 og 2.0?

**Status:** ACCEPTED + IMPLEMENTERT. Lagt til i katalogen via commit
`7971d7e` fra parallell-sesjon (merget til main 2026-06-14 i commit
`a3768b9`).

## Tom liste betyr ingen åpne anomalier.
