/**
 * PaywallDialog — P2 hard paywall `dismissable` contract (structural render
 * check, same renderToStaticMarkup pattern already used throughout this
 * codebase's screen/component tests — no @capacitor/core mocking needed in
 * this node test environment).
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PaywallDialog } from '../PaywallDialog';

describe('PaywallDialog dismissable contract', () => {
  it('default (dismissable omitted) renders a close button — existing call sites unaffected', () => {
    const html = renderToStaticMarkup(
      <PaywallDialog open trigger={null} onClose={vi.fn()} />,
    );
    expect(html).toContain('aria-label="Lukk"');
  });

  it('dismissable=true explicitly renders a close button', () => {
    const html = renderToStaticMarkup(
      <PaywallDialog open trigger={null} onClose={vi.fn()} dismissable />,
    );
    expect(html).toContain('aria-label="Lukk"');
  });

  it('dismissable=false renders NO close button (AppPaywallGate contract)', () => {
    const html = renderToStaticMarkup(
      <PaywallDialog open trigger={null} onClose={vi.fn()} dismissable={false} />,
    );
    expect(html).not.toContain('aria-label="Lukk"');
    // Restore/purchase controls must remain available — only dismissal is blocked.
    expect(html).toContain('Gjenopprett kjøp');
    expect(html).toContain('Start 7 dager gratis');
  });
});
