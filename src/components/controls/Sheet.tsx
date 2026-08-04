/**
 * Sheet — appens ark-/dialogprimitiv (sentrert).
 *
 * Fase 2B målte 19 dialogflater i 12 varianter, og fant at feilene var de
 * samme overalt. Denne komponenten finnes for at de fire nedenfor ikke skal
 * kunne oppstå på nytt:
 *
 *   1. `<dialog open>` UTEN showModal(). Én flate i appen gjør det i dag, og
 *      mister alle tre på én gang: Escape fyrer aldri på en ikke-modal
 *      dialog, tabrekkefølgen går rett ut i siden bak, og bakgrunnen er
 *      både rullbar og klikkbar mens arket står oppe.
 *   2. FOKUS SETTES IKKE INN, og gis ikke tilbake. Tre av tolv dialoger i
 *      Innstillinger åpner uten å flytte fokus. Den som lukker et ark skal
 *      lande der hen var, ikke på toppen av siden.
 *   3. INGEN BAKGRUNNSLUKKING. Å trykke utenfor er det folk prøver først.
 *   4. RULLING PÅ SELVE DIALOGEN. Uten en indre beholder mister man
 *      overscroll-containment, og en rulling i arket drar siden bak med seg.
 *
 * Mønstrene er hentet fra `PlaggDetailSheet`, appens modneste ark — den
 * eneste som allerede gjorde fokus-retur og bakdropp-lukking riktig. Den
 * blir stående som bunnark-referanse; denne er den sentrerte.
 *
 * `dismissable={false}` betyr at Escape og bakdropp ikke lukker. Det er en
 * tastaturfelle med mindre noe ANNET lukker arket, så komponenten krever da
 * at innholdet selv har en vei ut.
 */
import { useCallback, useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';

import './sheet.css';

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Overskrift. Binder <dialog> til sitt tilgjengelige navn. */
  title?: string;
  /** Fast bunnfelt utenfor rulleområdet — knapper hører hjemme her. */
  footer?: ReactNode;
  /**
   * Elementet fokus skal tilbake til ved lukking. Uten den lander fokus på
   * dokumentet, og en skjermleser mister stedet brukeren kom fra.
   */
  triggerRef?: RefObject<HTMLElement | null>;
  /** Escape og bakdropp lukker. Skru av kun når innholdet har en egen vei ut. */
  dismissable?: boolean;
  /** Tekst på lukkeknappen, for skjermleser. */
  closeLabel?: string;
};

export function Sheet({
  open,
  onClose,
  children,
  title,
  footer,
  triggerRef,
  dismissable = true,
  closeLabel = 'Lukk',
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  /* useId, ikke Math.random: id-en maa vaere stabil mellom render og
     server-markup, ellers peker aria-labelledby paa ingenting. */
  const tittelId = useId();

  /* showModal(), ALDRI `open`-attributtet: bare den førstnevnte gir
     top-layer, inert bakgrunn og native Escape. */
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    else if (!open && dlg.open) dlg.close();
  }, [open]);

  /* Fokus TILBAKE til det som åpnet arket. requestAnimationFrame fordi
     <dialog> selv flytter fokus i samme frame som den lukker. */
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return undefined;
    const ved = () => {
      onClose();
      requestAnimationFrame(() => triggerRef?.current?.focus?.());
    };
    dlg.addEventListener('close', ved);
    return () => dlg.removeEventListener('close', ved);
  }, [onClose, triggerRef]);

  const bakdropp = useCallback((e: React.MouseEvent<HTMLDialogElement>) => {
    if (!dismissable) return;
    const dlg = dialogRef.current;
    if (!dlg || e.target !== dlg) return; // treff på selve dialogen = utenfor kortet
    /* Rektangeltesten: <dialog> dekker hele skjermen, så et klikk «på»
       elementet kan likevel være inni kortet. */
    const r = dlg.getBoundingClientRect();
    const inni = e.clientX >= r.left && e.clientX <= r.right
      && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inni) dlg.close();
  }, [dismissable]);

  return (
    <dialog
      ref={dialogRef}
      className="dw-sheet"
      aria-labelledby={title ? tittelId : undefined}
      onClick={bakdropp}
      onCancel={(e) => {
        if (!dismissable) e.preventDefault();
      }}
    >
      <div className="dw-sheet-kropp">
        {(title || dismissable) && (
          <div className="dw-sheet-topp">
            {title ? <h2 className="dw-sheet-tittel" id={tittelId}>{title}</h2> : <span />}
            {dismissable && (
              <button
                type="button"
                className="dw-sheet-lukk"
                aria-label={closeLabel}
                /* INGEN autoFocus her, med vilje. showModal() flytter selv
                   fokus inn: til elementet med `autofocus` hvis innholdet
                   har ett, ellers til det første fokuserbare — som er denne
                   knappen. Setter primitiven autoFocus, står den FØRST i
                   dokumentet og stjeler fokus fra innholdets eget mål.
                   Materialarket vil f.eks. lande på den valgte radioen. */
                onClick={() => dialogRef.current?.close()}
              >
                ×
              </button>
            )}
          </div>
        )}
        <div className="dw-sheet-innhold">{children}</div>
        {footer ? <div className="dw-sheet-bunn">{footer}</div> : null}
      </div>
    </dialog>
  );
}
