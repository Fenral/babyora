import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { OutfitAlternativeOptionV1 } from '../../lib/outfit/alternative-options.js';
import type { RegisterOutfitRow } from '../../lib/outfit/outfit-transition-contract.js';
import type { OutfitItemId, OutfitTruthSnapshotV1 } from '../../lib/outfit/outfit-truth.js';
import { useOutfitSelectionStore } from '../../state/outfit-selection-store.js';
import { Antrekkskart } from './Antrekkskart.js';
import { OutfitGarmentList } from './OutfitGarmentList.js';
import './Antrekkskart.css';

type Props = Readonly<{ snapshot: OutfitTruthSnapshotV1; options?: readonly OutfitAlternativeOptionV1[]; temp: 'kald' | 'mild' | 'varm'; registerOutfitRow?: RegisterOutfitRow; }>;
const EMPTY_OPTIONS = Object.freeze([]) as readonly OutfitAlternativeOptionV1[];

export function OutfitExperience({ snapshot, options = EMPTY_OPTIONS, temp, registerOutfitRow }: Props) {
  const [selectedId, setSelectedId] = useState<OutfitItemId | null>(null); const [focusId, setFocusId] = useState<OutfitItemId | null>(null); const [hoverId, setHoverId] = useState<OutfitItemId | null>(null); const [compareId, setCompareId] = useState<OutfitItemId | null>(null);
  const session = useOutfitSelectionStore((state) => state.session); const open = useOutfitSelectionStore((state) => state.open); const select = useOutfitSelectionStore((state) => state.select); const reset = useOutfitSelectionStore((state) => state.reset); const close = useOutfitSelectionStore((state) => state.close);
  const comparisonTriggerRef = useRef<HTMLButtonElement | null>(null); const comparisonHeadingRef = useRef<HTMLHeadingElement | null>(null); const captionRef = useRef<HTMLParagraphElement | null>(null);
  useEffect(() => { close(); open(snapshot, options); return close; }, [snapshot, options, open, close]);
  const closeComparison = useCallback(() => { setCompareId(null); comparisonTriggerRef.current?.focus(); }, []);
  useEffect(() => { if (compareId !== null) comparisonHeadingRef.current?.focus(); }, [compareId]);
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { setFocusId(null); setHoverId(null); closeComparison(); } }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [closeComparison]);
  const authorizedOptions = session.kind === 'open' && session.base === snapshot && session.options === options ? session.options : EMPTY_OPTIONS;
  const current = session.kind === 'open' && session.base === snapshot && session.options === options ? session.current : snapshot; const highlightedId = focusId ?? hoverId ?? selectedId; const captionId = 'outfit-active-caption';
  const option = useMemo(() => authorizedOptions.find((candidate) => candidate.sourceItemId === compareId) ?? null, [authorizedOptions, compareId]);
  const activate = (id: OutfitItemId) => setSelectedId(id);
  return <section className="outfit-experience ba-temp-root" data-temp={temp}><Antrekkskart snapshot={current} selectedId={selectedId} highlightedId={highlightedId} captionId={captionId} onActivate={activate} onFocus={setFocusId} onHover={setHoverId} /><p ref={captionRef} tabIndex={-1} id={captionId} className="outfit-active-caption">{(current.garments.find((item) => item.itemId === highlightedId) ?? current.garments[0])?.label ?? 'Antrekk'}</p><OutfitGarmentList snapshot={current} selectedId={selectedId} highlightedId={highlightedId} captionId={captionId} registerOutfitRow={registerOutfitRow} onActivate={activate} onFocus={setFocusId} onHover={setHoverId} hasAlternative={(id) => authorizedOptions.some((candidate) => candidate.sourceItemId === id)} onAlternative={(id, trigger) => { comparisonTriggerRef.current = trigger; setCompareId(id); }} />{current !== snapshot && <button type="button" onClick={() => { reset(); }}>Tilbakestill antrekk</button>}{option && <dialog open aria-labelledby="outfit-comparison-title" className="outfit-comparison"><h2 ref={comparisonHeadingRef} tabIndex={-1} id="outfit-comparison-title">{current.garments.find((item) => item.itemId === option.sourceItemId)?.label ?? ''} til {option.targetLabel}</h2><p>Fordeler: {option.comparison.advantages.join(', ')}</p><p>Avveininger: {option.comparison.tradeoffs.join(', ')}</p><h3>Resultatet</h3><ol>{option.outcome.garments.map((item) => <li key={item.itemId}>{item.order}. {item.label}</li>)}</ol><button type="button" onClick={() => { if (select(option).ok) { setSelectedId(null); setCompareId(null); captionRef.current?.focus(); } }}>Velg dette antrekket</button><button type="button" onClick={closeComparison}>Avbryt</button></dialog>}<div className="outfit-recovery-copy" /></section>;
}
