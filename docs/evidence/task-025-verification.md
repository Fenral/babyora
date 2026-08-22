# TASK-025 verification — subscription lifecycle

Verdict: **PASS (local behavior)**

Verified: 2026-08-22, Europe/Oslo

Branch: `codex/phase-2/subscription-and-observability`

## Delivered behavior

- `checkPremium()` returns `active`, `inactive`, or `unavailable`; a network or
  SDK failure can no longer be interpreted as expiry.
- Startup and app-resume share one safe refresh. Active and inactive results
  commit immediately; inactive covers expiry/refund and relocks Pluss.
  Unavailable preserves the last-known entitlement after the loading boundary.
- Relocking changes only subscription state. The persisted first-value marker
  and all separate local child, preference, location, and recommendation stores
  remain untouched.
- Restore returns `restored`, `nothing-to-restore`, or `unavailable`. Only the
  restored state grants access; empty and offline states have distinct copy.
- Family settings disables its subscription action during refresh. An active
  subscriber opens the HTTPS Apple/Google management URL from RevenueCat,
  validated against approved store hosts, with a fixed platform fallback when
  the SDK is offline. An inactive subscriber opens the paywall where restore is
  exposed.

## Required scenario matrix

| Scenario | Result | Local evidence |
| --- | ---: | --- |
| Active entitlement | PASS | Adapter returns `active`; freshness commits true. |
| Expired entitlement | PASS | Missing active entitlement returns `inactive`; freshness commits false. |
| Refunded entitlement | PASS | Revoked active entitlement follows the same authoritative inactive path. |
| Nothing to restore | PASS | Restore returns `nothing-to-restore`; no entitlement is granted. |
| Offline refresh/restore | PASS | Refresh preserves last-known entitlement; restore returns recoverable `unavailable`. |

## Verification

| Command | Result | Evidence |
| --- | ---: | --- |
| Initial TASK-025 RED run | EXPECTED FAIL | 11 lifecycle tests failed against boolean check/restore contracts and missing management lookup. |
| Focused lifecycle suite | PASS | 4 files, 75 tests. |
| `npx tsc -b --pretty false` | PASS | Typed lifecycle contracts and consumers compile. |
| Focused ESLint | PASS | No findings in changed implementation/test files. |
| `npm test` | PASS | 217/217 files; 3,338 passed; 1 todo. |
| `npm run lint` | PASS | Full repository lint completed without findings. |
| `npm run build` | PASS | Main and bare production builds completed; existing chunk advisory remains non-blocking. |
| `npm run e2e:purchase` | PASS | 4/4 browser scenarios, including empty restore and manage-subscription destination. |

The first full run exposed only the generated screen manifest's stale line
count after the settings change. `node tools/skjermmanifest.mjs --skriv`
updated that generated record; its 15-test suite and the complete suite then
passed.

## Review record

Manual review traced SDK result classification, startup/resume single-flight,
stale-generation rejection, store persistence, paywall restoration, refresh
loading state, management URL validation/fallback, and local-data isolation.
It found and fixed the false-expiry-on-offline behavior and the ambiguous
boolean restore result.

The external Codex review process timed out without a verdict on TASK-022 and
was not immediately retried. No independent review verdict is claimed.

## External boundary

This task proves deterministic lifecycle behavior with mocked RevenueCat and
browser flows. TASK-021 and TASK-029 still own authenticated sandbox and
physical-iPhone evidence for real purchase, restore, expiry, and cold-start
entitlement behavior.

## Preserved worktree

Pre-existing changes in `loop/ARBEIDSLISTE-SNUDLY.md`, `loop/BATON.md`,
`loop/LEDGER.md`, and `loop/evidens/SN-007/g3-test.txt` were not modified or
staged by TASK-025.
