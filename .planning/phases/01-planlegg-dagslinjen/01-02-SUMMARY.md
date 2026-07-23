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
  - "One explicit evaluatedAt clock is captured after network validation or at each cache/memory retrieval and drives source currentness plus current-point selection."
  - "Committed-memory evaluation is owned by readMemoryCommit and captured only after forecast revalidation; callers cannot predate truth decisions."
  - "Current extraction selects the unique one-hour interval containing evaluatedAt; array position and period availability never substitute for temporal containment."

patterns-established:
  - "ForecastFetchResult is the only fetch boundary; consumers unwrap result.forecast before extraction."
  - "Coverage sorts a copy by epoch and formats only with an explicit Europe/Oslo Intl formatter."
  - "fetchedAt measures cache age; evaluatedAt measures the truth decision for each returned result."

requirements-completed: [TRUTH-01, EVID-02, GOV-04]

coverage:
  - id: D1
    description: "Backward-compatible validated forecast cache with explicit network, fresh, and stale provenance"
    requirement: TRUTH-01
    verification:
      - kind: unit
        ref: "npm exec -- vitest run src/lib/met-no/__tests__/client.test.ts (82 passed)"
        status: pass
      - kind: other
        ref: "git diff --check c0677c9..7105265 and exact two-path memory-clock repair scope manifest"
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
        ref: "node_modules/.bin/tsc -b --pretty false"
        status: pass
    human_judgment: false
  - id: D3
    description: "Conservative complete-hourly, sampled, gapped, stale, and unavailable coverage in Europe/Oslo"
    requirement: EVID-02
    verification:
      - kind: unit
        ref: "focused four-suite run (111 passed, 1 future-plan TODO)"
        status: pass
      - kind: other
        ref: "npm test && npm run lint && npm run build (678 passed; lint/main/bare build passed)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Immutable high-risk forecast candidate separated from independent verification authority"
    requirement: GOV-04
    verification:
      - kind: other
        ref: "post-validation memory-clock candidate 7105265455ea7da66c4f2146add5df6714ec3979; implementation evidence recorded below"
        status: pass
    human_judgment: true
    rationale: "Repository governance requires a fresh independent high-risk reviewer on the exact candidate SHA; the executor cannot issue that PASS."

duration: 118min
completed: 2026-07-23
status: complete
review_status: passed_two_independent_verdicts
---

# Phase 1 Plan 02: Truthful Forecast Evidence Boundary Summary

**Validated met.no provenance and safe stale recovery feed an atomic weather hook plus fail-closed Europe/Oslo coverage without changing the proxy, cache identity, recommendation engine, or packages.**

## Performance

- **Duration:** 118 min including the post-validation memory clock repair
- **Started:** 2026-07-22T23:18:30+02:00
- **Candidate prepared:** 2026-07-23T11:56:00+02:00
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Added `ForecastFetchResult` and conservative metadata for network, fresh cache, and validated stale fallback while preserving the existing `metno:{lat},{lon}` key, `/api/forecast` proxy, and legacy `{ fetchedAt, data }` reads.
- Added a pure request lifecycle that accepts only the active request ID/fetch key and publishes `now`, hourly/daily views, raw forecast, and matching evidence atomically.
- Added absolute-instant coverage that sorts a copy, rejects invalid/duplicate evidence, distinguishes all five required states, preserves repeated DST-hour ISO identities, and denies strong copy outside fresh exact-hour adjacency.
- Repaired all nine independent-review findings with strict calendar/range/symbol/period validation, bounded stale evidence, invalid-cache eviction, atomic same-key requests, render-key guarding, real cancellation cleanup, explicit offline containment, and weather-only Norwegian copy.
- Replaced whole-payload period assumptions with layered envelope/unit, period-evidence, and usable-point boundaries that accept the current official 87-point compact shape while excluding its terminal instant-only point from extraction and coverage.
- Implemented the accepted `01-02-TIME-CONTRACT-ADR.md`: post-validation network acceptance, per-return cache/memory evaluation, explicit `evaluatedAt`, and unique containing-interval current selection.

## Task Commits

1. **Task 1 RED: Forecast provenance/cache contract** â€” `b5d68a9` (`test`)
2. **Task 1 GREEN: Validated provenance and stale recovery** â€” `bf5c806` (`feat`)
3. **Task 2 RED: Atomic hook and Oslo coverage contract** â€” `3f4304a` (`test`)
4. **Task 2 GREEN: Atomic request state and coverage implementation** â€” `4150a1e` (`feat`)
5. **Repair RED: Reproduce all blocked forecast boundaries** — `3cbaa68` (`test`)
6. **Repair GREEN: Close all blocked forecast boundaries** — `b9b8b51` (`fix`)
7. **Second repair RED: Reproduce residual forecast boundaries** — `9178047` (`test`)
8. **Second repair GREEN: Close residual forecast truth gaps** — `80c6da2` (`fix`)
9. **Architecture RED: Define live-shaped layered-boundary contracts** — `7d17b0e` (`test`)
10. **Architecture GREEN: Layer live forecast validation and coordination** — `2399816` (`refactor`)

11. **Strict P1 RED A: Reproduce stale memory currentness** — `7130886` (`test`)
12. **Strict P1 RED B: Reproduce skipped current forecast point** — `4472888` (`test`)
13. **Strict P1 GREEN: Close memory and current-point findings** — `89e130f` (`fix`)

14. **Unified time contract RED: Ten-case accepted ADR matrix** — `3849e87` (`test`)
15. **Unified time contract GREEN: Explicit evaluation clock and interval selection** — `d2a44d8` (`feat`)
16. **Cache read clock RED: Cross TTL/source/current boundaries during validated storage reads** — `ae0e336` (`test`)
17. **Cache read clock GREEN: Capture cache evaluation after validated storage reads** — `2ac6d04` (`fix`)
18. **Memory clock RED: Cross TTL/source/current boundaries during committed validation** — `640907a` (`test`)
19. **Memory clock GREEN: Capture memory evaluation after forecast validation** — `7105265` (`fix`)

**Plan metadata:** recorded by the final GSD documentation commit.

## Cache and Currentness Matrix

| Input | Network outcome | Result | Currentness consequence |
|---|---|---|---|
| No valid cache | Valid forecast | `network / miss / stale=false` | Acceptance time is captured only after validation and drives source age plus the containing current interval |
| Version 1 or legacy entry at TTL | Not called | `cache / fresh / stale=false` | Stored `fetchedAt` drives TTL while a new `evaluatedAt` drives source age and current selection |
| Valid entry at TTL+1 | Success | Network result | Stale candidate is not preferred over current network evidence |
| Valid entry at TTL+1 through 6 hours | Failure/HTTP/invalid payload | `cache / stale / stale=true` | Explicit offline state only; never legacy recommendation inputs or current/full-span |
| Entry older than 6 hours | Any failure | Error/unavailable | Entry is evicted and never returned |
| Corrupt JSON/envelope/forecast | Success | Network result | Corrupt cache is evicted |
| Corrupt or invalid stale entry | Failure | Error/unavailable | Invalid evidence is never returned |
| Memory commit within TTL | Network failure/obsolete caller | Original result with refreshed evaluation | Original `fetchedAt` is retained; `evaluatedAt` and `sourceUpdatedAt` are recomputed on every return |
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

All executable replacement evidence below ran from a fresh `npm ci` archive checkout of exact candidate `7105265455ea7da66c4f2146add5df6714ec3979`; the primary checkout's pre-existing `node_modules` remained untouched.

- Mandatory unified-contract RED history — **EXPECTED FAIL**, 12 failed, 95 passed, and one TODO before `d2a44d8`.
- Cache-read clock RED history — **EXPECTED FAIL**, 2 failed and 78 skipped before `2ac6d04`.
- Memory clock RED before production changes — **EXPECTED FAIL**, 2 failed and 80 skipped. Failure fallback returned the expired network memory result with `evaluatedAt=09:59:59`/source 04:00, and obsolete-success handling let that expired commit supersede the older valid response after validation reached 10:00:01.
- Focused four-suite Vitest run — **PASS**, 4/4 files; 111 tests passed and one intentional Plan 01-11 TODO.
- `node_modules/.bin/tsc -b --pretty false` — **PASS**.
- `npm test` — **PASS**, 60 files passed, 4 skipped; 678 tests passed, 34 TODO.
- `npm run lint` — **PASS**.
- `npm run build` — **PASS**, TypeScript plus main and bare Vite builds.
- `git diff --check c0677c9..7105265455ea7da66c4f2146add5df6714ec3979` — **PASS**.
- Memory-clock repair scope manifest — **PASS**, exactly `src/lib/met-no/client.ts` and its existing test file changed. No package, UI, product, media, endpoint, schema, recommendation, pricing, RevenueCat, analytics, or unrelated file changed.

## Candidate and Review Authority

| Identity | Lane | Exact candidate | Verdict |
|---|---|---|---|
| Codex GSD executor (original candidate) | High-risk implementation | `4150a1e` | **BLOCKED** by fresh independent verifier and external read-only reviewer |
| Codex GSD executor (first scoped TDD repair) | High-risk implementation | `b9b8b51f0a0972b96706a6e171cda2cba89e00b5` | **BLOCKED** by fresh independent verifier |
| Fresh independent approved reviewer | High-risk verification | `b9b8b51f0a0972b96706a6e171cda2cba89e00b5` | **BLOCK** — six residual correctness findings required a second scoped repair |
| Codex GSD executor (second scoped TDD repair) | High-risk implementation | `80c6da2d929281bf9b38cbb0c7603614c667026a` | `READY_FOR_HIGH_RISK_REVIEW`; deterministic checks green, no self-PASS claimed |
| Fresh independent approved verifier | High-risk verification | `80c6da2d929281bf9b38cbb0c7603614c667026a` | **PASS**, later contradicted by external live-response evidence |
| External read-only reviewer | Live-response architecture review | `80c6da2d929281bf9b38cbb0c7603614c667026a` | **BLOCK** — reproducible P1 schema/unit/cache-coordination failures; strictest verdict wins |
| Codex GSD executor (layered architecture refactor) | High-risk implementation | `23998169ab32c4eff83d4916777d0263a12657cf` | `READY_FOR_HIGH_RISK_REVIEW`; deterministic and ephemeral live checks green, no self-PASS claimed |
| Fresh independent approved reviewer | High-risk verification | `23998169ab32c4eff83d4916777d0263a12657cf` | **BLOCK** — memory fallback retained stale source currentness and current extraction could skip the actual first point |
| Codex GSD executor (strict P1 repair) | High-risk implementation | `89e130f8ac4a4c25380d76b4d47f010c57e7853b` | `READY_FOR_HIGH_RISK_REVIEW`; deterministic checks green, no self-PASS claimed |
| Fresh independent verifier | Goal verification | `89e130f8ac4a4c25380d76b4d47f010c57e7853b` | **PASS** — both requested regressions and the declared plan matrix passed |
| External adversarial reviewer | Equivalent-bypass review | `89e130f8ac4a4c25380d76b4d47f010c57e7853b` | **BLOCK** — request-start currentness and unconstrained wall-clock "now" remain reproducible P1 failures; strictest verdict wins |
| Codex GSD executor (accepted unified time contract) | High-risk implementation | `d2a44d802c2b149bcef39093f58c176187c9ca19` | `READY_FOR_HIGH_RISK_REVIEW`; all deterministic checks green, no self-PASS claimed |
| Strictest independent reviewer | Persistent-cache timing review | `d2a44d802c2b149bcef39093f58c176187c9ca19` | **BLOCK** — cache evaluation was captured before storage retrieval, parse, and structural validation; accepted ADR remains sound |
| Codex GSD executor (post-validation cache clock repair) | High-risk implementation | `2ac6d04c565abe5191d4938aa449a1e51cd84959` | `READY_FOR_HIGH_RISK_REVIEW`; all deterministic checks green, no self-PASS claimed |
| Strictest independent reviewer | Committed-memory timing review | `2ac6d04c565abe5191d4938aa449a1e51cd84959` | **BLOCK** — memory evaluation was captured before committed forecast validation; accepted ADR remains sound |
| Codex GSD executor (post-validation memory clock repair) | High-risk implementation | `7105265455ea7da66c4f2146add5df6714ec3979` | `READY_FOR_HIGH_RISK_REVIEW`; all deterministic checks green, no self-PASS claimed |
| Fresh independent verifier | Goal verification | `7105265455ea7da66c4f2146add5df6714ec3979` | **PASS** — all ten ADR contracts, five producer paths, exact boundaries, live MET and full quality gates verified |
| External adversarial reviewer | Equivalent-bypass review | `7105265455ea7da66c4f2146add5df6714ec3979` | **PASS** — no blocker or warning after slow validation, error-path, concurrency and live-response review |

Candidates `d2a44d802c2b149bcef39093f58c176187c9ca19` and `2ac6d04c565abe5191d4938aa449a1e51cd84959` are rejected by their strictest verdicts. Replacement candidate `7105265455ea7da66c4f2146add5df6714ec3979` preserves the owner-accepted ADR, closes the persistent-read and committed-memory timing gaps, and awaits two independent verdicts; any edit to the repaired code/test paths invalidates it.

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

## External BLOCK and Verifier Disagreement on Candidate 80c6da2

The approved verifier issued PASS on `80c6da2d929281bf9b38cbb0c7603614c667026a`, but an external read-only reviewer subsequently reproduced P1 failures using the shape of the current official live compact response. Under the strictest-verdict rule, the external **BLOCK** is authoritative and the candidate must not advance.

The architectural findings are:

1. Whole-payload validation incorrectly requires period evidence on every point, rejecting an official terminal instant-only point instead of accepting the envelope and excluding unusable extraction/coverage points.
2. Consumed MET fields are accepted without the exact official unit contract, so missing or incompatible units can reach ready/cache state.
3. Same-key coordination can prefer stale storage after a newer validated network success when `localStorage.setItem` fails; the latest validated success must remain an in-memory monotonic commit independent of persistence.

Architecture correction status: **COMPLETE ON CANDIDATE `23998169ab32c4eff83d4916777d0263a12657cf`**. The verifier PASS is retained as history but superseded for `80c6da2` by the live-response BLOCK; the layered candidate is subsequently rejected by the strict P1 BLOCK recorded below.

## Layered Architecture Refactor Outcome

- `7d17b0e` added architectural RED coverage. The isolated RED run failed as expected with 12 failed, 85 passed, and one TODO.
- `2399816` separates exact envelope/unit/instant validation, optional per-point period validation, and usable extraction/coverage filtering. Schema-valid period-less points remain in the accepted raw forecast but cannot supply symbol or precipitation evidence.
- A realistic invented 87-point compact-shaped fixture proves that a terminal instant-only point is accepted and cached while coverage stops at the preceding usable point. Current/hourly extraction uses one-hour points only; daily extraction uses only validated period-bearing points.
- The six consumed fields require exact official units before network or cache data can reach ready state. A defense-in-depth hook guard converts incompatible typed input to an empty error state.
- Per-key coordination stores the newest validated network success in memory before attempting persistence. Obsolete success and failure paths consult that validated memory commit before freshly re-reading validated fresh/stale storage, while older success remains eligible when no newer success committed.
- A read-only live compact response with 87 points and a terminal instant-only point passed both the production type guard and fetch parser. No payload or network-dependent CI test was persisted.

## Strict P1 BLOCK and Repair on Candidate 2399816

Candidate `23998169ab32c4eff83d4916777d0263a12657cf` is independently rejected and must not advance. The strict review reproduced two P1 correctness failures:

1. A validated source that was 5h59 old when a memory commit was created remained marked current after the clock advanced two minutes and network plus storage recovery failed. Memory fallback reused committed metadata instead of recomputing the six-hour source-age boundary at retrieval.
2. `extractNow` selected the first later point with one-hour evidence. If the actual first/current instant was period-less, it could silently publish a later forecast as current weather.

Strict P1 repair status: **COMPLETE ON CANDIDATE `89e130f8ac4a4c25380d76b4d47f010c57e7853b`**. The BLOCK remains authoritative for `2399816`; the repaired candidate requires a fresh independent verdict.

## Strict P1 TDD Repair Outcome

- `7130886` added the first RED regression: source age crosses from 5h59 to 6h01 after a failed persistence write and later network failure. Before GREEN it returned the stale non-null source timestamp.
- `4472888` added the independent second RED regression: a 09:00 instant-only point at -20°C followed by a usable 10:00 point at +15°C. Before GREEN, current extraction incorrectly returned the later point.
- `89e130f` recomputes `sourceUpdatedAt` on every memory-commit retrieval and anchors `extractNow` to `timeseries[0]`. Missing current one-hour evidence now fails closed, while hourly, daily, terminal-point, and coverage filtering may still use later usable points.
- Fresh archive verification of the exact GREEN SHA passed focused/full tests, lint, main and bare builds, TypeScript, diff hygiene, and the exact two-path scope manifest.

## Architecture Escalation on Candidate 89e130f

The fresh verifier passed the two requested regression cases, but the separate adversarial review reproduced two equivalent P1 bypasses:

1. Network source age is evaluated with the request-start timestamp. A response that starts at source age 5h59 and arrives two minutes later can still publish `ready` at a true source age of 6h01.
2. The first forecast point is anchored by array position but not by its relationship to the acceptance clock. A structurally valid 15:00 point can be published as "now" when the wall clock is 09:00.

This is the same currentness-boundary failure class after multiple repairs and a layered refactor. Per the systematic-debugging architecture gate, no further symptom patch is authorized. The next candidate must first replace the implicit time semantics with one explicit acceptance-time contract shared by network receipt, cache retrieval, memory fallback, and current-point extraction.

## Owner-Accepted Unified Time Contract

The owner accepted `01-02-TIME-CONTRACT-ADR.md` on 2026-07-23. Candidate `d2a44d802c2b149bcef39093f58c176187c9ca19` implements that decision without changing hourly, daily, coverage, live MET compatibility, cache identity, units, symbol validation, terminal-point acceptance, or concurrency precedence.

- `ForecastFetchMetadata.evaluatedAt` explicitly records the clock used for each truth decision.
- Network results capture one `acceptedAt` only after response parsing and full validation; it becomes `fetchedAt`, `evaluatedAt`, source-age reference, cache commit time, and current-selection time.
- Persistent cache retains stored `fetchedAt` for TTL/stale age while recomputing `evaluatedAt` and source currentness for every read.
- Memory fallback retains committed `fetchedAt` while recomputing `evaluatedAt` and source currentness for every return.
- `extractNow(forecast, evaluatedAt)` selects exactly one interval satisfying `point.time <= evaluatedAt < point.time + 1h`, then requires valid `next_1_hours`. It contains no internal `Date.now()`.
- The hook passes `metadata.evaluatedAt`; hourly, daily, and coverage extraction remain independent.

### Mandatory RED matrix

All ten accepted cases are executable in the existing Plan 01-02 tests: in-flight source expiry; future-only first point; 09:30 containment; exact 10:00 boundary; cache TTL versus 10:02 evaluation; covering instant without one-hour evidence; memory source-age crossing; network/cache/memory parity; fake-time determinism without internal clock access; and official terminal instant-only containment failure.

`3849e87` committed the complete test-only matrix. Its pre-production focused run failed as expected with 12 failures, 95 passes, and one TODO. `d2a44d8` made the same focused matrix GREEN with 107 passes and one TODO, followed by the complete fresh-archive verification above.

## Persistent Cache Read P1 BLOCK and Repair

The strictest independent verdict **BLOCKED** `d2a44d802c2b149bcef39093f58c176187c9ca19` for one implementation gap while affirming that the accepted ADR remains sound. `fetchForecast` captured the cache evaluation timestamp before `localStorage.getItem`, JSON parsing, and structural forecast validation. A slow synchronous read could therefore cross TTL, source-age, or current-interval boundaries while returning metadata based on the earlier clock.

- `ae0e336` added two test-only RED cases. One crosses 09:59:59→10:00:01 during `getItem` for a 09:00 commit and requires stale fallback. The other crosses the six-hour source boundary plus the 09:00→10:00 current interval during structural validation.
- On `d2a44d8`, both failed for the expected reason: stale data remained `fresh/evaluatedAt=09:59:59`, and source 04:00 plus current point 09:00 remained accepted after validation reached 10:00:01.
- `2ac6d04` makes `readCache` own one final `evaluatedAt` captured only after retrieval, parsing, and successful structural validation. That same timestamp now classifies future commit time, TTL/max-stale age, source currentness, metadata, and downstream current interval on initial and network-fallback reads.
- No tolerance, cache identity, concurrency, storage-isolation, live MET, unit, enum, terminal-point, hourly, daily, or coverage contract changed.

## Memory Validation P1 BLOCK and Repair

The strictest independent verdict **BLOCKED** `2ac6d04c565abe5191d4938aa449a1e51cd84959` for one remaining implementation gap while affirming that the accepted ADR remains sound. Both `readMemoryCommit` call sites captured an evaluation timestamp before the committed forecast was revalidated. A validation getter that advanced the clock could therefore cross TTL, source-age, or current-interval boundaries while memory metadata retained the earlier clock.

- `640907a` added two test-only RED cases covering both memory paths. Each starts committed validation at 09:59:59 and finishes at 10:00:01 for a 09:00 commit, 04:00 source, and 09:00/10:00 points.
- On `2ac6d04`, both failed for the expected reason: failure fallback retained expired network memory with `evaluatedAt=09:59:59` and source 04:00, while obsolete-success handling allowed that expired newer memory commit to supersede the older valid response.
- `7105265` makes `readMemoryCommit` retrieve and validate the committed forecast first, then capture its one internal `evaluatedAt`. The same final timestamp classifies future/TTL age, recomputes `sourceUpdatedAt`, and populates returned metadata.
- Both callers now invoke `readMemoryCommit(key)` without a pre-captured timestamp. Persistent cache and network producers retain their own post-retrieval/parse/validation clocks.
- No ADR, tolerance, cache identity, concurrency, storage-isolation, live MET, unit, enum, terminal-point, hourly, daily, or coverage contract changed.

## Decisions Made

- Invalid `sourceUpdatedAt`, inconsistent metadata, invalid/duplicate points, empty points, or a future cache timestamp fail closed instead of being normalized into current evidence.
- A uniform integral cadence above one hour is `sampled`; any irregular cadence (including 61 minutes) is `gapped`; only exact one-hour absolute adjacency is `complete-hourly`.
- Repeated Oslo fall-back hours remain separate because ISO strings and epochs are authoritative; local labels are presentation only.
- A new request clears cross-key weather/evidence and only the active request ID plus exact fetch key may publish a resolved or rejected state.
- Stale cache evidence is bounded to six hours and contained in an explicit `offline` state with `offlineForecast`; legacy ready-state weather inputs remain empty.
- MET envelopes require exact consumed units, plausible instant ranges, and strictly increasing unique instants; any present period must validate, while period-less schema points remain accepted but unusable for symbol/precipitation extraction or coverage.
- `precipMmH` requires one-hour evidence for current/hourly inputs; supported six-hour evidence carries duration explicitly and is divided by six before any hourly-rate field is published.
- Request start order does not invalidate data by itself; only a newer successfully committed result supersedes an older valid same-key success.
- Symbol validation is a closed exact match against the 83-value primary MET Swagger enum rather than a derived base/suffix grammar.
- Latest validated per-key network success is committed in memory before persistence and wins failure fallback over freshly re-read validated storage.
- `fetchedAt` is cache-age evidence only; `evaluatedAt` is the decision clock for source currentness and current-point selection.
- Network acceptance occurs after parsing and validation, never at request start.
- Persistent cache evaluation is captured by `readCache` after storage retrieval, JSON parsing, and structural validation, never by its caller before the read.
- Committed-memory evaluation is captured by `readMemoryCommit` only after `isMetForecast` revalidation; callers cannot predate TTL, source-currentness, or current-interval decisions.
- “Now” is the unique one-hour interval containing `evaluatedAt`; array position and later period availability cannot substitute for temporal containment.

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

**3. [Rule 4 - Architecture] Replaced whole-payload validation after live-response BLOCK**
- **Found during:** External live-response review of verifier-PASS candidate `80c6da2d929281bf9b38cbb0c7603614c667026a`
- **Issue:** The official 87-point compact shape ends with a valid instant-only point, consumed units were not enforced, and persistence failure could let stale storage outrank a newer validated in-memory result.
- **Fix:** With explicit architecture-correction authority, added RED coverage in `7d17b0e` and refactored envelope/units, optional period evidence, usable-point selection, hook defense, and per-key coordination in `2399816`.
- **Files modified:** Four plan-owned source/test paths.
- **Commits:** `7d17b0e`, `2399816`

**4. [Rule 1 - Bugs] Repaired two strict P1 review findings**
- **Found during:** Strict independent review of layered candidate `23998169ab32c4eff83d4916777d0263a12657cf`
- **Issue:** Memory fallback could retain source currentness after the source crossed the six-hour limit, and `extractNow` could skip an actual period-less current point in favor of a later forecast.
- **Fix:** Added separate RED commits `7130886` and `4472888`, then recomputed source currentness per retrieval and anchored current extraction to the first forecast instant in `89e130f`.
- **Files modified:** `src/lib/met-no/client.ts` and `src/lib/met-no/__tests__/client.test.ts`.
- **Commits:** `7130886`, `4472888`, `89e130f`

**5. [Rule 4 - Architecture] Implemented the owner-approved unified time contract**
- **Found during:** Equivalent-bypass review of candidate `89e130f8ac4a4c25380d76b4d47f010c57e7853b`
- **Issue:** Request-start source age and array-position current selection left the same P1 failure class reachable.
- **Decision:** Owner accepted `01-02-TIME-CONTRACT-ADR.md`, authorizing one explicit post-validation/retrieval clock across network, persistent cache, memory, hook, and current extraction.
- **Fix:** Added the ten-case RED matrix in `3849e87`, then implemented explicit `evaluatedAt` and unique interval containment in `d2a44d8`.
- **Files modified:** Seven original Plan 01-02 source/test paths; `src/lib/planning/coverage.ts` required no change.
- **Commits:** `3849e87`, `d2a44d8`

**6. [Rule 1 - Bug] Closed the persistent-cache read timing gap**
- **Found during:** Strictest independent review of candidate `d2a44d802c2b149bcef39093f58c176187c9ca19`
- **Issue:** Cache evaluation was captured before synchronous storage retrieval, parse, and validation, allowing TTL/source/current interval decisions to use an obsolete timestamp.
- **Fix:** Added clock-advancing RED coverage in `ae0e336`, then moved ownership of the one final cache evaluation timestamp into `readCache` in `2ac6d04`.
- **Files modified:** `src/lib/met-no/client.ts` and `src/lib/met-no/__tests__/client.test.ts`.
- **Commits:** `ae0e336`, `2ac6d04`

**7. [Rule 1 - Bug] Closed the committed-memory validation timing gap**
- **Found during:** Strictest independent review of candidate `2ac6d04c565abe5191d4938aa449a1e51cd84959`
- **Issue:** Memory evaluation was captured before committed forecast validation, allowing TTL/source/current interval decisions to retain an obsolete timestamp.
- **Fix:** Added clock-advancing RED coverage for both `readMemoryCommit` paths in `640907a`, then moved ownership of the one final memory evaluation timestamp into `readMemoryCommit` after validation in `7105265`.
- **Files modified:** `src/lib/met-no/client.ts` and `src/lib/met-no/__tests__/client.test.ts`.
- **Commits:** `640907a`, `7105265`

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
- The external reviewer and approved verifier disagreed on `80c6da2`; the reproducible live-response P1 evidence overrode PASS. The correction used a synthetic CI fixture plus one non-persisted official live probe on the new exact candidate.

## User Setup Required

None - no dependency, package, credential, environment, service, API, or migration change is required.

## Remaining Gates

- Architecture decision for one explicit acceptance-time/current-point contract: **APPROVED**.
- Accepted decision and ten-case RED matrix: `01-02-TIME-CONTRACT-ADR.md` and commit `3849e87`.
- Unified-contract candidate `d2a44d802c2b149bcef39093f58c176187c9ca19`: **BLOCKED** by the persistent-cache timing verdict.
- Post-validation cache-clock candidate `2ac6d04c565abe5191d4938aa449a1e51cd84959`: **BLOCKED** by the committed-memory timing verdict.
- Post-validation memory-clock repair on exact candidate `7105265455ea7da66c4f2146add5df6714ec3979`: **APPROVED**.
- Fresh independent goal-verification verdict on the exact candidate: **PASS**.
- Fresh external adversarial/equivalent-bypass verdict on the exact candidate: **PASS**.
- New app screenshots/video/traces and the media-based 90+ audit: **Pending stable candidate and owner permission**; none were created here.
- VoiceOver, TalkBack, physical haptics, OS text scaling, one-handed reach, physical-device UAT, and owner release approval: **Pending**.
- Six Snart approvals and independent climate artifacts remain Pending and still block Plan 01-13.

## Next Phase Readiness

- Original code candidate `4150a1e` remains blocked and must not be consumed by Plan 01-03.
- First repaired candidate `b9b8b51f0a0972b96706a6e171cda2cba89e00b5` also remains blocked.
- Second repaired candidate `80c6da2d929281bf9b38cbb0c7603614c667026a` is blocked by the authoritative external live-response verdict despite its verifier PASS.
- Layered architecture candidate `23998169ab32c4eff83d4916777d0263a12657cf` is blocked by the strict P1 verdict.
- Strict P1 repair candidate `89e130f8ac4a4c25380d76b4d47f010c57e7853b` is blocked by the authoritative equivalent-bypass review.
- Unified time-contract candidate `d2a44d802c2b149bcef39093f58c176187c9ca19` is blocked by the strictest persistent-cache timing verdict.
- Post-validation cache-clock candidate `2ac6d04c565abe5191d4938aa449a1e51cd84959` is blocked by the strictest committed-memory timing verdict.
- Post-validation memory-clock candidate `7105265455ea7da66c4f2146add5df6714ec3979` has two independent PASS verdicts.
- Plan 01-03 may start from this immutable approved boundary.

## Self-Check: PASSED

All eight plan-owned paths, accepted ADR, summary, memory-clock RED commit `640907a`, and GREEN candidate `7105265455ea7da66c4f2146add5df6714ec3979` exist. Both committed-memory paths are covered, the exact repair scope passed focused/full/lint/build/type-check/diff checks in fresh archives, and two independent reviewers returned PASS. Plan 01-02 is complete.

---
*Phase: 01-planlegg-dagslinjen*
*Candidate prepared: 2026-07-23*
