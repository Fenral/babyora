# TASK-022 verification — typed purchase contract

Verdict: **PASS**

Verified: 2026-08-22, Europe/Oslo

Branch: `codex/phase-2/subscription-and-observability`

## Delivered behavior

- The billing adapter exposes a discriminated result union for success,
  cancellation, pending payment, unavailable purchase, missing entitlement,
  and unexpected store error.
- RevenueCat's current error codes drive cancellation, ask-to-buy/payment
  pending, operation-already-in-progress, and store-unavailable outcomes. The
  legacy cancellation flag remains a compatibility fallback.
- A single adapter-owned in-flight promise prevents concurrent UI or caller
  races from invoking `purchasePackage` twice. The guard releases after either
  resolve or reject.
- Paywall cancellation is silent, pending payment is informational, and the
  other non-success outcomes use sanitized user-facing messages.
- Billing logs no longer include raw SDK error objects or `CustomerInfo`.

## Verification

| Command | Result | Evidence |
| --- | ---: | --- |
| Initial TASK-022 RED run | EXPECTED FAIL | 6/6 new contract cases failed against the boolean contract; the duplicate call timed out behind the same unresolved store mock. |
| Focused adapter suite | PASS | 1 file, 23 tests. |
| Focused billing + Paywall suite | PASS | 2 files, 42 tests. |
| `npx tsc -b --pretty false` | PASS | Adapter union and all callers typecheck. |
| Focused ESLint | PASS | No findings in changed TypeScript/TSX. |
| `npm test` | PASS | 217/217 files; 3,323 passed; 1 todo. |
| `npm run lint` | PASS | Full repository lint completed without findings. |
| `npm run build` | PASS | TypeScript, main Vite build, and bare build completed; existing chunk advisory remains non-blocking. |
| `npm run e2e:purchase` | PASS | 4/4 web/dev purchase-gate scenarios. Native StoreKit is intentionally deferred to TASK-029. |

## Review record

Manual review covered RevenueCat error-code mapping, union exhaustiveness at
the caller, duplicate-call timing, lock release, user messaging, error
sanitization, and absence of raw customer/SDK payload logging. It found and
fixed raw `CustomerInfo` and SDK error objects in billing console output, and
added guard-release plus SDK operation-in-progress coverage.

The required external `codex review --uncommitted` process was attempted but
timed out after 94 seconds without output. No independent review verdict is
claimed.

## External boundary

The web E2E validates the full UI gate and mock purchase journey but cannot
exercise StoreKit, ask-to-buy, or sandbox entitlements. TASK-021 still requires
owner-authenticated RevenueCat offering evidence, and TASK-029 owns physical
iPhone purchase verification.

## Preserved worktree

Pre-existing changes in `loop/ARBEIDSLISTE-SNUDLY.md`, `loop/BATON.md`,
`loop/LEDGER.md`, and `loop/evidens/SN-007/g3-test.txt` were not modified or
staged by TASK-022.
