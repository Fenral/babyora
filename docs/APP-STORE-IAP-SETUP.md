# App Store / IAP-status (Babyora Pluss)

**Oppdatert:** 2026-07-15

> **Rettelse:** en tidligere versjon av denne fila antok at IAP/RevenueCat måtte
> settes opp fra bunnen med `babyora_*`-produkt-IDer. Det var FEIL. Den
> faktiske, provisjonerte sannheten er `STATUS.md` (2026-06-04) — les den først.

## Allerede provisjonert (STATUS.md — ikke gjør på nytt)

- **Bundle:** `no.klemeg.app` (App ID `6776416135`). IKKE endre — provisioning-kontinuitet.
- **3 IAP-abonnementer** i App Store Connect: `no.klemeg.app.monthly` (39), `no.klemeg.app.quarterly` (99), `no.klemeg.app.yearly` (299), Subscription Group `22131969`.
- **RevenueCat** fullt satt opp: prosjekt `4bd62d97`, entitlement `premium`, 6 produkter (3 Apple + 3 Play) i offering `default`, SDK-nøkler i `.env.local` + Codemagic env-gruppe `klemeg_revenuecat`.
- **Codemagic** koblet (App ID `6a217a089f41293842acfade`).

## ⛔ To blokkere før TestFlight/kjøp virker

### 1. Provisioning-profil (blokkerer TestFlight-bygget)
ASC-API-nøkkelen `ryddy-asc-key` har rolle **Developer** — trenger **App Manager**
for å auto-generere distribution-profil. Fiks: `STATUS.md` #2 (ny ASC-nøkkel med
App Manager, eller manuell `.mobileprovision`). Så → push → grønt bygg → TestFlight.

### 2. Produkt-ID-mismatch (blokkerer ekte kjøp)
Koden (`src/lib/premium/products.ts`, F81-prising) bruker `babyora_yearly_299`,
`babyora_monthly_49`, `babyora_barnetiden_499` — men det provisjonerte er
`no.klemeg.app.monthly/quarterly/yearly`. Prismodellene er også ulike:

| | Kode (F81, 2026-07) | Provisjonert (juni) |
|---|---|---|
| mnd | 49 | 39 |
| kvartal | — | 99 (pappaperm) |
| år | 299 | 299 |
| engang | 499 «Barnetiden» | — |

`purchasePackage('babyora_yearly_299')` finner ingen match → **ekte kjøp feiler**.
Dev-mock-testen (`e2e:purchase`) hopper over RevenueCat og fanger ikke dette.

**Krever eierbeslutning:** hvilken prismodell er endelig?
- **A) Behold F81-koden (49/299/499):** oppdater App Store Connect + RevenueCat til
  `babyora_*`-IDer og ny prising (mer portal-arbeid, ny IAP-review).
- **B) Behold juni-provisjoneringen (39/99/299):** endre koden tilbake
  (`PRODUCT_IDS`, `PRODUCTS`, `PLAN_ORDER`, paywall-copy) til `no.klemeg.app.*`.
  Mindre portal-arbeid, men gir opp «Barnetiden»-engangskjøpet.

Når du har valgt, aligner jeg kode-siden deterministisk (products.ts + tester).

## Gjenstår ellers (STATUS.md)
- Apple-priser + localization per IAP (~20 min).
- Play Console-abonnementer (etter første .aab).
- Personvernerklæring publisert + App Privacy-skjema.

## Verifisert app-side (dev, uten enhet)
Kjøps*flyten* (UI → valg → «kjøp» → Premium → gating) er grønn i dev-mock
(`npm run e2e:purchase`, 3/3) — men den validerer IKKE produkt-ID-koblingen mot
RevenueCat (mocken bypasser den). Det krever enhet + løst mismatch (#2).
