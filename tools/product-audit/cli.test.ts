import { describe, expect, it } from 'vitest';
import { parseArgs } from './cli';

describe('audit CLI', () => {
  it('supports prepare and finalize', () => {
    expect(parseArgs(['prepare']).command).toBe('prepare');
    expect(parseArgs(['finalize', '--run', 'abc']).run).toBe('abc');
  });

  it('parses a local base URL', () => {
    expect(parseArgs(['prepare', '--base-url', 'http://127.0.0.1:5173']).baseUrl).toBe('http://127.0.0.1:5173');
  });

  it('rejects mutation commands', () => {
    expect(() => parseArgs(['apply'])).toThrow(/prepare|finalize/i);
  });
});
