# Conversation context

**Updated:** 2026-07-13  
**Purpose:** Preserve the reasoning and product-development history needed to continue planning without access to the original desktop conversation.

This is a structured continuity summary, not a verbatim transcript. Current decisions are governed by `AGENTS.md`, `docs/CLAUDE-START-HERE.md`, and `docs/DECISION-LOG.md` in that order.

## 1. Starting problem

The original product question was how Babyora could remain genuinely useful for free while creating a natural reason to pay. The central conclusion was that the app did not primarily need more features; it needed a clearer premium story.

The resulting product principle is:

- **Free:** today at one fixed home location.
- **Plus:** future, everywhere, and shared with family.

The free recommendation must be complete and trustworthy. Plus sells planning, automation, coordination, and personalization rather than correcting an intentionally weakened free recommendation.

## 2. Core product direction

Babyora begins with one daily question: what should the child wear now? The intended long-term position is a proactive family assistant for weather, clothing, preparation, and shared care.

High-value Plus directions:

- future days and meaningful changes through the day;
- automatic and multiple locations;
- family and caregiver sharing;
- what the child will probably need soon based on age, season, climate, and optional current size;
- personal warm/comfortable/cold calibration;
- smart change notifications;
- widgets and packing preparation.

The product should ask parents for as little maintenance as possible.

## 3. Ideas intentionally rejected or deprioritized

- Photographing or registering the family's entire wardrobe: too much setup and maintenance for limited value.
- Photographing the dressed child to declare the clothing correct: unreliable inputs and risk of false confidence.
- A generic AI chatbot: weak differentiation and unnecessary complexity.
- A social feed or marketplace: outside the core problem.
- Affiliate shopping before trust has been established: risks compromising recommendation credibility.
- Long guide libraries as the main subscription reason: useful for trust and retention, but weaker than automation and planning.

## 4. Recommendation language and engine

User-facing language should use **plagg** rather than requiring users to understand technical layer terminology. The ordered list communicates dressing sequence intuitively. The engine can retain internal concepts such as inner layer, mid layer, outer layer, accessory, body region, insulation, moisture behavior, wind protection, and precipitation protection.

Engine 2.0 planning expands outdoor guidance through 71 months. Synthetic garments are not considered inherently wrong. Wool, cotton, fleece, shell materials, down, synthetics, and blends are evaluated by function, weather, activity, age, and situation. An optional preference may favor wool or avoid it, but safety and valid alternatives remain available to free users.

Engine 2.0 is planned alongside the current engine, with contracts, scenario tests, adapter comparison, shadow mode, professional review of safety-sensitive cases, and cohort-by-cohort activation.

## 5. UX and information architecture

Target navigation:

- **Home:** what applies now;
- **Plan:** later today, the week, soon, locations, and packing;
- **Guide:** find an outfit, warm or cold check, TOG/sleep, materials, and learning;
- **Family:** children, caregivers, places, notifications, account, and subscription.

The home screen should answer the daily question with minimal interaction. The avatar and recommendation list must never contradict each other. Temperature-reactive backgrounds are a signature feature on weather-relevant surfaces, not the sole carrier of information.

## 6. Design direction

The existing design system is retained and refined.

- Night/plum foundations provide warmth and calm.
- Mint communicates action, selected state, confirmation, and Plus.
- Peach communicates warmth, temperature, and editorial emphasis.
- Blue is reserved mainly for cold/weather meaning.
- Purple/lavender is restrained so it does not compete with mint and peach.
- Motion should clarify state changes and hierarchy rather than continuously decorate.
- Haptics should confirm meaningful decisions, thresholds, or completion and respect reduced-motion/system preferences.

The goal is 90+ quality across core screens, validated with the dedicated verification protocol rather than awarded from subjective impressions alone.

## 7. Pricing and premium story

One paid product is preferred: Babyora Plus, with payment periods rather than separate feature tiers. Earlier working prices included NOK 49 monthly and NOK 299-349 annually. A permanent lifetime option at NOK 499 was considered too low relative to expected use across multiple years and siblings.

The paywall should sell real situations:

- tomorrow becomes colder;
- the child is staying with a caregiver elsewhere;
- weather changes before pickup;
- several caregivers need the same recommendation;
- the family needs to prepare for the next season.

A simple morning reminder belongs in free because it creates the daily habit. Intelligent change notifications belong in Plus.

## 8. Family sharing

One paying owner can invite a reasonable number of caregivers. Caregivers can view recommendations, choose the current situation and their local weather, and contribute warm/comfortable/cold feedback. They should not be able to delete the child, alter core profile facts, or manage the subscription.

Dynamic location refers to the location of the caregiver's phone when using the recommendation. It is not continuous child tracking.

## 9. Brand and naming history

The product was initially called Babyora. The naming brief changed to an internationally usable name with Nordic character that does not restrict the product to babies, wool, or Norway.

`Klarune` was explored and initially documented as a leader. It was later removed because of potential Klarna similarity, ambiguous pronunciation, and a rune/fantasy association that could dominate the intended meaning.

The current working finalist is **Vaerni**. It is intended to suggest weather, protection, care, and Nordic character without using `æ`, `ø`, or `å`. It is not legally or commercially cleared. Remaining gates include pronunciation, write-back spelling, trademarks, domains, app stores, and social handles. An existing Swedish performing-arts project with the same name must be considered during validation.

## 10. Logo direction

Concept A, **Beskyttet kjerne / Protected core**, was selected. A warm center represents the child or today's focus, surrounded by protective arcs representing care, clothing, and adaptation to the environment. The symbol remains independent of the final name.

Current SVG and PNG files are preserved in the archived brand assets. A final wordmark and production identity wait until the naming gate is complete.

## 11. Marketing direction

The initial Instagram account is blank. The rollout should be close enough to launch to support downloads, but the working budget is preferably zero and at most approximately NOK 1,000.

The current direction is image-first rather than video-dependent, using repeatable formats such as weather situations, clothing decisions, myths, seasonal preparation, and product previews. Organic consistency is prioritized before paid acquisition. The complete launch plan is stored in the Codex archive.

## 12. Repository and continuity

The private repository `Fenral/babyora` is the durable source of truth. It contains the app, active plans, archived analysis outputs, brand assets, and the interactive report.

The repository was initialized without changing app behavior. Baseline verification at initialization:

- 222 application tests passed;
- 19 product-audit tests passed;
- production build passed;
- lint retained an existing baseline of 17 errors and 2 warnings.

Meaningful planning or implementation milestones should update the decision log and handoff, then be committed and pushed.

## 13. Open planning gates

- Validate or replace Vaerni before public identity work.
- Decide when the first implementation phase begins; repository access alone is not permission.
- Review document contradictions and confirm the first package in the master plan.
- Obtain external professional review for the safety-sensitive recommendation scenarios.
- Complete production logo/wordmark only after the naming gate.
- Perform physical-device and accessibility verification during implementation.

## 14. Prompt for continuing planning

```text
We are continuing the Babyora/Vaerni product-planning process from another device.

Read these files completely and in order:
1. AGENTS.md
2. docs/CLAUDE-START-HERE.md
3. docs/DECISION-LOG.md
4. docs/CONVERSATION-CONTEXT.md
5. docs/CURRENT-HANDOFF.md

Then summarize:
- the current product and commercial direction;
- approved decisions;
- rejected directions and why;
- unresolved gates;
- contradictions in older documents;
- the next planning decision that creates the most value.

Stay in analysis/planning mode. Do not modify app code unless I explicitly start an implementation phase.
```

