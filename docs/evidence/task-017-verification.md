# TASK-017 verification — fast Home input-to-answer interaction

Verdict: **PASS**

Verified: 2026-08-22, Europe/Oslo

Branch: `codex/phase-1/core-recommendation`

## Delivered behavior

- Home presents `utelek`, `vogn`, `baeresele`, and `soevn` as one accessible
  radio group. Arrow keys wrap through choices, Home/End jump to the first or
  last choice, and the selected control is the only tab stop.
- All four activity controls remain at least 46 px high. Indoor sleep adds a
  native 44 px range control for a visible 14–24 °C room temperature, starting
  at 18 °C.
- Indoor sleep calculates from the chosen room temperature with zero outdoor
  wind/rain and no MET symbol. The value is included in scan identity so a
  temperature change cannot reuse an answer calculated for another room.
- The active child's `canRoll` value reaches the canonical engine. Unknown
  values remain omitted so the engine's documented conservative fallback is
  preserved.
- Canonical-engine and post-swap finalization failures are distinguished from
  missing weather. A failure shows one bounded recovery action to the child
  profile and never renders a partial outfit as complete.
- The existing Home layout and provisional `docs/design.md` v0.1 tokens were
  preserved. No new palette, brand direction, or decorative system was locked.

## Verification

| Command | Result | Evidence |
|---|---:|---|
| Initial interaction RED run | EXPECTED FAIL | 3 failures: only two activities, no roving keyboard selection, and no bounded engine recovery. |
| Focused Home/component suite | PASS | 8 files, 75 tests. |
| Focused regression contracts after review fixes | PASS | 5 files, 79 tests. |
| `npx tsc --noEmit` | PASS | New activity, room-temperature, and recovery props typecheck. |
| Focused ESLint | PASS | No findings in changed Home/component files. |
| `npm test` | PASS | 216/216 files; 3,306 passed; 1 todo. |
| `npm run lint` | PASS | Full repository lint completed without findings. |
| `npm run build` | PASS | TypeScript, main Vite build, and bare build completed; existing chunk advisory remains non-blocking. |
| `npm run e2e` | PASS | 2/2 onboarding and root-shell scenarios. |

## Review record

Manual staged review checked all four activity paths, keyboard semantics, touch
targets, indoor/outdoor weather separation, calculation identity, `canRoll`
propagation, and fail-closed error rendering. Existing source-contract tests
were kept intact by naming the calculation-weather snapshot explicitly within
the Home handoff. The independent review CLI was not retried because recent
local review commands repeatedly timed out without output. No independent
review verdict or external infant-health sign-off is claimed.

## Requirement status

`FR-004` and `FR-005` are **Verified**. `FR-006` remains **Partial** because
localized message keys in rule output are still absent; TASK-017 closes its
previous production `canRoll` input gap.

## Dependency note

The component-level keyboard test added `@testing-library/react`,
`@testing-library/user-event`, and `jsdom` as development-only dependencies.
No runtime dependency was added. Production dependency audit findings remain
assigned to the roadmap's dedicated dependency-review task.

## Preserved worktree

Pre-existing changes in `loop/ARBEIDSLISTE-SNUDLY.md`, `loop/BATON.md`,
`loop/LEDGER.md`, and `loop/evidens/SN-007/g3-test.txt` were not modified or
staged by TASK-017.
