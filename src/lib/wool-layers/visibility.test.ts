import { describe, it, expect } from 'vitest';
import { hideIntuitiveItems } from './visibility.js';

describe('hideIntuitiveItems', () => {
  it('fjerner bleie fra blandet items-array', () => {
    expect(hideIntuitiveItems(['bleie', 'kortermet body'])).toEqual(['kortermet body']);
  });

  it('beholder alle andre items urørt', () => {
    expect(hideIntuitiveItems(['kortermet body', 'tynn pyjamas'])).toEqual([
      'kortermet body',
      'tynn pyjamas',
    ]);
  });

  it('returnerer tom array hvis bleie er eneste item', () => {
    expect(hideIntuitiveItems(['bleie'])).toEqual([]);
  });

  it('håndterer tom input', () => {
    expect(hideIntuitiveItems([])).toEqual([]);
  });

  it('bevarer rekkefølge på resterende items', () => {
    expect(hideIntuitiveItems(['kortermet body', 'bleie', 'sovepose 1.0 TOG'])).toEqual([
      'kortermet body',
      'sovepose 1.0 TOG',
    ]);
  });
});
