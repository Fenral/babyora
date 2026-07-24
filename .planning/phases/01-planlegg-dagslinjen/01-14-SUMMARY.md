---
phase: 01-planlegg-dagslinjen
plan: "14"
subsystem: planning-model
tags: [snart, climate-normals, product-heuristics, privacy, fail-closed, review-gate]

requires:
  - phase: 01-13
    provides: exact validated monthly-normal pack, manifest, contract and independent-review gate
provides:
  - strict runtime decoder bound to the exact committed climate pack and manifest
  - Europe/Oslo D+28 through D+42 calendar and clamped 25-month age gate
  - versioned Babyora-owned temperature and precipitation heuristics with locked Norwegian copy
  - pure deeply immutable ready, empty and unavailable model
  - two distinct final PASS receipts on one exact candidate tuple
affects: [01-15, 01-16, 01-17, 01-18, snart, planning]

tech-stack:
  added: []
  patterns:
    - exact own-key model input with safe structured normalization
    - exact committed JSON structural binding before runtime profile resolution
    - one deterministic winner per concept with immutable trace fields
    - rejected review candidates remain narrative and never become PASS receipts

key-files:
  created:
    - src/lib/planning/snart-climate.ts
    - src/lib/planning/snart-date-window.ts
    - src/lib/planning/snart-heuristics-v1.ts
    - src/lib/planning/snart-copy.nb.ts
    - src/lib/planning/snart.ts
    - src/lib/planning/__tests__/snart-climate.test.ts
    - src/lib/planning/__tests__/snart-date-window.test.ts
    - src/lib/planning/__tests__/snart-heuristics-v1.test.ts
    - .planning/phases/01-planlegg-dagslinjen/evidence/01-14-candidate.json
    - .planning/phases/01-planlegg-dagslinjen/evidence/01-14-review-a.json
    - .planning/phases/01-planlegg-dagslinjen/evidence/01-14-review-b.json
  modified:
    - src/lib/planning/__tests__/snart.test.ts

key-decisions:
  - "The model accepts exactly six own data fields; child identity, raw birth date, coordinates, names and action timestamps never cross the model boundary."
  - "Temperature and precipitation thresholds are versioned Babyora product heuristics, not MET recommendations, medical advice, safety limits or weather forecasts."
  - "not_highlighted rows remain visible and cannot be marked as already owned; only actionable rows are removed by the in-memory session set."
  - "The final receipts are local consistency evidence with explicit false authenticated provenance."

requirements-completed: [GOV-01, GOV-04, GOV-05, GOV-06, TRUTH-01, ACCESS-01]
completed: 2026-07-24
status: complete
---

# Phase 1 Plan 14: Snart Historical Preparation Model

**The exact validated monthly-normal pack now drives a deterministic, fail-closed and privacy-minimal preparation model, while the live capability remains off.**

## Outcome

- Final implementation candidate: `1b8e1c9a7e32e90cca825d78ea3a3ea83a44dc31`.
- Final candidate tree: `75b9251c5981d7fe894575ff9263441701afc693`.
- Review-gate attempt: `3`.
- Final independent review: Lane A `PASS`, Lane B `PASS`, both clean before and after, with `findings: []`.
- Focused model verification: **4 files passed, 45 tests passed**.
- Lane B's final full-suite report: **911 tests passed**.
- Runtime/UI publication remains disabled: `soon_preparation=false`.
- `family_sharing=false` and `personal_calibration=false`.
- No React, route, paywall, storage, network, analytics, media or dependency change.
- New cost: **NOK 0**.
- No push or deployment was performed.

## Immutable Candidate Tuple

The candidate file was generated from the clean implementation worktree with:

```text
npx tsx scripts/snart/review-gate.ts candidate --plan 01-14 --attempt 3
```

| Identity | Exact value |
|---|---|
| Plan | `01-14` |
| Attempt | `3` |
| Candidate Git SHA | `1b8e1c9a7e32e90cca825d78ea3a3ea83a44dc31` |
| Candidate tree SHA | `75b9251c5981d7fe894575ff9263441701afc693` |
| Contract SHA-256 | `f223636699eb0b654ad29ab08b407237db6e5ee224aeb8f0720e4c80a0f05033` |
| Pack SHA-256 | `e222950d15e49a98e5aeb65516219f6a4adda5a618e6ad1ae98ad6193136457b` |
| Evidence SHA-256 | `9f8fa471a2c9fc3723155bd4a9b3a82eeab066ce838d2051fae85e6cee186c8a` |
| Candidate gate status before receipts | `PENDING_REVIEW` |
| Local receipts are cryptographic provenance | `false` |
| Authenticated provenance | `false` |

The completion-record commit follows the immutable implementation candidate. It adds only the candidate record, two receipts and this summary, and does not alter the reviewed implementation tuple.

## RED to GREEN Chain

| Stage | Commit | Result |
|---|---|---|
| Initial RED | `9469ef367aad5c34397e37a776d334c828a991f3` — `test(01-14): specify fail-closed Snart contracts` | Decoder, date, age, heuristic and state contracts fail before implementation |
| Initial GREEN | `268b734aa728fe5c75d5ac04231d4262a644020d` — `feat(01-14): implement exact Snart climate model` | Exact climate model and first complete runtime slice |
| Review-repair RED | `8a3b73b1dc8000db8e426178f061aff04a4c9bad` — `test(01-14): enforce privacy copy and state matrix` | Minimal input, copy, filtering, immutability and source-boundary gaps reproduced |
| Review-repair GREEN | `b8e03ac9fea88b35905f8f3a5e7f7fee979ccd45` — `fix(01-14): lock Snart privacy copy and state model` | Exact six-key input, locked presentation surface and complete state matrix |
| Hostile-input RED | `298e4b35b0d59ed66acf8dbe19aa94c27c549f32` — `test(01-14): cover hostile Snart model inputs` | Throwing and deceptive Proxy/Set cases reproduced |
| Final GREEN | `1b8e1c9a7e32e90cca825d78ea3a3ea83a44dc31` — `fix(01-14): normalize hostile Snart model inputs` | Safe normalization fails closed without throw, leak or key bypass |

Every final production change is preceded by a focused failing regression commit. The final candidate is the last GREEN commit above.

## Exact Runtime Input Boundary

`buildSnartPlan` accepts only an ordinary object with these six enumerable own data properties:

| Field | Contract |
|---|---|
| `asOfLocalDate` | Strict ISO local date string |
| `timezone` | Literal `Europe/Oslo` |
| `homePlaceKey` | Exact committed `home-place-key@1` key |
| `ageEligibleForWholeWindow` | Boolean computed upstream |
| `climateProfileId` | Exact committed profile ID |
| `alreadyHaveConceptIds` | Exact native `Set` containing only the six known concept IDs |

The boundary rejects missing or extra keys, inherited keys, symbol keys, accessors, non-plain objects, Set subclasses, decorated Sets, unknown concept IDs, non-string Set members, Proxy-wrapped Sets, throwing reflection/property access and a Proxy that conceals `childId`.

The model does not accept `childId`, `birthLocalDate`, `coordinates`, `actionTimestamp`, `name` or any other identity/session field. Raw birth date is confined to the upstream pure age helper and is reduced to `ageEligibleForWholeWindow` before model entry.

## Exact Climate, Calendar and Age Contract

| Boundary | Locked behavior |
|---|---|
| Pack identity | Exact committed `babyora-monthly-normal-pack@2`, derivation `babyora-monthly-normal-pack@2`, contract and pack hashes |
| Manifest identity | Exact committed `babyora-monthly-normal-manifest@2`, `babyora-target-window-monthly-weighting@1`, attribution, builder identity, source digests and bindings |
| Profile | Exact `homePlaceKey` + `profileId`; no fuzzy, nearest, effective or automatic fallback |
| Month rows | Exactly 12 unique months with finite `meanTemperatureC` and `monthlyPrecipitationMm` |
| Target dates | Exactly 15 unique valid ISO dates, inclusive D+28 through D+42 |
| Timezone | Exact `Europe/Oslo`; calendar arithmetic does not use machine-local time or 24-hour millisecond increments |
| Temperature signal | Sum each monthly normal multiplied by target dates in that month, then divide by 15 |
| Precipitation signal | Sum `monthlyPrecipitationMm / actual daysInMonth × target dates in month` |
| Leap year | February uses 28 or 29 actual calendar days |
| Age | Whole-window eligible only when target end precedes the clamped 25-month birthday |
| Failure | Invalid schema, hash, nested value, profile, month, date, coverage or binding returns unavailable |

The decoder compares the full pack and manifest structurally against immutable committed JSON. It does not trust a declared hash while allowing nested bytes to drift.

## Exact Babyora Heuristic Matrix

`SNART_RULESET_VERSION` is exactly `babyora-snart-heuristics@2`. Every finite evaluation returns one winner per concept in this stable order:

1. `snart.base_layer`
2. `snart.mid_layer`
3. `snart.insulated_outer`
4. `snart.cold_headwear`
5. `snart.handwear`
6. `snart.weather_shell`

| Concept | Signal | `check_first` | `available_if_needed` | `not_highlighted` |
|---|---|---|---|---|
| `snart.base_layer` | `targetMeanTemperatureC` | `T ≤ 12`: `SNART-H2-BASE-CHECK` | `12 < T ≤ 16`: `SNART-H2-BASE-AVAILABLE` | `T > 16`: `SNART-H2-BASE-NOT-HIGHLIGHTED` |
| `snart.mid_layer` | `targetMeanTemperatureC` | `T ≤ 7`: `SNART-H2-MID-CHECK` | `7 < T ≤ 12`: `SNART-H2-MID-AVAILABLE` | `T > 12`: `SNART-H2-MID-NOT-HIGHLIGHTED` |
| `snart.insulated_outer` | `targetMeanTemperatureC` | `T ≤ 2`: `SNART-H2-OUTER-CHECK` | `2 < T ≤ 7`: `SNART-H2-OUTER-AVAILABLE` | `T > 7`: `SNART-H2-OUTER-NOT-HIGHLIGHTED` |
| `snart.cold_headwear` | `targetMeanTemperatureC` | `T ≤ 7`: `SNART-H2-HEAD-CHECK` | `7 < T ≤ 12`: `SNART-H2-HEAD-AVAILABLE` | `T > 12`: `SNART-H2-HEAD-NOT-HIGHLIGHTED` |
| `snart.handwear` | `targetMeanTemperatureC` | `T ≤ 2`: `SNART-H2-HAND-CHECK` | `2 < T ≤ 7`: `SNART-H2-HAND-AVAILABLE` | `T > 7`: `SNART-H2-HAND-NOT-HIGHLIGHTED` |
| `snart.weather_shell` | `targetPrecipitationMm` | `P ≥ 50`: `SNART-H2-WET-CHECK` | `20 ≤ P < 50`: `SNART-H2-WET-AVAILABLE` | `P < 20`: `SNART-H2-WET-NOT-HIGHLIGHTED` |

The focused matrix verifies each exact boundary and `1e-9` on both sides of 2, 7, 12 and 16 °C, plus both sides of 20 and 50 mm. Non-finite temperature or precipitation fails closed to no heuristic rows.

Every row is deeply immutable and carries:

- exact `ruleId`, `conceptId`, group and locked copy;
- exact signal name/value;
- `rulesetVersion='babyora-snart-heuristics@2'`;
- `policyOwner='Babyora'`;
- `evidenceType='product_heuristic'`;
- exact `profileId`, pack SHA and target start/end dates in model output.

These are Babyora product choices. They are not MET rules, MET limits, forecasts, medical advice, health advice, safety advice, cold-exposure limits, sizing or fit recommendations.

## Exact Presentation Copy

### Frame and state copy

| Key | Exact Norwegian copy |
|---|---|
| Title template | `Planlegg for {fraDato}–{tilDato}` |
| Subtitle | `Basert på månedlige normaler for 1991–2020, ikke et værvarsel.` |
| Unavailable | `Vi har ikke godt nok historisk grunnlag for dette stedet akkurat nå.` |
| Empty | `Ingenting å forberede akkurat nå.` |
| Group: check | `Sjekk først` |
| Group: available | `Kan være greit å ha tilgjengelig` |
| Group: not highlighted | `Ikke fremhevet for perioden` |
| Note | `Dette er en Babyora-planleggingsregel basert på historiske månedsnormaler. Sjekk dagens vær og egne behov nærmere datoen.` |
| Source | `Månedsnormaler 1991–2020: Meteorologisk institutt (MET Norway). Bearbeidet av Babyora.` |

### Eighteen exact rule sentences

| Concept | Check | Available | Not highlighted |
|---|---|---|---|
| Base | `Sjekk om dere har et lett innerlag tilgjengelig for perioden.` | `Et lett innerlag kan være greit å finne fram dersom perioden blir kjøligere enn det historiske mønsteret.` | `Innerlag er ikke fremhevet av denne historiske perioden.` |
| Mid | `Sjekk om dere har et mellomlag tilgjengelig for perioden.` | `Et mellomlag kan være greit å finne fram dersom perioden blir kjøligere enn det historiske mønsteret.` | `Mellomlag er ikke fremhevet av denne historiske perioden.` |
| Outer | `Sjekk om dere har et isolert ytterlag tilgjengelig for perioden.` | `Et isolert ytterlag kan være greit å ha tilgjengelig dersom perioden blir kjøligere enn det historiske mønsteret.` | `Isolert ytterlag er ikke fremhevet av denne historiske perioden.` |
| Head | `Sjekk om dere har et hodeplagg tilgjengelig for perioden.` | `Et hodeplagg kan være greit å ha tilgjengelig dersom perioden blir kjøligere enn det historiske mønsteret.` | `Hodeplagg er ikke fremhevet av denne historiske perioden.` |
| Hand | `Sjekk om dere har håndplagg tilgjengelig for perioden.` | `Håndplagg kan være greit å ha tilgjengelig dersom perioden blir kjøligere enn det historiske mønsteret.` | `Håndplagg er ikke fremhevet av denne historiske perioden.` |
| Wet | `Historisk nedbørsmengde er høyere for perioden. Sjekk om et værbeskyttende ytterlag er tilgjengelig.` | `Et værbeskyttende ytterlag kan være greit å ha tilgjengelig ut fra historisk nedbørsmengde.` | `Værbeskyttende ytterlag er ikke fremhevet av periodens historiske nedbørsmengde.` |

The full visible copy object is deeply frozen. Tests reject Norwegian morphology for safety, health, medicine, cold exposure, infants, sun/UV, size, fit, purchase and material claims, plus any wording that presents a rule, limit or recommendation as endorsed by MET.

## Exact State and Session Matrix

| Evidence/input state | Result | Advice surface |
|---|---|---|
| Valid pack/profile/window/age with one or more visible rows | `ready` | Deep-frozen dates, frame copy, source and traceable items |
| Valid evidence after all actionable winners are filtered and no row remains | `empty` | Deep-frozen title, exact empty copy and source; no hidden items |
| Invalid shape, age, timezone, date, profile, pack, manifest, binding, month or signal | `unavailable` | Exactly `status`, `reason`, `copy`; no items, groups, concepts, rules or signal values |
| Actionable `check_first`/`available_if_needed` concept in `alreadyHaveConceptIds` | Row removed in memory | Input Set is not mutated |
| `not_highlighted` concept in `alreadyHaveConceptIds` | Row remains visible | `canMarkAlreadyHave=false` |

Evaluation deduplicates by concept before session filtering. The input and result remain independent after return, output serialization is deterministic for the same input, and every returned object/array is deeply frozen.

## Privacy, Source and Capability Gates

The static source test covers all five runtime modules:

- `src/lib/planning/snart-climate.ts`
- `src/lib/planning/snart-copy.nb.ts`
- `src/lib/planning/snart-date-window.ts`
- `src/lib/planning/snart-heuristics-v1.ts`
- `src/lib/planning/snart.ts`

It rejects runtime imports or use of:

- `node:` and `scripts/`;
- `fetch`, `XMLHttpRequest` and `WebSocket`;
- `localStorage`, `sessionStorage`, IndexedDB and CacheStorage;
- PostHog, analytics and console output.

The model source rejects `childId`, `birthLocalDate`, `coordinates`, `actionTimestamp` and `name`. The candidate changes exactly these nine implementation/test paths and no UI/capability path:

1. `src/lib/planning/__tests__/snart-climate.test.ts`
2. `src/lib/planning/__tests__/snart-date-window.test.ts`
3. `src/lib/planning/__tests__/snart-heuristics-v1.test.ts`
4. `src/lib/planning/__tests__/snart.test.ts`
5. `src/lib/planning/snart-climate.ts`
6. `src/lib/planning/snart-copy.nb.ts`
7. `src/lib/planning/snart-date-window.ts`
8. `src/lib/planning/snart-heuristics-v1.ts`
9. `src/lib/planning/snart.ts`

Capability values at the reviewed candidate:

| Capability | Value |
|---|---|
| `soon_preparation` | `false` |
| `family_sharing` | `false` |
| `personal_calibration` | `false` |

## Independent Review Gate

The checked-in local validator returned:

```json
{"attempt":3,"gateStatus":"PASS","localReceiptsAreNotCryptographicProvenance":true,"planId":"01-14","provenanceAuthenticated":false,"reviewerAgentIds":["/root/phase1_01_14_review_a_fast","/root/phase3_03_03_final_review_fast"],"reviewerCanonicalTaskNames":["/root/phase1_01_14_review_a_fast","/root/phase3_03_03_final_review_fast"],"valid":true}
```

Validation command:

```text
npx tsx scripts/snart/review-gate.ts validate --plan 01-14 --evidence-dir .planning/phases/01-planlegg-dagslinjen/evidence
```

The receipt schema is exactly `babyora-independent-review-receipt@2`. It has no session, fork or freshness keys, so orchestration-only annotations were not added to either receipt. Each receipt stores only supported schema fields and repeats the same exact five-hash tuple.

### Lane A

| Field | Value |
|---|---|
| Canonical task name | `/root/phase1_01_14_review_a_fast` |
| Agent ID | `/root/phase1_01_14_review_a_fast` |
| Signed identity | Exact match to reviewer identity |
| Verdict | `PASS` |
| Findings | `[]` |
| Clean before/after | `true` / `true` |

Recorded commands, all exit code `0`:

1. `npx tsx scripts/snart/validate-climate-pack.ts --contract .planning/phases/01-planlegg-dagslinjen/01-SNART-AUTONOMY-CONTRACT.json --data-dir src/data/snart`
2. `npx vitest run src/lib/planning/__tests__/snart-climate.test.ts src/lib/planning/__tests__/snart-date-window.test.ts src/lib/planning/__tests__/snart-heuristics-v1.test.ts src/lib/planning/__tests__/snart.test.ts`
3. `npx tsc -b --pretty false`
4. `npm test`
5. `npm run lint`
6. `npm run build`
7. `git diff --check 98ba03b6d8f8a374d23f6be178ab284d2b4d3aad HEAD`
8. `read-only exhaustive primitive pack/manifest mutation probe (6241/6241 rejected)`
9. `read-only calendar/age and 8 hostile Proxy/input variants probe (no throw/leak; only ready|empty|unavailable)`

### Lane B

| Field | Value |
|---|---|
| Canonical task name | `/root/phase3_03_03_final_review_fast` |
| Agent ID | `/root/phase3_03_03_final_review_fast` |
| Signed identity | Exact match to reviewer identity |
| Verdict | `PASS` |
| Findings | `[]` |
| Clean before/after | `true` / `true` |

Recorded commands, all exit code `0`:

1. `npx tsx scripts/snart/validate-climate-pack.ts --contract .planning/phases/01-planlegg-dagslinjen/01-SNART-AUTONOMY-CONTRACT.json --data-dir src/data/snart`
2. `npx vitest run src/lib/planning/__tests__/snart-climate.test.ts src/lib/planning/__tests__/snart-date-window.test.ts src/lib/planning/__tests__/snart-heuristics-v1.test.ts src/lib/planning/__tests__/snart.test.ts`
3. `npx tsc -b --pretty false`
4. `npm test`
5. `npm run lint`
6. `npm run build`
7. `git diff --check 98ba03b HEAD`

Lane B's final report also confirms exact nine-path scope, 45/45 focused tests, 911 full-suite tests, threshold/copy/privacy matrices, Proxy/immutability/source checks and all three capabilities false.

## Repaired Findings from Rejected Reviews

These findings are historical repair evidence. None of the rejected candidates is represented by a PASS receipt.

### Candidate `ec730534`

- Lane A returned `FAIL_STRICT_DECODER`: a pack extra field, manifest extra field, invalid manifest `schemaVersion` and 15 duplicate/invalid dates could return available.
- Repair: exact key/schema checks and unique valid ISO-calendar-date guards.
- `FAIL_CANONICAL_JSON` observed in a Windows worktree was CRLF checkout-only. The identical Git LF blob validated, so this was not a data defect.

### Candidate `91a2827`

- Lane A returned `FAIL_ACTUAL_PACK_HASH_UNBOUND`: mutations to nested mean temperature, monthly precipitation, manifest source attribution and builder SHA passed because only the declared SHA was checked.
- Repair: exact structural binding to the committed pack and manifest.
- Lane A also returned `FAIL_REVIEW_GATE_PLAN_SCOPE`: generic `(planning)` commit subjects did not satisfy the canonical plan gate.
- Repair: rebuilt a clean branch with contiguous `(01-14)` candidate commits.

### Candidate `268b734`

- Lane B returned `FAIL_MINIMAL_INPUT_BOUNDARY`: extra `childId`, `birthLocalDate`, coordinates, action timestamp and name fields could still produce `ready`.
- Lane B returned `FAIL_LOCKED_COPY_SURFACE`: title and all 18 row sentences were absent from the model presentation surface, and nested copy was mutable.
- Lane B returned `FAIL_EXECUTABLE_LANE_B_MATRIX`: release tests did not yet execute the full threshold, privacy, empty, `not_highlighted`, copy, blockword and source contract.
- Repair: exact six-key input, exact deeply frozen copy carried by results and the full executable Lane B matrix.

### Candidate `b8e03ac`

- Lane B returned `FAIL_HOSTILE_INPUT_BOUNDARY`: throwing `ownKeys`/property-read Proxies, a proxied Set and a Proxy-hidden `childId` could throw or bypass exact-key validation.
- Repair: safe structured normalization before every validation step. Final candidate `1b8e1c9` passes all eight hostile variants without throw, leak or result outside `ready|empty|unavailable`.

All rejected candidates received no PASS receipts. Only final candidate `1b8e1c9a7e32e90cca825d78ea3a3ea83a44dc31` is bound into the two final PASS receipts.

## Verification Results

| Gate | Final result |
|---|---|
| Canonical candidate generation | PASS; exact attempt-3 tuple and nine-path scope |
| Climate pack validator | PASS in both final review lanes |
| Four focused model suites | PASS; 4 files, 45 tests |
| TypeScript project build | PASS |
| Full test suite | PASS; Lane B reports 911 tests |
| ESLint | PASS |
| Vite production build | PASS |
| Candidate diff checks | PASS in both final review lanes |
| Primitive pack/manifest mutation probe | PASS; 6241/6241 rejected |
| Calendar/age and hostile-input probe | PASS; no throw/leak |
| Two-lane local review gate | PASS; distinct identities, same tuple, clean before/after, zero findings |
| Capability gate | PASS; `soon_preparation=false`, `family_sharing=false`, `personal_calibration=false` |

## Cost, Publication and Rollback

- No paid API, credential, purchase, media generation or new dependency was used.
- New cost is `NOK 0`.
- No branch was pushed and nothing was deployed.
- App UI and capability state remain unchanged.
- Rollback is to revert the scoped Plan 01-14 model commits while preserving Plan 01-13's validated pack. A rollback must not introduce runtime climate networking, synthetic profiles or older heuristic rules.
