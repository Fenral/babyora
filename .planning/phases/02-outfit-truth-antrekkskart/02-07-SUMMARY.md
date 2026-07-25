---
phase: 02-outfit-truth-antrekkskart
plan: "07"
plan_id: "02-07"
status: PASS
subsystem: recovery-copy-and-generic-alternative-boundary
tags: [outfit, recovery-copy, byte-equivalence, accessibility, alternatives, ownership]

candidate_sha: 05b4b503ce162b49c94d6fe95ae0a2d429a92160
candidate_tree: 642c678f2d19b363bb60026b0ee7d6cdc001e363
candidate_parent_sha: 7cc1b69f16acf484a6748aecb45b6e3cfb0cfdf4
dependency_ancestry: PASS
dependencies:
  - plan: "01-18"
    candidate_sha: 5cf7df85014fa51096b06a7e381926ebb4601798
    ancestry: PASS
  - plan: "02-04"
    candidate_sha: 3e01127a198427bd762113bcc7b1da4cd55b937d
    ancestry: PASS
  - plan: "02-05"
    candidate_sha: ac9e78311b01f8b2d52f10c33600a80d7d996366
    ancestry: PASS
  - plan: "02-06"
    candidate_sha: 947be06ff2615482572567b4066ae0832f5d8dee
    docs_closeout_sha: 7cc1b69f16acf484a6748aecb45b6e3cfb0cfdf4
    ancestry: PASS
inventory:
  script_blob: d4af276900bdfbdde9a27a00f5620e49c294c41a
  test_blob: 5c6a3db2adbbcddcaae956b56d17650e0110cb57
  scenario_count: 2036160
  partitions_passed: "70/70"
  max_semantic_garments: 11
  above_ten: 12960
  status: PASS
source_surface:
  implementation_file_count: 4
  paths:
    - src/lib/copy/warm-cold-recovery.ts
    - src/lib/copy/__tests__/warm-cold-recovery.test.ts
    - src/screens/VarmEllerKaldScreen.tsx
    - src/components/PlaggDetailSheet.tsx
candidate_blobs:
  recovery_copy: 281c9e9a0b66388b5526ed1f1087258fcf190e2e
  recovery_copy_test: bc09553c357763c972637efd20f75c08e6540c1a
  warm_cold_screen: 3c6955fe8c62f00b892d96055468cab422f6909b
  garment_detail_sheet: 777f1808cbab0c610e7336482572841138352519
before_after_copy:
  status: byte-equivalent
  encoding: UTF-8
  tuple: [title, instruction, warm, perfekt, cold, warm_aria, perfekt_aria, cold_aria]
  ownership: shared-copy-only; visual metadata remains local to VarmEllerKaldScreen
  frozen: [root, statuses_map, warm_record, perfekt_record, cold_record]
generic_writer_audit:
  status: PASS
  raw_store_import_read_write: absent
  mutation_identifiers: [setSwap, handleSwap]
  mutation_identifiers_status: absent
  false_affordances: ["Bytte til", "Bytt til", swap_haptic, swap_icon, button, click, pointer, selectable, success, close_on_candidate]
  false_affordances_status: absent
  catalog_rendering: informational-ul-li-name-pros-cons
deferred_legacy_imports:
  status: unchanged-and-deferred
  owner: later-serialized-screen-integrator
  paths:
    - src/screens/HjemScreen.tsx
    - src/screens/UkeScreen.tsx
review_receipt_count: 2
unresolved_p0: 0
unresolved_p1: 0
unresolved_p2: 0
reviews:
  - lane: A
    canonical_task: /root/review_02_07_05b_a
    session: review_02_07_05b_a-05b4b50
    focus: copy-safety-and-byte-equivalence
    capability: high-verification
    fresh_context: true
    fork_turns: none
    independent_from_implementation: true
    verdict: PASS
    unresolved_p0: 0
    unresolved_p1: 0
    unresolved_p2: 0
  - lane: B
    canonical_task: /root/review_02_07_05b_b
    session: review_02_07_05b_b-05b4b50
    focus: deceptive-interaction-and-native-lifecycle
    capability: high-verification
    fresh_context: true
    fork_turns: none
    independent_from_implementation: true
    verdict: PASS
    unresolved_p0: 0
    unresolved_p1: 0
    unresolved_p2: 0
requirements-completed: [OUTFIT-02]
coverage:
  - id: COPY-BYTE-EQUIVALENCE-01
    description: "The title, two-finger instruction, three status tuples, and three accessible labels render byte-equivalently from UTF-8 shared copy."
    requirement: OUTFIT-02
    verification: [{kind: unit, ref: src/lib/copy/__tests__/warm-cold-recovery.test.ts, status: pass}]
    human_judgment: false
  - id: COPY-IMMUTABILITY-02
    description: "Shared guidance is typed and deeply frozen at the root, status map, and every status record, with no threshold, diagnosis, recommendation, or health-state logic."
    requirement: OUTFIT-02
    verification: [{kind: unit, ref: src/lib/copy/__tests__/warm-cold-recovery.test.ts, status: pass}]
    human_judgment: false
  - id: WARM-COLD-OWNERSHIP-03
    description: "VarmEllerKaldScreen is the sole consumer of the shared copy while preserving local visual metadata and unchanged back/CTA haptics and navigation."
    requirement: OUTFIT-02
    verification: [{kind: unit, ref: src/screens/VarmEllerKaldScreen.tsx, status: pass}]
    human_judgment: false
  - id: GENERIC-NO-RAW-WRITER-04
    description: "Generic garment candidates remain informational name/pros/cons list content and cannot read, write, or present a raw replacement action."
    requirement: OUTFIT-02
    verification: [{kind: unit, ref: src/lib/copy/__tests__/warm-cold-recovery.test.ts, status: pass}]
    human_judgment: false
  - id: CANONICAL-ONLY-ACTION-05
    description: "OutfitGarmentList and OutfitExperience retain the sole production Se alternativ select/reset replacement action; unchanged Hjem/Uke legacy readers are explicitly deferred."
    requirement: OUTFIT-02
    verification: [{kind: other, ref: src/components/PlaggDetailSheet.tsx, status: pass}]
    human_judgment: false
  - id: NATIVE-LIFECYCLE-06
    description: "Generic detail preserves native dialog X, Escape, backdrop, single-flight, reduced-motion/animation fallback, focus return, and .ba-press:focus-visible behavior."
    requirement: OUTFIT-02
    verification: [{kind: integration, ref: src/screens/__tests__/OutfitExperience.ssr.test.tsx, status: pass}]
    human_judgment: false
  - id: IMMUTABLE-REVIEW-07
    description: "Inventory, type, lint, main/bare builds, scope checks, and two independent fresh-context high-verification reviews passed the same immutable candidate."
    requirement: OUTFIT-02
    verification: [{kind: other, ref: .planning/phases/02-outfit-truth-antrekkskart/evidence/02-07-INDEPENDENT-REVIEW.md, status: pass}]
    human_judgment: false
completed: 2026-07-25
external_cost: 0
push_performed: false
deploy_performed: false
---

# Phase 2 Plan 07: Recovery copy boundary and truthful generic alternatives

**PASS — Plan 02-07 centralizes the established cautious neck-check wording without changing it, and removes the generic catalog surface that could falsely claim a candidate replaced the outfit.**

## Immutable closeout target

Candidate `05b4b503ce162b49c94d6fe95ae0a2d429a92160`, tree `642c678f2d19b363bb60026b0ee7d6cdc001e363`, and parent `7cc1b69f16acf484a6748aecb45b6e3cfb0cfdf4` are the reviewed implementation target. Accepted 02-06 candidate `947be06ff2615482572567b4066ae0832f5d8dee`, 02-05 `ac9e78311b01f8b2d52f10c33600a80d7d996366`, 02-04 `3e01127a198427bd762113bcc7b1da4cd55b937d`, and Phase 1 `5cf7df85014fa51096b06a7e381926ebb4601798` are ancestors.

The exact four-path implementation surface is the shared copy module and its test, `VarmEllerKaldScreen`, and `PlaggDetailSheet`. Protected App, Hjem, Uke, Paakledning, navigation, store, engine, package, media, and global-token surfaces are unchanged.

## Byte-equivalent copy and screen ownership

The governed UTF-8 tuple is unchanged before and after extraction: `Kjenn nakken`; `Stikk to fingre under genseren bak i nakken — ikke hender eller føtter.`; warm `For varm` / `Svett eller fuktig nakke` / `Ta av`; perfect `Perfekt` / `Lun og tørr nakke` / `Behold`; cold `For kald` / `Kjølig eller kald nakke` / `Legg til`; and their established accessible labels. It now has one typed source, deeply frozen at the root, status map, and each status record.

The module is copy-only: it introduces no thresholds, diagnosis, recommendation, health state, JSX, icons, styles, or engine behavior. `VarmEllerKaldScreen` is its sole consumer and retains its local visual metadata. Existing back and CTA haptics/navigation are unchanged.

## Generic detail is informational, not a replacement action

`PlaggDetailSheet` keeps catalog candidates as name/pros/cons information in `ul`/`li`. It has no raw-store import/read/write, `setSwap` or `handleSwap`, swap haptic/icon, `Bytte til`/`Bytt til`, selectable/click/pointer/button success semantics, or close-on-candidate behavior. It retains native dialog X/Escape/backdrop lifecycle, single-flight behavior, reduced-motion and animation fallback, focus return, and `.ba-press:focus-visible`.

The canonical `OutfitGarmentList`/`OutfitExperience` finalized select/reset `Se alternativ` route remains the only production replacement action. Legacy swap-store readers in `src/screens/HjemScreen.tsx` and `src/screens/UkeScreen.tsx` are unchanged and explicitly deferred to the later serialized screen integrator; Plan 02-07 does not claim store deletion.

## RED → GREEN and verification

The characterization test first failed RED because `../warm-cold-recovery.js` was absent. GREEN contract tests passed **2/2**; focused tests **51/51**; OutfitExperience SSR **15/15**; the full suite **94 files / 1,253 passed / 1 todo**. The candidate-local inventory assertion passed using script blob `d4af276900bdfbdde9a27a00f5620e49c294c41a` and test blob `5c6a3db2adbbcddcaae956b56d17650e0110cb57`: 2,036,160 scenarios, 70/70 partitions, maximum 11, and 12,960 above ten. Typecheck, lint, main and bare builds, diff/scope checks, and clean-tree verification passed.

Two independent fresh-context high-verification reviews examined this same candidate and returned PASS with P0/P1/P2 **0/0/0**. Lane A reviewed copy safety and byte equivalence; lane B reviewed deceptive interaction, native lifecycle, and ownership boundaries. The receipts are preserved in the companion independent-review record.

## Rollback and closeout scope

To roll back runtime behavior, revert only implementation commit `05b4b503ce162b49c94d6fe95ae0a2d429a92160`; this documentation closeout is independently reversible. No install, push, deployment, publication, media change, or external cost occurred. This docs-only closeout introduces no runtime behavior.

## Quality check

Seven auto-covered items classify cleanly: byte-equivalent copy/ARIA, deep immutability and copy-only boundary, Varm rendering/visual ownership, no raw writer/informational alternatives, canonical action plus deferred readers, native lifecycle, and immutable inventory/review gates. The closeout diff contains only this summary and its independent-review evidence.
