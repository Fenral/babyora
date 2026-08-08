import { useCallback, useEffect, useMemo, useRef, useState, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import type { OutfitAlternativeOptionV1 } from '../../lib/outfit/alternative-options.js';
import type { RegisterOutfitRow } from '../../lib/outfit/outfit-transition-contract.js';
import type { OutfitItemId, OutfitTruthSnapshotV1 } from '../../lib/outfit/outfit-truth.js';
import {
  deepFlowCopyFor,
  localizedGarmentDisplayName,
  normalizeDeepFlowLanguage,
} from '../../screens/deep-flow-copy.js';
import { useOutfitSelectionStore } from '../../state/outfit-selection-store.js';
import { OutfitGarmentList } from './OutfitGarmentList.js';
import './Antrekkskart.css';

type Props = Readonly<{
  snapshot: OutfitTruthSnapshotV1;
  options?: readonly OutfitAlternativeOptionV1[];
  temp: 'kald' | 'mild' | 'varm';
  registerOutfitRow?: RegisterOutfitRow;
}>;

const EMPTY_OPTIONS = Object.freeze([]) as readonly OutfitAlternativeOptionV1[];

type ComparisonFocusOrigin = Pick<HTMLButtonElement, 'focus' | 'isConnected'>;
type ComparisonFocusLifecycle = Readonly<{
  open: (origin: ComparisonFocusOrigin) => void;
  close: (options: Readonly<{ restoreFocus: boolean }>) => boolean;
  clear: () => void;
  isOpen: () => boolean;
}>;

export type ComparisonEscapeTarget = Readonly<{
  addEventListener: (
    type: 'keydown',
    listener: (event: KeyboardEvent) => void,
  ) => void;
  removeEventListener: (
    type: 'keydown',
    listener: (event: KeyboardEvent) => void,
  ) => void;
}>;

// Kept here to preserve the plan's five-file component boundary.
// eslint-disable-next-line react-refresh/only-export-components
export function createComparisonFocusLifecycle(): ComparisonFocusLifecycle {
  let origin: ComparisonFocusOrigin | null = null;
  return Object.freeze({
    open(nextOrigin: ComparisonFocusOrigin) {
      origin = nextOrigin;
    },
    close({ restoreFocus }: Readonly<{ restoreFocus: boolean }>) {
      const closingOrigin = origin;
      if (closingOrigin === null) return false;
      origin = null;
      if (restoreFocus && closingOrigin.isConnected) {
        closingOrigin.focus();
      }
      return true;
    },
    clear() {
      origin = null;
    },
    isOpen() {
      return origin !== null;
    },
  });
}

// Kept here to preserve the plan's five-file component boundary.
// eslint-disable-next-line react-refresh/only-export-components
export function attachOutfitEscapeListener(
  target: ComparisonEscapeTarget,
  onEscape: () => void,
): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') onEscape();
  };
  target.addEventListener('keydown', onKeyDown);
  return () => target.removeEventListener('keydown', onKeyDown);
}

type OutfitComparisonDialogProps = Readonly<{
  option: OutfitAlternativeOptionV1;
  sourceLabel: string;
  headingRef?: Ref<HTMLHeadingElement>;
  onConfirm: () => void;
  onCancel: () => void;
}>;

// Kept here to preserve the plan's five-file component boundary.
export function OutfitComparisonDialog({
  option,
  sourceLabel,
  headingRef,
  onConfirm,
  onCancel,
}: OutfitComparisonDialogProps) {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const normalizedLanguage = normalizeDeepFlowLanguage(language);
  const copy = deepFlowCopyFor(language);
  const source = localizedGarmentDisplayName(sourceLabel, language);
  const target = localizedGarmentDisplayName(option.targetLabel, language);
  const advantages = normalizedLanguage === 'no'
    ? option.comparison.advantages
    : [copy.outfit.genericAdvantage];
  const tradeoffs = normalizedLanguage === 'no'
    ? option.comparison.tradeoffs
    : [copy.outfit.genericTradeoff];
  return (
    <dialog open aria-labelledby="outfit-comparison-title" className="outfit-comparison">
      <p className="outfit-comparison__eyebrow">{copy.outfit.swapSuggestion}</p>
      <h2 ref={headingRef} tabIndex={-1} id="outfit-comparison-title">
        {copy.outfit.swapTitle(source, target)}
      </h2>
      <div className="outfit-comparison__tradeoffs">
        <p><strong>{copy.outfit.advantages}</strong>{advantages.join(', ')}</p>
        <p><strong>{copy.outfit.tradeoffs}</strong>{tradeoffs.join(', ')}</p>
      </div>
      <section className="outfit-comparison__result" aria-labelledby="outfit-comparison-result-title">
        <h3 id="outfit-comparison-result-title">{copy.outfit.resultingOutfit}</h3>
        <ol data-outfit-comparison-garments>
          {option.outcome.garments.map((item) => (
            <li key={item.itemId}>{item.order}. {localizedGarmentDisplayName(item.label, language)}</li>
          ))}
        </ol>
        {option.outcome.equipment.length > 0 && (
          <>
            <h4>{copy.outfit.equipment}</h4>
            <ul data-outfit-comparison-equipment>
              {option.outcome.equipment.map((item) => (
                <li key={item.itemId}>{localizedGarmentDisplayName(item.label, language)}</li>
              ))}
            </ul>
          </>
        )}
      </section>
      <div className="outfit-comparison__actions">
        <button type="button" className="outfit-comparison__cancel" onClick={onCancel}>{copy.outfit.cancel}</button>
        <button type="button" className="outfit-comparison__confirm" onClick={onConfirm}>{copy.outfit.chooseOutfit}</button>
      </div>
    </dialog>
  );
}

export function OutfitExperience({
  snapshot,
  options = EMPTY_OPTIONS,
  temp,
  registerOutfitRow,
}: Props) {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const copy = deepFlowCopyFor(language);
  const [compareId, setCompareId] = useState<OutfitItemId | null>(null);
  const [rowNotice, setRowNotice] = useState<Readonly<{
    snapshotId: string;
    message: string;
  }> | null>(null);
  const session = useOutfitSelectionStore((state) => state.session);
  const open = useOutfitSelectionStore((state) => state.open);
  const select = useOutfitSelectionStore((state) => state.select);
  const reset = useOutfitSelectionStore((state) => state.reset);
  const close = useOutfitSelectionStore((state) => state.close);
  const comparisonHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const updateStatusRef = useRef<HTMLParagraphElement | null>(null);
  const [comparisonFocusLifecycle] = useState(createComparisonFocusLifecycle);

  const authorizedOptions = session.kind === 'open'
    && session.base === snapshot
    && session.options === options
    ? session.options
    : EMPTY_OPTIONS;
  const current = session.kind === 'open'
    && session.base === snapshot
    && session.options === options
    ? session.current
    : snapshot;
  const option = useMemo(
    () => authorizedOptions.find((candidate) => candidate.sourceItemId === compareId) ?? null,
    [authorizedOptions, compareId],
  );

  const finishComparison = useCallback((restoreFocus: boolean) => {
    const didClose = comparisonFocusLifecycle.close({ restoreFocus });
    if (didClose) setCompareId(null);
    return didClose;
  }, [comparisonFocusLifecycle]);
  const closeComparison = useCallback(() => {
    finishComparison(true);
  }, [finishComparison]);

  useEffect(() => {
    close();
    open(snapshot, options);
    return close;
  }, [snapshot, options, open, close]);
  useEffect(() => () => comparisonFocusLifecycle.clear(), [comparisonFocusLifecycle]);
  useEffect(() => {
    if (option !== null) comparisonHeadingRef.current?.focus();
  }, [option]);
  useEffect(() => attachOutfitEscapeListener(window, () => {
    if (option !== null) closeComparison();
  }), [option, closeComparison]);
  useEffect(() => {
    if (compareId !== null && option === null) comparisonFocusLifecycle.clear();
  }, [compareId, option, comparisonFocusLifecycle]);

  return (
    <section
      className="outfit-experience ba-temp-root"
      data-temp={temp}
      data-outfit-snapshot={current.snapshotId}
    >
      <OutfitGarmentList
        snapshot={current}
        registerOutfitRow={registerOutfitRow}
        hasAlternative={(id) => authorizedOptions.some((candidate) => candidate.sourceItemId === id)}
        onActivate={(id, trigger) => {
          const available = authorizedOptions.some((candidate) => candidate.sourceItemId === id);
          if (!available) {
            const sourceLabel = current.garments.find((item) => item.itemId === id)?.label ?? '';
            setRowNotice({
              snapshotId: current.snapshotId,
              message: copy.outfit.noAlternatives(localizedGarmentDisplayName(sourceLabel, language)),
            });
            return;
          }
          setRowNotice(null);
          comparisonFocusLifecycle.open(trigger);
          setCompareId(id);
        }}
      />
      {rowNotice?.snapshotId === current.snapshotId && (
        <p className="outfit-row-notice" role="status">{rowNotice.message}</p>
      )}
      {current !== snapshot && (
        <button type="button" className="outfit-reset" onClick={() => { reset(); }}>
          {copy.outfit.reset}
        </button>
      )}
      {option && (
        <OutfitComparisonDialog
          option={option}
          sourceLabel={current.garments.find((item) => item.itemId === option.sourceItemId)?.label ?? ''}
          headingRef={comparisonHeadingRef}
          onConfirm={() => {
            if (select(option).ok) {
              finishComparison(false);
              updateStatusRef.current?.focus();
            }
          }}
          onCancel={closeComparison}
        />
      )}
      <p ref={updateStatusRef} tabIndex={-1} className="sr-only" aria-live="polite">
        {current === snapshot ? copy.outfit.original : copy.outfit.updated}
      </p>
    </section>
  );
}
