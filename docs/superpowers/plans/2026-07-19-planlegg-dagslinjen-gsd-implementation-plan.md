# Planlegg / Dagslinjen — GSD implementation and verification plan

**Date:** 2026-07-19
**Status:** Owner-requested implementation plan; ready for GSD bootstrap and
plan review. This document does **not** authorize app-code changes.
**Goal:** Implement the owner-approved Dagslinjen so Planlegg reaches a
documented score of at least 90/100 while every recommendation, future context,
Free/Plus boundary and native interaction remains truthful.

## 1. Governing sources

Read these in precedence order before planning or execution:

1. `AGENTS.md`
2. `docs/DECISION-LOG.md` — 2026-07-19 Dagslinjen decision
3. `docs/PROSESS-PLAN-TIL-KODE.md`
4. `docs/CURRENT-HANDOFF.md`
5. `docs/superpowers/plans/2026-07-13-babyora-ui-90-plus-plan.md` — Task 5
6. `docs/superpowers/specs/2026-07-13-babyora-visual-signature-design.md`
7. `docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md`

The implementation must evolve the existing Morgennatt/temperature design
system. It must not introduce a separate generic component library or a new
brand direction.

## 2. Authorization boundary and non-goals

Implementation starts only after the owner explicitly authorizes the package.
Approval of the design direction and this plan is not approval to edit app
code.

Non-goals for this package:

- changing clothing thresholds, guardrails or Motor V2 activation;
- building family sharing or a backend;
- adding live location tracking, new notification infrastructure or a
  scheduler;
- changing App Store products, prices or RevenueCat entitlement semantics;
- redesigning unrelated Guide, Family or onboarding surfaces;
- replacing the design system or generating new avatar assets;
- deleting Min Garderobe implementation before all replacement entry points
  work and are verified.

The existing untracked `docs/screenshots/` directory is user work and stays out
of every candidate commit unless the owner explicitly changes its status.

### Deferred visual capture during implementation

Owner instruction 2026-07-19: do not produce new screenshots or video from the
app while the implementation is still changing. Waves may use DOM assertions,
component tests, accessibility checks and browser interaction without persisted
visual media. The deterministic screenshot matrix, video evidence and final
90+ visual PASS are deferred until a stable code candidate exists. GSD must
record the visual gate as pending rather than infer PASS from code tests.

## 3. Why this is a mixed-risk package

Pure layout, component, navigation, motion and accessibility changes are
**standard risk**. The following slices are **high risk** under the governing
process because an error can show a misleading clothing action, wrong future
recommendation or false paid-access state:

- coverage claims such as «Time for time», «hele dagen» and «samme antrekk
  til …»;
- add/remove/swap action sentences;
- passing child, time, place, activity, weather and finalized recommendation
  into the future Outfit drill;
- Free/Plus gating and paywall claims;
- Snart advice that tells a parent what to prepare.

High- and standard-risk changes must remain in separate candidate commits.
Combining them causes the whole candidate to inherit the high-risk lane.

## 4. Model and effort routing

GSD is the orchestrator and evidence ledger; it is not itself an approving
model. The runtime/session model must be selected explicitly because the local
GSD agent files do not pin models.

| Role or slice | Primary model | Effort | Why | May grant PASS? |
|---|---|---:|---|---|
| Document ingest and mechanical evidence updates | Claude Sonnet 5 | Medium | Deterministic documentation only | No |
| UI research, UI-SPEC and standard implementation planning | Claude Sonnet 5 | High | Product, architecture and visual judgment | Plan-check only in a fresh context |
| Standard UI executor: shell, Dagslinjen, motion, a11y, styles | Claude Sonnet 5 | High | Best cost/quality default for ordinary product UI | No; produces candidate SHA |
| Truth/coverage/context/entitlement executor | Claude Fable 5 | Extra | Safety- and trust-facing behavior | No; produces candidate SHA |
| High-risk verifier | Fresh Claude Fable 5 | Extra | Independent two-key verification | Yes, for exact immutable high-risk SHA |
| High-risk fallback | Claude Opus 4.8 | Extra | Approved fallback when Fable is unavailable | Yes, only in a fresh verifier context |
| External plan and code adversary | Codex GPT-5.6, fresh session | High | Cross-AI review; did not author the Claude implementation | Findings/review only; GSD verifier closes gate |
| Standard phase verifier | Fresh Claude Sonnet 5 | High | Goal-backward verification of immutable SHA | Yes, for standard slice |
| UI auditor and 90+ scorer | Fresh Codex or fresh Sonnet 5 | High | Independent visual/rubric judgment | Score only; cannot waive truth failures |
| Physical-device UAT | Owner/designated human | Human | Haptics, VoiceOver/TalkBack, thumb reach and subjective fit | Required evidence; cannot waive deterministic failures |

### Routing rules

- Fable is **not** the default visual-polish model. It is reserved for the
  high-risk truth, future-context, advice and access slices.
- Ordinary UI may escalate from Sonnet High to Fable Extra only after two
  evidenced failed repair cycles or if the scope crosses a high-risk boundary.
- The executor and verifier are always separate contexts. A new edit after PASS
  invalidates that PASS.
- If neither Fable nor the approved Opus fallback is available for a required
  high-risk gate, status is `BLOCKED`; never silently downgrade to Sonnet.
- Running GSD inside Codex uses the configured Codex model. To make Claude the
  primary coder, execute the implementation waves from Claude Code and use the
  same Git/GSD artifacts in Codex for independent review.

Expected usage is mostly Sonnet High, a small amount of Sonnet Medium, and
targeted Fable Extra only for the two-key high-risk slices.

## 5. GSD bootstrap before coding

The repo currently has only `.planning/codebase/`. It lacks `PROJECT.md`,
`REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, `config.json` and a phase directory.
GSD therefore cannot yet track or verify an implementation phase.

Use the checked-in manifest:

```text
$gsd-ingest-docs . --mode new --manifest docs/gsd/planlegg-ingest.yml
```

The ingest workflow must show the selected documents and receive approval. It
must stop on unresolved locked-decision conflicts.

The resulting GSD milestone should contain one Planlegg/Dagslinjen phase with
sequential plans/waves matching Sections 7–13 below. If the roadmapper splits
the work into multiple phases, preserve the same risk/model boundary and
dependencies.

Before any execution:

```text
$gsd-ui-phase <N>
gsd config-set workflow.plan_review_convergence true
$gsd-plan-review-convergence <N> --codex --max-cycles 3
```

Requirements for plan convergence:

- `UI-SPEC.md` reproduces the locked Dagslinjen hierarchy and state matrix;
- `PLAN.md` uses TDD before styling for all behavioral contracts;
- every plan has allowed paths, non-goals, risk lane, model/effort, tests,
  candidate commit and rollback note;
- the GSD plan-checker and external Codex reviewer have no unresolved HIGH or
  actionable MEDIUM concern;
- plan approval still does not authorize execution.

## 6. Shared Definition of Done

No plan is complete merely because its checkboxes are checked. The package is
complete only when:

- current and future planning copy is supported by evaluated data coverage;
- the selected future event opens its exact child/date/time/place/activity/
  weather/finalized-recommendation context;
- Free receives the complete supported today-at-home experience without future
  leakage;
- Plus receives the implemented future/Snart value and the paywall promises no
  unavailable feature;
- the screen has one app-level `<main>` and one vertical scroll owner;
- Dagslinjen is the dominant composition, with no mega-card or duplicate
  competing hourly list;
- all enabled deterministic visual states score at least 90/100;
- truth, entitlement, accessibility or safety failures cannot be offset by a
  visual score;
- standard and high-risk candidates have independent PASS tied to immutable
  SHAs;
- physical haptics and screen-reader behavior are documented on devices;
- CI and the final clean-checkout package gate pass on the final SHA.

## 7. Wave 0 — frozen UI and implementation contract

**Risk:** Standard planning only
**Model:** Sonnet 5 High
**GSD roles:** `gsd-ui-researcher`, `gsd-ui-checker`, `gsd-planner`, fresh
`gsd-plan-checker`; external Codex plan review
**App-code changes:** None

Deliverables:

- `UI-SPEC.md` with normal, no-change, one-change, many-change, rain, location,
  extreme temperature, loading/error/offline, Free, Plus, Soon, dark, 200%
  text, reduced-motion and focus states;
- exact layout hierarchy, component states, copy grammar, motion and haptic
  grammar;
- file-by-file plans with the risk split below;
- baseline screenshot and score references;
- source SHA for every governing decision.

Gate: GSD plan-checker plus external Codex review both pass. Owner then
explicitly authorizes either one wave or the complete bounded package.

## 8. Wave 1 — truthful planning model

**Risk:** High
**Model:** Fable 5 Extra, fresh Fable/approved Opus verifier
**Atomic commit:** `feat: model truthful planning moments`

Expected files:

- modify `src/lib/planning/change-events.ts`
- modify `src/lib/planning/change-sentence.ts`
- modify `src/lib/planning/rail-rows.ts`
- create `src/lib/planning/coverage.ts`
- create `src/lib/planning/plan-view-model.ts`
- modify/create focused tests under `src/lib/planning/__tests__/`

Required contract:

- use stable ISO timestamp/event identity rather than hour-only identity;
- preserve separate `addedGarments` and `removedGarments`;
- support `add | remove | swap | rain | location | prep`;
- carry a plain-language weather cause and destination planning-context ID;
- generate `Ta på`, `Ta av`, `Bytt fra … til …`, `Ta med` or `Forbered`;
- never lead with `+N til`; additional detail belongs behind disclosure;
- distinguish contiguous hourly coverage from four samples;
- never claim «Time for time», «hele dagen» or «samme antrekk til …» without
  coverage evidence;
- weather-only changes create no clothing marker;
- remain a presentation/view-model layer over finalized recommendations; do
  not change recommendation rules.

TDD fixtures:

- no change, one change and many changes;
- add-only, remove-only and true swap;
- rain/equipment, location and preparation;
- complete-hour versus sampled coverage;
- ordering, duplicate fingerprints, DST and Europe/Oslo boundaries;
- loading/error/offline-safe outputs.

Focused evidence:

```powershell
npx vitest run src/lib/planning/__tests__
npx vitest run src/lib/wool-layers/__tests__
```

Gate: high-risk verifier inspects and tests the exact candidate SHA. Executor
cannot self-PASS.

## 9. Wave 2 — exact future Outfit context

**Risk:** High
**Model:** Fable 5 Extra, fresh Fable/approved Opus verifier
**Atomic commit:** `fix: preserve exact planned outfit context`

Expected files:

- create `src/lib/planning/context.ts` and tests;
- modify `src/screens/UkeScreen.tsx`;
- modify `src/App.tsx`;
- modify `src/screens/PaakledningScreen.tsx`;
- create/update a deterministic Planlegg E2E journey.

One immutable payload carries:

- child identity and age inputs;
- ISO date/time and timezone;
- place label and coordinates without location history;
- activity and vogn mode;
- weather snapshot;
- already finalized recommendation and planning event ID;
- access state required to render the destination truthfully.

When this payload is present, Outfit must not silently recompute from current
weather or current time. A future-event E2E test proves the displayed date,
place, activity, temperature and garments all belong to the selected event.

Gate: full two-key high-risk review of the candidate SHA, including focused
planning/motor tests, E2E, full tests and build.

## 10. Wave 3 — semantic Dagslinjen component

**Risk:** Standard
**Model:** Sonnet 5 High, fresh Sonnet verifier
**Atomic commit:** `feat: render the semantic Dagslinjen`

Expected files:

- rewrite `src/components/planning/PlanChangeRail.tsx`;
- add component tests;
- create a scoped Planlegg stylesheet if required;
- reuse existing safe garment-ID/image helpers;
- modify shared segmented control only if required by its existing contract.

Component contract:

- controlled `selectedEventId`, `onSelect` and `onOpenOutfit`;
- exactly one expanded event;
- one semantic ordered list; unchanged spans are static list items;
- marker shape plus verb text carries meaning without color;
- real `<time>` values;
- expanded event shows one action, cause, at most three safe thumbnails and
  `Se hele antrekket`;
- `aria-expanded` and focus remain correct;
- 44-point targets, large-text reflow and forced-color support;
- calm 200–280 ms inline motion and instant reduced-motion end state;
- one `light` haptic per expansion, no duplicate or decorative haptic.

Gate: component tests, accessibility assertions, focused screenshots and fresh
standard review.

## 11. Wave 4 — make Dagslinjen the Planlegg screen

**Risk:** Standard
**Model:** Sonnet 5 High, fresh Sonnet verifier
**Atomic commit:** `feat: rebuild Planlegg around Dagslinjen`

Screen contract:

- `App.tsx` owns the only `<main>` and the only vertical page scroll;
- visible `Planlegg` title and compact child/place context;
- restrained `I dag / Uke / Snart` control;
- current verdict and next meaningful action before the rail;
- temperature-reactive canvas retained;
- remove mega-card, repeated white event cards, duplicate hourly list, burden
  pills and dead place/bell affordances;
- complete forecast becomes a secondary disclosure;
- loading/error/offline remain real and accessible;
- no active bottom-tab outline caused by persistent touch focus.

Gate: deterministic browser assertions and visual-state matrix on 390 × 844,
plus Hjem/Guide/Family regression if shared navigation changes.

## 12. Wave 5 — truthful Free/Plus, Uke and Snart

**Risk:** High for advice/access; keep standard route-only edits separate
**Model:** Fable 5 Extra for advice/access; Sonnet 5 High for isolated routing UI
**Atomic commits:**

- `feat: gate future planning truthfully`
- `feat: add truthful Snart preparation`

Required behavior:

- Free always receives the complete supported today-at-home Dagslinje;
- Free sees one truthful future example, not unlocked future advice;
- Plus receives implemented future days/places;
- locked content never behaves like an Outfit link;
- paywall returns focus and only promises enabled capabilities;
- Snart produces cautious deterministic 4–6 week `mustHave`, `niceToHave` and
  `notYet` groups;
- optional size language remains probabilistic, never exact;
- `har allerede` is lightweight and does not recreate wardrobe maintenance;
- former Min Garderobe entry points migrate only after replacement routes work.

Any modification to premium gating, entitlement interpretation, location
collection or advice semantics remains a high-risk Fable slice with separate
verification.

## 13. Wave 6 — native polish and shared navigation

**Risk:** Standard
**Model:** Sonnet 5 High
**Atomic commit:** `style: complete Planlegg native interaction evidence`

Required behavior:

- `selection` haptic on view/date change;
- `light` haptic exactly once on event expansion;
- preference-off and web fallback are safe no-ops;
- focus rings use `focus-visible`, not retained touch focus;
- bottom navigation uses a filled/stronger icon, stronger label and quiet mint
  pool, never a permanent full outline;
- light, dark, cold, mild and warm contrast pairs pass;
- 200% text has no clipping or horizontal page scroll;
- VoiceOver/TalkBack order is title → context → view control → verdict → rail;
- root navigation motion remains restrained and reduced motion is immediate.

Because BottomTabBar is shared, capture Hjem, Planlegg, Guide and Familie before
granting PASS.

## 14. GSD execution and review loop

Run one wave at a time so the correct model/effort and risk gate apply:

```text
$gsd-execute-phase <N> --wave 1
$gsd-execute-phase <N> --wave 2
...
```

Use Fable Extra sessions for high waves and Sonnet High sessions for standard
waves. Each executor produces focused evidence and an atomic candidate commit.

After the implemented phase:

```text
$gsd-code-review <N> --depth=deep
$gsd-verify-work <N>
$gsd-ui-review <N>
```

Run the deep code review from a fresh Codex context when Claude authored the
code. The fresh GSD verifier then evaluates acceptance criteria, review
findings, deterministic evidence and the exact candidate SHA.

If gaps are found:

```text
$gsd-plan-phase <N> --gaps
$gsd-execute-phase <N> --gaps-only
$gsd-code-review <N> --depth=deep
$gsd-verify-work <N>
$gsd-ui-review <N>
```

Repeat on a new SHA. One unsuccessful repair cycle with continuing model
disagreement escalates to the owner instead of being auto-approved.

## 15. Deterministic final checks

After the last edit and again from a clean checkout of the final SHA:

```powershell
git diff --check
npm test
npm run lint
npm run build
npm run audit:test
npm run e2e
npm run audit:prepare
npm run audit:finalize
```

Update the Planlegg browser verifier; the existing verifier that expects the
superseded two-tab/old-card screen is not valid evidence unchanged.

The fixed fixture matrix uses 390 × 844, Europe/Oslo, a frozen clock, mocked
forecast, fixed child and explicit Free/Plus state:

- no change, one change, many changes;
- rain and location/context change;
- extreme cold and heat;
- Free future teaser, Plus week and Soon;
- loading, error and offline;
- light and dark;
- 200% text, reduced motion and keyboard focus.

Every artifact records the candidate SHA and fixture ID/hash.

## 16. 90+ and human gates

Use the existing 100-point rubric:

- hierarchy 20;
- interaction 15;
- craft 15;
- color 10;
- copy/trust 15;
- product value 20;
- accessibility 5.

PASS requires Planlegg ≥90 for all enabled representative states and no P0/P1,
truth, entitlement, safety or accessibility failure.

Physical-device evidence is mandatory for:

- VoiceOver and TalkBack reading/focus order;
- text scaling/Dynamic Type behavior;
- haptic tier, call count and preference-off behavior;
- one-handed scroll and thumb reach;
- subjective fit with Babyora's locked design direction.

GSD records this in `<phase>-UAT.md`; it cannot simulate or waive missing
physical evidence. Missing required device evidence is `BLOCKED`, not PASS.

## 17. Approval ownership

- **Owner:** authorizes implementation scope, material design/product changes,
  exceptions and release.
- **GSD plan-checker/UI-checker:** approves plan/spec completeness only.
- **Executor:** may create code, commits and evidence; cannot grant standard or
  high PASS to its own work.
- **Fresh standard verifier:** may PASS a standard candidate SHA.
- **Fresh Fable/approved Opus verifier:** required to PASS high-risk candidate
  SHAs.
- **External Codex reviewer:** adversarial review and independent rubric input;
  cannot silently fix and approve the same candidate.
- **Human device tester:** attests physical native behavior.
- **GSD:** tracks state, dispatches roles, stores review/UAT/gap artifacts and
  blocks phase closure when required evidence is missing.

So yes: GSD follows up and checks the implementation, but only as an
orchestrator of independent evidence. It is deliberately not allowed to let
the same executor approve its own work.
