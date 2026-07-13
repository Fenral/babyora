# Babyora P10 — Premium MASTER-SJEKKLISTE

> Konvertering av babyora-premium-plan.md til atomisk sjekkliste.
> Format som P8/P9: `[x]` ferdig, `[~]` utgår, `[!]` blokker, `[?]` venter Fable.
> Priser **349/59/699 + 7 dager** brukes som default (autonomi-protokoll).
> Bytt verdier hvis pris-test før lansering.

---

## P10.0 — Konstanter og produkt-ID-er

- [x] `src/lib/premium/products.ts` med RevenueCat product-IDs:
      - `babyora_yearly_349` (årlig anker, 7-dagers trial)
      - `babyora_monthly_59` (referansepris)
      - `babyora_lifetime_699` (livstid)
      - 13 tester verifiserer struktur + forbudt-ord-frihet
- [ ] StoreKit-config-fil for lokal testing
- [!] Opprette produkter i App Store Connect — krever Sivert manuelt
- [!] Konfigurere produkter i RevenueCat dashboard — krever Sivert manuelt

## P10.1 — Pristransparens og copy

- [x] PaywallSheet legger til `.paywall-sheet__price-transparency` rad UNDER CTA:
      `priceTransparencyText(DEFAULT_PLAN)` → «Deretter 349 kr/år. Avslutt når som helst.»
- [~] Pris hentes via `useStorePrices()` — fallback til ankerpris i `priceTransparencyText`
      når StoreKit ikke har levert. RevenueCat-integrasjon utestående.
- [x] Verdiforankrings-mikrocopy «Mindre enn én ullbody i året» (VALUE_ANCHOR_COPY)
- [x] Tillitslinje under CTA: TRUST_LINE_COPY = «Én Premium — begge foreldre»
- [x] «Ikke nå»-knapp (byttet fra «Kanskje senere» til «Ikke nå» per plan §5.7)
- [ ] Lillian (A-tier-PNG) i hjørnet
- [x] Forbudt-ord-lint: `src/lib/premium/copy-lint.ts` med 4 tester
      som fanger «låst/sperret/nektet/krever Premium». Også
      safety-keyword-test mot Premium-gating av sikkerhet.

## P10.2 — Triggere (T1-T7)

### T1: Låst dag/time i Uke
- [ ] PlanScreen: dag-kort > i dag = blur + trigger paywall_viewed{trigger:'uke_dag'}
- [ ] Forhåndsvisning: blur av ekte rec (ikke placeholder)

### T2: «I morgen tidlig» Hjem-snarvei
- [ ] HomeScreen: ny snarvei-knapp «I morgen tidlig» som trigger paywall_viewed{trigger:'imorgen'}
- [ ] Blur forhåndsvisning av morgendagens rec

### T3: 4. «Har dere denne?»-toggle
- [x] Allerede implementert (P9.6 ownership-store FREE_LIMIT=3)
- [x] Trigger-streng oppdatert til `'mine_plagg_4'` (GarmentDetailScreen.tsx:44)

### T4: Slå på morgenvarsel
- [ ] InnstillingerScreen: notification-toggle for ikke-premium → paywall
- [ ] Mockup-visning av eksempel-varsel

### T5: «Legg til barn» nr. 2
- [ ] ChildrenStore: assert isPremium ved addChild når 1 barn eksisterer
- [ ] Paywall-forhåndsvisning av barneprofil-kort

### T6: Åpne Søvn inne
- [ ] GuideScreen: Søvn-inne-kort = blur + paywall

### T7: Proaktiv etter 3 «Passe»-svar
- [ ] HomeScreen-kort: «Det fungerer for {navn}. Vil du planlegge hele uka?»
- [ ] Vises ÉN gang per bruker (localStorage flag)
- [ ] Frekvens-regel: maks 1 proaktiv prompt per 14 dager
- [ ] App Store-rating-prompt på samme dag = blokkert

## P10.3 — Entitlement-gating

- [ ] `useAccess()`-hook utvides: `hasUke`, `hasMorgenvarsel`, `hasFlereBarn`,
      `hasSoevnInne`, `hasMinePlaggUnlimited`, `hasWidgetMedium`, `hasLaerte`
- [ ] Per-funksjon-flag basert på entitlement, ikke hardkodet
- [ ] Gratis-allowlist (sivertskotvold@gmail.com) bypass — beholdes per memo

## P10.4 — Sikkerhet-er-gratis-garanti

- [x] Varm-eller-kald-modus gratis (allerede)
- [x] HB-9 bilstol-flag gratis (motor-output)
- [x] SafetyCard gratis (vises uavhengig av entitlement)
- [ ] Lint-test: ingen entitlement-gate rundt safety-flags eller HB-rules

## P10.5 — Lifecycle rundt prøven

- [ ] Dag 0 bekreftelse-skjerm: hva er åpnet + fornyelsesdato
- [ ] Dag 5 push: «Prøven ender om 2 dager» + pris + avslutt-lenke
- [ ] RevenueCat-webhook → trial_started/trial_converted/trial_expired events
- [ ] Verdig nedgradering ved utløp: barn 2 + Mine plagg FRYSES (ikke slettes)
- [ ] Winback 30 dager etter utløp: 1 tilbud (årlig -20%)
- [ ] Avslutning: 1 spørsmål («Hva manglet?»), 4 valg, hopp over

## P10.6 — Måling (events)

- [x] track-skjemaet utvidet med 5 nye events (track.ts):
      - `trial_started{plan}`
      - `trial_converted{plan}`
      - `trial_expired`
      - `winback_shown{offer}`
      - `winback_converted{plan}`
- [x] `paywall_viewed{trigger}` + `paywall_converted{plan}` (P9.4)

## P10.7 — App Store-krav

- [x] Gjenopprett kjøp-knapp på paywall (eksisterende)
- [ ] Lenke til vilkår + personvern i tillitslinjen
- [x] Auto-fornyelse beskrevet tydelig (pristransparens-rad)
- [ ] Priser fra StoreKit/RevenueCat (aldri hardkodet i UI)
- [ ] Ingen rating/deling-gate

## P10.8 — Verifikasjon

- [ ] Playwright: hver av T1-T7 åpner riktig paywall med riktig trigger-streng
- [ ] Analytics: paywall_viewed{trigger}-events fyres for hver T
- [ ] A11y-lead-review av paywall + pristransparens-rad
- [ ] Skjermbilder per trigger i `review/shots/P10/`

## MERGE-GATE

- [ ] Alle T1-T7 testet i preview
- [ ] Sikkerhet-er-gratis-lint-test passerer
- [ ] A11y-review godkjent
- [ ] App Store-personvern oppdatert
- [ ] StoreKit/RevenueCat-produkter i ASC + dashboard

## STATUS

Tester: 117 grønne ved start.
main HEAD: 7cb6407 (etter P9-runden).
