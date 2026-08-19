# Start here: product repository

**Updated:** 2026-08-19
**Status:** The owner authorized this product roadmap on 2026-08-19; execution follows `AGENTS.md`, while unresolved identity and monetization conflicts remain gated.

This file is the authoritative entry point when the repository is opened from another computer, Claude, Codex, or GitHub.

## Current direction

- Product model: **Free = today at home. Plus = future, everywhere, and shared with family.**
- Quality ambition: 90+ for the core screens and journeys, measured against the verification protocol rather than declared from visual impressions alone.
- The existing app is a functional foundation, not a locked visual system. Preserve verified behavior and the approved four-tab information architecture as the starting structure; colors, typography, spacing, component styling, imagery, and page layout remain open for documented exploration and target-user testing.
- UX and motion work follows `docs/BABYORA-UX-MOTION-BIBLE.md` within the
  document precedence and approved implementation plans below.
- Engine 2.0 v1 is limited to ages 0-24 months. Ages 25-71 are deferred to a later product phase. Synthetic materials are valid functional options alongside wool, cotton, fleece, shell fabrics, and relevant blends.
- No wardrobe-registration requirement, child-photo analysis, generic AI chat, social feed, or affiliate marketplace is part of the approved core direction.
- Model routing is mandatory: Sonnet 5 Medium for mechanical documentation, Sonnet 5 High for ordinary product/UI work, and Fable 5 Extra for safety, Motor V2, RLS/auth, entitlement, calibration and server scheduling. Opus 4.8 Extra is the approved fallback; high-risk work is not silently downgraded.

## Naming and identity

- `Vaerni`, `Klarune`, and `Uteklar` are rejected.
- Repository identity sources currently conflict: `AGENTS.md` names Babyora, while the newer 2026-08-14 owner decision and product-roadmap documents name Snudly. Do not implement a rename until the governing files are reconciled.
- Trademark, domains, app stores, and social handles require a current formal check before submission.
- Selected logo concept: **Beskyttet kjerne / Protected core**. Existing symbol assets remain concept-quality until the identity conflict is resolved.

## Document precedence

When files disagree, use this order:

1. `AGENTS.md`
2. This file
3. `docs/DECISION-LOG.md`
4. `docs/CONVERSATION-CONTEXT.md`
5. `docs/CURRENT-HANDOFF.md`
6. Approved plans in `docs/superpowers/plans/`
7. Approved specifications in `docs/superpowers/specs/`
8. Other active documents in `docs/`
9. Archived Codex outputs in `docs/archive/codex-2026-07-13/`

Older files may still use Babyora or Klarune. That historical wording does not override the current naming status above.

## Reading order for implementation preparation

1. `docs/CURRENT-HANDOFF.md`
2. `docs/DECISION-LOG.md`
3. `docs/CONVERSATION-CONTEXT.md`
4. `docs/BABYORA-UX-MOTION-BIBLE.md`
5. `docs/superpowers/plans/2026-07-13-babyora-analysis-and-action-summary.md`
6. `docs/superpowers/plans/2026-07-13-babyora-consolidated-revision-plan.md`
7. `docs/superpowers/plans/2026-07-13-babyora-90-plus-master-plan.md`
8. `docs/superpowers/plans/2026-07-13-babyora-engine-2-plan.md`
9. `docs/superpowers/plans/2026-07-13-babyora-ui-90-plus-plan.md`
10. `docs/superpowers/plans/2026-07-13-babyora-family-sync-plan.md`
11. `docs/superpowers/plans/2026-07-13-babyora-personal-calibration-plan.md`
12. `docs/superpowers/plans/2026-07-13-babyora-notifications-widgets-plan.md`
13. `docs/superpowers/plans/2026-07-13-babyora-verification-protocol.md`

Before implementing, summarize the current direction and identify contradictions.
The 2026-08-19 roadmap authorization permits automatic progress through
`docs/product-roadmap.md`; stop at its human gates and at the risk, cost, safety,
credential, and irreversible-action gates in `AGENTS.md` and the decision log.
Repository access by itself is still not authorization for work outside that scope.

## Safe opening prompt for Claude

```text
Read AGENTS.md and docs/CLAUDE-START-HERE.md completely. Then read every file in the prescribed reading order.

Before changing anything, report:
1. the current product direction;
2. approved decisions and unresolved gates;
3. what must not be changed;
4. the next unchecked authorized roadmap task;
5. tests and acceptance evidence required for that package;
6. any contradictions between documents.

Continue the authorized roadmap automatically. Stop only when owner input,
credentials, a physical action, an external reviewer, or another documented
human gate is required.
```
