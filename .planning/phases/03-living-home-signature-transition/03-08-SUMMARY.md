---
phase: 03-living-home-signature-transition
plan: "08"
subsystem: validation
tags: [exact-sha, external-evidence, windows, accessibility, security, e2e]
status: PASS

phase1_candidate_sha: 5cf7df85014fa51096b06a7e381926ebb4601798
phase2_candidate_sha: 7de4bf480c2b203937bb4093001df23a5d85f264
phase3_candidate_sha: 8cc7e60a63c3314814f0024c3d0ff63f5141fd32
candidate_tree_sha: aadbd34c36dc8d8c9e1a40d918b849224ff29e76
validation_evidence_sha256: b881502ec2e0cd18ef9e214fe74ed1042ccc64c006860c7378d8b59565849a8c
code_security_sha: 8cc7e60a63c3314814f0024c3d0ff63f5141fd32
code_security_status: PASS
code_security_verdict: PASS
ui_accessibility_sha: 8cc7e60a63c3314814f0024c3d0ff63f5141fd32
ui_accessibility_status: PASS
ui_accessibility_verdict: PASS
ancestry_status: PASS
clean_status: PASS
final_verifier_status: PASS
cost_nok: 0
hardware_evidence: PHASE_4
media_evidence: PHASE_4

requires:
  - phase: 01-planlegg-dagslinjen
    provides: exact independently passed Phase-1 candidate
  - phase: 02-outfit-truth-antrekkskart
    provides: exact independently passed Phase-2 candidate
  - phase: 03-living-home-signature-transition
    provides: exact candidates from Plans 03-01 through 03-07
provides:
  - complete deterministic HOME-01 and MOTION-01 acceptance matrix
  - path-safe external final-evidence collection and verification
  - two fresh-context independent verdicts on one immutable candidate
  - promotable Phase-3 implementation candidate
affects: [phase-4-cross-surface-convergence]

key-files:
  created:
    - scripts/verify-phase3-final.mjs
    - scripts/__tests__/verify-phase3-final.test.ts
    - .planning/phases/03-living-home-signature-transition/03-08-SUMMARY.md
  modified:
    - e2e/home-outfit-motion.ts
    - e2e/fixtures/home-outfit-motion.ts
    - scripts/verify-phase3-exact-sha.mjs
    - scripts/__tests__/verify-phase3-exact-sha.test.ts
    - scripts/outfit/__tests__/verify-phase2-evidence.test.ts

requirements-completed:
  - HOME-01
  - MOTION-01

completed: 2026-07-25
---

# Phase 3 Plan 03-08: Final Validation Summary

## Immutable final candidate

```text
phase1_candidate_sha: 5cf7df85014fa51096b06a7e381926ebb4601798
phase2_candidate_sha: 7de4bf480c2b203937bb4093001df23a5d85f264
phase3_candidate_sha: 8cc7e60a63c3314814f0024c3d0ff63f5141fd32
candidate_tree_sha: aadbd34c36dc8d8c9e1a40d918b849224ff29e76
validation_evidence_sha256: b881502ec2e0cd18ef9e214fe74ed1042ccc64c006860c7378d8b59565849a8c
code_security_status: PASS
ui_accessibility_status: PASS
ancestry_status: PASS
clean_status: PASS
final_verifier_status: PASS
cost_nok: 0
```

No implementation or test edit followed evidence collection or either final
review. This summary is intentionally written after the external gate and is
not part of the candidate, validation-log hash, or reviewer evidence.

## External evidence bundle

Resolved evidence root:

`C:\tmp\Babyora Phase3 Evidence 8cc7e60 final`

| Artifact | SHA-256 |
|---|---|
| `phase3-candidate.json` | `9c0b54d540d5eb62a282235e60e201de758d614ffd92ec376213441b9867240e` |
| `phase3-final-validation.log` | `b881502ec2e0cd18ef9e214fe74ed1042ccc64c006860c7378d8b59565849a8c` |
| `phase3-code-security-review.json` | `0751fdd8f98a37d2d6347ed2cbc9251898973da26beff704f8d20919f464ef7e` |
| `phase3-ui-accessibility-review.json` | `1ab33f2acb453c291df3542b550873b4e0437884be1e7bf36348e5861d45d7e9` |

The candidate record and both review records cite the validation-log hash
`b881502ec2e0cd18ef9e214fe74ed1042ccc64c006860c7378d8b59565849a8c`.

## Final independent reviews

### Code and security

```text
code_security_sha: 8cc7e60a63c3314814f0024c3d0ff63f5141fd32
code_security_status: PASS
code_security_verdict: PASS
code_security_reviewer_id: code-security-reviewer-final_03_08_security
code_security_session_id: final_03_08_security-2026-07-25-fresh
code_security_fork_turns: none
code_security_fresh_context: true
```

- Unresolved P0: 0
- Unresolved P1: 0
- Threats closed: 7/7
- Threats open: 0
- Cost: NOK 0

The reviewer independently verified exact candidate identity, detached and
clean state, all nine direct ancestry checks, external realpath confinement,
four distinct artifacts, symlink rejection, shell-free argument arrays,
validated npm CLI execution through Node, fail-fast behavior, evidence hashes,
the deterministic matrix, and unchanged dependencies.

Threat status:

```text
T-03-24 final candidate spoofing: CLOSED
T-03-25 validation repudiation: CLOSED
T-03-26 review-evidence tampering: CLOSED
T-03-28 command/path tampering: CLOSED
T-03-29 Windows npm launch denial: CLOSED
T-03-27 timing flakiness: CLOSED
T-03-SC dependency tampering: CLOSED
```

### UI, accessibility, and motion

```text
ui_accessibility_sha: 8cc7e60a63c3314814f0024c3d0ff63f5141fd32
ui_accessibility_status: PASS
ui_accessibility_verdict: PASS
ui_accessibility_reviewer_id: ui-accessibility-reviewer-final_03_08_ui
ui_accessibility_session_id: final_03_08_ui-2026-07-25-fresh
ui_accessibility_fork_turns: none
ui_accessibility_fresh_context: true
```

- Unresolved P0: 0
- Unresolved P1: 0
- Cost: NOK 0

The reviewer independently verified candidate identity, evidence hash, source
contracts, semantic T0, focus, row and control availability, decorative overlay
isolation, reduced-motion and lifecycle settlement, theme and reflow coverage,
and the production-versus-fixture evidence boundary. A direct focused browser
rerun was blocked by the review sandbox before repository-controlled execution;
the reviewer therefore cross-checked the immutable hashed collection log,
source, Git state, and static contracts rather than treating the policy block
as an app failure.

## Accomplishments

- Adds a checked-in final runner with separate `collect` and `verify` modes.
- Reads only absolute `BABYORA_PHASE3_EVIDENCE_ROOT` from the environment and
  rejects missing, relative, inside-checkout, reverse-nested, symlinked, stale,
  or artifact-escaping evidence paths.
- Resolves and validates the npm CLI JavaScript file, then runs every npm-family
  command through `process.execPath` with discrete arguments and `shell: false`.
- Executes Git directly with argument arrays, stops at the first child failure,
  preserves complete stdout/stderr in one external log, and never creates a
  candidate record after a failed matrix command.
- Directly verifies detached and clean HEAD, diff checks, the exact Phase-1
  `candidate_sha`, Phase 2, and every Plan 03-01 through 03-07 ancestry before
  and after collection.
- Completes the deterministic browser matrix for 320/390 widths, real 200
  percent text, forced colors, light/dark crossed with cold/mild/warm,
  condition/daylight/neutral atmosphere, availability, identity, anchors,
  keyboard, reduced motion, lifecycle, and idle cleanup.
- Proves actual overlay cardinality and no truncation for validated 1, 4, 5,
  and 10-item snapshots while retaining the authentic Phase-2 adapter path for
  the compiled production App.
- Logs canonical 220 ms normal feedback, 1250 ms overlay duration, immediate
  semantic T0, and a measured 1263 ms explanation-to-cleanup interval.
- Keeps hardware evaluation, physical haptics, optional media, screenshots,
  video, and the 90+ convergence audit explicitly owned by Phase 4.

## Explicit implementation deviations

Four bounded deviations were necessary and independently reviewed:

1. `e2e/fixtures/home-outfit-motion.ts` gained deterministic scenario inputs
   and lifecycle controls because the original read-only fixture API could not
   exercise new identity, exact cardinality, corrupted anchors, app/OS motion,
   or unmount disposal.
2. The 10-item browser row uses the real snapshot, eligibility, timeline, and
   overlay modules. The authentic Phase-2 adapter has eight visible body slots
   and correctly fails closed rather than fabricating ten simultaneous visible
   garments.
3. `scripts/verify-phase3-exact-sha.mjs` now accepts the canonical
   `candidate_tree_sha` as typed Phase-1 Git-tree metadata while continuing to
   normalize only exact `candidate_sha` and reject commit aliases.
4. Six real temporary-repository runner tests plus one exact-SHA ambiguity test
   and one Phase-2 invalid-frontmatter case received explicit 15-second local
   timeouts after the full suite proved aggregate-only five-second exhaustion.
   No global timeout or retry was added.

## Verification

| Check | Result |
|---|---|
| Final runner and exact-SHA focused tests | PASS - 202/202 |
| Timeout-affected files | PASS - 266/266 |
| Serial full Vitest | PASS - 111/111 files, 1769 passed, 1 existing todo |
| External collection full Vitest | PASS - 111/111 files, 1769 passed, 1 existing todo |
| Compiled production App signature | PASS |
| Complete HOME-01/MOTION-01 browser matrix | PASS |
| Atmosphere matrix | PASS - 51 rows plus invalid neutral |
| Cardinality | PASS - exact 1/4/5/10 clones, targets, and cleanup |
| Timing | PASS - 220 ms normal, 1250 ms contract, 1263 ms measured explanation |
| Repository smoke E2E | PASS - 4/4 |
| TypeScript, lint, main and bare production builds | PASS |
| Exact 9-dependency ancestry, diff, dependencies, detached and clean state | PASS |
| Fresh code/security review | PASS - 0 P0/P1, 7/7 threats closed |
| Fresh UI/accessibility review | PASS - 0 P0/P1 |
| Checked-in final verifier | PASS - `{"status":"PASS","mode":"verify"}` |
| Cost | NOK 0 |

## Final Phase-3 status

HOME-01 and MOTION-01 are complete on immutable candidate
`8cc7e60a63c3314814f0024c3d0ff63f5141fd32`. The final candidate is
deterministically verified and promotable. Phase 3 makes no physical-device,
media, or release claim.

## Phase-4 boundary

Phase 4 owns cross-surface convergence, physical VoiceOver/TalkBack, OS text
scaling, physical haptics, one-handed reach, owner-authorized screenshots and
video, the final media-based 90+ audit, and the release decision. Their absence
does not weaken or block this deterministic Phase-3 PASS.

## Rollback

Return to the independently approved Plan 03-07 closeout `860e15e`, whose
implementation candidate is `8bf9dfb`. Living Home and the semantic
Home-to-Outfit path remain functional; only the final runner/matrix additions
are removed.

---

*Phase: 03-living-home-signature-transition*
*Plan: 03-08*
*Completed: 2026-07-25*
