# Babyora

Norsk påkledningsapp for foreldre med barn 0–3 år. iOS + Android via Capacitor.

> Web er **kun dev-preview**. Endelig produkt: App Store + Play Store.

## Stack

- **Frontend:** Vite + React 19 + TypeScript + Tailwind 3
- **Mobil:** Capacitor (iOS + Android), `no.klemeg.app`
- **Motor:** `@sivertsk/wool-layers` (lokalt vendret i `src/lib/wool-layers/`)
- **Vær:** api.met.no (User-Agent + 1 t cache + synlig kreditering)
- **Build:** Codemagic for iOS, Codemagic for Android
- **Dev-preview:** Vercel (sivert-s-projects/wool-app, noindex)

## Lokal utvikling

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # produsjons-bundle
```

## Klar for mobil-build — neste steg

Disse stegene krever **Sivert manuelt** før første grønne mobil-build:

### 1. Apple Developer + App Store Connect
- Logg inn på App Store Connect
- Lag ny app: Babyora, bundle `no.klemeg.app`, Apple Team ID PL9G26C26C
- Generer App Store Connect API key (gjenbruk Ryddy/StrikeArc)
- Generer APNs cert (for push i Fase 6)
- Aksepter Paid Apps Agreement (har du fra Ryddy)

### 2. Google Play Console
- Logg inn på Play Console
- Lag ny app: Babyora, package `no.klemeg.app`
- Generer eller gjenbruk upload-keystore (kan kopieres fra Ryddy)
- Service account for automatisk Internal-opplasting (gjenbruk Ryddy-mønster)
- Følg 11-stegs Play setup (privacy, ratings, content)

### 3. Codemagic
- Koble GitHub repo Fenral/wool-app
- Add `klemeg_keystore`-credential
- Add `google_play`-gruppe med service account JSON
- Add App Store Connect integration
- Push til main trigger `codemagic.yaml` (iOS → TestFlight, Android → Play Internal)

### 4. Supabase (for push i Fase 6)
- Opprett nytt prosjekt: `klemeg`
- Legg `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` i `.env.local`
- Edge Function `morning-push` deployes med cron-tabell senere

### 5. RevenueCat (for Premium i Fase 8)
- Opprett Babyora-prosjekt i RevenueCat dashboard (har konto fra Ryddy)
- Opprett IAP-produkter i ASC + Play Console:
  - `babyora_premium_monthly` — 39 NOK/mnd
  - `babyora_premium_quarterly` — 99 NOK/3 mnd
  - `babyora_premium_yearly` — 299 NOK/år (med 7-dagers trial)

### 6. Eksterne fagpersoner
- Helsesøster-konsulent for ull-tabell-validering (~20–40k NOK budgetted)
- Advokat for personvern-gjennomgang (~5–10k NOK budgetted)

## Kommandoer

```bash
npm run dev                # Web dev-preview
npm run build              # Produksjons-bundle
npx cap sync               # Bygg + kopier til ios/ og android/
npx cap open ios           # macOS only — åpner Xcode
npx cap open android       # krever Android Studio
node scripts/generate-icon.mjs       # regenerer app-icon (GEMINI_API_KEY env)
node scripts/generate-avatars.mjs    # regenerer prøveavatarer
```

## A11y-prinsipper innebakt

- Touch ≥56 dp, primær-CTA ≥64 dp
- Tekst-kontrast 7:1 (AAA, ikke AA)
- Font 18 pt base, hovedsvar 32–40 pt
- Bottom tab bar, aldri hamburger
- Auto-dim 21–07 (mitigering for fravær av dark mode i v1.0)
- Push-meldingen er svaret — komplett på låst skjerm
- Ingen emoji som primær-info (skjermlesere leser dem høyt)
- prefers-reduced-motion respektert

Dark mode utsatt til v1.1 (token-system er forward-compatible).

## Dokumenter

- [PRIVACY.md](./PRIVACY.md) — Personvernerklæring (utkast, krever advokat)
- [STORE-LISTING.md](./STORE-LISTING.md) — App Store + Play Store-tekst
- [capacitor.config.ts](./capacitor.config.ts) — iOS + Android-konfig
- [codemagic.yaml](./codemagic.yaml) — CI/CD-pipeline

## Lisens

Privat. Ikke åpen kildekode.
