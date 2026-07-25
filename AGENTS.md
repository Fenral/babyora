# Babyora repository instructions

## Source of truth

- GitHub is the durable source of truth for code, plans, decisions, and handoffs.
- Read `docs/CLAUDE-START-HERE.md` before planning or changing the app.
- When documents conflict, follow the precedence order in that file.
- Do not infer product approval from an older analysis or archived chat output.

## Current product boundary

- Free: today at one fixed home location.
- Plus: future, everywhere, and shared with family.
- The v1 child and recommendation scope is 0-24 months. Older ages are deferred.
- **`Babyora` is the approved public name** (owner decision 2026-07-15, «Behold navn»). The naming gate is closed. `Vaerni`, `Klarune`, and `Uteklar` were rejected along the way.
- A formal availability check (trademark, `.no` domain, App Store name uniqueness, social handles) is still recommended before submission.
- The selected logo direction is `Protected core` / `Beskyttet kjerne`; the wordmark uses the Babyora name.

## Change policy

- **Governing process:** `docs/PROSESS-PLAN-TIL-KODE.md` (owner-approved 2026-07-15) is the authoritative plan→code process. Control scales with risk (lett/standard/høy lanes). It supersedes the old uniform `docs/superpowers/plans/2026-07-13-babyora-verification-protocol.md`, which is now subordinate.
- **Active authorization (2026-07-24):** The owner has authorized autonomous planning, implementation, testing, independent review, documentation, commits, and green GitHub pushes for the current approved GSD worklist. No repeated owner approval is required while scope, truth constraints, and technical gates remain intact.
- Phase 2 and the independent foundation of Phase 3 may run in isolated branches/worktrees while Phase 1 finishes. Home-to-Outfit integration waits for the frozen Phase 2 interface contract.
- During implementation, use one scoped task and one intentional commit at a time.
- Do not push secrets, local `.env` files, credentials, private keys, generated dependency folders, or build output.
- Never claim completion without running and reporting the checks required by the relevant plan.
- Snart contains neutral historical preparation guidance only. Health/safety claims are out of scope; MET supplies data, while Babyora thresholds are explicitly versioned product heuristics.
- Formal privacy review for Snart is deferred, but its session-only/no-persistence/no-analytics invariants remain mandatory and automated.
- No single expense or aggregate new cost commitment above NOK 1,000 may be incurred without explicit owner approval. Free sources and already-included subscription quotas may be used autonomously; do not assume extra paid credits are included.

## Git and synchronization

- Commit and push each meaningful green milestone so the project is available on other devices.
- Avoid noisy commits for minor conversational changes; update the decision log and current handoff at a natural checkpoint.
- Before pushing, inspect `git status`, review the staged diff, and check for sensitive files.
- Keep `docs/CURRENT-HANDOFF.md` current whenever the next action changes.
- Do not force-push, rewrite shared history, or delete remote branches without explicit approval.

