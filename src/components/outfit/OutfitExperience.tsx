import { useEffect, useMemo, useState } from 'react';
import type { OutfitAlternativeOptionV1 } from '../../lib/outfit/alternative-options.js';
import type { RegisterOutfitRow } from '../../lib/outfit/outfit-transition-contract.js';
import type { OutfitItemId, OutfitTruthSnapshotV1 } from '../../lib/outfit/outfit-truth.js';
import { useOutfitSelectionStore } from '../../state/outfit-selection-store.js';
import { Antrekkskart } from './Antrekkskart.js';
import { OutfitGarmentList } from './OutfitGarmentList.js';
import './Antrekkskart.css';

type Props = Readonly<{ snapshot: OutfitTruthSnapshotV1; options?: readonly OutfitAlternativeOptionV1[]; temp: 'kald' | 'mild' | 'varm'; registerOutfitRow?: RegisterOutfitRow; }>;
export function OutfitExperience({ snapshot, options = [], temp, registerOutfitRow }: Props) {
  const [selectedId, setSelectedId] = useState<OutfitItemId | null>(null); const [focusId, setFocusId] = useState<OutfitItemId | null>(null); const [hoverId, setHoverId] = useState<OutfitItemId | null>(null); const [applied, setApplied] = useState<OutfitTruthSnapshotV1 | null>(null); const [compareId, setCompareId] = useState<OutfitItemId | null>(null);
  const open = useOutfitSelectionStore((state) => state.open); const select = useOutfitSelectionStore((state) => state.select); const reset = useOutfitSelectionStore((state) => state.reset);
  useEffect(() => { open(snapshot, options); }, [snapshot, options, open]);
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { setFocusId(null); setHoverId(null); setCompareId(null); } }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, []);
  const current = applied ?? snapshot; const highlightedId = focusId ?? hoverId ?? selectedId; const captionId = 'outfit-active-caption';
  const option = useMemo(() => options.find((candidate) => candidate.sourceItemId === compareId) ?? null, [options, compareId]);
  const activate = (id: OutfitItemId) => setSelectedId(id);
  return <section className="outfit-experience ba-temp-root" data-temp={temp}><Antrekkskart snapshot={current} selectedId={selectedId} highlightedId={highlightedId} captionId={captionId} onActivate={activate} onFocus={setFocusId} onHover={setHoverId} /><p id={captionId} className="outfit-active-caption">{(current.garments.find((item) => item.itemId === highlightedId) ?? current.garments[0])?.label ?? 'Antrekk'}</p><OutfitGarmentList snapshot={current} selectedId={selectedId} highlightedId={highlightedId} captionId={captionId} registerOutfitRow={registerOutfitRow} onActivate={activate} onFocus={setFocusId} onHover={setHoverId} hasAlternative={(id) => options.some((candidate) => candidate.sourceItemId === id)} onAlternative={setCompareId} />{current !== snapshot && <button type="button" onClick={() => { reset(); setApplied(null); }}>Tilbakestill antrekk</button>}{option && <section role="dialog" aria-modal="true" aria-label={`Alternativ fra ${current.garments.find((item) => item.itemId === option.sourceItemId)?.label ?? ''} til ${option.targetLabel}`} className="outfit-comparison"><h2>{option.targetLabel}</h2><p>Fordeler: {option.comparison.advantages.join(', ')}</p><p>Avveininger: {option.comparison.tradeoffs.join(', ')}</p><h3>Resultatet</h3><ol>{option.outcome.garments.map((item) => <li key={item.itemId}>{item.order}. {item.label}</li>)}</ol><button type="button" onClick={() => { if (select(option).ok) { setApplied(option.outcome); setSelectedId(null); setCompareId(null); } }}>Velg dette antrekket</button><button type="button" onClick={() => setCompareId(null)}>Avbryt</button></section>}<div className="outfit-recovery-copy" /></section>;
}
