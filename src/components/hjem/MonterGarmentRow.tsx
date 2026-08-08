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

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M14 5h5v5M19 5l-8 8" />
      <path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
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
  why?: string;
  factText?: string;
  factSourceLabel?: string;
  factSourceUrl?: string;
  onSwap: (event: MouseEvent<HTMLButtonElement>) => void;
  animationDelayMs: number | null;
}>;

export function MonterGarmentRow({
  position,
  total,
  label,
  roleLabel,
  imageSrc,
  why,
  factText,
  factSourceLabel,
  factSourceUrl,
  onSwap,
  animationDelayMs,
}: MonterGarmentRowProps) {
  const copy = resultCopyFor(i18next.resolvedLanguage);
  // Juster bruker fortsatt den kompakte, delte resultatlisten. Bare Hjem
  // sender den komplette kortkontrakten; dette holder den nye reisen lokalt
  // uten å endre en annen flyt.
  if (
    total === undefined
    || why === undefined
    || factText === undefined
    || factSourceLabel === undefined
    || factSourceUrl === undefined
  ) {
    return (
      <li className="hjm-row-item">
        <button
          type="button"
          className="hjm-row"
          onClick={onSwap}
          aria-label={copy.detailAria(label, roleLabel)}
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
          <span className="hjm-swap" aria-hidden="true">
            {copy.details}
            <InfoIcon />
          </span>
        </button>
      </li>
    );
  }

  return (
    <li
      className="hjm-journey-card"
      data-hjm-journey-card="true"
      style={animationDelayMs !== null ? { animationDelay: `${animationDelayMs}ms` } : undefined}
    >
      <article className="hjm-journey-card-inner">
        <div className="hjm-journey-image" aria-hidden="true">
          <img
            src={imageSrc}
            alt=""
            draggable={false}
            loading={position === 1 ? undefined : 'lazy'}
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

        <section className="hjm-journey-why" aria-label={copy.whyAria}>
          <h3>{copy.whyTitle}</h3>
          <p>{why}</p>
        </section>

        <section className="hjm-journey-fact" aria-label={copy.factAria}>
          <h3>{copy.factTitle}</h3>
          <p>{factText}</p>
          <a
            href={factSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={copy.sourceNewWindow(factSourceLabel)}
          >
            {factSourceLabel}
            <ExternalLinkIcon />
          </a>
        </section>

        <button
          type="button"
          className="hjm-journey-detail"
          onClick={onSwap}
          aria-label={copy.detailAria(label, roleLabel)}
        >
          {copy.details}
          <InfoIcon />
        </button>
      </article>
    </li>
  );
}
