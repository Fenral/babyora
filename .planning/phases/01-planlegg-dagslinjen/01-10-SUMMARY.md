---
phase: 01-planlegg-dagslinjen
plan: "10"
subsystem: access
tags: [react, capacitor, revenuecat, paywall, accessibility, playwright]

requires:
  - phase: 01-09
    provides: fail-closed configured-native entitlement freshness
provides:
  - capability-derived paywall claims limited to enabled features
  - truthful Free Today and weather-only Free Week states
  - neutral entitlement loading with atomic modal and paid-payload removal
  - safe purchase, restore, downgrade and focus transitions
affects: [01-11, 01-12, 01-18, access, paywall, planlegg]

tech-stack:
  added: []
  patterns:
    - entitlement-generation invalidation on neutral freshness transitions
    - capability registry as the sole source of concrete paywall promises

key-files:
  created: []
  modified:
    - src/lib/premium/paywall-copy.ts
    - src/components/PaywallDialog.tsx
    - src/App.tsx
    - src/screens/UkeScreen.tsx
    - e2e/planlegg.ts

key-decisions:
  - "Concrete paywall benefits and trust text render only when their backing capability flag is enabled."
  - "Only entry into neutral freshness invalidates an open paywall generation; direct purchase and restore grants retain their activation and delayed-close flow."
  - "Live Plus loss returns Planlegg to Today, while fast resolved paywall transitions restore focus to either the remounted trigger or main."

patterns-established:
  - "Free Week projects exactly one next-calendar-day weather comparison and never materializes garments, advice, DTOs or Outfit actions."
  - "Configured-native storage events cannot rehydrate stale subscription cache over a fresh live entitlement result."

requirements-completed: [ACCESS-01, UI-02, GOV-04]

coverage:
  - id: D1
    description: "Paywall claims are derived exclusively from enabled Plus capabilities."
    requirement: ACCESS-01
    verification:
      - kind: unit
        ref: "src/lib/premium/__tests__/paywall-copy.test.ts and products.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Free, loading, Plus, purchase, restore and downgrade Planlegg states preserve truthful content and focus."
    requirement: UI-02
    verification:
      - kind: automated_ui
        ref: "e2e/planlegg.ts --case access"
        status: pass
      - kind: integration
        ref: "e2e/planlegg.ts --case exact-context and --case semantic-rail"
        status: pass
    human_judgment: false
  - id: D3
    description: "The immutable access candidate is bound to a fresh archive and two independent high-risk reviews."
    requirement: GOV-04
    verification:
      - kind: other
        ref: "5cdbe73d426b4473a212d2677a4eaa76286c0a97 / SHA256 87B16AF8924233565E9D7731233CDC333429FF4434CFEA0D4D94C3975A0B52EE"
        status: pass
    human_judgment: false

duration: 95min
completed: 2026-07-23
status: complete
---

# Phase 1 Plan 10: Truthful Access and Paywall Claims Summary

**Capability-derived Plus copy with weather-only Free Week value, fail-closed native freshness, and deterministic purchase/restore/downgrade focus behavior**

## Performance

- **Duration:** 95 min
- **Started:** 2026-07-23T19:35:03Z
- **Completed:** 2026-07-23T21:09:04Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Replaced static expansion and family/caregiver promises with `buildCapabilityPaywallCopy(flags)`.
- Kept complete Free Today and added exactly one weather-only tomorrow comparison when exact next-day evidence exists; missing evidence stays neutral.
- Made configured-native access fail closed through loading, stale-cache events, fast settlement, purchase, restore and live Plus loss without paid DTO or advice leakage.
- Preserved contextual paywall focus, activation messages and delayed close behavior across both denied and allowed entitlement outcomes.

## Capability and Claim Matrix

| Capability | Enabled | User-facing claim |
|---|---:|---|
| `future_plan` | Yes | Week planning and tomorrow context |
| `extra_children` | Yes | Multiple children |
| `automatic_location` | No | None |
| `family_sharing` | No | None; no family/caregiver trust line |
| `personal_calibration` | No | None |
| `soon_preparation` | No | None |

An empty or partial capability map falls back to generic subscription-management copy and invents no benefit.

## Access Evidence

| State | Evidence |
|---|---|
| Free Today | Complete supported Outfit at the configured child place |
| Free Week | One exact-next-calendar-day weather comparison, or neutral unavailable; no garment advice, DTO or Outfit action |
| Loading | Week remains selected and neutral; no paywall, CTA, Plus DOM or paid payload |
| Plus | Enabled future-plan content only |
| Fast denied settlement | Stale paywall stays removed and the remounted Week trigger receives focus |
| Fast allowed settlement | Stale paywall stays removed and `main` receives safe focus when the teaser trigger disappears |
| Purchase / restore | Activation status remains visible until the existing delayed close, then focus returns safely |
| Live Plus loss | Paid drill/DTO closes and Planlegg returns to Today |
| Native storage event | Cached `true` cannot override a fresh native `false` |

## Verification

- Focused access/copy/planning suite: **82/82 passed**
- Full Vitest suite: **780 passed, 9 planned TODOs**
- ESLint: **passed**
- TypeScript, main Vite build and bare build: **passed**
- Browser cases: `access`, `exact-context`, `semantic-rail` **passed**
- Changed paths: **9/9 authorized**
- Validation-tree and extracted-archive blob mismatches: **0**
- Package, API, schema, media, analytics and location-history changes: **0**

### Immutable Candidate

- **Commit:** `5cdbe73d426b4473a212d2677a4eaa76286c0a97`
- **Archive:** `wool-01-10-5cdbe73-0455c6ea.tar`
- **SHA-256:** `87B16AF8924233565E9D7731233CDC333429FF4434CFEA0D4D94C3975A0B52EE`
- **Independent verifier:** `verify_01_04` — PASS, P0/P1/P2 none
- **Independent adversarial reviewer:** `adversarial_01_05` — PASS, P0/P1/P2 0

Both reviewers independently verified the archive hash and all nine changed Git blobs.

## Task Commits

1. **Task 1 RED: capability claims** — `53fff52`
2. **Task 1 GREEN: capability-derived copy** — `a2cbc9c`
3. **Tasks 2–3 RED: access and downgrade behavior** — `00a8eda`
4. **Tasks 2–3 GREEN: access presentation and browser evidence** — `4737d9b`
5. **Review repair RED: native freshness and tomorrow gaps** — `9a87fb9`
6. **Review repair GREEN: cache containment and exact tomorrow** — `79c5209`
7. **Review repair RED: neutral close and Today downgrade** — `87f4dae`
8. **Review repair GREEN: atomic modal close and Today restoration** — `27d80d0`
9. **Review repair RED: allowed commerce settlement** — `cd093d7`
10. **Review repair GREEN: purchase/restore completion** — `5cdbe73`

## Files Created/Modified

- `src/lib/premium/paywall-copy.ts` — pure capability-derived heading, body, optional trust and preview items.
- `src/lib/premium/__tests__/paywall-copy.test.ts` — enabled/disabled matrix and forbidden-claim contract.
- `src/lib/premium/products.ts` — removed unsupported legacy trust/headline exports; commerce values unchanged.
- `src/lib/premium/__tests__/products.test.ts` — locks unsupported-copy removal and commerce invariants.
- `src/components/paywall/PlusExpansionPreview.tsx` — renders filtered preview items.
- `src/components/PaywallDialog.tsx` — consumes capability-derived contextual copy.
- `src/App.tsx` — central live future-plan invalidation and configured-native storage containment.
- `src/screens/UkeScreen.tsx` — truthful Today/Week states, exact tomorrow, entitlement generations and focus restoration.
- `e2e/planlegg.ts` — deterministic Free/loading/Plus/purchase/restore/downgrade/native browser evidence.

## Decisions Made

- Disabled capabilities produce no semantic promise, including alternate family/caregiver wording.
- Neutral freshness is the only transition that invalidates a contextual modal generation.
- A resolved denied state restores the connected Week trigger; a resolved allowed state or successful commerce close uses `main` when the teaser trigger no longer exists.
- Free Week comparison uses the exact next local calendar date, never merely the first later forecast day.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Contained native cache rehydration and exact-day labeling**
- **Found during:** First independent review
- **Issue:** A native storage event could rehydrate stale Plus, and the first later forecast day could be mislabeled as tomorrow.
- **Fix:** Ignored cross-document subscription rehydration on native and required the exact next calendar date.
- **Files modified:** `src/App.tsx`, `src/screens/UkeScreen.tsx`, `e2e/planlegg.ts`
- **Verification:** Access E2E native freshness and missing-tomorrow fixtures
- **Committed in:** `9a87fb9`, `79c5209`

**2. [Rule 1 - Bug] Removed the neutral modal race and restored Today**
- **Found during:** Second independent review
- **Issue:** A cancelable animation frame could retain/reopen the paywall, focus before unmount, and leave a live Plus loss on Week.
- **Fix:** Bound modal visibility to entitlement generations, restored connected focus after settlement and tracked the last resolved authorization through neutral.
- **Files modified:** `src/screens/UkeScreen.tsx`, `e2e/planlegg.ts`
- **Verification:** Fast-denied settlement and Plus-to-Today browser assertions
- **Committed in:** `87f4dae`, `27d80d0`

**3. [Rule 1 - Bug] Preserved allowed purchase and restore completion**
- **Found during:** Third adversarial review
- **Issue:** Invalidating every access transition removed the paywall before activation status and delayed close on successful purchase/restore.
- **Fix:** Invalidated generations only on neutral, propagated pending focus through one resolved transition and added a safe main fallback.
- **Files modified:** `src/screens/UkeScreen.tsx`, `e2e/planlegg.ts`
- **Verification:** Fast-allowed, web purchase and native restore browser assertions
- **Committed in:** `cd093d7`, `5cdbe73`

---

**Total deviations:** 3 auto-fixed Rule 1 bugs
**Impact on plan:** All repairs enforce the planned access, commerce and accessibility contracts without expanding product scope.

## Issues Encountered

- Playwright function serialization injected a transpiler-only `__name` helper into the native fixture. The fixture was converted to explicit browser JavaScript content.
- A pre-existing process occupied smoke port 4173 during an earlier superseded candidate check; the supported `SMOKE_PORT` override passed at 4192. Final verification used the plan-relevant browser cases under the balanced protocol.
- Fresh `npm ci` repeated the already-tracked dependency audit findings; no package or lockfile changed.

## Known Stubs

None. Empty arrays/maps and nullable values in modified files are control/test state, not user-facing placeholders.

## User Setup Required

None.

## Remaining Pending Gates

- Fixed-home and automatic-location lifecycle acceptance remains owned by Plans 01-11/01-12.
- Real StoreKit/App Store sandbox, physical-device, new media and release evidence remain outside this deterministic candidate boundary.
- No push, deployment, TestFlight or release action was performed.

## Next Phase Readiness

Plan 01-10 is complete on the reviewed entitlement boundary. Plan 01-11 may proceed sequentially under the newly authorized balanced verification protocol.

## Self-Check: PASSED

- All nine modified implementation/evidence files exist.
- All ten task and repair commits exist.
- Exact candidate archive hash and both independent PASS verdicts are recorded.

---
*Phase: 01-planlegg-dagslinjen*
*Completed: 2026-07-23*
