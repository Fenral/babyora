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
        ref: "npx vitest run src/lib/met-no/__tests__/client.test.ts (29 passed)"
        status: pass
      - kind: other
        ref: "git diff --check db31b86..4150a1e and exact eight-path scope manifest"
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
        ref: "npx vitest run src/hooks/__tests__/useWeather.test.ts src/lib/planning/__tests__/forecast-evidence.test.ts src/lib/planning/__tests__/timezone.test.ts (20 passed, 1 future-plan TODO)"
        status: pass
      - kind: other
        ref: "npm test && npm run lint && npm run build (616 passed; lint/main/bare build passed)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Immutable high-risk forecast candidate separated from independent verification authority"
    requirement: GOV-04
    verification:
      - kind: other
        ref: "code candidate 4150a1e; implementation evidence recorded below"
        status: pass
    human_judgment: true
    rationale: "Repository governance requires a fresh independent high-risk reviewer on the exact candidate SHA; the executor cannot issue that PASS."

duration: 15min
completed: 2026-07-22
status: complete
---

# Phase 1 Plan 02: Truthful Forecast Evidence Boundary Summary

**Validated met.no provenance and safe stale recovery feed an atomic weather hook plus fail-closed Europe/Oslo coverage without changing the proxy, cache identity, recommendation engine, or packages.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-22T23:18:30+02:00
- **Completed:** 2026-07-22T23:33:30+02:00
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Added `ForecastFetchResult` and conservative metadata for network, fresh cache, and validated stale fallback while preserving the existing `metno:{lat},{lon}` key, `/api/forecast` proxy, and legacy `{ fetchedAt, data }` reads.
- Added a pure request lifecycle that accepts only the active request ID/fetch key and publishes `now`, hourly/daily views, raw forecast, and matching evidence atomically.
- Added absolute-instant coverage that sorts a copy, rejects invalid/duplicate evidence, distinguishes all five required states, preserves repeated DST-hour ISO identities, and denies strong copy outside fresh exact-hour adjacency.

## Task Commits

1. **Task 1 RED: Forecast provenance/cache contract** â€” `b5d68a9` (`test`)
2. **Task 1 GREEN: Validated provenance and stale recovery** â€” `bf5c806` (`feat`)
3. **Task 2 RED: Atomic hook and Oslo coverage contract** â€” `3f4304a` (`test`)
4. **Task 2 GREEN: Atomic request state and coverage implementation** â€” `4150a1e` (`feat`)

**Plan metadata:** recorded by the final GSD documentation commit.

## Cache and Currentness Matrix

| Input | Network outcome | Result | Currentness consequence |
|---|---|---|---|
| No valid cache | Valid forecast | `network / miss / stale=false` | Eligible for complete-hourly only with valid `updated_at` and exact adjacency |
| Version 1 or legacy entry at TTL | Not called | `cache / fresh / stale=false` | Eligible under the same evidence rules |
| Valid entry at TTL+1 | Success | Network result | Stale candidate is not preferred over current network evidence |
| Valid entry at TTL+1 | Failure/HTTP/invalid payload | `cache / stale / stale=true` | Offline/partial wording only; never current/full-span |
| Corrupt JSON/envelope/forecast | Success | Network result | Corrupt cache is ignored |
| Corrupt or invalid stale entry | Failure | Error/unavailable | Invalid evidence is never returned |
| Missing/blank/malformed `updated_at` | Any otherwise valid source | `sourceUpdatedAt: null` | Coverage is `unavailable`; currentness claim denied |

## Files Created/Modified

- `src/lib/met-no/types.ts` â€” Forecast result and currentness metadata types.
- `src/lib/met-no/client.ts` â€” Runtime validation, legacy/versioned cache classification, and stale fallback.
- `src/lib/met-no/__tests__/client.test.ts` â€” Exact TTL, validation, proxy/key, network and stale matrix.
- `src/hooks/useWeather.ts` â€” Pure request reducer, result unwrap, cancellation guard, and nullable evidence.
- `src/hooks/__tests__/useWeather.test.ts` â€” Extractor boundary, atomic publication, reversed promise, and rejection tests.
- `src/lib/planning/coverage.ts` â€” Europe/Oslo absolute-instant assessment and conservative copy.
- `src/lib/planning/__tests__/forecast-evidence.test.ts` â€” Currentness and five-state evidence assertions.
- `src/lib/planning/__tests__/timezone.test.ts` â€” Normal day, spring gap, repeated fall hour, mixed offsets, and local-day boundaries.

## Deterministic Evidence

- `npx vitest run src/lib/met-no/__tests__/client.test.ts` â€” **PASS**, 29/29.
- `npx vitest run src/hooks/__tests__/useWeather.test.ts src/lib/planning/__tests__/forecast-evidence.test.ts src/lib/planning/__tests__/timezone.test.ts` â€” **PASS**, 20 passed and one intentional Plan 01-11 TODO.
- `npx tsc -b --pretty false` â€” **PASS**.
- `npm test` â€” **PASS**, 60 files passed, 4 skipped; 616 tests passed, 34 TODO.
- `npm run lint` â€” **PASS**.
- `npm run build` â€” **PASS**, TypeScript plus main and bare Vite builds.
- `git diff --check db31b86..4150a1e` â€” **PASS**.
- Scope manifest â€” **PASS**, exactly the eight Plan 01-02 paths; no package, UI, product, media, endpoint, schema, recommendation, pricing, RevenueCat, analytics, or unrelated file changed.

## Candidate and Review Authority

| Identity | Lane | Exact candidate | Verdict |
|---|---|---|---|
| Codex GSD executor (this session) | High-risk implementation | `4150a1e` | `READY_FOR_HIGH_RISK_REVIEW`; deterministic checks green, no self-PASS claimed |
| Fresh independent approved reviewer | High-risk verification | `4150a1e` | **PENDING** â€” neither PASS nor BLOCK has been issued yet |

Any edit to the eight code/test paths after `4150a1e` invalidates this candidate and requires fresh evidence plus independent review.

## Decisions Made

- Invalid `sourceUpdatedAt`, inconsistent metadata, invalid/duplicate points, empty points, or a future cache timestamp fail closed instead of being normalized into current evidence.
- A uniform integral cadence above one hour is `sampled`; any irregular cadence (including 61 minutes) is `gapped`; only exact one-hour absolute adjacency is `complete-hourly`.
- Repeated Oslo fall-back hours remain separate because ISO strings and epochs are authoritative; local labels are presentation only.
- A new request clears cross-key weather/evidence and only the active request ID plus exact fetch key may publish a resolved or rejected state.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

- `src/lib/planning/__tests__/forecast-evidence.test.ts` retains one intentional TODO for fixed/manual persistent cache versus future memory-only automatic scope. Plan 01-11 owns that behavior; it does not prevent this plan's provenance/currentness boundary from operating.

No production stub was introduced.

## Threat Flags

None. The existing proxy and persistent cache path remain unchanged; no new network endpoint, auth path, schema, logging, or trust-boundary file access was added.

## Issues Encountered

- Task 1's new return envelope intentionally made `useWeather` fail type-check until Task 2 completed the planned atomic unwrap. The Task 2 GREEN commit closed that within the same TDD plan; final type-check, tests, lint, and builds are green.
- One large mechanical patch missed context because the existing Norwegian comments had encoding differences. It applied no partial change; the same planned implementation was applied through narrower patches.

## User Setup Required

None - no dependency, package, credential, environment, service, API, or migration change is required.

## Remaining Gates

- Fresh independent high-risk review on exact code candidate `4150a1e`: **Pending**.
- New app screenshots/video/traces and the media-based 90+ audit: **Pending stable candidate and owner permission**; none were created here.
- VoiceOver, TalkBack, physical haptics, OS text scaling, one-handed reach, physical-device UAT, and owner release approval: **Pending**.
- Six Snart approvals and independent climate artifacts remain Pending and still block Plan 01-13.

## Next Phase Readiness

- Code candidate `4150a1e` is ready for fresh independent high-risk verification.
- After that review is recorded by the orchestrator, Plan 01-03 can consume the explicit coverage model without inferring currentness or changing recommendation rules.

## Self-Check: PASSED

All eight plan-owned paths, this summary, commits `b5d68a9`, `bf5c806`, `3f4304a`, and `4150a1e`, and the exact eight-path candidate scope exist and were verified.

---
*Phase: 01-planlegg-dagslinjen*
*Completed: 2026-07-22*
