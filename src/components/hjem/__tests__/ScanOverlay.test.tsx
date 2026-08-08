import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ScanOverlay, ScanStatusBlock } from '../ScanOverlay.js';
import {
  isScanOverlaySuppressed,
  type OutfitTransitionStatusLike,
} from '../scan-overlay-guard.js';

const ROWS = [
  { label: 'Været nå', value: '4°, lett yr' },
  { label: 'Aktivitet', value: 'Utenfor vogn' },
  { label: 'Lillian', value: '9 måneder' },
] as const;

function renderOverlay(outfitTransitionStatus: OutfitTransitionStatusLike) {
  return renderToStaticMarkup(
    <ScanOverlay
      language="no"
      cityLabel="Trondheim"
      nuance="rain"
      rows={ROWS}
      spinningLabel="Lag for lag"
      spinningValue="setter sammen…"
      totalDurationMs={2100}
      reducedMotion={false}
      outfitTransitionStatus={outfitTransitionStatus}
    />,
  );
}

function renderStatus(outfitTransitionStatus: OutfitTransitionStatusLike) {
  return renderToStaticMarkup(
    <ScanStatusBlock
      language="no"
      headline="Kler på Lillian i tankene…"
      subline="Tar bare et lite øyeblikk."
      onSkip={vi.fn()}
      outfitTransitionStatus={outfitTransitionStatus}
    />,
  );
}

describe('isScanOverlaySuppressed (pure guard predicate)', () => {
  it('suppresses exactly captured/ready/playing', () => {
    expect(isScanOverlaySuppressed('captured')).toBe(true);
    expect(isScanOverlaySuppressed('ready')).toBe(true);
    expect(isScanOverlaySuppressed('playing')).toBe(true);
  });

  it('does not suppress idle/settled', () => {
    expect(isScanOverlaySuppressed('idle')).toBe(false);
    expect(isScanOverlaySuppressed('settled')).toBe(false);
  });
});

describe('ScanOverlay — mutual-exclusion guard against the outfit-transition coordinator (risk #1)', () => {
  it('renders the full scan choreography when the coordinator is idle', () => {
    const html = renderOverlay('idle');
    expect(html).toContain('aria-label="Beregner antrekk"');
    expect(html).toContain('Været nå');
    expect(html).toContain('4°, lett yr');
    expect(html).toContain('Lag for lag');
  });

  it('renders the full scan choreography when the coordinator is settled (post-transition)', () => {
    expect(renderOverlay('settled')).toContain('aria-label="Beregner antrekk"');
  });

  it('renders NOTHING at all — not even an empty wrapper — while the coordinator is captured', () => {
    expect(renderOverlay('captured')).toBe('');
  });

  it('renders NOTHING at all while the coordinator is ready (target snapshot resolved, about to play)', () => {
    expect(renderOverlay('ready')).toBe('');
  });

  it('renders NOTHING at all while the coordinator is playing (garment-flight animation in progress)', () => {
    expect(renderOverlay('playing')).toBe('');
  });

  it('the companion ScanStatusBlock (status text + skip button) obeys the exact same guard', () => {
    expect(renderStatus('idle')).toContain('Kler på Lillian i tankene…');
    expect(renderStatus('captured')).toBe('');
    expect(renderStatus('ready')).toBe('');
    expect(renderStatus('playing')).toBe('');
  });
});

describe('ScanOverlay accessibility', () => {
  it('announces the exact required literal "Beregner antrekk" via a dedicated aria-live=polite region', () => {
    const html = renderStatus('idle');
    expect(html).toMatch(/aria-live="polite"[^>]*>Beregner antrekk</);
  });

  it('the visible (friendlier) mock headline is a separate, decorative element — not what gets announced', () => {
    const html = renderStatus('idle');
    expect(html).toMatch(/<h1[^>]*aria-hidden="true"[^>]*>Kler på Lillian i tankene…<\/h1>/);
  });

  it('the skip shortcut renders with the exact mock copy', () => {
    expect(renderStatus('idle')).toContain('Vis svaret med en gang');
  });
});

describe('ScanOverlay reduced motion', () => {
  it('does not mark the scanline/checks/spinner as animating when reducedMotion is true', () => {
    const html = renderToStaticMarkup(
      <ScanOverlay
        language="no"
        cityLabel="Trondheim"
        nuance="rain"
        rows={ROWS}
        spinningLabel="Lag for lag"
        spinningValue="setter sammen…"
        totalDurationMs={2100}
        reducedMotion
        outfitTransitionStatus="idle"
      />,
    );
    expect(html).not.toContain('data-animate="true"');
    expect(html).toContain('data-animate="false"');
  });

  it('marks the scanline/checks/spinner as animating when reducedMotion is false', () => {
    const html = renderOverlay('idle');
    expect(html).toContain('data-animate="true"');
    expect(html).not.toContain('data-animate="false"');
  });

  it('stamps per-row check-pop delays derived from the full 2.1s choreography (0.55s/1.05s/1.55s)', () => {
    const html = renderOverlay('idle');
    expect(html).toContain('animation-delay:550ms');
    expect(html).toContain('animation-delay:1050ms');
    expect(html).toContain('animation-delay:1550ms');
  });
});
