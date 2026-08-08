import { useTranslation } from 'react-i18next';
import {
  isOutfitBundleProducerResult,
  type OutfitBundleProducerResult,
} from '../../lib/outfit/outfit-bundle-producer.js';
import type {
  OutfitTransitionVisualState,
  RegisterOutfitRow,
} from '../../lib/outfit/outfit-transition-contract.js';
import {
  isOutfitTruthSnapshot,
} from '../../lib/outfit/outfit-truth.js';
import { tempAxisFor } from '../../lib/temp-axis.js';
import { deepFlowCopyFor, localizedGarmentDisplayName } from '../../screens/deep-flow-copy.js';
import { OutfitExperience } from './OutfitExperience.js';

export type OutfitTruthPanelProps = Readonly<{
  outfitBundle: OutfitBundleProducerResult;
  registerOutfitRow?: RegisterOutfitRow;
  transitionVisualState?: OutfitTransitionVisualState;
  onOpenWarmColdGuide?: () => void;
}>;

function RecoveryGuide({ onOpenWarmColdGuide }: Readonly<{
  onOpenWarmColdGuide?: () => void;
}>) {
  const { i18n } = useTranslation();
  const copy = deepFlowCopyFor(i18n.resolvedLanguage ?? i18n.language);
  return (
    <section className="outfit-recovery-guide" aria-labelledby="outfit-recovery-title">
      <h2 id="outfit-recovery-title">{copy.outfit.recoveryTitle}</h2>
      <p>{copy.outfit.recoveryInstruction}</p>
      {typeof onOpenWarmColdGuide === 'function' && (
        <button type="button" onClick={onOpenWarmColdGuide}>
          {copy.outfit.recoveryButton}
        </button>
      )}
    </section>
  );
}

function UnsupportedCardinalityPanel({
  outfitBundle,
}: Readonly<{
  outfitBundle: Extract<OutfitBundleProducerResult, { kind: 'unsupported-cardinality' }>;
}>) {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const copy = deepFlowCopyFor(language);
  const temp = tempAxisFor(
    outfitBundle.weather.feelsLikeC,
    outfitBundle.weather.tempC,
  );
  const { orderedGarments, equipment } = outfitBundle.truth;
  return (
    <section
      className="outfit-truth-panel ba-temp-root"
      data-temp={temp}
      aria-label={copy.outfit.outfitList}
    >
      <section className="outfit-list" aria-label={copy.outfit.outfit}>
        <h2>{copy.outfit.dressBaseFirst}</h2>
        <ol>
          {orderedGarments.map((garment) => (
            <li key={garment.itemId}>
              <span>{garment.order}.</span> {localizedGarmentDisplayName(garment.label, language)}
            </li>
          ))}
        </ol>
        {equipment.length > 0 && (
          <section aria-label={copy.outfit.equipment}>
            <h3>{copy.outfit.equipment}</h3>
            <ul>
              {equipment.map((item) => (
                <li key={item.itemId}>{localizedGarmentDisplayName(item.label, language)}</li>
              ))}
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
  onOpenWarmColdGuide?: () => void;
}>) {
  const { i18n } = useTranslation();
  const copy = deepFlowCopyFor(i18n.resolvedLanguage ?? i18n.language);
  const { base, options } = outfitBundle;
  const temp = tempAxisFor(
    outfitBundle.weather.feelsLikeC,
    outfitBundle.weather.tempC,
  );

  if (!isOutfitTruthSnapshot(base)) return <UnavailablePanel />;

  return (
    <section
      className="outfit-truth-panel ba-temp-root"
      data-temp={temp}
      data-transition-visual-state={transitionVisualState}
      data-outfit-presentation="monter-list"
      aria-label={copy.outfit.completeOutfit}
    >
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

function UnavailablePanel() {
  const { i18n } = useTranslation();
  const copy = deepFlowCopyFor(i18n.resolvedLanguage ?? i18n.language);
  return (
    <section
      className="outfit-truth-panel ba-temp-root"
      data-temp="mild"
      aria-live="polite"
    >
      <p>{copy.outfit.unavailable}</p>
    </section>
  );
}

export function OutfitTruthPanel({
  outfitBundle,
  registerOutfitRow,
  transitionVisualState = 'settled',
  onOpenWarmColdGuide,
}: OutfitTruthPanelProps) {
  // This identity check must stay before any envelope or nested truth read.
  if (!isOutfitBundleProducerResult(outfitBundle)) return <UnavailablePanel />;

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
      return <UnsupportedCardinalityPanel outfitBundle={outfitBundle} />;
    case 'unavailable':
    default:
      return <UnavailablePanel />;
  }
}
