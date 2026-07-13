# Babyora Visual Signature — Protective Morning Instrument

**Date:** 2026-07-13  
**Status:** Revised direction; incorporated into implementation plans
**Relationship:** Extends `2026-07-13-babyora-90-plus-current-app-design.md`; it does not replace Babyora's design system

## 1. Design decision

Babyora becomes a **protective morning instrument**: approximately 60% clothing decision, 25% weather atmosphere, and 15% numeric precision.

The app should feel like a trusted object a parent reaches for every morning—not a generic card-based app, a nostalgic thermometer replica, or a playful baby game. The correctly dressed child and ordered garment answer communicate the decision first. Controlled glass, scales and data light support precision where they improve understanding; they do not become the brand's dominant subject.

The existing identity remains:

- night navy/plum canvas;
- temperature-reactive atmosphere;
- mint action language;
- peach editorial warmth;
- the existing expressive serif token (`--font-serif`, currently Fraunces) reserved for display moments;
- practical sans-serif for decisions and controls;
- soft 3D baby and garment imagery;
- low-motion, high-precision interaction.

## 2. Visual laws

1. **One decision per screen.** A screen may have one dominant physical metaphor, but Home's dominant object is the clothing decision and verified avatar—not a thermometer.
2. **Physical depth must explain hierarchy.** Highlights, glass, inset tracks, and shadows indicate affordance or state—not decoration.
3. **Texture is local, not wallpaper.** Textile texture belongs on garments and selected knowledge assets; text surfaces remain clean.
4. **Numbers remain exact.** Temperature, time, wind, and precipitation retain units and tabular alignment.
5. **Color follows meaning.** Cold blue is temperature only; peach/rust is warmth/editorial; mint is action/confirmed state.
6. **Motion demonstrates cause and effect.** The atmosphere responds, the instrument settles, then the recommendation changes.
7. **No fake realism.** Avoid wooden frames, chrome bevels, condensation, scratches, stitches around every card, or ornamental screws.
8. **Accessibility is part of the object.** Every metaphor has explicit labels, values, controls, focus, and reduced-motion behavior.

## 3. Signature component 1 — Temperature instrument

### Purpose

Replace the generic horizontal slider in Find Outfit with a recognizable, precise temperature control that supports the clothing decision.

### Anatomy

- Height: responsive, with 300–360 pt as an upper exploration range on a 390 × 844 screen. The result and primary action must remain visible; reduce the instrument when necessary.
- Central glass tube: translucent dark glass with a fine inner highlight and deep inset channel.
- Reservoir: softly flattened bulb, not a cartoon circle.
- Temperature column: continuous cold-blue → muted neutral → peach/rust interpolation.
- Engraved scale on the right: whole degrees, major mark every 5°, numeric label every 10°.
- Current value floats in a compact instrument readout above or beside the column, using tabular numbers.
- Garment thresholds appear on the left only where the current scenario changes: small garment glyph plus a short label such as “+ fleece”.
- Wind and rain remain separate compact dials/controls below; they never distort the temperature scale.

### Interaction

- Drag anywhere on the tube/scale; the hit area is at least 44 pt wide.
- ± buttons provide exact one-degree adjustment.
- The column follows the finger continuously; the numeric value snaps to whole degrees.
- Selection haptic at each whole degree is optional and very subtle; a distinct light impact occurs only when the recommendation fingerprint changes.
- Background atmosphere interpolates during drag.
- Garment result updates after the control settles for 120–180 ms or crosses a rule threshold; it does not flicker per pixel.
- A short reason appears at a threshold: “Vinden gjør at et skallag legges til.”

### States

- default/current weather;
- actively dragging;
- exact keyboard/switch-control adjustment;
- recommendation threshold crossed;
- loading current weather;
- manual override from current weather;
- reduced motion/haptics;
- large text, where the scale moves beside—not behind—the value.

### Visual restraint

The thermometer is not photorealistic. Use two glass highlights, one inset shadow, and a controlled column glow. No metallic frame, vintage typography, decorative mercury warning, or faux aging.

## 4. Signature component 2 — Verified outer-outfit avatar

### Purpose

Make the unique value—the final visible outfit—understandable immediately, while the adjacent list explains what goes on innerst first.

### Behavior

- Use one child identity with two locked master poses: sitting for 0–11 months and standing for 12–24 months.
- Render the verified final outermost outfit immediately. Hidden base and middle layers are never shown through or animated onto the final outer garment.
- Dressing order remains explicit in the garment list. Tapping a row focuses its list/thumbnail explanation without replacing the final avatar with a hidden-layer fiction.
- Crossfade between verified final composites only when the visible outfit changes, using 180–240 ms.
- If a verified composite is unavailable, the avatar becomes explicitly neutral and the canonical list remains the truth; Babyora never guesses a near match.
- Reduced motion shows the final state instantly.

### Visual treatment

Only visible outer garments/accessories may sit on subtle orbital anchors around the avatar when space permits. Hidden underlayers remain in the list. More than five listed garments collapses secondary thumbnails rather than shrinking the avatar. Shadows share one light source and never float at inconsistent depths.

## 5. Signature component 3 — Textile garment stack

The outfit list becomes a dressing stack rather than a collection of generic cards.

- One continuous vertical stack with slight 6–10 pt overlaps.
- Each row exposes garment name, category/placement, and optional alternative.
- The active row lifts 2–3 pt with a softer mint edge light; inactive rows do not all cast full shadows.
- A narrow woven-color tab may identify inner, middle, outer, or accessory groups, but user-facing copy remains `plagg` and “innerst først”.
- Texture is limited to the small garment thumbnail or tab; text background remains solid and high contrast.
- Drag-and-drop is not introduced; order is advice, not inventory management.

## 6. Signature component 4 — Plan change rail

Planlegg uses one continuous rail through the day/week rather than repeated cards.

- Time/day labels align on the left.
- A thin atmospheric rail carries weather conditions.
- Only recommendation-changing moments receive a physical marker.
- Marker shape communicates action: add, remove, rain protection, location change, or preparation.
- The selected marker expands into one action sentence and up to three garments.
- Unchanged periods collapse into “Samme antrekk frem til 18:00”.
- Future locked content reveals one truthful example behind a restrained glass blur, not a wall of padlocks.

The rail scrolls vertically for accessibility and one-handed use. It does not become a dense horizontal weather graph.

## 7. Signature component 5 — Warm or Cold gauge

The feedback control becomes a three-position tactile gauge.

- Left: litt kald; center: passe; right: litt varm.
- The gauge uses a single sliding indicator with explicit labels and icons; color is secondary.
- Center is visually stable and neutral, not a “success” that pressures the answer.
- Selection produces one restrained haptic and an immediate plain-language action.
- When calibration exists, a small evidence line explains its effect; no clinical graph or percentage is shown on the main surface.
- VoiceOver/TalkBack exposes it as three radio choices, not an unlabeled custom slider.

## 8. Signature component 6 — Family care circle

Familie should feel like coordinated care, not account administration.

- The active child sits at the center of a shallow circular arrangement.
- Up to four caregivers appear as overlapping portrait/initial tokens; additional members collapse into `+N`.
- A fine mint connection ring means active access; pending uses a dashed peach ring; revoked never remains in the circle.
- The circle is a summary and invitation entry point. The detailed member list below remains conventional and accessible.
- Roles use plain Norwegian: Eier, Foresatt, Omsorgsperson, Kun visning.
- No live-location dots or language suggesting the people/child are tracked.

## 9. Signature component 7 — Babyora widget

The widget is a small instrument, not a miniature dashboard.

- Dominant value: temperature plus short garment decision.
- A slim vertical temperature column echoes the in-app thermometer without becoming interactive.
- One next-change line appears only when action is required.
- Small widget: value, garment summary, freshness.
- Medium widget: adds active child/privacy label, condition, and next change.
- Stale state dims the column and says “Oppdater i Babyora”; it never presents stale advice as live.
- No gradients that become muddy on arbitrary launcher wallpapers; use a stable dark surface with controlled temperature light.

## 10. Signature component 8 — Paywall transformation

The paywall demonstrates expansion of the instrument:

- Free preview: one child, home marker, today marker.
- Plus preview: the same visual expands to future markers, current-place indicator, care circle, and calibrated indicator.
- Animation is a single 500–700 ms progressive reveal, played once and skipped with reduced motion.
- Benefits remain readable text; the visual proves the story but never replaces it.
- Prices use calm instrument rows. Annual is selected; monthly remains equally legible. No full-screen mint campaign panel.

## 11. Menu and navigation refinement

- Bottom navigation becomes a low, dark instrument dock integrated with the canvas—not a floating glass pill copied from iOS.
- Active state uses filled icon, stronger label, and a quiet mint pool behind the icon. No full outline.
- The dock uses one top highlight and one canvas shadow; avoid heavy blur on low-end devices.
- Tab labels remain visible: Hjem, Planlegg, Guide, Familie.
- Root-to-root movement crossfades at 140 ms; drill-down pushes 24 pt with the existing controlled spring.
- Back/close controls keep 44–48 pt hit areas but use visually small, quiet glyphs.

## 12. Material, light, and palette

### Material hierarchy

1. Canvas: matte night atmosphere.
2. Instrument glass: only temperature, selected data readouts, and restrained future teaser.
3. Textile: garments and knowledge illustrations.
4. Solid raised surface: lists, settings, explanations, and forms.

### Lighting

- One implied light source from upper left.
- Glass highlight opacity stays below the text contrast layer.
- Raised active elements receive a soft mint-tinted reflected light, not a neon glow.
- Peach is an atmospheric warmth reflection and editorial accent.
- Shadows remain tinted by the canvas and use no pure black.

### New semantic tokens

```css
--instrument-glass: color-mix(in oklab, var(--surface-elevated) 78%, transparent);
--instrument-highlight: color-mix(in oklab, white 18%, transparent);
--instrument-channel: color-mix(in oklab, black 24%, var(--bg-canvas));
--instrument-reflection: color-mix(in oklab, var(--accent-cta) 14%, transparent);
--textile-shadow: 0 10px 24px color-mix(in oklab, var(--bg-canvas) 72%, black);
--temperature-cold: var(--layer-bg-kald);
--temperature-neutral: var(--layer-bg-mild);
--temperature-warm: var(--layer-bg-varm);
```

These aliases reuse the existing exact colors and must not introduce a duplicate palette.

## 13. Motion and haptic choreography

Order for a temperature-driven change:

1. input responds immediately;
2. atmosphere interpolates over 220–320 ms;
3. instrument value settles;
4. threshold haptic fires only if the recommendation changes;
5. verified final avatar crossfades over 180–240 ms only when its visible-state key changes;
6. reason copy fades in last.

No transition exceeds 900 ms for the full sequence or 360 ms for an individual UI transition, except the optional one-time paywall demonstration. Reduced motion resolves directly to the final state. Haptic feedback is never the only indicator.

## 14. Asset requirements

- Create one high-resolution design reference for the temperature control, two avatar poses, care circle, and widget before production assets.
- Functional avatar assets use no contextual scene, a consistent camera/scale, upper-left light, shared ground shadow, and verified visible garment identity.
- Use the existing Nano Banana Pro soft-3D/clay identity through sequential edit chains. Do not redraw the child from scratch between states.
- Production is capped at 24 approved avatar composites (12 per pose) and NOK 1,000 direct generation spend. If quality cannot be preserved, reduce to the 16-state truthful minimum rather than adding lower-quality images.
- Production selection requires anatomy, identity, material, silhouette, transparency, mobile crop, compression, and exact `AvatarStateKey` review.
- Google Image is research reference only; no unlicensed image ships.
- Do not rasterize text, scales, controls, focus states, or dynamic temperature columns into generated images.

## 15. Acceptance criteria

The visual-signature work is complete only when:

1. A user can identify Babyora's clothing decision and avatar treatment without seeing the logo; the temperature control remains recognizable in Find Outfit.
2. The thermometer remains precise and usable with touch, keyboard/switch control, large text, reduced motion, and without haptics.
3. The final outer-outfit avatar and garment list never contradict the canonical recommendation; hidden underlayers are not rendered on the avatar.
4. Plan shows decisions rather than repeated forecast cards.
5. Family conveys shared care without implying tracking.
6. Widget communicates freshness and never exposes prohibited data.
7. Paywall visually demonstrates future/everywhere/together while preserving truthful text and calm pricing.
8. No page uses more than one dominant physical metaphor.
9. 390 × 844, largest supported text, coldest/warmest atmosphere, light/dark platform chrome, and low-performance native devices are verified.
10. Each affected surface reaches at least 90 in the same product-audit rubric and passes a five-parent comprehension test.

## 16. Non-goals

- No full skeuomorphic redesign.
- No literal vintage mercury branding.
- No decorative texture across every surface.
- No animated mascot behavior.
- No liquid physics that delays input or causes motion discomfort.
- No live family map, presence tracking, or social feed.
- No visual effect that obscures garment truth, safety guidance, price, or accessibility.
