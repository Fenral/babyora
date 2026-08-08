import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { layoutOutfitMap } from '../../lib/outfit/outfit-map-layout.js';
import type { OutfitItemId, OutfitTruthSnapshotV1 } from '../../lib/outfit/outfit-truth.js';
import { deepFlowCopyFor, localizedGarmentDisplayName } from '../../screens/deep-flow-copy.js';
import { GarmentThumbnail } from './GarmentThumbnail.js';

type Props = Readonly<{
  snapshot: OutfitTruthSnapshotV1;
  selectedId: OutfitItemId | null;
  highlightedId: OutfitItemId | null;
  captionId: string;
  onActivate: (itemId: OutfitItemId) => void;
  onFocus: (itemId: OutfitItemId | null) => void;
  onHover: (itemId: OutfitItemId | null) => void;
}>;

export function Antrekkskart({ snapshot, selectedId, highlightedId, captionId, onActivate, onFocus, onHover }: Props) {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const copy = deepFlowCopyFor(language);
  // Use the strictest supported presentation constraints as the canonical
  // viewBox. Scaling that viewBox up preserves separation at 390/560px, while
  // 320px and 200% text retain the layout engine's full target sizing.
  const layout = layoutOutfitMap(snapshot, 320, { textScale: 2 });
  if (layout.kind !== 'layout') {
    return <p className="outfit-map-status" data-outfit-map-status="unavailable">{copy.outfit.mapUnavailable}</p>;
  }
  const garmentById = new Map(snapshot.garments.map((garment) => [garment.itemId, garment]));
  return <section className={`outfit-map outfit-map--${layout.mode}`} aria-label={copy.outfit.map} data-outfit-map-mode={layout.mode} data-outfit-layout-width={layout.width} data-outfit-text-scale={layout.textScale} style={{ aspectRatio: `${layout.width} / ${layout.height}` }}>
    <svg className="outfit-map__connectors" viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true">
      {layout.nodes.map((node) => <polyline key={node.itemId} data-outfit-connector={node.itemId} className={highlightedId === node.itemId ? 'is-highlighted' : ''} points={node.connector.map((point) => `${point.x},${point.y}`).join(' ')} />)}
    </svg>
    {layout.nodes.map((node) => {
      const garment = garmentById.get(node.itemId)!;
      const active = highlightedId === node.itemId;
      const style = { insetInlineStart: `${(node.box.x / layout.width) * 100}%`, insetBlockStart: `${(node.box.y / layout.height) * 100}%`, inlineSize: `${(node.box.width / layout.width) * 100}%`, blockSize: `${(node.box.height / layout.height) * 100}%` } as CSSProperties;
      // T1A: brukersynlig navn (aria-label) via displayNameForDbString —
      // GarmentThumbnail beholder den RÅ labelen som bilde-oppslagsnøkkel.
      return <button key={node.itemId} type="button" data-outfit-map-node={node.itemId} className={`outfit-map__node ${active ? 'is-highlighted' : ''}`} style={style} aria-describedby={captionId} aria-label={`${garment.order}. ${localizedGarmentDisplayName(garment.label, language)}, ${copy.outfit.categories[garment.category] ?? copy.outfit.bodyGarment}, ${copy.outfit.bodyRegions[garment.bodyRegion] ?? copy.outfit.bodyGarment}`} aria-pressed={selectedId === node.itemId} onClick={() => onActivate(node.itemId)} onFocus={() => onFocus(node.itemId)} onBlur={() => onFocus(null)} onPointerEnter={() => onHover(node.itemId)} onPointerLeave={() => onHover(null)}><GarmentThumbnail label={garment.label} className="outfit-map__thumbnail" /><span className="outfit-map__ordinal" aria-hidden="true">{garment.order}</span></button>;
    })}
  </section>;
}
