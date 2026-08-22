# TASK-027 verification — privacy-safe PostHog funnel

Verdict: **PASS**

Verified: 2026-08-22, Europe/Oslo

Branch: `codex/phase-2/subscription-and-observability`

## Delivered boundary

- `track()` is the only PostHog capture surface in application code.
- `prepareCapture()` accepts only documented event names, exact property sets,
  primitive payload types, and closed categorical values. Invalid input rejects
  the complete event before the SDK is called.
- The schema has no fields for names, birth dates, exact age, account/child
  identifiers, city, coordinates, garments, recommendation content, free text,
  receipts, raw errors, or raw safety flags.
- Paywall call sites emit only coarse view trigger, selected monthly/yearly
  plan, typed purchase result, and typed restore result. No inferred trial start
  is emitted from a plan selection or assumed store configuration.
- Opt-out is checked before SDK initialization and every capture, deletes the
  locally persisted analytics ID, resets the SDK identity, and has an
  in-memory fallback when local storage is blocked.
- Full schema and change rule: `docs/analytics-event-schema.md`.

## Verification

| Command | Result | Evidence |
| --- | ---: | --- |
| Initial TASK-027 RED run | EXPECTED FAIL | 13/14 tests failed because runtime allowlist, dispatch boundary, and opt-out application did not exist. |
| Focused analytics/paywall suite | PASS | 2 files, 32 tests. |
| `npx tsc -b --pretty false` | PASS | Closed event unions and runtime consumers compile. |
| Focused ESLint | PASS | No findings in changed analytics and call-site files. |
| `npm test` | PASS | 217/217 files; 3,347 passed; 1 todo. |
| `npm run lint` | PASS | Full repository lint completed without findings. |
| `npm run build` | PASS | Main and bare production builds completed; existing chunk advisory remains non-blocking. |
| `npm run e2e:purchase` | PASS | 4/4 browser scenarios after purchase/restore event migration. |

## Review record

Manual review traced every analytics call site, runtime event dispatch, exact
key comparison, categorical type validation, SDK initialization races,
blocked-storage behavior, opt-out/opt-in transitions, and PostHog privacy
configuration. It found and fixed permissive cast bypasses, retained anonymous
IDs after opt-out, an opt-out-during-import reinitialization dead end, and an
object `toString()` category bypass.

The external Codex review process timed out without a verdict on TASK-022 and
was not immediately retried. No independent review verdict is claimed.

## Remaining FR-014 wiring

The safe schema includes onboarding and recommendation funnel events, but
their product call sites are not added by this boundary task. FR-014 therefore
remains Partial in the implementation matrix until those lifecycle points emit
the approved events.

## Preserved worktree

Pre-existing changes in `loop/ARBEIDSLISTE-SNUDLY.md`, `loop/BATON.md`,
`loop/LEDGER.md`, and `loop/evidens/SN-007/g3-test.txt` were not modified or
staged by TASK-027.
