/**
 * R7 Task 5 — handlingssetninger for endringsmarkører.
 * A11y-lead krav 2: handlingen må kunne gjenskapes fra TEKST alene — setningen
 * navngir verbet («Ta på …» / «Ta av …»), ikonet er dekorativt.
 */
import { describe, expect, it } from 'vitest';
import { changeActionSentence } from '../change-sentence.js';

describe('changeActionSentence', () => {
  it('add → «Ta på …» med plaggene', () => {
    expect(changeActionSentence({ hour: 16, kind: 'add', garments: ['kjøredress'] }))
      .toBe('Ta på kjøredress');
  });

  it('remove → «Ta av …»', () => {
    expect(changeActionSentence({ hour: 12, kind: 'remove', garments: ['kjøredress'] }))
      .toBe('Ta av kjøredress');
  });

  it('rain → navngir regnbeskyttelse eksplisitt', () => {
    expect(changeActionSentence({ hour: 15, kind: 'rain', garments: ['regntrekk på vognen'] }))
      .toBe('Ta på regntrekk på vognen');
  });

  it('swap med plagg → «Bytt til …»', () => {
    expect(changeActionSentence({ hour: 14, kind: 'swap', garments: ['fleecesett', 'ullsett'] }))
      .toMatch(/^Bytt/);
  });

  it('swap uten synlige plagg → generisk, men fortsatt tekstlig handling', () => {
    const s = changeActionSentence({ hour: 14, kind: 'swap', garments: [] });
    expect(s.length).toBeGreaterThan(0);
    expect(s).not.toMatch(/^\s*$/);
  });

  it('location → «Nytt sted»', () => {
    expect(changeActionSentence({ hour: 10, kind: 'location', garments: [] })).toMatch(/sted/i);
  });

  it('lister maks tre plagg og angir «+N til» for resten', () => {
    const s = changeActionSentence({ hour: 8, kind: 'add', garments: ['a', 'b', 'c', 'd', 'e'] });
    expect(s).toContain('a, b, c');
    expect(s).toMatch(/\+2 til/);
  });
});
