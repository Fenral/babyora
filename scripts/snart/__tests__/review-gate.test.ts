import { createHash } from 'node:crypto';
import {
  buildCandidateRecord,
  buildReviewReceipt,
  canonicalReviewJsonFile,
  validateReviewRecords,
  type CandidateSnapshot,
  type ReviewLane,
  type ReviewReceiptInput,
} from '../review-gate';
import { describe, expect, it } from 'vitest';

const sha256 = (value: string) =>
  createHash('sha256').update(value, 'utf8').digest('hex');

const implementer = {
  agentId: 'executor-agent-01-13',
  canonicalTaskName: '/root/run_phase1_plan13',
};

const snapshot: CandidateSnapshot = {
  changedPaths: [
    'scripts/snart/build-climate-pack.ts',
    'src/data/snart/climate-1991-2020-v1.json',
  ],
  clean: true,
  contractPath:
    '.planning/phases/01-planlegg-dagslinjen/01-SNART-AUTONOMY-CONTRACT.json',
  contractSha256: '1'.repeat(64),
  gitSha: '2'.repeat(40),
  manifestPath: 'src/data/snart/climate-1991-2020-v1.manifest.json',
  manifestSha256: '3'.repeat(64),
  packPath: 'src/data/snart/climate-1991-2020-v1.json',
  packSha256: '4'.repeat(64),
  treeSha: '5'.repeat(40),
  worktreePath: 'C:/repo',
};

function resultPayload(
  lane: ReviewLane,
  candidate: ReturnType<typeof buildCandidateRecord>,
  overrides: Record<string, unknown> = {},
) {
  return JSON.stringify({
    schemaVersion: 'snart-review-result@1',
    planId: '01-13',
    lane,
    attempt: 1,
    candidate: candidate.candidate,
    verdict: 'PASS',
    findings: [],
    ...overrides,
  });
}

function receiptInput(
  lane: ReviewLane,
  candidate: ReturnType<typeof buildCandidateRecord>,
  reviewerId: string,
  reviewerTaskName: string,
  payload = resultPayload(lane, candidate),
): ReviewReceiptInput {
  const laneKey = lane.toLowerCase();
  return {
    candidate,
    implementer,
    spawnRequest: {
      agent_type:
        lane === 'A' ? 'gsd-code-reviewer' : 'gsd-security-auditor',
      fork_turns: 'none',
      task_name: `snart_01_13_review_${laneKey}_attempt_1`,
      message: `READ ONLY lane ${lane}`,
    },
    spawnResult: {
      agentId: reviewerId,
      canonicalTaskName: reviewerTaskName,
    },
    finalEvent: {
      messageType: 'FINAL_ANSWER',
      agentId: reviewerId,
      canonicalTaskName: reviewerTaskName,
      payload,
    },
  };
}

describe('Snart immutable review candidate', () => {
  it('requires the same non-empty executor identity from CLI and stdin', () => {
    expect(() =>
      buildCandidateRecord({
        attempt: 1,
        cliIdentity: implementer,
        executorIdentity: { ...implementer, agentId: 'different' },
        planId: '01-13',
        snapshot,
      }),
    ).toThrow(/identity/iu);

    expect(() =>
      buildCandidateRecord({
        attempt: 1,
        cliIdentity: { agentId: '', canonicalTaskName: '' },
        executorIdentity: { agentId: '', canonicalTaskName: '' },
        planId: '01-13',
        snapshot,
      }),
    ).toThrow(/identity/iu);
  });

  it('binds actual Git, artifact and canonical evidence hashes without a provenance claim', () => {
    const candidate = buildCandidateRecord({
      attempt: 1,
      cliIdentity: implementer,
      executorIdentity: implementer,
      planId: '01-13',
      snapshot,
    });

    expect(candidate).toMatchObject({
      schemaVersion: 'snart-review-candidate@1',
      planId: '01-13',
      attempt: 1,
      gateStatus: 'PENDING_REVIEW',
      implementer,
      provenanceAuthenticated: false,
      localConsistencyOnly: true,
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
    expect(candidate.candidate.evidenceSha256).toMatch(/^[a-f0-9]{64}$/u);
    expect(candidate.candidate.evidenceSha256).toBe(
      sha256(
        canonicalReviewJsonFile({
          changedPaths: [...snapshot.changedPaths].sort(),
          contractPath: snapshot.contractPath,
          contractSha256: snapshot.contractSha256,
          gitSha: snapshot.gitSha,
          manifestPath: snapshot.manifestPath,
          manifestSha256: snapshot.manifestSha256,
          packPath: snapshot.packPath,
          packSha256: snapshot.packSha256,
          treeSha: snapshot.treeSha,
        }),
      ),
    );
    expect(() =>
      buildCandidateRecord({
        attempt: 4,
        cliIdentity: implementer,
        executorIdentity: implementer,
        planId: '01-13',
        snapshot,
      }),
    ).toThrow(/attempt/iu);
  });
});

describe('Snart collaboration receipts', () => {
  it('stores only the message hash and binds exact FINAL_ANSWER/transcript bytes', () => {
    const candidate = buildCandidateRecord({
      attempt: 1,
      cliIdentity: implementer,
      executorIdentity: implementer,
      planId: '01-13',
      snapshot,
    });
    const input = receiptInput(
      'A',
      candidate,
      'review-agent-a',
      '/root/snart_01_13_review_a_attempt_1',
    );
    const receipt = buildReviewReceipt(input, 'A');

    expect(receipt).toMatchObject({
      schemaVersion: 'codex-collaboration-review-receipt@1',
      planId: '01-13',
      lane: 'A',
      attempt: 1,
      implementer,
      candidate: candidate.candidate,
      spawnRequest: {
        agent_type: 'gsd-code-reviewer',
        fork_turns: 'none',
        task_name: 'snart_01_13_review_a_attempt_1',
        messageSha256: sha256(input.spawnRequest.message),
      },
    });
    expect('message' in receipt.spawnRequest).toBe(false);
    expect(receipt.finalAnswerSha256).toBe(
      sha256(input.finalEvent.payload),
    );
    expect(receipt.transcriptSha256).toBe(
      sha256(
        canonicalReviewJsonFile({
          finalEvent: receipt.finalEvent,
          spawnRequest: receipt.spawnRequest,
          spawnResult: receipt.spawnResult,
        }),
      ),
    );
  });

  it('rejects fork inheritance, mismatched tool identities and malformed result tuples', () => {
    const candidate = buildCandidateRecord({
      attempt: 1,
      cliIdentity: implementer,
      executorIdentity: implementer,
      planId: '01-13',
      snapshot,
    });
    const inherited = receiptInput(
      'A',
      candidate,
      'review-agent-a',
      '/root/snart_01_13_review_a_attempt_1',
    );
    inherited.spawnRequest.fork_turns = 'all';
    expect(() => buildReviewReceipt(inherited, 'A')).toThrow(/fork_turns/iu);

    const identityMismatch = receiptInput(
      'A',
      candidate,
      'review-agent-a',
      '/root/snart_01_13_review_a_attempt_1',
    );
    identityMismatch.finalEvent.agentId = 'different';
    expect(() => buildReviewReceipt(identityMismatch, 'A')).toThrow(
      /identity/iu,
    );

    const tupleMismatch = receiptInput(
      'A',
      candidate,
      'review-agent-a',
      '/root/snart_01_13_review_a_attempt_1',
      resultPayload('A', candidate, {
        candidate: {
          ...candidate.candidate,
          packSha256: '9'.repeat(64),
        },
      }),
    );
    expect(() => buildReviewReceipt(tupleMismatch, 'A')).toThrow(
      /candidate/iu,
    );
  });
});

describe('Snart two-lane review gate', () => {
  it('accepts only two distinct PASS reviewers on the unchanged clean candidate', () => {
    const candidate = buildCandidateRecord({
      attempt: 1,
      cliIdentity: implementer,
      executorIdentity: implementer,
      planId: '01-13',
      snapshot,
    });
    const receiptA = buildReviewReceipt(
      receiptInput(
        'A',
        candidate,
        'review-agent-a',
        '/root/snart_01_13_review_a_attempt_1',
      ),
      'A',
    );
    const receiptB = buildReviewReceipt(
      receiptInput(
        'B',
        candidate,
        'review-agent-b',
        '/root/snart_01_13_review_b_attempt_1',
      ),
      'B',
    );

    expect(
      validateReviewRecords({
        candidate,
        implementerAgentId: implementer.agentId,
        receiptA,
        receiptB,
        snapshot,
      }),
    ).toEqual({
      attempt: 1,
      gateStatus: 'PASS',
      localConsistencyOnly: true,
      planId: '01-13',
      provenanceAuthenticated: false,
      reviewerAgentIds: ['review-agent-a', 'review-agent-b'],
      valid: true,
    });
  });

  it('fails closed on duplicate/implementer reviewers, blocker findings, tampering or dirty code', () => {
    const candidate = buildCandidateRecord({
      attempt: 1,
      cliIdentity: implementer,
      executorIdentity: implementer,
      planId: '01-13',
      snapshot,
    });
    const receiptA = buildReviewReceipt(
      receiptInput(
        'A',
        candidate,
        'review-agent-a',
        '/root/snart_01_13_review_a_attempt_1',
      ),
      'A',
    );
    const makeB = (reviewerId = 'review-agent-b', payload?: string) =>
      buildReviewReceipt(
        receiptInput(
          'B',
          candidate,
          reviewerId,
          '/root/snart_01_13_review_b_attempt_1',
          payload ?? resultPayload('B', candidate),
        ),
        'B',
      );

    for (const receiptB of [
      makeB('review-agent-a'),
      makeB(implementer.agentId),
      makeB(
        'review-agent-b',
        resultPayload('B', candidate, {
          findings: [
            {
              code: 'BLOCKING_DATA_ERROR',
              message: 'The pack is not safe to publish.',
              severity: 'blocker',
            },
          ],
        }),
      ),
    ]) {
      expect(() =>
        validateReviewRecords({
          candidate,
          implementerAgentId: implementer.agentId,
          receiptA,
          receiptB,
          snapshot,
        }),
      ).toThrow();
    }

    expect(() =>
      validateReviewRecords({
        candidate,
        implementerAgentId: implementer.agentId,
        receiptA,
        receiptB: makeB(),
        snapshot: { ...snapshot, clean: false },
      }),
    ).toThrow(/clean|worktree/iu);
    expect(() =>
      validateReviewRecords({
        candidate,
        implementerAgentId: implementer.agentId,
        receiptA,
        receiptB: { ...makeB(), finalAnswerSha256: '0'.repeat(64) },
        snapshot,
      }),
    ).toThrow(/digest|hash/iu);
  });
});
