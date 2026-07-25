import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import {
  readFileSync,
  realpathSync,
  statSync,
} from 'node:fs';
import {
  isAbsolute,
  relative,
  resolve,
} from 'node:path';
import { pathToFileURL } from 'node:url';

const LOWER_SHA = /^[0-9a-f]{40}$/u;
const SHA256 = /^[0-9a-f]{64}$/u;
const ISO_TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u;

const IMPLEMENTATION_BASE_SHA =
  'd8fbb3cfbe31d5ec065c4a30a12d64bc19f4dc2f';
const PHASE1_SUMMARY =
  '.planning/phases/01-planlegg-dagslinjen/01-18-SUMMARY.md';
const FEATURE_FLAG_PATH = 'src/lib/outfit/feature-flags.ts';
const INVENTORY_SCRIPT_PATH = 'scripts/outfit/inventory-v1.ts';
const INVENTORY_TEST_PATH = 'scripts/outfit/__tests__/inventory-v1.test.ts';
const EXPECTED_INVENTORY_SCRIPT_BLOB =
  'd4af276900bdfbdde9a27a00f5620e49c294c41a';
const EXPECTED_INVENTORY_TEST_BLOB =
  '5c6a3db2adbbcddcaae956b56d17650e0110cb57';

const DEPENDENCIES = Object.freeze({
  dependency_02_01_sha: '5f2217eb46ea64a33bfafe24c588c434cd30a0f3',
  dependency_02_02_sha: 'ac20e97e106aa0953d70f38ec5427d5a6af9e3d5',
  dependency_02_03_sha: 'be3e82e7e14428b97f1181da578b7f60b89fbd4f',
  dependency_02_04_sha: '3e01127a198427bd762113bcc7b1da4cd55b937d',
  dependency_02_05_sha: 'ac9e78311b01f8b2d52f10c33600a80d7d996366',
  dependency_02_06_sha: '947be06ff2615482572567b4066ae0832f5d8dee',
  dependency_02_07_sha: '05b4b503ce162b49c94d6fe95ae0a2d429a92160',
  dependency_02_08_sha: 'f1688a5799af2806b790ece790d9630438625b14',
});

const AMENDED_IMPLEMENTATION_SCOPE = Object.freeze([
  'e2e/fixtures/outfit-truth.html',
  'e2e/fixtures/outfit-truth.tsx',
  'e2e/outfit-truth.ts',
  'scripts/outfit/__tests__/verify-phase2-evidence.test.ts',
  'scripts/outfit/run-phase2-evidence.ts',
  'scripts/outfit/verify-phase2-evidence.ts',
  'src/App.tsx',
  'src/components/outfit/__tests__/OutfitTruthPanel.test.tsx',
  'src/lib/outfit/feature-flags.ts',
  'src/lib/planning/__tests__/planned-outfit-resolver.test.ts',
  'src/screens/PaakledningScreen.tsx',
  'src/screens/__tests__/PaakledningScreen.outfit-truth.test.tsx',
].sort());

const PREACTIVATION_GOVERNANCE_PATH =
  '.planning/phases/02-outfit-truth-antrekkskart/02-09-PREACTIVATION-TEST-AMENDMENT.md';

const AMENDED_SCOPE_WITH_GOVERNANCE = Object.freeze([
  ...AMENDED_IMPLEMENTATION_SCOPE,
  PREACTIVATION_GOVERNANCE_PATH,
].sort());

const ACTIVATION_DELTA = Object.freeze([
  'src/components/outfit/__tests__/OutfitTruthPanel.test.tsx',
  FEATURE_FLAG_PATH,
].sort());

const PRE_ACTIVATION_COMMANDS = Object.freeze({
  pre_activation_inventory_command:
    /scripts\/outfit\/inventory-v1\.ts\s+--assert/u,
  pre_activation_focused_tests_command:
    /vitest\s+run.+PaakledningScreen\.outfit-truth\.test\.tsx.+OutfitTruthPanel\.test\.tsx.+OutfitExperience\.test\.tsx/u,
  pre_activation_build_command: /npm\s+run\s+build/u,
  pre_activation_lint_command: /npm\s+run\s+lint/u,
  pre_activation_exact_context_command:
    /e2e\/planlegg\.ts\s+--case\s+exact-context/u,
  pre_activation_automatic_location_command:
    /e2e\/planlegg\.ts\s+--case\s+automatic-location/u,
  pre_activation_component_matrix_command:
    /e2e\/outfit-truth\.ts\s+--case\s+component-matrix/u,
  pre_activation_production_app_routes_command:
    /e2e\/outfit-truth\.ts\s+--case\s+production-app-routes/u,
});

const INVENTORY_METRICS = Object.freeze({
  inventory_scenario_count: '2036160',
  inventory_unique_outputs: '70',
  inventory_catalog_coverage: '70/70',
  inventory_unique_semantic_garments: '57',
  inventory_garment_body_coverage: '57/57',
  inventory_unique_semantic_equipment: '13',
  inventory_max_semantic_equipment: '6',
  inventory_max_semantic_garments: '11',
  inventory_above_ten: '12960',
  inventory_below_one: '0',
});

const CANDIDATE_KEYS = new Set([
  'status',
  'phase2_candidate_sha',
  'recorded_at',
  'pre_activation_sha',
  'pre_activation_parent_of_candidate',
  'pre_activation_feature_flag',
  'pre_activation_status_clean',
  'phase1_source_field',
  'phase1_candidate_sha',
  'contract_sha256',
  'pack_sha256',
  ...Object.keys(DEPENDENCIES),
  'scope_attestation',
  'scope_file_count',
  'inventory_script_blob',
  'inventory_test_blob',
  ...Object.keys(INVENTORY_METRICS),
  ...Object.keys(PRE_ACTIVATION_COMMANDS),
  ...Object.keys(PRE_ACTIVATION_COMMANDS).map((key) =>
    key.replace(/_command$/u, '_exit'),
  ),
]);

const REVIEW_KEYS = new Set([
  'status',
  'phase2_candidate_sha',
  'reviewer_id',
  'session_id',
  'capability',
  'fresh_context',
  'verdict',
  'unresolved_p0',
  'unresolved_p1',
  'unresolved_severe_findings',
  'reviewed_at',
]);

type Arguments = Readonly<{
  candidate: string;
  candidateRecord: string;
  reviewA: string;
  reviewB: string;
}>;

type ScalarMap = ReadonlyMap<string, string>;

function fail(message: string): never {
  throw new Error(`Phase 2 evidence verification failed: ${message}`);
}

function samePath(left: string, right: string): boolean {
  const normalize = (value: string) =>
    process.platform === 'win32' ? value.toLowerCase() : value;
  return normalize(left) === normalize(right);
}

function isWithin(parent: string, child: string): boolean {
  const pathFromParent = relative(parent, child);
  return (
    pathFromParent === '' ||
    (!pathFromParent.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) &&
      pathFromParent !== '..' &&
      !isAbsolute(pathFromParent))
  );
}

function parseArguments(argv: readonly string[]): Arguments {
  const expected = new Map<string, string>([
    ['--candidate', 'candidate'],
    ['--candidate-record', 'candidateRecord'],
    ['--review-a', 'reviewA'],
    ['--review-b', 'reviewB'],
  ] as const);
  const values = new Map<string, string>();

  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index];
    const value = argv[index + 1];
    if (name === undefined || value === undefined) {
      fail('every argument name must have one separate value');
    }
    if (name.includes('=')) {
      fail(`inline argument syntax is forbidden: ${name}`);
    }
    const property = expected.get(name);
    if (property === undefined) {
      fail(`unknown argument: ${name}`);
    }
    if (values.has(property)) {
      fail(`duplicate argument: ${name}`);
    }
    if (value.startsWith('--') || value.includes('\0')) {
      fail(`missing or invalid value for ${name}`);
    }
    values.set(property, value);
  }

  if (values.size !== expected.size) {
    fail('exactly --candidate, --candidate-record, --review-a and --review-b are required');
  }

  return {
    candidate: values.get('candidate')!,
    candidateRecord: values.get('candidateRecord')!,
    reviewA: values.get('reviewA')!,
    reviewB: values.get('reviewB')!,
  };
}

function run(
  executable: string,
  arguments_: readonly string[],
  cwd: string,
  label: string,
): Buffer {
  const result = spawnSync(executable, [...arguments_], {
    cwd,
    shell: false,
    windowsHide: true,
    encoding: 'buffer',
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error !== undefined) {
    fail(`${label} could not start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const detail = Buffer.concat([
      result.stdout ?? Buffer.alloc(0),
      result.stderr ?? Buffer.alloc(0),
    ])
      .toString('utf8')
      .trim();
    fail(`${label} exited ${String(result.status)}${detail === '' ? '' : `: ${detail}`}`);
  }
  return result.stdout ?? Buffer.alloc(0);
}

function runGit(
  cwd: string,
  arguments_: readonly string[],
  label: string,
): Buffer {
  return run('git', arguments_, cwd, label);
}

function gitText(
  cwd: string,
  arguments_: readonly string[],
  label: string,
): string {
  return runGit(cwd, arguments_, label).toString('utf8').trim();
}

function assertClean(cwd: string, stage: string): void {
  const status = runGit(
    cwd,
    ['status', '--porcelain', '--untracked-files=all'],
    `${stage} status`,
  );
  if (status.length !== 0) {
    fail(`${stage} worktree status is not byte-empty`);
  }
}

function resolveExternalFile(
  suppliedPath: string,
  repoRoot: string,
  label: string,
): string {
  if (!isAbsolute(suppliedPath)) {
    fail(`${label} must be an absolute path`);
  }
  let canonical: string;
  try {
    canonical = realpathSync.native(suppliedPath);
  } catch {
    fail(`${label} must be an existing real path`);
  }
  if (!statSync(canonical).isFile()) {
    fail(`${label} must be a regular file`);
  }
  if (isWithin(repoRoot, canonical)) {
    fail(`${label} must be outside the candidate worktree`);
  }
  return canonical;
}

function frontmatterLines(raw: string, label: string): string[] {
  if (raw.charCodeAt(0) === 0xfeff) {
    fail(`${label} must not contain a byte-order mark`);
  }
  const lines = raw.split(/\r?\n/u);
  if (lines[0] !== '---') {
    fail(`${label} must begin with raw YAML frontmatter`);
  }
  const closing = lines.indexOf('---', 1);
  if (closing < 2) {
    fail(`${label} must have a closing frontmatter delimiter`);
  }
  return lines.slice(1, closing);
}

function parseFlatFrontmatter(
  raw: string,
  label: string,
  allowedKeys: ReadonlySet<string>,
): ScalarMap {
  const values = new Map<string, string>();
  for (const [offset, line] of frontmatterLines(raw, label).entries()) {
    if (line === '') continue;
    if (/^\s/u.test(line)) {
      fail(`${label} line ${String(offset + 2)} uses nested or indented YAML`);
    }
    const match = /^([a-z][a-z0-9_]*):[ \t]+(\S(?:.*\S)?)$/u.exec(line);
    if (match === null) {
      fail(`${label} line ${String(offset + 2)} is not one plain snake_case scalar`);
    }
    const [, key, value] = match;
    if (!allowedKeys.has(key)) {
      fail(`${label} contains unknown or aliased field ${key}`);
    }
    if (values.has(key)) {
      fail(`${label} contains duplicate field ${key}`);
    }
    if (
      /^(?:[|>]|&|\*|!|<<:)/u.test(value) ||
      /(?:^|[\s{[,])&[A-Za-z0-9_-]+|(?:^|[\s{[,])\*[A-Za-z0-9_-]+/u.test(
        value,
      ) ||
      /^[{[]/u.test(value)
    ) {
      fail(`${label} field ${key} uses forbidden YAML structure`);
    }
    values.set(key, value);
  }
  for (const key of allowedKeys) {
    if (!values.has(key)) {
      fail(`${label} is missing ${key}`);
    }
  }
  return values;
}

function parsePhase1Tuple(raw: string): Readonly<{
  candidateSha: string;
  contractSha256: string;
  packSha256: string;
}> {
  const label = 'raw Phase 1 summary';
  const targets = new Set([
    'status',
    'candidate_sha',
    'contract_sha256',
    'pack_sha256',
  ]);
  const values = new Map<string, string>();
  const forbiddenAliases = /^(?:phase1_candidate_sha|final_candidate_sha|commit|candidateSha|candidateSHA|candidate-sha|contractSha256|contract_sha|packSha256|pack_sha)$/u;
  const normalizedTargetKeys = new Set([
    'candidatesha',
    'contractsha256',
    'packsha256',
  ]);

  for (const [offset, line] of frontmatterLines(raw, label).entries()) {
    if (/<<:|(?:^|\s)[&*][A-Za-z0-9_-]+/u.test(line)) {
      fail(`${label} line ${String(offset + 2)} uses a YAML anchor or alias`);
    }
    const keyMatch = /^\s*([^:#\s][^:]*):/u.exec(line);
    if (keyMatch === null) continue;
    const rawKey = keyMatch[1].trim();
    const normalizedKey = rawKey.replace(/[^A-Za-z0-9]/gu, '').toLowerCase();
    if (
      forbiddenAliases.test(rawKey) ||
      (normalizedTargetKeys.has(normalizedKey) && !targets.has(rawKey))
    ) {
      fail(`${label} contains forbidden alias ${rawKey}`);
    }
    if (!targets.has(rawKey)) continue;
    if (/^\s/u.test(line)) {
      if (rawKey === 'status') continue;
      fail(`${label} nests required field ${rawKey}`);
    }
    const scalar = /^([a-z][a-z0-9_]*):[ \t]+(\S+)$/u.exec(line);
    if (scalar === null || /[|>&*!{}[\],]/u.test(scalar[2])) {
      fail(`${label} field ${rawKey} is not one plain scalar`);
    }
    if (values.has(rawKey)) {
      fail(`${label} contains duplicate field ${rawKey}`);
    }
    values.set(rawKey, scalar[2]);
  }

  for (const key of targets) {
    if (!values.has(key)) fail(`${label} is missing ${key}`);
  }
  if (values.get('status') !== 'PASS') fail(`${label} status is not PASS`);
  const candidateSha = values.get('candidate_sha')!;
  const contractSha256 = values.get('contract_sha256')!;
  const packSha256 = values.get('pack_sha256')!;
  if (!LOWER_SHA.test(candidateSha)) fail(`${label} candidate_sha is invalid`);
  if (!SHA256.test(contractSha256)) fail(`${label} contract_sha256 is invalid`);
  if (!SHA256.test(packSha256)) fail(`${label} pack_sha256 is invalid`);
  return { candidateSha, contractSha256, packSha256 };
}

function requireValue(
  values: ScalarMap,
  key: string,
  expected: string,
  label: string,
): void {
  if (values.get(key) !== expected) {
    fail(`${label} ${key} must equal ${expected}`);
  }
}

function parseTimestamp(value: string, label: string): number {
  if (!ISO_TIMESTAMP.test(value)) fail(`${label} is not an explicit ISO timestamp`);
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) fail(`${label} is not a valid timestamp`);
  return parsed;
}

function showFile(cwd: string, sha: string, path: string): string {
  return runGit(cwd, ['show', `${sha}:${path}`], `read ${path} at ${sha}`)
    .toString('utf8');
}

function assertFlag(source: string, expected: boolean, label: string): void {
  const declarations = source.match(
    /export\s+const\s+OUTFIT_TRUTH_V1_AVAILABLE\s*=\s*(?:true|false)\s+as\s+const\s*;/gu,
  );
  if (declarations?.length !== 1) {
    fail(`${label} must contain exactly one literal compile-time flag declaration`);
  }
  const expectedDeclaration = new RegExp(
    `export\\s+const\\s+OUTFIT_TRUTH_V1_AVAILABLE\\s*=\\s*${String(expected)}\\s+as\\s+const\\s*;`,
    'u',
  );
  if (!expectedDeclaration.test(source)) {
    fail(`${label} flag must be exactly ${String(expected)}`);
  }
  if (
    /process\.env|import\.meta\.env|localStorage|sessionStorage|URLSearchParams|location\.search|globalThis|window\./u.test(
      source,
    )
  ) {
    fail(`${label} contains a runtime activation bypass`);
  }
}

function assertActivationUse(root: string, candidate: string): void {
  const runtimePaths = gitText(
    root,
    [
      'grep',
      '-l',
      'OUTFIT_TRUTH_V1_AVAILABLE',
      '--',
      'src/**/*.ts',
      'src/**/*.tsx',
      ':!src/**/__tests__/**',
    ],
    'activation flag source ownership',
  ).split(/\r?\n/u);
  assertSameSorted(
    runtimePaths,
    [FEATURE_FLAG_PATH, 'src/screens/PaakledningScreen.tsx'].sort(),
    'activation flag source ownership',
  );
  const screen = showFile(
    root,
    candidate,
    'src/screens/PaakledningScreen.tsx',
  );
  if (
    !/OUTFIT_TRUTH_V1_AVAILABLE\s*(?:&&|\?)/u.test(screen) ||
    /OUTFIT_TRUTH_V1_AVAILABLE\s*(?:\|\||\?\?)|(?:\|\||\?\?)\s*OUTFIT_TRUTH_V1_AVAILABLE/u.test(
      screen,
    )
  ) {
    fail('Paakledning activation must use the compile-time flag without a bypass');
  }
}

function assertSameSorted(
  actual: readonly string[],
  expected: readonly string[],
  label: string,
): void {
  const normalized = [...actual].filter((item) => item !== '').sort();
  if (
    normalized.length !== expected.length ||
    normalized.some((item, index) => item !== expected[index])
  ) {
    fail(
      `${label} differs; expected ${expected.join(', ')}, received ${normalized.join(', ')}`,
    );
  }
}

function verifyRecord(
  record: ScalarMap,
  candidate: string,
  phase1: ReturnType<typeof parsePhase1Tuple>,
): string {
  requireValue(record, 'status', 'PASS', 'candidate record');
  requireValue(record, 'phase2_candidate_sha', candidate, 'candidate record');
  requireValue(
    record,
    'pre_activation_parent_of_candidate',
    'true',
    'candidate record',
  );
  requireValue(
    record,
    'pre_activation_feature_flag',
    'false',
    'candidate record',
  );
  requireValue(
    record,
    'pre_activation_status_clean',
    'true',
    'candidate record',
  );
  requireValue(
    record,
    'phase1_source_field',
    'candidate_sha',
    'candidate record',
  );
  requireValue(
    record,
    'phase1_candidate_sha',
    phase1.candidateSha,
    'candidate record',
  );
  requireValue(
    record,
    'contract_sha256',
    phase1.contractSha256,
    'candidate record',
  );
  requireValue(
    record,
    'pack_sha256',
    phase1.packSha256,
    'candidate record',
  );
  requireValue(
    record,
    'scope_attestation',
    'amended-12-paths-only',
    'candidate record',
  );
  requireValue(record, 'scope_file_count', '12', 'candidate record');
  requireValue(
    record,
    'inventory_script_blob',
    EXPECTED_INVENTORY_SCRIPT_BLOB,
    'candidate record',
  );
  requireValue(
    record,
    'inventory_test_blob',
    EXPECTED_INVENTORY_TEST_BLOB,
    'candidate record',
  );
  for (const [key, expected] of Object.entries(DEPENDENCIES)) {
    requireValue(record, key, expected, 'candidate record');
  }
  for (const [key, expected] of Object.entries(INVENTORY_METRICS)) {
    requireValue(record, key, expected, 'candidate record');
  }
  for (const [key, marker] of Object.entries(PRE_ACTIVATION_COMMANDS)) {
    const command = record.get(key)!;
    if (!marker.test(command)) {
      fail(`candidate record ${key} does not attest the required command`);
    }
    requireValue(
      record,
      key.replace(/_command$/u, '_exit'),
      '0',
      'candidate record',
    );
  }
  parseTimestamp(record.get('recorded_at')!, 'candidate record recorded_at');
  const preActivationSha = record.get('pre_activation_sha')!;
  if (!LOWER_SHA.test(preActivationSha)) {
    fail('candidate record pre_activation_sha must be 40 lowercase hex');
  }
  return preActivationSha;
}

function verifyReview(
  review: ScalarMap,
  label: string,
  candidate: string,
  candidateCommittedAt: number,
): Readonly<{ reviewerId: string; sessionId: string }> {
  requireValue(review, 'status', 'PASS', label);
  requireValue(review, 'phase2_candidate_sha', candidate, label);
  requireValue(review, 'capability', 'high-verification', label);
  requireValue(review, 'fresh_context', 'true', label);
  requireValue(review, 'verdict', 'PASS', label);
  requireValue(review, 'unresolved_p0', '0', label);
  requireValue(review, 'unresolved_p1', '0', label);
  requireValue(review, 'unresolved_severe_findings', '0', label);
  const reviewedAt = parseTimestamp(review.get('reviewed_at')!, `${label} reviewed_at`);
  if (reviewedAt < candidateCommittedAt) {
    fail(`${label} predates the candidate commit`);
  }
  const reviewerId = review.get('reviewer_id')!;
  const sessionId = review.get('session_id')!;
  if (
    reviewerId.length < 2 ||
    sessionId.length < 2 ||
    /[\r\n\0]/u.test(reviewerId) ||
    /[\r\n\0]/u.test(sessionId)
  ) {
    fail(`${label} reviewer/session identity is invalid`);
  }
  return { reviewerId, sessionId };
}

function assertEvidencePostCandidate(path: string, candidateTime: number, label: string): void {
  if (statSync(path).mtimeMs < candidateTime) {
    fail(`${label} filesystem timestamp predates the candidate`);
  }
}

function assertInventoryBinding(root: string, candidate: string): void {
  const tracked = gitText(
    root,
    ['ls-tree', '-r', '--name-only', candidate, '--', INVENTORY_SCRIPT_PATH, INVENTORY_TEST_PATH],
    'locate candidate inventory artifacts',
  )
    .split(/\r?\n/u)
    .filter(Boolean)
    .sort();
  assertSameSorted(
    tracked,
    [INVENTORY_SCRIPT_PATH, INVENTORY_TEST_PATH].sort(),
    'tracked inventory artifacts',
  );
  const scriptBlob = gitText(
    root,
    ['rev-parse', `${candidate}:${INVENTORY_SCRIPT_PATH}`],
    'inventory script blob',
  );
  const testBlob = gitText(
    root,
    ['rev-parse', `${candidate}:${INVENTORY_TEST_PATH}`],
    'inventory test blob',
  );
  if (
    scriptBlob !== EXPECTED_INVENTORY_SCRIPT_BLOB ||
    testBlob !== EXPECTED_INVENTORY_TEST_BLOB
  ) {
    fail('candidate inventory script/test blobs do not match the locked oracle');
  }
  const inventorySource = readFileSync(resolve(root, INVENTORY_SCRIPT_PATH), 'utf8');
  const inventoryTest = readFileSync(resolve(root, INVENTORY_TEST_PATH), 'utf8');
  if (/\.planning|02-INVENTORY/iu.test(`${inventorySource}\n${inventoryTest}`)) {
    fail('candidate inventory imports or references planning-only evidence');
  }
}

function runInventory(root: string, record: ScalarMap): void {
  const require = createRequire(import.meta.url);
  let tsxCli: string;
  try {
    tsxCli = realpathSync.native(require.resolve('tsx/cli'));
  } catch {
    fail('the validated tsx JavaScript entrypoint is unavailable');
  }
  const result = spawnSync(
    process.execPath,
    [tsxCli, resolve(root, INVENTORY_SCRIPT_PATH), '--assert'],
    {
      cwd: root,
      shell: false,
      windowsHide: true,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      timeout: 240_000,
    },
  );
  if (result.error !== undefined) {
    fail(`candidate-local inventory could not run: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`candidate-local inventory exited ${String(result.status)}: ${(result.stderr ?? '').trim()}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(result.stdout ?? '');
  } catch {
    fail('candidate-local inventory did not emit JSON');
  }
  if (typeof parsed !== 'object' || parsed === null) {
    fail('candidate-local inventory output is not an object');
  }
  const metrics = (parsed as { metrics?: unknown }).metrics;
  if (typeof metrics !== 'object' || metrics === null) {
    fail('candidate-local inventory output has no metrics object');
  }
  const metricMap = metrics as Record<string, unknown>;
  const runtimeExpected: Record<string, string | number> = {
    scenarioCount: 2_036_160,
    uniqueOutputs: 70,
    catalogCoverage: '70/70',
    uniqueSemanticGarments: 57,
    garmentBodyCoverage: '57/57',
    uniqueSemanticEquipment: 13,
    maxSemanticEquipment: 6,
    maxSemanticGarments: 11,
    aboveTen: 12_960,
    belowOne: 0,
  };
  for (const [key, expected] of Object.entries(runtimeExpected)) {
    if (metricMap[key] !== expected) {
      fail(`candidate-local inventory metric ${key} does not match ${String(expected)}`);
    }
  }
  for (const [key, expected] of Object.entries(INVENTORY_METRICS)) {
    requireValue(record, key, expected, 'candidate record');
  }
}

function assertNoMediaCapture(root: string, candidate: string): void {
  const sourcePaths = AMENDED_IMPLEMENTATION_SCOPE.filter(
    (path) => path.startsWith('e2e/') || path.includes('__tests__'),
  );
  for (const path of sourcePaths) {
    const source = showFile(root, candidate, path);
    if (
      /\.screenshot\s*\(|toHaveScreenshot\s*\(|toMatchImageSnapshot\s*\(|\b(?:video|trace)\s*:|startTracing\s*\(|visualTrace\s*\(/u.test(
        source,
      )
    ) {
      fail(`prohibited media capture appears in ${path}`);
    }
  }
}

function assertRequiredScopePathsExist(root: string, candidate: string): void {
  for (const path of AMENDED_SCOPE_WITH_GOVERNANCE) {
    runGit(
      root,
      ['cat-file', '-e', `${candidate}:${path}`],
      `required amended scope path ${path}`,
    );
  }
}

export function verifyPhase2Evidence(argv: readonly string[]): void {
  const arguments_ = parseArguments(argv);
  if (!LOWER_SHA.test(arguments_.candidate)) {
    fail('candidate must be one canonical 40-character lowercase hex SHA');
  }

  const cwd = realpathSync.native(process.cwd());
  const root = realpathSync.native(
    gitText(cwd, ['rev-parse', '--show-toplevel'], 'resolve repository root'),
  );
  if (!samePath(cwd, root)) {
    fail('verifier must run from the repository root');
  }

  const symbolic = spawnSync('git', ['symbolic-ref', '-q', 'HEAD'], {
    cwd: root,
    shell: false,
    windowsHide: true,
    encoding: 'buffer',
  });
  if (symbolic.error !== undefined) {
    fail(`detached-HEAD check could not start: ${symbolic.error.message}`);
  }
  if (symbolic.status === 0) {
    fail('candidate checkout must have detached HEAD');
  }
  if (symbolic.status !== 1) {
    fail(`detached-HEAD check exited unexpectedly: ${String(symbolic.status)}`);
  }

  runGit(
    root,
    ['cat-file', '-e', `${arguments_.candidate}^{commit}`],
    'candidate commit existence',
  );
  const canonicalCandidate = gitText(
    root,
    ['rev-parse', '--verify', `${arguments_.candidate}^{commit}`],
    'canonical candidate commit',
  );
  if (canonicalCandidate !== arguments_.candidate) {
    fail('candidate does not resolve canonically to itself');
  }
  const head = gitText(root, ['rev-parse', 'HEAD'], 'read HEAD');
  if (head !== arguments_.candidate) {
    fail('HEAD does not equal the candidate');
  }
  assertClean(root, 'before verification');

  const evidence = {
    candidateRecord: resolveExternalFile(
      arguments_.candidateRecord,
      root,
      'candidate record',
    ),
    reviewA: resolveExternalFile(arguments_.reviewA, root, 'review A'),
    reviewB: resolveExternalFile(arguments_.reviewB, root, 'review B'),
  };
  if (
    samePath(evidence.candidateRecord, evidence.reviewA) ||
    samePath(evidence.candidateRecord, evidence.reviewB) ||
    samePath(evidence.reviewA, evidence.reviewB)
  ) {
    fail('candidate record and reviews must be three distinct external files');
  }

  const phase1 = parsePhase1Tuple(
    showFile(root, arguments_.candidate, PHASE1_SUMMARY),
  );
  const record = parseFlatFrontmatter(
    readFileSync(evidence.candidateRecord, 'utf8'),
    'candidate record',
    CANDIDATE_KEYS,
  );
  const preActivationSha = verifyRecord(
    record,
    arguments_.candidate,
    phase1,
  );

  const candidateParent = gitText(
    root,
    ['rev-parse', `${arguments_.candidate}^`],
    'candidate parent',
  );
  if (candidateParent !== preActivationSha) {
    fail('pre_activation_sha is not the exact candidate parent');
  }
  runGit(
    root,
    ['cat-file', '-e', `${preActivationSha}^{commit}`],
    'pre-activation commit existence',
  );
  assertFlag(
    showFile(root, preActivationSha, FEATURE_FLAG_PATH),
    false,
    'pre-activation commit',
  );
  assertFlag(
    showFile(root, arguments_.candidate, FEATURE_FLAG_PATH),
    true,
    'candidate commit',
  );
  assertActivationUse(root, arguments_.candidate);
  const activationPaths = gitText(
    root,
    [
      'diff-tree',
      '--no-commit-id',
      '--name-only',
      '-r',
      arguments_.candidate,
    ],
    'activation delta',
  ).split(/\r?\n/u);
  assertSameSorted(activationPaths, ACTIVATION_DELTA, 'activation delta');
  assertInventoryBinding(root, arguments_.candidate);

  runGit(
    root,
    ['cat-file', '-e', `${IMPLEMENTATION_BASE_SHA}^{commit}`],
    'implementation base existence',
  );
  runGit(
    root,
    ['merge-base', '--is-ancestor', IMPLEMENTATION_BASE_SHA, arguments_.candidate],
    'implementation base ancestry',
  );
  const scopePaths = gitText(
    root,
    ['diff', '--name-only', `${IMPLEMENTATION_BASE_SHA}..${arguments_.candidate}`],
    'amended scope',
  ).split(/\r?\n/u);
  assertSameSorted(
    scopePaths,
    AMENDED_SCOPE_WITH_GOVERNANCE,
    'amended twelve-path implementation scope plus governance artifact',
  );
  assertRequiredScopePathsExist(root, arguments_.candidate);
  assertNoMediaCapture(root, arguments_.candidate);

  runGit(
    root,
    ['cat-file', '-e', `${phase1.candidateSha}^{commit}`],
    'Phase 1 candidate existence',
  );
  runGit(
    root,
    ['merge-base', '--is-ancestor', phase1.candidateSha, arguments_.candidate],
    'Phase 1 candidate ancestry',
  );
  for (const [key, dependency] of Object.entries(DEPENDENCIES)) {
    runGit(
      root,
      ['cat-file', '-e', `${dependency}^{commit}`],
      `${key} existence`,
    );
    runGit(
      root,
      ['merge-base', '--is-ancestor', dependency, arguments_.candidate],
      `${key} ancestry`,
    );
  }

  const candidateCommittedAt = parseTimestamp(
    gitText(
      root,
      ['show', '-s', '--format=%cI', arguments_.candidate],
      'candidate timestamp',
    ),
    'candidate commit timestamp',
  );
  const recordedAt = parseTimestamp(
    record.get('recorded_at')!,
    'candidate record recorded_at',
  );
  if (recordedAt < candidateCommittedAt) {
    fail('candidate record predates the candidate commit');
  }
  assertEvidencePostCandidate(
    evidence.candidateRecord,
    candidateCommittedAt,
    'candidate record',
  );

  const reviewA = parseFlatFrontmatter(
    readFileSync(evidence.reviewA, 'utf8'),
    'review A',
    REVIEW_KEYS,
  );
  const reviewB = parseFlatFrontmatter(
    readFileSync(evidence.reviewB, 'utf8'),
    'review B',
    REVIEW_KEYS,
  );
  const identityA = verifyReview(
    reviewA,
    'review A',
    arguments_.candidate,
    candidateCommittedAt,
  );
  const identityB = verifyReview(
    reviewB,
    'review B',
    arguments_.candidate,
    candidateCommittedAt,
  );
  if (identityA.reviewerId === identityB.reviewerId) {
    fail('reviews must have distinct reviewer IDs');
  }
  if (identityA.sessionId === identityB.sessionId) {
    fail('reviews must have distinct session IDs');
  }
  assertEvidencePostCandidate(evidence.reviewA, candidateCommittedAt, 'review A');
  assertEvidencePostCandidate(evidence.reviewB, candidateCommittedAt, 'review B');

  runInventory(root, record);
  assertClean(root, 'after verification');
}

function isDirectInvocation(): boolean {
  const invoked = process.argv[1];
  if (invoked === undefined) return false;
  return pathToFileURL(resolve(invoked)).href === import.meta.url;
}

if (isDirectInvocation()) {
  try {
    verifyPhase2Evidence(process.argv.slice(2));
    process.stdout.write('Phase 2 evidence verification: PASS\n');
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  }
}
