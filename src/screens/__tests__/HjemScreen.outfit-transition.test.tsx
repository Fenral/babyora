import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { HomeGarmentPills } from '../HjemScreen.js';
import type {
  Phase2HomeSourceSelection,
  RegisterHomeAnchor,
} from '../../lib/outfit-transition/phase2-adapter.js';
import type { OutfitItemId } from '../../lib/outfit/outfit-truth.js';

const screenPath = 'src/screens/HjemScreen.tsx';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

const readySelection: Phase2HomeSourceSelection = Object.freeze({
  kind: 'ready',
  identity: Object.freeze({
    snapshotId: 'snapshot-1',
    recommendationFingerprint: 'fingerprint-1',
    transitionContextId: 'transition-1',
  }),
  sources: Object.freeze([
    Object.freeze({
      itemId: 'garment-wool-body' as OutfitItemId,
      label: 'Ullbody',
    }),
    Object.freeze({
      itemId: 'garment-wool-hat' as OutfitItemId,
      label: 'Ullue',
    }),
  ]),
});

describe('Hjem outfit-transition sources', () => {
  it('puts exact adapter item IDs directly on the existing visible garment pills', () => {
    const registerHomeAnchor = vi.fn<RegisterHomeAnchor>();
    const markup = renderToStaticMarkup(
      <HomeGarmentPills
        selection={readySelection}
        fallbackAnchors={[]}
        registerHomeAnchor={registerHomeAnchor}
        styleForIndex={() => ({
          display: 'inline-block',
          width: 80,
          height: 24,
        })}
      />,
    );

    expect(markup).toContain(
      'data-outfit-transition-source="garment-wool-body"',
    );
    expect(markup).toContain(
      'data-outfit-transition-source="garment-wool-hat"',
    );
    expect(markup).toContain('Ullbody');
    expect(markup).toContain('Ullue');
    expect((markup.match(/<img/g) ?? []).length).toBe(2);
    expect(markup).not.toMatch(/data-outfit-transition-source[^>]*aria-hidden/u);
    expect(markup).not.toContain('opacity:0');
  });

  it('keeps legacy visual pills but registers no identity on static-only truth', () => {
    const markup = renderToStaticMarkup(
      <HomeGarmentPills
        selection={{ kind: 'static-only', reason: 'unavailable' }}
        fallbackAnchors={[
          { label: 'Legacy ullbody' },
          { label: 'Legacy ullue' },
        ]}
        registerHomeAnchor={vi.fn()}
        styleForIndex={() => ({ display: 'inline-block' })}
      />,
    );

    expect(markup).toContain('Legacy ullbody');
    expect(markup).toContain('Legacy ullue');
    expect((markup.match(/<img/g) ?? []).length).toBe(2);
    expect(markup).not.toContain('data-outfit-transition-source');
  });

  it('contains no hidden/index-guessed transition source path', () => {
    const contents = source(screenPath);

    expect(contents).toContain('HomeGarmentPills');
    expect(contents).toContain('selectHomeSources');
    expect(contents).not.toContain('HomeTransitionAnchor');
    expect(contents).not.toContain('getHomeTransitionItemIds');
    expect(contents).not.toMatch(
      /data-outfit-transition-source[\s\S]{0,500}opacity:\s*0/,
    );
  });
});
