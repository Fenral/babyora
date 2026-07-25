import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const motionHarness = vi.hoisted(() => ({
  cleanups: [] as Array<() => void>,
  divProps: [] as Array<Record<string, unknown>>,
}));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useEffect: (
      effect: () => void | (() => void),
    ) => {
      const cleanup = effect();
      if (typeof cleanup === 'function') motionHarness.cleanups.push(cleanup);
    },
  };
});

vi.mock('react-dom', () => ({
  createPortal: (node: unknown) => node,
}));

vi.mock('motion/react', async () => {
  const React = await import('react');
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    MotionConfig: ({ children }: { children: React.ReactNode }) => children,
    motion: {
      div: (props: Record<string, unknown>) => {
        motionHarness.divProps.push(props);
        const {
          animate: _animate,
          initial: _initial,
          onAnimationComplete: _onAnimationComplete,
          transition: _transition,
          ...domProps
        } = props;
        return React.createElement('div', domProps);
      },
    },
  };
});
import {
  createOutfitTransitionOverlayModel,
  OutfitTransitionOverlay,
  type OutfitTransitionPresentation,
} from './OutfitTransitionOverlay.js';
import type { EligibleTransitionSnapshot } from '../../lib/outfit-transition/eligibility.js';

const snapshot: EligibleTransitionSnapshot = Object.freeze({
  identity: Object.freeze({
    snapshotId: 'snapshot-1',
    recommendationFingerprint: 'fingerprint-1',
    transitionContextId: 'transition-1',
  }),
  viewport: Object.freeze({
    width: 390,
    height: 844,
    scrollX: 0,
    scrollY: 0,
    orientation: 'portrait',
  }),
  items: Object.freeze([
    Object.freeze({
      itemId: 'visible-shell',
      sourceRect: Object.freeze({ x: 20, y: 100, width: 80, height: 32 }),
      targetRect: Object.freeze({ x: 40, y: 400, width: 240, height: 48 }),
    }),
    Object.freeze({
      itemId: 'visible-hat',
      sourceRect: Object.freeze({ x: 280, y: 120, width: 70, height: 30 }),
      targetRect: Object.freeze({ x: 40, y: 460, width: 240, height: 48 }),
    }),
  ]),
});

const presentations: readonly OutfitTransitionPresentation[] = Object.freeze([
  Object.freeze({ itemId: 'visible-shell', label: 'Dress' }),
  Object.freeze({ itemId: 'visible-hat', label: 'Lue' }),
]);

describe('OutfitTransitionOverlay contract', () => {
  beforeEach(() => {
    motionHarness.cleanups.length = 0;
    motionHarness.divProps.length = 0;
    vi.stubGlobal('document', { body: {} });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates one immutable exact-ID transform clone per validated presentation', () => {
    const result = createOutfitTransitionOverlayModel(snapshot, presentations);

    expect(result.kind).toBe('ready');
    if (result.kind !== 'ready') return;
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      itemId: 'visible-shell',
      label: 'Dress',
      sourceStyle: {
        left: 20,
        top: 100,
        width: 80,
        height: 32,
      },
      destination: {
        x: 20,
        y: 300,
        scaleX: 3,
        scaleY: 1.5,
      },
    });
    expect(result.items[1]?.delayMs).toBeGreaterThan(0);
    expect(result.items[1]?.endMs).toBe(1_250);
    expect(result.totalDurationMs).toBe(1_250);
    expect(Object.isFrozen(result.items)).toBe(true);
  });

  it('fails closed when presentation IDs are missing, duplicated, reordered, or unlisted', () => {
    const invalidSets = [
      presentations.slice(0, 1),
      [presentations[0], presentations[0]],
      [...presentations].reverse(),
      [...presentations, { itemId: 'equipment', label: 'Varmepose' }],
    ];

    for (const invalid of invalidSets) {
      expect(
        createOutfitTransitionOverlayModel(snapshot, invalid),
      ).toEqual({ kind: 'static-only' });
    }
  });

  it('fails closed for unavailable or non-positive geometry', () => {
    expect(createOutfitTransitionOverlayModel(null, presentations)).toEqual({
      kind: 'static-only',
    });
    const invalid = {
      ...snapshot,
      items: [{
        ...snapshot.items[0],
        sourceRect: { ...snapshot.items[0].sourceRect, width: 0 },
      }],
    };
    expect(
      createOutfitTransitionOverlayModel(
        invalid as EligibleTransitionSnapshot,
        [presentations[0]],
      ),
    ).toEqual({ kind: 'static-only' });
  });

  it('renders a semantic-hidden pointer-inert portal with no focusable descendants', () => {
    const html = renderToStaticMarkup(
      <OutfitTransitionOverlay
        snapshot={snapshot}
        presentations={presentations}
        onFinish={() => undefined}
        onAbort={() => undefined}
      />,
    );

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('data-outfit-transition-overlay');
    expect(html).not.toMatch(/tabindex|<a\b|<button\b|<input\b|<select\b|<textarea\b/u);
    expect(html.match(/data-outfit-transition-clone=/gu)).toHaveLength(2);
    expect(html.match(/pointer-events:none/gu)).toHaveLength(3);
    expect(html).not.toMatch(
      /\son(?:click|key(?:down|up|press)|focus|blur)=/u,
    );
  });

  it('finishes once and does not abort again when the completed portal unmounts', () => {
    const onFinish = vi.fn();
    const onAbort = vi.fn();
    renderToStaticMarkup(
      <OutfitTransitionOverlay
        snapshot={snapshot}
        presentations={presentations}
        onFinish={onFinish}
        onAbort={onAbort}
      />,
    );

    const completion = motionHarness.divProps.at(-1)?.onAnimationComplete;
    expect(completion).toBeTypeOf('function');
    (completion as () => void)();
    (completion as () => void)();
    motionHarness.cleanups.forEach((cleanup) => cleanup());
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onAbort).not.toHaveBeenCalled();
  });

  it('aborts once on cancellation/unmount and leaves no active clone lifecycle', () => {
    const onFinish = vi.fn();
    const onAbort = vi.fn();
    renderToStaticMarkup(
      <OutfitTransitionOverlay
        snapshot={snapshot}
        presentations={presentations}
        onFinish={onFinish}
        onAbort={onAbort}
      />,
    );

    motionHarness.cleanups.forEach((cleanup) => cleanup());
    motionHarness.cleanups.forEach((cleanup) => cleanup());
    const completion = motionHarness.divProps.at(-1)?.onAnimationComplete;
    (completion as () => void)();
    expect(onAbort).toHaveBeenCalledTimes(1);
    expect(onFinish).not.toHaveBeenCalled();
  });

  it('settles reduced-motion and unavailable rendering statically once without clones', () => {
    const reducedAbort = vi.fn();
    const reduced = renderToStaticMarkup(
      <OutfitTransitionOverlay
        snapshot={snapshot}
        presentations={presentations}
        reducedMotion
        onFinish={() => undefined}
        onAbort={reducedAbort}
      />,
    );
    expect(reduced).toBe('');
    expect(reducedAbort).toHaveBeenCalledTimes(1);
    expect(motionHarness.divProps).toHaveLength(0);

    motionHarness.cleanups.length = 0;
    vi.stubGlobal('document', undefined);
    const unavailableAbort = vi.fn();
    const unavailable = renderToStaticMarkup(
      <OutfitTransitionOverlay
        snapshot={snapshot}
        presentations={presentations}
        onFinish={() => undefined}
        onAbort={unavailableAbort}
      />,
    );
    expect(unavailable).toBe('');
    expect(unavailableAbort).toHaveBeenCalledTimes(1);
  });
});
