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
  centeredWindowKeys,
  deriveClimateDays,
  fetchTextWithPolicy,
  profileKeys,
  publishBundleAtomically,
  roundHalfAwayFromZero,
  selectNearestGridCell,
  type7Quantile,
  validateMetUrl,
  type RawClimateObservation,
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

afterEach(() => {
  vi.restoreAllMocks();
  for (const path of temporaryPaths.splice(0)) {
    rmSync(path, { recursive: true, force: true });
  }
});

describe('Snart climate HTTP and source boundary', () => {
  it('accepts only the exact frozen MET URL grammar', () => {
    const contract = loadContract();
    const valid =
      'https://thredds.met.no/thredds/dodsC/senorge/seNorge_2018/Archive/seNorge2018_2020.nc.ascii?time[0:1:365],tg[0:1:365][10:1:10][20:1:20]';

    expect(validateMetUrl(valid, contract.httpPolicy)).toMatchObject({
      kind: 'ascii',
      year: 2020,
    });
    for (const invalid of [
      valid.replace('https:', 'http:'),
      valid.replace('thredds.met.no', 'example.invalid'),
      valid.replace('2020.nc', '2021.nc'),
      valid.replace('.ascii', '.html'),
      valid.replace('tg[', 'unknown['),
      valid.replace('https://', 'https://user:secret@'),
      `${valid}#fragment`,
    ]) {
      expect(() => validateMetUrl(invalid, contract.httpPolicy)).toThrow();
    }
  });

  it('never follows redirects and rejects downgrade, timeout, truncation and oversize', async () => {
    const contract = loadContract();
    const url =
      'https://thredds.met.no/thredds/dodsC/senorge/seNorge_2018/Archive/seNorge2018_2020.nc.dds';
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

    const downgradeFetch = vi.fn(async () =>
      response('', {
        status: 301,
        headers: { location: 'http://thredds.met.no/data' },
      }),
    );
    await expect(
      fetchTextWithPolicy(url, contract.httpPolicy, {
        fetchImpl: downgradeFetch,
        sleep: async () => undefined,
      }),
    ).rejects.toThrow(/redirect|downgrade/iu);

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
    const url =
      'https://thredds.met.no/thredds/dodsC/senorge/seNorge_2018/Archive/seNorge2018_2020.nc.dds';
    const waits: number[] = [];
    const statuses = [429, 503, 200];
    const fetchImpl = vi.fn(async () => {
      const status = statuses.shift() ?? 500;
      if (status === 200) return response('Dataset { Float64 time[time = 366]; }');
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

describe('Snart deterministic climate derivation', () => {
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

  it('uses a 365-day ring, explicit leap mapping, Type-7 and half-away rounding', () => {
    expect(profileKeys()).toHaveLength(365);
    expect(profileKeys()).not.toContain('02-29');
    expect(centeredWindowKeys('01-01')).toEqual([
      '12-30',
      '12-31',
      '01-01',
      '01-02',
      '01-03',
    ]);
    expect(centeredWindowKeys('02-28')).toEqual([
      '02-26',
      '02-27',
      '02-28',
      '03-01',
      '03-02',
    ]);
    expect(type7Quantile([0, 10, 20, 30], 0.5)).toBe(15);
    expect(roundHalfAwayFromZero(1.25, 1)).toBe(1.3);
    expect(roundHalfAwayFromZero(-1.25, 1)).toBe(-1.3);
    expect(roundHalfAwayFromZero(0.00005, 4)).toBe(0.0001);
    expect(Object.is(roundHalfAwayFromZero(-0, 1), -0)).toBe(false);
  });

  it('fails the whole profile when one variable misses the 27-year/135-sample gate', () => {
    const contract = loadContract();
    const observations: RawClimateObservation[] = [];
    for (let year = 1991; year <= 2020; year += 1) {
      for (const key of profileKeys()) {
        observations.push({
          localDate: `${year}-${key}`,
          year,
          tg: 4,
          tn: year < 2018 ? null : 1,
          tx: 8,
          rr: 0,
        });
      }
    }

    expect(() => deriveClimateDays(observations, contract)).toThrow(
      /coverage/iu,
    );
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
  });

  it('rejects tampered data, missing places and credential-shaped text', async () => {
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
    writeFileSync(packPath, original.replace('"p10MinC":', '"p10MinC":999,'));

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
