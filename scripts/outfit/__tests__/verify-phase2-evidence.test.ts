import { execFileSync, spawnSync } from 'node:child_process';
import {
  appendFileSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  buildPhase2EvidenceInvocation,
} from '../run-phase2-evidence.js';
import { verifyPhase2Evidence } from '../verify-phase2-evidence.js';

const BASE = 'd8fbb3cfbe31d5ec065c4a30a12d64bc19f4dc2f';
const PHASE1 = '5cf7df85014fa51096b06a7e381926ebb4601798';
const CONTRACT =
  'f223636699eb0b654ad29ab08b407237db6e5ee224aeb8f0720e4c80a0f05033';
const PACK =
  'e222950d15e49a98e5aeb65516219f6a4adda5a618e6ad1ae98ad6193136457b';
const DEPENDENCIES = [
  '5f2217eb46ea64a33bfafe24c588c434cd30a0f3',
  'ac20e97e106aa0953d70f38ec5427d5a6af9e3d5',
  'be3e82e7e14428b97f1181da578b7f60b89fbd4f',
  '3e01127a198427bd762113bcc7b1da4cd55b937d',
  'ac9e78311b01f8b2d52f10c33600a80d7d996366',
  '947be06ff2615482572567b4066ae0832f5d8dee',
  '05b4b503ce162b49c94d6fe95ae0a2d429a92160',
  'f1688a5799af2806b790ece790d9630438625b14',
] as const;

const sourceRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../..',
);
const originalCwd = process.cwd();
let temporaryRoot = '';
let repo = '';
let evidenceRoot = '';
let preActivationSha = '';
let candidateSha = '';
let candidateRecordPath = '';
let reviewAPath = '';
let reviewBPath = '';

function git(
  cwd: string,
  arguments_: readonly string[],
  environment: NodeJS.ProcessEnv = process.env,
): string {
  return execFileSync('git', [...arguments_], {
    cwd,
    env: environment,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function commit(cwd: string, message: string, timestamp: string): string {
  git(cwd, ['add', '-A']);
  git(cwd, ['commit', '-m', message], {
    ...process.env,
    GIT_AUTHOR_DATE: timestamp,
    GIT_COMMITTER_DATE: timestamp,
  });
  return git(cwd, ['rev-parse', 'HEAD']);
}

function frontmatter(values: Readonly<Record<string, string>>): string {
  return `---\n${Object.entries(values)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')}\n---\n`;
}

function recordValues(
  candidate = candidateSha,
  preActivation = preActivationSha,
): Record<string, string> {
  const values: Record<string, string> = {
    status: 'PASS',
    phase2_candidate_sha: candidate,
    recorded_at: new Date().toISOString(),
    pre_activation_sha: preActivation,
    pre_activation_parent_of_candidate: 'true',
    pre_activation_feature_flag: 'false',
    pre_activation_status_clean: 'true',
    phase1_source_field: 'candidate_sha',
    phase1_candidate_sha: PHASE1,
    contract_sha256: CONTRACT,
    pack_sha256: PACK,
    scope_attestation: 'amended-12-paths-only',
    scope_file_count: '12',
    inventory_script_blob: 'd4af276900bdfbdde9a27a00f5620e49c294c41a',
    inventory_test_blob: '5c6a3db2adbbcddcaae956b56d17650e0110cb57',
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
    pre_activation_inventory_command:
      'npx tsx scripts/outfit/inventory-v1.ts --assert',
    pre_activation_inventory_exit: '0',
    pre_activation_focused_tests_command:
      'npx vitest run PaakledningScreen.outfit-truth.test.tsx OutfitTruthPanel.test.tsx OutfitExperience.test.tsx',
    pre_activation_focused_tests_exit: '0',
    pre_activation_build_command: 'npm run build',
    pre_activation_build_exit: '0',
    pre_activation_lint_command: 'npm run lint',
    pre_activation_lint_exit: '0',
    pre_activation_exact_context_command:
      'npx tsx e2e/planlegg.ts --case exact-context',
    pre_activation_exact_context_exit: '0',
    pre_activation_automatic_location_command:
      'npx tsx e2e/planlegg.ts --case automatic-location',
    pre_activation_automatic_location_exit: '0',
    pre_activation_component_matrix_command:
      'npx tsx e2e/outfit-truth.ts --case component-matrix',
    pre_activation_component_matrix_exit: '0',
    pre_activation_production_app_routes_command:
      'npx tsx e2e/outfit-truth.ts --case production-app-routes',
    pre_activation_production_app_routes_exit: '0',
  };
  DEPENDENCIES.forEach((sha, index) => {
    values[`dependency_02_${String(index + 1).padStart(2, '0')}_sha`] = sha;
  });
  return values;
}

function reviewValues(
  reviewerId: string,
  sessionId: string,
  candidate = candidateSha,
): Record<string, string> {
  return {
    status: 'PASS',
    phase2_candidate_sha: candidate,
    reviewer_id: reviewerId,
    session_id: sessionId,
    capability: 'high-verification',
    fresh_context: 'true',
    verdict: 'PASS',
    unresolved_p0: '0',
    unresolved_p1: '0',
    unresolved_severe_findings: '0',
    reviewed_at: new Date().toISOString(),
  };
}

function argv(
  candidate = candidateSha,
  record = candidateRecordPath,
  reviewA = reviewAPath,
  reviewB = reviewBPath,
): string[] {
  return [
    '--candidate',
    candidate,
    '--candidate-record',
    record,
    '--review-a',
    reviewA,
    '--review-b',
    reviewB,
  ];
}

function writeEvidence(
  record: Readonly<Record<string, string>> = recordValues(),
  reviewA: Readonly<Record<string, string>> = reviewValues(
    'reviewer-a',
    'session-a',
  ),
  reviewB: Readonly<Record<string, string>> = reviewValues(
    'reviewer-b',
    'session-b',
  ),
): void {
  writeFileSync(candidateRecordPath, frontmatter(record), 'utf8');
  writeFileSync(reviewAPath, frontmatter(reviewA), 'utf8');
  writeFileSync(reviewBPath, frontmatter(reviewB), 'utf8');
}

function expectFailure(
  expected: RegExp,
  arguments_: readonly string[] = argv(),
): void {
  process.chdir(repo);
  expect(() => verifyPhase2Evidence(arguments_)).toThrow(expected);
}

function appendOwned(path: string, text: string): void {
  appendFileSync(join(repo, path), `\n${text}\n`, 'utf8');
}

function activateVariant(
  label: string,
  mutatePreActivation: (() => void) | undefined,
  flagSource: string,
  expected: RegExp,
  mutateActivation?: () => void,
): void {
  git(repo, ['checkout', '--detach', preActivationSha]);
  let parent = preActivationSha;
  if (mutatePreActivation !== undefined) {
    mutatePreActivation();
    parent = commit(
      repo,
      `test: ${label} pre-activation`,
      new Date(Date.now() - 90_000).toISOString(),
    );
  }
  writeFileSync(
    join(repo, 'src/lib/outfit/feature-flags.ts'),
    flagSource,
    'utf8',
  );
  appendOwned(
    'src/components/outfit/__tests__/OutfitTruthPanel.test.tsx',
    `// ${label} activation.`,
  );
  mutateActivation?.();
  const variant = commit(
    repo,
    `test: ${label} activation`,
    new Date(Date.now() - 60_000).toISOString(),
  );
  git(repo, ['checkout', '--detach', variant]);
  writeEvidence(
    recordValues(variant, parent),
    reviewValues('reviewer-a', 'session-a', variant),
    reviewValues('reviewer-b', 'session-b', variant),
  );
  try {
    expectFailure(expected, argv(variant));
  } finally {
    git(repo, ['checkout', '--detach', candidateSha]);
    writeEvidence();
  }
}

beforeAll(() => {
  temporaryRoot = mkdtempSync(join(tmpdir(), 'phase2 evidence verifier '));
  repo = join(temporaryRoot, 'candidate repo [safe]');
  evidenceRoot = join(temporaryRoot, 'evidence space & safe');
  mkdirSync(evidenceRoot, { recursive: true });
  git(temporaryRoot, [
    'clone',
    '--shared',
    '--no-checkout',
    sourceRoot,
    repo,
  ]);
  git(repo, ['config', 'user.email', 'phase2-fixture@example.invalid']);
  git(repo, ['config', 'user.name', 'Phase 2 Fixture']);
  git(repo, ['checkout', '--detach', BASE]);
  symlinkSync(
    resolve(sourceRoot, 'node_modules'),
    join(repo, 'node_modules'),
    'junction',
  );

  const created: Record<string, string> = {
    'e2e/fixtures/outfit-truth.html': '<main id="root"></main>',
    'e2e/fixtures/outfit-truth.tsx': 'export const fixture = true;',
    'e2e/outfit-truth.ts': 'export const noMediaEvidence = true;',
    'src/screens/__tests__/PaakledningScreen.outfit-truth.test.tsx':
      'export const integrationContract = true;',
  };
  for (const [path, content] of Object.entries(created)) {
    mkdirSync(dirname(join(repo, path)), { recursive: true });
    writeFileSync(join(repo, path), `${content}\n`, 'utf8');
  }
  appendOwned('src/App.tsx', '// Phase 2 fixture App propagation.');
  appendOwned(
    'src/screens/PaakledningScreen.tsx',
    "// Phase 2 fixture production integration.\nimport { OUTFIT_TRUTH_V1_AVAILABLE } from '../lib/outfit/feature-flags.js';\nvoid (OUTFIT_TRUTH_V1_AVAILABLE && true);",
  );
  for (const path of [
    'scripts/outfit/verify-phase2-evidence.ts',
    'scripts/outfit/run-phase2-evidence.ts',
    'scripts/outfit/__tests__/verify-phase2-evidence.test.ts',
    'src/lib/planning/__tests__/planned-outfit-resolver.test.ts',
    '.planning/phases/02-outfit-truth-antrekkskart/02-09-PREACTIVATION-TEST-AMENDMENT.md',
  ]) {
    mkdirSync(dirname(join(repo, path)), { recursive: true });
    copyFileSync(join(sourceRoot, path), join(repo, path));
  }
  preActivationSha = commit(
    repo,
    'test: pre-activation candidate',
    new Date(Date.now() - 180_000).toISOString(),
  );

  writeFileSync(
    join(repo, 'src/lib/outfit/feature-flags.ts'),
    'export const OUTFIT_TRUTH_V1_AVAILABLE = true as const;\n',
    'utf8',
  );
  appendOwned(
    'src/components/outfit/__tests__/OutfitTruthPanel.test.tsx',
    '// Phase 2 fixture activation assertion.',
  );
  candidateSha = commit(
    repo,
    'test: activate Phase 2',
    new Date(Date.now() - 120_000).toISOString(),
  );
  git(repo, ['checkout', '--detach', candidateSha]);

  candidateRecordPath = join(evidenceRoot, 'candidate record [v1].md');
  reviewAPath = join(evidenceRoot, 'review A & semantic.md');
  reviewBPath = join(evidenceRoot, 'review B (a11y).md');
  writeEvidence();
  process.chdir(repo);
}, 120_000);

afterAll(() => {
  process.chdir(originalCwd);
  rmSync(temporaryRoot, { recursive: true, force: true });
});

describe('Phase 2 evidence verifier argument boundary', () => {
  const cases = [
    [],
    ['--candidate=abc'],
    ['--unknown', 'value'],
    ['--candidate', 'a'.repeat(40), '--candidate', 'b'.repeat(40)],
    [
      '--candidate',
      'a'.repeat(40),
      '--candidate-record',
      candidateRecordPath,
      '--review-a',
      reviewAPath,
    ],
    [...argv(), '--inventory', join(repo, 'scripts/outfit/inventory-v1.ts')],
  ].map((arguments_) => [arguments_] as [readonly string[]]);
  it.each(cases)('rejects ambiguous/nonlocal argv %j', (arguments_) => {
    expect(() => verifyPhase2Evidence(arguments_)).toThrow();
  });
});

describe('path-safe launcher', () => {
  it('requires all four exact environment values', () => {
    expect(() => buildPhase2EvidenceInvocation({})).toThrow(
      /PHASE2_CANDIDATE_SHA is required/u,
    );
  });

  it('rejects short, uppercase and nonhex candidates', () => {
    for (const candidate of ['abc', 'A'.repeat(40), 'g'.repeat(40)]) {
      expect(() =>
        buildPhase2EvidenceInvocation({
          PHASE2_CANDIDATE_SHA: candidate,
          PHASE2_CANDIDATE_RECORD: candidateRecordPath,
          PHASE2_REVIEW_A: reviewAPath,
          PHASE2_REVIEW_B: reviewBPath,
        }),
      ).toThrow(/40 lowercase hex/u);
    }
  });

  it('rejects relative and missing evidence paths', () => {
    expect(() =>
      buildPhase2EvidenceInvocation({
        PHASE2_CANDIDATE_SHA: candidateSha,
        PHASE2_CANDIDATE_RECORD: 'relative record.md',
        PHASE2_REVIEW_A: reviewAPath,
        PHASE2_REVIEW_B: reviewBPath,
      }),
    ).toThrow(/absolute path/u);
    expect(() =>
      buildPhase2EvidenceInvocation({
        PHASE2_CANDIDATE_SHA: candidateSha,
        PHASE2_CANDIDATE_RECORD: join(evidenceRoot, 'missing.md'),
        PHASE2_REVIEW_A: reviewAPath,
        PHASE2_REVIEW_B: reviewBPath,
      }),
    ).toThrow(/existing real path/u);
  });

  it('preserves spaced/metacharacter paths as direct Node arguments', () => {
    const invocation = buildPhase2EvidenceInvocation({
      PHASE2_CANDIDATE_SHA: candidateSha,
      PHASE2_CANDIDATE_RECORD: candidateRecordPath,
      PHASE2_REVIEW_A: reviewAPath,
      PHASE2_REVIEW_B: reviewBPath,
    });
    expect(invocation.executable).toBe(process.execPath);
    expect(invocation.arguments).toEqual([
      invocation.verifier,
      '--candidate',
      candidateSha,
      '--candidate-record',
      candidateRecordPath,
      '--review-a',
      reviewAPath,
      '--review-b',
      reviewBPath,
    ]);
  });
});

describe('repository and external-path fail-fast gates', () => {
  it('rejects attached HEAD', () => {
    git(repo, ['switch', '-c', 'attached-fixture']);
    expectFailure(/detached HEAD/u);
    git(repo, ['checkout', '--detach', candidateSha]);
  });

  it('rejects the wrong exact HEAD', () => {
    git(repo, ['checkout', '--detach', preActivationSha]);
    expectFailure(/HEAD does not equal/u);
    git(repo, ['checkout', '--detach', candidateSha]);
  });

  it('rejects dirty tracked and untracked bytes', () => {
    const appPath = join(repo, 'src/App.tsx');
    const original = readFileSync(appPath, 'utf8');
    appendFileSync(appPath, '\n// dirty\n', 'utf8');
    expectFailure(/status is not byte-empty/u);
    writeFileSync(appPath, original, 'utf8');
    const untracked = join(repo, 'untracked evidence.txt');
    writeFileSync(untracked, 'dirty', 'utf8');
    expectFailure(/status is not byte-empty/u);
    rmSync(untracked);
  });

  it('rejects relative, missing and inside-worktree evidence', () => {
    expectFailure(/absolute path/u, argv(candidateSha, 'relative.md'));
    expectFailure(
      /existing real path/u,
      argv(candidateSha, join(evidenceRoot, 'missing.md')),
    );
    expectFailure(
      /outside the candidate worktree/u,
      argv(candidateSha, join(repo, 'package.json')),
    );
  });
});

describe('strict raw candidate frontmatter', () => {
  const mutations: ReadonlyArray<readonly [string, (text: string) => string, RegExp]> = [
    ['duplicate', (text) => text.replace('status: PASS', 'status: PASS\nstatus: PASS'), /duplicate field status/u],
    ['camelCase', (text) => text.replace('phase1_candidate_sha:', 'phase1CandidateSha:'), /plain snake_case/u],
    ['mixed alias', (text) => text.replace('phase1_candidate_sha:', 'candidate_sha:'), /unknown or aliased/u],
    ['nested', (text) => text.replace('contract_sha256:', '  contract_sha256:'), /nested or indented/u],
    ['multiline', (text) => text.replace(`pack_sha256: ${PACK}`, 'pack_sha256: |'), /forbidden YAML|plain snake_case/u],
    ['anchor', (text) => text.replace(`contract_sha256: ${CONTRACT}`, `contract_sha256: &tuple ${CONTRACT}`), /forbidden YAML/u],
    ['alias', (text) => text.replace(`pack_sha256: ${PACK}`, 'pack_sha256: *tuple'), /forbidden YAML/u],
  ];

  it.each(mutations)('rejects %s ambiguity', (_name, mutate, expected) => {
    const valid = frontmatter(recordValues());
    writeFileSync(candidateRecordPath, mutate(valid), 'utf8');
    expectFailure(expected);
    writeEvidence();
  });

  it.each([
    ['status', 'FAIL'],
    ['phase2_candidate_sha', DEPENDENCIES[7]],
    ['phase1_source_field', 'phase1_candidate_sha'],
    ['phase1_candidate_sha', DEPENDENCIES[0]],
    ['contract_sha256', '0'.repeat(64)],
    ['pack_sha256', '0'.repeat(64)],
    ['dependency_02_08_sha', DEPENDENCIES[6]],
    ['scope_attestation', 'trust-me'],
    ['scope_file_count', '11'],
    ['inventory_scenario_count', '2036159'],
    ['pre_activation_build_exit', '1'],
    ['recorded_at', '2020-01-01T00:00:00Z'],
  ])('rejects invalid %s', (key, value) => {
    writeEvidence({ ...recordValues(), [key]: value });
    expectFailure(
      key === 'recorded_at' ? /predates the candidate/u : new RegExp(key, 'u'),
    );
    writeEvidence();
  });
});

describe('activation sequence', () => {
  it('requires the recorded pre-activation SHA to be the exact parent', () => {
    writeEvidence(recordValues(candidateSha, BASE));
    expectFailure(/exact candidate parent/u);
    writeEvidence();
  });

  it('rejects a candidate whose flag remains false', () => {
    git(repo, ['checkout', '--detach', preActivationSha]);
    writeEvidence(
      recordValues(preActivationSha, BASE),
      reviewValues('reviewer-a', 'session-a', preActivationSha),
      reviewValues('reviewer-b', 'session-b', preActivationSha),
    );
    expectFailure(/flag must be exactly true/u, argv(preActivationSha));
    git(repo, ['checkout', '--detach', candidateSha]);
    writeEvidence();
  });

  it('requires every pre-activation command and zero exit', () => {
    writeEvidence({
      ...recordValues(),
      pre_activation_exact_context_command: 'echo skipped',
    });
    expectFailure(/does not attest the required command/u);
    writeEvidence();
  });

  it('rejects malformed and runtime-bypass flag declarations', () => {
    activateVariant(
      'malformed flag',
      undefined,
      'export const OUTFIT_TRUTH_V1_AVAILABLE = Boolean(true);\n',
      /literal compile-time flag declaration/u,
    );
    activateVariant(
      'runtime bypass',
      undefined,
      "export const OUTFIT_TRUTH_V1_AVAILABLE = true as const;\nvoid process.env.PHASE2_BYPASS;\n",
      /runtime activation bypass/u,
    );
  });

  it('rejects any third path in the P-to-C activation delta', () => {
    activateVariant(
      'wide delta',
      undefined,
      'export const OUTFIT_TRUTH_V1_AVAILABLE = true as const;\n',
      /activation delta differs/u,
      () => appendOwned('package.json', '// activation drift'),
    );
  });
});

describe('raw Phase 1 source-field normalization', () => {
  const summaryPath =
    '.planning/phases/01-planlegg-dagslinjen/01-18-SUMMARY.md';
  const cases: ReadonlyArray<
    readonly [string, (source: string) => string, RegExp]
  > = [
    [
      'duplicate',
      (source) =>
        source.replace(
          `candidate_sha: ${PHASE1}`,
          `candidate_sha: ${PHASE1}\ncandidate_sha: ${PHASE1}`,
        ),
      /duplicate field candidate_sha/u,
    ],
    [
      'normalized alias',
      (source) =>
        source.replace('candidate_sha:', 'phase1_candidate_sha:'),
      /forbidden alias phase1_candidate_sha/u,
    ],
    [
      'camelCase',
      (source) => source.replace('candidate_sha:', 'candidateSha:'),
      /forbidden alias candidateSha/u,
    ],
    [
      'mixed contract checksum',
      (source) => source.replace('contract_sha256:', 'contract-sha256:'),
      /forbidden alias contract-sha256/u,
    ],
    [
      'camelCase pack checksum',
      (source) => source.replace('pack_sha256:', 'packSha256:'),
      /forbidden alias packSha256/u,
    ],
    [
      'nested',
      (source) => source.replace('candidate_sha:', '  candidate_sha:'),
      /nests required field candidate_sha/u,
    ],
    [
      'multiline',
      (source) =>
        source.replace(
          `candidate_sha: ${PHASE1}`,
          `candidate_sha: |\n  ${PHASE1}`,
        ),
      /not one plain scalar/u,
    ],
    [
      'anchor',
      (source) =>
        source.replace(
          `candidate_sha: ${PHASE1}`,
          `candidate_sha: &candidate ${PHASE1}`,
        ),
      /YAML anchor or alias/u,
    ],
  ];

  it.each(cases)('rejects %s Phase 1 ambiguity', (name, mutate, expected) => {
    git(repo, ['checkout', '--detach', candidateSha]);
    const path = join(repo, summaryPath);
    writeFileSync(path, mutate(readFileSync(path, 'utf8')), 'utf8');
    const variant = commit(
      repo,
      `test: Phase 1 ${name} ambiguity`,
      new Date(Date.now() - 30_000).toISOString(),
    );
    git(repo, ['checkout', '--detach', variant]);
    try {
      expectFailure(expected, argv(variant));
    } finally {
      git(repo, ['checkout', '--detach', candidateSha]);
      writeEvidence();
    }
  });
});

describe('inventory, amended scope and protected surfaces', () => {
  it('rejects a missing or mutated candidate-local inventory oracle', () => {
    activateVariant(
      'missing inventory',
      () => rmSync(join(repo, 'scripts/outfit/inventory-v1.ts')),
      'export const OUTFIT_TRUTH_V1_AVAILABLE = true as const;\n',
      /tracked inventory artifacts differs/u,
    );
    activateVariant(
      'mutated inventory',
      () => appendOwned('scripts/outfit/inventory-v1.ts', '// mutation'),
      'export const OUTFIT_TRUTH_V1_AVAILABLE = true as const;\n',
      /blobs do not match/u,
    );
  });

  it('rejects an omitted counted contract test from the twelve-path implementation scope', () => {
    activateVariant(
      'omitted contract test',
      () => {
        git(repo, [
          'rm',
          'src/lib/planning/__tests__/planned-outfit-resolver.test.ts',
        ]);
      },
      'export const OUTFIT_TRUTH_V1_AVAILABLE = true as const;\n',
      /required amended scope path src\/lib\/planning\/__tests__\/planned-outfit-resolver\.test\.ts/u,
    );
  });

  it('rejects a mutated twelve-path scope attestation', () => {
    writeEvidence({ ...recordValues(), scope_attestation: 'amended-11-paths-only' });
    expectFailure(/scope_attestation/u);
    writeEvidence();
  });

  it('rejects package, media and protected-screen drift outside the twelve paths', () => {
    activateVariant(
      'protected drift',
      () => {
        appendOwned('package.json', ' ');
        appendOwned('src/screens/HjemScreen.tsx', '// protected drift');
        writeFileSync(join(repo, 'e2e/forbidden-media.png'), 'not-media', 'utf8');
        writeFileSync(
          join(
            repo,
            '.planning/phases/02-outfit-truth-antrekkskart/02-09-UNAUTHORIZED-DRIFT.md',
          ),
          'unauthorized governance drift\n',
          'utf8',
        );
      },
      'export const OUTFIT_TRUTH_V1_AVAILABLE = true as const;\n',
      /amended twelve-path implementation scope plus governance artifact differs/u,
    );
  });
});

describe('qualified post-candidate reviews', () => {
  it.each([
    ['status', 'FAIL'],
    ['phase2_candidate_sha', DEPENDENCIES[7]],
    ['capability', 'standard-verification'],
    ['fresh_context', 'false'],
    ['verdict', 'FAIL'],
    ['unresolved_p0', '1'],
    ['unresolved_p1', '1'],
    ['unresolved_severe_findings', '1'],
    ['reviewed_at', '2020-01-01T00:00:00Z'],
  ])('rejects review %s=%s', (key, value) => {
    writeEvidence(
      recordValues(),
      { ...reviewValues('reviewer-a', 'session-a'), [key]: value },
      reviewValues('reviewer-b', 'session-b'),
    );
    expectFailure(new RegExp(key === 'reviewed_at' ? 'predates' : key, 'u'));
    writeEvidence();
  });

  it('requires distinct reviewer and session identities', () => {
    writeEvidence(
      recordValues(),
      reviewValues('same-reviewer', 'session-a'),
      reviewValues('same-reviewer', 'session-b'),
    );
    expectFailure(/distinct reviewer IDs/u);
    writeEvidence(
      recordValues(),
      reviewValues('reviewer-a', 'same-session'),
      reviewValues('reviewer-b', 'same-session'),
    );
    expectFailure(/distinct session IDs/u);
    writeEvidence();
  });
});

describe('complete immutable candidate', () => {
  it(
    'accepts the exact scope, ancestry, activation, inventory and two reviews',
    () => {
      process.chdir(repo);
      expect(() => verifyPhase2Evidence(argv())).not.toThrow();
      expect(git(repo, ['status', '--porcelain', '--untracked-files=all'])).toBe(
        '',
      );
    },
    300_000,
  );

  it(
    'runs the checked-in launcher with the real spaced evidence paths',
    () => {
      process.chdir(repo);
      const result = spawnSync(
        process.execPath,
        [join(repo, 'scripts/outfit/run-phase2-evidence.ts')],
        {
          cwd: repo,
          env: {
            ...process.env,
            PHASE2_CANDIDATE_SHA: candidateSha,
            PHASE2_CANDIDATE_RECORD: candidateRecordPath,
            PHASE2_REVIEW_A: reviewAPath,
            PHASE2_REVIEW_B: reviewBPath,
          },
          shell: false,
          windowsHide: true,
          encoding: 'utf8',
          timeout: 300_000,
        },
      );
      expect(result.error).toBeUndefined();
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain('Phase 2 evidence verification: PASS');
    },
    300_000,
  );
});
