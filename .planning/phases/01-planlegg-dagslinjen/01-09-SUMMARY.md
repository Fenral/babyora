---
phase: 01-planlegg-dagslinjen
plan: 09
subsystem: payments-access
tags: [revenuecat, react, useSyncExternalStore, single-flight, fail-closed]

requires:
  - phase: 01-08
    provides: Capability-derived access policy and fail-closed implementation availability
provides:
  - Fail-closed configured-native entitlement freshness before RevenueCat I/O
  - Shared startup/resume single-flight with generation-guarded publication
  - Immediate settled purchase/restore grants without trusting startup cache
  - Node controller and SSR/module integration evidence
affects: [01-10, 01-12, Planlegg, premium-access, purchase-restore]

tech-stack:
  added: []
  patterns:
    - Effective access is neutral while configured-native freshness is unresolved
    - Concurrent entitlement refreshes share one exact promise
    - Only the current generation may commit or publish
    - Persisted access is authoritative only after freshness settlement

key-files:
  created:
    - src/lib/premium/__tests__/use-access.test.ts
  modified:
    - src/lib/premium/use-access.ts
    - src/main.tsx

key-decisions:
  - "Keep freshness state separate from persisted entitlement: loading masks cache, settlement restores the live store contract."
  - "Preserve existing purchase/restore semantics by accepting post-settlement store grants and re-neutralizing them on the next refresh."
  - "Keep web/dev unconfigured mode as an explicit ready-dev branch with no store-freshness claim."

patterns-established:
  - "Single-flight freshness: publish neutral synchronously, invoke one check, settle one current generation."
  - "Effective-access resolver: configured-native loading always returns false/loading; settled and ready-dev access reads the live store."

requirements-completed: [ACCESS-01, EVID-02, GOV-04]

coverage:
  - id: D1
    description: "Configured-native startup and resume fail closed until one fresh entitlement result settles"
    requirement: ACCESS-01
    verification:
      - kind: unit
        ref: "src/lib/premium/__tests__/use-access.test.ts#configured-native entitlement freshness"
        status: pass
      - kind: integration
        ref: "src/lib/premium/__tests__/use-access.test.ts#module startup/resume integration"
        status: pass
    human_judgment: false
  - id: D2
    description: "Single-flight identity, publication cardinality, stale generation containment, and settled purchase grants"
    requirement: EVID-02
    verification:
      - kind: unit
        ref: "focused exact-SHA Vitest: 32/32 passed"
        status: pass
      - kind: integration
        ref: "full exact-SHA suite: 778 passed, 9 todo"
        status: pass
    human_judgment: false
  - id: D3
    description: "Immutable three-file candidate with exact blobs and independent standard/high-risk PASS verdicts"
    requirement: GOV-04
    verification:
      - kind: other
        ref: "standard and high-risk reviews on ef4e23d; P0/P1/P2/P3 all 0"
        status: pass
      - kind: integration
        ref: "scope, blob, privacy, prohibition, no-media, browser and build gates"
        status: pass
    human_judgment: false

duration: 28min
completed: 2026-07-23
status: complete
---

# Phase 01 Plan 09: Fail-Closed Entitlement Freshness Summary

**RevenueCat startup/resume access now uses one generation-guarded single-flight that masks cached Plus until fresh settlement while preserving immediate purchase and restore grants**

## Performance

- **Duration:** 28 min
- **Started:** 2026-07-23T19:02:57Z
- **Completed:** 2026-07-23T19:30:30Z
- **Tasks:** 2
- **Files modified:** 3
- **Exact candidate:** `ef4e23d774c7905b44cf35bd69ab757d2c2f2142`
- **Archive SHA-256:** `47DA68C0976512152E728F132BA8B5FCCCA0B8540261A4C98A4A41BBA97223EE`

## Accomplishments

- Added an injected entitlement-freshness controller that publishes configured-native neutral access synchronously, reuses the exact in-flight promise, and permits only the current generation to settle.
- Made errors and fresh denial fail closed, while a superseded completion cannot reopen or overwrite access.
- Wired `useAccess()` through `useSyncExternalStore`; cached startup Plus remains masked, but existing successful purchase/restore store grants become effective immediately after settlement.
- Kept exactly one module-scope native/web resume registration and used the same public refresh path from startup after RevenueCat initialization.
- Preserved explicit web/dev mock behavior without representing it as a fresh native store result.

## Freshness State Table

| Runtime state | Effective `isPremium` | `loading` | Authority |
|---|---:|---:|---|
| Configured native at module load/startup init | false | true | Neutral; persisted cache blocked |
| Configured native refresh in flight | false | true | One shared promise; persisted value blocked |
| Current generation resolves true | live store true | false | Fresh RevenueCat result |
| Current generation resolves false or rejects | live store false | false | Fail-closed fresh/error result |
| Settled purchase/restore writes true | live store true | false | Existing successful purchase/restore contract |
| Next startup/resume refresh begins | false | true | Prior settled value blocked again |
| Web/dev unconfigured | live mock value | false | Explicit ready-dev branch; no native freshness claim |

## Concurrency and Publication Evidence

- Two concurrent public/controller refresh calls return the identical promise and invoke one entitlement check.
- A normal generation publishes once when entering neutral loading and once when its current result settles.
- A call after settlement creates a new promise and generation.
- A superseded generation may settle its own promise but cannot commit or publish.
- The configured-native module test proves startup, a concurrent public call, and the registered resume callback share one in-flight check.
- The same test proves fresh false, immediate post-settlement purchase grant, next-refresh neutralization, and fresh true.

## Task Commits

1. **Task 1 RED: lock entitlement freshness contract** — `1c36f9e`
2. **Task 2 GREEN: fail closed during entitlement refresh** — `28471a9`
3. **Review repair RED: cover post-refresh purchase grants and module integration** — `f1b61f1`
4. **Review repair GREEN: preserve settled purchase grants** — `ef4e23d`

## Files Created/Modified

- `src/lib/premium/__tests__/use-access.test.ts` — Pure controller, public sync/listener, and Node SSR hook integration matrix.
- `src/lib/premium/use-access.ts` — Single-flight controller, generation guard, effective-access resolver, one resume listener, and React subscription.
- `src/main.tsx` — RevenueCat initialization followed by the shared entitlement refresh path.

## Verification

- Fresh exact-SHA `npm ci`: 616 packages installed; 14 pre-existing dependency-audit findings unchanged.
- Focused freshness/capability suite: 32/32 passed.
- Full Vitest: 66 files passed, 1 skipped; 778 tests passed, 9 todo.
- Product audit: 6 files and 19 tests passed.
- ESLint and standalone TypeScript: PASS.
- Main and bare production builds: PASS.
- Planlegg browser cases: harness, composition-primitives, composition, semantic-rail, exact-context, composition-matrix, and location-containment PASS.
- App smoke on isolated port 4193: 4/4 PASS.
- Scope: exactly three planned paths; forbidden presentation/location/package/RevenueCat/product/purchase/privacy/media paths and source additions: zero.
- Blob binding: all three archive blobs match `ef4e23d`; mismatch count zero.
- Listener source sites: one native and one web registration.
- No screenshot, video, audio, trace, haptic instrumentation, generated media, deploy, push, or TestFlight action occurred.

## Independent Reviews

Both lanes cold-reviewed replacement candidate `ef4e23d774c7905b44cf35bd69ab757d2c2f2142` and independently verified archive SHA-256 plus all three blobs.

| Reviewer | Lane | Verdict | Findings |
|---|---|---|---|
| `/root/execute_01_04/verify_01_04` | Standard controller/hook/startup/compatibility | PASS | P0 0 · P1 0 · P2 0 · P3 0 |
| `/root/execute_01_04/adversarial_01_05` | High-risk cache/race/purchase/privacy/prohibition | PASS | P0 0 · P1 0 · P2 0 · P3 0 |

Both lanes blocked predecessor `28471a9` because configured-native `useAccess()` ignored existing successful purchase/restore store grants. RED `f1b61f1` reproduced the regression and missing module integration oracle; GREEN `ef4e23d` restored settled grants without exposing startup cache. Both lanes then re-reviewed only the replacement SHA.

## Decisions Made

- Freshness and persistence remain distinct. The controller owns whether persisted access may be consumed; it does not redefine products, entitlements, purchase, or restore behavior.
- The configured-native cache is blocked only while freshness is unresolved. Once the fresh result has overwritten it, later existing store updates represent live purchase/restore outcomes and remain effective until the next refresh begins.
- Startup and resume share one controller; no second listener or optimistic read was introduced.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Restored settled purchase and restore grants**
- **Found during:** Independent review of initial candidate `28471a9`
- **Issue:** Configured-native `useAccess()` ignored every store update after settlement, so successful purchase/restore could leave paying users effectively Free until a later resume.
- **Fix:** Added `resolveEffectiveAccess`, which blocks persisted state only while configured-native freshness is loading and consumes the live store after settlement.
- **Files modified:** `src/lib/premium/use-access.ts`, `src/lib/premium/__tests__/use-access.test.ts`
- **Verification:** Node SSR integration covers fresh false, immediate settled store grant, next-refresh neutralization, and fresh true; both replacement reviews PASS.
- **Committed in:** `f1b61f1` (RED), `ef4e23d` (GREEN)

**2. [Rule 2 - Missing Critical] Added module startup/resume/hook integration evidence**
- **Found during:** Standard independent review of initial candidate `28471a9`
- **Issue:** Controller-only tests did not exercise the public sync function, module listener cardinality, resume sharing, or configured-native hook output.
- **Fix:** Added a configured-native Node SSR/module test with injected RevenueCat, Capacitor listener, and subscription store.
- **Files modified:** `src/lib/premium/__tests__/use-access.test.ts`
- **Verification:** Public startup/concurrent/resume sharing, one listener, cache masking, settlement, purchase grant, and next generation all PASS.
- **Committed in:** `f1b61f1` (RED), `ef4e23d` (GREEN)

---

**Total deviations:** 2 auto-fixed (1 correctness bug, 1 missing critical evidence).
**Impact on plan:** Both repairs enforce the intended freshness boundary and preserve existing purchase/restore semantics without expanding product scope.

## Issues Encountered

- Existing Vite/Playwright processes held the workspace native bundler binary, so workspace `npm ci` could not replace it. All verification ran in fresh exact-SHA archives; shared user/agent processes were not terminated.
- Fresh installs report the same 14 pre-existing dependency-audit findings already carried by the project. Package changes were prohibited and not attempted.
- Initial candidate `28471a9` was invalidated after both independent reviews found the same purchase/restore integration regression. All final evidence and verdicts bind only to `ef4e23d`.

## Known Stubs

None. Empty arrays in tests and nullable `inFlight` controller state are intentional test/control structures, not UI or data-source stubs.

## Pending Gates

- Plan 01-10 live Uke/paywall presentation migration onto this freshness boundary.
- Plan 01-12 complete automatic-location controller and privacy-safe place/cache lifecycle.
- Snart approval and implementation through Plans 01-13–01-16.
- Physical-device VoiceOver/TalkBack, text scaling, haptic, and one-handed-use evidence.
- Owner-authorized app media, 90+ visual review, release, deploy, and TestFlight approval.

## User Setup Required

None.

## Next Phase Readiness

Plan 01-10 can consume `useAccess()` knowing configured-native cached Plus is never authoritative during refresh, while established purchase/restore success remains immediate after settlement. No presentation, location, pricing, product, RevenueCat, API, schema, or media scope moved into this plan.

## TDD Gate Compliance

PASSED — initial RED `1c36f9e` precedes GREEN `28471a9`; review-repair RED `f1b61f1` precedes replacement GREEN `ef4e23d`.

## Self-Check: PASSED

All three implementation/test files, the canonical summary, and all four task/repair commits were found.
