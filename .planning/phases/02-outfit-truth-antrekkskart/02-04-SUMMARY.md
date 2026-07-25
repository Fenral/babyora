---
phase: 02-outfit-truth-antrekkskart
plan: "04"
plan_id: "02-04"
status: PASS
subsystem: outfit-experience
tags: [outfit, antrekkskart, accessibility, comparison, responsive, design-system]

candidate_sha: 3e01127a198427bd762113bcc7b1da4cd55b937d
candidate_tree: aeaeb4abec5f026302e512dcb460272157945051
assembly_base_sha: 4e5378898a188881e64d496c8d03a993e536a0cf
assembly_base_tree: 967390f99654a3029a2511c37460df376ffcf8db
dependency_ancestry: PASS
dependencies:
  - plan: "02-01"
    candidate_sha: 5f2217eb46ea64a33bfafe24c588c434cd30a0f3
    candidate_tree: 1aa17e4649ab0b4e16deb44487381ed8bc1d5ef9
    ancestry: PASS
  - plan: "02-02"
    candidate_sha: ac20e97e106aa0953d70f38ec5427d5a6af9e3d5
    candidate_tree: b2aebb3d60fb7f75729e02beebb7aba800b8f0d3
    ancestry: PASS
  - plan: "02-03"
    candidate_sha: be3e82e7e14428b97f1181da578b7f60b89fbd4f
    candidate_tree: 4bc91e37a75cf77baa1435c9e91151796cc7a584
    ancestry: PASS

inventory:
  script_blob: d4af276900bdfbdde9a27a00f5620e49c294c41a
  test_blob: 5c6a3db2adbbcddcaae956b56d17650e0110cb57
  scenario_count: 2036160
  status: PASS

scope_file_count: 5
review_receipt_count: 2
unresolved_p0: 0
unresolved_p1: 0
reviews:
  - lane: A
    reviewer_id: /root/phase2_02_04_final_review_a3
    canonical_task: /root/phase2_02_04_final_review_a3
    session: phase2-02-04-final-review-a-3e01127
    capability: high-verification
    focus: semantics-state-row-registration
    fork_turns: none
    fresh_context: true
    independent_from_implementation: true
    verdict: PASS
    unresolved_p0: 0
    unresolved_p1: 0
  - lane: B
    reviewer_id: /root/phase2_02_04_final_review_b3
    canonical_task: /root/phase2_02_04_final_review_b3
    session: phase2-02-04-final-review-b-3e01127
    capability: high-verification
    focus: responsive-css-contrast-design-system-alternative-risk
    fork_turns: none
    fresh_context: true
    independent_from_implementation: true
    verdict: PASS
    unresolved_p0: 0
    unresolved_p1: 0

nonblocking_backlog:
  - id: 02-04-A2-P2-JSDOM
    source: earlier-lane-A2-review
    severity: P2
    disposition: backlog
    blocking: false
    summary: jsdom-backed interaction hardening suggestion

requires:
  - phase: 02-outfit-truth-antrekkskart
    plan: "02"
    candidate_sha: ac20e97e106aa0953d70f38ec5427d5a6af9e3d5
    provides: finalized complete alternative outcomes and exact-snapshot selection
  - phase: 02-outfit-truth-antrekkskart
    plan: "03"
    candidate_sha: be3e82e7e14428b97f1181da578b7f60b89fbd4f
    provides: bounded responsive map geometry and typed list-only fallback
provides:
  - complete accessible map and ordered-list outfit truth
  - independent hover, focus, and persistent selection across paired controls
  - finalized complete-outcome comparison, selection, and exact reset
  - row-only registration seam for later transition integration
affects: [02-06, 02-07, 02-08, 02-09, outfit, antrekkskart]

key-files:
  created:
    - src/components/outfit/Antrekkskart.tsx
    - src/components/outfit/Antrekkskart.css
    - src/components/outfit/OutfitGarmentList.tsx
    - src/components/outfit/OutfitExperience.tsx
    - src/components/outfit/__tests__/OutfitExperience.test.tsx
  modified: []

requirements-completed:
  - OUTFIT-01
  - OUTFIT-02

completed: 2026-07-24
external_cost: 0
push_performed: false
deploy_performed: false
---

# Phase 2 Plan 04: Accessible Antrekkskart Experience Summary

**The reviewed candidate presents complete outfit truth through paired,
accessible map and ordered-list controls, preserves equipment as an unconnected
list, and applies only complete finalized alternatives with deterministic
reset.**

## Plan Status

- **Plan ID:** `02-04`
- **Implementation candidate:**
  `3e01127a198427bd762113bcc7b1da4cd55b937d`
- **Implementation tree:** `aeaeb4abec5f026302e512dcb460272157945051`
- **Assembly base:** `4e5378898a188881e64d496c8d03a993e536a0cf`
  / `967390f99654a3029a2511c37460df376ffcf8db`
- **Dependency ancestry:** PASS for the exact reviewed Plan 02-01, 02-02,
  and 02-03 candidates
- **Implementation scope:** Exactly five authorized component/test files
- **Independent reviews:** Two distinct fresh-context,
  `high-verification` PASS receipts for the same candidate and tree, with no
  unresolved P0/P1
- **Inventory:** PASS, 2,036,160 scenarios
- **External cost:** 0
- **Push/deployment:** None
- **Status:** **PASS**

The documentation-only closeout commit containing this summary and its evidence
file follows the reviewed candidate and changes no implementation, test,
inventory, dependency, storage, network, or route behavior.

## Immutable Assembly and Dependencies

| Role | Plan / commit | Tree | Relationship to candidate |
|---|---|---|---|
| Required truth dependency | `02-01` / `5f2217eb46ea64a33bfafe24c588c434cd30a0f3` | `1aa17e4649ab0b4e16deb44487381ed8bc1d5ef9` | Ancestor, PASS |
| Required alternatives dependency | `02-02` / `ac20e97e106aa0953d70f38ec5427d5a6af9e3d5` | `b2aebb3d60fb7f75729e02beebb7aba800b8f0d3` | Ancestor, PASS |
| Required layout dependency | `02-03` / `be3e82e7e14428b97f1181da578b7f60b89fbd4f` | `4bc91e37a75cf77baa1435c9e91151796cc7a584` | Ancestor, PASS |
| Assembled dependency base | `4e5378898a188881e64d496c8d03a993e536a0cf` | `967390f99654a3029a2511c37460df376ffcf8db` | Ancestor, PASS |
| Reviewed Plan 02-04 candidate | `3e01127a198427bd762113bcc7b1da4cd55b937d` | `aeaeb4abec5f026302e512dcb460272157945051` | Exact review target |

The dependencies remain real ancestors; none was squashed, rewritten, or
represented by a copied-file substitute.

## Accomplishments

- Rendered every eligible garment as one numbered native map button and one
  decorative connector while retaining the complete ordered text list.
- Kept semantic equipment out of body-connected geometry and in a distinct
  unconnected list, including the full resulting equipment list in comparison
  when present.
- Implemented separate persistent `selectedId` and transient `focusId` /
  `hoverId`, with highlight priority `focusId ?? hoverId ?? selectedId`.
- Paired map nodes and ordered rows through shared `aria-pressed`, caption, and
  highlight state without programmatically moving focus.
- Registered only real ordered rows through `RegisterOutfitRow(itemId,
  element-or-null)`; map nodes never register.
- Exposed `Se alternativ` only for authorized finalized options, showed the
  complete resulting garments and equipment before confirmation, atomically
  selected the full outcome, and restored the exact base on reset.
- Preserved full list truth and omitted misleading map geometry for ineligible
  input.
- Evolved existing temperature, color, focus, motion, and forced-color
  contracts without adding global tokens, packages, media, or route
  integration.

## Presentation and Interaction Contract

```text
canonical finalized snapshot
  -> Plan 02-03 bounded layout
  -> one accessible node + one decorative connector per garment
  -> complete ordered rows headed "Ta på innerst først"
  -> equipment in a separate unconnected list
  -> shared hover/focus/selection presentation

authorized finalized option
  -> complete comparison (garments + equipment)
  -> atomic whole-snapshot selection
  -> exact base reset

ineligible geometry or rejected option
  -> no misleading map or fake action
  -> complete ordered list/equipment truth remains
```

- Counts 1-4 use spacious layout; counts 5-10 use compact rails.
- Every node's accessible name includes order, label, category, and body
  region. Connector graphics remain screen-reader decorative.
- The active full caption stays in normal document flow and is associated with
  both paired controls.
- Pointer and focus changes remain transient. Click, Enter, and Space commit
  selection through native button behavior.
- Experience-wide Escape clears transient hover/focus and preserves committed
  selection. If comparison is open, Escape closes it and restores focus.
- Selecting or highlighting an item never changes node geometry or row order.
- The root consumes an already-derived `kald|mild|varm` value through
  `.ba-temp-root` and `data-temp`; no recommendation threshold is introduced.
- Reduced-motion, forced-color, 44 px target, visible-focus, wrapping, and
  200% text contracts remain encoded in the component/CSS tests.

## Component Contract Matrix

| Surface | Complete truth | Interaction/accessibility | Failure behavior |
|---|---|---|---|
| `Antrekkskart` | One node and connector for every eligible garment; no equipment geometry | Native buttons, ordinal and full accessible label, paired pressed/highlight state, decorative SVG | No map for typed ineligible layout |
| `OutfitGarmentList` | Exact ordered garments plus separate complete equipment list | Exact heading `Ta på innerst først`; paired buttons; row-only mount/unmount registration | Remains the canonical presentation when map is unavailable |
| `OutfitExperience` | Renders the current complete snapshot | Owns independent selected/focus/hover state, caption, comparison lifecycle, full-outcome select/reset, Escape coordination | Rejects stale/empty options without mutation or fake action |
| Comparison dialog | Complete resulting ordered garments and equipment | Names source/target, advantages, tradeoffs, confirm/cancel; deterministic focus restoration | Empty equipment section is omitted; rejected option is not selectable |

The longest locked inventory label, `tykke ullsokker (vinterdress dekker)`,
reflows within the row through zero minimum inline size, wrapping, and
responsive detail layout; it is not clipped or hidden.

## Temperature Status Contrast

The final repair uses live `--ink-700` (`#56506F`) for map-status text against
the three temperature backgrounds:

| Temperature | Background | Contrast | Result |
|---|---|---:|---|
| Mild | `#DAD8EE` | 5.42:1 | PASS |
| Cold (`kald`) | `#CCDCF7` | 5.46:1 | PASS |
| Warm (`varm`) | `#EED1E0` | 5.35:1 | PASS |

Connector tests separately preserve the light/dark temperature matrix, active
width-and-dash redundancy, and forced-colors system-color mapping.

## Locked Inventory

| Metric | Result |
|---|---:|
| Scenarios | 2,036,160 |
| Unique outputs | 70 |
| Catalog coverage | 70/70 |
| Semantic garments | 57 |
| Garment body coverage | 57/57 |
| Semantic equipment | 13 |
| Maximum equipment items | 6 |
| Maximum garment items | 11 |
| Scenarios above supported 10-garment limit | 12,960 |
| Scenarios below one garment | 0 |

Inventory bindings:

- `scripts/outfit/inventory-v1.ts`:
  `d4af276900bdfbdde9a27a00f5620e49c294c41a`
- `scripts/outfit/__tests__/inventory-v1.test.ts`:
  `5c6a3db2adbbcddcaae956b56d17650e0110cb57`

The locked 11-garment case remains complete ordered list-only truth. It is not
truncated, aggregated, reordered, or passed into map geometry.

## Verification

| Gate | Result on reviewed candidate |
|---|---|
| Focused component/layout/store suite | 3 files, 112/112 passed |
| Component contract suite alone | 13/13 passed |
| Inventory assertion | PASS; 2,036,160 scenarios and all locked metrics |
| Full Vitest suite | 79 passed files, 1 skipped; 1,084 passed tests, 9 todo |
| ESLint, zero-warning policy | Passed |
| Standalone `tsc -b --pretty false` | Passed |
| Production build | Passed: TypeScript, main Vite, and bare Vite |
| Dependency and assembly ancestry | Passed |
| Exact five-file source scope | Passed |
| Package/lockfile, global-token, screen, and media scope | No changes |
| Inventory script/test blob binding | Passed |
| `git diff --check` and candidate cleanliness | Passed |

End-to-end browser execution is not a Plan 02-04 gate. Lane B did not run it
because port 4173 was occupied and did not alter or terminate the occupying
process.

Detailed immutable bindings and reviewer receipts are recorded in
[`evidence/02-04-INDEPENDENT-REVIEW.md`](evidence/02-04-INDEPENDENT-REVIEW.md).

## Independent Reviews

| Lane | Canonical task / session | Capability and plan-owned focus | Exact target | Verdict |
|---|---|---|---|---|
| A | `/root/phase2_02_04_final_review_a3` / `phase2-02-04-final-review-a-3e01127` | `high-verification`; semantics, three-field state, row-only registration; fresh context, `fork_turns: none` | `3e01127…` / `aeaeb4a…` | **PASS**, no unresolved P0/P1 |
| B | `/root/phase2_02_04_final_review_b3` / `phase2-02-04-final-review-b-3e01127` | `high-verification`; responsive CSS, contrast, design-system fit, fake-alternative risk; fresh context, `fork_turns: none` | `3e01127…` / `aeaeb4a…` | **PASS**, no unresolved P0/P1 |

Both receipts are independent from implementation, distinct by canonical task
and session, and bind the same exact candidate and tree.

### Nonblocking Backlog

An earlier Lane A2 review suggested additional jsdom-backed interaction
hardening. It is recorded as `02-04-A2-P2-JSDOM`, severity P2, nonblocking
backlog. It does not supersede or weaken the two final exact-candidate PASS
receipts.

## Final RED/GREEN Repair Chain

| Order | Commit | Gate | Result |
|---:|---|---|---|
| 1 | `e97cf5c3c388bdd7d82a45b22d8d5b59f92479df` | Prior reviewed candidate | Complete comparison equipment implemented |
| 2 | `711d005317b2150111d68e4e1ed2ad7e0612de3d` | RED | Escape coordination and longest-row reflow gaps reproduced |
| 3 | `4608a6ead1839c10f4d68135adad39ad476efa65` | GREEN | Experience-wide Escape and row reflow repaired |
| 4 | `013a8f3e06ce879a43401735905c65a09b0aff3a` | RED | Map-status contrast gap reproduced |
| 5 | `3e01127a198427bd762113bcc7b1da4cd55b937d` | GREEN / final candidate | Accessible live map-status token applied |

The final repair chain is linear and ends at the exact two-review target.
Earlier Plan 02-04 implementation and repair commits remain ancestors after the
assembly base; the table identifies the final review-driven chain without
recasting the earlier consolidated feature commit as a separate RED.

## Exact Five-File Source Scope

| Path | Candidate blob | Purpose |
|---|---|---|
| `src/components/outfit/Antrekkskart.tsx` | `9a4f45477e6ba3b7d44987605c15917797b7b0e3` | Accessible nodes, decorative connectors, and typed fallback status |
| `src/components/outfit/Antrekkskart.css` | `fb5a4d19f0e5bb73592309af576646a06c1306da` | Responsive, contrast, focus, forced-color, wrapping, and reduced-motion presentation |
| `src/components/outfit/OutfitGarmentList.tsx` | `4dc461c451c39919e9f6dde56aebbd68c5e0e9b5` | Ordered garment truth, equipment separation, paired rows, and row-only registration |
| `src/components/outfit/OutfitExperience.tsx` | `31ee3152b4de7ee29bd373ab4b50c1eb64c2d800` | Shared state, comparison focus/Escape lifecycle, whole-outcome selection, and reset |
| `src/components/outfit/__tests__/OutfitExperience.test.tsx` | `4bb658c248ccccb428286fee5245f0b9d655b945` | Executable component, interaction, responsive, contrast, and alternative contracts |

The assembly-base-to-candidate diff contains exactly these paths. No app
screen, route, global token, package manifest, lockfile, media, inventory,
engine, or unrelated feature path changed.

## Cost, Dependencies, and Prohibited Actions

- External API/tool spend: **0**
- New or changed dependencies: **none**
- Persistent storage: **none**
- Network/API calls: **none**
- Media generation or capture: **none**
- Push, deployment, or release action: **none**
- App-route integration: **none**
- Recommendation thresholds, safety guardrails, Motor V2, pricing, RevenueCat,
  analytics, family infrastructure, notifications, widgets, unrelated screens,
  outfit truth, and avatar assets: **unchanged**

## Rollback

Treat the five implementation/test files as one Plan 02-04 presentation
contract. Revert Plan 02-04 commits from
`3e01127a198427bd762113bcc7b1da4cd55b937d` through
`4b375c4bbdb188c81e27d08bfe77d55d25adcefc` in reverse chronological order,
returning to assembly base `4e5378898a188881e64d496c8d03a993e536a0cf`.
Then rerun the focused component/layout/store suite, inventory assertion, full
suite, lint, TypeScript, builds, ancestry, scope, blob, and diff-cleanliness
gates. Keep the Plan 02-02 and 02-03 dependency histories intact.

The documentation-only closeout commit may be reverted independently because
it changes no implementation or runtime behavior.

## User Setup Required

None. No package, credential, environment, external service, persistence, or
data migration is required.

## Next Plan Readiness

- Plan 02-04 is complete with two qualified fresh-context,
  `high-verification`, exact-candidate PASS receipts.
- Its accessible map/list presentation, finalized comparison, and row
  registration seam are ready for dependent integration and validation plans.
- No push, deployment, release, route integration, or later-plan
  implementation was performed by this closeout.

---

*Phase: 02-outfit-truth-antrekkskart*
*Plan: 02-04*
*Completed: 2026-07-24*
