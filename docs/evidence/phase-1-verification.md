# Phase 1 verification — core recommendation and safety proof

Verdict: **PASS with recorded follow-up gates**

Verified: 2026-08-22, Europe/Oslo

Branch: `codex/phase-1/core-recommendation`

Candidate start: `0940d0e` — TASK-019 safety-finalized substitutions

Scope: TASK-020 closes Phase 1 by exercising the complete no-account magic
moment against the production build. It covers profile setup, both location
modes, all four activities, bounded recovery, canonical result order, one
safety override, privacy of automatic coordinates, and returning-user speed.

## Core E2E scenarios

The durable verifier is `e2e/core-recommendation.spec.ts`, run with
`npm run e2e:core`. It uses Chromium at a 390×844 mobile viewport, the
Europe/Oslo timezone, reduced motion, deterministic MET-format forecasts, and
isolated browser contexts.

| Scenario | Result | Observable evidence |
|---|---:|---|
| Onboarding + denied permission | PASS | A supported 12-month profile completes after geolocation denial exposes the manual-place recovery. |
| Manual home location | PASS | Trondheim is selected from the real onboarding combobox and drives the first result. |
| Automatic location | PASS | Consent plus granted geolocation resolves Tromsø; forecast requests use `69.6492,18.9553`; persisted location state contains no automatic coordinates. |
| Outdoor play | PASS | A complete numbered result renders in consecutive canonical order. |
| Stroller | PASS | A complete numbered result renders in consecutive canonical order. |
| Carrier | PASS | A complete numbered result renders in consecutive canonical order. |
| Indoor sleep + safety override | PASS | At 24 °C the final result contains 0.5 TOG and excludes 2.5 TOG. |
| Weather failure | PASS | HTTP 503 exposes a retry action, keeps calculation disabled, and renders no ungrounded outfit. |

The command reports seven grouped scenarios because onboarding, denied
permission, manual place, and the returning benchmark share one continuous
first-user journey.

## Returning-user timing

After the first fixed-home result was finalized and cached, the verifier
reloaded the same mobile test context and measured from reload initiation until
the complete `Dagens antrekk` result heading was visible.

| Run | Result | Gate |
|---|---:|---:|
| Final verification run | **404 ms** | < 5,000 ms |

This is an automated browser test-device measurement, not a physical-iPhone
claim. Physical iPhone core-flow regression remains explicitly owned by
TASK-050 and TASK-055.

## Repository verification

| Command | Result | Evidence |
|---|---:|---|
| `npm run e2e:core` | PASS | 7/7 grouped scenarios; cached return 404 ms. |
| `npm run e2e` | PASS | 2/2 onboarding and root-shell smoke scenarios. |
| `npm test` | PASS | 217/217 files; 3,313 passed; 1 todo. |
| `npm run lint` | PASS | Full repository lint completed without findings. |
| `npx tsc --noEmit` | PASS | E2E harness and application contracts typecheck. |
| `npm run build` | PASS | Main and bare production builds completed; existing chunk advisory remains non-blocking. |

Vitest initially discovered the roadmap-required `*.spec.ts` E2E filename as a
unit suite. `vitest.config.ts` now excludes `e2e/**` while retaining Vitest's
default exclusions; the Playwright program remains independently executable.
The final full run is green.

## Review record

Manual review checked that every scenario uses the compiled application rather
than calling domain functions directly; MET fixtures follow the production
payload contract; automatic coordinates are both observed in the request and
absent from storage; results require consecutive visible numbers; the safety
case asserts both the required 0.5 TOG and forbidden 2.5 TOG; and the failure
case cannot pass on a partial result. No independent review verdict or physical
iPhone result is claimed.

## Recorded follow-up gates

1. `FR-006` remains Partial until localized safety message keys are complete.
2. `FR-008` remains Partial until the supported dressing route exposes its
   existing reset capability as user-facing undo.
3. Country-specific external safety review remains mandatory before Sweden or
   Denmark production release.
4. Physical-iPhone accessibility and release-candidate verification remain
   owned by TASK-050 and TASK-055.

These do not invalidate the Phase 1 goal: valid local child and location inputs
now produce one deterministic, safety-finalized outfit in dressing order, and
all recorded error paths fail closed.

## Preserved worktree

Pre-existing changes in `loop/ARBEIDSLISTE-SNUDLY.md`, `loop/BATON.md`,
`loop/LEDGER.md`, and `loop/evidens/SN-007/g3-test.txt` were not modified or
staged by TASK-020.
