/// <reference types="node" />

import { readFile } from 'node:fs/promises';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { PlanningChangeEvent, PlanningChangeKind } from '../../../lib/planning/change-events.js';
import { GENERIC_GARMENT_SVG } from '../../../data/garment-illustrations.js';
import { PlanChangeRail } from '../PlanChangeRail.js';

type HybridEvent = PlanningChangeEvent & {
  hour: number;
  garments: string[];
};

type TestRow =
  | {
    id: string;
    type: 'unchanged';
    copy: string;
    event: HybridEvent;
  }
  | {
    id: string;
    type: 'change';
    eventId: string;
    atIso: string;
    hasOutfit: boolean;
    event: HybridEvent;
  };

function eventFor(
  kind: PlanningChangeKind,
  overrides: Partial<PlanningChangeEvent> = {},
): HybridEvent {
  const base: PlanningChangeEvent = {
    id: `event-${kind}`,
    atIso: '2026-02-12T11:00:00.000Z',
    kind,
    addedGarments: kind === 'add' ? ['Langermet ullbody'] : [],
    removedGarments: kind === 'remove' ? ['Langermet ullbody'] : [],
    cause: `Syntetisk årsak for ${kind}`,
    transitionContextId: `transition-${kind}`,
  };
  const variants: Partial<Record<PlanningChangeKind, Partial<PlanningChangeEvent>>> = {
    swap: {
      addedGarments: ['Vinterdress'],
      removedGarments: ['Ull-mellomlag'],
    },
    rain: {
      transition: {
        kind: 'rain',
        action: 'bring',
        garments: ['Regntrekk på vognen'],
      },
    },
    location: {
      transition: {
        kind: 'location',
        placeLabel: 'Prøvested',
        action: 'ta på vindtett skall',
      },
    },
    prep: {
      transition: {
        kind: 'prep',
        garments: ['Vognpose'],
      },
    },
  };
  const event = {
    ...base,
    ...variants[kind],
    ...overrides,
  };
  const garments = [
    ...event.removedGarments,
    ...event.addedGarments,
    ...(event.transition?.kind === 'rain' || event.transition?.kind === 'prep'
      ? event.transition.garments
      : []),
  ];
  return {
    ...event,
    hour: 12,
    garments: [...garments],
  };
}

function changeRow(
  kind: PlanningChangeKind,
  overrides: Partial<TestRow & { type: 'change' }> = {},
): Extract<TestRow, { type: 'change' }> {
  const event = eventFor(kind);
  return {
    id: `row-${kind}`,
    type: 'change',
    eventId: event.id,
    atIso: event.atIso,
    hasOutfit: true,
    event,
    ...overrides,
  };
}

function unchangedRow(): TestRow {
  return {
    id: 'row-unchanged',
    type: 'unchanged',
    copy: 'Samme antrekk i de vurderte tidspunktene',
    event: eventFor('add', { id: 'legacy-safe-static-fixture' }),
  };
}

function renderRail(
  rows: readonly TestRow[],
  selectedEventId: string | null,
): string {
  return renderToStaticMarkup(
    <PlanChangeRail
      rows={rows as never}
      selectedEventId={selectedEventId}
      onSelect={vi.fn()}
      onOpenOutfit={vi.fn()}
    />,
  );
}

describe('PlanChangeRail controlled semantic contract', () => {
  it('RED_CONTROLLED_RAIL_CONTRACT', async () => {
    const sourcePath = '../PlanChangeRail.tsx?raw';
    const source = (
      await import(/* @vite-ignore */ sourcePath) as { default: string }
    ).default;

    expect(source, 'OLD_RAIL_OWNS_LOCAL_OPEN_STATE').not.toMatch(/\buseState\b/u);
    expect(source).toMatch(/selectedEventId:\s*string\s*\|\s*null/u);
    expect(source).toMatch(/onSelect:\s*\(.*string\s*\|\s*null/u);
    expect(source).toMatch(/onOpenOutfit:\s*\(eventId:\s*string,\s*trigger:\s*HTMLElement/u);
  });

  it('renders one ordered list whose direct content is list-item structure', () => {
    const markup = renderRail([unchangedRow(), changeRow('add')], 'event-add');

    expect(markup.match(/<ol\b/gu)).toHaveLength(1);
    expect(markup).not.toMatch(/<ol[^>]*>\s*<span\b/u);
    expect(markup.match(/<li\b/gu)).toHaveLength(2);
  });

  it('renders zero events as one truthful static non-interactive row', () => {
    const markup = renderRail([unchangedRow()], null);

    expect(markup).toContain('Samme antrekk i de vurderte tidspunktene');
    expect(markup).not.toContain('<button');
    expect(markup).not.toContain('aria-expanded');
  });

  it('keeps exactly one controlled event expanded and emits real datetime markup', () => {
    const first = changeRow('add');
    const second = changeRow('remove', {
      id: 'row-remove-later',
      eventId: 'event-remove-later',
      atIso: '2026-02-12T12:00:00.000Z',
      event: eventFor('remove', {
        id: 'event-remove-later',
        atIso: '2026-02-12T12:00:00.000Z',
      }),
    });
    const markup = renderRail([first, second], second.eventId);

    expect(markup.match(/aria-expanded="true"/gu)).toHaveLength(1);
    expect(markup.match(/aria-expanded="false"/gu)).toHaveLength(1);
    expect(markup).toMatch(/datetime="2026-02-12T12:00:00.000Z"/iu);
  });

  it('starts concise, separates clothes off from clothes on, and renders the full action once', () => {
    const row = changeRow('swap');
    const collapsed = renderRail([row], null);
    const fullAction = 'Bytt fra Ull-mellomlag til Vinterdress';

    expect(collapsed).toContain('aria-expanded="false"');
    expect(collapsed).toContain('class="plan-change-rail__read-more-label">Les mer');
    expect(collapsed).toContain('aria-label="Ta av: Ull-mellomlag"');
    expect(collapsed).toContain('aria-label="Ta på: Vinterdress"');
    expect(collapsed).toContain('class="plan-change-rail__overview-arrow"');
    expect(collapsed.split(fullAction)).toHaveLength(2);
    expect(collapsed).toContain('aria-hidden="true"');
    expect(collapsed).toContain('>12:00</time>');
    expect(collapsed).not.toMatch(/(?:AM|PM)/u);

    const expanded = renderRail([row], row.eventId);
    expect(expanded).toContain('class="plan-change-rail__read-more-label">Vis mindre');
    expect(expanded.split(fullAction)).toHaveLength(2);
    expect(expanded).toContain('class="plan-change-rail__detail is-expanded" aria-hidden="false"');
  });

  it('keeps explicit transition garments visible in a combined rain change', () => {
    const event = eventFor('rain', {
      addedGarments: ['Skalljakke'],
      transition: {
        kind: 'rain',
        action: 'bring',
        garments: ['Regntrekk på vognen'],
      },
    });
    const markup = renderRail([{
      id: 'row-combined-rain',
      type: 'change',
      eventId: event.id,
      atIso: event.atIso,
      hasOutfit: true,
      event,
    }], null);

    expect(markup).toContain('class="plan-change-rail__compact-label" aria-hidden="true">Legg til');
    expect(markup).toContain('Skalljakke');
    expect(markup).toContain('Regntrekk på vognen');
    expect(markup.match(/class="plan-change-rail__compact-thumb"/gu)).toHaveLength(2);
  });

  it('renders action, cause, max three compact safe images and exact Outfit CTA', () => {
    const event = eventFor('add', {
      addedGarments: [
        'Langermet ullbody',
        'Ull-mellomlag',
        'Vinterdress',
        'Ukjent testplagg',
      ],
    });
    const markup = renderRail([
      {
        id: 'row-rich',
        type: 'change',
        eventId: event.id,
        atIso: event.atIso,
        hasOutfit: true,
        event: { ...event, garments: [...event.addedGarments] },
      },
    ], event.id);

    expect(markup).toContain('Ta på Langermet ullbody, Ull-mellomlag, Vinterdress og Ukjent testplagg');
    expect(markup).toContain(event.cause);
    expect(markup.match(/<img\b/gu)).toHaveLength(3);
    expect(markup).toContain('class="plan-change-rail__compact-more">+1');
    expect(markup).toContain('alt=""');
    expect(markup).toContain('Se hele antrekket');
  });

  it('uses the canonical generic fallback without hiding an unknown garment name', () => {
    const event = eventFor('add', { addedGarments: ['Ukjent testplagg'] });
    const markup = renderRail([
      {
        id: 'row-fallback',
        type: 'change',
        eventId: event.id,
        atIso: event.atIso,
        hasOutfit: false,
        event: { ...event, garments: ['Ukjent testplagg'] },
      },
    ], event.id);

    expect(markup).toContain('Ukjent testplagg');
    expect(markup).toContain(GENERIC_GARMENT_SVG.replaceAll('&', '&amp;'));
    expect(markup).not.toContain('Se hele antrekket');
  });

  it.each([
    ['add', 'circle-plus', 'Ta på Langermet ullbody'],
    ['remove', 'circle-minus', 'Ta av Langermet ullbody'],
    ['swap', 'diamond-swap', 'Bytt fra Ull-mellomlag til Vinterdress'],
    ['rain', 'droplet-shield', 'Ta med Regntrekk på vognen'],
    ['location', 'pin', 'Når dere kommer til Prøvested: Endring'],
    ['prep', 'bag-check', 'Forbered Vognpose'],
  ] as const)('renders %s with redundant shape and verb grammar', (kind, shape, copy) => {
    const row = changeRow(kind);
    const markup = renderRail([row], row.eventId);

    expect(markup).toContain(`data-kind="${kind}"`);
    expect(markup).toContain(`data-marker-shape="${shape}"`);
    expect(markup).toContain(copy);
  });

  it('keeps the rail ID-only and contains no DTO, context ID, local state, or unguarded haptic call', async () => {
    const sourcePath = '../PlanChangeRail.tsx?raw';
    const source = (
      await import(/* @vite-ignore */ sourcePath) as { default: string }
    ).default;

    expect(source).not.toMatch(
      /\b(?:PlannedOutfitContext|plannedContextId|transitionContextId|useState|localStorage|sessionStorage)\b/u,
    );
    expect(source).not.toMatch(/import\s*\{[^}]*\bfire\b[^}]*\}\s*from/u);
    expect(source).toContain('useHapticSystem');
    expect(source).toContain('decidePlanningInteraction');
    expect(source).toContain('dispatchPlanningInteraction');
  });

  it('RED_OSLO_TIME_AND_DECLARED_TOKEN_CONTRACT', async () => {
    const [componentModule, cssSource] = await Promise.all([
      import(/* @vite-ignore */ '../PlanChangeRail.tsx?raw') as Promise<{ default: string }>,
      readFile(new URL('../PlanChangeRail.css', import.meta.url), 'utf8'),
    ]);

    expect(componentModule.default).toContain("timeZone: 'Europe/Oslo'");
    expect(cssSource, 'UNDECLARED_INK_600_TOKEN').not.toContain('--ink-600');
  });

  it('RED_REVIEW_RESTART_UI_AND_SELECTION_CONTRACTS', async () => {
    const [railCss, controlCss, ukeSource] = await Promise.all([
      readFile(new URL('../PlanChangeRail.css', import.meta.url), 'utf8'),
      readFile(new URL('../../controls/SegmentedControl.css', import.meta.url), 'utf8'),
      import(/* @vite-ignore */ '../../../screens/UkeScreen.tsx?raw') as Promise<{ default: string }>,
    ]);

    expect(`${railCss}\n${controlCss}`).toContain('var(--dw-focus)');
    expect(`${railCss}\n${controlCss}`).not.toMatch(
      /(?:font-size:\s*(?:0\.6875|0\.72|0\.8125|0\.9375)rem|font-weight:\s*(?:650|700))/u,
    );
    const railHeadingStyle = ukeSource.default.match(
      /const changeRailHeadStyle: CSSProperties = \{[\s\S]*?\n\s{2}\};/u,
    )?.[0];
    expect(railHeadingStyle).toBeDefined();
    expect(railHeadingStyle).not.toContain("textTransform: 'uppercase'");
    expect(railHeadingStyle).toContain("fontSize: '1.25rem'");
    expect(railHeadingStyle).toContain('fontWeight: 640');
    expect(ukeSource.default, 'REPAIR_MUST_PERSIST').toMatch(
      /if \(planningSelection\.scope !== planningSelectionScope\)[\s\S]*?repairPlanningSelection[\s\S]*?setPlanningSelection/u,
    );
  });
});
