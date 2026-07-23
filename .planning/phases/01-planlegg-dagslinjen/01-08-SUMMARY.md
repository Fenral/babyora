---
phase: 01-planlegg-dagslinjen
plan: "08"
subsystem: access
tags: [capabilities, entitlement, fail-closed, location-containment, tdd]

requires:
  - phase: 01-planlegg-dagslinjen
    provides: "01-07 reviewed Dagslinjen presentation and exact-context boundary"
provides:
  - "Pure authoritative runtime capability/access intersection"
  - "Today/Week/Soon planning-view resolver with legacy Uke compatibility bridge"
  - "False-by-default automatic-location and Snart implementation availability"
  - "No-I/O containment at App startup/resume and Settings activation"
  - "Deterministic stored-auto location-containment browser evidence"
affects: [01-09, 01-10, 01-12, 01-16, UkeScreen, Settings, access-policy]

tech-stack:
  added: []
  patterns:
    - "Entitlement policy and implementation availability are separate pure inputs"
    - "Absent or false implementation flags fail closed before runtime side effects"
    - "Compatibility wrappers delegate to authoritative resolvers during atomic migrations"

key-files:
  created: []
  modified:
    - src/lib/access/capabilities.ts
    - src/lib/access/__tests__/capabilities.test.ts
    - src/lib/premium/gating.ts
    - src/lib/premium/__tests__/gating.test.ts
    - src/lib/premium/plus-features.ts
    - src/lib/premium/__tests__/plus-features.test.ts
    - src/hooks/useAutoLocationRefresh.ts
    - src/screens/InnstillingerScreen.tsx
    - e2e/fixtures/planlegg.ts
    - e2e/planlegg.ts

key-decisions:
  - "Runtime capability access requires both decideAccess approval and an explicit true implementation flag; absent flags deny."
  - "Generic loading remains neutral and paywall-free, while an unavailable planning surface remains hidden even during loading."
  - "automatic_location and soon_preparation remain false; family sharing and personal calibration remain false."
  - "A stored auto preference stays visible and switchable off, but accurately says location is not used while implementation is unavailable."

patterns-established:
  - "resolveRuntimeCapabilityAccess is the runtime authorization seam for capability-backed effects."
  - "resolvePlanningViewAccess owns Today/Week/Soon full, teaser, hidden and neutral presentation."

requirements-completed: [ACCESS-01, EVID-02, GOV-04]

coverage:
  - id: D1
    description: "Deterministic capability, runtime availability and Today/Week/Soon access matrix"
    requirement: ACCESS-01
    verification:
      - kind: unit
        ref: "src/lib/access/__tests__/capabilities.test.ts and src/lib/premium/__tests__/gating.test.ts"
        status: pass
      - kind: other
        ref: "high-risk exact-SHA review on 9d15536"
        status: pass
    human_judgment: false
  - id: D2
    description: "Stored automatic location is contained before startup/resume and Settings I/O while off remains available"
    requirement: ACCESS-01
    verification:
      - kind: automated_ui
        ref: "e2e/planlegg.ts --case location-containment"
        status: pass
      - kind: integration
        ref: "permission/geolocation/geocode/forecast 0; childBytesEqual true; final mode manual"
        status: pass
    human_judgment: false
  - id: D3
    description: "Immutable no-media candidate with exact blobs, allowed scope and two independent review lanes"
    requirement: GOV-04
    verification:
      - kind: other
        ref: "standard and high-risk reviews on 9d15536; P0/P1/P2/P3 all 0"
        status: pass
      - kind: integration
        ref: "full test, audit, lint, build, Planlegg and smoke matrix"
        status: pass
    human_judgment: false

duration: 43min
completed: 2026-07-23
status: complete
---

# Phase 01 Plan 08: Truthful Runtime Access Policy Summary

**Capability-derived access with explicit implementation availability, a legacy Uke bridge, and enforced zero-I/O automatic-location containment**

## Performance

- **Duration:** 43 min
- **Started:** 2026-07-23T18:14:53Z
- **Completed:** 2026-07-23T18:57:47Z
- **Tasks:** 3
- **Files modified:** 10
- **Exact candidate:** `9d15536f6fe934cedd908c9c4fd4de9c0b33604f`
- **Archive SHA-256:** `28FB549EF15DC11CE682A9213EC25D7F3F874A27BC0FA523A07B66840F78E1AC`

## Accomplishments

- Added `soon_preparation` and made `decideAccess` the pure entitlement-policy input for every bounded planning capability.
- Added `resolveRuntimeCapabilityAccess` and `resolvePlanningViewAccess`, preserving the exact `shouldShowTenDayTeaser(tab, isPremium)` compatibility signature until Plan 01-10.
- Kept Today complete for Free, Week teaser/full according to Free/implemented Plus, and unavailable Snart hidden even while entitlement loads.
- Set `automatic_location:false` and enforced that decision before listener registration, haptics, permission, GPS, reverse geocoding, forecast work or child updates at both existing entry points.
- Proved seeded stored auto can be turned off but not reactivated; permission, geolocation, geocode and forecast counters remain zero and child storage remains byte-identical.

## Access Matrix

| View/capability | Loading | Free | Eligible Plus | Implementation false/absent |
|---|---|---|---|---|
| Today / `today_home` | Neutral | Full | Full | Hidden |
| Week / `future_plan` | Neutral when available | Teaser | Full | Hidden |
| Soon / `soon_preparation` | Hidden while unavailable | Hidden | Hidden | Hidden |
| `automatic_location` runtime | Neutral decision/no I/O | Denied/no I/O | Denied/no I/O | Denied/no I/O |

Availability at this candidate: `today_home:true`, `future_plan:true`, `extra_children:true`; `automatic_location:false`, `soon_preparation:false`, `family_sharing:false`, `personal_calibration:false`.

## Task Commits

1. **Plan-level RED contract**
   - `5bf97ad` — failing capability/resolver/availability and stored-auto containment tests.
2. **Plan-level GREEN implementation**
   - `f6aecaf` — pure policy/resolvers plus startup and Settings containment.
3. **Evidence and review repairs**
   - `0012126` — execute the mounted confirmation guard in the browser oracle.
   - `6866f2c` — move denied activation ahead of haptic side effects.
   - `4f2bf6a` — render the effective unavailable stored-auto state truthfully.
   - `995a86a` — RED for unavailable Snart during loading with false/absent flags.
   - `9d15536` — GREEN availability-first planning presentation repair.

## Files Created/Modified

- `src/lib/access/capabilities.ts` and tests — reserved Snart capability and deterministic Free/Plus/loading/expired matrix.
- `src/lib/premium/gating.ts` and tests — generic runtime access, planning-view resolver and Uke compatibility bridge.
- `src/lib/premium/plus-features.ts` and tests — truthful implementation availability with automatic location and Snart disabled.
- `src/hooks/useAutoLocationRefresh.ts` — fail-closed access check before listeners or location work.
- `src/screens/InnstillingerScreen.tsx` — identical access decision at toggle/confirmation, unconditional off and truthful disabled status.
- `e2e/fixtures/planlegg.ts` — invented normalized child bytes, stored auto and fixed-home cache fixture.
- `e2e/planlegg.ts` — deterministic no-media startup/resume/off/reactivation/confirmation containment case.

## Verification

- Fresh `npm ci`: 616 packages installed; 14 pre-existing dependency-audit findings unchanged.
- Full Vitest: 65 files passed, 1 skipped; 771 tests passed, 9 todo.
- Focused access/gating/availability suite: 43/43 passed.
- Product audit: 6 files and 19 tests passed.
- ESLint: PASS.
- Main and bare production builds: PASS.
- Planlegg browser cases: harness, composition-primitives, composition, semantic-rail, exact-context, composition-matrix and location-containment all PASS.
- App smoke: 4/4 PASS on isolated port 4192.
- Location containment: permission `0`, geolocation `0`, geocode `0`, forecast `0`, `childBytesEqual=true`, final mode `manual`, media `none`.
- Scope: 10 planned files; forbidden paths, new app network calls, new persistence writes, billing lines and media APIs all `0`.
- Exact archive: all 10 changed blobs match candidate; mismatch count `0`.

## Independent Reviews

Both reviewers cold-restarted on the same immutable archive for exact candidate `9d15536f6fe934cedd908c9c4fd4de9c0b33604f`.

| Reviewer | Lane | Verdict | Findings |
|---|---|---|---|
| `/root/execute_01_04/verify_01_04` | Standard policy/compatibility/Settings/evidence | PASS | P0 0 · P1 0 · P2 0 · P3 0 |
| `/root/execute_01_04/adversarial_01_05` | High-risk entitlement/location/privacy/oracle | PASS | P0 0 · P1 0 · P2 0 · P3 0 |

The high-risk lane blocked predecessor `4f2bf6a` for one P2 loading/unavailable precedence gap. RED `995a86a` reproduced it, GREEN `9d15536` fixed false and absent flags, and both lanes independently re-reviewed the replacement SHA.

## Decisions Made

- Kept policy and implementation availability structurally separate so entitlement cannot imply shipped functionality.
- Preserved neutral generic loading with no paywall trigger; presentation still hides a capability whose implementation is false or absent.
- Used `authenticated:false` for automatic location because the capability has no auth requirement; no identity state is inferred.
- Preserved stored auto until the user turns it off, but disabled every effect and removed the false “fetching where you are” claim.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Executed the confirmation containment path**
- **Found during:** Exact-candidate evidence review
- **Issue:** The browser case exercised blocked toggle activation but did not execute the already-mounted hidden confirmation handler.
- **Fix:** Programmatically invoked that handler and retained zero location I/O.
- **Files modified:** `e2e/planlegg.ts`
- **Verification:** `location-containment` PASS.
- **Committed in:** `0012126`

**2. [Rule 1 - Bug] Denied Settings activation emitted haptics before access**
- **Found during:** Source-boundary scan
- **Issue:** Toggle and confirmation returned before location work but after an existing native haptic side effect.
- **Fix:** Moved denied checks before haptics while preserving off/allowed cues.
- **Files modified:** `src/screens/InnstillingerScreen.tsx`
- **Verification:** Lint, build, browser containment and two reviews PASS.
- **Committed in:** `6866f2c`

**3. [Rule 1 - Bug] Stored auto made a false runtime claim**
- **Found during:** Truthfulness scan
- **Issue:** Disabled automatic location still displayed “Henter vær der du er”.
- **Fix:** Rendered “på, men utilgjengelig” and “Posisjon brukes ikke”, while retaining the checked switch so off remains possible.
- **Files modified:** `src/screens/InnstillingerScreen.tsx`, `e2e/planlegg.ts`
- **Verification:** Browser checks exact effective-state copy and zero I/O.
- **Committed in:** `4f2bf6a`

**4. [Rule 1 - Bug] Unavailable Snart was neutral during loading**
- **Found during:** First high-risk exact-SHA review
- **Issue:** Planning presentation checked loading before false/absent availability.
- **Fix:** Added false/absent loading RED cases and made availability win only at the presentation layer; generic access remains neutral/paywall-free.
- **Files modified:** `src/lib/premium/gating.ts`, `src/lib/premium/__tests__/gating.test.ts`
- **Verification:** 43/43 focused tests, full gates and both replacement-SHA reviews PASS.
- **Committed in:** `995a86a`, `9d15536`

**Total deviations:** 4 auto-fixed (3 correctness, 1 missing critical evidence).
**Impact on plan:** Every repair tightened the locked fail-closed and evidence contracts without expanding product scope.

## Issues Encountered

- The primary workspace dependency tree was locked by an existing Windows native-module process. Verification moved to fresh exact-SHA archives with clean `npm ci`; user processes were not terminated.
- Fresh installs report the same 14 pre-existing dependency-audit findings already recorded in `deferred-items.md`. Package changes remain prohibited and were not attempted.
- Earlier candidate SHAs were invalidated on every edit. Only `9d15536` carries final PASS evidence.

## Known Stubs

None. False capability flags are intentional enforced release gates, not incomplete runtime claims.

## No-Media Result

No screenshot, video, trace, audio or generated media artifact/API was added or invoked. Verification used unit, source, storage, call-cardinality and DOM/browser assertions only.

## Pending Gates

- Plan 01-09 RevenueCat freshness/single-flight behavior.
- Plan 01-10 live Uke/paywall migration from the compatibility bridge.
- Plan 01-12 full automatic-location controller, privacy-safe place/cache lifecycle, integration and possible enablement.
- Snart approval, implementation and enablement through Plans 01-13–01-16.
- Physical-device VoiceOver/TalkBack, text scaling and haptic validation.
- Owner-authorized app media, 90+ visual review, release and TestFlight/deployment approval.

## User Setup Required

None.

## Next Phase Readiness

Plan 01-09 can consume the pure access contract without changing capability availability. Plans 01-10 and 01-12 retain ownership of live presentation migration and automatic-location implementation respectively.

## TDD Gate Compliance

PASSED — RED `5bf97ad` precedes GREEN `f6aecaf`; the review repair also records RED `995a86a` before GREEN `9d15536`.

## Self-Check: PASSED

All ten implementation/evidence files, the canonical summary and all seven plan/repair commits were found.

---
*Phase: 01-planlegg-dagslinjen*
*Completed: 2026-07-23*
