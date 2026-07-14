/**
 * R7 Task 5 — Planlegg-endringsrail (design-spec §6, retning B).
 *
 * Én vertikal <ol> gjennom dagen. Bare meningsfulle endringer får markør;
 * uendrede perioder er egne, ikke-interaktive rader. Konsumerer ferdig-
 * avledede ChangeEvent-er (aldri egen telling).
 *
 * A11y (accessibility-lead 2026-07-14):
 *  1. <ol aria-label> — hver rad (markør OG kollapset periode) er en <li>.
 *  2. Handlingen ligger i TEKST (changeActionSentence navngir verbet);
 *     ikonet er aria-hidden.
 *  3. Utvidbar markør = <button aria-expanded> disclosure; kollapset
 *     periode er statisk tekst.
 *  4. Ikon-glyf skiller handlingstype (ikke bare farge).
 *  5. Tid som ekte <time>-tekst.
 */

import { useState, type CSSProperties } from 'react';
import { changeActionSentence } from '../../lib/planning/change-sentence.js';
import type { ChangeEvent, ChangeKind } from '../../lib/planning/change-events.js';
import type { RailRow } from '../../lib/planning/rail-rows.js';

type Props = {
  rows: RailRow[];
};

const KIND_COLOR: Record<ChangeKind, string> = {
  add: 'var(--layer-innerst)',
  remove: 'var(--ink-500)',
  rain: 'var(--layer-ytterst)',
  swap: 'var(--layer-mellom)',
  location: 'var(--accent-temp)',
};

function KindIcon({ kind }: { kind: ChangeKind }) {
  // Distinkte glyfer per handlingstype (a11y krav 4) — dekorativt.
  const p = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  switch (kind) {
    case 'add': return <svg {...p}><path d="M12 5v14M5 12h14" /></svg>;
    case 'remove': return <svg {...p}><path d="M5 12h14" /></svg>;
    case 'rain': return <svg {...p}><path d="M12 3c3 4 5 6.5 5 9a5 5 0 0 1-10 0c0-2.5 2-5 5-9Z" /></svg>;
    case 'swap': return <svg {...p}><path d="M4 8h13l-3-3M20 16H7l3 3" /></svg>;
    case 'location': return <svg {...p}><path d="M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10Z" /><circle cx="12" cy="11" r="2" /></svg>;
    default: return null;
  }
}

const ol: CSSProperties = { listStyle: 'none', margin: 0, padding: '0 0 0 22px', position: 'relative', display: 'flex', flexDirection: 'column', gap: 0 };
const railLine: CSSProperties = { position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, background: 'var(--ink-200)' };
const collapsedLi: CSSProperties = { position: 'relative', padding: '10px 0 10px 14px', color: 'var(--ink-500)', fontSize: '0.8125rem' };
const collapsedDot: CSSProperties = { position: 'absolute', left: -19, top: 15, width: 8, height: 8, borderRadius: '50%', background: 'var(--surface)', border: '2px solid var(--ink-200)' };
const changeLi: CSSProperties = { position: 'relative', padding: '4px 0' };
const markerBtn: CSSProperties = { width: '100%', textAlign: 'left', background: 'var(--surface-elevated)', border: '1px solid var(--ink-200)', borderRadius: 14, padding: '12px 14px 12px 44px', minHeight: 44, cursor: 'pointer', color: 'var(--ink-900)', font: 'inherit', position: 'relative' };
const marker: CSSProperties = { position: 'absolute', left: -19, top: 16, width: 26, height: 26, borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'var(--surface-pure, #fff)' };
const timeStyle: CSSProperties = { fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: '0.8125rem', color: 'var(--ink-700)' };
const actionStyle: CSSProperties = { fontWeight: 650, fontSize: '0.9375rem', margin: '2px 0 0' };
const detailStyle: CSSProperties = { margin: '8px 0 0', fontSize: '0.8125rem', color: 'var(--ink-700)', lineHeight: 1.5 };

function ChangeMarker({ event }: { event: ChangeEvent }) {
  const [open, setOpen] = useState(false);
  const sentence = changeActionSentence(event);
  return (
    <li style={changeLi}>
      <button type="button" style={markerBtn} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span aria-hidden="true" style={{ ...marker, left: -32, background: KIND_COLOR[event.kind] }}>
          <KindIcon kind={event.kind} />
        </span>
        <time style={timeStyle}>{String(event.hour).padStart(2, '0')}:00</time>
        <p style={actionStyle}>{sentence}</p>
        {open && event.garments.length > 0 && (
          <p style={detailStyle}>{event.garments.join(' · ')}</p>
        )}
      </button>
    </li>
  );
}

export function PlanChangeRail({ rows }: Props) {
  return (
    <ol style={ol} aria-label="Antrekksendringer gjennom dagen">
      <span aria-hidden="true" style={railLine} />
      {rows.map((row, i) =>
        row.type === 'collapsed' ? (
          <li key={`c-${i}`} style={collapsedLi}>
            <span aria-hidden="true" style={collapsedDot} />
            {row.untilLabel === 'hele dagen'
              ? 'Samme antrekk hele dagen'
              : `Samme antrekk frem til ${row.untilLabel}`}
          </li>
        ) : (
          <ChangeMarker key={`e-${row.event.hour}-${i}`} event={row.event} />
        ),
      )}
    </ol>
  );
}
