import { useMemo } from 'react';
import { WARM_COLD_RECOVERY_COPY } from '../../lib/copy/warm-cold-recovery.js';
import { parseStrictIsoInstant } from '../../lib/met-no/types.js';
import { isOutfitAlternativeOption } from '../../lib/outfit/alternative-options.js';
import {
  type OutfitBundleProducerResult,
  type OutfitBundleSourceV1,
  type OutfitBundleUnavailableReason,
} from '../../lib/outfit/outfit-bundle-producer.js';
import type {
  OutfitTransitionVisualState,
  RegisterOutfitRow,
} from '../../lib/outfit/outfit-transition-contract.js';
import {
  isOutfitTruthSnapshot,
  type OutfitEquipmentTruth,
  type OutfitItemId,
  type OutfitTruthSnapshotV1,
} from '../../lib/outfit/outfit-truth.js';
import { tempAxisFor } from '../../lib/temp-axis.js';
import {
  useOutfitSelectionStore,
  type OutfitSelectionSession,
} from '../../state/outfit-selection-store.js';
import { OutfitExperience } from './OutfitExperience.js';
import { VerifiedAvatarComposite } from './VerifiedAvatarComposite.js';

export type OutfitTruthPanelProps = Readonly<{
  outfitBundle: OutfitBundleProducerResult;
  registerOutfitRow?: RegisterOutfitRow;
  transitionVisualState?: OutfitTransitionVisualState;
  onOpenWarmColdGuide?: () => void;
}>;

const UNAVAILABLE_REASONS = new Set<OutfitBundleUnavailableReason>([
  'invalid-input',
  'input-result-mismatch',
  'invalid-provenance',
  'truth-build-failed',
]);

function readExactFrozenRecord(
  value: unknown,
  expectedKeys: readonly string[],
): Readonly<Record<string, unknown>> | null {
  try {
    if (
      value === null
      || typeof value !== 'object'
      || Array.isArray(value)
      || Object.getPrototypeOf(value) !== Object.prototype
      || !Object.isFrozen(value)
    ) {
      return null;
    }
    const expected = new Set(expectedKeys);
    const ownKeys = Reflect.ownKeys(value);
    if (
      ownKeys.length !== expectedKeys.length
      || ownKeys.some(
        (key) => typeof key !== 'string' || !expected.has(key),
      )
    ) {
      return null;
    }
    const record = Object.create(null) as Record<string, unknown>;
    for (const key of expectedKeys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (
        descriptor === undefined
        || !Object.hasOwn(descriptor, 'value')
        || descriptor.enumerable !== true
      ) {
        return null;
      }
      record[key] = descriptor.value;
    }
    return record;
  } catch {
    return null;
  }
}

function readExactFrozenArray(value: unknown): readonly unknown[] | null {
  try {
    if (
      !Array.isArray(value)
      || Object.getPrototypeOf(value) !== Array.prototype
      || !Object.isFrozen(value)
    ) {
      return null;
    }
    const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
    if (
      lengthDescriptor === undefined
      || !Object.hasOwn(lengthDescriptor, 'value')
      || !Number.isSafeInteger(lengthDescriptor.value)
      || lengthDescriptor.value < 0
    ) {
      return null;
    }
    const length = lengthDescriptor.value;
    if (Reflect.ownKeys(value).length !== length + 1) return null;
    const result: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (
        descriptor === undefined
        || !Object.hasOwn(descriptor, 'value')
        || descriptor.enumerable !== true
      ) {
        return null;
      }
      result.push(descriptor.value);
    }
    return result;
  } catch {
    return null;
  }
}

function isExactIdentity(value: unknown): value is string {
  return (
    typeof value === 'string'
    && value.length > 0
    && value.trim() === value
    && value.normalize('NFC') === value
    && !/\p{Cc}|\p{Cf}/u.test(value)
  );
}

function readSource(value: unknown): OutfitBundleSourceV1 | null {
  const current = readExactFrozenRecord(value, [
    'kind',
    'sourceContextId',
  ]);
  if (
    current !== null
    && current.kind === 'current'
    && isExactIdentity(current.sourceContextId)
  ) {
    return value as OutfitBundleSourceV1;
  }
  const planned = readExactFrozenRecord(value, [
    'kind',
    'sourceContextId',
    'planningEventId',
    'plannedForIso',
  ]);
  if (
    planned !== null
    && planned.kind === 'planned'
    && isExactIdentity(planned.sourceContextId)
    && isExactIdentity(planned.planningEventId)
    && parseStrictIsoInstant(planned.plannedForIso) !== null
  ) {
    return value as OutfitBundleSourceV1;
  }
  return null;
}

function readWeather(value: unknown): Readonly<{
  tempC: number;
  feelsLikeC: number;
}> | null {
  const weather = readExactFrozenRecord(value, ['tempC', 'feelsLikeC']);
  return (
    weather !== null
    && typeof weather.tempC === 'number'
    && Number.isFinite(weather.tempC)
    && typeof weather.feelsLikeC === 'number'
    && Number.isFinite(weather.feelsLikeC)
  )
    ? value as Readonly<{ tempC: number; feelsLikeC: number }>
    : null;
}

function readSupportedOptions(
  value: unknown,
  base: OutfitTruthSnapshotV1,
): Extract<OutfitBundleProducerResult, { kind: 'supported' }>['options'] | null {
  const options = readExactFrozenArray(value);
  if (options === null) return null;
  const optionIds = new Set<string>();
  for (const option of options) {
    if (!isOutfitAlternativeOption(option)) return null;
    if (
      optionIds.has(option.optionId)
      || !base.garments.some(
        (garment) => garment.itemId === option.sourceItemId,
      )
      || option.outcome.transitionContextId !== base.transitionContextId
      || option.outcome.snapshotId === base.snapshotId
      || option.outcome.recommendationFingerprint
        === base.recommendationFingerprint
      || !option.outcome.garments.some(
        (garment) =>
          garment.sourceLabel === option.targetLabel
          && garment.catalogGarmentId === option.targetCatalogGarmentId,
      )
    ) {
      return null;
    }
    optionIds.add(option.optionId);
  }
  return value as Extract<
    OutfitBundleProducerResult,
    { kind: 'supported' }
  >['options'];
}

function readUnsupportedGarments(
  value: unknown,
): readonly Readonly<{
  itemId: OutfitItemId;
  sourceLabel: string;
  label: string;
  order: number;
}>[] | null {
  const values = readExactFrozenArray(value);
  if (
    values === null
    || (values.length >= 1 && values.length <= 10)
  ) {
    return null;
  }
  const result: Readonly<{
    itemId: OutfitItemId;
    sourceLabel: string;
    label: string;
    order: number;
  }>[] = [];
  const ids = new Set<string>();
  for (const [index, valueItem] of values.entries()) {
    const item = readExactFrozenRecord(valueItem, [
      'itemId',
      'sourceLabel',
      'label',
      'order',
    ]);
    if (
      item === null
      || !isExactIdentity(item.itemId)
      || !item.itemId.startsWith('outfit-item-v1:')
      || ids.has(item.itemId)
      || !isExactIdentity(item.sourceLabel)
      || typeof item.label !== 'string'
      || item.label !== item.sourceLabel.trim()
      || item.order !== index + 1
    ) {
      return null;
    }
    ids.add(item.itemId);
    result.push(valueItem as typeof result[number]);
  }
  return result;
}

function readUnsupportedEquipment(
  value: unknown,
  garmentIds: ReadonlySet<string>,
): readonly OutfitEquipmentTruth[] | null {
  const values = readExactFrozenArray(value);
  if (values === null) return null;
  const result: OutfitEquipmentTruth[] = [];
  const ids = new Set(garmentIds);
  for (const [index, valueItem] of values.entries()) {
    const item = readExactFrozenRecord(valueItem, [
      'itemId',
      'sourceLabel',
      'label',
      'catalogGarmentId',
      'order',
    ]);
    if (
      item === null
      || !isExactIdentity(item.itemId)
      || !item.itemId.startsWith('outfit-item-v1:')
      || ids.has(item.itemId)
      || !isExactIdentity(item.sourceLabel)
      || typeof item.label !== 'string'
      || item.label !== item.sourceLabel.trim()
      || (
        item.catalogGarmentId !== null
        && !isExactIdentity(item.catalogGarmentId)
      )
      || item.order !== index + 1
    ) {
      return null;
    }
    ids.add(item.itemId);
    result.push(valueItem as OutfitEquipmentTruth);
  }
  return result;
}

function readProducerResult(
  value: unknown,
): OutfitBundleProducerResult | null {
  const kindDescriptor = (() => {
    try {
      if (
        value === null
        || typeof value !== 'object'
        || Array.isArray(value)
        || Object.getPrototypeOf(value) !== Object.prototype
        || !Object.isFrozen(value)
      ) {
        return null;
      }
      const descriptor = Object.getOwnPropertyDescriptor(value, 'kind');
      return (
        descriptor !== undefined
        && Object.hasOwn(descriptor, 'value')
        && descriptor.enumerable === true
      )
        ? descriptor
        : null;
    } catch {
      return null;
    }
  })();
  if (kindDescriptor === null) return null;
  const kind = kindDescriptor.value;

  if (kind === 'unavailable') {
    const root = readExactFrozenRecord(value, [
      'kind',
      'bundleVersion',
      'reason',
    ]);
    return (
      root !== null
      && root.bundleVersion === 1
      && typeof root.reason === 'string'
      && UNAVAILABLE_REASONS.has(root.reason as OutfitBundleUnavailableReason)
    )
      ? value as OutfitBundleProducerResult
      : null;
  }

  const root = readExactFrozenRecord(value, kind === 'supported'
    ? ['kind', 'bundleVersion', 'source', 'weather', 'base', 'options']
    : [
        'kind',
        'bundleVersion',
        'source',
        'weather',
        'truth',
      ]);
  if (
    root === null
    || root.bundleVersion !== 1
    || readSource(root.source) === null
    || readWeather(root.weather) === null
  ) {
    return null;
  }

  if (kind === 'supported') {
    if (
      !isOutfitTruthSnapshot(root.base)
      || readSupportedOptions(root.options, root.base) === null
    ) {
      return null;
    }
    return value as OutfitBundleProducerResult;
  }
  if (kind !== 'unsupported-cardinality') return null;

  const truth = readExactFrozenRecord(root.truth, [
    'kind',
    'reason',
    'orderedGarments',
    'equipment',
  ]);
  if (
    truth === null
    || truth.kind !== 'unsupported-cardinality'
    || truth.reason !== 'semantic-garment-count-outside-1-10'
  ) {
    return null;
  }
  const garments = readUnsupportedGarments(truth.orderedGarments);
  if (
    garments === null
    || readUnsupportedEquipment(
      truth.equipment,
      new Set(garments.map((item) => item.itemId)),
    ) === null
  ) {
    return null;
  }
  return value as OutfitBundleProducerResult;
}

function resolveSelectedAvatarSnapshot(
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
  onOpenWarmColdGuide?: () => void;
}>) {
  return (
    <section className="outfit-recovery-guide" aria-labelledby="outfit-recovery-title">
      <h2 id="outfit-recovery-title">{WARM_COLD_RECOVERY_COPY.title}</h2>
      <p>{WARM_COLD_RECOVERY_COPY.instruction}</p>
      {typeof onOpenWarmColdGuide === 'function' && (
        <button type="button" onClick={onOpenWarmColdGuide}>
          Se varm eller kald-guiden
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
  const temp = tempAxisFor(
    outfitBundle.weather.feelsLikeC,
    outfitBundle.weather.tempC,
  );
  const { orderedGarments, equipment } = outfitBundle.truth;
  return (
    <section
      className="outfit-truth-panel ba-temp-root"
      data-temp={temp}
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
  onOpenWarmColdGuide?: () => void;
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
    return <UnavailablePanel />;
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

function UnavailablePanel() {
  return (
    <section
      className="outfit-truth-panel ba-temp-root"
      data-temp="mild"
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
  const validatedBundle = readProducerResult(outfitBundle);
  if (validatedBundle === null) return <UnavailablePanel />;

  switch (validatedBundle.kind) {
    case 'supported':
      return (
        <SupportedPanel
          outfitBundle={validatedBundle}
          registerOutfitRow={registerOutfitRow}
          transitionVisualState={transitionVisualState}
          onOpenWarmColdGuide={onOpenWarmColdGuide}
        />
      );
    case 'unsupported-cardinality':
      return (
        <UnsupportedCardinalityPanel
          outfitBundle={validatedBundle}
        />
      );
    case 'unavailable':
    default:
      return <UnavailablePanel />;
  }
}
