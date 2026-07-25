import { spawnSync } from 'node:child_process';
import { realpathSync, statSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const LOWER_SHA = /^[0-9a-f]{40}$/u;
const ENVIRONMENT_KEYS = Object.freeze([
  'PHASE2_CANDIDATE_SHA',
  'PHASE2_CANDIDATE_RECORD',
  'PHASE2_REVIEW_A',
  'PHASE2_REVIEW_B',
] as const);

function fail(message: string): never {
  throw new Error(`Phase 2 evidence launcher failed: ${message}`);
}

function requiredEnvironment(
  environment: NodeJS.ProcessEnv,
): Readonly<Record<(typeof ENVIRONMENT_KEYS)[number], string>> {
  const result = {} as Record<(typeof ENVIRONMENT_KEYS)[number], string>;
  for (const key of ENVIRONMENT_KEYS) {
    const value = environment[key];
    if (value === undefined || value === '' || value.includes('\0')) {
      fail(`${key} is required`);
    }
    result[key] = value;
  }
  return result;
}

function externalFile(value: string, label: string): string {
  if (!isAbsolute(value)) fail(`${label} must be an absolute path`);
  let canonical: string;
  try {
    canonical = realpathSync.native(value);
  } catch {
    fail(`${label} must be an existing real path`);
  }
  if (!statSync(canonical).isFile()) fail(`${label} must be a regular file`);
  return canonical;
}

export function buildPhase2EvidenceInvocation(
  environment: NodeJS.ProcessEnv = process.env,
): Readonly<{
  executable: string;
  arguments: readonly string[];
  verifier: string;
}> {
  const values = requiredEnvironment(environment);
  if (!LOWER_SHA.test(values.PHASE2_CANDIDATE_SHA)) {
    fail('PHASE2_CANDIDATE_SHA must be 40 lowercase hex');
  }
  const record = externalFile(
    values.PHASE2_CANDIDATE_RECORD,
    'PHASE2_CANDIDATE_RECORD',
  );
  const reviewA = externalFile(values.PHASE2_REVIEW_A, 'PHASE2_REVIEW_A');
  const reviewB = externalFile(values.PHASE2_REVIEW_B, 'PHASE2_REVIEW_B');
  const verifier = realpathSync.native(
    resolve(
      fileURLToPath(new URL('.', import.meta.url)),
      'verify-phase2-evidence.ts',
    ),
  );
  return Object.freeze({
    executable: process.execPath,
    verifier,
    arguments: Object.freeze([
      verifier,
      '--candidate',
      values.PHASE2_CANDIDATE_SHA,
      '--candidate-record',
      record,
      '--review-a',
      reviewA,
      '--review-b',
      reviewB,
    ]),
  });
}

export function runPhase2Evidence(
  environment: NodeJS.ProcessEnv = process.env,
): void {
  const invocation = buildPhase2EvidenceInvocation(environment);
  const result = spawnSync(
    invocation.executable,
    invocation.arguments,
    {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: false,
      windowsHide: true,
    },
  );
  if (result.error !== undefined) {
    fail(`verifier could not start: ${result.error.message}`);
  }
  if (result.signal !== null) {
    fail(`verifier terminated by ${result.signal}`);
  }
  if (result.status !== 0) {
    fail(`verifier exited ${String(result.status)}`);
  }
}

const invoked = process.argv[1];
if (
  invoked !== undefined &&
  pathToFileURL(resolve(invoked)).href === import.meta.url
) {
  try {
    runPhase2Evidence();
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  }
}
