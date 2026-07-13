# Start here: Babyora / Vaerni

**Updated:** 2026-07-13  
**Status:** Planning is ready for review. Implementation is not authorized by this document.

This file is the authoritative entry point when the repository is opened from another computer, Claude, Codex, or GitHub.

## Current direction

- Product model: **Free = today at home. Plus = future, everywhere, and shared with family.**
- Quality ambition: 90+ for the core screens and journeys, measured against the verification protocol rather than declared from visual impressions alone.
- The existing design system is evolved, not replaced with a generic redesign.
- Engine 2.0 is planned for ages 0-71 months. Synthetic materials are valid functional options alongside wool, cotton, fleece, shell fabrics, and relevant blends.
- No wardrobe-registration requirement, child-photo analysis, generic AI chat, social feed, or affiliate marketplace is part of the approved core direction.

## Naming and identity

- Current working finalist: **Vaerni**.
- Intended association: weather, protection, care, and Nordic character without Nordic special characters.
- Pronunciation and spelling still require testing. Trademark, domains, app stores, and social handles require a current formal check before public use.
- `Klarune` was considered and then rejected because of similarity risk, pronunciation ambiguity, and rune/fantasy associations.
- Selected logo concept: **Beskyttet kjerne / Protected core**. Existing symbol assets are concept-quality and name-neutral; a final wordmark waits for the naming gate.

## Document precedence

When files disagree, use this order:

1. `AGENTS.md`
2. This file
3. `docs/DECISION-LOG.md`
4. `docs/CURRENT-HANDOFF.md`
5. Approved plans in `docs/superpowers/plans/`
6. Approved specifications in `docs/superpowers/specs/`
7. Other active documents in `docs/`
8. Archived Codex outputs in `docs/archive/codex-2026-07-13/`

Older files may still use Babyora or Klarune. That historical wording does not override the current naming status above.

## Reading order for implementation preparation

1. `docs/CURRENT-HANDOFF.md`
2. `docs/DECISION-LOG.md`
3. `docs/superpowers/plans/2026-07-13-babyora-90-plus-master-plan.md`
4. `docs/superpowers/plans/2026-07-13-babyora-engine-2-plan.md`
5. `docs/superpowers/plans/2026-07-13-babyora-ui-90-plus-plan.md`
6. `docs/superpowers/plans/2026-07-13-babyora-family-sync-plan.md`
7. `docs/superpowers/plans/2026-07-13-babyora-personal-calibration-plan.md`
8. `docs/superpowers/plans/2026-07-13-babyora-notifications-widgets-plan.md`
9. `docs/superpowers/plans/2026-07-13-babyora-verification-protocol.md`

Before implementing, summarize the current direction, identify contradictions, and ask the owner to confirm the first implementation package. Do not interpret repository access as permission to code.

## Safe opening prompt for Claude

```text
Read AGENTS.md and docs/CLAUDE-START-HERE.md completely. Then read every file in the prescribed reading order.

Before changing anything, report:
1. the current product direction;
2. approved decisions and unresolved gates;
3. what must not be changed;
4. the proposed first implementation package;
5. tests and acceptance evidence required for that package;
6. any contradictions between documents.

Do not modify code until I explicitly approve the implementation package.
```

