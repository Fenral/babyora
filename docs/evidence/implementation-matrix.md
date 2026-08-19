# PRD Implementation Matrix

Assessment date: 2026-08-19

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
| FR-001 — Local child profile | **Partial** | [Child-profile parser and migration test](../../src/state/__tests__/child-profile.test.ts) | Local persistence, legacy migration, and corrupt-entry filtering exist. `src/state/child-profile.ts` validates only a non-empty ID plus string name/date fields; it does not validate date format, future birth dates, the 0–24-month boundary, city, coordinates, or required onboarding fields before persistence. |
| FR-002 — Privacy-bounded location | **Conflicting** | [Location preference store tests](../../src/state/__tests__/location-pref-store.test.ts) | The location-preference store itself persists only mode, rejects invalid coordinates, and keeps its automatic place in memory. However, `HjemScreen` passes the effective automatic coordinates to `HjemMonter`, which derives a coordinate-based `placeKey` and commits it through the persistent scan-cache store; automatic location data therefore survives the session through a second store and violates the privacy boundary. |
| FR-003 — Forecast proxy and freshness | **Partial** | [Forecast proxy contract tests](../../api/__tests__/forecast.test.ts) | The proxy validates coordinates, sets no-store browser headers, uses a bounded upstream cache, exposes 400/429/502 outcomes, and the UI provides attribution/freshness. `src/lib/met-no/client.ts` still collapses non-success responses into generic `Error` objects instead of the required typed client errors. |
| FR-004 — Four activity modes | **Conflicting** | [Home activity selector](../../src/screens/HjemScreen.tsx) | The engine type supports four activities, but the shipped Home and adjustment selectors expose only outdoor play and stroller; carrier and indoor sleep are unavailable to parents. Activity changes do recalculate, while the shared legacy result fingerprint also excludes activity/situation, so the user-facing choice and fingerprint acceptance criteria both conflict with the requirement. |
| FR-005 — Deterministic rules engine | **Partial** | [Deployed engine contract tests](../../src/lib/wool-layers/__tests__/engine.test.ts) | The deployed `wool-layers/recommend()` engine is synchronous and pure, and its tests cover all activities, temperature bands, and major safety boundaries. The suite does not explicitly prove byte-equivalent repeat output across named boundary fixtures; when this engine throws in `HjemScreen`, the error is silently collapsed to `null`, leaving the primary outfit CTA disabled instead of rendering the required bounded error state. Engine V2 has stronger deterministic fixtures but is not called by a production screen, so its disabled flags are not the FR-005 implementation gap. |
| FR-006 — Non-disableable safety finalization | **Partial** | [Safety finalization tests](../../src/lib/wool-layers/__tests__/finalize-safety.test.ts) | Safety is reapplied after overrides, hard removals are tested, and flags carry stable code, severity, message, and source IDs. `SafetyFlag` in `src/lib/wool-layers/safety.ts` lacks a localized message key and explicit override-behavior field. In addition, `HjemScreen` omits the active child's `canRoll` value from its engine input, so a child under four months who can already roll may miss the HB-6 swaddle removal. |
| FR-007 — Numbered dressing result | **Partial** | [Outfit truth end-to-end test](../../e2e/outfit-truth.ts) | The result renders an ordered, numbered garment list with thumbnail fallback and human-readable labels. The reviewed `OutfitTruthSnapshotV1` and `OutfitTruthPanel` path do not carry or render recommendation rationale, safety flags, or the required short explanation of the largest recommendation driver. |
| FR-008 — Safe substitution and undo | **Partial** | [Outfit selection store tests](../../src/state/__tests__/outfit-selection-store.test.ts) | Alternatives are computed from engine-approved candidates, swaps are safety-finalized, stale or forged candidates are rejected, severity downgrade is blocked, and the store can reset to the original outfit. The current supported-outfit route uses `KlePaaOverlay`, which does not expose the reset action or an undo control, so the user-facing undo criterion is not met. |
| FR-009 — Recommendation cache | **Conflicting** | [Persistent scan-cache store](../../src/state/scan-cache-store.ts) | Identity fields, a result fingerprint, completion time, and strict rehydration are implemented, but `ScanCacheSlot` does not store the actual `Recommendation`; the app therefore cannot render a previous outfit with freshness/staleness when reopened offline or weather is unavailable. The existing persistence is also privacy-conflicting: `HjemMonter` stores scan slots for automatic effective places, while `HjemScreen` calls `useWidgetSnapshot` without the location cache scope and the widget bridge writes the automatic-location recommendation to local and native widget storage. Remediation must add a renderable result payload for fixed-home use while keeping both automatic-location paths memory-only. |
| FR-010 — First-value paywall | **Conflicting** | [Subscription grace-window tests](../../src/state/__tests__/subscription-store.test.ts) | First recommendation time persists and the grace-window flag is session-only. The PRD's later-session gate conflicts with the authoritative free-today boundary in `AGENTS.md`; separately, the demo entitlement override is compiled into ordinary builds and activates for any URL containing any `seed` parameter, creating a production entitlement bypass. |
| FR-011 — RevenueCat offerings | **Conflicting** | [RevenueCat wrapper tests](../../src/lib/billing/__tests__/revenuecat.test.ts) | Monthly and annual plans map by RevenueCat package type without runtime product IDs. The paywall still renders static anchor prices from `src/lib/premium/products.ts`, and `purchasePlan()` selects the first matching package rather than blocking duplicate package types, conflicting with live-price and duplicate-blocking requirements. |
| FR-012 — Purchase and restore states | **Partial** | [Paywall purchase-flow tests](../../src/components/__tests__/PaywallDialog.test.tsx) | Success, cancellation, unavailable offering/plan, missing entitlement, and store failure have user-facing purchase states; restore exists in the paywall. Pending is not modeled, restore collapses unavailable/no-entitlement/failure to `false`, no restore action was found in settings, and no physical-iPhone sandbox evidence is recorded. |
| FR-013 — Country release gates | **Missing** | [Current locale registry](../../src/i18n/index.ts) | Norwegian, Swedish, and Danish locale resources exist, but no country release-gate module or tests separate translation completeness from safety review. Norway production and Sweden/Denmark pilot states therefore cannot be enforced independently. |
| FR-014 — Privacy-safe pilot analytics | **Partial** | [Analytics wrapper and event contract](../../src/lib/analytics/track.ts) | Tracking is centralized, opt-out is checked before initialization, autocapture/session recording are disabled, and obvious sensitive keys are stripped. Several properties remain unrestricted strings, the sanitizer is not directly behavior-tested, and the event union does not cover every requested funnel outcome. |
| FR-015 — Sentry observability | **Missing** | [Current dependency manifest](../../package.json) | No Sentry SDK or integration exists in the dependency manifest or source tree; `beforeSend` scrubbing, release/environment setup, a test-error path, and source-map upload configuration are absent. |
| FR-016 — Privacy-minimized pilot export | **Missing** | [Current analytics event surface](../../src/lib/analytics/track.ts) | No cohort export or threshold-calculation artifact was found. The repository has no implementation that emits only anonymous user, country, day, and funnel-stage data or computes the validation thresholds from such an export. |

## Coverage summary

| Status | Count |
|---|---:|
| Verified | 0 |
| Partial | 8 |
| Missing | 3 |
| Conflicting | 5 |
| **Total** | **16** |

The highest-risk conflicts are the production entitlement bypass (`FR-010`), automatic-location result persistence (`FR-009`), and store-price handling (`FR-011`). The largest launch blockers are the missing country gates, Sentry integration, and pilot export (`FR-013`, `FR-015`, `FR-016`).
