import type { ReactNode } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import {
  GENERIC_GARMENT_SVG,
  garmentIdFor,
  garmentPngSafe,
} from '../../data/garment-illustrations.js';
import { displayNameForDbString } from '../../data/garment-display-names.js';
import { useHapticSystem } from '../../lib/haptics/system.js';
import type {
  PlanningChangeKind,
  PlanningTransition,
} from '../../lib/planning/change-events.js';
import {
  decidePlanningInteraction,
  dispatchPlanningInteraction,
} from '../../lib/planning/planning-interaction.js';
import { htmlLanguageFor } from '../../i18n/language-policy.js';
import './PlanChangeRail.css';

export type PlanningRailEvent = Readonly<{
  id: string;
  atIso: string;
  kind: PlanningChangeKind;
  addedGarments: readonly string[];
  removedGarments: readonly string[];
  cause: string;
  transition?: PlanningTransition;
}>;

export type PlanChangeRailRow =
  | Readonly<{
    id: string;
    type: 'unchanged';
    copy: string;
  }>
  | Readonly<{
    id: string;
    type: 'change';
    eventId: string;
    atIso: string;
    hasOutfit: boolean;
    event: PlanningRailEvent;
  }>;

type Props = {
  rows: readonly PlanChangeRailRow[];
  selectedEventId: string | null;
  onSelect: (eventId: string | null) => void;
  onOpenOutfit: (eventId: string, trigger: HTMLElement) => void;
};

const MARKER_SHAPE: Readonly<Record<PlanningChangeKind, string>> = {
  add: 'circle-plus',
  remove: 'circle-minus',
  swap: 'diamond-swap',
  rain: 'droplet-shield',
  location: 'pin',
  prep: 'bag-check',
};

function KindIcon({ kind }: { kind: PlanningChangeKind }): ReactNode {
  const iconProps = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (kind) {
    case 'add':
      return <svg {...iconProps}><path d="M12 5v14M5 12h14" /></svg>;
    case 'remove':
      return <svg {...iconProps}><path d="M5 12h14" /></svg>;
    case 'swap':
      return <svg {...iconProps}><path d="M4 8h13l-3-3M20 16H7l3 3" /></svg>;
    case 'rain':
      return <svg {...iconProps}><path d="M12 3c3 4 5 6.5 5 9a5 5 0 0 1-10 0c0-2.5 2-5 5-9Z" /><path d="m9.5 12 1.6 1.6 3.4-3.6" /></svg>;
    case 'location':
      return <svg {...iconProps}><path d="M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10Z" /><circle cx="12" cy="11" r="2" /></svg>;
    case 'prep':
      return <svg {...iconProps}><path d="M7 8h10l2 12H5L7 8Z" /><path d="M9 8a3 3 0 0 1 6 0m-5 6 1.5 1.5L15 12" /></svg>;
  }
}

function eventGarments(event: PlanningRailEvent): readonly string[] {
  const transitionGarments = event.transition?.kind === 'rain'
    || event.transition?.kind === 'prep'
    ? event.transition.garments
    : [];
  return [...new Set([
    ...event.removedGarments,
    ...event.addedGarments,
    ...transitionGarments,
  ])];
}

function timeLabel(atIso: string, locale: string): string {
  const instant = new Date(atIso);
  if (Number.isNaN(instant.getTime())) return atIso;
  return instant.toLocaleTimeString(locale, {
    timeZone: 'Europe/Oslo',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function localizedGarmentList(
  garments: readonly string[],
  language: string,
  locale: string,
): string {
  return new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(
    garments.map((garment) => displayNameForDbString(garment, language)),
  );
}

function diffAction(
  event: PlanningRailEvent,
  t: TFunction,
  language: string,
  locale: string,
): string {
  const added = localizedGarmentList(event.addedGarments, language, locale);
  const removed = localizedGarmentList(event.removedGarments, language, locale);
  if (added && removed) return t('plan.rail.swap', { removed, added });
  if (added) return t('plan.rail.add', { garments: added });
  if (removed) return t('plan.rail.remove', { garments: removed });
  return t('plan.change');
}

function localizedAction(
  event: PlanningRailEvent,
  t: TFunction,
  language: string,
  locale: string,
): string {
  if (event.kind === 'rain' && event.transition?.kind === 'rain') {
    const garments = localizedGarmentList(event.transition.garments, language, locale);
    return t(event.transition.action === 'bring' ? 'plan.rail.bring' : 'plan.rail.wear', {
      garments,
    });
  }
  if (event.kind === 'prep' && event.transition?.kind === 'prep') {
    return t('plan.rail.prepare', {
      garments: localizedGarmentList(event.transition.garments, language, locale),
    });
  }
  if (event.kind === 'location' && event.transition?.kind === 'location') {
    return t('plan.rail.location', {
      place: event.transition.placeLabel,
      action: diffAction(event, t, language, locale),
    });
  }
  return diffAction(event, t, language, locale);
}

function GarmentPreview({ garment, language }: { garment: string; language: string }) {
  const source = garmentPngSafe(garmentIdFor(garment));
  return (
    <figure className="plan-change-rail__preview">
      <img
        alt=""
        src={source}
        onError={(event) => {
          if (event.currentTarget.src !== GENERIC_GARMENT_SVG) {
            event.currentTarget.src = GENERIC_GARMENT_SVG;
          }
        }}
      />
      {/* T1A: synlig navn via visningsnavn-kilden (rå streng forblir
          bilde-oppslagsnøkkel over). */}
      <figcaption>{displayNameForDbString(garment, language)}</figcaption>
    </figure>
  );
}

function ChangeRow({
  row,
  expanded,
  onToggle,
  onOpenOutfit,
}: {
  row: Extract<PlanChangeRailRow, { type: 'change' }>;
  expanded: boolean;
  onToggle: (eventId: string) => void;
  onOpenOutfit: Props['onOpenOutfit'];
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const locale = htmlLanguageFor(language);
  const detailId = `planning-rail-detail-${row.eventId}`;
  const action = localizedAction(row.event, t, language, locale);
  const garments = eventGarments(row.event);

  return (
    <li className="plan-change-rail__change" data-kind={row.event.kind}>
      <button
        type="button"
        className="plan-change-rail__disclosure"
        aria-expanded={expanded}
        aria-controls={detailId}
        onClick={() => onToggle(row.eventId)}
      >
        <span
          className="plan-change-rail__marker"
          data-kind={row.event.kind}
          data-marker-shape={MARKER_SHAPE[row.event.kind]}
          aria-hidden="true"
        >
          <KindIcon kind={row.event.kind} />
        </span>
        <time dateTime={row.atIso}>{timeLabel(row.atIso, locale)}</time>
        <span className="plan-change-rail__summary">{action}</span>
        {/* Samme bytte som ForecastDisclosure: rettes bare den ene, får
            Plan-skjermen to ulike utvid-indikatorer. */}
        <span className="plan-change-rail__chevron" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            focusable="false"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>
      <div
        id={detailId}
        className={`plan-change-rail__detail${expanded ? ' is-expanded' : ''}`}
        aria-hidden={!expanded}
      >
        <div className="plan-change-rail__detail-inner">
          <p className="plan-change-rail__action">{action}</p>
          <p className="plan-change-rail__cause">{row.event.cause}</p>
          {garments.length > 0 && (
            <div className="plan-change-rail__previews" aria-label={t('plan.rail.garments')}>
              {garments.slice(0, 3).map((garment) => (
                <GarmentPreview key={garment} garment={garment} language={language} />
              ))}
            </div>
          )}
          {row.hasOutfit && (
            <button
              type="button"
              className="plan-change-rail__outfit"
              tabIndex={expanded ? 0 : -1}
              disabled={!expanded}
              onClick={(event) => onOpenOutfit(row.eventId, event.currentTarget)}
            >
              {t('plan.rail.openOutfit')}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

export function PlanChangeRail({
  rows,
  selectedEventId,
  onSelect,
  onOpenOutfit,
}: Props) {
  const { fire } = useHapticSystem();
  const { t } = useTranslation();

  const onToggle = (eventId: string) => {
    dispatchPlanningInteraction(
      decidePlanningInteraction({
        type: 'rail-toggle',
        selectedEventId,
        eventId,
      }),
      {
        onSelect,
        onCue: (cue) => {
          void fire(cue);
        },
      },
    );
  };

  return (
    <ol className="plan-change-rail" aria-label={t('plan.rail.label')}>
      {rows.map((row) => (
        row.type === 'unchanged'
          ? (
            <li className="plan-change-rail__unchanged" key={row.id}>
              <span className="plan-change-rail__unchanged-dot" aria-hidden="true" />
              {row.copy}
            </li>
          )
          : (
            <ChangeRow
              key={row.id}
              row={row}
              expanded={selectedEventId === row.eventId}
              onToggle={onToggle}
              onOpenOutfit={onOpenOutfit}
            />
          )
      ))}
    </ol>
  );
}
