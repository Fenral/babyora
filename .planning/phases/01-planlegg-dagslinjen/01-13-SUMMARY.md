---
phase: 01-planlegg-dagslinjen
plan: "13"
subsystem: data-pipeline
tags: [snart, met-norway, senorge, climate-normals, reproducibility, provenance, review-gate]

requires:
  - phase: 01-12
    provides: capability-gated effective-place resolution and immutable location context
provides:
  - locked build-time contract for official MET seNorge_2018 monthly normals
  - deterministic sequential climate builder and offline fail-closed validator
  - validated static 60-place monthly-normal pack and provenance manifest
  - exact-candidate two-lane independent review gate with consistency-only receipts
affects: [01-14, 01-15, 01-16, 01-17, 01-18, snart, climate, planning]

tech-stack:
  added: []
  patterns:
    - canonical JSON with source, builder, contract, pack and evidence SHA-256 binding
    - build-time-only external data acquisition with no runtime climate network
    - immutable candidate tuple plus two distinct identity-matching review receipts

key-files:
  created:
    - .planning/phases/01-planlegg-dagslinjen/01-SNART-AUTONOMY-CONTRACT.json
    - scripts/snart/fixtures/met-boundaries-v1.json
    - scripts/snart/build-climate-pack.ts
    - scripts/snart/validate-climate-pack.ts
    - scripts/snart/review-gate.ts
    - src/data/snart/climate-1991-2020-v1.json
    - src/data/snart/climate-1991-2020-v1.manifest.json
    - .planning/phases/01-planlegg-dagslinjen/evidence/01-13-candidate.json
    - .planning/phases/01-planlegg-dagslinjen/evidence/01-13-review-a.json
    - .planning/phases/01-planlegg-dagslinjen/evidence/01-13-review-b.json
  modified:
    - .planning/phases/01-planlegg-dagslinjen/01-SNART-RULES.md
    - .planning/phases/01-planlegg-dagslinjen/01-SNART-AUTONOMOUS-RESEARCH.md

key-decisions:
  - "Climate data is acquired only by the separate build-time pipeline; app/runtime climate network access and tooling imports remain false."
  - "Every canonical NO_CITIES entry is represented as supported or explicitly unavailable; the current source-derived matrix is 60/60 supported and 0 unavailable."
  - "Review receipts bind one exact five-hash tuple and distinct reviewer identities, while remaining explicitly local consistency evidence rather than cryptographic provenance."

patterns-established:
  - "Validate before replacement: refresh output is staged outside committed data and atomically replaces it only after complete validation."
  - "Source truth is strict: HTTPS/host/path/query, DDS/DAS/ASCII schema, UTM cell binding, license, attribution and source hashes must all match."
  - "A review finding invalidates the prior candidate; repair begins RED, produces a new immutable tuple, and requires fresh receipts."

requirements-completed: [GOV-01, GOV-04, GOV-05, GOV-06, TRUTH-01, ACCESS-01, EVID-01]

coverage:
  - id: D1
    description: "The locked contract and fixtures bind the official MET seNorge_2018 1991–2020 monthly-normal source, license, attribution, canonical places and derivation rules."
    requirement: TRUTH-01
    verification:
      - kind: unit
        ref: "scripts/snart/__tests__/contract-fixtures.test.ts"
        status: pass
      - kind: integration
        ref: "npx tsx scripts/snart/validate-climate-pack.ts --fixture-mode --contract .planning/phases/01-planlegg-dagslinjen/01-SNART-AUTONOMY-CONTRACT.json"
        status: pass
    human_judgment: false
  - id: D2
    description: "The static pack covers all 60 canonical places with 12 validated months each and introduces no app/runtime climate API."
    requirement: ACCESS-01
    verification:
      - kind: integration
        ref: "npx tsx scripts/snart/validate-climate-pack.ts --contract .planning/phases/01-planlegg-dagslinjen/01-SNART-AUTONOMY-CONTRACT.json --data-dir src/data/snart"
        status: pass
      - kind: other
        ref: "candidate exact 18-path scope and Plan 01-13 runtime-network/storage/analytics scan"
        status: pass
    human_judgment: false
  - id: D3
    description: "The builder and validator reject HTTP-policy, source-schema, UTM-binding, coverage, license, attribution, provenance and hash drift."
    requirement: GOV-01
    verification:
      - kind: unit
        ref: "scripts/snart/__tests__/climate-pipeline.test.ts"
        status: pass
      - kind: integration
        ref: "production pack validation and Lane B fixed-policy/body/media-type/error-sanitization probe"
        status: pass
    human_judgment: false
  - id: D4
    description: "Two clean cache-only rebuilds are byte-identical to each other and to the committed pack and manifest."
    requirement: GOV-05
    verification:
      - kind: integration
        ref: "npx tsx scripts/snart/validate-climate-pack.ts --reproducibility --cache-dir tmp/snart-climate-source --expected-dir src/data/snart --contract .planning/phases/01-planlegg-dagslinjen/01-SNART-AUTONOMY-CONTRACT.json"
        status: pass
    human_judgment: false
  - id: D5
    description: "Attempt 3 has two distinct, identity-matching, clean-before/after, zero-finding PASS receipts on the exact candidate tuple."
    requirement: GOV-04
    verification:
      - kind: other
        ref: "npx tsx scripts/snart/review-gate.ts validate --plan 01-13 --evidence-dir .planning/phases/01-planlegg-dagslinjen/evidence"
        status: pass
    human_judgment: false
  - id: D6
    description: "The plan completed at NOK 0 without credentials, paid fallback, app media, push or deployment."
    requirement: EVID-01
    verification:
      - kind: other
        ref: "candidate scope, privacy/capability audit, source scan and final Git status"
        status: pass
    human_judgment: false

duration: 4h00m
completed: 2026-07-24
status: complete
---

# Phase 1 Plan 13: Reproducible Snart Climate Pipeline Summary

**Official MET seNorge_2018 monthly normals compiled into a byte-reproducible 60-place offline pack with strict provenance and two-lane exact-candidate review**

## Performance

- **Duration:** 4h 00m
- **Started:** 2026-07-24T05:43:34+02:00
- **Completed:** 2026-07-24T09:43:34+02:00
- **Tasks:** 3 planned TDD tasks plus 2 review-repair cycles
- **Candidate paths:** 18
- **Completion records:** 4
- **New cost:** NOK 0

## Accomplishments

- Locked a machine-readable build-time contract for the 24 official temperature/precipitation monthly-normal files in MET Norway's `seNorge_2018` dataset for 1991–2020.
- Built and validated 60 canonical place profiles, each with 12 monthly rows: **60 supported, 0 unavailable, 0 silently omitted**.
- Enforced strict HTTPS/HTTP response, DDS/DAS/ASCII schema, selected-cell UTM, license, attribution, provenance, coverage and canonical-hash validation before atomic output replacement.
- Proved two fresh cache-only output directories byte-identical to each other and the committed pack/manifest.
- Closed the independent review gate at attempt 3 with two distinct read-only reviewers returning PASS, exit code 0 for every recorded command and no findings.

## Data, License and Attribution

| Field | Locked value |
|---|---|
| Dataset | `seNorge_2018` |
| Institution | `Norwegian Meteorological Institute, MET Norway` |
| Normal period | `1991–2020` |
| Source files | 24 monthly-normal datasets: 12 `tg` temperature + 12 `rr` precipitation |
| Variables/units | `tg` Celsius (`time: mean`); `rr` mm (`time: sum`) |
| License | `https://www.met.no/en/free-meteorological-data/Licensing-and-crediting` |
| Attribution | `Månedsnormaler 1991–2020: Meteorologisk institutt (MET Norway). Bearbeidet av Babyora.` |
| Disclaimer | `Kildefilene er offisielle MET-månedsnormaler. Babyoras målperiodeberegning og plaggheuristikker er ikke et MET-varsel eller en MET-anbefaling.` |
| Canonical place projection | 60 entries; SHA-256 `c963c897d7e7c0db85da77cf57c1e10379b2a0bb567cc9051ab009e4c325e272` |
| Place result | 60 supported / 0 unavailable |

The pack stores exact finite source values; configured rounding is presentation-only. No synthetic boundary fixture is admitted as production data.

## Strict Validation Results

| Boundary | Result |
|---|---|
| URL and request | PASS — exact `https:` scheme, `thredds.met.no`, empty/443 port, allowlisted family/month path, DAP2 variable/slice grammar and frozen User-Agent |
| Response policy | PASS — manual redirect, no redirect following/downgrade, 20 s timeout, 2 MiB metadata/point and 96 MiB grid limits, 200-only acceptance, bounded 429/5xx retry and validated-body-only cache |
| Request ordering | PASS — `maxConcurrentRequests: 1`; source acquisition is sequential and resumable |
| DDS/DAS/ASCII | PASS — exact family, month, variable, dimensions, time, units, aggregation, file/source version, institution and license metadata |
| Grid and UTM | PASS — selected X/Y and exact UTM axis values bind every point response; individually or consistently wrong UTM coordinates are rejected |
| Place/month schema | PASS — source-derived canonical projection; exact 12 sorted months per supported profile; missing, extra, duplicate, invalid or unknown fields fail closed |
| Provenance and privacy | PASS — source/response/metadata/builder/contract/pack hashes match; credential-shaped or personal-data fields are rejected |
| Atomic replacement | PASS — failed staged validation preserves the last validated committed output |

Focused verification completed with **38/38 tests passed** across:

- `scripts/snart/__tests__/contract-fixtures.test.ts`
- `scripts/snart/__tests__/climate-pipeline.test.ts`
- `scripts/snart/__tests__/review-gate.test.ts`

The final full suite completed with **73 test files passed, 1 skipped; 866 tests passed, 9 planned TODOs**. ESLint passed. TypeScript, the main Vite build and the bare build passed.

## Immutable Candidate and Reproduction

The candidate file captured the clean implementation/data worktree before root stored the two review receipts. Its internal `gateStatus` is therefore `PENDING_REVIEW`; the completed local gate result after receipt storage is `PASS`.

| Identity | SHA |
|---|---|
| Candidate attempt | `3` |
| Candidate Git commit (`gitSha`) | `2f510d4a8d9b97a50430223bdbc94570b880393e` |
| Candidate tree (`treeSha`) | `2b017730aef66ed556c08349f0ec3e5a9402d56c` |
| Contract SHA-256 | `f223636699eb0b654ad29ab08b407237db6e5ee224aeb8f0720e4c80a0f05033` |
| Pack SHA-256 | `e222950d15e49a98e5aeb65516219f6a4adda5a618e6ad1ae98ad6193136457b` |
| Evidence SHA-256 | `eb8c744589497fb9917114bfa2ab4c03a3ece22ea575ef4ee50799eb30317545` |
| Manifest file SHA-256 | `a20244cfbe3129ed360ac33f592718bb1a58d7f208d07987d076660f4fd700aa` |
| Builder file SHA-256 | `7f651d485dfd35a4b60cf2dc74b3e8091215cdd2496f80e4cb094fc55eba9399` |
| Candidate JSON file SHA-256 | `2c3620bcdde27aba1979b8458a5dfd1056ff11d02e513df26ce5d36f8426589e` |
| Manifest `createdFromGitSha` | `6d14266613a02e156413bc7a9dac3eb9d8fdb2df` |

The reproducibility command built twice into separate fresh output directories from the validated raw cache, validated both, then byte-compared both outputs to the committed files:

- `climate-1991-2020-v1.json`: `e222950d15e49a98e5aeb65516219f6a4adda5a618e6ad1ae98ad6193136457b`
- `climate-1991-2020-v1.manifest.json`: `a20244cfbe3129ed360ac33f592718bb1a58d7f208d07987d076660f4fd700aa`

The completion-record commit comes after review and intentionally does not alter this immutable implementation candidate tuple.

## Independent Review Gate

Final validation returned:

```json
{"attempt":3,"gateStatus":"PASS","localReceiptsAreNotCryptographicProvenance":true,"planId":"01-13","provenanceAuthenticated":false,"reviewerAgentIds":["/root/snart_01_13_review_a_attempt_3","/root/snart_01_13_review_b_attempt_2"],"reviewerCanonicalTaskNames":["/root/snart_01_13_review_a_attempt_3","/root/snart_01_13_review_b_attempt_2"],"valid":true}
```

### Lane A

- **Receipt attempt:** `3`
- **Canonical task name:** `/root/snart_01_13_review_a_attempt_3`
- **Agent ID:** `/root/snart_01_13_review_a_attempt_3`
- **Signed canonical task name:** `/root/snart_01_13_review_a_attempt_3`
- **Signed agent ID:** `/root/snart_01_13_review_a_attempt_3`
- **Verdict:** `PASS`
- **Findings:** `[]`
- **Clean before/after:** `true` / `true`

Recorded commands, all exit code `0`:

1. `read-only captureCandidateSnapshot/buildCandidateRecord byte-comparison against 01-13-candidate.json`
2. `.\node_modules\.bin\vitest.cmd run scripts/snart/__tests__/contract-fixtures.test.ts scripts/snart/__tests__/climate-pipeline.test.ts scripts/snart/__tests__/review-gate.test.ts`
3. `.\node_modules\.bin\tsx.cmd scripts/snart/validate-climate-pack.ts --fixture-mode --contract .planning/phases/01-planlegg-dagslinjen/01-SNART-AUTONOMY-CONTRACT.json`
4. `.\node_modules\.bin\tsx.cmd scripts/snart/validate-climate-pack.ts --reproducibility --cache-dir tmp/snart-climate-source --expected-dir src/data/snart --contract .planning/phases/01-planlegg-dagslinjen/01-SNART-AUTONOMY-CONTRACT.json`
5. `.\node_modules\.bin\tsx.cmd scripts/snart/validate-climate-pack.ts --contract .planning/phases/01-planlegg-dagslinjen/01-SNART-AUTONOMY-CONTRACT.json --data-dir src/data/snart`
6. `read-only Lane A cache/schema/24-source/60x12/raw-threshold/attribution/hash audit`
7. `git diff --check 776a91fb3ea048475d6800d8211420dcc74c3e27..HEAD and exact 18-path candidate scope comparison`
8. `final HEAD/tree/contract/pack/status verification with only 01-13-candidate.json untracked`

### Lane B

The Lane B task identity retains its exact `/attempt_2` name, while the receipt's candidate attempt field is `3`.

- **Receipt attempt:** `3`
- **Canonical task name:** `/root/snart_01_13_review_b_attempt_2`
- **Agent ID:** `/root/snart_01_13_review_b_attempt_2`
- **Signed canonical task name:** `/root/snart_01_13_review_b_attempt_2`
- **Signed agent ID:** `/root/snart_01_13_review_b_attempt_2`
- **Verdict:** `PASS`
- **Findings:** `[]`
- **Clean before/after:** `true` / `true`

Recorded commands, all exit code `0`:

1. `Git tuple, artifact-hash, scoped-path and initial canonical-evidence status audit`
2. `.\node_modules\.bin\vitest.cmd run scripts/snart/__tests__/contract-fixtures.test.ts scripts/snart/__tests__/climate-pipeline.test.ts scripts/snart/__tests__/review-gate.test.ts --reporter=verbose`
3. `node --import tsx --input-type=module -e <local fixed-policy, body-override, media-type and error-sanitization probe>`
4. `.\node_modules\.bin\tsx.cmd scripts/snart/validate-climate-pack.ts --fixture-mode --contract .planning/phases/01-planlegg-dagslinjen/01-SNART-AUTONOMY-CONTRACT.json`
5. `.\node_modules\.bin\tsx.cmd scripts/snart/validate-climate-pack.ts --contract .planning/phases/01-planlegg-dagslinjen/01-SNART-AUTONOMY-CONTRACT.json --data-dir src/data/snart`
6. `.\node_modules\.bin\tsx.cmd scripts/snart/validate-climate-pack.ts --reproducibility --cache-dir tmp/snart-climate-source --expected-dir src/data/snart --contract .planning/phases/01-planlegg-dagslinjen/01-SNART-AUTONOMY-CONTRACT.json`
7. `node --import tsx --input-type=module -e <candidate tuple, exact copy, privacy and capability audit>`
8. `Plan and attempt-3 runtime network/storage/analytics/personal-data scope scan`
9. `node --import tsx --input-type=module -e <canonical evidence three-file and alias-guard audit>`
10. `Sequential-request/concurrency construct scan`
11. `Final Git tuple, artifact-hash and canonical-evidence status audit`

Both receipts contain the identical candidate tuple shown above. They satisfy the local gate's structural and consistency rules, but they do not authenticate collaboration provenance:

- `localReceiptsAreNotCryptographicProvenance=true`
- `provenanceAuthenticated=false`

## TDD and Review-Repair Chains

The final monthly-normal implementation and each candidate repair followed RED → GREEN → regenerated evidence:

1. **Contract RED/revision:** `3e51d02`, `75a1ed5`
2. **Contract GREEN:** `2a1edea`
3. **Monthly-normal pipeline RED:** `404f6cf`
4. **Pipeline GREEN and grid-dimension repair:** `a58ebfe`, `274bc10`
5. **First validated production pack:** `93071ef`
6. **Review-gate RED:** `c498f5a`
7. **Review-gate GREEN:** `e934f29`
8. **Attempt 1 findings → attempt 2 RED:** `4f5b30e`
9. **Attempt 2 GREEN:** `83a5c31`
10. **Attempt 2 refreshed production pack:** `5ccfea0`
11. **Attempt 2 findings → attempt 3 RED:** `aafa60c`
12. **Attempt 3 GREEN:** `6d14266`
13. **Attempt 3 refreshed immutable candidate:** `2f510d4`

An earlier fail-closed prototype chain (`b55f97b` → `34da734`, `ce82052` → `82a6dc0`, with review-gate RED `14bca35`) was superseded when the plan was explicitly replanned around the official monthly-normal contract. The later chain above is the reviewed result.

## Candidate Files Created/Modified

- `.planning/phases/01-planlegg-dagslinjen/01-13-PLAN.md` through `01-18-PLAN.md` — preserve downstream dependency, capability and evidence boundaries.
- `.planning/phases/01-planlegg-dagslinjen/01-SNART-AUTONOMOUS-RESEARCH.md` — source and policy research aligned to monthly normals.
- `.planning/phases/01-planlegg-dagslinjen/01-SNART-AUTONOMY-CONTRACT.json` — locked source, request, derivation, privacy, review and publication contract.
- `.planning/phases/01-planlegg-dagslinjen/01-SNART-RULES.md` — exact autonomous implementation rules.
- `scripts/snart/fixtures/met-boundaries-v1.json` — official excerpts plus explicitly synthetic boundary cases.
- `scripts/snart/build-climate-pack.ts` — sequential cache/resume builder with strict source and response validation.
- `scripts/snart/validate-climate-pack.ts` — offline bundle, fixture and two-build reproducibility validator.
- `scripts/snart/review-gate.ts` — actual-HEAD candidate capture, receipt serialization and local tuple validation.
- `scripts/snart/__tests__/contract-fixtures.test.ts` — contract/projection/fixture tests.
- `scripts/snart/__tests__/climate-pipeline.test.ts` — HTTP, schema, UTM, derivation, integrity and atomic-output tests.
- `scripts/snart/__tests__/review-gate.test.ts` — candidate/receipt identity, tuple and attempt-policy tests.
- `src/data/snart/climate-1991-2020-v1.json` — canonical static monthly-normal pack.
- `src/data/snart/climate-1991-2020-v1.manifest.json` — source, response, grid, coverage and build provenance.

## Decisions Made

- Kept all climate acquisition outside the app and runtime. `buildTimeOnly=true`, `runtimeClimateNetwork=false` and `runtimeImportsTooling=false`.
- Preserved all product capabilities as false: `family_sharing=false`, `personal_calibration=false`, `soon_preparation=false`.
- Used a source-derived exact `NO_CITIES` projection rather than a hardcoded builder/validator count; today's validated result happens to be 60.
- Rejected invalid/sea/too-far selected cells as unavailable without a silent neighbor fallback.
- Required a fresh candidate and fresh receipts after every finding; no prior receipt was reused.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Closed source, HTTP and selected-cell binding gaps found during independent review**

- **Found during:** Attempt 1 and attempt 2 independent review
- **Issue:** The reviewers identified boundary cases requiring stronger raw-source threshold validation, fixed request-policy enforcement, exact point-map/UTM binding and stricter response/schema handling.
- **Fix:** Added failing regression tests first, hardened the builder/validator and regenerated the production manifest/pack evidence for each new candidate.
- **Files modified:** `scripts/snart/__tests__/climate-pipeline.test.ts`, `scripts/snart/build-climate-pack.ts`, `src/data/snart/climate-1991-2020-v1.json`, `src/data/snart/climate-1991-2020-v1.manifest.json`
- **Verification:** 38/38 focused tests, production validation, two-build reproducibility, full suite, lint, builds and both attempt-3 review lanes
- **Committed in:** `4f5b30e`, `83a5c31`, `5ccfea0`, `aafa60c`, `6d14266`, `2f510d4`

---

**Total deviations:** 1 auto-fixed correctness/security hardening sequence across two review-repair cycles.

**Impact on plan:** The repairs strengthened the planned fail-closed source boundary without adding packages, credentials, cost, app behavior, runtime networking or product capability.

## Issues Encountered

- Two earlier candidates received review findings and were not reused. Each repair produced a new immutable candidate tuple and required fresh reviews.
- The production refresh used only the already validated local raw cache during final reproduction; no final network fetch was needed.

## Capability, Runtime and Release Boundary

- Product capability flags remain unchanged and false.
- No app/UI file, route, paywall, entitlement, storage schema or runtime import changed.
- No runtime climate API, analytics, logging, backend transport or persistence was introduced.
- No credential, package installation, paid fallback or external service configuration was added.
- No app screenshot, video or other release media was captured.
- No push or deployment was performed.

## Rollback

- A refresh builds into temporary output and replaces committed output only after complete validation. Any refresh error preserves the previous validated pack byte-for-byte.
- Without a validated pack, dependent Snart climate behavior remains unavailable and `soon_preparation` remains false.
- Reverting the Plan 01-13 candidate commits removes the new tooling and data without changing Plans 01-01–01-12.
- The docs/evidence completion commit can be reverted independently; it does not alter the reviewed implementation tuple.

## User Setup Required

None — the committed pack is build-time output and no runtime credentials or external service configuration are required.

## Next Phase Readiness

- The reviewed static climate foundation is ready for Plan 01-14 to consume under the locked capability boundary.
- Plan 01-14 was not started as part of this completion.
- Physical-device, app-media, 90+ visual-score and release approval gates remain pending under the existing project boundary.

## Self-Check: PASSED

The exact attempt-3 tuple, builder/manifest/candidate hashes, 60/60/0 place matrix, source/license/attribution, strict HTTP/schema/UTM checks, two reproduction hashes, complete reviewer identities/commands/verdicts and local-provenance limitation are recorded. The completion changes are documentation/evidence only.

---
*Phase: 01-planlegg-dagslinjen*
*Completed: 2026-07-24*
