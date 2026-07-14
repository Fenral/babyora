# R2 — Guardrail-rubrikk for legacy safety containment

**LÅST: 2026-07-14** — forfattet før implementering, per evalueringsprotokollen. Omformuleres aldri; avvik dokumenteres i dommen, kravene endres ikke.

**Omfang:** Én endelig sikkerhetsgrense (`finalize-safety.ts`) etter alle post-anbefalings-mutasjoner (kategori-overrides, per-barn-kalibrering, session-swaps). Grensen håndhever **eksisterende** HB/CK/SB-regler — ingen terskelendringer, ingen nye regler, ingen endret sikkerhets-copy.

## Kritisk-defekt-liste (uttømmende — enhver = NO-GO)

Alle krav er must (vekt 3). Ingen should-krav i denne pakken. Avledet score = 100 × beståtte/alle.

| ID | Påstand (ja/nei) | Målemetode | Verktøy | Bevisartefakt |
|---|---|---|---|---|
| G1 | Kategori-override kan ikke gjeninnføre tykt vinteryttertøy ved bilstol-kontekst (HB-9) | Navngitt test: `recommend(bilstol, overrides yttertoy=[vinterkjøredress])` → ingen match `THICK_WINTER_OUTER_RE`, HB-9-flag til stede | vitest | r2-green.txt |
| G2 | Override kan ikke gjeninnføre hodeplagg under søvn (HB-1) | Test: søvn + override ekstra=[lue] → fjernet, HB-1-flag | vitest | r2-green.txt |
| G3 | Override kan ikke legge teppe ved sovepose under søvn (HB-2/CK-1) | Test: søvn + override med dunteppe ved sovepose → teppe fjernet | vitest | r2-green.txt |
| G4 | Override kan ikke gjeninnføre vektede produkter (HB-4), uansett aktivitet | Test: override med «tyngdeteppe» → fjernet, HB-4-flag | vitest | r2-green.txt |
| G5 | Override kan ikke stable dunteppe over varmepose i vogn (CK-5) | Test: vogn kaldt + override ekstra med dunteppe ved varmepose → dunteppe fjernet | vitest | r2-green.txt |
| G6 | Override kan ikke legge teppe-over-kalesje ved vogn ≥ 22 °C (HB-8) | Test: vogn 24 °C + override utstyr med «tynt teppe over kalesjen» → fjernet, HB-8-flag | vitest | r2-green.txt |
| G7 | Override kan ikke reintrodusere lag ved romtemp ≥ 26 °C søvn (SB-3 force-minimal) | Test: søvn 27 °C + override mellomlag=[ullbody, ullongs] → kun kortermet body igjen | vitest | r2-green.txt |
| G8a | Kalibrering +1 fjerner aldri plagg og legger maks ett hals-item, aldri ved feels ≥ 8 °C | Eksisterende + nye grensetester | vitest | r2-green.txt |
| G8b | Kalibrering −1 rører aldri innerst eller eneste yttertøy | Grensetester | vitest | r2-green.txt |
| G8c | Kalibrert output passerer den endelige grensen (introduserer aldri HB/CK-brudd) | Test: kalibrering ±1 over fixture-sett → finalize er no-op | vitest | r2-green.txt |
| G8d | Kalibrering ±1 i regnvær bevarer regnbeskyttelse (regndress/regntrekk uendret) | Test: vogn + regn + kalibrering → regn-items intakte | vitest | r2-green.txt |
| G9a | Session-swaps går gjennom grensen: swap som introduserer HB/CK-brudd fjernes i finalisert output | Test av eksportert `applySwapsFinalized()` | vitest | r2-green.txt |
| G9b | Ingen skjerm konstruerer trusted Recommendation ved lokal swaps-mapping | `grep -rn "swaps\[item\]" src/screens src/components` → 0 treff; skjermer kaller `applySwapsFinalized` | grep | r2-safety-containment.md §grep |
| G10 | Uten overrides/kalibrering/swaps er output semantisk identisk med før containment | Snapshot av 12 representative inputs tatt FØR endring; uendret ETTER | vitest snapshot | r2-green.txt |
| G11 | Grensen er idempotent på mutert output (finalize∘finalize = finalize), inkl. SB-5-vakt | Property-test over avgrenset fixture-sett | vitest | r2-green.txt |
| G12 | Full eksisterende suite, audit og build grønne; lint-delta = 0 nye feil | `npm test`, `npm run audit:test`, `npm run build`, lint-delta mot r1-lint-baseline.txt | npm | r2-green.txt |

## Tier-regler (låst)

- **NO-GO:** ≥ 1 krav feiler.
- **SHIPPBAR:** alle G1–G12 JA med artefakt.
- STUDIO-GRADE er ikke definert for denne pakken (ingen skjønnskanal — ren binær sikkerhetspakke).

## Tillatte filendringer (scope-vern)

`src/lib/wool-layers/finalize-safety.ts` (ny), `src/lib/wool-layers/__tests__/finalize-safety.test.ts` (ny), `src/lib/wool-layers/recommend.ts`, `src/lib/wool-layers/softBlocks.ts` (KUN idempotens-vakt i SB-5, keyet på eksisterende notatspor — ingen terskel-/copy-endring), `src/screens/HjemScreen.tsx`, `src/screens/UkeScreen.tsx` (swap-mapping → grensekall), `src/lib/garments/ownership-override.ts` (kun hvis matrisen krever). Uventede filer utover dette = scope-avvik i dommen.

Avvik fra planens fil-liste, besluttet før implementering: UkeScreen.tsx er lagt til fordi den har samme lokale swap-mapping som HjemScreen (planens matrise krever at UI-swaps ikke omgår grensen); softBlocks.ts-vakten er nødvendig fordi SB-5 ellers fjerner ett ekstra mellomlag-item per grense-kjøring (ikke-idempotent), som ville brutt G10/G11.
