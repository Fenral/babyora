/**
 * MascotPeek — maskoten som henger over panelets øvre kant (DESIGN.md
 * «Neutral mascot hangs over the weather panel, showing head, arms and a
 * small part of the upper body»). Rent dekorativ (aria-hidden, ingen
 * pointer-events) — den ikler seg ALDRI den anbefalte kombinasjonen
 * (DESIGN.md: «The mascot does not need to wear the recommended
 * combination»), så komponenten trenger ingen antrekks-props i det hele tatt.
 *
 * `compact` speiler mocken sitt innholdstunge-kompresjonsmønster
 * (`#stage-stale .mascot, #stage-offline .mascot { width:188px; top:38px }`)
 * — brukt i stale/offline-tilstandene der ask-blokken har mer tekst.
 */
import './hjem-monter.css';

export type MascotPeekProps = Readonly<{
  compact?: boolean;
  /**
   * P10/JOB1 (docs/design-notes/aapningssekvens-2026-08-01.md): visually
   * hidden (NOT unmounted — `visibility:hidden`, still occupies its slot)
   * while OpeningSequence's own body/hands layers stand in for it during
   * the opening choreography. Kept mounted throughout so the hand-off at
   * the end of the sequence is a plain visibility toggle, not a mount —
   * guaranteed pixel-identical to MascotPeek's own anchored position,
   * since it IS MascotPeek the whole time.
   */
  hidden?: boolean;
}>;

const MASCOT_SRC = `${import.meta.env.BASE_URL}monter/maskot.png`;

export function MascotPeek({ compact = false, hidden = false }: MascotPeekProps) {
  return (
    <img
      className="hjm-mascot"
      data-compact={compact ? 'true' : 'false'}
      data-opening-hidden={hidden ? 'true' : 'false'}
      src={MASCOT_SRC}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}
