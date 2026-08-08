/**
 * PlaggDetailSheet — P6 library affordance ("Se alternativer i biblioteket").
 *
 * Optional `onOpenLibrary` prop: renders the link only when wired (backward
 * compatible with every existing call site), and — the "must never dead-end"
 * requirement — still renders it for a garment with NO alternative data at
 * all (bleie has no entry in lib/wool-layers/alternatives.ts), so there is
 * always somewhere to go even when the "Alternative plagg" section itself
 * is empty.
 */
import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import i18n from '../../i18n/index.js';
import { PlaggDetailSheet } from '../PlaggDetailSheet.js';

await i18n.changeLanguage('no');

describe('PlaggDetailSheet — "Se alternativer i biblioteket" (P6)', () => {
  it('renders the affordance when onOpenLibrary is provided (garment WITH alternatives, ullsokker)', () => {
    const markup = renderToStaticMarkup(
      <PlaggDetailSheet
        garmentId="ullsokker"
        isOpen={false}
        onClose={() => undefined}
        triggerRef={createRef<HTMLElement>()}
        onOpenLibrary={() => undefined}
      />,
    );
    expect(markup).toContain('Alternative plagg');
    expect(markup).toContain('Se alternativer i biblioteket');
  });

  it('still renders the affordance for a garment WITHOUT alternative data (bleie) — no dead-end', () => {
    const markup = renderToStaticMarkup(
      <PlaggDetailSheet
        garmentId="bleie"
        isOpen={false}
        onClose={() => undefined}
        triggerRef={createRef<HTMLElement>()}
        onOpenLibrary={() => undefined}
      />,
    );
    expect(markup).not.toContain('Alternative plagg');
    expect(markup).toContain('Se alternativer i biblioteket');
  });

  it('omits the affordance entirely when no opener is wired (existing call sites stay unchanged)', () => {
    const markup = renderToStaticMarkup(
      <PlaggDetailSheet
        garmentId="ullsokker"
        isOpen={false}
        onClose={() => undefined}
        triggerRef={createRef<HTMLElement>()}
      />,
    );
    expect(markup).not.toContain('Se alternativer i biblioteket');
  });
});
