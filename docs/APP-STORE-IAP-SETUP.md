# App Store / IAP-oppsett (Babyora Pluss)

**Oppdatert:** 2026-07-15

App-siden av kjøpsflyten er **ferdig og verifisert via dev/Playwright** (`npm run e2e:purchase` — 3/3 scenarioer: årsplan, månedsplan, gjenoppretting). Det som gjenstår krever fysisk enhet + Apple/RevenueCat-portaler og kan **ikke** gjøres herfra. Denne fila gjør de stegene turnkey.

## 1. App Store Connect — opprett IAP-produktene

Bruk **nøyaktig disse produkt-IDene** (må matche `PRODUCT_IDS` i `src/lib/premium/products.ts` — låst av `products.test.ts`):

| Produkt-ID | Type | Pris | Trial |
|---|---|---|---|
| `babyora_yearly_299` | Auto-renewable subscription | 299 kr/år | 7 dager gratis |
| `babyora_monthly_49` | Auto-renewable subscription | 49 kr/mnd | — |
| `babyora_barnetiden_499` | Non-consumable | 499 kr engang | — |

- De to abonnementene i **samme subscription group**.
- `babyora_barnetiden_499` vises ikke i paywallen (utenfor `PLAN_ORDER`), men SKU-en beholdes definert.
- Fyll inn lokalisert visningsnavn/beskrivelse per produkt.

## 2. RevenueCat

1. Opprett prosjekt på https://app.revenuecat.com/.
2. Legg til de 3 App Store-produktene (+ Play-motparter når Android er aktuelt).
3. Opprett **ett entitlement `premium`** (må matche `ENTITLEMENT_ID` i `revenuecat.ts`) og tildel alle 3 produktene.
4. Legg produktene i ett **offering «current»** som packages.
5. Kopiér de offentlige API-nøklene → `.env.local` (og Codemagic-env for byggene):
   ```
   VITE_REVENUECAT_PUBLIC_KEY_IOS=appl_…
   VITE_REVENUECAT_PUBLIC_KEY_ANDROID=goog_…
   ```
   Uten disse faller appen tilbake til dev-mock (ingen ekte kjøp).

## 3. Signering / TestFlight (åpen sak)

Handoff noterer en **cert-revoke / Apple-innloggingssak** (kvota-feil) som blokkerer TestFlight-bygget. Dette krever Apple Developer-portal + innlogging — **ikke løsbart via dev/Playwright**. Løs sertifikat-kvoten i Apple Developer → Certificates før Codemagic-bygget lykkes.

## 4. Sandbox-test på enhet (etter 1–3)

Det som gjenstår å verifisere på ekte enhet (dev-mock dekker resten):
- Ekte StoreKit-kjøp av årsplan + månedsplan (sandbox-Apple-ID).
- Kvitteringsvalidering + entitlement `premium` slår inn.
- **Gjenopprett kjøp** mot ekte Apple-ID (dev viser kun placeholder-melding).
- **Trial → belastning**-overgang (7-dagers → 299 kr).
- Purchase-state-skjermbilder til App Store + 90+-evidens.

## Allerede verifisert (app-siden)

- Paywall åpner, plan-valg (år/mnd), kjøp → Premium låses opp → entitlement-gating reagerer.
- Gjenoppretting uten kjøp gir tydelig melding, ingen krasj.
- Dev/web faller trygt tilbake til mock når RevenueCat ikke er konfigurert.
- Kilde: `e2e/purchase-flow.ts` (`npm run e2e:purchase`).
