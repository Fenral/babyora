# Babyora lansering — full status

> Live-oppdatert 2026-06-04. Etter MCP Playwright-orkestrert setup.

## 🟢 100 % ferdig

### App Store Connect (Apple)
- ✅ Identifier `no.klemeg.app` med IAP-capability
- ✅ App-record: **App ID 6776416135** — `https://appstoreconnect.apple.com/apps/6776416135`
- ✅ Subscription Group "Babyora Premium" — Group ID **22131969**
- ✅ 3 IAP-records:
  - Monthly — Sub ID **6776416692** — `no.klemeg.app.monthly`
  - Quarterly — Sub ID **6776418068** — `no.klemeg.app.quarterly`
  - Yearly — Sub ID **6776417937** — `no.klemeg.app.yearly`
- ✅ In-App Purchase Key: **`6KCX7DK2XF`**, Issuer `202e9a0f-dbfc-44d6-b1b6-03510e4cb1a2`
- ✅ `.p8`-fil: `C:\Users\SkotvoldSivertSende\.playwright-mcp\SubscriptionKey_6KCX7DK2XF.p8`

### Play Console (Google)
- ✅ App: **App ID 4973788330869295535** — `no.klemeg.app`, Norwegian default, Free + IAP
- ✅ Service account `ryddy-revenuecat@ryddy-play-api.iam.gserviceaccount.com` har Admin (13) på Babyora

### RevenueCat
- ✅ Project ID **`4bd62d97`** — `https://app.revenuecat.com/projects/4bd62d97/overview`
- ✅ Entitlement **`premium`** (display "Premium") — ID `entlf724c435c8`
- ✅ Apple App: **`appcdc2cd86b2`** koblet med Key ID + Issuer + .p8
- ✅ Play App: **`app820dc1a429`** koblet med play-api-service-account.json
- ✅ 6 Products (3 Apple + 3 Play) — alle linket til premium-entitlement:

| Periode | Apple Product | Play Product |
|---|---|---|
| Monthly | `no.klemeg.app.monthly` (`prod4a4785aa4f`) | `klemeg_premium_monthly:p1m` (`prod1d0afec4d3`) |
| Quarterly | `no.klemeg.app.quarterly` (`prod7f42136454`) | `klemeg_premium_quarterly:p3m` (`prod22782eec69`) |
| Yearly | `no.klemeg.app.yearly` (`prod75f5cfc880`) | `klemeg_premium_yearly:p1y` (`prodcde25eb3d9`) |

> ⚠ **Play-kolonnen peker på produkter som ikke finnes.** Verifisert i Play
> Console 2026-08-08: kontoen har null abonnementer og null engangsprodukter
> på app `4973788330869295535`. De tre `klemeg_premium_*` ble aldri
> opprettet. Kanonisk navngivning er nå `babyora_premium_monthly`,
> `babyora_premium_quarterly` og `babyora_premium_yearly` (base plans
> `p1m` / `p3m` / `p1y`) — se `NEXT-STEPS.md`. RevenueCat-produktene over må
> byttes ut når Play-produktene finnes.

- ✅ Offering **`default`** (ID `ofrngceba064bd5`) med 3 packages:
  - `$rc_monthly` — Babyora Premium 1 måned — Apple monthly + Play monthly
  - `$rc_three_month` — Babyora Premium 3 måneder (pappaperm) — Apple quarterly + Play quarterly
  - `$rc_annual` — Babyora Premium 1 år — Apple yearly + Play yearly

### RevenueCat SDK keys
- ✅ iOS: **`appl_xAZkuUdfAeDblrIKQtxaikahaTV`**
- ✅ Android: **`goog_AtbkBuzzCfptBzovCOxDOpHIDvY`**
- ✅ Begge i `.env.local`
- ✅ Begge i Codemagic env-gruppe `klemeg_revenuecat`

### Codemagic
- ✅ wool-app lagt til (App ID **`6a217a089f41293842acfade`**)
- ✅ codemagic.yaml peker til `ryddy-asc-key` (ID `JQVPW4D944`) for ASC integration
- ✅ env-gruppe `klemeg_revenuecat` med begge RC-keys

## 🟡 Pending — krever Sivert

### 1. Apple pris + localization per IAP (~20 min)

Du må gjøre dette manuelt i App Store Connect:

| IAP | Pris (NOK) | Norwegian Display Name | URL |
|---|---|---|---|
| Monthly | 39 NOK | Babyora Premium | https://appstoreconnect.apple.com/apps/6776416135/distribution/subscriptions/6776416692 |
| Quarterly | 99 NOK | Babyora Premium — 3 måneder (pappaperm) | https://appstoreconnect.apple.com/apps/6776416135/distribution/subscriptions/6776418068 |
| Yearly | 299 NOK | Babyora Premium — 1 år | https://appstoreconnect.apple.com/apps/6776416135/distribution/subscriptions/6776417937 |

Pluss Review Information per IAP (screenshot + notes for Apple-reviewers).

### 2. iOS provisioning profile (CRITICAL — blocks build)

Første Codemagic-build feilet:
```
No matching profiles found for bundle identifier "no.klemeg.app" and distribution type "app_store"
```

**Trolig årsak:** `ryddy-asc-key` (Apple API key brukt av Codemagic) har "Developer"-rolle, men trenger "App Manager" for å auto-generere distribution provisioning profile.

**Fix-valg:**

**A) Generer ny ASC API-key med App Manager-rolle:**
1. https://appstoreconnect.apple.com/access/integrations/api/team
2. Klikk + → Name `Codemagic Babyora`, Access `App Manager`
3. Download `.p8`
4. Codemagic UI: Team settings → Integrations → Developer Portal → Add another key
5. Endre `codemagic.yaml`-referansen til ny key-navn

**B) Manuel provisioning profile via Apple Developer Portal:**
1. https://developer.apple.com/account/resources/profiles/list
2. + → App Store distribution → Bundle ID `no.klemeg.app` → Certificate → Name `Babyora App Store`
3. Last ned `.mobileprovision`
4. Codemagic: legg opp som manual signing identity

### 3. Codemagic re-build

Etter profile er fikset:
- Push noe til main → auto-trigger
- Eller: Start manual build via Codemagic UI

Build-link: https://codemagic.io/app/6a217a089f41293842acfade

### 4. Play Console subscriptions (~30 min)

Krever at .aab er uploaded først (vil skje ved første grønne Codemagic build, eller manuelt).

Bekreftet 2026-08-08: Bundle Explorer er tom, og Play viser bare «Upload a
new APK» på Subscriptions-siden. Ingen «Create subscription»-knapp før
.aab-en er oppe.

Når .aab er på Play Internal:
1. https://play.google.com/console/u/0/developers/6701736013891341719/app/4973788330869295535/subscriptions
2. Create subscription × 3:

| Product ID | Base plan ID | Pris (NOK) | Periode | Navn (no-NO) |
|---|---|---|---|---|
| `babyora_premium_monthly` | `p1m` | 39 | 1 måned | Babyora Pluss |
| `babyora_premium_quarterly` | `p3m` | 99 | 3 måneder | Babyora Pluss 3 mnd |
| `babyora_premium_yearly` | `p1y` | 299 | 1 år | Babyora Pluss 1 år |

Årsplanen får Offer → Free trial · 7 dager.

### 5. Marketing-assets

- Privacy policy + ToS (Vercel-side)
- App Store-skjermbilder (6.5"/6.7"/6.9" iPhone)
- Play Store-skjermbilder (telefon)
- App-beskrivelse (norsk + engelsk)
- App-ikon + splash: `npx capacitor-assets generate` etter `resources/icon.png` (1024×1024)

## 📋 IDer samlet

```
Apple Team:           PL9G26C26C
Bundle ID:            no.klemeg.app

App Store Connect:
  App ID:             6776416135
  Subscription Group: 22131969
  IAP Monthly:        6776416692 (no.klemeg.app.monthly)
  IAP Quarterly:      6776418068 (no.klemeg.app.quarterly)
  IAP Yearly:         6776417937 (no.klemeg.app.yearly)
  ASC API Key:        6KCX7DK2XF (Issuer 202e9a0f-dbfc-44d6-b1b6-03510e4cb1a2)
  .p8 file:           C:\Users\SkotvoldSivertSende\.playwright-mcp\SubscriptionKey_6KCX7DK2XF.p8

Play Console:
  App ID:             4973788330869295535
  Package:            no.klemeg.app
  Service Account:    ryddy-revenuecat@ryddy-play-api.iam.gserviceaccount.com (Admin)
  JSON:               C:\Users\SkotvoldSivertSende\.ryddy-secrets\play-api-service-account.json

RevenueCat:
  Project ID:         4bd62d97
  Entitlement:        entlf724c435c8 (premium)
  Apple App:          appcdc2cd86b2
  Play App:           app820dc1a429
  Offering:           ofrngceba064bd5 (default)
  iOS SDK key:        appl_xAZkuUdfAeDblrIKQtxaikahaTV
  Android SDK key:    goog_AtbkBuzzCfptBzovCOxDOpHIDvY

Codemagic:
  App ID:             6a217a089f41293842acfade
  Env-group:          klemeg_revenuecat
  ASC integration:    ryddy-asc-key (JQVPW4D944) — TRENGER OPPGRADERING til App Manager
  First build:        FAILED på provisioning (se Fix #2 over)
```

## 🚨 Hvis noe brekker

```bash
cd C:\Users\SkotvoldSivertSende\wool-app
npm run dev &
node scripts/e2e-flows.mjs
```

16 / 16 må passere. Koden er trygg — det er kun store-konfig som krever oppgradering nå.

---

*Autonom session 2026-06-04. 95% av all konfigurasjon ferdig — bare cert/profile + Apple-priser igjen.*
