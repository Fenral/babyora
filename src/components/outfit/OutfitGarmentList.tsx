import { useEffect, useRef } from 'react';
import type { RegisterOutfitRow } from '../../lib/outfit/outfit-transition-contract.js';
import type { OutfitItemId, OutfitTruthSnapshotV1 } from '../../lib/outfit/outfit-truth.js';

type Props = Readonly<{ snapshot: OutfitTruthSnapshotV1; selectedId: OutfitItemId | null; highlightedId: OutfitItemId | null; captionId: string; registerOutfitRow?: RegisterOutfitRow; onActivate: (id: OutfitItemId) => void; onFocus: (id: OutfitItemId | null) => void; onHover: (id: OutfitItemId | null) => void; onAlternative: (id: OutfitItemId, trigger: HTMLButtonElement) => void; hasAlternative: (id: OutfitItemId) => boolean; }>;
function Row({ garment, props }: { garment: OutfitTruthSnapshotV1['garments'][number]; props: Props }) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const { registerOutfitRow } = props;
  useEffect(() => { registerOutfitRow?.(garment.itemId, ref.current); return () => registerOutfitRow?.(garment.itemId, null); }, [garment.itemId, registerOutfitRow]);
  const active = props.highlightedId === garment.itemId;
  return <li><button ref={ref} type="button" data-outfit-row={garment.itemId} className={`outfit-row ${active ? 'is-highlighted' : ''}`} aria-describedby={props.captionId} aria-pressed={props.selectedId === garment.itemId} onClick={() => props.onActivate(garment.itemId)} onFocus={() => props.onFocus(garment.itemId)} onBlur={() => props.onFocus(null)} onPointerEnter={() => props.onHover(garment.itemId)} onPointerLeave={() => props.onHover(null)}><span className="outfit-row__ordinal">{garment.order}</span><span>{garment.label}</span><span className="outfit-row__detail">{garment.category} · {garment.bodyRegion}</span></button>{props.hasAlternative(garment.itemId) && <button type="button" className="outfit-alternative" onClick={(event) => props.onAlternative(garment.itemId, event.currentTarget)}>Se alternativ</button>}</li>;
}
export function OutfitGarmentList(props: Props) { return <section className="outfit-list"><h2>Ta på innerst først</h2><ol>{props.snapshot.garments.map((garment) => <Row key={garment.itemId} garment={garment} props={props} />)}</ol>{props.snapshot.equipment.length > 0 && <section aria-label="Utstyr"><h3>Utstyr</h3><ul>{props.snapshot.equipment.map((item) => <li key={item.itemId}>{item.label}</li>)}</ul></section>}</section>; }
