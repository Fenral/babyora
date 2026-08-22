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
| FR-004 — Four activity modes | **Verified** | [TASK-017 verification](task-017-verification.md) | The canonical input supports all four activity contexts and explicit carrier/stroller sub-context. Home exposes outdoor play, stroller, carrier, and indoor sleep in a keyboard/touch accessible radio group; activity and indoor room temperature participate in scan identity and trigger recalculation. Indoor sleep uses room temperature and excludes wind, rain, and outdoor symbols. |
| FR-005 — Deterministic rules engine | **Verified** | [TASK-017 verification](task-017-verification.md) | Hjem, Juster, and Uke use one versioned pure facade over the contained legacy safety pipeline. Named fixtures freeze temperature and activity boundaries with byte-equivalent repeated runs. Home now distinguishes missing input from contract failure and renders a bounded recovery for both engine and post-swap finalization errors without exposing a partial outfit. |
| FR-006 — Non-disableable safety finalization | **Partial** | [TASK-017 verification](task-017-verification.md) | Motor 2.0 has one versioned rule/source register with stable IDs, severity, traceable sources, explicit non-override behavior, and fail-closed NO/SE/DK review status. Safety is reapplied after legacy overrides, and Home now passes the active child's `canRoll` state so rolling infants cannot miss the legacy swaddle-removal rule. Localized message keys in rule output remain the unmet acceptance criterion. |
| FR-007 — Numbered dressing result | **Verified** | [TASK-018 verification](task-018-verification.md) | The result renders one inner-to-outer numbered garment list with category and body-role text, and every row remains readable when its optional image fails. The exact weather time and one short largest driver are explicit. Visible finalized safety notices cross the trusted bundle boundary, while an unavailable bundle renders a bounded error with no partial list or rationale. |
| FR-008 — Safe substitution and undo | **Partial** | [TASK-019 verification](task-019-verification.md) | Alternatives are computed from engine-approved candidates and safety-finalized both when generated and when confirmed from a private frozen request. Stale, forged, and cross-session candidates fail closed; a hard-rule-removed preference is not selectable and is explained beside its source garment. Canonical order is preserved and the store can reset to the original outfit. The current supported-outfit route uses `KlePaaOverlay`, which does not expose the reset action or an undo control, so the user-facing undo criterion is not met. |
| FR-009 — Recommendation cache | **Conflicting** | [Persistent scan-cache store](../../src/state/scan-cache-store.ts) | Automatic-location weather, scan, and widget paths are now memory-only. Identity fields, a result fingerprint, completion time, and strict rehydration exist for fixed home, but `ScanCacheSlot` still does not store the actual `Recommendation`; the app therefore cannot render a previous outfit with freshness/staleness when reopened offline or weather is unavailable. |
| FR-010 — First-value paywall | **Conflicting** | [Subscription grace-window tests](../../src/state/__tests__/subscription-store.test.ts) | First recommendation time persists and the grace-window flag is session-only. The PRD's later-session gate conflicts with the authoritative free-today boundary in `AGENTS.md`; separately, the demo entitlement override is compiled into ordinary builds and activates for any URL containing any `seed` parameter, creating a production entitlement bypass. |
| FR-011 — RevenueCat offerings | **Conflicting** | [RevenueCat wrapper tests](../../src/lib/billing/__tests__/revenuecat.test.ts) | Monthly and annual plans map by RevenueCat package type without runtime product IDs. The paywall still renders static anchor prices from `src/lib/premium/products.ts`, and `purchasePlan()` selects the first matching package rather than blocking duplicate package types, conflicting with live-price and duplicate-blocking requirements. |
| FR-012 — Purchase and restore states | **Partial** | [TASK-025 lifecycle evidence](task-025-verification.md) | Purchase and restore outcomes are typed; startup/resume refresh relocks inactive/refunded access, preserves last-known access offline, and keeps local data. Restore is reachable from the settings paywall route, and active settings opens a verified management destination. Physical-iPhone sandbox evidence is still required before this requirement can be verified. |
| FR-013 — Country release gates | **Partial** | [TASK-016 verification](task-016-verification.md) | The broad typed gate separates country from locale: current contained legacy is production-approved in Norway, while Sweden and Denmark are pilot-only. Separately, every Motor 2.0 rule is pending for NO/SE/DK and its production assertion fails closed. TASK-030–032 still own localization completeness, and TASK-034 must bind both gates to build/runtime promotion. |
| FR-014 — Privacy-safe pilot analytics | **Partial** | [TASK-027 runtime schema](../analytics-event-schema.md) | The centralized boundary now uses exact event/property/category allowlists, fails closed on forbidden payloads, and enforces opt-out before initialization and capture while clearing local identity. Paywall purchase/restore call sites are wired; onboarding and recommendation funnel call sites still need implementation before the full requirement is verified. |
| FR-015 — Sentry observability | **Missing** | [Current dependency manifest](../../package.json) | No Sentry SDK or integration exists in the dependency manifest or source tree; `beforeSend` scrubbing, release/environment setup, a test-error path, and source-map upload configuration are absent. |
| FR-016 — Privacy-minimized pilot export | **Missing** | [Current analytics event surface](../../src/lib/analytics/track.ts) | No cohort export or threshold-calculation artifact was found. The repository has no implementation that emits only anonymous user, country, day, and funnel-stage data or computes the validation thresholds from such an export. |

## Coverage summary

| Status | Count |
|---|---:|
| Verified | 5 |
| Partial | 6 |
| Missing | 2 |
| Conflicting | 3 |
| **Total** | **16** |

The highest-risk conflicts are the production entitlement bypass (`FR-010`), the non-renderable recommendation cache (`FR-009`), and store-price handling (`FR-011`). The largest missing launch capabilities are Sentry integration and the privacy-minimized pilot export (`FR-015`, `FR-016`).
