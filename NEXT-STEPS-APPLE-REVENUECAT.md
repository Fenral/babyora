# Babyora — neste steg for Apple Sign In + RevenueCat

Dette dokumentet beskriver konkrete steg Sivert må gjøre **manuelt** (krever Apple/RevenueCat-pålogging). Når disse er ferdige, kan jeg fortsette med kode-integrasjonen.

---

## 1. Apple Sign In (~15 min)

### Hva det er
- iOS-bruker logger inn med Face ID / Apple ID → ingen e-post/passord nødvendig
- Krav fra App Store hvis du tilbyr 3rd-party login (Google, Facebook etc.) — vi har ikke det, men det er en pluss for premium-app
- Krever Apple Developer Portal + iOS-test

### Steg 1.1 — Apple Developer Portal
1. Logg på https://developer.apple.com/account
2. Identifiers → Bundle ID `no.klemeg.app`
3. Klikk **Edit** (eller åpne)
4. Kryss av **Sign In with Apple** capability
5. **Save**

### Steg 1.2 — Service ID (krever bare ved web-flow)
- iOS-app trenger IKKE Service ID. Bare iOS-capability holder.
- Hvis du senere vil ha web-pålogging (wool-app.vercel.app), opprett Service ID separat.

### Steg 1.3 — App Store Connect-konfig
- Ingen ekstra steg her. Apple Sign In aktiveres automatisk når capability er på Bundle ID.

### Steg 1.4 — Si fra
Når 1.1 er gjort, si fra. Jeg installerer `@capacitor-community/apple-sign-in` og lager:
- Apple Sign In-knapp på OnboardingScreen (alternativ til navn/dob/sted)
- Signed-in-state i `useAccess`/`useChildren`
- Bruker-info (e-post, navn) persistert lokalt

---

## 2. RevenueCat IAP (~30 min)

### Hva det er
- 7-dagers trial → månedlig abonnement
- Apple håndterer betaling, vi får entitlement-status
- Krever IAP-produkter i ASC + RevenueCat-konfigurasjon

### Steg 2.1 — App Store Connect: IAP-produkter
1. Logg på https://appstoreconnect.apple.com → Apps → Babyora (Klemeg) → **Monetization** → **In-App Purchases**
2. Klikk **+** → **Auto-Renewable Subscription**
3. Lag **Subscription Group** først (f.eks. "Babyora Premium")
4. I gruppen, lag 3 produkter:

| Reference Name | Product ID | Duration | Price |
|---|---|---|---|
| Premium Monthly | `no.klemeg.app.premium.monthly` | 1 måned | 39 NOK |
| Premium Quarterly | `no.klemeg.app.premium.quarterly` | 3 måneder | 99 NOK |
| Premium Yearly | `no.klemeg.app.premium.yearly` | 1 år | 299 NOK |

5. For HVER produkt:
   - **Reference Name** (intern, ikke synlig)
   - **Product ID** (eksakt streng — må matche koden)
   - **Subscription Duration**
   - **Price** (39/99/299 NOK)
   - **Display Name** (det testere ser, f.eks. "Babyora Premium — 1 måned")
   - **Description** (1-2 setninger)
   - **Free Trial** (7 dager) — kun på MONTHLY (Apple-policy)
6. **Save** + **Submit for Review** (kommer i samme app-review som hovedappen)

### Steg 2.2 — App Store Connect API Key (for RevenueCat)
1. ASC → **Users and Access** → **Integrations** → **App Store Connect API**
2. **Keys**-fanen → **+ Generate API Key**
3. Name: `RevenueCat — Babyora` · Access: **App Manager**
4. Last ned `.p8`-filen (kan KUN lastes ned én gang)
5. Notér **Key ID** og **Issuer ID** (vises på siden)

### Steg 2.3 — RevenueCat
1. Logg på https://app.revenuecat.com
2. **+ Add new project** → "Babyora"
3. **Add iOS app**:
   - Bundle ID: `no.klemeg.app`
   - App Store Connect API:
     - Key ID (fra 2.2)
     - Issuer ID (fra 2.2)
     - .p8-fil (last opp)
4. **Products**-fanen → **Import from App Store Connect** → de 3 produktene fra 2.1 dukker opp
5. **Entitlements**-fanen → lag entitlement `premium` → koble alle 3 produkter til den
6. **Offerings**-fanen → lag offering `default` → 3 packages (monthly/quarterly/yearly)
7. **API Keys**-fanen → kopier **Public API key for iOS** (starter med `appl_...`)

### Steg 2.4 — Codemagic environment-variabel
1. Codemagic → wool-app → Settings → **Environment variables**
2. Add: `VITE_REVENUECAT_PUBLIC_KEY_IOS` = `appl_...` (fra 2.3)
3. Group: `klemeg_revenuecat` (allerede i codemagic.yaml)
4. **Save**
5. Neste build vil ha nøkkelen automatisk

### Steg 2.5 — Si fra
Når 2.1-2.4 er gjort, si fra. Jeg gjør:
- Wire `Purchases.configure({apiKey, appUserID})` i App.tsx ved mount
- Erstatt `useAccess()` localStorage-mock med ekte entitlement-check
- Koble PaywallSheet-CTA til `Purchases.purchaseStoreProduct(productId)`
- Restore-flow på Settings-skjerm

---

## 3. Beta App Info (5 min — kun hvis du vil external testere)

Ikke nødvendig før du vil invitere folk utenfor Developer Team.

1. https://appstoreconnect.apple.com/apps/6776416135/testflight/test-info
2. Fyll ut:
   - **Beta App Description**: «Norsk dressing-app for baby 0–24 mnd. Vær + aktivitet → antrekks-anbefaling.»
   - **Feedback Email**: sivertskotvold@gmail.com
   - **Beta App Review Information**:
     - First Name: Sivert
     - Last Name: Skotvold
     - Phone Number: (ditt nummer)
     - Email: sivertskotvold@gmail.com
3. **Save**

Etter dette kan du opprette External Testing-gruppe og invitere med e-postlenke.

---

## Status nå (2026-06-10)

| Område | Status |
|---|---|
| TestFlight 1.0.1 (14) | ✅ Installert + funker |
| Sprint A-D (safety) | ✅ Live på TestFlight |
| Design-polish (OKLCH, focus-rings) | ✅ Merged til main, bygg #16 |
| canRoll-onboarding | ✅ Implementert (denne committen) |
| OverheatingCheckCard på Hjem | ✅ Implementert (vises ved severity ≥ HIGH) |
| Apple Sign In | ⏳ Ventr på steg 1.1 |
| RevenueCat IAP | ⏳ Venter på steg 2.1-2.4 |
| External Beta Testing | ⏳ Valgfri |
