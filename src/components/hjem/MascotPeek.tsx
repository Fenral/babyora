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
}>;

const MASCOT_SRC = `${import.meta.env.BASE_URL}monter/maskot.png`;

export function MascotPeek({ compact = false }: MascotPeekProps) {
  return (
    <img
      className="hjm-mascot"
      data-compact={compact ? 'true' : 'false'}
      src={MASCOT_SRC}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}
