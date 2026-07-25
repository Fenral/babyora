# Plan 02-09 enabled exact-context compatibility amendment

**Status:** LOCKED FOR 02-09 ENABLED REPAIR
**Date:** 2026-07-25
**Rejected activation candidates:**

- `319fb844500cb230e508c38929f184f7e1c3643e` — missing enabled exact-context shell
- `41aaea33249bedd51c56e80e95e2107ab51dc285` — legacy access/composition selectors still required internal visible entitlement copy
**Restored false-flag head:** `a02edbb6c8e6b92b3d205f9f07f691c229c37747`

## Reason

The first enabled run correctly failed the unchanged Phase-1 exact-context
browser gate. The new production branch replaced the exact-context screen
shell with a generic `Dagens antrekk` / `Planlagt antrekk` heading and the
truth panel alone. That changed the dialog name and removed the visible child,
situation and weather-reason context even though the exact bundle itself was
correct.

The old browser contract also reads bare labels from the legacy list. The
real `OutfitGarmentList` intentionally contains richer numbered interactive
rows, so retaining the old selector would require a second hidden or visible
garment list. Duplicate truth is rejected: it would be inferior UX,
duplicative screen-reader output and a second DOM representation of one
recommendation.

This amendment preserves every Phase-1 truth and lifecycle assertion while
migrating only the DOM selectors that must follow the approved Antrekkskart.

## Product-compatible enabled shell

The enabled `PaakledningScreen` branch must:

- use `planned-outfit-title` as the focused dialog label and show the child's
  name as the heading, with `Dagens antrekk` or `Planlagt antrekk` as its
  eyebrow;
- retain one visible compact `Dagens situasjon` / `Planlagt situasjon` section
  from the exact frozen context, including date/time, place, activity,
  optional vogn state, age and weather;
- render the real `OutfitTruthPanel` exactly once, with no legacy, hidden,
  screen-reader-only or test-only duplicate garment list;
- retain one visible `Hvorfor dette antrekket?` section with the exact frozen
  wind and precipitation values;
- expose the exact access capability as a non-presentational data attribute,
  not internal entitlement copy shown to parents;
- preserve initial heading focus, Escape/close behavior, opener focus return,
  scroll state, row registration, alternatives, guide callback and the
  settled/landing semantic contract.

No runtime environment, query, storage or test-fixture bypass may select a
different production branch.

## Approved scope correction

The twelve implementation paths approved by the prior amendments remain
authorized. Add exactly one existing test path:

- `e2e/planlegg.ts`

It may change only where the exact-context, automatic-location, access and
composition-matrix cases bind to the replaced Outfit DOM. Both flag stages
must remain testable:

- with the flag false, the existing legacy exact-context surface remains
  byte-compatible and passes;
- with the flag true, the same tests read ordered garment labels from the real
  Outfit rows, equipment from the real equipment section, and access from the
  production dialog attribute.

Every access assertion must preserve the exact expected capability
(`today_home` or `future_plan`). The legacy branch may keep reading the
existing visible `Tilgang:` copy. When the genuine `.outfit-truth-panel` is
present, the assertion must instead read `data-outfit-access-capability`;
tests may not require internal entitlement names to be exposed as parent-facing
copy.

Every assertion for exact child, place, date/time, activity, vogn state, age,
temperature, feels-like value, ordered garments, equipment, wind,
precipitation, immutable open-dialog content, visibility refresh, event
removal, close/Escape, focus return and scroll preservation remains required.
Selectors may branch only on the presence of the genuine
`.outfit-truth-panel`; expected values and lifecycle assertions may not be
weakened.

The existing production-route harness may update its dialog lookup from the
generic route label to the exact child-name dialog, while retaining real
Hjem/Planlegg entry and no direct prop injection.

## Evidence correction

The final verifier and candidate record must require:

- `scope_attestation: amended-13-paths-only`;
- `scope_file_count: 13`;
- the exact thirteen implementation paths;
- both approved governance artifacts:
  - `02-09-PREACTIVATION-TEST-AMENDMENT.md`
  - `02-09-ENABLED-CONTEXT-COMPATIBILITY-AMENDMENT.md`

Every other planning, source, package, media, Hjem, Uke, token, threshold,
storage, network or entitlement change remains rejected.

## Activation sequence reset

Candidate `319fb844500cb230e508c38929f184f7e1c3643e` is rejected evidence only.
The flag was restored to compile-time false in
`a02edbb6c8e6b92b3d205f9f07f691c229c37747`.

After this repair, all false-stage commands and the full suite must pass on a
new clean pre-activation commit `P2`. The accepted activation candidate `C2`
must be the exact child of `P2`, and its entire delta remains limited to:

- `src/lib/outfit/feature-flags.ts`
- `src/components/outfit/__tests__/OutfitTruthPanel.test.tsx`

All enabled commands, external evidence and both fresh independent reviews
must bind only to `C2`.
