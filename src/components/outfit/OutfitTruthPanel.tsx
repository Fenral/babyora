import { useMemo } from 'react';
import { WARM_COLD_RECOVERY_COPY } from '../../lib/copy/warm-cold-recovery.js';
import type { OutfitBundleProducerResult } from '../../lib/outfit/outfit-bundle-producer.js';
import type { RegisterOutfitRow } from '../../lib/outfit/outfit-transition-contract.js';
import {
  isOutfitTruthSnapshot,
  type OutfitTruthSnapshotV1,
} from '../../lib/outfit/outfit-truth.js';
import { tempAxisFor } from '../../lib/temp-axis.js';
import {
  useOutfitSelectionStore,
  type OutfitSelectionSession,
} from '../../state/outfit-selection-store.js';
import { OutfitExperience } from './OutfitExperience.js';
import { VerifiedAvatarComposite } from './VerifiedAvatarComposite.js';

export type OutfitTransitionVisualState = 'settled' | 'landing';

export type OutfitTruthPanelProps = Readonly<{
  outfitBundle: OutfitBundleProducerResult;
  registerOutfitRow?: RegisterOutfitRow;
  transitionVisualState?: OutfitTransitionVisualState;
  onOpenWarmColdGuide: () => void;
}>;

/**
 * Read-only session projection. The interactive experience remains the only
 * owner of store writes; an unfamiliar or inconsistent session is neutral.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function resolveSelectedAvatarSnapshot(
  base: OutfitTruthSnapshotV1,
  options: Extract<OutfitBundleProducerResult, { kind: 'supported' }>['options'],
  session: OutfitSelectionSession,
): OutfitTruthSnapshotV1 | null {
  if (!isOutfitTruthSnapshot(base)) return null;
  if (
    session.kind !== 'open'
    || session.base !== base
    || session.options !== options
  ) {
    return base;
  }
  if (session.selectedOptionId === null) {
    return session.current === base ? base : null;
  }
  const matching = options.filter(
    (option) => option.optionId === session.selectedOptionId,
  );
  return matching.length === 1 && matching[0]!.outcome === session.current
    ? session.current
    : null;
}

function RecoveryGuide({ onOpenWarmColdGuide }: Readonly<{
  onOpenWarmColdGuide: () => void;
}>) {
  return (
    <section className="outfit-recovery-guide" aria-labelledby="outfit-recovery-title">
      <h2 id="outfit-recovery-title">{WARM_COLD_RECOVERY_COPY.title}</h2>
      <p>{WARM_COLD_RECOVERY_COPY.instruction}</p>
      <button type="button" onClick={onOpenWarmColdGuide}>
        Se varm eller kald-guiden
      </button>
    </section>
  );
}

function UnsupportedCardinalityPanel({
  outfitBundle,
  transitionVisualState,
}: Readonly<{
  outfitBundle: Extract<OutfitBundleProducerResult, { kind: 'unsupported-cardinality' }>;
  transitionVisualState: OutfitTransitionVisualState;
}>) {
  const temp = tempAxisFor(
    outfitBundle.weather.feelsLikeC,
    outfitBundle.weather.tempC,
  );
  const { orderedGarments, equipment } = outfitBundle.truth;
  return (
    <section
      className="outfit-truth-panel ba-temp-root"
      data-temp={temp}
      data-transition-visual-state={transitionVisualState}
      aria-label="Antrekksliste"
    >
      <section className="outfit-list" aria-label="Antrekk">
        <h2>Ta på innerst først</h2>
        <ol>
          {orderedGarments.map((garment) => (
            <li key={garment.itemId}>
              <span>{garment.order}.</span> {garment.label}
            </li>
          ))}
        </ol>
        {equipment.length > 0 && (
          <section aria-label="Utstyr">
            <h3>Utstyr</h3>
            <ul>
              {equipment.map((item) => <li key={item.itemId}>{item.label}</li>)}
            </ul>
          </section>
        )}
      </section>
    </section>
  );
}

function SupportedPanel({
  outfitBundle,
  registerOutfitRow,
  transitionVisualState,
  onOpenWarmColdGuide,
}: Readonly<{
  outfitBundle: Extract<OutfitBundleProducerResult, { kind: 'supported' }>;
  registerOutfitRow?: RegisterOutfitRow;
  transitionVisualState: OutfitTransitionVisualState;
  onOpenWarmColdGuide: () => void;
}>) {
  const session = useOutfitSelectionStore((state) => state.session);
  const { base, options } = outfitBundle;
  const avatarSnapshot = useMemo(
    () => resolveSelectedAvatarSnapshot(base, options, session),
    [base, options, session],
  );
  const temp = tempAxisFor(
    outfitBundle.weather.feelsLikeC,
    outfitBundle.weather.tempC,
  );

  if (!isOutfitTruthSnapshot(base)) {
    return <UnavailablePanel transitionVisualState={transitionVisualState} />;
  }

  return (
    <section
      className="outfit-truth-panel ba-temp-root"
      data-temp={temp}
      data-transition-visual-state={transitionVisualState}
    >
      {avatarSnapshot === null ? (
        <VerifiedAvatarComposite stateKey={{ pose: base.avatar.pose }} outfitSummary="" decorative />
      ) : (
        <VerifiedAvatarComposite snapshot={avatarSnapshot} avatarTruth={avatarSnapshot.avatar} decorative />
      )}
      <OutfitExperience
        snapshot={base}
        options={options}
        temp={temp}
        registerOutfitRow={registerOutfitRow}
      />
      <RecoveryGuide onOpenWarmColdGuide={onOpenWarmColdGuide} />
    </section>
  );
}

function UnavailablePanel({ transitionVisualState }: Readonly<{
  transitionVisualState: OutfitTransitionVisualState;
}>) {
  return (
    <section
      className="outfit-truth-panel ba-temp-root"
      data-temp="mild"
      data-transition-visual-state={transitionVisualState}
      aria-live="polite"
    >
      <p>Antrekksanbefalingen er ikke tilgjengelig.</p>
    </section>
  );
}

export function OutfitTruthPanel({
  outfitBundle,
  registerOutfitRow,
  transitionVisualState = 'settled',
  onOpenWarmColdGuide,
}: OutfitTruthPanelProps) {
  switch (outfitBundle.kind) {
    case 'supported':
      return (
        <SupportedPanel
          outfitBundle={outfitBundle}
          registerOutfitRow={registerOutfitRow}
          transitionVisualState={transitionVisualState}
          onOpenWarmColdGuide={onOpenWarmColdGuide}
        />
      );
    case 'unsupported-cardinality':
      return (
        <UnsupportedCardinalityPanel
          outfitBundle={outfitBundle}
          transitionVisualState={transitionVisualState}
        />
      );
    case 'unavailable':
    default:
      return <UnavailablePanel transitionVisualState={transitionVisualState} />;
  }
}
