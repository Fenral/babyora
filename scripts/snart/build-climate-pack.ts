import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { NO_CITIES } from '../../src/data/no-cities';

export type JsonValue =
  | boolean
  | null
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

type JsonRecord = { [key: string]: JsonValue };

export type HomePlaceProjection = {
  homePlaceKey: string;
  nameNfc: string;
  latE4: number;
  lonE4: number;
};

export type GridCell = {
  Y: number;
  X: number;
  lat: number;
  lon: number;
  dataValid: boolean;
};

type GridSelection =
  | {
      status: 'supported';
      Y: number;
      X: number;
      gridLat: number;
      gridLon: number;
      distanceMillimetres: number;
    }
  | {
      status: 'unavailable';
      reason: 'grid_invalid_or_sea' | 'grid_too_far';
      selected?: GridCell & { distanceMillimetres: number };
    };

export type RawClimateObservation = {
  localDate: string;
  year: number;
  tg: number | null;
  tn: number | null;
  tx: number | null;
  rr: number | null;
};

type VariableName = 'rr' | 'tg' | 'tn' | 'tx';

type CoverageStats = {
  validCount: number;
  missingCount: number;
  discardedCount: number;
  representedYears: number;
  min: number;
  max: number;
};

export type ClimateDay = {
  p10MinC: number;
  p50MeanC: number;
  p90MaxC: number;
  wetProbability: number;
  coverage: Record<VariableName, CoverageStats>;
};

type HttpPolicy = {
  scheme: string;
  hostname: string;
  allowedPorts: string[];
  allowUsername: boolean;
  allowPassword: boolean;
  allowHash: boolean;
  pathPattern: string;
  allowedQueryVariables: string[];
  userAgent: string;
  redirect: RequestRedirect;
  timeoutMilliseconds: number;
  maxBodyBytes: {
    coordinateGrid: number;
    metadataOrPoint: number;
  };
  acceptedStatuses: number[];
  retryableStatuses: number[];
  maxAttempts: number;
  maxConcurrentRequests: number;
  retryBackoffMilliseconds: number[];
  retryAfterClampSeconds: [number, number];
};

type GridPolicy = {
  earthRadiusMetres: number;
  maxDistanceMillimetres: number;
};

type SnartContract = {
  schemaVersion: string;
  contractVersion: string;
  source: {
    datasetName: string;
    sourceOrganization: string;
    normalPeriod: { from: string; through: string };
    years: number[];
    catalogUrl: string;
    catalogMachineUrl: string;
    datasetUrlTemplate: string;
    variableVersions: Record<VariableName, string>;
    requiredVariables: string[];
    fillValue: number;
    acceptedLicenseUris: string[];
    attributionText: string;
    derivedDataDisclaimer: string;
  };
  homePlacePolicy: {
    version: string;
    coordinateScale: number;
    coordinateIntegerTolerance: number;
    canonicalProjectionSha256: string;
  };
  gridPolicy: GridPolicy & { version: string };
  timePolicy: {
    version: string;
    timezone: string;
    allowedUtcHours: number[];
    profileKeyCount: number;
    leapDayPolicy: string;
  };
  derivationPolicy: {
    version: string;
    normalYears: [number, number];
    centeredWindowOffsets: number[];
    ringDays: number;
    expectedSamplesPerKey: number;
    minimumRepresentedYears: number;
    minimumValidSamples: number;
    quantileMethod: string;
    wetThresholdMillimetres: number;
    outputFields: string[];
    rounding: {
      distanceMillimetres: number;
      mode: string;
      temperature: number;
      wetProbability: number;
    };
  };
  httpPolicy: HttpPolicy & { version: string };
  serializationPolicy: {
    version: string;
  };
};

type FetchTextOptions = {
  fetchImpl?: (input: string, init: RequestInit) => Promise<Response>;
  sleep?: (milliseconds: number) => Promise<void>;
  now?: () => number;
  maxBodyBytes?: number;
};

type BuildOptions = {
  contractPath: string;
  fixturePath?: string;
  mode: 'cache' | 'fixture' | 'live';
  outputDir: string;
  cacheDir?: string;
  createdFromGitSha?: string;
  onProgress?: (message: string) => void;
};

type SourceResponseDigest = {
  url: string;
  sha256: string;
};

type SourceMetadata = {
  year: number;
  timeCount: number;
  Y: number;
  X: number;
  licenseUri: string;
  sourceInstitution: string;
  variableVersions: Record<VariableName, string>;
  ddsSha256: string;
  dasSha256: string;
};

type BuiltBundle = {
  packPath: string;
  manifestPath: string;
  packSha256: string;
  supportedProfileCount: number;
  unavailableProfileCount: number;
};

const PACK_NAME = 'climate-1991-2020-v1.json';
const MANIFEST_NAME = 'climate-1991-2020-v1.manifest.json';
const VARIABLES: VariableName[] = ['rr', 'tg', 'tn', 'tx'];
const THIS_FILE = fileURLToPath(import.meta.url);

export class SnartPipelineError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = 'SnartPipelineError';
    this.code = code;
  }
}

function compareUtf8(left: string, right: string): number {
  return Buffer.from(left).compare(Buffer.from(right));
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    throw new SnartPipelineError('FAIL_NON_FINITE', 'JSON number is not finite');
  }
  if (Object.is(value, -0)) return '0';
  const rendered = String(value);
  if (!/[eE]/u.test(rendered)) return rendered;

  const [coefficient, exponentText] = rendered.toLowerCase().split('e');
  const exponent = Number(exponentText);
  const negative = coefficient.startsWith('-');
  const digits = coefficient.replace('-', '').replace('.', '');
  const decimalIndex =
    coefficient.replace('-', '').indexOf('.') === -1
      ? coefficient.replace('-', '').length
      : coefficient.replace('-', '').indexOf('.');
  const targetIndex = decimalIndex + exponent;
  const unsigned =
    targetIndex <= 0
      ? `0.${'0'.repeat(-targetIndex)}${digits}`
      : targetIndex >= digits.length
        ? `${digits}${'0'.repeat(targetIndex - digits.length)}`
        : `${digits.slice(0, targetIndex)}.${digits.slice(targetIndex)}`;
  return negative ? `-${unsigned}` : unsigned;
}

export function canonicalJson(value: JsonValue): string {
  if (value === null || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') return formatNumber(value);
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((child) => canonicalJson(child)).join(',')}]`;
  }
  return `{${Object.entries(value)
    .sort(([left], [right]) => compareUtf8(left, right))
    .map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`)
    .join(',')}}`;
}

export function canonicalJsonFile(value: JsonValue): string {
  return `${canonicalJson(value)}\n`;
}

export function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function writeAtomic(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${process.pid}`;
  writeFileSync(temporary, content, { encoding: 'utf8', flag: 'w' });
  renameSync(temporary, path);
}

function normalizedName(name: string): string {
  return name.normalize('NFC').trim().replace(/\s+/gu, ' ');
}

function coordinateE4(value: number, scale: number, tolerance: number): number {
  if (!Number.isFinite(value)) {
    throw new SnartPipelineError('FAIL_PLACE_COORDINATE', 'non-finite coordinate');
  }
  const scaled = value * scale;
  const integer = Math.round(scaled);
  if (Math.abs(scaled - integer) > tolerance) {
    throw new SnartPipelineError(
      'FAIL_PLACE_COORDINATE',
      `coordinate ${value} is not exact at scale ${scale}`,
    );
  }
  return integer;
}

export function buildHomePlaceProjection(
  contractPath =
    '.planning/phases/01-planlegg-dagslinjen/01-SNART-AUTONOMY-CONTRACT.json',
): HomePlaceProjection[] {
  const contract = readJson<SnartContract>(contractPath);
  const scale = contract.homePlacePolicy.coordinateScale;
  const tolerance = contract.homePlacePolicy.coordinateIntegerTolerance;
  const projection = NO_CITIES.map((city) => {
    if (city.lat < -90 || city.lat > 90 || city.lon < -180 || city.lon > 180) {
      throw new SnartPipelineError(
        'FAIL_PLACE_COORDINATE',
        `invalid coordinate range for ${city.name}`,
      );
    }
    const nameNfc = normalizedName(city.name);
    const latE4 = coordinateE4(city.lat, scale, tolerance);
    const lonE4 = coordinateE4(city.lon, scale, tolerance);
    return {
      homePlaceKey: `no-city:v1:${encodeURIComponent(
        nameNfc.toLowerCase(),
      )}:${latE4}:${lonE4}`,
      nameNfc,
      latE4,
      lonE4,
    };
  }).sort((left, right) => compareUtf8(left.homePlaceKey, right.homePlaceKey));

  if (
    new Set(projection.map((place) => place.homePlaceKey)).size !==
    projection.length
  ) {
    throw new SnartPipelineError(
      'FAIL_PLACE_KEY_COLLISION',
      'canonical home-place keys are not unique',
    );
  }
  const projectionSha = sha256(
    canonicalJsonFile(projection as unknown as JsonValue),
  );
  if (projectionSha !== contract.homePlacePolicy.canonicalProjectionSha256) {
    throw new SnartPipelineError(
      'FAIL_PLACE_PROJECTION_SHA',
      `current projection ${projectionSha} differs from contract`,
    );
  }
  return projection;
}

function splitQuerySelections(query: string): string[] {
  const selections: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < query.length; index += 1) {
    const character = query[index];
    if (character === '[') depth += 1;
    if (character === ']') depth -= 1;
    if (depth < 0) {
      throw new SnartPipelineError('FAIL_URL_QUERY', 'unbalanced query slice');
    }
    if (character === ',' && depth === 0) {
      selections.push(query.slice(start, index));
      start = index + 1;
    }
  }
  if (depth !== 0) {
    throw new SnartPipelineError('FAIL_URL_QUERY', 'unbalanced query slice');
  }
  selections.push(query.slice(start));
  return selections;
}

export function validateMetUrl(
  input: string,
  policy: HttpPolicy,
): { kind: 'ascii' | 'das' | 'dds'; year: number; url: URL } {
  const parsed = new URL(input);
  if (parsed.protocol !== policy.scheme) {
    throw new SnartPipelineError('FAIL_URL_SCHEME', 'only frozen HTTPS is allowed');
  }
  if (parsed.hostname !== policy.hostname) {
    throw new SnartPipelineError('FAIL_URL_HOST', 'unexpected MET hostname');
  }
  if (!policy.allowedPorts.includes(parsed.port)) {
    throw new SnartPipelineError('FAIL_URL_PORT', 'unexpected effective port');
  }
  if (
    (!policy.allowUsername && parsed.username !== '') ||
    (!policy.allowPassword && parsed.password !== '') ||
    (!policy.allowHash && parsed.hash !== '')
  ) {
    throw new SnartPipelineError(
      'FAIL_URL_AUTHORITY',
      'credentials and fragments are forbidden',
    );
  }
  const contractPathPattern = new RegExp(policy.pathPattern, 'u');
  if (!contractPathPattern.test(parsed.pathname)) {
    throw new SnartPipelineError('FAIL_URL_PATH', 'path is outside frozen archive');
  }
  const match = parsed.pathname.match(
    /seNorge2018_(\d{4})\.nc\.(dds|das|ascii)$/u,
  );
  if (!match) {
    throw new SnartPipelineError('FAIL_URL_PATH', 'cannot identify year/kind');
  }
  const year = Number(match[1]);
  const kind = match[2] as 'ascii' | 'das' | 'dds';
  if (kind !== 'ascii' && parsed.search !== '') {
    throw new SnartPipelineError(
      'FAIL_URL_QUERY',
      'metadata endpoints cannot carry a query',
    );
  }
  if (kind === 'ascii') {
    if (parsed.search.length <= 1) {
      throw new SnartPipelineError('FAIL_URL_QUERY', 'ASCII query is required');
    }
    const decoded = decodeURIComponent(parsed.search.slice(1));
    for (const selection of splitQuerySelections(decoded)) {
      const selectionMatch = selection.match(
        /^([a-z]+)((?:\[\d+(?::\d+){0,2}\])+)$/u,
      );
      if (
        !selectionMatch ||
        !policy.allowedQueryVariables.includes(selectionMatch[1])
      ) {
        throw new SnartPipelineError(
          'FAIL_URL_QUERY',
          `unknown or malformed selection ${selection}`,
        );
      }
      const slices = [...selectionMatch[2].matchAll(/\[([^\]]+)\]/gu)];
      for (const slice of slices) {
        const values = slice[1].split(':').map(Number);
        if (
          values.length < 1 ||
          values.length > 3 ||
          values.some((value) => !Number.isSafeInteger(value) || value < 0)
        ) {
          throw new SnartPipelineError(
            'FAIL_URL_QUERY',
            `invalid integer slice ${slice[0]}`,
          );
        }
        if (values.length === 3 && (values[1] <= 0 || values[0] > values[2])) {
          throw new SnartPipelineError(
            'FAIL_URL_QUERY',
            `invalid slice bounds ${slice[0]}`,
          );
        }
        if (values.length === 2 && values[0] > values[1]) {
          throw new SnartPipelineError(
            'FAIL_URL_QUERY',
            `invalid slice bounds ${slice[0]}`,
          );
        }
      }
    }
  }
  return { kind, year, url: parsed };
}

function retryDelayMilliseconds(
  response: Response,
  attempt: number,
  policy: HttpPolicy,
  now: number,
): number {
  const backoff = policy.retryBackoffMilliseconds[attempt - 1] ?? 0;
  const retryAfter = response.headers.get('retry-after');
  if (!retryAfter) return backoff;
  let seconds: number;
  if (/^\d+(?:\.\d+)?$/u.test(retryAfter.trim())) {
    seconds = Number(retryAfter);
  } else {
    const date = Date.parse(retryAfter);
    if (!Number.isFinite(date)) return backoff;
    seconds = Math.max(0, (date - now) / 1000);
  }
  const [minimum, maximum] = policy.retryAfterClampSeconds;
  const clamped = Math.min(maximum, Math.max(minimum, seconds));
  return Math.max(backoff, Math.round(clamped * 1000));
}

async function readLimitedBody(
  response: Response,
  maxBodyBytes: number,
): Promise<string> {
  const lengthHeader = response.headers.get('content-length');
  const expectedLength =
    lengthHeader === null || lengthHeader === ''
      ? null
      : Number.parseInt(lengthHeader, 10);
  if (
    expectedLength !== null &&
    (!Number.isSafeInteger(expectedLength) || expectedLength < 0)
  ) {
    throw new SnartPipelineError(
      'FAIL_CONTENT_LENGTH',
      'invalid Content-Length header',
    );
  }
  if (expectedLength !== null && expectedLength > maxBodyBytes) {
    throw new SnartPipelineError(
      'FAIL_BODY_LIMIT',
      `response size ${expectedLength} exceeds limit ${maxBodyBytes}`,
    );
  }
  if (!response.body) {
    if (expectedLength === 0 || expectedLength === null) return '';
    throw new SnartPipelineError('FAIL_TRUNCATED', 'response body is missing');
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const item = await reader.read();
    if (item.done) break;
    total += item.value.byteLength;
    if (total > maxBodyBytes) {
      await reader.cancel();
      throw new SnartPipelineError(
        'FAIL_BODY_LIMIT',
        `streamed response exceeds limit ${maxBodyBytes}`,
      );
    }
    chunks.push(item.value);
  }
  if (expectedLength !== null && expectedLength !== total) {
    throw new SnartPipelineError(
      'FAIL_TRUNCATED',
      `received ${total} of ${expectedLength} bytes`,
    );
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export async function fetchTextWithPolicy(
  input: string,
  policy: HttpPolicy,
  options: FetchTextOptions = {},
): Promise<{ text: string; attempts: number; sha256: string }> {
  const validated = validateMetUrl(input, policy);
  const fetchImpl =
    options.fetchImpl ??
    ((url: string, init: RequestInit) => fetch(url, init));
  const sleep =
    options.sleep ??
    ((milliseconds: number) =>
      new Promise<void>((resolveSleep) => {
        setTimeout(resolveSleep, milliseconds);
      }));
  const now = options.now ?? Date.now;
  const maxBodyBytes =
    options.maxBodyBytes ??
    (validated.kind === 'ascii' &&
    /(?:^|,)latitude\[|(?:^|,)longitude\[/u.test(
      decodeURIComponent(validated.url.search.slice(1)),
    )
      ? policy.maxBodyBytes.coordinateGrid
      : policy.maxBodyBytes.metadataOrPoint);

  for (let attempt = 1; attempt <= policy.maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      policy.timeoutMilliseconds,
    );
    let response: Response;
    try {
      response = await fetchImpl(validated.url.href, {
        headers: { 'User-Agent': policy.userAgent },
        redirect: policy.redirect,
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timeout);
      if (
        controller.signal.aborted ||
        (error instanceof DOMException && error.name === 'AbortError')
      ) {
        throw new SnartPipelineError(
          'FAIL_TIMEOUT',
          `request aborted after ${policy.timeoutMilliseconds} ms`,
        );
      }
      throw new SnartPipelineError(
        'FAIL_NETWORK',
        error instanceof Error ? error.message : 'unknown fetch failure',
      );
    } finally {
      clearTimeout(timeout);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location') ?? 'missing Location';
      throw new SnartPipelineError(
        'FAIL_REDIRECT',
        `redirect was not followed (${response.status}: ${location})`,
      );
    }
    if (!policy.acceptedStatuses.includes(response.status)) {
      if (
        policy.retryableStatuses.includes(response.status) &&
        attempt < policy.maxAttempts
      ) {
        await response.body?.cancel();
        await sleep(retryDelayMilliseconds(response, attempt, policy, now()));
        continue;
      }
      throw new SnartPipelineError(
        'FAIL_HTTP_STATUS',
        `unexpected HTTP ${response.status}`,
      );
    }

    const contentType = (
      response.headers.get('content-type') ?? ''
    ).toLowerCase();
    if (
      contentType !== '' &&
      !contentType.startsWith('text/plain') &&
      !contentType.startsWith('application/octet-stream')
    ) {
      throw new SnartPipelineError(
        'FAIL_CONTENT_TYPE',
        `unexpected content type ${contentType}`,
      );
    }
    const text = await readLimitedBody(response, maxBodyBytes);
    return { text, attempts: attempt, sha256: sha256(text) };
  }
  throw new SnartPipelineError(
    'FAIL_RETRY_EXHAUSTED',
    'retry loop exhausted unexpectedly',
  );
}

export function roundHalfAwayFromZero(value: number, scale: number): number {
  if (!Number.isFinite(value) || !Number.isInteger(scale) || scale < 0) {
    throw new SnartPipelineError('FAIL_ROUNDING_INPUT', 'invalid rounding input');
  }
  const factor = 10 ** scale;
  const rounded =
    Math.sign(value) * Math.floor(Math.abs(value) * factor + 0.5 + 1e-12);
  const result = rounded / factor;
  return Object.is(result, -0) ? 0 : result;
}

function haversineMetres(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  radius: number,
): number {
  const radians = Math.PI / 180;
  const deltaLat = (lat2 - lat1) * radians;
  const deltaLon = (lon2 - lon1) * radians;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1 * radians) *
      Math.cos(lat2 * radians) *
      Math.sin(deltaLon / 2) ** 2;
  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function selectNearestGridCell(
  place: HomePlaceProjection,
  cells: Iterable<GridCell>,
  policy: GridPolicy,
): GridSelection {
  let selected:
    | (GridCell & {
        distanceMillimetres: number;
      })
    | undefined;
  const placeLat = place.latE4 / 10_000;
  const placeLon = place.lonE4 / 10_000;
  for (const cell of cells) {
    if (
      !Number.isFinite(cell.lat) ||
      !Number.isFinite(cell.lon) ||
      !Number.isSafeInteger(cell.Y) ||
      !Number.isSafeInteger(cell.X)
    ) {
      continue;
    }
    const distanceMillimetres = roundHalfAwayFromZero(
      haversineMetres(
        placeLat,
        placeLon,
        cell.lat,
        cell.lon,
        policy.earthRadiusMetres,
      ) * 1000,
      0,
    );
    const candidate = { ...cell, distanceMillimetres };
    if (
      !selected ||
      candidate.distanceMillimetres < selected.distanceMillimetres ||
      (candidate.distanceMillimetres === selected.distanceMillimetres &&
        (candidate.Y < selected.Y ||
          (candidate.Y === selected.Y && candidate.X < selected.X)))
    ) {
      selected = candidate;
    }
  }
  if (!selected || !selected.dataValid) {
    return {
      status: 'unavailable',
      reason: 'grid_invalid_or_sea',
      ...(selected ? { selected } : {}),
    };
  }
  if (selected.distanceMillimetres > policy.maxDistanceMillimetres) {
    return { status: 'unavailable', reason: 'grid_too_far', selected };
  }
  return {
    status: 'supported',
    Y: selected.Y,
    X: selected.X,
    gridLat: selected.lat,
    gridLon: selected.lon,
    distanceMillimetres: selected.distanceMillimetres,
  };
}

let cachedProfileKeys: string[] | undefined;

export function profileKeys(): string[] {
  if (!cachedProfileKeys) {
    const keys: string[] = [];
    const cursor = new Date(Date.UTC(2001, 0, 1));
    while (cursor.getUTCFullYear() === 2001) {
      keys.push(
        `${String(cursor.getUTCMonth() + 1).padStart(2, '0')}-${String(
          cursor.getUTCDate(),
        ).padStart(2, '0')}`,
      );
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    cachedProfileKeys = keys;
  }
  return [...cachedProfileKeys];
}

export function centeredWindowKeys(key: string): string[] {
  const keys = profileKeys();
  const index = keys.indexOf(key === '02-29' ? '02-28' : key);
  if (index < 0) {
    throw new SnartPipelineError('FAIL_PROFILE_KEY', `unknown key ${key}`);
  }
  return [-2, -1, 0, 1, 2].map(
    (offset) => keys[(index + offset + keys.length) % keys.length],
  );
}

export function type7Quantile(values: number[], probability: number): number {
  if (
    values.length === 0 ||
    probability < 0 ||
    probability > 1 ||
    values.some((value) => !Number.isFinite(value))
  ) {
    throw new SnartPipelineError('FAIL_QUANTILE_INPUT', 'invalid Type-7 input');
  }
  const sorted = [...values].sort((left, right) => left - right);
  if (probability === 0) return sorted[0];
  if (probability === 1) return sorted[sorted.length - 1];
  const h = (sorted.length - 1) * probability + 1;
  const j = Math.floor(h);
  const gamma = h - j;
  const lower = sorted[j - 1];
  const upper = sorted[Math.min(j, sorted.length - 1)];
  return lower + gamma * (upper - lower);
}

function validateRawValue(value: number | null, fillValue: number): number | null {
  if (value === null || value === fillValue) return null;
  if (!Number.isFinite(value)) {
    throw new SnartPipelineError(
      'FAIL_SOURCE_VALUE',
      'source value is not finite',
    );
  }
  return value;
}

export function deriveClimateDays(
  observations: RawClimateObservation[],
  contract: SnartContract,
): Record<string, ClimateDay> {
  const byYearAndKey = new Map<string, RawClimateObservation>();
  let discardedLeapDaySamples = 0;
  for (const observation of observations) {
    if (
      observation.year < contract.derivationPolicy.normalYears[0] ||
      observation.year > contract.derivationPolicy.normalYears[1] ||
      !observation.localDate.startsWith(`${observation.year}-`)
    ) {
      throw new SnartPipelineError(
        'FAIL_SOURCE_DATE',
        `date ${observation.localDate} is outside its source year`,
      );
    }
    const key = observation.localDate.slice(5);
    if (key === '02-29') {
      discardedLeapDaySamples += VARIABLES.length;
      continue;
    }
    if (!profileKeys().includes(key)) {
      throw new SnartPipelineError(
        'FAIL_SOURCE_DATE',
        `invalid calendar key ${key}`,
      );
    }
    const mapKey = `${observation.year}:${key}`;
    if (byYearAndKey.has(mapKey)) {
      throw new SnartPipelineError(
        'FAIL_DUPLICATE_DATE',
        `duplicate observation ${mapKey}`,
      );
    }
    byYearAndKey.set(mapKey, {
      ...observation,
      rr: validateRawValue(observation.rr, contract.source.fillValue),
      tg: validateRawValue(observation.tg, contract.source.fillValue),
      tn: validateRawValue(observation.tn, contract.source.fillValue),
      tx: validateRawValue(observation.tx, contract.source.fillValue),
    });
  }

  const output: Record<string, ClimateDay> = {};
  for (const key of profileKeys()) {
    const windows = centeredWindowKeys(key);
    const values: Record<VariableName, number[]> = {
      rr: [],
      tg: [],
      tn: [],
      tx: [],
    };
    const represented: Record<VariableName, Set<number>> = {
      rr: new Set(),
      tg: new Set(),
      tn: new Set(),
      tx: new Set(),
    };
    for (
      let year = contract.derivationPolicy.normalYears[0];
      year <= contract.derivationPolicy.normalYears[1];
      year += 1
    ) {
      for (const windowKey of windows) {
        const observation = byYearAndKey.get(`${year}:${windowKey}`);
        for (const variable of VARIABLES) {
          const value = observation?.[variable] ?? null;
          if (value !== null) {
            values[variable].push(value);
            represented[variable].add(year);
          }
        }
      }
    }
    const coverage = {} as Record<VariableName, CoverageStats>;
    for (const variable of VARIABLES) {
      if (
        values[variable].length <
          contract.derivationPolicy.minimumValidSamples ||
        represented[variable].size <
          contract.derivationPolicy.minimumRepresentedYears
      ) {
        throw new SnartPipelineError(
          'FAIL_COVERAGE',
          `${key}/${variable} coverage ${values[variable].length}/${represented[variable].size} is below contract`,
        );
      }
      coverage[variable] = {
        validCount: values[variable].length,
        missingCount:
          contract.derivationPolicy.expectedSamplesPerKey -
          values[variable].length,
        discardedCount:
          key === '02-28' ? Math.floor(discardedLeapDaySamples / 30) : 0,
        representedYears: represented[variable].size,
        min: Math.min(...values[variable]),
        max: Math.max(...values[variable]),
      };
    }
    const wetCount = values.rr.filter(
      (value) => value >= contract.derivationPolicy.wetThresholdMillimetres,
    ).length;
    output[key] = {
      p10MinC: roundHalfAwayFromZero(
        type7Quantile(values.tn, 0.1),
        contract.derivationPolicy.rounding.temperature,
      ),
      p50MeanC: roundHalfAwayFromZero(
        type7Quantile(values.tg, 0.5),
        contract.derivationPolicy.rounding.temperature,
      ),
      p90MaxC: roundHalfAwayFromZero(
        type7Quantile(values.tx, 0.9),
        contract.derivationPolicy.rounding.temperature,
      ),
      wetProbability: roundHalfAwayFromZero(
        wetCount / values.rr.length,
        contract.derivationPolicy.rounding.wetProbability,
      ),
      coverage,
    };
  }
  return output;
}

function gitHead(): string {
  return execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
}

function cachePaths(cacheDir: string, url: string) {
  const key = sha256(url);
  return {
    body: join(cacheDir, 'responses', `${key}.body`),
    metadata: join(cacheDir, 'responses', `${key}.json`),
  };
}

async function readOrFetchCached(
  url: string,
  contract: SnartContract,
  cacheDir: string,
  offline: boolean,
  maxBodyBytes?: number,
): Promise<{ text: string; sha256: string }> {
  const paths = cachePaths(cacheDir, url);
  if (existsSync(paths.body) && existsSync(paths.metadata)) {
    const text = readFileSync(paths.body, 'utf8');
    const metadata = readJson<{ url: string; bodySha256: string }>(
      paths.metadata,
    );
    const bodySha = sha256(text);
    if (metadata.url !== url || metadata.bodySha256 !== bodySha) {
      throw new SnartPipelineError(
        'FAIL_CACHE_TAMPERING',
        `cache identity mismatch for ${url}`,
      );
    }
    return { text, sha256: bodySha };
  }
  if (offline) {
    throw new SnartPipelineError(
      'FAIL_CACHE_MISS',
      `offline cache has no validated response for ${url}`,
    );
  }
  const fetched = await fetchTextWithPolicy(url, contract.httpPolicy, {
    maxBodyBytes,
  });
  writeAtomic(paths.body, fetched.text);
  writeAtomic(
    paths.metadata,
    canonicalJsonFile({
      bodySha256: fetched.sha256,
      url,
    }),
  );
  return { text: fetched.text, sha256: fetched.sha256 };
}

export function parseDds(
  body: string,
  year: number,
  contract: SnartContract,
): { timeCount: number; Y: number; X: number } {
  const timeMatch = body.match(/Float64 time\[time = (\d+)\];/u);
  const gridMatch = body.match(
    /Float32 tg\[time = \d+\]\[Y = (\d+)\]\[X = (\d+)\];/u,
  );
  if (!timeMatch || !gridMatch) {
    throw new SnartPipelineError('FAIL_DDS_SCHEMA', `missing dimensions ${year}`);
  }
  const timeCount = Number(timeMatch[1]);
  const Y = Number(gridMatch[1]);
  const X = Number(gridMatch[2]);
  const leap =
    year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  if (timeCount !== (leap ? 366 : 365)) {
    throw new SnartPipelineError(
      'FAIL_DDS_TIME',
      `${year} has unexpected time dimension ${timeCount}`,
    );
  }
  for (const variable of contract.source.requiredVariables) {
    if (!new RegExp(`\\b${variable}\\b`, 'u').test(body)) {
      throw new SnartPipelineError(
        'FAIL_DDS_VARIABLE',
        `${year} is missing ${variable}`,
      );
    }
  }
  return { timeCount, Y, X };
}

function attributeBlock(body: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const match = body.match(new RegExp(`\\n\\s*${escaped} \\{([\\s\\S]*?)\\n\\s*\\}`, 'u'));
  if (!match) {
    throw new SnartPipelineError(
      'FAIL_DAS_SCHEMA',
      `missing attribute block ${name}`,
    );
  }
  return match[1];
}

function quotedAttribute(block: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const match = block.match(
    new RegExp(`String ${escaped} "([^"]+)";`, 'u'),
  );
  if (!match) {
    throw new SnartPipelineError(
      'FAIL_DAS_ATTRIBUTE',
      `missing ${name} attribute`,
    );
  }
  return match[1];
}

export function parseDas(
  body: string,
  contract: SnartContract,
): {
  licenseUri: string;
  sourceInstitution: string;
  variableVersions: Record<VariableName, string>;
} {
  const variableVersions = {} as Record<VariableName, string>;
  for (const variable of VARIABLES) {
    const block = attributeBlock(body, variable);
    const fillMatch = block.match(/Float32 _FillValue (-?\d+(?:\.\d+)?);/u);
    if (!fillMatch || Number(fillMatch[1]) !== contract.source.fillValue) {
      throw new SnartPipelineError(
        'FAIL_DAS_FILL',
        `${variable} has an unexpected fill value`,
      );
    }
    const version = quotedAttribute(block, 'version');
    if (version !== contract.source.variableVersions[variable]) {
      throw new SnartPipelineError(
        'FAIL_DAS_VERSION',
        `${variable} version ${version} differs from contract`,
      );
    }
    variableVersions[variable] = version;
  }
  const globalBlock = attributeBlock(body, 'NC_GLOBAL');
  const sourceInstitution = quotedAttribute(globalBlock, 'institution');
  const licenseUri = quotedAttribute(globalBlock, 'license');
  if (
    sourceInstitution !== 'Norwegian Meteorological Institute, MET Norway' ||
    !contract.source.acceptedLicenseUris.includes(licenseUri)
  ) {
    throw new SnartPipelineError(
      'FAIL_DAS_PROVENANCE',
      'source institution or license differs from contract',
    );
  }
  return { licenseUri, sourceInstitution, variableVersions };
}

function parseArrayRows(
  body: string,
  heading: RegExp,
): { heading: RegExpMatchArray; rows: string[] } {
  const lines = body.replace(/\r\n/gu, '\n').split('\n');
  const index = lines.findIndex((line) => heading.test(line.trim()));
  if (index < 0) {
    throw new SnartPipelineError(
      'FAIL_ASCII_SCHEMA',
      `missing array heading ${heading.source}`,
    );
  }
  const headingMatch = lines[index].trim().match(heading);
  if (!headingMatch) {
    throw new SnartPipelineError('FAIL_ASCII_SCHEMA', 'heading parse mismatch');
  }
  const rows: string[] = [];
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    const line = lines[cursor].trim();
    if (line === '') {
      if (rows.length > 0) break;
      continue;
    }
    if (!line.startsWith('[') && rows.length > 0) break;
    if (line.startsWith('[')) rows.push(line);
  }
  return { heading: headingMatch, rows };
}

function parseTimeValues(body: string): number[] {
  const lines = body.replace(/\r\n/gu, '\n').split('\n');
  const index = lines.findIndex((line) => /^time\[\d+\]$/u.test(line.trim()));
  if (index < 0) {
    throw new SnartPipelineError('FAIL_ASCII_TIME', 'time array is missing');
  }
  const expected = Number(lines[index].trim().match(/\d+/u)?.[0]);
  const tokens: string[] = [];
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    const line = lines[cursor].trim();
    if (line === '') {
      if (tokens.length > 0) break;
      continue;
    }
    if (/^[A-Za-z]/u.test(line)) break;
    tokens.push(...line.split(',').map((token) => token.trim()).filter(Boolean));
  }
  const values = tokens.map(Number);
  if (
    values.length !== expected ||
    values.some((value) => !Number.isFinite(value))
  ) {
    throw new SnartPipelineError(
      'FAIL_ASCII_TIME',
      `expected ${expected} time values, received ${values.length}`,
    );
  }
  return values;
}

function parsePointVariable(
  body: string,
  variable: VariableName,
  expectedCount: number,
): (number | null)[] {
  const parsed = parseArrayRows(
    body,
    new RegExp(`^${variable}\\.${variable}\\[(\\d+)\\]\\[1\\]\\[1\\]$`, 'u'),
  );
  if (Number(parsed.heading[1]) !== expectedCount) {
    throw new SnartPipelineError(
      'FAIL_ASCII_VARIABLE',
      `${variable} count differs from time`,
    );
  }
  const values = parsed.rows.map((row, index) => {
    const match = row.match(/^\[(\d+)\]\[0\],\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)$/u);
    if (!match || Number(match[1]) !== index) {
      throw new SnartPipelineError(
        'FAIL_ASCII_VARIABLE',
        `${variable} row ${index} is malformed`,
      );
    }
    const value = Number(match[2]);
    return Number.isFinite(value) ? value : null;
  });
  if (values.length !== expectedCount) {
    throw new SnartPipelineError(
      'FAIL_ASCII_VARIABLE',
      `${variable} row count differs from time`,
    );
  }
  return values;
}

function localIsoDateFromHours(
  hoursSince1900: number,
  contract: SnartContract,
): string {
  const milliseconds =
    Date.UTC(1900, 0, 1) + hoursSince1900 * 60 * 60 * 1000;
  const instant = new Date(milliseconds);
  if (
    !Number.isFinite(milliseconds) ||
    !contract.timePolicy.allowedUtcHours.includes(instant.getUTCHours()) ||
    instant.getUTCMinutes() !== 0 ||
    instant.getUTCSeconds() !== 0
  ) {
    throw new SnartPipelineError(
      'FAIL_SOURCE_INSTANT',
      `unexpected source instant ${instant.toISOString()}`,
    );
  }
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: contract.timePolicy.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function parsePointAscii(
  body: string,
  year: number,
  contract: SnartContract,
): RawClimateObservation[] {
  const times = parseTimeValues(body);
  const values = {
    rr: parsePointVariable(body, 'rr', times.length),
    tg: parsePointVariable(body, 'tg', times.length),
    tn: parsePointVariable(body, 'tn', times.length),
    tx: parsePointVariable(body, 'tx', times.length),
  };
  const seen = new Set<string>();
  return times.map((time, index) => {
    const localDate = localIsoDateFromHours(time, contract);
    if (!localDate.startsWith(`${year}-`) || seen.has(localDate)) {
      throw new SnartPipelineError(
        'FAIL_SOURCE_DATE',
        `duplicate or out-of-year local date ${localDate}`,
      );
    }
    seen.add(localDate);
    const normalize = (value: number | null) =>
      value === contract.source.fillValue ? null : value;
    return {
      localDate,
      year,
      rr: normalize(values.rr[index]),
      tg: normalize(values.tg[index]),
      tn: normalize(values.tn[index]),
      tx: normalize(values.tx[index]),
    };
  });
}

function parseGridArray(
  body: string,
  variable: 'latitude' | 'longitude',
  expectedY: number,
  expectedX: number,
): Float64Array {
  const parsed = parseArrayRows(
    body,
    new RegExp(`^${variable}\\.${variable}\\[(\\d+)\\]\\[(\\d+)\\]$`, 'u'),
  );
  if (
    Number(parsed.heading[1]) !== expectedY ||
    Number(parsed.heading[2]) !== expectedX ||
    parsed.rows.length !== expectedY
  ) {
    throw new SnartPipelineError(
      'FAIL_GRID_SCHEMA',
      `${variable} dimensions do not match DDS`,
    );
  }
  const output = new Float64Array(expectedY * expectedX);
  for (let Y = 0; Y < parsed.rows.length; Y += 1) {
    const match = parsed.rows[Y].match(/^\[(\d+)\],\s*(.+)$/u);
    if (!match || Number(match[1]) !== Y) {
      throw new SnartPipelineError(
        'FAIL_GRID_SCHEMA',
        `${variable} row ${Y} is malformed`,
      );
    }
    const values = match[2].split(',').map((value) => Number(value.trim()));
    if (
      values.length !== expectedX ||
      values.some((value) => !Number.isFinite(value))
    ) {
      throw new SnartPipelineError(
        'FAIL_GRID_SCHEMA',
        `${variable} row ${Y} has invalid values`,
      );
    }
    output.set(values, Y * expectedX);
  }
  return output;
}

function selectAllGridCells(
  projection: HomePlaceProjection[],
  latitudes: Float64Array,
  longitudes: Float64Array,
  YCount: number,
  XCount: number,
  policy: GridPolicy,
): Map<string, GridSelection> {
  const selections = new Map<string, GridSelection>();
  for (const place of projection) {
    const placeLat = place.latE4 / 10_000;
    const placeLon = place.lonE4 / 10_000;
    let selected:
      | (GridCell & {
          distanceMillimetres: number;
        })
      | undefined;

    // The production grid contains millions of cells. Keeping this as a
    // tight, allocation-free loop avoids constructing hundreds of millions
    // of temporary iterator objects while preserving nearest-grid-cell@1.
    for (let Y = 0; Y < YCount; Y += 1) {
      const rowOffset = Y * XCount;
      for (let X = 0; X < XCount; X += 1) {
        const index = rowOffset + X;
        const lat = latitudes[index];
        const lon = longitudes[index];
        const coordinateValid =
          Number.isFinite(lat) &&
          Number.isFinite(lon) &&
          lat >= -90 &&
          lat <= 90 &&
          lon >= -180 &&
          lon <= 180;
        if (!coordinateValid) {
          continue;
        }
        const distanceMillimetres = roundHalfAwayFromZero(
          haversineMetres(
            placeLat,
            placeLon,
            lat,
            lon,
            policy.earthRadiusMetres,
          ) * 1000,
          0,
        );
        if (
          !selected ||
          distanceMillimetres < selected.distanceMillimetres ||
          (distanceMillimetres === selected.distanceMillimetres &&
            (Y < selected.Y || (Y === selected.Y && X < selected.X)))
        ) {
          selected = {
            Y,
            X,
            lat,
            lon,
            dataValid: true,
            distanceMillimetres,
          };
        }
      }
    }

    if (!selected) {
      selections.set(place.homePlaceKey, {
        status: 'unavailable',
        reason: 'grid_invalid_or_sea',
      });
    } else if (
      selected.distanceMillimetres > policy.maxDistanceMillimetres
    ) {
      selections.set(place.homePlaceKey, {
        status: 'unavailable',
        reason: 'grid_too_far',
        selected,
      });
    } else {
      selections.set(place.homePlaceKey, {
        status: 'supported',
        Y: selected.Y,
        X: selected.X,
        gridLat: selected.lat,
        gridLon: selected.lon,
        distanceMillimetres: selected.distanceMillimetres,
      });
    }
  }
  return selections;
}

function syntheticFixtureObservations(): RawClimateObservation[] {
  const observations: RawClimateObservation[] = [];
  const keys = profileKeys();
  for (let year = 1991; year <= 2020; year += 1) {
    const leap =
      year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      const seasonal = 7 + Math.sin(((index - 30) / 365) * Math.PI * 2) * 8;
      const yearOffset = (year - 2005.5) * 0.01;
      const tg = seasonal + yearOffset;
      observations.push({
        localDate: `${year}-${key}`,
        year,
        tg,
        tn: tg - 3.25,
        tx: tg + 4.75,
        rr: index % 5 === 0 ? 2.5 : 0.2,
      });
      if (leap && key === '02-28') {
        observations.push({
          localDate: `${year}-02-29`,
          year,
          tg,
          tn: tg - 3.25,
          tx: tg + 4.75,
          rr: 0.2,
        });
      }
    }
  }
  return observations;
}

function builderSha256(): string {
  return sha256(readFileSync(THIS_FILE));
}

function makePack(
  contract: SnartContract,
  profiles: Record<string, JsonValue>,
): JsonRecord {
  return {
    schemaVersion: 'babyora-snart-climate-pack@1',
    derivationVersion: contract.derivationPolicy.version,
    normalPeriod: contract.source.normalPeriod as unknown as JsonValue,
    profiles,
    rulesetVersion: 'babyora-snart-heuristics@1',
  };
}

function makeManifest(input: {
  contract: SnartContract;
  contractSha256: string;
  createdFromGitSha: string;
  fixtureMode: boolean;
  licenseUri: string;
  sourceMetadataSha256: string;
  sourceResponses: SourceResponseDigest[];
  bindings: JsonValue[];
  supportedProfileCount: number;
  unavailableProfileCount: number;
  packSha256: string;
}): JsonRecord {
  const { contract } = input;
  return {
    schemaVersion: 'babyora-snart-climate-manifest@1',
    builderSha256: builderSha256(),
    canonicalPlaceCount:
      input.supportedProfileCount + input.unavailableProfileCount,
    canonicalPlacesSha256: contract.homePlacePolicy.canonicalProjectionSha256,
    contractSha256: input.contractSha256,
    coveragePolicy: {
      expectedSamplesPerKey:
        contract.derivationPolicy.expectedSamplesPerKey,
      minimumRepresentedYears:
        contract.derivationPolicy.minimumRepresentedYears,
      minimumValidSamples: contract.derivationPolicy.minimumValidSamples,
      partialProfiles: false,
    },
    createdFromGitSha: input.createdFromGitSha,
    derivationVersion: contract.derivationPolicy.version,
    fixtureMode: input.fixtureMode,
    gridPolicyVersion: contract.gridPolicy.version,
    homePlaceKeyVersion: contract.homePlacePolicy.version,
    httpPolicyVersion: contract.httpPolicy.version,
    leapDayPolicy: contract.timePolicy.leapDayPolicy,
    normalPeriod: contract.source.normalPeriod as unknown as JsonValue,
    packSha256: input.packSha256,
    placeGridBindings: input.bindings,
    productionEligible: !input.fixtureMode,
    quantileMethod: contract.derivationPolicy.quantileMethod,
    roundingPolicy: contract.derivationPolicy.rounding as unknown as JsonValue,
    rulesetVersion: 'babyora-snart-heuristics@1',
    sourceCatalogUrl: contract.source.catalogUrl,
    sourceDatasetName: contract.source.datasetName,
    sourceDatasetUrls: contract.source.years.map((year) =>
      contract.source.datasetUrlTemplate.replace('{YYYY}', String(year)),
    ),
    sourceDisclaimer: contract.source.derivedDataDisclaimer,
    sourceInstitution: contract.source.sourceOrganization,
    sourceLicenseUri: input.licenseUri,
    sourceMetadataSha256: input.sourceMetadataSha256,
    sourceResponseSha256: input.sourceResponses.map(
      (entry) => entry as unknown as JsonValue,
    ),
    sourceVariableVersions:
      contract.source.variableVersions as unknown as JsonValue,
    supportedProfileCount: input.supportedProfileCount,
    timeMappingVersion: contract.timePolicy.version,
    unavailableProfileCount: input.unavailableProfileCount,
  };
}

function writeBundle(
  outputDir: string,
  pack: JsonRecord,
  manifestWithoutPackHash: Omit<JsonRecord, 'packSha256'> | JsonRecord,
): BuiltBundle {
  mkdirSync(outputDir, { recursive: true });
  const packContent = canonicalJsonFile(pack);
  const packSha = sha256(packContent);
  const manifest = { ...manifestWithoutPackHash, packSha256: packSha };
  const manifestContent = canonicalJsonFile(manifest);
  const packPath = join(outputDir, PACK_NAME);
  const manifestPath = join(outputDir, MANIFEST_NAME);
  writeAtomic(packPath, packContent);
  writeAtomic(manifestPath, manifestContent);
  return {
    packPath,
    manifestPath,
    packSha256: packSha,
    supportedProfileCount: Number(manifest.supportedProfileCount),
    unavailableProfileCount: Number(manifest.unavailableProfileCount),
  };
}

async function buildFixtureBundle(
  options: BuildOptions,
  contract: SnartContract,
  contractSha: string,
): Promise<BuiltBundle> {
  if (!options.fixturePath) {
    throw new SnartPipelineError(
      'FAIL_FIXTURE_PATH',
      'fixture mode requires fixturePath',
    );
  }
  const fixtures = readJson<{
    officialExcerpts: {
      sourceUrl: string;
      sha256: string;
      body: string;
    }[];
    fixtureBuild: {
      productionEligible: boolean;
      supportedHomePlaceNames: string[];
    };
  }>(options.fixturePath);
  if (fixtures.fixtureBuild.productionEligible) {
    throw new SnartPipelineError(
      'FAIL_FIXTURE_PRODUCTION',
      'fixture data can never be production eligible',
    );
  }
  for (const excerpt of fixtures.officialExcerpts) {
    if (sha256(excerpt.body) !== excerpt.sha256) {
      throw new SnartPipelineError(
        'FAIL_FIXTURE_SHA',
        `fixture source excerpt hash mismatch for ${excerpt.sourceUrl}`,
      );
    }
  }
  const projection = buildHomePlaceProjection(options.contractPath);
  const supportedNames = new Set(
    fixtures.fixtureBuild.supportedHomePlaceNames.map((name) =>
      normalizedName(name),
    ),
  );
  const days = deriveClimateDays(syntheticFixtureObservations(), contract);
  const profiles: Record<string, JsonValue> = {};
  const bindings: JsonValue[] = [];
  for (const place of projection) {
    if (supportedNames.has(place.nameNfc)) {
      profiles[place.homePlaceKey] = {
        days: days as unknown as JsonValue,
        grid: {
          X: 0,
          Y: 0,
          distanceMillimetres: 0,
          lat: place.latE4 / 10_000,
          lon: place.lonE4 / 10_000,
        },
        homePlaceKey: place.homePlaceKey,
        profileId: `snart-profile:v1:${place.homePlaceKey}`,
      };
      bindings.push({
        ...place,
        X: 0,
        Y: 0,
        distanceMillimetres: 0,
        gridLat: place.latE4 / 10_000,
        gridLon: place.lonE4 / 10_000,
        profileId: `snart-profile:v1:${place.homePlaceKey}`,
        status: 'supported',
      } as unknown as JsonValue);
    } else {
      bindings.push({
        ...place,
        reason: 'fixture_not_supported',
        status: 'unavailable',
      } as unknown as JsonValue);
    }
  }
  const pack = makePack(contract, profiles);
  const packSha = sha256(canonicalJsonFile(pack));
  const sourceResponses = fixtures.officialExcerpts.map((excerpt) => ({
    url: excerpt.sourceUrl,
    sha256: excerpt.sha256,
  }));
  const manifest = makeManifest({
    contract,
    contractSha256: contractSha,
    createdFromGitSha: options.createdFromGitSha ?? 'fixture-candidate',
    fixtureMode: true,
    licenseUri: contract.source.acceptedLicenseUris[0],
    sourceMetadataSha256: sha256(
      canonicalJsonFile(sourceResponses as unknown as JsonValue),
    ),
    sourceResponses,
    bindings,
    supportedProfileCount: Object.keys(profiles).length,
    unavailableProfileCount: projection.length - Object.keys(profiles).length,
    packSha256: packSha,
  });
  return writeBundle(options.outputDir, pack, manifest);
}

async function preflightSource(
  contract: SnartContract,
  cacheDir: string,
  offline: boolean,
  sourceResponses: SourceResponseDigest[],
  onProgress: (message: string) => void,
): Promise<SourceMetadata[]> {
  const metadata: SourceMetadata[] = [];
  for (const year of contract.source.years) {
    onProgress(`preflight ${year}`);
    const base = contract.source.datasetUrlTemplate.replace(
      '{YYYY}',
      String(year),
    );
    const ddsUrl = `${base}.dds`;
    const dasUrl = `${base}.das`;
    const dds = await readOrFetchCached(
      ddsUrl,
      contract,
      cacheDir,
      offline,
    );
    const das = await readOrFetchCached(
      dasUrl,
      contract,
      cacheDir,
      offline,
    );
    sourceResponses.push(
      { url: ddsUrl, sha256: dds.sha256 },
      { url: dasUrl, sha256: das.sha256 },
    );
    const dimensions = parseDds(dds.text, year, contract);
    const attributes = parseDas(das.text, contract);
    metadata.push({
      year,
      ...dimensions,
      ...attributes,
      ddsSha256: dds.sha256,
      dasSha256: das.sha256,
    });
  }
  const first = metadata[0];
  for (const entry of metadata) {
    if (
      entry.Y !== first.Y ||
      entry.X !== first.X ||
      entry.licenseUri !== first.licenseUri ||
      canonicalJson(entry.variableVersions as unknown as JsonValue) !==
        canonicalJson(first.variableVersions as unknown as JsonValue)
    ) {
      throw new SnartPipelineError(
        'FAIL_SOURCE_DRIFT',
        `source schema/provenance drift in ${entry.year}`,
      );
    }
  }
  return metadata;
}

function pointQuery(
  base: string,
  timeCount: number,
  Y: number,
  X: number,
): string {
  const last = timeCount - 1;
  const variables = VARIABLES.map(
    (variable) =>
      `${variable}[0:1:${last}][${Y}:1:${Y}][${X}:1:${X}]`,
  );
  return `${base}.ascii?time[0:1:${last}],${variables.join(',')}`;
}

async function buildLiveOrCacheBundle(
  options: BuildOptions,
  contract: SnartContract,
  contractSha: string,
): Promise<BuiltBundle> {
  if (!options.cacheDir) {
    throw new SnartPipelineError(
      'FAIL_CACHE_PATH',
      'live/cache mode requires cacheDir',
    );
  }
  const offline = options.mode === 'cache';
  const onProgress = options.onProgress ?? (() => undefined);
  const sourceResponses: SourceResponseDigest[] = [];
  const metadata = await preflightSource(
    contract,
    options.cacheDir,
    offline,
    sourceResponses,
    onProgress,
  );
  const reference = metadata.find((entry) => entry.year === 2020) ?? metadata[0];
  const referenceBase = contract.source.datasetUrlTemplate.replace(
    '{YYYY}',
    String(reference.year),
  );
  const gridUrl = `${referenceBase}.ascii?latitude[0:1:${
    reference.Y - 1
  }][0:1:${reference.X - 1}],longitude[0:1:${reference.Y - 1}][0:1:${
    reference.X - 1
  }]`;
  onProgress('resolve grid coordinates');
  const grid = await readOrFetchCached(
    gridUrl,
    contract,
    options.cacheDir,
    offline,
    contract.httpPolicy.maxBodyBytes.coordinateGrid,
  );
  sourceResponses.push({ url: gridUrl, sha256: grid.sha256 });
  const latitudes = parseGridArray(
    grid.text,
    'latitude',
    reference.Y,
    reference.X,
  );
  const longitudes = parseGridArray(
    grid.text,
    'longitude',
    reference.Y,
    reference.X,
  );
  const projection = buildHomePlaceProjection(options.contractPath);
  const selections = selectAllGridCells(
    projection,
    latitudes,
    longitudes,
    reference.Y,
    reference.X,
    contract.gridPolicy,
  );
  const profiles: Record<string, JsonValue> = {};
  const bindings: JsonValue[] = [];
  let placeIndex = 0;
  for (const place of projection) {
    placeIndex += 1;
    const selection = selections.get(place.homePlaceKey);
    if (!selection || selection.status === 'unavailable') {
      bindings.push({
        ...place,
        reason: selection?.reason ?? 'grid_invalid_or_sea',
        status: 'unavailable',
      } as unknown as JsonValue);
      continue;
    }
    onProgress(
      `fetch point ${placeIndex}/${projection.length} ${place.nameNfc} ` +
        `Y=${selection.Y} X=${selection.X}`,
    );
    const observations: RawClimateObservation[] = [];
    for (const entry of metadata) {
      onProgress(
        `fetch point ${placeIndex}/${projection.length} ${place.nameNfc} ${entry.year}`,
      );
      const base = contract.source.datasetUrlTemplate.replace(
        '{YYYY}',
        String(entry.year),
      );
      const url = pointQuery(
        base,
        entry.timeCount,
        selection.Y,
        selection.X,
      );
      const point = await readOrFetchCached(
        url,
        contract,
        options.cacheDir,
        offline,
      );
      sourceResponses.push({ url, sha256: point.sha256 });
      observations.push(...parsePointAscii(point.text, entry.year, contract));
    }
    try {
      const days = deriveClimateDays(observations, contract);
      const profileId = `snart-profile:v1:${place.homePlaceKey}`;
      profiles[place.homePlaceKey] = {
        days: days as unknown as JsonValue,
        grid: {
          X: selection.X,
          Y: selection.Y,
          distanceMillimetres: selection.distanceMillimetres,
          lat: selection.gridLat,
          lon: selection.gridLon,
        },
        homePlaceKey: place.homePlaceKey,
        profileId,
      };
      bindings.push({
        ...place,
        X: selection.X,
        Y: selection.Y,
        distanceMillimetres: selection.distanceMillimetres,
        gridLat: selection.gridLat,
        gridLon: selection.gridLon,
        profileId,
        status: 'supported',
      } as unknown as JsonValue);
    } catch (error) {
      if (
        error instanceof SnartPipelineError &&
        (error.code === 'FAIL_COVERAGE' ||
          error.code === 'FAIL_SOURCE_VALUE' ||
          error.code === 'FAIL_DUPLICATE_DATE')
      ) {
        bindings.push({
          ...place,
          reason: 'grid_invalid_or_sea',
          status: 'unavailable',
        } as unknown as JsonValue);
      } else {
        throw error;
      }
    }
  }
  const pack = makePack(contract, profiles);
  const packSha = sha256(canonicalJsonFile(pack));
  const sourceMetadataSha = sha256(
    canonicalJsonFile(metadata as unknown as JsonValue),
  );
  const manifest = makeManifest({
    contract,
    contractSha256: contractSha,
    createdFromGitSha: options.createdFromGitSha ?? gitHead(),
    fixtureMode: false,
    licenseUri: metadata[0].licenseUri,
    sourceMetadataSha256: sourceMetadataSha,
    sourceResponses,
    bindings,
    supportedProfileCount: Object.keys(profiles).length,
    unavailableProfileCount: projection.length - Object.keys(profiles).length,
    packSha256: packSha,
  });
  return writeBundle(options.outputDir, pack, manifest);
}

export async function buildClimatePack(
  options: BuildOptions,
): Promise<BuiltBundle> {
  const contractBytes = readFileSync(options.contractPath);
  const contract = JSON.parse(contractBytes.toString('utf8')) as SnartContract;
  if (
    contract.schemaVersion !== 'babyora-snart-autonomy-contract@1' ||
    contract.httpPolicy.maxConcurrentRequests !== 1
  ) {
    throw new SnartPipelineError(
      'FAIL_CONTRACT',
      'unexpected contract or concurrency policy',
    );
  }
  const contractSha = sha256(contractBytes);
  if (options.mode === 'fixture') {
    return buildFixtureBundle(options, contract, contractSha);
  }
  return buildLiveOrCacheBundle(options, contract, contractSha);
}

export async function publishBundleAtomically(
  stagedDir: string,
  destinationDir: string,
  validateStaged: () => Promise<void> | void,
): Promise<void> {
  await validateStaged();
  const names = [PACK_NAME, MANIFEST_NAME];
  for (const name of names) {
    if (!existsSync(join(stagedDir, name))) {
      throw new SnartPipelineError(
        'FAIL_STAGED_OUTPUT',
        `staged output is missing ${name}`,
      );
    }
  }
  mkdirSync(destinationDir, { recursive: true });
  const nextPaths = names.map((name) => join(destinationDir, `${name}.next`));
  const backupPaths = names.map((name) =>
    join(destinationDir, `${name}.previous`),
  );
  const finalPaths = names.map((name) => join(destinationDir, name));
  for (let index = 0; index < names.length; index += 1) {
    rmSync(nextPaths[index], { force: true });
    rmSync(backupPaths[index], { force: true });
    copyFileSync(join(stagedDir, names[index]), nextPaths[index]);
  }
  const movedBackups: number[] = [];
  const published: number[] = [];
  try {
    for (let index = 0; index < names.length; index += 1) {
      if (existsSync(finalPaths[index])) {
        renameSync(finalPaths[index], backupPaths[index]);
        movedBackups.push(index);
      }
    }
    for (let index = 0; index < names.length; index += 1) {
      renameSync(nextPaths[index], finalPaths[index]);
      published.push(index);
    }
  } catch (error) {
    for (const index of published.reverse()) {
      rmSync(finalPaths[index], { force: true });
    }
    for (const index of movedBackups.reverse()) {
      if (existsSync(backupPaths[index])) {
        renameSync(backupPaths[index], finalPaths[index]);
      }
    }
    throw error;
  } finally {
    for (const path of [...nextPaths, ...backupPaths]) {
      rmSync(path, { force: true });
    }
  }
}

function argumentValue(arguments_: string[], name: string): string | undefined {
  const index = arguments_.indexOf(name);
  return index >= 0 ? arguments_[index + 1] : undefined;
}

async function main(): Promise<void> {
  const arguments_ = process.argv.slice(2);
  const contractPath =
    argumentValue(arguments_, '--contract') ??
    '.planning/phases/01-planlegg-dagslinjen/01-SNART-AUTONOMY-CONTRACT.json';
  const fixturePath =
    argumentValue(arguments_, '--fixtures') ??
    'scripts/snart/fixtures/met-boundaries-v1.json';
  const outputDir =
    argumentValue(arguments_, '--output-dir') ?? 'tmp/snart-climate-output';
  const cacheDir =
    argumentValue(arguments_, '--cache-dir') ?? 'tmp/snart-climate-source';
  const mode: BuildOptions['mode'] = arguments_.includes('--fixture-mode')
    ? 'fixture'
    : arguments_.includes('--offline')
      ? 'cache'
      : 'live';
  const result = await buildClimatePack({
    contractPath,
    fixturePath,
    mode,
    outputDir,
    cacheDir,
    createdFromGitSha: argumentValue(arguments_, '--created-from-git-sha'),
    onProgress: (message) => process.stderr.write(`[snart] ${message}\n`),
  });
  process.stdout.write(
    `${canonicalJsonFile({
      manifestPath: result.manifestPath,
      packPath: result.packPath,
      packSha256: result.packSha256,
      supportedProfileCount: result.supportedProfileCount,
      unavailableProfileCount: result.unavailableProfileCount,
    })}`,
  );
}

const invokedPath = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : '';
if (invokedPath === import.meta.url) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
