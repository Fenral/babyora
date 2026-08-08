import i18next from 'i18next';
import type { MouseEvent } from 'react';
import { GENERIC_GARMENT_SVG } from '../../data/garment-illustrations.js';
import { resultCopyFor } from './result-localization.js';
import './hjem-monter.css';

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8.2v.1" />
    </svg>
  );
}

function DetailChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export type MonterGarmentRowProps = Readonly<{
  position: number;
  /** Når satt sammen med kortinnholdet under, rendres Hjem-reisens kort. */
  total?: number;
  label: string;
  roleLabel: string;
  imageSrc: string;
  fact?: string | null;
  hasAlternatives?: boolean;
  loopBand?: 'leading' | 'canonical' | 'trailing';
  compactDestinationLabel?: string;
  onSwap: (event: MouseEvent<HTMLButtonElement>) => void;
  animationDelayMs: number | null;
}>;

export function MonterGarmentRow({
  position,
  total,
  label,
  roleLabel,
  imageSrc,
  fact = null,
  hasAlternatives = false,
  loopBand = 'canonical',
  compactDestinationLabel,
  onSwap,
  animationDelayMs,
}: MonterGarmentRowProps) {
  const copy = resultCopyFor(i18next.resolvedLanguage);
  // Juster bruker fortsatt den kompakte, delte resultatlisten. Bare Hjem
  // sender den komplette kortkontrakten; dette holder den nye reisen lokalt
  // uten å endre en annen flyt.
  if (total === undefined) {
    const navigatesInCarousel = compactDestinationLabel !== undefined;
    return (
      <li className="hjm-row-item">
        <button
          type="button"
          className="hjm-row"
          onClick={onSwap}
          aria-label={compactDestinationLabel ?? copy.detailAria(label, roleLabel)}
          style={animationDelayMs !== null ? { animationDelay: `${animationDelayMs}ms` } : undefined}
        >
          <span className="hjm-num" aria-hidden="true">{position}</span>
          <span className="hjm-thumb" aria-hidden="true">
            <img
              src={imageSrc}
              alt=""
              draggable={false}
              onError={(event) => {
                if (event.currentTarget.src !== GENERIC_GARMENT_SVG) {
                  event.currentTarget.src = GENERIC_GARMENT_SVG;
                }
              }}
            />
          </span>
          <span className="hjm-row-text">
            <span className="hjm-g-name">{label}</span>
            <span className="hjm-g-role">{roleLabel}</span>
          </span>
          <span
            className={navigatesInCarousel ? 'hjm-swap hjm-row-next' : 'hjm-swap'}
            aria-hidden="true"
          >
            {navigatesInCarousel ? (
              <DetailChevronIcon />
            ) : (
              <>
                <span className="hjm-swap-label">{copy.details}</span>
                <InfoIcon />
              </>
            )}
          </span>
        </button>
      </li>
    );
  }

  return (
    <li
      className="hjm-journey-card"
      data-hjm-journey-card={loopBand === 'canonical' ? 'true' : undefined}
      data-loop-band={loopBand}
      data-loop-clone={loopBand === 'canonical' ? undefined : 'true'}
      aria-hidden={loopBand === 'canonical' ? undefined : true}
      inert={loopBand === 'canonical' ? undefined : true}
      style={animationDelayMs !== null ? { animationDelay: `${animationDelayMs}ms` } : undefined}
    >
      <article className="hjm-journey-card-inner" data-hjm-card-focus tabIndex={-1}>
        <div className="hjm-journey-image" aria-hidden="true">
          <img
            src={imageSrc}
            alt=""
            draggable={false}
            loading={loopBand === 'canonical' && position === 1 ? undefined : 'lazy'}
            onError={(event) => {
              if (event.currentTarget.src !== GENERIC_GARMENT_SVG) {
                event.currentTarget.src = GENERIC_GARMENT_SVG;
              }
            }}
          />
        </div>

        <p className="hjm-journey-order">
          <span>{copy.order(position, total)}</span>
          <i aria-hidden="true" />
          <span>{roleLabel}</span>
        </p>
        <h2 className="hjm-journey-name">{label}</h2>

        <div className="hjm-journey-bottom">
          {fact ? (
            <section className="hjm-journey-fact">
              <h3>{copy.goodToKnow}</h3>
              <p>{fact}</p>
            </section>
          ) : null}

          {hasAlternatives ? (
            <button
              type="button"
              className="hjm-journey-detail"
              onClick={onSwap}
              aria-label={copy.alternativesAria(label)}
            >
              {copy.alternatives}
              <DetailChevronIcon />
            </button>
          ) : null}
        </div>
      </article>
    </li>
  );
}
