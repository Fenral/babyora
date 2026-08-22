# TASK-023 verification — first-value paywall gate

Verdict: **PASS**

Verified: 2026-08-22, Europe/Oslo

Branch: `codex/phase-2/subscription-and-observability`

## Delivered behavior

- `firstRecommendationSeenAt` is written once and remains persisted.
- `recommendationGraceWindowActive` is selected out of persisted state and is
  recomputed at every app boot.
- The approved Planlegg action cannot consume grace until the first genuine
  recommendation has been marked. A tap during loading therefore cannot make
  the paywall cover that first result later in the session.
- Both bottom-navigation and programmatic `snart` entry into Planlegg consume
  the same gate after first value. A subsequent app boot detects the persisted
  first value and may show the paywall directly.
- Boot-time storage access catches blocked storage, rejects malformed or
  invalid timestamps, and fails open. Only `?seed=demo` activates the explicit
  demo entitlement hook.

## Verification

| Command | Result | Evidence |
| --- | ---: | --- |
| Initial TASK-023 RED run | EXPECTED FAIL | Blocked storage helper was absent; pre-result Planlegg consumption incorrectly closed grace. |
| Focused store/gate/Home suite | PASS | 3 files, 33 tests. |
| Focused ESLint | PASS | No findings in state, gate, test, and App wiring files. |
| `npx tsc -b --pretty false` | PASS | Persistence and gate transitions typecheck. |
| `npm test` | PASS | 217/217 files; 3,327 passed; 1 todo. |
| `npm run lint` | PASS | Full repository lint completed without findings. |
| `npm run build` | PASS | TypeScript, main Vite build, and bare build completed; existing chunk advisory remains non-blocking. |
| `npm run e2e:purchase` | PASS | 4/4 browser scenarios; session one exposes the genuine result without a dialog and session two opens the non-dismissable gate. |

## Review record

Manual review traced recommendation rendering, effect timing, raw persisted
boot state, primary and programmatic Planlegg navigation, gate due-state, demo
query handling, and the browser E2E session boundary. It found and fixed the
pre-result grace-consumption race, unguarded storage access, untested
partialization, and a programmatic Planlegg path that bypassed consumption.

The external Codex review process had just timed out without output during the
preceding payment task and was not immediately retried. No independent review
verdict is claimed.

## Deferred tooling advisory

The existing browser test runner emits Node `DEP0190` because it launches the
fixed local Vite command with `shell: true` on Windows. Its arguments are not
user-controlled and all scenarios pass, but replacing the shell launch should
be handled as test-runner maintenance rather than silently expanded into this
product task.

## Preserved worktree

Pre-existing changes in `loop/ARBEIDSLISTE-SNUDLY.md`, `loop/BATON.md`,
`loop/LEDGER.md`, and `loop/evidens/SN-007/g3-test.txt` were not modified or
staged by TASK-023.
