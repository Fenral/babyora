import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const CSS = readFileSync(
  resolve(__dirname, '../hjem-monter.css'),
  'utf8',
).replace(/\r\n/gu, '\n');

function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return CSS.match(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`, 'u'))?.[1] ?? '';
}

describe('HjemMonter resultatrytme', () => {
  it('reserverer ikke et helt instrumentpanel når maskoten er borte', () => {
    expect(rule(".hjm-panel-slot[data-with-mascot='false']")).toContain('min-height: 0');
  });

  it('beholder én rolig gruppeavstand frem til antrekket', () => {
    expect(rule(".hjm-panel-slot[data-with-mascot='false'] + .hjm-body"))
      .toContain('padding-top: var(--dw-space-24)');
  });
});
