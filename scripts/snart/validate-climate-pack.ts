import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  buildClimatePack,
  buildHomePlaceProjection,
  canonicalJsonFile,
  profileKeys,
  roundHalfAwayFromZero,
  sha256,
  SnartPipelineError,
  validateMetUrl,
  type JsonValue,
} from './build-climate-pack';

type JsonRecord = { [key: string]: JsonValue };

type ValidateOptions = {
  contractPath: string;
  dataDir: string;
  fixtureMode?: boolean;
};

export type ValidationReport = {
  valid: true;
  canonicalPlaceCount: number;
  supportedProfileCount: number;
  unavailableProfileCount: number;
  packSha256: string;
  manifestSha256: string;
  fixtureMode: boolean;
};

const PACK_NAME = 'climate-1991-2020-v1.json';
const MANIFEST_NAME = 'climate-1991-2020-v1.manifest.json';
const BUILDER_PATH = 'scripts/snart/build-climate-pack.ts';
const CREDENTIAL_PATTERN =
  /(?:FROST_CLIENT_ID|(?:API|ACCESS)[_-]?KEY|AUTHORIZATION\s*[:=]|BEARER\s+[A-Za-z0-9._~-]+|CLIENT[_-]?SECRET|PRIVATE[_-]?KEY)/iu;

function readJsonRecord(path: string, label: string): {
  parsed: JsonRecord;
  raw: string;
} {
  const raw = readFileSync(path, 'utf8');
  if (CREDENTIAL_PATTERN.test(raw)) {
    throw new SnartPipelineError(
      'FAIL_CREDENTIAL_TEXT',
      `${label} contains credential-shaped text`,
    );
  }
  let parsed: JsonRecord;
  try {
    parsed = JSON.parse(raw) as JsonRecord;
  } catch (error) {
    throw new SnartPipelineError(
      'FAIL_JSON_SCHEMA',
      `${label} is not JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  if (canonicalJsonFile(parsed) !== raw) {
    throw new SnartPipelineError(
      'FAIL_CANONICAL_JSON',
      `${label} is not canonical UTF-8/LF JSON`,
    );
  }
  return { parsed, raw };
}

function record(value: JsonValue | undefined, label: string): JsonRecord {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    throw new SnartPipelineError('FAIL_SCHEMA', `${label} must be an object`);
  }
  return value;
}

function array(value: JsonValue | undefined, label: string): JsonValue[] {
  if (!Array.isArray(value)) {
    throw new SnartPipelineError('FAIL_SCHEMA', `${label} must be an array`);
  }
  return value;
}

function string(value: JsonValue | undefined, label: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new SnartPipelineError(
      'FAIL_SCHEMA',
      `${label} must be a non-empty string`,
    );
  }
  return value;
}

function number(value: JsonValue | undefined, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new SnartPipelineError(
      'FAIL_SCHEMA',
      `${label} must be a finite number`,
    );
  }
  return value;
}

function integer(value: JsonValue | undefined, label: string): number {
  const result = number(value, label);
  if (!Number.isSafeInteger(result)) {
    throw new SnartPipelineError(
      'FAIL_SCHEMA',
      `${label} must be a safe integer`,
    );
  }
  return result;
}

function sha(value: JsonValue | undefined, label: string): string {
  const result = string(value, label);
  if (!/^[a-f0-9]{64}$/u.test(result)) {
    throw new SnartPipelineError(
      'FAIL_SCHEMA',
      `${label} must be lower-case SHA-256`,
    );
  }
  return result;
}

function sameJson(left: JsonValue, right: JsonValue): boolean {
  return canonicalJsonFile(left) === canonicalJsonFile(right);
}

function validateDay(
  day: JsonRecord,
  label: string,
  minimumValidSamples: number,
  minimumRepresentedYears: number,
): void {
  const p10 = number(day.p10MinC, `${label}.p10MinC`);
  const p50 = number(day.p50MeanC, `${label}.p50MeanC`);
  const p90 = number(day.p90MaxC, `${label}.p90MaxC`);
  const wet = number(day.wetProbability, `${label}.wetProbability`);
  if (p10 > p50 || p50 > p90 || wet < 0 || wet > 1) {
    throw new SnartPipelineError(
      'FAIL_DAY_VALUES',
      `${label} has inconsistent climate values`,
    );
  }
  if (
    roundHalfAwayFromZero(p10, 1) !== p10 ||
    roundHalfAwayFromZero(p50, 1) !== p50 ||
    roundHalfAwayFromZero(p90, 1) !== p90 ||
    roundHalfAwayFromZero(wet, 4) !== wet
  ) {
    throw new SnartPipelineError(
      'FAIL_ROUNDING',
      `${label} violates the frozen scales`,
    );
  }
  const coverage = record(day.coverage, `${label}.coverage`);
  const variables = Object.keys(coverage).sort();
  if (!sameJson(variables, ['rr', 'tg', 'tn', 'tx'])) {
    throw new SnartPipelineError(
      'FAIL_COVERAGE_SCHEMA',
      `${label} has unexpected coverage variables`,
    );
  }
  for (const variable of variables) {
    const stats = record(coverage[variable], `${label}.${variable}`);
    const validCount = integer(stats.validCount, `${label}.${variable}.valid`);
    const representedYears = integer(
      stats.representedYears,
      `${label}.${variable}.years`,
    );
    const missingCount = integer(
      stats.missingCount,
      `${label}.${variable}.missing`,
    );
    const discardedCount = integer(
      stats.discardedCount,
      `${label}.${variable}.discarded`,
    );
    const minimum = number(stats.min, `${label}.${variable}.min`);
    const maximum = number(stats.max, `${label}.${variable}.max`);
    if (
      validCount < minimumValidSamples ||
      representedYears < minimumRepresentedYears ||
      missingCount < 0 ||
      discardedCount < 0 ||
      minimum > maximum
    ) {
      throw new SnartPipelineError(
        'FAIL_COVERAGE',
        `${label}.${variable} violates the coverage gate`,
      );
    }
  }
}

function validateProfile(
  profile: JsonRecord,
  homePlaceKey: string,
  binding: JsonRecord,
  minimumValidSamples: number,
  minimumRepresentedYears: number,
): void {
  if (
    profile.homePlaceKey !== homePlaceKey ||
    profile.profileId !== binding.profileId
  ) {
    throw new SnartPipelineError(
      'FAIL_PROFILE_IDENTITY',
      `profile ${homePlaceKey} does not match its binding`,
    );
  }
  const grid = record(profile.grid, `${homePlaceKey}.grid`);
  for (const field of ['X', 'Y', 'distanceMillimetres'] as const) {
    if (integer(grid[field], `${homePlaceKey}.grid.${field}`) !== binding[field]) {
      throw new SnartPipelineError(
        'FAIL_GRID_BINDING',
        `${homePlaceKey} ${field} differs from manifest`,
      );
    }
  }
  for (const field of ['lat', 'lon'] as const) {
    const expectedField = field === 'lat' ? 'gridLat' : 'gridLon';
    if (
      number(grid[field], `${homePlaceKey}.grid.${field}`) !==
      binding[expectedField]
    ) {
      throw new SnartPipelineError(
        'FAIL_GRID_BINDING',
        `${homePlaceKey} ${field} differs from manifest`,
      );
    }
  }
  const days = record(profile.days, `${homePlaceKey}.days`);
  const expectedKeys = profileKeys();
  const actualKeys = Object.keys(days).sort();
  if (!sameJson(actualKeys, [...expectedKeys].sort())) {
    throw new SnartPipelineError(
      'FAIL_PROFILE_DAYS',
      `${homePlaceKey} does not contain exactly 365 profile keys`,
    );
  }
  for (const key of expectedKeys) {
    validateDay(
      record(days[key], `${homePlaceKey}.${key}`),
      `${homePlaceKey}.${key}`,
      minimumValidSamples,
      minimumRepresentedYears,
    );
  }
}

export function validateClimateBundle(
  options: ValidateOptions,
): ValidationReport {
  const contractRaw = readFileSync(options.contractPath);
  const contract = JSON.parse(contractRaw.toString('utf8')) as JsonRecord;
  const packResult = readJsonRecord(join(options.dataDir, PACK_NAME), 'pack');
  const manifestResult = readJsonRecord(
    join(options.dataDir, MANIFEST_NAME),
    'manifest',
  );
  const pack = packResult.parsed;
  const manifest = manifestResult.parsed;
  const packSha = sha256(packResult.raw);
  const manifestSha = sha256(manifestResult.raw);

  if (
    pack.schemaVersion !== 'babyora-snart-climate-pack@1' ||
    manifest.schemaVersion !== 'babyora-snart-climate-manifest@1'
  ) {
    throw new SnartPipelineError(
      'FAIL_SCHEMA_VERSION',
      'unexpected pack or manifest schema',
    );
  }
  if (sha(manifest.packSha256, 'manifest.packSha256') !== packSha) {
    throw new SnartPipelineError(
      'FAIL_PACK_HASH',
      'manifest does not bind the exact pack bytes',
    );
  }
  if (
    sha(manifest.contractSha256, 'manifest.contractSha256') !==
    sha256(contractRaw)
  ) {
    throw new SnartPipelineError(
      'FAIL_CONTRACT_HASH',
      'manifest contract hash differs from current contract',
    );
  }
  if (
    sha(manifest.builderSha256, 'manifest.builderSha256') !==
    sha256(readFileSync(BUILDER_PATH))
  ) {
    throw new SnartPipelineError(
      'FAIL_BUILDER_HASH',
      'manifest builder hash differs from current builder',
    );
  }

  const source = record(contract.source, 'contract.source');
  const homePolicy = record(
    contract.homePlacePolicy,
    'contract.homePlacePolicy',
  );
  const gridPolicy = record(contract.gridPolicy, 'contract.gridPolicy');
  const timePolicy = record(contract.timePolicy, 'contract.timePolicy');
  const derivationPolicy = record(
    contract.derivationPolicy,
    'contract.derivationPolicy',
  );
  const httpPolicy = record(contract.httpPolicy, 'contract.httpPolicy');
  const projection = buildHomePlaceProjection(options.contractPath);

  if (
    manifest.canonicalPlacesSha256 !==
      homePolicy.canonicalProjectionSha256 ||
    manifest.canonicalPlaceCount !== projection.length ||
    manifest.homePlaceKeyVersion !== homePolicy.version ||
    manifest.gridPolicyVersion !== gridPolicy.version ||
    manifest.timeMappingVersion !== timePolicy.version ||
    manifest.httpPolicyVersion !== httpPolicy.version ||
    manifest.derivationVersion !== derivationPolicy.version ||
    pack.derivationVersion !== derivationPolicy.version ||
    !sameJson(
      manifest.sourceVariableVersions as JsonValue,
      source.variableVersions as JsonValue,
    ) ||
    manifest.sourceDatasetName !== source.datasetName ||
    manifest.sourceInstitution !== source.sourceOrganization ||
    !array(
      source.acceptedLicenseUris,
      'contract.source.acceptedLicenseUris',
    ).includes(manifest.sourceLicenseUri)
  ) {
    throw new SnartPipelineError(
      'FAIL_PROVENANCE',
      'manifest provenance differs from the frozen contract',
    );
  }
  if (Object.hasOwn(manifest, 'generatedAt')) {
    throw new SnartPipelineError(
      'FAIL_NONDETERMINISTIC_FIELD',
      'generatedAt cannot carry bundle identity',
    );
  }
  const actualFixtureMode = manifest.fixtureMode === true;
  if (
    actualFixtureMode !== Boolean(options.fixtureMode) ||
    manifest.productionEligible !== !actualFixtureMode
  ) {
    throw new SnartPipelineError(
      'FAIL_FIXTURE_BOUNDARY',
      'fixture/production eligibility mismatch',
    );
  }

  const responses = array(
    manifest.sourceResponseSha256,
    'manifest.sourceResponseSha256',
  );
  const responseUrls = new Set<string>();
  for (const value of responses) {
    const response = record(value, 'source response digest');
    const url = string(response.url, 'source response URL');
    validateMetUrl(url, httpPolicy as unknown as Parameters<
      typeof validateMetUrl
    >[1]);
    sha(response.sha256, 'source response SHA');
    if (responseUrls.has(url)) {
      throw new SnartPipelineError(
        'FAIL_SOURCE_RESPONSE_DUPLICATE',
        `duplicate response URL ${url}`,
      );
    }
    responseUrls.add(url);
  }
  sha(manifest.sourceMetadataSha256, 'manifest.sourceMetadataSha256');
  if (
    actualFixtureMode &&
    manifest.sourceMetadataSha256 !==
      sha256(canonicalJsonFile(responses))
  ) {
    throw new SnartPipelineError(
      'FAIL_FIXTURE_METADATA_HASH',
      'fixture metadata hash does not bind its official excerpts',
    );
  }

  const bindings = array(
    manifest.placeGridBindings,
    'manifest.placeGridBindings',
  ).map((value) => record(value, 'place binding'));
  if (bindings.length !== projection.length) {
    throw new SnartPipelineError(
      'FAIL_PLACE_COVERAGE',
      'manifest does not classify every canonical place',
    );
  }
  const projectionByKey = new Map(
    projection.map((place) => [place.homePlaceKey, place]),
  );
  const bindingByKey = new Map<string, JsonRecord>();
  for (const binding of bindings) {
    const key = string(binding.homePlaceKey, 'binding.homePlaceKey');
    const place = projectionByKey.get(key);
    if (!place || bindingByKey.has(key)) {
      throw new SnartPipelineError(
        'FAIL_PLACE_COVERAGE',
        `unknown or duplicate place ${key}`,
      );
    }
    if (
      binding.nameNfc !== place.nameNfc ||
      binding.latE4 !== place.latE4 ||
      binding.lonE4 !== place.lonE4
    ) {
      throw new SnartPipelineError(
        'FAIL_PLACE_IDENTITY',
        `binding ${key} differs from NO_CITIES`,
      );
    }
    if (binding.status === 'supported') {
      string(binding.profileId, `${key}.profileId`);
      integer(binding.X, `${key}.X`);
      integer(binding.Y, `${key}.Y`);
      integer(binding.distanceMillimetres, `${key}.distance`);
      number(binding.gridLat, `${key}.gridLat`);
      number(binding.gridLon, `${key}.gridLon`);
    } else if (binding.status === 'unavailable') {
      string(binding.reason, `${key}.reason`);
    } else {
      throw new SnartPipelineError(
        'FAIL_PLACE_STATUS',
        `${key} has an unknown status`,
      );
    }
    bindingByKey.set(key, binding);
  }

  const profiles = record(pack.profiles, 'pack.profiles');
  const supportedBindings = bindings.filter(
    (binding) => binding.status === 'supported',
  );
  const unavailableBindings = bindings.filter(
    (binding) => binding.status === 'unavailable',
  );
  if (
    integer(manifest.supportedProfileCount, 'supportedProfileCount') !==
      supportedBindings.length ||
    integer(manifest.unavailableProfileCount, 'unavailableProfileCount') !==
      unavailableBindings.length ||
    Object.keys(profiles).length !== supportedBindings.length
  ) {
    throw new SnartPipelineError(
      'FAIL_PLACE_COUNTS',
      'supported/unavailable/profile counts disagree',
    );
  }
  for (const key of Object.keys(profiles)) {
    const binding = bindingByKey.get(key);
    if (!binding || binding.status !== 'supported') {
      throw new SnartPipelineError(
        'FAIL_PROFILE_WITHOUT_BINDING',
        `profile ${key} is not supported by manifest`,
      );
    }
    validateProfile(
      record(profiles[key], `profile ${key}`),
      key,
      binding,
      integer(
        record(manifest.coveragePolicy, 'coveragePolicy').minimumValidSamples,
        'minimumValidSamples',
      ),
      integer(
        record(manifest.coveragePolicy, 'coveragePolicy')
          .minimumRepresentedYears,
        'minimumRepresentedYears',
      ),
    );
  }

  return {
    valid: true,
    canonicalPlaceCount: projection.length,
    supportedProfileCount: supportedBindings.length,
    unavailableProfileCount: unavailableBindings.length,
    packSha256: packSha,
    manifestSha256: manifestSha,
    fixtureMode: actualFixtureMode,
  };
}

function argumentValue(arguments_: string[], name: string): string | undefined {
  const index = arguments_.indexOf(name);
  return index >= 0 ? arguments_[index + 1] : undefined;
}

function temporaryDirectory(prefix: string): string {
  const root = resolve('tmp');
  mkdirSync(root, { recursive: true });
  return mkdtempSync(join(root, prefix));
}

async function validateFixture(contractPath: string): Promise<ValidationReport> {
  const directory = temporaryDirectory('snart-fixture-validation-');
  try {
    await buildClimatePack({
      contractPath,
      fixturePath: 'scripts/snart/fixtures/met-boundaries-v1.json',
      mode: 'fixture',
      outputDir: directory,
      createdFromGitSha: 'fixture-candidate',
    });
    return validateClimateBundle({
      contractPath,
      dataDir: directory,
      fixtureMode: true,
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

async function validateReproducibility(
  contractPath: string,
  cacheDir: string,
  expectedDir: string,
): Promise<JsonRecord> {
  const expectedManifest = JSON.parse(
    readFileSync(join(expectedDir, MANIFEST_NAME), 'utf8'),
  ) as JsonRecord;
  if (expectedManifest.fixtureMode === true) {
    throw new SnartPipelineError(
      'FAIL_REPRO_FIXTURE',
      'production reproducibility cannot use a fixture manifest',
    );
  }
  const first = temporaryDirectory('snart-repro-a-');
  const second = temporaryDirectory('snart-repro-b-');
  try {
    for (const outputDir of [first, second]) {
      await buildClimatePack({
        contractPath,
        mode: 'cache',
        cacheDir,
        outputDir,
        createdFromGitSha: string(
          expectedManifest.createdFromGitSha,
          'createdFromGitSha',
        ),
      });
      validateClimateBundle({ contractPath, dataDir: outputDir });
    }
    const hashes: JsonRecord = {};
    for (const name of [PACK_NAME, MANIFEST_NAME]) {
      const firstBytes = readFileSync(join(first, name));
      const secondBytes = readFileSync(join(second, name));
      const expectedBytes = readFileSync(join(expectedDir, name));
      if (
        !firstBytes.equals(secondBytes) ||
        !firstBytes.equals(expectedBytes)
      ) {
        throw new SnartPipelineError(
          'FAIL_REPRODUCIBILITY',
          `${name} differs across clean cache builds or expected output`,
        );
      }
      hashes[name] = sha256(firstBytes);
    }
    return hashes;
  } finally {
    rmSync(first, { recursive: true, force: true });
    rmSync(second, { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  const arguments_ = process.argv.slice(2);
  const contractPath =
    argumentValue(arguments_, '--contract') ??
    '.planning/phases/01-planlegg-dagslinjen/01-SNART-AUTONOMY-CONTRACT.json';
  let result: JsonValue;
  if (arguments_.includes('--fixture-mode')) {
    result = (await validateFixture(contractPath)) as unknown as JsonValue;
  } else if (arguments_.includes('--reproducibility')) {
    const cacheDir =
      argumentValue(arguments_, '--cache-dir') ?? 'tmp/snart-climate-source';
    const expectedDir =
      argumentValue(arguments_, '--expected-dir') ?? 'src/data/snart';
    result = await validateReproducibility(
      contractPath,
      cacheDir,
      expectedDir,
    );
  } else {
    const dataDir =
      argumentValue(arguments_, '--data-dir') ?? 'src/data/snart';
    result = validateClimateBundle({ contractPath, dataDir }) as unknown as JsonValue;
  }
  process.stdout.write(canonicalJsonFile(result));
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
