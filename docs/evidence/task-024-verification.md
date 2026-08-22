# TASK-024 verification — truthful store offers

Verdict: **PASS**

Verified: 2026-08-22, Europe/Oslo

Branch: `codex/phase-2/subscription-and-observability`

## Delivered behavior

- The billing adapter reads the explicit RevenueCat `default` offering and
  returns the first monthly and annual packages, matching the purchase lookup.
- Ready offers expose the store's localized `priceString` and optional
  localized monthly-equivalent string. Blank, zero, negative, non-finite, or
  incomplete offers fail closed.
- The paywall distinguishes loading, missing offering, invalid offer, SDK
  error, ready live offer, and explicit demo states.
- Outside exact `?seed=demo`, anchor prices are hidden, plan inputs are
  disabled, and the CTA cannot start a purchase until both live packages are
  ready. Demo mode is visibly identified as an uncharged test purchase.
- Plan rows, accessible labels, selected CTA text, renewal copy, and annual
  savings use live localized prices. A monthly-equivalent comparison is shown
  only when RevenueCat supplies that localized string.

## Verification

| Command | Result | Evidence |
| --- | ---: | --- |
| Initial TASK-024 RED run | EXPECTED FAIL | The store offer snapshot API was absent; three new adapter scenarios failed. |
| Focused billing/copy/paywall suite | PASS | 3 files, 61 tests. |
| Focused ESLint | PASS | No findings in the TASK-024 implementation and test files. |
| `npx tsc -b --pretty false` | PASS | Offer-state and live-price contracts typecheck. |
| `npm test` | PASS | 217/217 files; 3,332 passed; 1 todo. |
| `npm run lint` | PASS | Full repository lint completed without findings. |
| `npm run build` | PASS | TypeScript, main Vite build, and bare build completed; existing chunk advisory remains non-blocking. |
| `npm run e2e:purchase` | PASS | 4/4 browser scenarios: yearly and monthly purchase, empty restore, and manage-subscription URL. |

## Review record

Manual review traced the explicit offering selection, package ordering, price
validation, asynchronous open/close transitions, fallback visibility,
selection and purchase guards, localized renewal copy, and exact demo-query
boundary. It found and fixed duplicate package selection drift, stale prices
between dialog openings, and an invented non-localized annual comparison.

The external Codex review process timed out without a verdict on TASK-022 and
was not immediately retried. No independent review verdict is claimed.

## External boundary

TASK-021 still requires an owner-authenticated native RevenueCat sandbox run.
TASK-026 owns the final Norway trial and store-price evidence. Neither external
claim is inferred from deterministic local mocks.

## Preserved worktree

Pre-existing changes in `loop/ARBEIDSLISTE-SNUDLY.md`, `loop/BATON.md`,
`loop/LEDGER.md`, and `loop/evidens/SN-007/g3-test.txt` were not modified or
staged by TASK-024.
