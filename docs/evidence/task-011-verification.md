# TASK-011 verification — local child profile

Verdict: **PASS for the TASK-011 storage and persistence contract**

Verified: 2026-08-22, Europe/Oslo

Branch: `codex/phase-1/core-recommendation`

## Delivered behavior

- New profiles and edits validate required text, coordinates, avatar color, and
  a strict local ISO birth date before entering durable state.
- Birth dates from 0 through 24 completed months are accepted. Future, invalid,
  and 25+ month dates are rejected for new profiles, with a plain-language soft
  boundary in onboarding and the add-child dialog.
- Existing stored profiles are hydrated tolerantly so a newer validation rule
  cannot silently erase older, future-clock-skewed, or partially legacy data.
  Known missing or unknown material preferences migrate to
  `best_for_conditions`.
- Invalid JSON, invalid active-child IDs, missing core profile shapes, and
  unavailable local storage recover without crashing.
- Provider mutations validate before changing state, report rejection to their
  callers, and use a synchronized ref so back-to-back updates do not read a
  stale child list.

## Verification

| Command | Result | Evidence |
|---|---:|---|
| `npx vitest run src/state/__tests__/child-profile.test.ts src/state/children.test.tsx` | PASS | 2 files, 27 tests. |
| `npx tsc -b --pretty false` | PASS | No type errors. |
| Focused ESLint over all TASK-011 source/test files | PASS | No findings. |
| `npm test -- --run` | PASS | Full repository regression suite passed after regenerating the derived screen manifest. |
| `npm run build` | PASS | TypeScript, main Vite build, and bare build completed; the existing chunk-size advisory remains non-blocking. |
| `npm run e2e` | PASS | 2/2 scenarios; onboarding and add-child reject future/25+ dates and accept a supported date. |
| `git diff --cached --check` | PASS | No whitespace errors before closeout. |

The generated `docs/design-notes/skjermmanifest.md` was refreshed because the
two edited screens changed line counts. No visual token or layout decision was
introduced.

## Review record

Two independent review rounds during implementation found and drove fixes for
tolerant hydration, stale provider closures, silent UI failures, invalid active
IDs, duplicated date validation, and onboarding field limits. The final staged
review command was retried with full and compressed context; both attempts
timed out after 184 seconds without output. The final gate therefore uses a
manual staged-diff review plus the focused and full automated checks above. No
review claim is made for the unavailable final CLI result.

## Preserved boundary and follow-up

Older stored profiles are retained and can be edited without changing their
birth date; they are never silently deleted. The current recommendation screens
do not yet consume the profile validation status to exclude every already
stored 25+ profile from pilot results. `FR-001` therefore remains **Partial** in
the implementation matrix until that runtime gate is connected in the
recommendation flow.

## Preserved worktree

Pre-existing changes in `loop/ARBEIDSLISTE-SNUDLY.md`, `loop/BATON.md`,
`loop/LEDGER.md`, and `loop/evidens/SN-007/g3-test.txt` were not modified or
staged by TASK-011.
