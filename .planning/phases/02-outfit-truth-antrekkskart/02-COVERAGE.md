# Phase 2 Source Coverage Audit

Status: **PLANNED — no implementation evidence is claimed here**

## Locked decisions

| ID | Locked decision | Planned implementation |
|---|---|---|
| D-01 | Show every semantic garment for supported counts 1–10, numbered inner-first, with no `+N`, hiding, merge, reorder, or overlap. The measured 11-garment output remains complete list-only truth. | 02-01 inventory/builder; 02-03 geometry/ineligibility; 02-04 rendering; 02-08 panel; 02-09 browser gate. |
| D-02 | Semantic equipment is engine `utstyr` **or** canonical catalog `utstyr`; varmepose, saueskinn, sovepose and other equipment never become body nodes. | 02-01 exhaustive classifier and catalog/body coverage; 02-03/04/08/09 rejection/render tests. |
| D-03 | Responsive node geometry is rendering output, never recommendation truth. | 02-01 schema; 02-03 pure layout; 02-05 serialization guard; 02-09 audit. |
| D-04 | Separate persistent `selectedId`, transient `focusId`, and transient `hoverId`; persistent `aria-pressed`, no focus stealing, and non-color paired cues. | 02-04 reducer/markup/CSS; 02-09 pointer/keyboard/computed-style matrix. |
| D-05 | Canonical body/visible slots, layer rank, outer precedence and explicit occlusion derive the complete visible set; exact manifest pose/set or neutral. | 02-01 catalog/resolver/all 24 rows; 02-08 consumer; 02-09 hidden/duplicate/ambiguous/mismatch browser cases. |
| D-06 | Alternatives exist only for supported, occurrence-specific outcomes surviving existing finalization; whole snapshot swaps/reset; static catalog/equipment/list-only truth never pretends. | 02-02 option/store boundary; 02-04 UI; 02-06 producer; 02-07 generic fake-action removal; 02-09 browser gate. |
| D-07 | Reuse byte-identical cautious warm/cold copy and existing guide callback; add no thresholds, health claim, Motor change, or Avatar State V2. | 02-07 characterization; 02-08 callback/panel; 02-09 drift checks. |
| D-08 | Freeze exact identity/order/body/equipment truth and Phase-2-owned `RegisterOutfitRow`; after Phase-1 01-18, Hjem/Uke preserve their full normalized input and full finalized Recommendation in factory-owned seeds, and both App routes propagate them into Paak before Phase 3 owns Home registration. | 02-01 full builder; 02-02 full finalizer; 02-05 Hjem/Uke seed handoff; 02-06 producer; 02-09 App/production handoff. |
| D-09 | Foundation is isolated; cross-phase integration accepts exactly one upstream Phase-1 `candidate_sha`, normalizes it internally, proves commit/ancestry, and uses clean path-safe evidence. | 02-01–04 foundation; 02-05 strict raw-frontmatter gate; 02-09 absolute-path argument-array verifier launcher. |
| D-10 | Exact presentation: `Ta på innerst først`; spacious 1–4; compact rails 5–10; active caption in normal flow; existing perceived-temperature kald/mild/varm tokens. | 02-04 executable component contract; 02-08 composition; 02-09 computed DOM/styles. |
| D-11 | No new app screenshot/video; DOM/layout fixtures only. | Every plan; 02-09 prohibited-media scan. |
| D-12 | NOK 0; actions over NOK 1000 block autonomous execution. | Every plan; final ledger. |

## Requirement audit

| Source item | Status | Plans | Observable proof |
|---|---|---|---|
| ROADMAP Phase 2 goal | COVERED | 02-01–02-09 | Enabled real current/planned App-to-Paak truth, real row/guide propagation, component plus production-route browser evidence, Phase-3 handoff. |
| OUTFIT-01 | COVERED | 02-01, 02-03, 02-04, 02-05, 02-06, 02-08, 02-09 | Exhaustive semantic inventory; 1–10 geometry; 1/4/5/10 browser matrix; exact 11-item list-only fallback. |
| OUTFIT-02 | COVERED | 02-01, 02-02, 02-04, 02-05, 02-06, 02-07, 02-08, 02-09 | Finalizer/occurrence regressions; comparison/swap/reset; generic fake-action absence; unsupported branch has no action. |

## Resolved finite-domain evidence

Planning discovery used `02-INVENTORY.mts`, but implementation evidence must use the candidate-versioned tracked artifact created by 02-01. Reproducible execution command:

`npx tsx scripts/outfit/inventory-v1.ts --assert`

Required result:

| Metric | Value |
|---|---:|
| Enumerated scenarios | 2,036,160 |
| Unique finalized outputs | 70 |
| Catalog coverage | 70/70 |
| Semantic garments/body mapping | 57/57 |
| Unique semantic equipment | 13 |
| Maximum semantic equipment | 6 |
| Maximum semantic garments | 11 |
| Cases above 10 | 12,960 |
| Cases below 1 | 0 |

The 11-garment equivalence class cannot be normalized without dropping, merging, reordering, or changing finalized advice. Phase 2 therefore retains the locked graphical range of 1–10 and returns honest complete list-only output for 11; it does not silently add a third density mode.

## Research and interface audit

| Constraint | Status | Plans |
|---|---|---|
| Frozen occurrence identity and exact snapshot/fingerprint/transition triple | COVERED | 02-01, 02-05, 02-06, 02-09 |
| Semantic equipment union before count; required legacy-`ekstra` reclassifications | COVERED | 02-01, 02-02, 02-03, 02-09 |
| Pure spacious/compact layout and selection-independent geometry | COVERED | 02-03, 02-04, 02-09 |
| Three-field paired state, exact heading, normal-flow caption, temp theme | COVERED | 02-04, 02-08, 02-09 |
| Inactive connector ≥3:1; active width/pattern; forced system colors | COVERED | 02-04, 02-09 |
| Canonical per-item coverage/slots/rank/explicit occlusion; every manifest row or neutral | COVERED | 02-01, 02-08, 02-09 |
| Full normalized RecommendInput + full finalized Recommendation retained with categories/finalizer data; flat projection rejected | COVERED | 02-01, 02-02, 02-05, 02-06 |
| Pure exact-boundary producer; no downstream recomputation/category reconstruction | COVERED | 02-05, 02-06 |
| Serialized ownership: Phase-1 01-18, Phase-2 02-05 Hjem/Uke preservation, Phase-2 02-09 App/Paak bootstrap, then Phase-3 Hjem/App extension | COVERED | 02-05, 02-09, interface/validation contracts |
| Exact upstream Phase-1 `candidate_sha`, internal normalization, snake_case checksums, commit/ancestry, clean path-safe evidence | COVERED | 02-05, 02-09 |
| Real App current/planned E2E invokes producer and propagates bundle/row/guide props without direct injection | COVERED | 02-09 |
| Candidate-local inventory script/test is created before use and remains tracked in every consumed candidate | COVERED | 02-01, 02-02, 02-03, 02-06, 02-09 |
| High-risk two-key reviews and standard-lane minimum capability | COVERED | All plan frontmatter; 02-VALIDATION.md |

## Ownership and dependency audit

| Stage | Plans | Base/ownership |
|---|---|---|
| Foundation | 02-01; parallel 02-02/03; merged 02-04 | Isolated from `807bf66e11cdf255db99e1f19269545bedd6209c`; reviewed commits remain ancestors. |
| Cross-phase base and producer preservation | 02-05 | Exact tuple from 01-18; non-squashed ancestry; four-file task preserves existing Hjem/Uke full input/Recommendation objects in factory-owned seeds without rerun. |
| Pure integration artifacts | 02-06–02-08 | Producer, copy/generic detail, reusable Outfit panel; flag remains false and there are no additional shared-screen edits after 02-05. |
| Production integration/handoff | 02-09 | Phase 2 consumes the 02-05 full seeds and wires/enables Paakledning plus minimal App producer/bundle/row/guide bootstrap. Phase 3 later extends App/Hjem without editing Paak or changing seed provenance. The ten-file scope remains one cohesive bootstrap/evidence slice with task caps of 3/5/3. |

## Explicit exclusions

- Phase-3 Hjem/Home source registration, coordinator, motion overlay, and post-02-09 App transition extensions. Phase 3 does not edit Phase-2-owned Paakledning or replace the baseline App producer flow.
- Any Uke change beyond 02-05's source-object preservation; no UI, engine, navigation or Phase-3 Uke work is in scope.
- Phase-4 screenshot/video/device evidence.
- Engine thresholds, weather logic, Motor, Avatar State V2, package, persistence, analytics, or paid infrastructure changes.

## Audit verdict

**COVERED:** GOAL 1/1, REQ 2/2, CONTEXT D-01–D-12 12/12.
**MISSING:** 0.
**Resolved discrepancy:** maximum is 11; 11 is complete list-only output pending any future owner-approved range change.
