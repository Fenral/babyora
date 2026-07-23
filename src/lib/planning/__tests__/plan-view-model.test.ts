import { describe, expect, it } from 'vitest';
import type { ForecastCoverage, ForecastCoverageStatus } from '../coverage.js';
import type { PlanningPoint } from '../change-events.js';

type WeatherRow = Readonly<{
  atIso: string;
  tempC: number;
  feelsLikeC: number;
  symbolCode: string;
}>;

type ViewModelInput = Readonly<{
  status: 'loading' | 'error' | 'offline' | 'ready';
  coverage: ForecastCoverage | null;
  points: readonly PlanningPoint[];
  forecast: readonly WeatherRow[];
  evaluatedAtIso: string;
  cachedAtIso?: string;
  outfitAvailabilityByEventId?: Readonly<Record<string, boolean>>;
}>;

type ViewModel = Readonly<{
  status: 'loading' | 'error' | 'offline' | 'partial' | 'empty' | 'ready';
  verdict: Readonly<{
    finalizedFingerprint: string;
    orderedGarments: readonly string[];
    equipment: readonly string[];
    summary: string;
  }> | null;
  nextAction: string | null;
  events: readonly Readonly<{ id: string; atIso: string; kind: string }>[];
  rows: readonly Readonly<{ id: string; type: 'unchanged' | 'change' }>[];
  candidateEventIds: readonly string[];
  forecast: readonly WeatherRow[];
  message?: string;
  heading?: string;
  body?: string;
  retryLabel?: string;
}>;

const viewModule = await import('../plan-view-model.js').catch(() => ({}));
const canonical = viewModule as unknown as {
  buildPlanViewModel: (input: ViewModelInput) => ViewModel;
};

function coverage(status: ForecastCoverageStatus, isos: readonly string[]): ForecastCoverage {
  const points = isos.map((iso) => ({
    iso,
    epochMs: Date.parse(iso),
    localDate: iso.slice(0, 10),
    localTime: iso.slice(11, 16),
  }));
  return {
    status,
    timeZone: 'Europe/Oslo',
    points,
    startIso: points[0]?.iso ?? null,
    endIso: points.at(-1)?.iso ?? null,
  };
}

function planningPoint(
  atIso: string,
  finalizedFingerprint: string,
  orderedGarments: readonly string[],
  overrides: Partial<PlanningPoint> = {},
): PlanningPoint {
  return {
    atIso,
    finalizedFingerprint,
    orderedGarments,
    equipment: [],
    cause: 'Det blir kjøligere',
    transitionContextId: `transition-${atIso}`,
    ...overrides,
  };
}

const isos = [
  '2026-07-20T08:00:00+02:00',
  '2026-07-20T09:00:00+02:00',
  '2026-07-20T10:00:00+02:00',
  '2026-07-20T11:00:00+02:00',
] as const;

const evaluatedAtIso = '2026-07-20T08:15:00+02:00';
const assessed = coverage('complete-hourly', isos);
const weatherRows: readonly WeatherRow[] = isos.map((atIso, index) => ({
  atIso,
  tempC: 8 - index,
  feelsLikeC: 6 - index,
  symbolCode: index > 1 ? 'rain' : 'cloudy',
}));

function input(overrides: Partial<ViewModelInput> = {}): ViewModelInput {
  return {
    status: 'ready',
    coverage: assessed,
    points: [],
    forecast: weatherRows,
    evaluatedAtIso,
    ...overrides,
  };
}

describe('buildPlanViewModel', () => {
  it('publishes the pure aggregate API', () => {
    expect(typeof canonical.buildPlanViewModel).toBe('function');
  });

  it('returns exact loading and no-cache error states without advice', () => {
    const loading = canonical.buildPlanViewModel(input({ status: 'loading', coverage: null }));
    expect(loading).toMatchObject({
      status: 'loading',
      message: 'Henter dagens plan …',
      verdict: null,
      nextAction: null,
      events: [],
      rows: [],
      forecast: [],
    });

    const error = canonical.buildPlanViewModel(input({ status: 'error', coverage: null }));
    expect(error).toMatchObject({
      status: 'error',
      heading: 'Vi fikk ikke oppdatert planen',
      body: 'Vi har ingen oppdatert plan å vise. Prøv å hente planen på nytt.',
      retryLabel: 'Prøv å hente planen',
      verdict: null,
      nextAction: null,
      events: [],
      rows: [],
      forecast: [],
    });
  });

  it('fails unavailable or invalid evidence closed without garments or actions', () => {
    const unavailable = canonical.buildPlanViewModel(input({
      coverage: coverage('unavailable', []),
      points: [planningPoint(isos[0], 'fp-a', ['ullbody'])],
    }));
    const invalidClock = canonical.buildPlanViewModel(input({
      evaluatedAtIso: 'ikke-en-dato',
      points: [planningPoint(isos[0], 'fp-a', ['ullbody'])],
    }));
    const forgedLocalCoverage = coverage('complete-hourly', [isos[0], isos[1]]);
    const forgedLocal = canonical.buildPlanViewModel(input({
      coverage: {
        ...forgedLocalCoverage,
        points: forgedLocalCoverage.points.map((point, index) => (
          index === 1 ? { ...point, localTime: '23:00' } : point
        )),
      },
      points: [
        planningPoint(isos[0], 'same', ['ullbody']),
        planningPoint(isos[1], 'same', ['ullbody']),
      ],
    }));
    const falseHourly = canonical.buildPlanViewModel(input({
      coverage: coverage('complete-hourly', [isos[0], isos[2]]),
      evaluatedAtIso: isos[0],
      points: [
        planningPoint(isos[0], 'same', ['ullbody']),
        planningPoint(isos[2], 'same', ['ullbody']),
      ],
    }));

    for (const model of [unavailable, invalidClock, forgedLocal, falseHourly]) {
      expect(model.status).toBe('error');
      expect(model.verdict).toBeNull();
      expect(model.nextAction).toBeNull();
      expect(model.events).toEqual([]);
      expect(model.rows).toEqual([]);
    }
  });

  it('returns cached offline advice only with an explicit Oslo timestamp and stale limits', () => {
    const model = canonical.buildPlanViewModel(input({
      status: 'offline',
      coverage: coverage('stale', isos),
      cachedAtIso: '2026-07-20T05:07:00Z',
      points: [
        planningPoint(isos[0], 'fp-a', ['ullbody']),
        planningPoint(isos[1], 'fp-b', ['ullbody', 'lue']),
      ],
    }));

    expect(model.status).toBe('offline');
    expect(model.message).toBe('Du er frakoblet · viser planen fra 07:07');
    expect(model.verdict?.orderedGarments).toEqual(['ullbody']);
    expect(model.nextAction).toBe('Ta på lue');
    expect(model.rows.every((row) => (
      row.type === 'change'
      || !JSON.stringify(row).match(/hele dagen|ut dagen|til kl\.|time for time/i)
    ))).toBe(true);
  });

  it.each(['sampled', 'gapped'] as const)(
    'returns a partial state with source limits for %s evidence',
    (status) => {
      const model = canonical.buildPlanViewModel(input({
        coverage: coverage(
          status,
          status === 'gapped' ? [isos[0], isos[2], isos[3]] : [isos[0], isos[2]],
        ),
        evaluatedAtIso: isos[0],
        points: [
          planningPoint(isos[0], 'fp-a', ['ullbody']),
          planningPoint(isos[2], 'fp-b', ['ullbody', 'lue']),
        ],
      }));

      expect(model.status).toBe('partial');
      expect(model.message).toBe('Planen viser bare tidspunktene Babyora har værdata for.');
      expect(model.nextAction).toBe('Ta på lue');
    },
  );

  it('fails malformed explicit transitions closed instead of presenting false no-change advice', () => {
    const malformedPrep = planningPoint(isos[1], 'fp-b', ['ullbody', 'lue'], {
      transition: { kind: 'prep', garments: [] },
    });
    const malformedLocation = planningPoint(isos[1], 'fp-b', ['ullbody', 'lue'], {
      transition: { kind: 'location', placeLabel: 'Barnehagen', action: '   ' },
    });
    const malformedRain = planningPoint(isos[1], 'fp-b', ['ullbody', 'regnjakke'], {
      transition: {
        kind: 'rain',
        action: 'invalid',
        garments: ['regnjakke'],
      } as unknown as PlanningPoint['transition'],
    });
    const unknownKind = planningPoint(isos[1], 'fp-b', ['ullbody', 'lue'], {
      transition: {
        kind: 'ukjent',
        garments: ['lue'],
      } as unknown as PlanningPoint['transition'],
    });
    const missingGarments = planningPoint(isos[1], 'fp-b', ['ullbody', 'lue'], {
      transition: {
        kind: 'prep',
      } as unknown as PlanningPoint['transition'],
    });

    for (const malformed of [
      malformedPrep,
      malformedLocation,
      malformedRain,
      unknownKind,
      missingGarments,
    ]) {
      let model: ViewModel | undefined;
      expect(() => {
        model = canonical.buildPlanViewModel(input({
          points: [planningPoint(isos[0], 'fp-a', ['ullbody']), malformed],
        }));
      }).not.toThrow();
      expect(model).toMatchObject({
        status: 'error',
        verdict: null,
        nextAction: null,
        events: [],
        rows: [],
      });
    }
  });

  it('fails insufficient, expired, and between-sample planning evidence closed', () => {
    const onePoint = canonical.buildPlanViewModel(input({
      points: [planningPoint(isos[0], 'fp-a', ['ullbody'])],
    }));
    const expired = canonical.buildPlanViewModel(input({
      evaluatedAtIso: '2026-07-21T08:15:00+02:00',
      points: [
        planningPoint(isos[0], 'fp-a', ['ullbody']),
        planningPoint(isos[1], 'fp-b', ['ullbody', 'lue']),
      ],
    }));
    const betweenSamples = canonical.buildPlanViewModel(input({
      coverage: coverage('sampled', [isos[0], isos[2]]),
      evaluatedAtIso,
      points: [
        planningPoint(isos[0], 'fp-a', ['ullbody']),
        planningPoint(isos[2], 'fp-b', ['ullbody', 'lue']),
      ],
    }));
    const betweenStaleSamples = canonical.buildPlanViewModel(input({
      status: 'offline',
      coverage: coverage('stale', [isos[0], isos[2]]),
      cachedAtIso: '2026-07-20T05:07:00Z',
      evaluatedAtIso,
      points: [
        planningPoint(isos[0], 'fp-a', ['ullbody']),
        planningPoint(isos[2], 'fp-b', ['ullbody', 'lue']),
      ],
    }));
    const sparseRecommendations = canonical.buildPlanViewModel(input({
      evaluatedAtIso,
      points: [
        planningPoint(isos[0], 'fp-a', ['ullbody']),
        planningPoint(isos[2], 'fp-b', ['ullbody', 'lue']),
      ],
    }));
    const afterRecommendations = canonical.buildPlanViewModel(input({
      evaluatedAtIso: isos[2],
      points: [
        planningPoint(isos[0], 'fp-a', ['ullbody']),
        planningPoint(isos[1], 'fp-b', ['ullbody', 'lue']),
      ],
    }));
    let malformedContainer: ViewModel | undefined;
    expect(() => {
      malformedContainer = canonical.buildPlanViewModel(input({
        points: null as unknown as readonly PlanningPoint[],
      }));
    }).not.toThrow();

    for (const model of [
      onePoint,
      expired,
      betweenSamples,
      betweenStaleSamples,
      sparseRecommendations,
      afterRecommendations,
      malformedContainer,
    ]) {
      expect(model).toMatchObject({
        status: 'error',
        verdict: null,
        nextAction: null,
        events: [],
        rows: [],
      });
    }
  });

  it('rejects one finalized fingerprint that maps to inconsistent visible content', () => {
    const model = canonical.buildPlanViewModel(input({
      points: [
        planningPoint(isos[0], 'same-fingerprint', ['ullbody']),
        planningPoint(isos[1], 'same-fingerprint', ['ullbody', 'lue']),
      ],
    }));

    expect(model).toMatchObject({
      status: 'error',
      verdict: null,
      nextAction: null,
      events: [],
      rows: [],
    });
  });

  it('rejects conflicting planning recommendations at the same absolute instant', () => {
    const model = canonical.buildPlanViewModel(input({
      points: [
        planningPoint(isos[0], 'fp-a', ['ullbody']),
        planningPoint(isos[1], 'fp-b', ['ullbody', 'lue']),
        planningPoint('2026-07-20T07:00:00Z', 'fp-c', ['ullbody', 'votter']),
      ],
    }));

    expect(model).toMatchObject({
      status: 'error',
      verdict: null,
      nextAction: null,
      events: [],
      rows: [],
    });
  });

  it('keeps distinct explicit action transitions at one instant when the recommendation agrees', () => {
    const model = canonical.buildPlanViewModel(input({
      points: [
        planningPoint(isos[0], 'fp-a', ['ullbody']),
        planningPoint(isos[1], 'fp-a', ['ullbody'], {
          cause: 'Ankomst',
          transitionContextId: 'location-transition',
          transition: {
            kind: 'location',
            placeLabel: 'Barnehagen',
            action: 'Ta av skalljakke',
          },
        }),
        planningPoint('2026-07-20T07:00:00Z', 'fp-a', ['ullbody'], {
          cause: 'Avreise senere',
          transitionContextId: 'prep-transition',
          transition: {
            kind: 'prep',
            garments: ['regntrekk'],
          },
        }),
      ],
    }));

    expect(model.status).toBe('ready');
    expect(model.events.map((event) => event.kind)).toEqual(['location', 'prep']);
    expect(model.nextAction).toBe('N\u00e5r dere kommer til Barnehagen: Ta av skalljakke');
    expect(model.rows.filter((row) => row.type === 'change')).toHaveLength(2);
  });

  it('rejects conflicting duplicate forecast rows instead of choosing by input order', () => {
    const conflictingForecast = [
      ...weatherRows,
      {
        atIso: isos[0],
        tempC: 99,
        feelsLikeC: 99,
        symbolCode: 'clear',
      },
    ];
    const model = canonical.buildPlanViewModel(input({
      points: [
        planningPoint(isos[0], 'fp-a', ['ullbody']),
        planningPoint(isos[1], 'fp-b', ['ullbody', 'lue']),
      ],
      forecast: conflictingForecast,
    }));

    expect(model).toMatchObject({
      status: 'error',
      verdict: null,
      nextAction: null,
      events: [],
      rows: [],
      forecast: [],
    });
  });

  it('returns the exact empty evaluation copy when valid finalized points have no change event', () => {
    const model = canonical.buildPlanViewModel(input({
      points: [
        planningPoint(isos[0], 'same', ['ullbody']),
        planningPoint(isos[1], 'same', ['ullbody'], { cause: 'Vinden øker' }),
      ],
    }));

    expect(model).toMatchObject({
      status: 'empty',
      heading: 'Ingen antrekksendringer',
      body: 'Babyora fant ingen endringer i perioden som er vurdert.',
      nextAction: null,
      events: [],
    });
    expect(model.verdict?.orderedGarments).toEqual(['ullbody']);
    expect(model.rows.map((row) => row.type)).toEqual(['unchanged']);
  });

  it('returns a deterministic verdict, next action, and candidate order for valid events', () => {
    const points = [
      planningPoint(isos[2], 'fp-c', ['ullbody', 'votter']),
      planningPoint(isos[0], 'fp-a', ['ullbody']),
      planningPoint(isos[1], 'fp-b', ['ullbody', 'lue']),
    ];
    const forward = canonical.buildPlanViewModel(input({ points }));
    const reversed = canonical.buildPlanViewModel(input({
      points: [...points].reverse(),
      forecast: [...weatherRows].reverse(),
    }));

    expect(forward.status).toBe('ready');
    expect(forward.verdict).toEqual({
      finalizedFingerprint: 'fp-a',
      orderedGarments: ['ullbody'],
      equipment: [],
      summary: 'ullbody',
    });
    expect(forward.nextAction).toBe('Ta på lue');
    expect(forward.candidateEventIds).toEqual(forward.events.map((event) => event.id));
    expect(JSON.stringify(reversed)).toBe(JSON.stringify(forward));
  });

  it('returns forecast rows with weather fields only and constructs no future DTO', () => {
    const model = canonical.buildPlanViewModel(input({
      points: [
        planningPoint(isos[0], 'fp-a', ['ullbody']),
        planningPoint(isos[1], 'fp-b', ['ullbody', 'lue']),
      ],
    }));

    expect(model.forecast).toEqual(weatherRows);
    expect(Object.keys(model.forecast[0] ?? {}).sort()).toEqual([
      'atIso',
      'feelsLikeC',
      'symbolCode',
      'tempC',
    ]);
    expect(JSON.stringify(model)).not.toMatch(/plannedContextId|PlannedOutfitContext/);
  });

});
