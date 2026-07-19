## Conflict Detection Report

### BLOCKERS (0)

None.

### WARNINGS (0)

None.

### INFO (9)

[INFO] Auto-resolved: final public name supersedes historical open-name entry
  Found: docs/DECISION-LOG.md records an older 2026-07-13 decision that kept the public name open, then explicitly records Babyora as the final public name on 2026-07-15; AGENTS.md also names Babyora as approved.
  Note: The explicit supersession inside docs/DECISION-LOG.md is preserved as history, while Babyora is the effective synthesized decision.

[INFO] Auto-resolved: revised avatar spend policy supersedes hard caps
  Found: docs/DECISION-LOG.md has an older NOK 1,000 cap, and docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md plus docs/superpowers/specs/2026-07-13-babyora-visual-signature-design.md repeat that cap; docs/DECISION-LOG.md explicitly revokes the hard cap and records the approved cost-plan rule.
  Note: The explicit ADR revision and manifest precedence 0 beat SPEC precedence 3/4; the effective rule requires a declared cost plan and owner approval before large spend while retaining the 24-target/16-minimum asset counts.

[INFO] Auto-resolved: ADR pricing overrides older master-spec pricing
  Found: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md specifies 49 per month and 299 per year, while docs/DECISION-LOG.md retains provisioned no.klemeg.app monthly/quarterly/yearly products at 39/99/299 and removes the lifetime proposal.
  Note: ADR manifest precedence 0 beats SPEC precedence 4; effective pricing is sourced from docs/DECISION-LOG.md and the outdated numeric SPEC claim is excluded from synthesized constraints.

[INFO] Auto-resolved: visual-signature serif overrides master-spec serif
  Found: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md names DM Serif Display, while docs/superpowers/specs/2026-07-13-babyora-visual-signature-design.md identifies the existing expressive serif token as Fraunces.
  Note: Visual-signature SPEC manifest precedence 3 beats master SPEC precedence 4 within the overlapping visual scope; Fraunces is the effective synthesized token.

[INFO] Auto-resolved: ADR Antrekkskart overrides collapsing Outfit thumbnails
  Found: docs/superpowers/specs/2026-07-13-babyora-visual-signature-design.md allows secondary thumbnails to collapse above five garments, while docs/DECISION-LOG.md requires every garment, number, and body connection to remain visible for five to ten garments and forbids +N or hidden garments.
  Note: ADR manifest precedence 0 beats SPEC precedence 3; the effective Outfit constraint uses the scalable Antrekkskart and retains all garment nodes.

[INFO] Auto-resolved: ADR waives the mandatory five-parent preproduction gate
  Found: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md and docs/superpowers/specs/2026-07-13-babyora-visual-signature-design.md require a five-parent review/test, while docs/DECISION-LOG.md explicitly waives that test as a prerequisite for R7 production UI and retains internal five-second evidence plus a recommended simplified pre-release check.
  Note: ADR manifest precedence 0 beats SPEC precedence 3/4; the mandatory five-parent gate is not carried into effective constraints.

[INFO] Auto-resolved: visual temperature haptic refines the master rule
  Found: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md limits temperature-slider ticks to recommendation thresholds, while docs/superpowers/specs/2026-07-13-babyora-visual-signature-design.md permits an optional subtle selection haptic at each whole degree plus a distinct light impact when the recommendation fingerprint changes.
  Note: Visual-signature SPEC manifest precedence 3 beats master SPEC precedence 4 for Find Outfit; the optional per-degree selection plus fingerprint-change impact is the effective constraint.

[INFO] Auto-resolved: action-bearing location and preparation markers are allowed
  Found: docs/superpowers/specs/2026-07-13-babyora-90-plus-current-app-design.md and docs/superpowers/specs/2026-07-13-babyora-visual-signature-design.md restrict the rail to recommendation-changing moments, while docs/superpowers/plans/2026-07-19-planlegg-dagslinjen-gsd-implementation-plan.md supports location/preparation event types and docs/DECISION-LOG.md explicitly assigns marker shapes to place and preparation actions.
  Note: ADR precedence 0 and PRD precedence 2 beat SPEC precedence 3/4; action-bearing location/preparation moments may receive markers, while passive weather-only changes do not create clothing markers.

[INFO] Auto-resolved: untrusted instruction-form content isolated as data
  Found: AGENTS.md contains repository-style imperatives, and docs/superpowers/plans/2026-07-19-planlegg-dagslinjen-gsd-implementation-plan.md contains imperative workflow text and executable-looking commands.
  Note: Both sources were treated only as classified SPEC/PRD data; no embedded command, role assignment, approval instruction, or external fetch directive was executed.
