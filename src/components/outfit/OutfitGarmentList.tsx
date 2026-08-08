import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { RegisterOutfitRow } from '../../lib/outfit/outfit-transition-contract.js';
import type { OutfitItemId, OutfitTruthSnapshotV1 } from '../../lib/outfit/outfit-truth.js';
import { deepFlowCopyFor, localizedGarmentDisplayName } from '../../screens/deep-flow-copy.js';
import { GarmentThumbnail } from './GarmentThumbnail.js';

type Props = Readonly<{
  snapshot: OutfitTruthSnapshotV1;
  registerOutfitRow?: RegisterOutfitRow;
  onActivate: (id: OutfitItemId, trigger: HTMLButtonElement) => void;
  hasAlternative: (id: OutfitItemId) => boolean;
}>;

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
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const copy = deepFlowCopyFor(language);
  const ref = useRef<HTMLButtonElement | null>(null);
  const { registerOutfitRow } = props;
  const label = localizedGarmentDisplayName(garment.label, language);
  const hasAlternative = props.hasAlternative(garment.itemId);

  useEffect(() => {
    registerOutfitRow?.(garment.itemId, ref.current);
    return () => registerOutfitRow?.(garment.itemId, null);
  }, [garment.itemId, registerOutfitRow]);

  return (
    <li className="outfit-list__row">
      <button
        ref={ref}
        type="button"
        className="outfit-row"
        data-outfit-row={garment.itemId}
        data-has-alternative={hasAlternative ? 'true' : 'false'}
        aria-label={hasAlternative ? copy.outfit.swapGarment(label) : copy.outfit.noAlternatives(label)}
        onClick={(event) => props.onActivate(garment.itemId, event.currentTarget)}
      >
        <span className="outfit-row__ordinal" aria-hidden="true">{garment.order}</span>
        <span className="outfit-row__thumbnail" aria-hidden="true">
          <GarmentThumbnail label={garment.label} />
        </span>
        <span className="outfit-row__copy">
          <span className="outfit-row__label">{label}</span>
          <span className="outfit-row__detail">{copy.outfit.categories[garment.category]}</span>
        </span>
        {hasAlternative && (
          <span className="outfit-row__action" aria-hidden="true">
            <span>{copy.outfit.swap}</span>
            <SwapIcon />
          </span>
        )}
      </button>
    </li>
  );
}

export function OutfitGarmentList(props: Props) {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const copy = deepFlowCopyFor(language);
  const garmentCount = props.snapshot.garments.length;
  return (
    <section className="outfit-list" aria-labelledby="outfit-garments-title">
      <header className="outfit-list__header">
        <div>
          <p className="outfit-list__eyebrow">{copy.outfit.dressingOrder}</p>
          <h2 id="outfit-garments-title">{copy.outfit.insideToOutside}</h2>
        </div>
        <p className="outfit-list__count">{copy.common.garments(garmentCount)}</p>
      </header>

      <ol className="outfit-list__rows">
        {props.snapshot.garments.map((garment) => (
          <Row key={garment.itemId} garment={garment} props={props} />
        ))}
      </ol>

      {props.snapshot.equipment.length > 0 && (
        <section className="outfit-equipment" aria-labelledby="outfit-equipment-title">
          <h3 id="outfit-equipment-title">{copy.outfit.bring}</h3>
          <ul>
            {props.snapshot.equipment.map((item) => (
              <li key={item.itemId}>{localizedGarmentDisplayName(item.label, language)}</li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
