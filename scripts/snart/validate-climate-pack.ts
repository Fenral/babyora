import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  buildClimatePack,
  buildHomePlaceProjection,
  canonicalJsonFile,
  deriveMonthlyProfile,
  sha256,
  SnartPipelineError,
  validateMetUrl,
  type JsonValue,
  type SnartContract,
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
const FIXTURE_PATH = 'scripts/snart/fixtures/met-boundaries-v1.json';
const CREDENTIAL_PATTERN =
  /(?:FROST_CLIENT_ID|(?:API|ACCESS)[_-]?KEY|AUTHORIZATION\s*[:=]|BEARER\s+[A-Za-z0-9._~-]+|CLIENT[_-]?SECRET|PRIVATE[_-]?KEY)/iu;
const PACK_KEYS = [
  'contractVersion',
  'derivationVersion',
  'normalPeriod',
  'profiles',
  'rulesetVersion',
  'schemaVersion',
];
const MANIFEST_KEYS = [
  'builderSha256',
  'canonicalPlaceCount',
  'canonicalPlacesSha256',
  'contractSha256',
  'createdFromGitSha',
  'derivationVersion',
  'fixtureMode',
  'gridPolicyVersion',
  'homePlaceKeyVersion',
  'httpPolicyVersion',
  'monthCount',
  'normalPeriod',
  'packSha256',
  'placeGridBindings',
  'productionEligible',
  'roundingPolicy',
  'rulesetVersion',
  'schemaVersion',
  'sourceAggregations',
  'sourceAttribution',
  'sourceCatalogUrls',
  'sourceDatasetName',
  'sourceDatasets',
  'sourceDisclaimer',
  'sourceFileVersions',
  'sourceInstitution',
  'sourceLicenseUri',
  'sourceMetadataSha256',
  'sourceUnits',
  'sourceVariableVersions',
  'supportedProfileCount',
  'targetWindowDerivationVersion',
  'unavailableProfileCount',
];
const SUPPORTED_BINDING_KEYS = [
  'X',
  'Y',
  'distanceMillimetres',
  'gridLat',
  'gridLon',
  'homePlaceKey',
  'latE4',
  'lonE4',
  'nameNfc',
  'profileId',
  'status',
];
const UNAVAILABLE_BINDING_KEYS = [
  'homePlaceKey',
  'latE4',
  'lonE4',
  'nameNfc',
  'reason',
  'status',
];

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

function boolean(value: JsonValue | undefined, label: string): boolean {
  if (typeof value !== 'boolean') {
    throw new SnartPipelineError(
      'FAIL_SCHEMA',
      `${label} must be a boolean`,
    );
  }
  return value;
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

function exactKeys(
  value: JsonRecord,
  expected: string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (!sameJson(actual, wanted)) {
    throw new SnartPipelineError(
      'FAIL_SCHEMA_KEYS',
      `${label} has unexpected fields`,
    );
  }
}

function fixtureExcerptDigest(): string {
  const fixtures = JSON.parse(
    readFileSync(FIXTURE_PATH, 'utf8'),
  ) as {
    officialExcerpts: { sourceUrl: string; sha256: string; body: string }[];
  };
  for (const excerpt of fixtures.officialExcerpts) {
    if (sha256(excerpt.body) !== excerpt.sha256) {
      throw new SnartPipelineError(
        'FAIL_FIXTURE_SHA',
        `fixture excerpt hash mismatch for ${excerpt.sourceUrl}`,
      );
    }
  }
  return sha256(
    canonicalJsonFile(
      fixtures.officialExcerpts.map((excerpt) => ({
        sha256: excerpt.sha256,
        sourceUrl: excerpt.sourceUrl,
      })) as unknown as JsonValue,
    ),
  );
}

function validateSourceDatasets(
  manifest: JsonRecord,
  contract: SnartContract,
  fixtureMode: boolean,
  supportedProfileCount: number,
): void {
  const datasets = array(
    manifest.sourceDatasets,
    'manifest.sourceDatasets',
  ).map((value, index) =>
    record(value, `manifest.sourceDatasets[${index}]`),
  );
  if (datasets.length !== 24) {
    throw new SnartPipelineError(
      'FAIL_SOURCE_DATASETS',
      'manifest must bind exactly 24 monthly datasets',
    );
  }
  const metadataProjection: JsonValue[] = [];
  for (let index = 0; index < datasets.length; index += 1) {
    const dataset = datasets[index];
    exactKeys(
      dataset,
      [
        'datasetUrl',
        'family',
        'metadataSha256',
        'month',
        'responseSha256',
        'variable',
      ],
      `source dataset ${index}`,
    );
    const expectedUrl = contract.source.datasetUrls[index];
    const datasetUrl = string(dataset.datasetUrl, 'datasetUrl');
    if (datasetUrl !== expectedUrl) {
      throw new SnartPipelineError(
        'FAIL_SOURCE_DATASET_ORDER',
        `source dataset ${index} differs from contract`,
      );
    }
    const parsed = validateMetUrl(`${datasetUrl}.dds`, contract.httpPolicy);
    if (
      dataset.family !== parsed.family ||
      dataset.variable !== parsed.family ||
      dataset.month !== parsed.month
    ) {
      throw new SnartPipelineError(
        'FAIL_SOURCE_DATASET_IDENTITY',
        `${datasetUrl} family/month metadata is inconsistent`,
      );
    }
    const metadataSha256 = sha(
      dataset.metadataSha256,
      `${datasetUrl}.metadataSha256`,
    );
    metadataProjection.push({ datasetUrl, metadataSha256 });
    const responses = array(
      dataset.responseSha256,
      `${datasetUrl}.responseSha256`,
    ).map((value, responseIndex) =>
      record(value, `${datasetUrl}.responseSha256[${responseIndex}]`),
    );
    if (!fixtureMode && supportedProfileCount > 0 && responses.length === 0) {
      throw new SnartPipelineError(
        'FAIL_SOURCE_RESPONSES',
        `${datasetUrl} has no point response evidence`,
      );
    }
    const seen = new Set<string>();
    for (const response of responses) {
      exactKeys(response, ['sha256', 'url'], 'source response');
      const url = string(response.url, 'source response URL');
      const validated = validateMetUrl(url, contract.httpPolicy);
      if (validated.datasetUrl !== datasetUrl || seen.has(url)) {
        throw new SnartPipelineError(
          'FAIL_SOURCE_RESPONSE_BINDING',
          `${url} is duplicate or bound to the wrong dataset`,
        );
      }
      seen.add(url);
      sha(response.sha256, `${url}.sha256`);
    }
  }
  if (
    sha(manifest.sourceMetadataSha256, 'sourceMetadataSha256') !==
    sha256(canonicalJsonFile(metadataProjection))
  ) {
    throw new SnartPipelineError(
      'FAIL_SOURCE_METADATA_HASH',
      'source metadata projection hash is inconsistent',
    );
  }
}

function validateMonthlyProfile(
  profile: JsonRecord,
  homePlaceKey: string,
  binding: JsonRecord,
  contract: SnartContract,
): void {
  exactKeys(
    profile,
    ['grid', 'homePlaceKey', 'months', 'profileId'],
    `profile ${homePlaceKey}`,
  );
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
  exactKeys(
    grid,
    ['X', 'Y', 'distanceMillimetres', 'lat', 'lon'],
    `${homePlaceKey}.grid`,
  );
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
  const rows = array(profile.months, `${homePlaceKey}.months`).map(
    (value, index) => {
      const row = record(value, `${homePlaceKey}.months[${index}]`);
      exactKeys(
        row,
        ['meanTemperatureC', 'month', 'monthlyPrecipitationMm'],
        `${homePlaceKey}.months[${index}]`,
      );
      return {
        month: integer(row.month, `${homePlaceKey}.month`),
        meanTemperatureC: number(
          row.meanTemperatureC,
          `${homePlaceKey}.meanTemperatureC`,
        ),
        monthlyPrecipitationMm: number(
          row.monthlyPrecipitationMm,
          `${homePlaceKey}.monthlyPrecipitationMm`,
        ),
      };
    },
  );
  const normalized = deriveMonthlyProfile(rows, contract);
  if (!sameJson(rows as unknown as JsonValue, normalized as unknown as JsonValue)) {
    throw new SnartPipelineError(
      'FAIL_MONTH_ROUNDING',
      `${homePlaceKey} monthly rows violate the frozen rounding policy`,
    );
  }
}

export function validateClimateBundle(
  options: ValidateOptions,
): ValidationReport {
  const contractRaw = readFileSync(options.contractPath);
  const contract = JSON.parse(
    contractRaw.toString('utf8'),
  ) as SnartContract;
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
    contract.schemaVersion !== 'babyora-snart-autonomy-contract@2' ||
    pack.schemaVersion !== 'babyora-monthly-normal-pack@2' ||
    manifest.schemaVersion !== 'babyora-monthly-normal-manifest@2'
  ) {
    throw new SnartPipelineError(
      'FAIL_SCHEMA_VERSION',
      'unexpected contract, pack or manifest schema',
    );
  }
  const actualFixtureMode = boolean(
    manifest.fixtureMode,
    'manifest.fixtureMode',
  );
  exactKeys(pack, PACK_KEYS, 'pack');
  exactKeys(
    manifest,
    actualFixtureMode
      ? [...MANIFEST_KEYS, 'fixtureSourceExcerptsSha256']
      : MANIFEST_KEYS,
    'manifest',
  );
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
  if (Object.hasOwn(manifest, 'generatedAt')) {
    throw new SnartPipelineError(
      'FAIL_NONDETERMINISTIC_FIELD',
      'generatedAt cannot carry bundle identity',
    );
  }
  if (
    actualFixtureMode !== Boolean(options.fixtureMode) ||
    boolean(manifest.productionEligible, 'manifest.productionEligible') !==
      !actualFixtureMode
  ) {
    throw new SnartPipelineError(
      'FAIL_FIXTURE_BOUNDARY',
      'fixture/production eligibility mismatch',
    );
  }
  if (actualFixtureMode) {
    if (
      sha(
        manifest.fixtureSourceExcerptsSha256,
        'fixtureSourceExcerptsSha256',
      ) !== fixtureExcerptDigest()
    ) {
      throw new SnartPipelineError(
        'FAIL_FIXTURE_METADATA_HASH',
        'fixture manifest does not bind the official excerpts',
      );
    }
  } else if (Object.hasOwn(manifest, 'fixtureSourceExcerptsSha256')) {
    throw new SnartPipelineError(
      'FAIL_FIXTURE_BOUNDARY',
      'production manifest contains fixture evidence',
    );
  }

  const projection = buildHomePlaceProjection(options.contractPath);
  if (
    manifest.canonicalPlacesSha256 !==
      contract.homePlacePolicy.canonicalProjectionSha256 ||
    manifest.canonicalPlaceCount !== projection.length ||
    manifest.homePlaceKeyVersion !== contract.homePlacePolicy.version ||
    manifest.gridPolicyVersion !== contract.gridPolicy.version ||
    manifest.httpPolicyVersion !== contract.httpPolicy.version ||
    manifest.derivationVersion !== contract.derivationPolicy.version ||
    manifest.targetWindowDerivationVersion !==
      contract.derivationPolicy.targetWindowDerivationVersion ||
    manifest.monthCount !== contract.derivationPolicy.monthCount ||
    manifest.sourceDatasetName !== contract.source.datasetName ||
    manifest.sourceInstitution !== contract.source.metadataInstitution ||
    manifest.sourceAttribution !== contract.source.attributionText ||
    manifest.sourceDisclaimer !== contract.source.derivedDataDisclaimer ||
    !contract.source.acceptedLicenseUris.includes(
      string(manifest.sourceLicenseUri, 'sourceLicenseUri'),
    ) ||
    !sameJson(
      manifest.sourceCatalogUrls as JsonValue,
      contract.source.catalogUrls as unknown as JsonValue,
    ) ||
    !sameJson(
      manifest.sourceVariableVersions as JsonValue,
      contract.source.variableVersions as unknown as JsonValue,
    ) ||
    !sameJson(
      manifest.sourceFileVersions as JsonValue,
      contract.source.fileVersions as unknown as JsonValue,
    ) ||
    !sameJson(
      manifest.sourceUnits as JsonValue,
      contract.source.units as unknown as JsonValue,
    ) ||
    !sameJson(
      manifest.sourceAggregations as JsonValue,
      contract.source.aggregations as unknown as JsonValue,
    ) ||
    !sameJson(
      manifest.normalPeriod as JsonValue,
      contract.source.normalPeriod as unknown as JsonValue,
    ) ||
    !sameJson(
      manifest.roundingPolicy as JsonValue,
      contract.derivationPolicy.rounding as unknown as JsonValue,
    )
  ) {
    throw new SnartPipelineError(
      'FAIL_PROVENANCE',
      'manifest provenance differs from the frozen contract',
    );
  }

  const bindings = array(
    manifest.placeGridBindings,
    'manifest.placeGridBindings',
  ).map((value, index) => record(value, `place binding ${index}`));
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
      exactKeys(binding, SUPPORTED_BINDING_KEYS, `binding ${key}`);
      string(binding.profileId, `${key}.profileId`);
      integer(binding.X, `${key}.X`);
      integer(binding.Y, `${key}.Y`);
      const distance = integer(
        binding.distanceMillimetres,
        `${key}.distance`,
      );
      if (distance < 0 || distance > contract.gridPolicy.maxDistanceMillimetres) {
        throw new SnartPipelineError(
          'FAIL_GRID_BINDING',
          `${key} distance is outside the frozen policy`,
        );
      }
      number(binding.gridLat, `${key}.gridLat`);
      number(binding.gridLon, `${key}.gridLon`);
    } else if (binding.status === 'unavailable') {
      exactKeys(binding, UNAVAILABLE_BINDING_KEYS, `binding ${key}`);
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
  if (
    pack.derivationVersion !== contract.derivationPolicy.version ||
    pack.contractVersion !== contract.contractVersion ||
    pack.rulesetVersion !== 'babyora-snart-heuristics@2' ||
    manifest.rulesetVersion !== 'babyora-snart-heuristics@2' ||
    !sameJson(
      pack.normalPeriod as JsonValue,
      contract.source.normalPeriod as unknown as JsonValue,
    )
  ) {
    throw new SnartPipelineError(
      'FAIL_PACK_PROVENANCE',
      'pack identity differs from the contract',
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
    validateMonthlyProfile(
      record(profiles[key], `profile ${key}`),
      key,
      binding,
      contract,
    );
  }

  validateSourceDatasets(
    manifest,
    contract,
    actualFixtureMode,
    supportedBindings.length,
  );

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

function removeTemporaryDirectory(directory: string): void {
  const root = `${resolve('tmp')}${sep}`;
  const target = resolve(directory);
  if (!target.startsWith(root)) {
    throw new SnartPipelineError(
      'FAIL_TEMP_PATH',
      `refusing to remove non-temporary path ${target}`,
    );
  }
  rmSync(target, { recursive: true, force: true });
}

async function validateFixture(contractPath: string): Promise<ValidationReport> {
  const directory = temporaryDirectory('snart-fixture-validation-');
  try {
    await buildClimatePack({
      contractPath,
      fixturePath: FIXTURE_PATH,
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
    removeTemporaryDirectory(directory);
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
    removeTemporaryDirectory(first);
    removeTemporaryDirectory(second);
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
    result = validateClimateBundle({
      contractPath,
      dataDir,
    }) as unknown as JsonValue;
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
