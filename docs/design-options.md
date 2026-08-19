# TASK-005 — Three visual directions

**Status:** Test candidates. No direction is selected.

**Decision boundary:** These concepts test visual expression only. They do not
approve a production palette, typeface, component library, asset style, product
name, or design system. Direction variables in `design-lab/task-005/styles.css`
are disposable exploration values.

## Fair comparison contract

Every direction renders from the same fixture and uses the same 390×844 CSS-pixel
viewport. The shared scenario is Nora, 8 months, in Oslo: 3°C, feels like −1°C,
7 m/s wind, light rain, stroller activity, and weather updated at 08:10.

The result in every direction contains the same ordered answer:

1. Ullbody
2. Ullbukse
3. Ullfleecedress
4. Skalldress
5. Ullue
6. Votter

The reason, stroller safety boundary, source/review status, four activity choices,
navigation roots, setup fields, and actions are also identical. The fixture is
stored once in `design-lab/task-005/fixture.js`, preventing copy or data from
making one candidate easier than another.

## External reference principles

References were reviewed on 2026-08-19. They are principle sources, not templates.
No interface, illustration, trademark, or proprietary asset was copied.

| Reference | Principle borrowed | Applied to |
| --- | --- | --- |
| [Yr on Google Play](https://play.google.com/store/apps/details?id=no.nrk.yr) | Make current weather immediately legible while keeping needed detail in the same view. | A |
| [Helsenorge — about the service](https://www.helsenorge.no/en/about-helsenorge/) and [information principle](https://www.helsedirektoratet.no/digitalisering-og-e-helse/prinsipper-for-innbyggertjenester/1-informasjonsprinsippet) | Separate accountable, current guidance from decorative polish; adapt information to the user's need. | A |
| [Day One](https://dayoneapp.com/) and its [navigation update](https://dayoneapp.com/releases/major-navigation-update-with-journals-more-tab/) | Give one task editorial focus and keep the main navigation restrained. | B |
| [IKEA app](https://www.ikea.com/gb/en/ikea-app/) | Combine everyday warmth with practical, confidence-building guidance. | B |
| [Windy.app features](https://windy.app/features) and [getting started](https://windy.app/how-to-get-started-android) | Use compact weather instrumentation and fast activity access for users who trust visible conditions. | C |

## Direction A

### Visual hypothesis

A familiar Scandinavian utility interface may feel quickest and most credible
when a tired parent wants an answer without learning a new visual language.

### Observable signature

- **Color/theme:** cool white surfaces, weather blue, and a restrained orange
  connection/safety accent.
- **Typography:** plain sans serif with a strong size hierarchy and ordinary
  sentence case.
- **Density/hierarchy:** moderate density; one large weather region on Home;
  result becomes a single linear dressing list.
- **Imagery:** abstract rain plus a small body-connection diagram; no character
  or decorative lifestyle image.
- **Component character:** flat native controls, thin dividers, restrained
  rounding, and a rectangular primary action.

### Interaction and failure contract

- Home weather color and rain marks respond to current conditions. Text remains
  the source of truth if the visual fails.
- On activation, the orange Home preview line extends into body anchors, anchors
  settle beside the ordered garment rows, then numbers appear. Duration target:
  420 ms total; explanation follows without delaying the list.
- Reduced motion shows the complete numbered result immediately, including the
  body map and its text equivalent.
- At large text, weather art yields space first; activity controls become a
  vertical list; garment rows wrap without moving their number or state.
- Loading uses a labeled progress region; stale weather replaces “Oppdatert” with
  a visible age and refresh action; an error keeps the child/activity inputs and
  offers retry plus manual location.

### Main risk to test

Familiar utility styling may read as “another weather app” and feel less memorable
than the specificity of the infant answer deserves.

## Direction B

### Visual hypothesis

A warm field-guide treatment may make practical advice feel considered and human
without using babyish decoration or unexplained medical authority.

### Observable signature

- **Color/theme:** paper cream, forest green, terracotta, and muted rain green.
- **Typography:** editorial serif for decisions paired with compact sans-serif
  labels for control clarity.
- **Density/hierarchy:** spacious setup and Home; result uses a two-column garment
  field guide before returning to linear explanation and safety.
- **Imagery:** hand-drawn weather/land forms and an illustrated body map on a
  paper-like surface.
- **Component character:** tactile offset borders, irregular pills, label cards,
  and deliberately imperfect geometry.

### Interaction and failure contract

- The Home landscape and paper tint respond to weather while the written weather
  values remain independent of the image.
- On activation, the terracotta thread from Home traces the body map, then each
  garment card lands in dressing order. Duration target: 560 ms total; numbering
  is present before any decorative settling.
- Reduced motion cuts directly to the complete, numbered card grid and text
  reason. The DOM and screen-reader order stay 1–6 even though cards use columns.
- At large text, the garment grid collapses to one column and the field-guide
  image becomes secondary. Buttons and controls retain at least 44×44 CSS pixels.
- If texture or illustration fails, borders, numbers, garment names, state labels,
  reason, and safety content remain. Loading, stale, and error states use written
  paper slips with icons plus text, never paper color alone.

### Main risk to test

The tactile editorial character may feel slower or less operational when the dad
is outdoors, rushed, or reading in poor light.

## Direction C

### Visual hypothesis

A compact weather-instrument interface may feel capable and dad-relevant by making
conditions, status, and the resulting layers visibly connected.

### Observable signature

- **Color/theme:** cool near-black grid, cyan data, and high-visibility lime for
  the single primary action and hard safety boundary.
- **Typography:** condensed sans-serif headings with monospaced labels and data.
- **Density/hierarchy:** compact modular panels; four activities share one row;
  result becomes a numbered technical sequence.
- **Imagery:** geometric condition graph and body wiring diagram rather than a
  scene or character.
- **Component character:** square status modules, hairline grids, clipped corners,
  terminal-like labels, and no soft card stack.

### Interaction and failure contract

- The Home graph and condition color react to weather, but every condition is also
  named in text.
- On activation, the cyan condition trace converges on the body connections, then
  the lime dressing numbers illuminate in order. Duration target: 360 ms total;
  result content occupies its final position throughout.
- Reduced motion shows all connections and numbers in the final state immediately.
- At large text, the activity row becomes two columns, technical abbreviations are
  not introduced, and panels expand vertically instead of clipping.
- If the graph or SVG fails, weather text, garment names, numbered order, state
  labels, explanation, and safety block remain. Loading, stale, and error states
  use a written status code plus plain-language next action.

### Main risk to test

Technical styling may imply false precision or feel less emotionally reassuring,
even when the recommendation itself is clear and safety-bounded.

## Title-blind distinction check

Open the lab with `?blind=1`, keep direction labels hidden, and ask a reviewer to
describe each sheet before discussing preference. Passing requires the reviewer
to identify three different systems from visual evidence alone:

| Hidden candidate | Expected description without using its title |
| --- | --- |
| A | Light, flat, familiar/native, linear result |
| B | Warm, paper-like, editorial/illustrated, garment-card collage |
| C | Dark, technical, gridded/instrumental, compact sequence |

Fail the check if the reviewer describes two options as the same layout with
different colors. Preference, trust, five-second comprehension, and target-dad
fit remain deliberately unanswered until TASK-006.

## Accessibility pre-check

All visible controls have a 44×44 CSS-pixel minimum, visible keyboard focus, text
labels, and semantic button or field roles in the concept. Color is reinforced by
labels, numbers, borders, or position. `prefers-reduced-motion` disables all
non-essential animation. The result's text list is authoritative, the body diagram
has a text equivalent, and the shared DOM order is logical.

These are concept-level contracts, not a WCAG certification. Production contrast,
Dynamic Type, assistive technology, screen-reader order, focus restoration,
loading, stale, offline, error, and image-failure checks remain implementation
gates.

## How to inspect

```powershell
npx vite --host 127.0.0.1 --port 4176
```

- Labeled: `http://127.0.0.1:4176/design-lab/task-005/`
- Title-blind: `http://127.0.0.1:4176/design-lab/task-005/?blind=1`
- Static contract: `node design-lab/task-005/verify.mjs`
- Captured sheets: `design-lab/task-005/screenshots/`

## TASK-006 handoff

Show all three title-blind candidates to five target dads using the counterbalanced
order and identical questions in `docs/design-exploration.md`. Record observation
separately from interpretation. Do not select a production direction before those
five responses exist.
