---
phase: 01-planlegg-dagslinjen
plan: "12"
subsystem: location
tags: [geolocation, privacy, entitlement, react, zustand, exact-context]

requires:
  - phase: 01-08
    provides: fail-closed runtime capability decisions
  - phase: 01-11
    provides: memory-only automatic-place storage and no-store weather/geocode scopes
provides:
  - intent-aware foreground automatic-location controller with live cancellation and single-flight ownership
  - capability-gated Settings activation and shared effective-place weather resolution
  - immutable current and future Outfit contexts with exact place, weather and recommendation parity
  - deterministic lifecycle, storage-byte and no-media browser evidence
affects: [01-13, 01-18, location, weather, outfit, privacy]

tech-stack:
  added: []
  patterns:
    - owner-predicate single-flight requests across Settings and App lifecycle intents
    - exact same-render transient DTOs for drill-down context
    - request-disabled weather consumers for invalid effective places

key-files:
  created: []
  modified:
    - src/hooks/useAutoLocationRefresh.ts
    - src/screens/InnstillingerScreen.tsx
    - src/screens/HjemScreen.tsx
    - src/screens/UkeScreen.tsx
    - src/screens/PaakledningScreen.tsx
    - src/App.tsx
    - e2e/planlegg.ts

key-decisions:
  - "A pending explicit Settings activation owns its live access/child predicate; a same-child App resume joins that request even while persisted mode intentionally remains manual."
  - "Every automatic external boundary checks request generation and live authorization, including the scheduled pre-GPS microtask."
  - "Hjem and Uke perform no weather request when effective-place resolution fails, and Outfit drills consume immutable same-render context rather than live child/weather state."

patterns-established:
  - "Automatic location is a foreground one-shot pipeline: intent gate, live pre-GPS check, GPS, live pre-geocode check, memory-only geocode, live pre-commit check."
  - "Settings persists auto mode only after the owner request commits a valid child-matching session place."

requirements-completed: [ACCESS-01, CTXT-01, EVID-02, GOV-04]

coverage:
  - id: D1
    description: "Automatic location performs no unauthorized or post-invalidation I/O and cannot commit stale child, access, mode, unmount or lifecycle results."
    requirement: ACCESS-01
    verification:
      - kind: unit
        ref: "src/hooks/__tests__/useAutoLocationRefresh.test.ts (13 controller cases)"
        status: pass
      - kind: automated_ui
        ref: "e2e/planlegg.ts --case automatic-location"
        status: pass
      - kind: automated_ui
        ref: "e2e/planlegg.ts --case location-containment"
        status: pass
    human_judgment: false
  - id: D2
    description: "Hjem and Uke share the exact resolved place, source and cache scope, while invalid effective places issue no forecast request."
    requirement: CTXT-01
    verification:
      - kind: unit
        ref: "src/hooks/__tests__/useWeather.test.ts and src/state/__tests__/location-pref-store.test.ts"
        status: pass
      - kind: automated_ui
        ref: "e2e/planlegg.ts --case automatic-location"
        status: pass
    human_judgment: false
  - id: D3
    description: "Current and future Outfit drills retain exact place, weather, wind, precipitation, garments and recommendation across later automatic refreshes."
    requirement: EVID-02
    verification:
      - kind: automated_ui
        ref: "e2e/planlegg.ts --case automatic-location and --case exact-context"
        status: pass
    human_judgment: false
  - id: D4
    description: "The immutable integration candidate is bound to independent verifier and adversarial PASS verdicts."
    requirement: GOV-04
    verification:
      - kind: other
        ref: "e69e0388eb14da9d00392199473edc120f047f7e / SHA256 CA6975D9AFBEED3E15B2707EBA295F6F446C53E76D1B9F0F9A6B19DD807A29AD"
        status: pass
    human_judgment: false

duration: 1h15m
completed: 2026-07-23
status: complete
---

# Phase 1 Plan 12: Privacy-Safe Automatic Location Integration Summary

**Foreground automatic location with live entitlement/child cancellation, memory-only place resolution, and immutable current/future Outfit context**

## Performance

- **Duration:** 1h 15m
- **Started:** 2026-07-23T21:55:18Z
- **Completed:** 2026-07-23T23:10:00Z
- **Tasks:** 3
- **Files modified:** 13

## Accomplishments

- Replaced automatic location with one injected, intent-aware controller that gates every I/O boundary, deduplicates stable requests and suppresses all stale completions.
- Wired Settings, App startup/resume, Hjem and Uke through the same runtime capability and effective-place contract without mutating fixed child home data.
- Preserved exact current and future Outfit place, weather, wind, precipitation, activity and finalized recommendation across later location refreshes.
- Enabled only `automatic_location` after focused, full-suite, build, browser and two independent exact-SHA review gates passed.

## Intent and Cancellation Matrix

| Path | Required state | Result |
|---|---|---|
| Startup/resume | allowed + implemented + stored auto + matching child | One foreground GPS → memory-only geocode request |
| Settings activation | allowed + implemented + explicit activation, manual or auto | Mode remains manual until valid place commits |
| Loading/denied/implementation-off | any mode | Zero permission/GPS/geocode/forecast I/O; stale session place cleared |
| Manual startup/resume | no explicit activation | Zero location I/O |
| Same-child resume during Settings activation | live owner access/child | Joins the activation; no duplicate GPS or cancellation |
| Off/downgrade/switch/unmount/cancel | in flight | Generation invalidated; late results cannot geocode or commit |
| Invalid effective place | Hjem/Uke | No weather request; surface fails closed |

## Storage and Context Evidence

- Seeded child JSON remains byte-identical through activation, refresh, child-switch overlap, downgrade, off and reload.
- Automatic paths create no `nominatim:*` keys and no new persistent keys; every pre-existing localStorage value is compared byte-for-byte except the explicitly allowed mode/active-child values.
- Reload reconstructs no automatic coordinates and performs exactly one fresh foreground GPS/geocode pipeline while allowed auto remains selected.
- Current and future Outfit dialogs compare complete situation, garment order and “why” weather evidence before and after a later place change.
- Browser evidence writes no screenshots, video or other media.

## Verification

- Full Vitest suite: **828 passed, 9 planned TODOs**
- Focused controller suite: **13/13 passed**
- ESLint: **passed**
- TypeScript, main Vite build and bare build: **passed**
- Automatic-location browser lifecycle: **passed**
- Manual/denied location containment: **passed** with all I/O counters `0`
- Access states (`free-valid`, `free-unavailable`, `loading`, `plus`, `downgrade`): **passed**
- Exact-context browser case: **passed**

### Immutable Candidate

- **Commit:** `e69e0388eb14da9d00392199473edc120f047f7e`
- **Archive:** `wool-01-12-candidate-1430071551.zip`
- **SHA-256:** `CA6975D9AFBEED3E15B2707EBA295F6F446C53E76D1B9F0F9A6B19DD807A29AD`
- **Independent verifier:** `verify_01_04` — PASS, P0/P1/P2 all 0; all 13 changed blobs matched
- **Adversarial reviewer:** `adversarial_01_05` — PASS, P0/P1/P2 all 0; all 1,876 tracked files matched

## Task Commits

1. **Task 1 RED: automatic-location intent controller** — `16ed6b7`
2. **Task 1 GREEN: explicit intent and runtime gate** — `bc22be5`
3. **Task 2: Settings and weather surfaces** — `fb41cac`
4. **Task 3: exact current/future Outfit context** — `8398d56`
5. **Review RED: live invalidation lifecycle** — `2d0c955`
6. **Review GREEN: live lifecycle, fail-closed consumers and expanded E2E** — `7b515a5`
7. **Review RED: pre-GPS and resume races** — `95c8812`
8. **Review GREEN: pre-GPS guard and activation join** — `7c98335`
9. **Review evidence: Settings unmount and full rendered context** — `acbb278`
10. **Review RED: production resume liveness** — `7b57bdd`
11. **Review GREEN: owner-predicate activation resume** — `e69e038`

## Files Created/Modified

- `src/hooks/useAutoLocationRefresh.ts` — shared intent/access/live-lifecycle controller and App startup/resume hook.
- `src/hooks/__tests__/useAutoLocationRefresh.test.ts` — zero-I/O, single-flight, cancellation and production resume-race contracts.
- `src/hooks/useWeather.ts` — explicit disabled path for missing effective places.
- `src/App.tsx` — runtime access wiring, immutable current drill ownership and focus restoration.
- `src/screens/InnstillingerScreen.tsx` — capability-derived activation, paywall/neutral semantics and synchronous cancellation.
- `src/screens/HjemScreen.tsx` — effective-place weather input and exact current Outfit DTO.
- `src/screens/UkeScreen.tsx` — effective-place weather input and exact future Outfit DTO.
- `src/screens/PaakledningScreen.tsx` — current DTO-only rendering path.
- `src/lib/premium/plus-features.ts` — enables only the proven automatic-location capability.
- `src/lib/premium/__tests__/plus-features.test.ts` — availability contract.
- `src/lib/premium/__tests__/paywall-copy.test.ts` — enabled automatic-location value contract.
- `src/lib/planning/__tests__/planned-outfit-resolver.test.ts` — updated exact-context fixture contract.
- `e2e/planlegg.ts` — deterministic privacy, lifecycle, storage and context evidence.

## Decisions Made

- The in-flight Settings activation is the authorization owner during a manual-mode lifecycle resume; App may join it but cannot replace its live access/child predicate.
- Automatic weather consumers fail closed rather than substituting default coordinates when effective-place resolution returns null.
- A transient Outfit origin is restored through a stable current CTA target because route drill-down remounts Hjem.
- Automatic availability changes to true only after exact-SHA deterministic and independent review gates pass.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Preserved the successful manual-to-auto activation across hook effect turnover**
- **Found during:** Task 3 browser verification
- **Issue:** The succeeding auto-mode effect could clear the place just committed by explicit Settings activation.
- **Fix:** Reused the matching fresh activation result across the effect transition.
- **Files modified:** `src/hooks/useAutoLocationRefresh.ts`, `e2e/planlegg.ts`
- **Verification:** Automatic-location activation browser flow
- **Committed in:** `8398d56`

**2. [Rule 1 - Bug] Closed live lifecycle, fail-closed weather and focus gaps**
- **Found during:** First exact-SHA verifier and adversarial reviews
- **Issue:** Snapshot-only access, cancellation/unmount, startup/resume identity, invalid-place fallbacks, zero coordinates and remounted current CTA focus left stale or divergent paths.
- **Fix:** Added owner/live rechecks, synchronous invalidation, stable request keys, disabled weather requests, exact coordinate handling and stable focus restoration.
- **Files modified:** `src/App.tsx`, `src/hooks/useAutoLocationRefresh.ts`, `src/hooks/useWeather.ts`, `src/screens/HjemScreen.tsx`, `src/screens/InnstillingerScreen.tsx`, `src/screens/UkeScreen.tsx`, `e2e/planlegg.ts`
- **Verification:** 13 controller cases plus automatic-location, containment, access and exact-context browser cases
- **Committed in:** `2d0c955`, `7b515a5`

**3. [Rule 1 - Bug] Closed pre-GPS and native resume-during-activation races**
- **Found during:** Replacement exact-SHA reviews
- **Issue:** Invalidation before the scheduled microtask could still call GPS, and production App resume liveness could cancel a valid pending Settings activation.
- **Fix:** Added the pre-locate generation/live guard and joined same-child resume through the still-live Settings owner predicate.
- **Files modified:** `src/hooks/useAutoLocationRefresh.ts`, `src/hooks/__tests__/useAutoLocationRefresh.test.ts`, `e2e/planlegg.ts`
- **Verification:** Production-accurate RED/GREEN unit case and held-GPS visibility-resume browser flow
- **Committed in:** `95c8812`, `7c98335`, `7b57bdd`, `e69e038`

**4. [Rule 3 - Blocking] Updated stale exact-context and capability test fixtures**
- **Found during:** Tasks 2 and 3 verification
- **Issue:** Existing paywall and planned-context fixtures encoded the prior disabled capability and older DTO shape.
- **Fix:** Updated fixtures to the enabled single-capability and exact place/source/weather contract.
- **Files modified:** `src/lib/premium/__tests__/paywall-copy.test.ts`, `src/lib/planning/__tests__/planned-outfit-resolver.test.ts`
- **Verification:** Full Vitest suite
- **Committed in:** `fb41cac`, `8398d56`

---

**Total deviations:** 4 auto-fixed (3 Rule 1 bugs, 1 Rule 3 blocking issue)
**Impact on plan:** All repairs enforce the planned access, privacy, cancellation and exact-context boundaries. No packages, APIs, schemas, prices, media, tracking or background location were added.

## Issues Encountered

- Two provisional candidates were rejected during exact-SHA review until pre-GPS and production lifecycle-resume races were represented accurately and closed.
- The main checkout has incomplete local dependencies, so deterministic gates ran from exact Git archives using the existing validated dependency tree.

## Known Stubs

None. Nullable and empty values in modified files are explicit loading, invalidation, miss or privacy-control states and do not prevent the plan goal.

## Threat Flags

No new endpoint, authentication path, file-access pattern or schema trust boundary was introduced. Foreground geolocation was already in the plan threat model.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Privacy-safe automatic location is enabled and ready for later cross-surface work.
- Native permission quality, physical-device behavior, media capture and release approval remain Pending under the existing project boundary.
- No implementation blocker remains for Plan 01-13.

## Self-Check: PASSED

All 13 modified files and all 11 task/review commits were verified on disk and in Git. Exact candidate `e69e0388eb14da9d00392199473edc120f047f7e` and both independent PASS verdicts are recorded.

---
*Phase: 01-planlegg-dagslinjen*
*Completed: 2026-07-23*
