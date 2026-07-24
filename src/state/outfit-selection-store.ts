import { create } from 'zustand';
import {
  isOutfitAlternativeOption,
  type OutfitAlternativeOptionV1,
} from '../lib/outfit/alternative-options.js';
import {
  isOutfitTruthSnapshot,
  type OutfitTruthSnapshotV1,
} from '../lib/outfit/outfit-truth.js';

export type OutfitSelectionDiagnosticCode =
  | 'closed-session'
  | 'invalid-base'
  | 'invalid-options'
  | 'forged-option'
  | 'stale-option'
  | 'invalid-option-ownership';

export type OutfitSelectionDiagnosticV1 = Readonly<{
  diagnosticId: string;
  code: OutfitSelectionDiagnosticCode;
}>;

export type ClosedOutfitSelectionSession = Readonly<{
  kind: 'closed';
  diagnostics: readonly [];
}>;

export type OpenOutfitSelectionSession = Readonly<{
  kind: 'open';
  base: OutfitTruthSnapshotV1;
  options: readonly OutfitAlternativeOptionV1[];
  current: OutfitTruthSnapshotV1;
  selectedOptionId: string | null;
  diagnostics: readonly OutfitSelectionDiagnosticV1[];
}>;

export type OutfitSelectionSession =
  | ClosedOutfitSelectionSession
  | OpenOutfitSelectionSession;

export type OutfitSelectionActionResult =
  | Readonly<{ ok: true }>
  | Readonly<{
      ok: false;
      diagnostic: OutfitSelectionDiagnosticV1;
    }>;

export type OutfitSelectionStore = Readonly<{
  session: OutfitSelectionSession;
  open: (
    base: OutfitTruthSnapshotV1,
    options: readonly OutfitAlternativeOptionV1[],
  ) => OutfitSelectionActionResult;
  select: (
    option: OutfitAlternativeOptionV1,
  ) => OutfitSelectionActionResult;
  reset: () => OutfitSelectionActionResult;
  close: () => void;
}>;

const ACTION_OK = Object.freeze({ ok: true as const });
const CLOSED_SESSION: ClosedOutfitSelectionSession = Object.freeze({
  kind: 'closed' as const,
  diagnostics: Object.freeze([]) as readonly [],
});

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

function makeDiagnostic(
  code: OutfitSelectionDiagnosticCode,
  identity: string,
): OutfitSelectionDiagnosticV1 {
  return Object.freeze({
    diagnosticId: `outfit-selection-diagnostic-v1:${stableHash(
      `${code}|${identity}`,
    )}`,
    code,
  });
}

function rejected(
  diagnostic: OutfitSelectionDiagnosticV1,
): OutfitSelectionActionResult {
  return Object.freeze({
    ok: false as const,
    diagnostic,
  });
}

function appendDiagnostic(
  session: OpenOutfitSelectionSession,
  diagnostic: OutfitSelectionDiagnosticV1,
): OpenOutfitSelectionSession {
  if (
    session.diagnostics.some(
      (existing) =>
        existing.diagnosticId === diagnostic.diagnosticId,
    )
  ) {
    return session;
  }
  return Object.freeze({
    ...session,
    diagnostics: Object.freeze([
      ...session.diagnostics,
      diagnostic,
    ]),
  });
}

function isDenseFrozenOptionArray(
  value: unknown,
): value is readonly OutfitAlternativeOptionV1[] {
  if (
    !Array.isArray(value) ||
    !Object.isFrozen(value) ||
    Object.getPrototypeOf(value) !== Array.prototype
  ) {
    return false;
  }
  let ownIndexCount = 0;
  for (const key of Reflect.ownKeys(value)) {
    if (key === 'length') continue;
    if (typeof key !== 'string') return false;
    const index = Number(key);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= value.length ||
      String(index) !== key ||
      descriptor === undefined ||
      !('value' in descriptor) ||
      descriptor.enumerable !== true
    ) {
      return false;
    }
    ownIndexCount += 1;
  }
  return (
    ownIndexCount === value.length &&
    value.every(isOutfitAlternativeOption)
  );
}

function optionBelongsToBase(
  base: OutfitTruthSnapshotV1,
  option: OutfitAlternativeOptionV1,
): boolean {
  if (
    !isOutfitAlternativeOption(option) ||
    !isOutfitTruthSnapshot(option.outcome) ||
    option.outcome.transitionContextId !==
      base.transitionContextId ||
    option.outcome.snapshotId === base.snapshotId ||
    option.outcome.recommendationFingerprint ===
      base.recommendationFingerprint ||
    !base.garments.some(
      (garment) => garment.itemId === option.sourceItemId,
    )
  ) {
    return false;
  }
  return option.outcome.garments.some(
    (garment) =>
      garment.sourceLabel === option.targetLabel &&
      garment.catalogGarmentId === option.targetCatalogGarmentId,
  );
}

function validOptionsForBase(
  base: OutfitTruthSnapshotV1,
  options: unknown,
): options is readonly OutfitAlternativeOptionV1[] {
  if (!isDenseFrozenOptionArray(options)) return false;
  const optionIds = new Set<string>();
  for (const option of options) {
    if (
      optionIds.has(option.optionId) ||
      !optionBelongsToBase(base, option)
    ) {
      return false;
    }
    optionIds.add(option.optionId);
  }
  return true;
}

function openSession(
  base: OutfitTruthSnapshotV1,
  options: readonly OutfitAlternativeOptionV1[],
): OpenOutfitSelectionSession {
  return Object.freeze({
    kind: 'open' as const,
    base,
    options,
    current: base,
    selectedOptionId: null,
    diagnostics: Object.freeze([]),
  });
}

export const useOutfitSelectionStore = create<OutfitSelectionStore>()(
  (set, get) => ({
    session: CLOSED_SESSION,

    open: (base, options) => {
      if (!isOutfitTruthSnapshot(base)) {
        return rejected(
          makeDiagnostic('invalid-base', 'untrusted-base'),
        );
      }
      let optionsAreValid: boolean;
      try {
        optionsAreValid = validOptionsForBase(base, options);
      } catch {
        optionsAreValid = false;
      }
      if (!optionsAreValid) {
        return rejected(
          makeDiagnostic(
            'invalid-options',
            [
              base.snapshotId,
              base.recommendationFingerprint,
              base.transitionContextId,
            ].join('|'),
          ),
        );
      }
      set({ session: openSession(base, options) });
      return ACTION_OK;
    },

    select: (option) => {
      const session = get().session;
      if (session.kind === 'closed') {
        return rejected(
          makeDiagnostic('closed-session', 'closed'),
        );
      }
      if (!isOutfitAlternativeOption(option)) {
        const diagnostic = makeDiagnostic(
          'forged-option',
          [
            session.base.snapshotId,
            session.base.recommendationFingerprint,
            session.base.transitionContextId,
          ].join('|'),
        );
        set({
          session: appendDiagnostic(session, diagnostic),
        });
        return rejected(diagnostic);
      }

      const registered = session.options.find(
        (candidate) => candidate.optionId === option.optionId,
      );
      if (registered === undefined || registered !== option) {
        const diagnostic = makeDiagnostic(
          'stale-option',
          `${session.base.snapshotId}|${option.optionId}`,
        );
        set({
          session: appendDiagnostic(session, diagnostic),
        });
        return rejected(diagnostic);
      }
      if (!optionBelongsToBase(session.base, option)) {
        const diagnostic = makeDiagnostic(
          'invalid-option-ownership',
          `${session.base.snapshotId}|${option.optionId}`,
        );
        set({
          session: appendDiagnostic(session, diagnostic),
        });
        return rejected(diagnostic);
      }

      set({
        session: Object.freeze({
          ...session,
          current: option.outcome,
          selectedOptionId: option.optionId,
          diagnostics: Object.freeze([]),
        }),
      });
      return ACTION_OK;
    },

    reset: () => {
      const session = get().session;
      if (session.kind === 'closed') {
        return rejected(
          makeDiagnostic('closed-session', 'closed'),
        );
      }
      set({
        session: Object.freeze({
          ...session,
          current: session.base,
          selectedOptionId: null,
          diagnostics: Object.freeze([]),
        }),
      });
      return ACTION_OK;
    },

    close: () => {
      set({ session: CLOSED_SESSION });
    },
  }),
);
