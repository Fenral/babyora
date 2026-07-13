/**
 * useTooltipSeen — verifiserer at sessionStorage-state synker mellom hook-
 * instanser med samme key. Vitest kjører i node-miljø, så vi tester
 * lese/skrive-funksjoner via render-to-static-markup-pattern hvor mulig +
 * direkte sessionStorage-assertion.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { useTooltipSeen } from '../useTooltipSeen.js';

// Mock sessionStorage for node-miljø
class MockSessionStorage {
  private store: Record<string, string> = {};
  getItem(k: string): string | null { return this.store[k] ?? null; }
  setItem(k: string, v: string): void { this.store[k] = v; }
  clear(): void { this.store = {}; }
}

const mockStorage = new MockSessionStorage();

beforeEach(() => {
  mockStorage.clear();
  (globalThis as unknown as { window: unknown }).window = {
    sessionStorage: mockStorage,
  };
});

describe('useTooltipSeen', () => {
  it('default-state er false når sessionStorage er tom', () => {
    function Probe() {
      const [seen] = useTooltipSeen('test-key');
      return <span data-seen={seen ? '1' : '0'} />;
    }
    const html = renderToStaticMarkup(<Probe />);
    expect(html).toMatch(/data-seen="0"/);
  });

  it('returnerer true når sessionStorage har key=1', () => {
    mockStorage.setItem('babyora:tooltip-seen:my-key', '1');
    function Probe() {
      const [seen] = useTooltipSeen('my-key');
      return <span data-seen={seen ? '1' : '0'} />;
    }
    const html = renderToStaticMarkup(<Probe />);
    expect(html).toMatch(/data-seen="1"/);
  });

  it('skiller mellom forskjellige keys', () => {
    mockStorage.setItem('babyora:tooltip-seen:key-a', '1');
    function Probe() {
      const [seenA] = useTooltipSeen('key-a');
      const [seenB] = useTooltipSeen('key-b');
      return <span data-a={seenA ? '1' : '0'} data-b={seenB ? '1' : '0'} />;
    }
    const html = renderToStaticMarkup(<Probe />);
    expect(html).toMatch(/data-a="1"/);
    expect(html).toMatch(/data-b="0"/);
  });
});
