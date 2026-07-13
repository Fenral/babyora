# Conversation context

**Updated:** 2026-07-13  
**Purpose:** Preserve the reasoning and product-development history needed to continue planning without access to the original desktop conversation.

This is a structured continuity summary, not a verbatim transcript. Current decisions are governed by `AGENTS.md`, `docs/CLAUDE-START-HERE.md`, and `docs/DECISION-LOG.md` in that order.

## Current revision — 13 July 2026

- Vaerni is rejected; the public name remains open and Babyora is an internal working name.
- v1 and Motor V2 are reduced from the earlier 0–71-month ambition to **0–24 months**.
- The baby remains the primary identity element, with one identity and two poses: sitting 0–11 and standing 12–24 months.
- Avatar images contain no contextual scene and show only outermost visible clothes/accessories. Hidden layers remain in the ordered list.
- v1 uses up to 24 verified Nano Banana Pro edit-chain composites within NOK 1,000; no rigged/runtime 2.5D.
- The clothing decision—not a large thermometer—is the main visual instrument.
- Implementation order begins with fresh baseline, legacy safety containment and a green platform, then a five-parent North-Star gate before redesign/assets.

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

Engine 2.0 v1 covers 0–24 months. The earlier expansion through 71 months is deferred. Synthetic garments are not considered inherently wrong. Wool, cotton, fleece, shell materials, down, synthetics, and blends are evaluated by function, weather, activity, age, and situation. An optional preference may favor wool or avoid it, but safety and valid alternatives remain available to free users.

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

**Vaerni was explored and rejected.** Its spoken association with clothing did not feel natural enough. No public name is approved. A future candidate must pass pronunciation, association, write-back spelling, trademark, domain, app-store and social-handle gates.

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

- Find and validate a new public name before public identity work.
- Decide when the first implementation phase begins; repository access alone is not permission.
- Confirm the first implementation package: fresh baseline, legacy safety containment and green platform.
- Approve one North-Star direction through the five-parent gate before production avatar assets or redesign code.
- Obtain external professional review for the safety-sensitive recommendation scenarios.
- Complete production logo/wordmark only after the naming gate.
- Perform physical-device and accessibility verification during implementation.

## 14. Prompt for continuing planning

```text
We are continuing the Babyora product-planning process from another device. Babyora is an internal working name; Vaerni is rejected.

Read these files completely and in order:
1. AGENTS.md
2. docs/CLAUDE-START-HERE.md
3. docs/DECISION-LOG.md
4. docs/CONVERSATION-CONTEXT.md
5. docs/CURRENT-HANDOFF.md
6. docs/superpowers/plans/2026-07-13-babyora-analysis-and-action-summary.md
7. docs/superpowers/plans/2026-07-13-babyora-consolidated-revision-plan.md

Then summarize:
- the current product and commercial direction;
- approved decisions;
- rejected directions and why;
- unresolved gates;
- contradictions in older documents;
- the next planning decision that creates the most value.

Stay in analysis/planning mode. Do not modify app code unless I explicitly start an implementation phase.
```

