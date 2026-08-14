# SN-002 · Kartlegging (byggerens arbeidsnotat)

Laget mens SN-001 f2 er hos Codex. Committes sammen med SN-002 hvis den fortsatt
er nyttig; ellers slettes den. Ikke autoritativ — kilder på tur.

## Kommentaren som skal fjernes

`src/lib/billing/revenuecat.ts` linje 7–13:

```
⚠️ PRODUKT-ID-MISMATCH (2026-07-15): PRODUCT_IDS i ../premium/products.ts
(`babyora_*`, F81-prising) matcher IKKE det som faktisk er provisjonert i
App Store Connect + RevenueCat (`no.klemeg.app.monthly/quarterly/yearly`, se
STATUS.md). purchasePackage(PRODUCT_IDS[...]) vil derfor ikke finne en
package på enhet før dette er avstemt. Krever eierbeslutning på prismodell —
se docs/APP-STORE-IAP-SETUP.md. Oppsett/nøkler er allerede gjort (STATUS.md);
ikke sett opp på nytt.
```

Kommentaren er utdatert — commit `3a443f8` (fix: align product IDs/prices)
og `1aaa59b` (docs: correct Apple/IAP state) løste mismatchen ved å alignere
`products.ts` tilbake til `no.klemeg.app.*` samme dag som kommentaren ble
skrevet. `revenuecat.ts` advarer likevel som om problemet lever.

Kun én mismatch-kommentar i filen.

## Bekreftelse av `products.ts`

`src/lib/premium/products.ts` linje 23–27:

```typescript
export const PRODUCT_IDS = {
  yearly: 'no.klemeg.app.yearly',
  quarterly: 'no.klemeg.app.quarterly',
  monthly: 'no.klemeg.app.monthly',
} as const;
```

Bekreftet: alle tre er `no.klemeg.app.*`. Ingen `babyora_*` eller
`klemeg_premium_*` i selve filen.

## Kryssreferanser

- `babyora_premium_*` — kun i dokumentasjon (README.md, NEXT-STEPS.md,
  STATUS.md, RELEASE.md) som planlagte Play-produkter (E-3 ikke tatt).
- `klemeg_premium_*` — omtalt som *døde* Play-produkter i STATUS.md.
- `no.klemeg.app.*` — iOS bruker disse; urørte.

Ingen aktive kode-treff på gamle iOS-IDer.

## Tester

- `src/lib/premium/__tests__/products.test.ts` — dekker alle tre iOS-IDer
  (linje 14–17), prisanker (39/99/299), trial-dager (7), triggere.
- `src/lib/premium/__tests__/use-access.test.ts` — mocker `revenuecat.ts`
  (linje 43–46) for premium-sjekk.
- Ingen direkte tester på `revenuecat.ts`.

## Historikk

- `90c2213` — feat(paywall) P2 (nyest på begge filer)
- `d45397c` — feat(01-16) sannferdig Snart paywall-trigger
- `a2cbc9c` — fix(01-10) derive paywall claims fra capabilities
- `3a443f8` — fix: align product IDs/prices (2026-07-15, dagen mismatchen ble løst)
- `1aaa59b` — docs: correct Apple/IAP state

## Plan for SN-002 (før overlevering til Codex)

1. Fjern linje 7–13 i `src/lib/billing/revenuecat.ts` — kommentarblokken.
   Behold ikke en «TODO»-linje; kommentaren har mistet sin gyldighet fullstendig.
2. Ingen endringer i `products.ts` (bare bekreft i requesten).
3. Kjør G1–G4 + rødt lag (C-porter: C1 bundle-id urørt, C2 produkt-IDer urørt).
4. Skriv `requests/SN-002-f1.md` med diff-snitt og evidens.
