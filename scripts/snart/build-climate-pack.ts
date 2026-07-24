import { execFileSync } from 'node:child_process';
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
type VariableFamily = 'rr' | 'tg';
type EndpointKind = 'ascii' | 'das' | 'dds';

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

export type MonthlyProfileRow = {
  month: number;
  meanTemperatureC: number;
  monthlyPrecipitationMm: number;
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

type HttpPolicy = {
  scheme: string;
  hostname: string;
  allowedPorts: string[];
  allowUsername: boolean;
  allowPassword: boolean;
  allowHash: boolean;
  pathPattern: string;
  requireFamilyVariableMatch: boolean;
  allowedDatasetUrls: string[];
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

export type SnartContract = {
  schemaVersion: string;
  contractVersion: string;
  capabilities: {
    family_sharing: boolean;
    personal_calibration: boolean;
    soon_preparation: boolean;
  };
  source: {
    datasetName: string;
    sourceOrganization: string;
    metadataInstitution: string;
    normalPeriod: { fromYear: number; throughYear: number };
    datasetUrls: string[];
    catalogUrls: Record<VariableFamily, string>;
    variableVersions: Record<VariableFamily, string>;
    fileVersions: Record<VariableFamily, string>;
    units: Record<VariableFamily, string>;
    aggregations: Record<VariableFamily, string>;
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
  derivationPolicy: {
    version: string;
    monthCount: number;
    rowFields: string[];
    targetWindowDerivationVersion: string;
    partialProfiles: boolean;
    rounding: {
      distanceMillimetres: number;
      mode: string;
      temperature: number;
      precipitation: number;
    };
  };
  httpPolicy: HttpPolicy & { version: string };
  serializationPolicy: { version: string };
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

type ResponseDigest = {
  url: string;
  sha256: string;
};

type SourceDatasetRecord = {
  datasetUrl: string;
  family: VariableFamily;
  variable: VariableFamily;
  month: number;
  metadataSha256: string;
  responseSha256: ResponseDigest[];
};

type SourceMetadata = {
  family: VariableFamily;
  month: number;
  X: number;
  Y: number;
  timeCount: number;
  licenseUri: string;
  sourceInstitution: string;
  sourceVariableVersion: string;
  fileVersion: string;
  units: string;
  aggregation: string;
};

type SourceDasMetadata = Pick<
  SourceMetadata,
  | 'aggregation'
  | 'family'
  | 'fileVersion'
  | 'licenseUri'
  | 'sourceInstitution'
  | 'sourceVariableVersion'
  | 'units'
>;

type BuiltBundle = {
  packPath: string;
  manifestPath: string;
  packSha256: string;
  supportedProfileCount: number;
  unavailableProfileCount: number;
};

const PACK_NAME = 'climate-1991-2020-v1.json';
const MANIFEST_NAME = 'climate-1991-2020-v1.manifest.json';
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

export function canonicalJson(value: JsonValue): string {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'string'
  ) {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new SnartPipelineError(
        'FAIL_CANONICAL_NUMBER',
        'canonical JSON cannot contain a non-finite number',
      );
    }
    const normalized = Object.is(value, -0) ? 0 : value;
    const encoded = JSON.stringify(normalized);
    if (/[eE]/u.test(encoded)) {
      throw new SnartPipelineError(
        'FAIL_CANONICAL_NUMBER',
        'canonical JSON cannot contain exponent notation',
      );
    }
    return encoded;
  }
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

function writeAtomic(path: string, content: string | Uint8Array): void {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${process.pid}`;
  writeFileSync(temporary, content, { flag: 'w' });
  renameSync(temporary, path);
}

function normalizedName(name: string): string {
  return name.normalize('NFC').trim().replace(/\s+/gu, ' ');
}

function coordinateE4(value: number, scale: number, tolerance: number): number {
  if (!Number.isFinite(value)) {
    throw new SnartPipelineError(
      'FAIL_PLACE_COORDINATE',
      'non-finite coordinate',
    );
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
): {
  datasetUrl: string;
  family: VariableFamily;
  kind: EndpointKind;
  month: number;
  url: URL;
} {
  const parsed = new URL(input);
  if (parsed.protocol !== policy.scheme) {
    throw new SnartPipelineError(
      'FAIL_URL_SCHEME',
      'only frozen HTTPS is allowed',
    );
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
  if (!new RegExp(policy.pathPattern, 'u').test(parsed.pathname)) {
    throw new SnartPipelineError(
      'FAIL_URL_PATH',
      'path is outside the frozen monthly-normal allowlist',
    );
  }
  const match = parsed.pathname.match(
    /\/aggregated_products\/(tg|rr)\/seNorge2018_(tg|rr)_normal_1991_2020_monthly_(0[1-9]|1[0-2])\.nc\.(dds|das|ascii)$/u,
  );
  if (!match) {
    throw new SnartPipelineError(
      'FAIL_URL_PATH',
      'cannot identify family, month and endpoint',
    );
  }
  const folderFamily = match[1] as VariableFamily;
  const family = match[2] as VariableFamily;
  if (policy.requireFamilyVariableMatch && folderFamily !== family) {
    throw new SnartPipelineError(
      'FAIL_URL_FAMILY',
      'folder family differs from filename variable',
    );
  }
  const month = Number(match[3]);
  const kind = match[4] as EndpointKind;
  const datasetUrl = `${parsed.origin}${parsed.pathname.slice(
    0,
    -(`.${kind}`.length),
  )}`;
  if (!policy.allowedDatasetUrls.includes(datasetUrl)) {
    throw new SnartPipelineError(
      'FAIL_URL_ALLOWLIST',
      'dataset is not in the frozen 24-URL allowlist',
    );
  }
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
      const variable = selectionMatch[1];
      if (
        policy.requireFamilyVariableMatch &&
        (variable === 'tg' || variable === 'rr') &&
        variable !== family
      ) {
        throw new SnartPipelineError(
          'FAIL_URL_FAMILY',
          `query variable ${variable} differs from dataset family ${family}`,
        );
      }
      for (const slice of selectionMatch[2].matchAll(/\[([^\]]+)\]/gu)) {
        const values = slice[1].split(':').map(Number);
        if (
          values.length < 1 ||
          values.length > 3 ||
          values.some((value) => !Number.isSafeInteger(value) || value < 0) ||
          (values.length === 3 &&
            (values[1] <= 0 || values[0] > values[2])) ||
          (values.length === 2 && values[0] > values[1])
        ) {
          throw new SnartPipelineError(
            'FAIL_URL_QUERY',
            `invalid integer slice ${slice[0]}`,
          );
        }
      }
    }
  }
  return { datasetUrl, family, kind, month, url: parsed };
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
  const decodedQuery = decodeURIComponent(validated.url.search.slice(1));
  const maxBodyBytes =
    options.maxBodyBytes ??
    (validated.kind === 'ascii' &&
    (decodedQuery.startsWith('lat[0:') ||
      decodedQuery.includes(',lat[0:') ||
      decodedQuery.startsWith('lon[0:') ||
      decodedQuery.includes(',lon[0:'))
      ? policy.maxBodyBytes.coordinateGrid
      : policy.maxBodyBytes.metadataOrPoint);

  for (let attempt = 1; attempt <= policy.maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      policy.timeoutMilliseconds,
    );
    try {
      const response = await fetchImpl(validated.url.href, {
        headers: { 'User-Agent': policy.userAgent },
        redirect: policy.redirect,
        signal: controller.signal,
      });
      if (response.status >= 300 && response.status < 400) {
        const location =
          response.headers.get('location') ?? 'missing Location';
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
          clearTimeout(timeout);
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
    } catch (error) {
      if (error instanceof SnartPipelineError) throw error;
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
  }
  throw new SnartPipelineError(
    'FAIL_RETRY_EXHAUSTED',
    'retry loop exhausted unexpectedly',
  );
}

export function roundHalfAwayFromZero(value: number, scale: number): number {
  if (!Number.isFinite(value) || !Number.isInteger(scale) || scale < 0) {
    throw new SnartPipelineError(
      'FAIL_ROUNDING_INPUT',
      'invalid rounding input',
    );
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
    if (
      !selected ||
      distanceMillimetres < selected.distanceMillimetres ||
      (distanceMillimetres === selected.distanceMillimetres &&
        (cell.Y < selected.Y ||
          (cell.Y === selected.Y && cell.X < selected.X)))
    ) {
      selected = { ...cell, distanceMillimetres };
    }
  }
  if (!selected) {
    return { status: 'unavailable', reason: 'grid_invalid_or_sea' };
  }
  if (selected.distanceMillimetres > policy.maxDistanceMillimetres) {
    return {
      status: 'unavailable',
      reason: 'grid_too_far',
      selected,
    };
  }
  if (!selected.dataValid) {
    return {
      status: 'unavailable',
      reason: 'grid_invalid_or_sea',
      selected,
    };
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

export function deriveMonthlyProfile(
  rows: MonthlyProfileRow[],
  contract: SnartContract,
): MonthlyProfileRow[] {
  if (rows.length !== contract.derivationPolicy.monthCount) {
    throw new SnartPipelineError(
      'FAIL_MONTH_COVERAGE',
      `expected ${contract.derivationPolicy.monthCount} monthly rows`,
    );
  }
  const result = [...rows]
    .sort((left, right) => left.month - right.month)
    .map((row, index) => {
      if (
        Object.keys(row).sort().join(',') !==
        'meanTemperatureC,month,monthlyPrecipitationMm'
      ) {
        throw new SnartPipelineError(
          'FAIL_MONTH_SCHEMA',
          'monthly row has unexpected fields',
        );
      }
      const expectedMonth = index + 1;
      if (row.month !== expectedMonth) {
        throw new SnartPipelineError(
          'FAIL_MONTH_COVERAGE',
          `missing or duplicate month ${expectedMonth}`,
        );
      }
      if (
        !Number.isFinite(row.meanTemperatureC) ||
        !Number.isFinite(row.monthlyPrecipitationMm) ||
        row.meanTemperatureC === contract.source.fillValue ||
        row.monthlyPrecipitationMm === contract.source.fillValue ||
        row.monthlyPrecipitationMm < 0
      ) {
        throw new SnartPipelineError(
          'FAIL_MONTH_VALUE',
          `month ${row.month} contains an invalid or fill value`,
        );
      }
      return {
        month: row.month,
        meanTemperatureC: roundHalfAwayFromZero(
          row.meanTemperatureC,
          contract.derivationPolicy.rounding.temperature,
        ),
        monthlyPrecipitationMm: roundHalfAwayFromZero(
          row.monthlyPrecipitationMm,
          contract.derivationPolicy.rounding.precipitation,
        ),
      };
    });
  return result;
}

export function parseDds(
  body: string,
  family: VariableFamily,
): { family: VariableFamily; timeCount: number; Y: number; X: number } {
  const variable = body.match(
    new RegExp(
      `Float32\\s+${family}\\[time\\s*=\\s*(\\d+)\\]\\[Y\\s*=\\s*(\\d+)\\]\\[X\\s*=\\s*(\\d+)\\]`,
      'u',
    ),
  );
  if (!variable) {
    throw new SnartPipelineError(
      'FAIL_DDS_SCHEMA',
      `DDS is missing ${family}[time][Y][X]`,
    );
  }
  const timeCount = Number(variable[1]);
  const Y = Number(variable[2]);
  const X = Number(variable[3]);
  if (
    timeCount !== 1 ||
    !Number.isSafeInteger(Y) ||
    !Number.isSafeInteger(X) ||
    Y <= 0 ||
    X <= 0 ||
    !/Float32\s+lat\[Y\s*=\s*\d+\]\[X\s*=\s*\d+\]/u.test(body) ||
    !/Float32\s+lon\[Y\s*=\s*\d+\]\[X\s*=\s*\d+\]/u.test(body)
  ) {
    throw new SnartPipelineError(
      'FAIL_DDS_SCHEMA',
      'monthly DDS dimensions or coordinates are invalid',
    );
  }
  return { family, timeCount, Y, X };
}

function stringAttribute(body: string, name: string): string {
  const match = body.match(
    new RegExp(`String\\s+${name}\\s+"([^"]+)"\\s*;`, 'u'),
  );
  if (!match) {
    throw new SnartPipelineError(
      'FAIL_DAS_ATTRIBUTE',
      `missing DAS attribute ${name}`,
    );
  }
  return match[1];
}

export function parseDas(
  body: string,
  family: VariableFamily,
  contract: SnartContract,
): SourceDasMetadata {
  const blockMatch = body.match(
    new RegExp(`(?:^|\\n)\\s*${family}\\s*\\{([\\s\\S]*?)\\n\\s*\\}`, 'u'),
  );
  if (!blockMatch) {
    throw new SnartPipelineError(
      'FAIL_DAS_SCHEMA',
      `DAS is missing ${family} attributes`,
    );
  }
  const block = blockMatch[1];
  const units = stringAttribute(block, 'units');
  const aggregation = stringAttribute(block, 'cell_methods');
  const fileVersion = stringAttribute(block, 'version');
  const longName = stringAttribute(block, 'long_name');
  const fillMatch = block.match(/Float32\s+_FillValue\s+(-?\d+(?:\.\d+)?)\s*;/u);
  const sourceInstitution = stringAttribute(body, 'institution');
  const licenseUri = stringAttribute(body, 'license');
  const title = stringAttribute(body, 'title');
  const expectedVariableVersion = contract.source.variableVersions[family];
  if (
    units !== contract.source.units[family] ||
    aggregation !== contract.source.aggregations[family] ||
    fileVersion !== contract.source.fileVersions[family] ||
    !fillMatch ||
    Number(fillMatch[1]) !== contract.source.fillValue ||
    !longName.toLowerCase().includes('monthly') ||
    !longName.includes('1991-2020') ||
    sourceInstitution !== contract.source.metadataInstitution ||
    !contract.source.acceptedLicenseUris.includes(licenseUri) ||
    !title.includes(expectedVariableVersion)
  ) {
    throw new SnartPipelineError(
      'FAIL_DAS_PROVENANCE',
      `${family} DAS differs from the frozen monthly-normal contract`,
    );
  }
  return {
    family,
    licenseUri,
    sourceInstitution,
    sourceVariableVersion: expectedVariableVersion,
    fileVersion,
    units,
    aggregation,
  };
}

function numericToken(value: string, label: string): number {
  const result = Number(value);
  if (!Number.isFinite(result)) {
    throw new SnartPipelineError(
      'FAIL_ASCII_VALUE',
      `${label} is not finite`,
    );
  }
  return result;
}

export function parseMonthlyPointAscii(
  body: string,
  family: VariableFamily,
  month: number,
  contract: SnartContract,
): { family: VariableFamily; month: number; value: number; time: number } {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new SnartPipelineError('FAIL_MONTH', `invalid month ${month}`);
  }
  const valueMatch = body.match(
    new RegExp(
      `${family}\\.${family}\\[1\\]\\[1\\]\\[1\\][\\s\\S]*?\\[0\\]\\[0\\],\\s*(-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)`,
      'u',
    ),
  );
  const timeMatch = body.match(
    /(?:^|\n)time\[1\]\s*\n\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/u,
  );
  if (!valueMatch || !timeMatch) {
    throw new SnartPipelineError(
      'FAIL_ASCII_SCHEMA',
      `monthly ${family} point response is malformed`,
    );
  }
  const value = numericToken(valueMatch[1], `${family} value`);
  const time = numericToken(timeMatch[1], 'time value');
  if (value === contract.source.fillValue) {
    throw new SnartPipelineError(
      'FAIL_SOURCE_VALUE',
      `${family} month ${month} is the source fill value`,
    );
  }
  if (family === 'rr' && value < 0) {
    throw new SnartPipelineError(
      'FAIL_SOURCE_VALUE',
      `rr month ${month} is negative`,
    );
  }
  return { family, month, value, time };
}

function parseGridArray(
  body: string,
  variable: 'lat' | 'lon',
  expectedY: number,
  expectedX: number,
): Float64Array {
  const heading = new RegExp(
    `(?:^|\\n)${variable}\\.${variable}\\[(\\d+)\\]\\[(\\d+)\\]\\s*\\n`,
    'u',
  ).exec(body);
  if (
    !heading ||
    Number(heading[1]) !== expectedY ||
    Number(heading[2]) !== expectedX
  ) {
    throw new SnartPipelineError(
      'FAIL_GRID_SCHEMA',
      `${variable} dimensions do not match DDS`,
    );
  }
  const output = new Float64Array(expectedY * expectedX);
  const lines = body
    .slice((heading.index ?? 0) + heading[0].length)
    .replace(/\r\n/gu, '\n')
    .split('\n');
  let row = 0;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === '') {
      if (row > 0) break;
      continue;
    }
    const match = line.match(/^\[(\d+)\],\s*(.+)$/u);
    if (!match || Number(match[1]) !== row) {
      if (row === expectedY) break;
      throw new SnartPipelineError(
        'FAIL_GRID_SCHEMA',
        `${variable} row ${row} is malformed`,
      );
    }
    const values = match[2].split(',').map((value) => Number(value.trim()));
    if (
      values.length !== expectedX ||
      values.some((value) => !Number.isFinite(value))
    ) {
      throw new SnartPipelineError(
        'FAIL_GRID_SCHEMA',
        `${variable} row ${row} has invalid values`,
      );
    }
    output.set(values, row * expectedX);
    row += 1;
  }
  if (row !== expectedY) {
    throw new SnartPipelineError(
      'FAIL_GRID_SCHEMA',
      `${variable} contains ${row} of ${expectedY} rows`,
    );
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
    let selected:
      | (GridCell & {
          distanceMillimetres: number;
        })
      | undefined;
    const placeLat = place.latE4 / 10_000;
    const placeLon = place.lonE4 / 10_000;
    for (let Y = 0; Y < YCount; Y += 1) {
      const rowOffset = Y * XCount;
      for (let X = 0; X < XCount; X += 1) {
        const index = rowOffset + X;
        const lat = latitudes[index];
        const lon = longitudes[index];
        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lon) ||
          lat < -90 ||
          lat > 90 ||
          lon < -180 ||
          lon > 180
        ) {
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

function endpointQuery(
  datasetUrl: string,
  family: VariableFamily,
  Y: number,
  X: number,
): string {
  return `${datasetUrl}.ascii?${family}[0:1:0][${Y}:1:${Y}][${X}:1:${X}],time[0:1:0]`;
}

function gridQuery(datasetUrl: string, Y: number, X: number): string {
  return `${datasetUrl}.ascii?lat[0:1:${Y - 1}][0:1:${
    X - 1
  }],lon[0:1:${Y - 1}][0:1:${X - 1}]`;
}

function descriptor(datasetUrl: string): {
  family: VariableFamily;
  month: number;
} {
  const match = datasetUrl.match(
    /\/(tg|rr)\/seNorge2018_(tg|rr)_normal_1991_2020_monthly_(0[1-9]|1[0-2])\.nc$/u,
  );
  if (!match || match[1] !== match[2]) {
    throw new SnartPipelineError(
      'FAIL_DATASET_URL',
      `invalid monthly dataset URL ${datasetUrl}`,
    );
  }
  return { family: match[1] as VariableFamily, month: Number(match[3]) };
}

function cachePaths(cacheDir: string, url: string): {
  body: string;
  metadata: string;
} {
  const key = sha256(url);
  return {
    body: join(cacheDir, `${key}.body`),
    metadata: join(cacheDir, `${key}.json`),
  };
}

async function readOrFetchCached(
  url: string,
  contract: SnartContract,
  cacheDir: string,
  offline: boolean,
  maxBodyBytes?: number,
): Promise<{ text: string; sha256: string }> {
  const validated = validateMetUrl(url, contract.httpPolicy);
  const canonicalUrl = validated.url.href;
  const paths = cachePaths(cacheDir, canonicalUrl);
  if (existsSync(paths.body) && existsSync(paths.metadata)) {
    const metadata = readJson<{
      schemaVersion: string;
      url: string;
      sha256: string;
      bytes: number;
    }>(paths.metadata);
    const bytes = readFileSync(paths.body);
    if (
      metadata.schemaVersion !== 'babyora-snart-source-cache@1' ||
      metadata.url !== canonicalUrl ||
      metadata.sha256 !== sha256(bytes) ||
      metadata.bytes !== bytes.byteLength
    ) {
      throw new SnartPipelineError(
        'FAIL_CACHE_INTEGRITY',
        `cached response is invalid for ${canonicalUrl}`,
      );
    }
    return {
      text: new TextDecoder('utf-8', { fatal: true }).decode(bytes),
      sha256: metadata.sha256,
    };
  }
  if (offline) {
    throw new SnartPipelineError(
      'FAIL_CACHE_MISS',
      `offline cache is missing ${canonicalUrl}`,
    );
  }
  const fetched = await fetchTextWithPolicy(canonicalUrl, contract.httpPolicy, {
    maxBodyBytes,
  });
  const bytes = new TextEncoder().encode(fetched.text);
  mkdirSync(cacheDir, { recursive: true });
  writeAtomic(paths.body, bytes);
  writeAtomic(
    paths.metadata,
    canonicalJsonFile({
      bytes: bytes.byteLength,
      schemaVersion: 'babyora-snart-source-cache@1',
      sha256: fetched.sha256,
      url: canonicalUrl,
    }),
  );
  return { text: fetched.text, sha256: fetched.sha256 };
}

function addResponseDigest(
  dataset: SourceDatasetRecord,
  digest: ResponseDigest,
): void {
  if (!dataset.responseSha256.some((entry) => entry.url === digest.url)) {
    dataset.responseSha256.push(digest);
  }
}

function builderSha256(): string {
  return sha256(readFileSync(THIS_FILE));
}

function gitHead(): string {
  return execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
}

function makePack(
  contract: SnartContract,
  profiles: Record<string, JsonValue>,
): JsonRecord {
  return {
    contractVersion: contract.contractVersion,
    derivationVersion: contract.derivationPolicy.version,
    normalPeriod: contract.source.normalPeriod as unknown as JsonValue,
    profiles,
    rulesetVersion: 'babyora-snart-heuristics@2',
    schemaVersion: 'babyora-monthly-normal-pack@2',
  };
}

function makeManifest(input: {
  bindings: JsonValue[];
  contract: SnartContract;
  contractSha256: string;
  createdFromGitSha: string;
  fixtureMode: boolean;
  fixtureSourceExcerptsSha256?: string;
  licenseUri: string;
  packSha256: string;
  sourceDatasets: SourceDatasetRecord[];
  supportedProfileCount: number;
  unavailableProfileCount: number;
}): JsonRecord {
  const sourceDatasets = input.sourceDatasets.map((dataset) => ({
    ...dataset,
    responseSha256: [...dataset.responseSha256].sort((left, right) =>
      compareUtf8(left.url, right.url),
    ),
  }));
  const metadataProjection = sourceDatasets.map((dataset) => ({
    datasetUrl: dataset.datasetUrl,
    metadataSha256: dataset.metadataSha256,
  }));
  return {
    builderSha256: builderSha256(),
    canonicalPlaceCount:
      input.supportedProfileCount + input.unavailableProfileCount,
    canonicalPlacesSha256:
      input.contract.homePlacePolicy.canonicalProjectionSha256,
    contractSha256: input.contractSha256,
    createdFromGitSha: input.createdFromGitSha,
    derivationVersion: input.contract.derivationPolicy.version,
    fixtureMode: input.fixtureMode,
    ...(input.fixtureSourceExcerptsSha256
      ? {
          fixtureSourceExcerptsSha256:
            input.fixtureSourceExcerptsSha256,
        }
      : {}),
    gridPolicyVersion: input.contract.gridPolicy.version,
    homePlaceKeyVersion: input.contract.homePlacePolicy.version,
    httpPolicyVersion: input.contract.httpPolicy.version,
    monthCount: input.contract.derivationPolicy.monthCount,
    normalPeriod: input.contract.source.normalPeriod as unknown as JsonValue,
    packSha256: input.packSha256,
    placeGridBindings: input.bindings,
    productionEligible: !input.fixtureMode,
    roundingPolicy:
      input.contract.derivationPolicy.rounding as unknown as JsonValue,
    rulesetVersion: 'babyora-snart-heuristics@2',
    schemaVersion: 'babyora-monthly-normal-manifest@2',
    sourceAggregations:
      input.contract.source.aggregations as unknown as JsonValue,
    sourceCatalogUrls:
      input.contract.source.catalogUrls as unknown as JsonValue,
    sourceDatasetName: input.contract.source.datasetName,
    sourceDatasets: sourceDatasets as unknown as JsonValue,
    sourceDisclaimer: input.contract.source
      .derivedDataDisclaimer as JsonValue,
    sourceFileVersions:
      input.contract.source.fileVersions as unknown as JsonValue,
    sourceInstitution: input.contract.source.metadataInstitution,
    sourceLicenseUri: input.licenseUri,
    sourceMetadataSha256: sha256(
      canonicalJsonFile(metadataProjection as unknown as JsonValue),
    ),
    sourceUnits: input.contract.source.units as unknown as JsonValue,
    sourceVariableVersions:
      input.contract.source.variableVersions as unknown as JsonValue,
    supportedProfileCount: input.supportedProfileCount,
    targetWindowDerivationVersion:
      input.contract.derivationPolicy.targetWindowDerivationVersion,
    unavailableProfileCount: input.unavailableProfileCount,
  };
}

function writeBundle(
  outputDir: string,
  pack: JsonRecord,
  manifestWithoutPackHash: JsonRecord,
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
      kind: EndpointKind;
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
  const excerptProjection = fixtures.officialExcerpts.map((excerpt) => ({
    sha256: excerpt.sha256,
    sourceUrl: excerpt.sourceUrl,
  }));
  const fixtureSourceExcerptsSha256 = sha256(
    canonicalJsonFile(excerptProjection as unknown as JsonValue),
  );
  const projection = buildHomePlaceProjection(options.contractPath);
  const supportedNames = new Set(
    fixtures.fixtureBuild.supportedHomePlaceNames.map((name) =>
      normalizedName(name),
    ),
  );
  const profiles: Record<string, JsonValue> = {};
  const bindings: JsonValue[] = [];
  for (const place of projection) {
    if (supportedNames.has(place.nameNfc)) {
      const months = deriveMonthlyProfile(
        Array.from({ length: 12 }, (_, index) => ({
          month: index + 1,
          meanTemperatureC: index - 6,
          monthlyPrecipitationMm: (index + 1) * 10,
        })),
        contract,
      );
      const profileId = `snart-profile:v2:${place.homePlaceKey}`;
      profiles[place.homePlaceKey] = {
        grid: {
          X: 0,
          Y: 0,
          distanceMillimetres: 0,
          lat: place.latE4 / 10_000,
          lon: place.lonE4 / 10_000,
        },
        homePlaceKey: place.homePlaceKey,
        months: months as unknown as JsonValue,
        profileId,
      };
      bindings.push({
        ...place,
        X: 0,
        Y: 0,
        distanceMillimetres: 0,
        gridLat: place.latE4 / 10_000,
        gridLon: place.lonE4 / 10_000,
        profileId,
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
  const sourceDatasets = contract.source.datasetUrls.map((datasetUrl) => {
    const { family, month } = descriptor(datasetUrl);
    const familyExcerpts = fixtures.officialExcerpts.filter((entry) =>
      entry.sourceUrl.includes(`/aggregated_products/${family}/`),
    );
    const metadataSha256 = sha256(
      canonicalJsonFile({
        datasetUrl,
        officialExcerptSha256: familyExcerpts
          .filter((entry) => entry.kind === 'dds' || entry.kind === 'das')
          .map((entry) => entry.sha256),
      }),
    );
    const url = endpointQuery(datasetUrl, family, 0, 0);
    return {
      datasetUrl,
      family,
      variable: family,
      month,
      metadataSha256,
      responseSha256: [
        {
          url,
          sha256: sha256(
            canonicalJsonFile({
              family,
              fixtureMode: true,
              month,
            }),
          ),
        },
      ],
    };
  });
  const pack = makePack(contract, profiles);
  const packSha = sha256(canonicalJsonFile(pack));
  const manifest = makeManifest({
    bindings,
    contract,
    contractSha256: contractSha,
    createdFromGitSha: options.createdFromGitSha ?? 'fixture-candidate',
    fixtureMode: true,
    fixtureSourceExcerptsSha256,
    licenseUri: contract.source.acceptedLicenseUris[0],
    packSha256: packSha,
    sourceDatasets,
    supportedProfileCount: Object.keys(profiles).length,
    unavailableProfileCount: projection.length - Object.keys(profiles).length,
  });
  return writeBundle(options.outputDir, pack, manifest);
}

async function preflightSource(
  contract: SnartContract,
  cacheDir: string,
  offline: boolean,
  onProgress: (message: string) => void,
): Promise<{
  metadata: SourceMetadata[];
  sourceDatasets: SourceDatasetRecord[];
}> {
  const metadata: SourceMetadata[] = [];
  const sourceDatasets: SourceDatasetRecord[] = [];
  for (let index = 0; index < contract.source.datasetUrls.length; index += 1) {
    const datasetUrl = contract.source.datasetUrls[index];
    const { family, month } = descriptor(datasetUrl);
    onProgress(
      `preflight ${index + 1}/${contract.source.datasetUrls.length} ${family}-${String(
        month,
      ).padStart(2, '0')}`,
    );
    const ddsUrl = `${datasetUrl}.dds`;
    const dasUrl = `${datasetUrl}.das`;
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
    const dimensions = parseDds(dds.text, family);
    const attributes = parseDas(das.text, family, contract);
    metadata.push({
      ...attributes,
      ...dimensions,
      family,
      month,
    });
    sourceDatasets.push({
      datasetUrl,
      family,
      variable: family,
      month,
      metadataSha256: sha256(
        canonicalJsonFile({
          das: { sha256: das.sha256, url: new URL(dasUrl).href },
          dds: { sha256: dds.sha256, url: new URL(ddsUrl).href },
        }),
      ),
      responseSha256: [],
    });
  }
  const first = metadata[0];
  for (const entry of metadata) {
    if (
      entry.Y !== first.Y ||
      entry.X !== first.X ||
      entry.timeCount !== 1 ||
      entry.licenseUri !== first.licenseUri ||
      entry.sourceInstitution !== first.sourceInstitution
    ) {
      throw new SnartPipelineError(
        'FAIL_SOURCE_DRIFT',
        `source schema/provenance drift in ${entry.family}-${entry.month}`,
      );
    }
  }
  return { metadata, sourceDatasets };
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
  const { metadata, sourceDatasets } = await preflightSource(
    contract,
    options.cacheDir,
    offline,
    onProgress,
  );
  const reference = metadata[0];
  const coordinateUrl = gridQuery(
    sourceDatasets[0].datasetUrl,
    reference.Y,
    reference.X,
  );
  onProgress('resolve source coordinate grid');
  const coordinateResponse = await readOrFetchCached(
    coordinateUrl,
    contract,
    options.cacheDir,
    offline,
    contract.httpPolicy.maxBodyBytes.coordinateGrid,
  );
  addResponseDigest(sourceDatasets[0], {
    url: new URL(coordinateUrl).href,
    sha256: coordinateResponse.sha256,
  });
  const latitudes = parseGridArray(
    coordinateResponse.text,
    'lat',
    reference.Y,
    reference.X,
  );
  const longitudes = parseGridArray(
    coordinateResponse.text,
    'lon',
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

  for (let placeIndex = 0; placeIndex < projection.length; placeIndex += 1) {
    const place = projection[placeIndex];
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
      `fetch place ${placeIndex + 1}/${projection.length} ${place.nameNfc}`,
    );
    const temperatures = new Map<number, number>();
    const precipitation = new Map<number, number>();
    let invalidReason: string | undefined;
    for (const dataset of sourceDatasets) {
      const url = endpointQuery(
        dataset.datasetUrl,
        dataset.family,
        selection.Y,
        selection.X,
      );
      try {
        const point = await readOrFetchCached(
          url,
          contract,
          options.cacheDir,
          offline,
          contract.httpPolicy.maxBodyBytes.metadataOrPoint,
        );
        addResponseDigest(dataset, {
          url: new URL(url).href,
          sha256: point.sha256,
        });
        const parsed = parseMonthlyPointAscii(
          point.text,
          dataset.family,
          dataset.month,
          contract,
        );
        if (dataset.family === 'tg') {
          temperatures.set(dataset.month, parsed.value);
        } else {
          precipitation.set(dataset.month, parsed.value);
        }
      } catch (error) {
        if (
          error instanceof SnartPipelineError &&
          (error.code === 'FAIL_SOURCE_VALUE' ||
            error.code === 'FAIL_ASCII_VALUE')
        ) {
          invalidReason = 'grid_invalid_or_sea';
          break;
        }
        throw error;
      }
    }
    if (invalidReason) {
      bindings.push({
        ...place,
        reason: invalidReason,
        status: 'unavailable',
      } as unknown as JsonValue);
      continue;
    }
    const months = deriveMonthlyProfile(
      Array.from({ length: 12 }, (_, index) => {
        const month = index + 1;
        return {
          month,
          meanTemperatureC: temperatures.get(month) ?? Number.NaN,
          monthlyPrecipitationMm:
            precipitation.get(month) ?? Number.NaN,
        };
      }),
      contract,
    );
    const profileId = `snart-profile:v2:${place.homePlaceKey}`;
    profiles[place.homePlaceKey] = {
      grid: {
        X: selection.X,
        Y: selection.Y,
        distanceMillimetres: selection.distanceMillimetres,
        lat: selection.gridLat,
        lon: selection.gridLon,
      },
      homePlaceKey: place.homePlaceKey,
      months: months as unknown as JsonValue,
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
  }
  const pack = makePack(contract, profiles);
  const packSha = sha256(canonicalJsonFile(pack));
  const manifest = makeManifest({
    bindings,
    contract,
    contractSha256: contractSha,
    createdFromGitSha: options.createdFromGitSha ?? gitHead(),
    fixtureMode: false,
    licenseUri: metadata[0].licenseUri,
    packSha256: packSha,
    sourceDatasets,
    supportedProfileCount: Object.keys(profiles).length,
    unavailableProfileCount: projection.length - Object.keys(profiles).length,
  });
  return writeBundle(options.outputDir, pack, manifest);
}

export async function buildClimatePack(
  options: BuildOptions,
): Promise<BuiltBundle> {
  const contractBytes = readFileSync(options.contractPath);
  const contract = JSON.parse(
    contractBytes.toString('utf8'),
  ) as SnartContract;
  if (
    contract.schemaVersion !== 'babyora-snart-autonomy-contract@2' ||
    contract.contractVersion !== 'snart-monthly-normal-contract@2' ||
    contract.httpPolicy.maxConcurrentRequests !== 1 ||
    contract.source.datasetUrls.length !== 24 ||
    contract.derivationPolicy.monthCount !== 12 ||
    contract.capabilities.soon_preparation ||
    contract.capabilities.family_sharing ||
    contract.capabilities.personal_calibration
  ) {
    throw new SnartPipelineError(
      'FAIL_CONTRACT',
      'unexpected monthly-normal contract or capability state',
    );
  }
  for (const datasetUrl of contract.source.datasetUrls) {
    const { family } = descriptor(datasetUrl);
    validateMetUrl(`${datasetUrl}.dds`, contract.httpPolicy);
    if (!['tg', 'rr'].includes(family)) {
      throw new SnartPipelineError(
        'FAIL_CONTRACT',
        'unknown dataset family',
      );
    }
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
    canonicalJsonFile({
      manifestPath: result.manifestPath,
      packPath: result.packPath,
      packSha256: result.packSha256,
      supportedProfileCount: result.supportedProfileCount,
      unavailableProfileCount: result.unavailableProfileCount,
    }),
  );
}

const invokedPath = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : '';
if (invokedPath === import.meta.url) {
  main().catch((error: unknown) => {
    const message =
      error instanceof Error ? error.stack ?? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
