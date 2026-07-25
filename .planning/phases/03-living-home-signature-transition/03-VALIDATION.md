# Phase 3 Validation Contract

## Gate order

1. Run new-file foundations `03-01` and `03-02` in parallel isolated worktrees.
2. Run new-file foundations `03-03` after `03-02` and `03-04` after `03-01`; they may run in parallel with each other and do not touch shared Home/App/Outfit files.
3. Do not run `03-05` until `.planning/phases/02-outfit-truth-antrekkskart/02-09-SUMMARY.md` contains exact `status: PASS`, `feature_flag: true`, and `phase2_candidate_sha: <40hex>`. The same gate must compile against the accepted exported `OutfitTruthSnapshotV1`, `AvatarVisibleSlot`, `AvatarVisualCoverage`, `avatarCoverage`, `OutfitBundleProducerResult`, `RegisterOutfitRow`, and scalar `transitionVisualState: "settled" | "landing"` surfaces before Phase 3 may wire `HjemScreen` or `App`; no local structural mirror is accepted.
4. Run `03-06` only after `.planning/phases/01-planlegg-dagslinjen/01-18-SUMMARY.md` supplies exactly one 40-hex `candidate_sha`, normalized internally to `phase1CandidateSha`, and that Phase-1 candidate plus 03-04 and 03-05 are integrated. Alternate aliases are rejected. Plan 03-06 is the sole Home/App wiring owner.
5. Run `03-07` then `03-08` serially.

Every candidate and review uses a clean isolated or detached worktree. A dependency is consumed by labeled full SHA, never branch head or an arbitrary hexadecimal match.

## Commands and exact paths

| Capability | Command |
|---|---|
| Atmosphere resolver/background | `npm test -- src/lib/__tests__/home-atmosphere.test.ts src/components/__tests__/LivingHomeBackground.test.tsx` |
| Living Home composition | `npm test -- src/components/__tests__/LivingHomeAtmosphere.test.tsx` |
| Timeline/replay | `npm test -- src/lib/outfit-transition/timeline.test.ts src/lib/outfit-transition/replay-policy.test.ts` |
| Snapshot/eligibility | `npm test -- src/lib/outfit-transition/transition-snapshot.test.ts src/lib/outfit-transition/eligibility.test.ts` |
| Phase-2 adapter | `npm test -- src/lib/outfit-transition/phase2-adapter.test.ts src/lib/outfit/__tests__/outfit-transition-contract.test.ts` |
| Coordinator/hook | `npm test -- src/lib/outfit-transition/coordinator.test.ts src/hooks/__tests__/useOutfitTransitionCoordinator.test.tsx` |
| Overlay | `npm test -- src/components/outfit-transition/OutfitTransitionOverlay.test.tsx` |
| Home/coordinator browser cases | `npx tsx e2e/home-outfit-motion.ts --case coordinator` |
| Signature browser cases | `npx tsx e2e/home-outfit-motion.ts --case signature` |
| Complete Phase-3 browser matrix | `npx tsx e2e/home-outfit-motion.ts --case all` |
| Existing repository E2E | `npm run e2e` |
| Full deterministic gate | `cmd.exe /d /s /c "npm test && npm run lint && npm run build && npx tsx e2e/home-outfit-motion.ts --case all && npm run e2e && git diff --check"` |
| Final-runner tests | `npm test -- scripts/__tests__/verify-phase3-final.test.ts` |
| Final detached evidence collection | `powershell.exe -NoLogo -NoProfile -NonInteractive -Command 'node scripts/verify-phase3-final.mjs collect'` |
| Final external-record verification | `powershell.exe -NoLogo -NoProfile -NonInteractive -Command 'node scripts/verify-phase3-final.mjs verify'` |

No plan references a hook test without creating it, and every listed path matches plan ownership.

The final-runner suite must include a non-mocked Windows execution case. It creates real temporary repository and evidence directories whose names contain spaces and Windows-safe shell metacharacters, resolves the installed npm CLI JavaScript file, and successfully runs `process.execPath` with `[npmCliPath, "--version"]`, `cwd` set to the temporary repository, and `shell: false`; it then proves output can be written/read beneath the evidence path. A mocked spawn or executable-name assertion is insufficient.

For final collection, npm-family commands are never launched through Windows npm/npx command shims. The runner prefers `process.env.npm_execpath` only when it is absolute and an existing regular JavaScript file; otherwise it validates `path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js")`, failing closed when neither exists. It invokes `process.execPath` with `[npmCliPath, "test"]`, `["run", "lint"|"build"|"e2e"]`, or `["exec", "--", "tsx"|"tsc", ...]` appended as discrete arguments. Git remains a direct executable with a discrete argument array. Every child uses `shell: false`; no command string is concatenated.

## Required automated matrix

| Dimension | Required deterministic evidence |
|---|---|
| Viewports/reflow | Both 320 and 390 CSS-pixel widths; 200% text; no horizontal document scroll, clipping, overlap, hidden close/CTA, or obscured focus. |
| Color modes | Forced colors plus the complete light/dark × cold/mild/warm cross-product; state and focus never depend on color alone. |
| Atmosphere | Cold/mild/warm × normalized conditions × day/night/polar-twilight/neutral; invalid input is neutral and no client-clock inference occurs. |
| Availability | Force the decorative composition to its neutral/static branch and prove recommendation, CTA, navigation, and semantic content remain available. |
| Identity | Exact success and separate rejection of each identity-triple member; duplicate labels/catalog IDs still pair by branded `OutfitItemId`. |
| Phase-2 visibility truth | Candidate order starts only from `base.avatar.visibleGarmentIds`. Each ID resolves exactly once in `base.garments`, requires `visibleOnAvatar === true` plus non-null valid `avatarCoverage`, and uses coverage slots/rank/occlusion to confirm surviving visibility. Empty/unknown/duplicate/missing IDs or matches, hidden/occluded/tied/partial/contradictory resolution, equipment, unsupported/unavailable state, and every unlisted garment settle statically. Scalar `transitionVisualState` never changes eligibility. |
| Garment count | Unit cases 1–10; browser cases 1, 4, 5, and 10; no truncation or partial match. |
| Semantic ordering | Outfit heading, ordered rows, controls, and focus exist at T0; a logged assertion proves landing-before-explanation. |
| Accessibility | Enter/Space activation; overlay `aria-hidden`, non-focusable, pointer-transparent; rows never inert/hidden; close restores origin or stable Home fallback. |
| Reduced motion | App reduce, OS reduce, and app allow plus OS reduce all produce the identical settled semantic Outfit without travel. |
| Lifecycle | Complete, missing/zero/duplicate rectangles, hidden document, resize, scroll, orientation, close, back, rapid activation, and unmount all cleanly settle. |
| Timing | Activation, semantic mount, explanation start, each landing, abort, and cleanup are text logged; ordinary UI is 180–250 ms and explanation is 900–1400 ms. |
| Idle | After settlement there is no Phase-3 clone, active deadline, or continuous loop. |

Phase-3 evidence is limited to command output and text/DOM/ARIA/rectangle/timing logs.

## External evidence storage

Before creating the detached final candidate worktree, the orchestrator must:

1. require a nonempty absolute `BABYORA_PHASE3_EVIDENCE_ROOT`;
2. resolve/create that directory outside the candidate checkout and outside every repository worktree; a symlink/junction resolving inside a checkout is forbidden;
3. create these four distinct external files beneath the resolved root:
   - `phase3-candidate.json`
   - `phase3-code-security-review.json`
   - `phase3-ui-accessibility-review.json`
   - `phase3-final-validation.log`
4. invoke checked-in `scripts/verify-phase3-final.mjs` through the exact single-quoted PowerShell payload above; it reads `BABYORA_PHASE3_EVIDENCE_ROOT` directly from `process.env`, builds paths with the Node path API, invokes the validated npm CLI JavaScript entrypoint through `process.execPath`, invokes Git directly, and uses only `spawnSync` argument arrays with `shell: false`;
5. keep all four files outside Git candidate state before, during, and after both reviews.

The candidate record, two reviews, and validation bundle are external verification inputs. The candidate/review records are not appended to the validation bundle. `03-08-SUMMARY.md` may later reference their resolved paths and SHA-256 values from the orchestration workspace, but the summary is never included in the candidate commit, candidate record hash, validation-bundle hash, or any input used to establish its own `phase3_candidate_sha`.

## Exact-SHA independent gate

The external candidate JSON and two separate external review JSON files expose these exact keys:

```text
# phase3-candidate.json
phase3_candidate_sha: <40 lowercase hex>
ancestry_status: PASS
clean_status: PASS
validation_evidence_sha256: <64 lowercase hex>

# phase3-code-security-review.json
code_security_sha: <same 40 lowercase hex>
code_security_status: PASS
code_security_verdict: PASS
code_security_reviewer_id: <nonempty>
code_security_session_id: <nonempty>
code_security_fork_turns: none
code_security_fresh_context: true
code_security_evidence_sha256: <64 lowercase hex>

# phase3-ui-accessibility-review.json
ui_accessibility_sha: <same 40 lowercase hex>
ui_accessibility_status: PASS
ui_accessibility_verdict: PASS
ui_accessibility_reviewer_id: <different nonempty>
ui_accessibility_session_id: <different nonempty>
ui_accessibility_fork_turns: none
ui_accessibility_fresh_context: true
ui_accessibility_evidence_sha256: <same 64 lowercase hex>
```

Gate procedure:

1. Set fail-fast shell semantics.
2. Require and resolve absolute `BABYORA_PHASE3_EVIDENCE_ROOT`; reject it or any supplied file if it resolves inside the detached checkout/worktree or outside the declared evidence root.
3. Extract values only from the exact external JSON keys above; require three separate record files.
4. Require the candidate to match `^[0-9a-f]{40}$`.
5. Run the checked-in, unit-tested `scripts/verify-phase3-final.mjs verify` from the detached candidate; it invokes `scripts/verify-phase3-exact-sha.mjs` with a process argument array.
6. Require `git rev-parse HEAD` to equal `phase3_candidate_sha` directly and require detached HEAD.
7. Require `git status --porcelain` to be empty and run `git diff-tree --check`; external evidence writes cannot dirty this worktree.
8. Read Phase 1 only from exact `candidate_sha`, normalize it internally to `phase1CandidateSha`, and run `git merge-base --is-ancestor` directly for it and every declared Phase-2/Phase-3 dependency; recorded `ancestry_status` is not proof.
9. Require both reviewer SHAs to equal the candidate, reviewer/session IDs to be distinct, both `fork_turns` fields to equal `none`, both fresh-context fields to equal `true`, and both verdicts/statuses to be PASS.
10. Compute SHA-256 only over external `phase3-final-validation.log`; require candidate and both reviewer evidence hashes to equal it.
11. Any path/read/hash/Git/process failure exits nonzero immediately; any implementation/test edit creates a new candidate and restarts the bundle and both reviews.

Do not count generic `PASS` words, take the first SHA-like token, accept a combined review file, accept evidence from the checkout, continue after a failed Git command, include the summary in its own evidence, or let an executor review its own candidate.

## Phase 4 boundary

Hardware evaluation and optional media evidence are owned by Phase 4. Their absence is not a Phase-3 failure and does not create a human checkpoint. Phase 3 claims only the deterministic evidence defined above.
