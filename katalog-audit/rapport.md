# Katalog-audit — bilde/navn-samsvar (2026-08-01)

Kilder gjennomgått (les-only):
- `public/plagg-katalog.json` — 60 katalog-ID-er, hver med egen `illustration`-URL og egen lokal fil i `public/illustrations/garments/<id>.png` (**60/60 filer finnes, 1:1 med id**).
- `src/lib/monter-assets.ts` — `GARMENT_ID_TO_SLUG`: id → én av 42 «Monter»-vitrine-PNG-er i `public/monter/` (kun brukt på Hjem-widgeten).
- `src/data/garment-illustrations.ts` — `MAP`: rå database-streng (fra `wool-layers/tables.ts`) → katalog-id, samt `dbStringFor()` (id → første rå db-streng, brukt som «lesbart navn» i Plaggbiblioteket/Min garderobe).

Metode: bygde id-lister programmatisk fra alle tre filene, diffet dem mot hverandre, og åpnet PNG-ene med Read for de mistenkelige koblingene for å bekrefte visuelt.

---

## 1. Bekreftede mismatch (bilde ≠ anbefaling)

### 1a. HØY — `tøffel-sko + tykke ullsokker` → viser bare sokk (den rapporterte saken)
**Fil:** `src/data/garment-illustrations.ts`, linje 31
```js
'tøffel-sko + tykke ullsokker': 'ullsokker',
```
Visuelt bekreftet: `ullsokker.png` er en ren sokk (ingen såle/sko). `toffel-sko.png` er en tydelig tøffel-sko med borrelås og såle. Den sammensatte anbefalingen «tøffel-sko + tykke ullsokker» mister dermed skoen helt i UI — akkurat det den eksterne reviewen meldte.

Enda viktigere: dette er internt inkonsekvent med katalogen selv. `plagg-katalog.json` (id `toffel-sko`, linje 427) lister **den nøyaktig samme strengen** som sin egen alias:
```json
"aliases": ["tøffel-sko", "tøffel-sko + tykke ullsokker"]
```
Koden i `garment-illustrations.ts` omdirigerer altså denne strengen til et *annet* id enn katalogen selv sier den hører til.

**Forslag til fix:** endre linje 31 til
```js
'tøffel-sko + tykke ullsokker': 'toffel-sko',
```

### 1b. HØY — `kjoredress` → viser dunjakke i stedet for kjøredress
**Fil:** `src/lib/monter-assets.ts`, `GARMENT_ID_TO_SLUG`
```js
'kjoredress': 'dunjakke',
```
Visuelt bekreftet: katalogens egen kanoniske illustrasjon (`public/illustrations/garments/kjoredress.png`) viser en heldekkende, hette-forsynt endelig **heldress** (torso + ben + hette, glidelås). `plagg-dunjakke.png` viser en separat **jakke uten bein** (stopper i midjen). Dette er to strukturelt ulike plaggtyper — en forelder som ser Monter-vitrinen for «kjøredress» får en jakke å forholde seg til, ikke en heldress til vogna.

Modulen sier selv i toppkommentaren at prinsippet er «heller ingen bilde enn feil bilde» — denne koblingen bryter modulens eget prinsipp.

**Forslag til fix:** sett til `null` (fjern linjen fra `GARMENT_ID_TO_SLUG`) inntil et egnet bilde finnes, ev. gjenbruk `vinterdress`-silhuetten (samme mønster som allerede brukes for `vinterkjoredress`/`vinterkjoredress-isolert`) hvis det visuelt aksepteres som «nærmeste heldress».

### 1c. HØY — `ullsett-tynt` → viser en-delt strikke-kjeledress i stedet for to-delt sett
**Fil:** `src/lib/monter-assets.ts`
```js
'ullsett-tynt': 'ullkjeledress',
```
Visuelt bekreftet: katalogens kanoniske bilde (`ullsett-tynt.png`) viser en **to-delt** genser+bukse-kombinasjon i myk (ikke strikket) tekstil. `plagg-ullkjeledress.png` viser en **en-delt**, ermeløs strikket kjeledress med knapper i skulderen. Ulik snitt (en-del vs. to-deler) og ulik strikkestruktur/materialfølelse.

**Forslag til fix:** sett til `null` — ingen av de 42 Monter-bildene er et trygt treff for et to-delt sett.

### 1d. MEDIUM — `lue` → viser kyse (knyte-lue) i stedet for vanlig pull-over-lue
**Fil:** `src/lib/monter-assets.ts`
```js
'lue': 'kyse',
```
Visuelt bekreftet: `plagg-kyse.png` er en tradisjonell strikket **kyse** med hakestropper/dusker — en egen luetype, typisk for spedbarn. Katalogteksten for `lue` sier eksplisitt «Standard strikket lue som dekker ørene» (pull-over, ingen stropper nevnt). Søsken-id-ene `lue-tynn`→`tynn-lue` og `lue-m-ull`→`lue-med-ull` er begge selv-match (samme navn) — kun grunn-`lue` bruker et annet luekonsept.

**Forslag til fix:** sett til `null` (ingen av de 42 bildene er en ren pull-over-lue).

### 1e. LAV/mykt funn — `tynn-ull-mellomlag` → fleecejakke i stedet for strikket ull
**Fil:** `src/lib/monter-assets.ts`
```js
'tynn-ull-mellomlag': 'fleecejakke',
```
Katalogens eget bilde (`tynn-ull-mellomlag.png`) viser en strikket knappe-cardigan, ikke en fleece-plysj-jakke med glidelås som `plagg-fleecejakke.png`. Siden appen er ull-spesifikk (kilde: wool-app), er materialforveksling (ull vs. fleece) en reell tillits-risiko selv om formen («jakke som mellomlag») stemmer noenlunde. Lavere prioritet enn 1a–1d fordi kategorien fortsatt er riktig (mellomlag-jakke), bare materialet er feil signalisert.

---

## 2. Datakvalitet i selve katalogen

### 2a. Sannsynlig skrivefeil: «Sauekinn» → skal være «Saueskinn»
`plagg-katalog.json`, id `sauekinn-i-vogn`:
```json
"label": "Sauekinn (lammeskinn)",
"aliases": ["sauekinn i vogn"]
```
Korrekt norsk er «saueskinn» (sau + skinn = sheepskin). «Sauekinn» gir ikke mening. Interessant nok staver `garment-illustrations.ts` det riktig i sin egen MAP-nøkkel:
```js
'saueskinn i vogn': 'sauekinn-i-vogn',
```
De to filene er altså **uenige om stavemåten** på samme begrep — verdt å sjekke hvilken streng som faktisk ligger i den ekte databasen (`wool-layers/tables.ts`), ellers kan oppslag i praksis feile stille (returnere `null`) avhengig av hvilken streng som faktisk sendes inn.

Rettet i `display-names.json`: **«Saueskinn (lammeskinn)»**. ID-en selv (`sauekinn-i-vogn`) er IKKE endret her — det er en større, risikofylt endring som berører referanser i flere filer, og ligger utenfor dette read-only-oppdraget.

### 2b. Grammatikkfeil: «Tynn ull-mellomlag» → skal være «Tynt» (intetkjønn)
`plagg-katalog.json`, id `tynn-ull-mellomlag`:
```json
"label": "Tynn ull-mellomlag"
```
«et mellomlag» er intetkjønn → korrekt bøying er «tynt», ikke «tynn». Søsteren `ull-mellomlag-tykt` har allerede riktig bøying: **«Ull-mellomlag, tykt»**. `garment-illustrations.ts` sin egen db-streng bruker også korrekt form (`'tynt ull-mellomlag'`) — kun katalogens `label`-felt har feilen.

Rettet i `display-names.json` til **«Ull-mellomlag, tynt»** (speiler søskenformatet for konsistens).

---

## 3. Rotårsak til «rå katalognavn, små bokstaver»

`src/data/garment-illustrations.ts` har en funksjon `dbStringFor(id)` som returnerer **den første rå db-strengen** som peker til en id, og kommentaren over sier den brukes til å «vise lesbart navn» i Plaggbiblioteket/Min garderobe. Eksempel:
```js
dbStringFor('ullsett-tykt') // → "tykt ullsett"  (liten forbokstav, adjektiv først)
dbStringFor('sauekinn-i-vogn') // → "sauekinn i vogn"
```
Dette er nøyaktig mønsteret den eksterne reviewen pekte på («tykt ullsett», små bokstaver).

**`plagg-katalog.json` har allerede et pent formatert `label`-felt for alle 60 id-er** (f.eks. `"Ullsett, tykt"`) — problemet er at UI-et som viser «lesbart navn» ser ut til å bruke `dbStringFor()` (den rå streng-tabellen) i stedet for katalogens `label`/dette auditets `display-names.json`.

**Anbefaling:** Bytt ut kall til `dbStringFor(id)` i visningslag (Plaggbiblioteket, Min garderobe, GarmentDetailScreen) med et oppslag i `display-names.json` (eller `plagg-katalog.json`s `label`-felt, som nå er identisk med `display-names.json` bortsett fra de 2 rettelsene i §2). `dbStringFor()` kan fortsatt brukes internt der en rå db-streng faktisk trengs (f.eks. ved skriving til databasen), bare ikke i visningslaget.

---

## 4. Umappede ID-er (kun Monter-vitrinen — har fortsatt vanlig illustrasjon)

15 av 60 katalog-ID-er mangler `GARMENT_ID_TO_SLUG`-oppføring i `monter-assets.ts` og faller tilbake til en nøytral bokstav-plassholder i Monter-widgeten på Hjem. **Dette er dokumentert som bevisst** i modulens egen bunntekst-kommentar (ingen av de 42 Monter-bildene er et trygt visuelt treff), og alle 15 har fortsatt en helt normal, korrekt illustrasjon i `public/illustrations/garments/<id>.png` — de er IKKE uten bilde i resten av appen, kun i Monter-vitrinen:

```
to-ullsett, bleie, sko, sandaler, vintersko, vintersko-isolerte,
tynt-teppe, dunteppe, varmepose-lett, varmepose, varmepose-dun,
sauekinn-i-vogn, regntrekk, regnponcho-over-baeresele, ansiktskrem
```

---

## 5. Rent housekeeping (ikke haster)

`monter-assets.ts` sin `GARMENT_ID_TO_SLUG` har 2 nøkler som ikke lenger finnes som katalog-id (trolig rester fra en gang katalogen hadde flere TOG-trinn i sovepose-stigen):
```js
'sovepose-1-5-tog': 'sovepose',
'sovepose-2-0-tog': 'sovepose',
```
Ufarlig (uoppnåelig kode — `getGarmentImage()` kalles aldri med disse id-ene siden de ikke finnes i katalogen), men verdt å rydde bort ved neste anledning for å holde filen i sync med katalogen.

---

## Oppsummering

| # | Alvorlighet | Fil | Funn |
|---|---|---|---|
| 1a | Høy | garment-illustrations.ts:31 | «tøffel-sko + tykke ullsokker» → viser kun sokk, ikke sko (den rapporterte saken) |
| 1b | Høy | monter-assets.ts | `kjoredress` → viser dunjakke (feil plaggtype: jakke vs. heldress) |
| 1c | Høy | monter-assets.ts | `ullsett-tynt` → viser en-delt kjeledress (feil snitt: en-del vs. to-deler) |
| 1d | Medium | monter-assets.ts | `lue` → viser kyse (feil luetype: knyte-bonnet vs. pull-over) |
| 1e | Lav | monter-assets.ts | `tynn-ull-mellomlag` → viser fleecejakke (feil materiale-signal) |
| 2a | Datakvalitet | plagg-katalog.json | «Sauekinn» → skal være «Saueskinn» (+ stavesprik mot garment-illustrations.ts) |
| 2b | Datakvalitet | plagg-katalog.json | «Tynn ull-mellomlag» → skal være «Tynt» (intetkjønn-bøying) |
| 3 | Rotårsak | garment-illustrations.ts | `dbStringFor()` brukes trolig i visningslag → rå/liten-forbokstav-navn i UI |
| 4 | Info | monter-assets.ts | 15 id-er uten Monter-bilde (bevisst, har vanlig illustrasjon likevel) |
| 5 | Housekeeping | monter-assets.ts | 2 døde nøkler i GARMENT_ID_TO_SLUG |

Leveranse: `katalog-audit/display-names.json` (60/60 id → forslag til konsumentvennlig visningsnavn, 58 uendret fra katalogens eget `label`-felt + 2 rettelser fra §2).
