# Eierfunn · faktisk provisjonering i App Store Connect og RevenueCat

**Observert:** 2026-08-14, ca. 11:35–11:45Z
**Metode:** Eier ga tilgang til å lese konsollene direkte i innlogget nettleser. Kun lesing — ingen felter endret, ingen knapper trykket utover navigasjon.
**Hvorfor dette finnes:** SN-003 kunne ikke avgjøres fordi ingen agent kan se inn i konsollene. Codex avviste dessuten `loop/notater/SN-005-kartlegging.md` som eierkilde fordi den var usporet. Denne filen er ment å være den versjonerte, siterbare kilden.

---

## 1. App Store Connect — app 6776416135 («Klemeg», bundle `no.klemeg.app`)

**Abonnementer** (`/distribution/subscription-groups/22131969`):

| Nivå | Referansenavn | Produkt-ID | Varighet | Status |
| --- | --- | --- | --- | --- |
| 1 | Babyora Pluss Årlig | `babyora_yearly_299` | 1 år | Prepare for Submission |
| 2 | Babyora Pluss Månedlig | `babyora_monthly_49` | 1 måned | Prepare for Submission |

- Gruppenavn: **«Babyora Pluss»**. Gruppe-ID **22131969** (matcher STATUS.md).
- Lokalisering: norsk. Visningsnavn gruppe «Babyora Pluss», appnavn «Babyora».
- Merknad i portalen: «Your first subscription group must be submitted with a new app version.»

**Engangskjøp** (`/distribution/iaps`):

| Referansenavn | Produkt-ID | Type | Status |
| --- | --- | --- | --- |
| Barnetiden | `babyora_barnetiden_499` | Non-Consumable | Prepare for Submission (kladd) |

**App-status:** iOS App 1.0 «Prepare for Submission». Versjonssiden har 0 skjermbilder og tom beskrivelse.

## 2. RevenueCat — prosjekt `4bd62d97` («Klemeg»)

**Produkter** (filter «All», ikke bare «Active»):

| App | Produkt | Entitlements | Opprettet | Status |
| --- | --- | --- | --- | --- |
| Klemeg iOS (App Store) | `babyora_barnetiden_499` | 1 | 3. juli 2026 | ⚠ Could not check |
| Klemeg iOS (App Store) | `babyora_monthly_49` | 1 | 3. juli 2026 | ⚠ Could not check |
| Klemeg iOS (App Store) | `babyora_yearly_299` | 1 | 3. juli 2026 | ⚠ Could not check |
| Klemeg Android (Play Store) | — ingen — | | | |
| Test Store | — ingen — | | | |

**Entitlements:** `premium` / «Premium», 3 produkter, opprettet 3. juni 2026.

## 3. Det sentrale funnet

**`no.klemeg.app.monthly`, `no.klemeg.app.quarterly` og `no.klemeg.app.yearly` finnes ikke.** Verken som aktive eller inaktive produkter i RevenueCat, verken under Subscriptions eller In-App Purchases i App Store Connect.

Det motsier `docs/DECISION-LOG.md:211-213`, som sier at nettopp disse er provisjonert, at `babyora_*` bare var et kodeforslag, og at et ekte kjøp feilet fordi `babyora_yearly_299` ikke fantes i RevenueCat.

Koden står i dag på den dokumenterte, men ikke-eksisterende varianten:

```
src/lib/premium/products.ts:24  yearly:    'no.klemeg.app.yearly'
src/lib/premium/products.ts:25  quarterly: 'no.klemeg.app.quarterly'
src/lib/premium/products.ts:26  monthly:   'no.klemeg.app.monthly'
```

**Konsekvens:** appen ber om produkt-ID-er som ikke finnes i butikken. Kjøp kan ikke fungere i denne tilstanden.

**Mest sannsynlige forklaring** (ANTAKELSE, ikke verifisert): beslutningen om å «beholde juni-provisjoneringen» ble tatt og koden endret, men konsollen ble aldri rullet tilbake fra juli-oppsettet. Dokumentet beskriver dermed en tilstand som var erstattet da det ble skrevet.

## 4. Konsekvens for loopens egne regler

`DOD-SNUDLY.md` C2 sier at `no.klemeg.app.monthly/quarterly/yearly` er «uforanderlige hos Apple» og aldri skal endres. Regelen verner om ID-er som ikke eksisterer, og vil underkjenne enhver retting av koden mot faktisk butikktilstand. C1 (bundle-id `no.klemeg.app`) er derimot **korrekt** — bundle-id-en stemmer.

SN-002 bekreftet at koden bruker `no.klemeg.app.*` og ble godkjent. Den verifiserte koden mot dokumentet, ikke mot butikken; det var innenfor oppgavens ordlyd.

## 5. Hva som IKKE er verifisert

- **Priser.** Tallene 49 / 299 / 499 er lest ut av produkt-ID-navnene, ikke fra prisfeltene i portalen.
- **Play Console.** Kun RevenueCats Play-side er sett (tom). Selve Play Console er ikke åpnet.
- **Historikk.** Om `no.klemeg.app.*` noen gang har eksistert og blitt fjernet, er ikke undersøkt.
- **Årsaken til «Could not check».** Kan skyldes manglende App Store Connect-nøkkel i RevenueCat, eller at produktene ikke er sendt til review. Ikke undersøkt.

## 6. Åpen eierbeslutning

Retningen er ikke valgt. To veier:

1. **Rett koden til `babyora_*`** — få linjer, gjør kjøp mulig, ingen portalarbeid. Krever at DoD C2 og `DECISION-LOG.md:211-213` rettes først, ellers underkjennes endringen.
2. **Bygg konsollen om til `no.klemeg.app.*`** — nye IAP-records og ny review hos Apple; kvartalsproduktet må da også opprettes.

Uansett valg må `DECISION-LOG.md:211-213` og DoD C2 korrigeres, og STATUS.md-avstemmingen (SN-003s erstatning) bygge på denne filen fremfor juni-dokumentasjonen.
