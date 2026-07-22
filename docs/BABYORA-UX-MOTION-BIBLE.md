# Babyora UX & Motion Bible

**Version:** 1.0  
**Status:** Owner-approved design doctrine  
**Approved:** 2026-07-22

## Authority and scope

This document governs Babyora's user-experience and motion direction. It does
not replace the repository's document precedence, product model, safety rules,
engineering process, or approved implementation plans.

When documents disagree, follow `AGENTS.md`, `docs/CLAUDE-START-HERE.md`, and
`docs/DECISION-LOG.md` before this Bible. Model routing is governed by the
current repository instructions rather than by this document.

The objective is not to replace Babyora's design language. The objective is to
make the product feel calm, intelligent, trustworthy, and premium while
preserving and refining the strongest existing patterns.

## North Star

Babyora should make parents feel:

> The app has already thought this through for me.

Every interface decision should reduce uncertainty.

## Core design principles

1. Simplicity before cleverness.
2. Every animation teaches something.
3. Motion explains cause and effect.
4. Calm beats excitement.
5. Trust beats decoration.
6. Reuse strong existing architecture and components.
7. Add visual complexity only when it improves understanding.

## Signature experience

When the user opens today's outfit:

1. The hero remains visually connected to the action.
2. Garment nodes surrounding the child become the transition anchors.
3. Garments detach from the Antrekkskart.
4. Garments travel along calm, readable paths toward the ordered outfit list.
5. Each garment lands in its corresponding garment row.
6. Dressing-order numbers become explicit.
7. The explanation enters after the clothing relationship is understood.

The child illustration is not the source of truth. The canonical garment
recommendation, garment nodes, and ordered list are. The avatar may show only
verified outerwear and accessories; hidden garments remain explicit in the
Antrekkskart and list.

The mandatory body-connection lines in the approved Antrekkskart remain part
of the information model. Motion must preserve, not obscure, the relationship
between garment, body area, and dressing order.

## Higgsfield strategy

Use Higgsfield only where it clearly exceeds native animation.

Appropriate uses:

- living weather hero;
- subtle weather ambience;
- garment-transition source material;
- educational micro-animations;
- short onboarding story moments.

Prefer native motion for:

- navigation;
- sliders;
- cards;
- buttons;
- list transitions;
- state and focus feedback.

Generated video must never be required for understanding or interaction. A
still-image or native reduced-motion state must always preserve the meaning.

## Home screen

The Home hero is a living but calm weather scene. Its background may react to
sun, clouds, rain, snow, temperature, and night. Motion remains subtle and may
not delay the recommendation or primary interaction.

The existing temperature-reactive Morgennatt system is evolved, not replaced.

## Outfit recommendation

The interface must answer:

1. What should the child wear?
2. Why is this recommended?
3. In which order should the garments be put on?
4. What should the parent do if the child feels warm or cold?

Clothing should never be shown without enough explanation to support a real
decision. `Plagg` remains the primary user-facing term; internal layer data may
still determine order and safety logic.

## Motion system

Typical interface transitions should complete in approximately 180-250 ms.
Larger explanatory transitions may use approximately 900-1400 ms when the
extra time is necessary to show cause and effect.

Motion rules:

- support Reduce Motion everywhere;
- preserve immediate interaction and content availability;
- avoid decorative looping;
- use easing and paths that remain readable at mobile scale;
- keep haptics restrained and tied to meaningful state changes;
- never use animation to conceal loading or an uncertain recommendation;
- never make safety-relevant meaning depend on motion alone.

## Engineering loop

For implementation work governed by this Bible:

1. Analyze the existing implementation.
2. Classify relevant components as KEEP, REFACTOR, REPLACE, or REMOVE.
3. Build the smallest coherent experience.
4. Test behavior, accessibility, and reduced motion.
5. Run a focused UX critique.
6. Refactor where the experience or architecture became more complex.
7. Test again under the repository's risk-based plan-to-code process.

## Definition of done

The affected experience is done only when:

- the recommendation is immediately understandable;
- motion improves comprehension;
- light and dark modes both feel intentional where both are supported;
- reduced motion preserves the complete meaning;
- accessibility and relevant tests pass;
- architecture is no more complex than the experience requires;
- no P0 or P1 UX issue remains;
- implementation evidence satisfies the governing approved plan.

