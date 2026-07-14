# R7 — retning B: shippable kjerne (evidens)

**Branch:** `feat/r7-retning-b` (8 commits over `main`) · **Dato:** 2026-07-14 kveld
**Verifisert:** tsc ✓ · 548 enhetstester ✓ · 19 audit-tester ✓ · lint 0 ✓ · build ✓ · E2E 2/2 ✓

Eier valgte retning **B «Scenen»** (decision log 2026-07-14) og frafalt fem-foreldre-porten som forhåndsport. Denne pakken implementerer den shippable kjernen; alle flater konsumerer dagens motor via `RecommendationView` (Motor V2 forblir bak flagg).

## Levert (UI-plan Task 1–6)

| Task | Commit(er) | Innhold | Live-verifisert |
|---|---|---|---|
| 1 | `696cb4d` | `decideAccess` capability-kontrakt; **lifetime fjernet fra PLAN_ORDER** (låst beslutning); trust-copy | — |
| 2 | `0e88ac1` | Kanonisk `RecommendationView` + `AvatarStateKey` (sittende 0–11/stående 12–24, tomt manifest → nøytral fallback) | — |
| 3 | `b9e6dc7` | Fire-rots-skall Hjem/Planlegg/Guide/**Familie** (familie-glyf), delte kontroller (ScreenHeader/ActionButton/SegmentedControl) | ✓ |
| 3A | `029db45` | Signatur-**temperaturinstrument** (vertikal glass-tube, gravert skala, bånd-markører, ± knapper) i Finn antrekk | ✓ |
| 4 | `b86b7d1`, `e46cf74`, `baa27ff` | **Hjem-scene** (avatar/atmosfære/serif-svar/orbital-ankere/sikkerhetslinje) + **Antrekk tekstil-stack** (fargetabs, aktiv-rad-løft) | ✓ |
| 5 | `74cdc0d`, `d62b857`, `3e85591` | **Planlegg-endringsrail** (`deriveChangeEvents`/`buildRailRows`, kun meningsfulle endringer, tekst-først handlinger) | ✓ |
| 6 | `236b9c3` | Produkt-**copy-lint** (KLEMEG/absolutt-trygghet/utendørs-TOG); alle 5 språkfiler verifisert rene | — |

Alle UI-tasks fulgte accessibility-lead pre-review (native radios, ARIA-kontrakter, fokus-styring, ingen farge-alene, ≥44 pt, live-region-bevaring). Ingen skjerm teller plagg eller regner fingerprint selv (kanonisk `RecommendationView`).

## Bevisst utsatt / gatet (ikke i denne pakken)

- **Task 5 «Snart»-skjerm** — railen er §6-kjernen; Snart er tilleggsflate.
- **Task 7 omsorgssirkel + PlusExpansionPreview** — omsorgssirkelen impliserer familiedeling (R9: auth/RLS/backend). Skal ikke vises aktivert uten R9; dev-only preview.
- **Avatar-assets** — silhuett/clay er interim; R8 leverer inntil 24 verifiserte kompositter etter eiers kostnadsplan-godkjenning.
- **Task 8 audit** — 13-siders 90+-rubrikk med deterministiske skjermbilder gjenstår som egen verifiseringsrunde.

## Neste porter (menneskelige)

1. **Merge** `feat/r7-retning-b` → `main` (utløser Codemagic — eier bestemmer).
2. **Apple-innlogging** for cert-revoke så TestFlight-bygget lykkes (kvota-feil).
3. R8 kostnadsplan · Task 17 ekstern fagsignatur.
