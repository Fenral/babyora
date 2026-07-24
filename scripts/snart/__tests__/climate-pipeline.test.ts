import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildClimatePack,
  buildHomePlaceProjection,
  canonicalJsonFile,
  deriveMonthlyProfile,
  fetchTextWithPolicy,
  parseDas,
  parseDds,
  parseMonthlyPointAscii,
  publishBundleAtomically,
  roundHalfAwayFromZero,
  selectNearestGridCell,
  sha256,
  validateMetUrl,
} from '../build-climate-pack';
import { validateClimateBundle } from '../validate-climate-pack';

const CONTRACT_PATH =
  '.planning/phases/01-planlegg-dagslinjen/01-SNART-AUTONOMY-CONTRACT.json';
const FIXTURE_PATH = 'scripts/snart/fixtures/met-boundaries-v1.json';
const temporaryPaths: string[] = [];

function makeTempDir(): string {
  const directory = mkdtempSync(join(tmpdir(), 'babyora-snart-'));
  temporaryPaths.push(directory);
  return directory;
}

function loadContract() {
  return JSON.parse(readFileSync(CONTRACT_PATH, 'utf8'));
}

function loadFixtures() {
  return JSON.parse(readFileSync(FIXTURE_PATH, 'utf8'));
}

function response(body: string, init: ResponseInit = {}): Response {
  return new Response(body, {
    status: 200,
    headers: {
      'content-length': String(Buffer.byteLength(body)),
      'content-type': 'text/plain; charset=UTF-8',
    },
    ...init,
  });
}

function monthlyRows() {
  return Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    meanTemperatureC: index - 6,
    monthlyPrecipitationMm: (index + 1) * 10,
  }));
}

function calendarDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function addCalendarDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function targetSignals(
  rows: ReturnType<typeof monthlyRows>,
  asOf: Date,
): { precipitation: number; temperature: number } {
  const targetMonths = new Map<
    string,
    { count: number; month: number; year: number }
  >();
  for (let offset = 28; offset <= 42; offset += 1) {
    const date = addCalendarDays(asOf, offset);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const key = `${year}-${month}`;
    const current = targetMonths.get(key) ?? { count: 0, month, year };
    current.count += 1;
    targetMonths.set(key, current);
  }
  let precipitation = 0;
  let temperature = 0;
  for (const { count, month, year } of targetMonths.values()) {
    const row = rows[month - 1];
    temperature += row.meanTemperatureC * count;
    precipitation +=
      row.monthlyPrecipitationMm /
      daysInMonth(year, month) *
      count;
  }
  return { precipitation, temperature: temperature / 15 };
}

function temperatureBucket(value: number): number {
  return [2, 7, 12, 16].findIndex((threshold) => value <= threshold);
}

function precipitationBucket(value: number): number {
  return value < 20 ? 0 : value < 50 ? 1 : 2;
}

type MutablePack = Record<string, unknown> & {
  normalPeriod: Record<string, unknown>;
};

type MutableManifest = Record<string, unknown> & {
  packSha256: string;
  placeGridBindings: Array<Record<string, unknown>>;
  sourceAttribution?: string;
  sourceDisclaimer: string;
};

function readBundle(
  directory: string,
): { manifest: MutableManifest; pack: MutablePack } {
  return {
    manifest: JSON.parse(
      readFileSync(
        join(directory, 'climate-1991-2020-v1.manifest.json'),
        'utf8',
      ),
    ) as MutableManifest,
    pack: JSON.parse(
      readFileSync(join(directory, 'climate-1991-2020-v1.json'), 'utf8'),
    ) as MutablePack,
  };
}

function writeCanonicalBundle(
  directory: string,
  pack: MutablePack,
  manifest: MutableManifest,
): void {
  const packRaw = canonicalJsonFile(pack as never);
  manifest.packSha256 = sha256(packRaw);
  writeFileSync(join(directory, 'climate-1991-2020-v1.json'), packRaw);
  writeFileSync(
    join(directory, 'climate-1991-2020-v1.manifest.json'),
    canonicalJsonFile(manifest as never),
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  for (const path of temporaryPaths.splice(0)) {
    rmSync(path, { recursive: true, force: true });
  }
});

describe('Snart monthly-normal HTTP and source boundary', () => {
  it('accepts only the exact 24 frozen monthly MET datasets', () => {
    const contract = loadContract();
    const valid =
      'https://thredds.met.no/thredds/dodsC/senorge/seNorge_2018/aggregated_products/tg/seNorge2018_tg_normal_1991_2020_monthly_01.nc.ascii?tg[0:1:0][10:1:10][20:1:20],time[0:1:0]';

    expect(validateMetUrl(valid, contract.httpPolicy)).toMatchObject({
      datasetUrl:
        'https://thredds.met.no/thredds/dodsC/senorge/seNorge_2018/aggregated_products/tg/seNorge2018_tg_normal_1991_2020_monthly_01.nc',
      family: 'tg',
      kind: 'ascii',
      month: 1,
    });
    for (const invalid of [
      valid.replace('https:', 'http:'),
      valid.replace('thredds.met.no', 'example.invalid'),
      valid.replace('/tg/seNorge2018_tg_', '/tg/seNorge2018_rr_'),
      valid.replace('monthly_01', 'monthly_13'),
      valid.replace('.ascii', '.html'),
      valid.replace('tg[', 'unknown['),
      valid.replace('https://', 'https://user:secret@'),
      `${valid}#fragment`,
      valid.replace(
        '/aggregated_products/tg/seNorge2018_tg_normal_1991_2020_monthly_01',
        '/Archive/seNorge2018_2020',
      ),
    ]) {
      expect(() => validateMetUrl(invalid, contract.httpPolicy)).toThrow();
    }
  });

  it('uses immutable MET GET authority even when a caller supplies an alternate contract', async () => {
    const contract = loadContract();
    const url = `${contract.source.datasetUrls[0]}.dds`;
    const fetchImpl = vi.fn(async () => response('official response'));

    await fetchTextWithPolicy(url, contract.httpPolicy, { fetchImpl });
    expect(fetchImpl).toHaveBeenCalledWith(
      new URL(url).href,
      expect.objectContaining({ method: 'GET', redirect: 'manual' }),
    );

    const alternatePolicy = structuredClone(contract.httpPolicy);
    alternatePolicy.hostname = '127.0.0.1';
    alternatePolicy.allowedDatasetUrls = alternatePolicy.allowedDatasetUrls.map(
      (datasetUrl: string) =>
        datasetUrl.replace('thredds.met.no', '127.0.0.1'),
    );
    expect(() =>
      validateMetUrl(
        url.replace('thredds.met.no', '127.0.0.1'),
        alternatePolicy,
      ),
    ).toThrow(/authority|contract|frozen/iu);
  });

  it('never follows redirects, redacts Location, and rejects timeout, truncation and oversize', async () => {
    const contract = loadContract();
    const url = `${contract.source.datasetUrls[0]}.dds`;
    const credentialLocation =
      'https://redirect-user:redirect-secret@example.invalid/private';
    const redirectFetch = vi.fn(async (_url: string, init: RequestInit) => {
      expect(init.redirect).toBe('manual');
      return response('', {
        status: 302,
        headers: { location: credentialLocation },
      });
    });

    const redirectError = await fetchTextWithPolicy(
      url,
      contract.httpPolicy,
      {
        fetchImpl: redirectFetch,
        sleep: async () => undefined,
      },
    ).catch((error: unknown) => error);
    expect(redirectError).toBeInstanceOf(Error);
    expect((redirectError as Error).message).toMatch(/redirect/iu);
    expect((redirectError as Error).message).not.toContain(credentialLocation);
    expect((redirectError as Error).message).not.toMatch(
      /redirect-user|redirect-secret|Location/iu,
    );
    expect(redirectFetch).toHaveBeenCalledTimes(1);

    const abortedFetch = vi.fn(async () => {
      throw new DOMException('aborted', 'AbortError');
    });
    await expect(
      fetchTextWithPolicy(url, contract.httpPolicy, {
        fetchImpl: abortedFetch,
        sleep: async () => undefined,
      }),
    ).rejects.toThrow(/timeout|abort/iu);

    const truncatedFetch = vi.fn(async () =>
      new Response('ab', {
        status: 200,
        headers: {
          'content-length': '3',
          'content-type': 'text/plain',
        },
      }),
    );
    await expect(
      fetchTextWithPolicy(url, contract.httpPolicy, {
        fetchImpl: truncatedFetch,
        sleep: async () => undefined,
      }),
    ).rejects.toThrow(/truncat/iu);

    const oversizeFetch = vi.fn(async () =>
      new Response('x', {
        status: 200,
        headers: {
          'content-length': String(
            contract.httpPolicy.maxBodyBytes.metadataOrPoint + 1,
          ),
          'content-type': 'text/plain',
        },
      }),
    );
    await expect(
      fetchTextWithPolicy(url, contract.httpPolicy, {
        fetchImpl: oversizeFetch,
        sleep: async () => undefined,
      }),
    ).rejects.toThrow(/large|size|limit/iu);
  });

  it('treats a missing Content-Type as a terminal response failure', async () => {
    const contract = loadContract();
    const url = `${contract.source.datasetUrls[0]}.dds`;
    const body = new TextEncoder().encode('Dataset {} official');
    const fetchImpl = vi.fn(async () =>
      new Response(body, {
        status: 200,
        headers: { 'content-length': String(body.byteLength) },
      }),
    );

    await expect(
      fetchTextWithPolicy(url, contract.httpPolicy, {
        fetchImpl,
        sleep: async () => undefined,
      }),
    ).rejects.toThrow(/content.?type/iu);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('retries only 429 and frozen 5xx statuses three total attempts', async () => {
    const contract = loadContract();
    const url = `${contract.source.datasetUrls[0]}.dds`;
    const waits: number[] = [];
    const statuses = [429, 503, 200];
    const fetchImpl = vi.fn(async () => {
      const status = statuses.shift() ?? 500;
      if (status === 200) return response('Dataset { Float64 time[time = 1]; }');
      return response('', {
        status,
        headers:
          status === 429
            ? { 'retry-after': '2', 'content-type': 'text/plain' }
            : { 'content-type': 'text/plain' },
      });
    });

    const result = await fetchTextWithPolicy(url, contract.httpPolicy, {
      fetchImpl,
      sleep: async (milliseconds) => {
        waits.push(milliseconds);
      },
    });

    expect(result.attempts).toBe(3);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(waits).toEqual([2_000, 2_000]);

    const terminalFetch = vi.fn(async () =>
      response('', { status: 404, headers: { 'content-type': 'text/plain' } }),
    );
    await expect(
      fetchTextWithPolicy(url, contract.httpPolicy, {
        fetchImpl: terminalFetch,
        sleep: async () => undefined,
      }),
    ).rejects.toThrow(/404/u);
    expect(terminalFetch).toHaveBeenCalledTimes(1);
  });
});

describe('Snart deterministic monthly-normal derivation', () => {
  it('derives 60 unique current home-place keys without a builder count constant', () => {
    const projection = buildHomePlaceProjection();

    expect(projection).toHaveLength(60);
    expect(new Set(projection.map((place) => place.homePlaceKey)).size).toBe(60);
    expect(
      projection.filter(
        (place) => place.latE4 === 663_128 && place.lonE4 === 141_422,
      ),
    ).toHaveLength(2);
  });

  it('selects the geometric grid winner by millimetres, Y and X without neighbour fallback', () => {
    const contract = loadContract();
    const place = {
      homePlaceKey: 'test',
      nameNfc: 'Test',
      latE4: 600_000,
      lonE4: 100_000,
    };
    const tied = [
      { Y: 3, X: 4, lat: 60, lon: 10, dataValid: true },
      { Y: 2, X: 7, lat: 60, lon: 10, dataValid: true },
      { Y: 2, X: 6, lat: 60, lon: 10, dataValid: true },
    ];
    expect(
      selectNearestGridCell(place, tied, contract.gridPolicy),
    ).toMatchObject({ status: 'supported', Y: 2, X: 6 });

    const invalidNearest = [
      { Y: 0, X: 0, lat: 60, lon: 10, dataValid: false },
      { Y: 0, X: 1, lat: 60, lon: 10.001, dataValid: true },
    ];
    expect(
      selectNearestGridCell(place, invalidNearest, contract.gridPolicy),
    ).toEqual({
      status: 'unavailable',
      reason: 'grid_invalid_or_sea',
      selected: expect.objectContaining({ Y: 0, X: 0 }),
    });
  });

  it('requires exactly 12 sorted finite rows while preserving source precision', () => {
    const contract = loadContract();
    expect(deriveMonthlyProfile(monthlyRows(), contract)).toEqual(
      monthlyRows(),
    );
    expect(() =>
      deriveMonthlyProfile(monthlyRows().slice(0, 11), contract),
    ).toThrow(/month|coverage/iu);
    expect(() =>
      deriveMonthlyProfile(
        monthlyRows().map((row, index) =>
          index === 11 ? { ...row, month: 11 } : row,
        ),
        contract,
      ),
    ).toThrow(/month|duplicate/iu);
    expect(() =>
      deriveMonthlyProfile(
        monthlyRows().map((row, index) =>
          index === 0
            ? { ...row, meanTemperatureC: contract.source.fillValue }
            : row,
        ),
        contract,
      ),
    ).toThrow(/fill|value/iu);
    const exactRows = monthlyRows().map((row, index) =>
      index === 0
        ? {
            ...row,
            meanTemperatureC: -0,
            monthlyPrecipitationMm: 12.345_678,
          }
        : index === 1
          ? { ...row, meanTemperatureC: 1.234_567 }
          : row,
    );
    const exactProfile = deriveMonthlyProfile(exactRows, contract);
    expect(exactProfile[0].monthlyPrecipitationMm).toBe(12.345_678);
    expect(exactProfile[1].meanTemperatureC).toBe(1.234_567);
    expect(Object.is(exactProfile[0].meanTemperatureC, -0)).toBe(false);
    expect(roundHalfAwayFromZero(1.25, 1)).toBe(1.3);
    expect(roundHalfAwayFromZero(-1.25, 1)).toBe(-1.3);
    expect(Object.is(roundHalfAwayFromZero(-0, 1), -0)).toBe(false);
  });

  it('parses only an exact point response bound to family, month, time and selected cell', () => {
    const contract = loadContract();
    const excerpts = loadFixtures().officialExcerpts;
    const binding = {
      X: 119,
      Y: 1041,
      lat: 62.47589,
      lon: 6.145098,
      sourceUrl: excerpts[2].sourceUrl,
    };

    expect(parseDds(excerpts[0].body, 'tg')).toEqual({
      X: 1195,
      Y: 1550,
      family: 'tg',
      timeCount: 1,
    });
    expect(parseDas(excerpts[1].body, 'tg', contract)).toMatchObject({
      aggregation: 'time: mean',
      family: 'tg',
      fileVersion: '1.0',
      licenseUri:
        'https://www.met.no/en/free-meteorological-data/Licensing-and-crediting',
      sourceInstitution: 'Norwegian Meteorological Institute, MET Norway',
      sourceVariableVersion: 'v23_09',
      units: 'Celsius',
    });
    expect(
      parseMonthlyPointAscii(excerpts[2].body, 'tg', 1, contract, binding),
    ).toMatchObject({
      family: 'tg',
      month: 1,
      time: 797694,
      value: 2.806599,
    });
    expect(
      parseMonthlyPointAscii(excerpts[5].body, 'rr', 1, contract, {
        ...binding,
        sourceUrl: excerpts[5].sourceUrl,
      }),
    ).toMatchObject({
      family: 'rr',
      month: 1,
      time: 797694,
      value: 184.691,
    });

    for (const malformed of [
      `${excerpts[2].body}unexpected-extra-section\n`,
      excerpts[2].body.replace('monthly_01.nc;', 'monthly_02.nc;'),
      excerpts[2].body.replace('tg.time[1]\n797694.0', 'tg.time[1]\n0.0'),
      excerpts[2].body.replace('[0], 62.47589', '[0], 62.47590'),
      excerpts[2].body.replace('tg.Y[1]\n6958500.0', 'tg.Y[1]\n0.0'),
    ]) {
      expect(() =>
        parseMonthlyPointAscii(malformed, 'tg', 1, contract, binding),
      ).toThrow(/ASCII|binding|cell|month|schema|time/iu);
    }
    expect(() =>
      parseMonthlyPointAscii(excerpts[2].body, 'tg', 1, contract, {
        ...binding,
        X: binding.X + 1,
      }),
    ).toThrow(/binding|cell|query/iu);
  });
});

describe('Snart fixture build, validation and atomic output', () => {
  it('builds byte-identical fixture bundles in separate empty directories', async () => {
    const first = makeTempDir();
    const second = makeTempDir();

    await buildClimatePack({
      contractPath: CONTRACT_PATH,
      fixturePath: FIXTURE_PATH,
      mode: 'fixture',
      outputDir: first,
      createdFromGitSha: 'fixture-candidate',
    });
    await buildClimatePack({
      contractPath: CONTRACT_PATH,
      fixturePath: FIXTURE_PATH,
      mode: 'fixture',
      outputDir: second,
      createdFromGitSha: 'fixture-candidate',
    });

    for (const name of [
      'climate-1991-2020-v1.json',
      'climate-1991-2020-v1.manifest.json',
    ]) {
      expect(readFileSync(join(first, name))).toEqual(
        readFileSync(join(second, name)),
      );
    }
    expect(
      validateClimateBundle({
        contractPath: CONTRACT_PATH,
        dataDir: first,
        fixtureMode: true,
      }),
    ).toMatchObject({
      canonicalPlaceCount: 60,
      supportedProfileCount: 1,
      unavailableProfileCount: 59,
      valid: true,
    });

    const pack = JSON.parse(
      readFileSync(join(first, 'climate-1991-2020-v1.json'), 'utf8'),
    );
    const profile = Object.values(pack.profiles)[0] as {
      months: unknown[];
    };
    expect(profile.months).toHaveLength(12);
    expect(Object.keys(profile.months[0] as object).sort()).toEqual([
      'meanTemperatureC',
      'month',
      'monthlyPrecipitationMm',
    ]);

    const manifest = JSON.parse(
      readFileSync(
        join(first, 'climate-1991-2020-v1.manifest.json'),
        'utf8',
      ),
    );
    expect(manifest.sourceDatasets).toHaveLength(24);
    expect(
      manifest.sourceDatasets.map(
        (entry: { datasetUrl: string }) => entry.datasetUrl,
      ),
    ).toEqual(loadContract().source.datasetUrls);
    expect(manifest.sourceAttribution).toBe(
      loadContract().source.attributionText,
    );
    expect(manifest.sourceAttribution).toContain('Bearbeidet av Babyora');
  });

  it('preserves raw source values for every 2024-2025 15-day threshold decision', () => {
    const pack = JSON.parse(
      readFileSync(
        'src/data/snart/climate-1991-2020-v1.json',
        'utf8',
      ),
    ) as {
      profiles: Record<
        string,
        { months: ReturnType<typeof monthlyRows> }
      >;
    };
    const drift = { precipitation: 0, temperature: 0 };
    let rawPrecisionValues = 0;

    for (const profile of Object.values(pack.profiles)) {
      const rawRows = profile.months;
      const presentationRows = rawRows.map((row) => ({
        ...row,
        meanTemperatureC: roundHalfAwayFromZero(
          row.meanTemperatureC,
          1,
        ),
        monthlyPrecipitationMm: roundHalfAwayFromZero(
          row.monthlyPrecipitationMm,
          1,
        ),
      }));
      rawPrecisionValues += rawRows.filter(
        (row) =>
          row.meanTemperatureC !==
            roundHalfAwayFromZero(row.meanTemperatureC, 1) ||
          row.monthlyPrecipitationMm !==
            roundHalfAwayFromZero(row.monthlyPrecipitationMm, 1),
      ).length;

      for (
        let asOf = calendarDate(2024, 1, 1);
        asOf <= calendarDate(2025, 12, 31);
        asOf = addCalendarDays(asOf, 1)
      ) {
        const raw = targetSignals(rawRows, asOf);
        const presentation = targetSignals(presentationRows, asOf);
        if (
          temperatureBucket(raw.temperature) !==
          temperatureBucket(presentation.temperature)
        ) {
          drift.temperature += 1;
        }
        if (
          precipitationBucket(raw.precipitation) !==
          precipitationBucket(presentation.precipitation)
        ) {
          drift.precipitation += 1;
        }
      }
    }

    expect(rawPrecisionValues).toBeGreaterThan(0);
    expect(drift).toEqual({ temperature: 319, precipitation: 6 });
  });

  it('rejects extra pack, manifest and binding fields plus provenance text tampering after hashes are recomputed', async () => {
    const contract = loadContract();
    const cases: Array<{
      mutate: (
        pack: MutablePack,
        manifest: MutableManifest,
      ) => void;
      name: string;
    }> = [
      {
        name: 'pack child identity',
        mutate: (pack) => {
          pack.childId = 'forbidden-child';
        },
      },
      {
        name: 'manifest capability',
        mutate: (_pack, manifest) => {
          manifest.capability = 'soon_preparation';
        },
      },
      {
        name: 'supported binding PII',
        mutate: (_pack, manifest) => {
          manifest.placeGridBindings.find(
            (binding) => binding.status === 'supported',
          )!.childId = 'forbidden-child';
        },
      },
      {
        name: 'unavailable binding PII',
        mutate: (_pack, manifest) => {
          manifest.placeGridBindings.find(
            (binding) => binding.status === 'unavailable',
          )!.email = 'forbidden@example.invalid';
        },
      },
      {
        name: 'source disclaimer',
        mutate: (_pack, manifest) => {
          manifest.sourceDisclaimer = 'tampered but reserialized';
        },
      },
      {
        name: 'source attribution',
        mutate: (_pack, manifest) => {
          manifest.sourceAttribution =
            'Meteorologisk institutt (MET Norway)';
        },
      },
      {
        name: 'nested normal period',
        mutate: (pack) => {
          pack.normalPeriod.capability = true;
        },
      },
    ];

    for (const testCase of cases) {
      const directory = makeTempDir();
      await buildClimatePack({
        contractPath: CONTRACT_PATH,
        fixturePath: FIXTURE_PATH,
        mode: 'fixture',
        outputDir: directory,
        createdFromGitSha: 'fixture-candidate',
      });
      const { pack, manifest } = readBundle(directory);
      expect(manifest.sourceDisclaimer).toBe(
        contract.source.derivedDataDisclaimer,
      );
      expect(manifest.sourceAttribution).toBe(
        contract.source.attributionText,
      );
      testCase.mutate(pack, manifest);
      writeCanonicalBundle(directory, pack, manifest);

      expect(
        () =>
          validateClimateBundle({
            contractPath: CONTRACT_PATH,
            dataDir: directory,
            fixtureMode: true,
          }),
        testCase.name,
      ).toThrow(/field|provenance|schema/iu);
    }
  });

  it('rejects tampered monthly data, missing places and credential-shaped text', async () => {
    const directory = makeTempDir();
    await buildClimatePack({
      contractPath: CONTRACT_PATH,
      fixturePath: FIXTURE_PATH,
      mode: 'fixture',
      outputDir: directory,
      createdFromGitSha: 'fixture-candidate',
    });
    const packPath = join(directory, 'climate-1991-2020-v1.json');
    const original = readFileSync(packPath, 'utf8');
    writeFileSync(
      packPath,
      original.replace('"meanTemperatureC":-6', '"meanTemperatureC":999'),
    );

    expect(() =>
      validateClimateBundle({
        contractPath: CONTRACT_PATH,
        dataDir: directory,
        fixtureMode: true,
      }),
    ).toThrow(/hash|schema|tamper/iu);

    writeFileSync(packPath, `${original}\nFROST_CLIENT_ID=secret`);
    expect(() =>
      validateClimateBundle({
        contractPath: CONTRACT_PATH,
        dataDir: directory,
        fixtureMode: true,
      }),
    ).toThrow(/credential|JSON/iu);
  });

  it('does not overwrite the last validated output when staged validation fails', async () => {
    const staged = makeTempDir();
    const destination = makeTempDir();
    mkdirSync(staged, { recursive: true });
    writeFileSync(join(staged, 'climate-1991-2020-v1.json'), 'new-pack\n');
    writeFileSync(
      join(staged, 'climate-1991-2020-v1.manifest.json'),
      'new-manifest\n',
    );
    writeFileSync(
      join(destination, 'climate-1991-2020-v1.json'),
      'last-good-pack\n',
    );
    writeFileSync(
      join(destination, 'climate-1991-2020-v1.manifest.json'),
      'last-good-manifest\n',
    );

    await expect(
      publishBundleAtomically(staged, destination, async () => {
        throw new Error('validation failed');
      }),
    ).rejects.toThrow('validation failed');
    expect(
      readFileSync(join(destination, 'climate-1991-2020-v1.json'), 'utf8'),
    ).toBe('last-good-pack\n');
    expect(
      readFileSync(
        join(destination, 'climate-1991-2020-v1.manifest.json'),
        'utf8',
      ),
    ).toBe('last-good-manifest\n');
  });
});
