import { useEffect, useRef } from 'react';
import { displayNameForDbString } from '../../data/garment-display-names.js';
import type { RegisterOutfitRow } from '../../lib/outfit/outfit-transition-contract.js';
import type { OutfitItemId, OutfitTruthSnapshotV1 } from '../../lib/outfit/outfit-truth.js';
import { GarmentThumbnail } from './GarmentThumbnail.js';

type Props = Readonly<{
  snapshot: OutfitTruthSnapshotV1;
  registerOutfitRow?: RegisterOutfitRow;
  onAlternative: (id: OutfitItemId, trigger: HTMLButtonElement) => void;
  hasAlternative: (id: OutfitItemId) => boolean;
}>;

const CATEGORY_LABEL: Readonly<Record<OutfitTruthSnapshotV1['garments'][number]['category'], string>> = {
  innerst: 'Innerst',
  mellomlag: 'Mellomlag',
  yttertoy: 'Ytterst',
  ekstra: 'Tilbehør',
};

function SwapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M7 7h11l-3-3" />
      <path d="M17 17H6l3 3" />
    </svg>
  );
}

function Row({ garment, props }: {
  garment: OutfitTruthSnapshotV1['garments'][number];
  props: Props;
}) {
  const ref = useRef<HTMLLIElement | null>(null);
  const { registerOutfitRow } = props;
  const label = displayNameForDbString(garment.label);
  const hasAlternative = props.hasAlternative(garment.itemId);

  useEffect(() => {
    registerOutfitRow?.(garment.itemId, ref.current);
    return () => registerOutfitRow?.(garment.itemId, null);
  }, [garment.itemId, registerOutfitRow]);

  return (
    <li
      ref={ref}
      className="outfit-row"
      data-outfit-row={garment.itemId}
      data-has-alternative={hasAlternative ? 'true' : 'false'}
    >
      <span className="outfit-row__ordinal" aria-hidden="true">{garment.order}</span>
      <span className="outfit-row__thumbnail" aria-hidden="true">
        <GarmentThumbnail label={garment.label} />
      </span>
      <span className="outfit-row__copy">
        <span className="outfit-row__label">{label}</span>
        <span className="outfit-row__detail">{CATEGORY_LABEL[garment.category]}</span>
      </span>
      {hasAlternative && (
        <button
          type="button"
          className="outfit-row__action"
          aria-label={`Bytt ${label}`}
          onClick={(event) => props.onAlternative(garment.itemId, event.currentTarget)}
        >
          <span>Bytt</span>
          <SwapIcon />
        </button>
      )}
    </li>
  );
}

export function OutfitGarmentList(props: Props) {
  const garmentCount = props.snapshot.garments.length;
  return (
    <section className="outfit-list" aria-labelledby="outfit-garments-title">
      <header className="outfit-list__header">
        <div>
          <p className="outfit-list__eyebrow">Påkledningsrekkefølge</p>
          <h2 id="outfit-garments-title">Innerst til ytterst</h2>
        </div>
        <p className="outfit-list__count">{garmentCount} plagg</p>
      </header>

      <ol className="outfit-list__rows">
        {props.snapshot.garments.map((garment) => (
          <Row key={garment.itemId} garment={garment} props={props} />
        ))}
      </ol>

      {props.snapshot.equipment.length > 0 && (
        <section className="outfit-equipment" aria-labelledby="outfit-equipment-title">
          <h3 id="outfit-equipment-title">Ta med</h3>
          <ul>
            {props.snapshot.equipment.map((item) => (
              <li key={item.itemId}>{displayNameForDbString(item.label)}</li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
