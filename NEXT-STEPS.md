# Babyora — siste mil til lansering

> Du har Codemagic, Apple Developer-konto, Play Console (paid) og RevenueCat allerede.
> Dette er den korte versjonen — bare det som mangler.

## 1. RevenueCat-keys (10 min)

1. Logg inn på [app.revenuecat.com](https://app.revenuecat.com/)
2. Lag nytt prosjekt: **Babyora** (eller bruk eksisterende org → ny app)
3. App-fanen:
   - **+ Add app** → iOS → Bundle ID: `no.klemeg.app`
   - **+ Add app** → Android → Package: `no.klemeg.app`
4. **API Keys** → kopier:
   - iOS Public SDK Key → `appl_xxxxx`
   - Android Public SDK Key → `goog_xxxxx`
5. Lokalt: `cp .env.example .env.local` og lim inn keys
6. Codemagic: **Environment variables** → opprett gruppe **`klemeg_revenuecat`** med:
   - `VITE_REVENUECAT_PUBLIC_KEY_IOS`
   - `VITE_REVENUECAT_PUBLIC_KEY_ANDROID`

## 2. App Store Connect (30-45 min)

1. [App Store Connect](https://appstoreconnect.apple.com/) → **My Apps** → **+** → **New App**
2. Bundle ID: `no.klemeg.app` (må finnes i [Identifiers](https://developer.apple.com/account/resources/identifiers/list) — Team `PL9G26C26C`)
3. SKU: `klemeg-ios-1`
4. **Features** → **In-App Purchases** → **+** auto-renewable:

| Reference Name | Product ID | Pris | Varighet |
|---|---|---|---|
| Babyora Premium 1 mnd | `no.klemeg.app.monthly` | 39 NOK | 1 mnd |
| Babyora Premium 3 mnd | `no.klemeg.app.quarterly` | 99 NOK | 3 mnd |
| Babyora Premium 1 år | `no.klemeg.app.yearly` | 299 NOK | 1 år |

Subscription Group: **"Babyora Premium"** (samme for alle 3 — så bytte mellom dem fungerer)

5. Husk: norske + engelske localizations, både product display name og review-screenshot

## 3. Play Console (30-45 min)

1. [Play Console](https://play.google.com/console/) → **Create app**
2. Package: `no.klemeg.app`
3. **Monetize** → **Products** → **Subscriptions** → **+ Create subscription**:

| Product ID | Base plan | Pris | Periode |
|---|---|---|---|
| `klemeg_premium_monthly` | monthly | 39 NOK | 1 mnd |
| `klemeg_premium_quarterly` | quarterly | 99 NOK | 3 mnd |
| `klemeg_premium_yearly` | yearly | 299 NOK | 1 år |

## 4. RevenueCat → products kobling (10 min)

1. RevenueCat → **Products** → **+ New Product**:
   - `monthly` → link iOS `no.klemeg.app.monthly` + Android `klemeg_premium_monthly`
   - `quarterly` → link 3-måneds
   - `yearly` → link års
2. **Entitlements** → **+ New** → ID: **`premium`**
3. Tildel alle 3 products → entitlement `premium`
4. **Offerings** → opprett **`default`** med alle 3 packages

## 5. Codemagic-oppsett (15 min)

1. Codemagic dashboard → **Add app** → koble GitHub → **wool-app**
2. **Settings** → **Environment variables** → opprett gruppene:
   - **`klemeg_revenuecat`** → 2 keys (Steg 1)
   - **`google_play`** → service account JSON som `CM_GOOGLE_PLAY_KEY_JSON`
3. **Code signing**:
   - iOS: koble Apple Developer-konto → "Sivert Skotvold Sende API Key"-integrasjon (samme som Ryddy/StrikeArc)
   - Android: opprett **`klemeg_keystore`** (kan bruke samme som Ryddy hvis du vil — men anbefales eget for separasjon)
4. Trigge build: push til main eller manuelt **Start new build**

## 6. App-ikon + splash (20 min)

```bash
# Plasser source-filer:
# wool-app/resources/icon.png    (1024×1024)
# wool-app/resources/splash.png  (2732×2732)

npx capacitor-assets generate
```

Genererer alle størrelser for iOS + Android automatisk.

## 7. Manuelle ting Codemagic ikke gjør

- **Privacy policy + ToS** publisert (eks. på Vercel — egen liten side)
- **App Store-skjermbilder** (6.5"/6.7"/6.9" iPhone)
- **Play Store-skjermbilder** (telefon + 7" tablet + 10")
- **App-beskrivelse** (norsk + engelsk)
- **Test selv på TestFlight** (kjøpsflow med sandbox-bruker)
- **Submit til public release** (begge stores)

## Total tid (etter at infrastruktur er på plass)

- Konfigurasjon: 2-3 timer
- TestFlight-testing: 1-2 dager
- App Store review: 24-48 timer
- Play Store review: 1-3 timer

**Total fra "alt er klart" til "live i begge stores": ~3-5 dager.**

## Hvor finner du hva i koden

| Fil | Hva |
|---|---|
| `src/data/pricing.ts` | 3 plans + priser (juster her, ikke i UI) |
| `src/hooks/useAccess.ts` | Trial-logikk + RevenueCat-sjekk |
| `src/lib/billing/revenuecat.ts` | RevenueCat-wrapper (init / check / purchase / restore) |
| `src/screens/PaywallScreen.tsx` | UI for paywall (3 pris-kort, ANBEFALT-badge, logg-ut) |
| `src/screens/OnboardingScreen.tsx` | Første-gangs-flyt |
| `codemagic.yaml` | iOS + Android auto-bygg ved push til main |
| `capacitor.config.ts` | App ID + native scheme |

## Hvis noe brekker

E2E-test verifiserer at koden fungerer:

```bash
npm run dev &
node scripts/e2e-flows.mjs
```

16 / 16 må passere før commit. CI kjører dette automatisk på PR (workflow `web-preview`).
