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

- Analysis and planning do not authorize implementation.
- Do not change app code until the owner explicitly starts an implementation phase.
- During implementation, use one scoped task and one intentional commit at a time.
- Do not push secrets, local `.env` files, credentials, private keys, generated dependency folders, or build output.
- Never claim completion without running and reporting the checks required by the relevant plan.
- Safety-related clothing guidance requires documented scenario evidence and external professional review where the plan requires it.

## Git and synchronization

- Commit and push after each meaningful approved milestone so the project is available on other devices.
- Avoid noisy commits for minor conversational changes; update the decision log and current handoff at a natural checkpoint.
- Before pushing, inspect `git status`, review the staged diff, and check for sensitive files.
- Keep `docs/CURRENT-HANDOFF.md` current whenever the next action changes.
- Do not force-push, rewrite shared history, or delete remote branches without explicit approval.

