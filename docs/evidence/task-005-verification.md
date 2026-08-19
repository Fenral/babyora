# Verification: TASK-005

Verdict: **PASS**

Risk lane: **STANDARD** — the concepts are isolated from production runtime,
but they define qualitative candidates for a later product direction and make
accessibility claims. They received deterministic browser checks and independent
fresh-context review.

Reviewer/session: Claude Code, `sonnet` model alias, high effort, no session
persistence / fresh-context yes

Task/spec source: `docs/product-roadmap.md` TASK-005 and
`docs/design-exploration.md`

Candidate reviewed and gated: `a632aa8`

## Acceptance criteria

- **PASS — Three directions exist.** `design-lab/task-005/` renders Direction A,
  B, and C.
- **PASS — Each direction includes onboarding, Home, and result.** The browser
  contract found exactly 3 directions and 9 phone concepts.
- **PASS — Comparison content is identical.** Every concept renders from the
  single frozen object in `fixture.js`; the browser contract compares normalized
  DOM text across corresponding screens in all three directions.
- **PASS — The directions are not palette swaps.** A uses a cool flat/native
  system and linear result; B uses warm paper, serif editorial hierarchy,
  tactile cards, and a two-column field-guide result; C uses a dark technical
  grid, condensed/monospaced type, compact modules, and an instrument sequence.
- **PASS — External reference principles are traceable.** `docs/design-options.md`
  cites Yr, Helsenorge, Day One, IKEA, and Windy and records the principle applied
  to each direction without copying brand assets.
- **PASS — Title-blind distinction is possible.** `?blind=1` hides all direction
  titles while leaving the concepts intact. The independent reviewer confirmed
  material differences across color, type, density, imagery, and component
  character and found no identity leak in the blind mechanism.
- **PASS — Exploration remains reversible.** No option is selected and all
  direction values are documented as disposable, non-production tokens pending
  TASK-006 evidence and TASK-007.

## Visual and browser checks

- `node design-lab/task-005/verify.mjs` — **PASS** — three directions, three
  required screens, one shared fixture, blind mode, four activities, six ordered
  garments, 44px target CSS, reduced-motion fallback, and sampled AA text pairs.
- `node design-lab/task-005/capture.mjs` — **PASS** — 9 rendered concepts at
  exactly 390×844, identical screen text, no rendered control below 44×44, no
  browser console/page errors, and three refreshed title-blind sheets.
- Manual screenshot inspection — **PASS** — onboarding, Home, result, body
  connections, ordered garments, reason, safety boundary, source status, and
  navigation are visible in all three direction sheets without clipping.
- Generated evidence:
  `design-lab/task-005/screenshots/direction-a.png`,
  `direction-b.png`, and `direction-c.png`.

## Independent review

Initial candidate `8c78fc4` received two findings:

- **P2:** Direction B inactive 10px navigation labels were 4.13:1 against their
  background and were absent from the sampled contrast gate.
- **P3:** Direction C contained an inert `counter-reset` and empty pseudo-element.

Both were fixed before the final candidate: Direction B navigation now uses
`#5c6660` at approximately 5.20:1 and is asserted by `verify.mjs`; the dead
Direction C rules were removed.

Fresh exact-commit re-review of `a632aa8` returned:

> PASS: no P0-P3 findings.

The reviewer also confirmed the prior fixes, shared fixture, 44×44 rendered
targets, title-blind behavior, material visual distinction, reference mapping,
DOM/reading order, reduced-motion fallback, and lab path consistency.

## Full repository gate

- `npm test -- --run` — **PASS** — 210 files; 3,168 tests passed; 1 todo.
- `npm run lint` — **PASS** — zero lint errors.
- `npm run build` — **PASS** — TypeScript, main Vite build, and bare-shell Vite
  build completed. The existing chunk-size advisory remains non-blocking.
- `npm run e2e` — **PASS** — onboarding and demo app-shell smoke scenarios,
  2/2 green.
- `git diff --check` on task files — **PASS**. The warning reported afterward is
  confined to a pre-existing unstaged `loop/evidens/SN-007/g3-test.txt` change.

## Scope

- Expected paths: `docs/design-options.md`, `design-lab/`, and required closeout
  documents.
- Candidate paths: `docs/design-options.md` and `design-lab/task-005/`.
- Unexpected candidate paths: none.
- The four pre-existing loop/SN-007 working-tree changes were not staged, edited,
  reviewed as part of TASK-005, or included in the candidate.

## Security, privacy, and runtime

- Production runtime change — **none**. The lab is a static isolated comparison
  artifact and is not imported by the app.
- Personal data — **none**. Nora and the scenario values are fictional fixed
  fixture data; the lab has no network request, persistence, analytics, account,
  or location collection.
- External assets — **none**. The concepts use CSS and inline geometric SVG only.
- Accessibility — **concept pre-check passed**, not production certification.
  Production WCAG, Dynamic Type, assistive technology, stale/offline/error, and
  image-failure validation remain later gates.

## Re-verification scope

Administrative closeout may update only this evidence file, the TASK-005
checkbox/progress count, and current handoff. Any change to the concepts, fixture,
styles, verifier, screenshots, or design-options document requires rerunning the
browser contract, exact-commit review, and full repository gate.

## Final reason

The immutable candidate provides three visually and structurally distinct,
title-blind options under a fair shared-content contract. Automated checks and
fresh-context review are clean. Preference and target-dad trust remain unknown by
design and are the human evidence gate in TASK-006.
