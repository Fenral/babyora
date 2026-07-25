# Plan 02-09 execution and evidence amendment

**Status:** LOCKED FOR 02-09 IMPLEMENTATION
**Date:** 2026-07-25
**Base docs head:** `037e3f4ac106b8bf4b84502de46cc465a9a5292d`
**Accepted 02-08 runtime candidate:** `f1688a5799af2806b790ece790d9630438625b14`

## Reason

Read-only implementation preparation found three contradictions between the
frozen Plan 02-09 wording and the accepted source/evidence contracts:

1. The canonical exact context field is `producerSeed`; an
   `outfitProducerSeed` caller field does not exist and is deliberately
   rejected by the context boundary.
2. Plan 02-09 must flip the compile-time flag to `true`, while the accepted
   Plan 02-08 panel test correctly pins it to `false`. That test must be updated
   on the activation commit but was omitted from the declared 02-09 scope.
3. A candidate record containing its own SHA and two post-candidate reviews
   cannot be tracked inside that same immutable candidate. The plan already
   calls the reviews external; the candidate record and pre-activation
   attestation must also remain external until the docs-only closeout.

This amendment resolves those contradictions without changing product scope.

## Canonical App handoff

- Both current and planned open handlers consume
  `context.producerSeed`.
- Current source is explicit:
  `{ kind: "current", sourceContextId: context.producerSeed.sourceContextId }`.
- Planned source is explicit and includes the exact context-owned
  `planningEventId` and `plannedForIso`.
- Source kind is never inferred from entitlement or access capability.
- A Phase-1 legacy context owns no producer seed and therefore retains only
  the existing absent-bundle fixture/compatibility fallback.
- Every real current/planned Phase-2 context calls `produceOutfitBundle`
  exactly once in the open event and retains that exact process-local result
  in route state. Render never recomputes or serializes it.

Both real routes already converge on `PlannedPaakledningScreen`. The enabled
panel branch belongs there after its unconditional dialog/focus/cancel hooks.
It must not be added to the old weather-recomputing current fallback.

## Approved scope correction

The original ten implementation paths remain authorized. This amendment adds
exactly one existing test path:

- `src/components/outfit/__tests__/OutfitTruthPanel.test.tsx`

It may change only as needed to move the compile-time readiness assertion from
the reviewed false pre-activation state to the final true activation state.
The final verifier must accept the resulting eleven-path amended scope and
must still reject every other source, package, media, Hjem, Uke, Planlegg E2E,
Phase-3, threshold, token, storage, network, or entitlement change.

## Two-commit activation proof

Plan 02-09 uses this exact sequence:

1. Implement all App, Paakledning, component-browser, production-route, and
   evidence code while `OUTFIT_TRUTH_V1_AVAILABLE` remains compile-time
   `false`.
2. Run every required false-flag pre-activation gate and commit a clean
   pre-activation candidate `P`.
3. Create one activation commit `C` whose parent is exactly `P`. Its source
   delta is limited to:
   - `src/lib/outfit/feature-flags.ts`
   - `src/components/outfit/__tests__/OutfitTruthPanel.test.tsx`
4. Require the flag to be exactly false at `P` and exactly true at `C`, then
   rerun the full enabled matrix.
5. Any failure after activation restores false, repairs, creates a new clean
   `P`, and repeats activation and both reviews. No review of an older SHA is
   reusable.

The external candidate record must contain:

- `phase2_candidate_sha: C`
- `pre_activation_sha: P`
- `pre_activation_parent_of_candidate: true`
- the required false-flag commands and exit results
- `phase1_source_field: candidate_sha`
- normalized `phase1_candidate_sha`, `contract_sha256`, and `pack_sha256`
- exact 02-01 through 02-08 dependency SHAs
- the amended eleven-path scope attestation

The verifier independently confirms the `P`/`C` parent relation, false/true
flag states, and exact activation delta.

## External evidence lifecycle

- Candidate record, review A, and review B are absolute, existing, external
  files outside the detached candidate worktree.
- The launcher accepts them only through the four required environment
  variables and passes each path as one direct argument without a shell.
- The verifier rejects any evidence path located inside the candidate
  worktree, relative path, duplicate/unknown argument, stale review, or
  mismatched SHA.
- Both reviews must be created after candidate `C`, have distinct reviewer and
  session IDs, `fresh_context: true`, `capability: high-verification`, PASS,
  and zero unresolved P0/P1.
- Only after the detached candidate passes the launcher may
  `02-09-SUMMARY.md` and tracked review evidence be committed as a
  documentation-only descendant `D`. Phase 3 binds to `C`, not `D`.

The raw Phase-1 summary continues to use `candidate_sha`. The external
Phase-2 record normalizes that exact scalar to `phase1_candidate_sha` and
records `phase1_source_field: candidate_sha`; aliases, mixed spellings,
duplicates, YAML anchors, or checksum variants remain invalid.

## No-media and no-direct-injection rule

The component fixture may mount the real `OutfitTruthPanel` with locally
produced process-owned results. Production-route cases must enter through the
real Hjem and Uke controls and may not mount Paakledning or inject props
directly. The three new E2E files and all test output remain free of
screenshot, video, trace, image-snapshot, and visual-trace capture.
