# Verification: TASK-007

Verdict: **PASS**

Risk lane: **STANDARD** — the change is documentation and isolated design-lab
work, but it defines the visual contract for later product UI. It received
deterministic browser checks, captured light/dark evidence, and repeated
fresh-context review.

Reviewer/session: Claude Code, `sonnet` model alias, high effort, no session
persistence / fresh-context yes

Task/spec source: `docs/product-roadmap.md` TASK-006 and TASK-007,
`docs/design-exploration.md`, and the owner decisions dated 2026-08-19 and
2026-08-22

Candidate reviewed and gated: `b2aefbf`

## Acceptance criteria

- **PASS — Versioned, mirrored direction.** `docs/design.md` is the machine-
  readable v0.1.0 source of truth; `docs/design.html` is its self-contained
  human visual mirror with the same 42 colors, 11 type roles, 11 spacing
  values, 7 radii, and 15 component/state contracts.
- **PASS — Preserved-layout contract.** The owner-supplied deployment audit
  records the result-first information order, 18 px target gutter, large touch
  surfaces, and four-slot visual shell. The local three-root-tab source
  divergence is explicit and requires owner confirmation before implementation.
- **PASS — Reversible assumptions.** Evidence-locked product behavior and open
  palette, typography, radii, elevation, illustration, density, motion, and
  destination decisions are itemized in both design files.
- **PASS — Honest human-evidence boundary.** `docs/evidence/design-test.md`
  records 0/5 participants, no invented or proxy response, and keeps TASK-006
  deferred and open.
- **PASS — Required failure states.** The component contract and visual sheet
  include stale/offline/error recovery with explicit words and one action; a
  partial outfit may not be presented as complete.

## Visual and deterministic checks

- `node design-lab/task-007/verify.mjs` — **PASS** — value-level Markdown/HTML
  mirroring, closed token references, canonical prose structure, 27 WCAG AA
  text pairs, 4 focus-contrast pairs, language-of-parts markers, 320/390 px
  no-overflow behavior, 44×44 controls, live-audit artifacts, browser errors,
  and light/dark toggle.
- `node design-lab/task-007/capture.mjs` — **PASS** — refreshed full light guide
  and light/dark component sheets.
- Manual screenshot inspection — **PASS** — hierarchy, labels, selection,
  focus, safety, recovery, navigation, and bottom-sheet examples remain clear
  in both themes.
- Live reference evidence — `docs/evidence/live-layout-audit.md` plus six
  captured screens in `design-lab/task-007/screenshots/live-*.png`.

## Independent review

The first exact-commit review identified source-navigation ambiguity, missing
open-decision detail, missing recovery coverage, and a missing 320 px automated
check. The second review confirmed those fixes and identified three evidence-
quality gaps: typography values were not directly compared, Norwegian examples
were only partly language-marked, and the live audit lacked a committed record.

All findings were fixed. Fresh exact-commit review of `b2aefbf` returned:

> PASS — no actionable P0/P1/P2/P3 findings.

## Full repository gate

- `npm test -- --run` — **PASS** — 210 files; 3,168 tests passed; 1 todo.
- `npm run lint` — **PASS** — zero lint errors.
- `npm run build` — **PASS** — TypeScript, main Vite build, and bare-shell Vite
  build completed. The existing chunk-size advisory remains non-blocking.
- `npm run e2e` — **PASS** — onboarding and demo app-shell smoke scenarios,
  2/2 green.

## Scope and preserved worktree

- Production app behavior and source UI were not changed.
- Expected TASK-007 paths were the two mirrored design files, evidence notes,
  verifier/capture scripts, and screenshots. Unexpected paths: none.
- Pre-existing changes in `loop/ARBEIDSLISTE-SNUDLY.md`, `loop/BATON.md`,
  `loop/LEDGER.md`, and `loop/evidens/SN-007/g3-test.txt` were not edited,
  staged, or included.

## Remaining human gate

TASK-006 remains open. Five real target dads must still answer the same trust,
clarity, speed, and preference questions before v0.1 can be treated as tested
visual-language evidence. Their results may revise the open visual choices
without replacing the preserved result-first product hierarchy.
