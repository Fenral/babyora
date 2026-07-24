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

function expectedMonthlyDatasetUrls(): string[] {
  const root =
    'https://thredds.met.no/thredds/dodsC/senorge/seNorge_2018/aggregated_products';
  return (['tg', 'rr'] as const).flatMap((family) =>
    Array.from({ length: 12 }, (_, index) => {
      const month = String(index + 1).padStart(2, '0');
      return `${root}/${family}/seNorge2018_${family}_normal_1991_2020_monthly_${month}.nc`;
    }),
  );
}

describe('Snart autonomy contract', () => {
  it('freezes source, scope, cost and disabled capabilities', () => {
    const contract = loadJson(CONTRACT_PATH);

    expect(contract.schemaVersion).toBe('babyora-snart-autonomy-contract@2');
    expect(contract.contractVersion).toBe('snart-monthly-normal-contract@2');
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
        fromYear: 1991,
        throughYear: 2020,
      },
      variableVersions: {
        rr: 'v23_11',
        tg: 'v23_09',
      },
      fileVersions: {
        rr: '1.0',
        tg: '1.0',
      },
      units: {
        rr: 'mm',
        tg: 'Celsius',
      },
      aggregations: {
        rr: 'time: sum',
        tg: 'time: mean',
      },
      attributionText:
        'Månedsnormaler 1991–2020: Meteorologisk institutt (MET Norway). Bearbeidet av Babyora.',
      derivedDataDisclaimer:
        'Kildefilene er offisielle MET-månedsnormaler. Babyoras målperiodeberegning og plaggheuristikker er ikke et MET-varsel eller en MET-anbefaling.',
    });

    const source = contract.source as JsonRecord;
    expect(source.datasetUrls).toEqual(expectedMonthlyDatasetUrls());
    expect(new Set(source.datasetUrls as string[]).size).toBe(24);
    expect(source.catalogUrls).toEqual({
      rr: 'https://thredds.met.no/thredds/catalog/senorge/seNorge_2018/aggregated_products/rr/catalog.xml',
      tg: 'https://thredds.met.no/thredds/catalog/senorge/seNorge_2018/aggregated_products/tg/catalog.xml',
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

  it('freezes exact HTTP, grid, monthly-pack and age boundaries', () => {
    const contract = loadJson(CONTRACT_PATH);

    expect(contract.httpPolicy).toEqual(
      expect.objectContaining({
        version: 'met-thredds-http@1',
        method: 'GET',
        scheme: 'https:',
        hostname: 'thredds.met.no',
        allowedPorts: ['', '443'],
        pathPattern:
          '^/thredds/dodsC/senorge/seNorge_2018/aggregated_products/(tg|rr)/seNorge2018_(tg|rr)_normal_1991_2020_monthly_(0[1-9]|1[0-2])\\.nc\\.(dds|das|ascii)$',
        requireFamilyVariableMatch: true,
        allowedDatasetUrls: expectedMonthlyDatasetUrls(),
        allowedQueryVariables: ['lat', 'lon', 'rr', 'tg', 'time'],
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
      pointResponseMapBinding:
        'exact-selected-grid-axis-values-from-validated-coordinate-grid',
    });
    expect(contract.derivationPolicy).toMatchObject({
      version: 'babyora-monthly-normal-pack@2',
      monthCount: 12,
      rowFields: [
        'month',
        'meanTemperatureC',
        'monthlyPrecipitationMm',
      ],
      targetWindowDerivationVersion:
        'babyora-target-window-monthly-weighting@1',
      targetMeanTemperatureFormula:
        'sum(meanTemperatureC*targetDaysInMonth)/15',
      targetPrecipitationFormula:
        'sum(monthlyPrecipitationMm/daysInMonth*targetDaysInMonth)',
      leapMonthPolicy: 'use-actual-days-in-target-year-month',
      partialProfiles: false,
      sourceValueStorage: 'exact-finite-source-value',
      compareHeuristicsBeforeRounding: true,
      negativeZero: 'normalize-to-zero',
      rounding: {
        application: 'presentation-only',
        distanceMillimetres: 0,
        mode: 'half-away-from-zero',
        temperature: 1,
        precipitation: 1,
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

  it('locks review receipts to two independent signed identities', () => {
    const contract = loadJson(CONTRACT_PATH);

    expect(contract.reviewPolicy).toMatchObject({
      maxCompleteAttempts: 3,
      exhaustedStatus: 'FAIL_REVIEW_CYCLES_EXHAUSTED',
      candidateSchemaVersion: 'snart-review-candidate@1',
      receiptSchemaVersion: 'babyora-independent-review-receipt@2',
      requireDistinctReviewerAgentIds: true,
      requireDistinctReviewerCanonicalTaskNames: true,
      requireReviewerSignatureIdentityMatch: true,
      requireCleanBeforeAfter: true,
      requirePass: true,
      requiredCommandExitCode: 0,
      requireZeroUnresolvedFindings: true,
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
    expect(contract.reviewPolicy).not.toHaveProperty('forkTurns');
    expect(contract.reviewPolicy).not.toHaveProperty('implementerAgentId');
    expect(contract.reviewPolicy).not.toHaveProperty('resultSchemaVersion');
    expect(contract.reviewPolicy).not.toHaveProperty('transcriptDigest');
  });

  it('contains no health, solar or child-size contract fields', () => {
    const contract = loadJson(CONTRACT_PATH);
    const forbiddenKey =
      /^(health|medical|safetyAdvice|solar|uv|sun|size|fit|birthDate|childId)$/iu;
    const keys = collectKeys(contract);

    expect(keys.filter((key) => forbiddenKey.test(key))).toEqual([]);
  });

  it('contains no obsolete daily, quantile or wet-day contract fields', () => {
    const contract = loadJson(CONTRACT_PATH);
    const forbiddenKey =
      /^(years|timePolicy|profileKeyCount|leapDayPolicy|centeredWindowOffsets|ringDays|expectedSamplesPerKey|minimumRepresentedYears|minimumValidSamples|quantileMethod|quantileFormula|wetThresholdMillimetres|p10MinC|p50MeanC|p90MaxC|wetProbability|tn|tx)$/u;

    expect(collectKeys(contract).filter((key) => forbiddenKey.test(key))).toEqual(
      [],
    );
    expect(JSON.stringify(contract)).not.toContain('/Archive/');
  });
});

describe('Snart source and boundary fixtures', () => {
  it('binds official excerpts to exact official source URLs and hashes', () => {
    const fixtures = loadJson(FIXTURE_PATH);
    const officialExcerpts = fixtures.officialExcerpts as JsonRecord[];

    expect(fixtures.schemaVersion).toBe('babyora-snart-boundaries@2');
    expect(officialExcerpts.map((entry) => entry.kind)).toEqual([
      'dds',
      'das',
      'ascii',
      'dds',
      'das',
      'ascii',
    ]);
    for (const excerpt of officialExcerpts) {
      expect(excerpt.syntheticBoundary).toBe(false);
      expect(excerpt.sourceUrl).toMatch(
        /^https:\/\/thredds\.met\.no\/thredds\/dodsC\/senorge\/seNorge_2018\/aggregated_products\/(tg|rr)\/seNorge2018_(tg|rr)_normal_1991_2020_monthly_01\.nc\.(dds|das|ascii)/u,
      );
      expect(excerpt.sha256).toBe(sha256(excerpt.body as string));
    }
    expect(
      officialExcerpts.every(
        (entry) =>
          !String(entry.body).includes('daily minimum') &&
          !String(entry.body).includes('daily maximum'),
      ),
    ).toBe(true);
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
        'monthly-coverage',
        'monthly-url',
        'rounding',
        'target-window-weighting',
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
