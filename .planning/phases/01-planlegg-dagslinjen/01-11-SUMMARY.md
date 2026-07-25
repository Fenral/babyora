---
phase: 01-planlegg-dagslinjen
plan: "11"
subsystem: location
tags: [privacy, met-no, nominatim, zustand, cache, vercel]

requires:
  - phase: 01-02
    provides: atomic forecast evidence, currentness and latest-key coordination
  - phase: 01-08
    provides: fail-closed runtime capability decisions and disabled automatic-location availability
provides:
  - scope-partitioned persistent and bounded memory-only forecast/geocode caches
  - browser, CDN and upstream no-store policy for automatic forecast coordinates
  - scope-aware weather request identity with atomic latest-result protection
  - mode-only persistence, session-only automatic snapshots and fixed-home resolver
affects: [01-12, 01-18, location, weather, privacy]

tech-stack:
  added: []
  patterns:
    - explicit persistent versus memory-only location request scope
    - bounded per-request invalidation without coordinate tombstones
    - pure capability-intersected effective-place resolution

key-files:
  created:
    - src/lib/location/cache-scope.ts
    - src/lib/geocode/__tests__/nominatim.test.ts
    - src/state/__tests__/location-pref-store.test.ts
    - api/__tests__/forecast.test.ts
  modified:
    - src/lib/met-no/client.ts
    - src/lib/geocode/nominatim.ts
    - src/hooks/useWeather.ts
    - src/state/location-pref-store.ts
    - api/forecast.ts

key-decisions:
  - "Only location mode persists; automatic place, generation, coordinates, source and entitlement stay in bounded application memory."
  - "Automatic forecast requests carry a memory-only marker and explicit no-store policy through browser, Vercel CDN, generic CDN and upstream response paths."
  - "Evicted or replaced in-flight requests are invalidated by bounded request tokens, while a coordinate-free monotonic version preserves same-key ordering."

patterns-established:
  - "Fixed/manual location work defaults to persistent caching; automatic work must opt into memory-only scope."
  - "Every denied, loading, unavailable, manual, missing, invalid or child-mismatched resolution returns fixed home with persistent scope."

requirements-completed: [ACCESS-01, CTXT-01, EVID-02, GOV-04]

coverage:
  - id: D1
    description: "Automatic forecast and reverse-geocode coordinates use disjoint bounded memory caches with no persistent storage access."
    requirement: CTXT-01
    verification:
      - kind: unit
        ref: "src/lib/met-no/__tests__/client.test.ts and src/lib/geocode/__tests__/nominatim.test.ts"
        status: pass
      - kind: integration
        ref: "api/__tests__/forecast.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Weather request identity carries source and cache scope without weakening provenance, currentness or latest-result safety."
    requirement: EVID-02
    verification:
      - kind: unit
        ref: "src/hooks/__tests__/useWeather.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Only mode persists and automatic place resolves solely from a valid matching session snapshot plus allowed runtime access."
    requirement: ACCESS-01
    verification:
      - kind: unit
        ref: "src/state/__tests__/location-pref-store.test.ts and src/lib/premium/__tests__/gating.test.ts"
        status: pass
      - kind: automated_ui
        ref: "e2e/planlegg.ts --case location-containment"
        status: pass
    human_judgment: false
  - id: D4
    description: "The immutable privacy candidate is bound to two independent exact-SHA reviews."
    requirement: GOV-04
    verification:
      - kind: other
        ref: "4bb62de615b4c6fc3e9f9ce4eeb1a142574b6c07 / SHA256 DAF7519B858AB58524ED82856082F32851DFF7FD71DF8973B3A2397CF59231C1"
        status: pass
    human_judgment: false

duration: 39min
completed: 2026-07-23
status: complete
---

# Phase 1 Plan 11: Automatic Location Privacy Foundation Summary

**Scope-partitioned location caches, end-to-end automatic-coordinate no-store policy, and a mode-only fixed-home resolver with bounded session state**

## Performance

- **Duration:** 39 min
- **Started:** 2026-07-23T21:12:47Z
- **Completed:** 2026-07-23T21:51:02Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- Added explicit persistent and memory-only request scopes for forecast and reverse geocoding, including bounded null-aware application-memory caches.
- Carried source and cache scope through weather fetch identity while preserving atomic evidence, cancellation and latest-key behavior.
- Persisted only the existing location mode and kept child-scoped automatic place/generation state in memory behind a pure fail-closed resolver.
- Extended the forecast proxy so every automatic success and error path is explicitly no-store at browser, Vercel CDN, generic CDN and upstream seams.

## Cache-Scope and Storage Matrix

| Path | Fixed/manual | Automatic memory-only |
|---|---|---|
| Forecast module cache | Persistent localStorage plus reviewed memory coordinator | Bounded 32-key application memory |
| Reverse-geocode cache | Persistent localStorage | Bounded 32-entry application memory, including null |
| Browser request cache | Existing default | `cache: no-store` |
| Forecast proxy/CDN | `s-maxage=900, stale-while-revalidate=600` on success | `private, no-store, max-age=0` plus generic and Vercel CDN `no-store` on success and errors |
| Persistent storage operations | Existing reads/writes retained | Zero `metno:*` or `nominatim:*` reads, writes or removals |
| Evidence on reuse | `cache/fresh` or reviewed stale behavior | True reuse is `cache/fresh`; network and concurrency winners retain truthful provenance |

The memory-only coordinator uses coordinate-free monotonic versions plus bounded per-request tokens. Replacement or eviction invalidates the token held by an in-flight request, preventing single- or double-eviction ABA resurrection without retaining an unbounded coordinate tombstone map.

## Fixed-Home Resolver Table

| Stored mode / runtime / session snapshot | Effective place | Cache scope |
|---|---|---|
| Auto + allowed and implemented + valid matching child snapshot | Automatic session place | Memory-only |
| Manual | Stored child fixed home | Persistent |
| Loading or neutral | Stored child fixed home | Persistent |
| Free or denied | Stored child fixed home | Persistent |
| Availability flag false | Stored child fixed home | Persistent |
| Missing, invalid or child-mismatched snapshot | Stored child fixed home | Persistent |
| Invalid fixed home | No request-eligible place | None |

The resolver tests serialize the frozen fixed-home value before and after every fallback and prove byte equality. Legacy persisted auto mode hydrates only the mode; no former automatic place is reconstructed and no child city/latitude/longitude is mutated.

## Verification

- Focused final privacy/cache/hook/store/gating suite: **140/140 passed**
- Full Vitest suite: **815 passed, 9 planned TODOs**
- ESLint: **passed**
- TypeScript, main Vite build and bare build: **passed**
- Location containment: **passed** with permission/geolocation/geocode/forecast counters all `0`, `childBytesEqual=true`, mode `manual`
- Changed paths: **9 planned plus 2 Rule-1 proxy privacy paths**
- Package, lockfile, schema, media, analytics, permission UI, GPS activation, child mutation and location-history changes: **0**
- Automatic-location availability: **remains false**

### Immutable Candidate

- **Commit:** `4bb62de615b4c6fc3e9f9ce4eeb1a142574b6c07`
- **Archive:** `wool-01-11-4bb62de.zip`
- **SHA-256:** `DAF7519B858AB58524ED82856082F32851DFF7FD71DF8973B3A2397CF59231C1`
- **Independent verifier:** `verify_01_04` — PASS, P0/P1/P2 all 0
- **Independent adversarial reviewer:** `adversarial_01_05` — PASS, P0/P1/P2 all 0

Both reviewers independently verified the archive hash and all 11 changed Git blobs.

## Task Commits

1. **Task 1 RED: cache privacy scopes** — `adba134`
2. **Task 1 GREEN: isolated request caches** — `42fdc83`
3. **Task 2 RED: weather scope identity** — `76b958d`
4. **Task 2 GREEN: scope-aware weather requests** — `2a42381`
5. **Task 3 RED: fixed-home boundary** — `d76506e`
6. **Task 3 GREEN: session-only automatic place** — `32f12b4`
7. **Review RED: provenance and failed-key bounds** — `d404c26`
8. **Review RED: automatic CDN bypass** — `96c0f45`
9. **Review RED: proxy cache policy** — `16d6eeb`
10. **Review GREEN: cache leak closure** — `8045494`
11. **Review RED: eviction races and error privacy** — `780bf63`
12. **Review GREEN: monotonic ordering and error no-store** — `fc4ffa7`
13. **Review RED: ABA and body-stream privacy** — `7fe26ee`
14. **Review GREEN: bounded token invalidation** — `4bb62de`

## Files Created/Modified

- `src/lib/location/cache-scope.ts` — shared persistent versus memory-only request contract.
- `src/lib/met-no/client.ts` — disjoint cache identities, bounded coordinator, truthful provenance and automatic proxy marker.
- `src/lib/met-no/__tests__/client.test.ts` — storage, expiry, failure, provenance and single/double-eviction race contracts.
- `src/lib/geocode/nominatim.ts` — bounded null-aware memory-only reverse-geocode cache.
- `src/lib/geocode/__tests__/nominatim.test.ts` — same-coordinate isolation, null, expiry and bound evidence.
- `src/hooks/useWeather.ts` — source/scope fetch identity and scoped client call.
- `src/hooks/__tests__/useWeather.test.ts` — cross-scope reverse-resolution latest-key evidence.
- `src/state/location-pref-store.ts` — mode-only persistence, generation actions and pure effective-place resolver.
- `src/state/__tests__/location-pref-store.test.ts` — persistence, generation, validation, capability and byte-equality matrix.
- `api/forecast.ts` — conditional automatic no-store response policy across success and error paths.
- `api/__tests__/forecast.test.ts` — fixed/manual shared-cache and automatic success/failure/body-stream no-store contracts.

## Decisions Made

- Only explicit mode is durable; automatic coordinate-bearing values remain session-only and bounded.
- Invalid fixed-home data returns no request-eligible place rather than permitting a network request.
- Automatic proxy requests use a query marker solely to select no-store policy; existing fixed/manual URLs and shared caching remain unchanged.
- Per-request invalidation tokens are bounded with coordinate keys, while the ordering sequence contains no coordinate data.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Closed browser and CDN cache leakage for automatic forecasts**
- **Found during:** First adversarial review
- **Issue:** Browser `Request.cache=no-store` did not override the proxy's successful `s-maxage` response, and later error/body-stream paths lacked explicit no-store directives.
- **Fix:** Added an automatic cache-scope marker and conditional browser, generic-CDN, Vercel-CDN and upstream no-store policy on validation, fetch, non-OK, body-read and success paths; fixed/manual success remains unchanged.
- **Files modified:** `api/forecast.ts`, `api/__tests__/forecast.test.ts`, `src/lib/met-no/client.ts`, `src/lib/met-no/__tests__/client.test.ts`
- **Verification:** Proxy cache-policy tests plus both final exact-SHA reviews
- **Committed in:** `96c0f45`, `16d6eeb`, `8045494`, `780bf63`, `fc4ffa7`, `7fe26ee`, `4bb62de`

**2. [Rule 1 - Bug] Bounded and invalidated all coordinate-bearing coordinator state**
- **Found during:** Independent verifier and adversarial reviews
- **Issue:** Failed request-version entries could grow, and eviction/reintroduction could allow equal-version or double-eviction ABA resurrection.
- **Fix:** Added a 32-key union bound, cleanup on failure/expiry/invalidity/eviction, coordinate-free monotonic versions and bounded per-request invalidation tokens.
- **Files modified:** `src/lib/met-no/client.ts`, `src/lib/met-no/__tests__/client.test.ts`
- **Verification:** Sequential failure, reverse resolution, single eviction and double-eviction ABA tests
- **Committed in:** `d404c26`, `8045494`, `780bf63`, `fc4ffa7`, `7fe26ee`, `4bb62de`

**3. [Rule 1 - Bug] Restored truthful memory-cache provenance**
- **Found during:** First independent verification
- **Issue:** A reused memory-only result still reported `network/miss`.
- **Fix:** True cache reuse now reports `cache/fresh`; in-flight concurrency winners preserve their original network provenance.
- **Files modified:** `src/lib/met-no/client.ts`, `src/lib/met-no/__tests__/client.test.ts`
- **Verification:** Memory reuse and reverse-resolution provenance assertions
- **Committed in:** `d404c26`, `8045494`

---

**Total deviations:** 3 auto-fixed Rule 1 bugs
**Impact on plan:** Repairs close the planned privacy and evidence contracts. The two extra API paths are limited to conditional cache policy; no endpoint, payload, capability or product behavior was added.

## Issues Encountered

- Initial exact candidates were intentionally blocked by high-risk review until cache provenance, coordinator bounds, proxy error policy and ABA invalidation were fully demonstrated.
- Direct `node e2e/planlegg.ts` cannot resolve TypeScript fixture imports; the supported `tsx` runner passed the final location-containment case.

## Known Stubs

None. Empty and nullable values in modified files are explicit loading, miss or privacy-control state rather than user-facing placeholders.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 01-12 can wire explicit fixed-home versus automatic sources without changing the reviewed storage/cache boundary.
- Permission prompts, GPS acquisition, UI activation and automatic-location availability remain pending and disabled.
- No blockers remain.

## Self-Check: PASSED

All created files and all 14 task/review commits were verified on disk and in Git.

---
*Phase: 01-planlegg-dagslinjen*
*Completed: 2026-07-23*
