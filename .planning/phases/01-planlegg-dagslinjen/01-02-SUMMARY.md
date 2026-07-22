---
phase: 01-planlegg-dagslinjen
plan: "02"
subsystem: forecast-truth
tags: [met-no, cache-provenance, stale-recovery, react-hook, europe-oslo, dst, tdd]

requires:
  - phase: 01-planlegg-dagslinjen
    plan: "01"
    provides: Frozen forecast clocks, validity fixtures, pending evidence contracts, and no-media harness
provides:
  - Validated forecast result envelopes with explicit network/fresh-cache/stale-cache provenance
  - Atomic latest-request-only WeatherState publication with matching forecast evidence
  - Conservative Europe/Oslo coverage classification preserving absolute ISO identity across DST
affects: [01-03-change-events, 01-07-planlegg-composition, 01-11-cache-scope, forecast-currentness]

tech-stack:
  added: []
  patterns: [validated legacy-compatible cache envelope, request-id reducer, absolute-instant coverage]

key-files:
  created:
    - src/hooks/__tests__/useWeather.test.ts
    - src/lib/planning/coverage.ts
  modified:
    - src/lib/met-no/types.ts
    - src/lib/met-no/client.ts
    - src/lib/met-no/__tests__/client.test.ts
    - src/hooks/useWeather.ts
    - src/lib/planning/__tests__/forecast-evidence.test.ts
    - src/lib/planning/__tests__/timezone.test.ts

key-decisions:
  - "Forecast currentness fails closed: invalid metadata or points are unavailable, and only internally consistent fresh metadata can support complete-hourly wording."
  - "The cache key and proxy URL remain unchanged; writes use a version-1 envelope while valid unversioned legacy entries remain readable."
  - "useWeather clears cross-key data on start and publishes forecast derivatives plus matching evidence through one request-ID-gated state transition."

patterns-established:
  - "ForecastFetchResult is the only fetch boundary; consumers unwrap result.forecast before extraction."
  - "Coverage sorts a copy by epoch and formats only with an explicit Europe/Oslo Intl formatter."

requirements-completed: [TRUTH-01, EVID-02, GOV-04]

coverage:
  - id: D1
    description: "Backward-compatible validated forecast cache with explicit network, fresh, and stale provenance"
    requirement: TRUTH-01
    verification:
      - kind: unit
        ref: "npm exec -- vitest run src/lib/met-no/__tests__/client.test.ts (59 passed)"
        status: pass
      - kind: other
        ref: "git diff --check 6959443..80c6da2 and exact five-path second-repair scope manifest"
        status: pass
    human_judgment: false
  - id: D2
    description: "Atomic latest-request-only WeatherState with forecast and matching evidence"
    requirement: TRUTH-01
    verification:
      - kind: unit
        ref: "src/hooks/__tests__/useWeather.test.ts#keeps the newer fetch key when promises deliberately resolve in reverse order"
        status: pass
      - kind: other
        ref: "npx tsc -b --pretty false"
        status: pass
    human_judgment: false
  - id: D3
    description: "Conservative complete-hourly, sampled, gapped, stale, and unavailable coverage in Europe/Oslo"
    requirement: EVID-02
    verification:
      - kind: unit
        ref: "focused four-suite run (86 passed, 1 future-plan TODO)"
        status: pass
      - kind: other
        ref: "npm test && npm run lint && npm run build (653 passed; lint/main/bare build passed)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Immutable high-risk forecast candidate separated from independent verification authority"
    requirement: GOV-04
    verification:
      - kind: other
        ref: "second repaired code candidate 80c6da2d929281bf9b38cbb0c7603614c667026a; implementation evidence recorded below"
        status: pass
    human_judgment: true
    rationale: "Repository governance requires a fresh independent high-risk reviewer on the exact candidate SHA; the executor cannot issue that PASS."

duration: 67min
completed: 2026-07-22
status: complete
review_status: ready_for_high_risk_review
---

# Phase 1 Plan 02: Truthful Forecast Evidence Boundary Summary

**Validated met.no provenance and safe stale recovery feed an atomic weather hook plus fail-closed Europe/Oslo coverage without changing the proxy, cache identity, recommendation engine, or packages.**

## Performance

- **Duration:** 67 min including two independent BLOCK repair rounds
- **Started:** 2026-07-22T23:18:30+02:00
- **Completed:** 2026-07-23T00:25:30+02:00
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Added `ForecastFetchResult` and conservative metadata for network, fresh cache, and validated stale fallback while preserving the existing `metno:{lat},{lon}` key, `/api/forecast` proxy, and legacy `{ fetchedAt, data }` reads.
- Added a pure request lifecycle that accepts only the active request ID/fetch key and publishes `now`, hourly/daily views, raw forecast, and matching evidence atomically.
- Added absolute-instant coverage that sorts a copy, rejects invalid/duplicate evidence, distinguishes all five required states, preserves repeated DST-hour ISO identities, and denies strong copy outside fresh exact-hour adjacency.
- Repaired all nine independent-review findings with strict calendar/range/symbol/period validation, bounded stale evidence, invalid-cache eviction, atomic same-key requests, render-key guarding, real cancellation cleanup, explicit offline containment, and weather-only Norwegian copy.

## Task Commits

1. **Task 1 RED: Forecast provenance/cache contract** â€” `b5d68a9` (`test`)
2. **Task 1 GREEN: Validated provenance and stale recovery** â€” `bf5c806` (`feat`)
3. **Task 2 RED: Atomic hook and Oslo coverage contract** â€” `3f4304a` (`test`)
4. **Task 2 GREEN: Atomic request state and coverage implementation** â€” `4150a1e` (`feat`)
5. **Repair RED: Reproduce all blocked forecast boundaries** — `3cbaa68` (`test`)
6. **Repair GREEN: Close all blocked forecast boundaries** — `b9b8b51` (`fix`)
7. **Second repair RED: Reproduce residual forecast boundaries** — `9178047` (`test`)
8. **Second repair GREEN: Close residual forecast truth gaps** — `80c6da2` (`fix`)

**Plan metadata:** recorded by the final GSD documentation commit.

## Cache and Currentness Matrix

| Input | Network outcome | Result | Currentness consequence |
|---|---|---|---|
| No valid cache | Valid forecast | `network / miss / stale=false` | Eligible for complete-hourly only with valid `updated_at` and exact adjacency |
| Version 1 or legacy entry at TTL | Not called | `cache / fresh / stale=false` | Eligible under the same evidence rules |
| Valid entry at TTL+1 | Success | Network result | Stale candidate is not preferred over current network evidence |
| Valid entry at TTL+1 through 6 hours | Failure/HTTP/invalid payload | `cache / stale / stale=true` | Explicit offline state only; never legacy recommendation inputs or current/full-span |
| Entry older than 6 hours | Any failure | Error/unavailable | Entry is evicted and never returned |
| Corrupt JSON/envelope/forecast | Success | Network result | Corrupt cache is evicted |
| Corrupt or invalid stale entry | Failure | Error/unavailable | Invalid evidence is never returned |
| Missing/blank/malformed `updated_at` | Any otherwise valid source | `sourceUpdatedAt: null` | Coverage is `unavailable`; currentness claim denied |

## Files Created/Modified

- `src/lib/met-no/types.ts` â€” Forecast result/currentness types and strict absolute-ISO calendar parser.
- `src/lib/met-no/client.ts` â€” Range/symbol/timeline validation, bounded legacy/versioned cache recovery, eviction, and per-key request atomicity.
- `src/lib/met-no/__tests__/client.test.ts` â€” Exact TTL, validation, proxy/key, network and stale matrix.
- `src/hooks/useWeather.ts` â€” Pure request reducer, render-key guard, real cancellable lifecycle, explicit offline containment, and nullable evidence.
- `src/hooks/__tests__/useWeather.test.ts` â€” Extractor boundary, atomic publication, reversed promise, and rejection tests.
- `src/lib/planning/coverage.ts` â€” Europe/Oslo absolute-instant assessment and conservative weather-only copy.
- `src/lib/planning/__tests__/forecast-evidence.test.ts` â€” Currentness and five-state evidence assertions.
- `src/lib/planning/__tests__/timezone.test.ts` â€” Normal day, spring gap, repeated fall hour, mixed offsets, and local-day boundaries.

## Deterministic Evidence

All executable evidence below ran from a fresh `npm ci` archive checkout of exact candidate `80c6da2d929281bf9b38cbb0c7603614c667026a`; the primary checkout's pre-existing `node_modules` remained untouched because active Vite/Playwright processes held its native binaries.

- Focused four-suite Vitest run — **PASS**, 4/4 files; 86 tests passed and one intentional Plan 01-11 TODO.
- `npx tsc -b --pretty false` — **PASS**.
- `npm test` — **PASS**, 60 files passed, 4 skipped; 653 tests passed, 34 TODO.
- `npm run lint` — **PASS**.
- `npm run build` — **PASS**, TypeScript plus main and bare Vite builds.
- Primary MET Swagger enum comparison — **PASS**, all 83 implemented symbol codes exactly match `definitions.WeatherSymbol.enum` from `https://api.met.no/weatherapi/locationforecast/2.0/swagger`.
- Mojibake scan across all four production paths — **PASS**, no `Ã` or `Â` remnants.
- `git diff --check 6959443..80c6da2` — **PASS**.
- Second-repair scope manifest — **PASS**, exactly five Plan 01-02 paths changed. No package, UI, product, media, endpoint, schema, recommendation, pricing, RevenueCat, analytics, or unrelated file changed.

## Candidate and Review Authority

| Identity | Lane | Exact candidate | Verdict |
|---|---|---|---|
| Codex GSD executor (original candidate) | High-risk implementation | `4150a1e` | **BLOCKED** by fresh independent verifier and external read-only reviewer |
| Codex GSD executor (first scoped TDD repair) | High-risk implementation | `b9b8b51f0a0972b96706a6e171cda2cba89e00b5` | **BLOCKED** by fresh independent verifier |
| Fresh independent approved reviewer | High-risk verification | `b9b8b51f0a0972b96706a6e171cda2cba89e00b5` | **BLOCK** — six residual correctness findings required a second scoped repair |
| Codex GSD executor (second scoped TDD repair) | High-risk implementation | `80c6da2d929281bf9b38cbb0c7603614c667026a` | `READY_FOR_HIGH_RISK_REVIEW`; deterministic checks green, no self-PASS claimed |
| Fresh independent approved reviewer | High-risk verification | `80c6da2d929281bf9b38cbb0c7603614c667026a` | **PENDING** — fresh verdict required on the second repaired exact SHA |

Any edit to the eight code/test paths after `80c6da2d929281bf9b38cbb0c7603614c667026a` invalidates this candidate and requires fresh evidence plus independent review.

## Independent BLOCK on Candidate 4150a1e

Candidate `4150a1e` is rejected and must not advance. Both the fresh independent high-risk verifier and the external read-only reviewer issued **BLOCK**. Their findings are:

1. A render after a weather key change can expose the previous place's weather/evidence until the effect starts.
2. Regex plus `Date.parse` accepts impossible ISO calendar dates such as `2026-02-30`.
3. Norwegian attribution and coverage copy contain mojibake.
4. Invalid cache entries are ignored but not evicted.
5. The tests do not execute the real cancellation cleanup path.
6. Stale fallback is surfaced as ordinary `ready`, allowing legacy consumers that ignore evidence to use arbitrarily old weather.
7. Forecast validation lacks required ranges, known symbols, strictly chronological uniqueness, mandatory period evidence, and conservative source-time currentness policy.
8. Concurrent requests can overwrite or return obsolete per-key cache snapshots.
9. `formatCoverageCopy` asserts `Samme antrekk` without recommendation fingerprint/event evidence even though it only knows weather coverage.

Repair status: **COMPLETE ON CANDIDATE `b9b8b51f0a0972b96706a6e171cda2cba89e00b5`**. The original BLOCK remains authoritative for `4150a1e`; no independent PASS exists yet for the repaired candidate.

## Scoped TDD Repair Outcome

- `3cbaa68` added behavioral RED coverage for all nine findings. In the isolated environment the RED run failed as expected with 31 failed, 40 passed, and one TODO.
- `b9b8b51` made the same tests GREEN: strict ISO calendar and MET payload validation; six-hour stale/source-age ceilings; five-minute source future-skew; invalid-cache eviction; per-key success/success and success/failure atomicity; no synthesized clear/dry evidence; render-before-effect key containment; real lifecycle cleanup; explicit non-ready offline state; and weather-only correctly encoded Norwegian copy.
- The repaired focused run passed 71 tests with one intentional TODO, followed by the complete deterministic matrix above.

## Second Independent BLOCK on Candidate b9b8b51

Candidate `b9b8b51f0a0972b96706a6e171cda2cba89e00b5` is independently rejected and must not advance. The residual findings are:

1. `next_6_hours.precipitation_amount` is a six-hour total but can be exposed directly as hourly precipitation.
2. Missing or invalid `sourceUpdatedAt` can still publish ordinary `ready` legacy weather despite unavailable coverage.
3. A newer same-key failure can cause an older valid success to be discarded when no newer valid result committed, including stale-cache variants.
4. The symbol validator is not the exact official MET Locationforecast enum and misses official double-s spellings/suffix constraints.
5. An empty-string cache value is treated like a miss instead of corrupt data that must be evicted.
6. One mojibake source comment remains.

Second repair status: **COMPLETE ON CANDIDATE `80c6da2d929281bf9b38cbb0c7603614c667026a`**. Both earlier BLOCK verdicts remain authoritative for their exact candidates; no independent PASS exists yet for the second repaired candidate.

## Second Scoped TDD Repair Outcome

- `9178047` added behavioral RED coverage for all six residual findings. The isolated RED run failed as expected with 13 failed, 73 passed, and one TODO.
- `80c6da2` made the same tests GREEN: current/hourly inputs require truthful one-hour period evidence; six-hour totals carry explicit duration and normalize to hourly averages where supported; null/invalid source currentness is contained offline; an older valid success may commit unless a newer valid success actually committed; cache fallback re-reads current storage; empty-string cache data is evicted; and the final mojibake comment is repaired.
- The validator now uses the exact 83-value primary MET Locationforecast Swagger enum, including the official `lightssleet...` and `lightssnow...` double-s spellings and exact suffix constraints. An automated source-to-Swagger comparison passed 83/83.
- The repaired focused run passed 86 tests with one intentional TODO, followed by the complete fresh-checkout matrix above.

## Decisions Made

- Invalid `sourceUpdatedAt`, inconsistent metadata, invalid/duplicate points, empty points, or a future cache timestamp fail closed instead of being normalized into current evidence.
- A uniform integral cadence above one hour is `sampled`; any irregular cadence (including 61 minutes) is `gapped`; only exact one-hour absolute adjacency is `complete-hourly`.
- Repeated Oslo fall-back hours remain separate because ISO strings and epochs are authoritative; local labels are presentation only.
- A new request clears cross-key weather/evidence and only the active request ID plus exact fetch key may publish a resolved or rejected state.
- Stale cache evidence is bounded to six hours and contained in an explicit `offline` state with `offlineForecast`; legacy ready-state weather inputs remain empty.
- MET evidence must have plausible numeric ranges, a known symbol, at least one forecast period, and strictly increasing unique instants before caching or extraction.
- `precipMmH` requires one-hour evidence for current/hourly inputs; supported six-hour evidence carries duration explicitly and is divided by six before any hourly-rate field is published.
- Request start order does not invalidate data by itself; only a newer successfully committed result supersedes an older valid same-key success.
- Symbol validation is a closed exact match against the 83-value primary MET Swagger enum rather than a derived base/suffix grammar.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bugs] Repaired nine independent high-risk review findings**
- **Found during:** Independent review of original candidate `4150a1e`
- **Issue:** Cross-key render leakage, impossible ISO acceptance, mojibake, retained corrupt cache, untested real cleanup, unbounded ready-state stale fallback, weak MET/currentness validation, non-atomic same-key cache writes, and recommendation copy unsupported by weather-only evidence.
- **Fix:** Added behavioral RED coverage in `3cbaa68`, then implemented the bounded repair in `b9b8b51` and repeated the complete isolated verification matrix.
- **Files modified:** Seven plan-owned source/test paths; `timezone.test.ts` required no edit.
- **Commits:** `3cbaa68`, `b9b8b51`

**2. [Rule 1 - Bugs] Repaired six residual independent-review findings**
- **Found during:** Independent review of first repaired candidate `b9b8b51f0a0972b96706a6e171cda2cba89e00b5`
- **Issue:** Six-hour totals leaked into hourly-rate fields, invalid source currentness still published ready weather, newer failure could suppress the only valid older response, symbol validation differed from the official enum, empty cache was not evicted, and one mojibake comment remained.
- **Fix:** Added behavioral RED coverage in `9178047`, implemented the bounded correction in `80c6da2`, compared all 83 symbol values to primary Swagger, and repeated the complete fresh-checkout verification matrix.
- **Files modified:** Five plan-owned source/test paths.
- **Commits:** `9178047`, `80c6da2`

## Known Stubs

- `src/lib/planning/__tests__/forecast-evidence.test.ts` retains one intentional TODO for fixed/manual persistent cache versus future memory-only automatic scope. Plan 01-11 owns that behavior; it does not prevent this plan's provenance/currentness boundary from operating.

No production stub was introduced.

## Threat Flags

None. The existing proxy and persistent cache path remain unchanged; no new network endpoint, auth path, schema, logging, or trust-boundary file access was added.

## Issues Encountered

- Task 1's new return envelope intentionally made `useWeather` fail type-check until Task 2 completed the planned atomic unwrap. The Task 2 GREEN commit closed that within the same TDD plan; final type-check, tests, lint, and builds are green.
- One large mechanical patch missed context because the existing Norwegian comments had encoding differences. It applied no partial change; the same planned implementation was applied through narrower patches.
- The primary checkout's dependency tree was incomplete and its native rolldown binary was locked by pre-existing active Vite/Playwright processes. No process was killed and no user artifact was touched; verification ran from a fresh archive checkout of the exact repaired SHA with `npm ci`.
- Fresh `npm ci` reported pre-existing dependency audit findings (1 low, 3 moderate, 9 high, 1 critical). Dependency changes are outside this scoped repair and no package manifest or lockfile was changed.

## User Setup Required

None - no dependency, package, credential, environment, service, API, or migration change is required.

## Remaining Gates

- Fresh independent high-risk review on exact second repaired code candidate `80c6da2d929281bf9b38cbb0c7603614c667026a`: **PENDING**. The executor does not self-issue PASS.
- New app screenshots/video/traces and the media-based 90+ audit: **Pending stable candidate and owner permission**; none were created here.
- VoiceOver, TalkBack, physical haptics, OS text scaling, one-handed reach, physical-device UAT, and owner release approval: **Pending**.
- Six Snart approvals and independent climate artifacts remain Pending and still block Plan 01-13.

## Next Phase Readiness

- Original code candidate `4150a1e` remains blocked and must not be consumed by Plan 01-03.
- First repaired candidate `b9b8b51f0a0972b96706a6e171cda2cba89e00b5` also remains blocked.
- Second repaired candidate `80c6da2d929281bf9b38cbb0c7603614c667026a` is ready for fresh independent high-risk review; Plan 01-03 must wait for that verdict.

## Self-Check: PASSED

All eight plan-owned paths, this summary, original commits `b5d68a9`, `bf5c806`, `3f4304a`, `4150a1e`, BLOCK records `32e84b8`, `6959443`, and repair commits `3cbaa68`, `b9b8b51`, `9178047`, `80c6da2` exist and were verified. The exact five-path second-repair scope and immutable SHA passed focused/full/lint/build/type-check/enum/mojibake checks; independent review remains pending.

---
*Phase: 01-planlegg-dagslinjen*
*Completed: 2026-07-22*
