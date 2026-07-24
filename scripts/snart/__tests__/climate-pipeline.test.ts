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
  deriveMonthlyProfile,
  fetchTextWithPolicy,
  parseDas,
  parseDds,
  parseMonthlyPointAscii,
  publishBundleAtomically,
  roundHalfAwayFromZero,
  selectNearestGridCell,
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

  it('never follows redirects and rejects timeout, truncation and oversize', async () => {
    const contract = loadContract();
    const url = `${contract.source.datasetUrls[0]}.dds`;
    const redirectFetch = vi.fn(async (_url: string, init: RequestInit) => {
      expect(init.redirect).toBe('manual');
      return response('', {
        status: 302,
        headers: { location: 'https://example.invalid/data' },
      });
    });

    await expect(
      fetchTextWithPolicy(url, contract.httpPolicy, {
        fetchImpl: redirectFetch,
        sleep: async () => undefined,
      }),
    ).rejects.toThrow(/redirect/iu);
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

  it('requires exactly 12 sorted finite rows and frozen rounding', () => {
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
    expect(roundHalfAwayFromZero(1.25, 1)).toBe(1.3);
    expect(roundHalfAwayFromZero(-1.25, 1)).toBe(-1.3);
    expect(Object.is(roundHalfAwayFromZero(-0, 1), -0)).toBe(false);
  });

  it('parses the official monthly-normal DDS, DAS and point excerpts', () => {
    const contract = loadContract();
    const excerpts = loadFixtures().officialExcerpts;

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
      parseMonthlyPointAscii(excerpts[2].body, 'tg', 1, contract),
    ).toMatchObject({
      family: 'tg',
      month: 1,
      value: 2.806599,
    });
    expect(
      parseMonthlyPointAscii(excerpts[5].body, 'rr', 1, contract),
    ).toMatchObject({
      family: 'rr',
      month: 1,
      value: 184.691,
    });
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
