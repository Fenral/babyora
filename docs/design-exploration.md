# Open Visual Exploration Brief — Snudly

**Status:** Neutral brief for TASK-005 and TASK-006. No visual direction is
selected by this document.

## Exploration question

How can Snudly help a tired first-time dad understand and trust one baby outfit
answer within five seconds, without making practical guidance feel medically
authoritative?

The memorable product moment is not a weather display or a visual effect. It is
the parent's realization: **“I know what to put on now, and I can explain why.”**

## Audience and use context

The primary participant is Martin, a 28–38-year-old first-time Norwegian dad
with a baby under 12 months. He is often one-handed, short on time, and deciding
before daycare, a walk, errands, or sleep. He is comfortable using an app but
does not want to interpret weather models, TOG tables, or a long article.

Nora, a co-parent and trust calibrator, is the most important secondary user.
She needs to see consistent reasoning and clear safety boundaries rather than
an unexplained claim of authority. The product starts in Norway and must remain
capable of controlled Swedish and Danish pilots for parents of children aged
0–24 months.

## Intended emotional outcome

The experience should move the parent from mild uncertainty or household
debate to calm, practical confidence. It must not create fear, imply parental
failure, infantilize the adult, or use cuteness as evidence. “Calm,” “warm,”
“direct,” and “competent” describe the desired outcome and voice; they do not
preselect a palette, typeface, illustration style, density, or component shape.

## Representative journey for comparison

Every direction in TASK-005 must use the same realistic scenario, content, and
390×844 CSS-pixel viewport so visual treatment—not easier copy or data—causes
the difference:

1. **Onboarding:** add one child's age and a home location without an account.
2. **Home:** confirm the child, activity, and current weather, then offer one
   obvious action to get the outfit.
3. **Result:** show one safety-finalized outfit in numbered dressing order,
   followed by the main reason, safety boundary, source/status, and any
   stale/offline limitation.

The comparison scenario must include one baby, one Norwegian place, current
weather, and one of the four MVP activities: stroller, carrier, outdoor play,
or indoor sleep. All directions must expose the same four activities even if
only one is selected in the representative screens.

## Non-negotiable constraints

### Functional truth

- The result is primary. Weather, imagery, motion, tools, and brand elements
  may support it but cannot delay or obscure the outfit.
- Keep the approved four-root information architecture—Hjem, Planlegg,
  Verktøy, Familie—as the structural starting point. Its current tab styling
  and the prototype's current three-tab implementation are not visual inputs.
- The outfit is one complete answer, ordered inner-to-outer, with required and
  conditional items distinguishable without relying on color alone.
- The main weather or safety driver is understandable in ordinary language.
  Stale, offline, unavailable-location, and error states remain honest and
  actionable.
- No mandatory account or paywall may block the first recommendation. Identity
  and later-session monetization remain separate source-of-truth gates and
  must not be resolved through a visual concept.
- Preserve the owner-approved Home-to-outfit motion contract: the Home action
  remains connected to the result, garment anchors resolve into the ordered
  list, mandatory connections keep every garment tied to its body area,
  dressing-order numbers become explicit, and explanation follows the clothing
  relationship. The exact visual execution may vary, and a complete immediate
  equivalent is required when reduced motion is active.
- Keep a calm Home weather region that visibly responds to the relevant current
  weather state without delaying the answer. Its palette, imagery, material,
  composition, and degree of decorative movement remain open.

### Safety and trust

- The canonical garment text is authoritative. An illustration, avatar,
  photograph, animation, or weather scene must never contradict the ordered
  garment list.
- Hard safety rules remain visibly distinct from preferences and cannot look
  dismissible when they are not. The interface must not claim clinical or
  medical authority.
- Safety-sensitive guidance needs a clear reason, source/review status, and
  country applicability. Swedish and Danish content remains pilot material
  until qualified review is complete.
- Uncertainty must be explicit. Visual polish cannot turn an unreviewed rule,
  stale forecast, missing input, or boundary condition into false confidence.
- The first-value and recommendation screens must not use fear, guilt, or a
  safety warning as a conversion device.

### Accessibility and physical use

- Meet WCAG 2.2 AA behavior and platform guidance on the core flow.
- Interactive targets are at least 44×44 CSS pixels. Essential information
  cannot depend only on color, imagery, motion, or haptics.
- Core content, actions, and safety copy remain usable at the largest supported
  Dynamic Type or text-scaling setting, with no clipping or hidden action.
- Provide logical screen-reader reading order, useful names, visible keyboard
  focus, dialog focus restoration, and complete keyboard/switch navigation.
- Reduced motion must preserve meaning and state. Light and dark presentation
  are both evaluation concerns, not decisions made by this brief.
- The core journey must remain readable one-handed at 390×844, including
  loading, stale/offline, and error states.

## Open visual dimensions

TASK-005 may explore all of the following. None is selected here:

| Dimension | Legitimately open alternatives |
| --- | --- |
| Color and theme | Light, dark, mixed, neutral, vivid, or restrained systems that satisfy contrast and express the required current-weather state |
| Typography | Sans, serif, mixed, editorial, utilitarian, expressive, or restrained systems that survive large-text testing |
| Density and hierarchy | Spacious, compact, progressive-disclosure, list-led, scene-led, or other scannable structures |
| Component character | Flat, bordered, layered, native, soft, geometric, tactile, or other accessible treatments |
| Imagery | Garment illustration, photography, diagrams, abstract weather, character-led, or no character where imagery adds no truth |
| Data expression | Text-first, icon-supported, visual-scale, compact status, or other treatments that keep the outfit primary |
| Motion and feedback | Different restrained executions of the required Home-to-outfit transformation, with haptics optional and a complete static reduced-motion equivalent |
| Brand expression | Different balances of warmth, directness, competence, familiarity, and Scandinavian relevance without defaulting to generic pastel baby branding |

Current CSS, tokens, root `DESIGN.md`, mockups, characters, garment art, weather
media, and design-lab work may be cited as references. They are not the control
direction, do not earn points for already existing, and cannot make an option
mandatory. No current color, font, component, image, mascot, page composition,
or theme is preserved solely because implementation effort already exists.

## TASK-005 direction contract

Produce three neutrally labeled directions using external references. Each
direction must include onboarding, home, and result concepts and must differ
materially from both others across color/theme, typography, density/hierarchy,
imagery, and component character. A palette swap does not qualify.

For a fair comparison:

- Use identical copy, data, viewport, activity, garment order, safety content,
  and state in all three directions.
- Cite the external references and state what principle was borrowed; do not
  copy a product's identity or layout wholesale.
- Annotate how each direction handles large text, reduced motion, semantic
  states, and an image failure or text-only fallback.
- Keep direction names neutral until testing. Do not describe one as the
  recommended, premium, safe, modern, or founder-preferred choice.
- Treat any direction-level tokens as disposable evidence, not a production
  design system.

A reviewer should be able to distinguish the directions with their titles
hidden. A direction is incomplete if it depends on its explanation to reveal
how it differs.

## TASK-006 evaluation questions

Counterbalance which direction appears first across the five target dads; first
exposure counts should be as even as five participants allow. Ask the same
questions after each direction and record observation separately from
interpretation, but score the five-second comprehension result only for the
first direction each participant sees. Record presentation order with every
response. Show all three directions before asking comparative preference so a
later option cannot inherit a comprehension answer and an early option cannot
receive a preference vote before comparison.

1. Within five seconds, what would you put on the baby, and in what order?
2. What is the main reason for that recommendation, and is anything uncertain
   or safety-critical?
3. What would you tap next, and can you find it without help?
4. How trustworthy does this feel, and what specifically increases or reduces
   that trust?
5. Which direction would you choose for repeated real use, and what makes it
   feel memorable rather than like a generic weather or baby app?

The decision table should compare comprehension speed, outfit recall, reason
recall, safety-boundary recognition, trust, dad relevance, accessibility risk,
distinctiveness, and implementation feasibility. Preference alone cannot
outvote a comprehension or safety failure.

## Exclusions and deferred decisions

This brief does not select a direction, palette, typeface, design system,
mascot, illustration method, theme default, exact motion execution, haptic
vocabulary, or production asset. It does not settle the Snudly/Babyora
source-of-truth conflict, the later-session monetization boundary, or qualified
safety review. Those choices must pass their named roadmap gates.

TASK-004 is complete when three meaningfully different directions can be made
from this brief without another taste decision. TASK-005 creates the options,
TASK-006 supplies five target-dad observations, and TASK-007 records only the
provisional, versioned direction supported by that evidence.
