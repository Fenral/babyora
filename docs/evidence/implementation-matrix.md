# PRD Implementation Matrix

Assessment date: 2026-08-22

Scope: `docs/prd.md` functional requirements `FR-001`–`FR-016` against the current repository.

Method: inspect runtime code and its automated tests. Absence findings were confirmed with repository-wide searches for the named integration or artifact.

## Governing document conflicts

- `AGENTS.md` names Babyora as the approved public identity, while the newer PRD and roadmap use Snudly. This matrix does not resolve that identity conflict or authorize product renaming.
- `AGENTS.md` keeps today's fixed-home recommendation free, while PRD `FR-010` gates a later action or session after first value. Repository precedence makes the free-today boundary authoritative until the owner reconciles the documents.

## Status definitions

- **Verified** — the current implementation and automated evidence satisfy the requirement's acceptance criteria.
- **Partial** — meaningful implementation exists, but one or more acceptance criteria are not met or not proven.
- **Missing** — no implementation of the required product capability was found.
- **Conflicting** — current behavior explicitly contradicts an acceptance criterion or locked product rule.

## Matrix

| Requirement | Status | Evidence | Assessment |
|---|---|---|---|
| FR-001 — Local child profile | **Partial** | [TASK-011 verification](task-011-verification.md) | Strict required-field and ISO birth-date validation now protects new profiles and edits; known shapes migrate, corrupt storage recovers, and 0–24/future/25+ boundaries are covered in unit and E2E tests. Older stored profiles remain intact by design, but the recommendation screens do not yet consume their validation status to exclude every existing 25+ profile from pilot results. |
| FR-002 — Privacy-bounded location | **Verified** | [TASK-012 verification](task-012-verification.md) | Only location mode persists; fixed and automatic coordinates validate before requests; automatic weather/geocode, scan results, and widget output remain memory-only. Stale generations fail closed, permission/geocode failure preserves manual mode, and the versioned scan-cache migration purges indistinguishable legacy coordinate slots. |
| FR-003 — Forecast proxy and freshness | **Verified** | [TASK-013 verification](task-013-verification.md) | Client and proxy validate coordinates, the proxy parses MET payloads before caching, fixed-home and memory-only scopes retain their reviewed headers, and timeout/400/429/upstream failures map to safe `ForecastClientError` values. Source attribution and freshness remain visible in the weather UI. |
| FR-004 — Four activity modes | **Conflicting** | [TASK-014 verification](task-014-verification.md) | Motor 2.0 now has a typed four-activity boundary, validated stroller/carrier/car-seat sub-context, explicit activity fingerprints, and indoor-sleep isolation. The shipped Home and adjustment selectors still expose only outdoor play and stroller, and the production-visible legacy route has not adopted this boundary; carrier and indoor sleep therefore remain unavailable to parents until TASK-017. |
| FR-005 — Deterministic rules engine | **Partial** | [TASK-015 verification](task-015-verification.md) | Hjem, Juster, and Uke now use one versioned pure facade over the contained legacy safety pipeline. Named fixtures freeze both sides of all eight temperature thresholds and seven activity contexts with 25 byte-equivalent repeated runs each; unreviewed V2 display flags remain off. The remaining gap is user-visible error handling: screen catch blocks still collapse a contract error to `null` instead of rendering the required bounded recovery state. |
| FR-006 — Non-disableable safety finalization | **Partial** | [Safety finalization tests](../../src/lib/wool-layers/__tests__/finalize-safety.test.ts) | Safety is reapplied after overrides, hard removals are tested, and flags carry stable code, severity, message, and source IDs. `SafetyFlag` in `src/lib/wool-layers/safety.ts` lacks a localized message key and explicit override-behavior field. In addition, `HjemScreen` omits the active child's `canRoll` value from its engine input, so a child under four months who can already roll may miss the HB-6 swaddle removal. |
| FR-007 — Numbered dressing result | **Partial** | [Outfit truth end-to-end test](../../e2e/outfit-truth.ts) | The result renders an ordered, numbered garment list with thumbnail fallback and human-readable labels. The reviewed `OutfitTruthSnapshotV1` and `OutfitTruthPanel` path do not carry or render recommendation rationale, safety flags, or the required short explanation of the largest recommendation driver. |
| FR-008 — Safe substitution and undo | **Partial** | [Outfit selection store tests](../../src/state/__tests__/outfit-selection-store.test.ts) | Alternatives are computed from engine-approved candidates, swaps are safety-finalized, stale or forged candidates are rejected, severity downgrade is blocked, and the store can reset to the original outfit. The current supported-outfit route uses `KlePaaOverlay`, which does not expose the reset action or an undo control, so the user-facing undo criterion is not met. |
| FR-009 — Recommendation cache | **Conflicting** | [Persistent scan-cache store](../../src/state/scan-cache-store.ts) | Automatic-location weather, scan, and widget paths are now memory-only. Identity fields, a result fingerprint, completion time, and strict rehydration exist for fixed home, but `ScanCacheSlot` still does not store the actual `Recommendation`; the app therefore cannot render a previous outfit with freshness/staleness when reopened offline or weather is unavailable. |
| FR-010 — First-value paywall | **Conflicting** | [Subscription grace-window tests](../../src/state/__tests__/subscription-store.test.ts) | First recommendation time persists and the grace-window flag is session-only. The PRD's later-session gate conflicts with the authoritative free-today boundary in `AGENTS.md`; separately, the demo entitlement override is compiled into ordinary builds and activates for any URL containing any `seed` parameter, creating a production entitlement bypass. |
| FR-011 — RevenueCat offerings | **Conflicting** | [RevenueCat wrapper tests](../../src/lib/billing/__tests__/revenuecat.test.ts) | Monthly and annual plans map by RevenueCat package type without runtime product IDs. The paywall still renders static anchor prices from `src/lib/premium/products.ts`, and `purchasePlan()` selects the first matching package rather than blocking duplicate package types, conflicting with live-price and duplicate-blocking requirements. |
| FR-012 — Purchase and restore states | **Partial** | [Paywall purchase-flow tests](../../src/components/__tests__/PaywallDialog.test.tsx) | Success, cancellation, unavailable offering/plan, missing entitlement, and store failure have user-facing purchase states; restore exists in the paywall. Pending is not modeled, restore collapses unavailable/no-entitlement/failure to `false`, no restore action was found in settings, and no physical-iPhone sandbox evidence is recorded. |
| FR-013 — Country release gates | **Partial** | [Country release-gate contract](../../src/config/release-gates.test.ts) | A typed, fail-closed table separates country from selected locale: Norway is production-approved, Sweden and Denmark are pilot-only with pending safety review, and unknown inputs are unavailable. TASK-030–032 still own missing-core-string localization tests, and later build-policy work must consume the gate before it can enforce runtime promotion. |
| FR-014 — Privacy-safe pilot analytics | **Partial** | [Analytics wrapper and event contract](../../src/lib/analytics/track.ts) | Tracking is centralized, opt-out is checked before initialization, autocapture/session recording are disabled, and obvious sensitive keys are stripped. Several properties remain unrestricted strings, the sanitizer is not directly behavior-tested, and the event union does not cover every requested funnel outcome. |
| FR-015 — Sentry observability | **Missing** | [Current dependency manifest](../../package.json) | No Sentry SDK or integration exists in the dependency manifest or source tree; `beforeSend` scrubbing, release/environment setup, a test-error path, and source-map upload configuration are absent. |
| FR-016 — Privacy-minimized pilot export | **Missing** | [Current analytics event surface](../../src/lib/analytics/track.ts) | No cohort export or threshold-calculation artifact was found. The repository has no implementation that emits only anonymous user, country, day, and funnel-stage data or computes the validation thresholds from such an export. |

## Coverage summary

| Status | Count |
|---|---:|
| Verified | 2 |
| Partial | 8 |
| Missing | 2 |
| Conflicting | 4 |
| **Total** | **16** |

The highest-risk conflicts are the production entitlement bypass (`FR-010`), the non-renderable recommendation cache (`FR-009`), and store-price handling (`FR-011`). The largest missing launch capabilities are Sentry integration and the privacy-minimized pilot export (`FR-015`, `FR-016`).
