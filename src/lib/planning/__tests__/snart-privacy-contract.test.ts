import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Snart privacy contract', () => {
  it('has no persistence, transport, telemetry, history, or identity boundary', () => {
    const files = ['../snart-session.ts', '../../../components/planning/SnartPlan.tsx'];
    for (const file of files) {
      const source = readFileSync(new URL(file, import.meta.url), 'utf8');
      expect(source).not.toMatch(/localStorage|sessionStorage|indexedDB|CacheStorage|fetch\s*\(|XMLHttpRequest|WebSocket|supabase|posthog|analytics|tracing|console\.|history|location\.href|childId|birthLocalDate|actionTimestamp/iu);
    }
  });

  it('keeps the retired Snart session detached from Planlegg', async () => {
    const sessionSource = readFileSync(
      new URL('../snart-session.ts', import.meta.url),
      'utf8',
    );
    const ukeSource = (
      await import('../../../screens/UkeScreen.tsx?raw') as { default: string }
    ).default;

    expect(sessionSource).not.toMatch(
      /automaticPlace|effectivePlace|cacheScope|childId|birthLocalDate|actionTimestamp/iu,
    );
    expect(ukeSource).not.toMatch(
      /SnartPlan|resolveCommittedSnartHome|lookupClimateProfile|createSnartSessionEvaluator/u,
    );
  });
});
