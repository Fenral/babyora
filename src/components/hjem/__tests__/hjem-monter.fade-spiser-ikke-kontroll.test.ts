import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const CSS = readFileSync(
  resolve(process.cwd(), 'src/components/hjem/hjem-monter.css'),
  'utf8',
).replace(/\r\n/gu, '\n');

function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return CSS.match(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`, 'u'))?.[1] ?? '';
}

describe('resultatet lar siden eie den vertikale scrollen', () => {
  it('klipper eller masker ikke innhold som ligger under folden', () => {
    const body = rule(".hjm-result[data-scrollable='true']");
    expect(body).toContain('overflow: visible');
    expect(body).toContain('padding-bottom: 0');
    expect(body).not.toMatch(/(?:-webkit-)?mask-image:/u);
  });

  it('beholder én vertikal side-scroller', () => {
    expect(rule('.hjem-monter')).toContain('overflow: hidden auto');
  });

  it('holder plaggskinnen horisontal uten å fange vertikale sveip', () => {
    const rail = rule('.hjm-journey-rail');
    expect(rail).toContain('overflow-x: auto');
    expect(rail).toContain('overflow-y: hidden');
    expect(rail).toContain('touch-action: pan-x pan-y');
  });
});
