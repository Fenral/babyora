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
 *
 * Del 3 (nysgjerrig maskot, sol-duel v3-pakken 2026-08-01): `pose` velger
 * mellom to stablede <img> (maskot.png / maskot-nysgjerrig.png), begge
 * ALLTID montert, crossfadet via CSS opacity (hjem-monter.css — se
 * `.hjm-mascot-normal`/`.hjm-mascot-curious`). HjemMonter.tsx setter
 * `pose="curious"` (kompakt) mens phase er 'scanning'/'recalculating' —
 * maskoten bøyer hodet ned og retter blikket mot scan-animasjonen under
 * seg (kun en liten CSS-lean, se CSS-filens egen kommentar; ingen
 * generativ video). Tilbake til 'normal' i alle andre faser/grener (default
 * prop-verdi — kallerne trenger ikke eksplisitt sette den).
 *
 * MascotIdle.tsx (den hvilende weather-ready-varianten) rendrer DENNE
 * komponenten direkte og styrer kun `pose` fra sin egen timer — ingen egen
 * bilde-rendering der.
 */
import './hjem-monter.css';

export type MascotPose = 'normal' | 'curious';

export type MascotPeekProps = Readonly<{
  compact?: boolean;
  pose?: MascotPose;
  /**
   * Dobbel vakt (samme mønster som ScanOverlay/ResultSurface): pose-BYTTET
   * skjer fortsatt (blir aldri "fastlåst" i feil pose), men CROSSFADEN
   * (og scanning-konktekstens lean-transform) hopper til slutt-tilstanden
   * uten transition — «instant completion», ikke en animert overgang.
   */
  reducedMotion?: boolean;
}>;

const MASCOT_SRC = `${import.meta.env.BASE_URL}monter/maskot.png`;
const MASCOT_CURIOUS_SRC = `${import.meta.env.BASE_URL}monter/maskot-nysgjerrig.png`;

export function MascotPeek({ compact = false, pose = 'normal', reducedMotion = false }: MascotPeekProps) {
  const compactAttr = compact ? 'true' : 'false';
  const animateAttr = reducedMotion ? 'false' : 'true';
  return (
    <>
      <img
        className="hjm-mascot hjm-mascot-normal"
        data-compact={compactAttr}
        data-pose={pose}
        data-animate={animateAttr}
        src={MASCOT_SRC}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <img
        className="hjm-mascot hjm-mascot-curious"
        data-compact={compactAttr}
        data-pose={pose}
        data-animate={animateAttr}
        src={MASCOT_CURIOUS_SRC}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
    </>
  );
}
