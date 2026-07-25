import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  realpathSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import {
  dirname,
  extname,
  isAbsolute,
  join,
  relative,
  resolve,
} from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parsePhase1CandidateSummary,
  parsePhase2HandoffSummary,
} from './verify-phase3-exact-sha.mjs';

const SHA_40 = /^[0-9a-f]{40}$/u;
const MAX_BUFFER = 64 * 1024 * 1024;

export const ARTIFACT_NAMES = Object.freeze({
  candidate: 'phase3-candidate.json',
  codeSecurityReview: 'phase3-code-security-review.json',
  uiAccessibilityReview: 'phase3-ui-accessibility-review.json',
  validationLog: 'phase3-final-validation.log',
});

const PHASE1_SUMMARY = join(
  '.planning',
  'phases',
  '01-planlegg-dagslinjen',
  '01-18-SUMMARY.md',
);
const PHASE2_SUMMARY = join(
  '.planning',
  'phases',
  '02-outfit-truth-antrekkskart',
  '02-09-SUMMARY.md',
);
const PHASE3_SUMMARY_DIRECTORY = join(
  '.planning',
  'phases',
  '03-living-home-signature-transition',
);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function errorText(error) {
  return error instanceof Error ? error.message : String(error);
}

function comparable(path) {
  const normalized = resolve(path);
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

function pathContains(parent, child) {
  const fromParent = relative(comparable(parent), comparable(child));
  return (
    fromParent === ''
    || (
      fromParent !== '..'
      && !fromParent.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`)
      && !isAbsolute(fromParent)
    )
  );
}

function realDirectory(path, label) {
  let real;
  try {
    real = realpathSync.native(path);
  } catch (error) {
    throw new Error(`${label} realpath failed: ${errorText(error)}`);
  }
  invariant(statSync(real).isDirectory(), `${label} must be a directory`);
  return real;
}

function assertRootOutsideCheckout(evidenceRoot, checkoutRoot) {
  invariant(
    !pathContains(checkoutRoot, evidenceRoot)
      && !pathContains(evidenceRoot, checkoutRoot),
    'BABYORA_PHASE3_EVIDENCE_ROOT must resolve outside every checkout',
  );
}

function assertArtifactState(evidenceRoot, artifacts, artifactMode) {
  invariant(
    artifactMode === undefined
      || artifactMode === 'collect'
      || artifactMode === 'verify',
    'artifact mode must be collect or verify',
  );
  if (artifactMode === undefined) return;

  for (const [key, artifactPath] of Object.entries(artifacts)) {
    const exists = existsSync(artifactPath);
    if (artifactMode === 'verify') {
      invariant(exists, `external evidence artifact ${key} is missing`);
    }
    if (!exists) continue;

    const linkStatus = lstatSync(artifactPath);
    invariant(
      !linkStatus.isSymbolicLink(),
      `external evidence artifact ${key} cannot be a symlink or junction`,
    );
    let realArtifact;
    try {
      realArtifact = realpathSync.native(artifactPath);
    } catch (error) {
      throw new Error(
        `external evidence artifact ${key} realpath failed: ${errorText(error)}`,
      );
    }
    invariant(
      pathContains(evidenceRoot, realArtifact),
      `external evidence artifact ${key} must remain beneath the evidence root`,
    );
    const artifactStatus = statSync(realArtifact);
    invariant(
      artifactStatus.isFile(),
      `external evidence artifact ${key} must be a regular file`,
    );
    if (artifactMode === 'collect') {
      invariant(
        artifactStatus.size === 0,
        `external evidence artifact ${key} must be empty; stale evidence is forbidden`,
      );
    } else {
      invariant(
        artifactStatus.size > 0,
        `external evidence artifact ${key} must be non-empty`,
      );
    }
  }
}

export function resolveEvidenceLayout({
  environment = process.env,
  cwd = process.cwd(),
  worktreeRoots = [],
  artifactMode,
} = {}) {
  const configured = environment.BABYORA_PHASE3_EVIDENCE_ROOT;
  invariant(
    typeof configured === 'string' && configured.trim().length > 0,
    'BABYORA_PHASE3_EVIDENCE_ROOT is required and cannot be empty',
  );
  invariant(
    isAbsolute(configured),
    'BABYORA_PHASE3_EVIDENCE_ROOT must be absolute',
  );
  const checkoutRoot = realDirectory(cwd, 'candidate checkout');
  const unresolvedRoot = resolve(configured);
  assertRootOutsideCheckout(unresolvedRoot, checkoutRoot);
  const evidenceRoot = realDirectory(
    unresolvedRoot,
    'BABYORA_PHASE3_EVIDENCE_ROOT',
  );
  assertRootOutsideCheckout(evidenceRoot, checkoutRoot);
  for (const worktreeRoot of worktreeRoots) {
    assertRootOutsideCheckout(
      evidenceRoot,
      realDirectory(worktreeRoot, 'Git worktree'),
    );
  }
  const artifacts = Object.freeze(Object.fromEntries(
    Object.entries(ARTIFACT_NAMES).map(([key, name]) => [
      key,
      join(evidenceRoot, name),
    ]),
  ));
  invariant(
    new Set(Object.values(artifacts).map(comparable)).size === 4,
    'external evidence artifact paths must be distinct',
  );
  assertArtifactState(evidenceRoot, artifacts, artifactMode);
  return Object.freeze({ checkoutRoot, evidenceRoot, artifacts });
}

function validatedJavaScriptFile(path) {
  if (!isAbsolute(path)) return null;
  if (!['.js', '.cjs', '.mjs'].includes(extname(path).toLowerCase())) {
    return null;
  }
  try {
    const real = realpathSync.native(path);
    return statSync(real).isFile() ? real : null;
  } catch {
    return null;
  }
}

export function resolveNpmCli({
  environment = process.env,
  execPath = process.execPath,
} = {}) {
  const configured = typeof environment.npm_execpath === 'string'
    ? validatedJavaScriptFile(environment.npm_execpath)
    : null;
  if (configured !== null) return configured;
  const adjacent = validatedJavaScriptFile(join(
    dirname(execPath),
    'node_modules',
    'npm',
    'bin',
    'npm-cli.js',
  ));
  invariant(
    adjacent !== null,
    'validated absolute npm CLI JavaScript file is unavailable',
  );
  return adjacent;
}

export function createFinalCommandMatrix(
  npmCliPath,
  execPath = process.execPath,
) {
  const npm = (...args) => Object.freeze({
    executable: execPath,
    args: Object.freeze([npmCliPath, ...args]),
  });
  return Object.freeze([
    npm('test'),
    npm('run', 'lint'),
    npm('run', 'build'),
    npm('run', 'e2e'),
    npm(
      'exec',
      '--',
      'tsx',
      'e2e/home-outfit-motion.ts',
      '--case',
      'all',
    ),
    npm('exec', '--', 'tsc', '-b', '--pretty', 'false'),
  ]);
}

function stdoutText(result) {
  return typeof result.stdout === 'string'
    ? result.stdout
    : result.stdout?.toString('utf8') ?? '';
}

function stderrText(result) {
  return typeof result.stderr === 'string'
    ? result.stderr
    : result.stderr?.toString('utf8') ?? '';
}

function spawnChecked(
  executable,
  args,
  {
    cwd,
    environment,
    spawnSyncImpl,
    appendLog,
    label,
  },
) {
  if (appendLog !== undefined) {
    appendLog(`\n[command:${label}] ${JSON.stringify([executable, ...args])}\n`);
  }
  const result = spawnSyncImpl(executable, [...args], {
    cwd,
    encoding: 'utf8',
    env: environment,
    maxBuffer: MAX_BUFFER,
    shell: false,
    windowsHide: true,
  });
  const stdout = stdoutText(result);
  const stderr = stderrText(result);
  if (appendLog !== undefined) {
    if (stdout.length > 0) appendLog(stdout);
    if (stderr.length > 0) appendLog(stderr);
  }
  if (result.error !== undefined) {
    throw new Error(`${label} failed: ${errorText(result.error)}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `${label} failed with status ${String(result.status)}: ${stderr.trim()}`,
    );
  }
  return stdout.trim();
}

function gitChecked(args, options) {
  return spawnChecked('git', args, {
    ...options,
    label: `git ${args.join(' ')}`,
  });
}

function exactFrontmatter(text, label) {
  const normalized = text.replaceAll('\r\n', '\n');
  invariant(normalized.startsWith('---\n'), `${label} lacks frontmatter`);
  const end = normalized.indexOf('\n---\n', 4);
  invariant(end >= 0, `${label} has unterminated frontmatter`);
  return normalized.slice(4, end);
}

function exactPhase3Candidate(text, label) {
  const frontmatter = exactFrontmatter(text, label);
  const matches = [...frontmatter.matchAll(
    /^phase3_candidate_sha:\s*([0-9a-f]{40})\s*$/gmu,
  )];
  invariant(
    matches.length === 1,
    `${label} requires exactly one phase3_candidate_sha`,
  );
  const sha = matches[0][1];
  invariant(SHA_40.test(sha), `${label} has invalid phase3 candidate`);
  return sha;
}

function readDependencies(checkoutRoot) {
  const phase1SummaryPath = join(checkoutRoot, PHASE1_SUMMARY);
  const phase1 = parsePhase1CandidateSummary(
    readFileSync(phase1SummaryPath, 'utf8'),
  );
  const phase2 = parsePhase2HandoffSummary(
    readFileSync(join(checkoutRoot, PHASE2_SUMMARY), 'utf8'),
  );
  const phase3 = Array.from({ length: 7 }, (_, index) => {
    const plan = String(index + 1).padStart(2, '0');
    const label = `Phase 3 plan ${plan} summary`;
    return exactPhase3Candidate(
      readFileSync(
        join(
          checkoutRoot,
          PHASE3_SUMMARY_DIRECTORY,
          `03-${plan}-SUMMARY.md`,
        ),
        'utf8',
      ),
      label,
    );
  });
  const dependencies = Object.freeze([
    phase2.phase2CandidateSha,
    ...phase3,
  ]);
  invariant(
    new Set([phase1.phase1CandidateSha, ...dependencies]).size === 9,
    'final dependency candidates must be nine distinct commits',
  );
  return Object.freeze({
    phase1CandidateSha: phase1.phase1CandidateSha,
    phase1SummaryPath,
    dependencies,
    expectedDependencyCount: 9,
  });
}

function discoverCheckout(cwd, common) {
  const topLevel = gitChecked(
    ['rev-parse', '--show-toplevel'],
    { ...common, cwd },
  );
  return realDirectory(topLevel, 'candidate checkout');
}

function parseWorktreeRoots(text) {
  return text
    .split(/\r?\n/u)
    .filter((line) => line.startsWith('worktree '))
    .map((line) => line.slice('worktree '.length));
}

function verifyGitCandidate(
  checkoutRoot,
  dependencies,
  common,
  appendLog,
) {
  const options = { ...common, cwd: checkoutRoot, appendLog };
  const candidateSha = gitChecked(
    ['rev-parse', '--verify', 'HEAD^{commit}'],
    options,
  );
  invariant(SHA_40.test(candidateSha), 'HEAD is not a full candidate SHA');
  invariant(
    gitChecked(['rev-parse', '--abbrev-ref', 'HEAD'], options) === 'HEAD',
    'final candidate checkout must be detached',
  );
  invariant(
    gitChecked(
      ['status', '--porcelain=v1', '--untracked-files=all'],
      options,
    ) === '',
    'final candidate checkout must be clean',
  );
  gitChecked(
    ['diff-tree', '--check', '--root', '-r', candidateSha],
    options,
  );
  for (const dependency of [
    dependencies.phase1CandidateSha,
    ...dependencies.dependencies,
  ]) {
    invariant(SHA_40.test(dependency), `invalid dependency SHA ${dependency}`);
    gitChecked(['cat-file', '-e', `${dependency}^{commit}`], options);
    gitChecked(
      ['merge-base', '--is-ancestor', dependency, candidateSha],
      options,
    );
  }
  return candidateSha;
}

function collect({
  cwd,
  environment,
  execPath,
  spawnSyncImpl,
}) {
  const common = { environment, spawnSyncImpl };
  const checkoutRoot = discoverCheckout(cwd, common);
  const worktreeOutput = gitChecked(
    ['worktree', 'list', '--porcelain'],
    { ...common, cwd: checkoutRoot },
  );
  const layout = resolveEvidenceLayout({
    environment,
    cwd: checkoutRoot,
    worktreeRoots: parseWorktreeRoots(worktreeOutput),
    artifactMode: 'collect',
  });
  writeFileSync(layout.artifacts.validationLog, '', 'utf8');
  const appendLog = (text) => {
    writeFileSync(
      layout.artifacts.validationLog,
      text,
      { encoding: 'utf8', flag: 'a' },
    );
  };
  appendLog('[phase3-final-validation]\n');
  const dependencies = readDependencies(checkoutRoot);
  const candidateSha = verifyGitCandidate(
    checkoutRoot,
    dependencies,
    common,
    appendLog,
  );
  const npmCliPath = resolveNpmCli({ environment, execPath });
  for (const [index, command] of createFinalCommandMatrix(
    npmCliPath,
    execPath,
  ).entries()) {
    spawnChecked(command.executable, command.args, {
      ...common,
      cwd: checkoutRoot,
      appendLog,
      label: `matrix-${index + 1}`,
    });
  }
  const finalSha = verifyGitCandidate(
    checkoutRoot,
    dependencies,
    common,
    appendLog,
  );
  invariant(finalSha === candidateSha, 'candidate HEAD changed during collection');
  const evidenceHash = createHash('sha256')
    .update(readFileSync(layout.artifacts.validationLog))
    .digest('hex');
  writeFileSync(
    layout.artifacts.candidate,
    `${JSON.stringify({
      phase3_candidate_sha: candidateSha,
      ancestry_status: 'PASS',
      clean_status: 'PASS',
      validation_evidence_sha256: evidenceHash,
    }, null, 2)}\n`,
    'utf8',
  );
  return Object.freeze({
    status: 'PASS',
    mode: 'collect',
    phase3CandidateSha: candidateSha,
    validationEvidenceSha256: evidenceHash,
  });
}

function verify({
  cwd,
  environment,
  execPath,
  spawnSyncImpl,
}) {
  const common = { environment, spawnSyncImpl };
  const checkoutRoot = discoverCheckout(cwd, common);
  const worktreeOutput = gitChecked(
    ['worktree', 'list', '--porcelain'],
    { ...common, cwd: checkoutRoot },
  );
  const layout = resolveEvidenceLayout({
    environment,
    cwd: checkoutRoot,
    worktreeRoots: parseWorktreeRoots(worktreeOutput),
    artifactMode: 'verify',
  });
  const dependencies = readDependencies(checkoutRoot);
  const verifierPath = fileURLToPath(
    new URL('./verify-phase3-exact-sha.mjs', import.meta.url),
  );
  const args = [
    verifierPath,
    'candidate',
    '--candidate-record',
    layout.artifacts.candidate,
    '--code-security-review',
    layout.artifacts.codeSecurityReview,
    '--ui-accessibility-review',
    layout.artifacts.uiAccessibilityReview,
    '--validation-bundle',
    layout.artifacts.validationLog,
    '--phase1-summary',
    dependencies.phase1SummaryPath,
  ];
  for (const dependency of dependencies.dependencies) {
    args.push('--dependency', dependency);
  }
  args.push(
    '--expected-dependency-count',
    String(dependencies.expectedDependencyCount),
  );
  spawnChecked(execPath, args, {
    ...common,
    cwd: checkoutRoot,
    label: 'Phase 3 exact-SHA verifier',
  });
  return Object.freeze({ status: 'PASS', mode: 'verify' });
}

export function runPhase3Final(
  argv,
  {
    cwd = process.cwd(),
    environment: providedEnvironment = process.env,
    execPath = process.execPath,
    spawnSyncImpl = spawnSync,
  } = {},
) {
  invariant(
    Array.isArray(argv) && argv.length === 1,
    'use exactly one mode: collect or verify',
  );
  const environment = {
    ...process.env,
    ...providedEnvironment,
  };
  if (argv[0] === 'collect') {
    return collect({ cwd, environment, execPath, spawnSyncImpl });
  }
  if (argv[0] === 'verify') {
    return verify({ cwd, environment, execPath, spawnSyncImpl });
  }
  throw new Error(`unknown final verification mode ${String(argv[0])}`);
}

function isMainModule() {
  if (process.argv[1] === undefined) return false;
  try {
    return comparable(realpathSync.native(resolve(process.argv[1])))
      === comparable(realpathSync.native(fileURLToPath(import.meta.url)));
  } catch {
    return false;
  }
}

if (isMainModule()) {
  try {
    const result = runPhase3Final(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stderr.write(
      `Phase 3 final verification failed: ${errorText(error)}\n`,
    );
    process.exitCode = 1;
  }
}
