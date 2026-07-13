import { describe, expect, it } from 'vitest';
import { buildAnalysisPrompt } from './prompt';
import type { CaptureManifest } from './types';

const emptyManifest: CaptureManifest = {
  runId: 'test', rubricVersion: '1.0.0', baseUrl: 'http://localhost',
  viewport: { width: 390, height: 844 }, locale: 'nb-NO', createdAt: '2026-07-12T00:00:00.000Z', captures: [],
};

describe('analysis prompt', () => {
  it('states product principle and evidence boundary', () => {
    const prompt = buildAnalysisPrompt({ manifest: emptyManifest });
    expect(prompt).toContain('Gratis = i dag hjemme');
    expect(prompt).toContain('inspirasjon, ikke fasit');
    expect(prompt).toContain('ekspertinferens');
  });

  it('forbids generic and manipulative advice', () => {
    const prompt = buildAnalysisPrompt({ manifest: emptyManifest });
    expect(prompt).toContain('fake urgency');
    expect(prompt).toContain('generiske');
  });
});
