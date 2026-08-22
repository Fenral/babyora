# TASK-016 verification — versioned safety rule register

Verdict: **PASS**

Verified: 2026-08-22, Europe/Oslo

Branch: `codex/phase-1/core-recommendation`

## Delivered behavior

- `SAFETY_RULESET_VERSION` is fixed at `v2.1.0` and all ten Motor 2.0 rules
  have a stable ID, severity, source IDs, `nonOverrideable: true`, and explicit
  NO/SE/DK review status.
- `applySafetyV2` no longer duplicates severity or source metadata. Every
  emitted flag is built from the canonical register.
- External source records use precise HTTPS references from AAP, NHS, The
  Lullaby Trust, Red Nose Australia, and NHTSA. Exact temperature and exposure
  cutoffs are separately marked `POLICY`; validation rejects policy as the only
  source.
- `assertSafetyRulesApprovedForProduction` validates the source registry and
  rejects any selected rule that is not approved for the requested country.
- All V2 country statuses remain `pending`, so NO, SE, and DK fail closed. This
  is intentional: recording an unmet external gate completes TASK-016 without
  falsely claiming clinical review or activating Motor 2.0.
- The canonical outfit-truth validator recognizes the new precise source IDs,
  preventing a future reviewed V2 result from being rejected downstream.

## Verification

| Command | Result | Evidence |
|---|---:|---|
| Initial focused RED run | EXPECTED FAIL | `safety-rules.js` did not exist; 0 tests loaded. |
| Focused register + safety + scenarios + outfit truth | PASS | 4 files, 116 tests. |
| `npx tsc -b --pretty false` | PASS | Register, source union, public exports, and consumers typecheck. |
| Focused ESLint on changed TypeScript | PASS | No findings. |
| `npm test` | PASS | 215/215 files; 3,301 passed; 1 todo. |
| `npm run lint` | PASS | Full repository lint completed without findings. |
| `npm run build` | PASS | TypeScript, main Vite build, and bare build completed; existing chunk advisory remains non-blocking. |
| `npm run e2e` | PASS | 2/2 onboarding and root-shell scenarios. |

## Review record

Manual staged review checked source precision, rule-to-key consistency, runtime
immutability, country fail-closed behavior, and downstream acceptance of the
new source IDs. The independent review CLI was not retried because recent local
review commands repeatedly timed out without output. No independent verdict or
external infant-health sign-off is claimed.

## Requirement status

TASK-016 is complete because the missing external reviews are now explicit and
enforced. `FR-006` remains **Partial** until localized message keys and the
production `canRoll` input gap are closed. `FR-013` remains **Partial** until
TASK-034 binds country and rule gates to build/runtime promotion.

## Preserved worktree

Pre-existing changes in `loop/ARBEIDSLISTE-SNUDLY.md`, `loop/BATON.md`,
`loop/LEDGER.md`, and `loop/evidens/SN-007/g3-test.txt` were not modified or
staged by TASK-016.
