/// <reference types="node" />

import { readFile } from 'node:fs/promises';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { buildSnartPlan, type SnartPlan as SnartPlanResult } from '../../../lib/planning/snart';
import { SnartPlan } from '../SnartPlan';

const ALL_CONCEPTS = [
  'snart.base_layer',
  'snart.mid_layer',
  'snart.insulated_outer',
  'snart.cold_headwear',
  'snart.handwear',
  'snart.weather_shell',
] as const;

const resultFor = (
  asOfLocalDate: string,
  alreadyHaveConceptIds: ReadonlySet<string> = new Set(),
): SnartPlanResult => buildSnartPlan({
  asOfLocalDate,
  timezone: 'Europe/Oslo',
  homePlaceKey: 'no-city:v1:oslo:599139:107522',
  climateProfileId: 'snart-profile:v2:no-city:v1:oslo:599139:107522',
  ageEligibleForWholeWindow: true,
  alreadyHaveConceptIds,
});

const render = (result: SnartPlanResult): string => renderToStaticMarkup(
  <SnartPlan result={result} onMarkAlreadyHave={vi.fn()} />,
);

describe('SnartPlan authoritative renderer', () => {
  it('renders every supplied ready item once in fixed group order with exact history copy', () => {
    const result = resultFor('2026-01-01');
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;

    const markup = render(result);
    expect(markup).toContain(result.copy.title);
    expect(markup).toContain(
      'Basert på månedlige normaler for 1991–2020, ikke et værvarsel.',
    );
    expect(markup).toContain(result.copy.note);
    expect(markup).toContain(result.copy.source);
    expect(markup.match(/data-snart-item=/gu)).toHaveLength(result.items.length);
    for (const item of result.items) {
      expect(markup).toContain(`data-snart-item="${item.conceptId}"`);
      expect(markup).toContain(item.copy);
    }
    const headings = [
      result.copy.groups.check_first,
      result.copy.groups.available_if_needed,
      result.copy.groups.not_highlighted,
    ].filter((heading) => markup.includes(heading));
    expect(headings.map((heading) => markup.indexOf(heading))).toEqual(
      [...headings].map((heading) => markup.indexOf(heading)).sort((a, b) => a - b),
    );
    expect(markup).not.toMatch(/daglige observasjoner|kvantil|våtdager/iu);
  });

  it('keeps a supplied ready result containing only not-highlighted rows ready and unmarkable', () => {
    const initial = resultFor('2026-06-01');
    expect(initial.status).toBe('ready');
    if (initial.status !== 'ready') return;
    const actionable = initial.items
      .filter((item) => item.canMarkAlreadyHave)
      .map((item) => item.conceptId);
    const supplied = resultFor('2026-06-01', new Set(actionable));
    expect(supplied.status).toBe('ready');
    if (supplied.status !== 'ready') return;
    expect(supplied.items.every((item) => !item.canMarkAlreadyHave)).toBe(true);

    const markup = render(supplied);
    expect(markup.match(/data-snart-item=/gu)).toHaveLength(supplied.items.length);
    expect(markup).not.toContain('Har allerede');
    expect(markup).not.toContain('<button');
  });

  it('renders mark controls only for model-authorized rows and emits no extra payload field', () => {
    const result = resultFor('2026-01-01');
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    const markup = render(result);
    const actionable = result.items.filter((item) => item.canMarkAlreadyHave);

    expect(markup.match(/<button\b/gu)).toHaveLength(actionable.length);
    for (const item of actionable) {
      expect(markup).toContain(`data-concept-id="${item.conceptId}"`);
    }
    expect(markup).not.toMatch(/data-(?:rule|signal|profile|child|time)=/iu);
  });

  it('keeps supplied empty authoritative and unavailable advice-free', () => {
    const empty = resultFor('2026-01-01', new Set(ALL_CONCEPTS));
    expect(empty.status).toBe('empty');
    if (empty.status !== 'empty') return;
    const emptyMarkup = render(empty);
    expect(emptyMarkup).toContain(empty.copy.title);
    expect(emptyMarkup).toContain('Ingenting å forberede akkurat nå.');
    expect(emptyMarkup).toContain(empty.copy.source);
    expect(emptyMarkup).not.toContain('<button');

    const unavailable = buildSnartPlan({} as never);
    const unavailableMarkup = render(unavailable);
    expect(unavailableMarkup).toContain(
      'Vi har ikke godt nok historisk grunnlag for dette stedet akkurat nå.',
    );
    expect(unavailableMarkup).not.toMatch(
      /snart\.|rule|concept|signal|Har allerede|Sjekk først|Meteorologisk/iu,
    );
  });

  it('uses semantic list/headings and the locked reflow, focus and forced-colors CSS', async () => {
    const result = resultFor('2026-01-01');
    const markup = render(result);
    const [componentSource, css] = await Promise.all([
      import('../SnartPlan.tsx?raw') as Promise<{ default: string }>,
      readFile(new URL('../SnartPlan.css', import.meta.url), 'utf8'),
    ]);

    expect(markup).toMatch(/<section\b/iu);
    expect(markup).toMatch(/<h2\b/iu);
    expect(markup).toMatch(/<h3\b/iu);
    expect(markup).toMatch(/<ul\b/iu);
    expect(markup).toMatch(/<li\b/iu);
    expect(componentSource.default).not.toMatch(/\.filter\s*\(/u);
    expect(componentSource.default).not.toMatch(/\buseState\b|\buseMemo\b/u);
    expect(css).toMatch(/min-(?:width|height):\s*44px/gu);
    expect(css).toContain(':focus-visible');
    expect(css).toContain('var(--focus-ring)');
    expect(css).toContain('@media (forced-colors: active)');
    expect(css).toContain('overflow-wrap: anywhere');
    expect(css).not.toMatch(/overflow(?:-y)?:\s*(?:auto|scroll)|text-overflow:\s*ellipsis/iu);
  });
});
