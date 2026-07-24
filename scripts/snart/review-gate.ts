import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from 'node:fs';
import {
  join,
  relative,
  resolve,
} from 'node:path';
import { pathToFileURL } from 'node:url';

export type ReviewLane = 'A' | 'B';

export type ReviewIdentity = {
  canonicalTaskName: string;
  agentId: string;
};

export type CandidateTuple = {
  gitSha: string;
  treeSha: string;
  contractSha256: string;
  packSha256: string;
  evidenceSha256: string;
};

export type CandidateSnapshot = {
  changedPaths: string[];
  clean: boolean;
  contractPath: string;
  contractSha256: string;
  gitSha: string;
  packPath: string;
  packSha256: string;
  treeSha: string;
  worktreePath: string;
};

export type ReviewCandidateRecord = {
  schemaVersion: 'snart-review-candidate@1';
  planId: string;
  attempt: number;
  gateStatus: 'PENDING_REVIEW' | 'FAIL_REVIEW_CYCLES_EXHAUSTED';
  candidate: CandidateTuple;
  repository: {
    clean: true;
    changedPaths: string[];
  };
  paths: {
    contract: string;
    pack: string;
  };
  provenanceAuthenticated: false;
  localReceiptsAreNotCryptographicProvenance: true;
};

export type ReviewFinding = {
  severity: string;
  code: string;
  message: string;
  resolved: boolean;
};

export type ReviewCommand = {
  command: string;
  exitCode: number;
};

export type IndependentReviewReceipt = {
  schemaVersion: 'babyora-independent-review-receipt@2';
  planId: string;
  lane: ReviewLane;
  attempt: number;
  candidate: CandidateTuple;
  reviewer: ReviewIdentity;
  signedByIdentity: ReviewIdentity;
  verdict: 'PASS' | 'FAIL';
  findings: ReviewFinding[];
  commands: ReviewCommand[];
  cleanBefore: boolean;
  cleanAfter: boolean;
};

type BuildCandidateInput = {
  planId: string;
  attempt: number;
  snapshot: CandidateSnapshot;
};

type ValidateReviewInput = {
  candidate: ReviewCandidateRecord;
  receiptA: IndependentReviewReceipt;
  receiptB: IndependentReviewReceipt;
  snapshot: CandidateSnapshot;
};

type JsonPrimitive = null | boolean | number | string;
type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

const CONTRACT_PATH =
  '.planning/phases/01-planlegg-dagslinjen/01-SNART-AUTONOMY-CONTRACT.json';
const PACK_PATH = 'src/data/snart/climate-1991-2020-v1.json';
const DEFAULT_EVIDENCE_DIR =
  '.planning/phases/01-planlegg-dagslinjen/evidence';
const PLAN_ID_PATTERN = /^\d{2}-\d{2}$/u;
const GIT_SHA_PATTERN = /^[a-f0-9]{40}$/u;
const SHA_256_PATTERN = /^[a-f0-9]{64}$/u;

function fail(message: string): never {
  throw new Error(`Snart review gate: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertRecord(
  value: unknown,
  label: string,
): asserts value is Record<string, unknown> {
  if (!isRecord(value)) {
    fail(`${label} must be an object`);
  }
}

function assertExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (
    actual.length !== wanted.length ||
    actual.some((key, index) => key !== wanted[index])
  ) {
    fail(
      `${label} has invalid keys; expected ${wanted.join(', ')}, got ${actual.join(', ')}`,
    );
  }
}

function assertNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    fail(`${label} must be a non-empty string`);
  }
  return value;
}

function assertBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') {
    fail(`${label} must be a boolean`);
  }
  return value;
}

function assertAttempt(value: unknown): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > 3
  ) {
    fail('attempt must be an integer from 1 through 3');
  }
  return value;
}

function assertPlanId(value: unknown): string {
  const planId = assertNonEmptyString(value, 'planId');
  if (!PLAN_ID_PATTERN.test(planId)) {
    fail('planId must use NN-NN format');
  }
  return planId;
}

function assertGitSha(value: unknown, label: string): string {
  const sha = assertNonEmptyString(value, label);
  if (!GIT_SHA_PATTERN.test(sha)) {
    fail(`${label} must be a lowercase 40-character Git SHA`);
  }
  return sha;
}

function assertSha256(value: unknown, label: string): string {
  const hash = assertNonEmptyString(value, label);
  if (!SHA_256_PATTERN.test(hash)) {
    fail(`${label} must be a lowercase SHA-256 digest`);
  }
  return hash;
}

function assertPath(value: unknown, label: string): string {
  const path = assertNonEmptyString(value, label).replaceAll('\\', '/');
  if (path.startsWith('/') || path.includes('../')) {
    fail(`${label} must be a repository-relative path`);
  }
  return path;
}

function canonicalJson(value: unknown): string {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'string'
  ) {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      fail('canonical JSON cannot contain a non-finite number');
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((child) => canonicalJson(child)).join(',')}]`;
  }
  if (!isRecord(value)) {
    fail(`canonical JSON cannot contain ${typeof value}`);
  }
  return `{${Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, child]) => {
      if (child === undefined) {
        fail(`canonical JSON key ${key} is undefined`);
      }
      return `${JSON.stringify(key)}:${canonicalJson(child)}`;
    })
    .join(',')}}`;
}

export function canonicalReviewJsonFile(value: unknown): string {
  return `${canonicalJson(value)}\n`;
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function sha256File(path: string): string {
  return sha256(readFileSync(path));
}

function sameJson(left: unknown, right: unknown): boolean {
  return canonicalReviewJsonFile(left) === canonicalReviewJsonFile(right);
}

function cloneJson<T>(value: T): T {
  return JSON.parse(canonicalReviewJsonFile(value)) as T;
}

function assertIdentity(
  value: unknown,
  label: string,
): ReviewIdentity {
  assertRecord(value, label);
  assertExactKeys(value, ['agentId', 'canonicalTaskName'], label);
  return {
    canonicalTaskName: assertNonEmptyString(
      value.canonicalTaskName,
      `${label}.canonicalTaskName`,
    ),
    agentId: assertNonEmptyString(value.agentId, `${label}.agentId`),
  };
}

function assertCandidateTuple(
  value: unknown,
  label = 'candidate tuple',
): CandidateTuple {
  assertRecord(value, label);
  assertExactKeys(
    value,
    [
      'contractSha256',
      'evidenceSha256',
      'gitSha',
      'packSha256',
      'treeSha',
    ],
    label,
  );
  return {
    gitSha: assertGitSha(value.gitSha, `${label}.gitSha`),
    treeSha: assertGitSha(value.treeSha, `${label}.treeSha`),
    contractSha256: assertSha256(
      value.contractSha256,
      `${label}.contractSha256`,
    ),
    packSha256: assertSha256(value.packSha256, `${label}.packSha256`),
    evidenceSha256: assertSha256(
      value.evidenceSha256,
      `${label}.evidenceSha256`,
    ),
  };
}

function assertCandidateRecord(value: unknown): ReviewCandidateRecord {
  assertRecord(value, 'candidate record');
  assertExactKeys(
    value,
    [
      'attempt',
      'candidate',
      'gateStatus',
      'localReceiptsAreNotCryptographicProvenance',
      'paths',
      'planId',
      'provenanceAuthenticated',
      'repository',
      'schemaVersion',
    ],
    'candidate record',
  );
  if (value.schemaVersion !== 'snart-review-candidate@1') {
    fail('candidate record has an unsupported schemaVersion');
  }
  const planId = assertPlanId(value.planId);
  const attempt = assertAttempt(value.attempt);
  if (
    value.gateStatus !== 'PENDING_REVIEW' &&
    value.gateStatus !== 'FAIL_REVIEW_CYCLES_EXHAUSTED'
  ) {
    fail('candidate record has an invalid gateStatus');
  }
  if (
    value.gateStatus === 'FAIL_REVIEW_CYCLES_EXHAUSTED' &&
    attempt !== 3
  ) {
    fail('review cycles can only be exhausted after the third attempt');
  }
  if (value.provenanceAuthenticated !== false) {
    fail('candidate must not claim authenticated provenance');
  }
  if (value.localReceiptsAreNotCryptographicProvenance !== true) {
    fail('candidate must mark receipts as consistency-only evidence');
  }
  assertRecord(value.repository, 'candidate repository');
  assertExactKeys(
    value.repository,
    ['changedPaths', 'clean'],
    'candidate repository',
  );
  if (value.repository.clean !== true) {
    fail('candidate code worktree must be clean');
  }
  if (!Array.isArray(value.repository.changedPaths)) {
    fail('candidate repository.changedPaths must be an array');
  }
  const changedPaths = value.repository.changedPaths.map((path, index) =>
    assertPath(path, `candidate repository.changedPaths[${index}]`),
  );
  if (
    changedPaths.length === 0 ||
    new Set(changedPaths).size !== changedPaths.length ||
    !sameJson(changedPaths, [...changedPaths].sort())
  ) {
    fail('candidate changed paths must be non-empty, unique and sorted');
  }
  assertRecord(value.paths, 'candidate paths');
  assertExactKeys(value.paths, ['contract', 'pack'], 'candidate paths');
  return {
    schemaVersion: 'snart-review-candidate@1',
    planId,
    attempt,
    gateStatus: value.gateStatus,
    candidate: assertCandidateTuple(value.candidate),
    repository: {
      clean: true,
      changedPaths,
    },
    paths: {
      contract: assertPath(value.paths.contract, 'candidate paths.contract'),
      pack: assertPath(value.paths.pack, 'candidate paths.pack'),
    },
    provenanceAuthenticated: false,
    localReceiptsAreNotCryptographicProvenance: true,
  };
}

function assertFinding(value: unknown, index: number): ReviewFinding {
  const label = `findings[${index}]`;
  assertRecord(value, label);
  assertExactKeys(
    value,
    ['code', 'message', 'resolved', 'severity'],
    label,
  );
  const code = assertNonEmptyString(value.code, `${label}.code`);
  if (!/^[A-Z0-9][A-Z0-9_-]*$/u.test(code)) {
    fail(`${label}.code must be an uppercase stable identifier`);
  }
  return {
    severity: assertNonEmptyString(value.severity, `${label}.severity`),
    code,
    message: assertNonEmptyString(value.message, `${label}.message`),
    resolved: assertBoolean(value.resolved, `${label}.resolved`),
  };
}

function assertCommand(value: unknown, index: number): ReviewCommand {
  const label = `commands[${index}]`;
  assertRecord(value, label);
  assertExactKeys(value, ['command', 'exitCode'], label);
  if (
    typeof value.exitCode !== 'number' ||
    !Number.isInteger(value.exitCode)
  ) {
    fail(`${label}.exitCode must be an integer`);
  }
  return {
    command: assertNonEmptyString(value.command, `${label}.command`),
    exitCode: value.exitCode,
  };
}

export function buildCandidateRecord({
  planId,
  attempt,
  snapshot,
}: BuildCandidateInput): ReviewCandidateRecord {
  const validatedPlanId = assertPlanId(planId);
  const validatedAttempt = assertAttempt(attempt);
  if (snapshot.clean !== true) {
    fail('candidate code worktree must be clean');
  }
  const changedPaths = snapshot.changedPaths
    .map((path, index) => assertPath(path, `changedPaths[${index}]`))
    .sort();
  if (
    changedPaths.length === 0 ||
    new Set(changedPaths).size !== changedPaths.length
  ) {
    fail('changed paths must be non-empty and unique');
  }
  const gitSha = assertGitSha(snapshot.gitSha, 'gitSha');
  const treeSha = assertGitSha(snapshot.treeSha, 'treeSha');
  const contractPath = assertPath(snapshot.contractPath, 'contractPath');
  const packPath = assertPath(snapshot.packPath, 'packPath');
  const contractSha256 = assertSha256(
    snapshot.contractSha256,
    'contractSha256',
  );
  const packSha256 = assertSha256(snapshot.packSha256, 'packSha256');
  const evidenceSha256 = sha256(
    canonicalReviewJsonFile({
      changedPaths,
      contractPath,
      contractSha256,
      gitSha,
      packPath,
      packSha256,
      planId: validatedPlanId,
      treeSha,
    }),
  );

  return {
    schemaVersion: 'snart-review-candidate@1',
    planId: validatedPlanId,
    attempt: validatedAttempt,
    gateStatus: 'PENDING_REVIEW',
    candidate: {
      gitSha,
      treeSha,
      contractSha256,
      packSha256,
      evidenceSha256,
    },
    repository: {
      clean: true,
      changedPaths,
    },
    paths: {
      contract: contractPath,
      pack: packPath,
    },
    provenanceAuthenticated: false,
    localReceiptsAreNotCryptographicProvenance: true,
  };
}

export function markReviewCyclesExhausted(
  candidate: ReviewCandidateRecord,
): ReviewCandidateRecord {
  const validated = assertCandidateRecord(candidate);
  if (validated.attempt !== 3) {
    fail('review cycles can only be exhausted after the third attempt');
  }
  return {
    ...cloneJson(validated),
    gateStatus: 'FAIL_REVIEW_CYCLES_EXHAUSTED',
  };
}

export function buildReviewReceipt(
  input: IndependentReviewReceipt,
  expectedCandidate: ReviewCandidateRecord,
): IndependentReviewReceipt {
  const candidate = assertCandidateRecord(expectedCandidate);
  assertRecord(input, 'review receipt');
  assertExactKeys(
    input,
    [
      'attempt',
      'candidate',
      'cleanAfter',
      'cleanBefore',
      'commands',
      'findings',
      'lane',
      'planId',
      'reviewer',
      'schemaVersion',
      'signedByIdentity',
      'verdict',
    ],
    'review receipt',
  );
  if (input.schemaVersion !== 'babyora-independent-review-receipt@2') {
    fail('review receipt has an unsupported schemaVersion');
  }
  const planId = assertPlanId(input.planId);
  const attempt = assertAttempt(input.attempt);
  if (planId !== candidate.planId || attempt !== candidate.attempt) {
    fail('review receipt plan or attempt does not match the candidate');
  }
  if (input.lane !== 'A' && input.lane !== 'B') {
    fail('review receipt lane must be A or B');
  }
  const tuple = assertCandidateTuple(input.candidate);
  if (!sameJson(tuple, candidate.candidate)) {
    fail('review receipt candidate tuple does not match');
  }
  const reviewer = assertIdentity(input.reviewer, 'reviewer identity');
  const signedByIdentity = assertIdentity(
    input.signedByIdentity,
    'signed reviewer identity',
  );
  if (!sameJson(reviewer, signedByIdentity)) {
    fail('reviewer identity must match the signature identity');
  }
  if (input.verdict !== 'PASS' && input.verdict !== 'FAIL') {
    fail('review receipt verdict must be PASS or FAIL');
  }
  if (!Array.isArray(input.findings)) {
    fail('review receipt findings must be an array');
  }
  const findings = input.findings.map(assertFinding);
  if (!Array.isArray(input.commands) || input.commands.length === 0) {
    fail('review receipt must include command evidence');
  }
  const commands = input.commands.map(assertCommand);

  return {
    schemaVersion: 'babyora-independent-review-receipt@2',
    planId,
    lane: input.lane,
    attempt,
    candidate: tuple,
    reviewer,
    signedByIdentity,
    verdict: input.verdict,
    findings,
    commands,
    cleanBefore: assertBoolean(input.cleanBefore, 'cleanBefore'),
    cleanAfter: assertBoolean(input.cleanAfter, 'cleanAfter'),
  };
}

export function validateReviewRecords({
  candidate,
  receiptA,
  receiptB,
  snapshot,
}: ValidateReviewInput) {
  const actualCandidate = buildCandidateRecord({
    planId: candidate.planId,
    attempt: candidate.attempt,
    snapshot,
  });
  const recordedCandidate = assertCandidateRecord(candidate);
  if (recordedCandidate.gateStatus !== 'PENDING_REVIEW') {
    fail('an exhausted candidate cannot pass review');
  }
  if (!sameJson(actualCandidate, recordedCandidate)) {
    fail('candidate does not match the clean local worktree or artifact digests');
  }
  const validatedA = buildReviewReceipt(receiptA, recordedCandidate);
  const validatedB = buildReviewReceipt(receiptB, recordedCandidate);
  if (validatedA.lane !== 'A' || validatedB.lane !== 'B') {
    fail('review receipts must occupy lanes A and B');
  }
  if (
    validatedA.reviewer.agentId === validatedB.reviewer.agentId ||
    validatedA.reviewer.canonicalTaskName ===
      validatedB.reviewer.canonicalTaskName
  ) {
    fail('reviewers must have distinct agent and canonical task identities');
  }

  for (const receipt of [validatedA, validatedB]) {
    if (receipt.verdict !== 'PASS') {
      fail(`lane ${receipt.lane} did not return PASS`);
    }
    if (!receipt.cleanBefore || !receipt.cleanAfter) {
      fail(`lane ${receipt.lane} did not review a clean worktree`);
    }
    if (receipt.commands.some((command) => command.exitCode !== 0)) {
      fail(`lane ${receipt.lane} contains a non-zero review command`);
    }
    if (receipt.findings.some((finding) => !finding.resolved)) {
      fail(`lane ${receipt.lane} contains an unresolved finding`);
    }
  }

  return {
    attempt: recordedCandidate.attempt,
    gateStatus: 'PASS' as const,
    localReceiptsAreNotCryptographicProvenance: true as const,
    planId: recordedCandidate.planId,
    provenanceAuthenticated: false as const,
    reviewerAgentIds: [
      validatedA.reviewer.agentId,
      validatedB.reviewer.agentId,
    ],
    reviewerCanonicalTaskNames: [
      validatedA.reviewer.canonicalTaskName,
      validatedB.reviewer.canonicalTaskName,
    ],
    valid: true as const,
  };
}

function runGit(
  repositoryRoot: string,
  arguments_: string[],
): string {
  return execFileSync('git', arguments_, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function normalizeRepositoryPath(path: string): string {
  return path
    .trim()
    .replace(/^"|"$/gu, '')
    .replaceAll('\\', '/');
}

function statusPaths(repositoryRoot: string): string[] {
  const status = runGit(repositoryRoot, [
    'status',
    '--porcelain=v1',
    '--untracked-files=all',
  ]);
  if (status.length === 0) {
    return [];
  }
  return status
    .split(/\r?\n/u)
    .flatMap((line) => {
      const path = line.slice(3);
      return path.includes(' -> ') ? path.split(' -> ') : [path];
    })
    .map(normalizeRepositoryPath)
    .filter(Boolean);
}

function planChangedPaths(
  repositoryRoot: string,
  planId: string,
): string[] {
  const log = runGit(repositoryRoot, [
    'log',
    '--first-parent',
    '--format=%H%x09%s',
  ]);
  const lines = log.split(/\r?\n/u).filter(Boolean);
  let scopedCommitCount = 0;
  let baseSha: string | undefined;

  for (const line of lines) {
    const tab = line.indexOf('\t');
    if (tab < 1) {
      fail('could not parse Git history while deriving changed paths');
    }
    const hash = line.slice(0, tab);
    const subject = line.slice(tab + 1);
    if (subject.includes(`(${planId})`)) {
      scopedCommitCount += 1;
      continue;
    }
    if (scopedCommitCount > 0) {
      baseSha = hash;
      break;
    }
    fail(`HEAD is not a ${planId}-scoped candidate commit`);
  }

  if (scopedCommitCount === 0) {
    fail(`no contiguous ${planId}-scoped commits were found at HEAD`);
  }
  const arguments_ = baseSha
    ? [
        'diff',
        '--name-only',
        '--diff-filter=ACDMRTUXB',
        `${baseSha}..HEAD`,
      ]
    : [
        'diff-tree',
        '--root',
        '--no-commit-id',
        '--name-only',
        '-r',
        'HEAD',
      ];
  const output = runGit(repositoryRoot, arguments_);
  const changedPaths = [
    ...new Set(
      output
        .split(/\r?\n/u)
        .map(normalizeRepositoryPath)
        .filter(Boolean),
    ),
  ].sort();
  if (changedPaths.length === 0) {
    fail(`no changed paths were found for plan ${planId}`);
  }
  return changedPaths;
}

function sameFilesystemPath(left: string, right: string): boolean {
  const normalizedLeft = resolve(left).replaceAll('\\', '/');
  const normalizedRight = resolve(right).replaceAll('\\', '/');
  return process.platform === 'win32'
    ? normalizedLeft.toLowerCase() === normalizedRight.toLowerCase()
    : normalizedLeft === normalizedRight;
}

export function validateEvidenceDirectory(
  repositoryRoot: string,
  evidenceDir: string,
): string {
  if (evidenceDir !== DEFAULT_EVIDENCE_DIR) {
    fail(
      `evidence directory must be the literal canonical path ${DEFAULT_EVIDENCE_DIR}`,
    );
  }
  const root = resolve(repositoryRoot);
  let current = root;
  for (const segment of DEFAULT_EVIDENCE_DIR.split('/')) {
    current = join(current, segment);
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) {
      fail('evidence directory must not traverse a symlink or junction');
    }
  }
  if (
    existsSync(current) &&
    !sameFilesystemPath(realpathSync.native(current), current)
  ) {
    fail('evidence directory must resolve to its canonical literal path');
  }
  return DEFAULT_EVIDENCE_DIR;
}

export function isPlanEvidencePath(path: string, planId: string): boolean {
  const prefix = `${DEFAULT_EVIDENCE_DIR}/${planId}`;
  return (
    path === `${prefix}-candidate.json` ||
    path === `${prefix}-review-a.json` ||
    path === `${prefix}-review-b.json`
  );
}

export function captureCandidateSnapshot({
  planId,
  evidenceDir = DEFAULT_EVIDENCE_DIR,
  cwd = process.cwd(),
}: {
  planId: string;
  evidenceDir?: string;
  cwd?: string;
}): CandidateSnapshot {
  const validatedPlanId = assertPlanId(planId);
  const repositoryRoot = runGit(resolve(cwd), [
    'rev-parse',
    '--show-toplevel',
  ]);
  validateEvidenceDirectory(
    repositoryRoot,
    evidenceDir,
  );
  const dirtyCodePaths = statusPaths(repositoryRoot).filter(
    (path) => !isPlanEvidencePath(path, validatedPlanId),
  );
  const contractAbsolutePath = join(repositoryRoot, CONTRACT_PATH);
  const packAbsolutePath = join(repositoryRoot, PACK_PATH);

  return {
    changedPaths: planChangedPaths(repositoryRoot, validatedPlanId),
    clean: dirtyCodePaths.length === 0,
    contractPath: CONTRACT_PATH,
    contractSha256: sha256File(contractAbsolutePath),
    gitSha: runGit(repositoryRoot, ['rev-parse', 'HEAD']),
    packPath: PACK_PATH,
    packSha256: sha256File(packAbsolutePath),
    treeSha: runGit(repositoryRoot, ['rev-parse', 'HEAD^{tree}']),
    worktreePath: repositoryRoot.replaceAll('\\', '/'),
  };
}

function argumentValue(
  arguments_: string[],
  name: string,
): string | undefined {
  const index = arguments_.indexOf(name);
  if (index < 0) {
    return undefined;
  }
  const value = arguments_[index + 1];
  if (!value || value.startsWith('--')) {
    fail(`${name} requires a value`);
  }
  return value;
}

function requiredArgument(arguments_: string[], name: string): string {
  const value = argumentValue(arguments_, name);
  if (!value) {
    fail(`${name} is required`);
  }
  return value;
}

function parseJsonFile<T>(path: string, label: string): T {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(`${label} is not valid JSON: ${message}`);
  }
}

function writeEvidence(path: string, content: string): void {
  mkdirSync(resolve(path, '..'), { recursive: true });
  writeFileSync(path, content, { encoding: 'utf8', flag: 'w' });
}

async function main(): Promise<void> {
  const arguments_ = process.argv.slice(2);
  const command = arguments_.shift();
  if (!command || !['candidate', 'receipt', 'validate'].includes(command)) {
    fail('expected candidate, receipt or validate command');
  }
  const planId = assertPlanId(requiredArgument(arguments_, '--plan'));
  const evidenceDir =
    argumentValue(arguments_, '--evidence-dir') ?? DEFAULT_EVIDENCE_DIR;
  const repositoryRoot = runGit(resolve(process.cwd()), [
    'rev-parse',
    '--show-toplevel',
  ]);
  const canonicalEvidenceDir = validateEvidenceDirectory(
    repositoryRoot,
    evidenceDir,
  );
  const evidenceRoot = join(repositoryRoot, canonicalEvidenceDir);
  const candidatePath = join(evidenceRoot, `${planId}-candidate.json`);

  if (command === 'candidate') {
    const attempt = assertAttempt(
      Number(requiredArgument(arguments_, '--attempt')),
    );
    const snapshot = captureCandidateSnapshot({
      planId,
      evidenceDir,
    });
    let candidate = buildCandidateRecord({
      planId,
      attempt,
      snapshot,
    });
    if (arguments_.includes('--exhausted')) {
      candidate = markReviewCyclesExhausted(candidate);
    }
    const serialized = canonicalReviewJsonFile(candidate);
    writeEvidence(candidatePath, serialized);
    process.stdout.write(serialized);
    return;
  }

  const candidate = assertCandidateRecord(
    parseJsonFile<unknown>(candidatePath, 'candidate record'),
  );

  if (command === 'receipt') {
    const lane = requiredArgument(arguments_, '--lane');
    if (lane !== 'A' && lane !== 'B') {
      fail('--lane must be A or B');
    }
    const inputPath = argumentValue(arguments_, '--input');
    const rawInput = inputPath
      ? readFileSync(resolve(inputPath), 'utf8')
      : readFileSync(0, 'utf8');
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawInput);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      fail(`review receipt is not valid JSON: ${message}`);
    }
    const receipt = buildReviewReceipt(
      parsed as IndependentReviewReceipt,
      candidate,
    );
    if (receipt.lane !== lane) {
      fail('receipt lane does not match --lane');
    }
    const receiptPath = join(
      evidenceRoot,
      `${planId}-review-${lane.toLowerCase()}.json`,
    );
    writeEvidence(receiptPath, rawInput);
    process.stdout.write(
      canonicalReviewJsonFile({
        lane,
        receiptPath: relative(process.cwd(), receiptPath).replaceAll(
          '\\',
          '/',
        ),
        storedUnchanged: true,
      }),
    );
    return;
  }

  const receiptA = parseJsonFile<IndependentReviewReceipt>(
    join(evidenceRoot, `${planId}-review-a.json`),
    'lane A receipt',
  );
  const receiptB = parseJsonFile<IndependentReviewReceipt>(
    join(evidenceRoot, `${planId}-review-b.json`),
    'lane B receipt',
  );
  const snapshot = captureCandidateSnapshot({
    planId,
    evidenceDir,
  });
  process.stdout.write(
    canonicalReviewJsonFile(
      validateReviewRecords({
        candidate,
        receiptA,
        receiptB,
        snapshot,
      }) as unknown as JsonValue,
    ),
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
