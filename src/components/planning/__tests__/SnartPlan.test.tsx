import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { buildSnartPlan } from '../../../lib/planning/snart';
import { SnartPlan } from '../SnartPlan';

const ready = buildSnartPlan({
  asOfLocalDate: '2026-01-01', timezone: 'Europe/Oslo',
  homePlaceKey: 'no-city:v1:oslo:599139:107522',
  climateProfileId: 'snart-profile:v2:no-city:v1:oslo:599139:107522',
  ageEligibleForWholeWindow: true, alreadyHaveConceptIds: new Set(),
});

describe('SnartPlan', () => {
  it('renders the supplied ready model in its authoritative group order', () => {
    const markup = renderToStaticMarkup(<SnartPlan result={ready} onMarkAlreadyHave={vi.fn()} />);
    expect(markup).toContain('Basert på månedlige normaler for 1991–2020, ikke et værvarsel.');
    expect(markup).toContain('Meteorologisk institutt (MET Norway)');
    expect(markup).toContain('Dette er en Babyora-planleggingsregel');
    expect(markup).toContain('Har allerede');
    expect(markup).toMatch(/<button[^>]*data-concept-id=/u);
  });

  it('renders empty and unavailable only with their authoritative copy', () => {
    const empty = buildSnartPlan({
      asOfLocalDate: '2026-01-01', timezone: 'Europe/Oslo',
      homePlaceKey: 'no-city:v1:oslo:599139:107522',
      climateProfileId: 'snart-profile:v2:no-city:v1:oslo:599139:107522',
      ageEligibleForWholeWindow: true,
      alreadyHaveConceptIds: new Set(['snart.base_layer', 'snart.mid_layer', 'snart.insulated_outer', 'snart.cold_headwear', 'snart.handwear', 'snart.weather_shell']),
    });
    const unavailable = buildSnartPlan({} as never);
    expect(renderToStaticMarkup(<SnartPlan result={empty} onMarkAlreadyHave={vi.fn()} />)).toContain('Ingenting å forberede akkurat nå.');
    const markup = renderToStaticMarkup(<SnartPlan result={unavailable} onMarkAlreadyHave={vi.fn()} />);
    expect(markup).toContain('Vi har ikke godt nok historisk grunnlag');
    expect(markup).not.toMatch(/snart\.|Har allerede|Sjekk først/u);
  });
});
