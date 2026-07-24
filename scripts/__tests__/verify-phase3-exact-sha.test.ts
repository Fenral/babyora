import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import {
  isPathWithinResolvedRoot,
  parsePhase1CandidateSummary,
  parsePhase2HandoffSummary,
  parsePhase3CandidateRecord,
} from '../verify-phase3-exact-sha.mjs';

const scriptPath = fileURLToPath(
  new URL('../verify-phase3-exact-sha.mjs', import.meta.url),
);

const temporaryParents: string[] = [];

const semanticCommitAliasKeys = [
  'candidate_commit',
  'candidate-commit',
  'candidateCommit',
  'CandidateCommit',
  'source_commit',
  'source-commit',
  'sourceCommit',
  'SourceCommit',
  'phase2_candidate_commit',
  'source_phase2_commit',
] as const;

const commitIdentifierAliasTokenSets = [
  ['candidate', 'commit', 'id'],
  ['source', 'commit', 'id'],
  ['phase1', 'candidate', 'commit', 'id'],
  ['phase1', 'sha'],
  ['source', 'sha'],
  ['candidate', 'oid'],
  ['candidate', 'revision'],
] as const;

const commitIdentifierAliasKeys = Object.freeze([
  ...new Set(
    commitIdentifierAliasTokenSets.flatMap((tokens) => {
      const capitalized = tokens.map(
        (token) => `${token[0].toUpperCase()}${token.slice(1)}`,
      );
      return [
        tokens.join('_'),
        tokens.join('-'),
        tokens.join(''),
        `${tokens[0]}${capitalized.slice(1).join('')}`,
        capitalized.join(''),
        tokens.join('_').toUpperCase(),
        tokens.join('-').toUpperCase(),
      ];
    }),
  ),
]);

type DecoratedCommitScalarCase = Readonly<{
  name: string;
  lines: readonly string[];
}>;

function decoratedCommitScalarCases(
  conflictingSha: string,
): readonly DecoratedCommitScalarCase[] {
  return [
    {
      name: 'plain scalar with an outside comment',
      lines: [`candidate_commit: ${conflictingSha} # conflicting candidate`],
    },
    {
      name: 'quoted scalar with an outside comment',
      lines: [`candidate_commit: "${conflictingSha}" # conflicting candidate`],
    },
    {
      name: 'explicit string tag',
      lines: [`candidate_commit: !!str ${conflictingSha}`],
    },
    {
      name: 'anchor decoration',
      lines: [`candidate_commit: &candidate ${conflictingSha}`],
    },
    {
      name: 'combined tag anchor spacing and case variants',
      lines: [
        `CandidateCommit:   !!str   &candidate   ${conflictingSha.toUpperCase()}   # conflict`,
      ],
    },
    {
      name: 'YAML alias',
      lines: ['candidate_commit: *candidate'],
    },
    {
      name: 'literal block scalar',
      lines: ['candidate_commit: |-', `  ${conflictingSha}`],
    },
    {
      name: 'folded block scalar',
      lines: ['candidate_commit: >-', `  ${conflictingSha}`],
    },
    {
      name: 'unsupported inline collection decoration',
      lines: [`candidate_commit: [${conflictingSha}]`],
    },
  ];
}

type Harness = {
  parent: string;
  repository: string;
  evidenceRoot: string;
  phase1SummaryPath: string;
  phase1Sha: string;
  candidateSha: string;
  bundlePath: string;
  candidateRecordPath: string;
  codeReviewPath: string;
  uiReviewPath: string;
  evidenceHash: string;
};

type ProcessResult = ReturnType<typeof spawnSync>;

function git(
  repository: string,
  args: readonly string[],
  input?: string,
): string {
  return execFileSync('git', [...args], {
    cwd: repository,
    encoding: 'utf8',
    input,
    stdio: input === undefined ? ['ignore', 'pipe', 'pipe'] : ['pipe', 'pipe', 'pipe'],
  }).trim();
}

function writeJson(path: string, value: Readonly<Record<string, unknown>>): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function refreshEvidence(
  harness: Harness,
  overrides: {
    candidate?: Readonly<Record<string, unknown>>;
    codeReview?: Readonly<Record<string, unknown>>;
    uiReview?: Readonly<Record<string, unknown>>;
  } = {},
): void {
  const candidate = {
    phase3_candidate_sha: harness.candidateSha,
    ancestry_status: 'PASS',
    clean_status: 'PASS',
    validation_evidence_sha256: harness.evidenceHash,
    ...overrides.candidate,
  };
  const codeReview = {
    code_security_sha: harness.candidateSha,
    code_security_status: 'PASS',
    code_security_verdict: 'PASS',
    code_security_reviewer_id: 'code-reviewer',
    code_security_session_id: 'code-session',
    code_security_fork_turns: 'none',
    code_security_fresh_context: true,
    code_security_evidence_sha256: harness.evidenceHash,
    ...overrides.codeReview,
  };
  const uiReview = {
    ui_accessibility_sha: harness.candidateSha,
    ui_accessibility_status: 'PASS',
    ui_accessibility_verdict: 'PASS',
    ui_accessibility_reviewer_id: 'ui-reviewer',
    ui_accessibility_session_id: 'ui-session',
    ui_accessibility_fork_turns: 'none',
    ui_accessibility_fresh_context: true,
    ui_accessibility_evidence_sha256: harness.evidenceHash,
    ...overrides.uiReview,
  };

  writeJson(harness.candidateRecordPath, candidate);
  writeJson(harness.codeReviewPath, codeReview);
  writeJson(harness.uiReviewPath, uiReview);
}

function createHarness(): Harness {
  const parent = mkdtempSync(join(tmpdir(), 'babyora phase3 verifier '));
  temporaryParents.push(parent);

  const repository = join(parent, 'detached candidate checkout with spaces');
  const evidenceRoot = join(parent, 'external evidence sibling with spaces');
  mkdirSync(repository);
  mkdirSync(evidenceRoot);

  git(repository, ['init', '--quiet']);
  git(repository, ['config', 'user.name', 'Phase 3 Test']);
  git(repository, ['config', 'user.email', 'phase3-test@example.invalid']);

  writeFileSync(join(repository, 'base.txt'), 'base\n', 'utf8');
  git(repository, ['add', '--', 'base.txt']);
  git(repository, ['commit', '--quiet', '-m', 'phase 1 candidate']);
  const phase1Sha = git(repository, ['rev-parse', 'HEAD']);

  const phase1SummaryPath = join(
    repository,
    '.planning',
    'phase1-summary.md',
  );
  mkdirSync(dirname(phase1SummaryPath), { recursive: true });
  writeFileSync(
    phase1SummaryPath,
    [
      '---',
      'status: PASS',
      `candidate_sha: ${phase1Sha}`,
      'contract_sha256: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'pack_sha256: bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      '---',
      '',
      '# Phase 1',
      '',
    ].join('\n'),
    'utf8',
  );
  writeFileSync(join(repository, 'candidate.txt'), 'candidate\n', 'utf8');
  git(repository, ['add', '--', '.planning/phase1-summary.md', 'candidate.txt']);
  git(repository, ['commit', '--quiet', '-m', 'phase 3 candidate']);
  const candidateSha = git(repository, ['rev-parse', 'HEAD']);
  git(repository, ['switch', '--quiet', '--detach', candidateSha]);

  const bundlePath = join(evidenceRoot, 'phase3 final validation.log');
  writeFileSync(bundlePath, 'tests: PASS\nbuild: PASS\n', 'utf8');
  const evidenceHash = createHash('sha256')
    .update(readFileSync(bundlePath))
    .digest('hex');
  const harness: Harness = {
    parent,
    repository,
    evidenceRoot,
    phase1SummaryPath,
    phase1Sha,
    candidateSha,
    bundlePath,
    candidateRecordPath: join(evidenceRoot, 'phase3 candidate.json'),
    codeReviewPath: join(evidenceRoot, 'phase3 code security review.json'),
    uiReviewPath: join(evidenceRoot, 'phase3 ui accessibility review.json'),
    evidenceHash,
  };
  refreshEvidence(harness);

  return harness;
}

function candidateArgs(harness: Harness): string[] {
  return [
    'candidate',
    '--candidate-record',
    harness.candidateRecordPath,
    '--code-security-review',
    harness.codeReviewPath,
    '--ui-accessibility-review',
    harness.uiReviewPath,
    '--validation-bundle',
    harness.bundlePath,
    '--phase1-summary',
    harness.phase1SummaryPath,
    '--expected-dependency-count',
    '1',
  ];
}

function replaceOption(
  args: readonly string[],
  option: string,
  value: string,
): string[] {
  const next = [...args];
  const index = next.indexOf(option);
  if (index === -1) {
    throw new Error(`missing test option ${option}`);
  }
  next[index + 1] = value;
  return next;
}

function removeOption(args: readonly string[], option: string): string[] {
  const next = [...args];
  const index = next.indexOf(option);
  if (index === -1) {
    throw new Error(`missing test option ${option}`);
  }
  next.splice(index, 2);
  return next;
}

function runScript(
  harness: Harness,
  args: readonly string[],
  ...evidenceRootOverride: [] | [string | undefined]
): ProcessResult {
  const evidenceRoot =
    evidenceRootOverride.length === 0
      ? harness.evidenceRoot
      : evidenceRootOverride[0];
  const env = { ...process.env };
  if (evidenceRoot === undefined) {
    delete env.BABYORA_PHASE3_EVIDENCE_ROOT;
  } else {
    env.BABYORA_PHASE3_EVIDENCE_ROOT = evidenceRoot;
  }

  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: harness.repository,
    env,
    encoding: 'utf8',
    shell: false,
  });
}

function output(result: ProcessResult): string {
  return `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
}

function expectFailure(result: ProcessResult, pattern?: RegExp): void {
  expect(result.status).not.toBe(0);
  if (pattern !== undefined) {
    expect(output(result)).toMatch(pattern);
  }
}

afterEach(() => {
  for (const parent of temporaryParents.splice(0)) {
    rmSync(parent, { recursive: true, force: true });
  }
});

describe('pure exact-label and path guards', () => {
  it('accepts only exact Phase 1 candidate_sha and normalizes it internally', () => {
    const sha = '1'.repeat(40);

    expect(
      parsePhase1CandidateSummary(
        ['---', 'status: PASS', `candidate_sha: ${sha}`, '---'].join('\n'),
      ),
    ).toEqual({ phase1CandidateSha: sha });

    for (const aliased of [
      `phase1_candidate_sha: ${sha}`,
      `candidateSha: ${sha}`,
      `final_candidate_sha: ${sha}`,
      `commit: ${sha}`,
      `candidate_sha: ${sha}\ncandidate_sha: ${sha}`,
    ]) {
      expect(() =>
        parsePhase1CandidateSummary(
          ['---', 'status: PASS', aliased, '---'].join('\n'),
        ),
      ).toThrow();
    }
  });

  it('rejects quoted, dotted, and semantic duplicate Phase 1 SHA keys', () => {
    const sha = '1'.repeat(40);
    const canonical = [
      '---',
      'status: PASS',
      `candidate_sha: ${sha}`,
    ];

    for (const ambiguousLine of [
      `candidate.sha: ${sha}`,
      `commit.sha: ${sha}`,
      `"candidate_sha": ${sha}`,
      `'candidate_sha': ${sha}`,
      `phase1.candidate.sha: ${sha}`,
      `"phase1_candidate_sha": ${sha}`,
      'metadata.version: 1',
      '"status": PASS',
    ]) {
      expect(() =>
        parsePhase1CandidateSummary(
          [...canonical, ambiguousLine, '---'].join('\n'),
        ),
      ).toThrow();
    }
  });

  it('rejects quoted, dotted, and semantic duplicate Phase 2 SHA keys', () => {
    const sha = '2'.repeat(40);
    const canonical = [
      '---',
      'status: PASS',
      `phase2_candidate_sha: ${sha}`,
      'feature_flag: true',
      `phase1_candidate_sha: ${sha}`,
    ];

    for (const ambiguousLine of [
      `candidate.sha: ${sha}`,
      `commit.sha: ${sha}`,
      `"phase2_candidate_sha": ${sha}`,
      `'phase2_candidate_sha': ${sha}`,
      `phase2.candidate.sha: ${sha}`,
      `phase1.candidate.sha: ${sha}`,
      `"phase1_candidate_sha": ${sha}`,
      'metadata.version: 1',
      '"feature_flag": true',
    ]) {
      expect(() =>
        parsePhase2HandoffSummary(
          [...canonical, ambiguousLine, '---'].join('\n'),
        ),
      ).toThrow();
    }
  });

  it('rejects generalized candidate and commit SHA aliases without metadata false positives', () => {
    const phase2Sha = '2'.repeat(40);
    const phase1Sha = '1'.repeat(40);
    const conflictingSha = '3'.repeat(40);
    const canonical = [
      '---',
      'status: PASS',
      `phase2_candidate_sha: ${phase2Sha}`,
      'feature_flag: true',
      `phase1_candidate_sha: ${phase1Sha}`,
      'phase1_source_field: candidate_sha',
      'phase2_candidate_status: reviewed',
      'candidate_count: 2',
      'commit_message: immutable handoff',
      'commit_status: reviewed',
      'commit_count: 2',
      'commit_date: 2026-07-24',
      'last_commit_at: 2026-07-24T10:00:00Z',
      'source_commit_message: exact upstream provenance',
      'candidate_commit_status: reviewed',
      `validation_evidence_sha256: ${'a'.repeat(64)}`,
      `sha256_manifest: ${'b'.repeat(64)}`,
      'source_phase2: exact',
    ];

    expect(
      parsePhase2HandoffSummary([...canonical, '---'].join('\n')),
    ).toEqual({
      phase2CandidateSha: phase2Sha,
      featureFlag: true,
    });

    for (const conflictingAlias of [
      `phase2_candidate_commit_sha: ${conflictingSha}`,
      `source_phase2_candidate_sha: ${conflictingSha}`,
      `phase1_candidate_commit_sha: ${conflictingSha}`,
      `source_phase1_candidate_sha: ${conflictingSha}`,
      `candidate_source_sha: ${conflictingSha}`,
      `source_commit_sha: ${conflictingSha}`,
      `"source_phase2_candidate_sha": ${conflictingSha}`,
      `source.phase1.candidate.sha: ${conflictingSha}`,
    ]) {
      expect(() =>
        parsePhase2HandoffSummary(
          [...canonical, conflictingAlias, '---'].join('\n'),
        ),
      ).toThrow();
    }
  });

  it('rejects every semantic 40-hex commit alias in Phase 1 without blocking metadata', () => {
    const candidateSha = '1'.repeat(40);
    const conflictingSha = '2'.repeat(40);
    const canonical = [
      '---',
      'status: PASS',
      `candidate_sha: ${candidateSha}`,
      'phase1_source_field: candidate_sha',
      'candidate_status: reviewed',
      'candidate_count: 1',
      'commit_message: immutable candidate',
      'commit_status: reviewed',
      'commit_count: 2',
      'commit_date: 2026-07-24',
      'last_commit_at: 2026-07-24T10:00:00Z',
      'source_commit_message: exact upstream provenance',
      'candidate_commit_status: reviewed',
    ];

    expect(
      parsePhase1CandidateSummary([...canonical, '---'].join('\n')),
    ).toEqual({ phase1CandidateSha: candidateSha });

    for (const alias of semanticCommitAliasKeys) {
      expect(() =>
        parsePhase1CandidateSummary(
          [...canonical, `${alias}: ${conflictingSha}`, '---'].join('\n'),
        ),
      ).toThrow();
    }
  });

  it('rejects every semantic 40-hex commit alias in Phase 2 without blocking metadata', () => {
    const phase2Sha = '2'.repeat(40);
    const phase1Sha = '1'.repeat(40);
    const conflictingSha = '3'.repeat(40);
    const canonical = [
      '---',
      'status: PASS',
      `phase2_candidate_sha: ${phase2Sha}`,
      'feature_flag: true',
      `phase1_candidate_sha: ${phase1Sha}`,
      'phase1_source_field: candidate_sha',
      'phase2_candidate_status: reviewed',
      'candidate_count: 2',
      'commit_message: immutable handoff',
      'commit_status: reviewed',
      'commit_count: 2',
      'commit_date: 2026-07-24',
      'last_commit_at: 2026-07-24T10:00:00Z',
      'source_commit_message: exact upstream provenance',
      'candidate_commit_status: reviewed',
    ];

    expect(
      parsePhase2HandoffSummary([...canonical, '---'].join('\n')),
    ).toEqual({
      phase2CandidateSha: phase2Sha,
      featureFlag: true,
    });

    for (const alias of semanticCommitAliasKeys) {
      expect(() =>
        parsePhase2HandoffSummary(
          [...canonical, `${alias}: ${conflictingSha}`, '---'].join('\n'),
        ),
      ).toThrow();
    }
  });

  it('allows only the canonical Phase 1 key for every commit-shaped scalar', () => {
    const candidateSha = '1'.repeat(40);
    const conflictingSha = 'b'.repeat(40);
    const canonical = [
      '---',
      'status: PASS',
      `candidate_sha: ${candidateSha}`,
      'candidate_revision_status: reviewed',
      'source_sha_algorithm: sha1',
      'candidate_oid_format: git',
      `validation_evidence_sha256: ${'a'.repeat(64)}`,
    ];
    const parseWith = (line: string) =>
      parsePhase1CandidateSummary([...canonical, line, '---'].join('\n'));

    expect(
      parsePhase1CandidateSummary([...canonical, '---'].join('\n')),
    ).toEqual({ phase1CandidateSha: candidateSha });

    for (const alias of commitIdentifierAliasKeys) {
      for (const nonCommitValue of [
        'reviewed',
        'g'.repeat(40),
        'a'.repeat(39),
        'a'.repeat(41),
      ]) {
        expect(parseWith(`${alias}: ${nonCommitValue}`)).toEqual({
          phase1CandidateSha: candidateSha,
        });
      }

      for (const commitLikeValue of [
        conflictingSha,
        candidateSha,
        conflictingSha.toUpperCase(),
        `"${conflictingSha}"`,
        `'${conflictingSha}'`,
      ]) {
        expect(() =>
          parseWith(`${alias}: ${commitLikeValue}`),
        ).toThrow(/candidate SHA alias/i);
      }
    }
  });

  it('allows only canonical Phase 2 keys for every commit-shaped scalar', () => {
    const phase2Sha = '2'.repeat(40);
    const phase1Sha = '1'.repeat(40);
    const conflictingSha = 'b'.repeat(40);
    const canonical = [
      '---',
      'status: PASS',
      `phase2_candidate_sha: ${phase2Sha}`,
      'feature_flag: true',
      `phase1_candidate_sha: ${phase1Sha}`,
      'candidate_revision_status: reviewed',
      'source_sha_algorithm: sha1',
      'candidate_oid_format: git',
      `validation_evidence_sha256: ${'a'.repeat(64)}`,
    ];
    const parseWith = (line: string) =>
      parsePhase2HandoffSummary([...canonical, line, '---'].join('\n'));

    expect(
      parsePhase2HandoffSummary([...canonical, '---'].join('\n')),
    ).toEqual({
      phase2CandidateSha: phase2Sha,
      featureFlag: true,
    });

    for (const alias of commitIdentifierAliasKeys) {
      for (const nonCommitValue of [
        'reviewed',
        'g'.repeat(40),
        'a'.repeat(39),
        'a'.repeat(41),
      ]) {
        expect(parseWith(`${alias}: ${nonCommitValue}`)).toEqual({
          phase2CandidateSha: phase2Sha,
          featureFlag: true,
        });
      }

      for (const commitLikeValue of [
        conflictingSha,
        phase2Sha,
        phase1Sha,
        conflictingSha.toUpperCase(),
        `"${conflictingSha}"`,
        `'${conflictingSha}'`,
      ]) {
        expect(() =>
          parseWith(`${alias}: ${commitLikeValue}`),
        ).toThrow(/candidate SHA alias/i);
      }
    }
  });

  it('accepts canonical SHA comments and unrelated metadata controls', () => {
    const phase1Sha = '1'.repeat(40);
    const phase2Sha = '2'.repeat(40);
    const checksum = 'a'.repeat(64);
    const controls = [
      'notes: "a literal # remains part of this quoted value"',
      "single_quoted_notes: 'another literal # value'",
      'url_fragment: https://example.invalid/path#fragment',
      `validation_evidence_sha256: ${checksum} # ordinary checksum comment`,
    ];

    expect(
      parsePhase1CandidateSummary(
        [
          '---',
          'status: PASS',
          `candidate_sha: ${phase1Sha} # exact Phase 1 candidate`,
          ...controls,
          '---',
        ].join('\n'),
      ),
    ).toEqual({ phase1CandidateSha: phase1Sha });
    expect(
      parsePhase2HandoffSummary(
        [
          '---',
          'status: PASS',
          `phase2_candidate_sha: ${phase2Sha} # exact Phase 2 candidate`,
          'feature_flag: true',
          `phase1_candidate_sha: ${phase1Sha} # exact upstream candidate`,
          ...controls,
          '---',
        ].join('\n'),
      ),
    ).toEqual({
      phase2CandidateSha: phase2Sha,
      featureFlag: true,
    });
  });

  it.each(decoratedCommitScalarCases('b'.repeat(40)))(
    'rejects Phase 1 $name',
    ({ lines }) => {
      expect(() =>
        parsePhase1CandidateSummary(
          [
            '---',
            'status: PASS',
            `candidate_sha: ${'1'.repeat(40)}`,
            ...lines,
            '---',
          ].join('\n'),
        ),
      ).toThrow();
    },
  );

  it.each(decoratedCommitScalarCases('b'.repeat(40)))(
    'rejects Phase 2 $name',
    ({ lines }) => {
      expect(() =>
        parsePhase2HandoffSummary(
          [
            '---',
            'status: PASS',
            `phase2_candidate_sha: ${'2'.repeat(40)}`,
            'feature_flag: true',
            `phase1_candidate_sha: ${'1'.repeat(40)}`,
            ...lines,
            '---',
          ].join('\n'),
        ),
      ).toThrow();
    },
  );

  it('rejects duplicate or aliased candidate JSON labels', () => {
    const sha = '2'.repeat(40);
    const hash = 'a'.repeat(64);
    const valid = {
      phase3_candidate_sha: sha,
      ancestry_status: 'PASS',
      clean_status: 'PASS',
      validation_evidence_sha256: hash,
    };

    expect(parsePhase3CandidateRecord(JSON.stringify(valid))).toEqual(valid);
    expect(() =>
      parsePhase3CandidateRecord(
        JSON.stringify({ ...valid, candidate_sha: sha }),
      ),
    ).toThrow();
    expect(() =>
      parsePhase3CandidateRecord(
        `{"phase3_candidate_sha":"${sha}","phase3_candidate_sha":"${sha}","ancestry_status":"PASS","clean_status":"PASS","validation_evidence_sha256":"${hash}"}`,
      ),
    ).toThrow();
  });

  it('uses resolved path boundaries rather than string prefixes', () => {
    const root = realpathSync(tmpdir());
    const child = join(root, 'evidence file.json');
    const siblingPrefix = `${root}-outside`;

    expect(isPathWithinResolvedRoot(root, child)).toBe(true);
    expect(isPathWithinResolvedRoot(root, root)).toBe(false);
    expect(isPathWithinResolvedRoot(root, siblingPrefix)).toBe(false);
  });
});

describe('candidate mode', () => {
  it('passes one detached clean SHA with external spaced evidence and exact ancestry', () => {
    const harness = createHarness();
    const result = runScript(harness, candidateArgs(harness));

    expect(result.status).toBe(0);
    expect(JSON.parse(String(result.stdout))).toEqual({
      status: 'PASS',
      mode: 'candidate',
      phase3CandidateSha: harness.candidateSha,
      phase1CandidateSha: harness.phase1Sha,
      dependencyCount: 1,
      validationEvidenceSha256: harness.evidenceHash,
    });
  });

  it('uses execFileSync argument arrays and contains no shell execution surface', () => {
    const source = readFileSync(scriptPath, 'utf8');

    expect(source).toContain('execFileSync');
    expect(source).not.toMatch(/\bexecSync\s*\(/);
    expect(source).not.toMatch(/\bshell\s*:/);
  });

  it('executes and fails closed through a real directory junction or symlink', () => {
    const parent = mkdtempSync(join(tmpdir(), 'phase3 verifier entrypoint '));
    temporaryParents.push(parent);
    const linkedScripts = join(parent, 'scripts through junction');
    symlinkSync(
      dirname(scriptPath),
      linkedScripts,
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    const indirectScriptPath = join(linkedScripts, basename(scriptPath));

    const direct = spawnSync(process.execPath, [scriptPath], {
      encoding: 'utf8',
      shell: false,
    });
    const indirect = spawnSync(process.execPath, [indirectScriptPath], {
      encoding: 'utf8',
      shell: false,
    });

    expect(direct.status).toBe(1);
    expect(indirect.status).toBe(direct.status);
    expect(indirect.stdout).toBe(direct.stdout);
    expect(indirect.stderr).toBe(direct.stderr);
    expect(output(indirect)).toMatch(/verification mode is required/i);
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['relative', 'relative evidence'],
  ])('rejects a %s evidence root', (_name, evidenceRoot) => {
    const harness = createHarness();

    expectFailure(
      runScript(harness, candidateArgs(harness), evidenceRoot),
      /BABYORA_PHASE3_EVIDENCE_ROOT/i,
    );
  });

  it('rejects roots equal to, nested in, or resolving back into the checkout', () => {
    for (const kind of ['equal', 'nested', 'junction'] as const) {
      const harness = createHarness();
      let root: string;

      if (kind === 'equal') {
        root = harness.repository;
      } else if (kind === 'nested') {
        root = join(harness.repository, 'inside evidence');
        mkdirSync(root);
      } else {
        root = join(harness.parent, 'outside-looking checkout link');
        symlinkSync(
          harness.repository,
          root,
          process.platform === 'win32' ? 'junction' : 'dir',
        );
      }

      expectFailure(
        runScript(harness, candidateArgs(harness), root),
        /outside.*checkout|evidence root/i,
      );
    }
  });

  it('confines every distinct record and bundle beneath the external root', () => {
    const harness = createHarness();
    const recordInsideCheckout = join(harness.repository, 'record.json');
    writeFileSync(
      recordInsideCheckout,
      readFileSync(harness.candidateRecordPath),
    );

    expectFailure(
      runScript(
        harness,
        replaceOption(
          candidateArgs(harness),
          '--candidate-record',
          recordInsideCheckout,
        ),
      ),
      /candidate record.*evidence root/i,
    );
    expectFailure(
      runScript(
        harness,
        replaceOption(
          candidateArgs(harness),
          '--ui-accessibility-review',
          harness.codeReviewPath,
        ),
      ),
      /distinct/i,
    );
  });

  it('rejects missing and aliased record arguments', () => {
    const harness = createHarness();

    expectFailure(
      runScript(
        harness,
        removeOption(candidateArgs(harness), '--candidate-record'),
      ),
      /candidate-record/i,
    );
    expectFailure(
      runScript(harness, [
        ...candidateArgs(harness),
        '--combined-review',
        harness.codeReviewPath,
      ]),
      /unknown option/i,
    );
  });

  it.each(['tracked', 'untracked'] as const)(
    'rejects a dirty %s candidate checkout despite recorded clean PASS',
    (kind) => {
      const harness = createHarness();
      if (kind === 'tracked') {
        writeFileSync(join(harness.repository, 'candidate.txt'), 'dirty\n');
      } else {
        writeFileSync(join(harness.repository, 'untracked.txt'), 'dirty\n');
      }

      expectFailure(
        runScript(harness, candidateArgs(harness)),
        /clean|porcelain/i,
      );
    },
  );

  it('requires direct HEAD equality and detached state', () => {
    for (const kind of ['wrong-head', 'attached'] as const) {
      const harness = createHarness();
      if (kind === 'wrong-head') {
        refreshEvidence(harness, {
          candidate: { phase3_candidate_sha: harness.phase1Sha },
          codeReview: { code_security_sha: harness.phase1Sha },
          uiReview: { ui_accessibility_sha: harness.phase1Sha },
        });
      } else {
        git(harness.repository, ['switch', '--quiet', '-c', 'attached-test']);
      }

      expectFailure(
        runScript(harness, candidateArgs(harness)),
        kind === 'wrong-head' ? /HEAD.*candidate|candidate.*HEAD/i : /detached/i,
      );
    }
  });

  it.each([
    ['zero', '0'],
    ['wrong count', '2'],
    ['omitted', null],
  ])('rejects a %s expected dependency count', (_name, count) => {
    const harness = createHarness();
    let args = candidateArgs(harness);
    if (count === null) {
      args = removeOption(args, '--expected-dependency-count');
    } else {
      args = replaceOption(args, '--expected-dependency-count', count);
    }

    expectFailure(runScript(harness, args), /dependency.*count/i);
  });

  it('rejects a declared nonancestor and duplicate dependency', () => {
    for (const kind of ['nonancestor', 'duplicate'] as const) {
      const harness = createHarness();
      const dependency =
        kind === 'duplicate'
          ? harness.phase1Sha
          : git(
              harness.repository,
              ['commit-tree', `${harness.candidateSha}^{tree}`],
              'unrelated dependency\n',
            );
      const args = [
        ...replaceOption(
          candidateArgs(harness),
          '--expected-dependency-count',
          '2',
        ),
        '--dependency',
        dependency,
      ];

      expectFailure(
        runScript(harness, args),
        kind === 'duplicate' ? /duplicate dependency/i : /ancestor/i,
      );
    }
  });

  it('rejects candidate, reviewer, context, verdict, SHA, and hash ambiguity', () => {
    const cases: Array<
      (
        harness: Harness,
      ) => void
    > = [
      (harness) =>
        refreshEvidence(harness, {
          candidate: { candidate_sha: harness.candidateSha },
        }),
      (harness) =>
        refreshEvidence(harness, {
          uiReview: { ui_accessibility_reviewer_id: 'code-reviewer' },
        }),
      (harness) =>
        refreshEvidence(harness, {
          uiReview: { ui_accessibility_session_id: 'code-session' },
        }),
      (harness) =>
        refreshEvidence(harness, {
          codeReview: { code_security_fork_turns: 'all' },
        }),
      (harness) =>
        refreshEvidence(harness, {
          uiReview: { ui_accessibility_fresh_context: false },
        }),
      (harness) =>
        refreshEvidence(harness, {
          codeReview: { code_security_verdict: 'FAIL' },
        }),
      (harness) =>
        refreshEvidence(harness, {
          uiReview: { ui_accessibility_sha: harness.phase1Sha },
        }),
      (harness) =>
        refreshEvidence(harness, {
          candidate: { validation_evidence_sha256: '0'.repeat(64) },
        }),
    ];

    for (const mutate of cases) {
      const harness = createHarness();
      mutate(harness);
      expectFailure(runScript(harness, candidateArgs(harness)));
    }
  });

  it('rejects a changed or missing validation bundle and malformed JSON', () => {
    for (const kind of ['changed', 'missing', 'malformed'] as const) {
      const harness = createHarness();
      if (kind === 'changed') {
        writeFileSync(harness.bundlePath, 'changed after review\n', 'utf8');
      } else if (kind === 'missing') {
        rmSync(harness.bundlePath);
      } else {
        writeFileSync(harness.codeReviewPath, '{"broken":', 'utf8');
      }

      expectFailure(runScript(harness, candidateArgs(harness)));
    }
  });

  it('runs git diff-tree --check against the immutable candidate', () => {
    const harness = createHarness();
    writeFileSync(join(harness.repository, 'bad-whitespace.txt'), 'bad   \n');
    git(harness.repository, ['add', '--', 'bad-whitespace.txt']);
    git(harness.repository, ['commit', '--quiet', '-m', 'bad whitespace']);
    harness.candidateSha = git(harness.repository, ['rev-parse', 'HEAD']);
    refreshEvidence(harness);

    expectFailure(
      runScript(harness, candidateArgs(harness)),
      /whitespace|diff-tree/i,
    );
  });

  it('rejects Phase 1 aliases through candidate mode before ancestry checks', () => {
    const harness = createHarness();
    const aliasSummary = join(harness.evidenceRoot, 'aliased phase1.md');
    writeFileSync(
      aliasSummary,
      [
        '---',
        'status: PASS',
        `phase1_candidate_sha: ${harness.phase1Sha}`,
        '---',
      ].join('\n'),
      'utf8',
    );

    expectFailure(
      runScript(
        harness,
        replaceOption(
          candidateArgs(harness),
          '--phase1-summary',
          aliasSummary,
        ),
      ),
      /candidate_sha|Phase 1/i,
    );
  });

  it('accepts canonical Phase 1 comments through candidate mode', () => {
    const harness = createHarness();
    const commentedSummary = join(
      harness.evidenceRoot,
      'commented canonical phase1.md',
    );
    writeFileSync(
      commentedSummary,
      [
        '---',
        'status: PASS',
        `candidate_sha: ${harness.phase1Sha} # exact Phase 1 candidate`,
        'notes: "a literal # remains ordinary metadata"',
        `validation_evidence_sha256: ${'a'.repeat(64)} # checksum metadata`,
        '---',
      ].join('\n'),
      'utf8',
    );

    const result = runScript(
      harness,
      replaceOption(
        candidateArgs(harness),
        '--phase1-summary',
        commentedSummary,
      ),
    );

    expect(result.status).toBe(0);
    expect(JSON.parse(String(result.stdout))).toEqual({
      status: 'PASS',
      mode: 'candidate',
      phase3CandidateSha: harness.candidateSha,
      phase1CandidateSha: harness.phase1Sha,
      dependencyCount: 1,
      validationEvidenceSha256: harness.evidenceHash,
    });
  });

  it.each(decoratedCommitScalarCases('b'.repeat(40)))(
    'rejects a Phase 1 $name through candidate mode',
    ({ lines }) => {
      const harness = createHarness();
      const decoratedSummary = join(
        harness.evidenceRoot,
        'decorated phase1.md',
      );
      writeFileSync(
        decoratedSummary,
        [
          '---',
          'status: PASS',
          `candidate_sha: ${harness.phase1Sha}`,
          ...lines,
          '---',
        ].join('\n'),
        'utf8',
      );

      expectFailure(
        runScript(
          harness,
          replaceOption(
            candidateArgs(harness),
            '--phase1-summary',
            decoratedSummary,
          ),
        ),
        /candidate SHA alias|unsupported.*frontmatter/i,
      );
    },
  );

  it('rejects every semantic Phase 1 commit alias through candidate mode', () => {
    const harness = createHarness();
    const aliasSummary = join(
      harness.evidenceRoot,
      'semantic commit alias phase1.md',
    );
    const args = replaceOption(
      candidateArgs(harness),
      '--phase1-summary',
      aliasSummary,
    );

    for (const alias of semanticCommitAliasKeys) {
      writeFileSync(
        aliasSummary,
        [
          '---',
          'status: PASS',
          `candidate_sha: ${harness.phase1Sha}`,
          'commit_message: immutable candidate',
          `${alias}: ${harness.candidateSha}`,
          '---',
        ].join('\n'),
        'utf8',
      );

      expectFailure(runScript(harness, args), /candidate SHA alias/i);
    }
  });

  it('rejects every commit-shaped Phase 1 identifier through candidate mode', () => {
    const harness = createHarness();
    const aliasSummary = join(
      harness.evidenceRoot,
      'commit shaped identifier phase1.md',
    );
    const args = replaceOption(
      candidateArgs(harness),
      '--phase1-summary',
      aliasSummary,
    );

    writeFileSync(
      aliasSummary,
      [
        '---',
        'status: PASS',
        `candidate_sha: ${harness.phase1Sha}`,
        'candidate_revision: reviewed',
        'source_sha: not-recorded',
        'candidate_oid: unavailable',
        `validation_evidence_sha256: ${'a'.repeat(64)}`,
        '---',
      ].join('\n'),
      'utf8',
    );
    expect(runScript(harness, args).status).toBe(0);

    for (const alias of commitIdentifierAliasKeys) {
      for (const value of [harness.candidateSha, harness.phase1Sha]) {
        writeFileSync(
          aliasSummary,
          [
            '---',
            'status: PASS',
            `candidate_sha: ${harness.phase1Sha}`,
            'candidate_revision_status: reviewed',
            `${alias}: ${value}`,
            '---',
          ].join('\n'),
          'utf8',
        );

        expectFailure(runScript(harness, args), /candidate SHA alias/i);
      }
    }
  }, 30_000);
});

describe('phase2-handoff mode', () => {
  function writePhase2Summary(
    harness: Harness,
    fields: readonly string[],
  ): string {
    const summaryPath = join(harness.evidenceRoot, 'phase2 summary.md');
    writeFileSync(
      summaryPath,
      ['---', ...fields, '---', '', '# Phase 2'].join('\n'),
      'utf8',
    );
    return summaryPath;
  }

  function runPhase2(
    harness: Harness,
    summaryPath: string,
    expectedFeatureFlag = 'true',
  ): ProcessResult {
    return runScript(harness, [
      'phase2-handoff',
      '--summary',
      summaryPath,
      '--expected-feature-flag',
      expectedFeatureFlag,
      '--ancestor-of',
      'HEAD',
    ]);
  }

  it('requires exact PASS, enabled flag, commit existence, and ancestry', () => {
    const harness = createHarness();
    const summaryPath = writePhase2Summary(harness, [
      'status: PASS',
      `phase2_candidate_sha: ${harness.phase1Sha}`,
      'feature_flag: true',
      'phase1_source_field: candidate_sha',
      `phase1_candidate_sha: ${harness.phase1Sha}`,
      'phase2_candidate_status: reviewed',
      'candidate_count: 2',
      'commit_message: immutable handoff',
      'commit_status: reviewed',
      'commit_count: 2',
      'commit_date: 2026-07-24',
      'last_commit_at: 2026-07-24T10:00:00Z',
      'source_commit_message: exact upstream provenance',
      'candidate_commit_status: reviewed',
      `validation_evidence_sha256: ${'a'.repeat(64)}`,
      `sha256_manifest: ${'b'.repeat(64)}`,
    ]);
    const result = runPhase2(harness, summaryPath);

    expect(result.status).toBe(0);
    expect(JSON.parse(String(result.stdout))).toEqual({
      status: 'PASS',
      mode: 'phase2-handoff',
      phase2CandidateSha: harness.phase1Sha,
      featureFlag: true,
      ancestorOf: harness.candidateSha,
    });
  });

  it('accepts canonical SHA comments through phase2-handoff mode', () => {
    const harness = createHarness();
    const summaryPath = writePhase2Summary(harness, [
      'status: PASS',
      `phase2_candidate_sha: ${harness.phase1Sha} # exact Phase 2 candidate`,
      'feature_flag: true',
      `phase1_candidate_sha: ${harness.phase1Sha} # exact upstream candidate`,
      'notes: "a literal # remains ordinary metadata"',
      `validation_evidence_sha256: ${'a'.repeat(64)} # checksum metadata`,
    ]);
    const result = runPhase2(harness, summaryPath);

    expect(result.status).toBe(0);
    expect(JSON.parse(String(result.stdout))).toEqual({
      status: 'PASS',
      mode: 'phase2-handoff',
      phase2CandidateSha: harness.phase1Sha,
      featureFlag: true,
      ancestorOf: harness.candidateSha,
    });
  });

  it.each(decoratedCommitScalarCases('b'.repeat(40)))(
    'rejects a Phase 2 $name through handoff mode',
    ({ lines }) => {
      const harness = createHarness();
      const summaryPath = writePhase2Summary(harness, [
        'status: PASS',
        `phase2_candidate_sha: ${harness.phase1Sha}`,
        'feature_flag: true',
        `phase1_candidate_sha: ${harness.phase1Sha}`,
        ...lines,
      ]);

      expectFailure(
        runPhase2(harness, summaryPath),
        /candidate SHA alias|unsupported.*frontmatter/i,
      );
    },
  );

  it.each([
    ['false summary with false configuration', 'false', 'false'],
    ['true summary with false configuration', 'true', 'false'],
  ])(
    'rejects %s because enabled handoff is intrinsic',
    (_name, summaryFeatureFlag, expectedFeatureFlag) => {
      const harness = createHarness();
      const summaryPath = writePhase2Summary(harness, [
        'status: PASS',
        `phase2_candidate_sha: ${harness.phase1Sha}`,
        `feature_flag: ${summaryFeatureFlag}`,
      ]);

      expectFailure(
        runPhase2(harness, summaryPath, expectedFeatureFlag),
        /feature.flag|expected-feature-flag/i,
      );
    },
  );

  it('rejects conflicting semantic SHA aliases through the real CLI', () => {
    const aliases = [
      'phase2_candidate_commit_sha',
      'source_phase2_candidate_sha',
      'phase1_candidate_commit_sha',
      'source_phase1_candidate_sha',
      'candidate_source_sha',
      'source_commit_sha',
      '"source_phase2_candidate_sha"',
      'source.phase1.candidate.sha',
      ...semanticCommitAliasKeys,
    ];
    const harness = createHarness();

    for (const alias of aliases) {
      const summaryPath = writePhase2Summary(harness, [
        'status: PASS',
        `phase2_candidate_sha: ${harness.phase1Sha}`,
        'feature_flag: true',
        `phase1_candidate_sha: ${harness.phase1Sha}`,
        `${alias}: ${harness.candidateSha}`,
      ]);

      expectFailure(
        runPhase2(harness, summaryPath),
        /candidate SHA alias|unsupported top-level frontmatter/i,
      );
    }
  });

  it('rejects every commit-shaped Phase 2 identifier through handoff mode', () => {
    const harness = createHarness();
    const controlSummaryPath = writePhase2Summary(harness, [
      'status: PASS',
      `phase2_candidate_sha: ${harness.phase1Sha}`,
      'feature_flag: true',
      `phase1_candidate_sha: ${harness.phase1Sha}`,
      'candidate_revision: reviewed',
      'source_sha: not-recorded',
      'candidate_oid: unavailable',
      `validation_evidence_sha256: ${'a'.repeat(64)}`,
    ]);

    expect(runPhase2(harness, controlSummaryPath).status).toBe(0);

    for (const alias of commitIdentifierAliasKeys) {
      for (const value of [harness.candidateSha, harness.phase1Sha]) {
        const summaryPath = writePhase2Summary(harness, [
          'status: PASS',
          `phase2_candidate_sha: ${harness.phase1Sha}`,
          'feature_flag: true',
          `phase1_candidate_sha: ${harness.phase1Sha}`,
          'candidate_revision_status: reviewed',
          `${alias}: ${value}`,
        ]);

        expectFailure(runPhase2(harness, summaryPath), /candidate SHA alias/i);
      }
    }
  }, 30_000);

  it('rejects malformed, aliased, disabled, missing, and nonancestor handoffs', () => {
    const cases = [
      ['status: FAIL', `phase2_candidate_sha: ${'1'.repeat(40)}`, 'feature_flag: true'],
      ['status: PASS', `candidate_sha: ${'1'.repeat(40)}`, 'feature_flag: true'],
      ['status: PASS', `phase2_candidate_sha: ${'1'.repeat(40)}`, 'feature_flag: false'],
      ['status: PASS', `phase2_candidate_sha: ${'1'.repeat(40)}`, 'feature_flag: true'],
    ];

    for (const [index, fields] of cases.entries()) {
      const harness = createHarness();
      if (index === cases.length - 1) {
        const unrelated = git(
          harness.repository,
          ['commit-tree', `${harness.candidateSha}^{tree}`],
          'unrelated phase2\n',
        );
        fields[1] = `phase2_candidate_sha: ${unrelated}`;
      }
      const summaryPath = writePhase2Summary(harness, fields);

      expectFailure(runPhase2(harness, summaryPath));
    }
  });
});
