/** @vitest-environment jsdom */

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PaywallScreen } from '../PaywallScreen';

const { purchaseVerifiedPlan, restoreVerifiedPurchase } = vi.hoisted(() => ({
  purchaseVerifiedPlan: vi.fn(),
  restoreVerifiedPurchase: vi.fn(),
}));

vi.mock('../billing-adapter', () => ({
  purchaseVerifiedPlan,
  restoreVerifiedPurchase,
}));

const plans = {
  yearly: {
    productKey: 'yearly' as const,
    priceString: '699 kr',
    storePackage: { identifier: 'annual' },
    trial: { unit: 'DAY' as const, value: 7 },
  },
  monthly: {
    productKey: 'monthly' as const,
    priceString: '79 kr',
    storePackage: { identifier: 'monthly' },
    trial: null,
  },
};

function button(container: HTMLElement, label: string): HTMLButtonElement {
  const result = [...container.querySelectorAll('button')].find((candidate) => candidate.textContent?.includes(label));
  if (!(result instanceof HTMLButtonElement)) throw new Error(`Fant ikke knapp: ${label}`);
  return result;
}

describe('Snudly 2 betalingsvegg', () => {
  let container: HTMLDivElement;
  let root: Root;
  let onGranted: ReturnType<typeof vi.fn>;
  let onReplay: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    purchaseVerifiedPlan.mockReset();
    restoreVerifiedPurchase.mockReset();
    onGranted = vi.fn();
    onReplay = vi.fn();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    await act(async () => root.render(<PaywallScreen plans={plans} onEntitlementGranted={onGranted} onReplayTour={onReplay} />));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it('velger nøyaktig vist månedsplan og åpner tilgang først etter bekreftet kjøp', async () => {
    purchaseVerifiedPlan.mockResolvedValue({ success: true });
    await act(async () => button(container, 'Månedlig').click());
    expect(button(container, 'Månedlig').getAttribute('aria-checked')).toBe('true');

    await act(async () => button(container, 'Fortsett i butikken').click());

    expect(purchaseVerifiedPlan).toHaveBeenCalledWith('monthly', plans.monthly);
    expect(onGranted).toHaveBeenCalledTimes(1);
  });

  it('gir ikke tilgang når kjøpet avbrytes og kan vise produktvisningen igjen', async () => {
    purchaseVerifiedPlan.mockResolvedValue({ success: false, reason: 'user_cancelled' });
    await act(async () => button(container, 'Fortsett i butikken').click());
    expect(onGranted).not.toHaveBeenCalled();

    await act(async () => button(container, 'Se produktvisningen igjen').click());
    expect(onReplay).toHaveBeenCalledTimes(1);
  });

  it('gjenoppretter bare når butikken bekrefter aktiv tilgang', async () => {
    restoreVerifiedPurchase.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    await act(async () => button(container, 'Gjenopprett kjøp').click());
    expect(onGranted).not.toHaveBeenCalled();
    expect(container.querySelector('[role="status"]')?.textContent).toContain('Fant ikke');

    await act(async () => button(container, 'Gjenopprett kjøp').click());
    expect(onGranted).toHaveBeenCalledTimes(1);
  });
});
