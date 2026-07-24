import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildCandidateRecord,
  buildReviewReceipt,
  canonicalReviewJsonFile,
  markReviewCyclesExhausted,
  validateReviewRecords,
  type CandidateSnapshot,
  type CandidateTuple,
  type IndependentReviewReceipt,
  type ReviewIdentity,
  type ReviewLane,
} from '../review-gate';
import * as reviewGate from '../review-gate';
import { afterEach, describe, expect, it } from 'vitest';

const sha256 = (value: string) =>
  createHash('sha256').update(value, 'utf8').digest('hex');
const temporaryPaths: string[] = [];

afterEach(() => {
  for (const path of temporaryPaths.splice(0)) {
    rmSync(path, { recursive: true, force: true });
  }
});

const snapshot: CandidateSnapshot = {
  changedPaths: [
    'src/data/snart/climate-1991-2020-v1.json',
    'scripts/snart/build-climate-pack.ts',
  ],
  clean: true,
  contractPath:
    '.planning/phases/01-planlegg-dagslinjen/01-SNART-AUTONOMY-CONTRACT.json',
  contractSha256: '1'.repeat(64),
  gitSha: '2'.repeat(40),
  packPath: 'src/data/snart/climate-1991-2020-v1.json',
  packSha256: '3'.repeat(64),
  treeSha: '4'.repeat(40),
  worktreePath: 'C:/repo',
};

const reviewerA: ReviewIdentity = {
  agentId: 'review-agent-a',
  canonicalTaskName: '/root/snart_01_13_review_a_attempt_1',
};

const reviewerB: ReviewIdentity = {
  agentId: 'review-agent-b',
  canonicalTaskName: '/root/snart_01_13_review_b_attempt_1',
};

const candidate = () =>
  buildCandidateRecord({
    attempt: 1,
    planId: '01-13',
    snapshot,
  });

function receipt(
  lane: ReviewLane,
  tuple: CandidateTuple,
  reviewer: ReviewIdentity,
  overrides: Partial<IndependentReviewReceipt> = {},
) {
  return buildReviewReceipt(
    {
      schemaVersion: 'babyora-independent-review-receipt@2',
      planId: '01-13',
      lane,
      attempt: 1,
      candidate: tuple,
      reviewer,
      signedByIdentity: reviewer,
      verdict: 'PASS',
      findings: [],
      commands: [
        {
          command: `npm run independent-review-${lane.toLowerCase()}`,
          exitCode: 0,
        },
      ],
      cleanBefore: true,
      cleanAfter: true,
      ...overrides,
    },
    candidate(),
  );
}

describe('Snart immutable review candidate', () => {
  it('binds actual Git, artifact and canonical evidence hashes without identity provenance', () => {
    const record = candidate();

    expect(record).toMatchObject({
      schemaVersion: 'snart-review-candidate@1',
      planId: '01-13',
      attempt: 1,
      gateStatus: 'PENDING_REVIEW',
      provenanceAuthenticated: false,
      localReceiptsAreNotCryptographicProvenance: true,
      candidate: {
        gitSha: snapshot.gitSha,
        treeSha: snapshot.treeSha,
        contractSha256: snapshot.contractSha256,
        packSha256: snapshot.packSha256,
      },
      repository: {
        clean: true,
        changedPaths: [...snapshot.changedPaths].sort(),
      },
    });
    expect('implementer' in record).toBe(false);
    expect(record.candidate.evidenceSha256).toBe(
      sha256(
        canonicalReviewJsonFile({
          changedPaths: [...snapshot.changedPaths].sort(),
          contractPath: snapshot.contractPath,
          contractSha256: snapshot.contractSha256,
          gitSha: snapshot.gitSha,
          packPath: snapshot.packPath,
          packSha256: snapshot.packSha256,
          planId: '01-13',
          treeSha: snapshot.treeSha,
        }),
      ),
    );
  });

  it('requires a clean snapshot, bounds attempts and records terminal exhaustion at attempt three', () => {
    expect(() =>
      buildCandidateRecord({
        attempt: 1,
        planId: '01-13',
        snapshot: { ...snapshot, clean: false },
      }),
    ).toThrow(/clean|worktree/iu);
    expect(() =>
      buildCandidateRecord({
        attempt: 0,
        planId: '01-13',
        snapshot,
      }),
    ).toThrow(/attempt/iu);
    expect(() =>
      buildCandidateRecord({
        attempt: 4,
        planId: '01-13',
        snapshot,
      }),
    ).toThrow(/attempt/iu);
    expect(() => markReviewCyclesExhausted(candidate())).toThrow(/third/iu);

    const thirdAttempt = buildCandidateRecord({
      attempt: 3,
      planId: '01-13',
      snapshot,
    });
    expect(markReviewCyclesExhausted(thirdAttempt)).toMatchObject({
      attempt: 3,
      gateStatus: 'FAIL_REVIEW_CYCLES_EXHAUSTED',
      provenanceAuthenticated: false,
    });
  });

  it('accepts only the literal canonical evidence directory and excludes only the three plan evidence files', () => {
    type EvidenceDirectoryGuard = (
      repositoryRoot: string,
      evidenceDir: string,
    ) => string;
    type EvidencePathGuard = (path: string, planId: string) => boolean;
    const validateEvidenceDirectory = Reflect.get(
      reviewGate,
      'validateEvidenceDirectory',
    ) as EvidenceDirectoryGuard | undefined;
    const isPlanEvidencePath = Reflect.get(
      reviewGate,
      'isPlanEvidencePath',
    ) as EvidencePathGuard | undefined;
    expect(typeof validateEvidenceDirectory).toBe('function');
    expect(typeof isPlanEvidencePath).toBe('function');
    if (!validateEvidenceDirectory || !isPlanEvidencePath) return;

    const canonical =
      '.planning/phases/01-planlegg-dagslinjen/evidence';
    expect(validateEvidenceDirectory(process.cwd(), canonical)).toBe(
      canonical,
    );
    for (const alias of [
      `./${canonical}`,
      canonical.replaceAll('/', '\\'),
      `${canonical}/.`,
      '.planning/phases/01-planlegg-dagslinjen/../01-planlegg-dagslinjen/evidence',
      join(process.cwd(), canonical),
    ]) {
      expect(() =>
        validateEvidenceDirectory(process.cwd(), alias),
      ).toThrow(/canonical|evidence|literal/iu);
    }

    const evidencePrefix = `${canonical}/01-13`;
    expect(
      [
        `${evidencePrefix}-candidate.json`,
        `${evidencePrefix}-review-a.json`,
        `${evidencePrefix}-review-b.json`,
      ].every((path) => isPlanEvidencePath(path, '01-13')),
    ).toBe(true);
    for (const unrelated of [
      `${evidencePrefix}-candidate.json.tmp`,
      `${canonical}/01-14-candidate.json`,
      `${canonical}/nested/01-13-review-a.json`,
      `${canonical}/unrelated.json`,
    ]) {
      expect(isPlanEvidencePath(unrelated, '01-13')).toBe(false);
    }

    const repositoryRoot = mkdtempSync(join(tmpdir(), 'snart-evidence-'));
    temporaryPaths.push(repositoryRoot);
    const evidenceParent = join(
      repositoryRoot,
      '.planning',
      'phases',
      '01-planlegg-dagslinjen',
    );
    const linkTarget = join(repositoryRoot, 'real-evidence');
    mkdirSync(evidenceParent, { recursive: true });
    mkdirSync(linkTarget, { recursive: true });
    symlinkSync(
      linkTarget,
      join(evidenceParent, 'evidence'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    expect(() =>
      validateEvidenceDirectory(repositoryRoot, canonical),
    ).toThrow(/junction|link|canonical/iu);
  });
});

describe('Snart independent review receipts', () => {
  it('accepts the compact consistency-only receipt and exact reviewer signature identity', () => {
    const record = candidate();
    const result = receipt('A', record.candidate, reviewerA);

    expect(result).toEqual({
      schemaVersion: 'babyora-independent-review-receipt@2',
      planId: '01-13',
      lane: 'A',
      attempt: 1,
      candidate: record.candidate,
      reviewer: reviewerA,
      signedByIdentity: reviewerA,
      verdict: 'PASS',
      findings: [],
      commands: [
        {
          command: 'npm run independent-review-a',
          exitCode: 0,
        },
      ],
      cleanBefore: true,
      cleanAfter: true,
    });
    expect('spawnRequest' in result).toBe(false);
    expect('transcriptSha256' in result).toBe(false);
    expect('finalAnswerSha256' in result).toBe(false);
  });

  it('rejects mismatched signatures, malformed tuples and empty command evidence', () => {
    const record = candidate();

    expect(() =>
      receipt('A', record.candidate, reviewerA, {
        signedByIdentity: reviewerB,
      }),
    ).toThrow(/identity|signature/iu);
    expect(() =>
      receipt('A', record.candidate, reviewerA, {
        candidate: {
          ...record.candidate,
          packSha256: '9'.repeat(64),
        },
      }),
    ).toThrow(/candidate|tuple/iu);
    expect(() =>
      receipt('A', record.candidate, reviewerA, {
        commands: [],
      }),
    ).toThrow(/command/iu);
  });
});

describe('Snart two-lane review gate', () => {
  it('accepts two distinct PASS reviewers on the unchanged clean candidate', () => {
    const record = candidate();
    const result = validateReviewRecords({
      candidate: record,
      receiptA: receipt('A', record.candidate, reviewerA),
      receiptB: receipt('B', record.candidate, reviewerB),
      snapshot,
    });

    expect(result).toEqual({
      attempt: 1,
      gateStatus: 'PASS',
      localReceiptsAreNotCryptographicProvenance: true,
      planId: '01-13',
      provenanceAuthenticated: false,
      reviewerAgentIds: ['review-agent-a', 'review-agent-b'],
      reviewerCanonicalTaskNames: [
        '/root/snart_01_13_review_a_attempt_1',
        '/root/snart_01_13_review_b_attempt_1',
      ],
      valid: true,
    });
  });

  it('allows resolved findings but rejects any unresolved finding regardless of severity', () => {
    const record = candidate();
    const resolved = receipt('A', record.candidate, reviewerA, {
      findings: [
        {
          severity: 'low',
          code: 'DOCUMENTED_OBSERVATION',
          message: 'Checked and resolved before the receipt was signed.',
          resolved: true,
        },
      ],
    });

    expect(
      validateReviewRecords({
        candidate: record,
        receiptA: resolved,
        receiptB: receipt('B', record.candidate, reviewerB),
        snapshot,
      }).valid,
    ).toBe(true);

    expect(() =>
      validateReviewRecords({
        candidate: record,
        receiptA: resolved,
        receiptB: receipt('B', record.candidate, reviewerB, {
          findings: [
            {
              severity: 'info',
              code: 'UNRESOLVED_TRUTH_GAP',
              message: 'Even informational unresolved findings fail closed.',
              resolved: false,
            },
          ],
        }),
        snapshot,
      }),
    ).toThrow(/unresolved|finding/iu);
  });

  it('fails closed on duplicate identities, FAIL, non-zero commands or dirty review state', () => {
    const record = candidate();
    const receiptA = receipt('A', record.candidate, reviewerA);
    const invalidBReceipts = [
      receipt('B', record.candidate, {
        ...reviewerB,
        agentId: reviewerA.agentId,
      }),
      receipt('B', record.candidate, {
        ...reviewerB,
        canonicalTaskName: reviewerA.canonicalTaskName,
      }),
      receipt('B', record.candidate, reviewerB, {
        verdict: 'FAIL',
      }),
      receipt('B', record.candidate, reviewerB, {
        commands: [{ command: 'npm test', exitCode: 1 }],
      }),
      receipt('B', record.candidate, reviewerB, {
        cleanAfter: false,
      }),
    ];

    for (const receiptB of invalidBReceipts) {
      expect(() =>
        validateReviewRecords({
          candidate: record,
          receiptA,
          receiptB,
          snapshot,
        }),
      ).toThrow();
    }
  });

  it('recomputes the local candidate tuple and rejects code or artifact tampering', () => {
    const record = candidate();
    const receiptA = receipt('A', record.candidate, reviewerA);
    const receiptB = receipt('B', record.candidate, reviewerB);

    for (const changedSnapshot of [
      { ...snapshot, clean: false },
      { ...snapshot, gitSha: '9'.repeat(40) },
      { ...snapshot, packSha256: '8'.repeat(64) },
      {
        ...snapshot,
        changedPaths: [...snapshot.changedPaths, 'unexpected-change.ts'],
      },
    ]) {
      expect(() =>
        validateReviewRecords({
          candidate: record,
          receiptA,
          receiptB,
          snapshot: changedSnapshot,
        }),
      ).toThrow();
    }
  });
});
