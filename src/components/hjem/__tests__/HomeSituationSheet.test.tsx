import { renderToStaticMarkup } from 'react-dom/server';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { HomeSituationSheet } from '../HomeSituationSheet.js';

function renderSheet(overrides: Partial<ComponentProps<typeof HomeSituationSheet>> = {}): string {
  return renderToStaticMarkup(
    <HomeSituationSheet
      isOpen
      activity="vogn"
      carSeat={false}
      language="no"
      reducedMotion={false}
      triggerRef={{ current: null }}
      onClose={vi.fn()}
      onApply={vi.fn()}
      {...overrides}
    />,
  );
}

describe('HomeSituationSheet', () => {
  it('renders one localized native bottom sheet with all three activity options', () => {
    const html = renderSheet();

    expect(html).toContain('<dialog');
    expect(html).toContain('class="home-origin-sheet hcs-sheet"');
    expect(html).toContain('data-home-situation-sheet="true"');
    expect(html).toContain('<h2 id="hcs-sheet-title">Hvor skal dere?</h2>');
    expect(html).toContain('Antrekket endrer seg med situasjonen.');
    expect((html.match(/role="radio"/gu) ?? [])).toHaveLength(3);
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('Utelek');
    expect(html).toContain('I vogn');
    expect(html).toContain('I bæresele');
  });

  it('contains the car-seat safety context as a separate switch, not an activity', () => {
    const html = renderSheet({ carSeat: true });

    expect(html).toContain('role="switch"');
    expect(html).toContain('Skal rett i bilstolen');
    expect(html).toContain('Fjerner tykke vinterdresser — HB-9');
    expect(html).toContain('class="hcs-car-seat ba-press" role="switch" aria-checked="true"');
  });

  it('localizes its own complete English copy', () => {
    const html = renderSheet({ language: 'en-GB' });

    expect(html).toContain('Where are you going?');
    expect(html).toContain('The outfit changes with the situation.');
    expect(html).toContain('Going straight into the car seat');
    expect(html).not.toContain('Hvor skal dere?');
  });
});
