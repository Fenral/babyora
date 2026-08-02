import { useCallback, useEffect, useMemo, useRef, useState, type Ref } from 'react';
import { displayNameForDbString } from '../../data/garment-display-names.js';
import type { OutfitAlternativeOptionV1 } from '../../lib/outfit/alternative-options.js';
import type { RegisterOutfitRow } from '../../lib/outfit/outfit-transition-contract.js';
import type { OutfitItemId, OutfitTruthSnapshotV1 } from '../../lib/outfit/outfit-truth.js';
import { useOutfitSelectionStore } from '../../state/outfit-selection-store.js';
import { Antrekkskart } from './Antrekkskart.js';
import { OutfitGarmentList } from './OutfitGarmentList.js';
import './Antrekkskart.css';

type Props = Readonly<{ snapshot: OutfitTruthSnapshotV1; options?: readonly OutfitAlternativeOptionV1[]; temp: 'kald' | 'mild' | 'varm'; registerOutfitRow?: RegisterOutfitRow; }>;
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
  // T1A: alle brukersynlige plaggnavn i dialogen går via visningsnavn-kilden.
  return <dialog open aria-labelledby="outfit-comparison-title" className="outfit-comparison"><h2 ref={headingRef} tabIndex={-1} id="outfit-comparison-title">{displayNameForDbString(sourceLabel)} til {displayNameForDbString(option.targetLabel)}</h2><p>Fordeler: {option.comparison.advantages.join(', ')}</p><p>Avveininger: {option.comparison.tradeoffs.join(', ')}</p><h3>Resultatet</h3><h4>Klær</h4><ol data-outfit-comparison-garments>{option.outcome.garments.map((item) => <li key={item.itemId}>{item.order}. {displayNameForDbString(item.label)}</li>)}</ol>{option.outcome.equipment.length > 0 && <><h4>Utstyr</h4><ul data-outfit-comparison-equipment>{option.outcome.equipment.map((item) => <li key={item.itemId}>{displayNameForDbString(item.label)}</li>)}</ul></>}<button type="button" onClick={onConfirm}>Velg dette antrekket</button><button type="button" onClick={onCancel}>Avbryt</button></dialog>;
}

export function OutfitExperience({ snapshot, options = EMPTY_OPTIONS, temp, registerOutfitRow }: Props) {
  const [selectedId, setSelectedId] = useState<OutfitItemId | null>(null); const [focusId, setFocusId] = useState<OutfitItemId | null>(null); const [hoverId, setHoverId] = useState<OutfitItemId | null>(null); const [compareId, setCompareId] = useState<OutfitItemId | null>(null);
  const session = useOutfitSelectionStore((state) => state.session); const open = useOutfitSelectionStore((state) => state.open); const select = useOutfitSelectionStore((state) => state.select); const reset = useOutfitSelectionStore((state) => state.reset); const close = useOutfitSelectionStore((state) => state.close);
  const comparisonHeadingRef = useRef<HTMLHeadingElement | null>(null); const captionRef = useRef<HTMLParagraphElement | null>(null);
  const [comparisonFocusLifecycle] = useState(createComparisonFocusLifecycle);
  const authorizedOptions = session.kind === 'open' && session.base === snapshot && session.options === options ? session.options : EMPTY_OPTIONS;
  const current = session.kind === 'open' && session.base === snapshot && session.options === options ? session.current : snapshot; const highlightedId = focusId ?? hoverId ?? selectedId; const captionId = 'outfit-active-caption';
  const option = useMemo(() => authorizedOptions.find((candidate) => candidate.sourceItemId === compareId) ?? null, [authorizedOptions, compareId]);
  const finishComparison = useCallback((restoreFocus: boolean) => {
    const didClose = comparisonFocusLifecycle.close({ restoreFocus });
    if (didClose) setCompareId(null);
    return didClose;
  }, [comparisonFocusLifecycle]);
  const closeComparison = useCallback(() => {
    finishComparison(true);
  }, [finishComparison]);
  useEffect(() => { close(); open(snapshot, options); return close; }, [snapshot, options, open, close]);
  useEffect(() => () => comparisonFocusLifecycle.clear(), [comparisonFocusLifecycle]);
  useEffect(() => { if (option !== null) comparisonHeadingRef.current?.focus(); }, [option]);
  useEffect(() => attachOutfitEscapeListener(window, () => {
    setFocusId(null);
    setHoverId(null);
    if (option !== null) closeComparison();
  }), [option, closeComparison]);
  useEffect(() => {
    if (compareId !== null && option === null) comparisonFocusLifecycle.clear();
  }, [compareId, option, comparisonFocusLifecycle]);
  const activate = (id: OutfitItemId) => setSelectedId(id);
  // T1A: den synlige captionen («tynt ullsett»-teksten) viser visningsnavn.
  const captionSource = (current.garments.find((item) => item.itemId === highlightedId) ?? current.garments[0])?.label;
  return <section className="outfit-experience ba-temp-root" data-temp={temp}><Antrekkskart snapshot={current} selectedId={selectedId} highlightedId={highlightedId} captionId={captionId} onActivate={activate} onFocus={setFocusId} onHover={setHoverId} /><p ref={captionRef} tabIndex={-1} id={captionId} className="outfit-active-caption">{captionSource !== undefined ? displayNameForDbString(captionSource) : 'Antrekk'}</p><OutfitGarmentList snapshot={current} selectedId={selectedId} highlightedId={highlightedId} captionId={captionId} registerOutfitRow={registerOutfitRow} onActivate={activate} onFocus={setFocusId} onHover={setHoverId} hasAlternative={(id) => authorizedOptions.some((candidate) => candidate.sourceItemId === id)} onAlternative={(id, trigger) => { comparisonFocusLifecycle.open(trigger); setCompareId(id); }} />{current !== snapshot && <button type="button" onClick={() => { reset(); }}>Tilbakestill antrekk</button>}{option && <OutfitComparisonDialog option={option} sourceLabel={current.garments.find((item) => item.itemId === option.sourceItemId)?.label ?? ''} headingRef={comparisonHeadingRef} onConfirm={() => { if (select(option).ok) { setSelectedId(null); finishComparison(false); captionRef.current?.focus(); } }} onCancel={closeComparison} />}<div className="outfit-recovery-copy" /></section>;
}
