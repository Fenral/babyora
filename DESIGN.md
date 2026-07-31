# Babyora design direction

Status: structural decisions are approved. Final palette, typography details and complete token values are intentionally not locked yet.

## Product experience

Babyora should feel like a calm, capable companion that briefly shows its reasoning and then gets out of the way. The recommendation is always more important than the weather spectacle.

## Locked structures

### Hjem

1. Weather scene with place, weather and activity.
2. Neutral mascot hangs over the weather panel, showing head, arms and a small part of the upper body.
3. First scan of the day reveals that place, weather and activity are being evaluated.
4. The weather state transforms into an outfit result.
5. Later openings use the cached result immediately unless place or activity changed.

### Outfit result

1. Clothes are primary.
2. Numbered vertical rows show dressing order, inner to outer.
3. Each row contains a garment image, name, role and alternatives.
4. The whole row is tappable.
5. The mascot does not need to wear the recommended combination.

### Planlegg

1. Explicit `I dag` and `I morgen` segments.
2. `I morgen` always contains one preparation widget.
3. `I dag` contains only meaningful clothing changes later that day.
4. Next week is a compact deviation summary, not a detailed forecast table.
5. The selected day may use a restrained weather scene that fades into the reading surface.

## Material and hierarchy

- Use familiar native controls and interaction patterns.
- The weather scene occupies only the upper context area.
- Recommendation content sits on a stable, high-contrast material.
- Avoid nested cards. Prefer one elevated result surface plus dividers.
- Use one accent role per screen.
- Keep interactive targets at least 44 by 44 points.
- Motion communicates calculation, transformation or state change.
- Normal transitions should complete in 150 to 250 ms.
- The full daily scan may be longer, but must be skippable through the cached result.
- Respect reduced motion.

## Art direction

- Keep mascot, garment imagery and weather scenes within one material family.
- Avoid mixing photorealistic backgrounds, emoji garments and clay-rendered characters.
- Final weather scenes should be atmospheric but subdued enough to support text.
- A transparent hanging mascot asset is required. Circular cropping is a mock-only fallback.
- Standing and sitting mascot variants may be used in onboarding, empty states and Guide.

## Locked 2026-07-31 (owner decisions)

- Theme strategy: dark-first, warm. Deep petrol/espresso canvas, wool-cream ink, warm accent (saturation < 80 %), weather-reactive panel nuances. Never cold tech-slate. Light mode is a later calibrated secondary variant.
- Navigation: 3 tabs (Hjem, Planlegg, Familie). Guide retired; see PRODUCT.md for redistribution.
- Commercial model: hard paywall after onboarding + first shown recommendation; 7-day StoreKit intro trial on all plans.
- Mascot: style decided via 3-way shootout (Laika puppet / matte 3D / current mock control) before asset production.

## Open decisions

- Final color palette values and semantic color tokens (within the locked dark-warm strategy).
- Final type scale and font assignments.
- Illustrated versus softly photographic weather scenes.
- Final mascot and garment asset production (pending shootout).
- Haptic vocabulary.
- Exact scan choreography and sound policy.

## Color system locked 2026-07-31: S1 "Monter"

Chosen after the Steg 2a analysis (category evidence, figure/ground insight, three candidate systems, two generated Hjem mocks). Core idea: **two warm darks in layers** — espresso as the spatial canvas (the room), deep warm petrol as the instrument panel (the machine). Warm skin/cream separates maximally against the cool-leaning panel while the espresso canvas keeps the whole warm. Weather reactivity lives ONLY in the panel nuance (clear/cloudy/rain/snow/night within the petrol family); canvas and ink stay constant. A warm amber rim light along the panel's top edge ("monter-lys") is part of the system. Exact OKLCH token values are defined in Steg 2b and verified with a computed contrast matrix before implementation.
