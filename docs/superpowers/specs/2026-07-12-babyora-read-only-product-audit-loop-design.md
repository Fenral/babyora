# Babyora Read-Only Product Audit Loop

**Date:** 2026-07-12  
**Status:** Approved concept; design specification awaiting final review  
**Product principle:** Free = today at home. Plus = future, everywhere, and shared with family.

## 1. Purpose

Build a repeatable, read-only audit loop that evaluates the complete Babyora product experience from screenshots and product context. The loop must:

- score every discoverable product page from 1–100;
- calculate a weighted total product score;
- assess UI, UX, color system, trust, product value, and purchase willingness;
- explain what already works and what should improve;
- compare a new audit with the previous audit when available;
- generate one prioritized implementation prompt for a later, separately approved change task;
- never edit application code, configuration, content, data, or purchases.

The audit is not a generic visual critique. It evaluates whether Babyora helps a Norwegian parent answer the immediate question quickly and whether the product creates a credible reason to buy Plus.

## 2. Scope

### Included

- Automated or semi-automated capture of all supported product pages and important states.
- Evaluation of rendered UI at a defined mobile viewport.
- Static repository context needed to understand the purpose and truthfulness of each page.
- Page-level scores, dimension scores, strengths, issues, and recommended improvements.
- Weighted and unweighted app totals.
- Score history and changes between audit rounds.
- Optional Mobbin research when a concrete interaction pattern requires an external benchmark.
- Generation of a structured, implementation-ready prompt.

### Excluded

- Automatic code or design changes.
- Automatic commits, deployments, purchases, notifications, account creation, or production writes.
- Fabricated user research or claims that screenshots prove purchase conversion.
- Using aesthetic similarity to Mobbin examples as a success criterion.
- Scoring future pages that do not exist in the current build as if they were implemented.

## 3. Review approach

Use a **product-journey audit** rather than a screenshot-only audit.

Each page is reviewed using four evidence layers:

1. **Rendered evidence:** screenshot and visible page state.
2. **Journey context:** how the user reached the page and what they are trying to accomplish.
3. **Product truth:** repository evidence for access rules, calculations, data, and promised behavior.
4. **Commercial role:** how the page proves free value, establishes trust, improves retention, or motivates Plus.

The reviewer must distinguish:

- visible fact;
- repository-confirmed fact;
- reasonable inference;
- unresolved uncertainty.

No score may rely on an unsupported claim about actual user behavior or conversion.

## 4. Page inventory

The first implementation should discover routes from the repository and reconcile them with this baseline inventory:

| Page family | Important states |
|---|---|
| Onboarding | first step, child details, home location, first recommendation or pre-value upsell |
| Home | standard/free, loading/error if reproducible, Plus/trial state if locally available |
| Outfit | recommendation summary, clothing order, clothing detail modal |
| Week / Plan | today, locked future state, Plus future state if locally available |
| Guide | main hub and navigation into tools/content |
| Find outfit | default conditions and at least one changed temperature state |
| Clothing library | overview and one clothing detail state |
| My wardrobe | empty/default and populated state if deterministic fixtures exist |
| TOG | calculator/default and result state |
| Warm or cold | guidance/default and feedback state |
| First winter | overview and one lesson/article state |
| Settings | main settings, child/profile, location and subscription entry points |
| Paywall | default offer, selected billing period, trial/expired state when locally reproducible |

If the route inventory differs, the report must list:

- pages found and scored;
- pages expected but unavailable;
- duplicate states grouped under one page family;
- capture failures and their effect on confidence.

## 5. Capture contract

### Default viewport

- Mobile: 390 × 844 CSS pixels.
- Dark theme where Babyora's primary product is designed for dark presentation.
- Norwegian locale.
- Deterministic date, weather, child profile, entitlement, and location fixtures where the existing app supports them.

### Capture requirements

- Capture the full visible viewport after fonts, images, weather, and recommendation content settle.
- Avoid animation blur by respecting reduced-motion mode or pausing capture at a stable state.
- Record the route, state setup, viewport, timestamp, and capture status.
- Do not silently reuse an old image when a current capture fails.
- Preserve temperature-reactive backgrounds in Home, Plan, and Find outfit states.
- Capture enough states to assess the behavior, without treating every modal as a separate top-level page score.

### Read-only safety

The capture runner must block or avoid:

- checkout confirmation;
- subscription restoration against production;
- destructive profile actions;
- real invitations or notifications;
- production analytics and data writes where they can be disabled;
- any scripted application source edits.

## 6. Per-page scoring rubric

Every page receives a score from 1–100 using the same dimensions. Interpretation is page-specific so commercial pages are not judged like educational pages.

| Dimension | Weight | Evaluation question |
|---|---:|---|
| Task clarity and hierarchy | 20 | Does the parent immediately understand what this page answers and what matters most? |
| Navigation and interaction | 15 | Is the main task fast, predictable, one-handed, and free from unnecessary steps? |
| Visual craft and consistency | 15 | Does the page feel intentional, polished, coherent, and recognizably Babyora rather than generic app UI? |
| Color and temperature expression | 10 | Are palette roles clear, contrast sufficient, and temperature-driven visuals informative without reducing readability? |
| Copy, trust, and credibility | 15 | Is the language clear, calm, truthful, appropriately cautious, and internally consistent with the recommendation? |
| Product value and purchase contribution | 20 | Does the page prove useful free value, strengthen retention, or create a credible and contextual reason to buy Plus? |
| Accessibility and robustness | 5 | Are touch targets, contrast, dynamic text, focus, reduced motion, loading, and error states handled appropriately? |
| **Total** | **100** | |

### Score anchors

- **90–100:** launch-leading; clear, distinctive, highly trustworthy, with only minor polish remaining.
- **80–89:** strong and launch-ready; a few meaningful improvements remain.
- **70–79:** useful and visually credible, but friction or unclear value noticeably weakens the experience.
- **60–69:** mixed; core intent is visible, but several issues undermine trust, comprehension, or conversion.
- **40–59:** weak; the page requires structural improvement before it can reliably serve its role.
- **1–39:** broken, misleading, inaccessible, or unable to support its core task.

Scores must be justified by evidence. Cosmetic preferences alone cannot reduce a score materially.

## 7. Purchase-willingness interpretation

“Purchase contribution” is evaluated by role:

- **Onboarding:** reaches real value before asking for money and establishes expectations.
- **Home:** proves that “today at home” is genuinely useful, building trust rather than withholding correctness.
- **Outfit:** demonstrates precision, clarity, and confidence in Babyora's core recommendation.
- **Week / Plan:** makes “future” concrete and desirable without confusing locked and free value.
- **Guide and tools:** increase trust, retention, and perceived breadth without distracting from the core job.
- **Settings:** makes entitlement, privacy, family, location, and billing understandable.
- **Paywall:** communicates future, everywhere, and family sharing with truthful benefits, clear prices, and a strong decision hierarchy.

The audit may assess likely purchase motivation, but must label it as an expert inference. It must not claim a conversion rate without measured product data.

## 8. Weighted total product score

The overall product score is the weighted average below. Weights represent the importance of each page family to activation, core value, retention, and Plus conversion.

| Page | Weight |
|---|---:|
| Onboarding | 10% |
| Home | 15% |
| Outfit | 12% |
| Week / Plan | 10% |
| Guide | 7% |
| Find outfit | 6% |
| Clothing library | 3% |
| My wardrobe | 3% |
| TOG | 5% |
| Warm or cold | 5% |
| First winter | 5% |
| Settings | 5% |
| Paywall | 14% |
| **Total** | **100%** |

The report must also show:

- unweighted mean page score;
- lowest and highest page score;
- number of high, medium, and critical issues;
- score change since the prior completed audit.

If a page is unavailable, the total must be marked incomplete. The loop may calculate a provisional normalized score, but it must not present it as the final total.

## 9. Page-level output

For every page family, output:

1. Page name and captured states.
2. Total score and seven dimension scores.
3. Change since the previous audit, if available.
4. Three strongest qualities, each tied to visible or repository evidence.
5. Up to three priority issues.
6. Severity: critical, high, medium, or low.
7. Why each issue matters for understanding, trust, retention, or purchase willingness.
8. A concrete improvement direction without editing code.
9. Confidence: high, medium, or low, with reason.

Feedback must avoid generic phrases such as “improve spacing” unless it identifies the element, relationship, and desired outcome.

## 10. Overall report

The report begins with the outcome:

- weighted total score;
- unweighted average;
- product-level diagnosis in three to five sentences;
- strongest page;
- weakest page;
- primary blocker to higher purchase willingness.

Then include:

- complete score table;
- page reports;
- cross-screen findings for typography, palette, illustration, motion, navigation, and copy;
- commercial coherence against “today at home” versus “future, everywhere, and family”;
- prioritized improvement backlog;
- generated implementation prompt.

## 11. Mobbin policy

Mobbin is optional evidence, not a mandatory reviewer and not an aesthetic target.

Use it when:

- onboarding sequence or permission timing is ambiguous;
- paywall structure, plan hierarchy, or value presentation needs comparison;
- family sharing, location, or planning patterns need established interaction references;
- the report recommends a structural pattern rather than local polish.

Do not use it:

- for every page in every run;
- to copy a visual style unrelated to Babyora;
- to replace product reasoning or repository truth;
- when a benchmark would add time without changing the recommendation.

Any benchmark reference must state what pattern is relevant and why it fits Babyora's context.

## 12. Audit loop stages

1. **Discover** routes, page fixtures, existing screenshots, and audit configuration.
2. **Prepare** deterministic local state without production writes.
3. **Capture** each required page and important state.
4. **Validate captures** for missing content, loading overlays, wrong routes, or stale images.
5. **Assemble evidence** with page role, product principle, access logic, and known technical truth.
6. **Analyze pages** using the fixed 100-point rubric and strict structured output.
7. **Validate scoring** so dimension sums, page coverage, evidence, and weights are correct.
8. **Synthesize** the weighted total, cross-screen findings, and commercial diagnosis.
9. **Generate prompt** containing the highest-impact improvement package.
10. **Persist audit artifacts** and compare against the previous completed run.
11. **Stop** without editing the application.

The loop can be rerun after the user separately implements changes. It then reports score deltas and unresolved issues.

## 13. Generated prompt contract

The generated prompt must:

- begin with the intended product outcome;
- contain no more than five prioritized initiatives;
- identify affected pages and evidence for each initiative;
- state what already works and must be preserved;
- connect work to the free/Plus product principle;
- include measurable acceptance criteria;
- explicitly prohibit unrelated redesigns and invented features;
- distinguish required work from optional exploration;
- request verification screenshots and relevant tests;
- never run or apply itself.

The prompt must not ask an implementation agent to “make it more premium” without concrete criteria.

## 14. Data format and validation

The analyzer should produce structured JSON first and Markdown from validated data.

Minimum validation rules:

- every discovered required page has a result or explicit capture failure;
- every dimension is an integer from 1–100;
- weighted page score equals the defined rubric calculation;
- app weights total 100%;
- every high or critical issue contains evidence and impact;
- every recommendation names an affected element or flow;
- no final total is labeled complete when a weighted page is missing;
- previous-run comparisons use the same rubric version.

The rubric and report schema require explicit version numbers so future scoring changes do not create false score trends.

## 15. Error handling

- **Dependency unavailable:** stop capture, report the missing dependency, and do not reuse stale results.
- **Local app fails to start:** preserve logs and end with an incomplete audit.
- **Page capture fails:** continue other pages, mark the page unavailable, and withhold the final total.
- **Analyzer returns invalid data:** retry once with validation errors; otherwise preserve raw output and fail the audit.
- **Mobbin unavailable:** continue without it and disclose that no external benchmark was used.
- **Runtime state cannot be reproduced:** use static evidence only, lower confidence, and label the finding accordingly.

## 16. Babyora-specific design principles

The audit should reward:

- an immediate answer to what the child should wear;
- clear clothing count and dressing order using language parents understand;
- consistent clothing between avatar, list, details, and explanation;
- calm one-handed use, including low-light morning contexts;
- semantic color roles, with temperature backgrounds supporting rather than carrying meaning;
- warm editorial character without generic “soft SaaS” styling;
- cautious, credible language for sleep, temperature, and child comfort;
- free value that feels complete for today at home;
- Plus value based on time, place, automation, and coordination.

The audit should penalize:

- contradictory recommendations or visuals;
- Plus claims unsupported by actual behavior;
- premature upsell before the first useful recommendation;
- color used decoratively without hierarchy;
- generic AI-generated critique or redesign advice;
- feature breadth that obscures the core daily task;
- visual polish that masks missing, inaccurate, or unavailable functionality.

## 17. Acceptance criteria

The design is successfully implemented when a single read-only command can:

1. start or connect to the local Babyora build;
2. capture every available page family and required state;
3. produce validated page scores and dimension scores from 1–100;
4. calculate the defined weighted total and unweighted average;
5. list strengths and actionable issues for every page;
6. provide a purchase-willingness diagnosis grounded in page role and product truth;
7. optionally add relevant Mobbin evidence without requiring it;
8. generate one bounded improvement prompt;
9. save a timestamped report and machine-readable result;
10. make zero application changes and perform no production writes.

## 18. Implementation boundary

The implementation may add or update files under the audit tooling, scripts, screenshots, and documentation areas. It must not modify Babyora product source files as part of an audit run. Any later product implementation requires a separate user-approved task.
