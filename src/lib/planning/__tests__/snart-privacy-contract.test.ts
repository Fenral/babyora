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
});
