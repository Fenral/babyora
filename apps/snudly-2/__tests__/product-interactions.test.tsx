/** @vitest-environment jsdom */

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductApp } from '../ProductApp';

vi.mock('../weather-service', () => {
  const evaluatedAt = new Date('2026-08-18T09:00:00.000Z');
  const hourly = Array.from({ length: 48 }, (_, index) => ({
    time: new Date(evaluatedAt.getTime() + index * 60 * 60 * 1000),
    tempC: 7 + (index % 6) * 2,
    feelsLikeC: 6 + (index % 6) * 2,
    windMs: 2,
    precipMmH: index === 0 ? 0.4 : 0,
    symbolCode: 'partlycloudy_day',
  }));
  const daily = [0, 1, 2, 3].map((days, index) => ({
    date: new Date(evaluatedAt.getTime() + days * 24 * 60 * 60 * 1000),
    refHour: 12,
    tempC: 7 + index * 3,
    feelsLikeC: 6 + index * 3,
    windMs: 2,
    precipMmH: 0,
    symbolCode: 'partlycloudy_day',
  }));
  return {
    loadCityWeather: vi.fn(async () => ({
      now: {
        tempC: 7,
        feelsLikeC: 6,
        windMs: 2,
        windDir: 180,
        precipMmH: 0.4,
        symbolCode: 'partlycloudy_day',
        observedAt: evaluatedAt,
      },
      hourly,
      daily,
      evaluatedAt,
      stale: false,
    })),
  };
});

const PROFILE = { name: 'Lillian', birthDate: '2025-10-17', city: 'Trondheim' };

function button(container: HTMLElement, label: string): HTMLButtonElement {
  const match = [...container.querySelectorAll('button')].find((candidate) => candidate.textContent?.includes(label) || candidate.getAttribute('aria-label')?.includes(label));
  if (!(match instanceof HTMLButtonElement)) throw new Error(`Fant ikke knapp: ${label}`);
  return match;
}

async function click(container: HTMLElement, label: string): Promise<void> {
  await act(async () => button(container, label).click());
}

async function changeInput(input: HTMLInputElement, value: string): Promise<void> {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  if (!setter) throw new Error('Nettleseren mangler verdi-setter');
  await act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

describe('Snudly 2 produktflyt', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    await act(async () => root.render(<ProductApp initialProfile={PROFILE} />));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    window.localStorage.clear();
  });

  it('navigerer gjennom alle fire hovedsidene og viser ekte planpunkter', async () => {
    expect(container.querySelector('[data-engine="snudly-engine-v1"]')).not.toBeNull();

    await click(container, 'Planlegg');
    await act(async () => Promise.resolve());
    expect(container.querySelector('[data-screen="plan"]')).not.toBeNull();
    expect(container.querySelectorAll('.chart-point').length).toBeGreaterThan(1);
    await click(container, 'I morgen');
    expect(button(container, 'I morgen').getAttribute('aria-pressed')).toBe('true');

    await click(container, 'Verktøy');
    expect(container.querySelector('[data-screen="tools"]')).not.toBeNull();
    await click(container, 'Familie');
    expect(container.querySelector('[data-screen="family"]')).not.toBeNull();
  });

  it('åpner riktig plaggdetalj fra hele plaggraden på Hjem', async () => {
    const firstGarment = container.querySelector<HTMLButtonElement>('.garment-row');
    if (!firstGarment) throw new Error('Første plaggrad mangler');
    const garmentName = firstGarment.querySelector('strong')?.textContent;
    if (!garmentName) throw new Error('Plaggnavnet mangler');

    await act(async () => firstGarment.click());

    const dialog = container.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.querySelector('h2')?.textContent).toBe(garmentName);
    expect(dialog?.textContent).toContain('i dagens antrekk');
    expect(dialog?.querySelector('img')?.getAttribute('src')).toBe(
      firstGarment.querySelector('img')?.getAttribute('src'),
    );

    const close = container.querySelector<HTMLButtonElement>('button[aria-label="Lukk plaggdetaljer"]');
    if (!close) throw new Error('Lukk plaggdetaljer-knappen mangler');
    await act(async () => close.click());
    expect(container.querySelector('[role="dialog"][aria-modal="true"]')).toBeNull();
  });

  it('kjører værkalkulatoren med Snudly-motoren og reagerer på inndata', async () => {
    await click(container, 'Verktøy');
    await click(container, 'Værkalkulator');
    const before = container.querySelector('.calculator-result strong')?.textContent;
    const feelsLike = [...container.querySelectorAll<HTMLInputElement>('input[type="range"]')][1];
    if (!feelsLike) throw new Error('Føles-som-kontrollen mangler');

    await changeInput(feelsLike, '-18');

    expect(container.querySelector('.calculator-result')?.textContent).toContain('plagg');
    expect(container.querySelector('.calculator-result strong')?.textContent).not.toBe(before);
    await click(container, 'Alle verktøy');
    expect(container.querySelector('.weather-hero')).not.toBeNull();
  });

  it('kjører sovekalkulatoren og oppdaterer TOG fra romtemperaturen', async () => {
    await click(container, 'Verktøy');
    await click(container, 'Sovekalkulator');
    const slider = container.querySelector<HTMLInputElement>('.tool-detail input[type="range"]');
    if (!slider) throw new Error('Romtemperatur-kontrollen mangler');

    await changeInput(slider, '25');

    expect(container.querySelector('.sleep-result strong')?.textContent).toBe('0.5 TOG');
  });

  it('lagrer profilendringer lokalt på Familie-siden', async () => {
    await click(container, 'Familie');
    await click(container, 'Appinnstillinger');
    const name = container.querySelector<HTMLInputElement>('input:not([type])');
    if (!name) throw new Error('Navnefeltet mangler');
    await changeInput(name, 'Lilly');
    await click(container, 'Lagre profil');

    expect(container.querySelector('[role="status"]')?.textContent).toContain('lagret');
    expect(window.localStorage.getItem('snudly.v2.profile')).toContain('Lilly');
  });
});
