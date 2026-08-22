# TASK-019 verification — safety-finalized garment substitution

Verdict: **PASS**

Verified: 2026-08-22, Europe/Oslo

Branch: `codex/phase-1/core-recommendation`

## Delivered behavior

- Alternative generation runs every candidate through the production safety
  finalizer. A candidate removed by a hard rule is excluded from actions and
  recorded as a safety-blocked preference.
- Confirmation reruns finalization from a private, recursively frozen request.
  The selection store accepts only the exact registered factory option for the
  matching canonical base identity and fails closed before changing state.
- The rebuilt confirmed result must match the preauthorized snapshot and
  recommendation fingerprint. Forged, stale, cross-session, or changed output
  is rejected.
- Garment order is rebuilt from canonical truth and remains consecutive from
  inner to outer. The result names a blocked preference beside its source
  garment and explains that safety rules removed it.

## Verification

| Command | Result | Evidence |
|---|---:|---|
| Initial substitution RED run | EXPECTED FAIL | Confirmation finalizer and blocked-preference projection were absent. |
| Focused substitution/result/store/bundle suite | PASS | 4 files, 85 tests. |
| Extended outfit/result/design suite | PASS | 6 files, 116 tests. |
| `npx tsc --noEmit` | PASS | Confirmation, bundle, store, and UI contracts typecheck. |
| Focused ESLint | PASS | No findings in changed TypeScript/TSX. |
| `npm test` | PASS | 217/217 files; 3,313 passed; 1 todo. |
| `npm run lint` | PASS | Full repository lint completed without findings. |
| `npm run build` | PASS | TypeScript, main Vite build, and bare build completed; existing chunk advisory remains non-blocking. |
| `npm run e2e` | PASS | 2/2 onboarding and root-shell scenarios. |

## Review record

Manual review checked candidate authorization, hard-rule removal, immutable
confirmation context, canonical identity matching, snapshot equivalence,
ordering, user-facing blocked copy, and fail-closed store behavior. The review
found that the bundle producer legitimately creates an equivalent canonical
base object distinct from the alternative builder's base object; confirmation
now matches the complete canonical identity instead of JavaScript reference
identity. Both snapshots and every option remain factory-owned. The independent
review CLI was not retried because recent local review commands repeatedly timed
out without output. No independent review verdict or external infant-health
sign-off is claimed.

## Requirement status

The substitution safety portion of `FR-008` is verified. `FR-008` remains
**Partial** because the currently supported `KlePaaOverlay` route does not yet
expose its existing reset capability as a user-facing undo action.

## Preserved worktree

Pre-existing changes in `loop/ARBEIDSLISTE-SNUDLY.md`, `loop/BATON.md`,
`loop/LEDGER.md`, and `loop/evidens/SN-007/g3-test.txt` were not modified or
staged by TASK-019.
