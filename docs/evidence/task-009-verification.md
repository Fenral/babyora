# Verification: TASK-009

Verdict: **PASS**

Risk lane: **STANDARD** — this is a fail-closed country policy used by later
pilot and release work. It has no runtime consumer yet, so this task verifies
the policy contract rather than claiming that a production route is gated.

Task/spec source: `docs/product-roadmap.md` TASK-009 and `docs/prd.md` FR-013

Candidate reviewed and gated: `eb9abaf`

## Acceptance criteria

- **PASS — Norway is production-approved independently.** `NO` resolves to
  production, approved safety review, public release allowed, and no controlled
  pilot marker.
- **PASS — Sweden and Denmark remain pilot-only.** `SE` and `DK` resolve to a
  controlled pilot with pending safety review and public release blocked.
- **PASS — Locale cannot grant country access.** The resolver accepts country
  and selected locale separately and deliberately resolves from country only.
  Norwegian status is unchanged across `no`, `sv`, `da`, `en`, and `de`.
- **PASS — Unknown input fails closed.** Unknown, lower-case, mixed-case,
  empty, nullish, numeric, object, and array country values resolve to the
  unavailable gate.
- **PASS — The country table is exhaustive and type-safe.** Tests require
  exactly `NO`, `SE`, and `DK`, while the mapped type requires every table key
  to contain its matching country code.

## Focused verification and user-flow exercise

- `npx vitest run src/config/release-gates.test.ts` — **PASS** — 1 file,
  21 tests. The table-driven exercise covers all three supported country
  decisions, five locale choices, locale-shaped country mistakes, unknown
  values, mixed-case values, and table exhaustiveness.
- `npx eslint src/config/release-gates.ts src/config/release-gates.test.ts` —
  **PASS**.
- `npx tsc -b --pretty false` — **PASS**.
- `git diff --check -- src/config/release-gates.ts` — **PASS**.

There is no UI flow to open for this configuration-only task. Runtime build
policy and pilot UI wiring remain later roadmap work; this task does not claim
that merely adding the module changes the current app experience.

## Independent review

Final fresh exact-commit review used Claude Code, `sonnet` model alias, high
effort, with no session persistence. Review of `eb9abaf` returned **CLEAN**
with no P0–P3 findings after the mapped country-key type was tightened.

The build-loop-required Codex CLI review was attempted first against
uncommitted changes and then against the exact candidate commit. Both commands
produced no review output and were stopped by their five-minute timeout. They
are recorded as tool timeouts, not passes; the successful fresh Sonnet review
and deterministic gates provide the independent evidence for closure.

## Full repository gate

- `npm test -- --run` — **PASS** — 211 files; 3,189 tests passed; 1 todo.
- `npm run lint` — **PASS** — zero lint errors.
- `npm run build` — **PASS** — TypeScript, main Vite build, and bare-shell
  Vite build completed. The existing chunk-size advisory is non-blocking.
- `npm run e2e` — **PASS** — onboarding and demo app-shell smoke scenarios,
  2/2 green.

## Follow-up ownership

- TASK-030 through TASK-032 own missing-core-string localization contracts for
  Norwegian, Swedish, and Danish.
- Later country build-policy and pilot tasks own runtime consumption and must
  keep Sweden and Denmark closed to public release until qualified review.

## Preserved worktree

Pre-existing changes in `loop/ARBEIDSLISTE-SNUDLY.md`, `loop/BATON.md`,
`loop/LEDGER.md`, and `loop/evidens/SN-007/g3-test.txt` were not modified or
staged by TASK-009.
