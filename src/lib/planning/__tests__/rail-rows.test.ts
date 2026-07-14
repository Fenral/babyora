import { describe, expect, it } from 'vitest';
import { buildRailRows } from '../rail-rows.js';
import type { ChangeEvent } from '../change-events.js';

const ev = (hour: number, kind: ChangeEvent['kind'] = 'add'): ChangeEvent => ({ hour, kind, garments: ['x'] });

describe('buildRailRows', () => {
  it('ingen endringer → én kollapset rad for hele dagen', () => {
    expect(buildRailRows(8, 18, [])).toEqual([{ type: 'collapsed', untilLabel: 'hele dagen' }]);
  });

  it('interleaver kollapsede perioder mellom endringer', () => {
    const rows = buildRailRows(8, 18, [ev(12), ev(16)]);
    expect(rows.map((r) => r.type)).toEqual(['collapsed', 'change', 'collapsed', 'change', 'collapsed']);
    expect((rows[0] as { untilLabel: string }).untilLabel).toBe('12:00');
    expect((rows[2] as { untilLabel: string }).untilLabel).toBe('16:00');
    expect((rows[4] as { untilLabel: string }).untilLabel).toBe('resten av dagen');
  });

  it('endring på starttid gir ingen ledende kollaps', () => {
    const rows = buildRailRows(8, 18, [ev(8)]);
    expect(rows[0].type).toBe('change');
  });

  it('siste endring på slutttid gir ingen ETTERFØLGENDE kollaps', () => {
    const rows = buildRailRows(8, 18, [ev(18)]);
    // Ledende «frem til 18:00» er korrekt (uendret 08–18), men ingen hale etterpå.
    expect(rows.at(-1)?.type).toBe('change');
  });
});
