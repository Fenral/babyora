import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { NO_CITIES } from '../../../src/data/no-cities';

type JsonRecord = Record<string, unknown>;

const CONTRACT_PATH =
  '.planning/phases/01-planlegg-dagslinjen/01-SNART-AUTONOMY-CONTRACT.json';
const FIXTURE_PATH = 'scripts/snart/fixtures/met-boundaries-v1.json';

function loadJson(path: string): JsonRecord {
  return JSON.parse(readFileSync(path, 'utf8')) as JsonRecord;
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as JsonRecord)
      .sort(([left], [right]) => Buffer.from(left).compare(Buffer.from(right)))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function normalizeName(name: string): string {
  return name.normalize('NFC').trim().replace(/\s+/gu, ' ');
}

function requireCoordinateE4(value: number): number {
  const scaled = value * 10_000;
  expect(Number.isFinite(value)).toBe(true);
  expect(Math.abs(scaled - Math.round(scaled))).toBeLessThanOrEqual(1e-8);
  return Math.round(scaled);
}

function homePlaceProjection() {
  return NO_CITIES.map((city) => {
    const nameNfc = normalizeName(city.name);
    const latE4 = requireCoordinateE4(city.lat);
    const lonE4 = requireCoordinateE4(city.lon);
    return {
      homePlaceKey: `no-city:v1:${encodeURIComponent(
        nameNfc.toLowerCase(),
      )}:${latE4}:${lonE4}`,
      nameNfc,
      latE4,
      lonE4,
    };
  }).sort((left, right) =>
    Buffer.from(left.homePlaceKey).compare(Buffer.from(right.homePlaceKey)),
  );
}

function collectKeys(value: unknown, output: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const child of value) collectKeys(child, output);
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value as JsonRecord)) {
      output.push(key);
      collectKeys(child, output);
    }
  }
  return output;
}

describe('Snart autonomy contract', () => {
  it('freezes source, scope, cost and disabled capabilities', () => {
    const contract = loadJson(CONTRACT_PATH);

    expect(contract.schemaVersion).toBe('babyora-snart-autonomy-contract@1');
    expect(contract.status).toBe('locked_for_autonomous_implementation');
    expect(contract.expectedNewCostNok).toBe(0);
    expect(contract.capabilities).toEqual({
      family_sharing: false,
      personal_calibration: false,
      soon_preparation: false,
    });
    expect(contract.source).toMatchObject({
      datasetName: 'seNorge_2018',
      sourceOrganization: 'Meteorologisk institutt (MET Norway)',
      normalPeriod: {
        from: '1991-01-01',
        through: '2020-12-31',
      },
      variableVersions: {
        rr: '23.11',
        tg: '23.09',
        tn: '23.09',
        tx: '23.09',
      },
      attributionText:
        'Historiske data: Meteorologisk institutt (MET Norway). Bearbeidet av Babyora.',
      derivedDataDisclaimer:
        'Babyora-avledet 1991–2020-klimatologi basert på MET seNorge_2018 v23.09/v23.11; ikke et MET-varsel eller en offisiell MET-normal.',
    });
  });

  it('derives every unique canonical place key from NO_CITIES', () => {
    const contract = loadJson(CONTRACT_PATH);
    const projection = homePlaceProjection();
    const projectionSha256 = sha256(`${canonicalJson(projection)}\n`);

    expect(NO_CITIES).toHaveLength(60);
    expect(new Set(projection.map((entry) => entry.homePlaceKey)).size).toBe(
      projection.length,
    );
    expect(contract.homePlacePolicy).toMatchObject({
      version: 'home-place-key@1',
      canonicalProjectionSha256: projectionSha256,
      currentExpectedCount: projection.length,
      runtimeMatch: 'exact-normalized-name-and-exact-latE4-lonE4',
      fallback: 'unavailable',
    });

    const ranaKeys = projection
      .filter(
        (entry) => entry.latE4 === 663_128 && entry.lonE4 === 141_422,
      )
      .map((entry) => entry.homePlaceKey);
    expect(ranaKeys).toHaveLength(2);
    expect(new Set(ranaKeys).size).toBe(2);
  });

  it('freezes exact HTTP, grid, time, derivation and age boundaries', () => {
    const contract = loadJson(CONTRACT_PATH);

    expect(contract.httpPolicy).toEqual(
      expect.objectContaining({
        version: 'met-thredds-http@1',
        scheme: 'https:',
        hostname: 'thredds.met.no',
        allowedPorts: ['', '443'],
        pathPattern:
          '^/thredds/dodsC/senorge/seNorge_2018/Archive/seNorge2018_(199[1-9]|20(0[0-9]|1[0-9]|20))\\.nc\\.(dds|das|ascii)$',
        allowedQueryVariables: [
          'latitude',
          'longitude',
          'rr',
          'tg',
          'time',
          'tn',
          'tx',
        ],
        userAgent: 'klemeg/1.0 (sivertskotvold@gmail.com)',
        redirect: 'manual',
        timeoutMilliseconds: 20_000,
        maxBodyBytes: {
          coordinateGrid: 100_663_296,
          metadataOrPoint: 2_097_152,
        },
        acceptedStatuses: [200],
        retryableStatuses: [429, 500, 502, 503, 504],
        maxAttempts: 3,
        retryBackoffMilliseconds: [1_000, 2_000],
        retryAfterClampSeconds: [0, 30],
      }),
    );
    expect(contract.gridPolicy).toMatchObject({
      version: 'nearest-grid-cell@1',
      earthRadiusMetres: 6_371_008.8,
      maxDistanceMillimetres: 5_000_000,
      order: ['distanceMillimetres', 'Y', 'X'],
      distanceRounding: 'half-away-from-zero',
      invalidSelectedCell: 'grid_invalid_or_sea',
      neighbourFallback: false,
    });
    expect(contract.timePolicy).toMatchObject({
      version: 'met-utc-local-date@1',
      timezone: 'Europe/Oslo',
      allowedUtcHours: [6, 18],
      profileKeyCount: 365,
      leapDayPolicy:
        'map-target-02-29-to-02-28;discard-source-02-29',
    });
    expect(contract.derivationPolicy).toMatchObject({
      version: 'babyora-climate-derivation@1',
      centeredWindowOffsets: [-2, -1, 0, 1, 2],
      expectedSamplesPerKey: 150,
      minimumRepresentedYears: 27,
      minimumValidSamples: 135,
      quantileMethod: 'Type-7',
      outputFields: ['p10MinC', 'p50MeanC', 'p90MaxC', 'wetProbability'],
      rounding: {
        distanceMillimetres: 0,
        mode: 'half-away-from-zero',
        temperature: 1,
        wetProbability: 4,
      },
    });
    expect(contract.agePolicy).toMatchObject({
      ageScopeMonths: [0, 24],
      targetWindowDayOffsets: [28, 42],
      eligibilityExpression:
        'targetEndLocalDate < addCalendarMonthsClamped(birthLocalDate,25)',
      boundaryCases: {
        twentyFiveMonthsAtD28: false,
        twentyFiveMonthsAtD35: false,
        twentyFiveMonthsAtD42: false,
        twentyFiveMonthsAtD43: true,
      },
    });
  });

  it('locks review receipts to independent forkless collaboration identities', () => {
    const contract = loadJson(CONTRACT_PATH);

    expect(contract.reviewPolicy).toMatchObject({
      maxCompleteAttempts: 3,
      exhaustedStatus: 'FAIL_REVIEW_CYCLES_EXHAUSTED',
      forkTurns: 'none',
      candidateSchemaVersion: 'snart-review-candidate@1',
      receiptSchemaVersion: 'codex-collaboration-review-receipt@1',
      resultSchemaVersion: 'snart-review-result@1',
      requireDistinctReviewerAgentIds: true,
      requireDistinctReviewerCanonicalTaskNames: true,
      requireImplementerExclusion: true,
      provenanceAuthenticated: false,
      localReceiptsAreNotCryptographicProvenance: true,
      immutableHashes: [
        'contractSha256',
        'evidenceSha256',
        'gitSha',
        'packSha256',
        'treeSha',
      ],
    });
  });

  it('contains no health, solar or child-size contract fields', () => {
    const contract = loadJson(CONTRACT_PATH);
    const forbiddenKey =
      /^(health|medical|safetyAdvice|solar|uv|sun|size|fit|birthDate|childId)$/iu;
    const keys = collectKeys(contract);

    expect(keys.filter((key) => forbiddenKey.test(key))).toEqual([]);
  });
});

describe('Snart source and boundary fixtures', () => {
  it('binds official excerpts to exact official source URLs and hashes', () => {
    const fixtures = loadJson(FIXTURE_PATH);
    const officialExcerpts = fixtures.officialExcerpts as JsonRecord[];

    expect(fixtures.schemaVersion).toBe('babyora-snart-boundaries@1');
    expect(officialExcerpts.map((entry) => entry.kind)).toEqual([
      'dds',
      'das',
      'ascii',
    ]);
    for (const excerpt of officialExcerpts) {
      expect(excerpt.syntheticBoundary).toBe(false);
      expect(excerpt.sourceUrl).toMatch(
        /^https:\/\/thredds\.met\.no\/thredds\/dodsC\/senorge\/seNorge_2018\/Archive\/seNorge2018_2020\.nc\.(dds|das|ascii)/u,
      );
      expect(excerpt.sha256).toBe(sha256(excerpt.body as string));
    }
  });

  it('labels every synthetic boundary and covers every fail-closed family', () => {
    const fixtures = loadJson(FIXTURE_PATH);
    const cases = fixtures.syntheticCases as JsonRecord[];
    const areas = new Set(cases.map((entry) => entry.area));

    for (const boundary of cases) {
      expect(boundary.syntheticBoundary).toBe(true);
    }
    expect(areas).toEqual(
      new Set([
        'age',
        'candidate-receipt-schema',
        'grid-sea',
        'grid-tie',
        'http-downgrade',
        'http-oversize',
        'http-redirect',
        'http-retry',
        'http-timeout',
        'http-truncated',
        'leap-date',
        'rounding',
        'window',
      ]),
    );
  });

  it('matches the checked-in environment User-Agent exactly', () => {
    const contract = loadJson(CONTRACT_PATH);
    const envLine = readFileSync('.env.example', 'utf8')
      .split(/\r?\n/u)
      .find((line) => line.startsWith('VITE_METNO_USER_AGENT='));

    expect(envLine).toBe(
      `VITE_METNO_USER_AGENT=${(contract.httpPolicy as JsonRecord).userAgent}`,
    );
  });
});
