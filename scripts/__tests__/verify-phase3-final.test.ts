import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
/* SUBPROSESS-TESTER TRENGER MER ENN FEM SEKUNDER.

   Denne filen starter ekte `git`- og `npm`-prosesser. Vitests standardgrense
   er 5 000 ms, og det holder pa CI (ubuntu-latest) men ikke pa Windows, der
   ett prosess-spawn alene koster sekunder — og verre nar 200 testfiler deler
   maskinen. Malt 2026-08-06: `npm test` ga 35 rode her mens de samme testene
   var gronne isolert og gronne i CI. En port som svinger med maskinlast er
   ingen port; da slutter folk a lese den.

   Grensen er hevet lokalt i stedet for globalt med vilje: de ovrige ~3 000
   testene skal fortsatt ryke pa 5 sekunder, sa en ekte henging blir synlig. */
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

import {
  ARTIFACT_NAMES,
  createFinalCommandMatrix,
  resolveEvidenceLayout,
  resolveNpmCli,
  runPhase3Final,
} from '../verify-phase3-final.mjs';

type Spawn = typeof spawnSync;
type Harness = ReturnType<typeof createHarness>;

const temporaryRoots: string[] = [];

function git(cwd: string, args: readonly string[]): string {
  const result = spawnSync('git', [...args], {
    cwd,
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
  });
  if (result.status !== 0 || result.error !== undefined) {
    throw new Error(`${result.stderr ?? ''}${result.error?.message ?? ''}`);
  }
  return result.stdout.trim();
}

function commit(cwd: string, label: string): string {
  const marker = join(cwd, `${label.replaceAll(' ', '-')}.txt`);
  writeFileSync(marker, label, 'utf8');
  git(cwd, ['add', '--', marker]);
  git(cwd, ['commit', '--quiet', '-m', label]);
  return git(cwd, ['rev-parse', 'HEAD']);
}

function summary(frontmatter: readonly string[]): string {
  return `---\n${frontmatter.join('\n')}\n---\n`;
}

function createHarness() {
  const root = mkdtempSync(join(tmpdir(), 'Babyora final & (phase) [08]-'));
  temporaryRoots.push(root);
  const repository = join(root, 'repo & (detached) [candidate]');
  const evidence = join(root, 'evidence & (external) [bundle]');
  mkdirSync(repository);
  mkdirSync(evidence);
  git(repository, ['init', '--quiet']);
  git(repository, ['config', 'user.name', 'Phase 3 Final Test']);
  git(repository, ['config', 'user.email', 'phase3-final@example.invalid']);

  const phase1 = commit(repository, 'phase 1');
  const phase2 = commit(repository, 'phase 2');
  const phase3 = Array.from({ length: 7 }, (_, index) =>
    commit(repository, `phase 3 plan ${index + 1}`));

  const planningRoot = join(repository, '.planning', 'phases');
  const phase1Dir = join(planningRoot, '01-planlegg-dagslinjen');
  const phase2Dir = join(planningRoot, '02-outfit-truth-antrekkskart');
  const phase3Dir = join(
    planningRoot,
    '03-living-home-signature-transition',
  );
  mkdirSync(phase1Dir, { recursive: true });
  mkdirSync(phase2Dir, { recursive: true });
  mkdirSync(phase3Dir, { recursive: true });
  writeFileSync(
    join(phase1Dir, '01-18-SUMMARY.md'),
    summary(['status: PASS', 'candidate_sha: ' + phase1]),
  );
  writeFileSync(
    join(phase2Dir, '02-09-SUMMARY.md'),
    summary([
      'status: PASS',
      'feature_flag: true',
      'phase2_candidate_sha: ' + phase2,
    ]),
  );
  phase3.forEach((sha, index) => {
    const plan = String(index + 1).padStart(2, '0');
    writeFileSync(
      join(phase3Dir, `03-${plan}-SUMMARY.md`),
      summary(['status: PASS', 'phase3_candidate_sha: ' + sha]),
    );
  });
  git(repository, ['add', '--', '.planning']);
  const candidate = commit(repository, 'phase 3 final candidate');
  git(repository, ['switch', '--quiet', '--detach', candidate]);
  return { root, repository, evidence, phase1, phase2, phase3, candidate };
}

function successfulMatrixSpawn(
  harness: Harness,
  calls: Array<{
    executable: string;
    args: string[];
    options: Record<string, unknown>;
  }>,
): Spawn {
  return ((executable: string, args: readonly string[], options: object) => {
    calls.push({
      executable,
      args: [...args],
      options: options as Record<string, unknown>,
    });
    if (executable === 'git') {
      return spawnSync(executable, [...args], options);
    }
    return {
      status: 0,
      signal: null,
      stdout: `PASS ${args.slice(1).join(' ')}\n`,
      stderr: '',
      pid: 1,
      output: [],
    };
  }) as Spawn;
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function filesystemIt(name: string, test: () => void): void {
  // 15 s holdt paa CI (ubuntu) men ikke paa Windows: hvert filsystem-
  // oppsett lager kataloger og starter ekte prosesser, og under full
  // suite (209 filer) sultet de. Malt 2026-08-06: 22,5 s her, ~2 s
  // isolert. Grensen folger vi.setConfig over.
  it(name, test, 60_000);
}

describe('Phase 3 final runner contracts', () => {
  filesystemIt('rejects missing, empty, relative, inside-checkout, and symlinked roots', () => {
    const harness = createHarness();
    for (const value of [undefined, '', 'relative/evidence']) {
      expect(() => resolveEvidenceLayout({
        environment: value === undefined
          ? {}
          : { BABYORA_PHASE3_EVIDENCE_ROOT: value },
        cwd: harness.repository,
      })).toThrow(/BABYORA_PHASE3_EVIDENCE_ROOT/u);
    }
    expect(() => resolveEvidenceLayout({
      environment: {
        BABYORA_PHASE3_EVIDENCE_ROOT: join(harness.repository, 'inside'),
      },
      cwd: harness.repository,
    })).toThrow(/outside/u);

    const inside = join(harness.repository, 'evidence-target');
    mkdirSync(inside);
    const linked = join(harness.root, 'evidence-link');
    symlinkSync(inside, linked, 'junction');
    expect(() => resolveEvidenceLayout({
      environment: { BABYORA_PHASE3_EVIDENCE_ROOT: linked },
      cwd: harness.repository,
    })).toThrow(/outside/u);
  });

  filesystemIt('constructs four distinct fixed paths beneath a spaced metacharacter root', () => {
    const harness = createHarness();
    const layout = resolveEvidenceLayout({
      environment: { BABYORA_PHASE3_EVIDENCE_ROOT: harness.evidence },
      cwd: harness.repository,
    });
    expect(Object.keys(layout.artifacts).sort()).toEqual(
      Object.keys(ARTIFACT_NAMES).sort(),
    );
    expect(new Set(Object.values(layout.artifacts)).size).toBe(4);
    for (const path of Object.values(layout.artifacts)) {
      expect(dirname(path)).toBe(layout.evidenceRoot);
    }
  });

  filesystemIt('rejects artifact symlink escape and stale review records before collection', () => {
    const harness = createHarness();
    const outsideTarget = join(harness.root, 'outside-validation');
    mkdirSync(outsideTarget);
    symlinkSync(
      outsideTarget,
      join(harness.evidence, ARTIFACT_NAMES.validationLog),
      'junction',
    );
    expect(() => resolveEvidenceLayout({
      environment: { BABYORA_PHASE3_EVIDENCE_ROOT: harness.evidence },
      cwd: harness.repository,
      artifactMode: 'collect',
    })).toThrow(/artifact|symlink|external evidence/u);

    rmSync(
      join(harness.evidence, ARTIFACT_NAMES.validationLog),
      { recursive: true },
    );
    writeFileSync(
      join(harness.evidence, ARTIFACT_NAMES.codeSecurityReview),
      '{"stale":true}\n',
      'utf8',
    );
    expect(() => resolveEvidenceLayout({
      environment: { BABYORA_PHASE3_EVIDENCE_ROOT: harness.evidence },
      cwd: harness.repository,
      artifactMode: 'collect',
    })).toThrow(/stale|empty/u);
  });

  filesystemIt('resolves only a validated absolute npm CLI JavaScript file', () => {
    const actual = resolveNpmCli({
      environment: process.env,
      execPath: process.execPath,
    });
    expect(actual).toMatch(/npm-cli\.(?:c?m?js)$/u);

    const harness = createHarness();
    const fakeNode = join(harness.root, 'fake-node.exe');
    writeFileSync(fakeNode, '');
    expect(() => resolveNpmCli({
      environment: { npm_execpath: 'npm.cmd' },
      execPath: fakeNode,
    })).toThrow(/npm CLI/u);
  });

  it('uses the exact ordered npm CLI argument arrays', () => {
    const npmCli = 'C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js';
    expect(createFinalCommandMatrix(npmCli).map(({ args }) => args)).toEqual([
      [npmCli, 'test'],
      [npmCli, 'run', 'lint'],
      [npmCli, 'run', 'build'],
      [npmCli, 'run', 'e2e'],
      [
        npmCli,
        'exec',
        '--',
        'tsx',
        'e2e/home-outfit-motion.ts',
        '--case',
        'all',
      ],
      [npmCli, 'exec', '--', 'tsc', '-b', '--pretty', 'false'],
    ]);
  });

  filesystemIt('collects shell-free output, stops on the first failure, and writes no candidate', () => {
    const harness = createHarness();
    const calls: Parameters<typeof successfulMatrixSpawn>[1] = [];
    let npmCalls = 0;
    const base = successfulMatrixSpawn(harness, calls);
    const failingSpawn = ((executable: string, args: string[], options: object) => {
      if (executable !== 'git' && ++npmCalls === 2) {
        calls.push({ executable, args: [...args], options: options as Record<string, unknown> });
        return { status: 9, signal: null, stdout: '', stderr: 'lint failed\n', pid: 1, output: [] };
      }
      return base(executable, args, options);
    }) as Spawn;

    expect(() => runPhase3Final(['collect'], {
      cwd: harness.repository,
      environment: {
        BABYORA_PHASE3_EVIDENCE_ROOT: harness.evidence,
      },
      spawnSyncImpl: failingSpawn,
    })).toThrow(/lint failed|status 9/u);
    expect(npmCalls).toBe(2);
    expect(() => readFileSync(
      join(harness.evidence, ARTIFACT_NAMES.candidate),
      'utf8',
    )).toThrow();
    expect(readFileSync(
      join(harness.evidence, ARTIFACT_NAMES.validationLog),
      'utf8',
    )).toContain('lint failed');
    expect(calls.every(({ options }) => options.shell === false)).toBe(true);
  });

  filesystemIt('collects a detached clean candidate and hashes the completed external log', () => {
    const harness = createHarness();
    const calls: Parameters<typeof successfulMatrixSpawn>[1] = [];
    const result = runPhase3Final(['collect'], {
      cwd: harness.repository,
      environment: {
        BABYORA_PHASE3_EVIDENCE_ROOT: harness.evidence,
      },
      spawnSyncImpl: successfulMatrixSpawn(harness, calls),
    });
    const log = readFileSync(
      join(harness.evidence, ARTIFACT_NAMES.validationLog),
    );
    const candidate = JSON.parse(readFileSync(
      join(harness.evidence, ARTIFACT_NAMES.candidate),
      'utf8',
    )) as Record<string, unknown>;
    expect(result).toMatchObject({ status: 'PASS', mode: 'collect' });
    expect(candidate).toEqual({
      phase3_candidate_sha: harness.candidate,
      ancestry_status: 'PASS',
      clean_status: 'PASS',
      validation_evidence_sha256: createHash('sha256')
        .update(log)
        .digest('hex'),
    });
    const npmCalls = calls.filter(({ executable }) => executable === process.execPath);
    expect(npmCalls).toHaveLength(6);
    expect(calls.every(({ options }) => options.shell === false)).toBe(true);
  });

  it('verify passes separate external records and all nine dependencies as arguments', () => {
    const harness = createHarness();
    for (const name of Object.values(ARTIFACT_NAMES)) {
      writeFileSync(join(harness.evidence, name), '{}\n');
    }
    const calls: Parameters<typeof successfulMatrixSpawn>[1] = [];
    const spawn = successfulMatrixSpawn(harness, calls);
    runPhase3Final(['verify'], {
      cwd: harness.repository,
      environment: {
        BABYORA_PHASE3_EVIDENCE_ROOT: harness.evidence,
      },
      spawnSyncImpl: spawn,
    });
    const exact = calls.find(({ executable, args }) => (
      executable === process.execPath
      && args.some((argument) => argument.endsWith('verify-phase3-exact-sha.mjs'))
    ));
    expect(exact).toBeDefined();
    expect(exact?.args).toContain('--candidate-record');
    expect(exact?.args).toContain('--code-security-review');
    expect(exact?.args).toContain('--ui-accessibility-review');
    expect(exact?.args.filter((value) => value === '--dependency')).toHaveLength(8);
    expect(exact?.args).toContain('9');
    for (const artifact of Object.values(ARTIFACT_NAMES)) {
      expect(exact?.args).toContain(join(harness.evidence, artifact));
    }
    expect(exact?.args.some((argument) => (
      argument.includes('--candidate-record ')
      || argument.includes(`"${harness.evidence}"`)
    ))).toBe(false);
    expect(exact?.options.shell).toBe(false);
  });

  it('really executes npm CLI through Node from spaced metacharacter paths', () => {
    const harness = createHarness();
    const npmCli = resolveNpmCli({
      environment: process.env,
      execPath: process.execPath,
    });
    const result = spawnSync(process.execPath, [npmCli, '--version'], {
      cwd: harness.repository,
      encoding: 'utf8',
      shell: false,
      windowsHide: true,
    });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+(?:[-+].*)?$/u);
    const logPath = join(harness.evidence, ARTIFACT_NAMES.validationLog);
    writeFileSync(logPath, result.stdout, 'utf8');
    expect(readFileSync(logPath, 'utf8')).toBe(result.stdout);
  });
});
