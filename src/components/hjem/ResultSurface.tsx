/**
 * Hjem-resultatet er én nummerert liste i påkledningsrekkefølge.
 *
 * Hele raden er målet. Et trykk åpner et rolig bunnark med plaggfakta og,
 * når motoren har godkjente alternativer for akkurat denne plassen i
 * antrekket, progressiv sammenligning. Ingen nestet horisontal gest.
 */
import i18next from 'i18next';
import { type MouseEvent, useRef, useState } from 'react';
import { garmentFactFor } from '../../data/garment-facts.js';
import { displayNameForDbString } from '../../data/garment-display-names.js';
import { impactSoft } from '../../lib/haptics.js';
import { getGarmentImage } from '../../lib/monter-assets.js';
import type { HomeGarmentAlternativeGroup } from '../../lib/outfit/home-garment-alternatives.js';
import { GarmentFactSheet, type GarmentFactSheetItem } from './GarmentFactSheet.js';
import { MonterGarmentRow } from './MonterGarmentRow.js';
import { resultCopyFor } from './result-localization.js';
import type { ResultRow } from './result-rows.js';
import './hjem-monter.css';

const ROW_STAGGER_MS = 80;
const ROW_STAGGER_START_MS = 50;

export type ResultSurfaceProps = Readonly<{
  rows: readonly ResultRow[];
  headingId: string;
  isFresh: boolean;
  reducedMotion: boolean;
  alternativeGroups?: readonly HomeGarmentAlternativeGroup[];
}>;

export function ResultSurface({
  rows,
  headingId,
  isFresh,
  reducedMotion,
  alternativeGroups = [],
}: ResultSurfaceProps) {
  const copy = resultCopyFor(i18next.resolvedLanguage);
  const animateRows = isFresh && !reducedMotion;
  const detailTriggerRef = useRef<HTMLElement | null>(null);
  const [openRowKey, setOpenRowKey] = useState<string | null>(null);

  const presentedRows = rows.map((row) => {
    const alternativeGroup = row.outfitItemId === null
      ? null
      : alternativeGroups.find((group) => group.source.itemId === row.outfitItemId) ?? null;
    return {
      row,
      displayLabel: displayNameForDbString(row.label, i18next.resolvedLanguage),
      localizedRole: copy.role(row.roleLabel),
      imageSrc: getGarmentImage(row.garmentId),
      fact: alternativeGroup?.source.fact ?? (row.garmentId === null
        ? null
        : garmentFactFor(row.garmentId, i18next.resolvedLanguage)),
      alternativeGroup,
    };
  });

  const openRow = presentedRows.find(({ row }) => row.key === openRowKey) ?? null;
  const openItem: GarmentFactSheetItem | null = openRow === null
    ? null
    : {
      label: openRow.displayLabel,
      roleLabel: openRow.localizedRole,
      position: openRow.row.position,
      total: rows.length,
      imageSrc: openRow.imageSrc,
      fact: openRow.fact,
      alternativeGroup: openRow.alternativeGroup,
    };

  const handleOpenDetail = (rowKey: string, event: MouseEvent<HTMLButtonElement>) => {
    void impactSoft();
    detailTriggerRef.current = event.currentTarget;
    setOpenRowKey(rowKey);
  };

  return (
    <section
      className="hjm-result"
      data-scrollable="true"
      aria-labelledby={headingId}
    >
      {rows.length === 0 ? (
        <p className="hjm-journey-empty" role="status">{copy.empty}</p>
      ) : (
        <>
          <ol
            className="hjm-rows hjm-result-list"
            aria-label={copy.progressLabel}
            data-fresh={animateRows ? 'true' : 'false'}
            data-garment-count={rows.length}
          >
            {presentedRows.map(({ row, displayLabel, localizedRole, imageSrc }, index) => (
              <MonterGarmentRow
                key={row.key}
                position={row.position}
                label={displayLabel}
                roleLabel={localizedRole}
                imageSrc={imageSrc}
                compactDestinationLabel={copy.openGarment(displayLabel)}
                onSwap={(event) => handleOpenDetail(row.key, event)}
                animationDelayMs={animateRows
                  ? ROW_STAGGER_START_MS + index * ROW_STAGGER_MS
                  : null}
              />
            ))}
          </ol>

          <GarmentFactSheet
            item={openItem}
            isOpen={openItem !== null}
            onClose={() => setOpenRowKey(null)}
            triggerRef={detailTriggerRef}
          />
        </>
      )}
    </section>
  );
}
