# Babyora — Release-guide (pre-launch til App Store + Play Store)

Komplett steg-for-steg for å gå fra `npm run build` til levende app i begge butikker.

**Status iter 31:**
- ✓ Onboarding-flyt
- ✓ 3-dagers trial + paywall (e2e-verifisert, 16/16 tester)
- ✓ RevenueCat Capacitor-plugin installert + wrapper (`src/lib/billing/revenuecat.ts`)
- ✓ Capacitor iOS + Android-prosjekter synket
- ✓ Bundle ID: `no.klemeg.app`
- ✓ Apple Team ID: `PL9G26C26C`

**Hva som gjenstår (manuelt — kan ikke automatiseres):**

---

## 1. RevenueCat-konto + API-keys

1. Opprett konto på [app.revenuecat.com](https://app.revenuecat.com/)
2. Opprett ny app: "Babyora"
3. Velg "Public API Keys" → kopier:
   - iOS public key
   - Android public key
4. Lag `.env.local` i `wool-app/`:
   ```env
   VITE_REVENUECAT_PUBLIC_KEY_IOS=appl_xxxxxxxxxxxxxxxxxxxxx
   VITE_REVENUECAT_PUBLIC_KEY_ANDROID=goog_xxxxxxxxxxxxxxxxxxxxx
   ```
5. Test lokalt: `npm run build` → ingen TS-feil.

## 2. App Store Connect (iOS)

1. Logg inn på [App Store Connect](https://appstoreconnect.apple.com/)
2. **My Apps** → **+** → **New App**:
   - Platform: iOS
   - Name: Babyora
   - Primary Language: Norwegian
   - Bundle ID: **opprett** `no.klemeg.app` i [Identifiers](https://developer.apple.com/account/resources/identifiers/list) først hvis ikke finnes (Team `PL9G26C26C`)
   - SKU: `klemeg-ios-1`
3. **App Information**:
   - Category: Lifestyle / Health & Fitness
   - Content Rights: nei (eget innhold)
4. **In-App Purchases** → **+**:
   - Type: **Auto-Renewable Subscription**
   - Reference Name: `Babyora Premium 1 Month`
   - Product ID: `no.klemeg.app.monthly`
   - Subscription Group: "Babyora Premium" (opprett nytt)
   - Pris: **39 NOK** (Tier 9 — sjekk)
   - Subscription Duration: 1 måned
   - Localizations: norsk + engelsk
5. Gjenta for **3 måneder** og **1 år**:
   - `no.klemeg.app.quarterly` — 99 NOK — 3 måneder
   - `no.klemeg.app.yearly` — 299 NOK — 1 år
6. **Paid Apps Agreement** må være signert (banking/skatt-info)

## 3. Google Play Console (Android)

1. Logg inn på [Play Console](https://play.google.com/console/)
2. **All apps** → **Create app**:
   - App name: Babyora
   - Default language: Norsk
   - App or game: App
   - Free or paid: Free (med IAP)
3. **Set up your app**:
   - Content rating, target audience (0-3 år eller foreldre — foreldre)
   - Privacy policy URL (må opprette først — eks. på Vercel)
4. **Monetize** → **Subscriptions** → **Create subscription**:
   - Product ID: `klemeg_premium_monthly`
   - Subscription name: Babyora Premium (1 måned)
   - Base plan: monthly, 39 NOK
5. Gjenta:
   - `klemeg_premium_quarterly` — 99 NOK — 3 måneder
   - `klemeg_premium_yearly` — 299 NOK — 1 år

## 4. Koble products til RevenueCat

1. RevenueCat dashboard → **Products** → **+ New**:
   - Identifier: `monthly` → linker til iOS `no.klemeg.app.monthly` + Android `klemeg_premium_monthly`
   - Identifier: `quarterly` → linker til 3-måneds-produktene
   - Identifier: `yearly` → linker til års-produktene
2. **Entitlements** → **+ New** → ID: `premium`
3. Tildel alle 3 products til `premium`-entitlement
4. **Offerings** → opprett "default" og inkluder alle 3 packages
5. Kopier produkt-IDene tilbake til `src/data/pricing.ts` hvis du vil oppdatere visning

## 5. Xcode-bygg (krever Mac)

```bash
cd ~/wool-app
npx cap open ios
```

I Xcode:
1. **Signing & Capabilities**:
   - Team: `PL9G26C26C` (din Apple Developer team)
   - Bundle Identifier: `no.klemeg.app`
   - Capabilities: legg til **In-App Purchase**
2. **General**:
   - Display Name: Babyora
   - Version: 1.0.0
   - Build: 1
3. **Info.plist**:
   - `NSLocationWhenInUseUsageDescription` = "Babyora bruker posisjonen din for å hente lokalt vær."
4. App-ikon: dra inn 1024×1024 PNG (bruk `@capacitor/assets`)
5. Build → Archive → Distribute → App Store Connect (TestFlight først)

## 6. Android Studio-bygg

```bash
cd ~/wool-app
npx cap open android
```

I Android Studio:
1. **build.gradle (Module: app)**:
   - `applicationId "no.klemeg.app"`
   - `versionCode 1`, `versionName "1.0.0"`
   - `targetSdkVersion 34`, `minSdkVersion 23`
2. **AndroidManifest.xml** — sjekk at det er:
   ```xml
   <uses-permission android:name="android.permission.INTERNET" />
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
   <uses-permission android:name="com.android.vending.BILLING" />
   ```
3. App-ikon: legg i `android/app/src/main/res/mipmap-*/`
4. Build → Generate Signed Bundle / APK → AAB → upload til Play Console

## 7. App-ikon generering

Bruk `@capacitor/assets` (allerede installert):

```bash
# Plasser source-ikon i: wool-app/resources/icon.png (1024×1024 PNG)
# Plasser splash i: wool-app/resources/splash.png (2732×2732 PNG)

npx capacitor-assets generate
```

Det genererer alle størrelser for iOS + Android.

## 8. App Store + Play submission

1. **iOS:**
   - Xcode Archive → TestFlight (intern testing først, 1-2 dager)
   - App Store Connect → **Submit for Review** når testet
   - Apple-review tar typisk 24-48 timer
2. **Android:**
   - Play Console → Internal testing track → upload AAB
   - Test selv (1 dag)
   - Production track → submit (Google-review 1-3 timer)

## 9. Lansering-sjekkliste

- [ ] Privacy policy publisert (eks. https://klemeg.no/privacy)
- [ ] Terms of service publisert
- [ ] App-ikon godkjent (1024×1024 + alle størrelser)
- [ ] Skjermbilder for App Store (6.7" iPhone, 13" iPad valgfri)
- [ ] Skjermbilder for Play Store (telefon + 7" tablet + 10" tablet)
- [ ] App-beskrivelse (norsk + engelsk)
- [ ] Kategori valgt (Lifestyle / Health & Fitness)
- [ ] In-App Purchase godkjent i begge stores
- [ ] RevenueCat products synket og testet
- [ ] TestFlight intern testing fullført (minst 1 person)
- [ ] Sandbox-bruker testet kjøp på iOS
- [ ] Lisens-tekst i app: "Vær fra met.no" (synlig i Settings → Om appen)

## 10. iOS code signing i Codemagic (engangsoppsett)

TestFlight-bygg signeres med ÉT gjenbrukbart Apple Distribution-sertifikat.
Codemagic henter det via App Store Connect-API-et ved hjelp av privatnøkkelen
som hører til sertifikatet.

**Hvorfor dette oppsettet:** en tidligere variant genererte en fersk RSA-nøkkel
i hvert bygg. Ingen eksisterende sertifikat matcher en fersk nøkkel, så hvert
bygg ba Apple om et *nytt* Distribution-sertifikat. Apple tillater bare noen få
aktive om gangen og svarer til slutt med HTTP 409 ("already an active or pending
certificate request"), som blokkerer alle iOS-bygg.

**Engangsoppsett (gjøres i Codemagic UI — ikke i Git):**

1. Skaff PEM-privatnøkkelen til det Apple Distribution-sertifikatet Babyora skal
   bruke. Enten
   - eksporter det eksisterende sertifikatet som `.p12` fra nøkkelringen på Mac
     og hent ut nøkkelen, eller
   - revoker ett tydelig ubrukt sertifikat i Apple Developer → Certificates,
     opprett ett nytt, og ta vare på nøkkelen.
2. Opprett env-gruppen `klemeg_ios_signing` i Codemagic → Environment variables.
3. Legg inn `CERTIFICATE_PRIVATE_KEY` med PEM-innholdet, merket **secure**.

Nøkkelen skal aldri committes. Bygget feiler med en tydelig melding hvis
variabelen mangler, i stedet for å lage enda et sertifikat.

**Ved nytt 409:** steget «List existing distribution certificates» i bygget
skriver ut aktive sertifikater (kun offentlig metadata). Bruk den listen til å
se hvilke som kan gjenbrukes eller revokeres.

## Kontaktinfo

- **Teknisk:** Sivert Skotvold-Sende
- **Email:** sivertskotvold@gmail.com
- **GitHub:** [Fenral/wool-app](https://github.com/Fenral/wool-app)
- **Apple Team ID:** PL9G26C26C
- **Bundle ID:** no.klemeg.app
- **wool-layers npm-pakke:** lokal (ikke publisert)
