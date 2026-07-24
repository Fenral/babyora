# Phase 2 Validation Contract

Status: **PLANNED / PENDING IMPLEMENTATION**

## Immutable bases and fail-closed rules

- Foundation base: `807bf66e11cdf255db99e1f19269545bedd6209c`.
- 02-01–02-04 run in isolated worktrees; dependency commits are merged without squashing/rewriting so reviewed SHAs remain ancestors.
- 02-05 accepts only raw YAML frontmatter from `.planning/phases/01-planlegg-dagslinjen/01-18-SUMMARY.md` with exact `status: PASS`, exactly one scalar 40-hex `candidate_sha`, exactly one scalar 64-hex `contract_sha256` and `pack_sha256`, and two distinct fresh-context PASS records on that tuple. Upstream `phase1_candidate_sha`, `final_candidate_sha`, `commit`, Markdown Commit fallback, alternate casing/spelling, aliases/anchors, duplicate keys or multiple values fail before parsing can collapse ambiguity. Only after validation is `candidate_sha` normalized internally to `phase1_candidate_sha`.
- Every consumed candidate must pass `git cat-file -e <sha>^{commit}`. After assembly, Phase 1 and every consumed Phase-2 SHA must pass `git merge-base --is-ancestor <sha> HEAD`.
- Shared-screen order is strict: Phase-1 01-18 must PASS first; serialized Phase-2 02-05 may then edit only the Hjem/Uke context-producing calls to preserve their already-computed full input/Recommendation objects; 02-09 later edits App; Phase 3 may extend Hjem/App only after 02-09 PASS.
- Every Phase-2 summary uses machine-readable `status: PASS`, `plan_id`, 40-hex `candidate_sha`, dependency SHAs, reviewer identity/session/capability/fresh-context/verdict, commands, cost, and rollback.
- `OUTFIT_TRUTH_V1_AVAILABLE` remains false through 02-08 and through 02-09 pre-activation gates. Phase 2 flips it true only after proving the real current/planned App-to-Paak flow; Phase 3 then extends App/Hjem/Home sources/transition while preserving the bootstrap and never editing Paakledning.
- Any missing/malformed evidence, failed command, dirty tree, ancestry mismatch, unresolved P0/P1, media/package drift, or ownership violation reports BLOCKED.

## Wave gates

| Wave | Plans | Exit gate |
|---|---|---|
| 1 | 02-01 | Candidate-local inventory script/test created before invocation; classifier/body/avatar-occlusion/row-contract suites and high-risk two-key PASS. |
| 2 | 02-02, 02-03 | Supported-only alternatives and 1–10 geometry/11 list-only gates; required reviews PASS. |
| 3 | 02-04 | Non-squashed dependency assembly; exact presentation/state/row/connector contracts PASS. |
| 4 | 02-05 | Phase-1 tuple/commit/merge ancestry preflight; full normalized input + full finalized Recommendation context seed; serialized Hjem/Uke no-rerun preservation; high-risk two-key PASS. |
| 5 | 02-06 | Pure producer supported/list-only/unavailable and screen-import gates PASS. |
| 6 | 02-07 | Byte-identical copy and generic fake-action removal PASS; legacy screen/store cleanup deferred. |
| 7 | 02-08 | Reusable panel/avatar/full gates PASS; flag false; no shared-screen edits. |
| 8 | 02-09 | Full component/browser matrix plus real current/planned App routes; production bundle/row/guide propagation; gated flag true; path-safe fail-fast verifier launcher; two qualified PASS reviews; immutable handoff. |

## Focused commands

| Plan | Required command |
|---|---|
| 02-01 | `cmd.exe /d /s /c "npx vitest run scripts/outfit/__tests__/inventory-v1.test.ts src/lib/outfit/__tests__/body-anchor-coverage.test.ts src/lib/outfit/__tests__/outfit-avatar-truth.test.ts src/lib/outfit/__tests__/outfit-truth.test.ts src/lib/outfit/__tests__/outfit-transition-contract.test.ts && npx tsx scripts/outfit/inventory-v1.ts --assert"` |
| 02-02 | `npx vitest run src/lib/outfit/__tests__/alternative-options.test.ts src/state/__tests__/outfit-selection-store.test.ts src/lib/wool-layers/__tests__/finalize-safety.test.ts` |
| 02-03 | `npx vitest run src/lib/outfit/__tests__/outfit-map-layout.test.ts src/lib/outfit/__tests__/outfit-truth.test.ts` |
| 02-04 | `npx vitest run src/components/outfit/__tests__/OutfitExperience.test.tsx src/lib/outfit/__tests__/outfit-map-layout.test.ts src/state/__tests__/outfit-selection-store.test.ts` |
| 02-05 | `npx vitest run src/lib/planning/__tests__/planned-outfit-context.test.ts src/lib/planning/__tests__/planned-outfit-resolver.test.ts && npm run build` plus tuple/commit/ancestry/clean and Hjem/Uke no-second-recommend source assertions |
| 02-06 | `npx vitest run src/lib/outfit/__tests__/outfit-bundle-producer.test.ts src/lib/outfit/__tests__/outfit-truth.test.ts src/lib/outfit/__tests__/alternative-options.test.ts src/lib/planning/__tests__/planned-outfit-context.test.ts` |
| 02-07 | `npx vitest run src/lib/copy/__tests__/warm-cold-recovery.test.ts src/lib/outfit/__tests__/alternative-options.test.ts src/state/__tests__/outfit-selection-store.test.ts` |
| 02-08 | `npx vitest run src/components/outfit/__tests__/OutfitTruthPanel.test.tsx src/components/outfit/__tests__/OutfitExperience.test.tsx src/lib/outfit/__tests__/outfit-truth.test.ts` |
| 02-09 | Pre-activation and enabled commands in 02-09 Tasks 1–2, including `e2e/planlegg.ts --case exact-context`, `--case automatic-location`, and `e2e/outfit-truth.ts --case production-app-routes`; then `cmd.exe /d /s /c "npx vitest run scripts/outfit/__tests__/verify-phase2-evidence.test.ts && npx tsx scripts/outfit/run-phase2-evidence.ts"` after setting quoted absolute `PHASE2_*` environment paths. |

Each plan also runs lint, build, `git diff --check`, allowlisted-scope/package/media scans, and an explicit assertion that exits nonzero when `git status --porcelain --untracked-files=all` is nonempty.
Every dependent gate from 02-02 through 02-09 first runs `npx tsx scripts/outfit/inventory-v1.ts --assert` from its own candidate worktree and proves the script/test blobs are tracked ancestors. No gate may invoke or copy the planning-only inventory.

## Finite-domain oracle

The exact tracked candidate command `npx tsx scripts/outfit/inventory-v1.ts --assert` must reproduce:

- 2,036,160 scenarios and 70 unique finalized outputs;
- catalog coverage 70/70 and semantic garment body mapping 57/57;
- 13 semantic equipment labels, maximum equipment 6;
- maximum semantic garments 11, 12,960 cases above 10, zero below 1.

Semantic equipment is the union of engine layer `utstyr` and canonical catalog category `utstyr`, including mandatory varmepose, saueskinn, and sovepose regressions. Counts are computed only after that separation. Counts 1–10 build supported snapshots; the recorded 11-garment case preserves all ordered garments/equipment as `unsupported-cardinality` and must create no map/avatar/alternative/motion truth.

`scripts/outfit/inventory-v1.ts` and its test must be created inside the 02-01 worktree before first invocation, tracked by the candidate, and executed from each detached reviewed candidate. `.planning/.../02-INVENTORY.mts` is discovery evidence only and is forbidden as an implementation/release oracle.

## DOM/computed-style matrix

`e2e/outfit-truth.ts` uses a direct component fixture for the exhaustive presentation matrix and separate production cases that enter the real App through Hjem and Planlegg. Production cases may not mount Paakledning or inject bundle/registrar/guide props directly; App must produce and propagate them.

| Dimension | Required values |
|---|---|
| Garments | 1, 4, 5, 10 supported; exact 11 list-only |
| Width | 320, 390, 560 CSS px |
| Text | 100%, 200% |
| Theme/temperature | light, dark × kald, mild, varm |
| Contrast | normal, forced colors |
| Motion | normal, reduced |
| Input | hover/leave, focus/blur, click, Enter, Space, Escape |
| Avatar | all 24 manifest rows; hidden inner layer; duplicate/tie/null/unknown/ambiguous coverage; missing/extra/pose mismatch |
| Producer branch | supported, unsupported-cardinality, unavailable |
| Production route | current via real Hjem CTA; planned via real Planlegg CTA |

Every applicable cell proves:

- exact heading `Ta på innerst først`;
- spacious 1–4, compact rails 5–10, complete 11-row list-only fallback;
- exact node/row/connector cardinality/order; equipment never receives a body connector;
- no truncation, `+N`, overlap, clipping, or horizontal overflow;
- `selectedId`, `focusId`, `hoverId` semantics, persistent paired `aria-pressed`, no paired focus steal, stable geometry/order;
- active caption in normal flow and complete accessible names/44px targets;
- inactive connector contrast at least 3:1 against actual background in all six theme/temperature pairs;
- active connector width plus dash/pattern non-color distinction; forced-colors system mapping;
- canonical body/visible-slot, layer-rank and explicit-occlusion derivation; exact manifest avatar or neutral;
- finalized whole-outfit comparison/select/reset only for supported truth.

The harness must not invoke screenshot, video, image snapshot, or visual trace capture.

## Scope, security, and ownership gates

- Only serialized 02-05 may edit Hjem/Uke, and only after Phase-1 01-18 PASS to pass existing `engineInput`/full finalized Recommendation objects into the context factory; recommendation, UI, weather, swap, access and navigation behavior remain unchanged. Only 02-09 may edit the minimal App bootstrap, Paakledning and flag. No Phase-2 edit to existing `e2e/planlegg.ts`, packages, thresholds, global tokens or media.
- Phase 2 owns the factory-created recursively immutable full seed, `RegisterOutfitRow`, Paakledning, and App's baseline producer flow. The seed retains the entire normalized RecommendInput and finalized Recommendation, including categorized layers/notes/structuredNotes/summary/safetyFlags/severity; flat projections, caller-injected seeds, accessors, cycles and mutation fail closed.
- After 02-09, Phase 3 owns separate `RegisterHomeAnchor`, Home sources, navigation/transition and serialized Hjem/App extensions, while preserving Phase-2 seed/producer props. Map nodes never register.
- Public Paakledning props are exactly optional `outfitBundle`, optional `registerOutfitRow`, optional `"settled" | "landing"` visual state and existing guide callback; landing preserves semantic content/interaction/registration at T0.
- Strict own-data/prototype/accessor checks; recursive clone/freeze; exact identity triple; unique occurrence IDs; no DOM/layout/store/runtime serialization.
- Static catalog candidates are never selectable without occurrence-specific finalization into a supported complete outcome.
- Generic detail has no new raw-swap writer; unchanged legacy screen/store imports are explicitly deferred to the serialized integration owner.
- No browser storage, URL, analytics, log, or network persistence of outfit advice/selection/DOM.

## Risk-lane review

- Standard plan 02-03 requires one fresh-context PASS from at least standard review capability.
- High plans 02-01, 02-02, and 02-04–02-09 require a high-implementation executor and two distinct fresh-context PASS reviews with at least high-verification capability. The implementer cannot self-PASS.
- Both records must name the same exact candidate SHA, distinct reviewer/session IDs, `fresh_context: true`, no unresolved P0/P1, and capability. Any edit invalidates both.

## Final fail-fast evidence gate

Set `PHASE2_CANDIDATE_SHA` plus `PHASE2_CANDIDATE_RECORD`, `PHASE2_REVIEW_A`, and `PHASE2_REVIEW_B` to quoted absolute paths (paths with spaces are mandatory test cases), then run checked-in `scripts/outfit/run-phase2-evidence.ts` inside a clean detached candidate. The launcher validates env/path shape and invokes the verifier with a direct argument array, never a shell-composed command. It must exit nonzero unless:

1. candidate is 40 hex, exists, and equals HEAD;
2. `git status --porcelain --untracked-files=all` is byte-empty;
3. candidate record says PASS and names the same SHA;
4. accepted upstream Phase-1 source field was exactly `candidate_sha`, normalized internally to `phase1_candidate_sha`, and its `contract_sha256`/`pack_sha256` tuple is exact with no alias or alternate spelling;
5. every 02-01..02-08 dependency SHA exists and is an ancestor of HEAD;
6. two review files have distinct reviewer/session IDs, fresh contexts, sufficient capability, PASS, no P0/P1, and the same SHA;
7. `OUTFIT_TRUTH_V1_AVAILABLE` is true on the final candidate and changed only after false-flag pre-gates; the 02-05 ancestry contains verified Hjem/Uke full-object/no-rerun preservation, and both real App routes prove producer calls plus bundle/row/guide propagation without direct injection; ownership/no-media/package invariants pass.

`02-09-SUMMARY.md` must expose line-addressable `status: PASS`, `phase2_candidate_sha: <40hex>` and `feature_flag: true`, plus `phase1_source_field: candidate_sha`, normalized Phase-1 tuple, dependency ancestry, full seed retained-field signature, 02-05 Hjem/Uke preservation audit, App producer and screen/row/visual/guide signatures, tracked inventory constants, component/real-route/path-space matrices, cost, reviews and rollback SHA. Missing or mixed fields mean not ready.
