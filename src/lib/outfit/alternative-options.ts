import {
  getAlternatives,
  type Alternative,
} from '../wool-layers/alternatives.js';
import type {
  RecommendInput,
  Recommendation,
} from '../wool-layers/types.js';
import {
  finalizeOutfitOccurrenceSwap,
  type FinalizedOutfitSwapRejectionCode,
  type OutfitSwapSourceOccurrenceV1,
} from './finalized-outfit-swap.js';
import {
  createOutfitTruthSnapshot,
  isOutfitTruthSnapshot,
  type CreateOutfitTruthSnapshotArgsV1,
  type OutfitItemId,
  type OutfitTruthBuildResultV1,
  type OutfitTruthSnapshotV1,
} from './outfit-truth.js';

export type OutfitAlternativeOptionV1 = Readonly<{
  optionId: string;
  sourceItemId: OutfitItemId;
  targetCatalogGarmentId: string | null;
  targetLabel: string;
  comparison: Readonly<{
    advantages: readonly string[];
    tradeoffs: readonly string[];
  }>;
  outcome: OutfitTruthSnapshotV1;
}>;

export type OutfitAlternativeDiagnosticCode =
  | FinalizedOutfitSwapRejectionCode
  | 'invalid-base-input'
  | 'base-unsupported-cardinality'
  | 'invalid-candidate-data'
  | 'candidate-source-identity-mismatch'
  | 'semantic-equipment-ineligible'
  | 'outcome-unsupported-cardinality'
  | 'outcome-invalid'
  | 'outcome-identity-mismatch'
  | 'target-outcome-mismatch';

export type OutfitAlternativeDiagnosticV1 = Readonly<{
  diagnosticId: string;
  code: OutfitAlternativeDiagnosticCode;
  sourceItemId: OutfitItemId | null;
  targetLabel: string | null;
}>;

export type BuildOutfitAlternativeOptionsArgs =
  CreateOutfitTruthSnapshotArgsV1;

type EmptyOptions = readonly [];

export type OutfitAlternativeOptionsBuildResultV1 =
  | Readonly<{
      kind: 'supported';
      base: OutfitTruthSnapshotV1;
      options: readonly OutfitAlternativeOptionV1[];
      diagnostics: readonly OutfitAlternativeDiagnosticV1[];
    }>
  | Readonly<{
      kind: 'unsupported-cardinality';
      truth: Extract<
        OutfitTruthBuildResultV1,
        { kind: 'unsupported-cardinality' }
      >;
      options: EmptyOptions;
      diagnostics: readonly OutfitAlternativeDiagnosticV1[];
    }>
  | Readonly<{
      kind: 'unavailable';
      reason: 'invalid-input';
      options: EmptyOptions;
      diagnostics: readonly OutfitAlternativeDiagnosticV1[];
    }>;

const ARG_KEYS = Object.freeze([
  'transitionContextId',
  'input',
  'finalizedRecommendation',
  'pose',
]);
const FACTORY_ALTERNATIVE_OPTIONS = new WeakSet<object>();

function freezeDeep<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const key of Reflect.ownKeys(value)) {
      freezeDeep((value as Record<PropertyKey, unknown>)[key]);
    }
    Object.freeze(value);
  }
  return value;
}

function stableHash(value: string): string {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193);
    second = Math.imul(second ^ code, 0x85ebca6b);
  }
  return `${(first >>> 0).toString(16).padStart(8, '0')}${(
    second >>> 0
  )
    .toString(16)
    .padStart(8, '0')}`;
}

function isExactPlainDataRecord(
  value: unknown,
  keys: readonly string[],
): value is Record<string, unknown> {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    return false;
  }
  const ownKeys = Reflect.ownKeys(value);
  if (
    ownKeys.length !== keys.length ||
    ownKeys.some((key) => typeof key !== 'string' || !keys.includes(key))
  ) {
    return false;
  }
  return keys.every((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return (
      descriptor !== undefined &&
      'value' in descriptor &&
      descriptor.enumerable === true &&
      descriptor.get === undefined &&
      descriptor.set === undefined
    );
  });
}

function ownDataValue(
  value: Record<string, unknown>,
  key: string,
): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor !== undefined && 'value' in descriptor
    ? descriptor.value
    : undefined;
}

function diagnostic(
  identity: string,
  code: OutfitAlternativeDiagnosticCode,
  sourceItemId: OutfitItemId | null,
  targetLabel: string | null,
): OutfitAlternativeDiagnosticV1 {
  return freezeDeep({
    diagnosticId: `outfit-alternative-diagnostic-v1:${stableHash(
      `${identity}|${code}|${sourceItemId ?? ''}|${targetLabel ?? ''}`,
    )}`,
    code,
    sourceItemId,
    targetLabel,
  });
}

function unavailable(
  identity = 'invalid-input',
): OutfitAlternativeOptionsBuildResultV1 {
  return freezeDeep({
    kind: 'unavailable' as const,
    reason: 'invalid-input' as const,
    options: [] as const,
    diagnostics: [
      diagnostic(
        identity,
        'invalid-base-input',
        null,
        null,
      ),
    ],
  });
}

function readStringArray(value: unknown): readonly string[] | null {
  if (
    value === undefined
  ) {
    return Object.freeze([]);
  }
  if (
    !Array.isArray(value) ||
    Reflect.ownKeys(value).some((key) => {
      if (key === 'length') return false;
      if (typeof key !== 'string') return true;
      const index = Number(key);
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      return (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= value.length ||
        String(index) !== key ||
        descriptor === undefined ||
        !('value' in descriptor) ||
        descriptor.enumerable !== true
      );
    }) ||
    Object.keys(value).length !== value.length ||
    value.some((item) => typeof item !== 'string')
  ) {
    return null;
  }
  return Object.freeze([...value]);
}

type CandidateSnapshot = Readonly<{
  targetLabel: string;
  advantages: readonly string[];
  tradeoffs: readonly string[];
}>;

type CandidateReadResult =
  | Readonly<{ kind: 'none' }>
  | Readonly<{
      kind: 'invalid-source';
      targetLabel: string | null;
    }>
  | Readonly<{
      kind: 'candidates';
      candidates: readonly CandidateSnapshot[];
      invalidTargetLabels: readonly (string | null)[];
    }>;

function readCandidateData(sourceLabel: string): CandidateReadResult {
  let entry;
  try {
    entry = getAlternatives(sourceLabel);
  } catch {
    return Object.freeze({
      kind: 'invalid-source' as const,
      targetLabel: null,
    });
  }
  if (entry === undefined) {
    return Object.freeze({ kind: 'none' as const });
  }
  if (
    entry === null ||
    typeof entry !== 'object' ||
    Array.isArray(entry) ||
    Object.getPrototypeOf(entry) !== Object.prototype
  ) {
    return Object.freeze({
      kind: 'invalid-source' as const,
      targetLabel: null,
    });
  }
  const itemNameDescriptor = Object.getOwnPropertyDescriptor(
    entry,
    'itemName',
  );
  const alternativesDescriptor = Object.getOwnPropertyDescriptor(
    entry,
    'alternatives',
  );
  if (
    itemNameDescriptor === undefined ||
    !('value' in itemNameDescriptor) ||
    itemNameDescriptor.value !== sourceLabel ||
    alternativesDescriptor === undefined ||
    !('value' in alternativesDescriptor) ||
    !Array.isArray(alternativesDescriptor.value)
  ) {
    return Object.freeze({
      kind: 'invalid-source' as const,
      targetLabel: null,
    });
  }

  const candidates: CandidateSnapshot[] = [];
  const invalidTargetLabels: Array<string | null> = [];
  for (const rawCandidate of alternativesDescriptor.value as unknown[]) {
    if (
      rawCandidate === null ||
      typeof rawCandidate !== 'object' ||
      Array.isArray(rawCandidate) ||
      Object.getPrototypeOf(rawCandidate) !== Object.prototype
    ) {
      invalidTargetLabels.push(null);
      continue;
    }
    const nameDescriptor = Object.getOwnPropertyDescriptor(
      rawCandidate,
      'name',
    );
    const prosDescriptor = Object.getOwnPropertyDescriptor(
      rawCandidate,
      'pros',
    );
    const consDescriptor = Object.getOwnPropertyDescriptor(
      rawCandidate,
      'cons',
    );
    const targetLabel =
      nameDescriptor !== undefined &&
      'value' in nameDescriptor &&
      typeof nameDescriptor.value === 'string'
        ? nameDescriptor.value
        : null;
    const advantages = readStringArray(
      prosDescriptor !== undefined && 'value' in prosDescriptor
        ? prosDescriptor.value
        : undefined,
    );
    const tradeoffs = readStringArray(
      consDescriptor !== undefined && 'value' in consDescriptor
        ? consDescriptor.value
        : undefined,
    );
    if (
      targetLabel === null ||
      targetLabel.length === 0 ||
      targetLabel.trim() !== targetLabel ||
      advantages === null ||
      tradeoffs === null
    ) {
      invalidTargetLabels.push(targetLabel);
      continue;
    }
    candidates.push(
      freezeDeep({
        targetLabel,
        advantages,
        tradeoffs,
      }),
    );
  }
  return freezeDeep({
    kind: 'candidates' as const,
    candidates,
    invalidTargetLabels,
  });
}

function sourceSelector(
  source: OutfitTruthSnapshotV1['garments'][number],
): OutfitSwapSourceOccurrenceV1 {
  return Object.freeze({
    itemId: source.itemId,
    order: source.order,
    category: source.category,
    sourceLabel: source.sourceLabel,
  });
}

function makeOption(
  base: OutfitTruthSnapshotV1,
  sourceItemId: OutfitItemId,
  candidate: CandidateSnapshot,
  targetCatalogGarmentId: string,
  outcome: OutfitTruthSnapshotV1,
): OutfitAlternativeOptionV1 {
  const option = freezeDeep({
    optionId: `outfit-alternative-option-v1:${stableHash(
      [
        base.snapshotId,
        sourceItemId,
        candidate.targetLabel,
        targetCatalogGarmentId,
        outcome.snapshotId,
      ].join('|'),
    )}`,
    sourceItemId,
    targetCatalogGarmentId,
    targetLabel: candidate.targetLabel,
    comparison: {
      advantages: [...candidate.advantages],
      tradeoffs: [...candidate.tradeoffs],
    },
    outcome,
  });
  FACTORY_ALTERNATIVE_OPTIONS.add(option);
  return option;
}

function candidateTargetSurvived(
  outcome: OutfitTruthSnapshotV1,
  targetLabel: string,
  targetCatalogGarmentId: string,
): boolean {
  return outcome.garments.some(
    (garment) =>
      garment.sourceLabel === targetLabel &&
      garment.catalogGarmentId === targetCatalogGarmentId,
  );
}

export function buildOutfitAlternativeOptions(
  rawArgs: BuildOutfitAlternativeOptionsArgs,
): OutfitAlternativeOptionsBuildResultV1 {
  if (!isExactPlainDataRecord(rawArgs, ARG_KEYS)) {
    return unavailable();
  }
  const transitionContextId = ownDataValue(
    rawArgs,
    'transitionContextId',
  );
  const input = ownDataValue(rawArgs, 'input') as RecommendInput;
  const finalizedRecommendation = ownDataValue(
    rawArgs,
    'finalizedRecommendation',
  ) as Recommendation;
  const pose = ownDataValue(rawArgs, 'pose');
  if (
    typeof transitionContextId !== 'string' ||
    transitionContextId.length === 0 ||
    (pose !== 'sitting' && pose !== 'standing')
  ) {
    return unavailable();
  }
  const canonicalArgs = {
    transitionContextId,
    input,
    finalizedRecommendation,
    pose,
  } as const;

  let baseBuild: OutfitTruthBuildResultV1;
  try {
    baseBuild = createOutfitTruthSnapshot(canonicalArgs);
  } catch {
    return unavailable(transitionContextId);
  }
  if (baseBuild.kind === 'unsupported-cardinality') {
    return freezeDeep({
      kind: 'unsupported-cardinality' as const,
      truth: baseBuild,
      options: [] as const,
      diagnostics: [
        diagnostic(
          `unsupported|${transitionContextId}|${baseBuild.orderedGarments
            .map((garment) => garment.itemId)
            .join('|')}`,
          'base-unsupported-cardinality',
          null,
          null,
        ),
      ],
    });
  }

  const base = baseBuild.snapshot;
  const options: OutfitAlternativeOptionV1[] = [];
  const diagnostics: OutfitAlternativeDiagnosticV1[] = [];

  for (const equipment of base.equipment) {
    const candidateData = readCandidateData(equipment.sourceLabel);
    if (candidateData.kind === 'invalid-source') {
      diagnostics.push(
        diagnostic(
          base.snapshotId,
          'invalid-candidate-data',
          equipment.itemId,
          candidateData.targetLabel,
        ),
      );
      continue;
    }
    if (candidateData.kind !== 'candidates') continue;
    for (const targetLabel of candidateData.invalidTargetLabels) {
      diagnostics.push(
        diagnostic(
          base.snapshotId,
          'invalid-candidate-data',
          equipment.itemId,
          targetLabel,
        ),
      );
    }
    for (const candidate of candidateData.candidates) {
      diagnostics.push(
        diagnostic(
          base.snapshotId,
          'semantic-equipment-ineligible',
          equipment.itemId,
          candidate.targetLabel,
        ),
      );
    }
  }

  for (const source of base.garments) {
    const candidateData = readCandidateData(source.sourceLabel);
    if (candidateData.kind === 'invalid-source') {
      diagnostics.push(
        diagnostic(
          base.snapshotId,
          'candidate-source-identity-mismatch',
          source.itemId,
          candidateData.targetLabel,
        ),
      );
      continue;
    }
    if (candidateData.kind !== 'candidates') continue;
    for (const targetLabel of candidateData.invalidTargetLabels) {
      diagnostics.push(
        diagnostic(
          base.snapshotId,
          'invalid-candidate-data',
          source.itemId,
          targetLabel,
        ),
      );
    }

    for (const candidate of candidateData.candidates) {
      const finalizedSwap = finalizeOutfitOccurrenceSwap({
        input,
        finalizedRecommendation,
        baseSnapshot: base,
        source: sourceSelector(source),
        targetLabel: candidate.targetLabel,
      });
      if (finalizedSwap.kind === 'rejected') {
        diagnostics.push(
          diagnostic(
            base.snapshotId,
            finalizedSwap.code,
            source.itemId,
            candidate.targetLabel,
          ),
        );
        continue;
      }

      let outcomeBuild: OutfitTruthBuildResultV1;
      try {
        outcomeBuild = createOutfitTruthSnapshot({
          transitionContextId: base.transitionContextId,
          input,
          finalizedRecommendation: finalizedSwap.recommendation,
          pose,
        });
      } catch {
        diagnostics.push(
          diagnostic(
            base.snapshotId,
            'outcome-invalid',
            source.itemId,
            candidate.targetLabel,
          ),
        );
        continue;
      }
      if (outcomeBuild.kind !== 'supported') {
        diagnostics.push(
          diagnostic(
            base.snapshotId,
            'outcome-unsupported-cardinality',
            source.itemId,
            candidate.targetLabel,
          ),
        );
        continue;
      }
      const outcome = outcomeBuild.snapshot;
      if (
        !isOutfitTruthSnapshot(outcome) ||
        outcome.transitionContextId !== base.transitionContextId ||
        outcome.snapshotId === base.snapshotId ||
        outcome.recommendationFingerprint ===
          base.recommendationFingerprint
      ) {
        diagnostics.push(
          diagnostic(
            base.snapshotId,
            'outcome-identity-mismatch',
            source.itemId,
            candidate.targetLabel,
          ),
        );
        continue;
      }
      if (
        !candidateTargetSurvived(
          outcome,
          candidate.targetLabel,
          finalizedSwap.targetCatalogGarmentId,
        )
      ) {
        diagnostics.push(
          diagnostic(
            base.snapshotId,
            'target-outcome-mismatch',
            source.itemId,
            candidate.targetLabel,
          ),
        );
        continue;
      }
      options.push(
        makeOption(
          base,
          source.itemId,
          candidate,
          finalizedSwap.targetCatalogGarmentId,
          outcome,
        ),
      );
    }
  }

  return freezeDeep({
    kind: 'supported' as const,
    base,
    options,
    diagnostics,
  });
}

export function isOutfitAlternativeOption(
  value: unknown,
): value is OutfitAlternativeOptionV1 {
  if (
    value === null ||
    typeof value !== 'object' ||
    !FACTORY_ALTERNATIVE_OPTIONS.has(value)
  ) {
    return false;
  }
  const option = value as OutfitAlternativeOptionV1;
  return (
    Object.isFrozen(option) &&
    typeof option.optionId === 'string' &&
    option.optionId.startsWith('outfit-alternative-option-v1:') &&
    typeof option.sourceItemId === 'string' &&
    typeof option.targetLabel === 'string' &&
    (option.targetCatalogGarmentId === null ||
      typeof option.targetCatalogGarmentId === 'string') &&
    Object.isFrozen(option.comparison) &&
    Object.isFrozen(option.comparison.advantages) &&
    Object.isFrozen(option.comparison.tradeoffs) &&
    isOutfitTruthSnapshot(option.outcome)
  );
}

// Keeps the source table's role explicit in generated declarations: it
// nominates candidate comparison data but never certifies selectable advice.
export type OutfitAlternativeCandidateData = Alternative;
