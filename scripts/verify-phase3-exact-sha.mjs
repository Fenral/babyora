import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  readFileSync,
  realpathSync,
  statSync,
} from 'node:fs';
import {
  isAbsolute,
  relative,
  resolve,
  sep,
} from 'node:path';
import { fileURLToPath } from 'node:url';

const SHA_40 = /^[0-9a-f]{40}$/;
const SHA_256 = /^[0-9a-f]{64}$/;
const MAX_DEPENDENCIES = 100;

const CANDIDATE_RECORD_KEYS = Object.freeze([
  'phase3_candidate_sha',
  'ancestry_status',
  'clean_status',
  'validation_evidence_sha256',
]);

const REVIEW_FIELDS = Object.freeze({
  code: Object.freeze([
    'code_security_sha',
    'code_security_status',
    'code_security_verdict',
    'code_security_reviewer_id',
    'code_security_session_id',
    'code_security_fork_turns',
    'code_security_fresh_context',
    'code_security_evidence_sha256',
  ]),
  ui: Object.freeze([
    'ui_accessibility_sha',
    'ui_accessibility_status',
    'ui_accessibility_verdict',
    'ui_accessibility_reviewer_id',
    'ui_accessibility_session_id',
    'ui_accessibility_fork_turns',
    'ui_accessibility_fresh_context',
    'ui_accessibility_evidence_sha256',
  ]),
});

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function errorOutput(error) {
  if (typeof error !== 'object' || error === null) {
    return String(error);
  }

  const stdout =
    'stdout' in error && error.stdout !== undefined
      ? String(error.stdout).trim()
      : '';
  const stderr =
    'stderr' in error && error.stderr !== undefined
      ? String(error.stderr).trim()
      : '';
  const message = 'message' in error ? String(error.message).trim() : '';
  return [stderr, stdout, message].filter(Boolean).join('\n');
}

function runGit(cwd, args, label) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }).trim();
  } catch (error) {
    const detail = errorOutput(error);
    throw new Error(
      `git ${label} failed${detail.length > 0 ? `: ${detail}` : ''}`,
    );
  }
}

function readUtf8(path, label) {
  try {
    return readFileSync(path, 'utf8');
  } catch (error) {
    throw new Error(`${label} could not be read: ${errorOutput(error)}`);
  }
}

function parseFrontmatter(text, label) {
  invariant(typeof text === 'string', `${label} must be text`);

  const lines = text.replaceAll('\r\n', '\n').split('\n');
  invariant(lines[0] === '---', `${label} must start with YAML frontmatter`);
  const closingIndex = lines.indexOf('---', 1);
  invariant(closingIndex > 1, `${label} frontmatter is incomplete`);

  const fields = new Map();
  for (const line of lines.slice(1, closingIndex)) {
    const trimmedLine = line.trim();
    if (
      trimmedLine.length === 0 ||
      trimmedLine.startsWith('#') ||
      /^\s/.test(line)
    ) {
      continue;
    }

    const match = /^([A-Za-z0-9_-]+):[ \t]*(.*)$/.exec(line);
    invariant(
      match !== null,
      `${label} contains unsupported top-level frontmatter syntax: ${line}`,
    );

    const [, key, rawValue] = match;
    invariant(!fields.has(key), `${label} contains duplicate key ${key}`);
    fields.set(key, rawValue.trim());
  }

  return fields;
}

function looksLikeCandidateShaAlias(key) {
  const normalized = key.toLowerCase().replaceAll(/[^a-z0-9]/g, '');
  return (
    (normalized.includes('candidate') && normalized.includes('sha')) ||
    normalized === 'commit' ||
    (normalized.includes('commit') && normalized.includes('sha'))
  );
}

function looksLikePhase2CandidateShaAlias(key) {
  if (key === 'phase2_candidate_sha' || key === 'phase1_candidate_sha') {
    return false;
  }

  const normalized = key.toLowerCase().replaceAll(/[^a-z0-9]/g, '');
  return looksLikeCandidateShaAlias(key) || normalized === 'phase2sha';
}

export function parsePhase1CandidateSummary(text) {
  const fields = parseFrontmatter(text, 'Phase 1 summary');

  for (const key of fields.keys()) {
    invariant(
      key === 'candidate_sha' || !looksLikeCandidateShaAlias(key),
      `Phase 1 summary uses forbidden candidate SHA alias ${key}`,
    );
  }

  invariant(
    fields.get('status') === 'PASS',
    'Phase 1 summary status must be exact PASS',
  );
  const candidateSha = fields.get('candidate_sha');
  invariant(
    typeof candidateSha === 'string' && SHA_40.test(candidateSha),
    'Phase 1 summary requires exact candidate_sha with 40 lowercase hex',
  );

  return Object.freeze({ phase1CandidateSha: candidateSha });
}

export function parsePhase2HandoffSummary(text) {
  const fields = parseFrontmatter(text, 'Phase 2 summary');

  for (const key of fields.keys()) {
    invariant(
      !looksLikePhase2CandidateShaAlias(key),
      `Phase 2 summary uses forbidden candidate SHA alias ${key}`,
    );
  }

  invariant(
    fields.get('status') === 'PASS',
    'Phase 2 summary status must be exact PASS',
  );
  const candidateSha = fields.get('phase2_candidate_sha');
  invariant(
    typeof candidateSha === 'string' && SHA_40.test(candidateSha),
    'Phase 2 summary requires exact phase2_candidate_sha',
  );
  const featureFlag = fields.get('feature_flag');
  invariant(
    featureFlag === 'true',
    'Phase 2 summary feature_flag must be intrinsically true',
  );

  return Object.freeze({
    phase2CandidateSha: candidateSha,
    featureFlag: true,
  });
}

function skipWhitespace(text, start) {
  let index = start;
  while (index < text.length && /\s/.test(text[index])) {
    index += 1;
  }
  return index;
}

function readJsonString(text, start) {
  invariant(text[start] === '"', 'JSON object key must be a string');
  let index = start + 1;

  while (index < text.length) {
    if (text[index] === '\\') {
      index += 2;
      continue;
    }
    if (text[index] === '"') {
      const token = text.slice(start, index + 1);
      return {
        value: JSON.parse(token),
        end: index + 1,
      };
    }
    index += 1;
  }

  throw new Error('JSON string is unterminated');
}

function skipJsonValue(text, start) {
  let index = skipWhitespace(text, start);
  if (text[index] === '"') {
    return readJsonString(text, index).end;
  }

  if (text[index] === '{' || text[index] === '[') {
    const opening = text[index];
    const closing = opening === '{' ? '}' : ']';
    let depth = 0;

    while (index < text.length) {
      const character = text[index];
      if (character === '"') {
        index = readJsonString(text, index).end;
        continue;
      }
      if (character === opening) {
        depth += 1;
      } else if (character === closing) {
        depth -= 1;
        if (depth === 0) {
          return index + 1;
        }
      }
      index += 1;
    }

    throw new Error('JSON value is unterminated');
  }

  while (
    index < text.length &&
    text[index] !== ',' &&
    text[index] !== '}'
  ) {
    index += 1;
  }
  return index;
}

function topLevelJsonKeys(text) {
  let index = skipWhitespace(text, 0);
  invariant(text[index] === '{', 'record JSON must be an object');
  index += 1;
  const keys = [];

  while (index < text.length) {
    index = skipWhitespace(text, index);
    if (text[index] === '}') {
      return keys;
    }

    const keyToken = readJsonString(text, index);
    keys.push(keyToken.value);
    index = skipWhitespace(text, keyToken.end);
    invariant(text[index] === ':', 'record JSON key must have a value');
    index = skipJsonValue(text, index + 1);
    index = skipWhitespace(text, index);

    if (text[index] === ',') {
      index += 1;
      continue;
    }
    invariant(text[index] === '}', 'record JSON must be a flat object');
    return keys;
  }

  throw new Error('record JSON is incomplete');
}

function parseExactJsonRecord(text, expectedKeys, label) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} is invalid JSON: ${errorOutput(error)}`);
  }

  invariant(
    typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed) &&
      Object.getPrototypeOf(parsed) === Object.prototype,
    `${label} must be one JSON object`,
  );

  const textualKeys = topLevelJsonKeys(text);
  invariant(
    textualKeys.length === new Set(textualKeys).size,
    `${label} contains duplicate JSON keys`,
  );

  const actualKeys = Object.keys(parsed);
  invariant(
    actualKeys.length === expectedKeys.length &&
      expectedKeys.every((key) => actualKeys.includes(key)),
    `${label} must contain only exact keys: ${expectedKeys.join(', ')}`,
  );
  invariant(
    textualKeys.length === actualKeys.length,
    `${label} contains ambiguous JSON keys`,
  );

  return parsed;
}

export function parsePhase3CandidateRecord(text) {
  const record = parseExactJsonRecord(
    text,
    CANDIDATE_RECORD_KEYS,
    'Phase 3 candidate record',
  );

  invariant(
    typeof record.phase3_candidate_sha === 'string' &&
      SHA_40.test(record.phase3_candidate_sha),
    'Phase 3 candidate record has invalid phase3_candidate_sha',
  );
  invariant(
    record.ancestry_status === 'PASS',
    'Phase 3 candidate ancestry_status must be PASS',
  );
  invariant(
    record.clean_status === 'PASS',
    'Phase 3 candidate clean_status must be PASS',
  );
  invariant(
    typeof record.validation_evidence_sha256 === 'string' &&
      SHA_256.test(record.validation_evidence_sha256),
    'Phase 3 candidate validation_evidence_sha256 is invalid',
  );

  return Object.freeze(record);
}

function parseReviewRecord(text, role) {
  const isCode = role === 'code';
  const prefix = isCode ? 'code_security' : 'ui_accessibility';
  const label = isCode
    ? 'code/security review record'
    : 'UI/accessibility review record';
  const record = parseExactJsonRecord(text, REVIEW_FIELDS[role], label);

  invariant(
    typeof record[`${prefix}_sha`] === 'string' &&
      SHA_40.test(record[`${prefix}_sha`]),
    `${label} has invalid ${prefix}_sha`,
  );
  invariant(
    record[`${prefix}_status`] === 'PASS',
    `${label} status must be PASS`,
  );
  invariant(
    record[`${prefix}_verdict`] === 'PASS',
    `${label} verdict must be PASS`,
  );

  for (const suffix of ['reviewer_id', 'session_id']) {
    const value = record[`${prefix}_${suffix}`];
    invariant(
      typeof value === 'string' &&
        value.trim().length > 0 &&
        value === value.trim(),
      `${label} ${suffix} must be a nonempty exact string`,
    );
  }

  invariant(
    record[`${prefix}_fork_turns`] === 'none',
    `${label} fork_turns must be none`,
  );
  invariant(
    record[`${prefix}_fresh_context`] === true,
    `${label} fresh_context must be true`,
  );
  invariant(
    typeof record[`${prefix}_evidence_sha256`] === 'string' &&
      SHA_256.test(record[`${prefix}_evidence_sha256`]),
    `${label} evidence SHA-256 is invalid`,
  );

  return Object.freeze(record);
}

export function parseCodeSecurityReviewRecord(text) {
  return parseReviewRecord(text, 'code');
}

export function parseUiAccessibilityReviewRecord(text) {
  return parseReviewRecord(text, 'ui');
}

function comparablePath(path) {
  return process.platform === 'win32' ? path.toLowerCase() : path;
}

export function isPathWithinResolvedRoot(rootRealPath, candidateRealPath) {
  const root = comparablePath(resolve(rootRealPath));
  const candidate = comparablePath(resolve(candidateRealPath));
  const pathFromRoot = relative(root, candidate);

  return (
    pathFromRoot.length > 0 &&
    pathFromRoot !== '..' &&
    !pathFromRoot.startsWith(`..${sep}`) &&
    !isAbsolute(pathFromRoot)
  );
}

function sameResolvedPath(left, right) {
  return comparablePath(resolve(left)) === comparablePath(resolve(right));
}

function realPath(path, label, expectedKind) {
  invariant(
    typeof path === 'string' && path.trim().length > 0,
    `${label} is required`,
  );
  invariant(isAbsolute(path), `${label} must be absolute`);

  let resolvedPath;
  try {
    resolvedPath = realpathSync.native(path);
  } catch (error) {
    throw new Error(`${label} realpath failed: ${errorOutput(error)}`);
  }

  let stats;
  try {
    stats = statSync(resolvedPath);
  } catch (error) {
    throw new Error(`${label} stat failed: ${errorOutput(error)}`);
  }

  invariant(
    expectedKind === 'directory' ? stats.isDirectory() : stats.isFile(),
    `${label} must be an existing ${expectedKind}`,
  );
  return resolvedPath;
}

function resolveCandidateEvidencePaths(options, checkoutRoot) {
  const root = realPath(
    options.evidenceRoot,
    'BABYORA_PHASE3_EVIDENCE_ROOT',
    'directory',
  );
  const checkout = realPath(checkoutRoot, 'candidate checkout', 'directory');

  invariant(
    !sameResolvedPath(root, checkout) &&
      !isPathWithinResolvedRoot(checkout, root) &&
      !isPathWithinResolvedRoot(root, checkout),
    'BABYORA_PHASE3_EVIDENCE_ROOT must resolve outside the candidate checkout',
  );

  const entries = [
    ['candidateRecordPath', 'candidate record'],
    ['codeReviewPath', 'code/security review'],
    ['uiReviewPath', 'UI/accessibility review'],
    ['validationBundlePath', 'validation bundle'],
  ];
  const resolvedEntries = {};

  for (const [key, label] of entries) {
    const resolvedPath = realPath(options[key], label, 'file');
    invariant(
      isPathWithinResolvedRoot(root, resolvedPath),
      `${label} must resolve beneath the external evidence root`,
    );
    resolvedEntries[key] = resolvedPath;
  }

  const uniquePaths = new Set(
    Object.values(resolvedEntries).map(comparablePath),
  );
  invariant(
    uniquePaths.size === entries.length,
    'candidate, reviews, and validation bundle must be distinct files',
  );

  return Object.freeze({
    evidenceRoot: root,
    checkoutRoot: checkout,
    ...resolvedEntries,
  });
}

function parseOptions(args, definitions) {
  const values = {};
  for (const [name, definition] of Object.entries(definitions)) {
    values[name] = definition.repeatable ? [] : undefined;
  }

  for (let index = 0; index < args.length; index += 2) {
    const option = args[index];
    const value = args[index + 1];
    invariant(
      typeof option === 'string' && option.startsWith('--'),
      `unexpected positional argument ${String(option)}`,
    );
    const name = option.slice(2);
    const definition = definitions[name];
    invariant(definition !== undefined, `unknown option ${option}`);
    invariant(
      typeof value === 'string' && value.length > 0,
      `${option} requires one value`,
    );

    if (definition.repeatable) {
      values[name].push(value);
    } else {
      invariant(values[name] === undefined, `duplicate option ${option}`);
      values[name] = value;
    }
  }

  for (const [name, definition] of Object.entries(definitions)) {
    if (definition.required) {
      invariant(
        definition.repeatable
          ? values[name].length > 0
          : values[name] !== undefined,
        `--${name} is required`,
      );
    }
  }

  return values;
}

function parseCandidateOptions(args, environment) {
  const values = parseOptions(args, {
    'candidate-record': { required: true },
    'code-security-review': { required: true },
    'ui-accessibility-review': { required: true },
    'validation-bundle': { required: true },
    'phase1-summary': { required: true },
    dependency: { repeatable: true },
    'expected-dependency-count': { required: true },
  });

  const expectedCountText = values['expected-dependency-count'];
  invariant(
    /^[1-9][0-9]*$/.test(expectedCountText),
    'expected dependency count must be a positive integer',
  );
  const expectedDependencyCount = Number(expectedCountText);
  invariant(
    expectedDependencyCount <= MAX_DEPENDENCIES,
    `expected dependency count exceeds ${MAX_DEPENDENCIES}`,
  );

  const evidenceRoot = environment.BABYORA_PHASE3_EVIDENCE_ROOT;
  invariant(
    typeof evidenceRoot === 'string' && evidenceRoot.trim().length > 0,
    'BABYORA_PHASE3_EVIDENCE_ROOT is required and cannot be empty',
  );
  invariant(
    isAbsolute(evidenceRoot),
    'BABYORA_PHASE3_EVIDENCE_ROOT must be absolute',
  );

  return Object.freeze({
    evidenceRoot,
    candidateRecordPath: values['candidate-record'],
    codeReviewPath: values['code-security-review'],
    uiReviewPath: values['ui-accessibility-review'],
    validationBundlePath: values['validation-bundle'],
    phase1SummaryPath: values['phase1-summary'],
    dependencies: Object.freeze([...values.dependency]),
    expectedDependencyCount,
  });
}

function parsePhase2Options(args) {
  const values = parseOptions(args, {
    summary: { required: true },
    'expected-feature-flag': { required: true },
    'ancestor-of': { required: true },
  });
  invariant(
    values['expected-feature-flag'] === 'true',
    '--expected-feature-flag must be intrinsically true',
  );

  return Object.freeze({
    summaryPath: values.summary,
    expectedFeatureFlag: true,
    ancestorOf: values['ancestor-of'],
  });
}

function fileSha256(path) {
  try {
    return createHash('sha256').update(readFileSync(path)).digest('hex');
  } catch (error) {
    throw new Error(
      `validation bundle SHA-256 failed: ${errorOutput(error)}`,
    );
  }
}

function validateReviewAgreement(candidate, codeReview, uiReview, evidenceHash) {
  invariant(
    codeReview.code_security_sha === candidate.phase3_candidate_sha,
    'code/security review SHA must equal the Phase 3 candidate',
  );
  invariant(
    uiReview.ui_accessibility_sha === candidate.phase3_candidate_sha,
    'UI/accessibility review SHA must equal the Phase 3 candidate',
  );
  invariant(
    codeReview.code_security_reviewer_id !==
      uiReview.ui_accessibility_reviewer_id,
    'reviewer IDs must be distinct',
  );
  invariant(
    codeReview.code_security_session_id !==
      uiReview.ui_accessibility_session_id,
    'reviewer session IDs must be distinct',
  );

  for (const [label, recordedHash] of [
    ['candidate', candidate.validation_evidence_sha256],
    ['code/security review', codeReview.code_security_evidence_sha256],
    ['UI/accessibility review', uiReview.ui_accessibility_evidence_sha256],
  ]) {
    invariant(
      recordedHash === evidenceHash,
      `${label} evidence SHA-256 must equal the external validation bundle`,
    );
  }
}

function validateDependencies(
  cwd,
  candidateSha,
  phase1CandidateSha,
  dependencies,
  expectedDependencyCount,
) {
  const allDependencies = [phase1CandidateSha, ...dependencies];
  invariant(
    allDependencies.length === expectedDependencyCount,
    `dependency count mismatch: expected ${expectedDependencyCount}, received ${allDependencies.length}`,
  );

  const seen = new Set();
  for (const dependency of allDependencies) {
    invariant(
      SHA_40.test(dependency),
      `dependency must be 40 lowercase hex: ${dependency}`,
    );
    invariant(
      !seen.has(dependency),
      `duplicate dependency SHA: ${dependency}`,
    );
    invariant(
      dependency !== candidateSha,
      'candidate SHA cannot be declared as its own dependency',
    );
    seen.add(dependency);

    runGit(
      cwd,
      ['cat-file', '-e', `${dependency}^{commit}`],
      `dependency object check for ${dependency}`,
    );
    runGit(
      cwd,
      ['merge-base', '--is-ancestor', dependency, candidateSha],
      `dependency ancestor check for ${dependency}`,
    );
  }

  return allDependencies.length;
}

function verifyCandidate(args, environment, cwd) {
  const options = parseCandidateOptions(args, environment);
  const checkoutFromGit = runGit(
    cwd,
    ['rev-parse', '--show-toplevel'],
    'checkout discovery',
  );
  const paths = resolveCandidateEvidencePaths(options, checkoutFromGit);
  const phase1SummaryPath = realPath(
    isAbsolute(options.phase1SummaryPath)
      ? options.phase1SummaryPath
      : resolve(cwd, options.phase1SummaryPath),
    'Phase 1 summary',
    'file',
  );

  const candidate = parsePhase3CandidateRecord(
    readUtf8(paths.candidateRecordPath, 'candidate record'),
  );
  const codeReview = parseCodeSecurityReviewRecord(
    readUtf8(paths.codeReviewPath, 'code/security review'),
  );
  const uiReview = parseUiAccessibilityReviewRecord(
    readUtf8(paths.uiReviewPath, 'UI/accessibility review'),
  );
  const { phase1CandidateSha } = parsePhase1CandidateSummary(
    readUtf8(phase1SummaryPath, 'Phase 1 summary'),
  );
  const evidenceHash = fileSha256(paths.validationBundlePath);

  validateReviewAgreement(candidate, codeReview, uiReview, evidenceHash);

  const headSha = runGit(
    paths.checkoutRoot,
    ['rev-parse', '--verify', 'HEAD^{commit}'],
    'HEAD resolution',
  );
  invariant(
    headSha === candidate.phase3_candidate_sha,
    'detached HEAD must equal the labeled Phase 3 candidate directly',
  );
  const headName = runGit(
    paths.checkoutRoot,
    ['rev-parse', '--abbrev-ref', 'HEAD'],
    'detached HEAD check',
  );
  invariant(headName === 'HEAD', 'candidate checkout must use detached HEAD');

  const porcelain = runGit(
    paths.checkoutRoot,
    ['status', '--porcelain=v1', '--untracked-files=all'],
    'porcelain clean check',
  );
  invariant(
    porcelain.length === 0,
    'candidate checkout must have empty porcelain status and be clean',
  );

  runGit(
    paths.checkoutRoot,
    ['diff-tree', '--check', '--root', '-r', headSha],
    'diff-tree --check',
  );

  const dependencyCount = validateDependencies(
    paths.checkoutRoot,
    headSha,
    phase1CandidateSha,
    options.dependencies,
    options.expectedDependencyCount,
  );

  return Object.freeze({
    status: 'PASS',
    mode: 'candidate',
    phase3CandidateSha: headSha,
    phase1CandidateSha,
    dependencyCount,
    validationEvidenceSha256: evidenceHash,
  });
}

function verifyPhase2Handoff(args, cwd) {
  const options = parsePhase2Options(args);
  const summaryPath = realPath(
    isAbsolute(options.summaryPath)
      ? options.summaryPath
      : resolve(cwd, options.summaryPath),
    'Phase 2 summary',
    'file',
  );
  const handoff = parsePhase2HandoffSummary(
    readUtf8(summaryPath, 'Phase 2 summary'),
  );
  invariant(
    handoff.featureFlag === options.expectedFeatureFlag,
    'Phase 2 feature_flag does not equal the expected value',
  );

  runGit(
    cwd,
    ['cat-file', '-e', `${handoff.phase2CandidateSha}^{commit}`],
    'Phase 2 candidate object check',
  );
  const ancestorOf = runGit(
    cwd,
    [
      'rev-parse',
      '--verify',
      '--end-of-options',
      `${options.ancestorOf}^{commit}`,
    ],
    'Phase 2 ancestor target resolution',
  );
  runGit(
    cwd,
    ['merge-base', '--is-ancestor', handoff.phase2CandidateSha, ancestorOf],
    'Phase 2 candidate ancestor check',
  );

  return Object.freeze({
    status: 'PASS',
    mode: 'phase2-handoff',
    phase2CandidateSha: handoff.phase2CandidateSha,
    featureFlag: handoff.featureFlag,
    ancestorOf,
  });
}

export function runPhase3ExactShaVerifier(
  argv,
  {
    environment = process.env,
    cwd = process.cwd(),
  } = {},
) {
  invariant(Array.isArray(argv) && argv.length > 0, 'verification mode is required');
  const [mode, ...args] = argv;

  if (mode === 'candidate') {
    return verifyCandidate(args, environment, cwd);
  }
  if (mode === 'phase2-handoff') {
    return verifyPhase2Handoff(args, cwd);
  }
  throw new Error(`unknown verification mode ${String(mode)}`);
}

function isMainModule() {
  if (process.argv[1] === undefined) {
    return false;
  }

  let invokedPath;
  let loadedModulePath;
  try {
    invokedPath = realpathSync.native(resolve(process.argv[1]));
    loadedModulePath = realpathSync.native(fileURLToPath(import.meta.url));
  } catch (error) {
    throw new Error(
      `main-module canonical path resolution failed: ${errorOutput(error)}`,
    );
  }

  return sameResolvedPath(invokedPath, loadedModulePath);
}

if (isMainModule()) {
  try {
    const result = runPhase3ExactShaVerifier(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stderr.write(
      `Phase 3 exact-SHA verification failed: ${errorOutput(error)}\n`,
    );
    process.exitCode = 1;
  }
}
