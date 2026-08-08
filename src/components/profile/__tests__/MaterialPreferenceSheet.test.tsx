import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { MaterialPreferenceSheet } from '../MaterialPreferenceSheet';

const copy = {
  title: 'Material preference',
  intro: 'Choose a material.',
  done: 'Done',
  close: 'Close material preference',
  options: {
    best_for_conditions: { label: 'Best', description: 'Adapts.' },
    prefer_wool: { label: 'Wool first', description: 'Prefer wool.' },
    prefer_fleece: { label: 'Fleece first', description: 'Prefer fleece.' },
    prefer_cotton: { label: 'Cotton first', description: 'Prefer cotton.' },
  },
} as const;

describe('MaterialPreferenceSheet', () => {
  it('offers best, wool, fleece, and cotton without a separate legacy option', () => {
    const html = renderToStaticMarkup(
      <MaterialPreferenceSheet
        open={false}
        value="best_for_conditions"
        copy={copy}
        onChange={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(html.match(/name="material-preference"/gu)).toHaveLength(4);
    expect(html).toContain('value="best_for_conditions"');
    expect(html).toContain('value="prefer_wool"');
    expect(html).toContain('value="prefer_fleece"');
    expect(html).toContain('value="prefer_cotton"');
    expect(html).not.toContain('value="avoid_wool"');
    expect(html).toContain('Cotton first');
  });

  it('renders legacy avoid_wool as the selected fleece-first option', () => {
    const html = renderToStaticMarkup(
      <MaterialPreferenceSheet
        open={false}
        value="avoid_wool"
        copy={copy}
        onChange={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const fleeceInput = html.match(/<input[^>]*value="prefer_fleece"[^>]*>/u)?.[0];
    expect(fleeceInput).toContain('checked=""');
    expect(fleeceInput).toContain('autofocus=""');
  });
});
