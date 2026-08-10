import i18next from 'i18next';
import { useRef, type MouseEvent, type RefObject } from 'react';
import { hjemCopyFor, type HjemActivity } from './hjem-copy.js';
import { resultLanguage, type ResultLanguage } from './result-localization.js';
import { useOriginDialogTransition } from './useOriginDialogTransition.js';
import './HomeSituationSheet.css';
import './origin-dialog-transition.css';

type SituationCopy = Readonly<{
  title: string;
  intro: string;
  close: string;
  activityGroup: string;
  carSeat: string;
  carSeatDescription: string;
  activityDescription: Readonly<Record<HjemActivity, string>>;
}>;

const SITUATION_COPY: Readonly<Record<ResultLanguage, SituationCopy>> = {
  no: {
    title: 'Hvor skal dere?',
    intro: 'Antrekket endrer seg med situasjonen.',
    close: 'Lukk situasjonsvalg',
    activityGroup: 'Situasjon',
    carSeat: 'Skal rett i bilstolen',
    carSeatDescription: 'Fjerner tykke vinterdresser — HB-9',
    activityDescription: {
      utelek: 'Barnet beveger seg selv',
      vogn: 'Ligger stille, trenger mer',
      baeresele: 'Kroppen din varmer også',
    },
  },
  en: {
    title: 'Where are you going?',
    intro: 'The outfit changes with the situation.',
    close: 'Close situation picker',
    activityGroup: 'Situation',
    carSeat: 'Going straight into the car seat',
    carSeatDescription: 'Removes bulky snowsuits — HB-9',
    activityDescription: {
      utelek: 'Your child moves on their own',
      vogn: 'Lying still, needs more warmth',
      baeresele: 'Your body provides warmth too',
    },
  },
  sv: {
    title: 'Vart ska ni?',
    intro: 'Klädseln ändras med situationen.',
    close: 'Stäng situationsval',
    activityGroup: 'Situation',
    carSeat: 'Ska direkt i bilstolen',
    carSeatDescription: 'Tar bort tjocka vinteroveraller — HB-9',
    activityDescription: {
      utelek: 'Barnet rör sig själv',
      vogn: 'Ligger stilla och behöver mer värme',
      baeresele: 'Din kropp värmer också',
    },
  },
  da: {
    title: 'Hvor skal I hen?',
    intro: 'Påklædningen ændrer sig med situationen.',
    close: 'Luk situationsvalg',
    activityGroup: 'Situation',
    carSeat: 'Skal direkte i autostolen',
    carSeatDescription: 'Fjerner tykke flyverdragter — HB-9',
    activityDescription: {
      utelek: 'Barnet bevæger sig selv',
      vogn: 'Ligger stille og har brug for mere varme',
      baeresele: 'Din krop varmer også',
    },
  },
};

export type HomeSituationSelection = Readonly<{
  activity: HjemActivity;
  carSeat: boolean;
}>;

export type HomeSituationSheetProps = Readonly<{
  isOpen: boolean;
  activity: HjemActivity;
  carSeat: boolean;
  language?: string | null;
  reducedMotion: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  onApply: (selection: HomeSituationSelection) => void;
}>;

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.1} strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function SituationIcon({ activity }: Readonly<{ activity: HjemActivity }>) {
  if (activity === 'vogn') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M5 6h7l3 9H7L5 6Z" /><path d="M4 6h3M15 15h3" /><circle cx="8" cy="18" r="1.5" /><circle cx="16" cy="18" r="1.5" />
      </svg>
    );
  }
  if (activity === 'baeresele') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <circle cx="12" cy="6" r="2.5" /><path d="M8 21v-7a4 4 0 0 1 8 0v7M8 12 5 9m11 3 3-3M9 17h6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="3.5" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3Z" /><path d="M12 8v4m0 3h.01" />
    </svg>
  );
}

export function HomeSituationSheet({
  isOpen,
  activity,
  carSeat,
  language,
  reducedMotion,
  triggerRef,
  onClose,
  onApply,
}: HomeSituationSheetProps) {
  const pendingSelectionRef = useRef<HomeSituationSelection | null>(null);
  const resolvedLanguage = resultLanguage(language ?? i18next.resolvedLanguage);
  const copy = SITUATION_COPY[resolvedLanguage];
  const hjemCopy = hjemCopyFor(language);
  const { dialogRef, requestClose, handleCancel } = useOriginDialogTransition({
    open: isOpen,
    reducedMotion,
    triggerRef,
    onAfterClose: () => {
      const pendingSelection = pendingSelectionRef.current;
      pendingSelectionRef.current = null;
      if (pendingSelection !== null) onApply(pendingSelection);
      onClose();
    },
  });

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (dialog === null || event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    const inside = event.clientX >= bounds.left
      && event.clientX <= bounds.right
      && event.clientY >= bounds.top
      && event.clientY <= bounds.bottom;
    if (!inside) requestClose();
  };

  const apply = (next: HomeSituationSelection) => {
    if (next.activity === activity && next.carSeat === carSeat) {
      requestClose();
      return;
    }
    pendingSelectionRef.current = next;
    requestClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="home-origin-sheet hcs-sheet"
      aria-labelledby="hcs-sheet-title"
      onClick={handleBackdropClick}
      onCancel={handleCancel}
      data-home-situation-sheet
    >
      <div className="home-origin-sheet__content">
        <div className="hcs-sheet__handle" aria-hidden="true" />
        <header className="hcs-sheet__header">
          <div>
            <h2 id="hcs-sheet-title">{copy.title}</h2>
            <p>{copy.intro}</p>
          </div>
          <button type="button" className="hcs-sheet__close ba-press" aria-label={copy.close} onClick={requestClose}>
            <CloseIcon />
          </button>
        </header>

        <div className="hcs-sheet__body">
          <div className="hcs-sheet__choices" role="radiogroup" aria-label={copy.activityGroup}>
            {(Object.keys(hjemCopy.activity) as HjemActivity[]).map((value) => {
              const selected = value === activity;
              return (
                <button
                  key={value}
                  type="button"
                  className="hcs-choice ba-press"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => apply({ activity: value, carSeat })}
                >
                  <span className="hcs-choice__icon" aria-hidden="true"><SituationIcon activity={value} /></span>
                  <span className="hcs-choice__copy">
                    <strong>{hjemCopy.activity[value].toggle}</strong>
                    <span>{copy.activityDescription[value]}</span>
                  </span>
                  <span className="hcs-choice__check" aria-hidden="true">{selected ? '✓' : ''}</span>
                </button>
              );
            })}
          </div>

          <div className="hcs-sheet__divider" aria-hidden="true" />

          <button
            type="button"
            className="hcs-car-seat ba-press"
            role="switch"
            aria-checked={carSeat}
            onClick={() => apply({ activity, carSeat: !carSeat })}
          >
            <span className="hcs-car-seat__icon" aria-hidden="true"><ShieldIcon /></span>
            <span className="hcs-car-seat__copy">
              <strong>{copy.carSeat}</strong>
              <span>{copy.carSeatDescription}</span>
            </span>
            <span className="hcs-switch" aria-hidden="true"><i /></span>
          </button>
        </div>
      </div>
    </dialog>
  );
}
