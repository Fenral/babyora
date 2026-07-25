---
phase: 02-outfit-truth-antrekkskart
plan: "08"
plan_id: "02-08"
status: PASS
subsystem: outfit-truth-presentation-and-producer-provenance
requirements-completed: [OUTFIT-01, OUTFIT-02]
candidate_sha: f1688a5799af2806b790ece790d9630438625b14
candidate_tree: 84cba557578677541ee450aa146f19d9a99fdcab
candidate_parent_sha: c7867f9adefd9aeae16518224f6700c900b58d08
candidate_subject: "fix(outfit): enforce producer result provenance"
feature_flag: false
dependency_ancestry: PASS
dependencies:
  - {plan: "02-01", candidate_sha: 5f2217eb46ea64a33bfafe24c588c434cd30a0f3, ancestry: PASS}
  - {plan: "02-02", candidate_sha: ac20e97e106aa0953d70f38ec5427d5a6af9e3d5, ancestry: PASS}
  - {plan: "02-03", candidate_sha: be3e82e7e14428b97f1181da578b7f60b89fbd4f, ancestry: PASS}
  - {plan: "02-04", candidate_sha: 3e01127a198427bd762113bcc7b1da4cd55b937d, ancestry: PASS}
  - {plan: "02-05", candidate_sha: ac9e78311b01f8b2d52f10c33600a80d7d996366, ancestry: PASS}
  - {plan: "02-06", candidate_sha: 947be06ff2615482572567b4066ae0832f5d8dee, ancestry: PASS}
  - {plan: "02-07", candidate_sha: 05b4b503ce162b49c94d6fe95ae0a2d429a92160, docs_head: b5c0a1f2dfd7993c0c78dc8bd9ce77f2bbee09e3, ancestry: PASS}
planning_amendments:
  compatibility_sha: 747e544097ec7d5c5c163b23015bb6c56be9e4f2
  provenance_sha: c7867f9adefd9aeae16518224f6700c900b58d08
repair_trace:
  - {sha: d84dc6f, disposition: rejected, finding: "initial review P2 plus P1"}
  - {sha: 6eecf4d, disposition: rejected, finding: "P1 top-level producer provenance absent"}
  - {sha: f1688a5, disposition: accepted, finding: "producer-owned top-level result provenance"}
source_surface:
  implementation_file_count: 6
  implementation_paths:
    - src/lib/outfit/feature-flags.ts
    - src/lib/outfit/outfit-bundle-producer.ts
    - src/lib/outfit/__tests__/outfit-bundle-producer.test.ts
    - src/components/outfit/OutfitTruthPanel.tsx
    - src/components/outfit/VerifiedAvatarComposite.tsx
    - src/components/outfit/__tests__/OutfitTruthPanel.test.tsx
  planning_only_amendments: [02-08-COMPATIBILITY-AMENDMENT.md, 02-08-PROVENANCE-AMENDMENT.md]
candidate_blobs:
  feature_flags: 6801765656f7227f695c2f973ced8fcbeafaf687
  producer: 79300405a6414acc2650bb82d9d05700c833ef8b
  producer_test: 0451d64670e12ca4fc61ec0c473829a7aabd7a61
  panel: 7869855b46e4478f5b425bcb6616111036172ebe
  panel_test: dac7d5c117d513bd77dd0225bf31e9a649c0c30f
  verified_avatar_composite: 0a03688b2fa8f65b02bfcb9fdb4441044869e8e4
inventory:
  script_blob: d4af276900bdfbdde9a27a00f5620e49c294c41a
  test_blob: 5c6a3db2adbbcddcaae956b56d17650e0110cb57
  scenario_count: 2036160
  partitions_passed: "70/70"
  max_semantic_garments: 11
  above_ten: 12960
  status: PASS
review_receipt_count: 2
unresolved_p0: 0
unresolved_p1: 0
unresolved_p2: 0
unresolved_p3: 0
all_auto: true
human_judgment_required: false
external_cost: 0
push_performed: false
deploy_performed: false
---

# Phase 2 Plan 08: fail-closed outfit truth presentation and provenance

## Immutable accepted runtime target

The accepted runtime target is `f1688a5799af2806b790ece790d9630438625b14`, tree `84cba557578677541ee450aa146f19d9a99fdcab`, parent `c7867f9adefd9aeae16518224f6700c900b58d08`. The parent is the planning-only provenance amendment. The compatibility amendment is `747e544097ec7d5c5c163b23015bb6c56be9e4f2`; the exact 02-07 docs head is `b5c0a1f2dfd7993c0c78dc8bd9ce77f2bbee09e3`.

The runtime repair sequence is `d84dc6f` (initial candidate, rejected after P2 and P1 findings), `6eecf4d` (rejected: a structural P1 allowed unowned top-level producer-looking results), and `f1688a5` (accepted). Planning amendments and this closeout are documentation-only and separate from the accepted runtime commit.

## Truth and presentation matrix

| Producer result | Trusted result condition | Panel behavior | Ineligible behavior |
|---|---|---|---|
| supported | Exact producer-owned top-level result | Exact map, manifest-exact avatar or neutral, inner-first rows, equipment, finalized alternatives, recovery content | Invalid avatar/session is neutral; no reconstructed truth |
| unsupported-cardinality | Exact producer-owned 11-item inventory result | Full inner-first ordered garment list and separate equipment list | No map, avatar claim, alternatives, registration, guide action, or motion marker |
| unavailable | Exact producer-owned unavailable result | Neutral unavailable content only | No weather, advice, map, row, image, guide, store, or motion work |
| any unowned input | Not an owned top-level producer result | Neutral unavailable content only | No envelope or nested field inspection before rejection |

`OUTFIT_TRUTH_V1_AVAILABLE` remains compile-time `false`, with no bypass. The supported presentation preserves `Ta på innerst først`, exact order and equipment, `ba-temp-root`/existing temperature axis, recovery text and optional guide, row-only registration, and equivalent settled/landing semantic lifecycle. Landing is never hidden, inert, or enabled for list-only/unavailable truth.

## Top-level provenance and adversarial matrix

The producer freezes each public return recursively and then registers the exact top-level object in a private `WeakSet`. `isOutfitBundleProducerResult` performs only identity membership after the primitive guard; it reads neither property, prototype, descriptor, freeze state, iteration, nor nested value. No symbol or copyable brand is used.

| Input | Expected result | Automated evidence |
|---|---|---|
| Real supported/current, inventory-derived unsupported/planned, real unavailable | Accepted | Producer and panel fixtures use `produceOutfitBundle` outputs |
| Deep-frozen structured clone or spread clone | Neutral | WeakSet identity differs |
| Supported wrapper with authentic base/options and individually valid source/weather | Neutral | Top-level wrapper is unregistered |
| Option graft or duplicate option | Neutral | Top-level wrapper is unregistered |
| Authentic unsupported truth wrapped with arbitrary labels or duplicate/order mutation | Neutral | Top-level wrapper is unregistered |
| Transparent or revoked/throwing proxy | Neutral | No proxy trap invoked |
| Throwing accessor | Neutral | Getter calls remain zero |
| Nested snapshot or option passed as bundle | Neutral | Only top-level result is registered |

The selection consumer remains read-only in the supported branch. Closed/reset sessions use the base snapshot; an exact selected session uses only the unique matching outcome. Foreign or inconsistent sessions produce a neutral avatar. SSR lifecycle, registration, hidden-middle, optional-guide, and no-motion cases remain covered.

## Avatar and protected compatibility boundary

All 24 manifest cases render only the exact trusted asset. Hidden inner and middle layers remain unclaimed; unknown, duplicate, rank-tie, missing, extra, malformed, mismatched, or otherwise neutral diagnostics render no image. The protected legacy Hjem compatibility props remain source-compatible but are neutral-only: `assetOverride` and `outfitSummary` are ignored and only neutral pose geometry may be selected. This plan does not change Hjem, App, Uke, Paakledning, navigation, package, engine, media, tokens, or feature activation.

## RED to GREEN and gates

RED evidence: after the top-level provenance gate was introduced, five former hand-built accepted panel fixtures correctly rendered neutral. GREEN replaced accepted fixtures with real producer output and added wrapper, clone, proxy, accessor, source/weather, options, unsupported, unavailable, and nested-result adversarial coverage. Focused and adjacent suites passed **155/155**; independent review A recorded **156/156** focused. The full suite passed **95 files, 1,271 passed, 1 todo**. `npx tsc --noEmit`, lint, main build plus bare build, inventory assertion, diff check, protected scope scan, and clean-tree checks passed.

## Coverage

| ID | Requirement | Automated coverage | all_auto |
|---|---|---|---|
| OUTFIT-01-PROVENANCE | OUTFIT-01 | Producer WeakSet identity, recursive freezing, clone/proxy/accessor/nested rejection | true |
| OUTFIT-01-LIST-ONLY | OUTFIT-01 | Real exact inventory-derived 11-garment list and equipment with no graphical/action claims | true |
| OUTFIT-02-SUPPORTED | OUTFIT-02 | Real supported map/list/equipment/options/recovery/temperature/row lifecycle | true |
| OUTFIT-02-AVATAR | OUTFIT-02 | 24 manifest cases, hidden-middle, neutral diagnostics, selected/reset/foreign/inconsistent sessions | true |
| OUTFIT-02-FAIL-CLOSED | OUTFIT-02 | Unavailable and unowned top-level values are neutral with zero getter/trap work | true |
| OUTFIT-02-OWNERSHIP | OUTFIT-02 | Protected scope, false flag, compatibility neutral path, source audit | true |

## Rollback and closeout

Rollback of runtime behavior is a revert of accepted runtime commit `f1688a5799af2806b790ece790d9630438625b14`. Revert planning amendments or this docs-only closeout separately; neither changes runtime behavior. No dependencies were installed and external cost is NOK 0; no push or deployment occurred.
